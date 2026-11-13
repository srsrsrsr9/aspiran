// Captures real app screens from https://app.aspiran.in as a signed-out visitor, at phone size (2x for sharpness).
// Usage: node build/capture-screens.mjs  -> scenes/screens/*.png
import { launch } from "./cdp.mjs"; import fs from "fs";
const OUT = new URL("../scenes/screens/", import.meta.url).pathname; fs.mkdirSync(OUT, { recursive: true });
const shots = (process.argv[2] ? [process.argv.slice(2)] : [["first-run", "https://app.aspiran.in/"], ["learn", "https://app.aspiran.in/learn"]]);
const page = await launch({ width: 390, height: 844 });
await page.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
for (const [name, url] of shots) {
  await page.goto(url); await new Promise(r => setTimeout(r, 3500));
  fs.writeFileSync(OUT + name + ".png", await page.shot("png"));
  console.log(name, (await page.eval("document.body.innerText.slice(0,400)")).replace(/\n+/g, " | "));
}
await page.close();
