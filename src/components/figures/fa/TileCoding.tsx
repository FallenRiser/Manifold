// Tile coding, drawn — which is the only way this idea is ever explained,
// except here, where four pages described offset tilings in prose.
//
// The offsets are not decorative and they are not invented for the picture:
// they are computed with the same rule as the TileCoder shipped in FA_SETUP,
//
//     offsets[i] = (i / num_tilings) * width * (2*dim + 1)
//
// so tiling i is displaced by i/n of a tile width along x and 3i/n along y.
// That asymmetry is the whole trick — with equal offsets in both dimensions the
// tilings would shift along a diagonal and the receptive fields would be far
// coarser than the tile count suggests.
//
// Static SVG, no client JS.

const COLORS = ["var(--c-rl)", "var(--good)", "var(--bad)"];

function tilingOffsets(n: number, tiles: number) {
  // Matches TileCoder.__init__: width = (high - low) / (tiles - 1), and the
  // per-dimension multiplier is 2*d + 1.
  const width = 1 / (tiles - 1);
  return Array.from({ length: n }, (_, i) => [
    (i / n) * width * 1,
    (i / n) * width * 3,
  ]);
}

export function TileCoding({
  tilings = 3,
  tiles = 5,
  point = [0.42, 0.58],
  caption,
}: {
  tilings?: number;
  tiles?: number;
  point?: [number, number];
  caption?: React.ReactNode;
}) {
  const S = 150, GAP = 22;
  const W = tilings * S + (tilings - 1) * GAP + 108;
  const H = S + 40;
  const offs = tilingOffsets(tilings, tiles);
  const width = 1 / (tiles - 1);

  // Which tile does `point` land in, per tiling? Same floor() as the code.
  const active = offs.map(([ox, oy]) => [
    Math.min(Math.max(Math.floor((point[0] + ox) / width), 0), tiles - 1),
    Math.min(Math.max(Math.floor((point[1] + oy) / width), 0), tiles - 1),
  ]);

  return (
    <figure style={{ margin: "1.8rem 0" }}>
      <div style={{ overflowX: "auto" }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`${tilings} offset tilings and the tiles active for one point`} style={{ display: "block", minWidth: 340 }}>
          {offs.map(([ox, oy], t) => {
            const x0 = t * (S + GAP);
            const [ax, ay] = active[t];
            return (
              <g key={t} transform={`translate(${x0} 24)`}>
                <text x={0} y={-8} fontSize={10.5} fill={COLORS[t % COLORS.length]} fontWeight={600}>
                  tiling {t + 1}
                </text>
                <text x={S} y={-8} textAnchor="end" fontSize={9} fill="var(--muted)">
                  offset ({(ox / width).toFixed(2)}, {(oy / width).toFixed(2)}) tiles
                </text>
                <clipPath id={`clip-${t}`}>
                  <rect x={0} y={0} width={S} height={S} />
                </clipPath>
                <g clipPath={`url(#clip-${t})`}>
                  {/* the active tile, filled */}
                  <rect
                    x={(ax * width - ox) * S}
                    y={S - (ay * width - oy) * S - width * S}
                    width={width * S}
                    height={width * S}
                    fill={COLORS[t % COLORS.length]}
                    opacity={0.24}
                  />
                  {Array.from({ length: tiles + 1 }, (_, k) => (
                    <g key={k}>
                      <line
                        x1={(k * width - ox) * S}
                        y1={0}
                        x2={(k * width - ox) * S}
                        y2={S}
                        stroke={COLORS[t % COLORS.length]}
                        strokeWidth={0.9}
                        opacity={0.7}
                      />
                      <line
                        x1={0}
                        y1={S - (k * width - oy) * S}
                        x2={S}
                        y2={S - (k * width - oy) * S}
                        stroke={COLORS[t % COLORS.length]}
                        strokeWidth={0.9}
                        opacity={0.7}
                      />
                    </g>
                  ))}
                </g>
                <rect x={0} y={0} width={S} height={S} fill="none" stroke="var(--border)" strokeWidth={1} />
                <circle cx={point[0] * S} cy={S - point[1] * S} r={3.6} fill="var(--ink)" />
              </g>
            );
          })}

          {/* the sum */}
          <g transform={`translate(${tilings * (S + GAP) - GAP + 16} 24)`}>
            <text x={0} y={S / 2 - 16} fontSize={11} fill="var(--ink)">
              the state&rsquo;s
            </text>
            <text x={0} y={S / 2 - 2} fontSize={11} fill="var(--ink)">
              features: {tilings} of
            </text>
            <text x={0} y={S / 2 + 12} fontSize={11} fill="var(--ink)">
              {tilings * tiles * tiles} weights,
            </text>
            <text x={0} y={S / 2 + 26} fontSize={11} fill="var(--ink)">
              one per tiling
            </text>
          </g>

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

/** Coarse coding vs a table: what a single update touches. */
export function GeneralisationFootprint({ caption }: { caption?: React.ReactNode }) {
  const S = 132, GAP = 30;
  const cells = 12;
  const c = 1 / cells;
  const W = 2 * S + GAP + 6;
  const H = S + 52;
  const hit = [5, 6] as const;

  return (
    <figure style={{ margin: "1.8rem 0" }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="What one update changes, table versus tile coding" style={{ display: "block", maxWidth: "100%" }}>
        {[0, 1].map((panel) => {
          const x0 = panel * (S + GAP) + 3;
          return (
            <g key={panel} transform={`translate(${x0} 22)`}>
              <text x={0} y={-8} fontSize={10.5} fill="var(--ink)" fontWeight={600}>
                {panel === 0 ? "a table" : "3 tilings"}
              </text>
              {Array.from({ length: cells }, (_, i) =>
                Array.from({ length: cells }, (_, j) => {
                  // A table update touches exactly one cell. Tile coding touches
                  // every cell sharing any of the three active tiles.
                  const on =
                    panel === 0
                      ? i === hit[0] && j === hit[1]
                      : Math.abs(i - hit[0]) <= 1 && Math.abs(j - hit[1]) <= 1;
                  const strength =
                    panel === 0
                      ? 1
                      : (3 - Math.abs(i - hit[0]) - Math.abs(j - hit[1])) / 3;
                  return (
                    <rect
                      key={`${i}-${j}`}
                      x={i * c * S}
                      y={S - (j + 1) * c * S}
                      width={c * S - 0.7}
                      height={c * S - 0.7}
                      fill={on ? "var(--c-rl)" : "var(--surface-2)"}
                      opacity={on ? 0.28 + 0.6 * strength : 1}
                    />
                  );
                })
              )}
              <rect x={0} y={0} width={S} height={S} fill="none" stroke="var(--border)" />
              <text x={S / 2} y={S + 14} textAnchor="middle" fontSize={9.5} fill="var(--muted)">
                {panel === 0 ? "1 state changed" : "a neighbourhood changed"}
              </text>
            </g>
          );
        })}
      </svg>
      {caption && (
        <figcaption style={{ fontSize: 13, color: "var(--muted)", marginTop: 10, lineHeight: 1.55 }}>
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
