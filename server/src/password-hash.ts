/** Password hashing for password.ts. Kept free of imports so test/password.mjs can check it under plain Node. */

const ITERATIONS = 100_000; // the most PBKDF2 iterations Cloudflare Workers allows
const enc = new TextEncoder();

// --- Encoding and hashing ----------------------------------------------------------------------------------

export const b64u = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
export function unb64u(s: string): Uint8Array | null {
  try {
    const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4));
    return Uint8Array.from(bin, (c) => c.charCodeAt(0));
  } catch { return null; }
}

/** Constant-time comparison of two byte arrays. */
export function sameBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false; // lengths are public (always 32 bytes here)
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function pbkdf2(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, 256));
}

/** "pbkdf2-sha256$<iterations>$<salt>$<hash>" */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2-sha256$${ITERATIONS}$${b64u(salt)}$${b64u(await pbkdf2(password, salt, ITERATIONS))}`;
}

export async function checkPassword(password: string, stored: string): Promise<boolean> {
  const [alg, iter, salt, hash] = stored.split("$");
  const s = unb64u(salt ?? ""), h = unb64u(hash ?? ""), n = Number(iter);
  if (alg !== "pbkdf2-sha256" || !s || !h || !(n > 0 && n <= ITERATIONS)) return false;
  return sameBytes(await pbkdf2(password, s, n), h);
}

// --- Checks ---------------------------------------------------------------------------------------------------

export const cleanUsername = (v: unknown) => (typeof v === "string" ? v.trim().toLowerCase() : "");
export function passwordProblem(p: unknown): string | null {
  if (typeof p !== "string" || p.length < 8) return "Use at least 8 characters for your password.";
  if (p.length > 200) return "That password is too long.";
  return null;
}

