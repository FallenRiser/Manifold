import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { Quiz } from "@/components/Quiz";
import { LabFrame } from "@/components/LabFrame";
import { AdaBoostLab } from "@/components/labs/AdaBoostLab";

export const metadata = {
  title: "AdaBoost by hand — Manifold",
  description:
    "AdaBoost in full: keep a weight on every training example, train a weak learner on the weighted data, give it a say proportional to how right it was, then up-weight whatever it got wrong. Four lines of update rules, derived and run on real data.",
};

const TREES = "var(--c-trees)";

const CODE = `import numpy as np
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import AdaBoostClassifier

X, y = load_breast_cancer(return_X_y=True)
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.3,
                                      random_state=0, stratify=y)

ada = AdaBoostClassifier(
    estimator=DecisionTreeClassifier(max_depth=1),  # a stump
    n_estimators=300, learning_rate=1.0, random_state=0).fit(Xtr, ytr)

# error as the ensemble grows, staged from 1 to 300 stumps
for n, p in enumerate(ada.staged_predict(Xte), 1):
    if n in (1, 5, 25, 50, 300):
        print(f"{n:3d} stumps  test error {1-(p==yte).mean():.4f}")`;

export default function AdaBoostPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Trees & ensembles", color: TREES }, { label: "Tier 1 · intuition", color: "var(--c-fundamentals)" }]}
        time="about 10 minutes"
        title={<>AdaBoost by hand</>}
        intro={<>
          AdaBoost — <em>adaptive boosting</em> — is the algorithm that turned the theory into practice, and it
          is startlingly simple: four update rules you could run with a pencil. Derive them once and every later
          boosting method becomes a variation on the theme.
        </>}
      />

      <div className="lesson">
        <h2>The state: a weight on every example</h2>
        <p>
          AdaBoost keeps a probability weight <M>{String.raw`w_i`}</M> on each of the <M>{String.raw`n`}</M>{" "}
          training examples, starting uniform at <M>{String.raw`w_i = 1/n`}</M>. The weights encode{" "}
          <em>&ldquo;how much the team still cares about getting this example right.&rdquo;</em> The whole
          algorithm is a loop that, each round, trains a weak learner to respect the current weights and then
          updates them. Labels are written as <M>{String.raw`y_i \in \{-1, +1\}`}</M> — the sign convention that
          makes the algebra clean.
        </p>

        <h2>One round of AdaBoost</h2>
        <p>At round <M>{String.raw`m`}</M>, with current weights <M>{String.raw`w_i`}</M>:</p>
        <ol style={ol}>
          <li>
            <strong>Fit a weak learner <M>{String.raw`h_m`}</M></strong> to minimise the{" "}
            <em>weighted</em> error — a stump that pays attention to heavily-weighted examples.
          </li>
          <li>
            <strong>Measure its weighted error</strong>
            <MathBlock>{String.raw`\varepsilon_m = \frac{\sum_{i} w_i \,\mathbf{1}[h_m(x_i)\neq y_i]}{\sum_i w_i}`}</MathBlock>
            the fraction of <em>weight</em> (not count) that it misclassifies.
          </li>
          <li>
            <strong>Give it a say <M>{String.raw`\alpha_m`}</M></strong> — its vote in the final ensemble:
            <MathBlock>{String.raw`\alpha_m = \tfrac12 \,\ln\!\frac{1-\varepsilon_m}{\varepsilon_m}`}</MathBlock>
          </li>
          <li>
            <strong>Re-weight the examples</strong> and renormalise:
            <MathBlock>{String.raw`w_i \leftarrow w_i \,\exp\!\big(\alpha_m \,\mathbf{1}[h_m(x_i)\neq y_i]\big) \;\;\text{(equivalently } w_i\,e^{-\alpha_m y_i h_m(x_i)}\text{)}`}</MathBlock>
          </li>
        </ol>
        <p>The final classifier is the <strong>weighted vote</strong> of all the weak learners:</p>
        <MathBlock>{String.raw`F(x) = \operatorname{sign}\!\Big(\textstyle\sum_{m=1}^{M}\alpha_m\, h_m(x)\Big)`}</MathBlock>

        <h2>Read the two magic formulas</h2>
        <p>
          The <M>{String.raw`\alpha_m`}</M> formula is pure common sense once you look at it. A learner with low
          error <M>{String.raw`\varepsilon_m`}</M> gets a <em>large positive</em> vote (the log ratio blows up as{" "}
          <M>{String.raw`\varepsilon_m \to 0`}</M>). A learner at chance, <M>{String.raw`\varepsilon_m = 0.5`}</M>,
          gets <M>{String.raw`\alpha_m = 0`}</M> — no say at all, because it adds nothing. And a learner that is{" "}
          <em>worse</em> than chance gets a <em>negative</em> vote: AdaBoost flips it and uses it anyway. The vote
          is the learner&rsquo;s credibility.
        </p>
        <p>
          The weight update is equally intuitive. An example the learner got{" "}
          <strong>wrong</strong> is multiplied by <M>{String.raw`e^{\alpha_m} > 1`}</M> — its weight{" "}
          <em>grows</em>, so the next learner tries harder on it. An example it got{" "}
          <strong>right</strong> shrinks (in the symmetric <M>{String.raw`e^{-\alpha_m y_i h_m}`}</M> form). After
          renormalising, a beautiful fact falls out: under the new weights the learner you just added has weighted
          error exactly <M>{String.raw`\tfrac12`}</M> — it is now &ldquo;used up,&rdquo; forcing the next round to
          find a genuinely different edge.
        </p>

        <Callout color={TREES} title={<>Why the errors fall geometrically</>}>
          One line of algebra (next page) shows the training error is bounded by{" "}
          <M>{String.raw`\prod_m 2\sqrt{\varepsilon_m(1-\varepsilon_m)}`}</M>. As long as every learner has some
          edge — <M>{String.raw`\varepsilon_m \le \tfrac12 - \gamma`}</M> — each factor is <M>{String.raw`< 1`}</M>,
          so the product, and thus the training error, decays <strong>exponentially</strong> in the number of
          rounds. This <em>is</em> Schapire&rsquo;s &ldquo;weak implies strong,&rdquo; made mechanical.
        </Callout>

        <LabFrame
          accent={TREES}
          tryThis={<>Step through the stumps. Each dashed line is the best single threshold on the{" "}
            <em>weighted</em> data; ringed dots are the ones it misclassifies. Watch those dots swell round to
            round as their weight grows — and watch the ensemble accuracy climb even though every individual stump
            stays weak.</>}
          insight={<>No single stump does better than ~80%, and its weighted error even <em>rises</em> over rounds
            as the weights pile onto the hard, near-boundary (and noisy) points. Yet the weighted vote reaches
            100% training accuracy within a dozen stumps — often non-monotonically, dipping before it recovers.
            Weak learners, forced onto the mistakes, compound into a strong one.</>}
        >
          <AdaBoostLab />
        </LabFrame>

        <h2>Run it on real data</h2>
        <p>
          AdaBoost with depth-1 stumps on the breast-cancer dataset (569 samples, 30 features). Each stump is
          almost useless alone; watch the ensemble:
        </p>
        <CodeBlock fromScratch={CODE} />
        <CodeOutput label="output">{`  1 stumps  test error 0.1111
  5 stumps  test error 0.0702
 25 stumps  test error 0.0643
 50 stumps  test error 0.0585
300 stumps  test error 0.0292`}</CodeOutput>
        <p>
          A single stump is wrong 11% of the time. Twenty-five of them, each individually weak, halve that; three
          hundred drive the test error to <strong>2.9%</strong>. And here is the detail that will occupy the next
          two pages: on this run the <em>training</em> error hits exactly zero at 28 stumps — yet the test error
          keeps falling all the way to 300, long after there are no training mistakes left to fix. That is not
          supposed to happen, and understanding <em>why</em> it does is the heart of AdaBoost&rsquo;s theory.
        </p>

        <Quiz
          title="Can you answer these?"
          accent={TREES}
          questions={[
            {
              q: <>A weak learner in round m turns out to have weighted error ε&nbsp;=&nbsp;0.5. What vote α does AdaBoost give it?</>,
              options: ["A large positive vote", "Zero — it is ignored", "A large negative vote"],
              answer: 1,
              explain: <>α = ½·ln((1−ε)/ε) = ½·ln(1) = 0. A learner at chance carries no information, so it gets no say and the weights are left unchanged.</>,
            },
            {
              q: <>After a round, which training examples have their weights increased?</>,
              options: [
                "The ones the new weak learner classified correctly",
                "The ones it got wrong",
                "All of them equally",
              ],
              answer: 1,
              explain: <>Misclassified examples are multiplied by e^{"{α}"} &gt; 1, so they weigh more next round and the following weak learner is forced to focus on them.</>,
            },
            {
              q: <>Why does AdaBoost's training error fall exponentially with the number of rounds?</>,
              options: [
                "Because each tree gets deeper",
                "Because the error is bounded by a product of factors 2√(ε(1−ε)), each below 1 whenever the learner beats chance",
                "Because the learning rate decays",
              ],
              answer: 1,
              explain: <>Every weak learner with a real edge contributes a factor strictly less than 1, so the product — and the training-error bound — shrinks geometrically.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/boosting/weak-learners", label: <>← Weak learners &amp; the boosting question</> }}
          next={{ href: "/learn/boosting/adaboost-exponential-loss", label: <>Next up · Why AdaBoost works: exponential loss →</> }}
        />
      </div>
    </article>
  );
}

const ol: React.CSSProperties = { margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.9 };
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
