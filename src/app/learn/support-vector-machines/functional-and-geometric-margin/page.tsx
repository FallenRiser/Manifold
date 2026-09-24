import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeOutput } from "@/components/CodeOutput";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { Quiz } from "@/components/Quiz";
import { ScaleInvarianceLab } from "@/components/labs/ScaleInvarianceLab";

const PINK = "var(--c-classification)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export const metadata = {
  title: "Functional & geometric margin — Manifold",
  description:
    "Two quantities both get called the margin, and only one of them is a distance. Why w and b can be rescaled without moving the boundary, what dividing by the norm of w actually buys, and the measurement showing the functional margin ranking boundaries backwards.",
};

export default function FunctionalGeometricMarginPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: PINK }, { label: "Core", color: "var(--c-fundamentals)" }]}
        time="about 11 minutes"
        title={<>Two things called the margin</>}
        intro={<>The last page said the SVM picks the boundary with the most room around it. To
          turn that into something a solver can maximise you have to say what &ldquo;room&rdquo;
          means as a number — and the obvious first attempt is not a distance at all. It can be
          made to say almost anything you like without the boundary moving an inch.</>}
        titleSize={42}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>The obvious definition, and its flaw</h2>
        <p>
          A linear classifier scores a point with <M>{String.raw`f(x) = w^\top x + b`}</M> and
          predicts by the sign. A point is correct when the score has the same sign as the label,
          so the natural way to measure &ldquo;correct, and not narrowly&rdquo; is to multiply the
          two together. That product is the <strong>functional margin</strong>:
        </p>

        <MathBlock>{String.raw`\hat{\gamma}_i = y_i\left(w^\top x_i + b\right), \qquad \hat{\gamma} = \min_{i} \hat{\gamma}_i`}</MathBlock>

        <p>
          It behaves the way you would want. It is positive exactly when the point is on the right
          side, negative when it is not, and larger when the point sits further into its own
          territory. The margin of the whole dataset is the smallest one, because the boundary is
          only as comfortable as its most awkward point.
        </p>
        <p>
          The flaw shows up the moment you ask what the number <em>is</em>. A boundary is the set
          of points where <M>{String.raw`w^\top x + b = 0`}</M>. Multiply both{" "}
          <M>w</M> and <M>b</M> by any positive <M>k</M> and that set does not change — if a point
          made the expression zero before, it makes it zero now. So{" "}
          <M>{String.raw`(w, b)`}</M> and <M>{String.raw`(2w, 2b)`}</M> are the same classifier
          written twice. But the functional margin doubles.
        </p>

        <PredictPrompt
          accent={PINK}
          prompt={<>You multiply <M>w</M> and <M>b</M> by 100. What happens to the line on the
            screen, and what happens to the functional margin?</>}
          options={[
            "Both scale up by 100",
            "The line stays put; the functional margin scales by 100",
            "The line stays put and so does the functional margin",
            "The line moves 100× further from the origin",
          ]}
        />

        <CodeOutput source="scripts/svm_cases.py">{outRescale}</CodeOutput>

        <p>
          A thousandfold swing in a number that is supposed to describe the boundary, while the
          boundary sits perfectly still and every single prediction stays identical. The functional
          margin is not measuring the classifier. It is measuring the <em>arithmetic you happened
          to write the classifier down with</em>, and you can make it as large as you like by
          typing more zeros.
        </p>

        <LabFrame
          accent={PINK}
          tryThis={<>Drag the scale dial from 0.1 up to 100. Watch the equation at the top of the
            canvas, the two bars at the bottom, and — most importantly — the line.</>}
          insight={<>Every coefficient changes. The functional-margin bar sweeps across its whole
            range. The line, the shaded corridor and the dashed measuring stick from the ringed
            point never move by a pixel, and the geometric margin holds at the same six decimal
            places the whole way.</>}
        >
          <ScaleInvarianceLab />
        </LabFrame>

        <h2>Dividing the arbitrariness out</h2>
        <p>
          The fix follows from the diagnosis. If the problem is that scaling{" "}
          <M>{String.raw`(w,b)`}</M> by <M>k</M> scales the score by <M>k</M>, then divide by
          something that also scales by <M>k</M>. The length of <M>w</M> does exactly that. The{" "}
          <strong>geometric margin</strong> is the functional margin per unit of{" "}
          <M>{String.raw`\lVert w \rVert`}</M>:
        </p>

        <MathBlock>{String.raw`\gamma_i = \frac{y_i\left(w^\top x_i + b\right)}{\lVert w \rVert} = \frac{\hat{\gamma}_i}{\lVert w \rVert}`}</MathBlock>

        <p>
          Now the <M>k</M>s cancel and the number is a property of the boundary alone. That much is
          just algebra. The stronger claim — the one that makes this the <em>right</em> fix rather
          than merely a working one — is that what comes out the other side is a genuine Euclidean
          distance, in the units the data is measured in.
        </p>
        <p>
          Checking that against the projection formula would be circular, since the projection
          formula is what produced it. Instead: walk along the boundary line itself and search for
          the point on it that is genuinely closest to the data point, using nothing but repeated
          distance comparisons.
        </p>

        <CodeOutput source="scripts/svm_cases.py">{outDistance}</CodeOutput>

        <p>
          Agreement to every digit printed. The geometric margin is not merely a scale-corrected
          score — it is the length of the perpendicular you would draw with a ruler.
        </p>

        <Proof title={<>why <M>{String.raw`|w^\top x_0 + b| / \lVert w \rVert`}</M> is that perpendicular</>} color={PINK}>
          <p>
            Take a point <M>{String.raw`x_0`}</M> and the hyperplane{" "}
            <M>{String.raw`w^\top x + b = 0`}</M>. The vector <M>w</M> is normal to the plane: for
            any two points <M>u</M>, <M>v</M> on it, subtracting{" "}
            <M>{String.raw`w^\top u + b = 0`}</M> from <M>{String.raw`w^\top v + b = 0`}</M>{" "}
            gives <M>{String.raw`w^\top (v - u) = 0`}</M>, so <M>w</M> is orthogonal to every
            direction lying inside the plane.
          </p>
          <p>
            The shortest path from <M>{String.raw`x_0`}</M> to the plane therefore runs along{" "}
            <M>w</M>. Write the foot of that perpendicular as{" "}
            <M>{String.raw`x_0 - t\,w`}</M> for an unknown <M>t</M>, and require it to lie on the
            plane:
          </p>
          <MathBlock>{String.raw`w^\top\!\left(x_0 - t\,w\right) + b = 0 \;\;\Longrightarrow\;\; t = \frac{w^\top x_0 + b}{\lVert w \rVert^{2}}`}</MathBlock>
          <p>
            The distance travelled is the length of <M>{String.raw`t\,w`}</M>, which is{" "}
            <M>{String.raw`|t|\,\lVert w \rVert`}</M>:
          </p>
          <MathBlock>{String.raw`\lVert t\,w \rVert = \frac{\left|w^\top x_0 + b\right|}{\lVert w \rVert^{2}}\,\lVert w \rVert = \frac{\left|w^\top x_0 + b\right|}{\lVert w \rVert}`}</MathBlock>
          <p>
            Multiplying by the label <M>{String.raw`y_i \in \{-1, +1\}`}</M> instead of taking the
            absolute value keeps the sign informative: the result is positive when the point is on
            its own side and negative when it has been misclassified, which is exactly what you
            want a margin to report.
          </p>
        </Proof>

        <h2>Why the distinction is not pedantry</h2>
        <p>
          It would be easy to file this under notation. It is not: a quantity that depends on how
          you wrote the model down can rank two models in the wrong order. Here is that failure
          happening, over two hundred draws, against a{" "}
          <Link href="/learn/perceptron-to-mlp/the-perceptron" style={link}>perceptron</Link> whose
          weights come out of its update rule at whatever scale they happen to reach.
        </p>

        <CodeOutput source="scripts/svm_cases.py">{outRanking}</CodeOutput>

        <p>
          On <strong>165 of 185</strong> draws, the functional margin says the perceptron has the
          more comfortable boundary. On <strong>every one</strong> of those draws it is wrong — the
          maximum-margin boundary has more real room, by construction. In the worked example the
          functional margin prefers the perceptron by a factor of 3.7 while that boundary sits 3.0×
          closer to the nearest point. A metric that confident and that backwards is worse than
          having no metric at all.
        </p>

        <Callout color={PINK} title={<>The perceptron is not being cheated here</>}>
          <p>
            Both boundaries separate the training data perfectly, so this is not a strong model
            against a weak one. The perceptron&rsquo;s weights are simply a sum of the points it
            made mistakes on, which leaves them at an arbitrary magnitude — larger, usually, than
            the canonical scale. The functional margin reads that magnitude as confidence. That is
            the trap: it is not that the number is noisy, it is that it is answering a different
            question from the one being asked.
          </p>
        </Callout>

        <h2>Turning the freedom into an advantage</h2>
        <p>
          Scaling freedom looks like a defect, and so far it has behaved like one. But it is also a
          gift, because it means you may <em>choose</em> the scale. Out of all the equivalent ways
          to write one boundary, pick the <M>k</M> that makes the closest point score exactly 1:
        </p>

        <MathBlock>{String.raw`\hat{\gamma} = \min_i \; y_i\left(w^\top x_i + b\right) = 1 \qquad\Longrightarrow\qquad \gamma = \frac{\hat{\gamma}}{\lVert w \rVert} = \frac{1}{\lVert w \rVert}`}</MathBlock>

        <p>
          This is the <strong>canonical form</strong>, and it is quietly the most consequential
          move in the whole derivation. The geometric margin — the thing you actually care about —
          is now just <M>{String.raw`1/\lVert w \rVert`}</M>, with the full corridor between the two
          margin lines twice that. Maximising room has turned into shrinking a vector, which is a
          problem shape optimisers are very good at.
        </p>

        <CodeOutput source="scripts/svm_cases.py">{outCanonical}</CodeOutput>

        <p>
          There is a wrinkle in those two rows worth noticing. The canonical constraint is exactly
          1 as algebra, but a solver only gets there as precisely as you ask it to: on its default
          tolerance scikit-learn stops at 0.9996, and tightening <code>tol</code> to{" "}
          <M>{String.raw`10^{-9}`}</M> walks it in to 0.99999996 — about four parts in ten
          thousand of slack on the default. That is also why the geometric margin reads 1.639743 in
          the first block and 1.639898 here: same boundary, differently converged solve, roughly one
          part in ten thousand apart. Worth knowing before you compare two numbers from two runs and
          conclude something moved.
        </p>

        <Callout color={PINK} title={<>Where this lands next</>}>
          <p>
            You now have a quantity worth maximising — <M>{String.raw`1/\lVert w \rVert`}</M> — and
            maximising it means making <M>{String.raw`\lVert w \rVert`}</M> as small as the data
            allows, subject to every point clearing its margin. The next page writes that down as
            a constrained optimisation problem, and finds that the awkward square root in the norm
            can be dropped without changing the answer.
          </p>
        </Callout>

        <Quiz
          accent={PINK}
          questions={[
            {
              q: <>You replace <M>{String.raw`(w, b)`}</M> with{" "}
                <M>{String.raw`(5w, 5b)`}</M>. Which of these changes?</>,
              options: [
                "The predictions on every point",
                "The position of the decision boundary",
                "The functional margin only",
                "The geometric margin only",
              ],
              answer: 2,
              explain: <>The boundary is where the score is zero, and scaling cannot move a zero,
                so the line and every prediction are untouched. The functional margin scales by 5;
                the geometric margin divides it by a norm that also scaled by 5, so it is
                unchanged.</>,
            },
            {
              q: <>Why divide by <M>{String.raw`\lVert w \rVert`}</M> specifically, rather than
                some other normaliser?</>,
              options: [
                "It is the only choice that keeps the result positive",
                "It scales exactly like the score does, and turns it into a true perpendicular distance",
                "It makes the optimisation convex",
                "It keeps the margin below 1",
              ],
              answer: 1,
              explain: <>Two things at once. Because <M>{String.raw`\lVert w \rVert`}</M> scales by
                the same <M>k</M> as the score, the ratio is scale-free — and the resulting number
                is the actual Euclidean distance to the hyperplane, which the derivation proves
                and the search on the line confirms to twelve decimal places.</>,
            },
            {
              q: <>The experiment found the perceptron had the larger functional margin on 165 of
                185 draws. What does that show?</>,
              options: [
                "The perceptron usually finds a better boundary on separable data",
                "The functional margin is noisy and needs more draws to settle",
                "Comparing two models by functional margin is meaningless, because it reads their weight scale as confidence",
                "The max-margin boundary is only better when the classes overlap",
              ],
              answer: 2,
              explain: <>The max-margin boundary had the wider geometric margin on all 185 draws —
                it has more real room every time. The functional margin disagreed on 165 of them
                because the perceptron&rsquo;s weights happen to be larger, which it cannot tell
                apart from being further from the data.</>,
            },
            {
              q: <>In canonical form, the corridor between the two margin lines has width…</>,
              options: [
                "1 / ‖w‖",
                "2 / ‖w‖",
                "‖w‖",
                "2‖w‖",
              ],
              answer: 1,
              explain: <>Fixing the closest point at a functional margin of 1 puts the geometric
                margin at <M>{String.raw`1/\lVert w \rVert`}</M> on each side of the boundary, so
                the full corridor spans <M>{String.raw`2/\lVert w \rVert`}</M> — 3.279795 for the
                boundary in the block above.</>,
            },
          ]}
        />
      </div>

      <PrevNext
        prev={{ label: "A boundary with room to spare", href: "/learn/support-vector-machines" }}
        next={{
          label: "The maximum-margin hyperplane",
          href: "/learn/support-vector-machines/the-maximum-margin-hyperplane",
        }}
      />
    </article>
  );
}

const outRescale = `The line is the set of points where w.x + b = 0. Multiplying w and b by the same k
cannot move that set, so all four rows below are the SAME boundary.

         k       ||kw||       min y(w.x+b)   geometric margin    predictions
       0.1       0.0610             0.1000           1.639743      identical
         1       0.6096             0.9996           1.639743      identical
        10       6.0962             9.9962           1.639743      identical
       100      60.9622            99.9624           1.639743      identical

  The functional margin y(w.x+b) moved by a factor of 1000. The boundary did not
  move at all, and neither did the geometric margin. So the functional margin is
  not a property of the boundary -- it is a property of how you chose to WRITE it.`;

const outDistance = `Dividing by ||w|| is supposed to turn the score into a DISTANCE. Checking that with
the projection formula would be circular, so this walks along the line instead and
ternary-searches for the closest point on it.

  closest training point             [-3.0737  1.3359]
  closest point ON the line          [-1.4896  1.7594]
  straight-line distance between     1.639743296177
  geometric margin |w.x+b|/||w||     1.639743296177
  difference                         0.00e+00

  Dividing by ||w|| does not just cancel the scale. It converts the score into a
  length, measured in the same units as the data.`;

const outRanking = `If the functional margin is not a property of the boundary, then comparing two
models by it is meaningless. This checks how often it actually misleads: 200 draws,
a max-margin boundary against a perceptron, both separating the training data.

  185 of 200 draws were separated perfectly by both models.

  perceptron has the bigger FUNCTIONAL margin on 165 of 185 draws
  max-margin has the bigger GEOMETRIC margin on 185 of 185 draws

  one example, seed 1:
                           max-margin     perceptron
    functional margin      1.000          3.683
    geometric margin       4.946          1.639

  The functional margin prefers the perceptron by 3.7x. That boundary is actually
  3.0x CLOSER to the data. Ranking by it is worse than not ranking at all.`;

const outCanonical = `Scaling freedom is a nuisance until you use it: pick the k that makes the closest
point score exactly 1. Then the geometric margin is just 1/||w||, and maximising the
margin becomes minimising ||w||. That is the canonical form, and it is what a solver
hands back.

                                       min y(w.x+b)          1/||w||
  SVC defaults (tol=1e-3)               0.999623684         1.640361
  SVC with tol=1e-9                     0.999999958         1.639898

  The constraint is exactly 1 in the algebra; a solver reaches it to whatever
  tolerance you ask for. The default stops about 4 parts in 10,000 short, which is
  the stopping criterion showing through -- not a different definition of a margin.

  so for this boundary:  ||w|| = 0.609794  ->  corridor width 2/||w|| = 3.279795`;
