"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BoatGlyph, CourseBackdrop, makeView, trackPath } from "./course";
import { Boat, MAX_STEPS, NO_GO, distToMark, expertAction, newBoat, polar, sailRace, stepBoat } from "./sim";

// Take the helm yourself. The boat is the World 1 physics ported to the browser: one decision per
// second of race time, and whatever you are pressing when the second ticks is the action.

const START_HEADINGS = [-149, 159, 110, 14, 45, -62, 133, 97, -120, 170];

type Run = { b: Boat; xs: number[]; ys: number[]; end: null | "arrived" | "out" | "clock" };
const fresh = (h: number): Run => ({ b: newBoat(h), xs: [0], ys: [0], end: null });

export function HelmLab() {
  const [startIdx, setStartIdx] = useState(0);
  const run = useRef<Run>(fresh(START_HEADINGS[0]));
  const [, force] = useState(0);
  const [going, setGoing] = useState(false);
  const [pace, setPace] = useState(4); // race seconds per real second
  const [showExpert, setShowExpert] = useState(false);
  const held = useRef<0 | 1 | 2>(1);

  const tick = useCallback(() => {
    const R = run.current;
    if (R.end) return;
    const res = stepBoat(R.b, held.current);
    R.xs.push(R.b.x); R.ys.push(R.b.y);
    if (res.arrived) R.end = "arrived";
    else if (res.out) R.end = "out";
    else if (res.truncated) R.end = "clock";
    if (R.end) setGoing(false);
    force((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!going) return;
    const id = setInterval(tick, 1000 / pace);
    return () => clearInterval(id);
  }, [going, pace, tick]);

  const restart = (idx: number) => {
    setGoing(false);
    setStartIdx(idx);
    run.current = fresh(START_HEADINGS[idx]);
    setShowExpert(false);
    force((n) => n + 1);
  };

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (!going) return;
      if (e.key === "ArrowLeft") { held.current = 0; e.preventDefault(); }
      if (e.key === "ArrowRight") { held.current = 2; e.preventDefault(); }
    };
    const up = (e: KeyboardEvent) => { if (e.key === "ArrowLeft" || e.key === "ArrowRight") held.current = 1; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [going]);

  const R = run.current;
  const v = makeView(-75, 75, -30, 90, 640, 400, 300);
  const expert = showExpert ? sailRace(START_HEADINGS[startIdx], expertAction) : null;
  const inIrons = Math.abs(R.b.h) <= NO_GO;
  const d = distToMark(R.b.x, R.b.y);

  const holdBtn = (a: 0 | 2, label: string) => (
    <button
      style={{ ...btn, flex: 1, padding: "10px 0", fontSize: 14 }}
      onPointerDown={(e) => { e.preventDefault(); held.current = a; if (!going && !R.end) setGoing(true); }}
      onPointerUp={() => (held.current = 1)}
      onPointerLeave={() => (held.current = 1)}
      onContextMenu={(e) => e.preventDefault()}
    >{label}</button>
  );

  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
        <span style={head}>Take the helm</span>
        <span style={{ fontSize: 11.5, color: "var(--faint)", fontFamily: "ui-monospace, monospace" }}>
          {R.b.t} / {MAX_STEPS} s · tacks {R.b.tacks}
        </span>
      </div>

      <div style={{ position: "relative" }}>
        <svg viewBox={`0 0 ${v.W} ${v.H}`} style={{ width: "100%", height: "auto", display: "block", borderRadius: 10, border: "1px solid var(--border)", touchAction: "none" }}
          role="img" aria-label="Your boat on the course">
          <CourseBackdrop v={v} id="helm" />
          {/* the no-go zone, drawn around the boat */}
          <g transform={`translate(${v.sx(R.b.x)},${v.sy(R.b.y)})`} opacity={0.5}>
            <path d={`M0,0 L${-Math.tan((NO_GO * Math.PI) / 180) * 46},-46 A46,46 0 0 1 ${Math.tan((NO_GO * Math.PI) / 180) * 46},-46 Z`}
              fill="color-mix(in srgb, var(--bad) 16%, transparent)" stroke="none" />
          </g>
          {expert && <path d={trackPath(v, expert.x, expert.y)} fill="none" stroke="var(--c-regression)" strokeWidth={1.6} strokeDasharray="4 4" opacity={0.8} />}
          <path d={trackPath(v, R.xs, R.ys)} fill="none" stroke="var(--c-rl)" strokeWidth={2} strokeLinejoin="round" />
          <BoatGlyph x={R.b.x} y={R.b.y} h={R.b.h} color="var(--c-rl)" v={v} size={1.15} />
        </svg>
        {R.end && (
          <div style={{
            position: "absolute", left: "50%", top: "42%", transform: "translate(-50%,-50%)", background: "var(--surface)",
            border: "1px solid var(--border-strong)", borderRadius: 10, padding: "10px 16px", fontSize: 14, textAlign: "center", boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
          }}>
            <strong style={{ color: R.end === "arrived" ? "var(--good)" : "var(--bad)" }}>
              {R.end === "arrived" ? `Rounded the mark in ${R.b.t} s` : R.end === "out" ? "Left the race area" : "The clock ran out"}
            </strong>
            <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 3 }}>
              {R.b.tacks} tack{R.b.tacks === 1 ? "" : "s"} · the dashed line can show the expert from this start
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 8, marginTop: 10 }}>
        <Stat label="speed" value={`${R.b.u.toFixed(2)} m/s`} sub={`this heading allows ${polar(R.b.h).toFixed(2)}`} />
        <Stat label="angle to the wind" value={`${Math.abs(R.b.h).toFixed(0)}°`} sub={inIrons ? "inside the no-go zone" : "the sail is drawing"} bad={inIrons} />
        <Stat label="distance to the mark" value={`${d.toFixed(1)} m`} sub="round it within 10 m" />
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        {holdBtn(0, "◀ bear left")}
        <button style={{ ...btn, flex: 1.3, padding: "10px 0", fontSize: 14, borderColor: "var(--c-rl)", background: "color-mix(in srgb, var(--c-rl) 14%, transparent)", color: "var(--ink)" }}
          onClick={() => { if (R.end) restart(startIdx); else setGoing((g) => !g); }}>
          {R.end ? "↺ Try again" : going ? "⏸ Pause" : R.b.t ? "▶ Resume" : "▶ Start the race"}
        </button>
        {holdBtn(2, "bear right ▶")}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10, alignItems: "center", fontSize: 12.5, color: "var(--muted)" }}>
        <button style={btn} onClick={() => restart((startIdx + 1) % START_HEADINGS.length)}>New start heading</button>
        <button style={btn} onClick={() => setShowExpert((s) => !s)}>{showExpert ? "Hide" : "Show"} the expert from this start</button>
        <label style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
          pace
          <select value={pace} onChange={(e) => setPace(Number(e.target.value))} style={{ ...btn, padding: "3px 6px" }}>
            <option value={2}>slow</option><option value={4}>normal</option><option value={8}>fast</option>
          </select>
        </label>
      </div>
      <div style={{ fontSize: 12, color: "var(--faint)", marginTop: 8, lineHeight: 1.5 }}>
        Hold a button (or the ← → keys) to turn 10° per race-second; let go to hold course. The red wedge ahead of the boat is the
        no-go zone: point the bow into it and the sail stops driving.
      </div>
    </div>
  );
}

function Stat({ label, value, sub, bad }: { label: string; value: string; sub: string; bad?: boolean }) {
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 9, padding: "7px 10px" }}>
      <div style={{ fontSize: 11, color: "var(--faint)" }}>{label}</div>
      <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 15, color: bad ? "var(--bad)" : "var(--ink)" }}>{value}</div>
      <div style={{ fontSize: 11, color: bad ? "var(--bad)" : "var(--muted)" }}>{sub}</div>
    </div>
  );
}

const wrap: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "0.4rem 0 1.6rem" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)" };
const btn: React.CSSProperties = { borderWidth: 1, borderStyle: "solid", borderColor: "var(--border)", borderRadius: 8, cursor: "pointer", padding: "5px 11px", fontSize: 12.5, color: "var(--ink)", background: "transparent", fontFamily: "var(--font-sans, sans-serif)", userSelect: "none" };
