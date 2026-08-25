"use client";

import { useEffect, useRef, useState } from "react";

// Vectors add tip-to-tail. Drag the tips of a and b; the parallelogram shows
// a + b, and the readouts give components and lengths. The whole of linear
// algebra starts here: a vector is a list of numbers you can add and scale.

const VW = 420, VH = 360, CX = 210, CY = 180, SC = 34; // px per unit
const toPx = (x: number, y: number): [number, number] => [CX + x * SC, CY - y * SC];

export function VectorLab() {
  const [a, setA] = useState<[number, number]>([3, 1]);
  const [b, setB] = useState<[number, number]>([1, 2.4]);
  const [drag, setDrag] = useState<null | "a" | "b">(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const amber = "var(--c-fundamentals)";

  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => {
      const svg = svgRef.current; if (!svg) return;
      const r = svg.getBoundingClientRect();
      const x = Math.round((((e.clientX - r.left) / r.width) * VW - CX) / SC * 2) / 2;
      const y = Math.round((CY - ((e.clientY - r.top) / r.height) * VH) / SC * 2) / 2;
      const clamp = (n: number) => Math.max(-5, Math.min(5, n));
      (drag === "a" ? setA : setB)([clamp(x), clamp(y)]);
    };
    const up = () => setDrag(null);
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, [drag]);

  const sum: [number, number] = [a[0] + b[0], a[1] + b[1]];
  const len = (v: [number, number]) => Math.hypot(v[0], v[1]);
  const arrow = (from: [number, number], to: [number, number], color: string, w: number, dash?: boolean) => {
    const [x1, y1] = toPx(...from), [x2, y2] = toPx(...to);
    return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={w} strokeDasharray={dash ? "5 4" : undefined} strokeLinecap="round" markerEnd={`url(#vah-${color === amber ? "a" : "x"})`} />;
  };

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.6rem 0" }} className="not-prose">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>Drag the vector tips</span>
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>grab ● a or ● b</span>
      </div>
      <svg ref={svgRef} viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", height: "auto", display: "block", touchAction: "none" }}>
        <defs>
          <marker id="vah-a" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L7,4 L0,8 z" fill="var(--c-fundamentals)" /></marker>
          <marker id="vah-x" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L7,4 L0,8 z" fill="var(--ink)" /></marker>
        </defs>
        <rect x={1} y={1} width={VW - 2} height={VH - 2} rx={10} fill="var(--canvas)" stroke="var(--border-strong)" />
        {[-4, -3, -2, -1, 1, 2, 3, 4].map((g) => (
          <g key={g}>
            <line x1={toPx(g, 0)[0]} y1={0} x2={toPx(g, 0)[0]} y2={VH} stroke="var(--border)" strokeWidth={0.6} />
            <line x1={0} y1={toPx(0, g)[1]} x2={VW} y2={toPx(0, g)[1]} stroke="var(--border)" strokeWidth={0.6} />
          </g>
        ))}
        <line x1={0} y1={CY} x2={VW} y2={CY} stroke="var(--border-strong)" strokeWidth={1} />
        <line x1={CX} y1={0} x2={CX} y2={VH} stroke="var(--border-strong)" strokeWidth={1} />

        {/* parallelogram guides */}
        {arrow(a, sum, "var(--faint)", 1.4, true)}
        {arrow(b, sum, "var(--faint)", 1.4, true)}
        {/* resultant */}
        {arrow([0, 0], sum, "var(--brand-2)", 2.6)}
        {/* a and b */}
        {arrow([0, 0], a, "var(--ink)", 2.6)}
        {arrow([0, 0], b, "var(--c-fundamentals)", 2.6)}

        {(["a", "b"] as const).map((id) => {
          const v = id === "a" ? a : b;
          const [px, py] = toPx(...v);
          return <g key={id}>
            <circle cx={px} cy={py} r={7} fill="var(--surface)" stroke={id === "a" ? "var(--ink)" : amber} strokeWidth={2.4} pointerEvents="none" />
            <circle cx={px} cy={py} r={22} fill="transparent" style={{ cursor: "grab" }} onPointerDown={(e) => { e.preventDefault(); setDrag(id); }} />
          </g>;
        })}
        <text x={toPx(...sum)[0] + 8} y={toPx(...sum)[1]} fontSize={12} fill="var(--brand-2)" fontWeight={600}>a+b</text>
      </svg>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
        <Metric label="a" value={`(${a[0]}, ${a[1]})`} accent="var(--ink)" mono />
        <Metric label="b" value={`(${b[0]}, ${b[1]})`} accent={amber} mono />
        <Metric label="a + b" value={`(${sum[0]}, ${sum[1]})`} accent="var(--brand-2)" mono />
        <Metric label="|a|" value={len(a).toFixed(2)} />
        <Metric label="|b|" value={len(b).toFixed(2)} />
      </div>
    </div>
  );
}

function Metric({ label, value, accent, mono }: { label: string; value: string; accent?: string; mono?: boolean }) {
  return (
    <div style={{ background: "var(--surface-2)", borderRadius: 10, padding: "6px 10px", minWidth: 64 }}>
      <div style={{ fontSize: 10.5, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 500, color: accent ?? "var(--ink)", fontFamily: mono ? "var(--font-geist-mono, monospace)" : undefined }}>{value}</div>
    </div>
  );
}
