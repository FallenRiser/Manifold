"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// Seeing the Banach fixed-point theorem, not just proving it. Each backup of the
// Bellman OPTIMALITY operator T pulls any value function closer to V* by a factor ≤ γ.
// We project the whole value vector onto two of its coordinates and watch several
// wildly different starting guesses get reeled into the SAME point V* — geometrically,
// at rate γ. Drop γ and the pull is fiercer (faster convergence); raise it and the
// iterates crawl in. The per-step sup-norm ratio is printed live and always sits ≤ γ.

const ACCENT = "var(--c-rl)";
const NROW = 4, NCOL = 4, NS = 16, NA = 4;
const GOAL = 15, PIT = 3, STEP = -0.04;
const MOVES: [number, number][] = [[-1, 0], [0, 1], [1, 0], [0, -1]];
const isTerm = (s: number) => s === GOAL || s === PIT;
const SX = 5, SY = 10; // the two states we project onto

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function nextState(s: number, a: number) {
  const r = Math.floor(s / NCOL), c = s % NCOL;
  const nr = r + MOVES[a][0], nc = c + MOVES[a][1];
  if (nr < 0 || nr >= NROW || nc < 0 || nc >= NCOL) return s;
  return nr * NCOL + nc;
}
function reward(ns: number) { return ns === GOAL ? 1 : ns === PIT ? -1 : STEP; }
function T(V: number[], gamma: number) {
  const out = new Array(NS).fill(0);
  for (let s = 0; s < NS; s++) {
    if (isTerm(s)) { out[s] = 0; continue; }
    let best = -Infinity;
    for (let a = 0; a < NA; a++) best = Math.max(best, reward(nextState(s, a)) + gamma * V[nextState(s, a)]);
    out[s] = best;
  }
  return out;
}
function vstar(gamma: number) {
  let V = new Array(NS).fill(0);
  for (let i = 0; i < 2000; i++) V = T(V, gamma);
  return V;
}
const supDist = (A: number[], B: number[]) => {
  let m = 0; for (let s = 0; s < NS; s++) m = Math.max(m, Math.abs(A[s] - B[s])); return m;
};
const NSTARTS = 6;
function makeStarts() {
  const rng = mulberry32(7);
  return Array.from({ length: NSTARTS }, () =>
    Array.from({ length: NS }, () => (rng() - 0.5) * 8));
}

export function ContractionFlowLab() {
  const [gamma, setGamma] = useState(0.9);
  const Vstar = useMemo(() => vstar(gamma), [gamma]);
  const vecs = useRef<number[][]>(makeStarts());
  const [trails, setTrails] = useState<{ x: number; y: number }[][]>(
    () => vecs.current.map((v) => [{ x: v[SX], y: v[SY] }]));
  const [running, setRunning] = useState(false);
  const [ratio, setRatio] = useState<number | null>(null);
  const gammaRef = useRef(gamma); gammaRef.current = gamma;

  const reset = useCallback((g: number) => {
    setRunning(false);
    vecs.current = makeStarts();
    setTrails(vecs.current.map((v) => [{ x: v[SX], y: v[SY] }]));
    setRatio(null);
    void g;
  }, []);

  const step = useCallback(() => {
    const g = gammaRef.current;
    const star = vstar(g);
    let before = 0, after = 0;
    const next = vecs.current.map((v) => {
      before = Math.max(before, supDist(v, star));
      const nv = T(v, g);
      after = Math.max(after, supDist(nv, star));
      return nv;
    });
    vecs.current = next;
    setRatio(before > 1e-6 ? after / before : 0);
    setTrails((prev) => prev.map((tr, i) => [...tr, { x: next[i][SX], y: next[i][SY] }].slice(-40)));
  }, []);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      step();
      // stop when converged
      const g = gammaRef.current;
      if (supDist(vecs.current[0], vstar(g)) < 1e-3) setRunning(false);
    }, 380);
    return () => clearInterval(id);
  }, [running, step]);

  // geometry
  const W = 300, H = 300, pad = 34;
  const lo = -4.2, hi = 4.2;
  const gx = (v: number) => pad + ((v - lo) / (hi - lo)) * (W - 2 * pad);
  const gy = (v: number) => H - pad - ((v - lo) / (hi - lo)) * (H - 2 * pad);

  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
        <span style={head}>Every start is pulled to the same V*</span>
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>Bellman optimality backups</span>
      </div>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "min(100%, 300px)", height: "auto" }}>
          {/* axes */}
          <line x1={pad} y1={H - pad} x2={W - pad + 6} y2={H - pad} stroke="var(--border)" />
          <line x1={pad} y1={H - pad} x2={pad} y2={pad - 6} stroke="var(--border)" />
          <text x={W - pad + 4} y={H - pad + 12} textAnchor="end" fontSize={9.5} fill="var(--faint)">V(state {SX})</text>
          <text x={pad - 6} y={pad - 2} fontSize={9.5} fill="var(--faint)">V(state {SY})</text>
          {/* trails */}
          {trails.map((tr, i) => (
            <g key={i}>
              <polyline points={tr.map((p) => `${gx(p.x).toFixed(1)},${gy(p.y).toFixed(1)}`).join(" ")}
                fill="none" stroke={`color-mix(in srgb, ${ACCENT} ${30 + i * 8}%, var(--muted))`} strokeWidth={1.3} opacity={0.75} />
              {/* current point */}
              {tr.length > 0 && (
                <circle cx={gx(tr[tr.length - 1].x)} cy={gy(tr[tr.length - 1].y)} r={3.4}
                  fill={`color-mix(in srgb, ${ACCENT} ${40 + i * 8}%, var(--muted))`} />
              )}
              {/* start marker */}
              <circle cx={gx(tr[0].x)} cy={gy(tr[0].y)} r={2.2} fill="none" stroke="var(--faint)" strokeWidth={1} />
            </g>
          ))}
          {/* fixed point */}
          <g>
            <circle cx={gx(Vstar[SX])} cy={gy(Vstar[SY])} r={12} fill="none" stroke={ACCENT} strokeWidth={1} strokeDasharray="2 2" opacity={0.6} />
            <text x={gx(Vstar[SX])} y={gy(Vstar[SY]) + 4} textAnchor="middle" fontSize={16} fill={ACCENT}>★</text>
            <text x={gx(Vstar[SX])} y={gy(Vstar[SY]) - 14} textAnchor="middle" fontSize={9.5} fill={ACCENT}>V*</text>
          </g>
        </svg>
      </div>

      <div style={{ ...panel, borderColor: `color-mix(in srgb, ${ACCENT} 30%, var(--border))` }}>
        {ratio === null
          ? <>Press <b>▶ Contract</b>. Six random guesses, one shared destination.</>
          : <>last sup-norm ratio ‖T V − V*‖ / ‖V − V*‖ = <b style={{ color: ACCENT, fontFamily: "ui-monospace, monospace" }}>{ratio.toFixed(3)}</b>{" "}
            <span style={{ color: "var(--faint)" }}>≤ γ = {gamma.toFixed(2)}</span></>}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12, alignItems: "center", justifyContent: "center" }}>
        <button style={{ ...btn, borderColor: ACCENT, background: `color-mix(in srgb, ${ACCENT} 16%, transparent)`, minWidth: 92 }}
          onClick={() => setRunning((r) => !r)}>{running ? "⏸ Pause" : "▶ Contract"}</button>
        <button style={btn} onClick={() => { setRunning(false); step(); }}>Step</button>
        <button style={btn} onClick={() => reset(gamma)}>Reset</button>
      </div>
      <label style={sl}>
        <span style={{ minWidth: 92 }}>discount γ: <b style={mono}>{gamma.toFixed(2)}</b></span>
        <input type="range" min={0.3} max={0.95} step={0.05} value={gamma}
          onChange={(e) => { const g = Number(e.target.value); setGamma(g); reset(g); }} style={{ flex: 1, accentColor: ACCENT }} aria-label="discount gamma" />
      </label>

      <div style={caption}>
        Each dot is one value function, plotted by two of its coordinates; the six start scattered far apart. Press{" "}
        <b>▶ Contract</b> and every backup drags them inward — never wandering, always shrinking the distance to the
        star by at least a factor of γ (watch the ratio readout stay under γ). They all land on the <em>same</em>{" "}
        <b style={{ color: ACCENT }}>V*</b>, because a contraction has exactly one fixed point. Turn γ <b>down</b> and
        the pull is stronger — they snap in almost at once; turn it toward <b>0.95</b> and they inch in, the price of a
        far-sighted agent. That single picture is existence, uniqueness, and convergence all at once — the whole
        Banach argument, moving.
      </div>
    </div>
  );
}

const wrap: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, margin: "1.6rem 0" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)" };
const caption: React.CSSProperties = { fontSize: 12.5, color: "var(--muted)", marginTop: 12, lineHeight: 1.55 };
const panel: React.CSSProperties = { fontSize: 12.5, color: "var(--muted)", background: "var(--canvas)", border: "1px solid var(--border)", borderRadius: 10, padding: "9px 12px", marginTop: 10, lineHeight: 1.5 };
const btn: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: 7, cursor: "pointer", padding: "5px 12px", fontSize: 12.5, color: "var(--ink)", fontFamily: "var(--font-sans, sans-serif)", background: "transparent" };
const sl: React.CSSProperties = { display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "var(--muted)", marginTop: 10 };
const mono: React.CSSProperties = { color: "var(--ink)", fontFamily: "ui-monospace, monospace" };
