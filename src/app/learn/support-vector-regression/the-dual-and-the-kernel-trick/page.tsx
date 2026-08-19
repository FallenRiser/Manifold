import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "The dual & the kernel trick — Manifold",
  description:
    "The dual of SVR depends on the data only through inner products — so swapping them for a kernel makes SVR nonlinear. It also reveals the box constraints that cap outliers and the sparsity that keeps the model small.",
};

export default function DualPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }, { label: "Tier 2 · the mechanics", color: "var(--c-regression)" }]}
        time="about 9 minutes"
        title={<>The dual &amp; the kernel trick</>}
        intro={<>
          Converting the primal to its dual does three things at once: it removes the infinite-dimensional{" "}
          <M>{String.raw`w`}</M>, exposes exactly where the kernel plugs in, and makes SVR&rsquo;s sparsity and
        robustness fall out of the constraints.
        </>}
      />

      <div className="lesson">
        <h2>The dual problem</h2>
        <p>
          Introducing Lagrange multipliers <M>{String.raw`\alpha_i, \alpha_i^*`}</M> for the two tube constraints
          and eliminating <M>{String.raw`w, b, \xi`}</M> gives the dual — a quadratic program in{" "}
          <M>{String.raw`\alpha, \alpha^*`}</M>:
        </p>
        <MathBlock>{String.raw`\max_{\alpha,\,\alpha^*}\ -\tfrac{1}{2}\sum_{i,j}(\alpha_i - \alpha_i^*)(\alpha_j - \alpha_j^*)\,k(x_i, x_j) \;-\; \varepsilon\sum_i(\alpha_i + \alpha_i^*) \;+\; \sum_i y_i(\alpha_i - \alpha_i^*)`}</MathBlock>
        <p>subject to the constraints:</p>
        <MathBlock>{String.raw`\sum_i (\alpha_i - \alpha_i^*) = 0, \qquad 0 \le \alpha_i,\ \alpha_i^* \le C`}</MathBlock>

        <h2>Three things to read off it</h2>
        <ul style={ul}>
          <li>
            <strong>Only inner products appear.</strong> The data enters solely through{" "}
            <M>{String.raw`k(x_i, x_j)`}</M> — the primal&rsquo;s <M>{String.raw`w`}</M> is gone. This is the opening
            for the kernel trick, exactly as in the <Link href="/learn/kernel-ridge-regression/the-dual-form-of-ridge" style={inlineLink}>dual of ridge</Link>.
          </li>
          <li>
            <strong>The box constraint <M>{String.raw`0 \le \alpha_i^{(*)} \le C`}</M> caps influence.</strong> No
            point&rsquo;s coefficient can exceed <M>{String.raw`C`}</M>, so no single outlier can pull the fit
            arbitrarily far. That ceiling <em>is</em> SVR&rsquo;s robustness, written as a constraint.
          </li>
          <li>
            <strong>The <M>{String.raw`\varepsilon\sum(\alpha_i + \alpha_i^*)`}</M> term drives sparsity.</strong>
            It penalises using any coefficient at all, so the optimiser keeps as many at zero as it can — only
            points it&rsquo;s forced to use (the support vectors) get nonzero weight.
          </li>
        </ul>

        <h2>The kernelised prediction</h2>
        <p>
          The learned function is a kernel expansion over the support vectors, with a bias{" "}
          <M>{String.raw`b`}</M> recovered from the edge points:
        </p>
        <MathBlock>{String.raw`\hat{y}(x) = \sum_{i=1}^{n} (\alpha_i - \alpha_i^*)\, k(x_i, x) + b`}</MathBlock>
        <p>
          Because most <M>{String.raw`(\alpha_i - \alpha_i^*)`}</M> are zero, this sum runs effectively over the
          support vectors only. Swap the linear kernel <M>{String.raw`x_i\cdot x`}</M> for an RBF or polynomial one
          and the fit becomes nonlinear — <strong>the kernel trick applied to the tube</strong>, with no other
          change to the algorithm.
        </p>

        <Callout color="var(--c-regression)" title={<>Why two multipliers per point?</>}>
          Each point has <em>two</em> tube constraints (it mustn&rsquo;t poke out the top, and it mustn&rsquo;t poke out
            the bottom), so it gets two multipliers, <M>{String.raw`\alpha_i`}</M> and <M>{String.raw`\alpha_i^*`}</M>.
            A point can only violate one side at a time, so at most one is nonzero — their difference{" "}
            <M>{String.raw`(\alpha_i - \alpha_i^*)`}</M> is the point&rsquo;s signed weight, positive if it pulls the
            fit up, negative if down. This is the regression analogue of the SVM&rsquo;s single-sided margin.
        </Callout>

        <h2>Solving it: a quadratic program</h2>
        <p>
          Unlike kernel ridge&rsquo;s single linear solve, the dual is a constrained quadratic program — the box
          constraints have no closed form. In practice it&rsquo;s solved by specialised algorithms like{" "}
          <strong>SMO</strong> (sequential minimal optimisation), which libsvm and scikit-learn use under the
          hood. That extra machinery is the price SVR pays for sparsity; the payoff is a model that stores only
          its support vectors.
        </p>

        <Quiz
          accent="var(--c-regression)"
          questions={[
            {
              q: "In the SVR dual, the data appears only through…",
              options: ["Inner products k(xᵢ, xⱼ) — which is what lets the kernel trick apply", "The weight vector w", "The slack variables"],
              answer: 0,
              explain: "The primal's w is eliminated; only pairwise kernel values remain, so each can be swapped for a nonlinear kernel.",
            },
            {
              q: "What does the box constraint 0 ≤ αᵢ ≤ C enforce?",
              options: ["A cap on each point's influence — the source of SVR's outlier robustness", "That α is always zero", "That the kernel is valid"],
              answer: 0,
              explain: "No coefficient can exceed C, so no single outlier can dominate the fit. Robustness is baked into the constraint.",
            },
            {
              q: "How is the SVR dual solved, versus kernel ridge?",
              options: ["A constrained quadratic program (e.g. SMO), not a single closed-form linear solve", "The same closed-form solve", "By gradient descent on the primal"],
              answer: 0,
              explain: "The box constraints have no closed form, so SVR needs a QP solver like SMO — the extra cost that buys sparsity.",
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/support-vector-regression/the-primal-problem", label: <>← The primal problem</> }} next={{ href: "/learn/support-vector-regression/solving-the-qp-smo", label: <>Next up · Solving the QP: SMO →</> }} />
      </div>
    </article>
  );
}

const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const inlineLink: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
