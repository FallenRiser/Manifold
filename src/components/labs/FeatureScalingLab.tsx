"use client";

import { useEffect, useRef, useState } from "react";

// Dataset: 3 features at very different scales
const RAW_UNSCALED = [
  [1500, 3, 8.5],
  [2200, 5, 7.2],
  [900, 1, 9.1],
  [3100, 7, 6.4],
  [1800, 4, 8.0],
  [2700, 6, 7.0],
  [1200, 2, 9.3],
  [2500, 5, 7.5],
];
// y: house price $k
const YS = [310, 450, 195, 590, 380, 510, 240, 480];
const N = RAW_UNSCALED.length;

type Mode = "unscaled" | "scaled";

// Build design matrices
function buildX(scale: boolean): number[][] {
  if (!scale) return RAW_UNSCALED.map(r => [1, ...r]);
  // Standardise each column
  const scaled = RAW_UNSCALED[0].map((_, col) => {
    const vals = RAW_UNSCALED.map(r => r[col]);
    const mean = vals.reduce((a, b) => a + b, 0) / N;
    const sd = Math.sqrt(vals.reduce((s, v) => s + (v - mean) ** 2, 0) / N);
    return vals.map(v => (v - mean) / sd);
  });
  return RAW_UNSCALED.map((_, i) => [1, scaled[0][i], scaled[1][i], scaled[2][i]]);
}

const XU = buildX(false);
const XS = buildX(true);

// Gradient and loss
function predict(theta: number[], x: number[]) { return x.reduce((s, v, i) => s + v * theta[i], 0); }
function loss(X: number[][], theta: number[]) {
  return X.reduce((s, x, i) => s + (predict(theta, x) - YS[i]) ** 2, 0) / N;
}
function grad(X: number[][], theta: number[]) {
  const g = Array(theta.length).fill(0);
  for (let i = 0; i < N; i++) {
    const e = predict(theta, X[i]) - YS[i];
    X[i].forEach((v, j) => { g[j] += 2 * e * v; });
  }
  return g.map(v => v / N);
}

const ALPHAS: Record<Mode, number> = { unscaled: 0.0000001, scaled: 0.12 };
const P = 4;

type RunState = { theta: number[]; losses: number[]; status: "idle" | "running" | "diverged" | "converged" };

export function FeatureScalingLab() {
  const [states, setStates] = useState<Record<Mode, RunState>>({
    unscaled: { theta: Array(P).fill(0), losses: [], status: "idle" },
    scaled: { theta: Array(P).fill(0), losses: [], status: "idle" },
  });
  const [running, setRunning] = useState(false);
  const stateRef = useRef(states);
  stateRef.current = states;

  function step(X: number[][], s: RunState, alpha: number): RunState {
    const g = grad(X, s.theta);
    const newTheta = s.theta.map((v, i) => v - alpha * g[i]);
    const L = loss(X, newTheta);
    const prevL = s.losses[s.losses.length - 1] ?? Infinity;
    const status: RunState["status"] =
      !isFinite(L) || L > 1e12 ? "diverged" :
      Math.abs(prevL - L) < 0.01 && s.losses.length > 10 ? "converged" :
      "running";
    return { theta: newTheta, losses: [...s.losses.slice(-199), L], status };
  }

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setStates(prev => {
        const ns = { ...prev };
        if (prev.unscaled.status === "running" || prev.unscaled.status === "idle") {
          ns.unscaled = step(XU, prev.unscaled, ALPHAS.unscaled);
          if (ns.unscaled.status === "idle") ns.unscaled = { ...ns.unscaled, status: "running" };
        }
        if (prev.scaled.status === "running" || prev.scaled.status === "idle") {
          ns.scaled = step(XS, prev.scaled, ALPHAS.scaled);
          if (ns.scaled.status === "idle") ns.scaled = { ...ns.scaled, status: "running" };
        }
        if (ns.unscaled.status !== "running" && ns.scaled.status !== "running") {
          setRunning(false);
        }
        return ns;
      });
    }, 50);
    return () => clearInterval(id);
  }, [running]);

  function reset() {
    setRunning(false);
    setStates({
      unscaled: { theta: Array(P).fill(0), losses: [], status: "idle" },
      scaled: { theta: Array(P).fill(0), losses: [], status: "idle" },
    });
  }

  // Loss curve chart
  const maxSteps = Math.max(states.unscaled.losses.length, states.scaled.losses.length, 1);
  const CW = 380, CH = 140, PL = 50, PR = 10, PT = 10, PB = 28;
  const W = CW - PL - PR, H = CH - PT - PB;

  function makePath(losses: number[], color: string, maxL: number, minL: number) {
    if (losses.length < 2) return null;
    const pts = losses.map((l, i) => {
      const x = PL + (i / (maxSteps - 1)) * W;
      const norm = maxL === minL ? 0.5 : (Math.min(l, maxL) - minL) / (maxL - minL);
      const y = PT + H - norm * H;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
    return <polyline key={color} points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />;
  }

  const allLosses = [
    ...states.unscaled.losses.filter(isFinite).slice(-100),
    ...states.scaled.losses.filter(isFinite),
  ];
  const minL = allLosses.length ? Math.min(...allLosses) : 0;
  const maxL = allLosses.length ? Math.min(Math.max(...allLosses), 1e6) : 1;

  // Y-ticks (log-spaced feel)
  const yTicks = [minL, (minL + maxL) / 2, maxL].map(v => Math.round(v));

  const statusColors: Record<string, string> = {
    converged: "var(--good)", diverged: "var(--bad)", running: "var(--warn)", idle: "var(--faint)",
  };

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, margin: "1.6rem 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <span className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
          Feature scaling — two runs, one difference
        </span>
        <div style={{ display: "flex", gap: 14 }}>
          <Legend color="var(--bad)" label="Unscaled (α=0.0000001)" />
          <Legend color="var(--good)" label="Standardised (α=0.12)" />
        </div>
      </div>

      {/* Feature scale comparison */}
      <div style={{ background: "var(--canvas)", borderRadius: 10, padding: "10px 14px", marginBottom: 14 }}>
        <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--faint)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
          Feature ranges
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {[
            { name: "sqft", min: 900, max: 3100, unit: "" },
            { name: "bedrooms", min: 1, max: 7, unit: "" },
            { name: "quality", min: 6.4, max: 9.3, unit: "/10" },
          ].map(f => (
            <div key={f.name} style={{ background: "var(--surface-2)", borderRadius: 8, padding: "8px 10px" }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: "var(--ink)", marginBottom: 4 }}>{f.name}</div>
              <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{f.min} – {f.max}{f.unit}</div>
              <div
                style={{
                  marginTop: 4, height: 5, borderRadius: 3,
                  background: `linear-gradient(90deg, var(--border-strong), var(--brand))`,
                  width: `${Math.min(100, (f.max - f.min) / 31)}%`,
                  minWidth: "20%",
                }}
              />
              <div style={{ fontSize: 10, color: "var(--faint)", marginTop: 3 }}>range: {f.max - f.min}{f.unit}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Loss curves */}
      <svg viewBox={`0 0 ${CW} ${CH}`} style={{ width: "100%", height: "auto", display: "block", marginBottom: 10 }}>
        <rect x={PL} y={PT} width={W} height={H} rx={6} fill="var(--canvas)" stroke="var(--border-strong)" />
        {yTicks.map((v, i) => {
          const y = PT + H - ((v - minL) / (maxL - minL + 0.001)) * H;
          return (
            <g key={i}>
              <line x1={PL} y1={y} x2={PL + W} y2={y} stroke="var(--border)" strokeWidth={0.6} />
              <text x={PL - 4} y={y + 3.5} fontSize={8} fill="var(--faint)" textAnchor="end">{v > 999 ? `${(v / 1000).toFixed(0)}k` : v.toFixed(0)}</text>
            </g>
          );
        })}
        {makePath(states.unscaled.losses, "var(--bad)", maxL, minL)}
        {makePath(states.scaled.losses, "var(--good)", maxL, minL)}
        <text x={PL + W / 2} y={CH - 2} fontSize={9} fill="var(--faint)" textAnchor="middle">steps →</text>
        <text x={12} y={PT + H / 2} fontSize={9} fill="var(--faint)" textAnchor="middle" transform={`rotate(-90 12 ${PT + H / 2})`}>MSE loss</text>
      </svg>

      {/* Status chips */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        {(["unscaled", "scaled"] as Mode[]).map(mode => {
          const s = states[mode];
          const lastL = s.losses[s.losses.length - 1];
          return (
            <div key={mode} style={{
              background: "var(--surface-2)", borderRadius: 10, padding: "8px 12px", fontSize: 12.5,
              border: `1px solid var(--border)`,
            }}>
              <div style={{ fontWeight: 500, color: mode === "scaled" ? "var(--good)" : "var(--bad)", marginBottom: 2 }}>
                {mode === "scaled" ? "Standardised" : "Unscaled"}
              </div>
              <div style={{ color: "var(--muted)" }}>α = {ALPHAS[mode]}</div>
              <div style={{ color: statusColors[s.status], fontWeight: 500, marginTop: 2 }}>
                {s.status} {lastL !== undefined && isFinite(lastL) ? `· loss=${lastL.toFixed(1)}` : ""}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => setRunning(r => !r)} style={btnPrimary}>{running ? "Pause" : "Run both"}</button>
        <button onClick={reset} style={btnGhost}>Reset</button>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color }}>
      <span style={{ width: 16, height: 3, background: color, borderRadius: 2, display: "inline-block" }} />
      {label}
    </span>
  );
}

const btnPrimary: React.CSSProperties = { background: "var(--cta)", color: "#fff", border: "none", fontSize: 13, fontWeight: 500, padding: "8px 18px", borderRadius: 10, cursor: "pointer" };
const btnGhost: React.CSSProperties = { background: "transparent", color: "var(--muted)", border: "1px solid var(--border-strong)", fontSize: 13, padding: "8px 14px", borderRadius: 10, cursor: "pointer" };
