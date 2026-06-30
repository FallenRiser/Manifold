import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { RidgePolyLab } from "@/components/labs/RidgePolyLab";

export const metadata = {
  title: "Why regularize? — Manifold",
  description:
    "Ordinary least squares fits the training data as hard as it can — and that's exactly the problem. Regularization adds a penalty on the coefficients to trade a little training fit for far better generalization.",
};

export default function RegHubPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-regression)")}>Regression</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 7 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 44, lineHeight: 1.08, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        Why regularize?
      </h1>
      <p style={{ fontSize: 17.5, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        Linear regression fits the training data as closely as it possibly can. Regularization is the
        deliberate act of stopping it from trying too hard — and it&rsquo;s one of the highest-leverage ideas
        in all of machine learning.
      </p>

      <div className="lesson">
        <h2>The problem with fitting too well</h2>
        <p>
          Ordinary least squares (OLS) has one goal: make the residuals as small as possible on the{" "}
          <em>training</em> data. With few features that&rsquo;s fine. But give it many features — especially
          more features than data points, or features that are correlated — and it will contort itself to
          chase every wiggle, including the noise. The coefficients blow up, the model fits the training set
          beautifully, and it <strong>fails on new data</strong>. That&rsquo;s overfitting, and it&rsquo;s the default
          failure mode of flexible models.
        </p>

        <h2>The fix: penalize big coefficients</h2>
        <p>
          Regularization changes the objective. Instead of minimising just the training error, we minimise
          the error <em>plus</em> a penalty that grows with the size of the coefficients:
        </p>
        <MathBlock>{String.raw`\min_{\boldsymbol{\beta}} \; \underbrace{\sum_{i=1}^{n}\big(y_i - \mathbf{x}_i^\top\boldsymbol{\beta}\big)^2}_{\text{fit the data}} \; + \; \underbrace{\lambda \, \lVert \boldsymbol{\beta} \rVert}_{\text{stay small}}`}</MathBlock>
        <p>
          The hyperparameter <M>{String.raw`\lambda`}</M> sets the exchange rate. At{" "}
          <M>{String.raw`\lambda = 0`}</M> you&rsquo;re back to plain OLS. As <M>{String.raw`\lambda`}</M> grows, the
          model accepts a little more training error in return for smaller, simpler coefficients — and a
          model that generalises. This deliberate trade is the whole game.
        </p>

        <h2>See it happen</h2>
        <p>
          Below, a degree-9 polynomial is fit to noisy data with a ridge penalty. At tiny{" "}
          <M>{String.raw`\lambda`}</M> it interpolates the training points and oscillates wildly — perfect
          train error, terrible test error. Raise <M>{String.raw`\lambda`}</M> and watch it relax toward the
          true curve, then over-smooth if you go too far.
        </p>
        <RidgePolyLab />

        <h2>Two penalties, three methods</h2>
        <p>
          Everything in this track flows from <em>which</em> norm you penalise:
        </p>
        <ul style={ul}>
          <li>
            <strong>Ridge (L2)</strong> penalises <M>{String.raw`\sum \beta_j^2`}</M> — shrinks all
            coefficients smoothly toward zero, but never exactly to zero. Great for correlated features and
            stability.
          </li>
          <li>
            <strong>Lasso (L1)</strong> penalises <M>{String.raw`\sum |\beta_j|`}</M> — shrinks <em>and</em>{" "}
            sets some coefficients exactly to zero, performing automatic feature selection.
          </li>
          <li>
            <strong>Elastic-net</strong> blends both, getting Lasso&rsquo;s sparsity with Ridge&rsquo;s stability on
            correlated groups.
          </li>
        </ul>
        <p>
          The difference between &ldquo;shrink&rdquo; and &ldquo;shrink to exactly zero&rdquo; turns out to be deep and
          geometric — it&rsquo;s why Lasso does feature selection and Ridge doesn&rsquo;t — and we&rsquo;ll see exactly why.
        </p>

        <h2>The same idea, in one line of code</h2>
        <CodeBlock fromScratch={codeScratch} withLibrary={codeLib} />

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-regression)", marginBottom: 4 }}>
            Why this matters everywhere
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            Regularization isn&rsquo;t a regression-only trick. The exact same penalty-on-the-weights idea is{" "}
            weight decay in neural networks, the soft margin in SVMs, and the prior in Bayesian models. Ridge
            and Lasso are the cleanest place to understand it completely — penalty, geometry, and the
            bias–variance payoff all visible at once — so it pays off across the entire field.
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/linear-regression" style={navLink}>← Linear regression</Link>
          <Link href="/learn/regularized-regression/overfitting-and-bias-variance" style={{ ...navLink, fontWeight: 600 }}>Next up · Overfitting &amp; the bias–variance tradeoff →</Link>
        </div>
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np

# Ridge in closed form: (XᵀX + λI) β = Xᵀy  — OLS plus λ on the diagonal
def ridge_fit(X, y, lam):
    p = X.shape[1]
    return np.linalg.solve(X.T @ X + lam * np.eye(p), X.T @ y)

# λ = 0 recovers ordinary least squares; larger λ shrinks β toward 0
beta_ols   = ridge_fit(X, y, 0.0)
beta_ridge = ridge_fit(X, y, 1.0)`;

const codeLib = `from sklearn.linear_model import Ridge, Lasso, ElasticNet

ridge = Ridge(alpha=1.0).fit(X, y)            # L2 penalty (alpha is λ)
lasso = Lasso(alpha=0.1).fit(X, y)            # L1 penalty -> sparse coefficients
enet  = ElasticNet(alpha=0.1, l1_ratio=0.5).fit(X, y)   # blend of both
print(lasso.coef_)   # some entries are exactly 0`;

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-regression) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-regression) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0" };
