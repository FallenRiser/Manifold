import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { LabFrame } from "@/components/LabFrame";
import { GradientTangentLab } from "@/components/labs/GradientTangentLab";

export const metadata = {
  title: "Derivatives: the rate of change — Manifold",
  description:
    "A derivative is the slope of a function at a point — how fast the output changes as you nudge the input. It's the single signal every learning algorithm follows downhill toward a better model.",
};

const AMBER = "var(--c-fundamentals)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function DerivativesPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Calculus & optimization", color: AMBER }, { label: "Tier 0 · foundations", color: "var(--c-fundamentals)" }]}
        time="about 6 minutes"
        title={<>Derivatives: the rate of change</>}
        intro={<>Training a model means improving it a little at a time. To know <em>which way</em> is better, you need
          the slope of the error — how it changes when you tweak a parameter. That slope is the derivative, and it is
          the compass all of learning steers by.</>}
      />

      <div className="lesson">
        <h2>Slope at a point</h2>
        <p>
          The <strong>derivative</strong> <M>{String.raw`f'(x)`}</M> is the slope of the function&rsquo;s graph at{" "}
          <M>x</M> — the steepness of the tangent line there. Formally it&rsquo;s the limit of the rise-over-run as
          the run shrinks to nothing:
        </p>
        <MathBlock>{String.raw`f'(x) = \lim_{h\to 0}\frac{f(x+h)-f(x)}{h}.`}</MathBlock>
        <p>
          Positive slope means the function is climbing; negative means falling; <strong>zero</strong> means flat — a
          peak, a valley, or a plateau. That last case is the whole point: the minimum of a loss is where its
          derivative is zero, so &ldquo;set the derivative to zero&rdquo; is how you locate best-fit parameters.
        </p>

        <LabFrame
          accent={AMBER}
          tryThis={<>Drag the ball along the curve and read the slope of the tangent. Where is the slope zero? Where is
            it steepest? Then use &ldquo;step downhill&rdquo; to walk toward the bottom.</>}
          insight={<>The tangent&rsquo;s slope <em>is</em> the derivative — steep where the curve turns hard, zero at
            the valley floor. Stepping in the downhill (negative-slope) direction is one-dimensional gradient descent:
            the entire idea of training, in miniature.</>}
        >
          <GradientTangentLab />
        </LabFrame>

        <h2>A few rules worth knowing</h2>
        <ul style={{ margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 }}>
          <li><strong>Powers:</strong> <M>{String.raw`\frac{d}{dx}x^n = n x^{n-1}`}</M> — so <M>{String.raw`x^2`}</M> has slope <M>{String.raw`2x`}</M>, which is why squared-error losses have such clean gradients.</li>
          <li><strong>Sums:</strong> the derivative of a sum is the sum of derivatives — you can differentiate a loss term by term.</li>
          <li><strong>Constants</strong> vanish; a flat line has zero slope.</li>
          <li><strong>The exponential</strong> <M>{String.raw`e^x`}</M> is its own derivative — the reason it&rsquo;s everywhere in probability and the <Link href="/learn/logistic-regression/the-sigmoid" style={link}>sigmoid</Link>.</li>
        </ul>

        <Callout color={AMBER} title={<>Why a learner needs this</>}>
          Every model with a differentiable loss is trained by computing the derivative of that loss with respect to
          each parameter and stepping the parameter the opposite way. No derivatives, no learning. The multivariable
          version — one slope per parameter, bundled into a <Link href="/learn/math-foundations/gradients" style={link}>gradient</Link>
          — is next.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/math-foundations/spd-matrices", label: <>← Symmetric positive-definite matrices</> }}
          next={{ href: "/learn/math-foundations/gradients", label: <>Next up · Gradients &amp; partial derivatives →</> }}
        />
      </div>
    </article>
  );
}
