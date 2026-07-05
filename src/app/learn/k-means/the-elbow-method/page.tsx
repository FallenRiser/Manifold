import { PredictPrompt } from "@/components/PredictPrompt";
import { CodeBlock } from "@/components/CodeBlock";
import { CLUSTER_SETUP } from "@/lib/runtimeSetup";
import { ElbowLab } from "@/components/labs/ElbowLab";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "The elbow method — Manifold",
  description:
    "Plot inertia against k and look for the bend — the point where adding clusters stops paying off. It's the first, simplest answer to 'how many clusters?', with real caveats.",
};

export default function ElbowMethodPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Clustering", color: "var(--c-clustering)" }]}
        time="about 6 minutes"
        title={<>The elbow method</>}
        intro={<>
          k-Means needs you to choose <em>k</em> up front — but the data rarely tells you outright. The
        elbow method is the oldest and most intuitive way to read the answer off a single plot.
        </>}
      />

      <div className="lesson">
        <h2>Why you can&rsquo;t just minimise inertia</h2>
        <p>
          We saw it earlier: inertia <em>always</em> falls as <em>k</em> grows, hitting zero when every
          point is its own cluster. So &ldquo;pick the <em>k</em> with the lowest inertia&rdquo; is useless —
          it always says <em>k</em> = <em>n</em>. The signal isn&rsquo;t the value of inertia; it&rsquo;s the{" "}
          <em>rate</em> at which it drops.
        </p>

        <PredictPrompt
          accent="var(--c-clustering)"
          prompt={<>The lab’s data has 4 real blobs. As you push <em>k</em> past 4, what does inertia do?</>}
          options={["Stops falling entirely — the curve goes flat", "Keeps falling, just much more slowly", "Starts rising"]}
          nudge={<>Locked in. Slide k past the elbow in the lab and watch the curve’s slope carefully.</>}
        />

        <h2>Look for the bend</h2>
        <p>
          Plot inertia for <em>k</em> = 1, 2, 3, &hellip; The curve falls steeply at first — each new
          centroid carves a genuinely separate group — then flattens once you&rsquo;ve covered the real
          clusters and are only splitting them. The <strong>elbow</strong>, where steep turns into
          shallow, is the sweet spot: enough clusters to capture the structure, not so many that you&rsquo;re
          chasing noise.
        </p>

        <ElbowLab />

        <h2>Making &ldquo;the bend&rdquo; objective</h2>
        <p>
          Eyeballing an elbow is subjective, so it&rsquo;s often automated. A common trick (used in the lab
          above): draw a straight chord from the first point of the curve to the last, then pick the{" "}
          <em>k</em> whose inertia sits farthest from that chord. The Kneedle algorithm formalises the
          same &ldquo;point of maximum curvature&rdquo; idea.
        </p>

        <Callout color="var(--c-clustering)" title={<>Where the elbow fails</>}>
          On well-separated blobs the bend is obvious. On real data it&rsquo;s often smeared into a gentle
            curve with <em>no</em> clear corner — overlapping clusters, varying densities, or genuine
            hierarchy all blur it. Treat the elbow as one piece of evidence, not a verdict. The next
            pages — silhouette and the gap statistic — give sturdier, less eyeball-dependent answers.
        </Callout>

        <h2>Compute the curve</h2>
        <p>
          Fit k-means across a range of <em>k</em>, collect each <code>.inertia_</code>, and plot:
        </p>
        <CodeBlock setup={CLUSTER_SETUP} fromScratch={codeScratch} withLibrary={codeLib} />

        <PrevNext prev={{ href: "/learn/k-means/k-means-plus-plus", label: <>← k-means++</> }} next={{ href: "/learn/k-means/silhouette-analysis", label: <>Next up · Silhouette analysis →</> }} />
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np

def inertia_for_k(X, k, iters=50, seed=0):
    rng = np.random.default_rng(seed)
    C = X[rng.choice(len(X), k, replace=False)]
    for _ in range(iters):
        lab = ((X[:, None, :] - C[None, :, :])**2).sum(2).argmin(1)
        C = np.array([X[lab == j].mean(0) if (lab == j).any() else C[j] for j in range(k)])
    return sum(((X[lab == j] - C[j])**2).sum() for j in range(k))

ks = range(1, 9)
curve = [inertia_for_k(X, k) for k in ks]
# the elbow: k farthest from the chord joining the first and last points
y = np.array(curve); x = np.arange(1, 9)
num = np.abs((y[-1]-y[0])*x - (x[-1]-x[0])*y + x[-1]*y[0] - y[-1]*x[0])
print("elbow at k =", x[np.argmax(num)])`;

const codeLib = `import matplotlib.pyplot as plt
from sklearn.cluster import KMeans

ks = range(1, 9)
inertias = [KMeans(n_clusters=k, n_init=10, random_state=0).fit(X).inertia_ for k in ks]

plt.plot(list(ks), inertias, "o-")
plt.xlabel("k"); plt.ylabel("inertia"); plt.title("Elbow plot")
plt.show()`;




