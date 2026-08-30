import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { LabFrame } from "@/components/LabFrame";
import { LinearCollapseLab } from "@/components/labs/LinearCollapseLab";

export const metadata = {
  title: "Non-linear, or nothing — Manifold",
  description:
    "There is exactly one property an activation must have. Everything else on this track is preference; this one is arithmetic, and the proof is a single line.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function NonNegotiablePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "What an activation is for", color: CORAL }, { label: "Tier 1 · intuition", color: CORAL }]}
        time="about 7 minutes"
        title={<>Non-linear, <em>or nothing</em></>}
        intro={<>Of everything this track will ask you to weigh — range, smoothness, cost, where the slope dies —
          exactly one property is not a trade-off. Get it wrong and you do not have a worse network. You have a
          linear model with a very expensive way of writing it down.</>}
      />

      <div className="lesson">
        <h2>The one-line argument</h2>
        <p>
          A layer computes <M>{String.raw`a = f(Wx + b)`}</M>. Suppose <M>{String.raw`f`}</M> is the identity — no
          bend at all. Then two layers compute:
        </p>

        <MathBlock>{String.raw`W_2(W_1x + b_1) + b_2 \;=\; (W_2W_1)\,x \;+\; (W_2b_1 + b_2) \;=\; W'x + b'`}</MathBlock>

        <p>
          A matrix times a matrix is a matrix. The two layers have collapsed into one, and the collapse repeats: ten
          layers, a hundred layers, any width, and the whole network is still <M>{String.raw`W'x + b'`}</M> — a single
          linear map, with exactly the capacity of{" "}
          <Link href="/learn/linear-regression" style={link}>linear regression</Link>.
        </p>

        <Callout color={CORAL} title={<>What that means in practice</>}>
          It is not that the network learns badly. It is that <strong>the function class you are searching contains
          nothing a linear model does not contain.</strong> Every extra layer is parameters you pay to store,
          gradients you pay to compute, and precisely zero additional expressiveness. On the XOR problem in the
          previous track, that ceiling was 50% accuracy no matter how large the network got.
        </Callout>

        <h2>Watch it collapse</h2>
        <p>
          Below is a 1–4–4–1 network with 33 parameters and no activation. The lab multiplies its matrices out to the
          single equivalent line, then evaluates both. Re-roll the weights as often as you like: the two agree to
          floating-point noise, every time.
        </p>

        <LabFrame
          accent={CORAL}
          tryThis={<>Re-roll the weights several times and watch the deviation column. Then switch the activation on
            and re-read the same column.</>}
          insight={<>With no activation the 33-parameter network and the 2-parameter line agree to about{" "}
            <M>{String.raw`10^{-15}`}</M> — the difference is floating-point rounding, not modelling. Turn the
            activation on and the deviation jumps to <strong>9.457</strong>. That number is the entire value the
            hidden layers were adding, and it was zero until something bent.</>}
        >
          <LinearCollapseLab />
        </LabFrame>

        <Proof color={CORAL} title="how much non-linearity is enough">
          <p>
            The requirement is weaker than it looks. You do not need a particular curve, or a bounded one, or a
            smooth one. The <strong>universal approximation theorem</strong> in the form proved by Leshno, Lin,
            Pinkus and Schocken (1993) says that a single hidden layer with activation{" "}
            <M>{String.raw`f`}</M> can approximate any continuous function on a compact set to any accuracy{" "}
            <em>if and only if</em> <M>{String.raw`f`}</M> is not a polynomial.
          </p>
          <p>
            That is the whole condition. Not &ldquo;sigmoidal&rdquo;, not &ldquo;monotone&rdquo;, not
            &ldquo;bounded&rdquo; — <em>not a polynomial</em>. ReLU qualifies, and it is piecewise linear with a
            single kink. <M>{String.raw`\sin`}</M> qualifies. So does a function that bends once, badly, in the wrong
            place.
          </p>
          <p>
            Which tells you something important about the rest of this track: <strong>the choice of activation is
            never about whether the network <em>can</em> represent your function.</strong> Every candidate here can.
            The choice is entirely about whether gradient descent can find the parameters — which is a question about
            the derivative, not about expressiveness. That is why the next page is about slopes.
          </p>
        </Proof>

        <h2>The exception that proves the rule</h2>
        <p>
          There is one place a linear activation is exactly right: <strong>the output layer of a regression
          model</strong>. There you <em>want</em> an unbounded, unbent number, and the non-linearity you need has
          already been supplied by the hidden layers underneath. Applying a bend there would only restrict the range
          of values the model can predict. The output layer is a genuinely different question, and it gets{" "}
          <Link href="/learn/activation-functions/the-output-layer" style={link}>its own page</Link>.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>A colleague reports that their 50-layer network with identity activations performs identically to
                logistic regression. What has happened?</>,
              options: [
                "The network is undertrained — it needs more epochs",
                "The layers collapse into a single linear map, so the model class is exactly linear",
                "The learning rate is too low for a network that deep",
              ],
              answer: 1,
              explain: <>Composing linear maps gives a linear map. The model cannot beat logistic regression because
                it <em>is</em> logistic regression, written with 50 layers of redundant parameters. No amount of
                training changes the function class.</>,
            },
            {
              q: <>What exactly does the universal approximation theorem require of the activation?</>,
              options: [
                "That it be bounded and monotone, like sigmoid",
                "That it be smooth and differentiable everywhere",
                "That it not be a polynomial",
              ],
              answer: 2,
              explain: <>Leshno et al. (1993) proved the condition is exactly non-polynomiality. ReLU is neither
                bounded nor differentiable everywhere and qualifies comfortably. This is why expressiveness is not
                the criterion that separates the candidates on this track.</>,
            },
            {
              q: <>If every non-polynomial activation is universal, why does the choice matter at all?</>,
              options: [
                "It does not — the choice is purely aesthetic",
                "Because universality is about what the network can represent, and training is about what gradient descent can find",
                "Because only some activations allow more than one hidden layer",
              ],
              answer: 1,
              explain: <>Representability and learnability are different claims. The theorem promises a set of weights
                exists; it says nothing about whether a gradient will lead you there. The rest of this track is about
                the gradient.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/activation-functions", label: <>← Activation functions</> }}
          next={{ href: "/learn/activation-functions/the-derivative-is-the-point", label: <>Next up · The derivative is the point →</> }}
        />
      </div>
    </article>
  );
}
