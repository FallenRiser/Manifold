"use client";

import { useState } from "react";
import { Printout } from "@/components/capstone/newsreader";
import nt from "@/data/routing/notes.json";

// The fourteen later new threads in soc.religion.christian that carry a note from the moderator in
// the body. For each: how much of the post he wrote, the note itself (long notes cut to their first
// forty words; initials masked), and where the router's view files the post, and how far ahead of the
// runner-up, with the note as collected and without it, as the router would receive the post.
//
// Data: src/data/routing/notes.json, written by `python scripts/routing_cases.py notes_cost`.

type Route = { top: string; second: string; margin: number };
type Post = { post: number; subject: string; words: number; note_words: number; notes: string[]; with: Route; without: Route; right: boolean };
const D = nt as { forum: string; posts: Post[]; median_margin: number };

const POST = "var(--c-post)";
const mono: React.CSSProperties = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" };
const AXIS = 2; // the largest margin among the fourteen is 1.91
const pct = (m: number) => Math.round(1000 * Math.min(m, AXIS) / AXIS) / 10;
const short = (s: string) => (s.length > 26 ? s.slice(0, 25).trimEnd() + "…" : s);
const START = Math.max(0, D.posts.findIndex((p) => p.post === 3696));

export default function NotesLab() {
  const [k, setK] = useState(START);
  const p = D.posts[k];
  const mine = p.note_words / p.words;

  return (
    <div>
      <div role="radiogroup" aria-label="post" style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
        {D.posts.map((x, i) => {
          const on = i === k;
          return (
            <button
              key={x.post}
              role="radio"
              aria-checked={on}
              title={x.subject}
              onClick={() => setK(i)}
              style={{ ...mono, fontSize: 11.5, padding: "3px 8px", borderRadius: 6, cursor: "pointer", border: `1px solid ${on ? POST : "var(--border)"}`, background: on ? POST : "var(--surface)", color: on ? "var(--surface)" : "var(--muted)", fontWeight: on ? 600 : 400 }}
            >
              {short(x.subject)}
            </button>
          );
        })}
      </div>

      <Printout py={12}>
        <div style={{ ...mono, fontSize: 12.5, color: "var(--nr-ink)", fontWeight: 700, overflowWrap: "anywhere" }}>
          <span style={{ color: "var(--nr-head)", fontWeight: 400 }}>Subject: </span>{p.subject}
        </div>
        <div style={{ fontSize: 12.5, color: "var(--nr-ink-soft)", margin: "8px 0 5px" }}>
          <strong style={mono}>{p.words.toLocaleString("en-US")}</strong> words in the router&rsquo;s view, and{" "}
          <strong style={{ ...mono, color: "var(--nr-pen)" }}>{p.note_words.toLocaleString("en-US")}</strong> of them
          ({Math.round(100 * mine)}%) are the moderator&rsquo;s
        </div>
        <div aria-hidden style={{ display: "flex", height: 10, borderRadius: 3, overflow: "hidden", border: "1px solid var(--nr-rule)", marginBottom: 12 }}>
          <span style={{ width: `${Math.round(1000 * (1 - mine)) / 10}%`, background: "var(--nr-ink-soft)" }} />
          <span style={{ width: `${Math.round(1000 * mine) / 10}%`, background: "var(--nr-pen)" }} />
        </div>
        {p.notes.map((n, i) => (
          <div key={i} style={{ borderLeft: "2px solid var(--nr-pen)", padding: "2px 0 2px 10px", margin: "0 0 8px" }}>
            <div style={{ ...mono, fontSize: 10.5, color: "var(--nr-pen)", marginBottom: 2 }}>
              {p.notes.length > 1 ? `the moderator's note ${i + 1} of ${p.notes.length}` : "the moderator's note"}
            </div>
            <div style={{ ...mono, fontSize: 12, lineHeight: 1.6, color: "var(--nr-ink)" }}>{n}</div>
          </div>
        ))}
      </Printout>

      <div style={{ marginTop: 12, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 14px 10px" }}>
        <div style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 8 }}>
          where the router&rsquo;s view files it, and how far ahead of the runner-up
        </div>
        {([["with the note, as collected", p.with, "var(--c-post)"], ["without it, as the router would get it", p.without, "var(--muted)"]] as const).map(([label, r, colour]) => (
          <div key={label} style={{ marginBottom: 9 }}>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "0 10px", fontSize: 12.5, marginBottom: 3 }}>
              <span style={{ color: "var(--ink)" }}>{label}</span>
              <span style={{ ...mono, fontSize: 11.5, color: "var(--muted)" }}>
                {r.top} <span style={{ color: "var(--faint)" }}>by</span> <strong style={{ color: "var(--ink)" }}>{r.margin.toFixed(r.margin < 0.01 ? 3 : 2)}</strong>{" "}
                <span style={{ color: "var(--faint)" }}>over {r.second}</span>
              </span>
            </div>
            <div style={{ position: "relative", height: 12, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 3 }}>
              <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct(r.margin)}%`, background: colour, borderRadius: 2 }} />
              <span aria-hidden style={{ position: "absolute", left: `${pct(D.median_margin)}%`, top: -3, bottom: -3, borderLeft: "1.5px dashed var(--ink)" }} />
            </div>
          </div>
        ))}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "2px 12px", fontSize: 11.5, color: "var(--faint)" }}>
          <span>
            <span style={{ display: "inline-block", width: 12, borderTop: "1.5px dashed var(--ink)", verticalAlign: "middle", marginRight: 5 }} />
            {D.median_margin.toFixed(2)}, the median margin over all 2,527 later new threads
          </span>
          <span style={{ ...mono }}>scale 0 to {AXIS}</span>
        </div>
      </div>

      <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 8 }}>
        Filed in {D.forum}.{" "}
        {p.with.top === p.without.top
          ? <>The route is the same either way, and it is <Verdict ok={p.right} />.</>
          : p.with.top !== D.forum && p.without.top !== D.forum
            ? <>Routed <Verdict ok={false} /> either way: the note moves it from one wrong forum to another.</>
            : <>With the note the route is <Verdict ok={p.with.top === D.forum} />; without it, <Verdict ok={p.without.top === D.forum} />.</>}
      </div>
    </div>
  );
}

function Verdict({ ok }: { ok: boolean }) {
  return <strong style={{ color: ok ? "var(--good)" : "var(--bad)" }}>{ok ? "right" : "wrong"}</strong>;
}
