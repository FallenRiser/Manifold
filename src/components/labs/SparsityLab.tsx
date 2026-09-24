"use client";

import { useMemo, useState } from "react";
import { fitSVM, logisticFit, pullOf, sampleOverlap, type Pt } from "./svmSolver";

// Which points are still pulling on the boundary, drawn as a halo around each one.
//
// The halo is proportional to |dL/dz|, the force that point exerts during fitting. Under the
// hinge every point past its margin has a derivative of exactly zero, so most of the picture goes
// bare. Under log loss nothing ever reaches zero, so every point keeps a halo however far out it
// sits -- and because there are many of them, they add up to most of the total pull.
//
// Both boundaries are real fits, not sketches: fitSVM is held to sklearn by svm_solver_check.mjs
// and logisticFit by svm_logistic_check.mjs. Reproduced across 20 datasets by
// `python scripts/svm_cases.py pull`.

const W = 560;
const PLOT = 318;
const H = 356;
const PAD = 20;
const SPREAD = 4.4;
const N = 110;

// Rounded on the way to the DOM: this renders on the server and again in the browser, and
// sampleOverlap uses Math.log/cos, which are not required to be correctly rounded, so the two
// disagreed in the last bits and React reported a hydration mismatch.
const r3 = (v: number) => Math.round(v * 1000) / 1000;
const sx = (x: number) => r3(PAD + ((x + SPREAD) / (2 * SPREAD)) * (W - 2 * PAD));
const sy = (z: number) => r3(PLOT - PAD - ((z + SPREAD) / (2 * SPREAD)) * (PLOT - 2 * PAD));

type Loss = "hinge" | "logistic";

export function SparsityLab() {
  const [loss, setLoss] = useState<Loss>("hinge");
  const [seed, setSeed] = useState(5);
  const C = 1;

  const view = useMemo(() => {
    const { pts } = sampleOverlap(seed, N, 1.3);
    const sv = fitSVM(pts, C);
    const lg = logisticFit(pts, C);
    const w = loss === "hinge" ? sv.w : lg.w;
    const b = loss === "hinge" ? sv.b : lg.b;
    const pull = pullOf(pts, w, b, loss);
    const total = pull.reduce((a, v) => a + v, 0);
    // z > 1 is "past the margin" for both, so the two columns are answering the same question.
    const far = pts.map((p) => p.y * (w[0] * p.x + w[1] * p.z + b) > 1);
    const farPull = pull.reduce((a, v, i) => a + (far[i] ? v : 0), 0);
    return {
      pts, w, b, pull, total,
      maxPull: Math.max(...pull, 1e-12),
      farCount: far.filter(Boolean).length,
      farShare: total > 0 ? (100 * farPull) / total : 0,
      zeroPull: pull.filter((v) => v === 0).length,
    };
  }, [loss, seed]);

  const { pts, w, b, pull } = view;

  const lineFor = (t: number) => {
    if (Math.abs(w[1]) >= Math.abs(w[0])) {
      if (Math.abs(w[1]) < 1e-12) return null;
      return { x1: sx(-SPREAD), y1: sy((t - b - w[0] * -SPREAD) / w[1]),
               x2: sx(SPREAD), y2: sy((t - b - w[0] * SPREAD) / w[1]) };
    }
    if (Math.abs(w[0]) < 1e-12) return null;
    return { x1: sx((t - b - w[1] * -SPREAD) / w[0]), y1: sy(-SPREAD),
             x2: sx((t - b - w[1] * SPREAD) / w[0]), y2: sy(SPREAD) };
  };
  const mid = lineFor(0);
  const up = lineFor(1);
  const dn = lineFor(-1);

  const label: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, letterSpacing: "0.07em",
    textTransform: "uppercase", color: "var(--muted)",
  };
  const stat: React.CSSProperties = {
    fontSize: 19, fontVariantNumeric: "tabular-nums", color: "var(--ink)",
  };
  const tab = (on: boolean): React.CSSProperties => ({
    fontSize: 12.5, padding: "6px 12px", borderRadius: 6, cursor: "pointer",
    border: `1px solid ${on ? "var(--brand)" : "var(--border-strong)"}`,
    background: on ? "var(--brand)" : "transparent",
    color: on ? "var(--canvas)" : "var(--ink)",
    fontWeight: on ? 600 : 400,
  });

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden",
                  background: "var(--panel)" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
        <rect x={0} y={0} width={W} height={H} fill="var(--canvas)" />

        {/* The margin band is the hinge's own construction, so it is only meaningful there. */}
        {loss === "hinge" && up && dn && (
          <polygon points={`${up.x1},${up.y1} ${up.x2},${up.y2} ${dn.x2},${dn.y2} ${dn.x1},${dn.y1}`}
                   fill="var(--brand)" opacity={0.06} />
        )}
        {loss === "hinge" && [up, dn].map((l, i) => l ? (
          <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
                stroke="var(--muted)" strokeWidth={1.1} strokeDasharray="5 4" />
        ) : null)}
        {mid && (
          <line x1={mid.x1} y1={mid.y1} x2={mid.x2} y2={mid.y2}
                stroke="var(--brand)" strokeWidth={2.25} />
        )}

        {pts.map((p, i) => {
          const colour = p.y === 1 ? "var(--c-classification)" : "var(--c-regression)";
          // Area, not radius, tracks the pull: doubling the halo's radius would quadruple the
          // ink for a point that is only twice as influential.
          const frac = pull[i] / view.maxPull;
          const halo = frac > 0 ? 5 + Math.sqrt(frac) * 11 : 0;
          return (
            <g key={i}>
              {halo > 0 && (
                <circle cx={sx(p.x)} cy={sy(p.z)} r={r3(halo)} fill={colour}
                        opacity={0.22} />
              )}
              <circle cx={sx(p.x)} cy={sy(p.z)} r={3.6} fill={colour}
                      opacity={frac > 0 ? 1 : 0.4} />
            </g>
          );
        })}

        <text x={PAD} y={PLOT + 16} style={{ fontSize: 11, fill: "var(--muted)" }}>
          halo size = how hard that point is still pulling on the boundary
        </text>
        <text x={PAD} y={PLOT + 31} style={{ fontSize: 11, fill: "var(--muted)" }}>
          {loss === "hinge"
            ? `${view.zeroPull} of ${N} points have no halo at all — they pull with exactly zero`
            : `every one of the ${N} points keeps a halo — log loss never reaches zero`}
        </text>
      </svg>

      <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap",
                    padding: "12px 14px", borderTop: "1px solid var(--border)" }}>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => setLoss("hinge")} style={tab(loss === "hinge")}>hinge</button>
          <button onClick={() => setLoss("logistic")} style={tab(loss === "logistic")}>
            log loss
          </button>
        </div>

        <div>
          <div style={label}>past the margin</div>
          <div style={stat}>
            {view.farCount}<span style={{ fontSize: 13, color: "var(--muted)" }}> / {N}</span>
          </div>
        </div>
        <div>
          <div style={label}>their share of the pull</div>
          <div style={{ ...stat, color: loss === "hinge" ? "var(--c-regression)" : "var(--brand)" }}>
            {view.farShare < 0.005 ? "0" : view.farShare.toFixed(1)}%
          </div>
        </div>
        <div>
          <div style={label}>points with zero pull</div>
          <div style={stat}>{view.zeroPull}</div>
        </div>

        <button
          onClick={() => setSeed((s) => s + 1)}
          style={{ fontSize: 12.5, padding: "6px 11px", borderRadius: 6, cursor: "pointer",
                   border: "1px solid var(--border-strong)", background: "transparent",
                   color: "var(--ink)", marginLeft: "auto" }}
        >
          new sample
        </button>
      </div>
    </div>
  );
}
