import { ARRIVE, CENTRE, COURSE, MARK } from "./sim";

// Shared drawing for every sailboat figure: a world-to-screen view, the water, the wind, the race area,
// the mark and its rounding circle, and a boat. World y points upwind (up the page); heading 0 = up.

export const GOLD = "var(--c-rl)";
export const BOAT_COLORS = ["var(--c-rl)", "var(--c-regression)", "var(--c-classification)", "var(--c-trees)", "var(--c-dimred)"];

export type View = { W: number; H: number; k: number; sx: (x: number) => number; sy: (y: number) => number; x0: number; x1: number; y0: number; y1: number };

/** A view that shows at least [x0,x1]×[y0,y1], W wide, with height between minH and maxH. */
export function makeView(x0: number, x1: number, y0: number, y1: number, W = 640, maxH = 420, minH = 260): View {
  const k = Math.min(W / (x1 - x0), maxH / (y1 - y0));
  const H = Math.max(minH, Math.min(maxH, (y1 - y0) * k));
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const vw = W / k, vh = H / k;
  const left = cx - vw / 2, top = cy + vh / 2;
  return { W, H, k, sx: (x) => (x - left) * k, sy: (y) => (top - y) * k, x0: left, x1: left + vw, y0: top - vh, y1: top };
}

export function fitTracks(tracks: { x: number[]; y: number[] }[], pad = 14, W = 640, maxH = 420, minH = 260) {
  let x0 = Math.min(0, MARK.x) - ARRIVE, x1 = Math.max(0, MARK.x) + ARRIVE;
  let y0 = -ARRIVE, y1 = MARK.y + ARRIVE;
  for (const t of tracks) {
    for (const v of t.x) { if (v < x0) x0 = v; if (v > x1) x1 = v; }
    for (const v of t.y) { if (v < y0) y0 = v; if (v > y1) y1 = v; }
  }
  return makeView(x0 - pad, x1 + pad, y0 - pad, y1 + pad, W, maxH, minH);
}

export function CourseBackdrop({ v, id, grid = 10, showEdge = true, showRing = true, windDir = 0, start = { x: 0, y: 0 }, showStart = true, mark = MARK, showMark = true, centre = CENTRE }: {
  v: View; id: string; grid?: number; showEdge?: boolean; showRing?: boolean;
  /** centre of the race-area circle */
  centre?: { x: number; y: number };
  mark?: { x: number; y: number };
  showMark?: boolean;
  /** where the wind blows from, measured like a heading (0 = from the top of the page) */
  windDir?: number;
  start?: { x: number; y: number };
  showStart?: boolean;
}) {
  const lines = [];
  for (let gx = Math.ceil(v.x0 / grid) * grid; gx <= v.x1; gx += grid)
    lines.push(<line key={`gx${gx}`} x1={v.sx(gx)} x2={v.sx(gx)} y1={0} y2={v.H} stroke="var(--border)" strokeWidth={gx === 0 ? 1 : 0.6} />);
  for (let gy = Math.ceil(v.y0 / grid) * grid; gy <= v.y1; gy += grid)
    lines.push(<line key={`gy${gy}`} y1={v.sy(gy)} y2={v.sy(gy)} x1={0} x2={v.W} stroke="var(--border)" strokeWidth={0.6} />);
  const arrows = [];
  const n = Math.max(3, Math.round(v.W / 110));
  for (let i = 0; i < n; i++) {
    const ax = ((i + 0.5) * v.W) / n;
    arrows.push(
      <g key={`w${i}`} opacity={0.55} transform={windDir ? `rotate(${windDir} ${ax} 15)` : undefined}>
        <line x1={ax} x2={ax} y1={6} y2={22} stroke="var(--c-regression)" strokeWidth={1.4} />
        <path d={`M${ax - 4},${17} L${ax},${24} L${ax + 4},${17}`} fill="none" stroke="var(--c-regression)" strokeWidth={1.4} />
      </g>,
    );
  }
  return (
    <g>
      <defs>
        <clipPath id={`clip-${id}`}><rect x={0} y={0} width={v.W} height={v.H} /></clipPath>
      </defs>
      <rect x={0} y={0} width={v.W} height={v.H} fill="color-mix(in srgb, var(--c-regression) 5%, var(--surface))" />
      <g clipPath={`url(#clip-${id})`}>
        {lines}
        {showEdge && (
          <circle cx={v.sx(centre.x)} cy={v.sy(centre.y)} r={COURSE * v.k} fill="none" stroke="var(--bad)" strokeWidth={1.2} strokeDasharray="6 5" opacity={0.7} />
        )}
      </g>
      {arrows}
      <text x={v.W - 8} y={18} textAnchor="end" fontSize={11} fill="var(--c-regression)" opacity={0.8}>wind</text>
      {showMark && showRing && (
        <circle cx={v.sx(mark.x)} cy={v.sy(mark.y)} r={ARRIVE * v.k} fill="color-mix(in srgb, var(--good) 10%, transparent)" stroke="var(--good)" strokeWidth={1} strokeDasharray="3 3" />
      )}
      {showMark && (
        <>
          <circle cx={v.sx(mark.x)} cy={v.sy(mark.y)} r={5} fill="var(--good)" />
          <text x={v.sx(mark.x) + 9} y={v.sy(mark.y) - 7} fontSize={11.5} fill="var(--ink)" fontWeight={600}>mark</text>
        </>
      )}
      {showStart && (
        <>
          <rect x={v.sx(start.x) - 4} y={v.sy(start.y) - 4} width={8} height={8} fill="none" stroke="var(--ink)" strokeWidth={1.3} />
          <text x={v.sx(start.x) + 9} y={v.sy(start.y) + 14} fontSize={11.5} fill="var(--muted)">start</text>
        </>
      )}
    </g>
  );
}

/**
 * A small sailboat seen from above: pointed bow, square stern, mast, and a sail that swings out to the side away
 * from the wind — further the more the wind comes from behind — and hangs slack along the boat in the no-go zone.
 * `wind` is where the wind blows from, measured like a heading (0 = from the top of the page).
 */
export function BoatGlyph({ x, y, h, color, v, size = 1, wind = 0 }: { x: number; y: number; h: number; color: string; v: View; size?: number; wind?: number }) {
  const s = size * 1.35;
  let rel = (((h - wind + 180) % 360) + 360) % 360 - 180; // angle of the bow off the wind
  const inIrons = Math.abs(rel) <= 30;
  // the sail sets out to leeward: wind over the port bow (rel > 0) pushes it to starboard (+x in the boat's frame)
  const side = rel >= 0 ? 1 : -1;
  if (inIrons) rel = 0;
  const swing = inIrons ? 0 : Math.min(80, Math.max(12, (Math.abs(rel) - 20) * 0.62)) * (Math.PI / 180);
  const mastY = -3.5 * s, boom = 11 * s;
  const bx = side * Math.sin(swing) * boom, by = mastY + Math.cos(swing) * boom;
  // the sail's belly bulges further to leeward
  const cx = (bx) / 2 + side * Math.cos(swing) * 3.2 * s, cy = (mastY + by) / 2 - Math.sin(swing) * 3.2 * s * side * side;
  return (
    <g transform={`translate(${v.sx(x)},${v.sy(y)}) rotate(${h})`}>
      <path d={`M0,${-12 * s} C${4.6 * s},${-6 * s} ${5.2 * s},${1 * s} ${3.8 * s},${9 * s} L${-3.8 * s},${9 * s} C${-5.2 * s},${1 * s} ${-4.6 * s},${-6 * s} 0,${-12 * s} Z`}
        fill={color} stroke="var(--surface)" strokeWidth={1.1} strokeLinejoin="round" />
      <path d={`M0,${-8 * s} L0,${7 * s}`} stroke="color-mix(in srgb, var(--surface) 55%, transparent)" strokeWidth={0.8} />
      {inIrons ? (
        <path d={`M0,${mastY} Q${1.6 * s},${mastY + 4 * s} 0,${mastY + boom * 0.8} Q${-1.6 * s},${mastY + 8 * s} 0,${mastY + boom}`}
          fill="none" stroke="var(--ink)" strokeWidth={1.3} strokeLinecap="round" />
      ) : (
        <path d={`M0,${mastY} Q${cx.toFixed(2)},${cy.toFixed(2)} ${bx.toFixed(2)},${by.toFixed(2)} Z`}
          fill="color-mix(in srgb, var(--surface) 92%, var(--ink))" stroke="var(--ink)" strokeWidth={1.1} strokeLinejoin="round" />
      )}
      <circle cx={0} cy={mastY} r={1.3 * s} fill="var(--ink)" />
    </g>
  );
}

export const trackPath = (v: View, xs: number[], ys: number[], upto = xs.length - 1) => {
  let d = "";
  const n = Math.min(upto, xs.length - 1);
  for (let i = 0; i <= n; i++) d += `${i ? "L" : "M"}${v.sx(xs[i]).toFixed(1)},${v.sy(ys[i]).toFixed(1)}`;
  return d;
};
