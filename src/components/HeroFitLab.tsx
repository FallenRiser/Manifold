"use client";

import { useEffect, useMemo, useRef, useState } from "react";

// The landing-page proof-of-product (PROJECT.md §10.2): a real, working
// regression lab in the hero. Drag either end of the line; MSE updates live;
// getting close to the least-squares fit is acknowledged.

const DATA: [number, number][] = [
  [0.7, 2.3], [1.5, 1.9], [2.2, 3.5], [3.0, 2.9],
  [3.8, 4.7], [4.6, 4.1], [5.5, 5.9], [6.3, 5.4],
  [7.1, 7.1], [8.0, 6.5], [8.8, 8.3], [9.4, 7.8],
];

const VW = 480, VH = 320;
const PAD = { l: 16, r: 16, t: 16, b: 30 };
const X0 = PAD.l, X1 = VW - PAD.r;
const Y0 = VH - PAD.b, Y1 = PAD.t;

const xToPx = (x: number) => X0 + (x / 10) * (X1 - X0);
const yToPx = (y: number) => Y0 - (y / 10) * (Y0 - Y1);

function ols() {
  const n = DATA.length;
  let sx = 0, sy = 0, sxy = 0, sxx = 0;
  for (const [x, y] of DATA) { sx += x; sy += y; sxy += x * y; sxx += x * x; }
  const m = (n * sxy - sx * sy) / (n * sxx - sx * sx);
  const b = (sy - m * sx) / n;
  return { m, b };
}

function mseOf(m: number, b: number) {
  let s = 0;
  for (const [x, y] of DATA) s += (y - (m * x + b)) ** 2;
  return s / DATA.length;
}

export function HeroFitLab() {
  const best = useMemo(ols, []);
  const bestMse = useMemo(() => mseOf(best.m, best.b), [best]);
  const [yL, setYL] = useState(5.6);
  const [yR, setYR] = useState(5.9);
  const [touched, setTouched] = useState(false);
  const [drag, setDrag] = useState<null | "L" | "R">(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const m = (yR - yL) / 10;
  const b = yL;
  const mse = mseOf(m, b);
  const nailed = mse <= bestMse * 1.06;

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

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 20,
        padding: 14,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "0 4px 8px" }}>
        <span className="font-display" style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink)" }}>
          Drag the line. You&rsquo;re doing machine learning.
        </span>
        <span
          style={{
            fontSize: 12,
            fontFamily: "var(--font-geist-mono, monospace)",
            color: nailed && touched ? "var(--good)" : "var(--muted)",
            transition: "color 0.2s ease",
          }}
        >
          {nailed && touched ? "● least squares" : `error ${mse.toFixed(2)}`}
        </span>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${VW} ${VH}`}
        style={{ width: "100%", height: "auto", display: "block", touchAction: "none" }}
        aria-label="Interactive scatter plot — drag the line to fit the points"
      >
        <rect x={0} y={0} width={VW} height={VH} rx={10} fill="var(--canvas)" />
        {[2, 4, 6, 8].map((g) => (
          <line key={`gx${g}`} x1={xToPx(g)} y1={Y1} x2={xToPx(g)} y2={Y0} stroke="var(--border)" strokeWidth={1} />
        ))}
        {[2, 4, 6, 8].map((g) => (
          <line key={`gy${g}`} x1={X0} y1={yToPx(g)} x2={X1} y2={yToPx(g)} stroke="var(--border)" strokeWidth={1} />
        ))}

        {/* residuals */}
        {DATA.map(([x, y], i) => (
          <line
            key={`r${i}`}
            x1={xToPx(x)} y1={yToPx(y)}
            x2={xToPx(x)} y2={yToPx(Math.max(0, Math.min(10, m * x + b)))}
            stroke="var(--brand-3)" strokeWidth={1.4} strokeOpacity={0.55}
          />
        ))}

        {/* the line — ink, like a figure in a book */}
        <line
          x1={xToPx(0)} y1={yToPx(yL)} x2={xToPx(10)} y2={yToPx(yR)}
          stroke={nailed && touched ? "var(--good)" : "var(--brand)"}
          strokeWidth={2.4} strokeLinecap="round"
          style={{ transition: "stroke 0.2s ease" }}
        />

        {/* points */}
        {DATA.map(([x, y], i) => (
          <circle key={`p${i}`} cx={xToPx(x)} cy={yToPx(y)} r={4} fill="var(--c-regression)" />
        ))}

        {/* drag handles */}
        {([["L", 0, yL], ["R", 10, yR]] as const).map(([id, x, yv]) => (
          <g key={id}>
            {/* generous invisible hit target for touch */}
            <circle
              cx={xToPx(x)} cy={yToPx(yv)} r={22} fill="transparent"
              style={{ cursor: "ns-resize" }}
              onPointerDown={(e) => { e.preventDefault(); setTouched(true); setDrag(id); }}
            />
            <circle
              cx={xToPx(x)} cy={yToPx(yv)} r={8}
              fill="var(--surface)" stroke="var(--brand)" strokeWidth={2.4}
              style={{ cursor: "ns-resize", pointerEvents: "none" }}
            />
          </g>
        ))}

        {!touched && (
          <text x={xToPx(10) - 14} y={yToPx(yR) - 16} fontSize={11.5} fill="var(--muted)" textAnchor="end" fontStyle="italic">
            grab an end ↘
          </text>
        )}
      </svg>

      <div
        className="font-serif"
        style={{ fontSize: 13.5, fontStyle: "italic", color: "var(--faint)", textAlign: "center", marginTop: 8 }}
      >
        {nailed && touched
          ? "that's the line of best fit — every lesson feels like this"
          : "minimise the error — the orange stems are your mistakes"}
      </div>
    </div>
  );
}
