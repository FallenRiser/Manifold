// Mountain Car's cost-to-go surface, and the greedy policy it implies.
//
// This is the most reproduced figure in Sutton & Barto, the page it belongs on
// is called "Mountain Car: what it actually learned", and the track drew
// neither it nor anything else. Drawn here as a heatmap rather than a 3-D
// surface: the thing a reader needs to read off it is where the expensive
// region is and what shape its boundary has, and a rotated wireframe hides
// exactly that behind its own perspective.
//
// Static SVG, no client JS.

const GOLD = "var(--c-rl)";

export function CostToGo({
  cost,
  pos,
  vel,
  action,
  caption,
  showAction = true,
}: {
  cost: number[][];
  pos: number[];
  vel: number[];
  action?: number[][];
  caption?: React.ReactNode;
  showAction?: boolean;
}) {
  const ny = cost.length, nx = cost[0].length;
  const flat = cost.flat();
  const lo = Math.min(...flat), hi = Math.max(...flat);

  const S = 168, GAP = 44;
  const panels = showAction && action ? 2 : 1;
  const W = 40 + panels * S + (panels - 1) * GAP + 14;
  const H = S + 84;

  const shade = (v: number) => {
    const t = (v - lo) / (hi - lo || 1);
    return `color-mix(in srgb, ${GOLD} ${(6 + t * 86).toFixed(0)}%, var(--surface))`;
  };
  // reverse / coast / forward — three flat tints, since this is categorical.
  const ACT = ["var(--bad)", "var(--surface-2)", "var(--good)"];

  const cw = S / nx, ch = S / ny;

  const axes = (x0: number, title: string) => (
    <g>
      <text x={x0} y={14} fontSize={10.5} fill="var(--ink)" fontWeight={600}>{title}</text>
      <rect x={x0} y={22} width={S} height={S} fill="none" stroke="var(--border)" />
      <text x={x0 + S / 2} y={22 + S + 14} textAnchor="middle" fontSize={9.5} fill="var(--muted)">
        position −1.2 → 0.6
      </text>
    </g>
  );

  return (
    <figure style={{ margin: "1.8rem 0" }}>
      <div style={{ overflowX: "auto" }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Mountain Car cost-to-go surface" style={{ display: "block", minWidth: 320 }}>
          <text x={8} y={30} fontSize={9.5} fill="var(--muted)">vel</text>
          <text x={8} y={22 + S} fontSize={9.5} fill="var(--muted)">−.07</text>
          <text x={8} y={40} fontSize={9.5} fill="var(--muted)">+.07</text>

          {/* cost-to-go */}
          {cost.map((row, j) =>
            row.map((v, i) => (
              <rect
                key={`c-${i}-${j}`}
                x={40 + i * cw}
                y={22 + (ny - 1 - j) * ch}
                width={cw + 0.4}
                height={ch + 0.4}
                fill={shade(v)}
              />
            ))
          )}
          {axes(40, "cost-to-go  −maxₐ q(s,a)")}

          {showAction && action && (
            <>
              {action.map((row, j) =>
                row.map((a, i) => (
                  <rect
                    key={`a-${i}-${j}`}
                    x={40 + S + GAP + i * cw}
                    y={22 + (ny - 1 - j) * ch}
                    width={cw + 0.4}
                    height={ch + 0.4}
                    fill={ACT[a]}
                    opacity={a === 1 ? 1 : 0.5}
                  />
                ))
              )}
              {axes(40 + S + GAP, "the greedy action")}
            </>
          )}

          {/* legends */}
          <g transform={`translate(40 ${H - 14})`}>
            <text x={0} y={0} fontSize={9} fill="var(--muted)">
              pale = cheap → dark = {hi.toFixed(0)} steps
            </text>
          </g>
          {showAction && action && (
            <g transform={`translate(${40 + S + GAP} ${H - 14})`}>
              {[["reverse", 0], ["coast", 1], ["forward", 2]].map(([lab, a], k) => (
                <g key={lab as string} transform={`translate(${k * 58} 0)`}>
                  <rect x={0} y={-8} width={9} height={9} fill={ACT[a as number]} opacity={a === 1 ? 1 : 0.5} />
                  <text x={13} y={0} fontSize={9} fill="var(--muted)">{lab}</text>
                </g>
              ))}
            </g>
          )}
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

/** Consecutive transitions versus a sampled batch — the replay argument. */
export function ReplayScatter({
  consecutive,
  sampled,
  caption,
}: {
  consecutive: number[][];
  sampled: number[][];
  caption?: React.ReactNode;
}) {
  const S = 150, GAP = 40;
  const W = 24 + 2 * S + GAP + 8;
  const H = S + 44;
  const panel = (pts: number[][], x0: number, title: string, join: boolean) => (
    <g>
      <text x={x0} y={14} fontSize={10.5} fill="var(--ink)" fontWeight={600}>{title}</text>
      <rect x={x0} y={22} width={S} height={S} fill="var(--surface-2)" stroke="var(--border)" />
      {join && (
        <path
          d={pts.map((p, i) => `${i ? "L" : "M"} ${(x0 + p[0] * S).toFixed(1)} ${(22 + S - p[1] * S).toFixed(1)}`).join(" ")}
          fill="none"
          stroke={GOLD}
          strokeWidth={1}
          opacity={0.75}
        />
      )}
      {pts.map((p, i) => (
        <circle key={i} cx={x0 + p[0] * S} cy={22 + S - p[1] * S} r={1.9} fill={GOLD} opacity={0.85} />
      ))}
      <text x={x0 + S / 2} y={22 + S + 14} textAnchor="middle" fontSize={9.5} fill="var(--muted)">
        position →
      </text>
    </g>
  );
  return (
    <figure style={{ margin: "1.8rem 0" }}>
      <div style={{ overflowX: "auto" }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Consecutive versus sampled transitions" style={{ display: "block", minWidth: 320 }}>
          <text x={4} y={32} fontSize={9.5} fill="var(--muted)">vel</text>
          {panel(consecutive, 24, "120 consecutive steps", true)}
          {panel(sampled, 24 + S + GAP, "120 sampled from the buffer", false)}
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
