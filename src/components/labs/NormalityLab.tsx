"use client";

import { useState } from "react";

// One assumption is that residuals are normally distributed. This lab skews a residual
// distribution and overlays the matching normal bell — you watch the histogram pull away.
const NBIN = 19;

export function NormalityLab() {
  const [skew, setSkew] = useState(0);

  // build a histogram over [-3,3]; skew warps a base normal toward the right tail
  const edges = Array.from({ length: NBIN + 1 }, (_, i) => -3 + (6 * i) / NBIN);
  const mids = edges.slice(0, -1).map((e, i) => (e + edges[i + 1]) / 2);
  const raw = mids.map((z) => {
    const warp = z - skew * (z * z - 1) * 0.5;          // Edgeworth-style skew warp
    return Math.exp(-warp * warp / 2);
  });
  const norm = mids.map((z) => Math.exp(-z * z / 2));
  const rmax = Math.max(...raw, ...norm);

  const W = 320, H = 170;
  const bx = (i: number) => 24 + (i / NBIN) * (W - 44);
  const bw = (W - 44) / NBIN - 2;
  const by = (v: number) => Math.round((H - 24 - (v / rmax) * (H - 44)) * 100) / 100;

  const sk = Math.abs(skew);
  const verdict = sk < 0.15 ? { t: "approximately normal", c: "var(--good)" } : sk < 0.5 ? { t: "mild skew", c: "var(--warn)" } : { t: "strongly non-normal", c: "var(--bad)" };

  return (
    <div style={wrap}>
      <div style={head}>Are the residuals normal?</div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        {raw.map((v, i) => (
          <rect key={i} x={bx(i)} y={by(v)} width={bw} height={H - 24 - by(v)} rx={1.5} fill={verdict.c} fillOpacity={0.45} />
        ))}
        {/* ideal normal overlay */}
        <path d={norm.map((v, i) => `${i === 0 ? "M" : "L"}${(bx(i) + bw / 2).toFixed(1)},${by(v).toFixed(1)}`).join(" ")}
          fill="none" stroke="var(--brand)" strokeWidth={2} />
        <text x={W / 2} y={H - 6} fontSize={10} fill="var(--faint)" textAnchor="middle">residual</text>
      </svg>
      <div style={{ display: "flex", gap: 16, margin: "8px 0 2px" }}>
        <S label="skewness" value={skew.toFixed(2)} />
        <S label="verdict" value={verdict.t} color={verdict.c} />
      </div>
      <div style={{ marginTop: 12 }}>
        <div style={rowLbl}><span>Skew the residuals</span><span style={mono}>{skew.toFixed(2)}</span></div>
        <input type="range" min={-1} max={1} step={0.05} value={skew}
          onChange={(e) => setSkew(parseFloat(e.target.value))}
          style={{ width: "100%", accentColor: "var(--brand)", cursor: "ew-resize" }} />
      </div>
      <div style={caption}>
        The purple bell is the normal the model assumes. As the histogram skews away from it,
        confidence intervals and p-values built on normality start to lie.
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
