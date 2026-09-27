import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeOutput } from "@/components/CodeOutput";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { Quiz } from "@/components/Quiz";
import UnitsDialLab from "@/components/labs/UnitsDialLab";

const PINK = "var(--c-classification)";

export const metadata = {
  title: "A distance has units — Manifold",
  description:
    "An rbf SVM sees nothing but squared distances, and a squared distance is a sum over features weighted by the units each one was recorded in. Change the units and you change the model. Why scaling is not optional for an SVM, which scaler, and which models never needed it.",
};

const outUnits = `The rbf kernel only ever sees |x - z|^2, and a squared distance is a SUM over the
features. Average it over every pair of training points and the sum splits cleanly:

  mean |x - z|^2 over all 398 x 398 pairs            938273.9
  2 x (sum of the 30 feature variances)              938273.9

So each feature's share of every distance the model computes is its variance over the
total -- fixed by the units it was recorded in, before any model is fitted:

  feature (breast_cancer)     std deviation        share
  worst area                       576.9036     70.9426%
  mean area                        363.4432     28.1562%
  area error                        48.4838      0.5011%
  worst perimeter                   34.0380      0.2470%
  ... 25 more ...
  fractal dimension error          0.002315    1.14e-09%

  the two area features together: 99.10% of every squared distance

A model built from distances inherits that split. Fit the default rbf SVM on the raw
numbers, then on ONLY the largest feature, and compare:

                                             test acc
  rbf, all 30 features, raw units              0.9064
  rbf, 'worst area' alone, raw units           0.8947
  rbf, all 30 features, standardised           0.9532

  the 30-feature model and the 1-feature model give the same label on 97.66% of
  the test set

Thirty features went in and the model behaves, to within 4 test points, like a model
of one. Nothing was wrong with the other twenty-nine; they were recorded in smaller
units, so they barely register in the only quantity the kernel looks at.

Wine is the same story, harder. 'proline' is 99.77% of every squared distance, and 10-fold
accuracy goes from 0.6627 on the raw numbers to 0.9830 once every feature is put on one
scale.`;

const outDial = `Take the two moons, already standardised, and change nothing about them except the
units of the horizontal feature: multiply it by k. Metres to millimetres is k = 1000.
The points are the same points; the labels are the same labels. 20 draws of 400
points, half held out, the default rbf SVM (C=1, gamma='scale') every time:

         k share of |x-z|^2  mean test      worst beats standardised
      0.01        0.0001     0.8238     0.7650             0 of 20
       0.1        0.0099     0.8525     0.8050             0 of 20
       0.3        0.0826     0.8735     0.8300             0 of 20
         1        0.5000     0.9367     0.8900             2 of 20
         3        0.9000     0.9465     0.9050            18 of 20
        10        0.9901     0.9307     0.8700             6 of 20
        30        0.9989     0.7420     0.6750             0 of 20
       100        0.9999     0.7010     0.6450             0 of 20
       std        0.5000     0.9370     0.8950

Shrink the horizontal units and the kernel stops seeing the horizontal direction,
so the model can only split the moons by height; grow them and it can only see
left-and-right. On the same data, the narrow end costs 11 points in 100 of test
accuracy and the wide end costs 24.
gamma='scale' does not rescue it: it divides by the variance of ALL the numbers at
once, which fixes the overall size of the distances and leaves their ratio alone.

Standardise first and k stops mattering at all. Over all 160 fits (8 values of k,
20 draws), the standardised model gave the same label to every held-out point as the
'std' row on 160 of them: the scaler divides the multiplication back out before the
kernel ever sees it.

But look at k = 3: it beats the standardised model on 18 draws of 20. Standardising
does not find the BEST units. It finds units nobody chose on purpose -- not whoever
recorded the data -- so every feature starts with the same say and the model, not
the spreadsheet, decides what matters.`;

const outPenalty = `No kernel here, so no distances between points -- but the objective still has a norm
in it. Multiply feature j by k and the same boundary needs w_j / k in place of w_j,
so its share of (1/2)|w|^2 becomes (1/2) w_j^2 / k^2. Changing a feature's units IS
changing how much the SVM is charged for using it.

The feature the linear SVM leans on hardest is 'worst fractal dimension'.
Shrink its units and watch what it is worth to the model -- its weight times its
(new) standard deviation, the change in f from moving one standard deviation along it:

         k   charge x 1/k^2  effect per sd     test acc
         1                1        -1.0479       0.9532
       0.3               11        -0.2072       0.9591
       0.1              100        -0.0242       0.9532
      0.03             1111        -0.0022       0.9591
      0.01            10000        -0.0002       0.9591
     0.001          1000000        -0.0000       0.9591

At k = 0.01 the feature is worth 1/4,304 of what it was, and nothing told the model to
drop it. Test accuracy moves by 1 test point and no more, because breast_cancer
has thirty features and many of them say the same thing. The point is not that it
cost accuracy here. It is that a choice about units quietly made a modelling
decision, and nothing in the output says so.

The units also decide whether the solver finishes. Raw breast_cancer, every fit
capped at 2,000,000 iterations:

                               iterations     capped   test acc
  linear, raw                   2,000,000       True     0.9415
  linear, standardised                903      False     0.9532
  rbf, raw                             82      False     0.9064
  rbf, standardised                   164      False     0.9532

The linear fit on raw numbers does not converge: it stops because it ran out of
iterations, with a warning that is easy to scroll past. Standardised, it finishes in
903. And read the rbf rows the other way: on raw numbers it takes 82 iterations
against 164, and scores worse. It is quick because the problem it is solving is
nearly one-dimensional: it is the one-feature model from the start of the page.
Finishing fast is not evidence of finishing right.`;

const outScaler = `Three common ways to put features on one scale: subtract the mean and divide by the
standard deviation (Standard), squash into [0, 1] (MinMax), or subtract the median and
divide by the interquartile range (Robust). 10-fold accuracy, rbf SVM, scaler fitted
inside each fold:

                    breast_cancer                 wine
  none           0.9210 +- 0.0370     0.6627 +- 0.0668
  Standard       0.9754 +- 0.0141     0.9830 +- 0.0260
  MinMax         0.9771 +- 0.0113     0.9889 +- 0.0222
  Robust         0.9737 +- 0.0162     0.9775 +- 0.0276

  breast_cancer  best scaler minus worst 0.0035, smallest fold spread 0.0113
  wine           best scaler minus worst 0.0114, smallest fold spread 0.0222

On both datasets the gap between the best scaler and the worst is smaller than the
fold-to-fold spread of any of them. The choice that matters is doing it at all.
Robust exists for data where a handful of extreme values would otherwise set the
scale for everyone; a median and an interquartile range do not move when they do.

Where the scaler is fitted is a separate question. Fit it on all the data before
cross-validating and each fold's held-out points have leaked their mean and spread
into the training side:

  scaler fitted on everything, then CV         0.9736
  scaler fitted inside each fold               0.9754

Here it makes no difference worth the name -- a mean and a spread are weak
information about 57 held-out points. Fit it inside the pipeline anyway. It costs
nothing, and it is the only version that matches what the model would really have
known at training time.

And some models never needed any of this. A tree splits one feature at a time on a
threshold, and an increasing change of units moves the threshold with the data:

  random forest, raw vs ...               same labels     max |dp|
  ... standardised                            171/171    1.000e-02
  ... every feature x 1024                    171/171    0.000e+00

Every label is the same. Standardising moves the probability at 2 of 171 test points,
by at most one tree's vote in 100, because subtracting a mean and dividing is not
exact in floating point, and a split threshold can land one rounding error to the
other side of a point.
Multiply by 1024 -- a power of two, which floating point does exactly -- and the
forest is identical to the last bit. That is the contrast the page is about: a tree
compares a feature with itself, and an SVM compares features with each other.`;

export default function Page() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: PINK }, { label: "Core", color: "var(--c-fundamentals)" }]}
        time="about 15 minutes"
        title={<>A distance has units</>}
        intro={<>Every SVM on this track so far was handed features already on one scale, and it
          was never said why. This page is the why. The kernel compares points by distance, a
          distance adds up the features in whatever units they arrived in, and so whoever
          filled in the spreadsheet has been quietly choosing your model.</>}
        titleSize={42}
      />

      <div className="lesson">
        <p>
          Page 13 ended on a warning: the same moons in larger units, and three polynomial fits out
          of three ran to a two-million-iteration cap without finishing. That looked like a quirk
          of the polynomial kernel. It is not. It is the sharpest case of something every SVM does,
          including the rbf one that finished comfortably on the same data.
        </p>

        <h2>Where a distance comes from</h2>

        <p>
          The rbf kernel <M>{String.raw`\exp(-\gamma\lVert x - z\rVert^2)`}</M> never looks at a
          feature on its own. All it is ever handed is one number per pair of points, the squared
          distance, and that number is a sum with one term per feature. Average it over every pair
          in the training set and the sum comes apart cleanly:
        </p>

        <MathBlock>{String.raw`\begin{gathered}
\frac{1}{n^2}\sum_{a,b}\lVert x_a - x_b\rVert^2 \\[4pt]
=\; \sum_j \frac{1}{n^2}\sum_{a,b}\,(x_{aj} - x_{bj})^2 \\[4pt]
=\; 2\sum_j \operatorname{var}(x_j)
\end{gathered}`}</MathBlock>

        <p>
          So feature <M>{String.raw`j`}</M>&apos;s share of every distance the model will ever
          compute is its variance over the total. That is settled before any model is fitted, by
          nothing more than the units the feature was recorded in. On breast_cancer, raw:
        </p>

        <CodeOutput source="scripts/svm_cases.py">{outUnits}</CodeOutput>

        <p>
          Two of the thirty features carry <strong>99.10%</strong> of every squared distance,
          because an area runs into the thousands while a fractal dimension error is a few
          thousandths. Fit the default rbf SVM on all thirty and
          it gives the same label as a model of <em>worst area alone</em> on{" "}
          <strong>97.66%</strong> of the test set. Twenty-nine features went in and barely
          registered.
        </p>

        <Callout color={PINK} title="Nothing was wrong with the twenty-nine">
          <p>
            It is tempting to read that as the small features being useless. They are not: put every
            feature on one scale and the same model on the same data goes from 0.9064 to{" "}
            <strong>0.9532</strong>. On wine, where one feature is 99.77% of every distance, 10-fold
            accuracy goes from <strong>0.6627</strong> to <strong>0.9830</strong>. The information
            was there the whole time. The distance could not hear it.
          </p>
        </Callout>

        <h2>Change the units, change the model</h2>

        <p>
          Real datasets mix many features and many units, which makes it hard to see exactly what
          the units are doing. So take the two moons, where both features start on the same
          footing, and change one thing: the units of the horizontal feature. Metres to
          centimetres multiplies it by 100. The points do not move. The labels do not change.
        </p>

        <PredictPrompt
          prompt="The moons are fitted once with both features on one scale. Now the horizontal feature is re-recorded in units 100 times smaller, so its numbers are 100 times bigger, and the default rbf SVM is refitted. gamma='scale' adjusts itself to the new numbers. What happens to accuracy on new points?"
          options={[
            "Nothing — gamma='scale' compensates for the new units",
            "It goes up — the horizontal feature now has more resolution",
            "It drops noticeably",
            "It drops to a coin flip",
          ]}
          accent="var(--c-classification)"
          nudge="gamma='scale' is one number for all the features. Ask what one number can and cannot undo, then try it."
        />

        <LabFrame
          accent={PINK}
          tryThis={<>Start at <em>×1</em> and step the dial up to <em>×100</em>, watching the small
            panel: those are the same 80 points, in the numbers the kernel is handed, drawn with
            both axes on one scale. Then go down to <em>×0.01</em>. Then switch{" "}
            <em>standardise first</em> on and move the dial again.</>}
          insight={<>At <em>×1</em> the model gets <strong>0.9875</strong> of 80 new points right. At{" "}
            <em>×100</em> the horizontal feature is 99.99% of every distance, the vertical
            direction has stopped counting, and it falls to <strong>0.8125</strong>; at{" "}
            <em>×0.01</em> the opposite happens and it falls to <strong>0.7875</strong>. Same
            points, same labels, same algorithm. Standardise first and every stop on the dial gives
            the identical model — the scaler divides the multiplication back out before the
            kernel ever sees it.</>}
        >
          <UnitsDialLab />
        </LabFrame>

        <p>
          The lab is one draw of 80 points. The same experiment over twenty draws of 400, half of
          each held out:
        </p>

        <CodeOutput source="scripts/svm_cases.py">{outDial}</CodeOutput>

        <p>
          The narrow end of the dial costs <strong>11</strong> points in a hundred and the wide end
          costs <strong>24</strong>. <code>gamma=&apos;scale&apos;</code> does not help, because it
          is a single number computed from the variance of every value in the table at once: it can
          fix the overall size of the distances, and it can do nothing about their ratio.
        </p>

        <Callout color={PINK} title="Standardising is neutral, not optimal">
          <p>
            Look at <M>{String.raw`k = 3`}</M>: stretching the horizontal feature beats the
            standardised model on <strong>18 of 20</strong> draws. On this shape, weighting the
            horizontal a little more genuinely helps. Standardising does not
            find the best units, and nothing about it claims to. What it does is throw away units
            that nobody chose for a reason, so every feature starts with the same say and the fit,
            not the spreadsheet, decides what matters. If you want to go further than that, it is a
            modelling choice to tune, like <M>{String.raw`C`}</M> and <M>{String.raw`\gamma`}</M>,
            not a default to trust.
          </p>
        </Callout>

        <h2>The margin has units too</h2>

        <p>
          It would be convenient if this were only about kernels. It is not. A linear SVM computes no
          distances between points, but its objective has <M>{String.raw`\lVert w\rVert^2`}</M> in
          it, and a norm is just as unit-dependent. Multiply feature <M>{String.raw`j`}</M> by{" "}
          <M>{String.raw`k`}</M> and the same boundary needs a weight <M>{String.raw`k`}</M> times
          smaller on it:
        </p>

        <MathBlock>{String.raw`\begin{gathered}
x_j \;\to\; k\,x_j \quad\Longrightarrow\quad w_j \;\to\; \frac{w_j}{k} \\[6pt]
\tfrac{1}{2}\,w_j^2 \;\to\; \frac{1}{k^2}\cdot\tfrac{1}{2}\,w_j^2
\end{gathered}`}</MathBlock>

        <p>
          So shrinking a feature&apos;s units multiplies what the SVM is charged for using it by{" "}
          <M>{String.raw`1/k^2`}</M>. Changing units is changing the penalty, feature by feature,
          without anyone deciding to.
        </p>

        <CodeOutput source="scripts/svm_cases.py">{outPenalty}</CodeOutput>

        <p>
          By <M>{String.raw`k = 0.01`}</M> the feature the model leaned on hardest is worth{" "}
          <strong>1/4,304</strong> of what it was. Accuracy barely moves here, because breast_cancer
          has thirty features and plenty of them say the same thing, but that is luck about this
          dataset, not a property of the method. The decision to drop the feature was made by a
          unit, and nothing in the output says so.
        </p>

        <p>
          The second table is the one page 14 promised. On raw numbers the linear fit never
          converges: it stops at <strong>2,000,000</strong> iterations with a warning that is easy
          to scroll past. Standardised, it finishes in <strong>903</strong>. And the rbf rows are a
          warning in the other direction. On raw numbers the rbf fit finishes in <strong>82</strong>{" "}
          iterations against 164 — faster, and worse — because the problem it is solving is the
          nearly one-dimensional one from the top of the page. A solver finishing quickly tells you
          the problem was easy. It does not tell you it was the right problem.
        </p>

        <h2>Which scaler, and who does not care</h2>

        <p>
          There is more than one way to put features on one scale, and a real question about where
          the scaler should be fitted. And there are models for which none of this matters, which is
          the clearest way to see why it matters so much here.
        </p>

        <CodeOutput source="scripts/svm_cases.py">{outScaler}</CodeOutput>

        <p>
          On both datasets the best scaler and the worst are closer together than the fold-to-fold
          spread of any one of them. Which scaler is a detail. Scaling at all is not: skipping it
          costs <strong>5</strong> points on breast_cancer and <strong>32</strong> on wine.
        </p>

        <p>
          The forest is the contrast the page has been building to. A tree asks one feature at a
          time whether it is above a threshold, and any increasing change of units carries the
          threshold along with the data. Every label is unchanged, and multiplied by 1024 —
          which floating point does exactly — the forest is identical to the last bit. A tree
          compares a feature only with itself. An SVM, through a distance or through a norm,
          compares features with each other, and that comparison is meaningless until they share a
          unit.
        </p>

        <Callout color={PINK} title="Fit the scaler inside the pipeline">
          <p>
            Fitting the scaler on the whole dataset before cross-validating made no difference worth
            the name here, 0.9736 against 0.9754: a mean and a spread are weak information about the
            held-out fold. Put it inside the pipeline anyway, as{" "}
            <code>make_pipeline(StandardScaler(), SVC())</code>. It costs nothing, the numbers it
            produces are the ones the model could really have known at training time, and it means
            new data is scaled with the training set&apos;s mean and spread rather than its own.
          </p>
        </Callout>

        <h2>Where this leaves you</h2>

        <p>
          An SVM sees your data through one lens: a distance for the kernel, a norm for the margin.
          Both add up features, so both need the features to be in comparable units, and raw data
          almost never is. Left alone, the feature with the biggest numbers decides the model; on
          breast_cancer that turned thirty features into one.
        </p>

        <p>
          Standardising fixes that without claiming to be optimal. It hands every feature the same
          starting say, and then the model&apos;s own knobs do the rest. Page 16 is about those
          knobs, <M>{String.raw`C`}</M> and <M>{String.raw`\gamma`}</M> — and searching for
          them only means something once the features are scaled, because otherwise the best{" "}
          <M>{String.raw`\gamma`}</M> would be a fact about somebody&apos;s choice of units.
        </p>

        <Quiz
          questions={[
            {
              q: <>Why does a feature recorded in large units dominate an rbf SVM?</>,
              options: [
                "The solver gives larger features more iterations",
                "The kernel only sees squared distances, and each feature contributes in proportion to its variance",
                "Large values are more likely to become support vectors",
                "gamma='scale' is computed from the largest feature only",
              ],
              answer: 1,
              explain: (
                <>
                  Averaged over all pairs, <M>{String.raw`\lVert x - z\rVert^2`}</M> is exactly{" "}
                  <M>{String.raw`2\sum_j \operatorname{var}(x_j)`}</M>, so each feature&apos;s share
                  is its variance over the total. On breast_cancer two area features carry 99.10% of
                  it, and the 30-feature model agrees with the area-only model on 97.66% of the test
                  set.
                </>
              ),
            },
            {
              q: <>gamma=&apos;scale&apos; adapts to the data. Why doesn&apos;t it fix unscaled features?</>,
              options: [
                "It does fix them; the problem is only C",
                "It is one number for every feature, so it can rescale the distances overall but not change their ratio",
                "It only looks at the first feature",
                "It is computed after the model is fitted",
              ],
              answer: 1,
              explain: (
                <>
                  gamma=&apos;scale&apos; is <M>{String.raw`1/(d\cdot\operatorname{var}(X))`}</M>{" "}
                  over every value at once. Multiplying one feature by 100 makes it 99.99% of every
                  distance whatever single number you then multiply the distances by, and the moons
                  lose 24 points in 100.
                </>
              ),
            },
            {
              q: <>A linear SVM has no kernel. What does multiplying feature j by k do to it?</>,
              options: [
                "Nothing — a linear boundary is unit-free",
                "It multiplies the penalty on w_j by 1/k², so shrinking a feature's units makes it more expensive to use",
                "It multiplies C by k",
                "It changes which points are support vectors but not the boundary",
              ],
              answer: 1,
              explain: (
                <>
                  The same boundary needs <M>{String.raw`w_j/k`}</M>, so its term in{" "}
                  <M>{String.raw`\tfrac12\lVert w\rVert^2`}</M> becomes{" "}
                  <M>{String.raw`\tfrac12 w_j^2/k^2`}</M>. At <M>{String.raw`k=0.01`}</M> the
                  breast_cancer feature the model relied on most was worth 1/4,304 of what it had
                  been.
                </>
              ),
            },
            {
              q: <>Which of these models gives the same predictions whether or not you standardise?</>,
              options: [
                "An rbf SVM",
                "A linear SVM",
                "A random forest",
                "All three, if C is tuned",
              ],
              answer: 2,
              explain: (
                <>
                  A tree compares each feature only with a threshold on that same feature, and an
                  increasing change of units moves the threshold with the data. The forest gave the
                  same label to all 171 test points either way, and multiplied by 1024 it was
                  identical to the last bit.
                </>
              ),
            },
          ]}
        />
      </div>

      <PrevNext
        prev={{
          label: "Solving it: SMO",
          href: "/learn/support-vector-machines/solving-it-smo",
        }}
        next={{
          label: "Choosing C and gamma",
          href: "/learn/support-vector-machines/choosing-c-and-gamma",
        }}
      />
    </article>
  );
}
