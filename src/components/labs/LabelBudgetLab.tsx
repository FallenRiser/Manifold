"use client";

import { useState } from "react";
import lb from "@/data/routing/labelbudget.json";

// The label budget. Each forum in turn plays a forum that has just opened: it keeps only its latest n earlier
// posts while every other forum keeps all of its own, and the router is refitted. Three curves, for one forum or
// for all twenty pooled: the new forum's later new threads routed right as the router is fitted, the same with
// the new forum's posts weighted to the pull of an average forum, and the textbook curve, where every forum is
// cut to n at once. Pick a budget for what the threshold does with the new forum's threads.
//
// Data: src/data/routing/labelbudget.json, written by `python scripts/routing_cases.py budget_weighted`.

type Run = { right: number[][]; fr: number[][]; fw: number[][]; into: number[][]; promise: number[][] };
const D = lb as unknown as {
  budgets: number[]; names: string[]; threshold: number; posts: number[]; later: number[]; openers: number[][];
  as: Run; weighted: Run; every: number[][];
  full: { right: number[]; fr: number[]; fw: number[]; into: number[]; promise: number };
};

const POST = "var(--c-post)";
const AS = "var(--warn)";
const EVERY = "var(--muted)";
const mono: React.CSSProperties = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" };
const pct = (v: number) => `${(100 * v).toFixed(1)}%`;
const r1 = (v: number) => Math.round(v * 10) / 10;
const NB = D.budgets.length; // the last point on the axis is "all its posts"
const PW = 520, PH = 220, L = 40, R = 14, T = 12, B = 30;
const px = (j: number) => r1(L + (j / NB) * (PW - L - R));
const py = (v: number) => r1(T + (1 - v) * (PH - T - B));
const N = D.later.reduce((a, b) => a + b, 0);
const sum = (a: number[]) => a.reduce((s, v) => s + v, 0);
const mean = (a: number[]) => sum(a) / a.length;

export default function LabelBudgetLab() {
  const [forum, setForum] = useState(-1); // -1: every forum pooled
  const [at, setAt] = useState(D.budgets.indexOf(80));
  const [weighted, setWeighted] = useState(true);

  const ks = forum < 0 ? D.names.map((_, k) => k) : [forum];
  const posts = sum(ks.map((k) => D.later[k]));
  // share of the chosen forums' later new threads, at budget j (j = NB: all its posts)
  const share = (run: Run | null, key: "right" | "fr" | "fw", j: number) =>
    sum(ks.map((k) => (j === NB || !run ? D.full[key][k] : run[key][k][j]))) / posts;
  const curve = (f: (j: number) => number) => Array.from({ length: NB + 1 }, (_, j) => f(j));
  const lines = [
    { key: "every", label: "every forum cut to n (the textbook curve)", color: EVERY, dash: "5 4",
      v: curve((j) => (j === NB ? share(null, "right", j) : sum(ks.map((k) => D.every[k][j])) / posts)) },
    { key: "as", label: "the new forum, as the router is fitted", color: AS, dash: undefined, v: curve((j) => share(D.as, "right", j)) },
    { key: "weighted", label: "the new forum, its posts weighted up", color: POST, dash: undefined, v: curve((j) => share(D.weighted, "right", j)) },
  ];

  const run = weighted ? D.weighted : D.as;
  const n = D.budgets[at];
  const opened = mean(ks.map((k) => D.openers[k][at]));
  const into = mean(ks.map((k) => run.into[k][at]));
  const intoAll = mean(ks.map((k) => D.full.into[k]));
  const promise = mean(ks.map((k) => run.promise[k][at]));
  const fr = share(run, "fr", at), fw = share(run, "fw", at);

  const chip = (on: boolean, color = POST): React.CSSProperties => ({
    fontSize: 12, padding: "4px 9px", borderRadius: 999, cursor: "pointer", border: `1px solid ${on ? color : "var(--border)"}`,
    background: on ? "var(--surface)" : "transparent", color: on ? "var(--ink)" : "var(--muted)", fontWeight: on ? 600 : 400,
  });
  const tile: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 10px", minWidth: 0 };
  const small: React.CSSProperties = { fontSize: 11.5, color: "var(--muted)" };
  const faint: React.CSSProperties = { fontSize: 11.5, color: "var(--faint)" };
  const big: React.CSSProperties = { ...mono, fontSize: 17, color: "var(--ink)" };

  return (
    <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 14, padding: "12px 14px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px 12px", marginBottom: 8 }}>
        <label htmlFor="lb-forum" style={{ fontSize: 13, color: "var(--muted)" }}>the new forum</label>
        <select id="lb-forum" value={forum} onChange={(e) => setForum(Number(e.target.value))}
          style={{ fontSize: 13, padding: "4px 6px", borderRadius: 7, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--ink)", maxWidth: "100%" }}>
          <option value={-1}>each forum in turn (all {N.toLocaleString("en-US")} later new threads)</option>
          {D.names.map((name, k) => <option key={name} value={k}>{name} ({D.later[k]} later new threads)</option>)}
        </select>
      </div>

      <figure style={{ margin: 0, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 8px 6px" }}>
        <figcaption style={{ fontSize: 12, color: "var(--ink)", marginBottom: 2 }}>its later new threads routed right, against its labelled posts</figcaption>
        <svg viewBox={`0 0 ${PW} ${PH}`} role="img" aria-label="share of the new forum's later new threads routed right at each number of labelled posts, three ways"
          style={{ width: "100%", height: "auto", display: "block" }}>
          {[0, 0.25, 0.5, 0.75, 1].map((v) => (
            <g key={v}>
              <line x1={L} x2={PW - R} y1={py(v)} y2={py(v)} stroke="var(--border)" strokeWidth={1} />
              <text x={L - 6} y={py(v) + 3.5} fontSize={10} textAnchor="end" fill="var(--faint)">{Math.round(100 * v)}%</text>
            </g>
          ))}
          {[...D.budgets, "all"].map((b, j) => (
            <text key={j} x={px(j)} y={PH - 10} fontSize={10} textAnchor="middle" fill={j === at ? "var(--ink)" : "var(--faint)"}
              fontWeight={j === at ? 700 : 400}>{b}</text>
          ))}
          <line x1={px(at)} x2={px(at)} y1={T} y2={PH - B} stroke="var(--muted)" strokeWidth={1} strokeDasharray="2 3" />
          {lines.map((s) => (
            <g key={s.key}>
              <path d={s.v.map((v, j) => `${j ? "L" : "M"}${px(j)},${py(v)}`).join(" ")} fill="none" stroke={s.color}
                strokeWidth={s.key === "weighted" ? 2.5 : 1.75} strokeDasharray={s.dash} />
              {s.v.map((v, j) => <circle key={j} cx={px(j)} cy={py(v)} r={j === at ? 4 : 2.5} fill={s.color} />)}
            </g>
          ))}
        </svg>
      </figure>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 14px", fontSize: 11.5, color: "var(--muted)", margin: "6px 0 10px" }}>
        {lines.map((s) => (
          <span key={s.key}>
            <span aria-hidden style={{ display: "inline-block", width: 14, borderTop: `${s.key === "weighted" ? 2.5 : 1.75}px ${s.dash ? "dashed" : "solid"} ${s.color}`, verticalAlign: "3px", marginRight: 5 }} />
            {s.label} <span style={{ ...mono, color: "var(--faint)" }}>{pct(s.v[at])}</span>
          </span>
        ))}
      </div>

      <div role="group" aria-label="labelled posts of the new forum" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 5, marginBottom: 8 }}>
        <span style={{ fontSize: 12.5, color: "var(--muted)", marginRight: 4 }}>labelled posts</span>
        {D.budgets.map((b, j) => (
          <button key={b} onClick={() => setAt(j)} style={{ ...chip(j === at), ...mono }} aria-pressed={j === at}>{b}</button>
        ))}
      </div>
      <div role="radiogroup" aria-label="how the router treats the new forum" style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
        <button role="radio" aria-checked={weighted} onClick={() => setWeighted(true)} style={chip(weighted)}>its posts weighted up</button>
        <button role="radio" aria-checked={!weighted} onClick={() => setWeighted(false)} style={chip(!weighted, AS)}>as the router is fitted</button>
      </div>

      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>
        at the router&rsquo;s threshold ({D.threshold.toFixed(3)}), with {n} labelled posts, {weighted ? "weighted up" : "as fitted"}:
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 9.5em), 1fr))", gap: 8 }}>
        <div style={tile}>
          <div style={small}>new threads among them</div>
          <div style={big}>{opened.toFixed(forum < 0 ? 1 : 0)}</div>
          <div style={faint}>filed by a person; the replies follow</div>
        </div>
        <div style={tile}>
          <div style={small}>its threads filed right</div>
          <div style={big}>{pct(fr)}</div>
          <div style={faint}>{pct(share(null, "fr", NB))} with all its posts</div>
        </div>
        <div style={tile}>
          <div style={small}>its threads filed in a wrong forum</div>
          <div style={{ ...big, color: fw > 1.5 * share(null, "fw", NB) ? "var(--bad)" : "var(--ink)" }}>{pct(fw)}</div>
          <div style={faint}>{pct(share(null, "fw", NB))} with all its posts</div>
        </div>
        <div style={tile}>
          <div style={small}>other forums&rsquo; threads filed into it</div>
          <div style={big}>{into.toFixed(forum < 0 ? 1 : 0)}</div>
          <div style={faint}>{intoAll.toFixed(forum < 0 ? 1 : 0)} with all its posts</div>
        </div>
        <div style={tile}>
          <div style={small}>the router&rsquo;s promise, all posts</div>
          <div style={big}>{pct(promise)}</div>
          <div style={faint}>{pct(D.full.promise)} with every forum full</div>
        </div>
      </div>
    </div>
  );
}
