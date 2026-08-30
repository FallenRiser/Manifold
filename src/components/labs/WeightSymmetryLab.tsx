"use client";

import { useMemo, useState } from "react";

// Permuting a hidden layer is a relabelling, not a change. The lab does the
// permutation live on a small net so the reader can watch every weight move
// while every output stays exactly where it was.
//
// The arithmetic is done here rather than pasted, because the claim is an
// identity and a table of numbers would not show that. The measured version on
// a trained 16-unit network is in section 8 of scripts/perceptron_mlp_cases.py:
// permuting the units moved the weights by a mean of 0.8855 and moved the
// predictions by 2.220e-16 -- floating-point noise, not a difference.

const N = 4;                      // hidden units
const accent = "var(--c-neural)";

// A fixed, arbitrary little network: 2 inputs -> 4 tanh units -> 1 output.
const W1 = [[0.82, -1.35, 0.44, 1.07], [-0.61, 0.29, -1.12, 0.53]];
const B1 = [0.15, -0.42, 0.30, -0.08];
const W2 = [1.24, -0.87, 0.66, -1.41];
const B2 = 0.21;

const IDENTITY = [0, 1, 2, 3];
const PRESETS: { label: string; perm: number[]; flip: number[] }[] = [
  { label: "as trained", perm: [0, 1, 2, 3], flip: [1, 1, 1, 1] },
  { label: "swap units 1 & 3", perm: [2, 1, 0, 3], flip: [1, 1, 1, 1] },
  { label: "reverse the layer", perm: [3, 2, 1, 0], flip: [1, 1, 1, 1] },
  { label: "negate units 1 & 2", perm: [0, 1, 2, 3], flip: [-1, -1, 1, 1] },
  { label: "shuffle and negate", perm: [1, 3, 0, 2], flip: [-1, 1, -1, 1] },
];

function evaluate(perm: number[], flip: number[], x: [number, number]) {
  // The relabelled network: unit j of the new net IS unit perm[j] of the old
  // one, optionally negated. Negation is legal because tanh is odd --
  // tanh(-z) = -tanh(z) -- so flipping a unit's incoming weights and its
  // outgoing weight leaves the product untouched.
  const h: number[] = [];
  for (let j = 0; j < N; j++) {
    const src = perm[j], s = flip[j];
    const z = s * (W1[0][src] * x[0] + W1[1][src] * x[1] + B1[src]);
    h.push(Math.tanh(z));
  }
  let out = B2;
  for (let j = 0; j < N; j++) out += h[j] * flip[j] * W2[perm[j]];
  return { h, out };
}

const TEST: [number, number][] = [[1, 0.5], [-0.8, 1.2], [0.3, -1.7], [-1.4, -0.6]];

export function WeightSymmetryLab() {
  const [k, setK] = useState(0);
  const { perm, flip, label } = { ...PRESETS[k], label: PRESETS[k].label };

  const { rows, maxDiff, weightMove } = useMemo(() => {
    const rows = TEST.map((x) => {
      const a = evaluate(IDENTITY, [1, 1, 1, 1], x);
      const b = evaluate(perm, flip, x);
      return { x, before: a.out, after: b.out, hb: b.h };
    });
    const maxDiff = Math.max(...rows.map((r) => Math.abs(r.before - r.after)));
    // How far did the parameters themselves travel?
    let move = 0, n = 0;
    for (let j = 0; j < N; j++)
      for (let i = 0; i < 2; i++) {
        move += Math.abs(W1[i][j] - flip[j] * W1[i][perm[j]]);
        n++;
      }
    return { rows, maxDiff, weightMove: move / n };
  }, [perm, flip]);

  const newW1 = (i: number, j: number) => flip[j] * W1[i][perm[j]];

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.6rem 0" }} className="not-prose">
      <div className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", marginBottom: 2 }}>
        Relabel the hidden layer
      </div>
      <div style={{ fontSize: 12, color: "var(--faint)", marginBottom: 10 }}>
        2 → 4 tanh units → 1 · the weights are rearranged, the function is not
      </div>

      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 12 }}>
        {PRESETS.map((p, i) => (
          <button
            key={p.label}
            onClick={() => setK(i)}
            style={{
              background: i === k ? `color-mix(in srgb, ${accent} 18%, var(--surface))` : "var(--surface-2)",
              color: "var(--ink)",
              border: `1px solid ${i === k ? `color-mix(in srgb, ${accent} 45%, var(--border))` : "var(--border)"}`,
              fontSize: 12, padding: "5px 10px", borderRadius: 8, cursor: "pointer",
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 10 }}>
        <div style={{ background: "var(--surface-2)", borderRadius: 10, padding: "8px 10px" }}>
          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 5 }}>first-layer weights, as trained</div>
          <table style={{ fontSize: 12, borderCollapse: "collapse", fontVariantNumeric: "tabular-nums" }}>
            <tbody>
              {[0, 1].map((i) => (
                <tr key={i}>
                  {[0, 1, 2, 3].map((j) => (
                    <td key={j} style={{ padding: "2px 7px 2px 0", color: "var(--muted)" }}>{W1[i][j].toFixed(2)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ background: "var(--surface-2)", borderRadius: 10, padding: "8px 10px" }}>
          <div style={{ fontSize: 11, color: accent, marginBottom: 5 }}>the same network, relabelled</div>
          <table style={{ fontSize: 12, borderCollapse: "collapse", fontVariantNumeric: "tabular-nums" }}>
            <tbody>
              {[0, 1].map((i) => (
                <tr key={i}>
                  {[0, 1, 2, 3].map((j) => (
                    <td key={j} style={{ padding: "2px 7px 2px 0", color: Math.abs(newW1(i, j) - W1[i][j]) > 1e-9 ? accent : "var(--muted)" }}>
                      {newW1(i, j).toFixed(2)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ overflowX: "auto", marginTop: 12 }}>
        <table style={{ borderCollapse: "collapse", fontSize: 12.5, minWidth: 380 }}>
          <thead>
            <tr>
              {["input", "output before", "output after", "difference"].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "5px 16px 5px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td style={{ padding: "5px 16px 5px 0", color: "var(--muted)", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>
                  ({r.x[0].toFixed(1)}, {r.x[1].toFixed(1)})
                </td>
                <td style={{ padding: "5px 16px 5px 0", color: "var(--ink)", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>{r.before.toFixed(9)}</td>
                <td style={{ padding: "5px 16px 5px 0", color: "var(--ink)", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>{r.after.toFixed(9)}</td>
                <td style={{ padding: "5px 16px 5px 0", color: "var(--good)", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>
                  {Math.abs(r.before - r.after) === 0 ? "0" : Math.abs(r.before - r.after).toExponential(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
        {[
          ["weights changed by (mean)", weightMove.toFixed(4), weightMove > 0],
          ["outputs changed by (max)", maxDiff === 0 ? "0" : maxDiff.toExponential(1), false],
        ].map(([l, v, hot]) => (
          <div key={l as string} style={{ background: "var(--surface-2)", borderRadius: 10, padding: "6px 10px", flex: "1 1 150px" }}>
            <div style={{ fontSize: 10.5, color: "var(--muted)" }}>{l as string}</div>
            <div style={{ fontSize: 17, fontWeight: 500, color: hot ? accent : "var(--good)", fontVariantNumeric: "tabular-nums" }}>{v as string}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 10, lineHeight: 1.55 }}>
        {k === 0
          ? "The starting point: no relabelling, so nothing has moved. Pick any of the other four."
          : maxDiff === 0
            ? `Every weight in the layer is different and the outputs are identical to the last decimal — the difference is exactly zero, not merely small. “${label}” produced a different point in weight space and the same function.`
            : `The weights moved by ${weightMove.toFixed(4)} on average and the outputs moved by ${maxDiff.toExponential(1)} — floating-point rounding, not a change in the function.`}
      </div>
    </div>
  );
}
