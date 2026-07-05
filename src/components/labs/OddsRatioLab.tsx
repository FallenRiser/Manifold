"use client";

import { useState } from "react";

// Odds-ratio intuition: a coefficient β means "one unit multiplies the odds by
// e^β" — a CONSTANT multiplier on odds. The payoff this lab exists for: the
// same odds ratio moves a 50% case enormously and a 5% case barely, because
// probability is nonlinear in odds. Drag the base risk to feel it.

const ACCENT = "var(--c-classification)";
const VW = 620;
const VH = 250;
const PAD = { l: 44, r: 16, t: 16, b: 34 };

const sig = (z: number) => 1 / (1 + Math.exp(-z));
const logit = (p: number) => Math.log(p / (1 - p));

export function OddsRatioLab() {
  const [beta, setBeta] = useState(0.76); // ~ the loan model's "prior defaults" coef
  const [baseP, setBaseP] = useState(0.2); // starting probability of the event

  const or = Math.exp(beta);
  // apply +1 unit of the feature: add beta to the log-odds
  const newP = sig(logit(baseP) + beta);

  // sigmoid curve of P vs (feature units added), centred so 0 = base
  const z0 = logit(baseP);
  const xToPx = (u: number) => PAD.l + ((u + 4) / 8) * (VW - PAD.l - PAD.r);
  const yToPx = (p: number) => VH - PAD.b - p * (VH - PAD.t - PAD.b);
  const curve = Array.from({ length: 161 }, (_, i) => {
    const u = -4 + (i / 160) * 8;
    return `${xToPx(u)},${yToPx(sig(z0 + beta * u))}`;
  }).join(" ");

  return (
    <div style={frame}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6, flexWrap: "wrap", gap: 8 }}>
        <span className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
          One coefficient, in odds and in probability
        </span>
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>curve: risk as you add units of the feature</span>
      </div>

      <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <rect x={PAD.l} y={PAD.t} width={VW - PAD.l - PAD.r} height={VH - PAD.t - PAD.b} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        {[0, 0.5, 1].map((p) => (
          <g key={p}>
            <line x1={PAD.l} y1={yToPx(p)} x2={VW - PAD.r} y2={yToPx(p)} stroke="var(--border)" strokeDasharray="4 5" strokeOpacity={0.6} />
            <text x={PAD.l - 6} y={yToPx(p) + 4} fontSize={10} fill="var(--faint)" textAnchor="end">{p}</text>
          </g>
        ))}
        {/* zero line (base point) */}
        <line x1={xToPx(0)} y1={PAD.t} x2={xToPx(0)} y2={VH - PAD.b} stroke="var(--border-strong)" strokeDasharray="3 4" />
        <text x={xToPx(0)} y={VH - PAD.b + 16} fontSize={10} fill="var(--faint)" textAnchor="middle">base</text>
        <text x={xToPx(2)} y={VH - PAD.b + 16} fontSize={10} fill="var(--faint)" textAnchor="middle">+2 units</text>
        <text x={xToPx(-2)} y={VH - PAD.b + 16} fontSize={10} fill="var(--faint)" textAnchor="middle">−2 units</text>

        <polyline points={curve} fill="none" stroke={ACCENT} strokeWidth={2.5} />

        {/* base point and +1 unit point */}
        <circle cx={xToPx(0)} cy={yToPx(baseP)} r={6} fill="var(--surface)" stroke="var(--ink)" strokeWidth={2.5} />
        <circle cx={xToPx(1)} cy={yToPx(newP)} r={6} fill={ACCENT} stroke="var(--surface)" strokeWidth={2} />
        {/* connector showing the jump */}
        <line x1={xToPx(1)} y1={yToPx(baseP)} x2={xToPx(1)} y2={yToPx(newP)} stroke="var(--brand-2)" strokeWidth={1.6} />
        <text x={xToPx(1) + 8} y={yToPx((baseP + newP) / 2) + 3} fontSize={10.5} fill="var(--brand-2)" fontWeight={600}>
          +{((newP - baseP) * 100).toFixed(0)} pts
        </text>
      </svg>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 18px", marginTop: 12 }}>
        <label style={sliderLabel}>
          <span style={{ minWidth: 128 }}>coefficient β = <b style={{ color: "var(--ink)" }}>{beta.toFixed(2)}</b></span>
          <input type="range" min={-1.5} max={2} step={0.01} value={beta} onChange={(e) => setBeta(Number(e.target.value))} style={{ flex: 1, accentColor: ACCENT }} aria-label="Coefficient beta" />
        </label>
        <label style={sliderLabel}>
          <span style={{ minWidth: 128 }}>base risk = <b style={{ color: "var(--ink)" }}>{(baseP * 100).toFixed(0)}%</b></span>
          <input type="range" min={0.02} max={0.98} step={0.01} value={baseP} onChange={(e) => setBaseP(Number(e.target.value))} style={{ flex: 1, accentColor: ACCENT }} aria-label="Base risk" />
        </label>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12, alignItems: "center" }}>
        <Metric label="odds ratio e^β" value={or.toFixed(2) + "×"} />
        <Metric label="base risk → +1 unit" value={`${(baseP * 100).toFixed(0)}% → ${(newP * 100).toFixed(0)}%`} />
        <div style={{ flex: 1 }} />
        <button style={btnGhost} onClick={() => { setBeta(0.76); setBaseP(0.2); }}>Reset</button>
      </div>

      <div style={{ marginTop: 10, padding: "9px 12px", borderRadius: 9, fontSize: 12.5, lineHeight: 1.55, color: "var(--muted)", background: `color-mix(in srgb, ${ACCENT} 5%, var(--surface))`, border: `1px solid color-mix(in srgb, ${ACCENT} 20%, var(--border))` }}>
        Adding one unit of this feature multiplies the <b style={{ color: "var(--ink)" }}>odds</b> by{" "}
        <b style={{ color: "var(--ink)" }}>{or.toFixed(2)}</b> — always, at every base risk. But that same
        multiplier moves a {(baseP * 100).toFixed(0)}% case to {(newP * 100).toFixed(0)}%. Drag the base
        risk to a value near 50% and back to feel how the <em>probability</em> jump changes while the odds
        ratio never does.
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "var(--surface-2)", borderRadius: 9, padding: "6px 11px" }}>
      <div style={{ fontSize: 10, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 500, color: "var(--ink)", fontFamily: "var(--font-geist-mono, monospace)" }}>{value}</div>
    </div>
  );
}

const frame: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border-strong)",
  borderRadius: 14,
  padding: "16px 16px 14px",
};
const sliderLabel: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "var(--muted)",
};
const btnGhost: React.CSSProperties = {
  background: "transparent", color: "var(--muted)", border: "1px solid var(--border-strong)",
  borderRadius: 8, padding: "7px 13px", fontSize: 12.5, cursor: "pointer",
};
