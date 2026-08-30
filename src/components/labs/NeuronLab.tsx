"use client";

import { useState } from "react";
import { boundarySegment, halfPlanePolygon } from "./halfplane";

// One neuron, aimed by hand. Points are the separable set from
// scripts/perceptron_mlp_cases.py section 1 (constructed with a guaranteed
// margin, so a perfect answer exists and the reader can actually reach it).
//
// The argument: a neuron IS a linear model plus a switch. The reader moves the
// same three numbers a linear model has -- two weights and a bias -- and the
// only thing the switch changes is whether the output is a decision or a
// degree of belief. Nothing else about the geometry moves.
//
// Accuracy is computed here, from the points on screen, so it cannot drift
// away from anything written on the page.

const POS: [number, number][] = [
  [5.3, 8.5], [2.1, 6.8], [4.9, 8.1], [4.1, 8.1], [2.8, 6.0], [1.7, 7.7],
  [4.6, 7.4], [1.7, 5.6], [3.4, 6.4], [2.6, 8.5], [6.0, 8.4], [4.5, 8.6],
];
const NEG: [number, number][] = [
  [6.1, 3.2], [1.3, 1.1], [7.5, 1.0], [7.9, 1.3], [6.8, 2.4], [7.9, 5.3],
  [6.4, 6.2], [5.9, 4.1], [9.0, 8.8], [6.5, 6.2], [6.5, 4.1], [5.2, 3.5],
];

// The solution the perceptron rule converged to, section 1: w = [-11.65, 9.00],
// b = -3.00. Scaled by 1/4 to sit inside the slider range without changing the
// line it defines.
const SOLUTION = { w1: -2.9, w2: 2.25, b: -0.75 };

const VW = 400, VH = 260, PD = { l: 34, r: 12, t: 12, b: 30 };
const X0 = PD.l, X1 = VW - PD.r, Y0 = VH - PD.b, Y1 = PD.t;
const LO = 0, HI = 10;
const px = (x: number) => X0 + ((x - LO) / (HI - LO)) * (X1 - X0);
const py = (y: number) => Y0 - ((y - LO) / (HI - LO)) * (Y0 - Y1);

const accent = "var(--c-neural)";

function Slider({
  label, value, onChange, min, max,
}: { label: string; value: number; onChange: (v: number) => void; min: number; max: number }) {
  return (
    <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>
      <span style={{ display: "inline-block", width: 22, color: "var(--ink)" }}>{label}</span>
      <input
        type="range" min={min} max={max} step={0.05} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "calc(100% - 84px)", verticalAlign: "middle", accentColor: "var(--c-neural)" }}
      />
      <span style={{ display: "inline-block", width: 52, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
        {value.toFixed(2)}
      </span>
    </label>
  );
}

export function NeuronLab() {
  const [w1, setW1] = useState(1.5);
  const [w2, setW2] = useState(1.0);
  const [b, setB] = useState(-1.0);
  const [smooth, setSmooth] = useState(false);

  const z = (x: number, y: number) => w1 * x + w2 * y + b;
  const out = (x: number, y: number) =>
    smooth ? 1 / (1 + Math.exp(-z(x, y))) : z(x, y) > 0 ? 1 : 0;

  const correct =
    POS.filter(([x, y]) => z(x, y) > 0).length +
    NEG.filter(([x, y]) => z(x, y) <= 0).length;
  const acc = correct / (POS.length + NEG.length);

  const seg = boundarySegment(w1, w2, b, LO, HI);
  const line = seg
    ? `${px(seg[0][0]).toFixed(2)},${py(seg[0][1]).toFixed(2)} ${px(seg[1][0]).toFixed(2)},${py(seg[1][1]).toFixed(2)}`
    : null;
  const region = halfPlanePolygon(w1, w2, b, LO, HI)
    .map(([x, y]) => `${px(x).toFixed(2)},${py(y).toFixed(2)}`)
    .join(" ");

  const dot = ([x, y]: [number, number], isPos: boolean, k: string) => {
    const v = out(x, y);
    const right = isPos ? z(x, y) > 0 : z(x, y) <= 0;
    return (
      <circle
        key={k}
        cx={Number(px(x).toFixed(2))}
        cy={Number(py(y).toFixed(2))}
        r={isPos ? 4.6 : 4.2}
        fill={isPos ? accent : "var(--canvas)"}
        stroke={isPos ? accent : "var(--ink)"}
        strokeWidth={1.4}
        opacity={smooth ? 0.35 + 0.65 * (isPos ? v : 1 - v) : right ? 1 : 0.28}
      />
    );
  };

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.6rem 0" }} className="not-prose">
      <div className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", marginBottom: 2 }}>
        Aim one neuron
      </div>
      <div style={{ fontSize: 12, color: "var(--faint)", marginBottom: 10 }}>
        24 points · three numbers · a perfect answer exists
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
        <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", maxWidth: VW, height: "auto", display: "block", flex: "1 1 300px" }}>
          <defs>
            <clipPath id="neuron-clip">
              <rect x={X0} y={Y1} width={X1 - X0} height={Y0 - Y1} rx={8} />
            </clipPath>
          </defs>
          <rect x={X0} y={Y1} width={X1 - X0} height={Y0 - Y1} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />

          {/* the "on" side of the switch, shaded */}
          <g clipPath="url(#neuron-clip)">
            {region && <polygon points={region} fill={accent} opacity={0.09} />}
            {line && <polyline points={line} fill="none" stroke={accent} strokeWidth={2.4} />}
          </g>

          {NEG.map((p, i) => dot(p, false, `n${i}`))}
          {POS.map((p, i) => dot(p, true, `p${i}`))}

          {[0, 2, 4, 6, 8, 10].map((v) => (
            <text key={`x${v}`} x={px(v)} y={Y0 + 13} fontSize={9} fill="var(--faint)" textAnchor="middle">{v}</text>
          ))}
          {[0, 2, 4, 6, 8, 10].map((v) => (
            <text key={`y${v}`} x={X0 - 6} y={py(v) + 3.5} fontSize={9} fill="var(--faint)" textAnchor="end">{v}</text>
          ))}
          <text x={(X0 + X1) / 2} y={Y0 + 25} fontSize={10} fill="var(--muted)" textAnchor="middle">x₁</text>
        </svg>

        <div style={{ flex: "1 1 210px", minWidth: 200 }}>
          <Slider label="w₁" value={w1} onChange={setW1} min={-4} max={4} />
          <Slider label="w₂" value={w2} onChange={setW2} min={-4} max={4} />
          <Slider label="b" value={b} onChange={setB} min={-6} max={6} />

          <div style={{ background: "var(--surface-2)", borderRadius: 10, padding: "8px 10px", marginTop: 10 }}>
            <div style={{ fontSize: 10.5, color: "var(--muted)" }}>points on the right side</div>
            <div style={{ fontSize: 22, fontWeight: 500, color: acc === 1 ? "var(--good)" : "var(--ink)" }}>
              {correct} <span style={{ fontSize: 13, color: "var(--faint)" }}>/ 24</span>
            </div>
            <div style={{ fontSize: 11, color: "var(--faint)" }}>{(acc * 100).toFixed(1)}% accuracy</div>
          </div>

          <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
            <button
              onClick={() => { setW1(SOLUTION.w1); setW2(SOLUTION.w2); setB(SOLUTION.b); }}
              style={{
                background: `color-mix(in srgb, ${accent} 15%, var(--surface))`,
                color: "var(--ink)",
                border: `1px solid color-mix(in srgb, ${accent} 40%, var(--border))`,
                fontSize: 12, padding: "5px 10px", borderRadius: 8, cursor: "pointer",
              }}
            >
              Snap to the answer
            </button>
            <button
              onClick={() => setSmooth((s) => !s)}
              style={{
                background: "var(--surface-2)", color: "var(--ink)",
                border: "1px solid var(--border)",
                fontSize: 12, padding: "5px 10px", borderRadius: 8, cursor: "pointer",
              }}
            >
              {smooth ? "switch: sigmoid" : "switch: step"}
            </button>
          </div>

          <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 10, lineHeight: 1.5 }}>
            {smooth
              ? "A soft switch. Points fade with confidence — near the line the neuron is barely committed. The line has not moved."
              : "A hard switch. Every point is fully in or fully out, and points on the wrong side are dimmed."}
          </div>
        </div>
      </div>
    </div>
  );
}
