"use client";

import { useState } from "react";

// Measured from scripts/naive_bayes_cases.py section 5. MultinomialNB on a
// sparse synthetic corpus (1000-word vocab, 20-word docs, 200 training docs,
// so ~half of all words are unseen with each class in training). Sweeping the
// Laplace smoothing strength alpha: too little over-trusts the empty cells,
// too much washes the signal out.

type Row = { alpha: number; label: string; acc: number };

const ROWS: Row[] = [
  { alpha: 1e-10, label: "~0", acc: 0.630 },
  { alpha: 1e-4, label: "1e-4", acc: 0.640 },
  { alpha: 1e-2, label: "0.01", acc: 0.730 },
  { alpha: 0.1, label: "0.1", acc: 0.805 },
  { alpha: 0.5, label: "0.5", acc: 0.850 },
  { alpha: 1.0, label: "1.0", acc: 0.870 },
  { alpha: 2.0, label: "2.0", acc: 0.865 },
  { alpha: 5.0, label: "5.0", acc: 0.860 },
];

const accent = "var(--c-classification)";
const best = Math.max(...ROWS.map((r) => r.acc));
const LO = 0.5; // chance level for this 2-class task — bars start here

export function SmoothingLab() {
  const [sel, setSel] = useState<number>(5); // default to the peak (alpha=1.0)

  return (
    <div>
      <div style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 12 }}>
        Test accuracy of MultinomialNB on a sparse text corpus as the smoothing strength{" "}
        <span style={{ fontStyle: "italic" }}>α</span> varies. Bars start at chance (0.50). Click one.
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 180, borderBottom: "2px solid var(--border-strong)", padding: "0 2px" }}>
        {ROWS.map((r, i) => {
          const h = ((r.acc - LO) / (best - LO)) * 100;
          const isSel = sel === i;
          const isPeak = r.acc === best;
          const tiny = r.alpha < 1e-3;
          return (
            <div key={i} onClick={() => setSel(i)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%", cursor: "pointer" }}>
              <div style={{ fontSize: 10.5, color: isSel ? accent : "var(--faint)", fontVariantNumeric: "tabular-nums", marginBottom: 3, fontWeight: isSel || isPeak ? 700 : 400 }}>{r.acc.toFixed(3)}</div>
              <div
                style={{
                  width: "80%", height: `${Math.max(2, h)}%`,
                  background: tiny ? "var(--bad)" : isPeak ? "var(--good)" : accent,
                  opacity: isSel ? 1 : 0.72,
                  borderRadius: "3px 3px 0 0",
                  outline: isSel ? `2px solid ${accent}` : "none",
                  transition: "opacity 0.2s",
                }}
              />
              <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 4, fontVariantNumeric: "tabular-nums" }}>{r.label}</div>
            </div>
          );
        })}
      </div>
      <div style={{ textAlign: "center", fontSize: 11, color: "var(--faint)", marginTop: 5 }}>
        smoothing strength α  (Laplace / additive)
      </div>

      <div style={{ marginTop: 14, padding: "11px 14px", background: "var(--bg-offset)", borderRadius: 8, fontSize: 13, lineHeight: 1.55 }}>
        {ROWS[sel].alpha < 1e-3 ? (
          <><strong style={{ color: "var(--bad)" }}>α ≈ 0 → accuracy {ROWS[sel].acc.toFixed(3)}.</strong> With almost no smoothing, every
            word unseen with a class in training gets a near-zero likelihood and vetoes that class. On sparse
            text half the vocabulary is unseen per class, so the classifier is crippled — barely above chance.</>
        ) : ROWS[sel].acc === best ? (
          <><strong style={{ color: "var(--good)" }}>α = {ROWS[sel].label} → accuracy {ROWS[sel].acc.toFixed(3)}.</strong> The sweet spot:
            enough smoothing to survive unseen words, not so much that it drowns the signal. This is why the
            default is α = 1.</>
        ) : (
          <><strong style={{ color: accent }}>α = {ROWS[sel].label} → accuracy {ROWS[sel].acc.toFixed(3)}.</strong> {ROWS[sel].alpha > 1
            ? "Heavy smoothing pulls every word toward uniform and washes out the signature words — a gentle decline."
            : "Climbing out of the zero-frequency hole as smoothing fills the empty cells."}</>
        )}
      </div>
    </div>
  );
}
