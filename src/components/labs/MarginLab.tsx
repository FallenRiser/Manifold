"use client";

import { useMemo, useRef, useState } from "react";
import { fitSVM, type Pt } from "./svmSolver";

// Drag the data, watch the maximum-margin boundary move.
//
// The boundary is not drawn by eye: every frame re-solves the soft-margin problem with the
// solver in svmSolver.ts, which scripts/svm_solver_check.mjs holds to sklearn's QP (worst
// disagreement 0.023 degrees). So the corridor this lab shades really is the widest one
// available, and the ringed points really are the ones holding it.

const W = 560;
const H = 360;
const PAD = 26;

// Data live in [-3, 3] on both axes -- the standardised space the solver was checked in.
const LO = -3;
const HI = 3;
const sx = (x: number) => PAD + ((x - LO) / (HI - LO)) * (W - 2 * PAD);
const sy = (z: number) => H - PAD - ((z - LO) / (HI - LO)) * (H - 2 * PAD);
const ux = (px: number) => LO + ((px - PAD) / (W - 2 * PAD)) * (HI - LO);
const uz = (py: number) => LO + ((H - PAD - py) / (H - 2 * PAD)) * (HI - LO);

const START: Pt[] = [
  { x: -1.9, z: 0.9, y: -1 }, { x: -1.5, z: 1.8, y: -1 }, { x: -2.3, z: -0.2, y: -1 },
  { x: -0.9, z: 1.2, y: -1 }, { x: -1.2, z: 0.1, y: -1 }, { x: -2.0, z: 1.9, y: -1 },
  { x: -0.6, z: 2.1, y: -1 },
  { x: 1.7, z: -0.8, y: 1 }, { x: 1.2, z: -1.7, y: 1 }, { x: 2.2, z: 0.2, y: 1 },
  { x: 0.8, z: -1.1, y: 1 }, { x: 1.9, z: -1.9, y: 1 }, { x: 2.4, z: -1.0, y: 1 },
  { x: 0.6, z: -2.2, y: 1 },
];

const clamp = (v: number) => Math.max(LO + 0.05, Math.min(HI - 0.05, v));

export function MarginLab() {
  const [pts, setPts] = useState<Pt[]>(START);
  const [C, setC] = useState(1);
  const [drag, setDrag] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const fit = useMemo(() => fitSVM(pts, C), [pts, C]);
  const nsv = fit.sv.filter(Boolean).length;

  // w.x + b = t, drawn across the box. Vertical-ish boundaries need the x = f(z) form, so pick
  // whichever component of w is larger and solve for the other axis.
  const lineFor = (t: number) => {
    const [w0, w1] = fit.w;
    if (Math.abs(w1) >= Math.abs(w0)) {
      if (Math.abs(w1) < 1e-9) return null;
      return {
        x1: sx(LO), y1: sy((t - fit.b - w0 * LO) / w1),
        x2: sx(HI), y2: sy((t - fit.b - w0 * HI) / w1),
      };
    }
    return {
      x1: sx((t - fit.b - w1 * LO) / w0), y1: sy(LO),
      x2: sx((t - fit.b - w1 * HI) / w0), y2: sy(HI),
    };
  };

  const mid = lineFor(0);
  const up = lineFor(1);
  const dn = lineFor(-1);

  const move = (e: React.PointerEvent) => {
    if (drag === null || !svgRef.current) return;
    const r = svgRef.current.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const py = ((e.clientY - r.top) / r.height) * H;
    setPts((old) =>
      old.map((p, i) => (i === drag ? { ...p, x: clamp(ux(px)), z: clamp(uz(py)) } : p)),
    );
  };

  const label: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, letterSpacing: "0.07em",
    textTransform: "uppercase", color: "var(--muted)",
  };
  const stat: React.CSSProperties = {
    fontSize: 20, fontVariantNumeric: "tabular-nums", color: "var(--ink)",
  };

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden",
                  background: "var(--panel)" }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", display: "block", touchAction: "none",
                 cursor: drag !== null ? "grabbing" : "default" }}
        onPointerMove={move}
        onPointerUp={() => setDrag(null)}
        onPointerLeave={() => setDrag(null)}
      >
        <rect x={0} y={0} width={W} height={H} fill="var(--canvas)" />

        {/* the corridor: the thing being maximised */}
        {up && dn && (
          <polygon
            points={`${up.x1},${up.y1} ${up.x2},${up.y2} ${dn.x2},${dn.y2} ${dn.x1},${dn.y1}`}
            fill="var(--brand)"
            opacity={0.07}
          />
        )}
        {[up, dn].map((l, i) =>
          l ? (
            <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
                  stroke="var(--muted)" strokeWidth={1.25} strokeDasharray="5 4" />
          ) : null,
        )}
        {mid && (
          <line x1={mid.x1} y1={mid.y1} x2={mid.x2} y2={mid.y2}
                stroke="var(--brand)" strokeWidth={2.25} />
        )}

        {pts.map((p, i) => {
          const colour = p.y === 1 ? "var(--c-classification)" : "var(--c-regression)";
          return (
            <g key={i} style={{ cursor: "grab" }}
               onPointerDown={(e) => { e.preventDefault(); setDrag(i); }}>
              {/* a ring means the solution is touching this point */}
              {fit.sv[i] && (
                <circle cx={sx(p.x)} cy={sy(p.z)} r={11} fill="none"
                        stroke={colour} strokeWidth={1.75} opacity={0.85} />
              )}
              <circle cx={sx(p.x)} cy={sy(p.z)} r={6.5} fill={colour}
                      stroke="var(--canvas)" strokeWidth={1.5} />
            </g>
          );
        })}
      </svg>

      <div style={{ display: "flex", gap: 22, alignItems: "center", flexWrap: "wrap",
                    padding: "12px 14px", borderTop: "1px solid var(--border)" }}>
        <div>
          <div style={label}>margin width</div>
          <div style={stat}>{fit.margin.toFixed(2)}</div>
        </div>
        <div>
          <div style={label}>support vectors</div>
          <div style={stat}>{nsv} <span style={{ fontSize: 13, color: "var(--muted)" }}>of {pts.length}</span></div>
        </div>
        <div>
          <div style={label}>mean hinge loss</div>
          <div style={stat}>{fit.hinge.toFixed(3)}</div>
        </div>

        <div style={{ flex: "1 1 190px", minWidth: 170 }}>
          <div style={{ ...label, marginBottom: 3 }}>C = {C >= 1 ? C : C.toFixed(2)}</div>
          <input
            type="range" min={-2} max={2} step={0.25}
            value={Math.log10(C)}
            onChange={(e) => setC(10 ** Number(e.target.value))}
            style={{ width: "100%", accentColor: "var(--c-classification)" }}
            aria-label="C, the softness of the margin"
          />
        </div>

        <button
          onClick={() => { setPts(START); setC(1); }}
          style={{ fontSize: 12.5, padding: "6px 11px", borderRadius: 6, cursor: "pointer",
                   border: "1px solid var(--border-strong)", background: "transparent",
                   color: "var(--ink)" }}
        >
          reset
        </button>
      </div>
    </div>
  );
}
