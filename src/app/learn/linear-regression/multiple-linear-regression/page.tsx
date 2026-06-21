import Link from "next/link";
import { MultipleRegressionLab } from "@/components/labs/MultipleRegressionLab";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "Multiple linear regression — Manifold",
  description:
    "One feature becomes many: ŷ = θ₀ + θ₁x₁ + θ₂x₂ + … The line becomes a hyperplane, but the math stays exactly the same.",
};

export default function MultipleLinearRegressionPage() {
  const fromScratch = `import numpy as np

# Features: [sq_ft (k), bedrooms, age (years)]
X_raw = np.array([
    [1.4, 2, 30], [1.7, 3, 25], [2.0, 3, 15], [2.3, 3, 10],
    [2.5, 4, 20], [2.8, 4,  8], [3.1, 4,  5], [3.4, 5, 12],
    [3.7, 5,  3], [4.0, 5,  7], [4.2, 6,  2], [4.5, 6,  1],
])
y = np.array([245, 312, 279, 308, 401, 390, 437, 421, 490, 518, 572, 601])

# Add intercept column (column of 1s)
X = np.column_stack([np.ones(len(X_raw)), X_raw])   # shape: (12, 4)

# Normal equation: θ* = (XᵀX)⁻¹ Xᵀy
theta = np.linalg.solve(X.T @ X, X.T @ y)
intercept, coef_sqft, coef_beds, coef_age = theta

print(f"intercept: {intercept:.2f}")
print(f"sq_ft:     {coef_sqft:.2f}  (per +1k sqft, others fixed)")
print(f"bedrooms:  {coef_beds:.2f}  (per extra bedroom)")
print(f"age_years: {coef_age:.2f}  (per extra year)")

r2 = 1 - np.sum((y - X@theta)**2) / np.sum((y - y.mean())**2)
print(f"R²: {r2:.3f}")`;

  const withLibrary = `import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score

X = np.array([
    [1.4, 2, 30], [1.7, 3, 25], [2.0, 3, 15], [2.3, 3, 10],
    [2.5, 4, 20], [2.8, 4,  8], [3.1, 4,  5], [3.4, 5, 12],
    [3.7, 5,  3], [4.0, 5,  7], [4.2, 6,  2], [4.5, 6,  1],
])
y = np.array([245, 312, 279, 308, 401, 390, 437, 421, 490, 518, 572, 601])

model = LinearRegression().fit(X, y)
print(f"intercept: {model.intercept_:.2f}")
print(f"coefs (sqft, beds, age): {model.coef_.round(2)}")
print(f"R²: {r2_score(y, model.predict(X)):.3f}")

# Predict a new house: 3.0k sqft, 4 bedrooms, 5 years old
new_house = [[3.0, 4, 5]]
print(f"Predicted price: \${model.predict(new_house)[0]:.0f}k")`;

  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-regression)")}>Regression</span>
        <span style={chip("var(--c-fundamentals)")}>Core idea</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 8 minutes</span>
      </div>

      <h1
        className="font-serif"
        style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}
      >
        Multiple linear regression
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 8px", maxWidth: 620 }}>
        So far every model has had one input. Real predictions depend on dozens
        of things at once. The leap to multiple features is smaller than it
        looks — the equation just gets a few extra terms.
      </p>

      <div className="lesson">
        <p>
          With one feature the model is a line:{" "}
          <code>ŷ = θ₀ + θ₁x</code>. With two features it becomes a{" "}
          <strong>plane</strong> slicing through 3D space. With ten features
          it's a <strong>hyperplane</strong> in 11 dimensions — impossible to
          visualise, but governed by exactly the same equations.
        </p>

        <div
          style={{
            fontFamily: "ui-monospace, monospace",
            fontSize: 16,
            background: "var(--canvas)",
            border: "1px solid var(--border-strong)",
            borderRadius: 12,
            padding: "14px 20px",
            margin: "1.2rem 0",
            textAlign: "center",
            color: "var(--ink)",
          }}
        >
          ŷ ={" "}
          <span style={{ color: "var(--brand)" }}>θ₀</span> +{" "}
          <span style={{ color: "var(--c-regression)" }}>θ₁</span>x₁ +{" "}
          <span style={{ color: "var(--c-regression)" }}>θ₂</span>x₂ +{" "}
          <span style={{ color: "var(--c-regression)" }}>θ₃</span>x₃ + … +{" "}
          <span style={{ color: "var(--c-regression)" }}>θₚ</span>xₚ
        </div>

        <p>
          In matrix notation this collapses to{" "}
          <code>ŷ = Xθ</code> — one dot product. The gradient, the update
          rule, and the normal equation are all <em>identical</em> to the
          single-feature case; only the dimensions of X and θ change.
        </p>

        <h2>What each coefficient means</h2>
        <p>
          <strong>θ₀ (intercept)</strong> — the predicted value when every
          feature is zero (or, practically, the baseline level). The
          others — <strong>θ₁, θ₂, …</strong> — each say: "holding all
          other features fixed, a one-unit increase in xⱼ shifts the
          prediction by θⱼ." That phrase, <em>holding all other features
          fixed</em>, is the key. A coefficient doesn't tell you the raw
          correlation; it tells you the <em>partial</em> effect after the
          other features have already been accounted for.
        </p>

        <h2>Tune it yourself</h2>
        <p>
          The model below predicts house prices from square footage,
          bedroom count, and age. Slide the coefficients and watch how each
          one shifts the predicted prices — and the partial regression line
          for whichever feature you've selected.
        </p>

        <MultipleRegressionLab />

        <h2>The design matrix</h2>
        <p>
          In matrix notation, every training example is a row in a matrix
          X (the design matrix), with a leading column of 1s for the
          intercept. The prediction for all examples at once is just{" "}
          <code>ŷ = Xθ</code> — one matrix–vector multiply. The loss is{" "}
          <code>‖Xθ − y‖² / N</code> and the gradient is{" "}
          <code>2Xᵀ(Xθ − y) / N</code>. One formula, any number of
          features.
        </p>

        <h2>What changes vs simple regression?</h2>
        <div style={diffGrid}>
          <DiffCard title="What stays the same">
            <li>The loss function (MSE)</li>
            <li>The update rule θ := θ − α∇L</li>
            <li>The normal equation θ* = (XᵀX)⁻¹Xᵀy</li>
            <li>The interpretation of R²</li>
            <li>The convex bowl shape of the loss surface</li>
          </DiffCard>
          <DiffCard title="What changes">
            <li>X is now N×(p+1) instead of N×2</li>
            <li>θ is a (p+1)-vector instead of 2-vector</li>
            <li>Each coefficient is a <em>partial</em> slope</li>
            <li>Feature scaling matters even more</li>
            <li>Multicollinearity can destabilise coefficients</li>
          </DiffCard>
        </div>

        <div style={callout}>
          <div
            className="font-display"
            style={{ fontSize: 13, fontWeight: 500, color: "var(--c-fundamentals)", marginBottom: 4 }}
          >
            The notation shift
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            Every formula you've seen so far still works — just replace the
            scalar slope m with a vector θ, and the single feature x with a
            row of the design matrix X. The geometry goes from 2D to
            high-dimensional, but the algebra doesn't change a bit.
          </p>
        </div>

        <h2>The code</h2>
        <p>
          The design matrix and the normal equation look identical to the
          single-feature case — only the dimensions change.
        </p>

        <CodeBlock fromScratch={fromScratch} withLibrary={withLibrary} />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 32,
            paddingTop: 16,
            borderTop: "1px solid var(--border)",
          }}
        >
          <Link href="/learn/linear-regression/closed-form-vs-gradient-descent" style={navLink}>
            ← Closed-form vs gradient descent
          </Link>
          <Link href="/learn/linear-regression/feature-scaling" style={navLink}>
            Next up · Feature scaling →
          </Link>
        </div>
      </div>
    </article>
  );
}

function DiffCard({ title, children }: { title: string; children: React.ReactNode }) {
  const isGood = title.startsWith("What stays");
  return (
    <div style={{
      background: `color-mix(in srgb, ${isGood ? "var(--good)" : "var(--c-fundamentals)"} 5%, var(--surface-2))`,
      border: `1px solid color-mix(in srgb, ${isGood ? "var(--good)" : "var(--c-fundamentals)"} 16%, var(--border))`,
      borderRadius: 14, padding: "12px 16px",
    }}>
      <div className="font-display" style={{ fontSize: 13, fontWeight: 600, color: isGood ? "var(--good)" : "var(--c-fundamentals)", marginBottom: 8 }}>{title}</div>
      <ul style={{ margin: 0, paddingLeft: "1.2em", fontSize: 13.5, color: "var(--muted)", lineHeight: 1.75 }}>
        {children}
      </ul>
    </div>
  );
}

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const diffGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, margin: "1.4rem 0" };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-fundamentals) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-fundamentals) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0 0" };
