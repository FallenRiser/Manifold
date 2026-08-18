"use client";

import { useState } from "react";

// A fixed smooth target sampled at `knots` points and connected piecewise. It shows
// the spline idea directly: more knots → the local pieces hug the curve, and each
// piece governs only its own interval. Straight segments (a linear/order-1 spline)
// keep it honest and self-contained; real cubic splines smooth the joins.
const ACCENT = "var(--c-regression)";

function target(t: number) {
  return 0.5 + 0.32 * Math.sin(6.1 * t) - 0.18 * Math.cos(2.7 * t + 0.6) - 0.1 * t;
}

export function SplineKnotsLab() {
  const [knots, setKnots] = useState(4);
  const W = 560, H = 240, PAD = 28;
  // round to 2dp so the SSR string and the client string match exactly —
  // sin/cos can differ in the last ULP across environments and trip hydration.
  const xToPx = (t: number) => (PAD + t * (W - 2 * PAD)).toFixed(2);
  const yToPx = (v: number) => (H - PAD - v * (H - 2 * PAD)).toFixed(2);

  const dense = Array.from({ length: 161 }, (_, i) => {
    const t = i / 160;
    return `${xToPx(t)},${yToPx(target(t))}`;
  }).join(" ");

  const knotTs = Array.from({ length: knots + 1 }, (_, i) => i / knots);
  const fit = knotTs.map((t) => `${xToPx(t)},${yToPx(target(t))}`).join(" ");

  return (
    <div style={frame}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6, flexWrap: "wrap", gap: 8 }}>
        <span className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
          Piecewise pieces, joined at knots
        </span>
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>faint: true curve · bold: the spline · ticks: knots</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <rect x={PAD} y={PAD} width={W - 2 * PAD} height={H - 2 * PAD} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        <polyline points={dense} fill="none" stroke="var(--faint)" strokeWidth={2} strokeDasharray="5 5" />
        {knotTs.map((t, i) => (
          <line key={i} x1={xToPx(t)} y1={PAD} x2={xToPx(t)} y2={H - PAD} stroke="var(--border)" strokeOpacity={0.7} strokeDasharray="2 4" />
        ))}
        <polyline points={fit} fill="none" stroke={ACCENT} strokeWidth={2.6} />
        {knotTs.map((t, i) => (
          <circle key={i} cx={xToPx(t)} cy={yToPx(target(t))} r={4} fill={ACCENT} stroke="var(--surface)" strokeWidth={1.5} />
        ))}
      </svg>
      <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "var(--muted)", marginTop: 10 }}>
        <span style={{ minWidth: 132 }}>pieces (knots): <b style={{ color: "var(--ink)" }}>{knots}</b></span>
        <input type="range" min={1} max={14} step={1} value={knots} onChange={(e) => setKnots(Number(e.target.value))} style={{ flex: 1, accentColor: ACCENT }} aria-label="Number of spline knots" />
      </label>
      <div style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.5, marginTop: 8 }}>
        Each segment is a low-degree polynomial on its own interval. Add knots and the pieces hug the curve
        locally — and no segment ever swings off to infinity the way a single high-degree polynomial does.
      </div>
    </div>
  );
}

const frame: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border-strong)",
  borderRadius: 14,
  padding: "16px 16px 14px",
};
