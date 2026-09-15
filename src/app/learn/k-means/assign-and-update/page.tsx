import { CodeBlock } from "@/components/CodeBlock";
import { CLUSTER_SETUP } from "@/lib/runtimeSetup";
import { LessonHeader, PrevNext } from "@/components/lesson";
import { ScatterRow } from "@/components/figures/kmeans/Scatter";
import { AssignUpdateLoop } from "@/components/figures/kmeans/KmeansDiagrams";
import { LLOYD } from "@/components/figures/kmeans/data.generated";

export const metadata = {
  title: "Assign & update (Lloyd's algorithm) — Manifold",
  description:
    "k-Means is two steps in a loop: assign every point to its nearest centroid, then move every centroid to the mean of its points. Repeat until nothing moves.",
};

const codeScratch = `import numpy as np

rng = np.random.default_rng(7)
# three blobs of points in 2D
X = np.vstack([rng.normal(c, 0.6, (40, 2)) for c in [(0, 0), (4, 4), (8, 0)]])

k = 3
centroids = X[rng.choice(len(X), k, replace=False)]   # Forgy init

for step in range(100):
    # 1. ASSIGN: each point to its nearest centroid
    d = ((X[:, None, :] - centroids[None, :, :])**2).sum(axis=2)
    labels = d.argmin(axis=1)

    # 2. UPDATE: each centroid to the mean of its points
    new = np.array([X[labels == j].mean(axis=0) for j in range(k)])

    if np.allclose(new, centroids):    # nothing moved -> converged
        break
    centroids = new

inertia = sum(((X[labels == j] - centroids[j])**2).sum() for j in range(k))
print(f"converged in {step} steps,  inertia {inertia:.1f}")`;

const codeLib = `import numpy as np
from sklearn.cluster import KMeans

rng = np.random.default_rng(7)
X = np.vstack([rng.normal(c, 0.6, (40, 2)) for c in [(0, 0), (4, 4), (8, 0)]])

# n_init=10 runs Lloyd's loop 10 times from different starts, keeps the best
km = KMeans(n_clusters=3, n_init=10, random_state=0).fit(X)

print(f"converged in {km.n_iter_} steps,  inertia {km.inertia_:.1f}")
print("labels of first 5 points:", km.labels_[:5])`;

export default function AssignAndUpdatePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Clustering", color: "var(--c-clustering)" }]}
        time="about 7 minutes"
        title={<>Assign &amp; update</>}
        intro={<>
          The whole algorithm is two steps in a loop. It has a name — Lloyd&rsquo;s algorithm — but
        you already watched it run on the first page.
        </>}
      />

      <div className="lesson">
        <h2>Step 1 — Assign</h2>
        <p>
          Hold the centroids fixed. Walk through every point and give it the label of its{" "}
          <strong>nearest centroid</strong>. This carves the plane into regions — one per centroid —
          where every point in a region shares the same nearest centre. (Those regions are a Voronoi
          diagram, if you&rsquo;ve met the term.)
        </p>

        <h2>Step 2 — Update</h2>
        <p>
          Now hold the assignments fixed and move each centroid to the <strong>mean</strong> of the
          points currently assigned to it. As we saw, the mean is the single point that minimises
          squared distance to a group — so this step is the best possible move given the current
          labels.
        </p>

        <h2>Repeat</h2>
        <p>
          Moving the centroids changes which centroid is nearest for some points, so we assign
          again, then update again. Each pass lowers inertia. When a full pass changes nothing — no
          point switches clusters — the algorithm has <strong>converged</strong> and stops.
        </p>

        <AssignUpdateLoop
          caption={<>Neither step can go first on its own, which is why the loop starts by guessing one
            of them. The bottom panel is the fact that makes the loop terminate: the two steps are not
            two heuristics that happen to work together, they are alternating exact minimisations of a
            single objective.</>}
        />

        <ScatterRow
          perRow={5}
          panels={LLOYD.frames.map((f, i) => ({
            points: LLOYD.points,
            labels: f.labels,
            centroids: f.centroids,
            ghosts: i > 0 ? LLOYD.frames[i - 1].centroids : undefined,
            label: i === 0 ? "start (a bad guess)" : `after ${i} round${i > 1 ? "s" : ""}`,
            note: `inertia ${Math.round(f.inertia)}`,
          }))}
          caption={<>A real run, deliberately started from four points picked at random rather than from
            k-means++ — a good start converges in two rounds and shows nothing. The dashed rings mark
            where each centroid sat in the previous frame, so the movement is visible. Inertia falls{" "}
            {Math.round(LLOYD.frames[0].inertia)} → {Math.round(LLOYD.frames[LLOYD.frames.length - 1].inertia)}{" "}
            and never once rises. By the fourth round the centroids move less than 0.06 and the labels
            have stopped changing at all: that is what convergence looks like, and it took five
            rounds.</>}
        />

        <h2>The whole thing in code</h2>
        <p>
          From scratch it&rsquo;s a dozen lines of NumPy: the assign step is one
          <code> argmin</code>, the update step is one <code>mean</code>. scikit-learn wraps the same
          loop (plus smart initialisation and multiple restarts) behind <code>KMeans</code>.
        </p>
        <CodeBlock setup={CLUSTER_SETUP} fromScratch={codeScratch} withLibrary={codeLib} />

        <p>
          That&rsquo;s the engine. What&rsquo;s left is everything around it: proving it always
          stops, choosing a good starting <em>k</em>, surviving bad initial guesses, and knowing the
          shapes where it quietly breaks. Those are the next chapters.
        </p>

        <PrevNext prev={{ href: "/learn/k-means/the-k-means-idea", label: <>← The k-means idea</> }} next={{ href: "/learn/k-means", label: <>Back to overview →</> }} />
      </div>
    </article>
  );
}



