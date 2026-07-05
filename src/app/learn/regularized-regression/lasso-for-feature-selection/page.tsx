import { CodeBlock } from "@/components/CodeBlock";
import { CoefPathLab } from "@/components/labs/CoefPathLab";
import { REGRESSION_SETUP } from "@/lib/runtimeSetup";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Lasso for feature selection — Manifold",
  description:
    "Lasso is the most popular embedded feature-selection method — but its selections come with real caveats: instability, arbitrary choices among correlated features, and a bias on the survivors.",
};

export default function FeatureSelectionPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }]}
        time="about 6 minutes"
        title={<>Lasso for feature selection</>}
        intro={<>
          Lasso&rsquo;s sparsity makes it the default tool for picking features — selection happens <em>inside</em>{" "}
        the fit, not as a separate step. That&rsquo;s powerful and convenient, but the selections are not gospel,
        and knowing the caveats keeps you honest.
        </>}
      />

      <div className="lesson">
        <h2>Embedded selection</h2>
        <p>
          Feature-selection methods come in three flavours: <strong>filter</strong> (rank features by a
          statistic before modelling), <strong>wrapper</strong> (search over feature subsets, e.g. forward
          selection), and <strong>embedded</strong> (selection happens as part of fitting the model). Lasso is
          the canonical embedded method: minimising the L1-penalised objective <em>is</em> the selection. One
          fit, and the nonzero coefficients are your chosen features — no separate search, and selection and
          estimation use the same criterion.
        </p>

        <CoefPathLab />

        <h2>Why it&rsquo;s so widely used</h2>
        <ul style={ul}>
          <li><strong>Scales to huge feature counts</strong> — comfortable with thousands or millions of features, where wrapper search is hopeless.</li>
          <li><strong>Selection and prediction in one model</strong> — no two-stage pipeline to maintain.</li>
          <li><strong>A continuous dial</strong> — λ smoothly controls how many features survive, from all to none.</li>
        </ul>

        <h2>The caveats a careful analyst respects</h2>
        <ul style={ul}>
          <li>
            <strong>Instability.</strong> Lasso&rsquo;s selected set can change noticeably with small perturbations
            of the data. Don&rsquo;t over-trust a single run&rsquo;s exact feature list.
          </li>
          <li>
            <strong>Arbitrary choice among correlated features.</strong> Given a group of correlated predictors,
            Lasso tends to keep one and zero the rest — and <em>which</em> one is somewhat random. The dropped
            features may be just as predictive. (Elastic-net fixes this.)
          </li>
          <li>
            <strong>Bias on the survivors.</strong> The same penalty that selects also shrinks the surviving
            coefficients toward zero, so their magnitudes are biased low. If you need accurate effect sizes,
            refit plain OLS on the selected features — the <strong>relaxed Lasso</strong> / debiasing step.
          </li>
          <li>
            <strong>Selection isn&rsquo;t inference.</strong> A feature surviving Lasso is not a p-value; valid
            post-selection statistical inference needs dedicated methods. Treat Lasso selections as a useful
            shortlist, not a hypothesis test.
          </li>
        </ul>

        <Callout color="var(--c-regression)" title={<>Make selections more trustworthy: stability selection</>}>
          Run Lasso on many bootstrap resamples and keep the features that are selected <em>frequently</em>
            across runs. This <strong>stability selection</strong> turns a jittery single-run list into a robust
            one with error control, and is the right move when the selected set itself — not just predictions —
            is the deliverable (as in genomics or biomarker discovery).
        </Callout>

        <h2>Select, then optionally debias</h2>
        <CodeBlock setup={REGRESSION_SETUP} fromScratch={codeScratch} withLibrary={codeLib} />

        <PrevNext prev={{ href: "/learn/regularized-regression/the-regularization-path", label: <>← The regularization path</> }} next={{ href: "/learn/regularized-regression/solving-the-lasso", label: <>Next up · Solving the Lasso →</> }} />
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np
from sklearn.linear_model import LassoCV, LinearRegression

# 1. select features with cross-validated Lasso
lasso = LassoCV(cv=5, random_state=0).fit(X, y)
keep = np.flatnonzero(lasso.coef_)
print("selected features:", keep)

# 2. (relaxed Lasso) refit OLS on just those features to debias the magnitudes
ols = LinearRegression().fit(X[:, keep], y)
print("debiased coefs:", ols.coef_)`;

const codeLib = `from sklearn.feature_selection import SelectFromModel
from sklearn.linear_model import Lasso

# SelectFromModel wraps Lasso as a drop-in feature selector for a pipeline
selector = SelectFromModel(Lasso(alpha=0.05)).fit(X, y)
X_reduced = selector.transform(X)
print("kept", X_reduced.shape[1], "of", X.shape[1], "features")`;


const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };


