import { Quiz } from "@/components/Quiz";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Still linear in the parameters — Manifold",
  description:
    "A polynomial fit is a curve, yet it's still 'linear regression'. The reason is a subtle distinction: linear in the inputs vs linear in the parameters. Only the second one matters — and it's what keeps the closed form, convexity, and all of least-squares theory intact.",
};

export default function LinearInParametersPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }]}
        time="about 6 minutes"
        title={<>Still linear in the parameters</>}
        intro={<>
          A degree-5 fit is unmistakably a curve. So why do we still call it <em>linear</em> regression? Because the
        word &ldquo;linear&rdquo; was never about the shape of the curve — it&rsquo;s about how the model depends on its weights.
        </>}
      />

      <div className="lesson">
        <h2>Two different meanings of &ldquo;linear&rdquo;</h2>
        <p>
          Look at a polynomial model and ask <em>which variables it&rsquo;s linear in</em>:
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, margin: "1.2rem 0" }} className="elbow-grid">
          <div style={{ ...optCard, borderColor: "color-mix(in srgb, var(--bad) 28%, var(--border))" }}>
            <div className="font-display" style={{ fontSize: 13, fontWeight: 600, color: "var(--bad)", marginBottom: 6 }}>Non-linear in the input x</div>
            <p style={{ margin: 0, fontSize: 13.5, color: "var(--muted)", lineHeight: 1.55 }}>
              Double <M>{String.raw`x`}</M> and <M>{String.raw`\hat y`}</M> does <em>not</em> double — the{" "}
              <M>{String.raw`x^2`}</M> and <M>{String.raw`x^3`}</M> terms bend the response. Good: that&rsquo;s the curve
              we wanted.
            </p>
          </div>
          <div style={{ ...optCard, borderColor: "color-mix(in srgb, var(--good) 30%, var(--border))", background: "color-mix(in srgb, var(--good) 6%, var(--surface-2))" }}>
            <div className="font-display" style={{ fontSize: 13, fontWeight: 600, color: "var(--good)", marginBottom: 6 }}>Linear in the parameters β ← what counts</div>
            <p style={{ margin: 0, fontSize: 13.5, color: "var(--muted)", lineHeight: 1.55 }}>
              Treat the powers as fixed numbers and the model is a plain weighted sum of them. Double every{" "}
              <M>{String.raw`\beta_j`}</M> and <M>{String.raw`\hat y`}</M> doubles. That&rsquo;s the linearity least
              squares needs.
            </p>
          </div>
        </div>

        <p>
          Write the expanded features as <M>{String.raw`\phi_j(x)`}</M> — here <M>{String.raw`\phi_j(x) = x^j`}</M> —
          and the model is:
        </p>
        <MathBlock>{String.raw`\hat{y} = \sum_{j=0}^{d} \beta_j\, \phi_j(x) = \boldsymbol{\phi}(x)^\top \boldsymbol{\beta}`}</MathBlock>
        <p>
          The <M>{String.raw`\phi_j`}</M> can be as curvy as you like — powers, sines, Gaussian bumps — and the
          model is <strong>still a straight-line function of the weights <M>{String.raw`\boldsymbol{\beta}`}</M></strong>.
          Stack the transformed rows into a design matrix <M>{String.raw`\boldsymbol{\Phi}`}</M> and you get back the
          familiar normal equation, unchanged:
        </p>
        <MathBlock>{String.raw`\boldsymbol{\beta} = (\boldsymbol{\Phi}^\top\boldsymbol{\Phi})^{-1}\boldsymbol{\Phi}^\top \mathbf{y}`}</MathBlock>

        <h2>Why this is such a big deal</h2>
        <p>
          Because the model is linear in <M>{String.raw`\boldsymbol{\beta}`}</M>, <strong>everything</strong> you
          learned about least squares carries over verbatim:
        </p>
        <ul style={ul}>
          <li>A <strong>closed-form solution</strong> — no iterative optimizer required.</li>
          <li>A <strong>convex, bowl-shaped loss</strong> with a single global minimum — no local optima to fear.</li>
          <li><strong>Ridge and lasso</strong> plug in directly (just penalize the same <M>{String.raw`\boldsymbol{\beta}`}</M>).</li>
          <li>The whole <strong>inference toolkit</strong> — standard errors, confidence intervals — still applies.</li>
        </ul>

        <Callout color="var(--c-regression)" title={<>What would break the trick</>}>
          A model like <M>{String.raw`\hat y = \beta_0\, e^{\beta_1 x}`}</M> is non-linear <em>in the parameters</em>
            — <M>{String.raw`\beta_1`}</M> sits inside the exponential. That has no closed form and a possibly
            non-convex loss; you&rsquo;d need gradient-based nonlinear least squares. The art of basis-function regression
            is getting non-linear <em>shapes</em> while keeping the parameters linear — so you never leave the
            easy world.
        </Callout>

        <Quiz
          accent="var(--c-regression)"
          questions={[
            {
              q: "Fitting y = w₀ + w₁x + w₂x² still counts as LINEAR regression because…",
              options: ["The model is linear in the weights — x² is just another feature column", "The curve is secretly a straight line", "It's a historical misnomer"],
              answer: 0,
              explain: "Squares and cubes of x are computed before fitting; the fit itself is still a linear combination of columns. Same normal equation, same gradient descent, same everything.",
            },
            {
              q: "Which of these CANNOT be fit by ordinary least squares after a feature transform?",
              options: ["y = w₀ + w₁ sin(x) + w₂ log(x)", "y = w₁x / (w₂ + x) — a weight tangled inside the formula", "y = w₀ + w₁x³"],
              answer: 1,
              explain: "sin(x), log(x), x³ are all just columns — linear in w. But w₂ sitting inside a denominator can't be pulled out into a linear combination; that's genuinely nonlinear regression.",
            },
            {
              q: "The practical payoff of staying linear-in-parameters is…",
              options: ["The whole OLS toolkit still applies — closed form, diagnostics, regularization", "The model can never overfit", "Predictions stay bounded"],
              answer: 0,
              explain: "One idea, everything transfers. (Overfitting definitely still happens: high-degree polynomials are famous for it, as the next page shows.)",
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/polynomial-regression/polynomial-features", label: <>← Polynomial regression</> }} next={{ href: "/learn/polynomial-regression/basis-functions", label: <>Next up · Basis functions: the big idea →</> }} />
      </div>
    </article>
  );
}

const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const optCard: React.CSSProperties = { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "13px 15px" };
