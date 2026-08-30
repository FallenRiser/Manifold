"use client";

import { useState } from "react";

// Depth without a non-linearity buys nothing -- shown, not asserted.
//
// Three stacked layers (1 -> 4 -> 4 -> 1) are evaluated here, exactly, for
// every x on screen. With the activation switched off the curve is a straight
// line for EVERY setting of the weights, and the lab says by how much it
// differs from the single equivalent line it collapses to -- a number that
// stays at floating-point noise no matter how many times the reader re-rolls.
// This mirrors scripts/perceptron_mlp_cases.py section 3, which measured
// 3.979e-13 over 500 inputs on a 1,761-parameter version of the same stack.
//
// The re-roll button is the important control. One straight line is a
// coincidence; eight in a row is a proof you can feel.

const H = 4;

// A tiny deterministic generator, so the "random" weights are the same for
// every reader and on every render -- no hydration surface.
function lcg(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return (s / 4294967296) * 2 - 1;      // (-1, 1)
  };
}

function weights(seed: number) {
  const r = lcg(seed * 7919 + 13);
  const W1 = Array.from({ length: H }, () => r() * 1.8);
  const b1 = Array.from({ length: H }, () => r() * 1.2);
  const W2 = Array.from({ length: H }, () => Array.from({ length: H }, () => r() * 1.1));
  const b2 = Array.from({ length: H }, () => r() * 0.8);
  const W3 = Array.from({ length: H }, () => r() * 1.4);
  const b3 = r() * 0.5;
  return { W1, b1, W2, b2, W3, b3 };
}

function forward(x: number, w: ReturnType<typeof weights>, act: boolean) {
  const relu = (v: number) => (act ? Math.max(0, v) : v);
  const h1 = w.W1.map((wi, i) => relu(wi * x + w.b1[i]));
  const h2 = w.b2.map((bj, j) => relu(h1.reduce((s, hi, i) => s + hi * w.W2[i][j], 0) + bj));
  return h2.reduce((s, hj, j) => s + hj * w.W3[j], 0) + w.b3;
}

// The single line the stack collapses to when nothing is bent.
function collapsed(w: ReturnType<typeof weights>) {
  const wEq = w.W1.reduce(
    (s, w1i, i) => s + w1i * w.W2[i].reduce((t, w2ij, j) => t + w2ij * w.W3[j], 0), 0,
  );
  const bEq =
    w.b1.reduce((s, b1i, i) => s + b1i * w.W2[i].reduce((t, w2ij, j) => t + w2ij * w.W3[j], 0), 0) +
    w.b2.reduce((s, b2j, j) => s + b2j * w.W3[j], 0) + w.b3;
  return { wEq, bEq };
}

const VW = 420, VH = 230, PD = { l: 40, r: 14, t: 14, b: 28 };
const X0 = PD.l, X1 = VW - PD.r, Y0 = VH - PD.b, Y1 = PD.t;
const XLO = -3, XHI = 3;
const accent = "var(--c-neural)";

export function LinearCollapseLab() {
  const [seed, setSeed] = useState(1);
  const [act, setAct] = useState(false);

  const w = weights(seed);
  const N = 120;
  const xs = Array.from({ length: N + 1 }, (_, i) => XLO + (i / N) * (XHI - XLO));
  const ys = xs.map((x) => forward(x, w, act));

  const { wEq, bEq } = collapsed(w);
  const gap = Math.max(...xs.map((x, i) => Math.abs(ys[i] - (wEq * x + bEq))));

  const lo = Math.min(...ys), hi = Math.max(...ys);
  const pad = Math.max(0.4, (hi - lo) * 0.15);
  const YLO = lo - pad, YHI = hi + pad;
  const px = (x: number) => X0 + ((x - XLO) / (XHI - XLO)) * (X1 - X0);
  const py = (y: number) => Y0 - ((y - YLO) / (YHI - YLO)) * (Y0 - Y1);

  const path = xs.map((x, i) => `${px(x).toFixed(2)},${py(ys[i]).toFixed(2)}`).join(" ");
  const straight = `${px(XLO).toFixed(2)},${py(wEq * XLO + bEq).toFixed(2)} ${px(XHI).toFixed(2)},${py(wEq * XHI + bEq).toFixed(2)}`;

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.6rem 0" }} className="not-prose">
      <div className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", marginBottom: 2 }}>
        Three layers, one input, one output
      </div>
      <div style={{ fontSize: 12, color: "var(--faint)", marginBottom: 10 }}>
        1 → 4 → 4 → 1 · {4 + 4 + 16 + 4 + 4 + 1} parameters · evaluated exactly for every x on screen
      </div>

      <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", maxWidth: VW, height: "auto", display: "block" }}>
        <rect x={X0} y={Y1} width={X1 - X0} height={Y0 - Y1} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        {/* the single equivalent line, drawn underneath so the reader can see the
            network's curve sitting exactly on top of it when act is off */}
        <polyline points={straight} fill="none" stroke="var(--muted)" strokeWidth={4} opacity={0.3} strokeDasharray="6 4" />
        <polyline points={path} fill="none" stroke={accent} strokeWidth={2.4} />
        <text x={X0 + 8} y={Y1 + 14} fontSize={9.5} fill="var(--faint)">
          dashed = the one-line equivalent
        </text>
        <text x={(X0 + X1) / 2} y={Y0 + 20} fontSize={10} fill="var(--muted)" textAnchor="middle">input x</text>
      </svg>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10, alignItems: "stretch" }}>
        <button
          onClick={() => setAct((a) => !a)}
          style={{
            background: `color-mix(in srgb, ${accent} 15%, var(--surface))`,
            color: "var(--ink)",
            border: `1px solid color-mix(in srgb, ${accent} 40%, var(--border))`,
            fontSize: 12.5, padding: "6px 12px", borderRadius: 8, cursor: "pointer",
          }}
        >
          {act ? "Turn the activation off" : "Turn the activation on"}
        </button>
        <button
          onClick={() => setSeed((s) => s + 1)}
          style={{
            background: "var(--surface-2)", color: "var(--ink)",
            border: "1px solid var(--border)",
            fontSize: 12.5, padding: "6px 12px", borderRadius: 8, cursor: "pointer",
          }}
        >
          New random weights
        </button>
        <div style={{ background: "var(--surface-2)", borderRadius: 10, padding: "5px 10px" }}>
          <div style={{ fontSize: 10.5, color: "var(--muted)" }}>distance from a straight line</div>
          <div style={{ fontSize: 15, fontWeight: 500, color: act ? "var(--good)" : "var(--muted)", fontVariantNumeric: "tabular-nums" }}>
            {gap < 1e-9 ? gap.toExponential(2) : gap.toFixed(3)}
          </div>
        </div>
      </div>

      <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 10, lineHeight: 1.55 }}>
        {act
          ? "Now it bends — and the bends are exactly where a unit crosses zero and switches on. Every kink you can see is one neuron waking up."
          : `Straight. Not approximately: the whole 33-parameter stack is identical to y = ${wEq.toFixed(3)}x + ${bEq.toFixed(3)}, which has two. Re-roll as often as you like.`}
      </div>
    </div>
  );
}
