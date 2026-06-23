import Link from "next/link";

export const metadata = {
  title: "When to use k-means — Manifold",
  description:
    "A practical decision guide: the checklist that says k-means is the right tool, the red flags that say it isn't, and the workflow that gets a trustworthy clustering every time.",
};

export default function WhenToUsePage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-clustering)")}>Clustering</span>
        <span style={chip("var(--c-metrics)")}>In the wild</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 6 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        When to use k-means
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        You now know how k-means works, why it converges, and every way it breaks. This page distils all
        of it into a decision: <em>should you reach for k-means on this problem, and how do you run it
        well?</em>
      </p>

      <div className="lesson">
        <h2>Green lights — k-means is a great fit</h2>
        <ul style={ul}>
          <li><strong>Numeric features</strong> you can sensibly average and measure with Euclidean distance.</li>
          <li><strong>Clusters you expect to be roughly round</strong> and comparable in size and spread.</li>
          <li><strong>Large datasets</strong> — its linear <code>O(nkd)</code> cost shines where hierarchical or spectral methods choke.</li>
          <li><strong>You have a sense of <em>k</em></strong>, or are willing to choose it (elbow, silhouette, gap, BIC).</li>
          <li><strong>You need speed</strong> — for a quick baseline, exploratory pass, or a vector quantizer.</li>
        </ul>

        <h2>Red flags — reach for something else</h2>
        <ul style={ul}>
          <li><strong>Non-spherical structure</strong> (rings, moons, manifolds) → DBSCAN, spectral, or kernel k-means.</li>
          <li><strong>Very unequal sizes or densities</strong>, or you want soft membership → Gaussian mixture.</li>
          <li><strong>Real noise / outliers</strong> you want labelled as noise → DBSCAN / HDBSCAN.</li>
          <li><strong>Categorical or mixed data</strong> → k-modes / k-prototypes, or Gower + k-medoids.</li>
          <li><strong>Unknown <em>k</em> and nested structure</strong> → hierarchical clustering (read the tree).</li>
          <li><strong>A non-Euclidean distance</strong> is the natural one → k-medoids with that metric.</li>
        </ul>

        <h2>The workflow that works every time</h2>
        <ol style={ol}>
          <li><strong>Understand &amp; clean.</strong> Plot the data; handle missing values; decide what outliers mean for your problem.</li>
          <li><strong>Scale.</strong> Standardize (or robust-scale) — the single most important and most forgotten step.</li>
          <li><strong>Reduce if high-dimensional.</strong> PCA (or UMAP) to sharpen distances and speed things up.</li>
          <li><strong>Choose <em>k</em>.</strong> Cross-check elbow, silhouette, and the gap statistic — agreement is the signal.</li>
          <li><strong>Seed well, restart.</strong> k-means++ initialisation with a few <code>n_init</code> restarts.</li>
          <li><strong>Validate.</strong> Internal metrics, stability across resamples, and — crucially — a human sanity check that the clusters mean something.</li>
          <li><strong>Profile &amp; act.</strong> Describe each cluster in domain terms; that interpretation is the actual deliverable.</li>
        </ol>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-clustering)", marginBottom: 4 }}>
            The mindset
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            Clustering is <em>unsupervised</em> — there&rsquo;s no answer key, so a result that looks clean can
            still be meaningless. k-Means will <em>always</em> return <em>k</em> clusters, even on
            structureless noise. Treat its output as a hypothesis to be validated and interpreted, never a
            fact. The judgement of whether a clustering is <em>useful</em> is yours, not the algorithm&rsquo;s.
          </p>
        </div>

        <h2>Three real cases, end to end</h2>
        <p>
          The final three pages put the whole workflow to work on genuinely different data — pixels, an
          analytics table, and learned embeddings — each surfacing a different lesson from this track:
        </p>
        <ul style={ul}>
          <li><Link href="/learn/k-means/case-image-quantization" style={inlineLink}>Case A — image colour quantization</Link>: k-means as a vector quantizer; clustering pixels in colour space.</li>
          <li><Link href="/learn/k-means/case-customer-segmentation" style={inlineLink}>Case B — customer segmentation</Link>: the full scale → choose-k → profile pipeline on tabular data.</li>
          <li><Link href="/learn/k-means/case-clustering-embeddings" style={inlineLink}>Case C — clustering embeddings</Link>: high-dimensional vectors, cosine geometry, and the modern workflow.</li>
        </ul>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/k-means/bregman-divergences" style={navLink}>← Bregman divergences</Link>
          <Link href="/learn/k-means/case-image-quantization" style={{ ...navLink, fontWeight: 600 }}>Next up · Case A: image colour quantization →</Link>
        </div>
      </div>
    </article>
  );
}

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const ol: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.85 };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const inlineLink: React.CSSProperties = { color: "var(--brand)", textDecoration: "none", fontWeight: 500 };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-clustering) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-clustering) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0" };
