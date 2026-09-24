import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeOutput } from "@/components/CodeOutput";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { Quiz } from "@/components/Quiz";
import { ConvexBowlLab } from "@/components/labs/ConvexBowlLab";

const PINK = "var(--c-classification)";

export const metadata = {
  title: "The primal problem — Manifold",
  description:
    "The soft-margin SVM is a convex quadratic program. Stating it that way costs nothing and buys three things: a stock solver, one answer reached from any starting point, and a size you can read off in advance.",
};

export default function PrimalProblemPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: PINK }, { label: "Deep", color: "var(--c-fundamentals)" }]}
        time="about 15 minutes"
        title={<>A problem with a name</>}
        intro={<>Seven pages built an optimisation problem out of pictures: a corridor, a penalty
          for standing in it, a dial between the two. This chapter starts by writing that problem
          down in a form nobody has to have seen an SVM to work with — and it turns out to belong
          to a class that optimisation had already worked out in detail. Nothing about the
          boundary changes. What changes is everything you can now say about it.</>}
        titleSize={42}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>Everything the fit has to choose</h2>
        <p>
          The soft-margin problem as page 5 left it has three kinds of unknown: the direction{" "}
          <M>{String.raw`w`}</M>, the offset <M>{String.raw`b`}</M>, and one slack{" "}
          <M>{String.raw`\xi_i`}</M> per training point saying how far that point is allowed to
          fall short.
        </p>

        <MathBlock>{String.raw`\min_{w,\,b,\,\xi}\;\; \tfrac12\|w\|^2 + C\sum_{i=1}^{n}\xi_i \qquad\text{subject to}\qquad y_i(w^\top x_i + b) \ge 1-\xi_i,\quad \xi_i \ge 0`}</MathBlock>

        <p>
          This is called the <strong>primal</strong> problem: the original one, in the original
          unknowns, before anything clever happens to it. The name only earns its keep once there
          is a second form to contrast it with, which is two pages away. For now it is a label for
          the thing you already have.
        </p>

        <p>
          A general-purpose optimiser will not accept that as written, because it has no idea what{" "}
          <M>{String.raw`w`}</M> or <M>{String.raw`\xi_i`}</M> are meant to be. What it accepts is
          one vector of unknowns and some arrays. So stack them — <M>{String.raw`w`}</M>, then{" "}
          <M>{String.raw`b`}</M>, then every <M>{String.raw`\xi_i`}</M> — into a single{" "}
          <M>{String.raw`u`}</M>, and the problem becomes this:
        </p>

        <MathBlock>{String.raw`\min_u\;\; \tfrac12 u^\top P u + q^\top u \qquad\text{subject to}\qquad Gu \le h`}</MathBlock>

        <p>
          That shape has a name too, and it is the one that matters: a{" "}
          <strong>quadratic program</strong>. A quadratic objective, linear inequality constraints,
          nothing else. The translation is mechanical, and once it is done the four arrays are all
          that is left.
        </p>

        <CodeOutput source="scripts/svm_cases.py">{outPrimal}</CodeOutput>

        <p>
          Two details in there are worth slowing down for. The first is that{" "}
          <M>{String.raw`P`}</M> has exactly two nonzero entries: the objective is quadratic in{" "}
          <M>{String.raw`w`}</M> and flat in everything else. The second follows from it —{" "}
          <M>{String.raw`b`}</M> appears nowhere in <M>{String.raw`P`}</M> and nowhere in{" "}
          <M>{String.raw`q`}</M>, so nothing in the objective pushes back on it at all. The
          direction is regularised; the offset is free. That asymmetry is deliberate, and it has a
          consequence two sections down.
        </p>

        <Callout title="Why hand it to a solver that knows nothing" color={PINK}>
          Page 6 already put this problem in front of <code>scipy</code>, but with the constraints
          written as functions that close over the data. Here they do not: the solver receives a
          matrix and three vectors, and could not recover the labels from them if it tried. That is
          the difference between &ldquo;an optimiser can be talked into solving this&rdquo; and
          &ldquo;this <em>is</em> a quadratic program&rdquo; — and the second one is what lets you
          inherit everything already known about quadratic programs without proving any of it
          again.
        </Callout>

        <h2>Convex, and why the word is load-bearing</h2>
        <p>
          A quadratic program with a positive semi-definite <M>{String.raw`P`}</M> is{" "}
          <strong>convex</strong>: the surface has no separate valleys, no ridge that hides a lower
          basin behind it. Every local minimum is the global one. For a problem you intend to solve
          numerically, that is not a nicety — it is the difference between an answer and a report
          of where a search happened to stop.
        </p>

        <PredictPrompt
          accent={PINK}
          prompt={<>The lab below draws the objective as a surface over the two weights, and lets
            you drop a ball on it. If you drop it in four very different places, what will the four
            resting points look like?</>}
          options={[
            "Four different minima, since the surface has a kink at every point",
            "The same resting point every time",
            "Whichever is closest to where the ball landed",
            "Two: one per class",
          ]}
          nudge={<>Locked in. Drop the ball a few times below and see whether the resting
            point moves.</>}
        />

        <LabFrame
          accent={PINK}
          tryThis={<>Drop the ball in each corner in turn and watch where the path ends up. Then
            switch the surface to <strong>mistakes</strong> — the same weights, scored by how many
            training points they get wrong — and try dropping it again.</>}
          insight={<>Under the primal the ball always arrives at the same marked point, and the
            path is visibly a path: it runs downhill, kinking whenever it crosses a point&rsquo;s
            margin. Under the count of mistakes it does not move at all. That surface is made of
            flat terraces, so wherever the ball lands the ground under it is level in every
            direction and there is no downhill to follow. The two surfaces do not even share a
            bottom — page 6 measured what the hinge costs in mistakes. The difference on display
            here is the starker one: only one of them tells you which way down is.</>}
        >
          <ConvexBowlLab />
        </LabFrame>

        <p>
          The lab is a picture, so the same two claims get measured properly: that the surface
          really is convex, and that the starting point really does not matter.
        </p>

        <CodeOutput source="scripts/svm_cases.py">{outConvex}</CodeOutput>

        <p>
          Sixty starting points spanning three orders of magnitude, sixty identical answers.
          Against the same sixty starts, minimising the count of mistakes directly returns{" "}
          <strong>seventeen different answers</strong> ranging from a perfect fit to getting every
          single point wrong. Page 6 argued that the hinge is worth its inaccuracy; this is the
          same argument from the other side, in the only currency that counts — whether you can
          actually get to the bottom of the thing.
        </p>

        <p>
          The eigenvalue line is the fine print. <M>{String.raw`P`}</M> has two nonzero
          eigenvalues and forty-one zero ones, so the objective is convex but not{" "}
          <em>strictly</em> convex: in most directions it does not curve at all. Most of that
          flatness is held down by the constraints. One piece of it is not.
        </p>

        <h2>The part the problem leaves open</h2>
        <p>
          Look back at the restart table and one row does not fit. The sixty solutions agree about
          the direction to five decimal places and about the objective to ten figures — and then
          disagree about the offset in the <em>second</em> decimal. Somewhere between a
          discrepancy that size and a rounding error there is an explanation, and it is not that
          the solver was sloppy.
        </p>

        <p>
          Freeze <M>{String.raw`w`}</M> at its optimum. What is left is a sum of hinges in{" "}
          <M>{String.raw`b`}</M> alone — piecewise linear, with a kink wherever a point crosses
          the margin, and on each straight piece a slope that is a whole number, because it counts
          labels. Flat therefore means a slope of exactly zero, which is a thing you can test for
          rather than threshold.
        </p>

        <CodeOutput source="scripts/svm_cases.py">{outFlat}</CodeOutput>

        <p>
          So the sixty restarts were all correct. On this dataset at{" "}
          <M>{String.raw`C = 1`}</M> there is an interval of offsets{" "}
          <strong>0.017</strong> wide, every one of which achieves the identical objective, and
          the solvers simply stopped at different points inside it. sklearn returns the middle of
          it — to eight decimal places, which is not a coincidence.
        </p>

        <p>
          The mechanism is the count underneath: <strong>zero</strong> points resting on the
          margin. An offset is pinned by points sitting exactly <em>on</em> the margin line, one
          pressing up from each side. When the fit is held instead by points that have been pushed
          inside, nothing objects to the whole boundary sliding a little, and every offset in the
          gap is an optimum. Across 40 datasets at 5 values of <M>{String.raw`C`}</M>, that
          correspondence holds in both directions on all 200 fits — every flat one had nothing
          resting on the margin, and every fit with nothing resting on the margin was flat.
        </p>

        <Callout title="Where the looseness does real damage" color={PINK}>
          At <M>{String.raw`C = 0.01`}</M> the interval reaches <strong>1.47</strong> wide, and
          walking the offset from one end of it to the other changes the predicted label of twelve
          training points on average, with the objective unchanged to its last digit. Two
          implementations can therefore hand you measurably different classifiers and both be
          right. This is not a flaw to be fixed, it is a property of what was asked for: nothing in
          the objective ever expressed a preference among those offsets. If you need one pinned
          down, you have to say so — which is what regularising <M>{String.raw`b`}</M>, or picking
          the midpoint by convention, actually amounts to.
        </Callout>

        <h2>What it costs to solve</h2>
        <p>
          The last thing a named shape gives you is a size. Count the primal&rsquo;s unknowns:
          one per feature, one for the offset, one per training point. Count its constraints: two
          per training point. Both <M>{String.raw`n`}</M> and <M>{String.raw`d`}</M> are in there,
          which is unremarkable until you notice which one the rest of this chapter is about to
          attack.
        </p>

        <CodeOutput source="scripts/svm_cases.py">{outShape}</CodeOutput>

        <p>
          The top table is comfortable and the bottom one is not. Every kernel in this chapter is a
          promise about a feature space that never gets built, and the last column is why the
          promise has to be kept: a degree-3 expansion of the digits pixels needs a{" "}
          <M>{String.raw`P`}</M> of <strong>19.8 GB</strong>, and an RBF needs one with infinitely
          many rows. The primal is not merely expensive there. It cannot be written down.
        </p>

        <p>
          The dual form that the next two pages build is the same problem with the same answer, and
          it carries one unknown per training point and nothing at all per feature —{" "}
          <strong>765 times smaller</strong> than the degree-3 primal, and exactly that same size
          for the RBF, for a degree-9 polynomial, for anything. That ratio is the entire reason the
          next two pages exist. Nothing in this chapter is going to improve the boundary; pages 1
          to 7 already specified it completely. What changes is whether you can get to it.
        </p>

        <h2>Check yourself</h2>
        <Quiz
          accent={PINK}
          questions={[
            {
              q: <>Two general-purpose solvers reproduced sklearn&rsquo;s boundary from nothing
                but <M>{String.raw`P`}</M>, <M>{String.raw`q`}</M>, <M>{String.raw`G`}</M> and{" "}
                <M>{String.raw`h`}</M>. What does that establish?</>,
              options: [
                "That sklearn is using scipy internally",
                "That the SVM is a quadratic program, so results proved about quadratic programs apply to it without further argument",
                "That SLSQP is the right solver for SVMs",
                "That the constraints were redundant",
              ],
              answer: 1,
              explain: <>The arrays contain no labels, no features, no notion of a margin — the
                solvers were handed a shape and returned the same boundary. Membership of that
                class is what everything in this chapter is built on.</>,
            },
            {
              q: <>The count of mistakes returned seventeen different answers from sixty starts;
                the primal returned one. Which property is responsible?</>,
              options: [
                "Convexity: the primal has a single basin, the mistake count is flat everywhere with jumps between levels",
                "The primal uses more variables",
                "Nelder-Mead is a worse solver than SLSQP",
                "The mistake count is not bounded below",
              ],
              answer: 0,
              explain: <>The mistake count is bounded below and does have a global minimum. The
                problem is that it is piecewise constant, so no local information points towards
                that minimum — the lab shows the same thing as terraces the ball cannot roll
                down.</>,
            },
            {
              q: <>Sixty restarts agreed on <M>{String.raw`w`}</M> and disagreed on{" "}
                <M>{String.raw`b`}</M> in the second decimal. Why?</>,
              options: [
                "One of them had not converged",
                "The objective is strictly convex in w but flat in b over an interval, so many offsets are equally optimal",
                "Floating-point error accumulates in the intercept",
                "The data was not separable",
              ],
              answer: 1,
              explain: <>Nothing in the objective penalises <M>{String.raw`b`}</M>, and on this
                fit no training point rested on the margin to pin it. Every offset in an interval
                0.017 wide achieved the identical objective, and the solvers stopped at different
                points inside it.</>,
            },
            {
              q: <>Why does a degree-3 polynomial expansion make the primal unusable on the digits
                dataset?</>,
              options: [
                "The constraints stop being linear",
                "The problem stops being convex",
                "The unknowns include one per feature, and the expansion has 47,904 features — so P alone is 19.8 GB",
                "Too many support vectors",
              ],
              answer: 2,
              explain: <>The number of constraints only depends on <M>{String.raw`n`}</M> and
                barely moves. It is the unknowns that blow up, because the primal carries one for
                every feature — and an RBF has infinitely many.</>,
            },
          ]}
        />
      </div>

      <PrevNext
        prev={{
          label: "Hinge vs log loss, and where sparsity comes from",
          href: "/learn/support-vector-machines/hinge-vs-log-loss-and-sparsity",
        }}
        next={{
          label: "Lagrangian duality & the KKT conditions",
          href: "/learn/support-vector-machines/lagrangian-duality-and-kkt",
        }}
      />
    </article>
  );
}

const outPrimal = `Pages 1 to 7 wrote the soft-margin problem in SVM words. Written in the words an
optimiser uses, it is a QUADRATIC PROGRAM -- minimise a quadratic subject to linear
inequalities -- and the translation is total: four arrays come out, and not one
entry in them knows what a margin is.

Four points and two features, so the arrays fit on a screen. Every unknown the fit
has to choose stacks into one vector u = [w1 w2 | b | xi1 xi2 xi3 xi4], 7 numbers.

  P, the quadratic term (7x7)        q, the linear term
       1  0  0  0  0  0  0            0        <- w1
       0  1  0  0  0  0  0            0        <- w2
       0  0  0  0  0  0  0            0        <- b
       0  0  0  0  0  0  0            1        <- xi1
       0  0  0  0  0  0  0            1        <- xi2
       0  0  0  0  0  0  0            1        <- xi3
       0  0  0  0  0  0  0            1        <- xi4

  2 nonzero entries in P out of 49, and both of them belong to w. C = 1 sits in q,
  once per slack variable. Nothing anywhere penalises b -- that is a real asymmetry,
  and section 30 is what it costs.

  G and h, one row per constraint (8x7):
       -1.20  -0.40  -1.00  -1.00   0.00   0.00   0.00   <=  -1.0    y1(w.x1 + b) + xi1 >= 1
       -0.30  -1.10  -1.00   0.00  -1.00   0.00   0.00   <=  -1.0    y2(w.x2 + b) + xi2 >= 1
       -0.90  -0.20   1.00   0.00   0.00  -1.00   0.00   <=  -1.0    y3(w.x3 + b) + xi3 >= 1
       -0.40  -1.30   1.00   0.00   0.00   0.00  -1.00   <=  -1.0    y4(w.x4 + b) + xi4 >= 1
        0.00   0.00   0.00  -1.00   0.00   0.00   0.00   <=   0.0    xi1 >= 0
        0.00   0.00   0.00   0.00  -1.00   0.00   0.00   <=   0.0    xi2 >= 0
        0.00   0.00   0.00   0.00   0.00  -1.00   0.00   <=   0.0    xi3 >= 0
        0.00   0.00   0.00   0.00   0.00   0.00  -1.00   <=   0.0    xi4 >= 0

Now the real check. 40 points, and the four arrays handed to two general-purpose
solvers -- one sequential-quadratic, one interior-point -- against sklearn, which
solves a different form of the problem with an algorithm written for SVMs:

  C      solver                     objective     angle vs SVC   worst violation
  0.1    sklearn SVC             0.6195798223               --                --
         scipy SLSQP             0.6195798207         8.54e-07          0.00e+00
         scipy trust-constr      0.6195887434         8.51e-05          0.00e+00
  1      sklearn SVC             1.0620672004               --                --
         scipy SLSQP             1.0620672004         1.21e-06          3.90e-13
         scipy trust-constr      1.0620676737         7.14e-06          0.00e+00
  10     sklearn SVC             1.0661745520               --                --
         scipy SLSQP             1.0661744654         1.30e-05          0.00e+00
         scipy trust-constr      1.0661766199         2.26e-05          0.00e+00

  worst angle against sklearn, degrees                   8.51e-05
  best angle against sklearn, degrees                    8.54e-07

Six solves, and the worst of them puts the boundary a ten-thousandth of a
degree away from the answer a purpose-built SVM routine returns. The objective
agrees to ten figures for one solver and to six for the other, which is a fact
about their stopping rules rather than about the problem. The SVM is not an
algorithm here -- it is a shape, and optimisation had catalogued that shape long
before anyone pointed it at classifying anything.`;

const outConvex = `Convex is the word that makes the rest of this chapter safe, so it gets tested
rather than quoted. Convex means a chord never dips below the curve; the midpoint
is the cheapest case of that to check, and the feasible set gets the same test.

  50000 random pairs of feasible points
    midpoints where the objective beat the average of the two ends: 0
    midpoints that fell outside the feasible set:                   0

  eigenvalues of the quadratic term: 2 at 1, 41 at 0
    convex, then, but not STRICTLY convex: 41 of the 43 directions are flat.
    Hold that thought. Section 30 is about where the flatness survives.

What convexity is supposed to buy is that the starting point stops mattering. So:
60 starts spread over four scales, each one made feasible by handing it whatever
slack its own boundary happens to need.

  objective at the start                              3.2 to 2353.2
  objective at the finish, lowest                      1.0620672000
  objective at the finish, highest                     1.0620672004
  spread across the 60 finishes                            4.26e-10
  worst disagreement about direction, degrees              2.59e-05
  spread of the offset b                                   1.69e-02

  runs that returned a failure flag                        18 of 60
  worst objective among those, above the best              4.15e-10
  worst direction among those, degrees                     8.83e-06

  Every one of the 60 landed on the same objective to ten figures and the same
  direction to five decimal places, from starts three orders of magnitude apart.
  The failure flags are worth keeping in the table rather than filtering out:
  18 runs reported that the line search had stalled, and all 18 of them were
  standing on the answer when they said it. Convex settles where the bottom is,
  not how gracefully a solver arrives. The offset is the odd row out, and that one
  is not solver trouble at all -- section 30.

For contrast, the same 60 starts on the objective you actually care about -- the
count of mistakes from page 6 -- which is not convex:

  distinct answers returned                                      17
  mistakes, best and worst                                  0 to 40
  starts that reached the best value found                 21 of 60

  Same data, same starts, same solver family, 17 different answers to the same
  question. That gap is what the shape buys, and it is why the thing being
  minimised is the hinge.`;

const outFlat = `Section 29 left a loose end: 60 restarts agreed about the direction to five decimal
places and disagreed about the offset in the second. Chasing that down is worth a
section, because the answer turns out to be that all 60 of them were right.

Fix w at the optimum and what is left is a sum of hinges in b alone: piecewise
linear, with a kink wherever a point crosses the margin, and on each piece a slope
that is a whole number. Flat means a slope of exactly zero, so it is testable.

  lowest offset achieving the optimum                  0.141536
  highest offset achieving the optimum                 0.158421
  width of the interval                                0.016885
  what sklearn returns                                 0.149979
  its distance from the midpoint                       1.22e-08
  objective at one end minus the other                 0.00e+00

  points resting exactly ON the margin                        0
  points pushed inside it                                     2

  There is the mechanism. The offset is held in place by points resting on the
  margin, one pressing from each side. With nothing resting there, nothing objects
  to the boundary sliding, and every offset in the interval is an optimum.

How often, and does it matter? 40 datasets at 5 values of C, counting an interval
as real only above 1e-4 -- below that it is two copies of one number:

  C           flat     widest    resting on it   labels changed
  0.01     33/40       1.4696             0.35            12.06
  0.1       3/40       0.1183             2.33             0.67
  1         3/40       0.0328             2.38             0.00
  10        0/40       0.0000             2.77             0.00
  100       0/40       0.0000             2.83             0.00

  fits whose optimal offset is a genuine interval          39 of 200
  of those, fits with nothing resting on the margin        39 of 39
  fits with nothing resting on it that were NOT flat        0 of 39

  The correspondence holds in both directions across all 200 fits. And at C = 0.01
  it is not a rounding matter: the interval reaches 1.47 wide, and walking the
  offset from one end to the other relabels twelve training points on average
  without changing the objective in its last digit.`;

const outShape = `The primal carries one unknown per feature, one for the offset, one per training
point, and two constraints per training point. Both n and d are in there, so
neither of them decides the size on its own.

  dataset                 n        d      unknowns    constraints
  two blobs              40        2            43             80
  breast_cancer         569       30           600           1138
  digits               1797       64          1862           3594

Comfortable, and it stays comfortable right until d stops being a property of the
data. Every kernel in this chapter is a promise about a feature space you never
build. Here is what building one would have cost on digits:

  feature space                         d     unknowns  the P array alone
  the pixels themselves                64         1862              28 MB
  degree-2 polynomial                2144         3942             124 MB
  degree-3 polynomial               47904        49702            19.8 GB
  RBF                            infinite           --   cannot be formed

The dual form of the same problem, which the next two pages build, carries one
unknown per training point and nothing whatsoever per feature:

  unknowns                                                 1797
  equality constraints                                        1
  the matrix it needs, at any d                         25.8 MB

  Smaller than the degree-3 primal by a factor of 765, and exactly that size for the
  RBF, for a degree-9 polynomial, for anything at all. That ratio is the reason the
  next two pages exist. Nothing in this chapter improves the boundary -- pages 1 to
  7 already specified it completely. What changes is whether you can reach it.`;
