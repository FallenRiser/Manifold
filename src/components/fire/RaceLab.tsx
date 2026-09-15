"use client";

import { useMemo, useState } from "react";
import { RACE_RUNS, BAR, type RaceRun } from "./data/raceCurves";

// The same six training runs, plotted twice. Every point is a held-out probe on worlds from the
// exam block, recorded with both the simulator steps and the wall-clock minutes it had cost by then.
// Nothing was ever selected on these probes -- no early stopping, no checkpoint picking -- so the
// only thing the axis toggle changes is what a "budget" is bought with.

const W = 640, H = 300, PL = 46, PR = 14, PT = 14, PB = 34;
const COL = { DQN: "var(--c-rl)", PPO: "var(--c-regression)" } as const;

type Axis = "sim" | "min";
type Metric = "village" | "burnt";

const METRIC = {
  village: { label: "village cells lost", key: "village" as const, bar: BAR.guard.village, bar2: BAR.nearest.village, dp: 2 },
  burnt: { label: "cells burnt", key: "burnt" as const, bar: BAR.guard.burnt, bar2: BAR.nearest.burnt, dp: 0 },
};

/** Where a run stands after exactly `x` of whatever the axis counts. Linear between probes;
 *  null once the run has stopped, because a finished run has no later value to report. */
function at(run: RaceRun, axis: Axis, x: number, key: Metric): number | null {
  const pts = run.points;
  const ax = (p: (typeof pts)[number]) => (axis === "sim" ? p.sim : p.min);
  if (!pts.length || x < ax(pts[0])) return null;
  if (x > ax(pts[pts.length - 1])) return null;
  for (let i = 1; i < pts.length; i++) {
    if (x <= ax(pts[i])) {
      const t = (x - ax(pts[i - 1])) / Math.max(ax(pts[i]) - ax(pts[i - 1]), 1e-9);
      return pts[i - 1][key] + t * (pts[i][key] - pts[i - 1][key]);
    }
  }
  return pts[pts.length - 1][key];
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

export function RaceLab() {
  const [axis, setAxis] = useState<Axis>("sim");
  const [metric, setMetric] = useState<Metric>("village");
  const [frac, setFrac] = useState(0.5);

  const M = METRIC[metric];
  const xMax = useMemo(
    () => Math.max(1, ...RACE_RUNS.map((r) => (axis === "sim" ? r.points[r.points.length - 1].sim : r.points[r.points.length - 1].min))),
    [axis],
  );
  const yLo = metric === "village" ? 0 : 60;
  const yHi = useMemo(() => {
    const v = RACE_RUNS.flatMap((r) => r.points.map((p) => p[M.key]));
    return Math.max(...v, M.bar2, M.bar) * 1.04;
  }, [metric, M.bar, M.bar2, M.key]);

  const px = (x: number) => PL + (x / xMax) * (W - PL - PR);
  const py = (y: number) => PT + (1 - (y - yLo) / (yHi - yLo)) * (H - PT - PB);
  const cursor = frac * xMax;

  const now = (learner: "DQN" | "PPO") => {
    const vs = RACE_RUNS.filter((r) => r.learner === learner)
      .map((r) => at(r, axis, cursor, M.key))
      .filter((v): v is number => v !== null);
    return vs.length ? { m: mean(vs), n: vs.length, lo: Math.min(...vs), hi: Math.max(...vs) } : null;
  };
  const d = now("DQN"), p = now("PPO");
  const fmt = (x: number) => x.toFixed(M.dp);
  const xLabel = axis === "sim" ? "simulator steps" : "minutes of training";
  const cursorLabel = axis === "sim" ? `${(cursor / 1e6).toFixed(2)}M steps` : `${cursor.toFixed(1)} min`;

  const ticks = useMemo(() => {
    const n = 4, out: number[] = [];
    for (let i = 0; i <= n; i++) out.push((i / n) * xMax);
    return out;
  }, [xMax]);

  return (
    <div style={box}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
        <span style={head}>Same runs, two bottom axes</span>
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>held-out probes · 3 seeds each · nothing selected on them</span>
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 10 }}>
        <Chips label="a budget is" value={axis} set={setAxis}
          opts={[["sim", "simulator steps"], ["min", "minutes"]]} />
        <Chips label="scored on" value={metric} set={setMetric}
          opts={[["village", "village lost"], ["burnt", "cells burnt"]]} />
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const x = ((e.clientX - r.left) / r.width) * W;
          setFrac(Math.min(1, Math.max(0, (x - PL) / (W - PL - PR))));
        }}>
        <line x1={PL} y1={py(yLo)} x2={W - PR} y2={py(yLo)} stroke="var(--border)" />
        <line x1={PL} y1={PT} x2={PL} y2={py(yLo)} stroke="var(--border)" />

        {[M.bar, M.bar2].map((b, i) => (
          <g key={i}>
            <line x1={PL} y1={py(b)} x2={W - PR} y2={py(b)} stroke="var(--faint)" strokeDasharray="3 4" strokeWidth={1} />
            <text x={W - PR} y={py(b) - 4} textAnchor="end" fontSize={10} fill="var(--faint)">
              {i === 0 ? "guard" : "nearest"} {fmt(b)}
            </text>
          </g>
        ))}

        {ticks.map((t, i) => (
          <text key={i} x={px(t)} y={H - 12} textAnchor="middle" fontSize={10.5} fill="var(--muted)">
            {axis === "sim" ? `${(t / 1e6).toFixed(1)}M` : `${t.toFixed(0)}`}
          </text>
        ))}
        <text x={(PL + W - PR) / 2} y={H - 1} textAnchor="middle" fontSize={10.5} fill="var(--faint)">{xLabel}</text>
        {[yLo, (yLo + yHi) / 2, yHi].map((v, i) => (
          <text key={i} x={PL - 7} y={py(v) + 3.5} textAnchor="end" fontSize={10.5} fill="var(--muted)">{fmt(v)}</text>
        ))}
        <text x={12} y={PT + 8} fontSize={10.5} fill="var(--faint)">{M.label}</text>

        {RACE_RUNS.map((r, i) => (
          <polyline key={i} fill="none" stroke={COL[r.learner]} strokeWidth={1.4} strokeOpacity={0.62}
            strokeLinejoin="round"
            points={r.points.map((pt) => `${px(axis === "sim" ? pt.sim : pt.min)},${py(pt[M.key])}`).join(" ")} />
        ))}

        <line x1={px(cursor)} y1={PT} x2={px(cursor)} y2={py(yLo)} stroke="var(--ink)" strokeWidth={1.2} strokeOpacity={0.55} />
        {(["DQN", "PPO"] as const).map((l) => {
          const v = now(l);
          return v === null ? null : (
            <circle key={l} cx={px(cursor)} cy={py(v.m)} r={4} fill={COL[l]} stroke="var(--bg)" strokeWidth={1.5} />
          );
        })}
      </svg>

      <input type="range" min={0} max={1} step={0.002} value={frac}
        onChange={(e) => setFrac(Number(e.target.value))}
        aria-label={`budget along the ${xLabel} axis`}
        style={{ width: "100%", margin: "6px 0 10px", accentColor: "var(--c-rl)" }} />

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {(["DQN", "PPO"] as const).map((l) => {
          const v = now(l);
          return (
            <div key={l} style={{ ...card, borderColor: COL[l] }}>
              <div style={{ fontSize: 11.5, color: COL[l], fontWeight: 600, letterSpacing: 0.3 }}>{l}</div>
              <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 19, marginTop: 2 }}>
                {v ? fmt(v.m) : "—"}
              </div>
              <div style={{ fontSize: 11, color: "var(--faint)" }}>
                {v ? `${fmt(v.lo)}–${fmt(v.hi)} over ${v.n} seed${v.n > 1 ? "s" : ""}` : "this run had already finished"}
              </div>
            </div>
          );
        })}
      </div>

      <p style={{ fontSize: 13, color: "var(--muted)", margin: "10px 0 0", lineHeight: 1.55 }}>
        After <strong>{cursorLabel}</strong>:{" "}
        {d && p ? (
          Math.abs(d.m - p.m) < 0.05 * (yHi - yLo) / 6
            ? <>the two are level, and the gap is smaller than the ±0.35 a single 200-world score carries anyway.</>
            : <><strong style={{ color: COL[d.m < p.m ? "DQN" : "PPO"] }}>{d.m < p.m ? "DQN" : "PPO"}</strong> is ahead
              by {fmt(Math.abs(d.m - p.m))} {metric === "village" ? "village cells" : "cells burnt"}.</>
        ) : (
          <>only one of the two is still running — the other spent its whole budget before this point on this axis.</>
        )}{" "}
        Switch the axis and the same six runs are replotted against what they cost in time instead of in fire.
      </p>
    </div>
  );
}

function Chips<T extends string>({ label, value, set, opts }: {
  label: string; value: T; set: (v: T) => void; opts: [T, string][];
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
      <span style={{ fontSize: 11.5, color: "var(--faint)" }}>{label}</span>
      {opts.map(([v, lab]) => (
        <button key={v} onClick={() => set(v)} style={{
          ...chip,
          background: value === v ? "var(--ink)" : "transparent",
          color: value === v ? "var(--bg)" : "var(--muted)",
          borderColor: value === v ? "var(--ink)" : "var(--border)",
        }}>{lab}</button>
      ))}
    </div>
  );
}

const box: React.CSSProperties = {
  border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px 16px", background: "var(--surface)",
};
const head: React.CSSProperties = { fontSize: 13.5, fontWeight: 600, color: "var(--ink)" };
const chip: React.CSSProperties = {
  fontSize: 11.5, padding: "3px 9px", borderRadius: 999, border: "1px solid var(--border)", cursor: "pointer",
};
const card: React.CSSProperties = {
  border: "1px solid", borderRadius: 8, padding: "7px 12px", minWidth: 118, background: "var(--bg)",
};
