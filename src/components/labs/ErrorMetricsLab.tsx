"use client";

import { useState } from "react";

const N = 12;
// Generate clean linear data
const BASE_DATA = Array.from({ length: N }, (_, i) => {
  const x = 1 + (i / (N - 1)) * 8; // 1 to 9
  const y = 2 + 1.2 * x + (Math.sin(i * 3) * 0.5);
  return { x, y };
});

export function ErrorMetricsLab() {
  const [outlierShift, setOutlierShift] = useState(0);

  // Apply shift to the 9th point
  const pts = BASE_DATA.map((p, i) => {
    if (i === 8) return { ...p, y: p.y + outlierShift };
    return { ...p };
  });

  // Fixed model (we don't refit to the outlier, we want to show how it blows up the error metrics of a given line)
  // Or actually, refitting shows how it pulls the line AND blows up error. Let's refit.
  const mx = pts.reduce((s, p) => s + p.x, 0) / N;
  const my = pts.reduce((s, p) => s + p.y, 0) / N;
  const num = pts.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0);
  const den = pts.reduce((s, p) => s + (p.x - mx) ** 2, 0);
  const m = num / den;
  const b = my - m * mx;

  // Compute errors
  let sumAbs = 0;
  let sumSq = 0;
  pts.forEach(p => {
    const err = Math.abs(p.y - (m * p.x + b));
    sumAbs += err;
    sumSq += err ** 2;
  });
  
  const mae = sumAbs / N;
  const rmse = Math.sqrt(sumSq / N);

  // SVG Geometry
  const W = 280, H = 200;
  const cx = (x: number) => 20 + ((x - 0) / 10) * (W - 40);
  const cy = (y: number) => H - 20 - ((y - 0) / 20) * (H - 40);

  // Bar sizes (normalised for display)
  const maeWidth = (mae / 4) * 100; // max ~4
  const rmseWidth = (rmse / 4) * 100;

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, margin: "1.6rem 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
        <span className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
          RMSE vs MAE sensitivity
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: 16, alignItems: "start" }}>
        
        {/* Left: Chart */}
        <div>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
            <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
            {/* OLS Line */}
            <line x1={cx(0)} y1={cy(b)} x2={cx(10)} y2={cy(m * 10 + b)} stroke="var(--brand)" strokeWidth={2} strokeLinecap="round" />
            
            {/* Outlier Residual Line */}
            <line 
              x1={cx(pts[8].x)} y1={cy(pts[8].y)} 
              x2={cx(pts[8].x)} y2={cy(m * pts[8].x + b)} 
              stroke="var(--bad)" strokeWidth={1.5} strokeOpacity={0.6} strokeDasharray="3 3"
            />

            {/* Points */}
            {pts.map((p, i) => (
              <circle key={i} cx={cx(p.x)} cy={cy(p.y)} r={i === 8 ? 5 : 3.5} 
                fill={i === 8 ? "var(--bad)" : "var(--c-regression)"} 
                fillOpacity={0.8} stroke={i === 8 ? "var(--surface)" : "none"} strokeWidth={1.5}
              />
            ))}
          </svg>

          <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>
              <span>Outlier shift</span>
              <span style={{ fontFamily: "ui-monospace, monospace" }}>+{outlierShift.toFixed(1)}</span>
            </div>
            <input 
              type="range" min="0" max="10" step="0.1" 
              value={outlierShift} onChange={e => setOutlierShift(parseFloat(e.target.value))}
              style={{ width: "100%", accentColor: "var(--bad)", cursor: "ew-resize" }}
            />
          </div>
        </div>

        {/* Right: Metrics */}
        <div style={{ background: "var(--canvas)", border: "1px solid var(--border-strong)", borderRadius: 12, padding: "14px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", gap: 20 }}>
          
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--c-fundamentals)" }}>MAE</span>
              <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 15, color: "var(--ink)" }}>{mae.toFixed(2)}</span>
            </div>
            <div style={{ height: 10, background: "var(--surface-2)", borderRadius: 5, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.min(100, maeWidth)}%`, background: "var(--c-fundamentals)", transition: "width 0.1s linear" }} />
            </div>
            <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 6, lineHeight: 1.4 }}>
              Mean Absolute Error grows linearly.
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--warn)" }}>RMSE</span>
              <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 15, color: "var(--ink)" }}>{rmse.toFixed(2)}</span>
            </div>
            <div style={{ height: 10, background: "var(--surface-2)", borderRadius: 5, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.min(100, rmseWidth)}%`, background: "var(--warn)", transition: "width 0.1s linear" }} />
            </div>
            <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 6, lineHeight: 1.4 }}>
              Root Mean Squared Error explodes as the single error gets large.
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
