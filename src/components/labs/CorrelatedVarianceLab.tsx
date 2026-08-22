"use client";

import { useState } from "react";

// The exact variance of an average of B identically-distributed predictors, each
// with variance σ²=1 and pairwise correlation ρ:
//     Var(mean) = ρ·σ² + (1−ρ)/B · σ²
// Drag B: the (1−ρ)/B term melts toward zero, but the curve flattens onto a
// FLOOR at ρ that averaging can never breach. Drag ρ: only lowering the
// correlation lowers that floor. This is why a forest bothers to decorrelate its
// trees — bagging alone (high ρ) leaves a big floor; the random-feature trick
// pushes ρ down and lets averaging reach lower.
//
// Purely analytic (no data), fully deterministic → SSR-safe.

const CW = 400, CH = 210, PADX = 40, PADY = 22;
const MAXB = 100;
const fx = (b: number) => Math.round((PADX + (b - 1) / (MAXB - 1) * (CW - PADX - 14)) * 100) / 100;
const fy = (v: number) => Math.round((CH - PADY - v * (CH - 2 * PADY)) * 100) / 100;

export function CorrelatedVarianceLab() {
  const [rho, setRho] = useState(0.5);
  const [nB, setNB] = useState(10);

  const variance = (b: number) => rho + (1 - rho) / b;
  const cur = variance(nB);
  const removed = 1 - cur; // fraction of single-predictor variance removed

  const curve: string[] = [];
  for (let b = 1; b <= MAXB; b++) curve.push(`${fx(b)},${fy(variance(b))}`);

  return (
    <div style={{ background: "var(--canvas)", border: "1px solid var(--border-strong)", borderRadius: 14, padding: "16px 16px 14px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "flex-start" }}>
        <div style={{ flex: "1 1 320px", minWidth: 280 }}>
          <svg viewBox={`0 0 ${CW} ${CH}`} width="100%" style={{ display: "block" }} role="img" aria-label="Variance of an averaged ensemble versus the number of predictors">
            {/* axes */}
            <line x1={PADX} y1={CH - PADY} x2={CW - 14} y2={CH - PADY} stroke="var(--border-strong)" strokeWidth={1} />
            <line x1={PADX} y1={PADY - 6} x2={PADX} y2={CH - PADY} stroke="var(--border-strong)" strokeWidth={1} />
            {/* y ticks 0 and 1 */}
            <text x={PADX - 6} y={fy(1) + 3} fontSize={9.5} textAnchor="end" fill="var(--faint)">1</text>
            <text x={PADX - 6} y={fy(0) + 3} fontSize={9.5} textAnchor="end" fill="var(--faint)">0</text>
            {/* correlation floor */}
            <line x1={PADX} y1={fy(rho)} x2={CW - 14} y2={fy(rho)} stroke="var(--brand-2)" strokeWidth={1.25} strokeDasharray="4 4" />
            <text x={CW - 16} y={fy(rho) - 4} fontSize={9.5} textAnchor="end" fill="var(--brand-2)">floor = ρ = {rho.toFixed(2)}</text>
            {/* variance curve */}
            <polyline points={curve.join(" ")} fill="none" stroke="var(--c-trees)" strokeWidth={2.25} />
            {/* current B marker */}
            <line x1={fx(nB)} y1={PADY - 6} x2={fx(nB)} y2={CH - PADY} stroke="var(--ink)" strokeWidth={1} strokeDasharray="3 3" />
            <circle cx={fx(nB)} cy={fy(cur)} r={4} fill="var(--c-trees)" />
            <text x={CW / 2} y={CH - 4} fontSize={10} textAnchor="middle" fill="var(--faint)">number of trees B →</text>
            <text x={12} y={CH / 2} fontSize={10} textAnchor="middle" fill="var(--faint)" transform={`rotate(-90 12 ${CH / 2})`}>ensemble variance</text>
          </svg>
        </div>

        <div style={{ flex: "1 1 200px", minWidth: 200 }}>
          <label style={{ fontSize: 12.5, color: "var(--muted)", display: "block", marginBottom: 4 }}>
            Tree correlation ρ = <strong style={{ color: "var(--ink)" }}>{rho.toFixed(2)}</strong>
          </label>
          <input type="range" min={0} max={0.95} step={0.05} value={rho} onChange={(e) => setRho(Number(e.target.value))} style={{ width: "100%", accentColor: "var(--brand-2)" }} />
          <label style={{ fontSize: 12.5, color: "var(--muted)", display: "block", margin: "12px 0 4px" }}>
            Number of trees B = <strong style={{ color: "var(--ink)" }}>{nB}</strong>
          </label>
          <input type="range" min={1} max={MAXB} step={1} value={nB} onChange={(e) => setNB(Number(e.target.value))} style={{ width: "100%", accentColor: "var(--c-trees)" }} />

          <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
            <Row label="Ensemble variance" value={cur.toFixed(3)} />
            <Row label="Variance removed" value={`${(removed * 100).toFixed(0)}%`} strong />
            <Row label="Floor (B → ∞)" value={rho.toFixed(3)} />
          </div>
          <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.55, marginTop: 12 }}>
            {rho <= 0.05
              ? "Near-zero correlation: averaging drives variance almost to zero. This is the dream."
              : "Push B high and the variance stalls at ρ — the only way lower is to decorrelate the trees (drop ρ)."}
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 13 }}>
      <span style={{ color: "var(--muted)" }}>{label}</span>
      <span className="font-display" style={{ fontWeight: 600, color: strong ? "var(--c-trees)" : "var(--ink)" }}>{value}</span>
    </div>
  );
}
