import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { KNN_SETUP } from "@/lib/runtimeSetup";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "k-d trees — Manifold",
  description:
    "The k-d tree carves feature space into axis-aligned boxes so a query can skip whole regions instead of scanning every point. How it builds, how it prunes with backtracking — and why it collapses in high dimensions.",
};

// A 2-D k-d tree partition, drawn to integer coordinates. Root = vertical split,
// then alternating horizontal / vertical splits, thinner with depth.
const SPLITS = [
  { x1: 150, y1: 20, x2: 150, y2: 200, w: 2.6 }, // root (vertical)
  { x1: 20, y1: 100, x2: 150, y2: 100, w: 1.7 }, // depth 1 left (horizontal)
  { x1: 150, y1: 120, x2: 280, y2: 120, w: 1.7 }, // depth 1 right
  { x1: 85, y1: 20, x2: 85, y2: 100, w: 1, d: true }, // depth 2
  { x1: 70, y1: 100, x2: 70, y2: 200, w: 1, d: true },
  { x1: 215, y1: 20, x2: 215, y2: 120, w: 1, d: true },
  { x1: 210, y1: 120, x2: 210, y2: 200, w: 1, d: true },
];
const PTS = [[55, 60], [120, 50], [45, 150], [110, 160], [185, 70], [250, 55], [180, 165], [250, 160]];
const QUERY = { x: 128, y: 44 };

export default function KdTreesPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: "var(--c-classification)" }, { label: "Tier 2 · scaling the search", color: "var(--c-classification)" }]}
        time="about 8 minutes"
        title={<>k-d trees</>}
        intro={<>
          The first real speed-up: pre-sort the training points into a tree of axis-aligned boxes. A query
        then homes in on its own box and can prove that entire branches of the tree are too far to matter —
        skipping them without measuring a single point inside.
        </>}
      />

      <div className="lesson">
        <h2>Build: recursively split on the median</h2>
        <p>
          A k-d tree (&ldquo;k-dimensional&rdquo;) is a binary tree that partitions space. At each node you pick an
          axis, split the points at their <strong>median</strong> along it, and recurse — cycling through the
          axes (x, then y, then back to x, …) as you go down. Splitting at the median keeps the tree balanced,
          giving an <M>{String.raw`O(n \log n)`}</M> build and <M>{String.raw`O(\log n)`}</M> depth.
        </p>

        <figure style={{ margin: "1.4rem 0", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 16 }}>
          <svg viewBox="0 0 300 220" style={{ width: "100%", height: "auto", display: "block", maxWidth: 380, margin: "0 auto" }} role="img" aria-label="A 2-D k-d tree partition: a thick vertical root split, then alternating horizontal and vertical splits dividing the plane into axis-aligned boxes, each holding a training point.">
            <rect x={20} y={20} width={260} height={180} rx={4} fill="var(--canvas)" stroke="var(--border-strong)" />
            {SPLITS.map((s, i) => (
              <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke="var(--c-classification)" strokeWidth={s.w} strokeOpacity={s.d ? 0.5 : 0.9} strokeDasharray={s.d ? "3 3" : undefined} />
            ))}
            {PTS.map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={4} fill="var(--c-regression)" fillOpacity={0.85} />
            ))}
            <rect x={QUERY.x - 4.5} y={QUERY.y - 4.5} width={9} height={9} transform={`rotate(45 ${QUERY.x} ${QUERY.y})`} fill="var(--ink)" />
            <text x={QUERY.x + 8} y={QUERY.y + 2} fontSize={9} fill="var(--muted)">query</text>
          </svg>
          <figcaption style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 8, lineHeight: 1.55 }}>
            The thick line is the root split (on x); thinner and dashed lines are deeper splits, alternating
            axis by level. Each leaf box holds a handful of points. A query drops into one box in{" "}
            <M>{String.raw`O(\log n)`}</M> steps.
          </figcaption>
        </figure>

        <h2>Query: descend, then backtrack to prune</h2>
        <p>The search has two phases, and the second is where the cleverness lives:</p>
        <ol style={ol}>
          <li>
            <strong>Descend</strong> to the leaf box containing the query, following the same split decisions
            used to build the tree. The point(s) there give a first &ldquo;best so far&rdquo; distance.
          </li>
          <li>
            <strong>Backtrack</strong> up the tree. At each node, ask: could the <em>other</em> side of this
            split hold anything closer than the best so far? The distance to the splitting plane answers it. If
            that plane is farther than the current best, the entire subtree beyond it is pruned — untouched.
          </li>
        </ol>
        <p>
          The pruning test is a one-line comparison against the splitting coordinate, yet it can discard half
          the remaining tree at a stroke. On low-dimensional data the average query drops from{" "}
          <M>{String.raw`O(n)`}</M> to about <M>{String.raw`O(\log n)`}</M>.
        </p>

        <Callout color="var(--c-classification)" title={<>Why it collapses in high dimensions</>}>
          The pruning only helps if the splitting plane is often farther than your current best neighbour — and
            in high dimensions it almost never is. Points spread out (the curse again), so the &ldquo;other
            side&rdquo; of nearly every split <em>could</em> hold something closer, and almost nothing gets
            pruned. Past roughly <M>{String.raw`d \gtrsim 20`}</M>, a k-d tree examines nearly every point and
            degrades to <M>{String.raw`O(n)`}</M> — brute force with overhead. Rule of thumb: k-d trees shine when{" "}
            <M>{String.raw`n \gg 2^d`}</M>.
        </Callout>

        <MathBlock>{String.raw`\text{build } O(n \log n) \qquad \text{query } O(\log n)\ \text{(low } d\text{)} \;\to\; O(n)\ \text{(high } d\text{)}`}</MathBlock>

        <p>
          The high-dimensional failure is exactly what motivates the next structure. k-d trees prune with
          axis-aligned boxes; <strong>ball trees</strong> prune with spheres, which cope far better as the
          dimension climbs and work with non-Euclidean metrics too.
        </p>

        <CodeBlock setup={KNN_SETUP} fromScratch={codeLib} withLibrary={codeAuto} />

        <Quiz
          accent="var(--c-classification)"
          questions={[
            {
              q: "How does a k-d tree decide where to split at each node?",
              options: ["At the median along a chosen axis, cycling through axes by depth", "Randomly, to stay unbiased", "At the mean of the target values"],
              answer: 0,
              explain: "Median splits on alternating axes keep the tree balanced — O(n log n) to build, O(log n) deep.",
            },
            {
              q: "During a query, when can a whole subtree be pruned?",
              options: ["When the distance to its splitting plane exceeds the best neighbour found so far", "When it contains fewer than k points", "Never — all subtrees must be checked"],
              answer: 0,
              explain: "If the splitting plane is farther than the current best, nothing beyond it can be closer, so the entire branch is skipped without inspection.",
            },
            {
              q: "Why do k-d trees degrade to O(n) in high dimensions?",
              options: ["Points spread out, so almost no subtree can be pruned", "The tree becomes too deep to store", "Median splits stop being balanced"],
              answer: 0,
              explain: "High-dimensional spread means the 'other side' of nearly every split might hold something closer, defeating the pruning. Past ~20 dims it's brute force with overhead.",
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/k-nearest-neighbors/the-brute-force-cost", label: <>← The brute-force cost</> }} next={{ href: "/learn/k-nearest-neighbors/ball-trees", label: <>Next up · Ball trees →</> }} />
      </div>
    </article>
  );
}

const codeLib = `from sklearn.neighbors import KDTree
import numpy as np

# build once: O(n log n). leaf_size trades build vs query speed
tree = KDTree(X_train, leaf_size=30)

# query: descend + backtrack-prune, ~O(log n) in low dimensions
dist, idx = tree.query(X_test[:1], k=5)
print("neighbours:", idx[0], "distances:", np.round(dist[0], 2))`;

const codeAuto = `from sklearn.neighbors import KNeighborsClassifier

# "auto" inspects n, d, and the metric and usually picks kd_tree for low-d,
# ball_tree for higher-d, and brute for very high-d or sparse data
clf = KNeighborsClassifier(n_neighbors=5, algorithm="kd_tree").fit(X_train, y_train)
print(clf.score(X_test, y_test))`;

const ol: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.85 };
