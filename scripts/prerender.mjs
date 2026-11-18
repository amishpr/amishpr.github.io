/* Step 3 of `npm run build`: renders the page to HTML so search engines and link previews see the full content.
   Expects docs/ from `vite build` and .ssr/ from `vite build --ssr src/entry-server.tsx --outDir .ssr`. */
import fs from "node:fs";

const { render } = await import("../.ssr/entry-server.js");
const file = "docs/index.html";
const html = fs.readFileSync(file, "utf8");
if (!html.includes("<!--app-->")) throw new Error(`${file} has no <!--app--> slot`);
const app = render();
fs.writeFileSync(file, html.replace("<!--app-->", () => app));
fs.rmSync(".ssr", { recursive: true, force: true });
console.log(`prerendered ${file} (${Math.round(app.length / 1024)} KB of HTML)`);
