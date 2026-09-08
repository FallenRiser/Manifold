import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { PredictPrompt } from "@/components/PredictPrompt";
import { CodeOutput } from "@/components/CodeOutput";

export const metadata = {
  title: "tanh & zero-centring — Manifold",
  description:
    "tanh is a rescaled sigmoid, which sounds like a cosmetic change. It is worth a factor of four on every gradient and it removes a coupling that forces whole columns of weights to move together — measured here at 100% against 0%.",
};

const CORAL = "var(--c-neural)";

export default function TanhPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "The squashing era", color: CORAL }, { label: "Tier 1→2", color: CORAL }]}
        time="about 9 minutes"
        title={<>tanh &amp; zero-centring</>}
        intro={<>tanh is algebraically just a stretched, shifted sigmoid. Two differences follow from that stretch,
          and one of them is a property almost nobody can state precisely — so we will measure it rather than
          assert it.</>}
      />

      <div className="lesson">
        <h2>The same function, moved</h2>

        <MathBlock>{String.raw`\tanh(z) = \frac{e^{z}-e^{-z}}{e^{z}+e^{-z}} = 2\sigma(2z) - 1 \qquad\qquad \tanh'(z) = 1 - \tanh^2(z)`}</MathBlock>

        <p>
          Doubling the input and the output range, then shifting down by one. Cosmetic, on the face of it. It buys
          exactly two things.
        </p>
        <p>
          <strong>First: the peak slope becomes 1.</strong> The stretch multiplies the derivative by four, so
          sigmoid&rsquo;s hard ceiling of 0.25 becomes tanh&rsquo;s ceiling of 1.000. A tanh unit near zero passes
          the gradient through essentially untouched. That single number is why the measured twelve-layer ratio is
          1.63 for tanh and 29 million for sigmoid.
        </p>
        <p>
          <strong>Second: the output is centred on zero.</strong> This is the one that needs unpacking, because it is
          usually stated as a vague preference and it is in fact a precise statement about the shape of the weight
          gradient.
        </p>

        <h2>What a non-zero-centred output does</h2>
        <p>
          Take one training example. The gradient of the loss with respect to a weight matrix is an outer product —
          the incoming activations against the outgoing deltas:
        </p>

        <MathBlock>{String.raw`\frac{\partial \mathcal{L}}{\partial W_{ij}} \;=\; a_i\,\delta_j`}</MathBlock>

        <p>
          Now fix a unit <M>{String.raw`j`}</M> and look at the whole column of weights feeding into it. Every entry
          is <M>{String.raw`a_i \delta_j`}</M> for the same <M>{String.raw`\delta_j`}</M>. If all the incoming
          activations <M>{String.raw`a_i`}</M> are positive — as they are for sigmoid, and for ReLU — then{" "}
          <strong>every weight in that column gets a gradient of the same sign.</strong>
        </p>
        <p>
          The consequence: on that example, all of unit <M>{String.raw`j`}</M>&rsquo;s incoming weights must increase
          together or decrease together. They cannot move in different directions. If the update the parameters
          actually need is &ldquo;raise this one, lower that one&rdquo;, the optimiser has to get there by
          alternating across examples — the zig-zag path that classical treatments draw.
        </p>

        <PredictPrompt
          accent={CORAL}
          prompt={<>Of sigmoid, tanh, ReLU and GELU, how many force every weight in a column to share a sign on a
            given example?</>}
          options={["Only sigmoid", "Sigmoid and ReLU", "All four — it is unavoidable"]}
          nudge="Locked in. The measurement is directly below."
        />

        <h2>Measured, not asserted</h2>
        <p>
          Take a four-hidden-layer network, compute single-example gradients, and count
          the fraction of weight columns whose entries all share a sign:
        </p>

        <CodeOutput>{`activation   mean activation   units forced one way
   sigmoid            0.5026                 100.0%
      tanh            0.1057                   0.0%
      relu            0.1394                 100.0%
      gelu            0.0475                   0.0%`}</CodeOutput>

        <p>
          It is not a tendency. It is <strong>100% against 0%</strong> — every column or none — because the property
          is structural: if the activations cannot be negative, the signs cannot differ.
        </p>

        <Callout color={CORAL} title={<>The row that spoils the story</>}>
          <strong>ReLU is also 100%.</strong> Its outputs are non-negative, so it has exactly the same coupling that
          the textbook criticism aims at sigmoid — and ReLU is the default activation of the last decade.
          <br /><br />
          So zero-centring cannot be a decisive property, or ReLU would never have won. What actually happened is
          that the problem was solved somewhere else: <strong>batch and layer normalisation re-centre the
          activations between layers</strong>, which removes the coupling regardless of what the activation does. In
          a network with normalisation, this criticism of sigmoid is close to moot — and the 0.25 ceiling, which
          normalisation does not touch, is the reason sigmoid still loses.
        </Callout>

        <Proof color={CORAL} title="the sign-coupling argument in full">
          <p>
            For a single example, with incoming activations <M>{String.raw`a \in \mathbb{R}^{m}`}</M> and outgoing
            deltas <M>{String.raw`\delta \in \mathbb{R}^{n}`}</M>, the weight gradient is the rank-one matrix{" "}
            <M>{String.raw`G = a\delta^\top`}</M>. Column <M>{String.raw`j`}</M> is{" "}
            <M>{String.raw`\delta_j \, a`}</M>: a scalar multiple of the activation vector.
          </p>
          <p>
            Hence <M>{String.raw`\mathrm{sign}(G_{ij}) = \mathrm{sign}(\delta_j)\cdot\mathrm{sign}(a_i)`}</M>. If
            every <M>{String.raw`a_i > 0`}</M>, the column&rsquo;s signs are all{" "}
            <M>{String.raw`\mathrm{sign}(\delta_j)`}</M> and the update direction for that column is confined to a
            single orthant.
          </p>
          <p>
            Two things soften this in practice, and both are worth knowing so you do not overweight the argument.
            The gradient you actually apply is averaged over a batch, and different examples have different{" "}
            <M>{String.raw`\delta_j`}</M> signs, so the average is not confined; the constraint bites per-example,
            which is why it hurts small batches more. And momentum-based optimisers already smooth the alternation
            the constraint produces. This is a real effect on convergence <em>speed</em>, not on what the network can
            represent — which is exactly why it lost to a 0.25 ceiling in importance.
          </p>
        </Proof>

        <h2>Where tanh is still the right answer</h2>
        <p>
          Not a historical curiosity: tanh remains the standard activation for{" "}
          <strong>recurrent hidden state</strong>, in LSTMs and GRUs. The reason is the property that disqualified it
          from feedforward hidden layers — it is bounded.
        </p>
        <p>
          A recurrent network applies the same transformation to its own state dozens or hundreds of times. With an
          unbounded activation, a state that grows even slightly per step grows without limit; tanh&rsquo;s{" "}
          <M>{String.raw`[-1, 1]`}</M> range makes the state incapable of exploding by construction. In a
          feedforward network of twelve layers, saturation is the greater risk; in a recurrent one unrolled over 200
          steps, unboundedness is. <strong>Same property, opposite verdict, because the architecture changed the
          question.</strong>
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>Why does tanh&rsquo;s peak derivative equal 1 when sigmoid&rsquo;s equals 0.25?</>,
              options: [
                "Because tanh is not an exponential function",
                "Because tanh(z) = 2σ(2z) − 1, and the two stretches contribute a factor of 4 to the derivative",
                "Because tanh saturates less often",
              ],
              answer: 1,
              explain: <>The inner factor of 2 comes from the chain rule and the outer factor of 2 from the vertical
                stretch, giving <M>{String.raw`\tanh' = 4\sigma'(2z)`}</M> and a peak of{" "}
                <M>{String.raw`4\times\tfrac14 = 1`}</M>. tanh in fact saturates on <em>more</em> of the input range
                than sigmoid.</>,
            },
            {
              q: <>The measurement shows ReLU forcing 100% of weight columns to share a sign, exactly like sigmoid.
                What does that tell you about the zero-centring argument?</>,
              options: [
                "That the measurement is wrong — ReLU is zero-centred",
                "That zero-centring cannot be a decisive criterion, since the field's default activation violates it",
                "That ReLU is only usable with small batches",
              ],
              answer: 1,
              explain: <>ReLU outputs are non-negative, so the coupling is identical. It is a real effect on
                convergence speed, and it was outweighed by ReLU's non-saturating positive half — and later made
                largely moot by normalisation layers.</>,
            },
            {
              q: <>Why is tanh still standard inside LSTM and GRU cells?</>,
              options: [
                "Because recurrent networks are shallow, so saturation does not occur",
                "Because it is bounded, and a state transformed hundreds of times must not be able to grow without limit",
                "Because its derivative is cheaper than ReLU's",
              ],
              answer: 1,
              explain: <>Boundedness is a liability at depth and an asset under repeated self-application. The
                property did not change; the architecture changed which risk dominates.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/activation-functions/sigmoid", label: <>← Sigmoid</> }}
          next={{ href: "/learn/activation-functions/what-depth-did", label: <>Next up · What depth did to both →</> }}
        />
      </div>
    </article>
  );
}
