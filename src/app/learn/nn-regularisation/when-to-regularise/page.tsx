import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { DiagnosticQuadrant } from "@/components/figures/nnReg/RegFigures";

export const metadata = {
  title: "When to regularise, and when not to — Manifold",
  description:
    "Regularisation trades training fit for generalisation. That trade only pays when there is a real gap to close. On an underfit model it makes both train and test scores worse. Fit first, then regularise.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function WhenToRegularisePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "The gap", color: CORAL }, { label: "Tier 1 · intuition", color: CORAL }]}
        time="about 7 minutes"
        title={<>When to regularise, and when not to</>}
        intro={<>Every regulariser in this track does the same fundamental thing: it gives up a little
          training fit in exchange for a little generalisation. That is a good trade only when you have
          training fit to spare. This page is the one decision that governs the rest of the track — and
          the one place beginners most often get it exactly backwards.</>}
      />

      <div className="lesson">
        <h2>What regularisation is, mechanically</h2>
        <p>
          A regulariser is anything that prevents the model from fitting the training data as hard as it
          otherwise would. Weight decay pulls weights toward zero; dropout deletes units so no single one
          can be relied on; early stopping halts training before the fit completes; augmentation forces
          the model to be right on perturbed copies of each point. Different mechanisms, one common effect:{" "}
          <strong>they cost training accuracy on purpose.</strong>
        </p>
        <p>
          That cost is the entire point. The previous two pages established why: with a fixed, noisy
          dataset, a model powerful enough to reach train 1.000 has fit real signal <em>and</em> memorised
          noise, and the two are tangled together. Regularisation is a blunt instrument for untangling
          them — by refusing to fit everything, it tends to drop the accidental patterns (which are
          fragile, fit by a few extreme weights) before it drops the real ones (which are robust). You
          sacrifice some training accuracy and, if the model was overfitting, you buy back more test
          accuracy than you spent.
        </p>

        <Callout color={CORAL} title={<>The trade only pays when there is a gap</>}>
          Regularisation moves accuracy <em>from</em> the training set <em>toward</em> the test set. If
          there is a large gap, the training set has a surplus to give and the test set has room to
          receive — the trade is profitable. If there is no gap, there is no surplus: you spend training
          accuracy and get nothing back, because the test score was never being held down by overfitting
          in the first place.
        </Callout>

        <h2>The one rule</h2>
        <p>
          <strong>Regularise only when there is a real train&ndash;test gap.</strong> Concretely: the
          training score is high and the test score is meaningfully below it. That is the only situation
          in which trading training fit for generalisation makes sense, because it is the only situation
          in which the model has fit more than it should have.
        </p>
        <p>
          The mirror image is the trap. If the model is <strong>underfitting</strong> — training accuracy
          itself is low — then regularising makes it <em>strictly worse</em>. An underfit model has not
          fit the training data yet; it has no surplus training accuracy to trade away. Every regulariser
          you add pushes the fit further from the data it has not even reached, and because the model was
          not overfitting, there is no generalisation gain to offset the loss. Both scores fall together.
          You have taken a high-bias model and added more bias.
        </p>

        <DiagnosticQuadrant
          caption={<>The one rule, drawn. Every technique in this track applies to a single cell of
            this square. The most common mistake in practice is not choosing the wrong regulariser — it
            is applying one from the bottom-left cell, where the model is not overfitting at all and
            every regulariser can only make things worse.</>}
        />

        <h2>The order of operations</h2>
        <p>
          This gives a strict sequence, and the sequence matters more than any individual technique in the
          rest of this track.
        </p>
        <p>
          <strong>First, make the model fit the training data.</strong> Give it enough capacity — width,
          depth, training time — that the training score is high. This is exactly the architecture
          track&rsquo;s <Link href="/learn/architecture-design/reading-the-curve" style={link}>&ldquo;make
          it overfit first&rdquo;</Link> instruction: you deliberately push the model until it{" "}
          <em>can</em> overfit, until a gap appears, because a gap is proof the model is powerful enough to
          represent the answer. A model that cannot overfit cannot be fixed by regularisation.
        </p>
        <p>
          <strong>Then, and only then, regularise the gap.</strong> Once the training score is high and a
          gap has opened, you have earned the right to spend training accuracy on generalisation. Now the
          techniques in this track apply, in order of what tends to work: dropout, augmentation, weight
          decay, early stopping — measured, on this problem, in the pages that follow.
        </p>
        <p>
          Doing it in the other order — regularising before the model can fit — is the classic beginner
          mistake. You add dropout and weight decay to a model that is already struggling to reach the
          training data, watch every score drop, and conclude that regularisation &ldquo;does not
          work.&rdquo; It works fine; it was applied to a disease the patient did not have.
        </p>

        <h2>The decision, as a checklist</h2>
        <p>
          Before reaching for any regulariser, read both scores and answer in order:
        </p>
        <ul>
          <li>
            <strong>Is the training score high?</strong> If no — the model underfits. Do{" "}
            <em>not</em> regularise. Add capacity or train longer until it fits.
          </li>
          <li>
            <strong>Is the test score meaningfully below the training score?</strong> If no — there is no
            gap. Do not regularise; there is nothing to close, and you would only lose training accuracy.
          </li>
          <li>
            <strong>Both yes — high training score, real gap?</strong> Now regularise. Start with the
            technique that moves this problem the most and measure the test score after each change.
          </li>
          <li>
            <strong>After regularising, did the training score collapse while the test score barely
            moved?</strong> You have over-regularised — pushed the model back into underfitting. Ease off.
          </li>
        </ul>

        <Proof color={CORAL} title="why regularising an underfit model lowers both train and test accuracy">
          <p>
            Regularised training minimises a penalised objective{" "}
            <M>{String.raw`L_\lambda(\theta) = L(\theta) + \lambda \, R(\theta)`}</M>, where{" "}
            <M>{String.raw`L`}</M> is the data loss, <M>{String.raw`R`}</M> is the penalty (weights toward
            zero, and so on), and <M>{String.raw`\lambda > 0`}</M> its strength. Let{" "}
            <M>{String.raw`\theta_0`}</M> minimise the unregularised loss and{" "}
            <M>{String.raw`\theta_\lambda`}</M> the penalised one.
          </p>
          <p>
            By definition <M>{String.raw`\theta_\lambda`}</M> does not minimise{" "}
            <M>{String.raw`L`}</M> alone, so <M>{String.raw`L(\theta_\lambda) \ge L(\theta_0)`}</M>:{" "}
            <em>training</em> loss can only rise (or hold) when you add the penalty. That is true for every
            model. What differs is what happens to the <em>test</em> loss.
          </p>
          <p>
            Write test error as approximation-plus-estimation as on the previous page. Regularisation helps
            only by cutting <strong>estimation error</strong> — the part driven by fitting noise. An
            <em>overfit</em> model has large estimation error, so the penalty removes more test error than
            the training accuracy it costs: net gain. An <strong>underfit</strong> model already has small
            estimation error (it has not fit enough to memorise noise) and large{" "}
            <strong>approximation error</strong> (bias). Regularisation does nothing to approximation error
            except <em>increase</em> it — a penalty is a bias toward simpler functions, and a high-bias
            model is hurt, not helped, by more bias. So test loss rises too. Both training and test
            performance fall: you have added bias to a model whose problem was already too much bias.
          </p>
        </Proof>

        <p>
          That completes the &ldquo;the gap&rdquo; chapter. You can now define the gap, you know it is
          fixed by the data rather than the network size, and you know the single condition — a high
          training score with a real gap — under which the rest of the toolkit applies. Everything that
          follows is a specific way to spend training accuracy well. First up, the one every textbook
          leads with: the L2 penalty on the weights.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>A model scores train 0.64, test 0.61. A colleague suggests adding dropout and weight
                decay. What should you do?</>,
              options: [
                "Add both — regularisation always improves generalisation",
                "Do not regularise. The model underfits (low training score, tiny gap); it needs more capacity or training, not less. Regularising would lower both scores",
                "Add weight decay only, since it is milder than dropout",
              ],
              answer: 1,
              explain: <>Both scores are low and the gap is tiny — this is underfitting. There is no
                surplus training accuracy to trade, and regularising a high-bias model adds more bias,
                pushing both train and test down. Fit the training data first.</>,
            },
            {
              q: <>Why does the architecture track tell you to &ldquo;make the model overfit first&rdquo;
                before regularising?</>,
              options: [
                "Because overfitting is the final goal",
                "Because a visible gap proves the model has enough capacity to represent the answer; regularisation can then trade the surplus training fit for generalisation, whereas a model that cannot overfit cannot be helped by it",
                "Because regularisers only run correctly after the training loss reaches zero",
              ],
              answer: 1,
              explain: <>Regularisation works by giving back training accuracy you can spare. You only
                know you can spare it once the model has demonstrably overfit — a real gap. Get the model
                to fit (capacity), confirm the gap, then close it. Order matters.</>,
            },
            {
              q: <>Mechanically, why does regularising an underfit model lower <em>both</em> train and
                test accuracy?</>,
              options: [
                "Because it introduces a bug in the optimiser",
                "The penalty means the model no longer minimises training loss alone (train drops), and since an underfit model's error is dominated by bias/approximation error rather than noise-fitting, adding a bias-toward-simplicity penalty raises test error too",
                "Because underfit models cannot compute gradients for the penalty term",
              ],
              answer: 1,
              explain: <>Adding a penalty means the fitted parameters no longer minimise the data loss, so
                training accuracy falls for any model. Regularisation only recovers test accuracy by
                cutting estimation error (noise-fitting). An underfit model's problem is approximation
                error (bias), which the penalty only worsens — so the test score falls with the train
                score.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/nn-regularisation/capacity-and-generalisation", label: <>&#8592; Capacity, complexity, and generalisation</> }}
          next={{ href: "/learn/nn-regularisation/l2-penalty", label: <>Next up &middot; The L2 penalty on weights &#8594;</> }}
        />
      </div>
    </article>
  );
}
