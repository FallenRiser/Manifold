import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "Case C: clustering embeddings — Manifold",
  description:
    "The modern use of k-means: group documents, images, or users by clustering their learned embedding vectors. High dimensions, cosine geometry, and every lesson from this track come together.",
};

export default function CaseEmbeddingsPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-clustering)")}>Clustering</span>
        <span style={chip("var(--c-metrics)")}>In the wild · Case C</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 9 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        Case C: clustering embeddings
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        The final case is how k-means shows up in modern ML: take text, images, or users, turn each into
        an <strong>embedding</strong> vector, and cluster those. It pulls together scaling, cosine
        geometry, dimensionality, and evaluation — every thread of this track at once.
      </p>

      <div className="lesson">
        <h2>Why embeddings change the game</h2>
        <p>
          A neural model (a sentence transformer, an image encoder) maps each item to a dense vector —
          often 384, 768, or more dimensions — where <strong>distance encodes meaning</strong>: similar
          documents land near each other. Suddenly k-means becomes a topic discoverer, a deduplicator, an
          image organiser. You&rsquo;re not clustering raw features anymore; you&rsquo;re clustering learned{" "}
          <em>semantics</em>.
        </p>

        <h2>The workflow, lesson by lesson</h2>
        <ol style={ol}>
          <li>
            <strong>Embed.</strong> Run your items through the encoder to get vectors (e.g. a 768-D vector
            per document).
          </li>
          <li>
            <strong>Normalise to unit length.</strong> For embeddings, <em>direction</em> carries the
            meaning, not magnitude — so use <strong>cosine</strong> geometry. L2-normalising the vectors
            and running ordinary k-means is exactly{" "}
            <Link href="/learn/k-means/kernel-and-spherical" style={inlineLink}>spherical k-means</Link>,
            the standard choice here.
          </li>
          <li>
            <strong>Reduce dimensions (often).</strong> 768-D triggers the curse of dimensionality and is
            slow. <Link href="/learn/k-means/clustering-after-dimensionality-reduction" style={inlineLink}>PCA
            to ~50 dimensions</Link> first sharpens distances and speeds the fit; UMAP is common for
            visualising the result.
          </li>
          <li>
            <strong>Choose k.</strong> Silhouette (on the cosine/reduced space) plus the eternal
            domain-knowledge check: how many topics do you actually expect?
          </li>
          <li>
            <strong>Seed &amp; scale up.</strong> k-means++ seeding; <code>MiniBatchKMeans</code> when you have
            millions of vectors.
          </li>
          <li>
            <strong>Interpret.</strong> For each cluster, pull the items nearest its centroid — the most
            representative examples — and read off the theme. Those exemplars are how you label clusters.
          </li>
        </ol>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-clustering)", marginBottom: 4 }}>
            Why k-means specifically, in 2026
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            With millions of high-dimensional vectors, k-means&rsquo; linear <code>O(nkd)</code> cost is exactly
            why it&rsquo;s the workhorse for embedding clustering — hierarchical and spectral methods don&rsquo;t scale
            there. Embedding spaces also tend to be more k-means-friendly than raw data: a good encoder
            already pulls semantically similar items into compact, roughly-convex neighbourhoods, so the
            spherical-cluster assumption holds far better than it would on the original pixels or tokens.
            The representation does the hard work; k-means does the cheap, scalable grouping.
          </p>
        </div>

        <h2>When to step beyond k-means here</h2>
        <p>
          If clusters overlap heavily or vary wildly in size, a GMM on the reduced vectors gives softer,
          more honest membership. If you don&rsquo;t know <em>k</em> and expect noise/outliers (many real
          corpora have a long tail of one-off items), <strong>HDBSCAN</strong> on the UMAP projection is a
          popular modern alternative — it&rsquo;s the engine behind topic-modelling tools like BERTopic. k-means
          remains the fast, strong baseline you should always try first.
        </p>

        <h2>Embedding clustering, end to end</h2>
        <CodeBlock fromScratch={codeScratch} withLibrary={codeLib} />

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px", margin: "1.6rem 0" }}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)", marginBottom: 6 }}>You&rsquo;ve reached the end of the k-means track</div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14, lineHeight: 1.6 }}>
            From &ldquo;what is clustering?&rdquo; to inertia, Lloyd&rsquo;s algorithm, convergence, k-means++, choosing{" "}
            <em>k</em>, every failure mode, the whole variant family, the theory (NP-hardness, coordinate
            descent, Bregman), and three real cases — you now understand k-means the way you understand
            linear regression: from the inside out.
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/k-means/case-customer-segmentation" style={navLink}>← Case B: customer segmentation</Link>
          <Link href="/learn/k-means" style={navLink}>Back to overview →</Link>
        </div>
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np

# vectors: (n, d) embeddings from any encoder. Direction = meaning -> normalise.
def l2_normalize(V):
    return V / np.linalg.norm(V, axis=1, keepdims=True)

Xn = l2_normalize(embeddings)          # spherical k-means = k-means on unit vectors
labels, centroids = fit_kmeans(Xn, k=20)   # your k-means (cosine geometry now)

# label each cluster by its most representative items (nearest the centroid)
for j in range(20):
    members = np.where(labels == j)[0]
    sims = Xn[members] @ centroids[j]
    exemplars = members[np.argsort(-sims)[:5]]
    print(f"cluster {j}:", [texts[i] for i in exemplars])`;

const codeLib = `from sentence_transformers import SentenceTransformer
from sklearn.preprocessing import normalize
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans

emb = SentenceTransformer("all-MiniLM-L6-v2").encode(docs)   # (n, 384)
Xn  = normalize(emb)                                          # cosine geometry
Xr  = PCA(n_components=50, random_state=0).fit_transform(Xn)  # tame dimensionality

km = KMeans(n_clusters=20, n_init=10, random_state=0).fit(Xr)
# nearest docs to each centroid = that topic's representative examples
import numpy as np
for j in range(20):
    idx = np.argsort(np.linalg.norm(Xr - km.cluster_centers_[j], axis=1))[:5]
    print(j, [docs[i][:60] for i in idx])`;

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const ol: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.85 };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const inlineLink: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-clustering) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-clustering) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0" };
