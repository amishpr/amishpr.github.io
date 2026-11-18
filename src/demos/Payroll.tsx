/* NJ OIT: payroll cycle, then overnight batch jobs with a morning report. */
import { useMemo, useRef, useState } from "react";
import type { PayrollDemo } from "../types.ts";
import { ease, fmt, frames, reduced, tween, useFirstView, wait } from "../lib/motion.ts";
import { rng } from "../lib/sim.ts";
import { Frame, Legend, Log, Stat, useLog } from "./shared.tsx";

const TILES = 60;
const STEPS = ["PAY.CALC", "BENE.DEDUCT", "TAX.WITHHOLD", "ACH.EXPORT", "GL.POST", "W2.ACCUM", "PENSION.CONTRIB", "AUDIT.EXTRACT", "LEAVE.BALANCE", "CHECK.PRINT"];
const CELL = ["job-cell", "job-cell is-run", "job-cell is-pass", "job-cell is-fail", "job-cell is-retry"]; // idle, run, pass, fail, retry
type Stage = "wait" | "run" | "done";

export default function Payroll({ d }: { d: PayrollDemo }) {
  const L = d.labels;
  const [view, setView] = useState<"pay" | "jobs">("pay");
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState("");
  const busyRef = useRef(false);
  const touched = useRef(false);

  const [count, setCount] = useState("0");
  const [tiles, setTiles] = useState({ lit: 0, ok: 0, sent: false });
  const [stages, setStages] = useState<Stage[]>(["wait", "wait", "wait"]);
  const [payNote, setPayNote] = useState(L.payNote);

  const jobs = useMemo(() => {
    const r = rng(412);
    return Array.from({ length: d.jobs }, (_, i) => ({
      name: "PYR" + "ABCDGHMPTW"[i % 10] + String(10 + i * 10).padStart(4, "0"),
      step: STEPS[Math.floor(r() * STEPS.length)],
    }));
  }, [d.jobs]);
  const [cells, setCells] = useState<number[]>(() => Array(d.jobs).fill(0));
  const [jobCount, setJobCount] = useState(0);
  const [report, setReport] = useState(false);
  const log = useLog();

  const lock = (on: boolean) => { busyRef.current = on; setBusy(on); };

  async function runPay() {
    if (busyRef.current) return;
    lock(true); setView("pay");
    setTiles({ lit: 0, ok: 0, sent: false });
    setStages(["run", "wait", "wait"]);
    setPayNote(L.payNote);
    setLive("Generating paychecks.");
    const per = d.paychecks / TILES;
    await tween(1900, (p) => {
      const n = d.paychecks * p;
      setCount(fmt(n));
      setTiles((t) => ({ ...t, lit: Math.floor(n / per) }));
    }, ease.inOut);
    setStages(["done", "run", "wait"]);
    await tween(700, (p) => setTiles((t) => ({ ...t, ok: Math.floor(p * TILES) })), ease.lin);
    setTiles({ lit: TILES, ok: TILES, sent: false });
    setStages(["done", "done", "run"]);
    await wait(200);
    setTiles({ lit: TILES, ok: TILES, sent: true });
    await wait(700);
    setStages(["done", "done", "done"]);
    setCount(fmt(d.paychecks) + "+");
    setPayNote(L.payDone);
    setLive(`${fmt(d.paychecks)}+ paychecks generated and validated.`);
    lock(false);
  }

  async function runJobs() {
    if (busyRef.current) return;
    lock(true); setView("jobs");
    setReport(false); log.clear();
    const st = Array<number>(d.jobs).fill(0);
    setCells([...st]); setJobCount(0);
    setLive("Running the overnight batch jobs.");
    const rr = rng((Date.now() & 0xffff) + 1);
    const fails = new Set<number>();
    while (fails.size < 3) fails.add(8 + Math.floor(rr() * (d.jobs - 16)));
    const flagged = [...fails][2];
    const WINDOW = 2600;
    const plan = jobs.map((_, i) => {
      const start = (i / d.jobs) * WINDOW * 0.85 + rr() * 120;
      return { start, end: start + 140 + rr() * 260 };
    });
    const clock = (t: number) => {
      const m = 60 + Math.floor(Math.min(1, t / WINDOW) * 280);
      return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
    };
    let done = 0, passLogs = 0;
    await frames((t) => {
      plan.forEach((p, i) => {
        if (st[i] === 0 && t >= p.start) st[i] = 1;
        if (st[i] === 1 && t >= p.end) {
          done++;
          const bad = fails.has(i);
          st[i] = bad ? 3 : 2;
          if (bad) log.add([[clock(p.end), "log-t"], [jobs[i].name], ["ABEND S0C7", "log-bad"]]);
          else if (++passLogs % 14 === 0) log.add([[clock(p.end), "log-t"], [jobs[i].name], [jobs[i].step, "log-dim"], ["RC=0000", "log-ok"]]);
        }
      });
      setCells([...st]);
      setJobCount(done);
      return done >= d.jobs;
    });
    await wait(350);
    for (const i of fails) {
      if (i === flagged) continue;
      st[i] = 4; setCells([...st]);
      log.add([["05:44", "log-t"], [jobs[i].name], ["resubmitted after data fix", "log-dim"]]);
      await wait(550);
      log.add([["05:47", "log-t"], [jobs[i].name], ["RC=0000", "log-ok"]]);
    }
    log.add([["05:52", "log-t"], [jobs[flagged].name], ["flagged for review", "log-bad"]]);
    setReport(true);
    setLive(`${d.jobs} jobs run. ${d.jobs - 1} passed, 1 needs review.`);
    lock(false);
  }

  /* First view plays the pay cycle, pauses a second, then plays the batch jobs.
     A click during the pause cancels the switch; reduced motion stops after the pay cycle. */
  const ref = useFirstView<HTMLDivElement>(async () => {
    await runPay();
    if (touched.current || reduced()) return;
    await wait(1000);
    if (!touched.current) runJobs();
  });

  return (
    <Frame type="payroll" title={d.title} live={live} rootRef={ref}>
      <div className="d-actions">
        <button className={`d-btn${view === "pay" ? "" : " d-btn--ghost"}`} type="button" disabled={busy}
          onClick={() => { touched.current = true; runPay(); }}>{L.pay}</button>
        <button className={`d-btn${view === "jobs" ? "" : " d-btn--ghost"}`} type="button" disabled={busy}
          onClick={() => { touched.current = true; runJobs(); }}>{L.jobs}</button>
      </div>

      <div className="d-view" hidden={view !== "pay"}>
        <div className="d-readout">
          <div><output className="d-num">{count}</output><span className="d-unit"> {L.paychecks}</span></div>
          <span className="d-muted">{L.cycle}</span>
        </div>
        <div className="pay-grid" aria-hidden="true">
          {Array.from({ length: TILES }, (_, i) => (
            <span key={i}
              className={`pay-tile${i < tiles.lit ? " is-on" : ""}${i < tiles.ok ? " is-ok" : ""}${tiles.sent ? " is-sent" : ""}`}
              style={tiles.sent ? { animationDelay: `${(i % 12) * 30}ms` } : undefined} />
          ))}
        </div>
        <ol className="d-stages">{d.stages.map((s, i) => <li key={s} className="d-stage" data-state={stages[i]}>{s}</li>)}</ol>
        <p className="d-note">{payNote}</p>
      </div>

      <div className="d-view" hidden={view !== "jobs"}>
        <div className="d-readout">
          <div><output className="d-num">{jobCount}</output><span className="d-unit"> of {d.jobs} {L.ofJobs}</span></div>
          <span className="d-muted">{L.window}</span>
        </div>
        <div className="job-grid" aria-hidden="true">{cells.map((c, i) => <span key={i} className={CELL[c]} />)}</div>
        <Legend items={[[L.legend[0], "is-pass"], [L.legend[1], "is-retry"], [L.legend[2], "is-fail"]]} />
        <Log lines={log.lines} label="Batch job log" />
        {report && (
          <div className="d-report">
            <div className="d-report-head"><strong>{L.report}</strong><span className="d-muted">{L.reportReady}</span></div>
            <dl className="d-stats">
              <Stat label={L.stats[0]}>{d.jobs}</Stat>
              <Stat label={L.stats[1]}>{d.jobs - 1}</Stat>
              <Stat label={L.stats[2]}>2</Stat>
              <Stat label={L.stats[3]} bad>1</Stat>
            </dl>
            <p className="d-note">Morning review: {d.reviewBefore} by hand, {d.reviewAfter} with this report.</p>
          </div>
        )}
      </div>
    </Frame>
  );
}
