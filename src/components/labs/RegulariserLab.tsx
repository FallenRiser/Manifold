"use client";

import { useState } from "react";

// Measured regulariser comparison from scripts/regularisation_cases.py
// (sections 4, 7, 9): the same overfitting 3x256 MLP on 250 noisy points,
// train accuracy pinned at 1.000, test accuracy varying by regulariser.
// Every bar is a 3-seed average. The point of the picture: not all
// regularisers are equal, and the textbook-first one (weight decay) is
// nearly inert here while dropout and augmentation do the work.

type Row = { name: string; test: number; note: string; kind: "base" | "weak" | "strong" };

const ROWS: Row[] = [
  { name: "no regularisation", test: 0.753, note: "the baseline gap: 1.000 − 0.753 = 0.247", kind: "base" },
  { name: "weight decay 1e-2", test: 0.751, note: "nearly inert here — weight magnitude is not the binding constraint", kind: "weak" },
  { name: "BatchNorm (implicit)", test: 0.763, note: "regularises as a side effect: +0.010 over baseline", kind: "strong" },
  { name: "dropout 0.3", test: 0.772, note: "randomly removing units forces redundant representations", kind: "strong" },
  { name: "dropout 0.5", test: 0.777, note: "best single regulariser on this problem: +0.024", kind: "strong" },
  { name: "weight decay + dropout", test: 0.781, note: "the effects partly stack — more than either alone", kind: "strong" },
  { name: "input jitter 0.4", test: 0.784, note: "augmentation: fresh noise each epoch, never the same 250 points twice", kind: "strong" },
];

const accent = "var(--c-neural)";
const TRAIN = 1.0;
const AXIS_LO = 0.74; // zoomed x-axis so the narrow test band is legible
const AXIS_HI = 0.80;
const base = 0.753;

function frac(v: number) {
  return Math.max(0, Math.min(1, (v - AXIS_LO) / (AXIS_HI - AXIS_LO)));
}

export function RegulariserLab() {
  const [sel, setSel] = useState<Row | null>(null);

  const colorFor = (r: Row) =>
    r.kind === "base" ? "var(--muted)" : r.kind === "weak" ? "var(--bad)" : "var(--good)";

  return (
    <div>
      <div style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 10 }}>
        Test accuracy by regulariser (train is pinned at 1.000 for every bar). Axis starts at{" "}
        {AXIS_LO.toFixed(2)} to make the differences visible. Click a bar for detail.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {ROWS.map((r) => {
          const isSel = sel?.name === r.name;
          const w = frac(r.test) * 100;
          const baseW = frac(base) * 100;
          return (
            <div key={r.name} onClick={() => setSel(r)} style={{ cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 2 }}>
                <span style={{ color: isSel ? accent : "var(--ink)", fontWeight: isSel ? 600 : 400 }}>{r.name}</span>
                <span style={{ fontVariantNumeric: "tabular-nums", color: colorFor(r), fontWeight: 600 }}>
                  {r.test.toFixed(3)}
                </span>
              </div>
              <div style={{ position: "relative", height: 16, background: "var(--bg-offset)", borderRadius: 4 }}>
                {/* baseline marker */}
                <div aria-hidden style={{ position: "absolute", left: `${baseW}%`, top: -2, bottom: -2, width: 1, background: "var(--border-strong)" }} />
                <div
                  style={{
                    width: `${w}%`, height: "100%", background: colorFor(r),
                    opacity: isSel ? 1 : 0.82, borderRadius: 4, transition: "width 0.3s",
                    outline: isSel ? `2px solid ${accent}` : "none",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 11, color: "var(--faint)" }}>
        <span><span style={{ color: "var(--good)" }}>■</span> closes the gap</span>
        <span><span style={{ color: "var(--bad)" }}>■</span> barely moves</span>
        <span>│ baseline (0.753)</span>
      </div>

      <div style={{ marginTop: 14, padding: "10px 14px", background: "var(--bg-offset)", borderRadius: 8, fontSize: 13, lineHeight: 1.5, minHeight: 44 }}>
        {sel ? (
          <>
            <strong style={{ color: accent }}>{sel.name}</strong>
            <span style={{ color: "var(--muted)", marginLeft: 10 }}>
              test {sel.test.toFixed(3)} · gap {(TRAIN - sel.test).toFixed(3)} · {sel.note}
            </span>
          </>
        ) : (
          <span style={{ color: "var(--muted)" }}>
            The honest headline: dropout and augmentation close the 0.247 gap by a third; weight decay,
            listed first in every textbook, does almost nothing on <em>this</em> problem. Which
            regulariser wins is a property of the problem, not a universal ranking.
          </span>
        )}
      </div>
    </div>
  );
}
