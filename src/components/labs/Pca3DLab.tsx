"use client";

import { useEffect, useMemo, useRef, useState } from "react";

// PCA's real job, in three dimensions: a cloud that lives in 3-D but clings to a
// near-2-D plane. Rotate it to see the flatness, watch the residual sticks to the
// fitted plane (the direction PCA discards), then drag "flatten" to morph the 3-D
// cloud into the 2-D PCA scatter — the actual dimensionality reduction, animated.
//
// Faux-3-D via orthographic projection (PROJECT.md: no three.js). The 3×3
// covariance and its eigenvectors are computed live in-component with a Jacobi
// sweep, so the plane and variance readouts are honest, not hardcoded.

// 46-point cloud near a tilted plane (seed 11); already centred.
const PTS: [number, number, number][] = [
  [1.01, -1.57, -0.17], [2.13, 0.79, 1.58], [1.66, 1.02, 1.69], [-0.34, -1.04, -0.4],
  [-0.7, 1.11, -0.31], [-0.96, 0.39, -0.33], [0.82, 0.86, 0.67], [-0.01, 0.31, -0.01],
  [1.06, 1.31, 0.69], [-2.13, -2.35, -1.77], [2.3, 1.39, 1.73], [-0.17, 0.46, -0.01],
  [1.96, -1.26, 0.55], [0.02, 0.29, -0.35], [-0.21, -0.46, -0.45], [0.45, 0.85, 0.86],
  [1.65, 0.04, 0.8], [0.09, -0.07, -0.48], [-0.33, 0.08, 0.25], [1.52, -0.5, 0.8],
  [-1.62, -0.15, -0.25], [-2.07, -1.01, -1.43], [0.67, 0.67, 0.38], [-0.43, -0.8, -0.98],
  [-3.31, -0.24, -1.44], [-1.6, -0.14, -0.09], [-0.33, -0.41, -0.61], [-1.78, -0.1, -1.23],
  [-2.63, 0.22, -1.18], [-0.34, 1.68, 0.03], [2.22, -0.96, 0.77], [-0.45, 0.66, -0.19],
  [-1.13, -0.06, -0.59], [0.69, 0.01, 0.7], [1.68, -0.56, 0.7], [-0.86, 0.87, 0.08],
  [1.58, -0.86, 0.41], [1.52, 1.04, 1.21], [-0.35, 1.19, -0.56], [-0.22, -1.87, -1.21],
  [0.75, -0.18, 0.57], [1.17, -1.06, 0.07], [1.7, 0.76, 1.3], [-2.41, 0.57, -0.97],
  [-1.76, 1.34, -0.13], [-0.48, -2.21, -0.7],
];

type V3 = [number, number, number];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scale = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];

// Jacobi eigen-decomposition of a symmetric 3×3 matrix. Returns eigenvectors as
// columns, sorted by eigenvalue descending.
function jacobi(A: number[][]): { vals: number[]; vecs: V3[] } {
  const a = A.map((r) => r.slice());
  let V = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  for (let sweep = 0; sweep < 24; sweep++) {
    // largest off-diagonal
    let p = 0, q = 1, max = Math.abs(a[0][1]);
    if (Math.abs(a[0][2]) > max) { max = Math.abs(a[0][2]); p = 0; q = 2; }
    if (Math.abs(a[1][2]) > max) { max = Math.abs(a[1][2]); p = 1; q = 2; }
    if (max < 1e-12) break;
    const app = a[p][p], aqq = a[q][q], apq = a[p][q];
    const phi = 0.5 * Math.atan2(2 * apq, aqq - app);
    const c = Math.cos(phi), s = Math.sin(phi);
    for (let k = 0; k < 3; k++) {
      const akp = a[k][p], akq = a[k][q];
      a[k][p] = c * akp - s * akq;
      a[k][q] = s * akp + c * akq;
    }
    for (let k = 0; k < 3; k++) {
      const apk = a[p][k], aqk = a[q][k];
      a[p][k] = c * apk - s * aqk;
      a[q][k] = s * apk + c * aqk;
    }
    for (let k = 0; k < 3; k++) {
      const vkp = V[k][p], vkq = V[k][q];
      V[k][p] = c * vkp - s * vkq;
      V[k][q] = s * vkp + c * vkq;
    }
  }
  const vals = [a[0][0], a[1][1], a[2][2]];
  const idx = [0, 1, 2].sort((i, j) => vals[j] - vals[i]);
  return {
    vals: idx.map((i) => vals[i]),
    vecs: idx.map((i) => [V[0][i], V[1][i], V[2][i]] as V3),
  };
}

const VW = 460, VH = 420, CX = 230, CY = 206, SC = 46;

export function Pca3DLab() {
  const [az, setAz] = useState(-0.7);
  const [el, setEl] = useState(0.35);
  const [flat, setFlat] = useState(0); // 0 = 3-D, 1 = flattened to the plane
  const [drag, setDrag] = useState(false);
  const last = useRef<[number, number] | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const { pcs, vals, frac } = useMemo(() => {
    // covariance
    const C = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    for (const p of PTS) for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) C[i][j] += p[i] * p[j];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) C[i][j] /= PTS.length - 1;
    const { vals, vecs } = jacobi(C);
    const tot = vals[0] + vals[1] + vals[2];
    return { pcs: vecs, vals, frac: vals.map((v) => v / tot) };
  }, []);

  const [pc1, pc2, pc3] = pcs;

  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => {
      const l = last.current;
      if (l) { setAz((a) => a + (e.clientX - l[0]) * 0.01); setEl((v) => Math.max(-1.4, Math.min(1.4, v + (e.clientY - l[1]) * 0.01))); }
      last.current = [e.clientX, e.clientY];
    };
    const up = () => { setDrag(false); last.current = null; };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, [drag]);

  // rotate a 3-vector by the current view, return {x,y,depth}
  const view = (p: V3) => {
    const ca = Math.cos(az), sa = Math.sin(az), ce = Math.cos(el), se = Math.sin(el);
    const x1 = p[0] * ca + p[2] * sa;
    const z1 = -p[0] * sa + p[2] * ca;
    const y2 = p[1] * ce - z1 * se;
    const z2 = p[1] * se + z1 * ce;
    return { x: x1, y: y2, depth: z2 };
  };
  // screen position of a point, morphed between 3-D view and flat PCA scatter
  const screen = (p: V3) => {
    const v = view(p);
    const s3 = [CX + v.x * SC, CY - v.y * SC];
    const s1 = dot(p, pc1), s2 = dot(p, pc2);
    const s2d = [CX + s1 * SC, CY - s2 * SC];
    return [s3[0] + (s2d[0] - s3[0]) * flat, s3[1] + (s2d[1] - s3[1]) * flat, v.depth] as [number, number, number];
  };
  const f = (n: number) => n.toFixed(1);

  // plane extents from the score spread
  let A = 0, B = 0;
  for (const p of PTS) { A = Math.max(A, Math.abs(dot(p, pc1))); B = Math.max(B, Math.abs(dot(p, pc2))); }
  A *= 1.12; B *= 1.12;
  const corners: V3[] = [
    [pc1[0] * A + pc2[0] * B, pc1[1] * A + pc2[1] * B, pc1[2] * A + pc2[2] * B],
    [pc1[0] * A - pc2[0] * B, pc1[1] * A - pc2[1] * B, pc1[2] * A - pc2[2] * B],
    [-pc1[0] * A - pc2[0] * B, -pc1[1] * A - pc2[1] * B, -pc1[2] * A - pc2[2] * B],
    [-pc1[0] * A + pc2[0] * B, -pc1[1] * A + pc2[1] * B, -pc1[2] * A + pc2[2] * B],
  ];
  const cornerPts = corners.map(screen);

  const dim = "var(--c-dimred)";
  // sort points by depth so nearer ones draw on top
  const order = PTS.map((p, i) => ({ i, d: screen(p)[2] })).sort((a, b) => a.d - b.d).map((o) => o.i);

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.6rem 0" }} className="not-prose">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
          A 3-D cloud that&rsquo;s really 2-D
        </span>
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>drag to rotate ⟳</span>
      </div>

      <svg ref={svgRef} viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", height: "auto", display: "block", touchAction: "none", cursor: drag ? "grabbing" : "grab" }}
        onPointerDown={(e) => { setDrag(true); last.current = [e.clientX, e.clientY]; }}>
        <rect x={1} y={1} width={VW - 2} height={VH - 2} rx={10} fill="var(--canvas)" stroke="var(--border-strong)" />

        {/* the fitted PC1–PC2 plane */}
        <polygon points={cornerPts.map((c) => `${f(c[0])},${f(c[1])}`).join(" ")}
          fill={`color-mix(in srgb, ${dim} 12%, transparent)`} stroke={dim} strokeWidth={1.3} strokeOpacity={0.6} />

        {/* residual sticks from each point to its shadow on the plane (fade as we flatten) */}
        {flat < 0.98 && order.map((i) => {
          const p = PTS[i];
          const shadow = sub(p, scale(pc3, dot(p, pc3)));
          const a = screen(p), b = screen(shadow);
          return <line key={`r${i}`} x1={f(a[0])} y1={f(a[1])} x2={f(b[0])} y2={f(b[1])} stroke="var(--brand-3)" strokeWidth={1.2} strokeOpacity={(1 - flat) * 0.6} />;
        })}

        {/* points */}
        {order.map((i) => {
          const s = screen(PTS[i]);
          const r = 3.4 + (s[2] + 3) * 0.35; // nearer = bigger
          return <circle key={i} cx={f(s[0])} cy={f(s[1])} r={Math.max(2.6, r).toFixed(1)} fill="var(--ink)" fillOpacity={0.78} />;
        })}

        {/* PC axes from the centre */}
        {flat < 0.5 && ([[pc1, "PC1", "var(--ink)"], [pc2, "PC2", dim], [pc3, "PC3", "var(--brand-3)"]] as const).map(([v, lab, col], k) => {
          const len = k === 0 ? A : k === 1 ? B : Math.sqrt(Math.max(vals[2], 0)) * 2.4;
          const e = screen([v[0] * len, v[1] * len, v[2] * len] as V3);
          return <g key={lab} opacity={1 - flat * 2 > 0 ? 1 - flat * 2 : 0}>
            <line x1={f(screen([0, 0, 0])[0])} y1={f(screen([0, 0, 0])[1])} x2={f(e[0])} y2={f(e[1])} stroke={col} strokeWidth={2.2} />
            <text x={f(e[0])} y={f(e[1] - 5)} fontSize={11} fill={col} fontWeight={600} textAnchor="middle">{lab}</text>
          </g>;
        })}
      </svg>

      <div style={{ marginTop: 12 }}>
        <label style={{ fontSize: 12.5, color: "var(--muted)", display: "block" }}>
          flatten onto the plane (3-D → 2-D) — {Math.round(flat * 100)}%
          <input type="range" min={0} max={1} step={0.02} value={flat} onChange={(e) => setFlat(Number(e.target.value))} style={{ width: "100%", accentColor: dim, marginTop: 4 }} />
        </label>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12, alignItems: "center" }}>
        <Metric label="PC1 variance" value={`${(frac[0] * 100).toFixed(1)}%`} accent="var(--ink)" />
        <Metric label="PC2 variance" value={`${(frac[1] * 100).toFixed(1)}%`} accent={dim} />
        <Metric label="PC3 (dropped)" value={`${(frac[2] * 100).toFixed(1)}%`} accent="var(--brand-3)" />
        <Metric label="plane keeps" value={`${((frac[0] + frac[1]) * 100).toFixed(1)}%`} accent="var(--good)" />
        <div style={{ flex: 1 }} />
        <button onClick={() => { setAz(-0.7); setEl(0.35); setFlat(0); }} style={btnGhost}>Reset view</button>
      </div>
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{ background: "var(--surface-2)", borderRadius: 10, padding: "7px 11px", minWidth: 88 }}>
      <div style={{ fontSize: 10.5, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 500, color: accent ?? "var(--ink)" }}>{value}</div>
    </div>
  );
}

const btnGhost: React.CSSProperties = { background: "transparent", color: "var(--muted)", border: "1px solid var(--border-strong)", fontSize: 13, padding: "8px 12px", borderRadius: 10, cursor: "pointer" };
