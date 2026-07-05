import { M } from "@/components/Math";
import { PredictPrompt } from "@/components/PredictPrompt";
import { CodeBlock } from "@/components/CodeBlock";
import { LOGISTIC_SETUP } from "@/lib/runtimeSetup";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

const ACCENT = "var(--c-classification)";

const codeScratch = `import numpy as np

def sigmoid(z):
    return 1 / (1 + np.exp(-z))

# add a column of ones so b is just another weight
Xb = np.column_stack([np.ones(len(X_train)), X_train])
w = np.zeros(3)

for _ in range(2000):
    p = sigmoid(Xb @ w)                     # current probabilities
    grad = Xb.T @ (p - y_train) / len(y_train)   # (prediction - truth) · features
    w -= 0.1 * grad

p = sigmoid(Xb @ w)
loss = -np.mean(y_train*np.log(p) + (1-y_train)*np.log(1-p))
acc = ((p > 0.5).astype(int) == y_train).mean()
print("w (b, w1, w2):", w.round(3))
print("train log loss:", round(loss, 3))
print("train accuracy:", round(acc, 3))`;

const codeLib = `from sklearn.linear_model import LogisticRegression
from sklearn.metrics import log_loss

clf = LogisticRegression().fit(X_train, y_train)

print("coef:", clf.coef_[0].round(3), " intercept:", round(float(clf.intercept_[0]), 3))
print("train accuracy:", round(clf.score(X_train, y_train), 3))
print("test  accuracy:", round(clf.score(X_test, y_test), 3))
print("test  log loss:", round(log_loss(y_test, clf.predict_proba(X_test)), 3))`;

export const metadata = {
  title: "The beautiful gradient — Manifold",
  description: "Differentiate log loss through the sigmoid and the chain-rule mess collapses to (prediction − truth) × features — the exact same update rule linear regression uses.",
};

export default function BeautifulGradientPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: ACCENT }, { label: "Core idea", color: "var(--c-fundamentals)" }]}
        time="about 9 minutes"
        title={<>The beautiful gradient</>}
        intro={<>
          Time to train the thing. You brace for a chain-rule slog — sigmoid inside a log inside a
          sum — and instead the algebra hands you the tidiest result in machine learning.
        </>}
      />

      <div className="lesson">
        <p>
          There&rsquo;s no closed-form solution this time — no normal-equation shortcut exists for
          log loss. So we do what the regression track taught: compute the gradient, step
          downhill, repeat. The gradient of log loss with respect to the weights looks like a
          nightmare to derive. Do the calculus (the sigmoid&rsquo;s{" "}
          <M>{String.raw`\sigma' = \sigma(1-\sigma)`}</M> identity does the heavy lifting), and
          everything cancels down to:
        </p>
        <p style={{ textAlign: "center" }}>
          <M>{String.raw`\nabla_w L \;=\; \frac{1}{n} X^\top (p - y)`}</M>
        </p>
        <p>
          <strong>(prediction − truth), times the features.</strong> Now open the linear
          regression track and look at its gradient: <M>{String.raw`\tfrac{2}{n} X^\top(\hat y - y)`}</M>.
          Same shape. Different model, different loss, different meaning of the prediction — and
          the learning signal is identical: <em>how wrong you were, scaled by what you saw</em>.
          This is not a coincidence; it&rsquo;s a deep pattern (GLMs with canonical links, for the
          theory tier) — and it&rsquo;s why everything you learned about learning rates, batch vs
          SGD, and convergence transfers to classification wholesale.
        </p>

        <PredictPrompt
          accent={ACCENT}
          prompt={<>Below, the same model is trained twice: our 20-line gradient-descent loop, and sklearn&rsquo;s <code>LogisticRegression</code>. Their fitted weights will come out…</>}
          options={["Identical — same data, same bowl, same bottom", "Noticeably different", "Wildly different — one of them must be broken"]}
          nudge={<>Locked in. Run both tabs and compare the printed weights — then read on for the reason.</>}
        />

        <h2>Train it, twice</h2>
        <p>
          Both tabs run on the same 150 training points (two features, deliberately overlapping
          classes). The from-scratch loop is the gradient above, verbatim.
        </p>

        <CodeBlock setup={LOGISTIC_SETUP} fromScratch={codeScratch} withLibrary={codeLib} />

        <p>
          Our loop lands at <code>w = (0.344, −0.744, 2.405)</code> with training log loss 0.357 —
          and sklearn lands somewhere <em>else</em>: <code>(0.29, −0.639, 2.139)</code>. Same
          data, same convex bowl, different answers. Neither is broken. By default sklearn
          doesn&rsquo;t minimise pure log loss — it minimises log loss{" "}
          <strong>plus an L2 penalty</strong> on the weights (<code>C=1.0</code>), quietly pulling
          them toward zero. Regularization is so consistently useful for logistic regression that
          the most popular library in the world <em>turns it on without asking</em>. Both models
          score 88.7% on training data; the shrunken one tends to hold up better on data it
          hasn&rsquo;t seen (here: 88% on the held-out test set, log loss 0.289).
        </p>

        <Callout color={ACCENT} title={<>A detail that bites in production</>}>
          If you ever need textbook, penalty-free logistic regression from sklearn — say, to match
          coefficients from statsmodels or a stats course — you must ask for it explicitly:{" "}
          <code>LogisticRegression(penalty=None)</code>. Forgetting this is one of the most common
          &ldquo;why don&rsquo;t my coefficients match the paper&rdquo; bugs in applied work.
        </Callout>

        <h2>When does it stop?</h2>
        <p>
          Because the surface is convex, the loop stops for the boring, good reason: the gradient
          shrinks toward zero as the weights approach the single global minimum, and either a
          tolerance check or an iteration cap calls it. One caveat worth filing: if your classes
          are <em>perfectly separable</em>, unpenalised weights never stop growing — the model can
          always add confidence for free, and the &ldquo;minimum&rdquo; is off at infinity.
          (Regularization fixes it; the practice-tier page on perfect separation tells that story.)
        </p>

        <PrevNext
          prev={{ href: "/learn/logistic-regression/log-loss", label: <>← Log loss</> }}
          next={{ href: "/learn/logistic-regression/thresholds-and-the-confusion-matrix", label: <>Next up · Thresholds & the confusion matrix →</> }}
        />
      </div>
    </article>
  );
}
