"use client";

import { useMemo, useState } from "react";
import { fitSVM, sampleOverlap, type Pt } from "./svmSolver";

// What C is actually buying, drawn as the debt it runs up.
//
// Every point that sits inside its own margin line pays slack, and the amount it pays is a
// LENGTH: the gap between where the point is and where the margin says it should be. Those gaps
// are drawn here as segments, so the sum the optimiser is minimising is visible on the canvas
// rather than only in a readout. Turn C down and the corridor widens until it swallows half the
// data; turn it up and the corridor shrinks to dodge individual points.
//
// The behaviour across the dial is what `python scripts/svm_cases.py dial` measures over 60
// draws. The browser's RNG is not numpy's, so a given sample here does not match a row there.

const W = 560;
const PLOT = 316;                    // the drawing area; the caption gets its own strip below it
const H = 352;
const PAD = 20;
const SPREAD = 4.6;

// Every coordinate that reaches the DOM goes through here first.
//
// This lab computes its picture during the server render AND again on the client, and the two
// must produce byte-identical attributes or React reports a hydration mismatch. They did not:
// Box-Muller leans on Math.log and Math.cos, which the spec does not require to be correctly
// rounded, so Node's V8 and the browser's disagreed in the last bit or two and the difference
// rode through 20000 Pegasos iterations into output like y1="-9.678312647625262" against
// "-9.678312647625319". Rounding to three decimals is far coarser than that drift and finer than
// a pixel, so the strings match and the picture is unchanged.
const r3 = (v: number) => Math.round(v * 1000) / 1000;
const sx = (x: number) => r3(PAD + ((x + SPREAD) / (2 * SPREAD)) * (W - 2 * PAD));
const sy = (z: number) => r3(PLOT - PAD - ((z + SPREAD) / (2 * SPREAD)) * (PLOT - 2 * PAD));

// The slider moves linearly over the EXPONENT: C spans four decades, and on a linear scale
// everything below C = 10 would be crushed into the first pixel of travel.
const cFor = (t: number) => Math.pow(10, -2 + t / 25);
const fmtC = (c: number) => (c < 1 ? c.toFixed(c < 0.1 ? 3 : 2) : c < 10 ? c.toFixed(2) : c.toFixed(0));

export function SoftMarginLab() {
  const [tC, setTC] = useState(50);
  const [sep, setSep] = useState(1.4);
  const [seed, setSeed] = useState(3);
  const C = cFor(tC);

  const view = useMemo(() => {
    const { pts } = sampleOverlap(seed, 90, sep);
    const fit = fitSVM(pts, C);
    const norm = Math.hypot(fit.w[0], fit.w[1]);
    const sumXi = fit.slack.reduce((a, v) => a + v, 0);
    return {
      pts, fit, norm, sumXi,
      paying: fit.slack.filter((v) => v > 1e-9).length,
      wrong: fit.slack.filter((v) => v > 1).length,
      nsv: fit.sv.filter(Boolean).length,
    };
  }, [C, sep, seed]);

  const { pts, fit, norm, sumXi } = view;

  // w.x + b = t clipped to the box; pick the larger component so steep lines still draw.
  const lineFor = (t: number) => {
    const [w0, w1] = fit.w;
    if (Math.abs(w1) >= Math.abs(w0)) {
      if (Math.abs(w1) < 1e-12) return null;
      return { x1: sx(-SPREAD), y1: sy((t - fit.b - w0 * -SPREAD) / w1),
               x2: sx(SPREAD), y2: sy((t - fit.b - w0 * SPREAD) / w1) };
    }
    if (Math.abs(w0) < 1e-12) return null;
    return { x1: sx((t - fit.b - w1 * -SPREAD) / w0), y1: sy(-SPREAD),
             x2: sx((t - fit.b - w1 * SPREAD) / w0), y2: sy(SPREAD) };
  };
  const mid = lineFor(0);
  const up = lineFor(1);
  const dn = lineFor(-1);

  // The foot of a point's slack: walk from the point along its own label's normal direction until
  // the functional margin reaches 1. Distance travelled is exactly xi / ||w||, which is what makes
  // the drawn segment a picture of the number in the readout rather than a decoration.
  const footOf = (p: Pt, xi: number) => {
    const t = xi / (norm * norm);
    return { x: p.x + t * p.y * fit.w[0], z: p.z + t * p.y * fit.w[1] };
  };

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

        {up && dn && (
          <polygon points={`${up.x1},${up.y1} ${up.x2},${up.y2} ${dn.x2},${dn.y2} ${dn.x1},${dn.y1}`}
                   fill="var(--brand)" opacity={0.07} />
        )}
        {[up, dn].map((l, i) => l ? (
          <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
                stroke="var(--muted)" strokeWidth={1.25} strokeDasharray="5 4" />
        ) : null)}
        {mid && (
          <line x1={mid.x1} y1={mid.y1} x2={mid.x2} y2={mid.y2}
                stroke="var(--brand)" strokeWidth={2.25} />
        )}

        {/* Drawn under the points so a dot is never hidden by its own debt. */}
        {norm > 1e-9 && pts.map((p, i) => {
          const xi = fit.slack[i];
          if (xi <= 1e-9) return null;
          const f = footOf(p, xi);
          return (
            <line key={`s${i}`} x1={sx(p.x)} y1={sy(p.z)} x2={sx(f.x)} y2={sy(f.z)}
                  stroke="var(--brand)" strokeWidth={1.4} opacity={0.65} />
          );
        })}

        {pts.map((p, i) => {
          const colour = p.y === 1 ? "var(--c-classification)" : "var(--c-regression)";
          const xi = fit.slack[i];
          return (
            <g key={i}>
              {xi > 1 && (
                <circle cx={sx(p.x)} cy={sy(p.z)} r={9.5} fill="none"
                        stroke={colour} strokeWidth={1.5} opacity={0.9} />
              )}
              <circle cx={sx(p.x)} cy={sy(p.z)} r={5} fill={colour}
                      stroke="var(--canvas)" strokeWidth={1.2} opacity={xi > 1e-9 ? 1 : 0.62} />
            </g>
          );
        })}

        {/* Two lines, not one. As a single string this ran past the right edge of the viewBox and
            the last few words were cut off at narrow widths. */}
        <text x={PAD} y={PLOT + 14} style={{ fontSize: 11, fill: "var(--muted)" }}>
          each line is one point&apos;s ξ — how far short of its own margin it falls
        </text>
        <text x={PAD} y={PLOT + 29} style={{ fontSize: 11, fill: "var(--muted)" }}>
          ringed points have ξ &gt; 1: they are over the boundary, on the wrong side
        </text>
      </svg>

      <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap",
                    padding: "12px 14px", borderTop: "1px solid var(--border)" }}>
        <div>
          <div style={label}>margin 2/‖w‖</div>
          <div style={stat}>{fit.margin.toFixed(3)}</div>
        </div>
        <div>
          <div style={label}>Σξ</div>
          <div style={{ ...stat, color: "var(--brand)" }}>{sumXi.toFixed(2)}</div>
        </div>
        <div>
          <div style={label}>paying</div>
          <div style={stat}>{view.paying}<span style={{ fontSize: 13, color: "var(--muted)" }}> / {pts.length}</span></div>
        </div>
        <div>
          <div style={label}>wrong side</div>
          <div style={stat}>{view.wrong}</div>
        </div>

        <div style={{ flex: "1 1 170px", minWidth: 150 }}>
          <div style={{ ...label, marginBottom: 3 }}>C = {fmtC(C)}</div>
          <input
            type="range" min={0} max={100} step={1}
            value={tC}
            onChange={(e) => setTC(Number(e.target.value))}
            style={{ width: "100%", accentColor: "var(--c-classification)" }}
            aria-label="C, the price of one unit of slack"
          />
        </div>
        <div style={{ flex: "1 1 170px", minWidth: 150 }}>
          <div style={{ ...label, marginBottom: 3 }}>class separation = {sep.toFixed(1)}</div>
          <input
            type="range" min={0.4} max={3.0} step={0.1}
            value={sep}
            onChange={(e) => setSep(Number(e.target.value))}
            style={{ width: "100%", accentColor: "var(--c-regression)" }}
            aria-label="how far apart the two clouds sit"
          />
        </div>

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
