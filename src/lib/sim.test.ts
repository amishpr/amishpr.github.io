/* npm test. Checks the app logic and the content rules. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { rng, genMaze, bfs, adScore, split, ticks } from "./sim.ts";
import content from "../content.ts";

test("maze is solvable corner to corner and BFS path is connected", () => {
  for (const [cols, rows] of [[25, 15], [17, 17]]) {
    for (let seed = 1; seed < 30; seed++) {
      const g = genMaze(cols, rows, rng(seed));
      const { path, order } = bfs(g, [1, 1], [cols - 2, rows - 2]);
      assert.ok(path.length > 1, `seed ${seed} unsolvable`);
      assert.ok(order.length >= path.length);
      for (let i = 1; i < path.length; i++) {
        const [a, b] = [path[i - 1], path[i]];
        const d = Math.abs((a % cols) - (b % cols)) + Math.abs(Math.floor(a / cols) - Math.floor(b / cols));
        assert.equal(d, 1, "path steps must be adjacent");
        assert.equal(g[Math.floor(b / cols)][b % cols], 0, "path must stay in aisles");
      }
    }
  }
});

test("budget split always sums to 100", () => {
  for (const s of [[90, 60, 30], [1, 1, 1], [77, 76, 12], [5]]) assert.equal(split(s).reduce((a, b) => a + b, 0), 100);
});

test("ad scores stay within 0..96 and favor matching goals", () => {
  const ads = content.experience.find((x) => x.demo.type === "ads")!.demo;
  assert.equal(ads.type, "ads");
  if (ads.type !== "ads") return;
  for (const t of ads.adTypes) {
    const s = adScore(t, ["foot"], "m", "local");
    assert.ok(s >= 0 && s <= 96);
  }
  const geo = ads.adTypes.find((t) => t.id === "geo")!, ctv = ads.adTypes.find((t) => t.id === "ctv")!;
  assert.ok(adScore(geo, ["foot"], "m", "local") > adScore(ctv, ["foot"], "m", "local"));
});

test("chart ticks cover the data", () => {
  assert.deepEqual(ticks(60), [0, 15, 30, 45, 60]);
  assert.deepEqual(ticks(120), [0, 30, 60, 90, 120]);
  for (const t of content.outcomes.time) assert.ok(ticks(Math.max(...content.outcomes.time.map((x) => x.before))).at(-1)! >= t.before);
});

test("content: no em or en dashes, roles referenced by outcomes exist", () => {
  const text = JSON.stringify(content);
  assert.ok(!/[–—]/.test(text), "replace em/en dashes in content.ts");
  const ids = new Set(content.experience.map((x) => x.id));
  const o = content.outcomes;
  for (const r of [...o.time, ...o.hoursSaved, ...o.changes, ...o.other]) assert.ok(ids.has(r.role), `unknown role "${r.role}"`);
});

test("content: every image path points at a file in public/", () => {
  const paths = [content.person.photo, content.site.ogImage, ...content.projects.map((p) => p.image)].filter((p) => p.startsWith("/"));
  for (const p of paths) assert.ok(existsSync(`public${p}`), `missing public${p}`);
});
