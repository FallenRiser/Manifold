"use client";

import { useMemo, useState } from "react";

// For a fixed 4-blob dataset, cluster with k-means at the chosen k and draw the
// silhouette plot: every point gets a score s in [-1, 1] for how well it sits in
// its cluster vs. the nearest rival. Bars sorted within each cluster; the dashed
// line is the mean silhouette. k = 4 maximises it.

const KMAX = 6;
const COLORS = ["var(--c-regression)", "var(--c-classification)", "var(--c-trees)", "var(--c-rl)", "var(--c-clustering)", "var(--c-metrics)"];
const BLOBS = [{ cx: 26, cy: 30 }, { cx: 74, cy: 28 }, { cx: 28, cy: 74 }, { cx: 76, cy: 72 }];

function mulberry32(a: number) {
  return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
type Pt = { x: number; y: number };
function genPoints(): Pt[] {
  const rand = mulberry32(11); const pts: Pt[] = [];
  for (const b of BLOBS) for (let i = 0; i < 14; i++) pts.push({ x: b.cx + (rand() - 0.5) * 18, y: b.cy + (rand() - 0.5) * 18 });
  return pts;
}
function assign(points: Pt[], C: Pt[]): number[] {
  return points.map((p) => { let best = 0, bd = Infinity; C.forEach((c, j) => { const d = (p.x - c.x) ** 2 + (p.y - c.y) ** 2; if (d < bd) { bd = d; best = j; } }); return best; });
}
function update(points: Pt[], lab: number[], k: number, prev: Pt[]): Pt[] {
  return Array.from({ length: k }, (_, j) => { const mine = points.filter((_, i) => lab[i] === j); if (!mine.length) return prev[j]; return { x: mine.reduce((s, p) => s + p.x, 0) / mine.length, y: mine.reduce((s, p) => s + p.y, 0) / mine.length }; });
}
function ppSeed(points: Pt[], k: number, seed: number): Pt[] {
  const rand = mulberry32(seed); const C = [points[Math.floor(rand() * points.length)]];
  while (C.length < k) {
    const d2 = points.map((p) => Math.min(...C.map((c) => (p.x - c.x) ** 2 + (p.y - c.y) ** 2)));
    const tot = d2.reduce((s, v) => s + v, 0); let r = rand() * tot, idx = points.length - 1;
    for (let i = 0; i < points.length; i++) { r -= d2[i]; if (r <= 0) { idx = i; break; } } C.push(points[idx]);
  }
  return C.map((c) => ({ ...c }));
}
function cluster(points: Pt[], k: number) {
  let best: { C: Pt[]; lab: number[]; J: number } | null = null;
  for (let s = 0; s < 4; s++) {
    let C = ppSeed(points, k, 100 + s * 13 + k); let lab = assign(points, C);
    for (let it = 0; it < 40; it++) { const nc = update(points, lab, k, C); const nl = assign(points, nc); C = nc; if (nl.every((v, i) => v === lab[i])) { lab = nl; break; } lab = nl; }
    const J = points.reduce((s, p, i) => s + (p.x - C[lab[i]].x) ** 2 + (p.y - C[lab[i]].y) ** 2, 0);
    if (!best || J < best.J) best = { C, lab, J };
  }
  return best!;
}
function dist(a: Pt, b: Pt) { return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2); }

// silhouette score per point
function silhouettes(points: Pt[], lab: number[], k: number): number[] {
  return points.map((p, i) => {
    const own = lab[i];
    const meanTo = (cl: number) => {
      const members = points.filter((_, j) => lab[j] === cl && j !== i);
      if (!members.length) return 0;
      return members.reduce((s, q) => s + dist(p, q), 0) / members.length;
    };
    const a = meanTo(own);
    let b = Infinity;
    for (let cl = 0; cl < k; cl++) if (cl !== own) { const m = meanTo(cl); if (m < b) b = m; }
    if (Math.max(a, b) === 0) return 0;
    return (b - a) / Math.max(a, b);
  });
}

export function SilhouetteLab() {
  const points = useMemo(() => genPoints(), []);
  const meanByK = useMemo(() => Array.from({ length: KMAX }, (_, i) => {
    const k = i + 1; if (k === 1) return 0;
    const { lab } = cluster(points, k); const s = silhouettes(points, lab, k);
    return s.reduce((a, b) => a + b, 0) / s.length;
  }), [points]);
  const bestK = meanByK.indexOf(Math.max(...meanByK)) + 1;
  const [k, setK] = useState(bestK);

  const { lab } = useMemo(() => cluster(points, Math.max(2, k)), [points, k]);
  const sil = useMemo(() => silhouettes(points, lab, Math.max(2, k)), [points, lab, k]);
  const meanSil = sil.reduce((a, b) => a + b, 0) / sil.length;

  // order points by cluster then by descending silhouette for the bar plot
  const order = useMemo(() => points.map((_, i) => i).sort((a, b) => lab[a] - lab[b] || sil[b] - sil[a]), [points, lab, sil]);

  const W = 320, H = 200, padL = 30, padR = 10, padT = 10, padB = 10;
  const bw = (W - padL - padR) / order.length;
  const zero = padL + (0 - -0.4) / (1 - -0.4) * (W - padL - padR);
  const sxScore = (s: number) => Math.round((padL + (s - -0.4) / (1 - -0.4) * (W - padL - padR)) * 100) / 100;
  const by = (idx: number) => Math.round((padT + (idx / order.length) * (H - padT - padB)) * 100) / 100;

  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        <span style={head}>Silhouette plot</span>
        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "var(--muted)" }}>k =</span>
          {Array.from({ length: KMAX - 1 }, (_, i) => i + 2).map((kk) => (
            <button key={kk} onClick={() => setK(kk)} style={chip(k === kk, kk === bestK)}>{kk}</button>
          ))}
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        {/* zero baseline */}
        <line x1={zero} y1={padT} x2={zero} y2={H - padB} stroke="var(--faint)" strokeWidth={1} />
        {/* silhouette bars */}
        {order.map((pi, idx) => {
          const s = sil[pi]; const x0 = Math.min(zero, sxScore(s)); const w = Math.abs(sxScore(s) - zero);
          return <rect key={idx} x={x0} y={by(idx)} width={w} height={Math.max(0.5, (H - padT - padB) / order.length - 0.4)} fill={COLORS[lab[pi] % COLORS.length]} fillOpacity={s < 0 ? 0.4 : 0.8} />;
        })}
        {/* mean line */}
        <line x1={sxScore(meanSil)} y1={padT} x2={sxScore(meanSil)} y2={H - padB} stroke="var(--ink)" strokeWidth={1.4} strokeDasharray="4 3" />
        <text x={sxScore(meanSil)} y={padT + 9} fontSize={10} fill="var(--ink)" textAnchor="middle">mean {meanSil.toFixed(2)}</text>
        <text x={padL} y={H - 1} fontSize={9} fill="var(--faint)">−0.4</text>
        <text x={W - padR} y={H - 1} fontSize={9} fill="var(--faint)" textAnchor="end">+1</text>
      </svg>

      <div style={{ display: "flex", gap: 16, margin: "10px 0 2px" }}>
        <S label="k" value={String(k)} color={k === bestK ? "var(--good)" : "var(--ink)"} />
        <S label="mean silhouette" value={meanSil.toFixed(3)} color={k === bestK ? "var(--good)" : "var(--ink)"} />
        <S label="best k" value={String(bestK)} color="var(--good)" />
      </div>

      <div style={caption}>
        Each bar is one point&rsquo;s silhouette: how much closer it sits to its own cluster than to the
        nearest rival, on a scale from −1 (wrong cluster) through 0 (on the border) to +1 (snug). Wide,
        uniform bars across all clusters mean a clean fit. The mean (dashed) peaks at k = {bestK} — and
        wrong values of k leave you ragged, short, or even negative bars.
      </div>
    </div>
  );
}

function S({ label, value, color }: { label: string; value: string; color?: string }) {
  return (<div><div style={{ fontSize: 11, color: "var(--muted)" }}>{label}</div><div style={{ fontFamily: "ui-monospace, monospace", fontSize: 16, color: color || "var(--ink)" }}>{value}</div></div>);
}
const wrap: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, margin: "1.6rem 0" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)" };
const caption: React.CSSProperties = { fontSize: 12.5, color: "var(--muted)", marginTop: 14, lineHeight: 1.55 };
function chip(active: boolean, isBest: boolean): React.CSSProperties {
  return { fontSize: 12, width: 24, height: 24, borderRadius: 6, cursor: "pointer", border: `1px solid ${active ? "var(--c-clustering)" : isBest ? "var(--good)" : "var(--border-strong)"}`, background: active ? "var(--c-clustering)" : "transparent", color: active ? "white" : isBest ? "var(--good)" : "var(--muted)" };
}
