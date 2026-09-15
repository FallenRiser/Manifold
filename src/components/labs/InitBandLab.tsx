"use client";

import { useMemo, useState } from "react";

// Drag the initial weight scale and watch the signal live.
//
// Sibling of InitScaleLab, which shows three MEASURED scales as bars. That one
// answers "what do the three named cases look like"; this one answers "how wide
// is the band that works", which you can only learn by sweeping it yourself.
//
// The whole track argues that a single constant — the standard deviation of the
// initial weights — decides whether a network can learn at all. That argument is
// only convincing if you can feel how NARROW the working band is. Reading "use
// sqrt(2/fan_in)" teaches nothing about the fact that a factor of ten either way
// is fatal. Dragging past it does.
//
// Everything here is computed in the browser, in the same arithmetic as
// scripts/init_norm_cases.py: 10 hidden layers of width 64, ReLU, forward pass
// on two-moons data, then one backward pass for the gradient norms.
//
// It is the same network and the same rule, NOT the same random draw: the moons
// sample and the weights are generated here in JS, so the numbers land in the
// same place as the published figures without matching them digit for digit
// (He reads ~0.42 activation std at layer 10 here against ~0.89 in the script).
// The shape is the claim; the digits belong to the CodeBlocks.

const DEPTH = 10;
const WIDTH = 64;
const N = 256;
const FAN_IN = WIDTH;

// --- deterministic RNG ------------------------------------------------------
function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function normals(n: number, rng: () => number) {
  const out = new Float64Array(n);
  for (let i = 0; i < n; i += 2) {
    const u = Math.max(rng(), 1e-12), v = rng();
    const r = Math.sqrt(-2 * Math.log(u));
    out[i] = r * Math.cos(2 * Math.PI * v);
    if (i + 1 < n) out[i + 1] = r * Math.sin(2 * Math.PI * v);
  }
  return out;
}

// The same two moons the scripts use: two interleaved half-circles + noise.
function moons(n: number, noise: number, rng: () => number) {
  const X: number[][] = [];
  const y: number[] = [];
  const half = n >> 1;
  const g = normals(2 * n, rng);
  for (let i = 0; i < half; i++) {
    const t = (Math.PI * i) / (half - 1);
    X.push([Math.cos(t) + noise * g[2 * i], Math.sin(t) + noise * g[2 * i + 1]]);
    y.push(0);
  }
  for (let i = 0; i < n - half; i++) {
    const t = (Math.PI * i) / (n - half - 1);
    const k = 2 * (half + i);
    X.push([1 - Math.cos(t) + noise * g[k], 1 - Math.sin(t) - 0.5 + noise * g[k + 1]]);
    y.push(1);
  }
  return { X, y };
}

type Stats = { actStd: number[]; gradNorm: number[] };

function measure(std: number): Stats {
  const rng = mulberry32(7);
  const { X, y } = moons(N, 0.25, rng);
  const sizes = [2, ...Array(DEPTH).fill(WIDTH), 1];

  // Weights. The slider names the std for a width-64 layer; every layer then
  // scales by its own fan-in the way sqrt(k / fan_in) does, so the input layer
  // (fan-in 2) is not accidentally starved. Park the slider on He and this
  // reproduces init_manual(scale="he") from scripts/init_norm_cases.py exactly:
  // std = 1.0 into the first layer, 0.1768 into the rest.
  const W: Float64Array[] = [];
  for (let l = 0; l < sizes.length - 1; l++) {
    const g = normals(sizes[l] * sizes[l + 1], rng);
    const w = new Float64Array(sizes[l] * sizes[l + 1]);
    const s = std * Math.sqrt(FAN_IN / sizes[l]);
    for (let i = 0; i < w.length; i++) w[i] = g[i] * s;
    W.push(w);
  }

  // forward, keeping every activation
  const acts: number[][][] = [X];
  const pre: number[][][] = [];
  for (let l = 0; l < W.length; l++) {
    const inp = acts[l], cin = sizes[l], cout = sizes[l + 1];
    const z: number[][] = [], a: number[][] = [];
    for (let r = 0; r < inp.length; r++) {
      const zr = new Array<number>(cout).fill(0);
      for (let j = 0; j < cout; j++) {
        let s = 0;
        for (let i = 0; i < cin; i++) s += inp[r][i] * W[l][i * cout + j];
        zr[j] = s;
      }
      z.push(zr);
      a.push(l < W.length - 1 ? zr.map((v) => (v > 0 ? v : 0)) : zr);
    }
    pre.push(z);
    acts.push(a);
  }

  const stdOf = (m: number[][]) => {
    let s = 0, s2 = 0, k = 0;
    for (const r of m) for (const v of r) { s += v; s2 += v * v; k++; }
    const mu = s / k;
    return Math.sqrt(Math.max(s2 / k - mu * mu, 0));
  };
  const actStd = acts.slice(1, -1).map(stdOf);

  // one backward pass, for the per-layer gradient norms
  const logit = acts[acts.length - 1];
  let d: number[][] = logit.map((r, i) => {
    const p = 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, r[0]))));
    return [(p - y[i]) / X.length];
  });
  const gradNorm: number[] = [];
  for (let l = W.length - 1; l >= 0; l--) {
    const cin = sizes[l], cout = sizes[l + 1];
    let acc = 0;
    for (let i = 0; i < cin; i++) {
      for (let j = 0; j < cout; j++) {
        let s = 0;
        for (let r = 0; r < acts[l].length; r++) s += acts[l][r][i] * d[r][j];
        acc += s * s;
      }
    }
    gradNorm.unshift(Math.sqrt(acc));
    if (l > 0) {
      const next: number[][] = [];
      for (let r = 0; r < d.length; r++) {
        const row = new Array<number>(cin).fill(0);
        for (let i = 0; i < cin; i++) {
          let s = 0;
          for (let j = 0; j < cout; j++) s += d[r][j] * W[l][i * cout + j];
          row[i] = pre[l - 1][r][i] > 0 ? s : 0;
        }
        next.push(row);
      }
      d = next;
    }
  }
  return { actStd, gradNorm };
}

const XAVIER = Math.sqrt(1 / FAN_IN);
const HE = Math.sqrt(2 / FAN_IN);
const MIN_E = -4, MAX_E = 0.7;

function Trace({ values, color, label, unit }: { values: number[]; color: string; label: string; unit: string }) {
  const safe = values.map((v) => (v > 0 && Number.isFinite(v) ? v : 1e-30));
  const lo = -30, hi = 12;
  const px = (i: number) => 32 + (i * 160) / (safe.length - 1);
  const py = (v: number) => 74 - ((Math.log10(v) - lo) / (hi - lo)) * 60;
  const d = safe.map((v, i) => `${i ? "L" : "M"}${px(i).toFixed(1)},${Math.max(8, Math.min(78, py(v))).toFixed(1)}`).join(" ");
  return (
    <svg viewBox="0 0 200 92" width="100%" role="img" aria-label={label}>
      <text x={2} y={9} fontSize={7.5} fill="var(--faint)">{label}</text>
      {[-30, -18, -6, 6].map((e) => (
        <g key={e}>
          <line x1={32} y1={py(10 ** e)} x2={192} y2={py(10 ** e)} stroke="var(--border-strong)" strokeWidth={0.5} />
          <text x={29} y={py(10 ** e) + 2.5} textAnchor="end" fontSize={6} fill="var(--faint)">1e{e}</text>
        </g>
      ))}
      <line x1={32} y1={py(1)} x2={192} y2={py(1)} stroke="var(--faint)" strokeWidth={0.7} strokeDasharray="2 2" />
      <path d={d} fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
      {safe.map((v, i) => (
        <circle key={i} cx={px(i)} cy={Math.max(8, Math.min(78, py(v)))} r={1.6} fill={color} />
      ))}
      <text x={112} y={90} textAnchor="middle" fontSize={6.5} fill="var(--faint)">layer 1 → {safe.length} · {unit}</text>
    </svg>
  );
}

export function InitBandLab({ accent = "var(--c-neural)" }: { accent?: string }) {
  const [e, setE] = useState(Math.log10(HE));
  const std = 10 ** e;
  const { actStd, gradNorm } = useMemo(() => measure(std), [std]);

  const last = actStd[actStd.length - 1];
  const ratio = gradNorm[gradNorm.length - 1] / (gradNorm[0] || 1e-300);
  const verdict =
    !Number.isFinite(last) || last > 1e4
      ? { text: "Exploding. The signal grows every layer; the gradients will too.", color: "var(--bad)" }
      : last < 1e-6
        ? { text: "Dead. The signal is gone before the output layer — there is nothing to learn from.", color: "var(--bad)" }
        : last < 0.05
          ? { text: "Fading. Still alive, but the deep layers are barely moving.", color: "var(--warn)" }
          : { text: "Healthy. The activation scale that enters layer 1 is roughly what leaves layer 10.", color: "var(--good)" };

  const mark = (v: number) => `${((Math.log10(v) - MIN_E) / (MAX_E - MIN_E)) * 100}%`;

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 14, padding: "14px 16px 12px", background: "var(--surface-2)" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: 10, marginBottom: 2 }}>
        <span className="font-display" style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: accent }}>
          weight std at init
        </span>
        <span style={{ fontFamily: "ui-monospace, SFMono-Regular, monospace", fontSize: 15, color: "var(--ink)" }}>
          {std < 0.001 ? std.toExponential(2) : std.toFixed(4)}
        </span>
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>10 layers · width {WIDTH} · ReLU</span>
      </div>

      <div style={{ position: "relative", padding: "10px 0 20px" }}>
        <input
          type="range"
          min={MIN_E}
          max={MAX_E}
          step={0.02}
          value={e}
          onChange={(ev) => setE(parseFloat(ev.target.value))}
          aria-label="initial weight standard deviation, log scale"
          style={{ width: "100%", accentColor: accent }}
        />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 2, height: 16, pointerEvents: "none" }}>
          {[
            { v: XAVIER, l: "Xavier" },
            { v: HE, l: "He" },
          ].map((m) => (
            <span key={m.l} style={{ position: "absolute", left: mark(m.v), transform: "translateX(-50%)", fontSize: 10, color: "var(--muted)", whiteSpace: "nowrap" }}>
              ↑ {m.l}
            </span>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14 }}>
        <Trace values={actStd} color={accent} label="activation std per layer" unit="log scale" />
        <Trace values={gradNorm} color="var(--muted)" label="gradient norm per layer" unit="log scale" />
      </div>

      <div style={{ marginTop: 8, paddingTop: 9, borderTop: "1px solid var(--border)", fontSize: 13, lineHeight: 1.55, color: "var(--ink)" }}>
        <span style={{ color: verdict.color, fontWeight: 500 }}>{verdict.text}</span>{" "}
        <span style={{ color: "var(--muted)" }}>
          Layer 10 activation std {Number.isFinite(last) ? (last < 0.001 || last > 1000 ? last.toExponential(2) : last.toFixed(3)) : "overflowed"}; gradient
          norm ratio last/first {Number.isFinite(ratio) ? (ratio < 0.001 || ratio > 1000 ? ratio.toExponential(2) : ratio.toFixed(2)) : "overflowed"}.
        </span>
      </div>
    </div>
  );
}
