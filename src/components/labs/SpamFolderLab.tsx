"use client";

import { useState } from "react";
import sm from "@/data/routing/sms.json";

// The spam folder's dial, on the SMS Spam Collection. Each filter was fitted on five folds with a campaign's copies
// kept together; its threshold is set so that at most a chosen share of the real messages goes to the spam folder.
// Pick the filter and the budget: the share of spam it catches, and what happens to the real messages once a phone
// number, a web link or a sum in pounds is added to each, which the collectors had taken out of the real ones.
//
// Data: src/data/routing/sms.json, written by `python scripts/routing_cases.py sms_filter`.

type Filter = { name: string; caught: number[]; blocked: number[][] };
const D = sm as unknown as { budgets: number[]; budget: number; real: number; spam: number; adds: string[]; filters: Filter[] };

const POST = "var(--c-post)";
const mono: React.CSSProperties = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" };
const r1 = (v: number) => Math.round(v * 10) / 10;
const pct = (v: number) => `${(100 * v).toFixed(1)}%`;
const fmt = (v: number) => v.toLocaleString("en-US");
const oneIn = (b: number) => `1 in ${Math.round(1 / b).toLocaleString("en-US")}`;
const AT0 = D.budgets.reduce((b, g, i) => (Math.abs(Math.log(g / D.budget)) < Math.abs(Math.log(D.budgets[b] / D.budget)) ? i : b), 0);

const PW = 300, PH = 180, L = 36, R = 10, T = 10, B = 28;
const B0 = D.budgets[0], B1 = D.budgets[D.budgets.length - 1];
const px = (b: number) => r1(L + (Math.log(b / B0) / Math.log(B1 / B0)) * (PW - L - R));
const YLO = 0.5;
const py = (v: number) => r1(T + (1 - (Math.max(YLO, v) - YLO) / (1 - YLO)) * (PH - T - B));
const XT = [0.001, 0.002, 0.005, 0.01, 0.02, 0.05];
// tick labels as "1 in N", the way the dial reads
const XL = ["1/1000", "1/500", "1/200", "1/100", "1/50", "1/20"];
// the scrubbed filters are drawn dashed in their unscrubbed filter's colour
const COLOURS = [POST, "var(--c-classification)", "var(--warn)", POST, "var(--c-classification)"];
const DASH = (i: number) => (i >= 3 ? "5 3" : undefined);

export default function SpamFolderLab() {
  const [f, setF] = useState(1);
  const [at, setAt] = useState(AT0);
  const b = D.budgets[at];
  const F = D.filters[f];
  const real = Math.round(b * D.real);

  const chip = (on: boolean, c: string): React.CSSProperties => ({
    fontSize: 12, padding: "4px 9px", borderRadius: 999, cursor: "pointer", border: `1px solid ${on ? c : "var(--border)"}`,
    background: on ? "var(--surface)" : "transparent", color: on ? "var(--ink)" : "var(--muted)", fontWeight: on ? 600 : 400,
  });
  const tile: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 10px", minWidth: 0 };

  return (
    <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 14, padding: "12px 14px" }}>
      <div role="group" aria-label="filter" style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
        {D.filters.map((x, i) => (
          <button key={x.name} onClick={() => setF(i)} style={chip(i === f, COLOURS[i])}>
            <span aria-hidden style={{ display: "inline-block", width: 14, borderTop: `2.5px ${i >= 3 ? "dashed" : "solid"} ${COLOURS[i]}`, verticalAlign: "3px", marginRight: 6 }} />
            {x.name}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px 12px", marginBottom: 10 }}>
        <label htmlFor="spam-b" style={{ fontSize: 13, color: "var(--muted)" }}>real messages it may send to the spam folder</label>
        <input id="spam-b" type="range" min={0} max={D.budgets.length - 1} step={1} value={at}
          onChange={(e) => setAt(Number(e.target.value))} style={{ flex: "1 1 10em", maxWidth: 260, accentColor: POST }}
          aria-valuetext={`${oneIn(b)} real messages`} />
        <span style={{ ...mono, fontSize: 13, color: "var(--ink)", minWidth: "6.5em" }}>{oneIn(b)}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 15em), 1fr))", gap: "10px 12px" }}>
        <figure style={{ margin: 0, minWidth: 0, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 8px 6px" }}>
          <figcaption style={{ fontSize: 12, color: "var(--ink)", marginBottom: 2 }}>spam caught, against the real messages it may block</figcaption>
          <svg viewBox={`0 0 ${PW} ${PH}`} role="img" aria-label="share of spam caught at each budget of real messages blocked, one line per filter"
            style={{ width: "100%", height: "auto", display: "block" }}>
            {[0.5, 0.6, 0.7, 0.8, 0.9, 1].map((v) => (
              <g key={v}>
                <line x1={L} x2={PW - R} y1={py(v)} y2={py(v)} stroke="var(--border)" strokeWidth={1} />
                <text x={L - 5} y={py(v) + 3.5} fontSize={10} textAnchor="end" fill="var(--faint)">{Math.round(100 * v)}%</text>
              </g>
            ))}
            {XT.map((v, i) => (
              <text key={v} x={px(v)} y={PH - 9} fontSize={10} textAnchor="middle" fill="var(--faint)">{XL[i]}</text>
            ))}
            <line x1={px(b)} x2={px(b)} y1={T} y2={PH - B} stroke="var(--muted)" strokeWidth={1} strokeDasharray="2 3" />
            {D.filters.map((x, i) => (
              <path key={x.name} d={x.caught.map((v, k) => `${k ? "L" : "M"}${px(D.budgets[k])},${py(v)}`).join(" ")}
                fill="none" stroke={COLOURS[i]} strokeWidth={i === f ? 2.5 : 1.25} opacity={i === f ? 1 : 0.45} strokeDasharray={DASH(i)} />
            ))}
            <circle cx={px(b)} cy={py(F.caught[at])} r={4} fill={COLOURS[f]} />
          </svg>
        </figure>

        <figure style={{ margin: 0, minWidth: 0, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 10px 10px" }}>
          <figcaption style={{ fontSize: 12, color: "var(--ink)", marginBottom: 8 }}>real messages sent to the folder once each carries</figcaption>
          <div style={{ display: "grid", gap: 9 }}>
            {[{ name: "nothing added", v: real / D.real }, ...D.adds.map((a, i) => ({ name: a, v: F.blocked[i][at] }))].map((r, i) => (
              <div key={r.name}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--muted)", marginBottom: 3 }}>
                  <span>{r.name}</span>
                  <span style={{ ...mono, color: i && r.v > 4 * b ? "var(--bad)" : "var(--ink)" }}>{pct(r.v)}</span>
                </div>
                <div style={{ height: 10, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${Math.max(0.6, 100 * r.v)}%`, height: "100%", background: i && r.v > 4 * b ? "var(--bad)" : COLOURS[f] }} />
                </div>
              </div>
            ))}
          </div>
        </figure>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 9em), 1fr))", gap: 8, marginTop: 10 }}>
        <div style={tile}>
          <div style={{ fontSize: 11.5, color: "var(--muted)" }}>spam caught</div>
          <div style={{ ...mono, fontSize: 17, color: "var(--ink)" }}>{pct(F.caught[at])}</div>
          <div style={{ fontSize: 11.5, color: "var(--faint)" }}>{fmt(Math.round(F.caught[at] * D.spam))} of {fmt(D.spam)}</div>
        </div>
        <div style={tile}>
          <div style={{ fontSize: 11.5, color: "var(--muted)" }}>real messages in the folder</div>
          <div style={{ ...mono, fontSize: 17, color: "var(--ink)" }}>{fmt(real)}</div>
          <div style={{ fontSize: 11.5, color: "var(--faint)" }}>of {fmt(D.real)}, as set</div>
        </div>
        <div style={tile}>
          <div style={{ fontSize: 11.5, color: "var(--muted)" }}>with a phone number</div>
          <div style={{ ...mono, fontSize: 17, color: F.blocked[0][at] > 4 * b ? "var(--bad)" : "var(--ink)" }}>{fmt(Math.round(F.blocked[0][at] * D.real))}</div>
          <div style={{ fontSize: 11.5, color: "var(--faint)" }}>real messages in the folder</div>
        </div>
        <div style={tile}>
          <div style={{ fontSize: 11.5, color: "var(--muted)" }}>with a web link</div>
          <div style={{ ...mono, fontSize: 17, color: F.blocked[1][at] > 4 * b ? "var(--bad)" : "var(--ink)" }}>{fmt(Math.round(F.blocked[1][at] * D.real))}</div>
          <div style={{ fontSize: 11.5, color: "var(--faint)" }}>real messages in the folder</div>
        </div>
      </div>
    </div>
  );
}
