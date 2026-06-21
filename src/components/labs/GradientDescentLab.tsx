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

// optimum (xs centered & unit-variance → m* = mean(xs*y), b* = mean(y))
const MSTAR = XS.reduce((s, x, i) => s + x * YS[i], 0) / N;
const BSTAR = YS.reduce((s, y) => s + y, 0) / N;
const START = { m: MSTAR + 2.9, b: BSTAR + 2.9 };
const START_LOSS = loss(START.m, START.b);

const M0 = MSTAR - 4, M1 = MSTAR + 4, B0 = BSTAR - 4, B1 = BSTAR + 4;

// contour panel geometry
const CW = 300, CH = 300, cX0 = 40, cX1 = 286, cY0 = 262, cY1 = 18;
const mToPx = (m: number) => cX0 + ((m - M0) / (M1 - M0)) * (cX1 - cX0);
const bToPy = (b: number) => cY0 - ((b - B0) / (B1 - B0)) * (cY0 - cY1);

// data panel geometry
const DXMIN = 0, DXMAX = 13, DYMIN = 3, DYMAX = 12;
const dX = (x: number) => 40 + ((x - DXMIN) / (DXMAX - DXMIN)) * (286 - 40);
const dY = (y: number) => 262 - ((y - DYMIN) / (DYMAX - DYMIN)) * (262 - 18);

type State = { m: number; b: number; path: { m: number; b: number }[]; iter: number; status: string };

export function GradientDescentLab() {
  const [st, setSt] = useState<State>({ m: START.m, b: START.b, path: [{ ...START }], iter: 0, status: "ready" });
  const [lr, setLr] = useState(0.3);
  const [running, setRunning] = useState(false);
  const lrRef = useRef(lr);
  lrRef.current = lr;

  const heat = useMemo(() => {
    const G = 32, cells: { x: number; y: number; w: number; h: number; op: number }[] = [];
    let lo = Infinity, hi = -Infinity;
    const grid: number[][] = [];
    for (let i = 0; i < G; i++) {
      grid[i] = [];
      for (let j = 0; j < G; j++) {
        const m = M0 + ((i + 0.5) / G) * (M1 - M0);
        const b = B0 + ((j + 0.5) / G) * (B1 - B0);
        const L = loss(m, b);
        grid[i][j] = L;
        if (L < lo) lo = L;
        if (L > hi) hi = L;
      }
    }
    for (let i = 0; i < G; i++) {
      for (let j = 0; j < G; j++) {
        const x = mToPx(M0 + (i / G) * (M1 - M0));
        const w = mToPx(M0 + ((i + 1) / G) * (M1 - M0)) - x;
        const yTop = bToPy(B0 + ((j + 1) / G) * (B1 - B0));
        const h = bToPy(B0 + (j / G) * (B1 - B0)) - yTop;
        const norm = (grid[i][j] - lo) / (hi - lo);
        cells.push({ x, y: yTop, w: w + 0.6, h: h + 0.6, op: Math.pow(norm, 0.7) * 0.6 });
      }
    }
    return cells;
  }, []);

  useEffect(() => {
    if (st.status === "diverged" || st.status === "converged") setRunning(false);
  }, [st.status]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSt((s) => {
        if (s.status === "diverged" || s.status === "converged" || s.iter > 250) return s;
        return stepFrom(s, lrRef.current);
      });
    }, 110);
    return () => clearInterval(id);
  }, [running]);

  function stepFrom(s: State, lrv: number): State {
    const [dm, db] = grad(s.m, s.b);
    const nm = s.m - lrv * dm;
    const nb = s.b - lrv * db;
    const L = loss(nm, nb);
    let status = "descending";
    if (!isFinite(L) || L > START_LOSS * 8) status = "diverged";
    else if (Math.hypot(dm, db) < 0.02) status = "converged";
    const path = [...s.path, { m: nm, b: nb }].slice(-400);
    return { m: nm, b: nb, path, iter: s.iter + 1, status };
  }

  const stepOnce = () => setSt((s) => (s.status === "diverged" ? s : stepFrom(s, lrRef.current)));
  const reset = () => { setRunning(false); setSt({ m: START.m, b: START.b, path: [{ ...START }], iter: 0, status: "ready" }); };

  const pathPts = st.path.map((p) => `${mToPx(p.m).toFixed(1)},${bToPy(p.b).toFixed(1)}`).join(" ");
  const cur = st.path[st.path.length - 1];
  const clampX = Math.max(cX0, Math.min(cX1, mToPx(cur.m)));
  const clampY = Math.max(cY1, Math.min(cY0, bToPy(cur.b)));

  const statusColor = st.status === "converged" ? "var(--good)" : st.status === "diverged" ? "var(--bad)" : "var(--muted)";
  const statusText = st.status === "converged" ? "converged ✓" : st.status === "diverged" ? "diverged ✗ — lower the rate" : st.status === "descending" ? "descending…" : "ready";

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.6rem 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
        <span className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
          Roll downhill to the best line
        </span>
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>left: the surface from above · right: the line it means</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
        {/* contour panel */}
        <svg viewBox={`0 0 ${CW} ${CH}`} style={{ width: "100%", height: "auto", display: "block" }}>
          <rect x={cX0} y={cY1} width={cX1 - cX0} height={cY0 - cY1} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
          {heat.map((c, i) => (
            <rect key={i} x={c.x} y={c.y} width={c.w} height={c.h} fill="var(--brand)" fillOpacity={c.op} />
          ))}
          {/* minimum */}
          <circle cx={mToPx(MSTAR)} cy={bToPy(BSTAR)} r={5} fill="none" stroke="var(--good)" strokeWidth={2} />
          <circle cx={mToPx(MSTAR)} cy={bToPy(BSTAR)} r={1.5} fill="var(--good)" />
          {/* path */}
          <polyline points={pathPts} fill="none" stroke="var(--ink)" strokeWidth={1.6} strokeOpacity={0.7} strokeLinejoin="round" />
          {st.path.map((p, i) => (
            <circle key={i} cx={mToPx(p.m)} cy={bToPy(p.b)} r={1.7} fill="var(--ink)" fillOpacity={0.5} />
          ))}
          <circle cx={clampX} cy={clampY} r={5.5} fill="var(--brand-2)" stroke="var(--surface)" strokeWidth={1.5} />
          <text x={(cX0 + cX1) / 2} y={CH - 4} fontSize={10.5} fill="var(--faint)" textAnchor="middle">slope →</text>
          <text x={12} y={(cY0 + cY1) / 2} fontSize={10.5} fill="var(--faint)" textAnchor="middle" transform={`rotate(-90 12 ${(cY0 + cY1) / 2})`}>intercept →</text>
        </svg>

        {/* data panel */}
        <svg viewBox="0 0 300 300" style={{ width: "100%", height: "auto", display: "block" }}>
          <rect x={40} y={18} width={246} height={244} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
          <line x1={dX(0)} y1={dY(cur.m * ((0 - XMEAN) / XSD) + cur.b)} x2={dX(13)} y2={dY(cur.m * ((13 - XMEAN) / XSD) + cur.b)} stroke="var(--brand)" strokeWidth={2.5} strokeLinecap="round" />
          {RAW.map(([x, y], i) => (
            <circle key={i} cx={dX(x)} cy={dY(y)} r={3.6} fill="var(--c-regression)" />
          ))}
          <text x={163} y={296} fontSize={10.5} fill="var(--faint)" textAnchor="middle">the data &amp; current line</text>
        </svg>
      </div>

      {/* controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "14px 0 12px" }}>
        <span style={{ fontSize: 12.5, color: "var(--muted)", whiteSpace: "nowrap" }}>Learning rate</span>
        <input type="range" min={0.01} max={1.4} step={0.01} value={lr} onChange={(e) => setLr(parseFloat(e.target.value))} style={{ flex: 1 }} />
        <span style={{ fontSize: 12.5, fontWeight: 500, minWidth: 30, textAlign: "right" }}>{lr.toFixed(2)}</span>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
        <button onClick={stepOnce} style={btnGhost}>Step</button>
        <button onClick={() => setRunning((r) => !r)} style={btnPrimary}>{running ? "Pause" : "Run"}</button>
        <button onClick={reset} style={btnGhost}>Reset</button>
        <div style={{ flex: 1 }} />
        <Stat label="step" value={String(st.iter)} />
        <Stat label="error" value={loss(cur.m, cur.b).toFixed(2)} />
        <span style={{ fontSize: 12.5, color: statusColor, fontWeight: 500, minWidth: 90, textAlign: "right" }}>{statusText}</span>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "var(--surface-2)", borderRadius: 9, padding: "6px 10px" }}>
      <div style={{ fontSize: 10, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 500, color: "var(--ink)" }}>{value}</div>
    </div>
  );
}

const btnPrimary: React.CSSProperties = { background: "var(--cta)", color: "#fff", border: "none", fontSize: 13, fontWeight: 500, padding: "8px 16px", borderRadius: 10, cursor: "pointer" };
const btnGhost: React.CSSProperties = { background: "transparent", color: "var(--muted)", border: "1px solid var(--border-strong)", fontSize: 13, padding: "8px 13px", borderRadius: 10, cursor: "pointer" };
