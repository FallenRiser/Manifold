"use client";

import { useState } from "react";
import nd from "@/data/routing/nearest.json";

// What counts as alike. For a few later new threads, the five earlier posts nearest to each one, first by the
// words (the cosine between TF-IDF rows, the measure every rung so far has routed on) and then by the
// embedding (the cosine between bge-large's vectors). Each neighbour shows its forum, its subject and the
// words it shares with the post, rarest first.
//
// Data: src/data/routing/nearest.json, written by `python scripts/routing_cases.py nearest`.

type Near = { forum: string; subject: string; sim: number; shared: string[] };
type Spec = { post: number; forum: string; subject: string; text: string; length: number; words: Near[]; meaning: Near[] };
type Stat = { forum: number; forum_met: number; forum_new: number; sender: number };
const D = nd as unknown as { harness: { words: Stat; meaning: Stat }; specimens: Spec[] };

const POST = "var(--c-post)";
const mono: React.CSSProperties = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" };
const pct = (v: number) => `${(100 * v).toFixed(1)}%`;

const BY = [
  { key: "words" as const, label: "nearest by the words" },
  { key: "meaning" as const, label: "nearest by the embedding" },
];

export default function NearestPostsLab() {
  const [si, setSi] = useState(0);
  const [by, setBy] = useState<"words" | "meaning">("words");
  const s = D.specimens[si];
  const list = s[by];
  const hits = list.filter((n) => n.forum === s.forum).length;

  const toggle = (on: boolean): React.CSSProperties => ({
    fontSize: 12.5, padding: "5px 10px", borderRadius: 7, border: "none", cursor: "pointer",
    background: on ? POST : "transparent", color: on ? "var(--surface)" : "var(--muted)", fontWeight: on ? 600 : 400,
  });
  const group: React.CSSProperties = {
    display: "inline-flex", flexWrap: "wrap", gap: 3, background: "var(--surface)", border: "1px solid var(--border)",
    borderRadius: 10, padding: 3, maxWidth: "100%",
  };
  const tile: React.CSSProperties = {
    background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 10px", minWidth: 0,
  };
  const panel: React.CSSProperties = {
    margin: 0, minWidth: 0, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "9px 11px",
  };
  const cap: React.CSSProperties = { fontSize: 12, color: "var(--muted)", margin: "0 0 6px" };

  return (
    <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 14, padding: "12px 14px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px 10px", marginBottom: 8 }}>
        <span style={{ fontSize: 13, color: "var(--muted)" }}>a later new thread</span>
        <div role="radiogroup" aria-label="which post" style={group}>
          {D.specimens.map((p, i) => (
            <button key={p.post} role="radio" aria-checked={si === i} onClick={() => setSi(i)} style={toggle(si === i)}
              aria-label={`post ${i + 1}: ${p.subject}`}>
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      <figure style={{ ...panel, marginBottom: 10 }}>
        <div style={{ ...mono, fontSize: 12, color: "var(--muted)", lineHeight: 1.6, overflowWrap: "anywhere" }}>
          <div><span style={{ color: "var(--faint)" }}>Newsgroups: </span>{s.forum}</div>
          <div><span style={{ color: "var(--faint)" }}>Subject: </span><span style={{ color: "var(--ink)" }}>{s.subject}</span></div>
        </div>
        <p style={{ margin: "6px 0 0", fontSize: 13.5, lineHeight: 1.55, color: "var(--ink)", overflowWrap: "anywhere" }}>{s.text}</p>
        <figcaption style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 5 }}>{s.length} words in the router&rsquo;s view</figcaption>
      </figure>

      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px 10px", marginBottom: 8 }}>
        <div role="radiogroup" aria-label="nearest by" style={group}>
          {BY.map((b) => (
            <button key={b.key} role="radio" aria-checked={by === b.key} onClick={() => setBy(b.key)} style={toggle(by === b.key)}>
              {b.label}
            </button>
          ))}
        </div>
        <span style={{ fontSize: 12.5, color: "var(--muted)" }}>
          <span style={{ ...mono, color: "var(--ink)", fontWeight: 600 }}>{hits} of {list.length}</span> in {s.forum}
        </span>
      </div>

      <figure style={panel}>
        <figcaption style={cap}>
          the five earlier posts nearest to it, out of 11,314, by {by === "words" ? "the words they share" : "bge-large’s vectors"}
        </figcaption>
        <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {list.map((n, i) => {
            const same = n.forum === s.forum;
            return (
              <li key={i} style={{ display: "grid", gridTemplateColumns: "3.2em minmax(0, 1fr)", gap: "0 8px", padding: "6px 0", borderTop: i ? "1px solid var(--border)" : "none" }}>
                <div style={{ ...mono, fontSize: 12, color: "var(--muted)", paddingTop: 1 }}>
                  {n.sim.toFixed(2)}
                  <div style={{ height: 3, marginTop: 3, background: "var(--border)", borderRadius: 2 }}>
                    <div style={{ width: `${Math.round(100 * Math.max(0, n.sim))}%`, height: 3, background: POST, borderRadius: 2 }} />
                  </div>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "0 8px" }}>
                    <span style={{ ...mono, fontSize: 12, fontWeight: 600, color: same ? "var(--good)" : "var(--bad)" }}>
                      {same ? "✓" : "✗"} {n.forum}
                    </span>
                    <span style={{ fontSize: 13, color: "var(--ink)", overflowWrap: "anywhere" }}>{n.subject}</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 1, overflowWrap: "anywhere" }}>
                    {n.shared.length ? <>shares <span style={{ ...mono, color: "var(--muted)" }}>{n.shared.join(" · ")}</span></> : "shares no word with it beyond common ones"}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </figure>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 13em), 1fr))", gap: 8, marginTop: 10 }}>
        <div style={tile}>
          <div style={{ fontSize: 11.5, color: "var(--muted)" }}>harness new threads whose nearest earlier post is in their forum</div>
          <div style={{ ...mono, fontSize: 15, color: "var(--ink)" }}>
            words {pct(D.harness.words.forum)} · embedding {pct(D.harness.meaning.forum)}
          </div>
        </div>
        <div style={tile}>
          <div style={{ fontSize: 11.5, color: "var(--muted)" }}>senders met: nearest earlier post is their own</div>
          <div style={{ ...mono, fontSize: 15, color: "var(--ink)" }}>
            words {pct(D.harness.words.sender)} · embedding {pct(D.harness.meaning.sender)}
          </div>
        </div>
      </div>
    </div>
  );
}
