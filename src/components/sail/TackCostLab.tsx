"use client";

import { useState } from "react";
import { INERTIA, NO_GO, TURN, polar, wrap } from "./sim";

// What a tack costs, as a function of the one constant that decides it. The manoeuvre is the page's:
// full speed on +50°, bear left 10° a second through the wind to -50°, then hold. Everything is the
// environment's own arithmetic, so at INERTIA = 0.3 the low point is the 0.182 m/s the page prints.

const SECONDS = 30;
const TURN_STEPS = 10;

function simulate(inertia: number) {
  let h = 50, u = polar(50);
  const us = [u], hs = [h];
  let upwind = 0;
  for (let t = 1; t <= SECONDS; t++) {
    if (t <= TURN_STEPS) h = wrap(h - TURN);
    u = u + (polar(h) - u) * inertia;
    upwind += u * Math.cos((h * Math.PI) / 180);
    us.push(u); hs.push(h);
  }
  return { us, hs, upwind, low: Math.min(...us) };
}

export function TackCostLab() {
  const [inertia, setInertia] = useState(INERTIA);
  const sim = simulate(inertia);
  const ref = simulate(INERTIA);
  const full = polar(50);
  const ideal = SECONDS * full * Math.cos((50 * Math.PI) / 180);
  const lost = ideal - sim.upwind;

  const W = 560, H = 230, L = 40, B = 30, T = 14, Rr = 12;
  const sx = (t: number) => L + (t / SECONDS) * (W - L - Rr);
  const sy = (u: number) => T + (1 - u / 3) * (H - T - B);
  const line = (us: number[]) => us.map((u, t) => `${t ? "L" : "M"}${sx(t).toFixed(1)},${sy(u).toFixed(1)}`).join("");
  const deadFrom = sim.hs.findIndex((h) => Math.abs(h) <= NO_GO);
  const deadTo = sim.hs.length - 1 - [...sim.hs].reverse().findIndex((h) => Math.abs(h) <= NO_GO);

  return (
    <div style={box}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 6 }}>
        <span style={head}>What one tack costs</span>
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>+50° → −50°, turning {TURN}° a second</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }} role="img" aria-label="Boat speed through a tack">
        <rect x={sx(deadFrom - 0.5)} y={T} width={sx(deadTo + 0.5) - sx(deadFrom - 0.5)} height={H - T - B} fill="color-mix(in srgb, var(--bad) 9%, transparent)" />
        <text x={(sx(deadFrom) + sx(deadTo)) / 2} y={T + 14} fontSize={10.5} fill="var(--bad)" textAnchor="middle">bow inside the no-go zone</text>
        {[0, 1, 2, 3].map((u) => (
          <g key={u}>
            <line x1={L} x2={W - Rr} y1={sy(u)} y2={sy(u)} stroke="var(--border)" />
            <text x={L - 6} y={sy(u) + 4} fontSize={10} fill="var(--faint)" textAnchor="end">{u}</text>
          </g>
        ))}
        {[0, 5, 10, 15, 20, 25, 30].map((t) => <text key={t} x={sx(t)} y={H - 12} fontSize={10} fill="var(--faint)" textAnchor="middle">{t} s</text>)}
        <text x={12} y={T + 4} fontSize={10} fill="var(--faint)">m/s</text>
        <line x1={L} x2={W - Rr} y1={sy(full)} y2={sy(full)} stroke="var(--good)" strokeDasharray="4 4" opacity={0.7} />
        <text x={W - Rr} y={sy(full) - 5} fontSize={10} fill="var(--good)" textAnchor="end">full speed on ±50°</text>
        {inertia !== INERTIA && <path d={line(ref.us)} fill="none" stroke="var(--faint)" strokeWidth={1.5} strokeDasharray="3 3" />}
        <path d={line(sim.us)} fill="none" stroke="var(--c-rl)" strokeWidth={2.4} />
        {sim.us.map((u, t) => <circle key={t} cx={sx(t)} cy={sy(u)} r={2.4} fill="var(--c-rl)" />)}
      </svg>

      <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--muted)", marginTop: 6 }}>
        <span style={{ minWidth: 120 }}>INERTIA <b style={{ fontFamily: "ui-monospace, monospace", color: "var(--ink)" }}>{inertia.toFixed(2)}</b></span>
        <input type="range" min={0.05} max={1} step={0.05} value={inertia} onChange={(e) => setInertia(Number(e.target.value))} style={{ flex: 1, accentColor: "var(--c-rl)" }} aria-label="inertia" />
      </label>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8, marginTop: 10 }}>
        <Stat label="slowest moment" value={`${sim.low.toFixed(3)} m/s`} sub={`${((sim.low / full) * 100).toFixed(1)}% of full speed`} />
        <Stat label="upwind progress in 30 s" value={`${sim.upwind.toFixed(1)} m`} sub={`a free tack would make ${ideal.toFixed(1)} m`} />
        <Stat label="cost of the tack" value={`${lost.toFixed(1)} m`} sub={`about ${(lost / (full * Math.cos((50 * Math.PI) / 180))).toFixed(0)} s of sailing`} />
      </div>
      <div style={{ fontSize: 12, color: "var(--faint)", marginTop: 8, lineHeight: 1.5 }}>
        {inertia !== INERTIA ? "Dashed grey: the shipped value, 0.3. " : ""}
        &ldquo;A free tack&rdquo; is an imaginary boat that keeps full speed on ±50° for all 30 seconds. Most of the cost comes from the
        seconds spent turning through the wind, which no inertia value removes; inertia decides how much speed survives the turn and how
        long it takes to build back.
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 9, padding: "7px 10px" }}>
      <div style={{ fontSize: 11, color: "var(--faint)" }}>{label}</div>
      <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 15, color: "var(--ink)" }}>{value}</div>
      <div style={{ fontSize: 11, color: "var(--muted)" }}>{sub}</div>
    </div>
  );
}

const box: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "0.4rem 0 1.6rem" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)" };
