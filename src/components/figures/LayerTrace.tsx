import type { Series } from "./series";

// The workhorse figure of the Initialisation & normalisation track: one value
// per layer, several series, log y-axis.
//
// It exists because nearly every claim in this track is a ten-number sequence
// that the prose used to read out in a sentence ("0.2457, 0.1324, 0.0745, ...").
// A sequence that halves every layer and one that holds constant are the same
// paragraph and completely different pictures. On a log axis "decays
// geometrically" IS a straight line, which is the whole argument in one glance.
//
// Values of exactly 0 are not a drawing problem to be hidden — they are the
// result (float64 underflow). They are pinned to the floor as a dashed line and
// the legend says so. Static data, no client JS.

const L = 40, R = 384, T = 16, B = 128;

function decades(lo: number, hi: number) {
  const out: number[] = [];
  const span = hi - lo;
  const step = span > 24 ? 6 : span > 12 ? 4 : span > 6 ? 2 : 1;
  for (let d = Math.ceil(lo); d <= Math.floor(hi); d += step) out.push(d);
  return out;
}

function sup(d: number) {
  const digits = "⁰¹²³⁴⁵⁶⁷⁸⁹";
  const s = Math.abs(d).toString().split("").map((c) => digits[+c]).join("");
  return (d < 0 ? "⁻" : "") + s;
}

export function LayerTrace({
  series,
  caption,
  ylabel = "variance",
  xlabel = "layer",
  height = 168,
}: {
  series: Series[];
  caption?: React.ReactNode;
  ylabel?: string;
  xlabel?: string;
  height?: number;
}) {
  const n = Math.max(...series.map((s) => s.values.length));
  const positive = series.flatMap((s) => s.values).filter((v) => v > 0);
  const loRaw = Math.log10(Math.min(...positive));
  const hiRaw = Math.log10(Math.max(...positive));
  // One spare decade below the smallest real value gives the underflowed
  // series a floor to sit on that is visibly *off* the data.
  const lo = Math.floor(loRaw) - 1;
  const hi = Math.ceil(hiRaw);
  const ticks = decades(lo + 1, hi);

  const px = (i: number) => (n === 1 ? L : L + (i * (R - L)) / (n - 1));
  const py = (v: number) => {
    const d = v > 0 ? Math.log10(v) : lo;
    return B - ((d - lo) / (hi - lo)) * (B - T);
  };

  return (
    <figure style={{ margin: "22px 0 6px", padding: "14px 16px 12px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 14 }}>
      <svg viewBox={`0 0 400 ${height}`} width="100%" role="img" aria-label={`${ylabel} per layer`}>
        {ticks.map((d) => (
          <g key={d}>
            <line x1={L} y1={py(10 ** d)} x2={R} y2={py(10 ** d)} stroke="var(--border-strong)" strokeWidth={0.6} opacity={0.75} />
            <text x={L - 5} y={py(10 ** d) + 3} textAnchor="end" fontSize={8} fill="var(--faint)">
              10{sup(d)}
            </text>
          </g>
        ))}
        <line x1={L} y1={B} x2={R} y2={B} stroke="var(--border-strong)" strokeWidth={1} />

        {Array.from({ length: n }, (_, i) => (
          <text key={i} x={px(i)} y={B + 11} textAnchor="middle" fontSize={8} fill="var(--faint)">
            {i + 1}
          </text>
        ))}
        <text x={(L + R) / 2} y={B + 23} textAnchor="middle" fontSize={8.5} fill="var(--faint)">{xlabel}</text>
        <text x={11} y={B - 2} textAnchor="start" fontSize={8.5} fill="var(--faint)" transform={`rotate(-90 11 ${B - 2})`}>{ylabel}</text>

        {series.map((s) => {
          const d = s.values.map((v, i) => `${i ? "L" : "M"}${px(i).toFixed(1)},${py(v).toFixed(1)}`).join(" ");
          const dead = s.values.every((v) => v === 0);
          return (
            <g key={s.label}>
              <path d={d} fill="none" stroke={s.color} strokeWidth={dead ? 1.4 : 2} strokeDasharray={s.dash} strokeLinejoin="round" strokeLinecap="round" opacity={dead ? 0.85 : 1} />
              {s.values.map((v, i) => (
                <circle key={i} cx={px(i)} cy={py(v)} r={v === 0 ? 1.3 : 2} fill={v === 0 ? "var(--surface-2)" : s.color} stroke={s.color} strokeWidth={v === 0 ? 1 : 0} />
              ))}
            </g>
          );
        })}
      </svg>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px", marginTop: 4 }}>
        {series.map((s) => (
          <span key={s.label} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--muted)" }}>
            <span style={{ width: 14, height: 0, borderTop: `2px ${s.dash ? "dashed" : "solid"} ${s.color}`, flexShrink: 0 }} />
            {s.label}
          </span>
        ))}
      </div>
      {series.some((s) => s.note) && (
        <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 5, lineHeight: 1.5 }}>
          {series.filter((s) => s.note).map((s) => `${s.label}: ${s.note}`).join(" · ")}
        </div>
      )}
      {caption && (
        <figcaption style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.6, marginTop: 9, paddingTop: 9, borderTop: "1px solid var(--border)" }}>
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
