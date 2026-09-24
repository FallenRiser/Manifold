import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeOutput } from "@/components/CodeOutput";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { Quiz } from "@/components/Quiz";
import { SupportSetLab } from "@/components/labs/SupportSetLab";

const PINK = "var(--c-classification)";

export const metadata = {
  title: "Support vectors, exactly — Manifold",
  description:
    "A support vector is a point with a price above zero. That splits a training set three ways rather than two, and the split is what lets you delete most of the data, recover the offset the dual threw away, and bound the leave-one-out error without refitting anything.",
};

export default function SupportVectorsExactlyPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: PINK }, { label: "Deep", color: "var(--c-fundamentals)" }]}
        time="about 17 minutes"
        title={<>Three kinds of point</>}
        intro={<>Page 7 showed that most of a training set can be deleted without moving the
          boundary. It got there from the loss, where the only thing you can see about a point is
          whether it pulls. The dual has a finer instrument — a price — and the price sorts a
          training set into three groups, not two. Everything left in this chapter runs on
          telling the last two apart.</>}
        titleSize={42}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>The definition is a number</h2>
        <p>
          A <strong>support vector</strong> is a training point whose price is above zero. That is
          the entire definition, and it is worth noticing what it is <em>not</em>: it says nothing
          about being near the boundary, or being hard, or looking important. It is a fact about
          the solution the solver returned.
        </p>
        <p>
          Page 9 measured why that sorts into three groups rather than two. The price lives in a
          box, <M>{String.raw`0 \le \alpha_i \le C`}</M>, and a box has an inside and two walls:
        </p>

        <MathBlock>{String.raw`\alpha_i = 0 \quad\Longrightarrow\quad y_i f(x_i) \ge 1
\qquad
0 < \alpha_i < C \quad\Longrightarrow\quad y_i f(x_i) = 1
\qquad
\alpha_i = C \quad\Longrightarrow\quad y_i f(x_i) \le 1`}</MathBlock>

        <p>
          The middle one is an equality, and that is not a coincidence — it is the case where
          neither wall is touched, so both complementary-slackness products have to vanish on
          their own. Points against the lower wall have room to spare; points against the upper
          wall are carrying slack; points strictly inside are resting on the margin exactly. The
          usual names are <strong>free</strong> support vectors for the middle group and{" "}
          <strong>bound</strong> for the ones pinned at <M>{String.raw`C`}</M>.
        </p>

        <CodeOutput source="scripts/svm_cases.py">{outSvset}</CodeOutput>

        <p>
          Two results there, and the second one takes the shine off the first. Twenty-four points
          can be deleted individually with the boundary not moving in any digit, and all sixteen
          support vectors together reproduce the full fit — a literal zero of turn, the offset
          agreeing to fourteen decimals. That is page 7&rsquo;s claim again, now with an exact
          criterion attached to it rather than an observation about which points had gradient.
        </p>
        <p>
          But <strong>ten of those sixteen do not turn the boundary either</strong>. They move it
          — the smallest offset shift is 0.040 — yet the direction comes back bit-identical and
          the line only slides along its own normal. One of the three points sitting exactly on
          the margin is among them. So &ldquo;support vector&rdquo; means <em>the solution gave
          this point a price</em>, and it does not promise that the answer depends on it. Several
          points holding the same wall are each support vectors, and any one of them can go.
        </p>

        <PredictPrompt
          accent={PINK}
          prompt={<>The thirteen points pinned at <M>{String.raw`C`}</M> are inside the corridor or
            on the wrong side of it — the ones the fit gave up on. Delete all thirteen and refit.
            What happens to the corridor?</>}
          options={[
            "It gets wider",
            "It stays exactly the same — they were already being ignored",
            "It gets narrower, since there is less to separate",
            "The boundary swings, because those points were the hardest ones",
          ]}
          nudge={<>They are paying the maximum the problem allows. Ask what they are buying with
            it.</>}
        />

        <p>
          It widens, from 0.4948 to 0.5475, without turning at all. That row is the one to keep.
          The points pinned at <M>{String.raw`C`}</M> are not spectators paying a fine for being
          in the way — they are <em>pressing inward</em>, and the corridor is as narrow as it is
          because they are there. Take them away and it opens.
        </p>
        <p>
          Which answers the tempting next question. If the three points resting on the margin are
          the ones the geometry touches, are they the model? Over 31 fits: sixteen times yes,
          fifteen times no, and — the part that explains it — <strong>zero times narrower</strong>.
          The full answer is always legal for the smaller problem, since those points sit at
          functional margin 1 in it too, so the smaller problem can only do as well or better.
          Better means wider. The fifteen failures are all the same failure: with the inward
          pressure gone, the corridor opens past where the full fit had it.
        </p>

        <LabFrame
          accent={PINK}
          tryThis={<>Click points and watch the two readouts. Start with the faint bare dots — the
            ones with no price — one at a time, then press <em>drop every point with no price</em>{" "}
            to take them all at once. Then put them back and remove a single ringed or haloed
            point instead.</>}
          insight={<>Deleting bare dots leaves <strong>boundary turned</strong> at 0.0000° and{" "}
            <strong>offset moved</strong> at 0.0000, however many you take, and the solid line
            stays exactly on the dashed one. Deleting a priced point usually moves both — but not
            always. Some haloed points can go for nothing, because their neighbours were holding
            the same wall. The lab re-solves the dual from scratch
            on every click, so what you are watching is a fresh answer each time rather than the
            first one nudged.</>}
        >
          <SupportSetLab />
        </LabFrame>

        <h2>When a point starts to matter</h2>
        <p>
          Deleting is blunt. A finer instrument is to take the most comfortable point in the set
          and walk it slowly toward the boundary, refitting at every step, watching for the moment
          its price switches on.
        </p>

        <CodeOutput source="scripts/svm_cases.py">{outBecoming}</CodeOutput>

        <p>
          The price is exactly zero above functional margin 1 and exactly{" "}
          <M>{String.raw`C`}</M> below it. No ramp, no approach — a switch thrown at the margin.
          And the scan says there is no in-between state to catch at all: 220 positions across the
          crossing, <strong>none</strong> with a price strictly between 0 and{" "}
          <M>{String.raw`C`}</M>.
        </p>
        <p>
          That reframes the middle group. A point strictly inside the corridor carries slack, and
          slack forces the price to the ceiling; a point strictly outside has room, which forces
          it to zero. Interior prices are available <em>only</em> at functional margin exactly 1.
          So the free support vectors are not points that happened to land near the margin — they
          are points the solution <em>put</em> there, and that is why there are so few of them and
          why some fits have none.
        </p>

        <Callout color={PINK} title={<>Getting a price and mattering are two different events</>}>
          <p>
            Read the turn column across the crossing. The point becomes a support vector at step
            1.70, and at step 2.00 the model is still bit-identical — same direction, same{" "}
            <M>{String.raw`\|w\|`}</M>, same offset — with the point now sitting well inside the
            corridor it is supposedly supporting. Then it goes on getting more wrong and{" "}
            <em>still</em> the direction does not move, because a point already pinned at{" "}
            <M>{String.raw`C`}</M> contributes <M>{String.raw`C y_i x_i`}</M>, and sliding it
            along the boundary&rsquo;s own normal changes that by a multiple of{" "}
            <M>{String.raw`w`}</M> itself. A multiple of <M>{String.raw`w`}</M> rescales the
            answer; it cannot turn it. This is the outlier robustness of the hinge, arriving from
            the dual side: a point already paying the maximum has nothing further to say.
          </p>
        </Callout>

        <p>
          The sideways walk is the control. Slide the same point parallel to the boundary — eight
          units, wider than the whole cloud — and the functional margin reads 4.4305 at every
          stop, the price stays zero, and the turn stays zero. Distance from the boundary is the
          only thing about a point an SVM ever asks.
        </p>

        <h2>The one number the prices do not contain</h2>
        <p>
          Page 10 got <M>{String.raw`w`}</M> straight out of the prices. The offset is not in
          there: <M>{String.raw`b`}</M> was eliminated on the way into the dual, where it became
          the constraint <M>{String.raw`\sum_i \alpha_i y_i = 0`}</M>. It has to be read back off
          the training set afterwards — and only one of the three groups can tell you.
        </p>

        <CodeOutput source="scripts/svm_cases.py">{outOffset}</CodeOutput>

        <p>
          The three points on the margin agree with each other to seven figures, and{" "}
          <em>any one of them alone</em> lands within{" "}
          <strong>1.2 × 10<sup>−7</sup></strong> of sklearn&rsquo;s intercept. The thirteen pinned
          at <M>{String.raw`C`}</M> spread over a range of 3.88 and the twenty-four unpriced ones
          over 6.22. Averaging the free ones, which is what libsvm does, is for conditioning
          rather than correctness.
        </p>

        <Callout color={PINK} title={<>This is page 8&rsquo;s interval, finally explained</>}>
          <p>
            Page 8 found fits whose best offset was not a number but an <em>interval</em>, and had
            nothing to say about why. Here is why: those are exactly the fits with an empty middle
            group. Nothing is resting on the margin, so no point has an equation to hand you, and
            the objective is genuinely flat across a range of offsets. The first row of that sweep
            is an interval <strong>0.016885</strong> wide — which is, to the digit, the one page 8
            measured.
          </p>
          <p>
            In all <strong>21</strong> such fits, libsvm puts <M>{String.raw`b`}</M> at the exact
            middle of the interval. That is a sensible choice and it <em>is</em> a choice: there is
            no fact of the matter in there, and a different implementation could hand you a
            different number and be equally right. Page 8 also found the interval reaching 1.47 at{" "}
            <M>{String.raw`C = 0.01`}</M>, wide enough to relabel training points — so this is
            worth knowing about rather than filing away.
          </p>
        </Callout>

        <h2>What the count is worth</h2>
        <p>
          One consequence of the deletion result is sharper than it first looks. Leave a point out
          and refit: if it was not a support vector, the model that comes back is the{" "}
          <em>same model</em>. And a point with price zero has functional margin at least 1, so
          that model classifies it correctly. A non-support-vector therefore cannot produce a
          leave-one-out error — not usually, ever.
        </p>

        <CodeOutput source="scripts/svm_cases.py">{outLoo}</CodeOutput>

        <p>
          Zero, over 720 refits. Which gives a real result for free: the leave-one-out error count
          is at most the number of support vectors, so
        </p>

        <MathBlock>{String.raw`\text{LOO error rate} \;\le\; \frac{\#\text{SV}}{n}`}</MathBlock>

        <p>
          and the right-hand side is readable off a single fit, with no refitting at all. It is
          also <strong>loose</strong> — between 1.69 and 24 times the count it bounds, median 3.7 —
          so it will not choose a model for you. What it says is real and narrow: an SVM with few
          support vectors cannot have a bad leave-one-out error, whatever else is true of it.
        </p>
        <p>
          The count is the bill, too. A linear SVM collapses into a single{" "}
          <M>{String.raw`w`}</M>, but a kernel one cannot — page 12 will show why — so scoring one
          new point costs one kernel evaluation per support vector. On the same 3000 points with
          the same kernel, the model you have to keep ranges from 12% of the training set to 96%
          of it. Page 7 said sparsity is a property of the fit and not a promise; this is that
          sentence in a latency budget.
        </p>

        <Quiz
          accent={PINK}
          questions={[
            {
              q: <>Which statement is the definition of a support vector?</>,
              options: [
                "A training point whose price alpha is greater than zero",
                "A training point lying within a small distance of the boundary",
                "A training point the model classifies incorrectly",
                "A training point whose removal changes the boundary",
              ],
              answer: 0,
              explain: <>The last one is a common gloss and this page measured it false: ten of
                the sixteen support vectors could be deleted without turning the boundary at all,
                because other points were holding the same wall. The price is the definition; the
                rest are consequences that mostly hold.</>,
            },
            {
              q: <>A point sits strictly inside the margin corridor. What is its price?</>,
              options: [
                "Exactly C",
                "Exactly zero",
                "Somewhere strictly between 0 and C",
                "It depends on how far inside it is",
              ],
              answer: 0,
              explain: <>Inside the corridor means it is carrying slack, and a point carrying slack
                has to pay the ceiling. That is why the walk found no position at all — out of 220
                — where the price was strictly between 0 and <M>{String.raw`C`}</M>. Interior
                prices exist only at functional margin exactly 1.</>,
            },
            {
              q: <>You have solved the dual and recovered <M>{String.raw`w = \sum_i \alpha_i y_i x_i`}</M>.
                Your fit has no free support vectors. What can you say about{" "}
                <M>{String.raw`b`}</M>?</>,
              options: [
                "The training data does not pin it down — a whole interval of offsets is equally optimal",
                "It is zero",
                "It can be recovered by averaging over the points pinned at C",
                "The fit has failed and should be rerun",
              ],
              answer: 0,
              explain: <>Only a point resting <em>on</em> the margin satisfies{" "}
                <M>{String.raw`y_i(w^\top x_i + b) = 1`}</M>, so with none of them there is no
                equation to solve. The hinge is genuinely flat across a range of offsets; libsvm
                returns the midpoint of it in all 21 such fits measured here.</>,
            },
            {
              q: <>Removing the thirteen points pinned at <M>{String.raw`C`}</M> widened the
                corridor from 0.4948 to 0.5475 without turning the boundary. Why?</>,
              options: [
                "They were pressing inward, and the corridor was narrow because of them",
                "Removing any thirteen points would widen it",
                "They were the only points with a price, so the fit lost its constraints",
                "The solver converged to a different local optimum",
              ],
              answer: 0,
              explain: <>A point pinned at <M>{String.raw`C`}</M> sits inside the corridor and pays
                the maximum to be allowed to. That payment is what stops the corridor from opening
                over it. Removing the twenty-four unpriced points, by contrast, changes nothing at
                all — and the problem is convex, so there is no second optimum to land in.</>,
            },
          ]}
        />
      </div>

      <PrevNext
        prev={{
          label: "The dual problem",
          href: "/learn/support-vector-machines/the-dual-problem",
        }}
        next={{
          label: "The kernel trick",
          href: "/learn/support-vector-machines/the-kernel-trick",
        }}
      />
    </article>
  );
}

const outSvset = `A support vector is a point with a price above zero. That is the whole definition, and
it is a fact about the SOLUTION, not about where a point sits when you look at the
picture. Page 9 sorted these 40 points by their price; the sort has three bins, not
two, and the rest of this page turns on the difference between the last two.

                                     count   functional margin y f(x)
  price 0 -- not a support vector       24   1.1742 to 4.4305
  0 < price < C -- on the margin         3   1.0000 to 1.0000
  price = C -- pushed inside            13   -1.9829 to 0.8820

Now the claim that matters. Delete one training point, refit from scratch, and measure
how far the boundary turned. All 40, one at a time:

  point deleted                      count    mean turn   worst turn   never turned
  not a support vector                  24   0.0000 deg   0.0000 deg       24 of 24
  on the margin                          3   2.2314 deg   4.2560 deg        1 of 3
  pinned at the cap                     13   0.6081 deg   2.4383 deg        9 of 13

Twenty-four points can be deleted and the boundary does not move -- not approximately,
not on average, but to every digit, on every single one of them.

The last column is the half of it that gets overstated. Every one of the sixteen does
change the model -- the smallest offset shift among them is 0.040. But ten of the
sixteen do not TURN it at all: the direction comes back bit-identical and the boundary
only slides along its own normal. That includes one of the three sitting on the
margin, whose removal moves b by 0.090 and rotates nothing. What those points were
holding, others were holding too. A support vector is a point the solution priced --
not, on its own, a point the answer depends on. Taken in bulk:

  trained on                         n  turn (deg)       |db|  corridor same calls
  all 40 points                     40   0.000e+00  0.000e+00    0.4948       True
  only the 16 support vectors       16   0.000e+00  1.552e-14    0.4948       True
  only the 24 others                24   3.850e+00  7.972e-02    0.7313       True
  all but the 3 on the margin       37   5.912e+00  2.232e-01    0.6508      False
  all but the 13 pinned at C        27   0.000e+00  8.989e-02    0.5475      False

Sixteen points reproduce the boundary exactly -- the turn is a literal zero and the
offset agrees to fourteen decimals. Twenty-four of them reproduce nothing in
particular, and note they still label all 40 points the same way, so a boundary can be
several degrees wrong and look fine on the training set.

Read the corridor column on the last two rows. Dropping the three on the margin turns
the answer nearly six degrees. Dropping the thirteen pinned at C turns it by nothing
at all -- and widens the corridor from 0.4948 to 0.5475, which is the whole story of
this page in one number and is worth pulling on.

The tempting next thought is that only the three on the margin really count, since
they are the ones the geometry touches. That is worth testing rather than believing.
Refit on the free support vectors alone, with the cap lifted so the subproblem is not
forced to buy slack it does not need, over 12 samples and 3 values of C:

  sample         C  free bound  |w| in full  |w| on free       turn
  seed 0       0.5     2    16     1.690859     1.686122    4.290 deg  wider
  seed 0         1     3    13     2.020984     2.020984    0.000 deg  identical
  seed 0         3     3    12     2.147645     2.147645    0.000 deg  identical
  seed 1       0.5     2     2     1.277176     1.247671   12.340 deg  wider
  seed 1         3     2     0     1.460256     1.460256    0.000 deg  identical
  seed 2       0.5     3     8     1.574329     1.574329    0.000 deg  identical
  ... 31 fits in all

  the free ones alone gave back the same model       16
  they gave a WIDER corridor instead                 15
  they gave a narrower one                            0

Never narrower, and that direction is the explanation. The full answer is always a
legal answer for the smaller problem -- those points sit at functional margin 1 in it
too -- so the smaller problem can only do as well or better, and better means wider.
What it does when it goes wider is drop the points that were pressing in from inside.
The ones pinned at C are not spectators paying a fine. They are holding the corridor
shut, and taking them away lets it open.`;

const outBecoming = `Deleting a point is a blunt instrument. A finer one: take the single most comfortable
point in the set -- price 0, functional margin 4.4305, as far from the trouble as any
point gets -- and walk it slowly toward the boundary, refitting from scratch at every
step.

  moved            y f(x)  its price         turn          |w|     #sv
  0.00             4.4305     0.0000   0.0000 deg     2.020984      16
  0.50             3.4200     0.0000   0.0000 deg     2.020984      16
  1.00             2.4095     0.0000   0.0000 deg     2.020984      16
  1.50             1.3990     0.0000   0.0000 deg     2.020984      16
  1.66             1.0756     0.0000   0.0000 deg     2.020984      16
  1.68             1.0352     0.0000   0.0000 deg     2.020984      16
  1.70             0.9948     1.0000   0.0000 deg     2.020984      17
  1.75             0.8937     1.0000   0.0000 deg     2.020984      17
  2.00             0.3885     1.0000   0.0000 deg     2.020984      17
  2.50            -0.4660     1.0000   0.0000 deg     1.826601      18
  3.00            -1.2850     1.0000   1.9455 deg     1.718434      19
  5.00            -3.9996     1.0000   4.8829 deg     1.476152      22
  8.00            -7.0528     1.0000   2.7064 deg     1.208626      24

The price is exactly 0.0000 while the functional margin is above 1 and exactly C the
moment it drops below. Not approaching, not ramping -- a switch, thrown at the margin.
That is complementary slackness from page 9 seen in motion: a constraint can have a
price or it can have room, never both.

There is no in-between state to catch, either, and the reason is worth having. A point
strictly inside the corridor is carrying slack, and page 9's fourth condition forces
any point carrying slack to pay the full C. A point strictly outside has room, so it
pays nothing. Between 0 and C is therefore not a phase a point passes through on its
way in -- it is available only at functional margin exactly 1. Scanning the crossing
in thousandths:

  positions tried across the crossing                           220
  of them where the price was strictly between 0 and C            0

None. Which reframes page 9's middle group: those three points are not points that
happened to end up near the margin. They are points the solution PUT on the margin,
exactly, because that is the only place a price is allowed to be interior. It is also
why there are so few of them, and why some fits have none at all.

Now the part that undercuts the obvious reading. Look at the turn column while the
point crosses. It acquires a price at step 1.70, and at step 2.00 the model is still
bit-identical -- same direction, same |w|, same offset -- with the point now well
inside the corridor it is supposedly supporting. Acquiring a price and mattering are
different events, and the first is not evidence of the second.

Past that, something odder still. The point goes on getting more wrong and the
direction stays frozen while the corridor widens. Its price cannot rise past C, and
moving a point already stuck at C along the boundary's own normal changes its
contribution C*y*x by a multiple of w itself -- which rescales the answer without
turning it. This is the outlier robustness of the hinge arriving from the dual side:
a point that is already paying the maximum has nothing further to say. Only when it
gets far enough to drag the whole corridor does the direction go, and by then it has
recruited 8 other points into the support set.

The other direction is the control. Slide the same point sideways instead -- parallel
to the boundary, which changes where it sits enormously and its functional margin not
at all:

  slid sideways        y f(x)  its price         turn
  0.00                 4.4305     0.0000   0.0000 deg
  1.00                 4.4305     0.0000   0.0000 deg
  2.00                 4.4305     0.0000   0.0000 deg
  4.00                 4.4305     0.0000   0.0000 deg
  8.00                 4.4305     0.0000   0.0000 deg

Eight units of travel, wider than the entire cloud, and not one digit moves. Distance
from the boundary is the only thing about a point an SVM ever asks.`;

const outOffset = `Page 10 got w straight out of the prices: w = sum a_i y_i x_i, no data needed beyond
what the sum already uses. The offset is not in there. b was eliminated on the way
into the dual -- it turned into the constraint sum a_i y_i = 0 -- so it has to be read
back off the training set afterwards.

The reading rule is one line: a point resting ON the margin has y(w.x + b) = 1 exactly,
so b = y - w.x for that point. Which points qualify? Take every point in turn, compute
b = y_i - w.x_i as if it qualified, and see:

  computed from                      count       lowest      highest       spread
  a point with price 0                  24    -2.852832     3.365016    6.218e+00
  a point on the margin                  3    -0.065451    -0.065450    1.094e-07
  a point pinned at C                   13    -3.048396     0.834747    3.883e+00

  sklearn's own intercept                                 -0.065451
  worst error from ONE point on the margin alone          1.176e-07
  error from averaging the three of them                  8.102e-08

Three points agree to seven figures. The thirteen pinned at C spread over a range of
3.88 and the twenty-four with no price spread over 6.22, and both are useless -- a
point that is not resting on the margin has no equation to give you. Averaging the
free ones is what libsvm does, and it is for conditioning, not correctness: any one of
them would have done.

Which raises page 8's loose end. That page found fits whose optimal offset was not a
number but an INTERVAL, and could not say why. Here is why: those are the fits where
nothing rests on the margin at all, so no point has an equation to give. Sweep 40
samples and 7 values of C and collect every fit with an empty middle group:

  sample         C   free  bound            b     interval   position
  seed 1         1      0      2     0.149979     0.016885     0.5000
  seed 4      0.02      0     38     0.074612     0.215027     0.5000
  seed 4       0.1      0     28    -0.000818     0.118289     0.5000
  seed 5      0.02      0     40    -0.144153     0.939264     0.5000
  seed 6      0.02      0     36     0.023197     0.027314     0.5000
  seed 9       0.1      0     12     0.013215     0.022033     0.5000
  ... 21 such fits in all

  fits with nothing resting on the margin                        21
  where b sits along the interval, median                    0.5000
  of them within 0.001 of the exact middle                       21
  the one furthest from the middle                           0.5000

So when the data does not determine b, the library splits the difference. That is a
reasonable choice and it is a CHOICE -- there is no fact of the matter inside that
interval, and a different implementation could hand you a different number and be
equally correct. Page 8 measured an interval 0.0169 wide; at C = 0.01 it reached 1.47,
which relabels training points. Worth knowing that the quantity exists.`;

const outLoo = `One consequence of section 38 is sharper than it looks. Leave a point out and refit:
if that point was not a support vector, the model that comes back is the SAME model.
And a point with price 0 has functional margin at least 1, which means the model that
comes back classifies it correctly. So a non-support-vector can never produce a
leave-one-out error -- not usually, ever.

That is a claim with no tolerance in it, so it is worth running rather than quoting.
Twelve fits, every point left out in turn:

  sample         C   #sv  #sv/n loo errs    from a     bound
                                            non-sv     holds
  seed 0       0.1    45  0.750       17         0      True
  seed 0         1    37  0.617       17         0      True
  seed 1       0.1    12  0.200        0         0      True
  seed 1         1     3  0.050        0         0      True
  seed 2       0.1    24  0.400        1         0      True
  seed 2         1    11  0.183        2         0      True
  seed 3       0.1    28  0.467        3         0      True
  seed 3         1    13  0.217        1         0      True
  seed 4       0.1    43  0.717       11         0      True
  seed 4         1    25  0.417        7         0      True
  seed 5       0.1    58  0.967       30         0      True
  seed 5         1    54  0.900       32         0      True

  models refitted, one point held out each time                 720
  leave-one-out errors traced to a non-support-vector             0

Zero, over 720 refits. So the leave-one-out error COUNT is at most the number of
support vectors, and dividing by n gives a bound on the leave-one-out error rate that
you can read off a single fit without refitting anything. That is the theoretical
payoff of sparsity and it is genuinely free.

  the bound overstates the error count by, at least            1.69
  at worst                                                    24.00
  median                                                       3.74

Free, and loose. A bound that is 3.7 times the quantity it bounds will not choose a
model for you. It says something real -- an SVM with few support vectors cannot have a
bad leave-one-out error, whatever else is true of it -- and page 14 will want that
when the question is how many points a kernel model has to carry around.

Because the count is also the bill. A linear SVM collapses to one w, but a kernel one
cannot: scoring a single new point costs one kernel evaluation per support vector, so
the support set IS the model on disk and at prediction time.

         C      #sv   % of data kernel evals for 10k calls
     0.003     2870       95.7%                    28.7 M
      0.03     1171       39.0%                    11.7 M
       0.3      519       17.3%                     5.2 M
         3      364       12.1%                     3.6 M
        30      360       12.0%                     3.6 M

Same 3000 points, same kernel, and the model you have to keep ranges from 12% of the
training set to 96% of it. Page 7 said sparsity is a property of the fit rather than a
promise; this is the version of that sentence that shows up in a latency budget.`;
