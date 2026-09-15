"use client";

import { useState } from "react";

// One table cell, one stuck boat. Each click is one stalled second: the boat takes its favourite action,
// lands back in the same cell, and the Q-learning update fires (α = 0.5, γ = 0.99). The starting values
// are illustrative, not read from a trained table.

const ACTIONS = ["bear left", "hold", "bear right"];
const ALPHA = 0.5, GAMMA = 0.99;
const PRESETS = {
  time: { label: "−1 per second", r: -1, q: [-24, -20, -22] },
  progress: { label: "distance gained", r: 0, q: [9, 12, 10] },
} as const;
type Mode = keyof typeof PRESETS;

export function StallUpdateLab() {
  const [mode, setMode] = useState<Mode>("time");
  const [frozen, setFrozen] = useState(false);
  const [q, setQ] = useState<number[]>([...PRESETS.time.q]);
  const [seconds, setSeconds] = useState(0);
  const [escapedAt, setEscapedAt] = useState<number | null>(null);

  const start = PRESETS[mode];
  const best = q.indexOf(Math.max(...q));
  const startQ: number[] = [...start.q];
  const stuckAction = startQ.indexOf(Math.max(...startQ));

  const reset = (m: Mode = mode, fr = frozen) => { setMode(m); setFrozen(fr); setQ([...PRESETS[m].q]); setSeconds(0); setEscapedAt(null); };

  const stall = (n: number) => {
    let cur = [...q], s = seconds, esc = escapedAt;
    for (let k = 0; k < n; k++) {
      const a = cur.indexOf(Math.max(...cur));
      if (a !== stuckAction) break; // the boat has turned: it is no longer stalled in this cell
      s += 1;
      if (!frozen) cur = cur.map((v, i) => (i === a ? v + ALPHA * (start.r + GAMMA * Math.max(...cur) - v) : v));
      if (cur.indexOf(Math.max(...cur)) !== stuckAction && esc === null) esc = s;
    }
    setQ(cur); setSeconds(s); setEscapedAt(esc);
  };

  const lo = Math.min(...start.q, ...q) - 2, hi = Math.max(...start.q, ...q, 0) + 2;
  const W = 420, H = 150, bw = 90;
  const sy = (v: number) => 12 + ((hi - v) / (hi - lo)) * (H - 36);

  return (
    <div style={box}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
        <span style={head}>One stuck cell, one update per second</span>
        <span style={{ fontSize: 12, color: "var(--faint)", fontFamily: "ui-monospace, monospace" }}>stalled for {seconds} s</span>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
        {(Object.keys(PRESETS) as Mode[]).map((m) => (
          <button key={m} onClick={() => reset(m)} style={{ ...btn, ...(m === mode ? on : {}) }}>paid {PRESETS[m].label}</button>
        ))}
        <button onClick={() => reset(mode, !frozen)} style={{ ...btn, ...(frozen ? on : {}), marginLeft: "auto" }}>{frozen ? "table frozen (test)" : "table learning (practice)"}</button>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 520, height: "auto", display: "block", margin: "0 auto" }} role="img" aria-label="Action values in the stuck cell">
        {lo < 0 && hi > 0 && <line x1={20} x2={W - 20} y1={sy(0)} y2={sy(0)} stroke="var(--border-strong)" />}
        {q.map((v, i) => {
          const x = 40 + i * (bw + 40);
          const top = Math.min(sy(v), sy(Math.max(0, lo))), base = sy(lo < 0 && hi > 0 ? 0 : lo);
          const y0 = Math.min(sy(v), base), hgt = Math.abs(sy(v) - base);
          const isBest = i === best;
          return (
            <g key={i}>
              <rect x={x} y={y0} width={bw} height={Math.max(2, hgt)} rx={5}
                fill={isBest ? "var(--c-rl)" : "color-mix(in srgb, var(--muted) 30%, transparent)"} opacity={isBest ? 0.9 : 1} data-top={top} />
              <text x={x + bw / 2} y={sy(v) + (v < 0 ? 14 : -5)} fontSize={11.5} textAnchor="middle" fill="var(--ink)" fontFamily="ui-monospace, monospace">{v.toFixed(2)}</text>
              <text x={x + bw / 2} y={H - 6} fontSize={11.5} textAnchor="middle" fill={isBest ? "var(--ink)" : "var(--muted)"} fontWeight={isBest ? 600 : 400}>
                {ACTIONS[i]}{isBest ? " ◂ chosen" : ""}
              </text>
            </g>
          );
        })}
      </svg>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginTop: 8 }}>
        <button style={{ ...btn, ...on }} onClick={() => stall(1)} disabled={escapedAt !== null}>one stalled second</button>
        <button style={btn} onClick={() => stall(10)} disabled={escapedAt !== null}>ten seconds</button>
        <button style={btn} onClick={() => stall(200)} disabled={escapedAt !== null}>the rest of the race</button>
        <button style={btn} onClick={() => reset()}>reset</button>
      </div>

      <div style={{ fontSize: 13, textAlign: "center", marginTop: 8, minHeight: 20, color: escapedAt !== null ? "var(--good)" : "var(--muted)" }}>
        {escapedAt !== null
          ? `After ${escapedAt} stalled second${escapedAt === 1 ? "" : "s"}, “hold” no longer looks best: the boat turns and the loop is broken.`
          : frozen && seconds > 0
            ? "Frozen: nothing changes, so the boat chooses “hold” again every second until the clock runs out."
            : seconds > 0 ? `Still stuck. Target each second: ${start.r} + ${GAMMA} × max Q = ${(start.r + GAMMA * Math.max(...q)).toFixed(2)}` : " "}
      </div>
      <div style={{ fontSize: 12, color: "var(--faint)", marginTop: 6, lineHeight: 1.5 }}>
        Illustrative starting values. Under −1 per second each stalled second drags &ldquo;hold&rdquo; down by roughly half a point; under
        distance gained the reward is about zero, and the value only shrinks by 0.5% a second.
      </div>
    </div>
  );
}

const box: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "0.4rem 0 1.6rem" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)" };
const btn: React.CSSProperties = { borderWidth: 1, borderStyle: "solid", borderColor: "var(--border)", borderRadius: 7, cursor: "pointer", padding: "5px 11px", fontSize: 12.5, color: "var(--ink)", background: "transparent" };
const on: React.CSSProperties = { borderColor: "var(--c-rl)", background: "color-mix(in srgb, var(--c-rl) 15%, transparent)" };
