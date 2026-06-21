"use client";

import { useState } from "react";

// Simulate different violation scenarios
type Scenario = "ok" | "nonlinear" | "hetero" | "outlier";

const SCENARIOS: { id: Scenario; label: string; desc: string }[] = [
  { id: "ok", label: "All satisfied", desc: "Residuals are random, small, and evenly spread." },
  { id: "nonlinear", label: "Non-linearity", desc: "Residuals curve — the relationship isn't linear." },
  { id: "hetero", label: "Heteroscedasticity", desc: "Residuals fan out — variance grows with fitted values." },
  { id: "outlier", label: "Outlier influence", desc: "One extreme point pulls the line off the true pattern." },
];

const N = 40;

function seeded(n: number): () => number {
  let s = n;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function buildDataset(scenario: Scenario): { x: number; y: number; fitted: number; residual: number }[] {
  const rng = seeded(42);
  const pts: { x: number; y: number; fitted: number; residual: number }[] = [];
  for (let i = 0; i < N; i++) {
    const x = i / (N - 1); // 0..1
    const noise = (rng() - 0.5) * 0.18;
    let y: number;
    if (scenario === "ok") {
      y = 0.5 + 1.2 * x + noise;
    } else if (scenario === "nonlinear") {
      y = 0.3 + 2.5 * x - 2.2 * x * x + noise;
    } else if (scenario === "hetero") {
      y = 0.5 + 1.2 * x + noise * (1 + 3 * x);
    } else {
      y = i === 35 ? 3.2 : 0.5 + 1.2 * x + noise;
    }
    pts.push({ x, y, fitted: 0, residual: 0 });
  }
  // OLS fit
  const xMean = pts.reduce((s, p) => s + p.x, 0) / N;
  const yMean = pts.reduce((s, p) => s + p.y, 0) / N;
  const num = pts.reduce((s, p) => s + (p.x - xMean) * (p.y - yMean), 0);
  const den = pts.reduce((s, p) => s + (p.x - xMean) ** 2, 0);
  const m = num / den;
  const b = yMean - m * xMean;
  return pts.map(p => {
    const fitted = m * p.x + b;
    return { ...p, fitted, residual: p.y - fitted };
  });
}

export function AssumptionsDiagnosticLab() {
  const [scenario, setScenario] = useState<Scenario>("ok");
  const data = buildDataset(scenario);

  // Chart geometry
  const W = 230, H = 180;
  const px = (x: number) => 16 + x * (W - 32);
  const py = (y: number) => H - 16 - ((y - -0.4) / (3.8 - -0.4)) * (H - 32);
  const rx = (fitted: number) => 16 + ((fitted - 0.3) / (1.8 - 0.3)) * (W - 32);
  const ry = (resid: number) => H / 2 - resid * 120;

  const sc = SCENARIOS.find(s => s.id === scenario)!;
  const isViolation = scenario !== "ok";

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, margin: "1.6rem 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <span className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
          Residual diagnostic plots
        </span>
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>scatter + residual-vs-fitted</span>
      </div>

      {/* Scenario selector */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {SCENARIOS.map(s => (
          <button key={s.id} onClick={() => setScenario(s.id)} style={{
            padding: "5px 13px", borderRadius: 999, fontSize: 12.5, cursor: "pointer",
            border: `1.5px solid ${scenario === s.id ? (s.id === "ok" ? "var(--good)" : "var(--bad)") : "var(--border)"}`,
            background: scenario === s.id
              ? `color-mix(in srgb, ${s.id === "ok" ? "var(--good)" : "var(--bad)"} 13%, var(--surface))`
              : "transparent",
            color: scenario === s.id ? (s.id === "ok" ? "var(--good)" : "var(--bad)") : "var(--faint)",
            fontWeight: scenario === s.id ? 600 : 400,
            transition: "all 0.15s",
          }}>{s.label}</button>
        ))}
      </div>

      {/* Status badge */}
      <div style={{
        background: `color-mix(in srgb, ${isViolation ? "var(--bad)" : "var(--good)"} 8%, var(--canvas))`,
        border: `1.5px solid color-mix(in srgb, ${isViolation ? "var(--bad)" : "var(--good)"} 25%, var(--border))`,
        borderRadius: 10, padding: "8px 12px", marginBottom: 14, fontSize: 13,
      }}>
        <span style={{ fontWeight: 600, color: isViolation ? "var(--bad)" : "var(--good)" }}>
          {isViolation ? "⚠ Assumption violated" : "✓ Assumptions satisfied"}
        </span>
        <span style={{ color: "var(--muted)", marginLeft: 8 }}>— {sc.desc}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
        {/* Scatter + fitted line */}
        <div>
          <div style={{ fontSize: 11, color: "var(--faint)", marginBottom: 4, textAlign: "center" }}>data + fitted line</div>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
            <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
            {/* Fitted line */}
            <line
              x1={px(0)} y1={py(data[0].fitted)}
              x2={px(1)} y2={py(data[N - 1].fitted)}
              stroke="var(--brand)" strokeWidth={2} strokeLinecap="round"
            />
            {/* Points */}
            {data.map((d, i) => (
              <circle key={i} cx={px(d.x)} cy={py(d.y)} r={2.8}
                fill={scenario === "outlier" && i === 35 ? "var(--bad)" : "var(--c-regression)"}
                fillOpacity={0.8}
              />
            ))}
          </svg>
        </div>

        {/* Residual vs fitted */}
        <div>
          <div style={{ fontSize: 11, color: "var(--faint)", marginBottom: 4, textAlign: "center" }}>residuals vs fitted values</div>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
            <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
            {/* Zero line */}
            <line x1={16} y1={H / 2} x2={W - 16} y2={H / 2} stroke="var(--brand)" strokeWidth={1} strokeDasharray="4 3" strokeOpacity={0.7} />
            {/* Residual dots */}
            {data.map((d, i) => (
              <circle key={i}
                cx={rx(d.fitted)} cy={ry(d.residual)} r={2.8}
                fill={scenario === "outlier" && i === 35 ? "var(--bad)" : isViolation ? "var(--warn)" : "var(--c-regression)"}
                fillOpacity={0.8}
              />
            ))}
            <text x={W / 2} y={H - 2} fontSize={9} fill="var(--faint)" textAnchor="middle">fitted →</text>
            <text x={6} y={H / 2 + 3} fontSize={9} fill="var(--faint)" textAnchor="middle" transform={`rotate(-90 6 ${H / 2})`}>resid</text>
          </svg>
        </div>
      </div>
    </div>
  );
}
