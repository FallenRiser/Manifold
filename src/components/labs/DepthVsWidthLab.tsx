"use client";

import { useState } from "react";

// Measured depth × width sweep from scripts/architecture_cases.py section 1:
// two moons (800 points, noise 0.25, 25% test), ReLU, Adam lr=0.001, 500
// iterations, 5 seeds averaged. The grid answers the question everyone asks
// first: how many layers, how many neurons?

type Cell = { depth: number; width: number; params: number; train: number; test: number };

const ROWS: Cell[] = [
  { depth: 1, width: 4, params: 17, train: 0.86, test: 0.852 },
  { depth: 1, width: 8, params: 33, train: 0.8783, test: 0.866 },
  { depth: 1, width: 16, params: 65, train: 0.893, test: 0.885 },
  { depth: 1, width: 32, params: 129, train: 0.9213, test: 0.918 },
  { depth: 1, width: 64, params: 257, train: 0.9357, test: 0.938 },
  { depth: 2, width: 4, params: 37, train: 0.8827, test: 0.869 },
  { depth: 2, width: 8, params: 105, train: 0.9187, test: 0.911 },
  { depth: 2, width: 16, params: 337, train: 0.9487, test: 0.951 },
  { depth: 2, width: 32, params: 1185, train: 0.9523, test: 0.953 },
  { depth: 2, width: 64, params: 4417, train: 0.952, test: 0.947 },
  { depth: 3, width: 4, params: 57, train: 0.876, test: 0.857 },
  { depth: 3, width: 8, params: 177, train: 0.925, test: 0.906 },
  { depth: 3, width: 16, params: 609, train: 0.9523, test: 0.947 },
  { depth: 3, width: 32, params: 2241, train: 0.9547, test: 0.944 },
  { depth: 3, width: 64, params: 8577, train: 0.9557, test: 0.944 },
  { depth: 4, width: 4, params: 77, train: 0.9183, test: 0.912 },
  { depth: 4, width: 8, params: 249, train: 0.9257, test: 0.909 },
  { depth: 4, width: 16, params: 881, train: 0.954, test: 0.944 },
  { depth: 4, width: 32, params: 3297, train: 0.956, test: 0.945 },
  { depth: 4, width: 64, params: 12737, train: 0.9593, test: 0.943 },
  { depth: 6, width: 4, params: 117, train: 0.8343, test: 0.813 },
  { depth: 6, width: 8, params: 393, train: 0.9397, test: 0.925 },
  { depth: 6, width: 16, params: 1425, train: 0.9573, test: 0.942 },
  { depth: 6, width: 32, params: 5409, train: 0.9567, test: 0.944 },
  { depth: 6, width: 64, params: 21057, train: 0.9583, test: 0.942 },
  { depth: 8, width: 4, params: 157, train: 0.67, test: 0.654 },
  { depth: 8, width: 8, params: 537, train: 0.9547, test: 0.944 },
  { depth: 8, width: 16, params: 1969, train: 0.9583, test: 0.943 },
  { depth: 8, width: 32, params: 7521, train: 0.9597, test: 0.936 },
  { depth: 8, width: 64, params: 29377, train: 0.966, test: 0.932 },
];

const DEPTHS = [1, 2, 3, 4, 6, 8];
const WIDTHS = [4, 8, 16, 32, 64];
const accent = "var(--c-neural)";

const best = Math.max(...ROWS.map((r) => r.test));
const worst = Math.min(...ROWS.map((r) => r.test));

function cellColor(test: number): string {
  const t = (test - worst) / (best - worst);
  if (t > 0.9) return "var(--good)";
  if (t > 0.6) return accent;
  if (t > 0.3) return "var(--warn)";
  return "var(--bad)";
}

export function DepthVsWidthLab() {
  const [sel, setSel] = useState<Cell | null>(null);
  const [metric, setMetric] = useState<"test" | "train" | "gap">("test");

  const getValue = (c: Cell) => {
    if (metric === "test") return c.test;
    if (metric === "train") return c.train;
    return c.train - c.test;
  };

  const fmt = (v: number) => metric === "gap" ? (v >= 0 ? "+" : "") + v.toFixed(3) : v.toFixed(3);

  const th: React.CSSProperties = {
    padding: "5px 8px", textAlign: "center", color: "var(--muted)", fontWeight: 500,
    fontSize: 12, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap",
  };
  const td: React.CSSProperties = {
    padding: "5px 8px", textAlign: "center", fontSize: 12.5,
    fontVariantNumeric: "tabular-nums", cursor: "pointer",
    borderBottom: "1px solid var(--border)", transition: "background 0.15s",
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        {(["test", "train", "gap"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMetric(m)}
            style={{
              padding: "4px 12px", borderRadius: 6, fontSize: 12, fontWeight: 500,
              border: `1px solid ${metric === m ? accent : "var(--border)"}`,
              background: metric === m ? accent : "transparent",
              color: metric === m ? "#fff" : "var(--muted)",
              cursor: "pointer",
            }}
          >
            {m === "gap" ? "train−test gap" : `${m} accuracy`}
          </button>
        ))}
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", minWidth: 400, width: "100%" }}>
          <thead>
            <tr>
              <th style={{ ...th, textAlign: "left" }}>depth \ width</th>
              {WIDTHS.map((w) => <th key={w} style={th}>{w}</th>)}
            </tr>
          </thead>
          <tbody>
            {DEPTHS.map((d) => (
              <tr key={d}>
                <td style={{ ...td, textAlign: "left", fontWeight: 600, color: "var(--ink)", cursor: "default" }}>{d}</td>
                {WIDTHS.map((w) => {
                  const cell = ROWS.find((r) => r.depth === d && r.width === w)!;
                  const v = getValue(cell);
                  const isSel = sel?.depth === d && sel?.width === w;
                  const isBest = cell.test === best;
                  return (
                    <td
                      key={w}
                      onClick={() => setSel(cell)}
                      style={{
                        ...td,
                        color: metric === "gap" ? (v > 0.02 ? "var(--bad)" : "var(--ink)") : cellColor(cell.test),
                        fontWeight: isBest ? 700 : 400,
                        background: isSel ? "var(--bg-offset)" : "transparent",
                        outline: isSel ? `2px solid ${accent}` : "none",
                        borderRadius: isSel ? 4 : 0,
                      }}
                    >
                      {fmt(v)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sel && (
        <div style={{ marginTop: 14, padding: "10px 14px", background: "var(--bg-offset)", borderRadius: 8, fontSize: 13 }}>
          <strong style={{ color: accent }}>{sel.depth} layers × {sel.width} wide</strong>
          <span style={{ color: "var(--muted)", marginLeft: 12 }}>
            {sel.params.toLocaleString()} parameters · train {sel.train.toFixed(3)} · test {sel.test.toFixed(3)} · gap {(sel.train - sel.test).toFixed(3)}
          </span>
          {sel.test === best && <span style={{ marginLeft: 8, color: "var(--good)", fontWeight: 600 }}>← best test</span>}
          {sel.test < 0.7 && <span style={{ marginLeft: 8, color: "var(--bad)", fontWeight: 600 }}>collapsed</span>}
        </div>
      )}
    </div>
  );
}
