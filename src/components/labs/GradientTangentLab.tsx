"use client";

import { useEffect, useRef, useState } from "react";

const VW = 560, VH = 330, P = { l: 46, r: 18, t: 18, b: 40 };
const X0 = P.l, X1 = VW - P.r, Y0 = VH - P.b, Y1 = P.t;

const f = (w: number) => 0.13 * (w - 6) ** 2 + 1.2;
const fp = (w: number) => 0.26 * (w - 6);
const xToPx = (w: number) => X0 + (w / 10) * (X1 - X0);
const yToPx = (v: number) => Y0 - (v / 7) * (Y0 - Y1);

const curve = (() => {
  const p: string[] = [];
  for (let w = 0; w <= 10.001; w += 0.1) p.push(`${xToPx(w).toFixed(1)},${yToPx(f(w)).toFixed(1)}`);
  return p.join(" ");
})();

export function GradientTangentLab() {
  const [w, setW] = useState(1.4);
  const [steps, setSteps] = useState(0);
  const [drag, setDrag] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!drag) return;
    const mv = (e: PointerEvent) => {
      const svg = svgRef.current;
      if (!svg) return;
      const r = svg.getBoundingClientRect();
      const px = ((e.clientX - r.left) / r.width) * VW;
      setW(Math.max(0, Math.min(10, ((px - X0) / (X1 - X0)) * 10)));
      setSteps(0);
    };
    const up = () => setDrag(false);
    window.addEventListener("pointermove", mv);
    window.addEventListener("pointerup", up);
    return () => { window.removeEventListener("pointermove", mv); window.removeEventListener("pointerup", up); };
  }, [drag]);

  const s = fp(w);
  const dlt = 1.4;
  const tx1 = w - dlt, tx2 = w + dlt;
  const stepDown = () => { setW((p) => Math.max(0, Math.min(10, p - 3 * fp(p)))); setSteps((n) => n + 1); };

  const note =
    Math.abs(s) < 0.05
      ? "Slope ≈ 0 — you're at the bottom. The gradient vanishes, so descent stops here."
      : s > 0
      ? "Slope is positive: uphill is to the right → a downhill step goes left."
      : "Slope is negative: uphill is to the left → a downhill step goes right.";

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.6rem 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
          Drag the ball — the gradient is the slope under it
        </span>
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>then step downhill</span>
      </div>

      <svg ref={svgRef} viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", height: "auto", display: "block", touchAction: "none" }}>
        <rect x={X0} y={Y1} width={X1 - X0} height={Y0 - Y1} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        {/* curve */}
        <polyline points={curve} fill="none" stroke="var(--c-regression)" strokeWidth={2} strokeOpacity={0.5} />
        {/* tangent */}
        <line x1={xToPx(tx1)} y1={yToPx(f(w) + s * (tx1 - w))} x2={xToPx(tx2)} y2={yToPx(f(w) + s * (tx2 - w))} stroke="var(--brand)" strokeWidth={2.5} strokeLinecap="round" />
        {/* ball */}
        <circle cx={xToPx(w)} cy={yToPx(f(w))} r={8} fill="var(--surface)" stroke="var(--brand-2)" strokeWidth={2.5} style={{ cursor: "ew-resize" }}
          tabIndex={0} role="slider" aria-label="Position on the curve" aria-valuenow={Math.round(w * 10) / 10}
          onPointerDown={(e) => { e.preventDefault(); setDrag(true); }}
          onKeyDown={(e) => { if (e.key === "ArrowRight") { setW((v) => Math.min(10, v + 0.3)); setSteps(0); } if (e.key === "ArrowLeft") { setW((v) => Math.max(0, v - 0.3)); setSteps(0); } }}
        />
        <circle cx={xToPx(w)} cy={yToPx(f(w))} r={3} fill="var(--brand-2)" />
        {/* downhill direction arrow on the floor */}
        {Math.abs(s) >= 0.05 && (
          <g stroke="var(--good)" strokeWidth={2} fill="none">
            <line x1={xToPx(w)} y1={Y0 - 6} x2={xToPx(w) + (s > 0 ? -34 : 34)} y2={Y0 - 6} strokeLinecap="round" />
            <polyline points={s > 0 ? `${xToPx(w) - 28},${Y0 - 11} ${xToPx(w) - 34},${Y0 - 6} ${xToPx(w) - 28},${Y0 - 1}` : `${xToPx(w) + 28},${Y0 - 11} ${xToPx(w) + 34},${Y0 - 6} ${xToPx(w) + 28},${Y0 - 1}`} strokeLinejoin="round" />
          </g>
        )}
      </svg>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12, alignItems: "center" }}>
        <div style={{ background: "var(--surface-2)", borderRadius: 9, padding: "6px 11px" }}>
          <div style={{ fontSize: 10, color: "var(--muted)" }}>gradient (slope)</div>
          <div style={{ fontSize: 16, fontWeight: 500, color: "var(--ink)", fontFamily: "var(--font-geist-mono, monospace)" }}>{s.toFixed(2)}</div>
        </div>
        <div style={{ background: "var(--surface-2)", borderRadius: 9, padding: "6px 11px" }}>
          <div style={{ fontSize: 10, color: "var(--muted)" }}>steps taken</div>
          <div style={{ fontSize: 16, fontWeight: 500, color: "var(--ink)" }}>{steps}</div>
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={stepDown} style={btnPrimary}>Step downhill</button>
        <button onClick={() => { setW(1.4); setSteps(0); }} style={btnGhost}>Reset</button>
      </div>

      <div style={{ marginTop: 12, fontSize: 13.5, color: "var(--muted)", lineHeight: 1.55, background: "var(--surface-2)", borderRadius: 10, padding: "10px 12px" }}>
        {note}
      </div>
    </div>
  );
}

const btnPrimary: React.CSSProperties = { background: "var(--cta)", color: "#fff", border: "none", fontSize: 13, fontWeight: 500, padding: "8px 14px", borderRadius: 10, cursor: "pointer" };
const btnGhost: React.CSSProperties = { background: "transparent", color: "var(--muted)", border: "1px solid var(--border-strong)", fontSize: 13, padding: "8px 12px", borderRadius: 10, cursor: "pointer" };
