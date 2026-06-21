"use client";

import { useState, useRef, useEffect, useCallback } from "react";

const N = 15;
// Generate some tight linear data
const INITIAL_DATA = Array.from({ length: N - 1 }, (_, i) => {
  const x = 2 + (i / (N - 2)) * 6; // 2 to 8
  const y = 3 + 1.5 * x + (Math.sin(i * 4.3) * 1.5);
  return { x, y };
});
// Add the special draggable point initially in the middle
INITIAL_DATA.push({ x: 5, y: 10.5 });

function solveOLS(pts: {x: number, y: number}[]) {
  const n = pts.length;
  const mx = pts.reduce((s, p) => s + p.x, 0) / n;
  const my = pts.reduce((s, p) => s + p.y, 0) / n;
  const num = pts.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0);
  const den = pts.reduce((s, p) => s + (p.x - mx) ** 2, 0);
  const m = num / den;
  const b = my - m * mx;
  return { m, b, mx, den };
}

export function InfluenceLab() {
  const [pts, setPts] = useState(INITIAL_DATA);
  const [dragging, setDragging] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const { m, b, mx, den } = solveOLS(pts);

  // Compute stats for the special point (the last one)
  const sp = pts[N - 1];
  const fitted = m * sp.x + b;
  const resid = sp.y - fitted;
  
  // Leverage h_ii = 1/n + (x_i - mx)^2 / sum((x_j - mx)^2)
  const leverage = 1 / N + ((sp.x - mx) ** 2) / den;
  
  // Compute MSE (s^2) for Cook's D
  let sse = 0;
  pts.forEach(p => sse += (p.y - (m * p.x + b)) ** 2);
  const mse = sse / (N - 2);
  
  // Cook's D = (r_i^2 / (p * MSE)) * (h_ii / (1 - h_ii)^2)  where r_i is raw residual, p=2
  const cooksD = (resid ** 2 / (2 * mse)) * (leverage / ((1 - leverage) ** 2));

  // Chart geometry
  const W = 360, H = 240;
  const cx = (x: number) => 30 + ((x - 0) / 14) * (W - 40);
  const cy = (y: number) => H - 20 - ((y - -5) / 30) * (H - 30);
  
  const invX = (svgX: number) => 0 + ((svgX - 30) / (W - 40)) * 14;
  const invY = (svgY: number) => -5 + ((H - 20 - svgY) / (H - 30)) * 30;

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only grab if close to the special point
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const ex = e.clientX - rect.left;
    const ey = e.clientY - rect.top;
    const px = cx(sp.x);
    const py = cy(sp.y);
    if (Math.hypot(ex - px, ey - py) < 20) {
      setDragging(true);
      (e.target as Element).setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const ex = e.clientX - rect.left;
    const ey = e.clientY - rect.top;
    const newX = Math.max(0, Math.min(14, invX(ex)));
    const newY = Math.max(-5, Math.min(25, invY(ey)));
    setPts(prev => {
      const nw = [...prev];
      nw[N - 1] = { x: newX, y: newY };
      return nw;
    });
  };

  const handlePointerUp = () => setDragging(false);

  // OLS without the special point
  const { m: mBase, b: bBase } = solveOLS(pts.slice(0, N - 1));

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, margin: "1.6rem 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <span className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
          Interactive Influence: Drag the red point
        </span>
        <div style={{ display: "flex", gap: 12 }}>
          <span style={{ fontSize: 12, color: "var(--brand)", display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 12, height: 2, background: "var(--brand)" }}/> Full model
          </span>
          <span style={{ fontSize: 12, color: "var(--faint)", display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 12, height: 2, background: "var(--border-strong)", borderStyle: "dashed" }}/> Without red point
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: 16, alignItems: "start" }}>
        
        {/* SVG Area */}
        <div style={{ touchAction: "none" }}>
          <svg 
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`} 
            style={{ width: "100%", height: "auto", display: "block", cursor: dragging ? "grabbing" : "default" }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
            
            {/* Grid lines to show leverage areas (far x = high leverage) */}
            <rect x={cx(11)} y={0} width={cx(14)-cx(11)} height={H} fill="var(--c-fundamentals)" fillOpacity={0.05} />
            <rect x={cx(0)} y={0} width={cx(1)-cx(0)} height={H} fill="var(--c-fundamentals)" fillOpacity={0.05} />
            <text x={cx(12.5)} y={20} fontSize={9} fill="var(--c-fundamentals)" fillOpacity={0.6} textAnchor="middle">High Leverage</text>
            
            {/* Base line (without red point) */}
            <line x1={cx(0)} y1={cy(bBase)} x2={cx(14)} y2={cy(mBase * 14 + bBase)} stroke="var(--border-strong)" strokeWidth={2} strokeDasharray="4 4" strokeLinecap="round" />
            
            {/* Full model line */}
            <line x1={cx(0)} y1={cy(b)} x2={cx(14)} y2={cy(m * 14 + b)} stroke="var(--brand)" strokeWidth={2} strokeLinecap="round" />
            
            {/* Residual line for red point */}
            <line x1={cx(sp.x)} y1={cy(sp.y)} x2={cx(sp.x)} y2={cy(fitted)} stroke="var(--bad)" strokeWidth={1.5} strokeOpacity={0.5} strokeDasharray="2 2" />

            {/* Static points */}
            {pts.slice(0, N - 1).map((p, i) => (
              <circle key={i} cx={cx(p.x)} cy={cy(p.y)} r={3.5} fill="var(--c-regression)" fillOpacity={0.6} />
            ))}
            
            {/* Draggable point */}
            <circle cx={cx(sp.x)} cy={cy(sp.y)} r={dragging ? 7 : 5.5} fill="var(--bad)" 
              stroke="var(--surface)" strokeWidth={2}
              style={{ cursor: "grab", transition: "r 0.1s" }}
            />
          </svg>
          <div style={{ fontSize: 11, color: "var(--faint)", textAlign: "center", marginTop: 8 }}>
            Move it far left/right to increase <strong>leverage</strong>. Move it far up/down to increase <strong>discrepancy (residual)</strong>.
          </div>
        </div>

        {/* Stats Panel */}
        <div style={{ background: "var(--canvas)", border: "1px solid var(--border-strong)", borderRadius: 12, padding: "12px 14px" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--faint)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
            Red Point Metrics
          </div>
          
          <StatBox label="Leverage (x-distance)" val={leverage.toFixed(3)} 
            desc={leverage > 0.25 ? "High (potential to tilt)" : "Low (safe in middle)"} 
            color={leverage > 0.25 ? "var(--warn)" : "var(--good)"} 
          />
          <StatBox label="Residual (y-distance)" val={Math.abs(resid).toFixed(2)} 
            desc={Math.abs(resid) > 6 ? "High (outlier)" : "Low (fits pattern)"} 
            color={Math.abs(resid) > 6 ? "var(--warn)" : "var(--good)"} 
          />
          <div style={{ height: 1, background: "var(--border)", margin: "12px 0" }} />
          <StatBox label="Cook's Distance" val={cooksD.toFixed(3)} 
            desc={cooksD > 1.0 ? "High Influence! Pulling line." : "Low Influence"} 
            color={cooksD > 1.0 ? "var(--bad)" : (cooksD > 0.5 ? "var(--warn)" : "var(--good)")} 
            big
          />
        </div>

      </div>
    </div>
  );
}

function StatBox({ label, val, desc, color, big }: { label: string, val: string, desc: string, color: string, big?: boolean }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: big ? 20 : 15, fontWeight: 600, color, fontFamily: "ui-monospace, monospace" }}>{val}</div>
      <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 1 }}>{desc}</div>
    </div>
  );
}
