"use client";

import { useState } from "react";

// A k-armed bandit you play by hand. Five arms, each paying a noisy reward around
// a hidden true mean. Click an arm to pull it; the bars show your running estimate
// of each arm's value and how many times you've tried it. The lesson is playable:
// pour every pull into the arm that looks best right now and you may never discover
// that a rarely-tried arm is actually better — that's the cost of pure exploitation.
// You can also hand the wheel to an epsilon-greedy agent and watch the tradeoff.
//
// True means are fixed (commented) so the "which arm was really best" reveal is
// honest; the per-pull rewards are live random draws (a real simulation).
const TRUE_MEANS = [1.0, 1.6, 1.2, 2.1, 0.8]; // arm 3 (0-indexed) is best, at 2.1
const NOISE = 0.9;
const K = TRUE_MEANS.length;
const BEST = 3;
const ACCENT = "var(--c-rl)";

function gauss(mean: number, sd: number) {
  // Box–Muller
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function BanditLab() {
  const [counts, setCounts] = useState<number[]>(Array(K).fill(0));
  const [sums, setSums] = useState<number[]>(Array(K).fill(0));
  const [total, setTotal] = useState(0);
  const [pulls, setPulls] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [eps, setEps] = useState(0.1);

  const est = (i: number) => (counts[i] ? sums[i] / counts[i] : 0);

  function apply(i: number, c: number[], s: number[]) {
    const r = gauss(TRUE_MEANS[i], NOISE);
    c[i] += 1;
    s[i] += r;
    return r;
  }

  function pull(i: number) {
    const c = [...counts], s = [...sums];
    const r = apply(i, c, s);
    setCounts(c); setSums(s); setTotal((t) => t + r); setPulls((p) => p + 1);
  }

  function runEpsGreedy(n: number) {
    const c = [...counts], s = [...sums];
    let added = 0;
    for (let k = 0; k < n; k++) {
      let i: number;
      if (Math.random() < eps) {
        i = Math.floor(Math.random() * K);          // explore
      } else {
        const e = c.map((_, j) => (c[j] ? s[j] / c[j] : 0)); // exploit current best
        i = e.indexOf(Math.max(...e));
      }
      added += apply(i, c, s);
    }
    setCounts(c); setSums(s); setTotal((t) => t + added); setPulls((p) => p + n);
  }

  function reset() {
    setCounts(Array(K).fill(0)); setSums(Array(K).fill(0));
    setTotal(0); setPulls(0); setRevealed(false);
  }

  const W = 420, H = 210, padL = 34, padB = 40, padT = 14;
  const VMAX = 3;
  const bw = (W - padL - 16) / K;
  const by = (v: number) => padT + (1 - Math.max(0, Math.min(VMAX, v)) / VMAX) * (H - padT - padB);
  const bestSeen = pulls > 0 ? counts.map((_, i) => est(i)).indexOf(Math.max(...counts.map((_, i) => est(i)))) : -1;
  const avg = pulls ? total / pulls : 0;
  const onBest = pulls ? (counts[BEST] / pulls) * 100 : 0;

  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
        <span style={head}>A 5-armed bandit</span>
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>click an arm to pull it</span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        {/* y grid */}
        {[0, 1, 2, 3].map((v) => (
          <g key={v}>
            <line x1={padL} y1={by(v)} x2={W - 8} y2={by(v)} stroke="var(--border)" strokeWidth={1} />
            <text x={padL - 6} y={by(v) + 3} textAnchor="end" fontSize={9} fill="var(--faint)">{v}</text>
          </g>
        ))}
        {counts.map((n, i) => {
          const x = padL + i * bw + 6;
          const w = bw - 12;
          const e = est(i);
          const isBestSeen = i === bestSeen && pulls > 0;
          return (
            <g key={i} style={{ cursor: "pointer" }} onClick={() => pull(i)}>
              {/* hit area */}
              <rect x={x - 4} y={padT} width={w + 8} height={H - padT - padB} fill="transparent" />
              {/* true mean marker (after reveal) */}
              {revealed && (
                <line x1={x - 2} y1={by(TRUE_MEANS[i])} x2={x + w + 2} y2={by(TRUE_MEANS[i])}
                  stroke={i === BEST ? "var(--good)" : "var(--muted)"} strokeWidth={2} strokeDasharray="4 2" />
              )}
              {/* estimate bar */}
              <rect x={x} y={by(e)} width={w} height={Math.max(0, H - padB - by(e))} rx={3}
                fill={isBestSeen ? ACCENT : `color-mix(in srgb, ${ACCENT} 45%, var(--surface))`}
                stroke={isBestSeen ? ACCENT : "var(--border-strong)"} strokeWidth={1} />
              <text x={x + w / 2} y={H - padB + 14} textAnchor="middle" fontSize={10} fill="var(--muted)">arm {i}</text>
              <text x={x + w / 2} y={H - padB + 26} textAnchor="middle" fontSize={9} fill="var(--faint)">n={n}</text>
              {n > 0 && (
                <text x={x + w / 2} y={by(e) - 4} textAnchor="middle" fontSize={9.5} fill="var(--ink)" fontFamily="ui-monospace, monospace">{e.toFixed(2)}</text>
              )}
            </g>
          );
        })}
      </svg>

      <div style={{ display: "flex", gap: 18, flexWrap: "wrap", fontSize: 12.5, margin: "10px 0 4px" }}>
        <Stat label="pulls" value={String(pulls)} />
        <Stat label="avg reward" value={avg.toFixed(2)} />
        <Stat label="% on best arm" value={pulls ? `${onBest.toFixed(0)}%` : "—"} />
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "var(--muted)", marginTop: 6 }}>
        <span style={{ minWidth: 96 }}>ε (explore): <b style={{ color: "var(--ink)", fontFamily: "ui-monospace, monospace" }}>{eps.toFixed(2)}</b></span>
        <input type="range" min={0} max={0.5} step={0.02} value={eps} onChange={(e) => setEps(Number(e.target.value))} style={{ flex: 1, accentColor: ACCENT }} aria-label="epsilon exploration rate" />
      </label>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
        <button style={btn} onClick={() => runEpsGreedy(100)}>Run 100 pulls (ε-greedy)</button>
        <button style={btn} onClick={() => setRevealed((r) => !r)}>{revealed ? "Hide" : "Reveal"} true means</button>
        <button style={{ ...btn, color: "var(--muted)" }} onClick={reset}>Reset</button>
      </div>

      <div style={caption}>
        Pull only the arm that currently looks best and you <em>exploit</em> — but with one or two pulls each,
        your estimates are noisy, and you may crown a lucky loser and never look back. Spread your pulls and you{" "}
        <em>explore</em> — paying in low-reward tries to learn which arm is truly best (arm {BEST}, revealed).
        The ε-greedy agent splits the difference: it exploits its best guess most of the time but explores at
        random a fraction ε of the time. Push ε to 0 and it can lock onto the wrong arm; push it high and it
        keeps throwing pulls away on known-bad arms. Somewhere in between is where reward is maximised.
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span style={{ display: "inline-flex", flexDirection: "column" }}>
      <b style={{ fontSize: 15, color: "var(--ink)", fontFamily: "ui-monospace, monospace" }}>{value}</b>
      <span style={{ fontSize: 10.5, color: "var(--faint)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</span>
    </span>
  );
}

const wrap: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, margin: "1.6rem 0" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)" };
const caption: React.CSSProperties = { fontSize: 12.5, color: "var(--muted)", marginTop: 12, lineHeight: 1.55 };
const btn: React.CSSProperties = {
  background: "color-mix(in srgb, var(--c-rl) 12%, transparent)",
  border: "1px solid color-mix(in srgb, var(--c-rl) 35%, var(--border))",
  borderRadius: 8, cursor: "pointer", padding: "6px 12px", fontSize: 12.5, fontWeight: 500,
  color: "var(--ink)", fontFamily: "var(--font-sans, sans-serif)",
};
