// Which model answers Chotu and Jeetu, and how a provider with a billing or key problem is set aside so no chat waits
// on it. Needs no server and no keys: ai.ts is bundled and run against a pretend database and pretend providers.
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const step = (name) => console.log("✓", name);
const dir = mkdtempSync(join(tmpdir(), "providers-test-"));
const out = join(dir, "ai.mjs");
await build({ entryPoints: ["src/ai.ts"], bundle: true, format: "esm", platform: "node", outfile: out, logLevel: "error" });
const A = await import(pathToFileURL(out).href);
rmSync(dir, { recursive: true, force: true });

// --- Routes: the working backups first, Google last in Hindi and Telugu --------------------------------------------
for (const lang of ["hi", "te"]) {
  const r = A.CHAT_ROUTES[lang];
  const firstGoogle = r.findIndex((h) => h.provider === "google");
  assert.ok(firstGoogle >= 2, `${lang}: at least two other models before Google`);
  assert.ok(r.slice(firstGoogle).every((h) => h.provider === "google"), `${lang}: Google only at the end`);
  assert.ok(new Set(r.map((h) => h.provider)).size >= 2, `${lang}: more than one provider`);
}
assert.ok(!A.CHAT_ROUTES.te.some((h) => h.model.includes("nemotron")), "Nemotron mangles Telugu");
assert.ok(!A.CHAT_ROUTES.en.some((h) => h.provider === "google"), "English never waits on Google");
step("Hindi and Telugu try the working backups first; Google is last");

// --- A pretend D1 and pretend providers -----------------------------------------------------------------------------
const settings = new Map();
const calls = [];
const DB = {
  batch: async () => [],
  prepare(sql) {
    let args = [];
    const st = {
      bind: (...a) => { args = a; return st; },
      run: async () => {
        if (sql.startsWith("INSERT INTO settings")) settings.set(args[0], args[1]);
        if (sql.startsWith("INSERT INTO llm_calls")) calls.push({ model: args[3], status: args[4], error: args[8] });
        return {};
      },
      first: async () => sql.includes("FROM settings") ? (settings.has(args[0]) ? { json: settings.get(args[0]) } : null) : { calls: 0, tokens: 0 },
      all: async () => ({ results: [] }),
    };
    return st;
  },
};
const env = { DB, GROQ_API_KEY: "g", GOOGLE_AI_API_KEY: "k", NVIDIA_API_KEY: "n" };
let asked = [];
let answer = {}; // provider host → HTTP status
globalThis.fetch = async (url, init) => {
  const host = new URL(url).host;
  asked.push(JSON.parse(init.body).model);
  const status = answer[host] ?? 200;
  if (status !== 200) return new Response("{}", { status });
  return new Response(JSON.stringify({ choices: [{ message: { content: "उत्तर" }, finish_reason: "stop" }], usage: {} }), { status: 200 });
};
const GOOGLE = "generativelanguage.googleapis.com", GROQ = "api.groq.com", NVIDIA = "integrate.api.nvidia.com";
const hops = [
  { provider: "google", model: "gemini-3.8-flash" },
  { provider: "google", model: "gemma-4-31b-it" },
  { provider: "groq", model: "qwen/qwen3.8-27b" },
];
const turn = [{ role: "user", content: "नमस्ते" }];

// A 402 sets the whole Google account aside, not just the one model.
answer = { [GOOGLE]: 402 };
asked = [];
let r = await A.callChat(env, "chotu", turn, hops);
assert.equal(r.model, "qwen/qwen3.8-27b");
assert.deepEqual(asked, ["gemini-3.8-flash", "qwen/qwen3.8-27b"], "Gemma on the same account isn't asked once Gemini says 402");
assert.ok((await A.downProviders(env)).google, "Google is set aside");
step("a 402 sets the provider aside at once, every model on it");

// The next chats don't wait on Google at all.
asked = [];
r = await A.callChat(env, "chotu", turn, hops);
assert.deepEqual(asked, ["qwen/qwen3.8-27b"]);
step("later chats go straight to the backup");

// For a whole day, not three hours.
assert.ok(A.DOWN_FOR_MS >= 24 * 60 * 60 * 1000);
const aside = JSON.parse(settings.get("ai_down"));
aside.google.since = new Date(Date.now() - 23 * 3600e3).toISOString();
settings.set("ai_down", JSON.stringify(aside));
assert.ok((await A.downProviders(env)).google, "still aside after 23 hours");
aside.google.since = new Date(Date.now() - 25 * 3600e3).toISOString();
settings.set("ai_down", JSON.stringify(aside));
assert.ok(!(await A.downProviders(env)).google, "tried again after a day");
aside.google.since = new Date().toISOString();
settings.set("ai_down", JSON.stringify(aside));
step("set aside for 24 hours unless the health check brings it back");

// If every other model fails, Google is still asked as a last resort rather than giving no answer.
answer = { [GOOGLE]: 200, [GROQ]: 500 };
asked = [];
r = await A.callChat(env, "chotu", turn, hops);
assert.deepEqual(asked, ["qwen/qwen3.8-27b", "gemini-3.8-flash"]);
assert.equal(r.model, "gemini-3.8-flash");
assert.ok(!(await A.downProviders(env)).google, "a proper answer brings it back");
step("a set-aside provider is the last resort, and a good answer brings it back");

// The 04:30 health check: one tiny call per set-aside provider.
answer = { [GOOGLE]: 402 };
await A.callChat(env, "chotu", turn, hops);
asked = [];
let h = await A.checkProviders(env);
assert.deepEqual(h, { google: "still down" });
assert.equal(asked.length, 1, "one call, not one per model");
assert.ok((await A.downProviders(env)).google);
answer = {};
asked = [];
h = await A.checkProviders(env);
assert.deepEqual(h, { google: "back" });
assert.ok(!(await A.downProviders(env)).google);
asked = [];
assert.deepEqual(await A.checkProviders(env), {}, "nothing to check when nothing is aside");
assert.equal(asked.length, 0);
step("the health check asks once, and brings a fixed provider back");

// A rejected key counts the same; a rate limit or a slow reply doesn't set anything aside.
answer = { [NVIDIA]: 401 };
await A.callChat(env, "chotu", turn, [{ provider: "nvidia", model: "google/gemma-4-31b-it" }, hops[2]]);
assert.ok((await A.downProviders(env)).nvidia);
answer = { [GOOGLE]: 429 };
await A.callChat(env, "chotu", turn, hops);
assert.ok(!(await A.downProviders(env)).google);
step("a rejected key sets aside; a rate limit doesn't");
