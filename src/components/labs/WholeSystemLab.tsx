"use client";

import { useState } from "react";
import sy from "@/data/routing/system.json";

// The whole system on next month's 7,532 posts. Replies to a thread the system knows go where the thread lives
// (the lookup); the router reads the new threads and the first reply of each thread whose opener is missing, files
// those whose gap reaches the threshold and hands the rest to a person. Every other reply follows its thread, so a
// misfiled opener takes its replies with it. Drag the threshold: where every post ends up, and what each post a
// person reads buys in wrong placements avoided.
//
// Data: src/data/routing/system.json, written by `python scripts/routing_cases.py system`.

const D = sy as unknown as {
  posts: number; threshold: number; grid: (number | null)[]; router: { new: number; orphans: number };
  look: number[]; look_right: number[]; two: number[]; follow: number[];
  filed: number[]; filed_right: number[]; person: number[];
};

const POST = "var(--c-post)";
const mono: React.CSSProperties = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" };
const N = D.grid.length;
const AT = D.grid.findIndex((g) => g === D.threshold);
const LAST = N - 1; // no threshold: a person reads every post the router would read
const r1 = (v: number) => Math.round(v * 10) / 10;
const pct = (v: number, d = 1) => `${(100 * v).toFixed(d)}%`;
const fmt = (v: number) => v.toLocaleString("en-US");

// each post's fate at grid point i
const parts = (i: number) => {
  const misfiled = D.filed[i] - D.filed_right[i];
  return [
    { key: "look", label: "filed by the lookup, right", n: D.look_right[i], fill: `color-mix(in srgb, ${POST} 38%, var(--surface))` },
    { key: "router", label: "filed by the router, right", n: D.filed_right[i], fill: POST },
    { key: "person", label: "read by a person", n: D.person[i], fill: "var(--surface)", hatch: true },
    { key: "mis", label: "wrong: the router's misfiles", n: misfiled, fill: "var(--bad)" },
    { key: "follow", label: "wrong: replies that followed them", n: D.follow[i], fill: "color-mix(in srgb, var(--bad) 45%, var(--surface))" },
    { key: "two", label: "wrong: a thread held in two forums", n: D.two[i], fill: "var(--warn)" },
  ];
};
const wrong = (i: number) => D.filed[i] - D.filed_right[i] + D.follow[i] + D.two[i];

// the price chart: wrong placements against posts a person reads, as stacked areas
const PW = 560, PH = 220, L = 44, R = 12, T = 10, B = 30;
const XMAX = D.person[LAST];
const YMAX = Math.ceil(wrong(0) / 100) * 100;
const px = (v: number) => r1(L + (v / XMAX) * (PW - L - R));
const py = (v: number) => r1(T + (1 - v / YMAX) * (PH - T - B));
const XT = [0, 500, 1000, 1500, 2000, 2500, 3000].filter((v) => v <= XMAX);
const YT = Array.from({ length: YMAX / 100 + 1 }, (_, k) => k * 100);
const LAYERS = [
  { label: "a thread held in two forums", get: (i: number) => D.two[i], fill: "var(--warn)" },
  { label: "replies that followed a misfile", get: (i: number) => D.follow[i], fill: "color-mix(in srgb, var(--bad) 45%, var(--surface))" },
  { label: "the router's misfiles", get: (i: number) => D.filed[i] - D.filed_right[i], fill: "var(--bad)" },
];
const IDX = Array.from({ length: N }, (_, i) => i);
const AREAS = LAYERS.map((_, k) => {
  const top = (i: number) => LAYERS.slice(0, k + 1).reduce((s, l) => s + l.get(i), 0);
  const bot = (i: number) => LAYERS.slice(0, k).reduce((s, l) => s + l.get(i), 0);
  const up = IDX.map((i) => `${i ? "L" : "M"}${px(D.person[i])},${py(top(i))}`).join(" ");
  const down = [...IDX].reverse().map((i) => `L${px(D.person[i])},${py(bot(i))}`).join(" ");
  return `${up} ${down} Z`;
});

export default function WholeSystemLab() {
  const [at, setAt] = useState(AT);
  const t = D.grid[at];
  const P = parts(at);
  const auto = D.posts - D.person[at];
  const autoRight = D.look_right[at] + D.filed_right[at];
  const w = wrong(at);

  const chip = (on: boolean): React.CSSProperties => ({
    fontSize: 12, padding: "4px 9px", borderRadius: 999, cursor: "pointer", border: `1px solid ${on ? POST : "var(--border)"}`,
    background: on ? "var(--surface)" : "transparent", color: on ? "var(--ink)" : "var(--muted)", fontWeight: on ? 600 : 400,
  });
  const tile: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 10px", minWidth: 0 };
  const small: React.CSSProperties = { fontSize: 11.5, color: "var(--muted)" };
  const big: React.CSSProperties = { ...mono, fontSize: 17, color: "var(--ink)" };
  const faint: React.CSSProperties = { fontSize: 11.5, color: "var(--faint)" };
  const swatch = (fill: string, hatch?: boolean): React.CSSProperties => ({
    display: "inline-block", width: 10, height: 10, borderRadius: 2, verticalAlign: "-1px", marginRight: 5,
    background: hatch ? "repeating-linear-gradient(45deg, var(--surface) 0 2px, var(--border-strong) 2px 3px)" : fill,
    border: hatch ? "1px solid var(--border-strong)" : "none",
  });

  return (
    <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 14, padding: "12px 14px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px 12px", marginBottom: 6 }}>
        <label htmlFor="sys-t" style={{ fontSize: 13, color: "var(--muted)" }}>the router files a post when its gap reaches</label>
        <input id="sys-t" type="range" min={0} max={LAST} step={1} value={at}
          onChange={(e) => setAt(Number(e.target.value))} style={{ flex: "1 1 10em", maxWidth: 280, accentColor: POST }}
          aria-valuetext={t === null ? "no threshold: a person reads them all" : `threshold ${t.toFixed(2)}`} />
        <span style={{ ...mono, fontSize: 13, color: "var(--ink)", minWidth: "3em" }}>{t === null ? "never" : t.toFixed(2)}</span>
      </div>
      <div role="group" aria-label="thresholds to jump to" style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
        <button onClick={() => setAt(0)} style={chip(at === 0)}>file everything it reads</button>
        <button onClick={() => setAt(AT)} style={chip(at === AT)}>the router&rsquo;s threshold <span style={mono}>{D.threshold.toFixed(3)}</span></button>
        <button onClick={() => setAt(LAST)} style={chip(at === LAST)}>a person reads all {fmt(D.person[LAST])}</button>
      </div>

      <figure style={{ margin: "0 0 12px" }}>
        <figcaption style={{ fontSize: 12, color: "var(--ink)", marginBottom: 4 }}>
          where next month&rsquo;s {fmt(D.posts)} posts end up
        </figcaption>
        <div role="img" aria-label={P.map((p) => `${p.label}: ${p.n}`).join("; ")}
          style={{ display: "flex", height: 30, borderRadius: 6, overflow: "hidden", border: "1px solid var(--border-strong)" }}>
          {P.map((p) => (p.n > 0 ? (
            <div key={p.key} title={`${p.label}: ${fmt(p.n)}`}
              style={{ width: `${(100 * p.n) / D.posts}%`, background: p.hatch ? "repeating-linear-gradient(45deg, var(--surface) 0 3px, var(--border-strong) 3px 4px)" : p.fill }} />
          ) : null))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 15.5em), 1fr))", gap: "3px 14px", fontSize: 11.5, color: "var(--muted)", marginTop: 7 }}>
          {P.map((p) => (
            <span key={p.key}>
              <span aria-hidden style={swatch(p.fill, p.hatch)} />
              {p.label} <span style={{ ...mono, color: "var(--ink)" }}>{fmt(p.n)}</span>
            </span>
          ))}
        </div>
      </figure>

      <figure style={{ margin: "0 0 10px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 8px 6px" }}>
        <figcaption style={{ fontSize: 12, color: "var(--ink)", marginBottom: 2 }}>
          wrong placements against the posts a person reads
        </figcaption>
        <svg viewBox={`0 0 ${PW} ${PH}`} role="img" aria-label="wrong placements by cause, against the number of posts a person reads, as the threshold rises"
          style={{ width: "100%", height: "auto", display: "block" }}>
          {YT.map((v) => (
            <g key={v}>
              <line x1={L} x2={PW - R} y1={py(v)} y2={py(v)} stroke="var(--border)" strokeWidth={1} />
              <text x={L - 6} y={py(v) + 3.5} fontSize={10.5} textAnchor="end" fill="var(--faint)">{v}</text>
            </g>
          ))}
          {XT.map((v) => (
            <text key={v} x={px(v)} y={PH - 12} fontSize={10.5} textAnchor="middle" fill="var(--faint)">{fmt(v)}</text>
          ))}
          {AREAS.map((d, k) => <path key={k} d={d} fill={LAYERS[k].fill} stroke="none" />)}
          <line x1={px(D.person[at])} x2={px(D.person[at])} y1={T} y2={PH - B} stroke="var(--ink)" strokeWidth={1.25} strokeDasharray="4 3" />
          <circle cx={px(D.person[at])} cy={py(w)} r={4} fill="var(--ink)" />
          <line x1={L} x2={PW - R} y1={PH - B} y2={PH - B} stroke="var(--border-strong)" strokeWidth={1} />
        </svg>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 12px", fontSize: 11.5, color: "var(--muted)", padding: "0 4px" }}>
          {[...LAYERS].reverse().map((l) => (
            <span key={l.label}><span aria-hidden style={swatch(l.fill)} />{l.label}</span>
          ))}
          <span style={{ color: "var(--faint)" }}>x: posts a person reads</span>
        </div>
      </figure>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 9.5em), 1fr))", gap: 8 }}>
        <div style={tile}>
          <div style={small}>placed without a person</div>
          <div style={big}>{fmt(auto)}</div>
          <div style={faint}>{pct(auto / D.posts)} of all posts</div>
        </div>
        <div style={tile}>
          <div style={small}>right among those</div>
          <div style={big}>{pct(autoRight / auto, 2)}</div>
          <div style={faint}>lookup and router together</div>
        </div>
        <div style={tile}>
          <div style={small}>a person reads</div>
          <div style={big}>{fmt(D.person[at])}</div>
          <div style={faint}>{pct(D.person[at] / D.posts)} of all posts</div>
        </div>
        <div style={tile}>
          <div style={small}>placed in a wrong forum</div>
          <div style={{ ...big, color: w > wrong(AT) ? "var(--bad)" : "var(--ink)" }}>{fmt(w)}</div>
          <div style={faint}>{fmt(D.follow[at])} of them replies that followed a misfile</div>
        </div>
      </div>
    </div>
  );
}
