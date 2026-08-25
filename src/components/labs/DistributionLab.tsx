"use client";

import { useState } from "react";

// A tour of the distributions you actually meet. Pick one, tune its parameters,
// and watch the shape, mean (dashed) and variance update together — the same
// mean/variance you'll compute by hand on the next page, here made visual.

type Kind = "gaussian" | "exponential" | "uniform" | "binomial";
const VW = 460, VH = 240, PAD = { l: 34, r: 14, t: 14, b: 28 };
const X0 = PAD.l, X1 = VW - PAD.r, Y0 = VH - PAD.b, Y1 = PAD.t;

function choose(n: number, k: number) { let r = 1; for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1); return r; }

export function DistributionLab() {
  const [kind, setKind] = useState<Kind>("gaussian");
  const [p1, setP1] = useState(0);   // gaussian mu / exp rate / uniform b / binom p*10
  const [p2, setP2] = useState(1);   // gaussian sigma
  const amber = "var(--c-fundamentals)";

  // per-distribution config produces: continuous curve pts OR discrete bars, plus mean/var/label
  let mean = 0, variance = 0, label = "", xr: [number, number] = [-5, 5];
  let curve: [number, number][] = [];
  let bars: [number, number][] = [];

  if (kind === "gaussian") {
    const mu = p1, s = Math.max(0.4, p2);
    mean = mu; variance = s * s; label = `μ = ${mu.toFixed(1)}, σ = ${s.toFixed(1)}`; xr = [-5, 5];
    for (let i = 0; i <= 120; i++) { const x = xr[0] + (i / 120) * (xr[1] - xr[0]); curve.push([x, Math.exp(-((x - mu) ** 2) / (2 * s * s)) / (s * Math.sqrt(2 * Math.PI))]); }
  } else if (kind === "exponential") {
    const lam = Math.max(0.3, p1 + 1.5);
    mean = 1 / lam; variance = 1 / (lam * lam); label = `rate λ = ${lam.toFixed(1)}`; xr = [0, 6];
    for (let i = 0; i <= 120; i++) { const x = (i / 120) * 6; curve.push([x, lam * Math.exp(-lam * x)]); }
  } else if (kind === "uniform") {
    const b = Math.max(1, p1 + 3);
    mean = b / 2; variance = (b * b) / 12; label = `on [0, ${b.toFixed(1)}]`; xr = [-0.5, 6];
    for (let i = 0; i <= 120; i++) { const x = xr[0] + (i / 120) * (xr[1] - xr[0]); curve.push([x, x >= 0 && x <= b ? 1 / b : 0]); }
  } else {
    const n = 12, p = Math.min(0.9, Math.max(0.1, (p1 + 5) / 10));
    mean = n * p; variance = n * p * (1 - p); label = `n = 12, p = ${p.toFixed(1)}`; xr = [-0.5, 12.5];
    for (let k = 0; k <= n; k++) bars.push([k, choose(n, k) * p ** k * (1 - p) ** (n - k)]);
  }

  const ymax = Math.max(...curve.map((c) => c[1]), ...bars.map((b) => b[1]), 0.001) * 1.15;
  const xToPx = (x: number) => X0 + ((x - xr[0]) / (xr[1] - xr[0])) * (X1 - X0);
  const yToPx = (y: number) => Y0 - (y / ymax) * (Y0 - Y1);
  const f = (n: number) => n.toFixed(1);

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.6rem 0" }} className="not-prose">
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
        {(["gaussian", "exponential", "uniform", "binomial"] as Kind[]).map((k) => (
          <button key={k} onClick={() => { setKind(k); setP1(k === "gaussian" ? 0 : 0); setP2(1); }} style={{ ...btn, borderColor: kind === k ? amber : "var(--border-strong)", color: kind === k ? "var(--ink)" : "var(--muted)" }}>{k}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <rect x={X0} y={Y1} width={X1 - X0} height={Y0 - Y1} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        {curve.length > 0 && <polyline points={curve.map(([x, y]) => `${f(xToPx(x))},${f(yToPx(y))}`).join(" ")} fill="none" stroke={amber} strokeWidth={2.2} />}
        {curve.length > 0 && <polygon points={`${f(xToPx(xr[0]))},${Y0} ${curve.map(([x, y]) => `${f(xToPx(x))},${f(yToPx(y))}`).join(" ")} ${f(xToPx(xr[1]))},${Y0}`} fill={`color-mix(in srgb, ${amber} 10%, transparent)`} stroke="none" />}
        {bars.map(([k, y]) => <rect key={k} x={f(xToPx(k) - 8)} y={f(yToPx(y))} width={16} height={f(Y0 - yToPx(y))} rx={2} fill={amber} fillOpacity={0.8} />)}
        {/* mean line */}
        <line x1={f(xToPx(mean))} y1={Y1} x2={f(xToPx(mean))} y2={Y0} stroke="var(--brand-2)" strokeWidth={1.6} strokeDasharray="4 3" />
        <text x={f(xToPx(mean))} y={Y1 + 10} fontSize={9.5} fill="var(--brand-2)" textAnchor="middle">mean</text>
      </svg>
      <div style={{ marginTop: 10 }}>
        <label style={{ fontSize: 12.5, color: "var(--muted)", display: "block" }}>{label}
          <input type="range" min={-3} max={3} step={0.1} value={p1} onChange={(e) => setP1(Number(e.target.value))} style={{ width: "100%", accentColor: amber, marginTop: 4 }} />
        </label>
        {kind === "gaussian" && (
          <label style={{ fontSize: 12.5, color: "var(--muted)", display: "block", marginTop: 6 }}>spread σ
            <input type="range" min={0.4} max={2.2} step={0.1} value={p2} onChange={(e) => setP2(Number(e.target.value))} style={{ width: "100%", accentColor: amber, marginTop: 4 }} />
          </label>
        )}
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
        <Metric label="mean E[X]" value={mean.toFixed(2)} accent="var(--brand-2)" />
        <Metric label="variance Var(X)" value={variance.toFixed(2)} accent={amber} />
        <Metric label="std dev" value={Math.sqrt(variance).toFixed(2)} />
      </div>
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{ background: "var(--surface-2)", borderRadius: 10, padding: "6px 10px", minWidth: 84 }}>
      <div style={{ fontSize: 10.5, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 500, color: accent ?? "var(--ink)" }}>{value}</div>
    </div>
  );
}

const btn: React.CSSProperties = { background: "transparent", border: "1px solid var(--border-strong)", fontSize: 12.5, padding: "6px 11px", borderRadius: 8, cursor: "pointer" };
