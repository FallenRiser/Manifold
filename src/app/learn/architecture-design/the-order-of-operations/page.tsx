import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "The order of operations — Manifold",
  description:
    "Architecture search has a disciplined order: make it overfit a small sample, then scale width, then add depth if a hierarchy exists, then regularise, then tune the optimiser. Each step is tied to a measured number.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function TheOrderOfOperationsPage() {
  return (
    <article>
      <LessonHeader
        chips={[
          { label: "The diagnostic loop", color: CORAL },
          { label: "Tier 2 · practitioner", color: CORAL },
        ]}
        time="about 8 minutes"
        title={<>The order of operations</>}
        intro={
          <>
            Once you can read the regime from the learning curve, the next skill is knowing which
            knob to turn first. The moves are not interchangeable, and doing them out of order wastes
            experiments and confuses the diagnosis. Here is the disciplined sequence, each step tied
            to a number this track has already measured.
          </>
        }
      />

      <div className="lesson">
        <h2>The sequence</h2>
        <p>
          Architecture search is a search, and a good search has priors that keep it short and a
          fixed order that keeps each result interpretable. The order below is chosen so that every
          step changes exactly one thing, and so that the cheapest and most diagnostic experiments
          come first.
        </p>

        <MathBlock>{String.raw`\underbrace{\text{overfit a small sample}}_{1} \;\to\; \underbrace{\text{scale width}}_{2} \;\to\; \underbrace{\text{add depth?}}_{3} \;\to\; \underbrace{\text{regularise}}_{4} \;\to\; \underbrace{\text{tune optimiser}}_{5}`}</MathBlock>

        <ol style={{ lineHeight: 1.7 }}>
          <li>
            <strong>Make the network overfit a small sample first.</strong> Take a few hundred
            examples — or even a few dozen — and confirm the model can drive training accuracy to
            nearly 1.0 on them. This proves two things at once: the architecture has enough capacity
            to represent the answer, and there is no bug silently preventing learning. If it cannot
            overfit a tiny sample, no amount of width, depth, or regularisation will help until you
            find the bug.
          </li>
          <li>
            <strong>Scale width to kill underfitting.</strong> Once you know the model <em>can</em>{" "}
            fit, widen the layers to fit the full dataset. Width is the right first scaling knob
            because its returns plateau cheaply and predictably: on moons, width 16 &rarr; 512 buys
            only <strong>+0.004</strong> test accuracy, so a couple of doublings finds the plateau
            and you stop. Width does not introduce new gradient bottlenecks, so a wrong guess is
            cheap to correct.
          </li>
          <li>
            <strong>Add depth only if a hierarchy exists.</strong> Depth buys composition, which
            only helps when the problem has features-of-features to compose. Be cautious: depth is
            taxed. On moons, depth 20 at width 16 drops to <strong>0.750</strong> despite healthy
            gradient ratios — an optimisation failure, not a gradient one. Add one or two layers,
            measure, and back off the moment the depth sweep stops improving.
          </li>
          <li>
            <strong>Only then regularise the gap.</strong> Regularisation is a response to a real,
            measured train-test gap — not a default. If the gap is already small, regularisation
            does nothing: adding L2 to a 3&times;128 net on moons moved the gap from{" "}
            <strong>0.015 to 0.016</strong>. Reach for weight decay, dropout, or early stopping only
            after you have confirmed the model overfits.
          </li>
          <li>
            <strong>Tune the optimiser last.</strong> Learning rate, batch size, and schedule are
            fine adjustments once the architecture is right. They rescue a misconfigured run, but
            they are the wrong first move for an underfit or overfit model, because they do not
            change capacity — they change how well you reach the capacity you have.
          </li>
        </ol>

        <Callout color={CORAL} title={<>One change at a time, cheapest first</>}>
          The reason for the order is not dogma — it is interpretability. Each step changes one
          thing, so when the number moves you know what moved it. And the order front-loads the
          cheap, high-information moves: overfitting a small sample takes seconds and rules out an
          entire class of bugs; width doublings are cheap and their plateau is quick to find; depth
          and regularisation are more expensive and more entangled, so they come later, only when the
          diagnosis calls for them.
        </Callout>

        <h2>Why width before depth, and regularisation last</h2>
        <p>
          The order encodes the measured costs. Width comes before depth because the width plateau is
          cheap to find (+0.004 over a 32-fold increase) and widening never destabilises training.
          Depth comes with a warning label because the depth tax is real and can be severe: the
          depth-20 collapse to 0.750 happens even when the gradient ratios stay in the healthy 2&ndash;5
          range, so it is not something initialisation fixes. Regularisation comes last because it is
          only a lever when there is a gap to close, and on this problem there barely is — the
          0.015 &rarr; 0.016 non-result is the whole argument for not regularising by reflex.
        </p>

        <Proof color={CORAL} title="why &ldquo;make it overfit first&rdquo; is the correct first move">
          <p>
            A model that trains poorly is failing for one of two fundamentally different reasons, and
            they demand opposite fixes. Either it <em>cannot represent</em> the answer (a capacity
            problem, or a bug that blocks learning), or it <em>can represent it but cannot find
            it</em> (an optimisation or data problem). Almost every wasted architecture experiment
            comes from confusing these two.
          </p>
          <p>
            Overfitting a tiny sample separates them cleanly. On a handful of examples, a correct
            architecture with no bug will reach near-perfect training accuracy — there is so little
            data that even modest capacity can memorise it. So if the model <em>succeeds</em> at
            overfitting the small sample, capacity and correctness are ruled out, and any remaining
            failure on the full dataset is optimisation or data. If it <em>fails</em> to overfit even
            the small sample, the problem is upstream of everything else: a bug, a broken gradient
            path, a mislabelled target, a dead nonlinearity. Either outcome tells you which half of
            the search space to work in, which is why it is the cheapest and most informative
            experiment you can run — and therefore the first.
          </p>
        </Proof>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>Why is &ldquo;make the network overfit a small sample&rdquo; the recommended first
                step in architecture search?</>,
              options: [
                "It produces the final model you will deploy",
                "It separates capacity/bug problems from optimisation/data problems: success rules out capacity and bugs, failure points upstream — for the cost of seconds",
                "It is the only way to measure the train-test gap",
              ],
              answer: 1,
              explain: <>A tiny sample is easy to memorise, so a correct, bug-free architecture will
                overfit it. Success rules out capacity and correctness problems; failure means the
                bottleneck is a bug or a broken gradient path. Either way you learn which half of the
                search space to work in, cheaply.</>,
            },
            {
              q: <>Why does the sequence scale width before adding depth?</>,
              options: [
                "Width always beats depth on every problem",
                "Width's returns plateau cheaply and predictably (16 → 512 buys only +0.004) and widening introduces no new gradient bottlenecks, whereas depth is taxed — depth 20 fell to 0.750 despite healthy gradients",
                "Depth cannot be added after width",
              ],
              answer: 1,
              explain: <>Width is the cheap, safe scaling knob: a couple of doublings finds the plateau
                and a wrong guess costs little. Depth carries the depth tax — the depth-20 collapse to
                0.750 with healthy gradient ratios shows the cost can appear even when nothing looks
                wrong — so it comes later and more cautiously.</>,
            },
            {
              q: <>The order places regularisation fourth, after width and depth. Which measured result
                justifies waiting?</>,
              options: [
                "L2 on a 3×128 net moved the gap from 0.015 to 0.016 — regularisation does nothing when there is no real gap to close",
                "Regularisation always reduces test accuracy",
                "Weight decay only works with SGD, not Adam",
              ],
              answer: 0,
              explain: <>Regularisation is a response to a measured gap. On this clean problem the gap
                is already tiny, so adding L2 changed it from 0.015 to 0.016 — no help. You reach for
                it only after confirming the model overfits, which is why it comes after the capacity
                knobs.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/architecture-design/underfit-fit-overfit", label: <>&larr; Underfit, fit, overfit</> }}
          next={{ href: "/learn/architecture-design/sensible-defaults", label: <>Next up &middot; Sensible starting points &rarr;</> }}
        />
      </div>
    </article>
  );
}
