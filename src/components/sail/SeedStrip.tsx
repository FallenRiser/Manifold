// Five training runs are five numbers, and a table of them hides the one thing that matters: whether the
// clouds overlap. Each row is a strip from 0 to `max`; each dot is one training run; the bar is mean ± sd.

type Row = { label: React.ReactNode; values: number[]; strong?: boolean; color?: string };

const mean = (v: number[]) => v.reduce((a, b) => a + b, 0) / v.length;
const sd = (v: number[]) => { const m = mean(v); return Math.sqrt(v.reduce((a, b) => a + (b - m) * (b - m), 0) / v.length); };

export function SeedStrip({ rows, max = 200, unit = "races rounded, of 200", note, accent = "var(--c-rl)" }: {
  rows: Row[]; max?: number; unit?: string; note?: React.ReactNode; accent?: string;
}) {
  const W = 420, PAD = 10;
  const px = (val: number) => PAD + (val / max) * (W - 2 * PAD);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(f * max));
  return (
    <figure style={{ margin: "1.3rem 0", padding: "14px 16px 10px", border: "1px solid var(--border)", borderRadius: 12, background: "var(--surface)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(120px, 190px) 1fr auto", columnGap: 12, rowGap: 6, alignItems: "center" }}>
        {rows.map((r, i) => {
          const m = mean(r.values), s = sd(r.values);
          const c = r.color ?? (r.strong ? accent : "var(--muted)");
          return (
            <div key={i} style={{ display: "contents" }}>
              <div style={{ fontSize: 13, lineHeight: 1.3, color: r.strong ? "var(--ink)" : "var(--muted)", fontWeight: r.strong ? 600 : 400 }}>
                {r.label}
                <div style={{ fontSize: 11, color: "var(--faint)", fontFamily: "ui-monospace, monospace", fontWeight: 400 }}>{r.values.join(" · ")}</div>
              </div>
              <svg viewBox={`0 0 ${W} 30`} style={{ width: "100%", height: "auto", display: "block" }} role="img"
                aria-label={`${typeof r.label === "string" ? r.label : "row"}: ${r.values.join(", ")}`}>
                <line x1={PAD} x2={W - PAD} y1={15} y2={15} stroke="var(--border-strong)" strokeWidth={1} />
                {ticks.map((t) => <line key={t} x1={px(t)} x2={px(t)} y1={11} y2={19} stroke="var(--border-strong)" strokeWidth={1} />)}
                <rect x={px(Math.max(0, m - s))} y={10} width={Math.max(1, px(Math.min(max, m + s)) - px(Math.max(0, m - s)))} height={10} rx={5}
                  fill={`color-mix(in srgb, ${c} 18%, transparent)`} />
                <line x1={px(m)} x2={px(m)} y1={6} y2={24} stroke={c} strokeWidth={2} />
                {r.values.map((val, j) => (
                  <circle key={j} cx={px(val)} cy={15} r={4.6} fill={c} fillOpacity={0.85} stroke="var(--surface)" strokeWidth={1.2}>
                    <title>{val}</title>
                  </circle>
                ))}
              </svg>
              <div style={{ fontSize: 12.5, fontFamily: "ui-monospace, monospace", color: r.strong ? "var(--ink)" : "var(--muted)", whiteSpace: "nowrap", fontWeight: r.strong ? 600 : 400 }}>
                {m.toFixed(1)} ± {s.toFixed(1)}
              </div>
            </div>
          );
        })}
        <div />
        <svg viewBox={`0 0 ${W} 14`} style={{ width: "100%", height: "auto", display: "block" }} aria-hidden>
          {ticks.map((t) => <text key={t} x={px(t)} y={11} fontSize={10} textAnchor="middle" fill="var(--faint)">{t}</text>)}
        </svg>
        <div />
      </div>
      <figcaption style={{ fontSize: 12, color: "var(--faint)", marginTop: 8, lineHeight: 1.5 }}>
        Each dot is one training run, scored on the same held-out races; the line and band are the mean ± standard deviation. Axis: {unit}.
        {note && <> {note}</>}
      </figcaption>
    </figure>
  );
}
