import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { KNN_SETUP } from "@/lib/runtimeSetup";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Feature selection & weighting — Manifold",
  description:
    "k-NN takes every feature at face value, so noise columns poison the distance. Selecting, weighting, and ultimately learning a metric are one continuous idea: let the data decide how much each direction counts.",
};

export default function FeatureSelectionWeightingPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: "var(--c-classification)" }, { label: "Tier 2 · in practice", color: "var(--c-classification)" }]}
        time="about 8 minutes"
        title={<>Feature selection &amp; weighting</>}
        intro={<>
          k-NN trusts its distance completely, and the distance trusts every feature equally. A handful of
        irrelevant columns can drown the signal from the useful ones. Fixing that runs along a single
        spectrum — from dropping features, to weighting them, to learning the whole metric.
        </>}
      />

      <div className="lesson">
        <h2>Why irrelevant features hurt k-NN specifically</h2>
        <p>
          A linear model can learn a near-zero coefficient for a useless feature and effectively ignore it.
          Vanilla k-NN cannot: every feature enters the distance with equal weight, so each noise column adds
          its own spread and pushes genuinely similar points apart. This is the curse of dimensionality with a
          culprit — not just &ldquo;too many features,&rdquo; but too many <em>uninformative</em> ones.
        </p>

        <h2>Selection: drop the dead weight</h2>
        <p>Three standard families, cheapest first:</p>
        <ul style={ul}>
          <li><strong>Filter methods</strong> — score each feature independently (variance, mutual information, correlation with the target) and keep the top ones. Fast, model-agnostic, done before any k-NN runs.</li>
          <li><strong>Wrapper methods</strong> — let k-NN itself judge subsets: forward selection, backward elimination, or recursive feature elimination, scored by cross-validation. More faithful, more expensive.</li>
          <li><strong>Embedded methods</strong> — use a model that selects as it fits (an L1-penalised model, a tree&rsquo;s importances) to pick the columns, then hand those to k-NN.</li>
        </ul>

        <h2>Weighting: selection is just a 0/1 weight</h2>
        <p>
          Selection is the blunt version of a smoother idea. Give each feature a weight{" "}
          <M>{String.raw`w_i \ge 0`}</M> inside the distance:
        </p>
        <MathBlock>{String.raw`d_w(\mathbf{x}, \mathbf{z}) = \sqrt{\sum_{i} w_i\,(x_i - z_i)^2}`}</MathBlock>
        <p>
          Now <M>{String.raw`w_i = 0`}</M> drops a feature (selection), <M>{String.raw`w_i = 1`}</M> for all{" "}
          <M>{String.raw`i`}</M> is plain Euclidean, and standardising is the special case{" "}
          <M>{String.raw`w_i = 1/\sigma_i^2`}</M>. Selection, scaling, and weighting are the <em>same operation</em>
          at different resolutions. You can set weights by hand from domain knowledge, from a feature-importance
          score, or — best — learn them.
        </p>

        <h2>Metric learning: let the data set the weights</h2>
        <p>
          Push weighting to its full generality and you allow a whole matrix, not just per-feature scalars —
          the <strong>Mahalanobis metric</strong>:
        </p>
        <MathBlock>{String.raw`d_M(\mathbf{x}, \mathbf{z}) = \sqrt{(\mathbf{x} - \mathbf{z})^\top M (\mathbf{x} - \mathbf{z})}, \qquad M = L^\top L`}</MathBlock>
        <p>
          A diagonal <M>{String.raw`M`}</M> is exactly feature weighting; a full <M>{String.raw`M`}</M> also
          rotates the space to de-correlate and stretch the directions that matter. <strong>Metric-learning</strong>
          algorithms learn <M>{String.raw`M`}</M> (equivalently the linear map <M>{String.raw`L`}</M>) so that
          same-class points are pulled together and different-class points pushed apart <em>before</em> k-NN
          votes:
        </p>
        <ul style={ul}>
          <li><strong>LMNN</strong> (Large-Margin Nearest Neighbour) — learns <M>{String.raw`M`}</M> so each point&rsquo;s k same-class neighbours sit closer than any different-class point, with a margin.</li>
          <li><strong>NCA</strong> (Neighbourhood Components Analysis) — learns <M>{String.raw`L`}</M> to directly maximise a soft nearest-neighbour accuracy; doubles as supervised dimensionality reduction.</li>
        </ul>

        <Callout color="var(--c-classification)" title={<>One spectrum, increasing power</>}>
          <strong>Scale</strong> (unit variance) → <strong>select</strong> (drop features) →{" "}
            <strong>weight</strong> (per-feature importance) → <strong>learn a metric</strong> (full{" "}
            <M>{String.raw`M`}</M>: weight + rotate). Every step buys k-NN more say over what &ldquo;near&rdquo;
            means, at rising cost and rising overfitting risk — so validate each addition, and stop when
            held-out performance stops improving.
        </Callout>

        <CodeBlock setup={KNN_SETUP} fromScratch={codeScratch} withLibrary={codeLib} />

        <Quiz
          accent="var(--c-classification)"
          questions={[
            {
              q: "Why do irrelevant features hurt k-NN more than they hurt linear regression?",
              options: ["k-NN weights every feature equally in the distance; it can't learn to ignore one", "k-NN needs more memory", "Linear regression also fails badly on noise features"],
              answer: 0,
              explain: "A linear model can drive a coefficient to ~0. Vanilla k-NN gives every feature equal say in the distance, so each noise column injects spread it can't discount.",
            },
            {
              q: "In the weighted distance √(Σ wᵢ(xᵢ−zᵢ)²), setting wᵢ = 0 corresponds to…",
              options: ["Dropping feature i — selection is a 0/1 weight", "Standardising feature i", "Doubling feature i's influence"],
              answer: 0,
              explain: "Selection, scaling (wᵢ = 1/σᵢ²), and general weighting are the same operation at different resolutions; a zero weight removes the feature entirely.",
            },
            {
              q: "What does metric learning (e.g. LMNN, NCA) learn?",
              options: ["A Mahalanobis matrix M = LᵀL that weights and rotates the space to help k-NN", "The best value of k", "Which distance metric name to use"],
              answer: 0,
              explain: "It learns the full M (or map L) so same-class points cluster and different-class points separate before voting — a diagonal M is feature weighting; a full M also rotates.",
            },
          ]}
        />

        <Callout color="var(--c-classification)" title={<>Where this chapter leaves you</>}>
          You can now get k-NN <em>working</em> on messy, real data: encoded, imputed, de-tied, imbalance-aware,
            with a validated metric and the right features weighted up. What&rsquo;s left is making it{" "}
            <em>fast</em> — a brute-force scan over every training point is untenable at scale. That&rsquo;s the next
            chapter: k-d trees, ball trees, and approximate search. Preview the full path on the{" "}
            <Link href="/map" style={{ color: "var(--brand)", textDecoration: "none" }}>curriculum map</Link>.
        </Callout>

        <PrevNext prev={{ href: "/learn/k-nearest-neighbors/choosing-the-right-metric", label: <>← Choosing the right metric</> }} next={{ href: "/learn/k-nearest-neighbors/the-brute-force-cost", label: <>Next up · The brute-force cost →</> }} />
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np
from sklearn.feature_selection import mutual_info_classif

# FILTER: score each feature's relevance, keep the informative ones
mi = mutual_info_classif(X_train, y_train, random_state=0)
keep = np.argsort(mi)[::-1][:3]           # top-3 features by mutual information
print("kept features:", keep, "scores:", np.round(mi[keep], 3))

X_train_sel = X_train[:, keep]            # k-NN now runs in a cleaner subspace`;

const codeLib = `from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.neighbors import KNeighborsClassifier, NeighborhoodComponentsAnalysis

# METRIC LEARNING: NCA learns a linear map so k-NN's neighbours are more often right
nca_knn = make_pipeline(
    StandardScaler(),
    NeighborhoodComponentsAnalysis(random_state=0),   # learns L (weight + rotate)
    KNeighborsClassifier(n_neighbors=7),
)
plain = make_pipeline(StandardScaler(), KNeighborsClassifier(n_neighbors=7))

print("plain:", round(plain.fit(X_train, y_train).score(X_test, y_test), 3))
print("nca  :", round(nca_knn.fit(X_train, y_train).score(X_test, y_test), 3))`;

const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
