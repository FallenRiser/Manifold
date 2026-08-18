import { M, MathBlock } from "@/components/Math";
import { PredictPrompt } from "@/components/PredictPrompt";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

const ACCENT = "var(--c-classification)";

export const metadata = {
  title: "Logistic regression as a GLM — Manifold",
  description: "Linear and logistic regression aren't cousins by coincidence — they're two members of one family. The generalized linear model is the template, and it explains the gradient you already love.",
};

export default function GlmPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: ACCENT }, { label: "Theory", color: "var(--c-metrics)" }]}
        time="about 9 minutes"
        title={<>Logistic regression as a GLM</>}
        intro={<>
          You&rsquo;ve now met two models with the same gradient shape and the same MLE backbone. That&rsquo;s
          not a rhyme — it&rsquo;s a family resemblance. Both are <strong>generalized linear models</strong>,
          and seeing the template makes logistic regression feel inevitable instead of clever.
        </>}
      />

      <div className="lesson">
        <h2>Three choices define a GLM</h2>
        <p>
          A generalized linear model keeps linear regression&rsquo;s engine — a linear score{" "}
          <M>{String.raw`\eta = w^\top x`}</M> — and generalises the two things around it. You pick:
        </p>
        <ol>
          <li>
            A <strong>distribution</strong> for the target (from the exponential family): Gaussian for real
            numbers, Bernoulli for yes/no, Poisson for counts.
          </li>
          <li>
            A <strong>link function</strong> <M>g</M> that connects the distribution&rsquo;s mean{" "}
            <M>{String.raw`\mu = \mathbb{E}[y \mid x]`}</M> to the linear score: <M>{String.raw`g(\mu) = \eta`}</M>.
          </li>
        </ol>
        <p>
          The linear predictor lives on the whole real line, but a mean often can&rsquo;t — a probability is
          trapped in <M>{String.raw`[0,1]`}</M>, a count in <M>{String.raw`[0,\infty)`}</M>. The link is the
          translator between the unbounded score and the constrained mean. For logistic regression the mean{" "}
          <em>is</em> the probability <M>p</M>, and the link is the <strong>logit</strong>:
        </p>
        <MathBlock>{String.raw`g(p) = \log\frac{p}{1-p} = w^\top x \quad\Longleftrightarrow\quad p = \sigma(w^\top x).`}</MathBlock>
        <p>
          Read left to right: the log-odds are linear in the features — the exact fact the odds-ratio page
          leaned on. Invert the logit and you get the sigmoid back. The sigmoid was never the starting point;
          it&rsquo;s the <em>inverse link</em> that undoes the logit.
        </p>

        <h2>The family, at a glance</h2>
        <div style={{ overflowX: "auto", margin: "1.4rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 540, width: "100%" }}>
            <thead>
              <tr>
                <th style={th}>Model</th>
                <th style={th}>Target</th>
                <th style={th}>Distribution</th>
                <th style={th}>Link <M>{String.raw`g(\mu)`}</M></th>
                <th style={th}>Mean <M>\mu</M></th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={td}>Linear</td>
                <td style={td}>real number</td>
                <td style={td}>Gaussian</td>
                <td style={td}>identity: <M>\mu</M></td>
                <td style={td}><M>{String.raw`w^\top x`}</M></td>
              </tr>
              <tr style={{ background: `color-mix(in srgb, ${ACCENT} 6%, var(--surface))` }}>
                <td style={td}><strong>Logistic</strong></td>
                <td style={td}>yes / no</td>
                <td style={td}>Bernoulli</td>
                <td style={td}>logit: <M>{String.raw`\log\frac{\mu}{1-\mu}`}</M></td>
                <td style={td}><M>{String.raw`\sigma(w^\top x)`}</M></td>
              </tr>
              <tr>
                <td style={td}>Poisson</td>
                <td style={td}>count</td>
                <td style={td}>Poisson</td>
                <td style={td}>log: <M>{String.raw`\log \mu`}</M></td>
                <td style={td}><M>{String.raw`e^{w^\top x}`}</M></td>
              </tr>
              <tr>
                <td style={td}>Multinomial (softmax)</td>
                <td style={td}>one of K classes</td>
                <td style={td}>Categorical</td>
                <td style={td}>generalised logit</td>
                <td style={td}>softmax</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Same skeleton, four models. Swap the distribution and link and linear regression <em>becomes</em>
          logistic regression becomes Poisson regression. The whole classification-vs-regression divide is,
          from here, a choice of two dropdowns.
        </p>

        <h2>Why your gradient was so clean</h2>
        <p>
          Remember the punchline gradient, <M>{String.raw`\frac{1}{n}X^\top(p - y)`}</M> — the same
          &ldquo;(prediction − truth) × features&rdquo; as linear regression. GLMs explain it. The logit is the{" "}
          <strong>canonical link</strong> for the Bernoulli distribution (the link that makes the math align),
          and for <em>any</em> GLM paired with its canonical link the maximum-likelihood gradient is always
        </p>
        <MathBlock>{String.raw`\nabla_w \big(\text{neg. log-lik}\big) = \frac{1}{n}\,X^\top(\mu - y),`}</MathBlock>
        <p>
          where <M>\mu</M> is the model&rsquo;s mean prediction. Identity link, <M>{String.raw`\mu = w^\top x`}</M>{" "}
          → linear regression. Logit link, <M>{String.raw`\mu = \sigma(w^\top x)`}</M> → logistic regression. The
          &ldquo;beautiful gradient&rdquo; wasn&rsquo;t a lucky cancellation special to the sigmoid; it&rsquo;s a
          structural property of canonical-link GLMs, and it&rsquo;s why the training machinery ports across the
          whole family unchanged.
        </p>

        <PredictPrompt
          accent={ACCENT}
          prompt={<>You want to model the number of insurance claims a policy files per year (a count: 0, 1, 2, …). Which GLM fits?</>}
          options={[
            "Poisson regression — log link, count distribution",
            "Logistic regression — the count is basically yes/no",
            "Linear regression — just round the output",
          ]}
          nudge={<>Match the target type (a non-negative count) to the distribution row in the table.</>}
        />

        <p>
          Poisson regression is the right tool: a log link keeps the predicted rate positive and the Poisson
          distribution matches count data&rsquo;s mean-variance behaviour. Forcing it into logistic (throwing
          away the count) or linear (predicting negative claims) fights the data. Picking a GLM <em>is</em>
          picking the probability model for your target — the same MLE lesson from two pages ago, now with a
          menu.
        </p>

        <Callout color={ACCENT} title={<>The unifying sentence</>}>
          A GLM is a linear score, a distribution for the target, and a link between them. Linear and logistic
          regression are the Gaussian/identity and Bernoulli/logit corners of one design. That&rsquo;s why they
          share a gradient, a training loop, and an MLE justification — and why learning one deeply is learning
          a large slice of the others for free.
        </Callout>

        <Quiz
          accent={ACCENT}
          questions={[
            {
              q: "In GLM terms, what is the sigmoid?",
              options: [
                "The link function",
                "The inverse link — it maps the linear score back to the mean (a probability)",
                "The loss function",
              ],
              answer: 1,
              explain: "The link is the logit, g(p) = log(p/(1−p)) = w·x. Solving for p inverts it, giving the sigmoid. So the sigmoid is the inverse link, not the link itself.",
            },
            {
              q: "The three ingredients that define any GLM are…",
              options: [
                "A linear score, a target distribution, and a link function",
                "A neural network, a loss, and an optimiser",
                "Features, labels, and a threshold",
              ],
              answer: 0,
              explain: "GLM = linear predictor η = w·x + a distribution from the exponential family + a link g connecting the mean to η. Choosing the distribution and link selects the specific model.",
            },
            {
              q: "Why is logistic regression's gradient the same 'prediction − truth' shape as linear regression's?",
              options: [
                "Coincidence of the sigmoid's derivative",
                "Both use their canonical link, and canonical-link GLMs all have gradient (1/n)Xᵀ(μ − y)",
                "Because both use squared error",
              ],
              answer: 1,
              explain: "With the canonical link, the MLE gradient of any exponential-family GLM is (1/n)Xᵀ(μ − y). The clean logistic gradient is that general result with μ = σ(w·x), not a sigmoid-specific fluke.",
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/logistic-regression/convexity-of-log-loss", label: <>← Convexity of the objective</> }}
          next={{ href: "/learn/logistic-regression/generative-twin-naive-bayes-lda", label: <>Next up · The generative twin →</> }}
        />
      </div>
    </article>
  );
}

const th: React.CSSProperties = {
  border: "1px solid var(--border-strong)",
  padding: "8px 11px",
  textAlign: "left",
  background: "var(--surface-2)",
  fontWeight: 500,
  color: "var(--ink)",
  whiteSpace: "nowrap",
};
const td: React.CSSProperties = {
  border: "1px solid var(--border-strong)",
  padding: "8px 11px",
  textAlign: "left",
  color: "var(--muted)",
};
