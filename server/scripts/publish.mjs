// Run by publish.bat (double-click). Puts the D1 Database ID into wrangler.jsonc, signs in to Cloudflare if
// needed (the browser does it; we never see a password or token), deploys, and prints the live address.
// Never asks for, prints or stores a secret. `--dry-run` stops after the sign-in check (used for testing).
import { readFileSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const config = join(root, "wrangler.jsonc");
const wranglerJs = join(root, "node_modules", "wrangler", "bin", "wrangler.js");
const dryRun = process.argv.includes("--dry-run");
const BUCKETS = ["upsc-pods-media", "upsc-pods-backups"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

class Stop extends Error {}
const say = (s = "") => console.log(s);
const fail = (msg) => { throw new Stop(msg); };

// Runs wrangler. `show` echoes its output live; the text is also returned for checking. Nothing is saved to disk.
function wrangler(args, { show = true, interactive = false } = {}) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [wranglerJs, ...args], {
      cwd: root,
      stdio: interactive ? "inherit" : ["inherit", "pipe", "pipe"],
      env: { ...process.env, WRANGLER_SEND_METRICS: "false" },
    });
    let out = "";
    const take = (stream) => (d) => { out += d; if (show) stream.write(d); };
    child.stdout?.on("data", take(process.stdout));
    child.stderr?.on("data", take(process.stderr));
    child.on("error", (e) => resolve({ code: 1, out: String(e) }));
    child.on("close", (code) => resolve({ code: code ?? 1, out }));
  });
}

// Replaces the database_id of the D1 binding inside env.production only (the top-level one stays the local placeholder).
function setDatabaseId(id) {
  const text = readFileSync(config, "utf8");
  const prod = text.indexOf('"production"');
  if (prod < 0) fail("I couldn't find the production settings in wrangler.jsonc.");
  const d1 = text.indexOf('"d1_databases"', prod);
  const re = /("database_id"\s*:\s*")([^"]*)(")/g;
  re.lastIndex = d1 < 0 ? prod : d1;
  const m = re.exec(text);
  if (!m) fail("I couldn't find the database_id line in wrangler.jsonc.");
  if (m[2].toLowerCase() === id.toLowerCase()) return false;
  copyFileSync(config, config + ".bak");
  writeFileSync(config, text.slice(0, m.index) + m[1] + id + m[3] + text.slice(m.index + m[0].length));
  return true;
}

// One reader for everything typed into the window, so lines are never lost between questions.
let lines;
async function readLine() {
  lines ??= createInterface({ input: process.stdin })[Symbol.asyncIterator]();
  const { value, done } = await lines.next();
  return done ? null : value.trim().replace(/^["']|["']$/g, "").trim();
}

async function askDatabaseId() {
  for (;;) {
    process.stdout.write("Paste your D1 Database ID (from the upsc-pods database Overview page) and press Enter:\n> ");
    const id = await readLine();
    if (id === null) fail("No Database ID was entered.");
    if (UUID.test(id)) return id.toLowerCase();
    say("");
    say("That doesn't look like a Database ID. It has 36 characters in five groups, like");
    say("  927b8d17-edf9-4ed3-b13e-a4940cd9452e");
    say("Copy it again from the Cloudflare page and paste it here.");
    say("");
  }
}

// The accounts table printed by `wrangler whoami`: rows of "│ name │ 32-hex id │". Account IDs aren't secrets.
const parseAccounts = (out) =>
  [...out.matchAll(/│\s*(.+?)\s*│\s*([0-9a-f]{32})\s*│/g)].map((m) => ({ name: m[1], id: m[2] }));

function savedAccountId() {
  const text = readFileSync(config, "utf8");
  return text.slice(text.indexOf('"production"')).match(/"account_id"\s*:\s*"([0-9a-f]{32})"/)?.[1];
}

function saveAccountId(id) {
  const text = readFileSync(config, "utf8");
  const m = /"production"\s*:\s*\{/.exec(text);
  if (!m) fail("I couldn't find the production settings in wrangler.jsonc.");
  if (!existsSync(config + ".bak")) copyFileSync(config, config + ".bak");
  const at = m.index + m[0].length;
  writeFileSync(config, text.slice(0, at) + `\n      "account_id": "${id}",` + text.slice(at));
}

async function askAccount(accounts) {
  say("");
  say("Your Cloudflare sign-in has more than one account:");
  accounts.forEach((a, i) => say(`  ${i + 1}. ${a.name}`));
  say("Pick the one where you created the upsc-pods database and the two buckets.");
  say("(The account name is shown at the top left of the Cloudflare dashboard.)");
  for (;;) {
    process.stdout.write(`Type a number from 1 to ${accounts.length} and press Enter:\n> `);
    const n = await readLine();
    if (n === null) fail("No account was chosen.");
    const a = accounts[Number(n) - 1];
    if (/^\d+$/.test(n) && a) return a;
  }
}

function explainDeployFailure(out) {
  const missing = BUCKETS.filter((b) => out.includes(b));
  if (/10085|bucket[^\n]*(not found|does not exist|doesn't exist)/i.test(out)) {
    const names = missing.length ? missing : BUCKETS;
    return [
      "A storage bucket is missing. In the Cloudflare dashboard go to R2 Object Storage -> Create bucket and create:",
      ...names.map((b) => `    ${b}`),
      "Type the name exactly as shown, leave the other options as they are, then double-click publish.bat again.",
    ];
  }
  if (/workers\.dev subdomain/i.test(out)) {
    return [
      "Your account doesn't have a workers.dev address yet.",
      "In the Cloudflare dashboard open Workers & Pages once (it offers to set up the address), then double-click publish.bat again.",
    ];
  }
  if (/database[^\n]*(not found|does not exist)|7404|10021/i.test(out)) {
    return [
      "Cloudflare couldn't find the database with the ID you pasted.",
      "Open D1 -> upsc-pods -> Overview, copy the Database ID again, and double-click publish.bat again.",
      "If it's in a different account from the one you picked, send a screenshot to Claude to switch it.",
    ];
  }
  if (/not authenticated|10000|authentication error|not logged in/i.test(out)) {
    return ["Cloudflare didn't accept the sign-in. Double-click publish.bat again and click Allow on the Cloudflare page."];
  }
  if (/more than one account/i.test(out)) {
    return ["Cloudflare couldn't tell which account to use. Double-click publish.bat again and pick the account when asked."];
  }
  if (/R2/i.test(out) && /enable|purchase|subscribe/i.test(out)) {
    return ["R2 storage isn't switched on for this account yet. In the dashboard open R2 Object Storage and follow its steps, then try again."];
  }
  return ["The upload didn't finish."];
}

async function main() {
  say("==================================================================");
  say("  Publish UPSC Pods to Cloudflare");
  say("==================================================================");
  say("This will:");
  say("  1. Ask for your D1 Database ID and save it in the app's settings.");
  say("  2. Sign you in to Cloudflare in your browser, if you aren't already.");
  say("  3. Upload the app and show you its web address.");
  say("It never asks for passwords or secret keys. Those go in the Cloudflare dashboard.");
  say("");

  if (!existsSync(wranglerJs)) fail("The app's tools aren't installed in this folder (node_modules\\wrangler is missing).");
  if (!existsSync(config)) fail("I couldn't find wrangler.jsonc next to publish.bat.");

  const id = await askDatabaseId();
  say("");
  say(setDatabaseId(id) ? "Saved the Database ID. (The old settings are kept in wrangler.jsonc.bak.)" : "The Database ID is already saved. Nothing to change.");
  say("");

  say("Checking whether you're signed in to Cloudflare...");
  const who = await wrangler(["whoami"], { show: false });
  const signedIn = who.code === 0 && !/not authenticated|not logged in/i.test(who.out) && /logged in|associated with/i.test(who.out);
  if (signedIn) {
    say("You're signed in.");
  } else if (dryRun) {
    say("You're not signed in. (Test run: stopping here, before the sign-in.)");
    return;
  } else {
    say("");
    say("Your browser will open a Cloudflare page. Check it starts with dash.cloudflare.com and click Allow.");
    say("Then come back to this window.");
    say("");
    const login = await wrangler(["login"], { interactive: true });
    if (login.code !== 0) fail("The sign-in didn't finish.");
    say("");
  }
  const accounts = parseAccounts(signedIn ? who.out : (await wrangler(["whoami"], { show: false })).out);
  const saved = savedAccountId();
  if (accounts.length > 1 && !accounts.some((a) => a.id === saved)) {
    const a = await askAccount(accounts);
    saveAccountId(a.id);
    say(`Saved: the app will go to "${a.name}".`);
    say("");
  }
  if (dryRun) { say("(Test run: stopping before the upload.)"); return; }

  say("Uploading the app. This takes a minute or two...");
  say("");
  const account = savedAccountId();
  if (account) process.env.CLOUDFLARE_ACCOUNT_ID = account;
  const dep = await wrangler(["deploy", "--env", "production"]);
  say("");
  if (dep.code !== 0) throw new Stop(explainDeployFailure(dep.out).join("\n"));

  const url = dep.out.match(/https:\/\/[a-z0-9.-]+\.workers\.dev/i)?.[0];
  say("==================================================================");
  say("  Done! The app is live at:");
  say("");
  say("      " + (url ?? "(address not shown above: look in Workers & Pages -> upsc-pods-production)"));
  say("");
  say("==================================================================");
  say("Two last things:");
  say("  1. Add the four secrets in the Cloudflare dashboard:");
  say("     Workers & Pages -> upsc-pods-production -> Settings -> Variables and Secrets");
  say("  2. Reply in the Claude thread with the address above.");
}

main().then(
  () => process.exit(0),
  (e) => {
    say("");
    say("------------------------------------------------------------------");
    say("Something went wrong.");
    say(e instanceof Stop ? e.message : "Unexpected problem: " + (e?.message ?? e));
    say("");
    say("Please send a screenshot of this window to Claude.");
    say("------------------------------------------------------------------");
    process.exit(1);
  },
);
