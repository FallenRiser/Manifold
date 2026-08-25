"use client";

import { useMemo, useState } from "react";

// The scale trap. Two features with an underlying diagonal correlation, but
// feature 1 ("proline-like", range ~1800) dwarfs feature 2 ("hue-like",
// range ~1.6). On the RAW data, covariance is measured in feature-1 units², so
// PC1 lies almost exactly along feature 1 and captures ~100% of the "variance" —
// it has simply found the feature with the biggest numbers. Standardize each
// feature to unit variance first and PC1 swings to the true 45° structure.
// Data + both loadings are a real run (scripts/pca_cases.py style, seed 3).

const DATA: [number, number][] = [
  [1458, 1.298], [43, 0.134], [876, 1.145], [650, 0.918], [265, 0.586], [798, 0.835],
  [19, 0.42], [470, 0.818], [514, 0.883], [1821, 1.749], [754, 1.052], [505, 0.736],
  [659, 1.026], [533, 0.761], [592, 0.614], [712, 0.652], [908, 1.27], [802, 0.966],
  [1003, 1.301], [569, 1.019], [817, 0.995], [1274, 1.313], [878, 1.015], [494, 0.721],
  [713, 1.05], [603, 0.941], [1403, 1.426], [718, 0.839], [470, 0.907], [1048, 1.294],
  [358, 0.564], [743, 0.678],
];
const M1 = 733.483, S1 = 373.737, M2 = 0.935, S2 = 0.317;

const VW = 380, VH = 340;
const PAD = { l: 46, r: 16, t: 16, b: 40 };
const X0 = PAD.l, X1 = VW - PAD.r, Y0 = VH - PAD.b, Y1 = PAD.t;

export function StandardizeLab() {
  const [std, setStd] = useState(false);
  const dim = "var(--c-dimred)";

  // displayed coordinates in the current mode
  const disp = useMemo(() => {
    if (std) {
      // z-scores mapped from [-2.7, 2.7]
      const m = (z: number) => (z + 2.7) / 5.4;
      return DATA.map(([f1, f2]) => {
        const zx = (f1 - M1) / S1, zy = (f2 - M2) / S2;
        return [X0 + m(zx) * (X1 - X0), Y0 - m(zy) * (Y0 - Y1)] as [number, number];
      });
    }
    return DATA.map(([f1, f2]) => [
      X0 + (f1 / 1900) * (X1 - X0),
      Y0 - (f2 / 1.9) * (Y0 - Y1),
    ] as [number, number]);
  }, [std]);

  // PC1 of the displayed cloud (so the drawn axis matches the eye)
  const { cx, cy, ang } = useMemo(() => {
    const n = disp.length;
    let mx = 0, my = 0;
    for (const [x, y] of disp) { mx += x; my += y; }
    mx /= n; my /= n;
    let a = 0, b = 0, c = 0;
    for (const [x, y] of disp) { const dx = x - mx, dy = y - my; a += dx * dx; b += dx * dy; c += dy * dy; }
    return { cx: mx, cy: my, ang: 0.5 * Math.atan2(2 * b, a - c) };
  }, [disp]);

  const f = (n: number) => n.toFixed(1);
  const ln = 150;
  const ux = Math.cos(ang), uy = Math.sin(ang);

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.6rem 0" }} className="not-prose">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <span className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
          Same data, before and after standardizing
        </span>
        <label style={{ fontSize: 12.5, color: "var(--muted)", display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
          <input type="checkbox" checked={std} onChange={(e) => setStd(e.target.checked)} />
          standardize features
        </label>
      </div>

      <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", maxWidth: 360, height: "auto", display: "block", margin: "0 auto" }}>
        <rect x={X0} y={Y1} width={X1 - X0} height={Y0 - Y1} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        {/* PC1 line */}
        <line x1={f(cx - ux * ln)} y1={f(cy + uy * ln)} x2={f(cx + ux * ln)} y2={f(cy - uy * ln)} stroke={dim} strokeWidth={2.6} strokeLinecap="round" />
        {disp.map(([x, y], i) => <circle key={i} cx={f(x)} cy={f(y)} r={3.6} fill="var(--ink)" fillOpacity={0.72} />)}
        <text x={(X0 + X1) / 2} y={VH - 12} fontSize={11} fill="var(--faint)" textAnchor="middle">{std ? "feature 1 (standardized) →" : "feature 1 — proline-like, big scale →"}</text>
        <text x={15} y={(Y0 + Y1) / 2} fontSize={11} fill="var(--faint)" textAnchor="middle" transform={`rotate(-90 15 ${(Y0 + Y1) / 2})`}>{std ? "feature 2 (standardized) →" : "feature 2 — tiny →"}</text>
      </svg>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
        {std ? (
          <>
            <Metric label="PC1 loadings" value="(0.71, 0.71)" accent={dim} mono />
            <Metric label="PC1 variance" value="95.2%" />
            <Metric label="reads as" value="a real 45° pattern" />
          </>
        ) : (
          <>
            <Metric label="PC1 loadings" value="(1.00, 0.00)" accent={dim} mono />
            <Metric label="PC1 variance" value="~100%" />
            <Metric label="reads as" value="just feature 1" accent="var(--bad)" />
          </>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value, accent, mono }: { label: string; value: string; accent?: string; mono?: boolean }) {
  return (
    <div style={{ background: "var(--surface-2)", borderRadius: 10, padding: "7px 11px", minWidth: 96 }}>
      <div style={{ fontSize: 10.5, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 500, color: accent ?? "var(--ink)", fontFamily: mono ? "var(--font-geist-mono, monospace)" : undefined }}>{value}</div>
    </div>
  );
}
