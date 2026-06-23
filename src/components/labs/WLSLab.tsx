"use client";

import { useState } from "react";

// Under heteroscedasticity, OLS treats every point as equally trustworthy, so noisy
// high-variance points yank the line around. Weighted least squares downweights them by
// 1/variance, letting the precise low-variance points dominate — a better, tighter fit.
const N = 30;
// fan-shaped data: variance grows with x. low-x points are precise, high-x points noisy.
const DATA = Array.from({ length: N }, (_, i) => {
  const x = (i / (N - 1)) * 10;
  const j = Math.sin(i * 78.233) * 43758.5453;
  const noise = (j - Math.floor(j)) * 2 - 1;
  const sd = 0.5 + (x / 10) * 6;                      // spread grows
  return { x, y: 3 + 1.5 * x + noise * sd, w: 1 / (sd * sd) };
});

function wls(useW: boolean) {
  let sw = 0, swx = 0, swy = 0, swxx = 0, swxy = 0;
  for (const p of DATA) {
    const w = useW ? p.w : 1;
    sw += w; swx += w * p.x; swy += w * p.y; swxx += w * p.x * p.x; swxy += w * p.x * p.y;
  }
  const b = (sw * swxy - swx * swy) / (sw * swxx - swx * swx);
  const a = (swy - b * swx) / sw;
  return { a, b };
}

export function WLSLab() {
  const [weighted, setWeighted] = useState(false);
  const fit = wls(weighted);

  const W = 320, H = 200;
  const cx = (x: number) => Math.round((28 + (x / 10) * (W - 48)) * 100) / 100;
  const ymin = -2, ymax = 30;
  const cy = (y: number) => Math.round((H - 24 - ((y - ymin) / (ymax - ymin)) * (H - 44)) * 100) / 100;
  const maxW = Math.max(...DATA.map((p) => p.w));

  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={head}>OLS vs weighted least squares</span>
        <button onClick={() => setWeighted((v) => !v)} style={btn(weighted)}>{weighted ? "WLS (1/variance)" : "plain OLS"}</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        <line x1={cx(0)} y1={cy(fit.a)} x2={cx(10)} y2={cy(fit.a + fit.b * 10)} stroke="var(--brand)" strokeWidth={2.4} />
        {DATA.map((p, i) => (
          <circle key={i} cx={cx(p.x)} cy={cy(p.y)}
            r={weighted ? 2 + (p.w / maxW) * 5 : 3.2}
            fill="var(--c-regression)" fillOpacity={weighted ? 0.45 + (p.w / maxW) * 0.5 : 0.7} />
        ))}
        <text x={W / 2} y={H - 6} fontSize={10} fill="var(--faint)" textAnchor="middle">x →</text>
        <text x={12} y={H / 2} fontSize={10} fill="var(--faint)" textAnchor="middle" transform={`rotate(-90 12 ${H / 2})`}>y →</text>
      </svg>
      <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
        <S label="intercept" value={fit.a.toFixed(2)} />
        <S label="slope" value={fit.b.toFixed(2)} color="var(--brand)" />
      </div>
      <div style={caption}>
        {weighted
          ? "WLS scales each point by 1/variance (dot size = weight). The precise low-x points anchor the line; the noisy high-x points barely tug it. Estimates are more efficient."
          : "OLS gives every point equal say, so the noisy high-variance points on the right swing the line. Toggle WLS to downweight them."}
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
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)" };
const caption: React.CSSProperties = { fontSize: 12.5, color: "var(--muted)", marginTop: 14, lineHeight: 1.5 };
function btn(active: boolean): React.CSSProperties {
  return { fontSize: 12, fontFamily: "ui-monospace, monospace", padding: "5px 11px", borderRadius: 999, cursor: "pointer", border: "1px solid var(--brand)", background: active ? "var(--brand)" : "transparent", color: active ? "white" : "var(--brand)" };
}
