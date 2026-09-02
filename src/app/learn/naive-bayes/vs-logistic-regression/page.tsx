import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LabFrame } from "@/components/LabFrame";
import { GenerativeDiscriminativeLab } from "@/components/labs/GenerativeDiscriminativeLab";
import { NB_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "Naive Bayes vs logistic regression — Manifold",
  description:
    "The generative/discriminative pair on the same hypothesis space. The measured crossover: Naive Bayes wins with little data (30–150 points), they tie near 400, logistic regression pulls ahead by 1000+.",
};

const TEAL = "var(--c-classification)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function VsLogisticRegressionPage() {
  const fromScratch = `from sklearn.datasets import make_classification

X, y = make_classification(n_samples=5000, n_features=20, n_informative=8,
                           n_redundant=0, n_clusters_per_class=2,
                           class_sep=0.9, flip_y=0.05, random_state=0)
Xpool, Xte, ypool, yte = train_test_split(X, y, test_size=2000, random_state=0)

for n in (30, 150, 1000):                       # grow the training set
    idx = np.random.RandomState(0).choice(len(Xpool), n, replace=False)
    nb = GaussianNB().fit(Xpool[idx], ypool[idx])
    lr = LogisticRegression(max_iter=2000).fit(Xpool[idx], ypool[idx])
    print(f"n={n:>4}:  NB {round(accuracy_score(yte, nb.predict(Xte)),3)}"
          f"   LR {round(accuracy_score(yte, lr.predict(Xte)),3)}")`;

  return (
    <article>
      <LessonHeader
        chips={[
          { label: "Classification", color: TEAL },
          { label: "Practitioner", color: "var(--c-fundamentals)" },
        ]}
        time="about 9 minutes"
        title={<>Naive Bayes vs logistic regression</>}
        intro={<>These two are not rivals from different worlds — they are two halves of one idea. Naive Bayes
          models how each class <em>generates</em> the features and inverts with Bayes&rsquo; rule; logistic
          regression models the boundary directly. On the same data they draw the <em>same shape</em> of
          boundary, estimated two different ways. Which estimate should you trust? The honest answer, with
          measurements: it depends on how much data you have.</>}
      />

      <div className="lesson">
        <h2>A matched pair, not two philosophies</h2>
        <p>
          Naive Bayes is <strong>generative</strong>: it learns <M>{String.raw`P(y)`}</M> and{" "}
          <M>{String.raw`P(\mathbf{x} \mid y)`}</M>, then applies Bayes&rsquo; rule. Logistic regression is{" "}
          <strong>discriminative</strong>: it fits <M>{String.raw`P(y \mid \mathbf{x})`}</M> directly. What makes
          them a genuine pair is that they share a hypothesis space — with a variance shared across classes,
          Gaussian Naive Bayes&rsquo; decision rule is <em>exactly</em> the logistic form{" "}
          <M>{String.raw`\sigma(\mathbf{w}^\top\mathbf{x} + b)`}</M>. They can represent the same linear boundary
          and differ only in <em>how they choose the weights</em>: Naive Bayes reads them off class-conditional
          moments in one pass; logistic regression solves for them iteratively. (The{" "}
          <Link href="/learn/naive-bayes/hidden-linear-classifier" style={link}>next page</Link> derives that
          shared form in full.)
        </p>

        <PredictPrompt
          prompt={<>Same problem, same boundary shape, two estimators. With only <em>30</em> training points, which
            wins — and does the answer flip once you have <em>thousands</em>?</>}
          options={[
            "Logistic regression wins at both sizes",
            "Naive Bayes wins small; logistic regression overtakes it with lots of data",
            "They tie everywhere — same boundary, same accuracy",
          ]}
          nudge={<>Locked in. Hover the curves, then run the head-to-head yourself.</>}
        />

        <h2>The crossover, measured</h2>
        <p>
          Both models fit the same 20-feature problem, over training sets growing from 15 to 3000 points, each
          accuracy averaged over 15 seeds:
        </p>

        <LabFrame
          accent={TEAL}
          tryThis={<>Hover along the curves from left to right. Find where Naive Bayes leads, where the two lines
            meet, and where logistic regression pulls ahead for good.</>}
          insight={<>The lines cross once, near <strong>400</strong> training points. To the left, the generative
            model wins — at 60 points it leads 0.809 to 0.774. To the right it loses — at 3000 points logistic
            regression leads 0.857 to 0.851. The crossover is not noise; it is the signature of a bias–variance
            trade the two estimators make differently.</>}
        >
          <GenerativeDiscriminativeLab />
        </LabFrame>

        <p>
          Read the numbers: at <strong>15</strong> points they are within a whisker (0.701 vs 0.710). At{" "}
          <strong>30</strong> Naive Bayes pulls ahead, 0.760 to 0.733; at <strong>60</strong>, 0.809 to 0.774;
          at <strong>150</strong>, 0.835 to 0.817. Near <strong>400</strong> the lines touch at 0.845. Past
          that, logistic regression takes over — 0.853 to 0.852 at 1000, 0.857 to 0.851 at 3000. Run a few
          points of it (single-seed, so it wobbles, but the crossover shows):
        </p>

        <CodeBlock setup={NB_SETUP} fromScratch={fromScratch} />

        <Callout color={TEAL} title={<>Higher bias, lower variance — the counter-intuitive winner</>}>
          The model that wins with little data is the one with the <em>worse</em> asymptote. Naive Bayes carries a
          bias it can never shed — its independence assumption is wrong, so even with infinite data it plateaus
          below logistic regression&rsquo;s ceiling. But that same rigid assumption means it has very little to
          estimate and almost nothing to overfit, so its variance is tiny. With few points, low variance beats
          low bias. With many, the bias that never goes away is all that separates them, and logistic
          regression&rsquo;s lower bias wins.
        </Callout>

        <h2>Why this is a law, not a coincidence</h2>
        <p>
          This is the result of Ng &amp; Jordan (2002). Split the expected error into a <strong>bias floor</strong>{" "}
          that never shrinks and a <strong>variance term</strong> that falls with data:
        </p>

        <MathBlock>{String.raw`\mathbb{E}[\,\text{err}(n)\,] \;\approx\; \underbrace{\varepsilon_\infty}_{\text{bias floor}} \;+\; \underbrace{\frac{C}{n}}_{\text{variance, }\downarrow\text{ with }n}`}</MathBlock>

        <p>
          Naive Bayes has the higher bias floor (<M>{String.raw`\varepsilon_\infty^{\text{NB}} > \varepsilon_\infty^{\text{LR}}`}</M>,
          from its wrong assumption) but a far smaller variance constant (<M>{String.raw`C_{\text{NB}} \ll C_{\text{LR}}`}</M>,
          from having only a few moments to estimate). At small <M>{String.raw`n`}</M> the <M>{String.raw`C/n`}</M>{" "}
          term dominates and the low-variance model wins; as <M>{String.raw`n \to \infty`}</M> that term vanishes
          and only the bias floor remains, so the low-bias model wins. Setting the two equal gives a single
          crossover <M>{String.raw`n^\star = (C_{\text{LR}} - C_{\text{NB}})/(\varepsilon_\infty^{\text{NB}} - \varepsilon_\infty^{\text{LR}})`}</M>{" "}
          — here <M>{String.raw`\approx 400`}</M>, exactly what the curves show. Ng &amp; Jordan also show{" "}
          <em>why</em> the crossover is early: Naive Bayes needs about <M>{String.raw`\log d`}</M> examples to
          approach its ceiling, while a discriminative model needs about <M>{String.raw`d`}</M>.
        </p>

        <Callout color="var(--c-fundamentals)" title={<>The practical takeaway</>}>
          <strong>Naive Bayes is the better small-data classifier.</strong> With a few dozen to a few hundred
          labelled examples, the model that assumes more and estimates less usually beats the one that assumes
          less and estimates more — precisely because there is not enough data to estimate more reliably.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/naive-bayes/calibration", label: <>← Calibration</> }}
          next={{ href: "/learn/naive-bayes/hidden-linear-classifier", label: <>Next up · The hidden linear classifier →</> }}
        />
      </div>
    </article>
  );
}
