import Link from "next/link";

export const metadata = {
  title: "Independence of errors — Manifold",
  description:
    "The independence assumption requires that residuals don't correlate with each other. Autocorrelation inflates significance and breaks inference.",
};

export default function IndependenceOfErrorsPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-regression)")}>Regression</span>
        <span style={chip("var(--warn)")}>Assumptions</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 6 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        Independence of errors
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 8px", maxWidth: 620 }}>
        The model assumes each observation's error is its own — unrelated to any
        other error. When observations share some hidden structure, this breaks,
        and your p-values become far too optimistic.
      </p>

      <div className="lesson">
        <h2>What it says</h2>
        <p>
          Formally: <code>Cov(εᵢ, εⱼ) = 0</code> for all i ≠ j. Each
          residual is generated independently. This assumption is violated
          whenever observations are grouped, ordered in time, or spatially
          clustered.
        </p>

        <div style={scenarioGrid}>
          <ScenarioCard icon="📈" title="Time series" color="var(--brand)"
            body="Yesterday's error predicts today's — stock prices, temperature, sales. The Durbin-Watson test detects this." />
          <ScenarioCard icon="🏫" title="Hierarchical data" color="var(--c-fundamentals)"
            body="Students in the same class share a teacher effect. Employees in the same company share culture. Errors within groups correlate." />
          <ScenarioCard icon="🗺️" title="Spatial data" color="var(--good)"
            body="Nearby locations share common influences. House prices on the same street are correlated beyond what the model captures." />
          <ScenarioCard icon="🔁" title="Repeated measures" color="var(--c-regression)"
            body="Multiple measurements on the same subject across time or conditions. Within-subject errors correlate strongly." />
        </div>

        <h2>Why it matters</h2>
        <p>
          The standard errors in ordinary least squares assume all observations
          contribute independent information. When they don't, the effective
          sample size is smaller than it looks — you have fewer independent data
          points. OLS doesn't know this. It reports standard errors as if you
          had full independence, making them <em>too small</em>. Your{" "}
          <em>t</em>-statistics are inflated, your p-values are too small, and
          you'll declare effects significant that aren't.
        </p>

        <h2>How to detect it</h2>
        <ul style={{ paddingLeft: "1.4em", lineHeight: 1.85, color: "var(--muted)", fontSize: 15 }}>
          <li>
            <strong style={{ color: "var(--ink)" }}>Plot residuals in order.</strong>{" "}
            For time-series data, plot residuals vs time. Patterns or runs of same-sign residuals signal autocorrelation.
          </li>
          <li>
            <strong style={{ color: "var(--ink)" }}>Durbin-Watson statistic.</strong>{" "}
            Values near 2 suggest independence. Values near 0 indicate positive autocorrelation; near 4, negative.
          </li>
          <li>
            <strong style={{ color: "var(--ink)" }}>Autocorrelation function (ACF) plot.</strong>{" "}
            Bar chart of correlations between residuals separated by 1, 2, 3… steps. Bars outside the confidence band indicate autocorrelation.
          </li>
        </ul>

        <h2>How to fix it</h2>
        <div style={fixGrid}>
          <FixCard title="Clustered standard errors" body="Compute standard errors that account for within-group correlation. Widely used in panel data and econometrics. Easy to implement in most software." color="var(--brand)" />
          <FixCard title="Mixed-effects models" body="Explicitly model the group structure with random effects. Estimates a variance component for the group-level errors." color="var(--good)" />
          <FixCard title="Add lag features" body="For time series, add lagged values of y (e.g., y at t-1) as features. This absorbs the autocorrelation into the model." color="var(--c-fundamentals)" />
          <FixCard title="ARIMA / state-space models" body="For pure time-series problems, use models designed for autocorrelated data rather than patching OLS." color="var(--c-regression)" />
        </div>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-fundamentals)", marginBottom: 4 }}>
            Cross-sectional vs time-series data
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            For a random sample of independent individuals, independence is
            usually safe to assume. The assumption bites hardest in time-series
            data, panel data (many individuals measured repeatedly), and spatial
            analyses. When in doubt: plot your residuals in the order they were
            collected.
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/linear-regression/linearity" style={navLink}>← Linearity</Link>
          <Link href="/learn/linear-regression/homoscedasticity" style={navLink}>Next up · Homoscedasticity →</Link>
        </div>
      </div>
    </article>
  );
}

function ScenarioCard({ icon, title, color, body }: { icon: string; title: string; color: string; body: string }) {
  return (
    <div style={{ background: `color-mix(in srgb, ${color} 5%, var(--surface-2))`, border: `1px solid color-mix(in srgb, ${color} 18%, var(--border))`, borderRadius: 14, padding: "12px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span className="font-display" style={{ fontSize: 13.5, fontWeight: 600, color }}>{title}</span>
      </div>
      <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>{body}</p>
    </div>
  );
}

function FixCard({ title, body, color }: { title: string; body: string; color: string }) {
  return (
    <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "11px 13px" }}>
      <div style={{ width: 4, height: 4, borderRadius: "50%", background: color, display: "inline-block", marginRight: 6, verticalAlign: "middle" }} />
      <span className="font-display" style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{title}</span>
      <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>{body}</p>
    </div>
  );
}

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const scenarioGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, margin: "1.4rem 0" };
const fixGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10, margin: "1.4rem 0" };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-fundamentals) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-fundamentals) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0 0" };
