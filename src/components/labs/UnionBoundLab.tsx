"use client";

import { useState } from "react";

// The union bound, felt as a price. Fix a hypothesis before you look at the
// data and Hoeffding gives you a gap of sqrt(ln(2/δ) / 2n). Try M hypotheses
// and pick the best-looking one, and you must pay for all M at once:
//
//     ε(M) = sqrt( (ln M + ln(2/δ)) / (2n) )
//
// Two lessons live in that formula, and the sliders make both visible:
//   • The good news is that M enters through a LOGARITHM. Going from 1 model to
//     a thousand does not cost a thousand times the error bar.
//   • The bad news is that it never stops growing, and with a small n the bound
//     climbs past 0.5 — a "guarantee" that the error is at most 50% tells you
//     nothing about a binary problem. That's a vacuous bound, and the lab marks
//     the region so the reader sees the theory hand back an empty promise.
//
// Every number is the closed form evaluated live — self-verifying, no dataset.

const VW = 380, VH = 190, PAD = { l: 40, r: 14, t: 14, b: 32 };
const X0 = PAD.l, X1 = VW - PAD.r, Y0 = VH - PAD.b, Y1 = PAD.t;
const LOGM_MAX = 6;          // M up to 10^6
const EPS_MAX = 0.8;
const DELTA = 0.05;

const eps = (logM: number, n: number) =>
  Math.sqrt((Math.log(Math.pow(10, logM)) + Math.log(2 / DELTA)) / (2 * n));

const px = (logM: number) => X0 + (logM / LOGM_MAX) * (X1 - X0);
const py = (e: number) => Y0 - Math.min(e, EPS_MAX) / EPS_MAX * (Y0 - Y1);

export function UnionBoundLab() {
  const [logM, setLogM] = useState(0);        // log10 of the number of hypotheses
  const [n, setN] = useState(1000);

  const accent = "var(--c-metrics)";
  const M = Math.round(Math.pow(10, logM));
  const e = eps(logM, n);
  const e1 = eps(0, n);                        // the honest single-hypothesis bar
  const vacuous = e >= 0.5;

  // Curve over the whole M range at the current n. Coords rounded: sqrt/log in
  // SSR'd markup would otherwise risk a hydration mismatch.
  const pts: string[] = [];
  for (let i = 0; i <= 60; i++) {
    const lm = (i / 60) * LOGM_MAX;
    pts.push(`${px(lm).toFixed(2)},${py(eps(lm, n)).toFixed(2)}`);
  }

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.6rem 0" }} className="not-prose">
      <div className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", marginBottom: 2 }}>
        What it costs to try more hypotheses
      </div>
      <div style={{ fontSize: 12, color: "var(--faint)", marginBottom: 10 }}>
        the gap you can still guarantee at {Math.round((1 - DELTA) * 100)}% confidence
      </div>

      <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", maxWidth: 380, height: "auto", display: "block" }}>
        <rect x={X0} y={Y1} width={X1 - X0} height={Y0 - Y1} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />

        {/* the vacuous region: any bound at or above 0.5 promises nothing */}
        <rect x={X0} y={py(EPS_MAX)} width={X1 - X0} height={py(0.5) - py(EPS_MAX)} fill="var(--bad)" fillOpacity={0.07} />
        <line x1={X0} y1={py(0.5)} x2={X1} y2={py(0.5)} stroke="var(--bad)" strokeWidth={1} strokeDasharray="3 3" opacity={0.6} />
        <text x={X0 + 6} y={py(0.5) - 5} fontSize={9.5} fill="var(--bad)" opacity={0.85}>vacuous — ε ≥ 0.5</text>

        <polyline points={pts.join(" ")} fill="none" stroke={accent} strokeWidth={2} />

        <line x1={px(logM)} y1={Y0} x2={px(logM)} y2={py(e)} stroke={accent} strokeWidth={1} strokeDasharray="2 3" opacity={0.5} />
        <circle cx={Number(px(logM).toFixed(2))} cy={Number(py(e).toFixed(2))} r={5} fill="var(--brand-2)" />

        {/* y axis */}
        {[0, 0.4, 0.8].map((v) => (
          <g key={v}>
            <text x={X0 - 6} y={py(v) + 3.5} fontSize={9.5} fill="var(--faint)" textAnchor="end">{v.toFixed(1)}</text>
          </g>
        ))}
        <text x={X0 - 30} y={Y1 + 44} fontSize={9.5} fill="var(--muted)" transform={`rotate(-90 ${X0 - 30} ${Y1 + 44})`}>guaranteed gap ε</text>

        {/* x axis */}
        {[0, 2, 4, 6].map((v) => (
          <text key={v} x={px(v)} y={Y0 + 14} fontSize={9.5} fill="var(--faint)" textAnchor="middle">
            {v === 0 ? "1" : `10^${v}`}
          </text>
        ))}
        <text x={(X0 + X1) / 2} y={Y0 + 27} fontSize={10} fill="var(--muted)" textAnchor="middle">hypotheses tried (M)</text>
      </svg>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 14px", marginTop: 12 }}>
        <label style={{ fontSize: 12, color: "var(--muted)" }}>
          hypotheses M = {M.toLocaleString()}
          <input type="range" min={0} max={LOGM_MAX} step={0.05} value={logM} onChange={(ev) => setLogM(Number(ev.target.value))} style={{ width: "100%", accentColor: accent }} />
        </label>
        <label style={{ fontSize: 12, color: "var(--muted)" }}>
          sample size n = {n.toLocaleString()}
          <input type="range" min={50} max={5000} step={50} value={n} onChange={(ev) => setN(Number(ev.target.value))} style={{ width: "100%", accentColor: accent }} />
        </label>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12, alignItems: "center" }}>
        <Metric label="gap after trying M" value={e.toFixed(3)} accent={vacuous ? "var(--bad)" : "var(--brand-2)"} big />
        <Metric label="if you'd fixed one first" value={e1.toFixed(3)} sub={`M = 1`} />
        <Metric label="the price of searching" value={`×${(e / e1).toFixed(2)}`} sub="log-cheap, never free" />
      </div>
    </div>
  );
}

function Metric({ label, value, sub, accent, big }: { label: string; value: string; sub?: string; accent?: string; big?: boolean }) {
  return (
    <div style={{ background: "var(--surface-2)", borderRadius: 10, padding: "6px 10px", minWidth: 96 }}>
      <div style={{ fontSize: 10.5, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontSize: big ? 19 : 15, fontWeight: 500, color: accent ?? "var(--ink)" }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: "var(--faint)" }}>{sub}</div>}
    </div>
  );
}
