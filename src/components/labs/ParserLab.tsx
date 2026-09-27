"use client";

import { useState } from "react";
import { Printout } from "@/components/capstone/newsreader";
import specimens from "@/data/routing/parsers.json";

// Two ways to cut a post into parts, on three real posts from the earlier period.
//
// "This capstone's parser" keeps the subject and the body (the router's view) and sets aside the
// header lines, quoted lines and anything after a '-- ' line. "scikit-learn's cleaning" is
// fetch_20newsgroups(remove=("headers", "footers", "quotes")), line for line: the script asserts
// that the lines marked kept here join to exactly what scikit-learn returns.
//
// The dashed bar marks the tail: the last block of a post with no '-- ' signature. It is the
// block scikit-learn's footer rule cuts, and this capstone's parser keeps it in the body.
//
// Data: src/data/routing/parsers.json, written by `python scripts/routing_cases.py parsers`.

type Line = { text: string; part: string; sk: boolean };
type Specimen = { post: number; forum: string; lines: Line[]; words: { all: number; ours: number; sklearn: number } };

const S = specimens as Specimen[];
const mono: React.CSSProperties = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" };

const COLOUR: Record<string, string> = {
  meta: "var(--nr-head)",
  subject: "var(--nr-ink)",
  body: "var(--nr-ink)",
  tail: "var(--nr-ink)",
  quotes: "var(--nr-quote)",
  sig: "var(--nr-sig)",
};

const VIEWS = [
  { key: "raw", label: "as posted" },
  { key: "ours", label: "this capstone's parser" },
  { key: "sk", label: "scikit-learn's cleaning" },
] as const;
type View = (typeof VIEWS)[number]["key"];

const TABS = ["the X Consortium question", "the hard-drive question", "the radio sale"];

const kept = (l: Line, v: View) =>
  v === "raw" ? true : v === "sk" ? l.sk : l.part === "subject" || l.part === "body" || l.part === "tail";

function Seg<T extends string>({ items, value, onChange }: { items: readonly { key: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div role="radiogroup" style={{ display: "inline-flex", flexWrap: "wrap", gap: 4, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10, padding: 3 }}>
      {items.map((it) => {
        const on = it.key === value;
        return (
          <button
            key={it.key}
            role="radio"
            aria-checked={on}
            onClick={() => onChange(it.key)}
            style={{
              fontSize: 12.5,
              padding: "5px 10px",
              borderRadius: 7,
              border: "none",
              cursor: "pointer",
              background: on ? "var(--c-post)" : "transparent",
              color: on ? "var(--surface)" : "var(--muted)",
              fontWeight: on ? 600 : 400,
            }}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

export default function ParserLab() {
  const [si, setSi] = useState(0);
  const [view, setView] = useState<View>("sk");
  const s = S[si];
  const n = view === "raw" ? s.words.all : view === "ours" ? s.words.ours : s.words.sklearn;
  const hasTail = s.lines.some((l) => l.part === "tail");

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 10 }}>
        <Seg items={TABS.map((t, i) => ({ key: String(i), label: t }))} value={String(si)} onChange={(v) => setSi(Number(v))} />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 12.5, color: "var(--faint)" }}>show it</span>
        <Seg items={VIEWS} value={view} onChange={setView} />
      </div>

      <Printout py={14}>
        <div style={{ ...mono, fontSize: 11.5, color: "var(--nr-faint)", marginBottom: 8 }}>
          earlier post {s.post.toLocaleString("en-US")} · filed in {s.forum}
        </div>
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <pre style={{ ...mono, fontSize: 11.5, lineHeight: 1.62, margin: 0, whiteSpace: "pre", tabSize: 4, width: "max-content", background: "transparent", padding: "2px 0" }}>
            {s.lines.map((l, i) => {
              const on = kept(l, view);
              const tail = l.part === "tail" && view !== "sk";
              return (
                <div
                  key={i}
                  style={{
                    minHeight: "1.62em",
                    paddingLeft: 8,
                    borderLeft: tail ? "2px dashed var(--nr-sig)" : "2px solid transparent",
                    color: COLOUR[l.part] ?? "var(--nr-ink)",
                    fontWeight: l.part === "subject" ? 700 : 400,
                    opacity: on ? 1 : 0.26,
                    // longhands only: the textDecoration shorthand beside textDecorationColor makes React warn on rerender
                    textDecorationLine: !on && view === "sk" && l.text.trim() ? "line-through" : "none",
                    textDecorationColor: "var(--nr-pen)",
                  }}
                >
                  {l.text || " "}
                </div>
              );
            })}
          </pre>
        </div>
      </Printout>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 18px", alignItems: "baseline", marginTop: 10 }}>
        <span style={{ fontSize: 13.5, color: "var(--ink)" }}>
          keeps <strong style={{ ...mono }}>{n}</strong> of {s.words.all} words
        </span>
        {view === "ours" && hasTail && (
          <span style={{ fontSize: 12.5, color: "var(--muted)" }}>
            <span style={{ display: "inline-block", width: 0, height: 12, borderLeft: "2px dashed var(--nr-sig)", marginRight: 6, verticalAlign: "-1px" }} />
            the tail: the last block of a post with no &lsquo;--&nbsp;&rsquo; line, kept in the body
          </span>
        )}
        {view === "sk" && (
          <span style={{ fontSize: 12.5, color: "var(--muted)" }}>struck through: what scikit-learn removes</span>
        )}
      </div>
    </div>
  );
}
