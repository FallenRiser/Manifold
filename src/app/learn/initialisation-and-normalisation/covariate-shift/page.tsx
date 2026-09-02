import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "The internal covariate shift story — Manifold",
  description:
    "BatchNorm was sold as a cure for internal covariate shift. The evidence says otherwise: it works by smoothing the loss landscape. Here are both stories, and which one the measurements support.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function CovariateShiftPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Batch normalisation", color: CORAL }, { label: "Tier 2 · practitioner", color: CORAL }]}
        time="about 8 minutes"
        title={<>The internal covariate shift story</>}
        intro={<>Batch normalisation arrived in 2015 with a tidy explanation for why it worked. That
          explanation turned out to be mostly wrong, and the real mechanism is more interesting. This
          chapter tells both stories — the one that named the technique and the one the evidence
          actually supports — because you will hear both, and it matters that you know which is which.</>}
      />

      <div className="lesson">
        <h2>The original story: a moving target</h2>
        <p>
          Ioffe and Szegedy introduced batch normalisation in 2015 with a specific diagnosis of what
          goes wrong in deep networks. Training updates every layer at once. When gradient descent
          adjusts the weights of an early layer, the distribution of that layer&rsquo;s outputs changes.
          But those outputs are the <em>inputs</em> to the next layer — so the next layer, which was
          slowly adapting to one input distribution, suddenly faces a different one. They called this
          shifting-input phenomenon <strong>internal covariate shift</strong>.
        </p>
        <p>
          The word &ldquo;covariate&rdquo; comes from statistics, where <em>covariate shift</em> names
          the situation in which the distribution of the inputs to a model changes between training and
          deployment while the input-to-output relationship stays fixed. Ioffe and Szegedy borrowed the
          term for what happens <em>inside</em> a network during training: each layer is a little model
          whose input distribution keeps moving as the layers below it learn.
        </p>
        <p>
          The intuition is appealing. If every layer must constantly re-adapt to a moving target, learning
          is slow, and you must use a small learning rate to keep the moving target from moving too far
          per step. The proposed fix follows directly: force the distribution of each layer&rsquo;s inputs
          to stay fixed — zero mean, unit variance — by normalising them over each minibatch. Pin the
          target down, and every layer can learn faster with a larger step.
        </p>

        <Callout color={CORAL} title={<>The claim, stated precisely</>}>
          Internal covariate shift is the change, during training, in the distribution of the inputs a
          given layer sees, caused by updates to the parameters of all the layers beneath it. The 2015
          paper claimed BatchNorm accelerates training <em>because</em> it reduces this shift. That
          causal claim is the part later work put to the test.
        </Callout>

        <h2>The correction: BatchNorm does not reduce the shift</h2>
        <p>
          In 2018, Santurkar, Tsipras, Ilyas, and Madry ran the experiment the original paper had
          skipped: they measured internal covariate shift directly, with and without BatchNorm, and
          asked whether the technique actually reduces it. It does not — or not by much. Networks with
          BatchNorm train faster and tolerate larger learning rates, but the distributions of their
          layer inputs are not noticeably more stable than an un-normalised network&rsquo;s. In some of
          their experiments the BatchNorm network had <em>more</em> shift, not less, yet still trained
          better.
        </p>
        <p>
          They pushed the test further. They took a BatchNorm network and deliberately <em>injected</em>{" "}
          noise after each normalisation layer — random, time-varying shifts that manufacture severe
          internal covariate shift on purpose. If the original story were right, this should have
          destroyed the benefit. It did not: the noisy-BatchNorm network still trained faster than the
          plain network. Whatever BatchNorm was doing to help, it was not stabilising the input
          distributions.
        </p>

        <h2>What it actually does: smooths the landscape</h2>
        <p>
          The same paper offered a mechanism that survives the tests. BatchNorm reparameterises the
          optimisation problem so that the loss surface becomes <strong>smoother</strong> — more
          predictable. Concretely, they showed that with BatchNorm both the loss and the gradients
          become more <em>Lipschitz</em>: the loss changes less sharply as you move through parameter
          space, and, more importantly, the gradient itself changes less sharply. The gradient you
          measure at your current point stays a good predictor of the gradient a full step away.
        </p>
        <p>
          That predictability is the whole story of why larger learning rates become safe. Gradient
          descent takes a step in the direction of the current gradient and hopes that direction is
          still roughly correct after it lands. On a jagged surface the gradient can reverse or explode
          within a single step, so you must keep steps small. On a smoothed surface the gradient is a
          trustworthy guide for a longer distance, so you can step further without overshooting — which
          is exactly the &ldquo;you can use a higher learning rate&rdquo; result that made BatchNorm
          famous.
        </p>

        <Proof color={CORAL} title="why a smoother loss lets you take bigger steps safely">
          <p>
            A gradient step is <M>{String.raw`\theta_{t+1} = \theta_t - \eta \nabla L(\theta_t)`}</M>.
            The step is only safe if the gradient at <M>{String.raw`\theta_t`}</M> is still a good
            approximation of the gradient across the whole interval you are about to traverse. Suppose
            the gradient is <M>{String.raw`\beta`}</M>-Lipschitz, meaning it cannot change too fast:
          </p>
          <MathBlock>{String.raw`\lVert \nabla L(\theta) - \nabla L(\theta') \rVert \le \beta \, \lVert \theta - \theta' \rVert.`}</MathBlock>
          <p>
            The constant <M>{String.raw`\beta`}</M> bounds how quickly the gradient can turn or grow.
            For such a function, a standard result guarantees that gradient descent decreases the loss
            at every step provided the learning rate satisfies{" "}
            <M>{String.raw`\eta \le 1/\beta`}</M>. A <em>smaller</em> <M>{String.raw`\beta`}</M> — a
            smoother surface — directly permits a <em>larger</em> safe <M>{String.raw`\eta`}</M>.
          </p>
          <p>
            BatchNorm&rsquo;s effect is to shrink <M>{String.raw`\beta`}</M>: it flattens the sharpest
            curvature of the loss, so the same guarantee now holds for a larger step. Nothing here
            mentions the distribution of layer inputs. The benefit is a property of the geometry of the
            loss, not of the statistics of the activations — which is precisely why injecting covariate
            shift back in did not remove it.
          </p>
        </Proof>

        <h2>Which story to believe</h2>
        <p>
          Believe the second one. The name &ldquo;batch normalisation&rdquo; and the phrase
          &ldquo;internal covariate shift&rdquo; are joined at the hip in the literature and in casual
          explanation, but the causal link between them did not survive scrutiny. The technique is real,
          the acceleration is real, and the larger stable learning rate is real — but the reason is the
          smoother, more Lipschitz loss landscape, not a pinned-down input distribution.
        </p>
        <p>
          This is a recurring pattern in deep learning: a technique is discovered empirically, packaged
          with a plausible mechanical story, adopted widely, and only later examined carefully enough to
          find the story was incidental. It does not make the technique less useful. It does mean you
          should hold the <em>explanation</em> loosely and let the measurements lead, which is the habit
          this whole track is built on. The next chapter sets the story aside and looks at the exact
          operation BatchNorm performs.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>What is &ldquo;internal covariate shift,&rdquo; as Ioffe and Szegedy defined it?</>,
              options: [
                "The gap between the training-set and test-set input distributions",
                "The change, during training, in the distribution of the inputs a layer sees, caused by updates to the layers beneath it",
                "The shift in a layer's output caused by the activation function saturating",
              ],
              answer: 1,
              explain: <>It is an <em>internal</em>, training-time phenomenon: as gradient descent
                updates the early layers, the distribution of their outputs — which are the inputs to
                later layers — keeps moving, forcing later layers to chase a target that will not sit
                still. The train/test gap is the ordinary (external) covariate shift the term was
                borrowed from.</>,
            },
            {
              q: <>Santurkar et al. injected time-varying noise after each BatchNorm layer to manufacture
                severe covariate shift on purpose. What did they find?</>,
              options: [
                "The network stopped training entirely, confirming the original story",
                "The network still trained faster than a plain network, showing that reducing covariate shift was not the mechanism",
                "The noise was automatically removed by the normalisation, so nothing changed",
              ],
              answer: 1,
              explain: <>The noisy-BatchNorm network kept its training advantage despite having lots of
                deliberately induced covariate shift. If stabilising the input distribution were the
                source of the benefit, forcing the distribution to lurch around would have destroyed it.
                It did not — so the benefit comes from somewhere else.</>,
            },
            {
              q: <>The evidence-supported explanation is that BatchNorm makes the loss and its gradient
                more Lipschitz. Why does that permit a larger learning rate?</>,
              options: [
                "A more Lipschitz loss has a smaller minimum, so any step reaches it faster",
                "A smoother gradient stays a good predictor further from the current point, so a larger step is unlikely to overshoot; formally, smaller curvature β allows a larger safe η ≤ 1/β",
                "Lipschitz continuity removes all local minima, so the learning rate no longer matters",
              ],
              answer: 1,
              explain: <>Gradient descent trusts the current gradient to point the right way for the
                whole step. When the gradient cannot change quickly (small Lipschitz constant β), that
                trust holds over a longer distance, and the descent guarantee η ≤ 1/β permits a larger
                step. Smoothing the landscape, not fixing the activation statistics, is what buys the
                higher learning rate.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/initialisation-and-normalisation/other-schemes", label: <>&#8592; Other schemes</> }}
          next={{ href: "/learn/initialisation-and-normalisation/what-batchnorm-does", label: <>Next up &middot; What BatchNorm actually does &#8594;</> }}
        />
      </div>
    </article>
  );
}
