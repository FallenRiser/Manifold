"use client";

import { useState } from "react";

// Measured capacity ladder from scripts/perceptron_mlp_cases.py section 4:
// two moons (600 points, noise 0.25, 35% test), one hidden layer, ReLU,
// max_iter=4000. Every row is the mean over 5 initialisations -- a single seed
// on a 2-unit network measures the initialisation as much as the architecture.
//
// The shape is the lesson, and it is not the shape people expect. The jump
// from useless to decent happens between ONE and THREE hidden units. Everything
// after that is a long, flat, expensive climb: 64 units cost 15x the parameters
// of 4 and buy 0.0657 of test accuracy, and 256 units buy nothing at all.

type Row = { units: number; params: number; train: number; test: number };
const ROWS: Row[] = [
  { units: 1, params: 5, train: 0.6538, test: 0.6410 },
  { units: 2, params: 9, train: 0.8123, test: 0.7810 },
  { units: 3, params: 13, train: 0.8882, test: 0.8524 },
  { units: 4, params: 17, train: 0.8856, test: 0.8533 },
  { units: 8, params: 33, train: 0.8964, test: 0.8562 },
  { units: 16, params: 65, train: 0.9087, test: 0.8724 },
  { units: 64, params: 257, train: 0.9415, test: 0.9190 },
  { units: 256, params: 1025, train: 0.9513, test: 0.9181 },
];

const VW = 420, VH = 210, PD = { l: 44, r: 14, t: 16, b: 34 };
const X0 = PD.l, X1 = VW - PD.r, Y0 = VH - PD.b, Y1 = PD.t;
const YLO = 0.6, YHI = 0.98;
const px = (i: number) => X0 + (i / (ROWS.length - 1)) * (X1 - X0);
const py = (v: number) => Y0 - ((v - YLO) / (YHI - YLO)) * (Y0 - Y1);
const accent = "var(--c-neural)";

export function CapacityLadderLab() {
  const [i, setI] = useState(2);
  const r = ROWS[i];
  const gap = r.train - r.test;
  const best = Math.max(...ROWS.map((x) => x.test));

  const trace = (key: "train" | "test") =>
    ROWS.map((row, j) => `${px(j).toFixed(2)},${py(row[key]).toFixed(2)}`).join(" ");

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.6rem 0" }} className="not-prose">
      <div className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", marginBottom: 2 }}>
        How many hidden units do you actually need?
      </div>
      <div style={{ fontSize: 12, color: "var(--faint)", marginBottom: 10 }}>
        two moons · 600 points · one hidden layer · each row averaged over 5 initialisations
      </div>

      <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", maxWidth: VW, height: "auto", display: "block" }}>
        <rect x={X0} y={Y1} width={X1 - X0} height={Y0 - Y1} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        {[0.7, 0.8, 0.9].map((v) => (
          <g key={v}>
            <line x1={X0} y1={py(v)} x2={X1} y2={py(v)} stroke="var(--border)" strokeWidth={1} strokeDasharray="3 3" />
            <text x={X0 - 6} y={py(v) + 3.5} fontSize={9} fill="var(--faint)" textAnchor="end">{v.toFixed(1)}</text>
          </g>
        ))}

        <polyline points={trace("train")} fill="none" stroke="var(--muted)" strokeWidth={1.8} strokeDasharray="4 3" />
        <polyline points={trace("test")} fill="none" stroke={accent} strokeWidth={2.4} />

        {ROWS.map((row, j) => (
          <circle key={row.units} cx={Number(px(j).toFixed(2))} cy={Number(py(row.test).toFixed(2))}
            r={j === i ? 5 : 2.8} fill={accent} opacity={j === i ? 1 : 0.55} />
        ))}
        <line x1={px(i)} y1={Y1} x2={px(i)} y2={Y0} stroke={accent} strokeWidth={1} opacity={0.3} />

        {ROWS.map((row, j) => (
          <text key={row.units} x={px(j)} y={Y0 + 13} fontSize={8.5}
            fill={j === i ? "var(--ink)" : "var(--faint)"} textAnchor="middle">{row.units}</text>
        ))}
        <text x={(X0 + X1) / 2} y={Y0 + 27} fontSize={10} fill="var(--muted)" textAnchor="middle">hidden units</text>
        <text x={X1 - 6} y={py(ROWS[ROWS.length - 1].train) - 6} fontSize={9} fill="var(--muted)" textAnchor="end">train</text>
        <text x={X1 - 6} y={py(ROWS[ROWS.length - 1].test) + 14} fontSize={9} fill={accent} textAnchor="end">test</text>
      </svg>

      <input
        type="range" min={0} max={ROWS.length - 1} step={1} value={i}
        onChange={(e) => setI(Number(e.target.value))}
        style={{ width: "100%", marginTop: 8, accentColor: "var(--c-neural)" }}
      />

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
        {[
          ["hidden units", String(r.units), "var(--ink)"],
          ["parameters", String(r.params), "var(--ink)"],
          ["test accuracy", r.test.toFixed(4), accent],
          // Deliberately NOT colour-coded: on this sweep the gap wanders
          // between 0.013 and 0.040 with no clean trend, so a threshold here
          // would imply a pattern the five-seed averages cannot support.
          ["train − test", gap.toFixed(4), "var(--muted)"],
        ].map(([label, value, color]) => (
          <div key={label} style={{ background: "var(--surface-2)", borderRadius: 10, padding: "6px 10px", flex: "1 1 88px" }}>
            <div style={{ fontSize: 10.5, color: "var(--muted)" }}>{label}</div>
            <div style={{ fontSize: 17, fontWeight: 500, color, fontVariantNumeric: "tabular-nums" }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 10, lineHeight: 1.55 }}>
        {r.units === 1
          ? "One unit is one line, and one line cannot bend around a moon. This is the perceptron again, with extra steps."
          : r.units <= 3
            ? `Three units and ${ROWS[2].params} parameters reach ${(ROWS[2].test * 100).toFixed(1)}%, within ${((best - ROWS[2].test) * 100).toFixed(1)} points of the best row on the chart. That is three quarters of the total gain, bought with 8 parameters more than a straight line.`
            : r.units <= 16
              ? "The long flat stretch. Four times the parameters, roughly two points of accuracy."
              : r.units === 64
                ? "The best row — and it took 257 parameters to beat 13 parameters by 6.7 points."
                : "Four times bigger than the best row, and very slightly worse. Train keeps climbing; test has stopped listening."}
      </div>
    </div>
  );
}
