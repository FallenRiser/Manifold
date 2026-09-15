"use client";

import { useEffect, useRef, useState } from "react";
import type { Race } from "./types";
import { BOAT_COLORS, BoatGlyph, CourseBackdrop, fitTracks, makeView, trackPath } from "./course";
import { CENTRE, COURSE, MARK, NO_GO } from "./sim";

// Replays races recorded from the shipped Python environment, second by second. Nothing here is
// simulated: every position is the one the page's code produced, so the picture and the printed
// numbers can never disagree.

const END_TEXT = { arrived: "rounded the mark", out: "left the course", clock: "ran out of time" } as const;

export function RaceReplay({
  races,
  title,
  together = true,
  reward,
  showCells = false,
  wholeCourse = false,
  colors = BOAT_COLORS,
  id,
}: {
  races: Race[];
  title: React.ReactNode;
  /** true: all boats on one map at once. false: tabs, one race at a time */
  together?: boolean;
  /** show what the boat has been paid so far under this reward (penalised edge) */
  reward?: "progress" | "speed" | "time";
  showCells?: boolean;
  wholeCourse?: boolean;
  colors?: string[];
  id: string;
}) {
  const [sel, setSel] = useState(0);
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(12);
  const tRef = useRef(0);
  tRef.current = t;

  const shown = together ? races.map((r, i) => ({ r, c: colors[i % colors.length] })) : [{ r: races[sel], c: colors[sel % colors.length] }];
  const maxT = Math.max(...shown.map(({ r }) => r.x.length - 1));

  useEffect(() => {
    if (!playing) return;
    let raf = 0, last = performance.now();
    const tick = (now: number) => {
      const nt = Math.min(maxT, tRef.current + ((now - last) / 1000) * rate);
      last = now;
      setT(nt);
      if (nt >= maxT) { setPlaying(false); return; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, rate, maxT]);

  const v = wholeCourse
    ? makeView(CENTRE.x - COURSE - 8, CENTRE.x + COURSE + 8, CENTRE.y - COURSE - 8, CENTRE.y + COURSE + 8, 640, 460, 300)
    : fitTracks(shown.map(({ r }) => r));

  const at = (r: Race, time: number) => {
    const n = r.x.length - 1;
    const i = Math.min(Math.floor(time), n), f = Math.min(time, n) - i;
    const j = Math.min(i + 1, n);
    let dh = r.h[j] - r.h[i];
    if (dh > 180) dh -= 360;
    if (dh < -180) dh += 360;
    return { i, n, x: r.x[i] + (r.x[j] - r.x[i]) * f, y: r.y[i] + (r.y[j] - r.y[i]) * f, h: r.h[i] + dh * f, u: r.u[i] + (r.u[j] - r.u[i]) * f };
  };

  const pause = () => setPlaying(false);

  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        <span style={head}>{title}</span>
        <span style={{ fontSize: 11.5, color: "var(--faint)", fontFamily: "ui-monospace, monospace" }}>t = {Math.floor(t)} s</span>
      </div>

      {!together && races.length > 1 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
          {races.map((r, i) => (
            <button key={i} onClick={() => { setSel(i); setT(0); setPlaying(false); }}
              style={{ ...btn, ...(i === sel ? { borderColor: colors[i % colors.length], background: `color-mix(in srgb, ${colors[i % colors.length]} 14%, transparent)`, color: "var(--ink)" } : {}) }}>
              {r.label}
            </button>
          ))}
        </div>
      )}

      <svg viewBox={`0 0 ${v.W} ${v.H}`} style={{ width: "100%", height: "auto", display: "block", borderRadius: 10, border: "1px solid var(--border)" }}
        role="img" aria-label="Replay of the recorded race track">
        <CourseBackdrop v={v} id={id} />
        {shown.map(({ r, c }, k) => {
          const p = at(r, t);
          return (
            <g key={k}>
              <path d={trackPath(v, r.x, r.y, p.i) + `L${v.sx(p.x).toFixed(1)},${v.sy(p.y).toFixed(1)}`}
                fill="none" stroke={c} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" opacity={0.9} />
              <BoatGlyph x={p.x} y={p.y} h={p.h} color={c} v={v} />
              {t >= p.n && (
                <text x={v.sx(p.x) + 10} y={v.sy(p.y) + 4} fontSize={11} fill={c} fontWeight={600}>
                  {r.end === "arrived" ? "✓" : r.end === "out" ? "✕ out" : "⏱"}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 10 }}>
        <button style={{ ...btn, borderColor: "var(--c-rl)", background: "color-mix(in srgb, var(--c-rl) 15%, transparent)", color: "var(--ink)", minWidth: 78 }}
          onClick={() => { if (t >= maxT) setT(0); setPlaying((p) => !p); }}>
          {playing ? "⏸ Pause" : t >= maxT ? "↺ Replay" : "▶ Play"}
        </button>
        <input type="range" min={0} max={maxT} step={0.25} value={t} aria-label="time in the race"
          onChange={(e) => { pause(); setT(Number(e.target.value)); }} style={{ flex: "1 1 180px", accentColor: "var(--c-rl)" }} />
        <div style={{ display: "flex", gap: 4 }}>
          {[4, 12, 40].map((rr) => (
            <button key={rr} style={{ ...btn, padding: "4px 8px", ...(rate === rr ? { borderColor: "var(--c-rl)", color: "var(--ink)" } : {}) }} onClick={() => setRate(rr)}>
              {rr} s/s
            </button>
          ))}
        </div>
      </div>

      <div style={{ overflowX: "auto", marginTop: 10 }}>
        <table style={{ borderCollapse: "collapse", fontSize: 12.5, width: "100%", minWidth: 460 }}>
          <thead>
            <tr style={{ color: "var(--faint)", textAlign: "right" }}>
              <th style={{ ...cell, textAlign: "left" }}>boat</th>
              <th style={cell}>speed</th>
              <th style={cell}>off the wind</th>
              <th style={cell}>to the mark</th>
              {reward && <th style={cell}>paid so far</th>}
              {showCells && <th style={cell}>table cell</th>}
              <th style={{ ...cell, textAlign: "left" }}>status</th>
            </tr>
          </thead>
          <tbody>
            {shown.map(({ r, c }, k) => {
              const p = at(r, t);
              const d = Math.hypot(MARK.x - p.x, MARK.y - p.y);
              const done = t >= p.n;
              const inIrons = Math.abs(p.h) <= NO_GO && p.u < 0.4;
              let paid = 0;
              if (reward === "progress") paid = Math.hypot(MARK.x - r.x[0], MARK.y - r.y[0]) - Math.hypot(MARK.x - r.x[p.i], MARK.y - r.y[p.i]);
              if (reward === "speed") for (let q = 1; q <= p.i; q++) paid += r.u[q];
              if (reward === "time") paid = -p.i;
              if (done && r.end === "out") paid += reward === "time" ? -(200 - p.n) : -100;
              let same = 0;
              if (r.cells && p.i > 0) {
                const now = r.cells[Math.min(p.i, r.cells.length) - 1];
                for (let q = Math.min(p.i, r.cells.length) - 1; q >= 0 && r.cells[q] === now; q--) same++;
              }
              return (
                <tr key={k} style={{ borderTop: "1px solid var(--border)", textAlign: "right", fontFamily: "ui-monospace, monospace" }}>
                  <td style={{ ...cell, textAlign: "left", fontFamily: "var(--font-sans, sans-serif)", color: "var(--ink)", whiteSpace: "nowrap" }}>
                    <span style={{ display: "inline-block", width: 9, height: 9, borderRadius: 3, background: c, marginRight: 6 }} />{r.label}
                  </td>
                  <td style={cell}>{p.u.toFixed(2)} m/s</td>
                  <td style={cell}>{Math.abs(p.h).toFixed(0)}°</td>
                  <td style={cell}>{d.toFixed(1)} m</td>
                  {reward && <td style={cell}>{paid.toFixed(1)}</td>}
                  {showCells && (
                    <td style={cell}>{r.cells && p.i > 0 ? `${r.cells[Math.min(p.i, r.cells.length) - 1]}${same >= 5 ? ` ×${same}` : ""}` : "–"}</td>
                  )}
                  <td style={{ ...cell, textAlign: "left", fontFamily: "var(--font-sans, sans-serif)", color: done ? "var(--ink)" : inIrons ? "var(--bad)" : "var(--muted)", whiteSpace: "nowrap" }}>
                    {done ? `${END_TEXT[r.end]} at ${p.n} s` : inIrons ? "in irons — no drive" : "sailing"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const wrap: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.2rem 0 1.6rem" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)" };
const btn: React.CSSProperties = { borderWidth: 1, borderStyle: "solid", borderColor: "var(--border)", borderRadius: 7, cursor: "pointer", padding: "5px 11px", fontSize: 12.5, color: "var(--muted)", background: "transparent", fontFamily: "var(--font-sans, sans-serif)" };
const cell: React.CSSProperties = { padding: "5px 8px", fontWeight: 400 };
