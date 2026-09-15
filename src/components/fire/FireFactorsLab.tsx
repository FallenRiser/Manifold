"use client";

import { useEffect, useRef, useState } from "react";

// Last page's spread rule with the three factors switched back on. The constants are the environment's: SPREAD x 0.8,
// BURN_TIME, DIAGONAL 0.7, WIND_GAIN 1.5, SLOPE_GAIN 4 clipped to [0.5, 2], moisture drying 0.01 per tick down to 0.05,
// and a water drop leaving moisture 0.9 on its 5 x 5 square. The wind blows TOWARD its angle, measured clockwise from
// north, exactly like wdir. The dice come from a seeded generator in the page, not numpy.

const N = 16;
const CELL = 28;
const PAD = 6;
const SIZE = N * CELL + PAD * 2;
const UNBURNT = 0, BURNING = 1, BURNT = 2;
const SPREAD = 0.3 * 0.8;                    // grass
const BURN_TIME = 2;
const DIAGONAL = 0.7, WIND_GAIN = 1.5, SLOPE_GAIN = 4, DRYING = 0.01, WET = 0.9, M_START = 0.165;
const DIRS: [number, number][] = [[-1, 0], [-1, 1], [0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1]];
const NAMES = ["north", "north-east", "east", "south-east", "south", "south-west", "west", "north-west"];
const START = 11 * N + 5;

type Tool = "fire" | "water";
type Sim = { S: number[]; timer: number[]; M: number[]; tick: number };
type Part = { k: number; wind: number; slope: number; raw: number };

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A hill in the top right, scaled to 0..1 like the environment's elevation.
const HILL = (() => {
  const z = Array.from({ length: N * N }, (_, i) => {
    const r = Math.floor(i / N), c = i % N;
    return Math.exp(-((r - 4.5) ** 2 + (c - 10.5) ** 2) / (2 * 3.2 * 3.2));
  });
  const lo = Math.min(...z), hi = Math.max(...z);
  return z.map((v) => (v - lo) / (hi - lo));
})();
const FLAT = new Array(N * N).fill(0);

function freshFire(): Sim {
  const S = new Array(N * N).fill(UNBURNT), timer = new Array(N * N).fill(0);
  S[START] = BURNING; timer[START] = BURN_TIME;
  return { S, timer, M: new Array(N * N).fill(M_START), tick: 0 };
}

function chance(sim: Sim, E: number[], i: number, wdir: number, wspd: number) {
  const r = Math.floor(i / N), c = i % N;
  const parts: Part[] = [];
  if (sim.S[i] !== UNBURNT) return { p: 0, parts };
  const wr = -Math.cos(wdir), wc = Math.sin(wdir);
  let notLit = 1;
  DIRS.forEach(([dr, dc], k) => {
    const nr = r - dr, nc = c - dc;                 // the neighbour that sends fire travelling (dr, dc) into this cell
    if (nr < 0 || nr >= N || nc < 0 || nc >= N || sim.S[nr * N + nc] !== BURNING) return;
    const dist = Math.hypot(dr, dc);
    const wind = Math.exp(WIND_GAIN * wspd * (dr * wr + dc * wc) / dist);
    const slope = Math.min(Math.max(Math.exp(SLOPE_GAIN * (E[i] - E[nr * N + nc])), 0.5), 2);
    const raw = SPREAD * (1 - sim.M[i]) * wind * slope * (dist > 1 ? DIAGONAL : 1);
    notLit *= 1 - Math.min(raw, 1);
    parts.push({ k, wind, slope, raw });
  });
  return { p: 1 - notLit, parts };
}

function step(sim: Sim, E: number[], rng: () => number, wdir: number, wspd: number): Sim {
  const dice = Array.from({ length: N * N }, rng);  // one roll for every cell, every tick
  const S = sim.S.slice(), timer = sim.timer.slice();
  for (let i = 0; i < N * N; i++) {
    if (sim.S[i] === BURNING) {
      timer[i] -= 1;
      if (timer[i] <= 0) S[i] = BURNT;
    } else if (dice[i] < chance(sim, E, i, wdir, wspd).p) {
      S[i] = BURNING; timer[i] = BURN_TIME;
    }
  }
  const M = sim.M.map((m) => Math.max(m - DRYING, 0.05));
  return { S, timer, M, tick: sim.tick + 1 };
}

const compassName = (deg: number) => (deg % 45 === 0 ? NAMES[(deg / 45) % 8] : `${deg}°`);

export function FireFactorsLab() {
  const [sim, setSim] = useState<Sim>(freshFire);
  const [deg, setDeg] = useState(0);
  const [wspd, setWspd] = useState(0.6);
  const [hill, setHill] = useState(true);
  const [tool, setTool] = useState<Tool>("fire");
  const [seed, setSeed] = useState(1);
  const [showChance, setShowChance] = useState(true);
  const [hover, setHover] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const rng = useRef(mulberry32(1));
  const simRef = useRef(sim); simRef.current = sim;
  const windRef = useRef({ deg, wspd, hill }); windRef.current = { deg, wspd, hill };
  const painting = useRef(false);

  const E = hill ? HILL : FLAT;
  const wdir = (deg * Math.PI) / 180;
  const burning = sim.S.filter((s) => s === BURNING).length;
  const burnt = sim.S.filter((s) => s === BURNT).length;

  const restart = (newSeed = seed) => {
    setPlaying(false);
    rng.current = mulberry32(newSeed);
    setSim(freshFire());
  };

  const advance = () => {
    const w = windRef.current;
    const next = step(simRef.current, w.hill ? HILL : FLAT, rng.current, (w.deg * Math.PI) / 180, w.wspd);
    simRef.current = next;
    setSim(next);
    return next.S.some((s) => s === BURNING);
  };

  useEffect(() => {
    if (!playing) return;
    let id = 0;
    const loop = () => {
      if (!advance()) { setPlaying(false); return; }
      id = window.setTimeout(loop, 330);
    };
    id = window.setTimeout(loop, 330);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  const paint = (i: number) => {
    const cur = simRef.current;
    if (tool === "fire") {
      if (cur.S[i] !== UNBURNT) return;
      const S = cur.S.slice(), timer = cur.timer.slice();
      S[i] = BURNING; timer[i] = BURN_TIME;
      const next = { ...cur, S, timer }; simRef.current = next; setSim(next);
    } else {                                           // a water drop on the 5 x 5 square, like the helicopter's
      const r = Math.floor(i / N), c = i % N;
      const S = cur.S.slice(), timer = cur.timer.slice(), M = cur.M.slice();
      for (let rr = Math.max(r - 2, 0); rr <= Math.min(r + 2, N - 1); rr++)
        for (let cc = Math.max(c - 2, 0); cc <= Math.min(c + 2, N - 1); cc++) {
          const j = rr * N + cc;
          if (S[j] === BURNING) { S[j] = UNBURNT; timer[j] = 0; }
          M[j] = Math.max(M[j], WET);
        }
      const next = { ...cur, S, timer, M }; simRef.current = next; setSim(next);
    }
  };

  const wr = -Math.cos(wdir), wc = Math.sin(wdir);
  const factors = DIRS.map(([dr, dc]) => Math.exp(WIND_GAIN * wspd * (dr * wr + dc * wc) / Math.hypot(dr, dc)));

  const detail = (() => {
    if (hover === null) return ["Hover a cell to see every factor behind its chance."];
    const where = `moisture ${sim.M[hover].toFixed(3)} · height ${E[hover].toFixed(2)}`;
    if (sim.S[hover] === BURNING) return [`grass, burning · ${sim.timer[hover]} tick${sim.timer[hover] === 1 ? "" : "s"} of fuel left · ${where}`];
    if (sim.S[hover] === BURNT) return [`grass, burnt out · ${where}`];
    const { p, parts } = chance(sim, E, hover, wdir, wspd);
    if (parts.length === 0) return [`grass · ${where} · no burning neighbour · chance this tick 0`];
    const lines = parts.map(({ k, wind, slope, raw }) =>
      `from the ${NAMES[(k + 4) % 8]}, travelling ${NAMES[k]}: 0.240 × (1 − ${sim.M[hover].toFixed(3)}) × wind ${wind.toFixed(2)} × slope ${slope.toFixed(2)}${k % 2 ? " × corner 0.7" : ""} = ${raw.toFixed(3)}${raw > 1 ? " → 1" : ""}`);
    return [`grass · ${where}`, ...lines, `chance this tick ${p.toFixed(3)}`];
  })();

  return (
    <div style={box}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
        <span style={head}>Wind, moisture and slope, one tick at a time</span>
        <span style={{ fontSize: 11.5, color: "var(--faint)", fontFamily: "ui-monospace, monospace" }}>tick {sim.tick}</span>
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ width: "100%", maxWidth: 460, height: "auto", display: "block", borderRadius: 10, border: "1px solid var(--border)", flex: "1 1 300px", touchAction: "none", cursor: "crosshair" }}
          role="img" aria-label={`Fire grid at tick ${sim.tick}, wind toward ${compassName(deg)} at speed ${wspd}: ${burning} cells burning, ${burnt} burnt out`}
          onPointerUp={() => { painting.current = false; }} onPointerLeave={() => { painting.current = false; setHover(null); }}>
          <rect x={0} y={0} width={SIZE} height={SIZE} fill="var(--surface)" />
          {sim.S.map((s, i) => {
            const r = Math.floor(i / N), c = i % N;
            const x = PAD + c * CELL, y = PAD + r * CELL;
            const pc = showChance && s === UNBURNT ? chance(sim, E, i, wdir, wspd).p : 0;
            const wet = Math.max(0, (sim.M[i] - M_START) / (1 - M_START));
            return (
              <g key={i}
                onPointerDown={() => { painting.current = true; paint(i); }}
                onPointerEnter={() => { setHover(i); if (painting.current) paint(i); }}>
                <rect x={x} y={y} width={CELL} height={CELL} stroke="var(--surface)" strokeWidth={1}
                  fill={s === BURNING ? "var(--bad)" : s === BURNT ? "color-mix(in srgb, var(--ink) 62%, var(--surface))"
                    : `color-mix(in srgb, var(--good) ${Math.round(16 + 44 * E[i])}%, var(--surface))`} />
                {s !== BURNING && wet > 0.02 && <rect x={x} y={y} width={CELL} height={CELL} fill="var(--c-regression)" opacity={0.08 + 0.45 * wet} />}
                {s === BURNING && (
                  <path d={`M${x + CELL / 2},${y + 4} C${x + 22},${y + 12} ${x + 22},${y + 23} ${x + CELL / 2},${y + 24} C${x + 6},${y + 23} ${x + 6},${y + 14} ${x + 11},${y + 9} C${x + 12},${y + 14} ${x + 15},${y + 14} ${x + CELL / 2},${y + 4} Z`}
                    fill="color-mix(in srgb, var(--c-rl) 85%, #fff)" opacity={0.85} />
                )}
                {pc > 0 && (
                  <>
                    <rect x={x + 2} y={y + 2} width={CELL - 4} height={CELL - 4} rx={3} fill="none" stroke="var(--bad)" strokeWidth={1 + pc * 3} opacity={0.35 + pc * 0.6} />
                    <text x={x + CELL / 2} y={y + CELL / 2 + 3.5} fontSize={10} textAnchor="middle" fill="var(--ink)" fontFamily="ui-monospace, monospace">{Math.round(pc * 100)}</text>
                  </>
                )}
                {hover === i && <rect x={x + 0.5} y={y + 0.5} width={CELL - 1} height={CELL - 1} fill="none" stroke="var(--ink)" strokeWidth={1.5} />}
              </g>
            );
          })}
        </svg>

        <div style={{ flex: "1 1 210px", minWidth: 200, fontSize: 13, color: "var(--muted)" }}>
          <Compass deg={deg} factors={factors} />
          <label style={lab}>
            <span>wind blows toward <strong style={{ color: "var(--ink)" }}>{compassName(deg)}</strong></span>
            <input type="range" min={0} max={345} step={15} value={deg} onChange={(e) => setDeg(Number(e.target.value))} style={{ accentColor: "var(--c-rl)" }} />
          </label>
          <label style={lab}>
            <span>wind speed <strong style={{ color: "var(--ink)" }}>{wspd.toFixed(1)}</strong> {wspd === 0 ? "(calm)" : ""}</span>
            <input type="range" min={0} max={1} step={0.1} value={wspd} onChange={(e) => setWspd(Number(e.target.value))} style={{ accentColor: "var(--c-rl)" }} />
          </label>
          <label style={{ display: "flex", gap: 6, alignItems: "center", margin: "4px 0 8px", fontSize: 12.5 }}>
            <input type="checkbox" checked={hill} onChange={(e) => setHill(e.target.checked)} style={{ accentColor: "var(--c-rl)" }} />
            a hill in the top right (darker is higher)
          </label>
          <Group label="Click or drag to add">
            <Choice on={tool === "fire"} onClick={() => setTool("fire")}>fire</Choice>
            <Choice on={tool === "water"} onClick={() => setTool("water")}>water drop, 5 × 5</Choice>
          </Group>
          <div style={{ marginTop: 8 }}>
            <Row k="burning now" v={burning} bad={burning > 0} />
            <Row k="burnt out" v={burnt} />
          </div>
          <label style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 8, fontSize: 12.5 }}>
            <input type="checkbox" checked={showChance} onChange={(e) => setShowChance(e.target.checked)} style={{ accentColor: "var(--c-rl)" }} />
            show each cell&rsquo;s chance of catching this tick (%)
          </label>
        </div>
      </div>

      <div style={{ fontSize: 12.5, color: "var(--ink)", marginTop: 10, minHeight: 40, fontFamily: "ui-monospace, monospace", lineHeight: 1.55 }}>
        {detail.map((line, j) => <div key={j} style={{ paddingLeft: j > 0 && j < detail.length - 1 ? 12 : 0, textIndent: j > 0 && j < detail.length - 1 ? -12 : 0 }}>{line}</div>)}
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 10 }}>
        <button style={{ ...btn, ...primary }} disabled={burning === 0} onClick={() => { setPlaying(false); advance(); }}>Step one tick</button>
        <button style={{ ...btn, ...primary, minWidth: 78 }} disabled={burning === 0 && !playing} onClick={() => setPlaying((p) => !p)}>
          {playing ? "⏸ Pause" : "▶ Play"}
        </button>
        <button style={btn} onClick={() => restart()}>↺ Same dice again</button>
        <button style={btn} onClick={() => { const s = seed + 1; setSeed(s); restart(s); }}>New dice</button>
      </div>
    </div>
  );
}

function Compass({ deg, factors }: { deg: number; factors: number[] }) {
  const C = 70, R = 50, rad = (deg * Math.PI) / 180;
  return (
    <svg viewBox="0 0 140 140" style={{ width: 150, height: 150, display: "block", margin: "0 auto 4px" }}
      role="img" aria-label={`Wind toward ${compassName(deg)}; chance multipliers by direction of travel: ${NAMES.map((n, k) => `${n} ${factors[k].toFixed(2)}`).join(", ")}`}>
      <defs>
        <marker id="ffl-arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--c-rl)" />
        </marker>
      </defs>
      <circle cx={C} cy={C} r={34} fill="none" stroke="var(--border)" />
      {factors.map((f, k) => {
        const a = (k * Math.PI) / 4;
        const hot = f > 1.05, cold = f < 0.95;
        return (
          <text key={k} x={C + R * Math.sin(a)} y={C - R * Math.cos(a) + 3.5} fontSize={10.5} textAnchor="middle" fontFamily="ui-monospace, monospace"
            fill={hot ? "var(--bad)" : cold ? "var(--c-regression)" : "var(--muted)"} fontWeight={hot ? 600 : 400}>
            ×{f.toFixed(2)}
          </text>
        );
      })}
      <line x1={C - 22 * Math.sin(rad)} y1={C + 22 * Math.cos(rad)} x2={C + 24 * Math.sin(rad)} y2={C - 24 * Math.cos(rad)}
        stroke="var(--c-rl)" strokeWidth={3} markerEnd="url(#ffl-arrow)" />
      <text x={C} y={137} fontSize={9} textAnchor="middle" fill="var(--faint)">fire travelling this way: chance ×</text>
    </svg>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 11, color: "var(--faint)", marginBottom: 4 }}>{label}</div>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>{children}</div>
    </div>
  );
}

function Choice({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} aria-pressed={on}
      style={{ ...btn, padding: "4px 9px", ...(on ? { borderColor: "var(--c-rl)", background: "color-mix(in srgb, var(--c-rl) 14%, transparent)", color: "var(--ink)" } : {}) }}>
      {children}
    </button>
  );
}

function Row({ k, v, bad = false }: { k: string; v: React.ReactNode; bad?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border)", padding: "3px 0" }}>
      <span>{k}</span>
      <span style={{ fontFamily: "ui-monospace, monospace", color: bad ? "var(--bad)" : "var(--ink)" }}>{v}</span>
    </div>
  );
}

const box: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "0.4rem 0 1.6rem" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)" };
const lab: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 2, marginBottom: 6, fontSize: 12.5 };
const btn: React.CSSProperties = { borderWidth: 1, borderStyle: "solid", borderColor: "var(--border)", borderRadius: 7, cursor: "pointer", padding: "5px 11px", fontSize: 12.5, color: "var(--muted)", background: "transparent", fontFamily: "var(--font-sans, sans-serif)" };
const primary: React.CSSProperties = { borderColor: "var(--c-rl)", background: "color-mix(in srgb, var(--c-rl) 15%, transparent)", color: "var(--ink)" };
