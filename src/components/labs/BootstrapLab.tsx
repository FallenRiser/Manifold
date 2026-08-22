"use client";

import { useState } from "react";

// A bootstrap sample, made concrete. Thirty training rows; each "draw" picks n
// rows WITH replacement, so some rows land twice or thrice (darker/bigger) and
// — reliably — about a third are never picked at all (the out-of-bag rows,
// shown hollow). Redraw a few times and the ~63.2% in-bag / ~36.8% out-of-bag
// split holds every time. That leftover third is free validation data.
//
// Deterministic per seed; the seed lives in state and the button bumps it, so
// first render is stable (no hydration mismatch).

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const N = 30;
const COLS = 6;
const cellW = 46, cellH = 40, PADX = 14, PADY = 12;
const W = PADX * 2 + COLS * cellW;
const ROWS = Math.ceil(N / COLS);
const H = PADY * 2 + ROWS * cellH;

export function BootstrapLab() {
  const [seed, setSeed] = useState(3);

  const r = mulberry32(seed * 2654435761);
  const counts = new Array(N).fill(0);
  for (let i = 0; i < N; i++) counts[Math.floor(r() * N)]++;
  const inBag = counts.filter((c) => c > 0).length;
  const oob = N - inBag;

  const fill = (c: number) =>
    c === 0 ? "var(--surface)" : `color-mix(in srgb, var(--c-trees) ${Math.min(70, 22 + c * 22)}%, var(--surface))`;

  return (
    <div style={{ background: "var(--canvas)", border: "1px solid var(--border-strong)", borderRadius: 14, padding: "16px 16px 14px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "center" }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: 320, flex: "1 1 240px", display: "block" }} role="img" aria-label="A bootstrap sample of 30 rows: some drawn multiple times, about a third left out">
          {counts.map((c, i) => {
            const col = i % COLS, row = Math.floor(i / COLS);
            const cx = PADX + col * cellW + cellW / 2;
            const cy = PADY + row * cellH + cellH / 2;
            return (
              <g key={i}>
                <circle cx={cx} cy={cy} r={13} fill={fill(c)} stroke={c === 0 ? "var(--border-strong)" : "var(--c-trees)"} strokeWidth={c === 0 ? 1 : 1.25} strokeDasharray={c === 0 ? "3 2" : "none"} />
                <text x={cx} y={cy + 3.5} fontSize={11} textAnchor="middle" fill={c === 0 ? "var(--faint)" : "var(--ink)"} className="font-display">
                  {c === 0 ? "—" : `×${c}`}
                </text>
              </g>
            );
          })}
        </svg>

        <div style={{ flex: "1 1 200px", minWidth: 190 }}>
          <div style={{ display: "grid", gap: 9 }}>
            <Row label="In-bag (used)" value={`${inBag} / ${N}`} sub={`${((inBag / N) * 100).toFixed(0)}%`} />
            <Row label="Out-of-bag (unused)" value={`${oob} / ${N}`} sub={`${((oob / N) * 100).toFixed(0)}%`} strong />
          </div>
          <button
            onClick={() => setSeed((s) => s + 1)}
            style={{ marginTop: 14, fontSize: 13, fontWeight: 500, padding: "6px 14px", borderRadius: 10, border: "1px solid var(--c-trees)", background: "var(--surface)", color: "var(--c-trees)", cursor: "pointer" }}
          >
            Draw another sample
          </button>
          <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.55, marginTop: 12 }}>
            Redraw a few times. The out-of-bag share hovers near <strong>37%</strong> every single time —
            that&rsquo;s the mathematical limit <em>(1 − 1/n)</em><sup>n</sup> → <em>1/e</em> ≈ 0.368.
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, sub, strong }: { label: string; value: string; sub: string; strong?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 13 }}>
      <span style={{ color: "var(--muted)" }}>{label}</span>
      <span>
        <span className="font-display" style={{ fontWeight: 600, color: strong ? "var(--c-trees)" : "var(--ink)" }}>{value}</span>
        <span style={{ color: "var(--faint)", marginLeft: 6, fontSize: 12 }}>{sub}</span>
      </span>
    </div>
  );
}
