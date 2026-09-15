// Diagrams for the k-Means track: the wiring and the taxonomies. Anything with
// a measured number lives in Scatter / KmeansCharts instead.
//
// Static SVG, no client JS.

const TEAL = "var(--c-clustering)";
const PINK = "var(--brand-2)";
const GOOD = "var(--good)";
const BAD = "var(--bad)";
const GOLD = "var(--c-rl)";

function Fig({ children, caption, label, W, H, minWidth = 320 }: {
  children: React.ReactNode; caption?: React.ReactNode; label: string; W: number; H: number; minWidth?: number;
}) {
  return (
    <figure style={{ margin: "1.8rem 0" }}>
      <div style={{ overflowX: "auto" }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={label} style={{ display: "block", minWidth, maxWidth: "100%" }}>
          <defs>
            <marker id="km-arrow" viewBox="0 0 8 8" refX={7} refY={4} markerWidth={6} markerHeight={6} orient="auto">
              <path d="M 0 0 L 8 4 L 0 8 z" fill="var(--muted)" />
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

function Box({ x, y, w, h, title, sub, color = "var(--border-strong)", fill = "var(--panel)" }: {
  x: number; y: number; w: number; h: number; title: string; sub?: string; color?: string; fill?: string;
}) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={5} fill={fill} stroke={color} strokeWidth={1.2} />
      <text x={x + w / 2} y={sub ? y + h / 2 - 3 : y + h / 2 + 4} textAnchor="middle" fontSize={11} fill="var(--ink)" fontWeight={600}>
        {title}
      </text>
      {sub && (
        <text x={x + w / 2} y={y + h / 2 + 12} textAnchor="middle" fontSize={9.5} fill="var(--muted)">
          {sub}
        </text>
      )}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Where clustering sits among the things you do without labels.
// ---------------------------------------------------------------------------
export function UnsupervisedMap({ caption }: { caption?: React.ReactNode }) {
  const W = 440, H = 262;
  const tasks = [
    { x: 14, t: "clustering", s: "group the rows", c: TEAL },
    { x: 124, t: "dimensionality", s: "shrink the columns", c: "var(--c-regression)" },
    { x: 234, t: "density", s: "model where data is", c: PINK },
    { x: 344, t: "association", s: "what co-occurs", c: GOLD },
  ];
  const kinds = [
    { x: 14, t: "centroid", s: "k-means, k-medoids" },
    { x: 124, t: "density", s: "DBSCAN, HDBSCAN" },
    { x: 234, t: "hierarchical", s: "Ward, single-link" },
    { x: 344, t: "distributional", s: "GMM + EM" },
  ];

  return (
    <Fig W={W} H={H} label="the unsupervised landscape" caption={caption} minWidth={360}>
      <rect x={10} y={10} width={W - 20} height={32} rx={5} fill="var(--panel)" stroke="var(--border-strong)" strokeWidth={1.2} />
      <text x={W / 2} y={30} textAnchor="middle" fontSize={11.5} fill="var(--ink)" fontWeight={600}>
        no labels — only X
      </text>

      {tasks.map((t) => (
        <g key={t.t}>
          <line x1={W / 2} y1={42} x2={t.x + 41} y2={62} stroke="var(--border-strong)" strokeWidth={0.9} />
          <rect x={t.x} y={62} width={82} height={38} rx={4} fill="var(--panel)" stroke={t.c} strokeWidth={1.2} />
          <text x={t.x + 41} y={78} textAnchor="middle" fontSize={10} fill={t.c} fontWeight={600}>{t.t}</text>
          <text x={t.x + 41} y={91} textAnchor="middle" fontSize={8.5} fill="var(--muted)">{t.s}</text>
        </g>
      ))}

      <text x={14} y={124} fontSize={10.5} fill="var(--muted)">and clustering itself splits again:</text>
      {kinds.map((k, i) => (
        <g key={k.t}>
          <line x1={55} y1={100} x2={k.x + 41} y2={134} stroke="var(--border)" strokeWidth={0.8} strokeDasharray="2 2" />
          <rect
            x={k.x}
            y={134}
            width={82}
            height={40}
            rx={4}
            fill={i === 0 ? `color-mix(in srgb, ${TEAL} 14%, var(--panel))` : "var(--panel)"}
            stroke={i === 0 ? TEAL : "var(--border-strong)"}
            strokeWidth={i === 0 ? 1.6 : 1}
          />
          <text x={k.x + 41} y={151} textAnchor="middle" fontSize={10} fill="var(--ink)" fontWeight={i === 0 ? 700 : 500}>
            {k.t}
          </text>
          <text x={k.x + 41} y={164} textAnchor="middle" fontSize={8.5} fill="var(--muted)">{k.s}</text>
        </g>
      ))}

      <rect x={10} y={192} width={W - 20} height={56} rx={5} fill="var(--panel)" stroke={TEAL} strokeWidth={1.2} strokeDasharray="4 3" />
      <text x={W / 2} y={212} textAnchor="middle" fontSize={11} fill="var(--ink)" fontWeight={600}>
        k-means is one cell of this diagram
      </text>
      <text x={W / 2} y={228} textAnchor="middle" fontSize={10} fill="var(--muted)">
        centroid-based, hard-assignment, Euclidean, k fixed in advance
      </text>
      <text x={W / 2} y={242} textAnchor="middle" fontSize={10} fill="var(--muted)">
        every one of those four words is a limitation this track returns to
      </text>
    </Fig>
  );
}

// ---------------------------------------------------------------------------
// The two steps, and why neither can go first.
// ---------------------------------------------------------------------------
export function AssignUpdateLoop({ caption }: { caption?: React.ReactNode }) {
  const W = 420, H = 210;
  const cx = 210;
  return (
    <Fig W={W} H={H} label="the assign and update steps" caption={caption} minWidth={320}>
      <Box x={24} y={30} w={160} h={48} title="ASSIGN" sub="each point → nearest centroid" color={TEAL} />
      <Box x={236} y={30} w={160} h={48} title="UPDATE" sub="each centroid → mean of its points" color={PINK} />

      <path d={`M 188 46 L 230 46`} stroke="var(--muted)" strokeWidth={1.4} markerEnd="url(#km-arrow)" />
      <path
        d={`M 316 82 C 316 122 104 122 104 84`}
        fill="none"
        stroke="var(--muted)"
        strokeWidth={1.4}
        markerEnd="url(#km-arrow)"
      />

      <text x={cx} y={112} textAnchor="middle" fontSize={10} fill="var(--muted)">
        each step needs the other&rsquo;s answer to run
      </text>

      <rect x={24} y={130} width={372} height={62} rx={5} fill="var(--panel)" stroke="var(--border-strong)" strokeWidth={1} strokeDasharray="4 3" />
      <text x={cx} y={150} textAnchor="middle" fontSize={11} fill="var(--ink)" fontWeight={600}>
        both steps minimise the same quantity
      </text>
      <text x={cx} y={167} textAnchor="middle" fontSize={10} fill="var(--muted)">
        assign holds the centroids fixed and picks the best labels;
      </text>
      <text x={cx} y={182} textAnchor="middle" fontSize={10} fill="var(--muted)">
        update holds the labels fixed and picks the best centroids.
      </text>
    </Fig>
  );
}

// ---------------------------------------------------------------------------
// Hard assignment against soft: one label, or a mixture.
// ---------------------------------------------------------------------------
export function HardVsSoft({ caption }: { caption?: React.ReactNode }) {
  const W = 440, H = 214;
  const rows = [
    { p: "a point deep inside cluster A", hard: "A", soft: [0.98, 0.02] },
    { p: "a point halfway between A and B", hard: "A", soft: [0.52, 0.48] },
    { p: "a point deep inside cluster B", hard: "B", soft: [0.03, 0.97] },
  ];
  return (
    <Fig W={W} H={H} label="hard assignment against soft responsibilities" caption={caption} minWidth={340}>
      <text x={16} y={20} fontSize={10.5} fill="var(--muted)">the point</text>
      <text x={244} y={20} fontSize={11} fill={TEAL} fontWeight={700}>hard (k-means)</text>
      <text x={344} y={20} fontSize={11} fill={PINK} fontWeight={700}>soft (GMM)</text>

      {rows.map((r, i) => {
        const y = 38 + i * 50;
        return (
          <g key={r.p}>
            <text x={16} y={y + 20} fontSize={10.5} fill="var(--ink)">{r.p}</text>
            <rect x={244} y={y + 4} width={56} height={24} rx={3} fill={`color-mix(in srgb, ${TEAL} 26%, var(--panel))`} stroke={TEAL} strokeWidth={1} />
            <text x={272} y={y + 20} textAnchor="middle" fontSize={11} fill="var(--ink)" fontWeight={600}>{r.hard}</text>

            <rect x={332} y={y + 4} width={92} height={24} rx={3} fill="var(--panel)" stroke="var(--border-strong)" strokeWidth={0.8} />
            <rect x={332} y={y + 4} width={92 * r.soft[0]} height={24} rx={3} fill={PINK} opacity={0.5} />
            <text x={378} y={y + 20} textAnchor="middle" fontSize={9.5} fill="var(--ink)">
              {r.soft[0].toFixed(2)} / {r.soft[1].toFixed(2)}
            </text>
          </g>
        );
      })}

      <line x1={16} y1={186} x2={424} y2={186} stroke="var(--border)" strokeWidth={0.8} />
      <text x={16} y={203} fontSize={10} fill="var(--muted)">
        the middle row is the whole difference: k-means cannot say &ldquo;I am not sure&rdquo;.
      </text>
    </Fig>
  );
}

// ---------------------------------------------------------------------------
// Elkan's bound: one triangle inequality, and what it lets you skip.
// ---------------------------------------------------------------------------
export function TriangleBound({ caption }: { caption?: React.ReactNode }) {
  const W = 430, H = 224;
  const x = { px: 120, py: 154 }, c1 = { px: 70, py: 62 }, c2 = { px: 330, py: 86 };
  return (
    <Fig W={W} H={H} label="the triangle inequality bound Elkan uses" caption={caption} minWidth={340}>
      <line x1={c1.px} y1={c1.py} x2={c2.px} y2={c2.py} stroke="var(--border-strong)" strokeWidth={1.4} />
      <line x1={x.px} y1={x.py} x2={c1.px} y2={c1.py} stroke={GOOD} strokeWidth={2} />
      <line x1={x.px} y1={x.py} x2={c2.px} y2={c2.py} stroke="var(--faint)" strokeWidth={1.4} strokeDasharray="4 3" />

      {[[c1, "c₁", "the centroid x is assigned to"], [c2, "c₂", "a candidate"]].map(([c, n, s]) => {
        const cc = c as { px: number; py: number };
        return (
          <g key={n as string}>
            <circle cx={cc.px} cy={cc.py} r={7} fill="var(--surface)" stroke="var(--ink)" strokeWidth={1.5} />
            <path d={`M ${cc.px - 3.5} ${cc.py} L ${cc.px + 3.5} ${cc.py} M ${cc.px} ${cc.py - 3.5} L ${cc.px} ${cc.py + 3.5}`} stroke="var(--ink)" strokeWidth={1.3} />
            <text x={cc.px} y={cc.py - 13} textAnchor="middle" fontSize={11} fill="var(--ink)" fontWeight={700}>{n as string}</text>
            <text x={cc.px} y={cc.py - 25} textAnchor="middle" fontSize={9} fill="var(--muted)">{s as string}</text>
          </g>
        );
      })}
      <circle cx={x.px} cy={x.py} r={4.5} fill={TEAL} />
      <text x={x.px - 10} y={x.py + 5} textAnchor="end" fontSize={11} fill="var(--ink)" fontWeight={700}>x</text>

      <text x={88} y={108} textAnchor="end" fontSize={10} fill={GOOD}>d(x, c₁)</text>
      <text x={200} y={64} fontSize={10} fill="var(--muted)">d(c₁, c₂)</text>
      <text x={250} y={140} fontSize={10} fill="var(--faint)">d(x, c₂) — never computed</text>

      <rect x={16} y={180} width={W - 32} height={36} rx={4} fill="var(--panel)" stroke={GOOD} strokeWidth={1.1} />
      <text x={W / 2} y={196} textAnchor="middle" fontSize={10.5} fill="var(--ink)">
        if d(c₁, c₂) ≥ 2·d(x, c₁) then c₂ cannot be closer than c₁,
      </text>
      <text x={W / 2} y={210} textAnchor="middle" fontSize={10.5} fill="var(--ink)">
        so the dashed distance is skipped without being wrong.
      </text>
    </Fig>
  );
}

// ---------------------------------------------------------------------------
// Bisecting k-means: repeated 2-way splits down a tree.
// ---------------------------------------------------------------------------
export function BisectTree({ caption }: { caption?: React.ReactNode }) {
  const W = 420, H = 208;
  const node = (x: number, y: number, n: string, hl = false) => (
    <g key={`${x}-${y}`}>
      <rect x={x - 30} y={y} width={60} height={26} rx={4}
        fill={hl ? `color-mix(in srgb, ${TEAL} 22%, var(--panel))` : "var(--panel)"}
        stroke={hl ? TEAL : "var(--border-strong)"} strokeWidth={hl ? 1.6 : 1} />
      <text x={x} y={y + 17} textAnchor="middle" fontSize={10.5} fill="var(--ink)">{n}</text>
    </g>
  );
  const edge = (x1: number, y1: number, x2: number, y2: number) => (
    <line key={`${x1}${y1}${x2}${y2}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--border-strong)" strokeWidth={1} />
  );

  return (
    <Fig W={W} H={H} label="bisecting k-means as a sequence of two-way splits" caption={caption} minWidth={320}>
      {node(210, 14, "all n", false)}
      {edge(210, 40, 120, 66)}
      {edge(210, 40, 300, 66)}
      {node(120, 66, "A")}
      {node(300, 66, "B", true)}
      {edge(300, 92, 250, 118)}
      {edge(300, 92, 358, 118)}
      {node(250, 118, "B1")}
      {node(358, 118, "B2")}

      <text x={16} y={80} fontSize={10} fill="var(--muted)">run 2-means</text>
      <text x={16} y={132} fontSize={10} fill="var(--muted)">split the worst</text>
      <text x={16} y={145} fontSize={10} fill="var(--muted)">leaf, repeat</text>

      <rect x={16} y={160} width={W - 32} height={38} rx={4} fill="var(--panel)" stroke="var(--border-strong)" strokeWidth={1} strokeDasharray="4 3" />
      <text x={W / 2} y={176} textAnchor="middle" fontSize={10.5} fill="var(--ink)">
        k−1 easy 2-way problems instead of one hard k-way problem,
      </text>
      <text x={W / 2} y={190} textAnchor="middle" fontSize={10.5} fill="var(--ink)">
        and a hierarchy falls out for free.
      </text>
    </Fig>
  );
}

// ---------------------------------------------------------------------------
// Why an empty cluster happens and what to do about it.
// ---------------------------------------------------------------------------
export function EmptyCluster({ caption }: { caption?: React.ReactNode }) {
  const W = 430, H = 216;
  return (
    <Fig W={W} H={H} label="how a cluster ends up with no points" caption={caption} minWidth={330}>
      <rect x={16} y={26} width={190} height={110} rx={4} fill="var(--panel)" stroke="var(--border)" strokeWidth={0.8} />
      <text x={16} y={20} fontSize={10.5} fill="var(--muted)">before the assign step</text>
      {[[52, 66], [70, 52], [62, 88], [86, 74], [44, 50], [76, 96]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={3.4} fill={TEAL} opacity={0.75} />
      ))}
      {[[150, 60], [166, 80], [140, 88], [176, 62]].map(([x, y], i) => (
        <circle key={`b${i}`} cx={x} cy={y} r={3.4} fill={PINK} opacity={0.75} />
      ))}
      <g transform="translate(66 72)">
        <circle r={6} fill="var(--surface)" stroke="var(--ink)" strokeWidth={1.4} />
        <path d="M -3 0 L 3 0 M 0 -3 L 0 3" stroke="var(--ink)" strokeWidth={1.3} />
      </g>
      <g transform="translate(158 72)">
        <circle r={6} fill="var(--surface)" stroke="var(--ink)" strokeWidth={1.4} />
        <path d="M -3 0 L 3 0 M 0 -3 L 0 3" stroke="var(--ink)" strokeWidth={1.3} />
      </g>
      <g transform="translate(112 122)">
        <circle r={6} fill="var(--surface)" stroke={BAD} strokeWidth={1.6} />
        <path d="M -3 0 L 3 0 M 0 -3 L 0 3" stroke={BAD} strokeWidth={1.3} />
      </g>
      <text x={112} y={134} textAnchor="middle" fontSize={0} fill="none" />

      <path d="M 214 82 L 236 82" stroke="var(--muted)" strokeWidth={1.4} markerEnd="url(#km-arrow)" />

      <rect x={244} y={26} width={172} height={110} rx={4} fill="var(--panel)" stroke="var(--border)" strokeWidth={0.8} />
      <text x={244} y={20} fontSize={10.5} fill="var(--muted)">after</text>
      <text x={330} y={76} textAnchor="middle" fontSize={11} fill={BAD} fontWeight={600}>0 points</text>
      <text x={330} y={92} textAnchor="middle" fontSize={10} fill="var(--muted)">mean of nothing</text>
      <text x={330} y={106} textAnchor="middle" fontSize={10} fill="var(--muted)">is undefined</text>

      <text x={16} y={160} fontSize={10.5} fill="var(--ink)" fontWeight={600}>the three standard repairs</text>
      {[
        "re-seed it on the point furthest from any centroid",
        "re-seed it inside the cluster with the largest inertia",
        "drop it and continue with k−1 (scikit-learn does the first)",
      ].map((t, i) => (
        <text key={t} x={16} y={177 + i * 14} fontSize={10} fill="var(--muted)">
          · {t}
        </text>
      ))}
    </Fig>
  );
}
