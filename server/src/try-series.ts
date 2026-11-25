// K4: the five short study emails after the demo (decisions-2026-11-24.md, website and marketing; K4 in
// artefacts/marketing-2026-11-21). Only for visitors who tick the separate, unticked "Send me 5 short study emails" box
// in the demo's day-3 form. The five are: day 0, day 3 (the live recall email, try-recall.ts), day 7, day 14, day 30.
//
//   POST /try/recall { ..., series: true, seriesText }   signs up for the series alongside the day-3 email
//   GET|POST /try/series/<code>/stop                     stops every email still to come (the day-3 one too), deletes the address
//
// Privacy: the address is kept until the day-30 email is sent (or the visitor stops), then deleted. One row per browser
// session. "Delete what I sent" in the demo, and Marketing's "forget", delete the row. A step that couldn't go out
// within a week of its day is skipped, never sent late in a bunch.

import { sendMail } from "./mail";
import { logEvent } from "./metrics";
import { ensureSchema } from "./staff";
import { type Env, istDay } from "./shared";
import { SERIES_MAIL } from "./try-series-mail";

/** The emails this module sends, in order, with their day after sign-up. */
export const STEPS = [{ id: "k4-d00", day: 0 }, { id: "k4-d07", day: 7 }, { id: "k4-d14", day: 14 }, { id: "k4-d30", day: 30 }] as const;
const RUN_MAX = 40;
const MAX_TRIES = 2;
const LATE_DAYS = 7;

const addDays = (day: string, n: number) => new Date(Date.parse(day + "T12:00:00Z") + n * 86400_000).toISOString().slice(0, 10);
const appBase = (env: Env) => (env.PUBLIC_BASE_URL || "https://app.aspiran.in").replace(/\/$/, "");
const newCode = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), (x) => x.toString(16).padStart(2, "0")).join("");
export const seriesStopLink = (env: Env, code: string) => `${appBase(env)}/try/series/${code}/stop`;

export type SeriesRow = { code: string; session_id: string; recall_code: string | null; email: string | null; lang: string; consent_text: string;
  created_at: string; start_day: string; step: number; tries: number; last_sent_at: string | null; stopped_at: string | null; done_at: string | null };

/** Sign up (or update the address of) this browser's series. Called from try-recall.ts's sign-up when the box was ticked. */
export async function seriesSignUp(env: Env, a: { sessionId: string; recallCode: string; email: string; lang: string; consentText: string }) {
  await ensureSchema(env);
  const had = await env.DB.prepare("SELECT code, step FROM try_series WHERE session_id = ?").bind(a.sessionId).first<{ code: string; step: number }>();
  if (had && had.step >= STEPS.length) return had.code; // already had all five
  if (had) {
    await env.DB.prepare("UPDATE try_series SET email = ?, lang = ?, consent_text = ?, recall_code = ?, stopped_at = NULL WHERE code = ?")
      .bind(a.email, a.lang, a.consentText, a.recallCode, had.code).run();
    return had.code;
  }
  const code = newCode(), now = new Date();
  await env.DB.prepare(`INSERT INTO try_series (code, session_id, recall_code, email, lang, consent_text, created_at, start_day) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(code, a.sessionId, a.recallCode, a.email, a.lang, a.consentText, now.toISOString(), istDay(now)).run();
  return code;
}

/** The series row that goes with a day-3 email, if it's still running (so that email says "second of five"). */
export async function seriesFor(env: Env, recallCode: string): Promise<SeriesRow | null> {
  return env.DB.prepare("SELECT * FROM try_series WHERE recall_code = ? AND email IS NOT NULL AND stopped_at IS NULL").bind(recallCode).first<SeriesRow>();
}

/** Stops the series and the day-3 email that goes with it; both addresses deleted. */
export async function stopSeries(env: Env, code: string) {
  const now = new Date().toISOString();
  const row = await env.DB.prepare("SELECT recall_code FROM try_series WHERE code = ?").bind(code).first<{ recall_code: string | null }>();
  await env.DB.prepare("UPDATE try_series SET email = NULL, stopped_at = COALESCE(stopped_at, ?) WHERE code = ?").bind(now, code).run();
  if (row?.recall_code) await env.DB.prepare("UPDATE try_recall SET email = NULL, stopped_at = COALESCE(stopped_at, ?) WHERE code = ? AND sent_at IS NULL").bind(now, row.recall_code).run();
}

/** Stopping the day-3 email (its own link, or cancelling in the demo) stops the series too. */
export async function stopSeriesForRecall(env: Env, recallCode: string) {
  await env.DB.prepare("UPDATE try_series SET email = NULL, stopped_at = COALESCE(stopped_at, ?) WHERE recall_code = ?").bind(new Date().toISOString(), recallCode).run();
}

/** One email of the series: plain text, the owner's words, with the stop link. */
export function seriesMail(env: Env, row: { code: string; lang: string }, stepId: string) {
  const m = SERIES_MAIL[stepId], l = row.lang === "hi" ? "hi" : "en", stop = seriesStopLink(env, row.code);
  const text = [m.greeting[l], "", m.body[l], "", m.signoff[l], "", m.footer[l].replace("{{unsubscribe_url}}", stop)].join("\n");
  return { subject: m.subject[l], text, headers: { "List-Unsubscribe": `<${stop}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } };
}

/**
 * Sends the series emails that are due, at most RUN_MAX a run. A row is claimed (tries + 1) before sending, so two runs
 * never send the same step. After the last step the address is deleted.
 */
export async function sendSeries(env: Env, day = istDay()): Promise<{ sent: number; failed: number; skipped: number }> {
  await ensureSchema(env);
  const { results } = await env.DB.prepare(
    "SELECT * FROM try_series WHERE email IS NOT NULL AND stopped_at IS NULL AND step < ? ORDER BY created_at LIMIT 500",
  ).bind(STEPS.length).all<SeriesRow>();
  let sent = 0, failed = 0, skipped = 0;
  const now = () => new Date().toISOString();
  const advance = (row: SeriesRow, sentNow: boolean) => {
    const last = row.step + 1 >= STEPS.length;
    return env.DB.prepare(`UPDATE try_series SET step = step + 1, tries = 0${sentNow ? ", last_sent_at = ?1" : ""}${last ? ", email = NULL, done_at = ?1" : ""} WHERE code = ?2`)
      .bind(now(), row.code).run();
  };
  for (const row of results) {
    if (sent + failed >= RUN_MAX) break;
    const step = STEPS[row.step], due = addDays(row.start_day, step.day);
    if (due > day) continue;
    if (due < addDays(day, -LATE_DAYS) || row.tries >= MAX_TRIES) { await advance(row, false); skipped++; continue; } // too late, or refused twice
    const claim = await env.DB.prepare("UPDATE try_series SET tries = tries + 1 WHERE code = ? AND step = ? AND tries = ?").bind(row.code, row.step, row.tries).run();
    if (!claim.meta.changes) continue; // another run has it
    const ok = await sendMail(env, { to: row.email!, ...seriesMail(env, row, step.id) });
    if (ok) {
      await advance(row, true);
      await logEvent(env, "try_series_sent", {}, { step: step.id });
      sent++;
    } else failed++;
  }
  return { sent, failed, skipped };
}

/** For Admin: counts only. */
export async function seriesFunnel(env: Env) {
  await ensureSchema(env);
  const r = await env.DB.prepare(`SELECT COUNT(*) AS signed, SUM(stopped_at IS NOT NULL) AS stopped, SUM(done_at IS NOT NULL) AS finished,
    SUM(email IS NOT NULL) AS running, SUM(step) AS stepsPassed FROM try_series`).first<Record<string, number | null>>();
  return Object.fromEntries(Object.entries(r ?? {}).map(([k, v]) => [k, v ?? 0]));
}
