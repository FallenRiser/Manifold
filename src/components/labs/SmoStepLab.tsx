"use client";

import { useMemo, useState } from "react";

// SMO, one step at a time, with the step drawn twice.
//
// On the left is the data and whatever boundary the current prices imply. On the right is the
// ONLY thing a single step is allowed to change: two prices, inside the square 0 <= a <= C, on
// the line their labels pin them to. Opposite labels fix the difference and the line has slope
// +1; equal labels fix the sum and it has slope -1. The hollow dot is where the formula would
// land with no box at all; the filled dot is where it actually lands after the clip. When those
// two are not in the same place, the step is being clipped, and the point is on its way to being
// pinned at C.
//
// The rule switch is the page's ablation made touchable. "By the rule" takes the maximal
// violating pair; "at random" takes any two. Both converge -- the objective climbs either way,
// which the readout shows -- but the step counts are not in the same world.
//
// Everything here is the same arithmetic as scripts/svm_cases.py sections 50-53, and
// scripts/svm_smo_check.mjs holds this file's solver against that script's answers.

const W = 560;
const PAD = 16;
const PLOT = 232;
const H = 396;
const GX = PAD + PLOT + 46;
const GW = 190;
const N = 24;
const C = 1;
const PINK = "var(--c-classification)";
const BLUE = "var(--c-regression)";
const INK = "var(--ink)";
const MUTED = "var(--muted)";
// The same stopping tolerance scripts/svm_cases.py uses.
const TOL = 1e-6;

type P = { x: number; z: number; y: number };

// Pure arithmetic: no Math.log or Math.cos near a coordinate, so the server and the browser
// agree bit for bit and React can hydrate this.
//
// A Lehmer generator rather than the usual LCG, because scripts/svm_cases.py has to produce
// these exact 24 points to get sklearn's opinion on them. 2^31 x 48271 stays under 2^53, so
// every step is exact in a float64 and Python and JavaScript cannot drift apart; the wider
// multiplier in the other labs overflows and would only agree by luck.
function rand(seed: number) {
  let s = (seed % 2147483646) + 1;
  return () => {
    s = (s * 48271) % 2147483647;
    return s / 2147483647;
  };
}

function makeData(): P[] {
  const u = rand(11);
  const out: P[] = [];
  for (let i = 0; i < N; i += 1) {
    const y = i % 2 === 0 ? 1 : -1;
    let t = 0;
    for (let k = 0; k < 6; k += 1) t += u();
    let t2 = 0;
    for (let k = 0; k < 6; k += 1) t2 += u();
    const cx = y > 0 ? 0.95 : -0.95;
    out.push({
      x: Math.round((cx + ((t - 3) / 1.2247) * 0.62) * 1000) / 1000,
      z: Math.round((((t2 - 3) / 1.2247) * 0.82) * 1000) / 1000,
      y,
    });
  }
  return out;
}

const PTS = makeData();
const GRAM = PTS.map((p) => PTS.map((q) => p.x * q.x + p.z * q.z));

type Step = {
  i: number;
  j: number;
  L: number;
  H: number;
  raw: number;
  aj: number;
  ai: number;
  clipped: boolean;
  slope: 1 | -1;
};

type State = { a: number[]; steps: number; hist: number[] };

const objective = (a: number[]) => {
  let o = 0;
  for (let i = 0; i < N; i += 1) {
    o += a[i];
    for (let j = 0; j < N; j += 1) o -= 0.5 * a[i] * a[j] * PTS[i].y * PTS[j].y * GRAM[i][j];
  }
  return o;
};

const errors = (a: number[]) =>
  PTS.map((_, k) => {
    let f = 0;
    for (let m = 0; m < N; m += 1) if (a[m] !== 0) f += a[m] * PTS[m].y * GRAM[m][k];
    return f - PTS[k].y;
  });

function violation(a: number[]) {
  const g = errors(a);
  let m = -Infinity;
  let M = Infinity;
  for (let k = 0; k < N; k += 1) {
    const up = (a[k] < C - 1e-12 && PTS[k].y > 0) || (a[k] > 1e-12 && PTS[k].y < 0);
    const dn = (a[k] < C - 1e-12 && PTS[k].y < 0) || (a[k] > 1e-12 && PTS[k].y > 0);
    if (up) m = Math.max(m, -g[k]);
    if (dn) M = Math.min(M, -g[k]);
  }
  return m - M;
}

/** The pair, the segment it may move along, and where the formula lands on it. */
function plan(a: number[], byRule: boolean, tick: number): Step | null {
  const g = errors(a);
  const ups: number[] = [];
  const dns: number[] = [];
  for (let k = 0; k < N; k += 1) {
    if ((a[k] < C - 1e-12 && PTS[k].y > 0) || (a[k] > 1e-12 && PTS[k].y < 0)) ups.push(k);
    if ((a[k] < C - 1e-12 && PTS[k].y < 0) || (a[k] > 1e-12 && PTS[k].y > 0)) dns.push(k);
  }
  if (!ups.length || !dns.length) return null;
  // The stopping test. Without it there is always SOME pair whose prices are not exactly at a
  // KKT point, and the loop never ends -- the run just keeps taking steps of size 1e-16.
  const top = ups.reduce((b, k) => (-g[k] > -g[b] ? k : b), ups[0]);
  const bot = dns.reduce((b, k) => (-g[k] < -g[b] ? k : b), dns[0]);
  if (-g[top] - -g[bot] < TOL) return null;
  let i: number;
  let j: number;
  if (byRule) {
    i = top;
    j = bot;
  } else {
    // A fixed sequence, so the "at random" run is the same every time the page loads. Drawing
    // the same index twice is not a reason to stop, it is a reason to draw again.
    const u = rand(tick * 7919 + 13);
    i = ups[Math.floor(u() * ups.length) % ups.length];
    j = dns[Math.floor(u() * dns.length) % dns.length];
    for (let t = 0; t < 24 && i === j; t += 1) j = dns[Math.floor(u() * dns.length) % dns.length];
  }
  if (i === j) return null;
  const yi = PTS[i].y;
  const yj = PTS[j].y;
  const eta = 2 * GRAM[i][j] - GRAM[i][i] - GRAM[j][j];
  const [L, H2] =
    yi !== yj
      ? [Math.max(0, a[j] - a[i]), Math.min(C, C + a[j] - a[i])]
      : [Math.max(0, a[i] + a[j] - C), Math.min(C, a[i] + a[j])];
  if (eta >= -1e-15 || H2 - L < 1e-14) return null;
  const raw = a[j] - (yj * (g[i] - g[j])) / eta;
  const aj = Math.min(H2, Math.max(L, raw));
  const ai = a[i] + yi * yj * (a[j] - aj);
  return {
    i,
    j,
    L,
    H: H2,
    raw,
    aj,
    ai,
    clipped: raw < L - 1e-12 || raw > H2 + 1e-12,
    slope: yi !== yj ? 1 : -1,
  };
}

const r = (v: number, k: number) => {
  const m = 10 ** k;
  return Math.round(v * m) / m;
};

export default function SmoStepLab() {
  const [byRule, setByRule] = useState(true);
  const [st, setSt] = useState<State>({ a: new Array(N).fill(0), steps: 0, hist: [0] });

  const next = useMemo(() => plan(st.a, byRule, st.steps), [st, byRule]);
  const obj = useMemo(() => objective(st.a), [st]);
  const viol = useMemo(() => violation(st.a), [st]);

  const advance = (times: number) => {
    setSt((cur) => {
      let a = cur.a.slice();
      let n = cur.steps;
      const hist = cur.hist.slice();
      for (let t = 0; t < times; t += 1) {
        const p = plan(a, byRule, n);
        if (!p) break;
        a = a.slice();
        a[p.i] = p.ai;
        a[p.j] = p.aj;
        n += 1;
        hist.push(objective(a));
      }
      return { a, steps: n, hist };
    });
  };

  const reset = () => setSt({ a: new Array(N).fill(0), steps: 0, hist: [0] });

  // the boundary implied by the current prices
  const w = useMemo(() => {
    let w0 = 0;
    let w1 = 0;
    for (let k = 0; k < N; k += 1) {
      w0 += st.a[k] * PTS[k].y * PTS[k].x;
      w1 += st.a[k] * PTS[k].y * PTS[k].z;
    }
    const free = st.a.map((v, k) => ({ v, k })).filter((o) => o.v > 1e-9 && o.v < C - 1e-9);
    let b = 0;
    if (free.length) {
      let s = 0;
      for (const o of free) s += PTS[o.k].y - (w0 * PTS[o.k].x + w1 * PTS[o.k].z);
      b = s / free.length;
    }
    return { w0, w1, b, live: w0 * w0 + w1 * w1 > 1e-12 };
  }, [st]);

  const LIM = 2.6;
  const sx = (v: number) => r(PAD + ((v + LIM) / (2 * LIM)) * PLOT, 2);
  const sy = (v: number) => r(PAD + 28 + ((LIM - v) / (2 * LIM)) * PLOT, 2);

  // the boundary line clipped to the plot, in data coordinates
  const line = useMemo(() => {
    if (!w.live) return null;
    const pts: { x: number; z: number }[] = [];
    const at = (v: number, axis: 0 | 1) =>
      axis === 0
        ? { x: v, z: Math.abs(w.w1) < 1e-12 ? NaN : -(w.w0 * v + w.b) / w.w1 }
        : { x: Math.abs(w.w0) < 1e-12 ? NaN : -(w.w1 * v + w.b) / w.w0, z: v };
    for (const v of [-LIM, LIM]) {
      const p = at(v, 0);
      if (Number.isFinite(p.z) && Math.abs(p.z) <= LIM) pts.push(p);
      const q = at(v, 1);
      if (Number.isFinite(q.x) && Math.abs(q.x) <= LIM) pts.push(q);
    }
    return pts.length >= 2 ? pts.slice(0, 2) : null;
  }, [w]);

  // the box panel
  const BY = PAD + 28;
  const bx = (v: number) => r(GX + (v / C) * GW, 2);
  const bz = (v: number) => r(BY + GW - (v / C) * GW, 2);

  const ai0 = next ? st.a[next.i] : 0;
  const aj0 = next ? st.a[next.j] : 0;
  // alpha_i as a function of alpha_j along the constraint line
  const aiOf = (aj: number) =>
    next ? st.a[next.i] + PTS[next.i].y * PTS[next.j].y * (st.a[next.j] - aj) : 0;

  const rows: [string, string][] = [
    ["step", String(st.steps)],
    ["objective", obj.toFixed(4)],
    ["KKT violation", st.steps === 0 ? viol.toFixed(2) : viol.toExponential(1)],
    ["support vectors", String(st.a.filter((v) => v > 1e-9).length)],
    ["pinned at C", String(st.a.filter((v) => v > C - 1e-9).length)],
  ];

  const btn = (label: string, onClick: () => void, on = false) => (
    <button
      type="button"
      onClick={onClick}
      style={{
        font: "500 12px/1 var(--font-sans, system-ui)",
        padding: "6px 11px",
        borderRadius: 6,
        cursor: "pointer",
        border: `1px solid ${on ? "var(--c-classification)" : "var(--border-strong)"}`,
        background: on ? "var(--c-classification)" : "transparent",
        color: on ? "#fff" : "var(--ink)",
      }}
    >
      {label}
    </button>
  );

  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        {btn("Step", () => advance(1))}
        {btn("Run 20", () => advance(20))}
        {btn("Run to the end", () => advance(400))}
        {btn("Reset", reset)}
        <span style={{ width: 14 }} />
        {btn("pair by the rule", () => { setByRule(true); reset(); }, byRule)}
        {btn("pair at random", () => { setByRule(false); reset(); }, !byRule)}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img"
           aria-label="One SMO step, shown on the data and inside the box of two prices">
        <defs>
          <clipPath id="smo-plot">
            <rect x={PAD} y={PAD + 28} width={PLOT} height={PLOT} />
          </clipPath>
        </defs>

        <text x={PAD} y={PAD + 10} fill={MUTED} style={{ font: "500 11px var(--font-sans, system-ui)" }}>
          the data, and the boundary the prices imply
        </text>
        <rect x={PAD} y={PAD + 28} width={PLOT} height={PLOT} fill="none" stroke="var(--border-strong)" />

        <g clipPath="url(#smo-plot)">
          {line && (
            <line x1={sx(line[0].x)} y1={sy(line[0].z)} x2={sx(line[1].x)} y2={sy(line[1].z)}
                  stroke={INK} strokeWidth={1.6} />
          )}
          {PTS.map((p, k) => {
            const sel = next && (k === next.i || k === next.j);
            const a = st.a[k];
            return (
              <g key={k}>
                {a > 1e-9 && (
                  <circle cx={sx(p.x)} cy={sy(p.z)} r={a > C - 1e-9 ? 8.5 : 7}
                          fill="none" stroke={p.y > 0 ? PINK : BLUE} strokeWidth={1.1}
                          opacity={0.5} />
                )}
                <circle cx={sx(p.x)} cy={sy(p.z)} r={sel ? 5 : 3.4}
                        fill={p.y > 0 ? PINK : BLUE}
                        stroke={sel ? INK : "none"} strokeWidth={sel ? 1.8 : 0} />
                {sel && (
                  <text x={sx(p.x)} y={sy(p.z) - 9} textAnchor="middle" fill={INK}
                        style={{ font: "600 10px var(--font-sans, system-ui)" }}>
                    {k === next!.i ? "i" : "j"}
                  </text>
                )}
              </g>
            );
          })}
        </g>

        {/* ---- the box ---- */}
        <text x={GX} y={PAD + 10} fill={MUTED} style={{ font: "500 11px var(--font-sans, system-ui)" }}>
          the two prices, inside the box
        </text>
        <rect x={bx(0)} y={bz(C)} width={GW} height={GW} fill="none" stroke="var(--border-strong)" />
        <text x={bx(0) - 5} y={bz(0) + 4} textAnchor="end" fill={MUTED}
              style={{ font: "400 10px var(--font-sans, system-ui)" }}>0</text>
        <text x={bx(0) - 5} y={bz(C) + 4} textAnchor="end" fill={MUTED}
              style={{ font: "400 10px var(--font-sans, system-ui)" }}>C</text>
        <text x={bx(C)} y={bz(0) + 14} textAnchor="middle" fill={MUTED}
              style={{ font: "400 10px var(--font-sans, system-ui)" }}>C</text>
        <text x={bx(0) + GW / 2} y={bz(0) + 26} textAnchor="middle" fill={MUTED}
              style={{ font: "400 10px var(--font-sans, system-ui)" }}>
          {next ? `a_${next.j}` : "a_j"}
        </text>

        {next && (
          <>
            <line x1={bx(next.L)} y1={bz(aiOf(next.L))} x2={bx(next.H)} y2={bz(aiOf(next.H))}
                  stroke={INK} strokeWidth={1.5} />
            {[next.L, next.H].map((v, q) => {
              // Two placements that a single fixed offset gets wrong. Above the point, except
              // near the top of the box, where the label lands on the panel heading; and pushed
              // apart when L and H are close, which happens whenever the feasible segment is
              // short -- both were found by sweeping every step of a run rather than by looking.
              const hi = aiOf(v) > 0.86 * C;
              const tight = Math.abs(bx(next.H) - bx(next.L)) < 16;
              const side = q === 0 ? -1 : 1;
              return (
                <g key={q}>
                  <circle cx={bx(v)} cy={bz(aiOf(v))} r={2.6} fill={INK} />
                  <text x={bx(v) + (tight ? side * 7 : 0)} y={bz(aiOf(v)) + (hi ? 14 : -8)}
                        textAnchor={tight ? (q === 0 ? "end" : "start") : "middle"}
                        fill={MUTED} style={{ font: "500 10px var(--font-sans, system-ui)" }}>
                    {q === 0 ? "L" : "H"}
                  </text>
                </g>
              );
            })}
            <circle cx={bx(aj0)} cy={bz(ai0)} r={4} fill="none" stroke={MUTED} strokeWidth={1.4} />
            {next.clipped && (
              <circle cx={bx(Math.min(C * 1.35, Math.max(-C * 0.35, next.raw)))}
                      cy={bz(Math.min(C * 1.35, Math.max(-C * 0.35, aiOf(next.raw))))}
                      r={4} fill="none" stroke={PINK} strokeWidth={1.4} strokeDasharray="2 2" />
            )}
            <circle cx={bx(next.aj)} cy={bz(next.ai)} r={4.6} fill={PINK} />
            <line x1={bx(aj0)} y1={bz(ai0)} x2={bx(next.aj)} y2={bz(next.ai)}
                  stroke={PINK} strokeWidth={1.4} strokeDasharray="3 2" />
          </>
        )}
        <text x={GX} y={bz(0) + 42} fill={MUTED} style={{ font: "400 10.5px var(--font-sans, system-ui)" }}>
          {next
            ? `${next.slope > 0 ? "opposite labels: the difference is fixed" : "same label: the sum is fixed"}`
            : "no violating pair left"}
        </text>
        <text x={GX} y={bz(0) + 56} fill={next && next.clipped ? PINK : MUTED}
              style={{ font: "400 10.5px var(--font-sans, system-ui)" }}>
          {next
            ? next.clipped
              ? `the formula wants ${r(next.raw, 2)}; the box allows ${r(next.aj, 2)}`
              : "the formula lands inside the box: no clip"
            : "the prices satisfy every condition"}
        </text>

        {/* ---- readouts ---- */}
        {rows.map(([k, v], q) => (
          <g key={k}>
            <text x={PAD} y={PAD + 28 + PLOT + 26 + q * 15} fill={MUTED}
                  style={{ font: "400 11px var(--font-sans, system-ui)" }}>{k}</text>
            <text x={PAD + 150} y={PAD + 28 + PLOT + 26 + q * 15} textAnchor="end" fill={INK}
                  style={{ font: "500 11px var(--font-mono, ui-monospace)" }}>{v}</text>
          </g>
        ))}
      </svg>

      <p style={{ font: "400 13px/1.55 var(--font-sans, system-ui)", color: "var(--muted)", marginTop: 4 }}>
        The ringed points carry a price; the thicker ring is a price pinned at C. Watch the
        objective: it goes up on every single step, whichever rule is picking the pair. Then
        switch to <em>pair at random</em> and count how many steps the same climb takes.
      </p>
    </div>
  );
}
