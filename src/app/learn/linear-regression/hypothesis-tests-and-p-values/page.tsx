import { HypothesisTestLab } from "@/components/labs/HypothesisTestLab";
import { MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { REGRESSION_SETUP } from "@/lib/runtimeSetup";
import { Backlinks } from "@/components/Backlinks";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

const codeScratch = `import numpy as np
from scipy import stats

rng = np.random.default_rng(10)
x = np.linspace(0, 10, 40)
y = 2 + 1.5*x + rng.normal(scale=2, size=40)
X = np.column_stack([np.ones_like(x), x]); n, k = X.shape

XtX_inv = np.linalg.inv(X.T @ X)
beta = XtX_inv @ X.T @ y
resid = y - X @ beta
sigma2 = np.sum(resid**2) / (n - k)
se = np.sqrt(np.diag(sigma2 * XtX_inv))

t = beta[1] / se[1]                          # signal-to-noise of the slope
p = 2 * (1 - stats.t.cdf(abs(t), n - k))     # two-sided p-value
print(f"slope t = {t:.2f}   p = {p:.2e}")`;

const codeLib = `import numpy as np
import statsmodels.api as sm

rng = np.random.default_rng(10)
x = np.linspace(0, 10, 40)
y = 2 + 1.5*x + rng.normal(scale=2, size=40)

model = sm.OLS(y, sm.add_constant(x)).fit()
print(f"slope t = {model.tvalues[1]:.2f}   p = {model.pvalues[1]:.2e}")`;

export const metadata = {
  title: "Hypothesis tests & p-values — Manifold",
  description:
    "The p-value is the most abused metric in all of science. Learn what the null hypothesis actually is, and how the t-statistic converts into a p-value.",
};

export default function HypothesisTestsPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }, { label: "Inference", color: "var(--brand)" }]}
        time="about 6 minutes"
        title={<>Hypothesis tests &amp; p-values</>}
        intro={<>
          Every time you run a regression, the software spits out a column of
        p-values. They determine what gets published and what gets ignored. What
        are they actually doing?
        </>}
      />

      <Backlinks label="Related" items={[
        { label: "Confidence intervals", href: "/learn/linear-regression/confidence-intervals" },
        { label: "Prediction intervals", href: "/learn/linear-regression/prediction-intervals" },
        { label: "R² and adjusted R²", href: "/learn/linear-regression/r-squared-and-adjusted" },
      ]} />

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
        <MathBlock>{String.raw`t = \frac{\hat\beta_j}{\mathrm{SE}(\hat\beta_j)}`}</MathBlock>
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
        
        <Callout color="var(--bad)" title={<>The strict definition</>}>
          "Assuming the null hypothesis is true (the feature has zero effect),
            the p-value is the probability of seeing a coefficient as extreme as
            yours, or more extreme, purely by random chance."
        </Callout>

        <p>
          If your p-value is <strong>0.01</strong>, it means: "If this feature
          was truly useless, I would only see a result this big 1% of the time.
          Therefore, I reject the idea that it's useless."
        </p>

        <HypothesisTestLab />

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

        <h2>Compute it yourself</h2>
        <p>
          The t-statistic is coefficient over standard error; the p-value is its tail
          probability. From scratch with SciPy&rsquo;s t-distribution, then straight off the
          statsmodels fit.
        </p>
        <CodeBlock setup={REGRESSION_SETUP} fromScratch={codeScratch} withLibrary={codeLib} />

        <PrevNext prev={{ href: "/learn/linear-regression/confidence-intervals", label: <>← Confidence intervals</> }} next={{ href: "/learn/linear-regression/prediction-intervals", label: <>Next up · Prediction intervals →</> }} />
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



