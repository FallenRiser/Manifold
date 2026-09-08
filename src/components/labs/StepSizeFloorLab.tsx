"use client";

import { useMemo, useState } from "react";

// Why a constant step size never lands exactly on Vπ — the concrete face of the
// Robbins–Monro conditions. TD(0) on the 19-state random walk (Sutton Example 6.2):
// with a CONSTANT α, the error falls fast then stalls at a floor, hovering in a cloud
// around the true values because each update keeps injecting fresh noise. Bigger α =
// bigger floor. Verified steady-state RMS (mean of last 100 of 500 eps, 8 seeds):
// α=0.05→0.041, 0.10→0.075, 0.20→0.129, 0.40→0.232, 0.80→0.443. The floor does NOT
// shrink with more episodes — only a schedule that shrinks α can drive it to zero.

const ACCENT = "var(--c-rl)";
const NST = 19;
const TRUE = Array.from({ length: NST }, (_, i) => -1 + 2 * (i + 1) / (NST + 1));
const PRESETS = [0.05, 0.1, 0.2, 0.4, 0.8];

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rms = (V: number[]) => {
  let s = 0; for (let i = 0; i < NST; i++) s += (V[i] - TRUE[i]) ** 2; return Math.sqrt(s / NST);
};
// returns RMS after each episode
function runTD(alpha: number, episodes: number, seed: number) {
  const rng = mulberry32(seed);
  const V = new Array(NST).fill(0);
  const hist: number[] = [];
  for (let e = 0; e < episodes; e++) {
    let s = 9;
    while (true) {
      const ns = rng() < 0.5 ? s + 1 : s - 1;
      let r = 0, done = false, vns = 0;
      if (ns < 0) { r = -1; done = true; }
      else if (ns >= NST) { r = 1; done = true; }
      else vns = V[ns];
      V[s] += alpha * (r + vns - V[s]);
      if (done) break;
      s = ns;
    }
    hist.push(rms(V));
  }
  return hist;
}
const floorOf = (alpha: number, episodes = 500, seeds = 8) => {
  let acc = 0;
  for (let sd = 0; sd < seeds; sd++) {
    const h = runTD(alpha, episodes, sd);
    const tail = h.slice(-100);
    acc += tail.reduce((p, q) => p + q, 0) / tail.length;
  }
  return acc / seeds;
};

export function StepSizeFloorLab() {
  const [alpha, setAlpha] = useState(0.2);
  const curve = useMemo(() => runTD(alpha, 500, 0), [alpha]);
  const floors = useMemo(() => PRESETS.map((a) => ({ a, f: floorOf(a) })), []);
  const curFloor = useMemo(() => floorOf(alpha), [alpha]);

  const W = 360, H = 170, pl = 36, pb = 22, pt = 10, pr = 8;
  const plotW = W - pl - pr, plotH = H - pb - pt;
  const yHi = 0.55, EP = curve.length;
  const px = (i: number) => pl + plotW * (i / (EP - 1));
  const py = (v: number) => pt + plotH * (1 - Math.min(yHi, v) / yHi);
  const path = curve.map((v, i) => `${i === 0 ? "M" : "L"}${px(i).toFixed(1)},${py(v).toFixed(1)}`).join(" ");
  const maxFloor = Math.max(...floors.map((f) => f.f));

  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
        <span style={head}>The jitter floor of a constant step size</span>
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>TD(0) · 19-state random walk</span>
      </div>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "min(100%, 380px)", height: "auto" }}>
          <line x1={pl} y1={py(0)} x2={W - pr} y2={py(0)} stroke="var(--border)" />
          <line x1={pl} y1={pt} x2={pl} y2={py(0)} stroke="var(--border)" />
          {/* floor line */}
          <line x1={pl} y1={py(curFloor)} x2={W - pr} y2={py(curFloor)} stroke={ACCENT} strokeWidth={1} strokeDasharray="4 3" opacity={0.8} />
          <text x={W - pr} y={py(curFloor) - 3} textAnchor="end" fontSize={9} fill={ACCENT}>floor ≈ {curFloor.toFixed(3)}</text>
          <path d={path} fill="none" stroke="var(--ink)" strokeWidth={1.5} opacity={0.85} />
          <text x={pl - 5} y={pt + 4} textAnchor="end" fontSize={9} fill="var(--faint)">{yHi}</text>
          <text x={pl - 5} y={py(0)} textAnchor="end" fontSize={9} fill="var(--faint)">0</text>
          <text x={pl + plotW / 2} y={H - 4} textAnchor="middle" fontSize={9.5} fill="var(--faint)">episodes → 500</text>
          <text x={12} y={pt + plotH / 2} fontSize={9.5} fill="var(--faint)" transform={`rotate(-90 12 ${pt + plotH / 2})`} textAnchor="middle">RMS error</text>
        </svg>
      </div>

      <label style={sl}>
        <span style={{ minWidth: 88 }}>α: <b style={mono}>{alpha.toFixed(2)}</b></span>
        <input type="range" min={0.02} max={0.9} step={0.02} value={alpha}
          onChange={(e) => setAlpha(Number(e.target.value))} style={{ flex: 1, accentColor: ACCENT }} aria-label="step size alpha" />
      </label>

      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 11.5, color: "var(--muted)", marginBottom: 6 }}>steady-state floor vs α (bigger α → bigger floor):</div>
        {floors.map(({ a, f }) => {
          const on = Math.abs(a - alpha) < 0.03;
          return (
            <div key={a} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ width: 34, fontSize: 11, fontFamily: "ui-monospace, monospace", color: on ? ACCENT : "var(--muted)" }}>{a.toFixed(2)}</span>
              <div style={{ flex: 1, height: 13, background: "var(--canvas)", borderRadius: 3, border: "1px solid var(--border)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(f / maxFloor) * 100}%`, background: on ? ACCENT : `color-mix(in srgb, ${ACCENT} 38%, var(--canvas))` }} />
              </div>
              <span style={{ width: 40, fontSize: 11, fontFamily: "ui-monospace, monospace", color: "var(--muted)" }}>{f.toFixed(3)}</span>
            </div>
          );
        })}
      </div>

      <div style={caption}>
        Every constant-α run does the same thing: error plunges, then <em>stalls</em> at a floor and jitters there
        forever. That floor is the price of never turning the step size down — each update keeps mixing in fresh noise
        from the sampled reward and next state, so <M>V</M> hovers in a cloud around <M>Vπ</M> instead of settling on it.
        Slide α up and the cloud widens (the dashed floor and the bars both rise); slide it down and the floor shrinks
        but the descent slows. This is exactly why the Robbins&ndash;Monro conditions demand a step size that{" "}
        <em>shrinks</em>: large enough for long enough to arrive (<M>Σα = ∞</M>), then small enough to silence the noise
        and actually land (<M>Σα² &lt; ∞</M>). A constant α satisfies neither.
      </div>
    </div>
  );
}

function M({ children }: { children: string }) {
  return <span style={{ fontStyle: "italic", fontFamily: "var(--font-serif, Georgia, serif)" }}>{children}</span>;
}

const wrap: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, margin: "1.6rem 0" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)" };
const caption: React.CSSProperties = { fontSize: 12.5, color: "var(--muted)", marginTop: 12, lineHeight: 1.55 };
const sl: React.CSSProperties = { display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "var(--muted)", marginTop: 10 };
const mono: React.CSSProperties = { color: "var(--ink)", fontFamily: "ui-monospace, monospace" };
