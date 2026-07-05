import { CodeBlock } from "@/components/CodeBlock";
import { REGRESSION_SETUP } from "@/lib/runtimeSetup";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "The full path & warm starts — Manifold",
  description:
    "Computing the whole regularization path costs little more than a single fit, thanks to warm starts and the path's smoothness. That efficiency is why CV over hundreds of λ values is practical.",
};

export default function FullPathPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }, { label: "Go deeper", color: "var(--c-metrics)" }]}
        time="about 5 minutes"
        title={<>The full path & warm starts</>}
        intro={<>
          Cross-validating over a hundred values of λ sounds expensive. It isn&rsquo;t — the trick is to never solve
        any of them from scratch. Two ideas make computing the entire path nearly as cheap as one fit.
        </>}
      />

      <div className="lesson">
        <h2>Warm starts: reuse the last solution</h2>
        <p>
          Solve the penalized problem along a grid of λ values from <strong>strong to weak</strong>. The
          solution changes only a little between adjacent λ, so initialise each fit from the previous solution
          rather than from zero — a <strong>warm start</strong>. The solver then needs just a few iterations to
          nudge to the new optimum instead of converging from scratch. Across the whole grid, the total work is
          close to a single cold fit.
        </p>
        <p>
          Starting from the strong-penalty end is deliberate: there, almost all coefficients are zero (a near-
          trivial solution), and each step toward weaker λ activates a few more — a gentle, incremental warm-up
          rather than a series of hard problems.
        </p>

        <h2>Exact path algorithms</h2>
        <ul style={ul}>
          <li>
            <strong>LARS</strong> exploits the fact that the Lasso path is <em>piecewise linear</em> — straight
            segments bending only at the &ldquo;knots&rdquo; where a feature enters or leaves. Instead of sampling a grid,
            LARS jumps exactly knot-to-knot, computing the entire continuous path in roughly the cost of one
            ordinary least-squares fit.
          </li>
          <li>
            <strong>Coordinate descent with warm starts</strong> (glmnet, scikit-learn&rsquo;s default) samples a λ
            grid but, thanks to warm starts plus <strong>active-set</strong> tricks — only updating the
            currently-nonzero coefficients most of the time — is extremely fast in practice and scales to huge
            problems.
          </li>
        </ul>

        <Callout color="var(--c-regression)" title={<>Why this matters for you</>}>
          Path efficiency is the quiet reason the whole workflow is practical. Because the full path is nearly
            free, the <code>...CV</code> estimators can score a fine λ grid inside every fold without you
            thinking about cost, and you get the coefficient-path plot — the best diagnostic in this track — as
            a by-product. When you call <code>LassoCV</code>, this machinery is what&rsquo;s running underneath.
        </Callout>

        <h2>Compute the path efficiently</h2>
        <CodeBlock setup={REGRESSION_SETUP} fromScratch={codeScratch} withLibrary={codeLib} />

        <PrevNext prev={{ href: "/learn/regularized-regression/cross-validating-the-penalty", label: <>← Cross-validating the penalty</> }} next={{ href: "/learn/regularized-regression/which-when", label: <>Next up · Ridge vs Lasso vs Elastic-net: which when →</> }} />
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np

def soft_threshold(rho, lam):
    return np.sign(rho) * np.maximum(np.abs(rho) - lam, 0.0)

def lasso_path(X, y, lambdas):
    n, p = X.shape
    z = (X**2).sum(0)
    beta = np.zeros(p)                      # cold start at the strongest λ
    path = []
    for lam in sorted(lambdas, reverse=True):   # strong → weak
        for _ in range(50):                 # WARM start: keep previous beta
            for j in range(p):
                r = y - X @ beta + X[:, j] * beta[j]
                beta[j] = soft_threshold(X[:, j] @ r, lam * n) / z[j]
        path.append(beta.copy())            # few iters needed thanks to warm start
    return np.array(path)`;

const codeLib = `import numpy as np
from sklearn.linear_model import lasso_path, lars_path

# coordinate descent with warm starts along a λ grid (the practical default)
alphas, coefs, _ = lasso_path(X, y, n_alphas=100)

# OR the exact piecewise-linear path via LARS (one OLS-cost pass)
alphas2, _, coefs2 = lars_path(X, y, method="lasso")`;


const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };


