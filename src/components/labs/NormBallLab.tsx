"use client";

import { useMemo, useState } from "react";

// "Distance" isn't one thing. The p-norm ‖x‖_p = (Σ|xᵢ|^p)^{1/p} gives a whole
// family: p=1 is a diamond (taxicab), p=2 the familiar circle (Euclidean),
// p→∞ a square (max coordinate). Slide p and watch the unit ball — the set of
// points at distance 1 — morph. The norm of the sample point updates live.

const VW = 340, VH = 340, CX = 170, CY = 170, SC = 110; // px per unit

function ballPath(p: number) {
  // trace {x : ||x||_p = 1} by angle-sweeping radius r(θ)
  const pts: string[] = [];
  for (let i = 0; i <= 180; i++) {
    const t = (i / 180) * 2 * Math.PI;
    const ct = Math.cos(t), st = Math.sin(t);
    const denom = Math.pow(Math.abs(ct) ** p + Math.abs(st) ** p, 1 / p);
    const r = 1 / denom;
    pts.push(`${(CX + ct * r * SC).toFixed(1)},${(CY - st * r * SC).toFixed(1)}`);
  }
  return pts.join(" ");
}

export function NormBallLab() {
  const [p, setP] = useState(2);
  const amber = "var(--c-fundamentals)";
  const path = useMemo(() => ballPath(p), [p]);
  const pt: [number, number] = [0.7, 0.55];
  const norm = Math.pow(Math.abs(pt[0]) ** p + Math.abs(pt[1]) ** p, 1 / p);
  const pName = p <= 1.05 ? "L1 · taxicab" : p >= 6 ? "L∞ · max (Chebyshev)" : Math.abs(p - 2) < 0.05 ? "L2 · Euclidean" : `L${p.toFixed(1)}`;

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.6rem 0" }} className="not-prose">
      <div className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", marginBottom: 8 }}>The unit ball of the p-norm</div>
      <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", maxWidth: 320, height: "auto", display: "block", margin: "0 auto" }}>
        <rect x={1} y={1} width={VW - 2} height={VH - 2} rx={10} fill="var(--canvas)" stroke="var(--border-strong)" />
        <line x1={0} y1={CY} x2={VW} y2={CY} stroke="var(--border)" strokeWidth={1} />
        <line x1={CX} y1={0} x2={CX} y2={VH} stroke="var(--border)" strokeWidth={1} />
        <polygon points={path} fill={`color-mix(in srgb, ${amber} 12%, transparent)`} stroke={amber} strokeWidth={2.2} />
        {/* the sample point + its position vector */}
        <line x1={CX} y1={CY} x2={CX + pt[0] * SC} y2={CY - pt[1] * SC} stroke="var(--ink)" strokeWidth={2} />
        <circle cx={CX + pt[0] * SC} cy={CY - pt[1] * SC} r={4.5} fill="var(--ink)" />
        <text x={CX + pt[0] * SC + 6} y={CY - pt[1] * SC} fontSize={11} fill="var(--muted)">(0.7, 0.55)</text>
      </svg>
      <div style={{ marginTop: 10 }}>
        <label style={{ fontSize: 12.5, color: "var(--muted)", display: "block" }}>
          p = {p.toFixed(1)} &nbsp;({pName})
          <input type="range" min={1} max={8} step={0.1} value={p} onChange={(e) => setP(Number(e.target.value))} style={{ width: "100%", accentColor: amber, marginTop: 4 }} />
        </label>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
        <Metric label="‖(0.7, 0.55)‖ₚ" value={norm.toFixed(3)} accent={amber} />
        <Metric label="shape" value={p <= 1.05 ? "diamond" : p >= 6 ? "square" : p < 2 ? "pinched" : "rounded"} />
      </div>
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{ background: "var(--surface-2)", borderRadius: 10, padding: "6px 10px", minWidth: 90 }}>
      <div style={{ fontSize: 10.5, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 500, color: accent ?? "var(--ink)" }}>{value}</div>
    </div>
  );
}
