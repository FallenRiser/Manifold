"use client";

import { useMemo, useState } from "react";
import { hingeSum, sampleOverlap, zeroOneCount, type Pt } from "./svmSolver";

// The staircase and the ramp: both losses over the same rotating boundary.
//
// The page's argument is that the 0-1 loss cannot be descended and the hinge can. That is hard to
// believe from a formula and obvious from a picture, so this rotates one boundary through a full
// turn and plots both totals underneath. The 0-1 curve is a staircase -- long flat runs with
// nothing to follow, then a jump of one or more errors at once. The hinge curve slopes
// everywhere, so from any angle there is a downhill direction.
//
// The two minima do not land on the same angle, and that gap is the surrogate's cost made
// visible. Reproduced across many draws by `python scripts/svm_cases.py descend` and `surrogate`.

const W = 560;
const PLOT = 250;
const CURVE = 132;
const H = PLOT + CURVE;
const PAD = 20;
const SPREAD = 4.4;
const N = 60;
const STEP = 0.5;

// Coordinates are rounded on the way out: this component renders on the server and again in the
// browser, and sampleOverlap leans on Math.log/cos, which are not required to be correctly
// rounded, so the two disagreed in the last bits and React reported a hydration mismatch.
const r3 = (v: number) => Math.round(v * 1000) / 1000;
const sx = (x: number) => r3(PAD + ((x + SPREAD) / (2 * SPREAD)) * (W - 2 * PAD));
const sy = (z: number) => r3(PLOT - PAD - ((z + SPREAD) / (2 * SPREAD)) * (PLOT - 2 * PAD));

const dirFor = (deg: number): [number, number] => {
  const t = (deg * Math.PI) / 180;
  return [2 * Math.cos(t), 2 * Math.sin(t)];
};

/** Both losses at every angle, for one sample. Cheap enough to redo whenever the sample changes. */
function sweep(pts: Pt[]) {
  const hinge: number[] = [];
  const zo: number[] = [];
  for (let d = 0; d < 360; d += STEP) {
    const w = dirFor(d);
    hinge.push(hingeSum(pts, w, 0));
    zo.push(zeroOneCount(pts, w, 0));
  }
  let bh = 0;
  let bz = 0;
  for (let i = 1; i < hinge.length; i++) {
    if (hinge[i] < hinge[bh]) bh = i;
    if (zo[i] < zo[bz]) bz = i;
  }
  // The share of steps where the mistake count does not move at all -- the page's 92.5%.
  let flat = 0;
  for (let i = 1; i < zo.length; i++) if (zo[i] === zo[i - 1]) flat++;
  return { hinge, zo, bestHinge: bh * STEP, bestZo: bz * STEP, flat: (100 * flat) / (zo.length - 1) };
}

export function HingeLossLab() {
  const [deg, setDeg] = useState(120);
  const [seed, setSeed] = useState(2);

  const view = useMemo(() => {
    const { pts } = sampleOverlap(seed, N, 1.0);
    return { pts, ...sweep(pts) };
  }, [seed]);

  const { pts, hinge, zo } = view;
  const w = dirFor(deg);
  const nowHinge = hingeSum(pts, w, 0);
  const nowZo = zeroOneCount(pts, w, 0);

  const hiH = Math.max(...hinge);
  const loH = Math.min(...hinge);
  const hiZ = Math.max(...zo);
  const loZ = Math.min(...zo);

  const cx = (d: number) => r3(PAD + (d / 360) * (W - 2 * PAD));
  const cyH = (v: number) => r3(PLOT + 34 + (1 - (v - loH) / (hiH - loH || 1)) * (CURVE - 58));
  const cyZ = (v: number) => r3(PLOT + 34 + (1 - (v - loZ) / (hiZ - loZ || 1)) * (CURVE - 58));

  const path = (vals: number[], f: (v: number) => number) =>
    vals.map((v, i) => `${cx(i * STEP)},${f(v)}`).join(" ");

  // w.x = 0 through the origin, clipped to the box.
  const line = Math.abs(w[1]) >= Math.abs(w[0])
    ? { x1: sx(-SPREAD), y1: sy((-w[0] * -SPREAD) / w[1]),
        x2: sx(SPREAD), y2: sy((-w[0] * SPREAD) / w[1]) }
    : { x1: sx((-w[1] * -SPREAD) / w[0]), y1: sy(-SPREAD),
        x2: sx((-w[1] * SPREAD) / w[0]), y2: sy(SPREAD) };

  const label: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, letterSpacing: "0.07em",
    textTransform: "uppercase", color: "var(--muted)",
  };
  const stat: React.CSSProperties = {
    fontSize: 19, fontVariantNumeric: "tabular-nums", color: "var(--ink)",
  };

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden",
                  background: "var(--panel)" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
        <rect x={0} y={0} width={W} height={H} fill="var(--canvas)" />

        <line x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
              stroke="var(--brand)" strokeWidth={2.25} />

        {pts.map((p, i) => {
          const colour = p.y === 1 ? "var(--c-classification)" : "var(--c-regression)";
          const wrong = p.y * (w[0] * p.x + w[1] * p.z) <= 0;
          return (
            <g key={i}>
              {wrong && (
                <circle cx={sx(p.x)} cy={sy(p.z)} r={9} fill="none"
                        stroke={colour} strokeWidth={1.5} opacity={0.9} />
              )}
              <circle cx={sx(p.x)} cy={sy(p.z)} r={5} fill={colour}
                      stroke="var(--canvas)" strokeWidth={1.2} opacity={wrong ? 1 : 0.6} />
            </g>
          );
        })}

        {/* The two curves, over the same horizontal axis: one full turn of the boundary. */}
        <line x1={PAD} y1={PLOT + 12} x2={W - PAD} y2={PLOT + 12}
              stroke="var(--border)" strokeWidth={1} />
        <text x={PAD} y={PLOT + 26} style={{ fontSize: 11, fill: "var(--muted)" }}>
          both losses over a full turn of the boundary
        </text>

        <polyline points={path(zo, cyZ)} fill="none" stroke="var(--c-classification)"
                  strokeWidth={1.75} opacity={0.95} />
        <polyline points={path(hinge, cyH)} fill="none" stroke="var(--c-regression)"
                  strokeWidth={1.75} opacity={0.95} />

        <line x1={cx(deg)} y1={PLOT + 30} x2={cx(deg)} y2={H - 16}
              stroke="var(--ink)" strokeWidth={1} strokeDasharray="3 3" opacity={0.55} />

        <text x={W - PAD} y={PLOT + 26} textAnchor="end" style={{ fontSize: 11 }}>
          <tspan fill="var(--c-classification)">staircase = mistakes</tspan>
          <tspan fill="var(--muted)"> · </tspan>
          <tspan fill="var(--c-regression)">ramp = hinge</tspan>
        </text>
        <text x={PAD} y={H - 4} style={{ fontSize: 10.5, fill: "var(--muted)" }}>
          {`mistakes flat across ${view.flat.toFixed(1)}% of the turn · lowest at ` +
           `${view.bestZo.toFixed(1)}°, hinge lowest at ${view.bestHinge.toFixed(1)}°`}
        </text>
      </svg>

      <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap",
                    padding: "12px 14px", borderTop: "1px solid var(--border)" }}>
        <div>
          <div style={label}>mistakes</div>
          <div style={{ ...stat, color: "var(--c-classification)" }}>
            {nowZo}<span style={{ fontSize: 13, color: "var(--muted)" }}> / {N}</span>
          </div>
        </div>
        <div>
          <div style={label}>hinge</div>
          <div style={{ ...stat, color: "var(--c-regression)" }}>{nowHinge.toFixed(2)}</div>
        </div>

        <div style={{ flex: "1 1 210px", minWidth: 180 }}>
          <div style={{ ...label, marginBottom: 3 }}>boundary angle = {deg.toFixed(1)}°</div>
          <input
            type="range" min={0} max={359.5} step={STEP}
            value={deg}
            onChange={(e) => setDeg(Number(e.target.value))}
            style={{ width: "100%", accentColor: "var(--brand)" }}
            aria-label="the angle of the boundary"
          />
        </div>

        <button
          onClick={() => setDeg(view.bestZo)}
          style={{ fontSize: 12.5, padding: "6px 11px", borderRadius: 6, cursor: "pointer",
                   border: "1px solid var(--border-strong)", background: "transparent",
                   color: "var(--ink)" }}
        >
          fewest mistakes
        </button>
        <button
          onClick={() => setDeg(view.bestHinge)}
          style={{ fontSize: 12.5, padding: "6px 11px", borderRadius: 6, cursor: "pointer",
                   border: "1px solid var(--border-strong)", background: "transparent",
                   color: "var(--ink)" }}
        >
          lowest hinge
        </button>
        <button
          onClick={() => setSeed((s) => s + 1)}
          style={{ fontSize: 12.5, padding: "6px 11px", borderRadius: 6, cursor: "pointer",
                   border: "1px solid var(--border-strong)", background: "transparent",
                   color: "var(--ink)" }}
        >
          new sample
        </button>
      </div>
    </div>
  );
}
