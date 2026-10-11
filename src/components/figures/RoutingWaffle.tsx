import sy from "@/data/routing/system.json";

// The message-routing capstone in one picture: next month's 7,532 posts as a hundred squares, each square one
// per cent, coloured by where the finished system puts them at the router's threshold: filed by the thread lookup,
// filed by the router, read by a person, or placed in a wrong forum. Counts from src/data/routing/system.json
// (section 51 of scripts/routing_cases.py); squares by largest remainder, so they always add to a hundred.
// Server component, integer coordinates: nothing to hydrate.

const D = sy as unknown as {
  posts: number; threshold: number; grid: (number | null)[];
  look_right: number[]; two: number[]; follow: number[]; filed: number[]; filed_right: number[]; person: number[];
};
const AT = D.grid.findIndex((g) => g === D.threshold);
const PARTS = [
  { label: "filed by the lookup", n: D.look_right[AT], fill: "color-mix(in srgb, var(--c-post) 40%, var(--surface))" },
  { label: "filed by the router", n: D.filed_right[AT], fill: "var(--c-post)" },
  { label: "read by a person", n: D.person[AT], fill: "var(--surface)" },
  { label: "wrong forum", n: D.filed[AT] - D.filed_right[AT] + D.follow[AT] + D.two[AT], fill: "var(--bad)" },
];
const raw = PARTS.map((p) => (100 * p.n) / D.posts);
const cells = raw.map(Math.floor);
raw.map((v, i) => [v - Math.floor(v), i] as const).sort((a, b) => b[0] - a[0])
  .slice(0, 100 - cells.reduce((a, b) => a + b, 0)).forEach(([, i]) => { cells[i] += 1; });
const KIND = cells.flatMap((c, i) => Array<number>(c).fill(i));

const W = 640, H = 300, COLS = 20, ROWS = 5, S = 26, G = 4;
const X0 = (W - (COLS * S + (COLS - 1) * G)) / 2, Y0 = 26;

export function RoutingWaffle() {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img"
      aria-label={`next month's ${D.posts} posts: ${PARTS.map((p, i) => `${cells[i]}% ${p.label}`).join(", ")}`}>
      {KIND.map((k, i) => {
        const c = i % COLS, r = Math.floor(i / COLS);
        return (
          <rect key={i} x={X0 + c * (S + G)} y={Y0 + r * (S + G)} width={S} height={S} rx={4}
            fill={PARTS[k].fill} stroke={k === 2 ? "var(--border-strong)" : "none"} strokeWidth={1.5}
            strokeDasharray={k === 2 ? "3 2" : undefined} />
        );
      })}
      {PARTS.map((p, i) => {
        // two columns of two: the labels are too long for four across
        const x = 70 + (i % 2) * 290, y = Y0 + ROWS * (S + G) + 20 + Math.floor(i / 2) * 28;
        return (
          <g key={p.label}>
            <rect x={x} y={y} width={14} height={14} rx={3} fill={p.fill}
              stroke={i === 2 ? "var(--border-strong)" : "none"} strokeWidth={1.5} strokeDasharray={i === 2 ? "3 2" : undefined} />
            <text x={x + 22} y={y + 12} fontSize={15} fill="var(--muted)">
              <tspan fill="var(--ink)" fontWeight={600}>{cells[i]}%</tspan> {p.label}
            </text>
          </g>
        );
      })}
      <text x={W / 2} y={H - 14} fontSize={14} textAnchor="middle" fill="var(--faint)">
        next month&rsquo;s {D.posts.toLocaleString("en-US")} posts, one square per cent
      </text>
    </svg>
  );
}
