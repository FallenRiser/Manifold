import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { ModelAnatomy } from "@/components/ModelAnatomy";
import { AnalystQuestion, TransferBox, PlaybookRule } from "@/components/capstone/pedagogy";

export const metadata = {
  title: "Random forest — averaging away the variance — Manifold",
  description:
    "A single tree is high-variance; a forest averages hundreds of decorrelated trees to cut that variance without adding bias. On the honest grouped split it lifts PR-AUC to 0.478 — the best model so far, and a real +0.043 over the tuned tree. The random-split 0.566 was leakage, and we don't count it.",
};

const SPACE = "var(--c-space)";

export default function RandomForestPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: SPACE }, { label: "Act 5 · Model, rung by rung", color: "var(--c-metrics)" }]}
        time="about 8 minutes"
        title={<>Random forest — averaging away the variance</>}
        intro={<>
          The single tree bent to reach 0.435, but a single tree is fragile — resample the data and you get a
          noticeably different tree. A random forest keeps the flexibility and attacks the fragility directly, by growing
          hundreds of deliberately different trees and averaging their votes.
        </>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <AnalystQuestion>
          Does averaging many flexible models add <em>real, honest</em> lift — or just a bigger, more confident version
          of the same overfitting?
        </AnalystQuestion>

        <ModelAnatomy
          accent={SPACE}
          form={<>average the votes of many trees, each grown deep on a bootstrap sample</>}
          loss={<>each tree greedy on Gini; the forest reduces <em>variance</em> by averaging</>}
          optimiser={<>embarrassingly parallel — grow trees independently</>}
        />

        <h2>The move: reduce variance without adding bias</h2>
        <p>
          The tree&rsquo;s problem was variance: high capacity fit to one particular training sample. Averaging is the
          classic cure — the mean of many noisy-but-unbiased estimates is far less noisy. A forest makes its trees
          <em>differ</em> on purpose (each sees a bootstrap resample, and each split considers only a random subset of
          features) so their errors are less correlated, and averaging cancels more of them. Crucially, each tree stays
          low-bias (grown deep), so averaging cuts variance <em>without</em> trading away the signal the single tree
          found.
        </p>
        <CodeBlock fromScratch={code} />
        <CodeOutput>{`random forest (300 trees, balanced) — grouped split
  ROC-AUC : 0.905
  PR-AUC  : 0.478        <- best so far

for comparison, on the HONEST grouped harness:
  size rule      0.289
  logistic       0.309
  tuned tree     0.435
  random forest  0.478   (+0.043 over the tree)`}</CodeOutput>

        <Callout color={SPACE} title={<>Real lift — and the number we refuse to quote</>}>
          0.478 is the best yet: <strong>+0.043</strong> over the tuned tree and <strong>+0.189</strong> over the size
          rule — averaging bought a genuine improvement. But recall Act 4: the <em>same</em> forest scored{" "}
          <strong>0.566</strong> under a random split. That 0.088 was pure object-memorisation leaking across the split,
          and we do not count it. The discipline of the locked harness is what lets us report 0.478 as real and discard
          0.566 as a mirage — the number a less careful analyst would have proudly shipped.
        </Callout>

        <h2>A first look at what it used — with a warning</h2>
        <p>
          A forest can report which features it leaned on. It&rsquo;s a useful sanity check, but the default
          (impurity-based) version comes with a bias we must name.
        </p>
        <CodeBlock fromScratch={code2} />
        <CodeOutput>{`impurity importances
  absolute_magnitude   0.642     <- size dominates, as expected
  relative_velocity    0.195
  miss_distance        0.163`}</CodeOutput>
        <p>
          Size dominating (0.642) is reassuring — it matches everything we know. But notice the forest ranks{" "}
          <code>relative_velocity</code> (0.195) <em>above</em> <code>miss_distance</code> (0.163), the opposite of the
          conditional-AUC finding in Act 3. That&rsquo;s not necessarily the model disagreeing with reality; it&rsquo;s a
          known <strong>bias of impurity importance toward high-cardinality features</strong> — velocity takes many more
          distinct values than miss distance, giving it more chances to be chosen for a split. We flag the discrepancy
          now and resolve it properly with a less biased method (permutation importance) when we interpret the final
          model in Act 6. For now: trust the forest&rsquo;s <em>score</em>, hold its <em>importances</em> loosely.
        </p>

        <TransferBox>
          When a single flexible model is high-variance, bagging it into an ensemble is a reliable, low-risk lift — and
          it needs almost no tuning. But always re-confirm the gain on the honest harness (a forest is exactly the model
          type that leakage flatters most), and treat built-in feature importances with suspicion, especially with
          mixed-cardinality features. A convenient explanation is not automatically a correct one.
        </TransferBox>

        <PlaybookRule n={15}>
          Bag a high-variance model into an <strong>ensemble to cut variance</strong>, then <strong>re-confirm the lift
          on the honest harness</strong> — the flexible models are the ones leakage flatters, so an ensemble&rsquo;s gain
          must be checked, not assumed.
        </PlaybookRule>

        <PrevNext
          prev={{ href: "/learn/asteroid-hazard-capstone/decision-tree", label: <>← Decision tree</> }}
          next={{ href: "/learn/asteroid-hazard-capstone/gradient-boosting", label: <>Next up · Gradient boosting →</> }}
        />
      </div>
    </article>
  );
}

const code = `from sklearn.ensemble import RandomForestClassifier

rf = RandomForestClassifier(n_estimators=300, class_weight="balanced",
                            n_jobs=-1, random_state=0).fit(Xtr, ytr)

p = rf.predict_proba(Xte)[:, 1]
print("ROC-AUC:", roc_auc_score(yte, p))
print("PR-AUC :", average_precision_score(yte, p))`;

const code2 = `for f, imp in zip(features, rf.feature_importances_):
    print(f, round(imp, 3))`;
