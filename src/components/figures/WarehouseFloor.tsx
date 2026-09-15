// The warehouse capstone's card figure: the actual floor the robot is trained on.
//
// FLOOR is copied from the capstone's own world (see src/components/capstone/FloorPlan.tsx) —
// a 5x8 shop floor with the dock top-left, the pickup shelf bottom-left, the dropoff top-right,
// and a wall of spilled cells across the middle broken by exactly two crossings: a narrow doorway
// at column 3 and a wider bypass at columns 6-7. The route drawn is a genuine shortest path for
// the job (dock → shelf → dropoff), verified against the wall below, and it deliberately uses a
// different crossing on each leg, which is the thing that makes this world interesting to solve.
//
// Painted in the capstone's shop-floor skin (--wh-* tokens, theme-independent: concrete is
// concrete at night too) so the figure carries the identity rather than being a generic chart.
// Static SVG, server component, no client JS.

const FLOOR = ["S......D", "........", "HHH.HH..", "........", "P......."];
const NROW = FLOOR.length;
const NCOL = FLOOR[0].length;

const CELL = 50;
const W = 640;
const H = 300;
const X0 = (W - NCOL * CELL) / 2;
const Y0 = 20;

/** dock → shelf, then shelf → dropoff; each leg crosses the spill wall at a different gap. */
const ROUTE: [number, number][] = [
  [0, 0], [0, 1], [0, 2], [0, 3], [1, 3], [2, 3], [3, 3], [3, 2], [3, 1], [3, 0], [4, 0],
  [4, 1], [4, 2], [4, 3], [4, 4], [4, 5], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6], [0, 7],
];

const at = (r: number, c: number) => FLOOR[r][c];
const cx = (c: number) => X0 + c * CELL + CELL / 2;
const cy = (r: number) => Y0 + r * CELL + CELL / 2;

const stencil = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  letterSpacing: "0.1em",
} as const;

export function WarehouseFloor() {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label="The warehouse floor: a 5 by 8 grid with the dock at top left, the pickup shelf at bottom left and the dropoff at top right, split by a wall of spilled cells with two crossings. The marked route runs dock to shelf through the narrow doorway, then shelf to dropoff through the wider bypass."
    >
      <defs>
        <pattern id="wh-spill-hatch" width={8} height={8} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width={8} height={8} fill="color-mix(in srgb, var(--wh-spill) 22%, var(--wh-slab-2))" />
          <line x1={0} y1={0} x2={0} y2={8} stroke="var(--wh-spill)" strokeWidth={2.4} opacity={0.5} />
        </pattern>
      </defs>

      {/* the slab */}
      <rect x={0} y={0} width={W} height={H} rx={10} fill="var(--wh-slab)" />

      {/* cells */}
      {FLOOR.map((row, r) =>
        row.split("").map((ch, c) => {
          const spill = ch === "H";
          const crossing = r === 2 && !spill;
          return (
            <rect
              key={`${r}-${c}`}
              x={X0 + c * CELL}
              y={Y0 + r * CELL}
              width={CELL}
              height={CELL}
              fill={
                spill
                  ? "url(#wh-spill-hatch)"
                  : crossing
                    ? "color-mix(in srgb, var(--wh-tape) 26%, var(--wh-slab-2))"
                    : "var(--wh-slab-2)"
              }
              stroke="var(--wh-seam)"
              strokeWidth={1}
            />
          );
        }),
      )}

      {/* the two crossings, taped off the way a real floor marks a walkway */}
      {[3, 6].map((c) => (
        <g key={c}>
          <line
            x1={X0 + c * CELL + 4} y1={Y0 + 2 * CELL + 3}
            x2={X0 + (c === 6 ? c + 2 : c + 1) * CELL - 4} y2={Y0 + 2 * CELL + 3}
            stroke="var(--wh-tape)" strokeWidth={3} strokeLinecap="round"
          />
          <line
            x1={X0 + c * CELL + 4} y1={Y0 + 3 * CELL - 3}
            x2={X0 + (c === 6 ? c + 2 : c + 1) * CELL - 4} y2={Y0 + 3 * CELL - 3}
            stroke="var(--wh-tape)" strokeWidth={3} strokeLinecap="round"
          />
        </g>
      ))}

      {/* the marked route */}
      <polyline
        points={ROUTE.map(([r, c]) => `${cx(c)},${cy(r)}`).join(" ")}
        fill="none"
        stroke="var(--wh-route)"
        strokeWidth={4}
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={0.92}
      />

      {/* the three places that matter */}
      {FLOOR.map((row, r) =>
        row.split("").map((ch, c) => {
          if (ch === "." || ch === "H") return null;
          const label = ch === "S" ? "DOCK" : ch === "P" ? "SHELF" : "DROP";
          return (
            <g key={`m${r}-${c}`}>
              <rect
                x={X0 + c * CELL + 5} y={Y0 + r * CELL + 5}
                width={CELL - 10} height={CELL - 10} rx={4}
                fill="var(--wh-ink)" opacity={ch === "D" ? 1 : 0.14}
                stroke="var(--wh-ink)" strokeWidth={1.4}
              />
              <text
                x={cx(c)} y={cy(r) + 3.5} textAnchor="middle" fontSize={10.5}
                fill={ch === "D" ? "var(--wh-tape)" : "var(--wh-ink)"} style={stencil}
              >
                {label}
              </text>
            </g>
          );
        }),
      )}

      {/* the robot, parked at the dock where every episode starts — tucked into the corner of the
          cell so it does not sit on top of the stencilled label */}
      <circle
        cx={X0 + CELL - 11} cy={Y0 + CELL - 11} r={5.5}
        fill="var(--wh-route)" stroke="var(--wh-slab-2)" strokeWidth={2}
      />

      <text x={X0} y={H - 6} fontSize={11} fill="var(--wh-faint)" style={stencil}>
        SPILL WALL · TWO CROSSINGS · 21 STEPS DOCK→SHELF→DROP
      </text>
    </svg>
  );
}
