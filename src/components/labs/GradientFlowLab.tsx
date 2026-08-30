"use client";

import { useState } from "react";

// Gradient norm per layer in a 12-hidden-layer network, measured at
// initialisation in scripts/backprop_cases.py section 3 (two moons, 400 points,
// Xavier init, one full backward pass -- no training, so nothing here is a
// consequence of a bad optimiser).
//
// The axis is LOGARITHMIC and says so, because on a linear axis the sigmoid
// curve is a flat line pinned to zero for eleven layers and the entire effect
// is invisible. The bars are drawn from the smallest value on the chart, so
// their heights are honest ratios rather than a chosen baseline.
//
// The third control is the one that makes this more than a slogan: the same
// sigmoid network at three initialisation scales spans 2.9e7 down to 65, so
// "sigmoid vanishes" is not a property of the activation alone.
//
// The Activation functions track needs the same chart over the whole zoo, so
// `extended` adds four more series measured under identical conditions in
// section 2 of scripts/activation_cases.py. The backprop track keeps the
// three-way comparison it introduced, because there the point is the
// mechanism, not the shopping list.

type Series = { key: string; label: string; norms: number[]; note: string };

const BY_ACT: Series[] = [
  {
    key: "sigmoid",
    label: "sigmoid",
    norms: [6.887e-9, 2.598e-8, 9.623e-8, 4.809e-7, 2.264e-6, 7.622e-6, 3.932e-5,
      1.499e-4, 6.798e-4, 3.192e-3, 1.346e-2, 6.011e-2, 1.997e-1],
    note: "Every layer back, the gradient is roughly four times smaller than the one after it. Thirteen layers of that is a factor of 29 million.",
  },
  {
    key: "tanh",
    label: "tanh",
    norms: [8.512e-2, 2.014e-1, 1.607e-1, 1.828e-1, 1.719e-1, 1.062e-1, 1.358e-1,
      1.241e-1, 1.708e-1, 1.660e-1, 1.613e-1, 1.523e-1, 1.385e-1],
    note: "Essentially flat. tanh has a maximum slope of 1 at zero and is zero-centred, so the products do not systematically shrink.",
  },
  {
    key: "relu",
    label: "ReLU",
    norms: [3.337e-3, 5.868e-3, 5.306e-3, 4.906e-3, 3.145e-3, 1.992e-3, 1.569e-3,
      1.756e-3, 2.283e-3, 3.310e-3, 2.216e-3, 2.490e-3, 8.525e-4],
    note: "Also flat. ReLU's slope is exactly 1 wherever a unit is on, so it multiplies the signal by 1 rather than by a fraction.",
  },
];

// The same measurement over the rest of the zoo -- identical data, depth, init
// and seed (scripts/activation_cases.py section 2, which reproduces the three
// series above exactly before adding these).
const EXTRA: Series[] = [
  {
    key: "leaky",
    label: "Leaky ReLU",
    norms: [3.286e-3, 5.745e-3, 5.176e-3, 4.957e-3, 3.250e-3, 2.142e-3, 1.603e-3,
      1.725e-3, 2.378e-3, 3.508e-3, 2.301e-3, 2.535e-3, 8.543e-4],
    note: "Indistinguishable from ReLU here — 0.260 against 0.256. The leak fixes what happens to a unit that has already died, and at initialisation almost none have.",
  },
  {
    key: "elu",
    label: "ELU",
    norms: [4.790e-2, 1.414e-1, 1.344e-1, 1.462e-1, 1.430e-1, 9.792e-2, 1.063e-1,
      9.216e-2, 1.316e-1, 1.208e-1, 1.181e-1, 1.128e-1, 1.013e-1],
    note: "Flat, and at a far higher absolute level than ReLU — the negative half contributes signal instead of zero, so more of the network is participating in the backward pass.",
  },
  {
    key: "gelu",
    label: "GELU",
    norms: [5.409e-5, 1.430e-4, 1.170e-4, 1.129e-4, 1.112e-4, 7.740e-5, 9.086e-5,
      9.191e-5, 1.301e-4, 1.219e-4, 1.271e-4, 1.218e-4, 1.040e-4],
    note: "Flat, with a ratio of 1.92 — but note the absolute level, four orders of magnitude below ELU. A flat profile says the gradient is not vanishing with depth; it says nothing about whether it is large.",
  },
  {
    key: "swish",
    label: "Swish",
    norms: [5.258e-5, 1.415e-4, 1.141e-4, 1.221e-4, 1.164e-4, 8.044e-5, 9.501e-5,
      9.262e-5, 1.316e-4, 1.219e-4, 1.230e-4, 1.126e-4, 9.939e-5],
    note: "Essentially GELU's profile, which is what you would expect from two curves that differ by at most 0.02 everywhere. Nothing here would let you tell them apart.",
  },
];

// Same sigmoid network, three initialisation scales (section 3, second table).
const BY_INIT: { label: string; first: number; last: number; ratio: string }[] = [
  { label: "Xavier", first: 6.89e-9, last: 1.997e-1, ratio: "2.9 × 10⁷" },
  { label: "0.5", first: 6.16e-6, last: 4.24e-1, ratio: "6.9 × 10⁴" },
  { label: "2.0", first: 1.68e-2, last: 1.09, ratio: "65" },
];

const VW = 440, VH = 220, PD = { l: 46, r: 14, t: 16, b: 40 };
const X0 = PD.l, X1 = VW - PD.r, Y0 = VH - PD.b, Y1 = PD.t;
const LO = -9, HI = 0.5;                   // log10 bounds covering every series
const py = (v: number) => Y0 - ((Math.log10(v) - LO) / (HI - LO)) * (Y0 - Y1);
const accent = "var(--c-neural)";

export function GradientFlowLab({ extended = false }: { extended?: boolean }) {
  const series = extended ? [...BY_ACT, ...EXTRA] : BY_ACT;
  const [k, setK] = useState(0);
  const s = series[k];
  const n = s.norms.length;
  const bw = (X1 - X0) / n;
  const ratio = s.norms[n - 1] / s.norms[0];

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.6rem 0" }} className="not-prose">
      <div className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", marginBottom: 2 }}>
        How much gradient reaches each layer?
      </div>
      <div style={{ fontSize: 12, color: "var(--faint)", marginBottom: 10 }}>
        12 hidden layers · Xavier init · one backward pass, before any training · <strong style={{ color: "var(--muted)" }}>log scale</strong>
      </div>

      <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", maxWidth: VW, height: "auto", display: "block" }}>
        <rect x={X0} y={Y1} width={X1 - X0} height={Y0 - Y1} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />

        {[-8, -6, -4, -2, 0].map((e) => (
          <g key={e}>
            <line x1={X0} y1={py(10 ** e)} x2={X1} y2={py(10 ** e)} stroke="var(--border)" strokeWidth={1} strokeDasharray="3 3" />
            <text x={X0 - 6} y={py(10 ** e) + 3.5} fontSize={9} fill="var(--faint)" textAnchor="end">
              10{e === 0 ? "⁰" : `⁻${String(Math.abs(e)).replace(/\d/g, (d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[+d])}`}
            </text>
          </g>
        ))}

        {s.norms.map((v, i) => (
          <rect
            key={i}
            x={(X0 + i * bw + bw * 0.16).toFixed(2)}
            y={py(v).toFixed(2)}
            width={(bw * 0.68).toFixed(2)}
            height={Math.max(0.5, Y0 - py(v)).toFixed(2)}
            fill={accent}
            opacity={i === 0 ? 1 : 0.55}
            rx={1.5}
          />
        ))}

        <text x={X0 + bw * 0.5} y={Y0 + 14} fontSize={9} fill="var(--ink)" textAnchor="middle">1</text>
        <text x={X0 + bw * (n - 0.5)} y={Y0 + 14} fontSize={9} fill="var(--ink)" textAnchor="middle">{n}</text>
        <text x={(X0 + X1) / 2} y={Y0 + 30} fontSize={10} fill="var(--muted)" textAnchor="middle">
          layer (1 = nearest the input, {n} = nearest the loss)
        </text>
      </svg>

      <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
        {series.map((a, i) => (
          <button
            key={a.key}
            onClick={() => setK(i)}
            style={{
              background: i === k ? `color-mix(in srgb, ${accent} 18%, var(--surface))` : "var(--surface-2)",
              color: "var(--ink)",
              border: `1px solid ${i === k ? `color-mix(in srgb, ${accent} 45%, var(--border))` : "var(--border)"}`,
              fontSize: 12.5, padding: "5px 12px", borderRadius: 8, cursor: "pointer",
            }}
          >
            {a.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
        {[
          ["layer 1 (deepest back)", s.norms[0].toExponential(2)],
          ["layer 13 (at the loss)", s.norms[n - 1].toExponential(2)],
          ["last ÷ first", ratio > 1000 ? ratio.toExponential(1) : ratio.toFixed(3)],
        ].map(([label, value], i) => (
          <div key={label} style={{ background: "var(--surface-2)", borderRadius: 10, padding: "6px 10px", flex: "1 1 108px" }}>
            <div style={{ fontSize: 10.5, color: "var(--muted)" }}>{label}</div>
            <div style={{ fontSize: 15, fontWeight: 500, color: i === 2 && ratio > 1000 ? "var(--bad)" : "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 10, lineHeight: 1.55 }}>{s.note}</div>

      <details style={{ marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 10 }}>
        <summary className="font-display" style={{ fontSize: 12.5, color: accent, cursor: "pointer" }}>
          It is not only the activation — try the initialisation scale
        </summary>
        <div style={{ marginTop: 8, overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 12.5, minWidth: 380 }}>
            <thead>
              <tr>
                {["sigmoid net, init scale", "layer 1", "layer 13", "ratio"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "5px 16px 5px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {BY_INIT.map((r) => (
                <tr key={r.label}>
                  <td style={{ padding: "5px 16px 5px 0", color: "var(--ink)", borderBottom: "1px solid var(--border)" }}>{r.label}</td>
                  <td style={{ padding: "5px 16px 5px 0", color: "var(--ink)", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>{r.first.toExponential(2)}</td>
                  <td style={{ padding: "5px 16px 5px 0", color: "var(--ink)", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>{r.last.toExponential(2)}</td>
                  <td style={{ padding: "5px 16px 5px 0", color: accent, borderBottom: "1px solid var(--border)" }}>{r.ratio}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 8, lineHeight: 1.5 }}>
            Same activation, same depth, same data — and the vanishing spans six orders of magnitude depending on how
            the weights were drawn. &ldquo;Sigmoid vanishes&rdquo; is true but incomplete; the honest statement is
            that the <em>product of slopes and weights</em> vanishes, and the initialisation sets half of that
            product.
          </div>
        </div>
      </details>
    </div>
  );
}
