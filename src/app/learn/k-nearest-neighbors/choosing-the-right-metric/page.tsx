import { M } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { KNN_SETUP } from "@/lib/runtimeSetup";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Choosing the right metric — Manifold",
  description:
    "You've met the metrics; this is how to actually pick one. Treat the metric as a hyperparameter: shortlist by data type, then let cross-validation choose it jointly with k and the weighting — because they interact.",
};

const th: React.CSSProperties = { textAlign: "left", padding: "8px 12px", fontSize: 12.5, color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)" };
const td: React.CSSProperties = { padding: "8px 12px", fontSize: 14, color: "var(--ink)", borderBottom: "1px solid var(--border)", verticalAlign: "top" };

export default function ChoosingMetricPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: "var(--c-classification)" }, { label: "Tier 2 · in practice", color: "var(--c-classification)" }]}
        time="about 7 minutes"
        title={<>Choosing the right metric</>}
        intro={<>
          The distance chapter gave you the catalogue of metrics. This page is the decision: how to shortlist,
        how to validate, and why the metric can&rsquo;t be chosen in isolation from <em>k</em> and the weighting.
        </>}
      />

      <div className="lesson">
        <h2>Start from the data type, not a favourite</h2>
        <p>
          There is no universally best metric — only the one whose notion of &ldquo;near&rdquo; matches your data.
          Use the data type to shortlist two or three candidates rather than guessing one:
        </p>

        <div style={{ overflowX: "auto", margin: "1.4rem 0" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", background: "var(--surface)", border: "1px solid var(--border-strong)", borderRadius: 10 }}>
            <thead>
              <tr>
                <th style={th}>If your data looks like…</th>
                <th style={th}>Shortlist</th>
                <th style={th}>Why</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={td}>Dense continuous, comparable scales</td>
                <td style={td}>Euclidean, Manhattan</td>
                <td style={td}>Straight-line similarity; Manhattan if you want robustness or you&rsquo;re in many dimensions.</td>
              </tr>
              <tr>
                <td style={td}>Direction matters, magnitude doesn&rsquo;t (text, embeddings)</td>
                <td style={td}>Cosine</td>
                <td style={td}>Compares angle, so length differences don&rsquo;t masquerade as dissimilarity.</td>
              </tr>
              <tr>
                <td style={td}>Correlated / unequally-spread numerics</td>
                <td style={td}>Mahalanobis (or standardise → Euclidean)</td>
                <td style={td}>Whitens the space so correlated features stop double-counting.</td>
              </tr>
              <tr>
                <td style={td}>Categorical / binary / sets</td>
                <td style={td}>Hamming, Jaccard</td>
                <td style={td}>Count mismatches / set overlap — Euclidean is meaningless on codes.</td>
              </tr>
              <tr>
                <td style={td}>Mixed types in one table</td>
                <td style={td}>Gower, or engineer a common space</td>
                <td style={td}>Applies a per-feature metric and averages; no single formula spans all columns.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>The metric is a hyperparameter — validate it</h2>
        <p>
          Once shortlisted, don&rsquo;t argue about the metric — <em>measure</em> it. Put the candidates in your grid
          and let held-out performance decide, exactly as you did for <M>{String.raw`k`}</M>. Domain knowledge
          picks the shortlist; cross-validation picks the winner.
        </p>

        <Callout color="var(--c-classification)" title={<>Metric, k, and weighting interact — tune them together</>}>
          These knobs are not independent. Switching to a metric that concentrates less (Manhattan) shifts the
            best <M>{String.raw`k`}</M>; adding distance weighting makes larger <M>{String.raw`k`}</M> safe, which
            again shifts the sweet spot; and every metric&rsquo;s behaviour depends on the scaling you applied first.
            Grid-searching the metric alone, with <M>{String.raw`k`}</M> and weights frozen, finds a false
            optimum. Search the <strong>joint</strong> grid.
        </Callout>

        <h2>Two symptoms that tell you to switch</h2>
        <ul style={ul}>
          <li>
            <strong>Everything looks equidistant.</strong> If neighbours are all at nearly the same distance
            (high-dimensional data), Euclidean has concentrated — try Manhattan or a fractional-<M>{String.raw`p`}</M>
            metric, and more importantly reduce dimensions first.
          </li>
          <li>
            <strong>One feature dictates every neighbour.</strong> If results barely change when you perturb most
            features, the metric is being driven by one column — revisit scaling, or move to a{" "}
            <em>weighted</em> or <em>learned</em> metric (the next page), which is really about letting the data
            set the per-feature weights.
          </li>
        </ul>

        <p>
          That second symptom is the bridge: choosing a named metric off a shelf is the manual version of a
          deeper idea — <strong>learning</strong> the metric from the data. Feature weighting and metric learning
          are next.
        </p>

        <CodeBlock setup={KNN_SETUP} fromScratch={codeScratch} withLibrary={codeLib} />

        <Quiz
          accent="var(--c-classification)"
          questions={[
            {
              q: "What's the recommended way to finalise a metric for k-NN?",
              options: ["Shortlist by data type, then cross-validate metric jointly with k and weights", "Always use Euclidean — it's the default", "Pick whichever gives the best training accuracy"],
              answer: 0,
              explain: "Domain knowledge narrows the candidates; a joint grid search over metric, k, and weighting picks the winner on held-out data. Training accuracy would just favour k=1.",
            },
            {
              q: "Why can't you tune the metric with k and weights held fixed?",
              options: ["They interact — the best k and weighting shift with the metric, so a frozen search finds a false optimum", "It's too slow", "The metric has no effect on k"],
              answer: 0,
              explain: "A less-concentrating metric changes the best k; weighting changes it again. Only a joint grid captures those interactions.",
            },
            {
              q: "Your k-NN results barely change when you perturb most features. This suggests…",
              options: ["The distance is dominated by one feature — revisit scaling or learn feature weights", "k is too small", "You should switch to accuracy as the metric"],
              answer: 0,
              explain: "If most features don't move the outcome, one column is driving the distance. That points to a scaling problem or the need for a weighted/learned metric.",
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/k-nearest-neighbors/ties-and-class-imbalance", label: <>← Ties &amp; class imbalance</> }} next={{ href: "/learn/k-nearest-neighbors/feature-selection-and-weighting", label: <>Next up · Feature selection &amp; weighting →</> }} />
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np
from sklearn.model_selection import cross_val_score
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.neighbors import KNeighborsClassifier

# compare shortlisted metrics fairly — same scaling, same CV
for metric, p in [("euclidean", 2), ("manhattan", 1)]:
    pipe = make_pipeline(StandardScaler(),
                         KNeighborsClassifier(n_neighbors=7, metric="minkowski", p=p))
    print(metric, round(cross_val_score(pipe, X_train, y_train, cv=5).mean(), 3))`;

const codeLib = `from sklearn.model_selection import GridSearchCV
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.neighbors import KNeighborsClassifier

pipe = Pipeline([("scale", StandardScaler()), ("knn", KNeighborsClassifier())])

# joint grid: metric, k, and weighting searched TOGETHER because they interact
grid = {
    "knn__n_neighbors": [3, 5, 7, 11, 21],
    "knn__p": [1, 2],                       # Manhattan vs Euclidean
    "knn__weights": ["uniform", "distance"],
}
search = GridSearchCV(pipe, grid, cv=5).fit(X_train, y_train)
print(search.best_params_)`;

const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
