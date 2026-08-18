import Link from "next/link";
import { M } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "A worked example — Manifold",
  description:
    "Kernel ridge end to end on real nonlinear data: scale, grid-search λ and γ, and compare to a linear baseline. The kernel lifts test R² from 0.67 to 0.86 — the whole track in one script.",
};

export default function WorkedExamplePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }, { label: "Tier 2 · apply it", color: "var(--c-regression)" }]}
        time="about 7 minutes"
        title={<>A worked example</>}
        intro={<>
          Time to run the whole pipeline on real, nonlinear data — scale the features, grid-search λ and γ, and
        measure the payoff against a linear baseline. Every number here comes from a reproducible script.
        </>}
      />

      <div className="lesson">
        <h2>The problem</h2>
        <p>
          We use <code>make_friedman1</code>, a standard nonlinear regression benchmark:{" "}
          <M>{String.raw`y = 10\sin(\pi x_0 x_1) + 20(x_2 - 0.5)^2 + 10 x_3 + 5 x_4 + \varepsilon`}</M>. It has a
          sine interaction and a quadratic term, so a straight-line model is doomed — exactly where kernels earn
          their keep. Ten features (five of them pure noise), 400 samples, a 300/100 train/test split.
        </p>

        <h2>The pipeline</h2>
        <p>
          Scale first (the RBF kernel reads distances), then grid-search <M>{String.raw`\lambda`}</M> (called{" "}
          <code>alpha</code> in scikit-learn) and <M>{String.raw`\gamma`}</M> together by cross-validation, and
          score once on the held-out test set. Reproducible in <code>scripts/kernel_cases.py</code>:
        </p>
        <CodeBlock fromScratch={code} />
        <CodeOutput label="output · scripts/kernel_cases.py">{output}</CodeOutput>

        <h2>Reading the result</h2>
        <ul style={ul}>
          <li>
            <strong>Linear ridge: <M>{String.raw`R^2 = 0.667`}</M>.</strong> A well-tuned linear model explains
            two-thirds of the variance — the best a plane can do on a curved target, and clearly not enough.
          </li>
          <li>
            <strong>Kernel ridge: <M>{String.raw`R^2 = 0.860`}</M>.</strong> Swapping the linear kernel for an RBF
            — nothing else changed in the workflow — cuts the RMSE from 2.73 to 1.76. The kernel captured the
            sine interaction and the quadratic bump that the plane couldn&rsquo;t.
          </li>
          <li>
            <strong>The winning knobs were small:</strong> <M>{String.raw`\lambda = 10^{-3}`}</M> (little
            smoothing needed — the data isn&rsquo;t very noisy) and <M>{String.raw`\gamma = 0.01`}</M> (a wide,
            gentle kernel, because the true function is smooth). The grid search found them without any manual
            fiddling.
          </li>
        </ul>

        <Callout color="var(--c-regression)" title={<>What just happened, in one line</>}>
          The same closed-form ridge machinery, run through a kernel, turned a hopeless linear fit into a strong
            nonlinear one — no feature engineering, no iteration, just a choice of kernel and a 2-D grid search.
            That is the entire value proposition of kernel ridge regression.
        </Callout>

        <p>
          On this same data, <Link href="/learn/support-vector-regression" style={inlineLink}>support vector
          regression</Link> scores a near-identical <M>{String.raw`R^2 = 0.838`}</M> — but from a model built on
          just 166 of the 300 points. If a sparse, robust model is worth a sliver of accuracy, that&rsquo;s the next
          track.
        </p>

        <Callout color="var(--c-regression)" title={<>That completes the kernel ridge regression track</>}>
          You&rsquo;ve gone from &ldquo;ridge can&rsquo;t bend&rsquo; through the kernel trick, the dual form, the{" "}
            <M>{String.raw`(K+\lambda I)^{-1}y`}</M> solution, tuning and cost, and the theory that underwrites it
            all — to a real nonlinear fit. Next in the Regression family:{" "}
            <Link href="/learn/support-vector-regression" style={inlineLink}>support vector regression</Link>,
            the sparse, tube-based cousin. Or revisit anything from the{" "}
            <Link href="/map" style={{ color: "var(--brand)", textDecoration: "none" }}>curriculum map</Link>.
        </Callout>

        <Quiz
          accent="var(--c-regression)"
          questions={[
            {
              q: "Switching from a linear to an RBF kernel (nothing else changed) did what to test R²?",
              options: ["Raised it from 0.667 to 0.860 by capturing the nonlinearity", "Left it unchanged", "Lowered it"],
              answer: 0,
              explain: "The RBF kernel fit the sine interaction and quadratic term a plane can't, cutting RMSE from 2.73 to 1.76 — the kernel's whole value.",
            },
            {
              q: "The tuned λ was tiny (10⁻³). What does that tell you about the data?",
              options: ["It isn't very noisy, so little smoothing was needed", "It has many outliers", "The kernel was wrong"],
              answer: 0,
              explain: "λ is the smoothing/noise knob. A small optimal λ means the signal is clean enough that heavy shrinkage would only add bias.",
            },
            {
              q: "SVR scored 0.838 vs kernel ridge's 0.860 on the same data. The trade-off was…",
              options: ["Slightly less accuracy for a sparse model (166 of 300 points) and robustness", "More accuracy for more cost", "No difference at all"],
              answer: 0,
              explain: "The ε-insensitive loss gives up a little accuracy for a compact support-vector model and outlier tolerance — the reason to consider SVR next.",
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/kernel-ridge-regression/kernel-ridge-vs-svr-vs-linear", label: <>← Kernel ridge vs SVR vs linear</> }} next={{ href: "/learn/support-vector-regression", label: <>Next track · Support vector regression →</> }} />
      </div>
    </article>
  );
}

const code = `from sklearn.datasets import make_friedman1
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import Ridge
from sklearn.kernel_ridge import KernelRidge
from sklearn.metrics import r2_score
import numpy as np

X, y = make_friedman1(n_samples=400, noise=1.0, random_state=0)
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.25, random_state=0)
sc = StandardScaler().fit(Xtr); Xtr, Xte = sc.transform(Xtr), sc.transform(Xte)

# linear baseline
lin = GridSearchCV(Ridge(), {"alpha": [0.01, 0.1, 1, 10, 100]}, cv=5).fit(Xtr, ytr)

# kernel ridge: grid-search lambda (alpha) and gamma together
krr = GridSearchCV(KernelRidge(kernel="rbf"),
                   {"alpha": [1e-3, 1e-2, 1e-1, 1],
                    "gamma": [0.01, 0.03, 0.1, 0.3, 1]}, cv=5).fit(Xtr, ytr)

print("linear ridge R^2:", round(r2_score(yte, lin.predict(Xte)), 4))
print("kernel ridge R^2:", round(r2_score(yte, krr.predict(Xte)), 4))
print("best (lambda, gamma):", krr.best_params_)`;

const output = `Linear ridge:
  best alpha=10
  test R^2=0.6667  RMSE=2.7254

Kernel ridge (RBF):
  best alpha=0.001  gamma=0.01
  test R^2=0.8605  RMSE=1.7630
  model uses ALL 300 training points (dense dual coefficients)`;

const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const inlineLink: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
