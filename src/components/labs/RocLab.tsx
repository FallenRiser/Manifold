"use client";

import { useState } from "react";

// ROC curve, walkable. Real operating points from a fitted logistic model
// (scripts/logit_tier2c.py: 240-point test set, AUC 0.881). Drag the threshold
// and the point slides along the curve; the shaded area is the AUC. This lab is
// the seed of the Evaluation & Metrics pillar's ROC/PR lab.

// (fpr, tpr, threshold) sampled along the real ROC curve
const PTS: [number, number, number][] = [
  [0.0, 0.0, 1.0], [0.008, 0.267, 0.952], [0.024, 0.431, 0.861], [0.04, 0.569, 0.768],
  [0.073, 0.681, 0.684], [0.105, 0.698, 0.625], [0.113, 0.802, 0.519], [0.153, 0.819, 0.472],
  [0.242, 0.853, 0.417], [0.298, 0.871, 0.38], [0.355, 0.888, 0.29], [0.403, 0.897, 0.272],
  [0.589, 0.914, 0.204], [0.694, 0.931, 0.168], [0.919, 0.974, 0.071], [1.0, 1.0, 0.04],
];
const AUC = 0.881;
const N_POS = 116, N_NEG = 124; // test-set class counts

const ACCENT = "var(--c-classification)";
const S = 300, PAD = 34;

export function RocLab() {
  const [i, setI] = useState(8); // index into the operating points

  const [fpr, tpr, thr] = PTS[i];
  const xToPx = (f: number) => PAD + f * (S - 2 * PAD);
  const yToPx = (t: number) => S - PAD - t * (S - 2 * PAD);
  const curve = PTS.map(([f, t]) => `${xToPx(f)},${yToPx(t)}`).join(" ");
  const area = `${xToPx(0)},${yToPx(0)} ${curve} ${xToPx(1)},${yToPx(0)}`;

  // confusion counts at this operating point
  const tp = Math.round(tpr * N_POS);
  const fn = N_POS - tp;
  const fp = Math.round(fpr * N_NEG);
  const tn = N_NEG - fp;
  const precision = tp + fp > 0 ? tp / (tp + fp) : NaN;

  return (
    <div style={frame}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6, flexWrap: "wrap", gap: 8 }}>
        <span className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
          Walk the ROC curve
        </span>
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>shaded area = AUC = {AUC}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 16, alignItems: "start" }} className="elbow-grid">
        <svg viewBox={`0 0 ${S} ${S}`} style={{ width: "100%", maxWidth: 300, height: "auto", display: "block" }}>
          <rect x={PAD} y={PAD} width={S - 2 * PAD} height={S - 2 * PAD} rx={6} fill="var(--canvas)" stroke="var(--border-strong)" />
          <polygon points={area} fill={ACCENT} fillOpacity={0.1} />
          {/* diagonal = random classifier */}
          <line x1={xToPx(0)} y1={yToPx(0)} x2={xToPx(1)} y2={yToPx(1)} stroke="var(--faint)" strokeDasharray="4 4" />
          <text x={xToPx(0.62)} y={yToPx(0.52)} fontSize={9} fill="var(--faint)" transform={`rotate(-45 ${xToPx(0.62)} ${yToPx(0.52)})`}>random (AUC 0.5)</text>
          <polyline points={curve} fill="none" stroke={ACCENT} strokeWidth={2.5} />
          {/* operating point */}
          <line x1={xToPx(fpr)} y1={S - PAD} x2={xToPx(fpr)} y2={yToPx(tpr)} stroke="var(--brand-2)" strokeWidth={1} strokeDasharray="2 3" />
          <line x1={PAD} y1={yToPx(tpr)} x2={xToPx(fpr)} y2={yToPx(tpr)} stroke="var(--brand-2)" strokeWidth={1} strokeDasharray="2 3" />
          <circle cx={xToPx(fpr)} cy={yToPx(tpr)} r={6} fill="var(--brand-2)" stroke="var(--surface)" strokeWidth={2} />
          {/* axes */}
          <text x={S / 2} y={S - 6} fontSize={10} fill="var(--muted)" textAnchor="middle">false positive rate →</text>
          <text x={11} y={S / 2} fontSize={10} fill="var(--muted)" textAnchor="middle" transform={`rotate(-90 11 ${S / 2})`}>true positive rate →</text>
        </svg>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Metric label="threshold" value={thr.toFixed(2)} />
            <Metric label="recall (TPR)" value={`${(tpr * 100).toFixed(0)}%`} hero />
            <Metric label="FPR" value={`${(fpr * 100).toFixed(0)}%`} />
            <Metric label="precision" value={Number.isNaN(precision) ? "—" : `${(precision * 100).toFixed(0)}%`} />
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>
            Of {N_POS} true positives it catches <b style={{ color: "var(--ink)" }}>{tp}</b> (misses {fn});
            of {N_NEG} negatives it false-alarms on <b style={{ color: "var(--ink)" }}>{fp}</b>.
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "var(--muted)", marginTop: 4 }}>
            <span style={{ minWidth: 68 }}>operating point</span>
            <input type="range" min={0} max={PTS.length - 1} step={1} value={i} onChange={(e) => setI(Number(e.target.value))} style={{ flex: 1, accentColor: ACCENT }} aria-label="ROC operating point" />
          </label>
          <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>
            Slide toward the top-right and you catch more positives (higher recall) but at more false
            alarms. The <b style={{ color: "var(--ink)" }}>curve&rsquo;s shape</b> is the model&rsquo;s quality —
            independent of where you set the threshold. The area under it, {AUC}, is the AUC: the
            chance the model scores a random positive above a random negative.
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, hero }: { label: string; value: string; hero?: boolean }) {
  return (
    <div style={{ background: hero ? `color-mix(in srgb, ${ACCENT} 10%, var(--surface-2))` : "var(--surface-2)", borderRadius: 9, padding: "6px 11px" }}>
      <div style={{ fontSize: 10, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: hero ? ACCENT : "var(--ink)", fontFamily: "var(--font-geist-mono, monospace)" }}>{value}</div>
    </div>
  );
}

const frame: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border-strong)",
  borderRadius: 14,
  padding: "16px 16px 14px",
};
