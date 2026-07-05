import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { REGRESSION_SETUP } from "@/lib/runtimeSetup";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "The closed-form solution — Manifold",
  description:
    "Ridge has an exact closed-form solution: just add λ to the diagonal of XᵀX before inverting. That single change makes the problem always solvable and reveals exactly how ridge shrinks.",
};

export default function ClosedFormPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }, { label: "Go deeper", color: "var(--c-metrics)" }]}
        time="about 6 minutes"
        title={<>The closed-form solution</>}
        intro={<>
          Unlike Lasso, ridge has an exact algebraic solution — and it&rsquo;s almost identical to ordinary least
        squares. One small change to the OLS formula buys guaranteed solvability and a clear view of the
        shrinkage.
        </>}
      />

      <div className="lesson">
        <h2>Deriving it</h2>
        <p>
          Write the ridge objective in matrix form and set its gradient to zero:
        </p>
        <MathBlock>{String.raw`J(\boldsymbol{\beta}) = \lVert \mathbf{y} - X\boldsymbol{\beta} \rVert^2 + \lambda \lVert \boldsymbol{\beta} \rVert^2`}</MathBlock>
        <MathBlock>{String.raw`\nabla J = -2X^\top(\mathbf{y} - X\boldsymbol{\beta}) + 2\lambda\boldsymbol{\beta} = 0`}</MathBlock>
        <p>Rearranging gives the ridge normal equations and their solution:</p>
        <MathBlock>{String.raw`\boldsymbol{\hat\beta}_{\text{ridge}} = \big(X^\top X + \lambda I\big)^{-1} X^\top \mathbf{y}`}</MathBlock>
        <p>
          Compare it to OLS, <M>{String.raw`\hat{\boldsymbol{\beta}} = (X^\top X)^{-1}X^\top \mathbf{y}`}</M>. The
          <em> only</em> difference is the <M>{String.raw`+\lambda I`}</M> — you literally add{" "}
          <M>{String.raw`\lambda`}</M> to the diagonal of <M>{String.raw`X^\top X`}</M> before inverting. That&rsquo;s
          the &ldquo;ridge&rdquo; the method is named after: a ridge added along the diagonal.
        </p>

        <Callout color="var(--c-regression)" title={<>Why ridge always has a solution</>}>
          OLS breaks when <M>{String.raw`X^\top X`}</M> is singular — perfectly correlated features, or more
            features than data points (<M>{String.raw`p > n`}</M>) — because you can&rsquo;t invert it. Adding{" "}
            <M>{String.raw`\lambda I`}</M> with any <M>{String.raw`\lambda > 0`}</M> makes the matrix strictly
            positive-definite, hence <strong>always invertible</strong>. Ridge gives a unique answer in exactly
            the situations where OLS has none — one of its quietly important superpowers.
        </Callout>

        <h2>How the formula reveals shrinkage</h2>
        <p>
          Rotate into the principal directions of the data (the SVD of <M>{String.raw`X`}</M>) and the ridge
          solution decouples: along a direction with data variance <M>{String.raw`d_j^2`}</M>, the OLS
          coefficient is multiplied by a shrinkage factor
        </p>
        <MathBlock>{String.raw`\frac{d_j^2}{d_j^2 + \lambda}`}</MathBlock>
        <p>
          This factor is always between 0 and 1, so every component shrinks — but <strong>unevenly</strong>.
          High-variance directions (<M>{String.raw`d_j^2 \gg \lambda`}</M>) are barely touched; low-variance,
          noise-dominated directions (<M>{String.raw`d_j^2 \ll \lambda`}</M>) are crushed toward zero. Ridge
          intelligently shrinks the unreliable directions hardest, which is exactly why it cuts variance. And
          because the factor never reaches zero, no coefficient is ever eliminated.
        </p>

        <h2>Computing it both ways</h2>
        <p>
          The closed form is exact, but for large or ill-conditioned problems the SVD route is more
          numerically stable — which is what libraries use under the hood.
        </p>
        <CodeBlock setup={REGRESSION_SETUP} fromScratch={codeScratch} withLibrary={codeLib} />

        <PrevNext prev={{ href: "/learn/regularized-regression/ridge-regression", label: <>← Ridge regression</> }} next={{ href: "/learn/regularized-regression/shrinkage-effect-and-paths", label: <>Next up · The shrinkage effect &amp; coefficient paths →</> }} />
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np

# direct closed form: add λ to the diagonal of XᵀX, then solve
def ridge_closed_form(X, y, lam):
    p = X.shape[1]
    return np.linalg.solve(X.T @ X + lam * np.eye(p), X.T @ y)

# numerically stable version via the SVD (this is what libraries do)
def ridge_svd(X, y, lam):
    U, d, Vt = np.linalg.svd(X, full_matrices=False)
    shrink = d / (d**2 + lam)              # the dⱼ/(dⱼ²+λ) shrinkage factors
    return Vt.T @ (shrink * (U.T @ y))

print(np.allclose(ridge_closed_form(X, y, 1.0), ridge_svd(X, y, 1.0)))`;

const codeLib = `from sklearn.linear_model import Ridge

# solver="svd" uses the stable SVD route; "cholesky" uses the closed form directly
Ridge(alpha=1.0, solver="svd").fit(X, y)
Ridge(alpha=1.0, solver="cholesky").fit(X, y)   # (XᵀX + λI) solve`;




