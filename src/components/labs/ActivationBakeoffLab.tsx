"use client";

import { useState } from "react";

// Section 5 of scripts/activation_cases.py: two interleaved spirals (600
// points), Adam at lr 0.005, 1500 steps, FIVE seeds per activation, and the
// only thing that changes between runs is which curve sits between the layers.
//
// The seed spread is drawn as a bar behind the mean, not hidden in a footnote,
// because it is the finding. Every gap between the six non-sigmoid options is
// the same size as, or smaller than, the range those options cover across five
// random initialisations. Reporting the winner without the spread would be
// reporting noise as a result.
//
// The one honest exception is sigmoid, which is not close: it trails the best
// option by 0.31 shallow and 0.28 deep, and at depth it does not train at all.

type Row = { act: string; acc: number; spread: number; loss: number; curve: number[] };

const DATA: Record<"shallow" | "deep", Row[]> = {
  shallow: [
    { act: "sigmoid", acc: 0.5790, spread: 0.1048, loss: 0.5408, curve: [1.014, 0.6553, 0.6455, 0.6452, 0.6449, 0.6447, 0.6443, 0.6434, 0.6412, 0.6369, 0.6295, 0.6218, 0.617, 0.6135, 0.6104, 0.6062, 0.5969, 0.5879, 0.5765, 0.562] },
    { act: "tanh", acc: 0.8667, spread: 0.0238, loss: 0.0210, curve: [0.7108, 0.6096, 0.5683, 0.4848, 0.3733, 0.253, 0.1692, 0.1307, 0.1078, 0.0918, 0.0813, 0.0735, 0.0667, 0.0609, 0.0557, 0.0502, 0.0419, 0.0366, 0.0313, 0.0243] },
    { act: "ReLU", acc: 0.7838, spread: 0.1143, loss: 0.1366, curve: [0.7358, 0.5965, 0.5601, 0.5255, 0.4793, 0.427, 0.3894, 0.3615, 0.3389, 0.3185, 0.3008, 0.284, 0.2696, 0.2591, 0.2509, 0.2436, 0.2365, 0.2311, 0.2257, 0.222] },
    { act: "Leaky", acc: 0.7895, spread: 0.0714, loss: 0.1009, curve: [0.7345, 0.5977, 0.5509, 0.4951, 0.4302, 0.3767, 0.3263, 0.286, 0.2566, 0.233, 0.2063, 0.1766, 0.1526, 0.1343, 0.1192, 0.1072, 0.0966, 0.0883, 0.082, 0.076] },
    { act: "ELU", acc: 0.8219, spread: 0.1000, loss: 0.1558, curve: [0.7321, 0.6204, 0.5885, 0.5636, 0.5115, 0.4627, 0.4372, 0.4185, 0.4033, 0.3882, 0.3745, 0.3626, 0.3485, 0.3361, 0.3258, 0.3137, 0.3035, 0.2936, 0.2832, 0.2758] },
    { act: "GELU", acc: 0.8762, spread: 0.0381, loss: 0.0149, curve: [0.6972, 0.5997, 0.5687, 0.4587, 0.2681, 0.1735, 0.131, 0.1021, 0.0832, 0.0682, 0.0562, 0.0433, 0.0347, 0.0289, 0.0249, 0.022, 0.0196, 0.0175, 0.0159, 0.0143] },
    { act: "Swish", acc: 0.8857, spread: 0.0190, loss: 0.0262, curve: [0.6993, 0.6004, 0.5909, 0.5747, 0.4833, 0.3464, 0.237, 0.1964, 0.1697, 0.1441, 0.1225, 0.1036, 0.0926, 0.0849, 0.0778, 0.0713, 0.0649, 0.0593, 0.0535, 0.0477] },
  ],
  deep: [
    { act: "sigmoid", acc: 0.6057, spread: 0.0333, loss: 0.6511, curve: [0.7035, 0.6474, 0.6454, 0.645, 0.6448, 0.6448, 0.6448, 0.6447, 0.6447, 0.6447, 0.6513, 0.6448, 0.6447, 0.6447, 0.6447, 0.6447, 0.6485, 0.6552, 0.6461, 0.6447] },
    { act: "tanh", acc: 0.8638, spread: 0.0429, loss: 0.0002, curve: [0.8272, 0.4757, 0.2274, 0.2361, 0.0796, 0.0257, 0.0141, 0.0086, 0.0057, 0.0021, 0.0009, 0.0005, 0.0004, 0.0003, 0.0002, 0.0002, 0.0002, 0.0001, 0.0001, 0.0001] },
    { act: "ReLU", acc: 0.8390, spread: 0.0857, loss: 0.0888, curve: [0.698, 0.3948, 0.1482, 0.0329, 0.1355, 0.0151, 0.0107, 0.0083, 0.0067, 0.0059, 0.0056, 0.0052, 0.0052, 0.0053, 0.0049, 0.0047, 0.4835, 0.2992, 0.2762, 0.082] },
    { act: "Leaky", acc: 0.8457, spread: 0.1143, loss: 0.0500, curve: [0.6964, 0.3851, 0.1212, 0.0293, 0.0126, 0.2835, 0.0125, 0.0086, 0.007, 0.006, 0.0055, 0.0046, 0.5348, 0.2544, 0.1212, 0.0284, 0.0224, 0.0189, 0.0168, 0.0142] },
    { act: "ELU", acc: 0.8657, spread: 0.0905, loss: 0.0708, curve: [0.866, 0.3926, 0.1571, 0.0346, 0.0167, 0.0137, 0.012, 0.0103, 0.0076, 0.3977, 0.2573, 0.1282, 0.031, 0.0201, 0.0127, 0.0106, 0.0094, 0.0086, 0.0079, 0.0075] },
    { act: "GELU", acc: 0.8724, spread: 0.0571, loss: 0.0038, curve: [0.6929, 0.1987, 0.319, 0.0301, 0.022, 0.0174, 0.0137, 0.0091, 0.5245, 0.183, 0.103, 0.0455, 0.0249, 0.0372, 0.0157, 0.0093, 0.0061, 0.0049, 0.004, 0.0032] },
    { act: "Swish", acc: 0.8857, spread: 0.0333, loss: 0.0029, curve: [0.6925, 0.2715, 0.064, 0.0286, 0.146, 0.03, 0.0213, 0.014, 0.1181, 0.0275, 0.02, 0.0147, 0.0105, 0.0085, 0.0077, 0.0073, 0.0069, 0.0066, 0.0064, 0.0062] },
  ],
};

const VW = 450, VH = 210, PD = { l: 62, r: 46, t: 12, b: 26 };
const X0 = PD.l, X1 = VW - PD.r, Y0 = VH - PD.b, Y1 = PD.t;
const ALO = 0.5, AHI = 0.95;
const bx = (a: number) => X0 + ((a - ALO) / (AHI - ALO)) * (X1 - X0);
const accent = "var(--c-neural)";

export function ActivationBakeoffLab() {
  const [depth, setDepth] = useState<"shallow" | "deep">("shallow");
  const rows = DATA[depth];
  const best = Math.max(...rows.map((r) => r.acc));
  const rh = (Y0 - Y1) / rows.length;

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.6rem 0" }} className="not-prose">
      <div className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", marginBottom: 2 }}>
        Swap only the curve
      </div>
      <div style={{ fontSize: 12, color: "var(--faint)", marginBottom: 10 }}>
        two spirals · Adam lr 0.005 · 1,500 steps · <strong style={{ color: "var(--muted)" }}>mean of 5 seeds</strong>,
        with the seed-to-seed spread drawn as the pale bar
      </div>

      <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", maxWidth: VW, height: "auto", display: "block" }}>
        {[0.5, 0.6, 0.7, 0.8, 0.9].map((g) => (
          <g key={g}>
            <line x1={bx(g)} y1={Y1} x2={bx(g)} y2={Y0} stroke="var(--border)" strokeWidth={1} strokeDasharray="3 3" />
            <text x={bx(g)} y={Y0 + 16} fontSize={9} fill="var(--faint)" textAnchor="middle">{g.toFixed(1)}</text>
          </g>
        ))}

        {rows.map((r, i) => {
          const y = Y1 + i * rh;
          const lo = Math.max(ALO, r.acc - r.spread / 2), hi = Math.min(AHI, r.acc + r.spread / 2);
          const win = r.acc === best;
          return (
            <g key={r.act}>
              <text x={X0 - 8} y={y + rh / 2 + 3.5} fontSize={10.5} fill="var(--ink)" textAnchor="end">{r.act}</text>
              <rect x={bx(lo).toFixed(2)} y={(y + rh * 0.22).toFixed(2)}
                width={Math.max(1, bx(hi) - bx(lo)).toFixed(2)} height={(rh * 0.56).toFixed(2)}
                fill={accent} opacity={0.22} rx={2} />
              <rect x={X0} y={(y + rh * 0.34).toFixed(2)}
                width={Math.max(1, bx(r.acc) - X0).toFixed(2)} height={(rh * 0.32).toFixed(2)}
                fill={win ? accent : "var(--muted)"} opacity={win ? 1 : 0.55} rx={2} />
              <text x={X1 + 6} y={y + rh / 2 + 3.5} fontSize={10} fill={win ? accent : "var(--muted)"} style={{ fontVariantNumeric: "tabular-nums" }}>
                {r.acc.toFixed(3)}
              </text>
            </g>
          );
        })}
        <text x={(X0 + X1) / 2} y={VH - 2} fontSize={10} fill="var(--muted)" textAnchor="middle">test accuracy</text>
      </svg>

      <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
        {(["shallow", "deep"] as const).map((d) => (
          <button
            key={d}
            onClick={() => setDepth(d)}
            style={{
              background: d === depth ? `color-mix(in srgb, ${accent} 18%, var(--surface))` : "var(--surface-2)",
              color: "var(--ink)",
              border: `1px solid ${d === depth ? `color-mix(in srgb, ${accent} 45%, var(--border))` : "var(--border)"}`,
              fontSize: 12.5, padding: "5px 12px", borderRadius: 8, cursor: "pointer",
            }}
          >
            {d === "shallow" ? "2 hidden layers" : "10 hidden layers"}
          </button>
        ))}
      </div>

      <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 10, lineHeight: 1.55 }}>
        {depth === "shallow" ? (
          <>Swish leads at 0.886 and ReLU trails at 0.784 — but ReLU&rsquo;s five seeds span 0.114, so a single
            unlucky run of Swish and a single lucky run of ReLU would close most of that gap. The one result that is
            not noise is <strong>sigmoid at 0.579</strong>, which is not in the same conversation as the other six.</>
        ) : (
          <>Depth rescued the ReLU family — ReLU climbs from 0.784 to 0.839, and the six non-sigmoid options now sit
            inside a band of 0.047, which is narrower than several of their own seed spreads.{" "}
            <strong>Sigmoid went the other way</strong>: at 0.606, with a training loss flat at 0.645 from step 300
            to step 1,500, it is not learning slowly — it is not learning.</>
        )}
      </div>
    </div>
  );
}
