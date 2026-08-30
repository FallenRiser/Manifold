"use client";

import { useState } from "react";

// Units dying, counted step by step, from section 3 of
// scripts/activation_cases.py: two moons (600 points, noise 0.25), a
// 2-32-32-1 network with He init, plain SGD at lr = 3.0, 800 steps.
//
// A unit is counted dead when its derivative is below 1e-3 for EVERY row in the
// training set -- the condition under which no update of any size can reach the
// weights that feed it. That definition works for every activation here, which
// is what makes the comparison fair: ELU and Swish can saturate too, they just
// need a much larger input to do it.
//
// Two things in this data cut against the usual telling and are kept because
// they are true. ReLU lost 19 units of 64 and still scored the second-best test
// accuracy of the five. And ELU -- one of the functions sold as the answer to
// dying ReLU -- is the only one that failed outright at this learning rate.

type Run = { key: string; label: string; dead: number[]; curve: number[]; acc: number; final: number; note: string };

const RUNS: Run[] = [
  {
    key: "relu", label: "ReLU", acc: 0.9190, final: 0.0828,
    dead: [6, 24, 20, 21, 20, 19, 19, 20, 20, 20, 19, 19, 18, 18, 18, 18, 18, 18, 18, 19],
    curve: [0.7507, 0.2832, 0.1354, 0.1417, 0.1106, 0.0913, 0.0905, 0.0844, 0.0893, 0.0909, 0.0886, 0.0846, 0.0918, 0.0823, 0.0803, 0.0887, 0.079, 0.0743, 0.0848, 0.0785],
    note: "Six units are already off at initialisation — that is normal, and reversible. The damage happens in the first forty steps: 24 units dead, and the count never recovers below 18. Yet the loss keeps falling and the test accuracy is the second best here. Losing 30% of the network cost almost nothing, because the survivors were enough.",
  },
  {
    key: "leaky", label: "Leaky ReLU", acc: 0.9095, final: 0.0843,
    dead: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    curve: [0.745, 0.327, 0.1189, 0.1224, 0.1004, 0.1074, 0.0979, 0.1036, 0.0932, 0.085, 0.0974, 0.0905, 0.0853, 0.0821, 0.0991, 0.0832, 0.0803, 0.0781, 0.0837, 0.0935],
    note: "Flat at zero for the whole run, and not by luck: with a negative slope of 0.01 the derivative is never zero anywhere, so the count cannot rise. This is the one activation on the page for which death is impossible by construction — and it bought no accuracy at all over ReLU.",
  },
  {
    key: "elu", label: "ELU", acc: 0.5000, final: 13.8155,
    dead: [0, 49, 49, 49, 49, 49, 49, 49, 49, 49, 49, 49, 49, 49, 49, 49, 49, 49, 49, 49],
    curve: [0.6124, 13.8155, 13.8155, 13.8155, 13.8155, 13.8155, 13.8155, 13.8155, 13.8155, 13.8155, 13.8155, 13.8155, 13.8155, 13.8155, 13.8155, 13.8155, 13.8155, 13.8155, 13.8155, 13.8155],
    note: "Read this one carefully. Within the first forty steps the loss jumped from 0.61 to 13.8 and 49 of the 64 units landed in ELU's saturated negative tail, where the derivative decays to zero — and nothing moved again for the remaining 760 steps. ELU is often sold as the answer to dying ReLU, and at this step size it is the only one of the five that failed outright. Removing the flat half of ReLU is not the same as removing every way for a unit to stop responding.",
  },
  {
    key: "gelu", label: "GELU", acc: 0.9048, final: 0.0852,
    dead: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    curve: [0.6486, 0.187, 0.1122, 0.1031, 0.0976, 0.0969, 0.0971, 0.0974, 0.0972, 0.0963, 0.0952, 0.0941, 0.0932, 0.0923, 0.0914, 0.0905, 0.0895, 0.0885, 0.0875, 0.0864],
    note: "No deaths, and the smoothest loss curve of the five. GELU's slope is never exactly zero for a finite input, so a unit pushed far negative keeps a tiny channel back — small, but not the exact zero that makes the damage permanent.",
  },
  {
    key: "swish", label: "Swish", acc: 0.9238, final: 0.0912,
    dead: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    curve: [0.6004, 0.1175, 0.1139, 0.1082, 0.1066, 0.1048, 0.1037, 0.1027, 0.1019, 0.1012, 0.1006, 0.1, 0.099, 0.1068, 0.0966, 0.0969, 0.0954, 0.094, 0.0935, 0.0923],
    note: "No deaths and the best test accuracy — by 0.0048 over ReLU, which is one test example out of 210. That is the honest size of the win here, and it is worth remembering when a paper reports a difference of that order.",
  },
];

// ReLU alone, across learning rates (section 3, first table). Dying is not a
// property of ReLU; it is a property of ReLU AND a step size.
const SWEEP = [
  { lr: "0.1", dead: 4, loss: "0.1519", acc: "0.9095" },
  { lr: "1.0", dead: 5, loss: "0.0893", acc: "0.9095" },
  { lr: "3.0", dead: 19, loss: "0.0828", acc: "0.9190" },
  { lr: "10", dead: 57, loss: "0.7496", acc: "0.5000" },
  { lr: "30", dead: 60, loss: "3.7464", acc: "0.5000" },
];

const TOTAL = 64;
const VW = 440, VH = 190, PD = { l: 34, r: 40, t: 14, b: 34 };
const X0 = PD.l, X1 = VW - PD.r, Y0 = VH - PD.b, Y1 = PD.t;
const accent = "var(--c-neural)";

const px = (i: number) => X0 + (i / 19) * (X1 - X0);
const pyDead = (d: number) => Y0 - (d / TOTAL) * (Y0 - Y1);
// Loss is drawn on a log axis because ELU's divergence to 13.8 would otherwise
// flatten every other curve into the floor.
const LLO = Math.log10(0.05), LHI = Math.log10(20);
const pyLoss = (v: number) => Y0 - ((Math.log10(Math.max(0.05, v)) - LLO) / (LHI - LLO)) * (Y0 - Y1);

export function DyingReLULab() {
  const [k, setK] = useState(0);
  const r = RUNS[k];
  const dpath = r.dead.map((d, i) => `${px(i).toFixed(2)},${pyDead(d).toFixed(2)}`).join(" ");
  const lpath = r.curve.map((v, i) => `${px(i).toFixed(2)},${pyLoss(v).toFixed(2)}`).join(" ");
  const peak = Math.max(...r.dead);

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.6rem 0" }} className="not-prose">
      <div className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", marginBottom: 2 }}>
        Counting the casualties
      </div>
      <div style={{ fontSize: 12, color: "var(--faint)", marginBottom: 10 }}>
        two moons · 2–32–32–1 · SGD at lr 3.0 · 800 steps ·{" "}
        <strong style={{ color: accent }}>dead units</strong> against{" "}
        <strong style={{ color: "var(--muted)" }}>training loss (log)</strong>
      </div>

      <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", maxWidth: VW, height: "auto", display: "block" }}>
        <rect x={X0} y={Y1} width={X1 - X0} height={Y0 - Y1} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        {[0, 16, 32, 48, 64].map((d) => (
          <g key={d}>
            <line x1={X0} y1={pyDead(d)} x2={X1} y2={pyDead(d)} stroke="var(--border)" strokeWidth={1} strokeDasharray="3 3" />
            <text x={X0 - 5} y={pyDead(d) + 3.5} fontSize={9} fill={accent} textAnchor="end">{d}</text>
          </g>
        ))}
        {[0.1, 1, 10].map((v) => (
          <text key={v} x={X1 + 5} y={pyLoss(v) + 3.5} fontSize={9} fill="var(--muted)">{v}</text>
        ))}

        <polyline points={lpath} fill="none" stroke="var(--muted)" strokeWidth={1.6} strokeDasharray="4 3" />
        <polyline points={dpath} fill="none" stroke={accent} strokeWidth={2.4} />
        {r.dead.map((d, i) => (
          <circle key={i} cx={px(i).toFixed(2)} cy={pyDead(d).toFixed(2)} r={2} fill={accent} />
        ))}

        <text x={(X0 + X1) / 2} y={Y0 + 24} fontSize={10} fill="var(--muted)" textAnchor="middle">
          training step, 0 to 800
        </text>
      </svg>

      <div style={{ display: "flex", gap: 5, marginTop: 10, flexWrap: "wrap" }}>
        {RUNS.map((run, i) => (
          <button
            key={run.key}
            onClick={() => setK(i)}
            style={{
              background: i === k ? `color-mix(in srgb, ${accent} 18%, var(--surface))` : "var(--surface-2)",
              color: "var(--ink)",
              border: `1px solid ${i === k ? `color-mix(in srgb, ${accent} 45%, var(--border))` : "var(--border)"}`,
              fontSize: 12, padding: "5px 10px", borderRadius: 8, cursor: "pointer",
            }}
          >
            {run.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
        {[
          ["worst dead count", `${peak} of ${TOTAL}`, peak > 0],
          ["final loss", r.final.toFixed(4), r.final > 1],
          ["test accuracy", r.acc.toFixed(4), r.acc < 0.7],
        ].map(([label, value, bad]) => (
          <div key={label as string} style={{ background: "var(--surface-2)", borderRadius: 10, padding: "6px 10px", flex: "1 1 110px" }}>
            <div style={{ fontSize: 10.5, color: "var(--muted)" }}>{label as string}</div>
            <div style={{ fontSize: 16, fontWeight: 500, color: bad ? "var(--bad)" : "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
              {value as string}
            </div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 10, lineHeight: 1.55 }}>{r.note}</div>

      <details style={{ marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 10 }}>
        <summary className="font-display" style={{ fontSize: 12.5, color: accent, cursor: "pointer" }}>
          Dying is not a property of ReLU — it is a property of ReLU and a step size
        </summary>
        <div style={{ marginTop: 8, overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 12.5, minWidth: 340 }}>
            <thead>
              <tr>
                {["ReLU, learning rate", "dead at end", "final loss", "test acc"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "5px 16px 5px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SWEEP.map((s) => (
                <tr key={s.lr}>
                  <td style={{ padding: "5px 16px 5px 0", color: "var(--ink)", borderBottom: "1px solid var(--border)" }}>{s.lr}</td>
                  <td style={{ padding: "5px 16px 5px 0", color: s.dead > 40 ? "var(--bad)" : "var(--ink)", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>{s.dead} of 64</td>
                  <td style={{ padding: "5px 16px 5px 0", color: "var(--ink)", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>{s.loss}</td>
                  <td style={{ padding: "5px 16px 5px 0", color: "var(--ink)", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>{s.acc}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 8, lineHeight: 1.5 }}>
            The same network and the same activation, four units dead or sixty depending only on the step size. Note
            also that 19 dead units at lr 3.0 gave the <em>best</em> accuracy in this column: the count only becomes
            fatal once there is not enough network left, which here is somewhere between 19 and 57.
          </div>
        </div>
      </details>
    </div>
  );
}
