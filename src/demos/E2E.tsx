/* Phoenix Contact: 7,000+ end-to-end tests fanned out across Docker containers. */
import { useRef, useState } from "react";
import type { E2EDemo } from "../types.ts";
import { fmt, frames, useFirstView } from "../lib/motion.ts";
import { rng } from "../lib/sim.ts";
import { Frame, Log, Stat, useLog } from "./shared.tsx";

type Box = { state: "idle" | "starting" | "running" | "done"; p: number; n: number; fail: boolean };
const STATUS = { idle: "idle", starting: "starting", running: "running", done: "exited" };
const clock = (sec: number) => `${Math.floor(sec / 60)}m ${String(sec % 60).padStart(2, "0")}s`;

export default function E2E({ d }: { d: E2EDemo }) {
  const L = d.labels;
  const N = d.containers.length;
  const idle = (): Box[] => d.containers.map(() => ({ state: "idle", p: 0, n: 0, fail: false }));
  const [boxes, setBoxes] = useState<Box[]>(idle);
  const [stats, setStats] = useState({ run: 0, fails: 0, sec: 0 });
  const [busy, setBusy] = useState(false);
  const [ran, setRan] = useState(false);
  const [live, setLive] = useState("");
  const busyRef = useRef(false);
  const log = useLog();

  async function run() {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true);
    log.clear();
    setLive("Test suite started.");
    const r = rng((Date.now() & 0xffff) + 3);
    const weights = d.containers.map(() => 0.88 + r() * 0.24);
    const wsum = weights.reduce((a, b) => a + b, 0);
    let assigned = 0;
    const shards = weights.map((w, i) => { const v = i < N - 1 ? Math.round((d.total * w) / wsum) : d.total - assigned; assigned += v; return v; });
    const speed = d.containers.map(() => 0.8 + r() * 0.2);
    const boot = d.containers.map((_, i) => 120 + i * 70 + r() * 120);
    const failAt = Array.from({ length: d.failures }, () => ({ c: Math.floor(r() * N), at: 0.15 + r() * 0.8, hit: false }));
    const DUR = 5200, SIM = 400;
    const bx: Box[] = d.containers.map(() => ({ state: "starting", p: 0, n: 0, fail: false }));
    setBoxes(bx.map((b) => ({ ...b })));
    let fails = 0, lastLog = 0;
    const pick = () => d.scenarios[Math.floor(r() * d.scenarios.length)];
    await frames((t) => {
      let total = 0;
      bx.forEach((b, i) => {
        b.p = Math.max(0, Math.min(1, (t - boot[i]) / (DUR * speed[i])));
        if (t >= boot[i] && b.state === "starting") b.state = "running";
        b.n = Math.floor(b.p * shards[i]);
        total += b.n;
        if (b.p >= 1) b.state = "done";
      });
      failAt.forEach((f) => {
        if (f.hit || bx[f.c].p < f.at) return;
        f.hit = true; fails++;
        bx[f.c].fail = true;
        log.add([["FAIL", "log-bad"], [d.containers[f.c], "log-dim"], [`${pick()} (timeout)`]]);
      });
      if (t - lastLog > 160 && total < d.total) {
        lastLog = t;
        const active = bx.flatMap((b, i) => (b.p > 0 && b.p < 1 ? [i] : []));
        if (active.length) log.add([["PASS", "log-ok"], [d.containers[active[Math.floor(r() * active.length)]], "log-dim"], [pick()]]);
      }
      setBoxes(bx.map((b) => ({ ...b })));
      setStats({ run: total, fails, sec: Math.round((SIM * total) / d.total) });
      return total >= d.total;
    });
    log.add([["DONE", "log-ok"], [`${fmt(d.total)} scenarios`, "log-dim"], [`${fails} failed and queued for a rerun`]]);
    setLive(`${fmt(d.total)} scenarios run. ${fmt(d.total - fails)} passed, ${fails} failed.`);
    setRan(true);
    busyRef.current = false; setBusy(false);
  }

  const ref = useFirstView<HTMLDivElement>(run);
  const label = busy ? L.running : ran ? L.again : `Run ${fmt(Math.floor(d.total / 1000) * 1000)}+ tests`;
  return (
    <Frame type="e2e" title={d.title} live={live} rootRef={ref}>
      <div className="d-actions d-actions--split">
        <button className="d-btn" type="button" disabled={busy} onClick={run}>{label}</button>
        <span className="d-muted">{N} {L.containers}</span>
      </div>
      <dl className="d-stats">
        <Stat label={L.stats[0]}><output>{fmt(stats.run)}</output></Stat>
        <Stat label={L.stats[1]}><output>{fmt(stats.run - stats.fails)}</output></Stat>
        <Stat label={L.stats[2]} bad={stats.fails > 0}><output>{stats.fails}</output></Stat>
        <Stat label={L.stats[3]}><output>{clock(stats.sec)}</output></Stat>
      </dl>
      <div className="e2e-grid" aria-hidden="true">
        {boxes.map((b, i) => (
          <div key={d.containers[i]} className={`e2e-box${b.fail ? " has-fail" : ""}`} data-state={b.state}>
            <span className="e2e-fill" style={{ transform: `scaleY(${b.p})` }} />
            <span className="e2e-name">{d.containers[i]}</span>
            <span className="e2e-status">{STATUS[b.state]}</span>
            <span className="e2e-count">{fmt(b.n)}</span>
          </div>
        ))}
      </div>
      <Log lines={log.lines} label="Test log" />
      <p className="d-note">{L.note}</p>
    </Frame>
  );
}
