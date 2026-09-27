"use client";

import { useMemo, useState } from "react";

// The same points in different units. Nothing about the data changes on this dial except what
// the horizontal feature is multiplied by -- metres to centimetres is x100 -- and the default
// rbf SVM is refitted every time.
//
// The big panel always draws the points where they really are, so the boundary is the only
// thing that moves. The small panel draws the same points in the numbers the kernel is actually
// handed, at equal scale on both axes: that is the picture of what a distance can see. At x100
// it is a line along the horizontal, and the vertical direction -- where half the answer
// lives -- has stopped counting.
//
// The toggle standardises before fitting, and then the dial does nothing at all.
//
// Held by scripts/svm_units_check.mjs against `python scripts/svm_cases.py unitsdial`.

import { UNITS_DIAL, unitsFit, unitsPoints } from "./svmSolver";

const W = 560;
const PAD = 16;
const PLOT = 252;
const GX = PAD + PLOT + 24;
const GW = W - PAD - GX;
const H = 334;
const PINK = "var(--c-classification)";
const BLUE = "var(--c-regression)";
const MINI_Y = PAD + 128;
const MINI_H = 78;

const r3 = (v: number) => Math.round(v * 1000) / 1000;
const label = (k: number) => `×${k}`;

export default function UnitsDialLab() {
  const [ki, setKi] = useState(4);
  const [std, setStd] = useState(false);
  const k = UNITS_DIAL[ki];

  const pts = useMemo(() => unitsPoints(80, 5), []);
  const fresh = useMemo(() => unitsPoints(80, 6), []);

  const lim = useMemo(() => {
    let m = 1.2;
    for (const p of pts) m = Math.max(m, Math.abs(p.x) + 0.25, Math.abs(p.z) + 0.25);
    return r3(m);
  }, [pts]);

  const sx = (x: number) => r3(PAD + ((x + lim) / (2 * lim)) * PLOT);
  const sy = (z: number) => r3(PAD + PLOT - ((z + lim) / (2 * lim)) * PLOT);

  const view = useMemo(() => {
    const fit = unitsFit(pts, k, std);
    const sv = fit.alpha.map((a) => a > 1e-9);
    let tr = 0;
    for (let i = 0; i < pts.length; i += 1) if (Math.sign(fit.f[i]) === pts[i].y) tr += 1;
    let te = 0;
    for (const p of fresh) if (Math.sign(fit.at(p.x, p.z)) === p.y) te += 1;
    return {
      fit,
      sv,
      nsv: sv.filter(Boolean).length,
      train: tr / pts.length,
      test: te / fresh.length,
    };
  }, [pts, fresh, k, std]);

  // Decision regions, quantised into bands and run-length merged per row. The score goes
  // through Math.exp, which is not correctly rounded, so server and browser disagree in the
  // last bits; quantising settles every attribute that depends on it. Cells sit exactly on a
  // 9px grid (252 / 28) with no overlap: overlapping semi-transparent rects draw a lattice.
  const bands = useMemo(() => {
    const G = 28;
    const step = (2 * lim) / G;
    const cell = PLOT / G;
    const out: { x: number; y: number; w: number; fill: string; o: number }[] = [];
    for (let b = 0; b < G; b += 1) {
      const z = -lim + (b + 0.5) * step;
      let runStart = 0;
      let runKey = "";
      const flush = (end: number, key: string) => {
        if (!key || end <= runStart) return;
        const [sg, lvl] = key.split(":");
        out.push({
          x: PAD + runStart * cell,
          y: PAD + (G - 1 - b) * cell,
          w: (end - runStart) * cell,
          fill: sg === "1" ? PINK : BLUE,
          o: Number(lvl) / 100,
        });
      };
      for (let a = 0; a < G; a += 1) {
        const x = -lim + (a + 0.5) * step;
        const sc = view.fit.at(x, z);
        const lvl = Math.min(4, Math.max(1, Math.ceil(Math.abs(sc) * 2.5)));
        const key = `${sc > 0 ? 1 : 0}:${4 + lvl * 4}`;
        if (key !== runKey) {
          flush(a, runKey);
          runStart = a;
          runKey = key;
        }
      }
      flush(G, runKey);
    }
    return { out, h: cell };
  }, [view, lim]);

  // What the kernel is handed: the same points, in the fitted numbers, at ONE scale for both
  // axes. Unequal axes would redraw the squash away, which is the one thing this must not do.
  const mini = useMemo(() => {
    const m = pts.map((p) => view.fit.map(p.x, p.z));
    let ex = 1e-9;
    let ez = 1e-9;
    for (const [a, b] of m) {
      ex = Math.max(ex, Math.abs(a));
      ez = Math.max(ez, Math.abs(b));
    }
    const s = Math.min((GW - 12) / (2 * ex), (MINI_H - 12) / (2 * ez));
    const cx = GX + GW / 2;
    const cy = MINI_Y + MINI_H / 2;
    return m.map(([a, b], i) => ({ x: r3(cx + a * s), y: r3(cy - b * s), y0: pts[i].y }));
  }, [pts, view]);

  const row = (yy: number, key: string, v: string, col = "var(--ink)", big = false) => (
    <>
      <text x={GX} y={yy} fontSize={11} fill="var(--muted)">
        {key}
      </text>
      <text
        x={W - PAD}
        y={yy}
        fontSize={big ? 15 : 12.5}
        textAnchor="end"
        fill={col}
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {v}
      </text>
    </>
  );

  const BW = (GW - 4 * 4) / 5;

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 10,
        overflow: "hidden",
        background: "var(--panel)",
      }}
    >
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
        <rect x={0} y={0} width={W} height={H} fill="var(--canvas)" />

        <clipPath id="udl-plot">
          <rect x={PAD} y={PAD} width={PLOT} height={PLOT} />
        </clipPath>
        <g clipPath="url(#udl-plot)">
          {bands.out.map((c, i) => (
            <rect
              key={i}
              x={c.x}
              y={c.y}
              width={c.w}
              height={bands.h}
              fill={c.fill}
              opacity={c.o}
              shapeRendering="crispEdges"
            />
          ))}
        </g>
        <rect
          x={PAD}
          y={PAD}
          width={PLOT}
          height={PLOT}
          fill="none"
          stroke="var(--border-strong)"
          strokeWidth={1}
        />
        {pts.map((p, i) => (
          <circle
            key={i}
            cx={sx(p.x)}
            cy={sy(p.z)}
            r={view.sv[i] ? 4.2 : 3}
            fill={p.y > 0 ? PINK : BLUE}
            opacity={view.sv[i] ? 1 : 0.45}
          />
        ))}
        <text x={PAD + PLOT / 2} y={PAD + PLOT + 16} fontSize={11} fill="var(--muted)" textAnchor="middle">
          {`horizontal feature ${label(k)}`}
        </text>

        {/* the dial */}
        <text x={GX} y={PAD + 11} fontSize={11} fill="var(--muted)" letterSpacing="0.07em">
          UNITS OF THE HORIZONTAL FEATURE
        </text>
        {UNITS_DIAL.map((v, i) => {
          const bx = GX + (i % 5) * (BW + 4);
          const by = PAD + 18 + Math.floor(i / 5) * 26;
          const on = i === ki;
          return (
            <g key={v} style={{ cursor: "pointer" }} onClick={() => setKi(i)}>
              <rect
                x={r3(bx)}
                y={by}
                width={r3(BW)}
                height={22}
                rx={4}
                fill={on ? PINK : "transparent"}
                stroke={on ? PINK : "var(--border-strong)"}
              />
              <text
                x={r3(bx + BW / 2)}
                y={by + 15}
                fontSize={11}
                textAnchor="middle"
                fill={on ? "var(--canvas)" : "var(--muted)"}
              >
                {label(v)}
              </text>
            </g>
          );
        })}

        <g style={{ cursor: "pointer" }} onClick={() => setStd((s) => !s)}>
          <rect
            x={GX}
            y={PAD + 76}
            width={GW}
            height={24}
            rx={5}
            fill={std ? "var(--ink)" : "transparent"}
            stroke={std ? "var(--ink)" : "var(--border-strong)"}
          />
          <text
            x={GX + GW / 2}
            y={PAD + 92}
            fontSize={11.5}
            textAnchor="middle"
            fill={std ? "var(--canvas)" : "var(--ink)"}
          >
            {std ? "standardising first: ON" : "standardise first: OFF"}
          </text>
        </g>

        {/* what the kernel is handed */}
        <text x={GX} y={MINI_Y - 8} fontSize={11} fill="var(--muted)" letterSpacing="0.07em">
          WHAT THE DISTANCE SEES
        </text>
        <rect
          x={GX}
          y={MINI_Y}
          width={GW}
          height={MINI_H}
          fill="none"
          stroke="var(--border-strong)"
          strokeWidth={1}
          rx={4}
        />
        {mini.map((m, i) => (
          <circle key={i} cx={m.x} cy={m.y} r={2} fill={m.y0 > 0 ? PINK : BLUE} opacity={0.8} />
        ))}

        {row(MINI_Y + MINI_H + 22, "horizontal share of every distance", `${(100 * view.fit.share).toFixed(2)}%`)}
        {row(MINI_Y + MINI_H + 40, "gamma = 'scale'", view.fit.gamma.toPrecision(3))}
        {row(MINI_Y + MINI_H + 58, "support vectors", `${view.nsv} of ${pts.length}`)}
        {row(MINI_Y + MINI_H + 76, "training accuracy", view.train.toFixed(4))}
        {row(MINI_Y + MINI_H + 100, "accuracy on 80 new points", view.test.toFixed(4), PINK, true)}
      </svg>
    </div>
  );
}
