import { CodeBlock } from "@/components/CodeBlock";
import { CLUSTER_SETUP } from "@/lib/runtimeSetup";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "k-medoids (PAM) — Manifold",
  description:
    "k-medoids uses actual data points as cluster centers and minimises total distance, not squared distance. That makes it robust to outliers and usable with any distance metric — at a higher cost.",
};

export default function KMedoidsPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Clustering", color: "var(--c-clustering)" }, { label: "Variants", color: "var(--c-metrics)" }]}
        time="about 6 minutes"
        title={<>k-medoids (PAM)</>}
        intro={<>
          Change one thing about k-means — make the center an actual data point instead of a mean — and you
        get an algorithm that shrugs off outliers and works with <em>any</em> distance you can define.
        </>}
      />

      <div className="lesson">
        <h2>Medoid, not mean</h2>
        <p>
          A <strong>medoid</strong> is the most central <em>actual member</em> of a cluster — the point
          whose total distance to all the others is smallest. k-medoids represents each cluster by its
          medoid and minimises the sum of distances from points to their medoid:
        </p>
        <ul style={ul}>
          <li>k-means center = the <em>mean</em> (a synthetic point, possibly where no data is).</li>
          <li>k-medoids center = a <em>medoid</em> (always a real data point).</li>
          <li>k-means minimises squared distance; k-medoids minimises plain (often absolute) distance.</li>
        </ul>

        <h2>Why this matters</h2>
        <ul style={ul}>
          <li>
            <strong>Robust to outliers.</strong> A medoid can&rsquo;t be dragged off into empty space the way a
            mean can — it must stay on a real point. Combined with non-squared distance, extreme values
            have far less pull.
          </li>
          <li>
            <strong>Any distance metric.</strong> k-means needs a mean, which only makes sense in Euclidean
            space. k-medoids needs only a distance <em>matrix</em>, so you can use Manhattan, cosine, edit
            distance, Gower (mixed data) — anything. This is its biggest practical advantage.
          </li>
          <li>
            <strong>Interpretable centers.</strong> The center is a genuine example (a real customer, a
            real document), which is often more useful than an average.
          </li>
        </ul>

        <h2>PAM and its faster cousins</h2>
        <p>
          <strong>PAM</strong> (Partitioning Around Medoids) is the classic algorithm: start with k
          medoids, then repeatedly try swapping a medoid with a non-medoid and keep the swap if it lowers
          total cost. It&rsquo;s thorough but expensive — each iteration considers <code>k·(n−k)</code> swaps,
          each costing <code>O(n)</code>, so it&rsquo;s roughly <code>O(k(n−k)²)</code> per iteration. For large
          data, <strong>CLARA</strong> runs PAM on samples and <strong>CLARANS</strong> / <strong>FasterPAM</strong>
          {" "}cut the cost dramatically.
        </p>

        <Callout color="var(--c-clustering)" title={<>The trade in one line</>}>
          k-medoids buys robustness, metric flexibility, and real-example centers — at a meaningfully
            higher computational cost than k-means. Use it when your distance isn&rsquo;t Euclidean, your data
            has outliers, or you need the center to be an actual record; stick with k-means when it&rsquo;s
            plain numeric data at scale.
        </Callout>

        <h2>From the swap rule to the library</h2>
        <CodeBlock setup={CLUSTER_SETUP} fromScratch={codeScratch} withLibrary={codeLib} />

        <PrevNext prev={{ href: "/learn/k-means/vs-dbscan-gmm-hierarchical", label: <>← k-means vs DBSCAN, GMM, hierarchical</> }} next={{ href: "/learn/k-means/k-medians-and-k-modes", label: <>Next up · k-medians &amp; k-modes →</> }} />
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np

def kmedoids(D, k, iters=100):
    # D is an n x n distance matrix — ANY metric you like
    n = len(D)
    medoids = np.arange(k)                      # start: first k points
    for _ in range(iters):
        labels = D[:, medoids].argmin(1)        # assign to nearest medoid
        improved = False
        for j in range(k):                      # try to improve each medoid
            members = np.where(labels == j)[0]
            costs = D[np.ix_(members, members)].sum(0)   # total intra-cluster distance
            best = members[costs.argmin()]      # most central member
            if best != medoids[j]:
                medoids[j] = best; improved = True
        if not improved:
            break
    return medoids, D[:, medoids].argmin(1)`;

const codeLib = `from sklearn_extra.cluster import KMedoids   # pip install scikit-learn-extra

# metric can be 'euclidean', 'manhattan', 'cosine', or a precomputed matrix
km = KMedoids(n_clusters=4, metric="manhattan", method="pam",
              random_state=0).fit(X)
print(km.medoid_indices_)        # indices of the chosen real data points`;


const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };


