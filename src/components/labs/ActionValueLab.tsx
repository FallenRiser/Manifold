"use client";

import { useMemo, useState } from "react";

// The action-value function, made tangible. Click any non-terminal cell and the
// panel shows all four Q(s,a) as bars, the state value V(s) as a reference line,
// and each action's advantage A(s,a) = Q(s,a) - V(s). Under the random policy the
// line sits at the AVERAGE of the four Q's (V = mean of Q); under the optimal
// policy it sits at the MAX (V = best Q), so the picture literally shows the two
// V/Q identities. Best action(s) are starred — that argmax IS the greedy policy.
// All values are solved live on the 4x4 gridworld and match the textbook numbers.

const ACCENT = "var(--c-rl)";
const NROW = 4, NCOL = 4, NS = 16, NA = 4;
const TERMINALS = [0, 15];
const NAMES = ["up", "right", "down", "left"];
const ARROWS = ["↑", "→", "↓", "←"];
const MOVES: [number, number][] = [[-1, 0], [0, 1], [1, 0], [0, -1]];

function nextState(s: number, a: number) {
  const r = Math.floor(s / NCOL), c = s % NCOL;
  const nr = r + MOVES[a][0], nc = c + MOVES[a][1];
  if (nr < 0 || nr >= NROW || nc < 0 || nc >= NCOL) return s;
  return nr * NCOL + nc;
}
const reward = (s: number) => (TERMINALS.includes(s) ? 0 : -1);

function solve(gamma: number, optimal: boolean) {
  const V = new Array(NS).fill(0);
  for (let it = 0; it < 5000; it++) {
    let delta = 0;
    for (let s = 0; s < NS; s++) {
      if (TERMINALS.includes(s)) continue;
      const q = MOVES.map((_, a) => reward(s) + gamma * V[nextState(s, a)]);
      const v = optimal ? Math.max(...q) : q.reduce((x, y) => x + y, 0) / NA;
      delta = Math.max(delta, Math.abs(v - V[s]));
      V[s] = v;
    }
    if (delta < 1e-9) break;
  }
  return V;
}

export function ActionValueLab() {
  const [optimal, setOptimal] = useState(false);
  const [gamma, setGamma] = useState(1);
  const [sel, setSel] = useState(6);

  const V = useMemo(() => solve(gamma, optimal), [gamma, optimal]);
  const q = useMemo(() => MOVES.map((_, a) => reward(sel) + gamma * V[nextState(sel, a)]), [sel, gamma, V]);
  const vSel = V[sel];
  const qMax = Math.max(...q);
  const best = q.map((v) => Math.abs(v - qMax) < 1e-6);

  // bar geometry: map the Q range onto a horizontal track
  const lo = Math.min(...q, vSel), hi = Math.max(...q, vSel);
  const pad = Math.max(0.5, (hi - lo) * 0.12);
  const min = lo - pad, max = hi + pad;
  const x = (v: number) => Math.round(((v - min) / (max - min)) * 1000) / 10; // 0..100 (%)

  const S = 260, cell = S / 4;

  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
        <span style={head}>Q(s, a) vs V(s) — click a cell</span>
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>{optimal ? "optimal values V*" : "random-policy values Vπ"}</span>
      </div>

      <div style={{ display: "flex", gap: 18, flexWrap: "wrap", alignItems: "flex-start" }}>
        {/* the grid — pick a state */}
        <svg viewBox={`0 0 ${S} ${S}`} style={{ width: "min(100%, 240px)", height: "auto", flex: "0 0 auto" }}>
          {Array.from({ length: NS }, (_, s) => {
            const r = Math.floor(s / NCOL), c = s % NCOL;
            const term = TERMINALS.includes(s);
            const selected = s === sel;
            return (
              <g key={s} onClick={() => !term && setSel(s)} style={{ cursor: term ? "default" : "pointer" }}>
                <rect x={c * cell + 1} y={r * cell + 1} width={cell - 2} height={cell - 2} rx={4}
                  fill={term ? "color-mix(in srgb, var(--good) 22%, var(--canvas))"
                    : selected ? `color-mix(in srgb, ${ACCENT} 30%, var(--canvas))` : "var(--canvas)"}
                  stroke={selected ? ACCENT : "var(--border-strong)"} strokeWidth={selected ? 2.5 : 1} />
                <text x={c * cell + cell / 2} y={r * cell + cell / 2 + 4} textAnchor="middle" fontSize={12}
                  fill={term ? "var(--good)" : "var(--muted)"} fontFamily="ui-monospace, monospace">
                  {term ? "goal" : V[s].toFixed(1)}
                </text>
              </g>
            );
          })}
        </svg>

        {/* the Q panel for the selected state */}
        <div style={{ flex: "1 1 240px", minWidth: 220 }}>
          <div style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 8 }}>
            State {sel} · <b style={{ color: "var(--ink)", fontFamily: "ui-monospace, monospace" }}>V(s) = {vSel.toFixed(1)}</b>
            {" "}({optimal ? "= max of Q" : "= mean of Q"})
          </div>
          {q.map((qv, a) => (
            <div key={a} style={{ marginBottom: 9 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                <span style={{ color: "var(--ink)" }}>
                  <span style={{ color: ACCENT, fontSize: 14 }}>{ARROWS[a]}</span> {NAMES[a]} {best[a] && <span title="greedy (argmax) action">★</span>}
                </span>
                <span style={{ fontFamily: "ui-monospace, monospace", color: "var(--muted)" }}>
                  Q={qv.toFixed(1)} · A={(qv - vSel >= 0 ? "+" : "") + (qv - vSel).toFixed(1)}
                </span>
              </div>
              <div style={{ position: "relative", height: 14, background: "var(--canvas)", borderRadius: 4, border: "1px solid var(--border)" }}>
                <div style={{
                  position: "absolute", left: 0, top: 0, bottom: 0, width: `${x(qv)}%`,
                  background: best[a] ? ACCENT : `color-mix(in srgb, ${ACCENT} 45%, var(--canvas))`,
                  borderRadius: 3,
                }} />
                {/* V(s) reference line */}
                <div style={{ position: "absolute", left: `${x(vSel)}%`, top: -3, bottom: -3, width: 2, background: "var(--ink)" }} title="V(s)" />
              </div>
            </div>
          ))}
          <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 2 }}>
            bar = Q(s,a) · black line = V(s) · ★ = greedy choice
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14, alignItems: "center" }}>
        <button style={{ ...btn, background: !optimal ? `color-mix(in srgb, ${ACCENT} 18%, transparent)` : "transparent", borderColor: !optimal ? ACCENT : "var(--border)" }} onClick={() => setOptimal(false)}>Random policy</button>
        <button style={{ ...btn, background: optimal ? `color-mix(in srgb, ${ACCENT} 18%, transparent)` : "transparent", borderColor: optimal ? ACCENT : "var(--border)" }} onClick={() => setOptimal(true)}>Optimal policy</button>
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "var(--muted)", marginTop: 10 }}>
        <span style={{ minWidth: 96 }}>γ: <b style={{ color: "var(--ink)", fontFamily: "ui-monospace, monospace" }}>{gamma.toFixed(2)}</b></span>
        <input type="range" min={0.5} max={1} step={0.01} value={gamma} onChange={(e) => setGamma(Number(e.target.value))} style={{ flex: 1, accentColor: ACCENT }} aria-label="discount factor" />
      </label>

      <div style={caption}>
        Every action from a state has its own value <strong>Q(s,a)</strong> — the reward for that move plus the
        discounted value of where it lands. The state value <strong>V(s)</strong> (black line) is what the policy
        makes of them: under the <strong>random policy</strong> it sits at the <em>average</em> of the four bars;
        under the <strong>optimal policy</strong> it sits at the <em>best</em> one. The gap from a bar to the line
        is the <strong>advantage</strong> — positive means &ldquo;better than the state&rsquo;s habit,&rdquo; and
        the starred bar (the <M>argmax</M>) is exactly the greedy action. Acting on Q needs no model: just take
        the longest bar.
      </div>
    </div>
  );
}

// tiny inline substitute so the caption can name argmax without importing Math
function M({ children }: { children: React.ReactNode }) {
  return <em style={{ fontFamily: "ui-monospace, monospace", fontStyle: "normal" }}>{children}</em>;
}

const wrap: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, margin: "1.6rem 0" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)" };
const caption: React.CSSProperties = { fontSize: 12.5, color: "var(--muted)", marginTop: 12, lineHeight: 1.55 };
const btn: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: 7, cursor: "pointer", padding: "5px 12px", fontSize: 12.5, color: "var(--ink)", fontFamily: "var(--font-sans, sans-serif)" };
