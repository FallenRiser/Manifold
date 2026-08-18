import { M, MathBlock } from "@/components/Math";
import { PredictPrompt } from "@/components/PredictPrompt";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

const ACCENT = "var(--c-regression)";

export const metadata = {
  title: "Natural & smoothing splines — Manifold",
  description: "Two refinements that make splines production-ready: natural splines calm the wild ends, and smoothing splines replace the fiddly job of placing knots with a single, tunable roughness penalty.",
};

export default function NaturalSmoothingSplinesPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: ACCENT }]}
        time="about 7 minutes"
        title={<>Natural &amp; smoothing splines</>}
        intro={<>
          Basic cubic splines leave two loose ends: they can still misbehave <em>past</em> the outer knots, and
          someone has to decide where the knots go. Natural splines fix the first; smoothing splines dissolve the
          second into a single dial you can tune automatically.
        </>}
      />

      <div className="lesson">
        <h2>Natural splines: calm the boundaries</h2>
        <p>
          A cubic spline is unconstrained beyond its outermost knots, and with little data out there, the end
          pieces can swing — a faint echo of the polynomial edge problem. A <strong>natural cubic spline</strong>
          adds a boundary condition: force the function to be <em>linear</em> beyond the first and last knots (the
          second derivative is zero at the ends). Straight lines can&rsquo;t oscillate, so the tails behave.
        </p>
        <p>
          The payoff is concentrated exactly where extrapolation is riskiest — the edges — at the cost of a
          little flexibility there, which you rarely have the data to justify anyway. In practice natural cubic
          splines are the default choice for this reason.
        </p>

        <h2>Smoothing splines: skip the knot-placement problem</h2>
        <p>
          Regression splines make you choose the number and location of knots — a fiddly, consequential decision.
          Smoothing splines take a bolder route: put a knot at <strong>every data point</strong> (maximum possible
          flexibility) and then prevent overfitting with a <em>penalty on wiggliness</em> instead of by limiting
          knots. The fit minimises
        </p>
        <MathBlock>{String.raw`\sum_{i=1}^{n}\big(y_i - f(x_i)\big)^2 \;+\; \lambda \int \big(f''(t)\big)^2\, dt.`}</MathBlock>
        <p>
          The first term is ordinary squared error; the second integrates the squared <em>second derivative</em> —
          a direct measure of how much the curve bends — over the whole range. The knob <M>\lambda</M> trades the
          two off, and it should look familiar: this is <strong>regularization</strong>, the same bias–variance
          dial as ridge, now penalising curvature instead of coefficient size.
        </p>
        <ul>
          <li><M>{String.raw`\lambda \to 0`}</M>: no penalty on bending — the curve interpolates every point (overfit).</li>
          <li><M>{String.raw`\lambda \to \infty`}</M>: any curvature is infinitely expensive — the fit collapses to the straight least-squares line (underfit).</li>
          <li>A middle <M>\lambda</M>, chosen by cross-validation, gives the smooth-but-faithful curve you want.</li>
        </ul>

        <PredictPrompt
          accent={ACCENT}
          prompt={<>A smoothing spline puts a knot at every point, so it <em>could</em> interpolate perfectly. What stops it from overfitting?</>}
          options={[
            "The roughness penalty λ∫(f'')² — bending is charged for, so the curve stays smooth",
            "It only uses half the knots",
            "Nothing — smoothing splines always overfit",
          ]}
          nudge={<>The number of knots isn&rsquo;t the control anymore — the penalty is.</>}
        />

        <p>
          Notice the conceptual shift. Regression splines control complexity <em>structurally</em>, by how many
          knots you allow; smoothing splines control it <em>continuously</em>, by how hard you penalise curvature.
          The second is easier to tune well — one smooth dial you can set by cross-validation — which is why
          smoothing splines (and their cousins, penalised regression splines / P-splines) dominate in practice.
        </p>

        <Callout color={ACCENT} title={<>Complexity, structural vs continuous</>}>
          Natural splines fix the tails by forcing linearity beyond the boundary knots. Smoothing splines replace
          &ldquo;where do the knots go?&rdquo; with &ldquo;how much curvature will I allow?&rdquo; — a single{" "}
          <M>\lambda</M> you tune by CV. Both are the same theme this whole track keeps circling: flexibility is
          easy; the real work is controlling it, and a continuous penalty is usually the cleanest control.
        </Callout>

        <Quiz
          accent={ACCENT}
          questions={[
            {
              q: "What does the 'natural' boundary condition do?",
              options: [
                "Forces the spline to be linear beyond the outer knots, calming the tails",
                "Adds more knots at the edges",
                "Makes the spline periodic",
              ],
              answer: 0,
              explain: "A natural cubic spline sets the second derivative to zero past the boundary knots, so it extrapolates as straight lines — which can't oscillate — reducing variance exactly where data is sparsest.",
            },
            {
              q: "A smoothing spline controls overfitting by…",
              options: [
                "Carefully choosing a few knot locations",
                "Placing a knot at every point but penalising curvature with λ∫(f'')²",
                "Lowering the polynomial degree to 1",
              ],
              answer: 1,
              explain: "Maximum knots for flexibility, then a roughness penalty to rein it in. λ trades data-fit against smoothness — the same regularization idea as ridge, applied to curvature.",
            },
            {
              q: "As λ in a smoothing spline grows very large, the fit approaches…",
              options: ["A perfect interpolation of the points", "The ordinary straight least-squares line", "A step function"],
              answer: 1,
              explain: "Large λ makes any curvature prohibitively costly, so the minimiser drives f'' to zero everywhere — a straight line, the ordinary linear least-squares fit. Small λ interpolates; the CV-chosen middle is the goal.",
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/polynomial-regression/splines", label: <>← Piecewise: splines</> }}
          next={{ href: "/learn/polynomial-regression/bias-variance-and-the-degree", label: <>Next up · Bias–variance &amp; the degree →</> }}
        />
      </div>
    </article>
  );
}
