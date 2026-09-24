"use client";

import { useMemo, useState } from "react";
import { dualFit, sampleOverlap, type Pt } from "./svmSolver";

// Delete points and watch the boundary refuse to care.
//
// Every click drops a training point and re-solves the dual from what is left -- no caching, no
// incremental update, the whole fit again. The dashed line is where the boundary was with all of
// them, so the question the lab asks is answered by whether the solid line has left it.
//
// The encoding carries the page's argument: the three groups are drawn differently because they
// behave differently. A point with no price is a bare dot; one resting ON the margin gets a ring;
// one pinned at the cap gets a filled halo. Dropping every bare dot at once is one button, and
// the turn readout stays at 0.0000 degrees when you press it.
//
// Held to sklearn by scripts/svm_supportset_check.mjs, against cases recorded by
// `python scripts/svm_cases.py svset`.

const W = 560;
const PAD = 18;
const PLOT = 292;
const H = PLOT + 2 * PAD + 30;
const GX = PAD + PLOT + 26;
const N = 26;
const C = 1;
const SPREAD = 3.6;
const PINK = "var(--c-classification)";
const BLUE = "var(--c-regression)";

const r3 = (v: number) => Math.round(v * 1000) / 1000;
const r6 = (v: number) => Math.round(v * 1e6) / 1e6;
const sx = (x: number) => r3(PAD + ((x + SPREAD) / (2 * SPREAD)) * PLOT);
const sy = (z: number) => r3(PAD + PLOT - ((z + SPREAD) / (2 * SPREAD)) * PLOT);

function angleBetweenDeg(u: [number, number], v: [number, number]) {
  const d = Math.hypot(u[0], u[1]) * Math.hypot(v[0], v[1]);
  if (d < 1e-12) return 0;
  const c = Math.abs((u[0] * v[0] + u[1] * v[1]) / d);
  return (Math.acos(Math.min(1, c)) * 180) / Math.PI;
}

export function SupportSetLab() {
  const [seed, setSeed] = useState(3);
  const [dropped, setDropped] = useState<number[]>([]);

  const base = useMemo<Pt[]>(
    // sampleOverlap draws through Box-Muller, and Math.log/Math.cos are not required to be
    // correctly rounded -- so the server and the browser can disagree in the last bits and the
    // SVG will not match. Rounding the coordinates once, here, settles it for everything
    // downstream: the solver is pure arithmetic on these numbers.
    () => sampleOverlap(seed, N, 1.25).pts.map((p) => ({ x: r6(p.x), z: r6(p.z), y: p.y })),
    [seed],
  );

  const view = useMemo(() => {
    const out = new Set(dropped);
    const kept = base.filter((_, i) => !out.has(i));
    const full = dualFit(base, C);
    const now = kept.length >= 2 && new Set(kept.map((p) => p.y)).size === 2
      ? dualFit(kept, C)
      : null;
    // The group of each ORIGINAL point, so the drawing does not change under your hands as you
    // delete: what the buttons act on is the fit you are looking at when you press them.
    const group = full.group;
    return {
      kept, full, now, group, out,
      turn: now ? angleBetweenDeg(full.w, now.w) : 0,
      db: now ? Math.abs(now.b - full.b) : 0,
      counts: [0, 1, 2].map((k) => group.filter((g) => g === k).length),
      nsv: now ? now.group.filter((g) => g !== 0).length : 0,
    };
  }, [base, dropped]);

  const { full, now, group } = view;
  const lineFor = (w: [number, number], b: number, t: number) => {
    if (Math.abs(w[1]) >= Math.abs(w[0])) {
      if (Math.abs(w[1]) < 1e-9) return null;
      return { x1: sx(-SPREAD), y1: sy((t - b - w[0] * -SPREAD) / w[1]),
               x2: sx(SPREAD), y2: sy((t - b - w[0] * SPREAD) / w[1]) };
    }
    if (Math.abs(w[0]) < 1e-9) return null;
    return { x1: sx((t - b - w[1] * -SPREAD) / w[0]), y1: sy(-SPREAD),
             x2: sx((t - b - w[1] * SPREAD) / w[0]), y2: sy(SPREAD) };
  };

  const ghost = lineFor(full.w, full.b, 0);
  const live = now ? lineFor(now.w, now.b, 0) : null;
  const up = now ? lineFor(now.w, now.b, 1) : null;
  const dn = now ? lineFor(now.w, now.b, -1) : null;

  const label: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, letterSpacing: "0.07em",
    textTransform: "uppercase", color: "var(--muted)",
  };
  const stat: React.CSSProperties = {
    fontSize: 18, fontVariantNumeric: "tabular-nums", color: "var(--ink)",
  };
  const btn: React.CSSProperties = {
    fontSize: 12.5, padding: "6px 11px", borderRadius: 6, cursor: "pointer",
    border: "1px solid var(--border-strong)", background: "transparent", color: "var(--ink)",
  };

  const legend: [string, string][] = [
    ["no price — a bare dot", "" + view.counts[0]],
    ["on the margin — ringed", "" + view.counts[1]],
    ["pinned at C — filled halo", "" + view.counts[2]],
  ];

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden",
                  background: "var(--panel)" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
        <rect x={0} y={0} width={W} height={H} fill="var(--canvas)" />

        <g clipPath="url(#ssclip)">
          {up && dn && live && (
            <polygon
              points={`${up.x1},${up.y1} ${up.x2},${up.y2} ${dn.x2},${dn.y2} ${dn.x1},${dn.y1}`}
              fill={PINK} opacity={0.07} />
          )}
          {ghost && (
            <line x1={ghost.x1} y1={ghost.y1} x2={ghost.x2} y2={ghost.y2}
                  stroke="var(--muted)" strokeWidth={1.5} strokeDasharray="5 4" opacity={0.8} />
          )}
          {live && (
            <line x1={live.x1} y1={live.y1} x2={live.x2} y2={live.y2}
                  stroke="var(--ink)" strokeWidth={2} />
          )}
          {base.map((p, i) => {
            const gone = view.out.has(i);
            const colour = p.y === 1 ? PINK : BLUE;
            const cx = sx(p.x);
            const cy = sy(p.z);
            const g = group[i];
            return (
              <g key={i} onClick={() => setDropped((d) =>
                    d.includes(i) ? d.filter((v) => v !== i) : [...d, i])}
                 style={{ cursor: "pointer" }}>
                <circle cx={cx} cy={cy} r={11} fill="transparent" />
                {g === 2 && !gone && (
                  <circle cx={cx} cy={cy} r={9} fill={colour} opacity={0.22} />
                )}
                {g === 1 && !gone && (
                  <circle cx={cx} cy={cy} r={8} fill="none" stroke={colour} strokeWidth={1.6} />
                )}
                {gone ? (
                  <>
                    <line x1={r3(cx - 4)} y1={r3(cy - 4)} x2={r3(cx + 4)} y2={r3(cy + 4)}
                          stroke="var(--muted)" strokeWidth={1.4} />
                    <line x1={r3(cx - 4)} y1={r3(cy + 4)} x2={r3(cx + 4)} y2={r3(cy - 4)}
                          stroke="var(--muted)" strokeWidth={1.4} />
                  </>
                ) : (
                  <circle cx={cx} cy={cy} r={4} fill={colour}
                          opacity={g === 0 ? 0.5 : 1} />
                )}
              </g>
            );
          })}
        </g>
        <defs>
          <clipPath id="ssclip">
            <rect x={PAD} y={PAD} width={PLOT} height={PLOT} />
          </clipPath>
        </defs>
        <rect x={PAD} y={PAD} width={PLOT} height={PLOT} fill="none"
              stroke="var(--border-strong)" strokeWidth={1} />
        <text x={PAD} y={PAD - 6} style={{ fontSize: 11, fill: "var(--muted)" }}>
          click any point to take it out of the training set
        </text>

        {legend.map(([t, c], i) => (
          <g key={t}>
            <text x={GX} y={PAD + 14 + i * 21} style={{ fontSize: 11.5, fill: "var(--ink)" }}>
              {t}
            </text>
            <text x={W - PAD} y={PAD + 14 + i * 21} textAnchor="end"
                  style={{ fontSize: 11.5, fill: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>
              {c}
            </text>
          </g>
        ))}
        <line x1={GX} y1={PAD + 80} x2={W - PAD} y2={PAD + 80}
              stroke="var(--border)" strokeWidth={1} />
        <text x={GX} y={PAD + 100} style={{ fontSize: 11.5, fill: "var(--muted)" }}>
          dashed = the boundary with all {N}
        </text>
        <text x={GX} y={PAD + 118} style={{ fontSize: 11.5, fill: "var(--muted)" }}>
          solid = the boundary right now
        </text>
        <text x={GX} y={PAD + 152} style={{ fontSize: 11, fill: "var(--muted)" }}>
          the groups are read off the full fit,
        </text>
        <text x={GX} y={PAD + 168} style={{ fontSize: 11, fill: "var(--muted)" }}>
          so they hold still while you work
        </text>

        <text x={PAD} y={PAD + PLOT + 20} style={{ fontSize: 11, fill: "var(--muted)" }}>
          every click re-solves the dual from what is left — nothing is cached or nudged
        </text>
      </svg>

      <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap",
                    padding: "12px 14px", borderTop: "1px solid var(--border)" }}>
        <div>
          <div style={label}>points kept</div>
          <div style={stat}>{view.kept.length}<span style={{ fontSize: 13, color: "var(--muted)" }}>
            {" "}/ {N}</span></div>
        </div>
        <div>
          <div style={label}>boundary turned</div>
          <div style={stat}>{now ? `${view.turn.toFixed(4)}°` : "—"}</div>
        </div>
        <div>
          <div style={label}>offset moved</div>
          <div style={stat}>{now ? view.db.toFixed(4) : "—"}</div>
        </div>
        <div>
          <div style={label}>support vectors now</div>
          <div style={stat}>{now ? view.nsv : "—"}</div>
        </div>

        <div style={{ display: "flex", gap: 8, marginLeft: "auto", flexWrap: "wrap" }}>
          <button style={btn}
                  onClick={() => setDropped(group.map((g, i) => (g === 0 ? i : -1))
                                                 .filter((i) => i >= 0))}>
            drop every point with no price
          </button>
          <button style={btn} onClick={() => setDropped([])}>put them all back</button>
          <button style={btn} onClick={() => { setDropped([]); setSeed((s) => (s === 7 ? 3 : s + 1)); }}>
            new sample
          </button>
        </div>
      </div>

      {!now && (
        <div style={{ padding: "0 14px 12px", fontSize: 12.5, color: "var(--muted)" }}>
          One class has nothing left in it, so there is no boundary to fit. Put some points back.
        </div>
      )}
    </div>
  );
}
