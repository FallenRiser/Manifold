import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "Solving the Lasso — Manifold",
  description:
    "Lasso has no closed form because |β| isn't differentiable at zero. Coordinate descent with soft-thresholding is the elegant, dominant algorithm — simple enough to write in a few lines.",
};

export default function SolvingPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-regression)")}>Regression</span>
        <span style={chip("var(--c-metrics)")}>Go deeper</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 7 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        Solving the Lasso
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        Ridge had a tidy formula; Lasso doesn&rsquo;t. The absolute value has a kink, so calculus alone can&rsquo;t
        solve it. The fix is a beautifully simple iterative idea — optimise one coordinate at a time — that
        turns out to be the fastest method known.
      </p>

      <div className="lesson">
        <h2>Why there&rsquo;s no closed form</h2>
        <p>
          To minimise ridge we set the gradient to zero and solved. Lasso&rsquo;s penalty{" "}
          <M>{String.raw`\sum |\beta_j|`}</M> isn&rsquo;t differentiable at <M>{String.raw`\beta_j = 0`}</M> — the
          absolute value has a corner there — so there&rsquo;s no single gradient to set to zero, and no matrix
          formula. We need optimisation that can handle the kink, which is exactly where the zeros (and the
          difficulty) come from. The right tool is the <strong>subgradient</strong>, which generalises the
          derivative at non-smooth points.
        </p>

        <h2>Coordinate descent: optimise one β at a time</h2>
        <p>
          The dominant algorithm is disarmingly simple. Cycle through the coefficients; for each one, fix all
          the others and solve for the single best value of that one. That 1-D subproblem has an exact
          answer — and it&rsquo;s precisely <strong>soft-thresholding</strong>:
        </p>
        <MathBlock>{String.raw`\beta_j \leftarrow \frac{1}{z_j}\, S\!\big(\rho_j,\; \lambda\big), \qquad S(\rho, \lambda) = \operatorname{sign}(\rho)\,(|\rho| - \lambda)_{+}`}</MathBlock>
        <p>
          where <M>{String.raw`\rho_j`}</M> is feature <M>{String.raw`j`}</M>&rsquo;s correlation with the current
          residual and <M>{String.raw`z_j`}</M> is its squared norm. Sweep through all coordinates repeatedly;
          because each step lowers the objective and the problem is convex, it converges to the global optimum.
          Each update either shrinks a coefficient or snaps it to exactly zero — selection happening live,
          coordinate by coordinate.
        </p>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-regression)", marginBottom: 4 }}>
            Why coordinate descent wins here
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            The penalty is <strong>separable</strong> — it&rsquo;s a sum of per-coordinate terms — so optimising one
            coordinate at a time is exact and the kinks are handled one dimension at a time, where soft-thresholding
            dispatches them cleanly. Combined with warm starts along the λ path and the fact that most
            coefficients stay at zero (so updates are cheap), it&rsquo;s extremely fast. This is the engine inside{" "}
            <code>glmnet</code> and scikit-learn&rsquo;s Lasso.
          </p>
        </div>

        <h2>The other solvers</h2>
        <ul style={ul}>
          <li><strong>LARS</strong> (Least Angle Regression) walks the exact piecewise-linear path, adding one feature at a time — great for getting the whole path and for <M>{String.raw`p \gg n`}</M>.</li>
          <li><strong>Proximal gradient / ISTA &amp; FISTA</strong> — gradient descent on the smooth loss followed by a soft-threshold &ldquo;proximal&rdquo; step each iteration; FISTA adds momentum for faster convergence. The standard view in modern convex optimization.</li>
          <li><strong>ADMM</strong> — splits the problem into a smooth part and an L1 part solved alternately; handy for distributed or structured variants.</li>
        </ul>

        <h2>Coordinate descent, from scratch</h2>
        <p>This is the entire Lasso solver in a dozen lines — the same loop powering the lab in this chapter:</p>
        <CodeBlock fromScratch={codeScratch} withLibrary={codeLib} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/regularized-regression/lasso-for-feature-selection" style={navLink}>← Lasso for feature selection</Link>
          <Link href="/learn/regularized-regression/when-the-lasso-struggles" style={{ ...navLink, fontWeight: 600 }}>Next up · When the Lasso struggles →</Link>
        </div>
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np

def soft_threshold(rho, lam):
    return np.sign(rho) * np.maximum(np.abs(rho) - lam, 0.0)

def lasso_coordinate_descent(X, y, lam, n_iter=100):
    n, p = X.shape
    beta = np.zeros(p)
    z = (X**2).sum(axis=0)                       # column squared-norms
    for _ in range(n_iter):
        for j in range(p):
            # partial residual: remove feature j's current contribution
            r_j = y - X @ beta + X[:, j] * beta[j]
            rho = X[:, j] @ r_j                  # correlation with the residual
            beta[j] = soft_threshold(rho, lam * n) / z[j]   # exact 1-D solution
    return beta                                  # some entries are exactly 0`;

const codeLib = `from sklearn.linear_model import Lasso

# selection="cyclic" is coordinate descent (default); "random" can be faster
lasso = Lasso(alpha=0.1, selection="cyclic", max_iter=10_000).fit(X, y)
print(lasso.n_iter_, "iterations", "·", (lasso.coef_ != 0).sum(), "features kept")`;

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-regression) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-regression) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0" };
