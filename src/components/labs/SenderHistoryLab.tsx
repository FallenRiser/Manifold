"use client";

import { useState } from "react";
import hd from "@/data/routing/history.json";

// The sender's history as a dial. The bar's model reads the post; the history adds w times the log of
// the share of the sender's earlier posts that went to each forum. New senders have no history, so
// their routes never move; senders the router has met are split by where the post actually went: the
// forum they post in most, another forum they had posted in, or a forum they had never posted in.
//
// Data: src/data/routing/history.json, written by `python scripts/routing_cases.py sender_history`.

type G = "usual" | "other" | "never" | "new";
type Row = { w: number; all: number; weighted: number; fixed: Record<G, number>; broken: Record<G, number> } & Record<G, number>;
type Side = { n: Record<G, number>; known: number; rows: Row[] };
const D = hd as unknown as { reading: string; setting: number; beta: number; pick: number; harness: Side; later: Side };

const POST = "var(--c-post)";
const mono: React.CSSProperties = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" };
const r1 = (v: number) => Math.round(v * 10) / 10;

const GROUPS: { key: G; label: string; short: string; color: string; dash?: string }[] = [
  { key: "usual", label: "the forum they post in most", short: "their usual forum", color: POST },
  { key: "other", label: "another forum they had posted in", short: "another of theirs", color: "var(--warn)" },
  { key: "never", label: "a forum they had never posted in", short: "a forum new to them", color: "var(--bad)" },
  { key: "new", label: "senders the router has not met", short: "new senders", color: "var(--muted)", dash: "4 3" },
];
const SIDES = [
  { key: "harness" as const, label: "the harness" },
  { key: "later" as const, label: "the later posts" },
];

const W = 320, H = 214, L = 36, R = 12, T = 14, B = 40;
const N = D.harness.rows.length;
const PICK = D.harness.rows.findIndex((r) => r.w === D.pick);
const lows = [D.harness, D.later].flatMap((s) => s.rows.flatMap((r) => GROUPS.map((g) => r[g.key])));
const YMIN = Math.floor(Math.min(...lows) * 10) / 10;
const YMAX = 1;
const x = (i: number) => r1(L + (i / (N - 1)) * (W - L - R));
const y = (v: number) => r1(T + (1 - (v - YMIN) / (YMAX - YMIN)) * (H - T - B));
const pct = (v: number) => `${(100 * v).toFixed(1)}%`;
const pts = (v: number) => `${v >= 0 ? "+" : "−"}${Math.abs(100 * v).toFixed(2)}`;
const wfmt = (w: number) => String(w);

export default function SenderHistoryLab() {
  const [side, setSide] = useState<"harness" | "later">("harness");
  const [wi, setWi] = useState(PICK);
  const S = D[side];
  const row = S.rows[wi], zero = S.rows[0];
  const metN = S.n.usual + S.n.other + S.n.never;
  const metRight = (r: Row) => (r.usual * S.n.usual + r.other * S.n.other + r.never * S.n.never) / metN;

  const toggle = (on: boolean): React.CSSProperties => ({
    fontSize: 12.5, padding: "5px 10px", borderRadius: 7, border: "none", cursor: "pointer",
    background: on ? POST : "transparent", color: on ? "var(--surface)" : "var(--muted)", fontWeight: on ? 600 : 400,
  });
  const group: React.CSSProperties = {
    display: "inline-flex", flexWrap: "wrap", gap: 3, background: "var(--surface)", border: "1px solid var(--border)",
    borderRadius: 10, padding: 3,
  };
  const tile: React.CSSProperties = {
    background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 10px", minWidth: 0,
  };
  const panel: React.CSSProperties = {
    margin: 0, minWidth: 0, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 8px 6px",
  };
  const cap: React.CSSProperties = { fontSize: 12, color: "var(--muted)", margin: "0 0 4px 2px" };
  const yTicks = Array.from({ length: Math.round((YMAX - YMIN) / 0.1) + 1 }, (_, i) => Math.round((YMIN + 0.1 * i) * 10) / 10);

  return (
    <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 14, padding: "12px 14px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px 10px", marginBottom: 8 }}>
        <span style={{ fontSize: 13, color: "var(--muted)" }}>new threads from</span>
        <div role="radiogroup" aria-label="which new threads" style={group}>
          {SIDES.map((s) => (
            <button key={s.key} role="radio" aria-checked={side === s.key} onClick={() => setSide(s.key)} style={toggle(side === s.key)}>
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px 12px", marginBottom: 10 }}>
        <label htmlFor="history-w" style={{ fontSize: 13, color: "var(--muted)" }}>weight of the history</label>
        <input id="history-w" type="range" min={0} max={N - 1} step={1} value={wi}
          onChange={(e) => setWi(Number(e.target.value))} style={{ flex: "1 1 10em", maxWidth: 260, accentColor: POST }}
          aria-valuetext={`w = ${wfmt(row.w)}`} />
        <span style={{ ...mono, fontSize: 13, color: "var(--ink)", minWidth: "4.5em" }}>w = {wfmt(row.w)}</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>{wi === 0 ? "no history" : wi === PICK ? "the harness's pick" : ""}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 17em), 1fr))", gap: "10px 12px" }}>
        <figure style={panel}>
          <figcaption style={cap}>share routed right, by where the post went</figcaption>
          <svg viewBox={`0 0 ${W} ${H}`} role="img" style={{ width: "100%", height: "auto", display: "block" }}
            aria-label={`At weight ${wfmt(row.w)}: ${GROUPS.map((g) => `${g.short} ${pct(row[g.key])}`).join(", ")}`}>
            {yTicks.map((t) => (
              <g key={t}>
                <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeWidth={1} />
                <text x={L - 5} y={y(t) + 3.5} fontSize={10} textAnchor="end" fill="var(--faint)">{t.toFixed(1)}</text>
              </g>
            ))}
            {S.rows.map((r, i) => (
              <text key={i} x={x(i)} y={y(YMIN) + 15} fontSize={10} textAnchor={i === 0 ? "start" : i === N - 1 ? "end" : "middle"} fill="var(--faint)">
                {wfmt(r.w)}
              </text>
            ))}
            <text x={r1((L + W - R) / 2)} y={H - 5} fontSize={10} textAnchor="middle" fill="var(--faint)">weight of the history, w</text>
            <line x1={x(wi)} x2={x(wi)} y1={T - 4} y2={y(YMIN)} stroke="var(--ink)" strokeWidth={1} strokeDasharray="2 3" />
            {GROUPS.map((g) => (
              <g key={g.key}>
                <path d={S.rows.map((r, i) => `${i ? "L" : "M"}${x(i)},${y(r[g.key])}`).join(" ")} fill="none"
                  stroke={g.color} strokeWidth={g.key === "new" ? 1.5 : 2} strokeDasharray={g.dash} />
                <circle cx={x(wi)} cy={y(row[g.key])} r={3.5} fill={g.color} />
              </g>
            ))}
          </svg>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 12px", fontSize: 11.5, color: "var(--muted)", margin: "4px 2px 0" }}>
            {GROUPS.map((g) => (
              <span key={g.key} style={{ whiteSpace: "nowrap" }}>
                <span style={{ display: "inline-block", width: 14, height: 0, borderTop: `2px ${g.dash ? "dashed" : "solid"} ${g.color}`, verticalAlign: "middle", marginRight: 5 }} />
                {g.short}
              </span>
            ))}
          </div>
        </figure>

        <figure style={panel}>
          <figcaption style={cap}>what the history moves, against no history</figcaption>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, fontVariantNumeric: "tabular-nums" }}>
              <thead>
                <tr style={{ color: "var(--faint)", fontSize: 11.5, textAlign: "right" }}>
                  <th style={{ textAlign: "left", fontWeight: 400, padding: "2px 4px" }}>the post went to</th>
                  <th style={{ fontWeight: 400, padding: "2px 4px" }}>posts</th>
                  <th style={{ fontWeight: 400, padding: "2px 4px" }}>right</th>
                  <th style={{ fontWeight: 400, padding: "2px 4px" }}>now right</th>
                  <th style={{ fontWeight: 400, padding: "2px 4px" }}>now wrong</th>
                </tr>
              </thead>
              <tbody>
                {GROUPS.map((g) => (
                  <tr key={g.key} style={{ borderTop: "1px solid var(--border)" }}>
                    <td style={{ padding: "5px 4px", color: "var(--ink)" }}>
                      <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: g.color, marginRight: 6 }} />
                      {g.label}
                    </td>
                    <td style={{ padding: "5px 4px", textAlign: "right", color: "var(--muted)" }}>{S.n[g.key].toLocaleString("en-US")}</td>
                    <td style={{ padding: "5px 4px", textAlign: "right", color: "var(--ink)", whiteSpace: "nowrap" }}>{pct(row[g.key])}</td>
                    <td style={{ padding: "5px 4px", textAlign: "right", color: row.fixed[g.key] ? "var(--good)" : "var(--faint)" }}>+{row.fixed[g.key]}</td>
                    <td style={{ padding: "5px 4px", textAlign: "right", color: row.broken[g.key] ? "var(--bad)" : "var(--faint)" }}>−{row.broken[g.key]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </figure>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 11em), 1fr))", gap: 8, marginTop: 10 }}>
        <div style={tile}>
          <div style={{ fontSize: 11.5, color: "var(--muted)" }}>all new threads, at the later mix of senders</div>
          <div style={{ ...mono, fontSize: 17, color: "var(--ink)" }}>{pct(row.weighted)}</div>
          <div style={{ fontSize: 11.5, color: "var(--faint)" }}>{pts(row.weighted - zero.weighted)} points</div>
        </div>
        <div style={tile}>
          <div style={{ fontSize: 11.5, color: "var(--muted)" }}>senders the router has met</div>
          <div style={{ ...mono, fontSize: 17, color: "var(--ink)" }}>{pct(metRight(row))}</div>
          <div style={{ fontSize: 11.5, color: "var(--faint)" }}>{pts(metRight(row) - metRight(zero))} points</div>
        </div>
        <div style={tile}>
          <div style={{ fontSize: 11.5, color: "var(--muted)" }}>posts to a forum new to the sender</div>
          <div style={{ ...mono, fontSize: 17, color: "var(--ink)" }}>{pct(row.never)}</div>
          <div style={{ fontSize: 11.5, color: "var(--faint)" }}>{pts(row.never - zero.never)} points</div>
        </div>
      </div>
    </div>
  );
}
