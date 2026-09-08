"use client";

import { useState } from "react";

// Iterative policy evaluation, one sweep at a time. Start every value at 0 and
// apply the Bellman expectation backup across the grid; watch value seep outward
// from the terminal corners, sweep by sweep, until it stops changing. This is the
// flagship: the reader presses "Sweep" and literally sees the fixed point form.
// Cells that changed this sweep flash; the max change (delta) is the convergence
// signal. Toggle the policy and drag gamma to see the landscape and speed shift.

const ACCENT = "var(--c-rl)";
const NROW = 4, NCOL = 4, NS = 16, NA = 4;
const TERMINALS = [0, 15];
const MOVES: [number, number][] = [[-1, 0], [0, 1], [1, 0], [0, -1]];

function nextState(s: number, a: number) {
  const r = Math.floor(s / NCOL), c = s % NCOL;
  const nr = r + MOVES[a][0], nc = c + MOVES[a][1];
  if (nr < 0 || nr >= NROW || nc < 0 || nc >= NCOL) return s;
  return nr * NCOL + nc;
}
const reward = (s: number) => (TERMINALS.includes(s) ? 0 : -1);

// toward-nearest-goal deterministic policy
function towardGoal(s: number) {
  const r = Math.floor(s / NCOL), c = s % NCOL;
  const [gr, gc] = r + c >= 3 ? [3, 3] : [0, 0];
  if (r !== gr) return gr > r ? 2 : 0;
  return gc > c ? 1 : 3;
}
function policyProbs(s: number, smart: boolean): number[] {
  if (smart) { const p = [0, 0, 0, 0]; p[towardGoal(s)] = 1; return p; }
  return [0.25, 0.25, 0.25, 0.25];
}

function backup(V: number[], gamma: number, smart: boolean) {
  const Vn = V.slice();
  for (let s = 0; s < NS; s++) {
    if (TERMINALS.includes(s)) { Vn[s] = 0; continue; }
    const p = policyProbs(s, smart);
    let v = 0;
    for (let a = 0; a < NA; a++) v += p[a] * (reward(s) + gamma * V[nextState(s, a)]);
    Vn[s] = v;
  }
  return Vn;
}

export function PolicyEvaluationLab() {
  const [V, setV] = useState<number[]>(Array(NS).fill(0));
  const [prev, setPrev] = useState<number[]>(Array(NS).fill(0));
  const [iter, setIter] = useState(0);
  const [gamma, setGamma] = useState(1);
  const [smart, setSmart] = useState(false);

  const delta = Math.max(...V.map((v, i) => Math.abs(v - prev[i])), 0);

  function sweep() {
    setPrev(V);
    setV(backup(V, gamma, smart));
    setIter((i) => i + 1);
  }
  function run() {
    let cur = V, p = V, k = iter;
    for (let n = 0; n < 500; n++) {
      const nx = backup(cur, gamma, smart);
      p = cur; cur = nx; k++;
      if (Math.max(...nx.map((v, i) => Math.abs(v - p[i]))) < 1e-4) break;
    }
    setPrev(p); setV(cur); setIter(k);
  }
  function reset() { setV(Array(NS).fill(0)); setPrev(Array(NS).fill(0)); setIter(0); }

  const lo = Math.min(...V, 0), hi = Math.max(...V, 0);
  const norm = (v: number) => (hi - lo < 1e-9 ? 0 : (v - lo) / (hi - lo));
  const S = 300, cell = S / 4;

  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
        <span style={head}>Iterative policy evaluation</span>
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>press Sweep and watch value spread</span>
      </div>

      <svg viewBox={`0 0 ${S} ${S}`} style={{ width: "min(100%, 300px)", height: "auto", display: "block", margin: "0 auto" }}>
        {Array.from({ length: NS }, (_, s) => {
          const r = Math.floor(s / NCOL), c = s % NCOL;
          const term = TERMINALS.includes(s);
          const changed = Math.abs(V[s] - prev[s]) > 1e-6;
          const t = norm(V[s]);
          return (
            <g key={s}>
              <rect x={c * cell + 1} y={r * cell + 1} width={cell - 2} height={cell - 2} rx={4}
                fill={term ? "color-mix(in srgb, var(--good) 22%, var(--canvas))" : `color-mix(in srgb, ${ACCENT} ${Math.round(6 + t * 60)}%, var(--canvas))`}
                stroke={changed ? ACCENT : "var(--border-strong)"} strokeWidth={changed ? 2.5 : 1} />
              <text x={c * cell + cell / 2} y={r * cell + cell / 2 + 4} textAnchor="middle" fontSize={13}
                fill="var(--ink)" fontFamily="ui-monospace, monospace">{V[s].toFixed(1)}</text>
              {term && <text x={c * cell + cell / 2} y={r * cell + cell / 2 + 17} textAnchor="middle" fontSize={8.5} fill="var(--good)">goal</text>}
            </g>
          );
        })}
      </svg>

      <div style={{ display: "flex", gap: 18, flexWrap: "wrap", fontSize: 12.5, margin: "10px 0 2px", justifyContent: "center" }}>
        <Stat label="sweep" value={String(iter)} />
        <Stat label="max change (Δ)" value={iter === 0 ? "—" : delta.toFixed(3)} />
        <Stat label="converged?" value={iter > 0 && delta < 1e-3 ? "yes" : "no"} />
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10, justifyContent: "center" }}>
        <button style={btnHi} onClick={sweep}>Sweep once</button>
        <button style={btn} onClick={run}>Run to convergence</button>
        <button style={{ ...btn, color: "var(--muted)" }} onClick={reset}>Reset</button>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8, justifyContent: "center", alignItems: "center" }}>
        <button style={{ ...btn, background: !smart ? `color-mix(in srgb, ${ACCENT} 16%, transparent)` : "transparent", borderColor: !smart ? ACCENT : "var(--border)" }} onClick={() => { setSmart(false); reset(); }}>Random policy</button>
        <button style={{ ...btn, background: smart ? `color-mix(in srgb, ${ACCENT} 16%, transparent)` : "transparent", borderColor: smart ? ACCENT : "var(--border)" }} onClick={() => { setSmart(true); reset(); }}>Toward-goal policy</button>
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "var(--muted)", marginTop: 10 }}>
        <span style={{ minWidth: 96 }}>γ: <b style={{ color: "var(--ink)", fontFamily: "ui-monospace, monospace" }}>{gamma.toFixed(2)}</b></span>
        <input type="range" min={0.5} max={1} step={0.01} value={gamma} onChange={(e) => { setGamma(Number(e.target.value)); reset(); }} style={{ flex: 1, accentColor: ACCENT }} aria-label="discount factor" />
      </label>

      <div style={caption}>
        Every value starts at 0. Each <strong>sweep</strong> replaces every cell with the Bellman backup — its
        reward plus the discounted average of its neighbours&rsquo; current values. On sweep 1 only cells next to
        a goal change; on sweep 2 their neighbours catch up; value <strong>seeps outward from the terminals</strong>{" "}
        until the whole grid stops moving (Δ → 0). That frozen grid is <M>V<sup>π</sup></M> — the fixed point,
        found without ever inverting a matrix. Switch policies or drag γ and watch how the landscape and the
        number of sweeps both change.
      </div>
    </div>
  );
}

function M({ children }: { children: React.ReactNode }) {
  return <span style={{ fontFamily: "ui-monospace, monospace", fontSize: "0.95em", color: "var(--ink)" }}>{children}</span>;
}
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
      <b style={{ fontSize: 15, color: "var(--ink)", fontFamily: "ui-monospace, monospace" }}>{value}</b>
      <span style={{ fontSize: 10, color: "var(--faint)", textTransform: "uppercase", letterSpacing: "0.03em" }}>{label}</span>
    </span>
  );
}

const wrap: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, margin: "1.6rem 0" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)" };
const caption: React.CSSProperties = { fontSize: 12.5, color: "var(--muted)", marginTop: 12, lineHeight: 1.55 };
const btn: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: 8, cursor: "pointer", padding: "6px 13px", fontSize: 12.5, color: "var(--ink)", fontFamily: "var(--font-sans, sans-serif)", background: "transparent" };
const btnHi: React.CSSProperties = { ...btn, background: "color-mix(in srgb, var(--c-rl) 20%, transparent)", borderColor: ACCENT, fontWeight: 600 };
