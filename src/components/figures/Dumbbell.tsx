// One measurement per labelled row, or two joined by a connector.
//
// Built for the question these tracks keep asking: the same sweep run twice,
// with and without the thing under test. A table of two columns makes the reader
// subtract; a dumbbell on a shared axis makes the difference the thing they see
// first, and makes "every row lands in the same place" legible at a glance —
// which is exactly the claim that normalisation and regularisation pages want to
// make and cannot make in prose.
//
// Generic on purpose: pass `xlabel` and `ticks` and it plots weight standard
// deviations or anything else, not only accuracies.

const R = 372, T = 18, ROW = 21;
// The label gutter has to fit the longest row label — "wd + dropout + jitter" and
// "Adam + L2 in the loss 1e-3" are as legitimate as "he". A fixed 74 clipped them
// at phone width, which is where the figure is least forgiving.
const gutterFor = (rows: { init: string }[]) =>
  Math.min(150, Math.max(58, Math.max(...rows.map((r) => r.init.length)) * 4.6 + 12));

export function Dumbbell({
  rows,
  baseline,
  baselineLabel = "majority class",
  seriesLabels = ["test accuracy"],
  xlabel = "test accuracy →",
  ticks: tickVals,
  caption,
}: {
  rows: { init: string; a: number; b?: number }[];
  baseline?: number;
  baselineLabel?: string;
  seriesLabels?: string[];
  xlabel?: string;
  /** Override the default accuracy gridlines when the axis is not an accuracy. */
  ticks?: number[];
  caption?: React.ReactNode;
}) {
  const hasB = rows.some((r) => r.b != null);
  const all = rows.flatMap((r) => [r.a, ...(r.b == null ? [] : [r.b])]);
  // Pad relative to the data, not by a fixed 0.03 — this figure is also used for
  // weight standard deviations, where the whole range is smaller than that.
  const span = Math.max(...all) - Math.min(...all, baseline ?? Infinity);
  const pad = Math.max(span * 0.12, 0.004);
  const lo = Math.min(...all, baseline ?? Infinity) - pad;
  const hi = Math.max(...all) + pad;
  const H = T + rows.length * ROW + 34;
  const digits = hi - lo < 0.2 ? 5 : 3;
  // Tick labels were hardcoded to one decimal, so a 0.75-0.78 axis printed
  // "0.8" four times.
  const tickDigits = hi - lo < 0.02 ? 3 : hi - lo < 0.25 ? 2 : 1;
  const L = gutterFor(rows);
  const labelSize = L < 80 ? 9.5 : 8.5;
  const px = (v: number) => L + ((v - lo) / (hi - lo)) * (R - L);
  const ticks = (tickVals ?? [0.5, 0.6, 0.7, 0.8, 0.9]).filter((t) => t > lo && t < hi);

  return (
    <figure style={{ margin: "22px 0 6px", padding: "14px 16px 12px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 14 }}>
      <svg viewBox={`0 0 400 ${H}`} width="100%" role="img" aria-label={xlabel.replace(" →", "") + " by row"}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={px(t)} y1={T - 6} x2={px(t)} y2={T + rows.length * ROW - 4} stroke="var(--border-strong)" strokeWidth={0.6} />
            <text x={px(t)} y={T + rows.length * ROW + 8} textAnchor="middle" fontSize={8} fill="var(--faint)">{t.toFixed(tickDigits)}</text>
          </g>
        ))}
        {baseline != null && (
          <>
            <line x1={px(baseline)} y1={T - 8} x2={px(baseline)} y2={T + rows.length * ROW - 4} stroke="var(--bad)" strokeWidth={1} strokeDasharray="3 2" />
            <text x={px(baseline)} y={T - 11} textAnchor="middle" fontSize={8} fill="var(--bad)">{baselineLabel} {baseline.toFixed(3)}</text>
          </>
        )}

        {rows.map((r, i) => {
          const y = T + i * ROW + 6;
          const dead = baseline != null && r.a <= baseline;
          return (
            <g key={r.init}>
              <text x={L - 8} y={y + 3} textAnchor="end" fontSize={labelSize} fill="var(--ink)" fontFamily="ui-monospace, SFMono-Regular, monospace">{r.init}</text>
              {r.b != null && (
                <line x1={px(r.a)} y1={y} x2={px(r.b)} y2={y} stroke="var(--border-strong)" strokeWidth={1} />
              )}
              {/* Below the baseline the run is not a weak model, it is not a model.
                  Drawn hollow so it reads as disqualified rather than merely low —
                  --bad and --c-neural are near-twins on screen. */}
              <circle
                cx={px(r.a)}
                cy={y}
                r={4}
                fill={dead ? "var(--surface-2)" : "var(--c-neural)"}
                stroke={dead ? "var(--bad)" : "none"}
                strokeWidth={dead ? 1.8 : 0}
              />
              {r.b != null && <circle cx={px(r.b)} cy={y} r={4} fill="var(--good)" />}
              <text x={px(Math.max(r.a, r.b ?? r.a)) + 8} y={y + 3} fontSize={9} fill="var(--muted)" fontFamily="ui-monospace, SFMono-Regular, monospace">
                {(r.b ?? r.a).toFixed(digits)}
              </text>
            </g>
          );
        })}
        <text x={(L + R) / 2} y={H - 6} textAnchor="middle" fontSize={8.5} fill="var(--faint)">{xlabel}</text>
      </svg>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px", marginTop: 2 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--muted)" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--c-neural)" }} />{seriesLabels[0]}
        </span>
        {hasB && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--muted)" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--good)" }} />{seriesLabels[1]}
          </span>
        )}
      </div>
      {caption && (
        <figcaption style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.6, marginTop: 9, paddingTop: 9, borderTop: "1px solid var(--border)" }}>
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
