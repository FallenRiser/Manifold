"use client";

import { useState } from "react";

// Generate points
function generatePoints(n: number, seed: number = 42) {
  let s = seed;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  
  const pts = [];
  for (let i = 0; i < n; i++) {
    const x = 1 + rand() * 8; // 1 to 9
    const y = 3 + 0.8 * x + (rand() - 0.5) * 4; // noise
    pts.push({ x, y });
  }
  return pts;
}

export function IntervalsLab() {
  const [showCI, setShowCI] = useState(true);
  const [showPI, setShowPI] = useState(false);
  const [nSlider, setNSlider] = useState(15); // 10 to 200

  const pts = generatePoints(nSlider);
  
  // Fit OLS
  const mx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
  const my = pts.reduce((s, p) => s + p.y, 0) / pts.length;
  const sumSqX = pts.reduce((s, p) => s + (p.x - mx) ** 2, 0);
  const m = pts.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0) / sumSqX;
  const b = my - m * mx;

  // MSE
  const mse = pts.reduce((s, p) => s + (p.y - (m * p.x + b)) ** 2, 0) / (pts.length - 2);

  // Compute intervals across the x range
  // Using t ≈ 2 for 95% interval for simplicity in the visual
  const W = 360, H = 240;
  const cx = (x: number) => 20 + ((x - 0) / 10) * (W - 40);
  const cy = (y: number) => H - 20 - ((y - 0) / 15) * (H - 40);

  const ciPathTop = [];
  const ciPathBot = [];
  const piPathTop = [];
  const piPathBot = [];

  for (let x = 0; x <= 10; x += 0.5) {
    const yHat = m * x + b;
    // Standard error of the fit (CI)
    const seFit = Math.sqrt(mse * (1 / pts.length + ((x - mx) ** 2) / sumSqX));
    // Standard error of the prediction (PI)
    const sePred = Math.sqrt(mse * (1 + 1 / pts.length + ((x - mx) ** 2) / sumSqX));

    const marginCI = 2 * seFit;
    const marginPI = 2 * sePred;

    ciPathTop.push(`${cx(x)},${cy(yHat + marginCI)}`);
    ciPathBot.unshift(`${cx(x)},${cy(yHat - marginCI)}`); // reverse order to close path
    
    piPathTop.push(`${cx(x)},${cy(yHat + marginPI)}`);
    piPathBot.unshift(`${cx(x)},${cy(yHat - marginPI)}`);
  }

  const ciPath = `M ${ciPathTop[0]} L ${ciPathTop.join(" L ")} L ${ciPathBot[0]} L ${ciPathBot.join(" L ")} Z`;
  const piPath = `M ${piPathTop[0]} L ${piPathTop.join(" L ")} L ${piPathBot[0]} L ${piPathBot.join(" L ")} Z`;

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, margin: "1.6rem 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <span className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
          Confidence vs Prediction Intervals
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: 16, alignItems: "start" }}>
        
        {/* Left: Chart */}
        <div>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
            <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
            
            {/* PI Shading */}
            {showPI && <path d={piPath} fill="var(--c-fundamentals)" fillOpacity={0.15} stroke="var(--c-fundamentals)" strokeWidth={1} strokeDasharray="3 3" />}
            
            {/* CI Shading */}
            {showCI && <path d={ciPath} fill="var(--brand)" fillOpacity={0.25} stroke="var(--brand)" strokeWidth={1} />}
            
            {/* OLS Line */}
            <line x1={cx(0)} y1={cy(b)} x2={cx(10)} y2={cy(m * 10 + b)} stroke="var(--ink)" strokeWidth={2} strokeLinecap="round" />

            {/* Points (only show max 50 so it doesn't get too cluttered visually) */}
            {pts.slice(0, 50).map((p, i) => (
              <circle key={i} cx={cx(p.x)} cy={cy(p.y)} r={2.5} fill="var(--faint)" fillOpacity={0.8} />
            ))}
          </svg>

          <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>
              <span>Sample Size (N)</span>
              <span style={{ fontFamily: "ui-monospace, monospace", color: "var(--ink)" }}>{nSlider}</span>
            </div>
            <input 
              type="range" min="10" max="200" step="1" 
              value={nSlider} onChange={e => setNSlider(parseInt(e.target.value))}
              style={{ width: "100%", accentColor: "var(--ink)", cursor: "ew-resize" }}
            />
          </div>
        </div>

        {/* Right: Controls */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          
          <label style={{ display: "flex", gap: 8, padding: "10px 12px", background: showCI ? "color-mix(in srgb, var(--brand) 10%, var(--surface-2))" : "var(--surface-2)", border: `1px solid ${showCI ? "var(--brand)" : "var(--border)"}`, borderRadius: 10, cursor: "pointer", transition: "all 0.15s" }}>
            <input type="checkbox" checked={showCI} onChange={e => setShowCI(e.target.checked)} style={{ accentColor: "var(--brand)", marginTop: 2 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", marginBottom: 2 }}>Confidence Interval</div>
              <div style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.4 }}>Uncertainty in the <em>mean</em> line. Pinches at center. Shrinks to zero as N grows.</div>
            </div>
          </label>

          <label style={{ display: "flex", gap: 8, padding: "10px 12px", background: showPI ? "color-mix(in srgb, var(--c-fundamentals) 10%, var(--surface-2))" : "var(--surface-2)", border: `1px solid ${showPI ? "var(--c-fundamentals)" : "var(--border)"}`, borderRadius: 10, cursor: "pointer", transition: "all 0.15s" }}>
            <input type="checkbox" checked={showPI} onChange={e => setShowPI(e.target.checked)} style={{ accentColor: "var(--c-fundamentals)", marginTop: 2 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", marginBottom: 2 }}>Prediction Interval</div>
              <div style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.4 }}>Uncertainty for a <em>single new point</em>. Stays wide forever (irreducible noise).</div>
            </div>
          </label>

          <div style={{ background: "var(--canvas)", border: "1px solid var(--border-strong)", borderRadius: 10, padding: 12, marginTop: "auto" }}>
            <div style={{ fontSize: 11.5, color: "var(--faint)", lineHeight: 1.5 }}>
              <strong>Try this:</strong> Turn both on and drag N to 200. The Confidence Interval disappears, but the Prediction Interval remains wide.
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
