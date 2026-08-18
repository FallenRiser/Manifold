"use client";

import { useMemo, useState } from "react";

// The epsilon-insensitive tube, made tangible. A fitted line runs through noisy
// data; drag epsilon to widen or narrow the tube around it. Points INSIDE the
// tube cost nothing and are ignored; points ON or OUTSIDE it are the SUPPORT
// VECTORS that alone define the model. Wider tube -> fewer support vectors ->
// sparser, flatter model. (The line is a fixed least-squares fit; the lab
// illustrates the tube + support-vector mechanics, which are exact.)

const ACCENT = "var(--c-regression)";

function mulberry32(a: number) {
  return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// deterministic data: a roughly linear trend + noise + two outliers
const DATA = (() => {
  const rand = mulberry32(11);
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < 20; i++) {
    const x = (i + 0.5) / 20;
    pts.push({ x, y: 0.28 + 0.46 * x + (rand() - 0.5) * 0.22 });
  }
  pts.push({ x: 0.34, y: 0.82 });   // outlier above
  pts.push({ x: 0.7, y: 0.16 });    // outlier below
  return pts;
})();

// ordinary least-squares line through the data (a stand-in "fit")
const FIT = (() => {
  const n = DATA.length;
  const mx = DATA.reduce((s, p) => s + p.x, 0) / n;
  const my = DATA.reduce((s, p) => s + p.y, 0) / n;
  let num = 0, den = 0;
  for (const p of DATA) { num += (p.x - mx) * (p.y - my); den += (p.x - mx) ** 2; }
  const slope = num / den;
  return { slope, intercept: my - slope * mx };
})();
const fitY = (x: number) => FIT.intercept + FIT.slope * x;

export function SVRTubeLab() {
  const [eps, setEps] = useState(0.04);

  const W = 360, H = 240, pad = 26;
  const px = (x: number) => (pad + x * (W - 2 * pad)).toFixed(2);
  const py = (y: number) => (H - pad - y * (H - 2 * pad)).toFixed(2);

  const { nSV } = useMemo(() => {
    let sv = 0;
    for (const p of DATA) if (Math.abs(p.y - fitY(p.x)) > eps + 1e-9) sv++;
    return { nSV: sv };
  }, [eps]);

  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
        <span style={head}>The ε-insensitive tube</span>
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>filled: support vectors · hollow: free</span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        {/* tube band */}
        <polygon
          points={`${px(0)},${py(fitY(0) + eps)} ${px(1)},${py(fitY(1) + eps)} ${px(1)},${py(fitY(1) - eps)} ${px(0)},${py(fitY(0) - eps)}`}
          fill="color-mix(in srgb, var(--c-regression) 12%, transparent)" stroke="none"
        />
        {/* tube edges */}
        <line x1={px(0)} y1={py(fitY(0) + eps)} x2={px(1)} y2={py(fitY(1) + eps)} stroke={ACCENT} strokeWidth={1} strokeDasharray="4 3" opacity={0.7} />
        <line x1={px(0)} y1={py(fitY(0) - eps)} x2={px(1)} y2={py(fitY(1) - eps)} stroke={ACCENT} strokeWidth={1} strokeDasharray="4 3" opacity={0.7} />
        {/* fit line */}
        <line x1={px(0)} y1={py(fitY(0))} x2={px(1)} y2={py(fitY(1))} stroke={ACCENT} strokeWidth={2.4} />
        {/* points */}
        {DATA.map((p, i) => {
          const isSV = Math.abs(p.y - fitY(p.x)) > eps + 1e-9;
          return (
            <circle key={i} cx={px(p.x)} cy={py(p.y)} r={isSV ? 4.4 : 3.6}
              fill={isSV ? "var(--c-classification)" : "none"}
              stroke={isSV ? "var(--ink)" : "var(--muted)"} strokeWidth={isSV ? 1 : 1.4} />
          );
        })}
      </svg>

      <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "var(--muted)", marginTop: 12 }}>
        <span style={{ minWidth: 118 }}>ε (tube half-width): <b style={{ color: "var(--ink)", fontFamily: "ui-monospace, monospace" }}>{eps.toFixed(2)}</b></span>
        <input type="range" min={0.02} max={0.30} step={0.01} value={eps} onChange={(e) => setEps(Number(e.target.value))} style={{ flex: 1, accentColor: ACCENT }} aria-label="epsilon tube half-width" />
      </label>

      <div style={{ display: "flex", gap: 18, marginTop: 8 }}>
        <div><div style={{ fontSize: 11, color: "var(--muted)" }}>support vectors</div><div style={{ fontFamily: "ui-monospace, monospace", fontSize: 16, color: ACCENT }}>{nSV} of {DATA.length}</div></div>
        <div><div style={{ fontSize: 11, color: "var(--muted)" }}>free points (ignored)</div><div style={{ fontFamily: "ui-monospace, monospace", fontSize: 16, color: "var(--ink)" }}>{DATA.length - nSV}</div></div>
      </div>

      <div style={caption}>
        Errors <strong>inside the tube</strong> cost nothing — those points could move freely without changing
        the fit. Only the <strong>support vectors</strong> (on or outside the tube) matter. Widen ε and watch
        support vectors turn into free points: the model gets sparser and flatter. The two outliers stay support
        vectors but their pull is <em>bounded</em> — that&rsquo;s SVR&rsquo;s robustness.
      </div>
    </div>
  );
}

const wrap: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, margin: "1.6rem 0" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)" };
const caption: React.CSSProperties = { fontSize: 12.5, color: "var(--muted)", marginTop: 12, lineHeight: 1.55 };
