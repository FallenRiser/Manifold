"use client";

import { useState } from "react";

// As you add useless (noise) predictors, R² only ever climbs — but adjusted R²
// applies a complexity penalty and falls once the features stop earning their keep.
const N = 20;
const R2_0 = 0.6;

export function RSquaredLab() {
  const [p, setP] = useState(0);

  const r2 = Math.min(0.99, R2_0 + 0.018 * p);              // R² creeps up with junk features
  const adj = 1 - (1 - r2) * (N - 1) / (N - p - 1);          // adjusted R² penalises p

  const barW = 150;
  const bar = (v: number) => Math.max(0, Math.min(1, v)) * barW;

  return (
    <div style={wrap}>
      <div style={head}>R² vs adjusted R² — adding junk features</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
        <Metric label="R²" value={r2} color="var(--c-regression)" w={bar(r2)} barW={barW}
          note="Always rises (or holds) as features are added — it can't tell signal from noise." />
        <Metric label="Adjusted R²" value={adj} color={adj < R2_0 ? "var(--bad)" : "var(--good)"} w={bar(adj)} barW={barW}
          note="Charges a penalty per feature. Useless features make it fall." />
      </div>
      <div style={{ marginTop: 16 }}>
        <div style={rowLbl}><span>Useless noise features added (p)</span><span style={mono}>{p}</span></div>
        <input type="range" min={0} max={15} step={1} value={p}
          onChange={(e) => setP(parseInt(e.target.value))}
          style={{ width: "100%", accentColor: "var(--brand)", cursor: "ew-resize" }} />
      </div>
      <div style={caption}>
        {p === 0
          ? "The honest model: one real feature, R² = adjusted R² = 0.60."
          : `Added ${p} pure-noise feature${p > 1 ? "s" : ""}. R² climbed to ${r2.toFixed(2)}, but adjusted R² is ${adj.toFixed(2)} — the penalty exposes the overfitting.`}
      </div>
    </div>
  );
}

function Metric({ label, value, color, w, barW, note }: { label: string; value: number; color: string; w: number; barW: number; note: string }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color }}>{label}</span>
        <span style={mono}>{value.toFixed(3)}</span>
      </div>
      <div style={{ position: "relative", height: 12, width: barW, maxWidth: "100%", background: "var(--surface-2)", borderRadius: 6, overflow: "hidden" }}>
        <div style={{ height: "100%", width: w, background: color, transition: "width 0.12s linear" }} />
      </div>
      <div style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 6, lineHeight: 1.45 }}>{note}</div>
    </div>
  );
}

const wrap: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, margin: "1.6rem 0" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)", marginBottom: 14 };
const rowLbl: React.CSSProperties = { display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--muted)", marginBottom: 6 };
const mono: React.CSSProperties = { fontFamily: "ui-monospace, monospace", fontSize: 14, color: "var(--ink)" };
const caption: React.CSSProperties = { fontSize: 12.5, color: "var(--muted)", marginTop: 14, lineHeight: 1.5 };
