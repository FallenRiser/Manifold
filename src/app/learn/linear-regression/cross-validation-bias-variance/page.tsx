import { CrossValidationLab } from "@/components/labs/CrossValidationLab";
import { CodeBlock } from "@/components/CodeBlock";
import { REGRESSION_SETUP } from "@/lib/runtimeSetup";
import { Backlinks } from "@/components/Backlinks";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { Quiz } from "@/components/Quiz";

const codeScratch = `import numpy as np

rng = np.random.default_rng(12)
x = np.linspace(0, 1, 80)
y = np.sin(2*np.pi*x) + rng.normal(scale=0.2, size=80)

def cv_mse(deg, k=5):
    idx = rng.permutation(len(x))
    errs = []
    for fold in np.array_split(idx, k):           # hold out each fold once
        tr = np.setdiff1d(idx, fold)
        c = np.polyfit(x[tr], y[tr], deg)          # fit on the rest
        errs.append(np.mean((np.polyval(c, x[fold]) - y[fold])**2))
    return np.mean(errs)

for d in [1, 3, 5, 9, 15]:
    print(f"degree {d:2d}   CV MSE {cv_mse(d):.3f}")   # U-shape: min in the middle`;

const codeLib = `import numpy as np
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import PolynomialFeatures
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import cross_val_score

rng = np.random.default_rng(12)
x = np.linspace(0, 1, 80)
y = np.sin(2*np.pi*x) + rng.normal(scale=0.2, size=80)
X = x.reshape(-1, 1)

for d in [1, 3, 5, 9, 15]:
    model = make_pipeline(PolynomialFeatures(d), LinearRegression())
    mse = -cross_val_score(model, X, y, cv=5,
                           scoring="neg_mean_squared_error").mean()
    print(f"degree {d:2d}   CV MSE {mse:.3f}")`;

export const metadata = {
  title: "Cross-validation & bias–variance — Manifold",
  description:
    "How to evaluate models honestly. Train-test splits, k-fold cross validation, and understanding the eternal tradeoff between underfitting and overfitting.",
};

export default function CrossValidationBiasVariancePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }, { label: "Evaluation", color: "var(--good)" }]}
        time="about 7 minutes"
        title={<>Cross-validation &amp; bias–variance</>}
        intro={<>
          Evaluating a model on the data it trained on is like giving a student an
        exam with the exact same questions they practiced. It measures
        memorisation, not learning.
        </>}
      />

      <Backlinks label="Related" items={[
        { label: "Bias–variance revisited", href: "/learn/linear-regression/bias-variance-revisited" },
        { label: "Regularization", href: "/learn/linear-regression/regularization" },
        { label: "R² and adjusted R²", href: "/learn/linear-regression/r-squared-and-adjusted" },
      ]} />

      <div className="lesson">
        <h2>The golden rule of ML</h2>
        <p>
          <strong>Never evaluate your model on your training data.</strong>
        </p>
        <p>
          Any sufficiently complex model can achieve zero training error just by
          memorising the noise in the dataset. To know if a model has actually
          learned the underlying pattern (generalisation), you must test it on
          data it has never seen before.
        </p>

        <h2>Train / Test splits</h2>
        <p>
          The simplest approach is to randomly split your data. Keep 80% for
          training the model, and lock the remaining 20% in a vault. Fit the
          model on the 80%, then predict on the 20% and calculate your RMSE.
        </p>
        <p>
          This is good, but has a flaw: what if you got "lucky" (or unlucky)
          with the random split? What if all the hardest examples ended up in
          the test set?
        </p>

        <h2>k-Fold Cross Validation</h2>
        <p>
          To eliminate the luck of the draw, we use k-Fold Cross Validation.
        </p>
        <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 18px", margin: "1.2rem 0" }}>
          <ol style={{ paddingLeft: "1.4em", margin: 0, lineHeight: 1.85, color: "var(--muted)", fontSize: 14.5 }}>
            <li>Shuffle the dataset and split it into <em>k</em> equal chunks (folds). <span style={{ color: "var(--ink)", fontWeight: 500 }}>(k=5 is standard)</span>.</li>
            <li>Train the model on folds 2, 3, 4, and 5. Test it on fold 1. Record the RMSE.</li>
            <li>Train the model on folds 1, 3, 4, and 5. Test it on fold 2. Record the RMSE.</li>
            <li>Repeat until every fold has been used as the test set exactly once.</li>
            <li>Average the <em>k</em> different RMSE scores.</li>
          </ol>
        </div>
        <p>
          This gives you a much more robust estimate of how your model will
          perform in the real world, because every single data point gets to be
          in the test set once.
        </p>

        <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "2.5rem 0" }} />

        <CrossValidationLab />

        <h2>The Bias-Variance Tradeoff</h2>
        <p>
          When you evaluate your models via cross-validation, you'll discover
          they fail in one of two distinct ways.
        </p>

        <div style={bvGrid}>
          <BVCard title="High Bias (Underfitting)" color="var(--c-regression)"
            body="The model is too simple. It cannot capture the true pattern in the data (like fitting a straight line to a curve). It performs poorly on the training set AND poorly on the test set." />
          <BVCard title="High Variance (Overfitting)" color="var(--warn)"
            body="The model is too complex. It memorises the training data, including the random noise (like a degree-15 polynomial). It performs perfectly on the training set, but terribly on the test set." />
        </div>

        <p>
          It's called a <strong>tradeoff</strong> because as you increase model
          complexity (e.g., adding polynomial features or interaction terms),
          bias goes down, but variance goes up.
        </p>

        <Callout color="var(--c-fundamentals)" title={<>The sweet spot</>}>
          The goal of machine learning is to find the exact level of
            complexity where the test error reaches its minimum. This is the
            U-shaped curve: as complexity increases, test error falls (as bias
            is reduced), hits a minimum, and then rises again (as variance takes
            over). You find this sweet spot using cross-validation.
        </Callout>

        <h2>Run k-fold yourself</h2>
        <p>
          Hold out each fold once, fit on the rest, average the errors. From scratch
          it&rsquo;s a loop over <code>np.array_split</code>; scikit-learn wraps it in
          <code>cross_val_score</code>. Both trace the same U across polynomial degree.
        </p>
        <CodeBlock setup={REGRESSION_SETUP} fromScratch={codeScratch} withLibrary={codeLib} />

        <Quiz
          title="Checkpoint · Evaluation"
          questions={[
            {
              q: <>You add a completely random feature to your model. Training R²:</>,
              options: ["Goes down — noise hurts", "Stays exactly the same", "Never decreases — which is why adjusted R² exists", "Becomes negative"],
              answer: 2,
              explain: <>OLS can always set a useless coefficient to squeeze out a sliver of training fit, so train R² only ever creeps up. Adjusted R² charges a per-feature penalty; held-out metrics tell the real story.</>,
            },
            {
              q: <>Your model&rsquo;s RMSE is much larger than its MAE on the same data. What does the gap tell you?</>,
              options: ["The model is underfitting", "A few large misses dominate — RMSE's squaring amplifies them, MAE doesn't", "The data was not scaled", "Nothing — they always differ by that ratio"],
              answer: 1,
              explain: <>MAE is the typical miss; RMSE inflates when errors are unequal. A wide RMSE-vs-MAE gap is a cheap outlier detector: go find the few rows the model gets badly wrong.</>,
            },
            {
              q: <>Why prefer 5-fold cross-validation over a single train/test split?</>,
              options: ["It trains one model instead of five", "Every row gets scored while unseen, and the estimate doesn't hinge on one lucky (or cursed) split", "It prevents overfitting during training", "It's faster"],
              answer: 1,
              explain: <>One split gives one noisy number that depends on which rows landed in the test set. CV rotates the held-out fold so all data contributes to the estimate — costlier (k fits) but far more stable. It <em>measures</em> generalization; it doesn&rsquo;t by itself prevent overfitting.</>,
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/linear-regression/rmse-vs-mae", label: <>← RMSE vs MAE</> }} next={{ href: "/learn/linear-regression/transformations", label: <>Next up · Transformations →</> }} />
      </div>
    </article>
  );
}

function BVCard({ title, body, color }: { title: string; body: string; color: string }) {
  return (
    <div style={{ borderLeft: `3px solid ${color}`, padding: "12px 16px", background: `color-mix(in srgb, ${color} 4%, var(--surface-2))` }}>
      <div className="font-display" style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>{title}</div>
      <p style={{ margin: 0, fontSize: 13.5, color: "var(--muted)", lineHeight: 1.6 }}>{body}</p>
    </div>
  );
}


const bvGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, margin: "1.6rem 0" };


