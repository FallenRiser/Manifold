import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "Xavier / Glorot — Manifold",
  description:
    "Glorot and Bengio (2010) derived the initialisation scale that keeps activations and gradients alive: Var(W) = 1/fan_in for the forward pass, a fan-in/fan-out compromise for both passes at once.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function XavierPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "The named initialisations", color: CORAL }, { label: "Tier 1 · intuition", color: CORAL }]}
        time="about 8 minutes"
        title={<>Xavier / Glorot</>}
        intro={<>The variance argument told you what a good initialisation must do: keep the signal
          from shrinking or exploding as it passes through the layers. Xavier initialisation, from
          Glorot &amp; Bengio&rsquo;s 2010 paper, is the first named scheme to turn that requirement
          into a formula. It answers the forward-pass condition exactly, and then makes a small
          compromise so the backward pass is nearly as well behaved.</>}
      />

      <div className="lesson">
        <h2>The forward condition</h2>
        <p>
          Take one layer computing <M>{String.raw`\mathbf{z} = W\mathbf{x}`}</M>, where{" "}
          <M>{String.raw`\mathbf{x}`}</M> has <M>{String.raw`n_{\text{in}}`}</M> components (the{" "}
          <em>fan-in</em>). If the weights are drawn independently with mean zero and variance{" "}
          <M>{String.raw`\operatorname{Var}(W)`}</M>, and the inputs are independent with variance{" "}
          <M>{String.raw`\operatorname{Var}(x)`}</M>, then each output component is a sum of{" "}
          <M>{String.raw`n_{\text{in}}`}</M> independent terms and its variance is:
        </p>

        <MathBlock>{String.raw`\operatorname{Var}(z) = n_{\text{in}} \, \operatorname{Var}(W) \, \operatorname{Var}(x).`}</MathBlock>

        <p>
          For the output variance to equal the input variance — so the signal is neither amplified nor
          attenuated as it moves forward — you need the coefficient in front of{" "}
          <M>{String.raw`\operatorname{Var}(x)`}</M> to be one:
        </p>

        <MathBlock>{String.raw`n_{\text{in}} \, \operatorname{Var}(W) = 1 \quad\Longrightarrow\quad \operatorname{Var}(W) = \frac{1}{n_{\text{in}}}.`}</MathBlock>

        <p>
          That is the entire forward-pass argument. Draw each weight from a distribution with variance{" "}
          <M>{String.raw`1/n_{\text{in}}`}</M> and the activations hold their scale layer after layer.
          This is why the scheme is sometimes written as <M>{String.raw`\operatorname{Var}(W) = 1/\text{fan\_in}`}</M>.
        </p>

        <h2>The backward condition</h2>
        <p>
          There is a second signal moving through the network: the gradient, travelling backwards. By
          exactly the same variance bookkeeping applied to the chain rule, the gradient at a layer is a
          sum over its <em>outputs</em> — the fan-out, <M>{String.raw`n_{\text{out}}`}</M>. Preserving
          the gradient variance across the layer therefore wants:
        </p>

        <MathBlock>{String.raw`\operatorname{Var}(W) = \frac{1}{n_{\text{out}}}.`}</MathBlock>

        <p>
          Now the two conditions disagree. The forward pass wants{" "}
          <M>{String.raw`1/n_{\text{in}}`}</M>; the backward pass wants{" "}
          <M>{String.raw`1/n_{\text{out}}`}</M>. Unless a layer happens to be square (equal fan-in and
          fan-out) you cannot satisfy both. Glorot &amp; Bengio&rsquo;s answer is to split the
          difference — use the average of the two denominators — giving the symmetric variant:
        </p>

        <MathBlock>{String.raw`\operatorname{Var}(W) = \frac{2}{n_{\text{in}} + n_{\text{out}}}.`}</MathBlock>

        <p>
          When fan-in and fan-out are equal this reduces to <M>{String.raw`1/n`}</M>, matching the
          forward-only formula. When they differ, it lands halfway between what each pass would prefer:
          neither signal is held exactly, but both are held approximately.
        </p>

        <h2>The two forms you will see in code</h2>
        <p>
          Xavier is quoted in two shapes depending on the sampling distribution. A normal (Gaussian)
          draw uses the variance directly:
        </p>

        <MathBlock>{String.raw`W \sim \mathcal{N}\!\left(0,\ \frac{2}{n_{\text{in}} + n_{\text{out}}}\right).`}</MathBlock>

        <p>
          A uniform draw needs a bound whose distribution has that same variance. A uniform on{" "}
          <M>{String.raw`[-a, a]`}</M> has variance <M>{String.raw`a^2/3`}</M>, so setting{" "}
          <M>{String.raw`a^2/3 = 2/(n_{\text{in}} + n_{\text{out}})`}</M> and solving gives the familiar
          bound:
        </p>

        <MathBlock>{String.raw`W \sim \mathcal{U}\!\left[-\sqrt{\tfrac{6}{n_{\text{in}} + n_{\text{out}}}},\ \ +\sqrt{\tfrac{6}{n_{\text{in}} + n_{\text{out}}}}\right].`}</MathBlock>

        <p>
          The <M>{String.raw`\sqrt{6}`}</M> is not magic; it is <M>{String.raw`\sqrt{3 \times 2}`}</M>,
          the <M>{String.raw`3`}</M> coming from the variance of a uniform and the{" "}
          <M>{String.raw`2`}</M> from the numerator. Both forms encode the same target variance. Most
          libraries default to the uniform version (it is what sklearn and the original paper use), but
          the choice between them is minor next to getting the scale right.
        </p>

        <h2>The assumption baked in</h2>
        <p>
          Every step above quietly assumed the activation does nothing to the variance — that passing
          <M>{String.raw`z`}</M> through <M>{String.raw`g`}</M> leaves <M>{String.raw`\operatorname{Var}(g(z)) \approx \operatorname{Var}(z)`}</M>. That is true for a
          function that is <strong>symmetric about zero with unit slope at the origin</strong>: near the
          start of training the pre-activations are small and centred, and such a{" "}
          <M>{String.raw`g`}</M> acts almost like the identity there. The identity, <M>{String.raw`\tanh`}</M>,
          and other odd, saturation-free-at-the-origin activations all fit. This is why Xavier is the
          natural companion to <M>{String.raw`\tanh`}</M>.
        </p>
        <p>
          Measured on a 10-layer, width-64 network with <M>{String.raw`\tanh`}</M> activations, Xavier
          gives a last-layer / first-layer gradient-norm ratio of <strong>5.45</strong> at
          initialisation. A ratio near one would be perfect balance; 5.45 is comfortably healthy — the
          gradient reaching the deepest layer is the same order of magnitude as the one reaching the
          shallowest, which is exactly what a preserved-variance scheme is supposed to deliver.
        </p>

        <Callout color={CORAL} title={<>Xavier assumes the activation is nearly linear at zero</>}>
          The <M>{String.raw`1/\text{fan\_in}`}</M> derivation holds only when the activation passes
          variance through unchanged. A <M>{String.raw`\tanh`}</M> unit does that near the origin, so
          Xavier and <M>{String.raw`\tanh`}</M> are a matched pair. A ReLU zeros half of its inputs and
          breaks the assumption — which is exactly the gap the next page, He initialisation, is built to
          close.
        </Callout>

        <Proof color={CORAL} title="why the two conditions average">
          <p>
            The forward pass propagates activations: variance multiplies by{" "}
            <M>{String.raw`n_{\text{in}} \operatorname{Var}(W)`}</M> per layer, so holding the
            activation scale wants <M>{String.raw`n_{\text{in}} \operatorname{Var}(W) = 1`}</M>. The
            backward pass propagates gradients through the transpose of the same weight matrix, so its
            variance multiplies by <M>{String.raw`n_{\text{out}} \operatorname{Var}(W)`}</M> per layer,
            and holding the gradient scale wants <M>{String.raw`n_{\text{out}} \operatorname{Var}(W) = 1`}</M>.
          </p>
          <p>
            These are two equations in one unknown, <M>{String.raw`\operatorname{Var}(W)`}</M>. They
            have a common solution only when <M>{String.raw`n_{\text{in}} = n_{\text{out}}`}</M>. Glorot
            &amp; Bengio do not pick a winner; they minimise the combined disagreement by targeting the
            harmonic-mean-like compromise <M>{String.raw`\operatorname{Var}(W) = 2/(n_{\text{in}} + n_{\text{out}})`}</M>,
            the reciprocal of the average denominator. For a square layer both equations and the
            compromise collapse to the same <M>{String.raw`1/n`}</M>; for a rectangular layer the
            compromise keeps <em>both</em> passes within a bounded factor of ideal rather than solving
            one exactly and letting the other drift.
          </p>
        </Proof>

        <h2>What Xavier gives you</h2>
        <p>
          Xavier is the initialisation that made deep <M>{String.raw`\tanh`}</M> and sigmoid-adjacent
          networks trainable in the era before ReLU took over. Its logic is the template every later
          scheme follows: write down what the forward pass does to the variance, write down what the
          backward pass does, and choose the weight scale that keeps both signals from collapsing. He
          initialisation, next, keeps the template and changes exactly one number to account for what
          ReLU does that <M>{String.raw`\tanh`}</M> does not.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>Xavier&rsquo;s forward-pass condition is <M>{String.raw`\operatorname{Var}(W) = 1/n_{\text{in}}`}</M>.
                Where does the <M>{String.raw`n_{\text{in}}`}</M> in the denominator come from?</>,
              options: [
                "It is the number of layers in the network",
                "Each output is a sum of n_in independent weighted inputs, so its variance scales with n_in; dividing by n_in cancels that growth",
                "It is chosen empirically to make training fast",
              ],
              answer: 1,
              explain: <>An output neuron sums <M>{String.raw`n_{\text{in}}`}</M> independent terms, so
                <M>{String.raw`\operatorname{Var}(z) = n_{\text{in}} \operatorname{Var}(W)\operatorname{Var}(x)`}</M>.
                Setting <M>{String.raw`\operatorname{Var}(W) = 1/n_{\text{in}}`}</M> makes the coefficient
                one and holds the activation variance constant across layers.</>,
            },
            {
              q: <>Why does the symmetric Xavier variant use <M>{String.raw`2/(n_{\text{in}} + n_{\text{out}})`}</M>
                instead of a single fan?</>,
              options: [
                "To use more parameters",
                "The forward pass wants 1/fan_in and the backward pass wants 1/fan_out; when they disagree, the scheme averages the two denominators as a compromise",
                "Because fan-out is always larger than fan-in",
              ],
              answer: 1,
              explain: <>Preserving activation variance wants <M>{String.raw`1/n_{\text{in}}`}</M>;
                preserving gradient variance wants <M>{String.raw`1/n_{\text{out}}`}</M>. These cannot
                both hold in a rectangular layer, so Xavier targets the reciprocal of their average,
                keeping both passes approximately balanced.</>,
            },
            {
              q: <>Xavier&rsquo;s derivation assumes the activation preserves variance. For which
                activation is that assumption most accurate?</>,
              options: [
                "ReLU, because it is piecewise linear",
                "A saturating sigmoid far from the origin",
                "tanh, which is symmetric about zero with unit slope at the origin, so it acts nearly like the identity for small pre-activations",
              ],
              answer: 2,
              explain: <>The derivation treats the activation as roughly identity near zero. That holds
                for an odd function with unit derivative at the origin, like <M>{String.raw`\tanh`}</M>.
                ReLU zeros half of its inputs, halving the variance and breaking the assumption — which
                is what He initialisation corrects.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/initialisation-and-normalisation/breaking-symmetry", label: <>&#8592; Breaking symmetry</> }}
          next={{ href: "/learn/initialisation-and-normalisation/he", label: <>Next up &middot; He / Kaiming &#8594;</> }}
        />
      </div>
    </article>
  );
}
