import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Growing the whole tree — Manifold",
  description:
    "One split is a stump. Apply the best-split rule recursively — split, then split each child, until a stopping rule fires — and you have the greedy CART algorithm that builds the whole tree.",
};

const TREES = "var(--c-trees)";

const FROM_SCRATCH = `def grow(rows, depth=0, max_depth=None):
    # a leaf: everyone here gets the majority label
    if is_pure(rows) or depth == max_depth or len(rows) < 2:
        return Leaf(prediction=majority_label(rows))

    # try every feature and every threshold; keep the split with most gain
    best = max(all_candidate_splits(rows), key=information_gain, default=None)
    if best is None or best.gain <= 0:
        return Leaf(prediction=majority_label(rows))

    left_rows, right_rows = partition(rows, best)
    return Node(
        feature=best.feature,
        threshold=best.threshold,
        left=grow(left_rows,  depth + 1, max_depth),   # recurse …
        right=grow(right_rows, depth + 1, max_depth),  # … on each side
    )

def predict(node, x):
    while not node.is_leaf:
        node = node.left if x[node.feature] <= node.threshold else node.right
    return node.prediction`;

const WITH_LIBRARY = `from sklearn.tree import DecisionTreeClassifier

# criterion='gini' is the default; 'entropy' is the other classic choice
tree = DecisionTreeClassifier(criterion="gini", max_depth=None)
tree.fit(X_train, y_train)

print(tree.get_n_leaves(), "leaves,  depth", tree.get_depth())
print("train:", tree.score(X_train, y_train))
print("test: ", tree.score(X_test,  y_test))`;

export default function GrowingTheTreePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Trees & ensembles", color: TREES }, { label: "Tier 1 · intuition", color: "var(--c-fundamentals)" }]}
        time="about 7 minutes"
        title={<>Growing the whole tree</>}
        intro={<>
          One split gives you a <em>stump</em> — two leaves, one question. To get a tree, you apply the same
          best-split rule again inside each child, and again inside <em>their</em> children, until there&rsquo;s
          nothing useful left to ask. That recursion is the entire training algorithm.
        </>}
      />

      <div className="lesson">
        <h2>Recursion: the same move, all the way down</h2>
        <p>
          You already have the hard part — the rule for picking the single best split. Growing a tree just
          calls that rule over and over:
        </p>
        <ol style={ol}>
          <li>At the current group of rows, find the split with the most information gain.</li>
          <li>Partition the rows into the two children it defines.</li>
          <li>Repeat step 1 on each child.</li>
          <li>Stop when a group is pure, too small, or too deep — and make it a leaf that predicts its majority label.</li>
        </ol>
        <p>
          This is <strong>CART</strong> — Classification And Regression Trees — and it&rsquo;s almost exactly
          this short:
        </p>

        <CodeBlock fromScratch={FROM_SCRATCH} withLibrary={WITH_LIBRARY} />

        <p>
          Prediction is even simpler: drop a new point in at the root and let each node&rsquo;s question send
          it left or right until it reaches a leaf. The leaf&rsquo;s stored answer is the prediction. No
          arithmetic, no weights — just a walk down a flowchart.
        </p>

        <h2>Greedy, and proud of it — mostly</h2>
        <p>
          Notice what the algorithm does <em>not</em> do: it never looks ahead. At each node it grabs the
          locally best split and commits, without asking whether a slightly worse split now might unlock a
          much better one two levels down. This is a <strong>greedy</strong> strategy, and it&rsquo;s a
          genuine compromise — occasionally a greedy tree misses a simpler structure that a look-ahead search
          would find. We settle for greedy because finding the truly optimal tree is computationally
          intractable, a point we make precise in <Link href="/learn/decision-trees/why-greedy" style={link}>Why
          greedy?</Link>
        </p>

        <h2>The stopping rules are the whole ballgame</h2>
        <p>
          Look again at the base case in the code — <code>is_pure</code>, <code>max_depth</code>,{" "}
          <code>len(rows) &lt; 2</code>. Without a stopping rule, the recursion doesn&rsquo;t stop until every
          leaf is pure, which on real (noisy) data means one leaf per point: a tree that has simply
          memorised the training set. You saw this on the <Link href="/learn/decision-trees" style={link}>opening
          page</Link> — crank the depth and train accuracy hits 100% while test accuracy slips. Choosing
          where to stop is so important it gets its own <Link href="/learn/decision-trees/how-trees-overfit" style={link}>chapter</Link>.
        </p>

        <Callout color={TREES} title={<>The throughline</>}>
          A tree is still <em>form + loss + optimiser</em>, just an unusual one. The <strong>form</strong> is a
          partition into boxes; the <strong>loss</strong> is node impurity; the <strong>optimiser</strong> is
          greedy recursive splitting rather than gradient descent. Same skeleton as every other model on
          Manifold — the optimiser is just combinatorial instead of continuous.
        </Callout>

        <Quiz
          accent={TREES}
          questions={[
            {
              q: <>Why does CART use a greedy split at each node instead of searching for the globally best tree?</>,
              options: [
                "Greedy always finds the optimal tree anyway",
                "Finding the globally optimal tree is computationally intractable, so greedy is a practical compromise",
                "Greedy trees can't overfit",
              ],
              answer: 1,
              explain: <>Optimal tree construction is NP-hard. Greedy top-down splitting is fast and usually good, at the cost of occasionally missing a structure a look-ahead search would catch.</>,
            },
            {
              q: <>With no stopping rule, what does a tree grown on noisy data converge to?</>,
              options: [
                "A stump with two leaves",
                "One pure leaf per training point — a memorised training set",
                "The linear decision boundary",
              ],
              answer: 1,
              explain: <>It keeps splitting until every leaf is pure. On noisy data that means isolating each point, giving 100% train accuracy and poor generalisation — the overfitting you'll learn to prevent.</>,
            },
            {
              q: <>How does a trained tree make a prediction for a new point?</>,
              options: [
                "It averages all the leaves",
                "It walks the point down the questions from the root to a leaf and returns that leaf's stored answer",
                "It re-runs the training algorithm",
              ],
              answer: 1,
              explain: <>Prediction is a single root-to-leaf walk — each node routes the point left or right — ending at a leaf whose majority label (or mean) is the answer. Fast and fully interpretable.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/decision-trees/what-makes-a-good-split", label: <>← What makes a good split?</> }}
          next={{ href: "/learn/decision-trees/impurity-measures", label: <>Next up · Gini, entropy & information gain →</> }}
        />
      </div>
    </article>
  );
}

const ol: React.CSSProperties = { margin: "0 0 14px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
