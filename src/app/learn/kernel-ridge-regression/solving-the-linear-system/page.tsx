import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { Quiz } from "@/components/Quiz";
import { LoocvLab } from "@/components/labs/LoocvLab";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Solving the linear system — Manifold",
  description:
    "You never invert (K+λI). Cholesky solves it faster and more stably; λ doubles as a numerical conditioner; and one eigendecomposition gives the solution for every λ at once — plus a closed-form leave-one-out CV that tunes λ almost for free.",
};

export default function SolvingLinearSystemPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }, { label: "Tier 3 · under the hood", color: "var(--c-regression)" }]}
        time="about 10 minutes"
        title={<>Solving the linear system</>}
        intro={<>
          The <Link href="/learn/kernel-ridge-regression/the-kernel-ridge-solution" style={inlineLink}>solution</Link>{" "}
          <M>{String.raw`\alpha = (K + \lambda I)^{-1}y`}</M> is closed-form — but you should never literally invert
        that matrix. How it is actually solved reveals why <M>{String.raw`\lambda`}</M> stabilises the numerics, and
        hands you a way to tune it almost for free.
        </>}
      />

      <div className="lesson">
        <h2>Don&rsquo;t invert — factor and solve</h2>
        <p>
          Writing <M>{String.raw`\alpha = (K + \lambda I)^{-1}y`}</M> is fine on paper, but forming the explicit
          inverse is both slower and less numerically stable than solving the system directly. Because{" "}
          <M>{String.raw`\lambda > 0`}</M>, the matrix <M>{String.raw`A = K + \lambda I`}</M> is{" "}
          <strong>symmetric positive definite</strong> — the ideal case. Its <strong>Cholesky factorisation</strong>{" "}
          <M>{String.raw`A = LL^\top`}</M> costs about <M>{String.raw`\tfrac{1}{3}n^3`}</M> flops — half a general LU
          solve — after which two triangular solves recover <M>{String.raw`\alpha`}</M>:
        </p>
        <MathBlock>{String.raw`A = LL^\top,\qquad L z = y,\qquad L^\top \alpha = z.`}</MathBlock>
        <p>
          This is exactly what <code>scikit-learn</code>&rsquo;s <code>KernelRidge</code> does under the hood. The
          takeaway: the &ldquo;matrix inverse&rdquo; in the formula is a factor-and-solve in practice, never a literal{" "}
          <code>inv()</code>.
        </p>

        <h2>λ is also a numerical conditioner</h2>
        <p>
          The kernel matrix <M>{String.raw`K`}</M> is often <strong>ill-conditioned</strong>: two nearby training
          points produce nearly identical rows, so <M>{String.raw`K`}</M> has eigenvalues close to zero and is nearly
          singular. Adding <M>{String.raw`\lambda I`}</M> shifts <em>every</em> eigenvalue up by{" "}
          <M>{String.raw`\lambda`}</M>, so the condition number becomes
        </p>
        <MathBlock>{String.raw`\kappa(K + \lambda I) = \frac{s_{\max} + \lambda}{s_{\min} + \lambda},`}</MathBlock>
        <p>
          where <M>{String.raw`s_{\min}, s_{\max}`}</M> are the smallest and largest eigenvalues of{" "}
          <M>{String.raw`K`}</M>. As <M>{String.raw`\lambda`}</M> grows the ratio falls toward 1 — a perfectly
          conditioned system. So <M>{String.raw`\lambda`}</M> carries <em>two</em> meanings at once:
        </p>
        <ul style={ul}>
          <li><strong>Statistical</strong> — it regularises, trading variance for bias (the ridge story).</li>
          <li><strong>Numerical</strong> — it conditions the linear system, keeping the solve stable and accurate.</li>
        </ul>

        <Callout color="var(--c-regression)" title={<>Two readings of one knob</>}>
          The same <M>{String.raw`\lambda`}</M> that stops the model from overfitting also stops the linear algebra
            from blowing up. That is not a coincidence: near-duplicate points are exactly the directions the model is
            least able to resolve, statistically <em>and</em> numerically. Regularisation and conditioning are the
            same act seen from two sides.
        </Callout>

        <h2>One eigendecomposition, every λ</h2>
        <p>
          If you plan to try many values of <M>{String.raw`\lambda`}</M> — and you will, since it is the main knob —
          there is a much better route than re-factoring for each. Eigendecompose{" "}
          <M>{String.raw`K = U\,\mathrm{diag}(s)\,U^\top`}</M> <strong>once</strong>. Then for <em>any</em>{" "}
          <M>{String.raw`\lambda`}</M>:
        </p>
        <MathBlock>{String.raw`\alpha(\lambda) = (K + \lambda I)^{-1}y = U\,\mathrm{diag}\!\left(\frac{1}{s + \lambda}\right)U^\top y.`}</MathBlock>
        <p>
          The expensive <M>{String.raw`O(n^3)`}</M> eigendecomposition is amortised over the whole grid; each new{" "}
          <M>{String.raw`\lambda`}</M> then costs only <M>{String.raw`O(n^2)`}</M>. The filter factors{" "}
          <M>{String.raw`s/(s+\lambda)`}</M> even make the regularisation intuitive: directions with large eigenvalues
          (strong signal) pass through nearly untouched, while small-eigenvalue directions (noise) are shrunk toward
          zero.
        </p>

        <h2>The payoff: closed-form leave-one-out CV</h2>
        <p>
          Here is the gem that same decomposition unlocks. Define the <strong>hat matrix</strong>{" "}
          <M>{String.raw`H(\lambda) = K(K+\lambda I)^{-1}`}</M>, which maps targets to fitted values{" "}
          <M>{String.raw`\hat{y} = Hy`}</M>. A classic identity says the leave-one-out residual for point{" "}
          <M>{String.raw`i`}</M> — the error you&rsquo;d get if you refit without it — needs no refitting at all:
        </p>
        <MathBlock>{String.raw`r_i^{\text{LOO}} = \frac{y_i - \hat{y}_i}{1 - H_{ii}}.`}</MathBlock>
        <p>
          Both <M>{String.raw`\hat{y} = U\,\mathrm{diag}(s/(s+\lambda))\,U^\top y`}</M> and the diagonal{" "}
          <M>{String.raw`H_{ii} = \sum_k U_{ik}^2\,\frac{s_k}{s_k+\lambda}`}</M> come straight from the one
          eigendecomposition. So the <em>entire</em> LOOCV curve over a grid of <M>{String.raw`\lambda`}</M> is
          essentially free — no <M>{String.raw`k`}</M> refits, no data splitting. This is a genuine advantage KRR has
          that SVR does not: <Link href="/learn/kernel-ridge-regression/case-b-efficient-loocv" style={inlineLink}>Case&nbsp;B</Link> measures it at ~37× faster than 5-fold grid search.
        </p>
        <CodeBlock fromScratch={code} />

        <p>
          See it directly. The lower curve below is the exact leave-one-out error across a grid of{" "}
          <M>{String.raw`\lambda`}</M>, computed from the hat-matrix diagonal with no refitting. Drag{" "}
          <M>{String.raw`\lambda`}</M> and watch the fit and the curve move together; the marked minimum is what the
          shortcut picks:
        </p>
        <LoocvLab />

        <Quiz
          accent="var(--c-regression)"
          questions={[
            {
              q: "Why solve (K+λI)α = y by Cholesky rather than forming the inverse?",
              options: ["K+λI is symmetric positive definite, so Cholesky is ~2× faster and more numerically stable than an explicit inverse", "The inverse doesn't exist", "Cholesky gives a different answer"],
              answer: 0,
              explain: "λ>0 makes the matrix SPD, the ideal case for Cholesky — a factor plus two triangular solves, cheaper and stabler than inv().",
            },
            {
              q: "In what sense is λ a numerical conditioner, not just a statistical regulariser?",
              options: ["It shifts every eigenvalue up by λ, cutting the condition number (s_max+λ)/(s_min+λ) toward 1", "It removes duplicate rows", "It makes K diagonal"],
              answer: 0,
              explain: "Near-duplicate points make K nearly singular; adding λI lifts the small eigenvalues, stabilising the solve — the same directions that are hard statistically.",
            },
            {
              q: "What does one eigendecomposition of K buy you for tuning?",
              options: ["The solution and the closed-form LOOCV error for every λ, at O(n²) each instead of a fresh O(n³) refit", "Nothing — you must refit per λ", "A sparse model"],
              answer: 0,
              explain: "K = U diag(s) Uᵀ amortises the O(n³) cost; each λ reuses it via the filter factors s/(s+λ), and LOO residuals follow from the hat-matrix diagonal.",
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/kernel-ridge-regression/the-kernel-ridge-solution", label: <>← The kernel ridge solution</> }} next={{ href: "/learn/kernel-ridge-regression/choosing-the-kernel", label: <>Next up · Choosing the kernel →</> }} />
      </div>
    </article>
  );
}

const code = `import numpy as np
from sklearn.metrics.pairwise import rbf_kernel

K = rbf_kernel(X, gamma=gamma)
s, U = np.linalg.eigh(K)          # ONE O(n^3) step, reused for every lambda
Uty = U.T @ y
U2  = U ** 2

def loocv_mse(lam):               # closed form — no refitting
    f = s / (s + lam)             # filter factors
    yhat   = U @ (f * Uty)        # H y
    h_diag = U2 @ f               # diag(H)
    r = (y - yhat) / (1.0 - h_diag)
    return np.mean(r ** 2)

best = min(np.logspace(-4, 2, 60), key=loocv_mse)`;

const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const inlineLink: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
