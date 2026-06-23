"use client";

import { useState } from "react";

// Homoscedasticity = constant error variance. As you crank the spread-growth knob, the
// residual band turns from an even ribbon into a fan — the signature of heteroscedasticity.
const N = 60;

export function HomoscedasticityLab() {
  const [growth, setGrowth] = useState(0);

  const W = 320, H = 180;
  const cx = (x: number) => Math.round((28 + x * (W - 48)) * 100) / 100;
  const cy = (e: number) => Math.round((H / 2 - 6 + e * 62) * 100) / 100;

  const pts = Array.from({ length: N }, (_, i) => {
    const x = i / (N - 1);
    const j = Math.sin(i * 12.9898) * 43758.5453;
    const noise = (j - Math.floor(j)) * 2 - 1;
    const spread = 0.35 + growth * x * 1.6;       // grows with x when growth>0
    return { x, e: noise * spread };
  });

  const homo = growth < 0.15;

  return (
    <div style={wrap}>
      <div style={head}>Constant variance — or a fan?</div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        <line x1={28} y1={cy(0)} x2={W - 20} y2={cy(0)} stroke="var(--brand)" strokeWidth={1.4} strokeDasharray="4 3" strokeOpacity={0.7} />
        {/* envelope */}
        <path d={`M ${cx(0)} ${cy(0.35)} L ${cx(1)} ${cy(0.35 + growth * 1.6)} L ${cx(1)} ${cy(-(0.35 + growth * 1.6))} L ${cx(0)} ${cy(-0.35)} Z`}
          fill={`color-mix(in srgb, ${homo ? "var(--good)" : "var(--bad)"} 9%, transparent)`} />
        {pts.map((p, i) => <circle key={i} cx={cx(p.x)} cy={cy(p.e)} r={2.8} fill={homo ? "var(--good)" : "var(--bad)"} fillOpacity={0.8} />)}
        <text x={W / 2} y={H - 6} fontSize={10} fill="var(--faint)" textAnchor="middle">fitted value →</text>
        <text x={12} y={H / 2} fontSize={10} fill="var(--faint)" textAnchor="middle" transform={`rotate(-90 12 ${H / 2})`}>residual</text>
      </svg>
      <div style={{ marginTop: 12 }}>
        <div style={rowLbl}><span>Variance growth</span><span style={mono}>{growth.toFixed(2)}</span></div>
        <input type="range" min={0} max={1} step={0.02} value={growth}
          onChange={(e) => setGrowth(parseFloat(e.target.value))}
          style={{ width: "100%", accentColor: "var(--brand)", cursor: "ew-resize" }} />
      </div>
      <div style={caption}>
        {homo
          ? "Even band, top to bottom — homoscedastic. OLS standard errors are valid."
          : "The spread widens with the prediction — heteroscedastic. OLS still fits the line, but its standard errors and p-values are now wrong."}
      </div>
    </div>
  );
}

const wrap: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, margin: "1.6rem 0" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)", marginBottom: 12 };
const rowLbl: React.CSSProperties = { display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--muted)", marginBottom: 6 };
const mono: React.CSSProperties = { fontFamily: "ui-monospace, monospace", fontSize: 14, color: "var(--ink)" };
const caption: React.CSSProperties = { fontSize: 12.5, color: "var(--muted)", marginTop: 14, lineHeight: 1.5 };
