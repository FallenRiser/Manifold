import { M } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { PredictPrompt } from "@/components/PredictPrompt";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

const ACCENT = "var(--c-regression)";

const badCode = `from sklearn.preprocessing import PolynomialFeatures, StandardScaler
from sklearn.linear_model import Ridge

# WRONG: transforms fit on the whole dataset before splitting/CV
Xp = PolynomialFeatures(degree=9).fit_transform(X)
Xs = StandardScaler().fit_transform(Xp)          # saw the test rows!

# ...now cross-validate on Xs — scores are optimistic (leakage)`;

const goodCode = `from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import PolynomialFeatures, StandardScaler
from sklearn.linear_model import Ridge
from sklearn.model_selection import cross_val_score

# RIGHT: scale THEN expand THEN fit — all inside one pipeline,
# so every step is re-fit on the training fold only.
model = make_pipeline(
    StandardScaler(),                 # scale first: keeps x**9 from exploding
    PolynomialFeatures(degree=9),
    Ridge(alpha=1.0),
)

scores = cross_val_score(model, X, y, cv=5, scoring="neg_mean_squared_error")
print("CV RMSE:", (-scores.mean())**0.5)`;

export const metadata = {
  title: "Pipelines, scaling & leakage — Manifold",
  description: "Basis expansion makes two silent bugs easy: scaling in the wrong order, and leaking test data through a transform fit on everything. Pipelines fix both by construction.",
};

export default function PipelinesLeakagePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: ACCENT }, { label: "Practitioner", color: "var(--c-fundamentals)" }]}
        time="about 8 minutes"
        title={<>Pipelines, scaling &amp; leakage</>}
        intro={<>
          The theory of basis regression is clean; the plumbing is where people quietly get wrong answers. Two
          traps hide in the transform step — the order of scaling, and leaking the test set through it — and both
          vanish the moment you wrap everything in a pipeline.
        </>}
      />

      <div className="lesson">
        <h2>Scale first, then expand</h2>
        <p>
          Powers of an unscaled feature are a disaster. If <M>x</M> ranges up to 1000, then{" "}
          <M>{String.raw`x^9`}</M> reaches <M>{String.raw`10^{27}`}</M>, while the constant term is 1 — the design
          matrix spans thirty orders of magnitude and the numerics collapse. <strong>Standardise the raw feature
          first</strong> (mean 0, unit variance), <em>then</em> build the polynomial or spline features on the
          scaled values, so every column stays in a sane range. Order matters: scale → expand, never the reverse.
        </p>

        <h2>The leakage trap</h2>
        <p>
          Both a scaler and (some) basis constructions <em>learn</em> from data — the scaler learns the mean and
          standard deviation. Fit them on the whole dataset before splitting and information from the test rows
          leaks into training: the scaler&rsquo;s mean already &ldquo;knows&rdquo; the test set. Your CV score
          comes out optimistic, and you discover the gap only in production.
        </p>

        <PredictPrompt
          accent={ACCENT}
          prompt={<>You standardise and polynomial-expand the full dataset, then run 5-fold CV on the result. What&rsquo;s wrong?</>}
          options={[
            "Nothing — preprocessing is harmless",
            "Leakage: the transforms saw the test folds, so CV scores are optimistic",
            "Polynomial features can't be cross-validated",
          ]}
          nudge={<>Ask what the scaler&rsquo;s mean and std were computed from.</>}
        />

        <CodeBlock fromScratch={badCode} withLibrary={goodCode} />

        <p>
          The two tabs are the whole lesson. The first fits the transforms on everything, then cross-validates —
          leakage baked in. The second wraps scaling, expansion, and the ridge fit into a single pipeline and
          hands <em>that</em> to <code>cross_val_score</code>, so on every fold the transforms are re-fit on the
          training portion only and applied to the held-out portion. The pipeline makes the correct thing the
          easy thing.
        </p>

        <Callout color={ACCENT} title={<>Wrap the whole thing, not just the model</>}>
          Any step that learns from data — scaling, polynomial/spline expansion, imputation, feature selection —
          belongs <em>inside</em> the pipeline that cross-validation drives, so it never sees a fold it&rsquo;s
          being tested on. And always scale before you expand, so <M>{String.raw`x^9`}</M> can&rsquo;t blow up the
          design matrix. Two habits, and the two most common basis-regression bugs disappear.
        </Callout>

        <Quiz
          accent={ACCENT}
          questions={[
            {
              q: "Why standardise the feature before polynomial expansion?",
              options: [
                "To make the model nonlinear",
                "So high powers like x⁹ stay in a sane numeric range instead of spanning many orders of magnitude",
                "Scaling has no effect after expansion",
              ],
              answer: 1,
              explain: "Unscaled, a large x makes x⁹ astronomically bigger than the low-order terms, wrecking the design matrix's conditioning. Scaling first keeps every polynomial column comparable.",
            },
            {
              q: "Fitting StandardScaler on the full dataset before cross-validation causes…",
              options: [
                "Data leakage — the scaler's statistics include the test folds, inflating CV scores",
                "A syntax error",
                "Underfitting",
              ],
              answer: 0,
              explain: "The scaler learns mean/std from all rows, including those it will later be tested on. That leaks test information into training, so the CV estimate is optimistically biased.",
            },
            {
              q: "The correct way to cross-validate a scale→expand→ridge workflow is…",
              options: [
                "Preprocess once, then CV the model alone",
                "Put all steps in a pipeline and pass the pipeline to cross_val_score, so each step re-fits per fold",
                "Skip scaling during CV",
              ],
              answer: 1,
              explain: "A pipeline re-fits every data-dependent step on each training fold and applies it to the held-out fold — no leakage. Cross-validating the whole pipeline, not just the estimator, is the fix.",
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/polynomial-regression/regularizing-the-basis", label: <>← Regularizing the basis</> }}
          next={{ href: "/learn/polynomial-regression/when-to-use-basis-regression", label: <>Next up · When to use it →</> }}
        />
      </div>
    </article>
  );
}
