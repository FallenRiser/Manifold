"use client";

import { useState } from "react";

// Raw data: study hours → test score (with a curved relationship)
const RAW: [number, number][] = [
  [0.5, 35], [1, 45], [2, 58], [3, 68], [4, 74],
  [5, 79], [6, 82], [7, 84], [8, 85], [9, 84], [10, 82],
];
const N = RAW.length;
const XR = RAW.map(([x]) => x);
const YR = RAW.map(([, y]) => y);

// Standardise x
const XMEAN = XR.reduce((a, b) => a + b, 0) / N;
const XSD = Math.sqrt(XR.reduce((s, x) => s + (x - XMEAN) ** 2, 0) / N);
const XZ = XR.map(x => (x - XMEAN) / XSD);

// Build polynomial design matrix up to degree d
function buildX(degree: number): number[][] {
  return XZ.map(xz => Array.from({ length: degree + 1 }, (_, d) => Math.pow(xz, d)));
}

// Normal equation solver (generic)
function solve(X: number[][]): number[] {
  const p = X[0].length;
  const XtX: number[][] = Array.from({ length: p }, (_, i) =>
    Array.from({ length: p }, (_, j) => X.reduce((s, row) => s + row[i] * row[j], 0))
  );
  const XtY: number[] = Array.from({ length: p }, (_, i) =>
    X.reduce((s, row, k) => s + row[i] * YR[k], 0)
  );
  const aug = XtX.map((row, i) => [...row, XtY[i]]);
  for (let col = 0; col < p; col++) {
    const pivot = aug[col][col];
    if (Math.abs(pivot) < 1e-12) continue;
    aug[col] = aug[col].map(v => v / pivot);
    for (let row = 0; row < p; row++) {
      if (row !== col) {
        const f = aug[row][col];
        aug[row] = aug[row].map((v, j) => v - f * aug[col][j]);
      }
    }
  }
  return aug.map(row => row[p]);
}

function predict(theta: number[], x: number[]) {
  return x.reduce((s, v, i) => s + v * theta[i], 0);
}
function mse(theta: number[], X: number[][]) {
  return X.reduce((s, x, i) => s + (predict(theta, x) - YR[i]) ** 2, 0) / N;
}

// Precompute for degrees 1–7
const DEGREES = [1, 2, 3, 5, 7] as const;
type Degree = (typeof DEGREES)[number];

const FITS: Record<Degree, { theta: number[]; X: number[][] }> = Object.fromEntries(
  DEGREES.map(d => {
    const X = buildX(d);
    return [d, { theta: solve(X), X }];
  })
) as Record<Degree, { theta: number[]; X: number[][] }>;

const DEG_COLORS: Record<Degree, string> = {
  1: "var(--muted)",
  2: "var(--brand)",
  3: "var(--good)",
  5: "var(--c-fundamentals)",
  7: "var(--bad)",
};

const DEG_LABELS: Record<Degree, string> = {
  1: "Linear (d=1)",
  2: "Quadratic (d=2)",
  3: "Cubic (d=3)",
  5: "Degree 5",
  7: "Degree 7",
};

export function PolynomialLab() {
  const [activeDeg, setActiveDeg] = useState<Degree>(2);

  const { theta, X } = FITS[activeDeg];
  const curMSE = mse(theta, X);

  // Chart
  const CX = (x: number) => 44 + ((x - 0) / 10.5) * 220;
  const CY = (y: number) => 210 - ((y - 28) / 65) * 195;

  // Smooth curve: sample 120 points
  const curvePts = Array.from({ length: 120 }, (_, i) => {
    const x = 0.2 + i * (10 / 120);
    const xz = (x - XMEAN) / XSD;
    const row = Array.from({ length: activeDeg + 1 }, (_, d) => Math.pow(xz, d));
    const y = predict(theta, row);
    return `${CX(x).toFixed(1)},${CY(y).toFixed(1)}`;
  }).join(" ");

  // R²
  const yMean = YR.reduce((a, b) => a + b, 0) / N;
  const ssTot = YR.reduce((s, y) => s + (y - yMean) ** 2, 0);
  const ssRes = X.reduce((s, x, i) => s + (predict(theta, x) - YR[i]) ** 2, 0);
  const r2 = 1 - ssRes / ssTot;

  const isBad = activeDeg >= 5;

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, margin: "1.6rem 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <span className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
          Polynomial fit — how many bends?
        </span>
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>study hours vs test score</span>
      </div>

      {/* Degree selector */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {DEGREES.map(d => (
          <button key={d} onClick={() => setActiveDeg(d)} style={{
            padding: "5px 14px", borderRadius: 999, fontSize: 12.5, cursor: "pointer",
            border: `1.5px solid ${activeDeg === d ? DEG_COLORS[d] : "var(--border)"}`,
            background: activeDeg === d ? `color-mix(in srgb, ${DEG_COLORS[d]} 14%, var(--surface))` : "transparent",
            color: activeDeg === d ? DEG_COLORS[d] : "var(--faint)",
            fontWeight: activeDeg === d ? 600 : 400,
            transition: "all 0.15s",
          }}>{DEG_LABELS[d]}</button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
        {/* Chart */}
        <svg viewBox="0 0 280 230" style={{ width: "100%", height: "auto", display: "block" }}>
          <rect x={44} y={5} width={220} height={205} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />

          {/* Axis ticks */}
          {[2, 4, 6, 8, 10].map(v => (
            <text key={v} x={CX(v)} y={227} fontSize={9} fill="var(--faint)" textAnchor="middle">{v}</text>
          ))}
          {[40, 60, 80].map(v => (
            <text key={v} x={40} y={CY(v) + 3.5} fontSize={9} fill="var(--faint)" textAnchor="end">{v}</text>
          ))}

          {/* Fitted curve */}
          <polyline points={curvePts} fill="none" stroke={DEG_COLORS[activeDeg]} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

          {/* Residuals */}
          {RAW.map(([x, y], i) => {
            const xz = (x - XMEAN) / XSD;
            const row = Array.from({ length: activeDeg + 1 }, (_, d) => Math.pow(xz, d));
            const yhat = predict(theta, row);
            return (
              <g key={i}>
                <line x1={CX(x)} y1={CY(y)} x2={CX(x)} y2={CY(yhat)} stroke="var(--bad)" strokeWidth={1.2} strokeOpacity={0.4} />
                <circle cx={CX(x)} cy={CY(y)} r={3.8} fill="var(--c-regression)" fillOpacity={0.9} />
              </g>
            );
          })}

          <text x={154} y={227} fontSize={9.5} fill="var(--faint)" textAnchor="middle">hours</text>
        </svg>

        {/* Right panel */}
        <div>
          {/* Overfitting warning */}
          {isBad && (
            <div style={{
              background: "color-mix(in srgb, var(--bad) 8%, var(--surface-2))",
              border: "1.5px solid color-mix(in srgb, var(--bad) 25%, var(--border))",
              borderRadius: 10, padding: "10px 12px", marginBottom: 12,
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--bad)", marginBottom: 4 }}>⚠ Overfitting</div>
              <div style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.55 }}>
                Degree {activeDeg} fits the training data closely (low MSE) but produces wild
                curves between points. It has learned the <em>noise</em>, not the pattern.
              </div>
            </div>
          )}

          {/* Stats */}
          <div style={{ background: "var(--canvas)", borderRadius: 10, padding: "10px 12px", marginBottom: 12 }}>
            <StatRow label="Degree" val={String(activeDeg)} color={DEG_COLORS[activeDeg]} />
            <StatRow label="Parameters" val={String(activeDeg + 1)} color="var(--ink)" />
            <StatRow label="Train MSE" val={curMSE.toFixed(3)} color={isBad ? "var(--bad)" : "var(--good)"} />
            <StatRow label="R²" val={r2.toFixed(4)} color={r2 > 0.98 && isBad ? "var(--bad)" : "var(--good)"} />
          </div>

          {/* Equation display */}
          <div style={{ background: "var(--canvas)", borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--faint)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
              Feature columns used
            </div>
            <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, color: "var(--ink)", lineHeight: 1.8 }}>
              {Array.from({ length: activeDeg + 1 }, (_, d) => (
                <div key={d} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ color: DEG_COLORS[activeDeg], fontWeight: 600, minWidth: 16 }}>
                    {theta[d] >= 0 ? "+" : ""}{theta[d].toFixed(3)}
                  </span>
                  <span style={{ color: "var(--muted)" }}>× x_std{d > 1 ? `^${d}` : d === 1 ? "" : ""}</span>
                  <span style={{ fontSize: 10, color: "var(--faint)" }}>
                    {d === 0 ? "(intercept)" : d === 1 ? "(linear)" : d === 2 ? "(quadratic)" : `(degree ${d})`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, val, color }: { label: string; val: string; color: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{ fontSize: 12.5, color: "var(--muted)" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color, fontFamily: "ui-monospace, monospace" }}>{val}</span>
    </div>
  );
}
