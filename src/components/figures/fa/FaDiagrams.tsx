// Diagrams for the Function-approximation track that need no measured data:
// the wiring, the state machines and the taxonomies. Everything with numbers in
// it lives in Staircase / CostToGo / data.generated.ts instead.
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
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={label} style={{ display: "block", minWidth }}>
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

// ---------------------------------------------------------------------------
// Baird's counterexample: seven states, two actions, and the feature vectors.
// ---------------------------------------------------------------------------
export function BairdStates({ caption }: { caption?: React.ReactNode }) {
  const W = 440, H = 216;
  const upper = Array.from({ length: 6 }, (_, i) => ({
    x: 46 + i * 70,
    y: 56,
    label: i + 1,
  }));
  const lower = { x: 46 + 2.5 * 70, y: 158, label: 7 };

  return (
    <Fig W={W} H={H} label="Baird's seven-state counterexample" caption={caption} minWidth={360}>
      {/* Both actions connect the same pairs of nodes, in opposite directions:
          the dashed one runs 7 -> upper, the solid one upper -> 7. Drawn as
          straight lines they coincide exactly, so each pair is bowed apart. */}
      {upper.map((u) => {
        const mx = (u.x + lower.x) / 2;
        const my = (u.y + lower.y) / 2;
        // Perpendicular offset, so the two arcs separate either side of the chord.
        const dx = lower.x - u.x, dy = lower.y - u.y;
        const len = Math.hypot(dx, dy) || 1;
        const nx = (-dy / len) * 13, ny = (dx / len) * 13;
        return (
          <g key={u.label}>
            <path
              d={`M ${lower.x} ${lower.y - 13} Q ${mx + nx} ${my + ny} ${u.x} ${u.y + 13}`}
              fill="none"
              stroke="var(--muted)"
              strokeWidth={0.9}
              strokeDasharray="3 3"
            />
            <path
              d={`M ${u.x} ${u.y + 13} Q ${mx - nx} ${my - ny} ${lower.x} ${lower.y - 13}`}
              fill="none"
              stroke={GOLD}
              strokeWidth={1.4}
            />
          </g>
        );
      })}
      <circle cx={lower.x} cy={lower.y} r={13} fill="var(--surface)" stroke={GOLD} strokeWidth={1.8} />
      <text x={lower.x} y={lower.y + 4} textAnchor="middle" fontSize={11} fill="var(--ink)">7</text>
      {/* state 7's self-loop under the solid action */}
      <path
        d={`M ${lower.x + 13} ${lower.y} a 15 15 0 1 0 -6 12`}
        fill="none"
        stroke={GOLD}
        strokeWidth={1.5}
      />
      {upper.map((u) => (
        <g key={u.label}>
          <circle cx={u.x} cy={u.y} r={13} fill="var(--surface)" stroke="var(--border)" strokeWidth={1.2} />
          <text x={u.x} y={u.y + 4} textAnchor="middle" fontSize={11} fill="var(--ink)">{u.label}</text>
        </g>
      ))}

      <text x={8} y={18} fontSize={10} fill={GOLD}>
        ── solid action: the TARGET policy always takes it
      </text>
      <text x={8} y={32} fontSize={10} fill="var(--muted)">
        ­­- - dashed action: the BEHAVIOUR policy takes it 6 times in 7
      </text>
      <text x={8} y={H - 22} fontSize={10} fill="var(--muted)">
        Every reward is 0 and γ = 0.99, so every true value is 0 — and w = 0 represents that exactly.
      </text>
      <text x={8} y={H - 8} fontSize={10} fill="var(--muted)">
        The 8 features are redundant: state 7 is (0,0,0,0,0,0,1,2), each other state i is 2·e&#8337; + e&#8328;.
      </text>
    </Fig>
  );
}

// ---------------------------------------------------------------------------
// The deadly triad: three conditions, one dangerous intersection.
// ---------------------------------------------------------------------------
export function TriadDiagram({ caption }: { caption?: React.ReactNode }) {
  // Laid out from the bottom up so every label has somewhere to go:
  //   top circle spans   cy - d - r  ..  cy - d + r      label above it
  //   lower circles span cy + e - r  ..  cy + e + r      labels below them
  //   then two summary lines.
  const cx = 200, cy = 128, r = 66, d = 38, e = 24;
  const W = 400;
  const LABEL_TOP = cy - d - r - 9;          // 15
  const LABEL_BOTTOM = cy + e + r + 17;      // 235
  const H = LABEL_BOTTOM + 44;               // room for both summary lines

  const circles = [
    { key: "fa", x: cx, y: cy - d, color: GOLD },
    { key: "bs", x: cx - d * 0.92, y: cy + e, color: GOOD },
    { key: "op", x: cx + d * 0.92, y: cy + e, color: BAD },
  ];

  return (
    <Fig W={W} H={H} label="The deadly triad" caption={caption} minWidth={300}>
      {circles.map((c) => (
        <circle key={c.key} cx={c.x} cy={c.y} r={r} fill={c.color} opacity={0.1} stroke={c.color} strokeWidth={1.2} />
      ))}
      <circle cx={cx} cy={cy} r={13} fill={BAD} opacity={0.6} />
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize={11} fill="var(--surface)" fontWeight={700}>!</text>

      <text x={cx} y={LABEL_TOP} textAnchor="middle" fontSize={11} fill={GOLD} fontWeight={600}>
        function approximation
      </text>
      <text x={14} y={LABEL_BOTTOM} textAnchor="start" fontSize={11} fill={GOOD} fontWeight={600}>
        bootstrapping
      </text>
      <text x={W - 14} y={LABEL_BOTTOM} textAnchor="end" fontSize={11} fill={BAD} fontWeight={600}>
        off-policy training
      </text>

      <text x={cx} y={H - 22} textAnchor="middle" fontSize={10.5} fill="var(--ink)">
        All three at once: divergence is possible. Any two: convergence is guaranteed.
      </text>
      <text x={cx} y={H - 7} textAnchor="middle" fontSize={10} fill="var(--muted)">
        Baird&rsquo;s counterexample sits in the marked centre. DQN sits there too.
      </text>
    </Fig>
  );
}

// ---------------------------------------------------------------------------
// DQN: the two networks, the buffer, and the copy.
// ---------------------------------------------------------------------------
export function DqnDiagram({ caption }: { caption?: React.ReactNode }) {
  const W = 450, H = 214;
  const box = (x: number, y: number, w: number, h: number, t: string, s: string, color = "var(--border)") => (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={6} fill="var(--surface)" stroke={color} strokeWidth={1.3} />
      <text x={x + w / 2} y={y + 17} textAnchor="middle" fontSize={10.5} fill="var(--ink)" fontWeight={600}>{t}</text>
      <text x={x + w / 2} y={y + 31} textAnchor="middle" fontSize={9} fill="var(--muted)">{s}</text>
    </g>
  );
  const arrow = (x1: number, y1: number, x2: number, y2: number, color = "var(--muted)", dash?: string) => (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={1.2} strokeDasharray={dash} />
      <path
        d={`M ${x2} ${y2} L ${x2 - 6 * Math.cos(Math.atan2(y2 - y1, x2 - x1) - 0.4)} ${y2 - 6 * Math.sin(Math.atan2(y2 - y1, x2 - x1) - 0.4)} L ${x2 - 6 * Math.cos(Math.atan2(y2 - y1, x2 - x1) + 0.4)} ${y2 - 6 * Math.sin(Math.atan2(y2 - y1, x2 - x1) + 0.4)} Z`}
        fill={color}
      />
    </g>
  );

  return (
    <Fig W={W} H={H} label="DQN: online network, target network and replay buffer" caption={caption} minWidth={360}>
      {box(12, 92, 78, 42, "environment", "s, r")}
      {box(122, 92, 96, 42, "replay buffer", "last 200k steps", GOLD)}
      {box(256, 30, 92, 42, "online net", "Q(s,a; θ)", GOLD)}
      {box(256, 154, 92, 42, "target net", "Q(s,a; θ⁻)", "var(--muted)")}
      {box(370, 92, 68, 42, "loss", "TD error")}

      {arrow(90, 113, 122, 113)}
      <text x={98} y={108} fontSize={8.5} fill="var(--muted)">store</text>

      {arrow(218, 106, 256, 68, GOLD)}
      {arrow(218, 120, 256, 166)}
      <text x={220} y={138} fontSize={8.5} fill="var(--muted)">sample a</text>
      <text x={220} y={148} fontSize={8.5} fill="var(--muted)">random batch</text>

      {arrow(348, 60, 370, 100)}
      {arrow(348, 166, 370, 126)}
      {arrow(404, 92, 404, 74, GOLD)}
      <path d="M 404 74 L 404 60 L 302 60 L 302 72" fill="none" stroke={GOLD} strokeWidth={1.2} />
      <text x={352} y={86} fontSize={8.5} fill={GOLD}>gradient</text>

      {/* the periodic copy */}
      {arrow(302, 72, 302, 154, "var(--muted)", "4 3")}
      <text x={308} y={116} fontSize={8.5} fill="var(--muted)">copy θ → θ⁻</text>
      <text x={308} y={126} fontSize={8.5} fill="var(--muted)">every N steps</text>

      <text x={12} y={18} fontSize={10} fill="var(--ink)" fontWeight={600}>
        Only the online network learns.
      </text>
    </Fig>
  );
}

// ---------------------------------------------------------------------------
// Semi-gradient: which half of the derivative is thrown away.
// ---------------------------------------------------------------------------
export function SemiGradient({ caption }: { caption?: React.ReactNode }) {
  const W = 420, H = 152;
  return (
    <Fig W={W} H={H} label="Which term the semi-gradient drops" caption={caption} minWidth={330}>
      <text x={W / 2} y={22} textAnchor="middle" fontSize={11} fill="var(--ink)">
        the TD error depends on w twice
      </text>

      <rect x={26} y={44} width={166} height={44} rx={6} fill={GOOD} opacity={0.12} stroke={GOOD} />
      <text x={109} y={62} textAnchor="middle" fontSize={11} fill="var(--ink)">the estimate</text>
      <text x={109} y={78} textAnchor="middle" fontSize={11} fill="var(--ink)">v̂(S, w)</text>
      <text x={109} y={104} textAnchor="middle" fontSize={9.5} fill={GOOD}>differentiated ✓</text>

      <rect x={228} y={44} width={166} height={44} rx={6} fill="var(--surface-2)" stroke="var(--border)" strokeDasharray="4 3" />
      <text x={311} y={62} textAnchor="middle" fontSize={11} fill="var(--muted)">the target</text>
      <text x={311} y={78} textAnchor="middle" fontSize={11} fill="var(--muted)">R + γ v̂(S′, w)</text>
      <text x={311} y={104} textAnchor="middle" fontSize={9.5} fill="var(--muted)">treated as a constant ✗</text>

      <text x={W / 2} y={130} textAnchor="middle" fontSize={10} fill="var(--muted)">
        This is why it is a <tspan fontStyle="italic">semi</tspan>-gradient: it is not the gradient of any
        objective.
      </text>
      <text x={W / 2} y={144} textAnchor="middle" fontSize={10} fill="var(--muted)">
        Dropping the second term is what makes it fast, and what makes the triad possible.
      </text>
    </Fig>
  );
}
