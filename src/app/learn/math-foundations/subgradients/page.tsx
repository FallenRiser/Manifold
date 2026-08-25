import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "Subgradients & non-smooth objectives — Manifold",
  description:
    "Gradient descent needs a slope, but the L1 penalty and the hinge loss have a sharp corner with no single slope. Subgradients extend calculus to those kinks — and the corner is exactly what makes lasso sparse.",
};

const AMBER = "var(--c-fundamentals)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function SubgradientsPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Calculus & optimization", color: AMBER }, { label: "Tier 3 · theory", color: "var(--c-metrics)" }]}
        time="about 6 minutes"
        title={<>Subgradients &amp; non-smooth objectives</>}
        intro={<>Gradient descent assumes a well-defined slope everywhere. But two of the most useful objects in ML —
          the L1 penalty <M>{String.raw`|w|`}</M> and the SVM hinge loss — have a sharp <em>corner</em> where no single
          slope exists. Subgradients rescue calculus at those kinks.</>}
      />

      <div className="lesson">
        <h2>The problem with corners</h2>
        <p>
          Look at <M>{String.raw`f(w) = |w|`}</M> at <M>{String.raw`w = 0`}</M>. Coming from the left the slope is{" "}
          <M>{String.raw`-1`}</M>; from the right it&rsquo;s <M>{String.raw`+1`}</M>. There is no single tangent line —
          the derivative simply doesn&rsquo;t exist there. Yet this point is exactly the minimum, and exactly where the{" "}
          <Link href="/learn/regularized-regression" style={link}>lasso</Link> wants to sit. We need a way to
          optimize through the kink.
        </p>

        <h2>Subgradients: a set of slopes</h2>
        <p>
          A <strong>subgradient</strong> of a convex function at a point is any slope of a line that touches the graph
          there and stays below it everywhere else. At a smooth point there&rsquo;s exactly one — the ordinary
          derivative. At a corner there&rsquo;s a whole <em>interval</em> of valid slopes, called the{" "}
          <strong>subdifferential</strong>. For <M>{String.raw`|w|`}</M>:
        </p>
        <MathBlock>{String.raw`\partial |w| = \begin{cases} \{-1\} & w < 0 \\ [-1,\,1] & w = 0 \\ \{+1\} & w > 0 \end{cases}`}</MathBlock>
        <p>
          At the corner, <em>any</em> slope between <M>{String.raw`-1`}</M> and <M>{String.raw`+1`}</M> is a legal
          subgradient. Optimization proceeds with <strong>subgradient descent</strong> — the same update as gradient
          descent, but you&rsquo;re free to pick any subgradient from the set when you hit a kink.
        </p>

        <h2>The corner is a feature, not a bug</h2>
        <p>
          Why tolerate the non-smoothness at all? Because that corner is <em>precisely</em> what makes lasso select
          features. The optimality condition at <M>{String.raw`w=0`}</M> becomes an <em>interval</em> to satisfy, not
          a single equation — so a whole range of situations leaves a weight pinned exactly at zero. A smooth penalty
          like <Link href="/learn/regularized-regression" style={link}>ridge</Link> only shrinks weights toward zero;
          the L1 kink drives them <em>to</em> zero, producing sparse models. The sharp point does the feature
          selection.
        </p>

        <Callout color={AMBER} title={<>Where non-smooth objectives show up</>}>
          The <strong>L1 penalty</strong> (lasso, sparse models), the <strong>hinge loss</strong>{" "}
          <M>{String.raw`\max(0, 1 - y\hat y)`}</M> (SVMs), and <strong>ReLU</strong>{" "}
          <M>{String.raw`\max(0, x)`}</M> (neural nets) all have kinks. Modern autodiff quietly hands you a
          subgradient at each corner and the optimization just works — but knowing the corner is <em>intentional</em>,
          and that it&rsquo;s what buys sparsity, is what separates using these tools from understanding them.
        </Callout>

        <Quiz
          title="Checkpoint · calculus & optimization"
          accent={AMBER}
          questions={[
            {
              q: <>The gradient <M>{String.raw`\nabla f`}</M> points in the direction of…</>,
              options: ["steepest descent", "steepest ascent (so we step opposite it to minimize)", "the nearest minimum"],
              answer: 1,
              explain: <>The gradient points uphill; training steps in <M>{String.raw`-\nabla f`}</M> to go downhill.</>,
            },
            {
              q: <>A convex function is one where…</>,
              options: ["the chord between any two points never dips below the curve", "the derivative is always positive", "there are many local minima"],
              answer: 0,
              explain: <>Chord-above-curve is the definition; it guarantees a single global minimum, so descent can&rsquo;t get trapped.</>,
            },
            {
              q: <>In gradient descent, a learning rate that&rsquo;s too large causes…</>,
              options: ["slow but safe progress", "overshooting the minimum and diverging", "the gradient to vanish"],
              answer: 1,
              explain: <>Steps too big bounce past the valley and up the far wall — the loss diverges instead of settling.</>,
            },
            {
              q: <>Why does the L1 penalty&rsquo;s corner at zero produce sparse models?</>,
              options: [
                "it's smoother than L2",
                "the subgradient at zero is an interval, so weights can stay pinned exactly at zero over a range of conditions",
                "it has a larger gradient everywhere",
              ],
              answer: 1,
              explain: <>The kink turns the optimality condition into an interval to satisfy, holding many weights exactly at 0 — feature selection.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/math-foundations/duality", label: <>← Duality, in one page</> }}
          next={{ href: "/learn/math-foundations/random-variables", label: <>Next up · Random variables &amp; sample spaces →</> }}
        />
      </div>
    </article>
  );
}
