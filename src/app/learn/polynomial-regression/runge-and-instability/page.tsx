import { M, MathBlock } from "@/components/Math";
import { PolynomialLab } from "@/components/labs/PolynomialLab";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LabFrame } from "@/components/LabFrame";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

const ACCENT = "var(--c-regression)";

export const metadata = {
  title: "The trouble with high degrees — Manifold",
  description: "Raising the polynomial degree should mean a better fit — instead the curve explodes into wild oscillations at the edges. Runge's phenomenon and an ill-conditioned design matrix are why high-degree polynomials are a trap.",
};

export default function RungeInstabilityPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: ACCENT }]}
        time="about 8 minutes"
        title={<>The trouble with high degrees</>}
        intro={<>
          If a degree-3 curve fits better than a line, surely degree-15 fits better still? It does not. Push the
          degree up and the polynomial starts thrashing — huge swings near the edges of the data, a curve that
          passes through every point yet predicts nonsense between them. Two separate problems are at work.
        </>}
      />

      <div className="lesson">
        <h2>Problem one: Runge&rsquo;s phenomenon</h2>
        <p>
          In 1901 Carl Runge noticed something counterintuitive: interpolating a perfectly smooth, gentle
          function with a high-degree polynomial makes the approximation <em>worse</em>, not better. The
          polynomial matches the target at the sample points but oscillates violently between them, and the
          oscillations blow up near the ends of the interval. Adding degree doesn&rsquo;t tame it — it feeds it.
        </p>
        <p>
          The cause is that a single global polynomial has no local control. To bend through a point in the
          middle, a high-degree curve must borrow enormous slope from its high-order terms, and those terms
          dominate at the extremes where <M>{String.raw`x^{15}`}</M> is astronomically large. The fit buys
          accuracy at the sample points by going haywire everywhere else — the opposite of what you want from a
          model that has to predict on new inputs.
        </p>

        <PredictPrompt
          accent={ACCENT}
          prompt={<>In the lab, slide the polynomial degree from a sensible 3 up toward the maximum. What happens to the training error, and to the curve&rsquo;s behaviour between and beyond the points?</>}
          options={[
            "Training error keeps dropping, but the curve oscillates wildly and generalises terribly",
            "Both training error and the curve's smoothness improve",
            "The curve stays smooth; only training error changes",
          ]}
          nudge={<>Crank the degree up and watch the fit thrash even as it threads more points exactly.</>}
        />

        <LabFrame
          accent={ACCENT}
          tryThis={<>Raise the degree well past what the data needs. Notice the fit passing through nearly every point (train error → 0) while the curve between points swings wildly — memorising, not learning.</>}
          insight={<>Every extra degree lets the curve thread the training points more exactly, driving training error toward
            zero — and the between-point behaviour worse. That widening gap between a shrinking training error and a
            worsening true fit is <em>overfitting</em>, and high-degree polynomials are its poster child. The lesson isn&rsquo;t
            &ldquo;avoid flexibility&rdquo; — it&rsquo;s &ldquo;get flexibility from a better-behaved basis.&rdquo;</>}
        >
          <PolynomialLab />
        </LabFrame>

        <h2>Problem two: an ill-conditioned design matrix</h2>
        <p>
          There&rsquo;s a numerical failure underneath the visual one. The polynomial design matrix (the
          Vandermonde matrix) has columns <M>{String.raw`1, x, x^2, \dots, x^d`}</M>, and for typical data those
          columns become <strong>nearly collinear</strong> — <M>{String.raw`x^{14}`}</M> and{" "}
          <M>{String.raw`x^{15}`}</M> look almost identical over a small range. Nearly collinear columns make{" "}
          <M>{String.raw`\Phi^\top\Phi`}</M> nearly singular, so
        </p>
        <MathBlock>{String.raw`\boldsymbol{\beta} = (\Phi^\top\Phi)^{-1}\Phi^\top\mathbf{y}`}</MathBlock>
        <p>
          involves inverting an almost-singular matrix — the <em>condition number</em> explodes. The practical
          symptoms: coefficients with wild magnitudes and alternating signs (huge positives cancelling huge
          negatives), and a fit that swings drastically from a tiny change in the data. Even before overfitting
          is a concern, the arithmetic itself is unstable.
        </p>

        <h2>The two fixes (and where they lead)</h2>
        <ul>
          <li>
            <strong>Change the basis to a local one.</strong> Splines and RBFs give flexibility through many{" "}
            <em>local</em> pieces instead of one high-degree global curve, so a wiggle in one region stays put.
            Runge&rsquo;s phenomenon essentially vanishes — the reason the next chapter is about them.
          </li>
          <li>
            <strong>Regularize.</strong> Keep the polynomial basis but add a ridge penalty on the weights,
            forbidding the giant cancelling coefficients that instability needs. This stabilises the inverse and
            tames the swings — the &ldquo;regularizing the basis&rdquo; page later.
          </li>
        </ul>
        <p>
          If you must use plain polynomials, use an <strong>orthogonal</strong> polynomial basis (Legendre,
          Chebyshev) rather than raw powers: same span, vastly better conditioning. But in practice, once you
          need real flexibility, the answer is almost always splines — flexibility without the fireworks.
        </p>

        <Callout color={ACCENT} title={<>High degree is the wrong lever</>}>
          More degree gives you flexibility <em>and</em> instability in the same move — Runge oscillations plus an
          ill-conditioned solve. The fix is never &ldquo;crank the degree&rdquo;; it&rsquo;s a better basis
          (local: splines/RBFs) or a penalty (ridge). Flexibility is good; getting it from one giant global
          polynomial is not.
        </Callout>

        <Quiz
          accent={ACCENT}
          questions={[
            {
              q: "Runge's phenomenon is…",
              options: [
                "High-degree polynomial interpolation oscillating wildly, worst near the interval's edges",
                "A polynomial being unable to fit the training points",
                "A rounding error in the sigmoid",
              ],
              answer: 0,
              explain: "A single high-degree polynomial forced through evenly-spaced points swings violently between them, especially at the ends — accuracy at the samples bought with nonsense elsewhere.",
            },
            {
              q: "Why does the polynomial design matrix become numerically unstable at high degree?",
              options: [
                "It has too few rows",
                "Columns like x¹⁴ and x¹⁵ become nearly collinear, so ΦᵀΦ is near-singular and its inverse blows up",
                "The labels are noisy",
              ],
              answer: 1,
              explain: "High powers look almost identical over a limited range, making the columns nearly linearly dependent. Inverting the resulting near-singular ΦᵀΦ gives huge, alternating-sign coefficients — the ill-conditioning symptom.",
            },
            {
              q: "The recommended way to get flexibility without Runge oscillations is…",
              options: [
                "Increase the degree further",
                "Use a local basis (splines/RBFs) or add a ridge penalty",
                "Remove data points near the edges",
              ],
              answer: 1,
              explain: "Local bases confine wiggles to their region, and ridge forbids the giant cancelling coefficients instability needs. Both deliver flexibility without the edge explosions of a single high-degree polynomial.",
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/polynomial-regression/basis-functions", label: <>← Basis functions: the big idea</> }}
          next={{ href: "/learn/polynomial-regression/radial-basis-functions", label: <>Next up · Radial basis functions →</> }}
        />
      </div>
    </article>
  );
}
