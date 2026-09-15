// Train and held-out error against training time, with the early-stopping point
// marked.
//
// This is the figure the regularisation track was written around and never drew.
// Pages there say "the validation error bottoms out and then climbs", "reading
// the curve", "the shape is a shallow inverted U" — and then print two rows of a
// table. The overfitting-over-time story is a claim about a SHAPE: where the
// minimum falls, how sharp it is, how far the two curves separate afterwards, and
// how much of the training budget was spent making the model worse. A table with
// the first and last epoch in it is precisely the two points that hide all of
// that.
//
// The x-axis is symlog — linear to `linearUpTo`, logarithmic after. Early
// stopping happens in the first fifty epochs of a four-thousand-epoch run, so a
// linear axis puts the entire event inside the first 1% of the width and a pure
// log axis distorts the long flat tail that makes the waste visible.

export type CurveSeries = { label: string; values: number[]; color: string; dash?: string };

const L = 46, R = 384, T = 18, B = 122;

export function LearningCurve({
  x,
  series,
  markAt,
  markLabel,
  xlabel = "epoch",
  ylabel = "error",
  linearUpTo = 50,
  caption,
}: {
  x: number[];
  series: CurveSeries[];
  /** Vertical rule, e.g. where a stopping rule would have fired. */
  markAt?: number;
  markLabel?: string;
  xlabel?: string;
  ylabel?: string;
  linearUpTo?: number;
  caption?: React.ReactNode;
}) {
  const ys = series.flatMap((s) => s.values);
  const ylo = 0;
  const yhi = Math.max(...ys) * 1.06;

  // symlog: the first `linearUpTo` epochs take 40% of the width, the rest 60%.
  const xmax = x[x.length - 1];
  const SPLIT = 0.4;
  const pos = (v: number) => {
    if (v <= linearUpTo) return (v / linearUpTo) * SPLIT;
    const a = Math.log10(linearUpTo), b = Math.log10(xmax);
    return SPLIT + ((Math.log10(v) - a) / (b - a)) * (1 - SPLIT);
  };
  const px = (v: number) => L + pos(v) * (R - L);
  const py = (v: number) => B - ((v - ylo) / (yhi - ylo)) * (B - T);

  const xticks = [0, Math.round(linearUpTo / 2), linearUpTo, 200, 1000, xmax].filter(
    (v, i, a) => v <= xmax && a.indexOf(v) === i,
  );
  const yticks = [0, 1, 2, 3].map((i) => (yhi * i) / 3);

  return (
    <figure style={{ margin: "22px 0 6px", padding: "14px 16px 12px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 14 }}>
      <svg viewBox="0 0 400 150" width="100%" role="img" aria-label={`${ylabel} against ${xlabel}`}>
        {yticks.map((v, i) => (
          <g key={i}>
            <line x1={L} y1={py(v)} x2={R} y2={py(v)} stroke="var(--border-strong)" strokeWidth={0.6} />
            <text x={L - 5} y={py(v) + 3} textAnchor="end" fontSize={8} fill="var(--faint)">{v.toFixed(2)}</text>
          </g>
        ))}
        <line x1={L} y1={B} x2={R} y2={B} stroke="var(--border-strong)" strokeWidth={1} />
        {/* where the axis stops being linear */}
        <line x1={px(linearUpTo)} y1={T - 2} x2={px(linearUpTo)} y2={B} stroke="var(--border-strong)" strokeWidth={0.6} strokeDasharray="1 3" />
        {xticks.map((v) => (
          <text key={v} x={px(v)} y={B + 11} textAnchor="middle" fontSize={8} fill="var(--faint)">{v}</text>
        ))}
        <text x={(L + R) / 2} y={B + 23} textAnchor="middle" fontSize={8.5} fill="var(--faint)">
          {xlabel} · linear to {linearUpTo}, then log
        </text>
        <text x={11} y={(T + B) / 2} textAnchor="middle" fontSize={8.5} fill="var(--faint)" transform={`rotate(-90 11 ${(T + B) / 2})`}>{ylabel}</text>

        {markAt != null && (
          <g>
            <line x1={px(markAt)} y1={T - 4} x2={px(markAt)} y2={B} stroke="var(--good)" strokeWidth={1.1} />
            <text x={px(markAt) + 4} y={T + 4} fontSize={8.5} fill="var(--good)">{markLabel ?? `epoch ${markAt}`}</text>
          </g>
        )}

        {series.map((s) => (
          <path
            key={s.label}
            d={x.map((v, i) => `${i ? "L" : "M"}${px(v).toFixed(1)},${py(s.values[i]).toFixed(1)}`).join(" ")}
            fill="none"
            stroke={s.color}
            strokeWidth={2}
            strokeDasharray={s.dash}
            strokeLinejoin="round"
          />
        ))}
      </svg>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px", marginTop: 2 }}>
        {series.map((s) => (
          <span key={s.label} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--muted)" }}>
            <span style={{ width: 14, height: 0, borderTop: `2px ${s.dash ? "dashed" : "solid"} ${s.color}` }} />
            {s.label}
          </span>
        ))}
      </div>
      {caption && (
        <figcaption style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.6, marginTop: 9, paddingTop: 9, borderTop: "1px solid var(--border)" }}>
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
