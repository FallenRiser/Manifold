"use client";

import { useEffect, useMemo, useState } from "react";
import { N, BURNING, BURNT, UNBURNT, TERRAIN, LAKE, VILLAGE, ROCK, FOREST, type World } from "./heliSim";
import { HeliGlyph } from "./HelicopterLab";
import { momentAt, addDraw, emptyMaps, coverNow, argbest, VILLAGE_CENTRE, type Maps } from "./cobra";

// Two maps of the same decision. For each of the 256 cells the commander could name, the lab flies the rest
// of the fire -- deliver that order, then guard -- and records two numbers: how much fire the crew ends up
// putting out, and how much of the map catches afterwards. Twelve sets of dice, shared across all 256 orders,
// so the only thing that differs between two cells is the order. The maps do not peak in the same place.

const CELL = 15, PAD = 4, SIZE = N * CELL + PAD * 2;
const MOMENTS = [8, 16, 24, 32];
const DRAWS = 12;

const rc = (i: number) => `${Math.floor(i / N)}, ${i % N}`;
const toVillage = (i: number) => Math.abs(Math.floor(i / N) - VILLAGE_CENTRE[0]) + Math.abs((i % N) - VILLAGE_CENTRE[1]);

export function CobraLab() {
  const [t0, setT0] = useState(24);
  const [maps, setMaps] = useState<Maps>(emptyMaps);
  const [pick, setPick] = useState<number | null>(null);

  const world = useMemo(() => momentAt(t0), [t0]);
  useEffect(() => { setMaps(emptyMaps()); setPick(null); }, [t0]);
  useEffect(() => {
    if (maps.draws >= DRAWS) return;
    const id = setTimeout(() => setMaps((m) => (m.draws >= DRAWS ? m : addDraw(m, world, m.draws))), 20);
    return () => clearTimeout(id);
  }, [maps, world]);

  const ready = maps.draws > 0;
  const bestPay = ready ? argbest(maps.pay, 1) : 0;
  const bestHarm = ready ? argbest(maps.harm, -1) : 0;
  const shown = pick ?? bestPay;
  const burning = world.S.filter((s) => s === BURNING).length;

  return (
    <div style={box}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        <span style={head}>One order, two rewards</span>
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>the lab map · all 256 orders, flown to the end on the same dice</span>
      </div>

      <div style={{ fontSize: 11, color: "var(--faint)", marginBottom: 4 }}>the moment the commander is handed the fire</div>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 12 }}>
        {MOMENTS.map((m) => (
          <button key={m} onClick={() => setT0(m)} aria-pressed={t0 === m}
            style={{ ...btn, padding: "4px 9px", ...(t0 === m ? chosen : {}) }}>step {m}</button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 10 }}>
        <Heat title="what a bounty would pay" sub="cells this order puts out · deeper is more" accent="var(--c-rl)"
          world={world} v={maps.pay} best={bestPay} other={bestHarm} pick={pick} onPick={setPick} ready={ready} />
        <Heat title="what the damage reward charges" sub="cells that catch afterwards · deeper is worse" accent="var(--bad)"
          world={world} v={maps.harm} best={bestHarm} other={bestPay} pick={pick} onPick={setPick} ready={ready} />
      </div>

      {maps.draws < DRAWS && (
        <div style={{ fontSize: 12.5, color: "var(--faint)", marginBottom: 8 }}>
          Flying 256 orders to the end of the fire, {maps.draws} of {DRAWS} sets of dice settled…
        </div>
      )}

      {ready && (
        <div style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.6, borderTop: "1px solid var(--border)", paddingTop: 9 }}>
          <div style={{ marginBottom: 7 }}>
            At step {t0}, {burning} cells are burning and the bucket is {world.water ? "full" : "empty"}. Order the drop to{" "}
            <strong style={{ color: "var(--ink)", fontFamily: "ui-monospace, monospace" }}>({rc(shown)})</strong>
            {pick === null && <span style={{ color: "var(--faint)" }}> — the bounty&rsquo;s own favourite —</span>} and the
            crew goes on to put out <strong style={{ color: "var(--ink)" }}>{maps.pay[shown].toFixed(1)}</strong> cells while{" "}
            <strong style={{ color: "var(--ink)" }}>{(maps.harm[shown] - 10 * maps.vill[shown]).toFixed(1)}</strong> more catch fire,{" "}
            {maps.vill[shown].toFixed(1)} of them in the village. That square covers {coverNow(world, shown)} burning
            cell{coverNow(world, shown) === 1 ? "" : "s"} right now, and sits {toVillage(shown)} from the village.
          </div>
          <Row label="the order that puts out the most fire" i={bestPay} m={maps} />
          <Row label="the order that does the least damage" i={bestHarm} m={maps} />
          <div style={{ marginTop: 8, color: "var(--faint)" }}>
            {bestPay === bestHarm
              ? "At this moment the two rewards happen to agree — the same order is best under both."
              : <>The two rewards do not point at the same cell. Paying for cells put out would buy{" "}
                <strong style={{ color: "var(--ink)" }}>{(maps.pay[bestPay] - maps.pay[bestHarm]).toFixed(1)}</strong> more
                cells doused at a cost of{" "}
                <strong style={{ color: "var(--ink)" }}>{(maps.harm[bestPay] - maps.harm[bestHarm]).toFixed(0)}</strong>{" "}
                extra points of damage. Click any cell on either map to price your own order.</>}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, i, m }: { label: string; i: number; m: Maps }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 12.5 }}>
      <span>{label}</span>
      <span style={{ fontFamily: "ui-monospace, monospace", color: "var(--ink)", whiteSpace: "nowrap" }}>
        ({rc(i)}) · puts out {m.pay[i].toFixed(1)} · damage {m.harm[i].toFixed(0)}
      </span>
    </div>
  );
}

function Heat({ title, sub, accent, world, v, best, other, pick, onPick, ready }: {
  title: string; sub: string; accent: string; world: World; v: number[];
  best: number; other: number; pick: number | null; onPick: (i: number) => void; ready: boolean;
}) {
  const lo = Math.min(...v), hi = Math.max(...v);
  const heat = (x: number) => (hi - lo < 1e-9 ? 0 : (x - lo) / (hi - lo));   // deeper always means MORE of it
  const at = (i: number) => ({ x: PAD + (i % N) * CELL, y: PAD + Math.floor(i / N) * CELL });

  return (
    <div style={{ flex: "1 1 248px", maxWidth: SIZE }}>
      <div style={{ fontSize: 12, color: "var(--ink)", marginBottom: 1 }}>{title}</div>
      <div style={{ fontSize: 11, color: "var(--faint)", marginBottom: 5 }}>{sub}</div>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width="100%" style={{ maxWidth: SIZE, display: "block", borderRadius: 8, background: "var(--bg)" }}>
        {TERRAIN.map((ty, i) => {
          const { x, y } = at(i), s = world.S[i];
          return (
            <g key={i} onClick={() => onPick(i)} style={{ cursor: "pointer" }}>
              <rect x={x} y={y} width={CELL} height={CELL} fill="var(--surface)" />
              {ready && <rect x={x} y={y} width={CELL} height={CELL} fill={accent} opacity={0.06 + 0.82 * heat(v[i])} />}
              {ty === LAKE && <rect x={x + 3} y={y + 3} width={CELL - 6} height={CELL - 6} rx={2} fill="var(--c-regression)" opacity={0.75} />}
              {ty === ROCK && <circle cx={x + CELL / 2} cy={y + CELL / 2} r={2.4} fill="var(--ink)" opacity={0.45} />}
              {ty === FOREST && s === UNBURNT && <circle cx={x + CELL / 2} cy={y + CELL / 2} r={1.6} fill="var(--ink)" opacity={0.2} />}
              {ty === VILLAGE && <rect x={x + 1} y={y + 1} width={CELL - 2} height={CELL - 2} fill="none" stroke="var(--ink)" strokeWidth={1.3} strokeOpacity={0.85} />}
              {s === BURNING && <circle cx={x + CELL / 2} cy={y + CELL / 2} r={3.6} fill="var(--surface)" stroke="var(--ink)" strokeWidth={1.6} />}
              {s === BURNT && <path d={`M${x + 4},${y + 4} l${CELL - 8},${CELL - 8} M${x + 4},${y + CELL - 4} l${CELL - 8},${-(CELL - 8)}`} stroke="var(--ink)" strokeOpacity={0.3} strokeWidth={1.1} />}
              <rect x={x} y={y} width={CELL} height={CELL} fill="none" stroke="var(--surface)" strokeWidth={0.6} />
            </g>
          );
        })}
        {ready && <Ring i={other} dashed />}
        {ready && <Ring i={best} />}
        {pick !== null && <Ring i={pick} pickd />}
        <HeliGlyph world={world} cell={CELL} pad={PAD} />
      </svg>
    </div>
  );
}

function Ring({ i, dashed, pickd }: { i: number; dashed?: boolean; pickd?: boolean }) {
  const x = PAD + (i % N) * CELL, y = PAD + Math.floor(i / N) * CELL;
  return (
    <rect x={x - 0.5} y={y - 0.5} width={CELL + 1} height={CELL + 1} rx={3} fill="none"
      stroke={pickd ? "var(--brand)" : "var(--ink)"} strokeWidth={pickd ? 2.4 : dashed ? 1.4 : 2.2}
      strokeDasharray={dashed ? "3 2" : undefined} strokeOpacity={dashed ? 0.55 : 1} />
  );
}

const box: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "0.4rem 0 1.6rem" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)" };
const btn: React.CSSProperties = { borderWidth: 1, borderStyle: "solid", borderColor: "var(--border)", borderRadius: 7, cursor: "pointer", padding: "5px 11px", fontSize: 12.5, color: "var(--muted)", background: "transparent", fontFamily: "var(--font-sans, sans-serif)" };
const chosen: React.CSSProperties = { borderColor: "var(--c-rl)", background: "color-mix(in srgb, var(--c-rl) 14%, transparent)", color: "var(--ink)" };
