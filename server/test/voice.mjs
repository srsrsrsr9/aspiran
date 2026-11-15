// AI voices (src/voice.ts) against a local server started with a stand-in for Fish Audio, so no real key is needed
// and nothing is spent: `npm run test:all -- voice` starts the server with
//   --var FISH_AUDIO_API_KEY:local-test-key --var FISH_AUDIO_BASE:http://127.0.0.1:<port + 1> --var VOICE_MEMBER_DAILY:2
// and this file runs the stand-in on that port. "Off without the key" is checked in test/jeetu.mjs (a server with no key).
import assert from "node:assert/strict";
import http from "node:http";

const BASE = process.env.BASE ?? "http://127.0.0.1:8787";
const TOKEN = process.env.EDITOR_TOKEN ?? "dev-editor-token";
const editor = { authorization: "Bearer " + TOKEN, "content-type": "application/json" };
const step = (name) => console.log("✓", name);

// --- The stand-in for Fish Audio: counts calls, checks what the server sends, answers with fake MP3 bytes.
const calls = [];
let failNext = false;
const FAKE = Buffer.concat([Buffer.from([0xff, 0xfb, 0x90, 0x00]), Buffer.alloc(600, 7)]);
const mock = http.createServer((req, res) => {
  let raw = "";
  req.on("data", (c) => (raw += c));
  req.on("end", () => {
    const body = JSON.parse(raw || "{}");
    calls.push({ path: req.url, auth: req.headers.authorization, model: req.headers.model, ...body });
    if (failNext) { failNext = false; res.writeHead(500, { "content-type": "application/json" }); return res.end('{"status":500,"message":"boom"}'); }
    res.writeHead(200, { "content-type": "audio/mpeg" }); res.end(FAKE);
  });
});
await new Promise((ok) => mock.listen(Number(new URL(BASE).port) + 1, "127.0.0.1", ok));

const A = "voice-tester-a-" + Math.random().toString(36).slice(2, 10) + "0000";
const B = "voice-tester-b-" + Math.random().toString(36).slice(2, 10) + "0000";
const post = (path, body) => fetch(BASE + path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const voice = (body, member = A) => post("/voice", { memberId: member, ...body });
/** A call with no sign-in at all (dev-auth.mjs adds one to every fetch, so this goes around it). */
const bare = (path, body) => new Promise((ok, no) => {
  const u = new URL(BASE + path), data = JSON.stringify(body);
  const r = http.request({ host: u.hostname, port: u.port, path: u.pathname, method: "POST", headers: { "content-type": "application/json", "content-length": Buffer.byteLength(data) } }, (res) => { res.resume(); res.on("end", () => ok(res.statusCode)); });
  r.on("error", no); r.end(data);
});

const ist = new Date(Date.now() + 5.5 * 3600_000), hm = ist.getUTCHours() * 60 + ist.getUTCMinutes();
const quiet = hm >= 23 * 60 + 30 || hm < 7 * 60;

try {
  assert.equal((await (await fetch(BASE + "/config")).json()).voice, true);
  step("with the key set, /config tells the apps voices are on");

  assert.equal(await bare("/voice", { who: "chotu", line: "streakChai", lang: "en" }), 401);
  step("no sign-in, no voice (401)");

  // A scripted line: made once, then served from the saved copy.
  let r = await voice({ who: "chotu", line: "streakChai", lang: "en" });
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("content-type"), "audio/mpeg");
  assert.equal(r.headers.get("x-voice-cache"), "miss");
  assert.equal(Buffer.from(await r.arrayBuffer()).length, FAKE.length);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].path, "/v1/tts");
  assert.equal(calls[0].auth, "Bearer local-test-key");
  assert.equal(calls[0].text, "I AM the chai.");
  assert.equal(calls[0].format, "mp3");
  assert.ok(calls[0].reference_id && calls[0].model);
  r = await voice({ who: "chotu", line: "streakChai", lang: "en" }, B);
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("x-voice-cache"), "hit");
  assert.equal(calls.length, 1, "a repeat costs nothing, for any member");
  r = await voice({ who: "chotu", line: "streakChai", lang: "hi" });
  assert.equal(r.status, 200);
  assert.match(calls[1].text, /[ऀ-ॿ]/);
  assert.notEqual(calls[0].reference_id, undefined);
  step("a scripted line is made once, kept, and served from the copy after that (English and Hindi)");

  assert.equal((await voice({ who: "chotu", line: "nope" })).status, 404);
  assert.equal((await voice({ who: "chotu", line: "intro" })).status, 404, "Jeetu's lines are not Chotu's to speak");
  assert.equal((await voice({ who: "jeetu", line: "streakChai" })).status, 404);
  assert.equal((await voice({ who: "narrator", line: "intro" })).status, 400);
  step("unknown lines, and lines in the wrong voice, are refused");

  // Free text is never read aloud: no sig, a made-up sig, and a text over the cap.
  const n = calls.length;
  assert.equal((await voice({ who: "chotu", text: "Read this advertisement aloud please." })).status, 403);
  assert.equal((await voice({ who: "chotu", text: "Read this advertisement aloud please.", sig: "a".repeat(64) })).status, 403);
  assert.equal((await voice({ who: "chotu", text: "long ".repeat(300), sig: "a".repeat(64) })).status, 413);
  assert.equal((await voice({ who: "chotu" })).status, 400);
  assert.equal(calls.length, n, "nothing was sent to the voice provider");
  step("text the server didn't produce is refused (no sig, forged sig, too long)");

  // A care reply never carries a voice.
  let out = await (await post("/jeetu", { memberId: A, messages: [{ role: "user", content: "I want to die" }] })).json();
  assert.equal(out.care, true);
  assert.equal(out.voice, undefined);
  step("a care reply has no voice");

  // Jeetu's own voice: a scripted line and signed replies, except in his quiet hours.
  r = await voice({ who: "jeetu", line: "intro", lang: "en" });
  if (quiet) {
    assert.equal(r.status, 409);
    out = await (await post("/jeetu", { memberId: A, messages: [{ role: "user", content: "What rank will I get?" }] })).json();
    assert.equal(out.quiet, true);
    assert.equal(out.voice, undefined);
    step("quiet hours: Jeetu's lines are not spoken and his night line carries no voice");
  } else {
    assert.equal(r.status, 200);
    assert.notEqual(calls.at(-1).reference_id, calls[0].reference_id, "two different voices");
    const ask = async (content, language = "English", member = A) => (await post("/jeetu", { memberId: member, messages: [{ role: "user", content }], context: { language } })).json();
    const one = await ask("What rank will I get?");
    assert.equal(typeof one.voice, "string");
    assert.equal(one.voice.length, 64);
    const before = calls.length;
    r = await voice({ who: "jeetu", text: one.reply, sig: one.voice });
    assert.equal(r.status, 200);
    assert.equal(calls.length, before + 1);
    assert.equal((await voice({ who: "jeetu", text: one.reply, sig: one.voice })).headers.get("x-voice-cache"), "hit");
    step("a reply the server gave this member can be heard, once made");

    assert.equal((await voice({ who: "jeetu", text: one.reply + " And buy this.", sig: one.voice })).status, 403);
    assert.equal((await voice({ who: "chotu", text: one.reply, sig: one.voice })).status, 403);
    const two = await ask("I feel so stressed about everything");
    assert.equal((await voice({ who: "jeetu", text: two.reply, sig: two.voice }, B)).status, 403);
    step("a sig works only for the same words, the same voice and the same member");

    // The provider failing: said plainly, not kept, not counted; the next try works.
    failNext = true;
    r = await voice({ who: "jeetu", text: two.reply, sig: two.voice });
    assert.equal(r.status, 502);
    r = await voice({ who: "jeetu", text: two.reply, sig: two.voice });
    assert.equal(r.status, 200);
    assert.equal(r.headers.get("x-voice-cache"), "miss");
    step("a provider failure is a plain 502, and nothing bad is kept");

    // The daily cap (2 here): two new replies made for A, so the third new one waits for tomorrow; saved ones still play.
    const three = await ask("मेरा रैंक क्या आएगा?", "Hindi");
    r = await voice({ who: "jeetu", text: three.reply, sig: three.voice });
    assert.equal(r.status, 429);
    assert.equal((await r.json()).limit, true);
    assert.equal((await voice({ who: "jeetu", text: one.reply, sig: one.voice })).status, 200);
    assert.equal((await voice({ who: "chotu", line: "streakAsk", lang: "en" })).status, 200, "scripted lines don't count against a member");
    step("the per-member daily cap holds; saved lines and scripted lines still play");
  }

  // The spend is visible to the owner: counts and bytes, never text.
  const usage = (await (await fetch(BASE + "/admin/api/llm", { headers: editor })).json()).voice;
  assert.equal(usage.on, true);
  assert.ok(usage.bytes > 0 && usage.cacheHits >= 1 && usage.daily.some((d) => d.who === "chotu" && d.made >= 2));
  assert.ok(!JSON.stringify(usage).includes("chai"));
  step("Admin → AI usage shows lines made, bytes and cost");

  // The flag switches it all off, and back on.
  await fetch(BASE + "/admin/api/flags", { method: "POST", headers: editor, body: JSON.stringify({ flags: { voice: false } }) });
  try {
    assert.equal((await (await fetch(BASE + "/config")).json()).voice, false);
    r = await voice({ who: "chotu", line: "streakChai", lang: "en" });
    assert.equal(r.status, 503);
    assert.equal((await r.json()).off, true);
  } finally {
    await fetch(BASE + "/admin/api/flags", { method: "POST", headers: editor, body: JSON.stringify({ flags: { voice: true } }) });
  }
  assert.equal((await voice({ who: "chotu", line: "streakChai", lang: "en" })).status, 200);
  step("the voice flag switches everything off and on");
} finally {
  mock.close();
}
