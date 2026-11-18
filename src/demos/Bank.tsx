/* PSECU: member banking app, one flow. Pick an action and an amount; balances and activity update. */
import { useId, useRef, useState, type Ref } from "react";
import type { BankDemo } from "../types.ts";
import { fmt, money, useFirstView, useTweenText, wait } from "../lib/motion.ts";
import { Frame } from "./shared.tsx";

type Mode = "deposit" | "withdraw" | "ira";
type Row = { id: number; label: string; account: string; amount: number; fresh: boolean };

function Account({ name, last4, balance, extra, elRef }: { name: string; last4: string; balance: number; extra?: string; elRef: Ref<HTMLDivElement> }) {
  const [ref, initial] = useTweenText<HTMLOutputElement>(balance, money, 600);
  return (
    <div className="bank-acct" ref={elRef}>
      <span className="bank-acct-name">{name} ••{last4}</span>
      <output className="d-num" ref={ref}>{initial}</output>
      {extra && <span className="bank-apy">{extra}</span>}
    </div>
  );
}

/* Replays the CSS bump animation on an element. */
const bump = (el: HTMLElement | null) => {
  if (!el) return;
  el.classList.remove("is-bump"); void el.offsetWidth; el.classList.add("is-bump");
};

export default function Bank({ d }: { d: BankDemo }) {
  const L = d.labels;
  const [st, setSt] = useState({ checking: d.checking.balance, ira: d.ira.balance, mode: "deposit" as Mode, amt: d.quick[1] ?? d.quick[0], withdrawn: 0, err: "" });
  const [rows, setRows] = useState<Row[]>(() => d.activity.slice(0, 3).map((t, i) => ({ ...t, id: -i - 1, fresh: false })));
  const [live, setLive] = useState("");
  const [pressing, setPressing] = useState(false);
  const stRef = useRef(st);
  stRef.current = st;
  const rowId = useRef(0);
  const chkEl = useRef<HTMLDivElement>(null);
  const iraEl = useRef<HTMLDivElement>(null);
  const touched = useRef(false);
  const errId = useId();

  const modes: [Mode, string][] = [["deposit", L.deposit], ["withdraw", L.withdraw], ["ira", L.toIra]];
  const goLabel = (s: typeof st) => {
    const a = `$${fmt(s.amt)}`;
    return { deposit: `${L.deposit} ${a}`, withdraw: `${L.withdraw} ${a}`, ira: `Move ${a} to IRA` }[s.mode];
  };
  const set = (patch: Partial<typeof st>) => setSt((s) => ({ ...s, ...patch, err: "" }));
  const addRow = (label: string, amount: number) =>
    setRows((r) => [{ id: ++rowId.current, label, account: d.checking.name, amount, fresh: true }, ...r].slice(0, 3));

  function go() {
    const s = stRef.current, amt = s.amt;
    let err = "";
    if (s.mode !== "deposit" && amt > s.checking) err = `Not enough in checking. Available: ${money(s.checking)}.`;
    else if (s.mode === "withdraw" && s.withdrawn >= d.dailyLimit) err = `Daily withdrawal limit of ${money(d.dailyLimit)} reached.`;
    else if (s.mode === "withdraw" && s.withdrawn + amt > d.dailyLimit) err = `That passes the ${money(d.dailyLimit)} daily withdrawal limit. ${money(d.dailyLimit - s.withdrawn)} left today.`;
    if (err) { setSt({ ...s, err }); return; }
    const next = { ...s, err: "" };
    if (s.mode === "deposit") { next.checking += amt; addRow("Mobile deposit", amt); }
    if (s.mode === "withdraw") { next.checking -= amt; next.withdrawn += amt; addRow("Withdrawal", -amt); }
    if (s.mode === "ira") { next.checking -= amt; next.ira += amt; addRow(`Transfer to ${d.ira.name}`, -amt); bump(iraEl.current); }
    bump(chkEl.current);
    setSt(next);
    setLive(`${goLabel(s)} done. ${d.checking.name} ${money(next.checking)}, IRA ${money(next.ira)}.`);
  }

  /* First view: switch to To IRA, pick an amount, move it. Skipped once the visitor touches the app. */
  const ref = useFirstView<HTMLDivElement>(async () => {
    await wait(600);
    if (touched.current) return;
    set({ mode: "ira" });
    await wait(600);
    if (touched.current) return;
    set({ amt: d.quick[1] ?? d.quick[0] });
    setPressing(true);
    await wait(180);
    setPressing(false);
    go();
  });

  return (
    <Frame type="bank" title={d.title} live={live} rootRef={ref} onPointerDown={() => (touched.current = true)}>
      <div className="bank-accts">
        <Account {...d.checking} balance={st.checking} elRef={chkEl} />
        <Account {...d.ira} balance={st.ira} extra={`APY ${d.ira.apy.toFixed(2)}%`} elRef={iraEl} />
      </div>
      <div className="d-seg" role="group" aria-label="Transaction type">
        {modes.map(([id, label]) => <button key={id} type="button" aria-pressed={st.mode === id} onClick={() => set({ mode: id })}>{label}</button>)}
      </div>
      <div className="bank-pick">
        <div className="d-chips" role="group" aria-label="Amount">
          {d.quick.map((q) => <button key={q} className="d-chip" type="button" aria-pressed={st.amt === q} onClick={() => set({ amt: q })}>${fmt(q)}</button>)}
        </div>
        <button className={`d-btn${pressing ? " is-press" : ""}`} type="button" aria-describedby={errId} onClick={go}>{goLabel(st)}</button>
      </div>
      <p className="d-error" id={errId} hidden={!st.err}>{st.err}</p>
      <div className="bank-activity">
        <span className="d-label">{L.activity}</span>
        <ol className="bank-list">
          {rows.map((t) => (
            <li key={t.id} className={`bank-row${t.fresh ? " is-new" : ""}`}>
              <span className="bank-row-label">{t.label}<small>{t.account}</small></span>
              <span className={`bank-row-amt${t.amount > 0 ? " is-pos" : ""}`}>{money(t.amount, true)}</span>
            </li>
          ))}
        </ol>
      </div>
    </Frame>
  );
}
