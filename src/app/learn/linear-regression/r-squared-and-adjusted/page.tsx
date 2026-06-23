import Link from "next/link";
import { RSquaredLab } from "@/components/labs/RSquaredLab";
import { MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { Backlinks } from "@/components/Backlinks";

const codeScratch = `import numpy as np

y     = np.array([15,17,19,23,27,31,32,34,37,41,42,45], dtype=float)
y_hat = np.array([14.5,17.8,19.2,22.6,27.5,30.4,32.9,34.1,36.8,40.5,42.7,44.9])
n, p = len(y), 1                       # p = number of predictors

ss_res = np.sum((y - y_hat)**2)        # residual sum of squares
ss_tot = np.sum((y - y.mean())**2)     # total sum of squares  (the baseline)
r2  = 1 - ss_res / ss_tot
adj = 1 - (1 - r2) * (n - 1) / (n - p - 1)

print(f"R squared:    {r2:.4f}")
print(f"adjusted R^2: {adj:.4f}")`;

const codeLib = `import numpy as np
from sklearn.metrics import r2_score

y     = np.array([15,17,19,23,27,31,32,34,37,41,42,45], dtype=float)
y_hat = np.array([14.5,17.8,19.2,22.6,27.5,30.4,32.9,34.1,36.8,40.5,42.7,44.9])

r2 = r2_score(y, y_hat)                 # sklearn gives R^2 directly
n, p = len(y), 1
adj = 1 - (1 - r2) * (n - 1) / (n - p - 1)   # no built-in helper for adjusted

print(f"R squared:    {r2:.4f}")
print(f"adjusted R^2: {adj:.4f}")`;

export const metadata = {
  title: "R² and adjusted R² — Manifold",
  description:
    "R² tells you how much variance your model explains. But if you just keep adding features, R² will always go up. Adjusted R² fixes the cheating.",
};

export default function RSquaredAndAdjustedPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-regression)")}>Regression</span>
        <span style={chip("var(--good)")}>Evaluation</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 5 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        R² and adjusted R²
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 8px", maxWidth: 620 }}>
        The most famous metric in regression. It's beautiful because it's
        interpretable: a percentage from 0 to 100%. But it harbors a dangerous
        flaw that encourages you to overfit.
      </p>

      <Backlinks label="Related" items={[
        { label: "RMSE vs MAE", href: "/learn/linear-regression/rmse-vs-mae" },
        { label: "Cross-validation", href: "/learn/linear-regression/cross-validation-bias-variance" },
        { label: "Hypothesis tests & p-values", href: "/learn/linear-regression/hypothesis-tests-and-p-values" },
      ]} />

      <div className="lesson">
        <h2>The baseline model</h2>
        <p>
          Imagine you have to predict house prices, but you aren't allowed to
          look at any features — no square footage, no location, nothing. Your
          best possible prediction is just the <strong>mean</strong> of all house
          prices in your dataset.
        </p>
        <p>
          This baseline model has an error. We call the sum of its squared
          errors the <strong>Total Sum of Squares (SST)</strong>. It represents
          the total variance in the outcome variable.
        </p>

        <h2>The R² formula</h2>
        <p>
          Now you build a linear regression model. It also makes errors. We call
          the sum of its squared errors the <strong>Residual Sum of Squares
          (SSR)</strong>.
        </p>
        <p>
          R² asks a simple question: <em>How much did we improve over the mean?</em>
        </p>
        <MathBlock>{String.raw`R^2 = 1 - \frac{\mathrm{SSR}}{\mathrm{SST}}`}</MathBlock>
        <p>
          If your model is perfect (SSR = 0), then R² = 1.0 (100%). If your model
          is exactly as good as just guessing the mean (SSR = SST), then R² = 0.
        </p>

        <div style={cardGrid}>
          <MetricCard title="What a good R² looks like" 
            body="In physics and engineering, you often expect R² > 0.95. In psychology and social sciences, predicting human behavior is noisy; an R² of 0.20 might be considered a breakthrough. Context is everything." 
            color="var(--good)" />
          <MetricCard title="Can R² be negative?" 
            body="Yes! If you fit a model that is somehow strictly worse than just predicting the mean (usually because you forced the line through the origin, or you're evaluating on a test set), SSR can be larger than SST." 
            color="var(--bad)" />
        </div>

        <h2>The fatal flaw of R²</h2>
        <p>
          Suppose you are predicting house prices using Square Footage. You get
          an R² of 0.60. Now you add a completely random, useless feature — let's
          say, the number of clouds in the sky on the day the house sold.
        </p>
        <p>
          Because OLS minimizes SSR, it will use that random noise to fit the
          training data just a tiny bit tighter. <strong>Every time you add a
          feature, R² will stay the same or go up. It will never go down.</strong>
        </p>
        <p>
          If you have 100 data points and you add 100 random features, your R²
          will hit a perfect 1.0. You haven't found the truth; you've just
          memorized the noise.
        </p>

        <h2>Adjusted R²: The penalty for complexity</h2>
        <p>
          To compare models with different numbers of features, we need a metric
          that penalizes useless complexity. Enter Adjusted R²:
        </p>
        <MathBlock>{String.raw`R^2_{\text{adj}} = 1 - \frac{(1 - R^2)\,(N - 1)}{N - p - 1}`}</MathBlock>
        <p style={{ fontSize: 14.5, color: "var(--muted)" }}>
          <em>Where N is the sample size and p is the number of predictors.</em>
        </p>
        
        <ul style={{ paddingLeft: "1.4em", lineHeight: 1.85, color: "var(--muted)", fontSize: 15 }}>
          <li>If you add a useful feature, R² goes up enough to overcome the penalty, and Adjusted R² increases.</li>
          <li>If you add a useless feature, R² goes up by a microscopic amount, the penalty kicks in, and <strong>Adjusted R² decreases</strong>.</li>
        </ul>

        <RSquaredLab />

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-fundamentals)", marginBottom: 4 }}>
            When to use which
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            Use <strong>R²</strong> when explaining how much of the variance a
            single, fixed model captures. Use <strong>Adjusted R²</strong> when
            comparing two models to decide if a new feature is worth keeping.
          </p>
        </div>

        <h2>Compute it yourself</h2>
        <p>
          R² is one subtraction once you have the two sums of squares; adjusted R²
          just adds the complexity penalty. From scratch, then with scikit-learn:
        </p>
        <CodeBlock fromScratch={codeScratch} withLibrary={codeLib} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/linear-regression/detecting-non-normality" style={navLink}>← Detecting non-normality</Link>
          <Link href="/learn/linear-regression/rmse-vs-mae" style={navLink}>Next up · RMSE vs MAE →</Link>
        </div>
      </div>
    </article>
  );
}

function MetricCard({ title, body, color }: { title: string; body: string; color: string }) {
  return (
    <div style={{ background: "var(--surface-2)", borderTop: `3px solid ${color}`, borderRadius: "0 0 12px 12px", padding: "14px 16px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
      <div className="font-display" style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>{title}</div>
      <p style={{ margin: 0, fontSize: 13.5, color: "var(--muted)", lineHeight: 1.6 }}>{body}</p>
    </div>
  );
}

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}const cardGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, margin: "1.4rem 0" };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-fundamentals) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-fundamentals) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0 0" };
