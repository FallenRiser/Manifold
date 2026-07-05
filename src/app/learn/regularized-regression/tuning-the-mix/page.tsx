import { M } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { ElasticNetMixLab } from "@/components/labs/ElasticNetMixLab";
import { REGRESSION_SETUP } from "@/lib/runtimeSetup";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Tuning the mix — Manifold",
  description:
    "Elastic-net has two hyperparameters — overall strength λ and the L1/L2 mix α. Here's how to search them jointly with cross-validation, and the intuition for where the sweet spot tends to land.",
};

export default function TuningMixPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }]}
        time="about 5 minutes"
        title={<>Tuning the mix</>}
        intro={<>
          Elastic-net&rsquo;s flexibility costs you a second hyperparameter. Tuning <M>{String.raw`\lambda`}</M> and{" "}
        <M>{String.raw`\alpha`}</M> together is straightforward with cross-validation — and the two knobs have
        clean, separate jobs.
        </>}
      />

      <div className="lesson">
        <h2>Two knobs, two roles</h2>
        <ul style={ul}>
          <li><strong><M>{String.raw`\lambda`}</M> (overall strength)</strong> — how much total regularization. Controls the bias–variance position, exactly as in ridge and lasso. Search it on a log scale.</li>
          <li><strong><M>{String.raw`\alpha`}</M> / <code>l1_ratio</code> (the mix)</strong> — how sparse vs. how grouped. Near 1 behaves like Lasso (aggressive selection); near 0 like Ridge (keep everything, share weight). Search it on a small grid in <M>{String.raw`[0, 1]`}</M>.</li>
        </ul>

        <h2>The search: a 2-D grid</h2>
        <p>
          You&rsquo;re cross-validating over a grid of <M>{String.raw`(\alpha, \lambda)`}</M> pairs. The efficient way
          mirrors the single-penalty case: <strong>for each <M>{String.raw`\alpha`}</M>, compute the whole{" "}
          <M>{String.raw`\lambda`}</M> path</strong> with warm starts (cheap), score every point by CV, and keep
          the best pair overall. Because the inner λ sweep is nearly free, adding the α dimension is only as
          expensive as the handful of α values you try — typically something like{" "}
          <M>{String.raw`\{0.1, 0.5, 0.7, 0.9, 0.95, 1.0\}`}</M>.
        </p>

        <ElasticNetMixLab />

        <Callout color="var(--c-regression)" title={<>Where the sweet spot usually sits</>}>
          For problems where you want sparsity, a high <M>{String.raw`\alpha`}</M> (0.7–0.95) is a common winner:
            mostly Lasso, with just enough L2 to stabilise selection and keep correlated groups together. If
            your features form strong correlated clusters and you care more about prediction than a short list,
            CV will pull <M>{String.raw`\alpha`}</M> lower. Letting cross-validation choose means you don&rsquo;t have to
            commit to Ridge-vs-Lasso up front — the data decides.
        </Callout>

        <h2>Practical notes</h2>
        <ul style={ul}>
          <li><strong>Standardize first</strong> — doubly important with two penalties (its own page next).</li>
          <li><strong>Don&rsquo;t over-tune <M>{String.raw`\alpha`}</M></strong> — performance is usually flat across a range of α, so a coarse grid is plenty; the precise value rarely matters.</li>
          <li><strong>Use a nested split for honest scores</strong> — if you report performance, the final evaluation should be on data untouched by the <M>{String.raw`(\alpha, \lambda)`}</M> search.</li>
        </ul>

        <h2>Joint CV in one call</h2>
        <CodeBlock setup={REGRESSION_SETUP} fromScratch={codeScratch} withLibrary={codeLib} />

        <PrevNext prev={{ href: "/learn/regularized-regression/elastic-net", label: <>← Elastic-net: blending L1 &amp; L2</> }} next={{ href: "/learn/regularized-regression/standardize-first", label: <>Next up · Standardize first →</> }} />
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np
from sklearn.linear_model import ElasticNet
from sklearn.model_selection import cross_val_score

best = None
for alpha in [0.1, 0.5, 0.7, 0.9, 0.95, 1.0]:        # the L1/L2 mix
    for lam in np.logspace(-3, 1, 30):               # overall strength
        score = cross_val_score(ElasticNet(alpha=lam, l1_ratio=alpha),
                                X, y, cv=5,
                                scoring="neg_mean_squared_error").mean()
        if best is None or score > best[0]:
            best = (score, alpha, lam)
print("best (l1_ratio, λ):", best[1], best[2])`;

const codeLib = `import numpy as np
from sklearn.linear_model import ElasticNetCV

# ElasticNetCV sweeps the λ path for each l1_ratio with warm starts — efficient
model = ElasticNetCV(
    l1_ratio=[0.1, 0.5, 0.7, 0.9, 0.95, 1.0],   # α grid
    alphas=np.logspace(-3, 1, 50),               # λ grid
    cv=5, random_state=0,
).fit(X, y)
print("chosen l1_ratio:", model.l1_ratio_, " λ:", model.alpha_)`;


const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };


