/* Pieces every experience app uses. Classes match demos.css. */
import { useCallback, useRef, useState, type ReactNode, type Ref } from "react";
import content from "../content.ts";

export function Frame({ type, title, live, children, rootRef, onPointerDown }: {
  type: string; title: string; live: string; children: ReactNode; rootRef?: Ref<HTMLDivElement>; onPointerDown?: () => void;
}) {
  return (
    <div className={`demo demo--${type}`} ref={rootRef} onPointerDown={onPointerDown}>
      <div className="demo-head">
        <span className="demo-title">{title}</span>
        <span className="demo-tag">{content.ui.simulation}</span>
      </div>
      <div className="demo-body">{children}</div>
      <p className="d-sr" aria-live="polite">{live}</p>
    </div>
  );
}

export const Stat = ({ label, children, bad }: { label: string; children: ReactNode; bad?: boolean }) => (
  <div className={bad ? "is-bad" : undefined}><dt>{label}</dt><dd>{children}</dd></div>
);

export const Legend = ({ items }: { items: [string, string][] }) => (
  <ul className="d-legend">
    {items.map(([label, cls]) => <li key={label}><span className={`d-swatch ${cls}`} />{label}</li>)}
  </ul>
);

/* A log tail that keeps the last `max` lines. Each part is [text, className?]. */
export type LogPart = [string, string?];
export function useLog(max = 4) {
  const [lines, setLines] = useState<{ id: number; parts: LogPart[] }[]>([]);
  const id = useRef(0);
  const add = useCallback((parts: LogPart[]) => setLines((l) => [...l, { id: ++id.current, parts }].slice(-max)), [max]);
  const clear = useCallback(() => setLines([]), []);
  return { lines, add, clear };
}

export const Log = ({ lines, label }: { lines: { id: number; parts: LogPart[] }[]; label: string }) => (
  <div className="d-log" role="log" aria-label={label}>
    {lines.map((l) => (
      <div className="d-log-line" key={l.id}>{l.parts.map(([t, c], i) => <span key={i} className={c}>{t}</span>)}</div>
    ))}
  </div>
);
