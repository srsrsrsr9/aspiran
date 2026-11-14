import { callChat, type Hop } from "./ai";
import { business } from "./payments";
import { mailOn, sendMail } from "./mail";
import { type Env, istDay } from "./shared";
import { ensureSchema, recordVersion } from "./staff";

/**
 * Fact watch: the one daily job whose only work is to check facts in our content that change over time (the
 * Supreme Court's strength, RBI's reserve ratios, helpline numbers...) and update them.
 *
 * Each watched fact names the value our content uses, one source page, and the exact phrases the value appears in.
 * Every morning (05:30 IST) the job reads each source. A "contains" fact is a plain text check (a helpline number is
 * still on its own site). An "ask" fact goes to Groq, which must answer with the value and the sentence it read it
 * in; the sentence has to be on the page and contain the value, or the answer is ignored.
 *
 * A new value is only acted on when two daily checks agree. Then every library item holding one of the fact's
 * phrases gets the new value written in (the old json is kept in content_versions), and the owner gets an email
 * listing what changed. Anything the job can't settle (a source down, a helpline number gone, an answer that doesn't
 * hold up) is emailed as "needs a person" and nothing is changed. Admin: GET /admin/api/factwatch, POST .../run.
 */

type Fact = {
  id: string;
  label: string;
  /** The value our content uses today. Once the job has seen a change, the database's value wins. */
  value: string;
  source: string;
  /** "ask": Groq reads the page. "contains": the value must still be on the page, word for word. */
  how: "ask" | "contains";
  /** For "ask": the question, answered with the value only (a number, a name). */
  question?: string;
  /** Text near the answer, used to cut the page down before it goes to Groq. */
  near?: string[];
  /** Phrases our content uses, with {v} where the value goes. Only these are rewritten. */
  phrases: string[];
};

export const FACTS: Fact[] = [
  {
    id: "sc-strength", label: "Supreme Court sanctioned strength (including the CJI)", value: "38", how: "ask",
    source: "https://en.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&format=json&titles=Supreme_Court_of_India",
    question: "What is the sanctioned strength of the Supreme Court of India, counting the Chief Justice? Answer with the number only.",
    near: ["sanctioned strength", "Number of Judges", "judges including"],
    phrases: ["strength of the Supreme Court is {v} including", "raised the sanctioned strength from 34 to {v}", "sanctioned strength of {v} under"],
  },
  {
    id: "crr", label: "RBI cash reserve ratio (CRR)", value: "3", how: "ask",
    source: "https://www.rbi.org.in/",
    question: "What is the current Cash Reserve Ratio (CRR) in per cent? Answer with the number only, without the % sign.",
    near: ["CRR", "Cash Reserve Ratio"],
    phrases: ["CRR {v}%"],
  },
  {
    id: "slr", label: "RBI statutory liquidity ratio (SLR)", value: "18", how: "ask",
    source: "https://www.rbi.org.in/",
    question: "What is the current Statutory Liquidity Ratio (SLR) in per cent? Answer with the number only, without the % sign.",
    near: ["SLR", "Statutory Liquidity Ratio"],
    phrases: ["SLR {v}%"],
  },
  {
    id: "inflation-target", label: "RBI inflation target (CPI, per cent)", value: "4", how: "ask",
    source: "https://en.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&format=json&titles=Monetary_Policy_Committee_(India)",
    question: "What is India's current CPI inflation target in per cent (the midpoint, not the band)? Answer with the number only.",
    near: ["inflation target", "target"],
    phrases: ["inflation target is {v} per cent CPI", "inflation target of {v} per cent", "inflation target ({v}%"],
  },
  {
    id: "biosphere-reserves", label: "Biosphere reserves in India", value: "18", how: "ask",
    source: "https://en.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&format=json&titles=List_of_biosphere_reserves_of_India",
    question: "How many biosphere reserves does India have now? Answer with the number only.",
    near: ["biosphere reserves"],
    phrases: ["{v} biosphere reserves"],
  },
  {
    id: "scheduled-languages", label: "Languages in the Eighth Schedule", value: "22", how: "ask",
    source: "https://en.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&format=json&titles=Eighth_Schedule_to_the_Constitution_of_India",
    question: "How many languages are listed in the Eighth Schedule of the Constitution of India now? Answer with the number only.",
    near: ["languages"],
    phrases: ["{v} scheduled languages", "{v} languages in the Eighth Schedule", "Eighth Schedule lists {v} languages"],
  },
  {
    id: "vandrevala", label: "Vandrevala Foundation helpline", value: "9999 666 555", how: "contains",
    source: "https://www.vandrevalafoundation.com/", phrases: [],
  },
  {
    id: "icall", label: "iCall helpline", value: "9152987821", how: "contains",
    source: "https://icallhelpline.org/", phrases: [],
  },
];

const HOPS: Hop[] = [
  { provider: "groq", model: "openai/gpt-oss-120b", extra: { temperature: 0, reasoning_effort: "low", include_reasoning: false, max_completion_tokens: 400 }, timeoutMs: 30_000 },
  { provider: "groq", model: "openai/gpt-oss-20b", extra: { temperature: 0, reasoning_effort: "low", include_reasoning: false, max_completion_tokens: 400 }, timeoutMs: 30_000 },
];

type Row = { id: string; value: string; candidate: string | null; candidate_since: string | null; checked_at: string | null; status: string | null; note: string | null; quote: string | null };
export type Outcome = { id: string; label: string; status: "same" | "candidate" | "updated" | "needs-person"; value: string; seen?: string; note?: string; items?: string[] };

const squash = (s: string) => s.replace(/\s+/g, " ").trim();
const digits = (s: string) => s.replace(/\D/g, "");

/** A page as plain text: Wikipedia's API gives text already; anything else loses its tags. */
async function pageText(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "user-agent": "AspiranFactWatch/1.0 (content fact checker)", accept: "text/html,application/json" }, signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`source answered ${res.status}`);
  const body = await res.text();
  if (url.includes("/w/api.php")) {
    const pages = (JSON.parse(body)?.query?.pages ?? {}) as Record<string, { extract?: string }>;
    return squash(Object.values(pages).map((p) => p.extract ?? "").join(" "));
  }
  return squash(body.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#?\w+;/g, " "));
}

/** The parts of a long page around the words that matter, so Groq reads a few thousand characters, not a site. */
function around(text: string, near: string[] = [], width = 700, max = 6000): string {
  if (text.length <= max) return text;
  const bits: string[] = [];
  for (const w of near) {
    let i = text.toLowerCase().indexOf(w.toLowerCase());
    while (i >= 0 && bits.join(" ").length < max) {
      bits.push(text.slice(Math.max(0, i - width), i + width));
      i = text.toLowerCase().indexOf(w.toLowerCase(), i + width);
    }
  }
  return (bits.length ? bits.join(" … ") : text).slice(0, max);
}

/** What the source says now, or why it can't be told. */
export async function readSource(env: Env, f: Fact, current: string, fetchText = pageText, answer?: string): Promise<{ value: string | null; quote?: string; note?: string }> {
  let text: string;
  try { text = await fetchText(f.source); } catch (e) { return { value: null, note: `couldn't open the source (${String(e).slice(0, 80)})` }; }
  if (f.how === "contains") {
    return digits(text).includes(digits(current)) ? { value: current } : { value: null, note: `${current} is no longer on ${f.source}` };
  }
  const part = around(text, f.near);
  const prompt = `${f.question}\nUse only the page text below. Reply with JSON only: {"value": "<the answer>", "quote": "<the exact sentence from the text that says it>"}. If the text does not say, reply {"value": null}.\n\nPAGE TEXT:\n${part}`;
  let raw: string;
  if (answer !== undefined) raw = answer; // tests only (dev mode): the AI's reply, given
  else try { raw = (await callChat(env, "watch", [{ role: "user", content: prompt }], HOPS)).text; } catch (e) { return { value: null, note: `AI not available (${String(e).slice(0, 80)})` }; }
  const m = raw.match(/\{[\s\S]*\}/);
  let out: { value?: unknown; quote?: unknown } = {};
  try { out = m ? JSON.parse(m[0]) : {}; } catch { /* below */ }
  const value = out.value == null ? "" : String(out.value).trim();
  const quote = squash(String(out.quote ?? ""));
  if (!value) return { value: null, note: "the source page doesn't say" };
  // The answer has to stand on the page: its sentence is there, and the value is in that sentence.
  if (!quote || !text.toLowerCase().includes(quote.toLowerCase().slice(0, 120))) return { value: null, note: "the AI's quote isn't on the page" };
  if (!quote.includes(value) && !(digits(value) && digits(quote).includes(digits(value)))) return { value: null, note: "the AI's quote doesn't contain its answer" };
  return { value, quote };
}

/** Writes a new value into every library item holding one of the fact's phrases. Returns the ids changed. */
async function rewrite(env: Env, f: Fact, from: string, to: string): Promise<string[]> {
  const pairs = f.phrases.map((p) => [p.replaceAll("{v}", from), p.replaceAll("{v}", to)] as const).filter(([a, b]) => a !== b);
  if (!pairs.length) return [];
  const changed: string[] = [];
  for (const [a] of pairs) {
    const { results } = await env.DB.prepare("SELECT id, json FROM library WHERE instr(json, ?) > 0").bind(a).all<{ id: string; json: string }>();
    for (const r of results) {
      if (changed.includes(r.id)) continue;
      const cur = (await env.DB.prepare("SELECT json FROM library WHERE id = ?").bind(r.id).first<{ json: string }>())?.json ?? r.json;
      let next = cur;
      for (const [x, y] of pairs) next = next.split(x).join(y);
      if (next === cur) continue;
      await recordVersion(env, "library", r.id, cur, `fact watch: ${f.id} ${from} → ${to}`, "Fact watch");
      await env.DB.prepare("UPDATE library SET json = ?, updated_at = ? WHERE id = ?").bind(next, new Date().toISOString(), r.id).run();
      changed.push(r.id);
    }
  }
  return changed;
}

/** One pass over every watched fact. `fetchText` is swapped out by the tests. */
export async function runFactWatch(env: Env, opts: { fetchText?: (url: string) => Promise<string>; answers?: Record<string, string>; today?: string; mail?: boolean } = {}): Promise<Outcome[]> {
  await ensureSchema(env);
  const today = opts.today ?? istDay();
  const out: Outcome[] = [];
  for (const f of FACTS) {
    const row = await env.DB.prepare("SELECT * FROM fact_watch WHERE id = ?").bind(f.id).first<Row>();
    const current = row?.value ?? f.value;
    const seen = await readSource(env, f, current, opts.fetchText, opts.answers?.[f.id]);
    let o: Outcome;
    let candidate = row?.candidate ?? null, since = row?.candidate_since ?? null, value = current;
    if (seen.value == null) {
      o = { id: f.id, label: f.label, status: "needs-person", value: current, note: seen.note };
    } else if (seen.value === current) {
      o = { id: f.id, label: f.label, status: "same", value: current };
      candidate = null; since = null;
    } else if (candidate === seen.value && since && since < today) {
      // Seen on two different days: act on it.
      const items = await rewrite(env, f, current, seen.value);
      value = seen.value; candidate = null; since = null;
      o = { id: f.id, label: f.label, status: "updated", value, seen: seen.value, note: `was ${current}. Source: "${seen.quote}"`, items };
    } else {
      if (candidate !== seen.value) { candidate = seen.value; since = today; }
      o = { id: f.id, label: f.label, status: "candidate", value: current, seen: seen.value, note: `the source now says ${seen.value} ("${seen.quote}"); acted on if tomorrow agrees` };
    }
    await env.DB.prepare(`INSERT INTO fact_watch (id, value, candidate, candidate_since, checked_at, status, note, quote) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET value = excluded.value, candidate = excluded.candidate, candidate_since = excluded.candidate_since,
      checked_at = excluded.checked_at, status = excluded.status, note = excluded.note, quote = excluded.quote`)
      .bind(f.id, value, candidate, since, new Date().toISOString(), o.status, o.note ?? null, seen.quote ?? null).run();
    out.push(o);
  }
  if (opts.mail !== false) await mailOwner(env, out).catch(() => {});
  return out;
}

/** Emails the owner only when something changed or needs a person; a quiet day sends nothing. */
async function mailOwner(env: Env, out: Outcome[]) {
  const loud = out.filter((o) => o.status !== "same");
  if (!loud.length || !mailOn(env)) return;
  const to = (await business(env)).email;
  if (!/^\S+@\S+\.\S+$/.test(to)) return;
  const line = (o: Outcome) => `- ${o.label}: ${o.status === "updated" ? `now ${o.value}` : o.status === "candidate" ? `maybe ${o.seen}` : "couldn't check"}. ${o.note ?? ""}${o.items?.length ? `\n  Updated: ${o.items.join(", ")}` : ""}`;
  const updated = loud.filter((o) => o.status === "updated").length;
  await sendMail(env, {
    to,
    subject: updated ? `Fact watch: ${updated} fact${updated === 1 ? "" : "s"} updated in the content` : `Fact watch: ${loud.length} to look at`,
    text: ["The daily fact watch checked " + out.length + " facts.", "", ...loud.map(line), "", "All facts: Admin, Fact watch."].join("\n"),
  });
}

export async function factWatchApi(env: Env, path: string, method: string, body: any = {}): Promise<Response | null> {
  if (path === "factwatch" && method === "GET") {
    await ensureSchema(env);
    const { results } = await env.DB.prepare("SELECT * FROM fact_watch").all<Row>();
    const by = new Map(results.map((r) => [r.id, r]));
    return Response.json({ facts: FACTS.map((f) => ({ label: f.label, source: f.source, ...(by.get(f.id) ?? { value: f.value }), id: f.id })) });
  }
  if (path === "factwatch/run" && method === "POST") {
    // Dev mode only (the tests): pages, AI replies and the day can be handed in, so no network or AI key is needed.
    if (env.AUTH_MODE === "dev" && body?.pages) {
      const pages = body.pages as Record<string, string>;
      return Response.json({ results: await runFactWatch(env, { fetchText: async (u) => { if (!(u in pages)) throw new Error("no page"); return pages[u]; }, answers: body.answers ?? {}, today: body.today, mail: false }) });
    }
    return Response.json({ results: await runFactWatch(env) });
  }
  return null;
}
