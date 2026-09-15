"use client";

import { useEffect, useRef, useState } from "react";
import { FILMSTRIP_RACES } from "./data/filmstripRaces";
import { BoatGlyph, CourseBackdrop, fitTracks, trackPath } from "./course";

// The same training run, paused five times. Each panel is held-out race 0 sailed by the frozen table as
// it stood after that many practice races, played on one shared clock.

const END = { arrived: "rounded", out: "left the course", clock: "ran out of time" } as const;

export function LearningFilmstrip() {
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const tRef = useRef(0);
  tRef.current = t;
  const maxT = Math.max(...FILMSTRIP_RACES.map((r) => r.x.length - 1));

  useEffect(() => {
    if (!playing) return;
    let raf = 0, last = performance.now();
    const loop = (now: number) => {
      const nt = Math.min(maxT, tRef.current + ((now - last) / 1000) * 20);
      last = now; setT(nt);
      if (nt >= maxT) { setPlaying(false); return; }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing, maxT]);

  const v = fitTracks(FILMSTRIP_RACES, 10, 300, 300, 240);

  return (
    <div style={box}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
        <span style={head}>One training run, paused five times: held-out race 0</span>
        <span style={{ fontSize: 11.5, color: "var(--faint)", fontFamily: "ui-monospace, monospace" }}>t = {Math.floor(t)} s</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(112px, 1fr))", gap: 6 }}>
        {FILMSTRIP_RACES.map((r, k) => {
          const n = r.x.length - 1;
          const i = Math.min(Math.floor(t), n), f = Math.min(t, n) - i, j = Math.min(i + 1, n);
          const x = r.x[i] + (r.x[j] - r.x[i]) * f, y = r.y[i] + (r.y[j] - r.y[i]) * f;
          const done = t >= n;
          return (
            <div key={k} style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
              <svg viewBox={`0 0 ${v.W} ${v.H}`} style={{ width: "100%", height: "auto", display: "block" }} role="img" aria-label={`race after ${r.practice} practice races`}>
                <CourseBackdrop v={v} id={`film${k}`} grid={20} />
                <path d={trackPath(v, r.x, r.y, i) + `L${v.sx(x).toFixed(1)},${v.sy(y).toFixed(1)}`} fill="none" stroke="var(--c-rl)" strokeWidth={2.4} strokeLinejoin="round" />
                <BoatGlyph x={x} y={y} h={r.h[i]} color="var(--c-rl)" v={v} size={1.3} />
              </svg>
              <div style={{ padding: "6px 9px", fontSize: 12, lineHeight: 1.4 }}>
                <div style={{ color: "var(--ink)", fontWeight: 600 }}>after {r.practice} races</div>
                <div style={{ color: done ? (r.end === "arrived" ? "var(--good)" : "var(--bad)") : "var(--muted)" }}>
                  {done ? `${END[r.end]} at ${n} s` : "sailing…"}
                </div>
                <div style={{ color: "var(--faint)", fontFamily: "ui-monospace, monospace" }}>{r.finishes} / 200 finishes</div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 10 }}>
        <button style={{ ...btn, borderColor: "var(--c-rl)", background: "color-mix(in srgb, var(--c-rl) 15%, transparent)", minWidth: 80 }}
          onClick={() => { if (t >= maxT) setT(0); setPlaying((p) => !p); }}>{playing ? "⏸ Pause" : t >= maxT ? "↺ Replay" : "▶ Play all"}</button>
        <input type="range" min={0} max={maxT} step={0.25} value={t} onChange={(e) => { setPlaying(false); setT(Number(e.target.value)); }}
          style={{ flex: 1, accentColor: "var(--c-rl)" }} aria-label="time in the race" />
      </div>
      <div style={{ fontSize: 12, color: "var(--faint)", marginTop: 8, lineHeight: 1.5 }}>
        &ldquo;Finishes&rdquo; is the frozen table at that moment raced on all 200 held-out starts. Same run as the cell above, so the last panel is its race 0.
      </div>
    </div>
  );
}

const box: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "0.4rem 0 1.6rem" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)" };
const btn: React.CSSProperties = { borderWidth: 1, borderStyle: "solid", borderColor: "var(--border)", borderRadius: 7, cursor: "pointer", padding: "5px 11px", fontSize: 12.5, color: "var(--ink)", background: "transparent" };
