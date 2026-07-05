import { PolynomialLab } from "@/components/labs/PolynomialLab";
import { CodeBlock } from "@/components/CodeBlock";
import { REGRESSION_SETUP } from "@/lib/runtimeSetup";
import { MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { Quiz } from "@/components/Quiz";


export const metadata = {
  title: "Polynomial & interaction terms — Manifold",
  description:
    "Linear regression only fits straight lines — until you add engineered features. Squaring x, cubing it, or multiplying two features together gives the model curves and interactions, for free.",
};

export default function PolynomialAndInteractionPage() {
  const fromScratch = `import numpy as np

X = np.array([1.4, 1.7, 2.0, 2.3, 2.5, 2.8, 3.1, 3.4, 3.7, 4.0, 4.2, 4.5])
y = np.array([245, 312, 279, 308, 401, 390, 437, 421, 490, 518, 572, 601])

# Build degree-3 design matrix: [1, x, x², x³]
X_poly = np.column_stack([np.ones(len(X)), X, X**2, X**3])  # (12, 4)

# Normal equation — same formula, more columns
theta = np.linalg.solve(X_poly.T @ X_poly, X_poly.T @ y)
print("Coefficients [b, x, x², x³]:", theta.round(2))

y_hat = X_poly @ theta
r2 = 1 - np.sum((y - y_hat)**2) / np.sum((y - y.mean())**2)
print(f"R² (degree-3): {r2:.3f}")

# Compare: degree-1 (linear) R²
X_lin = np.column_stack([np.ones(len(X)), X])
t_lin = np.linalg.solve(X_lin.T @ X_lin, X_lin.T @ y)
r2_lin = 1 - np.sum((y - X_lin@t_lin)**2) / np.sum((y - y.mean())**2)
print(f"R² (degree-1): {r2_lin:.3f}")`;

  const withLibrary = `import numpy as np
from sklearn.preprocessing import PolynomialFeatures
from sklearn.linear_model import LinearRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import r2_score

X = np.array([1.4,1.7,2.0,2.3,2.5,2.8,3.1,3.4,3.7,4.0,4.2,4.5]).reshape(-1, 1)
y = np.array([245,312,279,308,401,390,437,421,490,518,572,601])

for degree in [1, 2, 3, 7]:
    pipe = Pipeline([
        ("poly",  PolynomialFeatures(degree=degree, include_bias=False)),
        ("model", LinearRegression()),
    ])
    pipe.fit(X, y)
    r2 = r2_score(y, pipe.predict(X))
    print(f"degree={degree}  R²={r2:.3f}  "
          f"(features: {pipe['poly'].get_feature_names_out()})")`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }, { label: "Core idea", color: "var(--c-fundamentals)" }]}
        time="about 9 minutes"
        title={<>Polynomial &amp; interaction terms</>}
        intro={<>
          Real relationships bend. Study time improves grades — but only up to a
        point. The trick: add x² as a new feature. The model is still linear;
        the fit is not.
        </>}
      />

      <div className="lesson">
        <p>
          "Linear regression" means linear <em>in the parameters</em> — in θ.
          It says nothing about the shape the model draws in x-space. If you
          hand the model x, x², and x³ as three separate features, it still
          runs the same normal equation and gradient descent. But it can now
          fit curves.
        </p>

        <h2>Polynomial features</h2>
        <p>
          For a single feature x, the degree-d polynomial model is:
        </p>
        <MathBlock>{String.raw`\hat y = \theta_0 + \theta_1 x + \theta_2 x^2 + \theta_3 x^3 + \dots + \theta_d\, x^{d}`}</MathBlock>
        <p>
          Each power of x is a new column in the design matrix. The algorithm
          sees only those columns — it has no idea they come from the same
          original feature. It learns the coefficients exactly as before.
        </p>

        <h2>Watch the bend appear</h2>
        <p>
          The lab below fits study hours to exam scores — a relationship that
          peaks around 8–9 hours (more than that and fatigue sets in). Click
          through the degrees and watch the curve bend to fit the data. Pay
          close attention to degrees 5 and 7.
        </p>

        <PolynomialLab />

        <h2>The overfitting warning</h2>
        <p>
          Degrees 5 and 7 show something alarming: the curve threads through
          most data points, MSE falls, R² rises — and the line goes wild
          between them. That wildness is the model memorising the{" "}
          <strong>noise</strong> rather than the <strong>signal</strong>. On
          new data, those oscillations will produce terrible predictions. This
          is <strong>overfitting</strong>, and it's the central problem of
          machine learning.
        </p>
        <p>
          The fix is to not choose degree by training MSE alone. Instead,
          evaluate on held-out data (cross-validation) and penalise complexity.
          Degree 2 or 3 almost always wins on unseen data for smooth real-world
          curves, even if higher degrees look better on the training set.
        </p>

        <h2>Interaction terms</h2>
        <p>
          Sometimes the effect of one feature depends on the value of another.
          Square footage and location interact: an extra 100 sqft in a prime
          area is worth more than the same space in a cheap suburb. Capture
          this with a product term:
        </p>
        <MathBlock>{String.raw`\hat y = \theta_0 + \theta_1\cdot\text{sqft} + \theta_2\cdot\text{location} + \textcolor{#5872cc}{\theta_3\cdot(\text{sqft} \times \text{location})}`}</MathBlock>
        <p>
          Again, the model sees only columns — the product column is just
          another feature. A positive θ₃ means the slope on sqft increases
          with location score.
        </p>

        <h2>Putting it together: the feature engineering mindset</h2>
        <div style={grid3}>
          <FeatureCard icon="²" title="Polynomial" body="Add xᵈ columns. Fits curves. Watch out for overfitting at high d." />
          <FeatureCard icon="×" title="Interaction" body="Add xᵢ·xⱼ. Captures conditional effects. Combinatorial explosion with many features." />
          <FeatureCard icon="log" title="Transforms" body="log(x), √x, 1/x. Linearise skewed distributions. Especially useful for income, population, prices." />
        </div>
        <p>
          All three of these are just columns in X. Linear regression handles
          them identically. The art is in deciding which columns to add — and
          that's where domain knowledge and model validation come in.
        </p>

        <Callout color="var(--c-fundamentals)" title={<>The key insight</>}>
          "Linear" in linear regression doesn't mean a straight line in
            input space. It means linear in the parameters. By engineering
            features — powers, products, logs — you get the flexibility to fit
            complex patterns while keeping all the analytical machinery
            (gradient descent, normal equation, closed-form inference) intact.
        </Callout>

        <h2>The code</h2>
        <p>
          Building polynomial features is just stacking columns of x, x²,
          x³ in the design matrix. sklearn&rsquo;s{" "}
          <code>PolynomialFeatures</code> does this automatically.
        </p>

        <CodeBlock setup={REGRESSION_SETUP} fromScratch={fromScratch} withLibrary={withLibrary} />

        <Quiz
          questions={[
            {
              q: <>You add x² and x³ as features and fit with OLS. Is the model still &ldquo;linear regression&rdquo;?</>,
              options: ["No — the curve is visibly non-linear", "Yes — it's linear in the coefficients, which is all OLS needs", "Only if the coefficients are small", "Only after standardizing"],
              answer: 1,
              explain: <>&ldquo;Linear&rdquo; refers to the <em>parameters</em>, not the shape: ŷ = w₁x + w₂x² + w₃x³ + b is a plain weighted sum of (engineered) features, so every OLS tool still applies. The non-linearity was moved into the features.</>,
            },
            {
              q: <>Gradient descent zig-zags badly on a dataset where one feature spans 0–1 and another spans 0–10,000. Why does scaling fix it?</>,
              options: ["Scaling removes outliers", "Wildly different scales make the loss contours long and thin; scaling rounds them so the gradient points at the minimum", "Scaling increases the learning rate automatically", "It doesn't — scaling only matters for trees"],
              answer: 1,
              explain: <>Elongated elliptical contours send the negative gradient nearly perpendicular to the minimum → zig-zag. Standardized features give near-circular contours and a nearly straight descent path — the contour lab from the feature-scaling page.</>,
            },
            {
              q: <>Encoding a 4-category feature for a model with an intercept, you use one-hot dummies. How many columns?</>,
              options: ["4 — one per category", "3 — one category becomes the baseline absorbed by the intercept", "2 — log₂(4)", "1 — encode categories as 0, 1, 2, 3"],
              answer: 1,
              explain: <>All 4 dummies always sum to 1 — an exact copy of the intercept column, which makes X′X singular (the dummy trap). Drop one; its category becomes the baseline and the other coefficients are offsets from it. And 0/1/2/3 label-encoding invents a fake ordering.</>,
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/linear-regression/categorical-features", label: <>← Categorical features</> }} next={{ href: "/learn/linear-regression/the-five-assumptions", label: <>Next up · The five assumptions →</> }} />
      </div>
    </article>

  );
}

function FeatureCard({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 14, padding: "13px 15px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ fontFamily: "ui-monospace, monospace", fontWeight: 700, fontSize: 18, color: "var(--brand)" }}>{icon}</span>
        <span className="font-display" style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{title}</span>
      </div>
      <p style={{ margin: 0, fontSize: 13.5, color: "var(--muted)", lineHeight: 1.6 }}>{body}</p>
    </div>
  );
}

const grid3: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, margin: "1.4rem 0" };
