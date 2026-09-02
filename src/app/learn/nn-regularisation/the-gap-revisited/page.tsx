import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "The train-test gap, revisited — Manifold",
  description:
    "The gap is train metric minus test metric. Here it is 0.244: the network scores a perfect 1.000 on its training points and 0.756 on unseen data. What that gap means, and why train accuracy alone measures nothing.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function TheGapRevisitedPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "The gap", color: CORAL }, { label: "Tier 1 · intuition", color: CORAL }]}
        time="about 8 minutes"
        title={<>The train&ndash;test gap, revisited</>}
        intro={<>The architecture track named this number when it taught you to read a learning curve.
          This track is going to close it. Before we can, we need to be precise about what it is, what a
          large one means, and why the training score on its own tells you almost nothing about whether
          the network has learned.</>}
      />

      <div className="lesson">
        <h2>The gap, defined</h2>
        <p>
          The <strong>train&ndash;test gap</strong> is the simplest overfitting diagnostic there is:
          the training metric minus the test metric.
        </p>

        <MathBlock>{String.raw`\text{gap} = \text{accuracy}_{\text{train}} - \text{accuracy}_{\text{test}}`}</MathBlock>

        <p>
          On the network this whole track is built around — a 3&times;256 ReLU MLP trained with full-batch
          AdamW for 400 epochs on 250 points — the two numbers are <strong>train 1.000</strong> and{" "}
          <strong>test 0.756</strong>. The gap is <strong>0.244</strong>. The model is right about every
          single training example and wrong about roughly a quarter of the examples it has never seen.
        </p>
        <p>
          That is not a subtle effect at the edge of measurement. It is a chasm. The model has clearly
          learned <em>something</em> — 0.756 is well above the 0.500 you would get by guessing — but it
          has also learned a great deal that does not transfer. The job of this track is to figure out
          what the transferable part is and keep only that.
        </p>

        <h2>What a large gap actually means</h2>
        <p>
          A model fits patterns. Some of those patterns are real — they exist in the population the data
          was drawn from, and they will hold on new data. Others are <em>accidents</em> of this particular
          sample of 250 points: coincidences, quirks, and — the sharpest example — <strong>the label
          noise</strong>.
        </p>
        <p>
          This dataset has 10% label noise: one training point in ten has been handed the wrong answer on
          purpose. A model with enough capacity does not know which points those are, so it fits them too.
          It draws the boundary to include the mislabelled points, memorising the noise as though it were
          signal. On the training set this is rewarded — memorising a flipped label makes you right about
          that point. On the test set the same memorisation is punished, because the test points do not
          share those specific accidents. A large gap is the visible cost of fitting things that were
          never real.
        </p>

        <Callout color={CORAL} title={<>The gap is a property of the fit, not a defect of the model</>}>
          A gap of 0.244 does not mean the architecture is wrong or the optimiser failed. Both worked
          perfectly — the model minimised training loss exactly as asked. The gap appears precisely{" "}
          <em>because</em> the fit succeeded: a model powerful enough to drive training error to zero on
          noisy data has no choice but to fit the noise along with the signal. The cure is not a better
          optimiser. It is to stop the model short of fitting everything — which is what regularisation
          does.
        </Callout>

        <h2>A gap is not the only failure</h2>
        <p>
          It is worth being careful here, because a large gap and its opposite are easy to confuse. There
          are two distinct ways a model can be bad, and they call for opposite treatments.
        </p>
        <p>
          <strong>Overfitting</strong> is a large gap: training accuracy high, test accuracy well below it.
          Our network — 1.000 and 0.756 — is a textbook case. The model has memorised more than it can
          justify.
        </p>
        <p>
          <strong>Underfitting</strong> is both scores low <em>together</em>: training accuracy of, say,
          0.62 and test accuracy of 0.60, a tiny gap. Here the model has not even fit the training data.
          It is not that it memorised too much; it has not represented enough. The gap is small, but the
          model is still useless. Reading the gap alone would miss this entirely — a small gap looks
          healthy right up until you notice both numbers are floor-level.
        </p>
        <p>
          This distinction decides everything about what you do next. A gap says <em>reduce what the
          model fits</em>. Two low scores say <em>increase what the model can fit</em>. Applying the gap
          treatment to an underfit model — the subject of a later page in this chapter — makes it strictly
          worse. So the first question is never &ldquo;is there a gap?&rdquo; but &ldquo;where does the
          training score sit?&rdquo; The architecture track&rsquo;s{" "}
          <Link href="/learn/architecture-design/reading-the-curve" style={link}>diagnostic loop</Link>{" "}
          is where this gap was first named, and where you learned to read both scores before touching
          anything.
        </p>

        <h2>Why the training score, alone, is a lie</h2>
        <p>
          The most seductive mistake in machine learning is to watch the training metric climb and feel
          like progress is being made. Training accuracy of 1.000 <em>feels</em> like success. It is not,
          on its own, evidence of anything.
        </p>
        <p>
          The clearest way to see this: a lookup table has training accuracy 1.000. Store every training
          point with its label; at query time, return the stored label if you have seen the input, and
          otherwise guess. That table is right about every training example by construction — a perfect
          1.000 — and it has learned nothing that generalises. On any new input it is at chance. Training
          accuracy cannot tell the lookup table apart from a model that genuinely understands the problem,
          because both score 1.000. Only the test set separates them.
        </p>

        <Proof color={CORAL} title="why a perfect training score is not evidence of learning">
          <p>
            Let the training set be <M>{String.raw`\{(x_i, y_i)\}_{i=1}^{n}`}</M>. Define the estimator
          </p>
          <MathBlock>{String.raw`\hat{f}(x) = \begin{cases} y_i & \text{if } x = x_i \text{ for some } i \\ \text{arbitrary} & \text{otherwise.} \end{cases}`}</MathBlock>
          <p>
            By construction <M>{String.raw`\hat{f}(x_i) = y_i`}</M> for every training point, so its
            training accuracy is exactly <M>{String.raw`1.000`}</M> — regardless of how the labels were
            generated, even if they are pure noise. Yet on any <M>{String.raw`x`}</M> not in the training
            set, <M>{String.raw`\hat{f}`}</M> outputs an arbitrary value, so its expected test accuracy is
            no better than chance.
          </p>
          <p>
            Because this holds for <em>any</em> labelling, a training accuracy of 1.000 is consistent with
            having learned the true function <em>and</em> with having learned nothing at all. The training
            score therefore carries no information about generalisation by itself: only a metric evaluated
            on data the model did not fit — a test set — can distinguish the two. A sufficiently flexible
            neural network is a soft version of exactly this lookup table, which is why it, too, can hit
            1.000 on the training set while a quarter of its test predictions are wrong.
          </p>
        </Proof>

        <p>
          So the gap is the honest signal, and 0.244 of it is what we have to work with. It is real,
          it is large, and — as the next page shows with a table you might not expect — it is not simply
          a matter of the network being too big.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>The network scores train 1.000 and test 0.756. What is the train&ndash;test gap, and
                what does it mean?</>,
              options: [
                "0.756 — the fraction of test points the model gets right",
                "0.244 — the model fit patterns in the training data (including the 10% label noise) that do not generalise to new data",
                "0.244 — the model underfits and needs more capacity",
              ],
              answer: 1,
              explain: <>The gap is 1.000 &minus; 0.756 = 0.244. Because the training score is perfect,
                this is overfitting, not underfitting: the model has memorised sample-specific accidents —
                notably the mislabelled points — that the test set does not share.</>,
            },
            {
              q: <>Model A scores train 0.62, test 0.60. Model B scores train 1.000, test 0.756. Which is
                overfitting, and how do you tell?</>,
              options: [
                "Model A, because its test score is lower",
                "Model B, because its gap (0.244) is large while its training score is high; Model A has a tiny gap but both scores are low, which is underfitting",
                "Both are overfitting because neither reaches test accuracy 1.000",
              ],
              answer: 1,
              explain: <>Overfitting is a large gap with a high training score (Model B). Model A has
                almost no gap but both scores sit near the floor — it has not even fit the training data,
                which is underfitting. The two failures call for opposite fixes.</>,
            },
            {
              q: <>Why is a training accuracy of 1.000, on its own, not evidence that a model has
                learned anything?</>,
              options: [
                "Because 1.000 is impossible to achieve on real data",
                "Because a lookup table that memorises every training label also scores 1.000 yet generalises to nothing — only a test set can distinguish memorisation from learning",
                "Because training accuracy is always lower than test accuracy",
              ],
              answer: 1,
              explain: <>A model that stores each training point with its label is right about every
                training example by construction, whatever the labels are, and learns nothing that
                transfers. Training accuracy cannot tell it apart from a model that truly understands the
                problem. Only performance on unseen data can.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/nn-regularisation", label: <>&#8592; What regularisation is for</> }}
          next={{ href: "/learn/nn-regularisation/capacity-and-generalisation", label: <>Next up &middot; Capacity, complexity, and generalisation &#8594;</> }}
        />
      </div>
    </article>
  );
}
