"use client";

import { useEffect, useMemo, useState } from "react";

// The wisdom of many trees, made visual. The true boundary is a circle — which
// a single axis-aligned tree can only approximate with a jagged staircase, and
// which it draws differently every time the data is resampled (high variance).
// A random forest bags B such trees (each on a bootstrap sample, each split
// considering a random feature) and averages their votes. Drag B from 1 upward:
// the vote field (grid heatmap) melts from a hard jagged edge into a smooth
// circular boundary, and test accuracy climbs then stabilises.
//
// The B trees and their grid/test predictions are computed once; moving the
// slider just averages the first B — so it stays snappy. The heatmap is
// mount-gated (rendered only after mount) so SSR stays light and there is no
// hydration mismatch; the deterministic points render on the server too.

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Pt = { x: number; y: number; c: 0 | 1 };
type Node = { leaf: boolean; pred: 0 | 1; feat?: 0 | 1; thr?: number; left?: Node; right?: Node };

const CX = 0.5, CY = 0.5, R = 0.3;
function makeData(seed: number, n: number, flip: number): Pt[] {
  const r = mulberry32(seed);
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const x = r();
    const y = r();
    let c: 0 | 1 = (x - CX) ** 2 + (y - CY) ** 2 < R * R ? 1 : 0;
    if (r() < flip) c = (c ^ 1) as 0 | 1;
    pts.push({ x, y, c });
  }
  return pts;
}
function gini(pts: Pt[]): number {
  if (!pts.length) return 0;
  let n1 = 0;
  for (const p of pts) n1 += p.c;
  const p1 = n1 / pts.length;
  return 1 - p1 * p1 - (1 - p1) * (1 - p1);
}
function majority(pts: Pt[]): 0 | 1 {
  let n1 = 0;
  for (const p of pts) n1 += p.c;
  return (n1 * 2 >= pts.length ? 1 : 0) as 0 | 1;
}
// split considering only a random subset of features (max_features): the
// decorrelating trick. featPool is the features this split may use.
function bestSplit(pts: Pt[], featPool: (0 | 1)[]) {
  const base = gini(pts) * pts.length;
  let best: { feat: 0 | 1; thr: number } | null = null;
  let bestScore = base;
  for (const feat of featPool) {
    const vals = [...new Set(pts.map((p) => (feat === 0 ? p.x : p.y)))].sort((a, b) => a - b);
    for (let i = 0; i < vals.length - 1; i++) {
      const thr = (vals[i] + vals[i + 1]) / 2;
      const L = pts.filter((p) => (feat === 0 ? p.x : p.y) <= thr);
      const R2 = pts.filter((p) => (feat === 0 ? p.x : p.y) > thr);
      if (!L.length || !R2.length) continue;
      const score = gini(L) * L.length + gini(R2) * R2.length;
      if (score < bestScore - 1e-9) {
        bestScore = score;
        best = { feat, thr };
      }
    }
  }
  return best;
}
function grow(pts: Pt[], depth: number, maxDepth: number, rng: () => number, subsample: boolean): Node {
  const node: Node = { leaf: true, pred: majority(pts) };
  if (depth >= maxDepth || gini(pts) === 0 || pts.length < 3) return node;
  // full tree looks at both features; forest trees pick one at random per split
  const pool: (0 | 1)[] = subsample ? [rng() < 0.5 ? 0 : 1] : [0, 1];
  const s = bestSplit(pts, pool);
  if (!s) return node;
  const key = (p: Pt) => (s.feat === 0 ? p.x : p.y);
  node.leaf = false;
  node.feat = s.feat;
  node.thr = s.thr;
  node.left = grow(pts.filter((p) => key(p) <= s.thr), depth + 1, maxDepth, rng, subsample);
  node.right = grow(pts.filter((p) => key(p) > s.thr), depth + 1, maxDepth, rng, subsample);
  return node;
}
function predict(node: Node, x: number, y: number): 0 | 1 {
  let n = node;
  while (!n.leaf) n = (n.feat === 0 ? x : y) <= n.thr! ? n.left! : n.right!;
  return n.pred;
}
function bootstrap(pts: Pt[], rng: () => number): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < pts.length; i++) out.push(pts[Math.floor(rng() * pts.length)]);
  return out;
}

const TRAIN = makeData(11, 120, 0.08);
const TEST = makeData(707, 400, 0.08);
const MAXB = 40;
const G = 32; // grid resolution

const W = 300, H = 300, PAD = 8;
const f = (n: number) => Math.round(n * 100) / 100;
const sx = (x: number) => f(PAD + x * (W - 2 * PAD));
const sy = (y: number) => f(PAD + (1 - y) * (H - 2 * PAD));

const A = "var(--c-regression)"; // class 0
const B = "var(--c-classification)"; // class 1

export function ForestVoteLab() {
  const [nB, setNB] = useState(1);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  // build everything once: the single full tree + MAXB forest trees, and their
  // predictions on the grid and the test set
  const { gridVotes, testHits, singleGrid, singleAcc } = useMemo(() => {
    const rng = mulberry32(4242);
    const single = grow(TRAIN, 0, 9, rng, false);
    const trees: Node[] = [];
    for (let b = 0; b < MAXB; b++) trees.push(grow(bootstrap(TRAIN, rng), 0, 9, rng, true));

    // grid centres
    const gx: number[] = [];
    for (let i = 0; i < G; i++) gx.push((i + 0.5) / G);
    // per-tree grid vote (1 if class1) accumulated → gridVotes[b] holds cumulative sum after b+1 trees
    const gridVotes: Float32Array[] = [];
    const cum = new Float32Array(G * G);
    for (let b = 0; b < MAXB; b++) {
      for (let iy = 0; iy < G; iy++) {
        for (let ix = 0; ix < G; ix++) {
          cum[iy * G + ix] += predict(trees[b], gx[ix], gx[iy]);
        }
      }
      gridVotes.push(Float32Array.from(cum, (v) => v / (b + 1)));
    }
    // per-tree cumulative test hits
    const testCum = new Float32Array(TEST.length);
    const testHits: number[] = [];
    for (let b = 0; b < MAXB; b++) {
      let hit = 0;
      for (let i = 0; i < TEST.length; i++) {
        testCum[i] += predict(trees[b], TEST[i].x, TEST[i].y);
        const vote = testCum[i] / (b + 1) >= 0.5 ? 1 : 0;
        if (vote === TEST[i].c) hit++;
      }
      testHits.push(hit / TEST.length);
    }
    const singleGrid = new Uint8Array(G * G);
    for (let iy = 0; iy < G; iy++) for (let ix = 0; ix < G; ix++) singleGrid[iy * G + ix] = predict(single, gx[ix], gx[iy]);
    const singleAcc = TEST.reduce((s, p) => s + (predict(single, p.x, p.y) === p.c ? 1 : 0), 0) / TEST.length;
    return { gridVotes, testHits, singleGrid, singleAcc };
  }, []);

  const votes = nB === 1 ? Float32Array.from(singleGrid) : gridVotes[nB - 1];
  const forestAcc = testHits[nB - 1];
  const cell = (W - 2 * PAD) / G;

  return (
    <div style={{ background: "var(--canvas)", border: "1px solid var(--border-strong)", borderRadius: 14, padding: "16px 16px 14px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "flex-start" }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: 320, flex: "1 1 260px", display: "block" }} role="img" aria-label="A random forest's averaged vote field over a circular boundary">
          {/* vote heatmap (client-only) */}
          {ready && Array.from({ length: G * G }, (_, k) => {
            const ix = k % G, iy = Math.floor(k / G);
            const p = votes[k];
            return (
              <rect key={k} x={f(PAD + ix * cell)} y={f(PAD + (G - 1 - iy) * cell)} width={f(cell) + 0.5} height={f(cell) + 0.5}
                fill={`color-mix(in srgb, ${B} ${Math.round(p * 100)}%, ${A})`} fillOpacity={0.55} />
            );
          })}
          {/* true boundary */}
          <circle cx={sx(CX)} cy={sy(CY)} r={f(R * (W - 2 * PAD))} fill="none" stroke="var(--ink)" strokeWidth={1.25} strokeDasharray="4 4" opacity={0.5} />
          {/* training points */}
          {TRAIN.map((p, i) => (
            <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={2.8} fill={p.c === 1 ? B : A} stroke="var(--surface)" strokeWidth={0.8} />
          ))}
        </svg>

        <div style={{ flex: "1 1 200px", minWidth: 200 }}>
          <label style={{ fontSize: 12.5, color: "var(--muted)", display: "block", marginBottom: 6 }}>
            Trees in the forest: <strong style={{ color: "var(--ink)" }}>{nB}</strong>
          </label>
          <input type="range" min={1} max={MAXB} step={1} value={nB} onChange={(e) => setNB(Number(e.target.value))} style={{ width: "100%", accentColor: "var(--c-trees)" }} />
          <div style={{ display: "grid", gap: 9, marginTop: 16 }}>
            <Row label="One tree (test acc)" value={`${(singleAcc * 100).toFixed(1)}%`} />
            <Row label={nB === 1 ? "This forest (1 tree, test acc)" : `This forest (${nB} trees, test acc)`} value={`${(forestAcc * 100).toFixed(1)}%`} strong />
          </div>
          <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.55, marginTop: 14 }}>
            Dashed circle = the true boundary. At <strong>1 tree</strong> the field is a hard, jagged
            staircase; drag up and the averaged vote softens into a smooth ring.
          </p>
          <div style={{ display: "flex", gap: 14, marginTop: 10, fontSize: 12, color: "var(--muted)" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 999, background: A }} /> outside</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 999, background: B }} /> inside</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 13 }}>
      <span style={{ color: "var(--muted)" }}>{label}</span>
      <span className="font-display" style={{ fontWeight: 600, color: strong ? "var(--c-trees)" : "var(--ink)" }}>{value}</span>
    </div>
  );
}
