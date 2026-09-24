"use client";

import { useMemo, useState } from "react";
import {
  angleBetween, maxMarginFit, perceptronFit, sampleWithBand, type Pt,
} from "./svmSolver";

// Two boundaries that both separate the training data, drawn against the boundary that actually
// generated it.
//
// This is the mechanism behind `size` and `band` in scripts/svm_cases.py. The procedure is the
// same -- a known true boundary, training points kept clear of a band around it, both models fit
// on exactly those points -- but the browser's RNG is not numpy's, so individual samples differ
// from the script's. The effect is what transfers, not the digits.

const W = 560;
const H = 330;
const PAD = 22;
const SPREAD = 3;
const sx = (x: number) => PAD + ((x + SPREAD) / (2 * SPREAD)) * (W - 2 * PAD);
const sy = (z: number) => H - PAD - ((z + SPREAD) / (2 * SPREAD)) * (H - 2 * PAD);

export function MarginVsTruthLab() {
  const [n, setN] = useState(24);
  const [band, setBand] = useState(0.6);
  const [seed, setSeed] = useState(7);

  const view = useMemo(() => {
    const { wt, pts } = sampleWithBand(seed, n, band, SPREAD);
    const pos = pts.filter((p) => p.y === 1).length;
    if (pos === 0 || pos === pts.length) return null;
    const mm = maxMarginFit(pts);
    const pc = perceptronFit(pts);
    return {
      wt, pts, mm, pc,
      mmErr: mm ? angleBetween(mm.w, wt) : null,
      pcErr: Math.hypot(...pc.w) > 0 ? angleBetween(pc.w, wt) : null,
    };
  }, [n, band, seed]);

  // w.x + b = 0 clipped to the box; pick the larger component so steep lines still draw.
  const lineFor = (w: [number, number], b: number) => {
    if (Math.abs(w[1]) >= Math.abs(w[0])) {
      if (Math.abs(w[1]) < 1e-12) return null;
      return { x1: sx(-SPREAD), y1: sy((-b - w[0] * -SPREAD) / w[1]),
               x2: sx(SPREAD), y2: sy((-b - w[0] * SPREAD) / w[1]) };
    }
    return { x1: sx((-b - w[1] * -SPREAD) / w[0]), y1: sy(-SPREAD),
             x2: sx((-b - w[1] * SPREAD) / w[0]), y2: sy(SPREAD) };
  };

  const truth = view ? lineFor(view.wt, 0) : null;
  const mmL = view?.mm ? lineFor(view.mm.w, view.mm.b) : null;
  const pcL = view ? lineFor(view.pc.w, view.pc.b) : null;

  const label: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, letterSpacing: "0.07em",
    textTransform: "uppercase", color: "var(--muted)",
  };
  const stat: React.CSSProperties = {
    fontSize: 19, fontVariantNumeric: "tabular-nums", color: "var(--ink)",
  };
  const key: React.CSSProperties = { fontSize: 11.5, display: "flex", alignItems: "center", gap: 6 };

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden",
                  background: "var(--panel)" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
        <rect x={0} y={0} width={W} height={H} fill="var(--canvas)" />

        {/* the band the training sample was kept clear of */}
        {view && (() => {
          const a = lineFor(view.wt, -band);
          const c = lineFor(view.wt, band);
          return a && c ? (
            <polygon points={`${a.x1},${a.y1} ${a.x2},${a.y2} ${c.x2},${c.y2} ${c.x1},${c.y1}`}
                     fill="var(--muted)" opacity={0.08} />
          ) : null;
        })()}

        {truth && (
          <line x1={truth.x1} y1={truth.y1} x2={truth.x2} y2={truth.y2}
                stroke="var(--ink)" strokeWidth={1.5} strokeDasharray="6 4" opacity={0.75} />
        )}
        {pcL && (
          <line x1={pcL.x1} y1={pcL.y1} x2={pcL.x2} y2={pcL.y2}
                stroke="var(--c-regression)" strokeWidth={2} />
        )}
        {mmL && (
          <line x1={mmL.x1} y1={mmL.y1} x2={mmL.x2} y2={mmL.y2}
                stroke="var(--c-classification)" strokeWidth={2} />
        )}

        {view?.pts.map((p, i) => (
          <circle key={i} cx={sx(p.x)} cy={sy(p.z)} r={4.5}
                  fill={p.y === 1 ? "var(--c-classification)" : "var(--c-regression)"}
                  opacity={0.55} stroke="var(--canvas)" strokeWidth={1} />
        ))}
      </svg>

      <div style={{ display: "flex", gap: 18, flexWrap: "wrap", padding: "10px 14px",
                    borderTop: "1px solid var(--border)", color: "var(--muted)" }}>
        <span style={key}>
          <svg width="22" height="4"><line x1="0" y1="2" x2="22" y2="2" stroke="var(--ink)"
            strokeWidth="1.5" strokeDasharray="6 4" /></svg> true boundary
        </span>
        <span style={key}>
          <svg width="22" height="4"><line x1="0" y1="2" x2="22" y2="2"
            stroke="var(--c-classification)" strokeWidth="2" /></svg> max-margin
        </span>
        <span style={key}>
          <svg width="22" height="4"><line x1="0" y1="2" x2="22" y2="2"
            stroke="var(--c-regression)" strokeWidth="2" /></svg> perceptron
        </span>
      </div>

      <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap",
                    padding: "12px 14px", borderTop: "1px solid var(--border)" }}>
        <div>
          <div style={label}>max-margin error</div>
          <div style={{ ...stat, color: "var(--c-classification)" }}>
            {view?.mmErr != null ? `${view.mmErr.toFixed(2)}°` : "—"}
          </div>
        </div>
        <div>
          <div style={label}>perceptron error</div>
          <div style={{ ...stat, color: "var(--c-regression)" }}>
            {view?.pcErr != null ? `${view.pcErr.toFixed(2)}°` : "—"}
          </div>
        </div>

        <div style={{ flex: "1 1 150px", minWidth: 140 }}>
          <div style={{ ...label, marginBottom: 3 }}>points = {n}</div>
          <input type="range" min={8} max={80} step={4} value={n}
                 onChange={(e) => setN(Number(e.target.value))}
                 style={{ width: "100%", accentColor: "var(--c-classification)" }}
                 aria-label="number of training points" />
        </div>
        <div style={{ flex: "1 1 150px", minWidth: 140 }}>
          <div style={{ ...label, marginBottom: 3 }}>clear band = {band.toFixed(2)}</div>
          <input type="range" min={0.05} max={1.8} step={0.05} value={band}
                 onChange={(e) => setBand(Number(e.target.value))}
                 style={{ width: "100%", accentColor: "var(--c-classification)" }}
                 aria-label="half-width of the clear band between the classes" />
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
