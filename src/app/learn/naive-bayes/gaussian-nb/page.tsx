import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { Quiz } from "@/components/Quiz";
import { NB_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "Gaussian Naive Bayes — Manifold",
  description:
    "The flavour for continuous features: each per-class likelihood is a 1-D Gaussian with its own mean and variance, read straight off the data. Measured 0.963 on wine, and why independence makes the covariance diagonal.",
};

const TEAL = "var(--c-classification)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function GaussianNbPage() {
  const fromScratch = `from sklearn.datasets import load_wine
from sklearn.model_selection import train_test_split

X, y = load_wine(return_X_y=True)        # 13 continuous features, 3 cultivars
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.3, random_state=0, stratify=y)

# one bell curve per feature per class -- mean, variance, prior, all by counting
classes = np.unique(ytr)
prior = np.array([(ytr == c).mean()          for c in classes])
means = np.array([Xtr[ytr == c].mean(axis=0) for c in classes])
varis = np.array([Xtr[ytr == c].var(axis=0)  for c in classes])
varis += 1e-9 * Xtr.var(axis=0).max()        # tiny variance floor, as sklearn does

# classify in log-space: log prior + sum of per-feature Gaussian log-densities
ll   = -0.5 * (np.log(2*np.pi*varis) + (Xte[:, None, :] - means)**2 / varis).sum(axis=2)
pred = (np.log(prior) + ll).argmax(axis=1)
print("test accuracy:", round((pred == yte).mean(), 3))   # 0.963`;

  const withLibrary = `from sklearn.datasets import load_wine
from sklearn.model_selection import train_test_split

X, y = load_wine(return_X_y=True)        # 13 continuous features, 3 cultivars
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.3, random_state=0, stratify=y)

nb = GaussianNB().fit(Xtr, ytr)          # 39 means + 39 variances, ONE pass
print("test accuracy:", round(accuracy_score(yte, nb.predict(Xte)), 3))   # 0.963
print("means shape  :", nb.theta_.shape)   # (3 classes, 13 features)`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: TEAL }, { label: "Practitioner", color: "var(--c-fundamentals)" }]}
        time="about 8 minutes"
        title={<>Gaussian Naive Bayes</>}
        intro={<>The last page showed the boundary can curve. Now meet the flavour that draws it. Naive Bayes
          needs one concrete thing: a model for how each class <em>generates</em> a feature. When the features
          are continuous — a length, a concentration, a sensor reading — the natural choice is a bell curve.
          Gaussian Naive Bayes fits one bell curve per feature per class, and that single decision fixes
          everything else.</>}
      />

      <div className="lesson">
        <h2>One Gaussian per feature, per class</h2>
        <p>
          The whole classifier is built from the likelihood <M>{String.raw`P(x_j \mid y)`}</M> — the probability
          that class <M>{String.raw`y`}</M> produces the value <M>{String.raw`x_j`}</M> on feature{" "}
          <M>{String.raw`j`}</M>. The Gaussian flavour models it as a one-dimensional normal with a mean and
          variance belonging to <em>this feature, in this class</em>:
        </p>

        <MathBlock>{String.raw`P(x_j \mid y=c) = \frac{1}{\sqrt{2\pi\,\sigma_{c,j}^{2}}}\;\exp\!\left(-\frac{(x_j - \mu_{c,j})^{2}}{2\,\sigma_{c,j}^{2}}\right)`}</MathBlock>

        <p>
          Every class <M>{String.raw`c`}</M> and feature <M>{String.raw`j`}</M> gets its own pair{" "}
          <M>{String.raw`(\mu_{c,j},\,\sigma_{c,j}^{2})`}</M>. On a problem with three classes and thirteen
          features that is <M>{String.raw`3 \times 13 = 39`}</M> means and 39 variances — the entire trained
          model. And there is nothing to iterate: the maximum-likelihood estimate of a Gaussian&rsquo;s mean and
          variance <em>is</em> the sample mean and variance, so you read the parameters straight off the data in
          one counting-and-averaging pass.
        </p>

        <h2>From likelihood to a decision score</h2>
        <p>
          Bayes&rsquo; rule combines the prior with the product of per-feature likelihoods — the naive
          assumption is what lets us <em>multiply</em> the features instead of modelling their joint. Because
          those probabilities are tiny, every implementation scores in log-space, turning the product into a
          sum, and each feature contributes a penalty that grows with the squared, variance-scaled distance from
          the class mean:
        </p>

        <MathBlock>{String.raw`\log P(x_j \mid y=c) = -\tfrac{1}{2}\log\!\big(2\pi\,\sigma_{c,j}^2\big) - \frac{(x_j - \mu_{c,j})^2}{2\,\sigma_{c,j}^2}.`}</MathBlock>

        <p>
          Read it geometrically: a class scores well on feature <M>{String.raw`j`}</M> when the test value sits
          near that class&rsquo;s mean, measured in units of that class&rsquo;s standard deviation. A tight
          feature (small <M>{String.raw`\sigma`}</M>) punishes deviations harshly; a loose one forgives them.
          The predicted class is the argmax of the summed score.
        </p>

        <h2>The measured result</h2>
        <p>
          On scikit-learn&rsquo;s <strong>wine</strong> dataset — 13 continuous chemical measurements (alcohol,
          magnesium, colour intensity, proline…) across 3 cultivars — Gaussian Naive Bayes reaches{" "}
          <strong>0.963</strong> test accuracy on a 30% held-out split. A strong number for a model with no
          hyperparameters and no iterations: 78 numbers estimated in one pass, classifying unseen wines with 96%
          accuracy. Fit it yourself:
        </p>

        <CodeBlock setup={NB_SETUP} fromScratch={fromScratch} withLibrary={withLibrary} />

        <p>
          It works so well because the wine features are individually close to bell-shaped and the cultivars
          separate cleanly across several of them at once — exactly Gaussian NB&rsquo;s home turf.
        </p>

        <h2>Independence means a diagonal covariance</h2>
        <p>
          There is a precise geometric consequence worth seeing. A full multivariate Gaussian for a class would
          have a <M>{String.raw`d \times d`}</M> covariance matrix describing how features co-vary. The naive
          assumption sets <em>every off-diagonal term to zero</em>:
        </p>

        <MathBlock>{String.raw`\Sigma_c = \begin{pmatrix} \sigma_{c,1}^2 & 0 & \cdots & 0 \\ 0 & \sigma_{c,2}^2 & \cdots & 0 \\ \vdots & \vdots & \ddots & \vdots \\ 0 & 0 & \cdots & \sigma_{c,d}^2 \end{pmatrix}`}</MathBlock>

        <p>
          A diagonal covariance describes an <strong>axis-aligned</strong> ellipsoid: the class cloud stretches
          differently along each feature axis but cannot tilt. Full Gaussian discriminant analysis allows the
          tilt and pays for it with <M>{String.raw`O(d^2)`}</M> parameters per class and the risk of a singular
          covariance when data is scarce. Gaussian NB trades that expressiveness for <M>{String.raw`O(d)`}</M>{" "}
          parameters and rock-solid estimation — which is why it holds up so well with little data.
        </p>

        <Callout color={TEAL} title={<>Axis-aligned, not tilted</>}>
          If two features are strongly correlated within a class, the true class cloud is a tilted ellipse and
          the diagonal model is wrong — it will over- or under-count their joint evidence. This is precisely the
          mechanism behind Naive Bayes&rsquo; overconfidence: it treats correlated features as if each were
          fresh, independent evidence. The decision often survives anyway (the argmax is robust), but the
          probability does not.
        </Callout>

        <h2>When it fits, and when it does not</h2>
        <p>
          Gaussian NB fits when each feature, <em>within a class</em>, is roughly bell-shaped and unimodal, and
          features are not too tightly correlated — sensor readings, physical measurements, many tabular numeric
          features. It fits badly when a feature is skewed, heavy-tailed, or multimodal, because a single
          mean-and-variance cannot describe two humps or a long tail — the Gaussian places its peak in the empty
          valley between modes. The fix is not to abandon the flavour but to{" "}
          <strong>transform the feature first</strong>: a log transform tames right-skewed quantities (income,
          concentrations), a power or quantile transform pulls a lopsided feature toward symmetry. Make the
          feature look Gaussian and the Gaussian likelihood is honest again. If a feature is truly a count or a
          category, reach for <Link href="/learn/naive-bayes/multinomial-nb" style={link}>Multinomial</Link> or{" "}
          <Link href="/learn/naive-bayes/bernoulli-nb" style={link}>Bernoulli</Link> instead.
        </p>

        <Quiz
          accent={TEAL}
          title="Checkpoint"
          questions={[
            {
              q: <>Gaussian NB on wine stores 39 means and 39 variances. How are those numbers obtained?</>,
              options: [
                "By gradient descent on the class-conditional log-likelihood over several epochs",
                "By reading the sample mean and sample variance of each feature within each class — a single pass",
                "By inverting a full 13×13 covariance matrix per class",
              ],
              answer: 1,
              explain: <>The MLEs for a Gaussian are exactly the sample mean and variance. Gaussian NB computes
                them per feature, per class, in one pass — no iteration, no matrix inversion, because the naive
                assumption removes all off-diagonal terms.</>,
            },
            {
              q: <>What does conditional independence do to each class&rsquo;s covariance?</>,
              options: [
                "Forces it diagonal — axis-aligned Gaussians with no cross-feature terms",
                "Forces all classes to share one covariance",
                "Makes every feature have unit variance",
              ],
              answer: 0,
              explain: <>Independence sets every off-diagonal covariance to zero, leaving only per-feature
                variances. Each class cloud is an axis-aligned ellipsoid — stretchable but not tilted. That
                O(d) model makes NB cheap and stable, and is why it double-counts correlated features.</>,
            },
            {
              q: <>A feature is strongly right-skewed with a long tail. Why is one Gaussian a problem, and what
                is the fix?</>,
              options: [
                "Not a problem — Gaussians handle skew automatically",
                "A single mean and variance can't capture a skewed shape, so the likelihood is misestimated; transform the feature (e.g. log) toward symmetry first",
                "The only fix is to delete the feature",
              ],
              answer: 1,
              explain: <>One mean and variance describe a symmetric bell; on a skewed feature they put mass
                where the data isn&rsquo;t. A log or power/quantile transform pulls the feature toward Gaussian
                shape, so the likelihood models it honestly again.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/naive-bayes/the-decision-boundary", label: <>← The decision boundary</> }}
          next={{ href: "/learn/naive-bayes/multinomial-nb", label: <>Next up · Multinomial Naive Bayes →</> }}
        />
      </div>
    </article>
  );
}
