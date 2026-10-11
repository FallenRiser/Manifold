"use client";

import { useState } from "react";
import ld from "@/data/routing/ladder.json";

// Act 5 on one chart. Every rung, chosen fold by fold on the harness's new threads, as a dot with its 95%
// interval: the single models of pages 14 to 17, the two paths of pages 18 and 19 (naive Bayes and the SVM,
// each reading more and then adding the history and the embedding), and the two full models together. Switch
// between all new threads, senders the router has met, and new senders.
//
// Data: src/data/routing/ladder.json, written by `python scripts/routing_cases.py act5_ladder`.

type G = "all" | "met" | "new";
type Rung = { key: string; label: string; page: number; path: "nb" | "svm" | "other" | "both" } & Record<G, [number, number, number]>;
const D = ld as unknown as { n: number; met: number; rungs: Rung[] };

const POST = "var(--c-post)";
const mono: React.CSSProperties = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" };
const COLOR: Record<Rung["path"], string> = { nb: POST, svm: "var(--c-metrics)", other: "var(--muted)", both: "var(--ink)" };

const GROUPS: { key: G; label: string }[] = [
  { key: "all", label: "all new threads" },
  { key: "met", label: "senders met" },
  { key: "new", label: "new senders" },
];
const SECTIONS: { title: string; keys: string[] }[] = [
  { title: "one model, the words (pages 14–17)", keys: ["nb", "lr", "svm", "rbf", "knn", "forest", "boost"] },
  { title: "naive Bayes, reading more (pages 18–19)", keys: ["nb4", "nbh", "nbe"] },
  { title: "the SVM, reading more (pages 18–19)", keys: ["svm4", "svmh", "svme"] },
  { title: "the two full models together (this page)", keys: ["both"] },
];

const all = D.rungs.flatMap((r) => GROUPS.flatMap((g) => [r[g.key][1], r[g.key][2]]));
const XMIN = Math.floor(Math.min(...all) * 20) / 20;
const XMAX = Math.ceil(Math.max(...all) * 20) / 20;
const TICKS = Array.from({ length: Math.round((XMAX - XMIN) / 0.05) + 1 }, (_, i) => Math.round((XMIN + 0.05 * i) * 100) / 100);
const pos = (v: number) => `${(Math.round(((v - XMIN) / (XMAX - XMIN)) * 10000) / 100).toFixed(2)}%`;
const byKey = Object.fromEntries(D.rungs.map((r) => [r.key, r]));
const pts = (v: number) => `${v >= 0 ? "+" : "−"}${Math.abs(100 * v).toFixed(1)}`;

export default function LadderLab() {
  const [g, setG] = useState<G>("all");
  const bar = byKey["nb"][g][0];
  const best = byKey["both"][g][0];

  const toggle = (on: boolean): React.CSSProperties => ({
    fontSize: 12.5, padding: "5px 10px", borderRadius: 7, border: "none", cursor: "pointer",
    background: on ? POST : "transparent", color: on ? "var(--surface)" : "var(--muted)", fontWeight: on ? 600 : 400,
  });
  const group: React.CSSProperties = {
    display: "inline-flex", flexWrap: "wrap", gap: 3, background: "var(--surface)", border: "1px solid var(--border)",
    borderRadius: 10, padding: 3, maxWidth: "100%",
  };
  const row: React.CSSProperties = { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "1px 10px", padding: "3px 0" };
  const labelCol: React.CSSProperties = { flex: "1 1 15em", minWidth: 0, fontSize: 13, color: "var(--ink)", lineHeight: 1.35 };
  const trackCol: React.CSSProperties = { flex: "3 1 13em", minWidth: "10em", position: "relative", height: 18 };
  const valueCol: React.CSSProperties = { ...mono, flex: "0 0 7.6em", fontSize: 12, color: "var(--muted)", whiteSpace: "nowrap" };

  return (
    <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 14, padding: "12px 14px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px 10px", marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: "var(--muted)" }}>share routed right, for</span>
        <div role="radiogroup" aria-label="which new threads" style={group}>
          {GROUPS.map((x) => (
            <button key={x.key} role="radio" aria-checked={g === x.key} onClick={() => setG(x.key)} style={toggle(g === x.key)}>
              {x.label}
            </button>
          ))}
        </div>
      </div>
      <p style={{ margin: "0 0 8px", fontSize: 12, color: "var(--faint)" }}>
        {g === "all" ? D.n.toLocaleString("en-US") : g === "met" ? D.met.toLocaleString("en-US") : (D.n - D.met).toLocaleString("en-US")} harness
        new threads; dots are each rung chosen fold by fold, bars its 95% interval, the dashed line the bar of page 14.
      </p>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 11px 6px" }}>
        {SECTIONS.map((s) => (
          <div key={s.title} style={{ marginBottom: 6 }}>
            <div style={{ fontSize: 11.5, color: "var(--faint)", margin: "4px 0 1px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.title}</div>
            {s.keys.map((k) => {
              const r = byKey[k];
              const [v, lo, hi] = r[g];
              const c = COLOR[r.path];
              return (
                <div key={k} style={row}>
                  <div style={labelCol}>{r.label}</div>
                  <div style={trackCol} role="img" aria-label={`${r.label}: ${v.toFixed(3)}, interval ${lo.toFixed(3)} to ${hi.toFixed(3)}`}>
                    <div style={{ position: "absolute", left: 0, right: 0, top: 9, height: 1, background: "var(--border)" }} />
                    <div style={{ position: "absolute", left: pos(bar), top: 1, bottom: 1, borderLeft: "1px dashed var(--faint)" }} />
                    <div style={{ position: "absolute", left: pos(lo), width: `calc(${pos(hi)} - ${pos(lo)})`, top: 7, height: 4, borderRadius: 2, background: c, opacity: 0.35 }} />
                    <div style={{ position: "absolute", left: `calc(${pos(v)} - 5px)`, top: 4, width: 10, height: 10, borderRadius: 5, background: c, border: "1.5px solid var(--surface)" }} />
                  </div>
                  <div style={valueCol}>
                    <span style={{ color: "var(--ink)" }}>{v.toFixed(3)}</span>{" "}
                    {k !== "nb" && <span style={{ color: v >= bar ? "var(--good)" : "var(--bad)" }}>{pts(v - bar)}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div style={{ ...row, paddingTop: 0 }}>
          <div style={{ ...labelCol, height: 0 }} />
          <div style={{ ...trackCol, height: 14 }} aria-hidden>
            {TICKS.map((t, i) => (
              <span key={t} style={{ position: "absolute", left: pos(t), transform: i === 0 ? "none" : i === TICKS.length - 1 ? "translateX(-100%)" : "translateX(-50%)", fontSize: 10.5, color: "var(--faint)", ...mono }}>
                {t.toFixed(2)}
              </span>
            ))}
          </div>
          <div style={{ ...valueCol, height: 0 }} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 12em), 1fr))", gap: 8, marginTop: 10 }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 10px" }}>
          <div style={{ fontSize: 11.5, color: "var(--muted)" }}>the bar of page 14</div>
          <div style={{ ...mono, fontSize: 17, color: "var(--ink)" }}>{bar.toFixed(3)}</div>
        </div>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 10px" }}>
          <div style={{ fontSize: 11.5, color: "var(--muted)" }}>naive Bayes, full, against it</div>
          <div style={{ ...mono, fontSize: 17, color: "var(--ink)" }}>{pts(byKey["nbe"][g][0] - bar)} points</div>
        </div>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 10px" }}>
          <div style={{ fontSize: 11.5, color: "var(--muted)" }}>both full models, against it</div>
          <div style={{ ...mono, fontSize: 17, color: "var(--ink)" }}>{pts(best - bar)} points</div>
        </div>
      </div>
    </div>
  );
}
