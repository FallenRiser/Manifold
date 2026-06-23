import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "Similarity & distance — Manifold",
  description:
    "For k-NN, the distance function isn't a detail — it IS the model. Whatever you call 'near' decides every prediction. Here's the geometry behind 'nearest'.",
};

export default function SimilarityPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-classification)")}>Classification</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 6 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        Similarity & distance
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        Most algorithms have a model and use distance as a helper. k-NN has <em>no</em> model — so the
        distance function carries the entire weight of the method. Choose it well and k-NN sings; choose it
        badly and nothing else can save it.
      </p>

      <div className="lesson">
        <h2>Distance defines &ldquo;similar&rdquo;</h2>
        <p>
          k-NN&rsquo;s only assumption is that nearby points share labels. &ldquo;Nearby&rdquo; is whatever your
          distance function says it is — so that function literally <strong>is</strong> the model. Every
          prediction is downstream of it. This is why so much of the k-NN track is really about distance:
          metrics, scaling, weighting, and the way distance breaks down in high dimensions.
        </p>

        <h2>The default: Euclidean distance</h2>
        <p>
          Straight-line distance in feature space — the one the opening lab used:
        </p>
        <MathBlock>{String.raw`d(\mathbf{x}, \mathbf{z}) = \sqrt{\sum_{i=1}^{m} (x_i - z_i)^2}`}</MathBlock>
        <p>
          It&rsquo;s the natural choice for continuous features on a common scale. Note k-NN doesn&rsquo;t need the
          square root to <em>rank</em> neighbours — squared distance gives the same ordering and is cheaper —
          but the geometry is the familiar one: equidistant points form a circle (a sphere in higher
          dimensions).
        </p>

        <h2>Other distances, other notions of &ldquo;near&rdquo;</h2>
        <ul style={ul}>
          <li><strong>Manhattan</strong> (<M>{String.raw`\sum |x_i - z_i|`}</M>) — sum of absolute differences; more robust, often better in high dimensions.</li>
          <li><strong>Cosine</strong> — angle between vectors, ignoring magnitude; the right call for text and embeddings.</li>
          <li><strong>Hamming</strong> — count of differing attributes; for categorical or binary features.</li>
          <li><strong>Minkowski</strong> — the family that contains Euclidean (<M>{String.raw`p=2`}</M>) and Manhattan (<M>{String.raw`p=1`}</M>) as special cases.</li>
        </ul>
        <p>
          A whole later page goes deeper on each. The point here: these aren&rsquo;t interchangeable knobs — each
          encodes a genuinely different idea of similarity, and switching them can completely change which
          points are &ldquo;nearest&rdquo; and therefore what k-NN predicts.
        </p>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-classification)", marginBottom: 4 }}>
            The two traps that follow from this
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            Because distance is everything, two issues become make-or-break for k-NN.{" "}
            <strong>Feature scaling</strong>: a feature measured in large units dominates the distance and
            silently drowns out the others (its own page). <strong>The curse of dimensionality</strong>: with
            many features, all distances bunch together and &ldquo;nearest&rdquo; stops being meaningful. Both are
            symptoms of the same fact — k-NN lives or dies by its distance function.
          </p>
        </div>

        <p>
          If you read the k-Means track, this will feel familiar — clustering leans on distance too. The
          difference is that k-NN uses distances to <em>labelled</em> points to predict, while k-means uses
          them to <em>centroids</em> to group. (We&rsquo;ll untangle that &ldquo;k&rdquo; confusion later.)
        </p>

        <h2>Distance, three ways</h2>
        <CodeBlock fromScratch={codeScratch} withLibrary={codeLib} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/k-nearest-neighbors/the-classification-landscape" style={navLink}>← The classification landscape</Link>
          <Link href="/learn/k-nearest-neighbors/from-1-nn-to-k-nn" style={{ ...navLink, fontWeight: 600 }}>Next up · From 1-NN to k-NN →</Link>
        </div>
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np

def euclidean(x, Z):  return np.sqrt(((Z - x)**2).sum(axis=1))   # straight-line
def manhattan(x, Z):  return np.abs(Z - x).sum(axis=1)            # city-block
def cosine(x, Z):
    return 1 - (Z @ x) / (np.linalg.norm(Z, axis=1) * np.linalg.norm(x))

# k-NN only needs the ORDER of distances, so squared Euclidean is enough (and faster):
def sq_euclidean(x, Z):  return ((Z - x)**2).sum(axis=1)`;

const codeLib = `from sklearn.neighbors import KNeighborsClassifier

# the metric is a first-class hyperparameter — it changes what "nearest" means
knn_euclid = KNeighborsClassifier(n_neighbors=5, metric="euclidean")
knn_manhat = KNeighborsClassifier(n_neighbors=5, metric="manhattan")
knn_cosine = KNeighborsClassifier(n_neighbors=5, metric="cosine")`;

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-classification) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-classification) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0" };
