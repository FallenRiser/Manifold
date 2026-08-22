import Link from "next/link";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";

export const metadata = {
  title: "Imbalanced & weighted forests — Manifold",
  description:
    "On rare-class problems a forest quietly ignores the minority. Class weights help less than you'd expect — the reliable lever is moving the decision threshold, as a real run on a 5%-positive dataset shows.",
};

const TREES = "var(--c-trees)";

export default function ImbalancedForestsPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Trees & ensembles", color: TREES }, { label: "Tier 2 · practitioner", color: "var(--c-fundamentals)" }]}
        time="about 7 minutes"
        title={<>Imbalanced &amp; weighted forests</>}
        intro={<>
          You saw a single tree ignore a rare class unless it was reweighted. A forest inherits the problem —
          but the fix that works for one tree turns out to be a weak lever for a whole forest. This page is a
          small, honest surprise about what actually moves minority recall.
        </>}
      />

      <div className="lesson">
        <h2>The forest ignores the minority too</h2>
        <p>
          Take a binary problem with 5% positives. A default random forest scores high accuracy and high
          precision, but look at its <strong>recall</strong> — the fraction of true positives it actually
          catches. Here is a real run (20 features, 5% positive, in <code>scripts/forest_cases.py</code>):
        </p>
        <CodeOutput label="recall / precision on the positive class">{`default (threshold 0.5)      recall 0.515   precision 0.820
class_weight = balanced      recall 0.423   precision 0.820
default, threshold = 0.30    recall 0.680   precision 0.667`}</CodeOutput>
        <p>
          The default forest catches barely <strong>half</strong> the positives. And here&rsquo;s the surprise:
          turning on <code>class_weight="balanced"</code> — the standard imbalance remedy — makes recall{" "}
          <em>worse</em>, not better.
        </p>

        <h2>Why class weights underwhelm a forest</h2>
        <p>
          For a <em>single</em> tree, class weights are essential: without them the tree won&rsquo;t even split
          for a rare class, because the impurity drop is negligible. But a forest is different. It already grows
          hundreds of deep trees on bootstrap samples, so the minority <em>does</em> get isolated in leaves, and
          the forest&rsquo;s averaged vote produces a reasonably graded probability. Reweighting the impurity
          shifts those probabilities only slightly, and around the fixed 0.5 threshold that nudge can land
          either way — here, unhelpfully.
        </p>

        <Callout color={TREES} title={<>The lever that actually works: the threshold</>}>
          The forest&rsquo;s probabilities are fine; the <strong>0.5 cutoff</strong> is the problem. Drop the
          decision threshold from 0.5 to 0.3 and recall jumps from 0.515 to <strong>0.680</strong> — you catch
          far more positives, at the cost of precision (0.82 → 0.67). That trade is <em>yours to set</em> from
          the costs of the problem, not the model&rsquo;s to guess. For forests, threshold-moving is the
          first and most reliable imbalance tool, exactly as the{" "}
          <Link href="/learn/evaluation/calibration" style={link}>evaluation pillar</Link> argues.
        </Callout>

        <h2>The full toolkit, ranked for forests</h2>
        <ol style={ol}>
          <li><strong>Move the threshold</strong> (or optimise it on a validation set for your cost matrix).
            Cheapest, most reliable, decouples the model from the operating point.</li>
          <li><strong>Balanced bootstrap</strong> — <code>class_weight="balanced_subsample"</code> reweights
            per bootstrap; sometimes helps more than plain <code>balanced</code>, still modest.</li>
          <li><strong>Resample</strong> — SMOTE / balanced under-sampling before fitting. Can help when the
            minority is extremely rare, but risks overfitting synthetic points.</li>
          <li><strong>Optimise for the right metric</strong> — tune to PR-AUC or recall-at-fixed-precision, not
            accuracy, so the search doesn&rsquo;t chase the majority.</li>
        </ol>

        <CodeBlock
          fromScratch={`from sklearn.ensemble import RandomForestClassifier
import numpy as np

rf = RandomForestClassifier(n_estimators=300, random_state=0).fit(X_train, y_train)

# don't classify at 0.5 — choose the threshold from the cost trade-off
proba = rf.predict_proba(X_val)[:, 1]
# e.g. the smallest threshold that keeps precision >= 0.7:
from sklearn.metrics import precision_recall_curve
prec, rec, thr = precision_recall_curve(y_val, proba)
t = thr[np.argmax(prec[:-1] >= 0.70)]
y_pred = (rf.predict_proba(X_test)[:, 1] >= t).astype(int)`}
        />

        <Quiz
          accent={TREES}
          questions={[
            {
              q: <>Why does <code>class_weight="balanced"</code> help a single tree far more than a forest?</>,
              options: [
                "Forests can't use class weights",
                "A single tree won't split for a rare class without weighting; a forest already isolates the minority across its many deep trees",
                "Forests always predict the majority class",
              ],
              answer: 1,
              explain: <>The impurity drop from isolating a rare class is negligible for one tree, so it needs the weights. A forest's hundreds of bootstrap trees already find the minority, so reweighting barely moves the averaged probability.</>,
            },
            {
              q: <>On the 5%-positive run, what raised recall from 0.515 to 0.680?</>,
              options: [
                "class_weight='balanced'",
                "Lowering the decision threshold from 0.5 to 0.3",
                "Adding more trees",
              ],
              answer: 1,
              explain: <>The probabilities were fine; the 0.5 cutoff was too strict. Moving the threshold to 0.3 caught more positives, trading precision (0.82 → 0.67) — a choice set from the costs.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/random-forests/extra-trees", label: <>← Extremely randomized trees</> }}
          next={{ href: "/learn/random-forests/forest-vs-tree-vs-boosting", label: <>Next up · Forest vs tree vs boosting →</> }}
        />
      </div>
    </article>
  );
}

const ol: React.CSSProperties = { margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
