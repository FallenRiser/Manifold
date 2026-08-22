import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "The random forest algorithm — Manifold",
  description:
    "The whole method on one page: bootstrap, grow a tree with random feature subsets at each split, repeat B times, then vote or average. Plus the scikit-learn call and what each core argument does.",
};

const TREES = "var(--c-trees)";

const SCRATCH = `def random_forest(X, y, B=500, m=None):
    n, p = X.shape
    m = m or int(p ** 0.5)          # features considered per split (√p default)
    trees = []
    for _ in range(B):
        idx = resample(range(n), replace=True, n_samples=n)   # bootstrap
        tree = grow_tree(X[idx], y[idx],
                         max_features=m,   # random subset AT EACH split
                         max_depth=None)   # grow deep: low bias
        trees.append(tree)
    return trees

def predict(trees, x):
    votes = [t.predict(x) for t in trees]
    return majority(votes)          # or mean(votes) for regression`;

const LIBRARY = `from sklearn.ensemble import RandomForestClassifier

rf = RandomForestClassifier(
    n_estimators=500,     # B: number of trees — more is never worse, only slower
    max_features="sqrt",  # m: features per split — the decorrelation knob
    max_depth=None,       # grow trees fully (bagging wants low-bias trees)
    n_jobs=-1,            # trees are independent → embarrassingly parallel
    oob_score=True,       # free validation estimate
    random_state=0,
)
rf.fit(X_train, y_train)`;

export default function AlgorithmPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Trees & ensembles", color: TREES }, { label: "Tier 2 · practitioner", color: "var(--c-fundamentals)" }]}
        time="about 6 minutes"
        title={<>The random forest algorithm</>}
        intro={<>
          You now have all three ingredients — bootstrap, random feature subsets, aggregate. This page just
          bolts them together into the algorithm and its scikit-learn call, so the whole method sits in one
          place.
        </>}
      />

      <div className="lesson">
        <h2>The algorithm, start to finish</h2>
        <p>To train a random forest of <strong>B</strong> trees:</p>
        <ol style={ol}>
          <li>Draw a bootstrap sample of the training rows.</li>
          <li>Grow a tree on it — but at <em>every</em> split, restrict the candidate features to a fresh random
            subset of size <strong>m</strong>. Grow deep; don&rsquo;t prune.</li>
          <li>Repeat <strong>B</strong> times, independently.</li>
          <li>Predict by majority vote (classification) or by averaging (regression) across all <strong>B</strong> trees.</li>
        </ol>

        <CodeBlock fromScratch={SCRATCH} withLibrary={LIBRARY} />

        <h2>Voting vs averaging</h2>
        <p>
          The aggregation differs by task, and the choice is not arbitrary. For <strong>regression</strong>, the
          forest averages the leaf means — a genuine variance-reducing mean. For <strong>classification</strong>,
          you can take a hard majority vote, but scikit-learn actually averages each tree&rsquo;s <em>class
          probabilities</em> (the leaf class proportions) and then picks the argmax. Soft-averaging like this is
          usually a touch more accurate and, importantly, gives you calibrated-ish probabilities instead of just
          a label.
        </p>

        <Callout color={TREES} title={<>Independent trees are a feature, not an accident</>}>
          Because each tree is built without reference to the others, the whole forest is{" "}
          <strong>embarrassingly parallel</strong> — <code>n_jobs=-1</code> fits them across all your cores at
          once. This is the sharp contrast with boosting, where trees are built <em>sequentially</em>, each
          fixing the last. Independence is why forests train fast and rarely need babysitting.
        </Callout>

        <h2>The three arguments that matter</h2>
        <ul style={ul}>
          <li><code>n_estimators</code> (<strong>B</strong>) — more trees never <em>hurt</em> accuracy; they
            just cost time and memory, with diminishing returns. Set it as high as you can afford, then stop
            when the OOB curve flattens.</li>
          <li><code>max_features</code> (<strong>m</strong>) — the decorrelation dial from the last page; the one
            worth tuning.</li>
          <li><code>max_depth</code> / <code>min_samples_leaf</code> — usually left unconstrained, because the
            forest controls variance by averaging rather than by pruning individual trees.</li>
        </ul>
        <p>The next chapter tunes these properly. But this call, essentially as-is, is a strong model already.</p>

        <PrevNext
          prev={{ href: "/learn/random-forests/decorrelating-the-trees", label: <>← Decorrelating the trees</> }}
          next={{ href: "/learn/random-forests/feature-importance", label: <>Next up · Feature importance in a forest →</> }}
        />
      </div>
    </article>
  );
}

const ol: React.CSSProperties = { margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const ul: React.CSSProperties = { margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
