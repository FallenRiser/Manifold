"use client";

import { useState } from "react";

// A capstone decision point (PROJECT.md §10.4): the reader chooses what they'd
// do next BEFORE seeing what we did. Every option gets honest feedback — some
// choices are defensible, one is the senior move.

export type DPOption = {
  label: string;
  verdict: "best" | "close" | "miss";
  response: React.ReactNode;
};

const VERDICT = {
  best: { tag: "The senior move", color: "var(--good)" },
  close: { tag: "Defensible — but", color: "var(--warn)" },
  miss: { tag: "Tempting — and wrong here", color: "var(--bad)" },
} as const;

export function DecisionPoint({
  question,
  options,
  accent = "var(--c-regression)",
}: {
  question: React.ReactNode;
  options: DPOption[];
  accent?: string;
}) {
  const [picked, setPicked] = useState<number | null>(null);

  return (
    <div
      style={{
        background: `color-mix(in srgb, ${accent} 6%, var(--surface))`,
        border: `1px solid color-mix(in srgb, ${accent} 24%, var(--border))`,
        borderRadius: 14,
        padding: "16px 18px",
        margin: "1.8rem 0",
      }}
    >
      <div className="font-display" style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: accent, marginBottom: 6 }}>
        Your call
      </div>
      <div style={{ fontSize: 15, fontWeight: 500, color: "var(--ink)", lineHeight: 1.55, marginBottom: 12 }}>{question}</div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {options.map((o, i) => {
          const isPicked = picked === i;
          const revealed = picked !== null;
          const v = VERDICT[o.verdict];
          return (
            <div key={i}>
              <button
                onClick={() => setPicked(i)}
                disabled={revealed}
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 10,
                  width: "100%",
                  textAlign: "left",
                  fontSize: 14,
                  lineHeight: 1.5,
                  padding: "9px 12px",
                  borderRadius: 10,
                  border: `1px solid ${isPicked ? v.color : revealed && o.verdict === "best" ? "var(--good)" : "var(--border-strong)"}`,
                  background: isPicked
                    ? `color-mix(in srgb, ${v.color} 8%, var(--surface))`
                    : "var(--surface)",
                  color: "var(--ink)",
                  cursor: revealed ? "default" : "pointer",
                  opacity: revealed && !isPicked && o.verdict !== "best" ? 0.6 : 1,
                  transition: "border-color 0.15s ease, opacity 0.2s ease",
                }}
              >
                <span
                  className="font-display"
                  style={{ fontSize: 12, fontWeight: 600, color: revealed && (isPicked || o.verdict === "best") ? (isPicked ? v.color : "var(--good)") : "var(--muted)", flexShrink: 0 }}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                <span style={{ flex: 1 }}>{o.label}</span>
                {revealed && (isPicked || o.verdict === "best") && (
                  <span style={{ fontSize: 11.5, fontWeight: 500, color: isPicked ? v.color : "var(--good)", whiteSpace: "nowrap", flexShrink: 0 }}>
                    {isPicked ? v.tag : VERDICT.best.tag}
                  </span>
                )}
              </button>
              {picked === i && (
                <div style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--muted)", padding: "8px 12px 2px 34px" }}>
                  {o.response}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {picked !== null && options[picked].verdict !== "best" && (
        <div style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--muted)", marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
          <span style={{ color: "var(--good)", fontWeight: 500 }}>
            {String.fromCharCode(65 + options.findIndex((o) => o.verdict === "best"))} was the senior move:
          </span>{" "}
          {options.find((o) => o.verdict === "best")!.response}
        </div>
      )}
    </div>
  );
}
