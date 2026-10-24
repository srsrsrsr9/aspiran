// Answer Studio against the live server: one typed answer and one photo of a handwritten answer through
// POST /answers/evaluate, printing what came back. Each call uses one of that member's free reviews this week.
// Nothing is stored by the server (the photo is read and dropped).
//
//   MEMBER_TOKEN=<sign-in token> MEMBER_ID=<member id> node scripts/live-answer-check.mjs <answer-photo.jpg>
//
// MEMBER_TOKEN is the owner's own sign-in token (a Firebase ID token, or the "upw." token from a username/password
// sign-in), typed into the shell, never into a file. BASE defaults to production.
import { readFileSync } from "node:fs";
import { extname } from "node:path";

const BASE = process.env.BASE ?? "https://upsc-pods-production.chotu-aec.workers.dev";
const TOKEN = process.env.MEMBER_TOKEN, MEMBER = process.env.MEMBER_ID, photo = process.argv[2];
if (!TOKEN || !MEMBER || !photo) {
  console.error("usage: MEMBER_TOKEN=... MEMBER_ID=... node scripts/live-answer-check.mjs <answer-photo.jpg>");
  process.exit(1);
}
const MIME = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" }[extname(photo).toLowerCase()];
if (!MIME) { console.error("The photo should be a .jpg, .png or .webp"); process.exit(1); }

const QUESTION = "Critically examine the role of self-help groups in improving rural livelihoods in India.";
const TYPED = `Self-help groups (SHGs) are small groups of 10 to 20 members, mostly women, who save together and lend to each other.
Under DAY-NRLM over 9 crore women are in SHGs. They help in three ways. First, credit: bank linkage gives loans without
collateral, which cuts dependence on moneylenders. Second, livelihoods: groups run dairies, food processing and retail,
and some sell through state brands. Third, voice: members take part in gram sabhas and some later contest panchayat polls.
The limits are real. Many groups stay at thrift and small loans and never reach markets. Loans are often used for
consumption. Weak bookkeeping, elite capture and patchy training slow them down, and the gains are uneven across states.
The way forward is market links through producer groups, digital records, skill training and federations that can bargain.
With these, SHGs can move from credit to enterprise and make rural growth more inclusive.`;

async function evaluate(label, extra) {
  const t0 = Date.now();
  const res = await fetch(BASE + "/answers/evaluate", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: "Bearer " + TOKEN },
    body: JSON.stringify({ memberId: MEMBER, question: QUESTION, words: 150, ...extra }),
  });
  const data = await res.json().catch(() => null);
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\n== ${label}: HTTP ${res.status} in ${secs}s`);
  if (!res.ok || !data) { console.log(JSON.stringify(data, null, 1)); return false; }
  const { model, wordCount, overLimit, left, limit } = data;
  console.log(`model ${model} · ${wordCount} words${overLimit ? " (over the limit)" : ""} · reviews left ${left ?? "∞"}${limit ? "/" + limit : ""}`);
  console.log(JSON.stringify(data, null, 1).slice(0, 3000));
  return true;
}

const typed = await evaluate("Typed answer", { text: TYPED });
const image = await evaluate("Photo answer", { image: { mime: MIME, data: readFileSync(photo).toString("base64") } });
console.log(`\n${typed && image ? "Both reviews came back." : "At least one review failed; see above."}`);
process.exit(typed && image ? 0 : 1);
