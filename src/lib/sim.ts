/* Pure logic behind the experience apps and charts. No DOM, so it runs in tests and on the server. */

/* Seeded RNG (mulberry32): same seed, same sequence, so server and browser render the same maze. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Grid = number[][]; // 1 = shelf (wall), 0 = aisle

/* Depth-first maze on odd coordinates, then a few walls knocked out so there is more than one route. */
export function genMaze(cols: number, rows: number, rand: () => number): Grid {
  const g: Grid = Array.from({ length: rows }, () => Array(cols).fill(1));
  const stack: [number, number][] = [[1, 1]];
  g[1][1] = 0;
  while (stack.length) {
    const [x, y] = stack[stack.length - 1];
    const nb = ([[2, 0], [-2, 0], [0, 2], [0, -2]] as const)
      .map(([dx, dy]) => [x + dx, y + dy, dx, dy] as const)
      .filter(([nx, ny]) => nx > 0 && ny > 0 && nx < cols - 1 && ny < rows - 1 && g[ny][nx] === 1);
    if (!nb.length) { stack.pop(); continue; }
    const [nx, ny, dx, dy] = nb[Math.floor(rand() * nb.length)];
    g[y + dy / 2][x + dx / 2] = 0;
    g[ny][nx] = 0;
    stack.push([nx, ny]);
  }
  for (let y = 1; y < rows - 1; y++) {
    for (let x = 1; x < cols - 1; x++) {
      if (g[y][x] !== 1) continue;
      const across = !g[y][x - 1] && !g[y][x + 1] && g[y - 1][x] && g[y + 1][x];
      const down = !g[y - 1][x] && !g[y + 1][x] && g[y][x - 1] && g[y][x + 1];
      if ((across || down) && rand() < 0.14) g[y][x] = 0;
    }
  }
  return g;
}

/* Breadth-first search. order = cells in the order they were checked; path = shortest route as cell indexes (y * cols + x). */
export function bfs(g: Grid, from: [number, number], to: [number, number]): { order: number[]; path: number[] } {
  const rows = g.length, cols = g[0].length;
  const prev = new Int32Array(rows * cols).fill(-1);
  const seen = new Uint8Array(rows * cols);
  const s0 = from[1] * cols + from[0], goal = to[1] * cols + to[0];
  const q = [s0], order: number[] = [];
  seen[s0] = 1;
  for (let head = 0; head < q.length; head++) {
    const cur = q[head];
    order.push(cur);
    if (cur === goal) break;
    const x = cur % cols, y = (cur / cols) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows || g[ny][nx]) continue;
      const n = ny * cols + nx;
      if (seen[n]) continue;
      seen[n] = 1; prev[n] = cur; q.push(n);
    }
  }
  const path: number[] = [];
  if (seen[goal]) for (let c = goal; c !== -1; c = prev[c]) path.unshift(c);
  return { order, path };
}

type Scored = { goals: Record<string, number>; budget: Record<string, number>; reach: Record<string, number> };

/* Fit score 0 to 96: goals weigh most, then budget, then reach. A zero on budget or reach is a heavy penalty. */
export function adScore(t: Scored, goals: string[], budget: string, reach: string): number {
  const g = goals.reduce((a, id) => a + (t.goals[id] ?? 0), 0) / (goals.length * 3);
  const b = (t.budget[budget] ?? 0) / 3;
  const rc = (t.reach[reach] ?? 0) / 3;
  let fit = 0.6 * g + 0.25 * b + 0.15 * rc;
  if (b === 0 || rc === 0) fit *= 0.55;
  return Math.round(fit * 96);
}

/* Whole-number percentages proportional to scores that always add up to 100. */
export function split(scores: number[]): number[] {
  const sum = scores.reduce((a, b) => a + b, 0) || 1;
  let acc = 0;
  return scores.map((s, i) => {
    const v = i < scores.length - 1 ? Math.round((s / sum) * 100) : 100 - acc;
    acc += v;
    return v;
  });
}

/* Axis ticks: 0 to a round maximum that fits `max`, in about four steps. */
export function ticks(max: number): number[] {
  const step = [1, 2, 5, 10, 15, 20, 30, 60, 120, 240, 480].find((s) => s * 4 >= max) ?? Math.ceil(max / 4);
  const top = Math.max(step, Math.ceil(max / step) * step);
  return Array.from({ length: top / step + 1 }, (_, i) => i * step);
}
