import Link from "next/link";
import { M } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "Standardize first — Manifold",
  description:
    "Regularization penalizes coefficient size, and a coefficient's size depends on its feature's scale. Without standardizing, the penalty falls unfairly on small-scale features — so scaling isn't optional, it's part of the model.",
};

export default function StandardizePage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-regression)")}>Regression</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 6 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        Standardize first
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        This is the one step you can never skip with penalized regression. Plain OLS is immune to feature
        scale; the moment you add a penalty, scale changes the answer — so standardizing is part of the model,
        not a nicety.
      </p>

      <div className="lesson">
        <h2>Why scale suddenly matters</h2>
        <p>
          Ordinary least squares is <strong>scale-equivariant</strong>: measure a feature in metres or
          millimetres and its coefficient just rescales to compensate — predictions are identical. The penalty
          breaks that. Ridge and Lasso penalise the <em>size</em> of each coefficient, and a coefficient&rsquo;s size
          depends on its feature&rsquo;s units. A feature measured in small units needs a large coefficient to have
          any effect, and that large coefficient gets punished harder — purely because of the units.
        </p>
        <p>
          So an unscaled penalized model effectively decides which features to shrink based on their{" "}
          <strong>arbitrary units</strong>, not their importance. Income in dollars (coefficients ~0.00001)
          would be barely penalised; the same income in thousands of dollars (coefficients ~0.01) would be
          penalised a thousand times more. That&rsquo;s nonsense — and it silently corrupts the fit.
        </p>

        <h2>The fix: standardize every feature</h2>
        <p>
          Put all features on a common scale before fitting. Subtract each feature&rsquo;s mean and divide by its
          standard deviation:
        </p>
        <div style={{ textAlign: "center", margin: "0.3rem 0 1rem" }}>
          <M>{String.raw`x' = \frac{x - \mu}{\sigma}`}</M>
        </div>
        <p>
          Now every feature has unit variance, so a unit of coefficient means the same thing everywhere and the
          penalty falls <strong>fairly</strong> — proportional to a feature&rsquo;s actual contribution, not its
          units. With Lasso especially this is critical: which features get zeroed depends entirely on the
          scaling.
        </p>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-regression)", marginBottom: 4 }}>
            Two details that trip people up
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            <strong>Fit the scaler on training data only,</strong> then apply its means and standard deviations
            to the validation/test data — re-fitting per split leaks information. Inside cross-validation the
            scaler must be re-fit on each fold&rsquo;s training portion, which is why you wrap scaler + model in a{" "}
            <strong>Pipeline</strong>. And the <strong>intercept is handled separately</strong> — it&rsquo;s not
            penalised and not standardized; centering the target absorbs it. Libraries do this for you, but
            only if you let the Pipeline own the scaling.
          </p>
        </div>

        <h2>The same lesson as clustering</h2>
        <p>
          If you read the k-Means track, this is the identical principle:{" "}
          <Link href="/learn/k-means/why-scaling-matters" style={inlineLink}>distance-based methods are dominated
          by large-scale features</Link>. Penalized regression is the same story from the coefficient side —
          any method that compares features by a common yardstick (a distance, a penalty) needs them on a
          common scale first. It&rsquo;s one of the most universal preprocessing rules in ML.
        </p>

        <h2>Always wrap it in a Pipeline</h2>
        <CodeBlock fromScratch={codeScratch} withLibrary={codeLib} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/regularized-regression/tuning-the-mix" style={navLink}>← Tuning the mix</Link>
          <Link href="/learn/regularized-regression/cross-validating-the-penalty" style={{ ...navLink, fontWeight: 600 }}>Next up · Cross-validating the penalty →</Link>
        </div>
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np

# standardize on TRAIN statistics, reuse them on TEST (no leakage)
mu, sigma = X_train.mean(0), X_train.std(0)
Xtr = (X_train - mu) / sigma
Xte = (X_test  - mu) / sigma           # same mu, sigma — do NOT refit

beta = ridge_fit(Xtr, y_train - y_train.mean(), lam=1.0)   # target centered too`;

const codeLib = `from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import Lasso
from sklearn.pipeline import make_pipeline

# the Pipeline re-fits the scaler on each CV fold's training data automatically
model = make_pipeline(StandardScaler(), Lasso(alpha=0.1))
model.fit(X_train, y_train)
model.predict(X_test)`;

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const inlineLink: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-regression) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-regression) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0" };
