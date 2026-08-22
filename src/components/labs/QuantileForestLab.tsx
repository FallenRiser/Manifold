"use client";

import { useEffect, useMemo, useState } from "react";

// A quantile regression forest on 1-D data. An ordinary forest predicts the mean
// of the training targets that land in each leaf; a QUANTILE forest keeps the
// whole set of those targets, pools them across all trees for a query point, and
// reads off percentiles — giving a prediction interval, not just a point. The
// data here is heteroscedastic (noise grows to the right), so the band visibly
// widens where the world is genuinely less certain. Drag the interval level to
// trade coverage for width.
//
// Forest built once on mount (deterministic), band recomputed per level; the
// heavy/mount-gated compute keeps SSR trivial.

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function randn(r: () => number) {
  return (r() + r() + r() + r() - 2) * 0.7; // ~N(0,1)-ish
}

type P = { x: number; y: number };
type Node = { leaf: boolean; ys: number[]; f?: number; thr?: number; L?: Node; R?: Node };

const DATA: P[] = (() => {
  const r = mulberry32(31);
  const pts: P[] = [];
  for (let i = 0; i < 90; i++) {
    const x = r();
    const sd = 0.04 + 0.34 * x; // heteroscedastic: noisier to the right
    pts.push({ x, y: 0.5 + 0.28 * Math.sin(2 * Math.PI * 0.8 * x) + sd * randn(r) });
  }
  return pts;
})();

function sse(pts: P[]) {
  if (!pts.length) return 0;
  const m = pts.reduce((s, p) => s + p.y, 0) / pts.length;
  return pts.reduce((s, p) => s + (p.y - m) ** 2, 0);
}
function grow(pts: P[], d: number): Node {
  if (d >= 5 || pts.length < 6) return { leaf: true, ys: pts.map((p) => p.y) };
  const xs = [...new Set(pts.map((p) => p.x))].sort((a, b) => a - b);
  let bt: number | null = null, bs = sse(pts);
  for (let i = 0; i < xs.length - 1; i++) {
    const t = (xs[i] + xs[i + 1]) / 2;
    const L = pts.filter((p) => p.x <= t), R = pts.filter((p) => p.x > t);
    if (L.length < 3 || R.length < 3) continue;
    const s = sse(L) + sse(R);
    if (s < bs - 1e-9) { bs = s; bt = t; }
  }
  if (bt == null) return { leaf: true, ys: pts.map((p) => p.y) };
  return { leaf: false, ys: [], thr: bt, L: grow(pts.filter((p) => p.x <= bt!), d + 1), R: grow(pts.filter((p) => p.x > bt!), d + 1) };
}
function leafYs(n: Node, x: number): number[] {
  let c = n;
  while (!c.leaf) c = x <= c.thr! ? c.L! : c.R!;
  return c.ys;
}
function boot(pts: P[], r: () => number) {
  const o: P[] = [];
  for (let i = 0; i < pts.length; i++) o.push(pts[Math.floor(r() * pts.length)]);
  return o;
}
function quantile(sorted: number[], q: number) {
  if (!sorted.length) return 0;
  const i = q * (sorted.length - 1);
  const lo = Math.floor(i), hi = Math.ceil(i);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}

const FOREST: Node[] = (() => {
  const r = mulberry32(808);
  const trees: Node[] = [];
  for (let b = 0; b < 30; b++) trees.push(grow(boot(DATA, r), 0));
  return trees;
})();

const GX = Array.from({ length: 60 }, (_, i) => i / 59);

const W = 400, H = 260, PAD = 24;
const f = (n: number) => Math.round(n * 100) / 100;
const px = (x: number) => f(PAD + x * (W - 2 * PAD));
const py = (y: number) => f(H - PAD - ((y - -0.2) / 1.4) * (H - 2 * PAD));

const LEVELS: Record<string, [number, number, string]> = {
  "50%": [0.25, 0.75, "50% interval"],
  "80%": [0.1, 0.9, "80% interval"],
  "90%": [0.05, 0.95, "90% interval"],
};

export function QuantileForestLab() {
  const [level, setLevel] = useState<keyof typeof LEVELS>("80%");
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  const pooled = useMemo(() => GX.map((x) => {
    const ys: number[] = [];
    for (const t of FOREST) for (const v of leafYs(t, x)) ys.push(v);
    ys.sort((a, b) => a - b);
    return ys;
  }), []);

  const [ql, qh] = LEVELS[level];
  const band = pooled.map((ys, i) => ({ x: GX[i], lo: quantile(ys, ql), mid: quantile(ys, 0.5), hi: quantile(ys, qh) }));
  const cover = DATA.reduce((s, p) => {
    const i = Math.round(p.x * 59);
    return s + (p.y >= band[i].lo && p.y <= band[i].hi ? 1 : 0);
  }, 0) / DATA.length;

  const areaPath = `M ${band.map((b) => `${px(b.x)} ${py(b.hi)}`).join(" L ")} L ${[...band].reverse().map((b) => `${px(b.x)} ${py(b.lo)}`).join(" L ")} Z`;

  return (
    <div style={{ background: "var(--canvas)", border: "1px solid var(--border-strong)", borderRadius: 14, padding: "16px 16px 14px" }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Quantile regression forest prediction interval that widens where data is noisier">
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="var(--border-strong)" strokeWidth={1} />
        {ready && <path d={areaPath} fill="var(--c-trees)" fillOpacity={0.15} stroke="none" />}
        {DATA.map((p, i) => <circle key={i} cx={px(p.x)} cy={py(p.y)} r={2.6} fill="var(--muted)" opacity={0.7} />)}
        {ready && <polyline points={band.map((b) => `${px(b.x)},${py(b.mid)}`).join(" ")} fill="none" stroke="var(--c-trees)" strokeWidth={2} />}
        <text x={W - PAD} y={H - 8} fontSize={10} textAnchor="end" fill="var(--faint)">feature x  (noise grows →)</text>
      </svg>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", marginTop: 10 }}>
        <div style={{ display: "inline-flex", gap: 6 }}>
          {(Object.keys(LEVELS) as (keyof typeof LEVELS)[]).map((k) => (
            <button key={k} onClick={() => setLevel(k)}
              style={{ fontSize: 12.5, padding: "5px 11px", borderRadius: 999, border: `1px solid ${level === k ? "var(--c-trees)" : "var(--border-strong)"}`, background: level === k ? "color-mix(in srgb, var(--c-trees) 12%, var(--surface))" : "var(--surface)", color: level === k ? "var(--c-trees)" : "var(--muted)", cursor: "pointer", fontWeight: level === k ? 500 : 400 }}>
              {k}
            </button>
          ))}
        </div>
        {ready && (
          <div style={{ fontSize: 13, color: "var(--muted)" }}>
            empirical coverage <strong style={{ color: "var(--c-trees)" }}>{(cover * 100).toFixed(0)}%</strong>
          </div>
        )}
      </div>
      <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.55, marginTop: 8 }}>
        The shaded band is the forest&rsquo;s prediction interval; the line is its median. Notice it&rsquo;s{" "}
        <strong>tight on the left and flares to the right</strong> — the forest reports more uncertainty exactly
        where the data is noisier.
      </p>
    </div>
  );
}
