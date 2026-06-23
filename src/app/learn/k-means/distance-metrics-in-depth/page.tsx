import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "Distance metrics in depth — Manifold",
  description:
    "Euclidean is just one way to measure 'far apart'. Manhattan, Minkowski, cosine, Mahalanobis — each encodes a different idea of similarity, and the choice quietly determines what your clusters mean.",
};

export default function DistanceMetricsPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-clustering)")}>Clustering</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 7 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        Distance metrics in depth
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        &ldquo;Nearest&rdquo; only means something once you fix a notion of distance. k-Means defaults to
        Euclidean, but that&rsquo;s a <em>choice</em> — and several alternatives encode genuinely different
        ideas of what makes two things similar.
      </p>

      <div className="lesson">
        <h2>The Minkowski family</h2>
        <p>
          Most common metrics are special cases of the Minkowski distance, parameterised by{" "}
          <M>{String.raw`p`}</M>:
        </p>
        <MathBlock>{String.raw`d_p(\mathbf{x},\mathbf{y}) = \left( \sum_i |x_i - y_i|^p \right)^{1/p}`}</MathBlock>
        <ul style={ul}>
          <li>
            <strong>Euclidean (p = 2).</strong> Straight-line distance. The default for k-means — it pairs
            with the mean and squared distance to give the inertia objective. Sensitive to large deviations
            because differences are squared.
          </li>
          <li>
            <strong>Manhattan (p = 1).</strong> Sum of absolute differences (&ldquo;city-block&rdquo;). More
            robust to outliers, and the metric behind k-medians. Often better in high dimensions.
          </li>
          <li>
            <strong>Chebyshev (p → ∞).</strong> The single largest coordinate difference dominates. Useful
            when any one feature being far off should count as &ldquo;far.&rdquo;
          </li>
        </ul>

        <h2>Cosine — direction, not magnitude</h2>
        <p>
          Cosine &ldquo;distance&rdquo; measures the angle between two vectors, ignoring their lengths:
        </p>
        <MathBlock>{String.raw`\text{cosine sim} = \frac{\mathbf{x}\cdot\mathbf{y}}{\lVert\mathbf{x}\rVert\,\lVert\mathbf{y}\rVert}`}</MathBlock>
        <p>
          For text (TF-IDF) and embeddings, two items on the same topic should count as similar even if one
          is much &ldquo;bigger&rdquo; — a long document and a short one about the same subject point the same
          way. On unit-normalised vectors, cosine and Euclidean rank neighbours identically, which is why{" "}
          <Link href="/learn/k-means/kernel-and-spherical" style={inlineLink}>spherical k-means</Link> is
          just k-means on normalised data.
        </p>

        <h2>Mahalanobis — distance that respects correlation</h2>
        <p>
          Euclidean distance treats every direction equally. <strong>Mahalanobis</strong> distance rescales
          by the data&rsquo;s covariance <M>{String.raw`\Sigma`}</M>, so it stretches along low-variance directions
          and shrinks along high-variance ones:
        </p>
        <MathBlock>{String.raw`d_M(\mathbf{x},\mathbf{y}) = \sqrt{(\mathbf{x}-\mathbf{y})^\top \Sigma^{-1} (\mathbf{x}-\mathbf{y})}`}</MathBlock>
        <p>
          It effectively measures distance in &ldquo;standard-deviation&rdquo; units and accounts for correlated
          features. Standardizing your data and using Euclidean distance is a simplified version of this
          idea (the diagonal-covariance case).
        </p>

        <h2>Discrete and mixed data</h2>
        <ul style={ul}>
          <li><strong>Hamming / mismatch</strong> — count of differing attributes, for categorical data (the basis of k-modes).</li>
          <li><strong>Jaccard</strong> — overlap of sets, for binary/presence data.</li>
          <li><strong>Gower</strong> — a per-feature blend that handles numeric + categorical + binary together.</li>
        </ul>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-clustering)", marginBottom: 4 }}>
            The catch for k-means specifically
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            k-Means is wedded to <em>squared Euclidean</em> distance — that&rsquo;s what makes the mean the
            optimal centroid and guarantees convergence (the deep reason is{" "}
            <Link href="/learn/k-means/bregman-divergences" style={inlineLink}>Bregman divergences</Link>).
            You can&rsquo;t simply swap in cosine or Manhattan and keep the mean update. To use a different
            metric you switch algorithms: k-medoids (any metric), k-medians (L1), spherical k-means (cosine),
            k-modes (categorical). Choosing the distance is really choosing the method.
          </p>
        </div>

        <h2>Compute several at once</h2>
        <CodeBlock fromScratch={codeScratch} withLibrary={codeLib} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/k-means/similarity-and-distance" style={navLink}>← Similarity &amp; distance</Link>
          <Link href="/learn/k-means/the-curse-of-dimensionality" style={{ ...navLink, fontWeight: 600 }}>Next up · The curse of dimensionality →</Link>
        </div>
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np

def minkowski(x, y, p):  return (np.abs(x - y)**p).sum()**(1/p)   # p=1 L1, p=2 L2
def cosine_dist(x, y):   return 1 - x @ y / (np.linalg.norm(x) * np.linalg.norm(y))
def hamming(x, y):       return (x != y).mean()                    # categorical

x, y = np.array([1.0, 2.0, 3.0]), np.array([4.0, 0.0, 3.0])
print("euclidean:", minkowski(x, y, 2))
print("manhattan:", minkowski(x, y, 1))
print("cosine   :", cosine_dist(x, y))`;

const codeLib = `from scipy.spatial.distance import cdist
import numpy as np

X = np.random.default_rng(0).normal(size=(5, 3))
for metric in ["euclidean", "cityblock", "cosine", "chebyshev"]:
    D = cdist(X, X, metric=metric)      # pairwise distance matrix
    print(metric, D[0, 1])

# Mahalanobis needs the (inverse) covariance:
VI = np.linalg.inv(np.cov(X.T))
print("mahalanobis", cdist(X[:1], X[1:2], metric="mahalanobis", VI=VI)[0, 0])`;

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const inlineLink: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-clustering) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-clustering) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0" };
