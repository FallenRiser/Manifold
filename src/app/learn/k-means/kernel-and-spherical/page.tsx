import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CLUSTER_SETUP } from "@/lib/runtimeSetup";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Kernel & spherical k-means — Manifold",
  description:
    "Two ways to change the geometry k-means works in: kernel k-means clusters in a high-dimensional feature space to find non-linear groups, and spherical k-means uses cosine distance for text and embeddings.",
};

export default function KernelSphericalPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Clustering", color: "var(--c-clustering)" }, { label: "Variants", color: "var(--c-metrics)" }]}
        time="about 6 minutes"
        title={<>Kernel & spherical k-means</>}
        intro={<>
          The previous variants changed the <em>center</em>. These two change the <em>space</em> — letting
        k-means find non-linear clusters, or cluster by direction instead of magnitude.
        </>}
      />

      <div className="lesson">
        <h2>Kernel k-means: cluster in feature space</h2>
        <p>
          k-Means can only draw straight boundaries — but what if we first map the data into a
          higher-dimensional space where the clusters <em>become</em> linearly separable, then cluster
          there? That&rsquo;s the kernel trick, borrowed from SVMs. Using a kernel{" "}
          <M>{String.raw`K(\mathbf{x}_i, \mathbf{x}_j) = \langle \phi(\mathbf{x}_i), \phi(\mathbf{x}_j)\rangle`}</M>,
          we compute all the distances k-means needs <em>in the feature space</em> without ever forming{" "}
          <M>{String.raw`\phi`}</M> explicitly:
        </p>
        <MathBlock>{String.raw`\lVert \phi(\mathbf{x}) - \phi(\mathbf{y})\rVert^2 = K(\mathbf{x},\mathbf{x}) - 2K(\mathbf{x},\mathbf{y}) + K(\mathbf{y},\mathbf{y})`}</MathBlock>
        <p>
          With an RBF kernel, kernel k-means can carve out rings and other non-convex shapes that defeat
          plain k-means. The cost: it works from an <M>{String.raw`n \times n`}</M> kernel matrix, so it&rsquo;s{" "}
          <M>{String.raw`O(n^2)`}</M> memory and there&rsquo;s no longer an explicit centroid in input space. It&rsquo;s
          closely related to <strong>spectral clustering</strong>, which clusters the eigenvectors of a
          similarity matrix — often the more practical route to the same end.
        </p>

        <h2>Spherical k-means: cluster by direction</h2>
        <p>
          For text (TF-IDF) and many embeddings, <em>which way</em> a vector points matters far more than
          how long it is — two documents on the same topic are similar regardless of length. Spherical
          k-means uses <strong>cosine</strong> similarity instead of Euclidean distance:
        </p>
        <ul style={ul}>
          <li><strong>Normalise</strong> every point to unit length (project onto the unit sphere).</li>
          <li><strong>Assign</strong> by cosine similarity (largest dot product = nearest).</li>
          <li><strong>Update</strong> each centroid to the mean, then re-normalise it back onto the sphere.</li>
        </ul>
        <p>
          On normalised vectors, maximising cosine similarity and minimising squared Euclidean distance
          coincide — so spherical k-means is mathematically close to running k-means on L2-normalised data,
          and it&rsquo;s the standard for high-dimensional, sparse, direction-dominated data.
        </p>

        <Callout color="var(--c-clustering)" title={<>Which to use</>}>
          Non-linear, non-convex clusters in modest <em>n</em> → kernel k-means or spectral clustering.
            Text, TF-IDF, or embeddings where magnitude is noise → spherical k-means (or just L2-normalise
            and run ordinary k-means with cosine). Both keep the familiar alternating loop; they only swap
            in a different geometry. The embedding capstone uses the spherical idea directly.
        </Callout>

        <h2>Both, in practice</h2>
        <CodeBlock setup={CLUSTER_SETUP} fromScratch={codeScratch} withLibrary={codeLib} />

        <PrevNext prev={{ href: "/learn/k-means/fuzzy-c-means", label: <>← Fuzzy c-means</> }} next={{ href: "/learn/k-means/bisecting-k-means", label: <>Next up · Bisecting k-means →</> }} />
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np

# spherical k-means: normalise, assign by cosine, re-normalise centroids
def spherical_kmeans(X, k, iters=50, seed=0):
    Xn = X / np.linalg.norm(X, axis=1, keepdims=True)     # onto unit sphere
    rng = np.random.default_rng(seed)
    C = Xn[rng.choice(len(Xn), k, replace=False)]
    for _ in range(iters):
        labels = (Xn @ C.T).argmax(1)                      # max cosine = nearest
        C = np.array([Xn[labels == j].mean(0) for j in range(k)])
        C /= np.linalg.norm(C, axis=1, keepdims=True)      # back onto the sphere
    return labels, C`;

const codeLib = `import numpy as np
from sklearn.cluster import KMeans, SpectralClustering
from sklearn.preprocessing import normalize

# spherical k-means ≈ k-means on L2-normalised vectors (cosine geometry)
labels = KMeans(n_clusters=8, n_init=10, random_state=0).fit_predict(normalize(X))

# kernel-style non-linear clustering via spectral clustering (RBF affinity)
sc = SpectralClustering(n_clusters=2, affinity="rbf", gamma=2.0,
                        random_state=0).fit_predict(X_rings)`;


const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };


