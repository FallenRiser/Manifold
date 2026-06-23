import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "Internal metrics — Manifold",
  description:
    "When you have no labels, you judge clusters by their own geometry: tight inside, far apart outside. Calinski–Harabasz and Davies–Bouldin turn that intuition into scores.",
};

export default function InternalMetricsPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-clustering)")}>Clustering</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 6 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        Internal metrics
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        Clustering is unsupervised — usually there&rsquo;s no ground truth to check against. Internal
        metrics judge a clustering by its own shape alone, formalising a single instinct: tight inside,
        well separated outside.
      </p>

      <div className="lesson">
        <h2>The universal trade-off</h2>
        <p>
          Every internal metric balances two quantities:
        </p>
        <ul style={ul}>
          <li><strong>Cohesion</strong> — how tight each cluster is (small within-cluster spread).</li>
          <li><strong>Separation</strong> — how far apart different clusters are (large between-cluster distance).</li>
        </ul>
        <p>
          Good clustering maximises separation relative to cohesion. The metrics differ only in how
          they combine the two — and silhouette (its own page) is one of them, working at the per-point
          level.
        </p>

        <h2>Calinski–Harabasz (variance ratio)</h2>
        <p>
          Also called the variance-ratio criterion, it&rsquo;s the ratio of between-cluster dispersion to
          within-cluster dispersion, scaled by the degrees of freedom:
        </p>
        <MathBlock>{String.raw`\mathrm{CH} = \frac{\mathrm{tr}(B_k)}{\mathrm{tr}(W_k)} \cdot \frac{n - k}{k - 1}`}</MathBlock>
        <p>
          <M>{String.raw`\mathrm{tr}(B_k)`}</M> measures how far the cluster centroids spread from the global
          mean; <M>{String.raw`\mathrm{tr}(W_k)`}</M> is the familiar within-cluster scatter (inertia).{" "}
          <strong>Higher is better.</strong> It&rsquo;s cheap — no pairwise distances, unlike silhouette&rsquo;s{" "}
          <M>{String.raw`O(n^2)`}</M> — so it&rsquo;s the go-to for large datasets.
        </p>

        <h2>Davies–Bouldin</h2>
        <p>
          For each cluster, find its <em>worst</em> rival — the other cluster that is most similar
          (closest centroids relative to their combined spread) — and average that worst case over all
          clusters:
        </p>
        <MathBlock>{String.raw`\mathrm{DB} = \frac{1}{k}\sum_{i=1}^{k} \max_{j \neq i} \frac{\sigma_i + \sigma_j}{d(\mu_i, \mu_j)}`}</MathBlock>
        <p>
          where <M>{String.raw`\sigma_i`}</M> is cluster <M>{String.raw`i`}</M>&rsquo;s average spread and{" "}
          <M>{String.raw`d(\mu_i,\mu_j)`}</M> is the distance between centroids. Here{" "}
          <strong>lower is better</strong> — zero would mean infinitely separated, infinitely tight
          clusters. It&rsquo;s also cheap, using only centroids and spreads.
        </p>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-clustering)", marginBottom: 4 }}>
            What they all share — and miss
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            Every one of these rewards compact, well-separated, roughly convex clusters — which is
            exactly what k-means produces. That makes them circular if you use them to &ldquo;prove&rdquo;
            k-means did well: they share its blind spots. On rings, crescents, or wildly unequal
            densities, a high CH or low DB can still describe a clustering that&rsquo;s visibly wrong. Use
            them to compare runs and pick <em>k</em>, not to validate the method choice itself.
          </p>
        </div>

        <h2>Compute all three</h2>
        <CodeBlock fromScratch={codeScratch} withLibrary={codeLib} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/k-means/information-criteria-x-means" style={navLink}>← Information criteria (X-means)</Link>
          <Link href="/learn/k-means/external-metrics" style={{ ...navLink, fontWeight: 600 }}>Next up · External metrics (ARI, NMI) →</Link>
        </div>
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np

def calinski_harabasz(X, lab):
    n, k = len(X), len(set(lab))
    mu = X.mean(0)
    Bk = sum(len(X[lab == j]) * ((X[lab == j].mean(0) - mu)**2).sum() for j in set(lab))
    Wk = sum(((X[lab == j] - X[lab == j].mean(0))**2).sum() for j in set(lab))
    return (Bk / Wk) * (n - k) / (k - 1)

def davies_bouldin(X, lab):
    ks = sorted(set(lab))
    mu = {j: X[lab == j].mean(0) for j in ks}
    sig = {j: np.sqrt(((X[lab == j] - mu[j])**2).sum(1)).mean() for j in ks}
    return np.mean([max((sig[i] + sig[j]) / np.linalg.norm(mu[i] - mu[j])
                        for j in ks if j != i) for i in ks])`;

const codeLib = `from sklearn.metrics import (calinski_harabasz_score,
                             davies_bouldin_score, silhouette_score)
from sklearn.cluster import KMeans

lab = KMeans(n_clusters=4, n_init=10, random_state=0).fit_predict(X)
print("CH (higher better): ", calinski_harabasz_score(X, lab))
print("DB (lower  better): ", davies_bouldin_score(X, lab))
print("silhouette         :", silhouette_score(X, lab))`;

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-clustering) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-clustering) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0" };
