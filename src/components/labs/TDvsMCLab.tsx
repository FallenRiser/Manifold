"use client";

import { useCallback, useMemo, useRef, useState } from "react";

// TD(0) vs constant-alpha Monte Carlo on Sutton & Barto's 5-state random walk
// (Example 6.2). Both methods learn from the SAME stream of episodes, so the reader
// watches, side by side, TD's estimates slide smoothly onto the true values while MC
// lurches and jitters. The true values are 1/6..5/6; both start at 0.5. Reproduces
// the page's numbers: at ~100 episodes TD's RMS (~0.04-0.05) sits well below MC's
// (~0.08-0.09). A shared step size keeps the comparison honest.

const ACCENT = "var(--c-rl)";          // TD
const MC_COL = "#c0392b";              // MC
const NAMES = ["A", "B", "C", "D", "E"];
const TRUE = [1 / 6, 2 / 6, 3 / 6, 4 / 6, 5 / 6];

// small deterministic RNG so a given run is reproducible across renders
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rms = (V: number[]) =>
  Math.sqrt(V.reduce((acc, v, i) => acc + (v - TRUE[i]) ** 2, 0) / 5);

type State = {
  td: number[];
  mc: number[];
  episodes: number;
  histTd: number[];
  histMc: number[];
};

const fresh = (): State => ({
  td: [0.5, 0.5, 0.5, 0.5, 0.5],
  mc: [0.5, 0.5, 0.5, 0.5, 0.5],
  episodes: 0,
  histTd: [rms([0.5, 0.5, 0.5, 0.5, 0.5])],
  histMc: [rms([0.5, 0.5, 0.5, 0.5, 0.5])],
});

export function TDvsMCLab() {
  const [alpha, setAlpha] = useState(0.1);
  const [st, setSt] = useState<State>(fresh);
  const rngRef = useRef(mulberry32(12345));

  const runEpisodes = useCallback(
    (count: number) => {
      setSt((prev) => {
        const td = prev.td.slice();
        const mc = prev.mc.slice();
        const histTd = prev.histTd.slice();
        const histMc = prev.histMc.slice();
        const rng = rngRef.current;
        // value index: state i in 0..4 maps to walk position i+1 in 1..5; 0 and 6 terminal
        const val = (pos: number, V: number[]) => (pos <= 0 || pos >= 6 ? 0 : V[pos - 1]);
        for (let e = 0; e < count; e++) {
          // generate one episode of the random walk from the centre (pos 3)
          let pos = 3;
          const traj: { pos: number; r: number; next: number }[] = [];
          while (pos > 0 && pos < 6) {
            const next = pos + (rng() < 0.5 ? -1 : 1);
            const r = next === 6 ? 1 : 0;
            traj.push({ pos, r, next });
            // TD(0): update immediately, bootstrapping off the next state's value
            td[pos - 1] += alpha * (r + val(next, td) - td[pos - 1]);
            pos = next;
          }
          // constant-alpha MC: after the episode, nudge each visited state toward the return
          let G = 0;
          for (let t = traj.length - 1; t >= 0; t--) {
            G = traj[t].r + G; // gamma = 1
            const i = traj[t].pos - 1;
            mc[i] += alpha * (G - mc[i]);
          }
          histTd.push(rms(td));
          histMc.push(rms(mc));
        }
        return { td, mc, episodes: prev.episodes + count, histTd, histMc };
      });
    },
    [alpha],
  );

  const reset = useCallback(() => {
    rngRef.current = mulberry32(12345);
    setSt(fresh());
  }, []);

  const rmsTd = st.histTd[st.histTd.length - 1];
  const rmsMc = st.histMc[st.histMc.length - 1];

  // ---- bar chart geometry ----
  const W = 320, H = 150, padL = 26, padB = 22, padT = 8;
  const plotW = W - padL - 8, plotH = H - padB - padT;
  const yb = (v: number) => padT + plotH * (1 - v); // values in [0,1]
  const groupW = plotW / 5;

  // ---- rms line chart ----
  const LW = 320, LH = 120, lpadL = 30, lpadB = 20, lpadT = 8;
  const lplotW = LW - lpadL - 8, lplotH = LH - lpadB - lpadT;
  const maxEp = Math.max(20, st.episodes);
  const yMax = 0.55;
  const lx = (i: number) => lpadL + lplotW * (i / maxEp);
  const ly = (v: number) => lpadT + lplotH * (1 - Math.min(v, yMax) / yMax);
  const path = (h: number[]) =>
    h.map((v, i) => `${i === 0 ? "M" : "L"}${lx(i).toFixed(1)},${ly(v).toFixed(1)}`).join(" ");

  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 6 }}>
        <span style={head}>TD(0) vs Monte Carlo — the 5-state random walk</span>
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>{st.episodes} episodes</span>
      </div>

      <div style={{ display: "flex", gap: 18, flexWrap: "wrap", justifyContent: "center" }}>
        {/* value bars vs truth */}
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "min(100%, 340px)", height: "auto" }}>
          <line x1={padL} y1={yb(0)} x2={W - 8} y2={yb(0)} stroke="var(--border)" />
          {NAMES.map((nm, i) => {
            const gx = padL + groupW * i;
            const bw = groupW * 0.3;
            return (
              <g key={nm}>
                <rect x={gx + groupW * 0.12} y={yb(st.td[i])} width={bw} height={yb(0) - yb(st.td[i])} fill={ACCENT} opacity={0.9} rx={1.5} />
                <rect x={gx + groupW * 0.12 + bw + 2} y={yb(st.mc[i])} width={bw} height={yb(0) - yb(st.mc[i])} fill={MC_COL} opacity={0.85} rx={1.5} />
                {/* true value marker */}
                <line x1={gx + groupW * 0.1} y1={yb(TRUE[i])} x2={gx + groupW * 0.1 + 2 * bw + 4} y2={yb(TRUE[i])}
                  stroke="var(--ink)" strokeWidth={1.5} strokeDasharray="3 2" />
                <text x={gx + groupW / 2} y={H - 8} textAnchor="middle" fontSize={10} fill="var(--muted)" fontFamily="ui-monospace, monospace">{nm}</text>
              </g>
            );
          })}
          <text x={padL - 4} y={yb(1) + 3} textAnchor="end" fontSize={9} fill="var(--faint)">1</text>
          <text x={padL - 4} y={yb(0.5) + 3} textAnchor="end" fontSize={9} fill="var(--faint)">.5</text>
          <text x={padL - 4} y={yb(0) + 3} textAnchor="end" fontSize={9} fill="var(--faint)">0</text>
          <text x={W / 2} y={padT + 2} textAnchor="middle" fontSize={9.5} fill="var(--faint)">estimated value (dashed = true)</text>
        </svg>

        {/* rms over episodes */}
        <svg viewBox={`0 0 ${LW} ${LH}`} style={{ width: "min(100%, 340px)", height: "auto" }}>
          <line x1={lpadL} y1={ly(0)} x2={LW - 8} y2={ly(0)} stroke="var(--border)" />
          <line x1={lpadL} y1={lpadT} x2={lpadL} y2={ly(0)} stroke="var(--border)" />
          {st.histMc.length > 1 && <path d={path(st.histMc)} fill="none" stroke={MC_COL} strokeWidth={1.6} />}
          {st.histTd.length > 1 && <path d={path(st.histTd)} fill="none" stroke={ACCENT} strokeWidth={1.6} />}
          <text x={lpadL - 4} y={ly(0.5) + 3} textAnchor="end" fontSize={9} fill="var(--faint)">.5</text>
          <text x={lpadL - 4} y={ly(0) + 3} textAnchor="end" fontSize={9} fill="var(--faint)">0</text>
          <text x={LW / 2} y={lpadT + 2} textAnchor="middle" fontSize={9.5} fill="var(--faint)">RMS error vs episodes</text>
        </svg>
      </div>

      <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 4, fontSize: 12 }}>
        <span style={{ color: ACCENT }}>■ TD(0) &nbsp;RMS {rmsTd.toFixed(3)}</span>
        <span style={{ color: MC_COL }}>■ Monte Carlo &nbsp;RMS {rmsMc.toFixed(3)}</span>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10, alignItems: "center", justifyContent: "center" }}>
        <button style={{ ...btn, borderColor: ACCENT, background: `color-mix(in srgb, ${ACCENT} 16%, transparent)` }} onClick={() => runEpisodes(1)}>+1 episode</button>
        <button style={btn} onClick={() => runEpisodes(10)}>+10</button>
        <button style={btn} onClick={() => runEpisodes(100)}>+100</button>
        <button style={btn} onClick={reset}>Reset</button>
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "var(--muted)", marginTop: 10 }}>
        <span style={{ minWidth: 96 }}>α: <b style={{ color: "var(--ink)", fontFamily: "ui-monospace, monospace" }}>{alpha.toFixed(2)}</b></span>
        <input type="range" min={0.02} max={0.4} step={0.01} value={alpha}
          onChange={(e) => { setAlpha(Number(e.target.value)); reset(); }} style={{ flex: 1, accentColor: ACCENT }} aria-label="step size alpha" />
      </label>

      <div style={caption}>
        Both methods see the <em>same</em> episodes and use the same step size. Watch TD&rsquo;s bars (gold) settle
        smoothly onto the dashed true values while Monte Carlo (red) jitters — because MC&rsquo;s target is a whole
        random return and TD&rsquo;s is a single bootstrapped step. Run to ~100 episodes and TD&rsquo;s RMS sits
        clearly below MC&rsquo;s. Raise α and MC&rsquo;s wobble grows faster than TD&rsquo;s: high-variance targets
        punish large steps.
      </div>
    </div>
  );
}

const wrap: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, margin: "1.6rem 0" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)" };
const caption: React.CSSProperties = { fontSize: 12.5, color: "var(--muted)", marginTop: 12, lineHeight: 1.55 };
const btn: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: 7, cursor: "pointer", padding: "5px 12px", fontSize: 12.5, color: "var(--ink)", fontFamily: "var(--font-sans, sans-serif)", background: "transparent" };
