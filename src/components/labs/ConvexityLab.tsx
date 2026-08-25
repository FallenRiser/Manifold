"use client";

import { useEffect, useMemo, useRef, useState } from "react";

// The definition of convexity you can see: pick any two points on the graph and
// draw the chord between them. For a convex function the chord never dips below
// the curve — which is why a convex loss has no bad local minima. Drag the two
// points; toggle to a non-convex function and watch the chord cut underneath.

const VW = 460, VH = 300, PAD = { l: 30, r: 16, t: 16, b: 28 };
const X0 = PAD.l, X1 = VW - PAD.r, Y0 = VH - PAD.b, Y1 = PAD.t;
const xmin = -3, xmax = 3;
const xToPx = (x: number) => X0 + ((x - xmin) / (xmax - xmin)) * (X1 - X0);

const FNS = {
  convex: { f: (x: number) => 0.32 * x * x, name: "f(x) = x²  (convex)", ymax: 3 },
  nonconvex: { f: (x: number) => 0.12 * x * x * x * x - 0.9 * x * x + 1.6, name: "double-well  (non-convex)", ymax: 3 },
};

export function ConvexityLab() {
  const [kind, setKind] = useState<"convex" | "nonconvex">("convex");
  const [xa, setXa] = useState(-2);
  const [xb, setXb] = useState(1.6);
  const [drag, setDrag] = useState<null | "a" | "b">(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const amber = "var(--c-fundamentals)";
  const { f, name, ymax } = FNS[kind];
  const yToPx = (y: number) => Y0 - (y / ymax) * (Y0 - Y1);

  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => {
      const svg = svgRef.current; if (!svg) return;
      const r = svg.getBoundingClientRect();
      const px = ((e.clientX - r.left) / r.width) * VW;
      const x = Math.max(xmin, Math.min(xmax, xmin + ((px - X0) / (X1 - X0)) * (xmax - xmin)));
      (drag === "a" ? setXa : setXb)(x);
    };
    const up = () => setDrag(null);
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, [drag]);

  const curve = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i <= 120; i++) { const x = xmin + (i / 120) * (xmax - xmin); pts.push(`${xToPx(x).toFixed(1)},${yToPx(f(x)).toFixed(1)}`); }
    return pts.join(" ");
  }, [kind]);

  // does the chord ever dip below the curve? sample midpoints
  let below = false;
  for (let t = 0.05; t < 1; t += 0.05) {
    const x = xa + t * (xb - xa);
    const chord = f(xa) + t * (f(xb) - f(xa));
    if (chord < f(x) - 0.02) { below = true; break; }
  }
  const f2 = (n: number) => n.toFixed(1);

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.6rem 0" }} className="not-prose">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>{name}</span>
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>drag ● the two points</span>
      </div>
      <svg ref={svgRef} viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", height: "auto", display: "block", touchAction: "none" }}>
        <rect x={X0} y={Y1} width={X1 - X0} height={Y0 - Y1} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        <polyline points={curve} fill="none" stroke="var(--ink)" strokeWidth={2} />
        {/* chord */}
        <line x1={f2(xToPx(xa))} y1={f2(yToPx(f(xa)))} x2={f2(xToPx(xb))} y2={f2(yToPx(f(xb)))} stroke={below ? "var(--bad)" : amber} strokeWidth={2.4} strokeDasharray={below ? "5 4" : undefined} />
        {(["a", "b"] as const).map((id) => {
          const x = id === "a" ? xa : xb;
          return <g key={id}>
            <circle cx={f2(xToPx(x))} cy={f2(yToPx(f(x)))} r={6.5} fill="var(--surface)" stroke={amber} strokeWidth={2.4} pointerEvents="none" />
            <circle cx={f2(xToPx(x))} cy={f2(yToPx(f(x)))} r={20} fill="transparent" style={{ cursor: "ew-resize" }} onPointerDown={(e) => { e.preventDefault(); setDrag(id); }} />
          </g>;
        })}
      </svg>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 10, alignItems: "center" }}>
        <div style={{ fontSize: 13, color: below ? "var(--bad)" : "var(--good)", fontWeight: 500 }}>
          {below ? "✗ chord dips below the curve → not convex here" : "✓ chord stays on/above the curve"}
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={() => setKind("convex")} style={{ ...btn, borderColor: kind === "convex" ? amber : "var(--border-strong)" }}>convex</button>
        <button onClick={() => setKind("nonconvex")} style={{ ...btn, borderColor: kind === "nonconvex" ? amber : "var(--border-strong)" }}>non-convex</button>
      </div>
    </div>
  );
}

const btn: React.CSSProperties = { background: "transparent", color: "var(--muted)", border: "1px solid var(--border-strong)", fontSize: 12.5, padding: "6px 12px", borderRadius: 8, cursor: "pointer" };
