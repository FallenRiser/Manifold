"use client";

import { useState } from "react";
import mr from "@/data/routing/misroutes.json";
import rd from "@/data/routing/misread.json";

// The router's mistakes, two ways (the page shows each on its own with `only`). "Where they land" counts every
// misroute by the family it was posted in and the family it was routed to (or, for one forum, by the forum it
// went to), on the harness or the later new threads. "Forty, read by hand" steps through a random sample of the
// harness's misroutes as the router saw them, each with the label it was given before counting.
//
// Data: src/data/routing/misroutes.json and misread.json, written by
// `python scripts/routing_cases.py misroutes read_errors`.

type Set = {
  n: number; right: number; wrong: number; infam: [number, number, number]; chance: number;
  forums: { n: number; to: number[] }[]; rank: [number, number, number]; top3: number;
};
const M = mr as unknown as { names: string[]; families: [string, string, number[]][]; harness: Set; later: Set };
type Label = "either" | "missed" | "better" | "none" | "cut";
type Read = {
  post: number; forum: string; routed: string; rank: number; gap: number; label: Label; sale: boolean;
  subject: string; text: string; same: boolean;
};
const RD = rd as unknown as { n: number; of: number; seed: number; posts: Read[] };

const POST = "var(--c-post)";
const mono: React.CSSProperties = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" };
const pct = (v: number) => `${(100 * v).toFixed(1)}%`;

const SHORT: Record<string, string> = { comp: "comp", rec: "rec", sci: "sci", politics: "politics", religion: "religion", "misc.forsale": "forsale" };
// column heads must fit a sixth of a phone-width panel
const HEAD: Record<string, string> = { comp: "comp", rec: "rec", sci: "sci", politics: "pol.", religion: "rel.", "misc.forsale": "sale" };
const famOf = (k: number) => M.families.findIndex((f) => f[2].includes(k));

const LABELS: { key: Label; label: string; color: string }[] = [
  { key: "either", label: "fits both forums", color: POST },
  { key: "missed", label: "the router missed", color: "var(--bad)" },
  { key: "better", label: "fits the router’s forum better", color: "var(--c-space)" },
  { key: "none", label: "too little, or no forum fits", color: "var(--muted)" },
  { key: "cut", label: "the cleaning cut the words", color: "var(--warn)" },
];
const LC = Object.fromEntries(LABELS.map((l) => [l.key, l])) as Record<Label, (typeof LABELS)[number]>;
// the forty, grouped by label in the order above, then by post number
const ORDER = [...RD.posts].sort((a, b) => LABELS.findIndex((l) => l.key === a.label) - LABELS.findIndex((l) => l.key === b.label) || a.post - b.post);
const nth = (r: number) => (r === 2 ? "2nd" : r === 3 ? "3rd" : `${r}th`);

export default function MisrouteLab({ only }: { only?: "land" | "read" }) {
  const [tab, setView] = useState<"land" | "read">("land");
  const view = only ?? tab;
  const [set, setSet] = useState<"harness" | "later">("harness");
  const [forum, setForum] = useState(-1);
  const [filter, setFilter] = useState<Label | "all">("all");
  const [at, setAt] = useState(0);

  const S = M[set];
  const toggle = (on: boolean): React.CSSProperties => ({
    fontSize: 12.5, padding: "5px 10px", borderRadius: 7, border: "none", cursor: "pointer",
    background: on ? POST : "transparent", color: on ? "var(--surface)" : "var(--muted)", fontWeight: on ? 600 : 400,
  });
  const group: React.CSSProperties = {
    display: "inline-flex", flexWrap: "wrap", gap: 3, background: "var(--surface)", border: "1px solid var(--border)",
    borderRadius: 10, padding: 3, maxWidth: "100%",
  };
  const tile: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 10px", minWidth: 0 };
  const panel: React.CSSProperties = { margin: 0, minWidth: 0, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "9px 11px" };
  const cap: React.CSSProperties = { fontSize: 12, color: "var(--muted)", margin: "0 0 7px" };

  // family x family counts of misroutes (posted in the row's family, routed to the column's)
  const F = M.families.length;
  const grid = Array.from({ length: F }, () => new Array(F).fill(0));
  S.forums.forEach((f, k) => f.to.forEach((c, j) => { grid[famOf(k)][famOf(j)] += c; }));
  const cmax = Math.max(...grid.flat());

  const list = filter === "all" ? ORDER : ORDER.filter((p) => p.label === filter);
  const cur = list[Math.min(at, list.length - 1)];
  const pick = (f: Label | "all") => { setFilter(f); setAt(0); };

  return (
    <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 14, padding: "12px 14px" }}>
      {!only && (
        <div role="tablist" aria-label="view" style={{ ...group, marginBottom: 10 }}>
          <button role="tab" aria-selected={view === "land"} onClick={() => setView("land")} style={toggle(view === "land")}>where they land</button>
          <button role="tab" aria-selected={view === "read"} onClick={() => setView("read")} style={toggle(view === "read")}>forty, read by hand</button>
        </div>
      )}

      {view === "land" ? (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px 10px", marginBottom: 8 }}>
            <div role="radiogroup" aria-label="which new threads" style={group}>
              <button role="radio" aria-checked={set === "harness"} onClick={() => setSet("harness")} style={toggle(set === "harness")}>harness</button>
              <button role="radio" aria-checked={set === "later"} onClick={() => setSet("later")} style={toggle(set === "later")}>later new threads</button>
            </div>
            <label style={{ fontSize: 13, color: "var(--muted)", display: "inline-flex", alignItems: "center", gap: 6, maxWidth: "100%" }}>
              posted in
              <select value={forum} onChange={(e) => setForum(Number(e.target.value))}
                style={{ fontSize: 13, padding: "4px 6px", borderRadius: 7, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--ink)", maxWidth: "100%", minWidth: 0 }}>
                <option value={-1}>every forum, by family</option>
                {M.families.map(([f, lbl, ks]) => (
                  <optgroup key={f} label={lbl}>
                    {ks.map((k) => <option key={k} value={k}>{M.names[k]}</option>)}
                  </optgroup>
                ))}
              </select>
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 8.5em), 1fr))", gap: 8, marginBottom: 10 }}>
            <div style={tile}>
              <div style={{ fontSize: 11.5, color: "var(--muted)" }}>misrouted</div>
              <div style={{ ...mono, fontSize: 16, color: "var(--ink)" }}>{S.wrong} <span style={{ fontSize: 12, color: "var(--faint)" }}>of {S.n.toLocaleString("en-US")}</span></div>
            </div>
            <div style={tile}>
              <div style={{ fontSize: 11.5, color: "var(--muted)" }}>in their own family</div>
              <div style={{ ...mono, fontSize: 16, color: "var(--ink)" }}>{pct(S.infam[0])}</div>
              <div style={{ ...mono, fontSize: 11, color: "var(--faint)" }}>{pct(S.infam[1])} to {pct(S.infam[2])}</div>
            </div>
            <div style={tile}>
              <div style={{ fontSize: 11.5, color: "var(--muted)" }}>if they fell at random</div>
              <div style={{ ...mono, fontSize: 16, color: "var(--ink)" }}>{pct(S.chance)}</div>
            </div>
            <div style={tile}>
              <div style={{ fontSize: 11.5, color: "var(--muted)" }}>right forum in the top three</div>
              <div style={{ ...mono, fontSize: 16, color: "var(--ink)" }}>{pct(S.rank[1])}</div>
              <div style={{ fontSize: 11, color: "var(--faint)" }}>of the misroutes</div>
            </div>
          </div>

          {forum < 0 ? (
            <figure style={panel}>
              <figcaption style={cap}>misroutes by the family a post was posted in (rows) and the family it was routed to (columns); the diagonal stays in the family</figcaption>
              <div style={{ display: "grid", gridTemplateColumns: `minmax(4.6em, 1fr) repeat(${F}, minmax(0, 1fr))`, gap: 3, ...mono, fontSize: 12 }}>
                <div />
                {M.families.map(([f, lbl]) => (
                  <div key={f} title={lbl} style={{ textAlign: "center", fontSize: 10.5, color: "var(--faint)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{HEAD[f]}</div>
                ))}
                {M.families.map(([f], i) => (
                  <div key={f} style={{ display: "contents" }}>
                    <div style={{ color: "var(--muted)", fontSize: 11.5, alignSelf: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{SHORT[f]}</div>
                    {grid[i].map((c, j) => {
                      const a = c ? 0.12 + 0.78 * Math.sqrt(c / cmax) : 0;
                      const diag = i === j && M.families[i][2].length > 1; // misc.forsale has no family to stay in
                      return (
                        <div key={j} title={`${M.families[i][1]} → ${M.families[j][1]}: ${c}`}
                          style={{ position: "relative", height: 30, borderRadius: 5, border: diag ? `1.5px solid ${POST}` : "1px solid var(--border)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <div style={{ position: "absolute", inset: 0, background: diag ? POST : "var(--ink)", opacity: diag ? a : a * 0.55 }} />
                          <span style={{ position: "relative", color: a > 0.55 ? "var(--surface)" : c ? "var(--ink)" : "var(--faint)", fontWeight: diag ? 700 : 400 }}>{i === j && !diag ? "–" : c || "·"}</span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 11.5, color: "var(--faint)", margin: "7px 0 0" }}>misc.forsale is a family of one: none of its misroutes, in or out, can stay in a family.</p>
            </figure>
          ) : (
            <ForumBars set={S} k={forum} />
          )}
        </>
      ) : (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }} role="radiogroup" aria-label="label">
            {[{ key: "all" as const, label: `all ${RD.n}`, color: "var(--ink)" }, ...LABELS].map((l) => {
              const on = filter === l.key;
              const n = l.key === "all" ? RD.n : RD.posts.filter((p) => p.label === l.key).length;
              return (
                <button key={l.key} role="radio" aria-checked={on} onClick={() => pick(l.key)}
                  style={{ fontSize: 12, padding: "4px 9px", borderRadius: 999, cursor: "pointer", border: `1px solid ${on ? l.color : "var(--border)"}`, background: on ? "var(--surface)" : "transparent", color: on ? "var(--ink)" : "var(--muted)", fontWeight: on ? 600 : 400 }}>
                  <span aria-hidden style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: l.color, marginRight: 6, verticalAlign: "middle" }} />
                  {l.key === "all" ? l.label : `${l.label} · ${n}`}
                </button>
              );
            })}
          </div>

          <div aria-label="the forty, by label" style={{ display: "flex", flexWrap: "wrap", gap: 3, marginBottom: 10 }}>
            {ORDER.map((p) => {
              const inList = filter === "all" || p.label === filter;
              const sel = cur && p.post === cur.post;
              return (
                <button key={p.post} aria-label={`post ${p.post}: ${LC[p.label].label}`} onClick={() => { const l = filter === "all" || p.label === filter ? list : ORDER; if (l === ORDER) setFilter("all"); setAt(l.indexOf(p)); }}
                  style={{ width: 14, height: 14, padding: 0, borderRadius: 3, cursor: "pointer", background: LC[p.label].color, opacity: inList ? 1 : 0.25, border: sel ? "2px solid var(--ink)" : "1px solid var(--surface)" }} />
              );
            })}
          </div>

          {cur && (
            <figure style={panel}>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px 10px", marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", border: `1px solid ${LC[cur.label].color}`, borderRadius: 999, padding: "1px 8px" }}>{LC[cur.label].label}</span>
                {cur.sale && <span style={{ fontSize: 11.5, color: "var(--muted)", border: "1px solid var(--border)", borderRadius: 999, padding: "1px 7px" }}>sale or wanted ad</span>}
                <span style={{ ...mono, fontSize: 11.5, color: "var(--faint)", marginLeft: "auto" }}>{Math.min(at, list.length - 1) + 1} of {list.length}</span>
              </div>
              <div style={{ ...mono, fontSize: 12, color: "var(--muted)", lineHeight: 1.6, overflowWrap: "anywhere" }}>
                <div><span style={{ color: "var(--faint)" }}>posted in: </span><span style={{ color: "var(--good)" }}>{cur.forum}</span></div>
                <div><span style={{ color: "var(--faint)" }}>routed to: </span><span style={{ color: "var(--bad)" }}>{cur.routed}</span>{" "}
                  <span style={{ color: "var(--faint)" }}>({cur.same ? "same family" : "another family"})</span></div>
                <div><span style={{ color: "var(--faint)" }}>Subject: </span><span style={{ color: "var(--ink)" }}>{cur.subject}</span></div>
              </div>
              <p style={{ margin: "6px 0 0", fontSize: 13.5, lineHeight: 1.55, color: "var(--ink)", overflowWrap: "anywhere" }}>{cur.text || <em style={{ color: "var(--faint)" }}>(nothing below the subject)</em>}</p>
              <figcaption style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 6 }}>
                the router ranked the forum it was posted in {nth(cur.rank)}; its gap between the top two scores was {cur.gap.toFixed(2)}
              </figcaption>
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                <button onClick={() => setAt((a) => (Math.min(a, list.length - 1) - 1 + list.length) % list.length)} style={{ ...toggle(false), border: "1px solid var(--border)" }} aria-label="previous post">← previous</button>
                <button onClick={() => setAt((a) => (Math.min(a, list.length - 1) + 1) % list.length)} style={{ ...toggle(false), border: "1px solid var(--border)" }} aria-label="next post">next →</button>
              </div>
            </figure>
          )}
          <p style={{ fontSize: 11.5, color: "var(--faint)", margin: "8px 0 0" }}>
            {RD.n} of the harness&rsquo;s {RD.of} misroutes, drawn at random; the text is what the router read, its first words, with names and addresses dotted out.
          </p>
        </>
      )}
    </div>
  );
}

function ForumBars({ set, k }: { set: Set; k: number }) {
  const f = set.forums[k];
  const wrong = f.to.reduce((a, b) => a + b, 0);
  const fam = famOf(k);
  const rows = f.to.map((c, j) => ({ j, c })).filter((r) => r.c > 0).sort((a, b) => b.c - a.c || a.j - b.j);
  const inFam = rows.filter((r) => famOf(r.j) === fam).reduce((a, r) => a + r.c, 0);
  const max = Math.max(1, ...rows.map((r) => r.c));
  const size = M.families[fam][2].length;
  return (
    <figure style={{ margin: 0, minWidth: 0, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "9px 11px" }}>
      <figcaption style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 7px" }}>
        <span style={{ ...mono, color: "var(--ink)" }}>{M.names[k]}</span>: {f.n} new threads, {pct(1 - wrong / f.n)} routed right; where its {wrong} misroutes went
      </figcaption>
      {rows.length === 0 && <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>none misrouted</p>}
      {rows.map((r) => {
        const same = famOf(r.j) === fam;
        return (
          <div key={r.j} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "1px 8px", padding: "2px 0" }}>
            {/* the name keeps its width; the bar takes the rest, or drops below it when the row is too narrow */}
            <span style={{ ...mono, fontSize: 12, color: same ? "var(--ink)" : "var(--muted)", flex: "0 0 15em", maxWidth: "100%", overflowWrap: "anywhere" }}>{M.names[r.j]}</span>
            <div style={{ flex: "1 1 5em", minWidth: "5em", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1, height: 10, background: "var(--border)", borderRadius: 3 }}>
                <div style={{ width: `${(100 * r.c) / max}%`, height: 10, borderRadius: 3, background: same ? "var(--c-post)" : "var(--faint)" }} />
              </div>
              <span style={{ ...mono, fontSize: 12, color: "var(--ink)", minWidth: "2.2em", textAlign: "right" }}>{r.c}</span>
            </div>
          </div>
        );
      })}
      {wrong > 0 && (
        <p style={{ fontSize: 12, color: "var(--muted)", margin: "8px 0 0" }}>
          in its family (bars in colour): <span style={{ ...mono, color: "var(--ink)" }}>{inFam} of {wrong}</span>
          {size > 1 ? <>; at random, {size - 1} of 19 forums would be</> : <>; misc.forsale has no family</>}
        </p>
      )}
    </figure>
  );
}
