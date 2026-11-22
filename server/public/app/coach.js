// Chotu keeps you honest, Jeetu makes the plan (artefacts/chotu-jeetu-behaviour-rules-2026-11-22.md).
// This file: the facts the app counts from what this browser already knows (focus minutes, questions, answers written,
// reviews, mocks, topic accuracy), the "Your week" card, the two-line debrief after a practice set or a mock, the
// "Want Jeetu's take?" chip and Jeetu's plan card with "Use this plan" and "Change it".
//
// Rules: every number comes from here, never from a model. Totals, never streaks. Comparison with your own past only;
// results only as a trend over at least two weeks. Only a tap calls Jeetu. English and Hindi.

import * as J from "./jeetu.js";

let C = null;
/** app.js hands over its helpers once at start: h, put, post, store, today, addDays, hindi, profile, memberLang, toast. */
export function init(ctx) { C = ctx; }
const h = (...a) => C.h(...a);
const put = (...a) => C.put(...a);
const hi = () => !!C.hindi?.();
const T = (en, hiText) => (hi() ? hiText : en);

// --- Facts ---------------------------------------------------------------------------------------------------------

const inRange = (day, from, to) => day >= from && day <= to;
const sum = (xs) => xs.reduce((n, x) => n + x, 0);

/** Effort over the 7 days ending `end` (inclusive). */
function effort(end) {
  const from = C.addDays(end, -6);
  const focus = C.store.get("focusLog", []).filter((x) => x.kind !== "break" && inRange(x.day, from, end));
  const right = Object.entries(C.store.get("rightDays", {})).filter(([d]) => inRange(d, from, end));
  const answers = C.store.get("writingLog", []).filter((x) => inRange(x.day, from, end));
  const reviews = Object.values(C.store.get("reviews", {}) ?? {}).filter((x) => x?.f?.last && inRange(x.f.last, from, end));
  const mocks = C.store.get("mockHistory", []).filter((x) => inRange(x.day, from, end));
  const days = new Set([...focus.map((x) => x.day), ...right.map(([d]) => d), ...answers.map((x) => x.day)]);
  return { minutes: sum(focus.map((x) => x.minutes)), questions: sum(right.map(([, x]) => x[1])), answers: answers.length,
    reviews: reviews.length, mocks: mocks.length, days_active: days.size };
}

/** Accuracy trends by topic over 2+ weeks from practice (topicLog): the first week with 5+ questions against the last. */
function topicTrends(day) {
  const from = C.addDays(day, -41);
  const by = {};
  for (const x of C.store.get("topicLog", [])) if (x.day >= from && x.n) (by[x.topic] ??= []).push(x);
  const out = [];
  for (const [topic, xs] of Object.entries(by)) {
    xs.sort((a, b) => a.day.localeCompare(b.day));
    const first = xs[0].day, last = xs[xs.length - 1].day;
    const span = (Date.parse(last) - Date.parse(first)) / 86400_000;
    if (span < 13) continue;
    const pct = (ys) => { const n = sum(ys.map((y) => y.n)); return n >= 5 ? Math.round(sum(ys.map((y) => y.pct * y.n)) / n) : null; };
    const a = pct(xs.filter((x) => x.day <= C.addDays(first, 6))), b = pct(xs.filter((x) => x.day >= C.addDays(last, -6)));
    if (a == null || b == null) continue;
    out.push({ subject: topic, from: a, to: b, weeks: Math.round(span / 7), unit: "%" });
  }
  return out;
}

/**
 * Everything the app counts about your own study, in the shape the server reads (server/README.md, "Chotu facts").
 * Only numbers this browser already has; anything missing is left out.
 */
export function weekFacts(extra = {}) {
  const day = C.today();
  const week = effort(day), last = effort(C.addDays(day, -7));
  const facts = { week, last_week: last };
  const trends = topicTrends(day);
  const up = trends.filter((t) => t.to > t.from).sort((a, b) => (b.to - b.from) - (a.to - a.from));
  if (trends.length) facts.trends = [...up, ...trends.filter((t) => t.to <= t.from)].slice(0, 4);
  const stuck = trends.filter((t) => t.from < 50 && t.to < 50).map((t) => ({ topic: t.subject, accuracy: t.to, weeks: t.weeks }));
  if (stuck.length) facts.stuck_topics = stuck.slice(0, 3);
  const w = wins(day, week);
  if (w.length) facts.wins = w;
  const plan = C.store.get("jeetuPlan");
  if (plan?.items?.length) facts.today_plan = plan.items.map((x) => `${x.what} (${x.when}, ${x.minutes} min)`);
  const first = C.store.get("plan");
  if (first?.madeOn === C.addDays(day, -1)) facts.yesterday_plan = [first.line];
  if (new Date().getDay() === 0) facts.checkin = "sunday";
  return { ...facts, ...extra };
}

/** Small wins, as totals: this month's counts, and a personal best week. Never days in a row. */
function wins(day, week) {
  const out = [];
  const month = day.slice(0, 8);
  const answers = C.store.get("writingLog", []).filter((x) => x.day.startsWith(month)).length;
  if (answers >= 2) out.push(T(`${answers} answers written this month`, `इस महीने ${answers} उत्तर लिखे`));
  const qs = sum(Object.entries(C.store.get("rightDays", {})).filter(([d]) => d.startsWith(month)).map(([, x]) => x[1]));
  if (qs >= 20) out.push(T(`${qs} questions answered this month`, `इस महीने ${qs} प्रश्न हल किए`));
  // Your most focused week so far, against at least three earlier weeks.
  const earlier = [1, 2, 3, 4, 5, 6, 7, 8].map((k) => effort(C.addDays(day, -7 * k)).minutes).filter((m) => m > 0);
  if (earlier.length >= 3 && week.minutes > Math.max(...earlier)) out.push(T("Your most focused minutes in a week so far", "अब तक के किसी भी हफ़्ते से ज़्यादा फ़ोकस मिनट"));
  return out.slice(0, 3);
}

/** A pattern worth Jeetu's look (same rule as the server's factsPattern). */
export const patternIn = (f) => (f.missed_plans ?? 0) >= 3 || (f.stuck_topics ?? []).some((s) => s.accuracy < 50 && s.weeks >= 2);

// --- Lines -------------------------------------------------------------------------------------------------------

const effortLine = (w, l) => {
  const parts = [
    w.minutes && T(`${w.minutes} focused min`, `${w.minutes} मिनट फ़ोकस`),
    w.questions && T(`${w.questions} questions`, `${w.questions} प्रश्न`),
    w.answers && T(`${w.answers} answers written`, `${w.answers} उत्तर लिखे`),
    w.reviews && T(`${w.reviews} reviewed`, `${w.reviews} दोहराए`),
  ].filter(Boolean);
  if (!parts.length) return null;
  const more = [["minutes", T("minutes", "मिनट")], ["questions", T("questions", "प्रश्न")], ["answers", T("answers", "उत्तर")]]
    .filter(([k]) => l[k] && w[k] > l[k]).map(([, n]) => n);
  return parts.join(" · ") + (more.length ? T(`. More ${more.join(" and ")} than last week.`, `। पिछले हफ़्ते से ज़्यादा ${more.join(" और ")}।`) : ".");
};
const trendLine = (t) => T(`${t.subject}: ${t.from}% → ${t.to}% over ${t.weeks} weeks.`, `${t.subject}: ${t.weeks} हफ़्तों में ${t.from}% → ${t.to}%।`);

/** "Your week": effort totals against your own last week, one win, one trend, and the Jeetu offer. */
export function yourWeekCard() {
  const f = weekFacts();
  const e = effortLine(f.week, f.last_week);
  const win = f.wins?.[0], trend = f.trends?.find((t) => t.to > t.from) ?? null;
  const body = e
    ? [h("p", { style: { margin: "6px 0 0" } }, e), win && h("p.small", { style: { margin: "4px 0 0" } }, "✓ " + win), trend && h("p.small", { style: { margin: "4px 0 0" } }, trendLine(trend))]
    : [h("p.small.muted", { style: { margin: "6px 0 0" } }, T("Nothing counted yet this week. A five-minute start counts.", "इस हफ़्ते अभी कुछ नहीं गिना गया। पाँच मिनट की शुरुआत भी गिनी जाती है।"))];
  return h("div.card", h("strong", T("Your week", "आपका हफ़्ता")), ...body,
    h("p.small.muted", { style: { margin: "6px 0 0" } }, T("Compared only with your own last week.", "सिर्फ़ आपके अपने पिछले हफ़्ते से तुलना।")),
    e && jeetuChip({ facts: f }));
}

/**
 * Two lines after a practice set or a mock: the effort, and one trend if there's one over 2+ weeks. Never today's
 * score as the headline. With a pattern, the Jeetu offer.
 */
export function debrief(set) {
  const f = weekFacts({ checkin: "after_practice", last_set: set });
  const one = set.kind === "mock"
    ? T(`${set.questions} questions in ${set.minutes} min. That's ${f.week.questions} this week.`, `${set.minutes} मिनट में ${set.questions} प्रश्न। इस हफ़्ते कुल ${f.week.questions}।`)
    : T(`${set.questions} more questions done. That's ${f.week.questions} this week${f.last_week.questions ? `, against ${f.last_week.questions} last week` : ""}.`,
      `${set.questions} और प्रश्न हो गए। इस हफ़्ते कुल ${f.week.questions}${f.last_week.questions ? `, पिछले हफ़्ते ${f.last_week.questions}` : ""}।`);
  const t = f.trends?.find((x) => x.subject === set.topic) ?? f.trends?.[0];
  return h("div.card.soft", C.chotuLabel ? C.chotuLabel(null, 18) : h("strong", "Chotu"),
    h("p", { style: { margin: "4px 0 0" } }, one),
    h("p", { style: { margin: "4px 0 0" } }, t ? trendLine(t) : T("A trend shows here once you've practised a topic for two weeks.", "किसी विषय पर दो हफ़्ते अभ्यास के बाद यहाँ रुझान दिखेगा।")),
    patternIn(f) && jeetuChip({ facts: f }));
}

// --- Jeetu ---------------------------------------------------------------------------------------------------------

let access = null; // /plus/status → jeetu: {available, plus, tasteLeft, tasteEndsAt}, asked once per page load
function jeetuAvailable() {
  if (access) return access;
  const id = C.profile()?.memberId;
  access = id ? C.getJson(`/plus/status?member=${encodeURIComponent(id)}`).then((s) => s?.jeetu?.available === true).catch(() => false) : Promise.resolve(false);
  return access;
}

/**
 * "Want Jeetu's take?": shown only when Jeetu is awake and this member can use him. A tap sends the facts (and the
 * question, if there is one) to Jeetu; his answer and plan open in place.
 */
export function jeetuChip({ facts, question = null, messages = null }) {
  const box = h("div", { style: { marginTop: "8px" } });
  if (!J.awake()) return box;
  jeetuAvailable().then((ok) => {
    if (!ok) return;
    put(box, h("button.chip", { onclick: () => askJeetu(box, { facts, messages: messages ?? (question ? [{ role: "user", content: question }] : []) }) },
      T("Want Jeetu's take?", "Jeetu की राय लें?")));
  });
  return box;
}

async function askJeetu(box, { facts, messages }) {
  put(box, h("p.small.muted", T("Jeetu is thinking…", "Jeetu सोच रहे हैं…")));
  const r = await C.post("/jeetu", { messages, facts, context: { language: C.memberLang?.() ?? (hi() ? "Hindi" : "English") } });
  if (r?.care) { put(box, C.careBox()); return; }
  if (!r?.reply) {
    if (r?.plusOnly) access = Promise.resolve(false);
    put(box, h("p.small.muted", r?.error ?? T("Jeetu couldn't answer just now. Try again in a minute.", "Jeetu अभी जवाब नहीं दे पाए। एक मिनट बाद फिर कोशिश करें।")));
    return;
  }
  const thread = [...messages.filter((m) => m.role === "user" || m.role === "assistant"), { role: "assistant", content: r.reply }];
  put(box, jeetuReply(r, { facts, thread, box }));
}

/** Jeetu's reply under his own name: the text, then the plan card if he made one. */
function jeetuReply(r, { facts, thread, box }) {
  return h("div.msg.jeetu", J.label(18), h("div", r.plan ? null : r.reply), r.plan && planCard(r.plan, {
    change: (text) => askJeetu(box, { facts, messages: [...(thread[0]?.role === "user" ? [] : [{ role: "user", content: T("Your take on my week?", "मेरे हफ़्ते पर आपकी राय?") }]), ...thread, { role: "user", content: text }].slice(-8) }),
  }));
}

/**
 * The plan: at most 3 items (what, when, how long) and one line on why. "Use this plan" keeps it in this browser,
 * where Chotu's facts pick it up as today's plan; "Change it" asks Jeetu again with your change.
 */
export function planCard(plan, { change } = {}) {
  const box = h("div.card", { style: { marginTop: "8px" } });
  const used = () => C.store.get("jeetuPlan")?.why === plan.why;
  const draw = () => put(box,
    h("strong", T("Jeetu's plan", "Jeetu का प्लान")),
    h("ol", { style: { margin: "6px 0", paddingLeft: "20px" } }, plan.items.map((x) => h("li", h("span", x.what), h("span.small.muted", ` · ${x.when} · ${x.minutes} ${T("min", "मिनट")}`)))),
    h("p.small", { style: { margin: "4px 0" } }, plan.why),
    used()
      ? h("p.small.muted", T("Using this plan. Chotu will ask how it went.", "यह प्लान चल रहा है। Chotu पूछेगा कि कैसा रहा।"))
      : h("div.row", { style: { flexWrap: "wrap" } },
        h("button.primary", { onclick: () => { C.store.set("jeetuPlan", { ...plan, acceptedOn: C.today() }); C.toast?.(T("Plan saved.", "प्लान सहेजा गया।")); draw(); } }, T("Use this plan", "यह प्लान अपनाएँ")),
        change && h("button", { onclick: () => { const t = prompt(T("What should change? (for example: less time, a different day)", "क्या बदलें? (जैसे: कम समय, कोई और दिन)")); if (t?.trim()) change(t.trim().slice(0, 300)); } }, T("Change it", "बदलें"))));
  draw();
  return box;
}
