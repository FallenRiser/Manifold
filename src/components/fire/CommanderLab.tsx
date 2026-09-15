"use client";

import { useEffect, useRef, useState } from "react";
import { N, freshWorld, mulberry32, type World } from "./heliSim";
import { MapCells, HeliGlyph } from "./HelicopterLab";
import { beginDecision, stepDecision, pickTarget, runEpisodes, NO_CLOCK, type Decision, type Funnel, type Mode } from "./commander";

// One decision is a target cell; a scripted pilot flies the sortie. The clock K says how many steps the
// commander must live with its choice. Good rules want a short clock so they can react; a crew choosing at
// random wants a long one, because only a long one ever finishes the fill -> fly -> drop chain.

const CELL = 17, PAD = 4, SIZE = N * CELL + PAD * 2;
const EPISODES = 200;
const MODES: [Mode, string][] = [["you", "you"], ["nearest", "the nearest fire"], ["guard", "the fire nearest the village"], ["random", "any cell at all"]];
const CLOCK_LABEL = (K: number) => (K === NO_CLOCK ? "no clock" : String(K));

export function CommanderLab() {
  const [mode, setMode] = useState<Mode>("guard");
  const [K, setK] = useState<number>(4);
  const [world, setWorld] = useState<World>(() => freshWorld());
  const [dec, setDec] = useState<Decision | null>(null);
  const [count, setCount] = useState(0);
  const [trail, setTrail] = useState<[number, number][]>([freshWorld().pos]);
  const [flying, setFlying] = useState(false);
  const [seed, setSeed] = useState(1);
  const [funnel, setFunnel] = useState<(Funnel & { mode: Mode; K: number }) | null>(null);
  const [busy, setBusy] = useState(false);
  const rng = useRef(mulberry32(1));
  const pickRng = useRef(mulberry32(90001));
  const st = useRef({ world, dec, mode, K, count });
  st.current = { world, dec, mode, K, count };

  const restart = (s: number) => {
    setFlying(false);
    rng.current = mulberry32(s);
    pickRng.current = mulberry32(90000 + s);
    const fresh = freshWorld();
    setWorld(fresh); setDec(null); setCount(0); setTrail([fresh.pos]);
  };

  useEffect(() => {
    if (!flying) return;
    const id = setInterval(() => {
      const s = st.current;
      if (s.world.done) { setFlying(false); return; }
      let d = s.dec;
      if (!d) {
        if (s.mode === "you") { setFlying(false); return; }     // wait for the reader to click a target
        d = beginDecision(s.world, pickTarget(s.world, s.mode, pickRng.current));
        setCount((n) => n + 1);
      }
      const r = stepDecision(s.world, d, s.K, rng.current);
      setWorld(r.w); setDec(r.done ? null : r.d);
      setTrail((t) => [...t.slice(-79), r.w.pos]);
    }, 90);
    return () => clearInterval(id);
  }, [flying]);

  const dispatchTo = (i: number) => {
    if (world.done || mode !== "you" || dec) return;   // the clock is the point: no re-aiming mid-decision
    setDec(beginDecision(world, i));
    setCount((n) => n + 1);
    setFlying(true);
  };

  const choose = (m: Mode, k: number) => {
    setMode(m); setK(k); setFunnel(null); restart(seed);
  };

  const tally = () => {
    if (mode === "you") return;
    setBusy(true);
    setTimeout(() => { setFunnel({ ...runEpisodes(EPISODES, 1, mode, K), mode, K }); setBusy(false); }, 20);
  };

  const waiting = mode === "you" && !dec && !world.done;

  return (
    <div style={box}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
        <span style={head}>One decision is a target cell</span>
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>the lab map · the pilot between decisions is a script</span>
      </div>

      <div style={{ fontSize: 11, color: "var(--faint)", marginBottom: 4 }}>who picks the target</div>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 9 }}>
        {MODES.map(([m, label]) => <Choice key={m} on={mode === m} onClick={() => choose(m, K)}>{label}</Choice>)}
      </div>
      <div style={{ fontSize: 11, color: "var(--faint)", marginBottom: 4 }}>the decision clock — steps before it may choose again</div>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 12 }}>
        {[1, 2, 4, 8, NO_CLOCK].map((k) => <Choice key={k} on={K === k} onClick={() => choose(mode, k)}>{CLOCK_LABEL(k)}</Choice>)}
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        <button style={{ ...btn, ...primary }} disabled={waiting}
          onClick={() => (world.done ? (setSeed(seed + 1), restart(seed + 1), setFlying(mode !== "you")) : setFlying((f) => !f))}>
          {world.done ? "▶ Another fire" : waiting ? "click a cell to dispatch" : flying ? "❚❚ Pause" : "▶ Fly"}
        </button>
        <button style={btn} onClick={tally} disabled={busy || mode === "you"}>
          {busy ? "Counting…" : `⏩ Count ${EPISODES} fires`}
        </button>
      </div>

      <div style={{ display: "flex", gap: 18, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{ flex: "0 1 300px", minWidth: 240 }}>
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ width: "100%", height: "auto", display: "block", userSelect: "none", cursor: mode === "you" && !world.done ? "crosshair" : "default" }}
            role="img" aria-label="The lab map, with the helicopter flying to its target cell">
            <MapCells world={world} cell={CELL} pad={PAD} />
            <polyline points={trail.map(([r, c]) => `${PAD + c * CELL + CELL / 2},${PAD + r * CELL + CELL / 2}`).join(" ")}
              fill="none" stroke="var(--ink)" strokeWidth={1.4} strokeOpacity={0.3} strokeLinejoin="round" />
            {world.lastDrop && (
              <rect x={PAD + (world.lastDrop.c - 2) * CELL} y={PAD + (world.lastDrop.r - 2) * CELL} width={5 * CELL} height={5 * CELL}
                fill="var(--c-regression)" fillOpacity={0.22} stroke="var(--c-regression)" strokeWidth={1.5} />
            )}
            {dec && <Crosshair i={dec.target} />}
            <HeliGlyph world={world} cell={CELL} pad={PAD} />
            {waiting && Array.from({ length: N * N }, (_, i) => (
              <rect key={i} x={PAD + (i % N) * CELL} y={PAD + Math.floor(i / N) * CELL} width={CELL} height={CELL}
                fill="transparent" onClick={() => dispatchTo(i)} style={{ cursor: "crosshair" }} />
            ))}
          </svg>
          <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 6, lineHeight: 1.5 }}>
            step {world.t} · decision {count}
            {dec ? ` · step ${dec.steps} of ${CLOCK_LABEL(K)}${dec.toLake ? ", refilling first" : ""}` : ""} ·{" "}
            {world.drops} drop{world.drops === 1 ? "" : "s"} · {world.putOut} cell{world.putOut === 1 ? "" : "s"} put out
            {world.done ? ` · ${world.done}` : ""}
          </div>
        </div>

        <div style={{ flex: "1 1 250px", fontSize: 13, color: "var(--muted)", lineHeight: 1.55 }}>
          {funnel ? <FunnelView f={funnel} /> : (
            <div style={{ color: "var(--faint)" }}>
              {mode === "you"
                ? <>Click any cell and the pilot flies there — filling at the lake first if the bucket is empty, dropping
                  on arrival. With the clock set to {CLOCK_LABEL(K)} you get the map back after {K === NO_CLOCK ? "the drop" : `${K} step${K === 1 ? "" : "s"}`}.</>
                : <>Watch the rule fly, then count {EPISODES} fires. The counter asks the question the last page asked of a
                  random pilot: how many crews ever manage the whole chain — fill at the lake, fly to a fire, land water on it?</>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Crosshair({ i }: { i: number }) {
  const x = PAD + (i % N) * CELL + CELL / 2, y = PAD + Math.floor(i / N) * CELL + CELL / 2;
  return (
    <g stroke="var(--c-rl)" strokeWidth={1.8} fill="none" opacity={0.95}>
      <circle cx={x} cy={y} r={CELL * 0.46} />
      <path d={`M${x - CELL * 0.7},${y} h${CELL * 0.35} M${x + CELL * 0.35},${y} h${CELL * 0.35} M${x},${y - CELL * 0.7} v${CELL * 0.35} M${x},${y + CELL * 0.35} v${CELL * 0.35}`} />
    </g>
  );
}

function FunnelView({ f }: { f: Funnel & { mode: Mode; K: number } }) {
  const rows: [string, number, boolean][] = [
    ["filled the bucket at the lake", f.refilled, false],
    ["put out fire with the bucket it started with", f.scoredFirst, false],
    ["put out fire after a refill — the whole chain", f.scoredAfter, true],
  ];
  const label = MODES.find(([m]) => m === f.mode)?.[1] ?? f.mode;
  return (
    <>
      <div style={{ color: "var(--ink)", marginBottom: 8 }}>
        Of {f.episodes} fires, dispatching to <span style={{ color: "var(--muted)" }}>{label}</span>
        {f.K === NO_CLOCK ? <> with <span style={{ color: "var(--muted)" }}>no clock at all</span></>
          : <> on a clock of <span style={{ color: "var(--muted)" }}>{f.K}</span></>}
      </div>
      {rows.map(([label2, n, key]) => (
        <div key={label2} style={{ marginBottom: 7 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 12.5 }}>
            <span style={key ? { color: "var(--ink)" } : undefined}>{label2}</span>
            <span style={{ fontFamily: "ui-monospace, monospace", color: key ? "var(--ink)" : "var(--muted)" }}>{n}/{f.episodes}</span>
          </div>
          <div style={{ height: 7, background: "var(--border)", borderRadius: 4, marginTop: 3, overflow: "hidden" }}>
            <div style={{ width: `${(100 * n) / f.episodes}%`, height: "100%", background: key ? "var(--c-rl)" : "color-mix(in srgb, var(--c-rl) 45%, var(--border))" }} />
          </div>
        </div>
      ))}
      <div style={{ marginTop: 10, fontSize: 12.5, borderTop: "1px solid var(--border)", paddingTop: 8 }}>
        {(f.putOut / f.episodes).toFixed(2)} cells put out per fire, from {(f.drops / f.episodes).toFixed(2)} drops —
        and the commander made {(f.decisions / f.episodes).toFixed(1)} decisions to get them, over{" "}
        {(f.steps / f.episodes).toFixed(1)} steps.
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
