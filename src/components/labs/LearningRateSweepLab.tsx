"use client";

import { useState } from "react";

// Seven learning rates on one problem, measured in
// scripts/backprop_cases.py section 5: two moons (600 points, noise 0.25),
// a 2-16-16-1 ReLU network with He init, 2,000 full-batch steps, identical
// seed. The ONLY thing that differs between these runs is the step size.
//
// The two failures at the top are different failures, which is the part most
// treatments flatten into "too high". At lr=10 the loss jumps once and then
// freezes forever, because 16 of 16 units in the second hidden layer are dead
// -- the network has been cut in half and no gradient can reach the front of
// it. At lr=100 nothing dies permanently; the loss simply never settles.

type Run = { lr: number; final: number; acc: number; dead: number[]; curve: number[] };

const RUNS: Run[] = [
  { lr: 0.0001, final: 0.5806, acc: 0.6667, dead: [0, 0], curve: [0.651, 0.6485, 0.6462, 0.6439, 0.6418, 0.6396, 0.6375, 0.6355, 0.6334, 0.6315, 0.6295, 0.6275, 0.6256, 0.6237, 0.6218, 0.62, 0.6182, 0.6164, 0.6146, 0.6129] },
  { lr: 0.001, final: 0.3756, acc: 0.8429, dead: [0, 0], curve: [0.651, 0.6295, 0.6112, 0.595, 0.5806, 0.5674, 0.5553, 0.544, 0.5335, 0.5239, 0.5149, 0.5065, 0.4985, 0.491, 0.4838, 0.4771, 0.4707, 0.4646, 0.4587, 0.4531] },
  { lr: 0.01, final: 0.2470, acc: 0.8571, dead: [0, 0], curve: [0.651, 0.5147, 0.4476, 0.4054, 0.3754, 0.3533, 0.3372, 0.3252, 0.3158, 0.3081, 0.3019, 0.2965, 0.292, 0.2882, 0.2848, 0.2819, 0.2794, 0.2771, 0.275, 0.2731] },
  { lr: 0.1, final: 0.0981, acc: 0.9143, dead: [0, 0], curve: [0.651, 0.3016, 0.2713, 0.258, 0.247, 0.2352, 0.2224, 0.21, 0.1985, 0.1819, 0.1666, 0.155, 0.1463, 0.1394, 0.1338, 0.1286, 0.1243, 0.1207, 0.1178, 0.1156] },
  { lr: 1.0, final: 0.0858, acc: 0.9190, dead: [0, 0], curve: [0.651, 0.1763, 0.1453, 0.1228, 0.1177, 0.1087, 0.1125, 0.1106, 0.1049, 0.0987, 0.1025, 0.0981, 0.0957, 0.1007, 0.1012, 0.0959, 0.0951, 0.0937, 0.097, 0.0948] },
  { lr: 10.0, final: 1.0444, acc: 0.5000, dead: [5, 16], curve: [0.651, 1.0444, 1.0444, 1.0444, 1.0444, 1.0444, 1.0444, 1.0444, 1.0444, 1.0444, 1.0444, 1.0444, 1.0444, 1.0444, 1.0444, 1.0444, 1.0444, 1.0444, 1.0444, 1.0444] },
  { lr: 100.0, final: 1.7500, acc: 0.5000, dead: [5, 15], curve: [0.651, 10.9107, 4.4372, 8.9827, 0.6735, 10.9107, 10.0206, 1.306, 10.9107, 10.9107, 0.6145, 0.887, 0.7915, 10.9107, 10.9107, 3.3832, 13.8147, 1.992, 6.1377, 10.9107] },
];

const VERDICT = (r: Run) => {
  if (r.dead[1] === 16) return { text: "a whole layer died — the network is severed", tone: "var(--bad)" };
  if (r.lr >= 100) return { text: "oscillating wildly, never settles", tone: "var(--bad)" };
  if (r.final > 0.5) return { text: "moving, far too slowly", tone: "var(--warn)" };
  if (r.final > 0.3) return { text: "learning, but not finished", tone: "var(--warn)" };
  return { text: "healthy", tone: "var(--good)" };
};

const VW = 430, VH = 200, PD = { l: 42, r: 14, t: 16, b: 34 };
const X0 = PD.l, X1 = VW - PD.r, Y0 = VH - PD.b, Y1 = PD.t;
const LMIN = 0.05, LMAX = 14;
const py = (v: number) =>
  Y0 - ((Math.log10(v) - Math.log10(LMIN)) / (Math.log10(LMAX) - Math.log10(LMIN))) * (Y0 - Y1);
const accent = "var(--c-neural)";

export function LearningRateSweepLab() {
  const [i, setI] = useState(3);
  const r = RUNS[i];
  const v = VERDICT(r);
  const px = (j: number) => X0 + (j / (r.curve.length - 1)) * (X1 - X0);
  const path = r.curve.map((c, j) => `${px(j).toFixed(2)},${py(Math.max(LMIN, c)).toFixed(2)}`).join(" ");

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.6rem 0" }} className="not-prose">
      <div className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", marginBottom: 2 }}>
        One number, six orders of magnitude
      </div>
      <div style={{ fontSize: 12, color: "var(--faint)", marginBottom: 10 }}>
        two moons · 2–16–16–1 ReLU · 2,000 full-batch steps · same seed · <strong style={{ color: "var(--muted)" }}>log-scale loss</strong>
      </div>

      <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", maxWidth: VW, height: "auto", display: "block" }}>
        <rect x={X0} y={Y1} width={X1 - X0} height={Y0 - Y1} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        {[0.1, 1, 10].map((g) => (
          <g key={g}>
            <line x1={X0} y1={py(g)} x2={X1} y2={py(g)} stroke="var(--border)" strokeWidth={1} strokeDasharray="3 3" />
            <text x={X0 - 6} y={py(g) + 3.5} fontSize={9} fill="var(--faint)" textAnchor="end">{g}</text>
          </g>
        ))}
        {/* the loss before the first step -- the line a run must get below */}
        <line x1={X0} y1={py(0.651)} x2={X1} y2={py(0.651)} stroke="var(--muted)" strokeWidth={1.2} />
        <text x={X1 - 4} y={py(0.651) - 4} fontSize={8.5} fill="var(--muted)" textAnchor="end">loss before training</text>

        <polyline points={path} fill="none" stroke={v.tone} strokeWidth={2.2} />
        {r.curve.map((c, j) => (
          <circle key={j} cx={px(j).toFixed(2)} cy={py(Math.max(LMIN, c)).toFixed(2)} r={1.8} fill={v.tone} opacity={0.7} />
        ))}
        <text x={(X0 + X1) / 2} y={Y0 + 24} fontSize={10} fill="var(--muted)" textAnchor="middle">
          training step (every 50th, first 1,000)
        </text>
      </svg>

      <div style={{ display: "flex", gap: 5, marginTop: 10, flexWrap: "wrap" }}>
        {RUNS.map((run, j) => (
          <button
            key={run.lr}
            onClick={() => setI(j)}
            style={{
              background: j === i ? `color-mix(in srgb, ${accent} 18%, var(--surface))` : "var(--surface-2)",
              color: "var(--ink)",
              border: `1px solid ${j === i ? `color-mix(in srgb, ${accent} 45%, var(--border))` : "var(--border)"}`,
              fontSize: 12, padding: "5px 9px", borderRadius: 8, cursor: "pointer", fontVariantNumeric: "tabular-nums",
            }}
          >
            {run.lr}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
        {[
          ["final loss", r.final.toFixed(4)],
          ["test accuracy", r.acc.toFixed(4)],
          ["dead units", `${r.dead[0]}, ${r.dead[1]} of 16`],
        ].map(([label, value]) => (
          <div key={label} style={{ background: "var(--surface-2)", borderRadius: 10, padding: "6px 10px", flex: "1 1 100px" }}>
            <div style={{ fontSize: 10.5, color: "var(--muted)" }}>{label}</div>
            <div style={{ fontSize: 16, fontWeight: 500, color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 12.5, color: v.tone, marginTop: 10, fontWeight: 500 }}>{v.text}</div>
      <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4, lineHeight: 1.55 }}>
        {r.lr === 10
          ? "Look at the curve: one jump, then a perfectly flat line for 2,000 steps. Every unit in the second hidden layer outputs zero for every training row, so no gradient reaches anything in front of it. This is not slow learning — it is no learning, permanently."
          : r.lr === 100
            ? "15 of 16 units in the second layer are dead — but one survives, so a path remains and the network keeps moving. The steps are simply so large that each one overshoots the last: the loss ranges from 0.61 to 13.8 with no trend at all."
            : r.lr <= 0.001
              ? "Nothing is wrong except the size of the step. Given far more steps this would get there — which is exactly why 'the loss is barely moving' is such an unhelpful symptom on its own."
              : "A wide healthy band: 0.01 through 1.0 all work, spanning two orders of magnitude. The learning rate needs to be roughly right, not exactly right."}
      </div>
    </div>
  );
}
