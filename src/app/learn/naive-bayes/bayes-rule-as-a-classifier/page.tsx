import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { PredictPrompt } from "@/components/PredictPrompt";
import { NB_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "Bayes' rule as a classifier — Manifold",
  description:
    "To classify, model how each class generates its data and turn it around with Bayes' rule. The evidence term cancels, so you never compute it — worked by hand on a measured example.",
};

const TEAL = "var(--c-classification)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function BayesRuleAsAClassifierPage() {
  const fromScratch = `from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split

# the 2-class, 2-feature problem from section 1 of the script
X, y = make_classification(n_samples=600, n_features=2, n_informative=2,
                           n_redundant=0, n_clusters_per_class=1,
                           class_sep=1.3, random_state=0)
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.3, random_state=0)

nb = GaussianNB().fit(Xtr, ytr)
print("priors:", nb.class_prior_.round(3))            # P(y)  ->  [0.507 0.493]

# Bayes' rule BY HAND for one test point: prior x Gaussian likelihood
x = Xte[0]
g     = np.exp(-(x - nb.theta_)**2 / (2*nb.var_)) / np.sqrt(2*np.pi*nb.var_)
score = nb.class_prior_ * g.prod(axis=1)              # P(y) * P(x|y)
print("by hand :", (score / score.sum()).round(4))    # normalise -> posterior
print("sklearn :", nb.predict_proba([x]).round(4))     # identical
print("accuracy:", round(accuracy_score(yte, nb.predict(Xte)), 3))`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: TEAL }, { label: "Beginner", color: "var(--c-fundamentals)" }]}
        time="about 8 minutes"
        title={<>Bayes&rsquo; rule as a classifier</>}
        intro={<>You just met Naive Bayes on the hub. Now for its one big idea. Most classifiers you know
          draw a boundary directly — logistic regression learns which side of a line a point is on. Naive
          Bayes makes the opposite move: it models how each class <em>generates</em> its data, then flips
          that around with Bayes&rsquo; rule to score the classes. This whole page is that single flip,
          worked end to end.</>}
      />

      <div className="lesson">
        <h2>The core move: model the generator</h2>
        <p>
          Say you want to tell class 0 from class 1 given some features <code>x</code>. Instead of asking
          &ldquo;where&rsquo;s the boundary?&rdquo;, the generative recipe asks a more basic question, once
          per class: <em>if a point came from this class, how likely is it to look like x?</em> That
          quantity is the <strong>likelihood</strong>, written <M>{String.raw`P(x \mid y)`}</M> — each
          class&rsquo;s model of its own data.
        </p>
        <p>
          Pair each likelihood with the class&rsquo;s <strong>prior</strong> <M>{String.raw`P(y)`}</M> —
          how common the class is before you look at any features — and you have everything you need. The
          product <M>{String.raw`P(y)\,P(x \mid y)`}</M> is the probability of that class{" "}
          <em>and</em> that data occurring together, and the class with the biggest product wins. Written
          out, that is Bayes&rsquo; rule:
        </p>

        <MathBlock>{String.raw`P(y \mid x) \;=\; \frac{P(y)\,P(x \mid y)}{P(x)} \;\propto\; P(y)\,P(x \mid y)`}</MathBlock>

        <p>
          On the left is the <strong>posterior</strong> — the answer we want, the probability of the class
          given the data. On the right are the two things we can count from a training set: prior and
          likelihood. The denominator <M>{String.raw`P(x)`}</M> is called the <strong>evidence</strong>,
          and here is the happy surprise of the whole page: <em>you never have to compute it.</em>
        </p>

        <h2>Why the evidence cancels</h2>
        <p>
          To <em>decide</em>, you only need to know which class scores highest — the <code>argmax</code>,
          not the exact value. And the evidence <M>{String.raw`P(x)`}</M> is the same positive number for
          every class (it sums the joint over <em>all</em> classes, so it can&rsquo;t depend on which class
          you&rsquo;re scoring). Dividing every score by the same positive number never changes their
          order: if one score beats another, it still beats it after both are divided by the same{" "}
          <M>{String.raw`P(x)`}</M>. So the decision is simply:
        </p>

        <MathBlock>{String.raw`\hat{y} \;=\; \arg\max_{y}\; P(y)\,P(x \mid y)`}</MathBlock>

        <p>
          Compute <M>{String.raw`P(y)\,P(x \mid y)`}</M> for each class, pick the winner, done. You only
          ever need the evidence if you want the posterior to be a real probability instead of a raw
          score — and <Link href="/learn/naive-bayes/calibration" style={link}>later in the track</Link>{" "}
          we measure just how untrustworthy that probability turns out to be.
        </p>

        <h2>A worked example, measured</h2>
        <p>
          Fit <code>GaussianNB</code> on a two-class, two-feature problem — 600 points — and it stores
          exactly the pieces Bayes&rsquo; rule asks for. The learned priors come out almost equal,{" "}
          <strong>0.507</strong> and <strong>0.493</strong>, so the prior barely tips the scale — the
          likelihood does the work. Each class also stored a Gaussian per feature: class 0 has means{" "}
          <M>{String.raw`[1.27,\, -1.365]`}</M>, class 1 has means <M>{String.raw`[1.223,\, 1.2]`}</M>.
          They overlap on the first feature and separate on the second — class 0 sits low, class 1 sits
          high.
        </p>

        <PredictPrompt
          prompt={<>A new point arrives at x = [0.834, 0.83]. Its second coordinate, 0.83, is close to class
            1&rsquo;s mean of 1.2 and far from class 0&rsquo;s −1.365. How confident will Bayes&rsquo; rule
            be that this is class 1?</>}
          options={["Roughly 60% — a mild lean", "Around 90% — fairly sure", "Over 99% — almost certain"]}
          nudge={<>Locked in. Run the code below — it computes the posterior by hand, then checks it against sklearn.</>}
        />

        <p>
          Feeding that point through Bayes&rsquo; rule — prior times each class&rsquo;s Gaussian
          likelihood, then normalised — gives a posterior of <M>{String.raw`[0.0015,\; 0.9985]`}</M>:
          over 99% sure it&rsquo;s class 1, and correct. With nearly equal priors, the likelihood carried
          the decision, because 0.83 is far more plausible under class 1&rsquo;s high-mean Gaussian.
          Across the whole held-out set this classifier reaches <strong>0.950</strong> accuracy.
        </p>

        <h2>The code</h2>
        <p>
          Here is Bayes&rsquo; rule computed literally — prior times the product of per-feature Gaussian
          likelihoods, normalised — next to scikit-learn&rsquo;s one-liner. They print identical numbers,
          because they are the same arithmetic.
        </p>

        <CodeBlock setup={NB_SETUP} fromScratch={fromScratch} />

        <Callout color={TEAL} title={<>Modelling the generator, not the boundary</>}>
          Logistic regression would have fitted one boundary line and reported which side{" "}
          <code>x</code> fell on. Naive Bayes never drew a line. It built a little probabilistic model of
          each class, asked both &ldquo;how well does x fit me?&rdquo;, and let Bayes&rsquo; rule weigh
          those answers against the priors. The boundary is an <em>output</em> of that comparison, not
          something fitted directly — and that difference is the theme of the next two pages.
        </Callout>

        <Callout color="var(--c-fundamentals)" title={<>The one thing to take away</>}>
          To classify, score each class by <strong>prior × likelihood</strong> and pick the largest. The
          normaliser <M>{String.raw`P(x)`}</M> is the same for every class, so it can never change the
          winner — you compute it only when you want a probability, never when you only want a decision.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/naive-bayes", label: <>← What Naive Bayes is</> }}
          next={{ href: "/learn/naive-bayes/prior-likelihood-posterior", label: <>Next up · Prior, likelihood, posterior →</> }}
        />
      </div>
    </article>
  );
}
