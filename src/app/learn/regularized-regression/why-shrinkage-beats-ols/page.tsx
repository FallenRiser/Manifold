import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "Why shrinkage beats OLS (James–Stein) — Manifold",
  description:
    "Stein's paradox: when estimating three or more quantities at once, shrinking them toward a common point always beats the obvious unbiased estimate. It's the deep reason regularization works.",
};

export default function JamesSteinPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-regression)")}>Regression</span>
        <span style={chip("var(--c-metrics)")}>Go deeper</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 7 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        Why shrinkage beats OLS (James–Stein)
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        The deepest justification for regularization is a result so counterintuitive it&rsquo;s called a paradox.
        Shrinkage isn&rsquo;t just a useful heuristic — for estimating several things at once, it is provably,
        unavoidably better than not shrinking.
      </p>

      <div className="lesson">
        <h2>The setup</h2>
        <p>
          Suppose you want to estimate several unknown means <M>{String.raw`\theta_1, \dots, \theta_p`}</M> at once,
          each from one noisy observation <M>{String.raw`y_j \sim \mathcal{N}(\theta_j, 1)`}</M>. The obvious
          estimate is just to use each observation as-is: <M>{String.raw`\hat\theta_j = y_j`}</M>. It&rsquo;s unbiased,
          it&rsquo;s the maximum-likelihood estimate, and for a <em>single</em> mean it&rsquo;s provably optimal. Surely you
          can&rsquo;t do better?
        </p>

        <h2>Stein&rsquo;s paradox</h2>
        <p>
          You can. In 1956 Charles Stein showed that as soon as <M>{String.raw`p \ge 3`}</M>, the obvious estimate
          is <strong>inadmissible</strong> — there exists another estimate with lower total expected squared error
          for <em>every</em> possible value of the <M>{String.raw`\theta_j`}</M>. The James–Stein estimator that
          beats it shrinks all the observations toward a common point (say the origin):
        </p>
        <MathBlock>{String.raw`\hat{\boldsymbol\theta}_{\text{JS}} = \Big(1 - \frac{(p-2)}{\lVert \mathbf{y} \rVert^2}\Big)\,\mathbf{y}`}</MathBlock>
        <p>
          That factor in front is less than one, so it pulls every estimate toward zero — exactly shrinkage. The
          astonishing part: this wins <em>uniformly</em>, no matter what the true values are, even though the
          observations might be completely unrelated quantities (Stein&rsquo;s famous example mixed the price of tea,
          a baseball average, and more). Shrinking unrelated estimates toward each other still lowers total error.
        </p>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-regression)", marginBottom: 4 }}>
            How can shrinking unrelated things help?
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            The key is that we&rsquo;re judged on <strong>total</strong> error across all <M>{String.raw`p`}</M>
            estimates, not each one separately. Pure noise inflates the observations&rsquo; overall magnitude, so
            pulling them inward removes more variance than the bias it adds — on average, across the whole batch.
            Any single estimate might get slightly worse, but the <em>sum</em> reliably improves. It&rsquo;s the
            bias–variance trade from the very first page, now as a theorem: a little bias, a lot less variance,
            lower total error.
          </p>
        </div>

        <h2>The connection to ridge</h2>
        <p>
          Ridge regression is shrinkage of exactly this kind — it pulls the coefficient estimates toward zero —
          and it&rsquo;s closely related to the James–Stein estimator. The paradox is the theoretical bedrock under
          everything in this track: it says that when you&rsquo;re estimating many parameters (every nontrivial
          regression), the unbiased OLS estimate is <em>not</em> the one with lowest expected error, and a shrunk
          estimate can dominate it. Regularization isn&rsquo;t settling for a worse-but-simpler model — for{" "}
          <M>{String.raw`p \ge 3`}</M> it can be strictly better, full stop.
        </p>

        <h2>The takeaway for practice</h2>
        <ul style={ul}>
          <li><strong>Unbiased is not optimal.</strong> Gauss–Markov optimality of OLS is only <em>among unbiased</em> estimators — a small club, and not the one you want to be in.</li>
          <li><strong>Shrinkage is principled, not a hack.</strong> There&rsquo;s a theorem, not just an intuition, behind &ldquo;pull the coefficients in.&rdquo;</li>
          <li><strong>The more parameters, the more shrinkage helps.</strong> High-dimensional problems are exactly where the gain is largest — which is why regularization is indispensable there.</li>
        </ul>

        <h2>See the paradox in a simulation</h2>
        <CodeBlock fromScratch={codeScratch} withLibrary={codeLib} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/regularized-regression/degrees-of-freedom" style={navLink}>← Degrees of freedom &amp; effective complexity</Link>
          <Link href="/learn/california-housing-capstone" style={{ ...navLink, fontWeight: 600 }}>Next up · Capstone: California housing →</Link>
        </div>
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np

rng = np.random.default_rng(0)
p, trials = 8, 20000
mle_err = js_err = 0.0
for _ in range(trials):
    theta = rng.normal(0, 3, p)          # true means (any values)
    y = theta + rng.normal(0, 1, p)      # one noisy observation each
    mle = y                              # the "obvious" unbiased estimate
    js = (1 - (p - 2) / (y @ y)) * y     # James–Stein: shrink toward 0
    mle_err += ((mle - theta)**2).sum()
    js_err  += ((js  - theta)**2).sum()
print("MLE total error:", round(mle_err / trials, 2))
print("James-Stein    :", round(js_err  / trials, 2))   # strictly smaller`;

const codeLib = `# Ridge is shrinkage in the same spirit; on multi-output problems the gain is real.
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.model_selection import cross_val_score

ols   = -cross_val_score(LinearRegression(), X, y, cv=5,
                         scoring="neg_mean_squared_error").mean()
ridge = -cross_val_score(Ridge(alpha=10),   X, y, cv=5,
                         scoring="neg_mean_squared_error").mean()
print("OLS MSE:", round(ols, 3), " Ridge MSE:", round(ridge, 3))`;

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-regression) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-regression) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0" };
