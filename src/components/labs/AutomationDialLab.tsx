"use client";

import { useState } from "react";
import au from "@/data/routing/automation.json";

// The automation dial. The router files a new thread on its own when the gap between its two best scores
// reaches a threshold, and hands the rest to a moderator with its three best forums. Drag the threshold and
// watch two things on four sets of posts: the share right among the posts it files, and the share it files.
// Three sets are earlier posts a threshold can be set on (the harness, folds grouped by sender, each forum's
// latest quarter); the fourth is the later new threads, where the promise has to hold.
//
// Data: src/data/routing/automation.json, written by `python scripts/routing_cases.py latest_posts`.

type Curve = { posts: number; routed: number[]; right: number[]; top3?: number[] };
type Key = "thread" | "sender" | "latest" | "later";
const D = au as unknown as {
  grid: number[]; target: number; n: number;
  thresholds: Record<"thread" | "sender" | "weighted" | "latest" | "later", number>;
  curves: Record<Key, Curve>;
};

const POST = "var(--c-post)";
const mono: React.CSSProperties = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" };
const SETS: { key: Key; label: string; color: string; width: number }[] = [
  { key: "thread", label: "the harness (grouped by thread)", color: POST, width: 1.75 },
  { key: "sender", label: "folds grouped by sender", color: "var(--c-classification)", width: 1.75 },
  { key: "latest", label: "each forum’s latest quarter", color: "var(--warn)", width: 1.75 },
  { key: "later", label: "the later new threads", color: "var(--ink)", width: 2.5 },
];
const SNAPS: { key: "thread" | "sender" | "latest" | "later"; label: string }[] = [
  { key: "thread", label: "set on the harness" },
  { key: "sender", label: "set on folds by sender" },
  { key: "latest", label: "set on the latest quarter" },
  { key: "later", label: "hindsight" },
];

const r1 = (v: number) => Math.round(v * 10) / 10;
const pct = (v: number) => `${(100 * v).toFixed(1)}%`;
const PW = 300, PH = 172, L = 36, R = 10, T = 10, B = 26;
const XMAX = D.grid[D.grid.length - 1];
const px = (t: number) => r1(L + (t / XMAX) * (PW - L - R));
const nearest = (t: number) => D.grid.reduce((b, g, i) => (Math.abs(g - t) < Math.abs(D.grid[b] - t) ? i : b), 0);

function Panel({ title, field, lo, hi, step, at, line }: {
  title: string; field: "right" | "routed"; lo: number; hi: number; step: number; at: number; line?: number;
}) {
  const py = (v: number) => r1(T + (1 - (v - lo) / (hi - lo)) * (PH - T - B));
  const ticks: number[] = [];
  for (let v = lo; v <= hi + 1e-9; v += step) ticks.push(Math.round(v * 100) / 100);
  return (
    <figure style={{ margin: 0, minWidth: 0, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 8px 6px" }}>
      <figcaption style={{ fontSize: 12, color: "var(--ink)", marginBottom: 2 }}>{title}</figcaption>
      <svg viewBox={`0 0 ${PW} ${PH}`} role="img" aria-label={`${title}, against the threshold, for four sets of posts`}
        style={{ width: "100%", height: "auto", display: "block" }}>
        {ticks.map((v) => (
          <g key={v}>
            <line x1={L} x2={PW - R} y1={py(v)} y2={py(v)} stroke="var(--border)" strokeWidth={1} />
            <text x={L - 5} y={py(v) + 3.5} fontSize={10} textAnchor="end" fill="var(--faint)">{field === "right" ? v.toFixed(2) : `${Math.round(100 * v)}%`}</text>
          </g>
        ))}
        {[0, 1, 2, 3, 4].map((t) => (
          <text key={t} x={px(t)} y={PH - 8} fontSize={10} textAnchor="middle" fill="var(--faint)">{t}</text>
        ))}
        {line !== undefined && <line x1={L} x2={PW - R} y1={py(line)} y2={py(line)} stroke="var(--muted)" strokeWidth={1.25} strokeDasharray="5 4" />}
        <line x1={px(D.grid[at])} x2={px(D.grid[at])} y1={T} y2={PH - B} stroke="var(--muted)" strokeWidth={1} strokeDasharray="2 3" />
        {SETS.map((s) => {
          const v = D.curves[s.key][field];
          const d = v.map((y, i) => `${i ? "L" : "M"}${px(D.grid[i])},${py(Math.max(lo, Math.min(hi, y)))}`).join(" ");
          return (
            <g key={s.key}>
              <path d={d} fill="none" stroke={s.color} strokeWidth={s.width} />
              <circle cx={px(D.grid[at])} cy={py(Math.max(lo, Math.min(hi, v[at])))} r={3.5} fill={s.color} />
            </g>
          );
        })}
      </svg>
    </figure>
  );
}

export default function AutomationDialLab() {
  const [at, setAt] = useState(nearest(D.thresholds.thread));
  const t = D.grid[at];
  const lat = D.curves.later;
  const filed = Math.round(lat.routed[at] * D.n);
  const right = lat.right[at];
  const holds = right >= D.target;

  const chip = (on: boolean): React.CSSProperties => ({
    fontSize: 12, padding: "4px 9px", borderRadius: 999, cursor: "pointer", border: `1px solid ${on ? POST : "var(--border)"}`,
    background: on ? "var(--surface)" : "transparent", color: on ? "var(--ink)" : "var(--muted)", fontWeight: on ? 600 : 400,
  });
  const tile: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 10px", minWidth: 0 };

  return (
    <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 14, padding: "12px 14px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px 12px", marginBottom: 6 }}>
        <label htmlFor="auto-t" style={{ fontSize: 13, color: "var(--muted)" }}>file on its own when the gap reaches</label>
        <input id="auto-t" type="range" min={0} max={D.grid.length - 1} step={1} value={at}
          onChange={(e) => setAt(Number(e.target.value))} style={{ flex: "1 1 10em", maxWidth: 280, accentColor: POST }}
          aria-valuetext={`threshold ${t.toFixed(2)}`} />
        <span style={{ ...mono, fontSize: 13, color: "var(--ink)", minWidth: "3em" }}>{t.toFixed(2)}</span>
      </div>
      <div role="group" aria-label="thresholds each test sets" style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
        {SNAPS.map((s) => {
          const i = nearest(D.thresholds[s.key]);
          return (
            <button key={s.key} onClick={() => setAt(i)} style={chip(i === at)}>
              {s.label} <span style={mono}>{D.thresholds[s.key].toFixed(2)}</span>
            </button>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 15em), 1fr))", gap: "10px 12px" }}>
        <Panel title="share right among the posts it files" field="right" lo={0.86} hi={1} step={0.02} at={at} line={D.target} />
        <Panel title="share it files without a person" field="routed" lo={0} hi={1} step={0.25} at={at} />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 14px", fontSize: 11.5, color: "var(--muted)", margin: "6px 0 10px" }}>
        {SETS.map((s) => (
          <span key={s.key}>
            <span aria-hidden style={{ display: "inline-block", width: 14, height: s.width, background: s.color, verticalAlign: "3px", marginRight: 5 }} />
            {s.label} <span style={{ ...mono, color: "var(--faint)" }}>{pct(D.curves[s.key].right[at])}</span>
          </span>
        ))}
        <span><span aria-hidden style={{ display: "inline-block", width: 14, borderTop: "1.5px dashed var(--muted)", verticalAlign: "3px", marginRight: 5 }} />the 95% promise</span>
      </div>

      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>on the {D.n.toLocaleString("en-US")} later new threads, at {t.toFixed(2)}:</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 9em), 1fr))", gap: 8 }}>
        <div style={tile}>
          <div style={{ fontSize: 11.5, color: "var(--muted)" }}>filed without a person</div>
          <div style={{ ...mono, fontSize: 17, color: "var(--ink)" }}>{filed.toLocaleString("en-US")}</div>
          <div style={{ fontSize: 11.5, color: "var(--faint)" }}>{pct(lat.routed[at])}</div>
        </div>
        <div style={tile}>
          <div style={{ fontSize: 11.5, color: "var(--muted)" }}>right among those</div>
          <div style={{ ...mono, fontSize: 17, color: "var(--ink)" }}>{pct(right)}</div>
          <div style={{ fontSize: 11.5, color: holds ? "var(--good)" : "var(--bad)" }}>{holds ? "meets 95%" : "short of 95%"}</div>
        </div>
        <div style={tile}>
          <div style={{ fontSize: 11.5, color: "var(--muted)" }}>handed to a moderator</div>
          <div style={{ ...mono, fontSize: 17, color: "var(--ink)" }}>{(D.n - filed).toLocaleString("en-US")}</div>
          <div style={{ fontSize: 11.5, color: "var(--faint)" }}>{pct(1 - lat.routed[at])}</div>
        </div>
        <div style={tile}>
          <div style={{ fontSize: 11.5, color: "var(--muted)" }}>right forum among its three</div>
          <div style={{ ...mono, fontSize: 17, color: "var(--ink)" }}>{D.n - filed > 0 ? pct(lat.top3![at]) : "–"}</div>
          <div style={{ fontSize: 11.5, color: "var(--faint)" }}>of the handed-off posts</div>
        </div>
      </div>
    </div>
  );
}
