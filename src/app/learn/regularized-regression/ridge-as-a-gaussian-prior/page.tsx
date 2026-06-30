import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "Ridge as a Gaussian prior (MAP) — Manifold",
  description:
    "Ridge regression is exactly the MAP estimate under a Gaussian prior on the coefficients. The penalty isn't an ad-hoc trick — it's a prior belief that coefficients are small, made precise.",
};

export default function RidgePriorPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-regression)")}>Regression</span>
        <span style={chip("var(--c-metrics)")}>Go deeper</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 7 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        Ridge as a Gaussian prior (MAP)
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        The penalty has felt a little arbitrary — why squared coefficients, why that exact form? The Bayesian
        view answers it cleanly: ridge is the most probable coefficient vector under a <em>Gaussian prior</em>
        that says &ldquo;coefficients are probably small.&rdquo;
      </p>

      <div className="lesson">
        <h2>From least squares to likelihood</h2>
        <p>
          Assume the usual regression model with Gaussian noise: <M>{String.raw`y_i = \mathbf{x}_i^\top\boldsymbol{\beta} + \varepsilon_i`}</M>{" "}
          with <M>{String.raw`\varepsilon_i \sim \mathcal{N}(0, \sigma^2)`}</M>. Then the likelihood of the data is
        </p>
        <MathBlock>{String.raw`p(\mathbf{y} \mid \boldsymbol{\beta}) \propto \exp\!\Big(-\tfrac{1}{2\sigma^2}\sum_i (y_i - \mathbf{x}_i^\top\boldsymbol{\beta})^2\Big)`}</MathBlock>
        <p>
          Maximising this likelihood is exactly minimising the squared error — that&rsquo;s why OLS is the maximum-
          likelihood estimate under Gaussian noise. Now add a prior belief about <M>{String.raw`\boldsymbol{\beta}`}</M>.
        </p>

        <h2>A Gaussian prior on the coefficients</h2>
        <p>
          Suppose, before seeing data, you believe each coefficient is probably near zero — encode that as a
          Gaussian prior centred at zero:
        </p>
        <MathBlock>{String.raw`p(\boldsymbol{\beta}) \propto \exp\!\Big(-\tfrac{1}{2\tau^2}\sum_j \beta_j^2\Big), \qquad \beta_j \sim \mathcal{N}(0, \tau^2)`}</MathBlock>
        <p>
          The prior&rsquo;s width <M>{String.raw`\tau`}</M> says how small you expect coefficients to be: a tight prior
          (small <M>{String.raw`\tau`}</M>) is a strong belief in small coefficients.
        </p>

        <h2>MAP = ridge</h2>
        <p>
          The <strong>maximum a posteriori</strong> (MAP) estimate maximises the posterior{" "}
          <M>{String.raw`p(\boldsymbol{\beta}\mid \mathbf{y}) \propto p(\mathbf{y}\mid\boldsymbol{\beta})\,p(\boldsymbol{\beta})`}</M>.
          Taking logs turns the product into a sum, and maximising becomes minimising:
        </p>
        <MathBlock>{String.raw`-\log p(\boldsymbol{\beta}\mid\mathbf{y}) \;\propto\; \sum_i (y_i - \mathbf{x}_i^\top\boldsymbol{\beta})^2 \;+\; \frac{\sigma^2}{\tau^2}\sum_j \beta_j^2`}</MathBlock>
        <p>
          That is <strong>exactly the ridge objective</strong>, with{" "}
          <M>{String.raw`\lambda = \sigma^2/\tau^2`}</M>. The penalty wasn&rsquo;t arbitrary — it&rsquo;s the negative
          log-prior. And the interpretation of <M>{String.raw`\lambda`}</M> falls out beautifully: it&rsquo;s the ratio
          of noise variance to prior variance. More noise, or a tighter prior, means more shrinkage.
        </p>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-regression)", marginBottom: 4 }}>
            Why this is more than a curiosity
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            The Bayesian lens reframes regularization as <strong>encoding prior knowledge</strong>, and unifies
            the whole family: a different prior gives a different penalty. The Gaussian prior&rsquo;s smooth bell
            shape — most mass near zero but with light tails and no spike at zero — is exactly why ridge shrinks
            everything but zeroes nothing. Swap in a sharply-peaked prior and you get sparsity, which is the
            next page&rsquo;s Lasso story.
          </p>
        </div>

        <h2>Verify MAP equals ridge numerically</h2>
        <CodeBlock fromScratch={codeScratch} withLibrary={codeLib} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/regularized-regression/which-when" style={navLink}>← Ridge vs Lasso vs Elastic-net</Link>
          <Link href="/learn/regularized-regression/lasso-as-a-laplace-prior" style={{ ...navLink, fontWeight: 600 }}>Next up · Lasso as a Laplace prior →</Link>
        </div>
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np

# the MAP estimate under Gaussian noise + Gaussian prior IS ridge:
#   λ = σ²/τ²  (noise variance / prior variance)
sigma2, tau2 = 0.5, 2.0
lam = sigma2 / tau2

p = X.shape[1]
beta_map = np.linalg.solve(X.T @ X + lam * np.eye(p), X.T @ y)

from sklearn.linear_model import Ridge
beta_ridge = Ridge(alpha=lam, fit_intercept=False).fit(X, y).coef_
print(np.allclose(beta_map, beta_ridge))   # True`;

const codeLib = `from sklearn.linear_model import BayesianRidge

# a fully Bayesian ridge: it infers the prior width and noise level from the data,
# so it effectively LEARNS λ instead of cross-validating it
model = BayesianRidge().fit(X, y)
print(model.coef_)                 # posterior-mean coefficients
print(model.lambda_, model.alpha_) # estimated prior precision & noise precision`;

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-regression) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-regression) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0" };
