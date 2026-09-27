"use client";

import { useMemo, useState } from "react";

// Every cell of a C x gamma grid, fitted in the browser. The heat map is accuracy on 200 points
// the fits never saw; flip it to training accuracy and the right-hand side turns solid -- every
// model there memorised its 80 points -- while the same cells score worst on new ones. Click
// a cell to draw its boundary.
//
// Forty-eight fits of the default rbf SVM, each run by smoFit (page 14's SMO) to a KKT
// tolerance of 1e-8. The C = 10000 row is left off: its small-gamma cell alone takes about
// 1.4 million steps, which is page 16's point about where a grid spends its time.
//
// Held by scripts/svm_grid_check.mjs against `python scripts/svm_cases.py cgrid`.

import { GRID_LAB_C, GRID_LAB_G, gridPoints, rbfSmo } from "./svmSolver";

const W = 560;
const PAD = 16;
const HX = PAD + 36;
const HY = PAD + 26;
const CELL = 28;
const PLOT = 252;
const PX = W - PAD - PLOT;
const H = 372;
const PINK = "var(--c-classification)";
const BLUE = "var(--c-regression)";

const r3 = (v: number) => Math.round(v * 1000) / 1000;

export default function CGridLab() {
  const [sel, setSel] = useState<[number, number]>([2, 3]);
  const [mode, setMode] = useState<"val" | "train">("val");

  const { train, val } = useMemo(() => gridPoints(), []);

  const cells = useMemo(
    () =>
      GRID_LAB_C.map((C) =>
        GRID_LAB_G.map((g) => {
          const fit = rbfSmo(train, C, g);
          let tr = 0;
          for (let i = 0; i < train.length; i += 1) if (Math.sign(fit.f[i]) === train[i].y) tr += 1;
          let va = 0;
          for (const p of val) if (Math.sign(fit.score(p.x, p.z)) === p.y) va += 1;
          return {
            fit,
            train: tr / train.length,
            val: va / val.length,
            nsv: fit.alpha.filter((a) => a > 1e-9).length,
          };
        }),
      ),
    [train, val],
  );

  const cur = cells[sel[0]][sel[1]];
  // page 13's half-life: the distance at which a point's similarity has fallen to 1/2
  const reach = Math.sqrt(Math.LN2 / GRID_LAB_G[sel[1]]);

  const lim = useMemo(() => {
    let m = 1.2;
    for (const p of train) m = Math.max(m, Math.abs(p.x) + 0.25, Math.abs(p.z) + 0.25);
    return r3(m);
  }, [train]);
  const sx = (x: number) => r3(PX + ((x + lim) / (2 * lim)) * PLOT);
  const sy = (z: number) => r3(PAD + PLOT - ((z + lim) / (2 * lim)) * PLOT);

  // Decision regions on an exact 9px grid (252 / 28), quantised so server and browser agree
  // after Math.exp, and with no overlap between semi-transparent cells.
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
          x: PX + runStart * cell,
          y: PAD + (G - 1 - b) * cell,
          w: (end - runStart) * cell,
          fill: sg === "1" ? PINK : BLUE,
          o: Number(lvl) / 100,
        });
      };
      for (let a = 0; a < G; a += 1) {
        const x = -lim + (a + 0.5) * step;
        const sc = cur.fit.score(x, z);
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
  }, [cur, lim]);

  const row = (yy: number, key: string, v: string, col = "var(--ink)", big = false) => (
    <>
      <text x={PAD} y={yy} fontSize={11} fill="var(--muted)">
        {key}
      </text>
      <text
        x={HX + GRID_LAB_G.length * CELL}
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

  const TY = HY + GRID_LAB_C.length * CELL;

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

        {/* the grid */}
        <text x={HX} y={PAD + 8} fontSize={10.5} fill="var(--muted)" letterSpacing="0.07em">
          GAMMA →
        </text>
        {GRID_LAB_G.map((g, j) => (
          <text
            key={g}
            x={HX + j * CELL + CELL / 2}
            y={HY - 5}
            fontSize={9.5}
            textAnchor="middle"
            fill="var(--muted)"
          >
            {g}
          </text>
        ))}
        {GRID_LAB_C.map((c, i) => (
          <text
            key={c}
            x={HX - 5}
            y={HY + i * CELL + CELL / 2 + 3.5}
            fontSize={9.5}
            textAnchor="end"
            fill="var(--muted)"
          >
            {c}
          </text>
        ))}
        <text x={PAD} y={HY - 5} fontSize={10.5} fill="var(--muted)" letterSpacing="0.07em">
          C ↓
        </text>
        {cells.map((rowCells, i) =>
          rowCells.map((c, j) => {
            const v = mode === "val" ? c.val : c.train;
            const on = sel[0] === i && sel[1] === j;
            return (
              <g key={`${i}-${j}`} style={{ cursor: "pointer" }} onClick={() => setSel([i, j])}>
                <rect
                  x={HX + j * CELL}
                  y={HY + i * CELL}
                  width={CELL}
                  height={CELL}
                  fill={PINK}
                  fillOpacity={r3(Math.max(0, Math.min(1, (v - 0.5) / 0.5)) * 0.85)}
                  stroke="var(--canvas)"
                  strokeWidth={1}
                />
                <text
                  x={HX + j * CELL + CELL / 2}
                  y={HY + i * CELL + CELL / 2 + 3.5}
                  fontSize={9.5}
                  textAnchor="middle"
                  fill="var(--ink)"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                  pointerEvents="none"
                >
                  {v.toFixed(2)}
                </text>
                {on && (
                  <rect
                    x={HX + j * CELL + 1}
                    y={HY + i * CELL + 1}
                    width={CELL - 2}
                    height={CELL - 2}
                    fill="none"
                    stroke="var(--ink)"
                    strokeWidth={2}
                    pointerEvents="none"
                  />
                )}
              </g>
            );
          }),
        )}

        {/* colour by */}
        {(["val", "train"] as const).map((m, k) => {
          const on = mode === m;
          const bw = (GRID_LAB_G.length * CELL + 36 - 4) / 2;
          const bx = PAD + k * (bw + 4);
          return (
            <g key={m} style={{ cursor: "pointer" }} onClick={() => setMode(m)}>
              <rect
                x={r3(bx)}
                y={TY + 10}
                width={r3(bw)}
                height={22}
                rx={4}
                fill={on ? PINK : "transparent"}
                stroke={on ? PINK : "var(--border-strong)"}
              />
              <text
                x={r3(bx + bw / 2)}
                y={TY + 25}
                fontSize={11}
                textAnchor="middle"
                fill={on ? "var(--canvas)" : "var(--muted)"}
              >
                {m === "val" ? "colour: new points" : "colour: training"}
              </text>
            </g>
          );
        })}

        {row(TY + 56, "C, gamma", `${GRID_LAB_C[sel[0]]}, ${GRID_LAB_G[sel[1]]}`)}
        {row(TY + 74, "training accuracy (80 points)", cur.train.toFixed(4))}
        {row(TY + 92, "support vectors", `${cur.nsv} of ${train.length}`)}
        {row(TY + 110, "SMO steps to converge", cur.fit.steps.toLocaleString("en-US"))}
        {row(TY + 128, "reach of one point (half-life)", reach.toFixed(3))}
        {row(TY + 152, "accuracy on 200 new points", cur.val.toFixed(4), PINK, true)}

        {/* the selected model */}
        <clipPath id="cgl-plot">
          <rect x={PX} y={PAD} width={PLOT} height={PLOT} />
        </clipPath>
        <g clipPath="url(#cgl-plot)">
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
          x={PX}
          y={PAD}
          width={PLOT}
          height={PLOT}
          fill="none"
          stroke="var(--border-strong)"
          strokeWidth={1}
        />
        <g clipPath="url(#cgl-plot)">
          {train.map((p, i) => {
            const sv = cur.fit.alpha[i] > 1e-9;
            return (
              <circle
                key={i}
                cx={sx(p.x)}
                cy={sy(p.z)}
                r={sv ? 4.2 : 3}
                fill={p.y > 0 ? PINK : BLUE}
                opacity={sv ? 1 : 0.45}
              />
            );
          })}
        </g>
        <text
          x={PX + PLOT / 2}
          y={PAD + PLOT + 16}
          fontSize={11}
          fill="var(--muted)"
          textAnchor="middle"
        >
          {(reach / (2 * lim)) * PLOT < PLOT / 28
            ? "each point's reach is smaller than one shaded square"
            : "the 80 training points · large dots are support vectors"}
        </text>
        {(reach / (2 * lim)) * PLOT < PLOT / 28 && (
          <text
            x={PX + PLOT / 2}
            y={PAD + PLOT + 31}
            fontSize={11}
            fill="var(--muted)"
            textAnchor="middle"
          >
            {`so the model is ${cur.nsv} patches too small to draw`}
          </text>
        )}
      </svg>
    </div>
  );
}
