"use client";

import { useState } from "react";

// 2-D logistic regression by hand: 40 real points (from the track's shared
// make_classification dataset — class_sep 0.9, 7% label noise), sliders for
// w1, w2, b. The boundary is the line w1·x1 + w2·x2 + b = 0; the dotted
// parallels mark where the model says p = 0.25 / 0.75, so their spacing shows
// how steep (confident) the probability ramp is. "Snap to fitted" uses the
// real scikit-learn solution on the full 200 points: w=[−0.50, 2.39], b=0.12
// — 92% on all 200, which shows as 90% on the 40 points displayed here
// (7% of labels are flipped noise, so 100% is impossible by construction).
const PTS: [number, number, 0 | 1][] = [
  [1.08, 0.81, 1], [-0.1, 0.91, 1], [2.28, 0.75, 1], [1.71, 0.3, 0], [0.37, -1.63, 0],
  [0.54, -1.42, 0], [0.81, -1.08, 0], [2.22, 1.25, 0], [1.24, -0.33, 0], [1.39, -0.4, 0],
  [1.89, 0.59, 0], [0.66, -1.18, 0], [-0.34, -2.88, 1], [2.26, 0.72, 1], [-0.11, 1.22, 1],
  [0.48, -1.74, 0], [-0.54, 1.23, 1], [-0.47, 1.04, 1], [0.43, 0.87, 1], [1.13, -0.56, 0],
  [0.38, 1.01, 1], [0.73, -1.09, 0], [-0.46, 1.16, 1], [2.11, 0.76, 1], [0.64, 1.04, 1],
  [0.89, -0.96, 0], [2.01, 0.5, 1], [2.3, 0.56, 1], [1.33, -0.36, 0], [1.82, 0.88, 1],
  [1.04, 0.9, 1], [0.79, -1.03, 0], [0.37, -1.69, 0], [1.29, -0.39, 0], [0.74, -1.39, 0],
  [1.7, 0.49, 0], [-0.17, 0.98, 1], [-0.18, 0.96, 1], [0.5, 0.93, 1], [0.64, 1.18, 1],
];
const FIT = { w1: -0.5, w2: 2.39, b: 0.12 };

const VW = 640;
const VH = 420;
const PAD = 16;
const XMIN = -1.4, XMAX = 3.0, YMIN = -3.4, YMAX = 2.0;

const sig = (z: number) => 1 / (1 + Math.exp(-z));

export function DecisionBoundaryLab() {
  const [w1, setW1] = useState(1);
  const [w2, setW2] = useState(1);
  const [b, setB] = useState(0);

  const xToPx = (x: number) => PAD + ((x - XMIN) / (XMAX - XMIN)) * (VW - 2 * PAD);
  const yToPx = (y: number) => VH - PAD - ((y - YMIN) / (YMAX - YMIN)) * (VH - 2 * PAD);

  let correct = 0, ll = 0;
  for (const [x, yv, c] of PTS) {
    const p = sig(w1 * x + w2 * yv + b);
    if ((p >= 0.5 ? 1 : 0) === c) correct++;
    const pc = Math.min(1 - 1e-9, Math.max(1e-9, c === 1 ? p : 1 - p));
    ll -= Math.log(pc);
  }
  const acc = correct / PTS.length;
  const logLoss = ll / PTS.length;

  // Line where w1·x + w2·y + b = k, clipped to the viewport, as an SVG segment.
  function levelLine(k: number): [number, number, number, number] | null {
    const pts: [number, number][] = [];
    const eps = 1e-9;
    if (Math.abs(w2) > eps) {
      for (const x of [XMIN, XMAX]) {
        const y = (k - b - w1 * x) / w2;
        if (y >= YMIN - eps && y <= YMAX + eps) pts.push([x, y]);
      }
    }
    if (Math.abs(w1) > eps) {
      for (const y of [YMIN, YMAX]) {
        const x = (k - b - w2 * y) / w1;
        if (x >= XMIN - eps && x <= XMAX + eps) pts.push([x, y]);
      }
    }
    if (pts.length < 2) return null;
    const [p1, p2] = [pts[0], pts[pts.length - 1]];
    return [xToPx(p1[0]), yToPx(p1[1]), xToPx(p2[0]), yToPx(p2[1])];
  }

  const boundary = levelLine(0);
  const z25 = Math.log(0.25 / 0.75); // z where p=0.25
  const band25 = levelLine(z25);
  const band75 = levelLine(-z25);

  // Half-plane tints: sample which corner is class-1 side.
  const zAt = (x: number, y: number) => w1 * x + w2 * y + b;

  return (
    <div style={frame}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6, flexWrap: "wrap", gap: 8 }}>
        <span className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
          Aim the boundary
        </span>
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>dotted lines: where the model says p = 0.25 and 0.75</span>
      </div>

      <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <defs>
          <clipPath id="dbl-clip">
            <rect x={PAD} y={PAD} width={VW - 2 * PAD} height={VH - 2 * PAD} rx={8} />
          </clipPath>
        </defs>
        <rect x={PAD} y={PAD} width={VW - 2 * PAD} height={VH - 2 * PAD} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />

        <g clipPath="url(#dbl-clip)">
          {/* class-1 side tint: big polygon past the boundary via oversized half-plane rect trick */}
          {boundary && (
            <HalfPlaneTint zAt={zAt} xToPx={xToPx} yToPx={yToPx} />
          )}

          {band25 && <line x1={band25[0]} y1={band25[1]} x2={band25[2]} y2={band25[3]} stroke="var(--c-regression)" strokeDasharray="3 6" strokeWidth={1.4} />}
          {band75 && <line x1={band75[0]} y1={band75[1]} x2={band75[2]} y2={band75[3]} stroke="var(--c-classification)" strokeDasharray="3 6" strokeWidth={1.4} />}
          {boundary && <line x1={boundary[0]} y1={boundary[1]} x2={boundary[2]} y2={boundary[3]} stroke="var(--ink)" strokeWidth={2.2} />}

          {PTS.map(([x, yv, c], i) => {
            const p = sig(zAt(x, yv));
            const wrong = (p >= 0.5 ? 1 : 0) !== c;
            return (
              <g key={i}>
                <circle cx={xToPx(x)} cy={yToPx(yv)} r={5.5} fill={c === 1 ? "var(--c-classification)" : "var(--c-regression)"} fillOpacity={0.9} />
                {wrong && <circle cx={xToPx(x)} cy={yToPx(yv)} r={9} fill="none" stroke="var(--bad)" strokeWidth={1.6} />}
              </g>
            );
          })}
        </g>
      </svg>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "8px 18px", marginTop: 12 }}>
        <label style={sliderLabel}>
          <span style={{ minWidth: 86 }}>w₁ = <b style={{ color: "var(--ink)" }}>{w1.toFixed(2)}</b></span>
          <input type="range" min={-4} max={4} step={0.05} value={w1} onChange={(e) => setW1(Number(e.target.value))} style={{ flex: 1, accentColor: "var(--c-classification)" }} aria-label="Weight w1" />
        </label>
        <label style={sliderLabel}>
          <span style={{ minWidth: 86 }}>w₂ = <b style={{ color: "var(--ink)" }}>{w2.toFixed(2)}</b></span>
          <input type="range" min={-4} max={4} step={0.05} value={w2} onChange={(e) => setW2(Number(e.target.value))} style={{ flex: 1, accentColor: "var(--c-classification)" }} aria-label="Weight w2" />
        </label>
        <label style={sliderLabel}>
          <span style={{ minWidth: 86 }}>b = <b style={{ color: "var(--ink)" }}>{b.toFixed(2)}</b></span>
          <input type="range" min={-4} max={4} step={0.05} value={b} onChange={(e) => setB(Number(e.target.value))} style={{ flex: 1, accentColor: "var(--c-classification)" }} aria-label="Bias b" />
        </label>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12, alignItems: "center" }}>
        <Metric label="accuracy" value={`${(acc * 100).toFixed(0)}%`} />
        <Metric label="log loss" value={logLoss.toFixed(3)} />
        <div style={{ flex: 1 }} />
        <button style={btn} onClick={() => { setW1(FIT.w1); setW2(FIT.w2); setB(FIT.b); }}>
          Snap to fitted
        </button>
        <button style={btnGhost} onClick={() => { setW1(1); setW2(1); setB(0); }}>
          Reset
        </button>
      </div>
    </div>
  );
}

// Soft tint of the class-1 half-plane, drawn as a coarse grid of translucent
// cells (cheap, theme-safe, and it also shows the probability ramp).
function HalfPlaneTint({
  zAt, xToPx, yToPx,
}: {
  zAt: (x: number, y: number) => number;
  xToPx: (x: number) => number;
  yToPx: (y: number) => number;
}) {
  const cells: React.ReactNode[] = [];
  const NX = 26, NY = 22;
  for (let i = 0; i < NX; i++) {
    for (let j = 0; j < NY; j++) {
      const x = XMIN + ((i + 0.5) / NX) * (XMAX - XMIN);
      const y = YMIN + ((j + 0.5) / NY) * (YMAX - YMIN);
      const p = sig(zAt(x, y));
      if (p < 0.5 - 1e-6 && p > 0.5 - 0.501) {
        // class-0 side: tint with regression colour, strength by confidence
        cells.push(<rect key={`${i}-${j}`} x={xToPx(x) - 12.5} y={yToPx(y) - 10} width={25} height={20} fill="var(--c-regression)" fillOpacity={0.10 * (1 - p * 2) + 0.008} />);
      } else if (p > 0.5 + 1e-6) {
        cells.push(<rect key={`${i}-${j}`} x={xToPx(x) - 12.5} y={yToPx(y) - 10} width={25} height={20} fill="var(--c-classification)" fillOpacity={0.10 * (p * 2 - 1) + 0.008} />);
      }
    }
  }
  return <g>{cells}</g>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "var(--surface-2)", borderRadius: 9, padding: "6px 11px" }}>
      <div style={{ fontSize: 10, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 500, color: "var(--ink)", fontFamily: "var(--font-geist-mono, monospace)" }}>{value}</div>
    </div>
  );
}

const frame: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border-strong)",
  borderRadius: 14,
  padding: "16px 16px 14px",
};

const sliderLabel: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  fontSize: 12.5,
  color: "var(--muted)",
};

const btn: React.CSSProperties = {
  background: "var(--c-classification)",
  color: "var(--cta-text, var(--surface))",
  border: "none",
  borderRadius: 8,
  padding: "7px 13px",
  fontSize: 12.5,
  fontWeight: 600,
  cursor: "pointer",
};

const btnGhost: React.CSSProperties = {
  background: "transparent",
  color: "var(--muted)",
  border: "1px solid var(--border-strong)",
  borderRadius: 8,
  padding: "7px 13px",
  fontSize: 12.5,
  cursor: "pointer",
};
