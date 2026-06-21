"use client";
import { useState } from "react";

const RAW: [number, number][] = [
  [1, 5.5], [2, 5.0], [3, 6.4], [4, 6.0], [5, 7.1], [6, 7.6],
  [7, 7.2], [8, 8.6], [9, 8.9], [10, 9.3], [11, 10.4], [12, 10.1],
];

// Deliberately not-quite-optimal so errors are large and visible
const M = 0.52, B = 4.9;

const W = 320, H = 250;
const X0 = 36, X1 = 294, Y0 = 222, Y1 = 18;
const px = (x: number) => X0 + ((x - 0.5) / 12.5) * (X1 - X0);
const py = (y: number) => Y0 - ((y - 3) / 9) * (Y0 - Y1);
const YSCALE = (Y0 - Y1) / 9; // px per unit-y, for drawing squares

const pts = RAW.map(([x, y]) => {
  const pred = M * x + B;
  const e = y - pred;
  return { x, y, pred, e };
});

const sumE = pts.reduce((s, p) => s + p.e, 0);
const sumE2 = pts.reduce((s, p) => s + p.e ** 2, 0);
const mse = sumE2 / pts.length;

type Step = 0 | 1 | 2;

export function CostFunctionLab() {
  const [step, setStep] = useState<Step>(0);

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.6rem 0" }}>
      {/* step selector */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {(["1 · Errors", "2 · Squared", "3 · MSE"] as const).map((label, i) => (
          <button key={i} onClick={() => setStep(i as Step)} style={step === i ? btnActive : btnTab}>
            {label}
          </button>
        ))}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block", marginBottom: 14 }}>
        <rect x={X0} y={Y1} width={X1 - X0} height={Y0 - Y1} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />

        {/* squared-error squares (step 1+) */}
        {step >= 1 && pts.map((p, i) => {
          const side = Math.abs(p.e) * YSCALE;
          const top = Math.min(py(p.y), py(p.pred));
          return (
            <rect key={i}
              x={px(p.x)} y={top}
              width={side} height={side}
              fill="var(--c-fundamentals)" fillOpacity={0.18}
              stroke="var(--c-fundamentals)" strokeWidth={0.8} strokeOpacity={0.5}
            />
          );
        })}

        {/* regression line */}
        <line x1={px(0.5)} y1={py(M * 0.5 + B)} x2={px(12.5)} y2={py(M * 12.5 + B)}
          stroke="var(--c-regression)" strokeWidth={2} strokeLinecap="round" />

        {/* residual lines */}
        {pts.map((p, i) => (
          <line key={i}
            x1={px(p.x)} y1={py(p.y)} x2={px(p.x)} y2={py(p.pred)}
            stroke={step >= 1 ? "var(--c-fundamentals)" : p.e > 0 ? "var(--good)" : "var(--bad)"}
            strokeWidth={1.8} strokeLinecap="round"
          />
        ))}

        {/* data points */}
        {pts.map((p, i) => (
          <circle key={i} cx={px(p.x)} cy={py(p.y)} r={4.2} fill="var(--ink)" fillOpacity={0.78} />
        ))}

        <text x={(X0 + X1) / 2} y={H - 4} fontSize={10.5} fill="var(--faint)" textAnchor="middle">x →</text>
      </svg>

      {/* explanation panel */}
      {step === 0 && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div style={infoBox}>
            <div style={infoLabel}>eᵢ = yᵢ − ŷᵢ</div>
            <div style={infoNote}>residual for each point</div>
          </div>
          <div style={infoBox}>
            <div style={infoLabel}>{sumE > 0 ? "+" : ""}{sumE.toFixed(2)}</div>
            <div style={infoNote}>Σeᵢ — positives &amp; negatives cancel</div>
          </div>
          <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5, margin: 0, flex: "1 1 180px" }}>
            Summing raw errors doesn&rsquo;t work — they cancel out and make a bad line look fine.
          </p>
        </div>
      )}

      {step === 1 && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div style={infoBox}>
            <div style={infoLabel}>eᵢ²</div>
            <div style={infoNote}>always positive — no canceling</div>
          </div>
          <div style={infoBox}>
            <div style={{ ...infoLabel, color: "var(--c-fundamentals)" }}>{sumE2.toFixed(2)}</div>
            <div style={infoNote}>Σeᵢ² — sum of squares</div>
          </div>
          <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5, margin: 0, flex: "1 1 180px" }}>
            Each square&rsquo;s area is eᵢ². Squaring makes all errors positive and penalises
            big misses more than small ones.
          </p>
        </div>
      )}

      {step === 2 && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div style={{ ...infoBox, borderColor: "color-mix(in srgb, var(--c-fundamentals) 30%, var(--border))", background: "color-mix(in srgb, var(--c-fundamentals) 8%, var(--surface-2))" }}>
            <div style={{ ...infoLabel, color: "var(--c-fundamentals)", fontSize: 18 }}>{mse.toFixed(3)}</div>
            <div style={infoNote}>MSE = Σeᵢ² / N</div>
          </div>
          <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, flex: "1 1 180px" }}>
            Divide by N to get a number that doesn&rsquo;t grow with dataset size.
            This single number is what the training algorithm will minimise.
            <br />
            <code style={{ fontSize: 12, background: "var(--surface-2)", padding: "2px 6px", borderRadius: 5, display: "inline-block", marginTop: 5 }}>
              MSE = (1/N) Σ (yᵢ − ŷᵢ)²
            </code>
          </div>
        </div>
      )}
    </div>
  );
}

const infoBox: React.CSSProperties = { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 9, padding: "8px 12px", minWidth: 100 };
const infoLabel: React.CSSProperties = { fontSize: 17, fontWeight: 600, color: "var(--ink)", fontFamily: "var(--font-geist-mono)" };
const infoNote: React.CSSProperties = { fontSize: 10, color: "var(--muted)", marginTop: 2 };

const btnTab: React.CSSProperties = { background: "transparent", color: "var(--muted)", border: "1px solid var(--border-strong)", fontSize: 12.5, padding: "6px 12px", borderRadius: 9, cursor: "pointer" };
const btnActive: React.CSSProperties = { ...btnTab, background: "color-mix(in srgb, var(--c-fundamentals) 12%, var(--surface))", color: "var(--c-fundamentals)", borderColor: "color-mix(in srgb, var(--c-fundamentals) 28%, var(--border))", fontWeight: 500 };
