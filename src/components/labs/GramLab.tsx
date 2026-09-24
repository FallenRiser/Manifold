"use client";

import { useMemo, useState } from "react";
import { dualFit, gramMatrix, sampleOverlap, type Pt } from "./svmSolver";

// Spin the data and watch the dual not notice.
//
// The left panel rotates: the cloud turns, the boundary turns with it, the halos turn with their
// points. The right panel is the table of inner products the dual actually reads, and it does not
// move a pixel — a rotation leaves every x_i . x_j exactly where it was. Neither do the prices
// that size the halos, nor the dual objective, nor the number of support vectors.
//
// The prices are re-solved from the rotated coordinates at every angle rather than cached, so the
// invariance is something the lab demonstrates rather than something it assumes. That solve is
// SMO, held to sklearn by scripts/svm_dual_check.mjs — worst multiplier 2.4e-07 and worst
// boundary 2.2e-05 degrees. Reproduced by `python scripts/svm_cases.py dual gram`.

const W = 560;
const PANEL = 250;
const PAD = 16;
const PLOT = PANEL - 2 * PAD;
const GAPX = 22;
const H = 312;
const N = 24;
const C = 1;
const SPREAD = 4.2;
const PINK = "var(--c-classification)";
const BLUE = "var(--c-regression)";

const r3 = (v: number) => Math.round(v * 1000) / 1000;
const r6 = (v: number) => Math.round(v * 1e6) / 1e6;
const sx = (x: number) => r3(PAD + ((x + SPREAD) / (2 * SPREAD)) * PLOT);
const sy = (z: number) => r3(PANEL - PAD - ((z + SPREAD) / (2 * SPREAD)) * PLOT);
const GX = PANEL + GAPX;
const CELL = PLOT / N;

export function GramLab() {
  const [deg, setDeg] = useState(0);
  const [seed, setSeed] = useState(2);

  const base = useMemo<Pt[]>(
    () => sampleOverlap(seed, N, 1.4).pts.map((p) => ({ x: r6(p.x), z: r6(p.z), y: p.y })),
    [seed],
  );

  const view = useMemo(() => {
    // Math.cos and Math.sin are not required to be correctly rounded, so the server and the
    // browser can disagree in the last bits; rounding to six decimals settles that. But rounding
    // also stops cos^2 + sin^2 being 1, and a rotation matrix that is a hair off orthogonal
    // SCALES the cloud -- which moved every inner product by about 1e-6 and made the objective
    // flicker in its last displayed digit, quietly contradicting the whole lab. So renormalise:
    // Math.sqrt is correctly rounded, so this stays deterministic and is orthogonal to the last
    // bit a double holds.
    const th = (deg * Math.PI) / 180;
    const c0 = r6(Math.cos(th));
    const s0 = r6(Math.sin(th));
    const nrm = Math.sqrt(c0 * c0 + s0 * s0) || 1;
    const co = c0 / nrm;
    const si = s0 / nrm;
    // No rounding here on purpose. `base` is already rounded and `co`/`si` are derived from
    // rounded values by multiply, add and Math.sqrt -- all exactly specified by IEEE -- so these
    // products are bit-identical on the server and in the browser without help. Rounding them
    // again would cost 2.5e-06 of inner-product drift for nothing, which is what an earlier
    // version of this line did.
    const pts: Pt[] = base.map((p) => ({
      x: p.x * co - p.z * si, z: p.x * si + p.z * co, y: p.y,
    }));
    const K = gramMatrix(pts);
    const K0 = gramMatrix(base);
    const fit = dualFit(pts, C, K);
    let lo = Infinity;
    let hi = -Infinity;
    let drift = 0;
    for (let i = 0; i < K.length; i++) {
      for (let j = 0; j < K.length; j++) {
        const v = K[i][j];
        if (v < lo) lo = v;
        if (v > hi) hi = v;
        const dd = Math.abs(v - K0[i][j]);
        if (dd > drift) drift = dd;
      }
    }
    return {
      pts, K, fit, drift, mag: Math.max(Math.abs(lo), Math.abs(hi)),
      nsv: fit.group.filter((g) => g !== 0).length,
      maxA: Math.max(...fit.alpha),
    };
  }, [base, deg]);

  const { pts, K, fit } = view;
  const w = fit.w;
  const lineFor = (t: number) => {
    if (Math.abs(w[1]) >= Math.abs(w[0])) {
      if (Math.abs(w[1]) < 1e-9) return null;
      return { x1: sx(-SPREAD), y1: sy((t - fit.b - w[0] * -SPREAD) / w[1]),
               x2: sx(SPREAD), y2: sy((t - fit.b - w[0] * SPREAD) / w[1]) };
    }
    if (Math.abs(w[0]) < 1e-9) return null;
    return { x1: sx((t - fit.b - w[1] * -SPREAD) / w[0]), y1: sy(-SPREAD),
             x2: sx((t - fit.b - w[1] * SPREAD) / w[0]), y2: sy(SPREAD) };
  };
  const mid = lineFor(0);

  const label: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, letterSpacing: "0.07em",
    textTransform: "uppercase", color: "var(--muted)",
  };
  const stat: React.CSSProperties = {
    fontSize: 18, fontVariantNumeric: "tabular-nums", color: "var(--ink)",
  };

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden",
                  background: "var(--panel)" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
        <rect x={0} y={0} width={W} height={H} fill="var(--canvas)" />

        <g clipPath="url(#gramclip)">
          {mid && (
            <line x1={mid.x1} y1={mid.y1} x2={mid.x2} y2={mid.y2}
                  stroke="var(--ink)" strokeWidth={2} opacity={0.85} />
          )}
          {pts.map((p, i) => {
            const colour = p.y === 1 ? PINK : BLUE;
            const frac = view.maxA > 0 ? fit.alpha[i] / view.maxA : 0;
            return (
              <g key={i}>
                {frac > 1e-9 && (
                  <circle cx={sx(p.x)} cy={sy(p.z)} r={r3(4 + Math.sqrt(frac) * 9)}
                          fill={colour} opacity={0.24} />
                )}
                <circle cx={sx(p.x)} cy={sy(p.z)} r={3.4} fill={colour}
                        opacity={frac > 1e-9 ? 1 : 0.42} />
              </g>
            );
          })}
        </g>
        <defs>
          <clipPath id="gramclip">
            <rect x={PAD} y={PAD} width={PLOT} height={PLOT} />
          </clipPath>
        </defs>
        <rect x={PAD} y={PAD} width={PLOT} height={PLOT} fill="none"
              stroke="var(--border-strong)" strokeWidth={1} />
        <text x={PAD} y={PAD - 6} style={{ fontSize: 11, fill: "var(--muted)" }}>
          the data, turned {Math.round(deg)}°
        </text>

        <g shapeRendering="crispEdges">
          {K.map((row, i) =>
            row.map((v, j) => (
              <rect key={`${i}-${j}`} x={r3(GX + j * CELL)} y={r3(PAD + i * CELL)}
                    width={r3(CELL)} height={r3(CELL)}
                    fill={v >= 0 ? PINK : BLUE}
                    opacity={r3(0.08 + 0.72 * Math.sqrt(Math.abs(v) / view.mag))} />
            )),
          )}
        </g>
        <rect x={GX} y={PAD} width={r3(CELL * N)} height={r3(CELL * N)} fill="none"
              stroke="var(--border-strong)" strokeWidth={1} />
        <text x={GX} y={PAD - 6} style={{ fontSize: 11, fill: "var(--muted)" }}>
          every x·x, which is all the dual reads
        </text>

        <text x={PAD} y={PANEL + 20} style={{ fontSize: 11, fill: "var(--muted)" }}>
          the halo on each point is its price — turn the dial and watch nothing on the right move
        </text>
        <text x={PAD} y={PANEL + 35} style={{ fontSize: 11, fill: "var(--muted)" }}>
          the prices are re-solved from the turned coordinates every time, not carried over
        </text>
      </svg>

      <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap",
                    padding: "12px 14px", borderTop: "1px solid var(--border)" }}>
        <div>
          <div style={label}>turn the data</div>
          <input type="range" min={0} max={360} step={1} value={deg}
                 onChange={(e) => setDeg(Number(e.target.value))}
                 style={{ width: 150, accentColor: "var(--c-classification)" }} />
        </div>
        <div>
          <div style={label}>dual objective</div>
          <div style={stat}>{fit.objective.toFixed(6)}</div>
        </div>
        <div>
          <div style={label}>biggest change in the table</div>
          <div style={stat}>{view.drift.toExponential(1)}</div>
        </div>
        <div>
          <div style={label}>support vectors</div>
          <div style={stat}>{view.nsv}<span style={{ fontSize: 13, color: "var(--muted)" }}>
            {" "}/ {N}</span></div>
        </div>

        <button
          onClick={() => setSeed((s) => (s === 6 ? 2 : s + 1))}
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
