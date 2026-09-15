// The four steps of a normalisation layer, with what each one does to the
// distribution drawn underneath it.
//
// The reason this figure earns its ink: steps 2 and 3 are the normalisation and
// step 4 undoes it. Written as three formulas that looks like wasted motion, and
// readers reasonably ask why you would centre something only to shift it again.
// Seeing the distribution move, tighten, and then move and widen again under a
// pair of LEARNED parameters makes the answer obvious — the layer does not force
// the activations to be standard normal, it takes the choice of their mean and
// scale away from the weights and hands it to two parameters of its own.

const STEPS = [
  { n: "1", label: "the layer output", math: "z", note: "whatever the weights produced", mu: 0.62, sd: 1.5, tint: "var(--muted)" },
  { n: "2", label: "centre", math: "z − μ", note: "mean of the pooled set", mu: 0, sd: 1.5, tint: "var(--c-neural)" },
  { n: "3", label: "scale", math: "(z − μ) / σ", note: "now mean 0, variance 1", mu: 0, sd: 0.85, tint: "var(--c-neural)" },
  { n: "4", label: "un-normalise, learnably", math: "γ ẑ + β", note: "γ and β are trained", mu: 0.3, sd: 1.15, tint: "var(--good)" },
];

// A gaussian sketch in a 74x34 box, so the four panels are directly comparable.
function Bell({ mu, sd, tint }: { mu: number; sd: number; tint: string }) {
  const pts: string[] = [];
  for (let i = 0; i <= 36; i++) {
    const x = -3 + (6 * i) / 36;
    const y = Math.exp(-0.5 * ((x - mu) / sd) ** 2) / sd;
    pts.push(`${(37 + x * 11).toFixed(1)},${(32 - y * 15).toFixed(1)}`);
  }
  return (
    <g>
      <line x1={37} y1={8} x2={37} y2={33} stroke="var(--border-strong)" strokeWidth={0.7} strokeDasharray="2 2" />
      <line x1={2} y1={33} x2={72} y2={33} stroke="var(--border-strong)" strokeWidth={0.8} />
      <polyline points={pts.join(" ")} fill="none" stroke={tint} strokeWidth={1.6} />
    </g>
  );
}

export function BatchNormFlow({ caption }: { caption?: React.ReactNode }) {
  return (
    <figure style={{ margin: "22px 0 6px", padding: "14px 16px 12px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
        {STEPS.map((s) => (
          <div key={s.n} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: "9px 11px", background: "var(--surface)" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
              <span className="font-display" style={{ fontSize: 10, fontWeight: 700, color: s.tint }}>{s.n}</span>
              <span style={{ fontSize: 12, color: "var(--ink)", fontWeight: 500 }}>{s.label}</span>
            </div>
            <div style={{ fontFamily: "ui-monospace, SFMono-Regular, monospace", fontSize: 14, color: s.tint, margin: "5px 0 2px" }}>{s.math}</div>
            <svg viewBox="0 0 74 36" width="100%" aria-hidden>
              <Bell mu={s.mu} sd={s.sd} tint={s.tint} />
            </svg>
            <div style={{ fontSize: 10.5, color: "var(--faint)", lineHeight: 1.45 }}>{s.note}</div>
          </div>
        ))}
      </div>
      {caption && (
        <figcaption style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.6, marginTop: 11, paddingTop: 9, borderTop: "1px solid var(--border)" }}>
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
