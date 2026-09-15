import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { BatchNormFlow } from "@/components/figures/initNorm/BatchNormFlow";

export const metadata = {
  title: "The learned affine parameters — Manifold",
  description:
    "Why BatchNorm carries γ and β. Without them, every pre-activation is forced to zero mean and unit variance, which throws away useful scale and can cripple a sigmoid. The affine step gives the network the choice back.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function LearnedAffinePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Batch normalisation", color: CORAL }, { label: "Tier 2 · practitioner", color: CORAL }]}
        time="about 6 minutes"
        title={<>The learned affine parameters</>}
        intro={<>The normalisation half of BatchNorm forces every feature to zero mean and unit variance.
          On its own that is too blunt — it discards scale and shift the network may actually need. The
          two learned parameters <M>{String.raw`\gamma`}</M> and <M>{String.raw`\beta`}</M> exist to hand
          that control back. This short chapter is about why they are not optional.</>}
      />

      <div className="lesson">
        <h2>The problem with normalisation alone</h2>
        <p>
          Suppose BatchNorm stopped after standardising — every feature pinned to zero mean and unit
          variance, full stop. That is a strong constraint, and often the wrong one. The right scale and
          shift for a feature is a property of the problem, and forcing all of them to look identical
          throws away information the network worked to produce.
        </p>
        <p>
          The sharpest example is a saturating activation. A sigmoid maps its input through an S-curve
          that is only responsive near zero and flattens toward 0 and 1 in both tails. If you feed it a
          feature locked to unit variance, almost all of its inputs land in the narrow, near-linear
          middle of the curve — the region where a sigmoid behaves like a straight line. The network can
          no longer use the sigmoid&rsquo;s non-linearity, because you have confined it to the part of
          its range where it barely bends. To exploit the saturating regions — the part that makes a
          sigmoid a sigmoid — the network needs to <em>choose</em> a wider scale or an offset, and
          fixed zero-mean/unit-variance forbids exactly that choice.
        </p>

        <Callout color={CORAL} title={<>Normalisation is a starting point, not a verdict</>}>
          Zero mean and unit variance is a good default distribution to hand to the next layer. It is a
          bad thing to <em>mandate</em>. The whole design of BatchNorm is: normalise to a clean default,
          then let the network move away from that default wherever moving away helps. The two halves do
          opposite jobs on purpose.
        </Callout>

        <h2>What γ and β restore</h2>
        <p>
          After standardising to <M>{String.raw`\hat{x}`}</M>, BatchNorm applies{" "}
          <M>{String.raw`y = \gamma\,\hat{x} + \beta`}</M>. The scale <M>{String.raw`\gamma`}</M> sets how
          wide the feature&rsquo;s distribution is; the shift <M>{String.raw`\beta`}</M> sets where it is
          centred. Between them they can place the feature at any scale and any location — including
          right back where it started. If normalisation was unhelpful for this feature, the network can
          recover the identity by learning <M>{String.raw`\gamma = \sigma`}</M> and{" "}
          <M>{String.raw`\beta = \mu`}</M>, undoing the standardisation entirely. If a wider spread helps
          a sigmoid reach its tails, the network learns a large <M>{String.raw`\gamma`}</M>. Nothing is
          forced; everything is learned.
        </p>
        <p>
          Crucially, <M>{String.raw`\gamma`}</M> and <M>{String.raw`\beta`}</M> are ordinary learned
          parameters, trained by backpropagation exactly like weights. There are two per feature — a
          layer of width <M>{String.raw`d`}</M> adds <M>{String.raw`2d`}</M> of them — and they receive
          gradients from the loss and update by gradient descent alongside everything else. They are not
          hyperparameters you tune; they are parameters the optimiser sets for you.
        </p>

        <BatchNormFlow
          caption={<>Read the figure right to left for once. Step 4 is not a correction bolted onto
            steps 2 and 3 — it is the point of them. Normalising alone would pin every layer&rsquo;s
            output to mean 0 and variance 1 for ever, which forbids a layer from ever choosing a
            different scale even when a different scale is the right answer. With{" "}
            <M>{String.raw`\gamma`}</M> and <M>{String.raw`\beta`}</M> the layer keeps that freedom and
            loses only the <em>route</em> by which it used to get there.</>}
        />

        <h2>β absorbs the bias</h2>
        <p>
          There is a tidy interaction with the layer&rsquo;s own bias. A linear or convolutional layer
          normally computes <M>{String.raw`z = Wx + b`}</M>. But BatchNorm&rsquo;s first move is to
          subtract the batch mean, and adding a constant <M>{String.raw`b`}</M> to every example shifts
          the mean by exactly <M>{String.raw`b`}</M> — which the mean-subtraction then removes. The bias
          has no effect on the normalised output at all: whatever shift you wanted, <M>{String.raw`\beta`}</M>{" "}
          now provides it. So when BatchNorm sits immediately after a linear or conv layer, that
          layer&rsquo;s bias is redundant and is conventionally turned off (<code>bias=False</code> in
          PyTorch, <code>use_bias=False</code> in Keras). Leaving it in is not wrong, just wasteful — two
          parameters doing one job.
        </p>

        <Proof color={CORAL} title="γ, β strictly enlarge the function class — the identity is inside it">
          <p>
            Write the BatchNorm output as a function of the pre-normalised feature{" "}
            <M>{String.raw`x`}</M> with batch statistics <M>{String.raw`\mu, \sigma`}</M>:
          </p>
          <MathBlock>{String.raw`y = \gamma\,\frac{x - \mu}{\sigma} + \beta.`}</MathBlock>
          <p>
            This is an affine map from <M>{String.raw`x`}</M> to <M>{String.raw`y`}</M> with slope{" "}
            <M>{String.raw`\gamma/\sigma`}</M> and intercept <M>{String.raw`\beta - \gamma\mu/\sigma`}</M>.
            As <M>{String.raw`\gamma`}</M> and <M>{String.raw`\beta`}</M> range over all real values, the
            slope and intercept range over <em>all</em> possible affine maps — every scale and every
            shift is reachable. In particular, choosing <M>{String.raw`\gamma = \sigma`}</M> and{" "}
            <M>{String.raw`\beta = \mu`}</M> gives slope 1 and intercept 0, i.e. <M>{String.raw`y = x`}</M>,
            the identity.
          </p>
          <p>
            So the family of functions <em>with</em> the affine parameters strictly contains the single
            fixed function <M>{String.raw`y = (x-\mu)/\sigma`}</M> you get without them, and also contains
            the do-nothing identity. Adding <M>{String.raw`\gamma, \beta`}</M> cannot make the network
            worse: at minimum it can reproduce plain normalisation, and it can reproduce no-normalisation,
            and it can reach everything in between. This is the formal sense in which they enlarge, never
            shrink, what the layer can represent.
          </p>
        </Proof>

        <h2>The takeaway</h2>
        <p>
          <M>{String.raw`\gamma`}</M> and <M>{String.raw`\beta`}</M> are what keep BatchNorm from being a
          straitjacket. The normalisation gives you a stable, well-behaved distribution for free; the
          affine parameters make that a suggestion the network can override, per feature, by learning. If
          the honest answer for some feature is &ldquo;normalisation did not help here,&rdquo; the network
          can say so by learning the identity. That is why every BatchNorm layer you will ever use carries
          these two parameters — and why the bias in the layer feeding it usually does not.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>Why is fixing every feature to zero mean and unit variance, with no affine step,
                a problem for a sigmoid activation?</>,
              options: [
                "Unit variance makes the sigmoid's gradient explode",
                "Unit-variance inputs land almost entirely in the sigmoid's near-linear middle, so the network cannot use its saturating, non-linear regions",
                "The sigmoid requires strictly positive inputs, which zero mean violates",
              ],
              answer: 1,
              explain: <>A sigmoid only bends near zero and flattens in its tails. Pinning inputs to
                unit variance keeps them in the responsive middle where the curve is nearly straight,
                wasting the non-linearity. Learning a larger γ lets the network reach the tails when
                that helps.</>,
            },
            {
              q: <>How can a BatchNorm layer recover the original, un-normalised feature if normalisation
                turns out to be unhelpful?</>,
              options: [
                "It cannot; normalisation is irreversible once applied",
                "By learning γ = σ and β = μ, which makes y = x and undoes the standardisation",
                "By setting ε to a large value that cancels the division",
              ],
              answer: 1,
              explain: <>The affine map y = γ(x−μ)/σ + β becomes the identity y = x precisely when
                γ = σ and β = μ. Because those are ordinary learned parameters, the network can reach
                that setting by gradient descent whenever undoing the normalisation lowers the loss.</>,
            },
            {
              q: <>When a BatchNorm layer immediately follows a linear or convolutional layer, why is
                that layer&rsquo;s bias term redundant?</>,
              options: [
                "The bias is folded into the weight matrix during training",
                "BatchNorm subtracts the batch mean, which removes any constant the bias added, and β then supplies whatever shift is wanted",
                "The bias is redundant only when the learning rate is small",
              ],
              answer: 1,
              explain: <>Adding a constant bias shifts the batch mean by that same constant, and
                BatchNorm&rsquo;s mean-subtraction immediately cancels it — so the bias has no effect on
                the output. β provides the shift instead, which is why the feeding layer is usually
                configured with bias off.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/initialisation-and-normalisation/what-batchnorm-does", label: <>&#8592; What BatchNorm actually does</> }}
          next={{ href: "/learn/initialisation-and-normalisation/batchnorm-at-test", label: <>Next up &middot; BatchNorm at test time &#8594;</> }}
        />
      </div>
    </article>
  );
}
