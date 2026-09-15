// Charts for the k-Means track: the measurements that are not point clouds.
//
// Static SVG, no client JS. Long explanation goes in the caption, where it
// reflows -- a single <svg> <text> neither wraps nor shrinks.

const TEAL = "var(--c-clustering)";
const PINK = "var(--brand-2)";
const GOOD = "var(--good)";
const BAD = "var(--bad)";

function Fig({ children, caption, label, W, H, minWidth = 320 }: {
  children: React.ReactNode; caption?: React.ReactNode; label: string; W: number; H: number; minWidth?: number;
}) {
  return (
    <figure style={{ margin: "1.8rem 0" }}>
      <div style={{ overflowX: "auto" }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={label} style={{ display: "block", minWidth, maxWidth: "100%" }}>
          {children}
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

const legendRows = (n: number) => Math.ceil(n / 2);

function Legend({ items, x, y }: { items: { label: string; color: string; dash?: string }[]; x: number; y: number }) {
  return (
    <g>
      {items.map((it, i) => (
        <g key={it.label} transform={`translate(${x + (i % 2) * 190} ${y + Math.floor(i / 2) * 14})`}>
          <line x1={0} y1={-3.5} x2={15} y2={-3.5} stroke={it.color} strokeWidth={2.2} strokeDasharray={it.dash} />
          <text x={20} y={0} fontSize={9.5} fill="var(--muted)">{it.label}</text>
        </g>
      ))}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Inertia against k -- and, on its own axis, a score that can actually choose.
// ---------------------------------------------------------------------------
export function InertiaVsK({
  k,
  inertia,
  silhouette,
  caption,
}: {
  k: readonly number[];
  inertia: readonly number[];
  silhouette?: readonly (number | null)[];
  caption?: React.ReactNode;
}) {
  const W = 440, L = 48, R = 392, T = 16, B = 140;
  const H = B + 46 + legendRows(silhouette ? 2 : 1) * 14;
  const iHi = Math.max(...inertia);
  const px = (i: number) => L + (i / (k.length - 1 || 1)) * (R - L);
  const py = (v: number) => B - (v / (iHi || 1)) * (B - T);

  const sVals = (silhouette ?? []).filter((v): v is number => v != null);
  const sLo = sVals.length ? Math.min(...sVals) * 0.9 : 0;
  const sHi = sVals.length ? Math.max(...sVals) * 1.05 : 1;
  const sy = (v: number) => B - ((v - sLo) / (sHi - sLo || 1)) * (B - T);
  const bestS = sVals.length ? Math.max(...sVals) : null;
  const bestIdx = bestS == null ? -1 : (silhouette ?? []).findIndex((v) => v === bestS);

  return (
    <Fig W={W} H={H} label="inertia and silhouette against the number of clusters" caption={caption} minWidth={340}>
      {[0, 0.5, 1].map((f) => (
        <g key={f}>
          <line x1={L} y1={py(f * iHi)} x2={R} y2={py(f * iHi)} stroke="var(--border)" strokeWidth={0.6} />
          <text x={L - 6} y={py(f * iHi) + 3.2} textAnchor="end" fontSize={9} fill={TEAL}>
            {Math.round(f * iHi)}
          </text>
        </g>
      ))}
      <text x={8} y={T + 8} fontSize={9.5} fill={TEAL}>inertia</text>

      {silhouette && (
        <>
          <text x={W - 4} y={T + 8} textAnchor="end" fontSize={9.5} fill={PINK}>silhouette</text>
          {[sLo, (sLo + sHi) / 2, sHi].map((v) => (
            <text key={v} x={R + 6} y={sy(v) + 3.2} fontSize={9} fill={PINK}>
              {v.toFixed(2)}
            </text>
          ))}
        </>
      )}

      <path
        d={inertia.map((v, i) => `${i ? "L" : "M"} ${px(i).toFixed(1)} ${py(v).toFixed(1)}`).join(" ")}
        fill="none"
        stroke={TEAL}
        strokeWidth={2}
      />
      {inertia.map((v, i) => (
        <circle key={i} cx={px(i)} cy={py(v)} r={2.6} fill={TEAL} />
      ))}

      {silhouette && (
        <>
          <path
            d={silhouette
              .map((v, i) => (v == null ? null : `${i && silhouette[i - 1] != null ? "L" : "M"} ${px(i).toFixed(1)} ${sy(v).toFixed(1)}`))
              .filter(Boolean)
              .join(" ")}
            fill="none"
            stroke={PINK}
            strokeWidth={2}
            strokeDasharray="5 3"
          />
          {bestIdx >= 0 && (
            <g>
              <circle cx={px(bestIdx)} cy={sy(bestS!)} r={5} fill="none" stroke={PINK} strokeWidth={2} />
              <text x={px(bestIdx)} y={sy(bestS!) - 10} textAnchor="middle" fontSize={9.5} fill={PINK}>
                peak
              </text>
            </g>
          )}
        </>
      )}

      {k.map((kk, i) => (
        <text key={kk} x={px(i)} y={B + 15} textAnchor="middle" fontSize={9} fill="var(--muted)">
          {kk}
        </text>
      ))}
      <text x={(L + R) / 2} y={B + 30} textAnchor="middle" fontSize={9.5} fill="var(--muted)">
        k
      </text>

      <Legend
        x={L}
        y={B + 46}
        items={[
          { label: "inertia — falls at every k", color: TEAL },
          ...(silhouette ? [{ label: "silhouette — has a peak", color: PINK, dash: "5 3" }] : []),
        ]}
      />
    </Fig>
  );
}

// ---------------------------------------------------------------------------
// Two distributions of outcomes over 100 starts.
// ---------------------------------------------------------------------------
export function InitDistribution({
  random,
  plusplus,
  floor,
  caption,
}: {
  random: readonly number[];
  plusplus: readonly number[];
  floor: number;
  caption?: React.ReactNode;
}) {
  const W = 440, L = 52, R = 400, T = 18;
  const ROW = 74;
  const H = T + ROW * 2 + 46;
  // Log scale: the random tail runs to 12x the floor, which on a linear axis
  // squashes every k-means++ run into one pixel column.
  const all = [...random, ...plusplus];
  const lo = Math.log10(Math.min(...all) * 0.97);
  const hi = Math.log10(Math.max(...all) * 1.03);
  const px = (v: number) => L + ((Math.log10(v) - lo) / (hi - lo || 1)) * (R - L);

  const series = [
    { name: "random init", vals: random, color: BAD },
    { name: "k-means++", vals: plusplus, color: GOOD },
  ];

  const BINS = 46;
  return (
    <Fig W={W} H={H} label="final inertia over 100 initialisations, random against k-means++" caption={caption} minWidth={340}>
      {series.map((s, si) => {
        const y0 = T + si * ROW;
        const counts = new Array(BINS).fill(0);
        for (const v of s.vals) {
          const f = (Math.log10(v) - lo) / (hi - lo || 1);
          counts[Math.min(BINS - 1, Math.max(0, Math.floor(f * BINS)))] += 1;
        }
        const cMax = Math.max(...counts, 1);
        const bw = (R - L) / BINS;
        const med = [...s.vals].sort((a, b) => a - b)[Math.floor(s.vals.length / 2)];
        return (
          <g key={s.name}>
            <text x={L - 8} y={y0 + 30} textAnchor="end" fontSize={10.5} fill="var(--ink)">
              {s.name}
            </text>
            {counts.map((c, i) =>
              c ? (
                <rect
                  key={i}
                  x={L + i * bw}
                  y={y0 + 44 - (c / cMax) * 38}
                  width={Math.max(bw - 0.6, 1)}
                  height={(c / cMax) * 38}
                  fill={s.color}
                  opacity={0.78}
                />
              ) : null,
            )}
            <line x1={L} y1={y0 + 44} x2={R} y2={y0 + 44} stroke="var(--border-strong)" strokeWidth={0.8} />
            <g>
              <line x1={px(med)} y1={y0 + 6} x2={px(med)} y2={y0 + 44} stroke="var(--ink)" strokeWidth={1.1} strokeDasharray="3 2" />
              <text x={px(med) + 4} y={y0 + 13} fontSize={9} fill="var(--ink)">
                median {Math.round(med)}
              </text>
            </g>
          </g>
        );
      })}

      <line x1={px(floor)} y1={T} x2={px(floor)} y2={T + ROW * 2 - 30} stroke={TEAL} strokeWidth={1.2} />
      <text x={px(floor)} y={T + ROW * 2 - 20} textAnchor="start" fontSize={9.5} fill={TEAL}>
        best solution found ({Math.round(floor)})
      </text>

      <text x={(L + R) / 2} y={H - 8} textAnchor="middle" fontSize={9.5} fill="var(--muted)">
        final inertia after convergence (log scale) — lower is better
      </text>
    </Fig>
  );
}

// ---------------------------------------------------------------------------
// Grouped bars: a measurement at two or three settings, several methods each.
// ---------------------------------------------------------------------------
export function GroupedBars({
  groups,
  series,
  ylabel,
  format = (v) => String(v),
  caption,
  logScale = false,
}: {
  groups: { label: string; values: number[] }[];
  series: { name: string; color: string }[];
  ylabel: string;
  format?: (v: number) => string;
  caption?: React.ReactNode;
  logScale?: boolean;
}) {
  const W = 440, L = 54, R = 400, T = 18, B = 132;
  const H = B + 44 + legendRows(series.length) * 14;
  const all = groups.flatMap((g) => g.values);
  const hi = Math.max(...all);
  const loRaw = Math.min(...all.filter((v) => v > 0), hi);
  const py = (v: number) =>
    logScale
      ? B - ((Math.log10(Math.max(v, loRaw / 4)) - Math.log10(loRaw / 4)) / (Math.log10(hi * 1.6) - Math.log10(loRaw / 4))) * (B - T)
      : B - (v / (hi * 1.12 || 1)) * (B - T);

  const gw = (R - L) / groups.length;
  const bw = (gw * 0.72) / series.length;

  return (
    <Fig W={W} H={H} label={ylabel} caption={caption} minWidth={340}>
      <line x1={L} y1={B} x2={R} y2={B} stroke="var(--border-strong)" strokeWidth={0.8} />
      <text x={8} y={T + 8} fontSize={9.5} fill="var(--muted)">{ylabel}</text>

      {groups.map((g, gi) => (
        <g key={g.label}>
          {g.values.map((v, si) => {
            const x = L + gi * gw + gw * 0.14 + si * bw;
            const y = py(v);
            return (
              <g key={si}>
                <rect x={x} y={y} width={bw - 3} height={Math.max(B - y, 1)} fill={series[si].color} opacity={0.82} rx={1.5} />
                <text
                  x={x + (bw - 3) / 2}
                  y={y - 4}
                  textAnchor="middle"
                  fontSize={9}
                  fill="var(--ink)"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {format(v)}
                </text>
              </g>
            );
          })}
          <text x={L + gi * gw + gw / 2} y={B + 15} textAnchor="middle" fontSize={9.5} fill="var(--muted)">
            {g.label}
          </text>
        </g>
      ))}

      <Legend items={series.map((s) => ({ label: s.name, color: s.color }))} x={L} y={B + 42} />
    </Fig>
  );
}

// ---------------------------------------------------------------------------
// The contingency table: true group by cluster id.
// ---------------------------------------------------------------------------
export function ContingencyTable({
  table,
  rowLabel = "true group",
  colLabel = "cluster id",
  caption,
}: {
  table: readonly (readonly number[])[];
  rowLabel?: string;
  colLabel?: string;
  caption?: React.ReactNode;
}) {
  const rows = table.length;
  const cols = table[0].length;
  const CELL = 44;
  const L = 78, T = 42;
  const W = L + cols * CELL + 18;
  const H = T + rows * CELL + 34;
  const hi = Math.max(...table.flatMap((r) => [...r]));

  return (
    <Fig W={W} H={H} label="contingency table of true groups against cluster ids" caption={caption} minWidth={Math.min(W, 300)}>
      <text x={L} y={16} fontSize={10.5} fill="var(--muted)">{colLabel}</text>
      <text x={4} y={T - 8} fontSize={10.5} fill="var(--muted)">{rowLabel}</text>

      {table.map((row, r) =>
        row.map((v, c) => (
          <g key={`${r}-${c}`} transform={`translate(${L + c * CELL} ${T + r * CELL})`}>
            <rect
              width={CELL}
              height={CELL}
              fill={v ? `color-mix(in srgb, ${TEAL} ${Math.round((v / hi) * 62)}%, var(--panel))` : "var(--panel)"}
              stroke="var(--border)"
              strokeWidth={0.7}
            />
            <text
              x={CELL / 2}
              y={CELL / 2 + 4}
              textAnchor="middle"
              fontSize={12}
              fill={v ? "var(--ink)" : "var(--faint)"}
              fontWeight={v > hi * 0.5 ? 600 : 400}
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {v}
            </text>
          </g>
        )),
      )}

      {table.map((_, r) => (
        <text key={r} x={L - 8} y={T + r * CELL + CELL / 2 + 4} textAnchor="end" fontSize={10} fill="var(--muted)">
          {r}
        </text>
      ))}
      {table[0].map((_, c) => (
        <text key={c} x={L + c * CELL + CELL / 2} y={T - 7} textAnchor="middle" fontSize={10} fill="var(--muted)">
          {c}
        </text>
      ))}
    </Fig>
  );
}

// ---------------------------------------------------------------------------
// A plain line over an x that is already meaningful (k, d, dims).
// ---------------------------------------------------------------------------
export function LineChart({
  x,
  series,
  xlabel,
  ylabel,
  logX = false,
  markX,
  markXLabel,
  yZero = false,
  format = (v) => (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(2)),
  caption,
}: {
  x: readonly number[];
  series: { label: string; values: readonly number[]; color: string; dash?: string }[];
  xlabel: string;
  ylabel: string;
  logX?: boolean;
  markX?: number;
  markXLabel?: string;
  yZero?: boolean;
  format?: (v: number) => string;
  caption?: React.ReactNode;
}) {
  const W = 440, L = 50, R = 400, T = 16, B = 138;
  const H = B + 46 + legendRows(series.length) * 14;
  const all = series.flatMap((s) => [...s.values]);
  const rawLo = yZero ? Math.min(0, ...all) : Math.min(...all);
  const rawHi = Math.max(...all);
  const pad = (rawHi - rawLo) * 0.08 || 1;
  const lo = rawLo - pad, hi = rawHi + pad;

  const tx = (v: number) => (logX ? Math.log10(Math.max(v, 1e-9)) : v);
  const xlo = tx(Math.min(...x)), xhi = tx(Math.max(...x));
  const px = (v: number) => L + ((tx(v) - xlo) / (xhi - xlo || 1)) * (R - L);
  const py = (v: number) => B - ((v - lo) / (hi - lo || 1)) * (B - T);

  return (
    <Fig W={W} H={H} label={`${ylabel} against ${xlabel}`} caption={caption} minWidth={340}>
      {[0, 0.5, 1].map((f) => {
        const v = lo + f * (hi - lo);
        return (
          <g key={f}>
            <line x1={L} y1={py(v)} x2={R} y2={py(v)} stroke="var(--border)" strokeWidth={0.6} />
            <text x={L - 6} y={py(v) + 3.2} textAnchor="end" fontSize={9} fill="var(--muted)">
              {format(v)}
            </text>
          </g>
        );
      })}
      <text x={8} y={T + 8} fontSize={9.5} fill="var(--muted)">{ylabel}</text>

      {markX != null && (
        <g>
          <line x1={px(markX)} y1={T} x2={px(markX)} y2={B} stroke={TEAL} strokeWidth={1.2} strokeDasharray="3 3" />
          {markXLabel && (
            <text x={px(markX) + 5} y={T + 10} fontSize={9} fill={TEAL}>{markXLabel}</text>
          )}
        </g>
      )}

      {series.map((s) => (
        <g key={s.label}>
          <path
            d={s.values.map((v, i) => `${i ? "L" : "M"} ${px(x[i]).toFixed(1)} ${py(v).toFixed(1)}`).join(" ")}
            fill="none"
            stroke={s.color}
            strokeWidth={2}
            strokeDasharray={s.dash}
          />
          {s.values.map((v, i) => (
            <circle key={i} cx={px(x[i])} cy={py(v)} r={2.4} fill={s.color} />
          ))}
        </g>
      ))}

      {x.map((v, i) =>
        i % Math.ceil(x.length / 7) === 0 || i === x.length - 1 ? (
          <text key={v} x={px(v)} y={B + 15} textAnchor="middle" fontSize={9} fill="var(--muted)">
            {v >= 1000 ? `${v / 1000}k` : v}
          </text>
        ) : null,
      )}
      <text x={(L + R) / 2} y={B + 30} textAnchor="middle" fontSize={9.5} fill="var(--muted)">
        {xlabel}
      </text>

      <Legend items={series.map(({ label, color, dash }) => ({ label, color, dash }))} x={L} y={B + 46} />
    </Fig>
  );
}
