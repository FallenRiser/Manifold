"use client";

import { useState } from "react";

// Countries with their continent label
type Category = "Europe" | "Asia" | "Americas" | "Africa";

const COUNTRIES: { name: string; cat: Category; gdp: number; happiness: number }[] = [
  { name: "Germany", cat: "Europe", gdp: 46, happiness: 7.0 },
  { name: "France", cat: "Europe", gdp: 43, happiness: 6.7 },
  { name: "UK", cat: "Europe", gdp: 41, happiness: 6.9 },
  { name: "Spain", cat: "Europe", gdp: 32, happiness: 6.5 },
  { name: "Japan", cat: "Asia", gdp: 40, happiness: 6.1 },
  { name: "India", cat: "Asia", gdp: 8, happiness: 4.0 },
  { name: "China", cat: "Asia", gdp: 18, happiness: 5.3 },
  { name: "Thailand", cat: "Asia", gdp: 9, happiness: 5.9 },
  { name: "USA", cat: "Americas", gdp: 63, happiness: 6.9 },
  { name: "Brazil", cat: "Americas", gdp: 14, happiness: 6.3 },
  { name: "Mexico", cat: "Americas", gdp: 11, happiness: 6.5 },
  { name: "Canada", cat: "Americas", gdp: 48, happiness: 7.3 },
  { name: "Nigeria", cat: "Africa", gdp: 5, happiness: 4.7 },
  { name: "S. Africa", cat: "Africa", gdp: 7, happiness: 4.8 },
  { name: "Ethiopia", cat: "Africa", gdp: 1, happiness: 4.4 },
  { name: "Egypt", cat: "Africa", gdp: 4, happiness: 4.1 },
];

const CATEGORIES: Category[] = ["Europe", "Asia", "Americas", "Africa"];
const CAT_COLORS: Record<Category, string> = {
  Europe: "var(--brand)",
  Asia: "var(--c-fundamentals)",
  Americas: "var(--good)",
  Africa: "var(--bad)",
};

const N = COUNTRIES.length;

// One-hot encode: drop one (reference = Africa)
// Features: [1, gdp, isEurope, isAsia, isAmericas]
function buildX(includeOHE: boolean): number[][] {
  return COUNTRIES.map(c => [
    1,
    c.gdp,
    ...(includeOHE ? [
      c.cat === "Europe" ? 1 : 0,
      c.cat === "Asia" ? 1 : 0,
      c.cat === "Americas" ? 1 : 0,
    ] : []),
  ]);
}

const Y = COUNTRIES.map(c => c.happiness);

// Normal equation solver
function solve(X: number[][]): number[] {
  const p = X[0].length;
  // XtX
  const XtX: number[][] = Array.from({ length: p }, (_, i) =>
    Array.from({ length: p }, (_, j) =>
      X.reduce((s, row) => s + row[i] * row[j], 0)
    )
  );
  // XtY
  const XtY = Array.from({ length: p }, (_, i) =>
    X.reduce((s, row, k) => s + row[i] * Y[k], 0)
  );
  // Gauss-Jordan
  const aug = XtX.map((row, i) => [...row, XtY[i]]);
  for (let col = 0; col < p; col++) {
    const pivot = aug[col][col];
    if (Math.abs(pivot) < 1e-10) continue;
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

const X_GDP = buildX(false);
const X_OHE = buildX(true);
const THETA_GDP = solve(X_GDP);       // [b, m_gdp]
const THETA_OHE = solve(X_OHE);       // [b, m_gdp, m_eu, m_as, m_am]

function predict(theta: number[], x: number[]) {
  return x.reduce((s, v, i) => s + v * theta[i], 0);
}

function mse(X: number[][], theta: number[]) {
  return X.reduce((s, x, i) => s + (predict(theta, x) - Y[i]) ** 2, 0) / N;
}

export function CategoricalFeaturesLab() {
  const [showOHE, setShowOHE] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);

  const theta = showOHE ? THETA_OHE : THETA_GDP;
  const X = showOHE ? X_OHE : X_GDP;
  const curMSE = mse(X, theta);
  const mseDiff = mse(X_GDP, THETA_GDP) - curMSE;

  // Chart geometry
  const cx = (gdp: number) => 44 + ((gdp - 0) / 70) * 210;
  const cy = (h: number) => 210 - ((h - 3.5) / 4.5) * 195;

  // Build a regression line per category (OHE) or one line (GDP only)
  function lineY_GDP(gdp: number) { return THETA_GDP[0] + THETA_GDP[1] * gdp; }
  function lineY_OHE(gdp: number, cat: Category) {
    const catOffset =
      cat === "Europe" ? THETA_OHE[2] :
      cat === "Asia" ? THETA_OHE[3] :
      cat === "Americas" ? THETA_OHE[4] : 0;
    return THETA_OHE[0] + THETA_OHE[1] * gdp + catOffset;
  }

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, margin: "1.6rem 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <span className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
          GDP vs happiness — with and without region
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          {CATEGORIES.map(cat => (
            <span key={cat} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, color: CAT_COLORS[cat] }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: CAT_COLORS[cat], display: "inline-block" }} />
              {cat}
            </span>
          ))}
        </div>
      </div>

      {/* Toggle */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <ToggleBtn active={!showOHE} label="GDP only" onClick={() => setShowOHE(false)} color="var(--muted)" />
        <ToggleBtn active={showOHE} label="GDP + region (one-hot)" onClick={() => setShowOHE(true)} color="var(--brand)" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
        {/* Scatter */}
        <svg viewBox="0 0 270 230" style={{ width: "100%", height: "auto", display: "block" }}>
          <rect x={44} y={5} width={210} height={205} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />

          {/* GDP-only line */}
          {!showOHE && (
            <line
              x1={cx(0)} y1={cy(lineY_GDP(0))}
              x2={cx(70)} y2={cy(lineY_GDP(70))}
              stroke="var(--muted)" strokeWidth={2} strokeLinecap="round"
            />
          )}

          {/* Per-category lines */}
          {showOHE && CATEGORIES.map(cat => (
            <line
              key={cat}
              x1={cx(0)} y1={cy(lineY_OHE(0, cat))}
              x2={cx(70)} y2={cy(lineY_OHE(70, cat))}
              stroke={CAT_COLORS[cat]} strokeWidth={1.8} strokeLinecap="round" strokeOpacity={0.8}
            />
          ))}

          {/* Points */}
          {COUNTRIES.map((c, i) => {
            const isHov = hovered === i;
            const pred = predict(theta, X[i]);
            return (
              <g key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} style={{ cursor: "default" }}>
                {isHov && (
                  <line x1={cx(c.gdp)} y1={cy(c.happiness)} x2={cx(c.gdp)} y2={cy(pred)} stroke="var(--bad)" strokeWidth={1.2} strokeOpacity={0.6} />
                )}
                <circle
                  cx={cx(c.gdp)} cy={cy(c.happiness)} r={isHov ? 5.5 : 4}
                  fill={CAT_COLORS[c.cat]} fillOpacity={0.85}
                />
                {isHov && (
                  <text x={cx(c.gdp) + 7} y={cy(c.happiness) + 4} fontSize={9.5} fill="var(--ink)">{c.name}</text>
                )}
              </g>
            );
          })}

          <text x={149} y={227} fontSize={9.5} fill="var(--faint)" textAnchor="middle">GDP per capita ($k)</text>
          <text x={12} y={108} fontSize={9.5} fill="var(--faint)" textAnchor="middle" transform="rotate(-90 12 108)">happiness score</text>
        </svg>

        {/* Right panel: encoding + stats */}
        <div>
          {/* Encoding table */}
          <div style={{ background: "var(--canvas)", borderRadius: 10, padding: "10px 12px", marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--faint)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
              One-hot encoding (reference: Africa)
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ color: "var(--faint)", borderBottom: "1px solid var(--border)" }}>
                  <th style={{ padding: "3px 6px", fontWeight: 400, textAlign: "left" }}>region</th>
                  <th style={{ padding: "3px 6px", fontWeight: 400, textAlign: "center" }}>isEurope</th>
                  <th style={{ padding: "3px 6px", fontWeight: 400, textAlign: "center" }}>isAsia</th>
                  <th style={{ padding: "3px 6px", fontWeight: 400, textAlign: "center" }}>isAmericas</th>
                </tr>
              </thead>
              <tbody>
                {CATEGORIES.map(cat => (
                  <tr key={cat} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "3px 6px", color: CAT_COLORS[cat], fontWeight: 500 }}>{cat}</td>
                    <td style={{ padding: "3px 6px", textAlign: "center", color: "var(--muted)" }}>{cat === "Europe" ? "1" : "0"}</td>
                    <td style={{ padding: "3px 6px", textAlign: "center", color: "var(--muted)" }}>{cat === "Asia" ? "1" : "0"}</td>
                    <td style={{ padding: "3px 6px", textAlign: "center", color: "var(--muted)" }}>{cat === "Americas" ? "1" : "0"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Coefficients */}
          <div style={{ background: "var(--canvas)", borderRadius: 10, padding: "10px 12px", marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--faint)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
              Fitted coefficients
            </div>
            {showOHE ? (
              <>
                <CoeffRow label="intercept" val={THETA_OHE[0]} />
                <CoeffRow label="GDP effect" val={THETA_OHE[1]} />
                <CoeffRow label="Europe bonus" val={THETA_OHE[2]} color="var(--brand)" />
                <CoeffRow label="Asia bonus" val={THETA_OHE[3]} color="var(--c-fundamentals)" />
                <CoeffRow label="Americas bonus" val={THETA_OHE[4]} color="var(--good)" />
              </>
            ) : (
              <>
                <CoeffRow label="intercept" val={THETA_GDP[0]} />
                <CoeffRow label="GDP effect" val={THETA_GDP[1]} />
              </>
            )}
          </div>

          {/* MSE comparison */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <MiniStat label="MSE (GDP only)" val={mse(X_GDP, THETA_GDP).toFixed(3)} color="var(--muted)" />
            <MiniStat label="MSE (+ region)" val={mse(X_OHE, THETA_OHE).toFixed(3)} color="var(--good)" />
          </div>
          {mseDiff > 0 && showOHE && (
            <div style={{ fontSize: 12.5, color: "var(--good)", marginTop: 8 }}>
              Adding region columns reduced MSE by {mseDiff.toFixed(3)} — a {((mseDiff / mse(X_GDP, THETA_GDP)) * 100).toFixed(0)}% improvement.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ToggleBtn({ active, label, onClick, color }: { active: boolean; label: string; onClick: () => void; color: string }) {
  return (
    <button onClick={onClick} style={{
      padding: "6px 14px", borderRadius: 10, fontSize: 12.5, cursor: "pointer",
      border: `1.5px solid ${active ? color : "var(--border-strong)"}`,
      background: active ? `color-mix(in srgb, ${color} 12%, var(--surface))` : "transparent",
      color: active ? color : "var(--muted)",
      fontWeight: active ? 500 : 400,
      transition: "all 0.15s",
    }}>{label}</button>
  );
}

function CoeffRow({ label, val, color }: { label: string; val: number; color?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 12.5 }}>
      <span style={{ color: "var(--muted)" }}>{label}</span>
      <span style={{ fontFamily: "ui-monospace, monospace", fontWeight: 500, color: color ?? "var(--ink)" }}>
        {val >= 0 ? "+" : ""}{val.toFixed(3)}
      </span>
    </div>
  );
}

function MiniStat({ label, val, color }: { label: string; val: string; color: string }) {
  return (
    <div style={{ background: "var(--surface-2)", borderRadius: 9, padding: "8px 10px" }}>
      <div style={{ fontSize: 10.5, color: "var(--muted)", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color, fontFamily: "ui-monospace, monospace" }}>{val}</div>
    </div>
  );
}
