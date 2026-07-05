"use client";

import { useMemo, useState } from "react";

// Independence of errors, made visible. Residuals plotted in the order they were
// collected. When errors are independent (ρ≈0) the points scatter randomly around
// zero — no memory. Crank up the autocorrelation ρ and neighbouring residuals start
// tracking each other: long runs above and below the line, smooth waves. The
// Durbin–Watson statistic ≈ 2(1−ρ) puts a number on it: ~2 is clean, well below 2
// means positive autocorrelation (the assumption is violated).

const NPTS = 80;
const r2 = (v: number) => Math.round(v * 100) / 100;
function mulberry32(a: number) {
  return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
// standard normal via Box–Muller
function gauss(rand: () => number) {
  const u = Math.max(1e-9, rand()), v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function AutocorrelationLab() {
  const [rho, setRho] = useState(0.0);
  const resid = useMemo(() => {
    const rand = mulberry32(11);
    const e: number[] = []; let prev = 0;
    for (let i = 0; i < NPTS; i++) {
      const shock = gauss(rand) * Math.sqrt(1 - rho * rho);
      prev = i === 0 ? gauss(rand) : rho * prev + shock;
      e.push(prev);
    }
    return e;
  }, [rho]);

  // Durbin–Watson
  const dw = useMemo(() => {
    let num = 0, den = 0;
    for (let i = 0; i < NPTS; i++) { den += resid[i] * resid[i]; if (i > 0) num += (resid[i] - resid[i - 1]) ** 2; }
    return den ? num / den : 2;
  }, [resid]);
  const verdict = dw > 1.7 ? "independent" : dw > 1.2 ? "mild autocorrelation" : "strong autocorrelation";
  const vColor = dw > 1.7 ? "var(--good)" : dw > 1.2 ? "var(--warn)" : "var(--bad)";

  const W = 340, H = 170, padL = 26, padR = 10, padT = 12, padB = 24;
  const lim = 3;
  const px = (i: number) => r2(padL + (i / (NPTS - 1)) * (W - padL - padR));
  const py = (v: number) => r2(padT + (1 - (v + lim) / (2 * lim)) * (H - padT - padB));

  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={head}>Residuals in collection order</span>
        <span style={{ fontSize: 12, color: vColor, fontFamily: "var(--font-display)" }}>{verdict}</span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        <line x1={padL} y1={py(0)} x2={W - padR} y2={py(0)} stroke="var(--border-strong)" strokeWidth={0.8} strokeDasharray="2 2" />
        {/* connecting line reveals runs/waves */}
        <polyline points={resid.map((v, i) => `${px(i)},${py(v)}`).join(" ")} fill="none" stroke={vColor} strokeWidth={1} strokeOpacity={0.5} />
        {resid.map((v, i) => <circle key={i} cx={px(i)} cy={py(v)} r={2.1} fill={vColor} fillOpacity={0.8} />)}
        <text x={W / 2} y={H - 4} fontSize={9} fill="var(--faint)" textAnchor="middle">observation order (time) →</text>
        <text x={11} y={H / 2} fontSize={9} fill="var(--faint)" textAnchor="middle" transform={`rotate(-90 11 ${H / 2})`}>residual</text>
      </svg>

      <label style={lbl}>autocorrelation ρ = <b style={{ color: "var(--ink)" }}>{rho.toFixed(2)}</b> <span style={{ color: "var(--faint)" }}>· each error leaks into the next</span></label>
      <input type="range" min={0} max={0.97} step={0.01} value={rho} onChange={(e) => setRho(+e.target.value)} style={slider} />

      <div style={{ display: "flex", gap: 20, margin: "6px 0 2px" }}>
        <S label="Durbin–Watson" value={dw.toFixed(2)} color={vColor} />
        <S label="clean ≈" value="2.00" />
      </div>

      <div style={caption}>
        At <strong>ρ = 0</strong> the residuals are a memoryless cloud around zero — independence holds, and
        Durbin–Watson sits near <strong>2</strong>. Slide ρ up and each residual starts inheriting its predecessor:
        the points organize into <strong style={{ color: "var(--bad)" }}>long runs and slow waves</strong>, and DW
        falls toward 0. That pattern is the tell for autocorrelation — common in time series and spatial data — and
        it means your standard errors are too small and every p-value is overconfident, even though the coefficients
        themselves stay unbiased.
      </div>
    </div>
  );
}

function S({ label, value, color }: { label: string; value: string; color?: string }) {
  return (<div><div style={{ fontSize: 11, color: "var(--muted)" }}>{label}</div><div style={{ fontFamily: "ui-monospace, monospace", fontSize: 15, color: color || "var(--ink)" }}>{value}</div></div>);
}
const wrap: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, margin: "1.6rem 0" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)" };
const caption: React.CSSProperties = { fontSize: 12.5, color: "var(--muted)", marginTop: 12, lineHeight: 1.55 };
const lbl: React.CSSProperties = { display: "block", fontSize: 11.5, color: "var(--muted)", margin: "8px 0 2px" };
const slider: React.CSSProperties = { width: "100%", accentColor: "var(--c-regression)" };
