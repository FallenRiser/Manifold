"use client";

import { useMemo, useState } from "react";
import {
  TINY_OPT, TINY_P_STAR, tinyLagrangian,
} from "./svmSolver";

// What a Lagrange multiplier is, on a problem small enough to see all of:
//
//     minimise (1/2)(x^2 + y^2)   subject to   x + y >= 2   and   x >= 0.5
//
// Charge a price for each constraint instead of forbidding its violation, and the constrained
// problem becomes an unconstrained one whose minimum is a LOWER BOUND on the real answer. Slide
// the first price up and the dot walks out from the origin; at exactly 1 it lands on the real
// optimum and the bound touches it. Past that it overshoots and the bound falls away again.
//
// The second price only ever costs you, because its constraint is not binding at the optimum.
// That is complementary slackness, and it is the whole reason most training points in an SVM
// have a price of zero.
//
// Closed form, no solver: L is strictly convex in (x, y), so its minimiser is -G' lam exactly.
// Held to Python by scripts/svm_dualitylab_check.mjs; reproduced by
// `python scripts/svm_cases.py lagrangian`.

const W = 560;
const PANEL = 292;
const PAD = 26;
const PLOT = PANEL - 2 * PAD;
const GAP = 16;
const H = 352;
const LO = -0.4;
const HI = 3.0;
const L1MAX = 2;
const L2MAX = 0.6;
const GLO = -1.2;
const GHI = 1.2;

const r3 = (v: number) => Math.round(v * 1000) / 1000;
const ax = (x: number) => r3(PAD + ((x - LO) / (HI - LO)) * PLOT);
const ay = (y: number) => r3(PANEL - PAD - ((y - LO) / (HI - LO)) * PLOT);
const DX = PANEL + GAP;
const gx = (l: number) => r3(DX + (l / L1MAX) * PLOT);
const gy = (v: number) => r3(PANEL - PAD - ((v - GLO) / (GHI - GLO)) * PLOT);

export function DualityLab() {
  const [l1, setL1] = useState(0.4);
  const [l2, setL2] = useState(0);

  const now = useMemo(() => tinyLagrangian([l1, l2]), [l1, l2]);
  const curve = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i <= 120; i++) {
      const t = (i / 120) * L1MAX;
      pts.push(`${gx(t)},${gy(tinyLagrangian([t, l2]).g)}`);
    }
    return pts.join(" ");
  }, [l2]);

  const gapNow = TINY_P_STAR - now.g;

  const label: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, letterSpacing: "0.07em",
    textTransform: "uppercase", color: "var(--muted)",
  };
  const stat: React.CSSProperties = {
    fontSize: 19, fontVariantNumeric: "tabular-nums", color: "var(--ink)",
  };

  // Level sets of the objective. 1 is the optimum's level, so it gets drawn differently: every
  // circle inside it is cheaper than the answer and every one of them misses the feasible set.
  const levels = [0.125, 0.5, TINY_P_STAR, 2, 3.5];

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden",
                  background: "var(--panel)" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
        <rect x={0} y={0} width={W} height={H} fill="var(--canvas)" />
        <defs>
          <clipPath id="dualclipA">
            <rect x={PAD} y={PAD} width={PLOT} height={PLOT} />
          </clipPath>
          <clipPath id="dualclipB">
            <rect x={DX} y={PAD} width={PLOT} height={PLOT} />
          </clipPath>
        </defs>

        <g clipPath="url(#dualclipA)">
          {/* everything the constraints rule out */}
          <polygon points={`${ax(LO)},${ay(LO)} ${ax(HI)},${ay(LO)} ${ax(LO)},${ay(HI)}`}
                   fill="var(--ink)" opacity={0.07} />
          <rect x={ax(LO)} y={ay(HI)} width={r3(ax(0.5) - ax(LO))} height={PLOT}
                fill="var(--ink)" opacity={0.07} />
          <line x1={ax(LO)} y1={ay(2 - LO)} x2={ax(HI)} y2={ay(2 - HI)}
                stroke="var(--muted)" strokeWidth={1.3} />
          <line x1={ax(0.5)} y1={ay(LO)} x2={ax(0.5)} y2={ay(HI)}
                stroke="var(--muted)" strokeWidth={1.3} strokeDasharray="4 4" />

          {levels.map((c) => (
            <circle key={c} cx={ax(0)} cy={ay(0)}
                    r={r3((Math.sqrt(2 * c) / (HI - LO)) * PLOT)}
                    fill="none" stroke="var(--c-classification)"
                    strokeWidth={c === TINY_P_STAR ? 1.9 : 1}
                    opacity={c === TINY_P_STAR ? 0.95 : 0.34} />
          ))}

          {/* where the priced problem actually bottoms out, and where the real answer is */}
          <line x1={ax(0)} y1={ay(0)} x2={ax(now.u[0])} y2={ay(now.u[1])}
                stroke="var(--ink)" strokeWidth={1} opacity={0.35} strokeDasharray="3 3" />
          <circle cx={ax(TINY_OPT[0])} cy={ay(TINY_OPT[1])} r={7} fill="none"
                  stroke="var(--ink)" strokeWidth={1.8} />
          <circle cx={ax(now.u[0])} cy={ay(now.u[1])} r={5}
                  fill={now.feasible ? "var(--c-classification)" : "var(--c-regression)"} />
        </g>
        <rect x={PAD} y={PAD} width={PLOT} height={PLOT} fill="none"
              stroke="var(--border-strong)" strokeWidth={1} />
        <text x={PAD} y={PAD - 8} style={{ fontSize: 11, fill: "var(--muted)" }}>
          where the priced problem bottoms out
        </text>

        <g clipPath="url(#dualclipB)">
          <line x1={DX} y1={gy(TINY_P_STAR)} x2={r3(DX + PLOT)} y2={gy(TINY_P_STAR)}
                stroke="var(--ink)" strokeWidth={1.2} strokeDasharray="5 4" opacity={0.75} />
          <polyline points={curve} fill="none" stroke="var(--c-classification)"
                    strokeWidth={2.1} />
          <line x1={gx(l1)} y1={PAD} x2={gx(l1)} y2={r3(PANEL - PAD)}
                stroke="var(--muted)" strokeWidth={1} opacity={0.5} />
          <circle cx={gx(l1)} cy={gy(now.g)} r={5} fill="var(--c-classification)" />
        </g>
        <rect x={DX} y={PAD} width={PLOT} height={PLOT} fill="none"
              stroke="var(--border-strong)" strokeWidth={1} />
        <text x={DX} y={PAD - 8} style={{ fontSize: 11, fill: "var(--muted)" }}>
          the bound it gives, against the first price
        </text>
        <text x={r3(DX + PLOT - 4)} y={r3(gy(TINY_P_STAR) - 6)} textAnchor="end"
              style={{ fontSize: 10.5, fill: "var(--muted)" }}>
          the answer, {TINY_P_STAR.toFixed(2)}
        </text>

        <text x={PAD} y={PANEL + 22} style={{ fontSize: 11, fill: "var(--muted)" }}>
          {gapNow < 1e-9
            ? "the bound has caught the answer — these are the prices the constraints are worth"
            : now.feasible
              ? "the charge has pushed the minimum clear past the boundary — too high, and the bound drops"
              : "the charge is too small to push the minimum into the allowed region, so it reports low"}
        </text>
        <text x={PAD} y={PANEL + 37} style={{ fontSize: 11, fill: "var(--muted)" }}>
          {l2 > 1e-9
            ? "the second price is above zero and the bound is worse for it — that constraint is not binding"
            : "the second constraint is met with room to spare, and its price is zero"}
        </text>
      </svg>

      <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap",
                    padding: "12px 14px", borderTop: "1px solid var(--border)" }}>
        <div>
          <div style={label}>price on x + y ≥ 2</div>
          <input type="range" min={0} max={L1MAX} step={0.01} value={l1}
                 onChange={(e) => setL1(Number(e.target.value))}
                 style={{ width: 128, accentColor: "var(--c-classification)" }} />
          <div style={{ ...stat, fontSize: 15 }}>{l1.toFixed(2)}</div>
        </div>
        <div>
          <div style={label}>price on x ≥ 0.5</div>
          <input type="range" min={0} max={L2MAX} step={0.01} value={l2}
                 onChange={(e) => setL2(Number(e.target.value))}
                 style={{ width: 128, accentColor: "var(--c-classification)" }} />
          <div style={{ ...stat, fontSize: 15 }}>{l2.toFixed(2)}</div>
        </div>
        <div>
          <div style={label}>the bound</div>
          <div style={stat}>{now.g.toFixed(4)}</div>
        </div>
        <div>
          <div style={label}>short by</div>
          <div style={{ ...stat, color: gapNow < 1e-9 ? "var(--c-classification)" : "var(--ink)" }}>
            {gapNow < 1e-9 ? "nothing" : gapNow.toFixed(4)}
          </div>
        </div>
        <button
          onClick={() => { setL1(1); setL2(0); }}
          style={{ fontSize: 12.5, padding: "6px 11px", borderRadius: 6, cursor: "pointer",
                   border: "1px solid var(--border-strong)", background: "transparent",
                   color: "var(--ink)", marginLeft: "auto" }}
        >
          best prices
        </button>
      </div>
    </div>
  );
}
