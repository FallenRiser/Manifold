"use client";

import { useState } from "react";

// What an exit is worth, priced exactly the way the learner prices it: −1 a second, discount γ, and a
// bootstrapped clock (so staying is valued as −1 forever, −1/(1−γ)). At γ = 0.99 these curves give the
// page's numbers: free exit at 100.6 s −63.6; penalised at 100.6 s −100.1 and at 135.8 s −91.0.

const CLOCK = 200;

export function EdgeValueLab() {
  const [gamma, setGamma] = useState(0.99);
  const [t, setT] = useState(100.6);

  const stay = -1 / (1 - gamma);
  const free = (s: number) => -(1 - Math.pow(gamma, s)) / (1 - gamma);
  const pen = (s: number) => free(s) - Math.pow(gamma, s - 1) * (CLOCK - s);

  const W = 600, H = 260, L = 46, R = 14, T = 16, B = 34;
  const lo = Math.min(-210, Math.floor(stay / 50) * 50);
  const sx = (s: number) => L + (s / CLOCK) * (W - L - R);
  const sy = (v: number) => T + (v / lo) * (H - T - B);
  const curve = (fn: (s: number) => number) => {
    let d = "";
    for (let s = 1; s <= CLOCK; s += 1) d += `${s === 1 ? "M" : "L"}${sx(s).toFixed(1)},${sy(Math.max(lo, fn(s))).toFixed(1)}`;
    return d;
  };
  const vf = free(t), vp = pen(t);
  const verdict = (v: number) => (v > stay + 0.5 ? { txt: "better than staying", c: "var(--bad)" } : v < stay - 0.5 ? { txt: "worse than staying", c: "var(--good)" } : { txt: "about break-even", c: "var(--muted)" });

  return (
    <div style={box}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 6 }}>
        <span style={head}>What leaving the course is worth, to a boat paid −1 a second</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }} role="img" aria-label="Value of exiting at each second">
        {[0, -50, -100, -150, -200, -250, -300].filter((v) => v >= lo).map((v) => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={sy(v)} y2={sy(v)} stroke="var(--border)" />
            <text x={L - 6} y={sy(v) + 4} fontSize={10} fill="var(--faint)" textAnchor="end">{v}</text>
          </g>
        ))}
        {[0, 50, 100, 150, 200].map((s) => <text key={s} x={sx(s)} y={H - 14} fontSize={10} fill="var(--faint)" textAnchor="middle">{s} s</text>)}
        <text x={W - R} y={H - 2} fontSize={10.5} fill="var(--faint)" textAnchor="end">second at which the boat leaves</text>
        <line x1={L} x2={W - R} y1={sy(stay)} y2={sy(stay)} stroke="var(--ink)" strokeWidth={1.8} strokeDasharray="6 4" />
        <text x={L + 6} y={sy(stay) - 6} fontSize={11} fill="var(--ink)">stay and never finish: {stay.toFixed(1)}</text>
        <path d={curve(free)} fill="none" stroke="var(--c-regression)" strokeWidth={2.2} />
        <path d={curve(pen)} fill="none" stroke="var(--c-rl)" strokeWidth={2.2} />
        {[100.6, 135.8].map((m, i) => (
          <g key={m}>
            <line x1={sx(m)} x2={sx(m)} y1={T} y2={H - B} stroke="var(--faint)" strokeDasharray="2 3" />
            <text x={sx(m) + 3} y={T + 10 + i * 13} fontSize={9.5} fill="var(--faint)">measured exit {m} s</text>
          </g>
        ))}
        <line x1={sx(t)} x2={sx(t)} y1={T} y2={H - B} stroke="var(--ink)" strokeWidth={1} />
        <circle cx={sx(t)} cy={sy(Math.max(lo, vf))} r={5} fill="var(--c-regression)" />
        <circle cx={sx(t)} cy={sy(Math.max(lo, vp))} r={5} fill="var(--c-rl)" />
      </svg>

      <label style={sl}>
        <span style={{ minWidth: 130 }}>leave at <b style={mono}>{t.toFixed(1)} s</b></span>
        <input type="range" min={1} max={199} step={0.1} value={t} onChange={(e) => setT(Number(e.target.value))} style={{ flex: 1, accentColor: "var(--c-rl)" }} aria-label="exit time" />
      </label>
      <label style={sl}>
        <span style={{ minWidth: 130 }}>discount γ <b style={mono}>{gamma.toFixed(3)}</b></span>
        <input type="range" min={0.95} max={0.999} step={0.001} value={gamma} onChange={(e) => setGamma(Number(e.target.value))} style={{ flex: 1, accentColor: "var(--c-rl)" }} aria-label="discount" />
      </label>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 8, marginTop: 10 }}>
        {[
          { name: "free edge", v: vf, c: "var(--c-regression)" },
          { name: "penalised edge", v: vp, c: "var(--c-rl)" },
        ].map((o) => {
          const vd = verdict(o.v);
          return (
            <div key={o.name} style={{ border: "1px solid var(--border)", borderRadius: 9, padding: "7px 10px" }}>
              <div style={{ fontSize: 11.5, color: o.c, fontWeight: 600 }}>{o.name}</div>
              <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 15, color: "var(--ink)" }}>{o.v.toFixed(1)}</div>
              <div style={{ fontSize: 11.5, color: vd.c }}>{vd.txt}</div>
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 12, color: "var(--faint)", marginTop: 8, lineHeight: 1.5 }}>
        Wherever a curve sits above the dashed line, leaving is the better deal for this learner. The penalty is the rest of the clock,
        paid on the last step — and a payment arriving late is shrunk by discounting.
      </div>
    </div>
  );
}

const box: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "0.4rem 0 1.6rem" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)" };
const sl: React.CSSProperties = { display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "var(--muted)", marginTop: 8 };
const mono: React.CSSProperties = { color: "var(--ink)", fontFamily: "ui-monospace, monospace" };
