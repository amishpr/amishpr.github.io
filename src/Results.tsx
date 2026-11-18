/* Results: before/after dumbbell, hours-saved bars, and change tiles. One accent hue at two shades.
   Charts draw on first view; rows show a tooltip on hover or keyboard focus; each chart has a table view. */
import { useId, useState, type CSSProperties, type ReactNode } from "react";
import content from "./content.ts";
import { useFirstView } from "./lib/motion.ts";
import { ticks } from "./lib/sim.ts";

const { outcomes: O, results: R, ui, sections } = content;
const role = (id: string) => content.experience.find((x) => x.id === id)!;
const sources = (ids: string[]) => `${ui.sources}: ${[...new Set(ids.map((id) => role(id).short))].join(", ")}`;

type Row = { key: string; tip: string; aria: string; label: string; small: string; track: ReactNode };

function Plot({ lab, rows, before, after }: { lab: string; rows: Row[]; before?: ReactNode; after?: ReactNode }) {
  const [drawn, setDrawn] = useState(false);
  const [tip, setTip] = useState<{ text: string; left: number; top: number } | null>(null);
  const ref = useFirstView<HTMLDivElement>(() => setDrawn(true), 0.4);
  const show = (el: HTMLElement, text: string) => {
    const plot = ref.current!;
    const labW = (el.firstElementChild as HTMLElement).offsetWidth;
    setTip({ text, left: Math.max(0, Math.min(labW, plot.clientWidth - 290)), top: el.offsetTop - 6 });
  };
  return (
    <div className={`plot${drawn ? " is-drawn" : ""}`} style={{ "--lab": lab } as CSSProperties} ref={ref}>
      {before}
      {rows.map((r) => (
        <div key={r.key} className="db-row" tabIndex={0} aria-label={r.aria}
          onPointerEnter={(e) => show(e.currentTarget, r.tip)} onFocus={(e) => show(e.currentTarget, r.tip)}
          onPointerLeave={() => setTip(null)} onBlur={() => setTip(null)}>
          <div className="db-label">{r.label}<small>{r.small}</small></div>
          {r.track}
        </div>
      ))}
      {after}
      <div className={`tip${tip ? " is-on" : ""}`} role="status" style={tip ? { left: tip.left, top: tip.top, translate: "0 -100%" } : undefined}>{tip?.text}</div>
    </div>
  );
}

function Chart({ title, sub, legend, plot, source, head, body }: {
  title: string; sub: string; legend?: ReactNode; plot: ReactNode; source: string; head: string[]; body: (string | number)[][];
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="chart">
      <h3>{title}</h3>
      <p className="sub">{sub}</p>
      {legend}
      {plot}
      <div className="chart-foot">
        <span>{source}</span>
        <button className="tbl-btn" type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>{open ? ui.hideTable : ui.showTable}</button>
      </div>
      <table className="data" id={id} hidden={!open}>
        <thead><tr>{head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>{body.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

function Dumbbell() {
  const tk = ticks(Math.max(...O.time.map((t) => t.before)));
  const MAX = tk[tk.length - 1];
  const pct = (v: number) => (v / MAX) * 100;
  const T = R.time;
  return (
    <Chart title={T.title} sub={T.sub}
      legend={<div className="legend"><span><i style={{ background: "var(--before)" }} />{T.legend[0]}</span><span><i style={{ background: "var(--after)" }} />{T.legend[1]}</span></div>}
      plot={
        <Plot lab="clamp(116px, 34%, 200px)"
          before={<div className="grid-x" aria-hidden="true">{tk.map((t) => <span key={t} style={{ left: `${pct(t)}%` }} />)}</div>}
          after={<div className="axis" aria-hidden="true">{tk.map((t) => <span key={t} style={{ left: `${pct(t)}%` }}>{t}</span>)}</div>}
          rows={O.time.map((t) => ({
            key: t.label,
            tip: `${t.label}: ${t.beforeText} before, ${t.afterText} after. ${role(t.role).company}.`,
            aria: `${t.label}: ${t.beforeText} before, ${t.afterText} after`,
            label: t.label, small: role(t.role).short,
            track: (
              <div className="db-track" style={{ "--b": pct(t.before), "--a": pct(t.after) } as CSSProperties} aria-hidden="true">
                <span className="db-line" /><span className="db-dot before" /><span className="db-dot after" />
                <span className={`db-val before${t.before >= MAX * 0.85 ? " is-end" : ""}`}>{t.beforeText}</span>
                <span className="db-val after">{t.afterText}</span>
              </div>
            ),
          }))} />
      }
      source={sources(O.time.map((t) => t.role))}
      head={T.columns} body={O.time.map((t) => [t.label, t.beforeText, t.afterText, role(t.role).short])} />
  );
}

function Bars() {
  const HMAX = Math.max(...O.hoursSaved.map((h) => h.hours)) * 1.2;
  const H = R.hours;
  return (
    <Chart title={H.title} sub={H.sub}
      plot={
        <Plot lab="clamp(116px, 44%, 200px)"
          rows={O.hoursSaved.map((h) => ({
            key: h.label,
            tip: `${h.label}: about ${h.hours} hours a week. ${h.detail}, ${role(h.role).company}.`,
            aria: `${h.label}: about ${h.hours} hours a week`,
            label: h.label, small: h.detail,
            track: (
              <div className="bar-track" aria-hidden="true">
                <span className="bar-fill" style={{ "--v": (h.hours / HMAX) * 100 } as CSSProperties} />
                <span className="bar-val">{h.hours} {H.unit}</span>
              </div>
            ),
          }))} />
      }
      source={sources(O.hoursSaved.map((h) => h.role))}
      head={H.columns} body={O.hoursSaved.map((h) => [h.label, h.hours, role(h.role).short])} />
  );
}

export default function Results() {
  const S = sections.results;
  return (
    <section className="sec wrap" id="results">
      <div className="sec-head" data-reveal><h2>{S.heading}</h2>{S.intro && <p>{S.intro}</p>}</div>
      <div className="charts" data-reveal><Dumbbell /><Bars /></div>
      <div className="changes" data-reveal>
        {O.changes.map((c) => (
          <div className="chg" key={c.label}><b>{c.value > 0 ? "+" : ""}{c.value}%</b><span>{c.label}</span><small>{role(c.role).short}</small></div>
        ))}
        {O.other.map((c) => (
          <div className="chg" key={c.label}><b>{c.figure}</b><span>{c.label}, {R.downFrom} {c.beforeText}</span><small>{role(c.role).short}</small></div>
        ))}
      </div>
    </section>
  );
}
