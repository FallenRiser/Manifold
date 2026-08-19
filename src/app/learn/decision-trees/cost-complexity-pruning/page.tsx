import Link from "next/link";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "Cost-complexity pruning — Manifold",
  description:
    "Grow the tree fully, then cut back the branches that don't pay for themselves. Cost-complexity pruning charges a price α per leaf, producing a nested sequence of subtrees you choose among by cross-validation.",
};

const TREES = "var(--c-trees)";

export default function CostComplexityPruningPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Trees & ensembles", color: TREES }, { label: "Tier 2 · practitioner", color: "var(--c-fundamentals)" }]}
        time="about 8 minutes"
        title={<>Cost-complexity pruning</>}
        intro={<>
          Post-pruning takes the opposite bet from early stopping: let the tree overgrow, then charge it rent.
          Any branch that doesn&rsquo;t reduce error by more than its cost gets cut. Because the whole tree
          already exists, this never suffers the horizon effect — it can see what a branch was building toward.
        </>}
      />

      <div className="lesson">
        <h2>Charge rent per leaf</h2>
        <p>
          Grow the tree out (call it <M>{String.raw`T_0`}</M>). Now score any subtree <M>{String.raw`T`}</M>
          not just by its error but by its error <em>plus a penalty for size</em>:
        </p>
        <MathBlock>{String.raw`R_\alpha(T) = R(T) + \alpha\,|\widetilde{T}|`}</MathBlock>
        <p>
          Here <M>{String.raw`R(T)`}</M> is the training error (misclassification rate, or total squared error
          for regression), <M>{String.raw`|\widetilde{T}|`}</M> is the number of leaves, and{" "}
          <M>{String.raw`\alpha \ge 0`}</M> is the price of a leaf. This is exactly the shape of a regularised
          loss — fit quality plus a complexity penalty — with <M>{String.raw`\alpha`}</M> playing the role that{" "}
          <M>{String.raw`\lambda`}</M> plays in ridge regression. A leaf now has to <em>earn</em> its place by
          cutting error more than <M>{String.raw`\alpha`}</M>.
        </p>

        <h2>One knob sweeps out a whole family of trees</h2>
        <p>
          Watch what happens as <M>{String.raw`\alpha`}</M> rises from zero:
        </p>
        <ul style={ul}>
          <li>At <M>{String.raw`\alpha = 0`}</M>, leaves are free, so the full tree <M>{String.raw`T_0`}</M> wins.</li>
          <li>As <M>{String.raw`\alpha`}</M> grows, the <strong>weakest link</strong> — the subtree whose leaves
            buy the least error reduction per unit size — becomes not worth its rent and collapses to a single
            leaf.</li>
          <li>Keep raising <M>{String.raw`\alpha`}</M> and branches fall in a definite order, producing a{" "}
            <strong>nested sequence</strong> <M>{String.raw`T_0 \supset T_1 \supset \cdots \supset \{\text{root}\}`}</M>.</li>
          <li>At large enough <M>{String.raw`\alpha`}</M>, even the first split isn&rsquo;t worth it and the tree
            is just the root — predict the overall majority.</li>
        </ul>
        <p>
          This is <strong>weakest-link pruning</strong>. The elegant part: although <M>{String.raw`\alpha`}</M>
          is continuous, it produces only finitely many distinct trees, and each is optimal for a whole range
          of <M>{String.raw`\alpha`}</M>. So pruning reduces to choosing one tree from a short list.
        </p>

        <h2>Pick α by cross-validation</h2>
        <p>
          Which subtree generalises best isn&rsquo;t a training-set question, so we answer it with
          cross-validation: score each <M>{String.raw`\alpha`}</M> in the sequence on held-out folds and keep
          the one with the best validation error (often the smallest tree within one standard error of the
          best — the &ldquo;1-SE rule&rdquo;). In scikit-learn the whole path is one call:
        </p>

        <CodeBlock
          fromScratch={`from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import cross_val_score
import numpy as np

# 1. get the sequence of effective alphas from the weakest-link path
full = DecisionTreeClassifier(random_state=0).fit(X_train, y_train)
alphas = full.cost_complexity_pruning_path(X_train, y_train).ccp_alphas

# 2. cross-validate a pruned tree at each alpha, keep the best
scores = [
    cross_val_score(
        DecisionTreeClassifier(random_state=0, ccp_alpha=a),
        X_train, y_train, cv=5
    ).mean()
    for a in alphas
]
best_alpha = alphas[int(np.argmax(scores))]
final = DecisionTreeClassifier(random_state=0, ccp_alpha=best_alpha).fit(X_train, y_train)`}
        />

        <Callout color={TREES} title={<>Why post-pruning beats early stopping — when it matters</>}>
          Because the full tree is built first, weakest-link pruning judges a branch by everything it grew
          into, sidestepping the horizon effect entirely. The cost is compute: you grow a big tree and
          cross-validate a path of subtrees. In practice a good <code>max_depth</code> often gets you 95% of
          the way for a fraction of the work — reach for cost-complexity pruning when you want the last bit of
          accuracy from a <em>single</em> tree, and remember that an ensemble usually makes the whole question
          moot.
        </Callout>

        <Quiz
          accent={TREES}
          questions={[
            {
              q: <>In <M>{String.raw`R_\alpha(T) = R(T) + \alpha|\widetilde{T}|`}</M>, what does raising α do?</>,
              options: [
                "Grows a larger tree",
                "Raises the price of each leaf, so more branches get pruned and the tree shrinks",
                "Has no effect on tree size",
              ],
              answer: 1,
              explain: <>α is the cost per leaf. Larger α means leaves must justify themselves with more error reduction, so weak branches collapse and the tree gets smaller — exactly like λ shrinking a regression model.</>,
            },
            {
              q: <>Why doesn't cost-complexity pruning suffer the horizon effect that limits pre-pruning?</>,
              options: [
                "It never splits weak nodes",
                "It grows the full tree first, so it judges each branch by everything it grew into",
                "It uses entropy instead of Gini",
              ],
              answer: 1,
              explain: <>Post-pruning sees the complete tree before cutting, so a weak split that enabled a strong descendant is evaluated with that descendant in view — the one-step blindness of early stopping is gone.</>,
            },
            {
              q: <>How is the final α chosen?</>,
              options: [
                "The α that minimises training error",
                "By cross-validation — the α whose pruned tree generalises best on held-out folds",
                "Always α = 0",
              ],
              answer: 1,
              explain: <>Training error always favours the biggest tree (α = 0), so it can't choose α. Cross-validation picks the subtree in the sequence with the best held-out performance.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/decision-trees/pre-pruning", label: <>← Pre-pruning: the stopping knobs</> }}
          next={{ href: "/learn/decision-trees/why-greedy", label: <>Next up · Why greedy? →</> }}
        />
      </div>
    </article>
  );
}

const ul: React.CSSProperties = { margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
