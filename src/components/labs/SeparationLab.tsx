"use client";

import { useMemo, useState } from "react";

// Perfect separation, felt: two 1-D classes with an adjustable gap and an L2
// toggle. When the classes overlap, the fitted weight is finite and the sigmoid
// is a gentle ramp. Slide them fully apart (separable) with L2 OFF and the
// weight balloons toward infinity — the sigmoid snaps to a step, probabilities
// saturate to 0/1. Turn L2 ON and it's pinned finite again. In-component
// gradient descent so the divergence is real, not scripted.

const ACCENT = "var(--c-classification)";
const VW = 620;
const VH = 240;
const PAD = { l: 16, r: 16, t: 16, b: 40 };
const XMIN = -6, XMAX = 6;

const sig = (z: number) => 1 / (1 + Math.exp(-z));

function fit(xs: number[], ys: number[], l2: number) {
  // logistic regression by gradient descent on [b, w]; l2 penalises w only.
  // Generous budget so separable+unpenalized data actually climbs toward the
  // float-saturation plateau (w ~ 25+), making the runaway visible — 4000 iters
  // stopped short of it. 12 points, so even 30k iters is a sub-ms fit.
  let b = 0, w = 0;
  const n = xs.length;
  const lr = 1.0;
  for (let it = 0; it < 30000; it++) {
    let gb = 0, gw = 0;
    for (let i = 0; i < n; i++) {
      const p = sig(b + w * xs[i]);
      gb += p - ys[i];
      gw += (p - ys[i]) * xs[i];
    }
    gb /= n; gw = gw / n + l2 * w;
    b -= lr * gb; w -= lr * gw;
    // guard against overflow when weights run away
    if (!isFinite(w) || Math.abs(w) > 1e6) break;
  }
  return { b, w };
}

export function SeparationLab() {
  const [gap, setGap] = useState(0.4); // separation between class centres (negative = overlap)
  const [regularized, setRegularized] = useState(false);

  // class 0 centred at -1 - gap/2, class 1 at +1 + gap/2
  const { xs, ys, c0, c1 } = useMemo(() => {
    const half = gap / 2;
    const c0 = [-2.2, -1.6, -1.1, -0.7, -0.3, 0.1].map((v) => v - half);
    const c1 = [-0.1, 0.3, 0.7, 1.1, 1.6, 2.2].map((v) => v + half);
    return { xs: [...c0, ...c1], ys: [...c0.map(() => 0), ...c1.map(() => 1)], c0, c1 };
  }, [gap]);

  const { b, w } = fit(xs, ys, regularized ? 0.15 : 0);
  const separable = Math.max(...c0) < Math.min(...c1);
  // a normal fitted weight on overlapping data here is ~1–2; once separation
  // pushes it past ~6 (with the sigmoid essentially a step) it's the runaway.
  const runaway = separable && !regularized && Math.abs(w) > 6;

  const xToPx = (x: number) => PAD.l + ((x - XMIN) / (XMAX - XMIN)) * (VW - PAD.l - PAD.r);
  const yToPx = (p: number) => VH - PAD.b - p * (VH - PAD.t - PAD.b);
  const curve = Array.from({ length: 201 }, (_, i) => {
    const x = XMIN + (i / 200) * (XMAX - XMIN);
    return `${xToPx(x)},${yToPx(sig(b + w * x))}`;
  }).join(" ");

  return (
    <div style={frame}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6, flexWrap: "wrap", gap: 8 }}>
        <span className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
          Pull the classes apart
        </span>
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>{separable ? "separable — a clean gap" : "overlapping"}</span>
      </div>

      <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <rect x={PAD.l} y={PAD.t} width={VW - PAD.l - PAD.r} height={VH - PAD.t - PAD.b} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        <line x1={PAD.l} y1={yToPx(0.5)} x2={VW - PAD.r} y2={yToPx(0.5)} stroke="var(--border)" strokeDasharray="4 5" />
        <text x={PAD.l + 2} y={yToPx(0.5) - 4} fontSize={9.5} fill="var(--faint)">p = 0.5</text>

        <polyline points={curve} fill="none" stroke={ACCENT} strokeWidth={2.5} />

        {xs.map((x, i) => (
          <circle key={i} cx={xToPx(x)} cy={yToPx(ys[i])} r={5.5}
            fill={ys[i] === 1 ? ACCENT : "var(--c-regression)"} fillOpacity={0.9} />
        ))}
      </svg>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 12, alignItems: "center" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "var(--muted)", flex: 1, minWidth: 220 }}>
          <span style={{ minWidth: 96 }}>class gap</span>
          <input type="range" min={-1.5} max={3} step={0.05} value={gap} onChange={(e) => setGap(Number(e.target.value))} style={{ flex: 1, accentColor: ACCENT }} aria-label="Class gap" />
        </label>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12.5, color: "var(--muted)", cursor: "pointer" }}>
          <input type="checkbox" checked={regularized} onChange={(e) => setRegularized(e.target.checked)} style={{ accentColor: ACCENT, width: 15, height: 15 }} />
          L2 regularization
        </label>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12, alignItems: "center" }}>
        <Metric label="fitted weight w" value={runaway ? `${w.toFixed(0)} ↑` : w.toFixed(2)} warn={runaway} />
        <Metric label="P at the boundary edges" value={`${(sig(b + w * Math.min(...c1)) * 100).toFixed(runaway ? 0 : 1)}% / ${(sig(b + w * Math.max(...c0)) * 100).toFixed(runaway ? 0 : 1)}%`} />
      </div>

      {runaway && (
        <div style={{ marginTop: 10, padding: "9px 12px", borderRadius: 9, fontSize: 12.5, lineHeight: 1.55, color: "var(--muted)", background: "color-mix(in srgb, var(--bad) 7%, var(--surface))", border: "1px solid color-mix(in srgb, var(--bad) 28%, var(--border))" }}>
          The classes are perfectly separable and there&rsquo;s no penalty, so the weight is running away —
          the optimizer only stopped because it hit an iteration cap, not because it found a minimum. The
          sigmoid has collapsed into a near-step function and the probabilities have saturated to essentially
          0 and 1: <b style={{ color: "var(--ink)" }}>infinite confidence from twelve points</b>. Tick L2 on,
          or drag the classes back into overlap, to pin the weight finite.
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div style={{ background: "var(--surface-2)", borderRadius: 9, padding: "6px 11px" }}>
      <div style={{ fontSize: 10, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 500, color: warn ? "var(--bad)" : "var(--ink)", fontFamily: "var(--font-geist-mono, monospace)" }}>{value}</div>
    </div>
  );
}

const frame: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border-strong)",
  borderRadius: 14,
  padding: "16px 16px 14px",
};
