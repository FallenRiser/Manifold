"use client";

import { useMemo, useState } from "react";

// Rademacher complexity, computed rather than described.
//
// The definition is: draw random +-1 "coin flip" labels sigma, then measure how
// well the best member of your class can correlate with them.
//
//     Rhat(H) = E_sigma [ max over h in H of (1/n) sum_i sigma_i h(x_i) ]
//
// A class that can only paint simple patterns cannot chase noise, so the
// correlation stays low. A class rich enough to shatter the points hits 1.000
// every time -- it fits any noise perfectly, and therefore its training score
// tells you nothing.
//
// The class here is "labelings with at most s sign changes" along a line, which
// is exactly unions of intervals: s = 1 is a threshold classifier, s = 3 is two
// intervals, and s = n-1 shatters. Capacity is one honest slider.
//
// The inner maximisation is EXACT (dynamic programming over sign changes), and
// the outer expectation is averaged over 200 fixed draws, so the reported
// number is the real empirical Rademacher complexity of this class on these
// points -- self-verifying, nothing asserted that the lab doesn't compute.

function mulberry32(a: number) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const N = 14;
const TRIALS = 200;
const NEG_INF = -1e9;

// Best achievable correlation with sigma, over labelings with <= s sign
// changes. dp[c][sign] = best running sum. Exact, O(n * s).
function bestCorrelation(sigma: number[], s: number): { value: number; labels: number[] } {
  const n = sigma.length;
  const val = (si: number) => (si === 1 ? 1 : -1);

  // dp[c][si] = best running sum over the first i points, having spent exactly
  // c sign changes and currently sitting on sign si. path[c][si] is the
  // labeling that achieved it.
  let dp: number[][] = [];
  let path: number[][][] = [];
  for (let c = 0; c <= s; c++) {
    dp.push([NEG_INF, NEG_INF]);
    path.push([[], []]);
  }
  for (let si = 0; si < 2; si++) {
    dp[0][si] = sigma[0] * val(si);   // no changes spent yet at the first point
    path[0][si] = [si];
  }

  for (let i = 1; i < n; i++) {
    const ndp: number[][] = [];
    const npath: number[][][] = [];
    for (let c = 0; c <= s; c++) { ndp.push([NEG_INF, NEG_INF]); npath.push([[], []]); }

    for (let c = 0; c <= s; c++) {
      for (let si = 0; si < 2; si++) {
        // hold the current sign (free), or flip into it (costs one change)
        let best = dp[c][si];
        let from = path[c][si];
        if (c > 0 && dp[c - 1][1 - si] > best) {
          best = dp[c - 1][1 - si];
          from = path[c - 1][1 - si];
        }
        if (best <= NEG_INF / 2) continue;
        ndp[c][si] = best + sigma[i] * val(si);
        npath[c][si] = from.concat(si);
      }
    }
    dp = ndp;
    path = npath;
  }

  let bestV = NEG_INF, bestPath: number[] = [];
  for (let c = 0; c <= s; c++) {
    for (let si = 0; si < 2; si++) {
      if (dp[c][si] > bestV) { bestV = dp[c][si]; bestPath = path[c][si]; }
    }
  }
  return { value: bestV / n, labels: bestPath.map((si) => val(si)) };
}

const VW = 380, VH = 150;
const X0 = 24, X1 = VW - 24;
const AX = 96, TOP = 44;
const xAt = (i: number) => X0 + (i / (N - 1)) * (X1 - X0);

export function RademacherLab() {
  const [s, setS] = useState(1);
  const [seed, setSeed] = useState(3);

  const accent = "var(--c-metrics)";
  const POS = "var(--ink)";
  const NEG = "var(--brand-2)";

  const sigma = useMemo(() => {
    const rand = mulberry32(seed);
    return Array.from({ length: N }, () => (rand() < 0.5 ? -1 : 1));
  }, [seed]);

  const fit = bestCorrelation(sigma, s);

  // The definition's expectation, averaged over 200 fixed coin draws.
  const expected = useMemo(() => {
    let total = 0;
    for (let t = 0; t < TRIALS; t++) {
      const rand = mulberry32(9781 + t);
      const sg = Array.from({ length: N }, () => (rand() < 0.5 ? -1 : 1));
      total += bestCorrelation(sg, s).value;
    }
    return total / TRIALS;
  }, [s]);

  const shatters = s >= N - 1;

  // step polyline for the fitted labeling
  const step: string[] = [];
  fit.labels.forEach((l, i) => {
    const y = l === 1 ? TOP : TOP + 26;
    if (i === 0) step.push(`${xAt(i).toFixed(2)},${y}`);
    else {
      const prev = fit.labels[i - 1] === 1 ? TOP : TOP + 26;
      const midX = ((xAt(i - 1) + xAt(i)) / 2).toFixed(2);
      if (prev !== y) { step.push(`${midX},${prev}`); step.push(`${midX},${y}`); }
      step.push(`${xAt(i).toFixed(2)},${y}`);
    }
  });

  const agree = fit.labels.filter((l, i) => l === sigma[i]).length;

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.6rem 0" }} className="not-prose">
      <div className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", marginBottom: 2 }}>
        How well can the class chase pure noise?
      </div>
      <div style={{ fontSize: 12, color: "var(--faint)", marginBottom: 10 }}>
        the labels below are coin flips — there is nothing to learn
      </div>

      <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", maxWidth: VW, height: "auto", display: "block" }}>
        <text x={X0} y={16} fontSize={9.5} fill="var(--muted)">best member of the class</text>
        <polyline points={step.join(" ")} fill="none" stroke={accent} strokeWidth={2} />

        <text x={X0} y={AX - 18} fontSize={9.5} fill="var(--muted)">random labels σ</text>
        {sigma.map((sg, i) => (
          <circle
            key={i} cx={Number(xAt(i).toFixed(2))} cy={AX} r={6}
            fill={sg === 1 ? POS : "var(--surface)"}
            stroke={sg === 1 ? POS : NEG} strokeWidth={2}
          />
        ))}
        {/* mark the points the class failed to match */}
        {fit.labels.map((l, i) =>
          l !== sigma[i] ? (
            <line key={i} x1={Number((xAt(i) - 4).toFixed(2))} y1={AX + 14} x2={Number((xAt(i) + 4).toFixed(2))} y2={AX + 22} stroke="var(--bad)" strokeWidth={1.5} />
          ) : null
        )}
        <text x={X0} y={VH - 8} fontSize={9.5} fill="var(--muted)">
          matched {agree} of {N} coin flips {shatters ? "— all of them, always" : ""}
        </text>
      </svg>

      <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginTop: 10 }}>
        capacity: at most {s} sign change{s === 1 ? "" : "s"}
        {s === 1 ? " (a threshold classifier)" : s >= N - 1 ? " (rich enough to shatter)" : ` (${Math.ceil((s + 1) / 2)} intervals)`}
        <input type="range" min={1} max={N - 1} step={1} value={s} onChange={(e) => setS(Number(e.target.value))} style={{ width: "100%", accentColor: accent }} />
      </label>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12, alignItems: "center" }}>
        <Metric label="Rademacher complexity" value={expected.toFixed(3)} accent={shatters ? "var(--bad)" : accent} big sub={`averaged over ${TRIALS} draws`} />
        <Metric label="this draw" value={fit.value.toFixed(3)} sub={`${agree}/${N} matched`} />
        <div style={{ flex: 1 }} />
        <button onClick={() => setSeed((x) => x + 1)} style={btn}>flip the coins again</button>
      </div>
    </div>
  );
}

function Metric({ label, value, sub, accent, big }: { label: string; value: string; sub?: string; accent?: string; big?: boolean }) {
  return (
    <div style={{ background: "var(--surface-2)", borderRadius: 10, padding: "6px 10px", minWidth: 92 }}>
      <div style={{ fontSize: 10.5, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontSize: big ? 19 : 15, fontWeight: 500, color: accent ?? "var(--ink)" }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: "var(--faint)" }}>{sub}</div>}
    </div>
  );
}
const btn: React.CSSProperties = { background: "transparent", color: "var(--muted)", border: "1px solid var(--border-strong)", fontSize: 12, padding: "5px 10px", borderRadius: 8, cursor: "pointer" };
