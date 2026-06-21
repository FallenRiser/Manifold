const GRID = [-1, -0.5, 0, 0.5, 1];
const SAMPLES = 13;

function project(u: number, v: number): [number, number] {
  const z = 0.55 * (u * u - v * v);
  return [50 + (u - v) * 24, 50 + (u + v) * 12 - z * 26];
}

function polyline(fixed: number, axis: "u" | "v"): string {
  const pts: string[] = [];
  for (let i = 0; i < SAMPLES; i++) {
    const t = -1 + (2 * i) / (SAMPLES - 1);
    const [x, y] = axis === "u" ? project(fixed, t) : project(t, fixed);
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(" ");
}

// depth-based opacity: lines toward the front (larger coordinate) read stronger
const depth = (c: number) => 0.42 + ((c + 1) / 2) * 0.43;

export function ManifoldMark({ size = 34 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-label="Manifold"
      style={{ flexShrink: 0 }}
    >
      <g fill="none" stroke="var(--brand)" strokeWidth={1.3} strokeLinejoin="round" strokeLinecap="round">
        {GRID.map((u) => (
          <polyline key={`u${u}`} points={polyline(u, "u")} strokeOpacity={depth(u)} />
        ))}
        {GRID.map((v) => (
          <polyline key={`v${v}`} points={polyline(v, "v")} strokeOpacity={depth(v)} />
        ))}
      </g>
      <circle cx={50} cy={50} r={2.3} fill="var(--brand)" />
    </svg>
  );
}
