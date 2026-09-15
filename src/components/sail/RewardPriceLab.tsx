"use client";

import { useState } from "react";

// Price the three things a speed-paid boat can do, the way the learner prices them. At the defaults
// (γ 0.99, circling at 2.47 m/s, finishing in 48.3 s at top speed, leaving after 50 s) these are the
// page's 247.0, 115.0 and 57.0. The second mode prices the same behaviours under distance gained, with
// simple stated assumptions, to show the ranking flip.

const TOP = 2.99;

export function RewardPriceLab() {
  const [gamma, setGamma] = useState(0.99);
  const [circle, setCircle] = useState(2.47);
  const [finish, setFinish] = useState(48.3);
  const [mode, setMode] = useState<"speed" | "progress">("speed");

  const G = (u: number, T: number) => (u * (1 - Math.pow(gamma, T))) / (1 - gamma);
  const leaveT = 50;
  const options = mode === "speed"
    ? [
        { name: "circle forever", v: circle / (1 - gamma), note: `${circle.toFixed(2)} m/s, never stopping` },
        { name: "round the mark", v: G(TOP, finish), note: `top speed for ${finish.toFixed(1)} s, then the pay stops` },
        { name: "leave the course", v: G(TOP, leaveT) - 100 * Math.pow(gamma, leaveT - 1), note: "top speed for 50 s, then −100" },
      ]
    : [
        { name: "circle forever", v: 0, note: "each loop ends where it began: no distance gained" },
        { name: "round the mark", v: G(50 / finish, finish), note: `50 m gained, spread evenly over ${finish.toFixed(1)} s` },
        { name: "leave the course", v: -G(TOP, leaveT) - 100 * Math.pow(gamma, leaveT - 1), note: "sailing straight away for 50 s, then −100" },
      ];
  const best = options.reduce((b, o, i) => (o.v > options[b].v ? i : b), 0);
  const lo = Math.min(0, ...options.map((o) => o.v)), hi = Math.max(10, ...options.map((o) => o.v));
  const W = 560, L = 130, R = 60;
  const sx = (x: number) => L + ((x - lo) / (hi - lo)) * (W - L - R);

  return (
    <div style={box}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
        <span style={head}>What each ending is worth to the learner</span>
        <span style={{ display: "flex", gap: 5 }}>
          <button style={{ ...btn, ...(mode === "speed" ? on : {}) }} onClick={() => setMode("speed")}>paid for speed</button>
          <button style={{ ...btn, ...(mode === "progress" ? on : {}) }} onClick={() => setMode("progress")}>paid for distance gained</button>
        </span>
      </div>
      <svg viewBox={`0 0 ${W} 150`} style={{ width: "100%", height: "auto", display: "block" }} role="img" aria-label="Discounted value of each behaviour">
        <line x1={sx(0)} x2={sx(0)} y1={8} y2={142} stroke="var(--border-strong)" />
        {options.map((o, i) => {
          const y = 14 + i * 44;
          const x0 = sx(Math.min(0, o.v)), x1 = sx(Math.max(0, o.v));
          return (
            <g key={o.name}>
              <text x={L - 10} y={y + 15} fontSize={13} textAnchor="end" fill={i === best ? "var(--ink)" : "var(--muted)"} fontWeight={i === best ? 600 : 400}>{o.name}</text>
              <rect x={x0} y={y} width={Math.max(1.5, x1 - x0)} height={22} rx={4}
                fill={i === best ? "var(--c-rl)" : o.v < 0 ? "color-mix(in srgb, var(--bad) 45%, transparent)" : "color-mix(in srgb, var(--muted) 35%, transparent)"} />
              <text x={o.v >= 0 ? x1 + 6 : x0 - 6} y={y + 15} fontSize={12.5} textAnchor={o.v >= 0 ? "start" : "end"} fill="var(--ink)" fontFamily="ui-monospace, monospace">{o.v.toFixed(1)}</text>
              <text x={L} y={y + 36} fontSize={10.5} fill="var(--faint)">{o.note}</text>
            </g>
          );
        })}
      </svg>
      <div style={{ fontSize: 13, color: "var(--ink)", margin: "4px 0 6px" }}>
        The learner&rsquo;s choice: <strong style={{ color: "var(--c-rl)" }}>{options[best].name}</strong>
        {mode === "speed" && best === 0 ? " — finishing ends the pay, so it loses." : mode === "progress" && best === 1 ? " — the behaviour we wanted is now also the best-paid." : ""}
      </div>
      <label style={sl}>
        <span style={{ minWidth: 150 }}>discount γ <b style={mono}>{gamma.toFixed(3)}</b></span>
        <input type="range" min={0.9} max={0.999} step={0.001} value={gamma} onChange={(e) => setGamma(Number(e.target.value))} style={{ flex: 1, accentColor: "var(--c-rl)" }} aria-label="discount" />
      </label>
      {mode === "speed" && (
        <label style={sl}>
          <span style={{ minWidth: 150 }}>circling speed <b style={mono}>{circle.toFixed(2)} m/s</b></span>
          <input type="range" min={0.2} max={2.99} step={0.01} value={circle} onChange={(e) => setCircle(Number(e.target.value))} style={{ flex: 1, accentColor: "var(--c-rl)" }} aria-label="circling speed" />
        </label>
      )}
      <label style={sl}>
        <span style={{ minWidth: 150 }}>time to round <b style={mono}>{finish.toFixed(1)} s</b></span>
        <input type="range" min={32} max={150} step={0.1} value={finish} onChange={(e) => setFinish(Number(e.target.value))} style={{ flex: 1, accentColor: "var(--c-rl)" }} aria-label="finishing time" />
      </label>
      <div style={{ fontSize: 12, color: "var(--faint)", marginTop: 8, lineHeight: 1.5 }}>
        Discounted sums, with the clock bootstrapped as the boat learns it. Try to make rounding the mark win while paid for speed: no
        slider setting gets there unless the boat circles very slowly or the discount is low enough that the future barely counts.
      </div>
    </div>
  );
}

const box: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "0.4rem 0 1.6rem" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)" };
const btn: React.CSSProperties = { borderWidth: 1, borderStyle: "solid", borderColor: "var(--border)", borderRadius: 7, cursor: "pointer", padding: "4px 10px", fontSize: 12, color: "var(--ink)", background: "transparent" };
const on: React.CSSProperties = { borderColor: "var(--c-rl)", background: "color-mix(in srgb, var(--c-rl) 15%, transparent)" };
const sl: React.CSSProperties = { display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "var(--muted)", marginTop: 8 };
const mono: React.CSSProperties = { color: "var(--ink)", fontFamily: "ui-monospace, monospace" };
