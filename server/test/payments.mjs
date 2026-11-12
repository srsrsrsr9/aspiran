// Cashfree payments (src/payments.ts) against a local server and a stand-in for Cashfree's API that this test runs.
// Start the server with test values (not real keys) and the stand-in's address, on its own database:
//   npx wrangler dev --port 8792 --persist-to .wrangler-pay --var AUTH_MODE:dev --var EDITOR_TOKEN:pay-test-token \
//     --var CASHFREE_APP_ID:local-test-app --var CASHFREE_SECRET_KEY:local-test-secret --var CASHFREE_API_BASE:http://127.0.0.1:8799/pg
//   EDITOR_TOKEN=pay-test-token CF_SECRET=local-test-secret BASE=http://127.0.0.1:8792 node --import ./test/dev-auth.mjs test/payments.mjs
// Checks: the price and founding seats, creating an order, a bad webhook signature refused, a signed webhook granting
// a year exactly once, the return check, receipts, a wrong amount refused, and a refund from admin ending Plus.
// Google Play (src/play.ts): the play_billing flag is off by default, verify needs it, a bad body is refused, and
// without PLAY_SERVICE_ACCOUNT_JSON (never set for this test) verify answers 503 and grants nothing.
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { createServer } from "node:http";

const BASE = process.env.BASE ?? "http://127.0.0.1:8792";
const TOKEN = process.env.EDITOR_TOKEN, SECRET = process.env.CF_SECRET;
if (!TOKEN || !SECRET) throw new Error("Set EDITOR_TOKEN and CF_SECRET (the local test values the server was started with)");
const step = (name) => console.log("✓", name);
const rid = () => crypto.randomUUID().replace(/-/g, "");
const call = async (path, { method = "GET", body, headers = {}, raw } = {}) => {
  const res = await fetch(BASE + path, { method, headers: { "content-type": "application/json", ...headers }, body: raw ?? (body ? JSON.stringify(body) : undefined) });
  const text = await res.text(); let data; try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
};
const post = (path, body) => call(path, { method: "POST", body });
const admin = (path, body) => call("/admin/api/" + path, { method: body ? "POST" : "GET", body, headers: { authorization: "Bearer " + TOKEN } });

// --- The stand-in for Cashfree ---
const orders = new Map(), refunds = [];
const mock = createServer(async (req, res) => {
  let raw = ""; for await (const c of req) raw += c;
  const send = (code, obj) => { res.writeHead(code, { "content-type": "application/json" }); res.end(JSON.stringify(obj)); };
  if (req.headers["x-client-id"] !== "local-test-app" || req.headers["x-client-secret"] !== SECRET || !req.headers["x-api-version"]) return send(401, { message: "auth" });
  const m = req.url.match(/^\/pg\/orders(?:\/([\w-]+))?(\/refunds)?$/);
  if (req.method === "POST" && req.url === "/pg/orders") {
    const b = JSON.parse(raw);
    assert.match(b.customer_details.customer_phone, /^[6-9]\d{9}$/);
    assert.ok(b.order_meta.notify_url.endsWith("/payments/cashfree/webhook"));
    orders.set(b.order_id, { ...b, order_status: "ACTIVE" });
    return send(200, { order_id: b.order_id, payment_session_id: "session_" + b.order_id, order_status: "ACTIVE" });
  }
  if (req.method === "GET" && m?.[1] && !m[2]) { const o = orders.get(m[1]); return o ? send(200, o) : send(404, { message: "no order" }); }
  if (req.method === "POST" && m?.[2]) { refunds.push({ order: m[1], ...JSON.parse(raw) }); return send(200, { refund_status: "PENDING" }); }
  send(404, {});
}).listen(8799, "127.0.0.1");

const sign = (ts, raw) => createHmac("sha256", SECRET).update(ts + raw).digest("base64");
const webhook = (evt, { bad = false } = {}) => {
  const raw = JSON.stringify(evt), ts = String(Date.now());
  return call("/payments/cashfree/webhook", { method: "POST", raw, headers: { "x-webhook-timestamp": ts, "x-webhook-signature": bad ? sign(ts, raw + " ") : sign(ts, raw) } });
};
const success = (orderId, amount) => ({ type: "PAYMENT_SUCCESS_WEBHOOK", data: { order: { order_id: orderId, order_amount: amount }, payment: { cf_payment_id: 555001, payment_status: "SUCCESS", payment_amount: amount } } });

try {
  const flagsBefore = (await admin("flags")).data.flags;
  assert.equal((await call("/config")).data.flags.play_billing, false, "play_billing is off by default");
  await admin("flags", { flags: { ...flagsBefore, plus: true } });
  await admin("pricing", { pricing: { yearlyInr: 2499, foundingInr: 999, foundingSeats: 300, foundingOn: true } });
  try {
    const me = rid();
    const st = (await post("/plus/status", { memberId: me })).data;
    assert.equal(st.payments.provider, "cashfree"); assert.equal(st.payments.mode, "sandbox");
    assert.equal(st.payments.amountInr, 999); assert.equal(st.payments.founding, true);
    assert.equal(st.testMode, false);
    assert.equal((await post("/plus/purchase", { memberId: me, plan: "yearly", testMode: true })).status, 400, "no test purchases once Cashfree is set up");
    step("status: Cashfree sandbox, ₹999 founding price; test purchases off");

    assert.equal((await post("/plus/pay/order", { memberId: me, phone: "12345" })).status, 400, "phone checked");
    const o = (await post("/plus/pay/order", { memberId: me, phone: "+91 98765 43210" })).data;
    assert.match(o.orderId, /^upsc_[0-9a-f]{24}$/); assert.equal(o.paymentSessionId, "session_" + o.orderId); assert.equal(o.amountInr, 999);
    assert.equal(orders.get(o.orderId).order_amount, 999);
    step("an order is created with Cashfree for the founding price");

    assert.equal((await webhook(success(o.orderId, 999), { bad: true })).status, 401, "bad signature refused");
    assert.equal((await post("/plus/status", { memberId: me })).data.plan, null, "nothing granted yet");
    assert.equal((await webhook(success(o.orderId, 999))).status, 200);
    const plan = (await post("/plus/status", { memberId: me })).data.plan;
    assert.equal(plan.source, "cashfree"); assert.equal(plan.plan, "yearly");
    const days = (Date.parse(plan.endsAt) - Date.now()) / 86400_000;
    assert.ok(days > 364 && days <= 365.01, "a year");
    assert.equal((await webhook(success(o.orderId, 999))).status, 200);
    assert.equal((await post("/plus/status", { memberId: me })).data.plan.endsAt, plan.endsAt, "a repeated webhook grants nothing more");
    step("a signed webhook grants a year, once; a bad signature is refused");

    const rc = (await call(`/plus/receipts?member=${me}`)).data;
    assert.equal(rc.receipts.length, 1); assert.equal(rc.receipts[0].amountInr, 999); assert.equal(rc.receipts[0].paymentRef, "555001");
    assert.match(rc.receipts[0].receiptNo, /^UPR-[0-9A-F]{12}$/);
    const other = rid();
    assert.equal((await call(`/plus/receipts?member=${other}`)).data.receipts.length, 0, "only your own receipts");
    step("receipts");

    // The return check reads Cashfree's own order status; a wrong amount never grants.
    const m2 = rid();
    const o2 = (await post("/plus/pay/order", { memberId: m2, phone: "9123456789" })).data;
    assert.equal((await post("/plus/pay/verify", { memberId: m2, orderId: o2.orderId })).data.status, "pending");
    assert.equal((await post("/plus/pay/verify", { memberId: me, orderId: o2.orderId })).status, 404, "someone else's order");
    orders.get(o2.orderId).order_status = "PAID";
    assert.equal((await post("/plus/pay/verify", { memberId: m2, orderId: o2.orderId })).data.status, "paid");
    assert.equal((await post("/plus/status", { memberId: m2 })).data.plan.source, "cashfree");
    const m3 = rid();
    const o3 = (await post("/plus/pay/order", { memberId: m3, phone: "9123456780" })).data;
    await webhook(success(o3.orderId, 1));
    assert.equal((await post("/plus/status", { memberId: m3 })).data.plan, null, "wrong amount: no Plus");
    step("the return check, and a wrong amount never grants");

    // A failed attempt and then a successful retry inside the same order (Cashfree allows it): Plus is still granted.
    const m4 = rid();
    const o4 = (await post("/plus/pay/order", { memberId: m4, phone: "9123456781" })).data;
    assert.equal((await webhook({ type: "PAYMENT_FAILED_WEBHOOK", data: { order: { order_id: o4.orderId }, payment: { payment_status: "FAILED" } } })).status, 200);
    assert.equal((await post("/plus/pay/verify", { memberId: m4, orderId: o4.orderId })).data.status, "failed");
    assert.equal((await post("/plus/status", { memberId: m4 })).data.plan, null, "a failed attempt grants nothing");
    assert.equal((await webhook(success(o4.orderId, o4.amountInr))).status, 200);
    assert.equal((await post("/plus/status", { memberId: m4 })).data.plan?.source, "cashfree", "the retry that succeeded is honoured");
    const m5 = rid();
    const o5 = (await post("/plus/pay/order", { memberId: m5, phone: "9123456782" })).data;
    await webhook({ type: "PAYMENT_FAILED_WEBHOOK", data: { order: { order_id: o5.orderId }, payment: { payment_status: "FAILED" } } });
    orders.get(o5.orderId).order_status = "PAID";
    assert.equal((await post("/plus/pay/verify", { memberId: m5, orderId: o5.orderId })).data.status, "paid", "the return check finds a paid retry too");
    step("a failed attempt followed by a paid retry still gets Plus");

    // Founding seats run out: the next price is the yearly one.
    await admin("pricing", { pricing: { yearlyInr: 2499, foundingInr: 999, foundingSeats: 2, foundingOn: true } });
    const p2 = (await post("/plus/status", { memberId: rid() })).data.payments;
    assert.equal(p2.amountInr, 2499); assert.equal(p2.founding, false);
    step("after the founding seats, the yearly price");

    // Refund from admin: needs the order id typed, goes to Cashfree, ends Plus, shows on the receipt.
    assert.equal((await admin(`payments/${o.orderId}/refund`, { note: "Asked within 7 days" })).status, 400, "confirmation needed");
    const rf = await admin(`payments/${o.orderId}/refund`, { note: "Asked within 7 days", confirm: o.orderId });
    assert.equal(rf.status, 200, JSON.stringify(rf.data)); assert.equal(rf.data.refundInr, 999);
    assert.equal(refunds.at(-1).order, o.orderId); assert.equal(refunds.at(-1).refund_amount, 999);
    assert.equal((await post("/plus/status", { memberId: me })).data.plan, null, "Plus ends on refund");
    assert.equal((await call(`/plus/receipts?member=${me}`)).data.receipts[0].status, "refunded");
    assert.equal((await admin(`payments/${o.orderId}/refund`, { confirm: o.orderId })).status, 409, "not twice");
    const list = (await admin("payments")).data;
    assert.ok(list.rows.some((r) => r.order_id === o.orderId && r.status === "refunded"));
    step("a refund from admin goes to Cashfree and ends Plus");

    // Google Play Billing: built, and off.
    const pm = rid(), token = "test-token." + rid() + rid();
    assert.equal((await post("/plus/status", { memberId: pm })).data.play.on, false, "no Play purchase while play_billing is off");
    assert.equal((await post("/plus/play/verify", { memberId: pm, purchaseToken: token, productId: "plus_yearly" })).status, 404, "flag off: refused");
    await admin("flags", { flags: { ...flagsBefore, plus: true, play_billing: true } });
    assert.equal((await post("/plus/status", { memberId: pm })).data.play.on, true);
    assert.equal((await post("/plus/status", { memberId: pm })).data.play.ready, false, "no service account here");
    assert.equal((await post("/plus/play/verify", { memberId: pm, productId: "plus_yearly" })).status, 400, "no token");
    assert.equal((await post("/plus/play/verify", { memberId: pm, purchaseToken: "short", productId: "plus_yearly" })).status, 400, "bad token");
    assert.equal((await post("/plus/play/verify", { memberId: pm, purchaseToken: token, productId: "plus_monthly" })).status, 400, "wrong product");
    const pv = await post("/plus/play/verify", { memberId: pm, purchaseToken: token, productId: "plus_yearly" });
    assert.equal(pv.status, 503); assert.equal(pv.data.error, "Play verification isn't set up");
    assert.equal((await post("/plus/status", { memberId: pm })).data.plan, null, "an unverified token grants nothing");
    await admin("flags", { flags: { ...flagsBefore, plus: true } });
    step("Play: off by default, a bad body refused, 503 without the service account, nothing granted");

    const g = (await admin("growth")).data.paidFunnel;
    assert.ok(g.checkoutStarted >= 3 && g.paid >= 2 && g.refunded >= 1);
    step("the Growth page counts checkouts, payments and refunds");
  } finally {
    await admin("flags", { flags: flagsBefore });
    await admin("pricing", { pricing: { yearlyInr: 2499, foundingInr: 999, foundingSeats: 300, foundingOn: true } });
  }
  console.log("\nAll payments checks passed.");
} finally { mock.close(); }
