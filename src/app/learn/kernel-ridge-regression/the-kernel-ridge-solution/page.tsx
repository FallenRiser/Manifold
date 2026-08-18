import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { KernelRidgeLab } from "@/components/labs/KernelRidgeLab";
import { LabFrame } from "@/components/LabFrame";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "The kernel ridge solution — Manifold",
  description:
    "The whole algorithm in one line: build the kernel matrix, add λ to its diagonal, solve once for α, and predict with a similarity-weighted sum. No iteration, no feature engineering.",
};

export default function KRRSolutionPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }, { label: "Tier 2 · in depth", color: "var(--c-regression)" }]}
        time="about 7 minutes"
        title={<>The kernel ridge solution</>}
        intro={<>
          Everything so far collapses into a remarkably compact algorithm. Kernel ridge regression fits with a
        single linear solve and predicts with a weighted sum of kernels — no gradient descent, no explicit
        features, no iteration at all.
        </>}
      />

      <div className="lesson">
        <h2>The algorithm, end to end</h2>
        <p>Given training points and a chosen kernel <M>{String.raw`k`}</M>:</p>
        <ol style={ol}>
          <li>Build the <strong>kernel matrix</strong> <M>{String.raw`K`}</M>, with <M>{String.raw`K_{ij} = k(x_i, x_j)`}</M> — all pairwise similarities.</li>
          <li>Add the penalty to the diagonal and <strong>solve once</strong> for the dual coefficients: <M>{String.raw`\alpha = (K + \lambda I)^{-1} y`}</M>.</li>
          <li><strong>Predict</strong> at any new <M>{String.raw`x`}</M> by a similarity-weighted sum over the training points.</li>
        </ol>
        <MathBlock>{String.raw`\alpha = (K + \lambda I)^{-1} y \qquad\qquad \hat{y}(x) = \sum_{i=1}^{n} \alpha_i\, k(x_i, x)`}</MathBlock>
        <p>
          That&rsquo;s the entire model. There is no <M>{String.raw`w`}</M> to store — the trained model is the set
          of coefficients <M>{String.raw`\alpha`}</M> together with the training points they weight.
        </p>

        <h2>Reading the two knobs off the formula</h2>
        <ul style={ul}>
          <li>
            <strong><M>{String.raw`\lambda`}</M> (regularisation).</strong> It&rsquo;s added to the diagonal of{" "}
            <M>{String.raw`K`}</M>. Larger <M>{String.raw`\lambda`}</M> makes the system better-conditioned and
            shrinks the <M>{String.raw`\alpha`}</M> toward zero — a smoother, flatter fit. As{" "}
            <M>{String.raw`\lambda \to \infty`}</M> the fit flattens to the mean; as{" "}
            <M>{String.raw`\lambda \to 0`}</M> it interpolates every point.
          </li>
          <li>
            <strong>The kernel (and its width <M>{String.raw`\gamma`}</M>).</strong> It fills <M>{String.raw`K`}</M>
            itself, deciding what &ldquo;similar&rdquo; means. This controls the <em>shape</em> of what the model
            can fit, independent of <M>{String.raw`\lambda`}</M>&rsquo;s smoothing.
          </li>
        </ul>

        <LabFrame
          accent="var(--c-regression)"
          tryThis={<>Set γ = 60 and sweep λ from 0.001 → 1: watch the fit go from interpolating spikes to a flat line. Then fix λ = 0.01 and sweep γ.</>}
          insight={<>λ adds to the diagonal (smoothing); γ fills the matrix (shape). They&rsquo;re different levers — which is why you must tune them together, the next page.</>}
        >
          <KernelRidgeLab />
        </LabFrame>

        <h2>Why the diagonal term guarantees a solution</h2>
        <p>
          The kernel matrix <M>{String.raw`K`}</M> is positive semi-definite, so it can be singular (some
          eigenvalues zero) — in which case <M>{String.raw`K^{-1}`}</M> doesn&rsquo;t exist. Adding{" "}
          <M>{String.raw`\lambda I`}</M> lifts every eigenvalue by <M>{String.raw`\lambda > 0`}</M>, making{" "}
          <M>{String.raw`K + \lambda I`}</M> strictly positive definite and always invertible. So regularisation
          isn&rsquo;t only about overfitting here — it also <strong>guarantees the solution exists and is
          numerically stable</strong>, exactly as it did for ordinary ridge.
        </p>

        <CodeBlock fromScratch={codeScratch} withLibrary={codeLib} />

        <Callout color="var(--c-regression)" title={<>Fit cost is in the solve, prediction cost is in the sum</>}>
          Fitting inverts an <M>{String.raw`n \times n`}</M> matrix — <M>{String.raw`O(n^3)`}</M>, done once.
            Predicting evaluates <M>{String.raw`k(x_i, x)`}</M> against <em>every</em> training point —{" "}
            <M>{String.raw`O(n)`}</M> per query, because the model keeps all the data (its <M>{String.raw`\alpha`}</M>
            are generally all non-zero). That density is the price of kernel ridge, and the reason its companion,
            SVR, exists.
        </Callout>

        <Quiz
          accent="var(--c-regression)"
          questions={[
            {
              q: "What are the trained parameters of a kernel ridge model?",
              options: ["The dual coefficients α, kept alongside the training points", "A weight vector w in feature space", "Just λ and γ"],
              answer: 0,
              explain: "There's no explicit w — the model is α = (K+λI)⁻¹y plus the training points, and predictions are Σ αᵢ k(xᵢ, x).",
            },
            {
              q: "Adding λI to the kernel matrix does two things:",
              options: ["Regularises the fit AND guarantees K+λI is invertible", "Only speeds up training", "Removes the need for a kernel"],
              answer: 0,
              explain: "λ shrinks the coefficients (smoothing) and lifts every eigenvalue above zero, so K+λI is positive definite and always solvable.",
            },
            {
              q: "Predicting with kernel ridge is O(n) per query because…",
              options: ["The sum runs over all n training points (α is generally dense)", "It re-solves the linear system each time", "It re-reads the labels"],
              answer: 0,
              explain: "Every training point contributes k(xᵢ, x) to the prediction. Unlike SVR, KRR keeps all points, so there's no sparsity to exploit.",
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/kernel-ridge-regression/kernels-as-similarity", label: <>← Kernels as similarity</> }} next={{ href: "/learn/kernel-ridge-regression/choosing-the-kernel", label: <>Next up · Choosing the kernel →</> }} />
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np

def rbf(X, Z, gamma):
    # ||x - z||^2 for every pair, then exp(-gamma * .)
    sq = (X**2).sum(1)[:, None] + (Z**2).sum(1)[None, :] - 2 * X @ Z.T
    return np.exp(-gamma * sq)

def krr_fit(X, y, gamma, lam):
    K = rbf(X, X, gamma)
    alpha = np.linalg.solve(K + lam * np.eye(len(X)), y)   # one solve
    return alpha

def krr_predict(alpha, X_train, X_new, gamma):
    return rbf(X_new, X_train, gamma) @ alpha               # similarity-weighted sum

alpha = krr_fit(X_train, y_train, gamma=0.1, lam=1e-2)
y_pred = krr_predict(alpha, X_train, X_test, gamma=0.1)`;

const codeLib = `from sklearn.kernel_ridge import KernelRidge

# alpha = (K + lam I)^-1 y is solved internally; 'alpha' here is lambda
krr = KernelRidge(kernel="rbf", alpha=1e-2, gamma=0.1)
krr.fit(X_train, y_train)
y_pred = krr.predict(X_test)

print("dual coefs stored:", krr.dual_coef_.shape)   # one per training point`;

const ol: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.85 };
const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
