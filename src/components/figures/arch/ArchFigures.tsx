// Track-local figures for Architecture design.
//
// GridHeatmap      the (depth x width) sweep as a surface instead of 30 rows
// DiagnosticPanels the four learning-curve shapes, with what to change under each
// DepthRisk        mean AND worst-case accuracy vs depth — the honest depth tax
// MemoryBars       where training memory actually goes, for one network
//
// Static SVG, no client JS.

import { DIAG_EPOCHS, DIAGNOSTICS, type GridCell, type Diag } from "./data";

const ACCENT = "var(--c-neural)";
const GOOD = "var(--good)";
const BAD = "var(--bad)";

// ---------------------------------------------------------------------------
// The grid, as a surface.
// ---------------------------------------------------------------------------
export function GridHeatmap({
  cells,
  depths,
  widths,
  caption,
}: {
  cells: GridCell[];
  depths: number[];
  widths: number[];
  caption?: React.ReactNode;
}) {
  const vals = cells.map((c) => c.test);
  const lo = Math.min(...vals), hi = Math.max(...vals);
  const cw = 56, ch = 30, L = 46, T = 30;
  const W = L + widths.length * cw + 14;
  const H = T + depths.length * ch + 46;

  // A single-hue ramp: the reader needs "more is better", not a rainbow.
  const shade = (v: number) => {
    const t = (v - lo) / (hi - lo || 1);
    return `color-mix(in srgb, ${ACCENT} ${(10 + t * 78).toFixed(0)}%, var(--surface))`;
  };

  return (
    <figure style={{ margin: "1.8rem 0" }}>
      <div style={{ overflowX: "auto" }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Test accuracy by depth and width" style={{ display: "block", minWidth: 330 }}>
          <text x={L} y={12} fontSize={9.5} fill="var(--muted)">width →</text>
          {widths.map((w, j) => (
            <text key={w} x={L + j * cw + cw / 2} y={24} textAnchor="middle" fontSize={9.5} fill="var(--ink)">
              {w}
            </text>
          ))}
          {depths.map((d, i) => (
            <text key={d} x={L - 8} y={T + i * ch + ch / 2 + 3.5} textAnchor="end" fontSize={9.5} fill="var(--ink)">
              {d}
            </text>
          ))}
          <text x={8} y={T - 8} fontSize={9.5} fill="var(--muted)">depth</text>

          {depths.map((d, i) =>
            widths.map((w, j) => {
              const c = cells.find((k) => k.depth === d && k.width === w);
              if (!c) return null;
              const best = c.test === hi;
              return (
                <g key={`${d}-${w}`}>
                  <rect
                    x={L + j * cw}
                    y={T + i * ch}
                    width={cw - 2}
                    height={ch - 2}
                    rx={3}
                    fill={shade(c.test)}
                    stroke={best ? ACCENT : "var(--border)"}
                    strokeWidth={best ? 1.8 : 0.6}
                  />
                  <text
                    x={L + j * cw + (cw - 2) / 2}
                    y={T + i * ch + ch / 2 + 3.5}
                    textAnchor="middle"
                    fontSize={9}
                    fill="var(--ink)"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {c.test.toFixed(3)}
                  </text>
                </g>
              );
            })
          )}
          <text x={L} y={H - 22} fontSize={9} fill="var(--muted)">
            test accuracy, 5 seeds each · outlined cell is the best measured
          </text>
          <text x={L} y={H - 9} fontSize={9} fill="var(--muted)">
            range {lo.toFixed(3)} – {hi.toFixed(3)}
          </text>
        </svg>
      </div>
      {caption && (
        <figcaption style={{ fontSize: 13, color: "var(--muted)", marginTop: 10, lineHeight: 1.55 }}>
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

// ---------------------------------------------------------------------------
// The four diagnostic shapes.
// ---------------------------------------------------------------------------
function Panel({ d, lo, hi }: { d: Diag; lo: number; hi: number }) {
  const W = 200, H = 96, L = 6, R = 194, T = 8, B = 80;
  const n = DIAG_EPOCHS.length;
  const px = (i: number) => L + (i * (R - L)) / (n - 1);
  const py = (v: number) => B - ((v - lo) / (hi - lo)) * (B - T);
  const path = (vs: number[]) => vs.map((v, i) => `${i ? "L" : "M"} ${px(i).toFixed(1)} ${py(v).toFixed(1)}`).join(" ");
  const bestI = d.test.indexOf(Math.max(...d.test));

  return (
    <div style={{ flex: "1 1 210px", minWidth: 0 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>{d.title}</div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={d.title} style={{ display: "block" }}>
        <line x1={L} y1={B} x2={R} y2={B} stroke="var(--border)" strokeWidth={0.8} />
        {/* where held-out accuracy peaked */}
        {d.key === "overfit" && (
          <line x1={px(bestI)} y1={T} x2={px(bestI)} y2={B} stroke="var(--muted)" strokeWidth={0.8} strokeDasharray="3 3" />
        )}
        <path d={path(d.train)} fill="none" stroke={ACCENT} strokeWidth={1.6} />
        <path d={path(d.test)} fill="none" stroke={GOOD} strokeWidth={1.6} strokeDasharray="4 3" />
        <text x={L} y={H - 4} fontSize={8} fill="var(--muted)">
          epoch 10 → 400 · train {d.train[d.train.length - 1].toFixed(3)} / held-out{" "}
          {d.test[d.test.length - 1].toFixed(3)}
        </text>
      </svg>
      <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5, marginTop: 4 }}>{d.verdict}</div>
    </div>
  );
}

export function DiagnosticPanels({ caption, only }: { caption?: React.ReactNode; only?: string[] }) {
  const shown = only ? DIAGNOSTICS.filter((d) => only.includes(d.key)) : DIAGNOSTICS;
  const all = shown.flatMap((d) => [...d.train, ...d.test]);
  const lo = Math.min(...all) - 0.02, hi = Math.max(...all) + 0.02;
  return (
    <figure style={{ margin: "1.8rem 0" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
        {shown.map((d) => (
          <Panel key={d.key} d={d} lo={lo} hi={hi} />
        ))}
      </div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 11.5, color: "var(--muted)", marginTop: 10 }}>
        <span><span style={{ color: ACCENT }}>——</span> training accuracy</span>
        <span><span style={{ color: GOOD }}>– –</span> held-out accuracy</span>
        <span>all four panels share one y-axis ({lo.toFixed(2)}–{hi.toFixed(2)})</span>
      </div>
      {caption && (
        <figcaption style={{ fontSize: 13, color: "var(--muted)", marginTop: 8, lineHeight: 1.55 }}>
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

// ---------------------------------------------------------------------------
// The depth tax, drawn honestly: the mean barely moves, the worst case does.
// ---------------------------------------------------------------------------
export function DepthRisk({
  rows,
  caption,
  keys = ["plain"],
  labels,
  majority,
}: {
  rows: Array<Record<string, number>>;
  caption?: React.ReactNode;
  keys?: string[];
  labels?: string[];
  majority?: number;
}) {
  const W = 420, H = 190, L = 44, R = 406, T = 14, B = 136;
  // --bad and --c-neural are near-twins on screen, so a second series is
  // separated by dash pattern as well as hue, and never by hue alone.
  const colors = [ACCENT, GOOD, BAD];
  const dashes = ["", "5 3", "2 3"];
  const vals = rows.flatMap((r) => keys.map((k) => r[k]));
  const dlo = Math.min(...vals), dhi = Math.max(...vals);
  const pad = Math.max((dhi - dlo) * 0.14, 0.01);
  // The majority-class rule only earns its place when it is near the data. On a
  // sweep that never approaches chance it would flatten everything worth seeing
  // into the top eighth of the frame.
  const showMajority = majority != null && majority > dlo - (dhi - dlo) * 1.1;
  const lo = Math.min(dlo - pad, showMajority ? majority! - pad : Infinity);
  const hi = dhi + pad;
  const n = rows.length;
  const px = (i: number) => L + (i * (R - L)) / (n - 1);
  const py = (v: number) => B - ((v - lo) / (hi - lo)) * (B - T);
  const ticks = Array.from({ length: 4 }, (_, i) => lo + ((hi - lo) * i) / 3);

  return (
    <figure style={{ margin: "1.8rem 0" }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Accuracy against depth" style={{ display: "block", maxWidth: "100%" }}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={L} y1={py(t)} x2={R} y2={py(t)} stroke="var(--border)" strokeWidth={0.6} />
            <text x={L - 6} y={py(t) + 3.2} textAnchor="end" fontSize={9} fill="var(--muted)">
              {t.toFixed(3)}
            </text>
          </g>
        ))}
        {showMajority && (
          <g>
            <line x1={L} y1={py(majority!)} x2={R} y2={py(majority!)} stroke="var(--muted)" strokeWidth={1} strokeDasharray="4 3" />
            <text x={R} y={py(majority!) - 4} textAnchor="end" fontSize={8.5} fill="var(--muted)">
              majority class {majority!.toFixed(2)}
            </text>
          </g>
        )}
        {keys.map((k, ki) => (
          <g key={k}>
            <path
              d={rows.map((r, i) => `${i ? "L" : "M"} ${px(i).toFixed(1)} ${py(r[k]).toFixed(1)}`).join(" ")}
              fill="none"
              stroke={colors[ki % colors.length]}
              strokeWidth={1.8}
              strokeDasharray={dashes[ki % dashes.length] || undefined}
            />
            {rows.map((r, i) => (
              <circle key={i} cx={px(i)} cy={py(r[k])} r={2.6} fill={colors[ki % colors.length]} />
            ))}
          </g>
        ))}
        {rows.map((r, i) => (
          <text key={i} x={px(i)} y={B + 14} textAnchor="middle" fontSize={9} fill="var(--muted)">
            {r.depth}
          </text>
        ))}
        <text x={(L + R) / 2} y={B + 28} textAnchor="middle" fontSize={9.5} fill="var(--muted)">
          hidden layers
        </text>
        <g>
          {keys.map((k, ki) => (
            <g key={k}>
              <line
                x1={L + ki * 150}
                y1={H - 14}
                x2={L + 14 + ki * 150}
                y2={H - 14}
                stroke={colors[ki % colors.length]}
                strokeWidth={2}
                strokeDasharray={dashes[ki % dashes.length] || undefined}
              />
              <text x={L + 19 + ki * 150} y={H - 11} fontSize={9.5} fill="var(--muted)">
                {labels?.[ki] ?? k}
              </text>
            </g>
          ))}
        </g>
      </svg>
      {caption && (
        <figcaption style={{ fontSize: 13, color: "var(--muted)", marginTop: 10, lineHeight: 1.55 }}>
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

// ---------------------------------------------------------------------------
// Where training memory goes. Arithmetic, not a measurement — and derived on
// the page so a reader can check it against their own model.
// ---------------------------------------------------------------------------
export function MemoryBars({
  sizes,
  batch = 256,
  caption,
}: {
  sizes: number[];
  batch?: number;
  caption?: React.ReactNode;
}) {
  let P = 0;
  for (let i = 0; i < sizes.length - 1; i++) P += sizes[i] * sizes[i + 1] + sizes[i + 1];
  const acts = batch * sizes.slice(1).reduce((a, b) => a + b, 0);
  const bytes = 4;
  const parts = [
    { label: "parameters", n: P, color: ACCENT, note: "always resident" },
    { label: "gradients", n: P, color: "color-mix(in srgb, var(--c-neural) 65%, var(--surface))", note: "one per parameter" },
    { label: "Adam state", n: 2 * P, color: "color-mix(in srgb, var(--c-neural) 38%, var(--surface))", note: "momentum + variance" },
    { label: "activations", n: acts, color: GOOD, note: `batch ${batch}, cached for backward` },
  ];
  const total = parts.reduce((a, p) => a + p.n, 0);
  const kb = (n: number) => `${((n * bytes) / 1024).toFixed(1)} KB`;

  return (
    <figure style={{ margin: "1.8rem 0" }}>
      <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px" }}>
        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>
          {sizes.join(" → ")} · {P.toLocaleString()} parameters · batch {batch} · float32
        </div>
        {parts.map((p) => (
          <div key={p.label} style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
              <span style={{ color: "var(--ink)" }}>
                {p.label} <span style={{ color: "var(--muted)" }}>· {p.note}</span>
              </span>
              <span style={{ color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>{kb(p.n)}</span>
            </div>
            <div style={{ height: 9, background: "var(--surface-2)", borderRadius: 5, overflow: "hidden" }}>
              <div style={{ width: `${(p.n / total) * 100}%`, height: "100%", background: p.color }} />
            </div>
          </div>
        ))}
        <div style={{ fontSize: 12, color: "var(--ink)", borderTop: "1px solid var(--border)", paddingTop: 8, marginTop: 10 }}>
          Inference needs the parameters alone: <strong>{kb(P)}</strong>. Training needs all four:{" "}
          <strong>{kb(total)}</strong> — <strong>{(total / P).toFixed(1)}×</strong> more.
        </div>
      </div>
      {caption && (
        <figcaption style={{ fontSize: 13, color: "var(--muted)", marginTop: 10, lineHeight: 1.55 }}>
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
