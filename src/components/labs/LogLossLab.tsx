"use client";

import { useState } from "react";

// Feel the loss: pick the model's predicted probability for one example whose
// true label you control, and watch what log loss charges for it vs what
// squared error would. The point: log loss's penalty for confident wrongness
// has no ceiling — squared error tops out at 1.

const VW = 640;
const VH = 300;
const PAD = { l: 46, r: 18, t: 14, b: 34 };
const PMIN = 0.005;
const PMAX = 0.995;
const LOSS_MAX = 5.5; // display cap for the y-axis

export function LogLossLab() {
  const [p, setP] = useState(0.7);
  const [yTrue, setYTrue] = useState<0 | 1>(1);

  // losses for predicting probability q when the true label is yTrue
  const logLossAt = (q: number) => -Math.log(yTrue === 1 ? q : 1 - q);
  const mseAt = (q: number) => (q - yTrue) ** 2;

  const xToPx = (q: number) => PAD.l + ((q - 0) / 1) * (VW - PAD.l - PAD.r);
  const yToPx = (loss: number) =>
    VH - PAD.b - (Math.min(loss, LOSS_MAX) / LOSS_MAX) * (VH - PAD.t - PAD.b);

  const path = (f: (q: number) => number) =>
    Array.from({ length: 161 }, (_, i) => {
      const q = PMIN + (i / 160) * (PMAX - PMIN);
      return `${xToPx(q)},${yToPx(f(q))}`;
    }).join(" ");

  const ll = logLossAt(p);
  const mse = mseAt(p);

  return (
    <div style={frame}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6, flexWrap: "wrap", gap: 8 }}>
        <span className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
          What one prediction costs
        </span>
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>solid: log loss · dashed: squared error</span>
      </div>

      <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <rect x={PAD.l} y={PAD.t} width={VW - PAD.l - PAD.r} height={VH - PAD.t - PAD.b} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        {[0, 1, 2, 3, 4, 5].map((v) => (
          <g key={v}>
            <line x1={PAD.l} y1={yToPx(v)} x2={VW - PAD.r} y2={yToPx(v)} stroke="var(--border)" strokeOpacity={0.6} />
            <text x={PAD.l - 6} y={yToPx(v) + 4} fontSize={10} fill="var(--faint)" textAnchor="end">{v}</text>
          </g>
        ))}
        <text x={xToPx(0)} y={VH - PAD.b + 16} fontSize={10} fill="var(--faint)" textAnchor="middle">0</text>
        <text x={xToPx(0.5)} y={VH - PAD.b + 16} fontSize={10} fill="var(--faint)" textAnchor="middle">0.5</text>
        <text x={xToPx(1)} y={VH - PAD.b + 16} fontSize={10} fill="var(--faint)" textAnchor="middle">1</text>
        <text x={xToPx(0.5)} y={VH - 6} fontSize={10.5} fill="var(--muted)" textAnchor="middle">predicted probability of class 1</text>

        <polyline points={path(mseAt)} fill="none" stroke="var(--c-regression)" strokeWidth={2} strokeDasharray="6 5" />
        <polyline points={path(logLossAt)} fill="none" stroke="var(--c-classification)" strokeWidth={2.5} />

        {/* marker at current p */}
        <line x1={xToPx(p)} y1={PAD.t} x2={xToPx(p)} y2={VH - PAD.b} stroke="var(--c-fundamentals)" strokeDasharray="3 5" />
        <circle cx={xToPx(p)} cy={yToPx(ll)} r={6} fill="var(--c-classification)" stroke="var(--surface)" strokeWidth={2} />
        <circle cx={xToPx(p)} cy={yToPx(mse)} r={6} fill="var(--c-regression)" stroke="var(--surface)" strokeWidth={2} />
        {ll > LOSS_MAX && (
          <text x={xToPx(p)} y={PAD.t + 12} fontSize={10.5} fill="var(--bad)" textAnchor="middle">↑ off the chart</text>
        )}
      </svg>

      <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "var(--muted)", marginTop: 12 }}>
        <span style={{ minWidth: 180 }}>the model says P(class 1) = <b style={{ color: "var(--ink)" }}>{p.toFixed(2)}</b></span>
        <input type="range" min={PMIN} max={PMAX} step={0.005} value={p} onChange={(e) => setP(Number(e.target.value))} style={{ flex: 1, accentColor: "var(--c-classification)" }} aria-label="Predicted probability" />
      </label>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12, alignItems: "center" }}>
        <div style={{ display: "inline-flex", border: "1px solid var(--border-strong)", borderRadius: 9, overflow: "hidden" }}>
          {([1, 0] as const).map((v) => (
            <button
              key={v}
              onClick={() => setYTrue(v)}
              style={{
                border: "none",
                cursor: "pointer",
                padding: "7px 13px",
                fontSize: 12.5,
                fontWeight: yTrue === v ? 600 : 400,
                color: yTrue === v ? "var(--cta-text, var(--surface))" : "var(--muted)",
                background: yTrue === v ? "var(--c-classification)" : "transparent",
              }}
            >
              truth: class {v}
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <Metric label="log loss pays" value={ll > 99 ? "∞" : ll.toFixed(2)} warn={ll > 2.5} />
        <Metric label="squared error pays" value={mse.toFixed(2)} />
      </div>
    </div>
  );
}

function Metric({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div style={{ background: "var(--surface-2)", borderRadius: 9, padding: "6px 11px" }}>
      <div style={{ fontSize: 10, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 500, color: warn ? "var(--bad)" : "var(--ink)", fontFamily: "var(--font-geist-mono, monospace)" }}>{value}</div>
    </div>
  );
}

const frame: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border-strong)",
  borderRadius: 14,
  padding: "16px 16px 14px",
};
