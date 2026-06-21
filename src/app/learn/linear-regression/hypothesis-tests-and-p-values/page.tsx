import Link from "next/link";

export const metadata = {
  title: "Hypothesis tests & p-values — Manifold",
  description:
    "The p-value is the most abused metric in all of science. Learn what the null hypothesis actually is, and how the t-statistic converts into a p-value.",
};

export default function HypothesisTestsPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-regression)")}>Regression</span>
        <span style={chip("var(--brand)")}>Inference</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 6 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        Hypothesis tests &amp; p-values
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 8px", maxWidth: 620 }}>
        Every time you run a regression, the software spits out a column of
        p-values. They determine what gets published and what gets ignored. What
        are they actually doing?
      </p>

      <div className="lesson">
        <h2>The Null Hypothesis (H₀)</h2>
        <p>
          Science operates on skepticism. Before we believe that your feature
          actually affects the outcome, we assume the opposite: <strong>that it
          has absolutely zero effect</strong>. This is the null hypothesis.
        </p>
        <p>
          <code>H₀: β₁ = 0</code>
        </p>
        <p>
          The burden of proof is on your data. You must provide enough evidence
          to reject the null hypothesis.
        </p>

        <h2>The t-statistic (Signal to Noise)</h2>
        <p>
          To judge the evidence, we calculate the <em>t</em>-statistic for each
          coefficient. It is incredibly simple:
        </p>
        <div style={mathBlock}>t = Coefficient / Standard Error</div>
        <p>
          It's a pure signal-to-noise ratio. The coefficient is the signal
          (how big is the effect?). The standard error is the noise (how
          uncertain are we?). 
        </p>
        <ul style={{ paddingLeft: "1.4em", lineHeight: 1.85, color: "var(--muted)", fontSize: 15 }}>
          <li>A <code>t</code> near 0 means the signal is drowned out by noise.</li>
          <li>A <code>t</code> of 2 (or -2) means the signal is twice as large as the noise. This is usually the threshold for "significance".</li>
        </ul>

        <h2>The p-value</h2>
        <p>
          The <em>t</em>-statistic gets converted into a probability: the p-value.
        </p>
        
        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--bad)", marginBottom: 4 }}>
            The strict definition
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            "Assuming the null hypothesis is true (the feature has zero effect),
            the p-value is the probability of seeing a coefficient as extreme as
            yours, or more extreme, purely by random chance."
          </p>
        </div>

        <p>
          If your p-value is <strong>0.01</strong>, it means: "If this feature
          was truly useless, I would only see a result this big 1% of the time.
          Therefore, I reject the idea that it's useless."
        </p>

        <h2>Two massive misunderstandings</h2>
        <div style={{ display: "grid", gap: 12, margin: "1.4rem 0" }}>
          <MisconceptionCard 
            myth="A p-value of 0.05 means there is a 5% chance my result is a fluke." 
            truth="False. It assumes the null is 100% true, and calculates the probability of the data. It does not calculate the probability that the null is true. (Again, you need Bayes for that)." />
          <MisconceptionCard 
            myth="A tiny p-value (e.g. 0.0001) means the effect is huge and highly important." 
            truth="False. A tiny p-value only means we are very confident the effect is not exactly zero. With 1 million rows of data, a feature that increases house prices by $0.05 will have a p-value of 0.0001. Statistically significant does not mean practically significant." />
        </div>

        <h2>The F-test (The overall model)</h2>
        <p>
          While t-tests check individual features, the <strong>F-test</strong>
          {" "}checks the entire model at once. Its null hypothesis is that
          <em> all</em> coefficients (except the intercept) are exactly zero.
        </p>
        <p>
          If your model has 50 features, by pure random chance, a couple of them
          might get p-values under 0.05. The F-test protects against this. If the
          overall F-test is not significant, you should ignore all the individual
          t-tests.
        </p>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/linear-regression/confidence-intervals" style={navLink}>← Confidence intervals</Link>
          <Link href="/learn/linear-regression/prediction-intervals" style={navLink}>Next up · Prediction intervals →</Link>
        </div>
      </div>
    </article>
  );
}

function MisconceptionCard({ myth, truth }: { myth: string; truth: string }) {
  return (
    <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px" }}>
      <div style={{ fontSize: 13.5, color: "var(--warn)", fontWeight: 600, marginBottom: 4 }}>Myth: {myth}</div>
      <div style={{ fontSize: 13.5, color: "var(--ink)", lineHeight: 1.6 }}><strong style={{ color: "var(--good)" }}>Truth:</strong> {truth}</div>
    </div>
  );
}

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const mathBlock: React.CSSProperties = { fontFamily: "ui-monospace, monospace", fontSize: 15, background: "var(--canvas)", border: "1px solid var(--border-strong)", borderRadius: 10, padding: "12px 18px", margin: "0.8rem 0 1.2rem", color: "var(--ink)", textAlign: "center" };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--bad) 6%, var(--surface))", border: "1px solid color-mix(in srgb, var(--bad) 20%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0 0" };
