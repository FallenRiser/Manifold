import { BEST, NO_GO } from "./sim";

// The heading histogram from the page's cell, drawn as it looks from the boat: wind at the top, each
// wedge a 10° slice of heading, its length the share of beating seconds spent there.

const SHARES: [number, number][] = [
  [-80, 4.3], [-70, 11.9], [-60, 9.7], [-50, 20.0], [-40, 8.4], [-30, 0.1], [-20, 0.0], [-10, 0.0],
  [0, 0.3], [10, 0.4], [20, 0.5], [30, 10.0], [40, 6.2], [50, 6.4], [60, 5.1], [70, 4.4],
];

export function HeadingRose() {
  const W = 640, H = 316, ox = 320, oy = 290, k = 11; // px per percentage point
  const pt = (deg: number, r: number) => ({ x: ox + r * Math.sin((deg * Math.PI) / 180), y: oy - r * Math.cos((deg * Math.PI) / 180) });
  const wedge = (a0: number, a1: number, r: number) => {
    const p0 = pt(a0, r), p1 = pt(a1, r);
    return `M${ox},${oy} L${p0.x},${p0.y} A${r},${r} 0 0 1 ${p1.x},${p1.y} Z`;
  };
  return (
    <figure style={{ margin: "1.2rem 0 1.5rem" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 600, height: "auto", display: "block", margin: "0 auto" }} role="img"
        aria-label="Rose of headings while beating upwind: two lobes either side of an empty no-go zone">
        {[5, 10, 15, 20].map((p) => (
          <g key={p}>
            <path d={`M${pt(-90, p * k).x},${pt(-90, p * k).y} A${p * k},${p * k} 0 0 1 ${pt(90, p * k).x},${pt(90, p * k).y}`} fill="none" stroke="var(--border)" />
            <text x={ox + 3} y={oy - p * k - 3} fontSize={9.5} fill="var(--faint)">{p}%</text>
          </g>
        ))}
        <path d={wedge(-NO_GO, NO_GO, 23 * k)} fill="color-mix(in srgb, var(--bad) 8%, transparent)" />
        <text x={ox} y={oy - 17.5 * k} fontSize={11} textAnchor="middle" fill="var(--bad)">no-go zone</text>
        {SHARES.map(([lo, s]) => (
          <path key={lo} d={wedge(lo + 0.8, lo + 9.2, Math.max(0.6, s) * k)} fill="var(--c-rl)" fillOpacity={Math.abs(lo + 5) < NO_GO ? 0.35 : 0.85}>
            <title>{`${lo}° to ${lo + 10}°: ${s.toFixed(1)}%`}</title>
          </path>
        ))}
        {[-BEST.angle, BEST.angle].map((a) => {
          const p = pt(a, 22 * k);
          return <line key={a} x1={ox} y1={oy} x2={p.x} y2={p.y} stroke="var(--c-regression)" strokeWidth={1.4} strokeDasharray="5 4" />;
        })}
        <text x={pt(BEST.angle, 22.5 * k).x + 4} y={pt(BEST.angle, 22.5 * k).y} fontSize={11} fill="var(--c-regression)">best angle {BEST.angle.toFixed(1)}°</text>
        <text x={pt(-BEST.angle, 22.5 * k).x - 4} y={pt(-BEST.angle, 22.5 * k).y} fontSize={11} fill="var(--c-regression)" textAnchor="end">−{BEST.angle.toFixed(1)}°</text>
        <g stroke="var(--c-regression)" strokeWidth={1.5} fill="none" opacity={0.6}>
          <line x1={ox} y1={6} x2={ox} y2={22} /><path d={`M${ox - 4},17 L${ox},23 L${ox + 4},17`} />
        </g>
        <text x={ox + 8} y={16} fontSize={11} fill="var(--c-regression)">wind</text>
        <text x={pt(-80, 9 * k).x - 6} y={oy - 2} fontSize={11.5} fill="var(--muted)" textAnchor="end">one tack</text>
        <text x={pt(80, 9 * k).x + 6} y={oy - 2} fontSize={11.5} fill="var(--muted)">the other</text>
        <circle cx={ox} cy={oy} r={3} fill="var(--ink)" />
      </svg>
      <figcaption style={{ fontSize: 12, color: "var(--faint)", lineHeight: 1.5, textAlign: "center" }}>
        The histogram above, seen from the boat. Two lobes, one per tack, and an almost empty wedge where pointing at the mark would put it
        (1.3% of beating time). The remaining 12.3% is beyond ±80° and not drawn.
      </figcaption>
    </figure>
  );
}
