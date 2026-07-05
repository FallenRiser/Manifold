import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { REGRESSION_SETUP } from "@/lib/runtimeSetup";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Solving the Lasso — Manifold",
  description:
    "Lasso has no closed form because |β| isn't differentiable at zero. Coordinate descent with soft-thresholding is the elegant, dominant algorithm — simple enough to write in a few lines.",
};

export default function SolvingPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }, { label: "Go deeper", color: "var(--c-metrics)" }]}
        time="about 7 minutes"
        title={<>Solving the Lasso</>}
        intro={<>
          Ridge had a tidy formula; Lasso doesn&rsquo;t. The absolute value has a kink, so calculus alone can&rsquo;t
        solve it. The fix is a beautifully simple iterative idea — optimise one coordinate at a time — that
        turns out to be the fastest method known.
        </>}
      />

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

        <Callout color="var(--c-regression)" title={<>Why coordinate descent wins here</>}>
          The penalty is <strong>separable</strong> — it&rsquo;s a sum of per-coordinate terms — so optimising one
            coordinate at a time is exact and the kinks are handled one dimension at a time, where soft-thresholding
            dispatches them cleanly. Combined with warm starts along the λ path and the fact that most
            coefficients stay at zero (so updates are cheap), it&rsquo;s extremely fast. This is the engine inside{" "}
            <code>glmnet</code> and scikit-learn&rsquo;s Lasso.
        </Callout>

        <h2>The other solvers</h2>
        <ul style={ul}>
          <li><strong>LARS</strong> (Least Angle Regression) walks the exact piecewise-linear path, adding one feature at a time — great for getting the whole path and for <M>{String.raw`p \gg n`}</M>.</li>
          <li><strong>Proximal gradient / ISTA &amp; FISTA</strong> — gradient descent on the smooth loss followed by a soft-threshold &ldquo;proximal&rdquo; step each iteration; FISTA adds momentum for faster convergence. The standard view in modern convex optimization.</li>
          <li><strong>ADMM</strong> — splits the problem into a smooth part and an L1 part solved alternately; handy for distributed or structured variants.</li>
        </ul>

        <h2>Coordinate descent, from scratch</h2>
        <p>This is the entire Lasso solver in a dozen lines — the same loop powering the lab in this chapter:</p>
        <CodeBlock setup={REGRESSION_SETUP} fromScratch={codeScratch} withLibrary={codeLib} />

        <PrevNext prev={{ href: "/learn/regularized-regression/lasso-for-feature-selection", label: <>← Lasso for feature selection</> }} next={{ href: "/learn/regularized-regression/when-the-lasso-struggles", label: <>Next up · When the Lasso struggles →</> }} />
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


const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };


