"use client";

import { useState } from "react";

// The five stages, and the real build log of the sailboat drawn as the loops it actually took:
// every version was sent back from training to an earlier stage by one measurement.

const STAGES = [
  { name: "Plan", out: "a spec card" },
  { name: "Parameterise", out: "every constant, with a reason" },
  { name: "Code", out: "reset and step" },
  { name: "Test", out: "fails that should fail, a pass that must pass" },
  { name: "Train", out: "an agent, and a verdict on the world" },
];

const VERSIONS = [
  { tried: "A 100 m course; the table indexed by the boat's raw position and heading.", measured: "0 of 200 races finished, for every reward tried, at up to 3000 practice races.", bad: true, back: 0, why: "what the agent sees" },
  { tried: "See the mark relative to the boat: its bearing and a distance band.", measured: "12 of 200. The farthest band covered 80 m to infinity, so sailing away looked no worse than sailing toward the mark.", bad: true, back: 0, why: "where the course ends" },
  { tried: "Give the course an edge, three ways, crossed with two rewards, three training runs each.", measured: "−1 per step barely learned at this budget (0–2 of 200), and with a free edge it learned to leave. Distance gained: 158–196.", bad: true, back: 0, why: "what it is paid" },
  { tried: "Make it cheap enough to train live in your browser.", measured: "At 100 m, 2000 races scored worse than 1000 (143.4 vs 172.2). At 60 m: 175.8 ± 13.7 in about 4 s.", bad: false, back: 1, why: "course size and step size" },
  { tried: "Lock the 60 m version and re-run every earlier finding on it.", measured: "All held: the escape, the reward that barely learns at this budget, the speed-paid boat that circles. This ships.", bad: false, back: -1, why: "" },
];

export function PipelineLab() {
  const [v, setV] = useState(0);
  const W = 640, H = 200, bw = 112, gap = (W - 5 * bw) / 4, y = 86, bh = 76;
  const cx = (i: number) => i * (bw + gap) + bw / 2;
  const cur = VERSIONS[v];
  const target = cur.back;

  return (
    <div style={box}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 6 }}>
        <span style={head}>The sailboat&rsquo;s build log, as loops</span>
        <span style={{ display: "flex", gap: 5 }}>
          {VERSIONS.map((_, i) => (
            <button key={i} onClick={() => setV(i)} style={{ ...btn, ...(i === v ? { borderColor: "var(--c-rl)", background: "color-mix(in srgb, var(--c-rl) 16%, transparent)", color: "var(--ink)" } : {}) }}>
              version {i + 1}
            </button>
          ))}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }} role="img" aria-label="Five stages with the build loop for the selected version">
        <defs>
          <marker id="pipe-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="var(--c-rl)" />
          </marker>
        </defs>
        {STAGES.map((s, i) => {
          const hot = i === 4 || i === target;
          return (
            <g key={s.name}>
              <rect x={i * (bw + gap)} y={y} width={bw} height={bh} rx={10}
                fill={hot ? "color-mix(in srgb, var(--c-rl) 12%, var(--surface))" : "var(--surface)"}
                stroke={hot ? "var(--c-rl)" : "var(--border-strong)"} />
              <text x={cx(i)} y={y + 20} fontSize={10.5} textAnchor="middle" fill="var(--faint)" fontFamily="ui-monospace, monospace">stage {i + 1}</text>
              <text x={cx(i)} y={y + 40} fontSize={14} textAnchor="middle" fill="var(--ink)" fontWeight={600}>{s.name}</text>
              {i < 4 && <text x={i * (bw + gap) + bw + gap / 2} y={y + bh / 2 + 5} fontSize={14} textAnchor="middle" fill="var(--faint)">→</text>}
            </g>
          );
        })}
        {target >= 0 ? (
          <>
            <path d={`M${cx(4)},${y - 4} C${cx(4)},${y - 70} ${cx(target)},${y - 70} ${cx(target)},${y - 6}`}
              fill="none" stroke="var(--c-rl)" strokeWidth={2} markerEnd="url(#pipe-arrow)" />
            <text x={(cx(4) + cx(target)) / 2} y={y - 58} fontSize={12} textAnchor="middle" fill="var(--c-rl)">sent back: {cur.why}</text>
          </>
        ) : (
          <text x={cx(4)} y={y - 18} fontSize={12.5} textAnchor="middle" fill="var(--good)" fontWeight={600}>✓ ships</text>
        )}
        {STAGES.map((s, i) => (
          <text key={s.name + "o"} x={cx(i)} y={y + bh + 16} fontSize={10} textAnchor="middle" fill="var(--faint)">{s.out.length > 22 ? s.out.slice(0, 21) + "…" : s.out}</text>
        ))}
      </svg>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8, marginTop: 4 }}>
        <div style={card}><div style={lab}>what we tried</div>{cur.tried}</div>
        <div style={card}><div style={lab}>what training measured</div><span style={{ color: cur.bad ? "var(--bad)" : "var(--ink)" }}>{cur.measured}</span></div>
      </div>
    </div>
  );
}

const box: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.2rem 0 1.6rem" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)" };
const btn: React.CSSProperties = { borderWidth: 1, borderStyle: "solid", borderColor: "var(--border)", borderRadius: 7, cursor: "pointer", padding: "4px 9px", fontSize: 12, color: "var(--muted)", background: "transparent" };
const card: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: 10, padding: "9px 12px", fontSize: 13, color: "var(--ink)", lineHeight: 1.5 };
const lab: React.CSSProperties = { fontSize: 11, color: "var(--faint)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 };
