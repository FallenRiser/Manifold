"use client";

import { useState } from "react";
import { boundarySegment, halfPlanePolygon } from "./halfplane";

// XOR: the smallest problem a single neuron cannot solve, and the smallest
// network that can.
//
// The reader gets a line and three sliders and is invited to fail. They will
// reach 3 of 4 and no further -- confirmed exhaustively in
// scripts/perceptron_mlp_cases.py section 2: the best of 20,000 random
// half-planes is 0.7500.
//
// Then the second view does the thing that actually explains it. The trained
// 2-unit hidden layer (real weights from the same script, lbfgs, tanh,
// random_state=1) maps the four inputs somewhere new, and in THAT space a line
// works. The hidden layer did not classify anything. It moved the points.

const XOR: { x: [number, number]; y: number }[] = [
  { x: [0, 0], y: 0 },
  { x: [0, 1], y: 1 },
  { x: [1, 0], y: 1 },
  { x: [1, 1], y: 0 },
];

// Trained weights, section 2. h = tanh(x @ W1 + b1).
const W1 = [[-3.536, -3.843], [-3.594, -3.682]];
const B1 = [1.676, 5.925];

const hidden = (x: [number, number]): [number, number] => [
  Math.tanh(x[0] * W1[0][0] + x[1] * W1[1][0] + B1[0]),
  Math.tanh(x[0] * W1[0][1] + x[1] * W1[1][1] + B1[1]),
];

const VW = 300, VH = 300, PD = 42;
const accent = "var(--c-neural)";

function panel(lo: number, hi: number) {
  const px = (v: number) => PD + ((v - lo) / (hi - lo)) * (VW - 2 * PD);
  const py = (v: number) => VH - PD - ((v - lo) / (hi - lo)) * (VH - 2 * PD);
  return { px, py };
}

export function XorLab() {
  const [w1, setW1] = useState(1.0);
  const [w2, setW2] = useState(1.0);
  const [b, setB] = useState(-0.5);
  const [space, setSpace] = useState<"input" | "hidden">("input");

  const inHidden = space === "hidden";
  const lo = inHidden ? -1.25 : -0.4;
  const hi = inHidden ? 1.25 : 1.4;
  const { px, py } = panel(lo, hi);

  const coords = XOR.map((d) => (inHidden ? hidden(d.x) : d.x));
  const score = coords.filter((c, i) => (w1 * c[0] + w2 * c[1] + b > 0 ? 1 : 0) === XOR[i].y).length;

  const seg = boundarySegment(w1, w2, b, lo, hi);
  const line = seg
    ? `${px(seg[0][0]).toFixed(2)},${py(seg[0][1]).toFixed(2)} ${px(seg[1][0]).toFixed(2)},${py(seg[1][1]).toFixed(2)}`
    : null;
  const region = halfPlanePolygon(w1, w2, b, lo, hi)
    .map(([x, y]) => `${px(x).toFixed(2)},${py(y).toFixed(2)}`)
    .join(" ");

  const solve = () => {
    if (inHidden) { setW1(-8.15); setW2(8.4); setB(-8.34); }
    else { setW1(1); setW2(1); setB(-0.5); }
  };

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.6rem 0" }} className="not-prose">
      <div className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", marginBottom: 2 }}>
        Separate these four points with one line
      </div>
      <div style={{ fontSize: 12, color: "var(--faint)", marginBottom: 10 }}>
        {inHidden
          ? "the same four points, after a trained 2-unit hidden layer has moved them"
          : "filled = output 1 · hollow = output 0"}
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
        <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", maxWidth: 300, height: "auto", display: "block", flex: "0 1 300px" }}>
          <defs>
            <clipPath id="xor-clip">
              <rect x={PD} y={PD} width={VW - 2 * PD} height={VH - 2 * PD} rx={8} />
            </clipPath>
          </defs>
          <rect x={PD} y={PD} width={VW - 2 * PD} height={VH - 2 * PD} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
          <g clipPath="url(#xor-clip)">
            {region && <polygon points={region} fill={accent} opacity={0.1} />}
            {line && <polyline points={line} fill="none" stroke={accent} strokeWidth={2.4} />}
          </g>
          {coords.map((c, i) => {
            const right = (w1 * c[0] + w2 * c[1] + b > 0 ? 1 : 0) === XOR[i].y;
            return (
              <g key={i}>
                <circle
                  cx={Number(px(c[0]).toFixed(2))} cy={Number(py(c[1]).toFixed(2))} r={8}
                  fill={XOR[i].y === 1 ? accent : "var(--canvas)"}
                  stroke={XOR[i].y === 1 ? accent : "var(--ink)"} strokeWidth={1.8}
                  opacity={right ? 1 : 0.3}
                />
                {!right && (
                  <circle cx={Number(px(c[0]).toFixed(2))} cy={Number(py(c[1]).toFixed(2))} r={13}
                    fill="none" stroke="var(--bad)" strokeWidth={1.5} />
                )}
                <text
                  x={Number(px(c[0]).toFixed(2))} y={Number(py(c[1]).toFixed(2)) - 15}
                  fontSize={9.5} fill="var(--faint)" textAnchor="middle"
                >
                  ({XOR[i].x[0]}, {XOR[i].x[1]})
                </text>
              </g>
            );
          })}
          <text x={VW / 2} y={VH - 12} fontSize={10} fill="var(--muted)" textAnchor="middle">
            {inHidden ? "h₁" : "x₁"}
          </text>
          <text x={14} y={VH / 2} fontSize={10} fill="var(--muted)" textAnchor="middle" transform={`rotate(-90 14 ${VH / 2})`}>
            {inHidden ? "h₂" : "x₂"}
          </text>
        </svg>

        <div style={{ flex: "1 1 220px", minWidth: 200 }}>
          {([["w₁", w1, setW1], ["w₂", w2, setW2], ["b", b, setB]] as const).map(([lab, val, set]) => (
            <label key={lab} style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>
              <span style={{ display: "inline-block", width: 22, color: "var(--ink)" }}>{lab}</span>
              <input
                type="range" min={-10} max={10} step={0.05} value={val}
                onChange={(e) => set(Number(e.target.value))}
                style={{ width: "calc(100% - 80px)", verticalAlign: "middle", accentColor: "var(--c-neural)" }}
              />
              <span style={{ display: "inline-block", width: 48, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                {val.toFixed(2)}
              </span>
            </label>
          ))}

          <div style={{ background: "var(--surface-2)", borderRadius: 10, padding: "8px 10px", marginTop: 8 }}>
            <div style={{ fontSize: 10.5, color: "var(--muted)" }}>correct</div>
            <div style={{ fontSize: 22, fontWeight: 500, color: score === 4 ? "var(--good)" : "var(--ink)" }}>
              {score} <span style={{ fontSize: 13, color: "var(--faint)" }}>/ 4</span>
            </div>
            <div style={{ fontSize: 10.5, color: "var(--faint)" }}>
              {inHidden ? "4 is reachable here" : "3 is the ceiling — 20,000 random lines got no further"}
            </div>
          </div>

          <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
            <button
              onClick={() => setSpace(inHidden ? "input" : "hidden")}
              style={{
                background: `color-mix(in srgb, ${accent} 15%, var(--surface))`,
                color: "var(--ink)",
                border: `1px solid color-mix(in srgb, ${accent} 40%, var(--border))`,
                fontSize: 12, padding: "5px 10px", borderRadius: 8, cursor: "pointer",
              }}
            >
              {inHidden ? "← Back to the raw inputs" : "Add a hidden layer →"}
            </button>
            <button
              onClick={solve}
              style={{
                background: "var(--surface-2)", color: "var(--ink)",
                border: "1px solid var(--border)",
                fontSize: 12, padding: "5px 10px", borderRadius: 8, cursor: "pointer",
              }}
            >
              {inHidden ? "Snap to the trained output layer" : "Reset"}
            </button>
          </div>

          <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 10, lineHeight: 1.5 }}>
            {inHidden
              ? "Two of the four points landed almost on top of each other. That is the whole trick: the hidden layer collapsed the two 1s together, and a line finishes the job."
              : "Try every angle you like. Two points that must share a label sit on opposite corners — no line has them on the same side."}
          </div>
        </div>
      </div>
    </div>
  );
}
