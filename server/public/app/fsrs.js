// FSRS-5, the open spaced-repetition scheduler (github.com/open-spaced-repetition), with its published default
// weights. It decides when a card comes back: each card has a stability (days until recall drops to 90%) and a
// difficulty (1 to 10), both updated from how the review went. Replaces the old fixed 3/10/30-day ladder
// (teaching plan, build step 1). The Android copy is data/Fsrs.kt; keep the two in step. Checked against ts-fsrs.

const W = [0.40255, 1.18385, 3.173, 15.69105, 7.1949, 0.5345, 1.4604, 0.0046, 1.54575, 0.1192, 1.01925, 1.9395, 0.11, 0.29605, 2.2698, 0.2315, 2.9898, 0.51655, 0.6621];
const DECAY = -0.5;
const FACTOR = 19 / 81; // so that recall is exactly 90% after `stability` days
export const RETENTION = 0.9;
export const MAX_DAYS = 365;

/** How the review went: forgot it, got it with effort, got it, or it was too easy. */
export const AGAIN = 1, HARD = 2, GOOD = 3, EASY = 4;

const clampD = (d) => Math.min(10, Math.max(1, d));
const initS = (g) => Math.max(W[g - 1], 0.1);
const initD = (g) => clampD(W[4] - Math.exp(W[5] * (g - 1)) + 1);

/** Chance of recalling a card `days` after its last review. */
export const retrievability = (days, s) => Math.pow(1 + FACTOR * days / s, DECAY);

/** Whole days until the card is due, between 1 and MAX_DAYS. */
export const intervalDays = (s) => Math.min(MAX_DAYS, Math.max(1, Math.round(s / FACTOR * (Math.pow(RETENTION, 1 / DECAY) - 1))));

function nextD(d, g) {
  const moved = d + -W[6] * (g - 3) * (10 - d) / 9;
  return clampD(W[7] * initD(EASY) + (1 - W[7]) * moved);
}

function recallS(d, s, r, g) {
  const hard = g === HARD ? W[15] : 1, easy = g === EASY ? W[16] : 1;
  return s * (1 + Math.exp(W[8]) * (11 - d) * Math.pow(s, -W[9]) * (Math.exp((1 - r) * W[10]) - 1) * hard * easy);
}

function forgetS(d, s, r) {
  return Math.min(s, W[11] * Math.pow(d, -W[12]) * (Math.pow(s + 1, W[13]) - 1) * Math.exp((1 - r) * W[14]));
}

/** Same-day repeat (for example, a card answered twice in one session). */
const shortS = (s, g) => s * Math.exp(W[17] * (g - 3 + W[18]));

/** The new stability for one grade, from the card's state before the review. */
function stabilityAfter(card, grade, day) {
  if (!card || !card.s) return initS(grade);
  const days = Math.max(0, daysBetween(card.last, day));
  if (days === 0) return shortS(card.s, grade);
  const r = retrievability(days, card.s);
  return grade === AGAIN ? forgetS(card.d, card.s, r) : recallS(card.d, card.s, r, grade);
}

/**
 * One review. `card` is null for a card seen for the first time, else {s, d, last} where `last` is the
 * day of its previous review ("YYYY-MM-DD"). Returns the new {s, d, last, due, reps, lapses}.
 * As in ts-fsrs, a harder grade never gets a longer gap than an easier one.
 */
export function review(card, grade, day) {
  const fresh = !card || !card.s;
  const s = [AGAIN, HARD, GOOD, EASY].map((g) => Math.max(0.1, stabilityAfter(card, g, day)));
  const ivl = s.map(intervalDays);
  if (fresh) ivl[0] = Math.min(ivl[0], ivl[1]);
  else ivl[1] = Math.min(ivl[1], ivl[2]);
  ivl[1] = Math.max(ivl[1], ivl[0] + 1);
  ivl[2] = Math.max(ivl[2], ivl[1] + 1);
  ivl[3] = Math.max(ivl[3], ivl[2] + 1);
  const d = fresh ? initD(grade) : nextD(card.d, grade);
  const days = Math.min(MAX_DAYS, ivl[grade - 1]);
  return { s: s[grade - 1], d, last: day, due: addDaysTo(day, days), reps: (card?.reps ?? 0) + 1, lapses: (card?.lapses ?? 0) + (grade === AGAIN ? 1 : 0) };
}

const toUtc = (ymd) => Date.UTC(+ymd.slice(0, 4), +ymd.slice(5, 7) - 1, +ymd.slice(8, 10));
export const daysBetween = (a, b) => Math.round((toUtc(b) - toUtc(a)) / 86_400_000);
export const addDaysTo = (ymd, n) => new Date(toUtc(ymd) + n * 86_400_000).toISOString().slice(0, 10);
