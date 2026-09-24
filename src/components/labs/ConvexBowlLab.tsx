"use client";

import { useMemo, useState } from "react";
import {
  descendPrimal, fitSVM, primalJ, profileHinge, profileWrong, sampleOverlap, type Pt,
} from "./svmSolver";

// The primal objective drawn as a surface over the two weights, with a ball you can drop on it.
//
// Height is J(w) = (1/2)||w||^2 + C * min_b sum_i max(0, 1 - y_i (w . x_i + b)) -- the offset is
// minimised away rather than fixed, so this is the real bowl and not a slice through one. Drop
// the ball anywhere and it reaches the same bottom, which is the whole of what convex buys.
//
// Switch the surface to the count of mistakes and the bowl becomes terraces: flat everywhere,
// so the ball has nothing to roll down and stays exactly where it landed.
//
// Held to Python by scripts/svm_primallab_check.mjs -- the surface to 1.4e-12, and the descent
// to within 0.03 degrees of the boundary sklearn finds. Reproduced by
// `python scripts/svm_cases.py primal convex flat`.

const W = 560;
const BOWL = 292;          // the surface panel is square, this is its side
const GAP = 16;
const PAD = 22;
const H = 352;
// 62 divides BOWL - 2*PAD = 248 exactly, so every cell is 4 units wide and the grid tiles with
// no overlap. That matters: semi-transparent rects that overlap by even half a unit double their
// alpha along every seam, which draws a bright lattice over the surface instead of a surface.
const GRID = 62;
const WMAX = 2.6;          // the plotted range of each weight
const SPREAD = 3.8;        // the plotted range of the data panel
const N = 30;
const C = 1;
const BANDS = 12;
const PINK = "var(--c-classification)";

// Everything downstream of the sample is +, -, * and Math.max, all exactly specified by IEEE, so
// rounding the points once here makes the server's grid and the browser's grid bit-identical.
// Without it sampleOverlap's Math.log/Math.cos disagree in the last bits and React reports a
// hydration mismatch on the opacity of a cell somewhere in the middle of the surface.
const r3 = (v: number) => Math.round(v * 1000) / 1000;
const r6 = (v: number) => Math.round(v * 1e6) / 1e6;

const bx = (w0: number) => r3(PAD + ((w0 + WMAX) / (2 * WMAX)) * (BOWL - 2 * PAD));
const by = (w1: number) => r3(BOWL - PAD - ((w1 + WMAX) / (2 * WMAX)) * (BOWL - 2 * PAD));
const PLOT = BOWL - 2 * PAD;      // both panels are PLOT x PLOT, so an angle is an angle
const DX = BOWL + GAP;
const dx = (x: number) => r3(DX + ((x + SPREAD) / (2 * SPREAD)) * PLOT);
const dy = (z: number) => r3(BOWL - PAD - ((z + SPREAD) / (2 * SPREAD)) * PLOT);

type Surface = "hinge" | "wrong";

export function ConvexBowlLab() {
  const [surface, setSurface] = useState<Surface>("hinge");
  const [seed, setSeed] = useState(3);
  const [start, setStart] = useState<[number, number]>([-2.1, 1.9]);

  const pts = useMemo<Pt[]>(
    () => sampleOverlap(seed, N, 1.3).pts.map((p) => ({ x: r6(p.x), z: r6(p.z), y: p.y })),
    [seed],
  );

  const cells = useMemo(() => {
    const step = (2 * WMAX) / GRID;
    const vals: number[] = [];
    for (let j = 0; j < GRID; j++) {
      for (let i = 0; i < GRID; i++) {
        const w: [number, number] = [-WMAX + (i + 0.5) * step, -WMAX + (j + 0.5) * step];
        vals.push(surface === "hinge" ? primalJ(pts, w, C) : profileWrong(pts, w).n);
      }
    }
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    return { vals, lo, hi, step };
  }, [pts, surface]);

  const run = useMemo(() => {
    const d = descendPrimal(pts, start, C, surface);
    const opt = fitSVM(pts, C);
    const cos = (u: [number, number], v: [number, number]) =>
      (u[0] * v[0] + u[1] * v[1]) / (Math.hypot(...u) * Math.hypot(...v));
    return {
      ...d,
      opt: opt.w,
      startJ: primalJ(pts, start, C),
      endJ: primalJ(pts, d.end, C),
      startWrong: profileWrong(pts, start).n,
      endWrong: profileWrong(pts, d.end).n,
      offBy: (Math.acos(Math.max(-1, Math.min(1, cos(d.end, opt.w)))) * 180) / Math.PI,
    };
  }, [pts, start, surface]);

  const drawn = surface === "hinge" ? run.end : start;
  const drawnB = profileHinge(pts, drawn).b;

  const lineFor = (w: [number, number], b: number) => {
    if (Math.abs(w[1]) >= Math.abs(w[0])) {
      if (Math.abs(w[1]) < 1e-9) return null;
      return {
        x1: dx(-SPREAD), y1: dy((-b - w[0] * -SPREAD) / w[1]),
        x2: dx(SPREAD), y2: dy((-b - w[0] * SPREAD) / w[1]),
      };
    }
    if (Math.abs(w[0]) < 1e-9) return null;
    return {
      x1: dx((-b - w[1] * -SPREAD) / w[0]), y1: dy(-SPREAD),
      x2: dx((-b - w[1] * SPREAD) / w[0]), y2: dy(SPREAD),
    };
  };
  const endLine = lineFor(drawn, drawnB);
  const startLine = surface === "hinge"
    ? lineFor(start, profileHinge(pts, start).b)
    : null;

  const onPick = (e: React.MouseEvent<SVGRectElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const u = ((e.clientX - r.left) / r.width) * BOWL;
    const v = ((e.clientY - r.top) / r.height) * BOWL;
    const w0 = ((u - PAD) / (BOWL - 2 * PAD)) * 2 * WMAX - WMAX;
    const w1 = ((BOWL - PAD - v) / (BOWL - 2 * PAD)) * 2 * WMAX - WMAX;
    const clamp = (t: number) => Math.max(-WMAX, Math.min(WMAX, t));
    setStart([r3(clamp(w0)), r3(clamp(w1))]);
  };

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

  const cw = (BOWL - 2 * PAD) / GRID;
  const span = Math.max(1e-9, cells.hi - cells.lo);

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden",
                  background: "var(--panel)" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
        <rect x={0} y={0} width={W} height={H} fill="var(--canvas)" />

        <g shapeRendering="crispEdges">
          {cells.vals.map((v, k) => {
            const i = k % GRID;
            const j = (k - i) / GRID;
            // Banded rather than continuous: the bands ARE the contour rings, and under the
            // mistake count they are the terraces. sqrt opens up the basin, which is otherwise a
            // single bright dot at the bottom of a very tall bowl.
            const t = Math.sqrt((v - cells.lo) / span);
            const band = Math.min(BANDS - 1, Math.floor(t * BANDS));
            return (
              <rect
                key={k}
                x={PAD + i * cw}
                y={BOWL - PAD - (j + 1) * cw}
                width={cw}
                height={cw}
                fill={PINK}
                opacity={r3(0.66 - band * (0.6 / (BANDS - 1)))}
              />
            );
          })}
        </g>

        <rect x={PAD} y={PAD} width={BOWL - 2 * PAD} height={BOWL - 2 * PAD}
              fill="transparent" stroke="var(--border-strong)" strokeWidth={1}
              style={{ cursor: "crosshair" }} onClick={onPick} />

        {/* the path down */}
        {run.path.length > 1 && (
          <polyline
            points={run.path.map(([a, b]) => `${bx(a)},${by(b)}`).join(" ")}
            fill="none" stroke="var(--ink)" strokeWidth={1.5} opacity={0.75}
          />
        )}
        <circle cx={bx(run.opt[0])} cy={by(run.opt[1])} r={6.5} fill="none"
                stroke="var(--ink)" strokeWidth={1.8} />
        <circle cx={bx(start[0])} cy={by(start[1])} r={3.4} fill="var(--muted)" />
        <circle cx={bx(run.end[0])} cy={by(run.end[1])} r={5} fill="var(--ink)" />

        <text x={PAD} y={PAD - 7} style={{ fontSize: 11, fill: "var(--muted)" }}>
          {surface === "hinge"
            ? "the objective over the two weights — click anywhere"
            : "mistakes over the two weights — click anywhere"}
        </text>

        {/* the same boundary, in the data */}
        <rect x={DX} y={PAD} width={PLOT} height={PLOT}
              fill="transparent" stroke="var(--border-strong)" strokeWidth={1} />
        {startLine && (
          <line x1={startLine.x1} y1={startLine.y1} x2={startLine.x2} y2={startLine.y2}
                stroke="var(--muted)" strokeWidth={1.3} strokeDasharray="5 4"
                clipPath="url(#bowlclip)" />
        )}
        {endLine && (
          <line x1={endLine.x1} y1={endLine.y1} x2={endLine.x2} y2={endLine.y2}
                stroke="var(--brand)" strokeWidth={2.25} clipPath="url(#bowlclip)" />
        )}
        <defs>
          <clipPath id="bowlclip">
            <rect x={DX} y={PAD} width={PLOT} height={PLOT} />
          </clipPath>
        </defs>
        {pts.map((p, i) => (
          <circle key={i} cx={dx(p.x)} cy={dy(p.z)} r={3.4}
                  fill={p.y === 1 ? "var(--c-classification)" : "var(--c-regression)"} />
        ))}
        <text x={DX} y={PAD - 7} style={{ fontSize: 11, fill: "var(--muted)" }}>
          the boundary those weights mean
        </text>

        <text x={PAD} y={BOWL + 20} style={{ fontSize: 11, fill: "var(--muted)" }}>
          {surface === "hinge"
            ? `the ball rolled ${run.path.length - 1} recorded steps downhill and stopped `
              + `${run.offBy < 0.005 ? "on" : `${run.offBy.toFixed(2)}° from`} the marked optimum`
            : "the ball has not moved — between its steps the count of mistakes is flat, so "
              + "there is no downhill"}
        </text>
        <text x={PAD} y={BOWL + 35} style={{ fontSize: 11, fill: "var(--muted)" }}>
          {surface === "hinge"
            ? "drop it anywhere you like: the bowl has one bottom and every start finds it"
            : `every shade is a whole number of mistakes — ${cells.lo} at best, ${cells.hi} at worst`}
        </text>
      </svg>

      <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap",
                    padding: "12px 14px", borderTop: "1px solid var(--border)" }}>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => setSurface("hinge")} style={tab(surface === "hinge")}>
            the primal
          </button>
          <button onClick={() => setSurface("wrong")} style={tab(surface === "wrong")}>
            mistakes
          </button>
        </div>

        <div>
          <div style={label}>where it landed</div>
          <div style={stat}>
            {surface === "hinge" ? run.startJ.toFixed(2) : run.startWrong}
          </div>
        </div>
        <div>
          <div style={label}>where it stopped</div>
          <div style={{ ...stat, color: "var(--brand)" }}>
            {surface === "hinge" ? run.endJ.toFixed(2) : run.endWrong}
          </div>
        </div>
        <div>
          <div style={label}>off the optimum</div>
          <div style={stat}>
            {surface === "hinge" ? `${run.offBy.toFixed(2)}°` : "—"}
          </div>
        </div>

        <button
          onClick={() => setSeed((s) => (s === 6 ? 3 : s + 1))}
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
