import Link from "next/link";
import { M } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Case B: robustness to outliers — Manifold",
  description:
    "A controlled experiment that isolates SVR's loss function. Two linear models — least squares and a linear-kernel SVR — fit the same linear data. Corrupt 10% of the training targets with gross outliers: least squares blows up 3.7×, SVR barely moves.",
};

export default function CaseBPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }, { label: "In the wild · a real run", color: "var(--c-regression)" }]}
        time="about 8 minutes"
        title={<>Case B: robustness to outliers</>}
        intro={<>
          Case A showed off the kernel. This case isolates the <em>other</em> half of SVR — the{" "}
          <Link href="/learn/support-vector-regression/the-epsilon-insensitive-loss" style={inlineLink}>ε-insensitive loss</Link>{" "}
          — in a setting where nonlinearity is irrelevant and only robustness is on trial.
        </>}
      />

      <div className="lesson">
        <h2>A controlled experiment</h2>
        <p>
          To see the loss function and nothing else, we remove every other variable. The target is{" "}
          <strong>genuinely linear</strong>, <M>{String.raw`y = 1.5x - 0.5 + \text{noise}`}</M>, and{" "}
          <em>both</em> models are linear: ordinary least squares, and a <strong>linear-kernel</strong> SVR. Same
          hypothesis class, same features, same data. The only thing that differs is how each one scores an error —
          squared error versus ε-insensitive. Then we poison 10% of the training targets with gross outliers and
          refit.
        </p>
        <CodeBlock fromScratch={code} />
        <CodeOutput label="output">{output}</CodeOutput>

        <h2>Reading the result</h2>
        <ul style={ul}>
          <li>
            <strong>On clean data they tie.</strong> RMSE <M>{String.raw`0.3564`}</M> vs{" "}
            <M>{String.raw`0.3538`}</M> — indistinguishable. With no outliers, the two loss functions recover
            essentially the same line. So any later difference is caused purely by the corruption.
          </li>
          <li>
            <strong>Least squares blows up 3.7×.</strong> Corrupting 15 of 150 targets sends its test RMSE from{" "}
            <M>{String.raw`0.3564`}</M> to <M>{String.raw`1.3205`}</M>. The squared-error loss weights a residual by
            its <em>square</em>, so a handful of huge residuals dominate the objective and drag the whole line toward
            the outliers.
          </li>
          <li>
            <strong>SVR barely flinches — <M>{String.raw`\times 1.0`}</M>.</strong> Its RMSE moves from{" "}
            <M>{String.raw`0.3538`}</M> to <M>{String.raw`0.3494`}</M> — statistically unchanged. Two mechanisms
            from earlier chapters combine: the loss grows only <em>linearly</em> past the tube (not quadratically),
            and the <Link href="/learn/support-vector-regression/the-dual-and-the-kernel-trick" style={inlineLink}>box constraint <M>{String.raw`\alpha \le C`}</M></Link> caps how much any single point can pull. An outlier
            hits both ceilings and simply stops mattering.
          </li>
        </ul>

        <Callout color="var(--c-regression)" title={<>What this isolates</>}>
          Because the data is linear and both models are linear, the kernel plays no role here at all. The entire
            3.7× gap is the loss function — a clean, controlled demonstration that SVR&rsquo;s robustness is real and
            comes from exactly where the theory said it would: the shape of the ε-insensitive loss and the box
            constraint on the multipliers.
        </Callout>

        <h2>The two halves of SVR, seen separately</h2>
        <p>
          Cases A and B were designed as a pair. Together they dissect SVR into its two independent ideas:
        </p>
        <ul style={ul}>
          <li><strong>The kernel</strong> (Case A) — buys nonlinearity; halved the forecast error on a chaotic series.</li>
          <li><strong>The ε-insensitive loss</strong> (Case B) — buys robustness and sparsity; shrugged off outliers that wrecked least squares.</li>
        </ul>
        <p>
          Most real problems want some of both, and SVR is the model that carries them in one estimator.
        </p>

        <h2>The Regression family, complete</h2>
        <p>
          This closes the entire Regression family. You have climbed from a straight line to a curved,
          infinite-dimensional, sparse, robust regressor — each step adding exactly one idea:
        </p>
        <ul style={ul}>
          <li><Link href="/learn/linear-regression" style={inlineLink}>Linear regression</Link> — fit a plane.</li>
          <li><Link href="/learn/regularized-regression" style={inlineLink}>Ridge, Lasso &amp; Elastic-net</Link> — shrink the weights to generalise.</li>
          <li><Link href="/learn/polynomial-regression" style={inlineLink}>Polynomial &amp; basis functions</Link> — bend the line with explicit features.</li>
          <li><Link href="/learn/kernel-ridge-regression" style={inlineLink}>Kernel ridge</Link> — bend it with implicit, infinite features via the kernel trick.</li>
          <li><strong>Support vector regression</strong> — keep only the points that matter, and forgive small errors.</li>
        </ul>

        <Callout color="var(--c-regression)" title={<>Where to go next</>}>
          With Regression complete, the natural next families are <strong>classification</strong> — the support
            vector machine is SVR&rsquo;s sibling, the same margin idea turned to discrete labels — and{" "}
            <strong>trees &amp; ensembles</strong>, the usual winner on messy tabular data. Explore the whole
            curriculum on the <Link href="/map" style={{ color: "var(--brand)", textDecoration: "none" }}>map</Link>.
        </Callout>

        <Quiz
          accent="var(--c-regression)"
          questions={[
            {
              q: "Why are both the data and both models kept linear in this experiment?",
              options: ["To isolate the loss function — with nonlinearity removed, any difference must come from how errors are scored", "Because SVR only works on linear data", "To make it run faster"],
              answer: 0,
              explain: "Same hypothesis class and features means the kernel plays no role; the entire robustness gap is attributable to the loss function alone.",
            },
            {
              q: "Why does least squares blow up 3.7× under 10% outliers while SVR stays flat?",
              options: ["Squared error weights residuals by their square, so huge residuals dominate; SVR's loss grows linearly and the box constraint caps each point", "SVR removed the outliers first", "Least squares used fewer features"],
              answer: 0,
              explain: "The quadratic loss lets a few gross residuals dominate the objective. SVR's linear-past-the-tube loss plus the α ≤ C cap limit any single point's pull.",
            },
            {
              q: "Together, Cases A and B demonstrate that SVR's two independent strengths are…",
              options: ["The kernel (nonlinearity) and the ε-insensitive loss (robustness + sparsity)", "Speed and simplicity", "Regularisation and cross-validation"],
              answer: 0,
              explain: "Case A isolated the kernel's nonlinearity; Case B isolated the loss's robustness. SVR carries both in one model.",
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/support-vector-regression/case-a-forecasting", label: <>← Case A: forecasting a chaotic series</> }} next={{ href: "/map", label: <>Explore the curriculum map →</> }} />
      </div>
    </article>
  );
}

const code = `import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.svm import SVR

# genuinely LINEAR target; both models are linear -> only the loss differs
X = rng.uniform(-3, 3, size=(200, 1))
y = 1.5 * X[:, 0] - 0.5 + rng.normal(0, 0.4, 200)

def fit_score(y_train):
    ols = LinearRegression().fit(Xtr, y_train)
    svr = SVR(kernel="linear", C=10, epsilon=0.1).fit(Xtr, y_train)
    return rmse(yte, ols.predict(Xte)), rmse(yte, svr.predict(Xte))

# corrupt 10% of training targets with gross outliers, then refit
y_bad = ytr.copy()
bad = rng.choice(len(y_bad), int(0.10 * len(y_bad)), replace=False)
y_bad[bad] += rng.choice([-1, 1], bad.size) * rng.uniform(20, 30, bad.size)`;

const output = `=== Case B: robustness to outliers (same linear hypothesis) ===
corrupted 15 of 150 training targets (10%) with gross outliers
  least squares  test RMSE:  clean=0.3564  ->  corrupted=1.3205  (x3.7 worse)
  SVR (linear)   test RMSE:  clean=0.3538  ->  corrupted=0.3494  (x1.0 worse)`;

const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const inlineLink: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
