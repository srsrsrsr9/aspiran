// "Try one topic" (src/try.ts) against a running local server: a topic path imports as a draft, stays hidden from
// visitors until an English editor approves it, ships without Hindi until a Hindi editor approves, and drafts are
// previewable with a desk key only. EDITOR_TOKEN=... node test/try.mjs   (BASE defaults to http://127.0.0.1:8787)
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const BASE = process.env.BASE ?? "http://127.0.0.1:8787";
const TOKEN = process.env.EDITOR_TOKEN;
if (!TOKEN) throw new Error("Set EDITOR_TOKEN to the value in your .dev.vars");

const call = async (path, { method = "GET", body, raw, auth = true } = {}) => {
  const res = await fetch(BASE + path, {
    method,
    headers: { "content-type": raw ? "application/octet-stream" : "application/json", ...(auth ? { authorization: "Bearer " + TOKEN } : {}) },
    body: raw ?? (body ? JSON.stringify(body) : undefined),
  });
  return { status: res.status, data: await res.json().catch(() => null) };
};
const step = (name) => console.log("✓", name);

const source = JSON.parse(readFileSync(new URL("../../content/topic-paths/federalism.json", import.meta.url), "utf8"));
const file = Buffer.from(JSON.stringify(source));
const pack = "test-try-" + Date.now();
const path = `topic-path/${source.id}.json`;
const manifest = { schema: "upsc-pods/pack-manifest@1", packId: pack, createdOn: "2026-11-08", status: "draft", entry: { paths: [path] },
  files: [{ path, bytes: file.length, sha256: createHash("sha256").update(file).digest("hex") }] };

assert.equal((await call(`/desk/api/packs/${pack}/files/manifest.json`, { method: "PUT", raw: Buffer.from(JSON.stringify(manifest)) })).status, 200);
assert.equal((await call(`/desk/api/packs/${pack}/files/${path}`, { method: "PUT", raw: file })).status, 200);
assert.equal((await call(`/desk/api/packs/${pack}/import`, { method: "POST" })).status, 200);
const row = (await call("/desk/api/library")).data.find((r) => r.kind === "topic-path" && r.data.id === source.id);
assert.ok(row, "imported as a topic-path draft");
assert.ok(row.flags.some((f) => /Check these \d+ facts/.test(f)), "facts to check reach the editor");
assert.ok(!row.flags.some((f) => /no Hindi|need four options|PYQ needs/.test(f)), row.flags.join("; "));
step("imports as a draft, with its facts flagged for the editor");

const pub = (id = "") => call(`/try${id ? "/" + id : ""}`, { auth: false });
assert.equal((await pub(source.id)).status, 404, "a draft stays closed to visitors");
assert.ok(!(await pub()).data.items.some((i) => i.id === source.id));
assert.equal((await call(`/try/${source.id}?preview=1`, { auth: false })).status, 401, "no preview without a desk key");
const prev = await call(`/try/${source.id}?preview=1`);
assert.equal(prev.status, 200);
assert.equal(prev.data.draft, true);
step("drafts: closed to visitors, previewable with a desk key");

await call(`/desk/api/library/${row.id}/approve`, { method: "POST", body: { lang: "en", editor: "Test Editor" } });
const live = await pub(source.id);
assert.equal(live.status, 200);
assert.equal(live.data.draft, false);
assert.equal(live.data.id, source.id);
assert.equal(live.data.data.steps.length, source.steps.length);
assert.equal(live.data.data.steps[1].body.hi, undefined, "Hindi waits for a Hindi editor");
assert.ok((await pub()).data.items.some((i) => i.id === source.id));
step("opens after English approval, without Hindi");

// Feedback: anonymous answers by session, replaced if asked again; contact needs consent; free text follows the crisis
// protocol; counts show only from MIN_SHOWN answers; "Delete what I sent" removes everything for that session.
const sid = "testsession" + Date.now().toString(36);
const fb = (path, body) => call(path, { method: "POST", body: { sessionId: sid, pathId: source.id, ...body }, auth: false });
assert.equal((await fb("/try/feedback", { question: "clarity", answer: "right" })).status, 200);
assert.equal((await fb("/try/feedback", { question: "clarity", answer: "dense" })).status, 200);
assert.equal((await fb("/try/feedback", { question: "Bad Question!", answer: "x" })).status, 400);
assert.equal((await call("/try/feedback", { method: "POST", body: { sessionId: "short", pathId: source.id, question: "q", answer: "a" }, auth: false })).status, 400);
const care = await fb("/try/feedback", { question: "missing", text: "i want to die" });
assert.equal(care.data.care, true, "distress text gets the helplines");
assert.ok(care.data.helplines?.length);
assert.equal((await fb("/try/contact", { contact: "aspirant@example.com" })).status, 400, "no contact without consent");
assert.equal((await fb("/try/contact", { contact: "12345", consent: true })).status, 400);
assert.equal((await fb("/try/contact", { contact: "98765 43210", consent: true, consentText: "18+, contact once" })).data.kind, "phone");
const adminRows = (await call("/admin/api/try/feedback")).data;
const mine = adminRows.rows.filter((r) => r.session_id === sid);
assert.equal(mine.find((r) => r.question === "clarity").answer, "dense", "asking again replaces the answer");
assert.equal(mine.find((r) => r.question === "missing").answer, "CARE", "distress is marked for a human");
assert.ok(adminRows.contacts.some((c) => c.session_id === sid && c.contact === "+919876543210"));
const summary = (await call(`/try/summary?path=${source.id}`, { auth: false })).data;
assert.ok(!summary.questions.clarity || summary.questions.clarity.total >= summary.minShown, "counts hidden below the minimum");
assert.ok(!JSON.stringify(summary).includes("die"), "free text never in the summary");
const gone = await fb("/try/forget", {});
assert.equal(gone.data.deleted, 3); // two answers and the contact
assert.ok(!(await call("/admin/api/try/feedback")).data.rows.some((r) => r.session_id === sid));
// "You asked, we did": staff write, visitors read the visible ones only.
assert.equal((await call("/admin/api/try/updates", { method: "POST", body: { pathId: source.id, en: "short" } })).status, 400);
assert.equal((await call("/admin/api/try/updates", { method: "POST", body: { pathId: source.id, en: "Test line: more Hindi PYQ explanations, added", hi: "परीक्षण पंक्ति", doneOn: "2026-11-08" } })).status, 200);
const upd = (await call(`/admin/api/try/updates?path=${source.id}`)).data.updates.find((x) => x.text_en.startsWith("Test line"));
assert.ok((await call(`/try/updates?path=${source.id}`, { auth: false })).data.updates.some((x) => x.en.startsWith("Test line")));
await call(`/admin/api/try/updates/${upd.id}/hide`, { method: "POST", body: {} });
assert.ok(!(await call(`/try/updates?path=${source.id}&x=1`, { auth: false })).data.updates.some((x) => x.en.startsWith("Test line")), "hidden lines don't show");
step("feedback: stored anonymously, consent for contact, crisis text flagged, summary gated, delete works");

// The day-3 email (src/try-recall.ts): consent needed; 5 questions, the visitor's own cards first; sent once, on the
// due day, through the dev outbox; the address deleted after; the page asks them and says "kept 4 of 5", once;
// cancelling, the unsubscribe link and "Delete what I sent" all stop it.
{
  const s3 = "recallsession" + Date.now().toString(36);
  const email = `day3-${Date.now()}@example.com`;
  const rc = (body, s = s3) => call("/try/recall", { method: "POST", body: { sessionId: s, pathId: source.id, lang: "en", ...body }, auth: false });
  const run = (day) => call("/admin/api/try/recall/run", { method: "POST", body: { day } });
  const outbox = async () => (await call(`/auth/password/dev/outbox?to=${encodeURIComponent(email)}`, { auth: false })).data;
  assert.equal((await rc({ email, cards: ["fed-k1"] })).status, 400, "no email without consent");
  assert.equal((await rc({ email: "not-an-email", consent: true })).status, 400);
  const made = await rc({ email, consent: true, consentText: "Email me these questions once.", cards: ["fed-k7", "fed-k1", "not-a-card"] });
  assert.equal(made.status, 200, JSON.stringify(made.data));
  const { code, due } = made.data;
  assert.match(code, /^[a-f0-9]{32}$/);
  assert.equal(made.data.n, 5);
  const today = new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);
  assert.equal(due, new Date(Date.parse(today + "T12:00:00Z") + 3 * 86400e3).toISOString().slice(0, 10), "due three days on");
  const page = await call(`/try/recall/${code}`, { auth: false });
  assert.equal(page.status, 200);
  const ids = page.data.cards.map((c) => c.id);
  assert.equal(ids.length, 5);
  assert.ok(ids.includes("fed-k1") && ids.includes("fed-k7"), "the visitor's own cards are among the five");
  assert.equal(page.data.result, null);
  step("day 3: sign-up needs consent; five questions, the visitor's own cards first");

  assert.equal((await run(today)).data.sent, 0, "nothing goes before the due day");
  assert.equal((await outbox())?.to, undefined);
  const r1 = await run(due);
  assert.equal(r1.status, 200);
  assert.ok(r1.data.sent >= 1, JSON.stringify(r1.data));
  const mail = await outbox();
  assert.equal(mail.to, email);
  assert.match(mail.subject, /5 questions, three days on/);
  assert.ok(mail.text.includes(`/app/#tryback/${code}`), "the email links to the day-3 page");
  assert.ok(mail.text.includes(`/try/recall/${code}/stop`), "and has one unsubscribe link");
  assert.equal(mail.headers["List-Unsubscribe-Post"], "List-Unsubscribe=One-Click");
  assert.ok(!/\bAI\b/.test(mail.text));
  assert.equal((await run(due)).data.sent, 0, "never a second email");
  assert.equal((await rc({ email, consent: true, cards: [] })).data.already, "sent", "asking again after it went doesn't send again");
  step("day 3: sent once on the due day, with the page link and one unsubscribe link");

  const cards = page.data.cards;
  const picks = Object.fromEntries(cards.map((c, i) => [c.id, i === 0 ? (c.answer + 1) % c.options.length : c.answer]));
  const ans = await call(`/try/recall/${code}/answers`, { method: "POST", body: { picks }, auth: false });
  assert.deepEqual(ans.data, { kept: 4, of: 5 });
  const again = await call(`/try/recall/${code}/answers`, { method: "POST", body: { picks: {} }, auth: false });
  assert.equal(again.data.kept, 4, "the first answers stand");
  assert.deepEqual((await call(`/try/recall/${code}`, { auth: false })).data.result, { kept: 4, of: 5 });
  const funnel = (await call("/admin/api/try/recall")).data;
  assert.ok(funnel.sent >= 1 && funnel.answered >= 1 && funnel.opened >= 1);
  assert.ok(!JSON.stringify(funnel).includes("@"), "the funnel has no addresses");
  step("day 3: the page asks them and keeps \"4 of 5\"; Admin sees counts only");

  // Cancelled before it goes: nothing sent. The unsubscribe link answers with a page. "Delete what I sent" removes it.
  const s4 = s3 + "b", email4 = "cancel-" + email;
  const c4 = (await rc({ email: email4, consent: true, cards: [] }, s4)).data.code;
  assert.equal((await call(`/try/recall/${c4}/stop`, { method: "POST", auth: false })).data.ok, true);
  assert.equal((await run(due)).data.sent, 0, "a cancelled email never goes");
  const stopPage = await fetch(`${BASE}/try/recall/${c4}/stop`);
  assert.equal(stopPage.status, 200);
  assert.match(await stopPage.text(), /your address is deleted/);
  const s5 = s3 + "c";
  const c5 = (await rc({ email: "forget-" + email, consent: true, cards: [] }, s5)).data.code;
  assert.equal((await call("/try/forget", { method: "POST", body: { sessionId: s5 }, auth: false })).data.deleted, 1);
  assert.equal((await call(`/try/recall/${c5}`, { auth: false })).status, 404);
  assert.equal((await call("/try/recall/nope", { auth: false })).status, 404);
  step("day 3: cancel, unsubscribe and \"Delete what I sent\" all stop it");

  // K4 (src/try-series.ts): five study emails only for those who tick the separate box. Days 0, 7, 14, 30 from the
  // series; day 3 is the recall email, which then says "second of five" and carries the series' stop link.
  const runS = (day) => call("/admin/api/try/series/run", { method: "POST", body: { day } });
  const ob = async (to) => (await call(`/auth/password/dev/outbox?to=${encodeURIComponent(to)}`, { auth: false })).data;
  const plus = (n) => new Date(Date.parse(today + "T12:00:00Z") + n * 86400e3).toISOString().slice(0, 10);
  const e6 = "noseries-" + email, e7 = "series-" + email, e8 = "seriesstop-" + email, e9 = "seriescancel-" + email;
  const m6 = await rc({ email: e6, consent: true, cards: [] }, s3 + "d");
  assert.equal(m6.data.series, null, "no series without its own tick");
  const m7 = await rc({ email: e7, consent: true, cards: [], series: true, seriesText: "Send me 5 short study emails." }, s3 + "e");
  assert.match(m7.data.series, /^[a-f0-9]{32}$/);
  const r0 = await runS(today);
  assert.equal(r0.status, 200, JSON.stringify(r0.data));
  assert.equal((await ob(e6))?.to, undefined, "the unticked visitor gets nothing from the series");
  const d0 = await ob(e7);
  assert.match(d0.subject, /You tried the demo/);
  assert.ok(d0.text.includes(`/try/series/${m7.data.series}/stop`) && !d0.text.includes("{{"), "stop link filled in");
  assert.ok(d0.text.includes("planned a Mains answer") && !/\bAI\b/.test(d0.text));
  assert.equal(d0.headers["List-Unsubscribe-Post"], "List-Unsubscribe=One-Click");
  await runS(today);
  assert.match((await ob(e7)).subject, /You tried the demo/, "day 0 goes once");
  step("K4: only the ticked box signs up; day 0 goes once, with its stop link");

  await run(due);
  const d3m = await ob(e7);
  assert.match(d3m.subject, /three days on/);
  assert.ok(d3m.text.includes("second of your five") && d3m.text.includes(`/try/series/${m7.data.series}/stop`), "day 3 says it's part of the series");
  assert.ok((await ob(e6)).text.includes("only email about it"), "the unticked visitor's day 3 still says it's the only one");
  for (const [n, re] of [[7, /Why you forget/], [14, /Mains answers/], [30, /A month since/]]) {
    await runS(plus(n - 1));
    assert.ok(!re.test((await ob(e7)).subject), `day ${n} doesn't go early`);
    await runS(plus(n));
    assert.match((await ob(e7)).subject, re, `day ${n} goes on its day`);
  }
  const sf = (await call("/admin/api/try/series")).data;
  assert.ok(sf.finished >= 1 && !JSON.stringify(sf).includes("@"), "finished, and Admin sees counts only");
  step("K4: day 3 is the second of five; days 7, 14 and 30 go on their days, then the address is gone");

  const m8 = await rc({ email: e8, consent: true, cards: [], series: true }, s3 + "f");
  const stopS = await fetch(`${BASE}/try/series/${m8.data.series}/stop`);
  assert.equal(stopS.status, 200);
  await runS(today); await run(due);
  assert.equal((await ob(e8))?.to, undefined, "stopping the series stops day 3 too");
  const m9 = await rc({ email: e9, consent: true, cards: [], series: true }, s3 + "g");
  await call(`/try/recall/${m9.data.code}/stop`, { method: "POST", auth: false });
  await runS(today);
  assert.equal((await ob(e9))?.to, undefined, "cancelling day 3 in the demo stops the series too");
  step("K4: one stop link stops every email still to come");
}

await call(`/desk/api/library/${row.id}/unapprove`, { method: "POST" });
assert.equal((await pub(source.id)).status, 404);
assert.equal((await call(`/desk/api/library/${row.id}/delete`, { method: "POST" })).status, 200);
step("closes again when unapproved; cleaned up");
