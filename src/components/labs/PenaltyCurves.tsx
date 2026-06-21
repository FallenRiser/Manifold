"use client";

import { useState } from "react";

const VW = 460, VH = 250;
const X0 = 42, X1 = 444, Y0 = 210, Y1 = 20;
const exToPx = (e: number) => X0 + ((e + 3) / 6) * (X1 - X0);
const pToPy = (p: number) => Y0 - (Math.min(p, 9) / 9) * (Y0 - Y1);

const absPts = [-3, 0, 3].map((e) => `${exToPx(e)},${pToPy(Math.abs(e))}`).join(" ");
const sqPts: string[] = [];
for (let e = -3; e <= 3.0001; e += 0.2) sqPts.push(`${exToPx(e).toFixed(1)},${pToPy(e * e).toFixed(1)}`);

export function PenaltyCurves() {
  const [r, setR] = useState(1.6);
  const lin = r;
  const sq = r * r;

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.6rem 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
          How much does one mistake cost?
        </span>
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>slide the error size</span>
      </div>

      <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <rect x={X0} y={Y1} width={X1 - X0} height={Y0 - Y1} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        <line x1={exToPx(0)} y1={Y1} x2={exToPx(0)} y2={Y0} stroke="var(--border)" />
        {/* curves */}
        <polyline points={sqPts.join(" ")} fill="none" stroke="var(--brand)" strokeWidth={2.5} />
        <polyline points={absPts} fill="none" stroke="var(--c-clustering)" strokeWidth={2.5} />
        {/* marker */}
        <line x1={exToPx(r)} y1={Y1} x2={exToPx(r)} y2={Y0} stroke="var(--faint)" strokeDasharray="3 3" />
        <circle cx={exToPx(r)} cy={pToPy(lin)} r={4.5} fill="var(--c-clustering)" />
        <circle cx={exToPx(r)} cy={pToPy(sq)} r={4.5} fill="var(--brand)" />
        <text x={(X0 + X1) / 2} y={VH - 6} fontSize={11} fill="var(--faint)" textAnchor="middle">how wrong (residual)</text>
      </svg>

      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "8px 0 12px" }}>
        <span style={{ fontSize: 12.5, color: "var(--muted)", whiteSpace: "nowrap" }}>Error size</span>
        <input type="range" min={0} max={3} step={0.1} value={r} onChange={(e) => setR(parseFloat(e.target.value))} style={{ flex: 1 }} />
        <span style={{ fontSize: 12.5, fontWeight: 500, minWidth: 28, textAlign: "right" }}>{r.toFixed(1)}</span>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1, background: "color-mix(in srgb, var(--c-clustering) 10%, var(--surface))", borderRadius: 10, padding: "9px 11px" }}>
          <div style={{ fontSize: 11, color: "var(--c-clustering)" }}>absolute error · |e|</div>
          <div style={{ fontSize: 19, fontWeight: 500, color: "var(--ink)" }}>{lin.toFixed(2)}</div>
        </div>
        <div style={{ flex: 1, background: "color-mix(in srgb, var(--brand) 10%, var(--surface))", borderRadius: 10, padding: "9px 11px" }}>
          <div style={{ fontSize: 11, color: "var(--brand)" }}>squared error · e²</div>
          <div style={{ fontSize: 19, fontWeight: 500, color: "var(--ink)" }}>{sq.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}
