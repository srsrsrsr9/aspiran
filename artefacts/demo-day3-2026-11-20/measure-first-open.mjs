// Headless Chrome over the DevTools protocol: a cold browser per run, Chrome's own network throttling.
// node cdp.mjs measure <url> [runs] [rttMs] [kbps]      → time until the topic's title shows
// node cdp.mjs shots <script.json>                      → a walk-through: steps of {go|eval|wait|shot}
import { spawn } from "node:child_process"; import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs"; import { tmpdir } from "node:os"; import { join } from "node:path";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function browser(port, mobile = true) {
  const dir = mkdtempSync(join(tmpdir(), "cdp-"));
  const p = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, "--no-first-run", "--no-default-browser-check", "about:blank"], { stdio: "ignore" });
  let ws;
  for (let i = 0; i < 50; i++) { try { const t = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); const pg = t.find((x) => x.type === "page"); if (pg) { ws = pg.webSocketDebuggerUrl; break; } } catch {} await sleep(200); }
  const sock = new WebSocket(ws); await new Promise((r) => sock.addEventListener("open", r));
  let id = 0; const wait = new Map();
  sock.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && wait.has(m.id)) { wait.get(m.id)(m); wait.delete(m.id); } });
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; wait.set(i, r); sock.send(JSON.stringify({ id: i, method, params })); });
  await send("Page.enable"); await send("Network.enable"); await send("Runtime.enable");
  if (mobile) await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  const evaluate = async (expr) => (await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value;
  const close = () => { sock.close(); p.kill("SIGKILL"); setTimeout(() => { try { rmSync(dir, { recursive: true, force: true }); } catch {} }, 500); };
  return { send, evaluate, close };
}
const [, , cmd, a1, a2 = "3", rtt = "300", kbps = "750"] = process.argv;
if (cmd === "measure") {
  const out = [];
  for (let i = 0; i < Number(a2); i++) {
    const b = await browser(9333 + i);
    await b.send("Network.emulateNetworkConditions", { offline: false, latency: Number(rtt), downloadThroughput: (Number(kbps) * 1000) / 8, uploadThroughput: (Number(kbps) * 1000) / 8 });
    await b.send("Network.setCacheDisabled", { cacheDisabled: true });
    const t0 = Date.now(); await b.send("Page.navigate", { url: a1 });
    let cover = null;
    while (Date.now() - t0 < 30000) { if (await b.evaluate("!!document.querySelector('.try h1')")) { cover = Date.now() - t0; break; } await sleep(25); }
    out.push(cover); b.close(); await sleep(300);
  }
  console.log(JSON.stringify({ url: a1, rtt: Number(rtt), kbps: Number(kbps), coverMs: out, median: [...out].sort((x, y) => x - y)[Math.floor(out.length / 2)] }));
  process.exit(0);
}
if (cmd === "shots") {
  const steps = JSON.parse(readFileSync(a1, "utf8")); const b = await browser(9444, steps.mobile !== false);
  for (const s of steps.steps) {
    if (s.go) { await b.send("Page.navigate", { url: s.go }); await sleep(s.ms ?? 1500); }
    if (s.eval) { const v = await b.evaluate(s.eval); if (s.log) console.log(s.log, JSON.stringify(v)); await sleep(s.ms ?? 600); }
    if (s.waitFor) { const t0 = Date.now(); while (Date.now() - t0 < 15000 && !(await b.evaluate(s.waitFor))) await sleep(100); await sleep(300); }
    if (s.shot) { const r = await b.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: !!s.full }); writeFileSync(s.shot, Buffer.from(r.result.data, "base64")); console.log("shot", s.shot); }
  }
  b.close(); process.exit(0);
}
