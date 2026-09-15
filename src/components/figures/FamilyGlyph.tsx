// Signature visuals for the shelf — one per family, drawn at 88×50.
//
// House rule (PROJECT.md §12.2.4): a figure exists to make an argument, so none of these is an
// abstract squiggle. Wherever the mathematics IS the point, the geometry below is computed for
// real at module load: the regression line is a least-squares fit of the dots drawn beside it,
// the clusters come from Lloyd's iterations, the PCA axis is the leading eigenvector of the
// cloud's covariance, the tree's cuts are the Gini-optimal thresholds, and the descent path is
// actual gradient descent on the quadratic whose contours are drawn under it. The rest are
// structural diagrams of the object itself (a network's layers, a grid-world policy, a k-fold
// split), which is the only honest thing to draw when there is no data in the idea.
//
// Everything inherits --accent from the shelf row, so a glyph is always its family's colour.

const W = 88;
const H = 50;

/* ---------- deterministic helpers: same picture on every build ---------- */
const lcg = (seed: number) => {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
};
const gauss = (r: () => number) => Math.sqrt(-2 * Math.log(r() + 1e-12)) * Math.cos(2 * Math.PI * r());
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const f = (n: number) => Math.round(n * 10) / 10;

type Pt = [number, number];

/* ---------- 1. Regression: a real least-squares fit ---------- */
const REGRESSION = (() => {
  const r = lcg(11);
  const pts: Pt[] = [];
  for (let i = 0; i < 12; i++) {
    const x = 8 + i * 6.2;
    pts.push([x, clamp(40 - (x - 8) * 0.38 + gauss(r) * 4.2, 7, 43)]);
  }
  const n = pts.length;
  const mx = pts.reduce((a, p) => a + p[0], 0) / n;
  const my = pts.reduce((a, p) => a + p[1], 0) / n;
  const slope =
    pts.reduce((a, p) => a + (p[0] - mx) * (p[1] - my), 0) /
    pts.reduce((a, p) => a + (p[0] - mx) ** 2, 0);
  const at = (x: number) => my + slope * (x - mx);
  return { pts, x0: 5, y0: at(5), x1: 83, y1: at(83) };
})();

/* ---------- 2. Classification: the boundary between two clouds ---------- */
const CLASSIFICATION = (() => {
  const r = lcg(23);
  const blob = (cx: number, cy: number, n: number): Pt[] =>
    Array.from({ length: n }, () => [clamp(cx + gauss(r) * 7, 5, 83), clamp(cy + gauss(r) * 6, 6, 44)]);
  const a = blob(26, 17, 8);
  const b = blob(60, 35, 8);
  const mean = (p: Pt[]): Pt => [p.reduce((s, q) => s + q[0], 0) / p.length, p.reduce((s, q) => s + q[1], 0) / p.length];
  const [ax, ay] = mean(a);
  const [bx, by] = mean(b);
  // the perpendicular bisector of the class means — the boundary when the clouds share a shape
  const mx = (ax + bx) / 2;
  const my = (ay + by) / 2;
  const dx = bx - ax;
  const dy = by - ay;
  const t = 46 / Math.hypot(dx, dy);
  return { a, b, x0: mx - dy * t, y0: my + dx * t, x1: mx + dy * t, y1: my - dx * t };
})();

/* ---------- 3. Trees: the Gini-optimal axis-aligned cuts ---------- */
const TREES = (() => {
  const r = lcg(5);
  const pts = Array.from({ length: 26 }, () => {
    const x = 6 + r() * 76;
    const y = 5 + r() * 40;
    return { x, y, c: (x > 44 ? 1 : 0) ^ (y > 26 ? 1 : 0) };
  });
  const gini = (g: typeof pts) => {
    if (!g.length) return 0;
    const p = g.filter((q) => q.c === 1).length / g.length;
    return 2 * p * (1 - p) * g.length;
  };
  const bestCut = (g: typeof pts, axis: "x" | "y", lo: number, hi: number) => {
    let best = { score: Infinity, at: (lo + hi) / 2 };
    for (let v = lo + 4; v < hi - 4; v += 1.5) {
      const s = gini(g.filter((q) => q[axis] < v)) + gini(g.filter((q) => q[axis] >= v));
      if (s < best.score) best = { score: s, at: v };
    }
    return best.at;
  };
  const xc = bestCut(pts, "x", 6, 82);
  const left = pts.filter((q) => q.x < xc);
  const right = pts.filter((q) => q.x >= xc);
  return { pts, xc, yl: bestCut(left, "y", 5, 45), yr: bestCut(right, "y", 5, 45) };
})();

/* ---------- 4. Clustering: eight Lloyd's iterations ---------- */
const CLUSTERING = (() => {
  const r = lcg(41);
  const centres: Pt[] = [[20, 15], [66, 14], [44, 39]];
  const pts: Pt[] = centres.flatMap(([cx, cy]) =>
    Array.from({ length: 7 }, () => [clamp(cx + gauss(r) * 6, 5, 83), clamp(cy + gauss(r) * 5, 6, 44)] as Pt),
  );
  let mu: Pt[] = [[14, 30], [50, 12], [70, 36]];
  let assign: number[] = [];
  for (let it = 0; it < 8; it++) {
    assign = pts.map((p) => {
      let bi = 0;
      let bd = Infinity;
      mu.forEach((m, i) => {
        const d = (p[0] - m[0]) ** 2 + (p[1] - m[1]) ** 2;
        if (d < bd) { bd = d; bi = i; }
      });
      return bi;
    });
    mu = mu.map((m, i) => {
      const own = pts.filter((_, k) => assign[k] === i);
      return own.length
        ? ([own.reduce((s, q) => s + q[0], 0) / own.length, own.reduce((s, q) => s + q[1], 0) / own.length] as Pt)
        : m;
    });
  }
  return { pts, assign, mu };
})();

/* ---------- 5. Dimensionality reduction: the leading eigenvector ---------- */
const DIMRED = (() => {
  const r = lcg(77);
  const pts: Pt[] = Array.from({ length: 16 }, () => {
    const t = gauss(r) * 17;
    const u = gauss(r) * 4;
    return [clamp(44 + t * 0.92 - u * 0.39, 5, 83), clamp(25 + t * 0.39 + u * 0.92, 6, 44)];
  });
  const mx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
  const my = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  let sxx = 0, syy = 0, sxy = 0;
  for (const [x, y] of pts) { sxx += (x - mx) ** 2; syy += (y - my) ** 2; sxy += (x - mx) * (y - my); }
  // closed-form leading eigenvector of a 2x2 covariance
  const th = 0.5 * Math.atan2(2 * sxy, sxx - syy);
  const L = 40;
  return {
    pts, mx, my,
    x0: mx - Math.cos(th) * L, y0: my - Math.sin(th) * L,
    x1: mx + Math.cos(th) * L, y1: my + Math.sin(th) * L,
  };
})();

/* ---------- 6. Neural networks: the object is the wiring ---------- */
const NEURAL = (() => {
  const cols = [
    { x: 14, ys: [14, 25, 36] },
    { x: 44, ys: [9, 20, 31, 42] },
    { x: 74, ys: [19, 32] },
  ];
  const r = lcg(3);
  const edges: { x1: number; y1: number; x2: number; y2: number; o: number }[] = [];
  for (let c = 0; c < cols.length - 1; c++)
    for (const y1 of cols[c].ys)
      for (const y2 of cols[c + 1].ys)
        edges.push({ x1: cols[c].x, y1, x2: cols[c + 1].x, y2, o: 0.14 + r() * 0.5 });
  return { cols, edges };
})();

/* ---------- 7. Reinforcement learning: a policy through a grid ---------- */
const RL = (() => {
  const cell = 10, ox = 14, oy = 5;
  const path: Pt[] = [[0, 3], [1, 3], [1, 2], [2, 2], [2, 1], [3, 1], [4, 1], [4, 0]];
  return {
    cell, ox, oy, cols: 6, rows: 4,
    pts: path.map(([c, r]) => [ox + c * cell + cell / 2, oy + r * cell + cell / 2] as Pt),
    goal: [ox + 4 * cell, oy + 0 * cell] as Pt,
  };
})();

/* ---------- 8. Optimization: real gradient descent on the drawn bowl ---------- */
const OPTIM = (() => {
  // f(x, y) = 0.055 x² + 0.32 y², contours are the ellipses; the path is its own gradient descent
  const a = 0.055, b = 0.32, lr = 1.35;
  let p: Pt = [-32, 15];
  const path: Pt[] = [p];
  for (let i = 0; i < 11; i++) {
    p = [p[0] - lr * 2 * a * p[0], p[1] - lr * 2 * b * p[1]];
    path.push(p);
  }
  return { rings: [1, 0.66, 0.34], path: path.map(([x, y]) => [44 + x, 25 + y] as Pt) };
})();

/* ---------- 9. Evaluation: an ROC curve from two score distributions ---------- */
const ROC = (() => {
  const r = lcg(19);
  const neg = Array.from({ length: 60 }, () => gauss(r));
  const pos = Array.from({ length: 60 }, () => gauss(r) + 1.9);
  const pts: Pt[] = [];
  for (let t = 4.5; t >= -3.2; t -= 0.28) {
    const tpr = pos.filter((v) => v >= t).length / pos.length;
    const fpr = neg.filter((v) => v >= t).length / neg.length;
    pts.push([8 + fpr * 70, 44 - tpr * 37]);
  }
  return pts;
})();

/* ---------- 10–13. structural diagrams ---------- */
const FOLDS = [0, 1, 2, 3, 4];

/* Learning theory: which side of the line each point falls on is computed, not asserted, so the
   filled/hollow labelling always agrees with the line that is drawn. */
const THEORY = ([[22, 14], [44, 30], [66, 17]] as Pt[]).map(([x, y]) => ({
  x, y,
  above: (x - 12) * (8 - 42) - (y - 42) * (78 - 12) > 0,
}));

export type GlyphKind =
  | "regression" | "classification" | "trees" | "clustering" | "dimred" | "neural" | "rl"
  | "workflow" | "metrics" | "selection" | "math" | "theory" | "optimization";

const dot = (p: Pt, i: number, extra: Record<string, unknown> = {}) => (
  <circle key={i} cx={f(p[0])} cy={f(p[1])} r={1.7} {...extra} />
);

export function FamilyGlyph({ kind }: { kind: GlyphKind }) {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      aria-hidden="true"
      focusable="false"
      style={{ display: "block", overflow: "visible" }}
    >
      {kind === "regression" && (
        <g>
          {REGRESSION.pts.map((p, i) => dot(p, i, { fill: "var(--accent)", opacity: 0.55 }))}
          <line
            x1={f(REGRESSION.x0)} y1={f(REGRESSION.y0)} x2={f(REGRESSION.x1)} y2={f(REGRESSION.y1)}
            stroke="var(--accent)" strokeWidth={1.6} strokeLinecap="round"
          />
        </g>
      )}

      {kind === "classification" && (
        <g>
          <line
            x1={f(CLASSIFICATION.x0)} y1={f(CLASSIFICATION.y0)} x2={f(CLASSIFICATION.x1)} y2={f(CLASSIFICATION.y1)}
            stroke="var(--accent)" strokeWidth={1.5} strokeDasharray="3 2.5" strokeLinecap="round"
          />
          {CLASSIFICATION.a.map((p, i) => dot(p, i, { fill: "var(--accent)" }))}
          {CLASSIFICATION.b.map((p, i) => (
            <circle key={`b${i}`} cx={f(p[0])} cy={f(p[1])} r={1.9} fill="none" stroke="var(--accent)" strokeWidth={1.1} />
          ))}
        </g>
      )}

      {kind === "trees" && (
        <g>
          <line x1={f(TREES.xc)} y1={3} x2={f(TREES.xc)} y2={47} stroke="var(--accent)" strokeWidth={1.4} />
          <line x1={3} y1={f(TREES.yl)} x2={f(TREES.xc)} y2={f(TREES.yl)} stroke="var(--accent)" strokeWidth={1.2} opacity={0.75} />
          <line x1={f(TREES.xc)} y1={f(TREES.yr)} x2={85} y2={f(TREES.yr)} stroke="var(--accent)" strokeWidth={1.2} opacity={0.75} />
          {TREES.pts.map((p, i) => (
            <circle key={i} cx={f(p.x)} cy={f(p.y)} r={1.6} fill="var(--accent)" opacity={p.c ? 0.85 : 0.42} />
          ))}
        </g>
      )}

      {kind === "clustering" && (
        <g>
          {CLUSTERING.pts.map((p, i) => dot(p, i, { fill: "var(--accent)", opacity: [0.9, 0.62, 0.38][CLUSTERING.assign[i]] }))}
          {CLUSTERING.mu.map((m, i) => (
            <g key={`m${i}`} stroke="var(--accent)" strokeWidth={1.5} strokeLinecap="round">
              <line x1={f(m[0] - 3)} y1={f(m[1])} x2={f(m[0] + 3)} y2={f(m[1])} />
              <line x1={f(m[0])} y1={f(m[1] - 3)} x2={f(m[0])} y2={f(m[1] + 3)} />
            </g>
          ))}
        </g>
      )}

      {kind === "dimred" && (
        <g>
          {DIMRED.pts.map((p, i) => dot(p, i, { fill: "var(--accent)", opacity: 0.45 }))}
          <line
            x1={f(DIMRED.x0)} y1={f(DIMRED.y0)} x2={f(DIMRED.x1)} y2={f(DIMRED.y1)}
            stroke="var(--accent)" strokeWidth={1.6} strokeLinecap="round"
          />
        </g>
      )}

      {kind === "neural" && (
        <g>
          {NEURAL.edges.map((e, i) => (
            <line key={i} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke="var(--accent)" strokeWidth={0.8} opacity={e.o} />
          ))}
          {NEURAL.cols.map((c, ci) =>
            c.ys.map((y, yi) => (
              <circle key={`${ci}-${yi}`} cx={c.x} cy={y} r={2.6} fill="var(--paper)" stroke="var(--accent)" strokeWidth={1.3} />
            )),
          )}
        </g>
      )}

      {kind === "rl" && (
        <g>
          {Array.from({ length: RL.rows + 1 }, (_, i) => (
            <line key={`h${i}`} x1={RL.ox} y1={RL.oy + i * RL.cell} x2={RL.ox + RL.cols * RL.cell} y2={RL.oy + i * RL.cell}
              stroke="var(--accent)" strokeWidth={0.6} opacity={0.3} />
          ))}
          {Array.from({ length: RL.cols + 1 }, (_, i) => (
            <line key={`v${i}`} x1={RL.ox + i * RL.cell} y1={RL.oy} x2={RL.ox + i * RL.cell} y2={RL.oy + RL.rows * RL.cell}
              stroke="var(--accent)" strokeWidth={0.6} opacity={0.3} />
          ))}
          <rect x={RL.goal[0]} y={RL.goal[1]} width={RL.cell} height={RL.cell} fill="var(--accent)" opacity={0.2} />
          <polyline
            points={RL.pts.map((p) => `${f(p[0])},${f(p[1])}`).join(" ")}
            fill="none" stroke="var(--accent)" strokeWidth={1.7} strokeLinejoin="round" strokeLinecap="round"
          />
          <circle cx={f(RL.pts[0][0])} cy={f(RL.pts[0][1])} r={2} fill="var(--accent)" />
        </g>
      )}

      {kind === "optimization" && (
        <g>
          {OPTIM.rings.map((s, i) => (
            <ellipse key={i} cx={44} cy={25} rx={34 * s} ry={14 * s} fill="none" stroke="var(--accent)" strokeWidth={0.7} opacity={0.3} />
          ))}
          <polyline
            points={OPTIM.path.map((p) => `${f(p[0])},${f(p[1])}`).join(" ")}
            fill="none" stroke="var(--accent)" strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round"
          />
          <circle cx={f(OPTIM.path[0][0])} cy={f(OPTIM.path[0][1])} r={2} fill="var(--accent)" />
        </g>
      )}

      {kind === "metrics" && (
        <g>
          <line x1={8} y1={44} x2={78} y2={44} stroke="var(--accent)" strokeWidth={0.7} opacity={0.35} />
          <line x1={8} y1={44} x2={8} y2={6} stroke="var(--accent)" strokeWidth={0.7} opacity={0.35} />
          <line x1={8} y1={44} x2={78} y2={7} stroke="var(--accent)" strokeWidth={0.7} strokeDasharray="2 2.5" opacity={0.45} />
          <polyline
            points={ROC.map((p) => `${f(p[0])},${f(p[1])}`).join(" ")}
            fill="none" stroke="var(--accent)" strokeWidth={1.7} strokeLinejoin="round" strokeLinecap="round"
          />
        </g>
      )}

      {kind === "selection" && (
        <g>
          {FOLDS.map((row) =>
            FOLDS.map((col) => (
              <rect
                key={`${row}-${col}`}
                x={8 + col * 14.4} y={5 + row * 8.4} width={12.4} height={6.4} rx={1.4}
                fill="var(--accent)" opacity={row === col ? 0.85 : 0.16}
              />
            )),
          )}
        </g>
      )}

      {kind === "workflow" && (
        <g>
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              <rect x={6 + i * 20} y={18} width={14} height={14} rx={2.4} fill="var(--accent)" opacity={0.18 + i * 0.22} />
              {i < 3 && (
                <line x1={21.5 + i * 20} y1={25} x2={24.5 + i * 20} y2={25} stroke="var(--accent)" strokeWidth={1.2} opacity={0.6} />
              )}
            </g>
          ))}
        </g>
      )}

      {kind === "math" && (
        <g stroke="var(--accent)" fill="none" strokeLinecap="round">
          <line x1={12} y1={42} x2={54} y2={12} strokeWidth={1.5} />
          <line x1={12} y1={42} x2={44} y2={40} strokeWidth={1.5} />
          <line x1={54} y1={12} x2={80} y2={10} strokeWidth={0.9} strokeDasharray="2.5 2.5" opacity={0.55} />
          <line x1={44} y1={40} x2={80} y2={10} strokeWidth={0.9} strokeDasharray="2.5 2.5" opacity={0.55} />
          <line x1={12} y1={42} x2={80} y2={10} strokeWidth={1.9} />
          <circle cx={12} cy={42} r={2} fill="var(--accent)" stroke="none" />
        </g>
      )}

      {kind === "theory" && (
        <g>
          {/* three points and a line that realises one of their labellings — shattering, in miniature.
              THEORY_SIDE is the actual side test, so the fills cannot disagree with the line. */}
          <line x1={12} y1={42} x2={78} y2={8} stroke="var(--accent)" strokeWidth={1.5} strokeLinecap="round" />
          {THEORY.map((p, i) => (
            <circle
              key={i} cx={p.x} cy={p.y} r={2.7}
              fill={p.above ? "var(--accent)" : "none"}
              stroke="var(--accent)" strokeWidth={1.4}
            />
          ))}
        </g>
      )}
    </svg>
  );
}

/** Group name → glyph. Kept here so the shelf stays declarative. */
export const GLYPH_FOR: Record<string, GlyphKind> = {
  Regression: "regression",
  Classification: "classification",
  "Trees & ensembles": "trees",
  Clustering: "clustering",
  "Dimensionality reduction": "dimred",
  "Neural networks": "neural",
  "Reinforcement learning": "rl",
  "The data workflow": "workflow",
  "Evaluation & metrics": "metrics",
  "Model selection": "selection",
  "Math foundations": "math",
  "Learning theory": "theory",
  Optimization: "optimization",
};
