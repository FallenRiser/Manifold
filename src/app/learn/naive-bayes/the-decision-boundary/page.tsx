import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { Quiz } from "@/components/Quiz";
import { NB_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "The decision boundary — Manifold",
  description:
    "What shape does Naive Bayes draw? Gaussian NB with per-class variances gives a quadratic boundary; shared variances collapse it to a line — the tie to LDA and logistic regression. Independence keeps the contours axis-aligned.",
};

const TEAL = "var(--c-classification)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function TheDecisionBoundaryPage() {
  const fromScratch = `# unequal per-class variances -> a CURVED (quadratic) boundary
X, y = make_classification(n_samples=600, n_features=2, n_informative=2,
                           n_redundant=0, n_clusters_per_class=1,
                           class_sep=1.3, random_state=0)
nb = GaussianNB().fit(X, y)
print("class-0 variances:", nb.var_[0].round(3))
print("class-1 variances:", nb.var_[1].round(3))

# the x^2 coefficient in the log-ratio is 1/(2*v0) - 1/(2*v1)
coef = 1/(2*nb.var_[0]) - 1/(2*nb.var_[1])
print("x^2 coefficients :", coef.round(3), " -> nonzero, so the boundary curves")`;

  return (
    <article>
      <LessonHeader
        chips={[
          { label: "Classification", color: TEAL },
          { label: "Practitioner", color: "var(--c-fundamentals)" },
        ]}
        time="about 8 minutes"
        title={<>The decision boundary</>}
        intro={<>We&rsquo;ve argued about probabilities and decisions in the abstract. Now make it geometric:
          what shape does Naive Bayes actually carve through feature space? The answer depends on the flavour,
          and it quietly connects Naive Bayes to two classifiers you already know — LDA and logistic
          regression.</>}
      />

      <div className="lesson">
        <h2>The boundary is where the log-ratio is zero</h2>
        <p>
          For two classes, the boundary is the set of points where neither class wins — where the posterior
          scores are equal. In log-space, that is where the log-posterior-ratio crosses zero:
        </p>

        <MathBlock>{String.raw`g(\mathbf{x}) \;=\; \log\frac{P(+ \mid \mathbf{x})}{P(- \mid \mathbf{x})} \;=\; \log\frac{P(+)}{P(-)} \;+\; \sum_{j=1}^{d} \log\frac{P(x_j \mid +)}{P(x_j \mid -)} \;=\; 0.`}</MathBlock>

        <p>
          The <em>shape</em> is set entirely by the form of the per-feature likelihood ratios. Plug in a
          Gaussian and the algebra hands you a specific answer — and it is not always a straight line.
        </p>

        <h2>Gaussian NB: quadratic in general</h2>
        <p>
          Gaussian NB models each feature within each class as a normal with its own mean and variance. The log
          of a Gaussian is a quadratic in <M>{String.raw`x`}</M>, so when you form the ratio between two
          classes, the <M>{String.raw`x_j^2`}</M> term carries a coefficient{" "}
          <M>{String.raw`\tfrac{1}{2\sigma_{j-}^2} - \tfrac{1}{2\sigma_{j+}^2}`}</M>. If the classes have{" "}
          <em>different</em> variances for that feature, this is nonzero, the squared term survives, and{" "}
          <M>{String.raw`g(\mathbf{x})`}</M> is a genuine quadratic — the boundary is a{" "}
          <strong>conic</strong> (ellipse, parabola, or hyperbola). It is the same family as quadratic
          discriminant analysis, with a diagonal covariance.
        </p>
        <p>
          You can watch that coefficient be nonzero on the measured data. If it is not zero, the boundary
          curves:
        </p>

        <CodeBlock setup={NB_SETUP} fromScratch={fromScratch} />

        <h2>Shared variances collapse it to a line</h2>
        <p>
          Now suppose the variances are <em>shared</em> across classes,{" "}
          <M>{String.raw`\sigma_{j+} = \sigma_{j-} = \sigma_j`}</M>. The quadratic coefficient becomes exactly
          zero, the squared terms cancel, and what remains is linear:
        </p>

        <MathBlock>{String.raw`g(\mathbf{x}) \;=\; \sum_{j=1}^{d} \frac{\mu_{j+} - \mu_{j-}}{\sigma_j^2}\, x_j \;+\; b \;=\; \mathbf{w}^\top \mathbf{x} + b.`}</MathBlock>

        <p>
          The boundary is a hyperplane — precisely <strong>linear discriminant analysis</strong> with a
          diagonal, shared covariance. And because the score is linear, its sigmoid is a logistic function of{" "}
          <M>{String.raw`\mathbf{x}`}</M>: in log-space, Gaussian NB with shared variances has the exact
          functional form of <Link href="/learn/logistic-regression" style={link}>logistic regression</Link>.
          The two differ only in <em>how they fit the weights</em>, not in the shape they can draw — the{" "}
          <Link href="/learn/naive-bayes/hidden-linear-classifier" style={link}>hidden linear classifier</Link>{" "}
          a later page is all about.
        </p>

        <Callout color={TEAL} title={<>Multinomial and Bernoulli NB are linear too</>}>
          For the count-based flavours the boundary is always linear. In{" "}
          <Link href="/learn/naive-bayes/multinomial-nb" style={link}>Multinomial NB</Link> the log-likelihood
          is linear in the feature counts (each count multiplies a log-probability), so the log-posterior-ratio
          is a weighted sum of counts — a hyperplane in count space.{" "}
          <Link href="/learn/naive-bayes/bernoulli-nb" style={link}>Bernoulli NB</Link> is linear in the binary
          presence indicators for the same reason. Only Gaussian NB with unequal variances leaves the linear
          regime.
        </Callout>

        <h2>Independence makes the contours axis-aligned</h2>
        <p>
          The independence assumption leaves a vivid geometric fingerprint. Because Gaussian NB models the
          features as independent within a class, the class-conditional density is a <em>product</em> of
          one-dimensional Gaussians — a multivariate Gaussian with a <strong>diagonal</strong> covariance. All
          off-diagonal terms are forced to zero.
        </p>
        <p>
          A diagonal covariance means the elliptical contours of constant density have their axes aligned with
          the coordinate axes. They can stretch differently along each feature — tall and thin, wide and flat —
          but they can never <em>tilt</em>. A tilted ellipse would need a nonzero covariance between two
          features, exactly the correlation the naive assumption forbids. So if your classes are genuinely
          correlated clouds — diagonal ellipses in the plane — Gaussian NB cannot represent their true shape; it
          fits the best axis-aligned ellipse to each. That is the geometric cost of independence: the boundary
          can bend, but only from unequal per-feature variances, never from feature correlations.
        </p>

        <Quiz
          accent={TEAL}
          title="Checkpoint"
          questions={[
            {
              q: <>When does Gaussian Naive Bayes draw a linear boundary rather than a quadratic one?</>,
              options: [
                "When the class priors are equal",
                "When the per-feature variances are shared across classes, so the x² terms cancel in the log-ratio",
                "When there are only two features",
              ],
              answer: 1,
              explain: <>The squared terms carry the coefficient 1/(2σ₋²) − 1/(2σ₊²). Shared variances make it
                zero, the quadratic cancels, and the boundary is a hyperplane — the LDA / logistic-regression
                form. Unequal variances keep the quadratic and give a conic.</>,
            },
            {
              q: <>Why are the Gaussian class-density contours always axis-aligned here?</>,
              options: [
                "Because the features are normalised before fitting",
                "Because independence forces a diagonal covariance, and a diagonal covariance means the elliptical contours cannot tilt",
                "Because the classes always have equal variance",
              ],
              answer: 1,
              explain: <>Independence within a class makes the joint a product of 1-D Gaussians — zero
                off-diagonal covariance. A tilted ellipse needs nonzero covariance, which the assumption
                forbids, so contours stay axis-aligned: stretchable but never rotated.</>,
            },
            {
              q: <>How are Multinomial and Bernoulli NB boundaries shaped?</>,
              options: [
                "Quadratic, like the general Gaussian case",
                "Linear — the log-likelihood is linear in the counts (or presence indicators), so the log-ratio is a hyperplane",
                "Nonlinear, depending on vocabulary size",
              ],
              answer: 1,
              explain: <>Each count (or binary indicator) multiplies a fixed log-probability, so the
                log-likelihood — and thus the log-posterior-ratio — is a weighted sum of the features. Its zero
                set is a hyperplane: always linear.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/naive-bayes/probabilities-break-decisions-survive", label: <>&larr; Probabilities break, decisions survive</> }}
          next={{ href: "/learn/naive-bayes/gaussian-nb", label: <>Next up &middot; Gaussian Naive Bayes &rarr;</> }}
        />
      </div>
    </article>
  );
}
