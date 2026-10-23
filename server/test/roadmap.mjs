// The roadmap builder (src/roadmap.ts): the rules without a server, then the routes against a running local server.
//   BASE=http://127.0.0.1:8790 node test/roadmap.mjs
import assert from "node:assert/strict";
import { buildRoadmap, buildWeek, readGoal, prelimsDate, subjectOrder, POLITY_UNITS } from "../src/roadmap.ts";

const BASE = process.env.BASE ?? "http://127.0.0.1:8787";
const step = (name) => console.log("✓", name);
const now = new Date("2026-10-19T06:00:00Z"); // a Monday
const goal = (o = {}) => { const g = readGoal({ examYear: 2027, attempt: 1, optional: "", hoursPerDay: 6, working: false, weakPapers: [], ...o }, now); assert.equal(typeof g, "object", String(g)); return g; };

// --- The form ---
assert.equal(typeof readGoal({ examYear: 2020, hoursPerDay: 6 }, now), "string", "past year refused");
assert.equal(typeof readGoal({ examYear: 2027, hoursPerDay: 0 }, now), "string", "0 hours refused");
assert.equal(typeof readGoal({ examYear: 2027, hoursPerDay: 20 }, now), "string", "20 hours refused");
assert.deepEqual(goal({ weakPapers: ["GS2", "GS9", "GS2"] }).weakPapers, ["GS2"], "unknown and repeated papers dropped");
assert.equal(goal({ optional: "Sociology<script>" }).optional, "Sociologyscript");
assert.equal(prelimsDate(2027).getUTCDay(), 0); assert.equal(prelimsDate(2027).toISOString().slice(0, 10), "2027-05-30");
step("the goal form is checked; Prelims is the last Sunday of May");

// --- The roadmap ---
const rm = buildRoadmap(goal(), now);
assert.equal(rm.order[0].id, "polity", "Polity first");
assert.equal(rm.milestones.length, 3);
assert.ok(rm.phases.length >= 2 && rm.phases.at(-1).id === "prelims");
assert.ok(rm.phases.every((p, i) => i === 0 || p.from > rm.phases[i - 1].to), "phases don't overlap");
assert.equal(rm.phases.at(-1).to <= rm.prelims, true, "ends by Prelims");
assert.equal(rm.hoursPerWeek, 36);
assert.ok(rm.polity.length >= 10 && rm.polity.every((u) => u.hours > 0 && u.check));
const text = JSON.stringify(rm);
assert.ok(!/\b(rank|AIR|selection|guarantee|you will clear|cut-?off)\b/i.test(text), "no rank or result promises");
step("a roadmap: Polity first, three milestone checks, phases ending at Prelims, no rank talk");

const weak = buildRoadmap(goal({ weakPapers: ["GS3"] }), now);
const pos = (r, id) => r.order.findIndex((s) => s.id === id);
assert.ok(pos(weak, "economy") < pos(rm, "economy"), "weak papers move up");
assert.equal(weak.order[0].id, "polity", "Polity still first");
const opt = buildRoadmap(goal({ optional: "Sociology", working: true, hoursPerDay: 3 }), now);
assert.ok(opt.order.some((s) => s.id === "optional") && opt.split.optional > 0);
assert.ok(opt.notes.some((n) => /Working/.test(n)));
const rep = buildRoadmap(goal({ attempt: 2 }), now);
assert.equal(rep.phases[0].name, "Revision base");
const short = buildRoadmap(goal({ hoursPerDay: 1 }), now);
assert.ok(short.tooShort && short.notes.some((n) => /won't fit/.test(n)), "says honestly when it won't fit");
step("weak papers, an optional, working, a repeater and too few hours each change the plan");

// --- The week ---
const wk = buildWeek(goal(), {}, now);
assert.equal(wk.week, "2026-10-19");
assert.equal(wk.days.length, 7);
assert.equal(wk.subject.id, "polity");
assert.ok(wk.units.length >= 3, "enough units to fill the GS hours");
const wk2 = buildWeek(goal(), { hours: 10, unitsDone: POLITY_UNITS.slice(0, 3).map((u) => u.name) }, now);
assert.ok(wk2.smaller && wk2.targetHours < wk.targetHours, "a hard week makes the next smaller");
assert.notEqual(wk2.units[0], wk.units[0], "moves on past finished units");
const wk3 = buildWeek(goal(), { subjectsDone: ["polity"] }, now);
assert.notEqual(wk3.subject.id, "polity", "next subject once Polity is done");
step("the weekly plan rebuilds from what was done, and gets smaller after a hard week");

// --- Routes ---
const call = async (path, body) => { const r = await fetch(BASE + path, body ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) } : {}); return { status: r.status, data: await r.json() }; };
const thisYear = new Date().getUTCFullYear() + 1;
const r1 = await call("/roadmap", { goal: { examYear: thisYear, attempt: 1, hoursPerDay: 6, weakPapers: ["GS2"] } });
assert.equal(r1.status, 200); assert.equal(r1.data.order[0].id, "polity");
assert.equal((await call("/roadmap", { goal: { examYear: 1999, hoursPerDay: 6 } })).status, 400);
const r2 = await call("/roadmap/week", { goal: { examYear: thisYear, hoursPerDay: 6 }, done: { hours: 5 } });
assert.equal(r2.status, 200); assert.equal(r2.data.smaller, true);
const syl = await call("/roadmap/syllabus");
assert.equal(syl.status, 200); assert.ok(syl.data.polity.length >= 10);
step("POST /roadmap, POST /roadmap/week and GET /roadmap/syllabus");

console.log("\nAll roadmap checks passed.");
