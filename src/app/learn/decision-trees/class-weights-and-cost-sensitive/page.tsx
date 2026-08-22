import Link from "next/link";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "Class weights & cost-sensitive trees — Manifold",
  description:
    "When one class is rare, or one mistake costs more than another, a tree needs to be told. Class weights bend the impurity calculation so minority errors count; cost matrices and threshold-moving handle asymmetric costs.",
};

const TREES = "var(--c-trees)";

export default function CostSensitivePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Trees & ensembles", color: TREES }, { label: "Tier 2 · practitioner", color: "var(--c-fundamentals)" }]}
        time="about 7 minutes"
        title={<>Class weights &amp; cost-sensitive trees</>}
        intro={<>
          A tree trained to minimise impurity treats every row as equally important — which is wrong whenever
          one class is rare or one kind of mistake hurts more than another. Fraud, disease screening, defect
          detection: the whole point is the minority, and by default the tree barely notices it.
        </>}
      />

      <div className="lesson">
        <h2>Why imbalance breaks a plain tree</h2>
        <p>
          Suppose 2% of transactions are fraud. A tree minimising Gini can score 98% accuracy by predicting
          &ldquo;not fraud&rdquo; everywhere — every leaf is 98% pure, impurity is already low, and there&rsquo;s
          little gain in splitting to isolate the rare positives. The model is accurate and useless. The
          impurity objective simply doesn&rsquo;t care about the class you care about, because the class is
          small.
        </p>

        <h2>Class weights: bend the impurity</h2>
        <p>
          The cleanest fix is to tell the tree that minority rows count for more. <strong>Class weights</strong>{" "}
          multiply each class&rsquo;s contribution to the impurity and the leaf counts, so a handful of weighted
          minority points can outweigh a mass of majority ones. A split that isolates fraud now produces a real
          weighted-impurity drop, so the tree bothers to make it. In scikit-learn it&rsquo;s one argument:
        </p>

        <CodeBlock
          fromScratch={`from sklearn.tree import DecisionTreeClassifier

# 'balanced' sets weight_c = n_samples / (n_classes * count_c),
# i.e. inversely proportional to class frequency — rare classes weigh more.
clf = DecisionTreeClassifier(class_weight="balanced", random_state=0)

# or set costs by hand: make missing a positive 10x worse than a false alarm
clf = DecisionTreeClassifier(class_weight={0: 1, 1: 10}, random_state=0)

clf.fit(X_train, y_train)`}
        />

        <p>
          <code>class_weight="balanced"</code> weights each class inversely to its frequency — a sensible
          default for imbalance. A manual dictionary lets you encode a genuine <strong>cost matrix</strong>:
          if a missed fraud costs ten times a false alarm, weight the positive class ten-fold and the tree will
          trade nine false alarms to catch one more fraud.
        </p>

        <h2>Three levers, not one</h2>
        <p>Weighting is one of three ways to make a tree cost-aware, and they compose:</p>
        <ul style={ul}>
          <li><strong>Reweight</strong> (<code>class_weight</code> / <code>sample_weight</code>) — change how
            much each row counts <em>during</em> training. Cheap, principled, no data thrown away or invented.</li>
          <li><strong>Resample</strong> — oversample the minority (SMOTE) or undersample the majority{" "}
            <em> before</em> training. Sometimes helps, but oversampling can overfit and undersampling discards
            data; weighting is usually the tidier first move.</li>
          <li><strong>Move the threshold</strong> — train normally, then classify by comparing the
            predicted probability to a threshold chosen from the <Link href="/learn/evaluation" style={link}>cost
            trade-off</Link>, not the default 0.5. Often the simplest lever of all, and it decouples the model
            from the operating point.</li>
        </ul>

        <Callout color={TREES} title={<>Weighting changes the tree; thresholding changes the decision</>}>
          A subtle but important distinction. <strong>Class weights change what tree gets built</strong> —
          different splits, because the objective changed. <strong>Threshold-moving leaves the tree alone</strong>{" "}
          and only changes how you read its probabilities. If you&rsquo;re unsure what the costs are yet, train
          an honest weighted-or-unweighted model and tune the threshold later; if the minority is so rare the
          tree won&rsquo;t split for it at all, you need the weights to change the tree itself. This connects
          straight to the <Link href="/learn/evaluation" style={link}>evaluation pillar</Link>, where choosing
          the operating point is the whole subject.
        </Callout>

        <Quiz
          accent={TREES}
          questions={[
            {
              q: <>With 2% positives, a default tree predicts the negative class everywhere and scores 98%. Why?</>,
              options: [
                "The tree is broken",
                "Every leaf is already ~98% pure, so impurity is low and there's little gain in isolating the rare class",
                "Gini can't handle two classes",
              ],
              answer: 1,
              explain: <>The impurity objective is dominated by the majority. Without weighting, splitting to find the 2% barely lowers impurity, so the tree doesn't bother — accurate and useless.</>,
            },
            {
              q: <>What does <code>class_weight="balanced"</code> actually do?</>,
              options: [
                "Deletes majority-class rows",
                "Weights each class inversely to its frequency, so minority rows contribute more to impurity and leaf counts",
                "Sets the decision threshold to the class ratio",
              ],
              answer: 1,
              explain: <>It scales each class's contribution by n/(n_classes·count), making rare classes heavy. A split that isolates them now yields a real weighted-impurity drop.</>,
            },
            {
              q: <>You're unsure of the exact misclassification costs yet. What's the most flexible first move?</>,
              options: [
                "Permanently oversample the minority with SMOTE",
                "Train a reasonable model and tune the decision threshold later — it decouples the model from the operating point",
                "Set class_weight to a random large number",
              ],
              answer: 1,
              explain: <>Threshold-moving leaves the trained model untouched and lets you pick the operating point once costs are known. Reserve weighting for when the class is so rare the tree won't split for it at all.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/decision-trees/oblique-and-multivariate-trees", label: <>← Oblique & multivariate trees</> }}
          next={{ href: "/learn/decision-trees/why-greedy", label: <>Next up · Why greedy? →</> }}
        />
      </div>
    </article>
  );
}

const ul: React.CSSProperties = { margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
