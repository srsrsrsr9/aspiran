// Minimal Chrome DevTools Protocol client (Node 22's built-in WebSocket; no packages needed).
import { spawn } from "child_process";
import fs from "fs"; import os from "os"; import path from "path";
export const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

export async function launch({ width = 1920, height = 1080 } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "trailer-chrome-"));
  const port = 9300 + Math.floor(Math.random() * 500);
  const proc = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, "--hide-scrollbars",
    "--force-color-profile=srgb", "--allow-file-access-from-files", "--disable-gpu-vsync", "--mute-audio", `--window-size=${width},${height}`, "about:blank"], { stdio: "ignore" });
  let ver;
  for (let i = 0; i < 100; i++) { try { ver = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); if (ver.length) break; } catch {} await new Promise(r => setTimeout(r, 100)); }
  const target = ver.find(t => t.type === "page");
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0; const pending = new Map(), listeners = [];
  ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { const { res, rej } = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result); } else listeners.forEach(f => f(m)); };
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
  await send("Page.enable"); await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });
  listeners.push(m => { if (m.method === "Runtime.exceptionThrown") console.error("page error:", m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text); });
  const page = {
    send,
    async goto(url) { const done = new Promise(r => listeners.push(m => m.method === "Page.loadEventFired" && r())); await send("Page.navigate", { url }); await done; },
    async eval(expr) { const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || "eval failed"); return r.result.value; },
    async shot(fmt = "jpeg", quality = 92, clip) { const r = await send("Page.captureScreenshot", { format: fmt, quality: fmt === "jpeg" ? quality : undefined, ...(clip ? { clip: { ...clip, scale: 1 } } : {}) }); return Buffer.from(r.data, "base64"); },
    async close() { try { await send("Browser.close"); } catch {} proc.kill(); await new Promise(r => setTimeout(r, 300)); try { fs.rmSync(dir, { recursive: true, force: true }); } catch {} }
  };
  return page;
}
