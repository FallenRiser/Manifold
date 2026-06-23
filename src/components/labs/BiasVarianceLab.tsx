"use client";

import { useState } from "react";

// Expected test error decomposes into bias² + variance + irreducible noise. Simple models
// have high bias, low variance; complex models flip it. Total error is a U — the minimum is
// the bias–variance trade-off point. This lab plots the decomposition against complexity.
const DMAX = 12;
const NOISE = 0.08;                                  // irreducible

function bias2(d: number) { return 0.85 * Math.exp(-d * 0.5); }
function variance(d: number) { return 0.015 * Math.pow(d, 1.7); }
function total(d: number) { return bias2(d) + variance(d) + NOISE; }

export function BiasVarianceLab() {
  const [deg, setDeg] = useState(4);

  let best = 1, bestT = Infinity;
  for (let d = 1; d <= DMAX; d++) if (total(d) < bestT) { bestT = total(d); best = d; }

  const W = 320, H = 200;
  const px = (d: number) => 30 + ((d - 1) / (DMAX - 1)) * (W - 50);
  const emax = Math.max(total(1), total(DMAX)) * 1.05;
  const py = (e: number) => Math.round((H - 26 - (e / emax) * (H - 46)) * 100) / 100;
  const line = (f: (d: number) => number) => Array.from({ length: DMAX }, (_, i) => `${i === 0 ? "M" : "L"}${px(i + 1).toFixed(1)},${py(f(i + 1)).toFixed(1)}`).join(" ");

  return (
    <div style={wrap}>
      <div style={head}>The bias–variance decomposition</div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        <line x1={px(best)} y1={12} x2={px(best)} y2={H - 26} stroke="var(--good)" strokeWidth={1} strokeDasharray="3 3" strokeOpacity={0.6} />
        <path d={line(bias2)} fill="none" stroke="var(--c-regression)" strokeWidth={1.8} />
        <path d={line(variance)} fill="none" stroke="var(--warn)" strokeWidth={1.8} />
        <path d={line(total)} fill="none" stroke="var(--brand)" strokeWidth={2.4} />
        <line x1={px(deg)} y1={12} x2={px(deg)} y2={H - 26} stroke="var(--ink)" strokeWidth={1.2} strokeOpacity={0.5} />
        <circle cx={px(deg)} cy={py(total(deg))} r={4} fill="var(--brand)" />
        <text x={W - 14} y={py(bias2(DMAX)) + 10} fontSize={9.5} fill="var(--c-regression)" textAnchor="end">bias²</text>
        <text x={W - 14} y={py(variance(DMAX)) - 4} fontSize={9.5} fill="var(--warn)" textAnchor="end">variance</text>
        <text x={px(2)} y={py(total(2)) - 6} fontSize={9.5} fill="var(--brand)">total error</text>
        <text x={W / 2} y={H - 8} fontSize={10} fill="var(--faint)" textAnchor="middle">model complexity →</text>
      </svg>
      <div style={{ display: "flex", gap: 14, margin: "8px 0 2px" }}>
        <S label="bias²" value={bias2(deg).toFixed(2)} color="var(--c-regression)" />
        <S label="variance" value={variance(deg).toFixed(2)} color="var(--warn)" />
        <S label="total" value={total(deg).toFixed(2)} color="var(--brand)" />
      </div>
      <div style={{ marginTop: 12 }}>
        <div style={rowLbl}><span>Model complexity</span><span style={mono}>{deg}</span></div>
        <input type="range" min={1} max={DMAX} step={1} value={deg}
          onChange={(e) => setDeg(parseInt(e.target.value))}
          style={{ width: "100%", accentColor: "var(--brand)", cursor: "ew-resize" }} />
      </div>
      <div style={caption}>
        {deg < best ? "Too simple: bias² dominates — the model can't capture the pattern."
          : deg > best ? "Too complex: variance dominates — the model chases noise."
          : `Balanced at complexity ${best}: bias² and variance trade off to minimise total error.`}
      </div>
    </div>
  );
}

function S({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 15, color: color || "var(--ink)" }}>{value}</div>
    </div>
  );
}

const wrap: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, margin: "1.6rem 0" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)", marginBottom: 12 };
const rowLbl: React.CSSProperties = { display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--muted)", marginBottom: 6 };
const mono: React.CSSProperties = { fontFamily: "ui-monospace, monospace", fontSize: 14, color: "var(--ink)" };
const caption: React.CSSProperties = { fontSize: 12.5, color: "var(--muted)", marginTop: 14, lineHeight: 1.5 };
