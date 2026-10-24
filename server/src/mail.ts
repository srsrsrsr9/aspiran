import { type Env } from "./shared";

/**
 * Sending email (password recovery in password.ts). The provider is picked by which setting is there:
 *
 * - RESEND_API_KEY and MAIL_FROM: sent through Resend (resend.com). The key is a secret (`wrangler secret put`),
 *   MAIL_FROM is the sender, e.g. "UPSC Pods <no-reply@example.com>", on a domain verified with Resend.
 * - AUTH_MODE=dev (local only): nothing is sent. The message is kept in memory for the tests to read
 *   (GET /auth/password/dev/outbox, local only).
 * - Neither: mail is off, and the apps don't offer recovery by email.
 *
 * Only plain text. The address is used to send this one message and isn't logged.
 */

export type Mail = { to: string; subject: string; text: string };

/** The last few messages, in dev only. */
const outbox: (Mail & { at: string })[] = [];

export const mailProvider = (env: Env): "resend" | "log" | null =>
  env.RESEND_API_KEY && env.MAIL_FROM ? "resend" : env.AUTH_MODE === "dev" ? "log" : null;

export const mailOn = (env: Env) => mailProvider(env) !== null;

export async function sendMail(env: Env, m: Mail): Promise<boolean> {
  const p = mailProvider(env);
  if (p === "log") {
    outbox.push({ ...m, at: new Date().toISOString() });
    if (outbox.length > 20) outbox.shift();
    return true;
  }
  if (p === "resend") {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: "Bearer " + env.RESEND_API_KEY },
      body: JSON.stringify({ from: env.MAIL_FROM, to: [m.to], subject: m.subject, text: m.text }),
    }).catch(() => null);
    if (!res?.ok) console.warn("mail: Resend refused a message", res?.status ?? "offline");
    return !!res?.ok;
  }
  return false;
}

/** Dev only (the caller checks): the newest message to this address, or the newest of all. */
export const lastMail = (to?: string | null) =>
  [...outbox].reverse().find((m) => !to || m.to === to.toLowerCase()) ?? null;
