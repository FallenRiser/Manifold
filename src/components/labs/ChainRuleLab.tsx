"use client";

import { useState } from "react";

// The chain rule as a product of local slopes, on a chain the reader can bend.
//
// Everything is computed here, exactly: the forward values, each local
// derivative, their running product, and -- as a check the reader can watch --
// a finite-difference estimate of the true end-to-end derivative. The two agree
// to several decimals for every slider setting, which is the point: the chain
// rule is not an approximation scheme, it is bookkeeping for something exact.
//
// The failure case is playable. Push the gains toward zero and the product
// collapses; push them past 1 and it explodes. That IS vanishing and exploding
// gradients, four pages early and in miniature.

const N = 4;

function chain(x: number, gains: number[]) {
  // Each stage is v -> tanh(g * v). tanh is used because its slope is bounded
  // by 1, so the reader can see decay arise from the activation itself and not
  // only from the weights.
  const vals = [x];
  const locals: number[] = [];
  let v = x;
  for (let i = 0; i < N; i++) {
    const z = gains[i] * v;
    const a = Math.tanh(z);
    locals.push(gains[i] * (1 - a * a));      // d a / d v
    v = a;
    vals.push(v);
  }
  return { vals, locals };
}

const accent = "var(--c-neural)";
const VW = 470, VH = 118;

export function ChainRuleLab() {
  const [x, setX] = useState(0.6);
  const [gains, setGains] = useState<number[]>([1.2, 1.2, 1.2, 1.2]);

  const { vals, locals } = chain(x, gains);
  const product = locals.reduce((a, b) => a * b, 1);

  // The same derivative, obtained without any calculus at all.
  const h = 1e-6;
  const up = chain(x + h, gains).vals[N];
  const dn = chain(x - h, gains).vals[N];
  const numeric = (up - dn) / (2 * h);

  const setGain = (i: number, v: number) =>
    setGains((g) => g.map((old, j) => (j === i ? v : old)));

  const nodeX = (i: number) => 32 + i * ((VW - 64) / N);

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.6rem 0" }} className="not-prose">
      <div className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", marginBottom: 2 }}>
        Four stages in a row
      </div>
      <div style={{ fontSize: 12, color: "var(--faint)", marginBottom: 10 }}>
        each stage computes tanh(g × input) · the end-to-end slope is the product of the four local slopes
      </div>

      <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", maxWidth: VW, height: "auto", display: "block" }}>
        {Array.from({ length: N }).map((_, i) => (
          <g key={i}>
            <line x1={nodeX(i) + 15} y1={46} x2={nodeX(i + 1) - 15} y2={46} stroke="var(--border-strong)" strokeWidth={1.3} />
            <text
              x={(nodeX(i) + nodeX(i + 1)) / 2} y={34} fontSize={10}
              fill={Math.abs(locals[i]) < 0.35 ? "var(--bad)" : accent} textAnchor="middle"
            >
              ×{locals[i].toFixed(3)}
            </text>
          </g>
        ))}
        {Array.from({ length: N + 1 }).map((_, i) => (
          <g key={`n${i}`}>
            <circle cx={nodeX(i)} cy={46} r={15} fill="var(--surface)" stroke={i === 0 || i === N ? accent : "var(--border-strong)"} strokeWidth={i === 0 || i === N ? 1.6 : 1} />
            <text x={nodeX(i)} y={50} fontSize={10} fill="var(--ink)" textAnchor="middle">{vals[i].toFixed(2)}</text>
            <text x={nodeX(i)} y={78} fontSize={9} fill="var(--faint)" textAnchor="middle">
              {i === 0 ? "input" : i === N ? "output" : `stage ${i}`}
            </text>
          </g>
        ))}
        <text x={VW / 2} y={104} fontSize={9.5} fill="var(--muted)" textAnchor="middle">
          local slopes, multiplied left to right
        </text>
      </svg>

      <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
        <span style={{ display: "inline-block", width: 40, color: "var(--ink)" }}>input</span>
        <input type="range" min={-2} max={2} step={0.05} value={x}
          onChange={(e) => setX(Number(e.target.value))}
          style={{ width: "calc(100% - 96px)", verticalAlign: "middle", accentColor: "var(--c-neural)" }} />
        <span style={{ display: "inline-block", width: 48, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{x.toFixed(2)}</span>
      </label>

      {gains.map((g, i) => (
        <label key={i} style={{ display: "block", fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
          <span style={{ display: "inline-block", width: 40, color: "var(--ink)" }}>g{i + 1}</span>
          <input type="range" min={0} max={3} step={0.05} value={g}
            onChange={(e) => setGain(i, Number(e.target.value))}
            style={{ width: "calc(100% - 96px)", verticalAlign: "middle", accentColor: "var(--c-neural)" }} />
          <span style={{ display: "inline-block", width: 48, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{g.toFixed(2)}</span>
        </label>
      ))}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
        <div style={{ background: "var(--surface-2)", borderRadius: 10, padding: "6px 10px", flex: "1 1 130px" }}>
          <div style={{ fontSize: 10.5, color: "var(--muted)" }}>product of local slopes</div>
          <div style={{ fontSize: 17, fontWeight: 500, color: accent, fontVariantNumeric: "tabular-nums" }}>
            {Math.abs(product) < 1e-4 ? product.toExponential(2) : product.toFixed(5)}
          </div>
        </div>
        <div style={{ background: "var(--surface-2)", borderRadius: 10, padding: "6px 10px", flex: "1 1 130px" }}>
          <div style={{ fontSize: 10.5, color: "var(--muted)" }}>measured by nudging the input</div>
          <div style={{ fontSize: 17, fontWeight: 500, color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
            {Math.abs(numeric) < 1e-4 ? numeric.toExponential(2) : numeric.toFixed(5)}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
        {/* Saturate every stage: a large input through a large gain drives each
            tanh flat, so 1 - a^2 collapses. Product 1.02e-5 -- five orders of
            magnitude, and by the mechanism that actually kills sigmoid nets. */}
        <button
          onClick={() => { setGains([2, 2, 2, 2]); setX(2); }}
          style={{ background: "var(--surface-2)", color: "var(--ink)", border: "1px solid var(--border)", fontSize: 12, padding: "5px 10px", borderRadius: 8, cursor: "pointer" }}
        >
          Saturate it
        </button>
        {/* At x = 0 nothing saturates, so every local slope is exactly the gain
            and the product is g^4 = 81. */}
        <button
          onClick={() => { setGains([3, 3, 3, 3]); setX(0); }}
          style={{ background: "var(--surface-2)", color: "var(--ink)", border: "1px solid var(--border)", fontSize: 12, padding: "5px 10px", borderRadius: 8, cursor: "pointer" }}
        >
          Make it explode
        </button>
        <button
          onClick={() => { setGains([1.2, 1.2, 1.2, 1.2]); setX(0.6); }}
          style={{ background: `color-mix(in srgb, ${accent} 15%, var(--surface))`, color: "var(--ink)", border: `1px solid color-mix(in srgb, ${accent} 40%, var(--border))`, fontSize: 12, padding: "5px 10px", borderRadius: 8, cursor: "pointer" }}
        >
          Reset
        </button>
      </div>

      <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 10, lineHeight: 1.55 }}>
        The two numbers agree at every setting — one from calculus, one from nudging the input and watching the
        output. <em>Saturate it</em> drives the product to <strong>1.0 × 10<sup>−5</sup></strong> in four stages;{" "}
        <em>explode</em> reaches <strong>81</strong>, because at an input of zero nothing saturates and every local
        slope is exactly the gain. A real network has twelve stages, not four.
      </div>
    </div>
  );
}
