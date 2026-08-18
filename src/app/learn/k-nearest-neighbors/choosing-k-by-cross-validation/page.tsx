import { M } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { KNN_SETUP } from "@/lib/runtimeSetup";
import { KNNChooseKLab } from "@/components/labs/KNNChooseKLab";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Choosing k by cross-validation — Manifold",
  description:
    "The training set always prefers k=1, so you must judge k on data it hasn't seen. Cross-validation is the procedure — here's how to run it, read the validation curve, and avoid the leakage that quietly inflates it.",
};

export default function ChoosingKByCVPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: "var(--c-classification)" }, { label: "Tier 2 · choosing k", color: "var(--c-classification)" }]}
        time="about 8 minutes"
        title={<>Choosing k by cross-validation</>}
        intro={<>
          The last two pages said k must be judged on held-out data. This one turns that into a recipe:
        sweep k, score each value by cross-validation, and take the peak of the <em>validation</em> curve —
        never the training one.
        </>}
      />

      <div className="lesson">
        <h2>Why not just try k on the training set?</h2>
        <p>
          Because the training set is rigged in favour of overfitting. At <M>{String.raw`k = 1`}</M> every point
          is its own nearest neighbour, so training accuracy is a perfect — and perfectly useless — 100%. Any
          search that scores k on the data it memorised will pick <M>{String.raw`k = 1`}</M> every time. The
          only honest judge of k is data the model hasn&rsquo;t seen.
        </p>

        <PredictPrompt
          accent="var(--c-classification)"
          prompt={<>Below, the training curve peaks at k=1. Where will the <em>validation</em> curve peak?</>}
          options={["At an interior k, well above 1", "Also at k=1", "At the largest k"]}
        />
        <LabFrame
          accent="var(--c-classification)"
          tryThis={<>Click along the k values. Watch the dashed training curve fall from its perfect start while the solid validation curve rises to a hump, then declines.</>}
          insight={<>The two curves disagree by design: training rewards memorising, validation rewards generalising. You read k off the solid curve's peak — here near √n.</>}
        >
          <KNNChooseKLab />
        </LabFrame>

        <h2>The procedure, step by step</h2>
        <ol style={ol}>
          <li>Hold out a <strong>test set</strong> and set it aside — it plays no part in choosing k.</li>
          <li>Pick a grid of candidate k values (odd values around <M>{String.raw`\sqrt{n}`}</M> make a sensible span, widened until the curve clearly turns over on both sides).</li>
          <li>For each k, run <strong>K-fold cross-validation</strong> on the training data: split into folds, train on all-but-one, score the held-out fold, average.</li>
          <li>Choose the k with the best mean validation score.</li>
          <li>Refit on all the training data at that k, then report performance <strong>once</strong> on the untouched test set.</li>
        </ol>
        <p>
          Cross-validation matters here more than usual because k-NN &ldquo;trains&rdquo; instantly — there&rsquo;s
          no expensive fitting — so you can afford to score many k values across many folds cheaply.
        </p>

        <h2>Do it in scikit-learn</h2>
        <p>
          <code>GridSearchCV</code> wraps the whole sweep. Note the scaler lives <em>inside</em> a pipeline, so
          it&rsquo;s refit on each fold&rsquo;s training portion — the point of the next section, and the most common
          way a k-NN validation score gets quietly inflated.
        </p>
        <CodeBlock setup={KNN_SETUP} fromScratch={codeManual} withLibrary={codeGrid} />

        <Callout color="var(--c-classification)" title={<>The leakage trap, in one sentence</>}>
          If you scale (or select features, or impute) using the <em>whole</em> training set before
            cross-validating, each fold&rsquo;s validation points have already influenced the transform that judges
            them — so the CV score is optimistic and the k you pick is wrong. Always put preprocessing{" "}
            <strong>inside</strong> the pipeline you pass to <code>GridSearchCV</code>, so every fold refits it
            from scratch.
        </Callout>

        <h2>Reading the result sensibly</h2>
        <ul style={ul}>
          <li>
            <strong>The curve is usually flat near the top.</strong> A broad plateau of near-tied k values is
            common — prefer a <em>larger</em> k within it (simpler, steadier, cheaper at query time).
          </li>
          <li>
            <strong>Use the one-standard-error rule.</strong> Among k values within one standard error of the
            best, pick the simplest (largest k). It guards against chasing a noise-driven peak.
          </li>
          <li>
            <strong>Re-tune k after any change to the features or the metric.</strong> The best k depends on the
            distance function and the scaling — change those and the U-curve moves.
          </li>
        </ul>

        <Quiz
          accent="var(--c-classification)"
          questions={[
            {
              q: "You cross-validate and the validation curve is nearly flat for k = 9, 11, 13, 15. Which do you pick?",
              options: ["The largest, k=15 — simplest and steadiest within the tie", "The smallest, k=9 — most flexible", "k=1, since it had the best training accuracy"],
              answer: 0,
              explain: "On a plateau, the one-standard-error rule favours the simpler model: a larger k is smoother, cheaper, and less likely to be a noise-driven peak.",
            },
            {
              q: "Why must the StandardScaler go inside the GridSearchCV pipeline?",
              options: ["So it refits on each fold's training portion — otherwise validation points leak into the scaling", "To make the code shorter", "So the scaler runs faster"],
              answer: 0,
              explain: "Scaling on the full training set before CV lets held-out points shape the transform that judges them, inflating the score and biasing your choice of k.",
            },
            {
              q: "After choosing k by CV, the test set is for…",
              options: ["A single final estimate of performance — it never influences k", "Choosing k, as a third validation split", "Refitting the scaler"],
              answer: 0,
              explain: "The test set is touched once, at the end. If it ever informs the choice of k, it stops being an honest estimate of generalisation.",
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/k-nearest-neighbors/bias-and-variance-in-k-nn", label: <>← Bias &amp; variance in k-NN</> }} next={{ href: "/learn/k-nearest-neighbors/distance-metrics-for-k-nn", label: <>Next up · Distance metrics for k-NN →</> }} />
      </div>
    </article>
  );
}

const codeManual = `import numpy as np
from sklearn.model_selection import cross_val_score
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.neighbors import KNeighborsClassifier

ks = [1, 3, 5, 7, 9, 11, 15, 21, 31]
scores = []
for k in ks:
    pipe = make_pipeline(StandardScaler(), KNeighborsClassifier(n_neighbors=k))
    cv = cross_val_score(pipe, X_train, y_train, cv=5)   # 5-fold, refit per fold
    scores.append(cv.mean())

best_k = ks[int(np.argmax(scores))]
print("CV accuracy per k:", [round(s, 3) for s in scores])
print("best k:", best_k)`;

const codeGrid = `from sklearn.model_selection import GridSearchCV
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.neighbors import KNeighborsClassifier

pipe = Pipeline([
    ("scale", StandardScaler()),          # refit inside every fold — no leakage
    ("knn", KNeighborsClassifier()),
])
grid = {"knn__n_neighbors": [1, 3, 5, 7, 9, 11, 15, 21, 31]}

search = GridSearchCV(pipe, grid, cv=5, scoring="accuracy").fit(X_train, y_train)
print("best k:", search.best_params_["knn__n_neighbors"])
print("CV score:", round(search.best_score_, 3))
print("held-out test:", round(search.score(X_test, y_test), 3))  # touched once`;

const ol: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.85 };
const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
