import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LearningRateSweepLab } from "@/components/labs/LearningRateSweepLab";

export const metadata = {
  title: "The learning rate — Manifold",
  description:
    "The gradient gives a direction, never a distance. Seven learning rates on one problem, including two failures that look identical from the loss alone and are not remotely the same thing.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function LearningRatePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Training dynamics", color: CORAL }, { label: "Tier 2 · mechanics", color: CORAL }]}
        time="about 9 minutes"
        title={<>The learning rate</>}
        intro={<>Backpropagation answers &ldquo;which way is downhill&rdquo; exactly. It says nothing whatsoever
          about how far to walk, and that second question turns out to be the one that decides whether your model
          trains at all.</>}
      />

      <div className="lesson">
        <h2>A direction is not a distance</h2>
        <p>
          The gradient is a local statement: at this exact point, the loss falls fastest in this direction. It is
          silent about how far that remains true. Step too far and you are somewhere the gradient was never making
          a claim about.
        </p>

        <MathBlock>{String.raw`\theta \;\leftarrow\; \theta - \eta\,\nabla_\theta\mathcal{L}(\theta)`}</MathBlock>

        <p>
          <M>{String.raw`\eta`}</M> is the only thing in that line you choose, and it is reliably the most
          consequential hyperparameter in the whole model — more than depth, more than width, more than the
          optimiser.
        </p>

        <PredictPrompt
          accent={CORAL}
          prompt={<>Seven learning rates from 0.0001 to 100 on the same problem, same seed. How many of the seven
            reach a good solution?</>}
          options={["One — the learning rate must be near-exact", "About three", "Five or six — the tolerance is wide"]}
          nudge="Locked in. Now step through all seven below."
        />

        <LabFrame
          accent={CORAL}
          tryThis={<>Walk from 0.0001 up to 100. Pay particular attention to the difference between{" "}
            <strong>10</strong> and <strong>100</strong> — both are &ldquo;too high&rdquo;, and they fail in
            completely different ways.</>}
          insight={<>Three of seven are healthy and they span two orders of magnitude — 0.01, 0.1 and 1.0 all land
            between 0.0858 and 0.2470. <strong>The learning rate needs to be roughly right, not exactly right</strong>,
            which is why sweeping powers of ten is the correct search and a fine-grained search is a waste. But look
            at the two failures: at lr=10 the loss jumps once and then is <em>perfectly flat for 2,000 steps</em>,
            while at lr=100 it thrashes between 0.61 and 13.8. Same diagnosis, entirely different disease.</>}
        >
          <LearningRateSweepLab />
        </LabFrame>

        <h2>The two failures are not the same failure</h2>
        <p>
          This is the part worth carrying, because &ldquo;lower the learning rate&rdquo; is the standard advice for
          both and it is only half right.
        </p>

        <p>
          <strong>At lr = 100 the steps are simply too big.</strong> Each update overshoots, lands somewhere worse,
          and the next gradient points back; the loss ranges from 0.61 to 13.8 with no trend. Fifteen of sixteen
          units in the second layer are dead here too, but <em>one survives</em> — a path remains, so the network is
          still capable of moving. It is thrashing, not frozen.
        </p>
        <p>
          <strong>At lr = 10 the network has been destroyed.</strong> One enormous first step drove the second
          hidden layer&rsquo;s pre-activations negative for every training row, and{" "}
          <strong>16 of 16 units are dead</strong>. The layer outputs zero, so the layer in front of it receives
          zero gradient — the network is severed. The loss is flat because <em>nothing can change</em>.
        </p>

        <Callout color={CORAL} title={<>Why lowering the learning rate does not fix the second one</>}>
          A dead ReLU is permanent. Its gradient is zero, so no update reaches it, whatever the step size is now.
          Reducing <M>{String.raw`\eta`}</M> at step 500 changes nothing — the damage was done at step 1 and the
          parameters are stuck.
          <br /><br />
          <strong>You have to restart.</strong> That is a genuinely different remedy from &ldquo;turn the dial
          down&rdquo;, and it is why a flat loss curve deserves a check for dead units rather than another sweep. It
          is also the strongest practical argument for the activations that keep a small non-zero slope on the
          negative side — the subject of the next track.
        </Callout>

        <h2>How to actually find one</h2>
        <p>
          Given a two-order-of-magnitude window, the search is easy and needs no sophistication.
        </p>
        <ul>
          <li><strong>Sweep powers of ten</strong> — 1e-5, 1e-4, … 1e0. Six short runs. Anything finer is measuring
            noise; the healthy band here spanned 100×.</li>
          <li><strong>Pick the largest rate that is still stable</strong>, then back off slightly. Large stable
            steps train fastest and the noise they carry tends to generalise better.</li>
          <li><strong>Check for dead units when the loss is flat</strong> before assuming the rate is too small —
            a forward pass and a count of units that are zero across the whole batch.</li>
          <li><strong>Decay it over training.</strong> Large steps early to travel, small steps late to settle. A
            fixed rate that is good at the start is usually too large at the end.</li>
        </ul>

        <p>
          A note on scale: the healthy values here (0.01 to 1.0) are large by the standards of real training, where
          1e-3 with Adam is a common default. The difference is the optimiser and the problem size — this is a
          full-batch, well-conditioned, 300-parameter problem. What transfers is <em>the shape</em>: a wide healthy
          band, a slow failure below it, and two distinct failures above.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>Why is sweeping the learning rate by powers of ten the right search strategy?</>,
              options: [
                "It is faster to type",
                "The healthy band is wide — 0.01 to 1.0 all worked here — so fine-grained search measures noise",
                "The optimal rate is always a power of ten",
              ],
              answer: 1,
              explain: <>Three settings spanning 100× all landed in a narrow range of final loss. What matters is
                finding the right order of magnitude; the difference between 0.1 and 0.2 is far smaller than the
                run-to-run variation from initialisation.</>,
            },
            {
              q: <>The loss jumped once and has been perfectly flat for 2,000 steps. What is the most likely
                cause?</>,
              options: [
                "The learning rate is too small",
                "A large step killed a whole layer of ReLU units, so no gradient reaches the front of the network",
                "The model has converged",
              ],
              answer: 1,
              explain: <>A too-small rate gives a slowly <em>declining</em> curve, not a flat one, and convergence
                would not follow a jump upward. A perfectly flat line after a jump means the gradient is exactly
                zero — which for ReLU means dead units, measurable by counting units that are zero across the whole
                batch.</>,
            },
            {
              q: <>Why does lowering the learning rate not recover a run whose units have died?</>,
              options: [
                "It does — you just need to lower it further",
                "Dead units have zero gradient, so no update of any size reaches them; the damage is permanent",
                "The loss surface has changed shape",
              ],
              answer: 1,
              explain: <>The step size multiplies the gradient, and anything times zero is zero. The remedy is to
                restart with a smaller rate, or to use an activation with a non-zero negative slope. This is exactly
                why the distinction between the two high-rate failures is worth making.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/backpropagation/backprop-bugs", label: <>← The bugs you will actually hit</> }}
          next={{ href: "/learn/backpropagation/batch-size-and-noise", label: <>Next up · Batch size &amp; gradient noise →</> }}
        />
      </div>
    </article>
  );
}
