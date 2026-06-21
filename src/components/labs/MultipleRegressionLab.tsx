"use client";

import { useState } from "react";

// 3-feature dataset: sqft, bedrooms, age → price ($k)
const RAW = [
  { sqft: 850, bed: 1, age: 30, price: 210 },
  { sqft: 1100, bed: 2, age: 25, price: 265 },
  { sqft: 1300, bed: 2, age: 18, price: 310 },
  { sqft: 1450, bed: 3, age: 12, price: 370 },
  { sqft: 1600, bed: 3, age: 8, price: 405 },
  { sqft: 1800, bed: 4, age: 5, price: 450 },
  { sqft: 2000, bed: 4, age: 3, price: 490 },
  { sqft: 2200, bed: 5, age: 2, price: 540 },
];
const N = RAW.length;

// Standardise all features
function standardise(vals: number[]) {
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const sd = Math.sqrt(vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length);
  return { mean, sd, xs: vals.map(v => (v - mean) / sd) };
}

const sqfts = standardise(RAW.map(r => r.sqft));
const beds = standardise(RAW.map(r => r.bed));
const ages = standardise(RAW.map(r => r.age));
const prices = RAW.map(r => r.price);

// Design matrix [1, sqft_z, bed_z, age_z]
const Xmat = RAW.map((_, i) => [1, sqfts.xs[i], beds.xs[i], ages.xs[i]]);
const p = 4; // parameters: intercept + 3 features

function dot(a: number[], b: number[]) { return a.reduce((s, v, i) => s + v * b[i], 0); }
function predict(theta: number[], x: number[]) { return dot(theta, x); }
function mse(theta: number[]) {
  return Xmat.reduce((s, x, i) => s + (predict(theta, x) - prices[i]) ** 2, 0) / N;
}
function gradMSE(theta: number[]) {
  const g = Array(p).fill(0);
  for (let i = 0; i < N; i++) {
    const e = predict(theta, Xmat[i]) - prices[i];
    for (let j = 0; j < p; j++) g[j] += 2 * e * Xmat[i][j];
  }
  return g.map(v => v / N);
}

// Closed-form normal equation
function matMul(A: number[][], B: number[][]): number[][] {
  return A.map(row => B[0].map((_, j) => row.reduce((s, v, k) => s + v * B[k][j], 0)));
}
function matVec(A: number[][], v: number[]): number[] {
  return A.map(row => dot(row, v));
}
function transpose(A: number[][]): number[][] {
  return A[0].map((_, j) => A.map(row => row[j]));
}
// Gauss-Jordan inversion for small matrix
function invertMatrix(M: number[][]): number[][] {
  const n = M.length;
  const aug = M.map((row, i) => [...row, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);
  for (let col = 0; col < n; col++) {
    const pivot = aug[col][col];
    aug[col] = aug[col].map(v => v / pivot);
    for (let row = 0; row < n; row++) {
      if (row !== col) {
        const factor = aug[row][col];
        aug[row] = aug[row].map((v, j) => v - factor * aug[col][j]);
      }
    }
  }
  return aug.map(row => row.slice(n));
}

const Xt = transpose(Xmat);
const XtX = matMul(Xt, Xmat);
const XtY = matVec(Xt, prices);
const XtX_inv = invertMatrix(XtX);
const THETA_OPT = matVec(XtX_inv, XtY);

type ActiveFeature = "sqft" | "bed" | "age";

export function MultipleRegressionLab() {
  const [theta, setTheta] = useState([...THETA_OPT.map(v => parseFloat(v.toFixed(3)))]);
  const [active, setActive] = useState<ActiveFeature>("sqft");
  const [showOpt, setShowOpt] = useState(false);

  function updateTheta(idx: number, val: number) {
    setTheta(prev => prev.map((v, i) => (i === idx ? val : v)));
  }

  const curMSE = mse(theta);
  const optMSE = mse(THETA_OPT);
  const mseRatio = curMSE / optMSE;

  // Active feature index
  const featureMap: Record<ActiveFeature, number> = { sqft: 1, bed: 2, age: 3 };
  const featureData: Record<ActiveFeature, { xs: number[]; mean: number; sd: number; label: string }> = {
    sqft: { ...sqfts, label: "sqft (standardised)" },
    bed: { ...beds, label: "bedrooms (standardised)" },
    age: { ...ages, label: "age (standardised)" },
  };
  const fd = featureData[active];
  const fidx = featureMap[active];

  // Chart: active feature vs price (partial regression line)
  const cx = (x: number) => 44 + ((x - -2) / 4) * 210;
  const cy = (y: number) => 210 - ((y - 180) / 400) * 195;

  // Partial regression line: fix other features at 0 (mean)
  const partialY = (xz: number) => theta[0] + theta[fidx] * xz;

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, margin: "1.6rem 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <span className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
          Multiple regression — tune the coefficients
        </span>
        <button
          onClick={() => { setTheta([...THETA_OPT.map(v => parseFloat(v.toFixed(3)))]); setShowOpt(true); }}
          style={btnGhost}
        >
          Snap to optimal
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
        {/* Coefficient sliders */}
        <div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--faint)", marginBottom: 8 }}>
              Parameters θ
            </div>
            {[
              { label: "intercept (b)", idx: 0, min: 200, max: 500, step: 1 },
              { label: "coeff · sqft", idx: 1, min: -60, max: 120, step: 0.5 },
              { label: "coeff · bedrooms", idx: 2, min: -40, max: 80, step: 0.5 },
              { label: "coeff · age", idx: 3, min: -80, max: 20, step: 0.5 },
            ].map(({ label, idx, min, max, step }) => (
              <div key={idx} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 3 }}>
                  <span style={{ color: "var(--muted)" }}>{label}</span>
                  <span style={{ fontWeight: 500, color: "var(--ink)", fontFamily: "ui-monospace, monospace" }}>{theta[idx].toFixed(1)}</span>
                </div>
                <input
                  type="range" min={min} max={max} step={step}
                  value={theta[idx]}
                  onChange={e => { updateTheta(idx, parseFloat(e.target.value)); setShowOpt(false); }}
                  style={{ width: "100%" }}
                />
              </div>
            ))}
          </div>

          {/* MSE meter */}
          <div style={{ background: "var(--canvas)", borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 5 }}>
              <span style={{ color: "var(--muted)" }}>MSE</span>
              <span style={{ fontWeight: 500, color: mseRatio < 1.05 ? "var(--good)" : mseRatio < 1.5 ? "var(--warn)" : "var(--bad)" }}>
                {curMSE.toFixed(1)} {mseRatio < 1.05 && "✓ optimal"}
              </span>
            </div>
            <div style={{ background: "var(--border-strong)", borderRadius: 4, height: 6, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 4, transition: "width 0.2s, background 0.3s",
                width: `${Math.min(100, (optMSE / curMSE) * 100).toFixed(1)}%`,
                background: mseRatio < 1.05 ? "var(--good)" : mseRatio < 1.5 ? "var(--warn)" : "var(--bad)",
              }} />
            </div>
            <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 4 }}>optimal = {optMSE.toFixed(1)}</div>
          </div>
        </div>

        {/* Partial regression scatter */}
        <div>
          {/* Feature selector */}
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            {(["sqft", "bed", "age"] as ActiveFeature[]).map(f => (
              <button key={f} onClick={() => setActive(f)} style={{
                padding: "4px 12px", borderRadius: 999, fontSize: 12, cursor: "pointer",
                border: `1.5px solid ${active === f ? "var(--brand)" : "var(--border)"}`,
                background: active === f ? "color-mix(in srgb, var(--brand) 12%, var(--surface))" : "transparent",
                color: active === f ? "var(--brand)" : "var(--muted)",
              }}>{f}</button>
            ))}
          </div>
          <svg viewBox="0 0 270 230" style={{ width: "100%", height: "auto", display: "block" }}>
            <rect x={44} y={5} width={210} height={205} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
            {/* Partial regression line */}
            <line
              x1={cx(-2)} y1={cy(partialY(-2))}
              x2={cx(2)} y2={cy(partialY(2))}
              stroke="var(--brand)" strokeWidth={2.5} strokeLinecap="round"
            />
            {/* Optimal line (faint) */}
            {!showOpt && (
              <line
                x1={cx(-2)} y1={cy(THETA_OPT[0] + THETA_OPT[fidx] * -2)}
                x2={cx(2)} y2={cy(THETA_OPT[0] + THETA_OPT[fidx] * 2)}
                stroke="var(--good)" strokeWidth={1.5} strokeDasharray="4 3" strokeOpacity={0.5}
              />
            )}
            {/* Data points (residual lines) */}
            {fd.xs.map((x, i) => (
              <g key={i}>
                <line x1={cx(x)} y1={cy(prices[i])} x2={cx(x)} y2={cy(partialY(x))} stroke="var(--bad)" strokeWidth={1} strokeOpacity={0.35} />
                <circle cx={cx(x)} cy={cy(prices[i])} r={3.5} fill="var(--c-regression)" fillOpacity={0.85} />
              </g>
            ))}
            <text x={149} y={227} fontSize={9.5} fill="var(--faint)" textAnchor="middle">{fd.label} →</text>
            <text x={12} y={108} fontSize={9.5} fill="var(--faint)" textAnchor="middle" transform="rotate(-90 12 108)">price ($k)</text>
          </svg>
          <div style={{ fontSize: 11, color: "var(--faint)", textAlign: "center" }}>
            solid = your line · dashed = optimal
          </div>
        </div>
      </div>

      {/* Prediction table */}
      <div style={{ marginTop: 14, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ color: "var(--faint)", borderBottom: "1px solid var(--border)" }}>
              {["sqft", "beds", "age", "actual ($k)", "predicted ($k)", "error"].map(h => (
                <th key={h} style={{ padding: "4px 8px", fontWeight: 400, textAlign: "right" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {RAW.map((r, i) => {
              const pred = predict(theta, Xmat[i]);
              const err = pred - r.price;
              return (
                <tr key={i} style={{ borderBottom: "1px solid var(--border)", color: "var(--muted)" }}>
                  <td style={{ padding: "3px 8px", textAlign: "right" }}>{r.sqft}</td>
                  <td style={{ padding: "3px 8px", textAlign: "right" }}>{r.bed}</td>
                  <td style={{ padding: "3px 8px", textAlign: "right" }}>{r.age}</td>
                  <td style={{ padding: "3px 8px", textAlign: "right", color: "var(--ink)" }}>{r.price}</td>
                  <td style={{ padding: "3px 8px", textAlign: "right", color: "var(--brand)", fontWeight: 500 }}>{pred.toFixed(1)}</td>
                  <td style={{ padding: "3px 8px", textAlign: "right", color: Math.abs(err) < 10 ? "var(--good)" : "var(--bad)" }}>
                    {err > 0 ? "+" : ""}{err.toFixed(1)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const btnGhost: React.CSSProperties = { background: "transparent", color: "var(--muted)", border: "1px solid var(--border-strong)", fontSize: 13, padding: "7px 14px", borderRadius: 10, cursor: "pointer" };
