import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { KNN_SETUP } from "@/lib/runtimeSetup";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Distance-weighted voting — Manifold",
  description:
    "Plain k-NN gives the 1st and kth neighbour an equal say. Distance weighting lets closer points count more — dissolving ties, making large k safe, and revealing k-NN as kernel regression in disguise.",
};

export default function DistanceWeightedVotingPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: "var(--c-classification)" }, { label: "Tier 2 · distance & weighting", color: "var(--c-classification)" }]}
        time="about 7 minutes"
        title={<>Distance-weighted voting</>}
        intro={<>
          Standard k-NN gives every one of the k neighbours an equal vote — the closest point and the kth,
        barely inside the circle, count the same. Weighting votes by distance fixes that, and quietly turns
        k-NN into a smooth kernel method.
        </>}
      />

      <div className="lesson">
        <h2>Uniform voting throws away information</h2>
        <p>
          In majority-vote k-NN, all k neighbours are equal. But a neighbour sitting almost on top of the query
          is far stronger evidence than one at the very edge of the neighbourhood. Uniform weighting ignores
          that — and it&rsquo;s why large k can feel blunt: distant, weakly-relevant points get a full say and
          smear the prediction.
        </p>

        <h2>Weight each vote by closeness</h2>
        <p>
          Give neighbour <M>{String.raw`i`}</M> a weight <M>{String.raw`w_i`}</M> that shrinks with distance,
          then predict the weighted winner (classification) or weighted average (regression):
        </p>
        <MathBlock>{String.raw`\hat{y} = \arg\max_{c} \sum_{i \in N_k} w_i \,\mathbb{1}[y_i = c] \qquad\text{or}\qquad \hat{y} = \frac{\sum_{i \in N_k} w_i\, y_i}{\sum_{i \in N_k} w_i}`}</MathBlock>
        <p>Common weighting schemes:</p>
        <ul style={ul}>
          <li><strong>Inverse distance</strong> — <M>{String.raw`w_i = 1/d_i`}</M> (scikit-learn&rsquo;s <code>weights="distance"</code>). Simple and effective; guard the <M>{String.raw`d_i = 0`}</M> case (an exact match gets infinite weight — just return its label).</li>
          <li><strong>Inverse squared distance</strong> — <M>{String.raw`w_i = 1/d_i^2`}</M>. Sharper falloff; localises harder.</li>
          <li><strong>Gaussian / kernel</strong> — <M>{String.raw`w_i = \exp(-d_i^2 / 2\ell^2)`}</M>. A smooth bump with a bandwidth <M>{String.raw`\ell`}</M> that sets how fast influence decays.</li>
        </ul>

        <h2>Three things weighting buys you</h2>
        <ul style={ul}>
          <li><strong>Ties dissolve.</strong> A weighted sum almost never lands in an exact tie, so even k and multi-class problems stop needing a coin-flip rule.</li>
          <li><strong>Large k gets safe.</strong> Far-off neighbours are down-weighted toward irrelevance, so raising k adds gentle context instead of blunt smoothing. Weighted k-NN is far less sensitive to the exact k.</li>
          <li><strong>The boundary smooths.</strong> Predictions vary continuously as the query moves, rather than jumping each time a neighbour swaps in or out of the top-k.</li>
        </ul>

        <Callout color="var(--c-classification)" title={<>k-NN is kernel regression in disguise</>}>
          Push weighting to its logical end — weight <em>every</em> training point by a kernel of its distance,
            not just the top k — and weighted k-NN becomes the{" "}
            <strong>Nadaraya–Watson kernel regression</strong> estimator{" "}
            <M>{String.raw`\hat{y}(\mathbf{x}) = \frac{\sum_i K(\mathbf{x},\mathbf{x}_i)\,y_i}{\sum_i K(\mathbf{x},\mathbf{x}_i)}`}</M>.
            k-NN&rsquo;s hard &ldquo;k nearest&rdquo; cutoff is just a rectangular kernel; a Gaussian weight is a
            soft one. Now k (or the bandwidth <M>{String.raw`\ell`}</M>) is a smoothing knob, and this is the
            doorway to <em>locally weighted regression</em> later in the track.
        </Callout>

        <h2>Weighting is not a substitute for scaling</h2>
        <p>
          A tempting misconception: &ldquo;if I weight by distance, I don&rsquo;t need to scale.&rdquo; The opposite —
          weighting makes scaling <em>more</em> important. The weights are functions of the distance, so if an
          unscaled feature already dominates the distance, it dominates the weights too. Scale first, then
          weight. And because weighting changes the effective neighbourhood, re-tune k alongside it.
        </p>

        <CodeBlock setup={KNN_SETUP} fromScratch={codeScratch} withLibrary={codeLib} />

        <Quiz
          accent="var(--c-classification)"
          questions={[
            {
              q: "The main effect of distance-weighted voting on the choice of k is…",
              options: ["Large k becomes much safer — distant neighbours are down-weighted", "It forces k to be odd", "It makes k irrelevant"],
              answer: 0,
              explain: "Far neighbours contribute little, so adding them (larger k) does little harm. Weighted k-NN is far less sensitive to the exact k than uniform voting.",
            },
            {
              q: "Extending distance weighting to all training points (not just the top k) gives…",
              options: ["Nadaraya–Watson kernel regression", "A decision tree", "Linear regression"],
              answer: 0,
              explain: "A kernel-weighted average over every point is exactly the Nadaraya–Watson estimator. k-NN's hard cutoff is just a rectangular kernel.",
            },
            {
              q: "With weights = 1/d, what must you handle specially?",
              options: ["A neighbour at distance 0 (exact match) → infinite weight; return its label", "Negative distances", "Ties, which now happen more often"],
              answer: 0,
              explain: "An exact match makes 1/d blow up. The standard fix is to short-circuit: if a training point coincides with the query, just predict its label.",
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/k-nearest-neighbors/why-feature-scaling-matters", label: <>← Why feature scaling matters</> }} next={{ href: "/learn/k-nearest-neighbors/the-curse-of-dimensionality", label: <>Next up · The curse of dimensionality →</> }} />
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np

def weighted_knn(X_train, y_train, x, k, eps=1e-9):
    d = np.sqrt(((X_train - x)**2).sum(axis=1))
    idx = np.argsort(d)[:k]
    w = 1.0 / (d[idx] + eps)                 # inverse-distance weights
    # weighted vote across classes
    classes = np.unique(y_train)
    tally = {c: w[y_train[idx] == c].sum() for c in classes}
    return max(tally, key=tally.get)

print(weighted_knn(X_train, y_train, X_test[0], k=15))`;

const codeLib = `from sklearn.neighbors import KNeighborsClassifier

uniform  = KNeighborsClassifier(n_neighbors=15, weights="uniform")
weighted = KNeighborsClassifier(n_neighbors=15, weights="distance")

for name, clf in [("uniform", uniform), ("weighted", weighted)]:
    print(name, round(clf.fit(X_train, y_train).score(X_test, y_test), 3))
# weighted usually matches or beats uniform, and is steadier as k grows`;

const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
