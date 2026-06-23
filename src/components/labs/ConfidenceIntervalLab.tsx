"use client";

import { useState } from "react";

// A confidence interval for the slope narrows as the sample size grows: the standard
// error of the slope shrinks like 1/√n, so more data = a tighter, more certain estimate.
const TRUE_SLOPE = 2.0;
const SIGMA = 3.0;       // noise level
const SPREAD = 2.0;      // sd of x

export function ConfidenceIntervalLab() {
  const [n, setN] = useState(20);

  // SE(slope) = sigma / (sd_x * sqrt(n))
  const se = SIGMA / (SPREAD * Math.sqrt(n));
  const lo = TRUE_SLOPE - 1.96 * se;
  const hi = TRUE_SLOPE + 1.96 * se;

  const W = 320, H = 90;
  const SMIN = 0.5, SMAX = 3.5;
  const sx = (s: number) => 20 + ((s - SMIN) / (SMAX - SMIN)) * (W - 40);

  return (
    <div style={wrap}>
      <div style={head}>Confidence interval for the slope</div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <line x1={20} y1={60} x2={W - 20} y2={60} stroke="var(--border-strong)" />
        {[1, 2, 3].map((t) => (
          <g key={t}>
            <line x1={sx(t)} y1={56} x2={sx(t)} y2={64} stroke="var(--faint)" />
            <text x={sx(t)} y={78} fontSize={10} fill="var(--faint)" textAnchor="middle">{t.toFixed(1)}</text>
          </g>
        ))}
        {/* true slope marker */}
        <line x1={sx(TRUE_SLOPE)} y1={20} x2={sx(TRUE_SLOPE)} y2={60} stroke="var(--good)" strokeWidth={1.4} strokeDasharray="3 3" />
        <text x={sx(TRUE_SLOPE)} y={15} fontSize={9.5} fill="var(--good)" textAnchor="middle">true = 2.0</text>
        {/* CI band */}
        <rect x={sx(lo)} y={38} width={Math.max(2, sx(hi) - sx(lo))} height={12} rx={6} fill="color-mix(in srgb, var(--brand) 30%, transparent)" stroke="var(--brand)" />
        <circle cx={sx(TRUE_SLOPE)} cy={44} r={3.5} fill="var(--brand)" />
      </svg>
      <div style={{ display: "flex", gap: 14, margin: "10px 0 2px" }}>
        <S label="n" value={String(n)} />
        <S label="SE(slope)" value={se.toFixed(3)} />
        <S label="95% CI" value={`[${lo.toFixed(2)}, ${hi.toFixed(2)}]`} color="var(--brand)" />
      </div>
      <div style={{ marginTop: 12 }}>
        <div style={rowLbl}><span>Sample size n</span><span style={mono}>{n}</span></div>
        <input type="range" min={5} max={500} step={1} value={n}
          onChange={(e) => setN(parseInt(e.target.value))}
          style={{ width: "100%", accentColor: "var(--brand)", cursor: "ew-resize" }} />
      </div>
      <div style={caption}>
        The interval width scales like 1/√n. Going from n=20 to n=80 (4×) only halves it —
        diminishing returns are the reason precise estimates need a lot of data.
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
