/* `npm run screenshots`: opens every project in content.ts that has a live `url`, takes a 1280x800 screenshot,
   and saves it as WebP where the site expects it (the project's `image`, or /images/<name>.webp if that's empty).
   Options, after `--`:
     --light          capture the light theme (default: dark)
     --out=<folder>   save under <folder> instead of public/, to preview before replacing the site's images
     <text>           only projects whose name contains <text>, e.g. `npm run screenshots -- ledger`
   Needs Chromium for Playwright 1.48 once: `npx playwright@1.48 install chromium`. */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import sharp from "sharp";
import content from "../src/content.ts";

const args = process.argv.slice(2);
const theme = args.includes("--light") ? "light" : "dark";
const out = args.find((a) => a.startsWith("--out="))?.slice("--out=".length) || "public";
const filters = args.filter((a) => !a.startsWith("--")).map((a) => a.toLowerCase());
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
/* Hosting badges that would otherwise end up in the shot. */
const HIDE = "#nl-badge-frame, iframe[src*='netlify'], vercel-live-feedback { display: none !important; }";

const projects = content.projects.filter((p) => !filters.length || filters.some((f) => p.name.toLowerCase().includes(f)));
if (!projects.length) console.log(`No project name contains "${filters.join('" or "')}".`);

const browser = await chromium.launch();
const failed = [];
for (const p of projects) {
  if (!p.url) { console.log(`skip  ${p.name}: no live url in content.ts`); continue; }
  const image = (p.image || `/images/${slug(p.name)}`).replace(/\.\w+$/, "") + ".webp";
  const file = path.join(out, image);
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, colorScheme: theme, reducedMotion: "reduce" });
  try {
    await page.goto(p.url, { waitUntil: "load", timeout: 45000 });
    await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {}); // pages that keep polling never go idle
    await page.addStyleTag({ content: HIDE });
    await page.waitForTimeout(1500); // let fonts, charts, and transitions settle
    fs.mkdirSync(path.dirname(file), { recursive: true });
    await sharp(await page.screenshot()).webp({ quality: 82, effort: 6 }).toFile(file);
    console.log(`saved ${file} (${Math.round(fs.statSync(file).size / 1024)} KB, ${theme})  ${p.name}`);
    if (image !== p.image) console.log(`      set  image: "${image}"  for ${p.name} in src/content.ts`);
  } catch (e) {
    failed.push(p.name);
    console.log(`fail  ${p.name}: ${e.message.split("\n")[0]}`);
  } finally {
    await page.close();
  }
}
await browser.close();

if (failed.length) {
  console.log(`\n${failed.length} failed (${failed.join(", ")}). Check the url in src/content.ts, or run again.`);
  process.exitCode = 1;
} else if (out === "public") {
  console.log("\nDone. Run `npm run build` to put the new screenshots in docs/.");
}
