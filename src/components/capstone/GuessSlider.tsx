"use client";

import { useState } from "react";

// Predict-the-number (PROJECT.md §10.4): the reader commits to a guess on a
// slider BEFORE the real result is revealed. The gap between guess and truth
// is what makes the number memorable.

export function GuessSlider({
  prompt,
  min,
  max,
  step = 0.01,
  start,
  actual,
  decimals = 2,
  signed = false,
  reveal,
  accent = "var(--c-regression)",
}: {
  prompt: React.ReactNode;
  min: number;
  max: number;
  step?: number;
  /** initial slider position; defaults to the midpoint */
  start?: number;
  actual: number;
  /** decimal places for displayed values (serialisable — no function props across the RSC boundary) */
  decimals?: number;
  /** prefix positive values with "+" (for deltas) */
  signed?: boolean;
  /** shown after locking in, alongside the actual number */
  reveal: React.ReactNode;
  accent?: string;
}) {
  const [value, setValue] = useState(start ?? (min + max) / 2);
  const [locked, setLocked] = useState(false);
  const format = (v: number) => `${signed && v >= 0 ? "+" : ""}${v.toFixed(decimals)}`;

  const pct = (v: number) => ((v - min) / (max - min)) * 100;
  const delta = Math.abs(value - actual);
  const closeness =
    delta <= (max - min) * 0.03 ? "Dead on." : delta <= (max - min) * 0.1 ? "Close." : "";

  return (
    <div
      style={{
        background: "var(--surface)",
        border: `1px dashed color-mix(in srgb, ${accent} 45%, var(--border))`,
        borderRadius: 14,
        padding: "14px 18px 16px",
        margin: "1.8rem 0",
      }}
    >
      <div className="font-display" style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: accent, marginBottom: 6 }}>
        Guess before you look
      </div>
      <div style={{ fontSize: 14.5, color: "var(--ink)", lineHeight: 1.55, marginBottom: 14 }}>{prompt}</div>

      <div style={{ position: "relative", padding: "0 2px" }}>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={locked}
          onChange={(e) => setValue(parseFloat(e.target.value))}
          style={{ width: "100%", accentColor: accent, cursor: locked ? "default" : "ew-resize", display: "block" }}
          aria-label="your guess"
        />
        {locked && (
          <div
            style={{
              position: "absolute",
              left: `${pct(actual)}%`,
              top: -6,
              transform: "translateX(-50%)",
              width: 2,
              height: 30,
              background: "var(--good)",
              borderRadius: 1,
            }}
          />
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, color: "var(--muted)" }}>
          your guess:{" "}
          <strong style={{ color: "var(--ink)", fontFamily: "var(--font-geist-mono, monospace)" }}>{format(value)}</strong>
        </span>
        {!locked ? (
          <button
            onClick={() => setLocked(true)}
            style={{
              background: "var(--cta)",
              color: "var(--cta-text)",
              border: "none",
              fontSize: 12.5,
              fontWeight: 500,
              padding: "6px 14px",
              borderRadius: 9,
              cursor: "pointer",
            }}
          >
            Lock it in
          </button>
        ) : (
          <span style={{ fontSize: 13, color: "var(--muted)" }}>
            actual:{" "}
            <strong style={{ color: "var(--good)", fontFamily: "var(--font-geist-mono, monospace)" }}>{format(actual)}</strong>
            {closeness && <span style={{ marginLeft: 8, color: "var(--good)" }}>{closeness}</span>}
          </span>
        )}
      </div>

      {locked && (
        <div style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--muted)", marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
          {reveal}
        </div>
      )}
    </div>
  );
}
