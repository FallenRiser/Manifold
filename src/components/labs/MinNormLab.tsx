"use client";

import { useState } from "react";
import { canonicalForDirection, type Canon, type Pt } from "./svmSolver";

// Rotate the boundary; watch ||w|| and the margin move as exact reciprocals.
//
// Every direction that separates the data gives ONE canonical boundary, so the whole search can
// be drawn as a curve over a single angle. The curve of ||w|| has its minimum at precisely the
// angle where the margin peaks, which is the page's claim made visible: minimising ||w|| and
// maximising the margin are one search, not two.
//
// Reproduced by `python scripts/svm_cases.py minnorm`, which sweeps the same way at 0.05 deg.

const W = 560;
const H = 300;
const CH = 96;                       // the ||w|| curve underneath
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

const canonicalFor = (deg: number) => canonicalForDirection(PTS, deg);

// The sweep depends only on PTS, so it is computed once at module scope rather than per mount.
// BEST is also the opening angle: hard-coding one instead shipped a lab that opened on a
// direction which cannot separate this data, showing "no boundary" and four dashes where the
// readouts should be. Deriving it means the lab cannot open blank whatever the points become.
const CURVE: (Canon | null)[] = [];
for (let d = 0; d < 360; d += 0.5) CURVE.push(canonicalFor(d));
const NORMS = CURVE.filter(Boolean).map((v) => v!.norm);
const LO_N = Math.min(...NORMS);
const HI_N = LO_N * 3;
const BEST = CURVE.reduce(
  (bi, v, i) => (v && (bi < 0 || v.norm < CURVE[bi]!.norm) ? i : bi), -1) * 0.5;

export function MinNormLab() {
  const [deg, setDeg] = useState(BEST);
  const fit = canonicalFor(deg);
  const curve = CURVE;
  const best = BEST;
  const lo = LO_N;
  const hi = HI_N;

  const lineFor = (t: number) => {
    if (!fit) return null;
    const [w0, w1] = fit.w;
    if (Math.abs(w1) >= Math.abs(w0)) {
      return { x1: sx(LO), y1: sy((t - fit.b - w0 * LO) / w1),
               x2: sx(HI), y2: sy((t - fit.b - w0 * HI) / w1) };
    }
    return { x1: sx((t - fit.b - w1 * LO) / w0), y1: sy(LO),
             x2: sx((t - fit.b - w1 * HI) / w0), y2: sy(HI) };
  };
  const mid = lineFor(0);
  const up = lineFor(1);
  const dn = lineFor(-1);

  // ||w|| curve: x is the angle, y is the norm, clipped to 3x the minimum so the blow-up at the
  // edges of the feasible cone does not flatten the interesting part.
  // The axis is centred on the best direction, not on 0 deg. The directions that separate form a
  // single contiguous wedge, but that wedge straddles the 0/360 seam -- here it runs 275.5 deg
  // through 0 to 15.5 deg -- so an axis starting at 0 slices it in half and draws the two ends at
  // opposite sides of the chart, which reads as two separate feasible regions. It is one.
  // Shown over +/-AX rather than the whole turn: the feasible wedge is 100 deg wide, so a full
  // 360 axis spends three quarters of the chart on emptiness and squashes the dip.
  const AX = 90;
  const rel = (d: number) => ((d - best + 540) % 360) - 180;
  const cx = (d: number) => PAD + ((rel(d) + AX) / (2 * AX)) * (W - 2 * PAD);
  // Top of the plotting band is 28, not 14: the curve is clipped at hi and rides the ceiling near
  // the edges of the feasible cone, where it used to run straight through the caption.
  const cy = (n: number) => CH - 14 - ((Math.min(n, hi) - lo) / (hi - lo)) * (CH - 42);
  // Walk the curve in AXIS order rather than index order, or the polyline leaps back across the
  // chart at the seam.
  const ordered = curve
    .map((v, i) => ({ d: i * 0.5, v }))
    .filter((e) => Math.abs(rel(e.d)) <= AX)
    .sort((a, b) => rel(a.d) - rel(b.d));
  const segments: string[] = [];
  let run: string[] = [];
  ordered.forEach(({ d, v }) => {
    if (v) run.push(`${cx(d).toFixed(2)},${cy(v.norm).toFixed(2)}`);
    else if (run.length) { segments.push(run.join(" ")); run = []; }
  });
  if (run.length) segments.push(run.join(" "));

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

        {fit && up && dn && (
          <polygon points={`${up.x1},${up.y1} ${up.x2},${up.y2} ${dn.x2},${dn.y2} ${dn.x1},${dn.y1}`}
                   fill="var(--brand)" opacity={0.07} />
        )}
        {fit && [up, dn].map((l, i) => l ? (
          <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
                stroke="var(--muted)" strokeWidth={1.25} strokeDasharray="5 4" />
        ) : null)}
        {fit && mid && (
          <line x1={mid.x1} y1={mid.y1} x2={mid.x2} y2={mid.y2}
                stroke="var(--brand)" strokeWidth={2.25} />
        )}

        {PTS.map((p, i) => {
          const colour = p.y === 1 ? "var(--c-classification)" : "var(--c-regression)";
          return (
            <g key={i}>
              {fit?.touch.includes(i) && (
                <circle cx={sx(p.x)} cy={sy(p.z)} r={11} fill="none"
                        stroke={colour} strokeWidth={1.75} opacity={0.85} />
              )}
              <circle cx={sx(p.x)} cy={sy(p.z)} r={6.5} fill={colour}
                      stroke="var(--canvas)" strokeWidth={1.5} />
            </g>
          );
        })}

        {/* On a pill at the top, not bare in the middle: centred text landed straight through the
            point cloud and collided with whichever points sat near the middle of the canvas. */}
        {!fit && (
          <g>
            <rect x={W / 2 - 172} y={14} width={344} height={28} rx={14}
                  fill="var(--panel)" stroke="var(--border)" strokeWidth={1} />
            <text x={W / 2} y={32} textAnchor="middle"
                  style={{ fontSize: 12.5, fill: "var(--muted)" }}>
              no boundary with this normal separates the two classes
            </text>
          </g>
        )}
      </svg>

      <svg viewBox={`0 0 ${W} ${CH}`} style={{ width: "100%", display: "block" }}>
        <rect x={0} y={0} width={W} height={CH} fill="var(--canvas)" />
        <text x={PAD} y={14} style={{ fontSize: 11, fill: "var(--muted)" }}>
          ‖w‖ by angle from the best direction — blank ends cannot separate
        </text>
        {segments.map((pts, i) => (
          <polyline key={i} points={pts} fill="none" stroke="var(--c-regression)" strokeWidth={1.75} />
        ))}
        {/* the minimum: the answer the optimiser is looking for */}
        <line x1={cx(best)} y1={24} x2={cx(best)} y2={CH - 10}
              stroke="var(--c-classification)" strokeWidth={1.25} strokeDasharray="3 3" />
        {fit && <circle cx={cx(deg)} cy={cy(fit.norm)} r={4} fill="var(--brand)" />}
      </svg>

      <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap",
                    padding: "12px 14px", borderTop: "1px solid var(--border)" }}>
        <div>
          <div style={label}>‖w‖</div>
          <div style={stat}>{fit ? fit.norm.toFixed(4) : "—"}</div>
        </div>
        <div>
          <div style={label}>margin</div>
          <div style={stat}>{fit ? fit.margin.toFixed(4) : "—"}</div>
        </div>
        <div>
          <div style={label}>‖w‖ × margin</div>
          <div style={{ ...stat, color: "var(--brand)" }}>
            {fit ? (fit.norm * fit.margin).toFixed(6) : "—"}
          </div>
        </div>

        <div style={{ flex: "1 1 190px", minWidth: 170 }}>
          <div style={{ ...label, marginBottom: 3 }}>normal angle = {deg.toFixed(1)}°</div>
          <input
            type="range" min={0} max={359.5} step={0.5}
            value={deg}
            onChange={(e) => setDeg(Number(e.target.value))}
            style={{ width: "100%", accentColor: "var(--c-classification)" }}
            aria-label="the angle of the boundary's normal vector"
          />
        </div>

        <button
          onClick={() => setDeg(best)}
          style={{ fontSize: 12.5, padding: "6px 11px", borderRadius: 6, cursor: "pointer",
                   border: "1px solid var(--border-strong)", background: "transparent",
                   color: "var(--ink)" }}
        >
          jump to smallest ‖w‖
        </button>
      </div>
    </div>
  );
}
