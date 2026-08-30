"use client";

import { useState } from "react";

// Simpson's paradox, on the exact points from scripts/data_workflow_cases.py
// section 7 (numpy default_rng(0), 4 groups x 60 points, rounded to 2dp for
// transport). The slopes below are NOT hardcoded -- the component runs its own
// least-squares fit on these points, so what the reader sees is computed from
// the data in front of them and cannot drift away from the prose.
//
// The lesson is a hard one to get from a sentence: the pooled trend is not a
// blurry version of the group trends, it is the OPPOSITE of every one of them.
// Aggregation is not neutral.

const GROUPS: [number, number][][] = [
  [[2.07,11.50],[1.93,11.13],[2.35,12.49],[2.06,11.47],[1.71,11.48],[2.20,11.67],[2.72,12.73],[2.52,12.48],[1.61,11.51],[1.30,10.27],[1.66,11.34],[2.02,11.86],[0.72,10.93],[1.88,11.29],[1.31,11.69],[1.60,10.82],[1.70,11.13],[1.83,11.79],[2.23,11.80],[2.57,12.76],[1.93,11.61],[2.75,11.98],[1.63,11.18],[2.19,11.37],[2.50,11.55],[2.05,11.86],[1.59,11.48],[1.49,11.65],[1.75,11.13],[2.12,12.29],[1.44,11.06],[1.88,12.06],[1.91,11.38],[2.30,11.58],[2.12,11.78],[2.20,12.12],[1.64,11.37],[1.93,11.34],[2.43,11.48],[2.82,11.77],[1.31,11.22],[2.83,12.61],[2.74,12.13],[2.43,11.57],[2.15,12.02],[1.83,11.01],[2.80,11.99],[3.08,12.68],[2.99,11.61],[2.72,12.31],[2.20,11.55],[1.34,11.11],[2.00,11.57],[2.36,11.96],[1.29,11.28],[2.22,11.51],[2.24,12.29],[2.38,12.16],[1.35,11.37],[1.64,11.72]],
  [[4.63,9.63],[4.66,9.37],[4.24,9.61],[3.42,8.66],[4.13,9.15],[3.78,9.20],[3.42,8.57],[4.34,9.96],[3.89,9.23],[3.63,8.74],[3.63,8.22],[4.35,9.02],[4.40,9.90],[4.93,9.92],[4.19,9.25],[4.77,10.39],[4.97,9.53],[4.83,9.66],[2.90,8.15],[4.88,10.11],[4.39,9.28],[4.43,9.33],[4.40,8.96],[4.41,9.78],[4.38,9.78],[4.00,9.04],[3.15,8.58],[4.14,8.86],[3.76,8.84],[4.79,10.32],[4.04,9.28],[4.25,10.21],[3.73,8.71],[3.92,9.34],[4.19,9.29],[3.38,8.90],[4.37,9.49],[4.14,9.12],[3.55,8.53],[2.88,9.38],[4.48,9.56],[4.04,8.52],[3.91,8.90],[4.07,9.49],[5.20,9.98],[4.17,9.81],[4.25,9.75],[3.38,8.65],[5.11,9.92],[4.70,9.41],[4.79,9.58],[4.23,8.87],[4.70,10.18],[4.40,10.08],[4.54,9.19],[4.12,8.88],[3.39,8.09],[4.77,9.48],[3.14,7.42],[4.07,8.85]],
  [[7.11,8.11],[6.21,7.19],[6.87,7.69],[6.13,5.58],[7.37,7.99],[6.51,7.20],[6.19,6.90],[7.80,8.02],[6.22,7.00],[5.73,6.73],[6.51,7.12],[6.38,6.94],[6.99,8.02],[5.89,6.33],[6.84,7.83],[6.87,7.56],[6.03,6.54],[6.49,7.09],[5.94,6.43],[7.69,8.39],[6.01,6.93],[6.15,6.73],[5.81,6.27],[6.21,7.07],[6.40,7.45],[6.82,7.42],[6.06,7.00],[6.30,6.91],[5.62,6.52],[5.94,6.65],[7.92,8.44],[6.97,7.05],[5.97,7.00],[5.66,6.45],[5.86,6.82],[6.39,6.99],[6.42,7.25],[5.99,6.42],[5.69,6.97],[7.18,7.15],[6.65,6.96],[6.19,7.04],[6.28,7.53],[6.11,6.98],[4.79,5.74],[6.46,6.67],[5.81,6.58],[5.85,6.67],[6.05,7.43],[6.80,7.66],[5.76,6.07],[5.61,7.20],[6.75,7.26],[6.81,7.14],[5.87,7.21],[6.71,7.35],[6.24,6.86],[6.57,7.33],[5.71,6.86],[6.86,7.83]],
  [[7.84,3.75],[9.70,6.24],[9.12,5.68],[8.39,4.61],[8.15,5.26],[8.07,4.33],[8.67,4.54],[8.24,4.54],[8.18,4.92],[9.05,4.91],[8.80,5.72],[8.38,4.39],[9.00,5.54],[9.35,5.67],[8.00,4.34],[8.27,4.99],[9.12,4.77],[9.00,5.67],[8.72,4.96],[9.24,5.20],[8.00,4.66],[7.79,4.60],[8.12,4.77],[8.67,5.63],[8.16,4.91],[8.33,5.11],[8.06,4.26],[8.26,4.64],[8.05,4.63],[8.80,5.04],[9.04,5.34],[8.34,4.82],[8.49,5.08],[8.28,4.59],[8.89,4.99],[8.65,4.63],[9.48,5.27],[8.00,4.81],[8.80,5.01],[8.84,5.35],[8.40,4.27],[8.92,4.46],[7.81,3.88],[9.77,6.21],[7.86,4.66],[9.11,5.40],[7.98,4.11],[9.23,5.34],[8.39,4.61],[8.69,4.83],[8.63,4.03],[9.21,5.06],[8.42,4.67],[6.97,4.11],[8.18,4.60],[8.70,5.45],[8.36,4.55],[9.02,5.13],[9.16,3.96],[8.52,4.98]],
];

const LABELS = ["clinic A", "clinic B", "clinic C", "clinic D"];
const HUES = ["var(--c-regression)", "var(--c-trees)", "var(--c-classification)", "var(--c-dimred)"];

function fit(pts: [number, number][]) {
  const n = pts.length;
  const mx = pts.reduce((s, p) => s + p[0], 0) / n;
  const my = pts.reduce((s, p) => s + p[1], 0) / n;
  let num = 0, den = 0;
  for (const [x, y] of pts) { num += (x - mx) * (y - my); den += (x - mx) ** 2; }
  const slope = num / den;
  return { slope, intercept: my - slope * mx };
}

const ALL = GROUPS.flat();
const POOLED = fit(ALL);
const PER = GROUPS.map(fit);

const VW = 400, VH = 250, PD = { l: 38, r: 12, t: 14, b: 32 };
const X0 = PD.l, X1 = VW - PD.r, Y0 = VH - PD.b, Y1 = PD.t;
const XMIN = 0, XMAX = 10.5, YMIN = 3, YMAX = 13.5;
const px = (x: number) => X0 + ((x - XMIN) / (XMAX - XMIN)) * (X1 - X0);
const py = (y: number) => Y0 - ((y - YMIN) / (YMAX - YMIN)) * (Y0 - Y1);
const seg = (f: { slope: number; intercept: number }, a: number, b: number) =>
  `${px(a).toFixed(2)},${py(f.slope * a + f.intercept).toFixed(2)} ${px(b).toFixed(2)},${py(f.slope * b + f.intercept).toFixed(2)}`;

export function SimpsonsParadoxLab() {
  const [split, setSplit] = useState(false);
  const accent = "var(--c-metrics)";

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.6rem 0" }} className="not-prose">
      <div className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", marginBottom: 2 }}>
        Does more treatment time improve the outcome?
      </div>
      <div style={{ fontSize: 12, color: "var(--faint)", marginBottom: 10 }}>
        240 patients across four clinics · the same points, drawn two ways
      </div>

      <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", maxWidth: VW, height: "auto", display: "block" }}>
        <rect x={X0} y={Y1} width={X1 - X0} height={Y0 - Y1} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />

        {GROUPS.map((g, i) =>
          g.map(([x, y], j) => (
            <circle
              key={`${i}-${j}`}
              cx={Number(px(x).toFixed(2))}
              cy={Number(py(y).toFixed(2))}
              r={2.4}
              fill={split ? HUES[i] : "var(--muted)"}
              opacity={split ? 0.75 : 0.5}
            />
          )),
        )}

        {/* the pooled fit: present in both views, so the reader can see it is the
            SAME line, contradicting every group line drawn beside it */}
        <polyline
          points={seg(POOLED, 1.0, 9.8)}
          fill="none"
          stroke="var(--bad)"
          strokeWidth={2.5}
          strokeDasharray={split ? "5 4" : undefined}
          opacity={split ? 0.55 : 1}
        />

        {split &&
          GROUPS.map((g, i) => {
            const xs = g.map((p) => p[0]);
            return (
              <polyline
                key={i}
                points={seg(PER[i], Math.min(...xs), Math.max(...xs))}
                fill="none"
                stroke={HUES[i]}
                strokeWidth={2.5}
              />
            );
          })}

        {[4, 6, 8, 10, 12].map((v) => (
          <text key={v} x={X0 - 6} y={py(v) + 3.5} fontSize={9.5} fill="var(--faint)" textAnchor="end">{v}</text>
        ))}
        <text x={X0 - 28} y={Y1 + 58} fontSize={9.5} fill="var(--muted)" transform={`rotate(-90 ${X0 - 28} ${Y1 + 58})`}>outcome score</text>
        {[0, 2, 4, 6, 8, 10].map((v) => (
          <text key={v} x={px(v)} y={Y0 + 13} fontSize={9} fill="var(--faint)" textAnchor="middle">{v}</text>
        ))}
        <text x={(X0 + X1) / 2} y={Y0 + 26} fontSize={10} fill="var(--muted)" textAnchor="middle">hours of treatment</text>
      </svg>

      <button
        onClick={() => setSplit((s) => !s)}
        style={{
          marginTop: 10,
          background: `color-mix(in srgb, ${accent} 15%, var(--surface))`,
          color: "var(--ink)",
          border: `1px solid color-mix(in srgb, ${accent} 40%, var(--border))`,
          fontSize: 12.5, padding: "6px 12px", borderRadius: 8, cursor: "pointer",
        }}
      >
        {split ? "← Pool the clinics back together" : "Split by clinic →"}
      </button>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12, alignItems: "flex-start" }}>
        <div style={{ background: "var(--surface-2)", borderRadius: 10, padding: "6px 10px", minWidth: 120 }}>
          <div style={{ fontSize: 10.5, color: "var(--muted)" }}>pooled slope</div>
          <div style={{ fontSize: 19, fontWeight: 500, color: "var(--bad)" }}>{POOLED.slope.toFixed(2)}</div>
          <div style={{ fontSize: 10, color: "var(--faint)" }}>more hours, worse outcome</div>
        </div>
        {split &&
          PER.map((f, i) => (
            <div key={i} style={{ background: "var(--surface-2)", borderRadius: 10, padding: "6px 10px", minWidth: 78 }}>
              <div style={{ fontSize: 10.5, color: "var(--muted)" }}>{LABELS[i]}</div>
              <div style={{ fontSize: 15, fontWeight: 500, color: HUES[i] }}>+{f.slope.toFixed(2)}</div>
            </div>
          ))}
      </div>

      {split && (
        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 10, lineHeight: 1.55 }}>
          Every clinic helps. Sicker patients go to the clinics that give more hours — so
          &ldquo;hours&rdquo; is partly a measure of <em>how sick you were to begin with</em>.
        </div>
      )}
    </div>
  );
}
