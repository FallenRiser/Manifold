import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Gradients & partial derivatives — Manifold",
  description:
    "When a function has many inputs, the gradient bundles one slope per input into a vector that points in the direction of steepest ascent. Negate it and you have the direction every model trains by.",
};

const AMBER = "var(--c-fundamentals)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function GradientsPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Calculus & optimization", color: AMBER }, { label: "Tier 0 · foundations", color: "var(--c-fundamentals)" }]}
        time="about 6 minutes"
        title={<>Gradients &amp; partial derivatives</>}
        intro={<>Real models have thousands or millions of parameters, so their loss is a function of many variables.
          The gradient is how calculus scales up: one slope per variable, packed into a vector that points straight
          uphill.</>}
      />

      <div className="lesson">
        <h2>Partial derivatives: one variable at a time</h2>
        <p>
          A <strong>partial derivative</strong> <M>{String.raw`\partial f/\partial x_i`}</M> is the ordinary
          derivative with respect to one input while all the others are held fixed — the slope you&rsquo;d feel
          walking parallel to the <M>{String.raw`x_i`}</M> axis. Compute one for every input and you have the full
          local picture of how the function responds to each knob.
        </p>

        <h2>The gradient bundles them into a direction</h2>
        <p>
          Stack the partials into a vector and you get the <strong>gradient</strong>:
        </p>
        <MathBlock>{String.raw`\nabla f = \left(\frac{\partial f}{\partial x_1},\; \frac{\partial f}{\partial x_2},\; \dots,\; \frac{\partial f}{\partial x_n}\right).`}</MathBlock>
        <p>
          The gradient has a beautiful property: it points in the direction of <strong>steepest ascent</strong> — the
          way that increases the function fastest — and its length is how steep that climb is. So{" "}
          <M>{String.raw`-\nabla f`}</M> points in the direction of steepest <em>descent</em>. On a{" "}
          <Link href="/learn/linear-regression/the-loss-surface" style={link}>loss surface</Link>, the negative
          gradient is the downhill arrow every training step follows.
        </p>

        <p>
          At a minimum, there&rsquo;s no downhill left: the gradient is the zero vector,{" "}
          <M>{String.raw`\nabla f = \mathbf 0`}</M>. That&rsquo;s the multivariable version of &ldquo;slope equals
          zero,&rdquo; and it&rsquo;s the condition the <Link href="/learn/math-foundations/rank-and-systems" style={link}>normal
          equations</Link> solve for linear regression in one shot.
        </p>

        <h2>The gradient is perpendicular to the contours</h2>
        <p>
          Draw a function&rsquo;s <em>contour lines</em> (sets of equal height, like a topographic map). The gradient
          at any point is perpendicular to the contour through it — straight across the level curves, the shortest way
          uphill. This is why gradient descent on elongated, stretched contours <em>zig-zags</em>: the steepest
          direction doesn&rsquo;t point at the minimum unless the bowl is round, which is exactly what{" "}
          <Link href="/learn/pca/whitening" style={link}>whitening</Link> and feature scaling fix.
        </p>

        <Callout color={AMBER} title={<>The Hessian, in one line</>}>
          Differentiate the gradient again and you get the <strong>Hessian</strong>, the matrix of second
          derivatives — the local <em>curvature</em>. When the Hessian is <Link href="/learn/math-foundations/spd-matrices" style={link}>positive
          semidefinite</Link> everywhere, the function is <Link href="/learn/math-foundations/convexity" style={link}>convex</Link>:
          one bowl, one minimum. Newton&rsquo;s method and second-order optimizers use it to take smarter steps.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/math-foundations/derivatives", label: <>← Derivatives: the rate of change</> }}
          next={{ href: "/learn/math-foundations/chain-rule", label: <>Next up · The chain rule →</> }}
        />
      </div>
    </article>
  );
}
