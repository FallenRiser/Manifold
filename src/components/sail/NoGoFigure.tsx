import { BEST, NO_GO } from "./sim";

// Why the obvious route fails: the no-go zone around the wind, a boat that points at the mark and
// stalls in it, and the zig-zag that works. Geometry is to scale (60 m beat, 30° zone, 49.5° legs).

export function NoGoFigure() {
  const W = 640, H = 330, k = 4.2, ox = 320, oy = 300;
  const X = (x: number) => ox + x * k, Y = (y: number) => oy - y * k;
  const t = (d: number) => Math.tan((d * Math.PI) / 180);
  // a one-tack beat: right leg to the layline, then left leg to the mark (y = 60)
  const legY = 60 / 2, legX = legY * t(BEST.angle);
  const zone = 34;
  return (
    <figure style={{ margin: "1.2rem 0 1.5rem" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block", borderRadius: 12, border: "1px solid var(--border)" }}
        role="img" aria-label="The no-go zone, a stalled boat pointing at the mark, and a tacking route">
        <rect x={0} y={0} width={W} height={H} fill="color-mix(in srgb, var(--c-regression) 5%, var(--surface))" />
        {[330, 420, 510, 600].map((ax) => (
          <g key={ax} stroke="var(--c-regression)" strokeWidth={1.5} fill="none" opacity={0.55}>
            <line x1={ax} x2={ax} y1={10} y2={34} /><path d={`M${ax - 5},28 L${ax},36 L${ax + 5},28`} />
          </g>
        ))}
        <text x={20} y={26} fontSize={12} fill="var(--c-regression)">wind blows from the mark toward the start</text>

        {/* the no-go zone from the start */}
        <path d={`M${X(0)},${Y(0)} L${X(-zone * t(NO_GO))},${Y(zone)} L${X(zone * t(NO_GO))},${Y(zone)} Z`} fill="color-mix(in srgb, var(--bad) 14%, transparent)" />
        <text x={X(0)} y={Y(zone) + 16} fontSize={11.5} fill="var(--bad)" textAnchor="middle">no-go zone</text>
        <text x={X(0)} y={Y(zone) + 30} fontSize={10.5} fill="var(--bad)" textAnchor="middle">±{NO_GO}° of the wind</text>

        {/* pointing at the mark: a few metres, then stalled */}
        <line x1={X(0)} y1={Y(0)} x2={X(0)} y2={Y(6)} stroke="var(--bad)" strokeWidth={2.4} />
        <text x={X(-1.2)} y={Y(8.6)} fontSize={15} fill="var(--bad)" fontWeight={700}>✕</text>
        <text x={X(-26)} y={Y(9)} fontSize={11.5} fill="var(--bad)" textAnchor="end">point at the mark:</text>
        <text x={X(-26)} y={Y(9) + 14} fontSize={11.5} fill="var(--bad)" textAnchor="end">stalls &ldquo;in irons&rdquo;</text>

        {/* tacking */}
        <path d={`M${X(0)},${Y(0)} L${X(legX)},${Y(legY)} L${X(0)},${Y(60)}`} fill="none" stroke="var(--c-rl)" strokeWidth={2.6} strokeLinejoin="round" />
        <text x={X(legX) + 10} y={Y(legY) + 4} fontSize={12} fill="var(--c-rl)" fontWeight={600}>tack here</text>
        <text x={X(legX / 2) + 18} y={Y(legY / 2) + 16} fontSize={11.5} fill="var(--c-rl)">sail {BEST.angle.toFixed(1)}° off the wind</text>
        <text x={X(legX / 2) + 18} y={Y(legY * 1.5) - 6} fontSize={11.5} fill="var(--c-rl)">…then {BEST.angle.toFixed(1)}° the other way</text>

        <circle cx={X(0)} cy={Y(60)} r={10 * k} fill="color-mix(in srgb, var(--good) 10%, transparent)" stroke="var(--good)" strokeDasharray="3 3" />
        <circle cx={X(0)} cy={Y(60)} r={5} fill="var(--good)" />
        <text x={X(0) - 50} y={Y(60) + 4} fontSize={12} fill="var(--ink)" textAnchor="end" fontWeight={600}>mark, 60 m upwind</text>
        <rect x={X(0) - 4} y={Y(0) - 4} width={8} height={8} fill="none" stroke="var(--ink)" strokeWidth={1.4} />
        <text x={X(0) - 12} y={Y(0) + 4} fontSize={12} fill="var(--muted)" textAnchor="end">start</text>
      </svg>
      <figcaption style={{ fontSize: 12, color: "var(--faint)", lineHeight: 1.5, marginTop: 4 }}>
        To scale. A sail gives no drive within 30° of the wind, so the straight line is closed. Tacking trades a longer path for a heading
        where the sail pulls.
      </figcaption>
    </figure>
  );
}
