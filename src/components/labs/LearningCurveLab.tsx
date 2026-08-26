"use client";

import { useState } from "react";

// Learning curves, from REAL measurements. Every number here is a 5-fold
// cross-validated accuracy from scripts/model_selection_cases.py section 4
// (load_digits, sklearn 1.8.0, StratifiedKFold shuffle, RS=0) -- nothing is
// drawn from imagination.
//
// The diagnosis this teaches:
//   * curves CONVERGED with a small gap, at an accuracy another model beats
//     -> approximation-limited. More data buys you nothing; change the model.
//   * curves still SEPARATED, validation still climbing
//     -> estimation-limited. More data is exactly the right lever.
//
// The contrast is honest rather than cartoonish: the weak model is not
// hopeless, it is merely capped, and the capped-ness is visible as a closing
// gap at a ceiling below what the stronger model reaches.

type Curve = { key: string; label: string; note: string; train: number[]; val: number[] };

const SIZES = [143, 467, 790, 1113, 1437];

const CURVES: Curve[] = [
  {
    key: "weak",
    label: "decision tree, depth 2",
    note: "a model capped at four leaves",
    train: [0.4350, 0.3246, 0.3215, 0.3067, 0.3194],
    val: [0.2755, 0.3105, 0.3166, 0.3022, 0.3183],
  },
  {
    key: "good",
    label: "RBF SVC, C = 10",
    note: "a well-matched model",
    train: [0.9916, 0.9931, 0.9957, 0.9948, 0.9923],
    val: [0.7952, 0.9416, 0.9622, 0.9700, 0.9805],
  },
];

const VW = 380, VH = 210, PD = { l: 44, r: 14, t: 16, b: 34 };
const X0 = PD.l, X1 = VW - PD.r, Y0 = VH - PD.b, Y1 = PD.t;
const px = (n: number) => X0 + ((n - SIZES[0]) / (SIZES[SIZES.length - 1] - SIZES[0])) * (X1 - X0);
const py = (a: number) => Y0 - ((a - 0.2) / 0.8) * (Y0 - Y1);

export function LearningCurveLab() {
  const [key, setKey] = useState("weak");
  const [i, setI] = useState(SIZES.length - 1);
  const c = CURVES.find((x) => x.key === key)!;

  const accent = "var(--c-metrics)";
  const gap = c.train[i] - c.val[i];
  // The verdict is about the MODEL, so it always reads the right-hand end of
  // the curve rather than wherever the slider sits. Two conditions, because
  // neither alone is sufficient: the curves must have closed (small gap) AND
  // validation must have stopped climbing. The trailing improvement is measured
  // across two steps, since a single step is noisy enough to reverse sign.
  const last = c.val.length - 1;
  const finalGap = c.train[last] - c.val[last];
  const finalVal = c.val[last];
  const stillClimbing = c.val[last] - c.val[last - 2];
  const capped = finalGap < 0.02 && stillClimbing < 0.005;

  const line = (ys: number[]) =>
    ys.map((a, k) => `${px(SIZES[k]).toFixed(2)},${py(a).toFixed(2)}`).join(" ");

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.6rem 0" }} className="not-prose">
      <div className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", marginBottom: 2 }}>
        Would more data help?
      </div>
      <div style={{ fontSize: 12, color: "var(--faint)", marginBottom: 4 }}>
        real 5-fold CV accuracy on digits · {c.note}
      </div>
      {/* Legend lives outside the plot: both curves end in the top-right corner,
          so any in-SVG label there collides with the data. */}
      <div style={{ display: "flex", gap: 14, fontSize: 11, marginBottom: 8 }}>
        <span style={{ color: "var(--ink)" }}>▬ train</span>
        <span style={{ color: "var(--brand-2)" }}>▬ validation</span>
      </div>

      <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", maxWidth: VW, height: "auto", display: "block" }}>
        <rect x={X0} y={Y1} width={X1 - X0} height={Y0 - Y1} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />

        {/* the gap at the selected sample size */}
        <line x1={px(SIZES[i])} y1={py(c.train[i])} x2={px(SIZES[i])} y2={py(c.val[i])} stroke={accent} strokeWidth={6} opacity={0.28} strokeLinecap="round" />

        <polyline points={line(c.train)} fill="none" stroke="var(--ink)" strokeWidth={2} />
        <polyline points={line(c.val)} fill="none" stroke="var(--brand-2)" strokeWidth={2} />

        {SIZES.map((n, k) => (
          <g key={n}>
            <circle cx={Number(px(n).toFixed(2))} cy={Number(py(c.train[k]).toFixed(2))} r={k === i ? 4.5 : 3} fill="var(--ink)" />
            <circle cx={Number(px(n).toFixed(2))} cy={Number(py(c.val[k]).toFixed(2))} r={k === i ? 4.5 : 3} fill="var(--brand-2)" />
          </g>
        ))}

        {[0.2, 0.4, 0.6, 0.8, 1.0].map((v) => (
          <text key={v} x={X0 - 6} y={py(v) + 3.5} fontSize={9.5} fill="var(--faint)" textAnchor="end">{v.toFixed(1)}</text>
        ))}
        <text x={X0 - 33} y={Y1 + 46} fontSize={9.5} fill="var(--muted)" transform={`rotate(-90 ${X0 - 33} ${Y1 + 46})`}>accuracy</text>
        {SIZES.map((n) => (
          <text key={n} x={px(n)} y={Y0 + 14} fontSize={9} fill="var(--faint)" textAnchor="middle">{n}</text>
        ))}
        <text x={(X0 + X1) / 2} y={Y0 + 27} fontSize={10} fill="var(--muted)" textAnchor="middle">training examples</text>
      </svg>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
        {CURVES.map((x) => (
          <button
            key={x.key}
            onClick={() => setKey(x.key)}
            style={{
              background: key === x.key ? `color-mix(in srgb, ${accent} 15%, var(--surface))` : "transparent",
              color: key === x.key ? "var(--ink)" : "var(--muted)",
              border: `1px solid ${key === x.key ? `color-mix(in srgb, ${accent} 40%, var(--border))` : "var(--border-strong)"}`,
              fontSize: 12, padding: "5px 10px", borderRadius: 8, cursor: "pointer",
            }}
          >
            {x.label}
          </button>
        ))}
      </div>

      <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginTop: 10 }}>
        inspect at n = {SIZES[i]}
        <input type="range" min={0} max={SIZES.length - 1} step={1} value={i} onChange={(e) => setI(Number(e.target.value))} style={{ width: "100%", accentColor: accent }} />
      </label>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12, alignItems: "center" }}>
        <Metric label={`gap at n = ${SIZES[i]}`} value={gap.toFixed(4)} accent={accent} big />
        <Metric label="validation at full data" value={finalVal.toFixed(4)} />
        <Metric
          label="diagnosis"
          value={capped ? "approximation-limited" : "estimation-limited"}
          accent={capped ? "var(--bad)" : "var(--good)"}
          sub={capped ? "more data won't help" : "more data will help"}
        />
      </div>
    </div>
  );
}

function Metric({ label, value, sub, accent, big }: { label: string; value: string; sub?: string; accent?: string; big?: boolean }) {
  return (
    <div style={{ background: "var(--surface-2)", borderRadius: 10, padding: "6px 10px", minWidth: 92 }}>
      <div style={{ fontSize: 10.5, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontSize: big ? 19 : 13.5, fontWeight: 500, color: accent ?? "var(--ink)" }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: "var(--faint)" }}>{sub}</div>}
    </div>
  );
}
