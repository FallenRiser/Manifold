"use client";

import { useMemo, useState } from "react";

// A real CART decision tree grown client-side on 2-D data, shown TWO ways at
// once: the axis-aligned partition (the boxes) and the tree itself (the
// flowchart) — the two representations updating together as you drag depth, so
// "a tree is a set of boxes" and "a tree is a flowchart" become one picture.
//
// Two datasets make both of a tree's failure modes playable:
//   • Checkerboard (XOR + 10% noise): axis-aligned, so a tree nails it at depth
//     2 — the failure here is OVERFITTING (push depth, train→100%, test slips).
//   • Diagonal (y > x + noise): the boundary is diagonal, so the tree can only
//     approximate it with a STAIRCASE — the representational failure, visible as
//     the boxes stepping along the diagonal.
//
// Deterministic (mulberry32 + exact arithmetic) with every emitted coordinate
// rounded, so SSR and client render identically — no hydration mismatch.

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
type Node = Box & {
  leaf: boolean; pred: 0 | 1; feat?: 0 | 1; thr?: number; left?: Node; right?: Node;
  col?: number; row?: number;
};
type Kind = "xor" | "diag";

function makeData(seed: number, n: number, flip: number, kind: Kind): Pt[] {
  const r = mulberry32(seed);
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const x = r();
    const y = r();
    let c: 0 | 1 = kind === "xor" ? ((x > 0.5) !== (y > 0.5) ? 1 : 0) : y > x ? 1 : 0;
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
// tidy layout: assign each leaf a column slot, each internal node the midpoint
function assign(node: Node, row: number, slot: { v: number }): number {
  node.row = row;
  if (node.leaf) {
    node.col = slot.v;
    slot.v += 1;
    return row;
  }
  const dl = assign(node.left!, row + 1, slot);
  const dr = assign(node.right!, row + 1, slot);
  node.col = (node.left!.col! + node.right!.col!) / 2;
  return Math.max(dl, dr);
}
function collectNodes(node: Node, acc: Node[]) {
  acc.push(node);
  if (!node.leaf) {
    collectNodes(node.left!, acc);
    collectNodes(node.right!, acc);
  }
}

const DATA: Record<Kind, { train: Pt[]; test: Pt[] }> = {
  xor: { train: makeData(7, 90, 0.1, "xor"), test: makeData(99, 240, 0.1, "xor") },
  diag: { train: makeData(7, 90, 0.08, "diag"), test: makeData(99, 240, 0.08, "diag") },
};

const W = 300;
const H = 300;
const PAD = 10;
const f = (n: number) => Math.round(n * 100) / 100;
const px = (x: number) => f(PAD + x * (W - 2 * PAD));
const py = (y: number) => f(PAD + (1 - y) * (H - 2 * PAD));

const CLASS_COLOR = ["var(--c-regression)", "var(--c-classification)"];

export function DecisionTreeLab() {
  const [depth, setDepth] = useState(2);
  const [kind, setKind] = useState<Kind>("xor");

  const { leaves, nodes, nLeaves, maxRow, trainAcc, testAcc } = useMemo(() => {
    const { train, test } = DATA[kind];
    const root = build(train, 0, depth, { x0: 0, x1: 1, y0: 0, y1: 1 });
    const slot = { v: 0 };
    const maxRow = assign(root, 0, slot);
    const leaves: Node[] = [];
    collectLeaves(root, leaves);
    const nodes: Node[] = [];
    collectNodes(root, nodes);
    const acc = (data: Pt[]) => data.reduce((s, p) => s + (predict(root, p) === p.c ? 1 : 0), 0) / data.length;
    return { leaves, nodes, nLeaves: slot.v, maxRow, trainAcc: acc(train), testAcc: acc(test) };
  }, [depth, kind]);

  const showLabels = nLeaves <= 12;
  // tree-diagram geometry
  const slotW = showLabels ? 78 : Math.max(18, Math.min(34, 300 / Math.max(1, nLeaves)));
  const TW = Math.max(260, nLeaves * slotW);
  const rowH = 44;
  const TH = (maxRow + 1) * rowH + 24;
  const tx = (col: number) => f(slotW / 2 + col * slotW);
  const ty = (row: number) => f(20 + row * rowH);

  return (
    <div style={{ background: "var(--canvas)", border: "1px solid var(--border-strong)", borderRadius: 14, padding: "16px 16px 14px" }}>
      {/* controls */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", marginBottom: 14 }}>
        <div style={{ display: "inline-flex", gap: 6 }}>
          {(["xor", "diag"] as Kind[]).map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              style={{
                fontSize: 12.5, padding: "5px 11px", borderRadius: 999,
                border: `1px solid ${kind === k ? "var(--c-trees)" : "var(--border-strong)"}`,
                background: kind === k ? "color-mix(in srgb, var(--c-trees) 12%, var(--surface))" : "var(--surface)",
                color: kind === k ? "var(--c-trees)" : "var(--muted)", cursor: "pointer", fontWeight: kind === k ? 500 : 400,
              }}
            >
              {k === "xor" ? "Checkerboard" : "Diagonal"}
            </button>
          ))}
        </div>
        <label style={{ fontSize: 12.5, color: "var(--muted)", display: "inline-flex", alignItems: "center", gap: 8, flex: "1 1 180px" }}>
          Max depth <strong style={{ color: "var(--ink)" }}>{depth}</strong>
          <input type="range" min={1} max={8} step={1} value={depth} onChange={(e) => setDepth(Number(e.target.value))} style={{ flex: 1, accentColor: "var(--c-trees)" }} />
        </label>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-start" }}>
        {/* partition */}
        <div style={{ flex: "1 1 260px", minWidth: 240 }}>
          <div style={{ fontSize: 11, color: "var(--faint)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>The boxes</div>
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: 320, display: "block" }} role="img" aria-label="Decision tree partition of a 2-D feature space">
            {leaves.map((lf, i) => (
              <rect key={i} x={px(lf.x0)} y={py(lf.y1)} width={f((lf.x1 - lf.x0) * (W - 2 * PAD))} height={f((lf.y1 - lf.y0) * (H - 2 * PAD))} fill={CLASS_COLOR[lf.pred]} fillOpacity={0.13} stroke="var(--border-strong)" strokeWidth={0.75} />
            ))}
            {DATA[kind].train.map((p, i) => (
              <circle key={i} cx={px(p.x)} cy={py(p.y)} r={3.6} fill={CLASS_COLOR[p.c]} stroke="var(--surface)" strokeWidth={1} />
            ))}
            <text x={W / 2} y={H - 1} fontSize={10} textAnchor="middle" fill="var(--faint)">feature x₁</text>
            <text x={3} y={H / 2} fontSize={10} textAnchor="middle" fill="var(--faint)" transform={`rotate(-90 3 ${H / 2})`}>feature x₂</text>
          </svg>
        </div>

        {/* the tree */}
        <div style={{ flex: "1 1 300px", minWidth: 240 }}>
          <div style={{ fontSize: 11, color: "var(--faint)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>The tree that built them</div>
          <div style={{ overflowX: "auto" }}>
            <svg viewBox={`0 0 ${TW} ${TH}`} width="100%" style={{ minWidth: showLabels ? TW : Math.min(TW, 320), maxWidth: Math.max(TW, 320), display: "block" }} role="img" aria-label="The decision tree as a flowchart">
              {/* edges */}
              {nodes.filter((n) => !n.leaf).map((n, i) => (
                <g key={`e${i}`}>
                  <line x1={tx(n.col!)} y1={ty(n.row!)} x2={tx(n.left!.col!)} y2={ty(n.left!.row!)} stroke="var(--border-strong)" strokeWidth={1} />
                  <line x1={tx(n.col!)} y1={ty(n.row!)} x2={tx(n.right!.col!)} y2={ty(n.right!.row!)} stroke="var(--border-strong)" strokeWidth={1} />
                </g>
              ))}
              {/* nodes */}
              {nodes.map((n, i) => {
                if (n.leaf) {
                  return <circle key={`n${i}`} cx={tx(n.col!)} cy={ty(n.row!)} r={showLabels ? 8 : 5} fill={CLASS_COLOR[n.pred]} stroke="var(--surface)" strokeWidth={1.5} />;
                }
                if (!showLabels) {
                  return <circle key={`n${i}`} cx={tx(n.col!)} cy={ty(n.row!)} r={4} fill="var(--muted)" />;
                }
                const label = `${n.feat === 0 ? "x₁" : "x₂"} ≤ ${n.thr!.toFixed(2)}`;
                return (
                  <g key={`n${i}`}>
                    <rect x={tx(n.col!) - 34} y={ty(n.row!) - 11} width={68} height={22} rx={6} fill="var(--surface)" stroke="var(--border-strong)" strokeWidth={1} />
                    <text x={tx(n.col!)} y={ty(n.row!) + 3.5} fontSize={10.5} textAnchor="middle" fill="var(--ink)" style={{ fontFamily: "var(--font-geist-mono)" }}>{label}</text>
                  </g>
                );
              })}
            </svg>
          </div>
          {!showLabels && (
            <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 4 }}>
              Too many nodes to label — {nLeaves} leaves. A tree this bushy is memorising, not learning.
            </div>
          )}
        </div>
      </div>

      {/* readouts */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginTop: 16 }}>
        <Stat label="Leaves (regions)" value={String(nLeaves)} />
        <Bar label="Train accuracy" value={trainAcc} color="var(--c-trees)" />
        <Bar label="Test accuracy" value={testAcc} color="var(--brand-2)" />
      </div>
      <div style={{ display: "flex", gap: 14, marginTop: 12, fontSize: 12, color: "var(--muted)" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 999, background: CLASS_COLOR[0] }} /> class A</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 999, background: CLASS_COLOR[1] }} /> class B</span>
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
