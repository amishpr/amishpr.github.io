/* Advisr: goals in, ranked ad types out, then a proposal deck. */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { AdsDemo } from "../types.ts";
import { reduced, useFirstView, useTweenText, wait } from "../lib/motion.ts";
import { adScore, split } from "../lib/sim.ts";
import { Frame } from "./shared.tsx";

const EASE = "cubic-bezier(.16,1,.3,1)";
const score = (n: number) => String(Math.round(n));

function Seg({ items, value, onPick, label }: { items: { id: string; label: string }[]; value: string; onPick: (id: string) => void; label: string }) {
  return (
    <div className="d-seg" role="group" aria-label={label}>
      {items.map((it) => <button key={it.id} type="button" aria-pressed={value === it.id} onClick={() => onPick(it.id)}>{it.label}</button>)}
    </div>
  );
}

function Row({ rank, name, why, sc, rowRef }: { rank: number; name: string; why: string; sc: number; rowRef: (el: HTMLLIElement | null) => void }) {
  const [scoreRef, initial] = useTweenText<HTMLSpanElement>(sc, score, 500, 0);
  const [grown, setGrown] = useState(false);
  useEffect(() => { const r = requestAnimationFrame(() => setGrown(true)); return () => cancelAnimationFrame(r); }, []);
  return (
    <li className="ad-row" ref={rowRef}>
      <span className="ad-rank">{rank}</span>
      <span className="ad-name">{name}</span>
      <span className="ad-score" ref={scoreRef}>{initial}</span>
      <span className="ad-why">{why}</span>
      <span className="ad-bar" style={{ transform: `scaleX(${grown ? sc / 100 : 0})` }} />
    </li>
  );
}

export default function Ads({ d }: { d: AdsDemo }) {
  const L = d.labels;
  const [goals, setGoals] = useState<string[]>([]);
  const [budget, setBudget] = useState(d.budgets[1]?.id ?? d.budgets[0].id);
  const [reach, setReach] = useState(d.reach[0].id);
  const [slides, setSlides] = useState<string[][]>([]);
  const [deckNote, setDeckNote] = useState(L.deckNote);
  const [deckLive, setDeckLive] = useState("");
  const [building, setBuilding] = useState(false);
  const touched = useRef(false);

  const ranked = useMemo(() => goals.length
    ? d.adTypes.map((t) => ({ t, sc: adScore(t, goals, budget, reach) }))
      .sort((a, b) => b.sc - a.sc || a.t.name.localeCompare(b.t.name)).slice(0, 5)
    : [], [d.adTypes, goals, budget, reach]);
  const top3 = ranked.slice(0, 3);
  const pcts = split(top3.map((x) => x.sc));

  /* Any input change clears the deck, as a new plan needs a new deck. */
  const changed = () => { setSlides([]); setDeckNote(L.deckNote); setDeckLive(""); };
  const toggleGoal = (id: string) => { setGoals((g) => (g.includes(id) ? g.filter((x) => x !== id) : [...g, id])); changed(); };

  /* Re-rank animation (FLIP): rows that moved slide from their old spot, new rows fade in. */
  const rows = useRef(new Map<string, HTMLLIElement>());
  const tops = useRef(new Map<string, number>());
  const order = ranked.map((x) => x.t.id).join();
  useLayoutEffect(() => {
    const next = new Map<string, number>();
    ranked.forEach(({ t }, i) => {
      const el = rows.current.get(t.id);
      if (!el) return;
      next.set(t.id, el.offsetTop);
      if (reduced()) return;
      const was = tops.current.get(t.id);
      if (was === undefined) el.animate([{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], { duration: 420, delay: i * 45, easing: EASE, fill: "backwards" });
      else if (was !== el.offsetTop) el.animate([{ transform: `translateY(${was - el.offsetTop}px)` }, { transform: "none" }], { duration: 520, easing: EASE });
    });
    tops.current = next;
  }, [order]); // eslint-disable-line react-hooks/exhaustive-deps

  async function buildDeck() {
    if (!ranked.length) return;
    setBuilding(true); setSlides([]); setDeckNote(L.deckBuilding);
    const label = (list: { id: string; label: string }[], id: string) => list.find((x) => x.id === id)?.label ?? "";
    const all = [
      [d.deck[0], d.client, d.goals.filter((g) => goals.includes(g.id)).map((g) => g.label).join(", ")],
      [d.deck[1], `${label(d.reach, reach)} reach`, d.audience],
      [d.deck[2], ...top3.map((x, i) => `${x.t.name} ${pcts[i]}%`)],
      [d.deck[3], `${label(d.budgets, budget)} a month`, d.flight],
    ];
    for (const s of all) { setSlides((x) => [...x, s]); await wait(320); }
    setDeckNote(L.deckDone); setDeckLive("Proposal deck built."); setBuilding(false);
  }

  const ref = useFirstView<HTMLDivElement>(async () => {
    const [a, b] = d.introGoals;
    if (touched.current || goals.length || !a) return;
    toggleGoal(a);
    await wait(1000);
    if (!touched.current && b) toggleGoal(b);
  });

  const live = deckLive || (ranked[0] ? `Top recommendation: ${ranked[0].t.name}.` : "");
  return (
    <Frame type="ads" title={d.title} live={live} rootRef={ref} onPointerDown={() => (touched.current = true)}>
      <div className="ads-layout">
        <div className="ads-form">
          <div className="d-field">
            <span className="d-label">{L.goals}</span>
            <div className="d-chips" role="group" aria-label={L.goals}>
              {d.goals.map((g) => <button key={g.id} className="d-chip" type="button" aria-pressed={goals.includes(g.id)} onClick={() => toggleGoal(g.id)}>{g.label}</button>)}
            </div>
            <p className="d-help">{L.goalsHelp}</p>
          </div>
          <div className="d-field"><span className="d-label">{L.budget}</span><Seg items={d.budgets} value={budget} onPick={(v) => { setBudget(v); changed(); }} label={L.budget} /></div>
          <div className="d-field"><span className="d-label">{L.reach}</span><Seg items={d.reach} value={reach} onPick={(v) => { setReach(v); changed(); }} label={L.reach} /></div>
        </div>
        <div className="ads-results">
          <span className="d-label">{L.results}</span>
          <div className="d-empty" hidden={ranked.length > 0}>{L.empty}</div>
          <ol className="ad-list" hidden={!ranked.length} style={{ position: "relative" }}>
            {ranked.map(({ t, sc }, i) => (
              <Row key={t.id} rank={i + 1} name={t.name} why={t.why} sc={sc}
                rowRef={(el) => { if (el) rows.current.set(t.id, el); else rows.current.delete(t.id); }} />
            ))}
          </ol>
          <div className="ad-split-wrap" hidden={!ranked.length}>
            <span className="d-label">{L.split}</span>
            <div className="ad-split" aria-hidden="true">{top3.map((_, i) => <span key={i} className={`ad-seg ad-seg--${i}`} style={{ flexGrow: pcts[i] }} />)}</div>
            <ul className="d-legend">{top3.map((x, i) => <li key={x.t.id}><span className={`d-swatch ad-seg--${i}`} />{x.t.name} {pcts[i]}%</li>)}</ul>
          </div>
        </div>
      </div>
      <div className="d-actions d-actions--split">
        <button className="d-btn" type="button" disabled={!ranked.length || building} onClick={buildDeck}>{L.deckButton}</button>
        <p className="d-note">{deckNote}</p>
      </div>
      <div className="ad-deck">
        {slides.map(([title, ...lines]) => (
          <div className="ad-slide" key={title}>
            <span className="ad-slide-title">{title}</span>
            {lines.map((l, i) => <span className="ad-slide-line" key={i}>{l}</span>)}
          </div>
        ))}
      </div>
    </Frame>
  );
}
