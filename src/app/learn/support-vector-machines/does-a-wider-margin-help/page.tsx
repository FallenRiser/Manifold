import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeOutput } from "@/components/CodeOutput";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { Quiz } from "@/components/Quiz";
import { MarginVsTruthLab } from "@/components/labs/MarginVsTruthLab";

const PINK = "var(--c-classification)";

export const metadata = {
  title: "Does a wider margin actually help? — Manifold",
  description:
    "The first page measured half a percentage point. This one finds where that number comes from: how it grows with sample size, what controls it, why the test set you choose can hide it completely, and what a single badly placed point costs.",
};

export default function WiderMarginPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: PINK }, { label: "Core", color: "var(--c-fundamentals)" }]}
        time="about 13 minutes"
        title={<>When the margin earns its keep</>}
        intro={<>The first page of this track put the margin argument to a vote and it won
          narrowly: better on 30 draws out of 185, worse on 3, and a mean gain of half a
          percentage point. That is a real answer to a specific question. It is also a much
          smaller number than the amount of machinery this track is about to spend, so it is worth
          finding out what it depends on.</>}
        titleSize={42}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>Data that comes with an answer key</h2>
        <p>
          To ask whether a boundary is <em>good</em> rather than merely <em>different</em>, you need
          to know where the right boundary is. So everything below is generated from a known line:
          points are scattered at random, any that land within a clear band of that line are
          discarded, and the rest are labelled by which side they fell on. The training data is
          then separable by construction, and there is an exact truth to measure each fitted
          boundary against.
        </p>
        <p>
          The test data is drawn from the whole space, with no clear band — including the strip
          right beside the boundary. That distinction turns out to matter more than anything else
          on this page.
        </p>

        <h2>More data makes the gap wider, not narrower</h2>
        <p>
          The intuitive guess is that the choice of separator matters most when data is scarce,
          and washes out once you have plenty. The opposite happens:
        </p>

        <CodeOutput source="scripts/svm_cases.py">{outSize}</CodeOutput>

        <p>
          At six training points the two models are nearly even — 110 wins to 82. At a hundred and
          sixty it is <strong>198 to 1</strong>, and the average gain has roughly doubled. The
          angle columns explain it. The max-margin boundary converges on the truth, from 14.16°
          down to <strong>0.71°</strong>, while the perceptron stalls near 6° and stays there no
          matter how much data it is given.
        </p>
        <p>
          That is not a defect in the perceptron so much as a description of what it does. It stops
          the moment nothing is misclassified, so extra data mostly hands it more places where it
          is allowed to stop. The max-margin rule keeps optimising after the last mistake is gone,
          because &ldquo;no mistakes&rdquo; is where its objective <em>starts</em>.
        </p>

        <PredictPrompt
          accent={PINK}
          prompt={<>In the lab below, both lines separate the training points perfectly and the
            dashed line is the truth. What happens to the two fitted lines as you widen the clear
            band between the classes?</>}
          options={[
            "Both stay close to the truth — a wider gap is an easier problem",
            "Both drift from the truth, since the boundary is less pinned down",
            "The max-margin line stays close while the perceptron drifts further",
            "The perceptron stays close while the max-margin line drifts further",
          ]}
        />

        <LabFrame
          accent={PINK}
          tryThis={<>Press <strong>new sample</strong> a few times at the default settings and
            watch how far each line strays from the dashed truth. Then push the
            <strong> clear band</strong> slider right out and do it again.</>}
          insight={<>A wider band is an easier problem in one sense — it is easier to separate the
            training data — but a harder one in the sense that matters: there is more room for a
            separator to sit in the wrong place and still be right about every training point. The
            perceptron takes that room and wanders, while the max-margin line has far less freedom,
            because the widest corridor is nearly pinned. Judge it over several samples rather than
            one: at the default settings the max-margin line is the closer of the two on about four
            samples in five, and a particular draw can always go the other way.</>}
        >
          <MarginVsTruthLab />
        </LabFrame>

        <h2>What sets the size of the effect</h2>
        <p>
          The lab suggests the clear band is the control. Running the same comparison across five
          band widths, at a fixed forty training points:
        </p>

        <CodeOutput source="scripts/svm_cases.py">{outBand}</CodeOutput>

        <p>
          A factor of roughly fifteen, from <strong>+0.006</strong> to <strong>+0.087</strong>,
          driven entirely by how much room sits between the classes. Squeeze them together and
          every separator is forced into nearly the same position, so choosing carefully among them
          cannot buy anything. Pull them apart and the set of boundaries that fit the training data
          perfectly becomes large — and most of its members are worse than the widest one.
        </p>

        <Callout color={PINK} title={<>The perceptron gets worse as the problem gets easier</>}>
          <p>
            Read the perceptron column in that table on its own: 0.9702 at the tightest band, down
            to 0.8997 at the widest. Its angle error climbs from 4.45° to 15.03°. Widening the gap
            between the classes makes it <em>less</em> accurate, which sounds absurd until you
            remember its stopping rule. More room between the classes means more separators that
            make zero mistakes, so the first one it stumbles into is on average further from the
            truth. The max-margin boundary improves over the same range.
          </p>
        </Callout>

        <h2>The test set can hide all of it</h2>
        <p>
          There is one more variable, and it belongs to the experiment rather than the model. Two
          boundaries that both classify the training data perfectly can only disagree about points
          near where they diverge — the strip between the classes. If the test data avoids that
          strip, the disagreement is invisible. Here are the same trained models, scored twice:
        </p>

        <CodeOutput source="scripts/svm_cases.py">{outWhere}</CodeOutput>

        <p>
          Same models, same training data, and the measured gain moves from{" "}
          <strong>+0.0083</strong> to <strong>+0.0416</strong> purely by changing where the test
          points come from. At the widest band it is starker still: <strong>+0.0020</strong> against{" "}
          <strong>+0.0901</strong>, a factor of forty-five. When the test set is drawn the same way
          as the training set, both boundaries score above 0.99 and the comparison reports a tie —
          not because the boundaries agree, but because nothing is asked about the region where
          they differ.
        </p>
        <p>
          This is the missing piece from page one. That experiment drew its test data from the same
          two clusters the training data came from, so most test points landed comfortably inside
          one class or the other, far from any boundary under consideration. The +0.0056 it
          measured is a true number about that setup. It is not a general statement about margins.
        </p>

        <Callout color={PINK} title={<>Worth carrying past this track</>}>
          <p>
            Nothing in the preceding paragraph is specific to support vector machines. Two models
            that agree everywhere except a thin region will look identical on any test set that
            under-samples that region, and the region they disagree about is usually the region
            that was hard to collect data from in the first place. A tie in an evaluation is a
            statement about the evaluation as much as about the models.
          </p>
        </Callout>

        <h2>What the hard margin charges for this</h2>
        <p>
          So the margin does buy something, and more than page one suggested. The bill comes in the
          same feature that makes it work: the boundary is decided entirely by the closest points,
          and it has no way to decline one. Below, a single training point is walked steadily across
          the true boundary while keeping its original label. Every other point stays exactly where
          it was.
        </p>

        <CodeOutput source="scripts/svm_cases.py">{outOnepoint}</CodeOutput>

        <p>
          The margin collapses from 1.44 to <strong>0.05</strong> and accuracy falls{" "}
          <strong>17 points</strong>, on the strength of one point out of forty. Worse, the data
          stays perfectly separable the whole way down, so every diagnostic a hard-margin SVM has
          available still reads &ldquo;fine&rdquo;: zero training errors, a valid solution, no
          warning of any kind. Push that point a little further and the feasible set empties and
          there is no solution at all.
        </p>
        <p>
          A model that a single mislabelled example can bend this far is not usable on real data,
          where mislabelled examples are ordinary. The next chapter fixes it by giving the problem
          permission to ignore points, at a price you set.
        </p>

        <Quiz
          accent={PINK}
          questions={[
            {
              q: <>Why does the perceptron&rsquo;s angle error stop improving once there is plenty
                of data?</>,
              options: [
                "It converges to the max-margin boundary but more slowly",
                "It stops as soon as nothing is misclassified, so more data mainly adds more acceptable places to stop",
                "Its learning rate decays too quickly",
                "It overfits the extra points",
              ],
              answer: 1,
              explain: <>Its objective is satisfied by <em>any</em> separator. Extra data shrinks
                the set of separators a little but the perceptron still halts at whichever one it
                meets first, so its error flattens out near 6° while the max-margin boundary
                keeps closing on the truth.</>,
            },
            {
              q: <>Widening the clear band between the classes made the perceptron&rsquo;s test
                accuracy fall from 0.9702 to 0.8997. Why?</>,
              options: [
                "Wider gaps mean fewer training points near the boundary, so it has less information",
                "A wider gap admits more zero-error separators, so the first one found is on average further from the truth",
                "The perceptron cannot handle well-separated classes",
                "The test set changed along with the band",
              ],
              answer: 1,
              explain: <>More room between the classes means a larger set of boundaries that make
                no training mistakes. The perceptron picks from that set essentially arbitrarily, so
                a bigger set is a worse expected pick. Over the same range the max-margin boundary
                got <em>better</em>.</>,
            },
            {
              q: <>The same two models scored +0.0020 on one test set and +0.0901 on another. What
                changed?</>,
              options: [
                "The training data, which was resampled",
                "Nothing meaningful — it is run-to-run noise",
                "Whether the test points could land in the strip between the classes, which is the only place the two boundaries disagree",
                "The margin, which was recomputed",
              ],
              answer: 2,
              explain: <>Two separators that both fit the training data perfectly differ only near
                the region between the classes. A test set drawn with the same clear band never
                asks about that region, so it reports near-identical accuracy for boundaries that
                are in fact far apart.</>,
            },
            {
              q: <>In the last experiment, what makes the single moved point especially
                dangerous?</>,
              options: [
                "It makes the training data non-separable immediately",
                "It causes the solver to fail to converge",
                "The data stays separable and training error stays at zero, so nothing signals the damage",
                "It changes the labels of nearby points",
              ],
              answer: 2,
              explain: <>Margin and test accuracy collapse while the fit stays valid and training
                error stays at zero. The hard-margin problem must satisfy every constraint, so it
                quietly contorts the boundary to obey one bad point and reports no problem.</>,
            },
          ]}
        />
      </div>

      <PrevNext
        prev={{
          label: "The maximum-margin hyperplane",
          href: "/learn/support-vector-machines/the-maximum-margin-hyperplane",
        }}
        next={{
          label: "Soft margin: slack & C",
          href: "/learn/support-vector-machines/soft-margin-slack-and-c",
        }}
      />
    </article>
  );
}

const outSize = `Both models separate the training data perfectly every time; the test set is the whole
space, including the region near the boundary that the training sample avoided.

      n   draws  max-marg    percep      gain      W/L/T    mm angle  perc angle mm closer
      6     192    0.8900    0.8686   +0.0214   110/82/0       14.16       20.47      64%
     10     200    0.9199    0.8964   +0.0235   128/72/0       10.28       15.14      66%
     20     200    0.9586    0.9251   +0.0336   162/38/0        5.09       10.87      79%
     40     200    0.9780    0.9364   +0.0416   179/21/0        2.80        8.82      83%
     80     200    0.9890    0.9476   +0.0414   186/13/1        1.49        7.22      89%
    160     200    0.9946    0.9518   +0.0428    198/1/1        0.71        6.18      97%

  The gap WIDENS with more data: +0.021 at n=6, +0.043 at n=160, and the win/loss
  record goes from 110/82 to 198/1. The angle columns say why. The max-margin
  boundary converges on the truth -- 14.2 deg down to 0.7 -- while the perceptron
  stalls around 6 deg and stays there. It stops at the FIRST separator it finds, so
  extra data mostly gives it more ways to stop early.`;

const outBand = `If the tie-break only matters when several separators are possible, then the width of
the clear band between the classes should control the whole effect. n = 40 throughout.

    band  max-marg    percep      gain      W/L/T    mm angle  perc angle
    0.05    0.9762    0.9702   +0.0060    90/59/1        2.82        4.45
    0.20    0.9743    0.9588   +0.0155   104/45/1        2.96        5.88
    0.60    0.9766    0.9353   +0.0413   130/20/0        2.93        8.56
    1.20    0.9832    0.9101   +0.0731   140/10/0        2.15       12.91
    1.80    0.9870    0.8997   +0.0873    141/9/0        1.77       15.03

  That is the whole story in one column. Squeeze the classes together and the gain
  collapses to +0.006; pull them apart and it grows to +0.087, a factor of fifteen.
  With no room between the classes every separator is nearly the same line, so
  choosing well among them cannot buy anything.`;

const outWhere = `The same trained models, scored on two different test sets. One is drawn the way the
TRAINING data was, with the same clear band. The other is the whole space, including
the strip beside the boundary that the training sample happened to avoid.

    band            test points drawn   max-marg    percep      gain
    0.60     with the same clear band     0.9996    0.9913   +0.0083
    0.60 uniformly, boundary included     0.9780    0.9364   +0.0416
    1.80     with the same clear band     1.0000    0.9980   +0.0020
    1.80 uniformly, boundary included     0.9868    0.8966   +0.0901

  Within each pair the models are identical; only the question changes. Test where the
  training data lived and both boundaries look near perfect, because the one region
  they disagree about is the region the test set avoids. Almost the entire difference
  between two separators lives in the strip between the classes, so a test set that
  stays out of that strip cannot see it -- and reports a tie.`;

const outOnepoint = `40 separable points, one of them walked steadily across the true boundary while
keeping its original label. Every other point stays exactly where it was.

      moved       margin     test acc     separable
         0%       1.4376       0.9915           yes
        50%       1.1680       0.9315           yes
       100%       0.8653       0.8880           yes
       150%       0.4532       0.8535           yes
       200%       0.0453       0.8255           yes
       250%           --           --            NO

  One point, and the margin falls from 1.44 to 0.05 while accuracy drops 17 points.
  The data stays separable the whole way down, so nothing warns you. Push it a little
  further and no separating hyperplane exists at all: the problem stops having an
  answer rather than returning a poor one.`;
