"use client";

import { useMemo, useState } from "react";

// Real cost-complexity (weakest-link) pruning, played on a slider. Grow a full
// tree on noisy 2-D data, then repeatedly collapse the internal node with the
// smallest per-leaf error cost g(t) — the exact CART pruning sequence. Dragging
// α walks that sequence: the tree shrinks, training accuracy falls monotonically,
// and validation accuracy traces an inverted-U that peaks at the right size.
// "Snap to best" jumps to the α cross-validation would pick.
//
// Deterministic data + arithmetic, rounded coordinates → SSR-safe.

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
type Node = {
  leaf: boolean; pred: 0 | 1; err: number; n: number;
  feat?: 0 | 1; thr?: number; left?: Node; right?: Node;
};

function makeData(seed: number, n: number, flip: number): Pt[] {
  const r = mulberry32(seed);
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const x = r();
    const y = r();
    let c: 0 | 1 = (x > 0.5) !== (y > 0.5) ? 1 : 0;
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
function majErr(pts: Pt[]): { pred: 0 | 1; err: number } {
  let n1 = 0;
  for (const p of pts) n1 += p.c;
  const pred: 0 | 1 = (n1 * 2 >= pts.length ? 1 : 0) as 0 | 1;
  const err = pred === 1 ? pts.length - n1 : n1;
  return { pred, err };
}
function bestSplit(pts: Pt[]) {
  const base = gini(pts) * pts.length;
  let best: { feat: 0 | 1; thr: number } | null = null;
  let bestScore = base;
  for (const feat of [0, 1] as const) {
    const vals = [...new Set(pts.map((p) => (feat === 0 ? p.x : p.y)))].sort((a, b) => a - b);
    for (let i = 0; i < vals.length - 1; i++) {
      const thr = (vals[i] + vals[i + 1]) / 2;
      const L = pts.filter((p) => (feat === 0 ? p.x : p.y) <= thr);
      const R = pts.filter((p) => (feat === 0 ? p.x : p.y) > thr);
      if (!L.length || !R.length) continue;
      const score = gini(L) * L.length + gini(R) * R.length;
      if (score < bestScore - 1e-9) {
        bestScore = score;
        best = { feat, thr };
      }
    }
  }
  return best;
}
function grow(pts: Pt[], depth: number): Node {
  const { pred, err } = majErr(pts);
  const node: Node = { leaf: true, pred, err, n: pts.length };
  if (depth >= 10 || gini(pts) === 0 || pts.length < 2) return node;
  const s = bestSplit(pts);
  if (!s) return node;
  const key = (p: Pt) => (s.feat === 0 ? p.x : p.y);
  node.leaf = false;
  node.feat = s.feat;
  node.thr = s.thr;
  node.left = grow(pts.filter((p) => key(p) <= s.thr), depth + 1);
  node.right = grow(pts.filter((p) => key(p) > s.thr), depth + 1);
  return node;
}
function predict(node: Node, p: Pt): 0 | 1 {
  if (node.leaf) return node.pred;
  const v = node.feat === 0 ? p.x : p.y;
  return v <= node.thr! ? predict(node.left!, p) : predict(node.right!, p);
}
// subtree stats: number of leaves and total resubstitution error
function subStats(node: Node): { leaves: number; err: number } {
  if (node.leaf) return { leaves: 1, err: node.err };
  const l = subStats(node.left!);
  const r = subStats(node.right!);
  return { leaves: l.leaves + r.leaves, err: l.err + r.err };
}
type Stage = { alpha: number; leaves: number; trainAcc: number; testAcc: number };

const TRAIN = makeData(7, 90, 0.15);
const TEST = makeData(202, 240, 0.15);
const N = TRAIN.length;

// build the full weakest-link pruning sequence once
const STAGES: Stage[] = (() => {
  const stages: Stage[] = [];
  let tree = grow(TRAIN, 0);
  const snap = (alpha: number): Stage => {
    const { leaves } = subStats(tree);
    const acc = (data: Pt[]) => data.reduce((s, p) => s + (predict(tree, p) === p.c ? 1 : 0), 0) / data.length;
    return { alpha, leaves, trainAcc: acc(TRAIN), testAcc: acc(TEST) };
  };
  stages.push(snap(0));
  while (!tree.leaf) {
    // find the internal node with the smallest g(t)
    let weakest: Node | null = null;
    let minG = Infinity;
    const visit = (node: Node) => {
      if (node.leaf) return;
      const { leaves, err } = subStats(node);
      const g = (node.err - err) / N / (leaves - 1); // per-leaf error cost, as a rate
      if (g < minG) {
        minG = g;
        weakest = node;
      }
      visit(node.left!);
      visit(node.right!);
    };
    visit(tree);
    if (!weakest) break;
    // collapse it
    const w = weakest as Node;
    w.leaf = true;
    w.left = undefined;
    w.right = undefined;
    stages.push(snap(minG));
  }
  return stages;
})();

const BEST = STAGES.reduce((bi, s, i, arr) => (s.testAcc > arr[bi].testAcc ? i : bi), 0);

export function PruningLab() {
  const [i, setI] = useState(Math.round(STAGES.length / 2));
  const stage = STAGES[Math.min(i, STAGES.length - 1)];

  // chart geometry
  const CW = 380, CH = 190, cpad = 34;
  const S = STAGES.length - 1;
  const cx = (idx: number) => Math.round((cpad + (idx / S) * (CW - 2 * cpad)) * 100) / 100;
  const accs = STAGES.flatMap((s) => [s.trainAcc, s.testAcc]);
  const lo = Math.min(...accs) - 0.02;
  const hi = Math.max(...accs) + 0.02;
  const cy = (a: number) => Math.round((CH - cpad - ((a - lo) / (hi - lo)) * (CH - 2 * cpad)) * 100) / 100;
  const line = (pick: (s: Stage) => number) => STAGES.map((s, idx) => `${cx(idx)},${cy(pick(s))}`).join(" ");

  return (
    <div style={{ background: "var(--canvas)", border: "1px solid var(--border-strong)", borderRadius: 14, padding: "16px 16px 14px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "flex-start" }}>
        {/* the train/validation curve */}
        <div style={{ flex: "1 1 320px", minWidth: 280 }}>
          <svg viewBox={`0 0 ${CW} ${CH}`} width="100%" style={{ display: "block" }} role="img" aria-label="Training and validation accuracy as the tree is pruned">
            <line x1={cpad} y1={CH - cpad} x2={CW - cpad} y2={CH - cpad} stroke="var(--border-strong)" strokeWidth={1} />
            <line x1={cpad} y1={cpad - 8} x2={cpad} y2={CH - cpad} stroke="var(--border-strong)" strokeWidth={1} />
            {/* current-position marker */}
            <line x1={cx(i)} y1={cpad - 8} x2={cx(i)} y2={CH - cpad} stroke="var(--ink)" strokeWidth={1.5} strokeDasharray="3 3" />
            {/* best marker */}
            <line x1={cx(BEST)} y1={cpad - 8} x2={cx(BEST)} y2={CH - cpad} stroke="var(--good)" strokeWidth={1} strokeDasharray="2 4" opacity={0.7} />
            <polyline points={line((s) => s.trainAcc)} fill="none" stroke="var(--c-trees)" strokeWidth={2} />
            <polyline points={line((s) => s.testAcc)} fill="none" stroke="var(--brand-2)" strokeWidth={2} />
            <circle cx={cx(i)} cy={cy(stage.trainAcc)} r={3.5} fill="var(--c-trees)" />
            <circle cx={cx(i)} cy={cy(stage.testAcc)} r={3.5} fill="var(--brand-2)" />
            <text x={cpad} y={CH - cpad + 14} fontSize={9.5} fill="var(--faint)">full tree</text>
            <text x={CW - cpad} y={CH - cpad + 14} fontSize={9.5} textAnchor="end" fill="var(--faint)">root only</text>
            <text x={CW / 2} y={CH - 4} fontSize={10} textAnchor="middle" fill="var(--faint)">← more pruning (α increasing) →</text>
          </svg>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, fontSize: 12, color: "var(--muted)", marginTop: 2, flexWrap: "wrap" }}>
            <Leg color="var(--c-trees)" label="train" />
            <Leg color="var(--brand-2)" label="validation" />
            <Leg color="var(--good)" label="best α" dashed />
          </div>
        </div>

        {/* readouts + the current pruned tree */}
        <div style={{ flex: "1 1 200px", minWidth: 200 }}>
          <label style={{ fontSize: 12.5, color: "var(--muted)", display: "block", marginBottom: 6 }}>
            Pruning strength α = <strong style={{ color: "var(--ink)" }}>{stage.alpha.toFixed(4)}</strong>
          </label>
          <input type="range" min={0} max={STAGES.length - 1} step={1} value={i} onChange={(e) => setI(Number(e.target.value))} style={{ width: "100%", accentColor: "var(--c-trees)" }} />
          <div style={{ display: "grid", gap: 8, marginTop: 14 }}>
            <Row label="Leaves" value={String(stage.leaves)} />
            <Row label="Train accuracy" value={`${(stage.trainAcc * 100).toFixed(1)}%`} />
            <Row label="Validation accuracy" value={`${(stage.testAcc * 100).toFixed(1)}%`} strong />
          </div>
          <button
            onClick={() => setI(BEST)}
            style={{ marginTop: 14, fontSize: 13, fontWeight: 500, padding: "6px 13px", borderRadius: 10, border: "1px solid var(--c-trees)", background: i === BEST ? "color-mix(in srgb, var(--c-trees) 12%, var(--surface))" : "var(--surface)", color: "var(--c-trees)", cursor: "pointer" }}
          >
            Snap to best α
          </button>
          <div style={{ fontSize: 12, color: i === BEST ? "var(--good)" : "var(--muted)", marginTop: 8, lineHeight: 1.5 }}>
            {i === BEST
              ? `✓ Validation peaks here — ${STAGES[BEST].leaves} leaves, the tree CV would keep.`
              : i < BEST
                ? "This tree is bigger than the validation optimum — some branches are noise."
                : "Pruned past the optimum — you've cut real signal now."}
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
      <span className="font-display" style={{ fontWeight: 600, color: strong ? "var(--brand-2)" : "var(--ink)" }}>{value}</span>
    </div>
  );
}
function Leg({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 16, height: 0, borderTop: `2px ${dashed ? "dashed" : "solid"} ${color}` }} />
      {label}
    </span>
  );
}
