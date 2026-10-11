"use client";

import { useState } from "react";
import rt from "@/data/routing/reuters.json";

// Ninety topics on 1987 newswire (Reuters-21578, the ModApte split). Each topic is its own yes-or-no decision; every
// dot is one topic, placed by how many training stories it has and the F1 it reaches on the later test stories. Pick
// how the decisions are made: one SVM per topic at its default threshold, weighted, with thresholds set on training
// folds, the rule an editor would write (the topic's name is in the story), or per topic whichever of the last two
// did better on the training folds. Pick a topic to follow it.
//
// Data: src/data/routing/reuters.json, written by `python scripts/routing_cases.py reuters_tags`.

type Topic = { name: string; train: number; test: number; rule: boolean; f1: number[] };
const D = rt as unknown as { methods: string[]; micro: number[]; topics: Topic[] };

const POST = "var(--c-post)";
const RULE = "var(--warn)";
const mono: React.CSSProperties = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" };
const r1 = (v: number) => Math.round(v * 10) / 10;
const LABELS = ["as fitted", "balanced weights", "thresholds from folds", "the name rule", "model or rule, per topic"];
const BANDS: [number, number][] = [[1, 5], [6, 20], [21, 100], [101, 1e6]];
const BYNAME = [...D.topics].sort((a, b) => a.name.localeCompare(b.name));
const START = D.topics.findIndex((t) => t.name === "platinum");
const SMALL = D.topics.map((t, i) => (t.train <= 5 ? i : -1)).filter((i) => i >= 0);

const PW = 600, PH = 250, L = 40, R = 14, T = 12, B = 32;
const X0 = 1, X1 = 3000;
const px = (n: number) => r1(L + (Math.log(n / X0) / Math.log(X1 / X0)) * (PW - L - R));
const py = (v: number) => r1(T + (1 - v) * (PH - T - B));
// a fixed sideways nudge per topic, so topics with equal counts and equal F1 do not hide each other
const jitter = (i: number) => r1(((i * 37) % 11) - 5) * 0.9;

export default function TopicTailLab() {
  const [m, setM] = useState(0);
  const [sel, setSel] = useState(START);
  const t = D.topics[sel];
  const f = D.topics.map((x) => x.f1[m]);
  const macro = f.reduce((a, b) => a + b, 0) / f.length;
  const zero = f.filter((v) => v === 0).length;
  const band = (lo: number, hi: number) => D.topics.map((x, i) => [x, i] as const).filter(([x]) => x.train >= lo && x.train <= hi);

  const chip = (on: boolean): React.CSSProperties => ({
    fontSize: 12, padding: "4px 9px", borderRadius: 999, cursor: "pointer", border: `1px solid ${on ? POST : "var(--border)"}`,
    background: on ? "var(--surface)" : "transparent", color: on ? "var(--ink)" : "var(--muted)", fontWeight: on ? 600 : 400,
  });
  const tile: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 10px", minWidth: 0 };

  return (
    <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 14, padding: "12px 14px" }}>
      <div role="group" aria-label="how each topic decides" style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
        {LABELS.map((l, i) => <button key={l} onClick={() => setM(i)} style={chip(i === m)}>{l}</button>)}
      </div>

      <figure style={{ margin: "0 0 10px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 8px 6px" }}>
        <figcaption style={{ fontSize: 12, color: "var(--ink)", marginBottom: 2 }}>
          each topic&rsquo;s F1 on the later stories, against its training stories
        </figcaption>
        <svg viewBox={`0 0 ${PW} ${PH}`} role="img" aria-label={`F1 of the 90 topics against their training stories: ${LABELS[m]}`}
          style={{ width: "100%", height: "auto", display: "block" }}>
          {[0, 0.25, 0.5, 0.75, 1].map((v) => (
            <g key={v}>
              <line x1={L} x2={PW - R} y1={py(v)} y2={py(v)} stroke="var(--border)" strokeWidth={1} />
              <text x={L - 6} y={py(v) + 3.5} fontSize={10.5} textAnchor="end" fill="var(--faint)">{v.toFixed(2)}</text>
            </g>
          ))}
          {[1, 3, 10, 30, 100, 300, 1000, 3000].map((v) => (
            <text key={v} x={px(v)} y={PH - 12} fontSize={10.5} textAnchor="middle" fill="var(--faint)">{v.toLocaleString("en-US")}</text>
          ))}
          {BANDS.map(([lo, hi]) => {
            const xs = band(lo, hi);
            const mean = xs.reduce((a, [, i]) => a + f[i], 0) / xs.length;
            return (
              <line key={lo} x1={px(Math.max(lo, X0))} x2={px(Math.min(hi, X1))} y1={py(mean)} y2={py(mean)}
                stroke="var(--ink)" strokeWidth={2} strokeDasharray="6 3" opacity={0.7} />
            );
          })}
          {D.topics.map((x, i) => (
            <circle key={x.name} cx={r1(px(x.train) + jitter(i))} cy={py(x.f1[m])} r={i === sel ? 6 : 3.6}
              fill={m === 4 && x.rule ? RULE : POST} opacity={i === sel ? 1 : 0.7}
              stroke={i === sel ? "var(--ink)" : "none"} strokeWidth={1.5}
              onClick={() => setSel(i)} style={{ cursor: "pointer" }}>
              <title>{`${x.name}: ${x.train} training stories, F1 ${x.f1[m].toFixed(2)}`}</title>
            </circle>
          ))}
        </svg>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 12px", fontSize: 11.5, color: "var(--muted)", padding: "0 4px" }}>
          <span><span aria-hidden style={{ display: "inline-block", width: 9, height: 9, borderRadius: 99, background: POST, marginRight: 5 }} />a topic</span>
          {m === 4 && <span><span aria-hidden style={{ display: "inline-block", width: 9, height: 9, borderRadius: 99, background: RULE, marginRight: 5 }} />a topic run by the name rule</span>}
          <span><span aria-hidden style={{ display: "inline-block", width: 14, borderTop: "2px dashed var(--ink)", verticalAlign: "3px", marginRight: 5 }} />mean F1 of the topics in that range</span>
          <span style={{ color: "var(--faint)" }}>x: training stories (log scale)</span>
        </div>
      </figure>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 9em), 1fr))", gap: 8, marginBottom: 10 }}>
        <div style={tile}>
          <div style={{ fontSize: 11.5, color: "var(--muted)" }}>micro-F1</div>
          <div style={{ ...mono, fontSize: 17, color: "var(--ink)" }}>{D.micro[m].toFixed(4)}</div>
          <div style={{ fontSize: 11.5, color: "var(--faint)" }}>every decision pooled</div>
        </div>
        <div style={tile}>
          <div style={{ fontSize: 11.5, color: "var(--muted)" }}>macro-F1</div>
          <div style={{ ...mono, fontSize: 17, color: "var(--ink)" }}>{macro.toFixed(4)}</div>
          <div style={{ fontSize: 11.5, color: "var(--faint)" }}>each topic counted once</div>
        </div>
        <div style={tile}>
          <div style={{ fontSize: 11.5, color: "var(--muted)" }}>topics never right</div>
          <div style={{ ...mono, fontSize: 17, color: zero > 20 ? "var(--bad)" : "var(--ink)" }}>{zero}</div>
          <div style={{ fontSize: 11.5, color: "var(--faint)" }}>F1 of 0, of 90</div>
        </div>
        <div style={tile}>
          <div style={{ fontSize: 11.5, color: "var(--muted)" }}>the {SMALL.length} smallest topics</div>
          <div style={{ ...mono, fontSize: 17, color: "var(--ink)" }}>{(SMALL.reduce((a, i) => a + f[i], 0) / SMALL.length).toFixed(3)}</div>
          <div style={{ fontSize: 11.5, color: "var(--faint)" }}>mean F1, 5 stories or fewer</div>
        </div>
      </div>

      <div style={{ ...tile, display: "grid", gap: 6 }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px 10px" }}>
          <label htmlFor="topic-pick" style={{ fontSize: 12.5, color: "var(--muted)" }}>follow a topic</label>
          <select id="topic-pick" value={sel} onChange={(e) => setSel(Number(e.target.value))}
            style={{ fontSize: 13, padding: "3px 6px", borderRadius: 6, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--ink)" }}>
            {BYNAME.map((x) => <option key={x.name} value={D.topics.indexOf(x)}>{x.name}</option>)}
          </select>
          <span style={{ fontSize: 12, color: "var(--faint)" }}>
            {t.train} training {t.train === 1 ? "story" : "stories"}, {t.test} later {t.test === 1 ? "story" : "stories"}
            {t.rule ? "; the folds pick the name rule" : "; the folds pick the model"}
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 7.5em), 1fr))", gap: 6 }}>
          {LABELS.map((l, i) => (
            <div key={l} style={{ fontSize: 11.5, color: i === m ? "var(--ink)" : "var(--muted)", fontWeight: i === m ? 600 : 400 }}>
              {l}<span style={{ ...mono, display: "block", fontSize: 14, color: "var(--ink)" }}>{t.f1[i].toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
