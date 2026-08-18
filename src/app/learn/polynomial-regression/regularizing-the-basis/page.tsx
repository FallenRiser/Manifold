import { M, MathBlock } from "@/components/Math";
import { RidgePolyLab } from "@/components/labs/RidgePolyLab";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LabFrame } from "@/components/LabFrame";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

const ACCENT = "var(--c-regression)";

export const metadata = {
  title: "Regularizing the basis — Manifold",
  description: "Instead of hunting for the exact right number of bases, use a generous basis and a penalty. Ridge on the coefficients turns discrete model selection into one smooth, tunable dial.",
};

export default function RegularizingBasisPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: ACCENT }]}
        time="about 8 minutes"
        title={<>Regularizing the basis</>}
        intro={<>
          Choosing the exact number of bases is a discrete, brittle search. There&rsquo;s a smoother way: throw in
          <em> plenty</em> of bases and let a penalty decide how much of that flexibility to actually use. It turns
          model selection into a continuous dial — the same ridge idea, now steering a flexible curve.
        </>}
      />

      <div className="lesson">
        <h2>Flexibility on tap, controlled by λ</h2>
        <p>
          A high-degree polynomial (or a many-knot spline) overfits because its coefficients grow huge and
          cancel, producing wild swings. Ridge regression forbids that directly: add a penalty on the squared
          coefficients to the least-squares objective,
        </p>
        <MathBlock>{String.raw`\min_{\boldsymbol{\beta}} \; \lVert \mathbf{y} - \Phi\boldsymbol{\beta}\rVert^2 \;+\; \lambda \lVert \boldsymbol{\beta}\rVert^2,`}</MathBlock>
        <p>
          which has the same tidy closed form as ordinary least squares, with one extra term on the diagonal:
        </p>
        <MathBlock>{String.raw`\boldsymbol{\beta} = (\Phi^\top\Phi + \lambda I)^{-1}\Phi^\top \mathbf{y}.`}</MathBlock>
        <p>
          That <M>{String.raw`+\,\lambda I`}</M> does double duty. Statistically, it shrinks the coefficients
          toward zero, trading a little bias for a large drop in variance — smoother fits. Numerically, it lifts
          the eigenvalues of <M>{String.raw`\Phi^\top\Phi`}</M> away from zero, curing the ill-conditioning that
          made high-degree polynomials explode. One term, two problems solved.
        </p>

        <PredictPrompt
          accent={ACCENT}
          prompt={<>In the lab, a degree-9 polynomial is fit with ridge. As you raise λ from near-zero, what happens to the wild wiggles?</>}
          options={[
            "They flatten out — the curve smooths toward a gentle shape",
            "They get worse — more penalty means more oscillation",
            "Nothing changes; λ only affects training speed",
          ]}
          nudge={<>Slide λ up and watch the degree-9 curve go from thrashing to smooth to too-flat.</>}
        />

        <LabFrame
          accent={ACCENT}
          tryThis={<>Start with λ near zero (the degree-9 polynomial overfits wildly), then raise it. Watch the fit smooth toward the true curve, then oversmooth if you push λ too far. Find the λ that best matches the underlying shape.</>}
          insight={<>The <em>same</em> degree-9 model can underfit, fit well, or overfit — it&rsquo;s λ, not the degree, that
            decides. That&rsquo;s the shift: rather than agonise over the exact number of bases, use a generous basis and let
            a continuous λ (chosen by cross-validation) set the effective flexibility. Discrete model selection becomes a
            smooth knob you can tune precisely.</>}
        >
          <RidgePolyLab />
        </LabFrame>

        <h2>Degrees of freedom, made continuous</h2>
        <p>
          Picking among degrees 1, 2, 3, … is a coarse, integer choice. Ridge replaces it with a continuous one:
          the penalty defines an <strong>effective</strong> number of degrees of freedom that slides smoothly from
          &ldquo;flexible&rdquo; (small <M>\lambda</M>) to &ldquo;nearly linear&rdquo; (large <M>\lambda</M>). You
          fix the basis generously once, then tune the single knob <M>\lambda</M> by cross-validation — usually
          easier and more stable than searching a discrete grid of knot counts.
        </p>
        <p>
          It also composes with everything earlier: ridge on a <em>spline</em> basis is a penalised regression
          spline (a P-spline); a curvature penalty on a maximal basis is the smoothing spline you already met.
          &ldquo;Generous basis + penalty&rdquo; is the pattern under all of them.
        </p>

        <Callout color={ACCENT} title={<>Prefer a knob to a search</>}>
          Rather than pinpoint the perfect number of bases, over-provision the basis and regularize. Ridge&rsquo;s{" "}
          <M>{String.raw`+\lambda I`}</M> smooths the fit <em>and</em> stabilises the numerics, and one continuous{" "}
          <M>\lambda</M> (set by CV) replaces a brittle discrete search. This is the polynomial/regularized-track
          bridge: same penalty, now controlling a flexible non-linear curve.
        </Callout>

        <Quiz
          accent={ACCENT}
          questions={[
            {
              q: "Adding λ‖β‖² to the least-squares objective for a high-degree polynomial does what?",
              options: [
                "Shrinks the coefficients, smoothing the fit and stabilising the matrix inverse",
                "Increases the polynomial degree",
                "Removes basis functions entirely",
              ],
              answer: 0,
              explain: "The ridge penalty pulls coefficients toward zero (less variance, smoother curve) and adds λI to ΦᵀΦ, lifting its eigenvalues away from zero to cure ill-conditioning. Flexibility stays available but controlled.",
            },
            {
              q: "The practical advantage of 'generous basis + ridge penalty' over choosing an exact basis count is…",
              options: [
                "It's always more accurate",
                "It replaces a brittle discrete search with a single continuous λ you can tune smoothly by CV",
                "It needs no cross-validation",
              ],
              answer: 1,
              explain: "A continuous penalty gives fractional 'effective degrees of freedom', so you tune one smooth knob instead of hunting integer knot counts — easier to optimise and more stable.",
            },
            {
              q: "In the ridge solution β = (ΦᵀΦ + λI)⁻¹Φᵀy, the λI term also helps by…",
              options: [
                "Making the model nonlinear in β",
                "Improving conditioning — it moves ΦᵀΦ's eigenvalues away from zero",
                "Deleting correlated columns",
              ],
              answer: 1,
              explain: "Beyond shrinkage, λI regularises the numerics: near-collinear basis columns make ΦᵀΦ nearly singular, and adding λI restores a stable, well-conditioned inverse.",
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/polynomial-regression/choosing-the-number-of-bases", label: <>← Choosing the number of bases</> }}
          next={{ href: "/learn/polynomial-regression/pipelines-scaling-and-leakage", label: <>Next up · Pipelines, scaling &amp; leakage →</> }}
        />
      </div>
    </article>
  );
}
