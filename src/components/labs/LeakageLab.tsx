"use client";

import { useState } from "react";

// Preprocessing leakage, measured. Every number is from
// scripts/data_workflow_cases.py section 2: n=100 rows, p pure-noise features,
// labels are coin flips, SelectKBest(k=20) + logistic regression, 5-fold
// StratifiedKFold, averaged over 10 independent label draws.
//
// The data contains NO signal whatsoever, so the true accuracy of any model
// here is exactly 0.500 and every point above that line is manufactured. That
// is what makes this the honest version of the demo: there is no arguing about
// how much of the score was "real".

const PS = [50, 200, 500, 1000, 2000, 5000];
const LEAKY = [0.6360, 0.7350, 0.8010, 0.8280, 0.8770, 0.8780];
const HONEST = [0.5010, 0.5280, 0.4870, 0.4960, 0.5060, 0.4950];
const TRUTH = 0.5;

const VW = 380, VH = 190, PD = { l: 40, r: 12, t: 14, b: 34 };
const X0 = PD.l, X1 = VW - PD.r, Y0 = VH - PD.b, Y1 = PD.t;
// log-x, because the interesting range spans two orders of magnitude
const lg = (p: number) => Math.log10(p);
const px = (p: number) => X0 + ((lg(p) - lg(PS[0])) / (lg(PS[PS.length - 1]) - lg(PS[0]))) * (X1 - X0);
const py = (a: number) => Y0 - ((a - 0.4) / 0.55) * (Y0 - Y1);
const line = (ys: number[]) => ys.map((a, k) => `${px(PS[k]).toFixed(2)},${py(a).toFixed(2)}`).join(" ");

export function LeakageLab() {
  const [i, setI] = useState(4);
  const [leaky, setLeaky] = useState(true);
  const accent = "var(--c-metrics)";

  const reported = leaky ? LEAKY[i] : HONEST[i];
  const invented = reported - TRUTH;

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.6rem 0" }} className="not-prose">
      <div className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", marginBottom: 2 }}>
        Cross-validating a dataset with no signal in it
      </div>
      <div style={{ fontSize: 12, color: "var(--faint)", marginBottom: 10 }}>
        100 rows · {PS[i].toLocaleString()} pure-noise features · labels are coin flips
      </div>

      {/* where the feature selector gets fitted -- the whole argument in one strip */}
      <div style={{ display: "flex", gap: 3, marginBottom: 4 }}>
        {[0, 1, 2, 3, 4].map((f) => (
          <div key={f} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
            <div
              style={{
                height: 15, borderRadius: 4, fontSize: 8.5, lineHeight: "15px", textAlign: "center",
                color: f === 2 ? "var(--cta-text)" : "var(--muted)",
                background: f === 2 ? "var(--ink)" : "var(--surface-2)",
              }}
            >
              {f === 2 ? "test" : "train"}
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          height: 17, borderRadius: 4, fontSize: 9, lineHeight: "17px", textAlign: "center",
          marginBottom: 12,
          width: leaky ? "100%" : "80%",
          transition: "width 320ms cubic-bezier(0.2,0.7,0.2,1), background 320ms",
          background: leaky ? "color-mix(in srgb, var(--bad) 22%, var(--surface))" : "color-mix(in srgb, var(--good) 22%, var(--surface))",
          color: leaky ? "var(--bad)" : "var(--good)",
          border: `1px solid ${leaky ? "color-mix(in srgb, var(--bad) 45%, var(--border))" : "color-mix(in srgb, var(--good) 45%, var(--border))"}`,
        }}
      >
        {leaky ? "the selector saw every row, test included" : "the selector saw only the training rows"}
      </div>

      <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", maxWidth: VW, height: "auto", display: "block" }}>
        <rect x={X0} y={Y1} width={X1 - X0} height={Y0 - Y1} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />

        {/* the truth: 0.500, because the labels are coin flips */}
        <line x1={X0} y1={py(TRUTH)} x2={X1} y2={py(TRUTH)} stroke="var(--muted)" strokeWidth={1.5} strokeDasharray="4 4" />
        <text x={X1 - 4} y={py(TRUTH) - 5} fontSize={9} fill="var(--muted)" textAnchor="end">truth = 0.500</text>

        {/* the shaded area between the reported curve and the truth is invented */}
        <polygon
          points={`${px(PS[0]).toFixed(2)},${py(TRUTH).toFixed(2)} ${line(leaky ? LEAKY : HONEST)} ${px(PS[PS.length - 1]).toFixed(2)},${py(TRUTH).toFixed(2)}`}
          fill={leaky ? "var(--bad)" : "var(--good)"}
          opacity={0.14}
        />

        <polyline points={line(LEAKY)} fill="none" stroke="var(--bad)" strokeWidth={leaky ? 2.5 : 1} opacity={leaky ? 1 : 0.3} />
        <polyline points={line(HONEST)} fill="none" stroke="var(--good)" strokeWidth={leaky ? 1 : 2.5} opacity={leaky ? 0.3 : 1} />

        <circle cx={Number(px(PS[i]).toFixed(2))} cy={Number(py(reported).toFixed(2))} r={5} fill={leaky ? "var(--bad)" : "var(--good)"} />

        {[0.4, 0.5, 0.6, 0.7, 0.8, 0.9].map((v) => (
          <text key={v} x={X0 - 6} y={py(v) + 3.5} fontSize={9.5} fill="var(--faint)" textAnchor="end">{v.toFixed(1)}</text>
        ))}
        <text x={X0 - 30} y={Y1 + 44} fontSize={9.5} fill="var(--muted)" transform={`rotate(-90 ${X0 - 30} ${Y1 + 44})`}>reported CV</text>
        {PS.map((p) => (
          <text key={p} x={px(p)} y={Y0 + 13} fontSize={8.5} fill="var(--faint)" textAnchor="middle">{p}</text>
        ))}
        <text x={(X0 + X1) / 2} y={Y0 + 26} fontSize={10} fill="var(--muted)" textAnchor="middle">features offered to the selector</text>
      </svg>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
        {[
          { v: true, label: "Select features, then cross-validate" },
          { v: false, label: "Selector inside the pipeline" },
        ].map((b) => (
          <button
            key={String(b.v)}
            onClick={() => setLeaky(b.v)}
            style={{
              background: leaky === b.v ? `color-mix(in srgb, ${accent} 15%, var(--surface))` : "transparent",
              color: leaky === b.v ? "var(--ink)" : "var(--muted)",
              border: `1px solid ${leaky === b.v ? `color-mix(in srgb, ${accent} 40%, var(--border))` : "var(--border-strong)"}`,
              fontSize: 12, padding: "5px 10px", borderRadius: 8, cursor: "pointer",
            }}
          >
            {b.label}
          </button>
        ))}
      </div>

      <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginTop: 10 }}>
        features offered to the selector: {PS[i].toLocaleString()}
        <input type="range" min={0} max={PS.length - 1} step={1} value={i} onChange={(e) => setI(Number(e.target.value))} style={{ width: "100%", accentColor: accent }} />
      </label>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
        <Metric label="reported CV accuracy" value={reported.toFixed(4)} accent={leaky ? "var(--bad)" : "var(--good)"} big />
        <Metric label="true accuracy" value={TRUTH.toFixed(4)} />
        <Metric
          label="manufactured out of nothing"
          value={`${invented >= 0 ? "+" : ""}${invented.toFixed(4)}`}
          accent={invented > 0.05 ? "var(--bad)" : "var(--muted)"}
          sub={invented > 0.05 ? "none of this is real" : "within CV noise of chance"}
        />
      </div>
    </div>
  );
}

function Metric({ label, value, sub, accent, big }: { label: string; value: string; sub?: string; accent?: string; big?: boolean }) {
  return (
    <div style={{ background: "var(--surface-2)", borderRadius: 10, padding: "6px 10px", minWidth: 96 }}>
      <div style={{ fontSize: 10.5, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontSize: big ? 19 : 13.5, fontWeight: 500, color: accent ?? "var(--ink)" }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: "var(--faint)" }}>{sub}</div>}
    </div>
  );
}
