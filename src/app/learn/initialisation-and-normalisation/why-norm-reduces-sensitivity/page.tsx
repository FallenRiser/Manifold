import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "Why normalisation reduces init sensitivity — Manifold",
  description:
    "The mechanism: without normalisation the init scale compounds across layers and vanishes or explodes. A normalisation layer resets the scale to unit variance every forward pass, so the error cannot compound — and a scale-invariance argument makes the network invariant to the init scale outright.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function WhyNormReducesSensitivityPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "The interaction", color: CORAL }, { label: "Tier 3 · theory", color: CORAL }]}
        time="about 8 minutes"
        title={<>Why normalisation reduces init sensitivity</>}
        intro={<>The previous page asserted that normalisation makes the init choice nearly
          irrelevant. This page proves the mechanism. The short version: initialisation tries to get
          the scale right <strong>once</strong>, at step zero, and hopes it survives; normalisation
          re-enforces the scale at <strong>every</strong> forward pass, for the whole of training. That
          difference is why a normalised network tolerates initial scales that would destroy an
          un-normalised one.</>}
      />

      <div className="lesson">
        <h2>Without normalisation, the scale compounds</h2>
        <p>
          A deep network without normalisation multiplies the activation scale layer by layer. If each
          layer multiplies the standard deviation by a factor <M>{String.raw`c`}</M> — set by the
          weight scale the init chose — then after <M>{String.raw`D`}</M> layers the scale is{" "}
          <M>{String.raw`c^{D}`}</M> times what it started as. That is an exponential in depth, and
          exponentials are unforgiving: any deviation of <M>{String.raw`c`}</M> from 1 is magnified
          into a catastrophe by the time the signal reaches the far end.
        </p>
        <p>
          We saw both failure modes measured directly. Initialise the weights a touch too small and the
          activation scale collapses — by layer 2 it is already <strong>0.0000</strong>, and the
          gradient that flows back through it is dead. Initialise a touch too large and the scale
          explodes — by layer 8 the activations reach <strong>4.20 × 10<sup>9</sup></strong>, and the
          gradient overflows. There is only a narrow band of initial scales for which{" "}
          <M>{String.raw`c^{D}`}</M> stays near 1 across the whole depth, and hitting that band by hand
          gets harder the deeper the network.
        </p>

        <MathBlock>{String.raw`\text{std}(\mathbf{h}_D) \approx c^{\,D}\,\text{std}(\mathbf{h}_0), \qquad c \ne 1 \;\Rightarrow\; \text{vanish } (c<1) \text{ or explode } (c>1).`}</MathBlock>

        <p>
          This is exactly why a good initialisation is delicate. Xavier and He are the specific weight
          scales that make <M>{String.raw`c \approx 1`}</M> for their matched activations — they are
          hand-computed attempts to hit the narrow band. But they only fix the scale <em>at step
          zero</em>. As training moves the weights, <M>{String.raw`c`}</M> drifts, and the un-normalised
          network has nothing to pull it back.
        </p>

        <h2>With normalisation, the scale is reset every layer</h2>
        <p>
          Insert a normalisation layer after each linear layer and the compounding chain is broken.
          Normalisation subtracts the mean and divides by the standard deviation of its input, so
          whatever scale arrives — 0.0000, 4.20 × 10<sup>9</sup>, anything — leaves as roughly unit
          variance. The factor <M>{String.raw`c`}</M> for the <em>normalised</em> output is forced back
          to 1 at every single layer, so it can never accumulate into <M>{String.raw`c^{D}`}</M>.
        </p>
        <p>
          The measurement makes this concrete. Un-normalised ReLU+He at depth 10 drifts from activation
          std 0.61 to 0.39 — a slow leak, because even a well-chosen <M>{String.raw`c`}</M> is not
          exactly 1. The LayerNorm-simulated version holds between 0.48 and 0.65 across all ten layers:
          the scale is pinned, not drifting. And the pathological cases cannot happen at all with
          normalisation after each layer: the too-small init cannot vanish to 0.0000 because the scale
          is divided back up, and the too-large init cannot explode to 4.20 × 10<sup>9</sup> because the
          scale is divided back down. The error is corrected before it has a chance to compound.
        </p>

        <Callout color={CORAL} title={<>Init acts once; normalisation acts always</>}>
          Initialisation is a <strong>step-zero</strong> intervention: it sets the scale correctly for
          the first forward pass and then hands control to the optimiser, which is free to drift.
          Normalisation is an <strong>every-pass</strong> intervention: it re-imposes the correct scale
          on every forward pass for the entire duration of training. That is the whole reason
          normalised networks train across a wide range of learning rates and initial scales that would
          break an un-normalised net — the scale is a guarantee, not a lucky starting condition.
        </Callout>

        <h2>Why this widens the trainable range</h2>
        <p>
          Because the scale is re-imposed rather than hoped for, the network stops caring about the
          exact initial weight scale of its normalised layers. You can be off by a factor of ten in the
          init and the normalisation layer erases the difference by the next layer. The same robustness
          extends to the learning rate: a large step that would blow up an un-normalised activation is
          renormalised on the following pass, so the effective scale the next layer sees is bounded
          regardless of how aggressive the update was. The practical consequence is the one every
          practitioner has felt — normalised networks &ldquo;just train&rdquo; over a much wider grid of
          hyperparameters.
        </p>

        <Proof color={CORAL} title="scale invariance: multiply the weights by any c, the output is unchanged">
          <p>
            Consider a single linear layer followed by a normalisation that subtracts the mean and
            divides by the standard deviation. Let the pre-activation be{" "}
            <M>{String.raw`\mathbf{z} = W\mathbf{x}`}</M>. Now scale the weights by any constant{" "}
            <M>{String.raw`c > 0`}</M>, giving <M>{String.raw`\mathbf{z}' = cW\mathbf{x} = c\mathbf{z}`}</M>.
            The normalisation computes:
          </p>
          <MathBlock>{String.raw`\text{Norm}(c\mathbf{z}) = \frac{c\mathbf{z} - \operatorname{mean}(c\mathbf{z})}{\operatorname{std}(c\mathbf{z})} = \frac{c\bigl(\mathbf{z} - \operatorname{mean}(\mathbf{z})\bigr)}{c\,\operatorname{std}(\mathbf{z})} = \frac{\mathbf{z} - \operatorname{mean}(\mathbf{z})}{\operatorname{std}(\mathbf{z})} = \text{Norm}(\mathbf{z}).`}</MathBlock>
          <p>
            The constant <M>{String.raw`c`}</M> cancels exactly — it factors out of both the centred
            numerator and the standard deviation in the denominator. The output of a normalised layer is
            therefore <strong>invariant</strong> to the scale of its own weights. Since the init only
            sets that scale, a normalised layer is invariant to the init scale outright: the network
            literally computes the same function whether you initialised those weights small, large, or
            in the &ldquo;correct&rdquo; band. That is the strongest possible statement of why
            normalisation kills init sensitivity — not &ldquo;it corrects it,&rdquo; but &ldquo;the
            forward pass does not depend on it in the first place.&rdquo;
          </p>
        </Proof>

        <h2>The honest boundary</h2>
        <p>
          Scale invariance applies to the <em>scale</em> of the normalised weights, not to their{" "}
          <em>direction</em>. The init still decides which directions the units point in and how
          symmetry is broken — that job never goes away, which is why you cannot zero-init even a
          normalised network. Normalisation frees you from one specific tyranny, the exact magnitude of
          the initial weights, and leaves the rest of the initialisation&rsquo;s job intact.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>Without normalisation, a too-small init drives the activation scale to 0.0000 by
                layer 2 and a too-large init to 4.20 × 10⁹ by layer 8. What is the underlying
                mechanism?</>,
              options: [
                "The optimiser is choosing a bad learning rate",
                "Each layer multiplies the scale by a factor c, so after D layers the scale is cᴰ — an exponential that vanishes if c<1 or explodes if c>1",
                "The activation function is saturating and killing the gradient",
              ],
              answer: 1,
              explain: <>The scale compounds multiplicatively across depth. Any deviation of the
                per-layer factor c from 1 is raised to the power D, so small errors become catastrophic
                by the far end. Only a narrow band of initial scales keeps cᴰ near 1.</>,
            },
            {
              q: <>Why can the vanish-to-0.0000 and explode-to-4.20 × 10⁹ failures not happen when a
                normalisation layer follows each linear layer?</>,
              options: [
                "Normalisation resets the activation scale toward unit variance every layer, so the factor c is forced back to 1 and cannot accumulate into cᴰ",
                "Normalisation clips the weights so they can never grow large",
                "Normalisation changes the activation function to a non-saturating one",
              ],
              answer: 0,
              explain: <>Normalisation divides by the standard deviation of its input, so whatever scale
                arrives leaves as ~unit variance. The compounding chain is broken every layer — measured
                std held at 0.48–0.65 with LayerNorm vs a drift to 0.39 without.</>,
            },
            {
              q: <>Scale the weights of a normalised layer by any constant c &gt; 0. What happens to the
                layer&rsquo;s output, and what does that imply about init sensitivity?</>,
              options: [
                "The output scales by c, so the init scale matters as much as ever",
                "The output is unchanged — c cancels between the centred numerator and the std denominator — so the layer is invariant to the scale of its own init",
                "The output becomes undefined because the std is now c times larger",
              ],
              answer: 1,
              explain: <>Norm(cz) = Norm(z): the constant factors out of both the centred numerator and
                the standard deviation and cancels exactly. The forward pass does not depend on the
                init scale of normalised weights at all — the strongest form of &ldquo;normalisation
                kills init sensitivity.&rdquo;</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/initialisation-and-normalisation/the-interaction", label: <>← Init × activation × normalisation</> }}
          next={{ href: "/learn/initialisation-and-normalisation/modern-defaults", label: <>Next up · The modern default, and when to deviate →</> }}
        />
      </div>
    </article>
  );
}
