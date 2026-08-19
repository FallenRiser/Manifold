"use client";

import { useMemo, useState } from "react";

// A real CART decision tree, grown client-side on 2-D data, with a depth knob.
// One manipulable cause (max depth) → one visible effect (the axis-aligned
// staircase boundary) → three readouts (leaves, train accuracy, test accuracy).
// The data is a noisy checkerboard: a single split can't separate it (≈50%),
// depth 2 captures the four quadrants, and past that the tree starts chasing the
// 10% label noise — train accuracy marches to 100% while test accuracy stalls
// then slips. That gap IS overfitting, made playable.
//
// Deterministic (mulberry32 seed + exact arithmetic), and every emitted SVG
// coordinate is rounded, so server and client render identically — no hydration
// mismatch, no mount-gating needed.

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
type Box = { x0: number; x1: number; y0: number; y1: number };
type Node = Box & { leaf: boolean; pred: 0 | 1; feat?: 0 | 1; thr?: number; left?: Node; right?: Node };

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
  if (pts.length === 0) return 0;
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

function bestSplit(pts: Pt[]) {
  const base = gini(pts) * pts.length; // count-weighted impurity
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

function build(pts: Pt[], depth: number, maxDepth: number, box: Box): Node {
  const node: Node = { ...box, leaf: true, pred: majority(pts) };
  if (depth >= maxDepth || gini(pts) === 0 || pts.length < 2) return node;
  const s = bestSplit(pts);
  if (!s) return node;
  const key = (p: Pt) => (s.feat === 0 ? p.x : p.y);
  const L = pts.filter((p) => key(p) <= s.thr);
  const R = pts.filter((p) => key(p) > s.thr);
  node.leaf = false;
  node.feat = s.feat;
  node.thr = s.thr;
  const lbox: Box = { ...box };
  const rbox: Box = { ...box };
  if (s.feat === 0) {
    lbox.x1 = s.thr;
    rbox.x0 = s.thr;
  } else {
    lbox.y1 = s.thr;
    rbox.y0 = s.thr;
  }
  node.left = build(L, depth + 1, maxDepth, lbox);
  node.right = build(R, depth + 1, maxDepth, rbox);
  return node;
}

function predict(node: Node, p: Pt): 0 | 1 {
  if (node.leaf) return node.pred;
  const v = node.feat === 0 ? p.x : p.y;
  return v <= node.thr! ? predict(node.left!, p) : predict(node.right!, p);
}
function collectLeaves(node: Node, acc: Node[]) {
  if (node.leaf) acc.push(node);
  else {
    collectLeaves(node.left!, acc);
    collectLeaves(node.right!, acc);
  }
}

const TRAIN = makeData(7, 90, 0.1);
const TEST = makeData(99, 240, 0.1);

const W = 360;
const H = 300;
const PAD = 10;
const f = (n: number) => Math.round(n * 100) / 100;
const px = (x: number) => f(PAD + x * (W - 2 * PAD));
const py = (y: number) => f(PAD + (1 - y) * (H - 2 * PAD));

const CLASS_COLOR = ["var(--c-regression)", "var(--c-classification)"];

export function DecisionTreeLab() {
  const [depth, setDepth] = useState(2);

  const { leaves, trainAcc, testAcc } = useMemo(() => {
    const root = build(TRAIN, 0, depth, { x0: 0, x1: 1, y0: 0, y1: 1 });
    const leaves: Node[] = [];
    collectLeaves(root, leaves);
    const acc = (data: Pt[]) => data.reduce((s, p) => s + (predict(root, p) === p.c ? 1 : 0), 0) / data.length;
    return { leaves, trainAcc: acc(TRAIN), testAcc: acc(TEST) };
  }, [depth]);

  return (
    <div
      style={{
        background: "var(--canvas)",
        border: "1px solid var(--border-strong)",
        borderRadius: 14,
        padding: "16px 16px 14px",
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: 18, alignItems: "flex-start" }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: 380, flex: "1 1 300px", display: "block" }} role="img" aria-label="Decision tree partition of a 2-D feature space">
          {/* leaf regions — the staircase boundary */}
          {leaves.map((lf, i) => (
            <rect
              key={i}
              x={px(lf.x0)}
              y={py(lf.y1)}
              width={f((lf.x1 - lf.x0) * (W - 2 * PAD))}
              height={f((lf.y1 - lf.y0) * (H - 2 * PAD))}
              fill={CLASS_COLOR[lf.pred]}
              fillOpacity={0.13}
              stroke="var(--border-strong)"
              strokeWidth={0.75}
            />
          ))}
          {/* training points */}
          {TRAIN.map((p, i) => (
            <circle key={i} cx={px(p.x)} cy={py(p.y)} r={4} fill={CLASS_COLOR[p.c]} stroke="var(--surface)" strokeWidth={1} />
          ))}
          {/* axis labels */}
          <text x={W / 2} y={H - 1} fontSize={10} textAnchor="middle" fill="var(--faint)">feature x₁</text>
          <text x={3} y={H / 2} fontSize={10} textAnchor="middle" fill="var(--faint)" transform={`rotate(-90 3 ${H / 2})`}>feature x₂</text>
        </svg>

        <div style={{ flex: "1 1 200px", minWidth: 190 }}>
          <label style={{ fontSize: 12.5, color: "var(--muted)", display: "block", marginBottom: 6 }}>
            Max depth: <strong style={{ color: "var(--ink)" }}>{depth}</strong>
          </label>
          <input
            type="range"
            min={1}
            max={8}
            step={1}
            value={depth}
            onChange={(e) => setDepth(Number(e.target.value))}
            style={{ width: "100%", accentColor: "var(--c-trees)" }}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8, marginTop: 16 }}>
            <Stat label="Leaves (regions)" value={String(leaves.length)} />
            <Bar label="Train accuracy" value={trainAcc} color="var(--c-trees)" />
            <Bar label="Test accuracy" value={testAcc} color="var(--brand-2)" />
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 14, fontSize: 12, color: "var(--muted)" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 9, height: 9, borderRadius: 999, background: CLASS_COLOR[0] }} /> class A
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 9, height: 9, borderRadius: 999, background: CLASS_COLOR[1] }} /> class B
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 13 }}>
      <span style={{ color: "var(--muted)" }}>{label}</span>
      <span className="font-display" style={{ fontWeight: 600, color: "var(--ink)" }}>{value}</span>
    </div>
  );
}

function Bar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 13, marginBottom: 3 }}>
        <span style={{ color: "var(--muted)" }}>{label}</span>
        <span className="font-display" style={{ fontWeight: 600, color: "var(--ink)" }}>{(value * 100).toFixed(1)}%</span>
      </div>
      <div style={{ height: 6, borderRadius: 999, background: "var(--surface-2)", overflow: "hidden" }}>
        <div style={{ width: `${(value * 100).toFixed(1)}%`, height: "100%", background: color, borderRadius: 999 }} />
      </div>
    </div>
  );
}
