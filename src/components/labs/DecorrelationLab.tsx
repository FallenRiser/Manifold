"use client";

import { useEffect, useMemo, useState } from "react";

// The random-subspace trick as a dial. On a 12-feature dataset (only 4 of them
// informative), a forest is built for every max_features m from 1 to 12, and we
// measure two things per m: the mean pairwise correlation of the trees, and the
// forest's test accuracy. The correlation curve climbs steadily with m — smaller
// m = more decorrelated trees. But accuracy is weak at m=1 (each split is nearly
// blind, so trees are too weak to be worth averaging), then flattens. The lesson
// isn't a razor-sharp optimum; it's the trade-off, with √p as the sane default.
//
// Forests are built once on mount (deterministic), so the curves are fixed; the
// slider just moves the marker. Mount-gated compute keeps SSR trivial.

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const P = 12, INFO = 4;
type Row = { x: number[]; c: 0 | 1 };
function makeData(seed: number, n: number): Row[] {
  const r = mulberry32(seed);
  const rows: Row[] = [];
  for (let i = 0; i < n; i++) {
    const x: number[] = [];
    for (let j = 0; j < P; j++) x.push(r());
    const s = (x[0] > 0.5 ? 1 : 0) + (x[1] > 0.5 ? 1 : 0) + (x[2] > 0.5 ? 1 : 0) + (x[3] > 0.5 ? 1 : 0);
    let c: 0 | 1 = s >= 2 ? 1 : 0;
    if (r() < 0.1) c = (c ^ 1) as 0 | 1;
    rows.push({ x, c });
  }
  return rows;
}
type Node = { leaf: boolean; pred: 0 | 1; f?: number; t?: number; L?: Node; R?: Node };
function gini(rows: Row[]) {
  if (!rows.length) return 0;
  let n1 = 0;
  for (const q of rows) n1 += q.c;
  const a = n1 / rows.length;
  return 1 - a * a - (1 - a) * (1 - a);
}
function maj(rows: Row[]): 0 | 1 {
  let n1 = 0;
  for (const q of rows) n1 += q.c;
  return (n1 * 2 >= rows.length ? 1 : 0) as 0 | 1;
}
function best(rows: Row[], pool: number[]) {
  const base = gini(rows) * rows.length;
  let b: { f: number; t: number } | null = null;
  let bs = base;
  for (const f of pool) {
    const vals = [...new Set(rows.map((q) => q.x[f]))].sort((a, b) => a - b);
    for (let i = 0; i < vals.length - 1; i++) {
      const t = (vals[i] + vals[i + 1]) / 2;
      const L = rows.filter((q) => q.x[f] <= t), R = rows.filter((q) => q.x[f] > t);
      if (!L.length || !R.length) continue;
      const s = gini(L) * L.length + gini(R) * R.length;
      if (s < bs - 1e-9) { bs = s; b = { f, t }; }
    }
  }
  return b;
}
function pickPool(m: number, rng: () => number) {
  const idx = [...Array(P).keys()];
  for (let i = P - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1));[idx[i], idx[j]] = [idx[j], idx[i]]; }
  return idx.slice(0, m);
}
function grow(rows: Row[], d: number, rng: () => number, m: number): Node {
  const n: Node = { leaf: true, pred: maj(rows) };
  if (d >= 10 || gini(rows) === 0 || rows.length < 3) return n;
  const s = best(rows, pickPool(m, rng));
  if (!s) return n;
  n.leaf = false; n.f = s.f; n.t = s.t;
  n.L = grow(rows.filter((q) => q.x[s.f] <= s.t), d + 1, rng, m);
  n.R = grow(rows.filter((q) => q.x[s.f] > s.t), d + 1, rng, m);
  return n;
}
function pred(n: Node, x: number[]): 0 | 1 {
  let c = n;
  while (!c.leaf) c = x[c.f!] <= c.t! ? c.L! : c.R!;
  return c.pred;
}
function boot(rows: Row[], rng: () => number) {
  const o: Row[] = [];
  for (let i = 0; i < rows.length; i++) o.push(rows[Math.floor(rng() * rows.length)]);
  return o;
}

const SQRTP = Math.round(Math.sqrt(P)); // the usual default, ≈3–4

const CW = 400, PADX = 34, PADYT = 14, chartH = 84, gap = 26;
const fx = (m: number) => Math.round((PADX + (m - 1) / (P - 1) * (CW - PADX - 14)) * 100) / 100;

export function DecorrelationLab() {
  const [m, setM] = useState(SQRTP);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  const { corr, acc } = useMemo(() => {
    const TR = makeData(1, 220), TE = makeData(2, 400);
    const corr: number[] = [], acc: number[] = [];
    for (let mm = 1; mm <= P; mm++) {
      const rng = mulberry32(9000 + mm);
      const B = 18;
      const trees: Node[] = [];
      for (let b = 0; b < B; b++) trees.push(grow(boot(TR, rng), 0, rng, mm));
      const preds = trees.map((t) => TE.map((pt) => pred(t, pt.x)));
      let sum = 0, cnt = 0;
      for (let i = 0; i < B; i++)
        for (let j = i + 1; j < B; j++) {
          const a = preds[i], b = preds[j];
          const ma = a.reduce((s: number, v) => s + v, 0) / a.length, mb = b.reduce((s: number, v) => s + v, 0) / b.length;
          let nu = 0, da = 0, db = 0;
          for (let k = 0; k < a.length; k++) { nu += (a[k] - ma) * (b[k] - mb); da += (a[k] - ma) ** 2; db += (b[k] - mb) ** 2; }
          sum += nu / Math.sqrt(da * db || 1); cnt++;
        }
      corr.push(sum / cnt);
      const cum = new Float32Array(TE.length);
      for (const t of trees) for (let i = 0; i < TE.length; i++) cum[i] += pred(t, TE[i].x);
      let hit = 0;
      for (let i = 0; i < TE.length; i++) if ((cum[i] / B >= 0.5 ? 1 : 0) === TE[i].c) hit++;
      acc.push(hit / TE.length);
    }
    return { corr, acc };
  }, []);

  const corrMax = Math.max(...corr, 0.01) * 1.15;
  const accLo = Math.min(...acc) - 0.03, accHi = Math.max(...acc) + 0.03;
  const totalH = PADYT * 2 + chartH * 2 + gap;
  // top panel = accuracy; bottom panel = correlation
  const yA = (v: number) => Math.round((PADYT + chartH - ((v - accLo) / (accHi - accLo)) * chartH) * 100) / 100;
  const yCorr = (v: number) => Math.round((PADYT + chartH + gap + chartH - (v / corrMax) * chartH) * 100) / 100;

  return (
    <div style={{ background: "var(--canvas)", border: "1px solid var(--border-strong)", borderRadius: 14, padding: "16px 16px 14px" }}>
      {ready ? (
        <svg viewBox={`0 0 ${CW} ${totalH}`} width="100%" style={{ maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Tree correlation and forest accuracy versus max_features">
          {/* accuracy panel (top) */}
          <text x={PADX} y={PADYT - 2} fontSize={10} fill="var(--muted)">forest accuracy</text>
          <line x1={PADX} y1={PADYT + chartH} x2={CW - 14} y2={PADYT + chartH} stroke="var(--border-strong)" strokeWidth={1} />
          <polyline points={acc.map((v, i) => `${fx(i + 1)},${yA(v)}`).join(" ")} fill="none" stroke="var(--c-trees)" strokeWidth={2} />
          {acc.map((v, i) => <circle key={i} cx={fx(i + 1)} cy={yA(v)} r={2.4} fill="var(--c-trees)" />)}

          {/* correlation panel (bottom) */}
          <text x={PADX} y={PADYT + chartH + gap - 2} fontSize={10} fill="var(--muted)">tree-to-tree correlation ρ</text>
          <line x1={PADX} y1={PADYT + chartH + gap + chartH} x2={CW - 14} y2={PADYT + chartH + gap + chartH} stroke="var(--border-strong)" strokeWidth={1} />
          <polyline points={corr.map((v, i) => `${fx(i + 1)},${yCorr(v)}`).join(" ")} fill="none" stroke="var(--brand-2)" strokeWidth={2} />
          {corr.map((v, i) => <circle key={i} cx={fx(i + 1)} cy={yCorr(v)} r={2.4} fill="var(--brand-2)" />)}

          {/* shared marker */}
          <line x1={fx(m)} y1={PADYT - 4} x2={fx(m)} y2={totalH - PADYT} stroke="var(--ink)" strokeWidth={1.25} strokeDasharray="3 3" />
          {/* sqrt(p) default tick */}
          <line x1={fx(SQRTP)} y1={totalH - PADYT + 2} x2={fx(SQRTP)} y2={totalH - PADYT + 8} stroke="var(--good)" strokeWidth={1.5} />
          <text x={fx(SQRTP)} y={totalH - 2} fontSize={9} textAnchor="middle" fill="var(--good)">√p</text>
          <text x={PADX} y={totalH - 2} fontSize={9} fill="var(--faint)">m=1</text>
          <text x={CW - 14} y={totalH - 2} fontSize={9} textAnchor="end" fill="var(--faint)">m={P}</text>
        </svg>
      ) : (
        <div style={{ height: 240, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--faint)", fontSize: 13 }}>building forests…</div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", marginTop: 12 }}>
        <label style={{ fontSize: 12.5, color: "var(--muted)", display: "inline-flex", alignItems: "center", gap: 8, flex: "1 1 220px" }}>
          max_features m = <strong style={{ color: "var(--ink)" }}>{m}</strong>
          <input type="range" min={1} max={P} step={1} value={m} onChange={(e) => setM(Number(e.target.value))} style={{ flex: 1, accentColor: "var(--c-trees)" }} />
        </label>
        {ready && (
          <div style={{ display: "flex", gap: 16, fontSize: 13 }}>
            <span style={{ color: "var(--muted)" }}>ρ <strong style={{ color: "var(--brand-2)" }}>{corr[m - 1].toFixed(2)}</strong></span>
            <span style={{ color: "var(--muted)" }}>acc <strong style={{ color: "var(--c-trees)" }}>{(acc[m - 1] * 100).toFixed(1)}%</strong></span>
          </div>
        )}
      </div>
    </div>
  );
}
