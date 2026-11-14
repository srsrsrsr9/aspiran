// Cinematic current affairs (ca.ts): week upload from the desk, approved-only for phones, drafts for local debug
// builds, range reads of the scene videos, and the Plus lock on scenes that aren't free. Against a running local server with AUTH_MODE=dev:
//   EDITOR_TOKEN=... node test/ca.mjs
import assert from "node:assert/strict";

const BASE = process.env.BASE ?? "http://127.0.0.1:8787";
const TOKEN = process.env.EDITOR_TOKEN;
if (!TOKEN) throw new Error("Set EDITOR_TOKEN to the value in your .dev.vars");
const step = (name) => console.log("✓", name);

const WEEK = "1999-07";
const put = (path, body, auth = true) => fetch(`${BASE}/desk/api/ca/${WEEK}/files/${path}`, {
  method: "PUT", headers: auth ? { authorization: "Bearer " + TOKEN } : {}, body,
});
const get = async (path) => { const r = await fetch(BASE + path); return { status: r.status, data: await r.json().catch(() => null) }; };

const scene = (n, id, free, status) => ({
  n, id, title: `Scene ${n}`, durationSec: 40, mp4: `${n}-${id}.mp4`, mp4Social: `${n}-${id}.social.mp4`, vtt: `${n}-${id}.vtt`, poster: `${n}-${id}.jpg`,
  syllabusNodes: [], gsPaper: "prelims-gs", sources: [{ name: "PIB" }],
  quiz: [{ id: `${id}-q1`, q: "Which one?", options: ["A", "B", "C", "D"], answerIndex: 2, why: "Because C." }],
  free, review: { status }, tone: "NEUTRAL",
});
const manifest = (statuses) => ({
  schema: "upsc-pods/ca-week@1", week: WEEK, lang: "en", generatedAt: "1999-02-14T10:00:00Z", voice: "test",
  episodes: [scene(1, "gi-tag", true, statuses[0]), scene(2, "el-nino", false, statuses[1]), scene(3, "sendai", false, statuses[2])],
});

// The desk needs the editor token.
assert.equal((await put("manifest.json", JSON.stringify(manifest(["draft", "draft", "draft"])), false)).status, 401);
step("desk upload needs the editor token");

// A broken manifest says what's wrong.
const broken = manifest(["draft", "draft", "draft"]);
broken.episodes[1].quiz[0].answerIndex = 9;
delete broken.episodes[2].vtt;
let r = await put("manifest.json", JSON.stringify(broken));
assert.equal(r.status, 422);
const errs = (await r.json()).errors;
assert.ok(errs.some((e) => e.includes("answerIndex")) && errs.some((e) => e.includes("vtt")), errs.join("; "));
assert.equal((await put("manifest.json", JSON.stringify({ ...manifest(["draft", "draft", "draft"]), week: "1999-08" }))).status, 422);
step("broken manifests are refused with reasons");

r = await put("manifest.json", JSON.stringify(manifest(["draft", "draft", "draft"])));
assert.equal(r.status, 200);
const { files } = await r.json();
assert.equal(files.length, 9);
assert.ok(!files.some((f) => f.includes("social")));
const video = new Uint8Array(4000).map((_, i) => i % 251);
for (const f of files) assert.equal((await put(f, f.endsWith(".mp4") ? video : "WEBVTT\n")).status, 200, f);
assert.equal((await put("2-el-nino.social.mp4", video)).status, 400);
assert.equal((await put("notes.txt", "x")).status, 400);
step("manifest first, then only the files it names (no social cut)");

// All drafts: phones see nothing; a debug build on the local server asks for drafts and sees them.
let weeks = (await get("/ca")).data.weeks;
assert.ok(!weeks.some((w) => w.week === WEEK));
assert.equal((await get(`/ca/${WEEK}`)).status, 404);
weeks = (await get("/ca?drafts=1")).data.weeks;
assert.equal(weeks.find((w) => w.week === WEEK)?.scenes, 3);
step("drafts are hidden from phones, shown to local debug builds");

// Approve two: they go out, in order, with the folder their paths sit in and without the social cut.
await put("manifest.json", JSON.stringify(manifest(["approved", "draft", "approved"])));
const w = (await get("/ca")).data.weeks.find((x) => x.week === WEEK);
assert.deepEqual([w.scenes, w.free, w.seconds, w.poster], [2, 1, 80, `/media/ca/${WEEK}/1-gi-tag.jpg`]);
const week = (await get(`/ca/${WEEK}`)).data;
assert.deepEqual(week.episodes.map((e) => e.id), ["gi-tag", "sendai"]);
assert.equal(week.base, `/media/ca/${WEEK}/`);
assert.ok(week.episodes.every((e) => !("mp4Social" in e)));
step("approved scenes go out, in order");

// A series in a reserved week stays off the weekly shelf and lists under ?series=, with its title.
const SW = "1999-09";
const sm = { ...manifest(["approved", "approved", "approved"]), week: SW, series: "syllabus-in-a-minute", title: "GS2", titleHi: "GS2" };
assert.equal((await fetch(`${BASE}/desk/api/ca/${SW}/files/manifest.json`, { method: "PUT", headers: { authorization: "Bearer " + TOKEN }, body: JSON.stringify(sm) })).status, 200);
assert.ok(!(await get("/ca")).data.weeks.some((x) => x.week === SW));
const sl = (await get("/ca?series=syllabus-in-a-minute")).data.weeks;
assert.deepEqual(sl.map((x) => [x.week, x.title, x.scenes]), [[SW, "GS2", 3]]);
assert.equal((await get(`/ca/${SW}`)).data.title, "GS2");
step("a series has its own shelf, off the weekly one");

// The player reads videos in ranges.
const full = await fetch(`${BASE}${week.base}1-gi-tag.mp4`);
assert.equal(full.status, 200);
assert.equal(full.headers.get("content-type"), "video/mp4");
assert.equal(full.headers.get("accept-ranges"), "bytes");
assert.equal((await full.arrayBuffer()).byteLength, 4000);
const part = await fetch(`${BASE}${week.base}1-gi-tag.mp4`, { headers: { range: "bytes=1000-1009" } });
assert.equal(part.status, 206);
assert.equal(part.headers.get("content-range"), "bytes 1000-1009/4000");
assert.deepEqual([...new Uint8Array(await part.arrayBuffer())], [...video.slice(1000, 1010)]);
const tail = await fetch(`${BASE}${week.base}1-gi-tag.mp4`, { headers: { range: "bytes=3990-" } });
assert.equal(tail.headers.get("content-range"), "bytes 3990-3999/4000");
assert.equal((await tail.arrayBuffer()).byteLength, 10);
assert.equal((await fetch(`${BASE}${week.base}1-gi-tag.vtt`)).headers.get("content-type"), "text/vtt; charset=utf-8");
step("videos are served in ranges; captions as text/vtt");

// Plus lock: a scene that isn't free plays only with a signed query, which only a Plus member gets.
const json = { "content-type": "application/json" };
const editor = { ...json, authorization: "Bearer " + TOKEN };
const locked = `${BASE}${week.base}3-sendai.mp4`;
assert.equal((await fetch(locked)).status, 403, "no key, no Plus scene");
assert.equal((await fetch(`${BASE}${week.base}3-sendai.vtt`)).status, 403, "captions are locked too");
assert.equal((await fetch(`${BASE}${week.base}3-sendai.jpg`)).status, 200, "posters stay open (shown blurred)");
const me = crypto.randomUUID().replace(/-/g, "");
assert.equal((await fetch(`${BASE}/plus/ca-key?member=${me}&week=${WEEK}`)).status, 403, "no plan, no key");
const flagsBefore = (await (await fetch(BASE + "/admin/api/flags", { headers: editor })).json()).flags;
await fetch(BASE + "/admin/api/flags", { method: "POST", headers: editor, body: JSON.stringify({ flags: { plus: true } }) });
try {
  const bought = await fetch(BASE + "/plus/purchase", { method: "POST", headers: json, body: JSON.stringify({ memberId: me, plan: "monthly", testMode: true }) });
  assert.equal(bought.status, 200, await bought.clone().text());
} finally {
  await fetch(BASE + "/admin/api/flags", { method: "POST", headers: editor, body: JSON.stringify({ flags: { plus: flagsBefore.plus } }) });
}
const key = (await get(`/plus/ca-key?member=${me}&week=${WEEK}`)).data;
assert.match(key.query, /^exp=\d+&sig=[0-9a-f]{64}$/);
assert.ok(Date.parse(key.expiresAt) > Date.now() + 5 * 3600_000, "the key lasts hours, not days");
const open = await fetch(`${locked}?${key.query}`, { headers: { range: "bytes=0-9" } });
assert.equal(open.status, 206);
assert.equal(open.headers.get("cache-control"), "private, max-age=3600");
assert.equal((await fetch(`${BASE}${week.base}3-sendai.vtt?${key.query}`)).status, 200);
assert.equal((await fetch(`${locked}?${key.query.slice(0, -1)}${key.query.endsWith("0") ? "1" : "0"}`)).status, 403, "a changed signature fails");
assert.equal((await fetch(`${locked}?exp=${Math.floor(Date.now() / 1000) - 10}&sig=${key.query.split("sig=")[1]}`)).status, 403, "an expired key fails");
assert.equal((await fetch(`${BASE}/media/ca/1999-08/3-sendai.mp4?${key.query}`)).status !== 206, true, "a key is for one week");
step("Plus scenes: 403 without a key; a Plus member's 6-hour signed key opens them; posters stay open");

console.log("\nca: all passed");
