import { CodeBlock } from "@/components/CodeBlock";
import { CLUSTER_SETUP } from "@/lib/runtimeSetup";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { LineChart } from "@/components/figures/kmeans/KmeansCharts";
import { ScatterRow } from "@/components/figures/kmeans/Scatter";
import { PCA_SWEEP, DIGITS_2D } from "@/components/figures/kmeans/data.generated";

export const metadata = {
  title: "Clustering after dimensionality reduction — Manifold",
  description:
    "In high dimensions Euclidean distance loses meaning, so k-means struggles. Reducing dimensions first — PCA, UMAP — sharpens the geometry, speeds things up, and can rescue the clustering entirely.",
};

export default function DimReductionPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Clustering", color: "var(--c-clustering)" }]}
        time="about 6 minutes"
        title={<>Clustering after dimensionality reduction</>}
        intro={<>
          k-Means leans entirely on Euclidean distance, and Euclidean distance quietly stops being useful
        as dimensions pile up. The standard remedy is to reduce dimensions first — and it does more than
        speed things up.
        </>}
      />

      <div className="lesson">
        <h2>Why high dimensions hurt</h2>
        <p>
          As the number of features grows, a strange thing happens: the distance to the nearest point and
          the distance to the farthest point become almost equal. When everything is roughly equidistant,
          &ldquo;nearest centroid&rdquo; is barely meaningful and clusters blur. Worse, most high-dimensional
          datasets have many irrelevant or redundant features that act as pure noise in the distance sum —
          and noise that k-means cannot ignore. (This is the curse of dimensionality, met earlier.)
        </p>

        <h2>Reduce first, then cluster</h2>
        <p>The recipe is a two-stage pipeline:</p>
        <ul style={ul}>
          <li>
            <strong>PCA</strong> — project onto the handful of directions carrying the most variance.
            Linear, fast, and it strips low-variance noise so the surviving distances reflect real
            structure. Keeping enough components to retain ~90–95% of variance is a common rule.
          </li>
          <li>
            <strong>UMAP / t-SNE</strong> — non-linear embeddings that can untangle curved manifolds into
            compact, well-separated blobs. They often make k-means work where it failed in the raw space —
            but they distort global distances, so cluster <em>shapes</em> and <em>sizes</em> in the
            embedding aren&rsquo;t trustworthy (especially t-SNE).
          </li>
        </ul>

        <LineChart
          x={PCA_SWEEP.slice(1).map((r) => r.dims)}
          series={[{ label: "ARI against the true digit", values: PCA_SWEEP.slice(1).map((r) => r.ari), color: "var(--c-clustering)" }]}
          xlabel="PCA components kept"
          ylabel="ARI"
          markX={20}
          markXLabel="best"
          caption={<>Clustering 1,797 handwritten digits into ten groups, at every level of reduction.
            The flat line to beat is the raw 64-dimensional pixels, which score {PCA_SWEEP[0].ari}.
            Keeping 20 components scores {PCA_SWEEP[4].ari} — very slightly <em>better</em> than the raw
            data, for a third of the columns. Keeping 2 scores {PCA_SWEEP[1].ari}, which is a real
            loss. So the advice is not &ldquo;reduce&rdquo;: it is reduce enough to drop the noise
            dimensions and stop well before you start dropping the signal, and the only way to find
            that point is to sweep it.</>}
        />

        <ScatterRow
          panels={[
            { points: DIGITS_2D.points, labels: DIGITS_2D.truth, label: "coloured by the true digit" },
            { points: DIGITS_2D.points, labels: DIGITS_2D.labels, centroids: DIGITS_2D.centroids, label: "coloured by k-means on 2 components" },
          ]}
          caption={<>And the reason two components is not enough, shown rather than scored. In the
            projection the digits genuinely overlap — 4, 7 and 9 sit on top of one another — so no
            partition of this plane can separate them. The clustering is doing a reasonable job of a
            problem that has already been made unsolvable by the projection.</>}
        />

        <h2>Three wins at once</h2>
        <ul style={ul}>
          <li><strong>Sharper geometry.</strong> Fewer, more-informative dimensions restore meaningful distances.</li>
          <li><strong>Speed.</strong> k-means is <code>O(n·k·d)</code> — shrinking <em>d</em> from thousands to tens is a direct, large speedup.</li>
          <li><strong>Denoising.</strong> Dropping low-variance directions discards features that were only adding distance noise.</li>
        </ul>

        <Callout color="var(--c-clustering)" title={<>Cautions worth keeping</>}>
          Reduction can also <em>destroy</em> the very structure you wanted if you cut too aggressively —
            a cluster separated only along a low-variance direction can vanish under PCA. And clustering
            inside a t-SNE/UMAP plot then reading off cluster sizes is a classic mistake: those embeddings
            preserve neighbourhoods, not distances. Use non-linear embeddings to <em>find</em> structure,
            then validate it back in a faithful space. For text and images, clustering learned embeddings
            (PCA&rsquo;d if needed) is the standard pipeline — the capstone&rsquo;s embedding case shows it end to
            end.
        </Callout>

        <h2>PCA → k-means pipeline</h2>
        <CodeBlock setup={CLUSTER_SETUP} fromScratch={codeScratch} withLibrary={codeLib} />

        <PrevNext prev={{ href: "/learn/k-means/categorical-and-mixed-data", label: <>← Categorical &amp; mixed data</> }} next={{ href: "/learn/k-means", label: <>Back to overview →</> }} />
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np

# PCA from scratch: center, then project onto top-m eigenvectors of the covariance
def pca(X, m):
    Xc = X - X.mean(0)
    # SVD is the stable way to get principal directions
    U, S, Vt = np.linalg.svd(Xc, full_matrices=False)
    return Xc @ Vt[:m].T            # data in m principal-component coordinates

X_reduced = pca(X, m=10)           # 1000-d -> 10-d, then cluster X_reduced`;

const codeLib = `from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.pipeline import make_pipeline

# scale -> reduce -> cluster, all fit together
model = make_pipeline(
    StandardScaler(),
    PCA(n_components=0.95),         # keep 95% of the variance
    KMeans(n_clusters=8, n_init=10, random_state=0),
)
labels = model.fit_predict(X)`;


const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };


