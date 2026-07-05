"use client";

import { useState } from "react";

// The threshold is a business decision, not a math one. 30 real test-set
// predictions from the track's fitted logistic model (probabilities are
// genuine scikit-learn outputs, spread across the whole range), one slider
// for the cutoff, and a live confusion matrix + precision/recall.
const SCORED: [number, 0 | 1][] = [
  [0.0, 0], [0.0, 0], [0.01, 0], [0.02, 0], [0.02, 0], [0.04, 0], [0.06, 0], [0.08, 0],
  [0.16, 0], [0.21, 0], [0.26, 0], [0.29, 0], [0.43, 1], [0.46, 0], [0.46, 1], [0.51, 1],
  [0.56, 0], [0.57, 1], [0.6, 1], [0.76, 1], [0.76, 1], [0.78, 1], [0.81, 1], [0.83, 0],
  [0.9, 1], [0.91, 1], [0.94, 1], [0.94, 1], [0.96, 1], [0.97, 1],
];

const VW = 640;
const VH = 190;
const PAD = { l: 20, r: 20, t: 40, b: 40 };

export function ThresholdLab() {
  const [t, setT] = useState(0.5);

  const xToPx = (p: number) => PAD.l + p * (VW - PAD.l - PAD.r);

  let tp = 0, fp = 0, fn = 0, tn = 0;
  for (const [p, y] of SCORED) {
    if (p >= t) y === 1 ? tp++ : fp++;
    else y === 1 ? fn++ : tn++;
  }
  const precision = tp + fp > 0 ? tp / (tp + fp) : NaN;
  const recall = tp + fn > 0 ? tp / (tp + fn) : NaN;
  const acc = (tp + tn) / SCORED.length;

  // stack points that share an x position
  const seen = new Map<number, number>();

  return (
    <div style={frame}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6, flexWrap: "wrap", gap: 8 }}>
        <span className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
          Slide the cutoff
        </span>
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>fill = true class · right of the line = predicted positive</span>
      </div>

      <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <rect x={PAD.l} y={PAD.t} width={VW - PAD.l - PAD.r} height={VH - PAD.t - PAD.b} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        {/* predicted-positive region */}
        <rect x={xToPx(t)} y={PAD.t} width={Math.max(0, xToPx(1) - xToPx(t))} height={VH - PAD.t - PAD.b} fill="var(--c-classification)" fillOpacity={0.07} />

        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <g key={v}>
            <line x1={xToPx(v)} y1={VH - PAD.b} x2={xToPx(v)} y2={VH - PAD.b + 5} stroke="var(--border-strong)" />
            <text x={xToPx(v)} y={VH - PAD.b + 18} fontSize={10} fill="var(--faint)" textAnchor="middle">{v}</text>
          </g>
        ))}
        <text x={(PAD.l + VW - PAD.r) / 2} y={VH - 6} fontSize={10.5} fill="var(--muted)" textAnchor="middle">model score — P(positive)</text>

        {SCORED.map(([p, y], i) => {
          const bucket = Math.round(p * 50);
          const level = seen.get(bucket) ?? 0;
          seen.set(bucket, level + 1);
          const cy = VH - PAD.b - 16 - level * 15;
          const predictedPos = p >= t;
          const wrong = (predictedPos ? 1 : 0) !== y;
          return (
            <g key={i}>
              <circle
                cx={xToPx(p)}
                cy={cy}
                r={5.5}
                fill={y === 1 ? "var(--c-classification)" : "var(--c-regression)"}
                fillOpacity={0.9}
              />
              {wrong && <circle cx={xToPx(p)} cy={cy} r={9} fill="none" stroke="var(--bad)" strokeWidth={1.5} />}
            </g>
          );
        })}

        {/* threshold line */}
        <line x1={xToPx(t)} y1={PAD.t - 8} x2={xToPx(t)} y2={VH - PAD.b} stroke="var(--ink)" strokeWidth={2} />
        <text x={xToPx(t)} y={PAD.t - 14} fontSize={11} fontWeight={600} fill="var(--ink)" textAnchor="middle">cutoff {t.toFixed(2)}</text>
      </svg>

      <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "var(--muted)", marginTop: 10 }}>
        <span style={{ minWidth: 96 }}>threshold = <b style={{ color: "var(--ink)" }}>{t.toFixed(2)}</b></span>
        <input type="range" min={0.02} max={0.98} step={0.01} value={t} onChange={(e) => setT(Number(e.target.value))} style={{ flex: 1, accentColor: "var(--c-classification)" }} aria-label="Classification threshold" />
      </label>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(96px, 1fr))", gap: 8, marginTop: 12 }}>
        <Cell label="true positives" value={tp} color="var(--good)" />
        <Cell label="false positives" value={fp} color="var(--bad)" />
        <Cell label="false negatives" value={fn} color="var(--bad)" />
        <Cell label="true negatives" value={tn} color="var(--good)" />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
        <Metric label="precision" value={Number.isNaN(precision) ? "—" : `${(precision * 100).toFixed(0)}%`} />
        <Metric label="recall" value={Number.isNaN(recall) ? "—" : `${(recall * 100).toFixed(0)}%`} />
        <Metric label="accuracy" value={`${(acc * 100).toFixed(0)}%`} />
      </div>
    </div>
  );
}

function Cell({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ background: `color-mix(in srgb, ${color} 7%, var(--surface-2))`, border: `1px solid color-mix(in srgb, ${color} 18%, var(--border))`, borderRadius: 9, padding: "6px 10px" }}>
      <div style={{ fontSize: 10, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontSize: 17, fontWeight: 600, color: "var(--ink)", fontFamily: "var(--font-geist-mono, monospace)" }}>{value}</div>
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
