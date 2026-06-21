"use client";

import { useState } from "react";

// Dataset: (study hours, exam score)
const DATASET: [number, number][] = [
  [1, 52], [2, 58], [3, 64], [4, 68], [5, 73],
  [6, 76], [7, 80], [8, 84], [9, 87], [10, 91],
];
const N = DATASET.length;

// Build design matrix X (bias column + feature column)
const X = DATASET.map(([x]) => [1, x]);
const Y = DATASET.map(([, y]) => y);

// Matrix helpers (2x2 only, sufficient here)
function matT(A: number[][]): number[][] {
  return A[0].map((_, j) => A.map(row => row[j]));
}
function mat2x2Mul(A: number[][], B: number[][]): number[][] {
  const rows = A.length, cols = B[0].length, inner = B.length;
  return Array.from({ length: rows }, (_, i) =>
    Array.from({ length: cols }, (_, j) =>
      Array.from({ length: inner }, (_, k) => A[i][k] * B[k][j]).reduce((a, b) => a + b, 0)
    )
  );
}
function mat2x2VecMul(A: number[][], v: number[]): number[] {
  return A.map(row => row.reduce((s, a, j) => s + a * v[j], 0));
}
function inv2x2(A: number[][]): number[][] {
  const [[a, b], [c, d]] = A;
  const det = a * d - b * c;
  return [
    [d / det, -b / det],
    [-c / det, a / det],
  ];
}

// Compute everything
const Xt = matT(X);
const XtX = mat2x2Mul(Xt, X);
const XtY = mat2x2VecMul(Xt, Y);
const XtX_inv = inv2x2(XtX);
const THETA = mat2x2VecMul(XtX_inv, XtY); // [b, m]

// For display
function fmt(v: number, d = 3) {
  return v.toFixed(d);
}

const STEPS = [
  "dataset",
  "design-matrix",
  "XtX",
  "XtY",
  "inv",
  "theta",
  "result",
] as const;
type Step = (typeof STEPS)[number];

const STEP_LABELS: Record<Step, string> = {
  "dataset": "1 · The data",
  "design-matrix": "2 · Design matrix X",
  "XtX": "3 · Compute XᵀX",
  "XtY": "4 · Compute Xᵀy",
  "inv": "5 · Invert XᵀX",
  "theta": "6 · Multiply to get θ*",
  "result": "7 · The best-fit line",
};

export function NormalEquationLab() {
  const [step, setStep] = useState<Step>("dataset");

  const stepIdx = STEPS.indexOf(step);

  // Scatter geometry
  const px = (x: number) => 44 + ((x - 0) / 11) * 220;
  const py = (y: number) => 220 - ((y - 45) / 55) * 200;

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, margin: "1.6rem 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <span className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
          The normal equation — step by step
        </span>
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>
          click each step to walk through the derivation
        </span>
      </div>

      {/* Step pills */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        {STEPS.map((s, i) => {
          const active = s === step;
          const done = i < stepIdx;
          return (
            <button
              key={s}
              onClick={() => setStep(s)}
              style={{
                padding: "5px 12px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: active ? 600 : 400,
                border: `1.5px solid ${active ? "var(--brand)" : done ? "var(--border-strong)" : "var(--border)"}`,
                background: active
                  ? "color-mix(in srgb, var(--brand) 14%, var(--surface))"
                  : done
                  ? "var(--surface-2)"
                  : "transparent",
                color: active ? "var(--brand)" : done ? "var(--ink)" : "var(--faint)",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {STEP_LABELS[s]}
            </button>
          );
        })}
      </div>

      {/* Step content */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
        {/* Left: explanation + math */}
        <div style={{ background: "var(--canvas)", borderRadius: 12, padding: "14px 16px" }}>
          {step === "dataset" && (
            <>
              <StepTitle>The training data</StepTitle>
              <p style={prose}>
                We have {N} observations — hours studied and exam score. We want
                to find the line that fits them best: <code>ŷ = m·x + b</code>.
                The normal equation solves for m and b <em>directly</em>, without
                any iteration.
              </p>
              <MiniTable
                headers={["i", "x (hours)", "y (score)"]}
                rows={DATASET.map(([x, y], i) => [String(i + 1), String(x), String(y)])}
              />
            </>
          )}

          {step === "design-matrix" && (
            <>
              <StepTitle>Design matrix X</StepTitle>
              <p style={prose}>
                We add a column of 1s to X. That column handles the intercept b
                automatically — it's the same as having a feature whose value is
                always 1. Now both b and m live in a single vector θ = [b, m]ᵀ.
              </p>
              <div style={matBox}>
                <span style={matLabel}>X =</span>
                <Matrix rows={X.slice(0, 5).map(r => r.map(String))} ellipsis />
              </div>
              <p style={{ ...prose, marginTop: 10 }}>
                Shape: {N}×2 (N rows, 2 parameters).
              </p>
            </>
          )}

          {step === "XtX" && (
            <>
              <StepTitle>XᵀX — the Gram matrix</StepTitle>
              <p style={prose}>
                Multiply Xᵀ (2×N) by X (N×2) to get a 2×2 matrix. It captures
                how many data points there are, their mean, and their variance —
                everything the geometry of the fit depends on.
              </p>
              <div style={matBox}>
                <span style={matLabel}>XᵀX =</span>
                <Matrix rows={XtX.map(r => r.map(v => fmt(v, 1)))} />
              </div>
            </>
          )}

          {step === "XtY" && (
            <>
              <StepTitle>Xᵀy — the target projection</StepTitle>
              <p style={prose}>
                Multiply Xᵀ (2×N) by y (N×1) to get a 2-vector. This projects
                the targets onto the feature directions — it encodes how much the
                output varies with each input.
              </p>
              <div style={matBox}>
                <span style={matLabel}>Xᵀy =</span>
                <ColVec vals={XtY.map(v => fmt(v, 1))} />
              </div>
            </>
          )}

          {step === "inv" && (
            <>
              <StepTitle>(XᵀX)⁻¹ — the inverse</StepTitle>
              <p style={prose}>
                Invert XᵀX. For a 2×2 matrix [a b; c d] the inverse is
                [d −b; −c a] / det, where det = ad−bc. In higher dimensions you'd
                use LU factorisation. The inverse "undoes" XᵀX so we can isolate θ.
              </p>
              <div style={matBox}>
                <span style={matLabel}>(XᵀX)⁻¹ =</span>
                <Matrix rows={XtX_inv.map(r => r.map(v => fmt(v, 5)))} />
              </div>
            </>
          )}

          {step === "theta" && (
            <>
              <StepTitle>θ* = (XᵀX)⁻¹Xᵀy</StepTitle>
              <p style={prose}>
                One matrix–vector multiply and we're done. The result is the{" "}
                <strong>unique global minimum</strong> — the exact same answer
                gradient descent spirals toward, but found in a single shot.
              </p>
              <div style={matBox}>
                <span style={matLabel}>θ* =</span>
                <ColVec vals={THETA.map(v => fmt(v, 4))} labels={["b (intercept)", "m (slope)"]} />
              </div>
            </>
          )}

          {step === "result" && (
            <>
              <StepTitle>The best-fit line</StepTitle>
              <p style={prose}>
                The line is: <code>ŷ = {fmt(THETA[1], 2)}·x + {fmt(THETA[0], 2)}</code>.
                This is provably the line with the lowest possible MSE on this dataset —
                there is no better straight line.
              </p>
              <div style={{ marginTop: 10 }}>
                <StatRow label="slope m" val={fmt(THETA[1], 4)} color="var(--brand)" />
                <StatRow label="intercept b" val={fmt(THETA[0], 4)} color="var(--brand)" />
                <StatRow
                  label="MSE"
                  val={fmt(
                    DATASET.reduce((s, [x, y]) => s + (THETA[1] * x + THETA[0] - y) ** 2, 0) / N,
                    4
                  )}
                  color="var(--good)"
                />
              </div>
            </>
          )}
        </div>

        {/* Right: scatter + line */}
        <svg viewBox="0 0 290 240" style={{ width: "100%", height: "auto", display: "block" }}>
          <rect x={44} y={10} width={220} height={210} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />

          {/* Axis ticks */}
          {[2, 4, 6, 8, 10].map(v => (
            <g key={v}>
              <line x1={px(v)} y1={218} x2={px(v)} y2={222} stroke="var(--faint)" strokeWidth={1} />
              <text x={px(v)} y={232} fontSize={9} fill="var(--faint)" textAnchor="middle">{v}</text>
            </g>
          ))}
          {[50, 60, 70, 80, 90].map(v => (
            <g key={v}>
              <line x1={42} y1={py(v)} x2={46} y2={py(v)} stroke="var(--faint)" strokeWidth={1} />
              <text x={40} y={py(v) + 3.5} fontSize={9} fill="var(--faint)" textAnchor="end">{v}</text>
            </g>
          ))}

          {/* Best-fit line (shown from step 6 onward) */}
          {stepIdx >= 5 && (
            <line
              x1={px(0.5)} y1={py(THETA[1] * 0.5 + THETA[0])}
              x2={px(10.5)} y2={py(THETA[1] * 10.5 + THETA[0])}
              stroke="var(--brand)" strokeWidth={2.5} strokeLinecap="round"
            />
          )}

          {/* Residuals (step 7 only) */}
          {step === "result" && DATASET.map(([x, y], i) => (
            <line
              key={i}
              x1={px(x)} y1={py(y)}
              x2={px(x)} y2={py(THETA[1] * x + THETA[0])}
              stroke="var(--bad)" strokeWidth={1.2} strokeOpacity={0.55}
            />
          ))}

          {/* Data points */}
          {DATASET.map(([x, y], i) => (
            <circle
              key={i}
              cx={px(x)} cy={py(y)} r={3.8}
              fill={stepIdx >= 5 ? "var(--c-regression)" : "var(--muted)"}
              fillOpacity={0.85}
            />
          ))}

          <text x={154} y={237} fontSize={9.5} fill="var(--faint)" textAnchor="middle">hours studied</text>
          <text x={14} y={115} fontSize={9.5} fill="var(--faint)" textAnchor="middle" transform="rotate(-90 14 115)">score</text>
        </svg>
      </div>

      {/* Nav */}
      <div style={{ display: "flex", gap: 10, marginTop: 14, justifyContent: "flex-end" }}>
        <button
          onClick={() => setStep(STEPS[Math.max(0, stepIdx - 1)])}
          disabled={stepIdx === 0}
          style={{ ...btnGhost, opacity: stepIdx === 0 ? 0.4 : 1 }}
        >← Back</button>
        <button
          onClick={() => setStep(STEPS[Math.min(STEPS.length - 1, stepIdx + 1)])}
          disabled={stepIdx === STEPS.length - 1}
          style={{ ...btnPrimary, opacity: stepIdx === STEPS.length - 1 ? 0.4 : 1 }}
        >Next →</button>
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────

function StepTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-display" style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)", marginBottom: 8 }}>
      {children}
    </div>
  );
}

function Matrix({ rows, ellipsis }: { rows: string[][]; ellipsis?: boolean }) {
  return (
    <div style={{ display: "inline-block", border: "1px solid var(--border-strong)", borderRadius: 6, padding: "6px 10px", fontFamily: "ui-monospace, monospace", fontSize: 12 }}>
      {rows.map((row, i) => (
        <div key={i} style={{ display: "flex", gap: 14, color: "var(--ink)" }}>
          {row.map((v, j) => <span key={j} style={{ minWidth: 36, textAlign: "right" }}>{v}</span>)}
        </div>
      ))}
      {ellipsis && <div style={{ textAlign: "center", color: "var(--faint)", fontSize: 11 }}>⋮</div>}
    </div>
  );
}

function ColVec({ vals, labels }: { vals: string[]; labels?: string[] }) {
  return (
    <div style={{ display: "inline-block", border: "1px solid var(--border-strong)", borderRadius: 6, padding: "6px 10px", fontFamily: "ui-monospace, monospace", fontSize: 12 }}>
      {vals.map((v, i) => (
        <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", color: "var(--ink)" }}>
          <span style={{ minWidth: 60, textAlign: "right", fontWeight: 500 }}>{v}</span>
          {labels && <span style={{ fontSize: 11, color: "var(--faint)" }}>{labels[i]}</span>}
        </div>
      ))}
    </div>
  );
}

function MiniTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginTop: 8 }}>
      <thead>
        <tr>{headers.map(h => <th key={h} style={{ padding: "3px 8px", textAlign: "right", color: "var(--faint)", fontWeight: 400, borderBottom: "1px solid var(--border)" }}>{h}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>{row.map((v, j) => <td key={j} style={{ padding: "2px 8px", textAlign: "right", color: "var(--muted)" }}>{v}</td>)}</tr>
        ))}
      </tbody>
    </table>
  );
}

function StatRow({ label, val, color }: { label: string; val: string; color: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{ fontSize: 13, color: "var(--muted)" }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600, color, fontFamily: "ui-monospace, monospace" }}>{val}</span>
    </div>
  );
}

const prose: React.CSSProperties = { margin: "0 0 10px", fontSize: 13.5, color: "var(--muted)", lineHeight: 1.65 };
const matBox: React.CSSProperties = { display: "flex", alignItems: "center", gap: 10, marginTop: 8 };
const matLabel: React.CSSProperties = { fontSize: 13, color: "var(--faint)", fontFamily: "ui-monospace, monospace" };

const btnPrimary: React.CSSProperties = { background: "var(--cta)", color: "#fff", border: "none", fontSize: 13, fontWeight: 500, padding: "8px 18px", borderRadius: 10, cursor: "pointer" };
const btnGhost: React.CSSProperties = { background: "transparent", color: "var(--muted)", border: "1px solid var(--border-strong)", fontSize: 13, padding: "8px 14px", borderRadius: 10, cursor: "pointer" };
