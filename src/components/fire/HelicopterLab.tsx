"use client";

import { useEffect, useRef, useState } from "react";
import {
  N, FOREST, ROCK, LAKE, VILLAGE, UNBURNT, BURNING, BURNT, DROP_R, FIRE_EVERY, MAX_STEPS,
  TERRAIN, villageCells, freshWorld, act, chief, mulberry32, type Kind, type World,
} from "./heliSim";

// Fly the helicopter yourself, or hand the controls to one of the two fire chiefs. The rules live in heliSim.ts and
// are the environment's; the dice are rolled on fire ticks only, so "same fire again" replays the same fire whatever
// you do.

const CELL = 26, PAD = 6, SIZE = N * CELL + PAD * 2;

type Pilot = "you" | "nearest" | "guard";

const KINDS: { k: Kind; label: string; color: string }[] = [
  { k: "lake", label: "flying to the lake, bucket empty", color: "color-mix(in srgb, var(--c-regression) 45%, var(--surface))" },
  { k: "fill", label: "filling", color: "var(--c-regression)" },
  { k: "fire", label: "flying with water", color: "color-mix(in srgb, var(--c-rl) 55%, var(--surface))" },
  { k: "hit", label: "drop on fire", color: "var(--bad)" },
  { k: "miss", label: "drop on nothing burning", color: "color-mix(in srgb, var(--bad) 35%, var(--surface))" },
  { k: "hover", label: "hovering", color: "color-mix(in srgb, var(--ink) 18%, var(--surface))" },
  { k: "wasted", label: "button, nothing happened", color: "color-mix(in srgb, var(--ink) 45%, var(--surface))" },
];

export const FILL = [
  "color-mix(in srgb, var(--good) 20%, var(--surface))",
  "color-mix(in srgb, var(--good) 48%, var(--surface))",
  "color-mix(in srgb, var(--ink) 20%, var(--surface))",
  "color-mix(in srgb, var(--c-regression) 55%, var(--surface))",
  "color-mix(in srgb, var(--c-rl) 30%, var(--surface))",
];

export function HelicopterLab() {
  const [world, setWorld] = useState<World>(freshWorld);
  const [pilot, setPilot] = useState<Pilot>("you");
  const [playing, setPlaying] = useState(false);
  const [seed, setSeed] = useState(1);
  const rng = useRef(mulberry32(1));
  const worldRef = useRef(world); worldRef.current = world;
  const pilotRef = useRef(pilot); pilotRef.current = pilot;
  const boxRef = useRef<HTMLDivElement>(null);

  const doAct = (a: number) => {
    const w = worldRef.current;
    if (w.done) return;
    const next = act(w, a, rng.current);
    worldRef.current = next;
    setWorld(next);
  };

  const restart = (newSeed = seed) => {
    setPlaying(false);
    rng.current = mulberry32(newSeed);
    const w = freshWorld();
    worldRef.current = w;
    setWorld(w);
  };

  useEffect(() => {
    if (!playing || pilot === "you") return;
    const id = window.setInterval(() => {
      const w = worldRef.current;
      if (w.done) { setPlaying(false); return; }
      doAct(chief(w, pilotRef.current as "nearest" | "guard"));
    }, 160);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, pilot]);

  const onKey = (e: React.KeyboardEvent) => {
    if (pilot !== "you") return;
    const map: Record<string, number> = { ArrowUp: 1, ArrowRight: 2, ArrowDown: 3, ArrowLeft: 4, " ": 5, h: 0 };
    if (e.key in map) { e.preventDefault(); doAct(map[e.key]); }
  };

  const burning = world.S.filter((s) => s === BURNING).length;
  const burnt = world.ever.filter(Boolean).length;
  const villageHit = villageCells.filter((i) => world.ever[i]).length;
  const [hr, hc] = world.pos;
  const counts = KINDS.map(({ k }) => world.log.filter((x) => x === k).length);
  const onLake = TERRAIN[hr * N + hc] === LAKE;
  const button = onLake ? "Fill the bucket" : world.water > 0 ? "Drop the water" : "Drop (bucket empty)";
  const drop = world.lastDrop && world.lastDrop.t === world.t ? world.lastDrop : null;

  return (
    <div ref={boxRef} style={box} tabIndex={0} onKeyDown={onKey} aria-label="Helicopter lab: arrow keys fly, space presses the button">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
        <span style={head}>One helicopter, one bucket, one lake</span>
        <span style={{ fontSize: 11.5, color: "var(--faint)", fontFamily: "ui-monospace, monospace" }}>
          step {world.t} · fire tick {Math.floor(world.t / FIRE_EVERY)}{world.done ? ` · ${world.done}` : ""}
        </span>
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ width: "100%", maxWidth: 430, height: "auto", display: "block", borderRadius: 10, border: "1px solid var(--border)", flex: "1 1 300px" }}
          role="img" aria-label={`Step ${world.t}: helicopter at row ${hr}, column ${hc}, bucket ${world.water ? "full" : "empty"}; ${burning} cells burning; ${villageHit} of 9 village cells hit`}>
          <rect x={0} y={0} width={SIZE} height={SIZE} fill="var(--surface)" />
          <MapCells world={world} cell={CELL} pad={PAD} />
          {drop && (
            <rect x={PAD + Math.max(drop.c - DROP_R, 0) * CELL} y={PAD + Math.max(drop.r - DROP_R, 0) * CELL}
              width={(Math.min(drop.c + DROP_R, N - 1) - Math.max(drop.c - DROP_R, 0) + 1) * CELL}
              height={(Math.min(drop.r + DROP_R, N - 1) - Math.max(drop.r - DROP_R, 0) + 1) * CELL}
              fill="color-mix(in srgb, var(--c-regression) 30%, transparent)" stroke="var(--c-regression)" strokeWidth={2} />
          )}
          <HeliGlyph world={world} cell={CELL} pad={PAD} />
        </svg>

        <div style={{ flex: "1 1 210px", minWidth: 200, fontSize: 13, color: "var(--muted)" }}>
          <Group label="Who flies">
            {(["you", "nearest", "guard"] as Pilot[]).map((p) => (
              <Choice key={p} on={pilot === p} onClick={() => { setPlaying(false); setPilot(p); }}>
                {p === "you" ? "you" : p === "nearest" ? "nearest-fire chief" : "guard-the-village chief"}
              </Choice>
            ))}
          </Group>

          {pilot === "you" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 44px)", gap: 4, margin: "6px 0 8px" }}>
              <span />
              <Pad label="north" onClick={() => doAct(1)}>↑</Pad>
              <span />
              <Pad label="west" onClick={() => doAct(4)}>←</Pad>
              <Pad label="hover" onClick={() => doAct(0)}>·</Pad>
              <Pad label="east" onClick={() => doAct(2)}>→</Pad>
              <span />
              <Pad label="south" onClick={() => doAct(3)}>↓</Pad>
              <span />
            </div>
          ) : null}
          {pilot === "you" ? (
            <button style={{ ...btn, ...primary, width: "100%", marginBottom: 6 }} disabled={!!world.done} onClick={() => doAct(5)}>{button}</button>
          ) : (
            <button style={{ ...btn, ...primary, width: "100%", margin: "6px 0" }} disabled={!!world.done} onClick={() => setPlaying((p) => !p)}>
              {playing ? "⏸ Pause" : "▶ Let the chief fly"}
            </button>
          )}
          <div style={{ fontSize: 11.5, color: "var(--faint)", marginBottom: 8 }}>
            {pilot === "you" ? "Click the lab, then use the arrow keys and space. Each press is one step." : "The chief flies one step at a time."}
          </div>

          <Row k="bucket" v={world.water ? "full" : "empty"} />
          <Row k="village cells hit" v={`${villageHit} / 9`} bad={villageHit > 0} />
          <Row k="burning now" v={burning} bad={burning > 0} />
          <Row k="cells that have caught fire" v={burnt} />
          <Row k="drops · cells put out" v={`${world.drops} · ${world.putOut}`} />
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 11, color: "var(--faint)", marginBottom: 4 }}>where the steps went (one mark per step)</div>
        <svg viewBox="0 0 600 18" style={{ width: "100%", height: 18, display: "block", borderRadius: 4, background: "var(--surface-2, transparent)", border: "1px solid var(--border)" }}
          role="img" aria-label={KINDS.map(({ label }, j) => `${label} ${counts[j]}`).join(", ")}>
          {world.log.map((k, j) => (
            <rect key={j} x={(j * 600) / MAX_STEPS} y={0} width={600 / MAX_STEPS + 0.3} height={18} fill={KINDS.find((x) => x.k === k)!.color} />
          ))}
        </svg>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", marginTop: 6, fontSize: 12 }}>
          {KINDS.map(({ k, label, color }, j) => (
            <span key={k} style={{ display: "inline-flex", alignItems: "center", gap: 5, color: counts[j] ? "var(--ink)" : "var(--faint)" }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: color, display: "inline-block" }} />
              {label} <span style={{ fontFamily: "ui-monospace, monospace" }}>{world.t ? Math.round((100 * counts[j]) / world.t) : 0}%</span>
            </span>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 12 }}>
        <button style={btn} onClick={() => restart()}>↺ Same fire again</button>
        <button style={btn} onClick={() => { const s = seed + 1; setSeed(s); restart(s); }}>A different fire</button>
        {world.done && (
          <span style={{ fontSize: 12.5, color: "var(--ink)" }}>
            {world.done} after {world.t} steps · {villageHit}/9 village cells hit · {burnt} cells burnt · {world.putOut} put out
          </span>
        )}
      </div>
    </div>
  );
}

/** The map's cells: terrain, moisture tint, trees, rocks, houses, flames and burnt ground. */
export function MapCells({ world, cell, pad }: { world: World; cell: number; pad: number }) {
  const k = cell / 26;
  return (
    <>
      {TERRAIN.map((ty, i) => {
        const r = Math.floor(i / N), c = i % N, x = pad + c * cell, y = pad + r * cell, s = world.S[i];
        const wet = ty !== LAKE && s !== BURNING ? Math.max(0, (world.M[i] - 0.4) / 0.5) : 0;
        return (
          <g key={i}>
            <rect x={x} y={y} width={cell} height={cell} stroke="var(--surface)" strokeWidth={1}
              fill={s === BURNING ? "var(--bad)" : s === BURNT ? "color-mix(in srgb, var(--ink) 62%, var(--surface))" : FILL[ty]} />
            {wet > 0 && <rect x={x} y={y} width={cell} height={cell} fill="var(--c-regression)" opacity={0.1 + 0.4 * wet} />}
            {s === UNBURNT && ty === FOREST && <path d={`M${x + cell / 2},${y + 6 * k} l${6 * k},${11 * k} h${-12 * k} z`} fill="color-mix(in srgb, var(--good) 75%, var(--ink))" opacity={0.5} />}
            {ty === ROCK && <circle cx={x + cell / 2} cy={y + cell / 2} r={4 * k} fill="color-mix(in srgb, var(--ink) 45%, var(--surface))" />}
            {ty === VILLAGE && s !== BURNING && <path d={`M${x + 6 * k},${y + 20 * k} v${-7 * k} l${7 * k},${-6 * k} l${7 * k},${6 * k} v${7 * k} z`} fill="color-mix(in srgb, var(--c-rl) 80%, var(--ink))" opacity={0.8} />}
            {s === BURNING && (
              <path d={`M${x + cell / 2},${y + 4 * k} C${x + 20 * k},${y + 11 * k} ${x + 20 * k},${y + 21 * k} ${x + cell / 2},${y + 22 * k} C${x + 6 * k},${y + 21 * k} ${x + 6 * k},${y + 13 * k} ${x + 11 * k},${y + 9 * k} C${x + 12 * k},${y + 13 * k} ${x + 14 * k},${y + 13 * k} ${x + cell / 2},${y + 4 * k} Z`}
                fill="color-mix(in srgb, var(--c-rl) 85%, #fff)" opacity={0.85} />
            )}
            {ty === VILLAGE && <rect x={x + 1.5} y={y + 1.5} width={cell - 3} height={cell - 3} fill="none" stroke="var(--c-rl)" strokeWidth={world.ever[i] ? 2.5 : 1.2} />}
          </g>
        );
      })}
    </>
  );
}

/** The helicopter: a filled circle when the bucket is full, hollow when empty. */
export function HeliGlyph({ world, cell, pad }: { world: World; cell: number; pad: number }) {
  const [hr, hc] = world.pos, k = cell / 26;
  return (
    <g transform={`translate(${pad + hc * cell + cell / 2},${pad + hr * cell + cell / 2}) scale(${k})`}>
      <circle r={9} fill={world.water ? "var(--c-regression)" : "var(--surface)"} stroke="var(--ink)" strokeWidth={1.8} />
      <path d="M-12,-12 L12,12 M-12,12 L12,-12" stroke="var(--ink)" strokeWidth={1.6} strokeLinecap="round" />
    </g>
  );
}

function Pad({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return <button aria-label={label} onClick={onClick} style={{ ...btn, padding: "6px 0", fontSize: 15, color: "var(--ink)" }}>{children}</button>;
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

const box: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "0.4rem 0 1.6rem", outline: "none" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)" };
const btn: React.CSSProperties = { borderWidth: 1, borderStyle: "solid", borderColor: "var(--border)", borderRadius: 7, cursor: "pointer", padding: "5px 11px", fontSize: 12.5, color: "var(--muted)", background: "transparent", fontFamily: "var(--font-sans, sans-serif)" };
const primary: React.CSSProperties = { borderColor: "var(--c-rl)", background: "color-mix(in srgb, var(--c-rl) 15%, transparent)", color: "var(--ink)" };
