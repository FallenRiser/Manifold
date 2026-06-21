import Link from "next/link";
import { NormalEquationLab } from "@/components/labs/NormalEquationLab";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "The normal equation — Manifold",
  description:
    "The normal equation is the closed-form solution to linear regression: θ* = (XᵀX)⁻¹Xᵀy. No iterations, no learning rate — just one matrix multiply.",
};

export default function NormalEquationPage() {
  const fromScratch = `import numpy as np

X_raw = np.array([1.4, 1.7, 2.0, 2.3, 2.5, 2.8, 3.1, 3.4, 3.7, 4.0, 4.2, 4.5])
y     = np.array([245, 312, 279, 308, 401, 390, 437, 421, 490, 518, 572, 601])

# Build design matrix: prepend a column of 1s for the intercept
ones = np.ones((len(X_raw), 1))
X    = np.column_stack([ones, X_raw])   # shape: (12, 2)

# θ* = (XᵀX)⁻¹ Xᵀy
# np.linalg.solve is numerically safer than computing the inverse directly
theta = np.linalg.solve(X.T @ X, X.T @ y)

intercept, slope = theta
print(f"intercept: {intercept:.2f}")
print(f"slope:     {slope:.2f}")

# Verify
y_hat = X @ theta
mse   = np.mean((y - y_hat) ** 2)
print(f"MSE: {mse:.1f}")`;

  const withLibrary = `import numpy as np
from sklearn.linear_model import LinearRegression

# sklearn's LinearRegression solves the normal equation internally
# using SVD (np.linalg.lstsq) for numerical stability
X = np.array([1.4,1.7,2.0,2.3,2.5,2.8,3.1,3.4,3.7,4.0,4.2,4.5]).reshape(-1, 1)
y = np.array([245,312,279,308,401,390,437,421,490,518,572,601])

model = LinearRegression().fit(X, y)
print(f"intercept: {model.intercept_:.2f}")
print(f"slope:     {model.coef_[0]:.2f}")

# Or solve directly with lstsq (equivalent, stable)
X_aug  = np.column_stack([np.ones(len(X)), X.ravel()])
theta, _, _, _ = np.linalg.lstsq(X_aug, y, rcond=None)
print(f"lstsq → intercept={theta[0]:.2f}, slope={theta[1]:.2f}")`;

  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-regression)")}>Regression</span>
        <span style={chip("var(--c-fundamentals)")}>Core idea</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 9 minutes</span>
      </div>

      <h1
        className="font-serif"
        style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}
      >
        The normal equation
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 8px", maxWidth: 620 }}>
        Gradient descent finds the minimum by rolling downhill, one step at a
        time. But for a linear model, there's a shortcut: a single formula that
        lands you at the exact answer in one shot.
      </p>

      <div className="lesson">
        <p>
          The loss function for linear regression is a smooth quadratic bowl —
          it has exactly one minimum, and the bottom sits right where the
          gradient is zero. Instead of rolling toward that zero, we can{" "}
          <em>solve for it directly</em>: set the gradient equal to zero and
          rearrange. That rearrangement is the normal equation.
        </p>

        <h2>Deriving it</h2>
        <p>
          Write the MSE loss in matrix form. Let <strong>X</strong> be the
          design matrix (data + a column of 1s for the intercept), <strong>y</strong>{" "}
          the target vector, and <strong>θ</strong> the parameter vector [b, m]ᵀ.
          Then:
        </p>
        <div style={mathBlock}>
          L(θ) = ‖Xθ − y‖² / N
        </div>
        <p>
          Take the gradient with respect to θ, set it to zero, and solve:
        </p>
        <div style={mathBlock}>
          ∂L/∂θ = 0 &nbsp;⟹&nbsp; 2Xᵀ(Xθ − y) = 0 &nbsp;⟹&nbsp; XᵀXθ = Xᵀy
        </div>
        <p>
          Assuming XᵀX is invertible, multiply both sides by (XᵀX)⁻¹:
        </p>
        <div
          style={{
            ...mathBlock,
            fontSize: 20,
            letterSpacing: "0.02em",
            background: "color-mix(in srgb, var(--brand) 8%, var(--canvas))",
            border: "1.5px solid color-mix(in srgb, var(--brand) 25%, var(--border))",
          }}
        >
          <span style={{ color: "var(--brand)", fontWeight: 700 }}>θ*</span>
          {" = (XᵀX)⁻¹ Xᵀy"}
        </div>
        <p>
          That's the normal equation. One formula. No hyperparameters, no loop
          counter. Walk through every step below and watch the matrix computation
          turn raw data into the best-fit line.
        </p>

        <NormalEquationLab />

        <h2>What XᵀX and Xᵀy actually encode</h2>
        <p>
          The matrix XᵀX is called the <strong>Gram matrix</strong>. For our
          two-parameter model it's 2×2 and stores four numbers: how many
          data points there are, the sum of x-values, the sum of x²-values.
          Together these fully describe the second-order shape of the loss bowl.
        </p>
        <p>
          The vector Xᵀy stores how each parameter co-varies with the output —
          it's the "signal" the parameters need to chase. Multiplying by the
          inverse of XᵀX rescales and rotates that signal into the optimal θ.
        </p>

        <h2>When XᵀX isn't invertible</h2>
        <p>
          XᵀX can fail to be invertible when two features are perfectly
          correlated (one is a linear combination of another), or when you have
          more parameters than data points. In that case, the minimum isn't
          unique — infinitely many θ values all produce the same loss. Numerical
          libraries handle this with the <strong>pseudoinverse</strong> (via SVD),
          which picks the smallest-norm solution.
        </p>

        <h2>The cost of the inversion</h2>
        <p>
          Inverting a p×p matrix costs O(p³) operations. For a model with 1,000
          features that's manageable. For 100,000 features — common in NLP or
          large recommendation systems — it's prohibitive. That's why gradient
          descent exists: it's never exact, but it scales.
        </p>

        <div style={callout}>
          <div
            className="font-display"
            style={{ fontSize: 13, fontWeight: 500, color: "var(--c-fundamentals)", marginBottom: 4 }}
          >
            When to reach for the normal equation
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            Use it when: (1) you have a linear model, (2) the number of features
            p is small (say, under a few thousand), and (3) XᵀX is invertible.
            It's exact, requires no tuning, and runs in one shot. When p is
            large or the model is non-linear, switch to gradient descent.
          </p>
        </div>

        <h2>The code</h2>
        <p>
          The normal equation is two lines of NumPy. Compare it directly
          with sklearn — they solve the same system and produce identical
          numbers.
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
          <Link href="/learn/linear-regression/when-do-we-stop" style={navLink}>
            ← When do we stop?
          </Link>
          <Link href="/learn/linear-regression/closed-form-vs-gradient-descent" style={navLink}>
            Next up · Closed-form vs gradient descent →
          </Link>
        </div>
      </div>
    </article>
  );
}

function chip(color: string): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    background: `color-mix(in srgb, ${color} 13%, var(--surface))`,
    color,
    fontSize: 12,
    padding: "3px 10px",
    borderRadius: 999,
  };
}

const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };

const mathBlock: React.CSSProperties = {
  fontFamily: "ui-monospace, monospace",
  fontSize: 15,
  background: "var(--canvas)",
  border: "1px solid var(--border-strong)",
  borderRadius: 10,
  padding: "12px 18px",
  margin: "0.8rem 0 1.2rem",
  color: "var(--ink)",
  textAlign: "center",
};

const callout: React.CSSProperties = {
  background: "color-mix(in srgb, var(--c-fundamentals) 9%, var(--surface))",
  border: "1px solid color-mix(in srgb, var(--c-fundamentals) 22%, var(--border))",
  borderRadius: 12,
  padding: "13px 15px",
  margin: "1.8rem 0 0",
};
