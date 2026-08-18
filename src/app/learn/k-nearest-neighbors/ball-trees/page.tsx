import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { KNN_SETUP } from "@/lib/runtimeSetup";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Ball trees — Manifold",
  description:
    "Where k-d trees carve boxes, ball trees wrap points in nested spheres and prune with the triangle inequality. Why that copes better in higher dimensions and with any metric — and where even it gives out.",
};

// Nested balls: two parent spheres, each with two child spheres holding points.
// A query outside the left parent can be pruned by the triangle inequality.
const PARENTS = [
  { cx: 92, cy: 112, r: 74 },
  { cx: 214, cy: 106, r: 66 },
];
const CHILDREN = [
  { cx: 74, cy: 82, r: 30, pts: [[66, 74], [86, 88], [70, 96]] },
  { cx: 104, cy: 150, r: 30, pts: [[98, 142], [116, 156], [92, 160]] },
  { cx: 200, cy: 76, r: 28, pts: [[192, 70], [210, 82], [198, 62]] },
  { cx: 226, cy: 142, r: 28, pts: [[218, 136], [236, 150], [224, 128]] },
];
const QUERY = { x: 268, y: 196 };

export default function BallTreesPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: "var(--c-classification)" }, { label: "Tier 2 · scaling the search", color: "var(--c-classification)" }]}
        time="about 7 minutes"
        title={<>Ball trees</>}
        intro={<>
          A k-d tree&rsquo;s axis-aligned boxes are its weakness: in many dimensions they get thin and leaky. Ball
        trees swap the boxes for nested spheres, and prune with nothing more than the triangle inequality —
        which turns out to travel much better into higher dimensions.
        </>}
      />

      <div className="lesson">
        <h2>Wrap points in nested spheres</h2>
        <p>
          A ball tree groups the training points into nested <strong>hyperspheres</strong> (&ldquo;balls&rdquo;).
          Each node stores just two things: a <strong>centroid</strong> and a <strong>radius</strong> big enough
          to enclose every point beneath it. Children are smaller balls inside their parent; leaves hold a few
          points each. Unlike k-d boxes, balls can sit at any angle and overlap, so they hug irregular clusters
          tightly.
        </p>

        <figure style={{ margin: "1.4rem 0", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 16 }}>
          <svg viewBox="0 0 300 220" style={{ width: "100%", height: "auto", display: "block", maxWidth: 380, margin: "0 auto" }} role="img" aria-label="Two large parent spheres, each enclosing two smaller child spheres that hold the training points; a query point outside the left parent can be pruned.">
            <rect x={1} y={1} width={298} height={218} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
            {PARENTS.map((b, i) => (
              <circle key={i} cx={b.cx} cy={b.cy} r={b.r} fill="color-mix(in srgb, var(--c-classification) 6%, transparent)" stroke="var(--c-classification)" strokeWidth={1.6} strokeOpacity={0.7} />
            ))}
            {CHILDREN.map((b, i) => (
              <g key={i}>
                <circle cx={b.cx} cy={b.cy} r={b.r} fill="color-mix(in srgb, var(--c-regression) 8%, transparent)" stroke="var(--c-regression)" strokeWidth={1.2} strokeDasharray="3 3" strokeOpacity={0.8} />
                {b.pts.map(([x, y], j) => <circle key={j} cx={x} cy={y} r={3} fill="var(--c-regression)" />)}
              </g>
            ))}
            <line x1={QUERY.x} y1={QUERY.y} x2={PARENTS[0].cx} y2={PARENTS[0].cy} stroke="var(--faint)" strokeWidth={1} strokeDasharray="2 3" />
            <rect x={QUERY.x - 4.5} y={QUERY.y - 4.5} width={9} height={9} transform={`rotate(45 ${QUERY.x} ${QUERY.y})`} fill="var(--ink)" />
            <text x={QUERY.x - 6} y={QUERY.y - 8} fontSize={9} fill="var(--muted)" textAnchor="end">query</text>
          </svg>
          <figcaption style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 8, lineHeight: 1.55 }}>
            Solid spheres are parent nodes; dashed spheres are their children holding the points. The distance
            from the query to a ball&rsquo;s surface is <M>{String.raw`\lVert q - c\rVert - r`}</M> — if that already
            exceeds the best neighbour found, the whole ball is skipped.
          </figcaption>
        </figure>

        <h2>Prune with the triangle inequality</h2>
        <p>
          Here&rsquo;s the whole trick. For a ball with centroid <M>{String.raw`c`}</M> and radius{" "}
          <M>{String.raw`r`}</M>, the closest any point inside it could possibly be to a query{" "}
          <M>{String.raw`q`}</M> is bounded below by:
        </p>
        <MathBlock>{String.raw`d_{\min}(q, \text{ball}) = \max\big(0,\ \lVert q - c\rVert - r\big)`}</MathBlock>
        <p>
          That&rsquo;s a direct consequence of the triangle inequality. So the search descends to a promising leaf
          for a first best distance, then — visiting other nodes — computes this lower bound for each ball. If{" "}
          <M>{String.raw`d_{\min}`}</M> already exceeds the current best, <em>nothing</em> in that ball can win,
          and the entire subtree is pruned with a single distance-to-centroid calculation.
        </p>

        <h2>Why it beats k-d trees where it counts</h2>
        <ul style={ul}>
          <li><strong>Tighter in high dimensions.</strong> Spheres wrap clusters more snugly than thin axis-aligned boxes, so the lower bound is more often large enough to prune — the advantage grows with <M>{String.raw`d`}</M>.</li>
          <li><strong>Any metric, not just axes.</strong> The pruning needs only a distance and the triangle inequality, so ball trees work with Manhattan, Mahalanobis, cosine (as an angular distance), and more — not just axis-aligned Euclidean.</li>
          <li><strong>Same build/query profile.</strong> Roughly <M>{String.raw`O(n \log n)`}</M> to build and about <M>{String.raw`O(\log n)`}</M> per query in favourable regimes.</li>
        </ul>

        <Callout color="var(--c-classification)" title={<>Even ball trees meet the wall</>}>
          Ball trees push the usable dimensionality higher, but they don&rsquo;t repeal the curse. In truly
            high-dimensional spaces (hundreds or thousands of features — text, images, embeddings) distances
            concentrate so severely that <em>no</em> exact structure prunes well, and every method slides back
            toward <M>{String.raw`O(n)`}</M>. When exact search is hopeless, you change the question: accept an{" "}
            <em>approximate</em> answer. That&rsquo;s the final page.
        </Callout>

        <CodeBlock setup={KNN_SETUP} fromScratch={codeTree} withLibrary={codeAuto} />

        <Quiz
          accent="var(--c-classification)"
          questions={[
            {
              q: "What does each node of a ball tree store?",
              options: ["A centroid and a radius enclosing all points beneath it", "An axis and a median split value", "The full list of pairwise distances"],
              answer: 0,
              explain: "A ball is just a centre plus a radius. That's all the triangle-inequality pruning needs.",
            },
            {
              q: "The lower bound used to prune a ball is…",
              options: ["max(0, ‖q − c‖ − r) — distance to the centre minus the radius", "‖q − c‖ + r", "the ball's radius alone"],
              answer: 0,
              explain: "By the triangle inequality, no point inside can be closer than the distance to the centre minus the radius. If that exceeds the best so far, skip the whole ball.",
            },
            {
              q: "A key advantage of ball trees over k-d trees is…",
              options: ["They work with any distance metric and prune better in higher dimensions", "They need no training phase", "They guarantee O(log n) in all dimensions"],
              answer: 0,
              explain: "Pruning needs only a distance and the triangle inequality, so any metric works; snug spheres also prune better than thin boxes as d grows. Neither escapes the curse entirely.",
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/k-nearest-neighbors/k-d-trees", label: <>← k-d trees</> }} next={{ href: "/learn/k-nearest-neighbors/approximate-nearest-neighbors", label: <>Next up · Approximate nearest neighbors →</> }} />
      </div>
    </article>
  );
}

const codeTree = `from sklearn.neighbors import BallTree
import numpy as np

# a ball tree supports many metrics — here Manhattan, which k-d trees also do,
# but ball trees also take Mahalanobis, Haversine, etc.
tree = BallTree(X_train, leaf_size=40, metric="manhattan")
dist, idx = tree.query(X_test[:1], k=5)
print("neighbours:", idx[0], "distances:", np.round(dist[0], 2))`;

const codeAuto = `from sklearn.neighbors import KNeighborsClassifier

# let sklearn choose; it leans on ball_tree for higher-d or non-Euclidean metrics
clf = KNeighborsClassifier(n_neighbors=5, algorithm="ball_tree",
                           metric="manhattan").fit(X_train, y_train)
print(clf.score(X_test, y_test))`;

const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
