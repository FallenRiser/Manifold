"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const XS = [-1.5, -0.8, 0.0, 0.5, 1.2, 1.9];
const YS = [2.1, 3.4, 5.0, 5.8, 7.2, 8.1];
const N = XS.length;

function loss(m: number, b: number) {
  let s = 0;
  for (let i = 0; i < N; i++) s += (m * XS[i] + b - YS[i]) ** 2;
  return s / N;
}
function grad(m: number, b: number): [number, number] {
  let dm = 0, db = 0;
  for (let i = 0; i < N; i++) {
    const e = m * XS[i] + b - YS[i];
    dm += 2 * e * XS[i];
    db += 2 * e;
  }
  return [dm / N, db / N];
}

const START = { m: 0.2, b: 2.0 };
const CONFIGS = [
  { label: "Too small", alpha: 0.02, color: "var(--c-fundamentals)" },
  { label: "Just right", alpha: 0.18, color: "var(--good)" },
  { label: "Too large", alpha: 0.95, color: "var(--bad)" },
];
const MAX_STEPS = 60;

type RunState = { m: number; b: number; losses: number[]; status: "running" | "converged" | "diverged" };

function buildRun(alpha: number): RunState[] {
  const run: RunState[] = [{ m: START.m, b: START.b, losses: [loss(START.m, START.b)], status: "running" }];
  let cur = { ...START };
  for (let i = 0; i < MAX_STEPS; i++) {
    const [dm, db] = grad(cur.m, cur.b);
    const nm = cur.m - alpha * dm;
    const nb = cur.b - alpha * db;
    const L = loss(nm, nb);
    const prev = run[run.length - 1];
    const status: RunState["status"] = !isFinite(L) || L > 1000
      ? "diverged"
      : Math.hypot(dm, db) < 0.005
      ? "converged"
      : "running";
    run.push({ m: nm, b: nb, losses: [...prev.losses, L], status });
    cur = { m: nm, b: nb };
    if (status !== "running") break;
  }
  return run;
}

const RUNS = CONFIGS.map((c) => buildRun(c.alpha));
const ALL_LOSSES = RUNS.flatMap((r) => r.flatMap((s) => s.losses)).filter(isFinite);
const LOSS_MIN = Math.min(...ALL_LOSSES);
const LOSS_MAX = Math.min(Math.max(...ALL_LOSSES), 60); // cap for display

// Geometry
const CW = 400, CH = 200;
const PAD_L = 44, PAD_R = 16, PAD_T = 12, PAD_B = 28;
const W = CW - PAD_L - PAD_R;
const H = CH - PAD_T - PAD_B;

function lx(step: number, total: number) {
  return PAD_L + (step / Math.max(total - 1, 1)) * W;
}
function ly(l: number) {
  const clamped = Math.min(l, LOSS_MAX);
  return PAD_T + H - ((clamped - LOSS_MIN) / (LOSS_MAX - LOSS_MIN)) * H;
}

export function LearningRateLab() {
  const [frame, setFrame] = useState(1);
  const [playing, setPlaying] = useState(false);
  const rafRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frameRef = useRef(frame);
  frameRef.current = frame;

  const maxSteps = Math.max(...RUNS.map((r) => r.length));

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setFrame((f) => {
        if (f >= maxSteps) { setPlaying(false); return f; }
        return f + 1;
      });
    }, 55);
    return () => clearInterval(id);
  }, [playing, maxSteps]);

  // Paths
  const paths = RUNS.map((run, ri) => {
    const visible = run.slice(0, frame);
    const pts = visible
      .map((s, i) => `${lx(i, maxSteps).toFixed(1)},${ly(s.losses[s.losses.length - 1]).toFixed(1)}`)
      .join(" ");
    return { pts, run, config: CONFIGS[ri], last: visible[visible.length - 1] };
  });

  // Y axis ticks
  const yTicks = [0, 10, 20, 30, 40, 50, 60].filter((v) => v <= LOSS_MAX && v >= LOSS_MIN);

  // Data panel (current lines)
  const dpx = (x: number) => 44 + ((x - -2) / (4.2)) * 210;
  const dpy = (y: number) => 105 - ((y - 0) / 10) * 90;

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, margin: "1.6rem 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <span className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
          Three learning rates, three fates
        </span>
        <div style={{ display: "flex", gap: 12 }}>
          {CONFIGS.map((c) => (
            <span key={c.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: c.color, fontWeight: 500 }}>
              <span style={{ display: "inline-block", width: 18, height: 2.5, background: c.color, borderRadius: 2 }} />
              {c.label} (α={c.alpha})
            </span>
          ))}
        </div>
      </div>

      {/* Loss curves */}
      <svg viewBox={`0 0 ${CW} ${CH}`} style={{ width: "100%", height: "auto", display: "block", marginBottom: 12 }}>
        <rect x={PAD_L} y={PAD_T} width={W} height={H} rx={6} fill="var(--canvas)" stroke="var(--border-strong)" />

        {/* Y grid lines + labels */}
        {yTicks.map((v) => (
          <g key={v}>
            <line
              x1={PAD_L} y1={ly(v)}
              x2={PAD_L + W} y2={ly(v)}
              stroke="var(--border)" strokeWidth={0.7}
            />
            <text x={PAD_L - 4} y={ly(v) + 3.5} fontSize={8.5} fill="var(--faint)" textAnchor="end">{v}</text>
          </g>
        ))}

        {/* Loss paths */}
        {paths.map(({ pts, config, run, last }) => {
          const isDiverg = last?.status === "diverged";
          return (
            <g key={config.label}>
              <polyline
                points={pts}
                fill="none"
                stroke={config.color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeDasharray={isDiverg ? "3 2" : undefined}
              />
              {/* endpoint dot */}
              {last && (
                <circle
                  cx={lx(Math.min(frame, run.length) - 1, maxSteps)}
                  cy={Math.min(ly(last.losses[last.losses.length - 1]), PAD_T + H)}
                  r={3.5}
                  fill={config.color}
                />
              )}
            </g>
          );
        })}

        {/* Axis labels */}
        <text x={PAD_L + W / 2} y={CH - 2} fontSize={9} fill="var(--faint)" textAnchor="middle">steps →</text>
        <text x={12} y={PAD_T + H / 2} fontSize={9} fill="var(--faint)" textAnchor="middle" transform={`rotate(-90 12 ${PAD_T + H / 2})`}>loss</text>
      </svg>

      {/* Status badges */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        {paths.map(({ config, run }) => {
          const visible = run.slice(0, frame);
          const last = visible[visible.length - 1];
          const lossVal = last?.losses[last.losses.length - 1];
          const statusText =
            last?.status === "converged" ? `converged at step ${visible.length - 1}` :
            last?.status === "diverged" ? "diverged ✗" :
            `step ${visible.length - 1}, loss ${lossVal?.toFixed(2) ?? "…"}`;
          return (
            <div key={config.label} style={{
              background: `color-mix(in srgb, ${config.color} 8%, var(--surface-2))`,
              border: `1px solid color-mix(in srgb, ${config.color} 22%, var(--border))`,
              borderRadius: 10, padding: "7px 12px", fontSize: 12.5,
            }}>
              <div style={{ fontWeight: 500, color: config.color, marginBottom: 2 }}>{config.label}</div>
              <div style={{ color: "var(--muted)" }}>α = {config.alpha}</div>
              <div style={{ color: "var(--ink)" }}>{statusText}</div>
            </div>
          );
        })}
      </div>

      {/* Mini data panel showing current lines */}
      <div style={{ background: "var(--canvas)", border: "1px solid var(--border-strong)", borderRadius: 10, padding: "10px 12px", marginBottom: 14 }}>
        <div style={{ fontSize: 11.5, color: "var(--faint)", marginBottom: 6 }}>Current fitted line at this step</div>
        <svg viewBox="0 0 270 120" style={{ width: "100%", maxWidth: 340, height: "auto", display: "block" }}>
          <rect x={44} y={6} width={210} height={100} rx={6} fill="var(--surface)" stroke="var(--border-strong)" />
          {XS.map((x, i) => (
            <circle key={i} cx={dpx(x)} cy={dpy(YS[i])} r={3} fill="var(--c-regression)" />
          ))}
          {paths.map(({ config, run }) => {
            const visible = run.slice(0, frame);
            const last = visible[visible.length - 1];
            if (!last) return null;
            const { m, b } = last;
            return (
              <line
                key={config.label}
                x1={dpx(-2)} y1={dpy(m * -2 + b)}
                x2={dpx(2.3)} y2={dpy(m * 2.3 + b)}
                stroke={config.color} strokeWidth={2} strokeLinecap="round" strokeOpacity={0.85}
              />
            );
          })}
        </svg>
      </div>

      {/* Playback controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={() => { setFrame(1); setPlaying(true); }}
          style={btnPrimary}
        >Replay</button>
        <button
          onClick={() => setPlaying((p) => !p)}
          style={btnGhost}
        >{playing ? "Pause" : "Play"}</button>
        <input
          type="range" min={1} max={maxSteps} value={frame}
          onChange={(e) => { setPlaying(false); setFrame(parseInt(e.target.value)); }}
          style={{ flex: 1 }}
        />
        <span style={{ fontSize: 12, color: "var(--faint)", minWidth: 52, textAlign: "right" }}>
          step {frame - 1}/{maxSteps - 1}
        </span>
      </div>
    </div>
  );
}

const btnPrimary: React.CSSProperties = { background: "var(--cta)", color: "#fff", border: "none", fontSize: 13, fontWeight: 500, padding: "8px 18px", borderRadius: 10, cursor: "pointer" };
const btnGhost: React.CSSProperties = { background: "transparent", color: "var(--muted)", border: "1px solid var(--border-strong)", fontSize: 13, padding: "8px 14px", borderRadius: 10, cursor: "pointer" };
