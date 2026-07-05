import { FeatureScalingLab } from "@/components/labs/FeatureScalingLab";
import { CodeBlock } from "@/components/CodeBlock";
import { REGRESSION_SETUP } from "@/lib/runtimeSetup";
import { MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";


export const metadata = {
  title: "Feature scaling — Manifold",
  description:
    "When features have wildly different scales, gradient descent struggles. Standardisation fixes the loss surface and makes training dramatically faster.",
};

export default function FeatureScalingPage() {
  const fromScratch = `import numpy as np

# Raw features on very different scales
X = np.array([
    [1400, 2, 30],   # sq ft, bedrooms, age
    [1700, 3, 25],
    [2000, 3, 15],
    [2300, 3, 10],
    [2500, 4,  8],
    [2800, 4,  3],
])
y = np.array([245, 312, 279, 308, 401, 390])

# Z-score standardisation: μ=0, σ=1 per feature
mean = X.mean(axis=0)
std  = X.std(axis=0)
X_scaled = (X - mean) / std

print("Means (should be ≈0):", X_scaled.mean(axis=0).round(10))
print("Stds  (should be ≈1):", X_scaled.std(axis=0).round(3))

# CRITICAL: use the SAME mean/std on new data — never re-fit
new_raw    = np.array([[2500, 4, 5]])
new_scaled = (new_raw - mean) / std
print("Scaled new house:", new_scaled.round(3))`;

  const withLibrary = `import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LinearRegression
from sklearn.pipeline import Pipeline

X = np.array([[1400,2,30],[1700,3,25],[2000,3,15],
              [2300,3,10],[2500,4, 8],[2800,4, 3]])
y = np.array([245, 312, 279, 308, 401, 390])

# Pipeline: scaler + model in one object
# fit() scales then trains; predict() scales then predicts
pipe = Pipeline([
    ("scaler", StandardScaler()),
    ("model",  LinearRegression()),
])
pipe.fit(X, y)

print(f"Prediction: \${pipe.predict([[3100, 5, 2]])[0]:.0f}k")
print(f"Learned means: {pipe['scaler'].mean_.round(0)}")
print(f"Learned stds:  {pipe['scaler'].scale_.round(1)}")`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }, { label: "Core idea", color: "var(--c-fundamentals)" }]}
        time="about 7 minutes"
        title={<>Feature scaling</>}
        intro={<>
          Square footage runs from 500 to 5,000. Bedroom count runs from 1 to 8.
        When gradient descent has to navigate both at once, one dimension
        dominates — and training grinds to a crawl.
        </>}
      />

      <div className="lesson">
        <p>
          Think of the loss surface as a valley. When features are on the same
          scale it's a round bowl — easy to descend from any angle. When one
          feature spans 0–5000 and another spans 0–5, the bowl stretches into a
          long, flat canyon. Steps along the narrow direction are far too large
          (the walls are steep); steps along the long direction are tiny (the
          floor is nearly flat). Gradient descent bounces off the walls and
          barely advances.
        </p>

        <h2>The fix: standardisation</h2>
        <p>
          Subtract the mean and divide by the standard deviation — every feature
          ends up with mean 0 and standard deviation 1:
        </p>
        <MathBlock>{String.raw`x_{\text{scaled}} = \frac{x - \mu}{\sigma}`}</MathBlock>
        <p>
          Now the loss surface is roughly spherical, a single learning rate
          works well for all parameters, and convergence is dramatically faster.
        </p>

        <h2>See it in action</h2>
        <p>
          The lab below runs two gradient descent sessions in parallel on the
          same dataset. One uses raw features (needing a learning rate of
          0.0000001 just to avoid diverging). The other standardises first and
          can use α = 0.12 — more than a million times larger.
        </p>

        <FeatureScalingLab />

        <h2>Does it change the answer?</h2>
        <p>
          Scaling changes the <em>coefficients</em> (a coefficient on a
          standardised feature is measured in units of "per standard deviation
          change"), but it doesn't change the <em>predictions</em> or the
          final MSE. The model still lands at the same minimum — it just gets
          there faster. When you scale back to the original space, the
          coefficients rescale accordingly.
        </p>

        <h2>Min-max normalisation — the alternative</h2>
        <p>
          Instead of standardising, you can map every feature into [0, 1]:
        </p>
        <MathBlock>{String.raw`x_{\text{scaled}} = \frac{x - x_{\min}}{x_{\max} - x_{\min}}`}</MathBlock>
        <p>
          This is sensitive to outliers (one extreme value compresses all the
          others near 0) but is useful when you need values in a known range —
          such as pixel values for images or probabilities. For general
          tabular data, standardisation (z-score) is the safer default.
        </p>

        <h2>When to scale</h2>
        <div style={rulesGrid}>
          <RuleCard color="var(--good)" title="Always scale" items={["Gradient descent (any variant)", "Ridge/Lasso regularisation", "PCA and dimensionality reduction", "Distance-based models (KNN, SVM)"]} />
          <RuleCard color="var(--warn)" title="Usually not needed" items={["Decision trees and random forests", "The normal equation (exact result)", "Models using only binary features"]} />
        </div>

        <Callout color="var(--c-fundamentals)" title={<>Practical note</>}>
          Always fit the scaler on <strong>training data only</strong>, then
            apply the same mean/std to validation and test data. Scaling with
            test statistics would leak information about the test set into
            training — a subtle but real form of data leakage.
        </Callout>

        <h2>The code</h2>
        <p>
          Manual z-score scaling is four lines. The pipeline approach
          guarantees the same statistics are applied to training and test data
          without leaking information.
        </p>

        <CodeBlock setup={REGRESSION_SETUP} fromScratch={fromScratch} withLibrary={withLibrary} />

        <PrevNext prev={{ href: "/learn/linear-regression/multiple-linear-regression", label: <>← Multiple linear regression</> }} next={{ href: "/learn/linear-regression/categorical-features", label: <>Next up · Categorical features →</> }} />
      </div>

    </article>
  );
}

function RuleCard({ color, title, items }: { color: string; title: string; items: string[] }) {
  return (
    <div style={{ background: `color-mix(in srgb, ${color} 6%, var(--surface-2))`, border: `1px solid color-mix(in srgb, ${color} 18%, var(--border))`, borderRadius: 14, padding: "13px 15px" }}>
      <div className="font-display" style={{ fontSize: 13.5, fontWeight: 600, color, marginBottom: 8 }}>{title}</div>
      <ul style={{ margin: 0, paddingLeft: "1.2em", fontSize: 13.5, color: "var(--muted)", lineHeight: 1.75 }}>
        {items.map(i => <li key={i}>{i}</li>)}
      </ul>
    </div>
  );
}

const rulesGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, margin: "1.4rem 0" };


