import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

const ACCENT = "var(--c-regression)";

const code = `import numpy as np
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import SplineTransformer, StandardScaler
from sklearn.linear_model import Ridge
from sklearn.model_selection import GridSearchCV, train_test_split

# temperature (°C) -> energy demand (a smooth, U-shaped relationship:
# demand rises in the cold AND the heat). One feature, curved signal.
X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.25, random_state=0)

# scale -> spline basis -> ridge, all in one leak-free pipeline
pipe = make_pipeline(
    StandardScaler(),
    SplineTransformer(degree=3),      # cubic B-spline basis
    Ridge(),
)

# let CV choose the flexibility (knots) AND the penalty together
grid = GridSearchCV(
    pipe,
    {"splinetransformer__n_knots": [4, 6, 8, 12],
     "ridge__alpha": [0.01, 0.1, 1.0, 10.0]},
    scoring="neg_root_mean_squared_error", cv=5,
)
grid.fit(X_tr, y_tr)

print("best:", grid.best_params_)
print("CV RMSE :", round(-grid.best_score_, 2))
print("test RMSE:", round(
    ((grid.predict(X_te) - y_te) ** 2).mean() ** 0.5, 2))`;

export const metadata = {
  title: "A worked example — Manifold",
  description: "The whole polynomial & basis-function track in one pipeline: scale, build a spline basis, regularize, and let cross-validation choose the flexibility — leak-free, from raw data to an honest test score.",
};

export default function WorkedExamplePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: ACCENT }, { label: "Practitioner", color: "var(--c-fundamentals)" }]}
        time="about 8 minutes"
        title={<>A worked example</>}
        intro={<>
          One end-to-end pass that uses every idea in the track. We predict energy demand from temperature — a
          smooth, U-shaped relationship a straight line can&rsquo;t touch — with a spline basis, ridge, and
          cross-validation choosing the flexibility. This is the template you&rsquo;ll actually reach for.
        </>}
      />

      <div className="lesson">
        <h2>The problem, and why a line fails</h2>
        <p>
          Electricity demand versus outdoor temperature is famously U-shaped: it climbs in the cold (heating) and
          again in the heat (air conditioning), with a comfortable trough in between. A straight line fits a slope
          through the middle of that U and is wrong everywhere. This is the exact situation basis regression was
          built for — one input, a smooth curved signal, and a need for an interpretable fit.
        </p>

        <h2>The pipeline, assembled from the track</h2>
        <p>
          Every decision below is a page you&rsquo;ve read: <strong>scale first</strong> (pipelines page), a{" "}
          <strong>cubic spline basis</strong> for local, stable flexibility (splines page), <strong>ridge</strong>
          to regularize the coefficients (regularizing page), and <strong>cross-validation</strong> to choose the
          knot count and penalty together without touching the test set (choosing-bases page).
        </p>

        <CodeBlock fromScratch={code} withLibrary={code} />
        <CodeOutput>{`best: {'ridge__alpha': 0.1, 'splinetransformer__n_knots': 8}
CV RMSE : 3.14
test RMSE: 3.29`}</CodeOutput>

        <p>
          The grid search sweeps flexibility (4–12 knots) and penalty (<code>alpha</code>) jointly, scoring each
          combination by 5-fold CV, and lands on 8 knots with a mild penalty. The test RMSE (3.29) sits just above
          the cross-validated estimate (3.14) — close together, which is the signature of a fit that generalised
          rather than overfit. If the test error had ballooned past the CV number, that gap would be the tell-tale
          of leakage or an over-tuned model.
        </p>

        <PredictPrompt
          accent={ACCENT}
          prompt={<>Why are the knot count and ridge <code>alpha</code> searched <em>together</em> in one grid rather than tuned one at a time?</>}
          options={[
            "They interact — more knots need more penalty, so the best pair isn't found by optimising each alone",
            "It's just faster",
            "Only alpha actually matters",
          ]}
          nudge={<>Think about what the right penalty is for 4 knots versus 12 knots.</>}
        />

        <p>
          The two knobs are coupled: a flexible 12-knot basis wants a firmer penalty than a stiff 4-knot one, so
          the best <code>alpha</code> depends on the knot count. Tuning them separately can miss the jointly-optimal
          pair — which is why they go in the same grid. It&rsquo;s the &ldquo;generous basis + penalty&rdquo; idea
          from the regularizing page: let flexibility and shrinkage be chosen as a unit.
        </p>

        <Callout color={ACCENT} title={<>The template, and the track</>}>
          <strong>Scale → basis → regularize → cross-validate</strong> is the whole workflow. Straight lines gave
          way to polynomials (still linear in the parameters), polynomials to a general basis, high degrees to
          local bases (RBFs, splines), and the flexibility knob to a penalty tuned by CV — all while never leaving
          the comfort of least squares. That arc is the polynomial &amp; basis-function track: non-linear shapes,
          linear-model machinery, controlled by the bias–variance trade you now know how to navigate.
        </Callout>

        <Quiz
          accent={ACCENT}
          questions={[
            {
              q: "The energy-demand vs temperature relationship is U-shaped. Why prefer a spline over a straight line?",
              options: [
                "A line can't represent the rise-fall-rise shape; a spline captures it with stable local pieces",
                "A line is always overfit",
                "Splines are faster to fit",
              ],
              answer: 0,
              explain: "A straight line has one slope and can't bend twice. A cubic spline captures the U with local pieces while staying smooth and stable — flexibility without Runge oscillations.",
            },
            {
              q: "Test RMSE (3.29) being close to the CV RMSE (3.14) indicates…",
              options: [
                "The model overfit badly",
                "The fit generalised — the honest held-out error matches the cross-validated estimate",
                "A bug in the pipeline",
              ],
              answer: 1,
              explain: "A small gap between CV and test error means the CV estimate was trustworthy and the model didn't overfit. A large jump would signal leakage or over-tuning.",
            },
            {
              q: "Wrapping scaling, spline expansion, and ridge in one pipeline for GridSearchCV ensures…",
              options: [
                "Faster training only",
                "Each fold re-fits every transform on training data only — no leakage — while tuning knots and alpha jointly",
                "The model stays linear in x",
              ],
              answer: 1,
              explain: "The pipeline makes every data-dependent step fold-safe and lets the search tune the coupled hyperparameters (knots and penalty) together, honestly and without leaking the held-out data.",
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/polynomial-regression/when-to-use-basis-regression", label: <>← When to use it</> }}
          next={{ href: "/learn/regularized-regression", label: <>Related · Regularized regression →</> }}
        />
      </div>
    </article>
  );
}
