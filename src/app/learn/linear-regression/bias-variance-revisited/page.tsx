import Link from "next/link";
import { BiasVarianceLab } from "@/components/labs/BiasVarianceLab";
import { CodeBlock } from "@/components/CodeBlock";
import { Backlinks } from "@/components/Backlinks";

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
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-regression)")}>Regression</span>
        <span style={chip("var(--brand)")}>Fixing</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 3 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        Bias-variance, revisited
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 8px", maxWidth: 620 }}>
        Every decision you make in building a regression model moves you along
        the bias-variance spectrum. Let's map everything we've learned back to
        the fundamental tradeoff.
      </p>

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

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-fundamentals)", marginBottom: 4 }}>
            The art of modeling
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            Modern machine learning practice often follows a simple recipe: start
            by building a model so complex that it achieves near-zero bias
            (massively overfits the training set). Then, apply heavy
            regularization (like Ridge, Lasso, or Dropout in neural networks) to
            squeeze the variance out until test error is minimized.
          </p>
        </div>

        <h2>Measure the decomposition yourself</h2>
        <p>
          Refit on hundreds of fresh datasets and watch one test point: the spread of
          predictions <em>is</em> the variance, their average miss <em>is</em> the bias.
          Degree 1 is all bias, degree 9 is all variance.
        </p>
        <CodeBlock fromScratch={codeScratch} withLibrary={codeLib} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/linear-regression/regularization" style={navLink}>← Regularization</Link>
          <Link href="/learn/linear-regression/confidence-intervals" style={navLink}>Next up · Confidence intervals →</Link>
        </div>
      </div>
    </article>
  );
}

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-fundamentals) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-fundamentals) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0 0" };
