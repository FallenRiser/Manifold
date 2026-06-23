"use client";

import { useMemo, useRef, useState } from "react";

// The core k-NN idea, made tangible. Click anywhere to move the query point (the
// ✦). Its k nearest neighbours light up and vote; the query is coloured by the
// majority class. Change k and watch the prediction flip near the boundary.

const CLASSES = [
  { name: "A", color: "var(--c-classification)" },
  { name: "B", color: "var(--c-regression)" },
];

function mulberry32(a: number) {
  return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const r2 = (v: number) => Math.round(v * 100) / 100;

type Pt = { x: number; y: number; c: number };

function genPoints(): Pt[] {
  const rand = mulberry32(17);
  const pts: Pt[] = [];
  // class A clusters lower-left, class B upper-right, with an overlapping middle
  const blobs = [
    { cx: 32, cy: 38, c: 0 }, { cx: 30, cy: 66, c: 0 },
    { cx: 68, cy: 62, c: 1 }, { cx: 70, cy: 34, c: 1 },
  ];
  for (const b of blobs) for (let i = 0; i < 11; i++) {
    pts.push({ x: r2(b.cx + (rand() - 0.5) * 28), y: r2(b.cy + (rand() - 0.5) * 28), c: b.c });
  }
  return pts;
}

export function KNNLab() {
  const points = useMemo(() => genPoints(), []);
  const [k, setK] = useState(3);
  const [q, setQ] = useState({ x: 50, y: 50 });
  const svgRef = useRef<SVGSVGElement>(null);

  const W = 340, H = 280;
  const sx = (x: number) => r2(20 + (x / 100) * (W - 40));
  const sy = (y: number) => r2(H - 20 - (y / 100) * (H - 40));

  // k nearest to the query
  const ranked = useMemo(() => {
    return points
      .map((p, i) => ({ i, d: Math.sqrt((p.x - q.x) ** 2 + (p.y - q.y) ** 2) }))
      .sort((a, b) => a.d - b.d);
  }, [points, q]);
  const nearest = ranked.slice(0, k);
  const votes = [0, 0];
  nearest.forEach((n) => { votes[points[n.i].c]++; });
  const pred = votes[0] === votes[1] ? -1 : votes[0] > votes[1] ? 0 : 1;
  const nearestSet = new Set(nearest.map((n) => n.i));

  function onClick(e: React.MouseEvent) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const py = ((e.clientY - rect.top) / rect.height) * H;
    // invert sx/sy back to data coords, clamp to [0,100]
    const x = Math.max(0, Math.min(100, ((px - 20) / (W - 40)) * 100));
    const y = Math.max(0, Math.min(100, ((H - 20 - py) / (H - 40)) * 100));
    setQ({ x: r2(x), y: r2(y) });
  }

  const predColor = pred === -1 ? "var(--muted)" : CLASSES[pred].color;

  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        <span style={head}>Click to move the query point</span>
        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "var(--muted)" }}>k =</span>
          {[1, 3, 5, 7].map((kk) => <button key={kk} onClick={() => setK(kk)} style={chip(k === kk)}>{kk}</button>)}
        </div>
      </div>

      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} onClick={onClick} style={{ width: "100%", height: "auto", display: "block", cursor: "crosshair" }}>
        <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        {/* lines to the k nearest */}
        {nearest.map((n) => (
          <line key={"l" + n.i} x1={sx(q.x)} y1={sy(q.y)} x2={sx(points[n.i].x)} y2={sy(points[n.i].y)}
            stroke={CLASSES[points[n.i].c].color} strokeOpacity={0.45} strokeWidth={1.3} />
        ))}
        {/* data points */}
        {points.map((p, i) => (
          <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={nearestSet.has(i) ? 5.5 : 3.6}
            fill={CLASSES[p.c].color} fillOpacity={nearestSet.has(i) ? 1 : 0.5}
            stroke={nearestSet.has(i) ? "var(--ink)" : "none"} strokeWidth={1} />
        ))}
        {/* query point */}
        <circle cx={sx(q.x)} cy={sy(q.y)} r={11} fill={predColor} fillOpacity={0.18} />
        <path d={`M ${sx(q.x)} ${sy(q.y) - 7} L ${sx(q.x) + 2} ${sy(q.y) - 2} L ${sx(q.x) + 7} ${sy(q.y)} L ${sx(q.x) + 2} ${sy(q.y) + 2} L ${sx(q.x)} ${sy(q.y) + 7} L ${sx(q.x) - 2} ${sy(q.y) + 2} L ${sx(q.x) - 7} ${sy(q.y)} L ${sx(q.x) - 2} ${sy(q.y) - 2} Z`}
          fill={predColor} stroke="var(--ink)" strokeWidth={0.8} />
      </svg>

      <div style={{ display: "flex", gap: 16, margin: "10px 0 2px" }}>
        <S label="votes (A · B)" value={`${votes[0]} · ${votes[1]}`} />
        <S label="prediction" value={pred === -1 ? "tie" : `class ${CLASSES[pred].name}`} color={predColor} />
      </div>

      <div style={caption}>
        k-NN keeps no model — it just stores the data. To classify the query (✦) it finds the{" "}
        <strong>k</strong> closest stored points (highlighted) and takes a <strong>majority vote</strong>.
        Move the query near the boundary and toggle k: with k = 1 the prediction follows the single
        closest point and flips erratically; larger k smooths it by polling a wider neighbourhood.
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
function chip(active: boolean): React.CSSProperties {
  return { fontSize: 12, width: 26, height: 26, borderRadius: 6, cursor: "pointer", border: `1px solid ${active ? "var(--c-classification)" : "var(--border-strong)"}`, background: active ? "var(--c-classification)" : "transparent", color: active ? "white" : "var(--muted)" };
}
