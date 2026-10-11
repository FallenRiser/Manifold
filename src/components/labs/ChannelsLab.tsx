"use client";

import { useState } from "react";
import { Printout } from "@/components/capstone/newsreader";
import rnd from "@/data/routing/channels_random.json";
import job from "@/data/routing/channels_job.json";

// The router always reads the subject and the body (the moderator's notes out). Switch on any of
// the four other parts of a post and read two measurements of that exact combination: accuracy on
// a random split (the tutorial's test, mean of five splits) and on the job, the later new threads,
// split into senders the router has met and new ones, each as a change against the audited view
// (all four off) with its 95% paired bootstrap interval. All sixteen combinations were fitted.
//
// Data: src/data/routing/channels_random.json and channels_job.json, written by
// `python scripts/routing_cases.py channels channels_job`.

type Cell = { acc: number; diff: number; lo: number; hi: number };
type Line = { part: string; text: string };
const R = rnd as { seeds: number; combos: Record<string, number> };
const J = job as {
  n: Record<string, number>;
  combos: Record<string, Record<string, Cell>>;
  specimen: { post: number; forum: string; lines: Line[] };
};

const POST = "var(--c-post)";
const mono: React.CSSProperties = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" };
const CH = [
  { key: "meta", label: "header lines", colour: "var(--nr-head)" },
  { key: "quotes", label: "quotes", colour: "var(--nr-quote)" },
  { key: "sig", label: "signature", colour: "var(--nr-sig)" },
  { key: "tail", label: "the tail", colour: "var(--nr-ink-soft)" },
] as const;
type Ch = (typeof CH)[number]["key"];
const INK: Record<string, string> = { meta: "var(--nr-head)", subject: "var(--nr-ink)", body: "var(--nr-ink)", tail: "var(--nr-ink)", quotes: "var(--nr-quote)", sig: "var(--nr-sig)" };
const GROUPS = [
  { key: "all", label: "all new threads" },
  { key: "known", label: "senders it has met" },
  { key: "new", label: "new senders" },
] as const;

const key = (on: Set<Ch>) => CH.filter((c) => on.has(c.key)).map((c) => c.key).join("+") || "none";
const WHOLE = R.combos[CH.map((c) => c.key).join("+")];
// the change axis, in points, wide enough for every interval in the data
const EXT = Math.ceil(Math.max(...Object.values(J.combos).flatMap((c) => Object.values(c).flatMap((g) => [Math.abs(g.lo), Math.abs(g.hi)]))));
const xp = (v: number) => Math.round(1000 * (v + EXT) / (2 * EXT)) / 10;
// the random-split axis
const RLO = 0.86, RHI = 0.93;
const rp = (a: number) => Math.round(1000 * Math.min(1, Math.max(0, (a - RLO) / (RHI - RLO)))) / 10;

export default function ChannelsLab() {
  const [on, setOn] = useState<Set<Ch>>(new Set());
  const k = key(on);
  const racc = R.combos[k];
  const cells = J.combos[k];
  const flip = (c: Ch) => setOn((prev) => {
    const next = new Set(prev);
    if (next.has(c)) next.delete(c);
    else next.add(c);
    return next;
  });

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px 8px", marginBottom: 10 }}>
        <span style={{ fontSize: 13, color: "var(--muted)", marginRight: 2 }}>subject and body, plus</span>
        {CH.map((c) => {
          const lit = on.has(c.key);
          return (
            <button
              key={c.key}
              aria-pressed={lit}
              onClick={() => flip(c.key)}
              style={{ fontSize: 12.5, padding: "4px 10px", borderRadius: 999, cursor: "pointer", border: `1.5px solid ${lit ? c.colour : "var(--border-strong)"}`, background: lit ? `color-mix(in srgb, ${c.colour} 14%, var(--surface))` : "var(--surface)", color: lit ? "var(--ink)" : "var(--muted)", fontWeight: lit ? 600 : 400 }}
            >
              <span aria-hidden style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: lit ? c.colour : "transparent", border: `1px solid ${c.colour}`, marginRight: 6 }} />
              {c.label}
            </button>
          );
        })}
        <span style={{ display: "inline-flex", gap: 4, marginLeft: "auto" }}>
          <button onClick={() => setOn(new Set(CH.map((c) => c.key)))} style={preset}>the whole post</button>
          <button onClick={() => setOn(new Set())} style={preset}>none</button>
        </span>
      </div>

      <Printout py={12}>
        <div style={{ ...mono, fontSize: 11.5, color: "var(--nr-faint)", marginBottom: 8 }}>
          later post {J.specimen.post.toLocaleString("en-US")} · a reply in {J.specimen.forum}
        </div>
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <pre style={{ ...mono, fontSize: 11.5, lineHeight: 1.62, margin: 0, whiteSpace: "pre", tabSize: 4, width: "max-content", background: "transparent", padding: "2px 0" }}>
            {J.specimen.lines.map((l, i) => {
              const read = l.part === "subject" || l.part === "body" || on.has(l.part as Ch);
              return (
                <div key={i} style={{ minHeight: "1.62em", paddingLeft: 8, borderLeft: l.part === "tail" ? "2px dashed var(--nr-sig)" : "2px solid transparent", color: INK[l.part] ?? "var(--nr-ink)", fontWeight: l.part === "subject" ? 700 : 400, opacity: read ? 1 : 0.24 }}>
                  {l.text || " "}
                </div>
              );
            })}
          </pre>
        </div>
      </Printout>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 10, marginTop: 12 }}>
        <section aria-label="random split" style={card}>
          <div style={cardHead}>a random split · the tutorial&rsquo;s test</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
            <strong style={{ ...mono, fontSize: 24, color: "var(--ink)" }}>{racc.toFixed(3)}</strong>
            <span style={{ fontSize: 12.5, color: "var(--muted)" }}>
              {k === key(new Set(CH.map((c) => c.key)))
                ? "the whole post"
                : `${Math.abs(100 * (racc - WHOLE)).toFixed(2)} points ${racc < WHOLE ? "below" : "above"} the whole post`}
            </span>
          </div>
          <div style={{ position: "relative", height: 14, margin: "10px 0 4px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 3 }}>
            <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${rp(racc)}%`, background: POST, borderRadius: 2 }} />
            <span aria-hidden style={{ position: "absolute", left: `${rp(WHOLE)}%`, top: -3, bottom: -3, borderLeft: "1.5px dashed var(--ink)" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", ...mono, fontSize: 10.5, color: "var(--faint)" }}>
            <span>{RLO.toFixed(2)}</span><span>dashed: the whole post</span><span>{RHI.toFixed(2)}</span>
          </div>
          <div style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 6 }}>mean of {R.seeds} random splits, 7,532 test posts each</div>
        </section>

        <section aria-label="the job" style={card}>
          <div style={cardHead}>the job · the later new threads, against the audited view</div>
          <div style={{ display: "grid", gap: 7 }}>
            {GROUPS.map((g) => {
              const c = cells[g.key];
              const settled = c.lo > 0 || c.hi < 0;
              return (
                <div key={g.key}>
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0 8px", fontSize: 12 }}>
                    <span style={{ color: "var(--ink)" }}>{g.label} <span style={{ ...mono, color: "var(--faint)" }}>{J.n[g.key].toLocaleString("en-US")}</span></span>
                    <span style={{ ...mono, color: "var(--muted)" }}>
                      {c.acc.toFixed(3)} · <strong style={{ color: settled ? "var(--ink)" : "var(--muted)" }}>{c.diff > 0 ? "+" : ""}{c.diff.toFixed(2)}</strong>
                      {k !== "none" && <span style={{ color: "var(--faint)" }}> {settled ? "settled" : "not settled"}</span>}
                    </span>
                  </div>
                  <div style={{ position: "relative", height: 14, marginTop: 2 }}>
                    <span aria-hidden style={{ position: "absolute", left: "50%", top: 0, bottom: 0, borderLeft: "1px solid var(--border-strong)" }} />
                    <span style={{ position: "absolute", top: 6, height: 2, left: `${xp(c.lo)}%`, width: `${Math.max(0.5, xp(c.hi) - xp(c.lo))}%`, background: POST, opacity: 0.55 }} />
                    <span style={{ position: "absolute", top: 3, width: 8, height: 8, marginLeft: -4, left: `${xp(c.diff)}%`, borderRadius: 999, border: `1.5px solid ${POST}`, background: settled ? POST : "var(--surface)" }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", ...mono, fontSize: 10.5, color: "var(--faint)", marginTop: 2 }}>
            <span>&minus;{EXT} points</span><span>0</span><span>+{EXT}</span>
          </div>
        </section>
      </div>
    </div>
  );
}

const preset: React.CSSProperties = { fontSize: 12, padding: "4px 9px", borderRadius: 7, cursor: "pointer", border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--muted)" };
const card: React.CSSProperties = { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "11px 13px 10px", minWidth: 0 };
const cardHead: React.CSSProperties = { fontSize: 12, color: "var(--muted)", marginBottom: 8 };
