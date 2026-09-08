import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { Quiz } from "@/components/Quiz";
import { NB_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "Prior, likelihood, posterior — Manifold",
  description:
    "The three pieces of Bayes' rule named precisely — and the surprise that fitting Naive Bayes is nothing but counting and averaging them. No loss, no iteration, no gradient.",
};

const TEAL = "var(--c-classification)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function PriorLikelihoodPosteriorPage() {
  const fromScratch = `# the same 2-feature problem; "fitting" is just tallying statistics
X, y = make_classification(n_samples=600, n_features=2, n_informative=2,
                           n_redundant=0, n_clusters_per_class=1,
                           class_sep=1.3, random_state=0)

# no training loop -- estimate the three tables straight from the data
classes = np.unique(y)
prior = np.array([(y == c).mean()        for c in classes])   # class frequencies
means = np.array([X[y == c].mean(axis=0) for c in classes])   # sample means
varis = np.array([X[y == c].var(axis=0)  for c in classes])   # sample variances
print("prior  P(y)           :", prior.round(3))
print("means  (class,feature):\\n", means.round(3))
print("vars   (class,feature):\\n", varis.round(3))`;

  const withLibrary = `X, y = make_classification(n_samples=600, n_features=2, n_informative=2,
                           n_redundant=0, n_clusters_per_class=1,
                           class_sep=1.3, random_state=0)
nb = GaussianNB().fit(X, y)                 # stores exactly those three tables
print("prior  P(y)           :", nb.class_prior_.round(3))
print("means  (class,feature):\\n", nb.theta_.round(3))
print("vars   (class,feature):\\n", nb.var_.round(3))`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: TEAL }, { label: "Beginner", color: "var(--c-fundamentals)" }]}
        time="about 8 minutes"
        title={<>Prior, likelihood, posterior</>}
        intro={<>The last page showed Bayes&rsquo; rule turning a generative model into a decision. Now let&rsquo;s
          name its three pieces — prior, likelihood, posterior — and meet the quiet surprise behind them:{" "}
          <strong>fitting Naive Bayes is just estimating these from data.</strong> No loss to minimise, no
          iteration, no gradient. You count, you average, you&rsquo;re done.</>}
      />

      <div className="lesson">
        <h2>Three names on one equation</h2>
        <p>
          Every term in Bayes&rsquo; rule has a name, and each corresponds to a concrete thing you compute
          from a training set.
        </p>

        <MathBlock>{String.raw`\underbrace{P(y \mid x)}_{\text{posterior}} \;=\; \frac{\overbrace{P(y)}^{\text{prior}}\;\overbrace{P(x \mid y)}^{\text{likelihood}}}{\underbrace{P(x)}_{\text{evidence}}}`}</MathBlock>

        <p>
          The <strong>prior</strong> and <strong>likelihood</strong> are the two things you estimate. The{" "}
          <strong>posterior</strong> is what the rule hands back. The evidence, as the last page showed, is
          a normaliser you can ignore for the decision. Take the three you keep, one at a time.
        </p>

        <h2>The prior: count the classes</h2>
        <p>
          The prior <M>{String.raw`P(y)`}</M> is how common a class is before you look at any features. You
          estimate it by counting — the fraction of training examples in each class. In the measured
          example, 600 points split nearly evenly, so the priors come out{" "}
          <strong>0.507</strong> and <strong>0.493</strong>. That is literally the class-frequency table:
          roughly half the points carried each label. No optimisation — a division.
        </p>

        <h2>The likelihood: a model of each class&rsquo;s features</h2>
        <p>
          The likelihood <M>{String.raw`P(x \mid y)`}</M> is the per-class model of the features: given a
          point in class <M>{String.raw`c`}</M>, how are its feature values spread? For continuous features,{" "}
          <code>GaussianNB</code> answers with one Gaussian per feature per class — a mean and a variance
          each. The measured run stored, for the two features:
        </p>

        <MathBlock>{String.raw`\begin{aligned}
\text{class 0:}\quad &\text{means } [\,1.27,\; -1.365\,], \quad \text{variances } [\,0.168,\; 0.316\,] \\
\text{class 1:}\quad &\text{means } [\,1.223,\; 1.2\,], \quad\;\; \text{variances } [\,1.037,\; 1.075\,]
\end{aligned}`}</MathBlock>

        <p>
          Read these as the shape of each class. Class 0 is a tight blob — small variances — sitting low on
          the second feature at <M>{String.raw`-1.365`}</M>. Class 1 is a looser cloud, centred high at 1.2.
          They overlap almost completely on the first feature and separate on the second. Every one of these
          eight numbers is a sample statistic: an average, and a spread. Again, no iteration.
        </p>

        <h2>See it: fitting is three tables</h2>
        <p>
          Fit the model and print what it kept. There is no loss curve to watch — just counts and averages,
          computed in a single pass:
        </p>

        <CodeBlock setup={NB_SETUP} fromScratch={fromScratch} withLibrary={withLibrary} />

        <Callout color={TEAL} title={<>Fitting is estimation, not optimisation</>}>
          This is the quiet surprise of Naive Bayes. Where logistic regression runs an iterative solver to
          descend a loss, Naive Bayes has a <em>closed form</em>: the prior is a count, each Gaussian&rsquo;s
          mean is an average, each variance is a spread. And these aren&rsquo;t heuristics — they are the{" "}
          <strong>maximum-likelihood estimates</strong>, the parameter values that make the training data
          most probable (set the derivative of the Gaussian log-likelihood to zero and the sample mean and
          variance fall straight out). Fitting the whole classifier is one pass to tally them — which is why,
          on high-dimensional text, it trains in a{" "}
          <Link href="/learn/naive-bayes/naive-bayes-for-text" style={link}>single counting pass</Link> while
          its rivals iterate.
        </Callout>

        <h2>The posterior: what Bayes&rsquo; rule returns</h2>
        <p>
          The posterior <M>{String.raw`P(y \mid x)`}</M> is not estimated separately — it is{" "}
          <em>computed</em> from the prior and likelihood, per test point, by Bayes&rsquo; rule. For{" "}
          <M>{String.raw`x = [0.834,\, 0.83]`}</M> the stored parameters produce{" "}
          <M>{String.raw`[0.0015,\; 0.9985]`}</M>. The priors were nearly equal, so the likelihood dominated:
          0.83 fits class 1&rsquo;s high-mean Gaussian far better. The training statistics were frozen once at
          fit time; the posterior is re-derived for each new point from those same fixed numbers.
        </p>

        <Quiz
          accent={TEAL}
          title="Checkpoint"
          questions={[
            {
              q: <>Which term does Bayes&rsquo; rule <em>return</em> rather than estimate directly from
                data?</>,
              options: ["The prior P(y)", "The likelihood P(x|y)", "The posterior P(y|x)"],
              answer: 2,
              explain: <>The prior and likelihood are estimated from the training set (counting and
                averaging). The posterior is computed from those two per test point — it is the output.</>,
            },
            {
              q: <>How is the prior <M>{String.raw`P(y{=}0) = 0.507`}</M> obtained?</>,
              options: [
                "By running gradient descent on the labels",
                "By counting the fraction of training examples with label 0",
                "By averaging the feature values within class 0",
              ],
              answer: 1,
              explain: <>The prior is the class frequency — count with that label over total. 0.507 means
                about half the points were class 0. A count, not an optimisation.</>,
            },
            {
              q: <>Why does fitting Naive Bayes need no iterative solver?</>,
              options: [
                "Because it ignores the features",
                "Because its parameters are maximum-likelihood estimates available in closed form from one pass over the data",
                "Because it only works on two classes",
              ],
              answer: 1,
              explain: <>Each piece has a closed-form MLE: the prior is a frequency, each mean a sample mean,
                each variance a sample variance. Tallying them is one pass — no loss to descend.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/naive-bayes/bayes-rule-as-a-classifier", label: <>← Bayes&rsquo; rule as a classifier</> }}
          next={{ href: "/learn/naive-bayes/generative-vs-discriminative", label: <>Next up · Generative vs discriminative →</> }}
        />
      </div>
    </article>
  );
}
