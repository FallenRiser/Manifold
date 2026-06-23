"use client";

import { useMemo, useState } from "react";

// Run k-means for k = 1..8 on a fixed 4-blob dataset, plot inertia vs k, and let
// the reader pick k. The "elbow" — where the curve stops dropping steeply — is
// found automatically as the point farthest from the chord joining the endpoints.

const KMAX = 8;
const CLUSTER_COLORS = ["var(--c-regression)", "var(--c-classification)", "var(--c-trees)", "var(--c-rl)", "var(--c-clustering)", "var(--c-metrics)", "#b07", "#0a8"];
const BLOBS = [
  { cx: 26, cy: 30 }, { cx: 74, cy: 28 }, { cx: 28, cy: 74 }, { cx: 76, cy: 72 },
];

function mulberry32(a: number) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Pt = { x: number; y: number };

function genPoints(): Pt[] {
  const rand = mulberry32(11);
  const pts: Pt[] = [];
  for (const b of BLOBS) {
    for (let i = 0; i < 16; i++) pts.push({ x: b.cx + (rand() - 0.5) * 20, y: b.cy + (rand() - 0.5) * 20 });
  }
  return pts;
}

function assign(points: Pt[], C: Pt[]): number[] {
  return points.map((p) => {
    let best = 0, bd = Infinity;
    C.forEach((c, j) => { const d = (p.x - c.x) ** 2 + (p.y - c.y) ** 2; if (d < bd) { bd = d; best = j; } });
    return best;
  });
}
function update(points: Pt[], lab: number[], k: number, prev: Pt[]): Pt[] {
  return Array.from({ length: k }, (_, j) => {
    const mine = points.filter((_, i) => lab[i] === j);
    if (!mine.length) return prev[j];
    return { x: mine.reduce((s, p) => s + p.x, 0) / mine.length, y: mine.reduce((s, p) => s + p.y, 0) / mine.length };
  });
}
function ppSeed(points: Pt[], k: number, seed: number): Pt[] {
  const rand = mulberry32(seed);
  const C = [points[Math.floor(rand() * points.length)]];
  while (C.length < k) {
    const d2 = points.map((p) => Math.min(...C.map((c) => (p.x - c.x) ** 2 + (p.y - c.y) ** 2)));
    const tot = d2.reduce((s, v) => s + v, 0);
    let r = rand() * tot, idx = points.length - 1;
    for (let i = 0; i < points.length; i++) { r -= d2[i]; if (r <= 0) { idx = i; break; } }
    C.push(points[idx]);
  }
  return C.map((c) => ({ ...c }));
}
function runKMeans(points: Pt[], k: number) {
  let best: { C: Pt[]; lab: number[]; J: number } | null = null;
  for (let s = 0; s < 4; s++) {
    let C = ppSeed(points, k, 100 + s * 13 + k);
    let lab = assign(points, C);
    for (let it = 0; it < 40; it++) {
      const nc = update(points, lab, k, C);
      const nl = assign(points, nc);
      C = nc;
      if (nl.every((v, i) => v === lab[i])) { lab = nl; break; }
      lab = nl;
    }
    const J = points.reduce((s, p, i) => s + (p.x - C[lab[i]].x) ** 2 + (p.y - C[lab[i]].y) ** 2, 0);
    if (!best || J < best.J) best = { C, lab, J };
  }
  return best!;
}

export function ElbowLab() {
  const points = useMemo(() => genPoints(), []);
  const runs = useMemo(() => Array.from({ length: KMAX }, (_, i) => runKMeans(points, i + 1)), [points]);
  const inertias = runs.map((r) => r.J);

  // elbow = k whose point is farthest from the chord between (1, J1) and (KMAX, Jk)
  const elbow = useMemo(() => {
    const x1 = 1, y1 = inertias[0], x2 = KMAX, y2 = inertias[KMAX - 1];
    let bestK = 1, bestD = -1;
    for (let i = 0; i < KMAX; i++) {
      const x = i + 1, y = inertias[i];
      const d = Math.abs((y2 - y1) * x - (x2 - x1) * y + x2 * y1 - y2 * x1) / Math.hypot(y2 - y1, x2 - x1);
      if (d > bestD) { bestD = d; bestK = x; }
    }
    return bestK;
  }, [inertias]);

  const [k, setK] = useState(elbow);
  const run = runs[k - 1];

  // curve geometry
  const CW = 320, CH = 180, padL = 40, padB = 26, padT = 12;
  const maxJ = inertias[0];
  const cx = (kk: number) => Math.round((padL + ((kk - 1) / (KMAX - 1)) * (CW - padL - 10)) * 100) / 100;
  const cy = (J: number) => Math.round((padT + (1 - J / maxJ) * (CH - padT - padB)) * 100) / 100;

  // scatter geometry
  const SW = 320, SH = 180;
  const sx = (x: number) => Math.round((16 + (x / 100) * (SW - 32)) * 100) / 100;
  const sy = (y: number) => Math.round((SH - 16 - (y / 100) * (SH - 32)) * 100) / 100;

  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        <span style={head}>The elbow plot — inertia vs. k</span>
        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "var(--muted)" }}>k =</span>
          {Array.from({ length: KMAX }, (_, i) => i + 1).map((kk) => (
            <button key={kk} onClick={() => setK(kk)} style={chip(k === kk, kk === elbow)}>{kk}</button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="elbow-grid">
        {/* elbow curve */}
        <svg viewBox={`0 0 ${CW} ${CH}`} style={{ width: "100%", height: "auto", display: "block" }}>
          <rect x={0} y={0} width={CW} height={CH} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
          <line x1={cx(1)} y1={cy(inertias[0])} x2={cx(KMAX)} y2={cy(inertias[KMAX - 1])} stroke="var(--faint)" strokeWidth={1} strokeDasharray="3 3" />
          <polyline points={inertias.map((J, i) => `${cx(i + 1)},${cy(J)}`).join(" ")} fill="none" stroke="var(--c-clustering)" strokeWidth={2.2} />
          {inertias.map((J, i) => (
            <circle key={i} cx={cx(i + 1)} cy={cy(J)} r={i + 1 === k ? 5 : 3} fill={i + 1 === elbow ? "var(--good)" : "var(--c-clustering)"} stroke={i + 1 === k ? "var(--ink)" : "none"} strokeWidth={1.5} />
          ))}
          <line x1={cx(elbow)} y1={padT} x2={cx(elbow)} y2={CH - padB} stroke="var(--good)" strokeWidth={1} strokeDasharray="2 3" opacity={0.6} />
          <text x={cx(elbow)} y={padT + 8} fontSize={10} fill="var(--good)" textAnchor="middle">elbow k={elbow}</text>
          <text x={CW / 2} y={CH - 5} fontSize={10} fill="var(--faint)" textAnchor="middle">number of clusters k →</text>
          <text x={11} y={CH / 2} fontSize={10} fill="var(--faint)" textAnchor="middle" transform={`rotate(-90 11 ${CH / 2})`}>inertia</text>
        </svg>

        {/* clustering at selected k */}
        <svg viewBox={`0 0 ${SW} ${SH}`} style={{ width: "100%", height: "auto", display: "block" }}>
          <rect x={0} y={0} width={SW} height={SH} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
          {points.map((p, i) => (
            <circle key={"p" + i} cx={sx(p.x)} cy={sy(p.y)} r={3} fill={CLUSTER_COLORS[run.lab[i] % CLUSTER_COLORS.length]} fillOpacity={0.8} />
          ))}
          {run.C.map((c, j) => (
            <path key={"c" + j} d={`M ${sx(c.x) - 4} ${sy(c.y)} L ${sx(c.x) + 4} ${sy(c.y)} M ${sx(c.x)} ${sy(c.y) - 4} L ${sx(c.x)} ${sy(c.y) + 4}`} stroke={CLUSTER_COLORS[j % CLUSTER_COLORS.length]} strokeWidth={2.4} strokeLinecap="round" />
          ))}
        </svg>
      </div>

      <div style={{ display: "flex", gap: 16, margin: "10px 0 2px" }}>
        <S label="k" value={String(k)} color={k === elbow ? "var(--good)" : "var(--ink)"} />
        <S label="inertia" value={run.J.toFixed(0)} />
        <S label="drop from k−1" value={k === 1 ? "—" : `${(((inertias[k - 2] - run.J) / inertias[k - 2]) * 100).toFixed(0)}%`} />
      </div>

      <div style={caption}>
        The four blobs really want k = 4 — and that&rsquo;s exactly where the curve bends. Before the
        elbow each extra cluster slashes inertia; after it, you&rsquo;re just splitting real groups for
        tiny gains. The dashed chord finds the elbow as the farthest point from a straight line between
        the ends. Watch the &ldquo;drop from k−1&rdquo; collapse once you pass k = {elbow}.
      </div>
    </div>
  );
}

function S({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 16, color: color || "var(--ink)" }}>{value}</div>
    </div>
  );
}

const wrap: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, margin: "1.6rem 0" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)" };
const caption: React.CSSProperties = { fontSize: 12.5, color: "var(--muted)", marginTop: 14, lineHeight: 1.55 };
function chip(active: boolean, isElbow: boolean): React.CSSProperties {
  return { fontSize: 12, width: 24, height: 24, borderRadius: 6, cursor: "pointer", border: `1px solid ${active ? "var(--c-clustering)" : isElbow ? "var(--good)" : "var(--border-strong)"}`, background: active ? "var(--c-clustering)" : "transparent", color: active ? "white" : isElbow ? "var(--good)" : "var(--muted)" };
}
