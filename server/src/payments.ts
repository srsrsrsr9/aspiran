import { type Env, bad, json } from "./shared";
import { bump, ensureSchema, flags, getSetting } from "./staff";
import { logEvent } from "./metrics";
import { grant } from "./plus";

/**
 * Real payments for Plus on the web: Cashfree, one-time, a year of Plus. Behind the "plus" flag. No Play Billing.
 *
 * The flow: the app asks for an order (POST /plus/pay/order); the server works out the price, creates the order with
 * Cashfree and returns its payment session; the page opens Cashfree's checkout; Cashfree calls our webhook
 * (POST /payments/cashfree/webhook), signed with HMAC-SHA256 of timestamp + raw body using the secret key; a valid
 * PAYMENT_SUCCESS for an order we created, for the amount we asked, grants the year. When the person comes back, the
 * app also asks us to check the order (POST /plus/pay/verify), which reads the order status from Cashfree itself, so
 * a late webhook never leaves anyone waiting. Granting is idempotent.
 *
 * Keys: CASHFREE_APP_ID and CASHFREE_SECRET_KEY are secrets (`wrangler secret put`), never in files or chat.
 * CASHFREE_ENV is "sandbox" (default) or "production". PUBLIC_BASE_URL is where Cashfree sends people back.
 * Without the keys, payments are off and Plus stays in test mode.
 *
 * What we keep per payment: the order id, the member id, the amount, the status and Cashfree's payment id. The phone
 * number Cashfree requires is passed to Cashfree for the payment and is not stored here.
 */

export interface Pricing { yearlyInr: number; foundingInr: number; foundingSeats: number; foundingOn: boolean }
// One price: ₹9,999 a year. Founding seats are off; an admin can still switch them on, but nothing shows them by default.
export const DEFAULT_PRICING: Pricing = { yearlyInr: 9999, foundingInr: 999, foundingSeats: 300, foundingOn: false };
/** Shown on receipts and the legal pages. Placeholders until the founder fills them in admin. */
export interface Business { entityName: string; address: string; email: string; gstin: string }
export const DEFAULT_BUSINESS: Business = { entityName: "SnapSkill LLP", address: "[Registered address]", email: "[Support email]", gstin: "" };

const API_VERSION = "2023-08-01";
const YEAR_DAYS = 365;

export const pricing = (env: Env) => getSetting<Pricing>(env, "pricing", DEFAULT_PRICING);
export const business = (env: Env) => getSetting<Business>(env, "business", DEFAULT_BUSINESS);

export const cashfreeConfigured = (env: Env) => !!(env.CASHFREE_APP_ID && env.CASHFREE_SECRET_KEY);
export const cashfreeMode = (env: Env): "sandbox" | "production" => (env.CASHFREE_ENV === "production" ? "production" : "sandbox");
function apiBase(env: Env) {
  // Local tests point this at a stand-in server. Only honoured in dev mode, never in production.
  if (env.CASHFREE_API_BASE && env.AUTH_MODE === "dev" && cashfreeMode(env) === "sandbox") return env.CASHFREE_API_BASE.replace(/\/$/, "");
  return cashfreeMode(env) === "production" ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg";
}

async function cf(env: Env, method: string, path: string, body?: unknown): Promise<{ status: number; data: any }> {
  const res = await fetch(apiBase(env) + path, {
    method,
    headers: {
      "content-type": "application/json", accept: "application/json", "x-api-version": API_VERSION,
      "x-client-id": env.CASHFREE_APP_ID!, "x-client-secret": env.CASHFREE_SECRET_KEY!,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json().catch(() => ({})) };
}

interface PaymentRow {
  order_id: string; member_id: string; amount_inr: number; founding: number; status: string; mode: string;
  cf_payment_id: string | null; created_at: string; paid_at: string | null; refunded_at: string | null; refund_inr: number | null; refund_note: string | null;
}

/** A checkout that has started holds its founding seat this long, so two people can't both buy the last one. */
const HOLD_MINUTES = 30;

/** What a year costs right now, and how many founding seats are left: paid, unrefunded orders, plus checkouts in progress. */
export async function currentPrice(env: Env) {
  const p = await pricing(env);
  await ensureSchema(env);
  const taken = (await env.DB.prepare("SELECT COUNT(*) AS n FROM payments WHERE founding = 1 AND (status = 'paid' OR (status = 'created' AND created_at > ?))")
    .bind(new Date(Date.now() - HOLD_MINUTES * 60_000).toISOString()).first<{ n: number }>())?.n ?? 0;
  const left = p.foundingOn ? Math.max(0, p.foundingSeats - taken) : 0;
  return { amountInr: left > 0 ? p.foundingInr : p.yearlyInr, founding: left > 0, foundingLeft: left, foundingSeats: p.foundingSeats, yearlyInr: p.yearlyInr, foundingInr: p.foundingInr };
}

export async function paymentsStatus(env: Env) {
  if (!cashfreeConfigured(env)) return { provider: "test" as const };
  return { provider: "cashfree" as const, mode: cashfreeMode(env), ...(await currentPrice(env)) };
}

const validId = (v: unknown) => /^[\w-]{16,64}$/.test(String(v ?? ""));
const newOrderId = () => "upsc_" + [...crypto.getRandomValues(new Uint8Array(12))].map((b) => b.toString(16).padStart(2, "0")).join("");
const isOrderId = (v: unknown) => /^upsc_[0-9a-f]{24}$/.test(String(v ?? ""));

/** Marks an order paid (once) and grants the year. Returns true the first time. */
async function markPaid(env: Env, orderId: string, amount: number, cfPaymentId: string | null): Promise<boolean> {
  const row = await env.DB.prepare("SELECT * FROM payments WHERE order_id = ?").bind(orderId).first<PaymentRow>();
  if (!row) return false;
  if (Math.round(amount * 100) !== Math.round(row.amount_inr * 100)) { await bump(env, "payment_amount_mismatch"); return false; }
  const res = await env.DB.prepare("UPDATE payments SET status = 'paid', paid_at = ?, cf_payment_id = COALESCE(?, cf_payment_id) WHERE order_id = ? AND status IN ('created', 'failed')")
    .bind(new Date().toISOString(), cfPaymentId, orderId).run();
  if (!res.meta.changes) return false;
  // Cashfree lets a payer try again inside one order, so a success can follow a failed attempt: 'failed' is not final.
  // A sandbox order moved no money: its year is marked as a test entitlement.
  // On the live server a sandbox payment (no money moved) gives one day, enough to see the whole flow work and
  // nothing worth gaming. Local test servers (AUTH_MODE=dev) still give the year, so the suites can check it.
  const sandbox = row.mode === "sandbox";
  await grant(env, row.member_id, "yearly", "cashfree", sandbox && env.AUTH_MODE !== "dev" ? 1 : YEAR_DAYS, false, sandbox);
  await bump(env, "plus_purchases");
  await logEvent(env, "paid", { memberId: row.member_id }, { amount: row.amount_inr, founding: !!row.founding });
  return true;
}

// --- HMAC check for webhooks ------------------------------------------------------------------------------------

export async function cashfreeSignature(secret: string, timestamp: string, rawBody: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(timestamp + rawBody));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}
function sameString(a: string, b: string) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

// --- Routes -------------------------------------------------------------------------------------------------------

/** /plus/pay/* (member routes: the member id is the signed-in account's) and the webhook. */
export async function paymentsRoute(req: Request, env: Env, path: string, url: URL): Promise<Response | null> {
  if (path === "/payments/cashfree/webhook" && req.method === "POST") return webhook(req, env);
  if (!path.startsWith("/plus/pay/") && path !== "/plus/receipts") return null;
  await ensureSchema(env);
  if (!(await flags(env)).plus) return bad("Plus isn't switched on yet.", 404);
  const body = req.method === "POST" ? await req.json<any>().catch(() => ({})) : {};
  const memberId = String(body.memberId ?? url.searchParams.get("member") ?? "");
  if (!validId(memberId)) return bad("memberId is required");

  if (path === "/plus/receipts" && req.method === "GET") {
    const rows = (await env.DB.prepare("SELECT * FROM payments WHERE member_id = ? AND status IN ('paid', 'refunded') ORDER BY created_at DESC").bind(memberId).all<PaymentRow>()).results;
    const biz = await business(env);
    return json({
      business: biz,
      receipts: rows.map((r) => ({
        receiptNo: "UPR-" + r.order_id.slice(5, 17).toUpperCase(), orderId: r.order_id, paidAt: r.paid_at, amountInr: r.amount_inr,
        item: "Aspiran Plus, one year (one-time payment, no auto-renewal)" + (r.founding ? ", founding price" : ""),
        status: r.status, refundedAt: r.refunded_at, refundInr: r.refund_inr, mode: r.mode, paymentRef: r.cf_payment_id,
      })),
    });
  }

  if (!cashfreeConfigured(env)) return bad("Payments aren't set up yet.", 503);

  if (path === "/plus/pay/order" && req.method === "POST") {
    const phone = String(body.phone ?? "").replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, "");
    if (!/^[6-9]\d{9}$/.test(phone)) return bad("Enter a 10-digit Indian mobile number. Cashfree needs it for the payment.");
    const base = (env.PUBLIC_BASE_URL || url.origin).replace(/\/$/, "");
    const price = await currentPrice(env);
    const orderId = newOrderId();
    const account = await env.DB.prepare("SELECT email FROM accounts WHERE member_id = ?").bind(memberId).first<{ email: string | null }>();
    const r = await cf(env, "POST", "/orders", {
      order_id: orderId, order_amount: price.amountInr, order_currency: "INR",
      customer_details: { customer_id: memberId.slice(0, 50), customer_phone: phone, ...(account?.email ? { customer_email: account.email } : {}) },
      order_meta: { return_url: `${base}/app/#paid/{order_id}`, notify_url: `${base}/payments/cashfree/webhook` },
      order_note: "Aspiran Plus, one year",
    });
    if (r.status >= 300 || !r.data?.payment_session_id) { await bump(env, "payment_order_failed"); return bad("Couldn't start the payment just now. Try again in a minute.", 502); }
    await env.DB.prepare("INSERT INTO payments (order_id, member_id, amount_inr, founding, status, mode, created_at) VALUES (?, ?, ?, ?, 'created', ?, ?)")
      .bind(orderId, memberId, price.amountInr, price.founding ? 1 : 0, cashfreeMode(env), new Date().toISOString()).run();
    await logEvent(env, "checkout_started", { memberId }, { amount: price.amountInr, founding: price.founding });
    return json({ orderId, paymentSessionId: r.data.payment_session_id, mode: cashfreeMode(env), amountInr: price.amountInr });
  }

  if (path === "/plus/pay/verify" && req.method === "POST") {
    const orderId = String(body.orderId ?? "");
    if (!isOrderId(orderId)) return bad("orderId is required");
    const row = await env.DB.prepare("SELECT * FROM payments WHERE order_id = ? AND member_id = ?").bind(orderId, memberId).first<PaymentRow>();
    if (!row) return bad("That order isn't yours or doesn't exist.", 404);
    if (row.status !== "created" && row.status !== "failed") return json({ status: row.status });
    // Ask Cashfree even after a failed attempt: the same order may have been paid on a retry.
    const r = await cf(env, "GET", `/orders/${orderId}`);
    if (r.status >= 300) return json({ status: row.status === "failed" ? "failed" : "pending" });
    if (r.data?.order_status === "PAID") {
      await markPaid(env, orderId, Number(r.data.order_amount), null);
      return json({ status: "paid" });
    }
    if (row.status === "failed") return json({ status: "failed" });
    return json({ status: r.data?.order_status === "ACTIVE" ? "pending" : String(r.data?.order_status ?? "pending").toLowerCase() });
  }
  return bad("Not found", 404);
}

async function webhook(req: Request, env: Env): Promise<Response> {
  if (!cashfreeConfigured(env)) return bad("Payments aren't set up.", 503);
  await ensureSchema(env);
  const raw = await req.text();
  const ts = req.headers.get("x-webhook-timestamp") ?? "";
  const sig = req.headers.get("x-webhook-signature") ?? "";
  if (!ts || !sig || !sameString(await cashfreeSignature(env.CASHFREE_SECRET_KEY!, ts, raw), sig)) { await bump(env, "webhook_bad_signature"); return bad("Bad signature", 401); }
  // Old deliveries are refused (timestamps are in milliseconds; allow 15 minutes).
  const t = Number(ts);
  if (Number.isFinite(t) && Math.abs(Date.now() - (t < 1e12 ? t * 1000 : t)) > 15 * 60_000) return bad("Stale webhook", 400);
  const evt = JSON.parse(raw || "{}");
  const orderId = String(evt?.data?.order?.order_id ?? "");
  if (evt?.type === "PAYMENT_SUCCESS_WEBHOOK" && isOrderId(orderId) && evt?.data?.payment?.payment_status === "SUCCESS") {
    await markPaid(env, orderId, Number(evt.data.payment.payment_amount ?? evt.data.order.order_amount), evt.data.payment.cf_payment_id ? String(evt.data.payment.cf_payment_id) : null);
  } else if (evt?.type === "PAYMENT_FAILED_WEBHOOK" && isOrderId(orderId)) {
    await env.DB.prepare("UPDATE payments SET status = 'failed' WHERE order_id = ? AND status = 'created'").bind(orderId).run();
  }
  return json({ ok: true });
}

// --- Admin: payments list, refunds, pricing ----------------------------------------------------------------------

export async function listPayments(env: Env, q: string, limit: number) {
  await ensureSchema(env);
  const like = `%${q.replace(/[%_]/g, "")}%`;
  const rows = (await env.DB.prepare("SELECT * FROM payments WHERE (? = '' OR order_id LIKE ? OR member_id LIKE ?) ORDER BY created_at DESC LIMIT ?").bind(q, like, like, limit).all<PaymentRow>()).results;
  const totals = await env.DB.prepare("SELECT SUM(status = 'paid') AS paid, SUM(status = 'refunded') AS refunded, COALESCE(SUM(CASE WHEN status = 'paid' THEN amount_inr END), 0) AS revenue FROM payments").first();
  return { rows, totals, configured: cashfreeConfigured(env), mode: cashfreeMode(env), price: await currentPrice(env) };
}

/** Refunds a paid order in full (or part) with Cashfree, and ends the Plus it bought. */
export async function refundPayment(env: Env, orderId: string, amountInr: number | null, note: string, by: string): Promise<Response> {
  if (!isOrderId(orderId)) return bad("orderId is required");
  const row = await env.DB.prepare("SELECT * FROM payments WHERE order_id = ?").bind(orderId).first<PaymentRow>();
  if (!row) return bad("No such order.", 404);
  if (row.status !== "paid") return bad(`This order is ${row.status}, not paid.`, 409);
  if (!cashfreeConfigured(env)) return bad("Payments aren't set up.", 503);
  const amount = amountInr == null ? row.amount_inr : Math.min(Math.max(1, Math.round(amountInr)), row.amount_inr);
  const r = await cf(env, "POST", `/orders/${orderId}/refunds`, { refund_amount: amount, refund_id: "rf_" + orderId.slice(5), refund_note: (note || "Refund").slice(0, 100) });
  if (r.status >= 300) return bad("Cashfree refused the refund: " + String(r.data?.message ?? r.status).slice(0, 200), 502);
  await env.DB.prepare("UPDATE payments SET status = 'refunded', refunded_at = ?, refund_inr = ?, refund_note = ? WHERE order_id = ?")
    .bind(new Date().toISOString(), amount, `${note.slice(0, 200)} (by ${by})`, orderId).run();
  await env.DB.prepare("UPDATE entitlements SET ends_at = ?, cancelled_at = ? WHERE member_id = ? AND source = 'cashfree'")
    .bind(new Date().toISOString(), new Date().toISOString(), row.member_id).run();
  await logEvent(env, "refunded", { memberId: row.member_id }, { amount });
  return json({ ok: true, orderId, refundInr: amount, cashfree: { refundStatus: r.data?.refund_status ?? null } });
}

export function cleanPricing(b: any): Pricing | null {
  const n = (v: unknown, min: number, max: number) => { const x = Math.round(Number(v)); return x >= min && x <= max ? x : null; };
  const yearlyInr = n(b?.yearlyInr, 1, 100000), foundingInr = n(b?.foundingInr, 1, 100000), foundingSeats = n(b?.foundingSeats, 0, 100000);
  if (yearlyInr == null || foundingInr == null || foundingSeats == null) return null;
  return { yearlyInr, foundingInr, foundingSeats, foundingOn: !!b?.foundingOn };
}
export function cleanBusiness(b: any): Business {
  const s = (v: unknown, n: number, d: string) => String(v ?? "").trim().slice(0, n) || d;
  return { entityName: s(b?.entityName, 120, DEFAULT_BUSINESS.entityName), address: s(b?.address, 300, DEFAULT_BUSINESS.address), email: s(b?.email, 120, DEFAULT_BUSINESS.email), gstin: String(b?.gstin ?? "").trim().slice(0, 20) };
}
