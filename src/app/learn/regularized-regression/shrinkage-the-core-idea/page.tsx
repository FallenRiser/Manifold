import { M } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { RidgeShrinkageLab } from "@/components/labs/RidgeShrinkageLab";
import { REGRESSION_SETUP } from "@/lib/runtimeSetup";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Shrinkage: the core idea — Manifold",
  description:
    "All of regularization is one idea: pull the coefficients toward zero. Smaller coefficients mean a smoother, more stable model — and, surprisingly, a biased estimate can beat the unbiased one.",
};

export default function ShrinkagePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }]}
        time="about 5 minutes"
        title={<>Shrinkage: the core idea</>}
        intro={<>
          Strip regularization down to its essence and it&rsquo;s a single word: <strong>shrinkage</strong>. Pull
        the coefficients toward zero. Everything else — Ridge, Lasso, elastic-net — is a variation on how.
        </>}
      />

      <div className="lesson">
        <h2>What shrinkage means</h2>
        <p>
          OLS picks the coefficients that best fit the training data, wherever they land. Shrinkage adds a
          competing pressure: a force pulling every coefficient toward zero. The final estimate is a{" "}
          <strong>compromise</strong> between &ldquo;fit the data&rdquo; and &ldquo;stay small,&rdquo; with{" "}
          <M>{String.raw`\lambda`}</M> setting how hard the second force pulls.
        </p>

        <h2>Why smaller coefficients are better</h2>
        <ul style={ul}>
          <li>
            <strong>Smoother functions.</strong> Large coefficients let the model make big swings from small
            input changes. Shrinking them flattens those swings, so the fitted function is gentler and less
            wiggly — exactly what tamed the degree-9 polynomial.
          </li>
          <li>
            <strong>Lower variance.</strong> Smaller coefficients are less sensitive to the particular
            training sample, so predictions are more stable across datasets.
          </li>
          <li>
            <strong>Robust to correlated features.</strong> When features are collinear, OLS coefficients can
            explode into huge canceling values. Shrinkage keeps them bounded and sane.
          </li>
        </ul>

        <h2>The surprise: biased can beat unbiased</h2>
        <p>
          OLS is famously the <strong>best <em>unbiased</em> linear estimator</strong> (Gauss–Markov). So how
          can a shrunk, deliberately <em>biased</em> estimate ever be better? Because &ldquo;best unbiased&rdquo; only
          means lowest variance <em>among unbiased estimators</em> — and what we actually care about is total
          error, bias <em>plus</em> variance. By accepting a little bias, shrinkage can cut variance enough
          that the total error falls below OLS&rsquo;s. Unbiasedness is not the same as accuracy.
        </p>

        <Callout color="var(--c-regression)" title={<>A famous, almost paradoxical result</>}>
          The <strong>James–Stein</strong> result showed that when estimating three or more quantities at
            once, an estimator that shrinks them toward a common point <em>always</em> beats the obvious
            unbiased estimate, in total squared error. Shrinkage isn&rsquo;t a hack that sometimes helps — there&rsquo;s
            deep theory saying it&rsquo;s the right thing to do. We give that its own page in the theory chapter.
        </Callout>

        <h2>How much to shrink, and how</h2>
        <p>
          Two questions define the whole family:
        </p>
        <ul style={ul}>
          <li>
            <strong>How much?</strong> Controlled by <M>{String.raw`\lambda`}</M> — the bias–variance dial from
            the last page, set by cross-validation.
          </li>
          <li>
            <strong>How?</strong> Controlled by which penalty you use. <strong>Ridge</strong> shrinks
            everything proportionally toward zero; <strong>Lasso</strong> shrinks and can snap coefficients
            <em> exactly</em> to zero. Same goal, strikingly different behaviour — and the next page&rsquo;s
            geometry explains why.
          </li>
        </ul>

        <h2>Watch coefficients shrink</h2>
        <RidgeShrinkageLab />
        <CodeBlock setup={REGRESSION_SETUP} fromScratch={codeScratch} withLibrary={codeLib} />

        <PrevNext prev={{ href: "/learn/regularized-regression/overfitting-and-bias-variance", label: <>← Overfitting &amp; the bias–variance tradeoff</> }} next={{ href: "/learn/regularized-regression/penalty-vs-constraint", label: <>Next up · Penalty vs constraint: two views →</> }} />
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np

def ridge_fit(X, y, lam):
    p = X.shape[1]
    return np.linalg.solve(X.T @ X + lam * np.eye(p), X.T @ y)

# the L2 norm of the coefficients shrinks monotonically as λ grows
for lam in [0, 1, 10, 100, 1000]:
    beta = ridge_fit(X, y, lam)
    print(f"λ={lam:>5}:  ||β|| = {np.linalg.norm(beta):.3f}")`;

const codeLib = `import numpy as np
from sklearn.linear_model import Ridge

# coefficient magnitudes contract toward 0 as the penalty tightens
for lam in [0.01, 1, 100]:
    coef = Ridge(alpha=lam).fit(X, y).coef_
    print(f"λ={lam:>5}:  ||β||={np.linalg.norm(coef):.2f}  max|β|={np.abs(coef).max():.2f}")`;


const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };


