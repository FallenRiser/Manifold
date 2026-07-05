import { TransformationLab } from "@/components/labs/TransformationLab";
import { MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { REGRESSION_SETUP } from "@/lib/runtimeSetup";
import { Backlinks } from "@/components/Backlinks";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

const codeScratch = `import numpy as np

rng = np.random.default_rng(7)
x = np.linspace(1, 6, 60)
y = 8 * np.exp(0.5*x) * rng.lognormal(sigma=0.1, size=60)   # multiplicative growth

def r2_fit(xx, yy):
    A = np.column_stack([np.ones_like(xx), xx])
    b, *_ = np.linalg.lstsq(A, yy, rcond=None)
    return 1 - np.sum((yy - A @ b)**2) / np.sum((yy - yy.mean())**2)

print(f"R^2 on raw y:    {r2_fit(x, y):.3f}")        # curved -> poor
print(f"R^2 on log(y):   {r2_fit(x, np.log(y)):.3f}")  # straight -> great`;

const codeLib = `import numpy as np
from scipy import stats

rng = np.random.default_rng(7)
x = np.linspace(1, 6, 60)
y = 8 * np.exp(0.5*x) * rng.lognormal(sigma=0.1, size=60)

# Box-Cox finds the power transform that makes y most normal/linear
y_trans, lam = stats.boxcox(y)
print(f"Box-Cox lambda: {lam:.3f}   (near 0 => a log transform is optimal)")`;

export const metadata = {
  title: "Transformations — Manifold",
  description:
    "When your data violates linearity or homoscedasticity, transforming the outcome or predictors is often the fastest, most reliable fix.",
};

export default function TransformationsPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }, { label: "Fixing", color: "var(--brand)" }]}
        time="about 5 minutes"
        title={<>Transformations</>}
        intro={<>
          You don't always have to switch to a complex non-linear model. Sometimes,
        you just need to look at your data through a different lens.
        </>}
      />

      <Backlinks label="Related" items={[
        { label: "Normality of residuals", href: "/learn/linear-regression/normality-of-residuals" },
        { label: "Homoscedasticity", href: "/learn/linear-regression/homoscedasticity" },
        { label: "Case B: house prices", href: "/learn/linear-regression/end-to-end-worked-case/house-prices" },
      ]} />

      <div className="lesson">
        <h2>The magic of logarithms</h2>
        <p>
          The natural logarithm (log) is the single most important transformation
          in regression. It performs three miracles simultaneously when applied
          to a right-skewed variable (like income, population, or prices):
        </p>
        <ol style={{ paddingLeft: "1.4em", lineHeight: 1.85, color: "var(--muted)", fontSize: 15 }}>
          <li><strong style={{ color: "var(--ink)" }}>It linearises exponential growth.</strong> If y grows by a percentage (compound interest, viral spread), log(y) grows linearly.</li>
          <li><strong style={{ color: "var(--ink)" }}>It stabilises variance.</strong> If heteroscedasticity is present (variance of y increases as x increases), logging y compresses the large values, pulling the fan shape into a straight band.</li>
          <li><strong style={{ color: "var(--ink)" }}>It normalises residuals.</strong> By pulling in the long right tail of the outcome, the residuals often become symmetric and normal.</li>
        </ol>

        <TransformationLab />

        <h2>Interpreting log transformations</h2>
        <p>
          When you transform variables, the interpretation of the coefficients
          changes. It shifts from absolute unit changes to <strong>percentage
          changes</strong> (elasticities).
        </p>

        <div style={{ display: "grid", gap: 12, margin: "1.4rem 0" }}>
          <InterpCard title="Level-Log (Predictor is logged)" formula="y = β₀ + β₁·log(x)"
            body="A 1% increase in x is associated with a (β₁ / 100) unit increase in y." color="var(--c-regression)" />
          <InterpCard title="Log-Level (Outcome is logged)" formula="log(y) = β₀ + β₁·x"
            body="A 1-unit increase in x is associated with a (100 × β₁)% increase in y." color="var(--brand)" />
          <InterpCard title="Log-Log (Both are logged)" formula="log(y) = β₀ + β₁·log(x)"
            body="A 1% increase in x is associated with a β₁% increase in y (this is pure elasticity)." color="var(--good)" />
        </div>

        <h2>The Box-Cox Transformation</h2>
        <p>
          What if log isn't quite right? What if you need a square root, or an
          inverse transformation? The <strong>Box-Cox transformation</strong>
          {" "}generalises all of them into a single mathematical family, governed
          by a parameter λ:
        </p>
        <MathBlock>{String.raw`y^{(\lambda)} = \frac{y^{\lambda} - 1}{\lambda}`}</MathBlock>
        <p>
          You let the computer test many values of λ to find the one that makes
          the residuals as perfectly normal as possible.
        </p>
        <ul style={{ paddingLeft: "1.4em", lineHeight: 1.85, color: "var(--muted)", fontSize: 15 }}>
          <li>If λ = 1: No transformation.</li>
          <li>If λ = 0.5: Square root transformation (good for count data like Poisson).</li>
          <li>If λ = 0: It exactly equals the natural logarithm.</li>
          <li>If λ = -1: Inverse transformation (1/y) (good for rates, like converting hours to speed).</li>
        </ul>

        <Callout color="var(--c-fundamentals)" title={<>The catch with transforming y</>}>
          When you transform the outcome (e.g., predicting log(y)), your model
            is minimising the squared errors of the <em>logarithms</em>, not the
            raw values. When you exponentiate the predictions to get back to the
            original scale, you are predicting the <strong>median</strong>, not
            the <strong>mean</strong>. To get the true mean, you must apply
            Duan's smearing estimator (a correction factor).
        </Callout>

        <h2>Compute it yourself</h2>
        <p>
          Fitting raw exponential data gives a poor R²; logging it first makes the
          relationship linear. SciPy&rsquo;s Box-Cox even picks the optimal power for you.
        </p>
        <CodeBlock setup={REGRESSION_SETUP} fromScratch={codeScratch} withLibrary={codeLib} />

        <PrevNext prev={{ href: "/learn/linear-regression/cross-validation-bias-variance", label: <>← Cross-validation & bias–variance</> }} next={{ href: "/learn/linear-regression/weighted-least-squares", label: <>Next up · Weighted least squares →</> }} />
      </div>
    </article>
  );
}

function InterpCard({ title, formula, body, color }: { title: string; formula: string; body: string; color: string }) {
  return (
    <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span className="font-display" style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{title}</span>
        <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 13, color }}>{formula}</span>
      </div>
      <p style={{ margin: 0, fontSize: 13.5, color: "var(--muted)", lineHeight: 1.6 }}>{body}</p>
    </div>
  );
}



