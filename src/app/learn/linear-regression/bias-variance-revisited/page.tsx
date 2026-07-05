import { BiasVarianceLab } from "@/components/labs/BiasVarianceLab";
import { CodeBlock } from "@/components/CodeBlock";
import { REGRESSION_SETUP } from "@/lib/runtimeSetup";
import { Backlinks } from "@/components/Backlinks";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { Quiz } from "@/components/Quiz";

const codeScratch = `import numpy as np

rng = np.random.default_rng(13)
truth = lambda x: np.sin(2*np.pi*x)
x_test = 0.5

def experiment(deg, trials=300, n=30):
    preds = []
    for _ in range(trials):                      # many fresh datasets
        x = rng.uniform(0, 1, n)
        y = truth(x) + rng.normal(scale=0.2, size=n)
        c = np.polyfit(x, y, deg)
        preds.append(np.polyval(c, x_test))
    preds = np.array(preds)
    bias2 = (preds.mean() - truth(x_test))**2    # how far off on average
    var   = preds.var()                          # how much it wobbles
    return bias2, var

for d in [1, 3, 9]:
    b, v = experiment(d)
    print(f"degree {d}: bias^2 {b:.3f}  variance {v:.3f}  total {b+v:.3f}")`;

const codeLib = `import numpy as np
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import PolynomialFeatures
from sklearn.linear_model import LinearRegression

rng = np.random.default_rng(13)
truth = lambda x: np.sin(2*np.pi*x)
x_test = np.array([[0.5]])

def experiment(deg, trials=300, n=30):
    preds = []
    for _ in range(trials):
        x = rng.uniform(0, 1, n).reshape(-1, 1)
        y = truth(x.ravel()) + rng.normal(scale=0.2, size=n)
        model = make_pipeline(PolynomialFeatures(deg), LinearRegression()).fit(x, y)
        preds.append(model.predict(x_test)[0])
    preds = np.array(preds)
    return (preds.mean() - truth(0.5))**2, preds.var()

for d in [1, 3, 9]:
    b, v = experiment(d)
    print(f"degree {d}: bias^2 {b:.3f}  variance {v:.3f}  total {b+v:.3f}")`;

export const metadata = {
  title: "Bias-variance, revisited — Manifold",
  description:
    "Tying the mathematical tools of regularization and transformations back to the fundamental tradeoff of machine learning.",
};

export default function BiasVarianceRevisitedPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }, { label: "Fixing", color: "var(--brand)" }]}
        time="about 3 minutes"
        title={<>Bias-variance, revisited</>}
        intro={<>
          Every decision you make in building a regression model moves you along
        the bias-variance spectrum. Let's map everything we've learned back to
        the fundamental tradeoff.
        </>}
      />

      <Backlinks label="Related" items={[
        { label: "Cross-validation", href: "/learn/linear-regression/cross-validation-bias-variance" },
        { label: "Regularization", href: "/learn/linear-regression/regularization" },
        { label: "Polynomial & interaction terms", href: "/learn/linear-regression/polynomial-and-interaction-terms" },
      ]} />

      <div className="lesson">
        <p>
          In the Evaluation chapter, we learned that <strong>High Bias</strong>
          {" "}means the model is too simple (underfitting), and <strong>High
          Variance</strong> means the model is too complex (overfitting).
        </p>
        <p>
          You now have a toolkit of levers. Pulling any lever reduces one type
          of error by intentionally increasing the other.
        </p>

        <BiasVarianceLab />

        <h2>Levers that reduce bias (and increase variance)</h2>
        <p>
          If your model is underfitting (high training error, high test error),
          you need to make it more flexible.
        </p>
        <ul style={{ paddingLeft: "1.4em", lineHeight: 1.85, color: "var(--muted)", fontSize: 15 }}>
          <li><strong style={{ color: "var(--ink)" }}>Adding polynomial terms.</strong> Bending the straight line to fit curves drastically reduces bias, but higher degrees (like x⁵) invite massive variance.</li>
          <li><strong style={{ color: "var(--ink)" }}>Adding interaction terms.</strong> Allowing the effect of x₁ to depend on x₂ makes the model much more nuanced, but exponentially increases the number of parameters.</li>
          <li><strong style={{ color: "var(--ink)" }}>Decreasing regularization (λ → 0).</strong> Removing the penalty lets the coefficients grow to fit the training data exactly.</li>
        </ul>

        <h2>Levers that reduce variance (and increase bias)</h2>
        <p>
          If your model is overfitting (near-zero training error, terrible test
          error), you need to constrain its flexibility.
        </p>
        <ul style={{ paddingLeft: "1.4em", lineHeight: 1.85, color: "var(--muted)", fontSize: 15 }}>
          <li><strong style={{ color: "var(--ink)" }}>Increasing regularization (λ).</strong> Ridge and Lasso act as shock absorbers. They prevent the model from assigning wild coefficients to chase noise. You gain generalisation by accepting slightly worse training predictions.</li>
          <li><strong style={{ color: "var(--ink)" }}>Dropping features.</strong> Simply throwing away highly collinear or irrelevant features reduces the hypothesis space the model can explore.</li>
          <li><strong style={{ color: "var(--ink)" }}>Getting more data.</strong> This is the only "free lunch". Quadrupling your sample size allows you to support a complex model without increasing its variance.</li>
        </ul>

        <Callout color="var(--c-fundamentals)" title={<>The art of modeling</>}>
          Modern machine learning practice often follows a simple recipe: start
            by building a model so complex that it achieves near-zero bias
            (massively overfits the training set). Then, apply heavy
            regularization (like Ridge, Lasso, or Dropout in neural networks) to
            squeeze the variance out until test error is minimized.
        </Callout>

        <h2>Measure the decomposition yourself</h2>
        <p>
          Refit on hundreds of fresh datasets and watch one test point: the spread of
          predictions <em>is</em> the variance, their average miss <em>is</em> the bias.
          Degree 1 is all bias, degree 9 is all variance.
        </p>
        <CodeBlock setup={REGRESSION_SETUP} fromScratch={codeScratch} withLibrary={codeLib} />

        <Quiz
          title="Checkpoint · Fixing & optimizing"
          questions={[
            {
              q: <>You turn the ridge penalty λ up. What happens to bias and variance?</>,
              options: ["Both go down — that's why we regularize", "Bias up, variance down — you're buying stability with a little systematic error", "Bias down, variance up", "Neither moves; only the coefficients shrink"],
              answer: 1,
              explain: <>Shrinking coefficients toward zero makes the model less able to chase the data (higher bias) but far less sensitive to which sample you drew (lower variance). The sweet spot in the middle is what the λ-CV curve finds.</>,
            },
            {
              q: <>You need a model that automatically drops useless features. Ridge or lasso?</>,
              options: ["Ridge — it shrinks harder", "Lasso — its corner-shaped penalty can set coefficients exactly to zero", "Either works the same", "Neither; only trees select features"],
              answer: 1,
              explain: <>Ridge&rsquo;s circular penalty shrinks coefficients toward zero but essentially never <em>to</em> zero; lasso&rsquo;s diamond has corners on the axes, so solutions land there and features drop out entirely — built-in selection.</>,
            },
            {
              q: <>Residual spread grows with the fitted value and the target is right-skewed. The classic first fix:</>,
              options: ["Add more features", "Log-transform the target", "Increase the learning rate", "Drop the largest residuals"],
              answer: 1,
              explain: <>A log target turns multiplicative, percentage-style errors into additive, roughly constant ones — often fixing the fan and the skew at once. (Weighted least squares is the alternative when you&rsquo;d rather model the variance than transform it.)</>,
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/linear-regression/regularization", label: <>← Regularization</> }} next={{ href: "/learn/linear-regression/confidence-intervals", label: <>Next up · Confidence intervals →</> }} />
      </div>
    </article>
  );
}




