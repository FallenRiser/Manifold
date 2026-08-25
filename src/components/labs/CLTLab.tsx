"use client";

import { useMemo, useState } from "react";

// The central limit theorem, simulated. The source is a heavily skewed
// exponential (nothing like a bell curve). Yet average n draws from it, repeat
// thousands of times, and the histogram of those averages becomes Gaussian —
// tighter and more symmetric as n grows. This is why the normal distribution is
// everywhere: sums and averages gravitate to it regardless of the source.

function mulberry32(a: number) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

const VW = 460, VH = 240, PAD = { l: 20, r: 14, t: 14, b: 26 };
const X0 = PAD.l, X1 = VW - PAD.r, Y0 = VH - PAD.b, Y1 = PAD.t;
const NBINS = 34, TRIALS = 4000;
const XMAX = 3; // plot sample-mean range [0, XMAX]

export function CLTLab() {
  const [n, setN] = useState(1);
  const [seed, setSeed] = useState(1);
  const amber = "var(--c-fundamentals)";

  const { bins, mu, se } = useMemo(() => {
    const rnd = mulberry32(seed * 9973 + 7);
    const bins = new Array(NBINS).fill(0);
    for (let t = 0; t < TRIALS; t++) {
      let s = 0;
      for (let i = 0; i < n; i++) s += -Math.log(1 - rnd()); // Exponential(1): mean 1, var 1
      const m = s / n;
      const b = Math.floor((m / XMAX) * NBINS);
      if (b >= 0 && b < NBINS) bins[b]++;
    }
    return { bins, mu: 1, se: 1 / Math.sqrt(n) };
  }, [n, seed]);

  const bmax = Math.max(...bins, 1);
  const bw = (X1 - X0) / NBINS;
  const xToPx = (x: number) => X0 + (x / XMAX) * (X1 - X0);
  // CLT normal overlay: mean 1, sd 1/sqrt(n), scaled to histogram
  const norm: string[] = [];
  for (let i = 0; i <= 120; i++) {
    const x = (i / 120) * XMAX;
    const y = Math.exp(-((x - mu) ** 2) / (2 * se * se)) / (se * Math.sqrt(2 * Math.PI));
    norm.push(`${xToPx(x).toFixed(1)},${(Y0 - (y * (XMAX / NBINS) * TRIALS / bmax) * (Y0 - Y1)).toFixed(1)}`);
  }
  const f = (v: number) => v.toFixed(1);

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.6rem 0" }} className="not-prose">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>Averages of a skewed source</span>
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>source: Exponential(1)</span>
      </div>
      <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <rect x={X0} y={Y1} width={X1 - X0} height={Y0 - Y1} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        {bins.map((c, i) => { const h = (c / bmax) * (Y0 - Y1); return <rect key={i} x={f(X0 + i * bw + 0.5)} y={f(Y0 - h)} width={f(bw - 1)} height={f(h)} fill={amber} fillOpacity={0.75} />; })}
        {n > 1 && <polyline points={norm.join(" ")} fill="none" stroke="var(--ink)" strokeWidth={2} />}
        <line x1={f(xToPx(1))} y1={Y1} x2={f(xToPx(1))} y2={Y0} stroke="var(--brand-2)" strokeWidth={1.4} strokeDasharray="4 3" />
        <text x={f(xToPx(1))} y={VH - 8} fontSize={10} fill="var(--brand-2)" textAnchor="middle">true mean = 1</text>
      </svg>
      <div style={{ marginTop: 10 }}>
        <label style={{ fontSize: 12.5, color: "var(--muted)", display: "block" }}>sample size n = {n} &nbsp; (each average is of n draws)
          <input type="range" min={1} max={40} step={1} value={n} onChange={(e) => setN(Number(e.target.value))} style={{ width: "100%", accentColor: amber, marginTop: 4 }} />
        </label>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10, alignItems: "center" }}>
        <Metric label="std of the mean" value={se.toFixed(3)} accent={amber} sub="= 1/√n" />
        <Metric label="shape" value={n === 1 ? "skewed (the source)" : n < 8 ? "bending toward bell" : "essentially normal"} />
        <div style={{ flex: 1 }} />
        <button onClick={() => setSeed((s) => s + 1)} style={btn}>Resample</button>
      </div>
    </div>
  );
}

function Metric({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div style={{ background: "var(--surface-2)", borderRadius: 10, padding: "6px 10px", minWidth: 92 }}>
      <div style={{ fontSize: 10.5, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 500, color: accent ?? "var(--ink)" }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: "var(--faint)" }}>{sub}</div>}
    </div>
  );
}
const btn: React.CSSProperties = { background: "transparent", color: "var(--muted)", border: "1px solid var(--border-strong)", fontSize: 12.5, padding: "6px 12px", borderRadius: 8, cursor: "pointer" };
