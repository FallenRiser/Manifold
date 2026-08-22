import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "Case: the forest as a default — Manifold",
  description:
    "A random forest on the Forest Cover Type data: it turns a 76% single tree into an 84.7% forest with almost no tuning, its OOB score nails the test score, and accuracy plateaus with more trees. The whole track on one dataset.",
};

const TREES = "var(--c-trees)";

const SETUP = `import numpy as np
from sklearn.datasets import fetch_covtype
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier

# 581k forest patches, 54 cartographic features, 7 cover types.
# Subsample 25k for a fast, reproducible run.
df = fetch_covtype(as_frame=True).frame.sample(25_000, random_state=0)
X = df.drop(columns="Cover_Type").to_numpy(float)
y = df["Cover_Type"].to_numpy(int)
X_tr, X_te, y_tr, y_te = train_test_split(
    X, y, test_size=0.25, stratify=y, random_state=0)`;

const MODELS = `# a fair single-tree baseline (depth tuned by CV → 12)
tree = DecisionTreeClassifier(max_depth=12, random_state=0).fit(X_tr, y_tr)
print("single tree :", round(tree.score(X_te, y_te), 3))

# a forest, straight out of the box
rf = RandomForestClassifier(n_estimators=300, max_features="sqrt",
                            oob_score=True, n_jobs=-1, random_state=0).fit(X_tr, y_tr)
print("forest  OOB :", round(rf.oob_score_, 3))     # from training data alone
print("forest test :", round(rf.score(X_te, y_te), 3))`;

export default function CovertypeCasePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Trees & ensembles", color: TREES }, { label: "In the wild · real run", color: "var(--c-fundamentals)" }]}
        time="about 8 minutes"
        title={<>Case: the forest as a default</>}
        intro={<>
          One dataset to show why &ldquo;just try a random forest&rdquo; is such good advice. We&rsquo;ll
          classify patches of forest by their cover type — a forest classifying forests — and watch bagging turn
          a mediocre single tree into a strong model with essentially no tuning. Every number is from{" "}
          <code>scripts/forest_cases.py</code>.
        </>}
      />

      <div className="lesson">
        <h2>The data</h2>
        <p>
          The Forest Cover Type dataset has 581,000 30×30-metre patches of Colorado wilderness, each described
          by 54 cartographic features — elevation, slope, aspect, distances to water, roads and fire points,
          hillshade — and labelled with one of seven tree-cover types. It&rsquo;s a classic proving ground for
          tree ensembles (it&rsquo;s the dataset Breiman himself used). We take a reproducible 25k subsample.
        </p>
        <CodeBlock fromScratch={SETUP} />

        <h2>One tree, then a forest</h2>
        <p>
          We give the single tree a fair shot — its depth is cross-validated, not left to overfit — then drop
          in a default forest beside it:
        </p>
        <CodeBlock fromScratch={MODELS} />
        <CodeOutput label="output">{`single tree : 0.760
forest  OOB : 0.844
forest test : 0.847`}</CodeOutput>
        <p>
          A tuned single tree reaches <strong>76.0%</strong>. The forest, with no tuning beyond &ldquo;use 300
          trees,&rdquo; reaches <strong>84.7%</strong> — a <strong>+8.7 point</strong> jump for essentially no
          extra thought. That gain is pure variance reduction: the same greedy trees, averaged, cancel each
          other&rsquo;s jagged mistakes.
        </p>
        <p>
          Notice the two forest numbers. The <strong>OOB score (0.844)</strong> — computed from the training
          data alone, using each row&rsquo;s out-of-bag trees — lands within three-thousandths of the true{" "}
          <strong>test score (0.847)</strong>. That&rsquo;s the free-validation promise from Chapter 1, kept:
          you could have estimated this model&rsquo;s generalisation without ever touching the test set.
        </p>

        <h2>More trees, and where they stop helping</h2>
        <CodeOutput label="test accuracy vs number of trees">{`B=  1  test 0.708
B=  5  test 0.791
B= 25  test 0.837
B= 50  test 0.843
B=100  test 0.845
B=300  test 0.847`}</CodeOutput>
        <p>
          One bootstrapped, feature-subsampled tree scores just <strong>70.8%</strong> — <em>weaker</em> than
          the plain single tree, because it&rsquo;s deliberately handicapped. But average five and you&rsquo;re
          at 79%; twenty-five gets 84%; and past a hundred the curve flattens. It never turns back up — the
          hallmark of a forest. <code>n_estimators</code> is a compute budget, not an overfitting risk.
        </p>

        <h2>What the forest keyed on</h2>
        <CodeOutput label="permutation importance (top 6, test set)">{`Elevation                          +0.284
Horizontal_Distance_To_Roadways    +0.073
Horizontal_Distance_To_Fire_Points +0.053
Horizontal_Distance_To_Hydrology   +0.030
Wilderness_Area_0                  +0.019
Vertical_Distance_To_Hydrology     +0.019`}</CodeOutput>
        <p>
          Permutation importance is emphatic: <strong>elevation</strong> dominates — shuffling it alone costs 28
          points — with distances to roads, fire, and water a distant supporting cast. That&rsquo;s ecologically
          sensible (tree species sort strongly by altitude), and it&rsquo;s the kind of stable, readable ranking
          a forest gives you almost for free.
        </p>

        <Callout color={TREES} title={<>The whole track, in one run</>}>
          Bagging (many trees), the bootstrap and OOB (free validation that matched the test score), the plateau
          (more trees only help), and stable importances — every idea from this track showed up in one default{" "}
          <code> RandomForestClassifier</code> call. That is the forest&rsquo;s real selling point: not that it
          hit the highest possible score (a tuned boosted model would edge past 0.847), but that it hit a{" "}
          <em>strong</em> score with almost no effort and no way to shoot yourself in the foot.
        </Callout>

        <Quiz
          title="Can you answer these?"
          accent={TREES}
          questions={[
            {
              q: <>The single tree scored 0.760 and the forest 0.847, with identical greedy trees underneath. What produced the +8.7-point gain?</>,
              options: [
                "Lower bias from deeper trees",
                "Variance reduction — averaging many high-variance trees cancels their independent errors",
                "The forest used a better split criterion",
              ],
              answer: 1,
              explain: <>Bagging leaves bias roughly unchanged and slashes variance. Averaging trees that are jagged in different places yields a smoother, more accurate ensemble.</>,
            },
            {
              q: <>The OOB score was 0.844 and the test score 0.847. Why does that matter?</>,
              options: [
                "It proves the model is overfitting",
                "OOB estimated generalisation from the training data alone, and it matched the held-out test score",
                "It's a coincidence with no use",
              ],
              answer: 1,
              explain: <>Each row is scored by the ~37% of trees that never saw it, giving a validation estimate for free. Its closeness to the test score is the whole point of OOB.</>,
            },
            {
              q: <>Accuracy went 0.708 → 0.791 → 0.837 → 0.847 as trees increased, then flattened. What does the flattening tell you?</>,
              options: [
                "The forest started overfitting",
                "The variance term (1−ρ)/B has been driven near zero — adding trees can't help much more, and won't hurt",
                "max_features was set wrong",
              ],
              answer: 1,
              explain: <>More trees only shrink the (1−ρ)/B variance term toward its ρσ² floor. The curve plateaus and never turns up — n_estimators is a budget, not a risk.</>,
            },
            {
              q: <>Why prefer permutation importance (elevation +0.284) over the forest's built-in MDI here?</>,
              options: [
                "MDI is slower to compute",
                "MDI is biased toward high-cardinality features and computed on training data; permutation is unbiased and measured on held-out data",
                "They always agree, so it doesn't matter",
              ],
              answer: 1,
              explain: <>With 54 features of varying cardinality (many binary soil/wilderness indicators vs continuous distances), MDI's cardinality bias distorts the ranking. Permutation importance on the test set is the trustworthy read.</>,
            },
            {
              q: <>A teammate wants to squeeze out two more accuracy points for a benchmark, interpretability aside. Best next step?</>,
              options: [
                "Add 2000 more trees",
                "Tune a gradient-boosted model — it reduces bias and usually has the higher ceiling",
                "Prune the forest's trees",
              ],
              answer: 1,
              explain: <>More trees only plateau. Boosting attacks bias sequentially and typically tops a forest on tabular data, at the cost of tuning and sequential training — the next track in this family.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/random-forests/when-to-use", label: <>← When to use a random forest</> }}
          next={{ href: "/learn/random-forests/case-b-intervals", label: <>Next up · Prediction intervals on housing →</> }}
        />
      </div>
    </article>
  );
}
