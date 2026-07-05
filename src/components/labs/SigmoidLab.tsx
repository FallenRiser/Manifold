"use client";

import { useState } from "react";

// 1-D logistic regression by hand: 28 points (two overlapping classes) on the
// x-axis, sigmoid curve σ(wx + b), sliders for w and b. Data + fitted weights
// come from a real scikit-learn run (see PROJECT.md honest-numbers doctrine):
// LogisticRegression on these exact points → w=1.55, b=−0.69, accuracy 0.893.
const X0 = [-3.84, -3.42, -2.55, -2.48, -2.1, -2.03, -1.65, -1.33, -1.32, -1.13, -0.88, -0.34, -0.05, 1.17];
const X1 = [0.39, 0.43, 1.48, 1.51, 2.01, 2.19, 2.36, 2.46, 2.47, 2.55, 2.76, 2.93, 3.93, 4.03];
const FIT_W = 1.55;
const FIT_B = -0.69;

const VW = 640;
const VH = 320;
const PAD = { l: 46, r: 18, t: 16, b: 34 };
const XMIN = -4.6;
const XMAX = 4.6;

const sig = (z: number) => 1 / (1 + Math.exp(-z));

export function SigmoidLab() {
  const [w, setW] = useState(0.6);
  const [b, setB] = useState(0);

  const xToPx = (x: number) => PAD.l + ((x - XMIN) / (XMAX - XMIN)) * (VW - PAD.l - PAD.r);
  const pToPx = (p: number) => VH - PAD.b - p * (VH - PAD.t - PAD.b);

  const curve = Array.from({ length: 121 }, (_, i) => {
    const x = XMIN + (i / 120) * (XMAX - XMIN);
    return `${xToPx(x)},${pToPx(sig(w * x + b))}`;
  }).join(" ");

  const all: [number, 0 | 1][] = [
    ...X0.map((x) => [x, 0] as [number, 0 | 1]),
    ...X1.map((x) => [x, 1] as [number, 0 | 1]),
  ];
  let correct = 0;
  let ll = 0;
  for (const [x, yTrue] of all) {
    const p = sig(w * x + b);
    if ((p >= 0.5 ? 1 : 0) === yTrue) correct++;
    const pc = Math.min(1 - 1e-9, Math.max(1e-9, yTrue === 1 ? p : 1 - p));
    ll -= Math.log(pc);
  }
  const acc = correct / all.length;
  const logLoss = ll / all.length;
  // boundary: where wx + b = 0
  const xBoundary = w !== 0 ? -b / w : null;

  return (
    <div style={frame}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
          Fit the S-curve to the two classes
        </span>
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>height of the curve = P(class 1)</span>
      </div>

      <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", height: "auto", display: "block", touchAction: "none" }}>
        <rect x={PAD.l} y={PAD.t} width={VW - PAD.l - PAD.r} height={VH - PAD.t - PAD.b} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        {/* p gridlines */}
        {[0.5].map((p) => (
          <line key={p} x1={PAD.l} y1={pToPx(p)} x2={VW - PAD.r} y2={pToPx(p)} stroke="var(--border)" strokeDasharray="4 5" />
        ))}
        <text x={PAD.l - 6} y={pToPx(1) + 4} fontSize={10} fill="var(--faint)" textAnchor="end">1.0</text>
        <text x={PAD.l - 6} y={pToPx(0.5) + 4} fontSize={10} fill="var(--faint)" textAnchor="end">0.5</text>
        <text x={PAD.l - 6} y={pToPx(0) + 4} fontSize={10} fill="var(--faint)" textAnchor="end">0.0</text>

        {/* decision boundary */}
        {xBoundary !== null && xBoundary > XMIN && xBoundary < XMAX && (
          <g>
            <line x1={xToPx(xBoundary)} y1={PAD.t} x2={xToPx(xBoundary)} y2={VH - PAD.b} stroke="var(--c-fundamentals)" strokeDasharray="5 5" strokeWidth={1.5} />
            <text x={xToPx(xBoundary)} y={PAD.t + 12} fontSize={10} fill="var(--c-fundamentals)" textAnchor="middle">p = 0.5 here</text>
          </g>
        )}

        {/* sigmoid */}
        <polyline points={curve} fill="none" stroke="var(--c-classification)" strokeWidth={2.5} />

        {/* points: class 0 sits at p=0 line, class 1 at p=1 line; ring = misclassified */}
        {all.map(([x, yTrue], i) => {
          const p = sig(w * x + b);
          const wrong = (p >= 0.5 ? 1 : 0) !== yTrue;
          return (
            <g key={i}>
              <circle
                cx={xToPx(x)}
                cy={pToPx(yTrue)}
                r={5}
                fill={yTrue === 1 ? "var(--c-classification)" : "var(--c-regression)"}
                fillOpacity={0.85}
              />
              {wrong && (
                <circle cx={xToPx(x)} cy={pToPx(yTrue)} r={8.5} fill="none" stroke="var(--bad)" strokeWidth={1.6} />
              )}
            </g>
          );
        })}
      </svg>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 18px", marginTop: 12 }}>
        <label style={sliderLabel}>
          <span style={{ minWidth: 118 }}>steepness w = <b style={{ color: "var(--ink)" }}>{w.toFixed(2)}</b></span>
          <input type="range" min={-1} max={5} step={0.05} value={w} onChange={(e) => setW(Number(e.target.value))} style={{ flex: 1, accentColor: "var(--c-classification)" }} aria-label="Steepness w" />
        </label>
        <label style={sliderLabel}>
          <span style={{ minWidth: 118 }}>shift b = <b style={{ color: "var(--ink)" }}>{b.toFixed(2)}</b></span>
          <input type="range" min={-5} max={5} step={0.05} value={b} onChange={(e) => setB(Number(e.target.value))} style={{ flex: 1, accentColor: "var(--c-classification)" }} aria-label="Shift b" />
        </label>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12, alignItems: "center" }}>
        <Metric label="accuracy" value={`${(acc * 100).toFixed(1)}%`} />
        <Metric label="log loss" value={logLoss.toFixed(3)} />
        <div style={{ flex: 1 }} />
        <button style={btn} onClick={() => { setW(FIT_W); setB(FIT_B); }}>
          Snap to fitted (w=1.55, b=−0.69)
        </button>
        <button style={btnGhost} onClick={() => { setW(0.6); setB(0); }}>
          Reset
        </button>
      </div>
    </div>
  );
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
