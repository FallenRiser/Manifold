"use client";

import { useState } from "react";

// The conceptual spine of the whole family, made visual. Sutton's "unified view":
// every value-backup is a point on two axes — WIDTH (sample one branch vs take the
// full expectation over all branches) and DEPTH (bootstrap after one step vs run the
// full return to the end of the episode). The four corners are exactly TD, dynamic
// programming, Monte Carlo, and exhaustive search. Toggle the two axes and the
// diagram + the named method + its properties change together. No RNG: this is a
// diagram you reason with, not a simulation.

const ACCENT = "var(--c-rl)";
const MUTED = "var(--muted)";

type Corner = {
  name: string; blurb: string;
  bootstraps: boolean; fullWidth: boolean; needsModel: boolean;
  bias: string; variance: string;
};
function classify(expected: boolean, deep: boolean): Corner {
  if (!expected && !deep) return {
    name: "TD(0) / SARSA", bootstraps: true, fullWidth: false, needsModel: false,
    blurb: "Sample one action and one transition, then bootstrap off your current estimate of the next state. One cheap step; learns online.",
    bias: "biased (uses an estimate)", variance: "low",
  };
  if (expected && !deep) return {
    name: "Dynamic programming (Bellman backup)", bootstraps: true, fullWidth: true, needsModel: true,
    blurb: "Average over ALL actions and ALL next states — the full one-step expectation — then bootstrap. Needs the model P, R. (Expected SARSA is its model-free cousin: expected over actions, sampled transition.)",
    bias: "exact expectation", variance: "none (no sampling)",
  };
  if (!expected && deep) return {
    name: "Monte Carlo", bootstraps: false, fullWidth: false, needsModel: false,
    blurb: "Sample one whole trajectory to the end of the episode and average the actual return. No bootstrapping at all — the target is real reward.",
    bias: "unbiased", variance: "high (a full return)",
  };
  return {
    name: "Exhaustive search / full-width DP to the leaves", bootstraps: false, fullWidth: true, needsModel: true,
    blurb: "Expand every action and every transition, all the way to terminal states. Exact, but the tree explodes — only ever feasible on tiny problems.",
    bias: "exact", variance: "none — but intractable",
  };
}

function Node({ x, y, kind, active }: { x: number; y: number; kind: "state" | "action" | "terminal"; active: boolean }) {
  const col = active ? ACCENT : "var(--border-strong, var(--muted))";
  if (kind === "action") return <circle cx={x} cy={y} r={5} fill={col} />;
  if (kind === "terminal") return <rect x={x - 6} y={y - 6} width={12} height={12} fill={col} />;
  return <circle cx={x} cy={y} r={8} fill="var(--surface)" stroke={col} strokeWidth={2} />;
}

export function BackupDiagramLab() {
  const [expected, setExpected] = useState(false);
  const [deep, setDeep] = useState(false);
  const c = classify(expected, deep);

  const W = 340, H = 232;
  const rootX = 170, rootY = 24;
  const actY = 74, nextY = 126;
  const actXs = expected ? [96, 170, 244] : [170];
  const branchesOf = (ax: number) => (expected ? [ax - 22, ax + 22] : [ax]);
  const edge = (x1: number, y1: number, x2: number, y2: number, active: boolean, dash = false) => (
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={active ? ACCENT : "var(--border)"} strokeWidth={active ? 2 : 1.2}
      strokeDasharray={dash ? "3 3" : undefined} />
  );

  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
        <span style={head}>The backup-diagram dial</span>
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>width × depth = every method</span>
      </div>

      {/* two axis toggles */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 8 }}>
        <div>
          <div style={axisLabel}>WIDTH of the backup</div>
          <div style={{ display: "flex", gap: 6 }}>
            <Seg on={!expected} onClick={() => setExpected(false)}>Sample</Seg>
            <Seg on={expected} onClick={() => setExpected(true)}>Expected (full)</Seg>
          </div>
        </div>
        <div>
          <div style={axisLabel}>DEPTH of the backup</div>
          <div style={{ display: "flex", gap: 6 }}>
            <Seg on={!deep} onClick={() => setDeep(false)}>One step (bootstrap)</Seg>
            <Seg on={deep} onClick={() => setDeep(true)}>Full return</Seg>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "min(100%, 340px)", height: "auto" }}>
          <Node x={rootX} y={rootY} kind="state" active />
          <text x={rootX + 14} y={rootY + 4} fontSize={11} fill={MUTED}>s</text>

          {actXs.map((ax, ai) => (
            <g key={ai}>
              {edge(rootX, rootY + 8, ax, actY - 5, true)}
              <Node x={ax} y={actY} kind="action" active={!expected || ai === 1} />
              {branchesOf(ax).map((nx, ni) => {
                const active = !expected && !deep ? true : true;
                return (
                  <g key={ni}>
                    {edge(ax, actY + 5, nx, nextY - 8, active)}
                    <Node x={nx} y={nextY} kind="state" active={active} />
                    {!deep ? (
                      // bootstrap cap
                      <g>
                        <rect x={nx - 12} y={nextY + 12} width={24} height={15} rx={3}
                          fill={`color-mix(in srgb, ${ACCENT} 14%, var(--surface))`} stroke={ACCENT} strokeWidth={1} />
                        <text x={nx} y={nextY + 23} textAnchor="middle" fontSize={9} fill={ACCENT}>V̂</text>
                      </g>
                    ) : (
                      // continue to terminal
                      <g>
                        {edge(nx, nextY + 8, nx, nextY + 30, active, true)}
                        <text x={nx} y={nextY + 26} textAnchor="middle" fontSize={11} fill={MUTED}>⋮</text>
                        <Node x={nx} y={nextY + 44} kind="terminal" active={active} />
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          ))}

          <text x={8} y={H - 6} fontSize={10} fill="var(--faint)">
            {deep ? "backup runs to the terminal (□)" : "backup stops after one step, capped by an estimate"}
          </text>
        </svg>
      </div>

      <div style={{ ...panel, borderColor: `color-mix(in srgb, ${ACCENT} 34%, var(--border))` }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 14, color: ACCENT, marginBottom: 4 }}>{c.name}</div>
        <div style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.55 }}>{c.blurb}</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 9 }}>
          <Chip>{c.bootstraps ? "bootstraps ✓" : "no bootstrap"}</Chip>
          <Chip>{c.fullWidth ? "full-width" : "sampled width"}</Chip>
          <Chip>{c.needsModel ? "needs a model" : "model-free"}</Chip>
          <Chip>bias: {c.bias}</Chip>
          <Chip>variance: {c.variance}</Chip>
        </div>
      </div>

      <div style={caption}>
        Two independent choices generate the entire zoo. Go <strong>wider</strong> (right) and you replace a single
        sampled branch with the full expectation — exact, but it costs a model. Go <strong>deeper</strong> (down) and you
        replace the bootstrapped estimate with more real reward — less biased, but higher variance. The four corners are
        the landmarks: <b style={{ color: ACCENT }}>TD</b> (shallow, sampled), <b style={{ color: ACCENT }}>Monte
        Carlo</b> (deep, sampled), <b style={{ color: ACCENT }}>dynamic programming</b> (shallow, full), and exhaustive
        search (deep, full). Everything else — n-step returns, TD(λ), Expected SARSA — lives <em>between</em> these
        corners.
      </div>
    </div>
  );
}

function Seg({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      border: `1px solid ${on ? ACCENT : "var(--border)"}`, borderRadius: 7, cursor: "pointer",
      padding: "5px 11px", fontSize: 12, fontFamily: "var(--font-sans, sans-serif)",
      color: on ? ACCENT : "var(--muted)", fontWeight: on ? 600 : 400,
      background: on ? `color-mix(in srgb, ${ACCENT} 12%, transparent)` : "transparent",
    }}>{children}</button>
  );
}
function Chip({ children }: { children: React.ReactNode }) {
  return <span style={{ fontSize: 11, color: "var(--muted)", background: "var(--canvas)", border: "1px solid var(--border)", borderRadius: 20, padding: "2px 9px" }}>{children}</span>;
}

const wrap: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, margin: "1.6rem 0" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)" };
const caption: React.CSSProperties = { fontSize: 12.5, color: "var(--muted)", marginTop: 12, lineHeight: 1.55 };
const panel: React.CSSProperties = { background: "var(--canvas)", border: "1px solid var(--border)", borderRadius: 10, padding: "11px 13px", marginTop: 10 };
const axisLabel: React.CSSProperties = { fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "var(--faint)", marginBottom: 5 };
