"use client";

import { useState } from "react";

// Section 8 of scripts/activation_cases.py: a 6-hidden-layer network on two
// moons, and a histogram of every pre-activation z in the network -- once at
// initialisation and once after 1,500 Adam steps.
//
// This is the measurement the rest of the track needs and never takes. The
// anatomy table says sigmoid's derivative is below 0.01 on 42.7% of the input
// LINE. It says nothing about whether any unit is ever there, and at
// initialisation none of them are: sigmoid measures 0.0% saturated. The dead
// zone of a curve costs nothing until the network visits it.

type Row = {
  key: string; label: string; init: number[]; trained: number[];
  sat0: number; sat1: number; sd0: number; sd1: number; max0: number; max1: number;
  acc: number; perLayer: number[]; note: string;
};

const BINS = ["<−6", "−6..−4", "−4..−2", "−2..−1", "−1..0", "0..1", "1..2", "2..4", "4..6", ">6"];

const ROWS: Row[] = [
  {
    key: "sigmoid", label: "sigmoid",
    init: [0.0, 0.0001, 0.003, 0.0257, 0.5428, 0.405, 0.0232, 0.0003, 0.0, 0.0],
    trained: [0.0013, 0.0103, 0.1162, 0.2069, 0.2976, 0.2005, 0.1138, 0.05, 0.0031, 0.0002],
    sat0: 0.0, sat1: 0.007, sd0: 0.521, sd1: 1.424, max0: 4.14, max1: 8.87, acc: 0.9190,
    perLayer: [0.016, 0.0002, 0.0, 0.0018, 0.0, 0.024],
    note: "The result that should surprise you. Sigmoid is the activation this track has spent five pages criticising, and at initialisation 0.0% of its units are saturated — every one of them sits in the steep middle of the curve, spread 0.52 wide. After training it is still only 0.7%. Sigmoid's problem at depth was never that its units sit in the flat tails; it is that even in the steep middle the slope is at most 0.25, and 0.25 compounds.",
  },
  {
    key: "tanh", label: "tanh",
    init: [0.0, 0.0001, 0.003, 0.0214, 0.4669, 0.4894, 0.0189, 0.0003, 0.0, 0.0],
    trained: [0.0549, 0.0463, 0.1088, 0.1065, 0.1845, 0.1858, 0.1058, 0.1153, 0.0393, 0.0529],
    sat0: 0.0009, sat1: 0.3008, sd0: 0.425, sd1: 3.243, max0: 4.14, max1: 15.49, acc: 0.9048,
    perLayer: [0.0205, 0.2053, 0.1766, 0.208, 0.3761, 0.8183],
    note: "Starts almost perfectly centred — 0.1% saturated, spread 0.43 — and training pushes it outward to 30.1%, with the spread growing from 0.43 to 3.24. Read the per-layer row: 2% in the first hidden layer rising to 82% in the last. Saturation here is something training CAUSED, and it is concentrated at the end of the network.",
  },
  {
    key: "relu", label: "ReLU",
    init: [0.0, 0.0013, 0.0165, 0.0946, 0.3937, 0.4044, 0.079, 0.0106, 0.0, 0.0],
    trained: [0.0968, 0.0743, 0.154, 0.1458, 0.1731, 0.152, 0.076, 0.0631, 0.0272, 0.0377],
    sat0: 0.506, sat1: 0.644, sd0: 0.818, sd1: 4.374, max0: 5.86, max1: 105.31, acc: 0.8952,
    perLayer: [0.5208, 0.5862, 0.5883, 0.6838, 0.7601, 0.7247],
    note: "50.6% switched off before training has started — which is not a failure but the definition of ReLU: half the line has zero slope and a symmetric initialisation puts half the units there. Training takes it to 64.4%. Note the largest pre-activation: 105.3, against sigmoid's 8.9. Nothing bounds a ReLU network's activations, and they grow.",
  },
];

const VW = 450, VH = 175, PD = { l: 34, r: 12, t: 14, b: 42 };
const X0 = PD.l, X1 = VW - PD.r, Y0 = VH - PD.b, Y1 = PD.t;
const accent = "var(--c-neural)";
const TOP = 0.6;
const by = (v: number) => Y0 - (v / TOP) * (Y0 - Y1);

export function UnitDistributionLab() {
  const [k, setK] = useState(0);
  const [when, setWhen] = useState<"init" | "trained">("init");
  const r = ROWS[k];
  const h = when === "init" ? r.init : r.trained;
  const bw = (X1 - X0) / BINS.length;
  const sat = when === "init" ? r.sat0 : r.sat1;
  const sd = when === "init" ? r.sd0 : r.sd1;
  const mx = when === "init" ? r.max0 : r.max1;

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.6rem 0" }} className="not-prose">
      <div className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", marginBottom: 2 }}>
        Where the units actually are
      </div>
      <div style={{ fontSize: 12, color: "var(--faint)", marginBottom: 10 }}>
        every pre-activation <em>z</em> in a 6-hidden-layer network · two moons ·{" "}
        <strong style={{ color: "var(--muted)" }}>the input the activation receives</strong>, not its output
      </div>

      <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", maxWidth: VW, height: "auto", display: "block" }}>
        <rect x={X0} y={Y1} width={X1 - X0} height={Y0 - Y1} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        {[0, 0.2, 0.4, 0.6].map((g) => (
          <g key={g}>
            <line x1={X0} y1={by(g)} x2={X1} y2={by(g)} stroke="var(--border)" strokeWidth={1} strokeDasharray="3 3" />
            <text x={X0 - 5} y={by(g) + 3.5} fontSize={9} fill="var(--faint)" textAnchor="end">{(g * 100).toFixed(0)}%</text>
          </g>
        ))}
        {h.map((v, i) => (
          <g key={i}>
            <rect
              x={(X0 + i * bw + bw * 0.14).toFixed(2)}
              y={by(Math.min(v, TOP)).toFixed(2)}
              width={(bw * 0.72).toFixed(2)}
              height={Math.max(0.6, Y0 - by(Math.min(v, TOP))).toFixed(2)}
              fill={i >= 4 && i <= 5 ? accent : "var(--muted)"}
              opacity={i >= 4 && i <= 5 ? 1 : 0.5}
              rx={1.5}
            />
            <text
              x={(X0 + i * bw + bw / 2).toFixed(2)} y={Y0 + 12}
              fontSize={7.5} fill="var(--faint)" textAnchor="middle"
            >
              {BINS[i]}
            </text>
          </g>
        ))}
        <text x={(X0 + X1) / 2} y={Y0 + 28} fontSize={10} fill="var(--muted)" textAnchor="middle">
          pre-activation z · the two coral bars are the steep middle, |z| &lt; 1
        </text>
      </svg>

      <div style={{ display: "flex", gap: 5, marginTop: 10, flexWrap: "wrap" }}>
        {ROWS.map((row, i) => (
          <button
            key={row.key}
            onClick={() => setK(i)}
            style={{
              background: i === k ? `color-mix(in srgb, ${accent} 18%, var(--surface))` : "var(--surface-2)",
              color: "var(--ink)",
              border: `1px solid ${i === k ? `color-mix(in srgb, ${accent} 45%, var(--border))` : "var(--border)"}`,
              fontSize: 12.5, padding: "5px 12px", borderRadius: 8, cursor: "pointer",
            }}
          >
            {row.label}
          </button>
        ))}
        <span style={{ width: 12 }} />
        {(["init", "trained"] as const).map((w) => (
          <button
            key={w}
            onClick={() => setWhen(w)}
            style={{
              background: w === when ? "var(--ink)" : "var(--surface-2)",
              color: w === when ? "var(--canvas)" : "var(--ink)",
              border: "1px solid var(--border)",
              fontSize: 12.5, padding: "5px 12px", borderRadius: 8, cursor: "pointer",
            }}
          >
            {w === "init" ? "at initialisation" : "after training"}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
        {[
          ["units saturated", `${(sat * 100).toFixed(1)}%`, sat > 0.25],
          ["spread of z", sd.toFixed(3), false],
          ["largest |z|", mx.toFixed(2), mx > 50],
        ].map(([l, v, bad]) => (
          <div key={l as string} style={{ background: "var(--surface-2)", borderRadius: 10, padding: "6px 10px", flex: "1 1 110px" }}>
            <div style={{ fontSize: 10.5, color: "var(--muted)" }}>{l as string}</div>
            <div style={{ fontSize: 16, fontWeight: 500, color: bad ? "var(--bad)" : "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{v as string}</div>
          </div>
        ))}
      </div>

      {when === "trained" && (
        <div style={{ marginTop: 10, background: "var(--surface-2)", borderRadius: 10, padding: "8px 10px" }}>
          <div style={{ fontSize: 10.5, color: "var(--muted)", marginBottom: 5 }}>
            saturated fraction, layer 1 → layer 6
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {r.perLayer.map((p, i) => (
              <div key={i} style={{ flex: 1, textAlign: "center" }}>
                <div style={{
                  height: 26, display: "flex", alignItems: "flex-end", justifyContent: "center",
                }}>
                  <div style={{
                    width: "100%", height: `${Math.max(2, p * 26)}px`,
                    background: p > 0.5 ? "var(--bad)" : accent, opacity: p > 0.5 ? 0.85 : 0.7, borderRadius: 2,
                  }} />
                </div>
                <div style={{ fontSize: 9.5, color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>
                  {(p * 100).toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 10, lineHeight: 1.55 }}>{r.note}</div>
    </div>
  );
}
