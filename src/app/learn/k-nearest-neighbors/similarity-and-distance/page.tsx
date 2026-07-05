import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { KNN_SETUP } from "@/lib/runtimeSetup";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Similarity & distance — Manifold",
  description:
    "For k-NN, the distance function isn't a detail — it IS the model. Whatever you call 'near' decides every prediction. Here's the geometry behind 'nearest'.",
};

export default function SimilarityPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: "var(--c-classification)" }]}
        time="about 6 minutes"
        title={<>Similarity & distance</>}
        intro={<>
          Most algorithms have a model and use distance as a helper. k-NN has <em>no</em> model — so the
        distance function carries the entire weight of the method. Choose it well and k-NN sings; choose it
        badly and nothing else can save it.
        </>}
      />

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

        <Callout color="var(--c-classification)" title={<>The two traps that follow from this</>}>
          Because distance is everything, two issues become make-or-break for k-NN.{" "}
            <strong>Feature scaling</strong>: a feature measured in large units dominates the distance and
            silently drowns out the others (its own page). <strong>The curse of dimensionality</strong>: with
            many features, all distances bunch together and &ldquo;nearest&rdquo; stops being meaningful. Both are
            symptoms of the same fact — k-NN lives or dies by its distance function.
        </Callout>

        <p>
          If you read the k-Means track, this will feel familiar — clustering leans on distance too. The
          difference is that k-NN uses distances to <em>labelled</em> points to predict, while k-means uses
          them to <em>centroids</em> to group. (We&rsquo;ll untangle that &ldquo;k&rdquo; confusion later.)
        </p>

        <h2>Distance, three ways</h2>
        <CodeBlock setup={KNN_SETUP} fromScratch={codeScratch} withLibrary={codeLib} />

        <PrevNext prev={{ href: "/learn/k-nearest-neighbors/the-classification-landscape", label: <>← The classification landscape</> }} next={{ href: "/learn/k-nearest-neighbors/from-1-nn-to-k-nn", label: <>Next up · From 1-NN to k-NN →</> }} />
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


const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };


