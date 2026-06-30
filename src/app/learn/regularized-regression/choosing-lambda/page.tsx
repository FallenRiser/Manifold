import Link from "next/link";
import { M } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "Choosing λ — Manifold",
  description:
    "λ is the one knob that matters in ridge, and you can't read it off the training data — more λ always means more training error. Cross-validation finds the λ that generalises best.",
};

export default function ChoosingLambdaPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-regression)")}>Regression</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 6 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        Choosing λ
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        Ridge has exactly one hyperparameter, and everything rides on it. The catch: you can&rsquo;t pick it from
        the training data, because the training error only ever gets <em>worse</em> as λ grows. You need an
        estimate of <em>generalization</em>.
      </p>

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

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-regression)", marginBottom: 4 }}>
            Practical tips
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            Search λ on a <strong>log scale</strong> (e.g. <M>{String.raw`10^{-3}`}</M> to <M>{String.raw`10^{3}`}</M>) —
            it spans orders of magnitude. Always <strong>standardize features first</strong>, or the penalty
            hits large-scale features unfairly (its own page). And consider the <strong>one-standard-error
            rule</strong>: rather than the exact CV minimum, pick the simplest model (largest λ) within one
            standard error of it, for a more robust, slightly more regularized choice.
          </p>
        </div>

        <h2>Other selection criteria</h2>
        <ul style={ul}>
          <li><strong>Leave-one-out CV (LOOCV)</strong> — ridge has a famous closed form (Generalized Cross-Validation, GCV) that gives LOOCV error almost for free, no refitting per fold.</li>
          <li><strong>Information criteria (AIC/BIC)</strong> — use ridge&rsquo;s <em>effective</em> degrees of freedom (a theory-chapter topic) as the complexity term.</li>
          <li><strong>A validation set</strong> — with plenty of data, a single held-out set is simpler than full CV.</li>
        </ul>
        <p>Cross-validation remains the default: it makes the fewest assumptions and directly estimates what you care about.</p>

        <h2>Let the library sweep λ for you</h2>
        <CodeBlock fromScratch={codeScratch} withLibrary={codeLib} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/regularized-regression/ridge-and-multicollinearity" style={navLink}>← Ridge &amp; multicollinearity</Link>
          <Link href="/learn/regularized-regression/the-lasso" style={{ ...navLink, fontWeight: 600 }}>Next up · The Lasso →</Link>
        </div>
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

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const ol: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.85 };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-regression) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-regression) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0" };
