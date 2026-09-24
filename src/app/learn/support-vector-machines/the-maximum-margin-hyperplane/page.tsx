import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeOutput } from "@/components/CodeOutput";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { Quiz } from "@/components/Quiz";
import { MinNormLab } from "@/components/labs/MinNormLab";

const PINK = "var(--c-classification)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export const metadata = {
  title: "The maximum-margin hyperplane — Manifold",
  description:
    "Turning “stay as far from the data as possible” into an optimisation problem a solver can take: why maximising the margin is minimising the norm of w, why the objective is squared, and how few of the constraints end up mattering.",
};

export default function MaxMarginHyperplanePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: PINK }, { label: "Core", color: "var(--c-fundamentals)" }]}
        time="about 12 minutes"
        title={<>The problem, written down</>}
        intro={<>Canonical form left us with a quantity worth maximising and a set of conditions to
          respect. Putting those two things on one line gives the optimisation problem that
          <em> is</em> the support vector machine — and a shape so well behaved that the rest of
          the track is mostly consequences of it.</>}
        titleSize={42}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>Both halves, on one line</h2>
        <p>
          From the <Link href="/learn/support-vector-machines/functional-and-geometric-margin" style={link}>previous
          page</Link> we have two things. Fixing the scale so the closest point scores exactly 1
          makes the geometric margin <M>{String.raw`1/\lVert w \rVert`}</M>, and that same choice
          turns &ldquo;every point is correctly classified with room to spare&rdquo; into <M>n</M>{" "}
          plain inequalities. Maximise the first, subject to all of the second:
        </p>

        <MathBlock>{String.raw`\max_{w,\,b}\; \frac{1}{\lVert w \rVert} \qquad \text{subject to}\qquad y_i\left(w^\top x_i + b\right) \ge 1, \quad i = 1, \dots, n`}</MathBlock>

        <p>
          That is the whole model. Every remaining idea in this track — slack variables, the dual,
          kernels, <M>C</M> — is an edit to those two lines. It is worth reading them once more
          slowly, because the constraint is doing something easy to miss: it does not merely
          demand correctness. Plain correctness would be{" "}
          <M>{String.raw`y_i(w^\top x_i + b) > 0`}</M>. Demanding <M>{String.raw`\ge 1`}</M>{" "}
          insists on correctness <em>by a full margin&rsquo;s worth</em>, and that is the only
          place the corridor enters the problem.
        </p>

        <h2>Reading it the other way up</h2>
        <p>
          Maximising <M>{String.raw`1/\lVert w \rVert`}</M> is awkward — the objective has the
          variable in a denominator, inside a square root. But a fraction with a fixed numerator
          gets larger exactly when its denominator gets smaller, so maximising{" "}
          <M>{String.raw`1/\lVert w \rVert`}</M> must be the same search as minimising{" "}
          <M>{String.raw`\lVert w \rVert`}</M>.
        </p>
        <p>
          It is worth seeing that happen rather than taking it on trust. Every direction a
          boundary&rsquo;s normal could point in gives at most one canonical boundary, so the
          entire space of separating hyperplanes can be swept with a single angle, recording both
          quantities at every step:
        </p>

        <CodeOutput source="scripts/svm_cases.py">{outMinnorm}</CodeOutput>

        <p>
          The product <M>{String.raw`\lVert w \rVert \times \gamma`}</M> reads{" "}
          <strong>1.000000000000</strong> at its smallest and its largest, across all 2,083
          separating directions. The two quantities are exact reciprocals, so the direction that
          minimises one is necessarily the direction that maximises the other — not usually, not
          approximately, but by construction. And the brute-force sweep lands within a single grid
          step of what the quadratic programme returns.
        </p>

        <PredictPrompt
          accent={PINK}
          prompt={<>In the lab below you will rotate the boundary&rsquo;s normal through a full
            turn. What should the curve of <M>{String.raw`\lVert w \rVert`}</M> look like?</>}
          options={[
            "A smooth curve defined at every angle, with one minimum",
            "Defined only over some angles, with one minimum where the margin is widest",
            "Flat — ‖w‖ does not depend on the direction",
            "Defined only over some angles, with several equally good minima",
          ]}
        />

        <LabFrame
          accent={PINK}
          tryThis={<>Sweep the angle slowly through the region where a corridor appears, watching
            the curve underneath. Then press <strong>jump to smallest ‖w‖</strong>.</>}
          insight={<>Most directions cannot separate the data at all — that is the blank part of
            the curve, and it is the feasible set of the problem made visible. Where the curve
            does exist it has a single dip, and the bottom of that dip is exactly where the
            corridor is widest. The <M>{String.raw`\lVert w \rVert \times \gamma`}</M> readout
            never leaves 1.000000 anywhere on the sweep.</>}
        >
          <MinNormLab />
        </LabFrame>

        <h2>Why the objective is squared</h2>
        <p>
          Textbooks do not write <M>{String.raw`\min \lVert w \rVert`}</M>. They write this:
        </p>

        <MathBlock>{String.raw`\min_{w,\,b}\; \tfrac{1}{2}\lVert w \rVert^{2} \qquad \text{subject to}\qquad y_i\left(w^\top x_i + b\right) \ge 1, \quad i = 1, \dots, n`}</MathBlock>

        <p>
          Two changes, and neither is allowed to move the answer. Squaring is safe because{" "}
          <M>{String.raw`t \mapsto t^2`}</M> is increasing on non-negative numbers, and a norm is
          never negative — so it reorders nothing, and whatever minimised{" "}
          <M>{String.raw`\lVert w \rVert`}</M> still minimises its square. The{" "}
          <M>{String.raw`\tfrac{1}{2}`}</M> is pure convenience: it cancels the 2 that falls out
          when you differentiate. Running both objectives over the same constraints, from four
          different starting points, confirms the substitution costs nothing:
        </p>

        <CodeOutput source="scripts/svm_cases.py">{outSquared}</CodeOutput>

        <p>
          All eight runs land on <M>{String.raw`\lVert w \rVert = 0.609794`}</M>, agreeing with
          scikit-learn&rsquo;s boundary to six decimal places of angle. The iteration counts are 4
          to 6 either way, so if you have read that the squared form is preferred because it
          converges faster, that is not what is happening.
        </p>
        <p>
          The real reason is structural. <M>{String.raw`\tfrac{1}{2}w^\top w`}</M> is a{" "}
          <em>quadratic</em> function and the constraints are <em>linear</em>, which makes this a
          quadratic programme — a category with mature solvers, a guaranteed global optimum, and,
          most importantly for this track, a clean dual. The kernel trick in chapter 3 is a
          consequence of that dual existing in the form it does. Write{" "}
          <M>{String.raw`\lVert w \rVert`}</M> instead and none of it is available.
        </p>

        <Proof title={<>why there is exactly one answer to find</>} color={PINK}>
          <p>
            Both properties that make this problem safe come from its shape.
          </p>
          <p>
            <strong>The feasible set is convex.</strong> Each constraint{" "}
            <M>{String.raw`y_i(w^\top x_i + b) \ge 1`}</M> is linear in{" "}
            <M>{String.raw`(w, b)`}</M>, so each one describes a half-space. The feasible set is
            the intersection of <M>n</M> half-spaces, and an intersection of convex sets is
            convex. (It may also be <em>empty</em> — that is the hard margin&rsquo;s weakness, and
            the next chapter&rsquo;s subject.)
          </p>
          <p>
            <strong>The objective is strictly convex in <M>w</M>.</strong> Suppose two different
            optima <M>{String.raw`w_1 \neq w_2`}</M> both achieved the minimum value{" "}
            <M>{String.raw`p^\star`}</M>. Their midpoint{" "}
            <M>{String.raw`\bar{w} = \tfrac{1}{2}(w_1 + w_2)`}</M> is feasible, because the
            feasible set is convex. But strict convexity gives
          </p>
          <MathBlock>{String.raw`\tfrac{1}{2}\lVert \bar{w} \rVert^{2} \;<\; \tfrac{1}{2}\left(\tfrac{1}{2}\lVert w_1 \rVert^{2} + \tfrac{1}{2}\lVert w_2 \rVert^{2}\right) = p^\star`}</MathBlock>
          <p>
            — a feasible point strictly better than the supposed minimum, which is a
            contradiction. So <M>w</M> is unique. Once <M>w</M> is fixed, the constraints that sit
            at equality pin <M>b</M>, and the boundary is determined.
          </p>
          <p>
            This is a stronger guarantee than most of the models on this site enjoy. A neural
            network has many minima and which one you reach depends on initialisation; a{" "}
            <Link href="/learn/decision-trees" style={link}>decision tree</Link> is built by a
            greedy heuristic with no optimality claim at all. Here, every correct solver returns
            the same boundary — there is no &ldquo;which run did you get&rdquo; to worry about.
          </p>
        </Proof>

        <h2>How much of the data is the problem actually about?</h2>
        <p>
          The problem carries one constraint per training point, which makes it look like all{" "}
          <M>n</M> of them matter. At the solution, almost none of them do:
        </p>

        <CodeOutput source="scripts/svm_cases.py">{outTight}</CodeOutput>

        <p>
          Three constraints sit exactly at equality. The other 37 are satisfied with room to
          spare, and a constraint with slack is a constraint that is not pushing on anything —
          nudge one of those points and the solution does not even notice. That is the same effect
          you saw by dragging un-ringed points on the{" "}
          <Link href="/learn/support-vector-machines" style={link}>first page</Link>, now visible
          in the arithmetic: <strong>3 of 40</strong> points are holding the boundary up.
        </p>

        <Callout color={PINK} title={<>The flaw sitting inside this formulation</>}>
          <p>
            Everything above assumes the feasible set is non-empty — that some hyperplane really
            does get every point right by a full margin. If the classes overlap even slightly, no{" "}
            <M>{String.raw`(w, b)`}</M> satisfies all <M>n</M> constraints, the feasible set is
            empty, and the problem has no solution at all. Not a poor one: none. Real data
            overlaps essentially always, so this <em>hard-margin</em> problem is a stepping stone
            rather than a destination. The next chapter buys its way out by letting constraints be
            violated at a price.
          </p>
        </Callout>

        <Quiz
          accent={PINK}
          questions={[
            {
              q: <>Why is the constraint written <M>{String.raw`y_i(w^\top x_i + b) \ge 1`}</M>{" "}
                rather than <M>{String.raw`> 0`}</M>?</>,
              options: [
                "To keep the arithmetic positive",
                "Because > 0 would only demand correctness, while ≥ 1 demands correctness by a full margin",
                "Because 0 would make the problem non-convex",
                "To stop w from growing without bound",
              ],
              answer: 1,
              explain: <>Strictly positive is just &ldquo;on the right side&rdquo;, which any
                separator achieves. The 1 is the canonical scale from the previous page, and it is
                what makes the constraint describe the corridor rather than merely the
                boundary.</>,
            },
            {
              q: <>The sweep found ‖w‖ × margin equal to 1.000000000000 at both its minimum and
                its maximum over 2,083 directions. What does that establish?</>,
              options: [
                "That the sweep was fine enough to find the optimum",
                "That the two are exact reciprocals, so minimising one is identical to maximising the other",
                "That the margin is always 1 in canonical form",
                "That the data is separable",
              ],
              answer: 1,
              explain: <>A constant product means each is determined by the other. So the direction
                minimising <M>{String.raw`\lVert w \rVert`}</M> is necessarily the one maximising
                the margin — the two searches cannot come apart.</>,
            },
            {
              q: <>Why do textbooks minimise ½‖w‖² instead of ‖w‖?</>,
              options: [
                "Because it converges in noticeably fewer iterations",
                "Because it gives a different, better boundary",
                "Because squaring is monotone so the answer is unchanged, and the quadratic form makes this a QP with a usable dual",
                "Because ‖w‖ is not continuous",
              ],
              answer: 2,
              explain: <>Squaring cannot move the argmin of a non-negative quantity, and the
                measured runs confirm it — same answer from every start. The gain is structural: a
                quadratic objective with linear constraints is a QP, and its dual is what the
                kernel trick later needs. The iteration counts showed no speed advantage.</>,
            },
            {
              q: <>What happens to this problem if the two classes overlap?</>,
              options: [
                "It returns the best available boundary with a few mistakes",
                "It returns a wider margin to compensate",
                "The feasible set is empty and there is no solution at all",
                "It still works but takes far longer to solve",
              ],
              answer: 2,
              explain: <>Every constraint must hold simultaneously. If no hyperplane gets all{" "}
                <M>n</M> points right by a full margin, nothing is feasible and there is nothing to
                minimise over — which is exactly why the soft margin exists.</>,
            },
          ]}
        />
      </div>

      <PrevNext
        prev={{
          label: "Functional & geometric margin",
          href: "/learn/support-vector-machines/functional-and-geometric-margin",
        }}
        next={{
          label: "Does a wider margin actually help?",
          href: "/learn/support-vector-machines/does-a-wider-margin-help",
        }}
      />
    </article>
  );
}

const outMinnorm = `Every boundary that separates this data, written in canonical form. If maximising the
margin really is minimising ||w||, the smallest ||w|| and the widest margin have to be
the same direction -- and margin x ||w|| has to be pinned at 1 everywhere.

  2083 of 7200 directions separate the two classes.
  margin x ||w||, over every one of them:  min 1.000000000000  max 1.000000000000

                            ||w||         margin
  best of the sweep      0.609844       1.639763
  sklearn's QP           0.609794       1.639898
  smallest ||w|| and largest margin are the same direction: yes
  sweep found 195.000 deg, sklearn 194.966 deg, and the sweep steps 0.050 deg

  rotating away from the best direction:

    offset deg        ||w||       margin      product
           -12     0.839248     1.191543  1.000000000
            -8     0.722669     1.383760  1.000000000
            -4     0.648532     1.541943  1.000000000
             0     0.609844     1.639763  1.000000000
             4     0.619832     1.613341  1.000000000
             8     0.633793     1.577801  1.000000000
            12     0.651647     1.534574  1.000000000

  ||w|| bottoms out exactly where the margin peaks, and the product never leaves 1.
  Minimising ||w|| is not an approximation of maximising the margin. It is the same
  problem, read the other way up.`;

const outSquared = `Two objectives over the same constraints: minimise ||w||, or minimise 0.5||w||^2. Every
textbook writes the second. If the two ever disagreed, that substitution would be a bug.

  start                objective         ||w||    iters    angle deg
  [0.1, 0.1, 0.0]      ||w||          0.609794        6     0.000000
  [0.1, 0.1, 0.0]      0.5||w||^2     0.609794        5     0.000001
  [3.0, -2.0, 1.0]     ||w||          0.609794        5     0.000001
  [3.0, -2.0, 1.0]     0.5||w||^2     0.609794        5     0.000000
  [-1.0, -1.0, -2.0]   ||w||          0.609794        5     0.000000
  [-1.0, -1.0, -2.0]   0.5||w||^2     0.609794        5     0.000001
  [0.01, 0.0, 0.0]     ||w||          0.609794        4     0.000001
  [0.01, 0.0, 0.0]     0.5||w||^2     0.609794        5     0.000000

  All eight runs land on the same boundary. Squaring is monotone on non-negative
  numbers, so it cannot move the argmin -- the substitution is exact, not a
  convenience that costs a little accuracy.

  Note what the iteration counts do NOT show: 4-6 either way, no reliable speed
  advantage. The reason to write 0.5||w||^2 is structural. It is a quadratic, which
  makes this a quadratic program with linear constraints, and it is what gives the
  clean dual the kernel trick later depends on.`;

const outTight = `The problem carries one constraint per training point. Here is how many of them the
solution is actually pressed up against.

  40 points, 3 sitting at y(w.x+b) = 1 to within 1e-6
  the five smallest scores: [1.     1.     1.     1.0016 1.0229]

  Three constraints are tight; the other 37 have slack to spare. Those three points
  are the support vectors, and they are the entire model -- which is the next
  chapter's business, and the reason an SVM forgets most of its training data.`;
