"use client";

import { useMemo, useState } from "react";
import { N, TERRAIN, SPREAD, DIRS, WIND_GAIN, WDIR, WSPD, DIAGONAL, BURNING, UNBURNT, freshWorld, fireTick, mulberry32, type World } from "./heliSim";

// The fire rule as eight whole-grid passes. Pass k asks one question of every cell at once: "is the neighbour that
// would send fire in direction k burning?" — that is shift(burning, dr, dc) — and multiplies that direction's
// "not lit" factor into every cell that answers yes. After all eight passes the result is compared, cell by cell, with
// the rule computed the loop way. Map, wind and dice are the helicopter lab's (flat map, fixed wind).

const CELL = 14, PAD = 3, SIZE = N * CELL + PAD * 2;
const NAMES = ["north", "north-east", "east", "south-east", "south", "south-west", "west", "north-west"];
const WR = -Math.cos(WDIR), WC = Math.sin(WDIR);

function grown(ticks: number, seed: number): World {
  const w = freshWorld();
  const rng = mulberry32(seed);
  for (let t = 0; t < ticks; t++) fireTick(w, rng);
  return w;
}

const catchable = (w: World, i: number) => w.S[i] === UNBURNT && SPREAD[TERRAIN[i]] > 0;

/** p for direction k at every cell: the chance a burning neighbour sending fire in direction k lights the cell. */
function chanceGrid(w: World, k: number) {
  const [dr, dc] = DIRS[k], dist = Math.hypot(dr, dc);
  const wind = Math.exp(WIND_GAIN * WSPD * (dr * WR + dc * WC) / dist);
  return TERRAIN.map((ty, i) => SPREAD[ty] * (1 - w.M[i]) * wind * (dist > 1 ? DIAGONAL : 1));
}

/** shift(burning, dr, dc): at each cell, is its neighbour at (-dr, -dc) burning? */
function arrivals(w: World, k: number) {
  const [dr, dc] = DIRS[k];
  return TERRAIN.map((_, i) => {
    const r = Math.floor(i / N) - dr, c = (i % N) - dc;
    return r >= 0 && r < N && c >= 0 && c < N && w.S[r * N + c] === BURNING;
  });
}

/** The loop way: each catchable cell asks its eight neighbours in turn. */
function loopNotLit(w: World) {
  return TERRAIN.map((ty, i) => {
    if (!catchable(w, i)) return 1;
    const r0 = Math.floor(i / N), c0 = i % N;
    let notLit = 1;
    DIRS.forEach(([dr, dc]) => {
      const r = r0 - dr, c = c0 - dc;
      if (r < 0 || r >= N || c < 0 || c >= N || w.S[r * N + c] !== BURNING) return;
      const dist = Math.hypot(dr, dc);
      const p = SPREAD[ty] * (1 - w.M[i]) * Math.exp(WIND_GAIN * WSPD * (dr * WR + dc * WC) / dist) * (dist > 1 ? DIAGONAL : 1);
      notLit *= 1 - Math.min(p, 1);
    });
    return notLit;
  });
}

export function ShiftLab() {
  const [ticks, setTicks] = useState(6);
  const [done, setDone] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const world = useMemo(() => grown(ticks, 3), [ticks]);

  const passes = useMemo(() => DIRS.map((_, k) => ({ arr: arrivals(world, k), p: chanceGrid(world, k) })), [world]);
  const notLit = useMemo(() => {
    const acc = new Array(N * N).fill(1);
    for (let k = 0; k < done; k++)
      for (let i = 0; i < N * N; i++) if (passes[k].arr[i]) acc[i] *= 1 - Math.min(passes[k].p[i], 1);
    return acc;
  }, [passes, done]);
  const loop = useMemo(() => loopNotLit(world), [world]);

  const view = Math.max(done - 1, 0);
  const [vdr, vdc] = DIRS[view];
  const chance = (i: number) => (catchable(world, i) ? 1 - notLit[i] : 0);
  const arrivedCount = passes[view].arr.filter((a, i) => a && catchable(world, i)).length;
  const burningCount = world.S.filter((s) => s === BURNING).length;
  const catchableCells = TERRAIN.reduce((n, _, i) => n + (catchable(world, i) ? 1 : 0), 0);
  let maxDiff = 0;
  if (done === 8) for (let i = 0; i < N * N; i++) if (catchable(world, i)) maxDiff = Math.max(maxDiff, Math.abs(notLit[i] - loop[i]));

  const base = (i: number) => (TERRAIN[i] === 3 ? "color-mix(in srgb, var(--c-regression) 45%, var(--surface))" : SPREAD[TERRAIN[i]] === 0 ? "color-mix(in srgb, var(--ink) 16%, var(--surface))" : "color-mix(in srgb, var(--good) 14%, var(--surface))");
  const burntFill = "color-mix(in srgb, var(--ink) 55%, var(--surface))";

  const Map = ({ label, sub, fill, onHover }: { label: string; sub: string; fill: (i: number) => string; onHover?: boolean }) => (
    <div style={{ flex: "1 1 190px", minWidth: 170 }}>
      <div style={{ fontSize: 12.5, color: "var(--ink)", fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 11, color: "var(--faint)", minHeight: 30, marginBottom: 4, lineHeight: 1.35 }}>{sub}</div>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ width: "100%", height: "auto", display: "block", borderRadius: 6, border: "1px solid var(--border)", userSelect: "none" }}
        onMouseLeave={() => onHover && setHover(null)} role="img" aria-label={label}>
        <rect width={SIZE} height={SIZE} fill="var(--surface)" />
        {TERRAIN.map((_, i) => (
          <rect key={i} x={PAD + (i % N) * CELL} y={PAD + Math.floor(i / N) * CELL} width={CELL} height={CELL} fill={fill(i)}
            stroke={onHover && hover === i ? "var(--ink)" : "var(--surface)"} strokeWidth={onHover && hover === i ? 1.5 : 0.8}
            onMouseEnter={onHover ? () => setHover(i) : undefined} onPointerOver={onHover ? () => setHover(i) : undefined} />
        ))}
      </svg>
    </div>
  );

  const hoverText = (() => {
    if (hover === null) return "Hover a cell on the right-hand map.";
    const r = Math.floor(hover / N), c = hover % N;
    if (!catchable(world, hover)) return `row ${r}, column ${c}: cannot catch (${world.S[hover] === BURNING ? "already burning" : SPREAD[TERRAIN[hover]] === 0 ? "rock or lake" : "burnt"})`;
    const got = DIRS.map((_, k) => k).filter((k) => k < done && passes[k].arr[hover]);
    return `row ${r}, column ${c}: chance ${(1 - notLit[hover]).toFixed(3)} after ${done} pass${done === 1 ? "" : "es"}` +
      (got.length ? ` · fire arrived travelling ${got.map((k) => NAMES[k]).join(", ")}` : " · no burning neighbour in the passes so far");
  })();

  return (
    <div style={box}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
        <span style={head}>Eight passes instead of 256 questions</span>
        <span style={{ fontSize: 11.5, color: "var(--faint)", fontFamily: "ui-monospace, monospace" }}>fire tick {ticks} · {burningCount} burning</span>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
        <button style={{ ...btn, ...primary }} disabled={done === 8} onClick={() => setDone((d) => Math.min(d + 1, 8))}>
          {done === 0 ? "▶ First pass" : done === 8 ? "All 8 passes done" : `▶ Pass ${done + 1}: fire travelling ${NAMES[done]}`}
        </button>
        <button style={btn} disabled={done === 8} onClick={() => setDone(8)}>All 8 at once</button>
        <button style={btn} onClick={() => setDone(0)}>Clear the passes</button>
        <button style={btn} onClick={() => { setTicks((t) => t + 1); setDone(0); }}>Grow the fire one tick</button>
        <button style={btn} onClick={() => { setTicks(6); setDone(0); }}>Start again</button>
      </div>

      <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginBottom: 12 }}>
        {NAMES.map((n, k) => (
          <span key={n} style={{ fontSize: 11, padding: "2px 7px", borderRadius: 999, border: "1px solid var(--border)",
            background: k < done ? "color-mix(in srgb, var(--c-rl) 18%, transparent)" : "transparent", color: k < done ? "var(--ink)" : "var(--faint)" }}>
            {n}
          </span>
        ))}
      </div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <Map label="burning" sub="the grid every pass reads" fill={(i) => (world.S[i] === BURNING ? "var(--bad)" : world.S[i] === 2 ? burntFill : base(i))} />
        <Map label={done ? `shift(burning, ${vdr}, ${vdc})` : "shift(burning, dr, dc)"}
          sub={done ? `fire travelling ${NAMES[view]}: the burning grid moved one cell ${NAMES[view]} — ${arrivedCount} cells that can catch receive it` : "press First pass"}
          fill={(i) => (done && passes[view].arr[i] ? (catchable(world, i) ? "var(--c-rl)" : "color-mix(in srgb, var(--c-rl) 35%, var(--surface))") : world.S[i] === BURNING ? "color-mix(in srgb, var(--bad) 30%, var(--surface))" : base(i))} />
        <Map label={`chance of catching after ${done} of 8`} sub="every pass multiplies its factor into the cells it reached" onHover
          fill={(i) => { const ch = chance(i); return ch > 0 ? `color-mix(in srgb, var(--bad) ${Math.round(15 + 85 * Math.min(ch / 0.6, 1))}%, var(--surface))` : world.S[i] === BURNING ? "color-mix(in srgb, var(--ink) 30%, var(--surface))" : base(i); }} />
      </div>

      <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 10, lineHeight: 1.5 }}>
        <div style={{ fontFamily: "ui-monospace, monospace", color: "var(--ink)", minHeight: 18 }}>{hoverText}</div>
        <div style={{ marginTop: 6 }}>
          The loop asks each of the {catchableCells} cells that can catch about each of its 8 neighbours, one question at a time.
          The passes ask {done} of 8 questions, each of the whole grid.
          {done === 8 && (
            <strong style={{ color: maxDiff === 0 ? "var(--good)" : "var(--bad)" }}>
              {" "}{maxDiff === 0 ? "Compared with the loop: identical at every cell." : `Compared with the loop: largest difference ${maxDiff.toExponential(2)}.`}
            </strong>
          )}
        </div>
      </div>
    </div>
  );
}

const box: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "0.4rem 0 1.6rem" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)" };
const btn: React.CSSProperties = { borderWidth: 1, borderStyle: "solid", borderColor: "var(--border)", borderRadius: 7, cursor: "pointer", padding: "5px 11px", fontSize: 12.5, color: "var(--muted)", background: "transparent", fontFamily: "var(--font-sans, sans-serif)" };
const primary: React.CSSProperties = { borderColor: "var(--c-rl)", background: "color-mix(in srgb, var(--c-rl) 15%, transparent)", color: "var(--ink)" };
