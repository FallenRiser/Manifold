import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeOutput } from "@/components/CodeOutput";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { Quiz } from "@/components/Quiz";
import { GramLab } from "@/components/labs/GramLab";

const PINK = "var(--c-classification)";

export const metadata = {
  title: "The dual problem — Manifold",
  description:
    "Substitute the KKT conditions back into the Lagrangian and every primal variable cancels. What is left is a problem in the prices alone, which knows the training set only through the inner products between pairs of points.",
};

export default function DualProblemPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: PINK }, { label: "Deep", color: "var(--c-fundamentals)" }]}
        time="about 16 minutes"
        title={<>The problem, inside out</>}
        intro={<>Page 9 built a Lagrangian and found conditions the answer has to satisfy. Two of
          those conditions say what <M>{String.raw`w`}</M> and the slack must be — so they can be
          substituted straight back in. Do that and every primal variable cancels, leaving a
          problem written entirely in prices. It has the same answer, a different size, and one
          property that the whole second half of this chapter is built on.</>}
        titleSize={42}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>Every primal variable cancels</h2>
        <p>
          Stationarity gave <M>{String.raw`w = \sum_i \alpha_i y_i x_i`}</M>, so wherever{" "}
          <M>{String.raw`w`}</M> appears it can be replaced. It gave{" "}
          <M>{String.raw`\sum_i \alpha_i y_i = 0`}</M>, which is exactly the coefficient of{" "}
          <M>{String.raw`b`}</M> in the Lagrangian, so <M>{String.raw`b`}</M> drops out entirely.
          And it gave <M>{String.raw`\alpha_i + \mu_i = C`}</M>, which removes every{" "}
          <M>{String.raw`\xi_i`}</M> and leaves its multiplier behind as a ceiling. What survives
          has no <M>{String.raw`w`}</M>, no <M>{String.raw`b`}</M>, no{" "}
          <M>{String.raw`\xi`}</M> in it at all:
        </p>

        <MathBlock>{String.raw`\begin{gathered}
\max_{\alpha}\ \ \sum_{i} \alpha_i - \tfrac12 \sum_{i,j} \alpha_i\alpha_j\, y_i y_j \langle x_i, x_j\rangle \[6pt]
\text{subject to}\ \ \sum_i \alpha_i y_i = 0, \quad 0 \le \alpha_i \le C
\end{gathered}`}</MathBlock>

        <p>
          That is the <strong>dual problem</strong>. It is still a convex quadratic program, so
          everything page 8 established still applies — one answer, reachable from anywhere. What
          has changed is what it is a program <em>in</em>: one unknown per training point, rather
          than one per feature plus one per training point plus one.
        </p>

        <CodeOutput source="scripts/svm_cases.py">{outDual}</CodeOutput>

        <p>
          Nineteen iterations, from a cold start, with no help from the primal — and the boundary
          it implies sits at <strong>0.000e+00</strong> degrees from sklearn&rsquo;s. The dual is
          not an approximation of the primal or a bound on it. It is the same optimisation problem
          wearing different variables, and page 9&rsquo;s twenty thousand price pairs already
          established there is no gap between them to worry about.
        </p>

        <Callout title="Recovering w and b afterwards" color={PINK}>
          <M>{String.raw`w`}</M> comes straight out of the prices. The offset does not — it was
          eliminated, so it has to be read back off a support vector using{" "}
          <M>{String.raw`y_i(w^\top x_i + b) = 1`}</M>, which only holds for a point resting{" "}
          <em>on</em> the margin. That is page 9&rsquo;s middle group, and it is why the run above
          reports how many such points it found before quoting a <M>{String.raw`b`}</M> at all.
          When that group is empty there is nothing to read it off, and the offset is the interval
          page 8 measured rather than a number.
        </Callout>

        <h2>It never asks where a point is</h2>
        <p>
          Look at what the data contributes to that objective. Not coordinates — one number per
          pair, <M>{String.raw`\langle x_i, x_j \rangle`}</M>. Assemble them into an{" "}
          <M>{String.raw`n \times n`}</M> table, the <strong>Gram matrix</strong>, and the dual
          never needs to see the training set again. Anything you do to the data that leaves that
          table alone is therefore something the dual cannot detect.
        </p>

        <PredictPrompt
          accent={PINK}
          prompt={<>The lab below rotates the entire training cloud about the origin while
            re-solving the dual from the rotated coordinates each time. What happens to the
            prices?</>}
          options={[
            "They rotate with the data",
            "They change smoothly and return to their starting values after a full turn",
            "Nothing happens to them at all",
            "They stay the same magnitude but change which points carry them",
          ]}
          nudge={<>Locked in. Turn the dial and watch the right-hand panel.</>}
        />

        <LabFrame
          accent={PINK}
          tryThis={<>Drag the dial through a full turn. The cloud spins, the boundary spins with
            it, and each halo — the price on that point — spins along with the point it belongs
            to. Now watch the table on the right, and the three numbers underneath.</>}
          insight={<>Nothing on the right moves, because a rotation preserves every inner product
            and the table <em>is</em> every inner product. The dual objective reads{" "}
            <strong>5.694621</strong> and the support-vector count reads <strong>8 of 24</strong>
            {" "}at every angle you can set, while the readout for the largest change anywhere in
            the table never leaves the last bit a double can hold. The halos turn but never
            resize: the same points are worth the same amounts, described in a coordinate system
            they were never told about.</>}
        >
          <GramLab />
        </LabFrame>

        <CodeOutput source="scripts/svm_cases.py">{outGram}</CodeOutput>

        <p>
          The rotation is the gentle version. The zero-padding is the one that matters: nine
          hundred and ninety-eight extra features, every one of them zero, leave the Gram matrix{" "}
          <strong>exactly</strong> unchanged — <M>{String.raw`0.000 \times 10^{0}`}</M>, not
          nearly — so the prices come back bit for bit identical. The primal grew from 43 unknowns
          to 1041. The dual stayed at 40.
        </p>

        <p>
          And prediction is the same story. <M>{String.raw`f(x) = \sum_i \alpha_i y_i \langle x_i, x \rangle + b`}</M>{" "}
          is inner products the whole way down, so a fitted model can score a new point without
          ever having stored a coordinate — verified above against sklearn&rsquo;s own decision
          function on 400 fresh points, with identical labels on every one.
        </p>

        <Callout title="This is the door, not the trick" color={PINK}>
          Nothing so far has used a kernel, and nothing so far is clever. The observation is
          narrow and entirely mechanical: fitting and prediction both touch the data only through{" "}
          <M>{String.raw`\langle x_i, x_j \rangle`}</M>. Page 12 asks what happens if you supply
          those numbers from somewhere other than an actual inner product of actual coordinates —
          and the reason that question is even askable is the paragraph above.
        </Callout>

        <h2>Neither constraint was chosen</h2>
        <p>
          The dual has exactly two constraints and they can look arbitrary: why a box, why an
          equality? Neither is a modelling decision. Each is a piece of the primal, seen from the
          other side — and the way to prove it is to take one away and watch what the answer turns
          into.
        </p>

        <CodeOutput source="scripts/svm_cases.py">{outPieces}</CodeOutput>

        <p>
          The ceiling is the slack. Remove it and on separable data you get the hard margin back
          exactly — <strong>0.000e+00</strong> degrees and the same{" "}
          <M>{String.raw`\|w\|`}</M> to six decimals — which is the correct answer, because a hard
          margin is what an SVM is when no point is allowed to be wrong. On overlapping data,
          removing it gives you nothing: the prices climb to whatever ceiling you set and the
          objective climbs with them, because there is no finite answer to find. Page 5 measured
          that same failure from the primal side, where 0 of 100 draws admitted a hard-margin fit.
        </p>

        <p>
          The equality is the intercept. <M>{String.raw`b`}</M> enters the Lagrangian linearly and
          nothing penalises it, so the inner minimisation runs to{" "}
          <M>{String.raw`-\infty`}</M> unless its coefficient vanishes — and that coefficient is{" "}
          <M>{String.raw`\sum_i \alpha_i y_i`}</M>. Drop the constraint and the dual stops
          describing a model with a free offset: the objective it reports,{" "}
          <strong>13.151634501</strong>, is the primal with <M>{String.raw`b`}</M> nailed to zero
          to twelve figures. The constraint is not a condition on the prices. It <em>is</em> the
          intercept, written in the only vocabulary the dual has.
        </p>

        <p>
          So the dual costs nothing and buys two things. Its size is set by{" "}
          <M>{String.raw`n`}</M> alone, which is what page 8&rsquo;s closing table was pointing at.
          And it touches the data through a single table of pairwise numbers, which is what the
          next three pages are about.
        </p>

        <h2>Check yourself</h2>
        <Quiz
          accent={PINK}
          questions={[
            {
              q: <>Why does <M>{String.raw`b`}</M> disappear from the dual while{" "}
                <M>{String.raw`w`}</M> merely gets rewritten?</>,
              options: [
                "Because b is a scalar and w is a vector",
                "Because b enters the Lagrangian linearly, so its stationarity condition is a constraint on α rather than a formula for b",
                "Because b is not regularised",
                "Because the dual assumes the data is centred",
              ],
              answer: 1,
              explain: <>Setting <M>{String.raw`\partial L/\partial w = 0`}</M> gives{" "}
                <M>{String.raw`w = \sum \alpha_i y_i x_i`}</M>, an expression you can substitute.
                Setting <M>{String.raw`\partial L/\partial b = 0`}</M> gives{" "}
                <M>{String.raw`\sum \alpha_i y_i = 0`}</M>, which contains no{" "}
                <M>{String.raw`b`}</M> to substitute — so it survives as the equality constraint
                and <M>{String.raw`b`}</M> has to be recovered separately afterwards.</>,
            },
            {
              q: <>Padding every training point with 998 zero features left the prices bit-for-bit
                identical. Why?</>,
              options: [
                "Because zero features carry no information, so any method would ignore them",
                "Because the dual reads the data only as inner products, and appending zeros changes no inner product",
                "Because the solver drops constant columns",
                "Because the extra dimensions are orthogonal to the boundary",
              ],
              answer: 1,
              explain: <>The first option is intuitive but wrong as stated — the <em>primal</em>{" "}
                does not ignore them; it grows from 43 unknowns to 1041 to solve the same problem.
                The dual is unaffected because its only input, the Gram matrix, is unchanged.</>,
            },
            {
              q: <>Removing the ceiling <M>{String.raw`\alpha_i \le C`}</M> on overlapping data
                made the prices climb to whatever bound was set. What does that correspond to?</>,
              options: [
                "A bug in the solver",
                "The hard-margin problem, which on non-separable data is infeasible — so the dual is unbounded",
                "A hard margin with a very large C",
                "The primal with b fixed at zero",
              ],
              answer: 1,
              explain: <>The ceiling is what the slack variables bought. Take it away and no point
                is allowed to be wrong; if no separating line exists, the primal has no feasible
                point and the dual&rsquo;s objective is therefore unbounded above.</>,
            },
            {
              q: <>The primal and dual objectives differed by 2 × 10⁻⁸ when both were evaluated at
                the dual&rsquo;s own solution, and 1.4 × 10⁻⁷ when the primal was taken from
                sklearn instead. What does the difference between those two numbers tell you?</>,
              options: [
                "That there is a small but real duality gap",
                "That the dual is a relaxation and only approximates the primal",
                "That the residual is each solver's own convergence, since mixing two runs that stopped in different places makes it larger",
                "That sklearn is more accurate than the from-scratch solve",
              ],
              answer: 2,
              explain: <>A real duality gap would not shrink when you stop comparing across
                solvers. The quadratic halves of the two objectives agree to 8.9 × 10⁻¹⁶ — the
                last bit a double holds — which is what says the two expressions are the same
                expression.</>,
            },
          ]}
        />
      </div>

      <PrevNext
        prev={{
          label: "Lagrangian duality & the KKT conditions",
          href: "/learn/support-vector-machines/lagrangian-duality-and-kkt",
        }}
        next={{
          label: "Support vectors, exactly",
          href: "/learn/support-vector-machines/support-vectors-exactly",
        }}
      />
    </article>
  );
}

const outDual = `Page 9 ended with four conditions. Two of them say what w and the slack must be at the
optimum, so they can be substituted straight back into the Lagrangian -- and when they
are, every w, every b and every xi cancels. What survives is a problem in nothing but
the prices:

  maximise   sum_i a_i  -  (1/2) sum_i sum_j a_i a_j y_i y_j (x_i . x_j)
  subject to sum_i a_i y_i = 0   and   0 <= a_i <= C

40 unknowns instead of 43, one equality, and a box. Solved from scratch, with no help
from the primal and no help from sklearn:

  iterations it needed                                         19
  largest disagreement with sklearn's prices            4.199e-08
  largest disagreement in w                             3.647e-08
  angle between the two boundaries, degrees             0.000e+00
  points resting on the margin, used for b                      3
  disagreement in the offset                            7.515e-08

So the dual is not an approximation or a relaxation. It is the same answer, reached
by solving a different problem. Page 9 promised the two optima coincide; here is that
promise taken apart:

  primal objective, at the w and b the dual gives     13.127633875211
  dual objective, at the same prices                  13.127633853798
  gap                                                       2.141e-08

  primal objective, at sklearn's answer instead       13.127633996442
  gap against the same dual value                           1.426e-07

  (1/2)|w|^2, computed from the primal side            2.042188405712
  (1/2) a'Qa, computed from the dual side              2.042188405712
  difference                                                8.882e-16

  The quadratic halves agree to the last bit a double will hold, which says the two
  expressions are the same expression. The gap between the full objectives is only
  what each solver has left to converge: measured against its OWN primal value it is
  2e-08, and against sklearn's it is seven times larger, because that mixes two runs
  which stopped in slightly different places. There is no gap in the theory to find
  here -- page 9 swept 20000 price pairs looking for one.`;

const outGram = `Look at what the dual actually reads off the training set. Not a coordinate anywhere:
the data enters once, as x_i . x_j, and after that the problem is numbers in a table.
Anything that leaves every inner product alone is therefore invisible to it.

  ROTATE the whole cloud by an arbitrary orthogonal matrix
    largest change in any inner product                   1.776e-15
    largest change in any price                           1.362e-08
    w, against the old w rotated the same way             1.780e-08

  PAD every point with 998 zero features
    largest change in any inner product                   0.000e+00
    largest change in any price                           0.000e+00
    unknowns in the primal                                 43 -> 1041
    unknowns in the dual                                   40 -> 40

  Not approximately unchanged. The prices are bit for bit the numbers they were,
  because the table the dual reads is bit for bit the table it read before. The
  primal grew by a factor of 24 for the same answer.

And prediction needs no coordinates either. f(x) = sum_i a_i y_i (x_i . x) + b is
inner products the whole way down, so a fresh point can be scored by a model that
never stored a single feature value:

  scored from inner products vs scored from w             1.443e-15
  against sklearn's own decision function                 1.454e-07
  same predicted label on every one of 400 points              True

That is the whole opening for the kernel. Nothing in the dual, and nothing in the
prediction rule, ever asks where a point IS -- only how it relates to other points.`;

const outPieces = `The dual has exactly two constraints, and neither was chosen. Each one is the shadow
of something in the primal, and the way to see that is to take it away.

  THE BOX 0 <= a_i <= C. The ceiling is what the slack variables bought: a point can
  only pull so hard before it is cheaper to let it be wrong. Remove the ceiling and
  you should be back at a hard margin -- which on separable data is a real answer:

    largest price, with no ceiling at all                      1.1378
    angle against a hard-margin fit, degrees                0.000e+00
    |w| from the uncapped dual                               1.508519
    |w| from the hard-margin fit                             1.508519

  and on data where the classes overlap, it is not an answer at all. Raising the
  ceiling on the 40 points from section 35, where no separating line exists:

    ceiling         largest price        objective    stuck at it
    1                      1.0000          13.1276             13
    10                    10.0000         109.9071              9
    100                  100.0000        1065.7660              9
    1000                1000.0000       10624.3543              9

    The prices go wherever the ceiling goes and the objective climbs with them. There
    is no answer to converge to -- page 5 measured the same thing from the primal
    side, where 0 of 100 draws admitted a hard-margin solution.

  THE EQUALITY sum_i a_i y_i = 0. This one is the offset. b appears in the Lagrangian
  linearly and nothing penalises it, so unless its coefficient is exactly zero the
  minimisation runs away -- and that coefficient is sum_i a_i y_i. Take the equality
  out and the dual stops describing a model with an offset:

    dual with the equality removed                         13.151634501
    primal with b nailed to zero                           13.151634501
    difference                                                3.908e-14
    and their two w vectors differ by                         5.238e-08

    Exactly the same problem, to twelve figures. The equality constraint is not a
    technical condition on the prices -- it is the intercept, written in the only
    language the dual has.`;
