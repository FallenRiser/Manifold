"use client";

import { useMemo, useState } from "react";

// The Nystroem approximation, small enough to see. The SVM only gets to know each point by its
// similarity to m landmarks (ringed); its boundary is drawn from those m numbers alone, and a
// prediction costs m similarities instead of one per support vector. Step m up and watch the
// approximate boundary settle onto the exact one, drawn dashed underneath.
//
// Every fit is page 14's smoFit on the approximate kernel. Held by
// scripts/svm_landmark_check.mjs against `python scripts/svm_cases.py landmarks`.

import { LANDMARKS, LANDMARK_GAMMA, landmarkData, landmarkFit, rbfSmo } from "./svmSolver";

const W = 560;
const PAD = 16;
const PLOT = 280;
const RX = PAD + PLOT + 22;
const RW = W - PAD - RX;
const H = 330;
const PINK = "var(--c-classification)";
const BLUE = "var(--c-regression)";
const G = 40;

const r3 = (v: number) => Math.round(v * 1000) / 1000;

export default function LandmarkLab() {
  const [mi, setMi] = useState(3);
  const { train, val } = useMemo(() => landmarkData(), []);
  const exact = useMemo(() => rbfSmo(train, 1, LANDMARK_GAMMA), [train]);
  const m = LANDMARKS[mi];
  const fit = useMemo(() => (m === 0 ? null : landmarkFit(train, m)), [train, m]);
  const cur = fit ?? exact;

  const acc = (s: (x: number, z: number) => number) =>
    val.filter((p) => Math.sign(s(p.x, p.z)) === p.y).length / val.length;
  const exactAcc = useMemo(() => acc(exact.score), [exact]); // eslint-disable-line react-hooks/exhaustive-deps
  const curAcc = useMemo(() => acc(cur.score), [cur]); // eslint-disable-line react-hooks/exhaustive-deps
  const nsvExact = exact.alpha.filter((a) => a > 1e-9).length;
  const nsv = cur.alpha.filter((a) => a > 1e-9).length;

  const lim = useMemo(() => {
    let v = 1.2;
    for (const p of train) v = Math.max(v, Math.abs(p.x) + 0.25, Math.abs(p.z) + 0.25);
    return r3(v);
  }, [train]);
  const sx = (x: number) => r3(PAD + ((x + lim) / (2 * lim)) * PLOT);
  const sy = (z: number) => r3(PAD + PLOT - ((z + lim) / (2 * lim)) * PLOT);

  // regions of the current model, as runs on an exact 7px grid
  const bands = useMemo(() => {
    const cell = PLOT / G;
    const step = (2 * lim) / G;
    const out: { x: number; y: number; w: number; fill: string }[] = [];
    for (let b = 0; b < G; b += 1) {
      const z = -lim + (b + 0.5) * step;
      let start = 0;
      let key = "";
      for (let a = 0; a <= G; a += 1) {
        const k = a < G ? (cur.score(-lim + (a + 0.5) * step, z) > 0 ? PINK : BLUE) : "";
        if (k !== key) {
          if (key) out.push({ x: PAD + start * cell, y: PAD + (G - 1 - b) * cell, w: (a - start) * cell, fill: key });
          start = a;
          key = k;
        }
      }
    }
    return { out, cell };
  }, [cur, lim]);

  // the exact boundary, as the cell edges where its sign changes
  const exactEdge = useMemo(() => {
    const cell = PLOT / G;
    const step = (2 * lim) / G;
    const sgn = (a: number, b: number) => exact.score(-lim + (a + 0.5) * step, -lim + (b + 0.5) * step) > 0;
    const segs: string[] = [];
    for (let a = 0; a < G; a += 1) {
      for (let b = 0; b < G; b += 1) {
        const x0 = r3(PAD + a * cell);
        const y0 = r3(PAD + (G - 1 - b) * cell);
        if (a + 1 < G && sgn(a, b) !== sgn(a + 1, b)) segs.push(`M${r3(x0 + cell)},${y0}v${r3(cell)}`);
        if (b + 1 < G && sgn(a, b) !== sgn(a, b + 1)) segs.push(`M${x0},${y0}h${r3(cell)}`);
      }
    }
    return segs.join("");
  }, [exact, lim]);

  const row = (yy: number, key: string, v: string, col = "var(--ink)", big = false) => (
    <>
      <text x={RX} y={yy} fontSize={11} fill="var(--muted)">
        {key}
      </text>
      <text x={RX + RW} y={yy} fontSize={big ? 15 : 12.5} textAnchor="end" fill={col} style={{ fontVariantNumeric: "tabular-nums" }}>
        {v}
      </text>
    </>
  );

  const bw = (RW - 3 * 3) / 4;
  const perPred = m === 0 ? nsvExact : m;

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden", background: "var(--panel)" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
        <rect x={0} y={0} width={W} height={H} fill="var(--canvas)" />

        <clipPath id="lml-plot">
          <rect x={PAD} y={PAD} width={PLOT} height={PLOT} />
        </clipPath>
        <g clipPath="url(#lml-plot)">
          {bands.out.map((c, i) => (
            <rect key={i} x={c.x} y={c.y} width={c.w} height={bands.cell} fill={c.fill} opacity={0.16} shapeRendering="crispEdges" />
          ))}
          {m !== 0 && <path d={exactEdge} stroke="var(--ink)" strokeWidth={1.3} strokeDasharray="3 2" fill="none" opacity={0.7} />}
          {train.map((p, i) => (
            <circle key={i} cx={sx(p.x)} cy={sy(p.z)} r={2.6} fill={p.y > 0 ? PINK : BLUE} opacity={0.75} />
          ))}
          {fit &&
            fit.landmarks.map((p, i) => (
              <circle key={`l${i}`} cx={sx(p.x)} cy={sy(p.z)} r={6.5} fill="none" stroke="var(--ink)" strokeWidth={1.8} />
            ))}
        </g>
        <rect x={PAD} y={PAD} width={PLOT} height={PLOT} fill="none" stroke="var(--border-strong)" />
        <text x={PAD + PLOT / 2} y={PAD + PLOT + 18} fontSize={11} fill="var(--muted)" textAnchor="middle">
          {m === 0 ? "the exact SVM: every support vector counts" : "rings: the landmarks · dashed: the exact boundary"}
        </text>

        {/* dial */}
        <text x={RX} y={PAD + 8} fontSize={10.5} fill="var(--muted)" letterSpacing="0.07em">
          LANDMARKS
        </text>
        {LANDMARKS.map((v, k) => {
          const on = k === mi;
          const x = RX + (k % 4) * (bw + 3);
          const yy = PAD + 16 + Math.floor(k / 4) * 28;
          return (
            <g key={v} style={{ cursor: "pointer" }} onClick={() => setMi(k)}>
              <rect x={r3(x)} y={yy} width={r3(bw)} height={22} rx={4} fill={on ? PINK : "transparent"} stroke={on ? PINK : "var(--border-strong)"} />
              <text x={r3(x + bw / 2)} y={yy + 15} fontSize={11} textAnchor="middle" fill={on ? "var(--canvas)" : "var(--muted)"}>
                {v === 0 ? "exact" : v}
              </text>
            </g>
          );
        })}

        {row(PAD + 104, "similarities per prediction", String(perPred))}
        {row(PAD + 122, "support vectors", `${nsv} of ${train.length}`)}
        {row(PAD + 140, "exact SVM on new points", exactAcc.toFixed(4))}
        {row(PAD + 166, "this model on 400 new points", curAcc.toFixed(4), PINK, true)}
        <text x={RX} y={PAD + 196} fontSize={11} fill="var(--muted)">
          {m === 0
            ? `one similarity per support vector`
            : curAcc >= exactAcc - 0.005
              ? `as good as exact, from ${m} similarities`
              : `${(100 * (exactAcc - curAcc)).toFixed(1)} points short of exact`}
        </text>
      </svg>
    </div>
  );
}
