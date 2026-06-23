"use client";

import { useState } from "react";

// The residual-vs-fitted plot is the single most useful diagnostic. A healthy model gives
// a flat, structureless band. Three classic pathologies each leave a signature shape.
type Mode = "good" | "curve" | "funnel";

const N = 40;
const MODES: Record<Mode, { label: string; verdict: string; color: string }> = {
  good: { label: "Healthy", verdict: "Flat random band — assumptions hold.", color: "var(--good)" },
  curve: { label: "Nonlinearity", verdict: "A U-shape — the true relationship is curved; add a term or transform.", color: "var(--warn)" },
  funnel: { label: "Heteroscedasticity", verdict: "A fan — variance grows with the fit; try WLS or a log transform.", color: "var(--bad)" },
};

export function ResidualPatternLab() {
  const [mode, setMode] = useState<Mode>("good");

  const W = 320, H = 180;
  const fx = (f: number) => Math.round((28 + f * (W - 48)) * 100) / 100;              // f in 0..1
  const ry = (e: number) => Math.round((H / 2 - 8 + e * 60) * 100) / 100;             // e in ~[-1,1]

  const pts = Array.from({ length: N }, (_, i) => {
    const f = i / (N - 1);
    const jit = Math.sin(i * 12.9898) * 43758.5453;
    const noise = (jit - Math.floor(jit)) * 2 - 1;           // deterministic [-1,1]
    let e = 0;
    if (mode === "good") e = noise * 0.6;
    else if (mode === "curve") e = (Math.pow(f - 0.5, 2) * 4 - 0.5) + noise * 0.25;
    else e = noise * (0.1 + f * 1.0);                        // funnel widens with f
    return { f, e };
  });

  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
        <span style={head}>Reading the residual-vs-fitted plot</span>
        <div style={{ display: "flex", gap: 6 }}>
          {(Object.keys(MODES) as Mode[]).map((m) => (
            <button key={m} onClick={() => setMode(m)} style={btn(mode === m, MODES[m].color)}>{MODES[m].label}</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        <line x1={28} y1={ry(0)} x2={W - 20} y2={ry(0)} stroke="var(--brand)" strokeWidth={1.4} strokeDasharray="4 3" strokeOpacity={0.7} />
        {pts.map((p, i) => <circle key={i} cx={fx(p.f)} cy={ry(p.e)} r={3.2} fill={MODES[mode].color} fillOpacity={0.8} />)}
        <text x={W / 2} y={H - 6} fontSize={10} fill="var(--faint)" textAnchor="middle">fitted value →</text>
        <text x={12} y={H / 2} fontSize={10} fill="var(--faint)" textAnchor="middle" transform={`rotate(-90 12 ${H / 2})`}>residual</text>
      </svg>
      <div style={caption}><strong style={{ color: MODES[mode].color }}>{MODES[mode].label}:</strong> {MODES[mode].verdict}</div>
    </div>
  );
}

const wrap: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, margin: "1.6rem 0" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)" };
const caption: React.CSSProperties = { fontSize: 12.5, color: "var(--muted)", marginTop: 14, lineHeight: 1.5 };
function btn(active: boolean, color: string): React.CSSProperties {
  return { fontSize: 11.5, padding: "4px 10px", borderRadius: 999, cursor: "pointer", border: `1px solid ${active ? color : "var(--border-strong)"}`, background: active ? color : "transparent", color: active ? "white" : "var(--muted)" };
}
