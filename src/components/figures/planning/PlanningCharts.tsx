// Charts for the Planning track: the things that change across sweeps but are
// not themselves grids.
//
// Static SVG, no client JS. Long explanation belongs in the caption, where it
// reflows; a single <svg> <text> neither wraps nor shrinks and will run off the
// right edge the first time someone lengthens it.

const GOLD = "var(--c-rl)";
const BAD = "var(--bad)";
const GOOD = "var(--good)";

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

// Two legend entries per row, and the frame grows to fit however many rows.
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
// The stopping bound against the error it is bounding.
// ---------------------------------------------------------------------------
export function BoundVsError({
  delta,
  bound,
  error,
  caption,
}: {
  delta: readonly number[];
  bound: readonly number[];
  error: readonly number[];
  caption?: React.ReactNode;
}) {
  const n = delta.length;
  const W = 440, L = 44, R = 424, T = 14, B = 140;
  const H = B + 46 + legendRows(3) * 14;
  const hi = Math.max(...bound, ...delta, ...error);
  const px = (i: number) => L + (i / (n - 1 || 1)) * (R - L);
  const py = (v: number) => B - (v / (hi || 1)) * (B - T);
  const path = (vs: readonly number[]) =>
    vs.map((v, i) => `${i ? "L" : "M"} ${px(i).toFixed(1)} ${py(v).toFixed(1)}`).join(" ");

  // The sweep on which the answer is already exact while the bound still refuses
  // to say so -- the entire point of the figure.
  const exactAt = error.findIndex((e) => e === 0);

  const series = [
    { label: "the bound: γ/(1−γ)·Δ", vs: bound, color: BAD, dash: "" },
    { label: "Δ, the change you can see", vs: delta, color: "var(--muted)", dash: "4 3" },
    { label: "the true error ‖V−V*‖", vs: error, color: GOOD, dash: "" },
  ];

  return (
    <Fig W={W} H={H} label="the stopping bound against the true error" caption={caption} minWidth={340}>
      {[0, 0.25, 0.5, 0.75, 1].map((f) => (
        <g key={f}>
          <line x1={L} y1={py(f * hi)} x2={R} y2={py(f * hi)} stroke="var(--border)" strokeWidth={0.6} />
          <text x={L - 6} y={py(f * hi) + 3.2} textAnchor="end" fontSize={9} fill="var(--muted)">
            {(f * hi).toFixed(1)}
          </text>
        </g>
      ))}

      {exactAt >= 0 && (
        <g>
          <line x1={px(exactAt)} y1={T} x2={px(exactAt)} y2={B} stroke={GOLD} strokeWidth={1.2} strokeDasharray="3 3" />
          <text x={px(exactAt) - 5} y={T + 10} textAnchor="end" fontSize={9} fill={GOLD}>
            exact here
          </text>
        </g>
      )}

      {series.map((s) => (
        <path key={s.label} d={path(s.vs)} fill="none" stroke={s.color} strokeWidth={1.9} strokeDasharray={s.dash} />
      ))}

      {delta.map((_, i) => (
        <text key={i} x={px(i)} y={B + 15} textAnchor="middle" fontSize={9} fill="var(--muted)">
          {i + 1}
        </text>
      ))}
      <text x={(L + R) / 2} y={B + 30} textAnchor="middle" fontSize={9.5} fill="var(--muted)">
        sweep
      </text>
      <text x={8} y={T + 8} fontSize={9.5} fill="var(--muted)">value</text>

      <Legend items={series.map(({ label, color, dash }) => ({ label, color, dash }))} x={L} y={B + 46} />
    </Fig>
  );
}

// ---------------------------------------------------------------------------
// Total value per round: the monotone climb, and the round it stops.
// ---------------------------------------------------------------------------
export function ValueStaircase({
  totals,
  caption,
  xlabel = "policy-iteration round",
}: {
  totals: readonly number[];
  caption?: React.ReactNode;
  xlabel?: string;
}) {
  const n = totals.length;
  const W = 400, L = 48, R = 384, T = 16, B = 132;
  const H = B + 34;
  const lo = Math.min(...totals, 0);
  const hi = Math.max(...totals);
  const pad = (hi - lo) * 0.12 || 1;
  const py = (v: number) => B - ((v - (lo - pad)) / (hi + pad - (lo - pad))) * (B - T);
  const bw = (R - L) / n;

  return (
    <Fig W={W} H={H} label="total state value at each round" caption={caption} minWidth={300}>
      <line x1={L} y1={py(0)} x2={R} y2={py(0)} stroke="var(--border-strong)" strokeWidth={0.8} />
      {totals.map((v, i) => {
        const x = L + i * bw + bw * 0.22;
        const w = bw * 0.56;
        const top = Math.min(py(v), py(0));
        const h = Math.abs(py(v) - py(0));
        const repeat = i > 0 && Math.abs(v - totals[i - 1]) < 1e-9;
        return (
          <g key={i}>
            <rect
              x={x}
              y={top}
              width={w}
              height={Math.max(h, 1)}
              fill={repeat ? "var(--panel)" : v >= 0 ? GOOD : BAD}
              opacity={repeat ? 1 : 0.82}
              stroke={repeat ? "var(--border-strong)" : "none"}
              strokeWidth={1}
              strokeDasharray={repeat ? "3 2" : undefined}
            />
            <text
              x={x + w / 2}
              y={v >= 0 ? top - 5 : top + h + 11}
              textAnchor="middle"
              fontSize={10}
              fill="var(--ink)"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {v.toFixed(2)}
            </text>
            <text x={x + w / 2} y={B + 15} textAnchor="middle" fontSize={9} fill="var(--muted)">
              {i + 1}
            </text>
          </g>
        );
      })}
      <text x={(L + R) / 2} y={B + 30} textAnchor="middle" fontSize={9.5} fill="var(--muted)">
        {xlabel}
      </text>
      <text x={8} y={T + 8} fontSize={9.5} fill="var(--muted)">Σ V(s)</text>
    </Fig>
  );
}

// ---------------------------------------------------------------------------
// The policy settles long before the values do -- and here, the values never
// settle on V* at all.
// ---------------------------------------------------------------------------
export function PolicyVsValues({
  optimal,
  error,
  caption,
}: {
  optimal: readonly boolean[];
  error: readonly number[];
  caption?: React.ReactNode;
}) {
  const n = optimal.length;
  const W = 440, L = 52, R = 424, T = 14, B = 120;
  const STRIP = B + 26;
  const H = STRIP + 58;
  const hi = Math.max(...error) * 1.1;
  const px = (i: number) => L + (i / (n - 1 || 1)) * (R - L);
  const py = (v: number) => B - (v / (hi || 1)) * (B - T);

  return (
    <Fig W={W} H={H} label="is the greedy policy optimal yet, against how far the values still are from V*" caption={caption} minWidth={340}>
      {[0, 0.5, 1].map((f) => (
        <g key={f}>
          <line x1={L} y1={py(f * hi)} x2={R} y2={py(f * hi)} stroke="var(--border)" strokeWidth={0.6} />
          <text x={L - 6} y={py(f * hi) + 3.2} textAnchor="end" fontSize={9} fill="var(--muted)">
            {(f * hi).toFixed(1)}
          </text>
        </g>
      ))}
      <path
        d={error.map((v, i) => `${i ? "L" : "M"} ${px(i).toFixed(1)} ${py(v).toFixed(1)}`).join(" ")}
        fill="none"
        stroke={BAD}
        strokeWidth={2}
      />
      {error.map((v, i) => (
        <circle key={i} cx={px(i)} cy={py(v)} r={2.6} fill={BAD} />
      ))}
      <text x={8} y={T + 8} fontSize={9.5} fill="var(--muted)">‖V−V*‖</text>

      <text x={L - 6} y={STRIP + 12} textAnchor="end" fontSize={9.5} fill="var(--muted)">
        greedy π
      </text>
      {optimal.map((ok, i) => {
        const w = (R - L) / n;
        return (
          <g key={i}>
            <rect
              x={L + i * w + 1.5}
              y={STRIP}
              width={w - 3}
              height={17}
              rx={2}
              fill={ok ? `color-mix(in srgb, ${GOOD} 34%, var(--panel))` : "var(--panel)"}
              stroke={ok ? GOOD : "var(--border-strong)"}
              strokeWidth={1}
            />
            <text
              x={L + i * w + w / 2}
              y={STRIP + 12.5}
              textAnchor="middle"
              fontSize={10}
              fill={ok ? GOOD : "var(--faint)"}
              fontWeight={ok ? 700 : 400}
            >
              {ok ? "✓" : "·"}
            </text>
            <text x={L + i * w + w / 2} y={STRIP + 32} textAnchor="middle" fontSize={9} fill="var(--muted)">
              {i}
            </text>
          </g>
        );
      })}
      <text x={(L + R) / 2} y={STRIP + 48} textAnchor="middle" fontSize={9.5} fill="var(--muted)">
        evaluation sweeps completed
      </text>
    </Fig>
  );
}

// ---------------------------------------------------------------------------
// A plain horizontal bar comparison: three counts, one scale.
// ---------------------------------------------------------------------------
export function TotalsBar({
  rows,
  caption,
  unit = "",
}: {
  rows: { label: string; value: number; note?: string; color?: string }[];
  caption?: React.ReactNode;
  unit?: string;
}) {
  const W = 440, L = 150, R = 372;
  const ROW = 38;
  const H = rows.length * ROW + 14;
  const hi = Math.max(...rows.map((r) => r.value));
  // Same trap as GridRow's panel labels: these are prose and will outgrow the
  // 142px gutter. Split rather than clip.
  const wrap = (t: string) => {
    if (t.length <= 26) return [t];
    const words = t.split(" ");
    const out: string[] = [];
    let cur = "";
    for (const w of words) {
      if (cur && (cur + " " + w).length > 26) {
        out.push(cur);
        cur = w;
      } else cur = cur ? cur + " " + w : w;
    }
    if (cur) out.push(cur);
    return out.slice(0, 2);
  };

  return (
    <Fig W={W} H={H} label={rows.map((r) => `${r.label} ${r.value}`).join("; ")} caption={caption} minWidth={330}>
      {rows.map((r, i) => {
        const y = 10 + i * ROW;
        const w = Math.max((r.value / (hi || 1)) * (R - L), 1);
        return (
          <g key={r.label}>
            {wrap(r.label).map((ln, li) => (
              <text key={li} x={L - 8} y={y + 8 + li * 12} textAnchor="end" fontSize={10.5} fill="var(--ink)">
                {ln}
              </text>
            ))}
            <rect x={L} y={y} width={w} height={18} rx={2} fill={r.color ?? GOLD} opacity={0.82} />
            {/* The value sits after the bar, unless that would push it past the
                frame -- then it goes inside, right-aligned. */}
            {(() => {
              const text = `${r.value.toLocaleString()}${unit}`;
              const est = text.length * 5.6;
              const outside = L + w + 7 + est <= W - 6;
              return (
                <text
                  x={outside ? L + w + 7 : L + w - 6}
                  y={y + 13}
                  textAnchor={outside ? "start" : "end"}
                  fontSize={10.5}
                  fill={outside ? "var(--ink)" : "var(--surface)"}
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {text}
                </text>
              );
            })()}
            {r.note && (
              <text x={L} y={y + 31} fontSize={9} fill="var(--muted)">
                {r.note}
              </text>
            )}
          </g>
        );
      })}
    </Fig>
  );
}

// ---------------------------------------------------------------------------
// The curse: a log scale that has to hold 10^1 and 10^170 at once.
// ---------------------------------------------------------------------------
export function CurseScale({
  marks,
  caption,
}: {
  marks: readonly { label: string; log10: number }[];
  caption?: React.ReactNode;
}) {
  const W = 440, L = 34, R = 424, AX = 46;
  // Derived from where the last mark actually lands, not guessed: the rows
  // start at AX + 18 and step by 26, and the dot has a radius to clear.
  const H = AX + 18 + (marks.length - 1) * 26 + 14;
  const hi = Math.max(...marks.map((m) => m.log10)) * 1.02;
  const px = (l: number) => L + (l / hi) * (R - L);

  return (
    <Fig W={W} H={H} label="the size of some state spaces, on a log scale" caption={caption} minWidth={340}>
      <line x1={L} y1={AX} x2={R} y2={AX} stroke="var(--border-strong)" strokeWidth={1} />
      {[0, 20, 40, 60, 80, 100, 120, 140, 160].map((t) => (
        <g key={t}>
          <line x1={px(t)} y1={AX - 4} x2={px(t)} y2={AX} stroke="var(--border-strong)" strokeWidth={0.8} />
          <text x={px(t)} y={AX - 9} textAnchor="middle" fontSize={8.5} fill="var(--muted)">
            10{t === 0 ? "⁰" : `^${t}`}
          </text>
        </g>
      ))}
      <text x={L} y={16} fontSize={9.5} fill="var(--muted)">number of states</text>

      {marks.map((m, i) => {
        const y = AX + 18 + i * 26;
        const x = px(m.log10);
        // Labels flip to the left of their tick once the tick is past the middle,
        // so a long name never runs off the right edge.
        const flip = x > (L + R) / 2;
        const atoms = m.label.includes("atoms");
        return (
          <g key={m.label}>
            <line x1={x} y1={AX} x2={x} y2={y} stroke={atoms ? "var(--muted)" : GOLD} strokeWidth={0.8} strokeDasharray="2 2" />
            <circle cx={x} cy={y} r={3.4} fill={atoms ? "var(--muted)" : GOLD} />
            <text
              x={flip ? x - 8 : x + 8}
              y={y + 3.5}
              textAnchor={flip ? "end" : "start"}
              fontSize={10}
              fill={atoms ? "var(--muted)" : "var(--ink)"}
              fontStyle={atoms ? "italic" : undefined}
            >
              {m.label}
            </text>
          </g>
        );
      })}
    </Fig>
  );
}
