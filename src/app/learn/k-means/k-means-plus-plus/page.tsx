import { PredictPrompt } from "@/components/PredictPrompt";
import { Quiz } from "@/components/Quiz";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CLUSTER_SETUP } from "@/lib/runtimeSetup";
import { KMeansPlusPlusLab } from "@/components/labs/KMeansPlusPlusLab";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "k-means++ — Manifold",
  description:
    "k-means++ seeds centroids by spreading them out on purpose: each new centroid is drawn proportional to its squared distance from the closest existing one. A smarter start, with a provable guarantee.",
};

export default function KMeansPlusPlusPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Clustering", color: "var(--c-clustering)" }]}
        time="about 7 minutes"
        title={<>k-means++</>}
        intro={<>
          Instead of buying more lottery tickets, k-means++ picks better numbers. It seeds the centroids
        spread apart on purpose — and that one change usually makes the very first run a good one.
        </>}
      />

      <div className="lesson">
        <h2>The idea: pick far-apart seeds</h2>
        <p>
          Bad random seeds fail because two centroids land in the same blob. k-means++ prevents that by
          making distant points <em>likely</em> to be chosen. The procedure:
        </p>
        <ol style={ol}>
          <li>Choose the first centroid uniformly at random from the data.</li>
          <li>
            For every remaining point, compute <M>{String.raw`D(x)`}</M> — the distance to the{" "}
            <em>nearest</em> centroid already chosen.
          </li>
          <li>
            Choose the next centroid at random, with each point&rsquo;s probability proportional to{" "}
            <M>{String.raw`D(x)^2`}</M>.
          </li>
          <li>Repeat steps 2–3 until you have <em>k</em> centroids, then run ordinary k-means.</li>
        </ol>
        <MathBlock>{String.raw`P(\text{pick } x) = \frac{D(x)^2}{\sum_{x'} D(x')^2}`}</MathBlock>
        <p>
          The <M>{String.raw`D^2`}</M> weighting is the heart of it. Points far from every existing centroid
          get a large probability, so the next seed almost always lands in an unclaimed region. But it&rsquo;s
          still <em>random</em>, not greedy &ldquo;take the farthest&rdquo; — that randomness is what keeps a
          lone outlier from always being chosen, and is what the proof needs.
        </p>

        <PredictPrompt
          accent="var(--c-clustering)"
          prompt={<>After the first seed lands, where does k-means++ put the <em>second</em> one?</>}
          options={["On the single farthest point, deterministically", "Somewhere far away — chosen at random, weighted by squared distance", "Uniformly at random, same as before"]}
          nudge={<>Locked in. Place seeds one at a time in the lab and watch which points grow bright.</>}
        />

        <h2>See the D² weighting in action</h2>
        <p>
          Switch between the two strategies and place centroids one at a time. In k-means++ mode, each
          candidate point grows and brightens with its <M>{String.raw`D^2`}</M> — its chance of being picked
          next. Watch how the seeds fan out across the four blobs, then flip to random and watch them
          clump.
        </p>
        <KMeansPlusPlusLab />

        <Callout color="var(--c-clustering)" title={<>The guarantee</>}>
          Arthur &amp; Vassilvitskii (2007) proved k-means++ seeding is{" "}
            <M>{String.raw`O(\log k)`}</M>-competitive with the optimal clustering <em>in expectation</em> —
            before a single Lloyd iteration runs. Plain random seeding has no such bound; it can be
            arbitrarily bad. This is rare: a cheap heuristic with a real approximation guarantee.
        </Callout>

        <h2>Why it&rsquo;s the default everywhere</h2>
        <p>
          k-means++ costs only one extra pass per seed, yet so reliably finds a good basin that
          scikit-learn made it the default <code>init</code> and was able to <em>lower</em>{" "}
          <code>n_init</code> from 10 to 1 — the smarter seed does the work that ten random restarts
          used to. You still combine them for hard problems: a few k-means++ restarts is the robust
          recipe.
        </p>

        <h2>Seeding from scratch, then the one-liner</h2>
        <CodeBlock setup={CLUSTER_SETUP} fromScratch={codeScratch} withLibrary={codeLib} />

        <Quiz
          accent="var(--c-clustering)"
          questions={[
            {
              q: "k-means++ chooses each next seed…",
              options: ["At the point farthest from all existing seeds", "Randomly, with probability proportional to squared distance from the nearest seed", "At a uniformly random data point"],
              answer: 1,
              explain: "The D² weighting favours far points but stays random — that randomness is what stops a lone outlier from always being picked, and it's exactly what the O(log k) proof needs.",
            },
            {
              q: "The k-means++ theoretical guarantee says expected inertia is…",
              options: ["Within a factor of O(log k) of the optimum", "Exactly optimal", "No better than random — it's only a heuristic"],
              answer: 0,
              explain: "Arthur & Vassilvitskii proved E[inertia] ≤ 8(ln k + 2) × optimal — from seeding alone, before Lloyd's even runs. Random init has no such guarantee.",
            },
            {
              q: "The classic failure of purely random initialization is…",
              options: ["Two seeds landing in the same blob, so one real cluster gets split and another swallowed", "Seeds landing outside the data range", "Divergence of the update step"],
              answer: 0,
              explain: "With k random draws it's likely two land in one dense blob; Lloyd's then converges to a bad local minimum. Restarts paper over it; k-means++ mostly prevents it.",
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/k-means/random-restarts", label: <>← Random restarts</> }} next={{ href: "/learn/k-means/the-elbow-method", label: <>Next up · The elbow method →</> }} />
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np

def kmeans_plus_plus(X, k, rng):
    n = len(X)
    centroids = [X[rng.integers(n)]]            # 1. first centroid: uniform
    for _ in range(1, k):
        # 2. D(x)^2 = squared distance to the nearest chosen centroid
        d2 = np.min([((X - c)**2).sum(1) for c in centroids], axis=0)
        probs = d2 / d2.sum()                   # 3. sample proportional to D^2
        centroids.append(X[rng.choice(n, p=probs)])
    return np.array(centroids)

rng = np.random.default_rng(0)
X = np.vstack([rng.normal(c, 0.5, (60, 2)) for c in [(0,0),(5,0),(2.5,4),(7,4)]])
seeds = kmeans_plus_plus(X, 4, rng)             # spread-out, ready for Lloyd's`;

const codeLib = `from sklearn.cluster import KMeans

# init="k-means++" is the default; n_init can be small because the seed is good
km = KMeans(n_clusters=4, init="k-means++", n_init=1, random_state=0).fit(X)
print(km.inertia_)`;


const ol: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };


