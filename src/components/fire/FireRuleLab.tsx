"use client";

import { useEffect, useRef, useState } from "react";

// The fire's spread rule on its own: no wind, no moisture, flat ground. The constants are the environment's
// (SPREAD x 0.8, BURN_TIME, diagonals x 0.7) and the rule is the page's catch_chance / my_fire_tick, so the
// chance printed on each cell is exactly what the Python rule computes. The dice come from a seeded generator
// in the page, not numpy, so individual fires differ from the Python cells; the patterns do not.

const N = 16;
const CELL = 28;
const PAD = 6;
const SIZE = N * CELL + PAD * 2;
const GRASS = 0, FOREST = 1, ROCK = 2;
const UNBURNT = 0, BURNING = 1, BURNT = 2;
const SPREAD = [0.3 * 0.8, 0.16 * 0.8, 0];
const BURN_TIME = [2, 5, 0];
const DIRS: [number, number][] = [[-1, 0], [-1, 1], [0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1]];
const START = 8 * N + 5;
const NAMES = ["grass", "forest", "rock"];

type Hood = "8-0.7" | "8-1" | "4";
type Update = "sync" | "inplace";
type Tool = "fire" | "grass" | "forest" | "rock";
type Sim = { S: number[]; timer: number[]; tick: number };

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

function startTerrain() {
  const T = new Array(N * N).fill(GRASS);
  for (let r = 1; r < 15; r++) for (let c = 10; c < 15; c++) T[r * N + c] = FOREST;
  for (const [r, c] of [[3, 7], [4, 7], [5, 7], [11, 2], [12, 2], [12, 12]]) T[r * N + c] = ROCK;
  return T;
}

function freshFire(T: number[]): Sim {
  const S = new Array(N * N).fill(UNBURNT), timer = new Array(N * N).fill(0);
  S[START] = BURNING; timer[START] = BURN_TIME[T[START]];
  return { S, timer, tick: 0 };
}

const weight = (dr: number, dc: number, hood: Hood) => (dr && dc ? (hood === "4" ? 0 : hood === "8-1" ? 1 : 0.7) : 1);

function chance(T: number[], S: number[], i: number, hood: Hood) {
  const r = Math.floor(i / N), c = i % N;
  if (S[i] !== UNBURNT || SPREAD[T[i]] === 0) return { p: 0, side: 0, corner: 0, w: weight(1, 1, hood) };
  let notLit = 1, side = 0, corner = 0;
  for (const [dr, dc] of DIRS) {
    const nr = r - dr, nc = c - dc;
    if (nr < 0 || nr >= N || nc < 0 || nc >= N || S[nr * N + nc] !== BURNING) continue;
    const w = weight(dr, dc, hood);
    if (w === 0) continue;
    if (dr && dc) corner++; else side++;
    notLit *= 1 - SPREAD[T[i]] * w;
  }
  return { p: 1 - notLit, side, corner, w: weight(1, 1, hood) };
}

function step(T: number[], sim: Sim, rng: () => number, hood: Hood, update: Update): Sim {
  const dice = Array.from({ length: N * N }, rng);        // one roll for every cell, every tick
  const S = sim.S.slice(), timer = sim.timer.slice();
  const read = update === "inplace" ? S : sim.S;          // in place: read the map being written
  for (let i = 0; i < N * N; i++) {
    if (read[i] === BURNING) {
      timer[i] -= 1;
      if (timer[i] <= 0) S[i] = BURNT;
    } else if (dice[i] < chance(T, read, i, hood).p) {
      S[i] = BURNING; timer[i] = BURN_TIME[T[i]];
    }
  }
  return { S, timer, tick: sim.tick + 1 };
}

const FILL = [
  "color-mix(in srgb, var(--good) 20%, var(--surface))",
  "color-mix(in srgb, var(--good) 48%, var(--surface))",
  "color-mix(in srgb, var(--ink) 20%, var(--surface))",
];

export function FireRuleLab() {
  const [T, setT] = useState<number[]>(startTerrain);
  const [sim, setSim] = useState<Sim>(() => freshFire(startTerrain()));
  const [hood, setHood] = useState<Hood>("8-0.7");
  const [update, setUpdate] = useState<Update>("sync");
  const [tool, setTool] = useState<Tool>("fire");
  const [seed, setSeed] = useState(1);
  const [showChance, setShowChance] = useState(true);
  const [hover, setHover] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const rng = useRef(mulberry32(1));
  const simRef = useRef(sim); simRef.current = sim;
  const tRef = useRef(T); tRef.current = T;
  const painting = useRef(false);

  const burning = sim.S.filter((s) => s === BURNING).length;
  const burnt = sim.S.filter((s) => s === BURNT).length;
  const startRow = Math.floor(START / N);
  let north = 0, south = 0;
  sim.S.forEach((s, i) => { if (s !== UNBURNT) { const r = Math.floor(i / N); if (r < startRow) north++; if (r > startRow) south++; } });

  const restart = (newSeed = seed, terrain = T) => {
    setPlaying(false);
    rng.current = mulberry32(newSeed);
    setSim(freshFire(terrain));
  };

  const advance = () => {
    const next = step(tRef.current, simRef.current, rng.current, hood, update);
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
  }, [playing, hood, update]);

  const paint = (i: number) => {
    if (tool === "fire") {
      if (sim.S[i] !== UNBURNT || SPREAD[T[i]] === 0) return;
      const S = sim.S.slice(), timer = sim.timer.slice();
      S[i] = BURNING; timer[i] = BURN_TIME[T[i]];
      setSim({ ...sim, S, timer });
    } else {
      const ty = tool === "grass" ? GRASS : tool === "forest" ? FOREST : ROCK;
      if (T[i] === ty) return;
      const nT = T.slice(); nT[i] = ty; setT(nT);
      if (ty === ROCK && sim.S[i] !== UNBURNT) {
        const S = sim.S.slice(), timer = sim.timer.slice();
        S[i] = UNBURNT; timer[i] = 0; setSim({ ...sim, S, timer });
      }
    }
  };

  const detail = (() => {
    if (hover === null) return "Hover a cell to see where its chance comes from.";
    const ty = NAMES[T[hover]];
    if (sim.S[hover] === BURNING) return `${ty}, burning · ${sim.timer[hover]} tick${sim.timer[hover] === 1 ? "" : "s"} of fuel left`;
    if (sim.S[hover] === BURNT) return `${ty}, burnt out · it can never burn again`;
    if (T[hover] === ROCK) return "rock · it never burns, so fire can only go round it";
    const { p, side, corner, w } = chance(T, sim.S, hover, hood);
    if (side + corner === 0) return `${ty} · no burning neighbour${hood === "4" ? " on its four sides" : ""} · chance this tick 0`;
    const base = SPREAD[T[hover]];
    const parts = [];
    if (side) parts.push(`(1 − ${base.toFixed(3)})${side > 1 ? sup(side) : ""}`);
    if (corner) parts.push(`(1 − ${(base * w).toFixed(3)})${corner > 1 ? sup(corner) : ""}`);
    return `${ty} · burning neighbours: ${side} side, ${corner} corner · chance this tick 1 − ${parts.join(" × ")} = ${p.toFixed(3)}`;
  })();

  return (
    <div style={box}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
        <span style={head}>The spread rule, one tick at a time</span>
        <span style={{ fontSize: 11.5, color: "var(--faint)", fontFamily: "ui-monospace, monospace" }}>dry · calm · flat · tick {sim.tick}</span>
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ width: "100%", maxWidth: 460, height: "auto", display: "block", borderRadius: 10, border: "1px solid var(--border)", flex: "1 1 300px", touchAction: "none", cursor: "crosshair" }}
          role="img" aria-label={`Fire spread grid at tick ${sim.tick}: ${burning} cells burning, ${burnt} burnt out`}
          onPointerUp={() => { painting.current = false; }} onPointerLeave={() => { painting.current = false; setHover(null); }}>
          <rect x={0} y={0} width={SIZE} height={SIZE} fill="var(--surface)" />
          {T.map((ty, i) => {
            const r = Math.floor(i / N), c = i % N;
            const x = PAD + c * CELL, y = PAD + r * CELL;
            const s = sim.S[i];
            const pc = showChance && s === UNBURNT ? chance(T, sim.S, i, hood).p : 0;
            return (
              <g key={i}
                onPointerDown={() => { painting.current = true; paint(i); }}
                onPointerEnter={() => { setHover(i); if (painting.current) paint(i); }}>
                <rect x={x} y={y} width={CELL} height={CELL} stroke="var(--surface)" strokeWidth={1}
                  fill={s === BURNING ? "var(--bad)" : s === BURNT ? "color-mix(in srgb, var(--ink) 62%, var(--surface))" : FILL[ty]} />
                {s === UNBURNT && ty === FOREST && <path d={`M${x + CELL / 2},${y + 6} l6,11 h-12 z`} fill="color-mix(in srgb, var(--good) 75%, var(--ink))" opacity={pc > 0 ? 0.2 : 0.5} />}
                {s === UNBURNT && ty === ROCK && <circle cx={x + CELL / 2} cy={y + CELL / 2} r={4} fill="color-mix(in srgb, var(--ink) 45%, var(--surface))" />}
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

        <div style={{ flex: "1 1 200px", minWidth: 190, fontSize: 13, color: "var(--muted)" }}>
          <Group label="Neighbours">
            <Choice on={hood === "8-0.7"} onClick={() => { setHood("8-0.7"); restart(); }}>8, corners × 0.7 (shipped)</Choice>
            <Choice on={hood === "8-1"} onClick={() => { setHood("8-1"); restart(); }}>8, corners × 1</Choice>
            <Choice on={hood === "4"} onClick={() => { setHood("4"); restart(); }}>4 sides only</Choice>
          </Group>
          <Group label="Update">
            <Choice on={update === "sync"} onClick={() => { setUpdate("sync"); restart(); }}>all at once (shipped)</Choice>
            <Choice on={update === "inplace"} onClick={() => { setUpdate("inplace"); restart(); }}>in place, row by row</Choice>
          </Group>
          <Group label="Click or drag to add">
            {(["fire", "grass", "forest", "rock"] as Tool[]).map((tl) => (
              <Choice key={tl} on={tool === tl} onClick={() => setTool(tl)}>{tl}</Choice>
            ))}
          </Group>
          <div style={{ marginTop: 10 }}>
            <Row k="burning now" v={burning} bad={burning > 0} />
            <Row k="burnt out" v={burnt} />
            <Row k="reached north of the first fire" v={north} />
            <Row k="reached south of it" v={south} />
          </div>
          <label style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 8, fontSize: 12.5 }}>
            <input type="checkbox" checked={showChance} onChange={(e) => setShowChance(e.target.checked)} style={{ accentColor: "var(--c-rl)" }} />
            show each cell&rsquo;s chance of catching this tick (%)
          </label>
        </div>
      </div>

      <div style={{ fontSize: 12.5, color: "var(--ink)", marginTop: 10, minHeight: 20, fontFamily: "ui-monospace, monospace", lineHeight: 1.5 }}>{detail}</div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 10 }}>
        <button style={{ ...btn, ...primary }} disabled={burning === 0} onClick={() => { setPlaying(false); advance(); }}>Step one tick</button>
        <button style={{ ...btn, ...primary, minWidth: 78 }} disabled={burning === 0 && !playing} onClick={() => setPlaying((p) => !p)}>
          {playing ? "⏸ Pause" : "▶ Play"}
        </button>
        <button style={btn} onClick={() => restart()}>↺ Same dice again</button>
        <button style={btn} onClick={() => { const s = seed + 1; setSeed(s); restart(s); }}>New dice</button>
        <button style={btn} onClick={() => { const t0 = startTerrain(); setT(t0); restart(seed, t0); }}>Reset the map</button>
      </div>
    </div>
  );
}

const sup = (n: number) => String(n).split("").map((d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[Number(d)]).join("");

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
const btn: React.CSSProperties = { borderWidth: 1, borderStyle: "solid", borderColor: "var(--border)", borderRadius: 7, cursor: "pointer", padding: "5px 11px", fontSize: 12.5, color: "var(--muted)", background: "transparent", fontFamily: "var(--font-sans, sans-serif)" };
const primary: React.CSSProperties = { borderColor: "var(--c-rl)", background: "color-mix(in srgb, var(--c-rl) 15%, transparent)", color: "var(--ink)" };
