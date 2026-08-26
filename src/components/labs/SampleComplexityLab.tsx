"use client";

import { useState } from "react";

// How much data does a class need? Two regimes, one picture.
//
//   realizable (some h in H has zero error):  n >= (ln M + ln(1/δ)) / ε
//   agnostic   (the best h is merely best):   n >= (ln M + ln(2/δ)) / (2ε²)
//
// The whole lesson is the exponent on ε. Both curves fall as the accuracy
// demand relaxes, but the agnostic curve is a full order of magnitude above
// the realizable one by ε = 0.05 and pulls further away as ε shrinks — because
// eliminating impostors is cheap while ESTIMATING everyone's risk is not.
//
// A log y-axis is used deliberately: the gap between the curves is a constant
// vertical offset that grows as ε shrinks, which is exactly what "1/ε versus
// 1/ε² " looks like when you plot it honestly.
//
// Everything is the closed form evaluated live — self-verifying, no dataset.

const VW = 380, VH = 205, PAD = { l: 42, r: 14, t: 14, b: 34 };
const X0 = PAD.l, X1 = VW - PAD.r, Y0 = VH - PAD.b, Y1 = PAD.t;
const EPS_MIN = 0.01, EPS_MAX = 0.30;
const LOGN_MAX = 6;

const nReal = (eps: number, lnM: number, delta: number) => (lnM + Math.log(1 / delta)) / eps;
const nAgn = (eps: number, lnM: number, delta: number) => (lnM + Math.log(2 / delta)) / (2 * eps * eps);

const px = (eps: number) => X0 + ((eps - EPS_MIN) / (EPS_MAX - EPS_MIN)) * (X1 - X0);
const py = (n: number) => Y0 - Math.min(LOGN_MAX, Math.max(0, Math.log10(Math.max(1, n)))) / LOGN_MAX * (Y0 - Y1);

export function SampleComplexityLab() {
  const [eps, setEps] = useState(0.05);
  const [log10M, setLog10M] = useState(3);   // |H| = 10^3
  const [delta, setDelta] = useState(0.05);

  const accent = "var(--c-metrics)";
  const REAL = "var(--ink)";
  const AGN = "var(--brand-2)";

  const lnM = Math.log(10) * log10M;
  const nR = nReal(eps, lnM, delta);
  const nA = nAgn(eps, lnM, delta);

  const curve = (f: (e: number, l: number, d: number) => number) => {
    const pts: string[] = [];
    for (let i = 0; i <= 70; i++) {
      const e = EPS_MIN + (i / 70) * (EPS_MAX - EPS_MIN);
      pts.push(`${px(e).toFixed(2)},${py(f(e, lnM, delta)).toFixed(2)}`);
    }
    return pts.join(" ");
  };

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.6rem 0" }} className="not-prose">
      <div className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", marginBottom: 2 }}>
        Examples needed, by regime
      </div>
      <div style={{ fontSize: 12, color: "var(--faint)", marginBottom: 10 }}>
        log scale — each gridline is ten times the data
      </div>

      <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", maxWidth: 380, height: "auto", display: "block" }}>
        <rect x={X0} y={Y1} width={X1 - X0} height={Y0 - Y1} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />

        {[1, 2, 3, 4, 5].map((k) => (
          <line key={k} x1={X0} y1={py(Math.pow(10, k))} x2={X1} y2={py(Math.pow(10, k))} stroke="var(--border)" strokeWidth={0.75} opacity={0.7} />
        ))}

        <polyline points={curve(nAgn)} fill="none" stroke={AGN} strokeWidth={2} />
        <polyline points={curve(nReal)} fill="none" stroke={REAL} strokeWidth={2} />

        <line x1={px(eps)} y1={Y1} x2={px(eps)} y2={Y0} stroke={accent} strokeWidth={1} strokeDasharray="2 3" opacity={0.55} />
        <circle cx={Number(px(eps).toFixed(2))} cy={Number(py(nA).toFixed(2))} r={4.5} fill={AGN} />
        <circle cx={Number(px(eps).toFixed(2))} cy={Number(py(nR).toFixed(2))} r={4.5} fill={REAL} />

        {[0, 2, 4, 6].map((k) => (
          <text key={k} x={X0 - 6} y={py(Math.pow(10, k)) + 3.5} fontSize={9.5} fill="var(--faint)" textAnchor="end">
            {k === 0 ? "1" : `10^${k}`}
          </text>
        ))}
        <text x={X0 - 32} y={Y1 + 42} fontSize={9.5} fill="var(--muted)" transform={`rotate(-90 ${X0 - 32} ${Y1 + 42})`}>examples n</text>

        {[0.01, 0.1, 0.2, 0.3].map((v) => (
          <text key={v} x={px(v)} y={Y0 + 14} fontSize={9.5} fill="var(--faint)" textAnchor="middle">{v.toFixed(2)}</text>
        ))}
        <text x={(X0 + X1) / 2} y={Y0 + 27} fontSize={10} fill="var(--muted)" textAnchor="middle">target accuracy ε</text>

        <g>
          <line x1={X1 - 118} y1={Y1 + 10} x2={X1 - 104} y2={Y1 + 10} stroke={AGN} strokeWidth={2} />
          <text x={X1 - 100} y={Y1 + 13.5} fontSize={9.5} fill={AGN}>agnostic · 1/ε²</text>
          <line x1={X1 - 118} y1={Y1 + 23} x2={X1 - 104} y2={Y1 + 23} stroke={REAL} strokeWidth={2} />
          <text x={X1 - 100} y={Y1 + 26.5} fontSize={9.5} fill="var(--muted)">realizable · 1/ε</text>
        </g>
      </svg>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px 12px", marginTop: 12 }}>
        <label style={{ fontSize: 12, color: "var(--muted)" }}>
          ε = {eps.toFixed(2)}
          <input type="range" min={EPS_MIN} max={EPS_MAX} step={0.01} value={eps} onChange={(e) => setEps(Number(e.target.value))} style={{ width: "100%", accentColor: accent }} />
        </label>
        <label style={{ fontSize: 12, color: "var(--muted)" }}>
          |H| = 10^{log10M}
          <input type="range" min={1} max={9} step={1} value={log10M} onChange={(e) => setLog10M(Number(e.target.value))} style={{ width: "100%", accentColor: accent }} />
        </label>
        <label style={{ fontSize: 12, color: "var(--muted)" }}>
          δ = {delta.toFixed(2)}
          <input type="range" min={0.01} max={0.2} step={0.01} value={delta} onChange={(e) => setDelta(Number(e.target.value))} style={{ width: "100%", accentColor: accent }} />
        </label>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12, alignItems: "center" }}>
        <Metric label="realizable" value={Math.ceil(nR).toLocaleString()} sub="a perfect h exists" />
        <Metric label="agnostic" value={Math.ceil(nA).toLocaleString()} accent={AGN} big />
        <Metric label="the price of noise" value={`×${(nA / nR).toFixed(1)}`} sub="agnostic ÷ realizable" />
      </div>
    </div>
  );
}

function Metric({ label, value, sub, accent, big }: { label: string; value: string; sub?: string; accent?: string; big?: boolean }) {
  return (
    <div style={{ background: "var(--surface-2)", borderRadius: 10, padding: "6px 10px", minWidth: 92 }}>
      <div style={{ fontSize: 10.5, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontSize: big ? 19 : 15, fontWeight: 500, color: accent ?? "var(--ink)" }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: "var(--faint)" }}>{sub}</div>}
    </div>
  );
}
