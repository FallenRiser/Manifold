import Link from "next/link";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "Feature importance in a forest — Manifold",
  description:
    "A forest averages importance over hundreds of trees, so its rankings are far more stable than a single tree's — but the impurity bias and the correlated-feature trap remain. Permutation importance is still the measure to trust.",
};

const TREES = "var(--c-trees)";

export default function ForestImportancePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Trees & ensembles", color: TREES }, { label: "Tier 2 · practitioner", color: "var(--c-fundamentals)" }]}
        time="about 6 minutes"
        title={<>Feature importance in a forest</>}
        intro={<>
          A single tree&rsquo;s importances are jumpy — reshuffle the data and they lurch. A forest averages
          over hundreds of trees, so its rankings are one of the most <em>stable</em> importance signals in ML.
          Stable, but not free of traps — the same two that dogged a single tree.
        </>}
      />

      <div className="lesson">
        <h2>Averaging steadies the ranking</h2>
        <p>
          The forest&rsquo;s impurity-based importance (MDI) is just the single-tree measure —{" "}
          <Link href="/learn/decision-trees/feature-importance" style={link}>total impurity decrease from a
          feature&rsquo;s splits</Link> — averaged over every tree in the forest. Because it&rsquo;s an average
          of hundreds of noisy estimates, it&rsquo;s far steadier than any one tree&rsquo;s, which is a real
          reason forests are a favourite for exploratory feature ranking.
        </p>
        <p>But averaging doesn&rsquo;t cure the two biases you already know:</p>

        <Callout color={TREES} title={<>The impurity bias survives averaging</>}>
          MDI still <strong>favours high-cardinality features</strong> — continuous variables and
          many-level categoricals win more splits by sheer chance, in every tree, so averaging just makes a
          biased estimate <em>consistently</em> biased. It&rsquo;s still computed on training data, so it still
          rewards overfitting. Averaging fixes variance, not bias.
        </Callout>

        <h2>The correlated-feature trap, sharpened</h2>
        <p>
          Forests have their <em>own</em> twist on the correlated-feature problem, and it comes straight from
          the random-subspace trick. When two features are correlated, the feature subsampling hands each tree
          sometimes one, sometimes the other — so the importance gets <strong>split between the pair</strong>.
          Two features that are jointly essential can each look only moderately important, and either one alone can
          look droppable even though losing both would wreck the model. Never read a forest&rsquo;s importances
          as &ldquo;how much each feature matters&rdquo; without checking for correlated groups first.
        </p>

        <h2>Permutation importance, still the one to trust</h2>
        <p>
          As with a single tree, the trustworthy measure is <strong>permutation importance</strong> on held-out
          data: shuffle a column, measure the forest&rsquo;s accuracy drop. It&rsquo;s unbiased by cardinality
          and measured where it counts. A forest makes it even more reliable, because the model being probed is
          itself low-variance:
        </p>

        <CodeBlock
          fromScratch={`from sklearn.inspection import permutation_importance
import numpy as np

rf.fit(X_train, y_train)

# built-in MDI: stable across a forest, but cardinality-biased and train-based
mdi = rf.feature_importances_

# permutation importance on held-out data — trust this one
perm = permutation_importance(rf, X_test, y_test, n_repeats=20, random_state=0)
for j in np.argsort(perm.importances_mean)[::-1]:
    print(f"{feature_names[j]:20s} {perm.importances_mean[j]:.3f}")`}
        />

        <Quiz
          accent={TREES}
          questions={[
            {
              q: <>Why is a random forest's feature importance more <em>stable</em> than a single tree's?</>,
              options: [
                "It uses permutation by default",
                "It averages the importance over hundreds of trees, cancelling the per-tree noise",
                "It ignores high-cardinality features",
              ],
              answer: 1,
              explain: <>Averaging many noisy per-tree importances yields a low-variance estimate. That's why forests are good for ranking features — though the impurity bias is unaffected.</>,
            },
            {
              q: <>Two strongly correlated features are both important. How does a forest's MDI tend to report them?</>,
              options: [
                "One gets all the importance, the other zero",
                "The importance is split between them, so each looks less important than the pair really is",
                "Both get the full importance",
              ],
              answer: 1,
              explain: <>Feature subsampling gives trees sometimes one twin, sometimes the other, splitting the credit. Each can look droppable even though losing both is costly — check correlated groups before trusting the ranking.</>,
            },
            {
              q: <>Which importance measure should you trust for a forest?</>,
              options: [
                "Built-in MDI, because it's averaged",
                "Permutation importance on held-out data",
                "The depth of each feature's first split",
              ],
              answer: 1,
              explain: <>Permutation importance is unbiased by cardinality and measured on unseen data. The averaged MDI is stable but still cardinality-biased and train-based.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/random-forests/the-algorithm", label: <>← The random forest algorithm</> }}
          next={{ href: "/learn/random-forests/hyperparameters", label: <>Next up · The hyperparameters →</> }}
        />
      </div>
    </article>
  );
}

const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
