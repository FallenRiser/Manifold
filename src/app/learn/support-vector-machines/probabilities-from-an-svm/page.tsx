import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeOutput } from "@/components/CodeOutput";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { Quiz } from "@/components/Quiz";
import PlattLab from "@/components/labs/PlattLab";

const PINK = "var(--c-classification)";

export const metadata = {
  title: "From a score to a probability — Manifold",
  description:
    "An SVM outputs a score, not a probability. Why squashing the score fails, how Platt's sigmoid fixes it, when fitting it on training scores is safe, and what sklearn's probability=True actually does.",
};

const outSquash = `breast_cancer, standardised, the default rbf SVM. Half the data to train on, half
held out, five splits pooled -- 1,425 held-out predictions. Two ways to turn a
decision value f into a probability of 'benign':

  squash    1 / (1 + exp(-f)), the obvious thing to try
  Platt     1 / (1 + exp(A f + B)), with A and B fitted by logistic regression on
            decision values the model produced for points it had NOT seen (5-fold)

                                    squash                      Platt
  said           points      said  happened  points      said  happened
  0.0 - 0.1          50     0.087     0.000     444     0.010     0.002
  0.1 - 0.3         328     0.182     0.000      56     0.190     0.161
  0.3 - 0.5         138     0.391     0.116      22     0.399     0.409
  0.5 - 0.7         135     0.623     0.852      24     0.599     0.750
  0.7 - 0.9         733     0.820     0.986      46     0.814     0.848
  0.9 - 1.0          41     0.909     1.000     833     0.990     0.983

                                               squash      Platt
  log loss (lower is better)                   0.2641     0.1012
  calibration error (said vs happened)         0.1813     0.0115
  share of points given more than 0.9 either way     0.0639     0.8961

The squash is timid. It never says more than 0.928, yet the points it calls 0.7-0.9
happen 99% of the time. The reason is the margin. A point exactly on it has f = 1,
which the squash turns into 1/(1+e^-1) = 0.731. But on held-out data 74% of points
land at or beyond the margin, and 99.7% of those are classified correctly. Platt's fit
says a point on the margin is benign with probability 0.979 (A = -4.11, B = 0.25, the
mean over the five splits): the SVM's own unit of distance, measured against what
actually happens.`;

const outScale = `Why not just squash f? Because nothing fixes how big f is. Moons, 600 points, half
held out, rbf with gamma = 1, and only C changing. 'spread' is the 90th percentile
of |f| on held-out points; A is Platt's fitted slope, from 5-fold held-out scores:

         C   accuracy    spread        A    squash loss    Platt loss
      0.01     0.8633     0.485    -9.27         0.5787        0.3903
      0.03     0.8667     1.017    -3.54         0.4692        0.3542
       0.1     0.8767     1.108    -3.01         0.4268        0.3121
       0.3     0.8833     1.270    -2.82         0.4022        0.2952
         1     0.8867     1.485    -2.74         0.3815        0.2920
         3     0.8900     2.051    -2.44         0.3561        0.2965
        10     0.8900     2.973    -1.97         0.3341        0.3147
       100     0.8900     4.496    -1.35         0.3267        0.3265
      1000     0.8700     8.715    -0.69         0.3635        0.3522

The spread of f grows 18-fold across the dial while accuracy moves between 0.8633
and 0.8900. f is measured in margins, and C decides how wide a margin is, so the same
point at the same distance from the boundary gets a different score at every C. A
fixed squash reads that as a change in confidence. Platt's A absorbs it -- -9.3 at
the small-C end, -0.69 at the large -- and its loss stays between 0.2920 and 0.3903 while
the squash's runs from 0.3267 to 0.5787.

The held-out scores need STRATIFIED folds, one trap worth seeing once. Split the same
points into folds by position instead, and the share of the positive class per fold
runs from 0.40 to 0.60. At C = 0.01 every price is at the cap, the offset b is pinned
only to an interval, and each fold's imbalance pushes it around by more than the rest
of the score. Platt then fits the folds, not the points: A = -0.49, loss 0.6344 instead
of 0.3903.

sklearn's SVC(probability=True) falls into it. libsvm shuffles its internal folds
without stratifying, and at C = 0.01 its loss over ten random_state values runs from
0.5450 to 0.6275, against the stratified 0.3903 above. At C = 1 the offset is set by free
support vectors, the trap closes, and the same ten runs land between 0.2889 and 0.2920
(stratified: 0.2920).`;

const outHeld = `Platt's paper says: not on the training points' own scores, because the model has
seen them. The cheap alternative is tempting, so measure it. For each C and gamma:
the sigmoid fitted once on the training scores and once on 5-fold held-out scores,
both scored by log loss on the held-out half. Five splits:

                      C   gamma train acc  test acc  loss:train   loss:held   penalty
  breast_cancer       1    0.01    0.9768    0.9649      0.0949      0.0952   -0.0003
                      1     0.1    0.9958    0.9509      0.1473      0.1507   -0.0033
                      1       1    1.0000    0.6309      0.6738      0.4567   +0.2172
                      1      10    1.0000    0.6281      0.7607      0.6600   +0.1007
                    100    0.01    0.9993    0.9670      0.0963      0.0999   -0.0036
                    100     0.1    1.0000    0.9467      0.1557      0.1627   -0.0069
                    100       1    1.0000    0.6323      0.6755      0.4324   +0.2431
                    100      10    1.0000    0.6281      0.7607      0.6600   +0.1007
  moons               1    0.01    0.8560    0.8660      0.3237      0.3232   +0.0005
                      1     0.1    0.8700    0.8733      0.3175      0.3183   -0.0008
                      1       1    0.9027    0.9013      0.2605      0.2608   -0.0003
                      1      10    0.9300    0.9013      0.2975      0.2964   +0.0011
                    100    0.01    0.8680    0.8620      0.3214      0.3231   -0.0017
                    100     0.1    0.8953    0.8973      0.2431      0.2440   -0.0009
                    100       1    0.9193    0.9020      0.2809      0.2862   -0.0053
                    100      10    0.9833    0.8487      0.8643      0.4832   +0.3811

'penalty' is how much worse the training-score fit is. Where the model does about as
well on new points as on its own (a gap under 0.05, 10 of 16 rows), the penalty is
between -0.0053 and +0.0011: nothing. Where it memorises (6 rows), the penalty is up to
+0.3811. Training scores lie in exactly one case, and it is the case you will not see
coming, because the training accuracy looks wonderful. sklearn's probability=True
always takes the held-out route, which is what the next section is about.`;

const outProb = `SVC(probability=True) runs libsvm's own 5-fold cross-validation inside fit() to get
held-out scores, then fits Platt's sigmoid on them -- per pair of classes, combined
across pairs for more than two. So each binary model is fitted six times. Three side
effects, measured with ten different random_state values on each dataset:

                      predict != argmax    largest change in a       same labels as
                       of predict_proba   probability, by seed    probability=False
  breast_cancer            1-2 of 569                    0.0394                  yes
  wine                     0-0 of 178                    0.0927                  yes
  iris                     0-0 of 150                    0.0531                  yes
  digits                   2-3 of 1797                   0.0714                  yes
  moons                    1-3 of 600                    0.0151                  yes

predict() still uses the plain decision values; predict_proba() uses the sigmoid,
and on a handful of points they disagree about the label. The internal folds are
random, so the same data and the same model give probabilities that move with
random_state. And the labels from predict() never change: the whole apparatus sits
on top of the same SVM.

Against the alternatives, on held-out data (half split, five splits, standardised).
Isotonic regression fits a staircase instead of a sigmoid (CalibratedClassifierCV,
5-fold); logistic regression is the model built to output probabilities:

                                            log loss      Brier   calib. err  said 0 or 1
  breast_cancer  SVM, squash                  0.2641     0.0627       0.1697            0
                 SVM, probability=True        0.1094     0.0270       0.0223            0
                 SVM, isotonic                0.3381     0.0285       0.0257         1094
                 logistic regression          0.0843     0.0218       0.0202            0
  moons          SVM, squash                  0.3651     0.1012       0.1624            0
                 SVM, probability=True        0.2604     0.0757       0.0390            0
                 SVM, isotonic                0.3805     0.0754       0.0289          216
                 logistic regression          0.3216     0.1001       0.0401            0

Isotonic has the lowest calibration error on moons and the worst log loss on both,
for one reason: the last column. A staircase can say exactly 0 or exactly 1, and one
confident miss at probability 0 costs log loss a fortune. Platt's sigmoid never
reaches either end. Logistic regression is best in every column on breast_cancer,
where a straight boundary is enough. On moons, where it is not, its Brier score
(0.1001) is barely better than the uncalibrated squash (0.1012): a probability is only
as good as the model underneath it.`;

export default function Page() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: PINK }, { label: "Core", color: "var(--c-fundamentals)" }]}
        time="about 16 minutes"
        title={<>From a score to a probability</>}
        intro={<>An SVM tells you which side of the boundary a point is on and how far past it. It
          does not tell you how likely it is to be right, and a lot of real decisions need exactly
          that. This page turns the score into a probability, measures how well that works, and
          looks at what sklearn does when you ask it to.</>}
        titleSize={42}
      />

      <div className="lesson">
        <p>
          The SVM&apos;s output is the decision value, the same one every page on this track has
          used:
        </p>

        <MathBlock>{String.raw`f(x) \;=\; \sum_i \alpha_i\, y_i\, K(x_i, x) \;+\; b`}</MathBlock>

        <p>
          Its sign is the label. Its size says how far past the boundary the point is, in units
          where the margin sits at <M>{String.raw`f = \pm 1`}</M>. Nothing about it is a
          probability. It is not between 0 and 1, and the hinge loss that trained it never asked
          it to mean anything beyond the margin: a point at <M>{String.raw`f = 3`}</M> and one at{" "}
          <M>{String.raw`f = 30`}</M> cost exactly the same, nothing.
        </p>

        <h2>The obvious fix, measured</h2>

        <p>
          The first thing anyone tries is to push the score through the logistic function, the
          same squash logistic regression uses. John Platt&apos;s 1999 proposal is only slightly
          different: squash it through a sigmoid whose slope and offset are <em>fitted</em>.
        </p>

        <MathBlock>{String.raw`\begin{gathered}
p_{\text{squash}}(x) \;=\; \frac{1}{1 + e^{-f(x)}} \\[8pt]
p_{\text{Platt}}(x) \;=\; \frac{1}{1 + e^{\,A f(x) + B}}
\end{gathered}`}</MathBlock>

        <p>
          <M>{String.raw`A`}</M> and <M>{String.raw`B`}</M> are found by a one-feature logistic
          regression: the feature is the SVM&apos;s score, the target is the label. The squash is
          the special case <M>{String.raw`A = -1,\ B = 0`}</M>. On held-out breast_cancer data:
        </p>

        <CodeOutput source="scripts/svm_cases.py">{outSquash}</CodeOutput>

        <p>
          Read the &ldquo;said&rdquo; and &ldquo;happened&rdquo; columns side by side. The squash
          is timid: it never says more than <strong>0.928</strong>, and the 733 points it puts at
          0.7 to 0.9 turn out to be benign <strong>99%</strong> of the time. Platt&apos;s numbers
          track what happens, and its calibration error is <strong>0.0127</strong> against the
          squash&apos;s <strong>0.1813</strong>.
        </p>

        <p>
          The margin explains the gap. A point sitting exactly on it has{" "}
          <M>{String.raw`f = 1`}</M>, which the squash turns into 0.731. But most held-out points
          land at or beyond the margin, and <strong>99.7%</strong> of those are right. Platt&apos;s
          fit puts a point on the margin at <strong>0.976</strong>. It has measured the
          SVM&apos;s unit of distance against what actually happens.
        </p>

        <h2>The score has no units</h2>

        <p>
          A fixed squash has a deeper problem than being timid on one dataset. How big{" "}
          <M>{String.raw`f`}</M> gets is not fixed by anything about the data. It is measured in
          margins, and <M>{String.raw`C`}</M> decides how wide a margin is.
        </p>

        <PredictPrompt
          prompt="In the lab below, the SVM is refitted as C moves from 0.01 to 1000, with nothing else changing. What happens to the squash's probabilities at the small-C end?"
          options={[
            "They become overconfident — close to 0 and 1",
            "They crowd around 0.5, whatever the point",
            "They stay about the same, because accuracy barely changes",
            "They flip, so the classes swap sides",
          ]}
          accent="var(--c-classification)"
          nudge="Small C means a wide margin. How large can f get when the margin is wide?"
        />

        <LabFrame
          accent={PINK}
          tryThis={<>Start at <M>{String.raw`C = 1`}</M> with the squash, then switch to either
            Platt mode and compare the log loss. Now walk the C dial to 0.01 and back up to 1000,
            watching the score spread, the curve, and the chart on the right.</>}
          insight={<>At <M>{String.raw`C = 0.01`}</M> nine scores in ten lie within{" "}
          <strong>±0.110</strong>, so the squash says about 0.5 for nearly everything and its log loss is{" "}
          <strong>0.6655</strong>, barely better than a coin, from a model that is 90% accurate.
          Platt&apos;s slope climbs to about <M>{String.raw`A = -33`}</M> to undo the shrinking,
          and its loss is <strong>0.308</strong>. At <M>{String.raw`C = 1000`}</M> nine in ten are within{" "}
          <strong>±14.5</strong> and <M>{String.raw`A`}</M> falls to between −0.4 and −0.7. The squash is
          worse than both Platt fits at every C below 100. Fitting on training or held-out scores
          makes little difference here, and the next section says when it does.</>}
        >
          <PlattLab />
        </LabFrame>

        <p>
          The same dial on a bigger sample, 600 moons points with half held out:
        </p>

        <CodeOutput source="scripts/svm_cases.py">{outScale}</CodeOutput>

        <p>
          The spread of scores changes <strong>18-fold</strong> while accuracy stays within three
          points. The squash reads that change as a change in confidence and its loss swings from
          0.33 to 0.58. Platt&apos;s <M>{String.raw`A`}</M> absorbs it, and its loss stays between
          0.29 and 0.39.
        </p>

        <Callout color={PINK} title="Stratify the folds, and watch small C">
          <p>
            Held-out scores are only as good as the folds that produce them. At very small{" "}
            <M>{String.raw`C`}</M> every price sits at the cap, so the offset{" "}
            <M>{String.raw`b`}</M> is only pinned to an interval (page 11), and a fold with a few
            extra points of one class shifts it by more than the rest of the score. Platt then fits
            the folds instead of the points. sklearn&apos;s <code>probability=True</code> uses
            unstratified folds and walks into this at <M>{String.raw`C = 0.01`}</M>: log loss 0.545
            to 0.628 over ten seeds, against 0.390 with stratified folds. At{" "}
            <M>{String.raw`C = 1`}</M> the trap is gone.
          </p>
        </Callout>

        <h2>Training scores or held-out ones?</h2>

        <p>
          Platt&apos;s paper warns against fitting the sigmoid on the training points&apos; own
          scores, because the model has seen those points and will be too sure of them. The
          warning comes with a cost, since held-out scores mean fitting the SVM five more times. So
          is the cheap version really wrong?
        </p>

        <CodeOutput source="scripts/svm_cases.py">{outHeld}</CodeOutput>

        <p>
          Mostly, no. On every row where the model scores about as well on new points as on its own
          training points, the penalty for using training scores is between −0.011 and +0.001,
          which is nothing. On the rows where it memorises, the penalty reaches{" "}
          <strong>+0.377</strong>. So training scores are unsafe in one specific situation, the one
          where the training accuracy looks best. Since you usually cannot rule that out ahead of
          time, the held-out route is insurance, and sklearn always takes it.
        </p>

        <h2>What <code>probability=True</code> does</h2>

        <CodeOutput source="scripts/svm_cases.py">{outProb}</CodeOutput>

        <p>
          Three things are worth knowing before you rely on it. It fits every binary model six
          times, once for real and five times for the held-out scores, so training is slower.
          Its internal folds are random, so the same data gives probabilities that move with{" "}
          <code>random_state</code>, by up to <strong>0.09</strong> on wine. And{" "}
          <code>predict()</code> keeps using the plain decision values while{" "}
          <code>predict_proba()</code> uses the sigmoid, so on a few points per dataset the two
          disagree about the label. If you threshold probabilities, threshold{" "}
          <code>predict_proba</code>; do not mix the two.
        </p>

        <p>
          Against the alternatives, Platt holds up. Isotonic regression, which fits a staircase
          instead of a sigmoid, can say exactly 0 or exactly 1, and did so <strong>1,094</strong>{" "}
          times on breast_cancer across five splits. One confident miss at probability 0 costs log loss a fortune,
          which is why isotonic has the worst log loss on both datasets. Logistic regression, built
          to output probabilities, beats the SVM on breast_cancer, where a straight boundary is
          enough. On moons, where it is not, its Brier score is barely better than the squash&apos;s.
        </p>

        <h2>Where this leaves you</h2>

        <p>
          An SVM score is a distance, not a probability, and its scale moves with{" "}
          <M>{String.raw`C`}</M>. If you need probabilities, fit a sigmoid to the scores, and
          fit it on held-out ones: it costs five extra fits and protects you in exactly the case
          where the model looks best. Check that the folds are stratified when <M>{String.raw`C`}</M>{" "}
          is small. And if probabilities are the main thing you need, compare against logistic
          regression before assuming the SVM is the right model; that comparison is page 19.
        </p>

        <Quiz
          questions={[
            {
              q: <>A point lies exactly on the SVM&apos;s margin, <M>{String.raw`f = 1`}</M>. What does the squash <M>{String.raw`1/(1+e^{-f})`}</M> say, and what did Platt&apos;s fit say on breast_cancer?</>,
              options: [
                "Both say about 0.5",
                "The squash says 0.731; Platt said 0.976",
                "The squash says 0.976; Platt said 0.731",
                "Both say 1, because the point is correctly classified",
              ],
              answer: 1,
              explain: (
                <>
                  Most held-out points land at or beyond the margin and 99.7% of those are right,
                  so the margin means far more confidence than 0.731. Platt&apos;s fitted slope
                  measures that.
                </>
              ),
            },
            {
              q: <>Why can&apos;t a fixed squash work for every C?</>,
              options: [
                "Because C changes which points are support vectors",
                "Because the score is measured in margins, C sets the margin's width, so the same point gets a different score at every C",
                "Because the squash is only defined for linear kernels",
                "Because accuracy changes a lot with C",
              ],
              answer: 1,
              explain: (
                <>
                  On moons the spread of scores changed 18-fold across the dial while accuracy
                  moved by under three points. Platt&apos;s <M>{String.raw`A`}</M> rescales to
                  match; the squash cannot.
                </>
              ),
            },
            {
              q: <>When does fitting Platt&apos;s sigmoid on the training scores cost you?</>,
              options: [
                "Always, by a lot",
                "Never — the paper's warning is outdated",
                "When the model memorises its training points, which is exactly when the training accuracy looks best",
                "Only when C is small",
              ],
              answer: 2,
              explain: (
                <>
                  Where train and test accuracy agree, the penalty was between −0.011 and +0.001.
                  Where the model memorised, it reached +0.377.
                </>
              ),
            },
            {
              q: <>You fit <code>SVC(probability=True)</code> and find a point where <code>predict()</code> says class 1 but <code>predict_proba()</code> gives class 1 only 0.46. What is going on?</>,
              options: [
                "A bug in sklearn",
                "predict() uses the plain decision value and predict_proba() uses the fitted sigmoid; near the boundary they can disagree",
                "The model was not converged",
                "The classes were encoded in the wrong order",
              ],
              answer: 1,
              explain: (
                <>
                  The sigmoid&apos;s 0.5 point is where <M>{String.raw`Af + B = 0`}</M>, which is
                  not exactly <M>{String.raw`f = 0`}</M> unless <M>{String.raw`B = 0`}</M>. It
                  happened on 0 to 3 points per dataset here.
                </>
              ),
            },
          ]}
        />
      </div>

      <PrevNext
        prev={{
          label: "Multi-class: one-vs-one & one-vs-rest",
          href: "/learn/support-vector-machines/multi-class-one-vs-one-and-one-vs-rest",
        }}
        next={{
          label: "SVM vs logistic regression vs forest",
          href: "/learn/support-vector-machines/svm-vs-logistic-regression-vs-forest",
        }}
      />
    </article>
  );
}
