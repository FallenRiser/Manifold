"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const XS_RAW = [-1.5, -0.8, 0.0, 0.5, 1.2, 1.9];
const YS = [2.1, 3.4, 5.0, 5.8, 7.2, 8.1];
const N = XS_RAW.length;
const XMEAN = XS_RAW.reduce((a, b) => a + b, 0) / N;
const XSD = Math.sqrt(XS_RAW.reduce((s, x) => s + (x - XMEAN) ** 2, 0) / N);
const XS = XS_RAW.map((x) => (x - XMEAN) / XSD);

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

// True minimum
const MSTAR = XS.reduce((s, x, i) => s + x * YS[i], 0) / N;
const BSTAR = YS.reduce((s, y) => s + y, 0) / N;

// 3D projection (isometric-ish)
const M0 = MSTAR - 3.5, M1 = MSTAR + 3.5;
const B0 = BSTAR - 3.5, B1 = BSTAR + 3.5;
const LOSS_FLOOR = loss(MSTAR, BSTAR);
const LOSS_CEIL = loss(M0, B0);
const LOSS_H = LOSS_CEIL - LOSS_FLOOR;

function project(m: number, b: number, l: number): [number, number] {
  const u = (m - M0) / (M1 - M0) - 0.5; // -0.5…0.5
  const v = (b - B0) / (B1 - B0) - 0.5;
  const h = (l - LOSS_FLOOR) / LOSS_H; // 0…1
  const cx = 200, cy = 160;
  const sx = 200, sy = 70, sh = 110;
  return [
    cx + (u - v) * sx,
    cy + (u + v) * sy - h * sh,
  ];
}

const GRID_N = 10;

function buildSurface() {
  const quads: { pts: string; depth: number; loss: number }[] = [];
  for (let i = 0; i < GRID_N; i++) {
    for (let j = 0; j < GRID_N; j++) {
      const m00 = M0 + (i / GRID_N) * (M1 - M0);
      const m10 = M0 + ((i + 1) / GRID_N) * (M1 - M0);
      const b00 = B0 + (j / GRID_N) * (B1 - B0);
      const b10 = B0 + ((j + 1) / GRID_N) * (B1 - B0);
      const l00 = loss(m00, b00);
      const l10 = loss(m10, b00);
      const l01 = loss(m00, b10);
      const l11 = loss(m10, b10);
      const avgL = (l00 + l10 + l01 + l11) / 4;
      const [x0, y0] = project(m00, b00, l00);
      const [x1, y1] = project(m10, b00, l10);
      const [x2, y2] = project(m10, b10, l11);
      const [x3, y3] = project(m00, b10, l01);
      const pts = `${x0.toFixed(1)},${y0.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)} ${x3.toFixed(1)},${y3.toFixed(1)}`;
      quads.push({ pts, depth: i + j, loss: avgL });
    }
  }
  quads.sort((a, b) => a.depth - b.depth);
  return quads;
}

const SURFACE = buildSurface();

type State = { m: number; b: number; path: [number, number][] };

const STARTS = [
  { label: "Far corner", m: MSTAR - 3, b: BSTAR + 3 },
  { label: "Top edge", m: MSTAR + 2.5, b: BSTAR - 1 },
  { label: "Near bottom", m: MSTAR + 0.5, b: BSTAR + 0.8 },
];

export function DescentSurface3D() {
  const [alpha, setAlpha] = useState(0.25);
  const [startIdx, setStartIdx] = useState(0);
  const [st, setSt] = useState<State>(() => {
    const s = STARTS[0];
    return { m: s.m, b: s.b, path: [[s.m, s.b]] };
  });
  const [running, setRunning] = useState(false);
  const [converged, setConverged] = useState(false);
  const alphaRef = useRef(alpha);
  alphaRef.current = alpha;

  function reset(idx?: number) {
    const i = idx ?? startIdx;
    const s = STARTS[i];
    setSt({ m: s.m, b: s.b, path: [[s.m, s.b]] });
    setRunning(false);
    setConverged(false);
  }

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSt((s) => {
        const [dm, db] = grad(s.m, s.b);
        if (Math.hypot(dm, db) < 0.008) {
          setRunning(false);
          setConverged(true);
          return s;
        }
        const nm = s.m - alphaRef.current * dm;
        const nb = s.b - alphaRef.current * db;
        const L = loss(nm, nb);
        if (!isFinite(L) || L > LOSS_CEIL * 4) { setRunning(false); return s; }
        const path = [...s.path, [nm, nb] as [number, number]].slice(-80);
        return { m: nm, b: nb, path };
      });
    }, 80);
    return () => clearInterval(id);
  }, [running]);

  // Build 3D path points
  const pathPts = st.path
    .map(([m, b]) => {
      const [x, y] = project(m, b, loss(m, b));
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const [curX, curY] = project(st.m, st.b, loss(st.m, st.b));
  const [minX, minY] = project(MSTAR, BSTAR, loss(MSTAR, BSTAR));
  const startPt = st.path[0];
  const [startX, startY] = project(startPt[0], startPt[1], loss(startPt[0], startPt[1]));

  const curLoss = loss(st.m, st.b);
  const lossNorm = Math.max(0, Math.min(1, (curLoss - LOSS_FLOOR) / LOSS_H));

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, margin: "1.6rem 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <span className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
          Descent on the loss surface
        </span>
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>
          the bowl · the path · the minimum
        </span>
      </div>

      <svg viewBox="0 0 400 290" style={{ width: "100%", height: "auto", display: "block", marginBottom: 12 }}>
        {/* Surface quads */}
        {SURFACE.map(({ pts, loss: l }, i) => {
          const norm = Math.max(0, Math.min(1, (l - LOSS_FLOOR) / LOSS_H));
          const opacity = 0.07 + norm * 0.25;
          return (
            <polygon
              key={i}
              points={pts}
              fill={`color-mix(in srgb, var(--brand) ${Math.round(opacity * 100)}%, var(--canvas))`}
              stroke="var(--border)"
              strokeWidth={0.5}
              strokeOpacity={0.4}
            />
          );
        })}

        {/* Descent path */}
        {st.path.length > 1 && (
          <polyline
            points={pathPts}
            fill="none"
            stroke="var(--c-fundamentals)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Path dots */}
        {st.path.map(([m, b], i) => {
          const [x, y] = project(m, b, loss(m, b));
          return (
            <circle key={i} cx={x} cy={y} r={2} fill="var(--c-fundamentals)" fillOpacity={0.55} />
          );
        })}

        {/* Start marker */}
        <circle cx={startX} cy={startY} r={5} fill="none" stroke="var(--muted)" strokeWidth={1.5} strokeDasharray="2 2" />

        {/* Minimum marker */}
        <circle cx={minX} cy={minY} r={6} fill="none" stroke="var(--good)" strokeWidth={2} />
        <circle cx={minX} cy={minY} r={2.5} fill="var(--good)" />
        <text x={minX + 9} y={minY + 4} fontSize={10} fill="var(--good)">minimum</text>

        {/* Current position */}
        <circle cx={curX} cy={curY} r={6} fill="var(--brand-2)" stroke="var(--surface)" strokeWidth={1.5} />

        {/* Labels */}
        <text x={20} y={280} fontSize={9.5} fill="var(--faint)">← slope (m)</text>
        <text x={350} y={280} fontSize={9.5} fill="var(--faint)" textAnchor="end">intercept (b) →</text>
        <text x={10} y={30} fontSize={9.5} fill="var(--faint)">loss ↑</text>
      </svg>

      {/* Current loss bar */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>
          <span>Distance from minimum</span>
          <span style={{ color: converged ? "var(--good)" : "var(--ink)", fontWeight: 500 }}>
            {converged ? "converged ✓" : `loss = ${curLoss.toFixed(3)}`}
          </span>
        </div>
        <div style={{ background: "var(--canvas)", borderRadius: 4, height: 6, overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${(lossNorm * 100).toFixed(1)}%`,
              background: lossNorm < 0.15 ? "var(--good)" : lossNorm < 0.5 ? "var(--warn)" : "var(--bad)",
              borderRadius: 4,
              transition: "width 0.12s, background 0.3s",
            }}
          />
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <span style={{ fontSize: 12.5, color: "var(--muted)", whiteSpace: "nowrap" }}>Learning rate α</span>
        <input type="range" min={0.05} max={0.8} step={0.01} value={alpha} onChange={(e) => setAlpha(parseFloat(e.target.value))} style={{ flex: 1 }} />
        <span style={{ fontSize: 12.5, fontWeight: 500, minWidth: 32, textAlign: "right" }}>{alpha.toFixed(2)}</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <button onClick={() => setRunning((r) => !r)} style={btnPrimary}>
          {running ? "Pause" : "Run"}
        </button>
        <button onClick={() => reset()} style={btnGhost}>Reset</button>
        <span style={{ fontSize: 12.5, color: "var(--muted)" }}>Start from:</span>
        {STARTS.map((s, i) => (
          <button
            key={i}
            onClick={() => { setStartIdx(i); reset(i); }}
            style={{
              ...btnGhost,
              borderColor: startIdx === i ? "var(--brand)" : undefined,
              color: startIdx === i ? "var(--brand)" : undefined,
            }}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const btnPrimary: React.CSSProperties = { background: "var(--cta)", color: "#fff", border: "none", fontSize: 13, fontWeight: 500, padding: "8px 18px", borderRadius: 10, cursor: "pointer" };
const btnGhost: React.CSSProperties = { background: "transparent", color: "var(--muted)", border: "1px solid var(--border-strong)", fontSize: 13, padding: "8px 14px", borderRadius: 10, cursor: "pointer" };
