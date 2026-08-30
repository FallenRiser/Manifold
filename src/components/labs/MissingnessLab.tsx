"use client";

import { useState } from "react";

// The three missingness mechanisms, measured. All numbers from
// scripts/data_workflow_cases.py section 5: N=8,000 rows, x1 correlated with an
// always-observed x2 at rho=0.7, y = 2*x1 + x2 + noise, ~40% of x1 removed by
// each mechanism.
//
// Two things this lab has to land, neither of which survives being asserted:
//   1. The mechanism is visible as the SHAPE OF THE HOLE -- which values of x1
//      survived. MCAR is flat; MAR and MNAR both tilt.
//   2. MAR and MNAR look nearly identical in that picture. You cannot tell them
//      apart from the data. Which one you have is an assumption about the
//      world, and every repair you choose inherits that assumption.

type Mech = "MCAR" | "MAR" | "MNAR";

const CENTRES = [-2.75, -2.25, -1.75, -1.25, -0.75, -0.25, 0.25, 0.75, 1.25, 1.75, 2.25, 2.75];

const DATA: Record<Mech, {
  blurb: string;
  missing: number;
  naive: number;
  imputed: number;
  survival: number[];
  r2: { drop: number; mean: number; flag: number };
}> = {
  MCAR: {
    blurb: "the reading was lost for reasons unrelated to anything — a dropped packet",
    missing: 0.401, naive: 0.0105, imputed: 0.0123,
    survival: [0.68, 0.51, 0.58, 0.61, 0.61, 0.60, 0.60, 0.59, 0.60, 0.57, 0.67, 0.71],
    r2: { drop: 0.7204, mean: 0.7685, flag: 0.7685 },
  },
  MAR: {
    blurb: "missingness depends on x₂ — a column you did record",
    missing: 0.439, naive: -0.3451, imputed: 0.0123,
    survival: [0.95, 0.90, 0.84, 0.83, 0.73, 0.63, 0.53, 0.40, 0.27, 0.19, 0.14, 0.06],
    r2: { drop: 0.6049, mean: 0.7508, flag: 0.7575 },
  },
  MNAR: {
    blurb: "missingness depends on x₁ itself — the very value you don't have",
    missing: 0.441, naive: -0.5001, imputed: -0.2961,
    survival: [1.00, 1.00, 0.96, 0.93, 0.84, 0.69, 0.48, 0.28, 0.14, 0.06, 0.03, 0.00],
    r2: { drop: 0.5006, mean: 0.7157, flag: 0.7881 },
  },
};

const ORDER: Mech[] = ["MCAR", "MAR", "MNAR"];

const VW = 380, VH = 160, PD = { l: 34, r: 12, t: 12, b: 34 };
const X0 = PD.l, X1 = VW - PD.r, Y0 = VH - PD.b, Y1 = PD.t;
const BW = (X1 - X0) / CENTRES.length;

export function MissingnessLab() {
  const [mech, setMech] = useState<Mech>("MCAR");
  const accent = "var(--c-metrics)";
  const d = DATA[mech];
  const bias = d.naive;
  const flagPays = d.r2.flag - d.r2.mean;

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.6rem 0" }} className="not-prose">
      <div className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", marginBottom: 2 }}>
        Which values of x₁ survived?
      </div>
      <div style={{ fontSize: 12, color: "var(--faint)", marginBottom: 10 }}>
        {(d.missing * 100).toFixed(1)}% of x₁ is missing · {d.blurb}
      </div>

      <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", maxWidth: VW, height: "auto", display: "block" }}>
        <rect x={X0} y={Y1} width={X1 - X0} height={Y0 - Y1} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />

        {CENTRES.map((c, k) => {
          const h = d.survival[k] * (Y0 - Y1);
          return (
            <rect
              key={c}
              x={Number((X0 + k * BW + 1.5).toFixed(2))}
              y={Number((Y0 - h).toFixed(2))}
              width={Number((BW - 3).toFixed(2))}
              height={Number(h.toFixed(2))}
              rx={2}
              fill={accent}
              opacity={0.72}
              style={{ transition: "y 300ms ease, height 300ms ease" }}
            />
          );
        })}

        {[0, 0.5, 1].map((v) => (
          <text key={v} x={X0 - 5} y={Y0 - v * (Y0 - Y1) + 3.5} fontSize={9} fill="var(--faint)" textAnchor="end">{v.toFixed(1)}</text>
        ))}
        {[-2.75, -0.25, 2.75].map((c) => (
          <text key={c} x={X0 + (CENTRES.indexOf(c) + 0.5) * BW} y={Y0 + 13} fontSize={9} fill="var(--faint)" textAnchor="middle">
            {c > 0 ? `+${c}` : c}
          </text>
        ))}
        <text x={(X0 + X1) / 2} y={Y0 + 26} fontSize={10} fill="var(--muted)" textAnchor="middle">
          value of x₁  →  share of rows still observed
        </text>
      </svg>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
        {ORDER.map((m) => (
          <button
            key={m}
            onClick={() => setMech(m)}
            style={{
              background: mech === m ? `color-mix(in srgb, ${accent} 15%, var(--surface))` : "transparent",
              color: mech === m ? "var(--ink)" : "var(--muted)",
              border: `1px solid ${mech === m ? `color-mix(in srgb, ${accent} 40%, var(--border))` : "var(--border-strong)"}`,
              fontSize: 12, padding: "5px 12px", borderRadius: 8, cursor: "pointer",
            }}
          >
            {m}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
        <Metric
          label="mean of x₁ from what you see"
          value={bias.toFixed(4)}
          accent={Math.abs(bias) > 0.05 ? "var(--bad)" : "var(--good)"}
          sub={`truth is 0.0000`}
          big
        />
        <Metric
          label="after imputing x₁ from x₂"
          value={d.imputed.toFixed(4)}
          accent={Math.abs(d.imputed) > 0.05 ? "var(--bad)" : "var(--good)"}
          sub={Math.abs(d.imputed) > 0.05 ? "still wrong" : "recovered"}
        />
      </div>

      <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 12, marginBottom: 5 }}>
        held-out R² predicting y, with the same holes in train and test
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Metric label="drop the rows" value={d.r2.drop.toFixed(4)} />
        <Metric label="mean impute" value={d.r2.mean.toFixed(4)} />
        <Metric
          label="impute + missing flag"
          value={d.r2.flag.toFixed(4)}
          accent={flagPays > 0.01 ? "var(--good)" : undefined}
          sub={flagPays > 0.01 ? `+${flagPays.toFixed(4)} from the flag alone` : "the flag adds nothing"}
        />
      </div>
    </div>
  );
}

function Metric({ label, value, sub, accent, big }: { label: string; value: string; sub?: string; accent?: string; big?: boolean }) {
  return (
    <div style={{ background: "var(--surface-2)", borderRadius: 10, padding: "6px 10px", minWidth: 100 }}>
      <div style={{ fontSize: 10.5, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontSize: big ? 19 : 13.5, fontWeight: 500, color: accent ?? "var(--ink)" }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: "var(--faint)" }}>{sub}</div>}
    </div>
  );
}
