"use client";
import { useState } from "react";

const RAW: [number, number][] = [
  [1, 5.5], [2, 5.0], [3, 6.4], [4, 6.0], [5, 7.1], [6, 7.6],
  [7, 7.2], [8, 8.6], [9, 8.9], [10, 9.3], [11, 10.4], [12, 10.1],
];
const OLS_M = 0.483, OLS_B = 4.535;

const W = 320, H = 250;
const X0 = 36, X1 = 294, Y0 = 222, Y1 = 18;
const px = (x: number) => X0 + ((x - 0.5) / 12.5) * (X1 - X0);
const py = (y: number) => Y0 - ((y - 3) / 9) * (Y0 - Y1);

export function ResidualsLab() {
  const [showRes, setShowRes] = useState(true);

  const residuals = RAW.map(([x, y]) => {
    const pred = OLS_M * x + OLS_B;
    return { x, y, pred, e: y - pred };
  });

  const sumE = residuals.reduce((s, r) => s + r.e, 0);

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.6rem 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
          The gap between prediction and reality
        </span>
        <button onClick={() => setShowRes(s => !s)} style={btnGhost}>
          {showRes ? "Hide residuals" : "Show residuals"}
        </button>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block", marginBottom: 12 }}>
        <rect x={X0} y={Y1} width={X1 - X0} height={Y0 - Y1} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />

        {/* regression line */}
        <line x1={px(0.5)} y1={py(OLS_M * 0.5 + OLS_B)} x2={px(12.5)} y2={py(OLS_M * 12.5 + OLS_B)}
          stroke="var(--c-regression)" strokeWidth={2.2} strokeLinecap="round" />

        {/* residual lines */}
        {showRes && residuals.map((r, i) => (
          <line key={i}
            x1={px(r.x)} y1={py(r.y)}
            x2={px(r.x)} y2={py(r.pred)}
            stroke={r.e > 0.02 ? "var(--good)" : r.e < -0.02 ? "var(--bad)" : "var(--muted)"}
            strokeWidth={2} strokeLinecap="round"
          />
        ))}

        {/* data points on top */}
        {residuals.map((r, i) => (
          <circle key={i} cx={px(r.x)} cy={py(r.y)} r={4.5} fill="var(--ink)" fillOpacity={0.78} />
        ))}

        {/* residual labels — offset to avoid overlap */}
        {showRes && residuals.map((r, i) => {
          const mid = (py(r.y) + py(r.pred)) / 2;
          const label = (r.e > 0 ? "+" : "") + r.e.toFixed(2);
          return (
            <text key={i} x={px(r.x) + 7} y={mid} fontSize={8.5}
              fill={r.e > 0.02 ? "var(--good)" : r.e < -0.02 ? "var(--bad)" : "var(--muted)"}
              dominantBaseline="middle">{label}</text>
          );
        })}

        <text x={(X0 + X1) / 2} y={H - 4} fontSize={10.5} fill="var(--faint)" textAnchor="middle">x →</text>
        <text x={10} y={(Y0 + Y1) / 2} fontSize={10.5} fill="var(--faint)" textAnchor="middle"
          transform={`rotate(-90 10 ${(Y0 + Y1) / 2})`}>y →</text>
      </svg>

      {showRes && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12.5 }}>
            <span style={{ width: 14, height: 3, background: "var(--good)", borderRadius: 2, display: "inline-block" }} />
            <span style={{ color: "var(--muted)" }}>above the line (eᵢ &gt; 0)</span>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12.5 }}>
            <span style={{ width: 14, height: 3, background: "var(--bad)", borderRadius: 2, display: "inline-block" }} />
            <span style={{ color: "var(--muted)" }}>below the line (eᵢ &lt; 0)</span>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ background: "var(--surface-2)", borderRadius: 9, padding: "6px 12px" }}>
            <div style={{ fontSize: 10, color: "var(--muted)" }}>Σeᵢ (they cancel)</div>
            <div style={{ fontSize: 15, fontWeight: 500, color: "var(--ink)" }}>{sumE.toFixed(3)}</div>
          </div>
        </div>
      )}
    </div>
  );
}

const btnGhost: React.CSSProperties = { background: "transparent", color: "var(--muted)", border: "1px solid var(--border-strong)", fontSize: 13, padding: "7px 12px", borderRadius: 10, cursor: "pointer" };
