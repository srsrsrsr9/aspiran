// Growth counts (src/metrics.ts), against a running local server started with AUTH_MODE=dev:
//   npx wrangler dev --port 8790 --persist-to .wrangler-test --var EDITOR_TOKEN:<any> --var AUTH_MODE:dev
//   EDITOR_TOKEN=<same> BASE=http://127.0.0.1:8790 node test/metrics.mjs
// Checks: installs and first_open, server-only events refused from apps, free text never stored, ratings and the
// day-7 check-in, member ids that can't be borrowed, the Growth report, export and erasure.
// It flips the sign_in_required flag (and puts it back), so use a local database.
import assert from "node:assert/strict";

const BASE = process.env.BASE ?? "http://127.0.0.1:8787";
const TOKEN = process.env.EDITOR_TOKEN;
if (!TOKEN) throw new Error("Set EDITOR_TOKEN to the value in your .dev.vars");
const step = (name) => console.log("✓", name);
const rid = () => crypto.randomUUID().replace(/-/g, "");

const call = async (path, { method = "GET", body, token } = {}) => {
  const res = await fetch(BASE + path, { method, headers: { "content-type": "application/json", ...(token ? { authorization: "Bearer " + token } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
};
const post = (path, body, token) => call(path, { method: "POST", body, token });
const admin = (path, body) => call("/admin/api/" + path, { method: body ? "POST" : "GET", body, token: TOKEN });
const setFlag = async (name, on) => { const f = (await admin("flags")).data.flags; f[name] = on; assert.equal((await admin("flags", { flags: f })).status, 200); };
const dev = (who) => `dev:${who}:${who}@example.com`;

// A signed-in member: the dev account links this member id on first use.
const me = rid(), install = rid(), tok = dev("metrics-" + me.slice(0, 10));
const src = "test" + me.slice(0, 6);
await setFlag("sign_in_required", false);

let r = await post("/events", { installId: install, platform: "web", events: [{ name: "first_open", props: { source: src, invite: "INV" + me.slice(0, 4), referrer: "utm_source=play&utm_medium=x&gclid=SECRET" } }] });
assert.equal(r.status, 200); assert.equal(r.data.kept, 1);
r = await post("/events", { installId: install, platform: "web", events: [{ name: "first_open", props: { source: "other" } }] });
assert.equal(r.data.kept, 0, "a second first_open for the same install changes nothing");
step("first_open makes one install row (source, invite, utm-only referrer)");

r = await post("/events", { installId: install, events: [{ name: "paid", props: {} }, { name: "signup" }, { name: "refunded" }, { name: "pod_joined" }] });
assert.equal(r.data.kept, 0);
r = await post("/events", { installId: install, events: [{ name: "made_up" }, { name: "ritual", props: { kind: "nonsense" } }] });
assert.equal(r.data.kept, 0);
assert.equal((await post("/events", { events: [{ name: "app_open" }] })).status, 400, "an install or member id is needed");
step("server-only, unknown and malformed events are refused from apps");

// Signed in: events carry the account's member id, and stray text in props is dropped.
const tooMany = Array.from({ length: 30 }, () => ({ name: "chai_read", props: { cards: 5 } }));
r = await post("/events", { installId: install, memberId: me, events: [
  { name: "onboarding_done", props: { mood: "sad", note: "private words" } },
  { name: "ritual", props: { kind: "close_day", text: "my journal entry" } },
  { name: "prep_minutes", props: { minutes: 25 } },
  { name: "chotu_chat", props: { said: "hello chotu" } },
  { name: "app_open" }, { name: "app_open" },
] }, tok);
assert.equal(r.status, 200); assert.equal(r.data.kept, 5, "the second app_open on the same day is not counted");
assert.equal((await post("/events", { installId: install, memberId: me, events: tooMany }, tok)).data.kept, 20, "at most 20 events a call");
step("signed-in events are kept, app_open once a day, batches capped at 20");

assert.equal((await post("/feedback", { installId: install, memberId: me, moment: "close_day", rating: 3 }, tok)).status, 200);
assert.equal((await post("/feedback", { installId: install, memberId: me, moment: "close_day", rating: 7 }, tok)).status, 400);
assert.equal((await post("/feedback", { installId: install, memberId: me, moment: "my_mood", rating: 2 }, tok)).status, 400);
assert.equal((await post("/feedback", { installId: install, memberId: me, kind: "checkin", q1: 0, q2: 2 }, tok)).status, 200);
assert.equal((await post("/feedback", { installId: install, memberId: me, kind: "checkin", q1: 9, q2: 0 }, tok)).status, 400);
const ci = (await call("/checkin")).data;
assert.equal(ci.q1.choices.length, 3); assert.equal(ci.q2.choices.length, 5); assert.ok(ci.moments.includes("chai"));
step("one-tap ratings (1-3, known moments) and the two day-7 questions");

// What the member can see about themselves: names, codes and numbers only.
const exp = (await post("/privacy/export", { memberId: me }, tok)).data;
const names = exp.usageEvents.map((e) => e.name);
for (const n of ["onboarding_done", "ritual", "prep_minutes", "first_chotu_chat", "app_open", "chai_read"]) assert.ok(names.includes(n), n);
const blob = JSON.stringify(exp.usageEvents) + JSON.stringify(exp.feedback);
for (const word of ["sad", "private words", "journal", "hello chotu", "SECRET"]) assert.ok(!blob.includes(word), `no "${word}" stored`);
assert.equal(exp.feedback.filter((f) => f.moment.startsWith("day7_")).length, 2);
step("export shows the member's own events and feedback, with no free text");

// Someone else's member id can't be borrowed: with a token the account's own id is used.
const other = rid(), otherTok = dev("metrics-o-" + other.slice(0, 8));
await post("/events", { installId: rid(), memberId: other, events: [{ name: "app_open" }] }, otherTok);
await post("/events", { installId: rid(), memberId: other, events: [{ name: "ritual", props: { kind: "wins" } }] }, tok);
const otherExp = (await post("/privacy/export", { memberId: other }, otherTok)).data;
assert.ok(!otherExp.usageEvents.some((e) => e.name === "ritual"), "an event sent with my token never lands on someone else");
// Once sign-in is required, a call with no token counts for the install only.
await setFlag("sign_in_required", true);
try {
  assert.equal((await post("/events", { installId: rid(), memberId: other, events: [{ name: "ritual", props: { kind: "quiz" } }] })).status, 200);
  const again = (await post("/privacy/export", { memberId: other }, otherTok)).data;
  assert.ok(!again.usageEvents.some((e) => e.name === "ritual"));
} finally { await setFlag("sign_in_required", false); }
step("member ids can't be borrowed (token wins; no token means install-only once sign-in is required)");

const g = await admin("growth");
assert.equal(g.status, 200);
const row = g.data.installsBySource.find((x) => x.source === src);
assert.ok(row && row.installs === 1 && row.platform === "web", "installs by source");
assert.ok(g.data.invites.some((x) => x.invite === "INV" + me.slice(0, 4)));
for (const k of ["activation", "retention", "feedback", "paidFunnel", "podTest"]) assert.ok(k in g.data, k);
assert.ok(["too_few", "stop", "strong", "keep_testing"].includes(g.data.podTest.verdict));
assert.equal((await call("/admin/api/growth")).status, 401);
step("the admin Growth report: installs by source, invites, activation, retention, feedback, paid funnel, pod test");

assert.equal((await post("/privacy/delete", { memberId: me }, tok)).status, 200);
const after = await admin("growth");
assert.equal(after.data.installsBySource.find((x) => x.source === src)?.signups ?? 0, 0, "deleting unlinks the install from the member");
step("deleting the account unlinks its events and install");

console.log("\nAll metrics checks passed.");
