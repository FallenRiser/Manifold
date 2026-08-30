import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { LabFrame } from "@/components/LabFrame";
import { SigmoidLab } from "@/components/labs/SigmoidLab";

export const metadata = {
  title: "Sigmoid — Manifold",
  description:
    "The function that made backpropagation possible, and the one property of it that made deep networks impossible for twenty years. Both follow from the same line of algebra.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function SigmoidPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "The squashing era", color: CORAL }, { label: "Tier 1 · intuition", color: CORAL }]}
        time="about 8 minutes"
        title={<>Sigmoid</>}
        intro={<>The soft step. It solved the problem the previous page ended on — it has a derivative you can
          actually use — and in doing so it created the problem that held the field back for two decades. Both facts
          come from the same three-line calculation.</>}
      />

      <div className="lesson">
        <h2>The function and its derivative</h2>

        <MathBlock>{String.raw`\sigma(z) = \frac{1}{1 + e^{-z}} \qquad\qquad \sigma'(z) = \sigma(z)\,\bigl(1 - \sigma(z)\bigr)`}</MathBlock>

        <p>
          That derivative is unusually pleasant — it is written entirely in terms of the output, so a forward pass
          that cached <M>{String.raw`\sigma(z)`}</M> gets the backward pass almost free. In 1986 that mattered; it is
          part of why sigmoid became the default.
        </p>
        <p>
          It also contains the whole problem. Write <M>{String.raw`a = \sigma(z)`}</M>; then{" "}
          <M>{String.raw`\sigma' = a(1-a)`}</M> is a downward parabola on{" "}
          <M>{String.raw`a \in [0,1]`}</M>, maximised at <M>{String.raw`a = 1/2`}</M>, where it equals{" "}
          <strong>exactly 0.25</strong>.
        </p>

        <Callout color={CORAL} title={<>The number that defines sigmoid</>}>
          <M>{String.raw`\max_z \sigma'(z) = 0.25`}</M>. Not approximately — exactly, and it occurs at exactly one
          point.
          <br /><br />
          This is a hard ceiling on what a sigmoid layer can do to a gradient. <strong>Even in the most favourable
          possible case, a sigmoid layer divides the gradient by four.</strong> Twelve such layers, all perfectly
          positioned, give <M>{String.raw`0.25^{12} \approx 6\times10^{-8}`}</M>. Real units are not all perfectly
          positioned, and the measured figure for a real twelve-layer sigmoid network is worse still.
        </Callout>

        <LabFrame
          accent={CORAL}
          tryThis={<>Move the input far from zero in either direction and watch the output flatten. That flattening
            is the forward view of saturation; the derivative is what it costs.</>}
          insight={<>The curve is visibly flat outside roughly <M>{String.raw`|z| > 5`}</M>, and &ldquo;flat&rdquo;
            here means <M>{String.raw`\sigma' < 0.007`}</M>. A unit that lands there contributes a factor below one
            hundredth to every gradient that passes through it, and it takes a large weight change to bring it back
            — which it cannot get, because the gradient it would need is the one being suppressed.</>}
        >
          <SigmoidLab />
        </LabFrame>

        <h2>What sigmoid was actually for</h2>
        <p>
          It is worth being fair to it. Sigmoid was not chosen because someone liked S-curves; it has three genuine
          properties that mattered:
        </p>
        <ul>
          <li><strong>It is a differentiable step.</strong> It preserves the fire/do-not-fire story of a neuron while
            admitting a gradient — precisely the unlock the previous page described.</li>
          <li><strong>Its output is a probability.</strong> Bounded to <M>{String.raw`(0,1)`}</M>, monotone, and — as{" "}
            <Link href="/learn/logistic-regression/the-sigmoid" style={link}>logistic regression</Link> shows —
            the exact inverse of the log-odds. That is not a coincidence or a convenience; it is why it remains the
            correct <em>output</em> activation for binary classification to this day.</li>
          <li><strong>Its derivative is cheap given the forward pass</strong>, needing one multiply and one subtract.</li>
        </ul>
        <p>
          Two of those three are about the output layer, where sigmoid is still right. Only the first is about hidden
          layers, and that is where it lost.
        </p>

        <Proof color={CORAL} title="why the maximum is exactly 1/4">
          <p>
            With <M>{String.raw`a = \sigma(z) \in (0,1)`}</M>, the derivative is{" "}
            <M>{String.raw`g(a) = a(1-a)`}</M>. Differentiate with respect to <M>{String.raw`a`}</M>:
          </p>
          <MathBlock>{String.raw`\frac{dg}{da} = 1 - 2a = 0 \;\;\Longrightarrow\;\; a = \tfrac12, \quad g(\tfrac12) = \tfrac14`}</MathBlock>
          <p>
            The maximum is at <M>{String.raw`a = 1/2`}</M>, i.e. at <M>{String.raw`z = 0`}</M>, and equals{" "}
            <M>{String.raw`1/4`}</M>. Note what this argument does <em>not</em> depend on: the data, the weights, the
            depth, or the loss. It is a property of the function, so no amount of careful engineering elsewhere can
            raise that ceiling.
          </p>
          <p>
            The same calculation explains why tanh escapes it.{" "}
            <M>{String.raw`\tanh(z) = 2\sigma(2z) - 1`}</M>, so <M>{String.raw`\tanh'(z) = 4\sigma'(2z)`}</M> — the
            chain rule contributes a factor of 2 and the vertical stretch another, giving a peak of{" "}
            <M>{String.raw`4 \times \tfrac14 = 1`}</M>. tanh is sigmoid with the ceiling multiplied by four, which
            is exactly the amount you need to stop the product from shrinking.
          </p>
        </Proof>

        <h2>The honest caveat</h2>
        <p>
          It would be tidy to end with &ldquo;never use sigmoid in a hidden layer&rdquo;, and as advice that is
          fine. But the mechanism is not quite as clean as the 0.25 ceiling suggests. The measured ratio for a
          twelve-layer sigmoid network is 29 million to one under Xavier initialisation — and{" "}
          <strong>65 to one</strong> for the same network, same activation, same data, initialised at a scale of 2.0
          instead.
        </p>
        <p>
          The chain-rule product has two factors per layer, the slope and the weight, and the initialisation sets the
          second. Sigmoid makes the first small; whether the product actually collapses depends on both. That
          measurement is on the{" "}
          <Link href="/learn/activation-functions/what-depth-did" style={link}>next-but-one page</Link>, and it is
          the reason <strong>Initialisation &amp; normalisation</strong> is a track of its own.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>Why is <M>{String.raw`\sigma'(z) = \sigma(z)(1-\sigma(z))`}</M> bounded above by 0.25?</>,
              options: [
                "Because σ is bounded by 1, and 1 × 1 = 1 is then halved twice",
                "Because a(1−a) is a downward parabola on (0,1), maximised at a = ½ where it equals ¼",
                "Because the exponential decays quickly",
              ],
              answer: 1,
              explain: <>Set the derivative of <M>{String.raw`a(1-a)`}</M> to zero: <M>{String.raw`1-2a=0`}</M>, so{" "}
                <M>{String.raw`a=\tfrac12`}</M> and the value there is <M>{String.raw`\tfrac14`}</M>. It depends on
                nothing but the function.</>,
            },
            {
              q: <>Sigmoid is still the right choice in one place. Where, and why?</>,
              options: [
                "In the first hidden layer, because the inputs are standardised there",
                "As the output activation for binary classification, because it is the inverse of the log-odds and its saturation costs nothing once training is done",
                "Nowhere — it has been entirely superseded",
              ],
              answer: 1,
              explain: <>At the output, paired with binary cross-entropy, the sigmoid and the loss cancel to give a
                clean <M>{String.raw`p - y`}</M> gradient — so the 0.25 ceiling never enters. The problem was only
                ever about stacking it.</>,
            },
            {
              q: <>Does the 0.25 ceiling by itself prove a deep sigmoid network must fail?</>,
              options: [
                "Yes — twelve layers give 6 × 10⁻⁸ and that is the end of it",
                "No — the chain-rule product also contains the weights, and changing the initialisation scale alone moves the measured ratio from 29 million to 65",
                "No — because units rarely saturate in practice",
              ],
              answer: 1,
              explain: <>The slope is one factor per layer; the weight is the other. Sigmoid guarantees the first is
                at most 0.25, but the product's fate depends on both, which is why the same network can span six
                orders of magnitude on initialisation alone.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/activation-functions/the-step", label: <>← The step, and why it could not be trained</> }}
          next={{ href: "/learn/activation-functions/tanh-and-zero-centring", label: <>Next up · tanh &amp; zero-centring →</> }}
        />
      </div>
    </article>
  );
}
