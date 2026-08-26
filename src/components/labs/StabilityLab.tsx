"use client";

import { useState } from "react";

// Stability, measured by deletion. Remove ONE training point, refit, and see how
// far the predictions move. That distance is the whole idea behind stability
// bounds: an algorithm whose output barely notices a missing example cannot be
// memorizing individual examples, and therefore cannot be overfitting them.
//
// Two algorithms, deliberately at opposite ends:
//   1-nearest neighbour  -- deleting a point hands its whole territory to a
//                           neighbour, so predictions jump. Maximally unstable,
//                           and note it always has ZERO training error.
//   ridge regression     -- every point contributes a little to two coefficients;
//                           deleting one nudges them. Stability improves as the
//                           penalty grows, which is the same lambda you tune for
//                           generalization -- not a coincidence.
//
// All fits are computed exactly in-component (closed-form ridge, direct 1-NN),
// so every number shown is derived live. Coordinates are rounded for SSR.

const XS = [12, 22, 30, 41, 52, 58, 67, 74, 83, 91];
const YS = [38, 44, 35, 58, 63, 51, 74, 69, 86, 79];
const N = XS.length;

const VW = 380, VH = 190;
const BOX = { x0: 34, y0: 14, x1: 356, y1: 150 };
const sx = (x: number) => BOX.x0 + (x / 100) * (BOX.x1 - BOX.x0);
const sy = (y: number) => BOX.y1 - (y / 100) * (BOX.y1 - BOX.y0);

// closed-form ridge on [1, x], penalising the slope only
function ridgeFit(idx: number[], lambda: number) {
  const n = idx.length;
  const mx = idx.reduce((s, i) => s + XS[i], 0) / n;
  const my = idx.reduce((s, i) => s + YS[i], 0) / n;
  let sxx = 0, sxy = 0;
  for (const i of idx) { sxx += (XS[i] - mx) ** 2; sxy += (XS[i] - mx) * (YS[i] - my); }
  const b = sxy / (sxx + lambda);
  return { a: my - b * mx, b };
}

function predictRidge(f: { a: number; b: number }, x: number) { return f.a + f.b * x; }

function predict1NN(idx: number[], x: number) {
  let best = idx[0], bd = Infinity;
  for (const i of idx) { const d = Math.abs(XS[i] - x); if (d < bd) { bd = d; best = i; } }
  return YS[best];
}

const GRID = Array.from({ length: 101 }, (_, k) => k);

export function StabilityLab() {
  const [useKnn, setUseKnn] = useState(true);
  const [lambda, setLambda] = useState(0);
  const [drop, setDrop] = useState(4);

  const accent = "var(--c-metrics)";
  const full = GRID.map((_, k) => k);
  const allIdx = Array.from({ length: N }, (_, i) => i);
  const lessIdx = allIdx.filter((i) => i !== drop);

  const fA = useKnn ? null : ridgeFit(allIdx, lambda);
  const fB = useKnn ? null : ridgeFit(lessIdx, lambda);

  const predA = (x: number) => (useKnn ? predict1NN(allIdx, x) : predictRidge(fA!, x));
  const predB = (x: number) => (useKnn ? predict1NN(lessIdx, x) : predictRidge(fB!, x));

  let beta = 0;
  for (const x of full) beta = Math.max(beta, Math.abs(predA(x) - predB(x)));

  const path = (p: (x: number) => number) =>
    full.map((x) => `${sx(x).toFixed(2)},${sy(Math.max(0, Math.min(100, p(x)))).toFixed(2)}`).join(" ");

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.6rem 0" }} className="not-prose">
      <div className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", marginBottom: 2 }}>
        Delete one example. How much moves?
      </div>
      <div style={{ fontSize: 12, color: "var(--faint)", marginBottom: 10 }}>
        solid = fit on all {N} points · dashed = fit with the hollow point removed
      </div>

      <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", maxWidth: VW, height: "auto", display: "block" }}>
        <rect x={BOX.x0} y={BOX.y0} width={BOX.x1 - BOX.x0} height={BOX.y1 - BOX.y0} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        <polyline points={path(predA)} fill="none" stroke="var(--ink)" strokeWidth={2} />
        <polyline points={path(predB)} fill="none" stroke="var(--brand-2)" strokeWidth={2} strokeDasharray="5 3" />

        {XS.map((x, i) => (
          <circle
            key={i} cx={Number(sx(x).toFixed(2))} cy={Number(sy(YS[i]).toFixed(2))} r={i === drop ? 6 : 4.5}
            fill={i === drop ? "var(--surface)" : "var(--ink)"}
            stroke={i === drop ? "var(--brand-2)" : "var(--ink)"} strokeWidth={i === drop ? 2.5 : 1}
          />
        ))}
        <text x={BOX.x0} y={VH - 6} fontSize={9.5} fill="var(--muted)">
          largest prediction change after deleting one point: {beta.toFixed(2)}
        </text>
      </svg>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
        {[
          { k: true, label: "1-nearest neighbour" },
          { k: false, label: "ridge regression" },
        ].map((m) => (
          <button
            key={String(m.k)}
            onClick={() => setUseKnn(m.k)}
            style={{
              background: useKnn === m.k ? `color-mix(in srgb, ${accent} 15%, var(--surface))` : "transparent",
              color: useKnn === m.k ? "var(--ink)" : "var(--muted)",
              border: `1px solid ${useKnn === m.k ? `color-mix(in srgb, ${accent} 40%, var(--border))` : "var(--border-strong)"}`,
              fontSize: 12, padding: "5px 10px", borderRadius: 8, cursor: "pointer",
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 14px", marginTop: 10 }}>
        <label style={{ fontSize: 12, color: "var(--muted)" }}>
          which point is deleted: #{drop + 1}
          <input type="range" min={0} max={N - 1} step={1} value={drop} onChange={(e) => setDrop(Number(e.target.value))} style={{ width: "100%", accentColor: accent }} />
        </label>
        <label style={{ fontSize: 12, color: "var(--muted)", opacity: useKnn ? 0.4 : 1 }}>
          ridge penalty λ = {lambda}
          <input type="range" min={0} max={4000} step={100} value={lambda} disabled={useKnn} onChange={(e) => setLambda(Number(e.target.value))} style={{ width: "100%", accentColor: accent }} />
        </label>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12, alignItems: "center" }}>
        <Metric label="stability β" value={beta.toFixed(2)} accent={beta > 8 ? "var(--bad)" : "var(--good)"} big sub="smaller = more stable" />
        <Metric label="training error" value={useKnn ? "0.00" : "> 0"} accent={useKnn ? "var(--bad)" : undefined} sub={useKnn ? "perfect, and meaningless" : "honest"} />
      </div>
    </div>
  );
}

function Metric({ label, value, sub, accent, big }: { label: string; value: string; sub?: string; accent?: string; big?: boolean }) {
  return (
    <div style={{ background: "var(--surface-2)", borderRadius: 10, padding: "6px 10px", minWidth: 92 }}>
      <div style={{ fontSize: 10.5, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontSize: big ? 19 : 15, fontWeight: 500, color: accent ?? "var(--ink)" }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: "var(--faint)" }}>{sub}</div>}
    </div>
  );
}
