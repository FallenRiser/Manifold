import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "What BatchNorm actually does — Manifold",
  description:
    "The exact BatchNorm operation: subtract the batch mean, divide by the batch std, then apply a learned scale and shift. What it flattens, where it sits, and why the affine parameters make it strictly more expressive.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function WhatBatchNormDoesPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Batch normalisation", color: CORAL }, { label: "Tier 2 · practitioner", color: CORAL }]}
        time="about 9 minutes"
        title={<>What BatchNorm actually does</>}
        intro={<>Set the stories aside. BatchNorm is a short, exact sequence of arithmetic applied to
          every feature over a minibatch. This chapter writes out that arithmetic, shows what it flattens
          on a real ten-layer network, and pins down why the two learned parameters it adds make it
          strictly more powerful than the layer it replaces — not less.</>}
      />

      <div className="lesson">
        <h2>The operation, exactly</h2>
        <p>
          Consider one feature — one coordinate of a layer&rsquo;s pre-activation, or one channel of a
          convolutional feature map. Over a minibatch of <M>{String.raw`m`}</M> examples, that feature
          takes values <M>{String.raw`x_1, \ldots, x_m`}</M>. BatchNorm computes the mean and variance
          of those values across the batch, standardises them, and then applies a learned scale and
          shift:
        </p>

        <MathBlock>{String.raw`\mu_B = \frac{1}{m}\sum_{i=1}^{m} x_i, \qquad \sigma_B^2 = \frac{1}{m}\sum_{i=1}^{m}(x_i - \mu_B)^2`}</MathBlock>
        <MathBlock>{String.raw`\hat{x}_i = \frac{x_i - \mu_B}{\sqrt{\sigma_B^2 + \varepsilon}}, \qquad y_i = \gamma\,\hat{x}_i + \beta`}</MathBlock>

        <p>
          Read it in four moves. Subtract the batch mean <M>{String.raw`\mu_B`}</M> so the feature is
          centred. Divide by the batch standard deviation <M>{String.raw`\sqrt{\sigma_B^2 + \varepsilon}`}</M>{" "}
          so it has unit scale — the small constant <M>{String.raw`\varepsilon`}</M> (typically{" "}
          <M>{String.raw`10^{-5}`}</M>) only guards against dividing by zero. Then multiply by a learned{" "}
          <M>{String.raw`\gamma`}</M> and add a learned <M>{String.raw`\beta`}</M>. The first two moves
          normalise; the last two hand the network back control over the final scale and shift. Each
          feature gets its own <M>{String.raw`\gamma`}</M> and <M>{String.raw`\beta`}</M>, so a layer of
          width <M>{String.raw`d`}</M> adds <M>{String.raw`2d`}</M> learned parameters.
        </p>

        <Callout color={CORAL} title={<>It normalises across the batch, per feature</>}>
          The mean and variance are taken over the <em>batch</em> dimension, separately for each
          feature. Feature 3 is standardised using the statistics of feature 3 across all{" "}
          <M>{String.raw`m`}</M> examples; feature 4 uses feature 4&rsquo;s statistics. This is the
          defining choice of BatchNorm, and it is exactly what later methods (LayerNorm, GroupNorm,
          RMSNorm) change when the batch axis is unavailable or unreliable.
        </Callout>

        <h2>Where it sits in the layer</h2>
        <p>
          A hidden layer computes a pre-activation <M>{String.raw`z = Wx + b`}</M> and then applies a
          non-linearity <M>{String.raw`g`}</M>. BatchNorm is almost always inserted <em>between</em>{" "}
          these two — you normalise the pre-activation and then activate:
        </p>
        <MathBlock>{String.raw`x \;\longrightarrow\; z = Wx \;\longrightarrow\; \text{BN}(z) = \gamma\,\hat{z} + \beta \;\longrightarrow\; g\bigl(\text{BN}(z)\bigr).`}</MathBlock>
        <p>
          Placing it before the activation keeps the input to the non-linearity in a controlled range —
          for a saturating activation like a sigmoid or tanh, that keeps the input near the responsive
          middle rather than out in the flat tails. There is a genuine and unsettled debate about
          whether normalising <em>after</em> the activation instead works as well or better; both are
          used in practice, and the original paper chose before. Notice too that the bias{" "}
          <M>{String.raw`b`}</M> has vanished from the expression: subtracting the batch mean cancels any
          constant added before it, so <M>{String.raw`\beta`}</M> takes over the bias&rsquo;s job. The
          next chapter returns to this.
        </p>

        <h2>What it flattens, measured</h2>
        <p>
          Here is the problem BatchNorm is built to erase. Take a ten-layer fully connected ReLU network,
          He-initialised, and measure the standard deviation of each layer&rsquo;s <em>activations</em>{" "}
          on a forward pass — no normalisation anywhere. Even with the &ldquo;correct&rdquo; He
          initialisation, the scale does not hold constant across depth:
        </p>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 420 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>layer</th>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>pre-activation std</th>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>activation std</th>
              </tr>
            </thead>
            <tbody>
              {([
                { l: 1, pre: "1.05", act: "0.61" },
                { l: 2, pre: "1.08", act: "0.64" },
                { l: 3, pre: "1.01", act: "0.54" },
                { l: 4, pre: "0.97", act: "0.59" },
                { l: 5, pre: "0.89", act: "0.52" },
                { l: 6, pre: "0.65", act: "0.42" },
                { l: 7, pre: "0.73", act: "0.39" },
                { l: 8, pre: "0.66", act: "0.40" },
                { l: 9, pre: "0.56", act: "0.41" },
                { l: 10, pre: "0.74", act: "0.51" },
              ] as const).map((r) => (
                <tr key={r.l}>
                  <td style={{ padding: "6px 18px 6px 0", color: "var(--ink)", fontWeight: 500, borderBottom: "1px solid var(--border)" }}>{r.l}</td>
                  <td style={{ padding: "6px 18px 6px 0", color: "var(--ink)", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>{r.pre}</td>
                  <td style={{ padding: "6px 18px 6px 0", color: "var(--ink)", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>{r.act}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 13, color: "var(--muted)" }}>
          Ten-layer fully connected net, He init, ReLU.
        </p>

        <p>
          The activation std drifts from <strong>0.61</strong> at layer 1 down to <strong>0.39</strong>{" "}
          by layer 7 before wobbling back up — a decline of roughly a third, then noise. The
          pre-activation std tells the same story: near 1.0 early, sagging to 0.56 by layer 9. This is
          the residue that even a good initialisation leaves behind; init sets the scale right{" "}
          <em>on average at the start</em>, but the exact per-layer scale still drifts, and it will drift
          differently once training moves the weights. BatchNorm removes the drift by construction:
          insert it at every layer and each layer&rsquo;s normalised output is forced back to zero mean
          and unit variance before <M>{String.raw`\gamma`}</M> and <M>{String.raw`\beta`}</M> rescale it —
          so the 0.61-to-0.39 slide flattens to a controlled 1.0 at every depth.
        </p>

        <h2>What that flattening buys</h2>
        <p>
          Four consequences follow, and they are the reasons BatchNorm is used. It <strong>stabilises the
          activation scale</strong> at every layer, so no layer is starved of signal or blown up by it.
          It <strong>decouples the layers</strong>: because each layer&rsquo;s output is re-standardised,
          a change in one layer&rsquo;s weights no longer rescales everything downstream, so the layers
          can be tuned more independently. It <strong>permits higher learning rates</strong> — the
          smoother loss landscape from the previous chapter — which is where most of the speed-up comes
          from. And it <strong>reduces sensitivity to the initialisation</strong>: if every layer is
          renormalised anyway, the exact starting scale matters far less. That last point is important
          enough that a whole later chapter is devoted to the init-times-normalisation interaction.
        </p>

        <Proof color={CORAL} title="zero mean, unit variance by construction — and strictly more expressive">
          <p>
            First, the standardised feature <M>{String.raw`\hat{x}_i = (x_i - \mu_B)/\sqrt{\sigma_B^2 + \varepsilon}`}</M>{" "}
            has, over the batch (taking <M>{String.raw`\varepsilon \to 0`}</M>), mean
          </p>
          <MathBlock>{String.raw`\frac{1}{m}\sum_i \hat{x}_i = \frac{1}{m}\sum_i \frac{x_i - \mu_B}{\sigma_B} = \frac{1}{\sigma_B}\Bigl(\underbrace{\tfrac{1}{m}\sum_i x_i}_{=\,\mu_B} - \mu_B\Bigr) = 0,`}</MathBlock>
          <p>
            and variance <M>{String.raw`\frac{1}{m}\sum_i \hat{x}_i^2 = \frac{1}{\sigma_B^2}\cdot\frac{1}{m}\sum_i (x_i-\mu_B)^2 = \frac{\sigma_B^2}{\sigma_B^2} = 1`}</M>.
            So the normalised feature is exactly zero-mean and unit-variance across the batch, by
            construction, before <M>{String.raw`\gamma`}</M> and <M>{String.raw`\beta`}</M> touch it.
          </p>
          <p>
            Second, expressiveness. Whatever function the network computes <em>without</em> the affine
            step is still reachable <em>with</em> it: setting <M>{String.raw`\gamma = 1, \beta = 0`}</M>{" "}
            leaves <M>{String.raw`y_i = \hat{x}_i`}</M>, the plain normalised output. But the affine step
            can also do more — including undo the normalisation entirely. Choosing{" "}
            <M>{String.raw`\gamma = \sqrt{\sigma_B^2 + \varepsilon}`}</M> and{" "}
            <M>{String.raw`\beta = \mu_B`}</M> gives <M>{String.raw`y_i = x_i`}</M>, recovering the
            original feature. The set of functions BatchNorm can represent therefore <em>contains</em>{" "}
            the un-normalised one as a special case. Adding <M>{String.raw`\gamma, \beta`}</M> can only
            enlarge the function class, never shrink it — the layer is strictly more expressive, not a
            constraint imposed on the network.
          </p>
        </Proof>

        <h2>The mental model</h2>
        <p>
          BatchNorm is best understood as two stages with opposite jobs. The normalisation stage
          (subtract mean, divide by std) throws away the running scale and shift of each feature,
          forcing a clean, stable distribution that does not drift with depth or with training. The
          affine stage (<M>{String.raw`\gamma, \beta`}</M>) then lets the network re-learn whatever scale
          and shift are actually useful — including, if normalisation was the wrong thing to do here, the
          identity. You get the optimisation benefits of a controlled distribution without giving up any
          representational power. The next chapter is entirely about that second stage: why those two
          little parameters matter more than they look.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>Over what does BatchNorm compute the mean μ_B and variance σ²_B?</>,
              options: [
                "Over all the features of a single example",
                "Over the batch dimension, separately for each feature",
                "Over the entire training set, once, before training starts",
              ],
              answer: 1,
              explain: <>The statistics are taken across the examples in the minibatch, independently
                for each feature or channel. That per-feature, across-the-batch choice is what the name
                &ldquo;batch&rdquo; normalisation refers to, and it is exactly the choice LayerNorm and
                friends change.</>,
            },
            {
              q: <>On the measured ten-layer He-initialised ReLU net, the activation std goes 0.61 at
                layer 1 down to 0.39 at layer 7. What does this show?</>,
              options: [
                "He initialisation is broken and should not be used",
                "Even a good initialisation only sets the scale right on average at the start; the exact per-layer scale still drifts, which is the drift BatchNorm flattens",
                "The network has already started to overfit by layer 7",
              ],
              answer: 1,
              explain: <>He init targets the correct scale in expectation, but the realised per-layer
                std still slides (0.61 to 0.39) and will move further once training updates the weights.
                BatchNorm re-standardises each layer to unit variance by construction, erasing that
                drift regardless of what init or training does.</>,
            },
            {
              q: <>Why does adding the learned parameters γ and β make the layer strictly more expressive
                rather than less?</>,
              options: [
                "Because γ and β add regularisation that improves generalisation",
                "Because the un-normalised layer is recoverable as the special case γ = √(σ²_B+ε), β = μ_B, so BatchNorm's function class contains the original one",
                "Because normalisation alone already represents every possible function",
              ],
              answer: 1,
              explain: <>Setting γ and β to the batch std and mean makes y_i = x_i, undoing the
                normalisation entirely. So anything the plain layer could do, the BatchNorm layer can do
                too, plus more. The affine step can only enlarge the reachable set of functions — the
                network is never forced to keep the normalisation if it is unhelpful.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/initialisation-and-normalisation/covariate-shift", label: <>&#8592; The internal covariate shift story</> }}
          next={{ href: "/learn/initialisation-and-normalisation/learned-affine", label: <>Next up &middot; The learned affine parameters &#8594;</> }}
        />
      </div>
    </article>
  );
}
