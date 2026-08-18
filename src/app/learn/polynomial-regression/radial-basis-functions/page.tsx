import { M, MathBlock } from "@/components/Math";
import { BasisFunctionLab } from "@/components/labs/BasisFunctionLab";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LabFrame } from "@/components/LabFrame";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

const ACCENT = "var(--c-regression)";

export const metadata = {
  title: "Radial basis functions — Manifold",
  description: "The cure for Runge's oscillations: replace one global polynomial with many local bumps. Radial basis functions give flexibility that stays put — and open the door to kernels.",
};

export default function RadialBasisFunctionsPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: ACCENT }]}
        time="about 8 minutes"
        title={<>Radial basis functions</>}
        intro={<>
          High-degree polynomials failed because they&rsquo;re global — one wiggle disturbs the whole curve.
          Radial basis functions fix it with the opposite design: a pile of <em>local</em> bumps, each minding
          its own patch of the input. Same least-squares fit, none of the fireworks.
        </>}
      />

      <div className="lesson">
        <h2>A bump per neighbourhood</h2>
        <p>
          A radial basis function measures distance from a fixed <strong>centre</strong> <M>{String.raw`c_j`}</M>
          and falls off smoothly as you move away. The Gaussian RBF is the standard one:
        </p>
        <MathBlock>{String.raw`\phi_j(x) = \exp\!\left(-\frac{\lVert x - c_j\rVert^2}{2\,\ell^2}\right).`}</MathBlock>
        <p>
          It peaks at 1 when <M>{String.raw`x = c_j`}</M> and decays toward 0 in both directions; the{" "}
          <strong>width</strong> <M>\ell</M> sets how far its influence reaches. Scatter a handful of centres
          across the input range and the model is, as always, a weighted sum — least squares picks the heights:
        </p>
        <MathBlock>{String.raw`\hat y = \sum_{j=1}^{m} \beta_j \exp\!\left(-\frac{\lVert x - c_j\rVert^2}{2\ell^2}\right).`}</MathBlock>
        <p>
          Because each bump is <em>local</em>, changing one weight lifts or lowers the curve only near that
          centre. There is no <M>{String.raw`x^{15}`}</M> term to explode at the edges — the very mechanism
          behind Runge&rsquo;s phenomenon is simply absent.
        </p>

        <PredictPrompt
          accent={ACCENT}
          prompt={<>Switch the lab to RBF bumps. The width parameter controls each bump&rsquo;s reach. What does a very <em>narrow</em> width do to the fit?</>}
          options={[
            "Makes it spiky and overfit — each bump hugs its own point",
            "Makes it flatter and smoother",
            "Has no effect on the fit",
          ]}
          nudge={<>Think about bumps so narrow they only touch one data point each.</>}
        />

        <LabFrame
          accent={ACCENT}
          tryThis={<>Choose RBF bumps and vary how many there are. See how each faint bump sits over one region, and how the bold fit is just their weighted sum — flexible where you add bumps, calm everywhere else.</>}
          insight={<>RBFs give you two knobs, not one: how <em>many</em> bumps (more = more flexibility) and how <em>wide</em>
            each is (the width <M>\ell</M>). Narrow bumps overfit — each clings to a point; wide bumps oversmooth — they blur
            together into a near-flat line. Unlike polynomial degree, adding a bump only affects its own neighbourhood, so the
            fit degrades gracefully instead of exploding.</>}
        >
          <BasisFunctionLab />
        </LabFrame>

        <h2>The two knobs, and their trade</h2>
        <ul>
          <li><strong>Number of centres</strong> — more bumps mean more flexibility (and more risk of overfitting), the direct analogue of polynomial degree.</li>
          <li><strong>Width <M>\ell</M></strong> — narrow bumps chase individual points (high variance); wide bumps blur across regions (high bias). It&rsquo;s a smoothness dial independent of the count.</li>
        </ul>
        <p>
          Where to put the centres? Common choices: spread them evenly over the range, or place one at each data
          point (or a clustered subset). Place one at <em>every</em> point and you&rsquo;ve essentially built a{" "}
          <strong>kernel method</strong> — which is the deep connection here.
        </p>

        <Callout color={ACCENT} title={<>RBFs are the bridge to kernels</>}>
          An RBF model with a centre at every training point, fit with a ridge penalty, <em>is</em> kernel ridge
          regression; take the number of bumps to infinity and you get a Gaussian process. So the humble bump you
          just fit by least squares is the same machinery behind some of the most powerful non-parametric models
          — you&rsquo;ll meet it again, unchanged in spirit, in the kernels track.
        </Callout>

        <Quiz
          accent={ACCENT}
          questions={[
            {
              q: "Why don't radial basis functions suffer from Runge's phenomenon like high-degree polynomials?",
              options: [
                "They're fit with a different algorithm",
                "Each bump is local, so flexibility in one region doesn't cause blow-ups at the edges",
                "They can't overfit at all",
              ],
              answer: 1,
              explain: "RBFs are local: a bump only affects its neighbourhood. There's no global high-order term to explode at the extremes, so the edge oscillations that plague polynomials simply don't arise.",
            },
            {
              q: "The width parameter ℓ of a Gaussian RBF controls…",
              options: [
                "How far each bump's influence reaches — small ℓ = spiky/overfit, large ℓ = smooth/underfit",
                "The number of bumps",
                "The learning rate",
              ],
              answer: 0,
              explain: "ℓ sets each bump's reach. Narrow bumps hug individual points (high variance); wide bumps blur together (high bias). It's a smoothness control separate from how many centres you use.",
            },
            {
              q: "Placing an RBF centre at every training point and adding a ridge penalty gives you…",
              options: ["A polynomial", "Kernel ridge regression — the bridge from basis functions to kernel methods", "A decision tree"],
              answer: 1,
              explain: "One bump per point plus regularization is exactly kernel ridge regression; the infinite-bump limit is a Gaussian process. RBF regression is the on-ramp to kernel methods.",
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/polynomial-regression/runge-and-instability", label: <>← The trouble with high degrees</> }}
          next={{ href: "/learn/polynomial-regression/splines", label: <>Next up · Piecewise: splines →</> }}
        />
      </div>
    </article>
  );
}
