import Link from "next/link";

export const metadata = {
  title: "Capstone: final model selection — Manifold",
  description:
    "Comparing every model built — baseline, regularized linear, spatial linear, Tobit, and gradient boosting — and choosing the final model on the criteria that actually matter: accuracy, the goal, interpretability, and robustness.",
};

const ALL = [
  { name: "Baseline (mean)", r2: 0.0, note: "the bar to beat" },
  { name: "Ridge (10 feats)", r2: 0.672, note: "transparent baseline" },
  { name: "Ridge + spatial", r2: 0.691, note: "geography features help" },
  { name: "Tobit", r2: 0.67, note: "unbiased coefs, not a score play", italic: true },
  { name: "Gradient boosting", r2: 0.843, note: "captures non-linearity + interactions", win: true },
];

function CompareFig() {
  const W = 340, H = 180, padL = 108, padR = 36, padT = 8, padB = 14;
  const max = 0.9, rowH = (H - padT - padB) / ALL.length;
  const bx = (v: number) => Math.round((padL + (v / max) * (W - padL - padR)) * 100) / 100;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
      {ALL.map((m, i) => {
        const y = padT + i * rowH;
        const color = m.win ? "var(--c-trees)" : i === 0 ? "var(--faint)" : "var(--c-regression)";
        return (
          <g key={m.name}>
            <text x={padL - 6} y={y + rowH / 2 + 2} fontSize={8} fill={m.win ? "var(--c-trees)" : "var(--muted)"} fontWeight={m.win ? 600 : 400} textAnchor="end">{m.name}</text>
            <rect x={padL} y={Math.round((y + 3) * 100) / 100} width={Math.round((bx(m.r2) - padL) * 100) / 100} height={Math.round((rowH - 6) * 100) / 100} fill={color} fillOpacity={0.78} rx={1.5} />
            <text x={bx(m.r2) + 4} y={y + rowH / 2 + 2} fontSize={8} fill="var(--muted)">{m.r2.toFixed(3)}</text>
          </g>
        );
      })}
      <text x={(padL + W - padR) / 2} y={H - 2} fontSize={8} fill="var(--faint)" textAnchor="middle">5-fold CV R² — higher is better</text>
    </svg>
  );
}

export default function ModelSelectionPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-regression)")}>Capstone</span>
        <span style={chip("var(--c-metrics)")}>Decision &amp; delivery</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 8 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 42, lineHeight: 1.08, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        Final model selection
      </h1>
      <p style={{ fontSize: 17.5, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        Five models, one decision. Selecting isn&rsquo;t just &ldquo;take the highest number&rdquo; — it&rsquo;s weighing accuracy
        against the goal, interpretability, and robustness. Here, though, the evidence is clear.
      </p>

      <div className="lesson">
        <h2>Everything we built, side by side</h2>
        <div style={figWrap}>
          <CompareFig />
          <div style={cap}>The full journey: baseline 0.00 → transparent linear 0.672 → spatial linear 0.691 →
            gradient boosting <strong>0.843</strong>. Tobit (italic) isn&rsquo;t a score play — its value is unbiased
            coefficients, not CV R².</div>
        </div>
        <div style={{ overflowX: "auto", margin: "1rem 0" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr>{["Model", "CV R²", "RMSE", "Best for"].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              <tr><td style={td}>Baseline (mean)</td><td style={td}>0.000</td><td style={td}>1.156</td><td style={td}>the reference</td></tr>
              <tr><td style={td}>Ridge (10 features)</td><td style={td}>0.672</td><td style={td}>0.662</td><td style={td}>interpretable baseline</td></tr>
              <tr><td style={td}>Ridge + spatial</td><td style={td}>0.691</td><td style={td}>0.643</td><td style={td}>interpretable + geography</td></tr>
              <tr><td style={td}>Tobit</td><td style={td}>~0.67</td><td style={td}>—</td><td style={td}><strong>inference</strong> (unbiased effects)</td></tr>
              <tr><td style={{ ...td, color: "var(--c-trees)", fontWeight: 600 }}>Gradient boosting</td><td style={td}>0.843</td><td style={td}>0.458</td><td style={td}><strong>prediction</strong> (the deliverable)</td></tr>
            </tbody>
          </table>
        </div>

        <h2>The decision</h2>
        <p>
          The task is to <strong>predict</strong> test-block prices, so accuracy on unseen data is the deciding
          criterion — and <strong>gradient boosting wins decisively</strong> (R² 0.843 vs 0.691), having earned that
          lead by capturing the non-linear geography and interactions we proved were there. It&rsquo;s our shipped model.
        </p>
        <p>But selection is contextual, and a senior analyst keeps the others for what they&rsquo;re best at:</p>
        <ul style={ul}>
          <li><strong>If the goal were explanation</strong> (&ldquo;how much does income drive price?&rdquo;), the{" "}
            <strong>Tobit linear model</strong> would be the right deliverable — its unbiased, readable coefficients
            answer that question; a boosting model&rsquo;s importances don&rsquo;t give signed, calibrated effects.</li>
          <li><strong>If we needed a simple, auditable rule</strong> for a regulated setting, the{" "}
            <strong>spatial ridge model</strong> trades ~15 points of R² for full transparency.</li>
          <li><strong>For a quick, robust default</strong> with zero tuning, plain ridge is still a credible 0.67.</li>
        </ul>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-regression)", marginBottom: 4 }}>
            &ldquo;Best model&rdquo; depends on the question
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            There is no single best model — there&rsquo;s the best model <em>for a stated objective</em>. For prediction,
            it&rsquo;s gradient boosting. For inference, it&rsquo;s Tobit. For transparency, it&rsquo;s the linear model. We can name
            all three because we built the full ladder and understand exactly what each rung buys. That&rsquo;s the value
            of a diagnostic-driven progression over jumping straight to the fanciest algorithm: you end up able to
            <em> justify</em> your choice, not just defend a score.
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/california-housing-capstone/gradient-boosting" style={navLink}>← Upgrade 3: gradient boosting</Link>
          <Link href="/learn/california-housing-capstone/takeaways" style={{ ...navLink, fontWeight: 600 }}>Next up · Predictions &amp; takeaways →</Link>
        </div>
      </div>
    </article>
  );
}

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-regression) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-regression) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0" };
const figWrap: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 14, margin: "1.2rem 0" };
const cap: React.CSSProperties = { fontSize: 12, color: "var(--muted)", marginTop: 8, lineHeight: 1.5 };
const th: React.CSSProperties = { textAlign: "left", padding: "7px 9px", borderBottom: "2px solid var(--border-strong)", color: "var(--muted)", fontWeight: 500, fontSize: 12 };
const td: React.CSSProperties = { padding: "7px 9px", borderBottom: "1px solid var(--border)", color: "var(--muted)", lineHeight: 1.4 };
