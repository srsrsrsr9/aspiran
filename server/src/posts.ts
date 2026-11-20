import type { Env } from "./shared";
import { flags, getSetting, setSetting } from "./staff";

/**
 * Daily posts (sales build order step 3, 20 Nov 2026): the day's three Chai cards and a past UPSC question, posted to
 * a Telegram channel by the Bot API, and made ready to forward to WhatsApp from Admin → Daily posts.
 *
 * - The flag `daily_posts` (off by default) lets the cron post to Telegram. Off: nothing is sent; Admin still shows the
 *   day's post to copy by hand.
 * - Telegram needs the secret TELEGRAM_BOT_TOKEN (typed by the owner with wrangler) and the channel's @name, saved in
 *   Admin → Daily posts (settings key `daily_posts`). The bot must be an admin of the channel.
 * - WhatsApp channels have no posting API (the Cloud API only messages people who opted in, after Meta Business
 *   approval), so WhatsApp gets a ready-to-forward text and image in Admin.
 * - Tragic cards never go out, and a card marked not shareable doesn't either. No "AI" labels, no scores, no timers.
 * - Every link goes to app.aspiran.in with utm_source (telegram | whatsapp), utm_medium (chai | pyq) and
 *   utm_campaign (daily-YYYY-MM-DD), which the app's first_open event already records.
 */

/** IST half-hours at which the cron tries to post: after the 07:00 Chai, and again each hour until 12:30 if the day's Chai came late. */
export const POST_SLOTS = ["07:30", "08:30", "09:30", "10:30", "11:30", "12:30"];

export interface PostSettings { telegramChat: string }
export const DEFAULT_POST_SETTINGS: PostSettings = { telegramChat: "" };

export interface PostCard { headline: string; summary: string; gs: string; topic: string; hiHeadline: string | null; link: Record<Channel, string> }
export interface PostPyq {
  exam: "prelims" | "mains"; year: number; n: string; paper: string; text: string; options: string[] | null;
  /** 0-3 for a Prelims question with UPSC's official key; never shown in the text, only in Telegram's quiz poll. */
  answer: number | null; marks: number | null; words: number | null; link: Record<Channel, string>;
}
export type Channel = "telegram" | "whatsapp";
export interface DailyPost {
  day: string;
  cards: PostCard[];
  pyq: PostPyq | null;
  /** HTML for Telegram's sendMessage (parse_mode HTML). */
  telegram: { text: string; poll: { question: string; options: string[]; correct: number; explanation: string } | null };
  /** Plain text with WhatsApp's *bold* and _italic_, to paste into the WhatsApp channel or a broadcast list. */
  whatsapp: { text: string };
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const clean = (s: unknown) => String(s ?? "").replace(/\s+/g, " ").trim();
/** Cuts at a sentence (or word) end so a summary reads whole. */
export function trimText(s: string, max: number) {
  s = clean(s);
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const stop = cut.lastIndexOf(". ");
  if (stop > max * 0.5) return cut.slice(0, stop + 1);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:]$/, "") + "…";
}

/** app.aspiran.in/app/?utm...#hash. The query goes before the hash so the app's first_open event can read it. */
export function utmLink(base: string, hash: string, source: Channel, medium: string, day: string) {
  const q = new URLSearchParams({ utm_source: source, utm_medium: medium, utm_campaign: "daily-" + day });
  return `${base.replace(/\/$/, "")}/app/?${q}#${hash}`;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export function dayLabel(day: string) {
  const d = new Date(day + "T00:00:00Z");
  return `${DAYS[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

/** The brief's cards that may go outside the app: never tragic, never one marked not shareable. */
export function shareableCards(brief: any): any[] {
  return (Array.isArray(brief?.items) ? brief.items : []).filter((c: any) => c && c.headline && String(c.tone ?? "").toLowerCase() !== "tragic" && c.shareable !== false);
}

/**
 * The past question of the day, the same for everyone on a day and different from one day to the next: every question
 * of every approved paper (sample papers left out), stepped through by a large prime so years and papers mix.
 */
export function pickPyq(papers: any[], day: string): { paper: any; q: any } | null {
  const all: { paper: any; q: any }[] = [];
  for (const p of papers) {
    if (!p || p.sample || /^sample-/.test(String(p.id ?? ""))) continue;
    for (const q of Array.isArray(p.questions) ? p.questions : []) {
      const text = clean(q?.en?.q ?? q?.q);
      if (!text) continue;
      // Prelims questions need their four options; questions that lean on a picture or map can't be posted as text.
      if (p.exam === "prelims" && (q?.en?.options ?? q?.options ?? []).length !== 4) continue;
      if (/\b(map|figure|diagram|image) (given|below|above|shown)\b/i.test(text)) continue;
      all.push({ paper: p, q });
    }
  }
  if (!all.length) return null;
  all.sort((a, b) => (`${a.paper.id}#${String(a.q.n).padStart(3, "0")}` < `${b.paper.id}#${String(b.q.n).padStart(3, "0")}` ? -1 : 1));
  const n = Math.floor(Date.parse(day + "T00:00:00Z") / 864e5);
  return all[(n * 7919) % all.length];
}

const PAPER_NAME: Record<string, string> = { prelims: "GS Paper I", gs1: "GS Paper I", gs2: "GS Paper II", gs3: "GS Paper III", gs4: "GS Paper IV", csat: "CSAT" };

/** Builds the day's post for both channels. Pure: the same brief, paper and day give the same post. */
export function buildDailyPost(brief: any, pyq: { paper: any; q: any } | null, day: string, base = "https://app.aspiran.in", short = false): DailyPost {
  const link = (hash: string, medium: string) => ({ telegram: utmLink(base, hash, "telegram", medium, day), whatsapp: utmLink(base, hash, "whatsapp", medium, day) });
  const all = Array.isArray(brief?.items) ? brief.items : [];
  const cards: PostCard[] = shareableCards(brief).slice(0, 3).map((c: any) => ({
    headline: clean(c.headline),
    summary: trimText(c.summary, short ? 160 : 320),
    gs: clean(c.gsPaper).replace(/^GS(\d)$/, "GS $1"),
    topic: clean(c.topic),
    hiHeadline: c.hi?.headline ? clean(c.hi.headline) : null,
    // The card's place in the app's day, so the link opens that card (tragic ones still count in the app).
    link: link(`chai/${Math.max(0, all.indexOf(c))}`, "chai"),
  }));
  let q: PostPyq | null = null;
  if (pyq) {
    const p = pyq.paper, x = pyq.q, exam = p.exam === "prelims" ? "prelims" : "mains";
    const options = exam === "prelims" ? (x.en?.options ?? x.options ?? []).map(clean) : null;
    const official = p.answerKey?.status === "official" && !p.answerKey?.provisional;
    q = {
      exam, year: Number(p.year), n: String(x.n ?? ""), paper: PAPER_NAME[String(p.paper ?? "").toLowerCase()] ?? clean(p.paper).toUpperCase(),
      text: String(x.en?.q ?? x.q ?? "").split("\n").map(clean).filter(Boolean).join("\n"),
      options, answer: exam === "prelims" && official && Number.isInteger(x.answer) ? x.answer : null,
      marks: x.marks ?? null, words: exam === "mains" ? (x.words ?? null) : null,
      link: link(exam === "prelims" ? "prelims" : "mains", "pyq"),
    };
  }
  const L = "ABCD";
  const pyqTitle = q ? `UPSC ${q.exam === "prelims" ? "Prelims" : "Mains"} ${q.year} · ${q.paper}${q.n ? ` · Q${q.n}` : ""}` : "";
  const mainsAsk = q && q.exam === "mains" ? `Write it in ${q.words ?? 150} words${q.marks ? ` (${q.marks} marks)` : ""}, then check it against the rubric in the app.` : "";

  // Telegram (HTML).
  const t: string[] = [`<b>Today's Chai · ${esc(dayLabel(day))}</b>`, "Three stories that matter for UPSC. Two minutes, and it ends.", ""];
  cards.forEach((c, i) => {
    t.push(`<b>${i + 1}. ${esc(c.headline)}</b>`);
    if (c.hiHeadline) t.push(`<i>${esc(c.hiHeadline)}</i>`);
    t.push(esc(c.summary));
    t.push(`${c.gs ? esc(c.gs) + (c.topic ? " · " + esc(c.topic) : "") + " · " : ""}<a href="${esc(c.link.telegram)}">Test yourself: one tap</a>`, "");
  });
  if (!cards.length) t.push("No Chai today. The day's stories didn't suit sharing; they're in the app.", "");
  if (q) {
    t.push(`<b>Past question of the day</b>`, `<i>${esc(pyqTitle)}</i>`, esc(q.text));
    if (q.options) t.push(q.options.map((o, i) => `(${L[i]}) ${esc(o)}`).join("\n"));
    t.push(q.exam === "prelims"
      ? (q.answer != null ? "Answer in the quiz below." : `<a href="${esc(q.link.telegram)}">Answer and more Prelims practice</a>`)
      : `${esc(mainsAsk)} <a href="${esc(q.link.telegram)}">Write and mark it</a>`, "");
  }
  t.push(`Free in English and Hindi: <a href="${esc(utmLink(base, "adda", "telegram", "footer", day))}">app.aspiran.in</a>`);
  let text = t.join("\n");
  // Telegram's limit is 4096 characters (counted after the HTML is read). Shorten summaries if a long day runs over.
  if (text.length > 4000 && !short) return buildDailyPost(brief, pyq, day, base, true);

  // Telegram quiz polls: question up to 300 characters, options up to 100, explanation up to 200.
  const poll = q && q.exam === "prelims" && q.answer != null && q.options && q.text.length <= 300 && q.options.every((o) => o.length <= 100)
    ? { question: q.text, options: q.options, correct: q.answer, explanation: `${pyqTitle}. UPSC's official answer key.`.slice(0, 200) } : null;
  if (q && q.exam === "prelims" && q.answer != null && !poll) text = text.replace("Answer in the quiz below.", `<a href="${esc(q.link.telegram)}">Answer and more Prelims practice</a>`);

  // WhatsApp (plain text, *bold* and _italic_).
  const w: string[] = [`*Today's Chai · ${dayLabel(day)}*`, "Three stories that matter for UPSC. Two minutes, and it ends.", ""];
  cards.forEach((c, i) => {
    w.push(`*${i + 1}. ${c.headline}*`);
    if (c.hiHeadline) w.push(`_${c.hiHeadline}_`);
    w.push(c.summary, `Test yourself, one tap: ${c.link.whatsapp}`, "");
  });
  if (!cards.length) w.push("No Chai today. The day's stories didn't suit sharing; they're in the app.", "");
  if (q) {
    w.push("*Past question of the day*", `_${pyqTitle}_`, q.text);
    if (q.options) w.push(q.options.map((o, i) => `(${L[i]}) ${o}`).join("\n"));
    w.push(q.exam === "prelims" ? `Answer and more practice: ${q.link.whatsapp}` : `${mainsAsk} ${q.link.whatsapp}`, "");
  }
  w.push(`Free in English and Hindi: ${utmLink(base, "adda", "whatsapp", "footer", day)}`);

  return { day, cards, pyq: q, telegram: { text, poll }, whatsapp: { text: w.join("\n") } };
}

// --- With the database and Telegram ----------------------------------------------------------------------------------

export const postSettings = (env: Env) => getSetting<PostSettings>(env, "daily_posts", DEFAULT_POST_SETTINGS);

/** The day's post from the published brief and the approved past papers. Null when the day's Chai isn't out yet. */
export async function dailyPost(env: Env, day: string): Promise<DailyPost | null> {
  const row = await env.DB.prepare("SELECT json FROM briefs WHERE day = ?").bind(day).first<{ json: string }>();
  if (!row) return null;
  const { results } = await env.DB.prepare("SELECT json FROM library WHERE kind = 'pyq' AND status = 'approved'").all<{ json: string }>();
  const papers = results.map((r) => { try { return JSON.parse(r.json); } catch { return null; } }).filter(Boolean);
  return buildDailyPost(JSON.parse(row.json), pickPyq(papers, day), day, env.PUBLIC_BASE_URL || "https://app.aspiran.in");
}

/** A chat id is a channel's @name or a numeric id (-100…). */
export const validChat = (s: string) => /^@[A-Za-z][A-Za-z0-9_]{3,31}$/.test(s) || /^-?\d{5,20}$/.test(s);

/** Sends the post to the Telegram channel: the message, then (for a Prelims question with UPSC's key) a quiz poll. */
export async function sendTelegram(env: Env, post: DailyPost, chat: string): Promise<{ ok: boolean; error?: string; messageId?: number }> {
  const token = env.TELEGRAM_BOT_TOKEN;
  if (!token) return { ok: false, error: "The TELEGRAM_BOT_TOKEN secret isn't set" };
  if (!validChat(chat)) return { ok: false, error: "No Telegram channel saved (an @name, in Admin → Daily posts)" };
  const base = (env.TELEGRAM_API_BASE || "https://api.telegram.org").replace(/\/$/, "");
  const call = async (method: string, body: unknown) => {
    const res = await fetch(`${base}/bot${token}/${method}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json<any>().catch(() => ({}));
    // Telegram's own words, never the token (it's only in the URL).
    if (!res.ok || !data.ok) throw new Error(`Telegram ${method}: ${String(data.description ?? res.status).slice(0, 200)}`);
    return data.result;
  };
  try {
    const m = await call("sendMessage", { chat_id: chat, text: post.telegram.text, parse_mode: "HTML", link_preview_options: { is_disabled: true }, disable_notification: false });
    if (post.telegram.poll) {
      const p = post.telegram.poll;
      await call("sendPoll", { chat_id: chat, question: p.question, options: p.options.map((text) => ({ text })), type: "quiz", correct_option_id: p.correct, explanation: p.explanation, is_anonymous: true, disable_notification: true });
    }
    return { ok: true, messageId: m?.message_id };
  } catch (e) {
    return { ok: false, error: String((e as Error).message ?? e) };
  }
}

/** Every day's sends, kept so a day is posted once and Admin can show what went out. */
export interface PostLog { [day: string]: { telegram?: { at: string; ok: boolean; error?: string; by: string } } }
const LOG_KEY = "daily_posts_log";

export async function recordSend(env: Env, day: string, r: { ok: boolean; error?: string }, by: string) {
  const log = await getSetting<PostLog>(env, LOG_KEY, {});
  log[day] = { ...log[day], telegram: { at: new Date().toISOString(), ok: r.ok, ...(r.error ? { error: r.error } : {}), by } };
  // Keep the last 30 days.
  const keep = Object.keys(log).sort().slice(-30);
  await setSetting(env, LOG_KEY, Object.fromEntries(keep.map((k) => [k, log[k]])), by);
}
export const postLog = (env: Env) => getSetting<PostLog>(env, LOG_KEY, {});

/**
 * The cron's part (index.ts): at each POST_SLOTS time, if the flag is on, the day's Chai is out and Telegram hasn't had
 * the day's post, send it. A failed send is tried again at the next slot; after 12:30 the day is left.
 */
export async function runDailyPosts(env: Env, day: string, hm: string) {
  if (!POST_SLOTS.includes(hm)) return { skipped: "not a post slot" };
  if (!(await flags(env)).daily_posts) return { skipped: "flag off" };
  const done = (await postLog(env))[day]?.telegram;
  if (done?.ok) return { skipped: "already posted" };
  const post = await dailyPost(env, day);
  if (!post) return { skipped: "no Chai yet" };
  if (!post.cards.length && !post.pyq) return { skipped: "nothing shareable" };
  const r = await sendTelegram(env, post, (await postSettings(env)).telegramChat);
  await recordSend(env, day, r, "cron");
  return r;
}

// --- The image (1080 × 1350) for WhatsApp, built as SVG; Admin turns it into a PNG to download --------------------

/** Breaks text into lines of at most `max` characters (a rough fit for a proportional font), at most `rows` lines. */
export function wrapLines(text: string, max: number, rows: number) {
  const words = clean(text).split(" ");
  const out: string[] = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > max && line) { out.push(line); line = w; } else line = (line + " " + w).trim();
  }
  if (line) out.push(line);
  if (out.length > rows) { out.length = rows; out[rows - 1] = out[rows - 1].replace(/\s*\S*$/, "") + "…"; }
  return out;
}

const x = (s: string) => esc(s).replace(/"/g, "&quot;");

const stackedTop = (q: PostPyq) => !!q.options && q.options.some((o) => o.length > 24);

/** The day's card as an SVG: three headlines, the past question, the address. English only, so any phone's fonts draw it. */
export function postImageSvg(post: DailyPost) {
  const W = 1080, H = 1350, P = 84;
  const parts: string[] = [];
  const text = (tx: number, ty: number, s: string, size: number, opts: { weight?: number; fill?: string; family?: string } = {}) =>
    parts.push(`<text x="${tx}" y="${ty}" font-size="${size}" font-weight="${opts.weight ?? 400}" fill="${opts.fill ?? "#221A14"}" font-family="${opts.family ?? "Georgia, 'Times New Roman', serif"}">${x(s)}</text>`);
  const sans = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
  parts.push(`<rect width="${W}" height="${H}" fill="#FFF8F3"/>`, `<rect x="0" y="0" width="${W}" height="14" fill="#8D4F01"/>`);
  text(P, 150, "Today's Chai", 76, { weight: 700, fill: "#8D4F01" });
  text(P, 205, dayLabel(post.day) + " · three stories for UPSC", 32, { fill: "#6B5D52", family: sans });
  let y = 290;
  post.cards.forEach((c, i) => {
    parts.push(`<circle cx="${P + 26}" cy="${y - 12}" r="26" fill="#8D4F01"/>`);
    text(P + 17, y, String(i + 1), 34, { weight: 700, fill: "#FFF8F3", family: sans });
    const lines = wrapLines(c.headline, 38, 3);
    lines.forEach((l, k) => text(P + 80, y + k * 50, l, 40, { weight: 700 }));
    y += lines.length * 50;
    if (c.gs || c.topic) text(P + 80, y + 4, [c.gs, c.topic].filter(Boolean).join(" · "), 26, { fill: "#6B5D52", family: sans });
    y += 70;
  });
  if (post.pyq) {
    const q = post.pyq;
    const top = Math.max(y, stackedTop(q) ? 760 : 820);
    const qLines = wrapLines(q.text, 52, q.options ? 3 : 5);
    const stacked = !!q.options && q.options.some((o) => o.length > 24);
    const box = 140 + qLines.length * 42 + (q.options ? (stacked ? 4 : 2) * 44 : 0);
    parts.push(`<rect x="${P - 20}" y="${top}" width="${W - 2 * P + 40}" height="${box}" rx="24" fill="#FCE8C3"/>`);
    text(P + 10, top + 58, "Past question of the day", 30, { weight: 700, fill: "#8D4F01", family: sans });
    text(P + 10, top + 98, `UPSC ${q.exam === "prelims" ? "Prelims" : "Mains"} ${q.year}${q.n ? ` · Q${q.n}` : ""}`, 24, { fill: "#6B5D52", family: sans });
    qLines.forEach((l, k) => text(P + 10, top + 148 + k * 42, l, 32));
    if (q.options) {
      const oy = top + 148 + qLines.length * 42;
      q.options.forEach((o, k) => stacked
        ? text(P + 10, oy + k * 44, `(${"ABCD"[k]}) ${wrapLines(o, 56, 1)[0]}`, 28, { family: sans })
        : text(P + 10 + (k % 2) * 450, oy + Math.floor(k / 2) * 44, `(${"ABCD"[k]}) ${o}`, 28, { family: sans }));
    }
  }
  text(P, H - 70, "Test yourself, one tap: app.aspiran.in", 34, { weight: 700, fill: "#8D4F01", family: sans });
  text(P, H - 30, "Free, in English and Hindi", 24, { fill: "#6B5D52", family: sans });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${parts.join("")}</svg>`;
}
