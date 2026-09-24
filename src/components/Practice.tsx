"use client";

import { useState } from "react";
import { M } from "@/components/Math";

// The graded problem set of docs/math-pedagogy-plan.md §5.
//
// Three bands, named for what the reader has to DO rather than for how hard they are:
//
//   1 Apply     one idea, direct. Confirms the definition landed.
//   2 Combine   two ideas at once, or the same idea behind an unfamiliar wrapper.
//   3 Outsmart  the direct computation exists and is too slow. The intended route is a
//               structural observation that collapses it.
//
// Band 3 is competitive-exam style and the page never says so: naming the PROPERTY is both truer
// and more useful to a reader who has never sat one of those exams. Two rules follow from that,
// and they are the difference between teaching the manner and merely posing hard problems:
//
//   * hints are progressive -- hint 1 names the region ("you do not need to expand this"),
//     hint 2 names the technique. A reader who takes hint 1 and finishes has learned more than
//     one who reads the solution.
//   * the technique tag appears WITH the solution, never before it, or the problem is spoiled.

export type Band = 1 | 2 | 3;

export type Problem = {
  /** stable id — `scripts/math_check.py` recomputes the answer for this id independently */
  id: string;
  band: Band;
  statement: React.ReactNode;
  /** progressive: [region, technique] */
  hints?: React.ReactNode[];
  /** the answer alone, as KaTeX, so a reader can check without reading the whole solution */
  answer: string;
  /** the same answer in sympy syntax — `scripts/math_check.py` parses this field out of the
   *  content module and compares it against its own independent computation. Never rendered. */
  verify: string;
  solution: React.ReactNode;
  /** the named move, revealed with the solution */
  technique?: string;
};

export const BANDS: Record<Band, { name: string; blurb: string }> = {
  1: { name: "Apply", blurb: "One idea, used directly. If these are slow, re-read the page rather than pushing on." },
  2: { name: "Combine", blurb: "Two ideas at once, or the same idea wearing something unfamiliar." },
  3: {
    name: "Outsmart",
    blurb:
      "The brute-force route exists in every one of these, and in every one of them it is a trap. Each is built so that noticing one piece of structure turns ten minutes into thirty seconds — finding that structure is the skill being drilled, so take the first hint long before you take the second.",
  },
};

const AMBER = "var(--c-fundamentals)";

export function Practice({
  problems,
  accent = AMBER,
  title = "Practice",
  intro,
}: {
  problems: Problem[];
  accent?: string;
  title?: string;
  intro?: React.ReactNode;
}) {
  const [band, setBand] = useState<Band | "all">("all");
  const shown = problems.filter((p) => band === "all" || p.band === band);
  const count = (b: Band) => problems.filter((p) => p.band === b).length;

  return (
    <div style={{ margin: "2rem 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
        <h2 style={{ margin: 0 }}>{title}</h2>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>{problems.length} problems · full solutions</span>
      </div>

      {intro && <p style={{ color: "var(--muted)" }}>{intro}</p>}

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "12px 0 6px" }}>
        <Chip on={band === "all"} accent={accent} onClick={() => setBand("all")}>
          all {problems.length}
        </Chip>
        {([1, 2, 3] as Band[]).map((b) => (
          <Chip key={b} on={band === b} accent={accent} onClick={() => setBand(b)}>
            {BANDS[b].name} {count(b)}
          </Chip>
        ))}
      </div>

      {band !== "all" && (
        <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.6, margin: "6px 0 0" }}>
          {BANDS[band].blurb}
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
        {shown.map((p, i) => (
          <One key={p.id} p={p} n={i + 1} accent={accent} showBand={band === "all"} />
        ))}
      </div>
    </div>
  );
}

function One({ p, n, accent, showBand }: { p: Problem; n: number; accent: string; showBand: boolean }) {
  const [hints, setHints] = useState(0);
  const [open, setOpen] = useState(false);
  const total = p.hints?.length ?? 0;

  return (
    <div
      id={p.id}
      style={{
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "13px 15px 14px",
        background: "var(--surface)",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 9, flexWrap: "wrap", marginBottom: 6 }}>
        <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, color: "var(--faint)" }}>{n}</span>
        {showBand && (
          <span
            style={{
              fontSize: 10.5,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              padding: "2px 7px",
              borderRadius: 999,
              color: accent,
              border: `1px solid color-mix(in srgb, ${accent} 34%, var(--border))`,
              background: `color-mix(in srgb, ${accent} 7%, transparent)`,
            }}
          >
            {BANDS[p.band].name}
          </span>
        )}
      </div>

      <div style={{ fontSize: 15, lineHeight: 1.7, color: "var(--ink)" }}>{p.statement}</div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 11 }}>
        {hints < total && (
          <button onClick={() => setHints(hints + 1)} style={{ ...btn, borderColor: accent, color: accent }}>
            {hints === 0 ? "Hint" : `Hint ${hints + 1} of ${total}`}
          </button>
        )}
        <button onClick={() => setOpen(!open)} style={btn}>
          {open ? "Hide the solution" : "Full solution"}
        </button>
      </div>

      {hints > 0 && (
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 7 }}>
          {p.hints!.slice(0, hints).map((h, i) => (
            <div
              key={i}
              style={{
                fontSize: 14, lineHeight: 1.6, color: "var(--muted)",
                borderLeft: `2px solid color-mix(in srgb, ${accent} 45%, var(--border))`,
                paddingLeft: 11,
              }}
            >
              {h}
            </div>
          ))}
        </div>
      )}

      {open && (
        <div
          style={{
            marginTop: 12,
            paddingTop: 11,
            borderTop: "1px solid var(--border)",
            fontSize: 14.5,
            lineHeight: 1.7,
            color: "var(--muted)",
          }}
        >
          <p style={{ margin: "0 0 10px" }}>
            <strong style={{ color: "var(--ink)" }}>Answer:</strong> <M>{p.answer}</M>
          </p>
          {p.solution}
          {p.technique && (
            <p style={{ fontSize: 13, color: "var(--faint)", marginBottom: 0 }}>
              The move: <em>{p.technique}</em>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Chip({ on, accent, onClick, children }: { on: boolean; accent: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...btn,
        // --paper, not --bg: an undefined custom property is dropped silently, so `color` would
        // inherit --ink and print black text on a black chip (PROJECT.md §14.0).
        background: on ? "var(--ink)" : "transparent",
        color: on ? "var(--paper)" : "var(--muted)",
        borderColor: on ? "var(--ink)" : "var(--border)",
      }}
    >
      {children}
    </button>
  );
}

const btn: React.CSSProperties = {
  fontSize: 12.5,
  padding: "5px 12px",
  borderRadius: 999,
  border: "1px solid var(--border)",
  background: "transparent",
  color: "var(--muted)",
  cursor: "pointer",
};
