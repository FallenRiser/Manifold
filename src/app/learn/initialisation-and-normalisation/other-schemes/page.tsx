import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "Other schemes — Manifold",
  description:
    "LeCun, orthogonal, LSUV, identity, bias tricks, and Fixup — a tour of the initialisations beyond Xavier and He, each an answer to the same variance-preservation question under a different constraint.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function OtherSchemesPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "The named initialisations", color: CORAL }, { label: "Tier 2 · practitioner", color: CORAL }]}
        time="about 7 minutes"
        title={<>Other schemes</>}
        intro={<>Xavier and He are the two you will reach for by default, but they are two answers to a
          question that has many. Every scheme below is chasing the same goal — keep the variance from
          collapsing or exploding as signal flows through the network — under a different constraint:
          a different activation, a stricter guarantee, a data-driven measurement, or a residual
          architecture that wants to work without normalisation at all.</>}
      />

      <div className="lesson">
        <h2>LeCun: the self-normalising cousin</h2>
        <p>
          LeCun initialisation predates Xavier and uses the forward-only condition without the doubling:
        </p>

        <MathBlock>{String.raw`\operatorname{Var}(W) = \frac{1}{n_{\text{in}}}.`}</MathBlock>

        <p>
          On its own this is just Xavier&rsquo;s forward half. Its modern home is the SELU activation
          and self-normalising networks (SNNs). SELU is engineered so that, <em>paired with LeCun
          initialisation</em>, the activations converge toward zero mean and unit variance on their own —
          the network normalises itself without a BatchNorm layer. The initialisation and the activation
          are co-designed: use the wrong scale and the self-normalising fixed point is lost.
        </p>

        <h2>Orthogonal: preserve the norm exactly</h2>
        <p>
          Xavier and He preserve variance <em>in expectation</em> — on average, over the randomness of
          the draw, the scale holds. Orthogonal initialisation makes the guarantee exact by drawing the
          weight matrix to be orthogonal: <M>{String.raw`W^\top W = I`}</M>. An orthogonal matrix is a
          pure rotation (and reflection); it does not stretch or shrink any vector, so it preserves the
          norm of whatever passes through it precisely, not just on average.
        </p>
        <p>
          That exactness matters most for deep linear stacks and recurrent networks, where the same
          matrix is applied over and over. Any deviation from norm-preservation compounds across the
          repetitions; an orthogonal matrix has no deviation to compound. This is why orthogonal init is
          a standard choice for RNNs and very deep linear-ish networks.
        </p>

        <h2>LSUV: measure, then rescale</h2>
        <p>
          The variance formulas assume idealised inputs. LSUV — Layer-Sequential Unit-Variance — drops
          the assumption and measures instead. Start from an orthogonal init, then push a single batch
          of real data forward one layer at a time. After each layer, look at the actual variance of its
          outputs and rescale that layer&rsquo;s weights so the measured output variance is exactly one
          before moving to the next. It is a data-driven calibration: whatever your data&rsquo;s true
          statistics are, each layer is tuned to emit unit variance on <em>them</em>, not on an
          assumed distribution.
        </p>

        <h2>Identity and near-identity: start by doing nothing</h2>
        <p>
          For a recurrent network, a useful starting point is for the recurrent weight matrix to be the
          identity (or close to it). An identity map passes the hidden state through unchanged, so at
          initialisation the network simply copies its state forward in time. That preserves information
          over long sequences from the very first step and gives the optimiser a stable base to learn
          departures from. It is the recurrent analogue of a residual connection&rsquo;s
          &ldquo;default to passing the signal through.&rdquo;
        </p>

        <h2>Biases: zero, with one exception</h2>
        <p>
          Weights must be random to break symmetry, but biases carry no symmetry to break — set them to
          zero and let the random weights do that job. The one common exception is ReLU: initialising
          biases to a small positive value (say 0.01) nudges pre-activations onto the positive side of
          the rectifier, so fewer units start out dead. It is a minor trick, but on a network where a
          chunk of ReLU units would otherwise begin in the zero region, a small positive bias can reduce
          the dead-unit count at the start of training.
        </p>

        <h2>Fixup and T-Fixup: train deep residual nets without normalisation</h2>
        <p>
          The most ambitious schemes ask: can a careful initialisation replace the normalisation layer
          entirely? Fixup (for residual convolutional networks) and T-Fixup (for transformers) say yes.
          They scale the residual branches down by a factor that depends on the depth, so that a very
          deep stack of residual blocks starts out close to the identity and its output variance does
          not grow with depth. Done correctly, this lets you train hundreds of residual layers with{" "}
          <em>no</em> BatchNorm or LayerNorm at all — the initialisation alone holds the signal stable.
        </p>

        <Callout color={CORAL} title={<>One question, many constraints</>}>
          Every scheme on this page is an answer to the same variance-preservation question that produced
          Xavier and He. LeCun answers it for a self-normalising activation. Orthogonal answers it{" "}
          <em>exactly</em> rather than in expectation. LSUV answers it from your data rather than an
          assumption. Fixup answers it for deep residual networks so well that the normalisation layer
          becomes optional. That last one foreshadows the rest of this chapter: normalisation and
          initialisation are two ways of controlling the same signal, and they trade off against each
          other.
        </Callout>

        <Proof color={CORAL} title="why orthogonal matrices preserve the norm exactly">
          <p>
            A matrix <M>{String.raw`W`}</M> is orthogonal when <M>{String.raw`W^\top W = I`}</M>. Take
            any input vector <M>{String.raw`\mathbf{x}`}</M> and compute the squared norm of its image{" "}
            <M>{String.raw`W\mathbf{x}`}</M> directly:
          </p>
          <MathBlock>{String.raw`\|W\mathbf{x}\|^2 = (W\mathbf{x})^\top (W\mathbf{x}) = \mathbf{x}^\top W^\top W \mathbf{x} = \mathbf{x}^\top I\, \mathbf{x} = \|\mathbf{x}\|^2.`}</MathBlock>
          <p>
            The norm out equals the norm in — for <em>every</em> vector, not on average over a random
            draw. This is the difference from Xavier and He, which guarantee only that the{" "}
            <em>expected</em> variance is preserved; an individual random matrix from those schemes
            stretches some directions and shrinks others, and those distortions compound when the matrix
            is applied repeatedly. An orthogonal matrix has zero distortion in every direction, so
            applying it a hundred times in a deep or recurrent stack leaves the signal&rsquo;s magnitude
            exactly intact.
          </p>
        </Proof>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>Orthogonal initialisation preserves the norm of any vector exactly, while Xavier and He
                preserve variance only in expectation. Where does this exactness matter most?</>,
              options: [
                "Shallow two-layer networks, where init barely matters",
                "Deep linear stacks and recurrent networks, where the same matrix is applied repeatedly and any deviation from norm-preservation compounds",
                "Networks with sigmoid activations",
              ],
              answer: 1,
              explain: <>When one matrix acts over and over — a recurrent step, a deep linear chain — even
                a small expected-only deviation accumulates across the repetitions. An orthogonal matrix
                has no deviation to accumulate, so it holds the signal magnitude exactly through many
                applications.</>,
            },
            {
              q: <>LSUV initialises by forwarding a batch of real data and rescaling each layer to unit
                output variance. What does this buy over a closed-form formula like He?</>,
              options: [
                "It uses fewer parameters",
                "It calibrates to the actual statistics of your data rather than an assumed input distribution, so each layer really does emit unit variance",
                "It removes the need for an activation function",
              ],
              answer: 1,
              explain: <>The variance formulas assume idealised inputs. LSUV measures the true output
                variance layer by layer on a real batch and rescales to unit variance, so the calibration
                matches your data instead of an assumption.</>,
            },
            {
              q: <>What is the significance of Fixup / T-Fixup for the rest of this chapter?</>,
              options: [
                "They prove normalisation is always harmful",
                "They show a carefully depth-scaled initialisation can train very deep residual networks without any normalisation layer, meaning init and normalisation are two levers on the same signal",
                "They are only useful for two-layer networks",
              ],
              answer: 1,
              explain: <>Fixup scales residual branches by a depth-dependent factor so a deep stack starts
                near the identity with stable output variance — trainable with no BatchNorm or LayerNorm.
                That reframes normalisation and initialisation as alternative ways to control the same
                variance, which the interaction chapter develops.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/initialisation-and-normalisation/xavier-vs-he", label: <>&#8592; Xavier vs He, measured</> }}
          next={{ href: "/learn/initialisation-and-normalisation/covariate-shift", label: <>Next up &middot; The internal covariate shift story &#8594;</> }}
        />
      </div>
    </article>
  );
}
