"use client";

import { useState } from "react";

// Entropy measures average surprise. Drag the four outcome probabilities: a
// lopsided distribution (one near-certain outcome) has low entropy — little
// surprise, few bits needed to encode it. A uniform distribution has the most
// surprise possible, here 2 bits. This is the quantity cross-entropy loss and
// decision-tree splits are built on.

const VW = 380, VH = 210, PAD = { l: 24, r: 14, t: 14, b: 30 };
const X0 = PAD.l, X1 = VW - PAD.r, Y0 = VH - PAD.b, Y1 = PAD.t;

export function EntropyLab() {
  const [w, setW] = useState<number[]>([3, 2, 1, 1]); // unnormalised weights
  const amber = "var(--c-fundamentals)";
  const total = w.reduce((a, b) => a + b, 0);
  const p = w.map((x) => x / total);
  const H = -p.reduce((a, pi) => a + (pi > 0 ? pi * Math.log2(pi) : 0), 0);
  const maxH = 2; // log2(4)
  const bw = (X1 - X0) / 4;
  const labels = ["A", "B", "C", "D"];

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.6rem 0" }} className="not-prose">
      <div className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", marginBottom: 8 }}>Entropy of a 4-outcome distribution</div>
      <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", maxWidth: 380, height: "auto", display: "block" }}>
        <rect x={X0} y={Y1} width={X1 - X0} height={Y0 - Y1} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        {p.map((pi, i) => {
          const h = pi * (Y0 - Y1);
          return <g key={i}>
            <rect x={X0 + i * bw + 8} y={Y0 - h} width={bw - 16} height={h} rx={3} fill={amber} fillOpacity={0.8} />
            <text x={X0 + i * bw + bw / 2} y={Y0 + 16} fontSize={11} fill="var(--muted)" textAnchor="middle">{labels[i]}</text>
            <text x={X0 + i * bw + bw / 2} y={Y0 - h - 5} fontSize={10} fill="var(--ink)" textAnchor="middle">{(pi * 100).toFixed(0)}%</text>
          </g>;
        })}
      </svg>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 14px", marginTop: 10 }}>
        {w.map((wi, i) => (
          <label key={i} style={{ fontSize: 12, color: "var(--muted)" }}>outcome {labels[i]}
            <input type="range" min={0} max={10} step={0.5} value={wi} onChange={(e) => setW((prev) => prev.map((x, j) => (j === i ? Number(e.target.value) : x)))} style={{ width: "100%", accentColor: amber }} />
          </label>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12, alignItems: "center" }}>
        <Metric label="entropy H" value={`${H.toFixed(3)} bits`} accent={amber} big />
        <Metric label="of maximum" value={`${((H / maxH) * 100).toFixed(0)}%`} sub="max = 2 bits (uniform)" />
        <div style={{ flex: 1 }} />
        <button onClick={() => setW([2.5, 2.5, 2.5, 2.5])} style={btn}>make uniform</button>
        <button onClick={() => setW([10, 0.2, 0.2, 0.2])} style={btn}>make certain</button>
      </div>
    </div>
  );
}

function Metric({ label, value, sub, accent, big }: { label: string; value: string; sub?: string; accent?: string; big?: boolean }) {
  return (
    <div style={{ background: "var(--surface-2)", borderRadius: 10, padding: "6px 10px", minWidth: 96 }}>
      <div style={{ fontSize: 10.5, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontSize: big ? 19 : 15, fontWeight: 500, color: accent ?? "var(--ink)" }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: "var(--faint)" }}>{sub}</div>}
    </div>
  );
}
const btn: React.CSSProperties = { background: "transparent", color: "var(--muted)", border: "1px solid var(--border-strong)", fontSize: 12, padding: "5px 10px", borderRadius: 8, cursor: "pointer" };
