"use client";

import { useState } from "react";

// The discount factor, made tangible two ways at once. The bars show how much a
// reward k steps away is worth today — the weight gamma^k — so you watch the
// agent's "horizon" grow and shrink as you drag gamma. The readout underneath
// pits a small reward NOW against a bigger reward LATER and shows which one a
// gamma-discounted agent prefers, with the crossover the whole idea turns on.
// Everything is closed-form in gamma, so it is SSR-safe with rounded coords.

const ACCENT = "var(--c-rl)";

export function DiscountLab() {
  const [gamma, setGamma] = useState(0.9);
  const NEAR = 1;      // reward available immediately
  const FAR = 2;       // bigger reward, but delayed
  const DELAY = 5;     // steps until the far reward

  const W = 420, H = 180, padL = 30, padB = 30, padT = 14;
  const KMAX = 15;
  const bw = (W - padL - 12) / (KMAX + 1);
  const by = (v: number) => padT + (1 - v) * (H - padT - padB);

  const nearVal = NEAR;                       // gamma^0 * NEAR
  const farVal = FAR * Math.pow(gamma, DELAY); // gamma^DELAY * FAR
  const horizon = gamma < 1 ? 1 / (1 - gamma) : Infinity;
  const crossover = Math.pow(NEAR / FAR, 1 / DELAY); // gamma where near == far

  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
        <span style={head}>What a future reward is worth today: γ<sup>k</sup></span>
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>drag γ</span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        {[0, 0.5, 1].map((v) => (
          <g key={v}>
            <line x1={padL} y1={by(v)} x2={W - 6} y2={by(v)} stroke="var(--border)" strokeWidth={1} />
            <text x={padL - 5} y={by(v) + 3} textAnchor="end" fontSize={8.5} fill="var(--faint)">{v}</text>
          </g>
        ))}
        {Array.from({ length: KMAX + 1 }, (_, k) => {
          const w = Math.pow(gamma, k);
          const x = padL + k * bw + 3;
          const isFar = k === DELAY;
          return (
            <g key={k}>
              <rect x={x} y={by(w)} width={bw - 4} height={Math.max(0, by(0) - by(w))} rx={2}
                fill={isFar ? ACCENT : `color-mix(in srgb, ${ACCENT} 38%, var(--surface))`} />
              {(k % 5 === 0) && <text x={x + (bw - 4) / 2} y={H - padB + 12} textAnchor="middle" fontSize={8.5} fill="var(--faint)">{k}</text>}
            </g>
          );
        })}
        <text x={(W + padL) / 2} y={H - 4} textAnchor="middle" fontSize={9} fill="var(--muted)">steps into the future (k)</text>
      </svg>

      <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "var(--muted)", marginTop: 10 }}>
        <span style={{ minWidth: 118 }}>γ (discount): <b style={{ color: "var(--ink)", fontFamily: "ui-monospace, monospace" }}>{gamma.toFixed(2)}</b></span>
        <input type="range" min={0} max={0.99} step={0.01} value={gamma} onChange={(e) => setGamma(Number(e.target.value))} style={{ flex: 1, accentColor: ACCENT }} aria-label="discount factor gamma" />
      </label>

      <div style={{ display: "flex", gap: 18, flexWrap: "wrap", fontSize: 12.5, margin: "10px 0 2px" }}>
        <Stat label="effective horizon 1/(1−γ)" value={gamma < 1 ? `${horizon.toFixed(1)} steps` : "∞"} />
        <Stat label={`+1 now`} value={nearVal.toFixed(2)} hi={nearVal >= farVal} />
        <Stat label={`+2 in ${DELAY} steps`} value={farVal.toFixed(2)} hi={farVal > nearVal} />
      </div>

      <div style={caption}>
        Each bar is <M>γ<sup>k</sup></M> — how much a reward <M>k</M> steps away counts <em>now</em>. At{" "}
        γ&nbsp;=&nbsp;0 only the next step matters (a purely myopic agent); as γ&nbsp;→&nbsp;1 the far future
        counts almost as much as the present, and the <em>effective horizon</em> <M>1/(1-γ)</M> stretches out.
        Watch the contest at the right: a guaranteed <strong>+1 now</strong> versus a <strong>+2 in {DELAY}{" "}
        steps</strong>. The delayed reward wins only once γ climbs above{" "}
        <b style={{ fontFamily: "ui-monospace, monospace", color: "var(--ink)" }}>{crossover.toFixed(2)}</b> — below
        that, a far-sighted prize isn&rsquo;t worth the wait. That single number is the difference between an
        agent that grabs and one that plans.
      </div>
    </div>
  );
}

function M({ children }: { children: React.ReactNode }) {
  return <span style={{ fontFamily: "ui-monospace, monospace", fontSize: "0.95em", color: "var(--ink)" }}>{children}</span>;
}

function Stat({ label, value, hi }: { label: string; value: string; hi?: boolean }) {
  return (
    <span style={{ display: "inline-flex", flexDirection: "column" }}>
      <b style={{ fontSize: 15, color: hi ? ACCENT : "var(--ink)", fontFamily: "ui-monospace, monospace" }}>{value}</b>
      <span style={{ fontSize: 10, color: "var(--faint)", textTransform: "uppercase", letterSpacing: "0.03em" }}>{label}</span>
    </span>
  );
}

const wrap: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, margin: "1.6rem 0" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)" };
const caption: React.CSSProperties = { fontSize: 12.5, color: "var(--muted)", marginTop: 12, lineHeight: 1.55 };
