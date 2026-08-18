import { M, MathBlock } from "@/components/Math";
import { SplineKnotsLab } from "@/components/labs/SplineKnotsLab";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LabFrame } from "@/components/LabFrame";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

const ACCENT = "var(--c-regression)";

export const metadata = {
  title: "Piecewise: splines — Manifold",
  description: "The most-used flexible regressor in statistics: fit many low-degree pieces between knots and glue them smoothly. Flexibility from the number of knots, not the degree — so splines never Runge.",
};

export default function SplinesPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: ACCENT }]}
        time="about 8 minutes"
        title={<>Piecewise: splines</>}
        intro={<>
          Splines take the local idea to its natural conclusion: instead of one curve over the whole range, fit
          many <em>low-degree</em> pieces, each on a small interval, and glue them together smoothly. It&rsquo;s
          the most widely used flexible-regression tool in statistics — and it sidesteps every problem of the last two pages.
        </>}
      />

      <div className="lesson">
        <h2>Low degree, many pieces</h2>
        <p>
          A spline chops the input range at chosen points called <strong>knots</strong> and fits a separate
          low-degree polynomial — usually cubic — on each interval. On its own, that would give a jagged,
          disconnected curve. The magic is in the join conditions: at every knot, adjacent pieces are forced to
          <strong> match in value and in their first two derivatives</strong>. The seams become invisible; the
          result is one globally smooth curve assembled from humble local parts.
        </p>
        <p>
          Cubic pieces (degree 3) are the sweet spot: high enough to look smooth to the eye (continuous
          curvature), low enough to be perfectly stable. You get flexibility from the <em>number of knots</em>,
          not from cranking a single polynomial&rsquo;s degree — which is exactly why splines don&rsquo;t Runge.
        </p>

        <PredictPrompt
          accent={ACCENT}
          prompt={<>In the figure, adding knots adds pieces. How does the fit&rsquo;s behaviour compare to raising a single polynomial&rsquo;s degree?</>}
          options={[
            "It hugs the curve locally and stays calm — no edge explosions",
            "It oscillates wildly at the edges, just like polynomials",
            "It can't improve past 3 or 4 knots",
          ]}
          nudge={<>Slide the knot count up and watch each local piece settle onto its stretch of the curve.</>}
        />

        <LabFrame
          accent={ACCENT}
          tryThis={<>Slide the number of knots from 1 upward. Watch the piecewise fit tighten onto the true curve, each segment governing only its own interval — never swinging off the way a high-degree polynomial does.</>}
          insight={<>More knots means more flexibility, but it arrives <em>locally</em>: a knot added on the left leaves the
            right untouched. That&rsquo;s the whole advantage over a global polynomial — you can be as flexible as you like in
            a busy region without destabilising the calm ones. Real cubic splines also smooth the joins so there are no
            corners; this figure shows the knot/locality idea with straight pieces.</>}
        >
          <SplineKnotsLab />
        </LabFrame>

        <h2>Still just a basis</h2>
        <p>
          Here&rsquo;s the reassuring part: a spline is <em>still</em> a basis-function model. There is a set of
          basis functions — <strong>B-splines</strong> — whose weighted sum produces exactly these smooth
          piecewise curves, and each B-spline is non-zero over only a few adjacent intervals (compact support).
          So fitting a spline is the same least-squares solve as always,
        </p>
        <MathBlock>{String.raw`\hat y = \sum_{j} \beta_j\, B_j(x), \qquad \boldsymbol{\beta} = (\Phi^\top\Phi)^{-1}\Phi^\top \mathbf{y},`}</MathBlock>
        <p>
          just with a well-behaved, local basis. The compact support is what keeps <M>{String.raw`\Phi^\top\Phi`}</M>
          nicely conditioned — the numerical instability of raw polynomial powers is gone too. Flexibility,
          smoothness, and stability, all at once.
        </p>

        <Callout color={ACCENT} title={<>Knots are the flexibility dial</>}>
          Fix the piece degree at 3 (cubic) and control the fit with the <em>number and placement of knots</em>:
          more knots where the function is busy, fewer where it&rsquo;s calm. That local control is why splines
          are the default flexible regressor in statistics — and the next page tames the two loose ends (what
          happens past the outer knots, and how to pick the amount of smoothing automatically).
        </Callout>

        <Quiz
          accent={ACCENT}
          questions={[
            {
              q: "A cubic spline achieves smoothness by…",
              options: [
                "Using one high-degree polynomial",
                "Fitting cubic pieces between knots and matching value + first two derivatives at each knot",
                "Averaging nearby points",
              ],
              answer: 1,
              explain: "Each interval gets its own cubic; the continuity conditions at the knots (matching the function and its first two derivatives) glue the pieces into one seamless, smooth curve.",
            },
            {
              q: "Why do splines avoid Runge's phenomenon?",
              options: [
                "They use higher degrees",
                "Flexibility comes from more knots (local pieces), not from a single high-degree global polynomial",
                "They ignore edge points",
              ],
              answer: 1,
              explain: "Low-degree local pieces can't explode at the edges the way x¹⁵ does. Adding a knot adds flexibility only in that region, leaving the rest — and the numerics — well behaved.",
            },
            {
              q: "In basis-function terms, a spline is fit using…",
              options: [
                "B-splines — local basis functions with compact support, via the same least-squares solve",
                "A completely different, non-linear optimiser",
                "No basis at all",
              ],
              answer: 0,
              explain: "B-splines are a basis whose members are non-zero over only a few intervals. Their weighted sum gives the smooth piecewise curve, fit by the ordinary normal equation — and their compact support keeps the design matrix well conditioned.",
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/polynomial-regression/radial-basis-functions", label: <>← Radial basis functions</> }}
          next={{ href: "/learn/polynomial-regression/natural-and-smoothing-splines", label: <>Next up · Natural &amp; smoothing splines →</> }}
        />
      </div>
    </article>
  );
}
