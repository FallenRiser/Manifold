import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "Kernel & spherical k-means — Manifold",
  description:
    "Two ways to change the geometry k-means works in: kernel k-means clusters in a high-dimensional feature space to find non-linear groups, and spherical k-means uses cosine distance for text and embeddings.",
};

export default function KernelSphericalPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-clustering)")}>Clustering</span>
        <span style={chip("var(--c-metrics)")}>Variants</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 6 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        Kernel & spherical k-means
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        The previous variants changed the <em>center</em>. These two change the <em>space</em> — letting
        k-means find non-linear clusters, or cluster by direction instead of magnitude.
      </p>

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

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-clustering)", marginBottom: 4 }}>
            Which to use
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            Non-linear, non-convex clusters in modest <em>n</em> → kernel k-means or spectral clustering.
            Text, TF-IDF, or embeddings where magnitude is noise → spherical k-means (or just L2-normalise
            and run ordinary k-means with cosine). Both keep the familiar alternating loop; they only swap
            in a different geometry. The embedding capstone uses the spherical idea directly.
          </p>
        </div>

        <h2>Both, in practice</h2>
        <CodeBlock fromScratch={codeScratch} withLibrary={codeLib} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/k-means/fuzzy-c-means" style={navLink}>← Fuzzy c-means</Link>
          <Link href="/learn/k-means/bisecting-k-means" style={{ ...navLink, fontWeight: 600 }}>Next up · Bisecting k-means →</Link>
        </div>
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

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-clustering) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-clustering) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0" };
