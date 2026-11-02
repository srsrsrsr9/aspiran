// Usage counts for the Growth page: what happened, never what was said. Events carry a random install id and
// (once signed in) the member id, plus small codes and numbers. No mood, journal or chat text ever goes here, and
// there are no third-party trackers. Ratings are one tap; the day-7 check-in is two taps.

const KEY = "upsc:metrics";
const mem = {};
const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) ?? mem; } catch { return mem; } };
const write = (s) => { Object.assign(mem, s); try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} };
const randomId = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");
const day = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

let memberOf = () => null, tokenOf = async () => null;
/** The app tells us how to find the member id (it changes at sign-in) and its sign-in token, if any. */
export function setMember(fn, token) { memberOf = fn; if (token) tokenOf = token; }

export function installId() {
  const s = read();
  if (!s.installId) { s.installId = randomId(); write(s); }
  return s.installId;
}

async function post(path, body) {
  const memberId = memberOf();
  const token = await tokenOf().catch(() => null);
  return fetch(path, { method: "POST", headers: { "content-type": "application/json", ...(token ? { authorization: "Bearer " + token } : {}) }, keepalive: true,
    body: JSON.stringify({ installId: installId(), ...(memberId ? { memberId } : {}), platform: "web", ...body }) }).then((r) => r.ok).catch(() => false);
}

/** One event. Fire and forget. */
export function track(name, props = {}) { post("/events", { events: [{ name, props }] }); }

/** first_open once per browser (with ?src= / ?invite= from the link that brought them), app_open once a day. */
export async function boot() {
  const s = read();
  if (!s.firstOpenSent) {
    const q = new URLSearchParams(location.search);
    const ok = await post("/events", { events: [{ name: "first_open", props: { source: q.get("src") ?? q.get("utm_source"), invite: q.get("invite") } }] });
    if (ok) { s.firstOpenSent = true; s.firstOpenDay = day(); }
  }
  if (s.lastOpen !== day()) { s.lastOpen = day(); track("app_open"); }
  write(s);
}

/** Counts once per day per key (Chai cards read, minutes studied) are sent as they happen; this de-duplicates rituals. */
export function ritualOnce(kind) {
  const s = read(), k = `r:${kind}`;
  if (s[k] === day()) return;
  s[k] = day(); write(s);
  track("ritual", { kind });
}

// --- One-tap rating ----------------------------------------------------------------------------
// After a key moment, at most one rating a day, and each moment at most once a fortnight.

const LABELS = { pod_joined: "How was joining your pod?", close_day: "How did closing the day feel?", chotu_chat: "Was Chotu helpful?",
  quiz: "How was the quiz?", roadmap: "Is this roadmap useful?", chai: "How was today's Chai?" };

export function wantsRating(moment) {
  const s = read();
  if (!LABELS[moment] || s.lastRatingDay === day()) return false;
  const last = s[`rated:${moment}`];
  return !last || (Date.now() - new Date(last + "T12:00:00").getTime()) / 86_400_000 >= 14;
}

/** Returns a small card (built with the app's h()) or null. Tapping a face sends 1–3 and thanks them. */
export function ratingCard(h, moment) {
  if (!wantsRating(moment)) return null;
  const mark = () => { const s = read(); s.lastRatingDay = day(); s[`rated:${moment}`] = day(); write(s); };
  const box = h("div.card.soft.rating", { role: "group", "aria-label": LABELS[moment] });
  const send = (rating) => { mark(); post("/feedback", { moment, rating }); box.replaceChildren(h("p.small.muted", { style: { margin: 0 } }, "Thanks. That helps us make it better.")); };
  box.append(h("div.row.between",
    h("span.small", LABELS[moment]),
    h("div.row", [["👎", "Not really", 1], ["😐", "Okay", 2], ["👍", "Yes", 3]].map(([e, label, r]) =>
      h("button.ghost", { "aria-label": label, title: label, onclick: () => send(r) }, e)),
      h("button.ghost", { "aria-label": "Not now", title: "Not now", onclick: () => { mark(); box.remove(); } }, "×"))));
  return box;
}

// --- Day-7 check-in ----------------------------------------------------------------------------

const Q1 = { text: "How useful has Aspiran been in your first week?", choices: ["Very useful", "Somewhat", "Not yet"] };
const Q2 = { text: "What would help you most next?", choices: ["A livelier pod", "More practice questions", "A study plan", "Better Chotu answers", "Something else"] };

/** Shown from day 7 after they started (createdOn), until answered or dismissed. */
export function checkinCard(h, createdOn) {
  const s = read();
  if (s.checkin || !createdOn) return null;
  const age = (Date.now() - new Date(createdOn + "T12:00:00").getTime()) / 86_400_000;
  if (age < 7) return null;
  const box = h("div.card.soft.checkin");
  let a1 = null;
  const done = (sent) => { const t = read(); t.checkin = sent ? "answered" : "dismissed"; write(t); };
  const ask = (q, onPick) => [h("p", { style: { marginTop: 0 } }, h("strong", q.text)),
    h("div.row", { style: { flexWrap: "wrap" } }, q.choices.map((c, i) => h("button", { onclick: () => onPick(i) }, c)))];
  const step2 = () => box.replaceChildren(...ask(Q2, (i) => { done(true); post("/feedback", { kind: "checkin", q1: a1, q2: i }); box.replaceChildren(h("p.small.muted", { style: { margin: 0 } }, "Thank you. We read every answer.")); }));
  box.append(h("p.small.muted", { style: { marginTop: 0 } }, "A week in. Two quick taps?"),
    ...ask(Q1, (i) => { a1 = i; step2(); }),
    h("button.ghost.small", { onclick: () => { done(false); box.remove(); } }, "Not now"));
  return box;
}

/** On delete: forget this browser's install id too. */
export function forget() { try { localStorage.removeItem(KEY); } catch {} for (const k of Object.keys(mem)) delete mem[k]; }
