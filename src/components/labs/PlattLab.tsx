"use client";

import { useMemo, useState } from "react";

// From a score to a probability. The 200 new points sit at their decision value f, pushed up if
// they are really +1 and down if they are -1; the curve is what each spot on the f axis is
// turned into. The squash, 1/(1 + e^-f), is fixed, so it cannot follow the score as C
// stretches or shrinks it. Platt's sigmoid is fitted, so it can -- on the training scores, or
// on scores each point got from a model that never saw it.
//
// Every SVM is page 14's smoFit; Platt's fit is a two-parameter Newton solve. Held by
// scripts/svm_platt_check.mjs against `python scripts/svm_cases.py scale`.

import { PLATT_C, gridPoints, plattFit, plattStop, sigmoidAt } from "./svmSolver";

const W = 560;
const PAD = 16;
const PW = 300;
const PH = 210;
const PY = PAD + 14;
const RX = PAD + PW + 22;
const RW = W - PAD - RX;
const H = 340;
const PINK = "var(--c-classification)";
const BLUE = "var(--c-regression)";

type Mode = "squash" | "train" | "cv";
const MODES: [Mode, string][] = [
  ["squash", "squash the score"],
  ["train", "Platt: training scores"],
  ["cv", "Platt: held-out scores"],
];

const r3 = (v: number) => Math.round(v * 1000) / 1000;

export default function PlattLab() {
  const [ci, setCi] = useState(4);
  const [mode, setMode] = useState<Mode>("squash");
  const { train, val } = useMemo(() => gridPoints(), []);
  const C = PLATT_C[ci];
  const st = useMemo(() => plattStop(train, val, C), [train, val, C]);
  const y = useMemo(() => train.map((p) => p.y), [train]);

  const { A, B } = useMemo(() => {
    if (mode === "squash") return { A: -1, B: 0 };
    return plattFit(mode === "train" ? st.ft : st.fcv, y);
  }, [mode, st, y]);

  const probs = useMemo(() => st.fv.map((f) => sigmoidAt(f, A, B)), [st, A, B]);

  const stats = useMemo(() => {
    let ll = 0;
    let ok = 0;
    probs.forEach((p, i) => {
      const t = val[i].y > 0 ? 1 : 0;
      const q = Math.min(1 - 1e-15, Math.max(1e-15, p));
      ll -= t * Math.log(q) + (1 - t) * Math.log(1 - q);
      if (Math.sign(st.fv[i]) === val[i].y) ok += 1;
    });
    const bins = [0, 1, 2, 3, 4].map((k) => {
      let n = 0;
      let said = 0;
      let hap = 0;
      probs.forEach((p, i) => {
        if (Math.min(4, Math.floor(p * 5)) !== k) return;
        n += 1;
        said += p;
        hap += val[i].y > 0 ? 1 : 0;
      });
      return { n, said: n ? said / n : 0, hap: n ? hap / n : 0 };
    });
    const sorted = st.fv.map(Math.abs).sort((a, b) => a - b);
    return { ll: ll / probs.length, acc: ok / probs.length, bins, p90: sorted[Math.floor(0.9 * sorted.length)] };
  }, [probs, st, val]);

  const L = useMemo(() => {
    let m = 0;
    for (const f of st.fv) m = Math.max(m, Math.abs(f));
    return r3(Math.max(0.2, m * 1.05));
  }, [st]);
  const fx = (f: number) => r3(PAD + ((f + L) / (2 * L)) * PW);
  const py = (p: number) => r3(PY + PH - p * PH);

  const curve = (a: number, b: number) => {
    const pts: string[] = [];
    for (let k = 0; k <= 120; k += 1) {
      const f = -L + (2 * L * k) / 120;
      pts.push(`${fx(f)},${py(sigmoidAt(f, a, b))}`);
    }
    return pts.join(" ");
  };

  const button = (x: number, yy: number, bw: number, label: string, on: boolean, onClick: () => void, key: string, fs = 11) => (
    <g key={key} style={{ cursor: "pointer" }} onClick={onClick}>
      <rect x={r3(x)} y={yy} width={r3(bw)} height={22} rx={4} fill={on ? PINK : "transparent"} stroke={on ? PINK : "var(--border-strong)"} />
      <text x={r3(x + bw / 2)} y={yy + 15} fontSize={fs} textAnchor="middle" fill={on ? "var(--canvas)" : "var(--muted)"}>
        {label}
      </text>
    </g>
  );

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

  // the reliability chart
  const RY = PAD + 94;
  const RH = 92;
  const bw = RW / 5;

  const DY = PY + PH + 42;
  const dbw = (PW - 8 * 3) / 9;

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden", background: "var(--panel)" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
        <rect x={0} y={0} width={W} height={H} fill="var(--canvas)" />

        {/* score -> probability */}
        <text x={PAD} y={PAD + 2} fontSize={10.5} fill="var(--muted)" letterSpacing="0.07em">
          PROBABILITY OF +1, AGAINST THE SCORE f
        </text>
        <rect x={PAD} y={PY} width={PW} height={PH} fill="none" stroke="var(--border-strong)" />
        {[0.5].map((p) => (
          <line key={p} x1={PAD} x2={PAD + PW} y1={py(p)} y2={py(p)} stroke="var(--border-strong)" strokeDasharray="2 3" />
        ))}
        {[-1, 1].map((m) =>
          Math.abs(m) < L ? (
            <g key={m}>
              <line x1={fx(m)} x2={fx(m)} y1={PY} y2={PY + PH} stroke="var(--border-strong)" strokeDasharray="2 3" />
              <text x={fx(m)} y={PY + PH - 4} fontSize={9.5} fill="var(--muted)" textAnchor="middle">
                {m > 0 ? "+1" : "−1"}
              </text>
            </g>
          ) : null,
        )}
        {st.fv.map((f, i) => {
          const jit = (((i * 37) % 23) / 23 - 0.5) * 0.09;
          const p = val[i].y > 0 ? 0.93 + jit : 0.07 + jit;
          return <circle key={i} cx={fx(f)} cy={py(p)} r={2.4} fill={val[i].y > 0 ? PINK : BLUE} opacity={0.6} />;
        })}
        {mode !== "squash" && (
          <polyline points={curve(-1, 0)} fill="none" stroke="var(--muted)" strokeWidth={1.4} strokeDasharray="4 3" />
        )}
        <polyline points={curve(A, B)} fill="none" stroke="var(--ink)" strokeWidth={2} />
        <text x={PAD} y={PY + PH + 14} fontSize={9.5} fill="var(--muted)">
          {(-L).toFixed(2)}
        </text>
        <text x={PAD + PW / 2} y={PY + PH + 14} fontSize={9.5} fill="var(--muted)" textAnchor="middle">
          f = 0 · dashed verticals: the margin
        </text>
        <text x={PAD + PW} y={PY + PH + 14} fontSize={9.5} fill="var(--muted)" textAnchor="end">
          {L.toFixed(2)}
        </text>

        {/* C dial */}
        <text x={PAD} y={DY - 6} fontSize={10.5} fill="var(--muted)" letterSpacing="0.07em">
          C (GAMMA = 1)
        </text>
        {PLATT_C.map((c, k) => button(PAD + k * (dbw + 3), DY, dbw, String(c), k === ci, () => setCi(k), `c${c}`, 9.5))}
        <text x={PAD + PW / 2} y={DY + 42} fontSize={11} fill="var(--muted)" textAnchor="middle">
          {mode === "squash" ? "solid: the squash 1/(1+e^−f)" : "solid: Platt's fitted sigmoid · dashed: the squash"}
        </text>

        {/* mode */}
        {MODES.map(([m, label], k) => button(RX, PAD + k * 26, RW, label, mode === m, () => setMode(m), m))}

        {/* reliability */}
        <text x={RX} y={RY - 8} fontSize={10.5} fill="var(--muted)" letterSpacing="0.07em">
          SAID VS HAPPENED, 200 NEW POINTS
        </text>
        <rect x={RX} y={RY} width={RW} height={RH} fill="none" stroke="var(--border-strong)" />
        <line x1={RX} y1={RY + RH} x2={RX + RW} y2={RY} stroke="var(--muted)" strokeDasharray="3 3" />
        {stats.bins.map((b, k) =>
          b.n ? (
            <g key={k}>
              <rect x={r3(RX + k * bw + 5)} y={r3(RY + RH - b.hap * RH)} width={r3(bw - 10)} height={r3(b.hap * RH)} fill={PINK} opacity={0.35} />
              <line x1={r3(RX + k * bw + 3)} x2={r3(RX + (k + 1) * bw - 3)} y1={r3(RY + RH - b.said * RH)} y2={r3(RY + RH - b.said * RH)} stroke="var(--ink)" strokeWidth={2} />
              <text x={r3(RX + k * bw + bw / 2)} y={RY + RH + 12} fontSize={9} fill="var(--muted)" textAnchor="middle">
                {b.n}
              </text>
            </g>
          ) : null,
        )}
        <text x={RX + RW / 2} y={RY + RH + 25} fontSize={9.5} fill="var(--muted)" textAnchor="middle">
          bar: share that were +1 · line: what was said
        </text>

        {row(RY + RH + 50, "score spread (90% within ±)", stats.p90.toFixed(3))}
        {row(RY + RH + 68, "A, B", `${A.toFixed(2)}, ${B.toFixed(2)}`)}
        {row(RY + RH + 86, "accuracy on new points", stats.acc.toFixed(3))}
        {row(RY + RH + 110, "log loss on new points", stats.ll.toFixed(4), PINK, true)}
      </svg>
    </div>
  );
}
