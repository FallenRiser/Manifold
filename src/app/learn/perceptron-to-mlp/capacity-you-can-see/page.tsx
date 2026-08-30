import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { CapacityLadderLab } from "@/components/labs/CapacityLadderLab";

export const metadata = {
  title: "Capacity you can see — Manifold",
  description:
    "A measured sweep from 1 to 256 hidden units. Three units and 13 parameters capture three quarters of the total gain; 256 units and 1,025 parameters capture slightly less than 64 did.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function CapacityPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Making it learn", color: CORAL }, { label: "Tier 2 · mechanics", color: CORAL }]}
        time="about 8 minutes"
        title={<>Capacity you can see</>}
        intro={<>&ldquo;How many hidden units?&rdquo; is the first question everyone asks and the last one any
          course answers. Here is the empirical shape of the answer on one honest problem — which will not give you
          a number, but will give you something better: the right expectations about what buying more capacity
          actually gets you.</>}
      />

      <div className="lesson">
        <h2>The experiment</h2>
        <p>
          Two interleaved moons, 600 points with real overlap (noise 0.25), a 35% held-out test set. One hidden
          layer of ReLU units, width swept from 1 to 256. Every row is <strong>averaged over five random
          initialisations</strong>, because a single seed on a two-unit network measures the initialisation at least
          as much as the architecture — which the XOR experiment already showed is no small effect.
        </p>

        <PredictPrompt
          accent={CORAL}
          prompt={<>One hidden unit scores 0.641 on the test set. How many units do you think it takes to get within
            one percentage point of the best result on the whole sweep?</>}
          options={["Around 4", "Around 16", "Around 64", "Around 256"]}
          nudge="Locked in. Now walk the slider from left to right."
        />

        <LabFrame
          accent={CORAL}
          tryThis={<>Step from 1 unit to 3, and watch how much of the total improvement arrives in those two steps.
            Then keep going to 256 and watch the two curves separate rather than climb.</>}
          insight={<>Almost all the value is bought early. Going from 1 unit to 3 costs 8 extra parameters and buys{" "}
            <strong>+0.211</strong>; going from 3 to 64 costs 244 extra parameters and buys <strong>+0.067</strong>.
            And the last step buys nothing at all: from 64 to 256 units the train curve rises{" "}
            <strong>+0.0098</strong> while the test curve <em>falls</em> 0.0009. <strong>That is what &ldquo;too
            much capacity&rdquo; looks like</strong> — not a collapse, just improvement that only exists on data the
            model has already seen.</>}
        >
          <CapacityLadderLab />
        </LabFrame>

        <h2>Three things this shape tells you</h2>
        <p>
          <strong>One unit is a perceptron.</strong> 0.641 on a task whose classes genuinely interleave — a single
          straight cut through two moons, which is exactly the chapter-1 limitation reappearing as a number at the
          bottom of a chart.
        </p>
        <p>
          <strong>The returns are brutally diminishing, and early.</strong> Three units and thirteen parameters
          reach 0.8524, which is within 6.7 points of the best row on a chart that spans a 79-fold increase in
          parameters. If you have been told that neural networks need to be big, the honest correction is that they
          need to be <em>big enough</em>, and &ldquo;enough&rdquo; is usually reached far sooner than expected.
        </p>
        <p>
          <strong>Too much capacity shows up as the curves parting, not as a collapse.</strong> Going from 64 to
          256 units, training accuracy gains <strong>+0.0098</strong> and test accuracy <em>loses</em>{" "}
          <strong>0.0009</strong>. Four times the parameters bought improvement that exists only on data the model
          has already seen. Test performance did not crater — it simply stopped listening, which is the ordinary
          presentation of too much capacity and the reason training loss alone tells you nothing.
        </p>
        <p>
          One honest caveat about that third point. It is tempting to say the train–test gap widens steadily with
          width, and on this sweep it does not: the gap wanders between 0.013 and 0.040 with no clean trend, because
          five-seed averages on 210 test points are simply not precise enough to resolve it. The claim the data
          <em> does</em> support is the narrow one above — at the last step, train moved and test did not.
        </p>

        <Callout color={CORAL} title={<>Why the plateau is not a wall</>}>
          Test accuracy flattens around 0.92 here, and it is worth being clear that this is <strong>not</strong> the
          model running out of expressive power. The moons were generated with <code>noise=0.25</code>, which means
          the two classes genuinely overlap and some points are unclassifiable in principle. The plateau is the
          irreducible error of the problem, not a limit of the architecture — and no width, depth or training budget
          moves it. Recognising a noise ceiling for what it is prevents an enormous amount of wasted effort; the{" "}
          <Link href="/learn/data-workflow/error-analysis" style={link}>error analysis</Link> page in the data
          workflow pillar is the general version of this diagnosis.
        </Callout>

        <h2>So what should you actually do?</h2>
        <p>
          The practical procedure that follows from this shape, and which the{" "}
          <strong>Architecture design</strong> track develops properly:
        </p>
        <ul>
          <li><strong>Start small enough to be fast.</strong> A model you can train in thirty seconds tells you
            about your data far quicker than one you can train overnight.</li>
          <li><strong>Grow until the training loss can reach near zero.</strong> That confirms you have enough
            capacity to fit the problem at all. If you cannot overfit, you cannot yet be overfitting.</li>
          <li><strong>Then regularise instead of shrinking.</strong> The modern default is deliberately more
            capacity than needed, held in check by early stopping, weight decay and dropout — because a slightly
            oversized model that is regularised beats a carefully sized one, and, as XOR showed, extra width also
            buys reliability across initialisations.</li>
        </ul>
        <p>
          Note how that sequence differs from what the chart alone might suggest. The chart says three units are
          nearly enough; the procedure says build bigger anyway. Both are right, because they are optimising
          different things — parameters versus the probability that a given run works.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>Training accuracy is 0.95 and test accuracy is 0.92, and adding width raises the first while the
                second stays flat. What is happening?</>,
              options: [
                "The model is underfitting and needs more capacity",
                "The extra capacity is being spent memorising the training set",
                "The test set is too small to measure the improvement",
              ],
              answer: 1,
              explain: <>Diverging curves means new capacity is fitting the training data specifically. This is the
                ordinary look of overfitting — not a crash, just a widening gap and a test curve that has stopped
                responding.</>,
            },
            {
              q: <>Test accuracy plateaus at 0.92 no matter how wide the network gets. What is the most likely
                explanation?</>,
              options: [
                "The architecture cannot express the true boundary",
                "The data has irreducible noise — some points are genuinely unclassifiable",
                "Training is stopping too early",
              ],
              answer: 1,
              explain: <>The moons were generated with <code>noise=0.25</code>, so the classes overlap and a ceiling
                below 100% is expected. A wide network can already express far more complex boundaries than this
                one, so expressiveness is not the constraint.</>,
            },
            {
              q: <>Three units capture most of the achievable accuracy. Why is the standard advice still to build
                bigger?</>,
              options: [
                "Because bigger networks always generalise better",
                "Because the minimum viable size is unreliable across initialisations, and extra capacity can be regularised away",
                "Because parameter count is not a real cost",
              ],
              answer: 1,
              explain: <>Two hidden units solved XOR from only 25 of 50 seeds while four solved it from 49. Extra
                capacity buys reachability, and early stopping or weight decay controls the overfitting it
                introduces. Bigger is not automatically better — an unregularised 256-unit model was slightly worse
                than 64 here.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/perceptron-to-mlp/the-training-loop", label: <>← The training loop</> }}
          next={{ href: "/learn/perceptron-to-mlp/what-can-go-wrong", label: <>Next up · What can go wrong →</> }}
        />
      </div>
    </article>
  );
}
