"use client";

import { useState } from "react";

// Predict-before-you-drag (PROJECT.md §4): a one-line prediction the reader
// commits to BEFORE the lab below reveals the truth. Deliberately gives no
// verdict — the interaction itself is the reveal.

export function PredictPrompt({
  prompt,
  options,
  accent = "var(--c-regression)",
  nudge = "Locked in. Now try it below and see if you were right.",
}: {
  prompt: React.ReactNode;
  options: string[];
  accent?: string;
  nudge?: React.ReactNode;
}) {
  const [picked, setPicked] = useState<number | null>(null);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        background: `color-mix(in srgb, ${accent} 5%, var(--surface))`,
        border: `1px dashed color-mix(in srgb, ${accent} 34%, var(--border))`,
        borderRadius: 12,
        padding: "12px 14px",
        margin: "1.4rem 0 0.9rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span className="font-display" style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", color: accent, flexShrink: 0 }}>
          Predict first
        </span>
        <span style={{ fontSize: 13.5, color: "var(--ink)", lineHeight: 1.5 }}>{prompt}</span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {options.map((opt, i) => {
          const isPick = picked === i;
          return (
            <button
              key={i}
              onClick={() => setPicked(i)}
              disabled={picked !== null}
              style={{
                fontSize: 13,
                padding: "5px 11px",
                borderRadius: 999,
                border: `1px solid ${isPick ? accent : "var(--border-strong)"}`,
                background: isPick ? `color-mix(in srgb, ${accent} 10%, var(--surface))` : "var(--surface)",
                color: isPick ? "var(--ink)" : "var(--muted)",
                fontWeight: isPick ? 500 : 400,
                cursor: picked !== null ? "default" : "pointer",
                opacity: picked !== null && !isPick ? 0.5 : 1,
                transition: "all 0.15s ease",
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <div style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.5 }}>{nudge}</div>
      )}
    </div>
  );
}
