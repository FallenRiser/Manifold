import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeOutput } from "@/components/CodeOutput";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { Quiz } from "@/components/Quiz";
import { HingeLossLab } from "@/components/labs/HingeLossLab";

const PINK = "var(--c-classification)";

export const metadata = {
  title: "The hinge loss — Manifold",
  description:
    "The slack variables were never really variables. Eliminating them turns the constrained soft-margin problem into an ordinary regularised loss — and that loss, the hinge, is a deliberate substitute for the one you actually care about.",
};

export default function HingeLossPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: PINK }, { label: "Core", color: "var(--c-fundamentals)" }]}
        time="about 15 minutes"
        title={<>The price list</>}
        intro={<>The soft-margin problem arrived with <M>{String.raw`n`}</M> extra variables and{" "}
          <M>{String.raw`2n`}</M> constraints, which makes it look like a considerably bigger
          thing than the hard margin. It is not. Every one of those slack variables has its value
          forced, and once they are substituted away what remains is an ordinary loss function
          with a penalty term — the same shape as ridge regression, and trainable by the same
          methods.</>}
        titleSize={42}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>Nothing is being decided</h2>
        <p>
          Look again at what the optimiser is allowed to do with a single{" "}
          <M>{String.raw`\xi_i`}</M>. Two constraints put a floor under it —{" "}
          <M>{String.raw`\xi_i \ge 1 - y_i f(x_i)`}</M> from the margin condition and{" "}
          <M>{String.raw`\xi_i \ge 0`}</M> outright — and the objective charges{" "}
          <M>{String.raw`C`}</M> for every unit of it. Paying for something you are not obliged to
          buy is never optimal, so the solver puts <M>{String.raw`\xi_i`}</M> flat on the higher of
          those two floors:
        </p>

        <MathBlock>{String.raw`\xi_i^\star = \max\left(0,\; 1 - y_i f(x_i)\right)`}</MathBlock>

        <p>
          That is not an approximation or a simplification for teaching. It is what the optimum
          must satisfy, for every point, in every instance. So the slack variables can be
          substituted out of the problem entirely, leaving an objective in{" "}
          <M>{String.raw`w`}</M> and <M>{String.raw`b`}</M> with no constraints attached:
        </p>

        <MathBlock>{String.raw`\min_{w,\,b}\; \tfrac{1}{2}\lVert w \rVert^{2} \;+\; C\sum_{i=1}^{n}\max\left(0,\; 1 - y_i\left(w^\top x_i + b\right)\right)`}</MathBlock>

        <p>
          That is worth stating carefully because it is easy to nod along to and easy to get
          wrong, so here is the same problem solved three independent ways — by a dual QP solver
          that never forms a <M>{String.raw`\xi`}</M> at all, by the constrained primal with all{" "}
          <M>{String.raw`n`}</M> slack variables present and optimised, and by the unconstrained
          form above over three numbers:
        </p>

        <CodeOutput source="scripts/svm_cases.py">{outUnconstrained}</CodeOutput>

        <p>
          Same objective value to six figures, same boundary to <strong>0.0000°</strong>, at every{" "}
          <M>{String.raw`C`}</M>. And the check underneath is the direct one: the constrained
          solver was free to set its sixty slack variables to anything, and it put every one of
          them on <M>{String.raw`\max(0, 1 - y_i f(x_i))`}</M> to within{" "}
          <strong>2.4 × 10⁻¹⁴</strong>.
        </p>

        <Callout color={PINK} title={<>You have seen this shape before</>}>
          <p>
            <M>{String.raw`\tfrac{1}{2}\lVert w\rVert^2 + C\sum_i \ell(y_i, f(x_i))`}</M> is a
            penalty on the coefficients plus a per-point loss — structurally identical to ridge
            regression, which is a penalty on the coefficients plus a squared error. Divide
            through by <M>{String.raw`C`}</M> and the SVM objective is{" "}
            <M>{String.raw`\sum_i \ell_i + \tfrac{1}{2C}\lVert w\rVert^2`}</M>, so{" "}
            <M>{String.raw`1/C`}</M> sits exactly where ridge&rsquo;s{" "}
            <M>{String.raw`\alpha`}</M> sits. The two families differ in <em>which loss</em>, not
            in how they are built. That is also why an SVM can be trained by plain gradient descent
            on this expression, which is what the labs in this track do.
          </p>
        </Callout>

        <h2>A loss standing in for another loss</h2>
        <p>
          The term that survived is the <strong>hinge</strong>,{" "}
          <M>{String.raw`\max(0, 1-z)`}</M> where <M>{String.raw`z = y f(x)`}</M>. It is worth
          being blunt about its status: it is not the thing anyone wants minimised. What anyone
          wants is the number of mistakes — the <strong>0-1 loss</strong>, 1 when a point is on the
          wrong side and 0 otherwise. The hinge is a stand-in, and stand-ins should be examined
          rather than accepted.
        </p>

        <CodeOutput source="scripts/svm_cases.py">{outSurrogate}</CodeOutput>

        <p>
          The top table establishes the relationship: the hinge is never <em>below</em> the 0-1
          loss, and at <M>{String.raw`z = 0`}</M> it is exactly 1 — it rests on top of the step
          right where the step happens. So the summed hinge is an upper bound on the mistake count,
          which is the formal reason minimising it is not absurd.
        </p>
        <p>
          The lower table is where the two are put side by side, and the first half is bad
          news. Minimising the
          hinge leaves about <strong>two more training mistakes</strong> than necessary, and it
          finds the genuine minimum in <strong>2 draws out of 30</strong>. Judged strictly as a
          method for minimising training errors, the hinge fails almost every time.
        </p>
        <p>
          Then read the test column. The boundary with the <em>fewest training mistakes</em> is the{" "}
          <em>worst of the three out of sample</em> — <strong>0.1800</strong> against the pure
          hinge&rsquo;s <strong>0.1664</strong>, with the best any line could possibly do sitting at
          0.1587. The surrogate is not a regrettable compromise forced by arithmetic. It is
          producing better classifiers than the exact answer to the stated question.
        </p>

        <Callout color={PINK} title={<>Why being exactly right about training data is a trap</>}>
          <p>
            The 0-1 loss cannot distinguish a point that crossed the boundary by a hair from one
            that is on completely the wrong side of the data. Both cost 1. So it will happily tilt
            the boundary hard toward a cluster of points it is already deeply wrong about, if doing
            so shaves off a single mistake somewhere else — a large change to the model bought with
            a tiny change in the objective. The hinge charges by <em>how far</em> a point is on the
            wrong side, so a point that is badly wrong keeps pulling and a point that barely
            crossed barely does. That extra information is worth more than the two training errors
            it costs.
          </p>
        </Callout>

        <PredictPrompt
          accent={PINK}
          prompt={<>The lab below rotates one boundary through a full turn and plots both losses
            underneath. What will the <strong>mistake count</strong> curve look like?</>}
          options={[
            "A smooth curve with a single clear minimum, like the hinge",
            "A staircase: long flat stretches with sudden jumps between them",
            "A straight line, since each degree of rotation costs a fixed number of errors",
            "Noise, with no discernible structure",
          ]}
        />

        <LabFrame
          accent={PINK}
          tryThis={<>Drag the angle slowly and watch the two readouts. The hinge changes on
            <em> every</em> step; the mistake count sits still for long stretches and then jumps.
            Then press <strong>fewest mistakes</strong> and <strong>lowest hinge</strong> in turn
            and compare where each one puts the line.</>}
          insight={<>This is the argument of the whole page in one picture. The staircase is flat
            across roughly <strong>85%</strong> of the turn, and flat means no gradient — standing
            anywhere on one of those treads, every direction looks identical, so there is nothing
            to tell you which way to move. Where it does change it does not slope, it jumps, often
            by two errors at once. The ramp underneath never sits still, so from any angle there is
            a way downhill. And the two buttons rarely agree: across many samples the minima sit
            about <strong>13°</strong> apart, which is the surrogate&rsquo;s cost from the table
            above, drawn.</>}
        >
          <HingeLossLab />
        </LabFrame>

        <h2>The count was never optimisable anyway</h2>
        <p>
          The measurements above compared the hinge against an exact 0-1 minimiser, which raises
          an obvious question: if that boundary can be found, why not just use it? Two reasons,
          and the first is visible in the lab:
        </p>

        <CodeOutput source="scripts/svm_cases.py">{outDescend}</CodeOutput>

        <p>
          The mistake count does not move on <strong>92.5%</strong> of the steps around a full
          turn. Gradient descent, Newton&rsquo;s method, subgradient descent and every other
          technique in the optimisation toolbox work by asking which way is downhill, and across
          almost the whole domain this objective answers &ldquo;nowhere&rdquo;. The remaining
          steps are worse, not better: it does not slope there, it jumps, by up to{" "}
          <strong>3 errors at once</strong>. The hinge meanwhile changes on{" "}
          <strong>every single step</strong> of the sweep.
        </p>
        <p>
          The second reason is the brute force itself. It worked because the data is
          two-dimensional: a boundary can be rotated until it rests on two points, so testing the
          line through every pair suffices, and the count of pairs grows with{" "}
          <M>{String.raw`n^2`}</M> — each doubling of the sample costing roughly four times the
          work. With <M>{String.raw`d`}</M> features the boundary rests on{" "}
          <M>{String.raw`d`}</M> points, the search runs over subsets of size{" "}
          <M>{String.raw`d`}</M>, and the exponent becomes the number of columns in your data.
          Minimising the mistake count exactly is not a slow method awaiting a faster
          implementation; it is a different kind of problem.
        </p>
        <p>
          What the hinge buys, then, is <strong>convexity</strong>. Every local minimum of that
          objective is the global one, there are no flat regions to strand a solver, and it can be
          reached by walking downhill from any starting point whatsoever. That is the trade the
          whole method rests on: give up being exactly right about the training data, and get a
          problem that can actually be solved.
        </p>
        <p>
          One feature of the hinge has been sitting in plain sight and not yet explained. It hits
          zero at <M>{String.raw`z = 1`}</M> and stays <em>exactly</em> zero forever after — not
          small, zero. A point out there contributes nothing to the objective and nothing to its
          gradient, so it cannot influence the boundary at all. That flat stretch is where support
          vectors come from, and the next page compares it against the loss that never quite
          reaches zero.
        </p>

        <Quiz
          accent={PINK}
          questions={[
            {
              q: <>Why can the slack variables be removed from the problem?</>,
              options: [
                "They are approximately zero for most points, so dropping them changes little",
                "Their optimal values are forced by the constraints and the objective, so they carry no free choice",
                "They only matter when the data is separable",
                "They are absorbed into the intercept",
              ],
              answer: 1,
              explain: <>The constraints put two floors under each{" "}
                <M>{String.raw`\xi_i`}</M> and the objective charges for every unit, so the optimum
                is always the higher floor, <M>{String.raw`\max(0, 1 - y_i f(x_i))`}</M>. Solving
                the constrained primal and the unconstrained form gave the same objective to six
                figures and the same boundary to 0.0000°.</>,
            },
            {
              q: <>The exact 0-1 minimiser had the fewest training errors but the worst test error
                of the three methods. What explains that?</>,
              options: [
                "It was overfitting by memorising individual training points",
                "The brute-force search had a bug",
                "0-1 treats a point that barely crossed the same as one that is badly wrong, so it will swing the boundary a long way to save one mistake",
                "The test set was drawn from a different distribution",
              ],
              answer: 2,
              explain: <>Because every mistake costs exactly 1 regardless of severity, a large
                movement of the boundary can be justified by a single point. The hinge weights by
                how far wrong a point is, which keeps the boundary responsive to the bulk of the
                data — 0.1664 against 0.1800.</>,
            },
            {
              q: <>What specifically makes the 0-1 loss unsuitable for gradient-based
                optimisation?</>,
              options: [
                "It is too expensive to evaluate",
                "It is flat almost everywhere, so the gradient is zero and no direction looks better than any other",
                "It is unbounded below",
                "It cannot be computed for misclassified points",
              ],
              answer: 1,
              explain: <>Across a full rotation of the boundary, 92.5% of steps left the mistake
                count completely unchanged, and the rest were discontinuous jumps of up to 3. There
                is no local slope to follow anywhere. The hinge changed on every step of the same
                sweep.</>,
            },
            {
              q: <>Where does <M>{String.raw`1/C`}</M> sit in the unconstrained objective?</>,
              options: [
                "Nowhere — C only scales the loss term",
                "Exactly where ridge regression's α sits, as the weight on the coefficient penalty",
                "As the learning rate",
                "As the margin width",
              ],
              answer: 1,
              explain: <>Dividing through by <M>{String.raw`C`}</M> gives{" "}
                <M>{String.raw`\sum_i \ell_i + \tfrac{1}{2C}\lVert w\rVert^2`}</M>. The SVM is a
                penalised loss of the same shape as ridge; what distinguishes it is which loss,
                not how it is assembled — which is also why it trains under ordinary gradient
                descent.</>,
            },
          ]}
        />
      </div>

      <PrevNext
        prev={{
          label: "Soft margin: slack & C",
          href: "/learn/support-vector-machines/soft-margin-slack-and-c",
        }}
        next={{
          label: "Hinge vs log loss, and where sparsity comes from",
          href: "/learn/support-vector-machines/hinge-vs-log-loss-and-sparsity",
        }}
      />
    </article>
  );
}

const outUnconstrained = `60 points from two overlapping clouds, solved THREE ways at each C:
  (a) sklearn, which solves the dual and never forms a xi at all;
  (b) the primal exactly as written, with n slack variables and 2n constraints;
  (c) xi eliminated -- an unconstrained minimisation over w and b only, 3 numbers.
If the elimination is valid, all three agree. Objective is (1/2)|w|^2 + C*sum(xi).

         C    (a) sklearn     (b) primal      (c) no xi   b vs a deg   c vs a deg
       0.1       1.918452       1.918452       1.918452       0.0000       0.0000
         1      13.095165      13.095164      13.095164       0.0000       0.0000
        10     113.410234     113.410219     113.410219       0.0000       0.0000

Route (b) optimises 60 real slack variables under constraints that only put a floor
under them. Compare what it chose against max(0, 1 - y f(x)) at the boundary it
returned, at C = 1:

  largest gap between the two, over 60 points     2.431e-14
  any xi above its own hinge by 1e-6 or more          False

  The solver could have set any xi as high as it liked and it put all 60 of them on
  max(0, 1 - y f(x)) to fourteen decimals. It had no choice: the constraints force
  xi >= 1 - y f(x) and xi >= 0, the objective charges for every unit, so the cheapest
  legal value is whichever of those two floors is higher. Nothing is being decided.
  Substituting that back leaves an objective in w and b alone, with no constraints:

      (1/2)|w|^2  +  C * sum_i max(0, 1 - y_i f(x_i))

  a penalty on w plus a per-point price. The second term is the HINGE, and the whole
  soft-margin construction is that loss and nothing else.`;

const outSurrogate = `Nobody wants the hinge minimised. The thing anyone wants is the count of mistakes,
the 0-1 loss. Pointwise, writing z = y f(x):

         z      hinge      0-1   what it means
      -2.0     3.0000        1   badly wrong
      -0.5     1.5000        1   wrong side
       0.0     1.0000        1   on the boundary
       0.5     0.5000        0   right side, inside the margin
       1.0     0.0000        0   exactly on the margin
       2.0     0.0000        0   correct and clear
       5.0     0.0000        0   correct and far

  The hinge is never below the 0-1 loss, and at z = 0 it equals exactly 1 -- it sits
  on top of the step at the one place the step moves. So the summed hinge is an upper
  bound on the mistake count. A bound is not the thing, though. How far apart are
  the two once they are minimised?

30 draws, 60 training points, 4000 test points, clouds 1.0 sigma apart. The exact
0-1 minimiser comes from brute force over every pair of points.

                                           train errors   test error
  soft-margin fit, C = 1                           9.17       0.1689
  pure hinge, no regulariser                       9.07       0.1664
  exact minimum 0-1, brute force                   6.97       0.1800
  best any line can do on this world                 --       0.1587

  draws where pure hinge hit the 0-1 optimum         2 of 30
  mean extra training errors it made                 2.10
  draws where the 0-1 optimum won on test            6 of 30

  The surrogate really does fail at the job as stated. Minimising the hinge leaves
  about two more training mistakes than necessary and reaches the true optimum in
  2 draws out of 30. Now read the test column: the boundary with the FEWEST training
  mistakes is the WORST of the three out of sample, 0.1800 against 0.1664.
  The 0-1 loss cannot tell a point that just barely crossed from one that is nowhere
  near, so it will tilt the boundary hard toward points it is already deeply wrong
  about in order to shave one mistake off. The hinge charges by HOW wrong a point is,
  and attending to that is worth more than the two training errors it costs.`;

const outDescend = `Rotate one boundary through a full turn in steps of 0.25 degrees, watching both.

                                                          0-1        hinge
  steps where the loss does not move at all             92.5%         0.0%
  distinct values over the sweep                           49         1440
  largest jump in one step                                  3         none
  angle of the minimum, degrees                        167.50       186.00

  The 0-1 loss is flat across 92.5% of the sweep. Flat means zero gradient, and zero
  gradient means nothing for a descent method to follow -- from almost anywhere every
  direction looks equally good. Where it is not flat it does not slope either; it
  jumps, by as much as 3 errors at once. There is no local information in it at all.
  The hinge never sits still, so from any starting point there is a way downhill.
  And the last row is the previous section's surrogate gap seen as an angle: the two
  minima are 18.5 degrees apart.

Brute force worked above only because the data is 2-D and small. Counting the
boundaries it has to test, which unlike a stopwatch means the same thing on any
machine:

         n     candidates    vs previous   per data point
        20            760             --             38.0
        40           3120          4.11x             78.0
        80          12640          4.05x            158.0
       160          50880          4.03x            318.0

  Every doubling of n costs roughly four times the work, because the count is one
  per PAIR of points. The fit does not enumerate anything, so none of this applies
  to it. And this is the easy case: the boundary rests on 2 points because there
  are 2 features. With d features it rests on d of them, so the search runs over
  subsets of size d and the exponent is the number of columns in the data.
  Minimising the mistake count exactly is not a slow approach waiting to be
  optimised; it is a different kind of problem.
  Convexity is what the hinge buys. Every local minimum is the global one, and a
  solver can walk downhill to it from anywhere.`;
