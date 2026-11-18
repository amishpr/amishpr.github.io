/* `npm run og`: rebuilds public/og.png, the 1200x630 preview LinkedIn, Slack, and others show for the link.
   Screenshots the hero of the built site, so run `npm run build` first, and again after (to ship the new image).
   Needs Chromium for Playwright 1.48 once: `npx playwright@1.48 install chromium`. */
import { chromium } from "playwright";
import { preview } from "vite";

const server = await preview({ preview: { port: 4174, strictPort: true } });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, colorScheme: "light", reducedMotion: "reduce" });
  await page.goto("http://localhost:4174/", { waitUntil: "networkidle" });
  await page.addStyleTag({ content: ".hero { padding-top: 56px } .hero-grid { grid-template-columns: minmax(0, 1fr) 300px } .hero h1 { font-size: 3.1rem } .figs, .notes { display: none }" });
  await page.screenshot({ path: "public/og.png" });
  console.log("wrote public/og.png");
} finally {
  await browser.close();
  await server.close();
}
