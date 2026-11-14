// End-to-end smoke test against a running local server: `npm run dev`, then
// EDITOR_TOKEN=... node test/smoke.mjs   (the token from your .dev.vars)
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";

const BASE = process.env.BASE ?? "http://127.0.0.1:8787";
const TOKEN = process.env.EDITOR_TOKEN;
if (!TOKEN) throw new Error("Set EDITOR_TOKEN to the value in your .dev.vars");
// These suites test matched pods, so switch them on (rooms.ts): below the sign-up threshold /pods/join refuses.
await fetch(BASE + "/admin/api/growth/threshold", { method: "POST", headers: { "content-type": "application/json", authorization: "Bearer " + TOKEN }, body: JSON.stringify({ signupThreshold: 0 }) });

const call = async (path, { method = "GET", body, auth = true } = {}) => {
  const res = await fetch(BASE + path, {
    method,
    headers: { "content-type": "application/json", ...(auth ? { authorization: "Bearer " + TOKEN } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
};

const step = (name) => console.log("✓", name);
const rid = () => crypto.randomUUID().replace(/-/g, "");

assert.equal((await call("/health")).data.ok, true);
step("health");

assert.equal((await call("/desk/api/queue", { auth: false })).status, 401);
step("desk refuses without a token");

// Pods: two members in the same bucket land in the same pod. A fresh bucket per run, so the pod is new.
const a = rid(), b = rid(), c = rid();
const bucket = { stage: "smoke" + rid().slice(0, 8), language: "english" };
const podA = (await call("/pods/join", { method: "POST", body: { memberId: a, ...bucket } })).data.podId;
const podB = (await call("/pods/join", { method: "POST", body: { memberId: b, ...bucket } })).data.podId;
assert.ok(podA && podA === podB);
step("two members matched into one pod");

assert.equal((await call(`/pods/${podA}/ws?member=${rid()}&name=X`)).status, 403);
step("non-members can't open the pod");

function connect(member, name) {
  const ws = new WebSocket(`${BASE.replace("http", "ws")}/pods/${podA}/ws?member=${member}&name=${name}`);
  const events = [];
  const waiters = [];
  ws.onmessage = (e) => {
    const ev = JSON.parse(e.data);
    events.push(ev);
    waiters.splice(0).forEach((w) => w());
  };
  const next = async (pred, ms = 5000) => {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) {
      const hit = events.find(pred);
      if (hit) { events.splice(events.indexOf(hit), 1); return hit; }
      await new Promise((r) => { waiters.push(r); setTimeout(r, 200); });
    }
    throw new Error("timed out waiting for event");
  };
  return new Promise((res, rej) => { ws.onopen = () => res({ ws, next, send: (o) => ws.send(JSON.stringify(o)) }); ws.onerror = rej; });
}

const meera = await connect(a, "Meera");
const first = await meera.next((e) => e.type === "history");
assert.equal(first.youAreLead, true, "the first member to join leads");
const arjun = await connect(b, "Arjun");
const hist = await arjun.next((e) => e.type === "history");
assert.ok(hist.online.includes("Meera"));
step("history and presence on connect");

meera.send({ type: "say", text: "Polity revision at 7?", clientId: "c1" });
const got = await arjun.next((e) => e.type === "msg" && e.message.text === "Polity revision at 7?");
assert.equal(got.message.name, "Meera");
step("chat message reaches the other member");

arjun.send({ type: "chai_ping" });
await meera.next((e) => e.type === "msg" && e.message.kind === "ping");
step("chai ping");

meera.send({ type: "room_start", minutes: 25 });
const room = await arjun.next((e) => e.type === "room" && e.room?.studying.includes("Meera"));
assert.equal(room.room.minutes, 25);
arjun.send({ type: "room_join" });
await meera.next((e) => e.type === "room" && e.room?.studying.includes("Arjun"));
step("study room start and join");

arjun.send({ type: "say", text: "honestly I want to die, nothing is working" });
const care = await arjun.next((e) => e.type === "care");
assert.ok(care.helplines.some((h) => h.number === "+91 9999 666 555"));
step("Guardian sends the writer a private care message");

meera.send({ type: "report", id: got.message.id, reason: "test" });
await meera.next((e) => e.type === "reported");
const reports = (await call("/mod/api/reports")).data;
assert.ok(reports[0].kind === "distress", "distress alerts sort first");
const report = reports.find((r) => r.kind === "report");
await call(`/mod/api/reports/${report.id}`, { method: "POST", body: { action: "hide" } });
await arjun.next((e) => e.type === "hidden" && e.id === got.message.id);
step("report → moderator hides the message for everyone");

// Pod lead: "Ask the lead privately" and the favours strip.
assert.equal(hist.lead, "Meera");
assert.equal(hist.youAreLead, false);
assert.equal((await call("/pods/join", { method: "POST", body: { memberId: c, ...bucket } })).data.podId, podA);
const sana = await connect(c, "Sana");
await sana.next((e) => e.type === "history");
arjun.send({ type: "ask_lead", text: "Can I ask you about my answer writing?" });
const note = await meera.next((e) => e.type === "private" && e.message.text.startsWith("Can I ask"));
assert.equal(note.message.to, a);
await arjun.next((e) => e.type === "private");
arjun.send({ type: "lead_reply", to: c, text: "not the lead" });
meera.send({ type: "lead_reply", to: b, text: "Of course. Send me one tonight." });
await arjun.next((e) => e.type === "private" && e.message.text.startsWith("Of course"));
await assert.rejects(sana.next((e) => e.type === "private", 1500), "other members never see private notes");
await assert.rejects(sana.next((e) => e.type === "private" && e.message.text === "not the lead", 500));
step("private notes reach only the member and the lead");

const again = await connect(b, "Arjun");
const back = await again.next((e) => e.type === "history");
assert.equal(back.private.length, 2);
again.ws.close();
step("private notes come back in history, for that member only");

arjun.send({ type: "ask_lead", text: "I want to die, I can't do this" });
await arjun.next((e) => e.type === "care");
step("Guardian still checks private notes");

sana.send({ type: "say", kind: "favour", text: "Could someone review my intro?", clientId: "f1" });
const fav = await meera.next((e) => e.type === "msg" && e.message.kind === "favour");
assert.equal(fav.message.name, "Sana");
step("favours strip posts a favour");

assert.equal((await call(`/mod/api/pods/${podA}/lead`, { method: "POST", body: { memberId: c, name: "Sana" } })).data.ok, true);
const sana2 = await connect(c, "Sana");
assert.equal((await sana2.next((e) => e.type === "history")).youAreLead, true);
sana2.ws.close(); sana.ws.close();
step("a moderator can change the pod lead");

// News desk: seed notes, add a story, edit, approve, publish.
assert.ok((await call("/desk/api/notes/seed", { method: "POST" })).data.added >= 10);
step("starter notes loaded");

const story = await call("/desk/api/stories", {
  method: "POST",
  body: { title: "Cabinet approves new scheme for rural roads", sourceName: "PIB", sourceUrl: "https://pib.gov.in/", text: "The Union Cabinet approved a scheme to build 25000 km of rural roads by 2028 under the Ministry of Rural Development." },
});
const id = story.data.id;
let q = (await call("/desk/api/queue")).data;
let cand = q.candidates.find((c) => c.id === id);
assert.ok(cand, "story is queued");
step(`story drafted (${cand.flags[0] ?? "AI draft"})`);

const card = { ...cand.card, summary: cand.card.summary || "The Union Cabinet approved a scheme to build 25000 km of rural roads by 2028.", whyForUpsc: ["Rural infrastructure is a GS3 topic."], chotu: "This should be stripped unless the card is light." };
card.tone = "neutral";
const edit = (await call(`/desk/api/cards/${id}`, { method: "POST", body: { card } })).data;
assert.equal(edit.ok, true);
q = (await call("/desk/api/queue")).data;
cand = q.candidates.find((c) => c.id === id);
assert.equal(cand.card.chotu, null, "jokes are stripped on non-light cards");
step("edit saves, joke stripped on a neutral card");

// Approvals always show "Editorial team" (owner, 4 Nov 2026), so no name is needed.
await call(`/desk/api/cards/${id}/approve`, { method: "POST", body: { lang: "en", editor: "Test Editor" } });
const pub = (await call("/desk/api/publish", { method: "POST" })).data;
assert.equal(pub.published, true);
step("approved and published");

const brief = (await call("/brief/latest", { auth: false })).data;
const item = brief.items.find((i) => i.id === id);
assert.equal(item.checkedBy, "Editorial team");
assert.equal(item.hi, undefined, "unapproved Hindi is not shipped");
step("public brief carries the editor's check, no unapproved Hindi");

// Library: a desk-written item ships only after approval, and Hindi only after a Hindi editor.
const lib = (await call("/desk/api/library/new", { method: "POST", body: { kind: "myth" } })).data.id;
const draft = (await call("/desk/api/library")).data.find((r) => r.id === lib);
const myth = { ...draft.data, claims: [{ verdict: "MYTH", en: { claim: "Smoke claim", correction: "Smoke fact" }, hi: { claim: "धुआँ दावा", correction: "धुआँ तथ्य" } }] };
await call(`/desk/api/library/${lib}`, { method: "POST", body: { data: myth } });
const findLib = async () => (await call("/library", { auth: false })).data.items.find((i) => i.id === lib);
assert.equal(await findLib(), undefined, "drafts stay off phones");
await call(`/desk/api/library/${lib}/approve`, { method: "POST", body: { lang: "en", editor: "Test Editor" } });
let shipped = await findLib();
assert.ok(shipped && !shipped.hindi && shipped.data.claims[0].hi === undefined, "Hindi waits for a Hindi editor");
await call(`/desk/api/library/${lib}/approve`, { method: "POST", body: { lang: "hi", editor: "Test Editor" } });
shipped = await findLib();
assert.equal(shipped.data.claims[0].hi.claim, "धुआँ दावा");
await call(`/desk/api/library/${lib}/unapprove`, { method: "POST" });
assert.equal((await call(`/desk/api/library/${lib}/delete`, { method: "POST" })).status, 200);
step("library items ship only after approval, Hindi only after a Hindi editor");

// Mock papers: flagged while short, shipped after approval, then removed again.
const mockId = (await call("/desk/api/library/new", { method: "POST", body: { kind: "mock" } })).data.id;
const mockDraft = (await call("/desk/api/library")).data.find((r) => r.id === mockId);
assert.ok(mockDraft.flags.some((f) => f.includes("at least 10")), "a short mock is flagged");
const mq = (i) => ({ topic: "Polity", en: { question: `Smoke Q${i}`, options: ["a", "b", "c", "d"], answerIndex: i % 4, explanation: "Because." } });
const saved = await call(`/desk/api/library/${mockId}`, { method: "POST", body: { data: { ...mockDraft.data, title: { en: "Smoke mock", hi: "" }, questions: Array.from({ length: 10 }, (_, i) => mq(i)) } } });
assert.ok(!saved.data.flags.some((f) => f.includes("at least 10")));
await call(`/desk/api/library/${mockId}/approve`, { method: "POST", body: { lang: "en", editor: "Test Editor" } });
const mock = (await call("/library", { auth: false })).data.items.find((i) => i.id === mockId);
assert.equal(mock.data.questions.length, 10);
assert.equal(mock.data.marking.wrong, -0.66);
await call(`/desk/api/library/${mockId}/unapprove`, { method: "POST" });
assert.equal((await call(`/desk/api/library/${mockId}/delete`, { method: "POST" })).status, 200);
step("mock papers ship after approval with UPSC marking");

const practice = (await call("/practice/questions", { auth: false })).data;
assert.ok(practice.bank.length >= 8 && Array.isArray(practice.fromCards));
const web = await fetch(`${BASE}/app/`);
assert.equal(web.status, 200);
assert.ok((await web.text()).includes('rel="manifest"'));
assert.equal((await fetch(`${BASE}/app/sw.js`)).status, 200);
step("web app, its offline worker and practice questions are served");

// Chotu never posts between 23:30 and 07:00 IST, so the Chai post only arrives outside quiet hours.
const istHm = new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(11, 16);
if (istHm >= "07:00" && istHm < "23:30") {
  await meera.next((e) => e.type === "msg" && e.message.kind === "ritual" && e.message.text.startsWith("Today's Chai"));
  step("pods get Chotu's 07:00 Chai post");
} else step(`(quiet hours, ${istHm} IST: Chai post held back as it should be)`);

// --- Admin console ------------------------------------------------------------------------------
const as = async (key, path, { method = "GET", body } = {}) => {
  const res = await fetch(BASE + path, { method, headers: { "content-type": "application/json", ...(key ? { authorization: "Bearer " + key } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
};
const post = (path, body = {}) => call(path, { method: "POST", body });

assert.equal((await as(null, "/admin/api/me")).status, 401);
assert.equal((await call("/admin/api/me")).data.roles[0], "admin");
// Smoke-test staff, disabled again at the end. Keys live only in this process.
const mk = async (name, roles) => (await post("/admin/api/staff", { name, roles })).data;
const ed = await mk("Smoke Editor (test)", ["editor"]);
const hi = await mk("Smoke Hindi Editor (test)", ["hindi_editor"]);
const mod = await mk("Smoke Moderator (test)", ["moderator"]);
assert.ok(ed.key.startsWith("upk_"));
assert.equal((await as(ed.key, "/admin/api/me")).data.name, "Smoke Editor (test)");
assert.equal((await as(ed.key, "/admin/api/privacy")).status, 403, "editors can't see data requests");
assert.equal((await as(mod.key, "/desk/api/queue")).status, 403, "moderators can't use the desk");
assert.equal((await as(mod.key, "/admin/api/reports?kind=distress")).status, 200);
step("staff get personal keys, and roles limit what each can do");

// Approvals carry the account's own name; Hindi editors can't approve English. Versions record each step.
const rd = (await as(ed.key, "/desk/api/library/new", { method: "POST", body: { kind: "read" } })).data.id;
assert.equal((await as(hi.key, `/desk/api/library/${rd}/approve`, { method: "POST", body: { lang: "en", editor: "Someone Else" } })).status, 403);
assert.equal((await as(ed.key, `/desk/api/library/${rd}/approve`, { method: "POST", body: { lang: "en", editor: "Typed Name" } })).status, 200);
let row = (await call("/admin/api/content?q=" + encodeURIComponent(rd.split(":")[1]))).data.library.find((r) => r.id === rd);
assert.equal(row.en_editor, "Editorial team", "every approval shows as Editorial team, whatever is typed");
await as(ed.key, `/desk/api/library/${rd}/unapprove`, { method: "POST" });
await as(ed.key, `/desk/api/library/${rd}/delete`, { method: "POST" });
let versions = (await call(`/admin/api/versions/library/${encodeURIComponent(rd)}`)).data;
assert.deepEqual(versions.map((v) => v.action.split(" ")[0]).reverse(), ["new", "approve", "unapprove", "delete"]);
assert.equal((await post(`/admin/api/version/${versions[1].id}/restore`)).status, 200);
row = (await call("/admin/api/content?q=" + encodeURIComponent(rd.split(":")[1]))).data.library.find((r) => r.id === rd);
assert.ok(row && row.status === "draft" && !row.en_editor, "a restored item comes back as an unapproved draft");
await post(`/desk/api/library/${rd}/delete`);
step("approvals use the account's name, every change is versioned, deleted items can be restored");

const auditRows = (await call("/admin/api/audit?q=Smoke%20Editor")).data;
assert.ok(auditRows.some((r) => r.action.includes("approve")), "the audit log records who approved");
assert.ok(!JSON.stringify(auditRows).includes("upk_"), "keys never reach the audit log");
step("audit log records who did what, without keys");

// LLM controls: the kill switch stops model calls, and usage shows it.
await post("/admin/api/llm/controls", { enabled: false });
const sid = (await post("/desk/api/stories", { title: "Smoke: AI switch test", sourceUrl: "https://pib.gov.in/smoke-ai", text: "A test story." })).data.id;
const queued = (await call("/desk/api/queue")).data.candidates.find((c) => c.id === sid);
assert.ok(queued.flags.some((f) => f.includes("turned off by an admin")));
await post(`/desk/api/cards/${sid}/reject`);
const usage = (await call("/admin/api/llm")).data;
assert.ok(usage.recent.some((r) => r.status === "blocked"));
assert.equal((await as(ed.key, "/admin/api/llm/controls", { method: "POST", body: { enabled: true } })).status, 403, "only admins change AI controls");
await post("/admin/api/llm/controls", { enabled: true });
step("AI kill switch blocks model calls and shows in usage");

// Feature flags, enforced by the server.
const flagsBefore = (await call("/admin/api/flags")).data.flags;
await post("/admin/api/flags", { flags: { pod_join: false, chotu: false } });
assert.equal((await call("/pods/join", { method: "POST", body: { memberId: rid(), stage: "smoke-flag" } })).status, 503);
assert.equal((await call("/pods/join", { method: "POST", body: { memberId: a } })).data.podId, podA, "existing members keep their pod");
assert.ok(!(await call("/brief/latest", { auth: false })).data.items.some((i) => i.chotu), "Chotu's jokes come out of the brief");
assert.equal((await call("/config", { auth: false })).data.flags.pod_join, false);
await post("/admin/api/flags", { flags: flagsBefore });
step("feature flags switch features off for every app");

// Announcements and incidents.
const an = (await post("/admin/api/announcements", { title: "Smoke notice", body: "Test announcement." })).data.id;
assert.ok((await call("/config", { auth: false })).data.announcements.some((x) => x.id === an));
await post(`/admin/api/announcements/${an}/withdraw`);
assert.ok(!(await call("/config", { auth: false })).data.announcements.some((x) => x.id === an));
const inc = (await post("/admin/api/incidents", { title: "Smoke: chat slow", component: "pods", impact: "minor", message: "Test incident." })).data.id;
let st = (await call("/status.json", { auth: false })).data;
assert.equal(st.components.pods.state, "degraded");
await post(`/admin/api/incidents/${inc}`, { status: "Resolved", message: "Test over." });
st = (await call("/status.json", { auth: false })).data;
assert.notEqual(st.components.pods.state, "degraded");
const statusPage = await fetch(`${BASE}/status`);
assert.ok(statusPage.status === 200 && (await statusPage.text()).includes("Aspiran status"));
step("announcements reach /config, incidents show on the public /status page");

// Members: pause chat, then unpause.
await post(`/admin/api/members/${a}/suspend`, { days: 1, reason: "smoke test" });
assert.equal((await call(`/pods/${podA}/ws?member=${a}&name=X`)).status, 403);
await post(`/admin/api/members/${a}/unsuspend`);
step("moderators can pause a member's chat");

// Safety: escalating needs a note saying to whom.
const alerts = (await as(mod.key, "/admin/api/reports?kind=distress")).data.reports;
if (alerts[0]) assert.equal((await as(mod.key, `/admin/api/reports/${alerts[0].id}`, { method: "POST", body: { action: "escalated" } })).status, 400);
step("safety queue: an escalation must say who it went to");

// DPDP: consent, export and erasure, and a restore erases the person again.
const dp = rid();
await call("/pods/join", { method: "POST", body: { memberId: dp, stage: "smoke-dpdp" + rid().slice(0, 6) } });
assert.equal((await call("/consent", { method: "POST", auth: false, body: { memberId: dp, purposes: ["pods"] } })).data.ok, true);
const ex = (await call("/privacy/export", { method: "POST", auth: false, body: { memberId: dp } })).data;
assert.ok(ex.member && ex.consents.length === 1);
const bk = (await post("/admin/api/backups")).data;
assert.ok(bk.key && bk.rows > 0);
const bkFile = await fetch(`${BASE}/admin/api/backups/file?key=${encodeURIComponent(bk.key)}`, { headers: { authorization: "Bearer " + TOKEN } }).then((r) => r.json());
assert.ok(bkFile.podChat?.[podA]?.messages.some((m) => m.text === "Polity revision at 7?"), "pod chat is in the backup");
assert.equal((await post("/admin/api/privacy/delete", { memberId: dp })).status, 400, "erasing needs DELETE typed");
assert.equal((await call("/privacy/delete", { method: "POST", auth: false, body: { memberId: dp } })).data.deleted, true);
assert.equal((await post("/admin/api/backups/restore", { key: bk.key, confirm: "nope" })).status, 400);
const restored = (await post("/admin/api/backups/restore", { key: bk.key, confirm: "RESTORE" })).data;
assert.ok(restored.takenFirst && restored.erasedAgain >= 1, "restoring an old backup erases the person again");
assert.ok(restored.counts.podChats >= 1);
const afterRestore = await connect(a, "Meera");
const restoredHist = (await afterRestore.next((e) => e.type === "history")).messages;
assert.ok(restoredHist.some((m) => m.text === "Could someone review my intro?"), "pod chat comes back on a restore");
assert.ok(!restoredHist.some((m) => m.text === "Polity revision at 7?"), "a message a moderator hid stays hidden after a restore");
afterRestore.ws.close();
assert.ok(!(await call("/admin/api/members?q=" + dp)).data.length);
assert.ok((await call("/admin/api/privacy")).data.requests.some((r) => r.kind === "delete"));
step("consent, export and erasure work, backups carry pod chat, and a restore keeps erasures");

// Authoring without a Claude key: copy the prompt, paste a reply, get the side-by-side draft.
// The reply is built from the content team's example pack, when it's in content/.
const EXAMPLE = new URL("../content/preview-2026-10-10/templates/flashcards/example.json", import.meta.url);
const mr = await post("/admin/api/staff", { name: "Smoke Marathi Editor (test)", roles: ["language_editor"], langs: ["mr"] }).then((r) => r.data);
if (existsSync(EXAMPLE)) {
  const PT = createRequire(import.meta.url)("../src/vendor/pods-templates.cjs");
  const bundle = JSON.parse(readFileSync(new URL("../src/vendor/templates.json", import.meta.url), "utf8"));
  const t = bundle.types.flashcards, ex = JSON.parse(readFileSync(EXAMPLE, "utf8"));
  const keep = (v, sc) => {
    if (!sc || v === undefined) return v;
    if (sc.type === "object" || sc.properties) return v && typeof v === "object" ? Object.fromEntries(Object.keys(sc.properties ?? {}).filter((k) => v[k] !== undefined).map((k) => [k, keep(v[k], sc.properties[k])])) : v;
    if (sc.type === "array" || sc.items) return Array.isArray(v) ? v.map((x) => keep(x, sc.items)) : v;
    return v;
  };
  const source = PT.englishStrings(ex).map((x) => x.en).join(" ");
  assert.ok((await post("/desk/api/author/prompt", { type: "flashcards", source })).data.paste.length > 500);
  const filled = await post("/desk/api/author/fill", { type: "flashcards", source, reply: "```json\n" + JSON.stringify(keep(ex, PT.fillSchema(t.schema, t.config))) + "\n```" });
  assert.equal(filled.status, 200, JSON.stringify(filled.data));
  const draft = filled.data.drafts[0];
  assert.ok(draft.rows.length > 3 && draft.langs.includes("en"));
  const edited = (await post(`/desk/api/author/draft/${draft.id}`, { edits: [{ path: draft.rows[0].path, lang: "en", text: draft.rows[0].en + " (smoke)" }] })).data;
  assert.ok(edited.rows[0].en.endsWith("(smoke)"));
  step("Author tab: prompt, pasted reply and inline edits work without a Claude key");

  // A pilot language: translated on the desk, approved only by its own language editor, shown to members
  // only once the language is live, and live only with a reviewed distress list.
  await post(`/desk/api/library/${draft.id}/approve`, { lang: "en", editor: "Test Editor" });
  assert.equal((await post("/admin/api/languages/mr", { status: "pilot" })).status, 200);
  const tp = (await post(`/desk/api/author/draft/${draft.id}/translate-prompt`, { lang: "mr" })).data;
  const strings = JSON.parse(tp.paste.match(/<strings>\n([\s\S]*?)\n<\/strings>/)[1]);
  const reply = Object.fromEntries(Object.entries(strings).map(([k, v]) => [k, v.keepAsIs ? v.en : "चाचणी " + v.en]));
  assert.ok((await post(`/desk/api/author/draft/${draft.id}/translation`, { lang: "mr", reply })).data.langs.includes("mr"));
  assert.notEqual((await as(ed.key, `/desk/api/library/${draft.id}/approve`, { method: "POST", body: { lang: "mr", editor: "x" } })).status, 200, "only a Marathi editor approves Marathi");
  assert.equal((await as(mr.key, `/desk/api/library/${draft.id}/approve`, { method: "POST", body: { lang: "mr", editor: "Smoke Marathi Editor (test)" } })).status, 200);
  const langsOf = async () => (await call("/library", { auth: false })).data.items.find((i) => i.id === draft.id)?.languages;
  assert.ok(!(await langsOf()).includes("mr"), "a pilot language stays off phones");
  assert.equal((await post("/admin/api/languages/mr", { status: "live" })).status, 400, "no reviewed distress list yet");
  const phrases = ["smoke-mr-1", "smoke-mr-2", "smoke-mr-3", "smoke-mr-4", "smoke-mr-5"];
  await post("/admin/api/languages/mr/distress", { phrases, reviewed: true, reviewedBy: "Smoke reviewer (test)" });
  assert.equal((await post("/admin/api/languages/mr", { status: "live" })).status, 200);
  assert.ok((await langsOf()).includes("mr"));
  const cfg = (await call("/config", { auth: false })).data;
  assert.ok(cfg.languages.some((l) => l.code === "mr") && cfg.distress.includes("smoke-mr-1"));
  await post("/admin/api/languages/mr", { status: "off" });
  await post("/admin/api/languages/mr/distress", { phrases: [] });
  await post(`/desk/api/library/${draft.id}/unapprove`);
  assert.equal((await post(`/desk/api/library/${draft.id}/delete`)).status, 200);
  step("a new language ships per item, with its own editor, after its distress list is reviewed");
} else console.log("· skipped the Author checks: content/preview-2026-10-10 isn't here");

for (const s of [ed, hi, mod, mr]) await post(`/admin/api/staff/${s.id}/disable`);
assert.equal((await as(ed.key, "/admin/api/me")).status, 401, "a disabled key stops working");
assert.equal((await fetch(`${BASE}/admin`)).status, 200);
step("disabled staff keys stop working; the console is served");

meera.ws.close();
arjun.ws.close();
console.log("\nAll smoke checks passed.");
