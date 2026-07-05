import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { REGRESSION_SETUP } from "@/lib/runtimeSetup";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Degrees of freedom & effective complexity — Manifold",
  description:
    "How complex is a regularized model, really? Effective degrees of freedom answers it: ridge's df shrinks continuously with λ, while Lasso's df is simply the number of nonzero coefficients.",
};

export default function DOFPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }, { label: "Go deeper", color: "var(--c-metrics)" }]}
        time="about 6 minutes"
        title={<>Degrees of freedom & effective complexity</>}
        intro={<>
          A regularized model uses all its features but is &ldquo;less complex&rdquo; than OLS. <strong>Effective degrees
        of freedom</strong> makes that precise — a continuous measure of model complexity that the penalty turns
        down as λ rises.
        </>}
      />

      <div className="lesson">
        <h2>The problem with counting parameters</h2>
        <p>
          For OLS, model complexity is just the number of coefficients, <M>{String.raw`p`}</M>. But a ridge model
          with <M>{String.raw`p`}</M> coefficients shrunk hard toward zero is plainly <em>simpler</em> than an OLS
          model with the same <M>{String.raw`p`}</M> — it has less freedom to fit the data. We need a measure that
          captures this. That measure is <strong>effective degrees of freedom</strong>.
        </p>

        <h2>Effective df via the hat matrix</h2>
        <p>
          Every linear smoother predicts <M>{String.raw`\hat{\mathbf{y}} = H\mathbf{y}`}</M> for some &ldquo;hat&rdquo;
          matrix <M>{String.raw`H`}</M>, and its effective degrees of freedom is the trace of that matrix. For
          ridge,
        </p>
        <MathBlock>{String.raw`\mathrm{df}(\lambda) = \mathrm{tr}\big(X(X^\top X + \lambda I)^{-1}X^\top\big) = \sum_{j=1}^{p} \frac{d_j^2}{d_j^2 + \lambda}`}</MathBlock>
        <p>
          where the <M>{String.raw`d_j`}</M> are the singular values of <M>{String.raw`X`}</M>. Each term is one of
          the shrinkage factors from the closed-form page, between 0 and 1. So ridge&rsquo;s df slides{" "}
          <strong>continuously</strong> from <M>{String.raw`p`}</M> at <M>{String.raw`\lambda = 0`}</M> (full OLS)
          down toward <M>{String.raw`0`}</M> as <M>{String.raw`\lambda \to \infty`}</M>. Regularization buys you a{" "}
          <em>fractional</em> number of effective parameters — say 3.7 — which is exactly the &ldquo;less than p but
          more than zero&rdquo; complexity we wanted to quantify.
        </p>

        <h2>Lasso&rsquo;s df is wonderfully simple</h2>
        <p>
          For Lasso there&rsquo;s a remarkable result: the effective degrees of freedom equals the{" "}
          <strong>number of nonzero coefficients</strong> (in expectation).
        </p>
        <MathBlock>{String.raw`\mathbb{E}[\mathrm{df}_{\text{lasso}}] = \mathbb{E}\big[\,\#\{j : \hat\beta_j \neq 0\}\,\big]`}</MathBlock>
        <p>
          Despite the shrinkage on the surviving coefficients, the selection and shrinkage effects cancel out so
          that simply counting the active features gives the right complexity. This is why a sparse Lasso model
          genuinely <em>is</em> as simple as it looks — its degrees of freedom is its sparsity.
        </p>

        <Callout color="var(--c-regression)" title={<>Why you&rsquo;d want this number</>}>
          Effective df plugs straight into model-selection criteria. <strong>AIC</strong> and{" "}
            <strong>BIC</strong> need a complexity penalty — use df(λ) instead of a raw parameter count, and you
            can select λ without cross-validation. It also gives the honest x-axis for comparing models of
            different λ on equal footing: not &ldquo;how many features&rdquo; but &ldquo;how much effective freedom.&rdquo; And it
            quantifies the bias–variance dial in concrete units — fewer effective df means lower variance, more
            bias.
        </Callout>

        <h2>Compute effective df</h2>
        <CodeBlock setup={REGRESSION_SETUP} fromScratch={codeScratch} withLibrary={codeLib} />

        <PrevNext prev={{ href: "/learn/regularized-regression/lasso-as-a-laplace-prior", label: <>← Lasso as a Laplace prior</> }} next={{ href: "/learn/regularized-regression/why-shrinkage-beats-ols", label: <>Next up · Why shrinkage beats OLS (James–Stein) →</> }} />
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np

# ridge effective degrees of freedom = sum of dⱼ²/(dⱼ²+λ) over singular values
def ridge_dof(X, lam):
    d = np.linalg.svd(X, compute_uv=False)
    return (d**2 / (d**2 + lam)).sum()

for lam in [0, 1, 10, 100, 1000]:
    print(f"λ={lam:>5}:  effective df = {ridge_dof(X, lam):.2f}")  # p → 0

# lasso df is just the number of nonzero coefficients
from sklearn.linear_model import Lasso
print("lasso df:", (Lasso(alpha=0.1).fit(X, y).coef_ != 0).sum())`;

const codeLib = `import numpy as np
from sklearn.linear_model import Ridge

# use effective df in an information criterion to pick λ without CV
def aic(X, y, lam):
    n, p = X.shape
    beta = Ridge(alpha=lam, fit_intercept=False).fit(X, y).coef_
    rss = ((y - X @ beta)**2).sum()
    d = np.linalg.svd(X, compute_uv=False)
    dof = (d**2 / (d**2 + lam)).sum()
    return n * np.log(rss / n) + 2 * dof

best = min(np.logspace(-2, 3, 50), key=lambda lam: aic(X, y, lam))
print("AIC-chosen λ:", best)`;




