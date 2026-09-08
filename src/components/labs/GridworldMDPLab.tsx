"use client";

import { useState } from "react";

// The MDP tuple made clickable. Pick a cell (a state s) and an action, and the lab
// shows exactly what the environment does: the probability vector P(s'|s,a) drawn
// as weighted arrows, and the reward R(s,a). Drag "slip" up and the once-crisp
// arrow fans into a real distribution — the point being that P[s,a,·] is a
// probability vector, not a single destination. Deterministic at slip = 0 matches
// the gridworld the code samples use.

const ACCENT = "var(--c-rl)";
const NROW = 4, NCOL = 4, NS = 16;
const TERMINALS = [0, 15];
const DIRS = [
  { name: "up", dr: -1, dc: 0 },
  { name: "right", dr: 0, dc: 1 },
  { name: "down", dr: 1, dc: 0 },
  { name: "left", dr: 0, dc: -1 },
];

function dest(s: number, dr: number, dc: number) {
  const r = Math.floor(s / NCOL), c = s % NCOL;
  const nr = r + dr, nc = c + dc;
  if (nr < 0 || nr >= NROW || nc < 0 || nc >= NCOL) return s; // bounce
  return nr * NCOL + nc;
}

// distribution over next states for taking action `a` in state `s` with slip prob
function transition(s: number, a: number, slip: number): Record<number, number> {
  if (TERMINALS.includes(s)) return { [s]: 1 };
  const intended = DIRS[a];
  const perps = a % 2 === 0 ? [DIRS[1], DIRS[3]] : [DIRS[0], DIRS[2]]; // perpendicular pair
  const dist: Record<number, number> = {};
  const add = (ns: number, p: number) => { dist[ns] = (dist[ns] || 0) + p; };
  add(dest(s, intended.dr, intended.dc), 1 - slip);
  add(dest(s, perps[0].dr, perps[0].dc), slip / 2);
  add(dest(s, perps[1].dr, perps[1].dc), slip / 2);
  return dist;
}

export function GridworldMDPLab() {
  const [sel, setSel] = useState(5);
  const [act, setAct] = useState(1); // right
  const [slip, setSlip] = useState(0);

  const S = 300, cell = S / 4, pad = 6;
  const center = (s: number) => {
    const r = Math.floor(s / NCOL), c = s % NCOL;
    return { x: c * cell + cell / 2, y: r * cell + cell / 2 };
  };
  const dist = transition(sel, act, slip);
  const reward = TERMINALS.includes(sel) ? 0 : -1;

  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
        <span style={head}>The MDP, one state at a time</span>
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>click a cell · pick an action</span>
      </div>

      <div style={{ display: "flex", gap: 18, flexWrap: "wrap", alignItems: "flex-start" }}>
        <svg viewBox={`0 0 ${S} ${S}`} style={{ width: "min(100%, 300px)", height: "auto", display: "block", flexShrink: 0 }}>
          {Array.from({ length: NS }, (_, s) => {
            const r = Math.floor(s / NCOL), c = s % NCOL;
            const term = TERMINALS.includes(s);
            const isSel = s === sel;
            return (
              <g key={s} style={{ cursor: "pointer" }} onClick={() => setSel(s)}>
                <rect x={c * cell + 1} y={r * cell + 1} width={cell - 2} height={cell - 2} rx={4}
                  fill={term ? "color-mix(in srgb, var(--good) 18%, var(--canvas))" : isSel ? `color-mix(in srgb, ${ACCENT} 18%, var(--canvas))` : "var(--canvas)"}
                  stroke={isSel ? ACCENT : "var(--border-strong)"} strokeWidth={isSel ? 2 : 1} />
                <text x={c * cell + 5} y={r * cell + 13} fontSize={9} fill="var(--faint)">{s}</text>
                {term && <text x={c * cell + cell / 2} y={r * cell + cell / 2 + 4} textAnchor="middle" fontSize={11} fill="var(--good)">goal</text>}
              </g>
            );
          })}
          {/* transition arrows from the selected cell */}
          {!TERMINALS.includes(sel) && Object.entries(dist).map(([nsStr, p]) => {
            const ns = Number(nsStr);
            const a = center(sel), b = center(ns);
            if (ns === sel) {
              return <circle key={ns} cx={a.x} cy={a.y} r={7} fill="none" stroke={ACCENT} strokeWidth={1 + 3 * p} opacity={0.5 + 0.5 * p} />;
            }
            const mx = a.x + (b.x - a.x) * 0.78, my = a.y + (b.y - a.y) * 0.78;
            return (
              <g key={ns}>
                <line x1={a.x} y1={a.y} x2={mx} y2={my} stroke={ACCENT} strokeWidth={1 + 4 * p} opacity={0.4 + 0.6 * p} strokeLinecap="round" />
                <circle cx={mx} cy={my} r={2.5 + 2 * p} fill={ACCENT} opacity={0.5 + 0.5 * p} />
                <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 3} textAnchor="middle" fontSize={9} fill="var(--ink)" fontFamily="ui-monospace, monospace">{p.toFixed(2)}</text>
              </g>
            );
          })}
          <circle cx={center(sel).x} cy={center(sel).y} r={4} fill={ACCENT} />
        </svg>

        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>action from state <b style={{ color: "var(--ink)" }}>{sel}</b>:</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            {DIRS.map((d, i) => (
              <button key={d.name} onClick={() => setAct(i)}
                style={{ ...btn, background: act === i ? `color-mix(in srgb, ${ACCENT} 20%, transparent)` : "transparent", borderColor: act === i ? ACCENT : "var(--border)" }}>
                {d.name}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.7 }}>
            <div><b style={{ color: "var(--ink)", fontFamily: "ui-monospace, monospace" }}>R(s, a) = {reward}</b> &nbsp;(reward for the step)</div>
            <div style={{ marginTop: 6, marginBottom: 2 }}>P(s′ | s, a):</div>
            {Object.entries(dist).sort((a, b) => b[1] - a[1]).map(([ns, p]) => (
              <div key={ns} style={{ fontFamily: "ui-monospace, monospace", fontSize: 12 }}>
                → s′={ns}{Number(ns) === sel ? " (stays)" : ""}: {(p as number).toFixed(2)}
              </div>
            ))}
          </div>
        </div>
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "var(--muted)", marginTop: 12 }}>
        <span style={{ minWidth: 118 }}>slip prob: <b style={{ color: "var(--ink)", fontFamily: "ui-monospace, monospace" }}>{slip.toFixed(2)}</b></span>
        <input type="range" min={0} max={0.4} step={0.05} value={slip} onChange={(e) => setSlip(Number(e.target.value))} style={{ flex: 1, accentColor: ACCENT }} aria-label="slip probability" />
      </label>

      <div style={caption}>
        Each action names not a destination but a <strong>distribution</strong> over next states,{" "}
        <M>P(s&#8242; \mid s, a)</M>. At slip = 0 the world is deterministic — the arrow points one way with
        probability 1.00. Raise the slip and the intended move keeps most of the weight while the two
        perpendicular moves split the rest: now the same action lands you in three possible cells. The reward{" "}
        <M>R(s, a)</M> is −1 for every ordinary step and 0 in the absorbing goal corners. That is the whole
        environment: <M>S</M>, <M>A</M>, <M>P</M>, <M>R</M>.
      </div>
    </div>
  );
}

function M({ children }: { children: React.ReactNode }) {
  return <span style={{ fontFamily: "ui-monospace, monospace", fontSize: "0.95em", color: "var(--ink)" }}>{children}</span>;
}

const wrap: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, margin: "1.6rem 0" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)" };
const caption: React.CSSProperties = { fontSize: 12.5, color: "var(--muted)", marginTop: 12, lineHeight: 1.55 };
const btn: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: 7, cursor: "pointer", padding: "4px 10px", fontSize: 12, color: "var(--ink)", fontFamily: "var(--font-sans, sans-serif)" };
