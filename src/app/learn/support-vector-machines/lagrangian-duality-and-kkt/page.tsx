import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeOutput } from "@/components/CodeOutput";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { Quiz } from "@/components/Quiz";
import { DualityLab } from "@/components/labs/DualityLab";

const PINK = "var(--c-classification)";

export const metadata = {
  title: "Lagrangian duality & the KKT conditions — Manifold",
  description:
    "Give every constraint a price and a constrained problem becomes an unconstrained one with a lower bound attached. At the optimum a constraint can have a price or it can have room, never both — which is where support vectors come from.",
};

export default function DualityKktPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: PINK }, { label: "Deep", color: "var(--c-fundamentals)" }]}
        time="about 16 minutes"
        title={<>What the rules are worth</>}
        intro={<>Constraints are awkward to optimise against and easy to bargain with. This page
          swaps one for the other: instead of forbidding a violation, charge for it. Doing that
          turns out to hand you a second version of the problem, a certificate that your answer is
          the best one, and — almost incidentally — the reason an SVM only remembers a handful of
          its training points.</>}
        titleSize={42}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>Charging instead of forbidding</h2>
        <p>
          Take any constrained minimisation. Rather than insisting a constraint holds, attach a
          non-negative number <M>{String.raw`\lambda_i`}</M> to it and add{" "}
          <M>{String.raw`\lambda_i \times (\text{how badly it is violated})`}</M> to the objective.
          The result is the <strong>Lagrangian</strong>, and it has no constraints left in it at
          all:
        </p>

        <MathBlock>{String.raw`L(u, \lambda) \;=\; \underbrace{\tfrac12 u^\top P u + q^\top u}_{\text{the objective}} \;+\; \underbrace{\lambda^\top (Gu - h)}_{\text{the charge}}, \qquad \lambda \ge 0`}</MathBlock>

        <p>
          Minimise that over <M>{String.raw`u`}</M> with nothing held back and you get a number
          that depends only on the prices. Call it <M>{String.raw`g(\lambda)`}</M>. Here is the
          fact the rest of the chapter rests on, and it takes one line to see: any{" "}
          <M>{String.raw`u`}</M> that actually satisfies the constraints has{" "}
          <M>{String.raw`Gu - h \le 0`}</M>, so with <M>{String.raw`\lambda \ge 0`}</M> the charge
          is zero or negative, so <M>{String.raw`L`}</M> is at most the objective there. And{" "}
          <M>{String.raw`g`}</M> minimises over <em>everything</em>, feasible or not, so it comes
          in at or below that.
        </p>

        <MathBlock>{String.raw`g(\lambda) \;\le\; p^\star \quad \text{for every } \lambda \ge 0 \qquad\qquad \text{(weak duality)}`}</MathBlock>

        <p>
          Every choice of prices buys a lower bound on the answer, for free, without solving
          anything. The obvious next question is how good that bound can get.
        </p>

        <CodeOutput source="scripts/svm_cases.py">{outLagrangian}</CodeOutput>

        <p>
          Twenty thousand random price pairs, not one of which came in above the answer, and a
          best set of prices that closes the gap to <strong>1.9 × 10⁻¹⁵</strong>. That the gap
          closes at all is <strong>strong duality</strong>, and it is not automatic — it needs the
          problem to be convex and to have a strictly feasible point, which is Slater&rsquo;s
          condition and which the soft-margin SVM satisfies for any{" "}
          <M>{String.raw`C > 0`}</M> (take <M>{String.raw`w = 0`}</M> and every{" "}
          <M>{String.raw`\xi_i = 2`}</M>). Page 8&rsquo;s convexity was not a decoration; this is
          what it was for.
        </p>

        <Callout title="Two different prices, one page apart" color={PINK}>
          Page 6 called the hinge a price list, and that was a charge per <em>point</em> for being
          on the wrong side — part of what you chose to minimise. These prices are attached to{" "}
          <em>constraints</em>, and nobody chooses them: they come out of the problem, one per
          constraint, and they measure what that constraint costs you. The two happen to meet in
          the SVM, because there the constraints are per point.
        </Callout>

        <PredictPrompt
          accent={PINK}
          prompt={<>In the lab below the second constraint, <M>{String.raw`x \ge 0.5`}</M>, is
            comfortably satisfied at the optimum. What happens to the bound as you raise its
            price above zero?</>}
          options={[
            "It improves — more pressure always tightens a bound",
            "It gets worse, and keeps getting worse",
            "Nothing changes, since the constraint is satisfied anyway",
            "It improves up to a point and then falls away",
          ]}
          nudge={<>Locked in. Slide the second price up and watch both the dot and the curve.</>}
        />

        <LabFrame
          accent={PINK}
          tryThis={<>Walk the first price up from 0 and watch the dot march out from the origin.
            At <strong>1.00</strong> it lands exactly on the ringed answer and the curve touches
            the dashed line. Keep going and it overshoots. Then raise the second price and watch
            what a charge on a constraint that was never a problem does to you.</>}
          insight={<>The dot is where the priced problem bottoms out. At low prices it sits inside
            the forbidden region — the charge is too small to push it out — so it reports a number
            below the real answer. Raise the price and it is pushed to the boundary; at exactly
            the right price it stops on the answer itself and the bound is no longer a bound but
            the thing itself. The second price only ever makes the bound worse, because the
            constraint it charges for was not costing anything. A constraint with room to spare is
            worth nothing, and that sentence does all the work on the rest of this page.</>}
        >
          <DualityLab />
        </LabFrame>

        <h2>Four conditions that pin down the answer</h2>
        <p>
          When strong duality holds, the primal solution and the prices are locked together by
          four conditions — the <strong>Karush-Kuhn-Tucker</strong> conditions. They are not deep;
          each one says something you would say anyway.
        </p>

        <MathBlock>{String.raw`\begin{aligned}
\textbf{stationarity} &: \quad \nabla_u L(u^\star, \lambda^\star) = 0 \\
\textbf{primal feasibility} &: \quad Gu^\star \le h \\
\textbf{dual feasibility} &: \quad \lambda^\star \ge 0 \\
\textbf{complementary slackness} &: \quad \lambda_i^\star \,(Gu^\star - h)_i = 0 \ \text{ for every } i
\end{aligned}`}</MathBlock>

        <p>
          The last one is the interesting one. It says the product of a price and its
          constraint&rsquo;s slack is zero — so for each constraint separately, either the price is
          zero or the constraint is exactly tight. Never both nonzero. Written out for the
          soft-margin SVM, where each point contributes a margin constraint with price{" "}
          <M>{String.raw`\alpha_i`}</M> and a slack constraint with price{" "}
          <M>{String.raw`C - \alpha_i`}</M>, the conditions read:
        </p>

        <MathBlock>{String.raw`w = \sum_i \alpha_i y_i x_i, \quad \sum_i \alpha_i y_i = 0, \quad 0 \le \alpha_i \le C, \quad \alpha_i\big(y_i f(x_i) - 1 + \xi_i\big) = 0`}</MathBlock>

        <CodeOutput source="scripts/svm_cases.py">{outKkt}</CodeOutput>

        <p>
          Read the first line again: <M>{String.raw`w`}</M> came out of a general-purpose solver
          that was handed the four arrays from page 8 and never computed a single{" "}
          <M>{String.raw`\alpha`}</M>, and the prices came out of sklearn, which solves the
          problem in the prices and never builds a single <M>{String.raw`\xi`}</M>. They agree to{" "}
          <strong>3.5 × 10⁻⁸</strong> on a quantity neither of them was asked for. That is the
          check worth having; the two runs could not have coordinated.
        </p>

        <p>
          And the three-way table is the entire geography of an SVM, falling out of one product
          being zero:
        </p>

        <ul>
          <li>
            <strong>Price 0.</strong> 24 of the 40 points. Their constraint has room —{" "}
            <M>{String.raw`y f(x)`}</M> from 1.17 up to 4.43 — so the price must be zero, so by
            the stationarity line they contribute nothing to <M>{String.raw`w`}</M>. These are the
            points page 7 deleted without moving the boundary. Here it is not an observation about
            a derivative, it is a condition the solution has to satisfy.
          </li>
          <li>
            <strong>Price strictly between 0 and C.</strong> 3 points, with{" "}
            <M>{String.raw`y f(x)`}</M> reading <strong>1.0000 to 1.0000</strong>. A nonzero price
            forces the constraint tight, and tight means resting exactly on the margin line. That
            is not a coincidence in the data; it is complementary slackness read in the other
            direction.
          </li>
          <li>
            <strong>Price pinned at C.</strong> 13 points, all of them with slack{" "}
            <M>{String.raw`\xi_i > 0`}</M>, running to 2.98 — well past the boundary. Once a point
            needs slack, the price on its <M>{String.raw`\xi_i \ge 0`}</M> constraint must be zero,
            which by <M>{String.raw`\alpha_i + \mu_i = C`}</M> pushes{" "}
            <M>{String.raw`\alpha_i`}</M> all the way to <M>{String.raw`C`}</M>. A point can only
            pull so hard.
          </li>
        </ul>

        <Callout title="Where page 8's loose offset came from" color={PINK}>
          The middle group is the one that pins <M>{String.raw`b`}</M>. Page 8 found that the
          optimal offset is sometimes a whole interval, and that this happened on exactly the fits
          with nothing resting on the margin — which is to say, exactly the fits where the middle
          group is empty. With every support vector pushed inside, every price is stuck at{" "}
          <M>{String.raw`C`}</M>, and none of them says anything about where the boundary should
          sit along its own normal. The measurement on page 8 and the condition here are the same
          fact from two directions.
        </Callout>

        <h2>A price is a derivative</h2>
        <p>
          Calling <M>{String.raw`\lambda_i`}</M> a price is a metaphor until it predicts a number.
          It does. The multiplier is exactly the rate at which the optimum changes when you move
          that constraint — relax the <M>{String.raw`i`}</M>th requirement by{" "}
          <M>{String.raw`\varepsilon`}</M> and the best achievable objective drops by{" "}
          <M>{String.raw`\lambda_i \varepsilon`}</M>. So it is testable by brute force: nudge one
          constraint, re-solve from scratch, and see whether the answer moved by what the price
          said it would.
        </p>

        <CodeOutput source="scripts/svm_cases.py">{outPrices}</CodeOutput>

        <p>
          Every priced point moves the optimum by its price, to{" "}
          <strong>7.3 × 10⁻⁸</strong> relative. Every unpriced point moves it by{" "}
          <strong>3 × 10⁻¹³</strong>, which is the solver returning the same answer twice. So{" "}
          <M>{String.raw`\alpha_i`}</M> is a genuine measure of how much point{" "}
          <M>{String.raw`i`}</M> matters to the fit, on a scale where zero means nothing at all —
          and the three-way table says most points score zero.
        </p>

        <p>
          That is the whole of what duality has bought so far: an interpretation. Page 10 cashes it
          in for something structural, by taking the four conditions above and substituting them
          back into <M>{String.raw`L`}</M> until every trace of{" "}
          <M>{String.raw`w`}</M>, <M>{String.raw`b`}</M> and <M>{String.raw`\xi`}</M> is gone. What
          is left is a problem in the prices alone — and the only thing it knows about the data is
          the inner products between pairs of points, which is the door the kernel walks through.
        </p>

        <Callout title="Same machine, pointed elsewhere" color={PINK}>
          Support vector regression runs this identical argument with the tube constraints in
          place of the margin ones, ending up with two prices per point rather than one. If you
          have read that track&rsquo;s{" "}
          <a href="/learn/support-vector-regression/the-dual-and-the-kernel-trick">
            dual and kernel trick
          </a>{" "}
          page, the shape of what happens next will already be familiar — the machinery is not
          specific to classification, or to either model.
        </Callout>

        <h2>Check yourself</h2>
        <Quiz
          accent={PINK}
          questions={[
            {
              q: <>Why is <M>{String.raw`g(\lambda)`}</M> a lower bound on the primal optimum for{" "}
                <em>any</em> <M>{String.raw`\lambda \ge 0`}</M>?</>,
              options: [
                "Because the Lagrangian is convex",
                "Because at a feasible point the charge is never positive, so L is at most the objective there — and g minimises over all points, feasible or not",
                "Because strong duality holds for this problem",
                "Because the constraints are linear",
              ],
              answer: 1,
              explain: <>It is two inequalities in a row and needs nothing about convexity — weak
                duality holds for every optimisation problem. Convexity is what makes the bound{" "}
                <em>tight</em>, which is a separate claim.</>,
            },
            {
              q: <>A training point has <M>{String.raw`y_i f(x_i) = 2.6`}</M>. What does
                complementary slackness force?</>,
              options: [
                "Its slack is positive",
                "Its price is C",
                "Its price is exactly zero, so it contributes nothing to w",
                "Nothing — the condition only applies to support vectors",
              ],
              answer: 2,
              explain: <>The constraint <M>{String.raw`y_i f(x_i) \ge 1 - \xi_i`}</M> is satisfied
                with room, so its slack is nonzero, so the product can only be zero if the price
                is. And since <M>{String.raw`w = \sum \alpha_i y_i x_i`}</M>, a price of zero means
                that point is not in the model at all.</>,
            },
            {
              q: <>Three points had prices strictly between 0 and C, and all three sat at{" "}
                <M>{String.raw`y f(x) = 1.0000`}</M>. Why must that be so?</>,
              options: [
                "Because they were the closest points to the boundary",
                "A nonzero price forces its constraint to be tight, and tight means exactly on the margin line",
                "Because C was 1",
                "It is a numerical coincidence of this dataset",
              ],
              answer: 1,
              explain: <>Complementary slackness read the other way round. Nonzero price ⟹ zero
                slack in the constraint ⟹ the constraint holds with equality. Their price is below{" "}
                <M>{String.raw`C`}</M> because they need no <M>{String.raw`\xi_i`}</M>.</>,
            },
            {
              q: <>Relaxing the constraint of a point with price 0 moved the optimum by 3 × 10⁻¹³.
                What is that number?</>,
              options: [
                "The accumulated floating-point error of the solver over many iterations",
                "Nothing at all — the same optimum, re-solved, because loosening a requirement that was not binding cannot change the answer",
                "A small but real improvement",
                "Evidence the price should not have been exactly zero",
              ],
              answer: 1,
              explain: <>The constraint had room before the nudge and has slightly more after, so
                the feasible set changed in a region the optimum was never near. The answer is
                identical and the digits are just how identical looks in floating point.</>,
            },
          ]}
        />
      </div>

      <PrevNext
        prev={{
          label: "The primal problem",
          href: "/learn/support-vector-machines/the-primal-problem",
        }}
        next={{
          label: "The dual problem",
          href: "/learn/support-vector-machines/the-dual-problem",
        }}
      />
    </article>
  );
}

const outLagrangian = `Minimise (1/2)(x^2 + y^2) subject to x + y >= 2 and x >= 0.5. Two variables, two
constraints, and an answer you can check by eye: the closest point to the origin on
the line x + y = 2 is (1, 1), which also clears x >= 0.5 with room to spare.

  solved as a constrained problem:  x = 1.000000, y = 1.000000, objective 1.0000000000

Now give each constraint a PRICE and charge for violating it instead of forbidding
it. The Lagrangian is the objective plus price times violation, and for any prices
you like it can be minimised with no constraints at all:

  L(x, y, lam) = (1/2)(x^2 + y^2) + lam1*(2 - x - y) + lam2*(0.5 - x)

Whatever the prices, the unconstrained minimum of L is a LOWER BOUND on the answer
above -- a feasible point pays the objective and a non-negative charge, so it can
never come in under L. Walking the first price up and leaving the second at zero:

  prices                      the bound  where L bottoms out
  lam = (0, 0)                 0.000000       (0.000, 0.000)
  lam = (0.25, 0)              0.437500       (0.250, 0.250)
  lam = (0.5, 0)               0.750000       (0.500, 0.500)
  lam = (0.75, 0)              0.937500       (0.750, 0.750)
  lam = (1, 0)                 1.000000       (1.000, 1.000)
  lam = (1.25, 0)              0.937500       (1.250, 1.250)
  lam = (1.5, 0)               0.750000       (1.500, 1.500)
  lam = (2, 0)                 0.000000       (2.000, 2.000)

  Every one of them is below 1.0000, and the best of them touches it exactly.
  Prices that are too low do not squeeze hard enough; prices that are too high push
  the minimum out past the constraint and the bound falls away again.

  random price pairs tried                                20000
  how many came in above the answer                           0
  best bound any of them gave                        0.99940084
  best bound the optimiser found                   1.0000000000
  its distance from the constrained answer             1.89e-15
  the prices that achieve it                     (1.000000, 0.000000)

Not one of 20000 random price pairs produced a bound above the answer, and the best
prices close the gap to nothing. Two things to take from the last row. The first
price is 1: raise the requirement from 2 to 2.001 and the answer goes up by about
0.001. The second is 0, and that constraint is the one with slack -- the optimum
sits at x = 1, well clear of x >= 0.5, so the requirement is worth nothing. Being
satisfied comfortably and being worth zero are the same statement.`;

const outKkt = `40 points, C = 1, solved twice over. sklearn solves a form of the problem written in
the prices and never builds a single slack variable. SLSQP is handed the primal
arrays from section 28 and never hears the word price. If the conditions below are
real, the two runs have to agree about things neither of them computed.

  STATIONARITY -- the prices rebuild the primal answer
    |w from SLSQP  -  sum a_i y_i x_i|                      3.494e-08
    sum a_i y_i, which has to vanish                        0.000e+00

  DUAL FEASIBILITY -- a price is never negative, and never above C
    smallest price                                          0.000e+00
    largest price (C = 1)                                    1.000000

  PRIMAL FEASIBILITY -- the answer satisfies what was asked
    worst violation of y(w.x + b) >= 1 - xi                 1.332e-14
    most negative slack                                    -6.144e-16

  COMPLEMENTARY SLACKNESS -- price times slack, for every single point
    worst |a_i * (y_i f_i - 1 + xi_i)|                      1.443e-14
    worst |(C - a_i) * xi_i|                                6.106e-15

The last pair is the one that matters. It says a point can have a price or it can
have room, never both. That sorts every training point into exactly three kinds:

                                points       y f(x) range            slack
  price 0, room to spare            24   1.1742 to 4.4305 0.0000 to 0.0000
  price between 0 and C              3   1.0000 to 1.0000 0.0000 to 0.0000
  price pinned at C                 13  -1.9829 to 0.8820 0.1180 to 2.9829

  smallest price in the middle group                   0.584911
  largest price in the middle group                    0.844637

The first group is 24 of the 40 points. Their price is zero, so by the stationarity
line above they contribute nothing to w -- they could be deleted and the sum would
be unchanged. That is the sparsity page 7 measured, arriving here as a consequence
rather than an observation. The other two groups are the support vectors, and the
difference between them is whether the point is resting on the margin or has been
pushed through it.`;

const outPrices = `Calling a multiplier a price is a claim with a number in it: move one constraint by
a whisker and the optimum should shift by the price times the whisker, and by
nothing else. Nothing below was fitted to make that come out -- the prices come from
sklearn, and each movement is the primal re-solved from scratch, twice, once in each
direction.

  point                            its price     predicted      measured       error
  resting on the margin, #16        0.844637    -8.446e-04    -8.446e-04     2.3e-08
  resting on the margin, #27        0.584911    -5.849e-04    -5.849e-04     7.3e-08
  resting on the margin, #39        0.740274    -7.403e-04    -7.403e-04     2.9e-08
  pushed inside it, #1              1.000000    -1.000e-03    -1.000e-03     4.0e-11
  pushed inside it, #3              1.000000    -1.000e-03    -1.000e-03     9.2e-10
  outside, with room, #0            0.000000    -0.000e+00    -3.233e-13     3.2e-13
  outside, with room, #2            0.000000    -0.000e+00    -7.994e-14     8.0e-14
  outside, with room, #4            0.000000    -0.000e+00    -9.859e-14     9.9e-14

  worst relative error where the price was not zero       7.3e-08
  worst movement where the price was zero                 3.2e-13

The priced points move the answer by exactly what they are worth. The unpriced ones
do not move it at all -- and that is not a small number, it is the solver returning
the same optimum, because loosening a requirement that was never binding changes
nothing about the problem. The prices are the derivative of the answer with respect
to the question.`;
