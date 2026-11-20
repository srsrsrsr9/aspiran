import { type Env, istDay } from "./shared";
import { NODES } from "../public/app/syllabus.js";

/**
 * Institute console → Reports (artefacts/analytics-scope-2026-11-20.md, part 3). Our own database only: an
 * organisation's reports never touch PostHog.
 *
 * Only what a student agreed to when joining (institute.js, "What your institute will see"): the days they used
 * Aspiran and their focus minutes since joining, their answers to the centre's question sets and tests, their doubts,
 * and their ticks on its plan. Never pods, rooms, Chotu, Calm, the journal, their own Aspiran practice and mocks,
 * Plus, or anything from before they joined or after they left (a student who leaves drops out at once: only active
 * members are read).
 *
 * Rules: no rankings, no leaderboards, no "top students". Batch figures (and weak topics) show only when the batch
 * has at least MIN_BATCH students, so nobody is singled out. Per-student rows are sorted by name.
 */

export const MIN_BATCH = 5;
const DAY = 86400_000;
const QUIET_DAYS = 5;
const nodeName = (id: string | null) => (id ? NODES.find((n: any) => n.id === id)?.name ?? id : null);
const paperOf = (id: string | null) => (id ? NODES.find((n: any) => n.id === id)?.paper.short ?? null : null);
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : null);

interface Student { member_id: string; display_name: string; batch_id: string | null; joined_at: string; last_active_at: string | null }

/** What a student last did, as a code the console turns into words. Only from what the centre may see. */
type LastDid = "question_set" | "doubt" | "chat" | "plan" | "focus" | "app";

export async function instReports(env: Env, instId: string, batchFilter: string | null, now = Date.now()) {
  const all = async <T = any>(sql: string, ...b: unknown[]) => (await env.DB.prepare(sql).bind(...b).all<T>()).results;
  const weekStart = new Date(now - 7 * DAY).toISOString();
  const weekDay = istDay(new Date(now - 6 * DAY));

  const batches = await all<{ id: string; name: string; archived_at: string | null }>(
    "SELECT id, name, archived_at FROM inst_batches WHERE institute_id = ? ORDER BY archived_at IS NOT NULL, created_at", instId);
  const students = await all<Student>(
    `SELECT member_id, display_name, batch_id, joined_at, last_active_at FROM inst_members WHERE institute_id = ? AND role = 'student' AND status = 'active'
     ${batchFilter ? "AND batch_id = ?" : ""} ORDER BY display_name COLLATE NOCASE`, ...(batchFilter ? [instId, batchFilter] : [instId]));
  const ids = students.map((s) => s.member_id);
  const q = ids.map(() => "?").join(",") || "NULL";
  const joinedOf = new Map(students.map((s) => [s.member_id, s.joined_at]));
  const since = (r: { member_id: string; at: string }) => r.at >= (joinedOf.get(r.member_id) ?? "9");

  // Everything below is read for these students only, and kept only from when each joined.
  const events = ids.length ? (await all<{ member_id: string; name: string; props: string | null; day: string; at: string }>(
    `SELECT member_id, name, props, day, at FROM events WHERE member_id IN (${q}) AND at >= ?`, ...ids, new Date(now - 60 * DAY).toISOString())).filter(since) : [];
  const attempts = ids.length ? (await all<{ member_id: string; content_id: string; node_id: string | null; right_n: number; total: number; at: string }>(
    `SELECT member_id, content_id, node_id, right_n, total, at FROM inst_attempts WHERE institute_id = ? AND member_id IN (${q})`, instId, ...ids)).filter(since) : [];
  const doubts = ids.length ? (await all<{ id: string; member_id: string; batch_id: string | null; status: string; created_at: string }>(
    `SELECT id, member_id, batch_id, status, created_at FROM inst_doubts WHERE institute_id = ? AND member_id IN (${q})`, instId, ...ids)) : [];
  const firstReplies = doubts.length ? await all<{ doubt_id: string; at: string }>(
    `SELECT doubt_id, MIN(at) AS at FROM inst_doubt_replies WHERE institute_id = ? AND role != 'student' AND member_id IS NOT NULL GROUP BY doubt_id`, instId) : [];
  const replyAt = new Map(firstReplies.map((r) => [r.doubt_id, r.at]));
  const messages = ids.length ? (await all<{ member_id: string; at: string }>(
    `SELECT member_id, at FROM inst_messages WHERE institute_id = ? AND member_id IN (${q}) AND at >= ?`, instId, ...ids, new Date(now - 60 * DAY).toISOString())) : [];
  const ticks = ids.length ? (await all<{ member_id: string; done_at: string }>(
    `SELECT member_id, done_at FROM inst_plan_done WHERE institute_id = ? AND member_id IN (${q})`, instId, ...ids)) : [];
  const seen = ids.length ? await all<{ member_id: string; last_seen_at: string | null }>(`SELECT member_id, last_seen_at FROM accounts WHERE member_id IN (${q})`, ...ids) : [];

  // --- Per student (sorted by name; never ranked) ---
  const per = students.map((s) => {
    const mine = <T extends { member_id: string }>(l: T[]) => l.filter((r) => r.member_id === s.member_id);
    const ev = mine(events), at = mine(attempts), dq = mine(doubts).filter((d) => d.created_at >= s.joined_at), msg = mine(messages).filter((m) => m.at >= s.joined_at);
    const tk = mine(ticks).filter((t) => t.done_at >= s.joined_at);
    const minutes = (list: typeof ev) => list.filter((e) => e.name === "prep_minutes").reduce((n, e) => n + (Number(JSON.parse(e.props ?? "{}").minutes) || 0), 0);
    const answered = at.reduce((n, a) => n + a.total, 0), right = at.reduce((n, a) => n + a.right_n, 0);
    const weekAt = at.filter((a) => a.at >= weekStart);
    const activeWeek = new Set([...ev.filter((e) => e.at >= weekStart).map((e) => e.day), ...weekAt.map((a) => istDay(new Date(a.at))),
      ...msg.filter((m) => m.at >= weekStart).map((m) => istDay(new Date(m.at)))]).size > 0;
    // The last thing they did that the centre may see, and when.
    const last: [string, LastDid][] = [
      ...at.map((a) => [a.at, "question_set"] as [string, LastDid]), ...dq.map((d) => [d.created_at, "doubt"] as [string, LastDid]),
      ...msg.map((m) => [m.at, "chat"] as [string, LastDid]), ...tk.map((t) => [t.done_at, "plan"] as [string, LastDid]),
      ...ev.filter((e) => e.name === "prep_minutes").map((e) => [e.at, "focus"] as [string, LastDid]),
      ...ev.map((e) => [e.at, "app"] as [string, LastDid]),
    ];
    for (const at of [mine(seen)[0]?.last_seen_at, s.last_active_at]) if (at && at >= s.joined_at) last.push([at, "app"]);
    last.sort((a, b) => (a[0] < b[0] ? 1 : a[0] > b[0] ? -1 : a[1] === "app" ? 1 : -1));
    const lastActive = last[0]?.[0] ?? null;
    return {
      memberId: s.member_id, name: s.display_name, batchId: s.batch_id, joinedAt: s.joined_at,
      lastActive, lastDid: last[0]?.[1] ?? null,
      quiet: !lastActive || now - Date.parse(lastActive) >= QUIET_DAYS * DAY,
      activeThisWeek: activeWeek,
      focusMinutesWeek: minutes(ev.filter((e) => e.at >= weekStart)), focusMinutes: minutes(ev),
      answeredWeek: weekAt.reduce((n, a) => n + a.total, 0),
      topicsCovered: new Set(at.map((a) => a.node_id).filter(Boolean)).size,
      answered, accuracy: pct(right, answered),
      doubtsAsked: dq.length, doubtsAskedWeek: dq.filter((d) => d.created_at >= weekStart).length,
    };
  });

  // --- Per batch: figures only at MIN_BATCH students or more ---
  const groups = [
    ...batches.filter((b) => !batchFilter || b.id === batchFilter).map((b) => ({ id: b.id as string | null, name: b.name, archived: !!b.archived_at })),
    ...(per.some((p) => !p.batchId) ? [{ id: null, name: "No batch", archived: false }] : []),
  ];
  const batchRows = groups.map((g) => {
    const ps = per.filter((p) => p.batchId === g.id);
    if (ps.length < MIN_BATCH) return { batchId: g.id, name: g.name, archived: g.archived, students: ps.length, hidden: true };
    const mem = new Set(ps.map((p) => p.memberId));
    const bd = doubts.filter((d) => mem.has(d.member_id) && d.created_at >= (joinedOf.get(d.member_id) ?? "9"));
    const answeredWeek = bd.filter((d) => { const r = replyAt.get(d.id); return r && r >= weekStart; }).length;
    const waits = bd.map((d) => { const r = replyAt.get(d.id); return r ? (Date.parse(r) - Date.parse(d.created_at)) / 3600_000 : null; }).filter((x): x is number => x != null);
    // Weak topics: the batch's own question-set answers by syllabus topic, at least 5 answers, under 60% right.
    const topics = new Map<string, { answered: number; right: number; students: Set<string> }>();
    for (const a of attempts) if (mem.has(a.member_id) && a.node_id) {
      const t = topics.get(a.node_id) ?? { answered: 0, right: 0, students: new Set<string>() };
      t.answered += a.total; t.right += a.right_n; t.students.add(a.member_id); topics.set(a.node_id, t);
    }
    const weak = [...topics.entries()].filter(([, t]) => t.answered >= 5 && t.right / t.answered < 0.6)
      .map(([id, t]) => ({ nodeId: id, topic: nodeName(id), paper: paperOf(id), students: t.students.size, answered: t.answered, rightPct: pct(t.right, t.answered)! }))
      .sort((a, b) => a.rightPct - b.rightPct).slice(0, 10);
    return {
      batchId: g.id, name: g.name, archived: g.archived, students: ps.length, hidden: false,
      week: {
        activeStudents: ps.filter((p) => p.activeThisWeek).length,
        studyMinutes: ps.reduce((n, p) => n + p.focusMinutesWeek, 0),
        questionsAnswered: ps.reduce((n, p) => n + p.answeredWeek, 0),
        doubtsAsked: ps.reduce((n, p) => n + p.doubtsAskedWeek, 0),
        doubtsAnswered: answeredWeek,
      },
      doubts: { asked: bd.length, answered: bd.filter((d) => replyAt.has(d.id)).length, open: bd.filter((d) => d.status === "open").length,
        avgHoursToAnswer: waits.length ? Math.round((waits.reduce((a, b) => a + b, 0) / waits.length) * 10) / 10 : null },
      weakTopics: weak,
    };
  });

  return {
    since: weekDay, minBatch: MIN_BATCH, quietDays: QUIET_DAYS,
    batches: batchRows,
    quiet: per.filter((p) => p.quiet).map((p) => ({ memberId: p.memberId, name: p.name, batchId: p.batchId, lastActive: p.lastActive, lastDid: p.lastDid })),
    // Mains answer copies sent to the centre for checking aren't in Aspiran yet; this card fills once they are.
    checking: { available: false },
    students: per.map(({ activeThisWeek: _a, focusMinutesWeek: _f, answeredWeek: _w, doubtsAskedWeek: _d, ...p }) => p),
    rules: "No rankings. Batch figures show only for batches of at least 5 students. Only what each student agreed to when joining, from the day they joined.",
  };
}

/** CSV cells: quoted, and a leading = + - @ is defused so a spreadsheet never runs it as a formula. */
const cell = (v: unknown) => { let s = v == null ? "" : String(v); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return `"${s.replace(/"/g, '""')}"`; };

/** The whole report as one CSV: a batch section, a weak-topic section, then one row per student (by name). */
export function reportsCsv(r: Awaited<ReturnType<typeof instReports>>, batchName: (id: string | null) => string) {
  const out: string[] = [];
  const row = (...c: unknown[]) => out.push(c.map(cell).join(","));
  row("Section", "Batch", "Students", "Active this week", "Study minutes this week", "Questions answered this week", "Doubts asked this week", "Doubts answered this week", "Average hours to answer a doubt");
  for (const b of r.batches) {
    if (b.hidden) row("Batch", b.name, b.students, `Hidden: under ${r.minBatch} students`);
    else row("Batch", b.name, b.students, b.week!.activeStudents, b.week!.studyMinutes, b.week!.questionsAnswered, b.week!.doubtsAsked, b.week!.doubtsAnswered, b.doubts!.avgHoursToAnswer ?? "");
  }
  out.push("");
  row("Section", "Batch", "Topic", "Paper", "Students", "Answers", "Right %");
  for (const b of r.batches) if (!b.hidden) for (const t of b.weakTopics!) row("Weak topic", b.name, t.topic, t.paper, t.students, t.answered, t.rightPct);
  out.push("");
  row("Section", "Name", "Batch", "Joined", "Last active", "Last did", `Quiet ${r.quietDays}+ days`, "Focus minutes since joining", "Topics covered", "Questions answered", "Right %", "Doubts asked");
  for (const s of r.students) row("Student", s.name, batchName(s.batchId), s.joinedAt.slice(0, 10), s.lastActive?.slice(0, 10) ?? "", s.lastDid ?? "", s.quiet ? "yes" : "no", s.focusMinutes, s.topicsCovered, s.answered, s.accuracy ?? "", s.doubtsAsked);
  return out.join("\r\n") + "\r\n";
}
