import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "Bregman divergences — Manifold",
  description:
    "Why does the mean minimise squared distance? Because squared Euclidean distance is a Bregman divergence, and the mean is the minimiser of any Bregman divergence. This generalises k-means to a whole family of 'distances'.",
};

export default function BregmanPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-clustering)")}>Clustering</span>
        <span style={chip("var(--c-metrics)")}>Go deeper</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 7 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        Bregman divergences
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        One question has hovered over the whole track: why <em>the mean</em>? The deepest answer is that
        squared Euclidean distance belongs to a family — Bregman divergences — and the mean is the
        minimiser for <em>every</em> member of it. That&rsquo;s the real reason k-means works.
      </p>

      <div className="lesson">
        <h2>The mean isn&rsquo;t a coincidence</h2>
        <p>
          k-Means assigns by squared distance and updates to the mean, and those two choices fit together
          perfectly — the mean is exactly the point minimising total squared distance. Is that special to
          Euclidean geometry, or part of something bigger? It&rsquo;s part of something bigger.
        </p>

        <h2>What a Bregman divergence is</h2>
        <p>
          Pick any strictly convex function <M>{String.raw`\phi`}</M>. Its <strong>Bregman divergence</strong>
          {" "}measures how far <M>{String.raw`\phi`}</M> at <M>{String.raw`x`}</M> sits above its tangent line
          drawn at <M>{String.raw`y`}</M>:
        </p>
        <MathBlock>{String.raw`D_\phi(x, y) = \phi(x) - \phi(y) - \langle \nabla\phi(y),\, x - y \rangle`}</MathBlock>
        <p>
          It&rsquo;s the gap between the function and its linear approximation — always non-negative (by
          convexity), zero only when <M>{String.raw`x = y`}</M>. Different <M>{String.raw`\phi`}</M> give
          different divergences:
        </p>
        <ul style={ul}>
          <li><M>{String.raw`\phi(x) = \lVert x\rVert^2`}</M> → <strong>squared Euclidean distance</strong> (plain k-means).</li>
          <li><M>{String.raw`\phi(x) = \sum x \log x`}</M> → <strong>KL divergence</strong> (for probability distributions / histograms).</li>
          <li>Other <M>{String.raw`\phi`}</M> → Itakura–Saito (audio spectra), Mahalanobis, and more.</li>
        </ul>
        <p>
          Note a Bregman divergence is generally <em>not</em> a metric — it needn&rsquo;t be symmetric and
          needn&rsquo;t obey the triangle inequality. It&rsquo;s a directed notion of &ldquo;discrepancy,&rdquo; which is all
          k-means actually needs.
        </p>

        <h2>The theorem that ties it together</h2>
        <p>
          Banerjee et al. (2005) proved the key fact: for <em>any</em> Bregman divergence{" "}
          <M>{String.raw`D_\phi`}</M>, the single point minimising the average divergence to a set is{" "}
          their <strong>arithmetic mean</strong> —
        </p>
        <MathBlock>{String.raw`\boldsymbol{\mu} = \arg\min_{c} \; \mathbb{E}\big[D_\phi(\mathbf{x}, c)\big] = \mathbb{E}[\mathbf{x}]`}</MathBlock>
        <p>
          The mean is optimal not because of Euclidean geometry specifically, but because the divergence is
          Bregman. This means the <em>entire</em> k-means machinery — assign to nearest center, update to
          the mean, monotone convergence — works unchanged for <strong>any</strong> Bregman divergence.
          That generalisation is <strong>Bregman clustering</strong>.
        </p>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-clustering)", marginBottom: 4 }}>
            Why this is the satisfying ending
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            It answers the &ldquo;why the mean?&rdquo; question at the root, and it converts the choice of distance
            into a modelling decision: pick the divergence that matches your data&rsquo;s noise, and the mean is
            automatically the right center. Clustering histograms or distributions? Use KL — that&rsquo;s
            Bregman clustering with the entropy <M>{String.raw`\phi`}</M>, and the centroid is still just the
            average. k-Means was a special case of EM; here it&rsquo;s also a special case of Bregman clustering.
            Same algorithm, one rung more general.
          </p>
        </div>

        <h2>Same loop, swappable divergence</h2>
        <CodeBlock fromScratch={codeScratch} withLibrary={codeLib} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/k-means/coordinate-descent" style={navLink}>← Convergence as coordinate descent</Link>
          <Link href="/learn/k-means/when-to-use-k-means" style={{ ...navLink, fontWeight: 600 }}>Next up · When to use k-means →</Link>
        </div>
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np

# Bregman clustering: the ONLY change from k-means is the divergence in the assign
# step. The update step is the mean either way (that's the theorem).

def sq_euclid(X, c):                       # phi(x) = ||x||^2  -> ordinary k-means
    return ((X - c)**2).sum(1)

def kl_div(X, c):                          # phi(x) = sum x log x -> KL (for distributions)
    return (X * (np.log(X + 1e-12) - np.log(c + 1e-12))).sum(1) - (X - c).sum(1)

def bregman_kmeans(X, k, divergence, iters=50, seed=0):
    rng = np.random.default_rng(seed)
    C = X[rng.choice(len(X), k, replace=False)]
    for _ in range(iters):
        labels = np.argmin([divergence(X, c) for c in C], axis=0)
        C = np.array([X[labels == j].mean(0) for j in range(k)])   # mean is optimal
    return labels, C`;

const codeLib = `# scikit-learn's KMeans is the squared-Euclidean (default) Bregman case.
# For KL-style clustering of distributions, NMF or topic models are the common tools;
# Bregman clustering itself is usually hand-rolled around the loop above.
from sklearn.cluster import KMeans
labels = KMeans(n_clusters=4, n_init=10, random_state=0).fit_predict(X)  # phi = ||x||^2`;

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-clustering) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-clustering) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0" };
