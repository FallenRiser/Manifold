"use client";

import { useState } from "react";

// A coefficient's t-statistic is estimate / standard error. Under the null (true effect = 0)
// t follows roughly a standard normal; |t| > 1.96 puts the observed value in the tails,
// giving p < 0.05. More noise shrinks t toward 0 and the effect stops being significant.
const EFFECT = 1.0;   // true coefficient
const N = 50;

export function HypothesisTestLab() {
  const [noise, setNoise] = useState(2.0);

  const se = noise / Math.sqrt(N);
  const t = EFFECT / se;
  // two-sided p-value via a normal-tail approximation
  const p = 2 * (1 - normCdf(Math.abs(t)));
  const sig = p < 0.05;

  const W = 320, H = 130;
  const cx = (z: number) => W / 2 + z * 42;
  const cy = (d: number) => H - 24 - d * 220;
  // standard normal curve
  const path = Array.from({ length: 81 }, (_, i) => {
    const z = -4 + (i / 80) * 8;
    return `${i === 0 ? "M" : "L"}${cx(z).toFixed(1)},${cy(Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI)).toFixed(1)}`;
  }).join(" ");
  const tClamp = Math.max(-3.9, Math.min(3.9, t));

  return (
    <div style={wrap}>
      <div style={head}>Is the effect real? The t-statistic & p-value</div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        {/* rejection regions |z|>1.96 */}
        <rect x={cx(1.96)} y={6} width={cx(4) - cx(1.96)} height={H - 30} fill="color-mix(in srgb, var(--bad) 12%, transparent)" />
        <rect x={cx(-4)} y={6} width={cx(-1.96) - cx(-4)} height={H - 30} fill="color-mix(in srgb, var(--bad) 12%, transparent)" />
        <path d={path} fill="none" stroke="var(--muted)" strokeWidth={1.5} />
        <line x1={cx(0)} y1={H - 24} x2={cx(0)} y2={cy(0.4)} stroke="var(--faint)" strokeDasharray="2 2" />
        {/* observed t */}
        <line x1={cx(tClamp)} y1={14} x2={cx(tClamp)} y2={H - 24} stroke={sig ? "var(--good)" : "var(--warn)"} strokeWidth={2} />
        <text x={cx(tClamp)} y={11} fontSize={10} fill={sig ? "var(--good)" : "var(--warn)"} textAnchor="middle">t = {t.toFixed(1)}</text>
        <text x={cx(1.96)} y={H - 8} fontSize={9} fill="var(--bad)" textAnchor="middle">+1.96</text>
        <text x={cx(-1.96)} y={H - 8} fontSize={9} fill="var(--bad)" textAnchor="middle">−1.96</text>
      </svg>
      <div style={{ display: "flex", gap: 14, margin: "10px 0 2px" }}>
        <S label="t-statistic" value={t.toFixed(2)} />
        <S label="p-value" value={p < 0.001 ? "<0.001" : p.toFixed(3)} color={sig ? "var(--good)" : "var(--warn)"} />
        <S label="verdict" value={sig ? "significant" : "not sig."} color={sig ? "var(--good)" : "var(--warn)"} />
      </div>
      <div style={{ marginTop: 12 }}>
        <div style={rowLbl}><span>Noise level (residual spread)</span><span style={mono}>{noise.toFixed(1)}</span></div>
        <input type="range" min={0.3} max={8} step={0.1} value={noise}
          onChange={(e) => setNoise(parseFloat(e.target.value))}
          style={{ width: "100%", accentColor: "var(--brand)", cursor: "ew-resize" }} />
      </div>
      <div style={caption}>
        {sig
          ? `t = ${t.toFixed(1)} lands in the tail — only a ${(p * 100).toFixed(1)}% chance of seeing this if the true effect were zero. We reject the null.`
          : `With this much noise, t = ${t.toFixed(1)} sits near the centre. The effect is real, but the data can't distinguish it from zero — p = ${p.toFixed(2)}.`}
      </div>
    </div>
  );
}

function normCdf(z: number) {
  // Abramowitz–Stegun approximation
  const t = 1 / (1 + 0.2316419 * z);
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return 1 - prob;
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
