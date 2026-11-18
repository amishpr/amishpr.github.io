/* `npm run lighthouse`: builds the site and scores it with Google Lighthouse (performance, accessibility,
   best practices, SEO) for phone and desktop. Lists anything that scores under 90 and saves full HTML reports.
   `npm run lighthouse -- https://amishprajapati.com` scores a live URL instead of the local build.
   Uses Playwright's Chromium, and downloads Lighthouse on first run (cached after that). */
import { execFile } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { chromium } from "playwright";
import { preview } from "vite";

const run = promisify(execFile);
const PORT = 4176;
const target = process.argv.slice(2).find((a) => /^https?:\/\//.test(a));
const server = target ? null : await preview({ preview: { port: PORT, strictPort: true }, logLevel: "silent" });
const url = target || `http://localhost:${PORT}/`;
const env = { ...process.env, CHROME_PATH: chromium.executablePath() };

try {
  for (const [name, flags] of [["phone", []], ["desktop", ["--preset=desktop"]]]) {
    const out = path.join(os.tmpdir(), `lighthouse-${name}`);
    console.log(`\nScoring ${url} on ${name}...`);
    await run("npx", ["-y", "lighthouse@13.5.0", url, "--quiet", "--chrome-flags=--headless=new",
      "--only-categories=performance,accessibility,best-practices,seo",
      "--output=json", "--output=html", `--output-path=${out}`, ...flags], { env, maxBuffer: 1e8 });
    const report = JSON.parse(fs.readFileSync(`${out}.report.json`, "utf8"));
    for (const cat of Object.values(report.categories)) {
      const weak = cat.auditRefs.filter((r) => r.weight > 0).map((r) => report.audits[r.id])
        .filter((a) => a.score !== null && a.score < 0.9);
      console.log(`  ${String(Math.round(cat.score * 100)).padStart(3)}  ${cat.title}`);
      for (const a of weak) console.log(`         - ${a.title}${a.displayValue ? `: ${a.displayValue}` : ""}`);
    }
    console.log(`  full report: ${out}.report.html`);
  }
  if (!target) console.log("\nScored the local build. The live site can differ (real network, CDN); try `npm run lighthouse -- https://amishprajapati.com` after deploying.");
} finally {
  await server?.close();
}
