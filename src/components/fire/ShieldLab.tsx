"use client";

import { useState } from "react";
import { ABLATION, GAPS, type Ablation } from "./data/whatLearned";

// Two pictures of one finding, both measured on the 200 exam worlds.
//
//   "the bucket"  village damage under three conditions: the policy as trained, the same policy
//                 with its target slid onto the nearest burning cell, and the policy in a world
//                 where a drop no longer wets the square. A chief already aims at the nearest
//                 fire, so the middle condition is the IDENTITY for the three chiefs -- which is
//                 exactly what makes them the control.
//
//   "the exam"    the per-world gap against the guard chief, sorted. A mean of -0.42 can be a
//                 small edge in every world or a rout in ten; this says which.
//
// Bars run horizontally on purpose. An earlier version drew condition-to-condition slopes, and six
// policies landing between 2.94 and 4.10 in the last column put every label on top of every other.

const W = 640;
const GOLD = "var(--c-rl)";

type View = "bucket" | "exam";
type Cond = "trained" | "snapped" | "dry";

const COND: { k: Cond; chip: string; blurb: string }[] = [
  { k: "trained", chip: "as trained", blurb: "each policy exactly as it is scored everywhere else in this chapter." },
  {
    k: "snapped", chip: "aim snapped to the fire",
    blurb: "the same crew, same weights, same world — only the target moves, onto the nearest burning cell. That is where a chief always aims, so the three chiefs are unchanged by construction.",
  },
  {
    k: "dry", chip: "a drop stops wetting",
    blurb: "a bucket still turns every burning cell under it back to unburnt; it no longer leaves the square wet. Everybody gets worse. Watch which bars cross.",
  },
];

// One row per policy, tall enough for a 12px label and a 14px bar with air between rows.
const ROW = 30, LEFT = 118, RIGHT = 54, TOP = 26;

export function ShieldLab() {
  const [view, setView] = useState<View>("bucket");
  const [cond, setCond] = useState<Cond>("trained");
  const [seed, setSeed] = useState(0);

  return (
    <div style={box}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
        <span style={head}>Two ways to take the crew&rsquo;s advantage away</span>
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>200 exam worlds · seeds 1000–1199</span>
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 10 }}>
        <Chips label="show" value={view} set={setView}
          opts={[["bucket", "the two halves of a bucket"], ["exam", "where the win lives"]]} />
        {view === "bucket" ? (
          <Chips label="condition" value={cond} set={setCond}
            opts={COND.map((c) => [c.k, c.chip] as [Cond, string])} />
        ) : (
          <Chips label="crew" value={String(seed)} set={(v) => setSeed(Number(v))}
            opts={GAPS.map((g, i) => [String(i), `seed ${g.key.slice(-1)}`] as [string, string])} />
        )}
      </div>

      {view === "bucket" ? <Bucket cond={cond} /> : <Exam i={seed} />}
    </div>
  );
}

// ---- the two halves of a bucket -------------------------------------------------------

function Bucket({ cond }: { cond: Cond }) {
  const H = TOP + ABLATION.length * ROW + 24;
  const xMax = Math.max(...ABLATION.flatMap((r) => [r.trained, r.snapped, r.dry])) * 1.06;
  const px = (v: number) => LEFT + (v / xMax) * (W - LEFT - RIGHT);
  const guard = ABLATION.find((r) => r.key === "guard")!;
  const blurb = COND.find((c) => c.k === cond)!.blurb;

  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <text x={LEFT} y={12} fontSize={10.5} fill="var(--faint)">village cells lost, out of nine</text>
        {/* the guard chief under the SAME condition: the only honest reference line here, because
            the ablations move the chief too */}
        <line x1={px(guard[cond])} y1={TOP - 6} x2={px(guard[cond])} y2={H - 20}
          stroke="var(--faint)" strokeDasharray="3 4" strokeWidth={1} />
        <text x={px(guard[cond])} y={H - 8} textAnchor="middle" fontSize={10} fill="var(--muted)">
          guard {guard[cond].toFixed(2)}
        </text>

        {ABLATION.map((r, i) => {
          const y = TOP + i * ROW;
          const v = r[cond];
          const col = r.crew ? GOLD : "var(--muted)";
          return (
            <g key={r.key}>
              <text x={LEFT - 8} y={y + 12} textAnchor="end" fontSize={11.5}
                fill={r.crew ? "var(--ink)" : "var(--muted)"}>{r.label}</text>
              {/* where this policy sat as trained, so a shortened or lengthened bar is readable */}
              <line x1={px(r.trained)} y1={y + 1} x2={px(r.trained)} y2={y + 15}
                stroke="var(--border-strong)" strokeWidth={1} />
              <rect x={LEFT} y={y + 2} width={Math.max(px(v) - LEFT, 1)} height={13} rx={2}
                fill={col} opacity={r.crew ? 0.85 : 0.5} />
              <text x={px(v) + 6} y={y + 12.5} fontSize={11} fill="var(--muted)"
                fontFamily="ui-monospace, monospace">{v.toFixed(2)}</text>
            </g>
          );
        })}
      </svg>
      <p style={{ fontSize: 13, color: "var(--muted)", margin: "8px 0 0", lineHeight: 1.55 }}>
        <strong>{COND.find((c) => c.k === cond)!.chip}</strong> — {blurb}{" "}
        {cond === "trained" ? (
          <>The three gold bars are the trained crews; the tick on each bar is where that policy sits
            as trained, so it stays put in this view and marks the starting point in the other two.</>
        ) : cond === "snapped" ? (
          <>Every crew lands within a whisker of the chief it was beating. The advantage was in the
            offset, not in the weights that produced it.</>
        ) : (
          <>The crews lose more than any chief does, and all three end up <em>behind</em> the guard
            chief. Note what that costs the argument, though: a crew trained in a world with wetting
            is being run in a world without it, so this is a crew out of its distribution, not a fair
            re-run.</>
        )}
      </p>
    </>
  );
}

// ---- where the win lives ---------------------------------------------------------------

function Exam({ i }: { i: number }) {
  const g = GAPS[i];
  const H = 180, PB = 34, PT = 22, PL = 34;
  const hi = Math.max(...g.sorted.map(Math.abs), 1);
  const bw = (W - PL - 12) / g.sorted.length;
  const y0 = PT + ((hi - 0) / (2 * hi)) * (H - PT - PB);
  const py = (v: number) => PT + ((hi - v) / (2 * hi)) * (H - PT - PB);

  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <text x={PL} y={11} fontSize={10.5} fill="var(--faint)">
          village cells, crew minus guard chief — below the line the crew did better
        </text>
        {[hi, 0, -hi].map((v) => (
          <text key={v} x={PL - 6} y={py(v) + 3.5} textAnchor="end" fontSize={10.5} fill="var(--muted)">
            {v > 0 ? `+${v}` : v}
          </text>
        ))}
        {g.sorted.map((v, k) => (
          <rect key={k} x={PL + k * bw} y={Math.min(py(v), y0)} width={Math.max(bw - 0.4, 0.6)}
            height={Math.max(Math.abs(py(v) - y0), v === 0 ? 0 : 0.8)}
            fill={v < 0 ? GOLD : "var(--c-classification)"} opacity={v === 0 ? 0 : 0.85} />
        ))}
        <line x1={PL} y1={y0} x2={W - 12} y2={y0} stroke="var(--border-strong)" strokeWidth={1} />
        <text x={PL + 2} y={H - 18} fontSize={10.5} fill="var(--muted)">
          {g.better} worlds better
        </text>
        <text x={(PL + W - 12) / 2} y={H - 18} textAnchor="middle" fontSize={10.5} fill="var(--faint)">
          {g.same} identical
        </text>
        <text x={W - 14} y={H - 18} textAnchor="end" fontSize={10.5} fill="var(--muted)">
          {g.worse} worse
        </text>
        <text x={(PL + W - 12) / 2} y={H - 5} textAnchor="middle" fontSize={10.5} fill="var(--faint)">
          the 200 exam worlds, sorted by the gap
        </text>
      </svg>
      <p style={{ fontSize: 13, color: "var(--muted)", margin: "8px 0 0", lineHeight: 1.55 }}>
        <strong>{g.label}</strong> beats the guard chief by <strong>{Math.abs(g.gap).toFixed(2)}</strong> village
        cells on average — and in <strong>{g.same} of the 200 worlds the two score exactly the same</strong>, almost
        always because both saved all nine houses. The whole difference lives in the{" "}
        {g.better + g.worse} worlds at the ends, and it is not one-sided: the crew is worse in {g.worse} of
        them, by as much as {Math.max(...g.sorted)} cells in its worst world.
      </p>
    </>
  );
}

// ---- shared ----------------------------------------------------------------------------

function Chips<T extends string>({ label, value, set, opts }: {
  label: string; value: T; set: (v: T) => void; opts: [T, string][];
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
      <span style={{ fontSize: 11.5, color: "var(--faint)" }}>{label}</span>
      {opts.map(([v, lab]) => (
        <button key={v} onClick={() => set(v)} style={{
          ...chip,
          // --paper, not --bg: an undefined custom property is dropped silently and the colour
          // falls back to the inherited --ink, i.e. black text on a black pill.
          background: value === v ? "var(--ink)" : "transparent",
          color: value === v ? "var(--paper)" : "var(--muted)",
          borderColor: value === v ? "var(--ink)" : "var(--border)",
        }}>{lab}</button>
      ))}
    </div>
  );
}

const box: React.CSSProperties = {
  border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px 16px", background: "var(--surface)",
};
const head: React.CSSProperties = { fontSize: 13.5, fontWeight: 600, color: "var(--ink)" };
const chip: React.CSSProperties = {
  fontSize: 11.5, padding: "3px 9px", borderRadius: 999, border: "1px solid var(--border)", cursor: "pointer",
};

export type { Ablation };
