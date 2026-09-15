"use client";

import { useEffect, useRef, useState } from "react";
import { N, TERRAIN, LAKE, mulberry32, type World } from "./heliSim";
import { MapCells, HeliGlyph } from "./HelicopterLab";
import { runEpisodes, randomStep, startWorld, type Funnel, type Help } from "./randomPilot";

// Watch one uniform random pilot, then count what 200 of them manage. The useful chain is
// fill at the lake -> fly to a fire -> press the button while fire is underneath. The two switches remove
// one link each: a bucket that never empties needs no lake at all, and a helicopter parked on the water
// starts the chain half done.

const CELL = 17, PAD = 4, SIZE = N * CELL + PAD * 2;
const EPISODES = 200;
const lakeAt = (p: [number, number]) => TERRAIN[p[0] * N + p[1]] === LAKE;

export function RandomPilotLab() {
  const [help, setHelp] = useState<Help>({ freeWater: false, onLake: false });
  const [world, setWorld] = useState<World>(() => startWorld({ freeWater: false, onLake: false }));
  const [trail, setTrail] = useState<[number, number][]>([]);
  const [flying, setFlying] = useState(false);
  const [seed, setSeed] = useState(1);
  const [funnel, setFunnel] = useState<(Funnel & { help: Help }) | null>(null);
  const [busy, setBusy] = useState(false);
  const rng = useRef(mulberry32(1));
  const helpRef = useRef(help); helpRef.current = help;
  const w = useRef(world); w.current = world;

  const restart = (h: Help, s: number) => {
    setFlying(false);
    rng.current = mulberry32(s);
    const fresh = startWorld(h);
    w.current = fresh;
    setWorld(fresh);
    setTrail([fresh.pos]);
  };

  useEffect(() => {
    if (!flying) return;
    const id = setInterval(() => {
      if (w.current.done) { setFlying(false); return; }
      const { w: next } = randomStep(w.current, helpRef.current, rng.current);
      w.current = next;
      setWorld(next);
      setTrail((t) => [...t.slice(-59), next.pos]);
    }, 90);
    return () => clearInterval(id);
  }, [flying]);

  const toggle = (k: keyof Help) => {
    const h = { ...help, [k]: !help[k] };
    setHelp(h);
    setFunnel(null);
    restart(h, seed);
  };

  const again = () => { const s = seed + 1; setSeed(s); restart(help, s); setFlying(true); };

  const count = () => {
    setBusy(true);
    setTimeout(() => { setFunnel({ ...runEpisodes(EPISODES, 1, help), help }); setBusy(false); }, 20);
  };

  const onLakeNow = lakeAt(world.pos);

  return (
    <div style={box}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
        <span style={head}>A pilot that presses buttons at random</span>
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>the lab map · one of six buttons every step, with equal chance</span>
      </div>

      <div style={{ fontSize: 11, color: "var(--faint)", marginBottom: 4 }}>give it a hand</div>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
        <Choice on={help.freeWater} onClick={() => toggle("freeWater")}>a bucket that never empties</Choice>
        <Choice on={help.onLake} onClick={() => toggle("onLake")}>start it on the lake</Choice>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        <button style={{ ...btn, ...primary }} onClick={() => (world.done ? again() : setFlying((f) => !f))}>
          {world.done ? "▶ Another pilot" : flying ? "❚❚ Pause" : "▶ Fly one pilot"}
        </button>
        <button style={btn} onClick={count} disabled={busy}>{busy ? "Counting…" : `⏩ Count ${EPISODES} pilots`}</button>
      </div>

      <div style={{ display: "flex", gap: 18, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{ flex: "0 1 300px", minWidth: 240 }}>
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ width: "100%", height: "auto", display: "block", userSelect: "none" }}
            role="img" aria-label="The lab map with one random pilot and its trail">
            <MapCells world={world} cell={CELL} pad={PAD} />
            <polyline points={trail.map(([r, c]) => `${PAD + c * CELL + CELL / 2},${PAD + r * CELL + CELL / 2}`).join(" ")}
              fill="none" stroke="var(--ink)" strokeWidth={1.4} strokeOpacity={0.3} strokeLinejoin="round" />
            {world.lastDrop && (
              <rect x={PAD + (world.lastDrop.c - 2) * CELL} y={PAD + (world.lastDrop.r - 2) * CELL} width={5 * CELL} height={5 * CELL}
                fill="var(--c-regression)" fillOpacity={0.22} stroke="var(--c-regression)" strokeWidth={1.5} />
            )}
            <HeliGlyph world={world} cell={CELL} pad={PAD} />
          </svg>
          <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 6, lineHeight: 1.5 }}>
            step {world.t} · bucket {help.freeWater ? "never empties" : world.water ? "full" : "empty"} · {world.drops} drop{world.drops === 1 ? "" : "s"} ·{" "}
            {world.putOut} cell{world.putOut === 1 ? "" : "s"} put out{onLakeNow ? " · over the lake" : ""}
            {world.done ? ` · ${world.done}` : ""}
          </div>
        </div>

        <div style={{ flex: "1 1 250px", fontSize: 13, color: "var(--muted)", lineHeight: 1.55 }}>
          {funnel ? <FunnelView f={funnel} /> : (
            <div style={{ color: "var(--faint)" }}>
              Watch one pilot wander, then count {EPISODES} of them. The counter asks one question: how many ever manage
              the chain the job needs — fill at the lake, fly to a fire, press the button with fire underneath?
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FunnelView({ f }: { f: Funnel & { help: Help } }) {
  const med = (a: number[]) => (a.length ? [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)] : null);
  const rows: [string, number, boolean][] = [
    ["ever stood on the lake", f.onLake, false],
    ["filled the bucket there", f.refilled, false],
    ["put out fire with the bucket it started with", f.scoredFirst, false],
    ["put out fire after a refill — the whole chain", f.scoredAfter, true],
  ];
  const lake = med(f.lakeSteps);
  return (
    <>
      <div style={{ color: "var(--ink)", marginBottom: 8 }}>
        Of {f.episodes} random pilots{f.help.freeWater || f.help.onLake ? <span style={{ color: "var(--muted)" }}>
          {" "}({[f.help.freeWater && "free water", f.help.onLake && "starting on the lake"].filter(Boolean).join(", ")})</span> : null}
      </div>
      {rows.map(([label, n, key]) => (
        <div key={label} style={{ marginBottom: 7 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 12.5 }}>
            <span style={key ? { color: "var(--ink)" } : undefined}>{label}</span>
            <span style={{ fontFamily: "ui-monospace, monospace", color: key ? "var(--ink)" : "var(--muted)" }}>{n}/{f.episodes}</span>
          </div>
          <div style={{ height: 7, background: "var(--border)", borderRadius: 4, marginTop: 3, overflow: "hidden" }}>
            <div style={{ width: `${(100 * n) / f.episodes}%`, height: "100%", background: key ? "var(--c-rl)" : "color-mix(in srgb, var(--c-rl) 45%, var(--border))" }} />
          </div>
        </div>
      ))}
      <div style={{ marginTop: 10, fontSize: 12.5, borderTop: "1px solid var(--border)", paddingTop: 8 }}>
        {(f.putOut / f.episodes).toFixed(2)} cells put out per episode, from {(f.drops / f.episodes).toFixed(2)} drops in{" "}
        {(f.steps / f.episodes).toFixed(1)} steps.{" "}
        {f.help.freeWater
          ? "With water for nothing it drops constantly and hits fire often — finding fire was never the hard part."
          : f.help.onLake
            ? "Parked on the water, every pilot begins the chain half done — and that is the only reason any of them finish it."
            : lake === null
              ? "Not one of them ever reached the water. The lake is 18 steps away and the fire is out in about 60."
              : `Those that reached the lake first stood on it after ${lake} steps.`}
      </div>
    </>
  );
}

function Choice({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} aria-pressed={on} style={{ ...btn, padding: "4px 9px", ...(on ? chosen : {}) }}>{children}</button>;
}

const box: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "0.4rem 0 1.6rem" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)" };
const btn: React.CSSProperties = { borderWidth: 1, borderStyle: "solid", borderColor: "var(--border)", borderRadius: 7, cursor: "pointer", padding: "5px 11px", fontSize: 12.5, color: "var(--muted)", background: "transparent", fontFamily: "var(--font-sans, sans-serif)" };
const chosen: React.CSSProperties = { borderColor: "var(--c-rl)", background: "color-mix(in srgb, var(--c-rl) 14%, transparent)", color: "var(--ink)" };
const primary: React.CSSProperties = { borderColor: "var(--c-rl)", background: "color-mix(in srgb, var(--c-rl) 15%, transparent)", color: "var(--ink)" };
