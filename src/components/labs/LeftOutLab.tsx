"use client";

import { useState } from "react";
import lo from "@/data/routing/leftout.json";

// A forum the router has never seen. Each forum in turn is left out of the training and the router is refitted
// on the other nineteen. Pick the left-out forum: the share of its later new threads the router would file at each
// threshold against the share of everyone else's (the gaps run from 0 to 25+, so the axis is logarithmic), where
// its threads went, and what holding its family for a person would catch and cost.
//
// Data: src/data/routing/leftout.json, written by `python scripts/routing_cases.py left_out`.

type Run = {
  n: number; filed: number[]; handed: number[]; hold: boolean; caught: number; cost: number;
  others_filed: number; others: number; out_ge: number[]; known_ge: number[];
};
const D = lo as unknown as { names: string[]; threshold: number; grid: number[]; runs: Run[] };

const POST = "var(--c-post)";
const mono: React.CSSProperties = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" };
const pct = (v: number) => `${(100 * v).toFixed(1)}%`;
const r1 = (v: number) => Math.round(v * 10) / 10;
const sum = (a: number[]) => a.reduce((s, v) => s + v, 0);
const add = (a: number[], b: number[]) => a.map((v, i) => v + b[i]);
const RELIGION = ["alt.atheism", "soc.religion.christian", "talk.religion.misc"];
// the register's families (page 21): the name groups, the three about religion together; misc.forsale has none
const family = (f: string) =>
  RELIGION.includes(f) ? "religion" : ["comp", "rec", "sci"].find((p) => f.startsWith(p + ".")) ?? (f.startsWith("talk.politics.") ? "politics" : f);

const PW = 520, PH = 170, L = 34, R = 10, T = 10, B = 26;
const G0 = D.grid[0], G1 = D.grid[D.grid.length - 1];
const px = (g: number) => r1(L + (Math.log(g / G0) / Math.log(G1 / G0)) * (PW - L - R));
const py = (v: number) => r1(T + (1 - v) * (PH - T - B));
const AT = D.grid.reduce((b, g, i) => (Math.abs(g - D.threshold) < Math.abs(D.grid[b] - D.threshold) ? i : b), 0);
const TICKS = [0.1, 0.3, 1, 3, 10, 30];

export default function LeftOutLab() {
  const [k, setK] = useState(D.names.indexOf("rec.sport.hockey"));
  const [holdOn, setHold] = useState(false);

  const runs = k < 0 ? D.runs : [D.runs[k]];
  const n = sum(runs.map((r) => r.n));
  const filedAll = sum(runs.map((r) => sum(r.filed)));
  const caught = sum(runs.map((r) => r.caught));
  const canHold = runs.some((r) => r.hold);
  const hold = holdOn && canHold;
  const cost = sum(runs.filter((r) => r.hold).map((r) => r.cost));
  const base = sum(runs.filter((r) => r.hold).map((r) => r.others_filed));
  const filed = hold ? filedAll - caught : filedAll;
  // share filed at each threshold on the grid: the left-out forum's threads, and everyone else's
  const others = sum(runs.map((r) => r.others));
  const sOut = runs.map((r) => r.out_ge).reduce(add).map((v) => v / n);
  const sKnown = runs.map((r) => r.known_ge).reduce(add).map((v) => v / others);
  const j10 = sOut.findIndex((v) => v <= 0.1); // the lowest threshold that files one in ten of them or fewer
  const line = (v: number[]) => v.map((y, j) => `${j ? "L" : "M"}${px(D.grid[j])},${py(y)}`).join(" ");

  // where its threads went: for one forum, its top destinations; for all of them, by family
  type Bar = { label: string; filed: number; handed: number };
  let bars: Bar[];
  if (k >= 0) {
    const r = D.runs[k];
    bars = D.names.map((name, j) => ({ label: name, filed: r.filed[j], handed: r.handed[j] }))
      .filter((b) => b.filed + b.handed > 0).sort((a, b) => b.filed + b.handed - (a.filed + a.handed));
    if (bars.length > 6) {
      const rest = bars.slice(5);
      bars = [...bars.slice(0, 5), { label: `${rest.length} other forums`, filed: sum(rest.map((b) => b.filed)), handed: sum(rest.map((b) => b.handed)) }];
    }
  } else {
    const own: Bar = { label: "a forum of its own family", filed: 0, handed: 0 };
    const other: Bar = { label: "a forum of another family", filed: 0, handed: 0 };
    D.runs.forEach((r, i) => D.names.forEach((name, j) => {
      const b = family(name) === family(D.names[i]) ? own : other;
      b.filed += r.filed[j];
      b.handed += r.handed[j];
    }));
    bars = [own, other];
  }
  const bmax = Math.max(...bars.map((b) => b.filed + b.handed));

  const chip = (on: boolean): React.CSSProperties => ({
    fontSize: 12, padding: "4px 9px", borderRadius: 999, cursor: "pointer", border: `1px solid ${on ? POST : "var(--border)"}`,
    background: on ? "var(--surface)" : "transparent", color: on ? "var(--ink)" : "var(--muted)", fontWeight: on ? 600 : 400,
  });
  const tile: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 10px", minWidth: 0 };
  const small: React.CSSProperties = { fontSize: 11.5, color: "var(--muted)" };
  const faint: React.CSSProperties = { fontSize: 11.5, color: "var(--faint)" };
  const big: React.CSSProperties = { ...mono, fontSize: 17, color: "var(--ink)" };
  const panel: React.CSSProperties = { margin: 0, minWidth: 0, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 10px" };

  return (
    <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 14, padding: "12px 14px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px 12px", marginBottom: 10 }}>
        <label htmlFor="lo-forum" style={{ fontSize: 13, color: "var(--muted)" }}>left out of the training</label>
        <select id="lo-forum" value={k} onChange={(e) => setK(Number(e.target.value))}
          style={{ fontSize: 13, padding: "4px 6px", borderRadius: 7, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--ink)", maxWidth: "100%" }}>
          <option value={-1}>each forum in turn (all {sum(D.runs.map((r) => r.n)).toLocaleString("en-US")} later new threads)</option>
          {D.names.map((name, j) => <option key={name} value={j}>{name} ({D.runs[j].n} later new threads)</option>)}
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 17em), 1fr))", gap: "10px 12px" }}>
        <figure style={panel}>
          <figcaption style={{ fontSize: 12, color: "var(--ink)", marginBottom: 2 }}>share filed without a person, at each threshold on the gap</figcaption>
          <svg viewBox={`0 0 ${PW} ${PH}`} role="img" aria-label="share of threads the router would file at each threshold, the left-out forum's against everyone else's"
            style={{ width: "100%", height: "auto", display: "block" }}>
            {[0, 0.25, 0.5, 0.75, 1].map((v) => (
              <g key={v}>
                <line x1={L} x2={PW - R} y1={py(v)} y2={py(v)} stroke="var(--border)" strokeWidth={1} />
                <text x={L - 5} y={py(v) + 3.5} fontSize={10} textAnchor="end" fill="var(--faint)">{Math.round(100 * v)}%</text>
              </g>
            ))}
            {TICKS.map((g) => (
              <text key={g} x={px(g)} y={PH - 9} fontSize={10} textAnchor="middle" fill="var(--faint)">{g}</text>
            ))}
            <line x1={px(D.threshold)} x2={px(D.threshold)} y1={T} y2={PH - B} stroke="var(--ink)" strokeWidth={1.25} strokeDasharray="5 4" />
            {j10 >= 0 && <line x1={px(D.grid[j10])} x2={px(D.grid[j10])} y1={T} y2={PH - B} stroke="var(--muted)" strokeWidth={1.25} strokeDasharray="1.5 3" />}
            <path d={line(sKnown)} fill="none" stroke="var(--muted)" strokeWidth={1.75} />
            <path d={line(sOut)} fill="none" stroke={POST} strokeWidth={2.5} />
            <circle cx={px(D.grid[AT])} cy={py(sKnown[AT])} r={3.5} fill="var(--muted)" />
            <circle cx={px(D.grid[AT])} cy={py(sOut[AT])} r={4} fill={POST} />
            {j10 >= 0 && <circle cx={px(D.grid[j10])} cy={py(sKnown[j10])} r={3.5} fill="var(--muted)" />}
          </svg>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 12px", fontSize: 11.5, color: "var(--muted)" }}>
            <span><span aria-hidden style={{ display: "inline-block", width: 14, borderTop: `2.5px solid ${POST}`, verticalAlign: "3px", marginRight: 5 }} />the left-out forum&rsquo;s threads</span>
            <span><span aria-hidden style={{ display: "inline-block", width: 14, borderTop: "1.75px solid var(--muted)", verticalAlign: "3px", marginRight: 5 }} />everyone else&rsquo;s</span>
            <span><span aria-hidden style={{ display: "inline-block", width: 14, borderTop: "1.25px dashed var(--ink)", verticalAlign: "3px", marginRight: 5 }} />the router&rsquo;s threshold, {D.threshold.toFixed(3)}</span>
            <span><span aria-hidden style={{ display: "inline-block", width: 14, borderTop: "1.25px dotted var(--muted)", verticalAlign: "3px", marginRight: 5 }} />one that files one in ten of them</span>
          </div>
        </figure>

        <figure style={panel}>
          <figcaption style={{ fontSize: 12, color: "var(--ink)", marginBottom: 6 }}>where its {n.toLocaleString("en-US")} threads went</figcaption>
          <div style={{ display: "grid", gap: 6 }}>
            {bars.map((b) => (
              <div key={b.label} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "2px 8px", fontSize: 12 }}>
                <span style={{ flex: "0 0 12.5em", minWidth: 0, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.label}</span>
                <span style={{ flex: "1 1 6em", display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                  <span style={{ display: "flex", height: 10, width: `${(100 * (b.filed + b.handed)) / bmax}%`, minWidth: 2 }}>
                    <span style={{ width: `${(100 * b.filed) / Math.max(1, b.filed + b.handed)}%`, background: POST }} />
                    <span style={{ flex: 1, background: "var(--muted)", opacity: 0.4 }} />
                  </span>
                  <span style={{ ...mono, fontSize: 11, color: "var(--faint)", whiteSpace: "nowrap" }}>{b.filed} + {b.handed}</span>
                </span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 12px", fontSize: 11.5, color: "var(--muted)", marginTop: 8 }}>
            <span><span aria-hidden style={{ display: "inline-block", width: 10, height: 10, background: POST, verticalAlign: "-1px", marginRight: 5 }} />filed without a person</span>
            <span><span aria-hidden style={{ display: "inline-block", width: 10, height: 10, background: "var(--muted)", opacity: 0.4, verticalAlign: "-1px", marginRight: 5 }} />handed to a person</span>
          </div>
        </figure>
      </div>

      <div role="radiogroup" aria-label="hold the new forum's family" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 5, margin: "10px 0" }}>
        <button role="radio" aria-checked={!hold} onClick={() => setHold(false)} style={chip(!hold)}>the threshold alone</button>
        <button role="radio" aria-checked={hold} onClick={() => setHold(true)} style={chip(hold)} disabled={!canHold}
          title={canHold ? undefined : "misc.forsale has no family to hold"}>hold its family for a person</button>
        {!canHold && <span style={{ fontSize: 12, color: "var(--faint)" }}>misc.forsale has no family to hold</span>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 10em), 1fr))", gap: 8 }}>
        <div style={tile}>
          <div style={small}>its threads filed without a person</div>
          <div style={{ ...big, color: filed / n >= 0.1 ? "var(--bad)" : "var(--ink)" }}>{filed.toLocaleString("en-US")}</div>
          <div style={faint}>{pct(filed / n)} of {n.toLocaleString("en-US")}; H7 said under 10%</div>
        </div>
        <div style={tile}>
          <div style={small}>its threads handed to a person</div>
          <div style={big}>{(n - filed).toLocaleString("en-US")}</div>
          <div style={faint}>where someone can file them in the new forum</div>
        </div>
        <div style={tile}>
          <div style={small}>a threshold that files one in ten of them</div>
          <div style={big}>{j10 >= 0 ? D.grid[j10].toFixed(2) : `over ${G1}`}</div>
          <div style={faint}>{j10 >= 0 ? `files ${pct(sKnown[j10])} of everyone else’s (${pct(sKnown[AT])} now)` : "no threshold on the scale does it"}</div>
        </div>
        <div style={tile}>
          <div style={small}>other forums&rsquo; filed threads the hold hands over</div>
          <div style={big}>{hold ? cost.toLocaleString("en-US") : "–"}</div>
          <div style={faint}>{hold ? `${pct(cost / Math.max(1, base))} of ${base.toLocaleString("en-US")} filed` : "switch the hold on"}</div>
        </div>
      </div>
    </div>
  );
}
