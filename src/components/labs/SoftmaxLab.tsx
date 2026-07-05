"use client";

import { useRef, useState } from "react";

// Multiclass logistic (softmax), real fit. Three blobs, the real multinomial
// coefficients from scripts/logit_tier2c.py (test acc 0.928). Decision regions
// come from argmax of the three linear scores; drag the query dot to read the
// three softmax probabilities, which always sum to 1 — the defining property
// that one-vs-rest lacks.
const COEF: [number, number][] = [[-1.62, -0.87], [1.76, -0.99], [-0.14, 1.86]];
const INT = [0.45, -0.47, 0.02];
const PTS: [number, number, number][] = [
  [1.41,0.8,1],[-2.77,-1.06,0],[2.55,-1.93,1],[-0.61,0.13,0],[0.13,1.14,2],[4.18,0.03,1],[1.57,-1.71,1],[1.57,-0.12,1],[0.89,4.57,2],[-1.9,-2.54,0],[2.07,-1.96,1],[-2.22,-3.04,0],[1.15,-1.62,1],[0.87,3.31,2],[-1.31,-1.06,0],[-0.93,-1.17,0],[0.76,1.54,2],[3.86,-0.59,1],[1.18,0.05,1],[1.23,3.62,2],[1.27,-4.45,1],[2.72,3.13,2],[-0.28,-1.33,0],[-2.11,0.95,0],[3.17,-1.57,1],[2.53,-2.35,1],[-2.48,0.18,0],[3.38,-1.16,1],[-0.79,-1.48,0],[0.38,1.56,2],[-3.63,-1.74,0],[-3.38,0.68,0],[4.44,-0.82,1],[2.96,-2.35,1],[-0.29,1.62,2],[-1.62,-0.15,0],[-0.17,3.24,2],[-1.39,2.95,2],[-3.24,-3.11,0],[1.64,-0.64,1],[4.89,-0.45,1],[1.27,3.25,2],[-1.37,-0.22,0],[0.05,1.85,2],[-0.68,-1.4,0],[1.98,3.6,2],[-0.09,-1.85,0],[-1.42,2.04,2],[-0.79,2.16,2],[-1.43,-1.04,0],[-2.47,-3.63,0],[-1.45,-1.66,0],[-0.15,2.23,2],[1.86,-1.57,1],[-2.71,-1.42,0],[2.22,0.49,1],[-1.28,0.16,0],[-1.54,-1.15,0]];
const CLASS_COLORS = ["var(--c-regression)", "var(--c-classification)", "var(--c-trees)"];
const CLASS_NAMES = ["A", "B", "C"];

const S = 320, PAD = 12;
const XMIN = -5, XMAX = 5.5, YMIN = -5, YMAX = 5;

function softmax(x: number, y: number) {
  const z = COEF.map(([a, b], k) => a * x + b * y + INT[k]);
  const mx = Math.max(...z);
  const ex = z.map((v) => Math.exp(v - mx));
  const s = ex.reduce((a, b) => a + b, 0);
  return ex.map((v) => v / s);
}

export function SoftmaxLab() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [q, setQ] = useState<[number, number]>([0, 0]);
  const [drag, setDrag] = useState(false);

  const xToPx = (x: number) => PAD + ((x - XMIN) / (XMAX - XMIN)) * (S - 2 * PAD);
  const yToPx = (y: number) => S - PAD - ((y - YMIN) / (YMAX - YMIN)) * (S - 2 * PAD);
  const pxToX = (px: number) => XMIN + ((px - PAD) / (S - 2 * PAD)) * (XMAX - XMIN);
  const pxToY = (py: number) => YMIN + ((S - PAD - py) / (S - 2 * PAD)) * (YMAX - YMIN);

  function moveTo(e: React.PointerEvent) {
    const svg = svgRef.current; if (!svg) return;
    const r = svg.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * S;
    const py = ((e.clientY - r.top) / r.height) * S;
    setQ([Math.max(XMIN, Math.min(XMAX, pxToX(px))), Math.max(YMIN, Math.min(YMAX, pxToY(py)))]);
  }

  const probs = softmax(q[0], q[1]);

  // decision-region tint grid
  const cells: React.ReactNode[] = [];
  const NG = 32, step = (XMAX - XMIN) / NG, stepY = (YMAX - YMIN) / NG;
  for (let i = 0; i < NG; i++) for (let j = 0; j < NG; j++) {
    const x = XMIN + (i + 0.5) * step, y = YMIN + (j + 0.5) * stepY;
    const p = softmax(x, y);
    const k = p.indexOf(Math.max(...p));
    cells.push(<rect key={`${i}-${j}`} x={xToPx(XMIN + i * step)} y={yToPx(YMIN + (j + 1) * stepY)} width={(S - 2 * PAD) / NG + 0.6} height={(S - 2 * PAD) / NG + 0.6} fill={CLASS_COLORS[k]} fillOpacity={0.05 + 0.09 * (Math.max(...p) - 0.34)} />);
  }

  return (
    <div style={frame}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6, flexWrap: "wrap", gap: 8 }}>
        <span className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
          Drag the dot — read three probabilities
        </span>
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>they always sum to 100%</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 16, alignItems: "center" }} className="elbow-grid">
        <svg ref={svgRef} viewBox={`0 0 ${S} ${S}`} style={{ width: "100%", maxWidth: 320, height: "auto", display: "block", touchAction: "none", cursor: drag ? "grabbing" : "grab" }}
          onPointerDown={(e) => { e.preventDefault(); setDrag(true); moveTo(e); }}
          onPointerMove={(e) => drag && moveTo(e)}
          onPointerUp={() => setDrag(false)}
          onPointerCancel={() => setDrag(false)}>
          <rect x={PAD} y={PAD} width={S - 2 * PAD} height={S - 2 * PAD} rx={6} fill="var(--canvas)" stroke="var(--border-strong)" />
          <g clipPath="none">{cells}</g>
          {PTS.map(([x, y, c], i) => (
            <circle key={i} cx={xToPx(x)} cy={yToPx(y)} r={4} fill={CLASS_COLORS[c]} fillOpacity={0.9} stroke="var(--surface)" strokeWidth={0.6} />
          ))}
          {/* query point */}
          <circle cx={xToPx(q[0])} cy={yToPx(q[1])} r={22} fill="transparent" />
          <circle cx={xToPx(q[0])} cy={yToPx(q[1])} r={7} fill="var(--surface)" stroke="var(--ink)" strokeWidth={2.5} pointerEvents="none" />
        </svg>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {probs.map((p, k) => (
            <div key={k} style={{ display: "grid", gridTemplateColumns: "18px 1fr 44px", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: CLASS_COLORS[k] }}>{CLASS_NAMES[k]}</span>
              <div style={{ height: 16, background: "var(--surface-2)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ width: `${p * 100}%`, height: "100%", background: CLASS_COLORS[k], borderRadius: 4, transition: "width 0.1s" }} />
              </div>
              <span style={{ fontSize: 12, color: "var(--ink)", fontFamily: "var(--font-geist-mono, monospace)", textAlign: "right" }}>{(p * 100).toFixed(0)}%</span>
            </div>
          ))}
          <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5, marginTop: 4 }}>
            Softmax turns the three linear scores into one probability distribution. Drag toward a
            cluster and its class dominates; park the dot on a three-way border and the mass splits.
            Because they share one normalizer, the three always sum to 100% — the model is forced to
            pick <em>among</em> the classes, not rate each in isolation.
          </div>
        </div>
      </div>
    </div>
  );
}

const frame: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border-strong)",
  borderRadius: 14,
  padding: "16px 16px 14px",
};
