import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { Quiz } from "@/components/Quiz";
import { KernelPickerLab } from "@/components/labs/KernelPickerLab";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Choosing the kernel — Manifold",
  description:
    "The kernel is the model's whole inductive bias. Linear, polynomial, or RBF — each assumes a different kind of shape. How to pick, what γ and the degree control, and why the choice matters more than λ.",
};

export default function ChoosingKernelPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }, { label: "Tier 2 · in depth", color: "var(--c-regression)" }]}
        time="about 7 minutes"
        title={<>Choosing the kernel</>}
        intro={<>
          The kernel decides what functions the model can even represent — it <em>is</em> the inductive bias. Get
        it right and kernel ridge fits almost anything; get it wrong and no amount of λ-tuning will save you.
        </>}
      />

      <div className="lesson">
        <h2>Each kernel assumes a different shape</h2>
        <ul style={ul}>
          <li>
            <strong>Linear</strong> <M>{String.raw`(x\cdot z)`}</M> — assumes a global plane. If that&rsquo;s the
            truth, use it: it&rsquo;s the cheapest and most interpretable, and just recovers ordinary ridge.
          </li>
          <li>
            <strong>Polynomial</strong> <M>{String.raw`(x\cdot z + c)^d`}</M> — assumes smooth <em>global</em>
            curvature of degree <M>{String.raw`d`}</M>. Good for genuine polynomial relationships and feature
            interactions, but high <M>{String.raw`d`}</M> gets unstable and extrapolates wildly.
          </li>
          <li>
            <strong>RBF / Gaussian</strong> <M>{String.raw`\exp(-\gamma \lVert x-z\rVert^2)`}</M> — assumes only
            <em> local smoothness</em>: nearby inputs give nearby outputs. It makes almost no global assumption,
            which is why it&rsquo;s the default and fits a huge range of functions.
          </li>
        </ul>

        <p>
          Switch between the three on the same data and the difference is stark — the linear kernel can only draw a
          line, the polynomial adds one global bend, and the RBF follows every local wiggle. The lower panel shows
          <em> why</em>: each kernel&rsquo;s notion of &ldquo;similarity&rdquo; has a completely different shape.
        </p>
        <KernelPickerLab />

        <Callout color="var(--c-regression)" title={<>When in doubt, RBF</>}>
          The RBF kernel is the sensible first choice for most problems: it&rsquo;s a <em>universal</em> kernel
            (can approximate any continuous function on a bounded region) and assumes nothing beyond smoothness.
            Reach for linear when you suspect the relationship really is linear (and want speed/interpretability),
            and polynomial when you specifically want bounded-degree interactions. Everything else: start RBF.
        </Callout>

        <h2>The kernel&rsquo;s own hyperparameters</h2>
        <p>Kernels aren&rsquo;t parameter-free — each carries knobs that shape the fit:</p>
        <ul style={ul}>
          <li><strong>RBF width <M>{String.raw`\gamma`}</M></strong> — the reach of each point&rsquo;s influence. Too large → spiky overfitting; too small → oversmoothed, nearly linear. The dominant knob.</li>
          <li><strong>Polynomial degree <M>{String.raw`d`}</M> and offset <M>{String.raw`c`}</M></strong> — the curvature and how much low-order terms count.</li>
        </ul>
        <p>
          These live <em>inside</em> the kernel, so they change <M>{String.raw`K`}</M> itself — a fundamentally
          different lever than <M>{String.raw`\lambda`}</M>, which only adds to the diagonal. That&rsquo;s why the
          next page tunes them jointly.
        </p>

        <h2>Scaling matters — the kernel sees distances</h2>
        <p>
          The RBF and polynomial kernels both depend on <M>{String.raw`\lVert x - z\rVert`}</M> or{" "}
          <M>{String.raw`x\cdot z`}</M>, so a feature on a larger numeric scale dominates the similarity — exactly
          the k-NN scaling trap. <strong>Standardise your features before a kernel method</strong>, or a single
          wide-range column silently defines &ldquo;similar&rdquo; for you.
        </p>

        <h2>Let validation decide</h2>
        <p>
          Shortlist a couple of kernels from what you know about the problem, then cross-validate. Because the
          kernel and its width interact with <M>{String.raw`\lambda`}</M>, search them together on a grid rather
          than one at a time.
        </p>
        <CodeBlock fromScratch={codeScratch} withLibrary={codeLib} />

        <Quiz
          accent="var(--c-regression)"
          questions={[
            {
              q: "Why is the kernel choice usually more important than λ?",
              options: ["The kernel sets what functions the model can represent — its inductive bias", "λ is fixed at 1", "The kernel only affects speed"],
              answer: 0,
              explain: "λ smooths within a family of functions; the kernel picks the family. A wrong kernel can't be rescued by tuning λ.",
            },
            {
              q: "A sensible default kernel for an unknown nonlinear problem is…",
              options: ["RBF — universal and assumes only local smoothness", "High-degree polynomial", "Linear"],
              answer: 0,
              explain: "RBF can approximate any continuous function on a bounded region and assumes nothing beyond smoothness. Use linear/polynomial only when you expect that specific shape.",
            },
            {
              q: "Before using an RBF kernel you should…",
              options: ["Standardise the features, since the kernel depends on distances", "Remove the labels", "Always set γ = 1"],
              answer: 0,
              explain: "RBF depends on ‖x−z‖, so an unscaled wide-range feature dominates the similarity — the same scaling trap as k-NN.",
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/kernel-ridge-regression/solving-the-linear-system", label: <>← Solving the linear system</> }} next={{ href: "/learn/kernel-ridge-regression/tuning-lambda-and-gamma", label: <>Next up · Tuning λ and γ →</> }} />
      </div>
    </article>
  );
}

const codeScratch = `# shortlist kernels from domain knowledge, then let CV choose
candidates = {
    "linear":     dict(kernel="linear"),
    "poly-3":     dict(kernel="poly", degree=3),
    "rbf":        dict(kernel="rbf", gamma=0.1),
}
# ...cross-validate each; the RBF usually wins on nonlinear data`;

const codeLib = `from sklearn.kernel_ridge import KernelRidge
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import GridSearchCV

pipe = make_pipeline(StandardScaler(), KernelRidge())    # scale first!
grid = GridSearchCV(pipe, {
    "kernelridge__kernel": ["rbf", "poly"],
    "kernelridge__alpha":  [1e-3, 1e-2, 1e-1, 1],         # lambda
    "kernelridge__gamma":  [0.01, 0.1, 1],
}, cv=5).fit(X_train, y_train)
print(grid.best_params_)`;

const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
