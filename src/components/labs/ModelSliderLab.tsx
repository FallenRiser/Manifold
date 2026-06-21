"use client";
import { useState } from "react";

const RAW: [number, number][] = [
  [1, 5.5], [2, 5.0], [3, 6.4], [4, 6.0], [5, 7.1], [6, 7.6],
  [7, 7.2], [8, 8.6], [9, 8.9], [10, 9.3], [11, 10.4], [12, 10.1],
];

// OLS on raw (non-standardised) x
const OLS_M = 0.483;
const OLS_B = 4.535;

const W = 320, H = 252;
const X0 = 36, X1 = 294, Y0 = 224, Y1 = 18;
const px = (x: number) => X0 + ((x - 0.5) / 12.5) * (X1 - X0);
const py = (y: number) => Y0 - ((y - 3) / 9) * (Y0 - Y1);

function mse(m: number, b: number) {
  return RAW.reduce((s, [x, y]) => s + (m * x + b - y) ** 2, 0) / RAW.length;
}

export function ModelSliderLab() {
  const [m, setM] = useState(0.8);
  const [b, setB] = useState(5.5);

  const predX = 6.5;
  const predY = m * predX + b;

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.6rem 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
        <span className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
          Tune the model
        </span>
        <code style={{ fontSize: 14, color: "var(--brand)", background: "var(--surface-2)", padding: "3px 10px", borderRadius: 8 }}>
          ŷ = {m.toFixed(2)}x {b >= 0 ? "+" : "−"} {Math.abs(b).toFixed(1)}
        </code>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block", marginBottom: 10 }}>
        <rect x={X0} y={Y1} width={X1 - X0} height={Y0 - Y1} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />

        {/* ghost: best fit line */}
        <line x1={px(0.5)} y1={py(OLS_M * 0.5 + OLS_B)} x2={px(12.5)} y2={py(OLS_M * 12.5 + OLS_B)}
          stroke="var(--good)" strokeWidth={1.3} strokeOpacity={0.4} strokeDasharray="4 3" />
        <text x={X1 - 5} y={py(OLS_M * 12.5 + OLS_B) - 5} fontSize={9.5} fill="var(--good)" fillOpacity={0.55} textAnchor="end">best fit</text>

        {/* user line */}
        <line x1={px(0.5)} y1={py(m * 0.5 + b)} x2={px(12.5)} y2={py(m * 12.5 + b)}
          stroke="var(--c-regression)" strokeWidth={2.2} strokeLinecap="round" />

        {/* data points */}
        {RAW.map(([x, y], i) => (
          <circle key={i} cx={px(x)} cy={py(y)} r={4.2} fill="var(--ink)" fillOpacity={0.72} />
        ))}

        {/* prediction highlight at x=6.5 */}
        <line x1={px(predX)} y1={Y1} x2={px(predX)} y2={Y0}
          stroke="var(--c-regression)" strokeWidth={1} strokeDasharray="3 3" strokeOpacity={0.4} />
        <circle cx={px(predX)} cy={py(predY)} r={5.5} fill="var(--c-regression)" stroke="var(--surface)" strokeWidth={1.5} />

        <text x={px(predX)} y={H - 4} fontSize={10} fill="var(--muted)" textAnchor="middle">x = 6.5</text>
        <text x={X0 - 4} y={py(3)} fontSize={9.5} fill="var(--faint)" textAnchor="end">3</text>
        <text x={X0 - 4} y={py(12)} fontSize={9.5} fill="var(--faint)" textAnchor="end">12</text>
      </svg>

      {/* sliders */}
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: "7px 10px", alignItems: "center", marginBottom: 12 }}>
        <label style={{ fontSize: 12.5, color: "var(--muted)", whiteSpace: "nowrap" }}>Slope (m)</label>
        <input type="range" min={0} max={1.5} step={0.01} value={m} onChange={e => setM(parseFloat(e.target.value))} style={{ flex: 1 }} />
        <span style={{ fontSize: 13, fontWeight: 500, minWidth: 34, textAlign: "right" }}>{m.toFixed(2)}</span>

        <label style={{ fontSize: 12.5, color: "var(--muted)", whiteSpace: "nowrap" }}>Intercept (b)</label>
        <input type="range" min={2} max={8} step={0.05} value={b} onChange={e => setB(parseFloat(e.target.value))} style={{ flex: 1 }} />
        <span style={{ fontSize: 13, fontWeight: 500, minWidth: 34, textAlign: "right" }}>{b.toFixed(1)}</span>
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <Stat label="prediction at x = 6.5" value={predY.toFixed(2)} />
        <Stat label="MSE" value={mse(m, b).toFixed(3)} />
        <div style={{ flex: 1 }} />
        <button onClick={() => { setM(OLS_M); setB(OLS_B); }} style={btnGhost}>Snap to best fit</button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "var(--surface-2)", borderRadius: 9, padding: "6px 12px" }}>
      <div style={{ fontSize: 10, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 500, color: "var(--ink)" }}>{value}</div>
    </div>
  );
}

const btnGhost: React.CSSProperties = { background: "transparent", color: "var(--muted)", border: "1px solid var(--border-strong)", fontSize: 13, padding: "8px 13px", borderRadius: 10, cursor: "pointer" };
