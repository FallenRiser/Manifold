import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "Ridge regression — Manifold",
  description:
    "Ridge regression adds an L2 penalty — the sum of squared coefficients — to least squares. It shrinks every coefficient smoothly toward zero, stabilising the fit without ever discarding a feature.",
};

export default function RidgePage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-regression)")}>Regression</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 6 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        Ridge regression
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        Ridge is the first and gentlest regularizer: penalise the <em>squared</em> size of the coefficients.
        It shrinks them all smoothly toward zero, never to zero — the workhorse fix for unstable,
        correlated, or high-variance least-squares fits.
      </p>

      <div className="lesson">
        <h2>The objective</h2>
        <p>
          Ridge regression — also called L2 regularization or Tikhonov regularization — minimises the usual
          squared error plus <M>{String.raw`\lambda`}</M> times the sum of squared coefficients:
        </p>
        <MathBlock>{String.raw`\min_{\boldsymbol{\beta}} \; \sum_{i=1}^{n}\big(y_i - \mathbf{x}_i^\top\boldsymbol{\beta}\big)^2 \;+\; \lambda \sum_{j=1}^{p} \beta_j^2`}</MathBlock>
        <p>
          The penalty term is <M>{String.raw`\lambda \lVert \boldsymbol{\beta} \rVert_2^2`}</M>. Squaring each
          coefficient means large coefficients are punished much more than small ones, so ridge pushes hardest
          on the biggest, most extreme weights — exactly the ones that signal overfitting.
        </p>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-regression)", marginBottom: 4 }}>
            Don&rsquo;t penalise the intercept
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            The sum runs over the <em>slopes</em> <M>{String.raw`\beta_1 \dots \beta_p`}</M>, not the intercept{" "}
            <M>{String.raw`\beta_0`}</M>. Shrinking the intercept would just bias the predictions toward zero for
            no good reason — the intercept only sets the overall level. Every library handles this for you, but
            it&rsquo;s worth knowing the penalty is on the relationships, not the baseline.
          </p>
        </div>

        <h2>Smooth, proportional shrinkage</h2>
        <p>
          The defining behaviour of ridge: it shrinks every coefficient toward zero, but <strong>never
          exactly to zero</strong>. A feature with a tiny true effect gets a tiny coefficient, not a removed
          one. So ridge keeps all <M>{String.raw`p`}</M> features in the model — it does not do feature
          selection. What it does brilliantly is <em>stabilise</em>: it prevents any coefficient from blowing
          up, which is precisely what you want when features are correlated or you have nearly as many features
          as data points.
        </p>

        <h2>When ridge is the right call</h2>
        <ul style={ul}>
          <li><strong>Correlated features</strong> — ridge spreads weight sensibly across them instead of letting OLS produce huge canceling coefficients (its own page next).</li>
          <li><strong>Many features, all plausibly relevant</strong> — when you believe most features contribute a little, shrinking-not-dropping is the honest model.</li>
          <li><strong>p close to or exceeding n</strong> — OLS has no unique solution there; ridge always does (the closed form is always invertible).</li>
          <li><strong>You want stability over interpretability</strong> — ridge gives a steadier, lower-variance fit; if you need a short list of features, that&rsquo;s Lasso&rsquo;s job.</li>
        </ul>

        <h2>It&rsquo;s a one-line change to OLS</h2>
        <p>
          Ridge keeps least-squares&rsquo; biggest advantage — a clean closed-form solution — which the next page
          derives. In code it&rsquo;s a single parameter:
        </p>
        <CodeBlock fromScratch={codeScratch} withLibrary={codeLib} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/regularized-regression/penalty-vs-constraint" style={navLink}>← Penalty vs constraint</Link>
          <Link href="/learn/regularized-regression/the-closed-form-solution" style={{ ...navLink, fontWeight: 600 }}>Next up · The closed-form solution →</Link>
        </div>
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np

# Ridge objective gradient = 0  ->  (XᵀX + λI) β = Xᵀy
def ridge_fit(X, y, lam):
    p = X.shape[1]
    I = np.eye(p)
    I[0, 0] = 0                       # don't penalize the intercept column
    return np.linalg.solve(X.T @ X + lam * I, X.T @ y)

beta = ridge_fit(X, y, lam=1.0)`;

const codeLib = `from sklearn.linear_model import Ridge

# alpha is λ; sklearn excludes the intercept from the penalty automatically
ridge = Ridge(alpha=1.0).fit(X, y)
print(ridge.coef_, ridge.intercept_)`;

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-regression) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-regression) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0" };
