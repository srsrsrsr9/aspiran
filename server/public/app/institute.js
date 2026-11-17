// Aspiran for coaching centres, the student side (server/src/institutes.ts; plan in
// artefacts/coaching-centres-plan-2026-11-14.md). Behind the `institutes` flag, off by default.
//
// A student joins with a code from their institute (#inst or #inst/<code>), then sees their institute's name, colour and
// logo, its announcements and batch chat, their doubts, the institute's study plan, its notes and question sets, and
// their own progress. Never anyone else's numbers. No timers, streaks or scores to compare. Messages and doubts that
// look like distress are never posted: the server holds them and Aspiran's care team is told, not the institute.

import * as Auth from "./auth.js";
import { NODES, PAPERS } from "./syllabus.js";

let C = null;
/** The /inst/me answer, cached on the device so the brand shows offline. */
let me = null;
const tab = { now: "today" };

/** app.js hands over its helpers once at start. */
export function init(ctx) {
  C = ctx;
  me = C.store.get("inst:me") ?? null;
  if (enabled()) refresh();
}
/** On only when the admins switched the flag on (default off). */
export const enabled = () => C?.config?.()?.flags?.institutes === true && Auth.signedIn();
const h = (...a) => C.h(...a);
const put = (...a) => C.put(...a);

async function api(path, body) {
  const t = await Auth.getToken();
  const r = await fetch(path, { method: body ? "POST" : "GET", headers: { "content-type": "application/json", ...(t ? { authorization: "Bearer " + t } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(d.error ?? "Couldn't reach your institute. Try again."), { status: r.status });
  return d;
}
/** Reload who I am in my institute; re-render if it changed (brand, batch, joined or left). */
export async function refresh() {
  if (!enabled()) return;
  try {
    const d = await api("/inst/me");
    const next = d.institute ? d : null;
    const changed = JSON.stringify(next) !== JSON.stringify(me);
    me = next; C.store.set("inst:me", next);
    if (changed) C.render();
  } catch {}
}
export const current = () => (enabled() ? me : null);

/** The side rail's brand: the institute's logo and name, "with Aspiran". Null when not in an institute. */
export function brandLine() {
  const m = current();
  if (!m?.institute) return null;
  return h("a.brand.inst-brand", { href: "#inst", title: m.institute.name + " with Aspiran" },
    m.institute.logo && h("img", { src: m.institute.logo, alt: "", width: 28, height: 28 }),
    h("span", h("span.inst-name", m.institute.name), h("span.inst-with", "with Aspiran")));
}
/** A card for Me: join, or open your institute. */
export function meCard() {
  if (!enabled()) return null;
  const m = current();
  return h("a.card.link", { href: "#inst" }, h("div.row.between", h("div", h("strong", m ? m.institute.name : "Coaching centre"),
    h("div.small.muted", m ? "Announcements, your batch chat, doubts, the plan and your institute's notes" : "Joined a coaching centre that uses Aspiran? Use its code here")), h("span", "→")));
}

/** White or near-black text on the institute's colour, whichever reads better. */
function inkFor(hex) {
  if (!/^#[0-9a-f]{6}$/i.test(hex ?? "")) return null;
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4 ? "#1A1410" : "#FFFFFF";
}
const when = (iso) => (iso ? new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "");
const dayName = (d) => new Date(d + "T00:00:00+05:30").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
const act = (fn) => async (e) => { const b = e?.currentTarget; if (b) b.disabled = true; try { await fn(e); } catch (err) { C.toast(err.message); } finally { if (b) b.disabled = false; } };

// --- The view ------------------------------------------------------------------------------------------------------

export function viewInst(arg = "") {
  if (!enabled()) return h("div.col", h("h1", "Coaching centre"), h("div.card.soft", h("p", "Coaching centres aren't open on Aspiran yet.")));
  const root = h("div.col.inst");
  refresh();
  const draw = () => {
    const m = current();
    if (m?.institute?.color) { root.style.setProperty("--brand", m.institute.color); root.style.setProperty("--brand-ink", inkFor(m.institute.color)); }
    if (!m) return put(root, joinView(arg));
    if (m.paused) return put(root, header(m), h("div.card.soft", h("p", `${m.institute.name} has paused its Aspiran space for now. Everything of yours in Aspiran itself is untouched.`)));
    if (m.role !== "student") return put(root, header(m), h("div.card", h("p", `You're ${m.role === "teacher" ? "a teacher" : "an " + m.role} at ${m.institute.name}. Your tools are in the console.`), h("a.btn.primary", { href: "/institute", target: "_blank" }, "Open the console")), leaveCard(m));
    const TABS = [["today", "Plan"], ["chat", "Chat"], ["doubts", "Doubts"], ["content", "Notes and sets"], ["you", "Your progress"]];
    const body = h("div");
    put(root, header(m), h("div.chips", { role: "tablist" }, TABS.map(([id, label]) => h("button.chip" + (tab.now === id ? ".on" : ""), { role: "tab", "aria-selected": String(tab.now === id), onclick: () => { tab.now = id; draw(); } }, label))), body);
    const v = { today: planView, chat: chatView, doubts: doubtsView, content: contentView, you: youView }[tab.now] ?? planView;
    v(body, m);
  };
  draw();
  return root;
}
const header = (m) => h("div.inst-head", m.institute.logo && h("img", { src: m.institute.logo, alt: "", width: 48, height: 48 }),
  h("div", h("h1", { style: { margin: 0 } }, m.institute.name), h("div.small.muted", [m.batch?.name, "with Aspiran"].filter(Boolean).join(" · "))));
const loading = (box) => put(box, h("p.small.muted", "Loading…"));
const failed = (box, e) => put(box, h("div.card.soft", h("p", e.message)));

function joinView(arg) {
  const code = h("input", { type: "text", value: arg.toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/^(.{4})(.+)$/, "$1-$2"), placeholder: "KXR7-M2PD", maxLength: 9, autocapitalize: "characters", "aria-label": "Code" });
  const name = h("input", { type: "text", value: C.profile()?.name ?? "", maxLength: 40, "aria-label": "Your name for the institute" });
  const ok = h("input", { type: "checkbox" }), adult = h("input", { type: "checkbox" });
  return h("div.col", h("h1", "Join your coaching centre"),
    h("div.card", h("p", "If your coaching centre uses Aspiran, it gives you a code. Joining adds its plan, chat and notes to your Aspiran. Your pod, Chotu and everything else stay as they are."),
      h("label.small.muted", "Code"), code, h("label.small.muted", { style: { marginTop: "8px", display: "block" } }, "Your name, as the institute should see it"), name,
      h("div.card.soft", { style: { marginTop: "12px" } }, h("strong", "What your institute will see"),
        h("p.small", "Your name, your batch, the days you used Aspiran and your focus minutes since joining, your answers to its question sets and tests, your doubts, and your messages in its chat."),
        h("strong", "What it never sees"),
        h("p.small", "Your email or phone, your pod and Chotu chats, your journal, your own practice and mocks, or anything from before you joined. You can leave at any time; your answers to its sets go with you.")),
      h("p", h("label", ok, " I've read this and I'm happy to join.")), h("p", h("label", adult, " I'm 18 or older.")),
      h("button.primary", { onclick: act(async () => {
        const d = await api("/inst/join", { code: code.value, displayName: name.value, consent: ok.checked, adult: adult.checked });
        C.toast(`Welcome to ${d.institute.name}.`); history.replaceState(null, "", "#inst"); await refresh(); C.render();
      }) }, "Join")));
}

// --- Plan ---------------------------------------------------------------------------------------------------------------
function planView(box) {
  loading(box);
  api("/inst/plan").then(({ plans, today }) => {
    if (!plans.length) return put(box, h("div.card.soft", h("p", "No plan from your institute yet.")));
    put(box, plans.map((p) => {
      const days = [...new Set(p.items.map((i) => i.day))];
      const upcoming = days.filter((d) => d >= today), past = days.filter((d) => d < today);
      const dayCard = (d) => h("div.card" + (d === today ? "" : ".soft"), h("strong", d === today ? "Today" : dayName(d)),
        p.items.filter((i) => i.day === d).map((i) => itemRow(i)));
      const itemRow = (i) => {
        const box2 = h("input", { type: "checkbox", checked: i.done, "aria-label": "Done: " + i.title });
        box2.onchange = act(async () => { await api("/inst/plan/done", { itemId: i.id, done: box2.checked }); i.done = box2.checked; });
        const open = i.contentId ? h("button.ghost.small", { onclick: () => { tab.now = "content"; openPiece(i.contentId); } }, "Open") : null;
        return h("div.row", { style: { padding: "6px 0" } }, h("label.row.grow", box2, h("span", h("span.tag", i.kind), " ", i.title, i.topic && i.topic !== i.title ? h("span.small.muted", " · " + i.topic) : null, i.note && h("div.small.muted", i.note))), open);
      };
      return h("div", h("h3", p.title, p.forYou && h("span.tag", "just for you")), upcoming.slice(0, 7).map(dayCard),
        past.length > 0 && h("details", h("summary", "Earlier days"), past.reverse().map(dayCard)));
    }), h("p.small.muted", "Tick what you've done. Nobody else sees your ticks; your teachers see how much of the plan you've done."));
  }).catch((e) => failed(box, e));
}

// --- Chat ---------------------------------------------------------------------------------------------------------------
let chatTimer = null;
function chatView(box, m) {
  loading(box);
  let last = "", messages = [];
  const list = h("div.card.chat", { "aria-live": "polite" });
  const input = h("textarea", { rows: 2, maxLength: 1000, placeholder: "Write to your batch" });
  const ann = h("div");
  const paint = () => put(list, messages.length ? messages.map((x) => h("div.msg",
    h("div.row.between", h("span", h("strong", x.mine ? "You" : x.name), x.role === "teacher" && h("span.tag", "teacher")), h("span.small.muted", when(x.at))),
    h("div", x.text), !x.mine && h("button.ghost.small", { onclick: act(async () => { const why = prompt("What's wrong with this message? Your teachers will see it."); if (why === null) return; await api("/inst/chat/report", { id: x.id, reason: why }); C.toast("Reported to your teachers."); }) }, "Report")))
    : h("p.small.muted", "No messages yet. Say hello."));
  const load = async () => {
    const d = await api("/inst/feed" + (last ? "?after=" + encodeURIComponent(last) : ""));
    if (!d.batch) { put(box, h("div.card.soft", h("p", "You're not in a batch yet. Ask your institute."))); return false; }
    if (!last) put(ann, d.announcements.map((a) => h("div.card", { style: { borderColor: "var(--brand)" } }, h("div.row.between", h("strong", "📌 " + a.name), h("span.small.muted", when(a.at))), h("div", a.text))));
    messages = [...messages, ...d.messages.filter((x) => !messages.some((y) => y.id === x.id))].slice(-200);
    if (messages.length) last = messages.at(-1).at;
    paint();
    return true;
  };
  const send = act(async () => {
    const d = await api("/inst/chat", { text: input.value });
    if (d.held) { put(box, C.careBox(), h("button", { onclick: () => chatView(box, m) }, "Back to the chat")); return; }
    input.value = ""; await load();
  });
  load().then((ok) => {
    if (!ok) return;
    put(box, ann, h("h3", m.batch?.name ?? "Your batch"), list, h("div.row", h("div.grow", input), h("button.primary", { onclick: send }, "Send")),
      h("p.small.muted", "Your batch and your teachers see this chat. Be kind; teachers can hide messages."));
    clearInterval(chatTimer);
    // New messages every 10 seconds while the chat is on screen.
    chatTimer = setInterval(() => { if (!document.body.contains(list)) return clearInterval(chatTimer); if (document.visibilityState === "visible") load().catch(() => {}); }, 10_000);
    C.onLeave?.(() => clearInterval(chatTimer));
  }).catch((e) => failed(box, e));
}

// --- Doubts -------------------------------------------------------------------------------------------------------------
function topicSelect() {
  return h("select", { "aria-label": "Topic (optional)" }, h("option", { value: "" }, "Topic (optional)"),
    PAPERS.map((p) => h("optgroup", { label: p.short }, NODES.filter((n) => n.paper.id === p.id).map((n) => h("option", { value: n.id }, n.name)))));
}
function doubtsView(box) {
  loading(box);
  const text = h("textarea", { rows: 3, maxLength: 2000, placeholder: "What's the doubt? A sentence or two is enough." });
  const topic = topicSelect(), photo = h("input", { type: "file", accept: "image/jpeg", "aria-label": "A photo (JPEG, optional)" });
  const ask = act(async () => {
    let pic = null;
    const f = photo.files[0];
    if (f) {
      if (f.type !== "image/jpeg") throw new Error("Photos need to be JPEG.");
      if (f.size > 1_500_000) throw new Error("That photo is too big. Under 1.5 MB, please.");
      const bytes = new Uint8Array(await f.arrayBuffer()); let s = "";
      for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      pic = { mime: "image/jpeg", data: btoa(s) };
    }
    const d = await api("/inst/doubts", { text: text.value, nodeId: topic.value || null, photo: pic });
    if (d.held) { put(box, C.careBox(), h("button", { onclick: () => doubtsView(box) }, "Back to doubts")); return; }
    C.toast(d.aiAnswered ? "Sent. Aspiran left a first answer; your teacher will follow." : "Sent to your teachers."); doubtsView(box);
  });
  api("/inst/doubts").then(({ doubts }) => put(box,
    h("div.card", h("h3", { style: { marginTop: 0 } }, "Ask a doubt"), text, h("div.row", { style: { marginTop: "8px" } }, topic, photo), h("button.primary", { style: { marginTop: "8px" }, onclick: ask }, "Send to my teachers")),
    doubts.length ? doubts.map((d) => doubtCard(d)) : h("p.small.muted", "Your doubts show here. Only you and your teachers see them.")))
    .catch((e) => failed(box, e));
}
const STATUS = { open: "waiting", answered: "answered", resolved: "resolved" };
function doubtCard(d) {
  const more = h("div");
  const open = act(async () => {
    const { replies } = await api(`/inst/doubts/${d.id}`);
    let img = null;
    if (d.photo) { const r = await fetch(`/inst/doubts/${d.id}/photo`, { headers: { authorization: "Bearer " + (await Auth.getToken()) } }); if (r.ok) img = h("img", { src: URL.createObjectURL(await r.blob()), alt: "Your photo", style: { maxWidth: "100%", borderRadius: "8px" } }); }
    const reply = h("textarea", { rows: 2, maxLength: 3000, placeholder: "Still unclear? Ask again here." });
    put(more, img, replies.map((r) => h("div.msg", h("div.row", h("strong", r.role === "student" ? "You" : r.name), r.role === "ai" && h("span.ai-tag", "first answer"), r.role === "teacher" && h("span.tag", "teacher"), h("span.small.muted", when(r.at))),
      h("div", r.text), r.role === "ai" && h("p.small.muted", "A quick first answer from Aspiran. Your teacher checks doubts too."))),
      h("div.row", h("div.grow", reply), h("button", { onclick: act(async () => { const x = await api(`/inst/doubts/${d.id}/reply`, { text: reply.value }); if (x.held) { put(more, C.careBox()); return; } d.status = "open"; open(); }) }, "Send")),
      d.status !== "resolved" ? h("button.ghost.small", { onclick: act(async () => { await api(`/inst/doubts/${d.id}/status`, { status: "resolved" }); d.status = "resolved"; C.toast("Marked as cleared."); }) }, "This is cleared up") : null);
  });
  return h("div.card", h("div.row.between", h("span", h("span.tag", STATUS[d.status] ?? d.status), d.topic && h("span.small.muted", " " + d.topic)), h("span.small.muted", when(d.updatedAt))),
    h("p", d.text), more, h("button.ghost.small", { onclick: open }, "Open"));
}

// --- Notes and question sets ------------------------------------------------------------------------------------------
let pendingPiece = null;
function openPiece(id) { pendingPiece = id; C.render(); }
function contentView(box) {
  if (pendingPiece) { const id = pendingPiece; pendingPiece = null; return pieceView(box, id); }
  loading(box);
  api("/inst/content").then(({ items }) => put(box, items.length ? items.map((c) => h("button.card.link", { style: { textAlign: "left", width: "100%" }, onclick: () => pieceView(box, c.id) },
    h("div.row.between", h("div", h("strong", c.title), h("div.small.muted", [c.kind === "note" ? "Note" : c.kind === "test" ? "Test (one go)" : "Practice set", c.topic, c.questions ? `${c.questions} questions` : null, c.attempts ? "done" : null].filter(Boolean).join(" · "))), h("span", "→"))))
    : h("div.card.soft", h("p", "Your institute hasn't shared notes or question sets yet.")))).catch((e) => failed(box, e));
}
function pieceView(box, id) {
  loading(box);
  const back = h("button.ghost.small", { onclick: () => contentView(box) }, "← All notes and sets");
  api(`/inst/content/${id}`).then((c) => {
    const hi = C.lang?.() === "hi";
    if (c.kind === "note") {
      const text = (hi && c.data.hi?.body) || c.data.en?.body || "";
      return put(box, back, h("div.card", h("h2", { style: { marginTop: 0 } }, c.title), c.topic && h("p.small.muted", c.topic), text.split(/\n{2,}/).map((p) => h("p", p))));
    }
    const qs = c.data.questions;
    if (c.taken) return put(box, back, h("h2", c.title), h("p", `You got ${c.taken.right} of ${c.taken.total}. Here's each one again.`), reviewList(qs, c.taken.review, hi));
    const chosen = qs.map(() => null);
    const list = h("div", qs.map((q, i) => {
      const t = (hi && q.hi) || q.en;
      return h("fieldset.card", h("legend", h("strong", `${i + 1}. `), t.question), t.options.map((o, j) => h("label", { style: { display: "block", padding: "4px 0" } },
        h("input", { type: "radio", name: "q" + i, onchange: () => (chosen[i] = j) }), " ", o)));
    }));
    put(box, back, h("h2", c.title), h("p.small.muted", c.kind === "test" ? "A test: one go, marked when you finish. Your teachers see your answers; nobody else does." : "Practice: answer, then see each explanation. Your teachers see how you did; nobody else does."),
      list, h("button.primary", { onclick: act(async () => {
        const r = await api("/inst/attempts", { contentId: c.id, answers: chosen });
        put(box, back, h("h2", c.title), h("p", `You got ${r.right} of ${r.total}.`), reviewList(qs, r.review, hi));
        window.scrollTo(0, 0);
      }) }, "Finish and see answers"));
  }).catch((e) => put(box, back, h("div.card.soft", h("p", e.message))));
}
function reviewList(qs, review, hi) {
  return review.map((r, i) => {
    const t = (hi && qs[i]?.hi) || qs[i].en;
    return h("div.card", h("p", h("strong", `${i + 1}. `), t.question), h("p", r.chosen === null ? "Skipped." : r.right ? "✓ Right." : `✗ You chose ${t.options[r.chosen] ?? "—"}.`),
      h("p", "Answer: ", h("strong", t.options[r.answerIndex])), (hi && r.hiExplanation) || r.explanation ? h("p.small", (hi && r.hiExplanation) || r.explanation) : null);
  });
}

// --- Your own progress (only yours) --------------------------------------------------------------------------------------
function youView(box, m) {
  loading(box);
  api("/inst/progress").then(({ you: s }) => put(box,
    h("p.small.muted", `Only you and your teachers at ${m.institute.name} see this. Since you joined.`),
    h("div.card", h("div.row.between", h("span", "Days you used Aspiran (last 14)"), h("strong", String(s.daysActive14))),
      h("div.row.between", h("span", "Focus minutes"), h("strong", String(s.focusMinutes))),
      h("div.row.between", h("span", "Questions answered in your institute's sets"), h("strong", String(s.answered))),
      s.accuracy != null && h("div.row.between", h("span", "Right first time"), h("strong", s.accuracy + "%")),
      h("div.row.between", h("span", "Plan items done"), h("strong", `${s.planDone} of ${s.planDue} so far`)),
      h("div.row.between", h("span", "Doubts cleared"), h("strong", `${s.doubtsResolved} of ${s.doubtsRaised}`))),
    s.weakTopics.length > 0 && h("div.card", h("h3", { style: { marginTop: 0 } }, "Worth another look"), h("p.small.muted", "Topics where under 60% of your answers were right (at least 5 answers)."),
      s.weakTopics.map((w) => h("div.row.between", h("span", w.topic), h("span.small.muted", `${w.pct}% of ${w.answered}`)))),
    leaveCard(m))).catch((e) => failed(box, e));
}
function leaveCard(m) {
  return h("details.card", h("summary", "Leave " + m.institute.name),
    h("p.small", "Leaving removes you from its chat, plan and analytics. Your answers to its sets are deleted; your doubts and messages stay without your name. Your Aspiran account, pod and practice are untouched."),
    h("button", { onclick: act(async () => { if (!confirm(`Leave ${m.institute.name}?`)) return; await api("/inst/leave", {}); me = null; C.store.set("inst:me", null); C.toast("You've left."); C.render(); }) }, "Leave"));
}

// Small styles of its own, so the app's stylesheet doesn't change.
const css = `.inst-head{display:flex;gap:12px;align-items:center}.inst-head img{border-radius:10px;object-fit:contain}
.inst .chip.on{background:var(--brand);color:var(--brand-ink);border-color:var(--brand)}
.inst-brand{display:flex;gap:8px;align-items:center;text-decoration:none}.inst-brand img{border-radius:6px;object-fit:contain}
.inst-brand .inst-name{display:block;line-height:1.1}.inst-brand .inst-with{display:block;font-size:11px;font-weight:400;opacity:.75}
.inst fieldset.card{border:1px solid var(--line)}`;
if (typeof document !== "undefined" && !document.getElementById("inst-css")) document.head.append(Object.assign(document.createElement("style"), { id: "inst-css", textContent: css }));
