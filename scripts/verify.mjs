/* `npm run verify`: builds the site, then checks it in a real browser (Playwright 1.48).
   - Desktop and phone, light and dark: no console errors or failed requests, no sideways scrolling, every image loads.
   - The five experience apps: payroll report, ad ranking and deck, maze drag, bank limit error, test run.
   - Theme toggle survives a reload, reduced motion shows everything, and the page reads fine with JavaScript off.
   Prints ok/FAIL per check and exits with an error if anything failed (with a screenshot path to look at). */
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright";
import { preview } from "vite";
import content from "../src/content.ts";

const PORT = 4175, SITE = `http://localhost:${PORT}/`;
const DESKTOP = { viewport: { width: 1440, height: 900 } };
const PHONE = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };
let failures = 0;
const check = (ok, name, detail = "") => {
  if (!ok) failures++;
  console.log(`${ok ? "ok  " : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
  return ok;
};
/* Runs fn; a thrown error (usually a timeout) counts as a failed check instead of stopping the run. */
const attempt = async (name, fn) => {
  try { return await fn(); } catch (e) { return check(false, name, e.message.split("\n")[0]); }
};

const server = await preview({ preview: { port: PORT, strictPort: true }, logLevel: "silent" });
const browser = await chromium.launch();

async function open(opts) {
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  const problems = [];
  page.on("console", (m) => ["error", "warning"].includes(m.type()) && problems.push(m.text()));
  page.on("pageerror", (e) => problems.push(e.message));
  page.on("response", (r) => r.status() >= 400 && problems.push(`HTTP ${r.status()} ${r.url()}`));
  await page.goto(SITE, { waitUntil: "networkidle" });
  return { ctx, page, problems };
}

/* Scrolls top to bottom so scroll animations run and lazy images load. */
async function scrollThrough(page) {
  const h = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h; y += 500) { await page.evaluate((y) => scrollTo(0, y), y); await page.waitForTimeout(80); }
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => scrollTo(0, 0));
}

async function screenshotOnFailure(page, name, before) {
  if (failures === before) return;
  const file = path.join(os.tmpdir(), `verify-${name}.png`);
  await page.screenshot({ path: file, fullPage: true }).catch(() => {});
  console.log(`      screenshot: ${file}`);
}

async function layout(name, opts) {
  const before = failures;
  const { ctx, page, problems } = await open(opts);
  await scrollThrough(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  check(overflow <= 0, `${name}: no sideways scrolling`, overflow > 0 ? `${overflow}px too wide` : "");
  /* Images below the fold load lazily, so bring each one into view and give it time, like a visitor would. */
  const broken = [];
  for (const img of await page.locator("img").all()) {
    await img.scrollIntoViewIfNeeded();
    const ok = await img.evaluate((e) => e.decode().then(() => e.naturalWidth > 0, () => false));
    if (!ok) broken.push(await img.getAttribute("src"));
  }
  await page.evaluate(() => scrollTo(0, 0));
  check(!broken.length, `${name}: all images load`, broken.join(", "));
  check(!problems.length, `${name}: no console errors or failed requests`, problems.slice(0, 3).join(" | "));
  await screenshotOnFailure(page, name, before);
  await ctx.close();
}

async function apps() {
  const before = failures;
  const { ctx, page, problems } = await open({ ...DESKTOP, colorScheme: "light" });
  const demos = new Map(content.experience.map((x) => [x.demo.type, x.demo]));
  const demo = (type) => page.locator(`.demo--${type}`);
  const show = (type) => demo(type).scrollIntoViewIfNeeded();

  if (demos.has("payroll")) await attempt("payroll app: plays the pay cycle, then the morning report", async () => {
    await show("payroll");
    await demo("payroll").locator(".d-report").waitFor({ state: "visible", timeout: 20000 });
    check(true, "payroll app: plays the pay cycle, then the morning report");
  });

  if (demos.has("ads")) await attempt("ads app: ranks ad types and builds the deck", async () => {
    const d = demos.get("ads");
    await show("ads");
    await demo("ads").locator(".ad-row").first().waitFor({ timeout: 8000 });
    await demo("ads").locator(".d-actions .d-btn").click();
    await page.waitForFunction((n) => document.querySelectorAll(".demo--ads .ad-slide").length === n, d.deck.length, { timeout: 8000 });
    check(true, "ads app: ranks ad types and builds the deck");
  });

  if (demos.has("maze")) await attempt("maze app: dragging the picker moves it and reroutes", async () => {
    await show("maze");
    const marker = demo("maze").locator(".mz-marker--start");
    const from = await marker.getAttribute("transform");
    const m = await marker.boundingBox(), svg = await demo("maze").locator(".maze-svg").boundingBox();
    await page.mouse.move(m.x + m.width / 2, m.y + m.height / 2);
    await page.mouse.down();
    await page.mouse.move(svg.x + svg.width / 2, svg.y + svg.height / 2, { steps: 30 });
    await page.mouse.up();
    const to = await marker.getAttribute("transform");
    const steps = Number(await demo("maze").locator(".d-inline-stats output").first().textContent());
    check(from !== to && steps > 0, "maze app: dragging the picker moves it and reroutes", `${steps} steps`);
  });

  if (demos.has("bank")) await attempt("bank app: withdrawing past the limit shows an error", async () => {
    const d = demos.get("bank");
    await show("bank");
    await page.waitForTimeout(2000); // let the intro transfer finish
    await demo("bank").getByRole("button", { name: d.labels.withdraw, exact: true }).click();
    await demo("bank").locator(".d-chips .d-chip").last().click();
    const err = demo("bank").locator(".d-error");
    for (let i = 0; i < 12 && !(await err.isVisible()); i++) { await demo("bank").locator(".bank-pick .d-btn").click(); await page.waitForTimeout(250); }
    check(await err.isVisible(), "bank app: withdrawing past the limit shows an error", (await err.textContent()) || "no error shown");
  });

  if (demos.has("e2e")) await attempt("test runner app: runs every test and finishes", async () => {
    const d = demos.get("e2e");
    await show("e2e");
    await page.waitForFunction((label) => document.querySelector(".demo--e2e .d-btn")?.textContent === label, d.labels.again, { timeout: 20000 });
    check(true, "test runner app: runs every test and finishes");
  });

  await attempt("theme toggle: switches and survives a reload", async () => {
    await page.evaluate(() => scrollTo(0, 0));
    const bg = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    const bg0 = await bg();
    await page.locator(".theme-btn").click();
    const theme = await page.evaluate(() => document.documentElement.dataset.theme);
    const bg1 = await bg();
    await page.reload({ waitUntil: "networkidle" });
    const kept = await page.evaluate(() => document.documentElement.dataset.theme);
    check(bg0 !== bg1 && theme === kept, "theme toggle: switches and survives a reload", `${theme} after reload: ${kept}`);
  });

  check(!problems.length, "apps: no console errors while using them", problems.slice(0, 3).join(" | "));
  await screenshotOnFailure(page, "apps", before);
  await ctx.close();
}

async function reducedMotion() {
  const { ctx, page } = await open({ ...DESKTOP, reducedMotion: "reduce" });
  await scrollThrough(page);
  const hidden = await page.locator("[data-reveal]:not(.is-in)").count();
  check(hidden === 0, "reduced motion: every section is visible", hidden ? `${hidden} still hidden` : "");
  await ctx.close();
}

async function noJs() {
  const ctx = await browser.newContext({ ...DESKTOP, javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(SITE);
  const h1 = (await page.locator("h1").textContent())?.trim();
  const bullets = await page.locator(".role-copy li").count();
  const expected = content.experience.reduce((n, x) => n + x.bullets.length, 0);
  check(h1 === content.person.headline && bullets === expected, "JavaScript off: headline and every bullet are in the HTML", `${bullets}/${expected} bullets`);
  check((await page.title()) === content.site.title, "JavaScript off: page title matches content.ts");
  await ctx.close();
}

try {
  for (const [name, opts] of [["desktop light", { ...DESKTOP, colorScheme: "light" }], ["desktop dark", { ...DESKTOP, colorScheme: "dark" }],
    ["phone light", { ...PHONE, colorScheme: "light" }], ["phone dark", { ...PHONE, colorScheme: "dark" }]]) {
    await attempt(`${name}: page loads`, () => layout(name, opts));
  }
  await apps();
  await attempt("reduced motion", reducedMotion);
  await attempt("JavaScript off", noJs);
} finally {
  await browser.close();
  await server.close();
}

console.log(failures ? `\n${failures} check${failures > 1 ? "s" : ""} failed.` : "\nAll checks passed.");
process.exitCode = failures ? 1 : 0;
