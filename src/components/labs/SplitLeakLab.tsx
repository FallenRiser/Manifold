"use client";

import { useMemo, useState } from "react";

// The leakage trap, made visible and measurable. Each near-Earth OBJECT appears in
// many rows (one per close approach). If you split rows at random, the same object
// lands in both train and test — the model can memorise it instead of learning what
// makes objects hazardous, and the reported score is inflated. A GROUPED split keeps
// every object wholly on one side, so the test is honest.
//
// Two linked views the reader toggles between (random vs grouped):
//   1. a membership schematic — objects whose rows straddle the split are flagged;
//   2. the resulting PR-AUC per model, with the honest (grouped) value marked, so
//      the inflation is a visible overshoot. All PR-AUC numbers are real, from
//      scripts/neo_cases.py (RANDOM vs GROUPED-by-id, RS=0).

function mulberry32(a: number) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// PR-AUC, real (scripts/neo_cases.py). random = leaky split, grouped = honest split.
const MODELS = [
  { name: "Size rule (−H)", random: 0.277, grouped: 0.289, flexible: false },
  { name: "Logistic", random: 0.293, grouped: 0.309, flexible: false },
  { name: "Decision tree (d=6)", random: 0.433, grouped: 0.430, flexible: false },
  { name: "Random forest", random: 0.566, grouped: 0.478, flexible: true },
  { name: "Hist grad boosting", random: 0.520, grouped: 0.472, flexible: true },
];
const PREV = 0.1; // chance PR-AUC = class prevalence
const AXIS_MAX = 0.62;

// Fixed object layout: 20 objects, each with 2–4 "approach" rows.
const OBJECTS = (() => {
  const r = mulberry32(11);
  return Array.from({ length: 20 }, (_, i) => ({
    id: i,
    rows: 2 + Math.floor(r() * 3), // 2..4 approaches
    grp: r() < 0.5 ? 0 : 1, // grouped-split side
  }));
})();

const SPACE = "var(--c-space)";

export function SplitLeakLab() {
  const [grouped, setGrouped] = useState(false);

  // Assign each object's rows to train(0)/test(1). Random: per-row coin flip → an
  // object can straddle. Grouped: whole object to one side by its grp.
  const { cells, leaks } = useMemo(() => {
    const r = mulberry32(42);
    let leaks = 0;
    const cells = OBJECTS.map((o) => {
      const sides = Array.from({ length: o.rows }, () => (grouped ? o.grp : r() < 0.5 ? 0 : 1));
      const straddles = !grouped && sides.some((s) => s === 0) && sides.some((s) => s === 1);
      if (straddles) leaks++;
      return { ...o, sides, straddles };
    });
    return { cells, leaks };
  }, [grouped]);

  const train = "var(--c-space)";
  const test = "var(--c-fundamentals)";

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 14, background: "var(--surface)", padding: "16px 16px 18px" }}>
      {/* toggle */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        {([["random", "Random split"], ["grouped", "Grouped-by-object split"]] as const).map(([k, label]) => {
          const active = (k === "grouped") === grouped;
          return (
            <button
              key={k}
              onClick={() => setGrouped(k === "grouped")}
              style={{
                fontSize: 13, fontWeight: 500, padding: "7px 13px", borderRadius: 9, cursor: "pointer",
                border: `1px solid ${active ? SPACE : "var(--border-strong)"}`,
                background: active ? `color-mix(in srgb, ${SPACE} 12%, var(--surface))` : "var(--surface)",
                color: active ? SPACE : "var(--muted)",
                transition: "all 0.15s ease",
              }}
            >
              {label}
            </button>
          );
        })}
        <span style={{ marginLeft: "auto", fontSize: 12.5, color: "var(--faint)" }}>
          <span style={{ display: "inline-block", width: 9, height: 9, borderRadius: 2, background: train, marginRight: 5, verticalAlign: "middle" }} />train
          <span style={{ display: "inline-block", width: 9, height: 9, borderRadius: 2, background: test, margin: "0 5px 0 12px", verticalAlign: "middle" }} />test
        </span>
      </div>

      {/* membership schematic */}
      <div style={{ fontSize: 12, color: "var(--faint)", marginBottom: 8 }}>
        Each box is one object; its cells are that object&rsquo;s close-approach rows, coloured by which set they fall in.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(58px, 1fr))", gap: 8, marginBottom: 6 }}>
        {cells.map((o) => (
          <div
            key={o.id}
            style={{
              display: "flex", gap: 3, flexWrap: "wrap", justifyContent: "center", alignItems: "center",
              padding: "8px 4px", borderRadius: 9, minHeight: 42,
              border: `1.5px solid ${o.straddles ? "var(--bad)" : "var(--border)"}`,
              background: o.straddles ? "color-mix(in srgb, var(--bad) 7%, var(--surface))" : "var(--surface-2)",
            }}
          >
            {o.sides.map((s, j) => (
              <span key={j} style={{ width: 11, height: 11, borderRadius: 3, background: s === 0 ? train : test }} />
            ))}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 13, marginBottom: 18, color: leaks ? "var(--bad)" : "var(--good)", fontWeight: 500 }}>
        {leaks
          ? `⚠ ${leaks} of 20 objects straddle the split — the same asteroid is in BOTH train and test.`
          : "✓ 0 objects straddle the split — every asteroid is wholly train OR test. Honest."}
      </div>

      {/* PR-AUC bars */}
      <div style={{ fontSize: 12.5, color: "var(--faint)", marginBottom: 10 }}>
        Resulting <strong style={{ color: "var(--muted)" }}>PR-AUC</strong> per model
        {" "}(the vertical tick marks the honest, grouped-split value):
      </div>
      <div style={{ display: "grid", gap: 9 }}>
        {MODELS.map((m) => {
          const val = grouped ? m.grouped : m.random;
          const honest = m.grouped;
          const pct = (v: number) => `${(v / AXIS_MAX) * 100}%`;
          const inflated = !grouped && val > honest + 0.01;
          return (
            <div key={m.name} style={{ display: "grid", gridTemplateColumns: "132px 1fr 46px", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 12.5, color: "var(--ink)", textAlign: "right" }}>{m.name}</span>
              <div style={{ position: "relative", height: 18, background: "var(--surface-2)", borderRadius: 5, border: "1px solid var(--border)" }}>
                {/* chance line */}
                <div style={{ position: "absolute", left: pct(PREV), top: -2, bottom: -2, width: 1, background: "var(--faint)", opacity: 0.6 }} />
                {/* the bar */}
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: pct(val), background: inflated ? "var(--bad)" : m.flexible ? SPACE : "var(--muted)", borderRadius: 5, transition: "width 0.45s cubic-bezier(.4,0,.2,1), background 0.3s ease" }} />
                {/* honest reference tick */}
                <div style={{ position: "absolute", left: pct(honest), top: -3, bottom: -3, width: 2, background: "var(--ink)", opacity: 0.75 }} />
              </div>
              <span style={{ fontSize: 12.5, fontVariantNumeric: "tabular-nums", color: inflated ? "var(--bad)" : "var(--muted)", fontWeight: inflated ? 600 : 400 }}>
                {val.toFixed(3)}
              </span>
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 8, textAlign: "right" }}>
        chance = {PREV.toFixed(2)} (class prevalence) · axis 0–{AXIS_MAX}
      </div>
    </div>
  );
}
