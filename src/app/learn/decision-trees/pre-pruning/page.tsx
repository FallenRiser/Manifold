import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "Pre-pruning: the stopping knobs — Manifold",
  description:
    "The hyperparameters that stop a tree growing before it memorises: max_depth, min_samples_leaf, min_samples_split, max_leaf_nodes, min_impurity_decrease — what each controls, and the horizon effect that limits them.",
};

const TREES = "var(--c-trees)";

const KNOBS: [string, string, string][] = [
  ["max_depth", "Hard cap on levels from root to leaf.", "The bluntest, most effective single dial. Small values (3–8) are the usual sweet spot."],
  ["min_samples_leaf", "A leaf must contain at least this many points.", "Forces each prediction to rest on real support, not one lucky point. Raising it smooths the model."],
  ["min_samples_split", "A node needs at least this many points to be eligible to split.", "Stops splitting tiny nodes. Related to min_samples_leaf but acts on the parent."],
  ["max_leaf_nodes", "Cap on the total number of leaves.", "Grows best-first and stops at a budget — a direct handle on model size."],
  ["min_impurity_decrease", "A split must reduce impurity by at least this much to happen.", "Refuses splits that barely help. Principled, but hard to set — the threshold isn't intuitive."],
];

export default function PrePruningPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Trees & ensembles", color: TREES }, { label: "Tier 2 · practitioner", color: "var(--c-fundamentals)" }]}
        time="about 7 minutes"
        title={<>Pre-pruning: the stopping knobs</>}
        intro={<>
          The simplest way to keep a tree from memorising is to not let it grow that far. Pre-pruning (also
          called early stopping) adds a rule to the base case of the recursion: stop splitting once some
          budget is spent. A handful of hyperparameters set that budget.
        </>}
      />

      <div className="lesson">
        <h2>The five knobs</h2>
        <p>
          Every one of these turns a split that CART <em>would</em> have made into a leaf. They overlap — you
          rarely tune all five — but each expresses the &ldquo;stop early&rdquo; idea slightly differently
          (names follow scikit-learn):
        </p>

        <div style={{ overflowX: "auto", margin: "1.3rem 0" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13.5, minWidth: 520 }}>
            <thead>
              <tr>
                <th style={th}>Hyperparameter</th>
                <th style={th}>What it does</th>
                <th style={th}>In practice</th>
              </tr>
            </thead>
            <tbody>
              {KNOBS.map(([name, does, note]) => (
                <tr key={name}>
                  <td style={{ ...td, fontFamily: "var(--font-geist-mono)", color: "var(--c-trees)", whiteSpace: "nowrap" }}>{name}</td>
                  <td style={td}>{does}</td>
                  <td style={{ ...td, color: "var(--muted)" }}>{note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p>
          In scikit-learn they&rsquo;re constructor arguments, and you choose them the way you choose any
          hyperparameter — by cross-validated search, not by eye:
        </p>

        <CodeBlock
          fromScratch={`from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import GridSearchCV

grid = GridSearchCV(
    DecisionTreeClassifier(random_state=0),
    {
        "max_depth":        [3, 4, 5, 6, 8, None],
        "min_samples_leaf": [1, 5, 10, 20],
    },
    cv=5, scoring="accuracy",
)
grid.fit(X_train, y_train)
print(grid.best_params_)          # e.g. {'max_depth': 4, 'min_samples_leaf': 10}
print(grid.best_score_)`}
        />

        <h2>The catch: the horizon effect</h2>
        <p>
          Pre-pruning has a real blind spot. It decides whether to split <em>now</em> using only the gain
          available <em>now</em> — but some of the best structure only appears one level deeper. The
          checkerboard from the opening page is the perfect example: the first split barely improves purity
          (each half is still 50/50), so a strict <code>min_impurity_decrease</code> would refuse it and stop
          the tree dead — even though splitting once more would have cleanly separated the quadrants.
        </p>
        <p>
          This is the <strong>horizon effect</strong>: a weak split that unlocks a strong one looks worthless
          from a one-step view. Depth-based limits (<code>max_depth</code>, <code>max_leaf_nodes</code>) dodge
          it because they don&rsquo;t judge individual splits on gain — they just cap total size — which is
          part of why <code>max_depth</code> is the pre-pruning knob people reach for first.
        </p>

        <Callout color={TREES} title={<>Pre- vs post-pruning</>}>
          Pre-pruning is fast and usually enough, but the horizon effect means it can stop too early. The
          alternative — grow the whole tree, <em>then</em> cut back — never suffers the horizon effect,
          because it sees the deeper structure before deciding. That&rsquo;s{" "}
          <Link href="/learn/decision-trees/cost-complexity-pruning" style={link}>cost-complexity pruning</Link>,
          next.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/decision-trees/how-trees-overfit", label: <>← How a tree overfits</> }}
          next={{ href: "/learn/decision-trees/cost-complexity-pruning", label: <>Next up · Cost-complexity pruning →</> }}
        />
      </div>
    </article>
  );
}

const th: React.CSSProperties = { textAlign: "left", padding: "8px 12px", borderBottom: "1.5px solid var(--border-strong)", color: "var(--ink)", fontWeight: 600, fontSize: 12.5 };
const td: React.CSSProperties = { padding: "9px 12px", borderBottom: "1px solid var(--border)", color: "var(--ink)", verticalAlign: "top", lineHeight: 1.55 };
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
