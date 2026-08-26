"use client";

import { useMemo, useState } from "react";

// Shattering, made playable. A hypothesis class SHATTERS a set of points if it
// can realize every possible labeling of them. Click a point to flip its label
// and watch whether a straight line can still separate the two colours.
//
// The three presets carry the whole lesson:
//   • triangle  — 8/8 labelings work. Lines shatter 3 points in general position.
//   • collinear — only 6/8. The SAME number of points, degenerately placed, is
//     NOT shattered. This is why VC dimension asks whether SOME set of size d is
//     shattered, never whether EVERY one is — the single most-missed quantifier.
//   • square    — 14/16. The two "diagonal" (XOR) labelings are impossible, so
//     no 4-point set is shattered and VC(2-D linear) = 3 exactly.
//
// Everything here is exact deterministic geometry computed in-component (a
// direction sweep for linear separability), so the lab is self-verifying — no
// numbers are asserted that the reader can't watch it derive.

type Pt = { x: number; y: number };

const PRESETS: { key: string; label: string; pts: Pt[]; note: string }[] = [
  {
    key: "triangle",
    label: "3 points · triangle",
    pts: [{ x: 140, y: 60 }, { x: 110, y: 165 }, { x: 240, y: 150 }],
    note: "three points in general position",
  },
  {
    key: "collinear",
    label: "3 points · collinear",
    pts: [{ x: 110, y: 170 }, { x: 190, y: 120 }, { x: 270, y: 70 }],
    note: "three points on a straight line",
  },
  {
    key: "square",
    label: "4 points · square",
    pts: [{ x: 140, y: 64 }, { x: 240, y: 64 }, { x: 240, y: 164 }, { x: 140, y: 164 }],
    note: "four points in convex position",
  },
];

const VW = 380, VH = 232;
const BOX = { x0: 90, y0: 14, x1: 290, y1: 214 };

// Exact-enough separability test: a linear separator exists iff some direction
// and offset splits the points by label. Sweeping 720 directions and testing
// every gap between consecutive projections finds it for points in generic
// position (and correctly fails for the XOR / collinear cases, which are
// impossible for EVERY direction, not just the sampled ones).
function findSeparator(pts: Pt[], labels: number[]): { th: number; t: number } | null {
  const D = 720;
  for (let d = 0; d < D; d++) {
    const th = (d / D) * Math.PI * 2;
    const nx = Math.cos(th), ny = Math.sin(th);
    const proj = pts.map((p) => nx * p.x + ny * p.y);
    const sorted = [...proj].sort((a, b) => a - b);
    const cands = [sorted[0] - 1];
    for (let i = 0; i + 1 < sorted.length; i++) cands.push((sorted[i] + sorted[i + 1]) / 2);
    cands.push(sorted[sorted.length - 1] + 1);
    for (const t of cands) {
      let ok = true;
      for (let i = 0; i < pts.length; i++) {
        const side = proj[i] > t ? 1 : -1;
        if (side !== labels[i]) { ok = false; break; }
      }
      if (ok) return { th, t };
    }
  }
  return null;
}

export function ShatteringLab() {
  const [presetKey, setPresetKey] = useState("triangle");
  const preset = PRESETS.find((p) => p.key === presetKey)!;
  const n = preset.pts.length;
  const [labels, setLabels] = useState<number[]>(() => PRESETS[0].pts.map(() => 1));

  const accent = "var(--c-metrics)";
  const POS = "var(--ink)";
  const NEG = "var(--brand-2)";

  // Every labeling of this point set, decided once per preset.
  const all = useMemo(() => {
    const out: { bits: number[]; ok: boolean }[] = [];
    for (let m = 0; m < (1 << preset.pts.length); m++) {
      const bits = preset.pts.map((_, i) => ((m >> i) & 1 ? 1 : -1));
      out.push({ bits, ok: findSeparator(preset.pts, bits) !== null });
    }
    return out;
  }, [preset]);

  const realized = all.filter((a) => a.ok).length;
  const shattered = realized === all.length;
  const sep = findSeparator(preset.pts, labels);

  function choose(key: string) {
    const p = PRESETS.find((q) => q.key === key)!;
    setPresetKey(key);
    setLabels(p.pts.map(() => 1));
  }

  // Separator drawn as a long chord along the direction perpendicular to the
  // normal, clipped to the plot box. Coords rounded — trig in SSR'd markup.
  let line: { x1: number; y1: number; x2: number; y2: number } | null = null;
  if (sep) {
    const nx = Math.cos(sep.th), ny = Math.sin(sep.th);
    const cx = nx * sep.t, cy = ny * sep.t;      // closest point on the line to origin
    const dx = -ny, dy = nx;                      // along the line
    const L = 420;
    line = {
      x1: Number((cx - dx * L).toFixed(2)), y1: Number((cy - dy * L).toFixed(2)),
      x2: Number((cx + dx * L).toFixed(2)), y2: Number((cy + dy * L).toFixed(2)),
    };
  }

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.6rem 0" }} className="not-prose">
      <div className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", marginBottom: 2 }}>
        Can a line realize every labeling?
      </div>
      <div style={{ fontSize: 12, color: "var(--faint)", marginBottom: 10 }}>
        Click any point to flip its label — {preset.note}.
      </div>

      <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", maxWidth: 380, height: "auto", display: "block" }}>
        <defs>
          <clipPath id="shatter-clip">
            <rect x={BOX.x0} y={BOX.y0} width={BOX.x1 - BOX.x0} height={BOX.y1 - BOX.y0} rx={8} />
          </clipPath>
        </defs>
        <rect x={BOX.x0} y={BOX.y0} width={BOX.x1 - BOX.x0} height={BOX.y1 - BOX.y0} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />

        {line && (
          <g clipPath="url(#shatter-clip)">
            <line x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke={accent} strokeWidth={2} />
          </g>
        )}

        {preset.pts.map((p, i) => (
          <g key={i} onClick={() => setLabels((prev) => prev.map((v, j) => (j === i ? -v : v)))} style={{ cursor: "pointer" }}>
            {/* generous invisible hit target (PROJECT.md §10.3) */}
            <circle cx={p.x} cy={p.y} r={22} fill="transparent" />
            <circle
              cx={p.x} cy={p.y} r={8}
              fill={labels[i] === 1 ? POS : "var(--surface)"}
              stroke={labels[i] === 1 ? POS : NEG}
              strokeWidth={2.5}
            />
          </g>
        ))}

        {!sep && (
          <text x={(BOX.x0 + BOX.x1) / 2} y={BOX.y1 - 12} fontSize={11.5} fill="var(--bad)" textAnchor="middle">
            no line can separate this labeling
          </text>
        )}
      </svg>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
        {PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => choose(p.key)}
            style={{
              background: p.key === presetKey ? `color-mix(in srgb, ${accent} 15%, var(--surface))` : "transparent",
              color: p.key === presetKey ? "var(--ink)" : "var(--muted)",
              border: `1px solid ${p.key === presetKey ? `color-mix(in srgb, ${accent} 40%, var(--border))` : "var(--border-strong)"}`,
              fontSize: 12, padding: "5px 10px", borderRadius: 8, cursor: "pointer",
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12, alignItems: "center" }}>
        <Metric label="labelings a line can realize" value={`${realized} / ${all.length}`} accent={shattered ? "var(--good)" : "var(--bad)"} big />
        <Metric label="verdict" value={shattered ? "shattered ✓" : "not shattered"} sub={shattered ? `all 2^${n} realizable` : `${all.length - realized} impossible`} />
      </div>

      <div style={{ fontSize: 11, color: "var(--muted)", margin: "14px 0 6px" }}>
        every labeling of these {n} points — click one to load it
      </div>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        {all.map((a, idx) => {
          const active = a.bits.every((b, i) => b === labels[i]);
          return (
            <button
              key={idx}
              onClick={() => setLabels(a.bits)}
              title={a.ok ? "a line can do this" : "no line can do this"}
              style={{
                display: "flex", alignItems: "center", gap: 3,
                background: active ? `color-mix(in srgb, ${accent} 14%, var(--surface))` : "var(--surface-2)",
                border: `1px solid ${active ? `color-mix(in srgb, ${accent} 45%, var(--border))` : "var(--border)"}`,
                borderRadius: 7, padding: "4px 6px", cursor: "pointer",
              }}
            >
              {a.bits.map((b, i) => (
                <span key={i} style={{
                  width: 7, height: 7, borderRadius: 999,
                  background: b === 1 ? POS : "transparent",
                  border: b === 1 ? "none" : `1.5px solid ${NEG}`,
                  display: "inline-block",
                }} />
              ))}
              <span style={{ fontSize: 10, color: a.ok ? "var(--good)" : "var(--bad)", marginLeft: 1 }}>{a.ok ? "✓" : "✗"}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Metric({ label, value, sub, accent, big }: { label: string; value: string; sub?: string; accent?: string; big?: boolean }) {
  return (
    <div style={{ background: "var(--surface-2)", borderRadius: 10, padding: "6px 10px", minWidth: 96 }}>
      <div style={{ fontSize: 10.5, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontSize: big ? 19 : 15, fontWeight: 500, color: accent ?? "var(--ink)" }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: "var(--faint)" }}>{sub}</div>}
    </div>
  );
}
