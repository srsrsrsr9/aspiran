// Queues a batch of news stories for the coming mornings' Chai: `npm run import:chai -- <file.json>`.
// The file is a list of { day: "YYYY-MM-DD", title, sourceName, sourceUrl, text } (text = the source's own words,
// e.g. a PIB release or a ministry notice). For each story the server drafts a card and runs its checks; it lands in
// the Desk as a draft for that day. With the chai_auto flag on, drafts that pass both checks go out at 7 that morning,
// marked "not yet checked by an editor"; otherwise an editor approves them as usual.
//   EDITOR_TOKEN=<desk key> BASE=https://app.aspiran.in npm run import:chai -- ../content/chai/week-2026-11-16.json
import { readFileSync } from "node:fs";

const BASE = process.env.BASE ?? "http://127.0.0.1:8787";
const TOKEN = process.env.EDITOR_TOKEN;
const file = process.argv[2];
if (!TOKEN || !file) { console.error("Usage: EDITOR_TOKEN=<desk key> BASE=<server> npm run import:chai -- <file.json>"); process.exit(1); }
const stories = JSON.parse(readFileSync(file, "utf8"));
if (!Array.isArray(stories)) { console.error("The file must be a list of stories."); process.exit(1); }
let added = 0, skipped = 0, failed = 0;
for (const s of stories) {
  const miss = ["day", "title", "sourceName", "sourceUrl", "text"].filter((k) => !s?.[k]);
  if (miss.length) { console.log(`✗ ${s?.title ?? "(no title)"}: missing ${miss.join(", ")}`); failed++; continue; }
  const r = await fetch(`${BASE}/desk/api/stories`, { method: "POST", headers: { "content-type": "application/json", authorization: "Bearer " + TOKEN }, body: JSON.stringify(s) });
  const j = await r.json().catch(() => ({}));
  if (r.ok && j.duplicate) { skipped++; console.log(`· ${s.day} already queued: ${s.title}`); }
  else if (r.ok) { added++; console.log(`✓ ${s.day} ${s.title}`); }
  else { failed++; console.log(`✗ ${s.day} ${s.title}: ${j.error ?? r.status}`); }
}
console.log(`\n${added} queued, ${skipped} already there, ${failed} failed.`);
process.exit(failed ? 1 : 0);
