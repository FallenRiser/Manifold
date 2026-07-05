"use client";

import { useState } from "react";

// Cost-sensitive thresholding. Real operating points from the same fitted model
// as RocLab (scripts/logit_tier2c.py; 116 positives, 124 negatives in the test
// set). Set how much worse a miss (false negative) is than a false alarm and
// the lab picks the expected-cost-minimizing threshold — and shows the theory
// optimum t* = C_fp / (C_fp + C_fn) for a calibrated model landing right on it.
const PTS: [number, number, number][] = [
  [0.0, 0.0, 1.0], [0.008, 0.267, 0.952], [0.024, 0.431, 0.861], [0.04, 0.569, 0.768],
  [0.073, 0.681, 0.684], [0.105, 0.698, 0.625], [0.113, 0.802, 0.519], [0.153, 0.819, 0.472],
  [0.242, 0.853, 0.417], [0.298, 0.871, 0.38], [0.355, 0.888, 0.29], [0.403, 0.897, 0.272],
  [0.589, 0.914, 0.204], [0.694, 0.931, 0.168], [0.919, 0.974, 0.071], [1.0, 1.0, 0.04],
];
const N_POS = 116, N_NEG = 124;
const ACCENT = "var(--c-classification)";

export function CostLab() {
  const [ratio, setRatio] = useState(5); // how many times worse a miss is than a false alarm

  const cFn = ratio, cFp = 1;
  const tStar = cFp / (cFp + cFn); // theoretical optimal threshold (calibrated)

  // read the real operating point AT that threshold (nearest sampled ROC point);
  // this keeps the lab consistent with the t* formula rather than letting the
  // coarse grid collapse to a degenerate flag-everyone corner at extreme ratios.
  let best = 0, bestGap = Infinity;
  PTS.forEach(([, , t], i) => {
    const gap = Math.abs(t - tStar);
    if (gap < bestGap) { bestGap = gap; best = i; }
  });
  const [fpr, tpr] = PTS[best];
  const fn = Math.round((1 - tpr) * N_POS);
  const fp = Math.round(fpr * N_NEG);
  const bestCost = cFn * fn + cFp * fp;

  return (
    <div style={frame}>
      <div className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", marginBottom: 12 }}>
        How much is a miss worth?
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13, color: "var(--muted)" }}>
        <span style={{ minWidth: 230 }}>
          a missed default costs <b style={{ color: "var(--ink)" }}>{ratio}×</b> a false alarm
        </span>
        <input type="range" min={1} max={20} step={1} value={ratio} onChange={(e) => setRatio(Number(e.target.value))} style={{ flex: 1, accentColor: ACCENT }} aria-label="Cost ratio" />
      </label>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14, alignItems: "center" }}>
        <Metric label="optimal threshold t*" value={tStar.toFixed(2)} hero />
        <span style={{ fontSize: 18, color: "var(--faint)" }}>→</span>
        <Metric label="missed defaults" value={`${fn}`} />
        <Metric label="false alarms" value={`${fp}`} />
        <Metric label="total cost" value={`${bestCost}`} />
      </div>

      <div style={{ marginTop: 12, padding: "9px 12px", borderRadius: 9, fontSize: 12.5, lineHeight: 1.55, color: "var(--muted)", background: `color-mix(in srgb, ${ACCENT} 5%, var(--surface))`, border: `1px solid color-mix(in srgb, ${ACCENT} 20%, var(--border))` }}>
        {ratio === 1 ? (
          <>With equal costs the optimal threshold is the familiar <b style={{ color: "var(--ink)" }}>0.50</b> — no reason to
          favour either mistake. As you raise the cost of a miss, <M>{`t^*`}</M> slides down and the model flags more
          borrowers: fewer missed defaults, more false alarms. That&rsquo;s the trade, priced.</>
        ) : (
          <>A miss is now {ratio}× as costly, so the model should be {ratio === 20 ? "extremely" : "more"} eager to flag:
          the optimal threshold drops to <b style={{ color: "var(--ink)" }}>{tStar.toFixed(2)}</b>, cutting misses to{" "}
          <b style={{ color: "var(--ink)" }}>{fn}</b> while accepting <b style={{ color: "var(--ink)" }}>{fp}</b> false
          alarms. The formula <M>{`t^* = C_{fp}/(C_{fp}+C_{fn})`}</M> falls straight out of minimizing expected cost —
          and it only works because logistic&rsquo;s probabilities are calibrated.</>
        )}
      </div>
    </div>
  );
}

// tiny inline math-ish span (keeps the lab self-contained)
function M({ children }: { children: string }) {
  return <span style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: "0.92em" }}>{children}</span>;
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
