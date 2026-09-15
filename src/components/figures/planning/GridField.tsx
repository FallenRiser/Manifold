// The 4x4 grid, drawn.
//
// Every page in this track is about a grid of numbers changing, and every page
// showed that grid as sixteen monospaced decimals inside a CodeOutput. A reader
// can check those numbers; they cannot see the shape. The whole content of
// "values propagate outward from the goal" is spatial, and a column of text
// discards exactly the dimension that carries it.
//
// One component covers the three things the track needs to show on the board:
//   values   a diverging heat scale, negative to --bad and positive to --good
//   policy   an arrow per cell
//   counts   how many times a cell was backed up, or in what order
//
// Static SVG, no client JS. Colours are color-mix over --panel so the fills
// follow the site theme instead of being baked for light mode.

export type CellMode = "value" | "count" | "order";

const ARROWS = ["↑", "→", "↓", "←"];

/** -1 is the pit and -2 the goal in the policy arrays; both get a badge. */
function arrowFor(a: number) {
  if (a === -1) return "P";
  if (a === -2) return "G";
  return ARROWS[a] ?? "";
}

function valueFill(v: number, scale: number) {
  if (!v) return "var(--panel)";
  const pct = Math.round(Math.min(1, Math.abs(v) / (scale || 1)) * 46);
  return `color-mix(in srgb, var(${v > 0 ? "--good" : "--bad"}) ${pct}%, var(--panel))`;
}

function countFill(v: number, scale: number, accent: string) {
  if (!v) return "var(--panel)";
  const pct = Math.round(Math.min(1, v / (scale || 1)) * 52);
  return `color-mix(in srgb, ${accent} ${pct}%, var(--panel))`;
}

export type GridSpec = {
  /** 16 numbers, row-major. */
  values?: readonly number[];
  /** 16 action indices; -1 pit, -2 goal. */
  policy?: readonly number[];
  label?: React.ReactNode;
  /** Cells to ring — a trajectory, or the states a schedule actually touched. */
  highlight?: readonly number[];
  mode?: CellMode;
  /** Largest magnitude the colour scale saturates at. Pass the same value to
   *  every grid in a row, or the panels are not comparable. */
  scale?: number;
  decimals?: number;
  accent?: string;
};

const CELL = 46;

// A <text> does not wrap. Panel labels are written by whoever adds the figure
// and will eventually be longer than the grid is wide, so split them rather
// than trusting every future caller to count characters.
const LABEL_CHARS = 34;

function wrapLabel(text: string): string[] {
  if (text.length <= LABEL_CHARS) return [text];
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if (cur && (cur + " " + w).length > LABEL_CHARS) {
      lines.push(cur);
      cur = w;
    } else {
      cur = cur ? cur + " " + w : w;
    }
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 2);
}

/** A policy array that marks only the goal and the pit, for grids whose numbers
 *  are backup counts rather than values. -3 means "an ordinary cell, draw no
 *  arrow"; only -1 and -2 are given a badge. */
export const TERMINALS_ONLY: readonly number[] = Array.from({ length: 16 }, (_, s) =>
  s === 15 ? -2 : s === 3 ? -1 : -3,
);

export function ValueGrid({
  values,
  policy,
  highlight,
  mode = "value",
  scale = 1,
  decimals = 2,
  accent = "var(--c-rl)",
  x = 0,
  y = 0,
}: GridSpec & { x?: number; y?: number }) {
  const hi = new Set(highlight ?? []);
  return (
    <g transform={`translate(${x} ${y})`}>
      {Array.from({ length: 16 }, (_, s) => {
        const r = Math.floor(s / 4);
        const c = s % 4;
        const v = values?.[s];
        const a = policy?.[s];
        const terminal = a === -1 || a === -2;
        const fill =
          v == null
            ? "var(--panel)"
            : mode === "value"
              ? valueFill(v, scale)
              : countFill(v, scale, accent);
        const showBoth = values && policy && !terminal;
        return (
          <g key={s} transform={`translate(${c * CELL} ${r * CELL})`}>
            <rect
              width={CELL}
              height={CELL}
              fill={terminal && mode === "value" ? "var(--panel)" : fill}
              stroke="var(--border-strong)"
              strokeWidth={0.8}
            />
            {terminal && (
              <rect
                width={CELL}
                height={CELL}
                fill={`color-mix(in srgb, var(${a === -2 ? "--good" : "--bad"}) 30%, var(--panel))`}
                stroke="var(--border-strong)"
                strokeWidth={0.8}
              />
            )}
            {hi.has(s) && (
              <rect
                x={2.5}
                y={2.5}
                width={CELL - 5}
                height={CELL - 5}
                fill="none"
                stroke={accent}
                strokeWidth={2}
              />
            )}

            {terminal ? (
              <text
                x={CELL / 2}
                y={CELL / 2 + 6}
                textAnchor="middle"
                fontSize={17}
                fontWeight={700}
                fill={a === -2 ? "var(--good)" : "var(--bad)"}
              >
                {arrowFor(a!)}
              </text>
            ) : (
              <>
                {v != null && (
                  <text
                    x={CELL / 2}
                    y={showBoth ? CELL / 2 - 1 : CELL / 2 + 4.5}
                    textAnchor="middle"
                    fontSize={mode === "value" ? 12 : 13.5}
                    fill="var(--ink)"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {mode === "value" ? v.toFixed(decimals) : v === 0 ? "" : v}
                  </text>
                )}
                {a != null && a >= 0 && (
                  <text
                    x={CELL / 2}
                    y={showBoth ? CELL - 9 : CELL / 2 + 7}
                    textAnchor="middle"
                    fontSize={showBoth ? 13 : 20}
                    fill={showBoth ? "var(--muted)" : "var(--ink)"}
                  >
                    {arrowFor(a)}
                  </text>
                )}
              </>
            )}
          </g>
        );
      })}
    </g>
  );
}

/**
 * One or more grids side by side under a shared caption. Panels wrap into rows
 * so four grids do not force a horizontal scroll on a phone.
 */
export function GridRow({
  grids,
  caption,
  perRow,
  scale,
  mode = "value",
  decimals = 2,
  accent = "var(--c-rl)",
}: {
  grids: GridSpec[];
  caption?: React.ReactNode;
  perRow?: number;
  scale?: number;
  mode?: CellMode;
  decimals?: number;
  accent?: string;
}) {
  // A shared colour scale across panels, unless a panel overrides it: the point
  // of putting grids next to each other is that the colours mean the same thing.
  const auto =
    scale ??
    Math.max(
      ...grids.flatMap((g) => (g.values ?? []).map((v) => Math.abs(v))),
      1e-9,
    );

  const cols = perRow ?? Math.min(grids.length, 4);
  const rows = Math.ceil(grids.length / cols);
  const GAP = 26;
  const GW = CELL * 4;
  const labelLines = Math.max(
    1,
    ...grids.map((g) => (typeof g.label === "string" ? wrapLabel(g.label).length : 1)),
  );
  // 12 is the first baseline: a fontSize-11 label has ~11.4 user units of
  // ascent above its baseline, so a baseline at 9 or 11 puts the tops of the
  // glyphs outside the viewBox and the browser clips them.
  const LABEL = 12 + labelLines * 12;
  const W = cols * GW + (cols - 1) * GAP;
  const H = rows * (GW + LABEL) + (rows - 1) * GAP;

  return (
    <figure style={{ margin: "1.8rem 0" }}>
      <div style={{ overflowX: "auto" }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          role="img"
          aria-label={grids.map((g) => g.label).filter(Boolean).join("; ") || "grid of state values"}
          style={{ display: "block", minWidth: Math.min(W, 300), maxWidth: "100%" }}
        >
          {grids.map((g, i) => {
            const r = Math.floor(i / cols);
            const c = i % cols;
            const gx = c * (GW + GAP);
            const gy = r * (GW + LABEL + GAP);
            return (
              <g key={i}>
                {g.label != null &&
                  (typeof g.label === "string" ? wrapLabel(g.label) : [g.label]).map((ln, li) => (
                    <text key={li} x={gx} y={gy + 12 + li * 12} fontSize={11} fill="var(--muted)">
                      {ln}
                    </text>
                  ))}
                <ValueGrid
                  {...g}
                  x={gx}
                  y={gy + LABEL}
                  mode={g.mode ?? mode}
                  scale={g.scale ?? auto}
                  decimals={g.decimals ?? decimals}
                  accent={g.accent ?? accent}
                />
              </g>
            );
          })}
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
