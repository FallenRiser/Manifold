"use client";

import { useEffect, useRef, useState } from "react";

// Inline interactive glossary term: dotted underline, tap/click to reveal a
// small definition card in place. Definitions live where they're used (no
// central glossary to drift). Use for jargon a page leans on but doesn't own —
// e.g. SHAP's "base value", "log-odds", "inverse Mills ratio".

export function Term({
  children,
  def,
  accent = "var(--c-fundamentals)",
}: {
  children: React.ReactNode; // the term as it appears in the sentence
  def: React.ReactNode; // one- or two-sentence plain-language definition
  accent?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <span ref={ref} style={{ position: "relative", display: "inline" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          margin: 0,
          font: "inherit",
          color: "var(--ink)",
          cursor: "help",
          borderBottom: `1.5px dotted color-mix(in srgb, ${accent} 70%, var(--border))`,
        }}
      >
        {children}
      </button>
      {open && (
        <span
          role="note"
          style={{
            position: "absolute",
            left: "50%",
            bottom: "calc(100% + 8px)",
            transform: "translateX(-50%)",
            width: "min(300px, 78vw)",
            zIndex: 40,
            display: "block",
            background: "var(--panel)",
            border: `1px solid color-mix(in srgb, ${accent} 35%, var(--border))`,
            borderRadius: 10,
            padding: "10px 12px",
            fontSize: 13,
            lineHeight: 1.55,
            color: "var(--muted)",
            boxShadow: "0 8px 28px rgba(0,0,0,0.22)",
            textAlign: "left",
          }}
        >
          <span
            className="font-display"
            style={{ display: "block", fontSize: 10, fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", color: accent, marginBottom: 3 }}
          >
            {children}
          </span>
          {def}
        </span>
      )}
    </span>
  );
}
