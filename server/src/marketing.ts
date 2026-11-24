import { type Env, bad, istDay, json, newId } from "./shared";
import { type Staff, ensureSchema, getSetting, label, setSetting, sha256Hex } from "./staff";

/**
 * Marketing (admin → Marketing): lead magnets, sign-ups by where people came from, and a light list of people to
 * follow up with (the "CRM"). Owner's brief, 24 Nov 2026.
 *
 * Cheap on database reads (the account is near the free 5M rows read a day):
 * - Numbers come from a small daily rollup, mkt_daily, filled once a night for yesterday (00:30 IST) and on demand
 *   for today, from indexed queries only (events by name and day, web_leads by last_seen, installs by member_id,
 *   try_contacts by time). The admin pages read the rollup, never the events table.
 * - Website page views arrive as one counter per magnet per day (mkt_hits), from POST /web/hit, which the website
 *   sends once per browser per page per day.
 * - The people list is read a page at a time through indexes; the counts per stage are kept in one settings row.
 *
 * Privacy first:
 * - A lead is only on the list if they left a number or email with their yes (the consent text and time come with
 *   them), or if the owner added them and wrote down how they agreed.
 * - Members are on the list without their phone or email: their sign-in details were not given for marketing. Reach
 *   them in the app. A member's contact shows only when they first came in as a lead with their yes.
 * - "Delete everywhere" removes the person from this list and from where they came in (website leads and their chats,
 *   or the Try one topic answers), and keeps only a hash in privacy_requests. A member's account is erased under
 *   Data requests, which also removes them from here.
 * - Nothing here sends anything. Messages are drafts the owner copies into WhatsApp or email and sends themselves.
 */

// --- Schema ------------------------------------------------------------------------------------------------------

export const MARKETING_SCHEMA = [
  // One row per day, lead magnet, source and step (view, visit, lead, signup, plus).
  `CREATE TABLE IF NOT EXISTS mkt_daily (day TEXT NOT NULL, magnet TEXT NOT NULL, src TEXT NOT NULL, step TEXT NOT NULL, n INTEGER NOT NULL,
    PRIMARY KEY (day, magnet, src, step))`,
  // Website page views per magnet per day (POST /web/hit). Counts only: no id, no address.
  `CREATE TABLE IF NOT EXISTS mkt_hits (day TEXT NOT NULL, magnet TEXT NOT NULL, n INTEGER NOT NULL, PRIMARY KEY (day, magnet))`,
  // The people list. ref says where they came in: web:<visitor id>, try:<session id>, member:<member id>, owner:<id>.
  `CREATE TABLE IF NOT EXISTS crm_people (id TEXT PRIMARY KEY, ref TEXT NOT NULL UNIQUE, kind TEXT NOT NULL DEFAULT 'student', name TEXT,
    contact TEXT, contact_kind TEXT, member_id TEXT, stage TEXT NOT NULL DEFAULT 'lead', stage_by TEXT NOT NULL DEFAULT 'auto', source TEXT,
    magnet TEXT, lang TEXT, tags TEXT, notes TEXT, next_follow_up TEXT, last_contacted TEXT, consent_text TEXT, consent_at TEXT,
    created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS crm_people_updated ON crm_people(updated_at)`,
  `CREATE INDEX IF NOT EXISTS crm_people_stage ON crm_people(stage, updated_at)`,
  `CREATE INDEX IF NOT EXISTS crm_people_follow ON crm_people(next_follow_up)`,
  `CREATE INDEX IF NOT EXISTS crm_people_member ON crm_people(member_id)`,
  `CREATE INDEX IF NOT EXISTS crm_people_contact ON crm_people(contact)`,
  // Indexes the nightly rollup needs on tables that already exist.
  `CREATE INDEX IF NOT EXISTS installs_member ON installs(member_id)`,
  `CREATE INDEX IF NOT EXISTS try_contacts_at ON try_contacts(at)`,
];

let mktDone = false;
export async function ensureMarketingSchema(env: Env) {
  if (mktDone) return;
  await ensureSchema(env);
  await env.DB.batch(MARKETING_SCHEMA.map((s) => env.DB.prepare(s)));
  mktDone = true;
}

// --- Lead magnets ------------------------------------------------------------------------------------------------

export type Magnet = { id: string; name: string; link: string; match: string[]; on: boolean };

/**
 * What counts as each magnet. A sign-up or visit belongs to the first magnet whose words appear in where it came from
 * (the link's utm_source:utm_medium, plus utm_campaign when the link has one). Tagging a link with
 * utm_campaign=<magnet id> is the surest way. Website buttons all open Try one topic, so "site:" counts there.
 */
export const DEFAULT_MAGNETS: Magnet[] = [
  { id: "pyq", name: "Free PYQ sets", link: "https://aspiran.in/pyq/", match: ["pyq"], on: true },
  { id: "chai", name: "Sample Chai (daily posts)", link: "https://aspiran.in/", match: ["chai"], on: true },
  { id: "newspaper", name: "Newspaper reader sample", link: "", match: ["newspaper"], on: true },
  { id: "coaching", name: "For coaching centres", link: "https://aspiran.in/for-coaching/", match: ["coaching"], on: true },
  { id: "try", name: "Try one topic", link: "https://app.aspiran.in/app/#try", match: ["try", "site"], on: true },
  { id: "chotu", name: "Chotu on the website", link: "https://aspiran.in/", match: [], on: true },
];
const MAGNETS_KEY = "marketing_magnets";
export const STEPS = ["view", "visit", "lead", "signup", "plus"] as const;

export async function magnetList(env: Env): Promise<Magnet[]> {
  const saved = await getSetting<Magnet[] | null>(env, MAGNETS_KEY, null);
  return Array.isArray(saved) && saved.length ? saved : DEFAULT_MAGNETS;
}

export function cleanMagnets(list: unknown): Magnet[] | string {
  if (!Array.isArray(list) || !list.length || list.length > 30) return "Send between 1 and 30 lead magnets.";
  const out: Magnet[] = [], seen = new Set<string>();
  for (const m of list as any[]) {
    const id = String(m?.id ?? "").trim().toLowerCase();
    if (!/^[a-z0-9-]{2,24}$/.test(id)) return `"${id}" can't be a short name: use 2 to 24 small letters, numbers or dashes.`;
    if (seen.has(id)) return `"${id}" is there twice.`;
    seen.add(id);
    const name = String(m?.name ?? "").trim().slice(0, 60);
    if (!name) return `Give "${id}" a name.`;
    const link = String(m?.link ?? "").trim().slice(0, 200);
    if (link && !/^https:\/\//.test(link)) return `The link for "${name}" must start with https://`;
    const match = (Array.isArray(m?.match) ? m.match : String(m?.match ?? "").split(","))
      .map((w: unknown) => String(w).trim().toLowerCase()).filter((w: string) => /^[a-z0-9._:-]{2,30}$/.test(w)).slice(0, 8);
    out.push({ id, name, link, match, on: m?.on !== false });
  }
  return out;
}

/** The magnet a source belongs to: the campaign if it names one, else the first whose words appear in it. */
export function magnetFor(magnets: Magnet[], source: string | null | undefined, referrer?: string | null): string {
  const campaign = String(referrer ?? "").split("/")[2]?.toLowerCase();
  if (campaign && magnets.some((m) => m.id === campaign)) return campaign;
  const text = `${source ?? ""} ${referrer ?? ""}`.toLowerCase();
  return magnets.find((m) => m.match.some((w) => text.includes(w)))?.id ?? "other";
}

/** The channel: the part of a source before ":" or "/" (site, telegram, whatsapp, youtube, invite, play, direct). */
export function channelOf(source: string | null | undefined): string {
  const s = String(source ?? "").toLowerCase().trim();
  if (!s) return "direct";
  const first = s.split(/[:/]/)[0] || "direct";
  if (/(^|\.)aspiran\.in$/.test(first)) return "site";
  if (/google\.|bing\.|duckduckgo\./.test(first)) return "search";
  return first.slice(0, 24);
}

// --- The nightly rollup --------------------------------------------------------------------------------------------

/** The UTC instants an IST day starts and ends. */
const istBounds = (day: string) => [new Date(day + "T00:00:00+05:30").toISOString(), new Date(Date.parse(day + "T00:00:00+05:30") + 86400_000).toISOString()];
const addDays = (day: string, n: number) => new Date(Date.parse(day + "T00:00:00Z") + n * 86400_000).toISOString().slice(0, 10);
const short = (s: unknown) => String(s ?? "").toLowerCase().replace(/[^\w.:/-]/g, "").slice(0, 60);

/** Recounts one IST day into mkt_daily from indexed queries. Safe to run again: the day's rows are replaced. */
export async function rollupDay(env: Env, day: string) {
  await ensureMarketingSchema(env);
  const magnets = await magnetList(env);
  const all = async <T = any>(sql: string, ...b: unknown[]) => ((await env.DB.prepare(sql).bind(...b).all<T>().catch(() => ({ results: [] as T[] }))).results ?? []);
  const counts = new Map<string, number>();
  const add = (magnet: string, src: string, step: string, n = 1) => { if (n) { const k = `${magnet}\t${src}\t${step}`; counts.set(k, (counts.get(k) ?? 0) + n); } };
  const [from, to] = istBounds(day);

  // Visits: browsers and phones opening the app for the first time, by the link that brought them.
  for (const r of await all<{ props: string | null }>("SELECT props FROM events WHERE name = 'first_open' AND day = ?", day)) {
    let p: any = {};
    try { p = JSON.parse(r.props || "{}"); } catch { /* keep {} */ }
    const src = short(p.source || (p.invite ? "invite" : "direct"));
    add(magnetFor(magnets, src, p.referrer), src, "visit");
  }
  // Views of the open demo (in the app; website page views come from /web/hit).
  const tries = (await all<{ n: number }>("SELECT COUNT(DISTINCT install_id) AS n FROM events WHERE name = 'try_open' AND day = ?", day))[0]?.n ?? 0;
  add("try", "app", "view", tries);

  // Leads: a number or email left with a yes, on the website (web_leads) or at the end of Try one topic.
  for (const r of await all<{ details: string; source: string | null }>(
    "SELECT details, source FROM web_leads WHERE last_seen >= ? AND consent_at >= ? AND consent_at < ?", from, from, to)) {
    let d: any = {};
    try { d = JSON.parse(r.details || "{}"); } catch { /* keep {} */ }
    const m = d.centre ? "coaching" : d.path ? "try" : magnetFor(magnets.filter((x) => x.id !== "try"), r.source);
    add(m === "other" ? "chotu" : m, short(r.source || "site"), "lead");
  }
  const tryContacts = (await all<{ n: number }>("SELECT COUNT(*) AS n FROM try_contacts WHERE at >= ? AND at < ?", from, to))[0]?.n ?? 0;
  add("try", "try", "lead", tryContacts);
  const day3 = (await all<{ n: number }>("SELECT COUNT(*) AS n FROM events WHERE name = 'try_day3_signup' AND day = ?", day))[0]?.n ?? 0;
  add("try", "day3-email", "lead", day3);

  // Sign-ups and Plus, by the source of the install they signed in on (installs_member index).
  for (const step of ["signup", "plus"] as const) {
    const rows = await all<{ member_id: string; source: string | null; referrer: string | null; invite_code: string | null }>(
      `SELECT e.member_id, i.source, i.referrer, i.invite_code FROM events e LEFT JOIN installs i ON i.member_id = e.member_id
       WHERE e.name = ? AND e.day = ? AND e.member_id IS NOT NULL`, step === "signup" ? "signup" : "paid", day);
    const seen = new Set<string>();
    for (const r of rows) {
      if (seen.has(r.member_id)) continue;
      seen.add(r.member_id);
      const src = short(r.source || (r.invite_code ? "invite" : "direct"));
      add(magnetFor(magnets, src, r.referrer), src, step);
    }
  }

  const stmts = [env.DB.prepare("DELETE FROM mkt_daily WHERE day = ?").bind(day)];
  for (const [k, n] of counts) {
    const [magnet, src, step] = k.split("\t");
    stmts.push(env.DB.prepare("INSERT INTO mkt_daily (day, magnet, src, step, n) VALUES (?, ?, ?, ?, ?)").bind(day, magnet, src, step, n));
  }
  await env.DB.batch(stmts);
  return { day, rows: counts.size };
}

/** Nightly (00:30 IST): yesterday's numbers, then the people list. */
export async function marketingNightly(env: Env, now = new Date()) {
  const yesterday = addDays(istDay(now), -1);
  const r = await rollupDay(env, yesterday);
  const c = await crmSync(env);
  return { ...r, crm: c };
}

// --- Website page views ----------------------------------------------------------------------------------------------

/**
 * POST /web/hit { magnet }: one view of a free page on aspiran.in. The website sends it once per browser per page
 * per day. Counts only; a cap per network per day keeps a flood from filling the table.
 */
export async function webHit(req: Request, env: Env): Promise<Response> {
  const b = await req.json<any>().catch(() => null);
  const magnet = String(b?.magnet ?? "").toLowerCase();
  if (!/^[a-z0-9-]{2,24}$/.test(magnet)) return bad("magnet is required");
  await ensureMarketingSchema(env);
  if (magnet !== "site" && !(await magnetList(env)).some((m) => m.id === magnet && m.on)) return json({ ok: false, unknown: true });
  const net = "hit:" + (await sha256Hex((req.headers.get("cf-connecting-ip") ?? "local") + ":" + istDay())).slice(0, 24);
  const day = istDay();
  const turn = await env.DB.prepare("INSERT INTO web_rate (k, day, n) VALUES (?, ?, 1) ON CONFLICT(k, day) DO UPDATE SET n = n + 1 RETURNING n").bind(net, day).first<{ n: number }>();
  if ((turn?.n ?? 1) > 200) return json({ ok: true, counted: false });
  await env.DB.prepare("INSERT INTO mkt_hits (day, magnet, n) VALUES (?, ?, 1) ON CONFLICT(day, magnet) DO UPDATE SET n = n + 1").bind(day, magnet).run();
  return json({ ok: true, counted: true });
}

// --- Reports for the admin pages ---------------------------------------------------------------------------------

const daysParam = (url: URL) => Math.min(Math.max(Number(url.searchParams.get("days")) || 30, 7), 180);

export async function magnetsReport(env: Env, days: number) {
  await ensureMarketingSchema(env);
  const today = istDay(), since = addDays(today, -(days - 1));
  const magnets = await magnetList(env);
  const rows = (await env.DB.prepare("SELECT magnet, step, SUM(n) AS n FROM mkt_daily WHERE day >= ? GROUP BY magnet, step").bind(since).all<{ magnet: string; step: string; n: number }>()).results ?? [];
  const hits = (await env.DB.prepare("SELECT magnet, SUM(n) AS n FROM mkt_hits WHERE day >= ? GROUP BY magnet").bind(since).all<{ magnet: string; n: number }>()).results ?? [];
  const empty = () => Object.fromEntries(STEPS.map((s) => [s, 0])) as Record<(typeof STEPS)[number], number>;
  const by = new Map<string, Record<string, number>>();
  const get = (id: string) => by.get(id) ?? by.set(id, empty()).get(id)!;
  for (const r of rows) get(r.magnet)[r.step] = (get(r.magnet)[r.step] ?? 0) + r.n;
  for (const h of hits) if (h.magnet !== "site") get(h.magnet).view += h.n;
  const list = [...magnets.map((m) => ({ ...m, ...get(m.id) })), ...(by.has("other") ? [{ id: "other", name: "Not from a lead magnet", link: "", match: [], on: true, ...get("other") }] : [])];
  return { days, since, magnets: list, refreshed: await getSetting<string | null>(env, "marketing_refreshed", null) };
}

export async function signupsReport(env: Env, days: number) {
  await ensureMarketingSchema(env);
  const today = istDay(), since = addDays(today, -(days - 1));
  const rows = (await env.DB.prepare("SELECT day, magnet, src, step, n FROM mkt_daily WHERE day >= ? AND step != 'view'").bind(since).all<{ day: string; magnet: string; src: string; step: string; n: number }>()).results ?? [];
  const site = (await env.DB.prepare("SELECT SUM(n) AS n FROM mkt_hits WHERE day >= ?").bind(since).first<{ n: number | null }>())?.n ?? 0;
  const dayList = Array.from({ length: days }, (_, i) => addDays(since, i));
  const daily = dayList.map((day) => {
    const own = rows.filter((r) => r.day === day && r.step === "signup");
    const byChannel: Record<string, number> = {};
    for (const r of own) byChannel[channelOf(r.src)] = (byChannel[channelOf(r.src)] ?? 0) + r.n;
    return { day, n: own.reduce((a, r) => a + r.n, 0), byChannel };
  });
  const sources = new Map<string, { visit: number; lead: number; signup: number; plus: number }>();
  for (const r of rows) {
    const s = sources.get(r.src) ?? sources.set(r.src, { visit: 0, lead: 0, signup: 0, plus: 0 }).get(r.src)!;
    if (r.step in s) s[r.step as keyof typeof s] += r.n;
  }
  const sum = (step: string, test: (r: { src: string; magnet: string }) => boolean = () => true) => rows.filter((r) => r.step === step && test(r)).reduce((a, r) => a + r.n, 0);
  const fromSite = (r: { src: string }) => ["site", "search", "direct"].includes(channelOf(r.src)) || /aspiran\.in/.test(r.src);
  return {
    days, since, daily,
    channels: [...new Set(rows.filter((r) => r.step === "signup").map((r) => channelOf(r.src)))].sort(),
    bySource: [...sources.entries()].map(([source, v]) => ({ source, channel: channelOf(source), ...v })).sort((a, b) => b.signup - a.signup || b.visit - a.visit),
    // Website visitor → app visit → lead → sign-up → Plus. Steps are counted separately (people aren't followed across
    // the website and the app), so read it as a rough funnel, not a path.
    websiteFunnel: [
      { step: "Website page views (free pages)", n: site },
      { step: "Left a number or email on the website", n: sum("lead", fromSite) },
      { step: "Opened the app from the website", n: sum("visit", fromSite) },
      { step: "Signed up from the website", n: sum("signup", fromSite) },
      { step: "Bought Plus (any source)", n: sum("plus") },
    ],
    totals: { visit: sum("visit"), lead: sum("lead"), signup: sum("signup"), plus: sum("plus") },
    refreshed: await getSetting<string | null>(env, "marketing_refreshed", null),
  };
}

// --- People (the CRM) ------------------------------------------------------------------------------------------------

export const STAGES = ["lead", "signed_up", "active", "plus", "quiet"] as const;
export const KINDS = ["student", "centre", "other"] as const;
const QUIET_DAYS = 14, NEW_DAYS = 7;

/** A member's stage from their account and Plus. Lead rows (no member) stay as they are. */
export function memberStage(a: { created_at?: string | null; last_seen_at?: string | null; ends_at?: string | null; test?: number | null; plan_source?: string | null }, now = Date.now()) {
  if (a.ends_at && Date.parse(a.ends_at) > now && !a.test && a.plan_source !== "trial") return "plus";
  const seen = a.last_seen_at ? Date.parse(a.last_seen_at) : null;
  const created = a.created_at ? Date.parse(a.created_at) : now;
  if (now - created < NEW_DAYS * 86400_000) return "signed_up";
  if (seen && now - seen < QUIET_DAYS * 86400_000) return "active";
  return "quiet";
}

/**
 * Brings new leads and sign-ups onto the list and refreshes members' stages. Reads only what changed since the last
 * run (indexes on web_leads.last_seen, try_contacts.at, events(name, day)), plus one row per member on the list.
 */
export async function crmSync(env: Env, now = new Date()) {
  await ensureMarketingSchema(env);
  const magnets = await magnetList(env);
  const iso = now.toISOString();
  const since = await getSetting<string>(env, "crm_synced_at", new Date(now.getTime() - 90 * 86400_000).toISOString());
  const sinceDay = istDay(new Date(Date.parse(since) - 86400_000));
  let added = 0, linked = 0, restaged = 0;

  // Website leads with a contact and a yes.
  const web = (await env.DB.prepare(
    "SELECT visitor_id, name, details, contact, contact_kind, lang, consent_at, source FROM web_leads WHERE last_seen >= ? AND contact IS NOT NULL AND consent_at IS NOT NULL",
  ).bind(since).all<any>()).results ?? [];
  const stmts: D1PreparedStatement[] = [];
  for (const r of web) {
    let d: any = {};
    try { d = JSON.parse(r.details || "{}"); } catch { /* keep {} */ }
    const kind = d.centre ? "centre" : "student";
    const name = (d.centre ? [d.name, d.centre].filter(Boolean).join(", ") : r.name) || null;
    const magnet = d.centre ? "coaching" : d.path ? "try" : (() => { const m = magnetFor(magnets.filter((x) => x.id !== "try"), r.source); return m === "other" ? "chotu" : m; })();
    const consent = d.centre ? "Asked about Aspiran for their centre on aspiran.in/for-coaching and ticked: we can message them." : "Left a number or email on aspiran.in and ticked: we can message them.";
    stmts.push(env.DB.prepare(
      `INSERT INTO crm_people (id, ref, kind, name, contact, contact_kind, stage, source, magnet, lang, consent_text, consent_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'lead', ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(ref) DO UPDATE SET contact = excluded.contact, contact_kind = excluded.contact_kind, name = COALESCE(crm_people.name, excluded.name),
         consent_at = COALESCE(crm_people.consent_at, excluded.consent_at)`,
    ).bind(newId("p_"), "web:" + r.visitor_id, kind, name, r.contact, r.contact_kind, r.source, magnet, r.lang, consent, r.consent_at, iso, iso));
  }
  // Try one topic: a contact left at the end, with the words they agreed to.
  const tc = (await env.DB.prepare("SELECT session_id, contact, contact_kind, consent_text, lang, at FROM try_contacts WHERE at >= ?").bind(since).all<any>()).results ?? [];
  for (const r of tc) {
    stmts.push(env.DB.prepare(
      `INSERT INTO crm_people (id, ref, kind, contact, contact_kind, stage, source, magnet, lang, consent_text, consent_at, created_at, updated_at)
       VALUES (?, ?, 'student', ?, ?, 'lead', 'try', 'try', ?, ?, ?, ?, ?)
       ON CONFLICT(ref) DO UPDATE SET contact = excluded.contact, contact_kind = excluded.contact_kind, consent_text = excluded.consent_text`,
    ).bind(newId("p_"), "try:" + r.session_id, r.contact, r.contact_kind, r.lang, r.consent_text, r.at, iso, iso));
  }
  for (let i = 0; i < stmts.length; i += 50) {
    const res = await env.DB.batch(stmts.slice(i, i + 50));
    added += res.reduce((a, x) => a + (x.meta?.changes ?? 0), 0);
  }

  // New sign-ups: link them to their lead row if their sign-in email or phone matches one, else add them as members.
  const signups = (await env.DB.prepare("SELECT DISTINCT member_id FROM events WHERE name = 'signup' AND day >= ? AND member_id IS NOT NULL").bind(sinceDay).all<{ member_id: string }>()).results ?? [];
  for (const { member_id } of signups) {
    const r = await addMember(env, magnets, member_id, iso);
    if (r === "linked") linked++;
    if (r === "added") added++;
  }

  restaged = await restage(env, now);
  await setSetting(env, "crm_synced_at", iso, "marketing");
  return { added, linked, restaged };
}

/** Puts one member on the list (or links them to the lead row with the same email or phone). */
async function addMember(env: Env, magnets: Magnet[], memberId: string, iso: string): Promise<"there" | "linked" | "added"> {
  if (await env.DB.prepare("SELECT 1 FROM crm_people WHERE member_id = ?").bind(memberId).first()) return "there";
  const acct = await env.DB.prepare("SELECT email, phone FROM accounts WHERE member_id = ?").bind(memberId).first<{ email: string | null; phone: string | null }>().catch(() => null);
  for (const c of [acct?.email, acct?.phone].filter(Boolean) as string[]) {
    const lead = await env.DB.prepare("SELECT id FROM crm_people WHERE contact = ? AND member_id IS NULL LIMIT 1").bind(c).first<{ id: string }>();
    if (lead) {
      await env.DB.prepare("UPDATE crm_people SET member_id = ?, updated_at = ? WHERE id = ?").bind(memberId, iso, lead.id).run();
      return "linked";
    }
  }
  const inst = await env.DB.prepare("SELECT source, referrer, invite_code FROM installs WHERE member_id = ? LIMIT 1").bind(memberId).first<any>().catch(() => null);
  const lang = (await env.DB.prepare("SELECT lang FROM members WHERE member_id = ?").bind(memberId).first<{ lang: string | null }>().catch(() => null))?.lang ?? null;
  const src = inst ? short(inst.source || (inst.invite_code ? "invite" : "direct")) : null;
  await env.DB.prepare(
    `INSERT INTO crm_people (id, ref, kind, member_id, stage, source, magnet, lang, created_at, updated_at) VALUES (?, ?, 'student', ?, 'signed_up', ?, ?, ?, ?, ?)
     ON CONFLICT(ref) DO NOTHING`,
  ).bind(newId("p_"), "member:" + memberId, memberId, src, src ? magnetFor(magnets, src, inst?.referrer) : null, lang, iso, iso).run();
  return "added";
}

/** Members' stages from their account and Plus (owner-set stages are left alone), then the counts per stage. */
async function restage(env: Env, now: Date) {
  const rows = (await env.DB.prepare(
    `SELECT c.id, c.stage, a.created_at, a.last_seen_at, e.ends_at, e.test, e.source AS plan_source FROM crm_people c
     LEFT JOIN accounts a ON a.member_id = c.member_id LEFT JOIN entitlements e ON e.member_id = c.member_id
     WHERE c.member_id IS NOT NULL AND c.stage_by = 'auto'`,
  ).all<any>()).results ?? [];
  const iso = now.toISOString();
  const changes = rows.map((r) => ({ id: r.id, stage: memberStage(r, now.getTime()), was: r.stage })).filter((r) => r.stage !== r.was);
  for (let i = 0; i < changes.length; i += 50) {
    await env.DB.batch(changes.slice(i, i + 50).map((c) => env.DB.prepare("UPDATE crm_people SET stage = ?, updated_at = ? WHERE id = ?").bind(c.stage, iso, c.id)));
  }
  await saveCounts(env);
  return changes.length;
}

/** Counts per stage and kind, and follow-ups due, kept in one settings row so the page doesn't count on every load. */
async function saveCounts(env: Env) {
  const rows = (await env.DB.prepare("SELECT stage, kind, COUNT(*) AS n FROM crm_people GROUP BY stage, kind").all<{ stage: string; kind: string; n: number }>()).results ?? [];
  const due = (await env.DB.prepare("SELECT COUNT(*) AS n FROM crm_people WHERE next_follow_up IS NOT NULL AND next_follow_up <= ?").bind(istDay()).first<{ n: number }>())?.n ?? 0;
  const stages: Record<string, number> = Object.fromEntries(STAGES.map((s) => [s, 0]));
  const kinds: Record<string, number> = Object.fromEntries(KINDS.map((k) => [k, 0]));
  for (const r of rows) { stages[r.stage] = (stages[r.stage] ?? 0) + r.n; kinds[r.kind] = (kinds[r.kind] ?? 0) + r.n; }
  const counts = { stages, kinds, due, total: rows.reduce((a, r) => a + r.n, 0), at: new Date().toISOString() };
  await setSetting(env, "crm_counts", counts, "marketing");
  return counts;
}

/** Once, on the owner's word: every member onto the list (reads every account once). */
export async function crmAddAllMembers(env: Env) {
  await ensureMarketingSchema(env);
  const magnets = await magnetList(env);
  const iso = new Date().toISOString();
  const ids = (await env.DB.prepare("SELECT member_id FROM accounts WHERE member_id IS NOT NULL AND status = 'active' LIMIT 20000").all<{ member_id: string }>()).results ?? [];
  let added = 0, linked = 0;
  for (const { member_id } of ids) {
    const r = await addMember(env, magnets, member_id, iso);
    if (r === "added") added++;
    if (r === "linked") linked++;
  }
  const restaged = await restage(env, new Date());
  return { added, linked, restaged };
}

const COLS = "id, ref, kind, name, contact, contact_kind, member_id, stage, stage_by, source, magnet, lang, tags, notes, next_follow_up, last_contacted, consent_text, consent_at, created_at, updated_at";

/**
 * One page of the list, through an index: ?show=due (follow-ups due today or before), recent (default), or a stage
 * (lead, signed_up, active, plus, quiet). ?kind= narrows. ?q= searches names, contacts, tags and notes (reads the
 * whole list, so only when someone types a search).
 */
export async function crmList(env: Env, url: URL) {
  await ensureMarketingSchema(env);
  const show = url.searchParams.get("show") || "recent";
  const kind = url.searchParams.get("kind") || "";
  const q = (url.searchParams.get("q") || "").trim().slice(0, 60);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 300, 1), url.searchParams.get("format") === "csv" ? 20000 : 1000);
  const where: string[] = [], b: unknown[] = [];
  let order = "updated_at DESC";
  if (show === "due") { where.push("next_follow_up IS NOT NULL AND next_follow_up <= ?"); b.push(istDay()); order = "next_follow_up"; }
  else if (show === "upcoming") { where.push("next_follow_up IS NOT NULL"); order = "next_follow_up"; }
  else if ((STAGES as readonly string[]).includes(show)) { where.push("stage = ?"); b.push(show); }
  if ((KINDS as readonly string[]).includes(kind)) { where.push("kind = ?"); b.push(kind); }
  if (q) {
    where.push("(name LIKE ? OR contact LIKE ? OR tags LIKE ? OR notes LIKE ? OR source LIKE ?)");
    const like = `%${q.replace(/[%_]/g, "")}%`;
    b.push(like, like, like, like, like);
  }
  const rows = (await env.DB.prepare(`SELECT ${COLS} FROM crm_people ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY ${order} LIMIT ?`)
    .bind(...b, limit).all<any>()).results ?? [];
  let counts = await getSetting<any>(env, "crm_counts", null);
  if (!counts) counts = await saveCounts(env);
  return { show, kind, q, rows, counts, synced: await getSetting<string | null>(env, "crm_synced_at", null) };
}

export function crmCsv(rows: any[]) {
  const head = ["name", "kind", "stage", "contact", "contact_kind", "member", "source", "lead_magnet", "language", "tags", "next_follow_up", "last_contacted", "notes", "consent", "consent_at", "added"];
  const cell = (v: unknown) => { let s = v == null ? "" : String(v); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return `"${s.replace(/"/g, '""')}"`; };
  const lines = [head.join(",")].concat(rows.map((r) => [r.name, r.kind, r.stage, r.contact, r.contact_kind, r.member_id ? "yes" : "", r.source, r.magnet, r.lang, r.tags, r.next_follow_up,
    r.last_contacted, r.notes, r.consent_text, r.consent_at, r.created_at].map(cell).join(",")));
  return new Response("﻿" + lines.join("\r\n") + "\r\n", { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="aspiran-people-${istDay()}.csv"` } });
}

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const text = (v: unknown, n: number) => String(v ?? "").replace(/[<>]/g, "").trim().slice(0, n);
const cleanTags = (v: unknown) => [...new Set((Array.isArray(v) ? v : String(v ?? "").split(",")).map((t) => String(t).trim().toLowerCase().replace(/[^\p{L}\p{N} _-]/gu, "").slice(0, 24)).filter(Boolean))].slice(0, 10).join(", ") || null;

/** A phone number (Indian mobile) or an email, cleaned, or an error. */
function cleanContact(raw: unknown): { contact: string | null; kind: string | null } | string {
  const c = text(raw, 80);
  if (!c) return { contact: null, kind: null };
  if (/^\S+@\S+\.\S+$/.test(c)) return { contact: c.toLowerCase(), kind: "email" };
  const digits = c.replace(/[^\d+]/g, "");
  if (/^(\+?91)?[6-9]\d{9}$/.test(digits)) return { contact: "+91" + digits.slice(-10), kind: "phone" };
  return "That doesn't look like an Indian mobile number or an email.";
}

/** The owner adds someone by hand: a contact needs a note of how they agreed to hear from us. */
export async function crmAdd(env: Env, s: Staff, body: any) {
  await ensureMarketingSchema(env);
  const c = cleanContact(body?.contact);
  if (typeof c === "string") return bad(c);
  const consent = text(body?.consent, 300);
  if (c.contact && consent.length < 8) return bad("Write how they agreed to hear from us (for example: \"Asked us to call, at the Hyderabad seminar, 20 Nov\").");
  const name = text(body?.name, 80);
  if (!name && !c.contact) return bad("Give a name or a contact.");
  if (c.contact && (await env.DB.prepare("SELECT 1 FROM crm_people WHERE contact = ?").bind(c.contact).first())) return bad("Someone with that number or email is already on the list. Search for it.", 409);
  const kind = (KINDS as readonly string[]).includes(body?.kind) ? body.kind : "student";
  const iso = new Date().toISOString(), id = newId("p_");
  const follow = DAY_RE.test(String(body?.nextFollowUp ?? "")) ? body.nextFollowUp : null;
  await env.DB.prepare(
    `INSERT INTO crm_people (id, ref, kind, name, contact, contact_kind, stage, stage_by, source, magnet, lang, tags, notes, next_follow_up, consent_text, consent_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'lead', 'owner', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(id, "owner:" + id, kind, name || null, c.contact, c.kind, text(body?.source, 60) || "added by hand", text(body?.magnet, 24) || null,
    body?.lang === "hi" ? "hi" : body?.lang === "te" ? "te" : "en", cleanTags(body?.tags), text(body?.notes, 2000) || null, follow,
    c.contact ? `${consent} (written down by ${label(s)})` : null, c.contact ? iso : null, iso, iso).run();
  await saveCounts(env);
  return json({ ok: true, id });
}

/** Edit stage, kind, name, language, tags, notes and the next follow-up date. */
export async function crmUpdate(env: Env, id: string, body: any) {
  await ensureMarketingSchema(env);
  const row = await env.DB.prepare(`SELECT ${COLS} FROM crm_people WHERE id = ?`).bind(id).first<any>();
  if (!row) return bad("That person isn't on the list any more.", 404);
  const set: string[] = [], b: unknown[] = [];
  const put = (col: string, v: unknown) => { set.push(`${col} = ?`); b.push(v); };
  if ("stage" in body) {
    if (body.stage === "auto") { if (!row.member_id) return bad("Only members' stages can follow the app. Pick a stage."); put("stage_by", "auto"); }
    else if ((STAGES as readonly string[]).includes(body.stage)) { put("stage", body.stage); put("stage_by", "owner"); }
    else return bad("Pick a stage: lead, signed up, active, Plus or gone quiet.");
  }
  if ("kind" in body) { if (!(KINDS as readonly string[]).includes(body.kind)) return bad("Pick student, coaching centre or other."); put("kind", body.kind); }
  if ("name" in body) put("name", text(body.name, 80) || null);
  if ("lang" in body) put("lang", ["en", "hi", "te"].includes(body.lang) ? body.lang : null);
  if ("tags" in body) put("tags", cleanTags(body.tags));
  if ("notes" in body) put("notes", text(body.notes, 2000) || null);
  if ("nextFollowUp" in body) {
    if (body.nextFollowUp && !DAY_RE.test(String(body.nextFollowUp))) return bad("Pick a date for the next follow-up.");
    put("next_follow_up", body.nextFollowUp || null);
  }
  if (!set.length) return bad("Nothing to change.");
  put("updated_at", new Date().toISOString());
  await env.DB.prepare(`UPDATE crm_people SET ${set.join(", ")} WHERE id = ?`).bind(...b, id).run();
  if ("stage" in body && body.stage === "auto") await restage(env, new Date());
  else if ("stage" in body || "kind" in body || "nextFollowUp" in body) await saveCounts(env);
  return json({ ok: true });
}

/** The owner sent a message by hand: note it, with the day, and set (or clear) the next follow-up. */
export async function crmContacted(env: Env, s: Staff, id: string, body: any) {
  await ensureMarketingSchema(env);
  const row = await env.DB.prepare("SELECT notes FROM crm_people WHERE id = ?").bind(id).first<{ notes: string | null }>();
  if (!row) return bad("That person isn't on the list any more.", 404);
  const follow = body?.nextFollowUp && DAY_RE.test(String(body.nextFollowUp)) ? body.nextFollowUp : null;
  const what = text(body?.note, 300) || "Messaged";
  const line = `${istDay()} ${label(s)}: ${what}${body?.via ? ` (${text(body.via, 20)})` : ""}`;
  const notes = (row.notes ? row.notes + "\n" : "") + line;
  const iso = new Date().toISOString();
  await env.DB.prepare("UPDATE crm_people SET last_contacted = ?, notes = ?, next_follow_up = ?, updated_at = ? WHERE id = ?").bind(iso, notes.slice(-4000), follow, iso, id).run();
  await saveCounts(env);
  return json({ ok: true });
}

/**
 * A data request ("delete what you have about me"): off the list, and out of where they came in. A member's account
 * stays until it's erased under Data requests (which removes them from here too); the reply says so.
 */
export async function crmForget(env: Env, id: string) {
  await ensureMarketingSchema(env);
  const row = await env.DB.prepare("SELECT ref, contact, member_id FROM crm_people WHERE id = ?").bind(id).first<{ ref: string; contact: string | null; member_id: string | null }>();
  if (!row) return bad("That person isn't on the list any more.", 404);
  const [kind, ref] = [row.ref.split(":")[0], row.ref.slice(row.ref.indexOf(":") + 1)];
  const stmts = [env.DB.prepare("DELETE FROM crm_people WHERE id = ?").bind(id)];
  if (kind === "web") stmts.push(env.DB.prepare("DELETE FROM web_leads WHERE visitor_id = ?").bind(ref), env.DB.prepare("DELETE FROM web_chats WHERE visitor_id = ?").bind(ref));
  if (kind === "try") stmts.push(env.DB.prepare("DELETE FROM try_feedback WHERE session_id = ?").bind(ref), env.DB.prepare("DELETE FROM try_contacts WHERE session_id = ?").bind(ref),
    env.DB.prepare("DELETE FROM try_recall WHERE session_id = ?").bind(ref));
  // The same contact left elsewhere (another browser, the demo) goes too.
  if (row.contact) stmts.push(env.DB.prepare("DELETE FROM try_contacts WHERE contact = ?").bind(row.contact), env.DB.prepare("DELETE FROM web_leads WHERE contact = ?").bind(row.contact));
  const now = new Date().toISOString();
  stmts.push(env.DB.prepare("INSERT INTO privacy_requests (kind, member_hash, via, status, at, done_at, done_by) VALUES ('lead_delete', ?, 'admin', 'done', ?, ?, 'marketing')")
    .bind(await sha256Hex(row.contact || row.ref), now, now));
  await env.DB.batch(stmts);
  await saveCounts(env);
  return json({ ok: true, member: !!row.member_id, note: row.member_id ? "Off the marketing list. They still have an account: to erase it, use Data requests." : "Deleted everywhere." });
}

/** Erasing a member (privacy.ts) removes them from the list too. */
export async function forgetCrmMember(env: Env, memberId: string) {
  await env.DB.prepare("DELETE FROM crm_people WHERE member_id = ?").bind(memberId).run().catch(() => {});
}
/** "Delete what I sent" at the end of Try one topic. */
export async function forgetCrmTry(env: Env, sessionId: string) {
  await env.DB.prepare("DELETE FROM crm_people WHERE ref = ?").bind("try:" + sessionId).run().catch(() => {});
}
/** A member's export (privacy.ts): what the list says about them. */
export async function crmExport(env: Env, memberId: string) {
  return (await env.DB.prepare("SELECT kind, name, stage, source, magnet, lang, tags, notes, next_follow_up, last_contacted, consent_text, consent_at, created_at FROM crm_people WHERE member_id = ?")
    .bind(memberId).all().catch(() => ({ results: [] }))).results ?? [];
}

// --- Admin routes ----------------------------------------------------------------------------------------------------

type Route = (method: string, re: RegExp, perm: string, fn: (ctx: { req: Request; env: Env; s: Staff; body: any; url: URL; m: RegExpMatchArray }) => Promise<Response>) => void;

/**
 * Counts (lead magnets, sign-ups) need "analytics". The people list shows contacts, so it needs "flags" (admins, as
 * for Payments), and "Delete everywhere" needs "privacy".
 */
export function marketingRoutes(route: Route) {
  route("GET", /^marketing\/magnets$/, "analytics", async ({ env, url }) => json(await magnetsReport(env, daysParam(url))));
  route("POST", /^marketing\/magnets$/, "flags", async ({ env, s, body }) => {
    const list = cleanMagnets(body?.magnets);
    if (typeof list === "string") return bad(list);
    await setSetting(env, MAGNETS_KEY, list, label(s));
    return json({ ok: true, magnets: list });
  });
  route("GET", /^marketing\/signups$/, "analytics", async ({ env, url }) => json(await signupsReport(env, daysParam(url))));
  // Recount today and yesterday now (the nightly run does yesterday at 00:30), and bring new people onto the list.
  route("POST", /^marketing\/refresh$/, "analytics", async ({ env }) => {
    const today = istDay();
    const a = await rollupDay(env, addDays(today, -1)), b = await rollupDay(env, today);
    const crm = await crmSync(env);
    await setSetting(env, "marketing_refreshed", new Date().toISOString(), "marketing");
    return json({ ok: true, days: [a, b], crm });
  });
  route("GET", /^crm$/, "flags", async ({ env, url }) => {
    const d = await crmList(env, url);
    return url.searchParams.get("format") === "csv" ? crmCsv(d.rows) : json(d);
  });
  route("POST", /^crm$/, "flags", async ({ env, s, body }) => crmAdd(env, s, body));
  route("POST", /^crm\/add-members$/, "flags", async ({ env }) => json(await crmAddAllMembers(env)));
  route("POST", /^crm\/(p_[0-9a-f]{16})$/, "flags", async ({ env, body, m }) => crmUpdate(env, m[1], body ?? {}));
  route("POST", /^crm\/(p_[0-9a-f]{16})\/contacted$/, "flags", async ({ env, s, body, m }) => crmContacted(env, s, m[1], body));
  route("POST", /^crm\/(p_[0-9a-f]{16})\/forget$/, "privacy", async ({ env, m }) => crmForget(env, m[1]));
}
