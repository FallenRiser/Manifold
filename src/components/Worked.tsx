"use client";

import { useState } from "react";
import { MathBlock } from "@/components/Math";

// A worked example, in the shape docs/math-pedagogy-plan.md §4.1 fixes.
//
// The failure mode of a textbook worked example is that it presents THE solution as if it were
// inevitable. A reader who can follow every step still cannot start the next problem, because the
// part nobody wrote down is why that first step. So the format forces two sections that a
// transcript does not have:
//
//   PLAN   which technique, why it, and what the alternative would have cost
//   CHECK  an independent way to believe the answer -- a limiting case, a dimension count, a
//          symmetry, a rough estimate. Never "substitute back", which only re-runs the algebra.
//
// The statement is always visible and the solution is behind a reveal, because the site's
// predict-first doctrine (PROJECT.md §4) applies to mathematics too: a reader who has tried for
// thirty seconds reads the solution completely differently.

export type WorkedStep = {
  /** the line of algebra, as a KaTeX display string */
  math?: string;
  /** what this step did, and why it was allowed */
  why: React.ReactNode;
};

const AMBER = "var(--c-fundamentals)";

export function Worked({
  n,
  title,
  verify: _verify,
  technique,
  given,
  read,
  plan,
  steps,
  answer,
  check,
  trap,
  accent = AMBER,
}: {
  n: number;
  title: string;
  /** the answer in sympy syntax. Never rendered: `scripts/math_check.py` parses this field out of
   *  the page and recomputes it independently, so a wrong worked example fails a check rather than
   *  teaching a wrong method to the one reader who cannot tell. */
  verify?: string;
  /** the named move this example teaches — shown with the solution, never before it */
  technique?: string;
  given: React.ReactNode;
  /** what the words are actually asking for, in one sentence */
  read?: React.ReactNode;
  plan: React.ReactNode;
  steps: WorkedStep[];
  answer: React.ReactNode;
  check: React.ReactNode;
  trap?: React.ReactNode;
  accent?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      id={`worked-${n}`}
      style={{
        background: `color-mix(in srgb, ${accent} 5%, var(--surface))`,
        border: `1px solid color-mix(in srgb, ${accent} 26%, var(--border))`,
        borderRadius: 14,
        padding: "14px 16px 16px",
        margin: "1.6rem 0",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 9, flexWrap: "wrap", marginBottom: 8 }}>
        <span
          className="font-display"
          style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", color: accent }}
        >
          Worked example {n}
        </span>
        <span style={{ fontSize: 14.5, color: "var(--ink)", fontWeight: 500 }}>{title}</span>
      </div>

      <div style={{ fontSize: 15, lineHeight: 1.7, color: "var(--ink)" }}>{given}</div>

      {!open && (
        <button onClick={() => setOpen(true)} style={{ ...btn, borderColor: accent, color: accent, marginTop: 12 }}>
          Try it first, then show the solution
        </button>
      )}

      {open && (
        <div style={{ marginTop: 14 }}>
          {read && <Part label="What it is asking" accent={accent}>{read}</Part>}

          <Part label="The plan" accent={accent}>{plan}</Part>

          <Part label="The steps" accent={accent}>
            <ol style={{ margin: 0, paddingLeft: "1.25em", display: "flex", flexDirection: "column", gap: 10 }}>
              {steps.map((s, i) => (
                <li key={i} style={{ lineHeight: 1.65 }}>
                  {s.math && <MathBlock>{s.math}</MathBlock>}
                  <div style={{ color: "var(--muted)", fontSize: 14.5 }}>{s.why}</div>
                </li>
              ))}
            </ol>
          </Part>

          <Part label="Answer" accent={accent}>
            <div style={{ color: "var(--ink)", fontWeight: 500 }}>{answer}</div>
          </Part>

          <Part label="Check it independently" accent={accent}>{check}</Part>

          {trap && <Part label="The trap this is built to catch" accent={accent}>{trap}</Part>}

          {technique && (
            <p style={{ fontSize: 13, color: "var(--faint)", margin: "12px 0 0" }}>
              The move: <em>{technique}</em>
            </p>
          )}

          <button onClick={() => setOpen(false)} style={{ ...btn, marginTop: 12 }}>
            Hide the solution
          </button>
        </div>
      )}
    </div>
  );
}

function Part({ label, accent, children }: { label: string; accent: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        className="font-display"
        style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: accent, marginBottom: 5 }}
      >
        {label}
      </div>
      <div style={{ fontSize: 14.5, lineHeight: 1.7, color: "var(--muted)" }}>{children}</div>
    </div>
  );
}

// --paper, never --bg: an undefined custom property is dropped silently and the colour falls back
// to whatever is inherited, which on a dark chip means invisible text (PROJECT.md §14.0).
const btn: React.CSSProperties = {
  fontSize: 12.5,
  padding: "5px 12px",
  borderRadius: 999,
  border: "1px solid var(--border)",
  background: "transparent",
  color: "var(--muted)",
  cursor: "pointer",
};
