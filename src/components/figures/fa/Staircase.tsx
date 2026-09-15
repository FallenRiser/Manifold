// The 1000-state random walk's value function, and what a feature map can do
// with it — the picture behind "a table becomes a function".
//
// This is the figure the first two chapters are written around: a smooth curve
// the environment actually has, and a staircase that is the best any
// ten-parameter aggregation can do. The gap between them is the approximation
// floor, which is a number those pages quote and could not previously show.
//
// Static SVG, no client JS.

const GOLD = "var(--c-rl)";

export type Line = { label: string; values: number[]; color: string; dash?: string; step?: boolean };

const W = 430, L = 42, R = 418, T = 26, B = 160;
const legendRows = (n: number) => Math.ceil(n / 2);
const heightFor = (n: number) => 206 + legendRows(n) * 13;

export function Staircase({
  x,
  lines,
  ylabel = "value",
  xlabel = "state",
  caption,
  mu,
}: {
  x: number[];
  lines: Line[];
  ylabel?: string;
  xlabel?: string;
  caption?: React.ReactNode;
  /** Optional on-policy visitation, drawn as a shaded strip under the axis. */
  mu?: number[];
}) {
  const all = lines.flatMap((l) => l.values);
  const lo = Math.min(...all), hi = Math.max(...all);
  const pad = (hi - lo) * 0.08;
  const ylo = lo - pad, yhi = hi + pad;
  const xlo = Math.min(...x), xhi = Math.max(...x);

  const px = (v: number) => L + ((v - xlo) / (xhi - xlo)) * (R - L);
  const py = (v: number) => B - ((v - ylo) / (yhi - ylo)) * (B - T);

  const path = (vals: number[], step: boolean) => {
    const pts: string[] = [];
    vals.forEach((v, i) => {
      if (i === 0) {
        pts.push(`M ${px(x[i]).toFixed(1)} ${py(v).toFixed(1)}`);
      } else if (step) {
        // Hold the previous value across, then jump — an aggregation IS a step
        // function, and drawing it as a polyline hides exactly the property
        // that makes it an approximation.
        pts.push(`L ${px(x[i]).toFixed(1)} ${py(vals[i - 1]).toFixed(1)}`);
        pts.push(`L ${px(x[i]).toFixed(1)} ${py(v).toFixed(1)}`);
      } else {
        pts.push(`L ${px(x[i]).toFixed(1)} ${py(v).toFixed(1)}`);
      }
    });
    return pts.join(" ");
  };

  const yticks = [ylo, (ylo + yhi) / 2, yhi].map((v) => Math.round(v * 10) / 10);
  const muMax = mu ? Math.max(...mu) : 1;
  const H = heightFor(lines.length);

  return (
    <figure style={{ margin: "1.8rem 0" }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`${ylabel} against ${xlabel}`} style={{ display: "block", maxWidth: "100%" }}>
        {yticks.map((t) => (
          <g key={t}>
            <line x1={L} y1={py(t)} x2={R} y2={py(t)} stroke="var(--border)" strokeWidth={0.6} />
            <text x={L - 6} y={py(t) + 3.2} textAnchor="end" fontSize={9} fill="var(--muted)">
              {t.toFixed(1)}
            </text>
          </g>
        ))}
        <text x={10} y={12} fontSize={9.5} fill="var(--muted)">{ylabel}</text>

        {mu && (
          <g>
            <path
              d={`M ${px(x[0])} ${B + 26} ` +
                mu.map((v, i) => `L ${px(x[i]).toFixed(1)} ${(B + 26 - (v / muMax) * 18).toFixed(1)}`).join(" ") +
                ` L ${px(x[x.length - 1])} ${B + 26} Z`}
              fill={GOLD}
              opacity={0.16}
            />
            <text x={R} y={B + 24} textAnchor="end" fontSize={8.5} fill="var(--muted)">
              time actually spent in each state
            </text>
          </g>
        )}

        {lines.map((l) => (
          <path
            key={l.label}
            d={path(l.values, Boolean(l.step))}
            fill="none"
            stroke={l.color}
            strokeWidth={1.7}
            strokeDasharray={l.dash}
          />
        ))}

        {[xlo, (xlo + xhi) / 2, xhi].map((t) => (
          <text key={t} x={px(t)} y={B + 13} textAnchor="middle" fontSize={9} fill="var(--muted)">
            {Math.round(t)}
          </text>
        ))}
        <text x={(L + R) / 2} y={H - 30} textAnchor="middle" fontSize={9.5} fill="var(--muted)">
          {xlabel}
        </text>

        <g>
          {lines.map((l, i) => (
            <g key={l.label} transform={`translate(${L + (i % 2) * 190} ${H - 6 - (legendRows(lines.length) - 1 - Math.floor(i / 2)) * 13})`}>
              <line x1={0} y1={-3} x2={14} y2={-3} stroke={l.color} strokeWidth={2} strokeDasharray={l.dash} />
              <text x={19} y={0} fontSize={9.5} fill="var(--muted)">{l.label}</text>
            </g>
          ))}
        </g>
      </svg>
      {caption && (
        <figcaption style={{ fontSize: 13, color: "var(--muted)", marginTop: 10, lineHeight: 1.55 }}>
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
