import Link from "next/link";
import { IntervalsLab } from "@/components/labs/IntervalsLab";
import { CodeBlock } from "@/components/CodeBlock";
import { Backlinks } from "@/components/Backlinks";

const codeScratch = `import numpy as np
from scipy import stats

rng = np.random.default_rng(11)
x = np.linspace(0, 10, 50)
y = 2 + 1.5*x + rng.normal(scale=2, size=50)
X = np.column_stack([np.ones_like(x), x]); n, k = X.shape

XtX_inv = np.linalg.inv(X.T @ X)
beta = XtX_inv @ X.T @ y
s2 = np.sum((y - X @ beta)**2) / (n - k)

x0 = np.array([1, 7.0])                 # predict at x = 7
yhat = x0 @ beta
lev  = x0 @ XtX_inv @ x0
tcrit = stats.t.ppf(0.975, n - k)
ci = tcrit * np.sqrt(s2 * lev)          # interval for the MEAN response
pi = tcrit * np.sqrt(s2 * (1 + lev))    # interval for ONE new observation

print(f"point estimate: {yhat:.2f}")
print(f"95% CI (mean):  +/- {ci:.2f}")
print(f"95% PI (new y): +/- {pi:.2f}   <- wider, includes the +1")`;

const codeLib = `import numpy as np
import statsmodels.api as sm

rng = np.random.default_rng(11)
x = np.linspace(0, 10, 50)
y = 2 + 1.5*x + rng.normal(scale=2, size=50)

model = sm.OLS(y, sm.add_constant(x)).fit()
pred = model.get_prediction([1, 7.0]).summary_frame(alpha=0.05)
print(pred[["mean", "mean_ci_lower", "mean_ci_upper",
            "obs_ci_lower", "obs_ci_upper"]].round(2).to_string())`;

export const metadata = {
  title: "Prediction intervals — Manifold",
  description:
    "A confidence interval bounds the mean. A prediction interval bounds a single new observation. Understanding the difference is critical for real-world ML.",
};

export default function PredictionIntervalsPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-regression)")}>Regression</span>
        <span style={chip("var(--brand)")}>Inference</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 5 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        Prediction intervals
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 8px", maxWidth: 620 }}>
        When someone asks "What will this house sell for?", giving them a
        Confidence Interval is answering the wrong question. You need a Prediction
        Interval.
      </p>

      <Backlinks label="Related" items={[
        { label: "Confidence intervals", href: "/learn/linear-regression/confidence-intervals" },
        { label: "Hypothesis tests & p-values", href: "/learn/linear-regression/hypothesis-tests-and-p-values" },
        { label: "Case C: medical costs", href: "/learn/linear-regression/end-to-end-worked-case/medical-costs" },
      ]} />

      <div className="lesson">
        <h2>The two types of uncertainty</h2>
        <p>
          When you make a prediction with linear regression, there are two completely
          different sources of error playing at the same time:
        </p>
        <ol style={{ paddingLeft: "1.4em", lineHeight: 1.85, color: "var(--muted)", fontSize: 15 }}>
          <li><strong style={{ color: "var(--ink)" }}>Epistemic uncertainty (The Line):</strong> Are our coefficients correct? We only have a sample, so the true regression line might be slightly steeper or flatter than we think.</li>
          <li><strong style={{ color: "var(--ink)" }}>Aleatoric uncertainty (The Noise):</strong> Even if we had the perfect, true regression line, individual houses don't fall perfectly on it. There is irreducible random noise (ε) in the universe.</li>
        </ol>

        <h2>Confidence vs Prediction</h2>
        <div style={grid2}>
          <IntervalCard title="Confidence Interval (CI)" color="var(--brand)"
            body="Bounds the average (the mean). It asks: 'Where is the true regression line?' It only accounts for Epistemic uncertainty." />
          <IntervalCard title="Prediction Interval (PI)" color="var(--c-fundamentals)"
            body="Bounds a specific new observation. It asks: 'Where will this one specific house fall?' It must account for BOTH Epistemic and Aleatoric uncertainty." />
        </div>

        <p>
          Because the Prediction Interval must include the irreducible noise (ε),
          <strong> a PI is always wider than a CI.</strong>
        </p>

        <h2>Watch the difference as N grows</h2>
        <p>
          The most striking difference happens when you collect more data. 
          As your sample size (N) goes to infinity, your Epistemic uncertainty drops
          to zero (you know exactly where the true line is). But the Aleatoric
          noise never goes away.
        </p>
        <p>
          Turn on both intervals below and drag the Sample Size slider to the right.
        </p>

        <IntervalsLab />

        <h2>The bowtie shape</h2>
        <p>
          Did you notice how the Confidence Interval is narrowest in the middle,
          and flares out at the edges like a bowtie?
        </p>
        <p>
          This is because the regression line always pivots around the 
          <strong> center of mass</strong> (the mean of x, and mean of y). We are 
          most confident about predictions near the average data point. As you move
          to extreme x-values (high leverage), any slight error in the slope
          coefficient gets magnified, so the uncertainty blows up.
        </p>

        <h2>Why normality is suddenly critical</h2>
        <p>
          In the previous chapters, we learned that because of the Central Limit
          Theorem, OLS doesn't actually care if residuals are normal for large
          sample sizes — the coefficients will be normal anyway, so Confidence
          Intervals remain valid.
        </p>
        <p>
          <strong>This is NOT true for Prediction Intervals.</strong>
        </p>
        <p>
          A prediction interval bounds a single raw observation, which means it
          bounds a single raw error term (ε). The Central Limit Theorem does not
          apply to single points. If your residuals are heavily skewed, your
          calculated 95% Prediction Interval will be completely wrong, no matter
          how much data you have.
        </p>

        <h2>Compute both intervals yourself</h2>
        <p>
          The only difference is a <code>+1</code> under the square root: the prediction
          interval carries the extra noise of a single new observation. statsmodels
          returns both as <code>mean_ci</code> and <code>obs_ci</code>.
        </p>
        <CodeBlock fromScratch={codeScratch} withLibrary={codeLib} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/linear-regression/hypothesis-tests-and-p-values" style={navLink}>← Hypothesis tests & p-values</Link>
          <Link href="/learn/linear-regression/when-to-use-it" style={navLink}>Next up · When to use it →</Link>
        </div>
      </div>
    </article>
  );
}

function IntervalCard({ title, body, color }: { title: string; body: string; color: string }) {
  return (
    <div style={{ padding: "14px 16px", borderTop: `3px solid ${color}`, background: "var(--surface-2)", borderRadius: "0 0 12px 12px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
      <div className="font-display" style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>{title}</div>
      <p style={{ margin: 0, fontSize: 13.5, color: "var(--muted)", lineHeight: 1.6 }}>{body}</p>
    </div>
  );
}

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const grid2: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, margin: "1.4rem 0" };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
