// The warehouse capstone's signature motif (PROJECT.md §11): the floor plan itself.
// Drawn in the capstone's SHOP-FLOOR skin (--wh-* tokens, see globals.css) so the
// figure IS the identity rather than a generic chart — sealed-concrete tiles, the
// spill wall hatched in warning red, and the two crossings marked in hi-vis tape
// the way a real floor marks a walkway. Static SVG — no client JS, no state.

const FLOOR = ["S......D", "........", "HHH.HH..", "........", "P......."];
const NROW = FLOOR.length;
const NCOL = FLOOR[0].length;

const CELL = 52;
const X0 = 30;
const Y0 = 26;
const W = X0 + NCOL * CELL + 14;
const H = Y0 + NROW * CELL + 46;

const LABEL: Record<string, string> = { S: "dock", P: "shelf", D: "drop" };

const stencil = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", letterSpacing: "0.1em" } as const;

export function FloorPlan({ accent = "var(--wh-tape-deep)" }: { accent?: string }) {
  const cx = (c: number) => X0 + c * CELL + CELL / 2;
  const cy = (r: number) => Y0 + r * CELL + CELL / 2;

  return (
    <figure style={{ margin: "1.9rem 0" }}>
      <div
        className="wh-slab"
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 16,
          border: "1px solid var(--wh-seam)",
          padding: "24px 18px 16px",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.28)",
        }}
      >
        <div className="wh-tape wh-tape-run" style={{ position: "absolute", inset: "0 0 auto 0", height: 7 }} aria-hidden="true" />
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: "100%", maxWidth: 520, display: "block", margin: "0 auto" }}
          role="img"
          aria-label="Floor plan of the warehouse: a 5 by 8 grid with the dock at top left, the pickup shelf at bottom left, the dropoff at top right, and a wall of spilled cells across the middle row broken by a narrow doorway at column 3 and a wider bypass at columns 6 and 7."
        >
          {/* cells — concrete tiles, the two crossings taped off in hi-vis */}
          {FLOOR.map((row, r) =>
            row.split("").map((ch, c) => {
              const spill = ch === "H";
              const gap = r === 2 && !spill;
              return (
                <rect
                  key={`${r}-${c}`}
                  x={X0 + c * CELL}
                  y={Y0 + r * CELL}
                  width={CELL}
                  height={CELL}
                  fill={
                    spill
                      ? "color-mix(in srgb, var(--wh-spill) 26%, var(--wh-slab-2))"
                      : gap
                        ? "color-mix(in srgb, var(--wh-tape) 34%, var(--wh-slab))"
                        : "var(--wh-slab)"
                  }
                  stroke="var(--wh-seam)"
                  strokeWidth={1}
                />
              );
            }),
          )}

          {/* spill hatching */}
          {FLOOR.map((row, r) =>
            row.split("").map((ch, c) =>
              ch === "H" ? (
                <g key={`h-${r}-${c}`} stroke="var(--wh-spill)" strokeWidth={1.2} opacity={0.75}>
                  <line x1={X0 + c * CELL + 6} y1={Y0 + r * CELL + CELL - 6} x2={X0 + c * CELL + CELL - 6} y2={Y0 + r * CELL + 6} />
                  <line x1={X0 + c * CELL + 6} y1={Y0 + r * CELL + CELL / 2} x2={X0 + c * CELL + CELL / 2} y2={Y0 + r * CELL + 6} />
                  <line x1={X0 + c * CELL + CELL / 2} y1={Y0 + r * CELL + CELL - 6} x2={X0 + c * CELL + CELL - 6} y2={Y0 + r * CELL + CELL / 2} />
                </g>
              ) : null,
            ),
          )}

          {/* the three landmarks — stencilled crate letters */}
          {FLOOR.map((row, r) =>
            row.split("").map((ch, c) =>
              LABEL[ch] ? (
                <g key={`l-${r}-${c}`}>
                  <rect
                    x={cx(c) - 13}
                    y={cy(r) - 18}
                    width={26}
                    height={26}
                    rx={4}
                    fill="color-mix(in srgb, var(--wh-ink) 10%, transparent)"
                    stroke="color-mix(in srgb, var(--wh-ink) 45%, transparent)"
                    strokeWidth={1.4}
                  />
                  <text x={cx(c)} y={cy(r)} textAnchor="middle" fontSize={14} fontWeight={700} fill="var(--wh-ink)" style={stencil}>
                    {ch}
                  </text>
                  <text x={cx(c)} y={cy(r) + 19} textAnchor="middle" fontSize={9.5} fill="var(--wh-ink-soft)" style={stencil}>
                    {LABEL[ch]}
                  </text>
                </g>
              ) : null,
            ),
          )}

          {/* row / column rulers */}
          {Array.from({ length: NROW }, (_, r) => (
            <text key={`r${r}`} x={X0 - 9} y={cy(r) + 4} textAnchor="end" fontSize={10} fill="var(--wh-faint)" style={stencil}>
              {r}
            </text>
          ))}
          {Array.from({ length: NCOL }, (_, c) => (
            <text key={`c${c}`} x={cx(c)} y={Y0 - 9} textAnchor="middle" fontSize={10} fill="var(--wh-faint)" style={stencil}>
              {c}
            </text>
          ))}

          {/* the two crossings */}
          <defs>
            <marker id="fp-arrow" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0 0 L8 4 L0 8 z" fill={accent} />
            </marker>
          </defs>
          <line
            x1={cx(3)} y1={Y0 + 1 * CELL + 8} x2={cx(3)} y2={Y0 + 3 * CELL - 4}
            stroke={accent} strokeWidth={2.4} strokeDasharray="5 4" markerEnd="url(#fp-arrow)"
          />
          <line
            x1={cx(6)} y1={Y0 + 1 * CELL + 8} x2={cx(6)} y2={Y0 + 3 * CELL - 4}
            stroke={accent} strokeWidth={2.4} strokeDasharray="5 4" markerEnd="url(#fp-arrow)"
          />
          <text x={cx(3)} y={H - 24} textAnchor="middle" fontSize={10.5} fontWeight={700} fill="var(--wh-ink)" style={stencil}>
            DOORWAY
          </text>
          <text x={cx(3)} y={H - 11} textAnchor="middle" fontSize={9.5} fill="var(--wh-ink-soft)">
            short, flanked by spills
          </text>
          <text x={cx(6) + 8} y={H - 24} textAnchor="middle" fontSize={10.5} fontWeight={700} fill="var(--wh-ink)" style={stencil}>
            BYPASS
          </text>
          <text x={cx(6) + 8} y={H - 11} textAnchor="middle" fontSize={9.5} fill="var(--wh-ink-soft)">
            longer, nothing adjacent
          </text>
        </svg>
      </div>
      <figcaption
        style={{
          fontSize: 13,
          color: "var(--muted)",
          textAlign: "center",
          marginTop: 10,
          lineHeight: 1.5,
        }}
      >
        The floor. Hatched cells are spills: entering one costs 30 and throws the robot back to the dock. The wall
        between the shelf and the dropoff has exactly two ways through, and the robot must cross it twice per
        delivery.
      </figcaption>
    </figure>
  );
}
