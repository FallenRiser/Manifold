import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Solving the QP: SMO — Manifold",
  description:
    "The SVR dual is a constrained quadratic program with no closed form. Sequential Minimal Optimisation solves it by optimising the smallest possible subproblem — two multipliers at a time — analytically, over and over until the KKT conditions hold.",
};

export default function SmoPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }, { label: "Tier 3 · under the hood", color: "var(--c-regression)" }]}
        time="about 9 minutes"
        title={<>Solving the QP: SMO</>}
        intro={<>
          Kernel ridge ends in a single linear solve. SVR does not — the box constraints turn its{" "}
          <Link href="/learn/support-vector-regression/the-dual-and-the-kernel-trick" style={inlineLink}>dual</Link> into
        a constrained quadratic program. This is the algorithm libsvm and scikit-learn actually run to solve it.
        </>}
      />

      <div className="lesson">
        <h2>Why not just invert a matrix?</h2>
        <p>
          The SVR dual maximises a quadratic objective in <M>{String.raw`2n`}</M> variables subject to one equality
          and <M>{String.raw`2n`}</M> box constraints <M>{String.raw`0 \le \alpha_i^{(*)} \le C`}</M>. Those
          inequalities are the problem: with them, there is no closed-form solution the way{" "}
          <M>{String.raw`\alpha = (K+\lambda I)^{-1}y`}</M> solves kernel ridge. And forming the full{" "}
          <M>{String.raw`n \times n`}</M> kernel matrix costs <M>{String.raw`O(n^2)`}</M> memory — prohibitive for
          large <M>{String.raw`n`}</M>. We need an iterative method that never materialises the whole matrix.
        </p>

        <h2>The SMO idea: optimise two at a time</h2>
        <p>
          <strong>Sequential Minimal Optimisation</strong> (Platt, 1998) is beautifully lazy. The equality
          constraint <M>{String.raw`\sum_i(\alpha_i - \alpha_i^*) = 0`}</M> couples all the multipliers — you cannot
          move just one and stay feasible. So SMO moves the <em>smallest number you can</em>: exactly two at once.
          With one degree of freedom pinned by the equality, a two-variable QP has a{" "}
          <strong>closed-form analytic solution</strong> — no inner solver needed.
        </p>
        <MathBlock>{String.raw`\text{repeat:}\quad \text{pick a violating pair } (i, j)\ \longrightarrow\ \text{solve their 2-variable QP exactly}\ \longrightarrow\ \text{clip to the box}`}</MathBlock>
        <p>
          Each step nudges two multipliers to their joint optimum, clips them back into{" "}
          <M>{String.raw`[0, C]`}</M>, and updates the running errors. Repeat until no point violates its optimality
          condition by more than a tolerance. Because every step is a tiny analytic update, there is no linear
          algebra library in the inner loop at all.
        </p>

        <Callout color="var(--c-regression)" title={<>The one-line intuition</>}>
          A full QP solver is a sledgehammer. SMO instead asks, &ldquo;what is the <em>smallest</em> repair I can make
            that still respects the constraints?&rdquo; — two multipliers, solved on paper, millions of times. Simple
            steps, cheap memory, guaranteed progress.
        </Callout>

        <h2>How a pair gets chosen: the KKT conditions</h2>
        <p>
          SMO needs to know which points are &ldquo;wrong.&rdquo; The Karush–Kuhn–Tucker (KKT) conditions are the exact
          optimality test for the dual. Translated into SVR&rsquo;s geometry, they say each point must sit consistently
          with its multiplier:
        </p>
        <ul style={ul}>
          <li><strong>Inside the tube</strong> (error <M>{String.raw`< \varepsilon`}</M>) <M>{String.raw`\Rightarrow`}</M> multiplier must be <M>{String.raw`0`}</M>.</li>
          <li><strong>Exactly on the tube edge</strong> <M>{String.raw`\Rightarrow`}</M> multiplier is free in <M>{String.raw`(0, C)`}</M>.</li>
          <li><strong>Outside the tube</strong> (a violation) <M>{String.raw`\Rightarrow`}</M> multiplier is pinned at the ceiling <M>{String.raw`C`}</M>.</li>
        </ul>
        <p>
          Any point breaking its rule is a <em>KKT violator</em>. SMO&rsquo;s heuristic pairs the worst violators
          first — the ones furthest from satisfying the conditions give the largest objective gain per step. When no
          violator remains (within tolerance), the KKT conditions hold everywhere and the solution is optimal.
        </p>

        <h2>What this buys you</h2>
        <ul style={ul}>
          <li><strong>No <M>{String.raw`O(n^2)`}</M> memory.</strong> Kernel entries are computed on demand, so SMO scales to problems whose full kernel matrix would never fit in RAM.</li>
          <li><strong>Sparsity emerges naturally.</strong> Points that stay inside the tube keep multiplier zero throughout — they are never support vectors, and the final model ignores them.</li>
          <li><strong>It is what you are already running.</strong> <code>sklearn.svm.SVR</code> wraps libsvm, whose core is exactly this SMO loop. Understanding it explains the training-time behaviour you see — and why it is superlinear in <M>{String.raw`n`}</M>, the subject of <Link href="/learn/support-vector-regression/scaling-svr-to-large-n" style={inlineLink}>scaling SVR</Link>.</li>
        </ul>

        <Callout color="var(--c-regression)" title={<>Cost, honestly</>}>
          SMO avoids the <M>{String.raw`O(n^2)`}</M> <em>memory</em> of a dense solve, but training time still grows
            roughly between <M>{String.raw`O(n^2)`}</M> and <M>{String.raw`O(n^3)`}</M> in practice — many passes over
            many pairs. That is why kernel SVR is a poor fit for hundreds of thousands of rows, and why the next
            practical chapter is about scaling.
        </Callout>

        <Quiz
          accent="var(--c-regression)"
          questions={[
            {
              q: "Why does SMO optimise exactly two multipliers per step, not one?",
              options: ["The equality constraint ∑(αᵢ−αᵢ*)=0 means moving one alone breaks feasibility; two is the minimum that stays feasible", "Two is faster to code", "It optimises all of them at once"],
              answer: 0,
              explain: "With the sum pinned, one variable has no room to move. A pair has exactly one free degree of freedom — the smallest solvable subproblem, and it has a closed form.",
            },
            {
              q: "What role do the KKT conditions play in SMO?",
              options: ["They identify which points violate optimality, so SMO knows which pairs to fix and when to stop", "They set the kernel width", "They replace the dual"],
              answer: 0,
              explain: "A KKT violator is a point whose multiplier disagrees with its position relative to the tube. No violators = optimal solution.",
            },
            {
              q: "A key practical advantage of SMO over a dense QP solve is…",
              options: ["It never forms the full n×n kernel matrix, so memory stays modest", "It gives an exact matrix inverse", "It removes the need for support vectors"],
              answer: 0,
              explain: "Kernel entries are computed on demand inside the pair updates, so SMO handles problems whose full kernel matrix wouldn't fit in memory.",
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/support-vector-regression/the-dual-and-the-kernel-trick", label: <>← The dual &amp; the kernel trick</> }} next={{ href: "/learn/support-vector-regression/kernels-for-svr", label: <>Next up · Kernels for SVR →</> }} />
      </div>
    </article>
  );
}

const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const inlineLink: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
