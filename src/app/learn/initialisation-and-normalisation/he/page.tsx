import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LayerTrace } from "@/components/figures/LayerTrace";
import { VAR_BY_LAYER_RELU } from "@/components/figures/initNorm/data";

export const metadata = {
  title: "He / Kaiming — Manifold",
  description:
    "He et al. (2015) fixed Xavier for ReLU: because ReLU zeros half its inputs, halving the variance, you double the weight variance to Var(W) = 2/fan_in. This is the default for modern ReLU and GELU networks.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function HePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "The named initialisations", color: CORAL }, { label: "Tier 1 · intuition", color: CORAL }]}
        time="about 8 minutes"
        title={<>He / Kaiming</>}
        intro={<>Xavier assumed the activation preserves variance. ReLU does not — it deletes half of
          its inputs. He et al.&rsquo;s 2015 paper corrects for exactly that, and the correction is a
          single factor of two. That one number is why deep ReLU networks stopped stalling, and it is
          the default initialisation behind almost every modern ReLU or GELU network you will meet.</>}
      />

      <div className="lesson">
        <h2>What ReLU does to the variance</h2>
        <p>
          Xavier&rsquo;s derivation rested on one quiet assumption: that pushing a pre-activation{" "}
          <M>{String.raw`z`}</M> through the activation <M>{String.raw`g`}</M> leaves the variance
          alone. For <M>{String.raw`\tanh`}</M> near the origin that is roughly true. For ReLU it is
          badly false. ReLU is <M>{String.raw`\max(0, z)`}</M>: every negative input is set to exactly
          zero. If <M>{String.raw`z`}</M> is symmetric about zero — which it is when the weights are
          zero-mean — then <em>half</em> of the inputs are zeroed on every forward pass.
        </p>
        <p>
          Deleting half the signal halves the variance. So a layer initialised with Xavier&rsquo;s{" "}
          <M>{String.raw`1/n_{\text{in}}`}</M> and a ReLU activation does not preserve variance — it
          loses a factor of two at every layer. Over ten layers that is a factor of{" "}
          <M>{String.raw`2^{10} \approx 1000`}</M>: the signal reaching the deepest layer is a thousand
          times weaker than the one that entered. This is the vanishing-activation problem, and it is
          not a flaw in the optimiser — it is baked into the initialisation.
        </p>

        <h2>The correction: double the variance</h2>
        <p>
          The fix is to compensate in advance. If ReLU is going to halve the variance, start with twice
          as much. Replace Xavier&rsquo;s <M>{String.raw`1/n_{\text{in}}`}</M> with:
        </p>

        <MathBlock>{String.raw`\operatorname{Var}(W) = \frac{2}{n_{\text{in}}}, \qquad \operatorname{std}(W) = \sqrt{\frac{2}{n_{\text{in}}}}.`}</MathBlock>

        <p>
          The numerator <M>{String.raw`2`}</M> is the whole idea: it is the reciprocal of the{" "}
          <M>{String.raw`1/2`}</M> that ReLU removes. Formally, tracking the variance through the layer
          with the ReLU factor gives:
        </p>

        <MathBlock>{String.raw`\operatorname{Var}(z_{\ell}) = \tfrac{1}{2}\, n_{\text{in}}\, \operatorname{Var}(W)\, \operatorname{Var}(z_{\ell-1}),`}</MathBlock>

        <p>
          and setting the multiplier <M>{String.raw`\tfrac{1}{2} n_{\text{in}} \operatorname{Var}(W) = 1`}</M>{" "}
          solves to <M>{String.raw`\operatorname{Var}(W) = 2/n_{\text{in}}`}</M>. He is fan-in based by
          default (preserving the forward pass); the backward pass is preserved by the symmetric
          argument, and either fan works because the factor of two dominates the fan choice.
        </p>

        <h2>The measured confirmation</h2>
        <p>
          The difference is not subtle. On a 10-layer, width-64 ReLU network, tracking the activation
          variance layer by layer shows Xavier steadily bleeding signal while He holds it flat:
        </p>

        <PredictPrompt
          accent={CORAL}
          prompt={<>Both schemes are derived from the same variance condition and differ by a single
            factor of two. Over ten ReLU layers, how far apart do their activation variances end up?</>}
          options={[
            "A factor of two — one constant, one factor",
            "A factor of ten or so",
            "A factor of a thousand",
            "They converge — depth washes the difference out",
          ]}
          nudge="Locked in. The measured curves are below."
        />

        <LayerTrace
          series={VAR_BY_LAYER_RELU.filter((s) => /Xavier|He/.test(s.label))}
          ylabel="activation variance"
          caption={<>The factor of two compounds. Each ReLU layer keeps half the variance it is given;
            He hands each layer twice as much to start with, and the two cancel exactly — a flat line.
            Xavier hands over the un-doubled amount, so the halving is uncancelled and the line falls
            at a constant rate. By layer 10 the gap is <strong>0.7988 against 0.0008</strong>, a factor
            of roughly a thousand, produced by a constant of two.</>}
        />


        <p>
          Read the second column. With Xavier the activation variance has fallen to{" "}
          <strong>0.0008</strong> by layer 10 — the signal is all but gone, and the gradients that
          depend on it are correspondingly tiny. With He the variance sits at <strong>0.80</strong> at
          layer 10, essentially unchanged from the <strong>0.69</strong> at layer 5. That flatness is
          the factor of two doing its job: each layer&rsquo;s halving is exactly cancelled by the
          doubled starting variance, so the signal neither decays nor blows up.
        </p>

        <Callout color={CORAL} title={<>He is the modern default</>}>
          For a network built from ReLU or any of its close relatives — leaky ReLU, GELU, ELU, SiLU —
          He initialisation is the standard choice, and it is what PyTorch and Keras reach for by
          default on ReLU layers. The rule of thumb is short: if your activation zeros or nearly zeros
          part of its input, use <M>{String.raw`\operatorname{Var}(W) = 2/n_{\text{in}}`}</M>. The factor
          of two is the price of the rectifier.
        </Callout>

        <Proof color={CORAL} title="why E[ReLU(z)²] = ½ Var(z)">
          <p>
            Let <M>{String.raw`z`}</M> be zero-mean and symmetric about zero, so its density satisfies{" "}
            <M>{String.raw`f(z) = f(-z)`}</M>. The second moment of the rectified output is an integral
            over the positive half only, because ReLU is zero on the negatives:
          </p>
          <MathBlock>{String.raw`\mathbb{E}\!\left[\operatorname{ReLU}(z)^2\right] = \int_{0}^{\infty} z^2 f(z)\, dz.`}</MathBlock>
          <p>
            By symmetry the positive half of the integral equals the negative half, so it is exactly
            half of the full integral over the whole line — and that full integral is the second moment
            of <M>{String.raw`z`}</M>, which for a zero-mean variable is its variance:
          </p>
          <MathBlock>{String.raw`\int_{0}^{\infty} z^2 f(z)\, dz = \tfrac{1}{2}\int_{-\infty}^{\infty} z^2 f(z)\, dz = \tfrac{1}{2}\,\mathbb{E}[z^2] = \tfrac{1}{2}\operatorname{Var}(z).`}</MathBlock>
          <p>
            So passing a symmetric zero-mean signal through ReLU produces an output whose second moment
            is exactly half the input variance. To restore the full variance you must supply twice as
            much at the weights — which is precisely <M>{String.raw`\operatorname{Var}(W) = 2/n_{\text{in}}`}</M>.
          </p>
        </Proof>

        <h2>The template, one number changed</h2>
        <p>
          He initialisation is not a new idea; it is Xavier&rsquo;s idea with the activation modelled
          honestly. Xavier answered &ldquo;what weight scale preserves variance through a linear-ish
          activation?&rdquo; He answers the same question for an activation that throws away half its
          input. Both come from writing down what the forward pass does to the variance and solving for
          the scale that cancels it. The next page puts the two side by side and reads off exactly when
          the choice between them matters — and when the activation is so badly behaved that no
          initialisation can save it.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>He initialisation uses <M>{String.raw`\operatorname{Var}(W) = 2/n_{\text{in}}`}</M>,
                twice Xavier&rsquo;s value. What is the factor of two compensating for?</>,
              options: [
                "The two passes, forward and backward",
                "ReLU zeros roughly half of its inputs, which halves the variance; doubling the weight variance restores it",
                "The network having twice as many layers",
              ],
              answer: 1,
              explain: <>A zero-mean symmetric input to ReLU has half its mass set to zero, so the output
                variance is half the input variance. Starting with twice the weight variance cancels
                that loss and keeps the activation scale constant across layers.</>,
            },
            {
              q: <>On the 10-layer ReLU network, Xavier&rsquo;s activation variance falls from 0.0216 at
                layer 5 to 0.0008 at layer 10, while He&rsquo;s stays near 0.69 to 0.80. What does the
                Xavier trend indicate?</>,
              options: [
                "The network is overfitting",
                "Under Xavier the ReLU variance-halving is uncompensated, so the signal decays geometrically with depth and gradients vanish",
                "The learning rate is too high",
              ],
              answer: 1,
              explain: <>Xavier does not account for ReLU deleting half the signal, so each layer loses a
                factor of two. The compounding decay drives the variance toward zero, and the tiny
                activations produce tiny gradients. He&rsquo;s flat variance shows the correction
                working.</>,
            },
            {
              q: <>For which family of activations is He initialisation the appropriate default?</>,
              options: [
                "Saturating activations like sigmoid",
                "tanh and other odd, variance-preserving activations",
                "ReLU and its relatives (leaky ReLU, GELU, ELU, SiLU) that zero or nearly zero part of their input",
              ],
              answer: 2,
              explain: <>He is built for rectifier-style activations that delete part of their input and
                so halve (or nearly halve) the variance. That covers the modern default stack — ReLU,
                GELU, and friends. Symmetric variance-preserving activations like <M>{String.raw`\tanh`}</M>{" "}
                are Xavier&rsquo;s domain.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/initialisation-and-normalisation/xavier", label: <>&#8592; Xavier / Glorot</> }}
          next={{ href: "/learn/initialisation-and-normalisation/xavier-vs-he", label: <>Next up &middot; Xavier vs He, measured &#8594;</> }}
        />
      </div>
    </article>
  );
}
