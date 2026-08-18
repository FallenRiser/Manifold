import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Kernel ridge & Gaussian processes — Manifold",
  description:
    "Kernel ridge regression is exactly the posterior mean of a Gaussian process. Same prediction, but the GP also hands you calibrated uncertainty — the error bars kernel ridge quietly discards.",
};

export default function KRRandGPPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }, { label: "Tier 3 · theory", color: "var(--c-metrics)" }]}
        time="about 8 minutes"
        title={<>Kernel ridge &amp; Gaussian processes</>}
        intro={<>
          There&rsquo;s a striking identity hiding in the KRR formula: its prediction is <em>exactly</em> the mean
        of a Gaussian process posterior. Seeing this gives kernel ridge a probabilistic soul — and reveals what
        it throws away.
        </>}
      />

      <div className="lesson">
        <h2>A Gaussian process, in one breath</h2>
        <p>
          A <strong>Gaussian process</strong> (GP) is a distribution over <em>functions</em>. You specify a prior
          by a covariance function — a kernel <M>{String.raw`k(x, z)`}</M> saying how correlated the outputs at{" "}
          <M>{String.raw`x`}</M> and <M>{String.raw`z`}</M> should be. Condition on observed data (with noise
          variance <M>{String.raw`\sigma^2`}</M>) and you get a posterior: a mean function (your best guess) and a
          variance function (your uncertainty) at every point.
        </p>

        <h2>The identity</h2>
        <p>The GP posterior mean at a query <M>{String.raw`x`}</M> is:</p>
        <MathBlock>{String.raw`\bar{f}(x) = \mathbf{k}(x)^\top (K + \sigma^2 I)^{-1}\, y`}</MathBlock>
        <p>
          where <M>{String.raw`\mathbf{k}(x) = [k(x_1, x), \dots, k(x_n, x)]^\top`}</M>. Line that up against the
          kernel ridge prediction <M>{String.raw`\hat{y}(x) = \sum_i \alpha_i k(x_i, x) = \mathbf{k}(x)^\top \alpha`}</M>
          with <M>{String.raw`\alpha = (K + \lambda I)^{-1} y`}</M>. They are the <strong>same equation</strong>,
          with one dictionary entry:
        </p>
        <MathBlock>{String.raw`\boxed{\;\lambda \;=\; \sigma^2\;}`}</MathBlock>
        <p>
          <strong>Kernel ridge regression is the posterior mean of a Gaussian process</strong> whose prior
          covariance is the kernel and whose noise variance is the regularisation <M>{String.raw`\lambda`}</M>.
          The two methods you might have thought were unrelated are the same predictor wearing different clothes.
        </p>

        <h2>The dictionary</h2>
        <ul style={ul}>
          <li><strong>Kernel</strong> <M>{String.raw`k`}</M> ↔ the GP&rsquo;s <strong>prior covariance</strong> (your assumption about smoothness).</li>
          <li><strong>Regularisation</strong> <M>{String.raw`\lambda`}</M> ↔ the <strong>observation noise variance</strong> <M>{String.raw`\sigma^2`}</M>. More assumed noise = more smoothing — the same intuition, now with a probabilistic meaning.</li>
          <li><strong>Dual coefficients</strong> <M>{String.raw`\alpha`}</M> ↔ the weights in the posterior-mean expansion.</li>
        </ul>

        <Callout color="var(--c-metrics)" title={<>What kernel ridge throws away: the error bars</>}>
          The GP also gives a posterior <em>variance</em>,{" "}
            <M>{String.raw`\mathbb{V}[f(x)] = k(x,x) - \mathbf{k}(x)^\top (K+\sigma^2 I)^{-1}\mathbf{k}(x)`}</M> — it
            grows far from the data and shrinks near it, a calibrated &ldquo;how sure am I here?&rdquo; Kernel ridge
            computes only the mean and discards this. If you need uncertainty — active learning, Bayesian
            optimisation, safety-critical predictions — reach for the full GP; if you only need the point
            prediction, KRR gives it more cheaply.
        </Callout>

        <h2>Why the connection is useful</h2>
        <ul style={ul}>
          <li><strong>Interpretation.</strong> &ldquo;Choosing the kernel&rdquo; becomes &ldquo;choosing a prior over functions&rdquo;; &ldquo;increasing λ&rdquo; becomes &ldquo;assuming noisier data.&rdquo; The knobs gain meaning.</li>
          <li><strong>Principled tuning.</strong> The GP view supplies a way to set <M>{String.raw`\lambda`}</M> and the kernel width by maximising the <em>marginal likelihood</em> — a model-selection criterion cross-validation only approximates.</li>
          <li><strong>Honest limits.</strong> Both share the exact same <M>{String.raw`O(n^3)`}</M> solve, because it&rsquo;s literally the same matrix inverse.</li>
        </ul>

        <Quiz
          accent="var(--c-metrics)"
          questions={[
            {
              q: "Kernel ridge regression's prediction equals…",
              options: ["The posterior mean of a Gaussian process with covariance k and noise variance λ", "The GP posterior variance", "A GP prior sample"],
              answer: 0,
              explain: "The formulas are identical with λ = σ². KRR is the GP posterior mean — same predictor, derived two ways.",
            },
            {
              q: "In the KRR ↔ GP dictionary, the regularisation λ corresponds to…",
              options: ["The observation noise variance σ²", "The number of training points", "The kernel width γ"],
              answer: 0,
              explain: "λ = σ². More assumed noise means more smoothing — the same effect, now with a probabilistic reading.",
            },
            {
              q: "What does kernel ridge discard that a full Gaussian process provides?",
              options: ["The posterior variance — calibrated uncertainty at each prediction", "The ability to use kernels", "The training labels"],
              answer: 0,
              explain: "KRR computes only the mean. The GP additionally gives error bars that widen away from data — essential for active learning or Bayesian optimisation.",
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/kernel-ridge-regression/the-representer-theorem", label: <>← The representer theorem</> }} next={{ href: "/learn/kernel-ridge-regression/kernel-ridge-vs-svr-vs-linear", label: <>Next up · Kernel ridge vs SVR vs linear →</> }} />
      </div>
    </article>
  );
}

const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
