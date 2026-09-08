/* `npm run webp`: converts every .jpg, .jpeg, and .png in public/images/ to .webp next to it.
   Then point content.ts at the .webp file and move the original out of public/ (it would ship otherwise).
   Skips images that already have an up-to-date .webp. */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const dir = "public/images";
const files = fs.readdirSync(dir).filter((f) => /\.(jpe?g|png)$/i.test(f));
if (!files.length) console.log(`nothing to convert in ${dir}/`);
for (const f of files) {
  const src = path.join(dir, f), out = src.replace(/\.\w+$/, ".webp");
  if (fs.existsSync(out) && fs.statSync(out).mtimeMs >= fs.statSync(src).mtimeMs) { console.log(`skip ${out} (up to date)`); continue; }
  await sharp(src).webp({ quality: 82, effort: 6 }).toFile(out);
  const kb = (p) => Math.round(fs.statSync(p).size / 1024);
  console.log(`${src} ${kb(src)} KB -> ${out} ${kb(out)} KB`);
}
