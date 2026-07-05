"use client";

import { useState } from "react";

// Shared lab wrapper (PROJECT.md §10.3): a "Try this:" prompt above the lab and
// an insight caption that appears only AFTER the reader has interacted — labs
// must never be pedagogically silent, but the insight must not spoil the
// interaction it rewards. Detection is generic (first pointerdown inside the
// frame), so any existing lab can be wrapped without modification.

export function LabFrame({
  tryThis,
  insight,
  accent = "var(--c-regression)",
  children,
}: {
  tryThis: React.ReactNode;
  insight: React.ReactNode;
  accent?: string;
  children: React.ReactNode;
}) {
  const [interacted, setInteracted] = useState(false);

  return (
    <div style={{ margin: "1.4rem 0" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
        <span
          className="font-display"
          style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", color: accent, flexShrink: 0 }}
        >
          Try this
        </span>
        <span style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.5 }}>{tryThis}</span>
      </div>

      <div onPointerDownCapture={() => setInteracted(true)}>{children}</div>

      <div
        aria-hidden={!interacted}
        style={{
          maxHeight: interacted ? 200 : 0,
          opacity: interacted ? 1 : 0,
          overflow: "hidden",
          transition: "max-height 0.5s ease, opacity 0.6s ease 0.15s",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 9,
            alignItems: "flex-start",
            marginTop: 10,
            padding: "10px 13px",
            background: `color-mix(in srgb, ${accent} 6%, var(--surface))`,
            border: `1px solid color-mix(in srgb, ${accent} 22%, var(--border))`,
            borderRadius: 10,
          }}
        >
          <span style={{ color: accent, fontSize: 13, lineHeight: 1.55, flexShrink: 0 }}>◆</span>
          <span style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.6 }}>{insight}</span>
        </div>
      </div>
    </div>
  );
}
