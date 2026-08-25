"use client";

import { useEffect, useMemo, useRef, useState } from "react";

// The Rayleigh quotient made visible. For a fixed covariance Σ, the variance in
// direction v (a unit vector) is the quadratic form vᵀΣv. Sweep v around the
// circle and that value traces a smooth two-lobed "variance rose": it peaks at
// the top eigenvector (value = λ₁) and bottoms at the one orthogonal to it
// (value = λ₂). PCA is nothing more than finding where this rose is largest.

// fixed covariance
const A = 3.0, B = 1.1, C = 1.2; // [[A,B],[B,C]]
function eig() {
  const tr = A + C, d = Math.sqrt(((A - C) / 2) ** 2 + B * B);
  return { l1: tr / 2 + d, l2: tr / 2 - d, ang: 0.5 * Math.atan2(2 * B, A - C) };
}
const quad = (t: number) => {
  const cx = Math.cos(t), sy = Math.sin(t);
  return A * cx * cx + 2 * B * cx * sy + C * sy * sy;
};

const VW = 360, VH = 360, CX = VW / 2, CY = VH / 2;

export function RayleighLab() {
  const { l1, l2, ang } = useMemo(eig, []);
  const [theta, setTheta] = useState(0);
  const [drag, setDrag] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const dim = "var(--c-dimred)";

  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => {
      const svg = svgRef.current; if (!svg) return;
      const r = svg.getBoundingClientRect();
      const px = ((e.clientX - r.left) / r.width) * VW, py = ((e.clientY - r.top) / r.height) * VH;
      setTheta(Math.atan2(-(py - CY), px - CX));
    };
    const up = () => setDrag(false);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, [drag]);

  const ROSE = 30; // px per unit of variance
  const f = (n: number) => n.toFixed(1);
  // polar rose path
  const rose = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i <= 120; i++) {
      const t = (i / 120) * 2 * Math.PI, r = quad(t) * ROSE;
      pts.push(`${(CX + Math.cos(t) * r).toFixed(1)},${(CY - Math.sin(t) * r).toFixed(1)}`);
    }
    return pts.join(" ");
  }, []);

  const val = quad(theta);
  const ux = Math.cos(theta), uy = Math.sin(theta);
  const R = val * ROSE;
  // eigenvector markers
  const e1 = { x: CX + Math.cos(ang) * l1 * ROSE, y: CY - Math.sin(ang) * l1 * ROSE };
  const e2 = { x: CX + Math.cos(ang + Math.PI / 2) * l2 * ROSE, y: CY - Math.sin(ang + Math.PI / 2) * l2 * ROSE };

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.6rem 0" }} className="not-prose">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
          The variance rose: vᵀΣv as v sweeps the circle
        </span>
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>drag the arrow ●</span>
      </div>

      <svg ref={svgRef} viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", maxWidth: 340, height: "auto", display: "block", margin: "0 auto", touchAction: "none" }}>
        <rect x={1} y={1} width={VW - 2} height={VH - 2} rx={10} fill="var(--canvas)" stroke="var(--border-strong)" />
        {/* the rose */}
        <polygon points={rose} fill={`color-mix(in srgb, ${dim} 10%, transparent)`} stroke={dim} strokeWidth={1.6} />
        {/* eigenvector directions */}
        <line x1={CX} y1={CY} x2={f(e1.x)} y2={f(e1.y)} stroke="var(--ink)" strokeWidth={1.5} strokeDasharray="4 3" />
        <line x1={CX} y1={CY} x2={f(e2.x)} y2={f(e2.y)} stroke="var(--brand-3)" strokeWidth={1.5} strokeDasharray="4 3" />
        <text x={f(e1.x)} y={f(e1.y - 6)} fontSize={10.5} fill="var(--ink)" textAnchor="middle">λ₁ = {l1.toFixed(2)}</text>
        <text x={f(e2.x + 4)} y={f(e2.y)} fontSize={10.5} fill="var(--brand-3)">λ₂ = {l2.toFixed(2)}</text>

        {/* current direction arrow */}
        <line x1={CX} y1={CY} x2={f(CX + ux * R)} y2={f(CY - uy * R)} stroke="var(--brand)" strokeWidth={2.6} strokeLinecap="round" />
        <circle cx={f(CX + ux * R)} cy={f(CY - uy * R)} r={7} fill="var(--surface)" stroke="var(--brand)" strokeWidth={2.4} pointerEvents="none" />
        <circle cx={f(CX + ux * R)} cy={f(CY - uy * R)} r={22} fill="transparent" style={{ cursor: "grab" }}
          role="slider" aria-label="direction" tabIndex={0}
          onPointerDown={(e) => { e.preventDefault(); setDrag(true); }}
          onKeyDown={(e) => { if (e.key === "ArrowLeft") setTheta((t) => t + 0.05); if (e.key === "ArrowRight") setTheta((t) => t - 0.05); }} />
      </svg>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12, justifyContent: "center" }}>
        <Metric label="variance here vᵀΣv" value={val.toFixed(2)} accent="var(--brand)" />
        <Metric label="maximum (λ₁)" value={l1.toFixed(2)} accent="var(--ink)" />
        <Metric label="minimum (λ₂)" value={l2.toFixed(2)} accent="var(--brand-3)" />
      </div>
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{ background: "var(--surface-2)", borderRadius: 10, padding: "7px 11px", minWidth: 110 }}>
      <div style={{ fontSize: 10.5, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontSize: 17, fontWeight: 500, color: accent ?? "var(--ink)" }}>{value}</div>
    </div>
  );
}
