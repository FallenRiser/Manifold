import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { Quiz } from "@/components/Quiz";
import { NB_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "The hidden linear classifier — Manifold",
  description:
    "In log-space the Naive Bayes decision rule is linear in the features: the log-posterior-ratio is w·x + b. Derive the weights from the class-conditional parameters and see why Naive Bayes and logistic regression share one linear family.",
};

const TEAL = "var(--c-classification)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function HiddenLinearClassifierPage() {
  const fromScratch = `from sklearn.datasets import make_classification

X, y = make_classification(n_samples=500, n_features=6, n_informative=4,
                           n_redundant=0, random_state=0)
Xb = (X > 0).astype(int)                 # binary presence features

nb = BernoulliNB().fit(Xb, y)
# sklearn exposes the linear weights BernoulliNB implies -- it IS w . x + b
print("weights w :", nb.coef_[0].round(2))
print("intercept :", round(nb.intercept_[0], 2))`;

  return (
    <article>
      <LessonHeader
        chips={[
          { label: "Classification", color: TEAL },
          { label: "Theory", color: "var(--c-fundamentals)" },
        ]}
        time="about 8 minutes"
        title={<>The hidden linear classifier</>}
        intro={<>The last page measured a crossover between Naive Bayes and logistic regression and claimed they
          share a hypothesis space. This page proves it. Take the Naive Bayes decision rule, move to log-space,
          and collect terms: what falls out is <M>{String.raw`\mathbf{w}^\top\mathbf{x} + b`}</M> — a linear
          classifier. Naive Bayes never looks at the boundary, yet it draws a straight one anyway. Seeing exactly
          why is the theoretical payoff of the whole track.</>}
      />

      <div className="lesson">
        <h2>The decision is a log-posterior ratio</h2>
        <p>
          For two classes, Naive Bayes predicts class 1 when the log-ratio of the posteriors is positive:
        </p>

        <MathBlock>{String.raw`L(\mathbf{x}) \;=\; \log \frac{P(y=1 \mid \mathbf{x})}{P(y=0 \mid \mathbf{x})} \;=\; \log\frac{P(y=1)}{P(y=0)} \;+\; \sum_{j=1}^{d} \log\frac{P(x_j \mid y=1)}{P(x_j \mid y=0)}.`}</MathBlock>

        <p>
          The evidence <M>{String.raw`P(\mathbf{x})`}</M> cancels, and the independence assumption is what let us
          split the joint into that <em>sum</em> of per-feature log-ratios. Everything now hinges on the shape of
          one term. For the three standard flavours it is <em>linear in a fixed transform of{" "}
          <M>{String.raw`x_j`}</M></em> — and when every term is linear, the whole sum is{" "}
          <M>{String.raw`\mathbf{w}^\top\mathbf{x} + b`}</M> and the boundary is a hyperplane.
        </p>

        <h2>The Bernoulli case: linear in the raw features</h2>
        <p>
          Take binary features <M>{String.raw`x_j \in \{0,1\}`}</M>. Bernoulli NB stores{" "}
          <M>{String.raw`p_j = P(x_j = 1 \mid y=1)`}</M> and <M>{String.raw`q_j = P(x_j = 1 \mid y=0)`}</M>, and a
          single feature&rsquo;s log-ratio collects into a weight-times-feature plus a constant:
        </p>

        <MathBlock>{String.raw`\log\frac{P(x_j \mid 1)}{P(x_j \mid 0)} = \underbrace{\left[\log\frac{p_j(1-q_j)}{q_j(1-p_j)}\right]}_{w_j}\, x_j + \underbrace{\log\frac{1-p_j}{1-q_j}}_{b_j}.`}</MathBlock>

        <p>
          Each weight <M>{String.raw`w_j`}</M> is a log-odds ratio — how much more class 1 emits that feature than
          class 0. Summing over features and folding the prior into the intercept gives a clean linear
          discriminant, <em>literally</em> the logistic-regression scoring function{" "}
          <M>{String.raw`\mathbf{w}^\top\mathbf{x} + b`}</M>. Bernoulli NB is a linear classifier whose weights
          happen to be log-odds ratios estimated from counts — and sklearn will hand you exactly those weights:
        </p>

        <CodeBlock setup={NB_SETUP} fromScratch={fromScratch} />

        <h2>The Gaussian case: linear when the variance is shared</h2>
        <p>
          For continuous features the Gaussian log-ratio contains a quadratic <M>{String.raw`x_j^2`}</M> term. With
          class-specific variances it survives and the boundary is a conic. But under the{" "}
          <strong>shared-variance</strong> assumption <M>{String.raw`\sigma_{1,j}^2 = \sigma_{0,j}^2 = \sigma_j^2`}</M>,
          the quadratic terms are identical in both classes and subtract away:
        </p>

        <MathBlock>{String.raw`\log\frac{\mathcal{N}(x_j; \mu_{1,j}, \sigma_j^2)}{\mathcal{N}(x_j; \mu_{0,j}, \sigma_j^2)} = \frac{\mu_{1,j} - \mu_{0,j}}{\sigma_j^2}\, x_j \;-\; \frac{\mu_{1,j}^2 - \mu_{0,j}^2}{2\sigma_j^2}.`}</MathBlock>

        <p>
          The surviving term is linear, with weight <M>{String.raw`w_j = (\mu_{1,j} - \mu_{0,j})/\sigma_j^2`}</M> —
          a feature earns a large weight when its class means are far apart <em>relative to</em> its variance,
          exactly a signal-to-noise ratio. And Multinomial NB tells the same story in log-count space, with weight{" "}
          <M>{String.raw`\log(\theta_{1,j}/\theta_{0,j})`}</M> on each count. All three flavours land on{" "}
          <M>{String.raw`\mathbf{w}^\top\boldsymbol{\phi}(\mathbf{x}) + b`}</M>; only the feature transform{" "}
          <M>{String.raw`\boldsymbol{\phi}`}</M> changes.
        </p>

        <Callout color={TEAL} title={<>A linear classifier that never sees the boundary</>}>
          This is the resolution the track has been building toward. Naive Bayes and logistic regression inhabit
          the <em>same linear family</em>; the difference is purely how the weights are set. Naive Bayes computes
          each weight from class-conditional moments or counts — one pass, each feature in isolation, never
          looking at the decision surface. Logistic regression solves for the whole weight vector jointly by
          maximising conditional likelihood, staring straight at the boundary. Same functional form, two
          estimators — which is exactly <em>why</em> the crossover on the last page exists.
        </Callout>

        <h2>Why the two estimators disagree</h2>
        <p>
          If both reduce to <M>{String.raw`\mathbf{w}^\top\mathbf{x} + b`}</M>, why ever different weights? Because
          Naive Bayes sets <M>{String.raw`w_j`}</M> from feature <M>{String.raw`j`}</M> alone, as if no other
          feature existed. When two features are correlated it counts each one&rsquo;s evidence at full strength
          and double-counts — inflating the weights and, through them, the confidence. Logistic regression, fitting
          all weights together, notices the redundancy and shrinks the correlated weights so the shared evidence
          is counted once. That is the same double-counting that wrecks Naive Bayes&rsquo; calibration, now seen
          from the weight side: the generative estimator has no mechanism to discount shared evidence, because it
          never solves for the weights jointly.
        </p>

        <Quiz
          accent={TEAL}
          title="Checkpoint"
          questions={[
            {
              q: <>Why does moving the two-class Naive Bayes decision into log-space reveal a linear
                classifier?</>,
              options: [
                "The logarithm forces any function to become linear",
                "Independence turns the joint likelihood into a sum of per-feature log-ratios, and each is linear in a fixed transform of the feature — so the whole sum is w·φ(x) + b",
                "Log-space removes the prior, and without a prior every classifier is linear",
              ],
              answer: 1,
              explain: <>Logs turn the product of per-feature likelihoods into a sum (independence is what allowed
                that product). Each Bernoulli, shared-variance Gaussian, or Multinomial log-ratio is linear, so
                the sum collapses to w·φ(x) + b and the boundary is a hyperplane.</>,
            },
            {
              q: <>For Gaussian NB, what makes the boundary linear rather than a conic?</>,
              options: [
                "The features must have zero mean",
                "The per-class variances must be shared, so the quadratic x² terms cancel, leaving only linear terms",
                "There must be exactly two features",
              ],
              answer: 1,
              explain: <>With class-specific variances the x² terms survive and the boundary is quadratic. Shared
                variances make them cancel, leaving weight (μ₁−μ₀)/σ² per feature — a signal-to-noise ratio — and
                a linear boundary matching the logistic form.</>,
            },
            {
              q: <>Both reduce to w·x + b, yet assign different weights to correlated features. Why?</>,
              options: [
                "Logistic regression includes interaction terms",
                "Naive Bayes sets each weight from that feature alone and can't discount evidence shared with a correlated feature, so it double-counts; logistic regression fits weights jointly and shrinks the redundancy",
                "Naive Bayes always uses larger weights because it doesn't regularise",
              ],
              answer: 1,
              explain: <>The generative estimator handles each feature in isolation, so two correlated features
                each get full weight and their shared evidence is counted twice — the mechanism behind NB&rsquo;s
                overconfidence. The discriminative estimator solves jointly and can shrink the correlated
                weights.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/naive-bayes/vs-logistic-regression", label: <>← Naive Bayes vs logistic regression</> }}
          next={{ href: "/learn/naive-bayes/when-to-use-it", label: <>Next up · When to reach for Naive Bayes →</> }}
        />
      </div>
    </article>
  );
}
