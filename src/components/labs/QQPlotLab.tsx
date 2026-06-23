"use client";

import { useState } from "react";

// A Q–Q plot ranks the residuals and plots them against the quantiles a normal would
// produce. Perfectly normal data hugs the 45° line; skew bends it, heavy tails make the
// ends fly off. This lab lets you dial skew and watch the curve peel away from the line.
const N = 40;

export function QQPlotLab() {
  const [skew, setSkew] = useState(0);

  // theoretical normal quantiles (probit of evenly spaced plotting positions)
  const pts = Array.from({ length: N }, (_, i) => {
    const p = (i + 0.5) / N;
    const z = probit(p);
    // sample quantile = normal quantile warped by skew (cubic term)
    const s = z + skew * (z * z * z - 3 * z) * 0.18;
    return { z, s };
  });

  const W = 240, H = 200;
  const lo = -2.6, hi = 2.6;
  const cx = (v: number) => Math.round((28 + ((v - lo) / (hi - lo)) * (W - 44)) * 100) / 100;
  const cy = (v: number) => Math.round((H - 24 - ((v - lo) / (hi - lo)) * (H - 44)) * 100) / 100;

  const sk = Math.abs(skew);
  const verdict = sk < 0.15 ? { t: "normal — points on the line", c: "var(--good)" } : sk < 0.5 ? { t: "mild departure", c: "var(--warn)" } : { t: "clearly non-normal", c: "var(--bad)" };

  return (
    <div style={wrap}>
      <div style={head}>The Q–Q plot</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 150px", gap: 16, alignItems: "center" }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
          <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
          <line x1={cx(lo)} y1={cy(lo)} x2={cx(hi)} y2={cy(hi)} stroke="var(--brand)" strokeWidth={1.4} strokeDasharray="4 3" strokeOpacity={0.7} />
          {pts.map((p, i) => <circle key={i} cx={cx(p.z)} cy={cy(p.s)} r={3} fill={verdict.c} fillOpacity={0.85} />)}
          <text x={W / 2} y={H - 6} fontSize={10} fill="var(--faint)" textAnchor="middle">theoretical quantile →</text>
          <text x={12} y={H / 2} fontSize={10} fill="var(--faint)" textAnchor="middle" transform={`rotate(-90 12 ${H / 2})`}>sample quantile</text>
        </svg>
        <div style={panel}>
          <S label="skew" value={skew.toFixed(2)} />
          <S label="diagnosis" value={verdict.t} color={verdict.c} />
        </div>
      </div>
      <div style={{ marginTop: 14 }}>
        <div style={rowLbl}><span>Skew the residual distribution</span><span style={mono}>{skew.toFixed(2)}</span></div>
        <input type="range" min={-1} max={1} step={0.05} value={skew}
          onChange={(e) => setSkew(parseFloat(e.target.value))}
          style={{ width: "100%", accentColor: "var(--brand)", cursor: "ew-resize" }} />
      </div>
      <div style={caption}>
        Points on the dashed line = normal. An S-curve or flared ends is the eye-test for
        non-normality — far more sensitive than staring at a histogram.
      </div>
    </div>
  );
}

// rational approximation of the normal quantile (probit) function
function probit(p: number) {
  const a = [-39.69683, 220.9460, -275.9285, 138.3578, -30.66480, 2.506628];
  const b = [-54.47609, 161.5858, -155.6989, 66.80131, -13.28005];
  const c = [-0.007784894, -0.3223964, -2.400758, -2.549732, 4.374664, 2.938163];
  const d = [0.007784695, 0.3224671, 2.445134, 3.754408];
  const pl = 0.02425;
  let q, r;
  if (p < pl) { q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  if (p > 1 - pl) { q = Math.sqrt(-2 * Math.log(1 - p)); return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  q = p - 0.5; r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

function S({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 14, color: color || "var(--ink)" }}>{value}</div>
    </div>
  );
}

const wrap: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, margin: "1.6rem 0" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)", marginBottom: 12 };
const panel: React.CSSProperties = { background: "var(--canvas)", border: "1px solid var(--border-strong)", borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", gap: 14 };
const rowLbl: React.CSSProperties = { display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--muted)", marginBottom: 6 };
const mono: React.CSSProperties = { fontFamily: "ui-monospace, monospace", fontSize: 14, color: "var(--ink)" };
const caption: React.CSSProperties = { fontSize: 12.5, color: "var(--muted)", marginTop: 14, lineHeight: 1.5 };
