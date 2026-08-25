"use client";

import { useState } from "react";

// The scree plot, live. Bars are the real explained-variance ratios of the 64
// principal components of load_digits (scripts/pca_cases.py, sklearn 1.8); the
// line is their cumulative sum. Drag k to keep the first k components: watch the
// bars past k grey out and the cumulative readout climb. The "elbow" after the
// first few tall bars, and the flat 90%/95% shelves, are exactly what you look
// for when choosing k.

const EVR = [14.89, 13.62, 11.79, 8.41, 5.78, 4.92, 4.32, 3.66, 3.35, 3.08, 2.37, 2.27, 1.82, 1.77, 1.47, 1.41, 1.32, 1.25, 1.02, 0.91, 0.89, 0.80, 0.77, 0.72, 0.70, 0.60, 0.58, 0.52, 0.49, 0.43];
const CUM = [14.89, 28.51, 40.30, 48.71, 54.50, 59.41, 63.73, 67.39, 70.74, 73.82, 76.20, 78.47, 80.29, 82.06, 83.53, 84.94, 86.26, 87.51, 88.52, 89.43, 90.32, 91.12, 91.88, 92.61, 93.30, 93.90, 94.47, 94.99, 95.48, 95.91];

const N = EVR.length;
const VW = 560, VH = 300;
const PAD = { l: 44, r: 40, t: 16, b: 34 };
const X0 = PAD.l, X1 = VW - PAD.r, Y0 = VH - PAD.b, Y1 = PAD.t;
const bw = (X1 - X0) / N;
const evrMax = EVR[0] * 1.1;
const evrY = (v: number) => Y0 - (v / evrMax) * (Y0 - Y1);
const cumY = (v: number) => Y0 - (v / 100) * (Y0 - Y1);

export function ScreeLab() {
  const [k, setK] = useState(10);
  const dim = "var(--c-dimred)";
  const cumAtK = CUM[k - 1];

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.6rem 0" }} className="not-prose">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
          Scree plot — the 64 digit components
        </span>
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>bars = variance each · line = cumulative</span>
      </div>

      <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <rect x={X0} y={Y1} width={X1 - X0} height={Y0 - Y1} rx={6} fill="var(--canvas)" stroke="var(--border-strong)" />
        {/* cumulative gridlines at 50/90/95 */}
        {[50, 90, 95].map((g) => (
          <g key={g}>
            <line x1={X0} y1={cumY(g)} x2={X1} y2={cumY(g)} stroke="var(--border)" strokeWidth={1} strokeDasharray="3 3" />
            <text x={X1 + 4} y={cumY(g) + 3} fontSize={9.5} fill="var(--faint)">{g}%</text>
          </g>
        ))}

        {/* bars */}
        {EVR.map((v, i) => {
          const on = i < k;
          return <rect key={i} x={X0 + i * bw + 1} y={evrY(v)} width={bw - 2} height={Y0 - evrY(v)}
            fill={on ? dim : "var(--border-strong)"} fillOpacity={on ? 0.85 : 0.6} rx={1} />;
        })}

        {/* cumulative line */}
        <polyline points={CUM.map((v, i) => `${X0 + (i + 0.5) * bw},${cumY(v)}`).join(" ")}
          fill="none" stroke="var(--ink)" strokeWidth={1.8} />
        {CUM.map((v, i) => <circle key={i} cx={X0 + (i + 0.5) * bw} cy={cumY(v)} r={1.8} fill="var(--ink)" />)}

        {/* k marker */}
        <line x1={X0 + k * bw} y1={Y1} x2={X0 + k * bw} y2={Y0} stroke="var(--brand-3)" strokeWidth={1.6} />
        <circle cx={X0 + (k - 0.5) * bw} cy={cumY(cumAtK)} r={4.5} fill="var(--brand-3)" stroke="var(--surface)" strokeWidth={1.5} />

        <text x={(X0 + X1) / 2} y={VH - 8} fontSize={11} fill="var(--faint)" textAnchor="middle">component number →</text>
      </svg>

      <div style={{ marginTop: 12 }}>
        <input type="range" min={1} max={N} step={1} value={k} onChange={(e) => setK(Number(e.target.value))} style={{ width: "100%", accentColor: dim }} aria-label="Number of components k" />
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
        <Metric label="components kept" value={`${k} of 64`} accent={dim} />
        <Metric label="variance explained" value={`${cumAtK.toFixed(1)}%`} accent="var(--brand-3)" />
        <Metric label="dimensions dropped" value={`${64 - k}`} sub={`${Math.round((1 - k / 64) * 100)}% fewer`} />
      </div>
    </div>
  );
}

function Metric({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div style={{ background: "var(--surface-2)", borderRadius: 10, padding: "7px 11px", minWidth: 96 }}>
      <div style={{ fontSize: 10.5, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontSize: 17, fontWeight: 500, color: accent ?? "var(--ink)" }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: "var(--faint)" }}>{sub}</div>}
    </div>
  );
}
