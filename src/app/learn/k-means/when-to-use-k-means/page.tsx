import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "When to use k-means — Manifold",
  description:
    "A practical decision guide: the checklist that says k-means is the right tool, the red flags that say it isn't, and the workflow that gets a trustworthy clustering every time.",
};

export default function WhenToUsePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Clustering", color: "var(--c-clustering)" }, { label: "In the wild", color: "var(--c-metrics)" }]}
        time="about 6 minutes"
        title={<>When to use k-means</>}
        intro={<>
          You now know how k-means works, why it converges, and every way it breaks. This page distils all
        of it into a decision: <em>should you reach for k-means on this problem, and how do you run it
        well?</em>
        </>}
      />

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

        <Callout color="var(--c-clustering)" title={<>The mindset</>}>
          Clustering is <em>unsupervised</em> — there&rsquo;s no answer key, so a result that looks clean can
            still be meaningless. k-Means will <em>always</em> return <em>k</em> clusters, even on
            structureless noise. Treat its output as a hypothesis to be validated and interpreted, never a
            fact. The judgement of whether a clustering is <em>useful</em> is yours, not the algorithm&rsquo;s.
        </Callout>

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

        <PrevNext prev={{ href: "/learn/k-means/bregman-divergences", label: <>← Bregman divergences</> }} next={{ href: "/learn/k-means/case-image-quantization", label: <>Next up · Case A: image colour quantization →</> }} />
      </div>
    </article>
  );
}

const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const ol: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.85 };
const inlineLink: React.CSSProperties = { color: "var(--brand)", textDecoration: "none", fontWeight: 500 };
