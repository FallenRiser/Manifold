import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "The primal problem — Manifold",
  description:
    "SVR written as a constrained optimisation: minimise the model's flatness plus its tube violations, subject to keeping predictions within ε (give or take slack). The primal form, term by term.",
};

export default function PrimalProblemPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }, { label: "Tier 2 · the mechanics", color: "var(--c-regression)" }]}
        time="about 8 minutes"
        title={<>The primal problem</>}
        intro={<>
          The tube, the slack, and C come together in one constrained optimisation — the <em>primal</em> form of
        SVR. Writing it out makes every earlier idea precise and sets up the dual that follows.
        </>}
      />

      <div className="lesson">
        <h2>The full statement</h2>
        <p>SVR (linear form, before kernels) solves:</p>
        <MathBlock>{String.raw`\min_{w,\,b,\,\xi,\,\xi^*}\ \tfrac{1}{2}\lVert w \rVert^2 + C\sum_{i=1}^{n}(\xi_i + \xi_i^*)`}</MathBlock>
        <p>subject to, for every point <M>{String.raw`i`}</M>:</p>
        <MathBlock>{String.raw`\begin{aligned} y_i - (w\cdot x_i + b) &\le \varepsilon + \xi_i \\ (w\cdot x_i + b) - y_i &\le \varepsilon + \xi_i^* \\ \xi_i,\ \xi_i^* &\ge 0 \end{aligned}`}</MathBlock>

        <h2>Reading it term by term</h2>
        <ul style={ul}>
          <li>
            <strong><M>{String.raw`\tfrac{1}{2}\lVert w \rVert^2`}</M> — flatness.</strong> Minimising the squared
            norm of the weights makes the function as flat (simple) as possible, the SVR version of regularisation.
            This is what the model &ldquo;wants&rdquo; in the absence of data pressure.
          </li>
          <li>
            <strong><M>{String.raw`C\sum(\xi_i + \xi_i^*)`}</M> — total tube violation.</strong> The slack{" "}
            <M>{String.raw`\xi_i`}</M> / <M>{String.raw`\xi_i^*`}</M> measure how far point <M>{String.raw`i`}</M>
            pokes out of the top / bottom of the tube; <M>{String.raw`C`}</M> prices each unit.
          </li>
          <li>
            <strong>The first two constraints — the tube.</strong> They say the prediction must be within{" "}
            <M>{String.raw`\varepsilon`}</M> of <M>{String.raw`y_i`}</M>, <em>plus</em> whatever slack the point
            pays for. A point inside the tube satisfies them with <M>{String.raw`\xi = \xi^* = 0`}</M> — free.
          </li>
          <li>
            <strong>The last constraint — slack is non-negative.</strong> You can only ever add tolerance, never
            subtract it.
          </li>
        </ul>

        <Callout color="var(--c-regression)" title={<>It&rsquo;s the ε-insensitive loss in disguise</>}>
          The primal is just the ε-insensitive loss made into constraints. At the optimum, each slack equals the
            point&rsquo;s ε-insensitive loss: <M>{String.raw`\xi_i + \xi_i^* = \max(0, |y_i - \hat{y}_i| - \varepsilon)`}</M>.
            So &ldquo;minimise flatness + C·slack&rdquo; is exactly &ldquo;minimise{" "}
            <M>{String.raw`\tfrac{1}{2}\lVert w\rVert^2 + C\sum L_\varepsilon`}</M>&rdquo; — regularised
            ε-insensitive regression, written in the form an optimiser can chew on.
        </Callout>

        <h2>Why &ldquo;flatness&rdquo; means <M>{String.raw`\lVert w \rVert^2`}</M></h2>
        <p>
          For a linear model <M>{String.raw`f(x) = w\cdot x + b`}</M>, the weight vector <M>{String.raw`w`}</M> is
          the gradient — a small <M>{String.raw`\lVert w \rVert`}</M> means a gently sloping, low-complexity
          function that changes slowly as the input moves. Minimising <M>{String.raw`\lVert w \rVert^2`}</M> is
          therefore a direct bias toward simple functions, the same quantity that measures margin width in an
          SVM. Kernelised, it becomes a smoothness penalty in the feature space — the RKHS norm from the
          representer theorem.
        </p>

        <h2>A convex problem with a unique solution</h2>
        <p>
          The objective is a convex quadratic and all constraints are linear, so this is a{" "}
          <strong>convex quadratic program</strong>: it has a single global optimum, no local minima to worry
          about. But note what it&rsquo;s written in terms of — <M>{String.raw`w`}</M>, which after a kernel map could
          be infinite-dimensional. Just like ridge, you can&rsquo;t solve this form directly once kernels enter. The
          fix is the same: pass to the dual, where only inner products appear.
        </p>

        <Quiz
          accent="var(--c-regression)"
          questions={[
            {
              q: "In the SVR primal, minimising ½‖w‖² serves what purpose?",
              options: ["It biases toward a flat, simple function — SVR's regularisation", "It maximises training accuracy", "It counts the support vectors"],
              answer: 0,
              explain: "Small ‖w‖ means a gently sloping, low-complexity function. It's the same flatness/margin quantity as in an SVM.",
            },
            {
              q: "What do the slack variables ξᵢ, ξᵢ* equal at the optimum?",
              options: ["The point's ε-insensitive loss, max(0, |yᵢ − ŷᵢ| − ε)", "The kernel value", "Always zero"],
              answer: 0,
              explain: "The primal is the ε-insensitive loss turned into constraints; each slack equals that point's loss, so the objective is regularised ε-insensitive regression.",
            },
            {
              q: "Why must we pass to the dual to kernelise SVR?",
              options: ["The primal is written in w, which is infinite-dimensional after a kernel map", "The primal has no solution", "The dual is always faster"],
              answer: 0,
              explain: "Just like ridge, once features are implicit you can't form w. The dual depends only on inner products, which kernels supply.",
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/support-vector-regression/soft-margin-c-and-slack", label: <>← Soft margin: C &amp; slack</> }} next={{ href: "/learn/support-vector-regression/the-dual-and-the-kernel-trick", label: <>Next up · The dual &amp; the kernel trick →</> }} />
      </div>
    </article>
  );
}

const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
