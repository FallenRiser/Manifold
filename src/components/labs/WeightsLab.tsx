"use client";

import { useState } from "react";
import { Printout } from "@/components/capstone/newsreader";
import wt from "@/data/routing/weights.json";

// The twelve heaviest words of each forum, for the model that reads the whole post and for the
// router's view (subject + body). Each bar is coloured by the part of the post where that word
// mostly occurs across the earlier posts, and tagged when it is a private person's name (masked)
// or, in most of the posts that contain it, the sender's own name or address.
//
// Data: src/data/routing/weights.json, written by `python scripts/routing_cases.py weights`. The
// list of words that are people's names is read by hand and kept in the script (WEIGHT_PEOPLE).

type Cell = { w: string; x: number; home: string; person: boolean; one: number; own: number };
const D = wt as { forums: string[]; models: Record<string, Record<string, Cell[]>> };

const POST = "var(--c-post)";
const mono: React.CSSProperties = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" };

const PART: Record<string, { label: string; colour: string }> = {
  content: { label: "subject and body", colour: "var(--nr-accent)" },
  meta: { label: "header lines", colour: "var(--nr-head)" },
  quotes: { label: "quotes", colour: "var(--nr-quote)" },
  sig: { label: "signature", colour: "var(--nr-sig)" },
};
const MODELS = [
  { key: "whole", label: "reads the whole post" },
  { key: "router", label: "the router's view" },
] as const;
type ModelKey = (typeof MODELS)[number]["key"];

// short names so twenty forums fit on a phone
const short = (f: string) =>
  f.replace(/^comp\.sys\./, "").replace(/^comp\.os\./, "").replace(/^comp\./, "").replace(/^rec\.sport\./, "")
    .replace(/^rec\./, "").replace(/^sci\./, "").replace(/^talk\.politics\./, "politics.").replace(/^talk\./, "")
    .replace(/^soc\.religion\./, "").replace(/^alt\./, "").replace(/^misc\./, "");

export default function WeightsLab() {
  const [f, setF] = useState(D.forums[0]);
  const [mk, setMk] = useState<ModelKey>("whole");
  const cells = D.models[mk][f];
  const max = Math.max(...D.models.whole[f].map((c) => c.x), ...D.models.router[f].map((c) => c.x));
  const flagged = cells.filter((c) => c.person || c.home !== "content").length;

  return (
    <div>
      <div role="radiogroup" aria-label="forum" style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
        {D.forums.map((x) => {
          const on = x === f;
          return (
            <button
              key={x}
              role="radio"
              aria-checked={on}
              title={x}
              onClick={() => setF(x)}
              style={{ ...mono, fontSize: 11.5, padding: "3px 8px", borderRadius: 6, cursor: "pointer", border: `1px solid ${on ? POST : "var(--border)"}`, background: on ? POST : "var(--surface)", color: on ? "var(--surface)" : "var(--muted)", fontWeight: on ? 600 : 400 }}
            >
              {short(x)}
            </button>
          );
        })}
      </div>
      <div role="radiogroup" aria-label="model" style={{ display: "inline-flex", flexWrap: "wrap", gap: 4, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10, padding: 3, marginBottom: 12 }}>
        {MODELS.map((m) => {
          const on = m.key === mk;
          return (
            <button key={m.key} role="radio" aria-checked={on} onClick={() => setMk(m.key)}
              style={{ fontSize: 12.5, padding: "5px 10px", borderRadius: 7, border: "none", cursor: "pointer", background: on ? POST : "transparent", color: on ? "var(--surface)" : "var(--muted)", fontWeight: on ? 600 : 400 }}>
              the model that {m.key === "whole" ? "reads the whole post" : "reads the router's view"}
            </button>
          );
        })}
      </div>

      <Printout py={12}>
        <div style={{ ...mono, fontSize: 11.5, color: "var(--nr-faint)", marginBottom: 8 }}>
          {f} · the twelve heaviest words
        </div>
        <div style={{ display: "grid", gap: 4 }}>
          {cells.map((c, i) => {
            const p = PART[c.home];
            return (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "minmax(64px, 104px) minmax(0, 1fr)", gap: 8, alignItems: "center" }}>
                <span style={{ ...mono, fontSize: 12, color: "var(--nr-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.w}</span>
                <span style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "2px 8px", minWidth: 0 }}>
                  <span style={{ display: "inline-block", height: 10, width: `${Math.round(700 * c.x / max) / 10}%`, minWidth: 4, background: p.colour, borderRadius: 2 }} />
                  {c.person && <Tag colour="var(--nr-pen)">a person</Tag>}
                  {c.own > 0.5 && <Tag colour="var(--nr-pen)">mostly the sender&rsquo;s own</Tag>}
                </span>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", marginTop: 12, paddingTop: 8, borderTop: "1px solid var(--nr-rule)" }}>
          {Object.entries(PART).map(([k, p]) => (
            <span key={k} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, color: "var(--nr-ink-soft)" }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: p.colour }} />
              mostly in the {p.label}
            </span>
          ))}
        </div>
      </Printout>
      <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 8 }}>
        <strong style={{ ...mono, color: "var(--ink)" }}>{flagged}</strong> of these twelve name a person or live
        mostly outside the subject and body.
      </div>
    </div>
  );
}

function Tag({ colour, children }: { colour: string; children: React.ReactNode }) {
  return (
    <span style={{ ...mono, fontSize: 10, color: colour, border: `1px solid ${colour}`, borderRadius: 4, padding: "0 4px", whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}
