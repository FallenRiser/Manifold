// A hyperparameter sweep: one knob on the x-axis, one or two measured curves on
// the y-axis, with the best point marked.
//
// Written for the regularisation track, where several pages carry a heading like
// "Reading the curve" above a table of six rows and no curve. The shape of a
// sweep is the whole content — is it a sharp peak or a plateau, does it fall off
// a cliff on the right or drift down, is the optimum interior or at the edge —
// and a column of decimals conveys none of it. A reader who sees a shallow
// inverted U also sees, without being told, that the exact setting does not
// matter much, which is usually the operational lesson.

export type SweepPoint = { x: number; a: number; b?: number };

const L = 44, R = 384, T = 16, B = 128;

export function SweepCurve({
  points,
  xlabel,
  ylabel = "test accuracy",
  seriesLabels = ["test accuracy"],
  log = false,
  markBest = true,
  xticks,
  caption,
}: {
  points: SweepPoint[];
  xlabel: string;
  ylabel?: string;
  seriesLabels?: string[];
  /** Log x-axis — for sweeps like weight decay that run over decades. */
  log?: boolean;
  markBest?: boolean;
  xticks?: number[];
  caption?: React.ReactNode;
}) {
  const hasB = points.some((p) => p.b != null);
  const ys = points.flatMap((p) => [p.a, ...(p.b == null ? [] : [p.b])]);
  const yPad = Math.max((Math.max(...ys) - Math.min(...ys)) * 0.18, 0.005);
  const ylo = Math.min(...ys) - yPad, yhi = Math.max(...ys) + yPad;

  const tx = (v: number) => (log ? Math.log10(Math.max(v, 1e-12)) : v);
  const xs = points.map((p) => tx(p.x));
  const xlo = Math.min(...xs), xhi = Math.max(...xs);
  const px = (v: number) => (xhi === xlo ? (L + R) / 2 : L + ((tx(v) - xlo) / (xhi - xlo)) * (R - L));
  const py = (v: number) => B - ((v - ylo) / (yhi - ylo)) * (B - T);

  const best = points.reduce((m, p) => (p.a > m.a ? p : m), points[0]);
  const yticks = [0, 1, 2, 3, 4].map((i) => ylo + ((yhi - ylo) * i) / 4);
  const marks = xticks ?? points.map((p) => p.x);

  const path = (key: "a" | "b") =>
    points
      .filter((p) => p[key] != null)
      .map((p, i) => `${i ? "L" : "M"}${px(p.x).toFixed(1)},${py(p[key] as number).toFixed(1)}`)
      .join(" ");

  return (
    <figure style={{ margin: "22px 0 6px", padding: "14px 16px 12px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 14 }}>
      <svg viewBox="0 0 400 156" width="100%" role="img" aria-label={`${ylabel} against ${xlabel}`}>
        {yticks.map((v, i) => (
          <g key={i}>
            <line x1={L} y1={py(v)} x2={R} y2={py(v)} stroke="var(--border-strong)" strokeWidth={0.6} />
            <text x={L - 5} y={py(v) + 3} textAnchor="end" fontSize={8} fill="var(--faint)">{v.toFixed(3)}</text>
          </g>
        ))}
        <line x1={L} y1={B} x2={R} y2={B} stroke="var(--border-strong)" strokeWidth={1} />
        {marks.map((v) => (
          <text key={v} x={px(v)} y={B + 11} textAnchor="middle" fontSize={8} fill="var(--faint)">
            {log ? (v >= 1 ? String(v) : v === 0 ? "0" : v.toExponential(0).replace("e-", "e−")) : String(v)}
          </text>
        ))}
        <text x={(L + R) / 2} y={B + 23} textAnchor="middle" fontSize={8.5} fill="var(--faint)">{xlabel}</text>
        <text x={11} y={(T + B) / 2} textAnchor="middle" fontSize={8.5} fill="var(--faint)" transform={`rotate(-90 11 ${(T + B) / 2})`}>{ylabel}</text>

        {markBest && (
          <g>
            <line x1={px(best.x)} y1={T - 4} x2={px(best.x)} y2={B} stroke="var(--good)" strokeWidth={0.9} strokeDasharray="3 2" />
            <text x={px(best.x)} y={T - 7} textAnchor="middle" fontSize={8} fill="var(--good)">best {best.a.toFixed(3)}</text>
          </g>
        )}

        {hasB && <path d={path("b")} fill="none" stroke="var(--muted)" strokeWidth={1.6} strokeDasharray="4 3" strokeLinejoin="round" />}
        <path d={path("a")} fill="none" stroke="var(--c-neural)" strokeWidth={2.2} strokeLinejoin="round" />
        {points.map((p) => (
          <g key={p.x}>
            {p.b != null && <circle cx={px(p.x)} cy={py(p.b)} r={2} fill="var(--muted)" />}
            <circle cx={px(p.x)} cy={py(p.a)} r={p.x === best.x ? 3.4 : 2.4} fill={p.x === best.x ? "var(--good)" : "var(--c-neural)"} />
          </g>
        ))}
      </svg>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px", marginTop: 2 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--muted)" }}>
          <span style={{ width: 14, height: 0, borderTop: "2px solid var(--c-neural)" }} />{seriesLabels[0]}
        </span>
        {hasB && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--muted)" }}>
            <span style={{ width: 14, height: 0, borderTop: "2px dashed var(--muted)" }} />{seriesLabels[1]}
          </span>
        )}
      </div>
      {caption && (
        <figcaption style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.6, marginTop: 9, paddingTop: 9, borderTop: "1px solid var(--border)" }}>
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
