import { CodeBlock } from "@/components/CodeBlock";
import { LambdaCVLab } from "@/components/labs/LambdaCVLab";
import { REGRESSION_SETUP } from "@/lib/runtimeSetup";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Cross-validating the penalty — Manifold",
  description:
    "Choosing λ by cross-validation is routine; doing it without fooling yourself is the subtle part. Nested CV, the one-standard-error rule, and the leakage traps that inflate every reported score.",
};

export default function CVPenaltyPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }]}
        time="about 7 minutes"
        title={<>Cross-validating the penalty</>}
        intro={<>
          Using cross-validation to pick λ is easy. Using it without quietly cheating — and getting an honest
        estimate of how the final model will perform — takes a little care. This page is about doing it right.
        </>}
      />

      <div className="lesson">
        <h2>The basic loop</h2>
        <p>
          For each candidate penalty, run k-fold CV and average the held-out error; pick the penalty with the
          lowest CV error, then refit on all the training data at that value. For ridge and lasso, the entire
          λ path is cheap, so you score a dense grid almost for free. This is what <code>RidgeCV</code>,{" "}
          <code>LassoCV</code>, and <code>ElasticNetCV</code> do.
        </p>

        <LambdaCVLab />

        <h2>The trap: selection leaks into your score</h2>
        <p>
          Here&rsquo;s the subtle mistake almost everyone makes once. You CV over λ, pick the best, and then report
          that best CV score as your model&rsquo;s performance. <strong>That number is optimistically biased.</strong>{" "}
          You chose λ <em>because</em> it scored well on those folds, so reporting the winning fold-score
          double-counts the selection. The more λ values (and α values) you try, the more you&rsquo;re &ldquo;fitting the
          validation set,&rdquo; and the more inflated the score.
        </p>

        <h2>The fix: nested cross-validation</h2>
        <p>
          Separate the two jobs — choosing λ and estimating performance — into two nested loops:
        </p>
        <ul style={ul}>
          <li><strong>Inner loop:</strong> on the training portion, CV over λ to <em>select</em> the penalty.</li>
          <li><strong>Outer loop:</strong> evaluate the selected model on a fold the inner loop never saw, to <em>estimate</em> performance.</li>
        </ul>
        <p>
          The outer score is honest because λ was chosen without touching that data. Use nested CV whenever you
          need to <em>report</em> a performance number; use plain CV when you only need to <em>pick</em> λ and a
          separate held-out test set will give the final estimate.
        </p>

        <Callout color="var(--c-regression)" title={<>The one-standard-error rule</>}>
          CV error is itself a noisy estimate, so the exact minimum is partly luck. The widely-used{" "}
            <strong>1-SE rule</strong>: among all λ whose CV error is within one standard error of the best,
            pick the <em>most regularized</em> one (largest λ, smallest model). You give up a sliver of fit for
            a simpler, more robust model that&rsquo;s less likely to be a fluke of this particular data — especially
            valuable with Lasso, where it yields a sparser, sturdier feature set.
        </Callout>

        <h2>Other leakage traps</h2>
        <ul style={ul}>
          <li><strong>Scaling outside CV.</strong> Standardizing on the full dataset before CV leaks test statistics into training. Put the scaler <em>inside</em> the pipeline so it re-fits per fold.</li>
          <li><strong>Feature selection outside CV.</strong> Same issue — any selection (including a Lasso pre-pass) must live inside the CV loop, or your score is inflated.</li>
          <li><strong>Non-independent data.</strong> Time series or grouped data need time-aware or grouped splits; ordinary k-fold leaks the future into the past.</li>
        </ul>

        <h2>Nested CV in code</h2>
        <CodeBlock setup={REGRESSION_SETUP} fromScratch={codeScratch} withLibrary={codeLib} />

        <PrevNext prev={{ href: "/learn/regularized-regression/standardize-first", label: <>← Standardize first</> }} next={{ href: "/learn/regularized-regression/the-full-path-and-warm-starts", label: <>Next up · The full path &amp; warm starts →</> }} />
      </div>
    </article>
  );
}

const codeScratch = `from sklearn.linear_model import Lasso
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
from sklearn.model_selection import GridSearchCV, cross_val_score
import numpy as np

# inner loop selects λ; scaler lives in the pipeline so it re-fits per fold
pipe = make_pipeline(StandardScaler(), Lasso())
grid = GridSearchCV(pipe, {"lasso__alpha": np.logspace(-3, 1, 30)}, cv=5)

# outer loop gives an UNBIASED performance estimate (λ chosen without seeing the fold)
scores = cross_val_score(grid, X, y, cv=5, scoring="neg_mean_squared_error")
print("honest CV MSE:", -scores.mean())`;

const codeLib = `from sklearn.linear_model import LassoCV
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline

# LassoCV picks λ along the path internally; wrap in a pipeline for clean scaling.
# Hold out a final test set for the reported number — don't reuse the CV score.
model = make_pipeline(StandardScaler(), LassoCV(cv=5, random_state=0))
model.fit(X_train, y_train)
print("test R²:", model.score(X_test, y_test))`;


const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };


