"use client";

import { useState } from "react";
import { WATERFALLS, BASE } from "@/components/figures/CapstoneBonusFigures";

// Interactive SHAP waterfall: build the explanation one feature at a time.
// All values are the REAL TreeExplainer outputs from the capstone experiment
// (same data as the static ShapWaterfallFig) — the lab adds the stepping, the
// running total, and the additivity check at the end. Nothing is invented.

type CaseKey = keyof typeof WATERFALLS;

const CASES: { key: CaseKey; label: string }[] = [
  { key: "coastal", label: "Coastal · pred 4.20" },
  { key: "inland", label: "Inland · pred 0.79" },
  { key: "capped", label: "Capped · pred 2.46" },
];

const W = 560;
const PAD_L = 168;
const PAD_R = 66;
const PAD_T = 30;
const PAD_B = 40;
const ROW_H = 26;

export function ShapExplorerLab() {
  const [which, setWhich] = useState<CaseKey>("coastal");
  const [step, setStep] = useState(0);

  const d = WATERFALLS[which];
  const rows: [string, number][] = [...d.contribs, ["9 remaining features", d.rest]];
  const cums: number[] = [BASE];
  rows.forEach(([, v]) => cums.push(cums[cums.length - 1] + v));

  const H = PAD_T + rows.length * ROW_H + PAD_B;
  const lo = Math.min(...cums) - 0.3;
  const hi = Math.max(...cums) + 0.4;
  const sx = (v: number) => PAD_L + ((v - lo) / (hi - lo)) * (W - PAD_L - PAD_R);

  const running = cums[step];
  const done = step >= rows.length;

  function pick(k: CaseKey) {
    setWhich(k);
    setStep(0);
  }

  return (
    <div style={frame}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
        <span className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
          Build the explanation yourself
        </span>
        <div style={{ display: "inline-flex", border: "1px solid var(--border-strong)", borderRadius: 9, overflow: "hidden" }}>
          {CASES.map((c) => (
            <button
              key={c.key}
              onClick={() => pick(c.key)}
              style={{
                border: "none",
                cursor: "pointer",
                padding: "6px 11px",
                fontSize: 11.5,
                fontWeight: which === c.key ? 600 : 400,
                color: which === c.key ? "var(--cta-text, var(--surface))" : "var(--muted)",
                background: which === c.key ? "var(--c-regression)" : "transparent",
                whiteSpace: "nowrap",
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>{d.title}</div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />

        {/* base value */}
        <line x1={sx(BASE)} y1={PAD_T - 12} x2={sx(BASE)} y2={H - PAD_B + 8} stroke="var(--border-strong)" strokeDasharray="3 4" />
        <text x={sx(BASE)} y={PAD_T - 17} fontSize={10} fill="var(--faint)" textAnchor="middle">base {BASE.toFixed(2)}</text>

        {rows.map(([label, v], i) => {
          const y = PAD_T + i * ROW_H;
          const revealed = i < step;
          const x0 = sx(cums[i]);
          const x1 = sx(cums[i + 1]);
          const pos = v >= 0;
          return (
            <g key={label} opacity={revealed ? 1 : 0.28}>
              <text x={PAD_L - 8} y={y + ROW_H / 2 + 3.5} fontSize={10.5} fill={revealed ? "var(--muted)" : "var(--faint)"} textAnchor="end">
                {label}
              </text>
              {revealed ? (
                <>
                  <rect
                    x={Math.min(x0, x1)}
                    y={y + 4}
                    width={Math.max(1.5, Math.abs(x1 - x0))}
                    height={ROW_H - 9}
                    rx={2}
                    fill={pos ? "var(--brand-2)" : "var(--c-regression)"}
                    fillOpacity={0.85}
                  />
                  <text
                    x={(pos ? Math.max(x0, x1) : Math.min(x0, x1)) + (pos ? 5 : -5)}
                    y={y + ROW_H / 2 + 3.5}
                    fontSize={10}
                    fill="var(--ink)"
                    textAnchor={pos ? "start" : "end"}
                  >
                    {v > 0 ? "+" : ""}{v.toFixed(2)}
                  </text>
                </>
              ) : (
                <text x={PAD_L + 4} y={y + ROW_H / 2 + 3.5} fontSize={10} fill="var(--faint)">?</text>
              )}
            </g>
          );
        })}

        {/* running-total marker */}
        <line x1={sx(running)} y1={PAD_T - 4} x2={sx(running)} y2={H - PAD_B + 8} stroke="var(--c-fundamentals)" strokeWidth={1.8} style={{ transition: "all 0.35s ease" }} />
        <text x={sx(running)} y={H - PAD_B + 22} fontSize={11} fontWeight={600} fill="var(--c-fundamentals)" textAnchor="middle" style={{ transition: "all 0.35s ease" }}>
          {running.toFixed(2)}
        </text>
        {done && (
          <text x={sx(running)} y={H - PAD_B + 34} fontSize={9.5} fill="var(--muted)" textAnchor="middle">
            = model output {d.pred.toFixed(2)} · actual {d.actual.toFixed(2)}
          </text>
        )}
      </svg>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12, alignItems: "center" }}>
        <button style={btn} onClick={() => setStep((s) => Math.min(rows.length, s + 1))} disabled={done}>
          {step === 0 ? "Start at the base value →" : done ? "All features added" : `Add next feature (${rows.length - step} left)`}
        </button>
        <button style={btnGhost} onClick={() => setStep(rows.length)} disabled={done}>Add all</button>
        <button style={btnGhost} onClick={() => setStep(0)}>Start over</button>
        <div style={{ flex: 1 }} />
        <div style={{ background: "var(--surface-2)", borderRadius: 9, padding: "6px 11px" }}>
          <div style={{ fontSize: 10, color: "var(--muted)" }}>running total ($100k)</div>
          <div style={{ fontSize: 16, fontWeight: 500, color: "var(--ink)", fontFamily: "var(--font-geist-mono, monospace)" }}>{running.toFixed(3)}</div>
        </div>
      </div>

      {done && (
        <div
          style={{
            marginTop: 10,
            padding: "9px 12px",
            borderRadius: 9,
            fontSize: 12.5,
            lineHeight: 1.55,
            color: "var(--muted)",
            background: "color-mix(in srgb, var(--good) 7%, var(--surface))",
            border: "1px solid color-mix(in srgb, var(--good) 25%, var(--border))",
          }}
        >
          Additivity check: {BASE.toFixed(2)} {cums[cums.length - 1] - BASE >= 0 ? "+" : "−"} {Math.abs(cums[cums.length - 1] - BASE).toFixed(2)} ={" "}
          <b style={{ color: "var(--ink)" }}>{cums[cums.length - 1].toFixed(2)}</b> — exactly the model&rsquo;s output. SHAP values are
          guaranteed to sum to the prediction; nothing is left unexplained.
        </div>
      )}
    </div>
  );
}

const frame: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border-strong)",
  borderRadius: 14,
  padding: "16px 16px 14px",
};

const btn: React.CSSProperties = {
  background: "var(--c-regression)",
  color: "var(--cta-text, var(--surface))",
  border: "none",
  borderRadius: 8,
  padding: "8px 14px",
  fontSize: 12.5,
  fontWeight: 600,
  cursor: "pointer",
};

const btnGhost: React.CSSProperties = {
  background: "transparent",
  color: "var(--muted)",
  border: "1px solid var(--border-strong)",
  borderRadius: 8,
  padding: "8px 13px",
  fontSize: 12.5,
  cursor: "pointer",
};
