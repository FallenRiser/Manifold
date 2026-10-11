"use client";

import { useState } from "react";
import kv from "@/data/routing/keywords.json";

// A keyword rule learned from the earlier posts, at eight list lengths K. Every word seen in 10+
// posts belongs to the forum holding the largest share of its posts; each forum keeps its K words
// with the largest share, and a post goes to the forum with the most of its keywords (no keyword or
// a tie: it goes to misc.forsale). Scored on the harness and on the later new threads, beside the
// linear SVM. The keyword list shows each forum's first twelve words, tagged by what they are.
//
// Data: src/data/routing/keywords.json, written by `python scripts/routing_cases.py baselines`.

type Row = {
  K: number; h: number; w: number; h_fires: number; h_prec: number; h_svm: number;
  l: number; l_fires: number; l_prec: number; l_svm: number; forum_h: number[];
};
type Word = { w: string; df: number; share: number; tag: string; thread: number };
const D = kv as {
  k: number[]; pick: number; rows: Row[];
  majority: Record<string, { forum: string; h: number; w: number; l: number }>;
  svm: { h: number; w: number; l: number };
  forums: { name: string; words: Word[]; svm_h: number }[];
};

const POST = "var(--c-post)";
const mono: React.CSSProperties = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" };
const TAG: Record<string, { label: (w: Word) => string; ink: string }> = {
  encoded: { label: () => "encoded file", ink: "var(--bad)" },
  person: { label: () => "a person", ink: "var(--bad)" },
  thread: { label: (w) => `one thread, ${Math.round(100 * w.thread)}%`, ink: "var(--warn)" },
};
const MAJ = D.majority["the most common forum of new threads"];

// the chart: rule accuracy by K on the harness (solid) and the later posts (dashed)
const W = 440, H = 200, L = 34, Rm = 20, T = 12, B = 26;
const xs = (i: number) => Math.round(L + (i * (W - L - Rm)) / (D.k.length - 1));
const ys = (a: number) => Math.round(T + (1 - a) * (H - T - B));
const path = (f: (r: Row) => number) => D.rows.map((r, i) => `${i ? "L" : "M"}${xs(i)},${ys(f(r))}`).join(" ");

export default function KeywordRuleLab() {
  const [ki, setKi] = useState(D.k.indexOf(D.pick));
  const [forum, setForum] = useState(D.forums.findIndex((f) => f.name === "comp.os.ms-windows.misc"));
  const r = D.rows[ki];
  const K = r.K;
  const f = D.forums[forum];

  return (
    <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 14, padding: "12px 14px 12px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px 10px", marginBottom: 8 }}>
        <span style={{ fontSize: 13, color: "var(--muted)" }}>keywords per forum</span>
        <div role="radiogroup" aria-label="keywords per forum" style={{ display: "inline-flex", flexWrap: "wrap", gap: 3, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 3 }}>
          {D.k.map((k, i) => {
            const on = i === ki;
            return (
              <button key={k} role="radio" aria-checked={on} onClick={() => setKi(i)}
                style={{ ...mono, fontSize: 12, padding: "4px 9px", borderRadius: 7, border: "none", cursor: "pointer", background: on ? POST : "transparent", color: on ? "var(--surface)" : "var(--muted)", fontWeight: on ? 600 : 400 }}>
                {k}
              </button>
            );
          })}
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="keyword rule accuracy by list length, against the linear SVM" style={{ display: "block", maxWidth: W }}>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <g key={t}>
            <line x1={L} x2={W - Rm} y1={ys(t)} y2={ys(t)} stroke="var(--border)" strokeWidth={1} />
            <text x={L - 6} y={ys(t) + 4} textAnchor="end" fontSize={11.5} fill="var(--faint)" style={mono}>{t === 0 ? "0" : t === 1 ? "1" : t.toFixed(2).replace(/^0/, "")}</text>
          </g>
        ))}
        <line x1={L} x2={W - Rm} y1={ys(D.svm.h)} y2={ys(D.svm.h)} stroke="var(--good)" strokeWidth={1.5} />
        <text x={W - Rm} y={ys(D.svm.h) - 6} textAnchor="end" fontSize={12.5} fill="var(--good)">linear SVM {D.svm.h.toFixed(3)}</text>
        <line x1={L} x2={W - Rm} y1={ys(MAJ.h)} y2={ys(MAJ.h)} stroke="var(--faint)" strokeWidth={1} strokeDasharray="2 3" />
        <text x={L + 4} y={ys(MAJ.h) + 14} fontSize={12.5} fill="var(--muted)">always {MAJ.forum} {MAJ.h.toFixed(3)}</text>
        <path d={path((q) => q.l)} fill="none" stroke={POST} strokeWidth={1.5} strokeDasharray="5 4" opacity={0.75} />
        <path d={path((q) => q.h)} fill="none" stroke={POST} strokeWidth={2} />
        <line x1={xs(ki)} x2={xs(ki)} y1={T} y2={H - B} stroke={POST} strokeWidth={1} opacity={0.35} />
        {D.rows.map((q, i) => (
          <circle key={q.K} cx={xs(i)} cy={ys(q.h)} r={i === ki ? 5 : 3} fill={i === ki ? POST : "var(--surface)"} stroke={POST} strokeWidth={1.5} />
        ))}
        {D.k.map((k, i) => (
          <text key={k} x={xs(i)} y={H - 8} textAnchor="middle" fontSize={11.5} fill={i === ki ? "var(--ink)" : "var(--faint)"} style={mono}>{k}</text>
        ))}
      </svg>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 14px", fontSize: 11.5, color: "var(--muted)", margin: "2px 0 10px" }}>
        <span><span aria-hidden style={{ display: "inline-block", width: 16, borderTop: `2px solid ${POST}`, verticalAlign: "3px", marginRight: 5 }} />the rule on the harness</span>
        <span><span aria-hidden style={{ display: "inline-block", width: 16, borderTop: `1.5px dashed ${POST}`, verticalAlign: "3px", marginRight: 5 }} />on the later new threads</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(14em, 1fr))", gap: 8, marginBottom: 12 }}>
        {([["the harness", r.h, r.w, r.h_fires, r.h_prec, r.h_svm, D.svm.h], ["the later new threads", r.l, null, r.l_fires, r.l_prec, r.l_svm, D.svm.l]] as const).map(([lbl, acc, wt, fires, prec, svm, svmAll]) => (
          <div key={lbl} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 10px", fontSize: 12.5, color: "var(--muted)", lineHeight: 1.6 }}>
            <div style={{ fontSize: 11.5, color: "var(--faint)" }}>{lbl}, K = {K}</div>
            <div><strong style={{ ...mono, fontSize: 17, color: POST }}>{acc.toFixed(3)}</strong> right{wt !== null && <> · weighted {wt.toFixed(3)}</>} · the SVM {svmAll.toFixed(3)}</div>
            <div>fires on <strong style={{ color: "var(--ink)" }}>{(100 * fires).toFixed(1)}%</strong>, right on {(100 * prec).toFixed(1)}% of them</div>
            <div>the SVM on those same posts: <strong style={{ color: svm >= prec ? "var(--good)" : "var(--bad)" }}>{(100 * svm).toFixed(1)}%</strong></div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px 10px", marginBottom: 6 }}>
        <label htmlFor="kw-forum" style={{ fontSize: 13, color: "var(--muted)" }}>the keywords of</label>
        <select id="kw-forum" value={forum} onChange={(e) => setForum(Number(e.target.value))}
          style={{ ...mono, fontSize: 12.5, padding: "4px 6px", borderRadius: 7, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--ink)", maxWidth: "100%" }}>
          {D.forums.map((q, i) => <option key={q.name} value={i}>{q.name}</option>)}
        </select>
        <span style={{ fontSize: 12.5, color: "var(--muted)" }}>
          harness: the rule <strong style={{ ...mono, color: "var(--ink)" }}>{r.forum_h[forum].toFixed(3)}</strong>, the SVM <strong style={{ ...mono, color: "var(--ink)" }}>{f.svm_h.toFixed(3)}</strong>
          {f.name === MAJ.forum && <> (every post the rule does not fire on is sent here)</>}
        </span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {f.words.map((w, i) => {
          const live = i < K;
          const t = TAG[w.tag];
          return (
            <span key={w.w + i} title={`${w.df} earlier posts, ${Math.round(100 * w.share)}% of them in ${f.name}`}
              style={{ display: "inline-flex", alignItems: "baseline", gap: 5, padding: "3px 8px", borderRadius: 7, border: `1px solid ${live ? "var(--border-strong)" : "var(--border)"}`, background: live ? "var(--surface)" : "transparent", opacity: live ? 1 : 0.45, fontSize: 12 }}>
              <span style={{ ...mono, color: "var(--ink)" }}>{w.w}</span>
              <span style={{ ...mono, fontSize: 10.5, color: "var(--faint)" }}>{w.df}</span>
              {t && <span style={{ fontSize: 10.5, color: t.ink }}>{t.label(w)}</span>}
            </span>
          );
        })}
      </div>
      <p style={{ margin: "8px 0 0", fontSize: 12.5, color: "var(--muted)", lineHeight: 1.55 }}>
        The first twelve words of the list, with the number of earlier posts each appears in{K < 12 && <>; beyond K = {K} they are greyed out</>}. Names of private people are masked.
      </p>
    </div>
  );
}
