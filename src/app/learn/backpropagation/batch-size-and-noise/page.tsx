import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { CodeOutput } from "@/components/CodeOutput";
import { GuessSlider } from "@/components/capstone/GuessSlider";

export const metadata = {
  title: "Batch size & gradient noise — Manifold",
  description:
    "Identical epochs, identical learning rate, four batch sizes — and 49× more parameter updates at one end than the other. The noise a small batch introduces is not a defect you tolerate.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function BatchSizePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Training dynamics", color: CORAL }, { label: "Tier 2 · mechanics", color: CORAL }]}
        time="about 8 minutes"
        title={<>Batch size &amp; gradient noise</>}
        intro={<>The gradient over your whole training set is the most accurate descent direction available, and
          computing it is usually the wrong thing to do. Understanding why is the difference between treating small
          batches as a memory compromise and treating them as a design choice.</>}
      />

      <div className="lesson">
        <h2>What a batch actually changes</h2>
        <p>
          The true gradient is an average over every training example. A batch estimates that average from a
          sample — an unbiased estimate with variance falling as{" "}
          <M>{String.raw`1/B`}</M>:
        </p>

        <MathBlock>{String.raw`\nabla\mathcal{L} \;=\; \frac{1}{n}\sum_{i=1}^{n}\nabla\ell_i \qquad\longrightarrow\qquad \widehat{\nabla\mathcal{L}} \;=\; \frac{1}{B}\sum_{i \in \text{batch}}\nabla\ell_i`}</MathBlock>

        <p>
          So a small batch gives a noisier direction — correct on average, wrong on any particular step. The obvious
          conclusion is that bigger is better, and it is wrong for two separate reasons.
        </p>

        <h2>Reason one: you get fewer steps</h2>
        <p>
          A batch of any size costs one update. Halving the batch doubles the number of updates per epoch, and{" "}
          <strong>the model learns per update, not per epoch.</strong>
        </p>

        <GuessSlider
          accent={CORAL}
          prompt={<>390 training rows, 30 epochs, learning rate 0.5, identical seed. Batch 32 gives 390 updates.
            How many does full-batch training give?</>}
          min={0}
          max={400}
          step={5}
          start={200}
          actual={30}
          decimals={0}
          reveal={<>Thirty — one per epoch. The same 30 epochs bought <strong>13× less learning</strong>, and the
            final loss shows it: 0.1260 against 0.2582.</>}
        />

        <CodeOutput>{`  batch   steps/epoch   total steps   final loss   test acc
      8            49          1470       0.1365     0.9048
     32            13           390       0.1260     0.9143
    128             4           120       0.1775     0.9000
    390             1            30       0.2582     0.8571`}</CodeOutput>

        <p>
          Identical epochs, identical learning rate, identical seed. The only difference is how many times the
          parameters were actually updated — and full-batch training ends up{" "}
          <strong>0.13 worse in loss and nearly 6 points worse in accuracy</strong> purely from having taken 30
          steps instead of 390.
        </p>

        <Callout color={CORAL} title={<>The mistake this predicts</>}>
          Someone raises the batch size from 32 to 512 to use the GPU better, keeps everything else fixed, and finds
          the model much worse. Nothing has gone wrong with batching — they cut the number of updates by 16× while
          calling it the same amount of training. The standard fix is to <strong>scale the learning rate with the
          batch size</strong> (roughly linearly), so that fewer, larger steps cover the same ground. This is why
          &ldquo;we trained for 30 epochs&rdquo; is a nearly meaningless statement without the batch size beside
          it.
        </Callout>

        <h2>Reason two: the noise is doing something</h2>
        <p>
          Look at the table again, at the top row. Batch 8 took <strong>3.8× more updates</strong> than batch 32 and
          came out slightly <em>worse</em> — 0.1365 against 0.1260. So more updates is not simply better either, and
          the sweet spot here is in the middle.
        </p>
        <p>
          That is the honest shape of it: batch size trades two things against each other. Too large and you take
          too few steps. Too small and each step is so noisy that progress is wasted undoing the previous one, and
          the per-step overhead dominates.
        </p>
        <p>
          But the noise is not purely a cost. A stochastic gradient is a random direction that <em>on average</em>{" "}
          points downhill, which means it can wander out of a narrow valley that an exact gradient would settle
          into. The widely-held reading — supported by evidence, though not settled — is that this is part of why
          small-batch training tends to generalise slightly better: it is biased toward broad, flat minima rather
          than sharp ones, and flat minima are less sensitive to the difference between training and test data.
        </p>

        <Callout color={CORAL} title={<>Where this lands in practice</>}>
          Pick the largest batch that fits comfortably in memory and gives you enough updates, then set the learning
          rate to match it. 32–256 is the usual range for that reason rather than any deep principle. And when you
          change the batch size, <strong>change the learning rate with it</strong> — otherwise you have altered two
          things and will attribute the result to the wrong one.
        </Callout>

        <h2>The three words, used precisely</h2>
        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 540 }}>
            <thead>
              <tr>
                {["term", "meaning", "at n = 390, B = 32"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "7px 24px 7px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["batch", "examples in one forward/backward", "32"],
                ["step", "one parameter update", "13 per epoch"],
                ["epoch", "one pass over the training set", "13 steps"],
              ].map((row) => (
                <tr key={row[0]}>
                  {row.map((c, j) => (
                    <td key={j} style={{ padding: "7px 24px 7px 0", color: j === 0 ? CORAL : "var(--ink)", borderBottom: "1px solid var(--border)" }}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p>
          Full-batch gradient descent — one step per epoch — is what the{" "}
          <Link href="/learn/linear-regression/descent-on-the-surface" style={link}>linear regression track</Link>{" "}
          uses, because on a convex problem with few parameters the exact direction is affordable and the noise buys
          nothing. Neither choice is universally right; they suit different shapes of problem.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>Full-batch training reached 0.2582 where batch 32 reached 0.1260, at the same epochs and learning
                rate. Why?</>,
              options: [
                "The full-batch gradient is less accurate",
                "It took 30 parameter updates instead of 390 — the same epochs bought 13× less learning",
                "Full-batch training overfits more",
              ],
              answer: 1,
              explain: <>The full-batch gradient is the <em>most</em> accurate available. Learning happens per
                update, and one update per epoch is very few. This is why comparing runs by epoch count is
                misleading unless the batch size is held fixed.</>,
            },
            {
              q: <>Batch 8 took 3.8× more updates than batch 32 and scored slightly worse. What does that show?</>,
              options: [
                "More updates is always better and this run was unlucky",
                "Batch size trades steps against per-step quality, so there is a middle rather than an extreme",
                "The learning rate was wrong for batch 8",
              ],
              answer: 1,
              explain: <>Very small batches give very noisy directions, and past a point extra steps are spent
                undoing each other. Both extremes are worse than the middle, which is the honest shape and the
                reason 32–256 is the common range.</>,
            },
            {
              q: <>You raise the batch size from 32 to 512 for speed. What else should change?</>,
              options: [
                "Nothing — batch size is independent of the other hyperparameters",
                "The learning rate, raised roughly in proportion, since you now take far fewer steps",
                "The number of layers",
              ],
              answer: 1,
              explain: <>16× fewer updates per epoch means each one has to cover more ground. Roughly linear scaling
                of the learning rate is the standard rule of thumb. Leaving it fixed is the most common way people
                conclude that large batches &ldquo;do not work&rdquo;.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/backpropagation/the-learning-rate", label: <>← The learning rate</> }}
          next={{ href: "/learn/backpropagation/momentum-and-adaptive-methods", label: <>Next up · Momentum &amp; adaptive methods →</> }}
        />
      </div>
    </article>
  );
}
