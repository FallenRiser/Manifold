"use client";

import { useState } from "react";

// Life after deployment, measured. Numbers from
// scripts/data_workflow_cases.py section 8: a logistic model trained on 6,000
// rows, then scored on 4,000-row monthly batches. Two scenarios, each moving
// exactly one thing:
//
//   A. COVARIATE SHIFT -- P(x) moves along a direction ORTHOGONAL to the
//      decision rule, so P(y|x) is untouched. The input monitor climbs to 0.98;
//      accuracy does not move.
//   B. CONCEPT DRIFT -- P(x) is identical every month, but the weight on the
//      dominant feature reverses. Accuracy falls 0.825 -> 0.262; the input
//      monitor never leaves the noise floor.
//
// The point is the 2x2, not either row of it: the label-free monitor and the
// accuracy metric are blind to different failures, so neither substitutes for
// the other. That is why "we monitor for drift" is not an answer to "how would
// you know if it broke".

type Scen = "cov" | "concept";

const MONTHS = [0, 1, 2, 3, 4];
const DATA: Record<Scen, { label: string; knob: string; knobs: number[]; acc: number[]; mon: number[]; }> = {
  cov: {
    label: "Covariate shift",
    knob: "input shift",
    knobs: [0.0, 0.3, 0.6, 1.0, 1.5],
    acc: [0.8107, 0.8120, 0.8100, 0.8063, 0.8155],
    mon: [0.0223, 0.1901, 0.3818, 0.6275, 0.9759],
  },
  concept: {
    label: "Concept drift",
    knob: "rule change",
    knobs: [0.0, 0.25, 0.5, 0.75, 1.0],
    acc: [0.8250, 0.7255, 0.5495, 0.3558, 0.2615],
    mon: [0.0274, 0.0421, 0.0262, 0.0382, 0.0220],
  },
};

const ALARM = 0.25;   // the input monitor's threshold, in training SDs

const VW = 400, VH = 190, PD = { l: 36, r: 40, t: 14, b: 36 };
const X0 = PD.l, X1 = VW - PD.r, Y0 = VH - PD.b, Y1 = PD.t;
const MONMAX = 1.6;
const px = (m: number) => X0 + (m / (MONTHS.length - 1)) * (X1 - X0);
const pyA = (a: number) => Y0 - a * (Y0 - Y1);
const pyM = (v: number) => Y0 - (v / MONMAX) * (Y0 - Y1);
const line = (ys: number[], f: (n: number) => number) =>
  ys.map((v, k) => `${px(k).toFixed(2)},${f(v).toFixed(2)}`).join(" ");

export function DriftLab() {
  const [scen, setScen] = useState<Scen>("cov");
  const [m, setM] = useState(4);
  const accent = "var(--c-metrics)";
  const d = DATA[scen];

  const acc = d.acc[m];
  const mon = d.mon[m];
  const drop = d.acc[0] - acc;
  const fired = mon > ALARM;
  const broken = drop > 0.05;
  const verdict = fired && broken ? "caught it" : fired && !broken ? "false alarm" : !fired && broken ? "missed it" : "quiet, and fine";
  const vColor = fired && broken ? "var(--good)" : broken ? "var(--bad)" : fired ? "var(--warn)" : "var(--muted)";

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.6rem 0" }} className="not-prose">
      <div className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", marginBottom: 2 }}>
        Would your monitoring have caught it?
      </div>
      <div style={{ fontSize: 12, color: "var(--faint)", marginBottom: 8 }}>
        one model, five monthly batches of 4,000 rows · {d.label.toLowerCase()}, {d.knob} = {d.knobs[m].toFixed(2)}
      </div>
      <div style={{ display: "flex", gap: 14, fontSize: 11, marginBottom: 8 }}>
        <span style={{ color: "var(--brand-2)" }}>▬ accuracy (needs labels)</span>
        <span style={{ color: "var(--warn)" }}>▬ input monitor (free)</span>
      </div>

      <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", maxWidth: VW, height: "auto", display: "block" }}>
        <rect x={X0} y={Y1} width={X1 - X0} height={Y0 - Y1} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />

        <line x1={X0} y1={pyM(ALARM)} x2={X1} y2={pyM(ALARM)} stroke="var(--warn)" strokeWidth={1.2} strokeDasharray="3 4" opacity={0.7} />
        <text x={X0 + 4} y={pyM(ALARM) - 4} fontSize={8.5} fill="var(--warn)">alert threshold</text>

        <line x1={px(m)} y1={Y1} x2={px(m)} y2={Y0} stroke={accent} strokeWidth={5} opacity={0.16} />

        <polyline points={line(d.acc, pyA)} fill="none" stroke="var(--brand-2)" strokeWidth={2.5} />
        <polyline points={line(d.mon, pyM)} fill="none" stroke="var(--warn)" strokeWidth={2.5} />

        {MONTHS.map((k) => (
          <g key={k}>
            <circle cx={Number(px(k).toFixed(2))} cy={Number(pyA(d.acc[k]).toFixed(2))} r={k === m ? 4.5 : 3} fill="var(--brand-2)" />
            <circle cx={Number(px(k).toFixed(2))} cy={Number(pyM(d.mon[k]).toFixed(2))} r={k === m ? 4.5 : 3} fill="var(--warn)" />
            <text x={px(k)} y={Y0 + 13} fontSize={9} fill="var(--faint)" textAnchor="middle">{k}</text>
          </g>
        ))}

        {[0, 0.5, 1].map((v) => (
          <text key={v} x={X0 - 5} y={pyA(v) + 3.5} fontSize={9} fill="var(--brand-2)" textAnchor="end">{v.toFixed(1)}</text>
        ))}
        {[0, 0.8, 1.6].map((v) => (
          <text key={v} x={X1 + 5} y={pyM(v) + 3.5} fontSize={9} fill="var(--warn)" textAnchor="start">{v.toFixed(1)}</text>
        ))}
        <text x={(X0 + X1) / 2} y={Y0 + 27} fontSize={10} fill="var(--muted)" textAnchor="middle">months since launch</text>
      </svg>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
        {(["cov", "concept"] as Scen[]).map((k) => (
          <button
            key={k}
            onClick={() => setScen(k)}
            style={{
              background: scen === k ? `color-mix(in srgb, ${accent} 15%, var(--surface))` : "transparent",
              color: scen === k ? "var(--ink)" : "var(--muted)",
              border: `1px solid ${scen === k ? `color-mix(in srgb, ${accent} 40%, var(--border))` : "var(--border-strong)"}`,
              fontSize: 12, padding: "5px 10px", borderRadius: 8, cursor: "pointer",
            }}
          >
            {DATA[k].label}
          </button>
        ))}
      </div>

      <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginTop: 10 }}>
        month {m}
        <input type="range" min={0} max={MONTHS.length - 1} step={1} value={m} onChange={(e) => setM(Number(e.target.value))} style={{ width: "100%", accentColor: accent }} />
      </label>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
        <Metric label="accuracy" value={acc.toFixed(4)} accent={broken ? "var(--bad)" : "var(--ink)"} sub={`${drop >= 0 ? "−" : "+"}${Math.abs(drop).toFixed(4)} since launch`} big />
        <Metric label="input monitor" value={mon.toFixed(4)} accent={fired ? "var(--warn)" : "var(--ink)"} sub={fired ? "ALERT firing" : "quiet"} />
        <Metric label="verdict" value={verdict} accent={vColor} sub={fired && !broken ? "the pager went off for nothing" : !fired && broken ? "nothing told you" : undefined} />
      </div>
    </div>
  );
}

function Metric({ label, value, sub, accent, big }: { label: string; value: string; sub?: string; accent?: string; big?: boolean }) {
  return (
    <div style={{ background: "var(--surface-2)", borderRadius: 10, padding: "6px 10px", minWidth: 100 }}>
      <div style={{ fontSize: 10.5, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontSize: big ? 19 : 13.5, fontWeight: 500, color: accent ?? "var(--ink)" }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: "var(--faint)" }}>{sub}</div>}
    </div>
  );
}
