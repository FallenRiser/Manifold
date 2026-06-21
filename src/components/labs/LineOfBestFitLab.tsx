"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const DATA: [number, number][] = [
  [0.6, 2.1], [1.4, 2.0], [2.1, 3.4], [2.9, 3.0],
  [3.6, 4.6], [4.4, 4.2], [5.3, 5.8], [6.1, 5.5],
  [6.9, 7.0], [7.7, 6.6], [8.6, 8.2], [9.3, 7.9],
];

const VW = 560, VH = 380;
const PAD = { l: 46, r: 18, t: 18, b: 42 };
const X0 = PAD.l, X1 = VW - PAD.r;
const Y0 = VH - PAD.b, Y1 = PAD.t;

const xToPx = (x: number) => X0 + (x / 10) * (X1 - X0);
const yToPx = (y: number) => Y0 - (y / 10) * (Y0 - Y1);

function ols(): { m: number; b: number } {
  const n = DATA.length;
  let sx = 0, sy = 0, sxy = 0, sxx = 0;
  for (const [x, y] of DATA) { sx += x; sy += y; sxy += x * y; sxx += x * x; }
  const m = (n * sxy - sx * sy) / (n * sxx - sx * sx);
  const b = (sy - m * sx) / n;
  return { m, b };
}

export function LineOfBestFitLab() {
  const best = useMemo(ols, []);
  const [yL, setYL] = useState(1.2);
  const [yR, setYR] = useState(6.2);
  const [showSquares, setShowSquares] = useState(false);
  const [drag, setDrag] = useState<null | "L" | "R">(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const rafRef = useRef<number | null>(null);

  const m = (yR - yL) / 10;
  const b = yL;

  const { mse, r2 } = useMemo(() => {
    let ssr = 0, sst = 0;
    const meanY = DATA.reduce((s, [, y]) => s + y, 0) / DATA.length;
    for (const [x, y] of DATA) {
      const pred = m * x + b;
      ssr += (y - pred) ** 2;
      sst += (y - meanY) ** 2;
    }
    return { mse: ssr / DATA.length, r2: 1 - ssr / sst };
  }, [m, b]);

  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const py = ((e.clientY - rect.top) / rect.height) * VH;
      const yData = Math.max(0, Math.min(10, ((Y0 - py) / (Y0 - Y1)) * 10));
      if (drag === "L") setYL(yData);
      else setYR(yData);
    };
    const up = () => setDrag(null);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [drag]);

  function snap() {
    const targetL = best.b;
    const targetR = best.m * 10 + best.b;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setYL(targetL); setYR(targetR); return; }
    const fromL = yL, fromR = yR;
    const t0 = performance.now();
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / 600);
      const e = 1 - Math.pow(1 - k, 3);
      setYL(fromL + (targetL - fromL) * e);
      setYR(fromR + (targetR - fromR) * e);
      if (k < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }

  function nudge(which: "L" | "R", delta: number) {
    const set = which === "L" ? setYL : setYR;
    const cur = which === "L" ? yL : yR;
    set(Math.max(0, Math.min(10, cur + delta)));
  }

  const reg = "var(--c-regression)";

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: 16,
        margin: "1.6rem 0",
      }}
      className="not-prose"
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
          Drag the line to fit the points
        </span>
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>grab either end ●</span>
      </div>

      <svg ref={svgRef} viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", height: "auto", display: "block", touchAction: "none" }}>
        {/* canvas + grid */}
        <rect x={X0} y={Y1} width={X1 - X0} height={Y0 - Y1} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        {[2, 4, 6, 8].map((g) => (
          <line key={`gx${g}`} x1={xToPx(g)} y1={Y1} x2={xToPx(g)} y2={Y0} stroke="var(--border)" strokeWidth={1} />
        ))}
        {[2, 4, 6, 8].map((g) => (
          <line key={`gy${g}`} x1={X0} y1={yToPx(g)} x2={X1} y2={yToPx(g)} stroke="var(--border)" strokeWidth={1} />
        ))}
        <text x={(X0 + X1) / 2} y={VH - 10} fontSize={11} fill="var(--faint)" textAnchor="middle">size of the house →</text>
        <text x={16} y={(Y0 + Y1) / 2} fontSize={11} fill="var(--faint)" textAnchor="middle" transform={`rotate(-90 16 ${(Y0 + Y1) / 2})`}>price →</text>

        {/* squared-error squares */}
        {showSquares && DATA.map(([x, y], i) => {
          const pred = m * x + b;
          const side = Math.abs(yToPx(y) - yToPx(pred));
          const top = Math.min(yToPx(y), yToPx(pred));
          return <rect key={`sq${i}`} x={xToPx(x)} y={top} width={side} height={side} fill={reg} fillOpacity={0.1} stroke={reg} strokeOpacity={0.25} />;
        })}

        {/* residuals */}
        {DATA.map(([x, y], i) => {
          const pred = m * x + b;
          return <line key={`r${i}`} x1={xToPx(x)} y1={yToPx(y)} x2={xToPx(x)} y2={yToPx(pred)} stroke="var(--brand-3)" strokeWidth={1.5} strokeOpacity={0.6} />;
        })}

        {/* the line */}
        <line x1={xToPx(0)} y1={yToPx(yL)} x2={xToPx(10)} y2={yToPx(yR)} stroke="var(--brand)" strokeWidth={2.5} strokeLinecap="round" />

        {/* points */}
        {DATA.map(([x, y], i) => (
          <circle key={`p${i}`} cx={xToPx(x)} cy={yToPx(y)} r={4} fill={reg} />
        ))}

        {/* drag handles */}
        {([["L", 0, yL], ["R", 10, yR]] as const).map(([id, x, yv]) => (
          <circle
            key={id}
            cx={xToPx(x)}
            cy={yToPx(yv)}
            r={8}
            fill="var(--surface)"
            stroke="var(--brand)"
            strokeWidth={2.5}
            style={{ cursor: "ns-resize" }}
            tabIndex={0}
            role="slider"
            aria-label={id === "L" ? "Left end of line" : "Right end of line"}
            aria-valuenow={Math.round(yv * 10) / 10}
            onPointerDown={(e) => { e.preventDefault(); setDrag(id); }}
            onKeyDown={(e) => {
              if (e.key === "ArrowUp") { e.preventDefault(); nudge(id, 0.3); }
              if (e.key === "ArrowDown") { e.preventDefault(); nudge(id, -0.3); }
            }}
          />
        ))}
      </svg>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12, alignItems: "center" }}>
        <Metric label="mean squared error" value={mse.toFixed(2)} />
        <Metric label="R²" value={r2.toFixed(2)} />
        <Metric label="line" value={`y = ${m.toFixed(2)}x + ${b.toFixed(2)}`} mono />
        <div style={{ flex: 1 }} />
        <label style={{ fontSize: 12.5, color: "var(--muted)", display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
          <input type="checkbox" checked={showSquares} onChange={(e) => setShowSquares(e.target.checked)} />
          show squared errors
        </label>
        <button onClick={snap} style={btnPrimary}>Snap to best fit</button>
        <button onClick={() => { setYL(1.2); setYR(6.2); }} style={btnGhost}>Reset</button>
      </div>
    </div>
  );
}

function Metric({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ background: "var(--surface-2)", borderRadius: 10, padding: "7px 11px" }}>
      <div style={{ fontSize: 10.5, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 500, color: "var(--ink)", fontFamily: mono ? "var(--font-geist-mono, monospace)" : undefined }}>{value}</div>
    </div>
  );
}

const btnPrimary: React.CSSProperties = {
  background: "var(--cta)",
  color: "#fff",
  border: "none",
  fontSize: 13,
  fontWeight: 500,
  padding: "8px 14px",
  borderRadius: 10,
  cursor: "pointer",
};

const btnGhost: React.CSSProperties = {
  background: "transparent",
  color: "var(--muted)",
  border: "1px solid var(--border-strong)",
  fontSize: 13,
  padding: "8px 12px",
  borderRadius: 10,
  cursor: "pointer",
};
