"use client";

import { useState } from "react";

// Error analysis on a real model. Numbers from
// scripts/data_workflow_cases.py section 6: load_digits, 70/30 stratified split
// (RS=0), StandardScaler + logistic regression. Overall test accuracy 0.9722 on
// 540 rows -- 15 errors in total.
//
// Plotted as ERROR RATE, not accuracy, for two reasons: the axis can start at a
// true zero instead of a flattering 0.85, and it puts the reader in the right
// frame -- you are not admiring a score, you are hunting for where the mistakes
// went. Slice counts are the real ones; the error counts are derived from them,
// so the three slicings each sum to the same 15.
//
// The pedagogy is the CONTRAST between the three slicings. Two of them are
// nearly flat. That is not a flaw in the demo -- most slices are null, and a
// reader who has only ever seen the slice that works learns the wrong lesson
// about how much searching this takes.

type Slice = { name: string; n: number; acc: number; note?: string };
type Slicing = { key: string; label: string; blurb: string; slices: Slice[] };

const OVERALL = 0.9722;
const TOTAL_N = 540;

const SLICINGS: Slicing[] = [
  {
    key: "conf",
    label: "the model's own confidence",
    blurb: "quartiles of max predicted probability — needs no extra data at all",
    slices: [
      { name: "lowest", n: 135, acc: 0.8963, note: "mean conf 0.82" },
      { name: "Q2", n: 135, acc: 0.9926, note: "mean conf 0.99" },
      { name: "Q3", n: 135, acc: 1.0, note: "mean conf 1.00" },
      { name: "highest", n: 135, acc: 1.0, note: "mean conf 1.00" },
    ],
  },
  {
    key: "digit",
    label: "the true label",
    blurb: "which classes the model actually struggles to recognise",
    slices: [
      { name: "0", n: 54, acc: 1.0 },
      { name: "1", n: 55, acc: 0.9818, note: "mistaken for 8" },
      { name: "2", n: 53, acc: 0.9811, note: "mistaken for 1" },
      { name: "3", n: 55, acc: 0.9636, note: "mistaken for 5" },
      { name: "4", n: 54, acc: 0.9630, note: "mistaken for 1" },
      { name: "5", n: 55, acc: 0.9636, note: "mistaken for 1" },
      { name: "6", n: 54, acc: 0.9815, note: "mistaken for 1" },
      { name: "7", n: 54, acc: 1.0 },
      { name: "8", n: 52, acc: 0.9231, note: "mistaken for 1" },
      { name: "9", n: 54, acc: 0.9630, note: "mistaken for 3" },
    ],
  },
  {
    key: "ink",
    label: "total ink on the card",
    blurb: "quartiles of summed pixel intensity — a plausible-sounding hunch",
    slices: [
      { name: "faintest", n: 135, acc: 0.9630 },
      { name: "Q2", n: 134, acc: 0.9851 },
      { name: "Q3", n: 136, acc: 0.9632 },
      { name: "boldest", n: 135, acc: 0.9778 },
    ],
  },
];

const errs = (s: Slice) => Math.round(s.n * (1 - s.acc));
const VW = 400, VH = 175, PD = { l: 40, r: 12, t: 14, b: 40 };
const X0 = PD.l, X1 = VW - PD.r, Y0 = VH - PD.b, Y1 = PD.t;
const YMAX = 0.12;
const py = (r: number) => Y0 - (r / YMAX) * (Y0 - Y1);

export function ErrorAnalysisLab() {
  const [key, setKey] = useState("conf");
  const [pick, setPick] = useState<number | null>(null);
  const accent = "var(--c-metrics)";

  const sl = SLICINGS.find((s) => s.key === key)!;
  const bw = (X1 - X0) / sl.slices.length;
  const totalErrs = sl.slices.reduce((n, s) => n + errs(s), 0);
  const worstIdx = sl.slices.reduce((b, s, i) => (1 - s.acc > 1 - sl.slices[b].acc ? i : b), 0);
  const idx = pick != null && pick < sl.slices.length ? pick : worstIdx;
  const s = sl.slices[idx];
  const share = errs(s) / totalErrs;
  const cover = s.n / TOTAL_N;
  // A slice is worth acting on when it concentrates errors -- lots of the
  // mistakes inside a small slice of the traffic.
  const lift = share / cover;

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.6rem 0" }} className="not-prose">
      <div className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", marginBottom: 2 }}>
        Where did the {totalErrs} mistakes go?
      </div>
      <div style={{ fontSize: 12, color: "var(--faint)", marginBottom: 10 }}>
        overall accuracy {OVERALL.toFixed(4)} on {TOTAL_N} test rows · sliced by {sl.blurb}
      </div>

      <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", maxWidth: VW, height: "auto", display: "block" }}>
        <rect x={X0} y={Y1} width={X1 - X0} height={Y0 - Y1} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />

        {/* the headline number, as a line every bar is judged against */}
        <line x1={X0} y1={py(1 - OVERALL)} x2={X1} y2={py(1 - OVERALL)} stroke="var(--muted)" strokeWidth={1.4} strokeDasharray="4 4" />
        <text x={X1 - 4} y={py(1 - OVERALL) - 5} fontSize={9} fill="var(--muted)" textAnchor="end">
          overall {(1 - OVERALL).toFixed(4)}
        </text>

        {sl.slices.map((sx, k) => {
          const r = 1 - sx.acc;
          const h = Math.max(0, py(0) - py(r));
          const on = k === idx;
          return (
            <g key={sx.name} onClick={() => setPick(k)} style={{ cursor: "pointer" }}>
              <rect x={Number((X0 + k * bw).toFixed(2))} y={Y1} width={Number(bw.toFixed(2))} height={Y0 - Y1} fill="transparent" />
              <rect
                x={Number((X0 + k * bw + 2).toFixed(2))}
                y={Number((Y0 - h).toFixed(2))}
                width={Number((bw - 4).toFixed(2))}
                height={Number(h.toFixed(2))}
                rx={2}
                fill={on ? "var(--bad)" : accent}
                opacity={on ? 0.9 : 0.5}
              />
              <text x={Number((X0 + (k + 0.5) * bw).toFixed(2))} y={Y0 + 13} fontSize={9} fill={on ? "var(--ink)" : "var(--faint)"} textAnchor="middle">
                {sx.name}
              </text>
            </g>
          );
        })}

        {[0, 0.04, 0.08, 0.12].map((v) => (
          <text key={v} x={X0 - 5} y={py(v) + 3.5} fontSize={9} fill="var(--faint)" textAnchor="end">{v.toFixed(2)}</text>
        ))}
        <text x={X0 - 32} y={Y1 + 40} fontSize={9.5} fill="var(--muted)" transform={`rotate(-90 ${X0 - 32} ${Y1 + 40})`}>error rate</text>
        <text x={(X0 + X1) / 2} y={Y0 + 30} fontSize={10} fill="var(--muted)" textAnchor="middle">click a bar to inspect that slice</text>
      </svg>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
        {SLICINGS.map((x) => (
          <button
            key={x.key}
            onClick={() => { setKey(x.key); setPick(null); }}
            style={{
              background: key === x.key ? `color-mix(in srgb, ${accent} 15%, var(--surface))` : "transparent",
              color: key === x.key ? "var(--ink)" : "var(--muted)",
              border: `1px solid ${key === x.key ? `color-mix(in srgb, ${accent} 40%, var(--border))` : "var(--border-strong)"}`,
              fontSize: 12, padding: "5px 10px", borderRadius: 8, cursor: "pointer",
            }}
          >
            {x.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
        <Metric label={`slice "${s.name}"`} value={`${(share * 100).toFixed(0)}%`} accent={lift > 2 ? "var(--bad)" : "var(--ink)"} sub={`of all errors — ${errs(s)} of ${totalErrs}`} big />
        <Metric label="share of traffic" value={`${(cover * 100).toFixed(0)}%`} sub={s.note ?? `${s.n} rows`} />
        <Metric
          label="verdict"
          value={lift > 2 ? "act on this" : "null slice"}
          accent={lift > 2 ? "var(--good)" : "var(--muted)"}
          sub={lift > 2 ? `${lift.toFixed(1)}× the errors you'd expect` : "errors are spread evenly"}
        />
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
