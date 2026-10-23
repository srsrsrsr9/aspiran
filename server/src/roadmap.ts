/**
 * The free roadmap builder (Chotu's Plan tab and Prep → My Plan): a one-page roadmap from a short goal form, and a
 * weekly plan rebuilt each Monday from what was actually done. Rules plus a syllabus map, no AI model, no account
 * needed, and nothing is stored on the server: the apps send the form, get the plan back and keep it on the device.
 *
 * Honest by design: hours are estimates for one careful first pass, milestones are checks you can do yourself, and
 * nothing here predicts a rank, a score or a result. English only.
 */

// No imports, so the tests can load this file directly with node.
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*" } });

const DAY = 86_400_000;

// --- Syllabus map ---------------------------------------------------------------------------------------------
// Hours for one careful first pass (reading plus short notes), for an average aspirant. GS2 Polity is mapped unit by
// unit first; the other subjects are whole-subject estimates until their maps are written.

export interface Unit { name: string; hours: number; sources: string; check: string }
export interface Subject { id: string; name: string; paper: string; hours: number; units?: Unit[]; prelims: boolean }

export const POLITY_UNITS: Unit[] = [
  { name: "Making of the Constitution, Preamble, salient features", hours: 6, sources: "Laxmikanth ch. 1–4; NCERT Class 11 'Constitution at Work' ch. 1", check: "Explain 'sovereign, socialist, secular, democratic republic' in 50 words" },
  { name: "Union and territory, citizenship", hours: 4, sources: "Laxmikanth ch. 5–6", check: "List the ways citizenship is acquired and lost" },
  { name: "Fundamental Rights", hours: 10, sources: "Laxmikanth ch. 7; landmark cases list", check: "20 Prelims questions on Articles 12–35" },
  { name: "Directive Principles and Fundamental Duties", hours: 5, sources: "Laxmikanth ch. 8–9", check: "One 150-word answer: DPSP vs Fundamental Rights" },
  { name: "Amendment and basic structure", hours: 5, sources: "Laxmikanth ch. 10–11; Kesavananda, Minerva Mills", check: "Name five basic-structure elements and the case for each" },
  { name: "Parliamentary system and federalism, Centre–State relations", hours: 8, sources: "Laxmikanth ch. 12–15", check: "One answer on cooperative federalism with two current examples" },
  { name: "Emergency provisions", hours: 3, sources: "Laxmikanth ch. 16", check: "Compare Articles 352, 356 and 360 in a table" },
  { name: "Union executive: President, Vice-President, PM, Council of Ministers", hours: 8, sources: "Laxmikanth ch. 17–20", check: "20 Prelims questions on the Union executive" },
  { name: "Parliament: houses, sessions, bills, committees", hours: 12, sources: "Laxmikanth ch. 22–24; PRS bill summaries", check: "Draw the journey of an ordinary bill from memory" },
  { name: "Judiciary: Supreme Court, High Courts, judicial review, PIL", hours: 8, sources: "Laxmikanth ch. 26–29", check: "One answer on judicial activism vs overreach" },
  { name: "State government and special provisions", hours: 6, sources: "Laxmikanth ch. 30–35", check: "Governor's discretionary powers in 5 points" },
  { name: "Local government: panchayats and municipalities", hours: 5, sources: "Laxmikanth ch. 38–39; 73rd/74th Amendments", check: "One answer on why local bodies lack funds" },
  { name: "Constitutional bodies: ECI, UPSC, CAG, Finance Commission and others", hours: 6, sources: "Laxmikanth ch. 41–50", check: "A one-page table: body, article, appointment, removal" },
  { name: "Statutory and non-constitutional bodies: NITI Aayog, NHRC, CIC, Lokpal", hours: 5, sources: "Laxmikanth ch. 51–58", check: "15 Prelims questions on these bodies" },
  { name: "Elections, anti-defection, Representation of the People Act", hours: 4, sources: "Laxmikanth ch. 67–70", check: "One answer on electoral reforms" },
];

export const SUBJECTS: Subject[] = [
  { id: "polity", name: "Polity and Constitution", paper: "GS2", hours: POLITY_UNITS.reduce((n, u) => n + u.hours, 0), units: POLITY_UNITS, prelims: true },
  { id: "modern", name: "Modern Indian History", paper: "GS1", hours: 70, prelims: true },
  { id: "geography", name: "Geography (India and world)", paper: "GS1", hours: 90, prelims: true },
  { id: "economy", name: "Indian Economy", paper: "GS3", hours: 90, prelims: true },
  { id: "environment", name: "Environment and Ecology", paper: "GS3", hours: 50, prelims: true },
  { id: "ancient", name: "Ancient, Medieval History and Art & Culture", paper: "GS1", hours: 80, prelims: true },
  { id: "scitech", name: "Science and Technology", paper: "GS3", hours: 40, prelims: true },
  { id: "society", name: "Indian Society", paper: "GS1", hours: 25, prelims: false },
  { id: "governance", name: "Governance and Social Justice", paper: "GS2", hours: 40, prelims: false },
  { id: "ir", name: "International Relations", paper: "GS2", hours: 40, prelims: true },
  { id: "security", name: "Internal Security and Disaster Management", paper: "GS3", hours: 30, prelims: false },
  { id: "ethics", name: "Ethics, Integrity and Aptitude", paper: "GS4", hours: 60, prelims: false },
  { id: "essay", name: "Essay practice", paper: "Essay", hours: 20, prelims: false },
  { id: "csat", name: "CSAT (Paper II)", paper: "CSAT", hours: 40, prelims: true },
];
const OPTIONAL_HOURS = 250;

export const PAPERS = ["GS1", "GS2", "GS3", "GS4", "Essay", "CSAT", "Optional"] as const;

// --- The goal form ---------------------------------------------------------------------------------------------

export interface Goal {
  examYear: number;          // the Prelims year
  attempt: number;           // 1, 2, 3 (3 = third or later)
  optional: string;          // free choice of optional subject, shown back as written ("" = not chosen yet)
  hoursPerDay: number;       // 1–14
  working: boolean;          // working or studying full-time
  weakPapers: string[];      // from PAPERS
}

export function readGoal(b: any, now = new Date()): Goal | string {
  const year = Math.round(Number(b?.examYear));
  const thisYear = now.getUTCFullYear();
  if (!(year >= thisYear && year <= thisYear + 4)) return `examYear must be between ${thisYear} and ${thisYear + 4}`;
  const attempt = Math.min(Math.max(Math.round(Number(b?.attempt) || 1), 1), 3);
  const hours = Number(b?.hoursPerDay);
  if (!(hours >= 1 && hours <= 14)) return "hoursPerDay must be between 1 and 14";
  const optional = String(b?.optional ?? "").replace(/[^\p{L}\p{N} &(),.-]/gu, "").trim().slice(0, 40);
  const weak = Array.isArray(b?.weakPapers) ? [...new Set(b.weakPapers.map(String).filter((p: string) => (PAPERS as readonly string[]).includes(p)))] as string[] : [];
  return { examYear: year, attempt, optional, hoursPerDay: Math.round(hours * 2) / 2, working: !!b?.working, weakPapers: weak };
}

/** Prelims is usually on the last Sunday of May; the plan counts to that and says it's an estimate. */
export function prelimsDate(year: number) {
  const d = new Date(Date.UTC(year, 4, 31));
  d.setUTCDate(31 - d.getUTCDay());
  return d;
}
const iso = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * DAY);
const mondayOf = (d: Date) => { const x = new Date(iso(d) + "T00:00:00Z"); x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7)); return x; };
/** The Monday a plan starts on: this week's, or next week's when it's already Sunday. */
const startMonday = (d: Date) => addDays(mondayOf(d), d.getUTCDay() === 0 ? 7 : 0);

// --- The roadmap -------------------------------------------------------------------------------------------------

export interface Phase { id: string; name: string; from: string; to: string; weeks: number; focus: string; subjects: string[] }
export interface Roadmap {
  goal: Goal;
  prelims: string;
  weeksLeft: number;
  studyDays: number;
  hoursPerWeek: number;
  split: { gs: number; optional: number; answers: number; current: number; tests: number };
  phases: Phase[];
  order: { id: string; name: string; paper: string; hours: number; weeks: number }[];
  milestones: { title: string; by: string; check: string }[];
  polity: Unit[];
  notes: string[];
  tooShort: boolean;
}

/** Subject order: Polity first (the map starts there), then the usual base order, with weak papers moved up. */
export function subjectOrder(goal: Goal): Subject[] {
  const weak = new Set(goal.weakPapers);
  const rank = (s: Subject, i: number) => (s.id === "polity" ? -100 : 0) + i - (weak.has(s.paper) ? 6 : 0) + (s.id === "essay" ? 50 : 0);
  return SUBJECTS.map((s, i) => ({ s, r: rank(s, i) })).sort((a, b) => a.r - b.r).map((x) => x.s);
}

export function buildRoadmap(goal: Goal, now = new Date()): Roadmap {
  const today = new Date(iso(now) + "T00:00:00Z");
  const prelims = prelimsDate(goal.examYear);
  const weeksLeft = Math.max(0, Math.floor((prelims.getTime() - today.getTime()) / (7 * DAY)));
  const studyDays = goal.working ? 6 : 6; // one day off a week, either way
  const hoursPerWeek = Math.round(goal.hoursPerDay * studyDays);
  const hasOptional = !!goal.optional;
  const repeater = goal.attempt >= 2;

  // How a week is shared out. Working aspirants keep answers and tests smaller; weak Essay or GS4 gets more answers.
  const answers = goal.weakPapers.some((p) => p === "Essay" || p === "GS4") ? 15 : 10;
  const split = hasOptional
    ? { gs: 45, optional: 25, answers, current: 10, tests: 20 - answers }
    : { gs: 65, optional: 0, answers, current: 10, tests: 25 - answers };
  if (split.tests < 5) { split.gs -= 5 - split.tests; split.tests = 5; }

  // Phases, counted back from Prelims. Prelims-only for the last 16 weeks (12 if time is short); a foundation phase
  // only for a first attempt with more than 40 weeks; repeaters start with a revision base instead.
  const prelimsWeeks = Math.min(weeksLeft, weeksLeft >= 30 ? 16 : 12);
  const before = weeksLeft - prelimsWeeks;
  const foundationWeeks = !repeater && before > 24 ? Math.min(Math.round(before * 0.3), 20) : repeater && before > 12 ? Math.min(8, Math.round(before * 0.2)) : 0;
  const coreWeeks = before - foundationWeeks;
  const order = subjectOrder(goal);
  const prelimsOrder = order.filter((s) => s.prelims);

  const phases: Phase[] = [];
  let cursor = startMonday(today);
  const phase = (id: string, name: string, weeks: number, focus: string, subjects: string[]) => {
    if (weeks <= 0) return;
    const from = cursor, to = addDays(cursor, weeks * 7 - 1);
    phases.push({ id, name, from: iso(from), to: iso(to), weeks, focus, subjects });
    cursor = addDays(to, 1);
  };
  phase("foundation", repeater ? "Revision base" : "Foundation", foundationWeeks,
    repeater ? "Re-read your own notes for the static subjects and fix the gaps from last attempt's paper." : "NCERTs (Class 6–12) for History, Geography, Polity and Economy, with one-page notes. Start a daily Chai habit.",
    order.slice(0, 4).map((s) => s.name));
  phase("core", "Core GS" + (hasOptional ? " + optional" : "") + " with answer writing", coreWeeks,
    `One subject at a time in the order below, ${hasOptional ? "the optional in parallel, " : ""}two Mains answers a week from the subject you're on, and current affairs every day.`,
    order.filter((s) => s.id !== "csat").map((s) => s.name).concat(hasOptional ? [`Optional: ${goal.optional}`] : []));
  phase("prelims", "Prelims focus", prelimsWeeks,
    "MCQs every day, revision rounds of the Prelims subjects, CSAT practice, and a full mock every week from week 4 of this phase.",
    prelimsOrder.map((s) => s.name));

  // Weeks per subject in the core phase, in proportion to its hours, at the GS share of the week.
  const gsHoursPerWeek = Math.max(1, hoursPerWeek * (split.gs / 100));
  const orderOut = order.map((s) => {
    const hours = Math.round(s.hours * (goal.weakPapers.includes(s.paper) ? 1.25 : 1) * (repeater ? 0.6 : 1));
    return { id: s.id, name: s.name, paper: s.paper, hours, weeks: Math.max(1, Math.round(hours / gsHoursPerWeek)) };
  });
  if (hasOptional) orderOut.push({ id: "optional", name: `Optional: ${goal.optional}`, paper: "Optional", hours: Math.round(OPTIONAL_HOURS * (repeater ? 0.6 : 1)), weeks: Math.max(1, Math.round(OPTIONAL_HOURS / Math.max(1, hoursPerWeek * (split.optional / 100)))) });

  const totalGs = orderOut.filter((s) => s.paper !== "Optional").reduce((n, s) => n + s.hours, 0);
  const capacity = Math.round(before * gsHoursPerWeek + prelimsWeeks * hoursPerWeek * 0.6);
  const tooShort = capacity < totalGs * 0.8;

  // Three milestone checks you can do yourself. Never a score prediction.
  const at = (frac: number) => iso(addDays(startMonday(today), Math.max(1, Math.round(weeksLeft * frac)) * 7));
  const prelimsFrom = phases.find((p) => p.id === "prelims")?.from;
  // The base check comes once the first two subjects should be read (after any foundation), at least 4 weeks
  // before the coverage check.
  const baseWeeks = foundationWeeks + (orderOut[0]?.weeks ?? 2) + (orderOut[1]?.weeks ?? 2);
  let baseBy = iso(addDays(startMonday(today), baseWeeks * 7 - 1));
  if (prelimsFrom && baseBy > iso(addDays(new Date(prelimsFrom + "T00:00:00Z"), -28))) baseBy = iso(addDays(new Date(prelimsFrom + "T00:00:00Z"), -28));
  if (baseBy < iso(addDays(startMonday(today), 27))) baseBy = iso(addDays(startMonday(today), 27));
  const milestones = [
    { title: "Base check", by: baseBy, check: `${order[0].name} and ${order[1].name} read once with notes; 50 Prelims questions on them; 6 Mains answers written.` },
    { title: "Coverage check", by: phases.find((p) => p.id === "prelims")?.from ?? at(0.7), check: `Every GS subject read once${hasOptional ? ", the optional halfway" : ""}; 2 full Prelims mocks attempted and reviewed; 25 Mains answers written.` },
    { title: "Revision check", by: iso(addDays(prelims, -28)), check: "Two revision rounds of the Prelims subjects done; 8 full mocks attempted, each with its error log; CSAT practised weekly." },
  ];

  const notes = [
    `Prelims ${goal.examYear} is expected around ${iso(prelims)} (the last Sunday of May). Check the UPSC calendar when it's out.`,
    "Hours are estimates for one careful first pass. If a week goes badly, the weekly plan gets smaller, not longer.",
  ];
  if (goal.working) notes.push("Working and studying: protect a fixed daily slot (for example 6 to 8 am) and keep weekends for tests and answers.");
  if (tooShort) notes.push("At these hours the full syllabus won't fit before Prelims. The plan puts the Prelims subjects first; a later exam year is also an option to consider.");
  if (repeater) notes.push("As a repeater, start from your last paper: list the topics where marks leaked and put them first.");

  return { goal, prelims: iso(prelims), weeksLeft, studyDays, hoursPerWeek, split, phases, order: orderOut, milestones, polity: POLITY_UNITS, notes, tooShort };
}

// --- The weekly plan ---------------------------------------------------------------------------------------------

export interface WeekDone { hours?: number; subjectsDone?: string[]; unitsDone?: string[]; answers?: number; mocks?: number }
export interface WeekPlan {
  week: string;
  phase: string;
  targetHours: number;
  smaller: boolean;
  subject: { id: string; name: string } | null;
  units: string[];
  days: { day: string; blocks: { minutes: number; what: string }[] }[];
  line: string;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/** The plan for the week starting on [now]'s Monday, rebuilt from last week's [done]. */
export function buildWeek(goal: Goal, done: WeekDone, now = new Date()): WeekPlan {
  const rm = buildRoadmap(goal, now);
  const monday = mondayOf(now);
  const phase = rm.phases.find((p) => p.from <= iso(now) && iso(now) <= p.to) ?? rm.phases[rm.phases.length - 1];
  const last = Math.max(0, Number(done.hours) || 0);
  // A hard week makes the next one smaller (never bigger than the roadmap's week).
  const smaller = last > 0 && last < rm.hoursPerWeek * 0.6;
  const targetHours = smaller ? Math.max(Math.round(last * 1.2), Math.round(rm.hoursPerWeek * 0.5)) : rm.hoursPerWeek;
  const finished = new Set(done.subjectsDone ?? []);
  const pool = phase?.id === "prelims" ? rm.order.filter((s) => SUBJECTS.find((x) => x.id === s.id)?.prelims) : rm.order.filter((s) => s.paper !== "Optional");
  const next = pool.find((s) => !finished.has(s.id)) ?? pool[0] ?? null;
  const unitsDone = new Set(done.unitsDone ?? []);
  // Polity: as many of the next units as this week's GS hours cover, spread across the six study days in order.
  const gsWeekHours = (targetHours * rm.split.gs) / 100;
  const left = next?.id === "polity" ? POLITY_UNITS.filter((u) => !unitsDone.has(u.name)) : [];
  const units: string[] = [];
  const dayUnit: string[] = [];
  { let h = 0; for (const u of left) { if (h >= gsWeekHours) break; units.push(u.name); h += u.hours; }
    for (let i = 0; i < 6; i++) { const at = ((i + 0.5) * gsWeekHours) / 6; let c = 0; dayUnit[i] = units[units.length - 1] ?? "";
      for (const u of left.slice(0, units.length)) { c += u.hours; if (at < c) { dayUnit[i] = u.name; break; } } } }

  const minutesPerDay = Math.round((targetHours * 60) / rm.studyDays / 15) * 15;
  const gs = Math.round((minutesPerDay * rm.split.gs) / 100 / 15) * 15;
  const opt = Math.round((minutesPerDay * rm.split.optional) / 100 / 15) * 15;
  const ca = Math.max(15, Math.round((minutesPerDay * rm.split.current) / 100 / 15) * 15);
  const days = DAYS.map((name, i) => {
    if (i === 6) return { day: name, blocks: [{ minutes: 0, what: "Rest day. If you want to, close the week and look at what went well." }] };
    const blocks: { minutes: number; what: string }[] = [{ minutes: ca, what: "Today's Chai and one current-affairs note" }];
    if (phase?.id === "prelims") {
      blocks.push({ minutes: gs, what: `${next?.name ?? "Revision"}: revise and do 25 MCQs` });
      if (i === 5) blocks.push({ minutes: 120, what: "Full Prelims mock, then the error log" });
      else if (i % 2 === 1) blocks.push({ minutes: 45, what: "CSAT practice" });
    } else {
      const unit = dayUnit[i];
      blocks.push({ minutes: gs, what: `${next?.name ?? "GS"}${unit ? `: ${unit}` : ""}` });
      if (opt) blocks.push({ minutes: opt, what: `Optional: ${goal.optional}` });
      if (i === 1 || i === 3) blocks.push({ minutes: 30, what: "One Mains answer (150 words) from this week's topic" });
      if (i === 5) blocks.push({ minutes: 60, what: "Weekly test: 50 MCQs on what you read, then revise the mistakes" });
    }
    return { day: name, blocks: blocks.filter((b) => b.minutes > 0) };
  });
  const line = smaller
    ? `Last week was ${last} hours, so this week is smaller: about ${targetHours} hours. Getting back into rhythm matters more than catching up.`
    : `About ${targetHours} hours this week${next ? `, mostly ${next.name}` : ""}.`;
  return { week: iso(monday), phase: phase?.name ?? "", targetHours, smaller, subject: next ? { id: next.id, name: next.name } : null, units, days, line };
}

// --- Routes: POST /roadmap and POST /roadmap/week. Nothing is stored. -------------------------------------------

export async function roadmapRoute(req: Request, path: string): Promise<Response | null> {
  if (path === "/roadmap/syllabus" && req.method === "GET") return json({ subjects: SUBJECTS.map(({ units, ...s }) => s), polity: POLITY_UNITS, papers: PAPERS });
  if (path !== "/roadmap" && path !== "/roadmap/week") return null;
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  const body = await req.json<any>().catch(() => null);
  const goal = readGoal(body?.goal ?? body);
  if (typeof goal === "string") return json({ error: goal }, 400);
  if (path === "/roadmap") return json(buildRoadmap(goal));
  return json(buildWeek(goal, body?.done ?? {}));
}
