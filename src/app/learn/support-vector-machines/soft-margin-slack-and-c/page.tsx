import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeOutput } from "@/components/CodeOutput";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { Quiz } from "@/components/Quiz";
import { SoftMarginLab } from "@/components/labs/SoftMarginLab";

const PINK = "var(--c-classification)";

export const metadata = {
  title: "Soft margin: slack & C — Manifold",
  description:
    "The hard margin has no answer when the classes overlap. Giving every point permission to violate its constraint, at a price, turns an infeasible problem into a solvable one — and turns that price into the single most important dial on a support vector machine.",
};

export default function SoftMarginPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: PINK }, { label: "Core", color: "var(--c-fundamentals)" }]}
        time="about 14 minutes"
        title={<>Room to be wrong</>}
        intro={<>The last page ended somewhere uncomfortable. One training point, walked slowly
          across the boundary, took the margin from 1.44 to 0.05 — and a little further on, the
          problem stopped having an answer at all. Not a poor boundary: no boundary. This page
          repairs that, and the repair introduces the one number you will spend the rest of the
          track choosing.</>}
        titleSize={42}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>A demand that cannot always be met</h2>
        <p>
          Here is the problem as it stood at the end of chapter one:
        </p>

        <MathBlock>{String.raw`\min_{w,\,b}\; \tfrac{1}{2}\lVert w \rVert^{2} \qquad \text{subject to}\qquad y_i\left(w^\top x_i + b\right) \ge 1, \quad i = 1, \dots, n`}</MathBlock>

        <p>
          There is one constraint per training point and every one of them is compulsory. That is
          fine while some line can satisfy all of them at once. The moment two points of opposite
          class sit on the wrong sides of each other, no <M>{String.raw`w`}</M> and{" "}
          <M>{String.raw`b`}</M> exist that satisfy the whole set, the feasible region is empty,
          and the minimisation has nothing to range over. A solver handed this does not return a
          compromise. It reports that the problem is infeasible.
        </p>
        <p>
          And overlapping classes are not an edge case. They are the normal condition of real data:
          two people with identical measurements and different outcomes, a mislabelled row, a
          feature set that genuinely does not determine the answer. A method that requires perfect
          separability is a method that requires the question to have been easy.
        </p>

        <h2>Let each point buy its way out</h2>
        <p>
          The fix is deliberately small. Attach a variable <M>{String.raw`\xi_i \ge 0`}</M> to each
          point — one per constraint — and let that point off by exactly that much:
        </p>

        <MathBlock>{String.raw`\min_{w,\,b,\,\xi}\; \tfrac{1}{2}\lVert w \rVert^{2} + C\sum_{i=1}^{n}\xi_i \qquad \text{subject to}\qquad y_i\left(w^\top x_i + b\right) \ge 1 - \xi_i, \quad \xi_i \ge 0`}</MathBlock>

        <p>
          Now the constraints can always be satisfied — set every <M>{String.raw`\xi_i`}</M> large
          enough and any line at all becomes legal — so the feasible set is never empty and there is
          always an answer. What stops that from being useless is the new term in the objective.
          Every unit of violation costs <M>{String.raw`C`}</M>, so the optimiser will buy slack only
          where the margin it gains is worth more than the slack it pays.
        </p>
        <p>
          Two quantities are now in tension inside one objective:{" "}
          <M>{String.raw`\tfrac{1}{2}\lVert w\rVert^2`}</M>, which wants a wide corridor, and{" "}
          <M>{String.raw`\sum_i \xi_i`}</M>, which wants every point outside it.{" "}
          <M>{String.raw`C`}</M> is the exchange rate between them, and it is yours to set.
        </p>

        <h2>What it rescues</h2>
        <p>
          The most direct test is to rerun the experiment that broke the hard margin. Same forty
          points, same single point walked across the true boundary, same test set — with a
          soft-margin fit at <M>{String.raw`C = 1`}</M> running alongside:
        </p>

        <CodeOutput source="scripts/svm_cases.py">{outRescue}</CodeOutput>

        <p>
          Read the first table down the <strong>hard margin</strong> column and then down the{" "}
          <strong>soft margin</strong> column. The hard margin does what it did before: 1.4376, then
          0.8653, then 0.0453, then nothing. The soft margin dips slightly and then{" "}
          <em>widens</em> — 1.2477, 1.5768, and on past 2.2 — while quietly booking the cost of
          the offending point in <M>{String.raw`\sum_i\xi_i`}</M>. It has bought a wide corridor by
          declining to honour one constraint, which is precisely the trade it was given permission
          to make.
        </p>
        <p>
          The second table repeats the walk over a hundred fresh draws, because one walk is an
          anecdote. On clean data the two are indistinguishable — <strong>0.9780</strong> against{" "}
          <strong>0.9778</strong> — which is the important reassurance: allowing slack costs
          nothing when no slack is needed. Move the point across and the hard margin drops about{" "}
          <strong>nine points</strong> of accuracy while the soft margin drops <strong>one</strong>.
          Past the 200% mark there is no feasible hyperplane in any of the hundred draws, and the
          soft margin is still returning 0.968.
        </p>

        <Callout color={PINK} title={<>&ldquo;No answer&rdquo; is a worse failure than a bad answer</>}>
          <p>
            It is worth dwelling on the <strong>no answer</strong> rows. A model that returns a
            mediocre boundary can be measured, compared and improved. A model that returns nothing
            cannot be put into a pipeline at all, and the thing that tipped it over was one point
            out of forty moving a few units. Robustness here is not about squeezing out extra
            accuracy; it is about the method continuing to exist.
          </p>
        </Callout>

        <h2>What one ξ is worth</h2>
        <p>
          Slack is easy to treat as bookkeeping, so it is worth being concrete about what a value
          of <M>{String.raw`\xi_i`}</M> means. It is the amount by which point{" "}
          <M>{String.raw`i`}</M> falls short of the margin it was supposed to clear, measured in
          the same functional units as the constraint. That gives four cases, and they are not
          arbitrary bands — they are the only four things a point can be doing:
        </p>

        <CodeOutput source="scripts/svm_cases.py">{outSlack}</CodeOutput>

        <p>
          The line that matters most is <M>{String.raw`\xi_i > 1`}</M>. A point only gets there by
          crossing the boundary itself, so every training mistake carries at least a full unit of
          slack on its own — here, exactly <strong>20</strong> points above 1 and exactly{" "}
          <strong>20</strong> misclassified. Sum that up and{" "}
          <M>{String.raw`\sum_i \xi_i`}</M> is an upper bound on the number of training errors,
          which is what makes it a defensible thing to minimise: you cannot drive the slack down
          without driving the mistakes down with it.
        </p>
        <p>
          It is a loose bound — <strong>36.35</strong> against <strong>15.35</strong> actual errors
          across 300 draws, a factor of about 2.4 — because every point sitting inside the corridor
          pays too, even the ones on the correct side. It is also a bound that never broke: not one
          of those 300 fits had less slack than it had mistakes.
        </p>
        <p>
          One detail in that table is worth not skipping. There are <strong>44</strong> points
          carrying slack but <strong>45</strong> support vectors. The extra one is point 67, sitting
          at functional margin 1.000206 — resting exactly <em>on</em> the margin line rather than
          inside it. It pays nothing and still holds the boundary up. So the support vectors are
          the points carrying slack <em>plus</em> the points touching the margin, and that
          distinction becomes the whole story once the dual arrives in chapter three.
        </p>

        <PredictPrompt
          accent={PINK}
          prompt={<>In the lab below, the two clouds overlap, so no straight line separates them.
            What happens to the number of points left on the <strong>wrong side</strong> as you
            push C all the way up?</>}
          options={[
            "It falls to zero — that is what a large C is for",
            "It falls a little and then stops, because no line can do better",
            "It rises, since a narrow corridor catches fewer points",
            "It stays exactly constant regardless of C",
          ]}
        />

        <LabFrame
          accent={PINK}
          tryThis={<>Drag <strong>C</strong> to the far left and watch the corridor swallow most of
            the data — every blue segment is one point&rsquo;s ξ. Now walk it to the far right and
            watch the corridor squeeze shut. Then push <strong>class separation</strong> up to 3
            and run C through its range again.</>}
          insight={<>The corridor and the debt move in opposite directions, which is the whole
            trade: a low C buys width by letting most of the data sit inside, a high C buys a clean
            corridor by narrowing it until almost nothing is in the way. But watch the{" "}
            <strong>wrong side</strong> counter while you do it — at the default separation it never
            reaches zero, however far right you push C. Those points are not a tuning failure. No
            line separates these two clouds, so some points have to be wrong, and C only decides
            how much the rest of the boundary contorts itself around them. Widen the separation and
            the counter drops to zero on most samples.</>}
        >
          <SoftMarginLab />
        </LabFrame>

        <h2>C is an exchange rate, and you can watch it overfit</h2>
        <p>
          The lab shows what C does to one picture. The question that matters is what it does to
          accuracy. Below, two overlapping Gaussian clouds with a <em>known</em> true boundary, so
          the direction error of each fit can be measured directly rather than inferred:
        </p>

        <CodeOutput source="scripts/svm_cases.py">{outDial}</CodeOutput>

        <p>
          Take the 2-sigma table from <M>{String.raw`C = 0.01`}</M> upward and read the two
          accuracy columns against each other. Training accuracy climbs at every single step, from{" "}
          <strong>0.9765</strong> to <strong>0.9812</strong>. Test accuracy falls at every single
          step, from <strong>0.9746</strong> to <strong>0.9706</strong>. That is overfitting caught
          in the act, with one parameter as the only thing changing, and it is why C is a
          regularisation dial and not a solver setting.
        </p>
        <p>
          The angle column is the more sensitive instrument. It roughly triples — 3.42° out at{" "}
          <M>{String.raw`C = 0.01`}</M>, around 9.3° by <M>{String.raw`C = 1`}</M>, where it
          flattens. Test accuracy moved by four thousandths over that range; the boundary itself
          moved by six degrees. Accuracy is a blunt way to notice a model going wrong.
        </p>
        <p>
          The bottom of the dial fails differently. At <M>{String.raw`C = 0.001`}</M> slack is
          nearly free, so the fit buys an enormous corridor — 11.8 units wide, wider than the data —
          and simply stops discriminating. In the 1-sigma table, <strong>59 of 60</strong> fits at
          that setting predict a single class for every point in the test set. Given permission to
          ignore everything, it does.
        </p>

        <Callout color={PINK} title={<>C runs backwards compared with every other penalty you know</>}>
          <p>
            In ridge and lasso, the knob multiplies the <em>penalty</em>: larger{" "}
            <M>{String.raw`\alpha`}</M> means more regularisation and a simpler model. Here{" "}
            <M>{String.raw`C`}</M> multiplies the <em>data-fitting</em> term instead, so larger{" "}
            <M>{String.raw`C`}</M> means <em>less</em> regularisation and a more contorted boundary.
            If it helps, think of <M>{String.raw`1/C`}</M> as the quantity that plays{" "}
            <M>{String.raw`\alpha`}</M>&rsquo;s role. Reading the dial the wrong way round is one of
            the most common ways to tune an SVM in exactly the wrong direction.
          </p>
        </Callout>

        <h2>When C stops mattering</h2>
        <p>
          The 1-sigma table is the same experiment on genuinely murky data, and its test column
          barely moves at all: <strong>0.8257</strong> to <strong>0.8333</strong> across five
          decades of C. No line can beat 0.8413 here, and the irreducible error swamps whatever the
          dial is doing. It is worth knowing in advance that a careful search over C is sometimes
          a search over nothing — the same tuning effort pays very differently depending on how
          much signal is there to find.
        </p>

        <h2>The hard margin did not go anywhere</h2>
        <p>
          One last table, at the bottom of that output. Run the soft-margin problem on data that{" "}
          <em>is</em> separable and push C up: from <M>{String.raw`C = 1`}</M> onward it returns the
          hard-margin answer to four decimal places, at <strong>0.0000°</strong> of difference, with
          total slack of order <M>{String.raw`10^{-8}`}</M>.
        </p>
        <p>
          So the soft margin does not replace the hard margin — it contains it. Once C is steep
          enough that no violation is worth its price, the optimiser stops buying any, and the
          solution it lands on <em>is</em> the hard-margin solution. Nothing had to be switched off,
          and C did not have to approach infinity to get there; on this data it took a value of 1.
          Everything proved in chapter one is still true, sitting at one end of a dial that now has
          a useful middle.
        </p>
        <p>
          What remains is that <M>{String.raw`\sum_i \xi_i`}</M> is written as a constraint system
          here, which is awkward: it looks like the solver is optimising{" "}
          <M>{String.raw`n`}</M> extra variables alongside <M>{String.raw`w`}</M> and{" "}
          <M>{String.raw`b`}</M>. It is not. Each <M>{String.raw`\xi_i`}</M> is fully determined by
          the boundary — it is whatever shortfall that boundary leaves — and writing it that way
          turns the whole thing into an unconstrained loss with a name you have already met.
          That is the next page.
        </p>

        <Quiz
          accent={PINK}
          questions={[
            {
              q: <>Why does the hard-margin problem fail on overlapping classes, specifically?</>,
              options: [
                "The solver runs out of iterations before converging",
                "Every constraint is compulsory, so if no line satisfies all of them the feasible set is empty and there is nothing to minimise over",
                "The margin becomes negative",
                "It returns the best available line but with a warning",
              ],
              answer: 1,
              explain: <>It is not an accuracy failure, it is an existence failure. The constraints{" "}
                <M>{String.raw`y_i(w^\top x_i + b) \ge 1`}</M> must hold for every{" "}
                <M>{String.raw`i`}</M> at once, and when no <M>{String.raw`(w, b)`}</M> does that,
                the problem is infeasible and returns no boundary at all.</>,
            },
            {
              q: <>A training point has <M>{String.raw`\xi_i = 0.4`}</M>. Where is it?</>,
              options: [
                "On the wrong side of the boundary",
                "Exactly on the boundary",
                "Inside the corridor but still on the correct side of the boundary",
                "Outside the corridor, correctly classified",
              ],
              answer: 2,
              explain: <>Anything strictly between 0 and 1 is inside the margin and still correctly
                classified. It takes <M>{String.raw`\xi_i = 1`}</M> to reach the boundary itself and{" "}
                <M>{String.raw`\xi_i > 1`}</M> to be misclassified — which is exactly why{" "}
                <M>{String.raw`\sum_i\xi_i`}</M> upper-bounds the training error count.</>,
            },
            {
              q: <>In the 2-sigma table, training accuracy rose from 0.9765 to 0.9812 while test
                accuracy fell from 0.9746 to 0.9706. What does that pattern identify?</>,
              options: [
                "A bug in the solver, since both should move together",
                "Overfitting — a larger C punishes violations harder, so the boundary contorts to fit individual training points",
                "Underfitting, since the margin got narrower",
                "Noise, since the changes are small",
              ],
              answer: 1,
              explain: <>The two columns moving in opposite directions across every step is the
                signature of overfitting. The angle column confirms it independently: the fitted
                boundary drifts from 3.42° off the truth to around 9.3° over the same range.</>,
            },
            {
              q: <>You want an SVM to behave as much like a hard-margin SVM as possible. Which way
                do you move C, and what does that say about the relationship between the two?</>,
              options: [
                "Down — a small C means fewer violations are allowed",
                "Up — and past a certain point the soft-margin solution simply is the hard-margin solution",
                "C has no effect on separable data",
                "Neither; hard margin requires a different solver entirely",
              ],
              answer: 1,
              explain: <>Raising C raises the price of slack until buying any is uneconomic. On the
                separable data above, every C from 1 upward reproduced the hard-margin boundary to
                four decimals and 0.0000° — so the hard margin is one end of the soft margin&rsquo;s
                range, not a separate method.</>,
            },
          ]}
        />
      </div>

      <PrevNext
        prev={{
          label: "Does a wider margin actually help?",
          href: "/learn/support-vector-machines/does-a-wider-margin-help",
        }}
        next={{
          label: "The hinge loss",
          href: "/learn/support-vector-machines/the-hinge-loss",
        }}
      />
    </article>
  );
}

const outRescue = `The walk that ended the last page, rerun with a soft-margin fit (C=1) alongside the
hard-margin one. Same points, same single point moving, same test set.

      moved      hard? hard margin soft margin    sum xi    soft acc
         0%        yes      1.4376      1.4376    0.0002      0.9915
       100%        yes      0.8653      1.2477    1.0813      0.9235
       200%        yes      0.0453      1.5768    3.3112      0.9630
       250%         NO          --      1.6600    4.1690      0.9700
       300%         NO          --      1.7436    4.9882      0.9745
       400%         NO          --      1.8554    6.4699      0.9615
       600%         NO          --      2.2547    9.0287      0.9525

One walk is one anecdote, so the same thing over 100 fresh draws. The feasible column
is the share of draws that still admit a separating hyperplane at all; the hard-margin
column can only average over those, and the draws column says how many that was.

      moved   feasible    draws     hard acc     soft acc  soft margin
         0%       100%      100       0.9780       0.9778       1.4968
       100%       100%      100       0.8811       0.9673       1.5946
       200%         2%        2       0.8240       0.9690       1.8019
       300%         0%        0    no answer       0.9683       1.9395
       400%         0%        0    no answer       0.9679       2.0620
       600%         0%        0    no answer       0.9623       2.3457

  With the data clean the two agree: 0.9780 against 0.9778, so allowing slack costs
  nothing when no slack is needed. One point across the boundary and the hard margin
  is down 9 points of accuracy while the soft margin is down 1. Past 200% the hard
  problem is infeasible in every draw -- not inaccurate, ANSWERLESS -- and the soft
  margin is still returning 0.968 and a WIDER corridor than it started with.`;

const outSlack = `120 points from two overlapping Gaussians, one linear fit at C=1.
Every point falls into exactly one of four cases, and xi says which.

  case                                   points
  xi = 0       outside the corridor          76
  0 < xi < 1   inside it, still correct      24
  xi = 1       exactly on the boundary        0
  xi > 1       on the wrong side             20

  sum of all xi                          41.6973
  training points misclassified              20
  points with xi > 0                         44
  support vectors                            45
  the support vector carrying no slack is point 67, at functional margin
  1.000206 -- resting ON the margin line rather than inside it.

Is sum(xi) >= the number of training errors always, or was that one lucky fit?

  mean sum(xi) over 300 draws               36.35
  mean training errors                      15.35
  draws where sum(xi) < errors                  0
  smallest sum(xi) - errors seen           7.3602

  It cannot go under, and the reason is in the table above: a misclassified point
  has xi > 1 all by itself. So sum(xi) is an upper bound on the training mistakes,
  which is why minimising it is a sane thing to ask for. It is a LOOSE bound --
  2.37x the true count here -- because every point inside the corridor pays too.`;

const outDial = `Same two-Gaussian world, 100 training points, 4000 test points, 60 draws per row.
The truth is known, so the angle column is the real error of the direction of the
boundary rather than a proxy for it.

  -- means 2.0 sigma apart; no line can beat 0.9772 accuracy --
         C    margin    sum xi     #SV     train      test    angle
     0.001    11.798     62.02    91.8    0.6852    0.6533     2.58
      0.01     3.804     18.01    46.7    0.9765    0.9746     3.42
       0.1     2.115      8.16    18.5    0.9783    0.9738     6.71
         1     1.273      5.27     9.5    0.9793    0.9721     9.30
        10     0.880      4.52     6.7    0.9807    0.9713     9.19
       100     0.780      4.33     6.3    0.9812    0.9706     9.41
      1000     0.759      4.30     6.2    0.9812    0.9706     9.25

  -- means 1.0 sigma apart; no line can beat 0.8413 accuracy --
         C    margin    sum xi     #SV     train      test    angle
     0.001    25.821     85.16    91.8    0.5470    0.5062     5.16  (59 of 60 predict a single class)
      0.01     3.779     51.43    80.5    0.8385    0.8257     5.33
       0.1     1.954     38.42    50.2    0.8453    0.8337     6.91
         1     1.444     36.52    40.0    0.8457    0.8331     8.54
        10     1.344     36.42    38.2    0.8460    0.8331     8.78
       100     1.333     36.42    37.9    0.8453    0.8333     8.73
      1000     1.332     36.42    37.9    0.8453    0.8333     8.73

  Read the 2-sigma table across: as C rises, training accuracy climbs every step
  (0.9765 -> 0.9812) and test accuracy falls every step (0.9746 -> 0.9706). That is
  overfitting caught in the act, with C as the only thing that changed.
  The angle column is the more sensitive instrument: 3.42 degrees out at C=0.01 and
  9.25 at C=1000. Chasing the last few training points costs real direction.
  At the bottom of the dial the model stops modelling. C=0.001 gives a corridor
  11.8 wide -- wider than the data -- and 59 of 60 fits answer one class for every
  point. Free to ignore everything, it does.
  In the 1-sigma table test accuracy barely moves (0.8257 -> 0.8333). When the
  classes overlap this much the irreducible error swamps whatever C is doing.

Does a large C give back the hard margin on data that IS separable?

           C      margin      sum xi   angle vs hard
         0.1      2.2881    2.36e+00          2.3076
           1      1.4375    2.62e-08          0.0000
          10      1.4375    2.62e-08          0.0000
         100      1.4375    2.62e-08          0.0000
        1000      1.4375    2.62e-08          0.0000
        hard      1.4375

  From C=1 up it is the hard-margin answer to four decimals and 0.0000 degrees.
  Soft margin does not replace the hard one, it contains it: once C is steep enough
  that no violation is worth its price, the solver stops buying any. Nothing had to
  be switched off, and C did not have to go near infinity to get there.`;
