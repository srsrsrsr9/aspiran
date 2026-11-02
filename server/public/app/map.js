// The syllabus map (teaching plan, build step 2): each syllabus topic is Not started, Met, Can recall or Can use.
// No percentages. Stays in this browser. The Android copy is data/SyllabusMap.kt; keep the two in step.
//
// - Met: you studied it and wrote down what you remember. The topic then joins the review queue (fsrs.js).
// - Can recall: a recall check went well a week or more after the one before. Checks come from the review queue.
// - Can use: you can recall it and you've used it in an answer or a set of past questions.
// - A topic you haven't checked in a long while fades back to Met until the next check goes well.

import * as F from "./fsrs.js";

export const NONE = "none", MET = "met", RECALL = "recall", USE = "use";
export const LABEL = { none: "Not started", met: "Met", recall: "Can recall", use: "Can use" };
/** A recall check only proves something after this many days. */
export const RECALL_GAP = 7;
/** Below this chance of recall, a topic shows as Met again. */
export const FADED = 0.7;

export function stateOf(n, day) {
  if (!n?.met) return NONE;
  if (!n.recalledOn || !n.f) return MET;
  if (F.retrievability(Math.max(0, F.daysBetween(n.f.last, day)), n.f.s) < FADED) return MET;
  return n.usedOn ? USE : RECALL;
}

/** Mark a topic Met. Its first recall check comes in a few days. */
export const meet = (n, day, note = "") => (n?.met ? { ...n, note: note || n.note } : { met: day, note, f: F.review(null, F.GOOD, day), recalledOn: null, usedOn: null });

/** One recall check. A miss takes the topic back to Met; a pass after a week or more makes it Can recall. */
export function check(n, grade, day) {
  const gap = F.daysBetween(n.f.last, day);
  const recalledOn = grade === F.AGAIN ? null : gap >= RECALL_GAP ? day : n.recalledOn;
  return { ...n, f: F.review(n.f, grade, day), recalledOn };
}

/** Used in an answer or a PYQ set. Only counts once the topic is Can recall. */
export const use = (n, day, how) => (stateOf(n, day) === RECALL || stateOf(n, day) === USE ? { ...n, usedOn: day, usedHow: how } : n);

export const isDue = (n, day) => !!n?.met && !!n.f && n.f.due <= day;
