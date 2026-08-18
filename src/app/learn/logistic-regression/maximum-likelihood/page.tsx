import { M, MathBlock } from "@/components/Math";
import { LogLossLab } from "@/components/labs/LogLossLab";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LabFrame } from "@/components/LabFrame";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

const ACCENT = "var(--c-classification)";

export const metadata = {
  title: "Maximum likelihood: where log loss comes from — Manifold",
  description: "Log loss isn't an arbitrary choice of penalty. It falls out, uniquely, from one principle: pick the weights that make the data you actually observed as probable as possible.",
};

export default function MaximumLikelihoodPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: ACCENT }, { label: "Theory", color: "var(--c-metrics)" }]}
        time="about 10 minutes"
        title={<>Maximum likelihood: where log loss comes from</>}
        intro={<>
          We used log loss on faith — it punishes confident wrongness, which felt right. Now earn it.
          Log loss isn&rsquo;t a design choice; it&rsquo;s the unique consequence of a single principle
          that also underlies half of statistics: <em>maximum likelihood</em>.
        </>}
      />

      <div className="lesson">
        <h2>The principle</h2>
        <p>
          Maximum likelihood estimation (MLE) says: among all possible settings of the parameters, choose
          the one that makes the <strong>observed data</strong> most probable. It flips the usual question
          around. Instead of &ldquo;given these weights, how likely is each label?&rdquo; it asks &ldquo;given
          the labels we actually saw, which weights make them least surprising?&rdquo;
        </p>
        <p>
          To use it we need a probabilistic model of the label. Logistic regression already is one: it says
          the probability that example <M>i</M> is positive is the sigmoid of the linear score,
        </p>
        <MathBlock>{String.raw`p_i = \sigma(w^\top x_i) = P(y_i = 1 \mid x_i;\, w),`}</MathBlock>
        <p>
          which is exactly a <strong>Bernoulli distribution</strong> — a weighted coin whose bias is{" "}
          <M>p_i</M>. The probability it assigns to the label we actually observed is a tidy single
          expression that works for both outcomes:
        </p>
        <MathBlock>{String.raw`P(y_i \mid x_i;\, w) = p_i^{\,y_i}\,(1 - p_i)^{\,1 - y_i}.`}</MathBlock>
        <p>
          Check it: if <M>{String.raw`y_i = 1`}</M> the second factor is <M>{String.raw`(1-p_i)^0 = 1`}</M>,
          leaving <M>p_i</M>; if <M>{String.raw`y_i = 0`}</M> the first factor is <M>{String.raw`p_i^0 = 1`}</M>,
          leaving <M>{String.raw`1 - p_i`}</M>. One formula, both cases.
        </p>

        <h2>From likelihood to log loss, in four lines</h2>
        <p>
          Assume the examples are independent. Then the probability of the <em>entire</em> dataset is the
          product of the per-example probabilities — this is the <strong>likelihood</strong> of the weights:
        </p>
        <MathBlock>{String.raw`\mathcal{L}(w) = \prod_{i=1}^{n} p_i^{\,y_i}\,(1 - p_i)^{\,1 - y_i}.`}</MathBlock>
        <p>
          Products of many small probabilities underflow and are miserable to differentiate, so take the log
          (which is monotonic, so it doesn&rsquo;t move the maximum). The product becomes a sum — the{" "}
          <strong>log-likelihood</strong>:
        </p>
        <MathBlock>{String.raw`\ell(w) = \sum_{i=1}^{n} \Big[\, y_i \log p_i + (1 - y_i)\log(1 - p_i) \,\Big].`}</MathBlock>
        <p>
          Maximising a quantity is minimising its negative, and dividing by <M>n</M> (a constant) changes
          nothing about where the optimum sits. Negate and average:
        </p>
        <MathBlock>{String.raw`-\frac{1}{n}\,\ell(w) = -\frac{1}{n}\sum_{i=1}^{n}\Big[\, y_i \log p_i + (1 - y_i)\log(1 - p_i)\,\Big].`}</MathBlock>
        <p>
          That is <strong>log loss</strong>, exactly — the loss we introduced three pages ago as if by taste.
          It was never a taste. <em>Minimising log loss is maximising the likelihood of the data.</em> The two
          are the same optimisation wearing different signs.
        </p>

        <Callout color={ACCENT} title={<>Why the &ldquo;confident wrongness&rdquo; penalty had to be there</>}>
          The <M>{String.raw`\log p_i`}</M> term is the machinery of surprise. If the truth is class 1 and the
          model said <M>{String.raw`p_i \approx 0`}</M>, then <M>{String.raw`\log p_i \to -\infty`}</M>: the model
          assigned almost no probability to something that happened, so the likelihood of the data under those
          weights is almost zero, and MLE punishes it without bound. The unbounded penalty for confident
          mistakes isn&rsquo;t a feature someone bolted on — it&rsquo;s what &ldquo;make the data probable&rdquo;
          means when the model was sure and wrong.
        </Callout>

        <PredictPrompt
          accent={ACCENT}
          prompt={<>In the lab, set the truth to class 1 and drag the model&rsquo;s predicted probability toward 0. What does the log-loss (negative log-likelihood) contribution do?</>}
          options={["Grows without bound toward ∞", "Rises to a ceiling of 1", "Stays flat — probability doesn't matter"]}
          nudge={<>Drag P(class 1) toward the left edge with truth = class 1 and watch the &ldquo;log loss pays&rdquo; number.</>}
        />

        <LabFrame
          accent={ACCENT}
          tryThis={<>Set truth to class 1, then drag the predicted probability from 0.9 down toward 0.01. Compare how log loss (solid) and squared error (dashed) each react to the same confident mistake.</>}
          insight={<>Squared error tops out at 1 no matter how confidently wrong you are — it treats a 0.01 guess on a
            true-1 case as only slightly worse than a 0.4 guess. Log loss, the negative log-likelihood, races to ∞. That
            unbounded tail is exactly why MLE, not least squares, is the right principle for probabilities: it refuses to
            let a model be confidently, catastrophically wrong for a bounded price.</>}
        >
          <LogLossLab />
        </LabFrame>

        <h2>Why this matters beyond logistic regression</h2>
        <p>
          MLE is the thread that ties the models together. Run the same derivation with a{" "}
          <strong>Gaussian</strong> noise model instead of Bernoulli and the negative log-likelihood collapses
          to <em>squared error</em> — linear regression is maximum likelihood too. Poisson noise gives Poisson
          regression. Choosing a loss is really choosing a probability model for your target; log loss is what
          you get the moment you admit the target is a coin flip. That unifying view is the next two pages:
          convexity (why this particular likelihood is easy to maximise) and GLMs (the family this pattern
          belongs to).
        </p>

        <Quiz
          accent={ACCENT}
          questions={[
            {
              q: "Minimising log loss is equivalent to…",
              options: [
                "Maximising the likelihood of the observed labels under the model",
                "Minimising the number of misclassifications",
                "Maximising accuracy directly",
              ],
              answer: 0,
              explain: "Log loss is the negative average log-likelihood of a Bernoulli model. Minimising it maximises the probability the model assigns to the data you actually saw — not accuracy, and not the 0/1 error count.",
            },
            {
              q: "Why take the logarithm of the likelihood before optimising?",
              options: [
                "It changes where the maximum is, making it easier",
                "It turns an underflow-prone product into a sum without moving the optimum (log is monotonic)",
                "It makes the model nonlinear",
              ],
              answer: 1,
              explain: "log is monotonic, so argmax is unchanged. It converts the product of many probabilities (which underflows and is hard to differentiate) into a numerically friendly, separable sum.",
            },
            {
              q: "Fitting linear regression by least squares is secretly maximum likelihood under what noise model?",
              options: ["Bernoulli", "Gaussian (normal) noise", "Uniform noise"],
              answer: 1,
              explain: "Assume the target is the linear prediction plus Gaussian noise and the negative log-likelihood reduces to squared error. Each loss corresponds to a probability model for the target; log loss is the Bernoulli case.",
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/logistic-regression/cost-sensitive-decisions", label: <>← Cost-sensitive decisions</> }}
          next={{ href: "/learn/logistic-regression/convexity-of-log-loss", label: <>Next up · Convexity of the objective →</> }}
        />
      </div>
    </article>
  );
}
