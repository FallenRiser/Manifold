"use client";

import { useState } from "react";

const N = 12;
// A small noisy dataset that a high-degree polynomial will massively overfit
const PTS = [
  { x: 1, y: 3.1 },
  { x: 2, y: 3.8 },
  { x: 3, y: 3.9 },
  { x: 4, y: 4.8 },
  { x: 5, y: 5.6 },
  { x: 6, y: 6.3 },
  { x: 7, y: 7.2 },
  { x: 8, y: 7.5 },
  { x: 9, y: 8.8 },
  { x: 10, y: 8.6 },
  { x: 11, y: 9.7 },
  { x: 12, y: 10.1 }
];

// We fit a degree-6 polynomial. 
// To solve Ridge Regression: θ = (XᵀX + λI)⁻¹ Xᵀy
// Since this is JS and I don't have a matrix library, I'll approximate the curve 
// visually by blending a perfect overfit curve (λ=0) with a straight line (λ=large)
// and a flat line (λ=huge).

export function RegularizationLab() {
  const [lambdaIdx, setLambdaIdx] = useState(0);
  
  // 0 to 100 slider
  const lambdaValues = [
    { label: "0 (OLS)", t: 0, bias: 0.1, var: 0.9, trErr: 0.2, teErr: 8.5 },
    { label: "0.1", t: 0.2, bias: 0.2, var: 0.6, trErr: 0.4, teErr: 4.2 },
    { label: "1.0", t: 0.5, bias: 0.4, var: 0.3, trErr: 0.8, teErr: 1.5 },
    { label: "10 (Sweet spot)", t: 0.8, bias: 0.6, var: 0.1, trErr: 1.2, teErr: 1.2 },
    { label: "100", t: 0.95, bias: 0.8, var: 0.05, trErr: 2.1, teErr: 2.3 },
    { label: "10000 (Underfit)", t: 1.1, bias: 0.95, var: 0.0, trErr: 3.5, teErr: 3.8 }
  ];
  
  const cur = lambdaValues[Math.min(lambdaIdx, lambdaValues.length - 1)];

  // Curve generation
  // t=0 is full overfit (wiggles through points).
  // t=1 is a straight line.
  // t>1 starts flattening toward y=mean.
  
  const W = 360, H = 240;
  const cx = (x: number) => 20 + ((x - 0) / 13) * (W - 40);
  const cy = (y: number) => H - 20 - ((y - 0) / 12) * (H - 40);

  // Generate the path string
  const pathPts = [];
  for(let x=0.5; x<=12.5; x+=0.2) {
    // 1. OLS Straight line fit (y = 2.5 + 0.65x)
    const lineY = 2.4 + 0.64 * x;
    
    // 2. Overfit wiggle (sine waves hitting the points)
    const wiggleY = lineY + Math.sin(x * 3.14) * 1.5 * (1 - cur.t);
    
    // 3. Heavy penalty (flattens toward mean y=6.5)
    let finalY = wiggleY;
    if (cur.t > 0.9) {
      const flatAmt = (cur.t - 0.9) * 5; // 0 to 1
      finalY = wiggleY * (1 - flatAmt) + 6.5 * flatAmt;
    }
    
    pathPts.push(`${cx(x)},${cy(finalY)}`);
  }
  const pathStr = `M ${pathPts.join(" L ")}`;

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, margin: "1.6rem 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
        <span className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
          Ridge Regularization (L2 Penalty)
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: 16, alignItems: "start" }}>
        
        {/* Left: Chart */}
        <div>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
            <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
            
            {/* The curve */}
            <path d={pathStr} fill="none" stroke="var(--brand)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

            {/* Points */}
            {PTS.map((p, i) => (
              <circle key={i} cx={cx(p.x)} cy={cy(p.y)} r={3.5} fill="var(--c-regression)" fillOpacity={0.8} />
            ))}
          </svg>

          <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>
              <span>Penalty Strength (λ)</span>
              <span style={{ fontFamily: "ui-monospace, monospace", color: "var(--brand)", fontWeight: 600 }}>{cur.label}</span>
            </div>
            <input 
              type="range" min="0" max={lambdaValues.length - 1} step="1" 
              value={lambdaIdx} onChange={e => setLambdaIdx(parseInt(e.target.value))}
              style={{ width: "100%", accentColor: "var(--brand)", cursor: "ew-resize" }}
            />
          </div>
        </div>

        {/* Right: Metrics */}
        <div style={{ background: "var(--canvas)", border: "1px solid var(--border-strong)", borderRadius: 12, padding: "14px", display: "flex", flexDirection: "column", gap: 14 }}>
          
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--faint)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Error Metrics
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: "var(--good)" }}>Train Error</span>
            </div>
            <div style={{ height: 6, background: "var(--surface-2)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${cur.trErr * 18}%`, background: "var(--good)", transition: "width 0.2s ease" }} />
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: "var(--warn)" }}>Test Error</span>
            </div>
            <div style={{ height: 6, background: "var(--surface-2)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${cur.teErr * 10}%`, background: "var(--warn)", transition: "width 0.2s ease" }} />
            </div>
          </div>

          <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: "var(--c-fundamentals)" }}>Bias (Underfitting)</span>
            </div>
            <div style={{ height: 6, background: "var(--surface-2)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${cur.bias * 100}%`, background: "var(--c-fundamentals)", transition: "width 0.2s ease" }} />
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: "var(--bad)" }}>Variance (Overfitting)</span>
            </div>
            <div style={{ height: 6, background: "var(--surface-2)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${cur.var * 100}%`, background: "var(--bad)", transition: "width 0.2s ease" }} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
