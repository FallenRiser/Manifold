"use client";

import { useState } from "react";

// Measured from scripts/naive_bayes_cases.py section 2. The same GaussianNB,
// with the whole feature vector duplicated k times. Duplicating evidence the
// model wrongly treats as independent multiplies the log-odds by k: the SIGN
// (the decision) is unchanged, so accuracy is exactly constant, but the
// probability saturates toward certainty. The spine of the whole track.

type Row = { k: number; acc: number; conf: number; logloss: number; brier: number };

const ROWS: Row[] = [
  { k: 1, acc: 0.975, conf: 0.990, logloss: 0.186, brier: 0.023 },
  { k: 2, acc: 0.975, conf: 0.996, logloss: 0.354, brier: 0.023 },
  { k: 4, acc: 0.975, conf: 0.998, logloss: 0.589, brier: 0.023 },
  { k: 8, acc: 0.975, conf: 0.999, logloss: 0.670, brier: 0.024 },
  { k: 16, acc: 0.975, conf: 1.0, logloss: 0.756, brier: 0.025 },
];

const accent = "var(--c-classification)";

function Gauge({ label, value, display, fill, note }: {
  label: string; value: number; display: string; fill: string; note: string;
}) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
        <span style={{ fontSize: 12.5, color: "var(--muted)" }}>{label}</span>
        <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 15, fontWeight: 700, color: fill, fontVariantNumeric: "tabular-nums" }}>{display}</span>
      </div>
      <div style={{ height: 12, background: "var(--bg-offset)", borderRadius: 6, overflow: "hidden" }}>
        <div style={{ width: `${value * 100}%`, height: "100%", background: fill, borderRadius: 6, transition: "width 0.35s ease" }} />
      </div>
      <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 3 }}>{note}</div>
    </div>
  );
}

export function NaiveBayesConfidenceLab() {
  const [idx, setIdx] = useState(0);
  const r = ROWS[idx];
  // log-loss mapped onto a 0..1 bar against a 0.8 ceiling for the visual
  const llFrac = Math.min(1, r.logloss / 0.8);

  return (
    <div>
      <div style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 10 }}>
        Duplicate the whole feature vector so the model sees the same evidence several times over,
        as if each copy were independent. Watch what moves and what does not.
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        {ROWS.map((row, i) => (
          <button
            key={row.k}
            onClick={() => setIdx(i)}
            style={{
              padding: "5px 14px", borderRadius: 6, fontSize: 13, fontWeight: 500,
              border: `1px solid ${idx === i ? accent : "var(--border)"}`,
              background: idx === i ? accent : "transparent",
              color: idx === i ? "#fff" : "var(--muted)",
              cursor: "pointer", fontVariantNumeric: "tabular-nums",
            }}
          >
            {row.k}×
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gap: 16 }}>
        <Gauge
          label="Test accuracy — the decision"
          value={r.acc}
          display={r.acc.toFixed(3)}
          fill="var(--good)"
          note="Flat at 0.975. The sign of the log-odds never changes, so the classifier is exactly as right."
        />
        <Gauge
          label="Mean confidence — the claimed probability"
          value={r.conf}
          display={r.conf.toFixed(3)}
          fill={accent}
          note="Climbs toward 1.000 — the model becomes certain of decisions it gets wrong 2.5% of the time."
        />
        <Gauge
          label="Log-loss — the cost of that false certainty"
          value={llFrac}
          display={r.logloss.toFixed(3)}
          fill="var(--bad)"
          note={`${(r.logloss / 0.186).toFixed(1)}× the honest value. Confident mistakes are punished hardest.`}
        />
      </div>

      <div style={{ marginTop: 16, padding: "11px 14px", background: "var(--bg-offset)", borderRadius: 8, fontSize: 13, lineHeight: 1.55 }}>
        {r.k === 1 ? (
          <>One copy: an honest GaussianNB. It is right <strong>97.5%</strong> of the time and, on average, <strong>99.0%</strong> confident — already a little overconfident.</>
        ) : (
          <>
            <strong style={{ color: accent }}>{r.k}× the same evidence.</strong> Accuracy is <strong>unchanged</strong> at 0.975,
            but average confidence is now <strong>{r.conf.toFixed(3)}</strong> and log-loss has grown to{" "}
            <strong>{r.logloss.toFixed(3)}</strong>. The naive independence assumption double-counts the evidence:
            the <em>decision</em> survives, the <em>probability</em> does not.
          </>
        )}
      </div>
    </div>
  );
}
