import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "The representer theorem — Manifold",
  description:
    "Why the solution to an infinite-dimensional problem is a finite sum over the data. The representer theorem guarantees the optimal function is a weighted combination of kernels on the training points — the foundation kernel methods stand on.",
};

export default function RepresenterTheoremPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }, { label: "Tier 3 · theory", color: "var(--c-metrics)" }]}
        time="about 8 minutes"
        title={<>The representer theorem</>}
        intro={<>
          The kernel trick works in a possibly infinite-dimensional space, yet we solve for a finite vector α.
        Why is that allowed? The representer theorem is the guarantee — it proves the best function always lives
        in the finite span of the training data.
        </>}
      />

      <div className="lesson">
        <h2>The puzzle</h2>
        <p>
          With an RBF kernel we&rsquo;re implicitly searching over an <em>infinite</em>-dimensional space of
          functions <M>{String.raw`f`}</M>. An infinite search should need infinite parameters — yet kernel ridge
          fits with just <M>{String.raw`n`}</M> coefficients, one per data point. The representer theorem explains
          why that&rsquo;s not a shortcut but the exact truth.
        </p>

        <h2>The statement</h2>
        <p>
          Consider any learning problem of the form &ldquo;fit the data, but penalise complex functions&rdquo;: minimise
        </p>
        <MathBlock>{String.raw`\min_{f \in \mathcal{H}} \; \underbrace{\sum_{i=1}^{n} L\big(y_i, f(x_i)\big)}_{\text{fit the data}} \;+\; \underbrace{\lambda\, \lVert f \rVert_{\mathcal{H}}^2}_{\text{penalise complexity}}`}</MathBlock>
        <p>
          over a reproducing-kernel Hilbert space <M>{String.raw`\mathcal{H}`}</M> with kernel{" "}
          <M>{String.raw`k`}</M>, for <em>any</em> loss <M>{String.raw`L`}</M> and any strictly increasing penalty
          on the norm. The <strong>representer theorem</strong> says the minimiser always has the form:
        </p>
        <MathBlock>{String.raw`f^\star(x) = \sum_{i=1}^{n} \alpha_i\, k(x_i, x)`}</MathBlock>
        <p>
          A finite sum of kernels centred on the training points. The infinite-dimensional search collapses to
          finding <M>{String.raw`n`}</M> numbers <M>{String.raw`\alpha`}</M>.
        </p>

        <h2>Why it&rsquo;s true: orthogonality kills the rest</h2>
        <p>
          The argument is a clean orthogonality decomposition. Split any candidate function into two pieces — the
          part inside the span of the training kernels, and a leftover orthogonal to all of them:
        </p>
        <MathBlock>{String.raw`f = \underbrace{f_\parallel}_{\in\, \text{span}\{k(x_i,\cdot)\}} + \underbrace{f_\perp}_{\perp\, \text{every } k(x_i,\cdot)}`}</MathBlock>
        <p>Now watch what <M>{String.raw`f_\perp`}</M> does to each term of the objective:</p>
        <ul style={ul}>
          <li>
            <strong>It changes no prediction.</strong> By the reproducing property,{" "}
            <M>{String.raw`f(x_i) = \langle f, k(x_i, \cdot)\rangle`}</M>, and since{" "}
            <M>{String.raw`f_\perp`}</M> is orthogonal to every <M>{String.raw`k(x_i, \cdot)`}</M>, it contributes
            zero: <M>{String.raw`f(x_i) = f_\parallel(x_i)`}</M>. The loss can&rsquo;t tell <M>{String.raw`f_\perp`}</M>
            exists.
          </li>
          <li>
            <strong>It only adds to the penalty.</strong> By Pythagoras,{" "}
            <M>{String.raw`\lVert f \rVert^2 = \lVert f_\parallel \rVert^2 + \lVert f_\perp \rVert^2`}</M>, so any
            nonzero <M>{String.raw`f_\perp`}</M> strictly <em>increases</em> the norm penalty.
          </li>
        </ul>
        <p>
          So <M>{String.raw`f_\perp`}</M> is pure cost and no benefit — the optimum sets it to zero. What remains,{" "}
          <M>{String.raw`f_\parallel`}</M>, is by definition a finite combination of the training kernels.{" "}
          <M>{String.raw`\blacksquare`}</M>
        </p>

        <Callout color="var(--c-metrics)" title={<>What it justifies</>}>
          This is the theorem the entire kernel toolbox rests on. It&rsquo;s why kernel ridge can solve for a finite{" "}
            <M>{String.raw`\alpha`}</M> despite an infinite feature space — and, because it holds for <em>any</em>
            loss, it equally licenses <strong>support vector regression</strong> (a different loss) and kernel
            SVMs. Every kernelised method inherits its finite, data-supported form from here.
        </Callout>

        <h2>The dividing line: which points get nonzero weight</h2>
        <p>
          The theorem guarantees <M>{String.raw`f^\star = \sum_i \alpha_i k(x_i, \cdot)`}</M>, but it says nothing
          about <em>how many</em> <M>{String.raw`\alpha_i`}</M> are nonzero — and that depends entirely on the
          loss <M>{String.raw`L`}</M>:
        </p>
        <ul style={ul}>
          <li><strong>Squared loss (kernel ridge)</strong> → the <M>{String.raw`\alpha`}</M> are generally <em>all</em> nonzero. The model keeps every point (dense).</li>
          <li><strong>ε-insensitive loss (SVR)</strong> → most <M>{String.raw`\alpha_i`}</M> are exactly zero. Only the &ldquo;support vectors&rdquo; survive (sparse).</li>
        </ul>
        <p>
          Same representer form, opposite sparsity — the single most important practical difference between the
          two kernel regressors, which the comparison page draws out.
        </p>

        <Quiz
          accent="var(--c-metrics)"
          questions={[
            {
              q: "The representer theorem guarantees the optimal function has what form?",
              options: ["A finite sum of kernels on the training points, f = Σ αᵢ k(xᵢ, ·)", "A single global weight vector", "An infinite series"],
              answer: 0,
              explain: "Despite an infinite-dimensional search space, the minimiser lives in the finite span of the training kernels — n coefficients suffice.",
            },
            {
              q: "In the proof, the component f⊥ orthogonal to the data is dropped because…",
              options: ["It changes no prediction but strictly increases the norm penalty", "It makes the loss larger", "It's required for the solution"],
              answer: 0,
              explain: "By the reproducing property f⊥ contributes 0 to every f(xᵢ), and by Pythagoras it only adds to ‖f‖². Pure cost, so the optimum zeroes it.",
            },
            {
              q: "Whether the αᵢ are dense or sparse is determined by…",
              options: ["The loss function — squared loss is dense, ε-insensitive loss is sparse", "The kernel alone", "The number of features"],
              answer: 0,
              explain: "The theorem fixes the form but not the sparsity. Kernel ridge's squared loss keeps all points; SVR's ε-insensitive loss zeroes most, keeping only support vectors.",
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/kernel-ridge-regression/the-computational-cost", label: <>← The computational cost</> }} next={{ href: "/learn/kernel-ridge-regression/kernel-ridge-and-gaussian-processes", label: <>Next up · Kernel ridge &amp; Gaussian processes →</> }} />
      </div>
    </article>
  );
}

const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
