"use client";

import { useState } from "react";

// Heteroscedasticity doesn't bias the slope — it biases the *uncertainty*. Ordinary OLS
// standard errors assume constant variance, so under a fan they understate the true error.
// This lab contrasts the naive OLS interval against the honest (robust) one.
export function HeteroImpactLab() {
  const [hetero, setHetero] = useState(0);

  const slope = 2.0;
  // naive OLS SE stays small/constant; the true SE inflates as heteroscedasticity grows
  const seNaive = 0.18;
  const seRobust = 0.18 * (1 + hetero * 2.4);
  const ci = (se: number) => [slope - 1.96 * se, slope + 1.96 * se] as const;
  const [nLo, nHi] = ci(seNaive);
  const [rLo, rHi] = ci(seRobust);

  const W = 320, H = 96;
  const SMIN = 1.0, SMAX = 3.0;
  const sx = (s: number) => 20 + ((s - SMIN) / (SMAX - SMIN)) * (W - 40);
  const naiveCoversWrong = hetero > 0.25;

  return (
    <div style={wrap}>
      <div style={head}>What heteroscedasticity does to inference</div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <line x1={20} y1={70} x2={W - 20} y2={70} stroke="var(--border-strong)" />
        {[1.0, 1.5, 2.0, 2.5, 3.0].map((t) => (
          <text key={t} x={sx(t)} y={86} fontSize={9} fill="var(--faint)" textAnchor="middle">{t.toFixed(1)}</text>
        ))}
        <line x1={sx(slope)} y1={10} x2={sx(slope)} y2={70} stroke="var(--good)" strokeWidth={1.2} strokeDasharray="3 3" />
        {/* naive CI */}
        <rect x={sx(nLo)} y={20} width={Math.max(2, sx(nHi) - sx(nLo))} height={10} rx={5} fill="color-mix(in srgb, var(--bad) 25%, transparent)" stroke="var(--bad)" />
        <text x={sx(nHi) + 6} y={29} fontSize={9.5} fill="var(--bad)">naive OLS</text>
        {/* robust CI */}
        <rect x={sx(rLo)} y={42} width={Math.max(2, sx(rHi) - sx(rLo))} height={10} rx={5} fill="color-mix(in srgb, var(--brand) 25%, transparent)" stroke="var(--brand)" />
        <text x={sx(rHi) + 6} y={51} fontSize={9.5} fill="var(--brand)">robust</text>
      </svg>
      <div style={{ marginTop: 12 }}>
        <div style={rowLbl}><span>Heteroscedasticity strength</span><span style={mono}>{hetero.toFixed(2)}</span></div>
        <input type="range" min={0} max={1} step={0.02} value={hetero}
          onChange={(e) => setHetero(parseFloat(e.target.value))}
          style={{ width: "100%", accentColor: "var(--brand)", cursor: "ew-resize" }} />
      </div>
      <div style={caption}>
        {naiveCoversWrong
          ? "The naive OLS interval (red) is far too narrow — it claims false precision. The robust interval (purple) tells the truth: the slope is much less certain than OLS reports."
          : "With little heteroscedasticity, both intervals roughly agree — naive OLS standard errors are fine here."}
      </div>
    </div>
  );
}

const wrap: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, margin: "1.6rem 0" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)", marginBottom: 12 };
const rowLbl: React.CSSProperties = { display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--muted)", marginBottom: 6 };
const mono: React.CSSProperties = { fontFamily: "ui-monospace, monospace", fontSize: 14, color: "var(--ink)" };
const caption: React.CSSProperties = { fontSize: 12.5, color: "var(--muted)", marginTop: 14, lineHeight: 1.5 };
