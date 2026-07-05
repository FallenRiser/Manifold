import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CLUSTER_SETUP } from "@/lib/runtimeSetup";
import { ScalingLab } from "@/components/labs/ScalingLab";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Why scaling matters — Manifold",
  description:
    "k-Means measures everything with Euclidean distance, so a feature with a bigger numeric range silently dominates. Standardize first, or your clusters reflect units, not structure.",
};

export default function ScalingPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Clustering", color: "var(--c-clustering)" }]}
        time="about 6 minutes"
        title={<>Why scaling matters</>}
        intro={<>
          This is the single most common way to get k-means wrong — and it&rsquo;s invisible until you look.
        Because distance treats every feature in its raw units, the feature with the biggest numbers
        quietly decides the clustering.
        </>}
      />

      <div className="lesson">
        <h2>Distance has no sense of units</h2>
        <p>
          Squared Euclidean distance just adds up per-feature differences:
        </p>
        <MathBlock>{String.raw`d(\mathbf{x}, \mathbf{y})^2 = \sum_{f} (x_f - y_f)^2`}</MathBlock>
        <p>
          A feature measured in dollars (0–100,000) contributes differences in the tens of thousands;
          a feature measured in years (0–60) contributes differences in the tens. Squared, the dollar
          term is millions of times larger. The age feature is <em>mathematically present</em> but
          utterly drowned out — k-means is effectively clustering on income alone, no matter how
          meaningful age is.
        </p>

        <h2>See it flip</h2>
        <p>
          Below, the real groups differ by age at every income level. On raw features k-means slices
          along income and misses them entirely; standardize and the true groups appear. Same data,
          same algorithm — only the scaling changed.
        </p>
        <ScalingLab />

        <h2>The fixes</h2>
        <ul style={ul}>
          <li>
            <strong>Standardization (z-score).</strong> Subtract each feature&rsquo;s mean, divide by its
            std: <M>{String.raw`x' = (x - \mu)/\sigma`}</M>. Now every feature has unit variance and equal
            say. This is the default for k-means.
          </li>
          <li>
            <strong>Min–max scaling.</strong> Squash each feature to <M>{String.raw`[0,1]`}</M>. Simple, but
            sensitive to outliers (one extreme value compresses everyone else).
          </li>
          <li>
            <strong>Robust scaling.</strong> Center by the median and scale by the interquartile range —
            standardization&rsquo;s outlier-resistant cousin (more on the next page).
          </li>
        </ul>

        <Callout color="var(--c-clustering)" title={<>Scale on train, apply to test</>}>
          Fit the scaler on your training data and reuse <em>its</em> means and stds on any new data —
            never re-fit per split, or you leak information and shift the geometry. In scikit-learn,
            wrap the scaler and k-means in a <code>Pipeline</code> so this happens automatically. One
            caveat: standardizing assumes every feature <em>deserves</em> equal weight. If a feature is
            genuinely more important, equal scaling can wash that out — scaling is a default, not a law.
        </Callout>

        <h2>Always scale before k-means</h2>
        <CodeBlock setup={CLUSTER_SETUP} fromScratch={codeScratch} withLibrary={codeLib} />

        <PrevNext prev={{ href: "/learn/k-means/cluster-stability", label: <>← Cluster stability</> }} next={{ href: "/learn/k-means/outliers-and-robustness", label: <>Next up · Outliers &amp; robustness →</> }} />
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np

# z-score standardization: each feature -> mean 0, std 1
mu = X.mean(axis=0)
sigma = X.std(axis=0)
X_scaled = (X - mu) / sigma

# now every feature contributes comparably to Euclidean distance.
# apply the SAME mu/sigma to any new data — don't refit:
X_new_scaled = (X_new - mu) / sigma`;

const codeLib = `from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.pipeline import make_pipeline

# the pipeline fits the scaler on training data and reuses it automatically
model = make_pipeline(
    StandardScaler(),
    KMeans(n_clusters=2, n_init=10, random_state=0),
)
labels = model.fit_predict(X)`;


const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };


