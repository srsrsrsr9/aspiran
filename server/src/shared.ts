export interface Env {
  DB: D1Database;
  POD: DurableObjectNamespace;
  /** The Commons: presence-only study rooms, one Durable Object per room. */
  COMMONS?: DurableObjectNamespace;
  /** Content pack files (SVGs, audio). Local dev keeps it under .wrangler/; no account needed. */
  MEDIA?: R2Bucket;
  /** Only bound in env.production (needs `wrangler login`). Absent in plain local dev. */
  AI?: Ai;
  /** Typed by the user into .dev.vars (local) or `wrangler secret put` (deployed). Never in files. */
  EDITOR_TOKEN?: string;
  MOD_TOKEN?: string;
  /** Optional: signs username/password session tokens (password.ts). Unset = a random key the Worker keeps in D1. */
  SESSION_SECRET?: string;
  /** Resend key for password recovery email (mail.ts). A secret (`wrangler secret put`), never in files or chat. */
  RESEND_API_KEY?: string;
  /** The sender for recovery email, e.g. "Aspiran <no-reply@example.com>", on a domain verified with Resend. */
  MAIL_FROM?: string;
  /** Optional owner key. Without it, EDITOR_TOKEN is the owner key. */
  ADMIN_TOKEN?: string;
  /** Claude key for the desk's Author tab. Typed by the owner into .dev.vars or `wrangler secret put`. Never in files or chat. */
  ANTHROPIC_API_KEY?: string;
  /** Groq key for cloud Chotu (until launch). Typed by the owner into .dev.vars or `wrangler secret put`. Never in files or chat. */
  GROQ_API_KEY?: string;
  /** Dev only: where `npm run models` serves Chotu's model files (e.g. http://127.0.0.1:8788). Unset = R2 (MEDIA, models/...). */
  MODEL_FILES_URL?: string;
  /** Database backups. Local dev keeps it under .wrangler/; never served publicly. */
  BACKUPS?: R2Bucket;
  /** Firebase project id: ID tokens must have aud = this (auth.ts). Not a secret; set in wrangler.jsonc vars or .dev.vars. */
  FIREBASE_PROJECT_ID?: string;
  /** "dev" in .dev.vars only: accept fake `dev:<uid>` tokens from localhost over http (never in production). */
  AUTH_MODE?: string;
  /** Firebase web app config for the web app's sign-in (public values, from the Firebase console's web app). */
  FIREBASE_WEB_API_KEY?: string;
  FIREBASE_AUTH_DOMAIN?: string;
  FIREBASE_WEB_APP_ID?: string;
  /** Shown on the "access switched off" screen, e.g. an email address. */
  SUPPORT_CONTACT?: string;
  /** Cashfree payments (payments.ts). The keys are secrets (`wrangler secret put`), never in files or chat. */
  CASHFREE_APP_ID?: string;
  CASHFREE_SECRET_KEY?: string;
  /** "sandbox" (default) or "production". */
  CASHFREE_ENV?: string;
  /** Local tests only (AUTH_MODE=dev, sandbox): a stand-in for Cashfree's API. */
  CASHFREE_API_BASE?: string;
  /** Where Cashfree sends people back after paying, e.g. https://upsc-pods.example.workers.dev */
  PUBLIC_BASE_URL?: string;
  /** Google Play Billing (play.ts): the Play service account's JSON key, a secret (`wrangler secret put`), never in files or chat. */
  PLAY_SERVICE_ACCOUNT_JSON?: string;
  /** The app's package name on Play. Unset = in.aspiran.app. */
  PLAY_PACKAGE_NAME?: string;
}

export const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*" },
  });

export const bad = (message: string, status = 400) => json({ error: message }, status);

/** India time, since every ritual is scheduled in IST. */
export function istNow(d = new Date()): Date {
  return new Date(d.getTime() + 5.5 * 3600_000);
}

export function istDay(d = new Date()): string {
  return istNow(d).toISOString().slice(0, 10);
}

/** Monday of the IST week, as a day. */
export function istWeek(at = new Date()): string {
  const d = new Date(istDay(at) + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

export function newId(prefix = ""): string {
  return prefix + crypto.randomUUID().replace(/-/g, "").slice(0, 16);
}

/** Constant-time compare for bearer tokens. */
export function tokenOk(req: Request, expected: string | undefined): boolean {
  if (!expected) return false;
  const got = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (got.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < got.length; i++) diff |= got.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

/** Same starter list as the app's DistressMatcher. Needs review by a mental-health professional. */
const DISTRESS = [
  "kill myself", "end my life", "want to die", "end it all", "no reason to live", "suicide",
  "मरना चाहता", "मरना चाहती", "जीना नहीं चाहता", "जीना नहीं चाहती", "खुदकुशी", "आत्महत्या",
  "marna chahta", "marna chahti", "jeena nahi chahta", "jeena nahi chahti", "khudkushi", "sab khatam kar",
];

/** `extra` is the other languages' lists from /admin (langs.ts extraDistress), already lower-cased. */
export function distress(text: string, extra: string[] = []): boolean {
  const t = text.toLowerCase();
  return DISTRESS.some((p) => t.includes(p)) || extra.some((p) => t.includes(p));
}
export const BUILTIN_DISTRESS = DISTRESS;

export const HELPLINES = [
  { name: "Tele-MANAS", number: "14416" },
  { name: "Tele-MANAS (toll-free)", number: "1-800-891-4416" },
  { name: "Emergency", number: "112" },
];
