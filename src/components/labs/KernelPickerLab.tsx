"use client";

import { useEffect, useMemo, useState } from "react";

// Kernel = inductive bias, made switchable. The SAME kernel-ridge fit is run with
// three kernels on the same data: linear (a straight line — underfits curves),
// polynomial (global bends), and RBF (local flexibility). The lower panel shows
// each kernel's similarity function k(x, x0) for a reference point x0 — flat/rising
// for linear & poly, a decaying bump for RBF — so "what the kernel assumes" is
// visible, not just asserted. exp/pow curves are mount-gated for hydration safety.

const ACCENT = "var(--c-regression)";
const N = 16;
const LAMBDA = 0.05;
const X0 = 0.5;   // reference point for the similarity panel

function mulberry32(a: number) {
  return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const truth = (x: number) => 0.5 + 0.28 * Math.sin(2 * Math.PI * x * 1.15);

function solve(A: number[][], b: number[]): number[] {
  const n = b.length; const M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    let piv = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
    [M[c], M[piv]] = [M[piv], M[c]]; const d = M[c][c] || 1e-12;
    for (let r = 0; r < n; r++) { if (r === c) continue; const f = M[r][c] / d; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
  }
  return M.map((row, i) => row[n] / (M[i][i] || 1e-12));
}

type KernelId = "linear" | "poly" | "rbf";
const KERNELS: { id: KernelId; label: string; formula: string; note: string; k: (a: number, b: number) => number }[] = [
  { id: "linear", label: "Linear", formula: "k(x,z) = x·z + 1", note: "assumes a straight line — no curvature at all", k: (a, b) => a * b + 1 },
  { id: "poly", label: "Polynomial", formula: "k(x,z) = (x·z + 1)³", note: "global curvature — one smooth bend across the whole range", k: (a, b) => (a * b + 1) ** 3 },
  { id: "rbf", label: "RBF", formula: "k(x,z) = exp(−12·(x−z)²)", note: "local smoothness — each point influences only its neighbourhood", k: (a, b) => Math.exp(-12 * (a - b) ** 2) },
];

export function KernelPickerLab() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const [kid, setKid] = useState<KernelId>("rbf");
  const kernel = KERNELS.find((k) => k.id === kid)!;

  const data = useMemo(() => {
    const rand = mulberry32(4);
    const xs = Array.from({ length: N }, (_, i) => (i + 0.5) / N);
    const ys = xs.map((x) => truth(x) + (rand() - 0.5) * 0.18);
    return { xs, ys };
  }, []);

  const fit = useMemo(() => {
    const { xs, ys } = data;
    const K = xs.map((xi) => xs.map((xj) => kernel.k(xi, xj)));
    const A = K.map((row, i) => row.map((v, j) => (i === j ? v + LAMBDA : v)));
    const alpha = solve(A, ys);
    const gx = Array.from({ length: 81 }, (_, i) => i / 80);
    const gy = gx.map((g) => xs.reduce((s, xi, i) => s + alpha[i] * kernel.k(g, xi), 0));
    return { gx, gy };
  }, [data, kernel]);

  // similarity panel: k(x, X0) normalised to its own max over the range
  const sim = useMemo(() => {
    const gx = Array.from({ length: 81 }, (_, i) => i / 80);
    const raw = gx.map((g) => kernel.k(g, X0));
    const mx = Math.max(...raw.map(Math.abs)) || 1;
    return { gx, gy: raw.map((v) => v / mx) };
  }, [kernel]);

  const W = 360, FH = 168, SH = 110, pad = 20;
  const fx = (x: number) => (pad + x * (W - 2 * pad)).toFixed(2);
  const fy = (v: number) => (FH - pad - v * (FH - 2 * pad)).toFixed(2);
  const sx = (x: number) => (pad + x * (W - 2 * pad)).toFixed(2);
  const sy = (v: number) => (SH - 16 - ((v + 1) / 2) * (SH - 28)).toFixed(2);  // -1..1 range
  const fitPts = fit.gx.map((g, i) => `${fx(g)},${fy(fit.gy[i])}`).join(" ");
  const simPts = sim.gx.map((g, i) => `${sx(g)},${sy(sim.gy[i])}`).join(" ");

  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
        <span style={head}>Same data, three kernels</span>
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>kernel ridge, solved live</span>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
        {KERNELS.map((k) => (
          <button key={k.id} onClick={() => setKid(k.id)} style={{
            fontSize: 13, padding: "5px 14px", borderRadius: 8, cursor: "pointer",
            border: `1px solid ${kid === k.id ? ACCENT : "var(--border-strong)"}`,
            background: kid === k.id ? "color-mix(in srgb, var(--c-regression) 16%, transparent)" : "transparent",
            color: kid === k.id ? "var(--ink)" : "var(--muted)", fontWeight: kid === k.id ? 600 : 400,
          }}>{k.label}</button>
        ))}
      </div>

      {/* fit panel */}
      <svg viewBox={`0 0 ${W} ${FH}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <rect x={0} y={0} width={W} height={FH} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        {ready && <polyline points={fitPts} fill="none" stroke={ACCENT} strokeWidth={2.4} />}
        {data.xs.map((x, i) => <circle key={i} cx={fx(x)} cy={fy(data.ys[i])} r={3.1} fill="var(--c-classification)" fillOpacity={0.7} />)}
        <text x={W - 10} y={15} fontSize={9.5} fill="var(--faint)" textAnchor="end">the fit</text>
      </svg>

      {/* similarity panel */}
      <svg viewBox={`0 0 ${W} ${SH}`} style={{ width: "100%", height: "auto", display: "block", marginTop: 8 }}>
        <rect x={0} y={0} width={W} height={SH} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        <line x1={pad} y1={sy(0)} x2={W - pad} y2={sy(0)} stroke="var(--border)" strokeWidth={1} />
        <line x1={sx(X0)} y1={16} x2={sx(X0)} y2={SH - 12} stroke="var(--muted)" strokeWidth={1} strokeDasharray="3 3" />
        {ready && <polyline points={simPts} fill="none" stroke={ACCENT} strokeWidth={2.2} />}
        <text x={sx(X0)} y={SH - 3} fontSize={8.5} fill="var(--faint)" textAnchor="middle">x₀ = 0.5</text>
        <text x={W - 10} y={15} fontSize={9.5} fill="var(--faint)" textAnchor="end">similarity k(x, x₀)</text>
      </svg>

      <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 12.5, color: "var(--ink)", marginTop: 10 }}>{kernel.formula}</div>
      <div style={caption}>
        <strong>{kernel.label}:</strong> {kernel.note}. The lower panel is the kernel&rsquo;s{" "}
        <em>similarity function</em> — how much a point at <M>x₀ = 0.5</M> influences its neighbours. Linear and
        polynomial keep rising with distance (every point talks to every other); the RBF is a <em>local bump</em>{" "}
        that decays to zero. Switch kernels and watch the fit&rsquo;s character change entirely, from a rigid line to
        a flexible curve — same data, same solver, different <strong>inductive bias</strong>.
      </div>
    </div>
  );
}

function M({ children }: { children: React.ReactNode }) {
  return <span style={{ fontFamily: "ui-monospace, monospace", fontSize: "0.95em", color: "var(--ink)" }}>{children}</span>;
}

const wrap: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, margin: "1.6rem 0" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)" };
const caption: React.CSSProperties = { fontSize: 12.5, color: "var(--muted)", marginTop: 10, lineHeight: 1.55 };
