/* Syntagma: drag the picker and the item; BFS finds the shortest aisle route and draws it dotted. */
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import type { MazeDemo } from "../types.ts";
import { reduced, useFirstView } from "../lib/motion.ts";
import { bfs, genMaze, rng, type Grid } from "../lib/sim.ts";
import { Frame, Legend, Stat } from "./shared.tsx";

const C = 10; // SVG units per cell
type Pt = [number, number];
const same = (a: Pt, b: Pt) => a[0] === b[0] && a[1] === b[1];
const mid = (v: number) => v * C + C / 2;

function wallPath(g: Grid) {
  const rows = g.length, cols = g[0].length;
  let d = "";
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (!g[y][x]) continue;
      let linked = false;
      if (x + 1 < cols && g[y][x + 1]) { d += `M${mid(x)} ${mid(y)}H${mid(x + 1)}`; linked = true; }
      if (y + 1 < rows && g[y + 1][x]) { d += `M${mid(x)} ${mid(y)}V${mid(y + 1)}`; linked = true; }
      if (!linked && !(x > 0 && g[y][x - 1]) && !(y > 0 && g[y - 1][x])) d += `M${mid(x)} ${mid(y)}h0.01`;
    }
  }
  return d;
}

function Marker({ kind, at, label, onKey }: { kind: "start" | "end"; at: Pt; label: string; onKey: (e: KeyboardEvent) => void }) {
  return (
    <g className={`mz-marker mz-marker--${kind}`} tabIndex={0} role="button" aria-label={label} onKeyDown={onKey}
      transform={`translate(${mid(at[0])} ${mid(at[1])})`}>
      <circle className="mz-hit" r="12" />
      <circle className="mz-ring" r="5.6" />
      {kind === "start"
        ? <circle className="mz-start" r="3.7" />
        : <rect className="mz-end" x="-3.1" y="-3.1" width="6.2" height="6.2" rx="1" transform="rotate(45)" />}
    </g>
  );
}

export default function Maze({ d }: { d: MazeDemo }) {
  const L = d.labels;
  const maskId = "mzm" + useId().replace(/[^\w-]/g, "");
  const [size, setSize] = useState(d.wide);
  const [seed, setSeed] = useState(11);
  const [pos, setPos] = useState<{ start: Pt; end: Pt }>({ start: [1, 1], end: [d.wide.cols - 2, d.wide.rows - 2] });
  const [anim, setAnim] = useState(0); // 0 = static; each new id replays the search animation
  const [dragging, setDragging] = useState(false);
  const [live, setLive] = useState("");
  const drag = useRef<"start" | "end" | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const maskLine = useRef<SVGPolylineElement>(null);
  const keyTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const { cols, rows } = size;
  const grid = useMemo(() => genMaze(cols, rows, rng(seed)), [cols, rows, seed]);
  const walls = useMemo(() => wallPath(grid), [grid]);
  const { order, path } = useMemo(() => bfs(grid, pos.start, pos.end), [grid, pos]);
  const steps = Math.max(0, path.length - 1);
  const pts = path.map((i) => `${mid(i % cols)},${mid(Math.floor(i / cols))}`).join(" ");
  const animating = anim > 0 && !reduced();
  const stepMs = Math.min(6, 800 / order.length);

  /* Picks the narrow layout on small screens. Runs after mount because the server has no screen width. */
  const relayout = (nextSeed: number) => {
    const s = innerWidth < 640 ? d.narrow : d.wide;
    setSize(s); setSeed(nextSeed);
    setPos({ start: [1, 1], end: [s.cols - 2, s.rows - 2] });
  };
  useEffect(() => { if (innerWidth < 640) relayout(11); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* Dotted route reveal: a mask line draws along the path after the search wave. */
  useLayoutEffect(() => {
    const ml = maskLine.current;
    if (!ml) return;
    ml.getAnimations().forEach((a) => a.cancel());
    if (!animating) return;
    const len = Math.max(1, steps * C);
    ml.style.strokeDasharray = `${len} ${len}`;
    ml.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }],
      { duration: Math.min(1400, 300 + len * 3), delay: order.length * stepMs * 0.9, easing: "cubic-bezier(.45,0,.2,1)", fill: "both" });
  }, [anim]); // eslint-disable-line react-hooks/exhaustive-deps

  const ref = useFirstView<HTMLDivElement>(() => setAnim((a) => a + 1));

  const toCell = (e: PointerEvent): [number, number] => {
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(svgRef.current!.getScreenCTM()!.inverse());
    return [pt.x / C - 0.5, pt.y / C - 0.5];
  };
  const nearestOpen = ([fx, fy]: [number, number]): Pt | null => {
    let best: Pt | null = null, bd = Infinity;
    const cx = Math.round(fx), cy = Math.round(fy);
    for (let y = cy - 2; y <= cy + 2; y++) {
      for (let x = cx - 2; x <= cx + 2; x++) {
        if (y < 0 || x < 0 || y >= rows || x >= cols || grid[y][x]) continue;
        const dd = (x - fx) ** 2 + (y - fy) ** 2;
        if (dd < bd) { bd = dd; best = [x, y]; }
      }
    }
    return best;
  };
  const moveTo = (which: "start" | "end", c: Pt) => setPos((p) => {
    const other = which === "start" ? p.end : p.start;
    if (same(c, other) || same(c, p[which])) return p;
    return { ...p, [which]: c };
  });

  const onDown = (e: PointerEvent<SVGSVGElement>) => {
    const p = toCell(e);
    const ds = Math.hypot(p[0] - pos.start[0], p[1] - pos.start[1]);
    const de = Math.hypot(p[0] - pos.end[0], p[1] - pos.end[1]);
    const lim = e.pointerType === "touch" ? 2.4 : 1.8;
    const pick = ds <= de ? (ds < lim ? "start" : null) : de < lim ? "end" : null;
    if (!pick) return;
    e.preventDefault();
    drag.current = pick;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true); setAnim(0);
  };
  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    if (!drag.current) return;
    const c = nearestOpen(toCell(e));
    if (c) moveTo(drag.current, c);
  };
  const onUp = () => {
    if (!drag.current) return;
    drag.current = null;
    setDragging(false); setAnim((a) => a + 1);
    setLive("updated");
  };
  const onKey = (which: "start" | "end") => (e: KeyboardEvent) => {
    const v = ({ ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] } as Record<string, Pt>)[e.key];
    if (!v) return;
    e.preventDefault();
    const cur = pos[which];
    const n: Pt = [cur[0] + v[0], cur[1] + v[1]];
    if (grid[n[1]]?.[n[0]] !== 0) return;
    moveTo(which, n); setAnim(0);
    clearTimeout(keyTimer.current);
    setLive("");
    keyTimer.current = setTimeout(() => setLive("route"), 300);
  };

  const liveText = live === "updated" ? `Route updated: ${steps} steps.` : live === "route" ? `Route: ${steps} steps.` : live === "layout" ? "New aisle layout." : "";
  return (
    <Frame type="maze" title={d.title} live={liveText} rootRef={ref}>
      <div className="maze-wrap">
        <svg ref={svgRef} className={`maze-svg${dragging ? " is-dragging" : ""}`} viewBox={`0 0 ${cols * C} ${rows * C}`} role="group"
          aria-label="Warehouse aisles with a picker and an item" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
          <defs>
            <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width={cols * C} height={rows * C}>
              <polyline ref={maskLine} points={pts} fill="none" stroke="#fff" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
            </mask>
          </defs>
          <rect className="mz-floor" x="0" y="0" width={cols * C} height={rows * C} />
          <g key={anim}>
            {animating && order.map((i, k) => (
              <rect key={i} className="mz-seen" x={(i % cols) * C + 1.2} y={Math.floor(i / cols) * C + 1.2} width={C - 2.4} height={C - 2.4} rx="2"
                style={{ animationDelay: `${Math.round(k * stepMs)}ms` }} />
            ))}
          </g>
          <path className="mz-wall" d={walls} />
          <polyline className="mz-route" points={pts} mask={animating ? `url(#${maskId})` : undefined} />
          <Marker kind="end" at={pos.end} label="Item. Drag, or use arrow keys to move." onKey={onKey("end")} />
          <Marker kind="start" at={pos.start} label="Picker. Drag, or use arrow keys to move." onKey={onKey("start")} />
        </svg>
      </div>
      <div className="maze-meta">
        <dl className="d-inline-stats">
          <Stat label={L.route}><span><output className="d-num d-num--sm">{steps}</output> {L.steps}</span></Stat>
          <Stat label={L.checked}><output className="d-num d-num--sm">{order.length}</output></Stat>
        </dl>
        <div className="d-actions">
          <button className="d-btn d-btn--ghost" type="button" onClick={() => setAnim((a) => a + 1)}>{L.replay}</button>
          <button className="d-btn d-btn--ghost" type="button" onClick={() => { relayout(seed + 1); setAnim((a) => a + 1); setLive("layout"); }}>{L.newLayout}</button>
        </div>
      </div>
      <Legend items={[[L.legend[0], "mz-sw-start"], [L.legend[1], "mz-sw-end"], [L.legend[2], "mz-sw-route"], [L.legend[3], "mz-sw-seen"]]} />
      <p className="d-note">{L.note}</p>
    </Frame>
  );
}
