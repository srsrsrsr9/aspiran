/**
 * Firebase Authentication ID tokens, verified inside the Worker with WebCrypto (no extra server, no library).
 * Rules from Firebase's "Verify ID tokens using a third-party JWT library":
 *   header: alg RS256, kid one of Google's securetoken keys
 *   payload: aud = project id, iss = https://securetoken.google.com/<project id>, sub non-empty,
 *            exp in the future, iat and auth_time in the past
 * No imports, so test/auth.mjs can run it under plain Node with its own key pair.
 */

export const SECURETOKEN_JWKS = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";
/** Clock skew allowed on iat / auth_time / exp, in seconds. */
const SKEW = 60;

export interface FirebaseClaims {
  sub: string;
  aud: string;
  iss: string;
  exp: number;
  iat: number;
  auth_time: number;
  phone_number?: string;
  email?: string;
  email_verified?: boolean;
  firebase?: { sign_in_provider?: string };
}

export type TokenResult = { ok: true; claims: FirebaseClaims } | { ok: false; code: "auth_invalid" | "auth_expired"; why: string };

type Jwk = JsonWebKey & { kid?: string };
export type JwksSource = (refresh: boolean) => Promise<Jwk[]>;

// --- Google's keys, cached per isolate for as long as Google's cache-control says -----------------------

let cache: { keys: Jwk[]; until: number } | null = null;
let lastRefresh = 0;

export const googleJwks: JwksSource = async (refresh) => {
  const now = Date.now();
  // A token with an unknown kid may refetch, but at most once a minute, so junk tokens can't hammer Google.
  if (cache && now < cache.until && !(refresh && now - lastRefresh > 60_000)) return cache.keys;
  lastRefresh = now;
  const res = await fetch(SECURETOKEN_JWKS, { cf: { cacheTtl: 3600 } } as RequestInit);
  if (!res.ok) throw new Error(`JWKS ${res.status}`);
  const { keys } = await res.json<{ keys: Jwk[] }>();
  const maxAge = Number(res.headers.get("cache-control")?.match(/max-age=(\d+)/)?.[1] ?? 3600);
  cache = { keys, until: now + Math.min(Math.max(maxAge, 60), 6 * 3600) * 1000 };
  return keys;
};

const keyCache = new Map<string, CryptoKey>();

function b64url(s: string): Uint8Array {
  const pad = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
const jsonPart = (s: string) => JSON.parse(new TextDecoder().decode(b64url(s)));

/** Verifies a Firebase ID token for `projectId`. Never throws: a bad token is { ok: false }. */
export async function verifyFirebaseToken(token: string, projectId: string, opts: { jwks?: JwksSource; now?: number } = {}): Promise<TokenResult> {
  const fail = (why: string, code: "auth_invalid" | "auth_expired" = "auth_invalid"): TokenResult => ({ ok: false, code, why });
  const parts = token.split(".");
  if (parts.length !== 3 || token.length > 4096) return fail("not a JWT");
  let header: { alg?: string; kid?: string }, claims: FirebaseClaims;
  try { header = jsonPart(parts[0]); claims = jsonPart(parts[1]); } catch { return fail("unreadable JWT"); }
  if (header.alg !== "RS256" || typeof header.kid !== "string") return fail("wrong algorithm");

  const now = Math.floor((opts.now ?? Date.now()) / 1000);
  if (claims.aud !== projectId) return fail("wrong audience");
  if (claims.iss !== `https://securetoken.google.com/${projectId}`) return fail("wrong issuer");
  if (typeof claims.sub !== "string" || !claims.sub || claims.sub.length > 128) return fail("no subject");
  if (typeof claims.exp !== "number" || claims.exp <= now - SKEW) return fail("expired", "auth_expired");
  if (typeof claims.iat !== "number" || claims.iat > now + SKEW) return fail("issued in the future");
  if (typeof claims.auth_time !== "number" || claims.auth_time > now + SKEW) return fail("auth_time in the future");

  const source = opts.jwks ?? googleJwks;
  let key = keyCache.get(header.kid);
  if (!key) {
    let jwk: Jwk | undefined;
    try {
      jwk = (await source(false)).find((k) => k.kid === header.kid) ?? (await source(true)).find((k) => k.kid === header.kid);
    } catch { return fail("couldn't fetch signing keys"); }
    if (!jwk) return fail("unknown key id");
    try {
      key = await crypto.subtle.importKey("jwk", { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: "RS256", ext: true }, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    } catch { return fail("bad signing key"); }
    if (!opts.jwks) keyCache.set(header.kid, key);
  }
  const signed = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
  let ok = false;
  try { ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64url(parts[2]), signed); } catch { ok = false; }
  return ok ? { ok: true, claims } : fail("bad signature");
}
