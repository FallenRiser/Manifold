import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "Clustering after dimensionality reduction — Manifold",
  description:
    "In high dimensions Euclidean distance loses meaning, so k-means struggles. Reducing dimensions first — PCA, UMAP — sharpens the geometry, speeds things up, and can rescue the clustering entirely.",
};

export default function DimReductionPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-clustering)")}>Clustering</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 6 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        Clustering after dimensionality reduction
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        k-Means leans entirely on Euclidean distance, and Euclidean distance quietly stops being useful
        as dimensions pile up. The standard remedy is to reduce dimensions first — and it does more than
        speed things up.
      </p>

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

        <h2>Three wins at once</h2>
        <ul style={ul}>
          <li><strong>Sharper geometry.</strong> Fewer, more-informative dimensions restore meaningful distances.</li>
          <li><strong>Speed.</strong> k-means is <code>O(n·k·d)</code> — shrinking <em>d</em> from thousands to tens is a direct, large speedup.</li>
          <li><strong>Denoising.</strong> Dropping low-variance directions discards features that were only adding distance noise.</li>
        </ul>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-clustering)", marginBottom: 4 }}>
            Cautions worth keeping
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            Reduction can also <em>destroy</em> the very structure you wanted if you cut too aggressively —
            a cluster separated only along a low-variance direction can vanish under PCA. And clustering
            inside a t-SNE/UMAP plot then reading off cluster sizes is a classic mistake: those embeddings
            preserve neighbourhoods, not distances. Use non-linear embeddings to <em>find</em> structure,
            then validate it back in a faithful space. For text and images, clustering learned embeddings
            (PCA&rsquo;d if needed) is the standard pipeline — the capstone&rsquo;s embedding case shows it end to
            end.
          </p>
        </div>

        <h2>PCA → k-means pipeline</h2>
        <CodeBlock fromScratch={codeScratch} withLibrary={codeLib} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/k-means/categorical-and-mixed-data" style={navLink}>← Categorical &amp; mixed data</Link>
          <Link href="/learn/k-means" style={navLink}>Back to overview →</Link>
        </div>
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

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-clustering) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-clustering) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0" };
