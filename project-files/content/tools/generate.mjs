#!/usr/bin/env node
// Fill templates with Claude Haiku 5.5, then assemble and validate the packs.
//
//   npm install @anthropic-ai/sdk
//   node tools/generate.mjs jobs.jsonl                write packs to content/_generated/
//   node tools/generate.mjs jobs.jsonl --batch        same, through the Message Batches API (half price, slower)
//   node tools/generate.mjs jobs.jsonl --dry-run      print the prompts and schemas, call nothing
//
// A job is one line of JSON:  { "type": "chain", "source": "...text...", "config": { ...overrides }, "notes": "optional" }
// or with "sourceFile": "path/to/story.txt" instead of "source".
// Every pack comes out as review.status "draft". Nothing is published; an editor still checks EN and HI.
import fs from "node:fs";
import path from "node:path";
import { T, ROOT, byKey, jobConfig } from "./templates.mjs";

const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const opt = (f, d) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : d; };
const positional = []; for (let i = 0; i < args.length; i++) { if (args[i] === "--out" || args[i] === "--model") i++; else if (!args[i].startsWith("--")) positional.push(args[i]); }
const jobsFile = positional[0];
const OUT = path.resolve(opt("--out", path.join(ROOT, "content/_generated")));
const MODEL = opt("--model", "claude-haiku-5-5");
const MAX_REPAIRS = 1;
if (!jobsFile) { console.error("usage: node tools/generate.mjs jobs.jsonl [--batch] [--dry-run] [--out dir] [--model id]"); process.exit(2); }

const jobs = fs.readFileSync(jobsFile, "utf8").split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("//")).map((l, i) => {
  const j = JSON.parse(l);
  if (j.sourceFile) j.source = fs.readFileSync(path.resolve(path.dirname(jobsFile), j.sourceFile), "utf8");
  if (!j.source) throw new Error(`job ${i + 1}: needs "source" or "sourceFile"`);
  const t = byKey(j.type);
  const config = jobConfig(t, j.config);
  const fill = T.fillSchema(t.schema, config);
  const p = T.buildPrompt({ system: t.system, brief: t.brief, title: t.title }, { ...j, config });
  return { n: i + 1, customId: `job-${i + 1}-${t.key}`, job: j, t, config, fill, prompt: p };
});

function request(x, messages) {
  return {
    model: MODEL,
    max_tokens: 16000,
    // The system prompt and brief are the same for every job of a type, so they are cached when long enough.
    system: [{ type: "text", text: x.prompt.system, cache_control: { type: "ephemeral" } }],
    messages,
    output_config: { effort: "medium", format: { type: "json_schema", schema: T.apiSchema(x.fill) } }
  };
}

function check(x, message) {
  if (message.stop_reason === "refusal") return { fatal: `declined (${message.stop_details?.category ?? "no category"})` };
  if (message.stop_reason === "max_tokens") return { fatal: "ran out of tokens" };
  const text = message.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  let fill;
  try { fill = JSON.parse(text); } catch { return { errors: ["The reply was not valid JSON."], fill: null }; }
  const f = T.validate(fill, x.fill, { generated: true });
  return { errors: f.errors, fill };
}

function finish(x, fill, attempts) {
  const pack = T.assemble(x.t.key, fill, x.config);
  pack.provenance = { generator: "tools/generate.mjs", model: MODEL, template: x.t.dir, attempts, createdOn: new Date().toISOString().slice(0, 10) };
  const r = T.validate(pack, x.t.schema, { generated: true, source: x.job.source });
  const id = pack.id || x.customId;
  const file = path.join(OUT, x.t.folder.replace(/^content\//, "").replace(/\/$/, ""), `${id}.json`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(pack, null, 2) + "\n");
  return { job: x.n, type: x.t.key, id, file: path.relative(ROOT, file), status: r.errors.length ? "fail" : r.warnings.length ? "check" : "ok", errors: r.errors, warnings: r.warnings };
}

const repairNote = (errors) => `Your JSON has these problems:\n${errors.map((e) => "- " + e).join("\n")}\n\nFix them and return the whole JSON object again. Keep every fact from the source; shorten wording to meet word limits.`;

async function runOne(client, x, firstMessage) {
  const messages = [{ role: "user", content: x.prompt.user }];
  let message = firstMessage ?? await client.messages.create(request(x, messages));
  for (let attempt = 1; ; attempt++) {
    const c = check(x, message);
    if (c.fatal) return { job: x.n, type: x.t.key, status: "fail", errors: [c.fatal] };
    if (!c.errors.length) return finish(x, c.fill, attempt);
    if (attempt > MAX_REPAIRS) return c.fill ? finish(x, c.fill, attempt) : { job: x.n, type: x.t.key, status: "fail", errors: c.errors };
    // Append-only repair turn: the model's reply goes back unchanged, then the list of problems.
    messages.push({ role: "assistant", content: message.content }, { role: "user", content: repairNote(c.errors) });
    message = await client.messages.create(request(x, messages));
  }
}

async function main() {
  if (flag("--dry-run")) {
    for (const x of jobs) {
      console.log(`\n=== job ${x.n}: ${x.t.key} ===\n--- system (${x.prompt.system.length} chars) ---\n${x.prompt.system.slice(0, 600)}...\n--- user ---\n${x.prompt.user}\n--- schema sent to the API ---\n${JSON.stringify(T.apiSchema(x.fill)).slice(0, 800)}...`);
    }
    return;
  }
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic();
  const report = [];
  try {
    if (flag("--batch")) {
      const batch = await client.messages.batches.create({ requests: jobs.map((x) => ({ custom_id: x.customId, params: request(x, [{ role: "user", content: x.prompt.user }]) })) });
      console.log(`Batch ${batch.id} submitted with ${jobs.length} jobs. Waiting...`);
      let b;
      do { await new Promise((r) => setTimeout(r, 30_000)); b = await client.messages.batches.retrieve(batch.id); console.log(`  ${b.processing_status}: ${b.request_counts.succeeded} done, ${b.request_counts.processing} working`); } while (b.processing_status !== "ended");
      const byId = new Map(jobs.map((x) => [x.customId, x]));
      // Results arrive in any order, so match them by custom_id.
      for await (const r of await client.messages.batches.results(batch.id)) {
        const x = byId.get(r.custom_id);
        if (r.result.type === "succeeded") report.push(await runOne(client, x, r.result.message));
        else report.push({ job: x.n, type: x.t.key, status: "fail", errors: [`batch request ${r.result.type}`] });
      }
    } else {
      for (const x of jobs) { report.push(await runOne(client, x)); const last = report.at(-1); console.log(`${last.status.padEnd(5)} job ${x.n} ${x.t.key} ${last.file ?? ""}`); }
    }
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) console.error("No valid API key. Set ANTHROPIC_API_KEY or run `ant auth login`.");
    else if (e instanceof Anthropic.RateLimitError) console.error("Rate limited. Re-run later, or use --batch.");
    else if (e instanceof Anthropic.APIError) console.error(`API error ${e.status}: ${e.message}`);
    else throw e;
    process.exitCode = 1;
  }
  report.sort((a, b) => a.job - b.job);
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(report, null, 2) + "\n");
  const n = (s) => report.filter((r) => r.status === s).length;
  console.log(`\n${n("ok")} ok, ${n("check")} need a fact check (numbers not found in the source), ${n("fail")} failed. Report: ${path.relative(ROOT, path.join(OUT, "report.json"))}`);
}
main();
