import Link from "next/link";
import { RegularizationLab } from "@/components/labs/RegularizationLab";
import { CodeBlock } from "@/components/CodeBlock";


export const metadata = {
  title: "Regularization — Manifold",
  description:
    "When a model has too many features, it memorises the noise. Regularization adds a penalty for complexity, forcing the model to earn its coefficients.",
};

export default function RegularizationPage() {
  const fromScratch = `import numpy as np

# Overfitted scenario: degree-10 polynomial, 12 noisy points
np.random.seed(42)
X_raw = np.linspace(0, 1, 12)
y     = 2 * X_raw + np.random.normal(0, 0.15, 12)

# Build degree-10 design matrix
X = np.column_stack([X_raw ** k for k in range(11)])  # (12, 11)

# --- OLS (no regularisation) ---
theta_ols = np.linalg.lstsq(X, y, rcond=None)[0]
print(f"OLS max |coef|:   {np.abs(theta_ols).max():.1f}")  # huge!

# --- Ridge (L2): θ_ridge = (XᵀX + λI)⁻¹ Xᵀy
lam = 0.1
I   = np.eye(X.shape[1])
I[0, 0] = 0           # don't penalise the intercept
theta_ridge = np.linalg.solve(X.T @ X + lam * I, X.T @ y)
print(f"Ridge max |coef|: {np.abs(theta_ridge).max():.1f}")  # much smaller`;

  const withLibrary = `import numpy as np
from sklearn.linear_model import LinearRegression, Ridge, Lasso, ElasticNet
from sklearn.preprocessing import PolynomialFeatures
from sklearn.pipeline import Pipeline

np.random.seed(42)
X_raw = np.linspace(0, 1, 12).reshape(-1, 1)
y     = (2 * X_raw.ravel()) + np.random.normal(0, 0.15, 12)

def make_pipe(model):
    return Pipeline([("poly", PolynomialFeatures(10)), ("reg", model)])

fits = [
    ("OLS",       make_pipe(LinearRegression())),
    ("Ridge",     make_pipe(Ridge(alpha=0.1))),
    ("Lasso",     make_pipe(Lasso(alpha=0.001))),
    ("ElasticNet",make_pipe(ElasticNet(alpha=0.001, l1_ratio=0.5))),
]
for name, pipe in fits:
    pipe.fit(X_raw, y)
    coefs = pipe["reg"].coef_
    non_zero = np.sum(np.abs(coefs) > 1e-4)
    print(f"{name:12s} | max |coef|={np.abs(coefs).max():6.1f} | "
          f"non-zero coefs: {non_zero}/{len(coefs)}")`;

  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-regression)")}>Regression</span>
        <span style={chip("var(--brand)")}>Fixing</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 7 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        Regularization
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 8px", maxWidth: 620 }}>
        Ordinary Least Squares is greedy. It will contort its coefficients into
        massive, opposing numbers just to shave a fraction off the training
        error. Regularization stops the madness.
      </p>

      <div className="lesson">
        <h2>The penalty term</h2>
        <p>
          Normally, we minimise the Sum of Squared Errors (SSE). Regularization
          changes the game by adding a <strong>penalty term</strong> to the cost
          function. The model now has to balance two competing goals: fit the
          data, but keep the coefficients as small as possible.
        </p>
        <div style={mathBlock}>Cost = SSE + λ × (Penalty on coefficients)</div>
        <p>
          The parameter <strong>λ (lambda)</strong> controls the strength of the
          penalty. 
          If λ = 0, you just have standard OLS. 
          If λ = 10000, the penalty is so severe that all coefficients are
          crushed to zero, and you just predict the mean.
        </p>

        <h2>Watch it work</h2>
        <p>
          Below is a degree-10 polynomial fit to 12 noisy data points. It is
          massively overfitted — tracing wild loops to hit every point perfectly.
          As you increase the L2 penalty (λ), watch the model trade a little bit
          of training error for a massive drop in testing error, as the curve
          smooths out into a sensible line.
        </p>

        <RegularizationLab />

        <h2>Ridge (L2) vs Lasso (L1)</h2>
        <p>
          There are two main ways to penalise the coefficients. They look
          similar mathematically, but behave entirely differently in practice.
        </p>

        <div style={grid2}>
          <PenaltyCard title="Ridge Regression (L2)" formula="Penalty = ∑ βⱼ²" color="var(--brand)"
            body="Squaring the coefficients means massive coefficients are penalised heavily, but tiny coefficients are barely penalised. It shrinks coefficients smoothly toward zero but never actually reaches zero. Ideal for handling multicollinearity." />
          <PenaltyCard title="Lasso Regression (L1)" formula="Penalty = ∑ |βⱼ|" color="var(--c-fundamentals)"
            body="Taking the absolute value applies a constant penalty regardless of size. This forces many coefficients to become exactly zero. Lasso acts as an automatic feature selector, dropping useless variables entirely." />
        </div>

        <h2>When to use which?</h2>
        <ul style={{ paddingLeft: "1.4em", lineHeight: 1.85, color: "var(--muted)", fontSize: 15 }}>
          <li>
            Use <strong>Ridge</strong> when you have many features that all
            contribute a little bit to the outcome, or when you suffer from
            high multicollinearity.
          </li>
          <li>
            Use <strong>Lasso</strong> when you have a massive dataset of
            thousands of features (like genetics or text processing) and you
            believe only a handful are actually important.
          </li>
          <li>
            Use <strong>Elastic Net</strong> (a mix of both L1 and L2 penalties)
            if you want the feature selection of Lasso but the stability of
            Ridge.
          </li>
        </ul>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-fundamentals)", marginBottom: 4 }}>
            Crucial: You must scale your features
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            Because the penalty term sums the raw coefficients, the scale of
            your features matters immensely. If feature A is measured in miles
            (small coefficient) and feature B is measured in inches (massive
            coefficient), Ridge will unfairly crush feature B just because of its
            units. <strong>Always standardize your features (z-score) before
            applying regularization.</strong>
          </p>
        </div>

        <h2>The code</h2>
        <p>
          Ridge has a closed form: add λI to X<sup>T</sup>X before inverting.
          scikit-learn handles both Ridge and Lasso in a single call.
        </p>

        <CodeBlock fromScratch={fromScratch} withLibrary={withLibrary} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/linear-regression/weighted-least-squares" style={navLink}>← Weighted least squares</Link>
          <Link href="/learn/linear-regression/bias-variance-revisited" style={navLink}>Next up · Bias-variance, revisited →</Link>
        </div>
      </div>

    </article>
  );
}

function PenaltyCard({ title, formula, body, color }: { title: string; formula: string; body: string; color: string }) {
  return (
    <div style={{ background: "var(--surface-2)", borderTop: `3px solid ${color}`, borderRadius: "0 0 12px 12px", padding: "16px 18px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
      <div className="font-display" style={{ fontSize: 14.5, fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>{title}</div>
      <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 13.5, color, marginBottom: 8 }}>{formula}</div>
      <p style={{ margin: 0, fontSize: 13.5, color: "var(--muted)", lineHeight: 1.6 }}>{body}</p>
    </div>
  );
}

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const mathBlock: React.CSSProperties = { fontFamily: "ui-monospace, monospace", fontSize: 15, background: "var(--canvas)", border: "1px solid var(--border-strong)", borderRadius: 10, padding: "12px 18px", margin: "0.8rem 0 1.2rem", color: "var(--ink)", textAlign: "center" };
const grid2: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, margin: "1.4rem 0" };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-fundamentals) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-fundamentals) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0 0" };
