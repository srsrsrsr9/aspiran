import { type Env } from "./shared";
import { getSetting } from "./staff";

/**
 * Result-day mode. Admins list the days UPSC results come out; for 72 hours from the start of that day (IST)
 * the apps shrink Adda to one card, Chotu goes quiet, there are no wins posts and no Plus offers anywhere.
 * A member can also switch it on for themselves on the phone or in the browser.
 */
export interface ResultDay { day: string; label: string }

export const RESULT_HOURS = 72;

export const resultDays = (env: Env) => getSetting<ResultDay[]>(env, "results", []);

/** The result whose 72-hour window contains `now`, if any. */
export function activeResult(results: ResultDay[], now = Date.now()): ResultDay | null {
  for (const r of results) {
    const start = Date.parse(r.day + "T00:00:00+05:30");
    if (now >= start && now < start + RESULT_HOURS * 3600_000) return r;
  }
  return null;
}

/** Cleans what an admin sent: up to 20 days, YYYY-MM-DD, a short label each. */
export function cleanResults(input: unknown): ResultDay[] | null {
  if (!Array.isArray(input) || input.length > 20) return null;
  const out: ResultDay[] = [];
  for (const r of input) {
    const day = String(r?.day ?? "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || Number.isNaN(Date.parse(day))) return null;
    out.push({ day, label: String(r?.label ?? "UPSC result").trim().slice(0, 60) || "UPSC result" });
  }
  return out.sort((a, b) => a.day.localeCompare(b.day));
}
