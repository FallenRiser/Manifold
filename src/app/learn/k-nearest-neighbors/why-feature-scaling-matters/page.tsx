import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { KNN_SETUP } from "@/lib/runtimeSetup";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Why feature scaling matters — Manifold",
  description:
    "For k-NN, an unscaled feature in large units silently hijacks the distance and every other feature is ignored. See it happen in one worked example, then fix it with standardisation done the leakage-safe way.",
};

const th: React.CSSProperties = { textAlign: "left", padding: "8px 12px", fontSize: 12.5, color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)" };
const td: React.CSSProperties = { padding: "8px 12px", fontSize: 14, color: "var(--ink)", borderBottom: "1px solid var(--border)" };
const mono: React.CSSProperties = { fontFamily: "ui-monospace, monospace" };

export default function FeatureScalingPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: "var(--c-classification)" }, { label: "Tier 2 · distance & weighting", color: "var(--c-classification)" }]}
        time="about 7 minutes"
        title={<>Why feature scaling matters</>}
        intro={<>
          This is the single most common way to get k-NN badly wrong. Because distance sums every feature&rsquo;s
        difference, a feature measured in large units drowns out all the others — and the model quietly stops
        using them. The fix is one line, but you have to know to reach for it.
        </>}
      />

      <div className="lesson">
        <h2>Distance is dominated by the widest-scale feature</h2>
        <p>
          Euclidean distance adds up squared differences across features. If one feature is measured in
          thousands (income in dollars) and another in tens (age in years), the income term is numerically
          enormous next to the age term — so the sum is <em>almost entirely</em> income. Age might as well not
          be in the data.
        </p>

        <p>
          Take a query <strong>Q = (age 30, income $40,000)</strong> and two candidate neighbours. In every
          human sense, <strong>A</strong> is Q&rsquo;s peer (same age bracket) and <strong>B</strong> is not (twice
          the age). But look at what raw Euclidean distance decides:
        </p>

        <div style={{ overflowX: "auto", margin: "1.4rem 0" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", background: "var(--surface)", border: "1px solid var(--border-strong)", borderRadius: 10 }}>
            <thead>
              <tr>
                <th style={th}>Neighbour</th>
                <th style={th}>age gap</th>
                <th style={th}>income gap</th>
                <th style={th}>raw distance</th>
                <th style={th}>standardised distance</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={td}><strong>A</strong> (age 32, $41k) — a true peer</td>
                <td style={{ ...td, ...mono }}>2</td>
                <td style={{ ...td, ...mono }}>1,000</td>
                <td style={{ ...td, ...mono, color: "var(--bad, #d9534f)" }}>≈ 1000.0</td>
                <td style={{ ...td, ...mono, color: "var(--good)" }}>≈ 0.17</td>
              </tr>
              <tr>
                <td style={td}><strong>B</strong> (age 60, $40.2k) — very different</td>
                <td style={{ ...td, ...mono }}>30</td>
                <td style={{ ...td, ...mono }}>200</td>
                <td style={{ ...td, ...mono, color: "var(--good)" }}>≈ 202.2</td>
                <td style={{ ...td, ...mono, color: "var(--bad, #d9534f)" }}>≈ 2.50</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p>
          On <strong>raw</strong> distance, B (202) beats A (1000), so k-NN calls the 60-year-old the nearer
          neighbour — purely because a $200 income gap is a smaller number than $1,000, while the 28-year age
          difference contributes a rounding error. After <strong>standardising</strong> each feature (dividing
          by its spread — here <M>{String.raw`\sigma_{\text{age}}\approx 12`}</M>,{" "}
          <M>{String.raw`\sigma_{\text{income}}\approx 25\text{k}`}</M>), the verdict flips: A (0.17) is now
          correctly far nearer than B (2.50). Same data, same metric — the only change is putting the features
          on a common footing.
        </p>

        <h2>Standardise so every feature speaks at the same volume</h2>
        <p>
          The standard fix rescales each feature to zero mean and unit variance before computing distances:
        </p>
        <MathBlock>{String.raw`x_i' = \frac{x_i - \mu_i}{\sigma_i}`}</MathBlock>
        <p>
          Now a &ldquo;one unit&rdquo; difference means &ldquo;one standard deviation&rdquo; in every feature, so
          each contributes comparably to the distance. Three common choices:
        </p>
        <ul style={ul}>
          <li><strong>Standardisation (z-score)</strong> — subtract mean, divide by std. The default; assumes roughly bell-shaped features.</li>
          <li><strong>Min–max scaling</strong> — squash to <M>{String.raw`[0,1]`}</M>. Simple, but a single outlier compresses everyone else into a sliver.</li>
          <li><strong>Robust scaling</strong> — centre by median, divide by IQR. Best when outliers would otherwise blow up the std or the range.</li>
        </ul>

        <Callout color="var(--c-classification)" title={<>Fit the scaler on train only — the same leakage trap</>}>
          Compute <M>{String.raw`\mu`}</M> and <M>{String.raw`\sigma`}</M> from the <strong>training folds
            only</strong>, then apply them to validation and test. Fitting the scaler on all the data lets test
            statistics leak into training and quietly inflates your scores. In scikit-learn this means the
            scaler goes <em>inside</em> the pipeline — the exact pattern from the choosing-k page.
        </Callout>

        <p>
          One nuance: standardising assumes every feature <em>deserves</em> equal weight. Sometimes it
          doesn&rsquo;t — an irrelevant feature scaled up to unit variance now contributes as much noise as a
          useful feature contributes signal. That&rsquo;s the bridge to feature weighting and selection later in
          the track; scaling is the right default, not the final word.
        </p>

        <CodeBlock setup={KNN_SETUP} fromScratch={codeScratch} withLibrary={codeLib} />

        <Quiz
          accent="var(--c-classification)"
          questions={[
            {
              q: "Why does an unscaled 'income in dollars' feature dominate Euclidean distance?",
              options: ["Its numeric differences are huge, so its squared term swamps every other feature's", "It's always the most predictive feature", "Euclidean distance ignores small-scale features by design"],
              answer: 0,
              explain: "Distance sums squared differences. A feature with a large numeric range contributes a large term regardless of importance, so the others become negligible.",
            },
            {
              q: "Your data has a few extreme outliers in one feature. Which scaler is safest?",
              options: ["Robust scaling (median / IQR)", "Min–max scaling", "No scaling — outliers don't affect distance"],
              answer: 0,
              explain: "Min–max lets one outlier compress everyone else; standardisation's std is also outlier-sensitive. Robust scaling uses median and IQR, which shrug off extremes.",
            },
            {
              q: "Where should the scaler's mean and std come from?",
              options: ["The training folds only, then applied to validation/test", "The whole dataset, for consistency", "Each fold computes its own on all the data"],
              answer: 0,
              explain: "Fitting on all the data leaks test statistics into training. Fit on train, transform the rest — which is why the scaler belongs inside the CV pipeline.",
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/k-nearest-neighbors/distance-metrics-for-k-nn", label: <>← Distance metrics for k-NN</> }} next={{ href: "/learn/k-nearest-neighbors/distance-weighted-voting", label: <>Next up · Distance-weighted voting →</> }} />
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np

# standardise using TRAIN statistics only, then apply everywhere
mu = X_train.mean(axis=0)
sd = X_train.std(axis=0)

X_train_s = (X_train - mu) / sd
X_test_s  = (X_test  - mu) / sd     # same mu, sd — no peeking at test

# now every feature contributes on a comparable scale to the distance
d = np.sqrt(((X_train_s - X_test_s[0])**2).sum(axis=1))
print("nearest 5 (scaled):", np.argsort(d)[:5])`;

const codeLib = `from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.neighbors import KNeighborsClassifier

# scaler inside the pipeline → refit per CV fold, applied to test automatically
knn = make_pipeline(StandardScaler(), KNeighborsClassifier(n_neighbors=7))
knn.fit(X_train, y_train)

print("unscaled would ignore small-range features;")
print("scaled test accuracy:", round(knn.score(X_test, y_test), 3))`;

const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
