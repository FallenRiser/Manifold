"use client";

import { useRef, useState } from "react";

// Drag a split threshold across a 1-D strip of two-class points and watch the
// impurity bookkeeping that a tree does at every node: the Gini of each side,
// the count-weighted child impurity, and the information gain (parent impurity
// minus that). "Snap to best" scans every candidate split and jumps to the one
// with the largest gain — the exact choice CART makes. One cause (threshold),
// the visible effect (the two child groups), one headline readout (gain).
//
// Data + geometry are fixed constants and every coordinate is rounded, so SSR
// and client match; the threshold starts at a fixed value, so first paint is
// deterministic.

type P = { x: number; c: 0 | 1 };

const DATA: P[] = [
  { x: 0.06, c: 0 }, { x: 0.13, c: 0 }, { x: 0.19, c: 0 }, { x: 0.27, c: 0 },
  { x: 0.33, c: 1 }, { x: 0.39, c: 0 }, { x: 0.46, c: 0 }, { x: 0.52, c: 1 },
  { x: 0.58, c: 0 }, { x: 0.63, c: 1 }, { x: 0.69, c: 1 }, { x: 0.75, c: 1 },
  { x: 0.81, c: 1 }, { x: 0.87, c: 1 }, { x: 0.93, c: 1 },
];

const CLASS_COLOR = ["var(--c-regression)", "var(--c-classification)"];

function gini(pts: P[]): number {
  if (pts.length === 0) return 0;
  const p1 = pts.reduce((s, p) => s + p.c, 0) / pts.length;
  return 1 - p1 * p1 - (1 - p1) * (1 - p1);
}
function counts(pts: P[]): [number, number] {
  let b = 0;
  for (const p of pts) b += p.c;
  return [pts.length - b, b];
}

const CANDIDATES = (() => {
  const xs = [...DATA].map((p) => p.x).sort((a, b) => a - b);
  const c: number[] = [];
  for (let i = 0; i < xs.length - 1; i++) c.push((xs[i] + xs[i + 1]) / 2);
  return c;
})();

const PARENT = gini(DATA);

function bestThreshold(): number {
  let best = CANDIDATES[0];
  let bestGain = -1;
  for (const t of CANDIDATES) {
    const L = DATA.filter((p) => p.x <= t);
    const R = DATA.filter((p) => p.x > t);
    const gain = PARENT - (gini(L) * L.length + gini(R) * R.length) / DATA.length;
    if (gain > bestGain) {
      bestGain = gain;
      best = t;
    }
  }
  return best;
}

const W = 380;
const H = 120;
const PAD = 16;
const f = (n: number) => Math.round(n * 100) / 100;
const px = (x: number) => f(PAD + x * (W - 2 * PAD));
const yFor = (i: number) => f(H / 2 - 26 + (i % 3) * 20); // gentle stagger to separate dots

export function ImpurityLab() {
  const [thr, setThr] = useState(0.5);
  const svgRef = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState(false);

  const setFromClientX = (clientX: number) => {
    const svg = svgRef.current;
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    const xNorm = (clientX - r.left) / r.width; // viewBox maps 1:1 to width
    const x = ((xNorm * W) - PAD) / (W - 2 * PAD);
    setThr(Math.max(0.02, Math.min(0.98, x)));
  };

  const L = DATA.filter((p) => p.x <= thr);
  const R = DATA.filter((p) => p.x > thr);
  const gL = gini(L);
  const gR = gini(R);
  const weighted = (gL * L.length + gR * R.length) / DATA.length;
  const gain = PARENT - weighted;
  const [lA, lB] = counts(L);
  const [rA, rB] = counts(R);
  const best = bestThreshold();
  const atBest = Math.abs(thr - best) < 0.02;

  return (
    <div style={{ background: "var(--canvas)", border: "1px solid var(--border-strong)", borderRadius: 14, padding: "16px 16px 14px" }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ maxWidth: 460, display: "block", margin: "0 auto", touchAction: "none", cursor: "ew-resize" }}
        role="img"
        aria-label="One-dimensional two-class data with a draggable split threshold"
        onPointerDown={(e) => {
          setDrag(true);
          (e.target as Element).setPointerCapture?.(e.pointerId);
          setFromClientX(e.clientX);
        }}
        onPointerMove={(e) => drag && setFromClientX(e.clientX)}
        onPointerUp={() => setDrag(false)}
      >
        {/* shaded sides */}
        <rect x={px(0)} y={16} width={f(px(thr) - px(0))} height={H - 40} fill={CLASS_COLOR[0]} fillOpacity={0.06} />
        <rect x={px(thr)} y={16} width={f(px(1) - px(thr))} height={H - 40} fill={CLASS_COLOR[1]} fillOpacity={0.06} />
        {/* baseline */}
        <line x1={px(0)} y1={H - 24} x2={px(1)} y2={H - 24} stroke="var(--border-strong)" strokeWidth={1} />
        {/* points */}
        {DATA.map((p, i) => (
          <circle key={i} cx={px(p.x)} cy={yFor(i)} r={5} fill={CLASS_COLOR[p.c]} stroke="var(--surface)" strokeWidth={1.2} />
        ))}
        {/* best-split marker */}
        <line x1={px(best)} y1={12} x2={px(best)} y2={H - 24} stroke="var(--good)" strokeWidth={1} strokeDasharray="3 3" opacity={0.55} />
        {/* threshold */}
        <line x1={px(thr)} y1={8} x2={px(thr)} y2={H - 18} stroke="var(--ink)" strokeWidth={2} />
        <circle cx={px(thr)} cy={8} r={5.5} fill="var(--ink)" />
        <rect x={px(thr) - 22} y={8} width={44} height={44} fill="transparent" style={{ cursor: "ew-resize" }} />
      </svg>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 10, alignItems: "stretch" }}>
        <Side title="Left group" a={lA} b={lB} g={gL} />
        <Side title="Right group" a={rA} b={rB} g={gR} />
        <div style={{ flex: "1 1 150px", minWidth: 150, display: "flex", flexDirection: "column", justifyContent: "center", gap: 6, padding: "10px 12px", borderRadius: 10, border: `1px solid color-mix(in srgb, var(--c-trees) 30%, var(--border))`, background: "color-mix(in srgb, var(--c-trees) 6%, var(--surface))" }}>
          <div style={{ fontSize: 11.5, color: "var(--muted)" }}>Parent Gini {PARENT.toFixed(3)} · weighted child {weighted.toFixed(3)}</div>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <span className="font-display" style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--c-trees)" }}>Info gain</span>
            <span className="font-display" style={{ fontSize: 22, fontWeight: 600, color: "var(--ink)" }}>{gain.toFixed(3)}</span>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
        <button
          onClick={() => setThr(best)}
          style={{ fontSize: 13, fontWeight: 500, padding: "6px 13px", borderRadius: 10, border: "1px solid var(--c-trees)", background: atBest ? "color-mix(in srgb, var(--c-trees) 12%, var(--surface))" : "var(--surface)", color: "var(--c-trees)", cursor: "pointer" }}
        >
          Snap to best split
        </button>
        <span style={{ fontSize: 12.5, color: atBest ? "var(--good)" : "var(--muted)" }}>
          {atBest ? "✓ This is the split that maximises gain." : "Green dashes mark the best split. Try to beat it by hand."}
        </span>
      </div>
    </div>
  );
}

function Side({ title, a, b, g }: { title: string; a: number; b: number; g: number }) {
  return (
    <div style={{ flex: "1 1 130px", minWidth: 130, padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)" }}>
      <div style={{ fontSize: 11.5, color: "var(--muted)", marginBottom: 5 }}>{title}</div>
      <div style={{ display: "flex", gap: 10, fontSize: 13, marginBottom: 4 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Dot c={0} />{a}</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Dot c={1} />{b}</span>
      </div>
      <div style={{ fontSize: 12.5, color: "var(--ink)" }}>Gini <strong>{g.toFixed(3)}</strong></div>
    </div>
  );
}
function Dot({ c }: { c: 0 | 1 }) {
  return <span style={{ width: 9, height: 9, borderRadius: 999, background: CLASS_COLOR[c], display: "inline-block" }} />;
}
