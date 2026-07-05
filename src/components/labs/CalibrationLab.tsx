"use client";

import { useState } from "react";

// Reliability diagram, real curves. Two models on the same 4000-point test set
// (scripts logit_tier2c calibration run, 20 features, 10 correlated): logistic
// regression sits on the diagonal (well calibrated, Brier 0.092); Gaussian
// naive Bayes double-counts the correlated features and is wildly overconfident
// (Brier 0.130 — says 1.0 when the truth is ~0.8). Toggle to feel the gap.

const MODELS = {
  logistic: {
    label: "Logistic regression",
    brier: 0.092,
    extreme: 39, // % of predictions beyond [0.05, 0.95]
    pred: [0.01, 0.04, 0.08, 0.16, 0.35, 0.63, 0.84, 0.93, 0.98, 0.99],
    obs: [0.02, 0.03, 0.06, 0.12, 0.36, 0.73, 0.85, 0.91, 0.96, 0.98],
    note: "Logistic regression is calibrated almost by construction: it directly minimizes log loss, a proper scoring rule, so the probabilities it emits match observed frequencies. When it says 0.8, about 80% of those cases really are positive — the points hug the diagonal.",
  },
  nb: {
    label: "Naive Bayes",
    brier: 0.130,
    extreme: 89,
    pred: [0.0, 0.0, 0.0, 0.0, 0.07, 0.79, 1.0, 1.0, 1.0, 1.0],
    obs: [0.02, 0.05, 0.12, 0.16, 0.39, 0.62, 0.79, 0.92, 0.96, 0.98],
    note: "Naive Bayes assumes features are independent; here 10 of them are correlated, so it counts the same evidence ten times and becomes wildly overconfident. It slams predictions to 0.0 and 1.0 — but when it says 1.0, only ~80–96% are actually positive. 89% of its predictions are past 0.05/0.95. Accurate ranking, dishonest probabilities.",
  },
} as const;

const ACCENT = "var(--c-classification)";
const S = 300, PAD = 36;

export function CalibrationLab() {
  const [which, setWhich] = useState<keyof typeof MODELS>("logistic");
  const m = MODELS[which];

  const xToPx = (v: number) => PAD + v * (S - 2 * PAD);
  const yToPx = (v: number) => S - PAD - v * (S - 2 * PAD);

  return (
    <div style={frame}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <span className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
          Does 0.8 really mean 80%?
        </span>
        <div style={{ display: "inline-flex", border: "1px solid var(--border-strong)", borderRadius: 9, overflow: "hidden" }}>
          {(Object.keys(MODELS) as (keyof typeof MODELS)[]).map((k) => (
            <button key={k} onClick={() => setWhich(k)}
              style={{ border: "none", cursor: "pointer", padding: "6px 12px", fontSize: 12,
                fontWeight: which === k ? 600 : 400,
                color: which === k ? "var(--cta-text, var(--surface))" : "var(--muted)",
                background: which === k ? ACCENT : "transparent" }}>
              {MODELS[k].label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 16, alignItems: "start" }} className="elbow-grid">
        <svg viewBox={`0 0 ${S} ${S}`} style={{ width: "100%", maxWidth: 300, height: "auto", display: "block" }}>
          <rect x={PAD} y={PAD} width={S - 2 * PAD} height={S - 2 * PAD} rx={6} fill="var(--canvas)" stroke="var(--border-strong)" />
          {/* perfect-calibration diagonal */}
          <line x1={xToPx(0)} y1={yToPx(0)} x2={xToPx(1)} y2={yToPx(1)} stroke="var(--faint)" strokeDasharray="4 4" />
          <text x={xToPx(0.66)} y={yToPx(0.72)} fontSize={9} fill="var(--faint)" transform={`rotate(-45 ${xToPx(0.66)} ${yToPx(0.72)})`}>perfectly calibrated</text>
          {/* reliability curve */}
          <polyline points={m.pred.map((p, i) => `${xToPx(p)},${yToPx(m.obs[i])}`).join(" ")} fill="none" stroke={ACCENT} strokeWidth={2.5} />
          {m.pred.map((p, i) => (
            <circle key={i} cx={xToPx(p)} cy={yToPx(m.obs[i])} r={3.5} fill={ACCENT} />
          ))}
          <text x={S / 2} y={S - 8} fontSize={10} fill="var(--muted)" textAnchor="middle">predicted probability →</text>
          <text x={12} y={S / 2} fontSize={10} fill="var(--muted)" textAnchor="middle" transform={`rotate(-90 12 ${S / 2})`}>observed frequency →</text>
        </svg>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Metric label="Brier score (lower = better)" value={m.brier.toFixed(3)} />
            <Metric label="predictions beyond 0.05/0.95" value={`${m.extreme}%`} />
          </div>
          <div style={{ padding: "9px 12px", borderRadius: 9, fontSize: 12.5, lineHeight: 1.55, color: "var(--muted)", background: `color-mix(in srgb, ${ACCENT} 5%, var(--surface))`, border: `1px solid color-mix(in srgb, ${ACCENT} 20%, var(--border))` }}>
            {m.note}
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "var(--surface-2)", borderRadius: 9, padding: "6px 11px" }}>
      <div style={{ fontSize: 10, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)", fontFamily: "var(--font-geist-mono, monospace)" }}>{value}</div>
    </div>
  );
}

const frame: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border-strong)",
  borderRadius: 14,
  padding: "16px 16px 14px",
};
