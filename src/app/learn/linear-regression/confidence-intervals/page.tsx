import Link from "next/link";
import { ConfidenceIntervalLab } from "@/components/labs/ConfidenceIntervalLab";
import { MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { Backlinks } from "@/components/Backlinks";

const codeScratch = `import numpy as np
from scipy import stats

rng = np.random.default_rng(9)
x = np.linspace(0, 10, 40)
y = 2 + 1.5*x + rng.normal(scale=2, size=40)
X = np.column_stack([np.ones_like(x), x]); n, k = X.shape

XtX_inv = np.linalg.inv(X.T @ X)
beta = XtX_inv @ X.T @ y
resid = y - X @ beta
sigma2 = np.sum(resid**2) / (n - k)
se = np.sqrt(np.diag(sigma2 * XtX_inv))      # standard error of each coefficient

tcrit = stats.t.ppf(0.975, n - k)            # ~1.96 for large n
lo, hi = beta[1] - tcrit*se[1], beta[1] + tcrit*se[1]
print(f"slope {beta[1]:.3f}   95% CI [{lo:.3f}, {hi:.3f}]")`;

const codeLib = `import numpy as np
import statsmodels.api as sm

rng = np.random.default_rng(9)
x = np.linspace(0, 10, 40)
y = 2 + 1.5*x + rng.normal(scale=2, size=40)

model = sm.OLS(y, sm.add_constant(x)).fit()
lo, hi = model.conf_int(alpha=0.05)[1]       # 95% interval for the slope
print(f"slope {model.params[1]:.3f}   95% CI [{lo:.3f}, {hi:.3f}]")`;

export const metadata = {
  title: "Confidence intervals — Manifold",
  description:
    "A point estimate without a confidence interval is just a guess. Learn what a 95% confidence interval actually means (and what it doesn't).",
};

export default function ConfidenceIntervalsPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-regression)")}>Regression</span>
        <span style={chip("var(--brand)")}>Inference</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 5 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        Confidence intervals
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 8px", maxWidth: 620 }}>
        Your model outputs a coefficient: <code>4.2</code>. That is the single
        most likely value based on your sample. But the true population value
        could easily be 4.1, or 4.9. Or -1.2.
      </p>

      <Backlinks label="Related" items={[
        { label: "Hypothesis tests & p-values", href: "/learn/linear-regression/hypothesis-tests-and-p-values" },
        { label: "Prediction intervals", href: "/learn/linear-regression/prediction-intervals" },
        { label: "Case C: medical costs", href: "/learn/linear-regression/end-to-end-worked-case/medical-costs" },
      ]} />

      <div className="lesson">
        <h2>Uncertainty in sampling</h2>
        <p>
          Unless you have collected data on every single entity in the universe,
          your data is just a <strong>sample</strong>. If you took a different
          sample tomorrow, you would get a slightly different coefficient.
          Therefore, reporting just the point estimate (the exact coefficient)
          is overconfident. We need a range.
        </p>

        <h2>The formula</h2>
        <p>
          A confidence interval (CI) defines a range of plausible values for the
          true population parameter. It is built using the standard error (SE)
          of the coefficient:
        </p>
        <MathBlock>{String.raw`\text{CI} = \hat\beta \;\pm\; t_{\alpha/2}\,\cdot\,\mathrm{SE}(\hat\beta)`}</MathBlock>
        <p>
          For a 95% confidence level, the critical value (from the t-distribution)
          is usually roughly <strong>1.96</strong> (or just 2 for a quick mental
          math approximation).
        </p>

        <div style={grid2}>
          <DetailCard title="What makes it wider?" color="var(--warn)" 
            body="Fewer data points, more noise in the data (high MSE), or high multicollinearity among features. All of these increase the Standard Error." />
          <DetailCard title="What makes it narrower?" color="var(--good)" 
            body="More data points (N). As N grows, the standard error shrinks toward zero, and the confidence interval tightens around the true parameter." />
        </div>

        <ConfidenceIntervalLab />

        <h2>The great interpretation trap</h2>
        <p>
          Here is what almost everyone thinks a 95% confidence interval means:
          <em>"There is a 95% chance that the true parameter lies between these
          two numbers."</em>
        </p>
        <p>
          <strong>This is strictly false in frequentist statistics.</strong>
        </p>
        <p>
          The true parameter is a fixed, physical fact of the universe. It is
          not a random variable. It either is in your specific interval (100%
          chance), or it isn't (0% chance). You just don't know which.
        </p>
        
        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-fundamentals)", marginBottom: 4 }}>
            The correct interpretation
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            "If we were to repeat this exact experiment 100 times, collecting
            100 different random samples and computing 100 different confidence
            intervals, exactly 95 of those intervals would contain the true
            population parameter."
          </p>
        </div>
        <p>
          The 95% describes the <strong>reliability of the procedure</strong>
          , not the probability of your specific interval. (If you want the
          first, intuitive definition, you need Bayesian Credible Intervals).
        </p>

        <h2>Why zero matters</h2>
        <p>
          When you look at a confidence interval for a coefficient, the most
          important question is: <strong>Does it cross zero?</strong>
        </p>
        <ul style={{ paddingLeft: "1.4em", lineHeight: 1.85, color: "var(--muted)", fontSize: 15 }}>
          <li>If the CI is <code>[2.1, 6.4]</code>, we are confident the effect is positive.</li>
          <li>If the CI is <code>[-5.2, -1.1]</code>, we are confident the effect is negative.</li>
          <li>If the CI is <code>[-1.5, 3.2]</code>, the effect crosses zero. The true effect might be positive, might be negative, or might be exactly zero. The feature is not statistically significant.</li>
        </ul>

        <h2>Compute it yourself</h2>
        <p>
          A CI is the estimate plus-or-minus a t-multiple of its standard error.
          From scratch that&rsquo;s the coefficient covariance; statsmodels hands it back
          with <code>conf_int()</code>.
        </p>
        <CodeBlock fromScratch={codeScratch} withLibrary={codeLib} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/linear-regression/bias-variance-revisited" style={navLink}>← Bias-variance, revisited</Link>
          <Link href="/learn/linear-regression/hypothesis-tests-and-p-values" style={navLink}>Next up · Hypothesis tests & p-values →</Link>
        </div>
      </div>
    </article>
  );
}

function DetailCard({ title, body, color }: { title: string; body: string; color: string }) {
  return (
    <div style={{ padding: "14px 16px", borderTop: `3px solid ${color}`, background: "var(--surface-2)", borderRadius: "0 0 12px 12px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
      <div className="font-display" style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>{title}</div>
      <p style={{ margin: 0, fontSize: 13.5, color: "var(--muted)", lineHeight: 1.6 }}>{body}</p>
    </div>
  );
}

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}const grid2: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, margin: "1.4rem 0" };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-fundamentals) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-fundamentals) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0 0" };
