import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { CodeOutput } from "@/components/CodeOutput";
import { CodeBlock } from "@/components/CodeBlock";
import { DecisionPoint } from "@/components/capstone/DecisionPoint";

export const metadata = {
  title: "What the perceptron guarantee does not cover — Manifold",
  description:
    "The convergence theorem holds only if a separating line exists. Move one point of twenty-four across and the same rule runs forever, oscillating between 29% and 71% — with no signal that anything is wrong.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function GuaranteeMissesPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "The unit", color: CORAL }, { label: "Tier 1 · intuition", color: CORAL }]}
        time="about 7 minutes"
        title={<>What the guarantee does <em>not</em> cover</>}
        intro={<>&ldquo;It is guaranteed to converge&rdquo; is one of those sentences that stops people reading the
          next clause. The next clause is the entire story, and it is the reason the field spent the 1970s doing
          something else.</>}
      />

      <div className="lesson">
        <h2>Read the condition, not the conclusion</h2>
        <p>
          The theorem says: <strong>if the training data is linearly separable</strong>, the rule converges in at
          most <M>{String.raw`R^2/\gamma^2`}</M> updates. Every word before the comma is load-bearing. If no
          separating hyperplane exists, the theorem says nothing at all — and &ldquo;says nothing&rdquo; turns out
          to mean something much worse than &ldquo;converges more slowly&rdquo;.
        </p>

        <h2>One point is enough to break it</h2>
        <p>
          Take the same 24 points from the last page. They were constructed with a guaranteed gap, so the rule
          finished in 30 updates. Now move a single positive point into the middle of the negative cloud — the sort
          of thing one mislabelled row does — and re-run the identical algorithm.
        </p>

        <CodeBlock
          language="Python"
          fromScratch={`Xn = X.copy()
Xn[0] = [7.0, 2.0]          # one positive example, deep in negative territory
w, b, updates, epochs, converged, hist = perceptron(Xn, y, epochs=100, lr=0.5)

print("converged:", converged, " epochs run:", epochs, " updates:", updates)
accs = [accuracy(Xn, y, wk, bk) for wk, bk in hist[-40:]]
print(f"last 40 updates: min={min(accs):.4f} max={max(accs):.4f} mean={np.mean(accs):.4f}")`}
        />
        <CodeOutput>{`converged: False  epochs run: 100  updates: 250
last 40 updates: min=0.2917 max=0.7083 mean=0.5083`}</CodeOutput>

        <p>
          Two hundred and fifty updates and still going. But the number that should bother you is not 250 — it is{" "}
          <strong>0.5083</strong>. Averaged over its final forty updates the model is a coin flip, and it is still
          swinging between 29% and 71%. This is not slow progress toward a good answer. There is no progress. The
          boundary is in a permanent orbit, dragged back and forth by a point it can never satisfy.
        </p>

        <Callout color={CORAL} title={<>The failure is silent, which is the real problem</>}>
          Nothing throws. Nothing warns. If you stop after a fixed number of epochs — which every practical
          implementation must, since it cannot know whether the data is separable — you get back whatever weights
          the oscillation happened to be passing through when the clock ran out. In the run above, stopping one
          update earlier or later would have handed you a model between 29% and 71% accurate,{" "}
          <strong>with no indication which one you got</strong>. The algorithm has no notion of a best answer to
          return, because it has no notion of &ldquo;better&rdquo; at all.
        </Callout>

        <h2>Why it cannot do better: there is no objective</h2>
        <p>
          This is the deep problem, and it is worth naming precisely. The perceptron rule does not minimise
          anything. It is not gradient descent on a surface — it is a repair loop. Ask it &ldquo;is this weight
          vector better than that one?&rdquo; and it has no answer to give you, because no quantity in the algorithm
          ranks weight vectors.
        </p>
        <p>
          Every consequence follows from that one absence:
        </p>
        <ul>
          <li><strong>It cannot stop sensibly.</strong> Its only stopping condition is <em>zero mistakes</em>, which
            is unreachable when the data is not separable.</li>
          <li><strong>It cannot return its best attempt.</strong> To keep the best one you would have to be able to
            compare, and comparing requires a score.</li>
          <li><strong>It cannot express &ldquo;nearly right&rdquo;.</strong> A point one millimetre on the wrong
            side and a point a mile on the wrong side produce updates of completely different sizes — the update is
            proportional to <M>{String.raw`\mathbf{x}`}</M>, not to how wrong it was.</li>
          <li><strong>It cannot prefer a wide boundary to a narrow one.</strong> It stops at the first line that
            works, which is why <Link href="/learn/support-vector-regression" style={link}>margin-based methods</Link>{" "}
            exist as a separate idea.</li>
        </ul>
        <p>
          Fix the absence and every one of those falls out for free. Give the model a loss — a single number saying
          how badly it is doing across <em>all</em> the data — and &ldquo;better&rdquo; becomes meaningful, stopping
          becomes a decision you can make, and the best-so-far becomes something you can keep. That is exactly the
          move chapter 4 makes, and it is the move that turns a 1958 curiosity into something you can still train
          today.
        </p>

        <DecisionPoint
          accent={CORAL}
          question={<>You inherit a perceptron in production. It was trained for a fixed 100 epochs on data nobody
            has checked for separability, and it scores 68% on your test set. What is the most useful next step?</>}
          options={[
            {
              label: "Train it for 1,000 epochs instead",
              verdict: "miss",
              response: <>If the data is separable it already stopped early and extra epochs change nothing. If it
                is not, you are sampling a different arbitrary point of the same oscillation — the run above swung
                between 29% and 71% while making no progress at all.</>,
            },
            {
              label: "Check whether the classes are separable at all",
              verdict: "close",
              response: <>It is the right question and it does diagnose which world you are in. But on real data of
                any width the answer is almost always <em>no</em>, so you will spend the effort to arrive somewhere
                you could have assumed — and you still have to decide what to do about it.</>,
            },
            {
              label: "Replace the rule with a loss and gradient descent",
              verdict: "best",
              response: <>This removes the failure mode instead of measuring it. Logistic regression on the same
                features gives you a defined objective, a meaningful stopping point, a best-so-far worth keeping,
                and probabilities — and it degrades gracefully rather than orbiting when the data is not separable.
                The 68% may not improve much; being able to <em>tell</em> whether it improved is the win.</>,
            },
          ]}
        />

        <h2>Where this leaves the unit</h2>
        <p>
          So far the score is: a neuron is a linear model with a switch; the classical rule for fitting it works
          beautifully on a condition you cannot check and fails silently otherwise; and the fix is to stop repairing
          and start optimising.
        </p>
        <p>
          But there is a second limitation hiding underneath the first, and it is worse. When the perceptron fails
          on non-separable data, we have been quietly assuming that separability is the sort of thing better data or
          a better algorithm could deliver. For some problems it is not. There is a dataset with{" "}
          <strong>four points</strong> and no noise at all where no line works, ever — and it does not go away when
          you collect more data, tune the learning rate, or wait longer.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>Why is a perceptron that fails to converge more dangerous than one that converges to a mediocre
                answer?</>,
              options: [
                "Because it takes much longer to train",
                "Because it silently returns whatever the oscillation was passing through when training stopped",
                "Because it always returns 50% accuracy",
              ],
              answer: 1,
              explain: <>Non-convergence produces no error and no warning. Whatever weights exist at the epoch limit
                get returned as though they were a result — anywhere between 29% and 71% in the run on this page,
                with nothing to tell you which.</>,
            },
            {
              q: <>What is the single structural fix that resolves stopping, best-so-far, and graceful degradation
                all at once?</>,
              options: [
                "A smaller learning rate",
                "Shuffling the training data between epochs",
                "An objective function — a number that says how badly the model is doing overall",
              ],
              answer: 2,
              explain: <>All three failures come from the same absence: nothing in the algorithm ranks one weight
                vector above another. Once a loss exists, &ldquo;better&rdquo; is defined, and stopping, keeping the
                best, and degrading gracefully are all just things you can now do.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/perceptron-to-mlp/the-learning-rule", label: <>← The perceptron learning rule</> }}
          next={{ href: "/learn/perceptron-to-mlp/the-xor-problem", label: <>Next up · The XOR problem →</> }}
        />
      </div>
    </article>
  );
}
