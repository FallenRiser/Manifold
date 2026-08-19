import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Case B: efficient leave-one-out CV — Manifold",
  description:
    "Kernel ridge's signature trick, measured. One eigendecomposition of the kernel matrix delivers the exact leave-one-out CV error for a whole grid of λ in closed form — picking the same λ as 5-fold grid search at roughly 37× the speed.",
};

export default function CaseBLoocvPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }, { label: "In the wild · a real run", color: "var(--c-regression)" }]}
        time="about 7 minutes"
        title={<>Case B: efficient leave-one-out CV</>}
        intro={<>
          Case A showed KRR&rsquo;s cost — a dense model. This case shows what that density buys back: a tuning
          shortcut no other kernel method has. The <Link href="/learn/kernel-ridge-regression/solving-the-linear-system" style={inlineLink}>eigendecomposition</Link>, put to work and timed — the code and its actual
          output are below.
        </>}
      />

      <div className="lesson">
        <h2>The idea, recalled</h2>
        <p>
          Leave-one-out CV is the gold-standard tuning signal — refit <M>{String.raw`n`}</M> times, each holding out
          one point — but normally far too expensive to run. For kernel ridge it is nearly free. The hat matrix{" "}
          <M>{String.raw`H(\lambda) = K(K+\lambda I)^{-1}`}</M> gives every LOO residual in closed form:
        </p>
        <MathBlock>{String.raw`r_i^{\text{LOO}} = \frac{y_i - \hat{y}_i}{1 - H_{ii}},\qquad \text{LOOCV}(\lambda) = \frac{1}{n}\sum_i \big(r_i^{\text{LOO}}\big)^2.`}</MathBlock>
        <p>
          Eigendecompose <M>{String.raw`K = U\,\mathrm{diag}(s)\,U^\top`}</M> <em>once</em>, and both{" "}
          <M>{String.raw`\hat{y}`}</M> and <M>{String.raw`\mathrm{diag}(H)`}</M> follow from the filter factors{" "}
          <M>{String.raw`s/(s+\lambda)`}</M> for any <M>{String.raw`\lambda`}</M> at <M>{String.raw`O(n^2)`}</M>. So
          the whole LOOCV curve over a grid costs one eigendecomposition, not <M>{String.raw`n`}</M> refits per grid
          point.
        </p>

        <h2>The experiment</h2>
        <p>
          Tune <M>{String.raw`\lambda`}</M> over a 60-point log grid on 600 samples, two ways: the closed-form LOOCV
          above, versus scikit-learn&rsquo;s <code>GridSearchCV</code> doing honest 5-fold cross-validation. Same grid,
          same kernel — the question is whether the shortcut finds the same answer, and how much faster.
        </p>
        <CodeBlock fromScratch={code} />
        <CodeOutput label="output">{output}</CodeOutput>

        <h2>Reading the result</h2>
        <ul style={ul}>
          <li>
            <strong>Same regime.</strong> Closed-form LOOCV picks <M>{String.raw`\lambda \approx 0.0054`}</M>; 5-fold
            grid search picks <M>{String.raw`\lambda \approx 0.0042`}</M>. They land on the same tiny corner of the
            grid — the difference is just LOO-versus-5-fold sampling, not a disagreement. Either would give you the
            same model.
          </li>
          <li>
            <strong>~37× faster.</strong> The shortcut finished in about <M>{String.raw`0.1`}</M> s against the grid
            search&rsquo;s <M>{String.raw`\sim 3.8`}</M> s — because the single <M>{String.raw`O(n^3)`}</M>
            eigendecomposition is amortised across all 60 <M>{String.raw`\lambda`}</M> values, while{" "}
            <code>GridSearchCV</code> refits <M>{String.raw`5 \times 60 = 300`}</M> models. The gap widens with the
            grid size. <em>(Wall-clock times are machine-dependent; the ratio is the point.)</em>
          </li>
          <li>
            <strong>And it&rsquo;s <em>leave-one-out</em>, not a coarser k-fold.</strong> You get the finest-grained CV
            signal there is, for less than the price of the coarse one. That is unique to KRR&rsquo;s closed form —
            <Link href="/learn/support-vector-regression" style={inlineLink}>SVR</Link> has no such identity and must
            re-solve its QP for every <M>{String.raw`(\lambda, \varepsilon)`}</M> it tries.
          </li>
        </ul>

        <Callout color="var(--c-regression)" title={<>The two cases together</>}>
          Case A: KRR is dense, so its model is larger than SVR&rsquo;s. Case B: that same density gives a closed form
            whose eigendecomposition tunes <M>{String.raw`\lambda`}</M> almost for free. The trade-off is coherent —
            <strong> KRR pays in model size and is repaid in tuning simplicity.</strong> When you have the memory and
            want painless, principled regularisation, that is an excellent deal.
        </Callout>

        <h2>The Kernel Ridge track, complete</h2>
        <p>
          You now hold kernel ridge end to end: from bending ridge regression with the{" "}
          <Link href="/learn/kernel-ridge-regression/the-kernel-trick" style={inlineLink}>kernel trick</Link>, through
          the <Link href="/learn/kernel-ridge-regression/the-dual-form-of-ridge" style={inlineLink}>dual</Link> and the
          closed-form solution, the numerics and cost, the{" "}
          <Link href="/learn/kernel-ridge-regression/the-representer-theorem" style={inlineLink}>representer theorem</Link>{" "}
          and the <Link href="/learn/kernel-ridge-regression/kernel-ridge-and-gaussian-processes" style={inlineLink}>Gaussian-process connection</Link>, to scaling and these two real-run cases.
        </p>

        <Callout color="var(--c-regression)" title={<>Next: its sparse cousin</>}>
          The natural next step is <Link href="/learn/support-vector-regression" style={{ color: "var(--brand)", textDecoration: "none" }}>Support Vector Regression</Link> — the same kernel idea with the{" "}
            ε-insensitive loss, which trades KRR&rsquo;s closed form for sparsity and outlier robustness. You have already
            met it in the comparisons; now you can study it in full. Or step back to the{" "}
            <Link href="/map" style={{ color: "var(--brand)", textDecoration: "none" }}>curriculum map</Link>.
        </Callout>

        <Quiz
          accent="var(--c-regression)"
          questions={[
            {
              q: "Did closed-form LOOCV and 5-fold grid search pick different λ?",
              options: ["No — both landed in the same regime (≈0.005 vs ≈0.004); the small gap is LOO-vs-5-fold sampling", "Yes, wildly different", "LOOCV failed to pick one"],
              answer: 0,
              explain: "They agree on the same corner of the grid. The shortcut is a faithful stand-in for honest CV, not an approximation that changes the answer.",
            },
            {
              q: "Why is the closed-form route ~37× faster here?",
              options: ["One eigendecomposition is amortised over all 60 λ; GridSearchCV refits 5×60 = 300 models", "It uses fewer data points", "It skips regularisation"],
              answer: 0,
              explain: "The O(n³) cost is paid once; each λ then reuses it at O(n²). k-fold grid search instead retrains a full model per fold per grid point.",
            },
            {
              q: "Why can't SVR use the same trick?",
              options: ["SVR has no closed-form hat matrix — its QP must be re-solved for every (λ, ε), so there's no eigendecomposition to amortise", "SVR is always faster anyway", "SVR doesn't use a kernel"],
              answer: 0,
              explain: "The LOOCV identity comes from KRR's linear closed form. SVR's solution is a constrained QP with no such analytic shortcut.",
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/kernel-ridge-regression/case-a-dense-vs-sparse", label: <>← Case A: dense vs sparse</> }} next={{ href: "/learn/support-vector-regression", label: <>Next track · Support vector regression →</> }} />
      </div>
    </article>
  );
}

const code = `import numpy as np, time
from sklearn.metrics.pairwise import rbf_kernel
from sklearn.kernel_ridge import KernelRidge
from sklearn.model_selection import GridSearchCV

lambdas = np.logspace(-4, 2, 60)

# --- closed-form LOOCV: one eigendecomposition, reused for every lambda ---
K = rbf_kernel(X, gamma=0.03)
s, U = np.linalg.eigh(K)                 # the single O(n^3) step
Uty, U2 = U.T @ y, U ** 2
def loocv(lam):
    f = s / (s + lam)
    r = (y - U @ (f * Uty)) / (1.0 - U2 @ f)
    return np.mean(r ** 2)
best_cf = min(lambdas, key=loocv)

# --- the naive way: 5-fold grid search, refitting 5 x 60 = 300 models ---
best_gs = GridSearchCV(KernelRidge(kernel="rbf", gamma=0.03),
            {"alpha": lambdas}, cv=5,
            scoring="neg_mean_squared_error").fit(X, y).best_params_["alpha"]`;

const output = `=== Case B: efficient leave-one-out CV for lambda ===
n=600  gamma=0.03  grid=60 lambdas (1e-4 ... 1e2)
  closed-form LOOCV : best lambda=0.005356   time=102 ms
  5-fold GridSearch : best lambda=0.004238   time=3815 ms
  -> same regime, closed-form is 37x faster (one eigendecomposition amortised over the whole grid)`;

const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const inlineLink: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
