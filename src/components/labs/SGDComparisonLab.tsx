"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const RAW: [number, number][] = [
  [1, 5.5], [2, 5.0], [3, 6.4], [4, 6.0], [5, 7.1], [6, 7.6],
  [7, 7.2], [8, 8.6], [9, 8.9], [10, 9.3], [11, 10.4], [12, 10.1],
];
const N = RAW.length;
const XMEAN = RAW.reduce((s, [x]) => s + x, 0) / N;
const XSD = Math.sqrt(RAW.reduce((s, [x]) => s + (x - XMEAN) ** 2, 0) / N);
const XS = RAW.map(([x]) => (x - XMEAN) / XSD);
const YS = RAW.map(([, y]) => y);

const MSTAR = XS.reduce((s, x, i) => s + x * YS[i], 0) / N;
const BSTAR = YS.reduce((s, y) => s + y, 0) / N;

function loss(m: number, b: number) {
  let s = 0;
  for (let i = 0; i < N; i++) s += (m * XS[i] + b - YS[i]) ** 2;
  return s / N;
}
function gradBatch(m: number, b: number): [number, number] {
  let dm = 0, db = 0;
  for (let i = 0; i < N; i++) {
    const e = m * XS[i] + b - YS[i];
    dm += 2 * e * XS[i]; db += 2 * e;
  }
  return [dm / N, db / N];
}
function gradSubset(m: number, b: number, idx: number[]): [number, number] {
  let dm = 0, db = 0;
  for (const i of idx) {
    const e = m * XS[i] + b - YS[i];
    dm += 2 * e * XS[i]; db += 2 * e;
  }
  return [dm / idx.length, db / idx.length];
}

// contour geometry
const CW = 340, CH = 310;
const cX0 = 44, cX1 = 312, cY0 = 278, cY1 = 22;
const M0 = MSTAR - 4.5, M1 = MSTAR + 4.5;
const B0 = BSTAR - 4.5, B1 = BSTAR + 4.5;
const mToPx = (m: number) => cX0 + ((m - M0) / (M1 - M0)) * (cX1 - cX0);
const bToPy = (b: number) => cY0 - ((b - B0) / (B1 - B0)) * (cY0 - cY1);

const LR = 0.25;
const MINIBATCH = 4;
const START_M = MSTAR - 3.4, START_B = BSTAR + 3.4;

type Pt = { m: number; b: number };
type PS = { pos: Pt; path: Pt[]; iter: number };
const ZERO: Pt = { m: START_M, b: START_B };
const INIT: PS = { pos: ZERO, path: [ZERO], iter: 0 };

// LCG for deterministic per-tick randomness
function lcgNext(seed: number): number {
  return ((seed * 1664525 + 1013904223) >>> 0);
}

export function SGDComparisonLab() {
  const [batchSt, setBatch] = useState<PS>(INIT);
  const [miniSt, setMini] = useState<PS>(INIT);
  const [sgdSt, setSgd] = useState<PS>(INIT);
  const [running, setRunning] = useState(false);
  const seedRef = useRef(42);

  const heat = useMemo(() => {
    const G = 34;
    let lo = Infinity, hi = -Infinity;
    const grid: number[][] = [];
    for (let i = 0; i < G; i++) {
      grid[i] = [];
      for (let j = 0; j < G; j++) {
        const m = M0 + ((i + 0.5) / G) * (M1 - M0);
        const b = B0 + ((j + 0.5) / G) * (B1 - B0);
        const L = loss(m, b);
        grid[i][j] = L;
        if (L < lo) lo = L; if (L > hi) hi = L;
      }
    }
    const cells: { x: number; y: number; w: number; h: number; op: number }[] = [];
    for (let i = 0; i < G; i++) {
      for (let j = 0; j < G; j++) {
        const x = mToPx(M0 + (i / G) * (M1 - M0));
        const w = mToPx(M0 + ((i + 1) / G) * (M1 - M0)) - x;
        const yT = bToPy(B0 + ((j + 1) / G) * (B1 - B0));
        const h = bToPy(B0 + (j / G) * (B1 - B0)) - yT;
        const norm = (grid[i][j] - lo) / (hi - lo);
        cells.push({ x, y: yT, w: w + 0.6, h: h + 0.6, op: Math.pow(norm, 0.65) * 0.52 });
      }
    }
    return cells;
  }, []);

  function doStep() {
    // Pre-compute all random choices for this tick outside setState
    let s = seedRef.current;
    const miniIdx: number[] = [];
    for (let k = 0; k < MINIBATCH; k++) { s = lcgNext(s); miniIdx.push(s % N); }
    s = lcgNext(s);
    const sgdIdx = [s % N];
    seedRef.current = s;

    setBatch((st) => {
      const [dm, db] = gradBatch(st.pos.m, st.pos.b);
      const pos = { m: st.pos.m - LR * dm, b: st.pos.b - LR * db };
      return { pos, path: [...st.path, pos].slice(-350), iter: st.iter + 1 };
    });
    setMini((st) => {
      const [dm, db] = gradSubset(st.pos.m, st.pos.b, miniIdx);
      const pos = { m: st.pos.m - LR * dm, b: st.pos.b - LR * db };
      return { pos, path: [...st.path, pos].slice(-350), iter: st.iter + 1 };
    });
    setSgd((st) => {
      const [dm, db] = gradSubset(st.pos.m, st.pos.b, sgdIdx);
      const pos = { m: st.pos.m - LR * dm, b: st.pos.b - LR * db };
      return { pos, path: [...st.path, pos].slice(-350), iter: st.iter + 1 };
    });
  }

  useEffect(() => {
    if (!running) return;
    const id = setInterval(doStep, 110);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const reset = () => {
    setRunning(false);
    seedRef.current = 42;
    setBatch(INIT); setMini(INIT); setSgd(INIT);
  };

  const pts = (path: Pt[]) =>
    path.map((p) => `${mToPx(p.m).toFixed(1)},${bToPy(p.b).toFixed(1)}`).join(" ");
  const clamp = (pos: Pt) => ({
    cx: Math.max(cX0 + 2, Math.min(cX1 - 2, mToPx(pos.m))),
    cy: Math.max(cY1 + 2, Math.min(cY0 - 2, bToPy(pos.b))),
  });

  const bcl = clamp(batchSt.pos);
  const mcl = clamp(miniSt.pos);
  const scl = clamp(sgdSt.pos);

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.6rem 0" }}>
      {/* legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center", marginBottom: 12 }}>
        <span className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", flex: 1 }}>
          Same start, three paths
        </span>
        <Leg color="var(--c-regression)" label="Batch GD (all 12)" />
        <Leg color="var(--brand)" label={`Mini-batch (${MINIBATCH})`} />
        <Leg color="var(--c-fundamentals)" label="SGD (1 point)" />
      </div>

      {/* contour */}
      <svg viewBox={`0 0 ${CW} ${CH}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <rect x={cX0} y={cY1} width={cX1 - cX0} height={cY0 - cY1} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        {heat.map((c, i) => (
          <rect key={i} x={c.x} y={c.y} width={c.w} height={c.h} fill="var(--brand)" fillOpacity={c.op} />
        ))}
        {/* optimum ring */}
        <circle cx={mToPx(MSTAR)} cy={bToPy(BSTAR)} r={6} fill="none" stroke="var(--good)" strokeWidth={1.8} strokeDasharray="3 2" />
        <circle cx={mToPx(MSTAR)} cy={bToPy(BSTAR)} r={1.8} fill="var(--good)" />

        {/* SGD path — amber, thin, noisy */}
        <polyline points={pts(sgdSt.path)} fill="none" stroke="var(--c-fundamentals)" strokeWidth={1.4} strokeOpacity={0.75} strokeLinejoin="round" />
        <circle {...scl} r={5.5} fill="var(--c-fundamentals)" stroke="var(--surface)" strokeWidth={1.5} />

        {/* mini-batch path — violet, medium */}
        <polyline points={pts(miniSt.path)} fill="none" stroke="var(--brand)" strokeWidth={1.6} strokeOpacity={0.8} strokeLinejoin="round" />
        <circle {...mcl} r={5.5} fill="var(--brand)" stroke="var(--surface)" strokeWidth={1.5} />

        {/* batch path — blue, smooth, on top */}
        <polyline points={pts(batchSt.path)} fill="none" stroke="var(--c-regression)" strokeWidth={2} strokeOpacity={0.9} strokeLinejoin="round" />
        <circle {...bcl} r={5.5} fill="var(--c-regression)" stroke="var(--surface)" strokeWidth={1.5} />

        <text x={(cX0 + cX1) / 2} y={CH - 5} fontSize={10.5} fill="var(--faint)" textAnchor="middle">slope →</text>
        <text x={12} y={(cY0 + cY1) / 2} fontSize={10.5} fill="var(--faint)" textAnchor="middle"
          transform={`rotate(-90 12 ${(cY0 + cY1) / 2})`}>intercept →</text>
      </svg>

      {/* per-mode stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, margin: "12px 0" }}>
        <ModeCard color="var(--c-regression)" label="Batch GD" iter={batchSt.iter} err={loss(batchSt.pos.m, batchSt.pos.b)} />
        <ModeCard color="var(--brand)" label="Mini-batch" iter={miniSt.iter} err={loss(miniSt.pos.m, miniSt.pos.b)} />
        <ModeCard color="var(--c-fundamentals)" label="SGD" iter={sgdSt.iter} err={loss(sgdSt.pos.m, sgdSt.pos.b)} />
      </div>

      {/* controls */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button onClick={() => setRunning((r) => !r)} style={btnPrimary}>
          {running ? "Pause" : "Run all three"}
        </button>
        <button onClick={doStep} style={btnGhost} disabled={running}>Step once</button>
        <button onClick={reset} style={btnGhost}>Reset</button>
      </div>
    </div>
  );
}

function Leg({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}>
      <span style={{ width: 18, height: 3, borderRadius: 2, background: color, display: "inline-block" }} />
      <span style={{ color: "var(--muted)" }}>{label}</span>
    </span>
  );
}

function ModeCard({ color, label, iter, err }: { color: string; label: string; iter: number; err: number }) {
  return (
    <div style={{
      background: `color-mix(in srgb, ${color} 7%, var(--surface-2))`,
      border: `1px solid color-mix(in srgb, ${color} 20%, var(--border))`,
      borderRadius: 10, padding: "8px 11px",
    }}>
      <div style={{ fontSize: 11, color, fontWeight: 600, marginBottom: 4 }}>{label}</div>
      <div style={{ display: "flex", gap: 14 }}>
        <Stat label="step" value={String(iter)} />
        <Stat label="error" value={err.toFixed(2)} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>{value}</div>
    </div>
  );
}

const btnPrimary: React.CSSProperties = { background: "var(--cta)", color: "#fff", border: "none", fontSize: 13, fontWeight: 500, padding: "8px 16px", borderRadius: 10, cursor: "pointer" };
const btnGhost: React.CSSProperties = { background: "transparent", color: "var(--muted)", border: "1px solid var(--border-strong)", fontSize: 13, padding: "8px 13px", borderRadius: 10, cursor: "pointer" };
