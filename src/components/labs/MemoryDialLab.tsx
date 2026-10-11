"use client";

import { useState } from "react";
import sv from "@/data/routing/svm.json";

// C as a memory dial. The linear SVM at seven values of C against the bar (complement naive Bayes,
// whose setting does not move), on three kinds of post: new threads, replies to a conversation the
// models were trained on, and replies to one they were not. Scored on the later posts (every model
// fitted on all the earlier posts) or on five random folds of the earlier posts (page 11's random split).
//
// Data: src/data/routing/svm.json, written by `python scripts/routing_cases.py svm_memory`.

type G = "new" | "read" | "unread";
type Row = Record<G | "all", number> & { C: number };
type Scored = { n: Record<G | "all", number>; bar: Record<G | "all", number>; svm: Row[] };
const D = sv as unknown as {
  C: number[]; pick: { harness: number; random: number; later: number };
  later: Scored; random: Scored; lookup: number; fit: { C: number; train: number; inside: number }[];
};

const POST = "var(--c-post)";
const mono: React.CSSProperties = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" };
const GROUPS: { key: G; label: string }[] = [
  { key: "new", label: "new threads" },
  { key: "read", label: "replies, conversation in training" },
  { key: "unread", label: "replies, conversation not in training" },
];
const SCORING = [
  { key: "later", label: "the later posts" },
  { key: "random", label: "random folds of the earlier posts" },
] as const;
type S = (typeof SCORING)[number]["key"];

const r1 = (v: number) => Math.round(v * 10) / 10;
const pts = (v: number) => `${v >= 0 ? "+" : "−"}${Math.abs(100 * v).toFixed(2)}`;
const cfmt = (c: number) => (c < 0.1 ? c.toFixed(2) : c < 1 ? c.toFixed(1) : String(c));

// one panel: C on a log axis, share routed right on a scale shared by the three panels
const PW = 240, PH = 150, L = 34, R = 10, T = 10, B = 26;
const X0 = Math.log10(D.C[0]), X1 = Math.log10(D.C[D.C.length - 1]);
const px = (c: number) => r1(L + ((Math.log10(c) - X0) / (X1 - X0)) * (PW - L - R));

function range(s: Scored): [number, number] {
  const v = s.svm.flatMap((r) => GROUPS.map((g) => r[g.key])).concat(GROUPS.map((g) => s.bar[g.key]));
  return [Math.floor(Math.min(...v) * 20) / 20, Math.ceil(Math.max(...v) * 20) / 20];
}

export default function MemoryDialLab() {
  const [scoring, setScoring] = useState<S>("later");
  const [ci, setCi] = useState(D.C.indexOf(D.pick.harness));
  const s = D[scoring];
  const C = D.C[ci];
  const row = s.svm[ci];
  const fit = D.fit[ci];
  const [lo, hi] = range(s);
  const py = (v: number) => r1(T + (1 - (v - lo) / (hi - lo)) * (PH - T - B));
  const ticks: number[] = [];
  for (let v = lo; v <= hi + 1e-9; v += 0.05) ticks.push(Math.round(v * 100) / 100);
  const notes = [
    C === D.pick.harness && "the harness's pick",
    C === D.pick.random && "five random folds' pick",
  ].filter(Boolean).join(" · ");

  const toggle = (on: boolean): React.CSSProperties => ({
    fontSize: 12.5, padding: "5px 10px", borderRadius: 7, border: "none", cursor: "pointer",
    background: on ? POST : "transparent", color: on ? "var(--surface)" : "var(--muted)", fontWeight: on ? 600 : 400,
  });
  const group: React.CSSProperties = {
    display: "inline-flex", flexWrap: "wrap", gap: 3, background: "var(--surface)", border: "1px solid var(--border)",
    borderRadius: 10, padding: 3,
  };
  const tile: React.CSSProperties = {
    background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 10px", minWidth: 0,
  };

  return (
    <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 14, padding: "12px 14px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px 10px", marginBottom: 8 }}>
        <span style={{ fontSize: 13, color: "var(--muted)" }}>scored on</span>
        <div role="radiogroup" aria-label="posts scored" style={group}>
          {SCORING.map((q) => (
            <button key={q.key} role="radio" aria-checked={scoring === q.key} onClick={() => setScoring(q.key)} style={toggle(scoring === q.key)}>
              {q.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px 12px", marginBottom: 10 }}>
        <label htmlFor="memory-c" style={{ fontSize: 13, color: "var(--muted)" }}>C</label>
        <input id="memory-c" type="range" min={0} max={D.C.length - 1} step={1} value={ci}
          onChange={(e) => setCi(Number(e.target.value))} style={{ flex: "1 1 10em", maxWidth: 260, accentColor: POST }}
          aria-valuetext={`C = ${cfmt(C)}`} />
        <span style={{ ...mono, fontSize: 13, color: "var(--ink)", minWidth: "4.5em" }}>C = {cfmt(C)}</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>{notes}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 13em), 1fr))", gap: "10px 12px" }}>
        {GROUPS.map((g) => {
          const v = row[g.key], b = s.bar[g.key];
          const path = s.svm.map((r, i) => `${i ? "L" : "M"}${px(r.C)},${py(r[g.key])}`).join(" ");
          return (
            <figure key={g.key} style={{ margin: 0, minWidth: 0, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 8px 6px" }}>
              <figcaption style={{ fontSize: 12, lineHeight: 1.35 }}>
                <div style={{ color: "var(--ink)", minHeight: "2.7em" }}>{g.label}</div>
                <div style={{ color: "var(--faint)" }}>{s.n[g.key].toLocaleString("en-US")} posts</div>
              </figcaption>
              <svg viewBox={`0 0 ${PW} ${PH}`} role="img" aria-label={`${g.label}: share routed right by the SVM at each C, against the bar`}
                style={{ width: "100%", height: "auto", display: "block" }}>
                {ticks.map((t) => (
                  <g key={t}>
                    <line x1={L} x2={PW - R} y1={py(t)} y2={py(t)} stroke="var(--border)" strokeWidth={1} />
                    <text x={L - 5} y={py(t) + 3.5} fontSize={10} textAnchor="end" fill="var(--faint)">{t.toFixed(2)}</text>
                  </g>
                ))}
                {[0.01, 0.1, 1, 10].map((c) => (
                  <text key={c} x={px(c)} y={PH - 5} fontSize={10} textAnchor="middle" fill="var(--faint)">{cfmt(c)}</text>
                ))}
                <line x1={L} x2={PW - R} y1={py(b)} y2={py(b)} stroke="var(--ink)" strokeWidth={1.25} strokeDasharray="5 4" />
                <line x1={px(C)} x2={px(C)} y1={T} y2={PH - B} stroke="var(--muted)" strokeWidth={1} strokeDasharray="2 3" />
                <path d={path} fill="none" stroke={POST} strokeWidth={1.75} />
                {s.svm.map((r) => (
                  <circle key={r.C} cx={px(r.C)} cy={py(r[g.key])} r={r.C === C ? 4 : 2} fill={POST} />
                ))}
              </svg>
              <div style={{ ...mono, fontSize: 11.5, color: "var(--muted)", lineHeight: 1.5 }}>
                SVM <span style={{ color: "var(--ink)" }}>{v.toFixed(3)}</span> · bar <span style={{ color: "var(--ink)" }}>{b.toFixed(3)}</span>{" "}
                · <strong style={{ color: v >= b ? POST : "var(--ink)" }}>{pts(v - b)}</strong>
              </div>
              {scoring === "later" && g.key === "read" && (
                <div style={{ fontSize: 11.5, color: "var(--faint)", lineHeight: 1.4 }}>
                  the thread lookup files these at <span style={mono}>{D.lookup.toFixed(3)}</span>
                </div>
              )}
            </figure>
          );
        })}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 14px", fontSize: 11.5, color: "var(--muted)", margin: "6px 0 10px" }}>
        <span><span aria-hidden style={{ display: "inline-block", width: 14, height: 2, background: POST, verticalAlign: "3px", marginRight: 5 }} />the SVM, at each C</span>
        <span><span aria-hidden style={{ display: "inline-block", width: 14, borderTop: "1.5px dashed var(--ink)", verticalAlign: "3px", marginRight: 5 }} />the bar (naive Bayes)</span>
        <span>C on a log scale</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 11em), 1fr))", gap: 8 }}>
        <div style={tile}>
          <div style={{ fontSize: 11.5, color: "var(--muted)" }}>earlier posts it routes right</div>
          <div style={{ ...mono, fontSize: 18, color: "var(--ink)" }}>{(100 * fit.train).toFixed(2)}%</div>
          <div style={{ fontSize: 11.5, color: "var(--faint)" }}>the posts it was fitted on</div>
        </div>
        <div style={tile}>
          <div style={{ fontSize: 11.5, color: "var(--muted)" }}>inside their forum&rsquo;s margin</div>
          <div style={{ ...mono, fontSize: 18, color: "var(--ink)" }}>{(100 * fit.inside).toFixed(1)}%</div>
          <div style={{ fontSize: 11.5, color: "var(--faint)" }}>of the earlier posts</div>
        </div>
        <div style={tile}>
          <div style={{ fontSize: 11.5, color: "var(--muted)" }}>all {s.n.all.toLocaleString("en-US")} posts, as benchmarks count</div>
          <div style={{ ...mono, fontSize: 18, color: "var(--ink)" }}>{row.all.toFixed(3)}</div>
          <div style={{ fontSize: 11.5, color: "var(--faint)" }}>the bar {s.bar.all.toFixed(3)} · {pts(row.all - s.bar.all)}</div>
        </div>
        <div style={tile}>
          <div style={{ fontSize: 11.5, color: "var(--muted)" }}>C each test chooses</div>
          <div style={{ ...mono, fontSize: 18, color: "var(--ink)" }}>{cfmt(D.pick.harness)} · {cfmt(D.pick.random)}</div>
          <div style={{ fontSize: 11.5, color: "var(--faint)" }}>the harness · five random folds</div>
        </div>
      </div>
    </div>
  );
}
