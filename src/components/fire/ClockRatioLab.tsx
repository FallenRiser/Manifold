"use client";

import { useEffect, useRef, useState } from "react";
import { N, DROP_R, BURNING, villageCells, freshWorld, act, chief, mulberry32, type World } from "./heliSim";
import { MapCells, HeliGlyph } from "./HelicopterLab";

// One fire, four helicopters. Each panel is the same map with the same dice; the only difference is how many steps
// its helicopter takes per fire tick (1, 2, 3 or 4). The dice are rolled on fire ticks only, so with nobody flying
// the four panels would burn identically; time is called after 150 fire ticks in every panel. The page's Python
// cells do the same thing with the real environment (fire_every=k, weather_every=15k, max_steps=150k).

const SPEEDS = [1, 2, 3, 4];
const CELL = 11, PAD = 3, SIZE = N * CELL + PAD * 2;
type Mode = "nearest" | "guard";
type Panel = { w: World; drops: { r: number; c: number }[] };

const fresh = (): Panel[] => SPEEDS.map(() => ({ w: freshWorld(), drops: [] }));

export function ClockRatioLab() {
  const [panels, setPanels] = useState<Panel[]>(fresh);
  const [mode, setMode] = useState<Mode>("guard");
  const [playing, setPlaying] = useState(false);
  const [seed, setSeed] = useState(1);
  const [tick, setTick] = useState(0);
  const rngs = useRef(SPEEDS.map(() => mulberry32(1)));
  const ref = useRef(panels); ref.current = panels;
  const modeRef = useRef(mode); modeRef.current = mode;

  const allDone = panels.every((p) => p.w.done);

  const advance = () => {
    const cur = ref.current;
    if (cur.every((p) => p.w.done)) { setPlaying(false); return; }
    const next = cur.map((p, i) => {
      if (p.w.done) return { ...p, drops: [] };
      const k = SPEEDS[i];
      let w = p.w;
      const drops: { r: number; c: number }[] = [];
      for (let s = 0; s < k && !w.done; s++) {
        w = act(w, chief(w, modeRef.current), rngs.current[i], k, 150 * k);
        if (w.lastDrop) drops.push({ r: w.lastDrop.r, c: w.lastDrop.c });
      }
      return { w, drops };
    });
    ref.current = next;
    setPanels(next);
    setTick((t) => t + 1);
  };

  const restart = (newSeed = seed, newMode = mode) => {
    setPlaying(false);
    rngs.current = SPEEDS.map(() => mulberry32(newSeed));
    const p = fresh();
    ref.current = p;
    setPanels(p);
    setTick(0);
    modeRef.current = newMode;
  };

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(advance, 380);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  return (
    <div style={box}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
        <span style={head}>One fire, four helicopter speeds</span>
        <span style={{ fontSize: 11.5, color: "var(--faint)", fontFamily: "ui-monospace, monospace" }}>fire tick {tick}</span>
      </div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "var(--faint)", marginRight: 2 }}>every helicopter flown by</span>
          {(["nearest", "guard"] as Mode[]).map((m) => (
            <Choice key={m} on={mode === m} onClick={() => { setMode(m); restart(seed, m); }}>
              {m === "nearest" ? "nearest-fire chief" : "guard-the-village chief"}
            </Choice>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button style={{ ...btn, ...primary }} disabled={allDone} onClick={() => setPlaying((p) => !p)}>{playing ? "⏸ Pause" : "▶ Play"}</button>
          <button style={btn} disabled={allDone || playing} onClick={advance}>One fire tick</button>
          <button style={btn} onClick={() => restart()}>↺ Same fire again</button>
          <button style={btn} onClick={() => { const s = seed + 1; setSeed(s); restart(s); }}>A different fire</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 }}>
        {panels.map((p, i) => {
          const k = SPEEDS[i], w = p.w;
          const hit = villageCells.filter((j) => w.ever[j]).length;
          const burnt = w.ever.filter(Boolean).length;
          const burning = w.S.filter((s) => s === BURNING).length;
          return (
            <div key={k} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                <span style={{ fontSize: 12.5, color: "var(--ink)", fontWeight: 500 }}>{k} step{k > 1 ? "s" : ""} per fire tick{k === 2 ? " (shipped)" : ""}</span>
              </div>
              <TickDots k={k} />
              <svg viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ width: "100%", height: "auto", display: "block", borderRadius: 6, marginTop: 6 }}
                role="img" aria-label={`${k} steps per fire tick: ${hit} of 9 village cells hit, ${burnt} cells burnt, ${burning} burning`}>
                <rect x={0} y={0} width={SIZE} height={SIZE} fill="var(--surface)" />
                <MapCells world={w} cell={CELL} pad={PAD} />
                {p.drops.map((d, j) => (
                  <rect key={j} x={PAD + Math.max(d.c - DROP_R, 0) * CELL} y={PAD + Math.max(d.r - DROP_R, 0) * CELL}
                    width={(Math.min(d.c + DROP_R, N - 1) - Math.max(d.c - DROP_R, 0) + 1) * CELL}
                    height={(Math.min(d.r + DROP_R, N - 1) - Math.max(d.r - DROP_R, 0) + 1) * CELL}
                    fill="color-mix(in srgb, var(--c-regression) 30%, transparent)" stroke="var(--c-regression)" strokeWidth={1.5} />
                ))}
                <HeliGlyph world={w} cell={CELL} pad={PAD} />
              </svg>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
                <Row k="village cells hit" v={`${hit} / 9`} bad={hit > 0} />
                <Row k="cells caught fire" v={burnt} />
                <Row k="drops · put out" v={`${w.drops} · ${w.putOut}`} />
                <Row k="helicopter steps" v={w.t} />
              </div>
              <div style={{ fontSize: 11.5, marginTop: 4, minHeight: 16, color: w.done ? "var(--ink)" : "var(--faint)" }}>
                {w.done ? `${w.done} after ${Math.ceil(w.t / k)} fire ticks` : burning ? `${burning} cells burning` : ""}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** k helicopter marks for every fire mark: the ratio, drawn. */
function TickDots({ k }: { k: number }) {
  const ticks = 4;
  const W = 150, step = W / (ticks * k);
  return (
    <svg viewBox={`0 0 ${W} 16`} style={{ width: "100%", height: 16, display: "block" }} aria-hidden>
      {Array.from({ length: ticks * k }, (_, j) => (
        <rect key={`h${j}`} x={j * step + step * 0.2} y={1} width={Math.max(step * 0.6, 1.5)} height={6} rx={1} fill="color-mix(in srgb, var(--ink) 45%, var(--surface))" />
      ))}
      {Array.from({ length: ticks }, (_, j) => (
        <rect key={`f${j}`} x={(j + 1) * k * step - step * 0.8} y={9} width={Math.max(step * 0.6, 1.5)} height={6} rx={1} fill="var(--bad)" />
      ))}
    </svg>
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
    <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border)", padding: "2px 0" }}>
      <span>{k}</span>
      <span style={{ fontFamily: "ui-monospace, monospace", color: bad ? "var(--bad)" : "var(--ink)" }}>{v}</span>
    </div>
  );
}

const box: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "0.4rem 0 1.6rem" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)" };
const btn: React.CSSProperties = { borderWidth: 1, borderStyle: "solid", borderColor: "var(--border)", borderRadius: 7, cursor: "pointer", padding: "5px 11px", fontSize: 12.5, color: "var(--muted)", background: "transparent", fontFamily: "var(--font-sans, sans-serif)" };
const primary: React.CSSProperties = { borderColor: "var(--c-rl)", background: "color-mix(in srgb, var(--c-rl) 15%, transparent)", color: "var(--ink)" };
