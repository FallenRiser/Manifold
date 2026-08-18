import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { KNN_SETUP } from "@/lib/runtimeSetup";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "The brute-force cost — Manifold",
  description:
    "k-NN has no training, but it pays for it at every query: a full scan of the entire training set. Here's the exact cost, why it's fine small and fatal at scale, and what has to change.",
};

const th: React.CSSProperties = { textAlign: "left", padding: "8px 12px", fontSize: 12.5, color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)" };
const td: React.CSSProperties = { padding: "8px 12px", fontSize: 14, color: "var(--ink)", borderBottom: "1px solid var(--border)" };
const mono: React.CSSProperties = { fontFamily: "ui-monospace, monospace" };

// A query connected to EVERY training point — the brute-force scan, drawn literally.
const Q = { x: 150, y: 95 };
const PTS = [
  [40, 40], [70, 130], [120, 30], [200, 55], [250, 120], [90, 70], [180, 140],
  [230, 40], [55, 100], [140, 150], [270, 80], [110, 110], [210, 100], [45, 150],
  [165, 45], [95, 40],
];

export default function BruteForceCostPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: "var(--c-classification)" }, { label: "Tier 2 · scaling the search", color: "var(--c-classification)" }]}
        time="about 7 minutes"
        title={<>The brute-force cost</>}
        intro={<>
          k-NN is famous for &ldquo;lazy&rdquo; learning — it does no work at fit time. The catch is that all the
        work moves to <em>prediction</em> time, where the naive algorithm compares the query against every
        single training point. That&rsquo;s fine until it very much isn&rsquo;t.
        </>}
      />

      <div className="lesson">
        <h2>Every query scans the whole dataset</h2>
        <p>
          To find the k nearest neighbours the naive way, you compute the distance from the query to{" "}
          <em>all</em> <M>{String.raw`n`}</M> training points, then take the smallest k. There&rsquo;s no model to
          consult — the training set <em>is</em> the model, and you re-read all of it every time:
        </p>

        <figure style={{ margin: "1.4rem 0", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 16 }}>
          <svg viewBox="0 0 300 185" style={{ width: "100%", height: "auto", display: "block", maxWidth: 360, margin: "0 auto" }} role="img" aria-label="A query point connected by a line to every one of the training points, illustrating that brute-force k-NN computes all n distances.">
            <rect x={1} y={1} width={298} height={183} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
            {PTS.map(([x, y], i) => (
              <line key={i} x1={Q.x} y1={Q.y} x2={x} y2={y} stroke="var(--border-strong)" strokeWidth={0.6} strokeOpacity={0.7} />
            ))}
            {PTS.map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={4} fill="var(--c-regression)" fillOpacity={0.85} />
            ))}
            <rect x={Q.x - 5} y={Q.y - 5} width={10} height={10} transform={`rotate(45 ${Q.x} ${Q.y})`} fill="var(--ink)" />
            <text x={Q.x + 9} y={Q.y - 7} fontSize={9} fill="var(--muted)">query</text>
          </svg>
          <figcaption style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 8, lineHeight: 1.55 }}>
            One prediction = <M>{String.raw`n`}</M> distance computations, every time. Double the data and every
            query gets twice as slow — with no way to reuse the work between queries.
          </figcaption>
        </figure>

        <h2>The exact cost</h2>
        <p>
          With <M>{String.raw`n`}</M> training points in <M>{String.raw`d`}</M> dimensions, each distance costs{" "}
          <M>{String.raw`O(d)`}</M> and there are <M>{String.raw`n`}</M> of them, so a single query is:
        </p>
        <MathBlock>{String.raw`O(n\,d) \;\text{per query} \quad\Longrightarrow\quad O(n\,d)\;\text{per point} \times m \;\text{queries} = O(n\,m\,d)`}</MathBlock>

        <div style={{ overflowX: "auto", margin: "1.4rem 0" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", background: "var(--surface)", border: "1px solid var(--border-strong)", borderRadius: 10 }}>
            <thead>
              <tr>
                <th style={th}>Phase</th>
                <th style={th}>Brute-force cost</th>
                <th style={th}>Comment</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={td}>Training / fit</td>
                <td style={{ ...td, ...mono, color: "var(--good)" }}>O(1)</td>
                <td style={td}>Just store the data — the &ldquo;lazy&rdquo; part.</td>
              </tr>
              <tr>
                <td style={td}>One query</td>
                <td style={{ ...td, ...mono }}>O(n·d)</td>
                <td style={td}>Distance to every point, then a partial sort for the top k.</td>
              </tr>
              <tr>
                <td style={td}>Memory</td>
                <td style={{ ...td, ...mono }}>O(n·d)</td>
                <td style={td}>The entire training set stays resident — no compression.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p>
          The <M>{String.raw`O(1)`}</M> fit is a trap: the bill just moves to inference, and it&rsquo;s the worst
          possible place for it. A model you train once but query millions of times pays that{" "}
          <M>{String.raw`O(nd)`}</M> on <em>every</em> one of those millions of calls.
        </p>

        <h2>When brute force is actually the right answer</h2>
        <p>
          Don&rsquo;t reach for a fancy structure reflexively — vectorised brute force is genuinely optimal in
          several common cases:
        </p>
        <ul style={ul}>
          <li><strong>Small <M>{String.raw`n`}</M></strong> — a few thousand points scan in microseconds; a tree&rsquo;s overhead isn&rsquo;t worth it.</li>
          <li><strong>High <M>{String.raw`d`}</M></strong> — past ~20 dimensions, spatial trees degrade to brute-force speed anyway (next pages), so skip the complexity.</li>
          <li><strong>Batched, on hardware</strong> — brute force is just a matrix multiply; a GPU or a BLAS-backed library (FAISS-flat) does millions of comparisons blisteringly fast.</li>
        </ul>

        <Callout color="var(--c-classification)" title={<>The idea behind every speed-up</>}>
          Everything that follows — k-d trees, ball trees, approximate search — buys speed the same way:
            <strong> organise the training points once</strong> so that a query can rule out huge groups of them
            without measuring each. The goal is to turn that <M>{String.raw`O(n)`}</M> scan into something closer
            to <M>{String.raw`O(\log n)`}</M> by never looking at points that obviously can&rsquo;t be nearest.
        </Callout>

        <CodeBlock setup={KNN_SETUP} fromScratch={codeScratch} withLibrary={codeLib} />

        <Quiz
          accent="var(--c-classification)"
          questions={[
            {
              q: "What is the cost of a single brute-force k-NN query with n points in d dimensions?",
              options: ["O(n·d) — a distance to every point", "O(d) — constant in n", "O(log n · d)"],
              answer: 0,
              explain: "You compute all n distances, each O(d). The log-n behaviour comes only from spatial structures, not from brute force.",
            },
            {
              q: "k-NN's O(1) training cost is best described as…",
              options: ["A deferred bill — the work moves to every prediction", "A genuine free lunch", "Proof that k-NN is efficient"],
              answer: 0,
              explain: "Lazy learning stores the data and does nothing at fit time, so the entire cost lands at inference — the worst place for a model queried many times.",
            },
            {
              q: "In which case is brute force often the right choice anyway?",
              options: ["Very high dimensions, where spatial trees degrade to brute-force speed", "Millions of points in 2-D", "Any dataset that fits in memory"],
              answer: 0,
              explain: "Past ~20 dimensions, k-d and ball trees lose their pruning advantage, so the extra machinery buys little — vectorised brute force (or approximate methods) wins.",
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/k-nearest-neighbors/feature-selection-and-weighting", label: <>← Feature selection &amp; weighting</> }} next={{ href: "/learn/k-nearest-neighbors/k-d-trees", label: <>Next up · k-d trees →</> }} />
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np

def brute_force_knn(X_train, x, k):
    # O(n*d): distance to EVERY training point, then partial sort for the top k
    d = np.sqrt(((X_train - x)**2).sum(axis=1))
    return np.argpartition(d, k)[:k]        # k smallest, unsorted — a touch faster

# fine for small n; cost grows linearly with the dataset on every single query
print(brute_force_knn(X_train, X_test[0], k=5))`;

const codeLib = `from sklearn.neighbors import NearestNeighbors

# algorithm="brute" forces the full scan; it's genuinely best for small n or high d
nn = NearestNeighbors(n_neighbors=5, algorithm="brute").fit(X_train)
dist, idx = nn.kneighbors(X_test[:1])
print("neighbours:", idx[0], "distances:", dist[0].round(2))`;

const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
