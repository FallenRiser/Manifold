"use client";

import { useState } from "react";

// Section 8 of scripts/backprop_cases.py: two moons, a 2-32-32-1 ReLU network,
// minibatch SGD at batch 32 for 120 epochs, five seeds per schedule.
//
// The comparison is deliberately awkward for the schedules: the constant rate
// is SWEPT (0.5, 0.1, 0.05, 0.01) so that a schedule has to beat the best
// constant rather than a badly chosen one. It does, but the win is mostly in
// the last two columns rather than the first -- the loss floor and the
// seed-to-seed spread, not a large jump in test accuracy.
//
// The detail that makes the page: every schedule here STARTS at 0.5, which as
// a constant rate is the worst option in the table (0.8667 accuracy, and a
// spread of 0.21). Decaying turns the worst constant into the best run.

type Row = {
  key: string; label: string; kind: string; base: number;
  loss: number; lspread: number; acc: number; aspread: number;
  curve: number[]; note: string;
};

const ROWS: Row[] = [
  {
    key: "constant@0.5", label: "constant 0.5", kind: "constant", base: 0.5,
    loss: 0.3292, lspread: 0.8793, acc: 0.8667, aspread: 0.2143,
    curve: [0.3052, 0.3198, 0.271, 0.2153, 0.2048, 0.1844, 0.2045, 0.2213, 0.1226, 0.1172, 0.1217, 0.1352, 0.142, 0.1046, 0.108, 0.8985, 0.2148, 0.5811, 0.1033, 0.1071, 0.0987, 0.0977, 0.0998, 0.0993, 0.1804, 0.0989, 0.1002, 0.0948, 0.0934, 0.0925, 0.121, 0.0925, 0.1144, 0.0953, 0.11, 0.1068, 0.0994, 0.0919, 0.1282, 0.0993],
    note: "Large steps explore fast and then cannot settle. Look at the spikes to 0.90 and 0.58 at epochs 45 and 54 — 120 epochs in, single minibatches are still throwing the model across the landscape. The loss spread across five seeds is 0.88, and the accuracy spread is 0.21.",
  },
  {
    key: "constant@0.1", label: "constant 0.1", kind: "constant", base: 0.1,
    loss: 0.1318, lspread: 0.0402, acc: 0.9114, aspread: 0.0429,
    curve: [0.3453, 0.2886, 0.2711, 0.2612, 0.2537, 0.2534, 0.2571, 0.2475, 0.2415, 0.2335, 0.2292, 0.2252, 0.2187, 0.2116, 0.2044, 0.2616, 0.1955, 0.1925, 0.1776, 0.1695, 0.1617, 0.1591, 0.1503, 0.1499, 0.1575, 0.1387, 0.1315, 0.1275, 0.1244, 0.1218, 0.1212, 0.1187, 0.125, 0.1146, 0.1158, 0.113, 0.1112, 0.1101, 0.1569, 0.1111],
    note: "The best constant in the sweep, and the honest thing to beat. Stable, still improving at the end, and 0.1318 — about 43% above the loss the decayed runs reach.",
  },
  {
    key: "constant@0.05", label: "constant 0.05", kind: "constant", base: 0.05,
    loss: 0.1524, lspread: 0.0287, acc: 0.9057, aspread: 0.0286,
    curve: [0.3826, 0.3144, 0.2918, 0.2792, 0.2706, 0.2655, 0.2624, 0.2587, 0.2548, 0.2516, 0.2492, 0.2477, 0.2449, 0.2427, 0.2407, 0.2487, 0.2367, 0.2363, 0.2327, 0.2296, 0.2272, 0.2258, 0.2224, 0.2216, 0.2167, 0.2133, 0.2077, 0.2034, 0.1993, 0.1958, 0.1912, 0.187, 0.1833, 0.1783, 0.1749, 0.1713, 0.1738, 0.1642, 0.1682, 0.1614],
    note: "Smoother and slower. Note it has not finished: the curve is still descending at epoch 120, so its final number is a statement about the budget as much as about the rate.",
  },
  {
    key: "constant@0.01", label: "constant 0.01", kind: "constant", base: 0.01,
    loss: 0.2489, lspread: 0.0099, acc: 0.8457, aspread: 0.0048,
    curve: [0.5563, 0.4022, 0.3635, 0.3443, 0.3319, 0.3229, 0.316, 0.3104, 0.3053, 0.3012, 0.2974, 0.2942, 0.2909, 0.288, 0.2853, 0.2828, 0.2807, 0.2788, 0.2768, 0.2751, 0.2735, 0.272, 0.2705, 0.2693, 0.2679, 0.2667, 0.2655, 0.2644, 0.2634, 0.2625, 0.2616, 0.2608, 0.2599, 0.2592, 0.2584, 0.2577, 0.2569, 0.2562, 0.2556, 0.255],
    note: "The most reproducible run in the table — a spread of 0.005 in accuracy — and the worst one. Very small steps average the noise away and go almost nowhere. Consistency is not the goal.",
  },
  {
    key: "step@0.5", label: "step decay", kind: "step", base: 0.5,
    loss: 0.0933, lspread: 0.0045, acc: 0.9190, aspread: 0.0095,
    curve: [0.3052, 0.3198, 0.271, 0.2153, 0.2048, 0.1844, 0.2045, 0.2213, 0.1226, 0.1172, 0.1217, 0.1352, 0.142, 0.1046, 0.108, 0.8985, 0.2148, 0.5811, 0.1033, 0.1071, 0.0973, 0.0955, 0.0949, 0.0949, 0.0953, 0.0941, 0.0938, 0.0936, 0.0936, 0.0934, 0.0947, 0.0942, 0.0938, 0.0936, 0.0935, 0.0934, 0.0933, 0.0932, 0.0932, 0.0932],
    note: "The staircase everyone recognises. Identical to constant 0.5 for the first 60 epochs — the same spikes — and then the ×0.1 drop lands and the curve goes flat and quiet. Best test accuracy in the table, from the worst constant rate.",
  },
  {
    key: "cosine@0.5", label: "cosine decay", kind: "cosine", base: 0.5,
    loss: 0.0920, lspread: 0.0046, acc: 0.9171, aspread: 0.0143,
    curve: [0.3052, 0.3012, 0.3081, 0.3196, 0.3106, 0.2598, 0.2711, 0.2561, 0.3846, 0.215, 0.2277, 0.2924, 0.2037, 0.4319, 0.1678, 0.1826, 0.151, 0.333, 0.2027, 0.1802, 0.5565, 0.2137, 0.1216, 0.1319, 0.1213, 0.1459, 0.1296, 0.1163, 0.5576, 0.1257, 0.1199, 0.3238, 0.1216, 0.1277, 0.1142, 0.115, 0.1347, 0.2263, 0.1074, 0.1038],
    note: "No cliff — the rate is shrinking from the first step, so the noise is squeezed out gradually rather than all at once. Lowest loss in the table at 0.0920, and a spread of 0.0046 against the best constant's 0.0402.",
  },
  {
    key: "warmcos@0.5", label: "warmup + cosine", kind: "warmcos", base: 0.5,
    loss: 0.0913, lspread: 0.0033, acc: 0.9181, aspread: 0.0143,
    curve: [0.4058, 0.326, 0.2963, 0.2976, 0.3061, 0.2855, 0.3008, 0.274, 0.3972, 0.2458, 0.2527, 0.3179, 0.2412, 0.4415, 0.1881, 0.2055, 0.1798, 0.3523, 0.2324, 0.1937, 0.4362, 0.2248, 0.1316, 0.1395, 0.1293, 0.159, 0.1303, 0.1189, 0.7319, 0.1304, 0.1237, 0.3867, 0.1201, 0.1273, 0.1138, 0.1159, 0.1364, 0.2331, 0.1094, 0.1035],
    note: "The transformer default. On a problem this small the warmup earns almost nothing over plain cosine — 0.0913 against 0.0920, well inside the spread. It exists for large-batch and adaptive-optimiser runs whose first few hundred steps are genuinely unstable, which this is not.",
  },
];

// The shape of each schedule (base 0.5), from the same section.
const SHAPES: Record<string, number[]> = {
  constant: Array(40).fill(0.5),
  step: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.005, 0.005, 0.005, 0.005, 0.005, 0.005, 0.005, 0.005, 0.005, 0.005],
  cosine: [0.5, 0.4992, 0.4968, 0.4927, 0.4871, 0.48, 0.4714, 0.4613, 0.4499, 0.4371, 0.4232, 0.4081, 0.392, 0.375, 0.3572, 0.3387, 0.3196, 0.3, 0.2801, 0.2601, 0.2399, 0.2199, 0.2, 0.1804, 0.1613, 0.1428, 0.125, 0.108, 0.0919, 0.0768, 0.0629, 0.0501, 0.0387, 0.0286, 0.02, 0.0129, 0.0073, 0.0032, 0.0008, 0.0],
  warmcos: [0.0, 0.2564, 0.5, 0.499, 0.4962, 0.4917, 0.4854, 0.4774, 0.4678, 0.4566, 0.444, 0.4299, 0.4146, 0.3981, 0.3805, 0.3619, 0.3426, 0.3226, 0.3021, 0.2812, 0.2601, 0.2389, 0.2178, 0.1969, 0.1764, 0.1564, 0.1371, 0.1186, 0.1011, 0.0846, 0.0693, 0.0553, 0.0428, 0.0317, 0.0221, 0.0142, 0.008, 0.0036, 0.0009, 0.0],
};

const VW = 440, VH = 200, PD = { l: 40, r: 12, t: 14, b: 30 };
const X0 = PD.l, X1 = VW - PD.r, Y0 = VH - PD.b, Y1 = PD.t;
const LO = Math.log10(0.08), HI = Math.log10(1.0);
const px = (i: number) => X0 + (i / 39) * (X1 - X0);
const py = (v: number) => Y0 - ((Math.log10(Math.max(0.08, v)) - LO) / (HI - LO)) * (Y0 - Y1);
// The rate track sits in its own strip along the bottom.
const RY0 = Y0 - 4, RH = 34;
const ry = (v: number) => RY0 - (v / 0.5) * RH;
const accent = "var(--c-neural)";

export function ScheduleLab() {
  const [k, setK] = useState(4);
  const r = ROWS[k];
  const best = Math.min(...ROWS.map((x) => x.loss));
  const loss = r.curve.map((v, i) => `${px(i).toFixed(2)},${py(v).toFixed(2)}`).join(" ");
  const rate = SHAPES[r.kind].map((v, i) => `${px(i).toFixed(2)},${ry(v * (r.base / 0.5)).toFixed(2)}`).join(" ");

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.6rem 0" }} className="not-prose">
      <div className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", marginBottom: 2 }}>
        The same budget, spent at different speeds
      </div>
      <div style={{ fontSize: 12, color: "var(--faint)", marginBottom: 10 }}>
        two moons · 2–32–32–1 · minibatch SGD, batch 32, 120 epochs · 5 seeds ·{" "}
        <strong style={{ color: "var(--muted)" }}>training loss, log scale</strong> with the{" "}
        <strong style={{ color: accent }}>learning rate</strong> beneath it
      </div>

      <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", maxWidth: VW, height: "auto", display: "block" }}>
        <rect x={X0} y={Y1} width={X1 - X0} height={Y0 - Y1} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        {[0.1, 0.3, 1.0].map((g) => (
          <g key={g}>
            <line x1={X0} y1={py(g)} x2={X1} y2={py(g)} stroke="var(--border)" strokeWidth={1} strokeDasharray="3 3" />
            <text x={X0 - 5} y={py(g) + 3.5} fontSize={9} fill="var(--faint)" textAnchor="end">{g}</text>
          </g>
        ))}
        {/* the best final loss any row achieved, as a reference line */}
        <line x1={X0} y1={py(best)} x2={X1} y2={py(best)} stroke="var(--good)" strokeWidth={1} opacity={0.6} />
        <text x={X1 - 3} y={py(best) - 3} fontSize={8.5} fill="var(--good)" textAnchor="end">best final loss reached</text>

        <polyline points={rate} fill="none" stroke={accent} strokeWidth={1.6} opacity={0.75} />
        <polyline points={loss} fill="none" stroke="var(--ink)" strokeWidth={2} />

        <text x={(X0 + X1) / 2} y={Y0 + 22} fontSize={10} fill="var(--muted)" textAnchor="middle">
          epoch 0 to 120
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
              fontSize: 12, padding: "5px 9px", borderRadius: 8, cursor: "pointer",
            }}
          >
            {row.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
        {[
          ["final train loss", r.loss.toFixed(4), r.loss <= best + 0.005],
          ["loss spread, 5 seeds", r.lspread.toFixed(4), r.lspread < 0.01],
          ["test accuracy", r.acc.toFixed(4), r.acc >= 0.917],
          ["acc spread", r.aspread.toFixed(4), r.aspread < 0.015],
        ].map(([l, v, good]) => (
          <div key={l as string} style={{ background: "var(--surface-2)", borderRadius: 10, padding: "6px 10px", flex: "1 1 96px" }}>
            <div style={{ fontSize: 10.5, color: "var(--muted)" }}>{l as string}</div>
            <div style={{ fontSize: 15.5, fontWeight: 500, color: good ? "var(--good)" : "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{v as string}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 10, lineHeight: 1.55 }}>{r.note}</div>
    </div>
  );
}
