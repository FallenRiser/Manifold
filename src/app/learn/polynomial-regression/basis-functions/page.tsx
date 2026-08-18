import { M, MathBlock } from "@/components/Math";
import { BasisFunctionLab } from "@/components/labs/BasisFunctionLab";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LabFrame } from "@/components/LabFrame";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

const ACCENT = "var(--c-regression)";

export const metadata = {
  title: "Basis functions: the big idea — Manifold",
  description: "Powers of x were just one choice of building block. Swap them for any set of fixed functions — bumps, waves, hinges — and least squares fits the same way. That single idea is the engine behind splines, RBFs, and kernels.",
};

export default function BasisFunctionsPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: ACCENT }]}
        time="about 8 minutes"
        title={<>Basis functions: the big idea</>}
        intro={<>
          Polynomials taught the trick: transform the input, then fit a straight line to the weights. But
          nothing said the transforms had to be <em>powers</em>. Pick any fixed set of building blocks and the
          whole least-squares machine runs unchanged. That freedom is one of the most powerful ideas in
          regression.
        </>}
      />

      <div className="lesson">
        <h2>The move, generalised</h2>
        <p>
          A polynomial fit is a weighted sum of powers, <M>{String.raw`\hat y = \sum_j \beta_j x^j`}</M>. Replace
          each power <M>{String.raw`x^j`}</M> with a general function <M>{String.raw`\phi_j(x)`}</M> — a{" "}
          <strong>basis function</strong> — and the model becomes
        </p>
        <MathBlock>{String.raw`\hat y = \sum_{j=1}^{m} \beta_j\,\phi_j(x) = \boldsymbol{\phi}(x)^\top\boldsymbol{\beta}.`}</MathBlock>
        <p>
          The <M>{String.raw`\phi_j`}</M> are fixed in advance — you choose them, you don&rsquo;t fit them. Only
          the weights <M>{String.raw`\beta_j`}</M> are learned, and the model is still <em>linear in those
          weights</em>. So the design matrix <M>\Phi</M> (one column per basis function) drops straight into the
          normal equation you already know:
        </p>
        <MathBlock>{String.raw`\boldsymbol{\beta} = (\Phi^\top\Phi)^{-1}\Phi^\top\mathbf{y}.`}</MathBlock>
        <p>
          Curvy shapes, easy fit. The art is choosing building blocks whose weighted sums can express the shapes
          you expect — and each classic choice is just a different <M>{String.raw`\phi_j`}</M>:
        </p>
        <ul>
          <li><strong>Polynomials</strong> — <M>{String.raw`\phi_j(x) = x^j`}</M>: global, smooth, but coupled (every point affects every weight).</li>
          <li><strong>Radial basis functions</strong> — <M>{String.raw`\phi_j(x) = e^{-\|x - c_j\|^2 / 2\ell^2}`}</M>: local bumps centred at points <M>{String.raw`c_j`}</M>.</li>
          <li><strong>Fourier</strong> — sines and cosines: for periodic signals.</li>
          <li><strong>Splines</strong> — piecewise polynomials joined smoothly: local <em>and</em> stable (two pages ahead).</li>
        </ul>

        <PredictPrompt
          accent={ACCENT}
          prompt={<>In the lab, the bold fit is built by adding up the faint building blocks below it. As you increase the number of blocks, what happens to the fit?</>}
          options={[
            "It grows more flexible — eventually bending to chase the noise",
            "It gets stiffer and flatter",
            "The number of blocks doesn't change the fit",
          ]}
          nudge={<>Add blocks and watch the bold curve go from too-simple to just-right to too-wiggly.</>}
        />

        <LabFrame
          accent={ACCENT}
          tryThis={<>Switch between RBF bumps and polynomial powers, then slide the number of building blocks up. Watch the bold fit assemble itself as a weighted sum of the faint pieces — and start chasing noise once there are too many.</>}
          insight={<>Both bases fit by the same least-squares step; they differ in <em>shape</em>. RBF bumps are local — each one
            lifts the curve near its centre and nowhere else — so adding one barely disturbs the rest of the fit. Polynomial
            powers are global — nudging a high-degree weight ripples across the whole domain. That locality difference is why
            RBFs and splines behave so much better than high-degree polynomials, which is the very next page.</>}
        >
          <BasisFunctionLab />
        </LabFrame>

        <h2>Why this idea is everywhere</h2>
        <p>
          Basis-function regression is the hinge between simple linear models and the flexible methods that
          follow. Choose local bumps and you get RBF networks and, in the limit, <strong>kernel methods</strong>
          — a Gaussian process is basis regression with infinitely many bumps. Choose piecewise polynomials and
          you get <strong>splines</strong>, the backbone of curve-fitting in statistics and graphics. Even a
          neural network&rsquo;s last layer is a linear fit on top of basis functions — except it <em>learns</em>
          the basis instead of fixing it. Master the fixed-basis case and the learned-basis case is a short step.
        </p>

        <Callout color={ACCENT} title={<>One template, many models</>}>
          Pick fixed functions <M>{String.raw`\phi_j`}</M>, build the design matrix <M>\Phi</M>, solve the same
          normal equation. Polynomials, RBFs, Fourier, splines — all the same fit with different columns. The
          only real decisions are <em>which</em> basis and <em>how many</em> — and those are exactly the
          bias–variance and regularization questions the rest of this track answers.
        </Callout>

        <Quiz
          accent={ACCENT}
          questions={[
            {
              q: "What makes basis-function regression still count as linear regression?",
              options: [
                "The basis functions are straight lines",
                "The model is a linear combination of fixed, pre-computed functions — linear in the weights β",
                "It only works for low degrees",
              ],
              answer: 1,
              explain: "The φⱼ(x) are computed before fitting, so the model is a weighted sum of known columns. Linearity in β is what preserves the closed form and all of least-squares theory — the shapes can be as curvy as you like.",
            },
            {
              q: "The key behavioural difference between polynomial and RBF bases is…",
              options: [
                "RBFs are local (each bump affects one region); polynomials are global (each term affects everywhere)",
                "RBFs can't be fit by least squares",
                "Polynomials are always more accurate",
              ],
              answer: 0,
              explain: "An RBF bump lifts the fit only near its centre, so bases barely interfere. Polynomial powers are global — changing one weight reshapes the whole curve. Locality is why RBFs and splines are more stable.",
            },
            {
              q: "Choosing a Fourier (sine/cosine) basis is most appropriate when…",
              options: ["The data is periodic", "The data has outliers", "You have very few points"],
              answer: 0,
              explain: "Basis choice should match the expected shape. Sines and cosines naturally represent periodic signals; powers suit smooth trends; local bumps suit localized structure.",
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/polynomial-regression/linear-in-parameters", label: <>← Still linear in the parameters</> }}
          next={{ href: "/learn/polynomial-regression/runge-and-instability", label: <>Next up · The trouble with high degrees →</> }}
        />
      </div>
    </article>
  );
}
