"use client";

import { useState } from "react";
import hv from "@/data/routing/harness.json";

// Six ways to test the router on the earlier posts, each set against what the later posts actually
// scored (the band). Every estimate is the pooled accuracy over its validation posts, with a 95%
// bootstrap interval; the small ticks are the individual folds. Score all posts, as tutorials do,
// or only the new threads, the router's job. On new threads, the thread-grouped estimate can also
// be weighted to the later posts' mix of senders the router has met.
//
// Data: src/data/routing/harness.json, written by `python scripts/routing_cases.py the_split`.

type Scheme = {
  name: string; all: number; new: number; lo: number; hi: number; folds: number[];
  all_lo: number; all_hi: number; folds_all: number[]; known: number; n: number;
};
const H = hv as {
  future: { new: number; lo: number; hi: number; all: number; all_lo: number; all_hi: number; known: number };
  schemes: Scheme[]; weighted: number;
};

const POST = "var(--c-post)";
const mono: React.CSSProperties = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" };
const LO = 0.78, HI = 0.9;
const x = (a: number) => Math.round(1000 * Math.min(1, Math.max(0, (a - LO) / (HI - LO)))) / 10;
const MODES = [
  { key: "all", label: "score all posts" },
  { key: "new", label: "score only new threads" },
] as const;
type Mode = (typeof MODES)[number]["key"];

type Row = { name: string; est: number; lo?: number; hi?: number; folds: number[]; known?: number; note?: string };

export default function SplitHarnessLab() {
  const [mode, setMode] = useState<Mode>("all");
  const f = mode === "new" ? { v: H.future.new, lo: H.future.lo, hi: H.future.hi } : { v: H.future.all, lo: H.future.all_lo, hi: H.future.all_hi };
  const rows: Row[] = H.schemes.map((s) => mode === "new"
    ? { name: s.name, est: s.new, lo: s.lo, hi: s.hi, folds: s.folds, known: s.known }
    : { name: s.name, est: s.all, lo: s.all_lo, hi: s.all_hi, folds: s.folds_all });
  if (mode === "new") {
    rows.push({ name: "grouped by thread, weighted to the later mix", est: H.weighted, folds: [], known: H.future.known, note: "weighted" });
  }

  return (
    <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 14, padding: "12px 14px 10px" }}>
      <div role="radiogroup" aria-label="what to score" style={{ display: "inline-flex", flexWrap: "wrap", gap: 4, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 3, marginBottom: 12 }}>
        {MODES.map((m) => {
          const on = m.key === mode;
          return (
            <button key={m.key} role="radio" aria-checked={on} onClick={() => setMode(m.key)}
              style={{ fontSize: 12.5, padding: "5px 10px", borderRadius: 7, border: "none", cursor: "pointer", background: on ? POST : "transparent", color: on ? "var(--surface)" : "var(--muted)", fontWeight: on ? 600 : 400 }}>
              {m.label}
            </button>
          );
        })}
      </div>

      <div style={{ display: "grid", gap: 9 }}>
        {rows.map((r) => {
          const gap = 100 * (r.est - f.v);
          return (
            <div key={r.name}>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "0 10px", fontSize: 12.5 }}>
                <span style={{ color: "var(--ink)" }}>{r.name}</span>
                <span style={{ ...mono, fontSize: 11.5, color: "var(--muted)" }}>
                  {r.est.toFixed(3)} · <strong style={{ color: Math.abs(gap) < 1 ? "var(--good)" : "var(--ink)" }}>{gap >= 0 ? "+" : "−"}{Math.abs(gap).toFixed(2)}</strong> points
                  {r.known !== undefined && <span style={{ color: "var(--faint)" }}> · {(100 * r.known).toFixed(1)}% met</span>}
                </span>
              </div>
              <div style={{ position: "relative", height: 16, marginTop: 3, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 3 }}>
                <span aria-hidden style={{ position: "absolute", top: 0, bottom: 0, left: `${x(f.lo)}%`, width: `${x(f.hi) - x(f.lo)}%`, background: "color-mix(in srgb, var(--good) 18%, transparent)" }} />
                <span aria-hidden style={{ position: "absolute", top: 0, bottom: 0, left: `${x(f.v)}%`, borderLeft: "1.5px solid var(--good)" }} />
                {r.lo !== undefined && r.hi !== undefined && (
                  <span style={{ position: "absolute", top: 7, height: 2, left: `${x(r.lo)}%`, width: `${Math.max(0.4, x(r.hi) - x(r.lo))}%`, background: POST, opacity: 0.6 }} />
                )}
                {r.folds.map((v, i) => (
                  <span key={i} aria-hidden style={{ position: "absolute", top: 3, height: 10, left: `${x(v)}%`, borderLeft: "1px solid var(--muted)", opacity: 0.7 }} />
                ))}
                <span style={{ position: "absolute", top: 3, width: 10, height: 10, marginLeft: -5, left: `${x(r.est)}%`, borderRadius: 999, background: r.note ? "var(--surface)" : POST, border: `2px solid ${POST}` }} />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", ...mono, fontSize: 10.5, color: "var(--faint)", marginTop: 4 }}>
        <span>{LO.toFixed(2)}</span><span>accuracy</span><span>{HI.toFixed(2)}</span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", fontSize: 11.5, color: "var(--muted)", marginTop: 8 }}>
        <span><span style={{ display: "inline-block", width: 14, height: 10, background: "color-mix(in srgb, var(--good) 18%, transparent)", borderLeft: "1.5px solid var(--good)", verticalAlign: "-1px", marginRight: 5 }} />the later posts: {f.v.toFixed(3)} and its 95% interval</span>
        <span><span style={{ display: "inline-block", width: 9, height: 9, borderRadius: 999, background: POST, verticalAlign: "-1px", marginRight: 5 }} />the test&rsquo;s estimate, with its interval</span>
        <span><span style={{ display: "inline-block", height: 10, borderLeft: "1px solid var(--muted)", verticalAlign: "-1px", marginRight: 5 }} />one fold</span>
        {mode === "new" && <span>met: new threads from a sender the test&rsquo;s training part has seen (later posts {(100 * H.future.known).toFixed(1)}%)</span>}
      </div>
    </div>
  );
}
