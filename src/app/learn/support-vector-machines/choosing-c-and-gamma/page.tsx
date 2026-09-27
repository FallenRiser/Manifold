import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeOutput } from "@/components/CodeOutput";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { Quiz } from "@/components/Quiz";
import CGridLab from "@/components/labs/CGridLab";

const PINK = "var(--c-classification)";

export const metadata = {
  title: "A plateau with cliffs — Manifold",
  description:
    "What the C × gamma grid actually looks like, what tuning it honestly buys once features are scaled, why the best cell of a grid search always flatters itself, and how to choose from a flat top.",
};

const outGrid = `breast_cancer, standardised inside each fold, 5-fold accuracy at every pair. Rows are
C, columns are gamma, both a factor of ten apart:

  C | gamma  0.0001   0.001    0.01     0.1       1      10     100
      0.01  0.6274  0.6274  0.6274  0.6274  0.6274  0.6274  0.6274
       0.1  0.6274  0.7909  0.9456  0.9438  0.6274  0.6274  0.6274
         1  0.7944  0.9455  0.9701  0.9596  0.6309  0.6274  0.6274
        10  0.9455  0.9754  0.9789  0.9490  0.6309  0.6274  0.6274
       100  0.9719  0.9807  0.9736  0.9508  0.6309  0.6274  0.6274
      1000  0.9789  0.9719  0.9631  0.9508  0.6309  0.6274  0.6274
     10000  0.9719  0.9596  0.9631  0.9508  0.6309  0.6274  0.6274

  best cell                                              0.9807
  always predicting the larger class                     0.6274
  cells within 0.01 of the best                            8 of 49
  cells no better than always predicting one class        26 of 49
  the defaults, C=1 and gamma='scale' (= 1/30 here)      0.9771

A plateau with cliffs. 8 cells are within a point of the best, and 26 are no better
than ignoring the features. The whole right-hand side is one cliff: gamma so large that
every point is similar only to itself, which no value of C repairs. The top row is
the other one: C so small that the margin is allowed to swallow everything.

Now read the best gamma in each row:

         C   best gamma   accuracy      #SV
      0.01           --     0.6274      424   (every gamma ties)
       0.1         0.01     0.9456      236
         1         0.01     0.9701      111
        10         0.01     0.9789       64
       100        0.001     0.9807       52
      1000       0.0001     0.9789       53
     10000       0.0001     0.9719       40

As C rises, the best gamma falls. The two are not independent knobs, they are two
ways of spending the same thing: a large gamma lets the boundary bend around single
points, a large C lets it insist on classifying them. Spend a lot of one and the best
move is to spend less of the other, which is why the good cells lie along a diagonal
rather than in a blob around one value of each.`;

const outBuys = `The fair comparison is not the grid's best score against the default's. The grid's
best score was chosen BECAUSE it was high on those folds. So: an outer 5-fold split,
and inside each outer training set a full grid search with its own 5-fold CV. The
tuned model is then scored on an outer fold it never saw. Five repeats, each with
fresh splits, on three datasets, all standardised inside the fold:

                   defaults      tuned  tuned-def      tuned won  grid said
  moons              0.9005     0.9020    +0.0015         3 of 5     0.9075
  breast_cancer      0.9747     0.9765    +0.0018         4 of 5     0.9793
  wine               0.9876     0.9842    -0.0034         0 of 5     0.9910

'grid said' is the best score GridSearchCV reports on the outer folds -- the number
people usually quote. It is above the honestly-tested tuned model on every dataset, by
0.0028 to 0.0068.

On standardised data the defaults are already on the plateau. The honest gain from a
49-cell search is between -0.0034 and +0.0018 -- smaller than the amount the grid
flatters itself by, and on wine the defaults won every repeat. That is not an argument
against tuning. It is an argument for knowing what the search is for. Section 58
found 26 of 49 cells on breast_cancer no better than guessing, and a search is
insurance against landing on one. What it cannot be trusted with is telling you how
well it did.`;

const outCurse = `Take breast_cancer's 30 features and throw the labels away: replace them with coin
flips. There is now nothing to find. Run the same 49-cell search anyway:

    seed   larger class  median cell    grid best       nested
       0         0.5185       0.5185       0.5447       0.5358
       1         0.5132       0.5132       0.5132       0.4867
       2         0.5079       0.5079       0.5343       0.4992
       3         0.5325       0.5325       0.5659       0.5325
       4         0.5149       0.5149       0.5379       0.5010
    mean         0.5174       0.5174       0.5392       0.5111

The typical cell scores exactly what always guessing the larger class scores, which
is the truth. The BEST cell beats it by 0.0218 on average -- a finding, reported with
four decimals, in data with nothing in it. Nothing went wrong. 49 noisy estimates were
made and the largest was kept, and the largest of 49 noisy numbers is above their
centre. The nested estimate, which tests the winner on data the search never touched,
comes back at 0.5111: chance, or a little under.

The same thing happens on real data, only it is hidden inside a real signal. It is
why 'grid said' in the previous table was too high every time.`;

const outFlat = `If a dozen cells are within noise of the best, picking the single highest one is
picking noise. An alternative: take every cell within one standard error of the best,
and of those keep the model with the fewest support vectors. Tested the honest way,
outer 5-fold with the search inside, five repeats:

                    best cell     simplest   #SV best #SV simplest
  moons                0.9020       0.9045      109.8         80.7
  breast_cancer        0.9765       0.9701       52.5         39.3
  wine                 0.9842       0.9797       67.9         47.0

25% to 31% fewer support vectors, and accuracy that moves by between -0.0063 and
+0.0025. Fewer support vectors is a faster model to run, and when the scores cannot tell
the candidates apart, the simpler boundary is the one with less room to have fitted
noise. Whether the trade is worth it depends on what the model is for; the table puts
a price on it.

The grid is also not equally expensive everywhere. libsvm's own iteration count at
every cell, breast_cancer standardised:

  C | gamma   0.0001    0.001     0.01      0.1        1       10      100
      0.01      217      220      219      231      557      647      647
       0.1      219      207      138      200      728      828      828
         1      206      122      115      420      977      872      856
        10      136      170      461      561     1010     1599     1599
       100      127      329      852      544     1010     1599     1599
      1000      483     1555     1219      544     1010     1599     1599
     10000     2439     6390     1219      544     1010     1599     1599

The dearest cell, C=10000 and gamma=0.001, takes 6,390 iterations; the cheapest takes 115.
Large C with small gamma is the slow corner: a nearly linear kernel on data a line
cannot separate, and a penalty so high the solver has to fight for every point. It
holds good cells too -- the diagonal runs through it -- so the point is not to avoid
it, only to know where the time in a grid search goes.`;

export default function Page() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: PINK }, { label: "Core", color: "var(--c-fundamentals)" }]}
        time="about 16 minutes"
        title={<>A plateau with cliffs</>}
        intro={<>An rbf SVM has two numbers you choose before it sees any data. The usual advice
          is to search a grid of them. This page looks at the whole grid instead of just its
          winner. It turns out to be mostly a flat plateau with cliffs on two sides, and the
          winner&apos;s score is a number you should not believe.</>}
        titleSize={42}
      />

      <div className="lesson">
        <p>
          Both knobs have already appeared on this track, separately. <M>{String.raw`C`}</M> is
          the cap on every price from page 5 onward, and <M>{String.raw`\gamma`}</M> is the length
          scale of page 13. In the decision function they sit in different places:
        </p>

        <MathBlock>{String.raw`\begin{gathered}
f(x) \;=\; \sum_i \alpha_i\, y_i\, e^{-\gamma \lVert x - x_i\rVert^2} \;+\; b \\[6pt]
0 \le \alpha_i \le C
\end{gathered}`}</MathBlock>

        <p>
          <M>{String.raw`\gamma`}</M> decides how far each training point&apos;s influence reaches.{" "}
          <M>{String.raw`C`}</M> decides how loudly any single point is allowed to shout. Both
          are ways of letting the boundary take individual points more seriously, which is why
          the interesting thing is not either knob but how they behave together.
        </p>

        <h2>What the grid looks like</h2>

        <p>
          Standardised breast_cancer again, as page 15 insisted, and every combination of seven
          values of each, a factor of ten apart. Factors of ten because both knobs act
          multiplicatively: <M>{String.raw`\gamma`}</M> multiplies a squared distance, and
          doubling <M>{String.raw`C`}</M> means the same thing at 0.1 as at 1000.
        </p>

        <CodeOutput source="scripts/svm_cases.py">{outGrid}</CodeOutput>

        <p>
          Eight cells are within a point of the best, and <strong>26 of 49</strong> are no better
          than ignoring the features and always guessing the larger class. The right-hand columns
          are one cliff: at <M>{String.raw`\gamma \ge 1`}</M> each point is similar only to itself
          and nothing about <M>{String.raw`C`}</M> can undo that. The top row is the other: at{" "}
          <M>{String.raw`C = 0.01`}</M> the margin is allowed to swallow every point and every{" "}
          <M>{String.raw`\gamma`}</M> ties.
        </p>

        <p>
          The second table is the more useful one. As <M>{String.raw`C`}</M> goes up, the best{" "}
          <M>{String.raw`\gamma`}</M> goes down. Spend more on one way of fitting individual points
          and the best move is to spend less on the other, so the good cells run along a diagonal
          rather than sitting in a blob around one value of each.
        </p>

        <PredictPrompt
          prompt="In the lab below, the grid is coloured by accuracy on 200 new points. Before you flip it to training accuracy: which cells will look BEST when coloured by how well each model fits its own 80 training points?"
          options={[
            "The same cells that do best on new points",
            "The top-left corner — small C and small gamma",
            "The right-hand columns — large gamma",
            "They will all look about the same",
          ]}
          accent="var(--c-classification)"
          nudge="Think about what a model with a tiny length scale can do to 80 points it is allowed to see."
        />

        <LabFrame
          accent={PINK}
          tryThis={<>Every cell is a separate SVM, fitted in your browser. Click around the grid and
            watch the boundary on the right. Then switch the colouring to{" "}
            <em>training</em> and compare the two maps, especially the last two columns.</>}
          insight={<>Coloured by training accuracy, the right-hand side is the best-looking part of
            the grid: <strong>16</strong> cells fit their 80 points perfectly. Coloured by new points,
            those same columns are the worst, down to <strong>0.565</strong> — barely better than a
            coin. The best cell on new points, <M>{String.raw`C = 1,\ \gamma = 1`}</M>, gets{" "}
            <strong>0.94</strong> while still misclassifying some of its own training points.
            Training accuracy does not just fail to find the best cell; on this grid it points
            straight at the worst ones.</>}
        >
          <CGridLab />
        </LabFrame>

        <h2>What tuning actually buys</h2>

        <p>
          The obvious way to measure the value of a search is to compare the grid&apos;s best score
          with the default&apos;s. That comparison is rigged, because the grid&apos;s best was{" "}
          <em>chosen</em> for being high on exactly those folds. The fair version is nested: search
          inside each training split, then score the winner on a fold the search never touched.
        </p>

        <CodeOutput source="scripts/svm_cases.py">{outBuys}</CodeOutput>

        <p>
          On standardised data the defaults, <M>{String.raw`C = 1`}</M> and{" "}
          <code>gamma=&apos;scale&apos;</code>, are already on the plateau. Honestly measured, a
          49-cell search gains <strong>+0.0018</strong> at best and loses{" "}
          <strong>0.0034</strong> at worst, and on wine the defaults beat the tuned model on every
          one of five repeats. Meanwhile the number a grid search reports about itself is higher
          than what the tuned model really scores, on every dataset, by more than tuning gained.
        </p>

        <Callout color={PINK} title="Tuning is insurance, not a bonus">
          <p>
            None of this says do not search. More than half of the breast_cancer grid is a cliff,
            and a search is how you know you are not standing on one — which matters most when you
            have not standardised, or when your data is nothing like these three. What the
            measurement does say is that on scaled data you should expect the search to confirm the
            defaults more often than to beat them, and that the score it hands back is not an
            estimate of anything.
          </p>
        </Callout>

        <h2>The best cell is flattered</h2>

        <p>
          Why would the grid&apos;s own score be too high every time? The cleanest way to see it is
          to give the search nothing to find.
        </p>

        <CodeOutput source="scripts/svm_cases.py">{outCurse}</CodeOutput>

        <p>
          With coin flips for labels, the median cell scores exactly what guessing the larger class
          scores, which is the truth. The best cell beats it by <strong>0.0218</strong> on average,
          reported to four decimals, in data with nothing in it. Nothing is broken. Forty-nine noisy
          estimates were made and the largest was kept, and the largest of many noisy numbers sits
          above their centre. That is the whole winner&apos;s curse, and it does not go away on real
          data; it just hides inside a real signal, where it is harder to see and exactly as large.
        </p>

        <p>
          The nested estimate comes back at <strong>0.5111</strong>, chance or a hair under, because
          it scores the winner on points that played no part in picking it. That is the only kind of
          number from a tuned model worth quoting.
        </p>

        <h2>Choosing from a flat top</h2>

        <p>
          If a handful of cells are within noise of each other, picking the single highest one is
          picking noise. A common alternative: take every cell within one standard error of the
          best, and of those keep the simplest model. For an SVM, &ldquo;simplest&rdquo; has a
          concrete meaning — the fewest support vectors, which is also the cheapest model to run.
        </p>

        <CodeOutput source="scripts/svm_cases.py">{outFlat}</CodeOutput>

        <p>
          The simplest-within-noise rule keeps <strong>25% to 31%</strong> fewer support vectors,
          and accuracy moves by between <strong>−0.0063</strong> and <strong>+0.0025</strong>. That
          is a real trade rather than a free lunch, and the table puts a price on it; whether a
          third fewer support vectors is worth half a point depends on what the model is for.
        </p>

        <p>
          The second table is about the other cost, time. The cheapest cell takes{" "}
          <strong>115</strong> iterations and the dearest <strong>6,390</strong>, and the slow ones
          cluster at large <M>{String.raw`C`}</M> with small <M>{String.raw`\gamma`}</M>: a kernel so
          wide it is nearly linear, on data a line cannot separate, with a penalty that makes the
          solver fight for every point. The lab drops its <M>{String.raw`C = 10000`}</M> row for the
          same reason — its smallest-<M>{String.raw`\gamma`}</M> cell alone takes the SMO from page
          14 about 1.4 million steps.
        </p>

        <h2>Where this leaves you</h2>

        <p>
          Scale first, then start from the defaults, and search a log-spaced grid mainly to confirm
          you are on the plateau. Read the grid as a map rather than a leaderboard: the diagonal
          tells you <M>{String.raw`C`}</M> and <M>{String.raw`\gamma`}</M> trade against each other,
          the cliffs tell you where not to be, and the flat top tells you the ranking inside it is
          mostly noise. Quote a nested score, never the grid&apos;s own.
        </p>

        <p>
          Everything so far has had two classes. Page 17 is about what an SVM does when there are
          more, where the two standard answers build very different numbers of models out of the
          same binary machine.
        </p>

        <Quiz
          questions={[
            {
              q: <>Why are C and gamma searched on a log scale?</>,
              options: [
                "Because sklearn requires it",
                "Both act multiplicatively, so a factor of ten means roughly the same change anywhere on the range",
                "Because small values are more likely to be optimal",
                "To make the grid search run faster",
              ],
              answer: 1,
              explain: (
                <>
                  <M>{String.raw`\gamma`}</M> multiplies a squared distance and{" "}
                  <M>{String.raw`C`}</M> caps a price, so what matters is the ratio between values,
                  not the difference. A linear grid would spend most of its cells on one end.
                </>
              ),
            },
            {
              q: <>On the breast_cancer grid, the best gamma falls as C rises. Why?</>,
              options: [
                "Large C makes the kernel matrix singular",
                "Both knobs let the boundary take individual points more seriously, so spending more of one calls for less of the other",
                "It is a coincidence of this dataset",
                "sklearn rescales gamma when C changes",
              ],
              answer: 1,
              explain: (
                <>
                  A large <M>{String.raw`\gamma`}</M> lets the boundary bend around single points; a
                  large <M>{String.raw`C`}</M> lets it insist on classifying them. The good cells lie
                  along a diagonal, from <M>{String.raw`\gamma = 0.01`}</M> at{" "}
                  <M>{String.raw`C = 1`}</M> to <M>{String.raw`\gamma = 0.0001`}</M> at{" "}
                  <M>{String.raw`C = 1000`}</M>.
                </>
              ),
            },
            {
              q: <>A grid search on coin-flip labels reports a best score above the majority-class rate. What happened?</>,
              options: [
                "The features leak the labels",
                "The SVM found a real pattern by chance",
                "The largest of many noisy estimates sits above their centre, so the winner's score is biased upward",
                "Cross-validation was implemented incorrectly",
              ],
              answer: 2,
              explain: (
                <>
                  The median cell scored exactly the majority rate. The best of 49 was 0.0218 above
                  it on average, and the nested estimate — which scores the winner on untouched
                  data — came back at 0.5111, chance.
                </>
              ),
            },
            {
              q: <>What is the fair way to report how well a tuned SVM will do?</>,
              options: [
                "The best_score_ that GridSearchCV reports",
                "The training accuracy of the best cell",
                "A nested estimate: search inside each training split, score on an outer fold the search never saw",
                "The average score over the whole grid",
              ],
              answer: 2,
              explain: (
                <>
                  best_score_ was selected for being high, so it is too high: on all three datasets
                  here it overstated the honestly-tested model by 0.0028 to 0.0068 — more than the
                  search itself gained.
                </>
              ),
            },
          ]}
        />
      </div>

      <PrevNext
        prev={{
          label: "Scaling, and why an SVM can't skip it",
          href: "/learn/support-vector-machines/scaling-and-why-an-svm-cannot-skip-it",
        }}
        next={{
          label: "Multi-class: one-vs-one & one-vs-rest",
          href: "/learn/support-vector-machines/multi-class-one-vs-one-and-one-vs-rest",
        }}
      />
    </article>
  );
}
