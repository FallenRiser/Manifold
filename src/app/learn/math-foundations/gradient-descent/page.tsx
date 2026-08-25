import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { LabFrame } from "@/components/LabFrame";
import { GradientDescentLab } from "@/components/labs/GradientDescentLab";

export const metadata = {
  title: "Gradient descent — Manifold",
  description:
    "Gradient descent is the workhorse that trains almost every model: stand on the loss surface, look downhill, take a step, repeat. The step size is the one knob that makes or breaks it.",
};

const AMBER = "var(--c-fundamentals)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function GradientDescentPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Calculus & optimization", color: AMBER }, { label: "Tier 0 · foundations", color: "var(--c-fundamentals)" }]}
        time="about 7 minutes"
        title={<>Gradient descent</>}
        intro={<>Here&rsquo;s where linear algebra and calculus finally do something: <em>learning</em>. Gradient
          descent is the loop underneath nearly every trained model — from linear regression to giant neural networks.
          Stand somewhere on the loss surface, feel which way is downhill, step, and repeat.</>}
      />

      <div className="lesson">
        <h2>The update rule</h2>
        <p>
          The <Link href="/learn/math-foundations/gradients" style={link}>gradient</Link> points uphill, so to reduce
          the loss you step the opposite way. Scale that step by a <strong>learning rate</strong>{" "}
          <M>{String.raw`\eta`}</M> and you have the entire algorithm:
        </p>
        <MathBlock>{String.raw`\theta \;\leftarrow\; \theta - \eta\,\nabla L(\theta).`}</MathBlock>
        <p>
          Repeat until the gradient is nearly zero — you&rsquo;ve reached a flat spot, a minimum. That&rsquo;s it.
          Every deep-learning breakthrough is, at bottom, this line run trillions of times on a very large{" "}
          <M>{String.raw`\theta`}</M>.
        </p>

        <h2>The learning rate is everything</h2>
        <p>
          The one knob <M>{String.raw`\eta`}</M> decides success or disaster. Too small and training crawls; too large
          and the steps overshoot the valley and <em>diverge</em>, bouncing up the walls instead of settling. There&rsquo;s
          a sweet spot, and part of the craft of training is finding it.
        </p>

        <LabFrame
          accent={AMBER}
          tryThis={<>Watch the path descend the contour bowl. Now push the learning rate up past the point where it
            converges — where does the trajectory go? Then set it tiny and count how many steps it wastes.</>}
          insight={<>A moderate rate walks smoothly to the minimum; too large and the path overshoots and spirals
            outward (divergence); too small and it inches along, needing far more steps. The elongated bowl also makes
            it zig-zag — a preview of why feature scaling and <Link href="/learn/pca/whitening" style={link}>whitening</Link>
            help.</>}
        >
          <GradientDescentLab />
        </LabFrame>

        <h2>Batch, stochastic, and mini-batch</h2>
        <p>
          On real datasets, computing the exact gradient over <em>all</em> the data every step is expensive.{" "}
          <strong>Stochastic gradient descent (SGD)</strong> estimates it from one example at a time — noisy but fast;{" "}
          <strong>mini-batch</strong> uses a small handful, the practical default. The noise is a feature as much as a
          bug: it helps non-convex training <em>escape</em> shallow local minima and saddles. The{" "}
          <Link href="/learn/linear-regression/batch-vs-sgd" style={link}>linear-regression track</Link> shows the
          three side by side.
        </p>

        <Callout color={AMBER} title={<>Convex vs not, revisited</>}>
          On a <Link href="/learn/math-foundations/convexity" style={link}>convex</Link> loss, gradient descent with a
          sensible rate is <em>guaranteed</em> to reach the global minimum — one bowl, no traps. On a non-convex loss
          (neural nets) it finds <em>a</em> good minimum, not provably the best, which is why initialisation,
          momentum (Adam, RMSProp), and learning-rate schedules matter so much. Same update rule, very different
          guarantees.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/math-foundations/convexity", label: <>← Convex sets &amp; convex functions</> }}
          next={{ href: "/learn/math-foundations/lagrange-multipliers", label: <>Next up · Constrained optimization &amp; Lagrange multipliers →</> }}
        />
      </div>
    </article>
  );
}
