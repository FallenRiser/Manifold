const GRID = [-1, -0.66, -0.33, 0, 0.33, 0.66, 1];
const SAMPLES = 13;

function project(u: number, v: number): [number, number] {
  const z = 0.5 * (u * u + v * v);
  return [160 + (u - v) * 58, 128 + (u + v) * 26 - z * 64];
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

const depth = (c: number) => 0.28 + ((c + 1) / 2) * 0.5;

// a static descent path curving down the inside of the bowl to the minimum
const descent: string[] = [];
for (let i = 0; i <= 16; i++) {
  const t = i / 16;
  const u = 0.92 * (1 - t) * Math.cos(t * 4.2);
  const v = 0.92 * (1 - t) * Math.sin(t * 4.2);
  const [x, y] = project(u, v);
  descent.push(`${x.toFixed(1)},${y.toFixed(1)}`);
}

export function LossSurface3D() {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "16px 16px 8px", margin: "1.6rem 0" }}>
      <div className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", marginBottom: 2 }}>
        The loss surface
      </div>
      <div style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 6 }}>
        every point is one possible line; its height is that line&rsquo;s error
      </div>
      <svg viewBox="0 0 320 230" style={{ width: "100%", height: "auto", display: "block", maxWidth: 420, margin: "0 auto" }} role="img" aria-label="A bowl-shaped loss surface with a path descending to the minimum at the bottom.">
        <g fill="none" stroke="var(--brand)" strokeWidth={1.1} strokeLinejoin="round">
          {GRID.map((u) => (
            <polyline key={`u${u}`} points={polyline(u, "u")} strokeOpacity={depth(u)} />
          ))}
          {GRID.map((v) => (
            <polyline key={`v${v}`} points={polyline(v, "v")} strokeOpacity={depth(v)} />
          ))}
        </g>
        <polyline points={descent.join(" ")} fill="none" stroke="var(--c-fundamentals)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={project(0.92, 0)[0]} cy={project(0.92, 0)[1]} r={3} fill="var(--c-fundamentals)" />
        <circle cx={project(0, 0)[0]} cy={project(0, 0)[1]} r={4.5} fill="var(--good)" />
        <text x={project(0, 0)[0] + 9} y={project(0, 0)[1] + 4} fontSize={11} fill="var(--muted)">the best line</text>
      </svg>
    </div>
  );
}
