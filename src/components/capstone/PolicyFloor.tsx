// Renders a learned policy as a plan you can READ — arrows painted on the shop
// floor, with the route the policy actually induces from the dock traced in hi-vis
// tape. Takes the SAME verified ASCII grid the page prints from the runnable cell,
// so the figure is a rendering of the published output, never a redrawing of it.
//
// Grid tokens: > < ^ v (greedy action), ## (spill), any other glyph (a landmark).

const CELL = 40;
const PAD = 12;

type Dir = ">" | "<" | "^" | "v";
const STEP: Record<Dir, [number, number]> = { ">": [0, 1], "<": [0, -1], "^": [-1, 0], v: [1, 0] };

function parse(rows: string[]) {
  return rows.map((r) => r.trim().split(/\s+/));
}

// Follow the greedy arrows from the dock. Deterministic and purely a reading of the
// grid above — it stops at a landmark, a spill, the edge, or a loop.
function trace(grid: string[][]) {
  const path: [number, number][] = [[0, 0]];
  let r = 0;
  let c = 0;
  const seen = new Set<string>(["0,0"]);
  for (let i = 0; i < 40; i++) {
    const tok = grid[r]?.[c];
    if (!tok || !(tok in STEP)) break;
    const [dr, dc] = STEP[tok as Dir];
    r += dr;
    c += dc;
    if (r < 0 || c < 0 || r >= grid.length || c >= grid[0].length) break;
    if (grid[r][c] === "##") break;
    path.push([r, c]);
    const key = `${r},${c}`;
    if (seen.has(key)) break;
    seen.add(key);
    if (!(grid[r][c] in STEP)) break; // reached a landmark
  }
  return path;
}

export function PolicyFloor({
  rows,
  label,
  note,
  routeColor = "var(--wh-tape)",
}: {
  rows: string[];
  label: string;
  note?: string;
  routeColor?: string;
}) {
  const grid = parse(rows);
  const NR = grid.length;
  const NC = grid[0].length;
  const W = PAD * 2 + NC * CELL;
  const H = PAD * 2 + NR * CELL;
  const cx = (c: number) => PAD + c * CELL + CELL / 2;
  const cy = (r: number) => PAD + r * CELL + CELL / 2;
  const path = trace(grid);

  return (
    <div style={{ minWidth: 0 }}>
      <div
        style={{
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: 10.5,
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--wh-ink)",
          marginBottom: 7,
        }}
      >
        {label}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }} role="img" aria-label={`${label}: ${note ?? "policy arrows on the warehouse floor"}`}>
        {grid.map((row, r) =>
          row.map((tok, c) => (
            <rect
              key={`c${r}-${c}`}
              x={PAD + c * CELL}
              y={PAD + r * CELL}
              width={CELL}
              height={CELL}
              fill={tok === "##" ? "color-mix(in srgb, var(--wh-spill) 26%, var(--wh-slab-2))" : "var(--wh-slab)"}
              stroke="var(--wh-seam)"
              strokeWidth={1}
            />
          )),
        )}

        {/* spill hatching */}
        {grid.map((row, r) =>
          row.map((tok, c) =>
            tok === "##" ? (
              <g key={`h${r}-${c}`} stroke="var(--wh-spill)" strokeWidth={1.1} opacity={0.75}>
                <line x1={PAD + c * CELL + 5} y1={PAD + r * CELL + CELL - 5} x2={PAD + c * CELL + CELL - 5} y2={PAD + r * CELL + 5} />
                <line x1={PAD + c * CELL + 5} y1={PAD + r * CELL + CELL / 2} x2={PAD + c * CELL + CELL / 2} y2={PAD + r * CELL + 5} />
              </g>
            ) : null,
          ),
        )}

        {/* the induced route, taped onto the floor under the arrows */}
        {path.length > 1 && (
          <polyline
            points={path.map(([r, c]) => `${cx(c)},${cy(r)}`).join(" ")}
            fill="none"
            stroke={routeColor}
            strokeWidth={9}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.85}
          />
        )}

        {/* the greedy action in every state */}
        {grid.map((row, r) =>
          row.map((tok, c) => {
            if (tok === "##") return null;
            if (tok in STEP) {
              const [dr, dc] = STEP[tok as Dir];
              const L = 11;
              const x1 = cx(c) - dc * L;
              const y1 = cy(r) - dr * L;
              const x2 = cx(c) + dc * L;
              const y2 = cy(r) + dr * L;
              return (
                <g key={`a${r}-${c}`}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--wh-ink)" strokeWidth={1.8} strokeLinecap="round" />
                  <path
                    d={`M${x2},${y2} L${x2 - dc * 6 - dr * 4},${y2 - dr * 6 - dc * 4} L${x2 - dc * 6 + dr * 4},${y2 - dr * 6 + dc * 4} Z`}
                    fill="var(--wh-ink)"
                  />
                </g>
              );
            }
            return (
              <g key={`m${r}-${c}`}>
                <rect
                  x={cx(c) - 11}
                  y={cy(r) - 11}
                  width={22}
                  height={22}
                  rx={4}
                  fill="color-mix(in srgb, var(--wh-ink) 10%, transparent)"
                  stroke="color-mix(in srgb, var(--wh-ink) 45%, transparent)"
                  strokeWidth={1.3}
                />
                <text
                  x={cx(c)}
                  y={cy(r) + 4.5}
                  textAnchor="middle"
                  fontSize={12}
                  fontWeight={700}
                  fill="var(--wh-ink)"
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                >
                  {tok}
                </text>
              </g>
            );
          }),
        )}
      </svg>
      {note && (
        <div style={{ fontSize: 12.5, lineHeight: 1.5, color: "var(--wh-ink-soft)", marginTop: 7 }}>{note}</div>
      )}
    </div>
  );
}
