import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "BatchNorm at test time — Manifold",
  description:
    "At training BatchNorm uses batch statistics; at test you may have a batch of one. The fix is running estimates kept during training. The classic bug is forgetting model.eval(). Here is the mechanism and the traps.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function BatchNormAtTestPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Batch normalisation", color: CORAL }, { label: "Tier 2 · practitioner", color: CORAL }]}
        time="about 7 minutes"
        title={<>BatchNorm at test time</>}
        intro={<>BatchNorm has a split personality. During training it standardises using the current
          minibatch&rsquo;s statistics. At test time that is impossible or unwise — you may be classifying
          a single example, and you certainly want the same input to give the same output every time. The
          resolution is a set of running statistics collected during training, and the most common
          BatchNorm bug in practice is forgetting to switch over to them.</>}
      />

      <div className="lesson">
        <h2>The train/test discrepancy</h2>
        <p>
          At training time, BatchNorm normalises each feature using the mean and variance of the current
          minibatch: <M>{String.raw`\mu_B`}</M> and <M>{String.raw`\sigma_B^2`}</M>. That is fine while
          you are processing batches of, say, 128 examples. But at inference, three things go wrong with
          using batch statistics:
        </p>
        <p>
          First, you often have a <strong>batch of one</strong> — a single image to classify, a single
          request to serve. The variance of one example is zero and its mean is itself, so
          standardisation is meaningless. Second, even with a larger test batch, you want{" "}
          <strong>deterministic outputs</strong>: the prediction for a given example should not depend on
          which other examples happened to be batched alongside it. Batch statistics make one
          example&rsquo;s output a function of its neighbours, which is unacceptable at test time. Third,
          a test batch may be small or <strong>non-representative</strong>, so its statistics are a poor
          estimate of the true distribution the layer was trained to expect.
        </p>

        <Callout color={CORAL} title={<>The rule</>}>
          Train time: normalise with the statistics of the current minibatch. Test time: normalise with
          <em> fixed</em> statistics that do not depend on the current batch at all. The network must
          behave as a fixed function once training is over.
        </Callout>

        <h2>The fix: running estimates</h2>
        <p>
          During training, alongside using each batch&rsquo;s statistics, BatchNorm quietly keeps a
          running estimate of the population mean and variance — an exponential moving average (EMA)
          updated after every batch. With momentum <M>{String.raw`\alpha`}</M> (a number close to 1,
          typically 0.9 or 0.99), each new batch nudges the running estimate a little toward the
          batch&rsquo;s own statistics:
        </p>

        <MathBlock>{String.raw`\hat{\mu} \leftarrow \alpha\,\hat{\mu} + (1-\alpha)\,\mu_B, \qquad \hat{\sigma}^2 \leftarrow \alpha\,\hat{\sigma}^2 + (1-\alpha)\,\sigma_B^2.`}</MathBlock>

        <p>
          These running values <M>{String.raw`\hat{\mu}, \hat{\sigma}^2`}</M> are not trained by
          backpropagation — they are not parameters in the gradient sense. They are <em>buffers</em>:
          statistics accumulated as a side effect of training, frozen the moment training ends. At test
          time BatchNorm ignores the incoming batch entirely and standardises with these fixed numbers:
        </p>

        <MathBlock>{String.raw`y = \gamma\,\frac{x - \hat{\mu}}{\sqrt{\hat{\sigma}^2 + \varepsilon}} + \beta \quad\text{(test time; } \hat{\mu}, \hat{\sigma}^2 \text{ fixed).}`}</MathBlock>

        <p>
          Now a single example can be normalised — <M>{String.raw`\hat{\mu}`}</M> and{" "}
          <M>{String.raw`\hat{\sigma}^2`}</M> come from the whole training history, not from the one
          example — and the output is deterministic, independent of any batching.
        </p>

        <h2>The bug you will actually hit</h2>
        <p>
          Frameworks make this a mode switch, and forgetting the switch is the single most common
          BatchNorm mistake. In PyTorch, a module is in training mode by default; you must call{" "}
          <code>model.eval()</code> before inference to make BatchNorm use its running statistics
          (and <code>model.train()</code> to switch back). Forget <code>model.eval()</code> and your
          &ldquo;test&rdquo; forward pass normalises with the statistics of whatever evaluation batch you
          fed it. The symptoms are unmistakable once you know them:
        </p>
        <ul>
          <li><strong>Non-deterministic predictions.</strong> The same example scores differently depending
            on its batch-mates, because it is being normalised by batch statistics.</li>
          <li><strong>Accuracy that swings with batch size.</strong> Evaluate with batch size 1 and the
            variance is degenerate; the model may collapse to nonsense.</li>
          <li><strong>Train/test gap that vanishes when you fix the mode.</strong> A mysterious validation
            score that jumps the moment you add the missing <code>eval()</code> call.</li>
        </ul>
        <p>
          There is a second, subtler failure even when you <em>do</em> call <code>eval()</code>: if the
          test distribution differs from training, the frozen <M>{String.raw`\hat{\mu}, \hat{\sigma}^2`}</M>{" "}
          are wrong for it. This is a genuine train/test population mismatch, not a coding bug, and it is
          one of the reasons BatchNorm struggles under distribution shift.
        </p>

        <h2>A free side effect: mild regularisation</h2>
        <p>
          The train/test asymmetry has a useful by-product. During training, each example is normalised
          by the statistics of its particular minibatch, which are noisy — they jitter from batch to
          batch. So the same example gets a slightly different normalised representation every time it
          appears, depending on its random companions. That injected noise acts like a mild regulariser,
          in the same family as the noise-injection idea behind dropout: it discourages the network from
          relying too precisely on any single activation. At test time the noise is gone (fixed
          statistics), which is exactly what you want. The regularisation track develops this
          noise-as-regularisation theme in full; here it is enough to note that BatchNorm&rsquo;s
          train-time stochasticity is a feature, not just an artefact.
        </p>

        <Proof color={CORAL} title="why the EMA converges to the population statistics">
          <p>
            Take the mean update <M>{String.raw`\hat{\mu}_t = \alpha\,\hat{\mu}_{t-1} + (1-\alpha)\,\mu_{B,t}`}</M>{" "}
            and unroll it. Each batch mean <M>{String.raw`\mu_{B,t}`}</M> enters with a weight that decays
            geometrically as newer batches arrive:
          </p>
          <MathBlock>{String.raw`\hat{\mu}_t = (1-\alpha)\sum_{k=0}^{t-1} \alpha^{k}\,\mu_{B,\,t-k} \;+\; \alpha^{t}\,\hat{\mu}_0.`}</MathBlock>
          <p>
            The initial value&rsquo;s weight <M>{String.raw`\alpha^{t}`}</M> vanishes as training
            proceeds, so the estimate forgets where it started. The weights on the batch means sum to{" "}
            <M>{String.raw`(1-\alpha)\sum_{k\ge 0}\alpha^k = 1`}</M>, so <M>{String.raw`\hat{\mu}_t`}</M>{" "}
            is a proper weighted average of the observed batch means. If the batch means are unbiased
            samples of the population mean <M>{String.raw`\mu`}</M> — each <M>{String.raw`\mathbb{E}[\mu_{B,t}] = \mu`}</M> —
            then <M>{String.raw`\mathbb{E}[\hat{\mu}_t] \to \mu`}</M>, and the geometric averaging over
            many batches drives the variance of the estimate down. The running mean converges toward the
            true population mean; the identical argument applies to <M>{String.raw`\hat{\sigma}^2`}</M>.
            The momentum <M>{String.raw`\alpha`}</M> is the usual bias/variance dial: closer to 1 averages
            over more batches (smoother, slower to adapt), closer to 0 tracks recent batches (noisier,
            faster).
          </p>
        </Proof>

        <h2>The takeaway</h2>
        <p>
          BatchNorm is two different functions wearing one name: a batch-statistics function at training
          time and a fixed-statistics function at test time, bridged by the running EMA it accumulates
          along the way. Understand that split and the classic bugs become obvious — call{" "}
          <code>model.eval()</code>, do not trust a test batch of one, and remember that if the test
          distribution moved, the frozen statistics moved with the training data, not with reality.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>Why can BatchNorm not simply use the current batch&rsquo;s statistics at test time?</>,
              options: [
                "Batch statistics are only defined for the training set",
                "You may have a batch of one (degenerate variance), and you want deterministic outputs that do not depend on an example's batch-mates",
                "The learned γ and β are only valid for the training batch size",
              ],
              answer: 1,
              explain: <>A single test example has zero variance, so standardising it by its own batch
                is meaningless; and even with a larger batch, using batch statistics makes one
                example&rsquo;s prediction depend on the others it happens to be grouped with. Test
                inference must be a fixed, deterministic function.</>,
            },
            {
              q: <>How does BatchNorm obtain the fixed statistics it uses at test time?</>,
              options: [
                "It recomputes the mean and variance over the whole training set after training finishes",
                "It keeps a running exponential moving average of the batch mean and variance during training, updated with momentum α, and freezes it for inference",
                "It uses the γ and β values, which encode the statistics",
              ],
              answer: 1,
              explain: <>Throughout training, BatchNorm accumulates μ̂ ← αμ̂ + (1−α)μ_B and the analogous
                update for variance. These running buffers are not trained by backprop; they are frozen
                at the end of training and used to normalise every test input.</>,
            },
            {
              q: <>A model gives inconsistent predictions on the same input and its accuracy changes with
                the evaluation batch size. What is the most likely cause?</>,
              options: [
                "The learning rate was too high during training",
                "model.eval() was not called, so BatchNorm is still normalising with live batch statistics instead of its frozen running estimates",
                "The running statistics converged to the wrong values",
              ],
              answer: 1,
              explain: <>Those are the textbook symptoms of a forgotten mode switch. In training mode
                BatchNorm uses the current batch&rsquo;s statistics, so outputs depend on batch-mates and
                on batch size. Calling model.eval() switches it to the fixed running estimates and the
                behaviour becomes deterministic.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/initialisation-and-normalisation/learned-affine", label: <>&#8592; The learned affine parameters</> }}
          next={{ href: "/learn/initialisation-and-normalisation/when-batchnorm-helps", label: <>Next up &middot; When BatchNorm helps, and when it does not &#8594;</> }}
        />
      </div>
    </article>
  );
}
