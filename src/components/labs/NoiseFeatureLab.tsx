"use client";

import { useMemo, useState } from "react";

// Two real features and k columns of pure noise. All three models are refitted at every stop on
// the dial, in the browser: the default rbf SVM (page 14's smoFit, gamma='scale'),
// sklearn-default logistic regression (Newton's method), and a 100-tree random forest. The
// chart is accuracy on 400 new points; the picture is the chosen model's boundary on the two
// real features, with every noise column held at its average.
//
// Held by scripts/svm_noise_check.mjs against `python scripts/svm_cases.py noisefeat` -- the
// SVM and logistic regression exactly, the forest against the spread of twenty sklearn forests.

import { NOISE_K, forestFit, logregFit, noiseData, noiseMatrix, rbfSmoD } from "./svmSolver";

const W = 560;
const PAD = 16;
const CW = 238;
const CH = 190;
const CY = PAD + 16;
const PLOT = 252;
const PX = W - PAD - PLOT;
const H = 392;
const PINK = "var(--c-classification)";
const BLUE = "var(--c-regression)";
const GREEN = "var(--c-trees)";
const MODELS = [
  { key: "svm", label: "rbf SVM", col: PINK },
  { key: "logreg", label: "log. reg.", col: BLUE },
  { key: "forest", label: "forest", col: GREEN },
] as const;
type Key = (typeof MODELS)[number]["key"];

const r3 = (v: number) => Math.round(v * 1000) / 1000;
const YLO = 0.75;

export default function NoiseFeatureLab() {
  const [ki, setKi] = useState(0);
  const [pick, setPick] = useState<Key>("svm");
  const { train } = useMemo(() => noiseData(), []);

  const stops = useMemo(
    () =>
      NOISE_K.map((k) => {
        const M = noiseMatrix(k);
        const svm = rbfSmoD(M.A, M.yA, 1, M.gamma);
        const logreg = logregFit(M.A, M.yA);
        const forest = forestFit(M.A, M.yA);
        const acc = (s: (x: number[]) => number) =>
          M.B.filter((x, i) => Math.sign(s(x)) === M.yB[i]).length / M.B.length;
        return {
          k,
          M,
          score: { svm: svm.score, logreg: logreg.score, forest: forest.score } as Record<Key, (x: number[]) => number>,
          acc: { svm: acc(svm.score), logreg: acc(logreg.score), forest: acc(forest.score) } as Record<Key, number>,
          nsv: svm.alpha.filter((a) => a > 1e-9).length,
        };
      }),
    [],
  );
  const cur = stops[ki];

  // chart
  const cx = (i: number) => r3(PAD + 18 + (i * (CW - 30)) / (NOISE_K.length - 1));
  const cy = (a: number) => r3(CY + CH - ((Math.max(YLO, a) - YLO) / (1 - YLO)) * CH);

  // picture, in the original units of the two real features
  const lim = useMemo(() => {
    let m = 1.2;
    for (const p of train) m = Math.max(m, Math.abs(p.x) + 0.25, Math.abs(p.z) + 0.25);
    return r3(m);
  }, [train]);
  const sx = (x: number) => r3(PX + ((x + lim) / (2 * lim)) * PLOT);
  const sy = (z: number) => r3(PAD + PLOT - ((z + lim) / (2 * lim)) * PLOT);

  const bands = useMemo(() => {
    const G = 28;
    const cell = PLOT / G;
    const step = (2 * lim) / G;
    const { mu, sd } = cur.M;
    const d = 2 + cur.k;
    const s = cur.score[pick];
    const out: { x: number; y: number; w: number; fill: string }[] = [];
    for (let b = 0; b < G; b += 1) {
      const z = -lim + (b + 0.5) * step;
      let start = 0;
      let key = "";
      const flush = (end: number) => {
        if (key && end > start) out.push({ x: PX + start * cell, y: PAD + (G - 1 - b) * cell, w: (end - start) * cell, fill: key });
      };
      for (let a = 0; a <= G; a += 1) {
        let k = "";
        if (a < G) {
          const x = -lim + (a + 0.5) * step;
          const v = new Array(d).fill(0);
          v[0] = (x - mu[0]) / sd[0];
          v[1] = (z - mu[1]) / sd[1];
          k = s(v) > 0 ? PINK : BLUE;
        }
        if (k !== key) {
          flush(a);
          start = a;
          key = k;
        }
      }
    }
    return { out, cell };
  }, [cur, pick, lim]);

  const button = (x: number, y: number, bw: number, label: string, on: boolean, onClick: () => void, key: string, col = PINK) => (
    <g key={key} style={{ cursor: "pointer" }} onClick={onClick}>
      <rect x={r3(x)} y={y} width={r3(bw)} height={22} rx={4} fill={on ? col : "transparent"} stroke={on ? col : "var(--border-strong)"} />
      <text x={r3(x + bw / 2)} y={y + 15} fontSize={11} textAnchor="middle" fill={on ? "var(--canvas)" : "var(--muted)"}>
        {label}
      </text>
    </g>
  );

  const row = (y: number, key: string, v: string, col = "var(--ink)", big = false) => (
    <>
      <text x={PAD} y={y} fontSize={11} fill={col === "var(--ink)" ? "var(--muted)" : col}>
        {key}
      </text>
      <text x={PAD + CW} y={y} fontSize={big ? 15 : 12.5} textAnchor="end" fill={col} style={{ fontVariantNumeric: "tabular-nums" }}>
        {v}
      </text>
    </>
  );

  const DY = CY + CH + 34;
  const kbw = (CW - 6 * 3) / 7;
  const RY = DY + 50;

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden", background: "var(--panel)" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
        <rect x={0} y={0} width={W} height={H} fill="var(--canvas)" />

        {/* accuracy against k */}
        <text x={PAD} y={PAD + 2} fontSize={10.5} fill="var(--muted)" letterSpacing="0.07em">
          ACCURACY ON 400 NEW POINTS
        </text>
        <rect x={r3(cx(ki) - 11)} y={CY} width={22} height={CH} fill="var(--ink)" opacity={0.07} />
        {[0.75, 0.8, 0.85, 0.9, 0.95, 1].map((a) => (
          <g key={a}>
            <line x1={PAD + 18} x2={PAD + CW - 12} y1={cy(a)} y2={cy(a)} stroke="var(--border-strong)" strokeDasharray="2 3" opacity={0.6} />
            <text x={PAD + 12} y={cy(a) + 3} fontSize={9} fill="var(--muted)" textAnchor="end">
              {a === 1 ? "1.00" : a.toFixed(2).slice(1)}
            </text>
          </g>
        ))}
        {MODELS.map((m) => (
          <g key={m.key}>
            <polyline points={stops.map((s, i) => `${cx(i)},${cy(s.acc[m.key])}`).join(" ")} fill="none" stroke={m.col} strokeWidth={2} />
            {stops.map((s, i) => (
              <circle key={i} cx={cx(i)} cy={cy(s.acc[m.key])} r={i === ki ? 4.2 : 2.6} fill={m.col} />
            ))}
          </g>
        ))}
        {NOISE_K.map((k, i) => (
          <text key={k} x={cx(i)} y={CY + CH + 13} fontSize={9.5} fill="var(--muted)" textAnchor="middle">
            {k}
          </text>
        ))}
        <text x={PAD + CW / 2} y={CY + CH + 26} fontSize={9.5} fill="var(--muted)" textAnchor="middle">
          noise columns added (k)
        </text>

        {/* dial */}
        {NOISE_K.map((k, i) => button(PAD + i * (kbw + 3), DY, kbw, String(k), i === ki, () => setKi(i), `k${k}`))}

        {/* readouts */}
        {row(RY, "real features' share of each distance", (2 / (2 + cur.k)).toFixed(3))}
        {row(RY + 18, "SVM support vectors (of 200)", String(cur.nsv))}
        {MODELS.map((m, j) => (
          <g key={m.key}>{row(RY + 40 + j * 18, m.label, cur.acc[m.key].toFixed(4), m.col, false)}</g>
        ))}

        {/* the picture */}
        <clipPath id="nfl-plot">
          <rect x={PX} y={PAD} width={PLOT} height={PLOT} />
        </clipPath>
        <g clipPath="url(#nfl-plot)">
          {bands.out.map((c, i) => (
            <rect key={i} x={c.x} y={c.y} width={c.w} height={bands.cell} fill={c.fill} opacity={0.16} shapeRendering="crispEdges" />
          ))}
          {train.map((p, i) => (
            <circle key={i} cx={sx(p.x)} cy={sy(p.z)} r={2.6} fill={p.y > 0 ? PINK : BLUE} opacity={0.8} />
          ))}
        </g>
        <rect x={PX} y={PAD} width={PLOT} height={PLOT} fill="none" stroke="var(--border-strong)" />
        {MODELS.map((m, j) => {
          const bw = (PLOT - 8) / 3;
          return button(PX + j * (bw + 4), PAD + PLOT + 10, bw, m.label, pick === m.key, () => setPick(m.key), `m${m.key}`, m.col);
        })}
        <text x={PX + PLOT / 2} y={PAD + PLOT + 50} fontSize={11} fill="var(--muted)" textAnchor="middle">
          the 2 real features · noise held at its average
        </text>
        <text x={PX + PLOT / 2} y={PAD + PLOT + 66} fontSize={11} fill="var(--muted)" textAnchor="middle">
          {cur.k === 0 ? "no noise columns yet" : `${cur.k} more dimension${cur.k > 1 ? "s" : ""} the picture cannot show`}
        </text>
      </svg>
    </div>
  );
}
