// Aspiran on the web: the same cards, practice, pods and editor checks as the phone, plus long
// reading, timed mock papers and focus sessions for desk and laptop study. Installable as a desktop
// app (manifest + service worker). Everything personal stays in this browser; the journal is
// encrypted with a key the browser can't export.
//
// Two spaces (strategy/community-first-spec.md): Adda, the community, is where you land. It's free,
// no card needed, and never sells: Adda, Pod, Chotu and Me use the warm palette. Prep, the study
// engine, uses the cool palette and is the only place a Plus offer can ever appear.

import { t } from "./strings.js";
import { calmAudio } from "./calm-audio.js";
import { CALM_BUILTIN } from "./calm-scripts.js";
import * as P from "./profile-db.js";
import { kulhad, toneNow } from "./kulhad.js";
import * as HT from "./honest.js";
import { REQUESTABLE, fontFor, greetingOfTheDay, loadNoto, welcomeScene } from "./welcome.js";
import { RAP_VIDEOS, onMeteredData, rapLangFor } from "./videos.js";
import * as Auth from "./auth.js";
import * as M from "./metrics.js";
import * as F from "./fsrs.js";
import * as SY from "./syllabus.js";
import * as MP from "./map.js";
import * as X from "./explore.js";
import * as BR from "./brief.js";
import * as VINE from "./vine.js";
import * as TRY from "./try.js";

// --- Small helpers -----------------------------------------------------------------------------

const $ = (sel, el = document) => el.querySelector(sel);
/** h("div.card", {onclick}, "text", child) — text is always set as text, never parsed as HTML. */
function h(tag, attrs, ...kids) {
  const [name, ...classes] = tag.split(".");
  const el = document.createElement(name || "div");
  if (classes.length) el.className = classes.join(" ");
  if (attrs && (typeof attrs !== "object" || attrs instanceof Node || Array.isArray(attrs))) { kids.unshift(attrs); attrs = null; }
  for (const [k, v] of Object.entries(attrs ?? {})) {
    if (v == null || v === false) continue;
    if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
    else if (k === "value") el.value = v;
    else if (k in el && k !== "list" && typeof v !== "string") el[k] = v;
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const kid of kids.flat(Infinity)) if (kid != null && kid !== false) el.append(kid instanceof Node ? kid : String(kid));
  return el;
}
/** replaceChildren, but skipping false/null and flattening arrays (conditional parts are common). */
const put = (el, ...kids) => el.replaceChildren(...kids.flat(Infinity).filter((k) => k != null && k !== false));
const today = () => localDay(new Date());
const localDay = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const addDays = (day, n) => { const d = new Date(day + "T12:00:00"); d.setDate(d.getDate() + n); return localDay(d); };
const mmss = (ms) => { const s = Math.max(0, Math.round(ms / 1000)); const m = Math.floor(s / 60); return `${m}:${String(s % 60).padStart(2, "0")}`; };
const hhmmss = (ms) => { const s = Math.max(0, Math.round(ms / 1000)); const hr = Math.floor(s / 3600); return hr ? `${hr}:${mmss(ms - hr * 3600_000).padStart(5, "0")}` : mmss(ms); };
const randomId = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");
const shuffle = (a, seed) => { a = a.slice(); let x = seed || 1; for (let i = a.length - 1; i > 0; i--) { x = (x * 1103515245 + 12345) & 0x7fffffff; const j = x % (i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// Storage can be blocked (private windows, cleared site data). The app still works for the session.
const mem = new Map();
const store = {
  get(k, d = null) { try { const v = localStorage.getItem("upsc:" + k); return v == null ? (mem.has(k) ? mem.get(k) : d) : JSON.parse(v); } catch { return mem.has(k) ? mem.get(k) : d; } },
  // A value too big for the browser's storage drops the old copy too, so a stale one is never read back.
  set(k, v) { mem.set(k, v); try { localStorage.setItem("upsc:" + k, JSON.stringify(v)); } catch { try { localStorage.removeItem("upsc:" + k); } catch {} } },
  del(k) { mem.delete(k); try { localStorage.removeItem("upsc:" + k); } catch {} },
  clear() { mem.clear(); try { Object.keys(localStorage).filter((k) => k.startsWith("upsc:")).forEach((k) => localStorage.removeItem(k)); } catch {} },
};

// --- Journal encryption: AES-GCM with a non-extractable key kept in IndexedDB --------------------

const vault = {
  _key: null,
  async key() {
    if (this._key) return this._key;
    const db = await new Promise((res, rej) => { const r = indexedDB.open("upsc-vault", 1); r.onupgradeneeded = () => r.result.createObjectStore("keys"); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
    const get = () => new Promise((res) => { const t = db.transaction("keys").objectStore("keys").get("journal"); t.onsuccess = () => res(t.result); t.onerror = () => res(null); });
    let key = await get();
    if (!key) {
      key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
      await new Promise((res) => { const t = db.transaction("keys", "readwrite"); t.objectStore("keys").put(key, "journal"); t.oncomplete = res; t.onerror = res; });
    }
    return (this._key = key);
  },
  async seal(obj) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await this.key(), new TextEncoder().encode(JSON.stringify(obj)));
    const all = new Uint8Array(12 + ct.byteLength); all.set(iv); all.set(new Uint8Array(ct), 12);
    return btoa(String.fromCharCode(...all));
  },
  async open(b64) {
    try {
      const all = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: all.slice(0, 12) }, await this.key(), all.slice(12));
      return JSON.parse(new TextDecoder().decode(pt));
    } catch { return null; }
  },
  async forget() { this._key = null; try { indexedDB.deleteDatabase("upsc-vault"); } catch {} },
};

// --- Distress check: same starter list as the phone and server. Runs before anything else. ------

const DISTRESS = ["kill myself", "end my life", "want to die", "end it all", "no reason to live", "suicide",
  "मरना चाहता", "मरना चाहती", "जीना नहीं चाहता", "जीना नहीं चाहती", "खुदकुशी", "आत्महत्या",
  "marna chahta", "marna chahti", "jeena nahi chahta", "jeena nahi chahti", "khudkushi", "sab khatam kar"];
const distress = (text) => {
  if (!text) return false;
  const low = text.toLowerCase();
  return DISTRESS.some((p) => low.includes(p)) || (config.distress || []).some((p) => low.includes(p));
};
const HELPLINES = [["Tele-MANAS", "14416"], ["Tele-MANAS (toll-free)", "1-800-891-4416"], ["Emergency", "112"]];
const careBox = (calm = true) => h("div.card.soft", { role: "status" },
  h("strong", tr("care.title")),
  h("p", tr("care.body")),
  HELPLINES.map(([n, num]) => h("div", h("a", { href: "tel:" + num.replace(/[^\d]/g, "") }, `${n}: ${num}`))),
  calm && h("p.small", { style: { marginBottom: 0 } }, h("a", { href: "#calm" }, tr("calm.waiting"))));

// --- Server data, cached for offline -----------------------------------------------------------

async function getJson(path, cacheKey) {
  try {
    const r = await fetch(path, { cache: "no-cache" });
    if (!r.ok) throw new Error(r.status);
    const data = await r.json();
    if (cacheKey) store.set("cache:" + cacheKey, data);
    return data;
  } catch {
    if (cacheKey) loadedFromCache = true;
    return cacheKey ? store.get("cache:" + cacheKey) : null;
  }
}
const data = { brief: null, library: null, questions: null };
let loadedFromCache = false;
async function loadAll() {
  loadedFromCache = false;
  // Content needs sign-in; a visitor gets only the Free Shelf's calm scripts and routines.
  if (!Auth.signedIn()) { data.library = (await getJson("/library/shelf")) ?? { items: [] }; data.questions = { fromCards: [], bank: [] }; return; }
  [data.brief, data.library, data.questions] = await Promise.all([
    getJson("/brief/latest", "brief"), getJson("/library", "library"), getJson("/practice/questions?days=90", "questions"),
  ]);
  data.library ??= { items: [] };
  data.questions ??= { fromCards: [], bank: [] };
}
const libraryOf = (kind) => (data.library?.items ?? []).filter((i) => i.kind === kind);

/**
 * Pause lines (content kind "pause-lines"): one short line at a moment that matters, shown the first time only (and
 * for the rest of that visit, so a redraw doesn't hide it). Quiet when the lines aren't approved yet.
 */
const pauseNow = new Set();
function pauseLine(key) {
  const line = libraryOf("pause-lines").flatMap((i) => i.data.lines ?? []).find((l) => l.key === key);
  if (!line || (store.get("pause:" + key) && !pauseNow.has(key))) return null;
  store.set("pause:" + key, today()); pauseNow.add(key);
  return h("p.small.pause", bi(line));
}

// --- Profile and the day -----------------------------------------------------------------------

const profile = () => store.get("profile");
/** Languages members can pick: from /config (live ones only), English and Hindi when offline. */
const langOptions = () => (config.languages?.length ? config.languages : [{ code: "en", native: "English" }, { code: "hi", native: "हिन्दी" }]);
const lang = () => { const l = profile()?.lang ?? "en"; return langOptions().some((x) => x.code === l) ? l : "en"; };
const hindi = () => lang() === "hi";
const tr = (key) => t(key, lang());
const bi = (v) => (v && typeof v === "object" && "en" in v ? (v[lang()] || v.en) : v ?? "");
/** Sets the page language and its fonts (Noto first) so Indic scripts render well. */
function applyLang() {
  const l = lang(), info = langOptions().find((x) => x.code === l);
  document.documentElement.lang = l;
  if (info?.fonts && l !== "en") document.documentElement.style.setProperty("--ui-font", info.fonts);
  else document.documentElement.style.removeProperty("--ui-font");
}
const langPicker = (get, set) => h("div.chips", langOptions().map(({ code, native }) =>
  h("button.chip", { lang: code, "aria-pressed": String(get() === code), onclick: (e) => { set(code); e.currentTarget.parentElement.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === e.currentTarget))); } }, native)));
const lang_ = () => lang();
const POD_LANG = { en: "english", hi: "hindi", te: "telugu", mr: "marathi", ta: "tamil", bn: "bengali", kn: "kannada" };

const TASKS = [
  { id: "CHAI", title: "Today's Chai", minutes: 7, subject: "Current affairs", go: "#chai" },
  { id: "PRELIMS", title: "Prelims practice", minutes: 5, subject: "Prelims practice", go: "#prelims" },
  { id: "MAINS", title: "Mains answer", minutes: 20, subject: "Mains", go: "#mains" },
];
const dayState = (d = today()) => store.get("day:" + d, { started: [], done: [], firstStepDone: false });
const saveDay = (s, d = today()) => store.set("day:" + d, s);
function markDone(id) { const s = dayState(); if (!s.done.includes(id)) s.done.push(id); saveDay(s); }
function markStarted(id) { const s = dayState(); if (!s.started.includes(id)) s.started.push(id); saveDay(s); }

// --- Focus sessions (Regain-style) -------------------------------------------------------------
// One timer for "Just 5 minutes", focus blocks, long reading and mock papers. While a session runs,
// a browser extension (focus-extension/) blocks the sites on the list. Nothing here is counted or ranked.

const DEFAULT_BLOCKS = ["youtube.com", "instagram.com", "facebook.com", "x.com", "twitter.com", "reddit.com", "netflix.com", "hotstar.com"];
const focusCfg = () => store.get("focusCfg", { blocklist: DEFAULT_BLOCKS, limits: { "youtube.com": 30 }, pauseSeconds: 10, sound: false });
const focus = {
  get active() { const f = store.get("focus"); return f && f.endsAt > Date.now() ? f : null; },
  start(minutes, label, kind = "focus", task = null) {
    const f = { startedAt: Date.now(), endsAt: Date.now() + minutes * 60_000, minutes, label, kind, task };
    store.set("focus", f);
    ext.send();
    if ("Notification" in window && Notification.permission === "default" && kind !== "five") Notification.requestPermission().catch(() => {});
    tick();
  },
  stop(completed) {
    const f = store.get("focus");
    if (!f) return;
    store.del("focus");
    const minutes = Math.round((Math.min(Date.now(), f.endsAt) - f.startedAt) / 60_000);
    if (minutes >= 1 && f.kind !== "break") M.track("prep_minutes", { minutes });
    if (completed && f.kind === "focus") M.ritualOnce("focus");
    if (minutes >= 1 && f.kind !== "five") {
      const log = store.get("focusLog", []);
      log.push({ day: today(), hour: new Date(f.startedAt).getHours(), minutes, label: f.label, kind: f.kind, completed: !!completed });
      store.set("focusLog", log.slice(-500));
    }
    ext.send();
    tick();
  },
  minutesOn(day) { return store.get("focusLog", []).filter((x) => x.day === day).reduce((n, x) => n + x.minutes, 0); },
};

// The extension's content script listens on this page and answers with "hello".
const ext = {
  connected: false, version: null,
  send() {
    const f = focus.active, cfg = focusCfg();
    window.postMessage({ source: "upsc-pods-app", type: "focus", until: f ? f.endsAt : 0, label: f?.label ?? "", blocklist: cfg.blocklist, limits: cfg.limits, pauseSeconds: cfg.pauseSeconds }, location.origin);
  },
};
window.addEventListener("message", (e) => {
  if (e.source !== window || e.data?.source !== "upsc-pods-focus") return;
  if (e.data.type === "hello") { ext.connected = true; ext.version = e.data.version; ext.send(); if (route().name === "focus") render(); }
});

let lastTickDone = false;
function tick() {
  const f = store.get("focus");
  let pill = $("#pill");
  if (!f) { pill?.remove(); document.title = "Aspiran"; return; }
  const left = f.endsAt - Date.now();
  if (left <= 0) {
    if (!lastTickDone) { lastTickDone = true; finishFocus(f); }
    return;
  }
  lastTickDone = false;
  // A count-up mock paper shows no countdown anywhere, the tab title included.
  document.title = f.kind === "mock" && store.get("mock:active")?.paper?.countUp ? f.label : `${mmss(left)} · ${f.label}`;
  if (f.kind === "mock") { pill?.remove(); return; } // the paper shows its own timer
  if (!pill) {
    pill = h("div.pill", { id: "pill", role: "timer", "aria-live": "off" });
    document.body.append(pill);
  }
  put(pill, 
    h("span", f.kind === "five" ? "Just 5 minutes" : f.label), h("strong", { style: { fontVariantNumeric: "tabular-nums" } }, mmss(left)),
    h("button", { onclick: () => askStop() }, "Stop"),
  );
}
setInterval(tick, 1000);

function finishFocus(f) {
  focus.stop(true);
  if (f.kind === "mock") { const a = store.get("mock:active"); if (a && !a.paper.countUp) mockSubmit(); return; }
  if (f.task) markStarted(f.task);
  if (document.hidden && "Notification" in window && Notification.permission === "granted") {
    try { new Notification(f.kind === "five" ? "Five minutes done." : "Focus block done.", { body: "Stand up, drink water, look out of a window.", icon: "icon-192.png" }); } catch {}
  }
  if (focusCfg().sound) chime();
  const d = h("dialog");
  const body = f.kind === "five"
    ? [h("h2", "Five minutes done."), h("p", "You started, and that counts."),
      h("div.row", h("button", { onclick: () => d.close() }, "Stop here"), h("button.primary", { onclick: () => { d.close(); if (f.task) location.hash = TASKS.find((t) => t.id === f.task)?.go ?? "#today"; } }, "Keep going"))]
    : [h("h2", `${f.minutes} minutes done.`), h("p", "Take a real break: stand up, drink some water, look out of a window for a minute."),
      h("div.row", h("button.primary", { onclick: () => { d.close(); focus.start(5, "Break", "break"); } }, "5-minute break"),
        h("button", { onclick: () => { d.close(); location.hash = "#calm/slow-breath-1"; } }, tr("calm.afterFocus")),
        h("button", { onclick: () => d.close() }, "Done"))];
  d.append(...body);
  document.body.append(d);
  d.addEventListener("close", () => { d.remove(); render(); });
  d.showModal();
}

/** Ending early asks for a short pause first, so stopping is a choice and not a reflex. */
function askStop() {
  const f = focus.active;
  if (!f) return;
  if (f.kind === "five" || f.kind === "break") { focus.stop(false); render(); return; }
  let wait = focusCfg().pauseSeconds;
  const stop = h("button", { disabled: wait > 0, onclick: () => { d.close(); focus.stop(false); render(); } }, `Stop (${wait})`);
  const d = h("dialog", h("h2", "Stop the session?"), h("p", `${mmss(f.endsAt - Date.now())} left. Take a breath first. If you still want to stop, that's fine.`),
    h("div.row", h("button.primary", { onclick: () => d.close() }, "Keep going"), stop));
  const t = setInterval(() => { wait--; stop.textContent = wait > 0 ? `Stop (${wait})` : "Stop"; stop.disabled = wait > 0; if (wait <= 0) clearInterval(t); }, 1000);
  d.addEventListener("close", () => { clearInterval(t); d.remove(); });
  document.body.append(d);
  d.showModal();
}

function chime() {
  try {
    const ac = new AudioContext(); const o = ac.createOscillator(); const g = ac.createGain();
    o.frequency.value = 660; g.gain.setValueAtTime(0.12, ac.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 1.2);
    o.connect(g).connect(ac.destination); o.start(); o.stop(ac.currentTime + 1.2);
  } catch {}
}

// --- Routing and the shell ---------------------------------------------------------------------

// Bottom nav and side rail, in this order. Prep's own sub-tabs show as a second rail inside Prep.
const NAV = [
  ["adda", "nav.adda", "☕"], ["pod", "nav.pod", "👥"], ["chotu", "nav.chotu", "◡"], ["prep", "nav.prep", "✎"], ["me", "nav.me", "☺"],
];
const PREP_TABS = [
  ["upgrade", "nav.plus"], ["today", "nav.today3"], ["chai", "nav.chai"], ["practice", "nav.practice"], ["mock", "nav.mocks"], ["read", "nav.read"], ["learn", "nav.learn"], ["focus", "nav.focus"], ["plan", "nav.plan"],
];
// Which tab a route belongs to; anything not listed is Adda.
const TAB_OF = {
  pod: "pod", rooms: "pod", chotu: "chotu", me: "me", room: "me", path: "me", profile: "me", rhythm: "me", stamps: "me", plus: "me", privacy: "me", gift: "me", paid: "me", receipts: "me",
  prep: "prep", today: "prep", review: "prep", walk: "prep", print: "prep", optional: "prep", terms: "prep", map: "prep", vine: "prep", chai: "prep", practice: "prep", prelims: "prep", mains: "prep", essay: "prep", interview: "prep", casefile: "prep", progress: "prep", mock: "prep", read: "prep", focus: "prep", plan: "prep", routine: "prep", roadmap: "prep",
  learn: "prep", try: "prep", upgrade: "prep", skeletons: "prep", cases: "prep", csat: "prep", ptest: "prep", pcompile: "prep", insights: "prep", revise: "prep",
};
const PREP_OF = { try: "learn", skeletons: "practice", cases: "practice", csat: "practice", walk: "practice", print: "practice", optional: "practice", terms: "practice", review: "today", map: "plan", vine: "plan", ptest: "practice", pcompile: "practice", insights: "practice", revise: "practice", prelims: "practice", mains: "practice", essay: "practice", interview: "practice", casefile: "practice", progress: "practice", routine: "plan", roadmap: "plan", prep: "today" };
const spaceOf = (name) => (TAB_OF[name] === "prep" ? "prep" : "adda");
// Honest tools and the shelf work without an account (spec §2.1, "free, no card needed").
// "Try one topic" (try.js) too: one whole syllabus topic, open to anyone.
const PUBLIC = new Set(["shelf", "compass", "cost", "maps", "thinker", "routine", "roadmap", "calm", "talk", "try"]);

function route() {
  const [name, ...rest] = (location.hash.slice(1) || "adda").split("/");
  return { name, arg: rest.join("/") };
}
// What the admins switched on, and live announcements. Cached, so the app works offline.
let config = store.get("config") || { flags: {}, announcements: [] };
const on = (flag) => config.flags?.[flag] !== false;
/** Plus is off unless the flag is explicitly on. */
const plusOn = () => config.flags?.plus === true;
function loadConfig() {
  fetch("/config").then((r) => (r.ok ? r.json() : null)).then((c) => {
    if (!c) return;
    const changed = JSON.stringify(c) !== JSON.stringify(config);
    config = c; store.set("config", c);
    if (c.auth) Auth.init(c.auth).then(() => changed && render());
    if (changed && !document.querySelector("input:focus, textarea:focus")) render();
  }).catch(() => {});
}

/**
 * Result-day mode: 72 hours from the start of a result day (set by the admins, or switched on by you in Me).
 * Adda shrinks to one card, Chotu is off apart from one supportive line, no wins posts, no offers.
 */
function resultMode() {
  const mine = store.get("resultMode");
  if (mine && mine.until > Date.now()) return { label: "You switched on result-day mode", mine: true };
  const now = Date.now();
  for (const r of config.results ?? []) {
    const start = Date.parse(r.day + "T00:00:00+05:30");
    if (now >= start && now < start + 72 * 3600_000) return r;
  }
  return null;
}
/** Pause mode (Me → Privacy): no questions, no offers, no nudges until you come back. */
const paused = () => (store.get("pausedUntil") ?? 0) > Date.now();

const PAUSED = { mock: "mocks", read: "long_reads", pod: "pod_chat", prelims: "practice" };
function banner() {
  const gone = store.get("dismissed") || [];
  const a = (config.announcements || []).find((x) => !gone.includes(x.id));
  if (!a) return null;
  return h("div.card", { role: "status", style: { borderColor: a.level === "important" ? "var(--brand)" : "", marginBottom: "16px" } },
    h("div.row.between", h("strong", a.title), h("button.ghost.small", { "aria-label": "Dismiss", onclick: () => { store.set("dismissed", [...gone, a.id].slice(-50)); render(); } }, "✕")),
    h("p", { style: { margin: "6px 0 0" } }, a.body),
    a.link && /^(https:\/\/|\/|#)/.test(a.link) ? h("a", { href: a.link, target: a.link.startsWith("https://") ? "_blank" : null, rel: "noopener" }, "Open") : null);
}

/** The "Chotu · AI" label: always next to the kulhad, everywhere Chotu appears. */
const chotuLabel = (tone, size = 28) => h("span.chotu-label", kulhad(tone ?? toneNow({ result: !!resultMode() }), size), h("span", "Chotu · AI"));
/** Chotu's AI study friends in pods (server/src/friends.ts): always labelled AI, never members, never counted. */
const FRIENDS = {
  "friend:meera": { color: "#b5543c", bio: "AI study friend. Hosts the answer-writing hours and shares Mains writing tips." },
  "friend:arjun": { color: "#3f51b5", bio: "AI study friend. Suggests a small morning block and a short close to the day." },
  "friend:ira": { color: "#2e7d32", bio: "AI study friend. Posts one GS1 note a day: history, art and culture, geography, society." },
  "friend:kabir": { color: "#c98a12", bio: "AI study friend. Drops a quick question most days and the answer later." },
};
// Older pod messages from before the rename (2 Nov 2026).
const OLD_FRIENDS = { "friend:pooja": { color: "#2e7d32", bio: "AI study friend." } };
const isFriend = (m) => String(m.memberId).startsWith("friend:");
const friendInfo = (id) => FRIENDS[id] ?? OLD_FRIENDS[id];
const friendLabel = (m, size = 20) => h("span.chotu-label", { title: friendInfo(m.memberId)?.bio ?? "AI study friend" }, kulhad("warm", size, friendInfo(m.memberId)?.color ?? "#888"), h("span", m.name), h("span.tag", "AI"));

let cleanup = [];
function render() {
  cleanup.forEach((f) => f()); cleanup = [];
  const root = $("#root");
  applyLang();
  const r = route();
  const space = spaceOf(r.name);
  document.documentElement.dataset.space = space;
  // A link from a "Reset your password" email: #reset=<code>.
  if (r.name.startsWith("reset=")) { put(root, resetScreen(r.name.slice(6))); return; }
  // Sign-in (auth.js): a switched-off account, or an install that hasn't signed in yet. Offline (even past the 72-hour
  // check) the app reads what this browser has, under a calm banner (offlineBanner).
  if (Auth.suspended() && !PUBLIC.has(r.name)) { put(root, suspendedView()); return; }
  const needsSignIn = profile() && !Auth.optional() && !Auth.signedIn();
  if (!profile() || needsSignIn) {
    // The shelf's honest tools work before (and without) signing up or signing in.
    if (PUBLIC.has(r.name)) {
      put(root, h("div.shell.public", h("main", { id: "main" },
        r.name !== "try" && h("div.row.between", { style: { marginBottom: "12px" } }, h("a.brand", { href: "#shelf" }, "Aspiran · Free Shelf"), h("a.btn", { href: "#" }, "Join, free, no card needed")),
        VIEWS[r.name](r.arg))));
      return;
    }
    put(root, needsSignIn ? signInScreen() : onboarding()); return;
  }
  const isPaused = PAUSED[r.name] && !on(PAUSED[r.name]);
  const view = isPaused
    ? h("div.col", h("div.card", h("h2", { style: { marginTop: 0 } }, tr("paused.title")), h("p", tr("paused.body")), h("a", { href: "/status", target: "_blank" }, tr("paused.link"))))
    : (VIEWS[r.name] ?? VIEWS.adda)(r.arg);
  const immersive = r.name === "mock" && store.get("mock:active");
  document.documentElement.classList.toggle("focus-shell", !!immersive);
  const tab = TAB_OF[r.name] ?? "adda";
  const navLinks = () => NAV.map(([id, label, icon]) =>
    h("a.tab", { href: "#" + id, "aria-current": tab === id && !["calm", "talk"].includes(r.name) ? "page" : null },
      id === "chotu" ? kulhad(toneNow({ result: !!resultMode() }), 22) : h("span", { "aria-hidden": "true" }, icon), tr(label)));
  const sub = PREP_OF[r.name] ?? r.name;
  const prepRail = space === "prep" && !immersive && h("nav.subrail", { "aria-label": "Prep" },
    PREP_TABS.map(([id, label]) => h("a.subtab", { href: "#" + id, "aria-current": sub === id ? "page" : null }, tr(label))));
  put(root, h("div.shell",
    h("nav.side", { "aria-label": "Main" }, h("div.brand", "Aspiran"), navLinks(), h("div.spacer"), themeButton(),
      h("a.tab", { href: "#calm", "aria-current": r.name === "calm" ? "page" : null }, h("span", { "aria-hidden": "true" }, "◌"), tr("nav.calm")),
      h("a.tab", { href: "#talk", "aria-current": r.name === "talk" ? "page" : null }, h("span", { "aria-hidden": "true" }, "♡"), tr("nav.talk"))),
    h("main", { id: "main" }, h("div.mobilebar", themeButton(true), h("a", { href: "#calm" }, "◌ " + tr("nav.calm")), h("a", { href: "#talk" }, "♡ " + tr("nav.talk"))), prepRail, offlineBanner(), on("announcements") && space === "adda" ? banner() : null, view),
    h("nav.bottom", { "aria-label": "Main" }, navLinks()),
  ));
  tick();
  window.scrollTo(0, 0);
}
window.addEventListener("hashchange", render);
loadConfig();

// --- First run ---------------------------------------------------------------------------------
// Welcome and language; sign in (Google); 18+ and consent; nickname; then "Meet Chotu", then Adda. Nothing about
// stage, attempts, age or mood is asked here: those come later, one at a time, when they help.

function onboarding() {
  const o = (onboarding.state ??= { step: 0, lang: langOptions().some((x) => x.code === navigator.language?.slice(0, 2)) ? navigator.language.slice(0, 2) : "en", adult: false, consent: false, name: "" });
  const tl = (k) => t(k, o.lang);
  const redraw = () => put($("#root"), onboarding());
  const step = (n) => { o.step = n; redraw(); };
  const dots = o.step === 0 ? null : h("div.dots", { "aria-label": `Step ${Math.min(o.step + 1, 5)} of 5` }, [0, 1, 2, 3, 4].map((i) => h("i" + (i === o.step ? ".on" : ""))));
  let body;
  if (o.step === 0) {
    // The home page for anyone new: a welcome in eleven languages, the app in English (Hindi where it exists),
    // and a prominent way to ask for your own language.
    // The whole syllabus and the way Aspiran teaches it come first (owner, 4 Nov 2026): the breadth is the honest
    // picture, and every leaf starts dark. Then the welcome.
    body = [h("p.small.muted.center", { style: { margin: 0 } }, tl("onboard.title")),
      h("h1.center", "The whole UPSC syllabus. Every line of it."),
      gardenSection({ hero: false, note: false, height: 360 }),
      h("p.center", "Every leaf is one line of UPSC's syllabus. It's meant to look like a lot, because it is. Each leaf lights up as you meet its topic, and deepens as you recall it and use it."),
      pitchCard(),
      welcomeScene(kulhad),
      h("h2.center", "Welcome to the Adda"),
      h("p.center", "Pull up a chair. A pod of people at your stage, Chotu, Calm and today's Chai. Free, no card needed."),
      h("div.center", { style: { margin: "12px 0 4px" } }, h("button.primary", { style: { padding: "12px 28px", fontSize: "17px" }, onclick: () => step(Auth.optional() || (o.memberId && Auth.signedIn()) ? 2 : 1) }, "Come in")),
      h("div.card", h("h3", { style: { marginTop: 0 } }, tl("lang.label")),
        langPicker(() => o.lang, (v) => { o.lang = v; document.documentElement.lang = v; redraw(); }),
        h("p.small.muted", tl("lang.note"))),
      requestPanel(),
      h("p.small.center", h("a", { href: "#try" }, "Try one whole topic first, no account needed"), " · ", h("a", { href: "#shelf" }, "Look around the Free Shelf"))];
  } else if (o.step === 1) {
    body = [h("h1", "Sign in"),
      h("p", "So your pod, stamps and settings stay yours, and so the Adda stays safe. Sign in with Google, or with a username and password. Your email or username is only for signing in: your pod never sees it, and it never goes to Chotu."),
      signInPanel(null, (memberId) => { o.memberId = memberId; step(2); }),
      h("div.row", h("button", { onclick: () => step(0) }, "Back")),
      h("p.small.center", "Just looking? ", h("a", { href: "#try" }, "Try one topic"), " or the ", h("a", { href: "#shelf" }, "Free Shelf"), ", no account needed")];
  } else if (o.step === 2) {
    const adult = h("input", { type: "checkbox", id: "adult", checked: o.adult, onchange: (e) => { o.adult = e.target.checked; go.disabled = !(o.adult && o.consent); } });
    const consent = h("input", { type: "checkbox", id: "consent", checked: o.consent, onchange: (e) => { o.consent = e.target.checked; go.disabled = !(o.adult && o.consent); } });
    const go = h("button.primary", { disabled: !(o.adult && o.consent), onclick: () => step(3) }, "Next");
    body = [h("h1", "Two quick things"),
      h("div.card",
        h("p", h("label", adult, " ", tl("onboard.adult"))),
        h("p", h("label", consent, " ", tl("onboard.kind"))),
        h("p.small.muted", "Your notes, journal and answers stay in this browser. The server gets your sign-in (your Google email or username, kept only for signing in), a member id, your pod messages, and later, only if you choose, four things for pod matching (stage, attempt band, language, study time)."),
        h("div.row", h("button", { onclick: () => step(Auth.optional() ? 0 : 1) }, "Back"), go))];
  } else if (o.step === 3) {
    const name = h("input", { type: "text", maxLength: 40, placeholder: tl("onboard.namePh"), autocomplete: "nickname", value: o.name, oninput: (e) => (o.name = e.target.value) });
    body = [h("h1", tl("onboard.name")),
      h("div.card", name, h("p.small.muted", "Only your pod sees it. It never goes to Chotu."),
        h("div.row", { style: { marginTop: "12px" } }, h("button", { onclick: () => step(2) }, "Back"), h("button.primary", { onclick: () => step(4) }, "Next")))];
    setTimeout(() => name.focus(), 0);
  } else {
    body = [h("div.center", kulhad("warm", 96)), h("h1.center", "Meet Chotu"), h("p.center", h("span.ai-tag", "Chotu · AI")),
      h("div.card",
        h("p", "I'm a small clay kulhad that has sat on a lot of library desks. I can keep you company, explain a Chai card, quiz you, or plan a day of at most three things."),
        h("p", "I'm an AI. I don't predict ranks or results, I won't tell you whether to keep going or stop, and if things feel heavy I'll point you to real people who can help."),
        h("button.primary", { onclick: finishOnboarding }, "Take me to the Adda"))];
  }
  return h("main", { lang: o.lang }, h("div.col", dots, body));
}

function finishOnboarding() {
  const o = onboarding.state;
  // The server linked (or made) this member id at sign-in; without sign-in (rollout only) it's a random one as before.
  const memberId = o.memberId ?? Auth.session()?.memberId ?? randomId();
  store.set("profile", { name: o.name.trim() || "Aspirant", lang: o.lang, memberId, createdOn: today() });
  P.setField("lang", POD_LANG[o.lang] ?? "english", "asked");
  // A record that they agreed, and to which version (DPDP). Only the random member id, nothing else.
  fetch("/consent", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ memberId, version: config.consentVersion, purposes: ["pods", "safety"] }) }).catch(() => {});
  onboarding.state = null;
  M.track("onboarding_done");
  location.hash = "#adda"; render();
}

// --- Today -------------------------------------------------------------------------------------

function greeting() {
  const hr = new Date().getHours();
  const n = profile().name;
  return hr < 12 ? `Good morning, ${n}` : hr < 17 ? `Good afternoon, ${n}` : `Good evening, ${n}`;
}

function viewToday() {
  const s = dayState();
  const plan = store.get("plan");
  const firstStep = plan && plan.madeOn < today() && plan.madeOn >= addDays(today(), -1) ? plan : null;
  const rm = resultMode();
  // Result-day mode: Prep shrinks too. Nothing to do today unless you want to.
  if (rm) return h("div.col", h("h1", "Today's 3"), h("div.card.soft", h("p", "Whatever happened, you're more than a roll number."), h("p.small.muted", "Nothing here needs doing today. It'll all be here when you want it.")));
  // One step at a time (teaching plan, build step 3): the next thing to do, big; the full list one tap away.
  const due = reviewItems().length;
  const steps = [
    firstStep && !s.firstStepDone && { title: plan.line, sub: "Your first step, from last night · 5 min",
      act: [h("button.primary", { onclick: () => focus.start(5, "First step", "five") }, "Just 5 minutes"),
        h("button.ghost", { onclick: () => { const d = dayState(); d.firstStepDone = true; saveDay(d); render(); } }, "Did it")] },
    due > 0 && !s.reviewed && { title: `Review: ${due} due`, sub: `Recall first · about ${reviewMinutes(due)} min`,
      act: [h("a.btn.primary", { href: "#review" }, "Start the review")] },
    ...TASKS.filter((t) => !s.done.includes(t.id)).map((t) => ({ title: t.title, sub: `${t.minutes} min · ${t.subject}${s.started.includes(t.id) ? " · Started" : ""}`,
      act: [h("button.primary", { onclick: () => { markStarted(t.id); focus.start(5, t.title, "five", t.id); location.hash = t.go; } }, "Just 5 minutes"),
        h("a.btn", { href: t.go }, `All ${t.minutes} min`)] })),
  ].filter(Boolean);
  const step = steps[0];
  const nextCard = step
    ? h("div.card", h("div.small.muted", "Next"), h("h2", { style: { margin: "4px 0" } }, step.title), h("div.small.muted", step.sub),
      h("div.row", { style: { marginTop: "12px", flexWrap: "wrap" } }, ...step.act),
      steps.length > 1 && h("p.small.muted", `Then ${steps.length - 1} more.`))
    : h("div.card", h("h2", { style: { marginTop: 0 } }, "You're done for today. Really."), h("p.muted", "The rest of the day is yours. Close the Day tonight if you like."));
  // The garden and the method come first (owner, 4 Nov 2026); the day's work follows.
  const syllabus = h("div.card", { style: { padding: "14px" } },
    h("div.row.between", h("strong", { style: { fontFamily: "var(--head-font)", fontSize: "18px" } }, "Your syllabus"), h("a", { href: "#map" }, "All of it →")),
    gardenSection({ height: 340, hero: true, note: false }));
  const tasks = h("div.card",
    h("h2", { style: { marginTop: 0 } }, "Today's 3"),
    (due > 0 || s.reviewed) && h("div.task",
      h("div.status", s.reviewed && !due ? "✓" : "○"),
      h("div.grow", h("a", { href: "#review" }, "Review"), h("div.small.muted", s.reviewed && !due ? "Done" : `${due} due · about ${reviewMinutes(due)} min`))),
    firstStep && h("div.task",
      h("div.status", s.firstStepDone ? "✓" : "→"),
      h("div.grow", h("div", plan.line), h("div.small.muted", "Tomorrow's first step, from last night")),
      !s.firstStepDone && h("button", { onclick: () => { focus.start(5, "First step", "five"); } }, "Just 5 minutes"),
      !s.firstStepDone && h("button.ghost", { onclick: () => { const d = dayState(); d.firstStepDone = true; saveDay(d); render(); } }, "Did it")),
    TASKS.map((t) => {
      const done = s.done.includes(t.id), started = s.started.includes(t.id);
      return h("div.task",
        h("div.status", { "aria-label": done ? "Done" : started ? "Started" : "Not started" }, done ? "✓" : started ? "◐" : "○"),
        h("div.grow", h("a", { href: t.go }, t.title), h("div.small.muted", `${t.minutes} min · ${t.subject}${started && !done ? " · Started" : ""}`)),
        !done && h("a.btn", { href: t.go }, `All ${t.minutes} min`));
    }),
    s.done.length > 0 && h("p.small.muted", `${s.done.length} done. You did that.`),
    s.done.length === 0 && s.started.length > 0 && h("p.small.muted", "Started counts. Five minutes is a real start."),
  );
  const fm = focus.minutesOn(today());
  return h("div.col", X.plusBanner(),
    h("h1", greeting()),
    syllabus,
    pitchCard({ open: (profile().createdOn ?? today()) >= addDays(today(), -6) }),
    h("p.muted", data.brief?.date ? `Chai for ${data.brief.date}` : "Today's Chai isn't out yet."),
    h("p.small", h("a", { href: "#pod" }, podLine())),
    BR.welcomeBack(gapAtOpen),
    profileAsk("today"),
    routineCard(),
    nextCard,
    h("details", h("summary", "Today's full list"), tasks),
    h("div.card", h("div.row.between",
      h("div", h("strong", "Long session?"), h("div.small.muted", fm ? `${fm} focused minutes today.` : "Start a focus block. Distracting sites stay closed until it ends.")),
      h("a.btn", { href: "#focus" }, "Focus"))),
    h("div.card", h("div.row.between",
      h("div", h("strong", "Mock papers"), h("div.small.muted", "Timed, with negative marking, scored as a range.")),
      h("a.btn", { href: "#mock" }, "Open"))),
  );
}

// --- Close the Day -----------------------------------------------------------------------------

const CUES = ["morning chai", "breakfast", "my walk", "reaching the library", "lunch"];
function viewClose() {
  const day = today();
  if (store.get("closed:" + day)) {
    const slipped = dayState().done.length === 0;
    const plan = store.get("plan");
    return h("div.col", h("h1", slipped ? "Slipped today. Most people do some days." : "Day closed. You showed up. That counts."),
      h("p", plan?.madeOn === day ? "Tomorrow's first step is ready: " + plan.line : "Tomorrow starts fresh."),
      h("p", "Good night."), rhythmDots(true), h("a.btn", { href: "#adda" }, "Back to the Adda"));
  }
  const s = dayState();
  const memory = h("textarea", { placeholder: "In your own words, without looking.", rows: 3 });
  const after = h("input", { type: "text", placeholder: "morning chai", maxLength: 60 });
  const step = h("input", { type: "text", placeholder: "read the Polity chapter on Parliament", maxLength: 120 });
  const block = h("input", { type: "text", placeholder: "Optional", maxLength: 200 });
  let mood = null;
  const moods = [["GOOD", "Good"], ["OKAY", "Okay"], ["LOW", "Low"], ["HEAVY", "Heavy"]];
  const care = h("div");
  const checkCare = () => put(care, ...((mood === "HEAVY" || [memory, step, block].some((x) => distress(x.value))) ? [careBox()]
    : mood === "LOW" ? [h("p", h("a", { href: "#calm" }, tr("calm.tryIt")))] : []));
  [memory, step, block].forEach((x) => x.addEventListener("input", checkCare));
  const save = h("button.primary", { onclick: async () => {
    const entry = { day, did: s.done, memory: memory.value.trim(), after: after.value.trim(), step: step.value.trim(), block: block.value.trim(), mood };
    const journal = store.get("journal", {});
    journal[day] = await vault.seal(entry);
    store.set("journal", journal);
    if (entry.step) store.set("plan", { text: entry.step, after: entry.after || null, madeOn: day, line: entry.after ? `After ${entry.after}, I'll ${entry.step} for 5 minutes` : `${entry.step} for 5 minutes` });
    store.set("closed:" + day, true);
    award("first_close");
    M.ritualOnce("close_day");
    render();
    rateAfter("close_day");
  } }, "Close the Day");
  return h("div.col", h("h1", "Close the Day"), h("p.muted", "Only you can see this. Everything is optional."),
    h("div.card", h("h3", { style: { marginTop: 0 } }, "What I did today"),
      h("p", s.done.length ? s.done.map((id) => TASKS.find((t) => t.id === id)?.title).join(", ") : "Nothing ticked. That's allowed."),
      h("h3", "One thing I can say from memory"), memory,
      h("h3", "Tomorrow's first step"),
      h("div.row", h("span", "After"), h("div.grow", after)),
      h("div.chips", { style: { margin: "6px 0" } }, CUES.map((c) => h("button.chip", { onclick: () => { after.value = c; } }, c))),
      h("div.row", h("span", "I'll"), h("div.grow", step), h("span", "for 5 minutes.")),
      h("h3", "Anything get in the way?"), block,
      h("h3", "How was today?"),
      h("div.chips", moods.map(([v, l]) => { const b = h("button.chip", { "aria-pressed": "false", onclick: () => { mood = v; b.parentElement.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); checkCare(); } }, l); return b; })),
      care, h("div", { style: { marginTop: "16px" } }, save)));
}

// --- Chai --------------------------------------------------------------------------------------

function cardText(it) {
  const hi = hindi() && it.hi ? it.hi : null;
  return hi
    ? { lang: "hi", headline: hi.headline, summary: hi.summary, why: hi.whyForUpsc, mcq: hi.mcq, mains: hi.mainsPrompt, facts: hi.keyFacts ?? [], checkedBy: hi.checkedBy, checkedOn: hi.checkedOn, chips: hi.chips?.length ? hi.chips : null }
    : { lang: "en", headline: it.headline, summary: it.summary, why: it.whyForUpsc, mcq: it.examCorner?.mcq, mains: it.examCorner?.mainsPrompt, facts: it.examCorner?.keyFacts ?? [], checkedBy: it.checkedBy, checkedOn: it.checkedOn, chips: null };
}
const chipsOf = (it, t) => (t.chips ?? (it.chips?.length ? it.chips : [it.gsPaper, it.topic, it.examType === "both" ? "Prelims + Mains" : it.examType, it.staticLink].filter(Boolean))).slice(0, 4);

function mcqBlock(mcq, onAnswer) {
  let picked = null;
  const box = h("div");
  const draw = () => put(box, h("p", h("strong", mcq.question)),
    mcq.options.map((o, i) => h("button.opt" + (picked == null ? "" : i === mcq.answerIndex ? ".right" : i === picked ? ".wrong" : ""),
      { disabled: picked != null, onclick: () => { picked = i; onAnswer?.(i === mcq.answerIndex); draw(); } }, o)),
    picked != null && h("p", (picked === mcq.answerIndex ? "✓ Right. " : "○ Not quite. ") + (mcq.explanation ?? "")));
  draw();
  return box;
}

function viewChai(arg) {
  const items = data.brief?.items ?? [];
  if (!items.length) return h("div.col", h("h1", "Today's Chai"), h("p", "Today's cards aren't out yet. They come out at 7:00 after an editor checks them."));
  const i = Math.min(Math.max(Number(arg) || 0, 0), items.length);
  if (i === items.length) {
    if (!dayState().done.includes("CHAI")) { M.track("chai_read", { cards: items.length }); rateAfter("chai"); }
    markDone("CHAI");
    return h("div.col.center", h("h1", "That's today's Chai."), pauseLine("news-enough"), h("p.muted", `${items.length} cards. See you tomorrow morning.`),
      h("div.row", { style: { justifyContent: "center" } }, h("a.btn.primary", { href: "#prelims" }, "Prelims practice"), h("a.btn", { href: "#today" }, "Today")));
  }
  const it = items[i], t = cardText(it);
  const saved = store.get("saved", []);
  const isSaved = saved.some((x) => x.id === it.id);
  const nav = (n) => { location.hash = `#chai/${n}`; };
  const onKey = (e) => { if (e.target.closest("input, textarea")) return; if (e.key === "ArrowRight") nav(i + 1); if (e.key === "ArrowLeft" && i > 0) nav(i - 1); };
  window.addEventListener("keydown", onKey); cleanup.push(() => window.removeEventListener("keydown", onKey));
  const examOpen = h("details", h("summary", "Open Exam Corner"),
    t.mcq && mcqBlock(t.mcq, (right) => {
      const rec = store.get("recall", {}); rec[it.id] = { day: today(), right, topic: it.topic }; store.set("recall", rec);
      const q = { id: "card-" + it.id, cardId: it.id, topic: it.topic, en: it.examCorner?.mcq, hi: it.hi?.mcq ?? null };
      if (right) gotRight(q); else addMiss(q);
    }),
    t.mains && h("p", h("strong", "Mains: "), t.mains),
    t.facts.length > 0 && h("div", h("strong", "Key facts"), h("ul", t.facts.map((f) => h("li", f)))),
    h("p.small.muted", it.examCorner?.pyq ?? "No direct PYQ"));
  return h("div.col",
    h("div.row.between", h("span.small.muted", `Card ${i + 1} of ${items.length}`), h("div.bar", { style: { width: "40%" } }, h("i", { style: { width: `${((i + 1) / items.length) * 100}%` } }))),
    h("article.card", { lang: t.lang },
      h("div.chips", chipsOf(it, t).map((c) => h("span.chip", c))),
      it.tone === "tragic" && h("p.small.muted", "This one is heavy. It's okay to skip it."),
      it.illustration && !store.get("dataSaver") && h("img", { src: it.illustration, alt: "", style: { width: "100%", borderRadius: "12px", marginTop: "12px" } }),
      h("h1", { style: { marginTop: "12px" } }, t.headline),
      h("div.reader", { style: { fontSize: "18px", margin: 0 } }, h("p", t.summary)),
      it.tone !== "tragic" && readAloud([t.headline, t.summary, ...(t.why?.length ? ["Why this matters for UPSC", ...t.why] : [])].join("\n"), t.lang),
      t.why?.length > 0 && h("div", h("h3", "Why this matters for UPSC"), h("ul", t.why.map((w) => h("li", w)))),
      examOpen,
      h("hr", { style: { border: 0, borderTop: "1px solid var(--line)", margin: "16px 0" } }),
      h("div.small.muted", (it.sources ?? []).map((s, k) => [k ? " · " : "Source: ", h("a", { href: s.url, target: "_blank", rel: "noopener noreferrer" }, s.name)])),
      h("div.small.muted", it.writtenBy ? "Written by our editors" : "Summary drafted by AI from these sources"),
      h("div.small", t.checkedBy ? `Checked by ${t.checkedBy}, ${t.checkedOn} ✓` : "Not yet checked by an editor"),
      h("div.row", { style: { marginTop: "8px" } },
        h("button.ghost", { onclick: () => { const list = store.get("saved", []).filter((x) => x.id !== it.id); if (!isSaved) list.push({ ...it, savedOn: today() }); store.set("saved", list); render(); } }, isSaved ? "✓ Saved for revision" : "Save for revision"),
        it.tone !== "tragic" && keepButton(it, t),
        t.lang !== lang() && h("span.small.muted", tr("lang.cardMissing"))),
      it.highValue && it.tone !== "tragic" && !caseFile().some((x) => x.cardId === it.id) && h("p.small", `This one is worth keeping for ${/^GS[1-4]$/.test(it.gsPaper) ? it.gsPaper : "Mains"}.`)),
    h("div.row.between", h("button", { disabled: i === 0, onclick: () => nav(i - 1) }, "← Back"), h("span.small.muted", "Arrow keys work too"), h("button.primary", { onclick: () => nav(i + 1) }, "Next →")));
}

// --- Practice: Prelims, Mains, mock papers -----------------------------------------------------

// The review queue (teaching plan, build step 1): every missed question and every Chai question you've answered,
// scheduled by FSRS (fsrs.js). Each comes back when you're about to forget it; each right answer pushes it further out.
// It replaces the old Friday-misses and monthly "Remember these?" sets. Topics you've met on the syllabus map join it
// too (map.js). Stays in this browser.
function reviewQueue() {
  let all = store.get("reviews", null);
  if (!all) { // first run: bring in misses kept under the old 3-day rule
    all = {};
    for (const m of store.get("misses", [])) if (m.en) all[m.id] = { q: { id: m.id, cardId: m.cardId, topic: m.topic, en: m.en, hi: m.hi ?? null }, f: F.review(null, F.AGAIN, m.missedOn ?? today()) };
    store.set("reviews", all);
  }
  return all;
}
/**
 * Grade a question in the queue. A miss always enters it, and so does a right answer on a Chai card (it comes back in
 * a few days, then further out). A right answer on a starter-bank question only moves one that's already there.
 */
function reviewGrade(q, grade) {
  if (!q.en) return;
  const all = reviewQueue(), cur = all[q.id];
  if (!cur && grade !== F.AGAIN && !q.cardId) return;
  all[q.id] = { q: { id: q.id, cardId: q.cardId, topic: q.topic, en: q.en, hi: q.hi ?? null }, f: F.review(cur?.f ?? null, grade, today()) };
  const ids = Object.keys(all);
  if (ids.length > 500) ids.sort((a, b) => all[a].f.last.localeCompare(all[b].f.last)).slice(0, ids.length - 500).forEach((id) => delete all[id]);
  store.set("reviews", all);
}
/** Right and total answers per day, kept 120 days: only for the private sleep view in Your room. */
const logRight = (ok) => { const d = store.get("rightDays", {}), t = today(), x = d[t] ?? [0, 0]; x[0] += ok ? 1 : 0; x[1]++; d[t] = x;
  store.set("rightDays", Object.fromEntries(Object.entries(d).sort().slice(-120))); };
const addMiss = (q) => { logRight(false); if (!q.en) return; const m = store.get("misses", []).filter((x) => x.id !== q.id); m.push({ ...q, missedOn: today() }); store.set("misses", m.slice(-300)); reviewGrade(q, F.AGAIN); };
const gotRight = (q) => { logRight(true); store.set("misses", store.get("misses", []).filter((m) => m.id !== q.id)); reviewGrade(q, F.GOOD); };
/** Questions due today, the most overdue first. */
const dueReviews = (day = today()) => Object.values(reviewQueue()).filter((r) => r.f.due <= day).sort((a, b) => a.f.due.localeCompare(b.f.due)).map((r) => r.q);
const mcqOf = (q) => (hindi() && q.hi ? q.hi : q.en);

function prelimsSet() {
  const day = today();
  const fixed = store.get("prelims:" + day);
  if (fixed) return fixed;
  // New questions only: what's due for revision is in the review (#review), so nothing is asked twice in a day.
  const cards = (data.questions?.fromCards ?? []);
  const bank = shuffle(data.questions?.bank ?? [], Number(day.replace(/-/g, "")));
  const set = [...cards, ...bank].filter((q) => q.en).slice(0, 5);
  store.set("prelims:" + day, set);
  return set;
}

function viewPractice() {
  const s = dayState();
  const mocks = libraryOf("mock");
  const hist = store.get("mockHistory", []);
  return h("div.col", X.plusBanner(), h("h1", "Practice"),
    h("div.card", { style: { padding: "14px" } }, gardenSection({ height: 360, hero: true, note: false }), h("a.btn", { href: "#map" }, "Open the whole garden →")),
    pitchCard(),
    h("div.card", h("div.row.between", h("div", h("strong", "Prelims: 5 questions"), h("div.small.muted", s.done.includes("PRELIMS") ? "Done today." : "About 5 minutes. Today's new questions.")), h("a.btn.primary", { href: "#prelims" }, "Start"))),
    h("div.card", h("div.row.between", h("div", h("strong", "Review"), h("div.small.muted", reviewLine())), h("a.btn", { href: "#review" }, "Open"))),
    h("div.card", h("div.row.between", h("div", h("strong", "Mains answer"), h("div.small.muted", s.done.includes("MAINS") ? "Written, marked and rewritten today." : "Write, mark it yourself, get a second opinion, rewrite. About 30 minutes.")), h("a.btn", { href: "#mains" }, "Write"))),
    h("a.card.link", { href: "#skeletons" }, h("div.row.between", h("div", h("strong", "Answer skeletons"), h("div.small.muted", libraryOf("mains-skeleton").length ? `${libraryOf("mains-skeleton").length} real Mains questions, each with a way in. Outline first, then compare.` : "Opens once the skeletons are approved.")), h("span", "→"))),
    h("a.card.link", { href: "#cases" }, h("div.row.between", h("div", h("strong", "Ethics (GS4)"), h("div.small.muted", libraryOf("gs4-case").length ? `${libraryOf("gs4-case").length} case studies, plus thinkers and terms in English and Hindi.` : "Opens once the cases are approved.")), h("span", "→"))),
    h("a.card.link", { href: "#csat" }, h("div.row.between", h("div", h("strong", "CSAT, one set a week"), h("div.small.muted", libraryOf("csat-week").length ? `${libraryOf("csat-week").length} weekly sets: numbers, reasoning, a table and a passage. Worked answers.` : "Opens once the CSAT sets are approved.")), h("span", "→"))),
    h("div.card", h("div.row.between", h("div", h("strong", "Essays in three snaps"), h("div.small.muted", `Skeleton, outline, essay, each compared with a guide. ${libraryOf("essay").length} topic${libraryOf("essay").length === 1 ? "" : "s"}.`)), h("a.btn", { href: "#essay" }, "Open"))),
    h("div.card", h("div.row.between", h("div", h("strong", "Your case file"), h("div.small.muted", `${caseFile().length} example${caseFile().length === 1 ? "" : "s"} kept from Chai for Mains.`)), h("a.btn", { href: "#casefile" }, "Open"))),
    h("a.card.link", { href: "#progress" }, h("div.row.between", h("div", h("strong", "You vs. you"), h("div.small.muted", "Your writing, your sense of sure, your markers. Only against your own past.")), h("span", "→"))),
    h("div.card", h("div.row.between", h("div", h("strong", "Mock interview"), h("div.small.muted", libraryOf("interview-bank").length ? "A board of five, questions from your own DAF. Answer aloud or type; an AI member can ask a follow-up." : "Opens once the interview questions are approved.")), h("a.btn", { href: "#interview" }, "Open"))),
    h("div.card", h("div.row.between", h("div", h("strong", "Mock papers"), h("div.small.muted", `${mocks.length} checked paper${mocks.length === 1 ? "" : "s"}, plus a quick mock from Chai questions.${hist.length ? ` ${hist.length} taken.` : ""}`)), h("a.btn", { href: "#mock" }, "Open"))),
    h("div.card", h("div.row.between", h("div", h("strong", "Saved cards"), h("div.small.muted", `${store.get("saved", []).length} saved for revision.`)), h("a.btn", { href: "#read/saved" }, "Read"))),
    h("a.card.link", { href: "#try" }, h("div.row.between", h("div", h("strong", "One topic, start to finish"), h("div.small.muted", "Federalism: guess, read, recall, real PYQs, a Mains plan, then into your review. About 75 minutes.")), h("span", "→"))),
    h("a.card.link", { href: "#learn" }, h("div.row.between", h("div", h("strong", "Learn and play"), h("div.small.muted", `${(data.library?.items ?? []).filter((i) => i.data?.play).length} flashcard decks, matches, timelines, quizzes and answer skeletons. Free.`)), h("span", "→"))),
    h("h2", "Away from the screen"),
    h("a.card.link", { href: "#walk" }, h("div.row.between", h("div", h("strong", "Walk mode"), h("div.small.muted", `Earphones in: the device voice names a topic or reads a card, you say three points aloud.${libraryOf("walk-script").length ? ` Plus ${libraryOf("walk-script").length} guided walks.` : ""}`)), h("span", "→"))),
    h("a.card.link", { href: "#print" }, h("div.row.between", h("div", h("strong", "Print this week's set"), h("div.small.muted", "A recall card, a mixed CSAT set and your own one-pagers, on paper.")), h("span", "→"))),
    libraryOf("audio-lecture").length > 0 && h("a.card.link", { href: "#talks" }, h("div.row.between", h("div", h("strong", "Audio lectures"), h("div.small.muted", `${libraryOf("audio-lecture").length} talks of 10 to 15 minutes, each with three quick checks.`)), h("span", "→"))),
    libraryOf("printable").length > 0 && h("a.card.link", { href: "#sheets" }, h("div.row.between", h("div", h("strong", "Printable sheets"), h("div.small.muted", `${libraryOf("printable").length} one-page tables, timelines and lists to print and pin up.`)), h("span", "→"))),
    h("h2", "Optional and terms"),
    h("a.card.link", { href: "#optional" }, h("div.row.between", h("div", h("strong", "Optional subject"), h("div.small.muted", libraryOf("optional-node").length ? `${[...new Set(libraryOf("optional-node").map((i) => i.data.optional))].map(optName).join(", ")}: topic by topic.` : "Opens once optional topics are approved.")), h("span", "→"))),
    h("a.card.link", { href: "#terms" }, h("div.row.between", h("div", h("strong", "English–Hindi terms"), h("div.small.muted", libraryOf("terms").length ? `${libraryOf("terms").reduce((n, i) => n + (i.data.terms?.length ?? 0), 0)} terms with meanings.` : "Opens once the term lists are approved.")), h("span", "→"))),
    h("h2", "Go deeper"), X.toolsStrip(),
    h("p.small", h("a", { href: "#upgrade" }, "See everything in Plus →")));
}

function viewPrelims() {
  const set = prelimsSet();
  if (!set.length) return h("div.col", h("h1", "Prelims practice"), h("p", "No questions yet. They come from today's checked Chai cards and the starter bank."));
  let i = 0, right = 0, firstRight = null;
  const results = [];
  viewPrelims.counted = false;
  const box = h("div");
  const draw = () => {
    if (i >= set.length) {
      markDone("PRELIMS");
      if (!viewPrelims.counted) { viewPrelims.counted = true; practiceFinished(set, results); }
      put(box, h("h2", `${right} of ${set.length} right.`),
        firstRight && h("p", `You got the ${firstRight} question right. That one's yours now.`),
        h("p.muted", "These come back in your review just before you'd forget them."), h("p.small.muted", `Added ${set.length} to the community season.`), h("a.btn", { href: "#today" }, "Back to Today"));
      return;
    }
    const q = set[i];
    put(box, h("div.small.muted", `${i + 1} of ${set.length} · ${q.topic}`),
      h("div.card", mcqBlock(mcqOf(q), (ok) => {
        results.push({ topic: q.topic, ok });
        if (ok) { right++; firstRight ??= q.topic; gotRight(q); } else addMiss(q);
        next.disabled = false;
      })), next);
    next.disabled = true;
  };
  const next = h("button.primary", { onclick: () => { i++; draw(); } }, "Next");
  draw();
  return h("div.col", h("h1", "Prelims practice"), box);
}

// --- Review: the one queue (teaching plan, build step 1) -----------------------------------------------
// Recall first: topics you've met that are due a check, then questions that are due. At most 20 in one go; the rest
// wait for tomorrow quietly.

const REVIEW_MAX = 20;
const nodes = () => store.get("map", {});
const putNode = (id, n) => { const m = nodes(); if (n) m[id] = n; else delete m[id]; store.set("map", m); };
function reviewItems(day = today()) {
  const m = nodes();
  const topics = Object.entries(m).filter(([id, n]) => MP.isDue(n, day) && SY.nodeById(id))
    .sort((a, b) => a[1].f.due.localeCompare(b[1].f.due)).map(([id]) => ({ node: id }));
  return [...topics, ...dueReviews(day).map((q) => ({ q }))].slice(0, REVIEW_MAX);
}
const reviewMinutes = (n) => Math.max(2, Math.ceil(n / 2));
function reviewLine() {
  const n = reviewItems().length;
  if (dayState().reviewed && !n) return "Done today.";
  return n ? `${n} due today · about ${reviewMinutes(n)} min. Each comes back just before you'd forget it.` : "Nothing due today. Missed questions, Chai questions and topics you've met come back here.";
}

function viewReview() {
  const day = today();
  const set = reviewItems(day);
  if (!set.length) return h("div.col", h("h1", "Review"),
    h("p", dayState().reviewed ? "That's today's review done." : "Nothing due today."),
    h("p.muted", "Questions you answer in Chai and Prelims, and topics you mark as met on your syllabus map, come back here just before you'd forget them."),
    h("div.row", h("a.btn.primary", { href: "#today" }, "Back to Today"), h("a.btn", { href: "#map" }, "Your syllabus map")));
  let i = 0, right = 0, asked = 0;
  const box = h("div");
  const next = h("button.primary", { onclick: () => { i++; draw(); } }, "Next");
  const draw = () => {
    if (i >= set.length) {
      const d = dayState(); d.reviewed = true; saveDay(d);
      put(box, h("h2", "That's today's review."),
        asked > 0 && h("p", `${right} of ${asked} question${asked === 1 ? "" : "s"} came back right.`),
        h("p.muted", "Each one returns just before you'd forget it. The ones you knew well wait longer."),
        h("a.btn.primary", { href: "#today" }, "Next step"));
      return;
    }
    const it = set[i];
    if (it.node) {
      const nd = SY.nodeById(it.node), n = nodes()[it.node];
      const grade = (g) => { logRight(g >= F.GOOD); putNode(it.node, MP.check(n, g, day)); i++; draw(); };
      put(box, h("div.small.muted", `${i + 1} of ${set.length} · ${nd.paper.short} · Topic check`),
        h("div.card", h("h2", { style: { marginTop: 0 } }, nd.name),
          h("p", "Close your notes. Say or write the main points from memory, then check them."),
          n.note && h("details", h("summary", "Check against what you wrote when you met it"), h("p", { style: { whiteSpace: "pre-wrap" } }, n.note)),
          roomNotesFor(it.node),
          h("p.small.muted", "How much came back?"),
          h("div.row", { style: { flexWrap: "wrap" } }, [[F.AGAIN, "Little"], [F.HARD, "Some, with effort"], [F.GOOD, "Most of it"], [F.EASY, "All of it, easily"]]
            .map(([g, l]) => h(g === F.GOOD ? "button.primary" : "button", { onclick: () => grade(g) }, l)))));
      return;
    }
    const q = it.q;
    put(box, h("div.small.muted", `${i + 1} of ${set.length} · ${q.topic ?? "Question"}`),
      h("div.card", mcqBlock(mcqOf(q), (ok) => { asked++; if (ok) { right++; gotRight(q); } else addMiss(q); next.disabled = false; })), next);
    next.disabled = true;
  };
  draw();
  return h("div.col", h("h1", "Review"), pauseLine("first-review"), h("p.small.muted", "Recall first. Nothing here is scored or shared. It works offline too: everything due is on this device."), box);
}

// --- Syllabus map (teaching plan, build step 2) ------------------------------------------------------
// Every topic in the official syllabus, each Not started, Met, Can recall or Can use (map.js). No percentages.

const STATE_DOT = { none: "○", met: "◐", recall: "●", use: "★" };
function mapCounts(day = today()) {
  const m = nodes(), c = { met: 0, recall: 0, use: 0 };
  for (const nd of SY.NODES) { const st = MP.stateOf(m[nd.id], day); if (st !== MP.NONE) c[st]++; }
  return c;
}
function mapLine() {
  const c = mapCounts();
  if (!c.met && !c.recall && !c.use) return "Every topic in the syllabus. Mark one as met when you've studied it.";
  return [c.met && `${c.met} met`, c.recall && `${c.recall} can recall`, c.use && `${c.use} can use`].filter(Boolean).join(" · ");
}

/** The whole syllabus as a creeper garden (vine.js): a vine per paper, a branch per topic, a leaf per syllabus line. */
function syllabusVines(day = today()) {
  const m = nodes(), optional = P.value("optional_subject");
  return VINE.vinesOf(SY.papersFor(optional), SY.nodeId, (id) => MP.stateOf(m[id], day), !!optional);
}
/** How Aspiran teaches: the method in six lines, shown with the garden wherever the garden leads (owner, 4 Nov 2026).
 * The same lines as the website's rooms and Android's PedagogyCard. */
const PITCH = [
  ["Recall, not re-reading", "Close the book and pull it out of your head. That's what makes it stay."],
  ["Review just before you'd forget", "Short reviews, with gaps that grow from a day to a week to months."],
  ["Write, mark, rewrite", "Mains answers on paper, marked, then rewritten. Essays in three snaps: skeleton, outline, essay."],
  ["News tied to the syllabus", "Every Chai card is pinned to the syllabus lines it belongs to."],
  ["Know how sure you are", "Say how sure you were before you see the answer. Only ever against your own past."],
  ["One step at a time", "Today shows the next thing to do, never the whole mountain at once."],
];
function pitchCard({ open = true } = {}) {
  const list = h("ol.pitch", PITCH.map(([t, d]) => h("li", h("strong", t), h("span.small.muted", d))));
  return h("div.card.pitch-card",
    h("h2", { style: { margin: "0 0 4px" } }, "How Aspiran teaches"),
    h("p.small.muted", { style: { margin: "0 0 8px" } }, "The way memory actually works, built into every day."),
    open ? list : h("details", h("summary", "The six ideas"), list));
}

function gardenSection({ height = 430, hero = true, note = true } = {}) {
  const vines = syllabusVines(), c = VINE.countsOf(vines);
  return h("section.garden", { "aria-label": "The whole syllabus, as a creeper garden" },
    hero && h("p.garden-hero", "The whole syllabus. Every line of it."),
    h("div.garden-count", [[c.papers, "papers"], [c.topics, "topics"], [c.lines, "lines to learn"], [c.lit, c.lit === 1 ? "leaf lit" : "leaves lit"]]
      .map(([n, l]) => h("div", h("b", String(n)), h("span", l)))),
    h("div.garden-frame", VINE.garden(vines, { height, onVine: (id) => { location.hash = "#vine/" + id; } })),
    note && h("p.small.muted", c.lit
      ? "Every leaf is a line of UPSC's syllabus. It lights up when you meet its topic, and deepens as you recall it and use it. Tap a vine to open it."
      : "It looks like a lot because it is. Every leaf is a line of UPSC's syllabus, and each one lights up as you meet its topic. Tap a vine to open it."),
    note && VINE.legend());
}

/** One paper's creeper: every topic a branch, every syllabus line a leaf, and the lines written out under each. */
function viewVine(id) {
  const day = today(), vines = syllabusVines(day);
  const k = Math.max(0, vines.findIndex((v) => v.id === id)), v = vines[k];
  const c = VINE.countsOf([v]);
  const back = h("div", { style: { marginBottom: "8px" } }, h("a.btn", { href: "#map" }, "← The whole garden"));
  const nav = h("div.row.between", k > 0 ? h("a.btn", { href: "#vine/" + vines[k - 1].id }, "← " + vines[k - 1].label) : h("span"),
    k < vines.length - 1 ? h("a.btn", { href: "#vine/" + vines[k + 1].id }, vines[k + 1].label + " →") : h("span"));
  if (v.seedling) return h("div.col", back, h("h1", v.name), h("p.muted", v.lead),
    h("div.card", h("p", "Your optional is two papers of its own, with as many lines again as a GS paper."), h("a.btn.primary", { href: "#mains" }, "Tell us your optional")), nav);
  return h("div.col", back,
    h("div.small.muted", v.name),
    h("h1", { style: { margin: "0" } }, v.label === v.name ? v.name : `${v.label}: ${c.lines} lines`),
    v.lead && h("p.muted", v.lead),
    h("p.small", `${c.topics} topics · ${c.lines} lines · ${c.lit} lit`),
    VINE.legend(),
    h("div.creeper", v.branches.map((b, i) => {
      const lis = b.leaves.map((l) => h("li", l.node && b.paper ? h("a", { href: "#map/" + l.node }, l.line) : l.line));
      let svg = null;
      svg = VINE.topicBranch(b, v.id + i, { onLeaf: (j) => {
        lis.forEach((li, x) => li.classList.toggle("on", x === j));
        svg.querySelectorAll(".vine-leaf").forEach((g, x) => g.classList.toggle("on", x === j));
      } });
      const st = b.state;
      return h("div.creeper-topic", svg,
        h("div.creeper-text",
          b.node ? h("a.topic", { href: "#map/" + b.node }, b.label) : h("span.topic", { style: { fontFamily: "var(--head-font)", fontWeight: 800, fontSize: "17px" } }, b.label),
          st && h("span.small", { style: { color: st === MP.NONE ? "var(--muted)" : "var(--brand)" } }, `${STATE_DOT[st]} ${MP.LABEL[st]}`),
          h("ul.creeper-lines", lis)));
    })),
    nav);
}

function viewMap(arg) {
  if (arg && SY.nodeById(arg)) return viewNode(arg);
  const day = today(), m = nodes();
  const papers = SY.papersFor(P.value("optional_subject"));
  const cur = papers.find((p) => p.id === store.get("mapPaper")) ?? papers[0];
  return h("div.col",
    h("h1", { style: { marginBottom: 0 } }, "The whole syllabus"),
    pauseLine("syllabus-first-open"),
    gardenSection({ hero: false }),
    h("h2", "Topic by topic"),
    h("p.small.muted", "Each topic moves from Not started to Met, then Can recall, then Can use. Only you see this."),
    h("div.chips#map-papers", papers.map((p) => h("button.chip", { "aria-pressed": String(p === cur), onclick: () => { store.set("mapPaper", p.id); render(); } }, p.short))),
    h("div.card.soft", h("strong", cur.name), h("div.small.muted", cur.lead)),
    cur.topics.map((name, i) => {
      const id = SY.nodeId(cur, i), st = MP.stateOf(m[id], day);
      return h("a.card.link", { href: "#map/" + id }, h("div.row.between",
        h("span", name), h("span.small", { style: { whiteSpace: "nowrap", color: st === MP.NONE ? "var(--muted)" : "var(--brand)" } }, `${STATE_DOT[st]} ${MP.LABEL[st]}`)));
    }),
    !P.value("optional_subject") && h("p.small.muted", "Your optional's papers show here once you tell us your optional (Practice → Mains answer asks)."));
}

function viewNode(id) {
  const day = today(), nd = SY.nodeById(id), n = nodes()[id], st = MP.stateOf(n, day);
  const back = h("a.btn", { href: "#map" }, "← Your syllabus map");
  const head = [h("div.small.muted", `${nd.paper.name}`), h("h1", nd.name), h("p", h("strong", `${STATE_DOT[st]} ${MP.LABEL[st]}`))];
  if (st === MP.NONE) {
    const memory = h("textarea", { rows: 8, placeholder: "Without looking: the main points, in your own words." });
    return h("div.col", ...head,
      h("div.card", h("h3", { style: { marginTop: 0 } }, "1. Learn it"),
        h("p", "See what UPSC has asked on it, then read your source: NCERT, a standard book, or a piece in Learn."),
        h("div.row", h("a.btn", { href: "#learn" }, "Learn and play"), h("a.btn", { href: "#chotu" }, "Ask Chotu · AI"))),
      h("div.card", h("h3", { style: { marginTop: 0 } }, "2. Close the book and write what you remember"),
        h("p.small.muted", "Then open the book, check, and fix it. This note stays in this browser."), memory,
        h("div", { style: { marginTop: "12px" } }, h("button.primary", { onclick: () => { putNode(id, MP.meet(null, day, memory.value.trim())); render(); } }, "Mark as met"))),
      roomNotesFor(id), back);
  }
  const due = n.f.due <= day;
  const parts = {
    met: [h("p", n.recalledOn ? "It's been a while since your last check, so it's back to Met. The next check that goes well brings it back."
        : "You've met it. A recall check after a week or more moves it to Can recall."),
      h("p", due ? "A check is due today." : `Next check: ${n.f.due}. It comes up in your review.`)],
    recall: [h("p", "You can recall it. To reach Can use, use it: write an answer on it, or try a set of past questions on it."),
      h("div.row", { style: { flexWrap: "wrap" } },
        h("button", { onclick: () => { putNode(id, MP.use(n, day, "answer")); render(); } }, "I wrote an answer on it"),
        h("button", { onclick: () => { putNode(id, MP.use(n, day, "pyq")); render(); } }, "I did past questions on it"),
        h("a.btn", { href: "#mains" }, "Write one now"))],
    use: [h("p", "You can use it. Your review keeps checking it, further apart each time.")],
  }[st];
  return h("div.col", ...head,
    h("div.card", ...parts, due && h("a.btn.primary", { href: "#review" }, "Open the review")),
    n.note && h("details.card", h("summary", "What you wrote when you met it"), h("p", { style: { whiteSpace: "pre-wrap" } }, n.note)),
    roomNotesFor(id),
    h("div.row.between", back, h("button.ghost", { onclick: () => { if (confirm("Set this topic back to Not started? Its checks start again.")) { putNode(id, null); render(); } } }, "Start this topic again")));
}

const MAINS_FALLBACK = [
  ["Federalism", "Discuss the role of the Inter-State Council in strengthening cooperative federalism. (150 words)"],
  ["Governance", "How has the Right to Information Act improved accountability in public administration? (150 words)"],
  ["Economy", "Examine the significance of financial inclusion for inclusive growth in India. (150 words)"],
];
// --- Writing (teaching plan, build step 2) -----------------------------------------------------------
// Write, then mark it yourself, then a second opinion from AI next to your marks, then one rewrite with one fix.
// Your marks and the AI's are kept in this browser (writingLog) so Progress can show how close your own eye is.

const AREAS = [["directive", "Directive word"], ["structure", "Structure"], ["content", "Content coverage"], ["examples", "Examples and data"], ["conclusion", "Conclusion"]];
const BANDS = [["below", "Below"], ["at", "At"], ["above", "Above"]];
const BAND_RANK = { below: 0, at: 1, above: 2 };
const words = (t) => (String(t ?? "").match(/\S+/g) ?? []).length;

function viewMains() {
  const day = today();
  const fromCard = (data.brief?.items ?? []).map(cardText).find((t) => t.mains);
  const [topic, prompt] = fromCard ? ["From today's Chai", fromCard.mains] : MAINS_FALLBACK[Math.floor(Date.now() / 86400000) % MAINS_FALLBACK.length];
  const question = prompt.replace(/\s*\((150|250) (words|शब्द)\)\s*$/, "");
  const key = "mains:" + day;
  const w = store.get("write:" + day, { step: "write", target: /250/.test(prompt) ? 250 : 150, self: {}, fix: "", ai: null, v2: null });
  const save = () => store.set("write:" + day, w);
  const go = (step) => { w.step = step; save(); draw(); window.scrollTo(0, 0); };
  const box = h("div.col");
  const steps = () => h("p.small.muted", ["Write", "Mark it yourself", "Second opinion", "Rewrite"].map((x, i) => (["write", "self", "ai", "rewrite"].indexOf(w.step) === i ? `[${x}]` : x)).join(" → "));
  const draw = () => put(box, w.step !== "done" && steps(), ({ write, self, ai: second, rewrite, done }[w.step] ?? write)());

  function write() {
    const ta = h("textarea", { rows: 14, placeholder: "Intro (2 lines) · Body (3 or 4 points) · Way forward (1 or 2 lines)", value: store.get(key, ""), style: { fontFamily: "var(--read-font)", fontSize: "18px" } });
    const count = h("span.small.muted");
    const upd = () => { const n = words(ta.value); count.textContent = `${n} words${n > w.target * 1.2 ? ` · try to keep near ${w.target}` : ""}`; store.set(key, ta.value); };
    ta.addEventListener("input", upd); upd();
    return [
      h("div.row", [150, 250].map((n) => h("button" + (w.target === n ? ".primary" : ".ghost") + ".small", { onclick: () => { w.target = n; save(); draw(); } }, `${n} words`))),
      h("div.row.between", count, h("button.ghost", { onclick: () => focus.start(w.target === 250 ? 30 : 20, "Mains answer", "focus", "MAINS") }, `Start a ${w.target === 250 ? 30 : 20}-minute focus block`)),
      ta,
      h("p.small.muted", "Paper is best: write by hand, then type it here or mark it straight from the sheet. Saved in this browser as you type."),
      h("div.row", h("button.primary", { onclick: () => go("self") }, "Done writing: mark it yourself →")),
    ];
  }

  function self() {
    const all = AREAS.every(([k]) => w.self[k]);
    const fix = h("input", { type: "text", maxLength: 200, value: w.fix, placeholder: "The one thing I'd change first", oninput: (e) => { w.fix = e.target.value; save(); } });
    return [
      h("p", "Mark it yourself first. For each part: below, at or above a typical scoring answer. Your own eye is the skill that matters on the day."),
      AREAS.map(([k, name]) => h("div.card", h("div.row.between", h("strong", name),
        h("div.row", BANDS.map(([b, label]) => h("button.small" + (w.self[k] === b ? ".primary" : ".ghost"), { "aria-pressed": String(w.self[k] === b), onclick: () => { w.self[k] = b; save(); draw(); } }, label)))))),
      h("label", h("strong", "One fix"), fix),
      h("div.row",
        h("button.primary", { disabled: !all, onclick: () => go("ai") }, "Get a second opinion (AI) →"),
        h("button.ghost", { disabled: !all, onclick: () => go("rewrite") }, "Skip it and rewrite")),
      !all && h("p.small.muted", "Mark all five parts to go on."),
    ];
  }

  function second() {
    const text = store.get(key, "");
    if (!w.ai && words(text) < 20) return [
      h("p", "The second opinion reads a typed answer. Type what you wrote (even roughly), or skip it and go to the rewrite. On the Android app you can send a photo of the sheet."),
      h("div.row", h("button", { onclick: () => go("write") }, "← Type it"), h("button.primary", { onclick: () => go("rewrite") }, "Rewrite without it")),
    ];
    if (!w.ai) {
      const note = h("p.muted", "Reading your answer…");
      post("/answers/evaluate", { memberId: profile().memberId, question, words: w.target, text }).then((r) => {
        if (r?.care) { pod.care = true; put(note, careBox()); return; }
        if (!r || r.error) { put(note, h("p", r?.error ?? "Couldn't reach the reviewer. Check your connection."), h("button", { onclick: () => go("rewrite") }, "Go to the rewrite")); return; }
        w.ai = { areas: r.areas ?? {}, summary: r.summary ?? "", wordCount: r.wordCount ?? 0, skeleton: r.skeleton ?? null, left: r.left ?? null };
        save(); draw();
      });
      return [note];
    }
    const agree = AREAS.filter(([k]) => w.ai.areas[k]?.band === w.self[k]).length;
    return [
      h("p", w.ai.summary),
      h("p.small.muted", [w.ai.wordCount ? `${w.ai.wordCount} words of ${w.target}` : null, w.ai.left != null ? `${w.ai.left} free review${w.ai.left === 1 ? "" : "s"} left this week` : null].filter(Boolean).join(" · ")),
      h("div.tbl", h("table", h("thead", h("tr", h("th", "Part"), h("th", "You"), h("th", "Second opinion"))),
        h("tbody", AREAS.map(([k, name]) => { const a = w.ai.areas[k] ?? {}; return [
          h("tr", h("td", h("strong", name)), h("td", BANDS.find(([b]) => b === w.self[k])?.[1] ?? "–"), h("td", BANDS.find(([b]) => b === a.band)?.[1] ?? "–")),
          (a.note || a.fix) && h("tr", h("td", { colSpan: 3 }, h("span.small", a.note ?? ""), a.fix && h("div.small", h("strong", "One fix: "), a.fix))),
        ]; })))),
      h("p", agree === 5 ? "You and the second opinion agree on all five parts." : `You and the second opinion agree on ${agree} of 5. Where you differ, look again: neither is always right.`),
      w.ai.skeleton?.body?.length > 0 && h("details.card", h("summary", "A model answer's skeleton"),
        w.ai.skeleton.intro && h("p", h("strong", "Intro: "), w.ai.skeleton.intro), h("ul", w.ai.skeleton.body.map((b) => h("li", b))), w.ai.skeleton.conclusion && h("p", h("strong", "Conclusion: "), w.ai.skeleton.conclusion)),
      h("p.small.muted", "A second opinion by AI, next to your own marks. It can be wrong; your pod and your own judgement come first."),
      h("div.row", h("button.primary", { onclick: () => go("rewrite") }, "Rewrite it with one fix →")),
    ];
  }

  function rewrite() {
    // Your own fix first; otherwise the AI's fix for the part it rated lowest.
    const low = w.ai ? AREAS.map(([k]) => [k, w.ai.areas[k]]).filter(([, a]) => a?.fix).sort((a, b) => BAND_RANK[a[1].band] - BAND_RANK[b[1].band])[0] : null;
    const fix = w.fix || low?.[1].fix || "Make the conclusion answer the question's directive word.";
    const ta = h("textarea", { rows: 14, value: w.v2 ?? store.get(key, ""), style: { fontFamily: "var(--read-font)", fontSize: "18px" }, oninput: (e) => { w.v2 = e.target.value; save(); } });
    return [
      h("div.card.soft", h("strong", "Your one fix: "), fix),
      h("p", "Rewrite the answer with just that change. One fix, done well, sticks better than five half-done."),
      ta,
      h("div.row",
        h("button.primary", { onclick: () => {
          if (!w.v2) w.v2 = ta.value;
          const log = store.get("writingLog", []);
          log.push({ day, prompt: question, words: w.target, self: w.self, ai: w.ai ? Object.fromEntries(AREAS.map(([k]) => [k, w.ai.areas[k]?.band ?? null])) : null, rewritten: true });
          store.set("writingLog", log.slice(-200));
          markDone("MAINS"); go("done");
        } }, "Save the rewrite"),
        h("button.ghost", { onclick: () => go(w.ai ? "ai" : "self") }, "← Back")),
    ];
  }

  function done() {
    return [
      h("div.card.soft", h("strong", "Done for today: written, marked and rewritten."), h("p.small", { style: { margin: "4px 0 0" } }, `First version ${words(store.get(key, ""))} words, rewrite ${words(w.v2)} words. Both stay in this browser.`)),
      h("div.row", h("a.btn.primary", { href: "#today" }, "Back to Today"), h("a.btn", { href: "#essay" }, "Essays in three snaps"),
        h("button.ghost", { onclick: () => { if (confirm("Start today's answer again? This clears your marks and the rewrite.")) { store.del("write:" + day); render(); } } }, "Start again")),
    ];
  }

  draw();
  return h("div.col", h("h1", "Mains answer"), pauseLine("first-mains"), h("p.small.muted", topic), profileAsk("mains"),
    h("div.card.soft", h("strong", prompt)),
    box);
}

// --- Essays in three snaps: skeleton, outline, essay. Each snap is yours first, then you compare with the guide.

const SNAPS = [
  { n: 1, name: "Skeleton", field: "snap1Skeleton", ask: "Your stand in one line, and three or four angles you'd cover. About 10 minutes.", min: 15 },
  { n: 2, name: "Outline", field: "snap2Outline", ask: "Intro idea, one line per paragraph, and the conclusion. About 25 minutes.", min: 40 },
  { n: 3, name: "Essay", field: "snap3Watch", ask: "The full essay, 1,000 to 1,200 words. Paper is best; type it here or just tick when the sheet is done.", min: 0 },
];

function viewEssay(arg) {
  const essays = libraryOf("essay");
  if (!arg) return h("div.col", h("h1", "Essays in three snaps"), pauseLine("essay-first-snap"),
    h("p", "Each essay goes in three sittings: a skeleton, then an outline, then the essay. You write each snap first, then compare it with the guide. Do them on different days if you like."),
    essays.length === 0 && h("p.muted", "Essay topics appear here once an English and a Hindi editor approve them."),
    essays.map((e) => { const st = store.get("essay:" + e.id, {}); const doneN = SNAPS.filter((x) => st["s" + x.n + "done"]).length;
      return h("a.card.link", { href: "#essay/" + e.id }, h("div.row.between", h("div", h("strong", bi(e.data.topic)), h("div.small.muted", doneN ? `${doneN} of 3 snaps done` : e.data.kind === "abstract" ? "Abstract" : "Topical")), h("span", "→"))); }));
  const e = essays.find((x) => x.id === arg);
  if (!e) return h("div.col", h("p", "That essay isn't available."), h("a", { href: "#essay" }, "← Essays"));
  const d = e.data, k = "essay:" + e.id, st = store.get(k, {});
  const save = () => store.set(k, st);
  const box = h("div.col");
  const draw = () => put(box, SNAPS.map((x) => {
    const open = x.n === 1 || st["s" + (x.n - 1) + "done"];
    if (!open) return h("div.card", h("strong", `Snap ${x.n}: ${x.name}`), h("p.small.muted", "Opens after the snap before it."));
    const ta = h("textarea", { rows: x.n === 3 ? 16 : 6, value: st["s" + x.n] ?? "", style: { fontFamily: "var(--read-font)", fontSize: "17px" }, oninput: (ev) => { st["s" + x.n] = ev.target.value; save(); cnt.textContent = words(ev.target.value) + " words"; } });
    const cnt = h("span.small.muted", words(st["s" + x.n]) + " words");
    const guide = bi(d[x.field]);
    return h("div.card", h("div.row.between", h("strong", `Snap ${x.n}: ${x.name}`), st["s" + x.n + "done"] && h("span.small.muted", "Done")),
      h("p.small", x.ask), ta, cnt,
      !st["s" + x.n + "done"]
        ? h("div.row", h("button.primary", { disabled: false, onclick: () => {
            if (words(st["s" + x.n]) < x.min && !confirm(x.n === 3 ? "Mark the essay as written on paper?" : "That's short. Compare with the guide anyway?")) return;
            st["s" + x.n + "done"] = today(); save(); draw();
          } }, x.n === 3 ? "I've written it: show the watch-outs" : "Done: compare with the guide"))
        : [h("div.card.soft", h("strong", x.n === 3 ? "Watch-outs: check your essay against these" : "The guide's " + x.name.toLowerCase()), h("p", { style: { whiteSpace: "pre-wrap" } }, guide)),
          x.n === 1 && d.angles?.length > 0 && h("details", h("summary", "More angles"), h("ul", d.angles.map((a) => h("li", bi(a))))),
          x.n === 2 && d.openers?.length > 0 && h("details", h("summary", "Ways to open"), h("ul", d.openers.map((a) => h("li", bi(a))))),
          h("p.small.muted", "What did you have that the guide didn't, and what did it have that you missed? The second one is your next fix.")]);
  }));
  draw();
  return h("div.col", h("a", { href: "#essay" }, "← Essays"), h("h1", bi(d.topic)), box);
}

// --- Case files: Keep for Mains (teaching plan, Chai v2) ------------------------------------------------------
// You pick what goes in: a Chai card becomes one example line under a paper and, if you like, a syllabus topic. The
// app suggests the paper and the line once; you change them. The case file shows which topics have no example yet.

const CASE_PAPERS = ["GS1", "GS2", "GS3", "GS4", "Essay"];
const caseFile = () => store.get("caseFile", []);
function keepButton(it, t) {
  const kept = caseFile().find((x) => x.cardId === it.id);
  if (kept) return h("a.btn.ghost", { href: "#casefile/" + kept.paper }, "✓ In your case file");
  return h("button.ghost", { onclick: (e) => {
    const paper = h("select", CASE_PAPERS.map((p) => h("option", { value: p, selected: p === it.gsPaper }, p)));
    const nodesOf = () => SY.NODES.filter((nd) => nd.paper.short === paper.value || (paper.value === "Essay" && nd.paper.id === "essay"));
    const topic = h("select");
    const fillTopics = () => put(topic, h("option", { value: "" }, "Any topic"), nodesOf().map((nd) => h("option", { value: nd.id }, nd.name)));
    paper.addEventListener("change", fillTopics); fillTopics();
    const line = h("textarea", { rows: 3, value: t.facts?.[0] ? `${t.headline}: ${t.facts[0]}` : t.headline });
    const form = h("div.card.soft", h("strong", "Keep for Mains"), h("p.small.muted", "One example line, in your words. You can change what's suggested."),
      h("label.small", "Paper "), paper, h("label.small", " Topic "), topic, line,
      h("div.row", h("button.primary", { onclick: () => {
        store.set("caseFile", [...caseFile(), { id: Date.now().toString(36), cardId: it.id, paper: paper.value, node: topic.value || null, example: line.value.trim().slice(0, 600), from: t.headline, day: today() }].slice(-2000));
        render();
      } }, "Keep it"), h("button", { onclick: () => form.remove() }, "Cancel")));
    e.target.closest("article").append(form);
  } }, "Keep for Mains");
}
function viewCaseFile(arg) {
  const all = caseFile(), paper = CASE_PAPERS.includes(arg) ? arg : "GS2";
  const mine = all.filter((x) => x.paper === paper);
  const nodes = SY.NODES.filter((nd) => nd.paper.short === paper || (paper === "Essay" && nd.paper.id === "essay"));
  const gaps = nodes.filter((nd) => !mine.some((x) => x.node === nd.id));
  const row = (x) => h("div.task", h("div.grow", h("div", x.example), h("div.small.muted", `${x.day} · from “${x.from}”`)),
    h("button.ghost.small", { onclick: () => { if (confirm("Remove this example?")) { store.set("caseFile", caseFile().filter((y) => y.id !== x.id)); render(); } } }, "Remove"));
  return h("div.col", h("a", { href: "#practice" }, "← Practice"), h("h1", "Your case file"), pauseLine("keep-for-mains"),
    h("p.muted", "Examples you kept from Chai, by paper and topic, for your Mains answers. Only you see this."),
    h("div.chips", CASE_PAPERS.map((p) => h("a.chip", { href: "#casefile/" + p, "aria-pressed": String(p === paper) }, `${p} (${all.filter((x) => x.paper === p).length})`))),
    mine.length === 0 && h("p", "Nothing kept for this paper yet. On a Chai card, tap Keep for Mains."),
    nodes.map((nd) => { const ex = mine.filter((x) => x.node === nd.id); return ex.length > 0 && h("div.card", h("strong", nd.name), ex.map(row)); }),
    mine.some((x) => !x.node) && h("div.card", h("strong", "Not pinned to a topic"), mine.filter((x) => !x.node).map(row)),
    mine.length > 0 && gaps.length > 0 && h("details.card", h("summary", `Topics with no example yet (${gaps.length})`), h("ul", gaps.map((nd) => h("li", nd.name)))));
}

// --- Progress: you vs. you (teaching plan, step 8) -------------------------------------------------------------
// Only against your own past: never a rank, a cut-off or other people. Short labels, then and now.

const BAND_N = { below: 1, at: 2, above: 3 };
const avg = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const one = (x) => (Math.round(x * 10) / 10).toString();
function viewProgress() {
  const wl = store.get("writingLog", []).filter((w) => w.ai && Object.keys(w.ai).length);
  const day = today(), m = nodes();
  const counts = mapCounts(day);
  const hist = store.get("mockHistory", []);
  // Writing: the AI's band per part, your first five answers against your last five; and how often your own marks agreed.
  let writing;
  if (wl.length >= 6) {
    const first = wl.slice(0, 5), last = wl.slice(-5);
    const agree = (ws) => avg(ws.map((w) => AREAS.filter(([k]) => w.self?.[k] && w.self[k] === w.ai[k]).length));
    writing = [h("p", `Your own marks agreed with the second opinion on ${one(agree(first))} of 5 parts in your first five answers, and ${one(agree(last))} in your last five. That gap closing is the real progress.`),
      h("div.tbl", h("table", h("thead", h("tr", h("th", "Part"), h("th", "First five"), h("th", "Last five"))),
        h("tbody", AREAS.map(([k, name]) => { const a = avg(first.map((w) => BAND_N[w.ai[k]]).filter(Boolean)), b = avg(last.map((w) => BAND_N[w.ai[k]]).filter(Boolean));
          return h("tr", h("td", name), h("td", a == null ? "–" : one(a)), h("td", h("strong", b == null ? "–" : one(b)))); })))),
      h("p.small.muted", "1 is below a typical scoring answer, 2 at it, 3 above it.")];
  } else writing = [h("p.small.muted", `After six answers with a second opinion (${wl.length} so far), this compares your first five with your last five.`)];
  // Calibration: how often "sure" answers were right, against the ones you marked as a guess.
  const sure = hist.reduce((a, r) => [a[0] + (r.right - (r.unsureRight ?? 0)), a[1] + (r.attempted - (r.unsureTotal ?? 0))], [0, 0]);
  const guess = hist.reduce((a, r) => [a[0] + (r.unsureRight ?? 0), a[1] + (r.unsureTotal ?? 0)], [0, 0]);
  const calib = sure[1] >= 20 && guess[1] >= 10
    ? h("p", `When you were sure: ${Math.round(100 * sure[0] / sure[1])}% right. When you marked a guess: ${Math.round(100 * guess[0] / guess[1])}%. ${guess[0] / guess[1] > 0.45 ? "Your guesses do better than you think; trust them a little more." : guess[0] / guess[1] < 0.3 ? "Guesses cost you marks; skip more of them." : "Your sense of what you know is about right."}`)
    : h("p.small.muted", "Mark answers “Not sure” in mocks. After a few papers this shows how far your sense of sure matches your marks.");
  // Markers: the date you first reached each one. Not targets, not cut-offs.
  const vals = Object.values(m), metDays = vals.map((n) => n.met).filter(Boolean).sort();
  const recallDays = vals.map((n) => n.recalledOn).filter(Boolean).sort(), useDays = vals.map((n) => n.usedOn).filter(Boolean).sort();
  const rewrites = store.get("writingLog", []).filter((w) => w.rewritten).map((w) => w.day).sort();
  const essaysDone = Object.keys(localStorage).filter((k) => k.startsWith("upsc:essay:")).map((k) => store.get(k.slice(5), {}).s3done).filter(Boolean).sort();
  const boards = store.get("interviewLog", []).map((r) => r.day).sort();
  const markers = [["Your first topic Met", metDays[0]], ["Ten topics Met", metDays[9]], ["Your first topic you Can recall", recallDays[0]], ["Your first topic you Can use", useDays[0]],
    ["Your first answer rewritten", rewrites[0]], ["Ten answers rewritten", rewrites[9]], ["Your first full mock", hist[0]?.day], ["Your first essay in three snaps", essaysDone[0]],
    ["Your first mock interview", boards[0]], ["Ten examples in your case file", caseFile().map((x) => x.day).sort()[9]]];
  const ty = P.value("target_year");
  const weeks = /^\d{4}$/.test(ty ?? "") ? Math.round((Date.parse(`${ty}-05-25`) - Date.now()) / (7 * 86400_000)) : null;
  return h("div.col", h("h1", "You vs. you"), pauseLine("you-vs-you"),
    h("p.muted", "Only against your own past. No ranks, no cut-offs, nobody else's numbers."),
    weeks != null && weeks > 0 && h("p", `Prelims ${ty} is about ${weeks} weeks away (UPSC usually holds it in late May; check the official calendar).`),
    h("div.card", h("h2", { style: { marginTop: 0 } }, "Your syllabus map"), h("p", `${counts.met} Met · ${counts.recall} Can recall · ${counts.use} Can use, out of ${SY.NODES.length} topics.`)),
    h("div.card", h("h2", { style: { marginTop: 0 } }, "Writing"), writing),
    h("div.card", h("h2", { style: { marginTop: 0 } }, "Sure and not sure"), calib),
    h("div.card", h("h2", { style: { marginTop: 0 } }, "Markers"), h("p.small.muted", "The day you first reached each one."),
      markers.map(([label, d]) => h("div.task", h("span.grow", label), h("span.small", { style: { color: d ? "var(--brand)" : "var(--muted)" } }, d ? "✓ " + d : "Not yet")))));
}

// --- Mock interview -------------------------------------------------------------------------------
// Teaching plan, interview: a board of five personas, questions from the approved bank filled with the member's own
// DAF details (kept on this device). An AI board member can ask one follow-up per answer (/interview/follow); at
// night or in a result week the board uses the bank only. No timer, no score: the last step is your own note.

const DAF = [["district", "Home district"], ["state", "Home state"], ["graduation_subject", "Graduation subject"], ["previous_job", "Work before this (leave empty if none)"],
  ["hobby", "A hobby you listed"], ["optional", "Optional subject"], ["service_preference", "First service preference"]];
const IV_ORDER = ["sceptic", "hobby-prober", "ca-hawk", "quiet-one", "chair"];
const ivFill = (t, daf) => t.replace(/\{(\w+)\}/g, (_, k) => daf[k] ?? "");
const ivUsable = (q, daf) => (q.q?.en ?? "").match(/\{\w+\}/g)?.every((t) => daf[t.slice(1, -1)]?.trim()) ?? true;

function ivPlan(qs, daf, seed) {
  const sh = shuffle(qs.filter((q) => ivUsable(q, daf)), seed);
  const out = [], seen = new Set();
  const opener = sh.find((q) => q.depth === "opener" && q.persona === "chair") ?? sh.find((q) => q.depth === "opener");
  if (opener) out.push(opener);
  for (let i = 0; out.length < 10 && i < 50; i++) {
    const p = IV_ORDER[i % IV_ORDER.length];
    const q = sh.find((x) => x.persona === p && x.depth !== "opener" && !out.includes(x) && !seen.has(p + x.group));
    if (q) { out.push(q); seen.add(p + q.group); }
  }
  return out.map((q) => q.id);
}

// --- Off-screen study (teaching plan §6): walk mode, the weekly print set, and the review that works offline ----

/**
 * Walk mode: the device voice reads a Chai card or names a due topic, then waits while you say three points aloud.
 * Starts only on a tap and moves on only on a tap. Nothing is recorded or sent.
 */
function walkSteps() {
  const topics = reviewItems().filter((x) => x.node).slice(0, 5).map(({ node }) => {
    const nd = SY.nodeById(node);
    return { title: nd.name, kind: "Topic", say: hindi() ? `विषय: ${nd.name}। इसके बारे में जो तीन बातें याद हैं, बोलकर कहिए।` : `Topic: ${nd.name}. Say three things you remember about it.`, node };
  });
  const cards = (data.brief?.items ?? []).filter((it) => it.tone !== "tragic").slice(0, 5).map((it) => {
    const t = cardText(it);
    return { title: t.headline, kind: "Chai", say: [t.headline, t.summary].filter(Boolean).join(". "), lang: t.lang };
  });
  return [...topics, ...cards].slice(0, 8);
}
function viewWalk(arg) {
  if (arg) return BR.viewWalkScript(arg);
  const steps = walkSteps();
  const can = "speechSynthesis" in window;
  if (!steps.length) return h("div.col", h("a", { href: "#practice" }, "← Practice"), h("h1", "Walk mode"), h("p", "Nothing of yours to walk through yet: no topics due and no Chai cards today."), BR.walkScripts());
  let i = 0, phase = "ready";
  const box = h("div");
  const speak = (text, lng) => new Promise((res) => {
    if (!can) return res();
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = (lng ?? lang()) === "hi" ? "hi-IN" : "en-IN";
    u.onend = u.onerror = res;
    speechSynthesis.speak(u);
    // Some browsers never fire onend (no voice installed): move on after roughly the time it takes to say it.
    setTimeout(res, 3000 + text.split(/\s+/).length * 450);
  });
  cleanup.push(() => can && speechSynthesis.cancel());
  const play = async () => {
    const s = steps[i];
    phase = "speaking"; draw();
    await speak(s.kind === "Chai" ? `${s.say}. ${hindi() ? "अब इसकी तीन बातें बोलकर कहिए।" : "Now say three points from that, aloud."}` : s.say, s.lang);
    if (phase === "speaking") { phase = "say"; draw(); }
  };
  const draw = () => {
    if (i >= steps.length) return put(box, h("div.card", h("h2", "That's the walk."), h("p", "Saying it aloud is recall. The topics still come back in your review when they're due."), h("a.btn.primary", { href: "#today" }, "Back to Today")));
    const s = steps[i];
    put(box, h("div.small.muted", `${i + 1} of ${steps.length} · ${s.kind}`),
      h("div.card", h("h2", { style: { marginTop: 0 } }, s.title),
        phase === "ready" && h("button.primary", { onclick: play }, can ? "▶ Play" : "Show"),
        phase === "speaking" && h("p.muted", "Reading aloud…"),
        (phase === "say" || !can && phase !== "ready") && h("p", h("strong", "Your turn. "), "Say three points aloud. No need to be right; it's the trying that helps."),
        s.kind === "Chai" && !can && h("p", s.say),
        phase !== "ready" && h("div.row", h("button.ghost", { onclick: play }, "Again"), h("button.primary", { onclick: () => { if (can) speechSynthesis.cancel(); i++; phase = "ready"; draw(); if (i < steps.length) play(); } }, "Next"))));
  };
  draw();
  return h("div.col", h("a", { href: "#practice" }, "← Practice"), h("h1", "Walk mode"), pauseLine("walk-mode"),
    h("p.muted", "Put in earphones and walk. The device voice reads a card or names a topic, then waits while you say three points out loud. It starts when you tap Play, and moves on only when you tap Next. Nothing is recorded."),
    !can && h("p.small", "This browser has no voice, so the text is shown instead."), box, BR.walkScripts());
}

/** The weekly print set: a recall card, a mixed CSAT set, and your own one-pagers. Opens a print-ready page. */
const escHtml = (v) => String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
function printSet(parts) {
  const week = today();
  const recall = Object.entries(nodes()).filter(([id, n]) => SY.nodeById(id) && n.f?.due && n.f.due <= addDays(week, 7)).sort((a, b) => a[1].f.due.localeCompare(b[1].f.due)).slice(0, 10).map(([id]) => SY.nodeById(id).name);
  const misses = dueReviews(addDays(week, 7)).slice(0, 10 - recall.length).map((q) => (q.en ? mcqOf(q) : q)?.question ?? "").filter(Boolean);
  const csat = libraryOf("mock").map(paperFrom).filter((p) => /csat/i.test(p.paper ?? p.title)).flatMap((p) => p.questions.map(mcqOf)).filter((q) => q?.options?.length);
  const pickN = (arr, n) => arr.map((x) => [Math.random(), x]).sort((a, b) => a[0] - b[0]).slice(0, n).map((x) => x[1]);
  const set = pickN(csat, 10);
  const pagers = Object.entries(nodes()).filter(([id, n]) => SY.nodeById(id) && n.note).map(([id, n]) => ({ name: SY.nodeById(id).name, paper: SY.nodeById(id).paper.short, note: n.note }));
  const foot = `<footer>Aspiran · aspiran.in · free to print and share · ${escHtml(week)}</footer>`;
  const pages = [];
  if (parts.recall) pages.push(`<section><h1>10 things to recall this week</h1><p class="m">Cover the page below each line and say or write what you remember. Then check in your notes.</p><ol>${[...recall, ...misses].map((x) => `<li>${escHtml(x)}<div class="blank"></div></li>`).join("") || "<li>Nothing due yet. Mark topics as met on your syllabus map and they appear here.</li>"}</ol>${foot}</section>`);
  if (parts.csat && set.length) {
    pages.push(`<section><h1>CSAT set, mixed</h1><p class="m">Mixed types on purpose: it feels harder, and that's part of why it works. Answers are on the last page.</p><ol>${set.map((q) => `<li><p>${escHtml(q.question)}</p><ol type="a">${q.options.map((o) => `<li>${escHtml(o)}</li>`).join("")}</ol></li>`).join("")}</ol>${foot}</section>`);
    pages.push(`<section><h1>Answers</h1><ol>${set.map((q) => `<li><b>${"abcd"[q.answerIndex] ?? ""}</b> ${escHtml(q.explanation ?? "")}</li>`).join("")}</ol>${foot}</section>`);
  }
  if (parts.pagers) pages.push(...(pagers.length ? pagers : [{ name: "Your one-pagers", paper: "", note: "When you meet a topic on your syllabus map and write your note, it can be printed here as your own booklet." }])
    .map((p) => `<section><h1>${escHtml(p.name)}</h1><p class="m">${escHtml(p.paper)} · your own words</p><div class="note">${escHtml(p.note)}</div>${foot}</section>`));
  const w = window.open("", "_blank");
  if (!w) return alert("Your browser blocked the print page. Allow pop-ups for this site and try again.");
  w.document.write(`<!doctype html><html lang="${lang()}"><head><meta charset="utf-8"><title>Aspiran print set ${escHtml(week)}</title><style>
    body{font:12pt/1.5 Georgia,"Noto Serif","Noto Serif Devanagari",serif;color:#000;margin:0 auto;max-width:720px;padding:16px}
    h1{font-size:18pt;margin:0 0 4px}.m{color:#444;font-style:italic}section{page-break-after:always;position:relative;min-height:90vh}
    .blank{border-bottom:1px dotted #999;height:28px}.note{white-space:pre-wrap}li{margin:6px 0}
    footer{position:absolute;bottom:0;font:9pt system-ui,sans-serif;color:#555}@media screen{section{border-bottom:1px solid #ccc;margin-bottom:24px;min-height:0}footer{position:static;margin-top:16px}}
  </style></head><body>${pages.join("")}<script>setTimeout(()=>print(),300)<\/script></body></html>`);
  w.document.close();
}
function viewPrint() {
  const csat = libraryOf("mock").some((i) => /csat/i.test(i.data.paper ?? bi(i.data.title)));
  const parts = { recall: true, csat, pagers: false };
  const box = (k, label, note, off) => h("label.card.row", { style: { alignItems: "flex-start", gap: "10px" } },
    h("input", { type: "checkbox", checked: parts[k], disabled: off, onchange: (e) => { parts[k] = e.target.checked; } }), h("div", h("strong", label), h("div.small.muted", note)));
  return h("div.col", h("a", { href: "#practice" }, "← Practice"), h("h1", "Print this week's set"), pauseLine("print-set"),
    h("p.muted", "Some of the best revision happens on paper, on a bus. Pick what goes in, then print or save it as a PDF. A small Aspiran line sits in the footer, so it's fine to share."),
    box("recall", "10 things to recall", "Topics coming back this week and questions you missed, one line each, with room to write."),
    box("csat", "CSAT set, mixed", csat ? "Ten questions of mixed types, with the answers on a separate last page." : "Opens once checked CSAT questions are in the library.", !csat),
    box("pagers", "Your one-pagers", "The notes you wrote when you met each topic, one per page: your own booklet for the last weeks."),
    h("button.primary", { onclick: () => printSet(parts) }, "Open the print page"));
}

// --- Optional subjects (content kind "optional-node") and term lists ("terms") -------------------------------

const OPTIONAL_NAMES = { geography: "Geography", sociology: "Sociology", anthropology: "Anthropology", psir: "Political Science and IR", history: "History", "public-administration": "Public Administration" };
const optName = (k) => OPTIONAL_NAMES[k] ?? k.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());
function viewOptional(arg) {
  const all = libraryOf("optional-node").map((i) => i.data).filter((d) => d.optional);
  const [subject, nodeId] = String(arg ?? "").split("/");
  const subjects = [...new Set(all.map((d) => d.optional))].sort();
  const back = (href, label) => h("a", { href }, "← " + label);
  if (!subject) return h("div.col", back("#practice", "Practice"), h("h1", "Optional subject"),
    h("p.muted", "Topic by topic: why it matters, a note to read, questions to write, and things to recall. The same order as the GS topics."),
    subjects.length ? subjects.map((k) => h("a.card.link", { href: "#optional/" + k }, h("div.row.between", h("div", h("strong", optName(k)), h("div.small.muted", `${all.filter((d) => d.optional === k).length} topics so far`)), h("span", "→"))))
      : h("p", "Optional topics appear here once an editor approves them."));
  const mine = all.filter((d) => d.optional === subject).sort((a, b) => (a.paper - b.paper) || a.id.localeCompare(b.id));
  const titleOf = (d) => bi(d.title) || bi(d.onePagerPrompts)?.[0]?.replace(/\.$/, "") || d.id;
  if (!nodeId) return h("div.col", back("#optional", "Optional subject"), h("h1", optName(subject)),
    BR.optionalOrder(subject, new Set(mine.map((d) => d.id))),
    [1, 2].map((p) => mine.some((d) => d.paper === p) && h("div", h("h2", `Paper ${p}`),
      mine.filter((d) => d.paper === p).map((d) => h("a.card.link", { href: `#optional/${subject}/${d.id}` }, h("div.row.between", h("div", h("strong", titleOf(d)), h("div.small.muted", `${d.practiceQuestions?.length ?? 0} questions · ${d.recall?.length ?? 0} to recall`)), h("span", "→")))))));
  const d = mine.find((x) => x.id === nodeId);
  if (!d) return h("div.col", back("#optional/" + subject, optName(subject)), h("p", "That topic isn't here."));
  const note = bi(d.note);
  return h("div.col", back("#optional/" + subject, optName(subject)), h("h1", titleOf(d)), h("p.small.muted", `${optName(subject)} · Paper ${d.paper}`),
    pauseLine("pyq-first"),
    d.practiceQuestions?.length && h("div.card", h("h2", { style: { marginTop: 0 } }, "What they ask"),
      d.practiceQuestions.map((q) => h("p", bi(q.q), h("span.small.muted", ` · ${q.marks} marks, ${q.words} words${q.isPYQ ? " · past paper" : ""}`))),
      h("p.small.muted", "Write one on paper, then mark it yourself in Mains answer.")),
    d.why && h("div.card.soft", h("strong", "Why it matters"), h("p", bi(d.why))),
    note && h("div.card", h("div.row.between", h("h2", { style: { marginTop: 0 } }, "The note"), readAloud(note, lang())), h("div", { style: { whiteSpace: "pre-wrap", fontFamily: "var(--read-font)" } }, note)),
    d.diagram && h("div.card.soft", h("strong", "Draw this"), h("p", bi(d.diagram))),
    d.thinkers?.length && h("div.card", h("strong", "Thinkers"), d.thinkers.map((t) => h("p", h("strong", t.name + ": "), bi(t.idea)))),
    d.examples?.length && h("div.card", h("strong", "Examples to use"), d.examples.map((x) => h("p", bi(x), x.source && h("span.small.muted", ` (${x.source})`)))),
    d.recall?.length && h("div.card", h("strong", "Recall: say it, then check"), d.recall.map((r) => h("details", h("summary", bi(r.q)), h("p", bi(r.a))))),
    bi(d.onePagerPrompts)?.length && h("div.card.soft", pauseLine("one-pager-memory"), h("strong", "Your one-pager, from memory"), h("ol", bi(d.onePagerPrompts).map((x) => h("li", x)))));
}

function viewTerms(arg) {
  const lists = libraryOf("terms").map((i) => i.data).filter((d) => d.terms?.length);
  const subject = arg && lists.some((d) => d.subject === arg) ? arg : "";
  const q = h("input", { type: "search", placeholder: "Search in English or Hindi", value: viewTerms.q ?? "" });
  const box = h("div");
  const draw = () => {
    const needle = q.value.trim().toLowerCase(); viewTerms.q = q.value;
    const rows = lists.filter((d) => !subject || d.subject === subject).flatMap((d) => d.terms.map((t) => ({ ...t, subject: d.subject })))
      .filter((t) => !needle || [t.en, t.hi, t.hiAlt, t.meaning?.en, t.meaning?.hi].some((x) => x && x.toLowerCase().includes(needle)));
    put(box, rows.length ? rows.slice(0, 300).map((t) => h("div.card", h("div.row.between", h("strong", t.en), h("strong", { lang: "hi" }, t.hi + (t.hiAlt ? ` / ${t.hiAlt}` : ""))), t.meaning && h("p.small", bi(t.meaning))))
      : h("p.muted", lists.length ? "No term matches." : "Term lists appear here once an editor approves them."));
  };
  q.addEventListener("input", draw); draw();
  return h("div.col", h("a", { href: "#practice" }, "← Practice"), h("h1", "English–Hindi terms"), pauseLine("hindi-medium"),
    h("p.muted", "The words examiners expect, in both languages, with a one-line meaning. Useful whichever medium you write in."),
    lists.length > 1 && h("div.row", h("a.btn" + (subject ? "" : ".primary"), { href: "#terms" }, "All"), lists.map((d) => h("a.btn" + (subject === d.subject ? ".primary" : ""), { href: "#terms/" + d.subject }, d.subject.replace(/-/g, " ")))),
    q, box);
}

function viewInterview(arg) {
  const qs = libraryOf("interview-bank").flatMap((i) => i.data.questions ?? []);
  const personas = libraryOf("interview-personas")[0]?.data.personas ?? [];
  const who = (k) => personas.find((p) => p.key === k) ?? { name: { en: "Board member", hi: "बोर्ड सदस्य" }, style: { en: "", hi: "" } };
  const daf = store.get("interview:daf", {});
  const log = store.get("interviewLog", []);
  if (!qs.length) return h("div.col", h("a", { href: "#practice" }, "← Practice"), h("h1", "Mock interview"), h("p", "The board's questions appear here once an English and a Hindi editor approve them."));

  if (arg === "daf" || !Object.values(daf).some((v) => v?.trim())) {
    const fields = DAF.map(([k, label]) => h("div.col", { style: { gap: "4px" } }, h("label.small", { for: "daf-" + k }, label), h("input", { id: "daf-" + k, style: { maxWidth: "420px" }, value: daf[k] ?? "", oninput: (e) => { daf[k] = e.target.value; store.set("interview:daf", daf); } })));
    return h("div.col", h("a", { href: "#practice" }, "← Practice"), h("h1", "Your DAF, in short"),
      h("p", "The board asks from your Detailed Application Form. Fill what you can; questions that need an empty field are skipped. This stays on this device."),
      fields, h("button.primary", { onclick: () => { store.set("interview:daf", daf); location.hash = "#interview/start"; } }, "Save and meet the board"));
  }

  let st = store.get("interview:now");
  if (arg === "start" || !st) {
    if (arg !== "start") return h("div.col", h("a", { href: "#practice" }, "← Practice"), h("h1", "Mock interview"),
      h("p", "A board of five. The Chair opens, then each member asks in their own way. Answer aloud as you would in the room, or type. No clock and no score: at the end you write one note to yourself."),
      personas.length > 0 && h("div.card.soft", personas.map((p) => h("p.small", h("strong", bi(p.name)), " · ", bi(p.style)))),
      h("div.row", h("a.btn.primary", { href: "#interview/start" }, "Start a board"), h("a.btn", { href: "#interview/daf" }, "Edit your DAF")),
      log.length > 0 && h("div", h("h2", "Your notes"), log.slice().reverse().slice(0, 8).map((r) => h("div.card", h("div.small.muted", `${r.day} · ${r.asked} questions`), r.note && h("p", r.note)))));
    st = { ids: ivPlan(qs, daf, Date.now() % 100000), i: 0, answers: {}, day: today() };
    if (!st.ids.length) return h("div.col", h("p", "Fill a few more DAF details so the board has questions to ask."), h("a", { href: "#interview/daf" }, "Edit your DAF"));
    store.set("interview:now", st);
    if (arg === "start") { history.replaceState(null, "", "#interview"); }
  }
  const save = () => store.set("interview:now", st);
  const box = h("div.col");
  const draw = () => {
    if (st.i >= st.ids.length) {
      const note = h("textarea", { rows: 4, placeholder: "Which answer would you give differently, and how?", value: st.note ?? "", oninput: (e) => { st.note = e.target.value; save(); } });
      return put(box, h("h2", "The board thanks you"),
        h("p", "One note to yourself before you go. That's the only mark this gets."), note,
        h("div.row", h("button.primary", { onclick: () => {
          const a = Object.values(st.answers);
          log.push({ day: st.day, asked: a.length, aloud: a.filter((x) => x.aloud).length, idk: a.filter((x) => x.idk).length, followUps: a.filter((x) => x.fu).length, note: (st.note ?? "").trim().slice(0, 600) });
          store.set("interviewLog", log.slice(-50)); store.del("interview:now"); render();
        } }, "Save the note")));
    }
    const q = qs.find((x) => x.id === st.ids[st.i]), p = who(q.persona), a = (st.answers[q.id] ??= {});
    const text = ivFill(bi(q.q), daf);
    const ta = h("textarea", { rows: 5, placeholder: "Type your answer, or answer aloud and jot the key points", value: a.text ?? "", style: { fontFamily: "var(--read-font)", fontSize: "17px" }, oninput: (e) => { a.text = e.target.value; save(); next.textContent = nextLabel(); } });
    const nextLabel = () => (a.text?.trim() || a.idk ? "Next question" : "I answered aloud: next");
    const next = h("button.primary", { onclick: () => { if (!a.text?.trim() && !a.idk) a.aloud = true; st.i++; save(); draw(); window.scrollTo(0, 0); } }, nextLabel());
    const fuBox = h("div.col");
    const drawFu = () => {
      if (a.idk) return put(fuBox, h("div.card.soft", h("p", bi(p.onIDontKnow)), h("p.small.muted", q.idkOk ? "On a fact you don't know, saying so plainly is the right answer." : "Here the board wanted your view. Next time, try a line or two, even a tentative one.")));
      if (a.fu) return put(fuBox, h("div.card.soft", h("div.small.muted", bi(p.name) + " · AI"), h("p", a.fu)),
        h("textarea", { rows: 3, placeholder: "Your answer to the follow-up", value: a.fa ?? "", oninput: (e) => { a.fa = e.target.value; save(); } }));
      if (a.fuNote) return put(fuBox, h("p.small.muted", a.fuNote));
      put(fuBox);
    };
    const ask = () => {
      if (words(a.text) < 8) { a.fuNote = "Type at least a sentence or two so the member has something to follow up on."; drawFu(); a.fuNote = null; return; }
      put(fuBox, h("p.muted", bi(p.name) + " is thinking…"));
      post("/interview/follow", { memberId: profile().memberId, persona: { name: bi(p.name), style: bi(p.style) }, question: text, answer: a.text, hindi: lang() === "hi" }).then((r) => {
        if (r?.care) { pod.care = true; put(fuBox, careBox()); return; }
        if (r?.quiet) a.fuNote = "The AI board members rest from 11:30 pm to 7 am and in result weeks. Carry on with the next question.";
        else if (r?.limit) a.fuNote = "That's enough follow-ups for today. Carry on with the bank's questions.";
        else if (!r || r.error) a.fuNote = r?.error ?? "Couldn't reach the board member. Check your connection.";
        else a.fu = r.followUp;
        save(); drawFu();
      });
    };
    put(box, h("div.small.muted", `Question ${st.i + 1} of ${st.ids.length}`),
      h("div.card", h("strong", bi(p.name)), h("div.small.muted", bi(p.style)), h("p", { style: { fontSize: "19px" } }, text)),
      ta, fuBox,
      h("div.row.wrap",
        !a.fu && !a.idk && h("button", { onclick: ask }, "Ask me a follow-up (AI)"),
        !a.idk && h("button", { onclick: () => { a.idk = true; save(); draw(); } }, "I don't know"),
        next),
      h("button.link.small", { onclick: () => { st.i = st.ids.length; save(); draw(); } }, "End the board here"));
    drawFu();
  };
  draw();
  return h("div.col", h("a", { href: "#practice" }, "← Practice"), h("h1", "Mock interview"), box);
}

// --- Mock papers -------------------------------------------------------------------------------
// Real format: GS1 +2 / -0.66, CSAT +2.5 / -0.83. Results show the last five papers as a band
// (playbook A8), never one number on its own.

function quickMock() {
  const pool = [...(data.questions?.fromCards ?? []), ...(data.questions?.bank ?? [])].filter((q) => q.en);
  if (pool.length < 10) return null;
  const qs = shuffle(pool, Date.now() % 100000).slice(0, 25);
  return { id: "quick", title: "Quick mock", paper: "GS1", minutes: Math.ceil(qs.length * 1.2), marking: { right: 2, wrong: -0.66 },
    note: "Built from checked Chai questions and the starter bank. Practice only, not an official paper.", questions: qs.map((q) => ({ topic: q.topic, en: q.en, hi: q.hi, cardId: q.cardId, id: q.id })) };
}
function paperFrom(item) {
  const d = item.data;
  return { id: item.id, title: bi(d.title) || "Mock paper", paper: d.paper, minutes: d.minutes, marking: d.marking, note: bi(d.note), questions: d.questions.map((q, i) => ({ ...q, id: `${item.id}#${i}` })), checked: d.review?.en,
    // {default: "off", counts: "up"}: no countdown for this paper; minutes is only the suggested time.
    countUp: d.timer?.counts === "up", timerOff: d.timer?.default === "off" };
}

function viewMock(arg) {
  const active = store.get("mock:active");
  if (active) return mockPlayer(active);
  if (arg === "result") return mockResult(store.get("mockHistory", []).at(-1));
  const papers = libraryOf("mock").map(paperFrom);
  const quick = quickMock();
  const hist = store.get("mockHistory", []);
  const startCard = (p) => h("div.card", h("div.row.between",
    h("div.grow", h("strong", p.title), h("div.small.muted", `${p.questions.length} questions · ${p.countUp ? `about ${p.minutes} min suggested, no countdown` : `${p.minutes} min`} · +${p.marking.right} / ${p.marking.wrong} per question`),
      p.checked && h("div.small", `Checked by ${p.checked.checkedBy}, ${p.checked.checkedOn} ✓`), p.note && h("div.small.muted", p.note)),
    h("button.primary", { onclick: () => mockStart(p) }, "Start")));
  return h("div.col", h("h1", "Mock papers"), pauseLine("first-mock-start"),
    h("p.muted", "Timed, with negative marking. Full screen, and your blocklist stays closed until you submit."),
    papers.map(startCard),
    quick ? startCard(quick) : h("p.small.muted", "A quick mock appears once there are 10 or more checked questions."),
    papers.length === 0 && h("p.small.muted", "Full-length papers appear here after an editor writes and approves them on the desk."),
    hist.length > 0 && h("div", h("h2", "Your range"), rangeBand(hist), h("h3", "Past papers"),
      hist.slice().reverse().slice(0, 10).map((r) => h("div.task", h("div.grow", h("div", r.title), h("div.small.muted", `${r.day} · ${r.score} of ${r.max} · ${r.attempted} attempted`)), h("span", `${r.pct}%`)))));
}

function rangeBand(hist) {
  const last = hist.slice(-5), newest = last.at(-1);
  if (last.length < 2) return h("p", `${newest.pct}% on your first paper here. One paper is a small sample; your range appears after the second.`);
  const lo = Math.min(...last.map((r) => r.pct)), hi = Math.max(...last.map((r) => r.pct));
  const prev = last.slice(0, -1), plo = Math.min(...prev.map((r) => r.pct)), phi = Math.max(...prev.map((r) => r.pct));
  return h("div",
    h("p", h("strong", `Your range: ${lo}% to ${hi}%`), h("span.muted", ` over your last ${last.length} papers`)),
    h("div.band", { role: "img", "aria-label": `Range ${lo} to ${hi} percent, newest ${newest.pct} percent` },
      h("div.range", { style: { left: `${lo}%`, width: `${Math.max(hi - lo, 1)}%` } }), h("div.dot", { style: { left: `${newest.pct}%` } })),
    h("div.row.between.small.muted", h("span", "0%"), h("span", "100%")),
    newest.pct >= plo && newest.pct <= phi && h("p", "Inside your normal range."),
    newest.pct > phi && h("p", "Above your usual range. Note what you did differently."));
}

function mockStart(p) {
  const d = h("dialog",
    h("h2", p.title),
    h("ul", h("li", p.countUp ? `${p.questions.length} questions. Suggested time: about ${p.minutes} minutes, just a guide.` : `${p.questions.length} questions in ${p.minutes} minutes.`),
      h("li", `+${p.marking.right} for a right answer, ${p.marking.wrong} for a wrong one, 0 if you leave it.`),
      h("li", "Tick “Not sure” when you guess. Afterwards you'll see whether your guesses are paying off."),
      p.countUp ? h("li", `No countdown. ${p.timerOff ? "The timer is off; switch on an upward timer if you want one." : "The timer counts up."} You submit when you're done.`)
        : h("li", "The paper submits itself when time runs out.")),
    h("p.small.muted", p.note ?? ""),
    h("div.row", h("button.primary", { onclick: async () => {
      // With Plus switched on, full papers count against the free monthly allowance. The quick mock never does.
      if (plusOn() && p.id !== "quick") {
        const u = await post("/plus/use", { memberId: profile().memberId, kind: "mock" });
        if (u.ok === false) { put(d, h("h2", "Your free full paper this month is used"), h("p", "The quick mock is always free, and your allowance comes back next month."), h("div.row", h("button", { onclick: () => d.close() }, "OK"), h("a.btn", { href: "#upgrade", onclick: () => d.close() }, "What Plus adds"))); return; }
      }
      d.close();
      const now = Date.now();
      store.set("mock:active", { paper: p, answers: {}, unsure: {}, review: {}, cur: 0, startedAt: now, endsAt: p.countUp ? null : now + p.minutes * 60_000, hideTimer: !!(p.countUp && p.timerOff) });
      // A count-up paper keeps the blocklist closed for a generous three times the suggested time; it never submits itself.
      focus.start(p.countUp ? Math.max(60, p.minutes * 3) : p.minutes, p.title, "mock");
      document.documentElement.requestFullscreen?.().catch(() => {});
      location.hash = "#mock"; render();
    } }, "Start the paper"), h("button", { onclick: () => d.close() }, "Not now")));
  d.addEventListener("close", () => d.remove());
  document.body.append(d); d.showModal();
}

function mockPlayer(m) {
  const p = m.paper, n = p.questions.length;
  const save = () => store.set("mock:active", m);
  const timer = h("strong", { style: { fontVariantNumeric: "tabular-nums" } });
  const iv = setInterval(() => {
    if (p.countUp) { timer.textContent = m.hideTimer ? "Timer off" : `${hhmmss(Date.now() - m.startedAt)} so far`; return; }
    const left = m.endsAt - Date.now();
    timer.textContent = m.hideTimer ? (left < 5 * 60_000 ? `${mmss(left)} left` : "Timer hidden") : hhmmss(left);
    if (left <= 0) { clearInterval(iv); mockSubmit(); }
  }, 500);
  cleanup.push(() => clearInterval(iv));
  const body = h("div"), side = h("div");
  const go = (i) => { m.cur = Math.max(0, Math.min(n - 1, i)); save(); draw(); };
  const onKey = (e) => {
    if (e.target.closest("input, textarea")) return;
    const k = e.key.toLowerCase();
    if (["1", "2", "3", "4", "a", "b", "c", "d"].includes(k)) { const idx = "1234".includes(k) ? Number(k) - 1 : "abcd".indexOf(k); pick(idx); }
    if (e.key === "ArrowRight") go(m.cur + 1); if (e.key === "ArrowLeft") go(m.cur - 1);
  };
  window.addEventListener("keydown", onKey); cleanup.push(() => window.removeEventListener("keydown", onKey));
  const pick = (i) => { const q = p.questions[m.cur]; if (i < 0 || i >= mcqOf(q).options.length) return; m.answers[m.cur] = m.answers[m.cur] === i ? undefined : i; if (m.answers[m.cur] === undefined) delete m.answers[m.cur]; save(); draw(); };
  function draw() {
    const q = p.questions[m.cur], mc = mcqOf(q);
    put(body, 
      h("div.small.muted", `Question ${m.cur + 1} of ${n}${q.topic ? " · " + q.topic : ""}`),
      h("div.card", { lang: hindi() && q.hi ? "hi" : "en" }, h("p", { style: { fontSize: "18px", whiteSpace: "pre-line" } }, h("strong", mc.question)),
        mc.options.map((o, i) => h("button.opt", { "aria-pressed": String(m.answers[m.cur] === i), onclick: () => pick(i) }, `${"abcd"[i] ?? i + 1}) ${o}`)),
        h("div.row", { style: { marginTop: "8px" } },
          h("label.small", h("input", { type: "checkbox", checked: !!m.unsure[m.cur], onchange: (e) => { m.unsure[m.cur] = e.target.checked; save(); draw(); } }), " Not sure (a guess)"),
          h("label.small", h("input", { type: "checkbox", checked: !!m.review[m.cur], onchange: (e) => { m.review[m.cur] = e.target.checked; save(); draw(); } }), " Come back to this"))),
      h("div.row.between", h("button", { disabled: m.cur === 0, onclick: () => go(m.cur - 1) }, "← Previous"),
        h("span.small.muted", "Keys: 1–4 to pick, arrows to move"), h("button.primary", { onclick: () => (m.cur === n - 1 ? confirmSubmit() : go(m.cur + 1)) }, m.cur === n - 1 ? "Submit" : "Next →")));
    const answered = Object.keys(m.answers).length;
    put(side, 
      h("div.card", h("div.row.between", timer, h("button.ghost.small", { onclick: () => { m.hideTimer = !m.hideTimer; save(); draw(); timer.textContent = ""; } }, p.countUp ? (m.hideTimer ? "Switch on timer" : "Switch off timer") : m.hideTimer ? "Show timer" : "Hide timer")),
        p.countUp && h("div.small.muted", `Suggested: about ${p.minutes} min. No countdown.`),
        h("div.small.muted", `${answered} answered · ${n - answered} left`),
        h("div.palette", { style: { marginTop: "12px" } }, p.questions.map((_, i) => h("button" + (m.answers[i] !== undefined ? ".answered" : "") + (m.review[i] ? ".review" : "") + (i === m.cur ? ".current" : ""), { onclick: () => go(i), "aria-label": `Question ${i + 1}` }, i + 1))),
        h("div", { style: { marginTop: "12px" } }, h("button", { onclick: confirmSubmit }, "Submit paper"))));
  }
  function confirmSubmit() {
    const left = n - Object.keys(m.answers).length, rev = Object.values(m.review).filter(Boolean).length;
    const d = h("dialog", h("h2", "Submit the paper?"), h("p", `${left} unanswered${rev ? `, ${rev} marked to come back to` : ""}. Unanswered questions score 0.`),
      h("div.row", h("button.primary", { onclick: () => { d.close(); mockSubmit(); } }, "Submit"), h("button", { onclick: () => d.close() }, "Keep working")));
    d.addEventListener("close", () => d.remove()); document.body.append(d); d.showModal();
  }
  draw();
  return h("div", h("div.row.between", h("h1", p.title), h("span.small.muted", p.note ?? "")), h("div.exam", body, side));
}

function mockSubmit() {
  const m = store.get("mock:active");
  if (!m) return;
  const p = m.paper;
  let right = 0, wrong = 0, unsureRight = 0, unsureTotal = 0;
  const topics = {};
  const review = p.questions.map((q, i) => {
    const mc = mcqOf(q), a = m.answers[i];
    const t = (topics[q.topic || "Other"] ??= { right: 0, wrong: 0, skipped: 0 });
    if (a === undefined) { t.skipped++; return { i, a: null, ok: null }; }
    const ok = a === mc.answerIndex;
    ok ? (right++, t.right++) : (wrong++, t.wrong++);
    if (m.unsure[i]) { unsureTotal++; if (ok) unsureRight++; }
    if (!ok && q.en) addMiss({ id: q.id, cardId: q.cardId, topic: q.topic, en: q.en, hi: q.hi });
    return { i, a, ok };
  });
  const max = +(p.questions.length * p.marking.right).toFixed(2);
  const score = +(right * p.marking.right + wrong * p.marking.wrong).toFixed(2);
  const rec = { id: p.id, title: p.title, day: today(), marking: p.marking, score, max, pct: Math.max(0, Math.round((score / max) * 100)), attempted: right + wrong, right, wrong, unsureRight, unsureTotal, topics, minutes: Math.round((Date.now() - m.startedAt) / 60000) };
  const hist = store.get("mockHistory", []); hist.push(rec); store.set("mockHistory", hist.slice(-100));
  store.set("mock:last", { paper: p, answers: m.answers, unsure: m.unsure, review });
  store.del("mock:active");
  focus.stop(true);
  if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  location.hash = "#mock/result"; render();
}

/** Opt-in: your percent goes to the server without a member id; a band comes back once 30 people have shared. */
function mockBandCard(r) {
  const key = `band:${r.id}:${r.day}`;
  const box = h("div.card.soft");
  const show = (b) => put(box, h("strong", "Your band"), h("p", { style: { margin: "4px 0 0" } }, b.band ?? b.note), h("p.small.muted", "A band among people who shared, never a rank."));
  const saved = store.get(key);
  if (saved) { show(saved); return box; }
  put(box, h("p", h("strong", "See where you sit? "), "Share your percent for this paper anonymously (no member id, no name) and see a band once 30 people have. Never a rank."),
    h("div.row", h("button", { onclick: () => post("/mocks/band", { mockId: r.id, pct: r.pct }).then((b) => { if (b.status === 200) { store.set(key, b); show(b); } else put(box, h("p.small", b.error ?? "Couldn't reach the server.")); }) }, "Share and see my band"),
      h("button.ghost", { onclick: () => box.remove() }, "No thanks")));
  return box;
}

function mockResult(r) {
  const last = store.get("mock:last");
  if (!r || !last) return h("div.col", h("p", "No paper yet."), h("a.btn", { href: "#mock" }, "Mock papers"));
  // A guess pays when its hit rate beats the break-even point for this marking (about 1 in 4 for GS1).
  const mk = r.marking ?? { right: 2, wrong: -0.66 };
  const breakEven = -mk.wrong / (mk.right - mk.wrong);
  const hit = r.unsureTotal ? r.unsureRight / r.unsureTotal : 0;
  const guessLine = r.unsureTotal >= 3
    ? `Your guesses: ${r.unsureRight} of ${r.unsureTotal} right. ` + (hit > breakEven + 0.1
      ? "That's well above break-even, so your educated guesses are earning marks."
      : hit < breakEven ? "That's below break-even with negative marking, so skip more of the wild ones."
        : "That's about break-even: guesses aren't gaining or losing much yet.")
    : null;
  const weak = Object.entries(r.topics).filter(([, t]) => t.wrong + t.skipped > t.right).map(([k]) => k).slice(0, 3);
  let filter = "wrong";
  const list = h("div");
  const drawList = () => put(list, 
    h("div.chips", [["wrong", "Wrong"], ["skipped", "Skipped"], ["all", "All"]].map(([v, l]) => h("button.chip", { "aria-pressed": String(filter === v), onclick: () => { filter = v; drawList(); } }, l))),
    last.review.filter((x) => filter === "all" || (filter === "wrong" ? x.ok === false : x.ok === null)).map((x) => {
      const q = last.paper.questions[x.i], mc = mcqOf(q);
      return h("div.card", h("div.small.muted", `Question ${x.i + 1}${q.topic ? " · " + q.topic : ""}${last.unsure[x.i] ? " · you marked it a guess" : ""}`),
        h("p", { style: { whiteSpace: "pre-line" } }, h("strong", mc.question)),
        mc.options.map((o, i) => h("div.opt" + (i === mc.answerIndex ? ".right" : i === x.a ? ".wrong" : ""), o)),
        h("p", mc.explanation ?? ""));
    }));
  drawList();
  return h("div.col", h("h1", "Paper done."),
    h("p.muted", `${r.title} · ${r.minutes} min`),
    h("div.card", h("div.bignum", `${r.score}`), h("div.muted", `of ${r.max} · ${r.right} right, ${r.wrong} wrong, ${last.paper.questions.length - r.attempted} left`),
      rangeBand(store.get("mockHistory", []))),
    r.id !== "quick" && !resultMode() && mockBandCard(r),
    r.id !== "quick" && plusCard("mock_band"),
    guessLine && h("div.card.soft", guessLine),
    !resultMode() && BR.afterHardMock(r),
    weak.length > 0 && h("p", `Worth a look: ${weak.join(", ")}. Wrong answers come back in Prelims practice.`),
    h("h2", "Go through the answers"), list,
    h("a.btn", { href: "#mock" }, "Back to mock papers"));
}

// --- Long reading ------------------------------------------------------------------------------

// Long reads, grouped by subject in syllabus order. The syllabus packs carry a topic; the first 16 reads (Oct packs) don't,
// so their subject is listed here by id. The same list is in Android OffScreen.kt (READ_SUBJECTS).
const READ_SUBJECTS = ["Ancient and medieval India, and culture", "Modern history", "World history", "Indian society", "Geography", "Polity",
  "Governance and social justice", "International relations", "Economy", "Science and technology", "Environment", "Internal security",
  "Ethics, integrity and aptitude"];
const READ_SUBJECT_OF = {
  "read:anc-mauryan-state-and-ashoka": 0, "read:art-temple-architecture-nagara-dravida": 0, "read:his-gandhian-mass-movements": 1,
  "read:geo-indian-monsoon-mechanism": 4, "read:pol-election-commission-and-elections": 5, "read:pol-panchayati-raj": 5,
  "read:soc-cooperative-federalism": 5, "read:soc-constitutional-safeguards-for-weaker-sections": 6, "read:ir-india-and-its-neighbourhood": 7,
  "read:eco-gst-explained": 8, "read:eco-monetary-policy-explained": 8, "read:sci-biotechnology-basics": 9, "read:sci-indias-space-programme": 9,
  "read:env-climate-change-agreements": 10, "read:env-protected-areas-network": 10, "read:eth-attitude-and-emotional-intelligence": 12,
};
const readSubject = (it) => it.data.topic ?? READ_SUBJECTS[READ_SUBJECT_OF[it.id]] ?? "Other";

function viewRead(arg) {
  if (arg === "saved") return savedCards();
  if (arg) return reader(arg);
  const reads = libraryOf("read");
  const done = store.get("readDone", {});
  const order = (s) => { const i = READ_SUBJECTS.indexOf(s); return i < 0 ? 99 : i; };
  const subjects = [...new Set(reads.map(readSubject))].sort((a, b) => order(a) - order(b));
  const pick = subjects.includes(store.get("readSubject", "")) ? store.get("readSubject", "") : "";
  const shown = subjects.filter((s) => !pick || s === pick);
  const row = (it) => h("div.card", h("div.row.between",
    h("div.grow", h("strong", bi(it.data.title)), h("div.small.muted", `${it.data.minutes} min${done[it.id] ? " · Read" : ""}`)),
    h("a.btn", { href: "#read/" + encodeURIComponent(it.id) }, "Read")));
  const choose = (s) => { store.set("readSubject", s); render(); };
  return h("div.col", h("h1", "Long reads"),
    h("p.muted", `${reads.length} reads across ${subjects.length} subjects. Text size and theme are in the reader. At the end, write what you remember before you check.`),
    reads.length === 0 && h("p", "Long reads appear here after an editor writes and approves them on the desk."),
    reads.length > 0 && h("div.chips", { role: "group", "aria-label": "Subject" },
      h("button.chip", { "aria-pressed": String(!pick), onclick: () => choose("") }, "All"),
      subjects.map((s) => h("button.chip", { "aria-pressed": String(pick === s), onclick: () => choose(s) }, `${s} · ${reads.filter((it) => readSubject(it) === s).length}`))),
    shown.map((s) => h("section", h("h2", s), reads.filter((it) => readSubject(it) === s).map(row))),
    h("div.card", h("div.row.between", h("div", h("strong", "Saved Chai cards"), h("div.small.muted", `${store.get("saved", []).length} saved`)), h("a.btn", { href: "#read/saved" }, "Read"))));
}

// "Read aloud · device voice": the browser's own speech, on a tap only. Nothing is sent anywhere; no AI voice.
// Stops when the page changes. Hidden where the browser has no speech.
function readAloud(text, lang) {
  if (!("speechSynthesis" in window)) return null;
  const hi = lang === "hi";
  const label = () => (speechSynthesis.speaking ? (hi ? "■ रोकें" : "■ Stop") : hi ? "🔈 सुनें · डिवाइस की आवाज़" : "🔈 Read aloud · device voice");
  const note = h("span.small.muted");
  const btn = h("button.ghost", { onclick: () => {
    if (speechSynthesis.speaking) { speechSynthesis.cancel(); btn.textContent = label(); return; }
    const want = hi ? "hi" : "en";
    const voices = speechSynthesis.getVoices();
    const voice = voices.find((v) => v.lang.toLowerCase().startsWith(want + "-in")) ?? voices.find((v) => v.lang.toLowerCase().startsWith(want));
    if (hi && voices.length && !voice) { note.textContent = " इस डिवाइस में हिंदी आवाज़ नहीं है।"; return; }
    note.textContent = "";
    String(text).split(/\n+/).map((x) => x.trim()).filter(Boolean).forEach((part, k, all) => {
      const u = new SpeechSynthesisUtterance(part);
      u.lang = hi ? "hi-IN" : "en-IN"; if (voice) u.voice = voice;
      if (k === all.length - 1) u.onend = u.onerror = () => { btn.textContent = label(); };
      speechSynthesis.speak(u);
    });
    btn.textContent = hi ? "■ रोकें" : "■ Stop";
  } }, label());
  cleanup.push(() => speechSynthesis.cancel());
  return h("span", btn, note);
}

// --- Light and dark ---------------------------------------------------------------------------
// Dark is the default (owner, 4 Nov 2026). "system" follows the device. The button on every screen flips between the
// two; Me → Appearance has all three. index.html sets the stored choice before the first paint, so nothing flashes.
const themeChoice = () => store.get("theme", "dark");
const darkNow = () => { const t = themeChoice(); return t === "system" ? matchMedia("(prefers-color-scheme: dark)").matches : t === "dark"; };
function applyTheme(t) {
  store.set("theme", t);
  if (t === "system") delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", darkNow() ? "#17100B" : "#9A4E0E");
}
const toggleTheme = () => { applyTheme(darkNow() ? "light" : "dark"); render(); };
const themeButton = (short = false) => h("button.themebtn", { type: "button", onclick: toggleTheme, "aria-label": darkNow() ? "Switch to light mode" : "Switch to dark mode" },
  h("span", { "aria-hidden": "true" }, darkNow() ? "☀" : "☾"), (darkNow() ? " Light" : " Dark") + (short ? "" : " mode"));
function appearanceCard() {
  const opt = (v, label) => h("label.choice", h("input", { type: "radio", name: "theme", value: v, checked: themeChoice() === v, onchange: () => { applyTheme(v); render(); } }), " " + label);
  return h("div.card", { id: "appearance" }, h("h3", { style: { marginTop: 0 } }, "Appearance"),
    h("div.col", { style: { gap: "6px" } }, opt("dark", "Dark (the default)"), opt("light", "Light"), opt("system", "Match my device")),
    h("p.small.muted", "The ☀ / ☾ button at the top of every screen switches too."));
}

function readerTools() {
  const size = store.get("readSize", 20);
  document.documentElement.style.setProperty("--read-size", size + "px");
  const setSize = (s) => { store.set("readSize", s); document.documentElement.style.setProperty("--read-size", s + "px"); };
  return h("div.row", h("button.ghost", { "aria-label": "Smaller text", onclick: () => setSize(Math.max(15, store.get("readSize", 20) - 1)) }, "A−"),
    h("button.ghost", { "aria-label": "Larger text", onclick: () => setSize(Math.min(30, store.get("readSize", 20) + 1)) }, "A+"),
    h("button.ghost", { onclick: toggleTheme }, darkNow() ? "☀ Light mode" : "☾ Dark mode"));
}

function reader(id) {
  id = decodeURIComponent(id);
  const it = (data.library?.items ?? []).find((x) => x.id === id);
  if (!it) return h("div.col", h("p", "That read isn't available."), h("a.btn", { href: "#read" }, "Long reads"));
  const d = it.data, lang = (it.languages ?? (it.hindi ? ["en", "hi"] : ["en"])).includes(lang_()) ? lang_() : "en";
  const sections = d.sections?.[lang] ?? d.sections?.en ?? [];
  const progress = h("i", { style: { width: "0%" } });
  const onScroll = () => { const el = document.scrollingElement; progress.style.width = `${Math.min(100, (el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight)) * 100)}%`; };
  window.addEventListener("scroll", onScroll, { passive: true }); cleanup.push(() => window.removeEventListener("scroll", onScroll));
  const recallBox = h("textarea", { rows: 5, placeholder: "Without scrolling back: what were the main points?" });
  const check = h("div");
  const prompts = d.recall?.[lang] ?? d.recall?.en ?? [];
  const checked = it.data.review?.[lang] ?? it.data.review?.en;
  return h("div",
    h("div", { style: { position: "sticky", top: 0, background: "var(--bg)", padding: "8px 0", zIndex: 5 } },
      h("div.row.between", h("a", { href: "#read" }, "← Long reads"), readerTools(),
        !focus.active && h("button", { onclick: () => focus.start(Math.max(15, d.minutes ?? 25), "Reading", "focus") }, `Read with focus (${Math.max(15, d.minutes ?? 25)} min)`)),
      h("div.bar", progress)),
    h("article.reader", { lang },
      h("h1", { style: { fontFamily: "var(--ui-font)" } }, bi(d.title)),
      h("div", { style: { fontFamily: "var(--ui-font)" } }, readAloud([bi(d.title), ...sections.flatMap((s) => [s.heading, s.body])].filter(Boolean).join("\n"), lang)),
      h("p.small.muted", { style: { fontFamily: "var(--ui-font)" } }, `${d.minutes} min · ${checked?.checkedBy ? `Checked by ${checked.checkedBy}, ${checked.checkedOn} ✓` : "Not yet checked by an editor"}`),
      sections.map((s) => [s.heading && h("h2", s.heading), String(s.body ?? "").split(/\n{2,}/).map((para) => h("p", para))]),
      h("p.small.muted", { style: { fontFamily: "var(--ui-font)" } }, "Sources: " + bi(d.sources))),
    h("div.col", h("div.card.soft",
      h("h2", { style: { marginTop: 0 } }, "Before you go: say it from memory"),
      h("p.small", "Pulling it back out of memory makes it stick far better than reading it again."),
      recallBox,
      h("div", { style: { marginTop: "8px" } }, h("button.primary", { onclick: () => {
        const notes = store.get("readNotes", {}); notes[id] = { day: today(), text: recallBox.value.trim() }; store.set("readNotes", notes);
        const done = store.get("readDone", {}); done[id] = today(); store.set("readDone", done);
        put(check, h("h3", "Did you get these?"), prompts.length ? h("ul", prompts.map((p) => h("li", p))) : h("p", "Scroll back and compare."));
      } }, "Check")), check)));
}

function savedCards() {
  const saved = store.get("saved", []);
  return h("div", h("div.row.between", h("a", { href: "#read" }, "← Long reads"), readerTools()),
    h("div.reader", h("h1", { style: { fontFamily: "var(--ui-font)" } }, "Saved for revision"),
      saved.length === 0 && h("p", "Nothing saved yet. Tap “Save for revision” on a Chai card."),
      saved.slice().reverse().map((it) => { const t = cardText(it); return h("section", { lang: t.lang },
        h("h2", t.headline), h("p.small.muted", { style: { fontFamily: "var(--ui-font)" } }, `${chipsOf(it, t).join(" · ")} · saved ${it.savedOn}`), h("p", t.summary),
        t.why?.length > 0 && h("ul", t.why.map((w) => h("li", w))),
        h("button.ghost", { onclick: () => { store.set("saved", store.get("saved", []).filter((x) => x.id !== it.id)); render(); } }, "Remove")); })));
}

// --- Focus -------------------------------------------------------------------------------------

function viewFocus() {
  const f = focus.active, cfg = focusCfg();
  const label = h("input", { type: "text", placeholder: "What are you working on? (optional)", maxLength: 60 });
  const custom = h("input", { type: "number", min: 5, max: 240, value: 45, style: { width: "90px" } });
  const startWith = (min) => { focus.start(min, label.value.trim() || "Focus", "focus"); render(); };
  const week = Array.from({ length: 7 }, (_, i) => addDays(today(), i - 6)).map((d) => [d, focus.minutesOn(d)]);
  const maxW = Math.max(60, ...week.map(([, m]) => m));
  const blockTa = h("textarea", { rows: 5, value: cfg.blocklist.join("\n") });
  const limitsTa = h("textarea", { rows: 3, value: Object.entries(cfg.limits).map(([k, v]) => `${k} ${v}`).join("\n"), placeholder: "youtube.com 30" });
  const saveCfg = () => {
    const blocklist = blockTa.value.split(/[\s,]+/).map((s) => s.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "")).filter((s) => /^[a-z0-9.-]+\.[a-z]{2,}$/.test(s));
    const limits = {};
    limitsTa.value.split("\n").forEach((line) => { const [site, min] = line.trim().split(/\s+/); if (site && Number(min) > 0) limits[site.toLowerCase().replace(/^www\./, "")] = Math.round(Number(min)); });
    store.set("focusCfg", { ...cfg, blocklist, limits });
    ext.send(); render();
  };
  return h("div.col", h("h1", "Focus"),
    f ? h("div.card.soft.center",
      h("div.muted", f.label), h("div.bignum", { id: "focusBig" }, mmss(f.endsAt - Date.now())),
      h("p.small", ext.connected ? `${cfg.blocklist.length} sites closed until this ends.` : "Add the focus extension to close distracting sites too (below)."),
      h("button", { onclick: askStop }, "Stop"))
      : h("div.card",
        h("h2", { style: { marginTop: 0 } }, "Start a focus block"), label,
        h("div.row", { style: { marginTop: "12px" } },
          [25, 50, 90].map((m) => h("button" + (m === 25 ? ".primary" : ""), { onclick: () => startWith(m) }, `${m} min`)),
          h("span.muted", "or"), custom, h("button", { onclick: () => startWith(Math.min(240, Math.max(5, Number(custom.value) || 45))) }, "Start")),
        h("p.small.muted", "When it ends: a real break. Stand up, drink water, look out of a window.")),
    h("h2", "This week"),
    h("div.card", h("div.row", { style: { alignItems: "flex-end", height: "120px", gap: "10px" } }, week.map(([d, m]) =>
      h("div.grow.center", h("div", { style: { height: `${(m / maxW) * 90}px`, background: "var(--brand)", borderRadius: "6px 6px 0 0", minHeight: m ? "4px" : "0" }, title: `${m} min` }),
        h("div.small.muted", new Date(d + "T12:00").toLocaleDateString(undefined, { weekday: "short" }))))),
      h("p.small.muted", `${week.reduce((n, [, m]) => n + m, 0)} focused minutes this week. No targets, no streaks.`)),
    h("h2", "Close distracting sites (desktop)"),
    h("div.card",
      h("p", ext.connected ? h("strong", `✓ Focus extension connected (v${ext.version}).`) : h("span", h("strong", "The focus extension isn't added in this browser yet. "), "It's in the ", h("code", "focus-extension"), " folder next to the server. In Chrome or Edge: Extensions → turn on Developer mode → Load unpacked → pick that folder. Then reload this page.")),
      h("h3", "Closed during focus blocks and mock papers"), blockTa, h("p.small.muted", "One site per line, like youtube.com. Subdomains are included."),
      h("h3", "Daily limits, any time"), limitsTa, h("p.small.muted", "A site and minutes per day, like “youtube.com 30”. After the limit it closes until midnight, with a short pause if you really need it."),
      h("h3", "Pause before opening a closed site"),
      h("div.row", h("input", { type: "number", min: 0, max: 60, value: cfg.pauseSeconds, style: { width: "90px" }, onchange: (e) => { store.set("focusCfg", { ...focusCfg(), pauseSeconds: Math.max(0, Math.min(60, Number(e.target.value) || 0)) }); ext.send(); } }), h("span", "seconds")),
      h("label.small", h("input", { type: "checkbox", checked: !!cfg.sound, onchange: (e) => store.set("focusCfg", { ...focusCfg(), sound: e.target.checked }) }), " Soft chime when a block ends"),
      h("div", { style: { marginTop: "12px" } }, h("button.primary", { onclick: saveCfg }, "Save"))),
    h("h2", "On your phone"),
    h("div.card", h("p", "The Android app has Focus too: pick the apps to close during a focus block, and daily limits for the rest. My Path → Focus.")));
}

/// --- Open rooms (server rooms.ts) ----------------------------------------------------------------
// Joined like channels: language, where you are, goal, optional, region. Real member counts, Chotu and the study
// friends always labelled AI. The room board ranks rooms by their shared Quiz Night score, never people.

const ROOM_GROUPS = [["language", "Language"], ["attempt", "Where you are"], ["goal", "Goal"], ["optional", "Optionals"], ["region", "Region"]];
const rooms = { list: null, board: null, error: null, busy: null, id: null, ws: null, status: "off", messages: [], pinned: null, photos: {} };
let roomsRedraw = () => {};
const roomSeen = () => store.get("roomSeen", {});

/** "A", "A and B", "A, B and C". */
const listAnd = (xs) => (xs.length < 2 ? xs.join("") : xs.slice(0, -1).join(", ") + " and " + xs.at(-1));

function roomsLoad() {
  const p = profile();
  fetch("/rooms/list", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ memberId: p.memberId, seen: roomSeen(), ...matchBody() }) })
    .then((r) => (r.ok ? r.json() : Promise.reject())).then((l) => {
      // Day 1: the server put a new member in their starter rooms. Say which, until they close the note.
      if (l.started?.length) store.set("roomsStarted", l.rooms.filter((r) => l.started.includes(r.id)).map((r) => r.name));
      rooms.list = l; rooms.error = null; roomsRedraw();
    })
    .catch(() => { rooms.error = "Couldn't reach the rooms. Check your connection."; roomsRedraw(); });
  fetch("/rooms/leaderboard").then((r) => (r.ok ? r.json() : null)).then((b) => { if (b) { rooms.board = b; roomsRedraw(); } }).catch(() => {});
}

function roomJoin(id, join = true) {
  rooms.busy = id; roomsRedraw();
  fetch(join ? "/rooms/join" : "/rooms/leave", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ memberId: profile().memberId, roomId: id }) })
    .then((r) => r.json()).then((d) => {
      rooms.busy = null;
      if (d.error) { rooms.error = d.error; roomsRedraw(); return; }
      if (join) { roomsLoad(); location.hash = "#rooms/" + id; } else { roomClose(); location.hash = "#rooms"; roomsLoad(); }
    }).catch(() => { rooms.busy = null; rooms.error = "Couldn't reach the rooms. Check your connection."; roomsRedraw(); });
}

function roomOpen(id) {
  if (rooms.id === id && rooms.ws && rooms.ws.readyState <= 1) return;
  roomClose();
  const p = profile();
  Object.assign(rooms, { id, messages: [], pinned: null, status: "connecting" });
  const url = new URL(`/rooms/${id}/ws`, location.href);
  url.protocol = location.protocol === "https:" ? "wss:" : "ws:";
  url.searchParams.set("member", p.memberId); url.searchParams.set("name", p.name);
  const ws = new WebSocket(url);
  rooms.ws = ws;
  ws.onopen = () => { rooms.status = "online"; roomsRedraw(); };
  ws.onclose = () => { if (rooms.ws === ws) { rooms.status = "off"; rooms.ws = null; roomsRedraw(); } };
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.type === "history") { rooms.messages = m.messages ?? []; rooms.pinned = m.pinned ?? null; }
    if (m.type === "msg") rooms.messages = [...rooms.messages, m.message].slice(-200);
    if (m.type === "hidden") rooms.messages = rooms.messages.filter((x) => x.id !== m.id);
    // The room's tally changed: keep your own pick and the answer, which the broadcast doesn't carry.
    if (m.type === "pinned") rooms.pinned = m.pinned && rooms.pinned?.day === m.pinned.day ? { ...m.pinned, mine: rooms.pinned.mine, answerIndex: rooms.pinned.answerIndex, explanation: rooms.pinned.explanation } : m.pinned;
    if (m.type === "pinned_result" && rooms.pinned) rooms.pinned = { ...rooms.pinned, mine: m.choice, answerIndex: m.answerIndex, explanation: m.explanation };
    if (m.type === "care") pod.care = true;
    if (m.type === "error") rooms.error = m.message;
    roomsRedraw();
  };
}
function roomClose() {
  if (rooms.id) store.set("roomSeen", { ...roomSeen(), [rooms.id]: Date.now() });
  const ws = rooms.ws; rooms.ws = null; rooms.id = null; ws?.close();
}

/** A photo sent with "Send to pod" (Android): members of the room only, gone after 7 days. */
function roomPhoto(id) {
  const box = h("div.small.muted", "Loading the photo…");
  const done = (url) => put(box, url ? h("img", { src: url, alt: "Photo of a handwritten answer", style: { maxWidth: "100%", maxHeight: "360px", display: "block", marginTop: "4px" } }) : "📷 Photo no longer here (photos are kept 7 days)");
  if (rooms.photos[id] !== undefined) { done(rooms.photos[id]); return box; }
  fetch(`/rooms/photo/${id}?member=${encodeURIComponent(profile().memberId)}`).then((r) => (r.ok ? r.blob() : null))
    .then((b) => { rooms.photos[id] = b ? URL.createObjectURL(b) : null; done(rooms.photos[id]); }).catch(() => done(null));
  return box;
}
const PHOTO_REF = /\bphoto:([0-9a-f]{32})\b/g;

function roomBoardCard(mine) {
  const b = rooms.board;
  if (!b) return null;
  return h("div.card",
    h("strong", "Room board 🎯"),
    h("p.small.muted", "Friday's Room Quiz Night: the same 5 questions in every room, one shared score per room. People are never ranked."),
    b.rooms.length === 0 ? h("p", `No room has ${b.minAnswers} answers yet this week. Friday, 20:00.`)
      : h("ol", { style: { margin: "4px 0", paddingLeft: "20px" } }, b.rooms.slice(0, 5).map((r) => h("li", { style: { fontWeight: mine.has(r.id) ? "700" : "400" } }, `${r.name} · ${r.pct}% · ${r.answered} answers`))));
}

function roomPinnedCard() {
  const p = rooms.pinned;
  if (!p) return null;
  const answered = p.mine !== null && p.mine !== undefined;
  return h("div.card.soft",
    h("strong", "📌 Today's question" + (p.topic ? " · " + p.topic : "")),
    h("p", p.question),
    p.kind === "mcq"
      ? [h("div.col", { style: { gap: "6px" } }, p.options.map((o, k) => h("button" + (p.mine === k ? ".primary" : ""), {
          disabled: answered, style: { textAlign: "left" },
          onclick: () => { rooms.pinned = { ...p, mine: k }; rooms.ws?.send(JSON.stringify({ type: "pinned_answer", choice: k })); roomsRedraw(); },
        }, `(${"abcd"[k]}) ${o}`))),
        answered && Number.isInteger(p.answerIndex) && h("p", (p.mine === p.answerIndex ? "✓ Right." : `○ The answer is (${"abcd"[p.answerIndex]}).`) + (p.explanation ? " " + p.explanation : "")),
        p.tally?.answered > 0 && h("p.small.muted", `${p.tally.answered} answered in this room · ${p.tally.right} right`)]
      : h("p.small.muted", "Write it in Prep → Mains, then share your intro here."));
}

function viewRooms(arg) {
  const box = h("div");
  if (arg) {
    roomOpen(arg);
    const input = h("input", { type: "text", maxLength: 1000, placeholder: "Write to the room · type @Chotu to ask Chotu" });
    const send = () => {
      const t = input.value.trim(); if (!t || !rooms.ws) return;
      if (distress(t)) pod.care = true;
      rooms.ws.send(JSON.stringify({ type: "say", text: t, kind: "chat", clientId: randomId() })); input.value = "";
    };
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") send(); });
    cleanup.push(() => { roomClose(); roomsRedraw = () => {}; });
    roomsRedraw = () => {
      const info = rooms.list?.rooms.find((r) => r.id === arg);
      put(box,
        h("div.row.between", h("a", { href: "#rooms" }, "← Rooms"), h("button.ghost.small", { disabled: rooms.busy === arg, onclick: () => { if (confirm(`Leave ${info?.name ?? "this room"}? You can join again any time.`)) roomJoin(arg, false); } }, "Leave")),
        h("h1", info?.name ?? "Room"),
        info && h("p.small.muted", `${info.members === 1 ? "1 member" : info.members + " members"}${info.online ? ` · ${info.online} here now` : ""}`),
        h("p.small.muted", rooms.status === "online" ? "" : rooms.status === "connecting" ? "Connecting…" : rooms.error ?? "Offline"),
        pod.care && careBox(),
        roomPinnedCard(),
        h("div.card.chat", { style: { maxHeight: "55vh", overflowY: "auto" } },
          rooms.messages.length === 0 && h("p.muted", "No messages yet. Say hello."),
          rooms.messages.map((m) => {
            const photos = [...String(m.text).matchAll(PHOTO_REF)].map((x) => x[1]);
            return h("div.msg" + (m.memberId === "chotu" || isFriend(m) ? ".chotu" : ""),
              h("div.row.small", m.memberId === "chotu" ? chotuLabel(null, 20) : isFriend(m) ? friendLabel(m) : h("span.who", m.name),
                h("span.muted", new Date(m.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })),
                isPerson(m) && m.memberId !== profile().memberId && h("button.ghost.small", { onclick: () => { rooms.ws?.send(JSON.stringify({ type: "report", id: m.id, reason: "Reported from the web" })); alert("Thanks. A moderator will look at it."); } }, "Report")),
              h("div", photos.length ? String(m.text).replace(PHOTO_REF, "").trim() : m.text),
              photos.map(roomPhoto));
          })),
        h("div.row", h("div.grow", input), h("button.primary", { onclick: send }, "Send")));
    };
    if (!rooms.list) roomsLoad();
    roomsRedraw();
    return h("div.col", box);
  }
  cleanup.push(() => { roomsRedraw = () => {}; });
  roomsRedraw = () => {
    const l = rooms.list;
    const all = l?.rooms ?? [];
    const mine = all.filter((r) => r.joined);
    const row = (r) => h("div.card", h("div.row.between",
      h("div", h("strong", r.name), h("p.small", { style: { margin: "2px 0" } }, `${r.members === 1 ? "1 member" : r.members + " members"}${r.online ? ` · ${r.online} here now` : ""}`),
        h("p.small.muted", { style: { margin: 0 } }, r.lastText ? `${r.lastName ?? "Someone"}: ${r.lastText.replace(PHOTO_REF, "📷")}` : r.note)),
      r.joined ? h("div.row", r.unread > 0 && h("span.tag", String(r.unread)), h("a.btn", { href: "#rooms/" + r.id }, "Open"))
        : h("button.primary", { disabled: rooms.busy === r.id, onclick: () => roomJoin(r.id) }, rooms.busy === r.id ? "Joining…" : "Join")));
    put(box,
      h("p", "Join as many as help: your language, where you are, your goal, your optional, your region. Chotu and the study friends here are AI and always labelled AI."),
      store.get("roomsStarted") && h("div.card.soft", h("p", { style: { margin: 0 } }, `So you don't start alone, you're in ${listAnd(store.get("roomsStarted"))}. Leave any that don't fit, and join others below.`),
        h("button.ghost.small", { onclick: () => { store.del("roomsStarted"); roomsRedraw(); } }, "Got it")),
      l?.mode === "open" && h("p.small.muted", `Matched pods of 6 to 8 start once ${l.threshold} aspirants have joined. ${l.signups} so far.`),
      rooms.error && h("p.small", rooms.error),
      !l && !rooms.error && h("p.muted", "Loading rooms…"),
      roomBoardCard(new Set(mine.map((r) => r.id))),
      mine.length > 0 && [h("h2", "Your rooms"), mine.map(row)],
      ROOM_GROUPS.map(([g, title]) => {
        const rs = all.filter((r) => r.group === g && !r.joined);
        return rs.length > 0 && [h("h2", title), rs.map(row)];
      }));
  };
  roomsLoad();
  roomsRedraw();
  return h("div.col", h("div.row.between", h("h1", "Open rooms"), h("a", { href: "#pod" }, "My pod →")), box);
}

/// --- Pod ---------------------------------------------------------------------------------------
// States are honest ("Forming · 2 of 8") and Chotu is never counted. One shared goal bar, never
// per-person progress. 🙏 thanks are never shown as counts on people.

const pod = { ws: null, podId: null, summary: store.get("podSummary"), messages: [], online: [], room: null, lead: null, youAreLead: false, priv: [],
  care: false, status: "off", error: null, goal: null, quiz: null, quizMine: {}, quizResults: {}, thanked: new Set(), claims: [],
  helper: null, pair: null, compared: false, missSent: null };
const RITUALS = "Mon goal · Wed and Sat answer hour · Fri Pod Quiz Night · Sun wins";
const isPerson = (m) => !["system", "chotu", "moderator", "choice", "compare"].includes(m.memberId) && m.kind !== "system" && !isFriend(m);

/** What the server may know for matching: only the four fields, and only the ones you gave. */
const matchBody = () => ({ ...P.syncedFields(), lang: P.value("lang") ?? POD_LANG[lang()] ?? "english" });

function podConnect() {
  if (pod.ws && pod.ws.readyState <= 1) return;
  const p = profile();
  pod.status = "connecting";
  fetch("/pods/join", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ memberId: p.memberId, ...matchBody() }) })
    .then((r) => r.json()).then((summary) => {
      // Open mode (server rooms.ts): below the sign-up threshold pods are open rooms, in the Android app for now.
      if (!summary.podId && summary.mode === "open") throw new Error("open: Pods are open rooms for now. Matched pods start once more people have joined.");
      if (!summary.podId) throw new Error(summary.error ?? "no pod");
      pod.podId = summary.podId; pod.summary = summary; store.set("podSummary", summary);
      if (!store.get("podJoinedOn")) { store.set("podJoinedOn", today()); rateAfter("pod_joined", 90_000); }
      const url = new URL(`/pods/${summary.podId}/ws`, location.href);
      url.protocol = location.protocol === "https:" ? "wss:" : "ws:";
      url.searchParams.set("member", p.memberId); url.searchParams.set("name", p.name);
      const ws = new WebSocket(url);
      pod.ws = ws;
      ws.onopen = () => { pod.status = "online"; pod.error = null; podRedraw(); };
      ws.onclose = () => { if (pod.ws === ws) { pod.status = "off"; pod.ws = null; podRedraw(); } };
      ws.onmessage = (e) => onPodEvent(JSON.parse(e.data));
    }).catch((e) => { pod.status = "off"; pod.error = /^open: /.test(e.message) ? e.message.slice(6) : /paused/i.test(e.message) ? e.message : "Couldn't reach your pod. Check your connection."; podRedraw(); });
}

function onPodEvent(m) {
  const me = profile()?.memberId;
  if (m.type === "history") {
    Object.assign(pod, { messages: m.messages ?? [], online: m.online ?? [], room: m.room, lead: m.lead, youAreLead: m.youAreLead, priv: m.private ?? [],
      goal: m.goal, quiz: m.quiz, quizMine: m.quiz?.mine ?? {}, thanked: new Set(m.thanked ?? []), claims: m.claims ?? [], helper: m.helper ?? null });
    if (m.thankedYou) award("first_thanks");
    if (m.youAreLead) award("lead");
    if (m.movedTo) return podMoved();
  }
  if (m.type === "msg") {
    pod.messages = [...pod.messages, m.message].slice(-200);
    // Saying something soon after Chotu's "someone new joined" note counts as welcoming them.
    if (m.message.memberId === me && pod.messages.slice(-6, -1).some((x) => x.memberId === "chotu" && /new (member|here|joined)|joined the pod/i.test(x.text))) award("welcomed");
  }
  if (m.type === "presence") pod.online = m.online;
  if (m.type === "room") pod.room = m.room;
  if (m.type === "hidden") pod.messages = pod.messages.filter((x) => x.id !== m.id);
  if (m.type === "private") pod.priv = [...pod.priv, m.message];
  if (m.type === "care") pod.care = true;
  if (m.type === "error") pod.error = m.message;
  if (m.type === "goal") pod.goal = m.goal;
  if (m.type === "quiz") pod.quiz = m.quiz;
  if (m.type === "quiz_result") { pod.quizResults[m.q] = m; award("quiz_night"); M.ritualOnce("quiz"); if (Object.keys(pod.quizResults).length >= (pod.quiz?.questions?.length ?? 99)) rateAfter("quiz"); }
  if (m.type === "thanked") pod.thanked.add(m.id);
  if (m.type === "thanks_received") award("first_thanks");
  if (m.type === "moved") return podMoved();
  if (m.type === "helper") pod.helper = m.helper;
  if (m.type === "compare_pair") pod.pair = m;
  if (m.type === "compared") { pod.pair = null; pod.compared = true; }
  if (m.type === "miss_you_sent") pod.missSent = m.n;
  podRedraw();
}

/** A forming pod merged into a bigger one: reconnect there and say so plainly. */
function podMoved(note = "Your forming pod joined a bigger pod with the same stage and language. More company, same you.") {
  const old = pod.ws; pod.ws = null; old?.close();
  pod.messages = []; pod.error = null; pod.quizResults = {};
  store.set("podMovedNote", note);
  setTimeout(podConnect, 300);
}

function podHeader() {
  const s = pod.summary;
  if (!s) return null;
  const label = { forming: "Forming", small: "Small", full: "Full" }[s.sizeState] ?? "Forming";
  const opens = s.opensOn ? new Date(s.opensOn + "T12:00").toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" }) : null;
  return h("div.pod-head",
    h("div.row.between", h("strong", `${label} · ${s.humans} of ${s.capacity}`), s.state === "quiet" && h("span.small.muted", "Quiet lately")),
    s.merge && h("div.card.soft", h("p.small", `Your pod and another pod with the same stage and language have both been quiet, so on ${new Date(s.merge.on + "T12:00").toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" })} they become one pod with more people around. Your old messages stay here.`),
      s.merge.stay ? h("div.row", h("span.small.grow", "You chose to stay in this pod."), h("button.ghost.small", { onclick: () => mergeStay(false) }, "Join after all"))
        : h("div.row", h("span.small.muted.grow", "Only you see your choice."), h("button.small", { onclick: () => mergeStay(true) }, "Keep me here"))),
    s.closest && h("p.small", "Nobody shares your exact stage, attempts and study time yet, so you're in the closest pod: same stage and language. If a pod for your exact group forms, you'll be asked privately whether to move. Nobody moves unless they choose to."),
    s.sizeState === "forming" && h("p.small", `Your pod has ${s.humans === 1 ? "1 person" : s.humans + " people"} so far. More join${opens ? " on " + opens : ""}, when this week's new members are matched. Meanwhile, the `, h("a", { href: "#commons" }, "Commons"), " is open."),
    h("p.small.muted", RITUALS));
}

function goalBar(compact = false) {
  const g = pod.goal;
  if (!g) return compact ? null : pod.youAreLead && h("div.card", h("div.row.between", h("span", "No pod goal yet this week."), h("button", { onclick: setGoal }, "Set this week's goal")));
  const pct = Math.min(100, Math.round((g.done / Math.max(1, g.target)) * 100));
  return h("div" + (compact ? "" : ".card.goal"),
    h("div.row.between", h("strong", g.text), h("span.small.muted", `${g.done} of ${g.target}${g.unit ? " " + g.unit : ""}`)),
    h("div.bar", { role: "img", "aria-label": `Pod goal ${pct} percent` }, h("i", { style: { width: pct + "%" } })),
    !compact && h("div.row.small", { style: { marginTop: "8px" } },
      h("span.muted.grow", g.setBy === "lead" ? "Set by the pod lead. One bar for the whole pod." : "Suggested by Chotu. One bar for the whole pod."),
      h("button.ghost.small", { onclick: () => pod.ws?.send(JSON.stringify({ type: "goal_add", n: 5 })) }, "+5 I did"),
      pod.youAreLead && h("button.ghost.small", { onclick: setGoal }, "Change")));
}
function setGoal() {
  const text = prompt("This week's pod goal (for example: 60 Prelims questions together)");
  if (!text?.trim()) return;
  const target = Number(prompt("How many, all together?", "60")) || 60;
  pod.ws?.send(JSON.stringify({ type: "goal_set", text: text.trim(), target, unit: "" }));
  M.ritualOnce("goal");
}

function quizCard() {
  const q = pod.quiz;
  if (!q) return null;
  const sc = q.score ?? {};
  const answered = (i) => pod.quizMine[i] != null || pod.quizResults[i];
  return h("details.card", { open: q.questions.some((_, i) => !answered(i)) },
    h("summary", h("strong", "Pod Quiz Night 🎯"), h("span.small.muted", ` · pod score ${sc.answered ? `${sc.right} of ${sc.answered} (${sc.pct}%)` : "no answers yet"}${q.lastWeekPct != null ? ` · last week ${q.lastWeekPct}%` : ""}`)),
    h("p.small.muted", "One shared pod score, compared only with your pod's own last week. Nobody's answers are shown."),
    q.questions.map((qq, i) => {
      const res = pod.quizResults[i];
      return h("div", { style: { marginTop: "10px" } }, h("p", h("strong", `${i + 1}. `), qq.question),
        qq.options.map((o, k) => h("button.opt" + (res && k === res.answerIndex ? ".right" : ""), { disabled: !!answered(i), onclick: () => { pod.quizMine[i] = k; pod.ws?.send(JSON.stringify({ type: "quiz_answer", q: i, choice: k })); } }, o)),
        res?.explanation && h("p.small", (res.right ? "✓ " : "○ ") + res.explanation),
        !res && pod.quizMine[i] != null && h("p.small.muted", "Answered."));
    }));
}

/** "Catch me up": three lines made on this device from what you missed. Nothing is sent anywhere. */
function catchUp(since) {
  const me = profile().memberId;
  const missed = pod.messages.filter((m) => m.ts > since && m.memberId !== me);
  if (!since || missed.length < 3) return null;
  const people = missed.filter(isPerson);
  const names = new Set(people.map((m) => m.name));
  const favours = missed.filter((m) => m.kind === "favour").length;
  const chotu = missed.filter((m) => m.memberId === "chotu").at(-1);
  const lines = [
    `${people.length} message${people.length === 1 ? "" : "s"} from ${names.size} ${names.size === 1 ? "person" : "people"} since you were last here.`,
    favours ? `${favours} ${favours === 1 ? "person asked" : "people asked"} for a favour. Maybe you can help.` : pod.goal ? `Pod goal: ${pod.goal.done} of ${pod.goal.target}.` : "No favours asked.",
    chotu ? `Chotu's last note: ${chotu.text.slice(0, 90)}${chotu.text.length > 90 ? "…" : ""}` : "Nothing from Chotu.",
  ];
  return h("details.card.soft", h("summary", h("strong", "Catch me up")), lines.map((l) => h("p.small", { style: { margin: "4px 0" } }, l)));
}

let podRedraw = () => {};
function viewPod() {
  if (resultMode() && !store.get("podInResult")) {
    return h("div.col", h("h1", "Your pod"), h("div.card.soft", h("p", "It's a result week. Your pod is here, with no wins posts and no Chotu prompts until it's over."),
      h("button", { onclick: () => { store.set("podInResult", true); render(); } }, "Open the pod")));
  }
  podConnect();
  const box = h("div");
  const input = h("input", { type: "text", maxLength: 1000, placeholder: "Write to your pod · type @Chotu to ask Chotu" });
  const send = (kind) => {
    const t = input.value.trim(); if (!t || !pod.ws) return;
    // The on-device check runs first; the server checks again, and @Chotu never sees a message that matched.
    if (distress(t)) pod.care = true;
    if (kind === "offer") award("explained");
    pod.ws.send(JSON.stringify({ type: "say", text: t, kind, clientId: randomId() })); input.value = "";
  };
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") send("chat"); });
  const since = store.get("podSeen", 0);
  const ask = profileAsk("pod"); // made once, so redraws keep what you picked
  cleanup.push(() => { store.set("podSeen", Date.now()); podRedraw = () => {}; });
  podRedraw = () => {
    const me = profile().memberId;
    const inFocus = focus.active && focus.active.kind !== "break";
    const choice = pod.priv.filter((m) => m.memberId === "choice").at(-1);
    const moved = store.get("podMovedNote");
    const privNotes = pod.priv.filter((m) => m.memberId !== "choice" && m.memberId !== "compare" && !/\(pod helper\)$/.test(m.name));
    put(box,
      podHeader(),
      moved && h("div.card.soft", h("div.row.between", h("span", moved), h("button.ghost.small", { onclick: () => { store.del("podMovedNote"); podRedraw(); } }, "OK"))),
      choice && !store.get("choiceDone:" + choice.id) && h("div.card.soft",
        h("p", choice.text), h("p.small.muted", "Only you see this. Nobody is moved without choosing."),
        h("div.row", h("button", { onclick: () => podChoose("stay", choice.id) }, "Stay"), h("button", { onclick: () => podChoose("move", choice.id) }, "Move to a more active pod"))),
      h("p.small.muted", pod.status === "online" ? (pod.online.length > 1 ? `${pod.online.length} in the pod now` : "Only you here right now") : pod.status === "connecting" ? "Connecting…" : pod.error ?? "Offline"),
      pod.care && careBox(),
      ask,
      inFocus && h("div.card.soft", "You're in a focus block. The pod will be here when it ends."),
      !inFocus && [
        goalBar(),
        catchUp(since),
        quizCard(),
        answerHourCard(),
        helperNotes(),
        h("div.card.chat", { style: { maxHeight: "55vh", overflowY: "auto" } },
          pod.messages.length === 0 && h("p.muted", "No messages yet. Say hello."),
          pod.messages.map((m) => h("div.msg" + (m.memberId === "chotu" || isFriend(m) ? ".chotu" : ""),
            h("div.row.small", m.memberId === "chotu" ? chotuLabel(null, 20) : isFriend(m) ? friendLabel(m) : h("span.who", m.name),
              m.kind === "favour" && h("span.tag", "Favour"), m.kind === "offer" && h("span.tag", "Offer"), m.kind === "answer" && h("span.tag", "Answer"),
              h("span.muted", new Date(m.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })),
              isPerson(m) && m.memberId !== me && h("button.ghost.small", { title: "Say thanks", "aria-label": "Say thanks", onclick: () => pod.ws?.send(JSON.stringify({ type: "thanks", id: m.id })) }, "🙏"),
              isPerson(m) && m.memberId !== me && h("button.ghost.small", { onclick: () => { pod.ws?.send(JSON.stringify({ type: "report", id: m.id, reason: "Reported from the web" })); alert("Thanks. A moderator will look at it."); } }, "Report")),
            h("div", m.text)))),
        h("div.row", h("div.grow", input), h("button.primary", { onclick: () => send("chat") }, "Send")),
        h("div.row", { style: { marginTop: "8px" } },
          h("button", { onclick: () => pod.ws?.send(JSON.stringify({ type: "chai_ping" })) }, "☕ Chai ping"),
          h("button", { onclick: () => send("favour") }, "Ask a favour"), h("button", { onclick: () => send("offer") }, "Offer help"),
          pod.room ? h("button", { onclick: () => pod.ws?.send(JSON.stringify({ type: "room_join" })) }, `Join the ${pod.room.minutes}-min study room`)
            : h("button", { onclick: () => pod.ws?.send(JSON.stringify({ type: "room_start", minutes: 25 })) }, "Start a 25-min study room")),
        pod.messages.some(isFriend) && h("details", { style: { marginTop: "12px" } }, h("summary", "Who are Meera, Arjun, Ira and Kabir?"),
          h("p.small", "They're Chotu's AI study friends, there so a new pod never feels empty. Every one of them is marked AI. They aren't members and are never counted, they never message anyone privately, and they go quiet as more people join."),
          Object.entries(FRIENDS).map(([id, f]) => h("div.row.small", friendLabel({ memberId: id, name: id.slice(7)[0].toUpperCase() + id.slice(8) + " · AI" }, 18), h("span.muted", f.bio)))),
        helperCard(),
        h("details", { style: { marginTop: "12px" } }, h("summary", "Run a ritual this week"),
          h("p.small.muted", "If someone in the pod runs it, Chotu stays out of it."),
          h("div.row", [["answer_hour", "Answer hour"], ["quiz", "Quiz Night"], ["wins", "Sunday wins"]].map(([k, l]) =>
            h("button", { disabled: pod.claims.includes(k), onclick: () => { pod.ws?.send(JSON.stringify({ type: "claim", ritual: k })); pod.claims = [...pod.claims, k]; if (k === "answer_hour") award("reviewer"); M.ritualOnce(k); podRedraw(); } }, pod.claims.includes(k) ? `${l}: taken` : `I'll run ${l}`)))),
        pod.lead && !pod.youAreLead && h("details", { style: { marginTop: "12px" } }, h("summary", `Ask ${pod.lead} (pod lead) privately`),
          privNotes.map((m) => h("div.msg", h("span.who", m.name + ": "), m.text)),
          leadAsk()),
        pod.youAreLead && privNotes.length > 0 && h("details", { style: { marginTop: "12px" } }, h("summary", "Private notes to you as pod lead"),
          privNotes.map((m) => h("div.msg", h("span.who", m.name + ": "), m.text, m.memberId !== me && h("button.ghost.small", { onclick: () => { const t = prompt(`Reply privately to ${m.name}`); if (t?.trim()) pod.ws?.send(JSON.stringify({ type: "lead_reply", to: m.memberId, text: t.trim() })); } }, "Reply")))),
      ],
    );
  };
  podRedraw();
  return h("div.col", h("div.row.between", h("h1", "Your pod"), h("a.btn", { href: "#rooms" }, "Open rooms →")), box);
}
function leadAsk() {
  const t = h("input", { type: "text", maxLength: 1000, placeholder: "Only the pod lead sees this" });
  return h("div.row", h("div.grow", t), h("button", { onclick: () => { if (!t.value.trim()) return; if (distress(t.value)) pod.care = true; pod.ws?.send(JSON.stringify({ type: "ask_lead", text: t.value.trim() })); t.value = ""; } }, "Send"));
}

// --- Pods v2: Answer hour pair comparison, the monthly helper, and joining a quieter pod (teaching plan §8) ----
const podSend = (o) => pod.ws?.send(JSON.stringify(o));

/** Answer hour: write alone first, post it, then say which of two answers is stronger and one reason. */
function answerHourCard() {
  const me = profile().memberId;
  const weekAgo = Date.now() - 7 * 86400_000;
  const answers = pod.messages.filter((m) => m.kind === "answer" && m.ts > weekAgo);
  const notes = pod.priv.filter((m) => m.memberId === "compare");
  const ta = h("textarea", { rows: 6, maxLength: 2500, placeholder: "Your answer, about 150 words. Write it alone first." });
  const p = pod.pair;
  let pick = null;
  const reason = h("input", { type: "text", maxLength: 300, placeholder: "One reason (about the answers, not the people)" });
  return h("details.card", { open: !!p || answers.some((m) => m.memberId !== me) && !pod.compared },
    h("summary", h("strong", "Answer hour"), h("span.small.muted", ` · ${answers.length} answer${answers.length === 1 ? "" : "s"} this week`)),
    pauseLine("pod-alone-first"),
    h("p.small.muted", "Write alone first, then post it. After that, compare two answers from your pod: which is stronger, and one reason. The writers hear your reason privately, never who sent it. Nobody is scored."),
    ta,
    h("div.row", { style: { marginTop: "6px" } },
      h("span.small.muted.grow", "Posted answers are seen by your pod."),
      h("button", { onclick: () => { const t = ta.value.trim(); if (t.split(/\s+/).length < 20) return alert("Write a little more first (at least a few lines)."); if (distress(t)) pod.care = true; podSend({ type: "say", kind: "answer", text: t, clientId: randomId() }); ta.value = ""; award("explained"); } }, "Post my answer")),
    h("hr"),
    !p && h("div.row", h("span.small.grow", pod.compared ? "Thanks. Your reason went to both writers." : "Ready to compare two answers?"),
      h("button", { onclick: () => { pod.compared = false; podSend({ type: "compare_get" }); } }, "Compare two answers")),
    p?.none && h("p.small.muted", "No new pair to compare yet. Once two others have posted this week, there will be."),
    p && !p.none && h("div",
      pauseLine("pod-compare"),
      h("div.grid2", ["a", "b"].map((k, i) => h("label.card.soft", { style: { cursor: "pointer" } },
        h("div.row", h("input", { type: "radio", name: "pick", onchange: () => { pick = k; } }), h("strong", `Answer ${i + 1}`)),
        h("p.small", { style: { whiteSpace: "pre-wrap" } }, p[k].text)))),
      reason,
      h("div.row", { style: { marginTop: "6px" } },
        h("button.ghost", { onclick: () => { pod.pair = null; podRedraw(); } }, "Not now"),
        h("button.primary", { onclick: () => { if (!pick) return alert("Pick the stronger one first."); if (reason.value.trim().length < 3) return alert("Give one reason."); if (distress(reason.value)) pod.care = true; podSend({ type: "compare", a: p.a.id, b: p.b.id, pick, reason: reason.value.trim() }); } }, "Send my reason"))),
    notes.length > 0 && h("div", { style: { marginTop: "10px" } }, h("p.small", h("strong", "What others said about your answers")),
      notes.slice(-5).map((m) => h("p.small", m.text))));
}

/** One volunteer a month opens Answer hour and checks on people who've gone quiet. */
function helperCard() {
  const me = profile().memberId;
  const hp = pod.helper;
  const mine = hp?.memberId === me;
  const q = h("input", { type: "text", maxLength: 600, placeholder: "Today's question (optional)" });
  const note = h("textarea", { rows: 2, maxLength: 300 }, "We missed you at the pod this week. No catching up needed; come to Answer hour when you can.");
  return h("details", { style: { marginTop: "12px" }, open: mine },
    h("summary", hp ? (mine ? "You're the pod helper this month" : `${hp.name} is the pod helper this month`) : "Pod helper: open this month"),
    pauseLine("pod-helper"),
    !hp && [h("p.small.muted", "One member a month opens Answer hour and sends a kind note to anyone who's gone quiet. It's a volunteer role and changes hands each month."),
      h("button", { onclick: () => podSend({ type: "helper_take" }) }, "I'll be the helper this month")],
    hp && !mine && h("p.small.muted", "They open Answer hour and check on anyone who's gone quiet. Next month anyone can take it."),
    mine && [
      h("p.small", h("strong", "Open Answer hour")), h("div.row", h("div.grow", q), h("button", { onclick: () => { podSend({ type: "answer_hour_start", question: q.value.trim() }); q.value = ""; } }, "Open it")),
      h("p.small", { style: { marginTop: "10px" } }, h("strong", "Check on quiet members")),
      h("p.small.muted", "Goes privately to anyone who hasn't posted for a week, once a week at most. The pod doesn't see who."),
      note, h("div.row", h("span.small.muted.grow", pod.missSent == null ? "" : pod.missSent ? `Sent to ${pod.missSent} ${pod.missSent === 1 ? "person" : "people"}.` : "Everyone has posted this week; nobody to send to."),
        h("button", { onclick: () => { if (note.value.trim()) podSend({ type: "miss_you", text: note.value.trim() }); } }, "Send")),
      h("button.ghost.small", { style: { marginTop: "10px" }, onclick: () => { if (confirm("Hand back the helper role for this month?")) podSend({ type: "helper_leave" }); } }, "Hand it back")]);
}

/** A kind note from this month's helper, if you've been away. */
function helperNotes() {
  const notes = pod.priv.filter((m) => /\(pod helper\)$/.test(m.name) && m.memberId !== profile().memberId);
  const last = notes.at(-1);
  if (!last || store.get("helperNoteSeen") === last.id) return null;
  return h("div.card.soft", h("p.small", h("strong", last.name + ": "), last.text), h("div.row", h("span.small.muted.grow", "Only you got this."), h("button.ghost.small", { onclick: () => { store.set("helperNoteSeen", last.id); podRedraw(); } }, "OK")));
}

async function mergeStay(stay) {
  const r = await post("/pods/merge-stay", { memberId: profile().memberId, mergeId: pod.summary.merge.id, stay }).catch(() => null);
  if (r?.ok) { pod.summary = { ...pod.summary, merge: { ...pod.summary.merge, stay } }; store.set("podSummary", pod.summary); }
  podRedraw();
}

async function podChoose(choice, noteId) {
  store.set("choiceDone:" + noteId, true);
  const r = await fetch("/pods/choose", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ memberId: profile().memberId, choice }) }).then((x) => x.json()).catch(() => null);
  if (choice === "move" && r?.podId && r.podId !== pod.podId) podMoved("You moved to a new pod with the same stage and language. Say hi when you like.");
  else podRedraw();
}

/** For Today's 3 and the Adda: one honest line about the pod. */
function podLine() {
  const s = pod.summary;
  const todays = pod.messages.filter((m) => isPerson(m) && localDay(new Date(m.ts)) === today()).length;
  if (s?.sizeState === "forming") return `Your pod: forming, ${s.humans} of ${s.capacity} →`;
  return todays ? `Your pod: ${todays} message${todays === 1 ? "" : "s"} today →` : "Your pod →";
}

// --- Community-first: shared helpers -----------------------------------------------------------

const post = (path, body) => fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })
  .then(async (r) => ({ status: r.status, ...(await r.json().catch(() => ({}))) })).catch(() => ({ status: 0, error: "offline" }));
/**
 * "Request your language": one tap per language, an optional "I'd help translate", nothing else. The server gets a
 * random id made for this purpose (not the member id), so it can count one request per device. Tap again to take it back.
 */
function requestPanel({ lead = "The app is in English, with Hindi where it's ready. Tap the languages you'd like next. We'll build the most-asked first." } = {}) {
  const langs = config.requestable?.length ? config.requestable : REQUESTABLE;
  const mine = () => store.get("langReq", { langs: [], helper: false });
  const device = () => store.get("langReqDevice") ?? (store.set("langReqDevice", randomId()), store.get("langReqDevice"));
  const status = h("p.small", { role: "status", "aria-live": "polite", style: { margin: "4px 0 0", minHeight: "1.5em" } });
  const nameOf = (code) => langs.find((l) => l.code === code)?.name ?? code;
  const send = async (lang, on) => (await post("/languages/request", { device: device(), lang, on, helper: mine().helper })).ok === true;
  loadNoto();
  const chips = h("div.chips", langs.map((l) => h("button.chip", {
    lang: l.code === "hinglish" ? "hi-Latn" : l.code, style: { fontFamily: fontFor(l.code) }, "aria-pressed": String(mine().langs.includes(l.code)),
    "aria-label": `${l.name}${l.native !== l.name ? ", " + l.native : ""}`,
    onclick: async (e) => {
      const btn = e.currentTarget, m = mine(), want = !m.langs.includes(l.code);
      btn.setAttribute("aria-pressed", String(want));
      if (await send(l.code, want)) {
        store.set("langReq", { ...m, langs: want ? [...m.langs, l.code] : m.langs.filter((c) => c !== l.code) });
        put(status, want ? `Counted: ${l.name}. Thank you.` : `Taken back: ${l.name}.`);
      } else { btn.setAttribute("aria-pressed", String(!want)); put(status, "Couldn't reach the server. Try again in a bit."); }
    },
  }, l.native === l.name ? l.name : `${l.native} · ${l.name}`)));
  const helper = h("input", { type: "checkbox", checked: mine().helper, onchange: async (e) => {
    store.set("langReq", { ...mine(), helper: e.target.checked });
    const picked = mine().langs;
    const ok = (await Promise.all(picked.map((c) => send(c, true)))).every(Boolean);
    put(status, !picked.length ? "Noted. Pick a language above too." : ok ? (e.target.checked ? `Thank you. We'll count you as a helper for ${picked.map(nameOf).join(", ")}.` : "Okay, not as a helper.") : "Couldn't reach the server. Try again in a bit.");
  } });
  return h("section.card.lang-req", { "aria-labelledby": "langReqTitle" },
    h("h2", { id: "langReqTitle", style: { marginTop: 0 } }, "Request your language"),
    h("p.small", { style: { margin: 0 } }, lead),
    chips,
    h("label.small", helper, " I'd help translate or check translations"),
    status,
    h("p.small.muted", { style: { margin: "6px 0 0" } }, "We count one tap per language from this device. No name, no account, no phone number. Tap again to take it back."));
}

/** Remembered for 24 hours so no offer ever shows on a hard day. */
const noteCare = () => store.set("careAt", Date.now());
const careRecently = () => Date.now() - (store.get("careAt") ?? 0) < 86400_000;
const memberLang = () => P.value("lang") ?? POD_LANG[lang()] ?? "english";

/** A one-tap rating after a key moment, as a small sheet at the bottom. At most one a day (metrics.js decides). */
function rateAfter(moment, delayMs = 1200) {
  setTimeout(() => {
    if (document.querySelector(".ratesheet") || resultMode()) return;
    const c = M.ratingCard(h, moment);
    if (!c) return;
    c.classList.add("ratesheet");
    document.body.append(c);
    setTimeout(() => c.remove(), 25_000);
  }, delayMs);
}
function toast(text) {
  const t = h("div.toast", { role: "status" }, text);
  document.body.append(t);
  setTimeout(() => t.remove(), 3500);
}

// --- Stamp book --------------------------------------------------------------------------------
// Stamps mark things you did. None can be lost, none are counted against anyone, and there's no total.

const STAMP_FAMILIES = [["showing", "Showing up"], ["helping", "Helping"], ["mastery", "Mastery"], ["pod", "Pod"], ["roles", "Roles"]];
const STAMPS = {
  first_close: ["showing", "First day closed", "You closed a day for the first time."],
  rhythm4: ["showing", "Four-week rhythm", "You closed at least one day in each of four weeks. Not in a row, just there."],
  came_back: ["showing", "Came back", "You came back after a week or more away. That's the hard part."],
  first_thanks: ["helping", "First 🙏", "Someone in your pod thanked you."],
  explained: ["helping", "Offered help", "You offered to help someone in your pod."],
  welcomed: ["helping", "Welcomed someone", "You said hello when someone new joined."],
  reviewer: ["helping", "Answer hour host", "You offered to run an answer hour."],
  pod_week: ["pod", "First pod week", "A full week in a pod."],
  quiz_night: ["pod", "Quiz Night", "You played a Pod Quiz Night."],
  lead: ["roles", "Pod lead", "You lead a pod."],
};
const stampInfo = (id) => id.startsWith("mastery:") ? ["mastery", `${id.slice(8)}`, "80% or more in three practice sessions, on three different days."] : STAMPS[id];
const stamps = () => store.get("stamps", {});
function award(id) {
  const s = stamps();
  if (s[id] || !stampInfo(id)) return;
  s[id] = today(); store.set("stamps", s);
  toast(`New stamp: ${stampInfo(id)[1]}`);
}

/** Days you closed. Read from this browser only. */
function closedDays() {
  const out = new Set([...mem.keys()].filter((k) => k.startsWith("closed:")).map((k) => k.slice(7)));
  try { Object.keys(localStorage).filter((k) => k.startsWith("upsc:closed:")).forEach((k) => out.add(k.slice(12))); } catch {}
  return [...out].sort();
}
const mondayOf = (day) => { const d = new Date(day + "T12:00"); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return localDay(d); };

/** Days since this device last opened the app, read once at start (before checkStamps moves lastOpen to today). */
const gapAtOpen = (() => { const last = store.get("lastOpen"); return last ? Math.round((new Date(today() + "T12:00") - new Date(last + "T12:00")) / 864e5) : 0; })();

/** Stamps that come from what's already on this device, checked once per open. */
function checkStamps() {
  const last = store.get("lastOpen");
  if (last && last <= addDays(today(), -7)) award("came_back");
  store.set("lastOpen", today());
  const weeks = new Set(closedDays().map(mondayOf));
  if (weeks.size >= 4) award("rhythm4");
  const joined = store.get("podJoinedOn");
  if (joined && joined <= addDays(today(), -7)) award("pod_week");
}

/** Rhythm: which days you closed, week by week. Dots, never a count of days in a row. */
function rhythmDots(compact = false) {
  const closed = new Set(closedDays());
  const weeks = compact ? 4 : 8, start = addDays(mondayOf(today()), -7 * (weeks - 1));
  return h("div.rhythm", { role: "img", "aria-label": `Days you closed in the last ${weeks} weeks` },
    Array.from({ length: weeks }, (_, w) => h("div.week",
      Array.from({ length: 7 }, (_, d) => { const day = addDays(start, w * 7 + d); return h("i" + (closed.has(day) ? ".on" : "") + (day > today() ? ".future" : ""), { title: day }); }))),
    h("p.small.muted", { style: { margin: "6px 0 0" } }, "Each column is a week. Gaps are normal; this isn't a streak."));
}

// --- Practice → season, mastery and what the app guesses about you ----------------------------------

function practiceFinished(set, results) {
  if (results.length) post("/season/add", { n: results.length });
  const day = today();
  const byTopic = {};
  for (const r of results) { const t = (byTopic[r.topic || "Other"] ??= { right: 0, n: 0 }); t.n++; if (r.ok) t.right++; }
  const log = store.get("topicLog", []);
  for (const [topic, t] of Object.entries(byTopic)) log.push({ topic, day, pct: Math.round((t.right / t.n) * 100), n: t.n });
  store.set("topicLog", log.slice(-400));
  // Mastery: 80% or more in three sessions on three different days.
  for (const topic of Object.keys(byTopic)) {
    const days = new Set(log.filter((x) => x.topic === topic && x.pct >= 80).map((x) => x.day));
    if (days.size >= 3) award("mastery:" + topic);
  }
  inferProfile();
}

/** Guesses from practice and focus, labelled as guesses. Never overwrites what you told us, never leaves the device. */
function inferProfile() {
  const log = store.get("topicLog", []).slice(-120);
  const agg = {};
  for (const x of log) { const a = (agg[x.topic] ??= { pct: 0, n: 0 }); a.pct += x.pct; a.n++; }
  const ranked = Object.entries(agg).filter(([, a]) => a.n >= 2).map(([t, a]) => [t, a.pct / a.n]).sort((a, b) => a[1] - b[1]);
  if (ranked.length >= 2) {
    P.setField("weak_subject", ranked[0][0], "inferred", 0.6);
    P.setField("strong_subject", ranked.at(-1)[0], "inferred", 0.6);
  }
  const flog = store.get("focusLog", []).filter((x) => x.day >= addDays(today(), -14));
  if (flog.length >= 3) {
    const days = new Set(flog.map((x) => x.day)).size;
    P.setField("avg_study_minutes", Math.round(flog.reduce((n, x) => n + x.minutes, 0) / Math.max(1, days)), "inferred", 0.5);
    const hours = flog.filter((x) => x.hour != null).map((x) => x.hour);
    if (hours.length >= 3) {
      const count = {}; hours.forEach((x) => (count[x] = (count[x] ?? 0) + 1));
      P.setField("best_hour", Number(Object.entries(count).sort((a, b) => b[1] - a[1])[0][0]), "inferred", 0.5);
    }
  }
}

// --- Staged profile: one question a day, at a moment it helps --------------------------------------

const PQ = {
  stage: { q: "Where are you in the journey?", opts: [["starting", "Just starting"], ["prelims", "Preparing for Prelims"], ["mains", "Cleared Prelims, on Mains"], ["interview", "Interview stage"], ["repeat", "Taking another attempt"]] },
  attempt_band: { q: "How many attempts so far, including this one?", opts: [["1", "This is my first"], ["2-3", "2 or 3"], ["4+", "4 or more"]] },
  time_band: { q: "When do you usually study?", opts: [["morning", "Morning"], ["afternoon", "Afternoon"], ["evening", "Evening"], ["night", "Night"]] },
  target_year: { q: "Which year's exam are you aiming for?", opts: () => { const y = new Date().getFullYear(); return [[String(y + 1), String(y + 1)], [String(y + 2), String(y + 2)], [String(y + 3), String(y + 3)], ["unsure", "Not sure yet"]]; } },
  medium: { q: "Which medium will you write Mains in?", opts: [["english", "English"], ["hindi", "Hindi"], ["other", "Another language"]] },
  working: { q: "Are you working while you prepare?", opts: [["no", "Full-time on prep"], ["yes", "Working too"], ["student", "Still in college"]] },
  optional_subject: { q: "Which optional subject have you picked?", text: "For example: Sociology" },
  stop_attempt: { q: "When would you like to look at this again?", opts: [["year", "In a year"], ["after_next", "After the next attempt"], ["undecided", "Haven't decided"]], note: "Only you see this. Nothing here tells you to stop or continue." },
  main_goal: { q: "What do you most want from this year, apart from the result?", text: "For example: finish the GS syllabus once" },
  hardest_part: { q: "What's the hardest part right now?", opts: [["consistency", "Staying consistent"], ["syllabus", "Too much syllabus"], ["money", "Money"], ["alone", "Feeling alone"], ["family", "Family pressure"], ["focus", "Focus"]] },
};
const FIELD_LABEL = { lang: "Pod language", stage: "Stage", attempt_band: "Attempts", time_band: "Study time", target_year: "Target year", medium: "Mains medium", working: "Working", optional_subject: "Optional subject",
  stop_attempt: "When to look again", main_goal: "This year's goal", hardest_part: "Hardest part", weak_subject: "Subject to work on", strong_subject: "Strongest subject", avg_study_minutes: "Average focused minutes a day", best_hour: "Hour you focus best" };
const SYNCED = ["stage", "attempt_band", "lang", "time_band"];
const ASK_IN = { pod: ["stage", "attempt_band", "time_band"], today: ["target_year", "medium", "working"], mains: ["optional_subject"], compass: ["stop_attempt"], plan: ["main_goal", "hardest_part"] };

/** The four matching fields, the only profile data the server gets. */
const syncProfile = () => post("/members/profile", { memberId: profile().memberId, ...P.syncedFields() });

function profileAsk(context) {
  if (!profile() || paused() || resultMode() || careRecently()) return null;
  if (context === "today" && profile().createdOn < addDays(today(), -7)) return null;
  const asked = store.get("askedOn");
  const fieldsHere = ASK_IN[context].filter((f) => P.askable(f));
  if (!fieldsHere.length) return null;
  // One question a day. The pod card asks its three matching questions together, as one.
  const pick = context === "pod" ? fieldsHere : [fieldsHere[0]];
  if (asked?.day === today() && asked.key !== context + ":" + pick.join(",")) return null;
  store.set("askedOn", { day: today(), key: context + ":" + pick.join(",") });
  const card = h("div.card.soft.ask");
  const answers = {};
  const done = (skip) => {
    for (const f of pick) skip || answers[f] == null ? P.skipField(f) : P.setField(f, answers[f], "asked");
    if (!skip && pick.some((f) => SYNCED.includes(f))) syncProfile();
    put(card, h("p.small", skip ? "No problem. We won't ask again for a while." : "Saved. You can see and delete it in Me → Profile."));
  };
  put(card,
    pick.map((f) => {
      const q = PQ[f], opts = typeof q.opts === "function" ? q.opts() : q.opts;
      return h("div", { style: { marginBottom: "10px" } }, h("strong", q.q),
        opts ? h("div.chips", opts.map(([v, l]) => { const b = h("button.chip", { "aria-pressed": "false", onclick: () => { answers[f] = v; b.parentElement.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); if (pick.length === 1) done(false); } }, l); return b; }))
          : h("input", { type: "text", maxLength: 80, placeholder: q.text, oninput: (e) => (answers[f] = e.target.value.trim() || null) }),
        q.note && h("p.small.muted", q.note));
    }),
    h("p.small.muted", pick.some((f) => SYNCED.includes(f)) ? "Why: to match you with a pod like you. These go to the server for matching only." : "Why: so suggestions fit you. This stays on this device."),
    h("div.row", (pick.length > 1 || !PQ[pick[0]].opts) && h("button", { onclick: () => done(false) }, "Save"), h("button.ghost", { onclick: () => done(true) }, "Skip")));
  return card;
}

// --- Plus: value cards only on Prep, test mode only -------------------------------------------------

/** A Plus card for a listed moment. Only ever called from Prep screens; the server checks the rules again. */
function plusCard(moment) {
  if (!plusOn() || paused() || resultMode() || careRecently()) return null;
  const box = h("div");
  const now = new Date();
  post("/plus/offer", { memberId: profile().memberId, surface: "prep", moment, context: { localTime: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`, resultWithin72h: !!resultMode(), distress: careRecently(), paused: paused() } })
    .then((r) => {
      if (!r.offer) return;
      post("/plus/impression", { surface: "prep", moment });
      const act = (action) => { post("/plus/impression", { surface: "prep", moment, action }); if (action === "accepted") location.hash = "#upgrade"; else box.remove(); };
      put(box, h("div.card.plus-card", h("div.row.between", h("strong", r.offer.title), h("span.tag", "TEST MODE")), h("p", r.offer.body),
        h("div.row.equal", h("button", { onclick: () => act("accepted") }, r.offer.cta), h("button", { onclick: () => act("not_now") }, r.offer.notNow))));
    });
  return box;
}

// --- Adda ----------------------------------------------------------------------------------------

function hostLine() {
  const hr = new Date().getHours(), d = new Date().getDay();
  if (hr >= 23 || hr < 6) return "It's late. If you're still up, keep it gentle: Calm is one tap away, and tomorrow's fine.";
  const day = ["Sunday's wins thread: one thing that went okay counts.", "New week. Your pod's goal is up.", "Tuesday. One small thing is enough today.", "Answer hour is today at 7. Bring one answer.",
    "Thursday. A good day to revise what came back.", "Pod Quiz Night tonight. Five questions, one shared score.", "Answer hour again today at 7."][d];
  return (hr < 12 ? "Morning. Chai's ready. " : hr < 18 ? "" : "Evening. ") + day;
}

function viewAdda() {
  const rm = resultMode();
  if (rm) return h("div.col", h("h1", "The Adda"),
    h("div.card.soft", h("div.center", kulhad("quiet", 72)),
      h("p", "Whatever happened, you're more than a roll number."),
      h("p.small.muted", rm.label ?? "It's a result week. No wins posts, no offers, and Chotu stays quiet."),
      h("div.row", h("a.btn", { href: "#calm" }, tr("nav.calm")), h("a.btn", { href: "#talk" }, tr("nav.talk")), h("a.btn", { href: "#pod" }, "Your pod")),
      rm.mine && h("p.small", h("button.ghost.small", { onclick: () => { store.del("resultMode"); render(); } }, "Switch off result-day mode"))));
  podPeek();
  const commons = h("p.small.muted", "Checking who's in…"), season = h("div");
  getJson("/commons", "commons").then((c) => put(commons, c?.label ?? "The Commons is open."));
  getJson("/season", "season").then((s) => {
    if (!s) return;
    const pct = Math.min(100, (s.done / Math.max(1, s.goal)) * 100);
    put(season, h("div.row.between", h("strong", s.title), h("span.small.muted", `${s.done.toLocaleString("en-IN")} of ${s.goal.toLocaleString("en-IN")} ${s.unit}`)),
      h("div.bar", { role: "img", "aria-label": `Season ${Math.round(pct)} percent` }, h("i", { style: { width: Math.max(pct, 0.5) + "%" } })),
      h("p.small.muted", { style: { margin: "6px 0 0" } }, "Everyone's practice questions, added together. No ranks, just one counter."));
  });
  const th = HT.thinkerOfWeek();
  const g = greetingOfTheDay();
  return h("div.col",
    // A different one of the eleven greetings each day (needs native-speaker check, see welcome.js).
    h("p.small.muted.daily-hello", h("span.word", { lang: g.tag, style: { fontFamily: fontFor(g.code) } }, g.word), ` · ${g.name}. `,
      h("a", { href: "#me", onclick: () => setTimeout(() => document.getElementById("lang-request")?.scrollIntoView(), 50) }, "Want the app in your language?")),
    h("h1", greeting()),
    h("div.card.host", h("div.row", chotuLabel(null, 36), h("p.grow", { style: { margin: 0 } }, hostLine()))),
    M.checkinCard(h, profile()?.createdOn),
    rapCard(),
    h("a.card.link", { href: "#pod" }, h("div.row.between", h("strong", "Your pod"), h("span", "→")), h("p.small", { style: { margin: "4px 0" } }, pod.summary ? podLine().replace(" →", "") : "Not in a pod yet. Open it to join 6 to 8 people at your stage, in your language."), goalBar(true)),
    h("a.card.link", { href: "#commons" }, h("div.row.between", h("strong", "The Commons"), h("span", "→")), commons),
    h("div.card", season),
    h("a.card.link", { href: "#today" }, h("div.row.between", h("div", h("strong", "Today's 3"), h("div.small.muted", "Prep: Chai, practice and an answer. Small is fine.")), h("span", "→"))),
    h("div.card", h("div.row.between", h("strong", "Free Shelf"), h("a.small", { href: "#shelf" }, "All tools →")),
      h("p.small.muted", "Free, no card needed. Honest numbers and maps, no sign-up required."),
      h("div.chips", [["#compass", "Attempt Compass"], ["#cost", "Cost of a Year"], ["#maps", "5-source maps"], ["#routine", "Routine builder"]].map(([href, l]) => h("a.chip", { href }, l)))),
    h("a.card.link", { href: "#thinker" }, h("div.small.muted", "Thinker of the week"), h("strong", th.name), h("p.small", { style: { margin: "4px 0 0" } }, th.idea)),
  );
}
/**
 * "Watch in your language": the Akela Nahi rap in the member's language (see videos.js). Never autoplays; on
 * mobile data nothing loads until play. Lyrics are on screen in the video. They still need a native-speaker check.
 */
function rapCard() {
  const pick = rapLangFor(memberLang(), store.get("langReq", { langs: [] }).langs);
  let code = store.get("rapLang") ?? pick.have;
  const box = h("div");
  const draw = () => {
    const v = RAP_VIDEOS.find((x) => x.code === code) ?? RAP_VIDEOS[0];
    const metered = onMeteredData();
    const missing = !store.get("rapLang") && pick.want !== pick.have ? REQUESTABLE.find((r) => r.code === pick.want)?.name : null;
    put(box,
      h("video", { src: `/videos/${v.file}`, controls: true, playsinline: true, preload: metered ? "none" : "metadata", lang: v.tag,
        "aria-label": `Akela Nahi, a short rap in ${v.name}. The words are on screen.`,
        style: { display: "block", width: "100%", maxWidth: "320px", maxHeight: "60vh", margin: "8px auto", borderRadius: "12px", background: "#000", aspectRatio: "9 / 16" } }),
      h("p.small.muted", `45 seconds. The words are on screen in ${v.name}${v.code === "en" ? "" : ", with an English line"}.` +
        (metered ? " You're on mobile data, so nothing loads until you press play (about 1 MB)." : "")),
      missing && h("p.small.muted", `${missing} isn't ready yet, so this is in ${v.name}.`),
      h("div.chips", RAP_VIDEOS.map((x) => h("button.chip", { "aria-pressed": String(x.code === v.code), lang: x.tag, onclick: () => { code = x.code; store.set("rapLang", code); draw(); } }, x.name))));
  };
  draw();
  return h("div.card", h("strong", "Watch in your language"), h("p.small", { style: { margin: "4px 0 0" } }, "Akela Nahi: nobody preps alone here."), box);
}

/** Fetch the pod summary for the Adda without opening the chat. */
function podPeek() {
  // Day 1: loading the room list puts a new member in their starter rooms.
  if (!rooms.list) roomsLoad();
  if (pod.ws) return;
  post("/pods/me", { memberId: profile().memberId }).then((s) => { if (s.podId) { pod.summary = s; store.set("podSummary", s); } });
}

// --- The Commons: presence only, no chat ---------------------------------------------------------

const commons = { ws: null, room: null, count: 0, ping: null };
function commonsLeave() { clearInterval(commons.ping); commons.ws?.close(); commons.ws = null; commons.room = null; }
function viewCommons(arg) {
  const box = h("div");
  const draw = (c) => put(box,
    h("p.muted", c?.label ?? "Quiet rooms to study in alongside other aspirants. No chat, no names, just company."),
    (c?.rooms ?? []).map((r) => h("div.card", h("div.row.between",
      h("div.grow", h("strong", r.name), h("div.small.muted", r.note), r.count != null && h("div.small", `${r.count} studying`)),
      commons.room === r.id ? h("button", { onclick: () => { commonsLeave(); getJson("/commons").then(draw); } }, "Leave") : h("button.primary", { onclick: () => commonsJoin(r, box) }, "Sit here")))));
  if (arg) { getJson("/commons").then((c) => { const r = c?.rooms?.find((x) => x.id === arg); if (r) commonsJoin(r, box); else draw(c); }); }
  else getJson("/commons", "commons").then(draw);
  return h("div.col", h("h1", "The Commons"), box);
}
function commonsJoin(r, box) {
  commonsLeave();
  const url = new URL(`/commons/${r.id}/ws`, location.href);
  url.protocol = location.protocol === "https:" ? "wss:" : "ws:";
  const ws = new WebSocket(url); commons.ws = ws; commons.room = r.id;
  M.ritualOnce("commons");
  const line = h("p", "Joining…");
  const draw = () => put(line, commons.count >= 10 ? `${commons.count} people studying here` : commons.count > 1 ? "A few people are studying here with you" : "Just you for now. Others drop in through the day.");
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.type === "presence") { commons.count = m.count; draw(); } };
  ws.onopen = () => { commons.ping = setInterval(() => ws.readyState === 1 && ws.send(JSON.stringify({ type: "ping" })), 25_000); ws.send(JSON.stringify({ type: "ping" })); };
  ws.onclose = () => { if (commons.ws === ws) put(line, "You left the room."); };
  put(box, h("div.card.soft.center", h("h2", { style: { marginTop: 0 } }, r.name), h("p.small.muted", r.note), line,
    h("div.row", { style: { justifyContent: "center" } }, h("button.primary", { onclick: () => focus.start(25, r.name, "focus") }, "Start a 25-min focus block"),
      h("button", { onclick: () => { commonsLeave(); location.hash = "#commons"; render(); } }, "Leave"))));
}

// --- Chotu ---------------------------------------------------------------------------------------
// Talk · Prep · Plan. The distress check runs here first, and nothing that matched is sent. Close the Day,
// mood and journal text are never sent; nor are your nickname or stage. Memory notes go only if you turn
// on "Smarter Chotu" in Me → Privacy.

const chotu = { mode: "talk", turns: [], busy: false, care: false, offline: null };
const CHOTU_MODES = [["talk", "Talk"], ["prep", "Prep"], ["plan", "Plan"]];
const CHOTU_HINT = { talk: "Say anything. I'm a good listener.", prep: "Ask about a topic or a Chai card. I can quiz you too.", plan: "Tell me your day and I'll help you pick at most three things." };

function viewChotu() {
  const rm = resultMode();
  if (rm) return h("div.col", h("div.center", kulhad("quiet", 96)), h("p.center", h("span.ai-tag", "Chotu · AI")),
    h("div.card.soft", h("p", "I'm staying quiet this week. Whatever happened, you're more than a roll number."),
      h("div.row", h("a.btn", { href: "#calm" }, tr("nav.calm")), h("a.btn", { href: "#talk" }, tr("nav.talk")))));
  const box = h("div");
  const input = h("textarea", { rows: 2, maxLength: 1500, placeholder: CHOTU_HINT[chotu.mode] });
  const draw = () => {
    const talkTurns = chotu.turns.filter((t) => t.role === "user" && chotu.mode === "talk").length;
    put(box,
      h("div.center", kulhad(toneNow({ care: chotu.care, thinking: chotu.busy }), 72)), h("p.center", h("span.ai-tag", "Chotu · AI")),
      h("div.chips.center", { role: "tablist" }, CHOTU_MODES.map(([m, l]) => h("button.chip", { role: "tab", "aria-pressed": String(chotu.mode === m), onclick: () => { chotu.mode = m; input.placeholder = CHOTU_HINT[m]; draw(); } }, l))),
      chotu.care && careBox(),
      chotu.mode === "plan" && h("a.card.link", { href: "#roadmap" }, h("div.row.between", h("div", h("strong", store.get("roadmap") ? "Your roadmap and this week's plan" : "Build your free roadmap"),
        h("div.small.muted", "Exam year, hours and weak papers in, a one-page plan to Prelims out.")), h("span", "→"))),
      h("div.card.chat",
        chotu.turns.length === 0 && h("p.muted", CHOTU_HINT[chotu.mode]),
        chotu.turns.map((t, i) => h("div.msg" + (t.role === "assistant" ? ".chotu" : ""),
          t.role === "assistant" ? chotuLabel(null, 18) : h("span.who", "You"),
          h("div", t.care ? "(kept on this device)" : t.content),
          t.role === "user" && !t.care && h("button.ghost.small", { onclick: () => rememberNote(t.content) }, "Let Chotu remember this"),
          t.role === "assistant" && h("button.ghost.small", { onclick: () => reportChotu(t) }, t.reported ? "Reported" : "Report"))),
        chotu.busy && h("p.small.muted", "Chotu is thinking…")),
      chotu.offline && h("div.card.soft", chotu.offline),
      chotu.offline && chotu.mode === "prep" && plusCard("chotu_cloud"),
      talkTurns >= 15 && h("div.card.soft", h("p", "We've talked for a while. I'm glad to keep going, and your pod, or someone you trust, would be good company too."),
        h("div.row", h("a.btn", { href: "#pod" }, "Your pod"), h("a.btn", { href: "#talk" }, tr("nav.talk")))),
      h("div.row", h("div.grow", input), h("button.primary", { disabled: chotu.busy, onclick: send }, "Send")),
      h("p.small.muted", "Chotu is an AI. It can be wrong, it doesn't predict ranks or results, and it never sees your journal, mood, nickname or stage."));
  };
  async function send() {
    const text = input.value.trim(); if (!text || chotu.busy) return;
    input.value = "";
    // On-device distress check first. A matching message never leaves this browser.
    if (distress(text)) { chotu.care = true; noteCare(); chotu.turns.push({ role: "user", content: text, care: true }); draw(); return; }
    chotu.turns.push({ role: "user", content: text }); chotu.busy = true; chotu.offline = null; draw();
    const notes = store.get("smarterChotu") ? P.memory().map((m) => "- " + m.text).join("\n") : "";
    const body = { mode: chotu.mode, messages: chotu.turns.filter((t) => !t.care).slice(-8).map(({ role, content }) => ({ role, content })), context: { language: memberLang(), ...(notes ? { notes } : {}) } };
    if (plusOn() && chotu.mode === "prep") body.memberId = profile().memberId;
    const r = await post("/chotu", body);
    chotu.busy = false;
    if (r.care) { chotu.care = true; noteCare(); }
    else if (r.reply) {
      chotu.turns.push({ role: "assistant", content: r.reply, id: randomId() });
      // Only that a chat happened, never what was said.
      if (chotu.turns.filter((t) => t.role === "assistant").length === 1) M.track("chotu_chat");
      if (chotu.turns.filter((t) => t.role === "assistant").length === 3) rateAfter("chotu_chat", 4000);
    }
    else chotu.offline = r.error ?? "Chotu couldn't answer just now. Try again in a minute.";
    draw();
  }
  input.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } });
  draw();
  return h("div.col", box);
}
/** Reports one Chotu reply to the safety queue: its id, your reason and that reply only, never the chat. */
function reportChotu(t) {
  if (t.reported) return;
  const reason = prompt("What's wrong with this reply? (for example: wrong facts, unsafe, rude)");
  if (reason == null) return;
  post("/chotu/report", { messageId: t.id, reason: reason.trim().slice(0, 300) || "Reported", text: t.content }).then((r) => {
    t.reported = r.status === 200; toast(t.reported ? "Thanks. A moderator will look at it." : "Couldn't send the report. Try again when online.");
  });
}
/** Chotu keeps a note only when you approve its exact words. Up to 10; see and delete them in Me → Profile. */
function rememberNote(text) {
  if (P.memory().length >= P.MEMORY_MAX) { alert("Chotu already keeps 10 notes. Delete one in Me → Profile first."); return; }
  const t = prompt("Chotu will keep this note on this device (edit it first if you like):", text.slice(0, 140));
  if (t?.trim() && P.addMemory(t)) toast("Saved. Chotu uses notes only if Smarter Chotu is on (Me → Privacy).");
}

// --- Me --------------------------------------------------------------------------------------------

let installPrompt = null;
window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); installPrompt = e; });

function viewMe() {
  const p = profile();
  const name = h("input", { type: "text", value: p.name, maxLength: 40 });
  const standalone = matchMedia("(display-mode: standalone)").matches;
  const s = stamps();
  const link = (href, title, sub) => h("a.card.link", { href }, h("div.row.between", h("div", h("strong", title), sub && h("div.small.muted", sub)), h("span", "→")));
  return h("div.col", h("h1", p.name),
    h("div.card.row.between", h("div", h("strong", "Appearance"), h("div.small.muted", { "aria-live": "polite" }, darkNow() ? "Dark mode is on" : "Light mode is on")), themeButton()),
    link("#profile", "Profile", "What the app knows about you, where it's kept, and how to delete it"),
    link("#room", "Your room", "Sleep, notes, to-dos and your journal. Private, never scored, yours to download"),
    link("#rhythm", "Rhythm", "The days you closed. No streaks."),
    link("#stamps", "Stamp book", `${Object.keys(s).length ? Object.keys(s).length + (Object.keys(s).length === 1 ? " stamp" : " stamps") + " so far" : "Stamps for showing up, helping and more"}. None can be lost.`),
    link("#privacy", "Privacy", "Pause, Smarter Chotu, result-day mode, download or delete"),
    plusOn() && link("#plus", "Plus (test mode)", "Everything in the Adda, Pod and Chotu stays free"),
    link("#upgrade", "Plus", "Every mock, mock insights, the weekly test and revise my misses. Try them before deciding"),
    link("#routine", tr("routine.title"), tr("routine.lead")),
    !Auth.optional() && h("div.card", h("h3", { style: { marginTop: 0 } }, "Account"),
      h("p", Auth.session()?.email ? ["Signed in as ", h("strong", Auth.session().email)] : (Auth.session()?.label ?? "Signed in")),
      h("p.small.muted", Auth.session()?.provider === "password" ? "Only you see this. Your pod sees your nickname, never your username." : "Only you see this. Your pod sees your nickname, never your email."),
      Auth.session()?.provider === "password" ? h("details", h("summary", "Change password"), newPasswordForm(false)) : null,
      Auth.session()?.provider === "password" && Auth.recoveryOn() ? h("details", h("summary", "Recovery email"), recoveryEmailForm()) : null,
      h("div.row", h("button", { onclick: async () => { if (!confirm("Sign out? Everything saved in this browser stays here; sign in again to use your pod and Chotu.")) return; pod.ws?.close(); commonsLeave(); await Auth.signOut(); location.hash = "#adda"; render(); } }, "Sign out"),
        h("button", { onclick: deleteData }, "Delete my account"))),
    h("div.card", h("h3", { style: { marginTop: 0 } }, tr("path.name")), name,
      h("h3", tr("lang.label")),
      langPicker(lang, (v) => { store.set("profile", { ...profile(), lang: v }); P.setField("lang", POD_LANG[v] ?? "english", "asked"); syncProfile(); render(); }),
      h("p.small.muted", tr("lang.note")),
      h("div", { style: { marginTop: "12px" } }, h("button", { onclick: () => { store.set("profile", { ...profile(), name: name.value.trim() || p.name }); render(); } }, tr("save")))),
    h("div", { id: "lang-request" }, requestPanel()),
    h("div.card", h("h3", { style: { marginTop: 0 } }, "Desktop app"),
      standalone ? h("p", "✓ You're using the desktop app.")
        : installPrompt ? h("div", h("p", "Install Aspiran as an app on this computer. It opens in its own window and works offline."), h("button.primary", { onclick: async () => { installPrompt.prompt(); await installPrompt.userChoice; installPrompt = null; render(); } }, "Install the desktop app"))
          : h("p", "In Chrome or Edge, use the install icon in the address bar (or menu → Apps → Install Aspiran). It opens in its own window and works offline.")),
    h("div.card", h("h3", { style: { marginTop: 0 } }, "Data saver"),
      h("label", h("input", { type: "checkbox", checked: !!store.get("dataSaver"), onchange: (e) => store.set("dataSaver", e.target.checked) }), " Skip drawings on cards")),
    appearanceCard());
}

function viewProfile() {
  const SOURCE = { asked: "You told us", inferred: "Guessed from your practice and focus", imported: "Imported" };
  const rows = P.fields().filter((f) => !f.skipped).sort((a, b) => (SYNCED.includes(b.field) - SYNCED.includes(a.field)));
  const notes = P.memory();
  const del = (f) => { P.deleteField(f); if (SYNCED.includes(f)) post("/members/profile", { memberId: profile().memberId, clear: [f] }); render(); };
  return h("div.col", h("h1", "Profile"),
    h("p.muted", "Everything here is kept in this browser. Only stage, attempts, language and study time go to the server, and only to match you with a pod."),
    h("div.card",
      rows.length === 0 && h("p.muted", "Nothing yet. The app asks one small question at a time, only when it helps."),
      rows.map((f) => h("div.task",
        h("div.grow", h("div", h("strong", FIELD_LABEL[f.field] ?? f.field), ": ", PQ[f.field]?.opts ? ((typeof PQ[f.field].opts === "function" ? PQ[f.field].opts() : PQ[f.field].opts).find(([v]) => v === f.value)?.[1] ?? f.value) : String(f.value)),
          h("div.small.muted", `${SOURCE[f.source] ?? f.source}${f.source === "inferred" ? " (a guess)" : ""} · ${SYNCED.includes(f.field) ? "This device, and the server for pod matching" : "This device only"}`)),
        h("button.ghost.small", { onclick: () => del(f.field) }, "Delete")))),
    h("h2", "Chotu's notes"),
    h("div.card",
      h("p.small.muted", `Up to ${P.MEMORY_MAX} notes you approved. Chotu sees them only if Smarter Chotu is on in Privacy (it's ${store.get("smarterChotu") ? "on" : "off"}).`),
      notes.length === 0 && h("p.muted", "No notes. In Chotu, tap “Let Chotu remember this” under something you said."),
      notes.map((n) => h("div.task", h("div.grow", n.text), h("button.ghost.small", { onclick: () => { P.deleteMemory(n.id); render(); } }, "Delete")))),
    h("p.small.muted", "Deleting something here means the app forgets it, including that it ever asked."));
}

// --- Your room (teaching plan, step 4) ---------------------------------------------------------------
// Sleep, notes, to-dos and the journal. Private: nothing here goes to the pod, to marketing or to an AI, and nothing
// is scored. Sleep never gets a streak or a comparison; after three weeks it shows your own review accuracy by sleep.

const SLEEP_H = [[5, "5 or less"], [6, "About 6"], [7, "About 7"], [8, "8 or more"]];
const SLEEP_FELT = [["rested", "Rested"], ["okay", "Okay"], ["tired", "Tired"]];
const roomNotes = () => store.get("roomNotes", []);
const roomTodos = () => store.get("todos", []);
const nodeMatch = (text) => {
  const words = text.toLowerCase().match(/[a-z]{5,}/g)?.filter((w) => !["revise", "revision", "chapter", "notes", "today", "finish", "write", "about", "practice"].includes(w)) ?? [];
  return words.length ? SY.NODES.find((nd) => words.some((w) => nd.name.toLowerCase().includes(w))) ?? null : null;
};
function roomNotesFor(nodeId) {
  const mine = roomNotes().filter((n) => n.node === nodeId);
  return mine.length > 0 && h("details.card", { open: true }, h("summary", `Your notes on this (${mine.length})`),
    mine.slice(-5).map((n) => h("p", { style: { whiteSpace: "pre-wrap" } }, n.text)));
}
function sleepInsight() {
  const sl = store.get("sleep", {}), rd = store.get("rightDays", {});
  if (Object.keys(sl).length < 21) return h("p.small.muted", `After three weeks of mornings (${Object.keys(sl).length} so far), this shows your own review accuracy after short and long nights. Only you see it.`);
  const sum = (test) => Object.entries(sl).filter(([d, x]) => test(x.h) && rd[d]?.[1] >= 3).reduce((a, [d]) => [a[0] + rd[d][0], a[1] + rd[d][1], a[2] + 1], [0, 0, 0]);
  const short = sum((v) => v <= 5), long = sum((v) => v >= 7);
  if (short[2] < 5 || long[2] < 5) return h("p.small.muted", "Not enough days yet on both sides (5 or more after short nights and after long ones, with some review done) to compare.");
  return h("p", `Your answers on days after under 6 hours: ${Math.round(100 * short[0] / short[1])}% right. After 7 or more: ${Math.round(100 * long[0] / long[1])}%. Your own data, over ${short[2] + long[2]} days.`);
}
function viewRoom() {
  const day = today(), sleep = store.get("sleep", {}), last = sleep[day] ?? {};
  const setSleep = (k, v) => { const all = store.get("sleep", {}); all[day] = { ...(all[day] ?? {}), [k]: v }; store.set("sleep", Object.fromEntries(Object.entries(all).sort().slice(-400))); render(); };
  // Notes: typed or dictated, optionally pinned to a syllabus topic; a pinned note comes back with that topic.
  const noteText = h("textarea", { rows: 4, placeholder: "A note in your own words", style: { fontFamily: "var(--read-font)", fontSize: "17px" } });
  const pin = h("input", { list: "room-nodes", style: { width: "100%" }, placeholder: "Pin to a syllabus topic (optional)" });
  const nodeList = h("datalist", { id: "room-nodes" }, SY.NODES.map((nd) => h("option", { value: nd.name })));
  const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
  const dictate = Speech && h("button", { onclick: () => {
    const r = new Speech(); r.lang = lang() === "hi" ? "hi-IN" : "en-IN"; r.interimResults = false;
    r.onresult = (e) => { noteText.value = (noteText.value + " " + [...e.results].map((x) => x[0].transcript).join(" ")).trim(); };
    r.onend = () => { dictate.textContent = "Speak a note"; };
    dictate.textContent = "Listening… (tap Stop when done)"; r.start();
    dictate.onclick = () => r.stop();
  } }, "Speak a note");
  const care = h("div");
  noteText.addEventListener("input", () => put(care, distress(noteText.value) ? careBox() : null));
  const addNote = () => {
    const text = noteText.value.trim(); if (!text) return;
    const node = SY.NODES.find((nd) => nd.name === pin.value.trim())?.id ?? null;
    store.set("roomNotes", [...roomNotes(), { id: Date.now().toString(36), at: day, text: text.slice(0, 4000), node }].slice(-1000)); render();
  };
  // To-dos: your list, separate from the plan. No due dates, so nothing is ever overdue.
  const todoIn = h("input", { placeholder: "Something for you to do", maxLength: 160, style: { flex: "1" }, onkeydown: (e) => { if (e.key === "Enter") addTodo(); } });
  const addTodo = () => { const t = todoIn.value.trim(); if (!t) return; store.set("todos", [...roomTodos(), { id: Date.now().toString(36), text: t, done: false }].slice(-300)); render(); };
  const setTodo = (id, patch) => { store.set("todos", roomTodos().map((x) => (x.id === id ? { ...x, ...patch } : x))); render(); };
  const todos = roomTodos(), open = todos.filter((x) => !x.done), done = todos.filter((x) => x.done);
  const todoRow = (x) => {
    const match = !x.node && !x.offered && nodeMatch(x.text);
    return h("div.task", h("label.grow", h("input", { type: "checkbox", checked: x.done, onchange: (e) => setTodo(x.id, { done: e.target.checked }) }), " ", x.text,
        x.node && h("a.small", { href: "#map/" + x.node, style: { marginLeft: "8px" } }, "· " + (SY.nodeById(x.node)?.name ?? "topic"))),
      match && h("span.small", "Link to “", match.name, "”? ", h("button.ghost.small", { onclick: () => setTodo(x.id, { node: match.id, offered: true }) }, "Yes"), h("button.ghost.small", { onclick: () => setTodo(x.id, { offered: true }) }, "No")),
      h("button.ghost.small", { onclick: () => { store.set("todos", roomTodos().filter((y) => y.id !== x.id)); render(); }, "aria-label": "Delete" }, "×"));
  };
  const journalN = Object.keys(store.get("journal", {})).length;
  const journalBox = h("div");
  const notes = roomNotes();
  return h("div.col", h("h1", "Your room"), pauseLine("journal-first-open"),
    h("p.muted", "Only you see this. Nothing here goes to your pod, to marketing or to any AI, and nothing is scored."),
    h("div.card", h("h2", { style: { marginTop: 0 } }, "Last night's sleep"),
      h("div.chips", SLEEP_H.map(([v, l]) => h("button.chip", { "aria-pressed": String(last.h === v), onclick: () => setSleep("h", v) }, l))),
      h("div.chips", SLEEP_FELT.map(([v, l]) => h("button.chip", { "aria-pressed": String(last.felt === v), onclick: () => setSleep("felt", v) }, l))),
      h("p.small.muted", "Sleep over weeks matters more for exams than the night before. One tap in the morning is enough."),
      sleepInsight()),
    h("div.card", h("h2", { style: { marginTop: 0 } }, "Notes"),
      h("p.small.muted", "Pin a note to a syllabus topic and it comes back with that topic in your review."),
      noteText, care, pin, nodeList, h("div.row", h("button.primary", { onclick: addNote }, "Save the note"), dictate),
      notes.length > 0 && h("div", notes.slice().reverse().slice(0, 30).map((n) => h("div.task",
        h("div.grow", h("div", { style: { whiteSpace: "pre-wrap" } }, n.text), h("div.small.muted", n.at, n.node ? h("span", " · ", h("a", { href: "#map/" + n.node }, SY.nodeById(n.node)?.name ?? "topic")) : null)),
        h("button.ghost.small", { onclick: () => { if (confirm("Delete this note?")) { store.set("roomNotes", roomNotes().filter((x) => x.id !== n.id)); render(); } } }, "Delete"))))),
    h("div.card", h("h2", { style: { marginTop: 0 } }, "To-dos"),
      h("p.small.muted", "Your own list, apart from the plan. No dates, so nothing is ever overdue."),
      h("div.row", todoIn, h("button", { onclick: addTodo }, "Add")),
      open.map(todoRow),
      done.length > 0 && h("details", h("summary.small", `Done (${done.length})`), done.slice(-30).map(todoRow))),
    h("div.card", h("h2", { style: { marginTop: 0 } }, "Journal"),
      h("p.small", journalN ? `${journalN} entr${journalN === 1 ? "y" : "ies"}, encrypted on this device. You write them when you close the day.` : "You can write a few lines when you close the day. It's encrypted on this device."),
      h("p.small.muted", "Nobody reads it, and no AI. If you write something that sounds like you're in danger, the app shows you people who can help; that's all it does."),
      h("div.row", h("a.btn", { href: "#close" }, "Close the day"), journalN > 0 && h("button", { onclick: async () => {
        const all = store.get("journal", {}), rows = [];
        for (const [d, sealed] of Object.entries(all).sort().reverse().slice(0, 30)) { const e = await vault.open(sealed).catch(() => null); if (e) rows.push([d, e]); }
        put(journalBox, rows.map(([d, e]) => h("div.task", h("div.grow", h("div.small.muted", d), [e.memory, e.after && "After: " + e.after, e.step && "Next: " + e.step, e.block && "In the way: " + e.block].filter(Boolean).map((t) => h("div", t))))));
      } }, "Read my journal")), journalBox),
    h("div.card", h("h2", { style: { marginTop: 0 } }, "Take it with you"),
      h("p.small", "Download everything in your room and the rest of the app as one file, any time. Your work is yours."),
      h("button", { onclick: exportData }, "Download my data")));
}

function viewRhythm() {
  const weeks = {};
  for (const x of store.get("focusLog", [])) weeks[mondayOf(x.day)] = (weeks[mondayOf(x.day)] ?? 0) + x.minutes;
  const recent = Object.entries(weeks).sort().slice(-4);
  return h("div.col", h("h1", "Rhythm"),
    h("p.muted", "The days you closed, week by week. A rhythm is coming back, not never missing."),
    h("div.card", rhythmDots(false)),
    recent.length > 0 && h("div.card", h("h3", { style: { marginTop: 0 } }, "Focused time by week"),
      recent.map(([wk, m]) => h("div.row.between", h("span", "Week of " + new Date(wk + "T12:00").toLocaleDateString(undefined, { day: "numeric", month: "short" })), h("span", `${Math.round(m / 60 * 10) / 10} h`)))),
    h("a.btn", { href: "#close" }, "Close today"));
}

function viewStamps() {
  const s = stamps();
  const earnedMastery = Object.keys(s).filter((k) => k.startsWith("mastery:"));
  return h("div.col", h("h1", "Stamp book"),
    h("p.muted", "Stamps mark things you did. None can be lost, and nobody else sees them."),
    STAMP_FAMILIES.map(([fam, title]) => {
      const ids = fam === "mastery" ? earnedMastery : Object.keys(STAMPS).filter((k) => STAMPS[k][0] === fam);
      return h("div.card", h("h3", { style: { marginTop: 0 } }, title),
        fam === "mastery" && !ids.length && h("p.small.muted", "A subject stamp comes with 80% or more in three practice sessions, on three different days."),
        h("div.stamps", ids.map((id) => { const [, name, how] = stampInfo(id); return h("div.stamp" + (s[id] ? ".on" : ""), { title: how },
          h("strong", name), h("div.small.muted", s[id] ? `Since ${new Date(s[id] + "T12:00").toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}` : how)); })));
    }));
}

function viewPrivacy() {
  const p = profile();
  const pausedNow = paused(), rm = store.get("resultMode");
  return h("div.col", h("h1", "Privacy"),
    h("p.small", h("a", { href: "/legal/privacy.html", target: "_blank" }, "Privacy policy"), " · ", h("a", { href: "/legal/terms.html", target: "_blank" }, "Terms"), " · ",
      h("a", { href: "/legal/refunds.html", target: "_blank" }, "Refunds"), " · ", h("a", { href: "/legal/contact.html", target: "_blank" }, "Contact")),
    h("div.card", h("h3", { style: { marginTop: 0 } }, "Pause"),
      h("p.small", "No questions, no offers and no nudges. Your pod and tools stay open."),
      pausedNow ? h("button", { onclick: () => { store.del("pausedUntil"); render(); } }, "I'm back")
        : h("div.row", h("button", { onclick: () => { store.set("pausedUntil", Date.now() + 7 * 86400_000); render(); } }, "Pause for a week"), h("button", { onclick: () => { store.set("pausedUntil", Date.now() + 30 * 86400_000); render(); } }, "Pause for a month"))),
    h("div.card", h("h3", { style: { marginTop: 0 } }, "Smarter Chotu"),
      h("label", h("input", { type: "checkbox", checked: !!store.get("smarterChotu"), onchange: (e) => { store.set("smarterChotu", e.target.checked); } }), " Send my approved notes to Chotu with each question"),
      h("p.small.muted", `Off by default. Only the ${P.memory().length} note(s) you approved in Profile, nothing else.`)),
    h("div.card", h("h3", { style: { marginTop: 0 } }, "Result-day mode"),
      h("p.small", "For 72 hours: the Adda shrinks to one card, Chotu stays quiet, no wins posts and no offers. It turns on by itself on UPSC result days."),
      rm && rm.until > Date.now() ? h("button", { onclick: () => { store.del("resultMode"); render(); } }, "Switch it off")
        : h("button", { onclick: () => { store.set("resultMode", { until: Date.now() + 72 * 3600_000 }); location.hash = "#adda"; render(); } }, "Switch it on for 72 hours")),
    h("div.card", h("h3", { style: { marginTop: 0 } }, "Your data"),
      h("p.small", "Your journal, answers, profile, mock results and focus log stay in this browser. The journal is encrypted. Your pod messages go to the pod server."),
      h("p.small", "Your sign-in (your Google email) is kept only to sign you in and, if ever needed, to switch an account off. Other members never see it, and it's never sent to Chotu or any AI service."),
      h("div.row", h("button", { onclick: exportData }, "Download my data"), h("button", { onclick: deleteData }, "Delete everything")),
      h("p.small.muted", "Download includes what the server holds about you. Delete erases it there too. If you write to us about your data, quote your member id: ", h("code", p.memberId))));
}

async function exportData() {
  const out = {};
  try { Object.keys(localStorage).filter((k) => k.startsWith("upsc:") && !k.startsWith("upsc:cache:")).forEach((k) => (out[k.slice(5)] = JSON.parse(localStorage.getItem(k)))); } catch {}
  const journal = out.journal ?? {};
  out.journal = {};
  for (const [d, sealed] of Object.entries(journal)) out.journal[d] = await vault.open(sealed);
  out.profileFields = P.fields(); out.chotuNotes = P.memory();
  const memberId = profile()?.memberId;
  if (memberId) out.server = await fetch("/privacy/export", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ memberId }) }).then((r) => r.json()).catch(() => "Couldn't reach the server; try again when online.");
  const a = h("a", { href: URL.createObjectURL(new Blob([JSON.stringify(out, null, 2)], { type: "application/json" })), download: `aspiran-${today()}.json` });
  document.body.append(a); a.click(); a.remove();
}
async function deleteData() {
  if (!confirm("Delete your journal, profile, answers, mock results and focus log from this browser, erase your pod membership, messages, consent record and sign-in account from the server, and remove your sign-in? This can't be undone.")) return;
  const memberId = profile()?.memberId;
  if (memberId) await fetch("/privacy/delete", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ memberId }) }).catch(() => {});
  const gone = await Auth.deleteFirebaseUser();
  pod.ws?.close(); commonsLeave();
  wipeLocal();
  if (!gone.ok) alert(gone.why);
  location.hash = ""; render();
}
/** Everything this browser holds for the app: storage, the journal key, the profile, the Focus extension's copy. */
function wipeLocal() { store.clear(); vault.forget(); P.forgetProfile(); M.forget(); ext.send(); }

// --- Sign-in screens (auth.js) -------------------------------------------------------------------------

/** Where the 72-hour offline grace stands, from the last access check. */
const access = { state: "ok" };
async function runAccessCheck(force = false) {
  const before = access.state;
  access.state = await Auth.check({ force });
  if (access.state !== before || access.state === "suspended") render();
}

/** Google (or the local dev sign-in). Calls done(memberId) once the server knows this account. */
function signInPanel(hint, done) {
  const box = h("div.card");
  const msg = h("p.small", { role: "status", "aria-live": "polite" });
  const buttons = [];
  const busy = (on) => buttons.forEach((b) => (b.disabled = on));
  const fail = (e) => { put(msg, e.message); busy(false); };
  const finish = async () => {
    put(msg, "Checking your account…");
    try {
      const d = await Auth.establish(hint);
      if (d.status === "suspended") { render(); return; }
      access.state = "ok";
      done(d.memberId);
    } catch (e) { fail(e); }
  };
  const mode = Auth.mode();
  const pwOn = Auth.passwordOn();
  // The main way in: Google, or on a local test server a fake dev sign-in. Username and password sits under it.
  let main = null;
  if (mode === "dev") {
    const who = h("input", { type: "email", placeholder: "Any email (dev only)", autocomplete: "off" });
    const go = h("button.primary", { onclick: () => { try { busy(true); Auth.devSignIn(who.value); finish(); } catch (e) { fail(e); } } }, "Dev sign-in");
    buttons.push(go);
    main = [h("p.small.muted", "Local test server: no Firebase, a fake sign-in. Real builds show the Google button here."), who, h("div.row", { style: { marginTop: "8px" } }, go)];
  } else if (mode === "firebase") {
    const google = h("button.primary", { onclick: async () => { busy(true); put(msg, ""); try { await Auth.signInGoogle(); await finish(); } catch (e) { fail(e); } } }, "Continue with Google");
    buttons.push(google);
    main = [google, h("p.small.muted", "We keep your Google email only to sign you in.")];
  }
  if (!main && !pwOn) {
    put(box, h("p", "Sign-in isn't set up on this server yet, so pods, Chotu and your account can't open. The Free Shelf works without it."), h("a.btn", { href: "#shelf" }, "Open the Free Shelf"));
    return box;
  }
  const pwForm = pwOn ? passwordForm(hint, (d) => {
    if (d.status === "suspended") { render(); return; }
    access.state = "ok";
    if (d.mustChange) put(box, newPasswordForm(true, () => done(d.memberId)));
    else done(d.memberId);
  }, !main) : null;
  const pwToggle = main && pwForm ? h("button.ghost", { style: { marginTop: "8px" }, onclick: () => { pwForm.hidden = !pwForm.hidden; } }, "Use username and password") : null;
  if (pwForm && main) pwForm.hidden = true;
  put(box, main, msg, pwToggle, pwForm);
  return box;
}

/** Username and password: sign in, or create an account (no email, so write the password down somewhere safe). */
function passwordForm(hint, done, open) {
  let kind = "signin";
  const user = h("input", { type: "text", placeholder: "Username", autocomplete: "username", autocapitalize: "none", spellcheck: "false", maxlength: 30 });
  const pass = h("input", { type: "password", placeholder: "Password", autocomplete: "current-password", maxlength: 200 });
  const pass2 = h("input", { type: "password", placeholder: "Type the password again", autocomplete: "new-password", maxlength: 200, hidden: true });
  const msg = h("p.small", { role: "status", "aria-live": "polite" });
  const note = h("p.small.muted");
  const go = h("button.primary");
  const flip = h("button.ghost");
  const draw = () => {
    const up = kind === "signup";
    put(go, up ? "Create account" : "Sign in");
    put(flip, up ? "I already have an account" : "New here? Create an account");
    pass.autocomplete = up ? "new-password" : "current-password";
    pass2.hidden = !up;
    put(note, up ? "Usernames are 3 to 30 small letters, numbers, _ or . Use at least 8 characters for the password. " +
      (Auth.recoveryOn() ? "After signing in you can add a recovery email in Me → Account, in case you forget it." : "Keep your password safe: if you forget it, write to support and we'll set a temporary one.") : "");
    forgot.hidden = up;
    put(msg, "");
  };
  const forgot = h("button.ghost.small", { onclick: () => { forgotBox.hidden = !forgotBox.hidden; } }, "Forgot password?");
  const forgotBox = forgotForm(done);
  forgotBox.hidden = true;
  flip.onclick = () => { kind = kind === "signin" ? "signup" : "signin"; draw(); };
  const submit = async () => {
    const u = user.value.trim().toLowerCase();
    if (kind === "signup") {
      if (!/^[a-z0-9_.]{3,30}$/.test(u)) { put(msg, "Usernames are 3 to 30 small letters, numbers, _ or ."); return; }
      if (pass.value.length < 8) { put(msg, "Use at least 8 characters for your password."); return; }
      if (pass.value !== pass2.value) { put(msg, "The two passwords don't match."); return; }
    } else if (!u || !pass.value) { put(msg, "Type your username and password."); return; }
    go.disabled = true; put(msg, kind === "signup" ? "Creating your account…" : "Signing in…");
    try { const d = await Auth.passwordSignIn(kind, u, pass.value, hint); pass.value = pass2.value = ""; done(d); }
    catch (e) { put(msg, e.message); go.disabled = false; }
  };
  go.onclick = submit;
  [user, pass, pass2].forEach((i) => i.addEventListener("keydown", (e) => { if (e.key === "Enter") submit(); }));
  draw();
  const form = h("div.col", { style: { gap: "8px", marginTop: open ? "0" : "12px" } }, open ? null : h("h3", { style: { margin: 0 } }, "Username and password"), user, pass, pass2, note, h("div.row", go, flip), msg, forgot, forgotBox);
  return form;
}

/** Forgot password: ask for a code by username or recovery email, then set a new password with it. */
function forgotForm(done, code = "") {
  if (!Auth.recoveryOn()) return h("p.small.muted", "Write to support and we'll set a temporary password for you. You choose a new one when you sign in.");
  const who = h("input", { type: "text", placeholder: "Username or recovery email", autocomplete: "username", autocapitalize: "none", spellcheck: "false", maxlength: 200 });
  const msg = h("p.small", { role: "status", "aria-live": "polite" });
  const send = h("button", { onclick: async () => {
    if (!who.value.trim()) { put(msg, "Type your username or your recovery email."); return; }
    send.disabled = true; put(msg, "Sending…");
    try { const d = await Auth.forgotPassword(who.value); put(msg, d.message); resetBox.hidden = false; }
    catch (e) { put(msg, e.message); }
    send.disabled = false;
  } }, "Email me a reset code");
  const resetBox = resetForm(code, done);
  resetBox.hidden = !code;
  const have = h("button.ghost.small", { onclick: () => { resetBox.hidden = false; } }, "I have a code");
  return h("div.col", { style: { gap: "8px" } }, h("p.small.muted", "If you added a recovery email, we'll send a code to it. It works once, for 30 minutes."),
    who, h("div.row", send, have), msg, resetBox);
}

/** The code from the email and a new password. Signs this browser in; other devices are signed out. */
function resetForm(code, done) {
  const box = h("input", { type: "text", placeholder: "Code from the email", autocomplete: "one-time-code", autocapitalize: "none", spellcheck: "false", value: code });
  const next = h("input", { type: "password", placeholder: "New password (at least 8 characters)", autocomplete: "new-password" });
  const again = h("input", { type: "password", placeholder: "New password again", autocomplete: "new-password" });
  const msg = h("p.small", { role: "status", "aria-live": "polite" });
  const go = h("button.primary", { onclick: async () => {
    if (!box.value.trim()) { put(msg, "Paste the code from the email."); return; }
    if (next.value.length < 8) { put(msg, "Use at least 8 characters."); return; }
    if (next.value !== again.value) { put(msg, "The two new passwords don't match."); return; }
    go.disabled = true; put(msg, "Saving…");
    try { const d = await Auth.resetPassword(box.value, next.value); next.value = again.value = ""; put(msg, "Password changed. Other devices are signed out."); done(d); }
    catch (e) { put(msg, e.message); go.disabled = false; }
  } }, "Set my new password");
  return h("div.col", { style: { gap: "8px" } }, box, next, again, h("div.row", go), msg);
}

/** Opened from the link in a reset email. */
function resetScreen(code) {
  const finish = (d) => {
    // The code is used: replace() takes it out of the address and the history.
    if (d.status === "suspended") { location.replace("#adda"); return; }
    access.state = "ok";
    // Like signing in: an account used on another device brings its pod here.
    const p = profile();
    if (p && d.memberId && d.memberId !== p.memberId) { store.set("profile", { ...p, memberId: d.memberId }); store.del("podSummary"); pod.summary = null; }
    setTimeout(() => location.replace("#adda"), 1200);
  };
  return h("main", h("div.col", { style: { maxWidth: "560px", margin: "8vh auto" } },
    h("div.center", kulhad("calm", 72)),
    h("h1.center", "Choose a new password"),
    h("div.card", Auth.recoveryOn() ? resetForm(code, finish) : h("p", "Password reset isn't available right now. Please try again later.")),
    h("p.small.center", h("a", { href: "#" }, "Back to Aspiran"))));
}

/** Me → Account: an email for "Forgot password?". Checked with a 6-digit code before it's used. */
function recoveryEmailForm() {
  const box = h("div.col", { style: { gap: "8px" } }, h("p.small.muted", "Loading…"));
  const draw = (st) => {
    const msg = h("p.small", { role: "status", "aria-live": "polite" });
    const email = h("input", { type: "email", placeholder: "Email address", autocomplete: "email", maxlength: 200 });
    const code = h("input", { type: "text", placeholder: "6-digit code", inputmode: "numeric", autocomplete: "one-time-code", maxlength: 6 });
    const act = (fn, busyText) => async (e) => {
      e.target.disabled = true; put(msg, busyText);
      try { draw(await fn()); } catch (err) { put(msg, err.message); e.target.disabled = false; }
    };
    const add = h("button", { onclick: act(() => Auth.recoveryAdd(email.value), "Sending a code…") }, st.email ? "Change email" : "Send a code");
    const verify = h("button.primary", { onclick: act(() => Auth.recoveryVerify(code.value), "Checking…") }, "Confirm");
    const remove = h("button.ghost", { onclick: act(() => Auth.recoveryRemove(), "Removing…") }, "Remove");
    put(box,
      h("p.small.muted", "Only for resetting your password if you forget it. We don't send anything else, and nobody else sees it."),
      st.email ? h("p", "Recovery email: ", h("strong", st.email)) : h("p", "No recovery email yet."),
      st.pending ? [h("p.small", `We sent a code to ${st.pending}. Type it here. It works for 30 minutes.`), code, h("div.row", verify)] : null,
      email, h("div.row", add, st.email ? remove : null), msg);
  };
  Auth.recoveryStatus().then(draw).catch((e) => put(box, h("p.small", e.message)));
  return box;
}

/** After a temporary password (forced), or from Me → Account. */
function newPasswordForm(forced, done) {
  const cur = h("input", { type: "password", placeholder: forced ? "Temporary password" : "Current password", autocomplete: "current-password" });
  const next = h("input", { type: "password", placeholder: "New password (at least 8 characters)", autocomplete: "new-password" });
  const again = h("input", { type: "password", placeholder: "New password again", autocomplete: "new-password" });
  const msg = h("p.small", { role: "status", "aria-live": "polite" });
  const go = h("button.primary", { onclick: async () => {
    if (next.value.length < 8) { put(msg, "Use at least 8 characters."); return; }
    if (next.value !== again.value) { put(msg, "The two new passwords don't match."); return; }
    go.disabled = true; put(msg, "Saving…");
    try { await Auth.changePassword(cur.value, next.value); cur.value = next.value = again.value = ""; put(msg, "Password changed. Other devices are signed out."); done?.(); }
    catch (e) { put(msg, e.message); go.disabled = false; }
  } }, forced ? "Set my new password" : "Change password");
  return h("div.col", { style: { gap: "8px" } }, h("h3", { style: { margin: 0 } }, forced ? "Choose a new password" : "Change password"),
    forced ? h("p.small.muted", "You signed in with a temporary password. Choose your own now.") : null, cur, next, again, h("div.row", go), msg);
}

/** An install from before sign-in: one screen, and everything in this browser stays as it is. */
function signInScreen() {
  const p = profile();
  return h("main", h("div.col", h("div.center", kulhad("warm", 72)), h("h1.center", `Welcome back, ${p.name}`),
    h("p", "Aspiran now asks everyone to sign in once, to keep the Adda safe. Your journal, stamps, profile and saved work stay in this browser as they are, and your pod stays yours."),
    signInPanel(p.memberId, (memberId) => {
      // Signing in to an account that already has a member id (used on another device) brings that pod here.
      if (memberId && memberId !== p.memberId) { store.set("profile", { ...profile(), memberId }); store.del("podSummary"); pod.summary = null; }
      render();
    }),
    h("p.small.center", h("a", { href: "#shelf" }, "Open the Free Shelf without signing in"))));
}

/** Calm, full screen. The member's notes stay in this browser unless they choose to delete them. */
function suspendedView() {
  const s = Auth.suspended() ?? {};
  const support = s.support ?? config.auth?.support;
  return h("main", h("div.col", { style: { maxWidth: "560px", margin: "8vh auto" } },
    h("div.center", kulhad("calm", 72)),
    h("h1.center", "Your access has been switched off"),
    h("div.card",
      h("p", "You can't use Aspiran with this account right now, so you've been signed out."),
      h("p", support ? ["If you think this is a mistake, or want to talk about it, write to ", h("a", { href: /@/.test(support) ? "mailto:" + support : support }, support), "."] : "If you think this is a mistake, write to the Aspiran team."),
      h("p.small.muted", "Your journal, notes and saved work are still in this browser. Nothing has been deleted.")),
    h("div.row", { style: { justifyContent: "center" } },
      h("button", { onclick: () => { Auth.clearSuspended(); render(); } }, "Sign in again"),
      h("button.danger", { onclick: () => {
        if (!confirm("Delete everything Aspiran saved in this browser: journal, profile, answers, mock results and focus log? This can't be undone. To erase what the server holds too, write to us (you can't sign in while access is off).")) return;
        wipeLocal(); Auth.clearSuspended(); location.hash = ""; render();
      } }, "Delete my data")),
    h("p.small.muted.center", { style: { marginTop: "16px" } }, h("a", { href: "#calm" }, "Calm"), " and ", h("a", { href: "#talk" }, "Need to talk?"), " still work.")));
}

/**
 * Offline, or past the 72-hour check: a calm note above the page, kept in one slot so going on or offline updates it
 * without redrawing what the member is doing. Today's Chai, the library, saved current affairs, PYQs and Calm read
 * from this browser; pod chat, Chotu online and sign-in need a connection.
 */
const offlineSlot = h("div");
function offlineBanner() { drawOffline(); return offlineSlot; }
function drawOffline() {
  const off = !navigator.onLine || access.state === "offline-ok" || access.state === "offline-expired";
  if (!off || Auth.optional()) { put(offlineSlot); return; }
  const btn = h("button.ghost.small", { onclick: async () => { btn.disabled = true; btn.textContent = "Checking…"; await runAccessCheck(true); drawOffline(); } }, "Try again");
  put(offlineSlot, h("div.card", { role: "status", style: { marginBottom: "16px" } },
    h("div.row.between", h("strong", "You're offline"), btn),
    h("p", { style: { margin: "6px 0 0" } }, "Today's Chai, your library, saved current affairs, PYQs and Calm still work. Pod chat, Chotu online and sign-in need a connection.",
      access.state === "offline-expired" ? " Connect once to check your account; nothing is lost." : "")));
}

// --- Me → Plus (test mode only) ----------------------------------------------------------------------

function viewPlus() {
  if (!plusOn()) return h("div.col", h("h1", "Plus"), h("div.card", h("p", "Plus isn't available. Everything in the app is free, no card needed.")));
  const box = h("div", h("p.muted", "Loading…"));
  const me = profile().memberId;
  const load = async () => {
    const [st, sch] = await Promise.all([getJson(`/plus/status?member=${encodeURIComponent(me)}`), getJson("/plus/scholarships")]);
    if (!st) return put(box, h("p", "Couldn't reach the server."));
    const plan = st.plan;
    const buy = (which) => post("/plus/purchase", { memberId: me, plan: which, testMode: true }).then((r) => { toast(r.invoice ? `TEST invoice ${r.invoice.id}: no money was charged.` : r.error ?? "Couldn't do that."); load(); });
    let sure = false;
    const cancel = h("button", { onclick: () => { if (!sure) { sure = true; cancel.textContent = "Yes, cancel Plus"; return; } post("/plus/cancel", { memberId: me }).then((r) => { toast(r.note ?? "Cancelled."); load(); }); } }, "Cancel Plus");
    const pay = st.payments ?? { provider: "test" };
    const real = pay.provider === "cashfree";
    put(box,
      !real && h("div.card.test-banner", h("strong", "TEST MODE"), h("p.small", { style: { margin: "4px 0 0" } }, "No real payments are set up. Nothing here charges money.")),
      real && pay.mode === "sandbox" && h("div.card.test-banner", h("strong", "CASHFREE SANDBOX"), h("p.small", { style: { margin: "4px 0 0" } }, "Payments go to Cashfree's test system. No real money moves.")),
      h("div.card", h("h3", { style: { marginTop: 0 } }, "Always free"),
        h("p.small", "The Adda, your pod, the Commons, Chotu's Talk, Calm, Close the Day, Chai, practice and the Free Shelf. Free, no card needed."),
        h("p.small.muted", `Free allowances: ${st.limits.feedbackPerWeek} answer feedbacks a week, ${st.limits.mocksPerMonth} full mock a month, ${st.limits.cloudChotuPerDay} cloud Chotu turns a day.`)),
      h("div.card", h("h3", { style: { marginTop: 0 } }, "Your plan"),
        plan ? h("p", `Plus (${plan.plan}) until ${new Date(plan.endsAt ?? plan.ends_at).toLocaleDateString()}${plan.cancelledAt || plan.cancelled_at ? ", cancelled: it won't renew" : ""}.`) : h("p", "Free."),
        st.used && h("p.small.muted", `This period: ${st.used.feedbackThisWeek} feedbacks, ${st.used.mocksThisMonth} mocks, ${st.used.chotuToday} cloud Chotu turns today.`),
        plan && !(plan.cancelledAt || plan.cancelled_at) && cancel,
        !plan && h("div",
          !st.trial.used && (st.trial.unlocked ? h("button", { onclick: () => post("/plus/trial", { memberId: me }).then((r) => { toast(r.ok ? "7-day trial started." : r.error); load(); }) }, `Start the ${st.trial.days}-day trial`) : h("p.small.muted", st.trial.why)),
          real ? payCard(pay) : h("div.row", { style: { marginTop: "8px" } },
            h("button", { onclick: () => buy("yearly") }, `TEST: yearly, ₹${st.prices.yearly.inr}`)),
          h("p.small.muted", real ? `One payment for a year. It doesn't renew by itself. Refunds within ${st.refundWindowDays} days: see the refund policy.` : `Refunds within ${st.refundWindowDays} days. ${st.cancel}`)),
        h("p.small", h("a", { href: "#receipts" }, "My receipts"), " · ", h("a", { href: "/legal/refunds.html", target: "_blank" }, "Refund policy"), " · ", h("a", { href: "/legal/terms.html", target: "_blank" }, "Terms"))),
      !real && h("div.card", h("h3", { style: { marginTop: 0 } }, "Gift Plus"),
        h("p.small", "Buy Plus for someone else. They get a link; you never see what they do with it."),
        h("button", { onclick: () => post("/plus/gift", { memberId: me, plan: "monthly", testMode: true }).then((r) => { if (r.code) prompt("TEST gift link (no money was charged):", location.origin + r.link); else toast(r.error ?? "Couldn't make a gift."); }) }, "TEST: gift a month")),
      sch && h("div.card", h("h3", { style: { marginTop: 0 } }, "Scholarships"),
        h("p.small", `One free Plus seat for every 10 paid, chosen by pod leads. Seats so far: ${sch.seats ?? 0}, given: ${sch.awarded ?? 0}, open: ${sch.open ?? 0}.`)));
  };
  load();
  return h("div.col", h("h1", "Plus"), box);
}

/** Cashfree checkout: a year of Plus, one payment. The phone number goes to Cashfree for the payment; we don't keep it. */
function payCard(pay) {
  const phone = h("input", { type: "tel", inputMode: "numeric", maxLength: 14, placeholder: "10-digit mobile number", autocomplete: "tel-national" });
  const msg = h("p.small", { role: "status" });
  const go = h("button.primary", { onclick: async () => {
    go.disabled = true; put(msg, "Starting the payment…");
    const r = await post("/plus/pay/order", { memberId: profile().memberId, phone: phone.value });
    if (!r.paymentSessionId) { go.disabled = false; return put(msg, r.error === "offline" ? "You're offline." : r.error ?? "Couldn't start the payment."); }
    try {
      await loadScript("https://sdk.cashfree.com/js/v3/cashfree.js");
      window.Cashfree({ mode: r.mode }).checkout({ paymentSessionId: r.paymentSessionId, redirectTarget: "_self" });
    } catch { go.disabled = false; put(msg, "Couldn't open Cashfree's checkout. Check your connection and try again."); }
  } }, pay.founding ? `Pay ₹${pay.amountInr} for a year` : `Pay ₹${pay.amountInr} for a year`);
  return h("div", { style: { marginTop: "8px" } },
    h("p", h("strong", `Plus for a year: ₹${pay.amountInr}`), pay.founding ? h("span.small.muted", ` founding price (usually ₹${pay.yearlyInr}), ${pay.foundingLeft} of ${pay.foundingSeats} left`) : null),
    h("label.small", "Mobile number (Cashfree needs it for the payment)"), phone, h("div.row", { style: { marginTop: "8px" } }, go), msg,
    h("p.small.muted", "Payments are handled by Cashfree. We never see your card or UPI details."));
}
function loadScript(src) {
  return new Promise((res, rej) => { if ([...document.scripts].some((x) => x.src === src)) return res(); const sc = document.createElement("script"); sc.src = src; sc.onload = res; sc.onerror = rej; document.head.append(sc); });
}

/** Back from Cashfree: ask the server to check the order with Cashfree, then show the result. */
function viewPaid(orderId) {
  const box = h("div.card", h("p", "Checking your payment with Cashfree…"));
  let tries = 0;
  const check = async () => {
    const r = await post("/plus/pay/verify", { memberId: profile().memberId, orderId });
    if (r.status === "paid") return put(box, h("h2", { style: { marginTop: 0 } }, "Plus is on for a year"), h("p", "Thank you. Your receipt is in Me → Plus → My receipts."), h("div.row", h("a.btn", { href: "#receipts" }, "My receipts"), h("a.btn", { href: "#plus" }, "Back to Plus")));
    if (r.status === "pending" && ++tries < 6) return setTimeout(check, 3000);
    put(box, h("p", r.status === "pending" ? "Cashfree hasn't confirmed the payment yet. If money left your account, Plus switches on as soon as it does; check back in a few minutes." : "The payment didn't go through. No money was taken, or it will be returned by your bank."),
      h("a.btn", { href: "#plus" }, "Back to Plus"));
  };
  check();
  return h("div.col", h("h1", "Payment"), box);
}

function viewReceipts() {
  const box = h("div", h("p.muted", "Loading…"));
  getJson(`/plus/receipts?member=${encodeURIComponent(profile().memberId)}`).then((d) => {
    if (!d) return put(box, h("p", "Couldn't reach the server."));
    if (!d.receipts?.length) return put(box, h("div.card", h("p", "No payments yet.")));
    const b = d.business;
    put(box, d.receipts.map((r) => h("div.card.receipt",
      h("div.row.between", h("strong", "Receipt " + r.receiptNo), h("span.tag", r.status === "refunded" ? "REFUNDED" : r.mode === "sandbox" ? "SANDBOX" : "PAID")),
      h("p.small", b.entityName, h("br"), b.address, b.gstin ? [h("br"), "GSTIN " + b.gstin] : null, h("br"), b.email),
      h("p", r.item), h("p", h("strong", `₹${r.amountInr}`), ` paid on ${new Date(r.paidAt).toLocaleDateString("en-IN")}`),
      h("p.small.muted", `Order ${r.orderId}${r.paymentRef ? ` · Cashfree payment ${r.paymentRef}` : ""}`),
      r.status === "refunded" && h("p.small", `Refunded ₹${r.refundInr} on ${new Date(r.refundedAt).toLocaleDateString("en-IN")}.`),
      h("button.ghost.small", { onclick: () => window.print() }, "Print or save as PDF"))));
  });
  return h("div.col", h("h1", "My receipts"), box);
}

function viewGift(code) {
  const box = h("div", h("p.muted", "Checking the gift…"));
  getJson(`/plus/gift/${encodeURIComponent(code)}`).then((g) => {
    if (!g?.valid) return put(box, h("p", "This gift link isn't valid or has been used."));
    put(box, h("div.card", h("p", `Someone gifted you Plus (${g.plan}).`), h("span.tag", "TEST MODE"),
      h("div", { style: { marginTop: "8px" } }, h("button.primary", { onclick: () => post(`/plus/gift/${code}/redeem`, { memberId: profile().memberId }).then((r) => { put(box, h("p", r.ok ? "Plus is on. Thank whoever sent it!" : r.error ?? "Couldn't redeem.")); }) }, "Use the gift"))));
  });
  return h("div.col", h("h1", "A gift"), box);
}

// --- Prep → My Plan ----------------------------------------------------------------------------------

function viewPlan() {
  const w = store.get("woop", { wish: "", outcome: "", obstacle: "", plan: "" });
  const field = (k, label, ph) => h("div", h("h3", label), h("input", { type: "text", maxLength: 160, value: w[k], placeholder: ph, oninput: (e) => { w[k] = e.target.value; store.set("woop", w); } }));
  const rmSaved = store.get("roadmap");
  return h("div.col", h("h1", "My Plan"),
    profileAsk("plan"),
    h("a.card.link", { href: "#roadmap" }, h("div.row.between", h("div", h("strong", rmSaved ? `My roadmap · Prelims ${rmSaved.goal.examYear}` : "Build my roadmap"),
      h("div.small.muted", rmSaved ? "Phases, subject order and this week's plan." : "Six quick answers, a free one-page plan to Prelims and a weekly plan.")), h("span", "→"))),
    routineCard(),
    h("a.card.link", { href: "#routine" }, h("div.row.between", h("div", h("strong", tr("routine.title")), h("div.small.muted", tr("routine.lead"))), h("span", "→"))),
    h("div.card", h("h2", { style: { marginTop: 0 } }, "This week, in four lines"),
      h("p.small.muted", "Wish, outcome, obstacle, plan. Naming the obstacle is what makes it work. Kept on this device."),
      field("wish", "Wish", "Finish Modern History once"),
      field("outcome", "Best outcome", "I'd feel ready to start answer writing"),
      field("obstacle", "The obstacle inside me", "I scroll after lunch"),
      field("plan", "If… then…", "If I pick up my phone after lunch, then I'll open the PDF instead")),
    h("div.card", h("h2", { style: { marginTop: 0 } }, "Honest numbers"),
      h("div.chips", h("a.chip", { href: "#compass" }, "Attempt Compass"), h("a.chip", { href: "#cost" }, "Cost of a Year"), h("a.chip", { href: "#maps" }, "5-source maps"))));
}

// --- Prep → My Plan → Roadmap: the free roadmap builder (server/src/roadmap.ts) --------------------------------
// The form goes to the server, the roadmap comes back and is kept on this device; the server stores nothing. The
// weekly plan is rebuilt each Monday from last week's focus minutes, mocks and the units you ticked off.

const PAPER_CHOICES = ["GS1", "GS2", "GS3", "GS4", "Essay", "CSAT", "Optional"];

function roadmapDone() { return store.get("roadmapDone", { units: [], subjects: [] }); }

/** What happened last week, from this device only: hours of focus, mocks taken, and what you ticked off. */
function lastWeekDone() {
  const from = addDays(mondayOf(today()), -7), to = addDays(mondayOf(today()), -1);
  const minutes = store.get("focusLog", []).filter((x) => x.day >= from && x.day <= to && x.kind !== "break").reduce((n, x) => n + x.minutes, 0);
  const mocks = store.get("mockHistory", []).filter((m) => { const d = String(m.day ?? m.at ?? "").slice(0, 10); return d >= from && d <= to; }).length;
  const done = roadmapDone();
  return { hours: Math.round(minutes / 6) / 10, mocks, unitsDone: done.units, subjectsDone: done.subjects };
}

async function refreshWeek(saved, force = false) {
  const week = mondayOf(today());
  if (!force && saved.weekPlan?.weekOf === week) return saved.weekPlan;
  const r = await post("/roadmap/week", { goal: saved.goal, done: lastWeekDone() });
  if (r.status !== 200) return saved.weekPlan ?? null;
  const plan = { ...r, weekOf: week };
  store.set("roadmap", { ...saved, weekPlan: plan });
  return plan;
}

function viewRoadmap() {
  const box = h("div");
  const saved = store.get("roadmap");
  const thisYear = new Date().getFullYear();
  const form = { examYear: thisYear + 1, attempt: 1, optional: "", hoursPerDay: 6, working: false, weakPapers: [], ...(saved?.goal ?? {}) };
  let editing = !saved;

  const drawForm = (error) => {
    const years = [0, 1, 2, 3].map((n) => thisYear + n).filter((y) => y > thisYear || new Date().getMonth() < 3);
    const opts = (list, cur) => list.map(([v, l]) => h("option", { value: v, selected: String(cur) === String(v) }, l));
    put(box,
      h("div.card",
        h("h2", { style: { marginTop: 0 } }, "Your goal"),
        h("p.small.muted", "Six quick answers. You get a one-page roadmap and a weekly plan. Free, and your answers stay on this device."),
        h("label", h("h3", "Prelims year"), h("select", { onchange: (e) => (form.examYear = +e.target.value) }, opts(years.map((y) => [y, String(y)]), form.examYear))),
        h("label", h("h3", "Attempt"), h("select", { onchange: (e) => (form.attempt = +e.target.value) }, opts([[1, "First attempt"], [2, "Second attempt"], [3, "Third or later"]], form.attempt))),
        h("label", h("h3", "Optional subject"), h("input", { type: "text", maxLength: 40, value: form.optional, placeholder: "Leave empty if you haven't chosen yet", oninput: (e) => (form.optional = e.target.value) })),
        h("label", h("h3", "Hours a day you can really study"), h("input", { type: "number", min: 1, max: 14, step: 0.5, value: form.hoursPerDay, oninput: (e) => (form.hoursPerDay = +e.target.value) })),
        h("h3", "Right now I'm"),
        h("div.chips", [[false, "Studying full-time"], [true, "Working and studying"]].map(([v, l]) =>
          h("button.chip", { "aria-pressed": String(form.working === v), onclick: () => { form.working = v; drawForm(); } }, l))),
        h("h3", "Papers that feel weak (optional)"),
        h("div.chips", PAPER_CHOICES.map((p) => h("button.chip", { "aria-pressed": String(form.weakPapers.includes(p)), onclick: () => {
          form.weakPapers = form.weakPapers.includes(p) ? form.weakPapers.filter((x) => x !== p) : [...form.weakPapers, p]; drawForm();
        } }, p))),
        error && h("p.small", { role: "alert" }, error),
        h("div.row", h("button.primary", { onclick: build }, saved ? "Rebuild my roadmap" : "Build my roadmap"), saved && h("button", { onclick: () => { editing = false; draw(); } }, "Cancel"))));
  };

  async function build() {
    put(box, h("p.muted", "Building your roadmap…"));
    const r = await post("/roadmap", { goal: form });
    if (r.status !== 200) return drawForm(r.error === "offline" ? "You're offline. Try again when you're connected." : r.error ?? "Couldn't build it just now. Try again.");
    const { status, ...rm } = r;
    const next = { goal: rm.goal, rm, builtOn: today(), weekPlan: null };
    store.set("roadmap", next);
    M.track("roadmap_built");
    rateAfter("roadmap", 8000);
    editing = false;
    draw();
  }

  const draw = async () => {
    const s = store.get("roadmap");
    if (editing || !s) return drawForm();
    const rm = s.rm, done = roadmapDone();
    const tick = (key, value) => { const d = roadmapDone(); d[key] = d[key].includes(value) ? d[key].filter((x) => x !== value) : [...d[key], value]; store.set("roadmapDone", d); draw(); };
    const week = h("div.card", h("p.small.muted", "Getting this week's plan…"));
    put(box,
      h("div.card",
        h("div.row.between", h("h2", { style: { margin: 0 } }, `Prelims ${rm.goal.examYear}`), h("span.tag", `${rm.weeksLeft} weeks`)),
        h("p", `About ${rm.hoursPerWeek} hours a week, ${rm.studyDays} days, one day off. ${rm.goal.working ? "Working and studying." : "Full-time."}`),
        h("p.small.muted", `A week: GS ${rm.split.gs}%${rm.split.optional ? `, optional ${rm.split.optional}%` : ""}, answers ${rm.split.answers}%, current affairs ${rm.split.current}%, tests ${rm.split.tests}%.`),
        h("div.row", h("button", { onclick: () => shareRoadmap(rm) }, "Share as image"), h("button.ghost", { onclick: () => { editing = true; draw(); } }, "Change my goal"))),
      week,
      h("div.card", h("h2", { style: { marginTop: 0 } }, "Phases"),
        rm.phases.map((p) => h("div", h("strong", p.name), h("span.small.muted", ` · ${p.weeks} weeks, ${p.from} to ${p.to}`), h("p.small", p.focus)))),
      h("div.card", h("h2", { style: { marginTop: 0 } }, "Subject order"),
        h("p.small.muted", "One subject at a time. Tick a subject when you've read it once; the weekly plan moves on."),
        h("ol", rm.order.map((x) => h("li", h("label", h("input", { type: "checkbox", checked: done.subjects.includes(x.id), onchange: () => tick("subjects", x.id) }),
          ` ${x.name} `, h("span.small.muted", `(${x.paper}, about ${x.hours} h, ${x.weeks} wk)`)))))),
      h("details.card", h("summary", h("strong", "Polity, unit by unit")),
        h("p.small.muted", "Tick a unit when you've done it and its check."),
        rm.polity.map((u) => h("div", h("label", h("input", { type: "checkbox", checked: done.units.includes(u.name), onchange: () => tick("units", u.name) }), " ", h("strong", u.name), h("span.small.muted", ` · ${u.hours} h`)),
          h("p.small", u.sources), h("p.small.muted", "Check: " + u.check)))),
      h("div.card", h("h2", { style: { marginTop: 0 } }, "Three checks along the way"),
        rm.milestones.map((m) => h("div", h("strong", m.title), h("span.small.muted", " · by " + m.by), h("p.small", m.check))),
        h("p.small.muted", "These are checks you do yourself. Nothing here predicts a rank or a result.")),
      h("div.card.soft", rm.notes.map((n) => h("p.small", n))),
      profile() && plusCard("rhythm_week4"));
    const plan = await refreshWeek(s);
    if (!plan) return put(week, h("p.small.muted", "This week's plan needs a connection. It'll appear when you're online."));
    put(week,
      h("div.row.between", h("h2", { style: { margin: 0 } }, "This week"), h("span.small.muted", plan.phase)),
      h("p", plan.line),
      plan.days.map((d) => h("div", h("strong", d.day), h("ul", d.blocks.map((b) => h("li", b.minutes ? `${b.minutes} min · ` : "", b.what))))),
      h("button.ghost.small", { onclick: async () => { await refreshWeek(store.get("roadmap"), true); draw(); } }, "Rebuild this week"));
  };
  draw();
  return h("div.col", h("h1", "Roadmap"), box);
}

/** The roadmap on one image (1080 wide), shared with the system sheet or saved. */
async function shareRoadmap(rm) {
  const W = 1080, pad = 64, c = document.createElement("canvas"), x = c.getContext("2d");
  const lines = [];
  const add = (text, size = 30, bold = false, color = "#3b2a20", gap = 10) => lines.push({ text, size, bold, color, gap });
  add(`My UPSC roadmap · Prelims ${rm.goal.examYear}`, 52, true, "#8a3b22", 16);
  add(`${rm.weeksLeft} weeks · about ${rm.hoursPerWeek} hours a week · ${rm.goal.working ? "working and studying" : "full-time"}`, 30, false, "#6b5a50", 28);
  add("Phases", 36, true, "#3b2a20", 8);
  for (const p of rm.phases) add(`${p.name}: ${p.weeks} weeks (${p.from} to ${p.to})`, 28);
  lines.at(-1).gap = 28;
  add("Subject order", 36, true, "#3b2a20", 8);
  rm.order.slice(0, 10).forEach((s, i) => add(`${i + 1}. ${s.name} · about ${s.hours} h`, 28));
  lines.at(-1).gap = 28;
  add("Three checks", 36, true, "#3b2a20", 8);
  for (const m of rm.milestones) add(`${m.title} (by ${m.by})`, 28, true, "#3b2a20", 4), add(m.check, 24, false, "#6b5a50", 14);
  add("Made free with Aspiran. No rank predictions, just a plan.", 24, false, "#8a3b22", 0);
  // Wrap long lines.
  const rows = [];
  for (const l of lines) {
    x.font = `${l.bold ? "700" : "400"} ${l.size}px system-ui, sans-serif`;
    let cur = "";
    for (const word of l.text.split(" ")) {
      const t = cur ? cur + " " + word : word;
      if (x.measureText(t).width > W - pad * 2 && cur) { rows.push({ ...l, text: cur, gap: 4 }); cur = word; } else cur = t;
    }
    rows.push({ ...l, text: cur });
  }
  c.width = W; c.height = pad * 2 + rows.reduce((n, r) => n + r.size * 1.25 + r.gap, 0);
  x.fillStyle = "#fbf3e8"; x.fillRect(0, 0, W, c.height);
  let y = pad;
  for (const r of rows) { x.font = `${r.bold ? "700" : "400"} ${r.size}px system-ui, sans-serif`; x.fillStyle = r.color; y += r.size; x.fillText(r.text, pad, y); y += r.size * 0.25 + r.gap; }
  const blob = await new Promise((res) => c.toBlob(res, "image/png"));
  if (!blob) return toast("Couldn't make the image.");
  const file = new File([blob], "upsc-roadmap.png", { type: "image/png" });
  if (navigator.canShare?.({ files: [file] })) { navigator.share({ files: [file], title: "My UPSC roadmap" }).catch(() => {}); return; }
  const a = h("a", { href: URL.createObjectURL(blob), download: "upsc-roadmap.png" }); document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

// --- Free Shelf: honest tools, no account needed ---------------------------------------------------

function viewShelf() {
  const tools = [["#compass", "Attempt Compass", "How many attempts and years you have, by the rules. No advice to stop or continue."],
    ["#cost", "Cost of a Year", "Rent, food, coaching and the salary you're not earning. Your numbers, not ours."],
    ["#maps", "5-source maps", "Five sources per subject, in order. The free ones first."],
    ["#thinker", "Thinker of the week", "One idea, where it comes from, and how to use it in an answer."],
    ["#routine", "Routine builder", "A week that fits you, in blocks."],
    ["#calm", "Calm", "Breathing and grounding, with sound off until you press it."]];
  return h("div.col", h("h1", "Free Shelf"), h("p.muted", "Free, no card needed. These work without an account, and nothing you type here leaves this browser."),
    tools.map(([href, t, s]) => h("a.card.link", { href }, h("div.row.between", h("div", h("strong", t), h("div.small.muted", s)), h("span", "→")))));
}

function viewCompass() {
  const v = store.get("compass", { dob: "", category: "general", used: 0, pwbd: false });
  const out = h("div");
  const draw = () => {
    store.set("compass", v);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v.dob)) return put(out, h("p.small.muted", "Add your date of birth to see your years."));
    const r = HT.compass(v);
    put(out, h("div.card",
      h("p", h("strong", r.attemptsLeft == null ? "No limit on attempts in your category." : `${r.attemptsLeft} attempt${r.attemptsLeft === 1 ? "" : "s"} left by count.`), ` Age limit: below ${r.upper} on 1 August.`),
      r.upperCheck && h("p", h("strong", "Check the UPSC notification: "), `sources differ on the upper age for ${HT.CATEGORIES[v.category]?.label ?? ""} candidates with a disability (${r.upperCheck} or ${r.upper}). Years after you turn ${r.upper} are marked below until it's confirmed.`),
      r.years.length ? h("p", `Exam years still open to you: ${r.years.map((y) => `${y.year} (age ${y.age}${y.check ? ", check the UPSC notification" : ""})`).join(", ")}.`) : h("p", "By these rules, no exam years are left. Check the latest notification: rules and relaxations change."),
      r.years.length > 0 && h("p.small.muted", r.ageLimitFirst ? "Your age limit ends things before the attempt count does." : "Your attempt count ends things before the age limit does."),
      h("p.small.muted", `Source: ${HT.RULES_SOURCE}. The current year's notification on upsc.gov.in is what counts.`)),
      h("div.card", h("h3", { style: { marginTop: 0 } }, "Questions worth sitting with"), h("ul", HT.COMPASS_QUESTIONS.map((q) => h("li", q)))),
      h("details.card", h("summary", h("strong", "Other paths people take alongside or after")), HT.PLAN_B.map(([t, d]) => h("p", h("strong", t), " · ", d))),
      profile() && profileAsk("compass"));
  };
  const cat = h("select", { onchange: (e) => { v.category = e.target.value; draw(); } }, Object.entries(HT.CATEGORIES).map(([k, c]) => h("option", { value: k, selected: v.category === k }, c.label)));
  draw();
  return h("div.col", h("h1", "Attempt Compass"),
    h("p.muted", "By the rules only. It doesn't predict anything or tell you what to do."),
    h("div.card",
      h("label", "Date of birth ", h("input", { type: "date", value: v.dob, onchange: (e) => { v.dob = e.target.value; draw(); } })),
      h("label", " Category ", cat),
      h("label", " Attempts already counted ", h("input", { type: "number", min: 0, max: 20, value: v.used, style: { width: "5em" }, oninput: (e) => { v.used = Number(e.target.value) || 0; draw(); } })),
      h("label", " ", h("input", { type: "checkbox", checked: v.pwbd, onchange: (e) => { v.pwbd = e.target.checked; draw(); } }), " PwBD"),
      h("p.small.muted", "An attempt counts once you sit any Prelims paper. Saved only in this browser.")),
    out);
}

function viewCost() {
  const v = store.get("costYear", { preset: "delhi", ...HT.CITY_PRESETS.delhi, salary: 0 });
  const out = h("div");
  const inputs = {};
  const draw = () => {
    store.set("costYear", v);
    const r = HT.costOfYear(v);
    put(out, h("div.card", h("div.bignum", HT.inr(r.year)), h("p.muted", `a year, about ${HT.inr(r.month)} a month`),
      r.forgone > 0 && h("p", `With the salary you're not earning: ${HT.inr(r.withForgone)} a year.`),
      h("p.small.muted", "City numbers are rough starting points, not facts. Change every one to what you actually pay.")));
  };
  const preset = h("div.chips", Object.entries(HT.CITY_PRESETS).map(([k, c]) => h("button.chip", { "aria-pressed": String(v.preset === k), onclick: () => { Object.assign(v, c, { preset: k }); for (const [key] of HT.COST_ITEMS) inputs[key].value = v[key]; preset.querySelectorAll("button").forEach((b, i) => b.setAttribute("aria-pressed", String(Object.keys(HT.CITY_PRESETS)[i] === k))); draw(); } }, c.label)));
  draw();
  return h("div.col", h("h1", "Cost of a Year"), h("p.muted", "What a year of preparation costs you, in your own numbers. Saved only in this browser."),
    h("div.card", preset,
      h("div.grid2", HT.COST_ITEMS.map(([k, label, per]) => h("label.small", label + ` (₹ a ${per})`, inputs[k] = h("input", { type: "number", min: 0, value: v[k], oninput: (e) => { v[k] = Number(e.target.value) || 0; draw(); } })))),
      h("label.small", "Monthly salary you'd earn if you weren't preparing (optional)", h("input", { type: "number", min: 0, value: v.salary, oninput: (e) => { v.salary = Number(e.target.value) || 0; draw(); } }))),
    out);
}

function viewMaps(arg) {
  const weak = P.value("weak_subject");
  const first = HT.mapFor(arg || weak || "") ?? "polity";
  const box = h("div");
  const show = (k) => put(box, h("div.chips", Object.entries(HT.MAPS).map(([id, m]) => h("button.chip", { "aria-pressed": String(id === k), onclick: () => show(id) }, m.label))),
    h("div.card", h("h2", { style: { marginTop: 0 } }, HT.MAPS[k].label), h("ol", HT.MAPS[k].sources.map(([s, why]) => h("li", h("strong", s), h("div.small.muted", why))))));
  show(first);
  return h("div.col", h("h1", "5-source maps"), h("p.muted", "A map, not a shopping list: five sources per subject, in the order to use them. The free ones come first."),
    weak && h("p.small", `Starting with the map for ${weak}, the subject your practice says to work on.`), box);
}

function viewThinker() {
  const th = HT.thinkerOfWeek();
  const card = (t) => h("div.card", h("h2", { style: { marginTop: 0 } }, t.name), h("p", t.idea), h("p.small.muted", "From: " + t.from), h("p.small", h("strong", "Use it in: "), t.use));
  return h("div.col", h("h1", "Thinker of the week"), card(th),
    h("details", h("summary", "All thinkers"), HT.THINKERS.filter((t) => t !== th).map(card)),
    h("p.small.muted", "In our own words, never a made-up quote. Check the source before quoting it in an answer."));
}

function viewTalk() {
  return h("div.col", h("h1", tr("nav.talk")),
    h("p", tr("talk.lead")), careBox(),
    h("p.small.muted", tr("talk.danger")));
}

// --- Calm now ----------------------------------------------------------------------------------
// Playbook G: help comes first, sound stays off until pressed and stays quiet, nothing claims to treat
// anything, and nothing here is logged. Breathing follows the script's pace; the circle is still under
// reduced motion.

const calmScripts = () => [...CALM_BUILTIN, ...libraryOf("calm").map((i) => ({ ...i.data, id: "lib-" + i.data.id }))];
const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const calmPrefs = () => store.get("calmSound", { kind: "tones-6", volume: 0.4, cue: false });

const calmHelp = () => h("div.card.soft", { role: "note" },
  h("p", { style: { margin: "0 0 6px" } }, tr("calm.help")), h("a", { href: "#talk" }, tr("nav.talk")));

function soundPanel() {
  const set = (patch) => store.set("calmSound", { ...calmPrefs(), ...patch });
  const box = h("div.card");
  const choose = async (k) => {
    if (k === "off") calmAudio.stop();
    else {
      if (k === "tones") k = calmPrefs().kind.startsWith("tones") ? calmPrefs().kind : "tones-6";
      set({ kind: k });
      await calmAudio.play(k, calmPrefs().volume);
    }
    draw();
  };
  const draw = () => {
    const q = calmPrefs(), now = calmAudio.playing ? q.kind : "off", tones = now.startsWith("tones");
    const chip = (k, label, on) => h("button.chip", { "aria-pressed": String(on), onclick: () => choose(k) }, label);
    put(box,
      h("h3", { style: { marginTop: 0 } }, tr("calm.sound")),
      h("div.chips", chip("off", tr("calm.off"), now === "off"), chip("tones", tr("calm.tones"), tones), chip("pink", tr("calm.pink"), now === "pink")),
      tones && h("div.chips", { style: { marginTop: "8px" } }, ["tones-4", "tones-6", "tones-8"].map((k) => chip(k, k.slice(6) + " Hz", now === k))),
      tones && h("p.small", tr("calm.headphones"), " ", tr("calm.noClaim")),
      h("label.row.small", { style: { marginTop: "8px" } }, tr("calm.volume"),
        h("input", { type: "range", min: 0, max: 1, step: 0.05, "aria-label": tr("calm.volume"), oninput: (e) => { set({ volume: Number(e.target.value) }); calmAudio.setVolume(e.target.value); }, value: q.volume })),
      h("label.small", h("input", { type: "checkbox", checked: !!q.cue, onchange: (e) => set({ cue: e.target.checked }) }), " ", tr("calm.cue")));
  };
  draw();
  return box;
}

function viewCalm(arg) {
  // Sound keeps playing while you move between exercises, and stops when you leave Calm now.
  cleanup.push(() => { if (route().name !== "calm") calmAudio.stop(); });
  const scripts = calmScripts();
  const s = arg && scripts.find((x) => x.id === arg);
  if (s) return calmSession(s);
  return h("div.col", h("h1", tr("nav.calm")), h("p.muted", tr("calm.lead")), calmHelp(),
    h("div.card", scripts.map((x) => h("div.task",
      h("div.status", { "aria-hidden": "true" }, x.pace ? "◌" : "✋"),
      h("div.grow", h("a", { href: "#calm/" + x.id }, bi(x.title)), h("div.small.muted", `${x.minutes} ${tr("calm.min")}`)),
      h("a.btn", { href: "#calm/" + x.id }, tr("start"))))),
    soundPanel());
}

function calmSession(s) {
  const pace = s.pace?.inhale && s.pace?.exhale ? { hold: 0, ...s.pace } : null;
  const cycle = pace ? pace.inhale + pace.hold + pace.exhale : 0;
  const total = s.beats.reduce((n, b) => n + b.seconds, 0) * 1000;
  let elapsed = 0, last = performance.now(), paused = false, finished = false, phase = null, anim = null;
  const still = reducedMotion() || !Element.prototype.animate;
  const circle = h("div.breath", { "aria-hidden": "true" });
  const phaseEl = h("div.phase", { "aria-live": "polite" });
  const sayEl = h("p.say");
  const left = h("div.small.muted", { style: { fontVariantNumeric: "tabular-nums" } });
  const pauseBtn = h("button", { onclick: () => {
    paused = !paused; last = performance.now();
    pauseBtn.textContent = tr(paused ? "calm.resume" : "calm.pause");
    if (anim) paused ? anim.pause() : anim.play();
  } }, tr("calm.pause"));
  const stage = h("div.card.center",
    pace && circle, phaseEl, sayEl, left,
    pace && still && h("p.small.muted", tr("calm.motionOff")),
    h("div.row", { style: { justifyContent: "center", marginTop: "12px" } }, pauseBtn, h("button", { onclick: () => end() }, tr("calm.stop"))));
  if (pace && !still) {
    const a = pace.inhale / cycle, b = (pace.inhale + pace.hold) / cycle;
    anim = circle.animate(
      [{ transform: "scale(0.55)", offset: 0 }, { transform: "scale(1)", offset: a }, { transform: "scale(1)", offset: b }, { transform: "scale(0.55)", offset: 1 }],
      { duration: cycle * 1000, iterations: Math.ceil(total / (cycle * 1000)), easing: "ease-in-out" });
  }
  const step = () => {
    const now = performance.now();
    if (!paused && !finished) elapsed += now - last;
    last = now;
    if (elapsed >= total) return end();
    let t = elapsed / 1000, i = 0;
    while (i < s.beats.length - 1 && t >= s.beats[i].seconds) { t -= s.beats[i].seconds; i++; }
    const text = bi(s.beats[i])?.say ?? "";
    if (sayEl.textContent !== text) sayEl.textContent = text;
    left.textContent = mmss(total - elapsed);
    if (!pace) return;
    const c = (elapsed / 1000) % cycle;
    const p = c < pace.inhale ? "in" : c < pace.inhale + pace.hold ? "hold" : "out";
    if (p === phase) return;
    phase = p;
    phaseEl.textContent = tr("calm." + p);
    const q = calmPrefs();
    if (q.cue && !paused) calmAudio.cue(p, p === "in" ? pace.inhale : p === "out" ? pace.exhale : 0, q.volume);
  };
  const iv = setInterval(step, 200);
  cleanup.push(() => clearInterval(iv), () => anim?.cancel());
  function end() {
    if (finished) return;
    finished = true; clearInterval(iv); anim?.cancel();
    const after = h("div");
    const answers = [["better", () => h("p.small.muted", tr("calm.betterNote"))], ["same", () => null],
      ["heavy", () => [h("p", tr("calm.heavyNote")), careBox(false)]]];
    put(stage, h("h2", tr("calm.done")), h("p", tr("calm.howNow")),
      h("div.chips", { style: { justifyContent: "center" } }, answers.map(([k, show]) => h("button.chip", { "aria-pressed": "false", onclick: (e) => {
        e.currentTarget.parentElement.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === e.currentTarget)));
        put(after, show());
      } }, tr("calm." + k)))),
      after,
      h("div.row", { style: { justifyContent: "center", marginTop: "12px" } },
        h("button", { onclick: () => render() }, tr("calm.again")), h("a.btn", { href: "#calm" }, tr("calm.back"))));
  }
  step();
  return h("div.col", h("a.small", { href: "#calm" }, "← " + tr("calm.back")), h("h1", bi(s.title)),
    calmHelp(), stage, soundPanel());
}

// --- My Routine --------------------------------------------------------------------------------
// A day built from blocks, anchored to things you already do ("after lunch"). Today's 3 slot into the
// study blocks. No scores and no streaks; rest days are part of the plan. The share picture shows the
// day's shape only, never hours studied.

const BLOCKS = {
  wake: { icon: "☀", min: 0, group: "rest" }, chai: { icon: "☕", min: 15, group: "food" },
  study: { icon: "✎", min: 50, group: "focus", focus: true }, revision: { icon: "↺", min: 30, group: "focus", focus: true },
  mock: { icon: "⏱", min: 120, group: "focus" }, walk: { icon: "🚶", min: 20, group: "body" }, exercise: { icon: "🏃", min: 30, group: "body" },
  meal: { icon: "🍲", min: 30, group: "food" }, family: { icon: "♡", min: 45, group: "people" }, work: { icon: "💼", min: 480, group: "work" },
  winddown: { icon: "🌙", min: 30, group: "rest" }, sleep: { icon: "☾", min: 450, group: "rest" },
};
const B = (type, minutes = BLOCKS[type].min, at = "", after = "") => ({ type, minutes, at, after });
/** Starting points for the people the playbook has in mind. Everything is editable. */
const ROUTINE_TEMPLATES = {
  fulltime: { rest: [0], blocks: [B("wake", 0, "06:30"), B("chai", 15, "", "wake"), B("study", 90), B("meal", 30, "", "study"),
    B("study", 90), B("meal", 45, "13:30"), B("walk", 20, "", "lunch"), B("revision", 50), B("study", 50), B("family", 45), B("meal", 30, "20:30"), B("winddown", 30), B("sleep", 450, "22:30")] },
  working: { rest: [3], blocks: [B("wake", 0, "06:00"), B("chai", 15, "", "wake"), B("study", 50), B("meal", 20), B("work", 540, "09:00"),
    B("walk", 20, "", "work"), B("meal", 30), B("revision", 25, "", "dinner"), B("study", 50), B("winddown", 20), B("sleep", 420, "23:00")] },
  repeater: { rest: [0], blocks: [B("wake", 0, "07:00"), B("walk", 30, "", "wake"), B("chai", 15), B("revision", 50), B("study", 90),
    B("meal", 45, "13:00"), B("study", 50), B("exercise", 30), B("revision", 50), B("family", 45), B("winddown", 30), B("sleep", 450, "23:00")] },
  caring: { rest: [0], blocks: [B("wake", 0, "06:00"), B("family", 120, "", "wake"), B("study", 25), B("chai", 15), B("study", 25),
    B("meal", 45), B("family", 150), B("study", 50, "", "rest"), B("family", 120), B("revision", 25, "", "dinner"), B("winddown", 20), B("sleep", 450, "22:30")] },
  exam: { rest: [], blocks: [B("wake", 0, "06:30"), B("chai", 15), B("mock", 120, "09:30"), B("revision", 90), B("meal", 45, "13:30"),
    B("walk", 20, "", "lunch"), B("revision", 50), B("study", 50), B("family", 30), B("meal", 30), B("winddown", 45), B("sleep", 480, "22:00")] },
};
function routine() {
  const r = store.get("routine", { blocks: [], rest: [0] });
  if (r.blocks.some((b) => !b.id)) { r.blocks = withIds(r.blocks); store.set("routine", r); }
  return r;
}
const saveRoutine = (r) => store.set("routine", { createdOn: today(), ...r, updatedOn: today() });
const routineDone = (d = today()) => store.get("routineDay:" + d, []);
const isRestDay = (d = today()) => routine().rest.includes(new Date(d + "T12:00").getDay());
const withIds = (blocks) => blocks.map((b) => ({ id: b.id ?? randomId().slice(0, 8), ...b }));
const blockName = (b) => tr("b." + b.type);
/** Today's 3 go into the focus blocks in order: block id → task. */
function slots(r = routine()) {
  const open = TASKS.filter((t) => !dayState().done.includes(t.id));
  const out = {};
  r.blocks.filter((b) => BLOCKS[b.type]?.focus).forEach((b, i) => { if (open[i]) out[b.id] = open[i]; });
  return out;
}
/** The next block to do: skips blocks whose clock time has passed a later block's, and ticked ones. */
function nextBlock(r = routine()) {
  const done = routineDone(), hm = new Date().toTimeString().slice(0, 5);
  let from = 0;
  r.blocks.forEach((b, i) => { if (b.at && b.at <= hm) from = i; });
  return r.blocks.slice(from).find((b) => !done.includes(b.id) && b.type !== "wake" && b.type !== "sleep") ?? null;
}
function startBlock(b) {
  const task = slots()[b.id];
  if (task) { markStarted(task.id); focus.start(b.minutes || 25, task.title, "focus", task.id); location.hash = task.go; }
  else { focus.start(b.minutes || 25, blockName(b), "focus"); location.hash = "#focus"; }
}
function tickBlock(b) {
  const d = routineDone();
  store.set("routineDay:" + today(), d.includes(b.id) ? d.filter((x) => x !== b.id) : [...d, b.id]);
}

/** For Today: the next block, or a rest-day note. Nothing when there's no routine yet. */
function routineCard() {
  const r = routine();
  if (!r.blocks.length) return null;
  if (isRestDay()) return h("div.card.soft", h("strong", tr("routine.restToday")), h("div", h("a", { href: "#routine" }, tr("routine.open"))));
  const b = nextBlock(r);
  if (!b) return h("div.card", h("div.row.between", h("span", tr("routine.allDone")), h("a", { href: "#routine" }, tr("routine.open"))));
  const task = slots(r)[b.id];
  return h("div.card", h("div.row.between",
    h("div", h("div.small.muted", tr("routine.next")), h("strong", `${BLOCKS[b.type].icon} ${blockName(b)}`),
      h("div.small.muted", [b.at, b.after && tr("routine.afterX").replace("{x}", b.after), task?.title].filter(Boolean).join(" · "))),
    h("div.row", BLOCKS[b.type].focus && h("button.primary", { onclick: () => startBlock(b) }, tr("routine.go")),
      h("button", { onclick: () => { tickBlock(b); render(); } }, tr("routine.done")))));
}

/** One gentle suggestion for the week ahead, from what got ticked. Never a score. */
function weekSuggestion(r) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(today(), -i - 1)).filter((d) => !isRestDay(d));
  const focusIds = r.blocks.filter((b) => BLOCKS[b.type]?.focus).map((b) => b.id);
  const ticked = days.reduce((n, d) => n + routineDone(d).filter((id) => focusIds.includes(id)).length, 0);
  const has = (...types) => r.blocks.some((b) => types.includes(b.type));
  if (!r.rest.length) return { key: "rest", apply: (x) => ({ ...x, rest: [0] }) };
  if (focusIds.length && ticked < focusIds.length * days.length * 0.5 && r.blocks.some((b) => BLOCKS[b.type]?.focus && b.minutes > 25))
    return { key: "shorter", apply: (x) => { const blocks = x.blocks.map((b) => ({ ...b })); const long = blocks.filter((b) => BLOCKS[b.type]?.focus).sort((a, b) => b.minutes - a.minutes)[0]; long.minutes = 25; return { ...x, blocks }; } };
  if (!has("walk", "exercise")) return { key: "walk", apply: (x) => { const blocks = [...x.blocks]; const i = blocks.findIndex((b) => b.type === "meal"); blocks.splice(i + 1, 0, withIds([B("walk", 20, "", tr("routine.afterPh"))])[0]); return { ...x, blocks }; } };
  if (!has("winddown")) return { key: "winddown", apply: (x) => { const blocks = [...x.blocks]; const i = blocks.findIndex((b) => b.type === "sleep"); blocks.splice(i < 0 ? blocks.length : i, 0, withIds([B("winddown")])[0]); return { ...x, blocks }; } };
  return { key: "keep", apply: null };
}

function weeklyReview(r) {
  const d = new Date(), sunday = addDays(today(), -d.getDay());
  // A routine needs a week of living with it before there's anything to look back on.
  if (!r.blocks.length || !(r.createdOn <= addDays(today(), -6)) || d.getDay() > 1 || store.get("routineReview:" + sunday)) return null;
  const worked = h("textarea", { rows: 2 }), got = h("textarea", { rows: 2 });
  const s = weekSuggestion(r);
  const close = async (applied) => {
    store.set("routineReview:" + sunday, await vault.seal({ worked: worked.value.trim(), got: got.value.trim(), suggestion: s.key, applied }));
    if (applied && s.apply) saveRoutine(s.apply(routine()));
    render();
  };
  return h("div.card.soft", h("h2", { style: { marginTop: 0 } }, tr("routine.review")), h("p.small.muted", tr("routine.reviewLead")),
    h("h3", tr("routine.worked")), worked, h("h3", tr("routine.got")), got,
    h("h3", tr("routine.suggest")), h("p", tr("routine.s." + s.key)),
    h("div.row", s.apply && h("button.primary", { onclick: () => close(true) }, tr("routine.apply")),
      h("button", { onclick: () => close(false) }, s.apply ? tr("routine.skip") : tr("save"))));
}

/** A picture of the day's shape: coloured blocks in order, no clock times and no hours. */
function shareShape(r) {
  const W = 1200, H = 630, c = h("canvas", { width: W, height: H }), g = c.getContext("2d");
  const css = getComputedStyle(document.documentElement), v = (n) => css.getPropertyValue(n).trim();
  const COLORS = { focus: "#9A4E0E", body: "#2F7D4A", food: "#C99A2E", people: "#A8436A", work: "#6B5D52", rest: "#3E5C76" };
  g.fillStyle = v("--bg") || "#F7F2EA"; g.fillRect(0, 0, W, H);
  g.fillStyle = v("--ink") || "#221A14"; g.font = "600 44px " + (v("--ui-font") || "sans-serif");
  g.fillText(tr("routine.title"), 60, 100);
  const blocks = r.blocks.filter((b) => b.type !== "sleep");
  const sum = blocks.reduce((n, b) => n + Math.max(b.minutes, 10), 0), gap = 4;
  let x = 60;
  const width = W - 120 - gap * (blocks.length - 1);
  for (const b of blocks) {
    const w = (Math.max(b.minutes, 10) / sum) * width;
    g.fillStyle = COLORS[BLOCKS[b.type].group];
    g.beginPath(); g.roundRect(x, 200, w, 140, 4); g.fill();
    x += w + gap;
  }
  const groups = [...new Set(blocks.map((b) => BLOCKS[b.type].group))];
  g.font = "28px " + (v("--ui-font") || "sans-serif");
  let lx = 60;
  for (const gr of groups) {
    const names = [...new Set(blocks.filter((b) => BLOCKS[b.type].group === gr).map(blockName))].join(", ");
    g.fillStyle = COLORS[gr]; g.fillRect(lx, 400, 24, 24);
    g.fillStyle = v("--ink") || "#221A14"; g.fillText(names, lx + 34, 422);
    lx += 34 + g.measureText(names).width + 40;
    if (lx > W - 200) { lx = 60; g.translate(0, 50); }
  }
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = v("--muted") || "#6B5D52"; g.font = "24px " + (v("--ui-font") || "sans-serif");
  g.fillText("Aspiran", 60, H - 50);
  const a = h("a", { href: c.toDataURL("image/png"), download: "my-day-shape.png" });
  document.body.append(a); a.click(); a.remove();
}

function viewRoutine() {
  const r = routine();
  const save = () => { saveRoutine(r); };
  const sl = slots(r);
  const list = h("div");
  let dragFrom = null;
  const move = (i, j) => { if (j < 0 || j >= r.blocks.length) return; const [b] = r.blocks.splice(i, 1); r.blocks.splice(j, 0, b); save(); draw(); };
  const draw = () => put(list, r.blocks.length ? r.blocks.map((b, i) => {
    const info = BLOCKS[b.type];
    const minutes = h("input", { type: "number", min: 0, max: 720, step: 5, style: { width: "80px" }, "aria-label": tr("calm.min"), onchange: (e) => { b.minutes = Math.max(0, Math.min(720, Number(e.target.value) || 0)); save(); }, value: b.minutes });
    return h("div.rblock", { draggable: "true",
      ondragstart: (e) => { dragFrom = i; e.dataTransfer.effectAllowed = "move"; }, ondragover: (e) => e.preventDefault(),
      ondrop: (e) => { e.preventDefault(); if (dragFrom != null) move(dragFrom, i); dragFrom = null; } },
      h("span.grip", { "aria-hidden": "true" }, "⋮⋮"),
      h("strong", `${info.icon} ${blockName(b)}`),
      info.focus ? h("span.chips", [25, 50, 90].map((m) => h("button.chip", { "aria-pressed": String(b.minutes === m), onclick: () => { b.minutes = m; save(); draw(); } }, `${m}`)), minutes)
        : b.type !== "wake" && minutes,
      h("label.small", tr("routine.at"), " ", h("input", { type: "time", onchange: (e) => { b.at = e.target.value; save(); }, value: b.at || "" })),
      h("label.small", tr("routine.after"), " ", h("input", { type: "text", maxLength: 40, placeholder: tr("routine.afterPh"), style: { width: "140px" }, onchange: (e) => { b.after = e.target.value.trim(); save(); }, value: b.after || "" })),
      sl[b.id] && h("span.tag", sl[b.id].title),
      h("span.grow"),
      h("button.ghost", { "aria-label": tr("routine.up"), title: tr("routine.up"), onclick: () => move(i, i - 1) }, "↑"),
      h("button.ghost", { "aria-label": tr("routine.down"), title: tr("routine.down"), onclick: () => move(i, i + 1) }, "↓"),
      h("button.ghost", { "aria-label": tr("routine.remove"), title: tr("routine.remove"), onclick: () => { r.blocks.splice(i, 1); save(); draw(); } }, "✕"));
  }) : h("p.muted", tr("routine.empty")));
  draw();
  const wk = new Intl.DateTimeFormat(lang(), { weekday: "short" });
  const restChips = h("div.chips", [0, 1, 2, 3, 4, 5, 6].map((d) => h("button.chip", { "aria-pressed": String(r.rest.includes(d)), onclick: (e) => {
    r.rest = r.rest.includes(d) ? r.rest.filter((x) => x !== d) : [...r.rest, d].sort(); save();
    e.currentTarget.setAttribute("aria-pressed", String(r.rest.includes(d)));
  } }, wk.format(new Date(2026, 0, 4 + d)))));
  const useTemplate = (k) => {
    if (r.blocks.length && !confirm(tr("routine.replace"))) return;
    const tpl = ROUTINE_TEMPLATES[k];
    saveRoutine({ blocks: withIds(tpl.blocks.map((b) => ({ ...b, after: b.after && tr("a." + b.after) }))), rest: [...tpl.rest], persona: k, createdOn: today() });
    render();
  };
  const cards = libraryOf("routine");
  return h("div.col", h("h1", tr("routine.title")), h("p.muted", tr("routine.lead")),
    weeklyReview(r),
    h("div.card", h("h3", { style: { marginTop: 0 } }, tr("routine.templates")),
      h("div.chips", Object.keys(ROUTINE_TEMPLATES).map((k) => h("button.chip", { "aria-pressed": String(r.persona === k), onclick: () => useTemplate(k) }, tr("routine.p." + k))))),
    h("div.card", list,
      h("p.small.muted", tr("routine.today3")),
      h("h3", tr("routine.add")),
      h("div.chips", Object.entries(BLOCKS).map(([type, info]) => h("button.chip", { onclick: () => { r.blocks.push(withIds([B(type)])[0]); save(); draw(); } }, `${info.icon} ${tr("b." + type)}`)))),
    h("div.card", h("h3", { style: { marginTop: 0 } }, tr("routine.rest")), restChips, h("p.small.muted", tr("routine.restNote"))),
    r.blocks.length > 0 && h("div.card", h("button", { onclick: () => shareShape(routine()) }, tr("routine.share")), h("p.small.muted", tr("routine.shareNote"))),
    cards.length > 0 && h("div", h("h2", tr("routine.borrow")), h("p.small.muted", tr("routine.borrowNote")),
      cards.map((it) => {
        const d = it.data, t = d[lang()] ?? d.en;
        return h("details.card", h("summary", h("strong", bi(d.title)), h("div.small.muted", t.person)),
          h("p.small.muted", t.when),
          h("ul", t.blocks.map((b) => h("li", h("strong", b.time), " ", b.what))),
          t.borrow?.length && h("ul", t.borrow.map((x) => h("li", x))),
          h("p", h("strong", tr("routine.dontCopy") + ": "), t.dontCopy),
          t.question && h("p", h("strong", tr("routine.question") + ": "), t.question));
      })),
  );
}

X.init({ h, put, store, bi, lang, data, libraryOf, post, getJson, toast, plusOn, profile, paused, resultMode, careRecently, mcqBlock, mcqOf, addMiss, gotRight, shuffle, today, addDays, render: () => render() });
TRY.init({ h, put, store, lang, profile, today, toast, careBox: () => careBox(false) });
BR.init({ h, put, store, bi, lang, libraryOf, mcqBlock, today, pauseLine, readAloud });

const VIEWS = {
  adda: viewAdda, commons: viewCommons, pod: viewPod, rooms: viewRooms, chotu: viewChotu,
  prep: viewToday, today: viewToday, review: viewReview, map: viewMap, vine: viewVine, close: viewClose, chai: viewChai, practice: viewPractice, prelims: viewPrelims, mains: viewMains, essay: viewEssay, interview: viewInterview, walk: viewWalk, print: viewPrint, optional: viewOptional, terms: viewTerms, room: viewRoom, casefile: viewCaseFile, progress: viewProgress,
  skeletons: BR.viewSkeletons, cases: BR.viewCases, csat: BR.viewCsat, sheets: BR.viewSheets, talks: BR.viewTalks,
  learn: X.viewLearn, try: TRY.viewTry, upgrade: X.viewUpgrade, ptest: X.viewWeeklyTest, pcompile: X.viewCompilation, insights: X.viewInsights, revise: X.viewRevise,
  mock: viewMock, read: viewRead, focus: viewFocus, plan: viewPlan, routine: viewRoutine, roadmap: viewRoadmap,
  me: viewMe, path: viewMe, profile: viewProfile, rhythm: viewRhythm, stamps: viewStamps, privacy: viewPrivacy, plus: viewPlus, gift: viewGift, paid: viewPaid, receipts: viewReceipts,
  shelf: viewShelf, compass: viewCompass, cost: viewCost, maps: viewMaps, thinker: viewThinker,
  talk: viewTalk, calm: viewCalm,
};

/** A 403 account_suspended from any call, or from /me/status: close live connections and drop cached server content. */
function onAccountSuspended() {
  try { pod.ws?.close(); commonsLeave(); } catch {}
  for (const k of ["podSummary", "podSeen", "podMovedNote", "podJoinedOn", "podInResult"]) store.del(k);
  try { Object.keys(localStorage).filter((k) => k.startsWith("upsc:cache:")).forEach((k) => localStorage.removeItem(k)); } catch {}
  globalThis.caches?.delete("upsc-data").catch(() => {});
  render();
}

// Keep the big focus timer ticking without re-rendering the page.
setInterval(() => { const el = $("#focusBig"); const f = focus.active; if (el && f) el.textContent = mmss(f.endsAt - Date.now()); }, 1000);

// --- Start -------------------------------------------------------------------------------------

applyTheme(themeChoice());
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
await Promise.all([loadAll(), P.loadProfile(), Auth.init(config.auth, { onSuspend: onAccountSuspended })]);
// Content needs sign-in: if the first load ran before the token was ready (so it fell back to the copy saved on the
// device, which can be days old), load again now that it is.
if (Auth.signedIn() && (loadedFromCache || !(data.library?.items?.length))) await loadAll();
// The access check: on open (waiting at most a few seconds) and when the tab comes back, at most every 6 hours.
await Promise.race([runAccessCheck(false), new Promise((r) => setTimeout(r, 4000))]);
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && profile()) runAccessCheck(false); });
window.addEventListener("online", () => { drawOffline(); if (profile()) runAccessCheck(access.state.startsWith("offline")).then(drawOffline); });
window.addEventListener("offline", drawOffline);
if (profile()) checkStamps();
M.setMember(() => profile()?.memberId ?? Auth.session()?.memberId ?? null, () => (Auth.signedIn() ? Auth.getToken() : Promise.resolve(null)));
render();
M.boot();
