"use client";

import { useState } from "react";

// Every line in the corridor gets the training labels right. They are NOT
// equally trustworthy.
//
// Rotate and shift the boundary: as long as it separates the classes, training
// error stays 0.000 no matter where it sits, so empirical risk cannot choose
// between them. The MARGIN can -- the distance from the boundary to the nearest
// point. Margin-based bounds scale like 1/gamma^2, so a boundary squeezed
// against a point carries a far weaker guarantee than one sitting in the middle
// of the gap, even though both fit the data identically.
//
// "Snap to the widest gap" finds the maximum-margin separator by brute force
// over 720 orientations (for each, the optimal offset is the midpoint between
// the two classes' extreme projections). That is the SVM solution, arrived at
// from the generalization side rather than the optimisation side.
//
// All geometry is exact and computed in-component; SVG coords are rounded, so
// there is no hydration surface.

type Pt = { x: number; y: number; y_: number };

const PTS: Pt[] = [
  { x: 55, y: 65, y_: 1 }, { x: 80, y: 45, y_: 1 }, { x: 90, y: 92, y_: 1 }, { x: 65, y: 108, y_: 1 },
  { x: 150, y: 135, y_: -1 }, { x: 172, y: 110, y_: -1 }, { x: 140, y: 166, y_: -1 }, { x: 168, y: 168, y_: -1 },
];

const VW = 380, VH = 232;
const BOX = { x0: 60, y0: 12, x1: 320, y1: 212 };

// margin of the separator with unit normal (cos t, sin t) and offset b
function marginOf(theta: number, b: number) {
  const nx = Math.cos(theta), ny = Math.sin(theta);
  let m = Infinity;
  for (const p of PTS) m = Math.min(m, p.y_ * (nx * p.x + ny * p.y - b));
  return m;
}

function bestSeparator() {
  let best = { theta: 0, b: 0, m: -Infinity };
  for (let d = 0; d < 720; d++) {
    const theta = (d / 720) * Math.PI * 2;
    const nx = Math.cos(theta), ny = Math.sin(theta);
    let posMin = Infinity, negMax = -Infinity;
    for (const p of PTS) {
      const proj = nx * p.x + ny * p.y;
      if (p.y_ === 1) posMin = Math.min(posMin, proj);
      else negMax = Math.max(negMax, proj);
    }
    const m = (posMin - negMax) / 2;
    if (m > best.m) best = { theta, b: (posMin + negMax) / 2, m };
  }
  return best;
}
const BEST = bestSeparator();

export function MarginLab() {
  const [theta, setTheta] = useState(2.5);
  const [b, setB] = useState(-30);

  const accent = "var(--c-metrics)";
  const POS = "var(--ink)";
  const NEG = "var(--brand-2)";

  const m = marginOf(theta, b);
  const separates = m > 0;
  const nx = Math.cos(theta), ny = Math.sin(theta);
  const errors = PTS.filter((p) => p.y_ * (nx * p.x + ny * p.y - b) <= 0).length;

  // line through the point b*n, along the perpendicular direction
  const line = (offset: number) => {
    const cx = nx * (b + offset), cy = ny * (b + offset);
    const dx = -ny, dy = nx, L = 460;
    return {
      x1: Number((cx - dx * L).toFixed(2)), y1: Number((cy - dy * L).toFixed(2)),
      x2: Number((cx + dx * L).toFixed(2)), y2: Number((cy + dy * L).toFixed(2)),
    };
  };
  const mid = line(0), up = line(m), dn = line(-m);
  const isSupport = (p: Pt) => separates && Math.abs(p.y_ * (nx * p.x + ny * p.y - b) - m) < 0.75;

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.6rem 0" }} className="not-prose">
      <div className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", marginBottom: 2 }}>
        Same zero training error, different confidence
      </div>
      <div style={{ fontSize: 12, color: "var(--faint)", marginBottom: 10 }}>
        rotate and shift the boundary — the training score never moves
      </div>

      <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", maxWidth: VW, height: "auto", display: "block" }}>
        <defs>
          <clipPath id="margin-clip">
            <rect x={BOX.x0} y={BOX.y0} width={BOX.x1 - BOX.x0} height={BOX.y1 - BOX.y0} rx={8} />
          </clipPath>
        </defs>
        <rect x={BOX.x0} y={BOX.y0} width={BOX.x1 - BOX.x0} height={BOX.y1 - BOX.y0} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />

        <g clipPath="url(#margin-clip)">
          {separates && (
            <>
              <polygon
                points={`${up.x1},${up.y1} ${up.x2},${up.y2} ${dn.x2},${dn.y2} ${dn.x1},${dn.y1}`}
                fill={accent} fillOpacity={0.12}
              />
              <line x1={up.x1} y1={up.y1} x2={up.x2} y2={up.y2} stroke={accent} strokeWidth={1} strokeDasharray="4 3" opacity={0.8} />
              <line x1={dn.x1} y1={dn.y1} x2={dn.x2} y2={dn.y2} stroke={accent} strokeWidth={1} strokeDasharray="4 3" opacity={0.8} />
            </>
          )}
          <line x1={mid.x1} y1={mid.y1} x2={mid.x2} y2={mid.y2} stroke={separates ? "var(--ink)" : "var(--bad)"} strokeWidth={2} />
        </g>

        {PTS.map((p, i) => (
          <g key={i}>
            {isSupport(p) && <circle cx={p.x} cy={p.y} r={11} fill="none" stroke={accent} strokeWidth={1.5} />}
            <circle
              cx={p.x} cy={p.y} r={6.5}
              fill={p.y_ === 1 ? POS : "var(--surface)"}
              stroke={p.y_ === 1 ? POS : NEG} strokeWidth={2}
            />
          </g>
        ))}

        {!separates && (
          <text x={(BOX.x0 + BOX.x1) / 2} y={BOX.y1 - 10} fontSize={11} fill="var(--bad)" textAnchor="middle">
            {errors} point{errors === 1 ? "" : "s"} misclassified
          </text>
        )}
      </svg>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 14px", marginTop: 12 }}>
        <label style={{ fontSize: 12, color: "var(--muted)" }}>
          orientation
          <input type="range" min={0} max={6.28} step={0.01} value={theta} onChange={(e) => setTheta(Number(e.target.value))} style={{ width: "100%", accentColor: accent }} />
        </label>
        <label style={{ fontSize: 12, color: "var(--muted)" }}>
          offset
          <input type="range" min={-240} max={240} step={1} value={b} onChange={(e) => setB(Number(e.target.value))} style={{ width: "100%", accentColor: accent }} />
        </label>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12, alignItems: "center" }}>
        <Metric label="training error" value={separates ? "0.000" : (errors / PTS.length).toFixed(3)} accent={separates ? "var(--good)" : "var(--bad)"} />
        <Metric label="margin γ" value={separates ? m.toFixed(1) : "—"} accent={accent} big sub={separates ? "to the nearest point" : "not separating"} />
        <Metric label="bound scales as 1/γ²" value={separates && m > 0 ? (1000 / (m * m)).toFixed(1) : "∞"} sub="lower is a better guarantee" />
        <div style={{ flex: 1 }} />
        <button onClick={() => { setTheta(BEST.theta); setB(BEST.b); }} style={btn}>snap to the widest gap</button>
      </div>
    </div>
  );
}

function Metric({ label, value, sub, accent, big }: { label: string; value: string; sub?: string; accent?: string; big?: boolean }) {
  return (
    <div style={{ background: "var(--surface-2)", borderRadius: 10, padding: "6px 10px", minWidth: 92 }}>
      <div style={{ fontSize: 10.5, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontSize: big ? 19 : 15, fontWeight: 500, color: accent ?? "var(--ink)" }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: "var(--faint)" }}>{sub}</div>}
    </div>
  );
}
const btn: React.CSSProperties = { background: "transparent", color: "var(--muted)", border: "1px solid var(--border-strong)", fontSize: 12, padding: "5px 10px", borderRadius: 8, cursor: "pointer" };
