import Link from "next/link";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "Out-of-bag error — Manifold",
  description:
    "Every tree ignores ~37% of the data. Predict each row using only the trees that never saw it, and you get a cross-validation-quality error estimate for free — no held-out set, no extra fitting.",
};

const TREES = "var(--c-trees)";

export default function OOBPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Trees & ensembles", color: TREES }, { label: "Tier 1 · intuition", color: "var(--c-fundamentals)" }]}
        time="about 6 minutes"
        title={<>Out-of-bag error</>}
        intro={<>
          Bagging leaves about a third of the rows out of each tree&rsquo;s training set. Far from waste, those
          left-out rows are a gift: they let a forest estimate its own test error <em>while it trains</em>, with
          no separate validation set at all.
        </>}
      />

      <div className="lesson">
        <h2>Every row is a test point for some trees</h2>
        <p>
          Fix one training row. It was in the bootstrap sample of some trees, but — since each bootstrap misses
          ~37% of rows — it was <strong>out-of-bag</strong> for roughly 37% of the forest. For those trees, this
          row is effectively unseen data. So we can make an honest prediction for it using <em>only</em> the
          trees that never trained on it:
        </p>
        <MathBlock>{String.raw`\hat{y}_i^{\text{oob}} = \text{aggregate}\big\{\, \hat{f}_b(x_i) : \text{row } i \notin \text{bootstrap}_b \,\big\}`}</MathBlock>
        <p>
          Do this for every row, compare to the true labels, and you have the <strong>out-of-bag (OOB)
          error</strong> — an estimate of generalisation error computed entirely from the training data. With a
          few hundred trees, each row has ~37% of them (dozens) voting on it as unseen data, so the estimate is
          stable.
        </p>

        <Callout color={TREES} title={<>OOB error ≈ cross-validation, for free</>}>
          The OOB estimate is close to what you&rsquo;d get from <M>{String.raw`k`}</M>-fold cross-validation,
          but it costs <em>nothing extra</em>: no separate folds, no refitting. You trained the trees anyway;
          OOB just scores each row on the trees that happened to exclude it. For large datasets where CV is
          expensive, OOB is the practitioner&rsquo;s shortcut.
        </Callout>

        <h2>Using it in practice</h2>
        <p>
          Scikit-learn exposes it with one flag. The OOB score tracks the held-out test score closely — a quick
          sanity check that your forest generalises, and a cheap signal for tuning:
        </p>
        <CodeBlock
          fromScratch={`from sklearn.ensemble import RandomForestClassifier

rf = RandomForestClassifier(n_estimators=500, oob_score=True, random_state=0)
rf.fit(X_train, y_train)

print("OOB score: ", round(rf.oob_score_, 3))   # estimate from training data alone
print("test score:", round(rf.score(X_test, y_test), 3))  # usually very close`}
        />

        <p>
          Two caveats keep it honest. OOB needs <em>enough</em> trees — with only 50, some rows are out-of-bag
          for too few of them and the estimate gets noisy. And like any single estimate it has variance; treat
          it as a good quick read, not a substitute for a proper test set when the stakes are high.
        </p>

        <Quiz
          accent={TREES}
          questions={[
            {
              q: <>What makes an out-of-bag prediction for a row an honest estimate of generalisation?</>,
              options: [
                "It uses all the trees",
                "It uses only the trees whose bootstrap sample never included that row",
                "It refits the model without that row",
              ],
              answer: 1,
              explain: <>For the ~37% of trees that didn't train on a given row, that row is unseen data. Aggregating just those trees' predictions gives a genuine held-out estimate — no refitting needed.</>,
            },
            {
              q: <>Why is OOB error attractive compared with k-fold cross-validation?</>,
              options: [
                "It's always more accurate",
                "It comes essentially for free — no extra folds or refitting, since the trees are already trained",
                "It works for any model, not just forests",
              ],
              answer: 1,
              explain: <>OOB reuses the bootstrap structure you built anyway, so it estimates test error at no extra fitting cost. It's specific to bagged ensembles, and roughly matches CV.</>,
            },
            {
              q: <>Roughly what fraction of the trees vote on each row as out-of-bag data?</>,
              options: ["~10%", "~37%", "~63%"],
              answer: 1,
              explain: <>Each row is missed by (1−1/n)ⁿ → 1/e ≈ 37% of bootstraps, so about 37% of trees treat it as unseen. The other ~63% trained on it (at least once).</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/random-forests/bagging", label: <>← Bagging: training on bootstraps</> }}
          next={{ href: "/learn/random-forests/decorrelating-the-trees", label: <>Next up · Decorrelating the trees →</> }}
        />
      </div>
    </article>
  );
}
