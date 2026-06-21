"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const BASE: [number, number][] = [
  [1, 2.0], [2, 2.6], [3, 3.3], [4, 3.9], [5, 4.6], [6, 5.2], [7, 5.9], [8, 6.6],
];
const DRAG_X = 4.5;

const VW = 560, VH = 380;
const PAD = { l: 46, r: 18, t: 18, b: 42 };
const X0 = PAD.l, X1 = VW - PAD.r, Y0 = VH - PAD.b, Y1 = PAD.t;
const xToPx = (x: number) => X0 + (x / 10) * (X1 - X0);
const yToPx = (y: number) => Y0 - (y / 10) * (Y0 - Y1);

type Line = { m: number; b: number };

function fitOLS(pts: [number, number][]): Line {
  const n = pts.length;
  let sx = 0, sy = 0, sxy = 0, sxx = 0;
  for (const [x, y] of pts) { sx += x; sy += y; sxy += x * y; sxx += x * x; }
  const m = (n * sxy - sx * sy) / (n * sxx - sx * sx);
  return { m, b: (sy - m * sx) / n };
}

function fitL1(pts: [number, number][]): Line {
  let { m, b } = fitOLS(pts);
  for (let it = 0; it < 50; it++) {
    let Sw = 0, Swx = 0, Swy = 0, Swxx = 0, Swxy = 0;
    for (const [x, y] of pts) {
      const w = 1 / Math.max(Math.abs(y - (m * x + b)), 1e-3);
      Sw += w; Swx += w * x; Swy += w * y; Swxx += w * x * x; Swxy += w * x * y;
    }
    const denom = Sw * Swxx - Swx * Swx;
    if (Math.abs(denom) < 1e-9) break;
    m = (Sw * Swxy - Swx * Swy) / denom;
    b = (Swy - m * Swx) / Sw;
  }
  return { m, b };
}

export function OutlierLab() {
  const [dragY, setDragY] = useState(4.3);
  const [dragging, setDragging] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const points = useMemo<[number, number][]>(() => [...BASE, [DRAG_X, dragY]], [dragY]);
  const mse = useMemo(() => fitOLS(points), [points]);
  const mae = useMemo(() => fitL1(points), [points]);

  useEffect(() => {
    if (!dragging) return;
    const move = (e: PointerEvent) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const py = ((e.clientY - rect.top) / rect.height) * VH;
      setDragY(Math.max(0, Math.min(10, ((Y0 - py) / (Y0 - Y1)) * 10)));
    };
    const up = () => setDragging(false);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [dragging]);

  const offTrend = Math.abs(dragY - (0.65 * DRAG_X + 1.4)) > 1.4;

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.6rem 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
          Drag the orange point into an outlier
        </span>
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>watch the two lines react</span>
      </div>

      <svg ref={svgRef} viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", height: "auto", display: "block", touchAction: "none" }}>
        <rect x={X0} y={Y1} width={X1 - X0} height={Y0 - Y1} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        {[2, 4, 6, 8].map((g) => (
          <line key={`gx${g}`} x1={xToPx(g)} y1={Y1} x2={xToPx(g)} y2={Y0} stroke="var(--border)" />
        ))}
        {[2, 4, 6, 8].map((g) => (
          <line key={`gy${g}`} x1={X0} y1={yToPx(g)} x2={X1} y2={yToPx(g)} stroke="var(--border)" />
        ))}

        {/* lines */}
        <line x1={xToPx(0)} y1={yToPx(mse.b)} x2={xToPx(10)} y2={yToPx(mse.m * 10 + mse.b)} stroke="var(--brand)" strokeWidth={2.5} strokeLinecap="round" />
        <line x1={xToPx(0)} y1={yToPx(mae.b)} x2={xToPx(10)} y2={yToPx(mae.m * 10 + mae.b)} stroke="var(--c-clustering)" strokeWidth={2.5} strokeLinecap="round" strokeDasharray="6 5" />

        {/* base points */}
        {BASE.map(([x, y], i) => (
          <circle key={i} cx={xToPx(x)} cy={yToPx(y)} r={4} fill="var(--c-regression)" />
        ))}

        {/* draggable outlier */}
        <circle cx={xToPx(DRAG_X)} cy={yToPx(dragY)} r={9} fill="var(--surface)" stroke="var(--c-fundamentals)" strokeWidth={2.5} style={{ cursor: "ns-resize" }}
          tabIndex={0} role="slider" aria-label="Outlier point" aria-valuenow={Math.round(dragY * 10) / 10}
          onPointerDown={(e) => { e.preventDefault(); setDragging(true); }}
          onKeyDown={(e) => { if (e.key === "ArrowUp") { e.preventDefault(); setDragY((v) => Math.min(10, v + 0.3)); } if (e.key === "ArrowDown") { e.preventDefault(); setDragY((v) => Math.max(0, v - 0.3)); } }}
        />
        <circle cx={xToPx(DRAG_X)} cy={yToPx(dragY)} r={3} fill="var(--c-fundamentals)" />
      </svg>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 12, fontSize: 12.5 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--muted)" }}>
          <span style={{ width: 16, height: 3, borderRadius: 2, background: "var(--brand)" }} /> squared-error fit (MSE)
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--muted)" }}>
          <span style={{ width: 16, height: 3, borderRadius: 2, background: "var(--c-clustering)" }} /> absolute-error fit (MAE)
        </span>
      </div>

      <div style={{ marginTop: 12, fontSize: 13.5, color: "var(--muted)", lineHeight: 1.55, background: "var(--surface-2)", borderRadius: 10, padding: "10px 12px" }}>
        {offTrend
          ? "See it? The squared-error line has lurched toward the outlier — one bad point bends the whole fit. The absolute-error line barely flinched."
          : "Right now both lines agree. Drag the orange point far from the trend and watch them split apart."}
      </div>
    </div>
  );
}
