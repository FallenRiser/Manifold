"use client";

import { useEffect, useMemo, useRef, useState } from "react";

// PCA's central idea in one lab: rotate a direction through a centred 2-D cloud
// and watch two numbers move in lockstep — the VARIANCE captured along the line
// (project the points onto it) and the RECONSTRUCTION error left behind (the
// perpendicular residuals). Their sum is constant, so maximising one minimises
// the other: that is the whole of PCA. "Snap to PC1" jumps to the eigenvector of
// the covariance matrix — the single direction that wins both games at once.
//
// The cloud is a fixed synthetic sample (seed 7); covariance and the principal
// axis are computed live in-component, so every readout is honest, not hardcoded.

const DATA: [number, number][] = [
  [1.28, -0.61], [1.35, 0.74], [-0.34, 1.17], [-0.42, -1.8], [-0.51, 0.58],
  [-1.31, -0.57], [1.16, -0.08], [2.7, 3.37], [-0.55, 0.47], [-0.01, -1.24],
  [1.75, 0.94], [1.27, 1.2], [1.07, 0.33], [-1.41, -0.05], [0.74, 0.29],
  [1.92, 1.63], [-2.57, 0.12], [0.11, -0.65], [-3.21, -1.45], [-1.68, -1.35],
  [-3.05, -1.45], [0.78, -0.83], [-1.59, -1.42], [1.41, 0.5], [0.73, 1.25],
  [-0.08, 1.09], [-3.84, -3.32], [-0.01, -0.83], [0.41, 0.84], [1.82, -1.11],
  [-2.17, -1.6], [-0.17, -0.21], [-1.75, 0.36], [-1.17, 0.08], [3.08, 1.21],
  [-0.73, -0.77], [0.81, 0.13], [1.96, 2.51], [-0.25, -0.58], [0.67, 0.01],
  [0.86, 0.77], [0.95, 0.34],
];

const VW = 460, VH = 420;
const CX = VW / 2, CY = VH / 2;
const SCALE = 42; // data units -> px
const toPx = (x: number, y: number): [number, number] => [CX + x * SCALE, CY - y * SCALE];

// covariance of the (already-centred) cloud
function stats() {
  const n = DATA.length;
  let cxx = 0, cxy = 0, cyy = 0;
  for (const [x, y] of DATA) { cxx += x * x; cxy += x * y; cyy += y * y; }
  cxx /= n; cxy /= n; cyy /= n;
  const total = cxx + cyy;
  // principal axis angle of a 2x2 covariance
  const pc1 = 0.5 * Math.atan2(2 * cxy, cxx - cyy);
  return { total, pc1 };
}

export function PcaProjectionLab() {
  const { total, pc1 } = useMemo(stats, []);
  const [theta, setTheta] = useState(0); // radians, direction of the projection line
  const [showResiduals, setShowResiduals] = useState(true);
  const [drag, setDrag] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const rafRef = useRef<number | null>(null);

  const ux = Math.cos(theta), uy = Math.sin(theta);

  // variance captured along u = (1/n) Σ (x·u)^2
  const captured = useMemo(() => {
    let s = 0;
    for (const [x, y] of DATA) { const p = x * ux + y * uy; s += p * p; }
    return s / DATA.length;
  }, [ux, uy]);

  const residual = Math.max(0, total - captured);
  const frac = captured / total;

  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width) * VW;
      const py = ((e.clientY - rect.top) / rect.height) * VH;
      setTheta(Math.atan2(-(py - CY), px - CX));
    };
    const up = () => setDrag(false);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [drag]);

  function snap() {
    // rotate to the nearer of the two equivalent PC1 orientations
    let target = pc1;
    while (target - theta > Math.PI / 2) target -= Math.PI;
    while (theta - target > Math.PI / 2) target += Math.PI;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setTheta(pc1); return; }
    const from = theta, t0 = performance.now();
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / 600);
      const e = 1 - Math.pow(1 - k, 3);
      setTheta(from + (target - from) * e);
      if (k < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }

  const dim = "var(--c-dimred)";
  // endpoints of the projection line across the box
  const L = 260;
  const [lx1, ly1] = toPx(-ux * L / SCALE, -uy * L / SCALE);
  const [lx2, ly2] = toPx(ux * L / SCALE, uy * L / SCALE);
  const [hx, hy] = toPx(ux * 3.6, uy * 3.6); // drag handle

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.6rem 0" }} className="not-prose">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
          Rotate the line — where does the cloud spread most?
        </span>
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>drag the handle ●</span>
      </div>

      <svg ref={svgRef} viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", height: "auto", display: "block", touchAction: "none" }}>
        <rect x={1} y={1} width={VW - 2} height={VH - 2} rx={10} fill="var(--canvas)" stroke="var(--border-strong)" />
        {/* faint centre cross */}
        <line x1={CX} y1={10} x2={CX} y2={VH - 10} stroke="var(--border)" strokeWidth={1} />
        <line x1={10} y1={CY} x2={VW - 10} y2={CY} stroke="var(--border)" strokeWidth={1} />

        {/* residual segments (perpendicular drop to the line) */}
        {showResiduals && DATA.map(([x, y], i) => {
          const p = x * ux + y * uy;
          const [pxp, pyp] = toPx(p * ux, p * uy);
          const [px0, py0] = toPx(x, y);
          return <line key={`r${i}`} x1={px0} y1={py0} x2={pxp} y2={pyp} stroke="var(--brand-3)" strokeWidth={1.3} strokeOpacity={0.55} />;
        })}

        {/* the projection line */}
        <line x1={lx1} y1={ly1} x2={lx2} y2={ly2} stroke={dim} strokeWidth={2.5} strokeLinecap="round" />

        {/* projected points (shadows on the line) */}
        {DATA.map(([x, y], i) => {
          const p = x * ux + y * uy;
          const [pxp, pyp] = toPx(p * ux, p * uy);
          return <circle key={`pp${i}`} cx={pxp} cy={pyp} r={2.6} fill={dim} fillOpacity={0.85} />;
        })}

        {/* the data points */}
        {DATA.map(([x, y], i) => {
          const [px0, py0] = toPx(x, y);
          return <circle key={`p${i}`} cx={px0} cy={py0} r={3.6} fill="var(--ink)" fillOpacity={0.72} />;
        })}

        {/* drag handle */}
        <circle cx={hx} cy={hy} r={8} fill="var(--surface)" stroke={dim} strokeWidth={2.5} pointerEvents="none" />
        <circle
          cx={hx} cy={hy} r={22} fill="transparent" style={{ cursor: "grab" }}
          role="slider" aria-label="Projection direction" aria-valuenow={Math.round((theta * 180 / Math.PI))}
          tabIndex={0}
          onPointerDown={(e) => { e.preventDefault(); setDrag(true); }}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); setTheta((t) => t + 0.05); }
            if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); setTheta((t) => t - 0.05); }
          }}
        />
      </svg>

      {/* the two competing numbers + the constant-sum bar */}
      <div style={{ marginTop: 12 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <Metric label="variance captured" value={`${captured.toFixed(2)}`} sub={`${(frac * 100).toFixed(1)}% of total`} accent={dim} />
          <Metric label="reconstruction error" value={`${residual.toFixed(2)}`} sub="mean squared residual" accent="var(--brand-3)" />
          <Metric label="total variance" value={total.toFixed(2)} sub="captured + error (fixed)" />
          <div style={{ flex: 1 }} />
          <label style={{ fontSize: 12.5, color: "var(--muted)", display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <input type="checkbox" checked={showResiduals} onChange={(e) => setShowResiduals(e.target.checked)} />
            show residuals
          </label>
          <button onClick={snap} style={btnPrimary}>Snap to PC1</button>
          <button onClick={() => setTheta(0)} style={btnGhost}>Reset</button>
        </div>

        {/* stacked bar: captured (violet) + residual (gold) = total */}
        <div style={{ display: "flex", height: 14, borderRadius: 7, overflow: "hidden", marginTop: 12, border: "1px solid var(--border)" }}>
          <div style={{ width: `${frac * 100}%`, background: dim, transition: drag ? "none" : "width 0.1s linear" }} />
          <div style={{ width: `${(1 - frac) * 100}%`, background: "color-mix(in srgb, var(--brand-3) 55%, var(--surface))" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
          <span>captured along the line</span>
          <span>lost (reconstruction error)</span>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div style={{ background: "var(--surface-2)", borderRadius: 10, padding: "7px 11px", minWidth: 96 }}>
      <div style={{ fontSize: 10.5, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontSize: 17, fontWeight: 500, color: accent ?? "var(--ink)" }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: "var(--faint)" }}>{sub}</div>}
    </div>
  );
}

const btnPrimary: React.CSSProperties = { background: "var(--cta)", color: "var(--cta-text)", border: "none", fontSize: 13, fontWeight: 500, padding: "8px 14px", borderRadius: 10, cursor: "pointer" };
const btnGhost: React.CSSProperties = { background: "transparent", color: "var(--muted)", border: "1px solid var(--border-strong)", fontSize: 13, padding: "8px 12px", borderRadius: 10, cursor: "pointer" };
