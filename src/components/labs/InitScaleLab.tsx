"use client";

import { useState } from "react";

// Measured pre-activation standard deviation per layer, from
// scripts/init_norm_cases.py section 4: an 8-layer, width-32 ReLU network at
// three initialisation scales. The signal either vanishes, stays stable, or
// explodes — decided entirely at initialisation, before any training.
//
// The values span thirteen orders of magnitude, so the bars are drawn on a
// log scale. The numbers on each bar are the real measured std.

type Scale = "small" | "he" | "large";

const DATA: Record<Scale, number[]> = {
  // too small (0.001): collapses to zero by layer 2
  small: [0.001, 0.00001, 0.0000001, 1e-9, 1e-11, 1e-13, 1e-15, 1e-17],
  // He (correct for ReLU): holds within a factor of two of one
  he: [1.0488, 1.0781, 1.0128, 0.9733, 0.8933, 0.6454, 0.7319, 0.6558],
  // too large (5.0): explodes nine orders of magnitude
  large: [5.244, 107.81, 2025.6, 38931, 714635, 1.0326e7, 2.342e8, 4.197e9],
};

const META: Record<Scale, { label: string; scaleTxt: string; verdict: string; tone: string }> = {
  small: { label: "Too small · 0.001", scaleTxt: "std = 0.001", verdict: "vanished", tone: "var(--bad)" },
  he: { label: "He · √(2 / fan-in)", scaleTxt: "the correct scale for ReLU", verdict: "stable", tone: "var(--good)" },
  large: { label: "Too large · 5.0", scaleTxt: "std = 5.0", verdict: "exploded", tone: "var(--bad)" },
};

const accent = "var(--c-neural)";

// Map log10(std) from [-18, 10] to a bar height in [1.5%, 100%]. A healthy
// std of 1 (log 0) lands near the middle of the range.
const LO = -18;
const HI = 10;
function barHeight(std: number): number {
  const l = Math.log10(Math.max(std, 1e-30));
  const t = (l - LO) / (HI - LO);
  return Math.max(1.5, Math.min(100, t * 100));
}

// Healthy band: std within [0.3, 3] — the shaded target zone.
const bandLo = barHeight(0.3);
const bandHi = barHeight(3);

function fmt(std: number): string {
  if (std >= 1000 || std < 0.001) return std.toExponential(1).replace("e+", "e").replace("e-0", "e-").replace("e", "e");
  if (std >= 1) return std.toFixed(2);
  return std.toPrecision(2);
}

export function InitScaleLab() {
  const [scale, setScale] = useState<Scale>("he");
  const vals = DATA[scale];
  const meta = META[scale];

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {(["small", "he", "large"] as Scale[]).map((s) => (
          <button
            key={s}
            onClick={() => setScale(s)}
            style={{
              padding: "5px 13px", borderRadius: 6, fontSize: 12.5, fontWeight: 500,
              border: `1px solid ${scale === s ? accent : "var(--border)"}`,
              background: scale === s ? accent : "transparent",
              color: scale === s ? "#fff" : "var(--muted)",
              cursor: "pointer",
            }}
          >
            {META[s].label}
          </button>
        ))}
      </div>

      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "flex-end",
          gap: 6,
          height: 240,
          padding: "0 4px",
          borderBottom: "2px solid var(--border-strong)",
          borderLeft: "1px solid var(--border)",
        }}
      >
        {/* healthy band */}
        <div
          aria-hidden
          style={{
            position: "absolute", left: 0, right: 0,
            bottom: `${bandLo}%`, height: `${bandHi - bandLo}%`,
            background: "var(--good)", opacity: 0.1, pointerEvents: "none",
          }}
        />
        <div
          aria-hidden
          style={{
            position: "absolute", right: 6, bottom: `${bandHi}%`,
            fontSize: 10.5, color: "var(--good)", opacity: 0.85, transform: "translateY(-2px)",
          }}
        >
          healthy band (std ≈ 1)
        </div>

        {vals.map((std, i) => {
          const h = barHeight(std);
          const clipped = std > 1e9;
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
              <div style={{ fontSize: 10, color: "var(--faint)", fontVariantNumeric: "tabular-nums", marginBottom: 2, whiteSpace: "nowrap" }}>
                {clipped ? "↑ " : ""}{fmt(std)}
              </div>
              <div
                style={{
                  width: "78%",
                  height: `${h}%`,
                  background: meta.tone,
                  opacity: scale === "he" ? 0.9 : 0.8,
                  borderRadius: "3px 3px 0 0",
                  transition: "height 0.3s, background 0.3s",
                }}
              />
              <div style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 4 }}>L{i + 1}</div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 14, padding: "10px 14px", background: "var(--bg-offset)", borderRadius: 8, fontSize: 13, lineHeight: 1.5 }}>
        <strong style={{ color: accent }}>Initial weight {meta.scaleTxt}</strong>
        <span style={{ color: "var(--muted)", marginLeft: 10 }}>
          layer 1 std {fmt(vals[0])} → layer 8 std {fmt(vals[7])} ·{" "}
        </span>
        <span style={{ color: meta.tone, fontWeight: 600 }}>{meta.verdict}</span>
        {scale === "he" && (
          <span style={{ color: "var(--muted)" }}> — this is what &ldquo;preserving variance&rdquo; looks like</span>
        )}
        {scale === "small" && (
          <span style={{ color: "var(--muted)" }}> — no gradient can flow through a zero activation</span>
        )}
        {scale === "large" && (
          <span style={{ color: "var(--muted)" }}> — every activation is saturated or overflowing</span>
        )}
      </div>
    </div>
  );
}
