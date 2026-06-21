import Link from "next/link";

export const metadata = {
  title: "Detecting non-normality — Manifold",
  description:
    "A practical guide to reading Q-Q plots, interpreting the Shapiro-Wilk test, and understanding when to care about non-normal residuals.",
};

export default function DetectingNonNormalityPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-regression)")}>Regression</span>
        <span style={chip("var(--brand)")}>Diagnostics</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 4 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        Detecting non-normality
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 8px", maxWidth: 620 }}>
        Histograms are blocky and misleading in small samples. To definitively
        diagnose the distribution of your residuals, you need a Quantile-Quantile (Q-Q) plot.
      </p>

      <div className="lesson">
        <h2>How a Q-Q plot works</h2>
        <p>
          A Q-Q plot matches the quantiles of your actual residuals against the
          theoretical quantiles of a perfect normal distribution.
        </p>
        <ol style={{ paddingLeft: "1.4em", lineHeight: 1.85, color: "var(--muted)", fontSize: 15, marginBottom: "1.5rem" }}>
          <li>Sort your residuals from smallest to largest.</li>
          <li>For N points, calculate where the quantiles <em>should</em> be for a normal distribution.</li>
          <li>Plot the theoretical values on the x-axis, and your actual values on the y-axis.</li>
        </ol>
        <p>
          If your residuals are perfectly normal, the points will form a strict
          45-degree diagonal line. Deviations from that line tell a specific story.
        </p>

        <h2>Reading the deviations</h2>
        <div style={readGrid}>
          <DevCard title="S-Shape (Heavy tails)" 
            body="Points bend up on the right and down on the left. This means your extremes are more extreme than a normal curve allows. Common in finance (leptokurtic)." />
          <DevCard title="Inverted S (Light tails)" 
            body="Points flatten out at the ends. The distribution is truncated or has thinner tails than normal. Rarely a problem for inference." />
          <DevCard title="U-Shape (Skewed)" 
            body="Points curve entirely above the line (right skew) or below (left skew). The errors lean heavily in one direction." />
        </div>

        <h2>Formal testing: Shapiro-Wilk</h2>
        <p>
          The Shapiro-Wilk test is the most powerful formal test for normality.
          The null hypothesis is that the data is normally distributed. A p-value
          &lt; 0.05 rejects the null, concluding the residuals are non-normal.
        </p>
        <p>
          <strong>However:</strong> Do not use it blindly. In very large samples
          (N &gt; 1000), Shapiro-Wilk has so much power that it will flag
          microscopic, utterly harmless deviations from perfect normality as
          "statistically significant". But remember the Central Limit Theorem:
          in large samples, non-normality doesn't matter anyway!
        </p>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-fundamentals)", marginBottom: 4 }}>
            The golden rule of normality testing
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            When N is small (where normality matters), Shapiro-Wilk is weak and
            might fail to detect issues. When N is large (where normality doesn't
            matter), it is too sensitive and will trigger false alarms. Always
            rely on the Q-Q plot and your knowledge of the sample size over the
            p-value of a formal test.
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/linear-regression/outliers-leverage-influence" style={navLink}>← Outliers, leverage & influence</Link>
          <Link href="/learn/linear-regression/r-squared-and-adjusted" style={navLink}>Next up · R² and adjusted R² →</Link>
        </div>
      </div>
    </article>
  );
}

function DevCard({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ padding: "12px 14px", borderLeft: "3px solid var(--warn)", background: "color-mix(in srgb, var(--warn) 3%, var(--surface))", borderRadius: "0 8px 8px 0" }}>
      <div className="font-display" style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>{title}</div>
      <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", lineHeight: 1.55 }}>{body}</p>
    </div>
  );
}

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const readGrid: React.CSSProperties = { display: "grid", gap: 10, margin: "1.4rem 0" };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-fundamentals) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-fundamentals) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0 0" };
