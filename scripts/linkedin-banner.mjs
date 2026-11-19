/* `node scripts/linkedin-banner.mjs`: writes banner/linkedin-banner-light.png and -dark.png
   (1584x396 at 2x, LinkedIn's banner ratio) in the hero style of the site, using the live palette and stats.
   Bottom left stays empty: LinkedIn puts the profile photo there. */
import { mkdirSync, readFileSync } from "node:fs";
import { chromium } from "playwright";
import content from "../src/content.ts";
import { palettes } from "../src/palettes.ts";

const font = (pkg, file) => readFileSync(`node_modules/@fontsource-variable/${pkg}/files/${file}`).toString("base64");
const geist = font("geist", "geist-latin-wght-normal.woff2");
const mono = font("geist-mono", "geist-mono-latin-wght-normal.woff2");

// Banner-length versions of the stat labels in content.ts (the site ones run three lines here).
const labels = ["paychecks each biweekly cycle", "batch jobs summarized daily", "end-to-end tests generated", "years in production software"];
const { person, stats, site } = content;

const html = (t) => `<!doctype html><meta charset="utf-8"><style>
@font-face { font-family: G; src: url(data:font/woff2;base64,${geist}) format("woff2"); font-weight: 100 900; }
@font-face { font-family: M; src: url(data:font/woff2;base64,${mono}) format("woff2"); font-weight: 100 900; }
* { box-sizing: border-box; margin: 0; }
body { width: 1584px; height: 396px; overflow: hidden; background: ${t.paper}; color: ${t.body}; font-family: G; -webkit-font-smoothing: antialiased; position: relative; }
.main { position: absolute; left: 440px; right: 64px; top: 68px; }
.now { font-size: 21px; color: ${t.muted}; }
.now b { color: ${t["accent-text"]}; font-weight: 600; }
h1 { margin-top: 12px; font-size: 48px; font-weight: 650; letter-spacing: -0.04em; line-height: 1.06; color: ${t.ink}; max-width: 720px; text-wrap: balance; }
.figs { margin-top: 32px; display: grid; grid-template-columns: repeat(4, 1fr); border-top: 2px solid ${t.ink}; }
.fig { padding: 14px 12px 0 0; display: grid; gap: 8px; align-content: start; }
.fig + .fig { padding-left: 18px; border-left: 1px solid ${t["line-strong"]}; }
.n { font-family: M; font-size: 36px; font-weight: 600; letter-spacing: -0.05em; line-height: 1; color: ${t.ink}; font-variant-numeric: tabular-nums; }
.l { font-size: 18px; line-height: 1.3; color: ${t.muted}; }
</style>
<div class="main">
  <p class="now"><b>${person.role}</b>&nbsp;&nbsp;${person.location}</p>
  <h1>${person.headline}</h1>
  <div class="figs">${stats.map((s, i) => `<div class="fig"><span class="n">${s.value.toLocaleString("en-US")}${s.suffix}</span><span class="l">${labels[i]}</span></div>`).join("")}</div>
</div>`;

mkdirSync("banner", { recursive: true });
const browser = await chromium.launch();
try {
  for (const mode of ["light", "dark"]) {
    const page = await browser.newPage({ viewport: { width: 1584, height: 396 }, deviceScaleFactor: 2 });
    await page.setContent(html(palettes[site.palette][mode]));
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `banner/linkedin-banner-${mode}.png` });
    console.log(`wrote banner/linkedin-banner-${mode}.png`);
  }
} finally {
  await browser.close();
}
