"use client";

import { useEffect, useRef, useState } from "react";
import type { FireEpisode } from "./types";

// Replays episodes recorded from the shipped Python wildfire world, step by step. Nothing is simulated
// here: every cell is the state the page's code produced, so the picture and the printed numbers agree.

const N = 16;
const CELL = 26;
const PAD = 8;
const SIZE = N * CELL + PAD * 2;

const FILL: Record<string, string> = {
  ".": "color-mix(in srgb, var(--good) 20%, var(--surface))",
  "^": "color-mix(in srgb, var(--good) 48%, var(--surface))",
  "#": "color-mix(in srgb, var(--ink) 20%, var(--surface))",
  "~": "color-mix(in srgb, var(--c-regression) 45%, var(--surface))",
  H: "color-mix(in srgb, var(--c-rl) 45%, var(--surface))",
  "*": "var(--bad)",
  x: "color-mix(in srgb, var(--ink) 62%, var(--surface))",
};

const END_TEXT = { out: "fire out", clock: "time called" } as const;

export function FireReplay({ episodes, title, dropR = 2 }: { episodes: FireEpisode[]; title: React.ReactNode; dropR?: number }) {
  const [sel, setSel] = useState(0);
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(8);
  const tRef = useRef(0);
  tRef.current = t;

  const ep = episodes[sel];
  const maxT = ep.frames.length - 1;

  useEffect(() => {
    if (!playing) return;
    let id = 0;
    const tick = () => {
      const nt = Math.min(maxT, tRef.current + 1);
      setT(nt);
      if (nt >= maxT) { setPlaying(false); return; }
      id = window.setTimeout(tick, 1000 / rate);
    };
    id = window.setTimeout(tick, 1000 / rate);
    return () => window.clearTimeout(id);
  }, [playing, rate, maxT]);

  const frame = ep.frames[Math.min(t, maxT)];
  const [hr, hc] = ep.pos[Math.min(t, maxT)] as number[];
  const full = ep.water[Math.min(t, maxT)] > 0;
  const [wdir, wspd] = ep.wind[Math.min(t, maxT)];
  const dropNow = ep.drops.includes(t);
  let burning = 0, spent = 0, villageHit = 0, villageStanding = 0;
  const villageCells = new Set<number>();
  ep.frames[0].split("").forEach((ch, i) => { if (ch === "H") villageCells.add(i); });
  for (let i = 0; i < frame.length; i++) {
    const ch = frame[i];
    if (ch === "*") burning++;
    if (ch === "x") spent++;
    if (villageCells.has(i)) { if (ch === "*" || ch === "x") villageHit++; else villageStanding++; }
  }
  const done = t >= maxT;
  const pick = (i: number) => { setSel(i); setT(0); setPlaying(false); };

  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        <span style={head}>{title}</span>
        <span style={{ fontSize: 11.5, color: "var(--faint)", fontFamily: "ui-monospace, monospace" }}>world {ep.seed} · step {t}</span>
      </div>

      {episodes.length > 1 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {episodes.map((e, i) => (
            <button key={i} onClick={() => pick(i)}
              style={{ ...btn, ...(i === sel ? { borderColor: "var(--c-rl)", background: "color-mix(in srgb, var(--c-rl) 14%, transparent)", color: "var(--ink)" } : {}) }}>
              {e.label}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ width: "100%", maxWidth: 440, height: "auto", display: "block", borderRadius: 10, border: "1px solid var(--border)", flex: "1 1 300px" }}
          role="img" aria-label={`Wildfire map at step ${t}: ${burning} cells burning, ${villageHit} of 9 village cells on fire or lost`}>
          <rect x={0} y={0} width={SIZE} height={SIZE} fill="var(--surface)" />
          {frame.split("").map((ch, i) => {
            const r = Math.floor(i / N), c = i % N;
            const x = PAD + c * CELL, y = PAD + r * CELL;
            return (
              <g key={i}>
                <rect x={x} y={y} width={CELL} height={CELL} fill={FILL[ch]} stroke="var(--surface)" strokeWidth={1} />
                {ch === "^" && <path d={`M${x + CELL / 2},${y + 6} l6,11 h-12 z`} fill="color-mix(in srgb, var(--good) 75%, var(--ink))" opacity={0.55} />}
                {ch === "#" && <circle cx={x + CELL / 2} cy={y + CELL / 2} r={4} fill="color-mix(in srgb, var(--ink) 45%, var(--surface))" />}
                {ch === "H" && <path d={`M${x + 6},${y + 20} v-7 l7,-6 l7,6 v7 z`} fill="color-mix(in srgb, var(--c-rl) 80%, var(--ink))" opacity={0.8} />}
                {ch === "*" && (
                  <path d={`M${x + CELL / 2},${y + 4} C${x + 20},${y + 11} ${x + 20},${y + 21} ${x + CELL / 2},${y + 22} C${x + 6},${y + 21} ${x + 6},${y + 13} ${x + 11},${y + 9} C${x + 12},${y + 13} ${x + 14},${y + 13} ${x + CELL / 2},${y + 4} Z`}
                    fill="color-mix(in srgb, var(--c-rl) 85%, #fff)" opacity={0.85} />
                )}
                {villageCells.has(i) && ch !== "H" && (
                  <rect x={x + 1.5} y={y + 1.5} width={CELL - 3} height={CELL - 3} fill="none" stroke="var(--c-rl)" strokeWidth={2} />
                )}
              </g>
            );
          })}
          {dropNow && (
            <rect x={PAD + Math.max(hc - dropR, 0) * CELL} y={PAD + Math.max(hr - dropR, 0) * CELL}
              width={(Math.min(hc + dropR, N - 1) - Math.max(hc - dropR, 0) + 1) * CELL}
              height={(Math.min(hr + dropR, N - 1) - Math.max(hr - dropR, 0) + 1) * CELL}
              fill="color-mix(in srgb, var(--c-regression) 35%, transparent)" stroke="var(--c-regression)" strokeWidth={2} />
          )}
          <g transform={`translate(${PAD + hc * CELL + CELL / 2},${PAD + hr * CELL + CELL / 2})`}>
            <circle r={9} fill={full ? "var(--c-regression)" : "var(--surface)"} stroke="var(--ink)" strokeWidth={1.8} />
            <path d="M-12,-12 L12,12 M-12,12 L12,-12" stroke="var(--ink)" strokeWidth={1.6} strokeLinecap="round" />
          </g>
        </svg>

        <div style={{ flex: "1 1 180px", minWidth: 170, fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <svg width={44} height={44} viewBox="-22 -22 44 44" aria-label="wind direction">
              <circle r={20} fill="none" stroke="var(--border)" />
              <g transform={`rotate(${(wdir * 180) / Math.PI})`}>
                <line x1={0} y1={14} x2={0} y2={-12} stroke="var(--c-regression)" strokeWidth={2 + wspd * 2} strokeLinecap="round" />
                <path d="M-6,-6 L0,-14 L6,-6" fill="none" stroke="var(--c-regression)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </g>
            </svg>
            <span>wind strength {wspd.toFixed(2)}</span>
          </div>
          <Row k="burning now" v={burning} bad={burning > 0} />
          <Row k="burnt out" v={spent} />
          <Row k="village cells hit" v={`${villageHit} / 9`} bad={villageHit > 0} />
          <Row k="bucket" v={full ? "full" : "empty"} />
          <div style={{ marginTop: 8, color: done ? "var(--ink)" : "var(--faint)" }}>
            {done
              ? `${END_TEXT[ep.end]} after ${ep.steps} steps · ${ep.village_damaged}/9 village cells damaged · ${ep.burnt} cells burnt`
              : dropNow ? "drop" : " "}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 10 }}>
        <button style={{ ...btn, borderColor: "var(--c-rl)", background: "color-mix(in srgb, var(--c-rl) 15%, transparent)", color: "var(--ink)", minWidth: 78 }}
          onClick={() => { if (t >= maxT) setT(0); setPlaying((p) => !p); }}>
          {playing ? "⏸ Pause" : t >= maxT ? "↺ Replay" : "▶ Play"}
        </button>
        <input type="range" min={0} max={maxT} step={1} value={t} aria-label="step in the episode"
          onChange={(e) => { setPlaying(false); setT(Number(e.target.value)); }} style={{ flex: "1 1 180px", accentColor: "var(--c-rl)" }} />
        <div style={{ display: "flex", gap: 4 }}>
          {[3, 8, 20].map((rr) => (
            <button key={rr} style={{ ...btn, padding: "4px 8px", ...(rate === rr ? { borderColor: "var(--c-rl)", color: "var(--ink)" } : {}) }} onClick={() => setRate(rr)}>
              {rr} steps/s
            </button>
          ))}
        </div>
      </div>

      {episodes.length > 1 && (
        <div style={{ overflowX: "auto", marginTop: 12 }}>
          <table style={{ borderCollapse: "collapse", fontSize: 12.5, width: "100%", minWidth: 460 }}>
            <thead>
              <tr style={{ color: "var(--faint)", textAlign: "right" }}>
                <th style={{ ...cell, textAlign: "left" }}>same world, different helm</th>
                <th style={cell}>village damaged</th>
                <th style={cell}>cells burnt</th>
                <th style={cell}>cells put out</th>
                <th style={{ ...cell, textAlign: "left" }}>ended</th>
              </tr>
            </thead>
            <tbody>
              {episodes.map((e, i) => (
                <tr key={i} style={{ borderTop: "1px solid var(--border)", textAlign: "right", fontFamily: "ui-monospace, monospace", color: i === sel ? "var(--ink)" : "var(--muted)" }}>
                  <td style={{ ...cell, textAlign: "left", fontFamily: "var(--font-sans, sans-serif)" }}>{e.label}</td>
                  <td style={cell}>{e.village_damaged} / 9</td>
                  <td style={cell}>{e.burnt}</td>
                  <td style={cell}>{e.put_out}</td>
                  <td style={{ ...cell, textAlign: "left", fontFamily: "var(--font-sans, sans-serif)" }}>{END_TEXT[e.end]} at step {e.steps}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
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

const wrap: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.2rem 0 1.6rem" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)" };
const btn: React.CSSProperties = { borderWidth: 1, borderStyle: "solid", borderColor: "var(--border)", borderRadius: 7, cursor: "pointer", padding: "5px 11px", fontSize: 12.5, color: "var(--muted)", background: "transparent", fontFamily: "var(--font-sans, sans-serif)" };
const cell: React.CSSProperties = { padding: "5px 8px", fontWeight: 400 };
