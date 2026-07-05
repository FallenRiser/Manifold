import { CodeBlock } from "@/components/CodeBlock";
import { CLUSTER_SETUP } from "@/lib/runtimeSetup";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Bisecting k-means — Manifold",
  description:
    "Bisecting k-means builds clusters top-down: start with everything in one cluster, then repeatedly split the worst cluster in two. It blends k-means' speed with hierarchical structure.",
};

export default function BisectingPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Clustering", color: "var(--c-clustering)" }, { label: "Variants", color: "var(--c-metrics)" }]}
        time="about 5 minutes"
        title={<>Bisecting k-means</>}
        intro={<>
          Instead of placing all <em>k</em> centroids at once, build the clustering one split at a time. The
        result is a method that&rsquo;s often faster, more stable, and gives you a hierarchy for free.
        </>}
      />

      <div className="lesson">
        <h2>Top-down, one split at a time</h2>
        <p>It&rsquo;s divisive hierarchical clustering powered by k-means:</p>
        <ol style={ol}>
          <li>Start with <strong>all</strong> points in a single cluster.</li>
          <li>Pick a cluster to split — usually the one with the highest inertia (the worst-fitting).</li>
          <li>Run ordinary <strong>2-means</strong> on just that cluster, splitting it in two. Try the split a few times and keep the best.</li>
          <li>Repeat until you have <em>k</em> clusters.</li>
        </ol>
        <p>
          Each step is a tiny, cheap 2-means on a subset, and the sequence of splits forms a binary tree —
          a dendrogram you can cut at any level.
        </p>

        <h2>Why it often beats plain k-means</h2>
        <ul style={ul}>
          <li>
            <strong>Less sensitive to initialisation.</strong> You only ever seed two centroids at a time,
            which is far easier to get right than seeding all <em>k</em> at once — so it tends to avoid the
            bad global minima plain k-means falls into.
          </li>
          <li>
            <strong>Often faster.</strong> Most splits operate on small subsets, and a sequence of
            2-means runs can beat one big k-means, especially for large <em>k</em>.
          </li>
          <li>
            <strong>Free hierarchy.</strong> The split tree shows how clusters relate and lets you choose
            the granularity after the fact — without the <code>O(n²)</code> cost of classic
            agglomerative clustering.
          </li>
          <li>
            <strong>More even clusters.</strong> Always splitting the worst cluster tends to produce more
            balanced sizes than standard k-means.
          </li>
        </ul>

        <Callout color="var(--c-clustering)" title={<>Where it sits</>}>
          Bisecting k-means is a sweet spot between flat k-means and full hierarchical clustering: it
            keeps k-means&rsquo; linear-time character while giving you a tree and better stability. It still
            inherits the spherical-cluster assumption (every split is a straight 2-means cut), so it
            doesn&rsquo;t rescue non-convex shapes — but for large, roughly-blobby data where you want hierarchy
            cheaply, it&rsquo;s an excellent default. scikit-learn ships it as <code>BisectingKMeans</code>.
        </Callout>

        <h2>The split loop</h2>
        <CodeBlock setup={CLUSTER_SETUP} fromScratch={codeScratch} withLibrary={codeLib} />

        <PrevNext prev={{ href: "/learn/k-means/kernel-and-spherical", label: <>← Kernel &amp; spherical k-means</> }} next={{ href: "/learn/k-means/k-means-as-em", label: <>Next up · k-means as EM (link to GMM) →</> }} />
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np

def bisecting_kmeans(X, k, n_trials=5):
    clusters = [np.arange(len(X))]            # start: one cluster with all points
    while len(clusters) < k:
        # pick the cluster with the highest inertia to split
        sse = [((X[c] - X[c].mean(0))**2).sum() for c in clusters]
        worst = clusters.pop(int(np.argmax(sse)))
        # best 2-means split of that cluster over a few trials
        best = min((two_means(X[worst]) for _ in range(n_trials)),
                   key=lambda s: s[1])         # (labels, inertia)
        labels = best[0]
        clusters += [worst[labels == 0], worst[labels == 1]]
    return clusters`;

const codeLib = `from sklearn.cluster import BisectingKMeans

# bisecting_strategy="largest_cluster" or "biggest_inertia" (the default)
bk = BisectingKMeans(n_clusters=8, bisecting_strategy="biggest_inertia",
                     random_state=0).fit(X)
print(bk.labels_)`;


const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const ol: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };


