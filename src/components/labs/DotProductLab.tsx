"use client";

import { useEffect, useRef, useState } from "react";

// The dot product measures alignment. Drag b around fixed a: a·b is positive
// when they point the same way, zero when perpendicular, negative when opposed.
// The projection of b onto a — the shadow b casts on a's line — is (a·b/‖a‖),
// the quantity PCA maximises and least squares minimises.

const VW = 400, VH = 360, CX = 160, CY = 200, SC = 40;
const toPx = (x: number, y: number): [number, number] => [CX + x * SC, CY - y * SC];

export function DotProductLab() {
  const a: [number, number] = [3, 0.6];
  const [b, setB] = useState<[number, number]>([1.3, 2.2]);
  const [drag, setDrag] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const amber = "var(--c-fundamentals)";

  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => {
      const svg = svgRef.current; if (!svg) return;
      const r = svg.getBoundingClientRect();
      const x = (((e.clientX - r.left) / r.width) * VW - CX) / SC;
      const y = (CY - ((e.clientY - r.top) / r.height) * VH) / SC;
      setB([Math.max(-4, Math.min(5, x)), Math.max(-3, Math.min(3.5, y))]);
    };
    const up = () => setDrag(false);
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, [drag]);

  const dot = a[0] * b[0] + a[1] * b[1];
  const la = Math.hypot(a[0], a[1]), lb = Math.hypot(b[0], b[1]);
  const cos = dot / (la * lb || 1);
  const ang = (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
  const scalarProj = dot / la; // length of b's shadow on a
  const ua: [number, number] = [a[0] / la, a[1] / la];
  const foot: [number, number] = [ua[0] * scalarProj, ua[1] * scalarProj];
  const f = (n: number) => n.toFixed(1);

  const [ax, ay] = toPx(...a), [bx, by] = toPx(...b), [fx, fy] = toPx(...foot);

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.6rem 0" }} className="not-prose">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>Drag b — watch a·b and the shadow</span>
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>grab ● b</span>
      </div>
      <svg ref={svgRef} viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", height: "auto", display: "block", touchAction: "none" }}>
        <defs><marker id="dp-a" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L7,4 L0,8 z" fill="var(--ink)" /></marker>
          <marker id="dp-b" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L7,4 L0,8 z" fill="var(--c-fundamentals)" /></marker></defs>
        <rect x={1} y={1} width={VW - 2} height={VH - 2} rx={10} fill="var(--canvas)" stroke="var(--border-strong)" />
        <line x1={0} y1={CY} x2={VW} y2={CY} stroke="var(--border)" strokeWidth={1} />
        <line x1={CX} y1={0} x2={CX} y2={VH} stroke="var(--border)" strokeWidth={1} />
        {/* a's infinite line */}
        <line x1={f(CX - ua[0] * 400)} y1={f(CY + ua[1] * 400)} x2={f(CX + ua[0] * 400)} y2={f(CY - ua[1] * 400)} stroke="var(--border-strong)" strokeWidth={1} strokeDasharray="4 4" />
        {/* projection: dashed drop from b to foot, and the shadow along a */}
        <line x1={bx} y1={by} x2={fx} y2={fy} stroke="var(--faint)" strokeWidth={1.4} strokeDasharray="3 3" />
        <line x1={CX} y1={CY} x2={fx} y2={fy} stroke="var(--brand-2)" strokeWidth={5} strokeOpacity={0.4} />
        {/* a and b */}
        <line x1={CX} y1={CY} x2={ax} y2={ay} stroke="var(--ink)" strokeWidth={2.6} markerEnd="url(#dp-a)" />
        <line x1={CX} y1={CY} x2={bx} y2={by} stroke={amber} strokeWidth={2.6} markerEnd="url(#dp-b)" />
        <text x={ax + 6} y={ay + 4} fontSize={12} fill="var(--ink)" fontWeight={600}>a</text>
        <text x={bx + 6} y={by} fontSize={12} fill={amber} fontWeight={600}>b</text>
        <circle cx={bx} cy={by} r={7} fill="var(--surface)" stroke={amber} strokeWidth={2.4} pointerEvents="none" />
        <circle cx={bx} cy={by} r={22} fill="transparent" style={{ cursor: "grab" }} onPointerDown={(e) => { e.preventDefault(); setDrag(true); }} />
      </svg>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
        <Metric label="a · b" value={dot.toFixed(2)} accent={dot >= 0 ? "var(--good)" : "var(--bad)"} />
        <Metric label="angle" value={`${ang.toFixed(0)}°`} />
        <Metric label="projection of b on a" value={scalarProj.toFixed(2)} accent="var(--brand-2)" />
        <Metric label="cos θ" value={cos.toFixed(2)} />
      </div>
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{ background: "var(--surface-2)", borderRadius: 10, padding: "6px 10px", minWidth: 78 }}>
      <div style={{ fontSize: 10.5, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 500, color: accent ?? "var(--ink)" }}>{value}</div>
    </div>
  );
}
