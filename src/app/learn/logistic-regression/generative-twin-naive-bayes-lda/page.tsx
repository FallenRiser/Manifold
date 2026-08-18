import { M, MathBlock } from "@/components/Math";
import { CalibrationLab } from "@/components/labs/CalibrationLab";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LabFrame } from "@/components/LabFrame";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

const ACCENT = "var(--c-classification)";

export const metadata = {
  title: "The generative twin: naive Bayes & LDA — Manifold",
  description: "Logistic regression models P(y|x) directly. Its generative twins model how the data was produced and use Bayes' rule. Same linear boundary, opposite philosophy — and a clean rule for which to pick.",
};

export default function GenerativeTwinPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: ACCENT }, { label: "Theory", color: "var(--c-metrics)" }]}
        time="about 10 minutes"
        title={<>The generative twin: naive Bayes &amp; LDA</>}
        intro={<>
          There are two ways to draw a boundary. Logistic regression models the boundary directly. Its
          generative cousins model how each class <em>generates</em> its data, then let Bayes&rsquo; rule
          find the boundary as a by-product. Remarkably, they often land on the same line — from opposite ends.
        </>}
      />

      <div className="lesson">
        <h2>Two philosophies</h2>
        <p>
          <strong>Discriminative</strong> models — logistic regression, SVMs — go straight for the target:
          they model <M>{String.raw`P(y \mid x)`}</M> and spend all their capacity on the decision boundary,
          ignoring how the features are distributed. <strong>Generative</strong> models — naive Bayes, linear
          discriminant analysis (LDA) — take the long way. They model each class&rsquo;s feature distribution{" "}
          <M>{String.raw`P(x \mid y)`}</M> and the class frequencies <M>{String.raw`P(y)`}</M>, then combine
          them with Bayes&rsquo; rule to <em>derive</em> the posterior:
        </p>
        <MathBlock>{String.raw`P(y \mid x) = \frac{P(x \mid y)\,P(y)}{P(x)} \;\propto\; P(x \mid y)\,P(y).`}</MathBlock>
        <p>
          The two differ in what they model, not just how they compute. A generative model, having learned{" "}
          <M>{String.raw`P(x \mid y)`}</M>, can <em>generate</em> new synthetic examples of a class; a
          discriminative model can only tell them apart. That extra ambition is both the strength and the cost.
        </p>

        <h2>The naive in naive Bayes</h2>
        <p>
          Modelling the full joint <M>{String.raw`P(x \mid y)`}</M> over many features is hard, so naive Bayes
          makes one bold simplification: <strong>features are conditionally independent given the class</strong>.
          Then the joint factorises into a product of one-dimensional pieces:
        </p>
        <MathBlock>{String.raw`P(x \mid y) = \prod_{j=1}^{d} P(x_j \mid y).`}</MathBlock>
        <p>
          That assumption is usually false — features correlate — but it makes estimation trivial and, for
          ranking, often works anyway. Its price shows up not in the ranking but in the <em>probabilities</em>:
          when features are correlated, naive Bayes counts the same evidence several times and becomes wildly
          overconfident. That is exactly the failure the calibration page measured.
        </p>

        <PredictPrompt
          accent={ACCENT}
          prompt={<>The lab compares logistic regression and naive Bayes on data with correlated features. Which one&rsquo;s probabilities stay honest (on the diagonal)?</>}
          options={[
            "Logistic regression — it models P(y|x) directly and stays calibrated",
            "Naive Bayes — independence keeps it honest",
            "Both are equally calibrated",
          ]}
          nudge={<>Toggle to naive Bayes and watch how far its curve leaves the diagonal, and its Brier score.</>}
        />

        <LabFrame
          accent={ACCENT}
          tryThis={<>Toggle between the two models. Note that they may rank cases similarly (comparable AUC), yet their calibration curves and Brier scores diverge sharply.</>}
          insight={<>Naive Bayes&rsquo; independence assumption double-counts correlated evidence, pushing its probabilities to
            0 and 1 — great ranking, dishonest numbers (Brier 0.130). Logistic regression optimises the posterior directly
            and stays on the diagonal (Brier 0.092). This is the discriminative/generative trade in one picture: the
            generative model&rsquo;s extra assumptions buy simplicity but can distort the very probabilities you came for.</>}
        >
          <CalibrationLab />
        </LabFrame>

        <h2>LDA: the twin that draws the same line</h2>
        <p>
          Linear discriminant analysis is the generative model closest to logistic regression. It assumes each
          class is Gaussian with its own mean but a <strong>shared covariance</strong> <M>\Sigma</M>. Push that
          through Bayes&rsquo; rule and the quadratic terms cancel, leaving a posterior of <em>exactly the
          logistic form</em> — <M>{String.raw`P(y=1\mid x) = \sigma(w^\top x + b)`}</M> — with a linear boundary.
          So LDA and logistic regression fit the <em>same functional model</em>; they differ only in how they
          estimate <M>w</M>: LDA from class means and the shared covariance, logistic regression by maximising
          the conditional likelihood directly.
        </p>

        <h2>Which should you use?</h2>
        <p>
          The classic result (Ng &amp; Jordan, 2001): the generative model reaches its (higher) asymptotic error
          <em> faster</em>, so it wins when data is scarce; the discriminative model has lower asymptotic error,
          so it wins as data grows — <em>if</em> its weaker assumptions hold. A working rule:
        </p>
        <ul>
          <li><strong>Little data, or you trust the distributional assumptions</strong> → generative (LDA, naive Bayes) converges quickly and regularises via its structure.</li>
          <li><strong>Plenty of data, correlated features, and you want calibrated probabilities</strong> → discriminative (logistic regression) makes fewer assumptions and stays honest.</li>
          <li><strong>You need to generate data, handle missing features, or fold in priors</strong> → generative, by construction.</li>
        </ul>

        <Callout color={ACCENT} title={<>Same boundary, opposite reasoning</>}>
          Logistic regression asks &ldquo;where&rsquo;s the line?&rdquo; and answers directly. LDA and naive
          Bayes ask &ldquo;how does each class produce data?&rdquo; and let the line fall out of Bayes&rsquo;
          rule. With matching assumptions (shared-covariance Gaussians) LDA lands on the very same linear model —
          which is why understanding logistic regression hands you its generative twins nearly for free.
        </Callout>

        <Quiz
          accent={ACCENT}
          questions={[
            {
              q: "The key difference between discriminative and generative classifiers is…",
              options: [
                "Discriminative models P(y|x) directly; generative models P(x|y) and P(y), then applies Bayes' rule",
                "Discriminative is always more accurate",
                "Generative can't produce probabilities",
              ],
              answer: 0,
              explain: "Discriminative models (logistic regression) target the boundary via P(y|x). Generative models (naive Bayes, LDA) model how each class generates features, P(x|y), plus P(y), and derive the posterior with Bayes' rule.",
            },
            {
              q: "Naive Bayes is often poorly calibrated on real data because…",
              options: [
                "It uses the wrong loss",
                "Its conditional-independence assumption double-counts correlated features, causing overconfidence",
                "It can't handle more than two classes",
              ],
              answer: 1,
              explain: "Assuming features are independent given the class multiplies correlated evidence as if it were separate, pushing probabilities toward 0/1. Ranking can still be fine; the probabilities are distorted.",
            },
            {
              q: "LDA (shared-covariance Gaussians) and logistic regression relate how?",
              options: [
                "They fit completely different models",
                "LDA's posterior has the same logistic form and linear boundary — they differ only in how w is estimated",
                "LDA is always nonlinear",
              ],
              answer: 1,
              explain: "Under shared covariance the quadratic terms cancel and LDA's posterior is σ(w·x+b) — the logistic model. They estimate w differently (generatively vs by conditional MLE) but share the functional form and a linear boundary.",
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/logistic-regression/logistic-regression-as-a-glm", label: <>← Logistic regression as a GLM</> }}
          next={{ href: "/learn/logistic-regression/when-to-use-logistic-regression", label: <>Next up · When to use it →</> }}
        />
      </div>
    </article>
  );
}
