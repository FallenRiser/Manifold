"use client";

import { useState } from "react";

// The covariance matrix IS an ellipse, and PCA's components are its axes. Drag
// the two standard deviations and the correlation; the 1σ/2σ ellipse re-orients,
// the live 2×2 covariance matrix updates, and the two eigenvectors (drawn as the
// ellipse's major/minor axes) track it. Crank correlation toward ±1 and the
// ellipse collapses to a line — the second eigenvalue heads for zero, which is
// exactly the redundant direction PCA throws away.

const VW = 380, VH = 380;
const CX = VW / 2, CY = VH / 2;
const SC = 34; // px per data unit

// eigen-decomposition of [[a,b],[b,c]]
function eig(a: number, b: number, c: number) {
  const tr = a + c, d = Math.sqrt(((a - c) / 2) ** 2 + b * b);
  const l1 = tr / 2 + d, l2 = tr / 2 - d;
  const ang = 0.5 * Math.atan2(2 * b, a - c); // radians, major axis
  return { l1, l2, ang };
}

export function CovarianceEllipseLab() {
  const [sx, setSx] = useState(2.4);
  const [sy, setSy] = useState(1.2);
  const [rho, setRho] = useState(0.6);
  const dim = "var(--c-dimred)";

  const a = sx * sx, c = sy * sy, b = rho * sx * sy;
  const { l1, l2, ang } = eig(a, b, c);
  const deg = (ang * 180) / Math.PI;
  const r1 = Math.sqrt(Math.max(l1, 0)) * SC;
  const r2 = Math.sqrt(Math.max(l2, 0)) * SC;
  // eigenvector endpoints (major/minor), length = sqrt(eigenvalue)
  const ux = Math.cos(ang), uy = Math.sin(ang);
  const vx = -Math.sin(ang), vy = Math.cos(ang);
  const f = (n: number) => n.toFixed(2);
  const totVar = a + c;

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.6rem 0" }} className="not-prose">
      <div className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", marginBottom: 10 }}>
        The covariance ellipse and its axes
      </div>

      <div style={{ display: "flex", gap: 18, flexWrap: "wrap", alignItems: "flex-start" }}>
        <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", maxWidth: 340, height: "auto", display: "block" }}>
          <rect x={1} y={1} width={VW - 2} height={VH - 2} rx={10} fill="var(--canvas)" stroke="var(--border-strong)" />
          <line x1={CX} y1={10} x2={CX} y2={VH - 10} stroke="var(--border)" strokeWidth={1} />
          <line x1={10} y1={CY} x2={VW - 10} y2={CY} stroke="var(--border)" strokeWidth={1} />

          {/* 2σ then 1σ ellipse */}
          <ellipse cx={CX} cy={CY} rx={f(2 * r1)} ry={f(2 * r2)} transform={`rotate(${f(-deg)} ${CX} ${CY})`}
            fill={`color-mix(in srgb, ${dim} 8%, transparent)`} stroke={dim} strokeOpacity={0.4} strokeWidth={1.2} />
          <ellipse cx={CX} cy={CY} rx={f(r1)} ry={f(r2)} transform={`rotate(${f(-deg)} ${CX} ${CY})`}
            fill={`color-mix(in srgb, ${dim} 16%, transparent)`} stroke={dim} strokeWidth={1.8} />

          {/* eigenvector axes */}
          <line x1={CX} y1={CY} x2={f(CX + ux * r1)} y2={f(CY - uy * r1)} stroke="var(--ink)" strokeWidth={2.4} />
          <line x1={CX} y1={CY} x2={f(CX + vx * r2)} y2={f(CY - vy * r2)} stroke="var(--brand-3)" strokeWidth={2.4} />
          <circle cx={f(CX + ux * r1)} cy={f(CY - uy * r1)} r={4} fill="var(--ink)" />
          <circle cx={f(CX + vx * r2)} cy={f(CY - vy * r2)} r={4} fill="var(--brand-3)" />
          <text x={f(CX + ux * r1 + 6)} y={f(CY - uy * r1)} fontSize={11} fill="var(--ink)">PC1</text>
          <text x={f(CX + vx * r2 + 6)} y={f(CY - vy * r2)} fontSize={11} fill="var(--brand-3)">PC2</text>
        </svg>

        <div style={{ flex: 1, minWidth: 190 }}>
          {/* live covariance matrix */}
          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>covariance matrix</div>
          <div style={{ display: "inline-flex", alignItems: "stretch", gap: 6, fontFamily: "var(--font-geist-mono, monospace)", fontSize: 14, color: "var(--ink)", background: "var(--surface-2)", borderRadius: 8, padding: "8px 12px" }}>
            <div style={{ borderLeft: "2px solid var(--border-strong)", borderTop: "2px solid var(--border-strong)", borderBottom: "2px solid var(--border-strong)", width: 4 }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 14px", textAlign: "right" }}>
              <span>{f(a)}</span><span>{f(b)}</span>
              <span>{f(b)}</span><span>{f(c)}</span>
            </div>
            <div style={{ borderRight: "2px solid var(--border-strong)", borderTop: "2px solid var(--border-strong)", borderBottom: "2px solid var(--border-strong)", width: 4 }} />
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
            <Mini label="λ₁ (PC1 var)" value={f(l1)} accent="var(--ink)" />
            <Mini label="λ₂ (PC2 var)" value={f(l2)} accent="var(--brand-3)" />
            <Mini label="PC1 share" value={`${((l1 / totVar) * 100).toFixed(0)}%`} accent={dim} />
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginTop: 14 }}>
        <Slider label={`σₓ = ${sx.toFixed(1)}`} min={0.4} max={3.2} step={0.1} value={sx} onChange={setSx} accent={dim} />
        <Slider label={`σᵧ = ${sy.toFixed(1)}`} min={0.4} max={3.2} step={0.1} value={sy} onChange={setSy} accent={dim} />
        <Slider label={`correlation ρ = ${rho.toFixed(2)}`} min={-0.95} max={0.95} step={0.05} value={rho} onChange={setRho} accent={dim} />
      </div>
    </div>
  );
}

function Mini({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{ background: "var(--surface-2)", borderRadius: 10, padding: "6px 10px" }}>
      <div style={{ fontSize: 10, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 500, color: accent ?? "var(--ink)" }}>{value}</div>
    </div>
  );
}

function Slider({ label, min, max, step, value, onChange, accent }: { label: string; min: number; max: number; step: number; value: number; onChange: (v: number) => void; accent: string }) {
  return (
    <label style={{ fontSize: 12.5, color: "var(--muted)", display: "block" }}>
      {label}
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ width: "100%", accentColor: accent, marginTop: 4 }} />
    </label>
  );
}
