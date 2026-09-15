"use client";

import { useEffect, useMemo, useState } from "react";
import { RULES, runBook, cost, leaderBands, type Book, type Rule, type Shape } from "./values";

// Six rules, flown once on the lab map, then priced over and over. Nothing here re-flies anything when the
// dial moves: the episodes are a fact about the world and the reward is an opinion about them. The dial is
// that opinion — what one village cell is worth in ordinary cells — and it changes which rule the book calls best.

const EPISODES = 200;
const SHIPPED = 11;                       // the environment charges 1 for any cell and 10 more for a village one
// The dial stops on round numbers, so what the reader reads is exactly what is being priced.
const RATES = [1, 1.1, 1.2, 1.3, 1.45, 1.6, 1.8, 2, 2.2, 2.5, 2.8, 3.2, 3.6, 4, 4.5, 5, 5.5, 6, 7, 8, 9, 10,
  SHIPPED, 12, 14, 16, 18, 20, 23, 26, 30, 32, 35, 40, 45, 50, 60, 70, 80, 90, 100, 120, 150, 200];
const LO = RATES[0], HI = RATES[RATES.length - 1];

export function ValuesDialLab() {
  const [book, setBook] = useState<Book | null>(null);
  const [i, setI] = useState(RATES.indexOf(SHIPPED));
  const [shape, setShape] = useState<Shape>("catch");
  const x = RATES[i];

  useEffect(() => {
    const id = setTimeout(() => setBook(runBook(EPISODES, 1)), 30);
    return () => clearTimeout(id);
  }, []);

  const bands = useMemo(() => (book ? leaderBands(book, shape, LO, HI) : []), [book, shape]);
  const rows = useMemo(() => {
    if (!book) return [];
    const scored = RULES.map((r) => ({ rule: r, c: cost(book[r], x, shape) })).sort((a, b) => a.c - b.c);
    const best = scored[0].c, worst = scored[scored.length - 1].c;
    return scored.map((s, k) => ({ ...s, lead: k === 0, share: (worst - s.c) / (worst - best || 1) }));
  }, [book, x, shape]);

  const pct = (v: number) => (100 * Math.log(v / LO)) / Math.log(HI / LO);


  return (
    <div style={box}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        <span style={head}>What is a village cell worth?</span>
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>the lab map · six rules, flown once, priced many times</span>
      </div>

      <div style={{ fontSize: 11, color: "var(--faint)", marginBottom: 4 }}>what the reward charges for</div>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 14 }}>
        <Choice on={shape === "catch"} onClick={() => setShape("catch")}>each cell, once, when it catches</Choice>
        <Choice on={shape === "rent"} onClick={() => setShape("rent")}>rent, for every tick it burns</Choice>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13.5, color: "var(--muted)" }}>
          one village cell is worth{" "}
          <strong style={{ color: "var(--ink)", fontFamily: "ui-monospace, monospace", fontSize: 15 }}>
            {x < 10 ? x.toFixed(x % 1 ? 2 : 0).replace(/0$/, "") : x}
          </strong>{" "}
          ordinary cell{x === 1 ? "" : "s"}
        </span>
        <span style={{ fontSize: 11.5, color: x === SHIPPED ? "var(--c-rl)" : "var(--faint)" }}>
          {x === SHIPPED ? "← the shipped reward" : `the shipped reward says ${SHIPPED}`}
        </span>
      </div>
      <input type="range" min={0} max={RATES.length - 1} value={i} onChange={(e) => setI(+e.target.value)}
        aria-label="what one village cell is worth in ordinary cells"
        style={{ width: "100%", accentColor: "var(--c-rl)", margin: "6px 0 2px" }} />

      <div style={{ position: "relative", height: 30, marginBottom: 16 }}>
        <div style={{ display: "flex", height: 13, borderRadius: 4, overflow: "hidden", border: "1px solid var(--border)" }}>
          {bands.map((b, k) => (
            <div key={k} title={`${b.rule} leads from ${b.from.toFixed(1)} to ${b.to.toFixed(1)}`}
              style={{ width: `${pct(b.to) - pct(b.from)}%`, background: `color-mix(in srgb, var(--c-rl) ${18 + 26 * k}%, transparent)` }} />
          ))}
        </div>
        {bands.map((b, k) => (
          <div key={k} style={{ position: "absolute", left: `${pct(b.from)}%`, top: 15, fontSize: 10.5, color: "var(--faint)", whiteSpace: "nowrap" }}>
            {b.from > LO ? `${b.from.toFixed(1)} ` : ""}{b.rule}
          </div>
        ))}
        <div style={{ position: "absolute", left: `${pct(x)}%`, top: -3, width: 2, height: 19, background: "var(--ink)" }} />
      </div>

      {!book ? (
        <div style={{ fontSize: 13, color: "var(--faint)", padding: "18px 0" }}>Flying {EPISODES} fires for each of the six rules…</div>
      ) : (
        <>
          {rows.map(({ rule, c, lead, share }) => (
            <div key={rule} style={{ marginBottom: 7 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 12.5 }}>
                <span style={{ color: lead ? "var(--ink)" : "var(--muted)" }}>{lead ? "▸ " : ""}{rule}</span>
                <span style={{ fontFamily: "ui-monospace, monospace", color: lead ? "var(--ink)" : "var(--muted)" }}>−{c.toFixed(1)}</span>
              </div>
              <div style={{ height: 7, background: "var(--border)", borderRadius: 4, marginTop: 3, overflow: "hidden" }}>
                <div style={{ width: `${100 * share}%`, height: "100%", background: lead ? "var(--c-rl)" : "color-mix(in srgb, var(--c-rl) 40%, var(--border))" }} />
              </div>
            </div>
          ))}
          <div style={{ marginTop: 11, fontSize: 12.5, color: "var(--muted)", borderTop: "1px solid var(--border)", paddingTop: 8, lineHeight: 1.55 }}>
            At this exchange rate the rule book says <strong style={{ color: "var(--ink)" }}>{rows[0].rule}</strong>. Nothing
            was re-flown to work that out — the six episodes are the same six episodes at every setting of the dial, and
            only the price list changed.
          </div>
        </>
      )}
    </div>
  );
}

function Choice({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} aria-pressed={on} style={{ ...btn, padding: "4px 9px", ...(on ? chosen : {}) }}>{children}</button>;
}

const box: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "0.4rem 0 1.6rem" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)" };
const btn: React.CSSProperties = { borderWidth: 1, borderStyle: "solid", borderColor: "var(--border)", borderRadius: 7, cursor: "pointer", padding: "5px 11px", fontSize: 12.5, color: "var(--muted)", background: "transparent", fontFamily: "var(--font-sans, sans-serif)" };
const chosen: React.CSSProperties = { borderColor: "var(--c-rl)", background: "color-mix(in srgb, var(--c-rl) 14%, transparent)", color: "var(--ink)" };
