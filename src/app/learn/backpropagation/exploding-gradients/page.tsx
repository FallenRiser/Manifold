import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";

export const metadata = {
  title: "Exploding gradients & clipping — Manifold",
  description:
    "The same product, with the factors slightly above one instead of below. Total gradient norm 83 at one initialisation scale and 172 billion at another — and a two-line fix that preserves the direction exactly.",
};

const CORAL = "var(--c-neural)";

export default function ExplodingGradientsPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "When gradients misbehave", color: CORAL }, { label: "Tier 2 · mechanics", color: CORAL }]}
        time="about 8 minutes"
        title={<>Exploding gradients &amp; clipping</>}
        intro={<>The mirror image of the previous page, from the identical mechanism: multiply twelve numbers
          slightly above one instead of slightly below. It is louder, easier to spot, and — unlike vanishing — has a
          fix you can apply in two lines.</>}
      />

      <div className="lesson">
        <h2>Same product, other direction</h2>
        <p>
          BP2 multiplies by <M>{String.raw`W^\top`}</M> on every layer. If the weights are large, the delta grows on
          the way back instead of shrinking, and it grows geometrically. Here is the same 12-layer ReLU network at
          five initialisation scales, one backward pass, no training:
        </p>

        <CodeOutput>{` init scale    first layer    last layer    total norm
        0.5      2.647e+01     1.130e+01     8.311e+01
        1.0      1.084e+05     4.635e+04     3.247e+05
        1.5      1.407e+07     6.014e+06     4.197e+07
        2.0      4.442e+08     1.898e+08     1.324e+09
        3.0      5.763e+10     2.463e+10     1.716e+11`}</CodeOutput>

        <p>
          From <strong>83</strong> to <strong>172 billion</strong> — a factor of two billion — by changing one
          constant from 0.5 to 3.0. Nothing else differs: same data, same architecture, same seed, same activation.
        </p>
        <p>
          Note also that the first layer has the <em>largest</em> gradient in every row, which is the exact inverse
          of the sigmoid table on the previous page. The gradient grows as it travels backwards rather than
          shrinking, and the layer furthest from the loss is worst affected in both cases — just in opposite
          directions.
        </p>

        <Callout color={CORAL} title={<>Why this one is easier to live with</>}>
          A vanishing gradient produces a model that trains and is quietly worse — no error, no warning, and the
          symptom is indistinguishable from &ldquo;this problem is hard&rdquo;. An exploding gradient produces{" "}
          <strong>NaN</strong>, usually within a handful of steps. A loud, immediate failure is a far better
          failure: you cannot ignore it, and you know exactly when it started.
        </Callout>

        <h2>What actually happens to training</h2>
        <p>
          One enormous gradient is all it takes. The update{" "}
          <M>{String.raw`\theta \leftarrow \theta - \eta\nabla\mathcal{L}`}</M> with a norm of{" "}
          <M>{String.raw`10^{11}`}</M> throws the parameters to absurd values; the next forward pass overflows to{" "}
          <code>inf</code>; <M>{String.raw`\text{inf} - \text{inf}`}</M> gives <code>NaN</code>; and NaN propagates
          through every subsequent operation. The model is unrecoverable and every parameter is now NaN.
        </p>
        <p>
          The characteristic loss curve is a long healthy decline, then a single spike, then NaN forever. If your
          run dies at step 4,000 after training perfectly well, this is almost always why — and the culprit is
          usually a single unusual batch, not a gradual drift.
        </p>

        <h2>Gradient clipping</h2>
        <p>
          The fix is blunt and works: if the whole gradient vector is longer than some threshold, rescale it to that
          length.
        </p>

        <MathBlock>{String.raw`\mathbf{g} \;\leftarrow\; \mathbf{g}\cdot\min\!\left(1,\ \frac{c}{\lVert\mathbf{g}\rVert}\right)`}</MathBlock>

        <CodeBlock
          language="Python"
          fromScratch={`loss.backward()
torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
optimizer.step()`}
        />

        <p>
          Applied to the worst row above:
        </p>

        <CodeOutput>{`  clip at 1.0: norm 1.716e+11 -> 1.000  (direction unchanged, cosine 1.000000)
  clip at 5.0: norm 1.716e+11 -> 5.000  (direction unchanged, cosine 1.000000)`}</CodeOutput>

        <p>
          The cosine similarity between the original and clipped gradients is <strong>1.000000</strong>. That is the
          property that makes clipping defensible rather than a hack: <strong>it changes only the length of the
          step, never its direction.</strong> You still move exactly where the gradient said to move — just not
          absurdly far.
        </p>

        <Callout color={CORAL} title={<>Clip the whole vector, not each element</>}>
          <code>clip_grad_norm_</code> rescales the entire gradient by one factor and preserves the direction
          exactly. <code>clip_grad_value_</code> clamps each component independently, which <em>does</em> change the
          direction — a large component gets truncated while a small one does not, so the relative sizes shift.
          Value clipping has its uses, but norm clipping is the default for a reason, and reaching for the wrong one
          quietly biases every step.
        </Callout>

        <h2>Clipping is a seatbelt, not a fix</h2>
        <p>
          It is worth being clear about what clipping does and does not do. It bounds the damage from an
          occasional large gradient. It does not address <em>why</em> the gradients are large — and if they are
          large on most steps, clipping means you are now taking a fixed-size step in the gradient direction on
          every iteration, which is a different algorithm from the one you think you are running.
        </p>
        <ul>
          <li><strong>Fix the initialisation.</strong> The table above is a table about initialisation scale. Xavier
            and He exist to put that number in the right place, and they are the subject of a track in this
            family.</li>
          <li><strong>Lower the learning rate.</strong> The explosion is in the gradient, but the damage is done by{" "}
            <M>{String.raw`\eta\nabla\mathcal{L}`}</M>.</li>
          <li><strong>Add normalisation.</strong> Batch or layer normalisation keeps activations in a controlled
            range, which keeps the products near 1 — the same equation as the previous page, solved from the other
            side.</li>
          <li><strong>Then clip anyway</strong>, at a generous threshold, as insurance against the rare bad
            batch.</li>
        </ul>
        <p>
          The rule of thumb worth carrying: <strong>if clipping is firing on most steps, it is masking a problem;
          if it fires occasionally, it is doing its job.</strong> Logging how often it triggers is the difference
          between the two, and almost nobody does it.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>Why does gradient clipping by norm preserve the direction of the update?</>,
              options: [
                "It clamps each component to the threshold independently",
                "It multiplies the whole vector by a single scalar, which cannot rotate it",
                "It recomputes the gradient with a smaller learning rate",
              ],
              answer: 1,
              explain: <>Scaling a vector by a positive scalar leaves its direction unchanged — measured cosine
                1.000000. Clipping by <em>value</em> clamps components independently and does change the direction,
                which is the distinction between the two functions.</>,
            },
            {
              q: <>Your loss trains well for 4,000 steps then becomes NaN in one step. What happened?</>,
              options: [
                "The learning rate decayed to zero",
                "A single huge gradient threw the parameters to values that overflowed on the next forward pass",
                "The model finished converging",
              ],
              answer: 1,
              explain: <>A spike then NaN forever is the signature. Once <code>inf</code> appears, subtracting it
                gives NaN and every parameter becomes NaN thereafter. It is usually one unusual batch rather than a
                gradual drift, which is why clipping — insurance against the rare event — is the right tool.</>,
            },
            {
              q: <>Clipping is triggering on nearly every step. Is that fine?</>,
              options: [
                "Yes — that is what clipping is for",
                "No — you are effectively taking a fixed-size step every iteration, and the real cause is unaddressed",
                "Yes, provided the loss is still decreasing",
              ],
              answer: 1,
              explain: <>Constant clipping replaces gradient descent with normalised steps of fixed length, which
                is a different algorithm from the one you believe you are running. It also means initialisation,
                learning rate or normalisation is wrong. Occasional triggering is insurance; constant triggering is
                a symptom.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/backpropagation/vanishing-gradients", label: <>← Vanishing gradients</> }}
          next={{ href: "/learn/backpropagation/why-depth-was-hard", label: <>Next up · Why depth was hard for twenty years →</> }}
        />
      </div>
    </article>
  );
}
