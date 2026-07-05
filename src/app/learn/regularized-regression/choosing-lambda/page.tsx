import { Quiz } from "@/components/Quiz";
import { M } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { LambdaCVLab } from "@/components/labs/LambdaCVLab";
import { REGRESSION_SETUP } from "@/lib/runtimeSetup";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Choosing λ — Manifold",
  description:
    "λ is the one knob that matters in ridge, and you can't read it off the training data — more λ always means more training error. Cross-validation finds the λ that generalises best.",
};

export default function ChoosingLambdaPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }]}
        time="about 6 minutes"
        title={<>Choosing λ</>}
        intro={<>
          Ridge has exactly one hyperparameter, and everything rides on it. The catch: you can&rsquo;t pick it from
        the training data, because the training error only ever gets <em>worse</em> as λ grows. You need an
        estimate of <em>generalization</em>.
        </>}
      />

      <div className="lesson">
        <h2>Why training error can&rsquo;t choose λ</h2>
        <p>
          At <M>{String.raw`\lambda = 0`}</M> ridge is OLS, which by definition minimises training error. Every
          increase in λ trades training fit for simplicity, so training error rises monotonically with λ.
          &ldquo;Minimise training error&rdquo; therefore always says <M>{String.raw`\lambda = 0`}</M> — useless. The
          quantity that actually has a sweet spot is the error on <em>unseen</em> data, the U-curve from the
          bias–variance page.
        </p>

        <h2>Cross-validation: the standard answer</h2>
        <p>
          k-fold cross-validation estimates that generalization error for each candidate λ:
        </p>
        <ol style={ol}>
          <li>Split the training data into <M>{String.raw`k`}</M> folds (5 or 10 is typical).</li>
          <li>For each candidate λ, train on <M>{String.raw`k-1`}</M> folds and measure error on the held-out fold, rotating through all folds.</li>
          <li>Average the held-out errors — that&rsquo;s the CV error for that λ.</li>
          <li>Pick the λ with the lowest CV error; refit on all the data at that λ.</li>
        </ol>
        <p>
          Because ridge&rsquo;s entire coefficient path can be computed cheaply, sweeping a grid of λ values is
          fast — and there&rsquo;s even a closed-form shortcut for leave-one-out CV (below) that costs barely more
          than a single fit.
        </p>

        <LambdaCVLab />

        <Callout color="var(--c-regression)" title={<>Practical tips</>}>
          Search λ on a <strong>log scale</strong> (e.g. <M>{String.raw`10^{-3}`}</M> to <M>{String.raw`10^{3}`}</M>) —
            it spans orders of magnitude. Always <strong>standardize features first</strong>, or the penalty
            hits large-scale features unfairly (its own page). And consider the <strong>one-standard-error
            rule</strong>: rather than the exact CV minimum, pick the simplest model (largest λ) within one
            standard error of it, for a more robust, slightly more regularized choice.
        </Callout>

        <h2>Other selection criteria</h2>
        <ul style={ul}>
          <li><strong>Leave-one-out CV (LOOCV)</strong> — ridge has a famous closed form (Generalized Cross-Validation, GCV) that gives LOOCV error almost for free, no refitting per fold.</li>
          <li><strong>Information criteria (AIC/BIC)</strong> — use ridge&rsquo;s <em>effective</em> degrees of freedom (a theory-chapter topic) as the complexity term.</li>
          <li><strong>A validation set</strong> — with plenty of data, a single held-out set is simpler than full CV.</li>
        </ul>
        <p>Cross-validation remains the default: it makes the fewest assumptions and directly estimates what you care about.</p>

        <h2>Let the library sweep λ for you</h2>
        <CodeBlock setup={REGRESSION_SETUP} fromScratch={codeScratch} withLibrary={codeLib} />

        <Quiz
          accent="var(--c-regression)"
          questions={[
            {
              q: "You choose λ by…",
              options: ["Cross-validated held-out error across a grid of λ values", "Whichever λ minimises training error", "Theory alone — λ = 1 is standard"],
              answer: 0,
              explain: "Training error always votes for λ = 0 (less restraint always fits the training set better). Only held-out error can reveal the sweet spot where shrinkage starts paying.",
            },
            {
              q: "With strongly correlated features, ridge characteristically…",
              options: ["Spreads similar weight across the correlated group", "Picks one feature and zeroes the rest", "Fails to converge"],
              answer: 0,
              explain: "The L2 penalty hates any single large coefficient, so it splits credit among correlated twins: stable, but no feature selection. That's the Lasso's department.",
            },
            {
              q: "Skipping standardization before ridge means…",
              options: ["The penalty punishes coefficients unevenly, based on each feature's units", "Nothing — ridge is scale-invariant", "The closed form stops existing"],
              answer: 0,
              explain: "A coefficient's size depends on its feature's scale, and the penalty only sees size. Measured in millimetres vs kilometres, the same real effect gets penalised a million times harder.",
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/regularized-regression/ridge-and-multicollinearity", label: <>← Ridge &amp; multicollinearity</> }} next={{ href: "/learn/regularized-regression/the-lasso", label: <>Next up · The Lasso →</> }} />
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np
from sklearn.model_selection import KFold

def ridge_fit(X, y, lam):
    return np.linalg.solve(X.T @ X + lam * np.eye(X.shape[1]), X.T @ y)

def cv_error(X, y, lam, k=5):
    kf, errs = KFold(k, shuffle=True, random_state=0), []
    for tr, te in kf.split(X):
        beta = ridge_fit(X[tr], y[tr], lam)
        errs.append(((X[te] @ beta - y[te])**2).mean())
    return np.mean(errs)

lambdas = np.logspace(-3, 3, 50)
best = min(lambdas, key=lambda lam: cv_error(X, y, lam))
print("best λ:", best)`;

const codeLib = `import numpy as np
from sklearn.linear_model import RidgeCV

# RidgeCV uses efficient leave-one-out (GCV) by default across the λ grid
model = RidgeCV(alphas=np.logspace(-3, 3, 100)).fit(X, y)
print("chosen λ:", model.alpha_)`;


const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const ol: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.85 };


