"use client";

import { useRef, useState } from "react";
import { BoatGlyph, CourseBackdrop, makeView, trackPath } from "./course";
import { Boat, Reward, expertAction, newBoat, stepBoat } from "./sim";

// A live Python-style console on the boat: call reset and step yourself and read exactly what comes back.
// The starting headings are numpy's for seeds 0-9, so reset(seed=k) starts where the Python boat starts.

const SEED_HEADINGS = [
  49.306207435723536, 4.255784892092407, -85.8196316702461, -149.16629982829522, 159.50019800605236,
  109.80105254833688, 13.739166529899535, 45.03436797768012, -62.28998042199814, 133.28971342923046,
];

type Line = { cmd: string; out: string; flag?: "end" | "warn" };
const py = (b: boolean) => (b ? "True" : "False");
const f = (v: number, d = 2) => v.toFixed(d);

export function StepConsoleLab() {
  const [seed, setSeed] = useState(3);
  const [reward, setReward] = useState<Reward>("progress");
  const boat = useRef<Boat | null>(null);
  const over = useRef(false);
  const track = useRef<{ xs: number[]; ys: number[] }>({ xs: [], ys: [] });
  const [lines, setLines] = useState<Line[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  const push = (l: Line[]) => {
    setLines((prev) => [...prev, ...l].slice(-60));
    requestAnimationFrame(() => logRef.current && (logRef.current.scrollTop = logRef.current.scrollHeight));
  };

  const reset = () => {
    const b = newBoat(SEED_HEADINGS[seed]);
    boat.current = b; over.current = false;
    track.current = { xs: [0], ys: [0] };
    push([{ cmd: `obs, info = env.reset(seed=${seed})`, out: `obs = (0.00, 0.00, ${f(b.h)}, 0.00)   info = {}` }]);
  };

  const step = (a: number, quiet = false): boolean => {
    const b = boat.current;
    if (!b) { push([{ cmd: `env.step(${a})`, out: "call reset() first: there is no race yet", flag: "warn" }]); return false; }
    if (over.current) {
      push([{ cmd: `env.step(${a})`, out: "this race already ended. A well-behaved loop calls reset() now; stepping on is undefined.", flag: "warn" }]);
      return false;
    }
    const r = stepBoat(b, a, reward);
    track.current.xs.push(b.x); track.current.ys.push(b.y);
    const end = r.terminated || r.truncated;
    if (end) over.current = true;
    if (!quiet || end)
      push([{
        cmd: `env.step(${a})`,
        out: `obs=(${f(r.obs[0])}, ${f(r.obs[1])}, ${f(r.obs[2], 1)}, ${f(r.obs[3])})  reward=${f(r.reward, 3)}  terminated=${py(r.terminated)}  truncated=${py(r.truncated)}  info={'arrived': ${py(r.arrived)}, 'out': ${py(r.out)}}`,
        flag: end ? "end" : undefined,
      }]);
    return !end;
  };

  const runExpert = () => {
    const b = boat.current;
    if (!b || over.current) { step(1); return; }
    let n = 0;
    while (step(expertAction(b), true)) n++;
    push([{ cmd: "# the expert steered the rest of the race", out: `${n + 1} more steps, race clock now ${b.t} s` }]);
  };

  const b = boat.current;
  const v = makeView(-70, 70, -25, 85, 640, 300, 220);

  return (
    <div style={box}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
        <span style={head}>Drive the environment by hand</span>
        <span style={{ fontSize: 11.5, color: "var(--faint)", fontFamily: "ui-monospace, monospace" }}>{b ? `t = ${b.t} s` : "no race yet"}</span>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 8, fontSize: 12.5, color: "var(--muted)" }}>
        <label>seed <select value={seed} onChange={(e) => setSeed(Number(e.target.value))} style={sel}>
          {SEED_HEADINGS.map((_, k) => <option key={k} value={k}>{k}</option>)}
        </select></label>
        <label>reward <select value={reward} onChange={(e) => setReward(e.target.value as Reward)} style={sel}>
          <option value="progress">progress</option><option value="time">time</option><option value="speed">speed</option>
        </select></label>
        <button style={{ ...btn, borderColor: "var(--c-rl)", background: "color-mix(in srgb, var(--c-rl) 14%, transparent)" }} onClick={reset}>reset(seed)</button>
        <button style={btn} onClick={() => step(0)}>step(0) bear left</button>
        <button style={btn} onClick={() => step(1)}>step(1) hold</button>
        <button style={btn} onClick={() => step(2)}>step(2) bear right</button>
        <button style={btn} onClick={runExpert}>let the expert finish</button>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <svg viewBox={`0 0 ${v.W} ${v.H}`} style={{ flex: "1 1 260px", maxWidth: 420, height: "auto", borderRadius: 10, border: "1px solid var(--border)" }} role="img" aria-label="The boat you are driving">
          <CourseBackdrop v={v} id="console" />
          {b && <path d={trackPath(v, track.current.xs, track.current.ys)} fill="none" stroke="var(--c-rl)" strokeWidth={2} />}
          {b && <BoatGlyph x={b.x} y={b.y} h={b.h} color="var(--c-rl)" v={v} />}
        </svg>
        <div ref={logRef} style={{
          flex: "2 1 320px", height: 220, overflowY: "auto", background: "var(--canvas)", border: "1px solid var(--border)", borderRadius: 10,
          padding: "8px 10px", fontFamily: "ui-monospace, monospace", fontSize: 11.5, lineHeight: 1.5,
        }}>
          {lines.length === 0 && <div style={{ color: "var(--faint)" }}># press reset(seed) to start a race, then step</div>}
          {lines.map((l, i) => (
            <div key={i} style={{ marginBottom: 4 }}>
              <div style={{ color: "var(--muted)" }}>&gt;&gt;&gt; {l.cmd}</div>
              <div style={{ color: l.flag === "warn" ? "var(--bad)" : l.flag === "end" ? "var(--good)" : "var(--ink)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{l.out}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ fontSize: 12, color: "var(--faint)", marginTop: 8, lineHeight: 1.5 }}>
        This is the same boat, ported line for line to run in the page, and <code>reset(seed=k)</code> starts from the heading numpy gives seed k.
        Watch which of the two ending flags turns True, and what changes in <code>reward</code> when you switch the reward rule.
      </div>
    </div>
  );
}

const box: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "0.4rem 0 1.6rem" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)" };
const btn: React.CSSProperties = { borderWidth: 1, borderStyle: "solid", borderColor: "var(--border)", borderRadius: 7, cursor: "pointer", padding: "5px 10px", fontSize: 12, color: "var(--ink)", background: "transparent", fontFamily: "ui-monospace, monospace" };
const sel: React.CSSProperties = { ...btn, padding: "3px 5px", marginLeft: 4 };
