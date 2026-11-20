// Syntax-checks the inline scripts of the staff pages (Admin, News desk, coaching-centre console and the shared kit),
// which `tsc` and the web-app check don't see. Part of `npm run check`.
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const pages = ["admin", "desk", "institute", "console-kit"];
const dir = mkdtempSync(join(tmpdir(), "pages-"));
let bad = 0;
try {
  for (const p of pages) {
    const html = readFileSync(new URL(`../src/${p}.html`, import.meta.url), "utf8");
    if (p === "admin" || p === "institute") if (!html.includes("<!--KIT-->")) { console.error(`${p}.html: the <!--KIT--> marker is missing`); bad++; }
    [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].forEach((m, i) => {
      const f = join(dir, `${p}-${i}.mjs`);
      writeFileSync(f, m[1]);
      try { execFileSync(process.execPath, ["--check", f], { stdio: "pipe" }); }
      catch (e) { console.error(`${p}.html script ${i + 1}:\n${String(e.stderr)}`); bad++; }
    });
  }
} finally { rmSync(dir, { recursive: true, force: true }); }
if (bad) process.exit(1);
console.log("staff pages: scripts parse");
