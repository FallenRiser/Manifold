"use client";

import { useState } from "react";

// The accuracy trap, made switchable. Three REAL measured strategies on the
// same imbalanced test set (6.8% positives, 61 of 900) from a real run
// (see scripts/logit_tier2b.py): the default 0.5-threshold model, class-weight
// balancing, and simply lowering the threshold. Each shows its confusion matrix
// and the metrics that actually matter when accuracy lies.

type Strat = {
  key: string;
  label: string;
  tn: number; fp: number; fn: number; tp: number;
  note: string;
};

const STRATS: Strat[] = [
  { key: "default", label: "Default · threshold 0.5", tn: 839, fp: 0, fn: 48, tp: 13,
    note: "94.7% accurate — and it catches only 13 of 61 real defaulters. The 'do nothing' baseline of always-ish predicting the majority class scores 93.2%, so this model barely beats it. Perfect precision is cold comfort when recall is 21%." },
  { key: "balanced", label: "class_weight='balanced'", tn: 654, fp: 185, fn: 14, tp: 47,
    note: "Reweighting the loss so each class counts equally: recall jumps to 77% (47 of 61 caught) and AUC improves to 0.848. The price is 185 false alarms — precision falls to 20%. Whether that trade is good depends entirely on what a missed default costs vs a false flag." },
  { key: "threshold", label: "Default model · threshold 0.10", tn: 730, fp: 109, fn: 25, tp: 36,
    note: "Same model, no retraining — just lower the bar for calling 'positive'. Catches 36 of 61 (recall 59%) with 54 false alarms. Reweighting and threshold-lowering are two routes to the same place: trade precision for recall. The threshold route keeps the probabilities honest." },
];

const ACCENT = "var(--c-classification)";

export function ImbalanceLab() {
  const [pick, setPick] = useState(0);
  const s = STRATS[pick];
  const acc = ((s.tn + s.tp) / (s.tn + s.fp + s.fn + s.tp) * 100).toFixed(1);
  const prec = s.tp + s.fp > 0 ? (s.tp / (s.tp + s.fp) * 100).toFixed(0) : "—";
  const rec = (s.tp / (s.tp + s.fn) * 100).toFixed(0);

  return (
    <div style={frame}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <span className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
          6.8% of borrowers default. Catch them.
        </span>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
        {STRATS.map((st, i) => (
          <button
            key={st.key}
            onClick={() => setPick(i)}
            style={{
              border: pick === i ? `1px solid ${ACCENT}` : "1px solid var(--border-strong)",
              cursor: "pointer",
              padding: "6px 12px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: pick === i ? 600 : 400,
              color: pick === i ? "var(--cta-text, var(--surface))" : "var(--muted)",
              background: pick === i ? ACCENT : "transparent",
            }}
          >
            {st.label}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 16, alignItems: "center" }} className="elbow-grid">
        {/* confusion matrix */}
        <div style={{ display: "grid", gridTemplateColumns: "auto auto", gap: 4 }}>
          <Cell v={s.tp} label="caught" color="var(--good)" big />
          <Cell v={s.fn} label="missed" color="var(--bad)" big />
          <Cell v={s.fp} label="false alarm" color="var(--warn)" />
          <Cell v={s.tn} label="correct pass" color="var(--muted)" />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Metric label="accuracy" value={`${acc}%`} dim />
            <Metric label="precision" value={`${prec}%`} />
            <Metric label="recall" value={`${rec}%`} hero />
          </div>
        </div>
      </div>

      <div style={{ marginTop: 12, padding: "9px 12px", borderRadius: 9, fontSize: 12.5, lineHeight: 1.55, color: "var(--muted)", background: `color-mix(in srgb, ${ACCENT} 5%, var(--surface))`, border: `1px solid color-mix(in srgb, ${ACCENT} 20%, var(--border))` }}>
        {s.note}
      </div>
    </div>
  );
}

function Cell({ v, label, color, big }: { v: number; label: string; color: string; big?: boolean }) {
  return (
    <div style={{ background: `color-mix(in srgb, ${color} 8%, var(--surface-2))`, border: `1px solid color-mix(in srgb, ${color} 22%, var(--border))`, borderRadius: 9, padding: "8px 12px", minWidth: 78, textAlign: "center" }}>
      <div style={{ fontSize: big ? 22 : 18, fontWeight: 600, color: "var(--ink)", fontFamily: "var(--font-geist-mono, monospace)" }}>{v}</div>
      <div style={{ fontSize: 10, color: "var(--muted)" }}>{label}</div>
    </div>
  );
}

function Metric({ label, value, hero, dim }: { label: string; value: string; hero?: boolean; dim?: boolean }) {
  return (
    <div style={{ background: hero ? `color-mix(in srgb, ${ACCENT} 10%, var(--surface-2))` : "var(--surface-2)", borderRadius: 9, padding: "6px 12px", opacity: dim ? 0.65 : 1 }}>
      <div style={{ fontSize: 10, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontSize: 17, fontWeight: 600, color: hero ? ACCENT : "var(--ink)", fontFamily: "var(--font-geist-mono, monospace)" }}>{value}</div>
    </div>
  );
}

const frame: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border-strong)",
  borderRadius: 14,
  padding: "16px 16px 14px",
};
