// Diagrams for the Planning track: the wiring and the taxonomies. Anything with
// a measured number in it lives in GridField / PlanningCharts instead.
//
// Static SVG, no client JS.

const GOLD = "var(--c-rl)";
const BAD = "var(--bad)";
const GOOD = "var(--good)";

function Fig({ children, caption, label, W, H, minWidth = 320 }: {
  children: React.ReactNode; caption?: React.ReactNode; label: string; W: number; H: number; minWidth?: number;
}) {
  return (
    <figure style={{ margin: "1.8rem 0" }}>
      <div style={{ overflowX: "auto" }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={label} style={{ display: "block", minWidth, maxWidth: "100%" }}>
          <defs>
            <marker id="pl-arrow" viewBox="0 0 8 8" refX={7} refY={4} markerWidth={6} markerHeight={6} orient="auto">
              <path d="M 0 0 L 8 4 L 0 8 z" fill="var(--muted)" />
            </marker>
            <marker id="pl-arrow-gold" viewBox="0 0 8 8" refX={7} refY={4} markerWidth={6} markerHeight={6} orient="auto">
              <path d="M 0 0 L 8 4 L 0 8 z" fill={GOLD} />
            </marker>
          </defs>
          {children}
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

function Box({ x, y, w, h, title, sub, color = "var(--border-strong)" }: {
  x: number; y: number; w: number; h: number; title: string; sub?: string; color?: string;
}) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={5} fill="var(--panel)" stroke={color} strokeWidth={1.2} />
      <text x={x + w / 2} y={sub ? y + h / 2 - 3 : y + h / 2 + 4} textAnchor="middle" fontSize={11.5} fill="var(--ink)" fontWeight={600}>
        {title}
      </text>
      {sub && (
        <text x={x + w / 2} y={y + h / 2 + 13} textAnchor="middle" fontSize={10} fill="var(--muted)">
          {sub}
        </text>
      )}
    </g>
  );
}

// ---------------------------------------------------------------------------
// The two questions the whole family is built out of.
// ---------------------------------------------------------------------------
export function PredictionVsControl({ caption }: { caption?: React.ReactNode }) {
  const W = 440, H = 208;
  return (
    <Fig W={W} H={H} label="prediction and control, the two questions" caption={caption} minWidth={340}>
      <text x={110} y={18} textAnchor="middle" fontSize={11} fill={GOOD} fontWeight={700}>PREDICTION</text>
      <text x={330} y={18} textAnchor="middle" fontSize={11} fill={GOLD} fontWeight={700}>CONTROL</text>

      <Box x={26} y={30} w={168} h={40} title="a policy π is given" sub="follow these arrows" color={GOOD} />
      <Box x={246} y={30} w={168} h={40} title="no policy is given" sub="you choose the arrows" color={GOLD} />

      <line x1={110} y1={72} x2={110} y2={100} stroke="var(--muted)" strokeWidth={1.2} markerEnd="url(#pl-arrow)" />
      <line x1={330} y1={72} x2={330} y2={100} stroke={GOLD} strokeWidth={1.2} markerEnd="url(#pl-arrow-gold)" />

      <Box x={26} y={102} w={168} h={44} title="Vπ" sub="what is this worth?" color={GOOD} />
      <Box x={246} y={102} w={168} h={44} title="V*  and  π*" sub="what is the best it can be?" color={GOLD} />

      <line x1={110} y1={148} x2={110} y2={168} stroke="var(--muted)" strokeWidth={1.2} markerEnd="url(#pl-arrow)" />
      <line x1={330} y1={148} x2={330} y2={168} stroke="var(--muted)" strokeWidth={1.2} markerEnd="url(#pl-arrow)" />
      <rect x={26} y={170} width={388} height={30} rx={5} fill="var(--panel)" stroke="var(--border-strong)" strokeWidth={1.2} strokeDasharray="4 3" />
      <text x={220} y={189} textAnchor="middle" fontSize={11} fill="var(--ink)">
        both are solved by sweeping the same Bellman backup
      </text>
    </Fig>
  );
}

// ---------------------------------------------------------------------------
// The one change that separates this track from the next: a weighted sum over
// every successor, or one sampled successor.
// ---------------------------------------------------------------------------
export function ModelVsSample({ caption }: { caption?: React.ReactNode }) {
  const W = 440, H = 212;
  const leftX = 110, rightX = 330, topY = 52, botY = 150;
  const fan = [-58, -20, 20, 58];

  return (
    <Fig W={W} H={H} label="a full backup over every successor against a sampled backup" caption={caption} minWidth={340}>
      <text x={leftX} y={20} textAnchor="middle" fontSize={11} fill={GOLD} fontWeight={700}>PLANNING</text>
      <text x={leftX} y={33} textAnchor="middle" fontSize={9.5} fill="var(--muted)">read the model</text>
      <text x={rightX} y={20} textAnchor="middle" fontSize={11} fill={GOOD} fontWeight={700}>LEARNING</text>
      <text x={rightX} y={33} textAnchor="middle" fontSize={9.5} fill="var(--muted)">sample the world</text>

      {[leftX, rightX].map((cx) => (
        <circle key={cx} cx={cx} cy={topY} r={11} fill="var(--panel)" stroke="var(--border-strong)" strokeWidth={1.2} />
      ))}
      <text x={leftX} y={topY + 4} textAnchor="middle" fontSize={10} fill="var(--ink)">s</text>
      <text x={rightX} y={topY + 4} textAnchor="middle" fontSize={10} fill="var(--ink)">s</text>

      {/* every successor, weighted */}
      {fan.map((d) => (
        <g key={d}>
          <line x1={leftX} y1={topY + 11} x2={leftX + d} y2={botY - 9} stroke={GOLD} strokeWidth={1.3} markerEnd="url(#pl-arrow-gold)" />
          <circle cx={leftX + d} cy={botY} r={8} fill="var(--panel)" stroke={GOLD} strokeWidth={1.1} />
        </g>
      ))}
      <text x={leftX} y={botY + 30} textAnchor="middle" fontSize={10} fill="var(--muted)">
        all of them, each weighted
      </text>
      <text x={leftX} y={botY + 43} textAnchor="middle" fontSize={10} fill="var(--muted)">
        by P(s′ | s, a)
      </text>

      {/* one sample */}
      {fan.map((d) => (
        <g key={d}>
          <line
            x1={rightX}
            y1={topY + 11}
            x2={rightX + d}
            y2={botY - 9}
            stroke="var(--border-strong)"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
          <circle
            cx={rightX + d}
            cy={botY}
            r={8}
            fill="var(--panel)"
            stroke={d === 20 ? GOOD : "var(--border-strong)"}
            strokeWidth={d === 20 ? 1.8 : 1}
          />
        </g>
      ))}
      <line x1={rightX} y1={topY + 11} x2={rightX + 20} y2={botY - 9} stroke={GOOD} strokeWidth={2} />
      <text x={rightX} y={botY + 30} textAnchor="middle" fontSize={10} fill="var(--muted)">
        one of them, the one
      </text>
      <text x={rightX} y={botY + 43} textAnchor="middle" fontSize={10} fill="var(--muted)">
        that actually happened
      </text>
    </Fig>
  );
}

// ---------------------------------------------------------------------------
// GPI: two processes pulling on the same pair, meeting at one fixed point.
// ---------------------------------------------------------------------------
export function GpiLoop({ caption }: { caption?: React.ReactNode }) {
  const W = 400, H = 222;
  const cx = 200;
  return (
    <Fig W={W} H={H} label="evaluation and improvement pulling toward one fixed point" caption={caption} minWidth={300}>
      <Box x={cx - 170} y={26} w={150} h={44} title="evaluation" sub="V → Vπ" color={GOOD} />
      <Box x={cx + 20} y={26} w={150} h={44} title="improvement" sub="π → greedy(V)" color={GOLD} />

      <path d={`M ${cx - 20} 48 L ${cx + 14} 48`} stroke="var(--muted)" strokeWidth={1.3} markerEnd="url(#pl-arrow)" />
      <path
        d={`M ${cx + 95} 72 C ${cx + 95} 120 ${cx - 95} 120 ${cx - 95} 74`}
        fill="none"
        stroke="var(--muted)"
        strokeWidth={1.3}
        markerEnd="url(#pl-arrow)"
      />

      <text x={cx} y={112} textAnchor="middle" fontSize={10} fill="var(--muted)">
        each step undoes a little of the other
      </text>

      <line x1={cx - 150} y1={150} x2={cx + 150} y2={150} stroke="var(--border-strong)" strokeWidth={0.9} />
      <circle cx={cx} cy={150} r={7} fill={GOLD} />
      <text x={cx} y={172} textAnchor="middle" fontSize={11} fill="var(--ink)" fontWeight={600}>
        V*, π*
      </text>
      <text x={cx} y={188} textAnchor="middle" fontSize={10} fill="var(--muted)">
        the one pair neither process wants to move
      </text>
      <text x={cx - 150} y={207} fontSize={9.5} fill="var(--muted)">V accurate for π</text>
      <text x={cx + 150} y={207} textAnchor="end" fontSize={9.5} fill="var(--muted)">π greedy for V</text>
    </Fig>
  );
}

// ---------------------------------------------------------------------------
// The dial: how many evaluation sweeps you run between improvements.
// ---------------------------------------------------------------------------
export function SweepSpectrum({
  marks,
  caption,
}: {
  marks?: { at: number; label: string; sub?: string }[];
  caption?: React.ReactNode;
}) {
  const W = 440, H = 164, L = 40, R = 400, AX = 74;
  const items = marks ?? [
    { at: 0, label: "value iteration", sub: "1 sweep" },
    { at: 0.42, label: "modified PI", sub: "k sweeps" },
    { at: 1, label: "policy iteration", sub: "to convergence" },
  ];
  return (
    <Fig W={W} H={H} label="the dial between value iteration and policy iteration" caption={caption} minWidth={340}>
      <text x={L} y={26} fontSize={10} fill="var(--muted)">cheaper per round</text>
      <text x={R} y={26} textAnchor="end" fontSize={10} fill="var(--muted)">more informed per round</text>

      <line x1={L} y1={AX} x2={R} y2={AX} stroke="var(--border-strong)" strokeWidth={2} />
      {items.map((m) => {
        const x = L + m.at * (R - L);
        const anchor = m.at === 0 ? "start" : m.at === 1 ? "end" : "middle";
        return (
          <g key={m.label}>
            <circle cx={x} cy={AX} r={6} fill={GOLD} />
            <text x={x} y={AX - 14} textAnchor={anchor} fontSize={11} fill="var(--ink)" fontWeight={600}>
              {m.label}
            </text>
            {m.sub && (
              <text x={x} y={AX + 22} textAnchor={anchor} fontSize={10} fill="var(--muted)">
                {m.sub}
              </text>
            )}
          </g>
        );
      })}
      <text x={(L + R) / 2} y={AX + 56} textAnchor="middle" fontSize={10.5} fill="var(--ink)">
        evaluation sweeps per improvement
      </text>
      <text x={(L + R) / 2} y={AX + 72} textAnchor="middle" fontSize={10} fill="var(--muted)">
        every setting on this line is a correct algorithm
      </text>
    </Fig>
  );
}

// ---------------------------------------------------------------------------
// The board itself: what the rewards are, before any values exist.
// ---------------------------------------------------------------------------
export function RewardBoard({
  step,
  goal,
  pit,
  gamma,
  caption,
}: {
  step: number;
  goal: number;
  pit: number;
  gamma: number;
  caption?: React.ReactNode;
}) {
  const CELL = 46, W = 440, H = 232;
  const GX = 22, GY = 34;
  const goalCell = 15, pitCell = 3;

  return (
    <Fig W={W} H={H} label="the goal and pit grid and its rewards" caption={caption} minWidth={340}>
      <text x={GX} y={22} fontSize={10.5} fill="var(--muted)">the board</text>
      {Array.from({ length: 16 }, (_, s) => {
        const r = Math.floor(s / 4), c = s % 4;
        const isGoal = s === goalCell, isPit = s === pitCell;
        return (
          <g key={s} transform={`translate(${GX + c * CELL} ${GY + r * CELL})`}>
            <rect
              width={CELL}
              height={CELL}
              fill={
                isGoal
                  ? `color-mix(in srgb, ${GOOD} 30%, var(--panel))`
                  : isPit
                    ? `color-mix(in srgb, ${BAD} 30%, var(--panel))`
                    : "var(--panel)"
              }
              stroke="var(--border-strong)"
              strokeWidth={0.8}
            />
            {(isGoal || isPit) && (
              <text x={CELL / 2} y={CELL / 2 + 6} textAnchor="middle" fontSize={17} fontWeight={700} fill={isGoal ? GOOD : BAD}>
                {isGoal ? "G" : "P"}
              </text>
            )}
            <text x={3} y={10} fontSize={8} fill="var(--faint)">{s}</text>
          </g>
        );
      })}

      {[
        { c: GOOD, t: `entering G pays ${goal > 0 ? "+" : ""}${goal}`, s: "and the episode ends" },
        { c: BAD, t: `entering P pays ${pit}`, s: "and the episode ends" },
        { c: "var(--muted)", t: `every other step pays ${step}`, s: "so dawdling is not free" },
        { c: "var(--muted)", t: `γ = ${gamma}`, s: "so later reward is worth less" },
      ].map((row, i) => (
        <g key={row.t} transform={`translate(${GX + 4 * CELL + 22} ${GY + 14 + i * 46})`}>
          <rect x={0} y={-9} width={11} height={11} rx={2} fill={row.c} opacity={0.72} />
          <text x={19} y={0} fontSize={11} fill="var(--ink)">{row.t}</text>
          <text x={19} y={14} fontSize={9.5} fill="var(--muted)">{row.s}</text>
        </g>
      ))}
    </Fig>
  );
}
