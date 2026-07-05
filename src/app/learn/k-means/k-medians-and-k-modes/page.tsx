import { CodeBlock } from "@/components/CodeBlock";
import { CLUSTER_SETUP } from "@/lib/runtimeSetup";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "k-medians & k-modes — Manifold",
  description:
    "Swap the mean for a median (robust, L1) or a mode (categorical) and the same assign/update loop becomes a different algorithm. Two more members of the k-means family.",
};

export default function KMediansModesPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Clustering", color: "var(--c-clustering)" }, { label: "Variants", color: "var(--c-metrics)" }]}
        time="about 5 minutes"
        title={<>k-medians & k-modes</>}
        intro={<>
          Once you see k-means as &ldquo;assign to nearest center, recompute center,&rdquo; the recipe generalises.
        Change <em>what the center is</em> and you get a new algorithm tuned for a different kind of data.
        </>}
      />

      <div className="lesson">
        <h2>The pattern</h2>
        <p>
          The center should be whatever point minimises the distance used. That single principle links the
          whole family:
        </p>
        <ul style={ul}>
          <li><strong>k-means:</strong> squared Euclidean (L2²) → center is the <em>mean</em>.</li>
          <li><strong>k-medians:</strong> Manhattan (L1) → center is the <em>median</em>.</li>
          <li><strong>k-modes:</strong> categorical mismatch → center is the <em>mode</em>.</li>
          <li><strong>k-medoids:</strong> any distance → center is the most central <em>member</em>.</li>
        </ul>
        <p>In every case the assign/update loop is structurally identical — only the distance and the center formula change.</p>

        <h2>k-medians — robust by L1</h2>
        <p>
          k-medians minimises the sum of <strong>absolute</strong> distances, and the point that does that
          per coordinate is the <strong>median</strong>. Because the median ignores how far outliers are
          (only their count and side), k-medians is far less sensitive to extreme values than k-means —
          a different route to robustness than k-medoids, via the L1 norm rather than restricting centers
          to real points. It&rsquo;s a natural choice when your features are heavy-tailed.
        </p>

        <h2>k-modes — built for categories</h2>
        <p>
          For purely categorical data (colour, country, product), distance becomes a count of mismatched
          attributes and the center becomes the <strong>mode</strong> — the most frequent value in each
          attribute across the cluster&rsquo;s members. This sidesteps the one-hot trap entirely: no fractional
          centroids, no warped distances. Its mixed-data sibling <strong>k-prototypes</strong> combines
          k-means on numeric features with k-modes on categorical ones, the practical default for real
          tabular datasets (covered in the preprocessing chapter).
        </p>

        <Callout color="var(--c-clustering)" title={<>One family, many distances</>}>
          All of these inherit k-means&rsquo; strengths (simple, fast-ish, scalable) and its core weakness
            (local minima, sensitivity to initialisation, you still pick k). They don&rsquo;t fix the{" "}
            <em>shape</em> assumption — that needs GMM, DBSCAN, or spectral clustering. What they fix is the
            mismatch between the <em>center definition</em> and your <em>data type</em>. Match the variant
            to your data, then seed it with the same k-means++ idea.
        </Callout>

        <h2>Mean vs. median vs. mode update</h2>
        <CodeBlock setup={CLUSTER_SETUP} fromScratch={codeScratch} withLibrary={codeLib} />

        <PrevNext prev={{ href: "/learn/k-means/k-medoids", label: <>← k-medoids (PAM)</> }} next={{ href: "/learn/k-means/fuzzy-c-means", label: <>Next up · Fuzzy c-means →</> }} />
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np
from scipy import stats

# the ONLY thing that changes between variants is the center update:
def update_mean(members):    return members.mean(axis=0)              # k-means  (L2^2)
def update_median(members):  return np.median(members, axis=0)        # k-medians (L1)
def update_mode(members):    return stats.mode(members, axis=0).mode  # k-modes  (categorical)

# ...and the matching distance in the assign step:
#   k-means   : ((p - c)**2).sum()
#   k-medians : np.abs(p - c).sum()
#   k-modes   : (p != c).sum()`;

const codeLib = `# k-modes / k-prototypes live in the 'kmodes' package; k-medians via pyclustering.
from kmodes.kmodes import KModes

km = KModes(n_clusters=4, init="Huang", n_init=5, random_state=0)
labels = km.fit_predict(X_categorical)
print(km.cluster_centroids_)     # each centroid is a vector of modal categories`;


const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };


