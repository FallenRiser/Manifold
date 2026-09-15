// The point cloud, drawn.
//
// Clustering is the one subject on the site where the data IS the picture: what
// a reader needs to know about two crescents or a sheared blob cannot be put
// into a sentence, because the sentence is "look at the shape". This track had
// 45 pages and two scatter plots.
//
// Every panel is server-rendered SVG over measured coordinates from
// scripts/kmeans_cases.py -- no client JS, and no hand-placed dots.

// Ordered so that the near-twins are as far apart as possible, and so the
// first four -- the k a clustering figure almost always uses -- are teal, pink,
// gold and blue, which nobody can confuse. --bad (#e0442c) and --c-neural
// (#e8541f) are the same colour to the eye, as are --c-rl and --c-fundamentals;
// putting either pair at adjacent indices makes a 5-cluster panel unreadable.
const PALETTE = [
  "var(--c-clustering)",   // teal
  "var(--brand-2)",        // pink
  "var(--c-rl)",           // gold
  "var(--c-regression)",   // blue
  "var(--good)",           // green
  "var(--c-neural)",       // orange
  "var(--c-metrics)",      // grey
  "var(--c-fundamentals)", // amber
  "var(--bad)",            // red
  "var(--brand)",          // ink
];

export type Point = readonly [number, number];

export type ScatterSpec = {
  points: readonly Point[] | readonly (readonly number[])[];
  /** Cluster id per point. Omit for an uncoloured cloud. */
  labels?: readonly number[];
  centroids?: readonly Point[] | readonly (readonly number[])[];
  /** Ghost markers: where the centroids were before whatever the panel shows. */
  ghosts?: readonly Point[] | readonly (readonly number[])[];
  label?: React.ReactNode;
  /** Small caption under the panel, e.g. the ARI or the inertia. */
  note?: string;
  /** Draw every point in one colour -- for "here is the raw data" panels. */
  mono?: boolean;
  dim?: boolean;
};

type Bounds = { x0: number; x1: number; y0: number; y1: number };

function boundsOf(specs: ScatterSpec[]): Bounds {
  const xs: number[] = [];
  const ys: number[] = [];
  for (const s of specs) {
    for (const p of s.points) {
      xs.push(p[0]);
      ys.push(p[1]);
    }
    for (const c of s.centroids ?? []) {
      xs.push(c[0]);
      ys.push(c[1]);
    }
  }
  const pad = 0.06;
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  const y0 = Math.min(...ys), y1 = Math.max(...ys);
  const dx = (x1 - x0) * pad || 1;
  const dy = (y1 - y0) * pad || 1;
  return { x0: x0 - dx, x1: x1 + dx, y0: y0 - dy, y1: y1 + dy };
}

const SIZE = 168;

// A <text> does not wrap, and panel labels are prose written by whoever adds
// the figure. Split them on word boundaries rather than trusting every future
// caller to count characters against a 168px panel.
const LABEL_CHARS = 30;

function wrapLabel(text: string): string[] {
  if (text.length <= LABEL_CHARS) return [text];
  const out: string[] = [];
  let cur = "";
  for (const w of text.split(" ")) {
    if (cur && (cur + " " + w).length > LABEL_CHARS) {
      out.push(cur);
      cur = w;
    } else cur = cur ? cur + " " + w : w;
  }
  if (cur) out.push(cur);
  return out.slice(0, 2);
}
// LABEL_H must leave room for the label's ascent above its baseline, not just
// for its nominal font size: at fontSize 10.5 the glyph tops sit ~11 user units
// above the baseline, so a baseline at 11 inside a zero-offset group clips.
const LABEL_BASE = 12;
const LABEL_H = 20;

function Panel({
  spec,
  bounds,
  x,
  y,
  r,
  labelH,
}: {
  spec: ScatterSpec;
  bounds: Bounds;
  x: number;
  y: number;
  r: number;
  labelH: number;
}) {
  // One aspect-preserving mapping for every panel in a row, so shapes are not
  // silently stretched differently from one panel to the next.
  const spanX = bounds.x1 - bounds.x0;
  const spanY = bounds.y1 - bounds.y0;
  const span = Math.max(spanX, spanY);
  const ox = (span - spanX) / 2;
  const oy = (span - spanY) / 2;
  const px = (v: number) => ((v - bounds.x0 + ox) / span) * SIZE;
  const py = (v: number) => SIZE - ((v - bounds.y0 + oy) / span) * SIZE;

  return (
    <g transform={`translate(${x} ${y})`}>
      {spec.label != null &&
        (typeof spec.label === "string" ? wrapLabel(spec.label) : [spec.label]).map((ln, li) => (
          <text key={li} x={0} y={LABEL_BASE + li * 12} fontSize={10.5} fill="var(--muted)">
            {ln}
          </text>
        ))}
      <g transform={`translate(0 ${labelH})`}>
        <rect
          width={SIZE}
          height={SIZE}
          fill="var(--panel)"
          stroke="var(--border)"
          strokeWidth={0.8}
          rx={3}
        />
        {spec.points.map((p, i) => {
          const c = spec.mono
            ? "var(--muted)"
            : PALETTE[(spec.labels?.[i] ?? 0) % PALETTE.length];
          return (
            <circle
              key={i}
              cx={px(p[0]).toFixed(2)}
              cy={py(p[1]).toFixed(2)}
              r={r}
              fill={c}
              opacity={spec.dim ? 0.3 : 0.72}
            />
          );
        })}
        {(spec.ghosts ?? []).map((c, i) => (
          <circle
            key={`g${i}`}
            cx={px(c[0]).toFixed(2)}
            cy={py(c[1]).toFixed(2)}
            r={4.4}
            fill="none"
            stroke="var(--faint)"
            strokeWidth={1.2}
            strokeDasharray="2 2"
          />
        ))}
        {(spec.centroids ?? []).map((c, i) => (
          <g key={`c${i}`} transform={`translate(${px(c[0]).toFixed(2)} ${py(c[1]).toFixed(2)})`}>
            {/* A ringed cross, so a centroid is never mistaken for a data point
                and stays visible on top of a dense cluster of its own colour. */}
            <circle r={6} fill="var(--surface)" stroke="var(--ink)" strokeWidth={1.4} />
            <path d="M -3 0 L 3 0 M 0 -3 L 0 3" stroke="var(--ink)" strokeWidth={1.4} />
          </g>
        ))}
      </g>
      {spec.note && (
        <text x={SIZE / 2} y={labelH + SIZE + 13} textAnchor="middle" fontSize={10} fill="var(--muted)">
          {spec.note}
        </text>
      )}
    </g>
  );
}

/**
 * One or more scatter panels under a shared caption, on a shared scale.
 */
export function ScatterRow({
  panels,
  caption,
  perRow,
  dotRadius,
  sharedBounds = true,
}: {
  panels: ScatterSpec[];
  caption?: React.ReactNode;
  perRow?: number;
  dotRadius?: number;
  /** Set false when panels hold genuinely different datasets. */
  sharedBounds?: boolean;
}) {
  const cols = perRow ?? Math.min(panels.length, panels.length > 4 ? 3 : panels.length);
  const rows = Math.ceil(panels.length / cols);
  const GAP = 18;
  const anyNote = panels.some((p) => p.note);
  const labelLines = Math.max(
    1,
    ...panels.map((p) => (typeof p.label === "string" ? wrapLabel(p.label).length : 1)),
  );
  const labelH = LABEL_BASE + (labelLines - 1) * 12 + 8;
  const CELL_H = labelH + SIZE + (anyNote ? 18 : 2);
  const W = cols * SIZE + (cols - 1) * GAP;
  const H = rows * CELL_H + (rows - 1) * GAP;

  const shared = boundsOf(panels);
  const biggest = Math.max(...panels.map((p) => p.points.length));
  const r = dotRadius ?? (biggest > 400 ? 1.7 : biggest > 200 ? 2.1 : 2.6);

  return (
    <figure style={{ margin: "1.8rem 0" }}>
      <div style={{ overflowX: "auto" }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          role="img"
          aria-label={panels.map((p) => p.label).filter(Boolean).join("; ") || "clustered points"}
          style={{ display: "block", minWidth: Math.min(W, 300), maxWidth: "100%" }}
        >
          {panels.map((p, i) => (
            <Panel
              key={i}
              spec={p}
              bounds={sharedBounds ? shared : boundsOf([p])}
              x={(i % cols) * (SIZE + GAP)}
              y={Math.floor(i / cols) * (CELL_H + GAP)}
              r={r}
              labelH={labelH}
            />
          ))}
        </svg>
      </div>
      {caption && (
        <figcaption style={{ fontSize: 13, color: "var(--muted)", marginTop: 10, lineHeight: 1.55 }}>
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
