import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeOutput } from "@/components/CodeOutput";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { Quiz } from "@/components/Quiz";
import SmoStepLab from "@/components/labs/SmoStepLab";

const PINK = "var(--c-classification)";

export const metadata = {
  title: "Two at a time — Manifold",
  description:
    "The dual has one equality constraint, and it makes single-variable ascent illegal: two is the smallest legal move. That turns fitting an SVM into a formula applied over and over, where all the engineering is in choosing which two.",
};

const outTwo = `Page 10 left the dual as a problem, not a procedure: maximise sum a - (1/2) a'Qa
over 0 <= a_i <= C with sum a_i y_i = 0. Coordinate ascent is the obvious attack --
pick one variable, maximise over it, repeat. It is not available here, and the
equality constraint is why.

  a feasible starting point:        sum a_i y_i = 0.0
  raise one price by 0.1            sum a_i y_i = +0.100000
  raise one price by 0.01           sum a_i y_i = +0.010000
  raise one price by 1e-06          sum a_i y_i = +0.000001

Every single-coordinate move of any size lands outside the feasible set. The only
legal step in one variable is no step at all. So two is the smallest move that
exists -- which is what the 'minimal' in sequential minimal optimisation means.

  opposite labels, both +0.1   sum a_i y_i = +0.0e+00
  same label, +0.1 and -0.1    sum a_i y_i = +0.0e+00

Fix every other price and the two that are left are not free of each other: their
weighted sum a_i y_i + a_j y_j has to stay where it was. That pins the pair to a
LINE. Opposite labels fix their difference, equal labels fix their sum, so the line
has slope +1 or -1, and the box 0 <= a <= C cuts it to a segment.

On that segment the objective is a quadratic in one variable, with curvature

    eta = 2 K_ij - K_ii - K_jj

and the maximum of a quadratic is a formula, not a search:

    a_j <- a_j - y_j (E_i - E_j) / eta,   E_k = f(x_k) - y_k

Checked against a numerical search along the same segment, from a random feasible
point, over every pair it was offered:

  500 pairs, worst gap to the search's answer     9.71e-08
  worst amount the formula was WORSE by          1.78e-14

The first number is the search's own precision, not an error in the formula. The
second is the one that matters: on no segment did the formula land lower than the
search, by more than one rounding error in a number of size 20.

Two facts about eta make it safe to divide by. It is never positive, because Q is
positive semi-definite -- page 12's condition, arriving as a guarantee that the
subproblem curves the right way:

  eta over all 3540 pairs:  max -1.211e-03   min -33.0159
  pairs with eta > 0:    0

And it is exactly zero when the two points are identical, because then the line
runs along a level set and there is no maximum to step to:

  duplicate point 0 as point 60:
    K[0,0] 0.722847   K[0,60] 0.722847   K[60,60] 0.722847
    eta = 2(0.722847) - 0.722847 - 0.722847 = 0.0e+00

Not small. Zero. That is the branch every SMO implementation has for skipping a
pair, and duplicated rows in a training set are how you meet it.`;

const outClip = `The formula in section 50 maximises over the whole line. The box only enters
afterwards, as a clip to the segment that is actually feasible:

    opposite labels:  a_i - a_j fixed,  L = max(0, a_j - a_i),  H = min(C, C + a_j - a_i)
    equal labels:     a_i + a_j fixed,  L = max(0, a_i + a_j - C),  H = min(C, a_i + a_j)

    a_j <- min(H, max(L, a_j - y_j (E_i - E_j) / eta))

That one line of clipping is where the soft margin lives. Landing on L or H is a
price hitting a wall, and a price pinned at C is exactly page 5's point inside the
margin. Running it to convergence on 60 standardised points, C = 1:

  steps                        187
  steps where the clip bit      46   (24.6%)

                                this solver        sklearn
  dual objective                  35.251225      35.251225
  support vectors                        37             37
  prices pinned at C                     35             35
  max |a - a_sklearn|              2.92e-08

A quarter of the steps are clipped, and the same solver that page 10 described in
words lands on libsvm's answer: same objective to six decimals, same 37 support
vectors, the same 35 of them pinned at the cap.

Watching it get there is more interesting than the destination. Two quantities
move during the climb, and only one of them is well behaved:

      step        objective      KKT violation
         0         0.000000           2.00e+00
         1         1.446524           6.31e+00
         2         2.618072           2.89e+00
         5         4.412515           5.65e+00
        10         7.364512           2.79e+00
        20        13.517643           5.31e+00
        50        30.544052           1.73e+00
       100        35.218324           1.37e-01
       187        35.251225           4.44e-16

  steps where the objective FELL     0 of 187
  smallest increase                  1.081e-05
  largest increase                   1.5703

The objective never once goes down. Every step maximises a quadratic over a set
containing the current point, so it cannot -- staying put is always available and
the step is at least as good. That is the whole convergence argument, and it does
not need the steps to be large or the pair to be well chosen.

The KKT violation is the other story. It starts at 2.00, and by step 5 it is 5.65 --
HIGHER than where it began, and it goes back up again at step 20. Fixing the worst
violation creates new ones, because every price shares the constraint with all the
others. So the quantity the algorithm stops on is not the quantity that improves
monotonically, and a run that looks stuck by that measure may be making progress by
the only measure that is guaranteed.`;

const outWhich = `Nothing above says WHICH pair to step on. Convergence does not depend on it: any
violating pair raises the objective. Practicality depends on almost nothing else.

Three rules on one problem -- 300 points of noisy moons, rbf kernel, C = 10, run
until the KKT violation drops under 1e-3. The rule is: take i where -y_i grad is
largest among the prices that may rise, and j where it is smallest among those that
may fall. That is the pair whose step the first-order model says buys the most.

  reference objective (libsvm, tol 1e-12):  488.086733

  how the pair is picked          steps   gap to optimum
  both by the rule                  573        2.604e-05
  i by the rule, j at random      39161        1.018e-04
  both at random                 400000        3.589e-03  (hit the 400000-step cap)

Picking one end well and the other at random costs 68x the steps. Picking neither
does not finish at all: 400000 steps in, it is still 3.6e-03 from the optimum that the
first rule reached in 573.

Which is the real shape of this algorithm. The step is a formula and the
convergence proof is one line, so all of the engineering is in the selection, and
a version of SMO with the selection removed is not a slower SVM solver -- on this
problem it is not an SVM solver.`;

const outStop = `The loop ends when the KKT violation falls under a tolerance you choose. Sweeping
that tolerance over nine orders of magnitude, same problem as section 52:

  tol          steps     gap to optimum    SVs      train       test
  1e+00          140           1.22e+01     63     0.9367     0.8800
  1e-01          208           9.16e-02     62     0.9267     0.8833
  1e-02          406           2.20e-03     61     0.9267     0.8833
  1e-03          573           2.60e-05     61     0.9267     0.8833
  1e-04          738           4.82e-07     61     0.9267     0.8833
  1e-06         1648           1.01e-11     61     0.9267     0.8833
  1e-09         3162          -1.12e-10     61     0.9267     0.8833

Nine orders of magnitude of tolerance; the gap to the optimum falls through
twelve. (The last row is negative because the reference is libsvm at ITS tolerance,
and by then the two are arguing over the eleventh decimal.)

The test accuracy moves once, by 0.0033, between the first row and the second -- one
point in 300. Then it does not move again, through 2954 more steps and eight more
orders of magnitude of tolerance. The support count settles at 61 by tol 1e-02 and
stays there. Everything after that row buys a better answer to the dual and the
same model, which is worth knowing before you tighten a tolerance to fix a score.

The per-step cost is where the design actually shows. Every step changes two
prices, so the errors of all n points change -- and the whole trick is to update
them rather than recompute them. Updating touches two kernel rows, 2n numbers.
Recomputing multiplies the whole matrix, n^2. Both run to the same tolerance, so
the step counts are the algorithm's own and the totals are what each actually did:

       n   steps cached  steps rebuilt update (2n each)    rebuild (n^2)    ratio
     100            255            262          5.1e+04         2.62e+06      51x
     200            624            636          2.5e+05         2.54e+07     102x
     400           2700           2700         2.16e+06         4.32e+08     200x
     800           1965           2121         3.14e+06         1.36e+09     432x
    1600           7637           7235         2.44e+07         1.85e+10     758x

O(n) against O(n^2), and by n = 1600 one version does 758 times the arithmetic of
the other to reach the same tolerance. Keeping that cache is not an optimisation
detail; it is the difference between an algorithm that finishes and one that does
not.

(The cache does change the arithmetic, and so the path. At tol 1e-3 the two
versions land up to 3.2e-02 apart in a, which sounds alarming until you tighten
the tolerance: 1.1e-04 at 1e-6, 2.7e-11 at 1e-12. They were never diverging, they
were stopping at different points of the same flat region -- page 8's interval
again, and the tolerance is what licensed both.)

Step counts are the part nobody can promise you. Same generator, same settings,
five draws at each size:

       n   steps (mean)      per point spread over draws
     100            279           2.79        188 - 348
     200            430           2.15        238 - 624
     400           1412           3.53       747 - 2700
     800           1710           2.14      1215 - 1965
    1600           7032           4.39     3931 - 11146

A few steps per point on average, but the draw matters more than the size does:
at n = 400 the five draws span 747 to 2700 steps, a range wider than the gap
between n = 100 and n = 800. There is no step count to quote, only a shape.

What IS predictable is the memory, because the kernel matrix has n^2 entries and
every one of them may be asked for:

  n = 1000       1e+06 entries       7.6 MB
  n = 10000      1e+08 entries     762.9 MB
  n = 100000     1e+10 entries      74.5 GB
  n = 1000000    1e+12 entries       7.3 TB

Ten thousand points is a comfortable 763 MB. A hundred thousand is 74.5 GB, and
that is the wall -- not the step count, not the kernel, not C. Real solvers cache
a slice of the matrix and recompute the rest, which trades the memory for time
without changing the shape. Page 20 is about what you reach for instead.`;

export default function Page() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: PINK }, { label: "Deep", color: "var(--c-fundamentals)" }]}
        time="about 17 minutes"
        title={<>Two at a time</>}
        intro={<>Thirteen pages of this track have ended with &ldquo;and then you solve
          it&rdquo;. This one does not hand that to a library. The solver inside every SVM you
          have fitted is a formula for two variables applied a few thousand times, and the only
          hard part in it is deciding which two.</>}
        titleSize={42}
      />

      <p>
        Page 10 finished the dual and stopped there. Maximise
      </p>

      <MathBlock>{String.raw`\begin{gathered}
\sum_i \alpha_i - \tfrac{1}{2}\sum_i\sum_j \alpha_i \alpha_j y_i y_j k(x_i, x_j) \\[6pt]
\text{subject to}\quad 0 \le \alpha_i \le C, \qquad \sum_i \alpha_i y_i = 0
\end{gathered}`}</MathBlock>

      <p>
        and every page since has assumed that happens. It is a convex quadratic program, so you
        could hand it to a general solver and many people do — page 8 did exactly that. But
        the solver everyone actually runs, inside libsvm and therefore inside{" "}
        <code>sklearn.svm.SVC</code>, is not a general one. It is about two hundred lines, it does
        no linear algebra bigger than a dot product, and it exists because of one small feature of
        the problem above.
      </p>

      <h2>Why you cannot move one at a time</h2>

      <p>
        The obvious attack on a problem with <M>{String.raw`n`}</M> variables and simple bounds is
        coordinate ascent: pick one variable, maximise over it with the rest held still, repeat.
        It is easy, it is cheap, and here it is not available.
      </p>

      <p>
        The equality constraint is why. <M>{String.raw`\sum_i \alpha_i y_i = 0`}</M> couples every
        variable to every other one, so changing <M>{String.raw`\alpha_1`}</M> alone moves that sum
        off zero by <M>{String.raw`\delta y_1`}</M>, and the new point is not a legal answer to the
        problem at all.
      </p>

      <CodeOutput source="scripts/svm_cases.py">{outTwo}</CodeOutput>

      <p>
        So two is the smallest move that exists, and that is where the name comes from:{" "}
        <em>sequential minimal optimisation</em> is sequential because it does one small problem
        after another, and minimal because two variables is the minimum a legal problem can have.
      </p>

      <p>
        Fix the other <M>{String.raw`n - 2`}</M> and the pair that is left is not two free numbers.
        Their weighted sum has to stay where it was, which pins them to a line. Opposite labels fix
        their difference and the line has slope <M>{String.raw`+1`}</M>; equal labels fix their sum
        and it has slope <M>{String.raw`-1`}</M>. Along that line the objective is a quadratic in a
        single variable, and the maximum of a quadratic is a formula:
      </p>

      <MathBlock>{String.raw`\begin{gathered}
\eta = 2k(x_i,x_j) - k(x_i,x_i) - k(x_j,x_j) \\[6pt]
\alpha_j \leftarrow \alpha_j - \frac{y_j (E_i - E_j)}{\eta},
\qquad E_k = f(x_k) - y_k
\end{gathered}`}</MathBlock>

      <Callout color={PINK} title="Positive semi-definite, arriving as a licence to divide">
        <p>
          Page 12 demanded a positive semi-definite kernel and justified it geometrically — a
          negative eigenvalue would put a pair of points at negative squared distance. Here is the
          same condition doing a completely different job. <M>{String.raw`\eta`}</M> is the
          curvature of that one-variable quadratic, and PSD is exactly what guarantees it is never
          positive: measured over all 3,540 pairs, the largest is{" "}
          <M>{String.raw`-1.211 \times 10^{-3}`}</M>. If it could come out positive the quadratic
          would open upwards and the formula would step to its <em>minimum</em>.
        </p>
        <p>
          And it is exactly zero, not nearly zero, when two points are identical — the line
          runs along a level set and there is nothing to step to. That is the branch every SMO
          implementation carries for skipping a pair, and duplicated rows in a training set are how
          you meet it.
        </p>
      </Callout>

      <h2>A quadratic on a line in a box</h2>

      <p>
        The formula maximises over the whole line. The box enters afterwards, as a clip to the part
        of that line which is actually feasible:
      </p>

      <MathBlock>{String.raw`\begin{gathered}
y_i \ne y_j:\quad L = \max(0,\; \alpha_j - \alpha_i), \quad H = \min(C,\; C + \alpha_j - \alpha_i) \\[6pt]
y_i = y_j:\quad L = \max(0,\; \alpha_i + \alpha_j - C), \quad H = \min(C,\; \alpha_i + \alpha_j) \\[6pt]
\alpha_j \leftarrow \min\!\big(H,\; \max(L,\; \alpha_j^{\text{new}})\big)
\end{gathered}`}</MathBlock>

      <p>
        That clip is where the soft margin lives. Landing on <M>{String.raw`L`}</M> or{" "}
        <M>{String.raw`H`}</M> is a price hitting a wall, and a price pinned at{" "}
        <M>{String.raw`C`}</M> is exactly page 5&apos;s point sitting inside its own margin. Run
        the whole thing on sixty points and it lands where libsvm lands.
      </p>

      <CodeOutput source="scripts/svm_cases.py">{outClip}</CodeOutput>

      <p>
        Two quantities move during that climb and only one of them behaves. The objective goes up
        on every step without exception — 187 steps, zero decreases — and that is the
        entire convergence argument: each step maximises over a set that contains the current
        point, so standing still is always available and the step taken is never worse. It does not
        need the steps to be large or the pair to be well chosen.
      </p>

      <p>
        The KKT violation is not like that at all. It starts at 2.00 and by step 5 it is{" "}
        <strong>5.65</strong>, higher than it began, and it climbs again by step 20. Fixing the
        worst violation creates new ones, because every price shares one constraint with all the
        others. So the number the algorithm stops on is not the number that improves, and a run
        that looks stuck by that measure may be making guaranteed progress by the other.
      </p>

      <PredictPrompt
        prompt="You are going to pick the two prices to move. One rule takes the pair that violates the conditions most; the other takes any two at random. Both are guaranteed to converge. How much slower is random?"
        options={[
          "About the same — any violating pair raises the objective",
          "Two or three times slower",
          "Tens of times slower",
          "So much slower it does not finish",
        ]}
        accent="var(--c-classification)"
        nudge="The guarantee and the cost are different questions. Try the lab before the next section."
      />

      <LabFrame
        accent={PINK}
        tryThis={<>Press <em>Step</em> a few times and watch the right-hand panel. The line
          through the square is the only freedom one step has; the hollow dot is where the
          formula wants to land and the filled one is where the box lets it. Then press{" "}
          <em>Reset</em>, switch to <em>pair at random</em>, and press <em>Run to the end</em> on
          each rule in turn.</>}
        insight={<>Both rules climb on every single step, and both finish at the same objective,
          the same five support vectors and the same three pinned at <M>{String.raw`C`}</M>. The
          maximal-violating pair gets there in <strong>9</strong> steps; drawing the pair at
          random takes <strong>254</strong>. Convergence and usefulness are different properties,
          and only one of them is what the proof gives you.</>}
      >
        <SmoStepLab />
      </LabFrame>

      <h2>Which two, and why that is the whole algorithm</h2>

      <p>
        Nothing above says which pair to step on, and convergence genuinely does not care: any
        violating pair raises the objective. Practicality cares about almost nothing else. The rule
        is to take <M>{String.raw`i`}</M> where <M>{String.raw`-y_i \nabla_i`}</M> is largest among
        the prices that may rise and <M>{String.raw`j`}</M> where it is smallest among those that
        may fall — the pair whose step a first-order model says buys the most.
      </p>

      <p>
        Which is worth an ablation rather than an assertion, so: keep the rule for one end of the
        pair and draw the other at random, then draw both.
      </p>

      <CodeOutput source="scripts/svm_cases.py">{outWhich}</CodeOutput>

      <p>
        Picking one end well and the other at random costs 68 times the steps. Picking neither does
        not finish: four hundred thousand steps in, it is still further from the optimum than the
        rule was after <strong>573</strong>. That is the real shape of this algorithm. The step
        is a formula and the convergence proof is one line, so all of the engineering sits in the
        selection — and a version with the selection removed is not a slower SVM solver, it is
        not an SVM solver.
      </p>

      <h2>When to stop, and what it costs</h2>

      <p>
        The loop ends when the KKT violation drops under a tolerance you pick. Which raises the
        obvious question of what that tolerance buys, and the answer is worth having before you
        ever reach for it to fix a bad score.
      </p>

      <CodeOutput source="scripts/svm_cases.py">{outStop}</CodeOutput>

      <Callout color={PINK} title="Nine orders of magnitude, one point">
        <p>
          The gap to the optimum falls through twelve orders of magnitude across that table. The
          test accuracy moves once, by 0.0033 — one point out of three hundred — between
          the first row and the second, and then never again. The support count settles by{" "}
          <M>{String.raw`\texttt{tol}=10^{-2}`}</M> and stays.
        </p>
        <p>
          Everything after that row buys a better answer to the dual and the same model. A
          tolerance is a statement about the optimisation, not about the fit, and tightening it is
          not a way to make a model better — it is a way to make it slower.
        </p>
      </Callout>

      <p>
        The per-step cost is where the design shows. Every step changes two prices, so the errors
        of all <M>{String.raw`n`}</M> points change — and the whole trick is to{" "}
        <em>update</em> them rather than recompute them. Updating touches two kernel rows,{" "}
        <M>{String.raw`2n`}</M> numbers; recomputing multiplies the whole matrix,{" "}
        <M>{String.raw`n^2`}</M>. By <M>{String.raw`n = 1600`}</M> that is 758 times the arithmetic
        for the same tolerance.
      </p>

      <p>
        Step counts, though, are the part nobody can promise you. A few per point on average, but
        at <M>{String.raw`n = 400`}</M> five draws from one generator span 747 to 2,700 steps —
        a range wider than the gap between <M>{String.raw`n = 100`}</M> and{" "}
        <M>{String.raw`n = 800`}</M>. There is no step count to quote, only a shape.
      </p>

      <Callout color={PINK} title="The number that does not depend on your luck">
        <p>
          The kernel matrix has <M>{String.raw`n^2`}</M> entries and any of them may be asked for.
          Ten thousand points is a comfortable 763 MB. A hundred thousand is{" "}
          <strong>74.5 GB</strong>, and that is the wall — not the step count, not the kernel,
          not <M>{String.raw`C`}</M>.
        </p>
        <p>
          Real solvers cache a slice of the matrix and recompute the rest, trading the memory for
          time without changing the shape. It is the single most useful thing to know about when an
          SVM is the wrong tool, which page 20 is about.
        </p>
      </Callout>

      <h2>Where this leaves you</h2>

      <p>
        The algorithm behind every SVM you have ever fitted is: pick two prices, move them along a
        line inside a square by a closed-form amount, repeat. The convergence proof fits in a
        sentence. The kernel enters only through <M>{String.raw`\eta`}</M> and the errors, which is
        why page 12&apos;s substitution really was a one-line change here too.
      </p>

      <p>
        What is not simple is the selection, and that asymmetry is the page. An algorithm can be
        provably correct under any choice and still be useless under most of them — 68 times
        the work for one end chosen badly, and no finish at all for both.
      </p>

      <p>
        Page 15 goes back to the data. Every solver on this track has been handed standardised
        features without much comment, and page 13 already showed one polynomial fit hitting a
        two-million-iteration cap because it was not. Scaling is not hygiene here; it is the
        difference between the loop above terminating and not.
      </p>

      <Quiz
        questions={[
          {
            q: (
              <>
                Why does SMO move two multipliers at a time rather than one?
              </>
            ),
            options: [
              "Two converges faster than one",
              "The constraint ∑ αᵢ yᵢ = 0 makes any single-variable move infeasible",
              "The box constraints 0 ≤ α ≤ C require it",
              "Because the kernel is evaluated on pairs of points",
            ],
            answer: 1,
            explain: (
              <>
                The equality constraint couples all <M>{String.raw`n`}</M> variables. Changing one
                by <M>{String.raw`\delta`}</M> moves the sum by <M>{String.raw`\delta y_i`}</M>,
                so the result is not a feasible point at all — the only legal single-variable
                step is no step. Two is the minimum, which is the &ldquo;minimal&rdquo; in the name.
                The box constraints would be perfectly happy with one variable at a time.
              </>
            ),
          },
          {
            q: <>What does it mean when a step gets clipped to L or H?</>,
            options: [
              "The solver has failed to converge and should be restarted",
              "The kernel is not positive semi-definite",
              "The unconstrained optimum lies outside the box, so a price lands on a bound",
              "The two points are identical",
            ],
            answer: 2,
            explain: (
              <>
                The formula maximises along the whole line; the clip cuts it to the feasible
                segment. Landing on a bound is completely normal — about a quarter of the
                steps in the run above — and landing on <M>{String.raw`H = C`}</M> is how a
                point becomes one of page 10&apos;s margin violators. Identical points are the
                separate <M>{String.raw`\eta = 0`}</M> case, where the pair is skipped.
              </>
            ),
          },
          {
            q: (
              <>
                During a run, the objective rises on every step but the KKT violation goes{" "}
                <em>up</em> between step 1 and step 5. Is something wrong?
              </>
            ),
            options: [
              "Yes — the violation must decrease monotonically",
              "No — only the objective is guaranteed monotone; fixing one violation creates others",
              "Yes — it means the pair selection rule is broken",
              "No — but only because the tolerance has not been reached yet",
            ],
            answer: 1,
            explain: (
              <>
                Each step maximises over a set containing the current point, so the objective
                cannot fall. Nothing makes the same promise about the violation: every price shares
                the equality constraint, so repairing the worst one disturbs others. It starts at
                2.00 and reaches 5.65 by step 5 in the measured run. The quantity you stop on and
                the quantity that improves are not the same quantity.
              </>
            ),
          },
          {
            q: (
              <>
                Your SVM scores poorly. Someone suggests tightening <code>tol</code> from{" "}
                1e-3 to 1e-9. What should you expect?
              </>
            ),
            options: [
              "A better score, since the dual is solved more accurately",
              "A better score only if the kernel is rbf",
              "Roughly 5x the steps and the same model",
              "A worse score, from overfitting the dual",
            ],
            answer: 2,
            explain: (
              <>
                In the measured sweep the tolerance ran over nine orders of magnitude, the gap to
                the optimum fell through twelve, and the test accuracy moved once by one point in
                three hundred — between the two loosest rows — then held. Steps went from
                573 to 3,162. A tolerance is a statement about the optimisation, not about the fit;
                a bad score is a question for <M>{String.raw`C`}</M>, the kernel, or the features.
              </>
            ),
          },
        ]}
      />

      <PrevNext
        prev={{
          label: "Kernels you'll actually use",
          href: "/learn/support-vector-machines/kernels-you-will-actually-use",
        }}
      />
    </article>
  );
}
