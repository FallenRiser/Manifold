// Which numbers get averaged together — the only thing that separates
// BatchNorm, LayerNorm, GroupNorm and InstanceNorm.
//
// Every one of those four does the identical arithmetic: subtract a mean,
// divide by a standard deviation, scale and shift. They differ in exactly one
// respect, which is WHICH SET of activations the mean and standard deviation are
// computed over. Prose has to say that four times and hope; a picture of the
// activation matrix with the pooled cells shaded says it once.
//
// The grid is one layer's output: rows are the samples in the batch, columns are
// the units (features). Shaded cells share one mean and one variance.

type Kind = "batch" | "layer" | "group" | "instance";

const ROWS = 5;
const COLS = 8;
const CELL = 26;
const GAP = 2.5;
const X0 = 46;
const Y0 = 26;

const META: Record<Kind, { title: string; sub: string; stats: string }> = {
  batch: {
    title: "BatchNorm",
    sub: "one mean per feature, pooled down the batch",
    stats: "8 means, 8 variances",
  },
  layer: {
    title: "LayerNorm",
    sub: "one mean per sample, pooled across the features",
    stats: "5 means, 5 variances",
  },
  group: {
    title: "GroupNorm",
    sub: "per sample, pooled within a group of features",
    stats: "5 × 2 means and variances",
  },
  instance: {
    title: "InstanceNorm",
    sub: "per sample, per feature — a group of one",
    stats: "40 means, 40 variances",
  },
};

// One group is highlighted and the rest are left plain — the convention from the
// GroupNorm paper's figure. Colouring every group separately was tried first and
// reads worse: with eight columns and a finite palette, two distant columns come
// out the same colour and look like they share a statistic when they do not.
const TINT = "var(--c-neural)";

// The representative group: the second column / second row, so it is clearly
// interior rather than looking like an edge case.
function isHighlighted(kind: Kind, r: number, c: number) {
  if (kind === "batch") return c === 1;
  if (kind === "layer") return r === 1;
  if (kind === "group") return r === 1 && c < COLS / 2;
  return r === 1 && c === 1;
}

export function NormAxes({ kind, highlight, caption }: { kind: Kind; highlight?: string; caption?: React.ReactNode }) {
  const m = META[kind];
  const W = X0 + COLS * (CELL + GAP) + 10;
  const H = Y0 + ROWS * (CELL + GAP) + 32;

  return (
    <figure style={{ margin: "22px 0 6px", padding: "14px 16px 12px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 14 }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`${m.title}: ${m.sub}`}>
        <text x={X0} y={12} fontSize={11} fontWeight={600} fill="var(--ink)">{m.title}</text>
        <text x={X0} y={22} fontSize={9} fill="var(--muted)">{m.sub}</text>

        {Array.from({ length: ROWS }, (_, r) =>
          Array.from({ length: COLS }, (_, c) => {
            const on = isHighlighted(kind, r, c);
            return (
              <rect
                key={`${r}-${c}`}
                x={X0 + c * (CELL + GAP)}
                y={Y0 + r * (CELL + GAP)}
                width={CELL}
                height={CELL}
                rx={3}
                fill={on ? TINT : "var(--surface)"}
                opacity={on ? 0.42 : 1}
                stroke={on ? TINT : "var(--border-strong)"}
                strokeWidth={on ? 1.1 : 0.7}
              />
            );
          }),
        )}

        <text x={X0 - 8} y={Y0 + (ROWS * (CELL + GAP)) / 2} textAnchor="middle" fontSize={9} fill="var(--faint)"
          transform={`rotate(-90 ${X0 - 8} ${Y0 + (ROWS * (CELL + GAP)) / 2})`}>
          batch (5 samples)
        </text>
        <text x={X0 + (COLS * (CELL + GAP)) / 2} y={H - 12} textAnchor="middle" fontSize={9} fill="var(--faint)">
          features (8 units) →
        </text>
        <text x={X0} y={H - 1} fontSize={9} fill={TINT}>shaded = one statistic</text>
        <text x={W - 6} y={H - 1} textAnchor="end" fontSize={9} fill="var(--muted)">{m.stats}</text>
      </svg>
      {highlight && (
        <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.55, marginTop: 4 }}>{highlight}</div>
      )}
      {caption && (
        <figcaption style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.6, marginTop: 9, paddingTop: 9, borderTop: "1px solid var(--border)" }}>
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

// All four side by side — the "which normalisation when" summary.
export function NormAxesGrid({ caption }: { caption?: React.ReactNode }) {
  const kinds: Kind[] = ["batch", "layer", "group", "instance"];
  return (
    <figure style={{ margin: "22px 0 6px", padding: "14px 16px 12px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16 }}>
        {kinds.map((k) => {
          const m = META[k];
                  return (
            <svg key={k} viewBox="0 0 268 190" width="100%" role="img" aria-label={`${m.title}: ${m.sub}`}>
              <text x={4} y={12} fontSize={11} fontWeight={600} fill="var(--ink)">{m.title}</text>
              <text x={4} y={23} fontSize={8.5} fill="var(--muted)">{m.sub}</text>
              {Array.from({ length: ROWS }, (_, r) =>
                Array.from({ length: COLS }, (_, c) => {
                  const on = isHighlighted(k, r, c);
                  return (
                    <rect key={`${r}-${c}`} x={4 + c * 33} y={32 + r * 30} width={30} height={27} rx={3}
                      fill={on ? TINT : "var(--surface)"} opacity={on ? 0.42 : 1}
                      stroke={on ? TINT : "var(--border-strong)"} strokeWidth={on ? 1.1 : 0.7} />
                  );
                }),
              )}
              <text x={4} y={188} fontSize={8.5} fill="var(--faint)">{m.stats}</text>
            </svg>
          );
        })}
      </div>
      {caption && (
        <figcaption style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.6, marginTop: 11, paddingTop: 9, borderTop: "1px solid var(--border)" }}>
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
