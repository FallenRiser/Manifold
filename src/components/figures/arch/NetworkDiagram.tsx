// A drawn network: columns of units, the connections between them, and the
// parameter count that follows.
//
// This track spends 35,000 words choosing shapes and, before this component
// existed, contained no picture of a shape. "A funnel", "a deep narrow stack",
// "wide and shallow" are all spatial words being asked to do spatial work in
// prose.
//
// Layers wider than `maxDots` are drawn as a truncated column with a break mark
// and the true width printed underneath — a 128-unit column drawn as 128 dots is
// a grey smear, and the reader only ever needs to see that it is much wider than
// its neighbour. Edges are drawn only between the units actually shown, at low
// opacity, for the same reason: the picture is of a shape, not of a wiring
// schematic.
//
// Static SVG, no client JS.

export type NetProps = {
  /** Every layer including input and output, e.g. [2, 16, 16, 1]. */
  sizes: number[];
  labels?: string[];
  caption?: React.ReactNode;
  /** Draw h = f(x) + x arcs over the hidden layers. */
  residual?: boolean;
  highlight?: number[];
  maxDots?: number;
  showParams?: boolean;
  accent?: string;
  /** Set to "0" when embedding inside another figure (see NetworkPair). */
  margin?: string;
};

export function paramCount(sizes: number[]) {
  let n = 0;
  for (let i = 0; i < sizes.length - 1; i++) n += sizes[i] * sizes[i + 1] + sizes[i + 1];
  return n;
}

const W = 420, H = 210;

export function NetworkDiagram({
  sizes,
  labels,
  caption,
  residual = false,
  highlight,
  maxDots = 9,
  showParams = true,
  accent = "var(--c-neural)",
  margin = "1.8rem 0",
}: NetProps) {
  const n = sizes.length;
  const top = 34, bottom = 150;
  const midY = (top + bottom) / 2;
  const colX = (i: number) => (n === 1 ? W / 2 : 46 + (i * (W - 92)) / (n - 1));

  // Dot positions for one column. A layer wider than maxDots is drawn as its top
  // half, a gap, and its bottom half, with the break mark in the gap — a column
  // of 64 dots is a grey smear, and a column of 9 dots silently misreports the
  // width. The gap is the honest version.
  const dots = sizes.map((size) => {
    const truncated = size > maxDots;
    const shown = truncated ? maxDots - 1 : size;
    const gap = Math.min(14, (bottom - top) / Math.max(shown, 1));
    const half = Math.ceil(shown / 2);
    const breakGap = truncated ? gap * 1.9 : 0;
    const span = gap * (shown - 1) + breakGap;
    const y0 = midY - span / 2;
    const ys = Array.from({ length: shown }, (_, k) =>
      y0 + k * gap + (truncated && k >= half ? breakGap : 0)
    );
    return { size, truncated, ys, breakY: truncated ? y0 + (half - 0.5) * gap + breakGap / 2 : 0 };
  });

  const r = 4.2;

  return (
    <figure style={{ margin }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label={`Network with layer sizes ${sizes.join(", ")}`}
        style={{ display: "block", maxWidth: "100%" }}
      >
        {/* edges */}
        {dots.slice(0, -1).map((col, i) =>
          col.ys.map((y1, a) =>
            dots[i + 1].ys.map((y2, b) => (
              <line
                key={`${i}-${a}-${b}`}
                x1={colX(i) + r}
                y1={y1}
                x2={colX(i + 1) - r}
                y2={y2}
                stroke="var(--border)"
                strokeWidth={0.6}
                opacity={0.75}
              />
            ))
          )
        )}

        {/* residual arcs: over each hidden layer whose width matches its input */}
        {residual &&
          dots.slice(1, -1).map((_, k) => {
            const i = k + 1;
            if (sizes[i] !== sizes[i - 1]) return null;
            const x1 = colX(i - 1), x2 = colX(i);
            const peak = top - 20;
            return (
              <g key={`res-${i}`}>
                <path
                  d={`M ${x1} ${top - 8} C ${x1 + 14} ${peak}, ${x2 - 14} ${peak}, ${x2} ${top - 8}`}
                  fill="none"
                  stroke={accent}
                  strokeWidth={1.4}
                />
                <circle cx={x2} cy={top - 8} r={5.5} fill="var(--surface)" stroke={accent} strokeWidth={1.4} />
                <text x={x2} y={top - 5.4} textAnchor="middle" fontSize={7.5} fill={accent}>+</text>
              </g>
            );
          })}

        {/* units */}
        {dots.map((col, i) => {
          const on = highlight ? highlight.includes(i) : false;
          const isEdge = i === 0 || i === n - 1;
          const fill = on ? accent : isEdge ? "var(--surface-2)" : "var(--surface)";
          const stroke = on ? accent : "var(--muted)";
          return (
            <g key={`c-${i}`}>
              {col.ys.map((y, k) => (
                <circle key={k} cx={colX(i)} cy={y} r={r} fill={fill} stroke={stroke} strokeWidth={1.1} />
              ))}
              {col.truncated &&
                [-4.5, 0, 4.5].map((dy) => (
                  <circle key={dy} cx={colX(i)} cy={col.breakY + dy} r={1} fill="var(--muted)" />
                ))}
              <text x={colX(i)} y={bottom + 25} textAnchor="middle" fontSize={12} fill="var(--ink)" fontWeight={500}>
                {col.size}
              </text>
              {labels?.[i] && (
                <text x={colX(i)} y={bottom + 39} textAnchor="middle" fontSize={10} fill="var(--muted)">
                  {labels[i]}
                </text>
              )}
            </g>
          );
        })}

        {showParams && (
          <text x={W / 2} y={H - 4} textAnchor="middle" fontSize={11} fill="var(--muted)">
            {sizes.join(" → ")} = {paramCount(sizes).toLocaleString()} parameters
          </text>
        )}
      </svg>
      {caption && (
        <figcaption style={{ fontSize: 13, color: "var(--muted)", marginTop: 10, lineHeight: 1.55 }}>
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

/** Two networks side by side — the comparison this track keeps making in words. */
export function NetworkPair({
  left,
  right,
  caption,
}: {
  left: { sizes: number[]; title: string; note?: string };
  right: { sizes: number[]; title: string; note?: string };
  caption?: React.ReactNode;
}) {
  return (
    <figure style={{ margin: "1.8rem 0" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 18 }}>
        {[left, right].map((side) => (
          <div key={side.title} style={{ flex: "1 1 240px", minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 2 }}>
              {side.title}
            </div>
            {side.note && (
              <div style={{ fontSize: 11.5, color: "var(--muted)", marginBottom: 4 }}>{side.note}</div>
            )}
            <NetworkDiagram sizes={side.sizes} margin="0" showParams={false} />
          </div>
        ))}
      </div>
      {caption && (
        <figcaption style={{ fontSize: 13, color: "var(--muted)", marginTop: 4, lineHeight: 1.55 }}>
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
