"use client";

import { useMemo, useState } from "react";
import { boundarySegment, halfPlanePolygon } from "./halfplane";

// The perceptron learning rule, stepped one update at a time.
//
// The rule is run HERE, in the component, with the same starting point, the
// same learning rate and the same point order as
// scripts/perceptron_mlp_cases.py section 1 -- so the trajectory the reader
// walks is the trajectory the script measured (30 updates to convergence on
// the separable set), and it cannot drift from the prose.
//
// Two things the reader should catch, neither of which survives being asserted:
//   1. accuracy is NOT monotone. The rule fixes one point at a time and will
//      happily wreck three others doing it.
//   2. move ONE point across and the same rule never stops. The convergence
//      theorem is not a promise about learning; it is a promise conditional on
//      an assumption you usually cannot check.

const POS: [number, number][] = [
  [5.3, 8.5], [2.1, 6.8], [4.9, 8.1], [4.1, 8.1], [2.8, 6.0], [1.7, 7.7],
  [4.6, 7.4], [1.7, 5.6], [3.4, 6.4], [2.6, 8.5], [6.0, 8.4], [4.5, 8.6],
];
const NEG: [number, number][] = [
  [6.1, 3.2], [1.3, 1.1], [7.5, 1.0], [7.9, 1.3], [6.8, 2.4], [7.9, 5.3],
  [6.4, 6.2], [5.9, 4.1], [9.0, 8.8], [6.5, 6.2], [6.5, 4.1], [5.2, 3.5],
];
const MOVED: [number, number] = [7.0, 2.0];   // POS[0], dragged into the far cloud

const LR = 0.5;
const W0: [number, number, number] = [2, -1, 0];   // deliberately wrong to start
const MAX_UPDATES = 60;

type Step = { w1: number; w2: number; b: number; acc: number; hit: number | null };

function run(separable: boolean): Step[] {
  const pos = separable ? POS : [MOVED, ...POS.slice(1)];
  const pts: [number, number, number][] = [
    ...pos.map(([x, y]) => [x, y, 1] as [number, number, number]),
    ...NEG.map(([x, y]) => [x, y, -1] as [number, number, number]),
  ];
  let [w1, w2, b] = W0;
  const acc = () =>
    pts.filter(([x, y, t]) => (w1 * x + w2 * y + b > 0 ? 1 : -1) === t).length / pts.length;

  const out: Step[] = [{ w1, w2, b, acc: acc(), hit: null }];
  for (let epoch = 0; epoch < 100 && out.length <= MAX_UPDATES; epoch++) {
    let errors = 0;
    for (let i = 0; i < pts.length && out.length <= MAX_UPDATES; i++) {
      const [x, y, t] = pts[i];
      if (t * (w1 * x + w2 * y + b) <= 0) {
        w1 += LR * t * x;
        w2 += LR * t * y;
        b += LR * t;
        errors++;
        out.push({ w1, w2, b, acc: acc(), hit: i });
      }
    }
    if (errors === 0) break;
  }
  return out;
}

const VW = 380, VH = 250, PD = { l: 30, r: 12, t: 12, b: 26 };
const X0 = PD.l, X1 = VW - PD.r, Y0 = VH - PD.b, Y1 = PD.t;
const LO = 0, HI = 10;
const px = (x: number) => X0 + ((x - LO) / (HI - LO)) * (X1 - X0);
const py = (y: number) => Y0 - ((y - LO) / (HI - LO)) * (Y0 - Y1);
const accent = "var(--c-neural)";

export function PerceptronRuleLab() {
  const [separable, setSeparable] = useState(true);
  const [i, setI] = useState(0);

  const steps = useMemo(() => run(separable), [separable]);
  const k = Math.min(i, steps.length - 1);
  const s = steps[k];
  const converged = separable && steps[steps.length - 1].acc === 1;
  const pos = separable ? POS : [MOVED, ...POS.slice(1)];

  const seg = boundarySegment(s.w1, s.w2, s.b, LO, HI);
  const line = seg
    ? `${px(seg[0][0]).toFixed(2)},${py(seg[0][1]).toFixed(2)} ${px(seg[1][0]).toFixed(2)},${py(seg[1][1]).toFixed(2)}`
    : null;
  const region = halfPlanePolygon(s.w1, s.w2, s.b, LO, HI)
    .map(([x, y]) => `${px(x).toFixed(2)},${py(y).toFixed(2)}`)
    .join(" ");

  // the point this update was triggered by
  const hitPt = s.hit === null ? null
    : s.hit < pos.length ? pos[s.hit] : NEG[s.hit - pos.length];

  const W = 300, H = 62;
  const trace = steps.map((st, j) =>
    `${(6 + (j / (steps.length - 1)) * (W - 12)).toFixed(2)},${(H - 8 - st.acc * (H - 20)).toFixed(2)}`,
  ).join(" ");

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.6rem 0" }} className="not-prose">
      <div className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", marginBottom: 2 }}>
        One update at a time
      </div>
      <div style={{ fontSize: 12, color: "var(--faint)", marginBottom: 10 }}>
        start w = (2, −1), b = 0 · learning rate 0.5 · a step happens only on a mistake
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
        <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", maxWidth: VW, height: "auto", display: "block", flex: "1 1 300px" }}>
          <defs>
            <clipPath id="rule-clip">
              <rect x={X0} y={Y1} width={X1 - X0} height={Y0 - Y1} rx={8} />
            </clipPath>
          </defs>
          <rect x={X0} y={Y1} width={X1 - X0} height={Y0 - Y1} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
          <g clipPath="url(#rule-clip)">
            {region && <polygon points={region} fill={accent} opacity={0.09} />}
            {line && <polyline points={line} fill="none" stroke={accent} strokeWidth={2.4} />}
          </g>

          {NEG.map(([x, y], j) => (
            <circle key={`n${j}`} cx={Number(px(x).toFixed(2))} cy={Number(py(y).toFixed(2))} r={4}
              fill="var(--canvas)" stroke="var(--ink)" strokeWidth={1.3}
              opacity={s.w1 * x + s.w2 * y + s.b <= 0 ? 1 : 0.3} />
          ))}
          {pos.map(([x, y], j) => (
            <circle key={`p${j}`} cx={Number(px(x).toFixed(2))} cy={Number(py(y).toFixed(2))} r={4.4}
              fill={accent} stroke={accent} strokeWidth={1.3}
              opacity={s.w1 * x + s.w2 * y + s.b > 0 ? 1 : 0.3} />
          ))}

          {hitPt && (
            <circle cx={Number(px(hitPt[0]).toFixed(2))} cy={Number(py(hitPt[1]).toFixed(2))} r={9}
              fill="none" stroke="var(--bad)" strokeWidth={1.8} />
          )}
        </svg>

        <div style={{ flex: "1 1 230px", minWidth: 210 }}>
          <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>
            update {k} of {steps.length - 1}
            <input
              type="range" min={0} max={steps.length - 1} step={1} value={k}
              onChange={(e) => setI(Number(e.target.value))}
              style={{ width: "100%", marginTop: 4, accentColor: "var(--c-neural)" }}
            />
          </label>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <div style={{ background: "var(--surface-2)", borderRadius: 10, padding: "6px 10px", flex: "1 1 92px" }}>
              <div style={{ fontSize: 10.5, color: "var(--muted)" }}>accuracy</div>
              <div style={{ fontSize: 19, fontWeight: 500, color: s.acc === 1 ? "var(--good)" : "var(--ink)" }}>
                {(s.acc * 100).toFixed(1)}%
              </div>
            </div>
            <div style={{ background: "var(--surface-2)", borderRadius: 10, padding: "6px 10px", flex: "1 1 120px" }}>
              <div style={{ fontSize: 10.5, color: "var(--muted)" }}>w₁, w₂, b</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
                {s.w1.toFixed(2)}, {s.w2.toFixed(2)}, {s.b.toFixed(2)}
              </div>
            </div>
          </div>

          {/* accuracy against update number -- the non-monotonicity is the point */}
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", marginTop: 10, display: "block" }}>
            <line x1={6} y1={H - 8} x2={W - 6} y2={H - 8} stroke="var(--border-strong)" strokeWidth={1} />
            <line x1={6} y1={H - 8 - (H - 20)} x2={W - 6} y2={H - 8 - (H - 20)} stroke="var(--border)" strokeWidth={1} strokeDasharray="3 3" />
            <text x={W - 4} y={H - 8 - (H - 20) - 3} fontSize={8} fill="var(--faint)" textAnchor="end">100%</text>
            <polyline points={trace} fill="none" stroke="var(--muted)" strokeWidth={1.4} />
            <circle
              cx={(6 + (k / (steps.length - 1)) * (W - 12)).toFixed(2)}
              cy={(H - 8 - s.acc * (H - 20)).toFixed(2)}
              r={3.4} fill={accent}
            />
          </svg>

          <button
            onClick={() => { setSeparable((v) => !v); setI(0); }}
            style={{
              marginTop: 8,
              background: `color-mix(in srgb, ${accent} 15%, var(--surface))`,
              color: "var(--ink)",
              border: `1px solid color-mix(in srgb, ${accent} 40%, var(--border))`,
              fontSize: 12, padding: "5px 10px", borderRadius: 8, cursor: "pointer",
            }}
          >
            {separable ? "Move one point across →" : "← Put it back"}
          </button>

          <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 8, lineHeight: 1.5 }}>
            {separable
              ? converged
                ? `Separable: the rule stops after ${steps.length - 1} updates, with every point correct.`
                : "Separable — drag to the end and it settles."
              : `Not separable: still running at update ${MAX_UPDATES}, and it will run forever. One point broke the guarantee.`}
          </div>
        </div>
      </div>
    </div>
  );
}
