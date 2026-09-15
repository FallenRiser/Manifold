"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BoatGlyph, CourseBackdrop, makeView, trackPath } from "./course";
import { ARRIVE } from "./sim";
import { courseCentre, DEFAULTS, Evaluation, LIMITS, Learner, StepDetail, TrainConfig, VORTEX_R, WIND_LIMIT, evaluate } from "./trainer";

type Handle = "start" | "mark" | "vortex" | "wind";

// Train a fleet of boats in the page, all on one shared map. Before training, drag the start square to move
// where every race begins, and drag the wind dial to set where the wind comes from and how strong it is.
// Running, compute is time-sliced on timers (not animation frames, which some views throttle); slow motion
// instead advances boat 1 one update at a time and walks the code.

const ACTIONS = ["bear left", "hold", "bear right"];
// slow: every boat sails one second of its race per tick, so you watch them move;
// normal: one whole race per boat per tick; fast: as many races as ~40 ms of compute allows
const SPEEDS = { slow: "slow", normal: "normal", fast: "fast" } as const;
const SLOW_TICK_MS = 70;
type Phase = "idle" | "running" | "paused" | "done";

export const boatColor = (k: number) => `hsl(${(38 + k * 137.5) % 360} 72% 52%)`;

const CODE = [
  "for race in range(RACES):",
  "    obs, info = env.reset()",
  "    s = view(obs)",
  "    eps = EPS0 * (1 - race / RACES)",
  "    while True:",
  "        if rng.random() < eps: a = random_action()",
  "        else:                  a = argmax(Q[s])",
  "        obs, r, terminated, truncated, info = env.step(a)",
  "        s2 = view(obs)",
  "        target = r if terminated else r + GAMMA * max(Q[s2])",
  "        Q[s, a] += ALPHA * (target - Q[s, a])",
  "        s = s2",
  "        if terminated or truncated: break",
];
const SUBPHASES: number[][] = [[5, 6], [7, 8], [9], [10], [11, 12]];

// the map, and the wind dial drawn in its top-left corner
const V = makeView(-105, 105, -55, 135, 640, 520, 400);
const DIAL = { cx: 70, cy: 78, rMin: 22, rMax: 50 };
const speedToR = (s: number) => DIAL.rMin + ((s - 2) / 2) * (DIAL.rMax - DIAL.rMin);

export function TrainingGroundLab() {
  const [cfg, setCfg] = useState<TrainConfig>(DEFAULTS);
  const [phase, setPhase] = useState<Phase>("idle");
  const [speed, setSpeed] = useState<keyof typeof SPEEDS>("normal");
  const [slowMo, setSlowMo] = useState(false);
  const [sub, setSub] = useState(0);
  const [detail, setDetail] = useState<StepDetail | null>(null);
  const [results, setResults] = useState<Evaluation[] | null>(null);
  const [focus, setFocus] = useState<number | null>(null);
  const [, setTick] = useState(0);
  const fleet = useRef<Learner[]>([]);
  const elapsed = useRef(0);
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<Handle | null>(null);

  const build = useCallback((c: TrainConfig) => {
    fleet.current = Array.from({ length: c.boats }, (_, k) => new Learner(c, k));
    setResults(null); setDetail(null); setSub(0); elapsed.current = 0;
    setTick((t) => t + 1);
  }, []);
  useEffect(() => { build(cfg); }, [cfg, build]);

  const finish = useCallback(() => {
    setPhase("done");
    setResults(fleet.current.map((L) => evaluate(L)));
  }, []);

  // fast training loop
  useEffect(() => {
    if (phase !== "running" || slowMo) return;
    let timer = 0, lastDraw = 0;
    const chunk = () => {
      const t0 = performance.now();
      const F = fleet.current;
      if (speed === "slow") {
        for (const L of F) L.step();
      } else if (speed === "normal") {
        for (const L of F) L.runRace();
      } else {
        do { for (const L of F) L.runRace(); } while (performance.now() - t0 < 40 && !F.every((L) => L.done));
      }
      elapsed.current += performance.now() - t0;
      const all = F.every((L) => L.done);
      if (speed !== "fast" || all || t0 - lastDraw > 100) { lastDraw = t0; setTick((t) => t + 1); }
      if (all) { finish(); return; }
      timer = window.setTimeout(chunk, speed === "slow" ? SLOW_TICK_MS : speed === "normal" ? 60 : 0);
    };
    timer = window.setTimeout(chunk, 0);
    return () => window.clearTimeout(timer);
  }, [phase, slowMo, speed, finish]);

  // slow motion: boat 1 only, one sub-phase of one update per tick
  const subRef = useRef(0);
  const hasDetail = useRef(false);
  useEffect(() => {
    if (phase !== "running" || !slowMo) return;
    const id = setInterval(() => {
      const next = (subRef.current + 1) % SUBPHASES.length;
      if (next === 0 || !hasDetail.current) {
        const d = fleet.current[0].step();
        if (!d) { clearInterval(id); finish(); return; }
        hasDetail.current = true;
        subRef.current = 0;
        setDetail(d); setSub(0);
      } else {
        subRef.current = next;
        setSub(next);
      }
    }, 380);
    return () => clearInterval(id);
  }, [phase, slowMo, finish]);

  const F = fleet.current;
  const racesDone = F.length ? Math.min(...F.map((L) => L.race)) : 0;
  const updates = F.reduce((n, L) => n + L.updates, 0);
  const locked = phase !== "idle";
  const set = <K extends keyof TrainConfig>(k: K, v: TrainConfig[K]) => { if (!locked) setCfg((c) => ({ ...c, [k]: v })); };
  const hot = slowMo && phase === "running" ? SUBPHASES[sub] : [];

  // ---- dragging on the map ----
  const svgPoint = (e: React.PointerEvent) => {
    const r = svg.current!.getBoundingClientRect();
    return { px: ((e.clientX - r.left) / r.width) * V.W, py: ((e.clientY - r.top) / r.height) * V.H };
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current || locked) return;
    const { px, py } = svgPoint(e);
    if (drag.current === "wind") {
      const dx = px - DIAL.cx, dy = py - DIAL.cy;
      let ang = (Math.atan2(dx, -dy) * 180) / Math.PI;
      ang = Math.max(-WIND_LIMIT, Math.min(WIND_LIMIT, Math.round(ang / 5) * 5));
      const r = Math.max(DIAL.rMin, Math.min(DIAL.rMax, Math.hypot(dx, dy)));
      const s = Math.round((2 + ((r - DIAL.rMin) / (DIAL.rMax - DIAL.rMin)) * 2) * 10) / 10;
      setCfg((c) => (c.windDir === ang && c.windSpeed === s ? c : { ...c, windDir: ang, windSpeed: s }));
    } else {
      const which = drag.current;
      let x = V.x0 + px / V.k, y = V.y1 - py / V.k;
      // everything stays on the map; start and mark stay a sensible distance apart (the race area follows them)
      x = Math.max(V.x0 + 8, Math.min(V.x1 - 8, x)); y = Math.max(V.y0 + 8, Math.min(V.y1 - 8, y));
      const other = which === "start" ? { x: cfg.markX, y: cfg.markY } : which === "mark" ? { x: cfg.startX, y: cfg.startY } : null;
      if (other) {
        const MIN = ARRIVE + 20, dm = Math.hypot(x - other.x, y - other.y);
        if (dm < MIN) { x = other.x + ((x - other.x) * MIN) / (dm || 1); y = other.y + ((y - other.y) * MIN) / (dm || 1); }
      }
      x = Math.round(x); y = Math.round(y);
      setCfg((c) => {
        if (which === "start") return c.startX === x && c.startY === y ? c : { ...c, startX: x, startY: y };
        if (which === "mark") return c.markX === x && c.markY === y ? c : { ...c, markX: x, markY: y };
        return c.vortexX === x && c.vortexY === y ? c : { ...c, vortexX: x, vortexY: y };
      });
    }
  };
  const grab = (what: Handle) => (e: React.PointerEvent) => {
    if (locked) return;
    drag.current = what;
    svg.current?.setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  const windRad = (cfg.windDir * Math.PI) / 180;
  const wr = speedToR(cfg.windSpeed);
  const tail = { x: DIAL.cx + wr * Math.sin(windRad), y: DIAL.cy - wr * Math.cos(windRad) };
  const head = { x: DIAL.cx - 18 * Math.sin(windRad), y: DIAL.cy + 18 * Math.cos(windRad) };
  const sx0 = V.sx(cfg.startX), sy0 = V.sy(cfg.startY);
  const arc = (r: number) => {
    const a0 = (-WIND_LIMIT * Math.PI) / 180, a1 = (WIND_LIMIT * Math.PI) / 180;
    return `M${DIAL.cx + r * Math.sin(a0)},${DIAL.cy - r * Math.cos(a0)} A${r},${r} 0 0 1 ${DIAL.cx + r * Math.sin(a1)},${DIAL.cy - r * Math.cos(a1)}`;
  };

  return (
    <div style={box}>
      {/* ---- settings ---- */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "6px 18px" }}>
        <Slider label="boats training at once" value={cfg.boats} min={1} max={LIMITS.boats} step={1} fmt={(x) => `${x}`} disabled={locked} onChange={(x) => set("boats", x)} />
        <Slider label="practice races each" value={cfg.races} min={100} max={LIMITS.races} step={100} fmt={(x) => `${x}`} disabled={locked} onChange={(x) => set("races", x)} />
        <Slider label="step size α" value={cfg.alpha} min={0.05} max={1} step={0.05} fmt={(x) => x.toFixed(2)} disabled={locked} onChange={(x) => set("alpha", x)} />
        <Slider label="discount γ" value={cfg.gamma} min={0.9} max={0.999} step={0.001} fmt={(x) => x.toFixed(3)} disabled={locked} onChange={(x) => set("gamma", x)} />
        <Slider label="starting exploration ε" value={cfg.eps0} min={0} max={0.5} step={0.05} fmt={(x) => x.toFixed(2)} disabled={locked} onChange={(x) => set("eps0", x)} />
        <Pick label="wind shifts" value={String(cfg.shift)} disabled={locked} onChange={(x) => set("shift", Number(x))}
          options={[["0", "steady"], ["10", "wanders ±10°"], ["25", "wanders ±25°"]]} />
        <Pick label="vortex (a current the boat can't see)" value={String(cfg.vortex)} disabled={locked} onChange={(x) => set("vortex", Number(x) as TrainConfig["vortex"])}
          options={[["0", "off"], ["1", "gentle (0.8 m/s)"], ["2", "strong (1.6 m/s)"]]} />
        <Pick label="reward" value={cfg.reward} disabled={locked} onChange={(x) => set("reward", x as TrainConfig["reward"])}
          options={[["progress", "distance gained (shipped)"], ["time", "−1 per second"], ["speed", "speed"]]} />
        <Pick label="course edge" value={cfg.edge} disabled={locked} onChange={(x) => set("edge", x as TrainConfig["edge"])}
          options={[["penalty", "penalised (shipped)"], ["free", "free"], ["none", "none"]]} />
        <Pick label="what the boat sees" value={cfg.view} disabled={locked} onChange={(x) => set("view", x as TrainConfig["view"])}
          options={[["relative", "where is the mark (shipped)"], ["absolute", "where am I"]]} />
        <button style={{ ...btn, alignSelf: "end" }} disabled={locked} onClick={() => setCfg(DEFAULTS)}>shipped settings</button>
      </div>

      {/* ---- controls ---- */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", margin: "14px 0 10px", paddingTop: 12, borderTop: "1px solid var(--border)" }}>
        {phase !== "done" && (
          <button style={{ ...btn, ...on, minWidth: 110, fontSize: 13.5 }} onClick={() => setPhase((p) => (p === "running" ? "paused" : "running"))}>
            {phase === "running" ? "⏸ Pause" : phase === "paused" ? "▶ Resume" : "▶ Train the fleet"}
          </button>
        )}
        <button style={btn} onClick={() => { setPhase("idle"); build(cfg); }}>{phase === "idle" ? "clear" : "↺ reset"}</button>
        <span style={{ fontSize: 12.5, color: "var(--muted)", marginLeft: 6 }}>speed</span>
        {(Object.keys(SPEEDS) as (keyof typeof SPEEDS)[]).map((k) => (
          <button key={k} style={{ ...btn, ...(speed === k && !slowMo ? on : {}) }} onClick={() => { setSpeed(k); setSlowMo(false); }}>{k}</button>
        ))}
        <button style={{ ...btn, ...(slowMo ? on : {}) }} onClick={() => setSlowMo((s) => !s)} disabled={phase === "done"}>slow motion: boat 1, one update at a time</button>
        <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--faint)", fontFamily: "ui-monospace, monospace" }}>
          race {racesDone} / {cfg.races} · {updates.toLocaleString()} updates{elapsed.current > 0 ? ` · ${(elapsed.current / 1000).toFixed(1)} s of compute` : ""}
        </span>
      </div>
      <Progress frac={racesDone / cfg.races} />

      {/* ---- the shared map ---- */}
      <div style={{ position: "relative", marginTop: 12 }}>
        <svg ref={svg} viewBox={`0 0 ${V.W} ${V.H}`} role="img" aria-label="All boats' latest practice races on one map"
          style={{ width: "100%", height: "auto", display: "block", borderRadius: 12, border: "1px solid var(--border)", touchAction: "none", userSelect: "none", WebkitUserSelect: "none" }}
          onPointerMove={onMove} onPointerUp={() => (drag.current = null)} onPointerCancel={() => (drag.current = null)}>
          <defs>
            <marker id="tg-vortex-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--c-dimred)" />
            </marker>
          </defs>
          <CourseBackdrop v={V} id="tg-map" grid={20} windDir={cfg.windDir} showStart={false} showMark={false} centre={courseCentre(cfg)} />

          {/* the vortex: its reach, its core, and arrows turning the way the water turns (anticlockwise) */}
          {cfg.vortex > 0 && (() => {
            const vx = V.sx(cfg.vortexX), vy = V.sy(cfg.vortexY), core = VORTEX_R * V.k, rr = core * 1.45;
            const pt = (deg: number) => `${(vx + rr * Math.cos((deg * Math.PI) / 180)).toFixed(1)},${(vy + rr * Math.sin((deg * Math.PI) / 180)).toFixed(1)}`;
            return (
              <g style={{ cursor: locked ? "default" : "grab" }} onPointerDown={grab("vortex")}>
                <circle cx={vx} cy={vy} r={2.5 * core} fill="color-mix(in srgb, var(--c-dimred) 7%, transparent)" stroke="var(--c-dimred)" strokeDasharray="3 5" strokeWidth={1} opacity={0.8} />
                <circle cx={vx} cy={vy} r={core} fill="color-mix(in srgb, var(--c-dimred) 16%, transparent)" />
                <g>
                  <animateTransform attributeName="transform" type="rotate" from={`0 ${vx} ${vy}`} to={`-360 ${vx} ${vy}`} dur={cfg.vortex === 2 ? "3s" : "6s"} repeatCount="indefinite" />
                  {[0, 120, 240].map((a) => (
                    <path key={a} d={`M${pt(a)} A${rr},${rr} 0 0 0 ${pt(a - 75)}`} fill="none" stroke="var(--c-dimred)" strokeWidth={2.2} markerEnd="url(#tg-vortex-arrow)" />
                  ))}
                </g>
                <circle cx={vx} cy={vy} r={3} fill="var(--c-dimred)" />
                <text x={vx} y={vy + 2.5 * core + 14} fontSize={11.5} textAnchor="middle" fill="var(--c-dimred)">{locked ? "vortex" : "vortex · drag me"}</text>
              </g>
            );
          })()}

          {F.map((L, k) => {
            // live = draw the race in progress (slow speed, or boat 1 in slow motion); otherwise the last finished race
            const live = phase !== "idle" && phase !== "done" && ((speed === "slow" && !slowMo) || (slowMo && k === 0)) && L.cur.x.length >= 2;
            const tr = live ? L.cur : L.lastTrack;
            if (tr.x.length < 2) return null;
            const dim = focus !== null && focus !== k;
            const end = live ? "clock" : L.lastTrack.end;
            const hx = tr.x[tr.x.length - 1], hy = tr.y[tr.y.length - 1];
            return (
              <g key={k} opacity={dim ? 0.12 : 1} pointerEvents="none">
                <path d={trackPath(V, tr.x, tr.y)} fill="none" stroke={boatColor(k)} strokeWidth={focus === k ? 3 : 1.9}
                  strokeLinejoin="round" strokeDasharray={end === "out" ? "5 4" : undefined} opacity={end === "clock" && !live ? 0.55 : 0.95} />
                <BoatGlyph x={hx} y={hy} h={L.heading} wind={L.wind} color={boatColor(k)} v={V} size={focus === k ? 1.9 : 1.5} />
              </g>
            );
          })}

          {/* draggable mark */}
          <g style={{ cursor: locked ? "default" : "grab" }} onPointerDown={grab("mark")}>
            <circle cx={V.sx(cfg.markX)} cy={V.sy(cfg.markY)} r={ARRIVE * V.k} fill="color-mix(in srgb, var(--good) 12%, transparent)" stroke="var(--good)" strokeWidth={1.2} strokeDasharray="3 3" />
            <circle cx={V.sx(cfg.markX)} cy={V.sy(cfg.markY)} r={6} fill="var(--good)" />
            <text x={V.sx(cfg.markX) + ARRIVE * V.k + 4} y={V.sy(cfg.markY) - 6} fontSize={11.5} fill="var(--ink)" fontWeight={600}>{locked ? "mark" : "mark · drag me"}</text>
          </g>

          {/* draggable start */}
          <g style={{ cursor: locked ? "default" : "grab" }} onPointerDown={grab("start")}>
            <circle cx={sx0} cy={sy0} r={16} fill={locked ? "transparent" : "color-mix(in srgb, var(--ink) 8%, transparent)"} />
            <rect x={sx0 - 6} y={sy0 - 6} width={12} height={12} fill="var(--surface)" stroke="var(--ink)" strokeWidth={2} />
            <text x={sx0 + 12} y={sy0 + 16} fontSize={11.5} fill="var(--ink)">{locked ? "start" : "start · drag me"}</text>
          </g>

          {/* wind dial */}
          <g>
            <circle cx={DIAL.cx} cy={DIAL.cy} r={DIAL.rMax + 12} fill="var(--surface)" stroke="var(--border-strong)" opacity={0.92} />
            <path d={arc(DIAL.rMax)} fill="none" stroke="var(--c-regression)" strokeWidth={1} strokeDasharray="2 3" opacity={0.6} />
            <path d={arc(DIAL.rMin)} fill="none" stroke="var(--c-regression)" strokeWidth={1} strokeDasharray="2 3" opacity={0.6} />
            <line x1={tail.x} y1={tail.y} x2={head.x} y2={head.y} stroke="var(--c-regression)" strokeWidth={3} strokeLinecap="round" />
            <path d={`M${head.x},${head.y} L${head.x + 7 * Math.sin(windRad) - 6 * Math.cos(windRad)},${head.y - 7 * Math.cos(windRad) - 6 * Math.sin(windRad)} L${head.x + 7 * Math.sin(windRad) + 6 * Math.cos(windRad)},${head.y - 7 * Math.cos(windRad) + 6 * Math.sin(windRad)} Z`}
              fill="var(--c-regression)" />
            <circle cx={tail.x} cy={tail.y} r={8} fill="var(--c-regression)" stroke="var(--surface)" strokeWidth={2}
              style={{ cursor: locked ? "default" : "grab" }} onPointerDown={grab("wind")} />
            <text x={DIAL.cx} y={DIAL.cy + DIAL.rMax + 28} fontSize={11} textAnchor="middle" fill="var(--c-regression)">
              wind {cfg.windDir === 0 ? "0°" : `${cfg.windDir > 0 ? "+" : ""}${cfg.windDir}°`} · boat {cfg.windSpeed.toFixed(1)} m/s
            </text>
          </g>
        </svg>
        {!locked && (
          <div style={{ position: "absolute", right: 10, bottom: 10, fontSize: 11.5, color: "var(--muted)", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "4px 8px" }}>
            drag the start, the mark{cfg.vortex > 0 ? ", the vortex" : ""} · drag the wind handle round (direction) and in or out (strength)
          </div>
        )}
      </div>

      {/* ---- legend: one row per boat ---- */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(185px, 1fr))", gap: 6, marginTop: 8 }}>
        {F.map((L, k) => {
          const fin = L.recent.filter((e) => e === "arrived").length, out = L.recent.filter((e) => e === "out").length;
          const res = results?.[k];
          return (
            <button key={k} onMouseEnter={() => setFocus(k)} onMouseLeave={() => setFocus(null)} onFocus={() => setFocus(k)} onBlur={() => setFocus(null)}
              style={{ ...btn, textAlign: "left", padding: "5px 8px", borderColor: focus === k ? boatColor(k) : "var(--border)", cursor: "default" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                <span style={{ width: 11, height: 11, borderRadius: 3, background: boatColor(k), flexShrink: 0 }} />
                <strong style={{ color: "var(--ink)" }}>boat {k + 1}</strong>
                <span style={{ marginLeft: "auto", color: res ? "var(--ink)" : "var(--muted)", fontFamily: "ui-monospace, monospace", fontSize: 11.5 }}>
                  {res ? `test ${res.arrived}/200` : `${fin}✓ ${out}✕ /100`}
                </span>
              </div>
              <Spark curve={L.curve} total={Math.floor(cfg.races / 50)} color={boatColor(k)} />
            </button>
          );
        })}
      </div>
      <div style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 5, lineHeight: 1.5 }}>
        Each line is that boat&rsquo;s most recent practice race: solid and ending in a dot if it rounded the mark, dashed if it left the course,
        faded if the clock ran out. Hover a boat to pick it out. Under each name: rounded ✓ and left ✕ in its last 100 practice races, and
        its learning curve (share rounded per 50 races).
      </div>

      {/* ---- code + live update ---- */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, margin: "12px 0" }}>
        <pre style={{ ...codeBox, flex: "3 1 480px" }}>
          {CODE.map((line, i) => (
            <div key={i} style={{
              background: hot.includes(i) ? "color-mix(in srgb, var(--c-rl) 22%, transparent)" : phase === "running" && !slowMo && i >= 4 ? "color-mix(in srgb, var(--c-rl) 6%, transparent)" : "transparent",
              borderRadius: 3, padding: "0 4px",
            }}>{line}</div>
          ))}
          <div style={{ color: "var(--faint)", marginTop: 6, fontSize: 11 }}>
            {slowMo ? "slow motion: the highlighted line is the one being executed for boat 1" : phase === "running" ? `running flat out: the shaded loop is executing for ${cfg.boats} boat${cfg.boats > 1 ? "s" : ""}` : "the whole learner — nothing else is hidden"}
          </div>
        </pre>
        <div style={{ ...codeBox, flex: "2 1 250px", fontFamily: "var(--font-sans, sans-serif)", whiteSpace: "normal" }}>
          <div style={{ fontSize: 11, color: "var(--faint)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>boat 1, last update</div>
          {detail && slowMo ? <UpdateView d={detail} cfg={cfg} sub={sub} /> : (
            <div style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.55 }}>
              Switch on <strong>slow motion</strong> to watch boat 1 choose, act, compute its target and change one number in its table —
              then switch back to a speed to let the fleet run.
            </div>
          )}
        </div>
      </div>

      {phase === "done" && results && <Results results={results} cfg={cfg} seconds={elapsed.current / 1000} />}
    </div>
  );
}

function UpdateView({ d, cfg, sub }: { d: StepDetail; cfg: TrainConfig; sub: number }) {
  const row = (q: number[], hi: number) => q.map((x, i) => (
    <span key={i} style={{ display: "inline-block", minWidth: 54, marginRight: 4, padding: "1px 4px", borderRadius: 4, fontFamily: "ui-monospace, monospace", fontSize: 12, background: i === hi ? "color-mix(in srgb, var(--c-rl) 20%, transparent)" : "transparent" }}>{x.toFixed(3)}</span>
  ));
  const f = (x: number) => x.toFixed(3);
  const line = (onNow: boolean, children: React.ReactNode) => <div style={{ fontSize: 12.5, lineHeight: 1.6, opacity: onNow ? 1 : 0.35, transition: "opacity 0.2s" }}>{children}</div>;
  return (
    <div>
      {line(true, <>race {d.race + 1}, second {d.t} · cell <code>{d.s}</code> · ε = {d.eps.toFixed(3)}</>)}
      {line(sub >= 0, <>chose <strong>{ACTIONS[d.a]}</strong> ({d.explored ? "random: exploring" : "greedy: best in the table"})</>)}
      {line(sub >= 1, <>paid r = {f(d.r)}, landed in cell <code>{d.s2}</code>{d.terminated ? (d.arrived ? " — rounded the mark" : " — left the course") : d.truncated ? " — clock ran out" : ""}</>)}
      {line(sub >= 2, <>target = {d.terminated ? <>r = {f(d.target)}</> : <>{f(d.r)} + {cfg.gamma} × {f(d.maxNext)} = {f(d.target)}</>}</>)}
      {line(sub >= 3, <>Q[{d.s}, {d.a}]: {f(d.qBefore[d.a])} → <strong>{f(d.qAfter[d.a])}</strong></>)}
      <div style={{ marginTop: 6, fontSize: 11.5, color: "var(--faint)" }}>Q[{d.s}] = bear left · hold · bear right</div>
      <div>{row(sub >= 3 ? d.qAfter : d.qBefore, d.a)}</div>
    </div>
  );
}

function Results({ results, cfg, seconds }: { results: Evaluation[]; cfg: TrainConfig; seconds: number }) {
  const arr = results.map((r) => r.arrived);
  const mean = arr.reduce((p, q) => p + q, 0) / arr.length;
  const sd = Math.sqrt(arr.reduce((p, q) => p + (q - mean) ** 2, 0) / arr.length);
  const times = results.map((r) => r.meanTime).filter((x): x is number => x !== null);
  const beats = results.map((r) => r.beatAngle).filter((x): x is number => x !== null);
  const atLimit = cfg.races >= LIMITS.races || cfg.boats >= LIMITS.boats;
  return (
    <div style={{ marginTop: 14, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 15, color: "var(--ink)", marginBottom: 6 }}>
        The fleet, tested frozen on the same 200 held-out starts
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8 }}>
        <Stat label="rounded the mark, of 200" value={`${mean.toFixed(1)} ± ${sd.toFixed(1)}`} sub={arr.join(" · ")} />
        <Stat label="mean finishing time" value={times.length ? `${(times.reduce((p, q) => p + q, 0) / times.length).toFixed(1)} s` : "–"} sub="boats that finished" />
        <Stat label="left the course, of 200" value={(results.reduce((p, r) => p + r.left, 0) / results.length).toFixed(1)} sub="average per boat" />
        <Stat label="median beating angle" value={beats.length ? `${(beats.reduce((p, q) => p + q, 0) / beats.length).toFixed(1)}°` : "–"} sub="off the wind, while beating" />
      </div>
      <div style={{ marginTop: 10, padding: "10px 13px", borderRadius: 10, fontSize: 13, lineHeight: 1.55, color: "var(--muted)", background: "color-mix(in srgb, var(--c-rl) 7%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-rl) 25%, var(--border))" }}>
        {cfg.boats * cfg.races} practice races took {seconds.toFixed(1)} s of compute. The test starts from the same start point, in the same wind, with random headings.{" "}
        {atLimit
          ? <>That is the ceiling for this page: {LIMITS.boats} boats and {LIMITS.races} races each keep it responsive on an ordinary laptop. Longer runs, bigger tables and more seeds belong on your own machine — the Python on the earlier pages runs unchanged there.</>
          : <>You are below the page&rsquo;s ceiling ({LIMITS.boats} boats, {LIMITS.races} races each). Reset, raise the sliders and train again — or change one setting and compare.</>}
      </div>
    </div>
  );
}

function Spark({ curve, total, color }: { curve: number[]; total: number; color: string }) {
  const W = 160, H = 18;
  const n = Math.max(total, 1);
  const d = curve.map((c, i) => `${i ? "L" : "M"}${((i + 0.5) / n) * W},${H - 2 - c * (H - 4)}`).join("");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 18, display: "block", marginTop: 3 }} aria-label="share of practice races rounded, in blocks of 50">
      <line x1={0} x2={W} y1={H - 2} y2={H - 2} stroke="var(--border)" />
      <line x1={0} x2={W} y1={2} y2={2} stroke="var(--border)" strokeDasharray="2 3" />
      {curve.length > 0 && <path d={d} fill="none" stroke={color} strokeWidth={1.5} />}
    </svg>
  );
}

function Progress({ frac }: { frac: number }) {
  return (
    <div style={{ height: 4, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
      <div style={{ width: `${Math.min(100, frac * 100)}%`, height: "100%", background: "var(--c-rl)", transition: "width 0.2s" }} />
    </div>
  );
}

function Slider({ label, value, min, max, step, fmt, onChange, disabled }: {
  label: string; value: number; min: number; max: number; step: number; fmt: (x: number) => string; onChange: (x: number) => void; disabled: boolean;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", fontSize: 12, color: "var(--muted)", opacity: disabled ? 0.6 : 1 }}>
      <span>{label} <b style={{ color: "var(--ink)", fontFamily: "ui-monospace, monospace" }}>{fmt(value)}</b></span>
      <input type="range" min={min} max={max} step={step} value={value} disabled={disabled} onChange={(e) => onChange(Number(e.target.value))} style={{ accentColor: "var(--c-rl)" }} aria-label={label} />
    </label>
  );
}

function Pick({ label, value, options, onChange, disabled }: { label: string; value: string; options: [string, string][]; onChange: (x: string) => void; disabled: boolean }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 12, color: "var(--muted)", opacity: disabled ? 0.6 : 1 }}>
      {label}
      <select value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} style={{ ...btn, padding: "4px 6px" }}>
        {options.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
      </select>
    </label>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 9, padding: "7px 10px" }}>
      <div style={{ fontSize: 11, color: "var(--faint)" }}>{label}</div>
      <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 15, color: "var(--ink)" }}>{value}</div>
      <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "ui-monospace, monospace" }}>{sub}</div>
    </div>
  );
}

const box: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "0.4rem 0 1.6rem" };
const btn: React.CSSProperties = { borderWidth: 1, borderStyle: "solid", borderColor: "var(--border)", borderRadius: 7, cursor: "pointer", padding: "5px 11px", fontSize: 12.5, color: "var(--ink)", background: "transparent" };
const on: React.CSSProperties = { borderColor: "var(--c-rl)", background: "color-mix(in srgb, var(--c-rl) 15%, transparent)" };
const codeBox: React.CSSProperties = { margin: 0, background: "var(--canvas)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 12px", fontFamily: "ui-monospace, monospace", fontSize: 12, lineHeight: 1.6, overflowX: "auto", whiteSpace: "pre", color: "var(--ink)" };
