import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "The step, and why it could not be trained — Manifold",
  description:
    "The first activation was a step function, and it is the one function on this track that gradient descent cannot use at all. The reason is worth a page, because it defines what an activation has to be.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function StepPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "The squashing era", color: CORAL }, { label: "Tier 1 · intuition", color: CORAL }]}
        time="about 6 minutes"
        title={<>The step, and why it could not be trained</>}
        intro={<>The perceptron&rsquo;s activation was a step: fire or do not. It is the most natural model of a
          neuron on this track and the only function here that backpropagation cannot use at all — for a reason that
          is short, exact, and defines the job an activation has to do.</>}
      />

      <div className="lesson">
        <h2>The function</h2>
        <MathBlock>{String.raw`\mathrm{step}(z) = \begin{cases} 1 & z \ge 0 \\ 0 & z < 0\end{cases} \qquad\qquad \mathrm{step}'(z) = 0 \;\; \text{for every } z \ne 0`}</MathBlock>

        <p>
          The derivative is zero everywhere it exists, and undefined at the single point where it does not. There is
          no region of the input line where a step function passes gradient. Put one in a network and{" "}
          <M>{String.raw`\delta^{(l-1)} = (\delta^{(l)}W^\top)\odot 0 = 0`}</M>: every layer below it receives
          exactly nothing, forever, regardless of the loss, the data or the learning rate.
        </p>

        <Callout color={CORAL} title={<>This is not saturation — it is total</>}>
          Sigmoid is saturated on 42.7% of its input range. The step function is saturated on{" "}
          <strong>100%</strong> of its input range. It is the limiting case of everything this track worries about,
          and it makes the criterion vivid: <strong>an activation must have somewhere for the gradient to
          flow</strong>, or it is not an activation at all — it is a wall.
        </Callout>

        <h2>So how was the perceptron trained?</h2>
        <p>
          Not by gradient descent. The{" "}
          <Link href="/learn/perceptron-to-mlp/the-learning-rule" style={link}>perceptron rule</Link> is a different
          algorithm entirely: when the prediction is wrong, move the weight vector toward the misclassified point by
          a fixed amount. It never differentiates anything.
        </p>

        <MathBlock>{String.raw`w \leftarrow w + \eta\,(y - \hat{y})\,x`}</MathBlock>

        <p>
          That rule works, and it provably converges on separable data. But it has two limitations that turn out to
          be the same limitation. It gives no signal at all when the prediction is right — even if it was right by a
          hair — so it optimises nothing you can write down as a loss. And crucially,{" "}
          <strong>it does not compose.</strong> There is no version of &ldquo;move toward the misclassified
          point&rdquo; for a hidden unit, because a hidden unit has no label to be wrong about.
        </p>

        <h2>The historical consequence</h2>
        <p>
          This is a large part of why the field stalled after 1969. Everyone knew a multilayer network could
          represent XOR — the previous track shows it takes two hidden units. Nobody had a way to <em>train</em> one,
          because the perceptron rule cannot reach a hidden layer and the step function will not let a gradient
          through to it.
        </p>
        <p>
          The unlock was not a better optimiser or more compute. It was{" "}
          <strong>replacing the step with something differentiable</strong> — a soft step, whose slope is small but
          non-zero over a useful region. That function is the sigmoid, and the credit-assignment problem it solved
          is the one backpropagation formalises.
        </p>

        <Callout color={CORAL} title={<>The pattern to notice</>}>
          Every advance on this track has the same shape: <strong>take a function whose slope is zero somewhere it
          matters, and make it non-zero there.</strong> Step → sigmoid replaced a slope of zero everywhere with a
          slope of up to 0.25 in the middle. ReLU replaced sigmoid&rsquo;s vanishing tail on the positive side with a
          slope of exactly 1. Leaky ReLU replaced ReLU&rsquo;s zero on the negative side with 0.01.
          <br /><br />
          Three inventions, one move, applied at whatever place the gradient was currently dying. That is also the
          recipe for designing a new one.
        </Callout>

        <h2>Where the step survives</h2>
        <p>
          Two places, both instructive. It survives as the <em>prediction rule</em> — you still threshold the output
          to get a class — but that happens after training, where no gradient is needed. And it survives inside
          quantised and binarised networks, which are trained with a{" "}
          <strong>straight-through estimator</strong>: use the step in the forward pass, then pretend during the
          backward pass that it was the identity, so a gradient exists to propagate. That is a deliberate lie about
          the derivative, and it is worth knowing that the trick exists precisely because the true derivative is
          useless.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>Why can gradient descent not train a network of step functions?</>,
              options: [
                "The step is discontinuous, and discontinuous functions cannot be optimised",
                "Its derivative is zero everywhere it is defined, so every layer below receives exactly zero gradient",
                "The step's output is binary, so the loss cannot be computed",
              ],
              answer: 1,
              explain: <>The discontinuity at a single point is not the problem — ReLU has a non-differentiable point
                too and is fine. The problem is the derivative on the other 100% of the line, which is zero.</>,
            },
            {
              q: <>The perceptron rule trains a step-activated unit successfully. Why does that not solve the
                multilayer problem?</>,
              options: [
                "It does — multilayer perceptrons are trained with the perceptron rule",
                "Because the rule needs a label to be wrong about, and a hidden unit has none, so it does not compose",
                "Because the rule only works for linearly separable data",
              ],
              answer: 1,
              explain: <>Separability is a real limitation but a separate one. The structural obstacle is credit
                assignment: &ldquo;move toward the misclassified point&rdquo; has no meaning for a unit that never
                sees a label. Backpropagation is exactly the answer to that, and it needs a non-zero
                derivative.</>,
            },
            {
              q: <>What is the common move behind step → sigmoid, sigmoid → ReLU, and ReLU → Leaky ReLU?</>,
              options: [
                "Each new function is smoother than the last",
                "Each makes the slope non-zero in a region where the previous function's slope was zero",
                "Each has a wider output range",
              ],
              answer: 1,
              explain: <>Smoothness does not follow the pattern — ReLU is less smooth than sigmoid. What follows the
                pattern is the derivative: each invention restores gradient flow wherever the previous one had none.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/activation-functions/where-your-units-sit", label: <>← Saturation</> }}
          next={{ href: "/learn/activation-functions/sigmoid", label: <>Next up · Sigmoid →</> }}
        />
      </div>
    </article>
  );
}
