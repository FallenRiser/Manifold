import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Approximate nearest neighbors — Manifold",
  description:
    "When exact search is hopeless — millions of high-dimensional vectors — you trade a sliver of accuracy for orders-of-magnitude speed. LSH, trees, graphs, and quantization, and how to reason about the recall–speed dial.",
};

const th: React.CSSProperties = { textAlign: "left", padding: "8px 12px", fontSize: 12.5, color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)" };
const td: React.CSSProperties = { padding: "8px 12px", fontSize: 14, color: "var(--ink)", borderBottom: "1px solid var(--border)", verticalAlign: "top" };

export default function ApproximateNNPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: "var(--c-classification)" }, { label: "Tier 2 · scaling the search", color: "var(--c-classification)" }]}
        time="about 8 minutes"
        title={<>Approximate nearest neighbors</>}
        intro={<>
          At web scale — millions of high-dimensional embeddings — every exact structure has collapsed back to
        a full scan. The way out is to stop demanding the <em>exact</em> nearest neighbours and accept the ones
        that are almost always right, which can be thousands of times faster.
        </>}
      />

      <div className="lesson">
        <h2>Trade a little accuracy for a lot of speed</h2>
        <p>
          Approximate nearest neighbour (ANN) search returns neighbours that are <em>usually</em> the true ones —
          and near-misses when they&rsquo;re not. For most k-NN uses that&rsquo;s a bargain: a recommender or a
          semantic-search index barely notices if the 8th-nearest item is occasionally swapped for the 11th, and
          in return queries drop from seconds to microseconds. Quality is measured by{" "}
          <strong>recall@k</strong> — the fraction of the true k neighbours the approximate method actually
          returned:
        </p>
        <MathBlock>{String.raw`\text{recall@}k = \frac{|\,\text{returned}_k \cap \text{true}_k\,|}{k}`}</MathBlock>
        <p>
          Every ANN method exposes a knob that trades recall against speed — search harder for higher recall,
          search less for lower latency. You tune it to the recall your application can tolerate.
        </p>

        <h2>The four main families</h2>
        <div style={{ overflowX: "auto", margin: "1.4rem 0" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", background: "var(--surface)", border: "1px solid var(--border-strong)", borderRadius: 10 }}>
            <thead>
              <tr>
                <th style={th}>Family</th>
                <th style={th}>Core idea</th>
                <th style={th}>Trade-off</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={td}><strong>Hashing (LSH)</strong></td>
                <td style={td}>Hash points so nearby ones collide into the same bucket; search only the query&rsquo;s bucket(s).</td>
                <td style={td}>Simple, low memory; usually lower recall than graphs for the same speed.</td>
              </tr>
              <tr>
                <td style={td}><strong>Tree ensembles</strong> (Annoy)</td>
                <td style={td}>Many random-projection trees; combine their candidate sets.</td>
                <td style={td}>Fast static indexes, memory-mappable; rebuild to add data.</td>
              </tr>
              <tr>
                <td style={td}><strong>Graphs (HNSW)</strong></td>
                <td style={td}>A navigable small-world graph; greedily walk toward the query along edges.</td>
                <td style={td}>State-of-the-art recall/speed; higher memory, the common default.</td>
              </tr>
              <tr>
                <td style={td}><strong>Quantization</strong> (PQ / IVF, FAISS)</td>
                <td style={td}>Compress vectors into compact codes; compare in the compressed space.</td>
                <td style={td}>Massive memory savings for billions of vectors; some precision lost.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>When approximate is the right call</h2>
        <ul style={ul}>
          <li><strong>Huge <M>{String.raw`n`}</M>, high <M>{String.raw`d`}</M></strong> — millions+ of embeddings where exact search can&rsquo;t keep up. This is the home turf of vector databases.</li>
          <li><strong>Near-misses are cheap</strong> — retrieval, recommendation, de-duplication, semantic search: a slightly-off neighbour is a fine result, not a bug.</li>
          <li><strong>Latency is a hard constraint</strong> — you must answer in milliseconds and can trade a few points of recall to get there.</li>
        </ul>
        <p>
          And when it&rsquo;s <em>not</em>: small or low-dimensional data (exact trees are already fast and give
          guarantees), or any setting where a wrong neighbour is unacceptable — high-stakes decisions, or
          evaluation where you need the ground-truth neighbours.
        </p>

        <Callout color="var(--c-classification)" title={<>k-NN, quietly everywhere</>}>
          Modern &ldquo;vector search&rdquo; — the retrieval layer behind semantic search and RAG systems — is
            approximate k-NN over embedding vectors, served by libraries like FAISS, hnswlib, and ScaNN. The
            humble nearest-neighbour rule from the first page of this track is, at scale, one of the most
            widely-deployed algorithms in production ML.
        </Callout>

        <CodeBlock fromScratch={codeConcept} withLibrary={codeHnsw} />

        <Quiz
          accent="var(--c-classification)"
          questions={[
            {
              q: "What does approximate nearest neighbour search trade away for speed?",
              options: ["A little accuracy — it may return a near-miss instead of the exact neighbour", "The ability to handle high dimensions", "All of its memory efficiency"],
              answer: 0,
              explain: "ANN returns the true neighbours most of the time and near-misses otherwise, buying huge speed-ups. Quality is quantified by recall@k.",
            },
            {
              q: "recall@k measures…",
              options: ["The fraction of the true k neighbours the method actually returned", "Query latency in milliseconds", "The number of dimensions"],
              answer: 0,
              explain: "It's the overlap between the returned k and the true k, divided by k — the standard accuracy measure for approximate search.",
            },
            {
              q: "Which situation most calls for approximate rather than exact search?",
              options: ["Millions of high-dimensional embeddings with tight latency limits", "A few thousand points in 2-D", "When you need guaranteed ground-truth neighbours"],
              answer: 0,
              explain: "Massive, high-dimensional, latency-bound workloads are exactly where exact structures collapse and a sliver of recall loss is worth orders-of-magnitude speed.",
            },
          ]}
        />

        <Callout color="var(--c-classification)" title={<>Where this chapter leaves you</>}>
          You can now make k-NN fast: brute force when small, k-d/ball trees in modest dimensions, and
            approximate search at scale. Next, the track turns from classification to k-NN&rsquo;s other jobs —
            <em>regression, local weighted fitting, imputation, and anomaly detection</em> — then to the theory
            of why any of it works. See the full path on the{" "}
            <Link href="/map" style={{ color: "var(--brand)", textDecoration: "none" }}>curriculum map</Link>.
        </Callout>

        <PrevNext prev={{ href: "/learn/k-nearest-neighbors/ball-trees", label: <>← Ball trees</> }} next={{ href: "/learn/k-nearest-neighbors/k-nn-regression-in-depth", label: <>Next up · k-NN regression in depth →</> }} />
      </div>
    </article>
  );
}

// No `setup` on this block → no Run button: faiss/hnswlib aren't in the browser runtime.
const codeConcept = `# Exact vs approximate, conceptually:
#
#   exact (brute/tree):  guaranteed correct, cost grows with n (and d)
#   approximate (ANN):   ~correct with tunable recall, near-constant query time
#
# The ANN index is built once, then answers queries by exploring only a
# small, promising slice of the data instead of all of it.
#
# Measure quality against an exact baseline:
def recall_at_k(approx_idx, true_idx):
    return len(set(approx_idx) & set(true_idx)) / len(true_idx)`;

const codeHnsw = `# HNSW via hnswlib (a graph-based ANN index) — the common production default.
import hnswlib, numpy as np

index = hnswlib.Index(space="l2", dim=X_train.shape[1])
index.init_index(max_elements=len(X_train), ef_construction=200, M=16)
index.add_items(X_train, np.arange(len(X_train)))

index.set_ef(50)                       # the recall/speed knob: higher ef = higher recall
labels, distances = index.knn_query(X_test[:1], k=5)
print("approx neighbours:", labels[0])`;

const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
