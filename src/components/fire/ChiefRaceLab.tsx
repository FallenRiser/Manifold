"use client";

import { useState } from "react";
import { RULES, FIRES, race, type Rule, type Race } from "./chiefRace";

// Race two fire chiefs over 200 fires on the lab map and compare them fire by fire. With the same dice each dot is one
// fire both chiefs faced; with different dice the "pairs" are unrelated fires, and pairing stops helping.

type Metric = "village" | "burnt";
const SIZE = 270, PAD = 34;

export function ChiefRaceLab() {
  const [a, setA] = useState<Rule>("guard");
  const [b, setB] = useState<Rule>("nearest");
  const [metric, setMetric] = useState<Metric>("burnt");
  const [paired, setPaired] = useState(true);
  const [res, setRes] = useState<(Race & { metric: Metric; ruleA: Rule; ruleB: Rule }) | null>(null);
  const [busy, setBusy] = useState(false);

  const run = () => {
    setBusy(true);
    setTimeout(() => { setRes({ ...race(a, b, paired, metric), metric, ruleA: a, ruleB: b }); setBusy(false); }, 20);
  };
  const label = (k: Rule) => RULES.find((r) => r.k === k)!.label;

  return (
    <div style={box}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
        <span style={head}>Race two chiefs, fire by fire</span>
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>{FIRES} fires on the lab map · the same two starting fires, different dice each time</span>
      </div>

      {(["A", "B"] as const).map((side) => (
        <div key={side} style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: "var(--faint)", marginBottom: 4 }}>chief {side}</div>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {RULES.map(({ k, label: l }) => {
              const on = (side === "A" ? a : b) === k;
              return (
                <button key={k} aria-pressed={on} onClick={() => (side === "A" ? setA(k) : setB(k))}
                  style={{ ...btn, padding: "4px 9px", ...(on ? chosen : {}) }}>{l}</button>
              );
            })}
          </div>
        </div>
      ))}

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", margin: "10px 0" }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--faint)", marginBottom: 4 }}>compare</div>
          <div style={{ display: "flex", gap: 5 }}>
            <button style={{ ...btn, ...(metric === "village" ? chosen : {}) }} aria-pressed={metric === "village"} onClick={() => setMetric("village")}>village cells damaged</button>
            <button style={{ ...btn, ...(metric === "burnt" ? chosen : {}) }} aria-pressed={metric === "burnt"} onClick={() => setMetric("burnt")}>cells burnt</button>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "var(--faint)", marginBottom: 4 }}>fire k for chief B</div>
          <div style={{ display: "flex", gap: 5 }}>
            <button style={{ ...btn, ...(paired ? chosen : {}) }} aria-pressed={paired} onClick={() => setPaired(true)}>same dice as A</button>
            <button style={{ ...btn, ...(!paired ? chosen : {}) }} aria-pressed={!paired} onClick={() => setPaired(false)}>different dice</button>
          </div>
        </div>
      </div>

      <button style={{ ...btn, ...primary }} onClick={run} disabled={busy}>{busy ? "Running…" : `▶ Run ${FIRES} fires for each chief`}</button>

      {res && <Result res={res} label={label} />}
    </div>
  );
}

function Result({ res, label }: { res: Race & { metric: Metric; ruleA: Rule; ruleB: Rule }; label: (k: Rule) => string }) {
  const xa = res.a.map((e) => e[res.metric]), xb = res.b.map((e) => e[res.metric]);
  const max = res.metric === "village" ? 9 : Math.max(20, Math.ceil(Math.max(...xa, ...xb) / 20) * 20);
  const scale = (v: number) => PAD + (v / max) * (SIZE - PAD - 10);
  const y = (v: number) => SIZE - scale(v);
  const unit = res.metric === "village" ? "village cells damaged" : "cells burnt";
  const fmt = (v: number) => (res.metric === "village" ? v.toFixed(2) : v.toFixed(1));

  // village damage is 0..9, so many fires land on the same spot: draw one dot per spot, sized by how many
  const spots = new Map<string, { x: number; y: number; n: number; d: number }>();
  xa.forEach((va, i) => {
    const key = `${va},${xb[i]}`;
    const s = spots.get(key) ?? { x: va, y: xb[i], n: 0, d: va - xb[i] };
    s.n += 1; spots.set(key, s);
  });
  const colour = (d: number) => (d < 0 ? "var(--good)" : d > 0 ? "var(--bad)" : "var(--faint)");
  const ratio = (res.seSeparate / res.sePaired) ** 2;

  return (
    <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginTop: 14, alignItems: "flex-start" }}>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ flex: "0 1 270px", width: "100%", maxWidth: 300, height: "auto", display: "block", userSelect: "none" }}
        role="img" aria-label={`Each fire as a dot: ${label(res.ruleA)} across, ${label(res.ruleB)} up`}>
        <rect x={PAD} y={10} width={SIZE - PAD - 10} height={SIZE - PAD - 10} fill="var(--surface)" stroke="var(--border)" />
        <line x1={scale(0)} y1={y(0)} x2={scale(max)} y2={y(max)} stroke="var(--border-strong)" strokeDasharray="4 3" />
        {[...spots.values()].map((s, i) => (
          <circle key={i} cx={scale(s.x)} cy={y(s.y)} r={res.metric === "village" ? 2.2 + 1.5 * Math.sqrt(s.n) : 2.4}
            fill={colour(s.d)} fillOpacity={res.metric === "village" ? 0.55 : 0.5} />
        ))}
        {[0, max / 2, max].map((v) => (
          <g key={v} fontSize={9} fill="var(--faint)">
            <text x={scale(v)} y={SIZE - PAD + 13} textAnchor="middle">{v}</text>
            <text x={PAD - 5} y={y(v) + 3} textAnchor="end">{v}</text>
          </g>
        ))}
        <text x={(SIZE + PAD) / 2} y={SIZE - 3} textAnchor="middle" fontSize={10} fill="var(--muted)">A: {label(res.ruleA)}</text>
        <text x={10} y={(SIZE - PAD) / 2} textAnchor="middle" fontSize={10} fill="var(--muted)" transform={`rotate(-90 10 ${(SIZE - PAD) / 2})`}>B: {label(res.ruleB)}</text>
      </svg>

      <div style={{ flex: "1 1 240px", fontSize: 13, color: "var(--muted)", lineHeight: 1.55 }}>
        <div style={{ color: "var(--ink)", marginBottom: 6 }}>{unit}, mean over {FIRES} fires</div>
        <Row k={`A · ${label(res.ruleA)}`} v={fmt(res.meanA)} />
        <Row k={`B · ${label(res.ruleB)}`} v={fmt(res.meanB)} />
        <Row k="A minus B" v={`${res.diff > 0 ? "+" : ""}${fmt(res.diff)}`} strong />
        <div style={{ margin: "10px 0 4px", color: "var(--ink)" }}>standard error of that difference</div>
        <Row k="treating the runs as separate" v={res.seSeparate.toFixed(2)} />
        <Row k="fire by fire (pairs)" v={res.sePaired.toFixed(2)} strong />
        <div style={{ marginTop: 10 }}>
          <span style={{ color: "var(--good)" }}>● A lower in {res.better}</span> ·{" "}
          <span style={{ color: "var(--faint)" }}>● equal in {res.same}</span> ·{" "}
          <span style={{ color: "var(--bad)" }}>● A higher in {res.worse}</span>
        </div>
        <div style={{ marginTop: 8, fontSize: 12.5 }}>
          {res.paired
            ? ratio >= 1.15
              ? `Pairing did the work of ${ratio.toFixed(1)}× as many fires.`
              : "Pairing barely helped here: these two chiefs' results hardly move together from fire to fire."
            : "With different dice the pairs are unrelated fires, so pairing them buys nothing."}
        </div>
      </div>
    </div>
  );
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, borderTop: "1px solid var(--border)", padding: "2px 0" }}>
      <span>{k}</span>
      <span style={{ fontFamily: "ui-monospace, monospace", color: strong ? "var(--ink)" : "var(--muted)" }}>{v}</span>
    </div>
  );
}

const box: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "0.4rem 0 1.6rem" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)" };
const btn: React.CSSProperties = { borderWidth: 1, borderStyle: "solid", borderColor: "var(--border)", borderRadius: 7, cursor: "pointer", padding: "5px 11px", fontSize: 12.5, color: "var(--muted)", background: "transparent", fontFamily: "var(--font-sans, sans-serif)" };
const chosen: React.CSSProperties = { borderColor: "var(--c-rl)", background: "color-mix(in srgb, var(--c-rl) 14%, transparent)", color: "var(--ink)" };
const primary: React.CSSProperties = { borderColor: "var(--c-rl)", background: "color-mix(in srgb, var(--c-rl) 15%, transparent)", color: "var(--ink)" };
