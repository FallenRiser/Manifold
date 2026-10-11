"use client";

import { useState } from "react";
import nb from "@/data/routing/naivebayes.json";
import { Printout } from "@/components/capstone/newsreader";

// Naive Bayes routes a post by adding up one vote per word. Three later new threads, three models
// fitted on all the earlier posts: multinomial on word counts (the textbook model), multinomial on
// log counts with each post's length normalised, and complement on the same (the harness's pick).
// The contest shown is the right forum against its rival: the model's pick when it is wrong, the
// runner-up when it is right. Each word's vote is its value in the post times the difference of the
// two forums' weights for it; the multinomial models add each forum's prior.
//
// Data: src/data/routing/naivebayes.json, written by `python scripts/routing_cases.py naive_bayes`.

type Word = { w: string; x: number; c: number };
type Model = { pick: string; rival: string; total: number; prior: number; words: Word[]; top: { f: string; gap: number }[] };
type Spec = { id: number; forum: string; svm: string; segments: string[][]; models: Record<string, Model> };
const D = nb as unknown as { models: { key: string; label: string }[]; specimens: Spec[] };

const POST = "var(--c-post)";
const GOOD = "var(--good)";
const BAD = "var(--bad)";
const mono: React.CSSProperties = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" };
const SHORT: Record<string, string> = { mnb_counts: "word counts", mnb_len: "lengths normalised", cnb_len: "complement" };
const SHOW = 8;

const subject = (s: Spec) => s.segments.map((g) => g[0]).join("").split("\n")[0];
const sign = (v: number) => (v < 0 ? "−" : "+");
const fmt = (v: number) => {
  const a = Math.abs(v);
  return sign(v) + (a >= 10 ? a.toFixed(1) : a >= 1 ? a.toFixed(2) : a.toFixed(3));
};

export default function NaiveBayesLab() {
  const [si, setSi] = useState(0);
  const [mi, setMi] = useState(0);
  const s = D.specimens[si];
  const key = D.models[mi].key;
  const m = s.models[key];
  const right = m.pick === s.forum;
  const vote = new Map(m.words.map((q) => [q.w, q.c]));
  const max = Math.max(...m.words.map((q) => Math.abs(q.c)), 1e-9);
  const pos = m.words.filter((q) => q.c > 0);
  const neg = m.words.filter((q) => q.c < 0);
  const sum = (ws: Word[]) => ws.reduce((t, q) => t + q.c, 0);
  const counts = key === "mnb_counts";
  const hasPrior = key.startsWith("mnb");

  const toggle = (on: boolean): React.CSSProperties => ({
    fontSize: 12.5, padding: "5px 10px", borderRadius: 7, border: "none", cursor: "pointer",
    background: on ? POST : "transparent", color: on ? "var(--surface)" : "var(--muted)", fontWeight: on ? 600 : 400,
  });
  const group: React.CSSProperties = {
    display: "inline-flex", flexWrap: "wrap", gap: 3, background: "var(--surface)", border: "1px solid var(--border)",
    borderRadius: 10, padding: 3,
  };

  const column = (ws: Word[], forum: string, ink: string, label: string) => (
    <section aria-label={label} style={{ minWidth: 0 }}>
      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>
        for <span style={{ ...mono, color: "var(--ink)" }}>{forum}</span>
        <strong style={{ ...mono, color: ink, marginLeft: 6 }}>{fmt(sum(ws))}</strong>
        <span style={{ color: "var(--faint)" }}> from {ws.length} words</span>
      </div>
      {ws.slice(0, SHOW).map((q) => (
        <div key={q.w} style={{ display: "grid", gridTemplateColumns: "minmax(0, 7.5em) 1fr 4.2em", alignItems: "center", gap: 6, fontSize: 12, lineHeight: 1.9 }}>
          <span style={{ ...mono, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {q.w}{counts && q.x > 1 && <span style={{ color: "var(--faint)" }}> ×{q.x}</span>}
          </span>
          <span style={{ height: 8, background: "var(--surface-2)", borderRadius: 2, position: "relative" }}>
            <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${(100 * Math.abs(q.c)) / max}%`, background: ink, borderRadius: 2, opacity: 0.8 }} />
          </span>
          <span style={{ ...mono, fontSize: 11.5, color: "var(--muted)", textAlign: "right" }}>{fmt(q.c)}</span>
        </div>
      ))}
    </section>
  );

  return (
    <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 14, padding: "12px 14px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px 10px", marginBottom: 8 }}>
        <span style={{ fontSize: 13, color: "var(--muted)" }}>post</span>
        <div role="radiogroup" aria-label="post" style={group}>
          {D.specimens.map((q, i) => (
            <button key={q.id} role="radio" aria-checked={i === si} onClick={() => setSi(i)} style={{ ...toggle(i === si), maxWidth: "17em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {subject(q)}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px 10px", marginBottom: 10 }}>
        <span style={{ fontSize: 13, color: "var(--muted)" }}>naive Bayes on</span>
        <div role="radiogroup" aria-label="model" style={group}>
          {D.models.map((q, i) => (
            <button key={q.key} role="radio" aria-checked={i === mi} onClick={() => setMi(i)} style={toggle(i === mi)}>
              {SHORT[q.key] ?? q.label}
            </button>
          ))}
        </div>
      </div>

      <Printout py={12}>
        <div style={{ ...mono, fontSize: 11.5, color: "var(--nr-faint)", marginBottom: 8 }}>
          later post {s.id.toLocaleString("en-US")} · a new thread in {s.forum} · the router&rsquo;s view
        </div>
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <pre style={{ ...mono, fontSize: 11.5, lineHeight: 1.7, margin: 0, whiteSpace: "pre", tabSize: 4, width: "max-content", background: "transparent", padding: "2px 0", color: "var(--nr-ink)" }}>
            {s.segments.map(([t, w], i) => {
              const c = w ? vote.get(w) ?? 0 : 0;
              const k = Math.abs(c) / max;
              if (!w || k < 0.04) return <span key={i}>{t}</span>;
              const ink = c > 0 ? GOOD : BAD;
              return (
                <span key={i} title={`${w}: ${fmt(c)}`} style={{ background: `color-mix(in srgb, ${ink} ${Math.round(12 + 50 * k)}%, transparent)`, borderRadius: 2 }}>
                  {t}
                </span>
              );
            })}
          </pre>
        </div>
      </Printout>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 14px", fontSize: 11.5, color: "var(--muted)", margin: "6px 0 12px" }}>
        <span><span aria-hidden style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: `color-mix(in srgb, ${GOOD} 45%, transparent)`, verticalAlign: "-1px", marginRight: 5 }} />a vote for {s.forum}</span>
        <span><span aria-hidden style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: `color-mix(in srgb, ${BAD} 45%, transparent)`, verticalAlign: "-1px", marginRight: 5 }} />a vote for {m.rival}</span>
        <span>the darker, the bigger the vote</span>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
        <div style={{ fontSize: 13.5, color: "var(--ink)", lineHeight: 1.55 }}>
          {D.models[mi].label}: <span style={{ ...mono }}>{m.pick}</span>{" "}
          <strong style={{ color: right ? GOOD : BAD }}>{right ? "right" : "wrong"}</strong>
          <span style={{ color: "var(--muted)" }}>
            {" "}· the SVM: <span style={mono}>{s.svm}</span>{" "}
            <strong style={{ color: s.svm === s.forum ? GOOD : BAD }}>{s.svm === s.forum ? "right" : "wrong"}</strong>
          </span>
        </div>
        <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 4, lineHeight: 1.6 }}>
          {s.forum} against {m.rival}{right ? ", the runner-up" : ""}:{" "}
          words <strong style={{ ...mono, color: "var(--ink)" }}>{fmt(sum(m.words))}</strong>
          {hasPrior && <>, the forums&rsquo; sizes <strong style={{ ...mono, color: "var(--ink)" }}>{fmt(m.prior)}</strong></>}
          , total <strong style={{ ...mono, color: right ? GOOD : BAD }}>{fmt(m.total)}</strong>
          {counts && <> (in log units; the other two models&rsquo; votes are on a smaller scale, because each post&rsquo;s values are normalised)</>}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(15em, 1fr))", gap: "10px 18px" }}>
        {column(pos, s.forum, GOOD, "votes for the right forum")}
        {column(neg, m.rival, BAD, "votes for the rival")}
      </div>
      <p style={{ margin: "8px 0 0", fontSize: 12.5, color: "var(--muted)", lineHeight: 1.55 }}>
        Each word&rsquo;s vote is its value in the post {counts ? "(its count)" : "(its log count, scaled so the post has length one)"} times
        the difference between the two forums&rsquo; weights for it. The {SHOW} biggest votes on each side are listed.
      </p>
    </div>
  );
}
