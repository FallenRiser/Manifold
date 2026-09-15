// A plain x/y line chart with optional log axes.
//
// The track needs one that LearningCurve cannot do: Baird's divergence runs
// from 10 to 709 against a second series that sits flat at 9, which on a linear
// axis is one line climbing off the top and one indistinguishable from the
// x-axis. On a log y-axis it is a straight climb against a horizontal line,
// which is the actual claim — exponential growth versus none.
//
// Static SVG, no client JS.

export type CurveSeries = { label: string; values: number[]; color: string; dash?: string };

const W = 430, L = 48, R = 418, T = 14, B = 142;
// The legend lays out two entries per row; every extra row needs its own space.
const legendRows = (n: number) => Math.ceil(n / 2);
const heightFor = (n: number) => 190 + legendRows(n) * 13;

function sup(d: number) {
  const digits = "⁰¹²³⁴⁵⁶⁷⁸⁹";
  const s = Math.abs(d).toString().split("").map((c) => digits[+c]).join("");
  return (d < 0 ? "⁻" : "") + s;
}

export function Curve({
  x,
  series,
  logY = false,
  logX = false,
  xlabel,
  ylabel,
  markY,
  markYLabel,
  caption,
}: {
  x: number[];
  series: CurveSeries[];
  logY?: boolean;
  logX?: boolean;
  xlabel: string;
  ylabel: string;
  markY?: number;
  markYLabel?: string;
  caption?: React.ReactNode;
}) {
  const all = series.flatMap((s) => s.values).filter((v) => (logY ? v > 0 : true));
  const rawLo = Math.min(...all, markY ?? Infinity);
  const rawHi = Math.max(...all, markY ?? -Infinity);

  const ty = (v: number) => (logY ? Math.log10(Math.max(v, 1e-12)) : v);
  const tx = (v: number) => (logX ? Math.log10(Math.max(v, 1e-12)) : v);

  const ylo = logY ? Math.floor(ty(rawLo)) : rawLo - (rawHi - rawLo) * 0.08;
  const yhi = logY ? Math.ceil(ty(rawHi)) : rawHi + (rawHi - rawLo) * 0.08;
  const xlo = tx(Math.min(...x)), xhi = tx(Math.max(...x));

  const px = (v: number) => L + ((tx(v) - xlo) / (xhi - xlo || 1)) * (R - L);
  const py = (v: number) => B - ((ty(v) - ylo) / (yhi - ylo || 1)) * (B - T);

  const yticks = logY
    ? Array.from({ length: Math.floor(yhi) - Math.ceil(ylo) + 1 }, (_, i) => Math.ceil(ylo) + i)
    : [ylo, (ylo + yhi) / 2, yhi];

  const xticks = logX
    ? Array.from({ length: Math.floor(xhi) - Math.ceil(xlo) + 1 }, (_, i) => Math.pow(10, Math.ceil(xlo) + i))
    : [x[0], x[Math.floor(x.length / 2)], x[x.length - 1]];

  const H = heightFor(series.length);

  return (
    <figure style={{ margin: "1.8rem 0" }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`${ylabel} against ${xlabel}`} style={{ display: "block", maxWidth: "100%" }}>
        {yticks.map((t) => {
          const v = logY ? Math.pow(10, t) : t;
          return (
            <g key={t}>
              <line x1={L} y1={py(v)} x2={R} y2={py(v)} stroke="var(--border)" strokeWidth={0.6} />
              <text x={L - 6} y={py(v) + 3.2} textAnchor="end" fontSize={9} fill="var(--muted)">
                {logY ? <>10{sup(t)}</> : v >= 100 ? v.toFixed(0) : v.toFixed(2)}
              </text>
            </g>
          );
        })}
        <text x={8} y={T + 8} fontSize={9.5} fill="var(--muted)">{ylabel}</text>

        {markY != null && (
          <g>
            <line x1={L} y1={py(markY)} x2={R} y2={py(markY)} stroke="var(--muted)" strokeWidth={1} strokeDasharray="4 3" />
            {markYLabel && (
              <text x={R} y={py(markY) - 4} textAnchor="end" fontSize={8.5} fill="var(--muted)">
                {markYLabel}
              </text>
            )}
          </g>
        )}

        {series.map((s) => (
          <path
            key={s.label}
            d={s.values
              .map((v, i) => `${i ? "L" : "M"} ${px(x[i]).toFixed(1)} ${py(v).toFixed(1)}`)
              .join(" ")}
            fill="none"
            stroke={s.color}
            strokeWidth={1.8}
            strokeDasharray={s.dash}
          />
        ))}

        {xticks.map((t) => {
          // A centred label on the first or last tick hangs half its width
          // outside the frame, and "1000k" is not how anyone writes a million.
          const x = px(t);
          const anchor = x <= L + 1 ? "start" : x >= R - 1 ? "end" : "middle";
          const fmt =
            t >= 1e9 ? `${t / 1e9}B` : t >= 1e6 ? `${t / 1e6}M` : t >= 1000 ? `${t / 1000}k` : `${t}`;
          return (
            <text key={t} x={x} y={B + 14} textAnchor={anchor} fontSize={9} fill="var(--muted)">
              {fmt}
            </text>
          );
        })}
        <text x={(L + R) / 2} y={B + 28} textAnchor="middle" fontSize={9.5} fill="var(--muted)">
          {xlabel}
        </text>

        <g>
          {series.map((s, i) => (
            <g key={s.label} transform={`translate(${L + (i % 2) * 186} ${H - 6 - (legendRows(series.length) - 1 - Math.floor(i / 2)) * 13})`}>
              <line x1={0} y1={-3} x2={14} y2={-3} stroke={s.color} strokeWidth={2} strokeDasharray={s.dash} />
              <text x={19} y={0} fontSize={9.5} fill="var(--muted)">{s.label}</text>
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
