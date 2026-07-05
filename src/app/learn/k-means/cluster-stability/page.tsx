import { Quiz } from "@/components/Quiz";
import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Cluster stability — Manifold",
  description:
    "A clustering you can trust should survive a little perturbation. Stability analysis re-clusters resampled data and asks whether you keep getting the same answer — a validity check that needs no labels.",
};

export default function StabilityPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Clustering", color: "var(--c-clustering)" }, { label: "Go deeper", color: "var(--c-metrics)" }]}
        time="about 6 minutes"
        title={<>Cluster stability</>}
        intro={<>
          Internal and external metrics score one fixed clustering. Stability asks a different, sturdier
        question: if you nudge the data, do you keep getting <em>the same</em> clustering? Real structure
        is reproducible; artefacts aren&rsquo;t.
        </>}
      />

      <div className="lesson">
        <h2>The core idea</h2>
        <p>
          If three clusters are genuinely in your data, then clustering a random 80% subsample, or a
          slightly noised copy, should recover essentially the same three groups. If your chosen{" "}
          <em>k</em> is wrong — say you forced four clusters onto three real ones — the boundary of that
          extra split will wander from run to run. <strong>Instability is evidence the structure isn&rsquo;t
          really there.</strong>
        </p>

        <h2>The protocol</h2>
        <ol style={ol}>
          <li><strong>Perturb.</strong> Draw a bootstrap or subsample of the data (or add small noise).</li>
          <li><strong>Re-cluster.</strong> Run k-means on the perturbed copy.</li>
          <li>
            <strong>Compare.</strong> Measure how much the new labelling agrees with a reference
            clustering on the points they share — using a label-invariant score like{" "}
            <Link href="/learn/k-means/external-metrics" style={inlineLink}>ARI</Link>. (ARI is perfect
            here: it ignores which arbitrary numbers each run assigned.)
          </li>
          <li><strong>Repeat</strong> many times and average the agreement.</li>
        </ol>
        <p>
          Do this for each candidate <em>k</em>. The <em>k</em> with the <strong>highest mean
          agreement</strong> (lowest instability) is the most reproducible — another, independent way to
          choose <em>k</em> that doesn&rsquo;t rely on the inertia curve at all.
        </p>

        <Callout color="var(--c-clustering)" title={<>Why it complements the others</>}>
          Elbow, silhouette, and the rest read a single snapshot. Stability tests the clustering&rsquo;s{" "}
            <em>robustness</em> — and it&rsquo;s especially good at exposing an over-large <em>k</em>, whose
            surplus boundaries are exactly what jitters. The cost is obvious: you refit k-means dozens of
            times per candidate <em>k</em>. The standard caution: a degenerate solution (e.g. one giant
            cluster) can be perfectly stable yet useless, so pair stability with a quality metric, never
            use it alone.
        </Callout>

        <h2>A note on consensus clustering</h2>
        <p>
          The same resample-and-aggregate idea powers <strong>consensus clustering</strong>: instead of
          just scoring stability, you combine many perturbed runs into a co-association matrix (how often
          each pair lands together) and cluster <em>that</em>. The payoff is a final clustering more
          robust than any single run — the clustering analogue of ensembling.
        </p>

        <h2>Measure stability across k</h2>
        <CodeBlock fromScratch={codeScratch} withLibrary={codeLib} />

        <Quiz
          accent="var(--c-clustering)"
          questions={[
            {
              q: "An Adjusted Rand Index (ARI) of 0 means…",
              options: ["Agreement no better than random chance", "Zero agreement — every pair disagrees", "The two clusterings used different k"],
              answer: 0,
              explain: "ARI is chance-corrected: 1 is identical clusterings, 0 is what random labelling would score, negative is worse than chance. Raw agreement can look high purely by luck.",
            },
            {
              q: "A clustering is called STABLE when…",
              options: ["Re-running on resampled or perturbed data keeps producing similar clusters", "Inertia is low", "Lloyd's converges in few iterations"],
              answer: 0,
              explain: "Stability is the unsupervised stand-in for generalization: structure that survives resampling is probably real; structure that reshuffles every run is probably noise.",
            },
            {
              q: "Why can't you choose k by evaluating inertia on held-out data, like supervised cross-validation?",
              options: ["Inertia keeps decreasing with k on any dataset — held-out or not — so it still always votes for bigger k", "Held-out data can't be assigned to clusters", "Inertia is undefined off the training set"],
              answer: 0,
              explain: "More centroids are always closer to any data. Without labels there's no error to go UP when you overfit — which is why stability and reference-comparison methods fill the gap.",
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/k-means/external-metrics", label: <>← External metrics (ARI, NMI)</> }} next={{ href: "/learn/k-means", label: <>Back to overview →</> }} />
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np
from sklearn.metrics import adjusted_rand_score

def stability(X, k, n_runs=30, frac=0.8, seed=0):
    rng = np.random.default_rng(seed)
    n = len(X)
    scores = []
    ref_lab = fit_kmeans(X, k)            # reference clustering on all data
    for _ in range(n_runs):
        idx = rng.choice(n, int(frac * n), replace=False)   # subsample
        sub_lab = fit_kmeans(X[idx], k)
        # agreement on the shared points (ignores label names)
        scores.append(adjusted_rand_score(ref_lab[idx], sub_lab))
    return np.mean(scores), np.std(scores)

for k in range(2, 7):
    m, s = stability(X, k)
    print(f"k={k}: mean ARI {m:.3f} ± {s:.3f}")   # highest = most stable`;

const codeLib = `# sklearn has no one-call stability function; you build it from KMeans + ARI.
from sklearn.cluster import KMeans

def fit_kmeans(X, k):
    return KMeans(n_clusters=k, n_init=10, random_state=0).fit_predict(X)

# then run the stability() loop above; pick the k with the highest mean ARI.`;

const ol: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const inlineLink: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
