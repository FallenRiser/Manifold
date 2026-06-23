import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "Information criteria (X-means) — Manifold",
  description:
    "X-means turns 'choosing k' into model selection: score each clustering with BIC, which rewards fit but penalises extra centroids, and let the algorithm split clusters until the score stops improving.",
};

export default function XMeansPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-clustering)")}>Clustering</span>
        <span style={chip("var(--c-metrics)")}>Go deeper</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 6 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        Information criteria (X-means)
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        Every method so far sweeps <em>k</em> and judges afterward. X-means flips it: treat clustering as
        model selection, let an information criterion penalise complexity, and have the algorithm{" "}
        <em>discover</em> <em>k</em> by splitting clusters only when it pays.
      </p>

      <div className="lesson">
        <h2>Clustering as model selection</h2>
        <p>
          More clusters always fit the data better — that&rsquo;s the recurring trap. Statistics has a
          standard cure for &ldquo;more parameters always fit better&rdquo;: an <strong>information
          criterion</strong> that adds an explicit penalty for each parameter. Score a clustering by how
          well it explains the data <em>minus</em> a cost for its centroids, and the best <em>k</em>
          becomes a genuine maximum rather than &ldquo;as many as possible.&rdquo;
        </p>

        <h2>BIC: fit minus a complexity tax</h2>
        <p>
          Treat k-means as a simple spherical-Gaussian mixture so it has a likelihood{" "}
          <M>{String.raw`\hat{L}`}</M>. The Bayesian Information Criterion is:
        </p>
        <MathBlock>{String.raw`\mathrm{BIC} = \ln(\hat{L}) - \frac{p}{2}\ln(n)`}</MathBlock>
        <p>
          where <M>{String.raw`p`}</M> is the number of free parameters (it grows with <em>k</em>: each
          cluster needs a centroid) and <M>{String.raw`n`}</M> is the number of points. The first term
          rewards fit; the second is the <strong>tax</strong> on complexity, and crucially it scales with{" "}
          <M>{String.raw`\ln(n)`}</M> — more data justifies more clusters. Pick the <em>k</em> with the
          highest BIC. (AIC uses the same idea with a lighter penalty, <M>{String.raw`-p`}</M>, so it tends
          to choose more clusters.)
        </p>

        <h2>X-means: search instead of sweep</h2>
        <p>
          X-means (Pelleg &amp; Moore, 2000) uses BIC <em>inside</em> the algorithm so you never enumerate
          every <em>k</em>:
        </p>
        <ol style={ol}>
          <li>Run k-means with a small <em>k</em> (say 2).</li>
          <li>
            <strong>Try to split each cluster in two.</strong> Run a local 2-means inside it, then compare
            the BIC of &ldquo;one cluster here&rdquo; vs. &ldquo;two clusters here.&rdquo;
          </li>
          <li>Keep the split only if it raises BIC; otherwise leave the cluster whole.</li>
          <li>Repeat until no split improves the score or you hit a <em>k</em> ceiling.</li>
        </ol>
        <p>
          The result: <em>k</em> emerges from the data, and the search is far cheaper than refitting from
          scratch at every candidate <em>k</em>. G-means is a cousin that decides each split with a
          normality test instead of BIC.
        </p>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-clustering)", marginBottom: 4 }}>
            How it compares
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            Information criteria give a principled, automatic <em>k</em> with a built-in parsimony
            preference — no curve to eyeball, no random references to simulate. The catch is the
            assumption baked in: BIC here models clusters as spherical Gaussians, so on elongated or very
            unequal clusters its parameter count misrepresents the truth and the chosen <em>k</em> can
            mislead. As ever, no single index is the final word — agreement across elbow, silhouette,
            gap, and BIC is the real signal.
          </p>
        </div>

        <h2>Score k with BIC</h2>
        <CodeBlock fromScratch={codeScratch} withLibrary={codeLib} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/k-means/the-gap-statistic" style={navLink}>← The gap statistic</Link>
          <Link href="/learn/k-means" style={navLink}>Back to overview →</Link>
        </div>
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np

def bic_kmeans(X, lab, C):
    n, d = X.shape
    k = len(C)
    # pooled within-cluster variance estimate (spherical Gaussian model)
    var = sum(((X[lab == j] - C[j])**2).sum() for j in range(k)) / (n - k) / d
    # log-likelihood under that model
    ll = 0.0
    for j in range(k):
        n_j = (lab == j).sum()
        if n_j <= 1:
            continue
        ll += (n_j * np.log(n_j) - n_j * np.log(n)
               - n_j * d / 2 * np.log(2 * np.pi * var)
               - (n_j - 1) * d / 2)
    p = k * (d + 1)                       # free parameters: centroids + variance
    return ll - p / 2 * np.log(n)         # higher is better

for k in range(2, 8):
    lab, C = fit_kmeans(X, k)
    print(k, bic_kmeans(X, lab, C))`;

const codeLib = `# scikit-learn's GaussianMixture exposes .bic() and .aic() directly — the same
# model-selection idea, and the most practical "X-means-like" route in sklearn.
from sklearn.mixture import GaussianMixture

scores = {}
for k in range(2, 8):
    gm = GaussianMixture(n_components=k, covariance_type="spherical",
                         random_state=0).fit(X)
    scores[k] = gm.bic(X)                 # lower BIC is better in sklearn's sign

best_k = min(scores, key=scores.get)
print("best k by BIC:", best_k)`;

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const ol: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-clustering) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-clustering) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0" };
