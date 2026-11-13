import { type Env, bad, json } from "./shared";
import { bump, ensureSchema, flags, sha256Hex } from "./staff";
import { logEvent } from "./metrics";
import { PRICES, grant } from "./plus";

/**
 * Google Play Billing for Plus in the Android app: built, and off. Behind the "plus" flag and its own "play_billing"
 * flag, which is off by default, and a build switch in the app (BuildConfig.PLAY_BILLING). The Cashfree web flow
 * (payments.ts) is untouched.
 *
 * The product is "plus_yearly", a one-time product at ₹9,999 that gives a year of Plus (PRICES.yearly), like the
 * Cashfree year: no auto-renewal. The app consumes it once we've granted the year, so the same Google account can
 * buy the next year too. Consuming also acknowledges it.
 *
 * The flow: the app buys through Play and sends the purchase token here (POST /plus/play/verify, a member route, so
 * the member id is the signed-in account's). We ask Google's Play Developer API about that token with our service
 * account (purchases.products.get). Only a purchased state grants anything; an unverified token never does. The token
 * itself isn't kept: its SHA-256 is the key, so one purchase grants one year to one member, once.
 *
 * TODO(owner): the Play service account. Until PLAY_SERVICE_ACCOUNT_JSON is set (`wrangler secret put`, never in files
 * or chat), verify answers 503 "Play verification isn't set up". The token exchange below (an RS256 JWT signed with
 * WebCrypto, swapped for an access token at Google's OAuth endpoint) hasn't run against Google yet: try it with a
 * license tester before switching the flag on. Refunds through Play are read once a day (playVoided, below).
 */

export const PLAY_PRODUCT = "plus_yearly";
const PACKAGE = "in.aspiran.app";
const SCOPE = "https://www.googleapis.com/auth/androidpublisher";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const API = "https://androidpublisher.googleapis.com/androidpublisher/v3";

export const playConfigured = (env: Env) => !!env.PLAY_SERVICE_ACCOUNT_JSON;

const validId = (v: unknown) => /^[\w-]{16,64}$/.test(String(v ?? ""));
// Play purchase tokens are long opaque strings of letters, digits and a few marks.
const validToken = (v: unknown) => typeof v === "string" && v.length >= 20 && v.length <= 4096 && /^[\w.:-]+$/.test(v);

// --- The service account's access token ------------------------------------------------------------------------

const b64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const b64urlText = (s: string) => b64url(new TextEncoder().encode(s));

let cached: { token: string; until: number } | null = null;

async function accessToken(env: Env): Promise<string | null> {
  if (cached && cached.until > Date.now() + 60_000) return cached.token;
  let sa: { client_email?: string; private_key?: string };
  try { sa = JSON.parse(env.PLAY_SERVICE_ACCOUNT_JSON!); } catch { return null; }
  if (!sa.client_email || !sa.private_key) return null;
  const der = Uint8Array.from(atob(sa.private_key.replace(/-----[^-]+-----/g, "").replace(/\s/g, "")), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const now = Math.floor(Date.now() / 1000);
  const unsigned = b64urlText(JSON.stringify({ alg: "RS256", typ: "JWT" })) + "." +
    b64urlText(JSON.stringify({ iss: sa.client_email, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 }));
  const sig = new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned)));
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: unsigned + "." + b64url(sig) }),
  });
  const data = await res.json<any>().catch(() => ({}));
  if (!res.ok || !data.access_token) return null;
  cached = { token: data.access_token, until: Date.now() + Number(data.expires_in ?? 3600) * 1000 };
  return cached.token;
}

/** Google's answer for one purchase token, or null when Google couldn't be asked. */
async function playPurchase(env: Env, productId: string, token: string): Promise<{ status: number; data: any } | null> {
  const at = await accessToken(env);
  if (!at) return null;
  const pkg = env.PLAY_PACKAGE_NAME || PACKAGE;
  const res = await fetch(`${API}/applications/${encodeURIComponent(pkg)}/purchases/products/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(token)}`, {
    headers: { authorization: "Bearer " + at, accept: "application/json" },
  });
  return { status: res.status, data: await res.json<any>().catch(() => ({})) };
}

// --- Refunds through Play ---------------------------------------------------------------------------------------

/**
 * Daily: purchases Google has voided (refunded, charged back or revoked) in the last few days end the Plus they
 * bought. Google lists them by purchase token; ours are kept as SHA-256, so each listed token is hashed and looked up.
 * Does nothing until Play Billing is set up. Not yet run against Google: check the first real refund by hand.
 */
export async function playVoided(env: Env): Promise<{ checked: number; ended: number } | { skipped: string }> {
  if (!playConfigured(env)) return { skipped: "Play isn't set up" };
  await ensureSchema(env);
  const at = await accessToken(env);
  if (!at) return { skipped: "no access token" };
  const pkg = env.PLAY_PACKAGE_NAME || PACKAGE;
  const since = Date.now() - 7 * 86400_000;
  let checked = 0, ended = 0, pageToken = "";
  for (let page = 0; page < 10; page++) {
    const res = await fetch(`${API}/applications/${encodeURIComponent(pkg)}/purchases/voidedpurchases?startTime=${since}&maxResults=100${pageToken ? `&token=${encodeURIComponent(pageToken)}` : ""}`, {
      headers: { authorization: "Bearer " + at, accept: "application/json" },
    });
    if (!res.ok) return { skipped: "Google answered " + res.status };
    const data = await res.json<any>().catch(() => ({}));
    for (const v of data.voidedPurchases ?? []) {
      if (typeof v?.purchaseToken !== "string") continue;
      checked++;
      const row = await env.DB.prepare("SELECT member_id, status FROM play_purchases WHERE token_hash = ?").bind(await sha256Hex(v.purchaseToken)).first<{ member_id: string; status: string }>();
      if (!row || row.status === "voided") continue;
      const now = new Date().toISOString();
      await env.DB.prepare("UPDATE play_purchases SET status = 'voided' WHERE token_hash = ?").bind(await sha256Hex(v.purchaseToken)).run();
      await env.DB.prepare("UPDATE entitlements SET ends_at = ?, cancelled_at = ? WHERE member_id = ? AND source = 'play'").bind(now, now, row.member_id).run();
      await logEvent(env, "refunded", { memberId: row.member_id }, { via: "play" });
      ended++;
    }
    pageToken = data.tokenPagination?.nextPageToken ?? "";
    if (!pageToken) break;
  }
  return { checked, ended };
}

// --- Route ------------------------------------------------------------------------------------------------------

/** POST /plus/play/verify {memberId, purchaseToken, productId}. */
export async function playRoute(req: Request, env: Env, path: string): Promise<Response | null> {
  if (path !== "/plus/play/verify") return null;
  if (req.method !== "POST") return bad("Not found", 404);
  await ensureSchema(env);
  const f = await flags(env);
  if (!f.plus || !f.play_billing) return bad("Play purchases aren't switched on.", 404);
  const body = await req.json<any>().catch(() => ({}));
  const memberId = String(body?.memberId ?? ""), token = body?.purchaseToken, productId = String(body?.productId ?? "");
  if (!validId(memberId) || !validToken(token) || productId !== PLAY_PRODUCT) return bad("memberId, purchaseToken and productId are required");
  if (!playConfigured(env)) return bad("Play verification isn't set up", 503);

  const tokenHash = await sha256Hex(token);
  // A token we've granted before: the same member gets "granted" again (the app may have died before consuming it).
  const seen = await env.DB.prepare("SELECT member_id FROM play_purchases WHERE token_hash = ?").bind(tokenHash).first<{ member_id: string }>();
  if (seen && seen.member_id !== memberId) { await bump(env, "play_token_reused"); return bad("This purchase belongs to another account.", 409); }
  if (seen) return json({ status: "granted" });

  const g = await playPurchase(env, productId, token);
  if (!g) return bad("Couldn't reach Google Play just now. Try again in a minute.", 502);
  if (g.status === 404 || g.status === 400 || g.status === 410) { await bump(env, "play_token_invalid"); return bad("Google Play doesn't know this purchase.", 400); }
  if (g.status >= 300) return bad("Couldn't reach Google Play just now. Try again in a minute.", 502);
  // purchaseState: 0 purchased, 1 cancelled, 2 pending. The app sends the SHA-256 of the member id as the obfuscated
  // account id, so a token bought for one account can't be used by another.
  const p = g.data ?? {};
  if (p.obfuscatedExternalAccountId && p.obfuscatedExternalAccountId !== (await sha256Hex(memberId))) { await bump(env, "play_token_reused"); return bad("This purchase belongs to another account.", 409); }
  if (p.purchaseState === 2) return json({ status: "pending" });
  if (p.purchaseState !== 0) return bad("This purchase was cancelled.", 409);
  // Consumed but not in our table: it was used up somewhere else.
  if (p.consumptionState === 1) return bad("This purchase has already been used.", 409);

  // Granting is once per token, whoever asks first; a repeat finds the row and grants nothing more.
  const test = p.purchaseType === 0; // a license tester's purchase: no money moved
  const now = new Date().toISOString();
  const res = await env.DB.prepare(`INSERT INTO play_purchases (token_hash, member_id, product_id, order_id, status, test, purchased_at, created_at, granted_at)
    VALUES (?, ?, ?, ?, 'granted', ?, ?, ?, ?) ON CONFLICT(token_hash) DO NOTHING`)
    .bind(tokenHash, memberId, productId, p.orderId ? String(p.orderId).slice(0, 80) : null, test ? 1 : 0,
      p.purchaseTimeMillis ? new Date(Number(p.purchaseTimeMillis)).toISOString() : null, now, now).run();
  if (!res.meta.changes) {
    const again = await env.DB.prepare("SELECT member_id FROM play_purchases WHERE token_hash = ?").bind(tokenHash).first<{ member_id: string }>();
    return again?.member_id === memberId ? json({ status: "granted" }) : bad("This purchase belongs to another account.", 409);
  }
  const endsAt = await grant(env, memberId, "yearly", "play", PRICES.yearly.days, false, test);
  await bump(env, "plus_purchases");
  await logEvent(env, "paid", { memberId }, { amount: PRICES.yearly.inr, via: "play" });
  return json({ status: "granted", endsAt, test });
}
