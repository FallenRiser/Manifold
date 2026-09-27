import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";
import { CodeOutput } from "@/components/CodeOutput";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { Quiz } from "@/components/Quiz";
import NoiseFeatureLab from "@/components/labs/NoiseFeatureLab";

const PINK = "var(--c-classification)";

export const metadata = {
  title: "Which model, on which data — Manifold",
  description:
    "An rbf SVM, logistic regression and a random forest on six real datasets, then three experiments that explain the results: useless features, a truth that really is a line, and more data.",
};

const outContest = `5-fold cross-validation, repeated with five different shuffles, the same folds for
all three models. Defaults throughout: page 16 found tuning an SVM on scaled data
buys a few thousandths, and a forest's defaults are famously hard to beat.

                      n    d    rbf SVM  log. reg.     forest   SVM vs forest, 5 repeats
  breast_cancer     569   30     0.9779     0.9807     0.9593   +0.0186, SVM ahead 5 of 5
  wine              178   13     0.9843     0.9776     0.9754   +0.0089, SVM ahead 5 of 5
  digits           1797   64     0.9815     0.9688     0.9771   +0.0045, SVM ahead 5 of 5
  titanic          1309   10     0.8066     0.7870     0.7895   +0.0171, SVM ahead 5 of 5
  moons             600    2     0.8897     0.8657     0.9000   -0.0103, SVM ahead 0 of 5
  covertype 4k     4000   54     0.7196     0.7181     0.7670   -0.0474, SVM ahead 0 of 5

  rbf SVM                best on 3: wine, digits, titanic
  logistic regression    best on 1: breast_cancer
  random forest          best on 2: moons, covertype 4k

No model wins everywhere, and the margins are small: the SVM and the forest are
never more than 4.7 points apart. But they are not noise. On 6 of 6 datasets
one of the two was ahead on all five repeats. Each dataset has a winner; there is no
winner across datasets. The rest of this page is about telling in advance which
kind of dataset you have.`;

const outNoise = `Moons again, 600 points, and next to the two real features k columns of pure noise.
Standardised, so every column has the same say in a distance. 5-fold, the noise
redrawn for each of three repeats. 'tuned SVM' searches C and gamma inside every
training fold (3-fold inner search over the 7 x 7 grid of page 16):

     k   real share    rbf SVM  tuned SVM  log. reg.     forest
     0        1.000     0.8883     0.8956     0.8650     0.9017
     2        0.500     0.8717     0.8711     0.8583     0.8983
     5        0.286     0.8594     0.8583     0.8589     0.8878
    10        0.167     0.8467     0.8572     0.8606     0.8828
    20        0.091     0.8361     0.8406     0.8372     0.8861

'real share' is page 15's number: the share of the average squared distance that
the two real features still carry once every column is standardised. At k = 5 it is
under a third, and the rbf SVM has lost 2.9 points; the forest has lost 1.4.
A kernel measures similarity with every feature at once and has no way to ignore one.
A tree picks one feature per split, and a noise column rarely wins a split.

Tuning does not rescue it. With noise present, searching C and gamma moves the SVM by
between -0.0011 and +0.0106, and the tuned SVM is still below the forest at every k.
No setting of the kernel can tell it which features to ignore. By k = 20 the default
SVM scores 0.8361 and logistic regression
0.8372: the curved boundary is worth -0.1 points over a straight line, against +2.3
with no noise at all.`;

const outLinear = `A boundary that is exactly a hyperplane in the first five features, plus label noise.
Every feature beyond the fifth is irrelevant, so d = 5 is a pure linear problem and
d = 500 is the same problem buried in 495 useless columns. 5-fold, 3 repeats:

       n     d linear SVM  log. reg.    rbf SVM     forest  best linear -
                                                                   forest
     200     5     0.8567     0.8417     0.8700     0.8333        +0.0233
     200    20     0.8033     0.7917     0.8017     0.7900        +0.0133
     200   100     0.7067     0.7233     0.6967     0.7833        -0.0600
     200   500     0.6100     0.5850     0.6383     0.6333        -0.0233
    1000     5     0.7850     0.7720     0.7853     0.7617        +0.0233
    1000    20     0.8180     0.8013     0.8143     0.8020        +0.0160
    1000   100     0.8017     0.8067     0.8100     0.8023        +0.0043
    1000   500     0.6730     0.6977     0.6863     0.7477        -0.0500

With every feature relevant, the shape is right for the linear models and they lead
the forest by 2.3 points at both sizes -- a real edge, and a small one. Bury the
same line in 495 useless columns and the forest beats both linear models by 2.3 to 5.0
points instead. On this data the useless features decide more than the shape of
the truth does: a linear model spreads weight across every column it is given,
while a forest picks its splits.

The rbf SVM never trails the linear SVM by more than 0.0100. On a truth that is a line,
the kernel costs almost nothing -- which is the flip side of page 13's point that an
rbf kernel with a wide reach is nearly linear.`;

const outGrowth = `Covertype was the forest's biggest win. Is that its 44 binary soil and wilderness
columns, which are zero 95% of the time? Refit on the 10 numeric columns alone
(the same 4,000 rows, 5-fold, 3 repeats):

                            rbf SVM  log. reg.     forest  forest lead
  all 54 columns             0.7182     0.7166     0.7653      +0.0471
  10 numeric columns         0.7050     0.6957     0.7464      +0.0414

Not the binary columns: the forest leads without them too. What the forest does
have is room to grow. The two commonest forest types, a fixed test set of 5,000,
and training sets from 500 to 16,000 points:

        n    rbf SVM  log. reg.     forest          SVs   SV share         SVM work
      500     0.7544     0.7672     0.7714          358      0.716          219,000
     1000     0.7646     0.7766     0.7896          668      0.668          790,000
     2000     0.7832     0.7778     0.8066        1,225      0.613        2,674,000
     4000     0.7954     0.7822     0.8266        2,285      0.571        9,088,000
     8000     0.8020     0.7864     0.8456        4,349      0.544       35,672,000
    16000     0.8050     0.7860     0.8718        8,133      0.508      120,368,000

From 500 to 16,000 points the forest gains 10.0 points and the SVM 5.1. Even at
16,000 the SVM keeps 51% of its training points as support vectors, so the model it
has to evaluate for every prediction grows in step with the data -- 8,133 points at
the end -- and its solver work (iterations x points) grows 550-fold for a 32-fold
increase in data. On overlapping classes most points end up inside or on the
margin, which is exactly what makes them support vectors. Logistic regression stops
improving early, 0.7778 at 2,000 points and 0.7860 at 16,000. A line is a line however
much data you give it.`;

export default function Page() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: PINK }, { label: "Core", color: "var(--c-fundamentals)" }]}
        time="about 15 minutes"
        title={<>Which model, on which data</>}
        intro={<>Most tabular classification problems end up as a choice between three models: a
          kernel SVM, logistic regression and a random forest. This page runs all three on six
          datasets, then takes apart the results with three experiments, one for each thing that
          decided who won.</>}
        titleSize={42}
      />

      <div className="lesson">
        <p>
          The three bring different shapes to a problem. Logistic regression draws one straight
          boundary. An rbf SVM draws a curved one, built from similarities to its support vectors,
          as the last few pages have shown. A random forest averages hundreds of trees, each of
          which cuts the space into boxes one feature at a time. None of those shapes is best in
          general. The question is which one suits the data in front of you.
        </p>

        <h2>Six datasets, three models</h2>

        <p>
          All three at their defaults, with scaling where it matters (page 15) and the same folds
          for every model, so each comparison is paired:
        </p>

        <CodeOutput source="scripts/svm_cases.py">{outContest}</CodeOutput>

        <p>
          The SVM is best on three datasets, logistic regression on one and the forest on two.
          The gaps are small, never more than <strong>4.7 points</strong> between the SVM and the
          forest, but they are not noise. On every dataset one of the two was ahead on all five
          repeats. So each dataset has a clear winner, and there is no winner across datasets.
          The useful question is what makes a dataset go one way or the other.
        </p>

        <h2>Features that carry nothing</h2>

        <p>
          The first suspect is useless features. Page 15 showed that an rbf kernel measures
          similarity with every feature at once: after standardising, each column gets the same
          say in the distance, whether or not it has anything to do with the label. A tree does
          something different. It picks one feature per split, and a column of noise rarely wins
          a split.
        </p>

        <PredictPrompt
          prompt="Moons: two real features, where the SVM and the forest start out tied. Add five columns of pure noise. What happens to the SVM compared with the forest?"
          options={[
            "Nothing much to either — five columns is not many",
            "Both drop about the same amount",
            "The SVM drops much more than the forest",
            "The forest drops more, because it has fewer real features to split on",
          ]}
          accent="var(--c-classification)"
          nudge="After standardising, how much of each distance do the two real features still carry with five noise columns beside them?"
        />

        <LabFrame
          accent={PINK}
          tryThis={<>Step the dial from 0 to 50 noise columns and watch the three lines. Then pick
            each model under the picture and step through again: the picture shows the boundary
            on the two real features, and the noise columns are the dimensions it cannot show.</>}
          insight={<>With no noise the SVM and the forest are level, <strong>0.9675</strong> and{" "}
            <strong>0.9700</strong>, and logistic regression, a straight line on curved data,
            trails at 0.8575. Five noise columns later the SVM has lost <strong>13 points</strong>{" "}
            and, at 0.8375, is <em>below</em> the straight line (0.8550). The forest has lost
            about 5. Watch the SVM&apos;s picture as you go: the moon shape washes out into
            something close to a line, because the two real features now carry only 2/7 of every
            distance the kernel measures.</>}
        >
          <NoiseFeatureLab />
        </LabFrame>

        <p>
          The same experiment with cross-validation, and with a tuned SVM as well, since the
          obvious objection is that <M>{String.raw`\gamma`}</M> should be re-chosen for every{" "}
          <M>{String.raw`k`}</M>:
        </p>

        <CodeOutput source="scripts/svm_cases.py">{outNoise}</CodeOutput>

        <p>
          Tuning does not rescue it. No value of <M>{String.raw`C`}</M> or{" "}
          <M>{String.raw`\gamma`}</M> tells the kernel which features to ignore, so the SVM loses
          at least twice what the forest loses at every step, and by 20 noise columns its curved
          boundary is worth nothing over logistic regression&apos;s straight one.
        </p>

        <h2>When the truth is a line</h2>

        <p>
          The second suspect is the shape of the boundary. If the truth really is a hyperplane, the
          linear models have exactly the right shape and the forest has to build a slanted plane
          from axis-aligned steps. How much does that matter?
        </p>

        <CodeOutput source="scripts/svm_cases.py">{outLinear}</CodeOutput>

        <p>
          Less than you might expect. With every feature relevant, the linear models lead the
          forest by <strong>2.3 points</strong>. Bury the same line among useless columns and the
          forest beats both linear models by <strong>2.3 to 5.0 points</strong>, on a problem
          whose true boundary is a straight line. On this data, the useless features decide more
          than the shape of the truth.
        </p>

        <p>
          The other result in that table matters for choosing. The rbf SVM never trails the linear
          SVM by more than 0.01, even here. Choosing the rbf kernel when the truth turns out to be
          a line costs almost nothing, because a wide rbf kernel is nearly linear. Choosing a line
          when the truth is curved cost 2.3 points on plain moons.
        </p>

        <h2>More data</h2>

        <p>
          Useless features do not explain every result, though. Covertype was the forest&apos;s
          biggest win, and 44 of its 54 columns are binary indicators that are almost always zero,
          which looks like exactly the situation above. It is not:
        </p>

        <CodeOutput source="scripts/svm_cases.py">{outGrowth}</CodeOutput>

        <p>
          Without those columns the forest still leads by 4.1 points, so something else is going
          on. The second table shows what it is. Going from 500 to 16,000 training points, the forest gains <strong>10.0 points</strong>{" "}
          and the SVM <strong>5.1</strong>. Logistic regression is flat after 2,000 points,
          because a line is a line however much data you give it. The SVM&apos;s cost is the
          other story. On overlapping classes most points land inside the margin, so even at
          16,000 points about half of them are support vectors. Every prediction has to compare
          against <strong>8,133</strong> of them, and the solver work grew{" "}
          <strong>550-fold</strong> for 32 times the data.
        </p>

        <Callout color={PINK} title="What each result points to">
          <p>
            The experiments point to three questions to ask of a dataset before choosing. How
            many of its columns carry nothing? Every useless column costs the SVM more than the
            forest. How many rows does it have? The forest kept improving to 16,000 points, while
            the SVM improved more slowly and grew more expensive. And is a line already enough?
            If so, logistic regression is as accurate, far cheaper, and its probabilities need no
            fixing (page 18). Page 20 turns these into a checklist.
          </p>
        </Callout>

        <Quiz
          questions={[
            {
              q: <>Across the six datasets, which model was best?</>,
              options: [
                "The rbf SVM, on all of them",
                "The random forest, on all of them",
                "Each dataset had a clear winner, but no model won everywhere: the SVM on three, the forest on two, logistic regression on one",
                "They were all within noise of each other everywhere",
              ],
              answer: 2,
              explain: (
                <>
                  The SVM and the forest were never more than 4.7 points apart, but on every dataset
                  one of them was ahead on all five repeats. The winner depends on the data.
                </>
              ),
            },
            {
              q: <>Why do useless features hurt an rbf SVM more than a random forest?</>,
              options: [
                "The SVM overfits them with too many support vectors",
                "After standardising, every column gets the same say in the kernel's distance, so noise columns drown out the real ones; a tree picks one feature per split and rarely picks noise",
                "Random forests remove noisy features before training",
                "Useless features change the SVM's C",
              ],
              answer: 1,
              explain: (
                <>
                  With 5 noise columns the two real features carry 2/7 of every distance. Tuning{" "}
                  <M>{String.raw`C`}</M> and <M>{String.raw`\gamma`}</M> did not help, because neither
                  tells the kernel which features to ignore.
                </>
              ),
            },
            {
              q: <>The true boundary is a straight line in 5 features, with 495 irrelevant ones added. Who wins?</>,
              options: [
                "Logistic regression, because the shape is right",
                "The linear SVM",
                "The random forest, by 2.3 to 5.0 points",
                "All tie",
              ],
              answer: 2,
              explain: (
                <>
                  With every feature relevant the linear models led by 2.3 points. Buried among
                  useless columns the forest won, so the irrelevant features mattered more than the
                  shape of the truth.
                </>
              ),
            },
            {
              q: <>On covertype, going from 500 to 16,000 training points, what happened to the SVM?</>,
              options: [
                "It overtook the forest",
                "It gained 5.1 points while about half the training set stayed support vectors, and its solver work grew 550-fold",
                "Its support vector count stayed constant",
                "It stopped improving after 2,000 points, like logistic regression",
              ],
              answer: 1,
              explain: (
                <>
                  8,133 support vectors at 16,000 points means every prediction is compared with
                  8,133 training points. The forest gained 10.0 points over the same range.
                </>
              ),
            },
          ]}
        />
      </div>

      <PrevNext
        prev={{
          label: "Probabilities from an SVM",
          href: "/learn/support-vector-machines/probabilities-from-an-svm",
        }}
        next={{
          label: "When to use an SVM",
          href: "/learn/support-vector-machines/when-to-use-an-svm",
        }}
      />
    </article>
  );
}
