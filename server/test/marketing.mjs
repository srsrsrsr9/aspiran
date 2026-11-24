// Marketing (src/marketing.ts, admin → Marketing), against a running local server started with AUTH_MODE=dev:
//   npx wrangler dev --port 8790 --persist-to .wrangler-test --var EDITOR_TOKEN:<any> --var AUTH_MODE:dev
//   EDITOR_TOKEN=<same> BASE=http://127.0.0.1:8790 node test/marketing.mjs
// Checks: website page views, the daily count of lead magnets and sign-ups, leads and sign-ups onto the people list
// (a sign-up linked to the lead with the same email), adding by hand needs a note of consent, edits, follow-ups,
// "I sent it", the spreadsheet, editing the magnet list, "Delete everywhere", erasure, and who may see what.
// Use a local database: it writes leads, members and counts.
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
  return { status: res.status, data, type: res.headers.get("content-type") };
};
const post = (path, body, token) => call(path, { method: "POST", body, token });
const admin = (path, body) => call("/admin/api/" + path, { method: body ? "POST" : "GET", body, token: TOKEN });
const tag = rid().slice(0, 8);

// Who may see what: no key, no list.
assert.equal((await call("/admin/api/crm")).status, 401);
assert.equal((await call("/admin/api/marketing/magnets")).status, 401);
step("the Marketing pages need a staff key");

// Website page views: known magnets count, unknown ones don't.
let r = await post("/web/hit", { magnet: "pyq" });
assert.equal(r.status, 200); assert.equal(r.data.counted, true);
assert.equal((await post("/web/hit", { magnet: "made-up-thing" })).data.ok, false);
assert.equal((await post("/web/hit", { magnet: "<b>" })).status, 400);
step("website page views count for known lead magnets only");

// A website lead with a yes, and a Try one topic contact.
const email = `lead-${tag}@example.com`, visitor = "v-" + tag + "-test-1";
r = await post("/web/lead", { visitorId: visitor, details: { name: "Asha " + tag }, contact: email, consent: true, lang: "hi", source: "site/hero/pyq" });
assert.equal(r.status, 200, JSON.stringify(r.data));
const session = "mkt" + tag + "session";
r = await post("/try/contact", { sessionId: session, pathId: "path-pol-federalism", contact: "98765" + tag.replace(/\D/g, "0").padEnd(5, "1").slice(0, 5), consent: true, consentText: "You can contact me once about the full app." });
assert.equal(r.status, 200, JSON.stringify(r.data));
step("a website lead and a Try one topic contact, both with a yes");

// A visitor who came from a PYQ link opens the app and signs up with the same email as the lead.
const install = rid(), hint = rid(), tok = `dev:mkt-${tag}:${email}`;
r = await post("/events", { installId: install, platform: "web", events: [{ name: "first_open", props: { source: "site:hero", referrer: "utm_source=site&utm_medium=hero&utm_campaign=pyq" } }] });
assert.equal(r.data.kept, 1);
r = await post("/auth/session", { memberId: hint }, tok);
assert.equal(r.status, 200, JSON.stringify(r.data));
const member = r.data.memberId;
r = await post("/events", { installId: install, memberId: member, events: [{ name: "app_open" }] }, tok);
assert.equal(r.status, 200);
step("a first visit tagged with the pyq campaign, then a sign-up from that install");

// Count now: today's numbers and the people list.
r = await admin("marketing/refresh", {});
assert.equal(r.status, 200, JSON.stringify(r.data));
assert.ok(r.data.crm.added >= 2, "both leads and the member came in");
r = await admin("marketing/magnets?days=7");
assert.equal(r.status, 200);
const pyq = r.data.magnets.find((m) => m.id === "pyq"), tryM = r.data.magnets.find((m) => m.id === "try");
assert.ok(pyq.view >= 1, "website page view"); assert.ok(pyq.visit >= 1, "app visit from the pyq link"); assert.ok(pyq.signup >= 1, "sign-up counted for pyq");
assert.ok(pyq.lead >= 1, "the website lead's source names pyq");
assert.ok(tryM.lead >= 1, "the Try one topic contact");
step("lead magnets: seen, opened the app, left a contact and signed up, per magnet");

r = await admin("marketing/signups?days=7");
assert.equal(r.status, 200);
assert.ok(r.data.totals.signup >= 1);
assert.ok(r.data.bySource.some((s) => s.source === "site:hero" && s.signup >= 1));
assert.ok(r.data.daily.at(-1).byChannel.site >= 1, "today's sign-ups by channel");
assert.equal(r.data.websiteFunnel.length, 5);
assert.ok(r.data.websiteFunnel[0].n >= 1, "website page views lead the funnel");
step("sign-ups: by day and channel, by source, and the website funnel");

// The people list: the lead and the sign-up are one row, and the member's stage follows the app.
r = await admin("crm?show=recent&q=" + encodeURIComponent(email));
assert.equal(r.status, 200);
assert.equal(r.data.rows.length, 1, "one row for the lead who signed up");
let asha = r.data.rows[0];
assert.equal(asha.member_id, member); assert.equal(asha.stage, "signed_up"); assert.equal(asha.lang, "hi"); assert.equal(asha.magnet, "pyq");
assert.match(asha.consent_text, /ticked/);
r = await admin("crm?show=lead");
const tryRow = r.data.rows.find((p) => p.magnet === "try" && p.contact_kind === "phone" && /full app/.test(p.consent_text || ""));
assert.ok(tryRow, "the Try one topic contact is a lead");
assert.ok(r.data.counts.stages.lead >= 1 && r.data.counts.total >= 2);
step("people: leads with their yes, a sign-up linked to their lead, stage from the app");

// Adding by hand: a contact needs a note of how they agreed; the same contact can't be added twice.
assert.equal((await admin("crm", { name: "Ravi", contact: "ravi@example.com" })).status, 400);
assert.equal((await admin("crm", { name: "Ravi", contact: "not a contact", consent: "Asked us at the seminar" })).status, 400);
r = await admin("crm", { name: "Vidya IAS " + tag, kind: "centre", contact: `owner-${tag}@vidya.example.com`, consent: "Asked for a call at the Hyderabad seminar", tags: "Hyderabad, Seminar", lang: "en" });
assert.equal(r.status, 200, JSON.stringify(r.data));
const centreId = r.data.id;
assert.equal((await admin("crm", { name: "Again", contact: `owner-${tag}@vidya.example.com`, consent: "Asked for a call at the seminar" })).status, 409);
step("adding by hand needs a note of consent; no duplicates");

// Edits, follow-ups and "I sent it". Nothing is sent from the server.
const today = new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);
assert.equal((await admin("crm/" + centreId, { stage: "nonsense" })).status, 400);
assert.equal((await admin("crm/" + centreId, { stage: "auto" })).status, 400, "only members follow the app");
assert.equal((await admin("crm/" + centreId, { nextFollowUp: today, tags: "hyderabad, call-booked", notes: "Owner keen; 300 students." })).status, 200);
r = await admin("crm?show=due&kind=centre");
let centre = r.data.rows.find((p) => p.id === centreId);
assert.ok(centre, "due today"); assert.equal(centre.tags, "hyderabad, call-booked"); assert.equal(centre.kind, "centre");
assert.equal((await admin(`crm/${centreId}/contacted`, { note: "Sent the call invite", via: "email", nextFollowUp: null })).status, 200);
r = await admin("crm?show=recent&kind=centre");
centre = r.data.rows.find((p) => p.id === centreId);
assert.equal(centre.next_follow_up, null); assert.ok(centre.last_contacted); assert.match(centre.notes, /Sent the call invite \(email\)$/);
assert.equal((await admin("crm/" + asha.id, { stage: "quiet" })).status, 200);
assert.equal((await admin("crm?q=" + encodeURIComponent(email))).data.rows[0].stage_by, "owner");
assert.equal((await admin("crm/" + asha.id, { stage: "auto" })).status, 200);
asha = (await admin("crm?q=" + encodeURIComponent(email))).data.rows[0];
assert.equal(asha.stage, "signed_up"); assert.equal(asha.stage_by, "auto");
step("edit stage, tags, notes and follow-up; \"I sent it\" notes the day; a member's stage can follow the app again");

// The spreadsheet.
r = await call("/admin/api/crm?format=csv&show=recent", { token: TOKEN });
assert.equal(r.status, 200); assert.match(r.type, /text\/csv/);
assert.match(r.data, /name,kind,stage,contact/); assert.ok(r.data.includes(email));
step("spreadsheet download");

// The magnet list can be edited, with checks.
const mags = (await admin("marketing/magnets")).data.magnets.filter((m) => m.id !== "other");
assert.equal((await admin("marketing/magnets", { magnets: [...mags, { id: "Bad Id!", name: "x" }] })).status, 400);
assert.equal((await admin("marketing/magnets", { magnets: [...mags, { id: "pyq", name: "Dup" }] })).status, 400);
r = await admin("marketing/magnets", { magnets: [...mags, { id: "essay-pack", name: "Free essay pack", link: "https://aspiran.in/essay/", match: "essay" }] });
assert.equal(r.status, 200); assert.deepEqual(r.data.magnets.at(-1).match, ["essay"]);
assert.equal((await post("/web/hit", { magnet: "essay-pack" })).data.counted, true);
assert.equal((await admin("marketing/magnets", { magnets: mags })).status, 200);
step("the lead-magnet list can be edited, with checks");

// "Delete everywhere": off the list and out of where they came in.
r = await admin(`crm/${tryRow.id}/forget`, {});
assert.equal(r.status, 200); assert.equal(r.data.member, false);
assert.ok(!(await admin("try/feedback?limit=10000")).data.contacts.some((c) => c.contact === tryRow.contact), "the Try contact is gone");
assert.ok(!(await admin("crm?show=lead")).data.rows.some((p) => p.id === tryRow.id));
r = await admin(`crm/${asha.id}/forget`, {});
assert.equal(r.data.member, true); assert.match(r.data.note, /Data requests/);
assert.ok(!(await admin("web/leads")).data.leads.some((l) => l.visitor_id === visitor), "the website lead and chat are gone");
assert.equal((await admin("marketing/refresh", {})).status, 200);
assert.equal((await admin("crm?q=" + encodeURIComponent(email))).data.rows.length, 0, "a sync doesn't bring them back as a lead");
step("delete everywhere: the list, the website lead and the Try one topic contact");

// Erasing a member removes them from the list (they came back as a plain member row after the sync above).
r = await admin("crm/add-members", {});
assert.equal(r.status, 200);
assert.ok((await admin("crm?show=signed_up")).data.rows.some((p) => p.member_id === member));
assert.equal((await post("/privacy/delete", { memberId: member }, tok)).status, 200);
assert.ok(!(await admin("crm?show=recent&limit=1000")).data.rows.some((p) => p.member_id === member));
step("erasing a member takes them off the list");

console.log("\nmarketing: all checks passed");
