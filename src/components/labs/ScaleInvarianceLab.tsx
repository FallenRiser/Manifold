"use client";

import { useMemo, useState } from "react";
import { fitSVM, type Pt } from "./svmSolver";

// One boundary, many ways of writing it.
//
// The point of this lab is a non-event: turn the dial and NOTHING moves. w, b and the functional
// margin all swing by three orders of magnitude while the line, the corridor and the measured
// distance sit exactly still. That is what "the functional margin is not a property of the
// boundary" means, and it is far more convincing to watch than to be told.
//
// The numbers here are reproduced by `python scripts/svm_cases.py rescale`.

const W = 560;
const H = 330;
const PAD = 26;
const LO = -3;
const HI = 3;
const sx = (x: number) => PAD + ((x - LO) / (HI - LO)) * (W - 2 * PAD);
const sy = (z: number) => H - PAD - ((z - LO) / (HI - LO)) * (H - 2 * PAD);

const PTS: Pt[] = [
  { x: -1.9, z: 0.9, y: -1 }, { x: -1.5, z: 1.8, y: -1 }, { x: -2.3, z: -0.2, y: -1 },
  { x: -0.9, z: 1.2, y: -1 }, { x: -1.2, z: 0.1, y: -1 }, { x: -2.0, z: 1.9, y: -1 },
  { x: -0.6, z: 2.1, y: -1 },
  { x: 1.7, z: -0.8, y: 1 }, { x: 1.2, z: -1.7, y: 1 }, { x: 2.2, z: 0.2, y: 1 },
  { x: 0.8, z: -1.1, y: 1 }, { x: 1.9, z: -1.9, y: 1 }, { x: 2.4, z: -1.0, y: 1 },
  { x: 0.6, z: -2.2, y: 1 },
];

/** Same numbers however they are written, so it is fit once and only rescaled after. */
const BASE = fitSVM(PTS, 10);

export function ScaleInvarianceLab() {
  const [logK, setLogK] = useState(0);
  const k = 10 ** logK;

  const view = useMemo(() => {
    const w: [number, number] = [BASE.w[0] * k, BASE.w[1] * k];
    const b = BASE.b * k;
    const norm = Math.hypot(w[0], w[1]);
    let best = Infinity;
    let star = 0;
    PTS.forEach((p, i) => {
      const z = p.y * (w[0] * p.x + w[1] * p.z + b);
      if (z < best) { best = z; star = i; }
    });
    return { w, b, norm, func: best, geo: best / norm, star };
  }, [k]);

  // w.x + b = t across the box; pick the larger component of w so near-vertical lines still draw.
  const lineFor = (t: number) => {
    const [w0, w1] = view.w;
    if (Math.abs(w1) >= Math.abs(w0)) {
      return {
        x1: sx(LO), y1: sy((t - view.b - w0 * LO) / w1),
        x2: sx(HI), y2: sy((t - view.b - w0 * HI) / w1),
      };
    }
    return {
      x1: sx((t - view.b - w1 * LO) / w0), y1: sy(LO),
      x2: sx((t - view.b - w1 * HI) / w0), y2: sy(HI),
    };
  };

  const mid = lineFor(0);
  // The margin lines sit at w.x + b = +/-k, not +/-1: the corridor is a fixed set of points, so
  // its EQUATION has to be rescaled alongside w and b for it to stay put.
  const up = lineFor(k);
  const dn = lineFor(-k);

  // Foot of the perpendicular from the closest point. Scale-free by construction, which is the
  // whole point -- this arrow is the same length at every k.
  const p = PTS[view.star];
  const t = (view.w[0] * p.x + view.w[1] * p.z + view.b) / (view.norm * view.norm);
  const foot = { x: p.x - t * view.w[0], z: p.z - t * view.w[1] };

  const fmt = (v: number) => (Math.abs(v) >= 1000 || Math.abs(v) < 0.01
    ? v.toExponential(2) : v.toFixed(3));
  /** Signs folded into the operator, so the equation never reads "+ -0.443". */
  const term = (v: number) => `${v < 0 ? "−" : "+"} ${fmt(Math.abs(v))}`;

  const label: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, letterSpacing: "0.07em",
    textTransform: "uppercase", color: "var(--muted)",
  };
  const stat: React.CSSProperties = {
    fontSize: 19, fontVariantNumeric: "tabular-nums", color: "var(--ink)",
  };
  // log scale, because the functional margin spans three decades across the dial
  const barW = (v: number) => `${Math.max(2, Math.min(100, (Math.log10(v) + 1.2) * 33))}%`;

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden",
                  background: "var(--panel)" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
        <rect x={0} y={0} width={W} height={H} fill="var(--canvas)" />

        <polygon
          points={`${up.x1},${up.y1} ${up.x2},${up.y2} ${dn.x2},${dn.y2} ${dn.x1},${dn.y1}`}
          fill="var(--brand)" opacity={0.07}
        />
        {[up, dn].map((l, i) => (
          <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
                stroke="var(--muted)" strokeWidth={1.25} strokeDasharray="5 4" />
        ))}
        <line x1={mid.x1} y1={mid.y1} x2={mid.x2} y2={mid.y2}
              stroke="var(--brand)" strokeWidth={2.25} />

        {/* the measured distance: never changes length, however the equation is written */}
        <line x1={sx(p.x)} y1={sy(p.z)} x2={sx(foot.x)} y2={sy(foot.z)}
              stroke="var(--ink)" strokeWidth={1.75} strokeDasharray="3 3" />
        <circle cx={sx(foot.x)} cy={sy(foot.z)} r={3} fill="var(--ink)" />

        {PTS.map((q, i) => {
          const colour = q.y === 1 ? "var(--c-classification)" : "var(--c-regression)";
          return (
            <g key={i}>
              {i === view.star && (
                <circle cx={sx(q.x)} cy={sy(q.z)} r={11} fill="none"
                        stroke={colour} strokeWidth={1.75} opacity={0.85} />
              )}
              <circle cx={sx(q.x)} cy={sy(q.z)} r={6.5} fill={colour}
                      stroke="var(--canvas)" strokeWidth={1.5} />
            </g>
          );
        })}

        <text x={PAD} y={20} style={{ fontSize: 12.5, fill: "var(--muted)",
                                      fontVariantNumeric: "tabular-nums" }}>
          {fmt(view.w[0])} x₁ {term(view.w[1])} x₂ {term(view.b)} = 0
        </text>
      </svg>

      <div style={{ padding: "12px 14px", borderTop: "1px solid var(--border)" }}>
        <div style={{ display: "flex", gap: 22, alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <div style={label}>‖w‖</div>
            <div style={stat}>{fmt(view.norm)}</div>
          </div>
          <div>
            <div style={label}>functional margin</div>
            <div style={stat}>{fmt(view.func)}</div>
          </div>
          <div>
            <div style={label}>geometric margin</div>
            <div style={{ ...stat, color: "var(--brand)" }}>{view.geo.toFixed(6)}</div>
          </div>

          <div style={{ flex: "1 1 190px", minWidth: 170 }}>
            <div style={{ ...label, marginBottom: 3 }}>
              scale k = {k >= 1 ? k.toFixed(k >= 10 ? 0 : 1) : k.toFixed(2)}
            </div>
            <input
              type="range" min={-1} max={2} step={0.05}
              value={logK}
              onChange={(e) => setLogK(Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--c-classification)" }}
              aria-label="k, the scale applied to w and b"
            />
          </div>

          <button
            onClick={() => setLogK(0)}
            style={{ fontSize: 12.5, padding: "6px 11px", borderRadius: 6, cursor: "pointer",
                     border: "1px solid var(--border-strong)", background: "transparent",
                     color: "var(--ink)" }}
          >
            reset
          </button>
        </div>

        <div style={{ marginTop: 12, display: "grid", gap: 6 }}>
          {[
            { name: "functional", v: view.func, c: "var(--c-regression)" },
            { name: "geometric", v: view.geo, c: "var(--brand)" },
          ].map((r) => (
            <div key={r.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ ...label, width: 88, textTransform: "none", letterSpacing: 0 }}>
                {r.name}
              </div>
              <div style={{ flex: 1, height: 8, borderRadius: 4, background: "var(--canvas)",
                            border: "1px solid var(--border)", overflow: "hidden" }}>
                <div style={{ width: barW(r.v), height: "100%", background: r.c,
                              transition: "width 90ms linear" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
