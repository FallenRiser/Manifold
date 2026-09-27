"use client";

import { useMemo, useState } from "react";

// Three classes from a two-class machine, both ways. One-vs-rest fits A-vs-rest, B-vs-rest and
// C-vs-rest and takes the largest score; one-vs-one fits A-vs-B, A-vs-C and B-vs-C and counts
// wins. Put the three classes in a row and linear one-vs-rest loses the middle one: no line
// puts B on one side and both its neighbours on the other, so B-vs-rest settles for w = 0.
// Hatching marks where the rule had no clean answer -- no model or several saying "mine", or a
// three-way tie of votes.
//
// Every binary model is page 14's smoFit to a KKT tolerance of 1e-8. Held by
// scripts/svm_multi_check.mjs against `python scripts/svm_cases.py masking`.

import {
  type BinaryModel,
  type MultiKernel,
  type MultiLayout,
  type MultiStrategy,
  multiData,
  multiFit,
} from "./svmSolver";

const W = 560;
const PAD = 16;
const PLOT = 300;
const G = 30;
const CELL = PLOT / G;
const RX = PAD + PLOT + 20;
const RW = W - PAD - RX;
const H = 418;
const COLS = ["var(--c-regression)", "var(--c-classification)", "var(--c-trees)"];
const NAMES = ["A", "B", "C"];
const PINK = "var(--c-classification)";

const r3 = (v: number) => Math.round(v * 1000) / 1000;

const modelName = (m: BinaryModel) =>
  `${NAMES[m.pos]} vs ${m.neg === null ? "rest" : NAMES[m.neg]}`;

export default function MultiClassLab() {
  const [layout, setLayout] = useState<MultiLayout>("row");
  const [kernel, setKernel] = useState<MultiKernel>("linear");
  const [strat, setStrat] = useState<MultiStrategy>("ovr");
  const [view, setView] = useState<number>(-1);

  const { train, val } = useMemo(() => multiData(layout), [layout]);
  const fit = useMemo(() => multiFit(train, kernel, strat), [train, kernel, strat]);

  const lim = useMemo(() => {
    let m = 1.2;
    for (const p of train) m = Math.max(m, Math.abs(p.x) + 0.25, Math.abs(p.z) + 0.25);
    return r3(m);
  }, [train]);
  const sx = (x: number) => r3(PAD + ((x + lim) / (2 * lim)) * PLOT);
  const sy = (z: number) => r3(PAD + PLOT - ((z + lim) / (2 * lim)) * PLOT);

  const stats = useMemo(() => {
    const pred = val.map((p) => fit.predict(p.x, p.z));
    const recall = [0, 1, 2].map((k) => {
      let n = 0;
      let ok = 0;
      val.forEach((p, i) => {
        if (p.c !== k) return;
        n += 1;
        if (pred[i] === k) ok += 1;
      });
      return ok / n;
    });
    const acc = pred.filter((v, i) => v === val[i].c).length / val.length;
    return { recall, acc };
  }, [fit, val]);

  const sel = view >= 0 ? fit.models[view] : null;

  // shading on an exact 10px grid, as runs of equal cells so semi-transparent rects never overlap
  const cells = useMemo(() => {
    const step = (2 * lim) / G;
    const runs: { x: number; y: number; w: number; fill: string; o: number }[] = [];
    const hatch: { x: number; y: number; w: number }[] = [];
    for (let b = 0; b < G; b += 1) {
      const z = -lim + (b + 0.5) * step;
      const yy = PAD + (G - 1 - b) * CELL;
      let start = 0;
      let key = "";
      let hStart = -1;
      const flush = (end: number) => {
        if (!key || end <= start) return;
        const [f, o] = key.split("|");
        runs.push({ x: PAD + start * CELL, y: yy, w: (end - start) * CELL, fill: f, o: Number(o) });
      };
      for (let a = 0; a <= G; a += 1) {
        let k = "";
        let unclear = false;
        if (a < G) {
          const x = -lim + (a + 0.5) * step;
          if (sel) {
            const s = sel.score(x, z);
            // rounded first: B-vs-rest's flat score sits at -1 +- 1e-6, right on a level edge
            const lvl = Math.min(3, Math.max(1, Math.ceil(r3(Math.abs(s)) * 2)));
            const fill = s > 0 ? COLS[sel.pos] : sel.neg === null ? "var(--muted)" : COLS[sel.neg];
            k = `${fill}|${(0.06 + 0.07 * lvl).toFixed(2)}`;
          } else {
            k = `${COLS[fit.predict(x, z)]}|0.22`;
            unclear = !fit.clean(x, z);
          }
        }
        if (k !== key) {
          flush(a);
          start = a;
          key = k;
        }
        if (unclear && hStart < 0) hStart = a;
        if (!unclear && hStart >= 0) {
          hatch.push({ x: PAD + hStart * CELL, y: yy, w: (a - hStart) * CELL });
          hStart = -1;
        }
      }
    }
    let unclearN = 0;
    for (let a = 0; a < G; a += 1) {
      for (let b = 0; b < G; b += 1) {
        if (!fit.clean(-lim + (a + 0.5) * step, -lim + (b + 0.5) * step)) unclearN += 1;
      }
    }
    return { runs, hatch, unclear: unclearN / (G * G) };
  }, [fit, sel, lim]);

  // a linear model's weights, to show B-vs-rest giving up
  const w = useMemo(() => {
    if (!sel || kernel !== "linear") return null;
    let a = 0;
    let b = 0;
    sel.idx.forEach((ti, i) => {
      const y = train[ti].c === sel.pos ? 1 : -1;
      a += sel.alpha[i] * y * train[ti].x;
      b += sel.alpha[i] * y * train[ti].z;
    });
    return [a, b];
  }, [sel, kernel, train]);

  const inModel = useMemo(() => {
    const s = new Map<number, boolean>();
    if (sel) sel.idx.forEach((ti, i) => s.set(ti, sel.alpha[i] > 1e-9));
    return s;
  }, [sel]);

  const button = (
    x: number,
    y: number,
    bw: number,
    label: string,
    on: boolean,
    onClick: () => void,
    key: string,
  ) => (
    <g key={key} style={{ cursor: "pointer" }} onClick={onClick}>
      <rect
        x={r3(x)}
        y={y}
        width={r3(bw)}
        height={22}
        rx={4}
        fill={on ? PINK : "transparent"}
        stroke={on ? PINK : "var(--border-strong)"}
      />
      <text
        x={r3(x + bw / 2)}
        y={y + 15}
        fontSize={11}
        textAnchor="middle"
        fill={on ? "var(--canvas)" : "var(--muted)"}
      >
        {label}
      </text>
    </g>
  );

  const pair = <T,>(
    y: number,
    title: string,
    opts: [T, string][],
    cur: T,
    set: (v: T) => void,
  ) => {
    const bw = (RW - 4) / 2;
    return (
      <>
        <text x={RX} y={y} fontSize={10.5} fill="var(--muted)" letterSpacing="0.07em">
          {title}
        </text>
        {opts.map(([v, label], i) =>
          button(RX + i * (bw + 4), y + 6, bw, label, v === cur, () => {
            set(v);
            setView(-1);
          }, `${title}-${label}`),
        )}
      </>
    );
  };

  const row = (yy: number, key: string, v: string, col = "var(--ink)", big = false) => (
    <>
      <text x={RX} y={yy} fontSize={11} fill={col === "var(--ink)" ? "var(--muted)" : col}>
        {key}
      </text>
      <text
        x={RX + RW}
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

  const VY = PAD + PLOT + 10;
  const vbw = (PLOT - 12) / 4;
  const fx = (v: number) => (Math.abs(v) < 5e-4 ? "0.000" : v.toFixed(3));
  const lines = sel
    ? [
        `${modelName(sel)}: trained on ${sel.idx.length} points, ${sel.nsv} support vectors`,
        w ? `its weights w = (${fx(w[0])}, ${fx(w[1])})` : "a curved boundary: no single weight vector to show",
        sel.neg === null
          ? `shaded ${NAMES[sel.pos]} where it says “mine”, grey where it says “rest”`
          : "shaded by which side of this one duel each spot falls on",
      ]
    : [
        "hatched: no clean winner there",
        strat === "ovr"
          ? "no model says “mine”, or more than one does"
          : "every class won exactly one duel",
      ];

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
        <defs>
          <pattern id="mcl-hatch" width={6} height={6} patternUnits="userSpaceOnUse">
            <path d="M0 6 L6 0" stroke="var(--ink)" strokeWidth={0.9} opacity={0.45} />
          </pattern>
          <clipPath id="mcl-plot">
            <rect x={PAD} y={PAD} width={PLOT} height={PLOT} />
          </clipPath>
        </defs>
        <rect x={0} y={0} width={W} height={H} fill="var(--canvas)" />

        {/* the plane */}
        <g clipPath="url(#mcl-plot)">
          {cells.runs.map((c, i) => (
            <rect
              key={i}
              x={c.x}
              y={c.y}
              width={c.w}
              height={CELL}
              fill={c.fill}
              opacity={c.o}
              shapeRendering="crispEdges"
            />
          ))}
          {cells.hatch.map((c, i) => (
            <rect
              key={`h${i}`}
              x={c.x}
              y={c.y}
              width={c.w}
              height={CELL}
              fill="url(#mcl-hatch)"
              shapeRendering="crispEdges"
            />
          ))}
          {train.map((p, i) => {
            const used = !sel || inModel.has(i);
            const sv = sel ? inModel.get(i) === true : false;
            return (
              <circle
                key={i}
                cx={sx(p.x)}
                cy={sy(p.z)}
                r={sv ? 4.3 : 3.3}
                fill={COLS[p.c]}
                opacity={used ? 1 : 0.15}
                stroke={sv ? "var(--ink)" : "var(--canvas)"}
                strokeWidth={sv ? 1.2 : 0.6}
              />
            );
          })}
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

        {/* which model to look at */}
        {button(PAD, VY, vbw, "all three", view === -1, () => setView(-1), "v-all")}
        {fit.models.map((m, j) =>
          button(PAD + (j + 1) * (vbw + 4), VY, vbw, modelName(m), view === j, () => setView(j), `v${j}`),
        )}
        {lines.map((t, i) => (
          <text
            key={i}
            x={PAD + PLOT / 2}
            y={VY + 42 + i * 16}
            fontSize={11}
            fill={i === 1 && w ? "var(--ink)" : "var(--muted)"}
            textAnchor="middle"
          >
            {t}
          </text>
        ))}

        {/* controls */}
        {pair(PAD + 8, "LAYOUT", [["row", "in a row"], ["triangle", "triangle"]] as [MultiLayout, string][], layout, setLayout)}
        {pair(PAD + 58, "KERNEL", [["linear", "linear"], ["rbf", "rbf"]] as [MultiKernel, string][], kernel, setKernel)}
        {pair(PAD + 108, "STRATEGY", [["ovr", "one-vs-rest"], ["ovo", "one-vs-one"]] as [MultiStrategy, string][], strat, setStrat)}

        {/* readouts */}
        {row(PAD + 172, "binary models", "3")}
        {row(PAD + 190, "points each is trained on", strat === "ovr" ? "90" : "60")}
        {row(PAD + 214, "class A found", stats.recall[0].toFixed(3), COLS[0])}
        {row(PAD + 232, "class B found", stats.recall[1].toFixed(3), COLS[1])}
        {row(PAD + 250, "class C found", stats.recall[2].toFixed(3), COLS[2])}
        {row(PAD + 274, "plot with no clean winner", `${(100 * cells.unclear).toFixed(1)}%`)}
        {row(PAD + 300, "accuracy on 600 new points", stats.acc.toFixed(4), PINK, true)}
      </svg>
    </div>
  );
}
