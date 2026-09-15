import { polar } from "./sim";

// The movement convention of step(): heading is measured from the wind (up the page), clockwise,
// so one second at speed u moves u·sin h sideways and u·cos h upwind.

export function HeadingFigure() {
  const W = 520, H = 260, ox = 170, oy = 220, k = 62;
  const h = 49.5, u = polar(h);
  const r = (h * Math.PI) / 180;
  const ex = ox + u * Math.sin(r) * k, ey = oy - u * Math.cos(r) * k;
  return (
    <figure style={{ margin: "1.1rem 0 1.4rem" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 560, height: "auto", display: "block" }} role="img"
        aria-label="A heading of 49.5 degrees split into sideways and upwind parts">
        <defs>
          <marker id="hd-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="context-stroke" />
          </marker>
        </defs>
        <line x1={ox} y1={oy} x2={ox} y2={30} stroke="var(--border-strong)" strokeDasharray="4 4" />
        <text x={ox} y={22} fontSize={12} textAnchor="middle" fill="var(--c-regression)">heading 0 = into the wind (+y)</text>
        <path d={`M${ox},${oy - 48} A48,48 0 0 1 ${ox + 48 * Math.sin(r)},${oy - 48 * Math.cos(r)}`} fill="none" stroke="var(--c-rl)" strokeWidth={1.5} />
        <text x={ox + 22} y={oy - 56} fontSize={12} fill="var(--c-rl)">h = 49.5°</text>

        <line x1={ox} y1={oy} x2={ex} y2={ey} stroke="var(--ink)" strokeWidth={2.4} markerEnd="url(#hd-arrow)" />
        <text x={(ox + ex) / 2 - 14} y={(oy + ey) / 2 - 8} fontSize={12.5} fill="var(--ink)" textAnchor="end">u = {u.toFixed(2)} m/s</text>

        <line x1={ox} y1={oy} x2={ex} y2={oy} stroke="var(--c-classification)" strokeWidth={2.2} markerEnd="url(#hd-arrow)" />
        <text x={(ox + ex) / 2} y={oy + 20} fontSize={12.5} fill="var(--c-classification)" textAnchor="middle">sideways: u·sin h = {(u * Math.sin(r)).toFixed(2)} m</text>

        <line x1={ex} y1={oy} x2={ex} y2={ey} stroke="var(--good)" strokeWidth={2.2} markerEnd="url(#hd-arrow)" />
        <text x={ex + 10} y={(oy + ey) / 2} fontSize={12.5} fill="var(--good)">upwind: u·cos h = {(u * Math.cos(r)).toFixed(3)} m</text>
        <circle cx={ox} cy={oy} r={3.5} fill="var(--ink)" />
      </svg>
      <figcaption style={{ fontSize: 12, color: "var(--faint)", lineHeight: 1.5 }}>
        One second at the best angle and its full speed. Headings are measured from the wind, so the <em>cosine</em> is the upwind part —
        the reverse of the school convention of measuring from the x-axis.
      </figcaption>
    </figure>
  );
}
