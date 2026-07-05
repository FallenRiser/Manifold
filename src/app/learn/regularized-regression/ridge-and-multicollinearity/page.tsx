import { M } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { MulticollinearityRidgeLab } from "@/components/labs/MulticollinearityRidgeLab";
import { REGRESSION_SETUP } from "@/lib/runtimeSetup";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Ridge & multicollinearity — Manifold",
  description:
    "Multicollinearity makes OLS coefficients explode into huge, unstable, canceling values. Ridge is the classic cure — it tames the variance and shares weight sensibly across correlated features.",
};

export default function MulticollinearityPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }]}
        time="about 6 minutes"
        title={<>Ridge & multicollinearity</>}
        intro={<>
          Ridge was invented for exactly this problem. When features are highly correlated, ordinary least
        squares falls apart — and the <M>{String.raw`+\lambda I`}</M> on the diagonal is the fix that gave the
        method its name.
        </>}
      />

      <div className="lesson">
        <h2>What multicollinearity does to OLS</h2>
        <p>
          When two or more features are strongly correlated, the data can&rsquo;t tell their effects apart. The
          model can add a huge positive coefficient to one and a huge negative coefficient to the other and
          get almost the same predictions — so OLS has no reason to prefer sensible values. The result:
        </p>
        <ul style={ul}>
          <li><strong>Enormous coefficients</strong> with opposite signs that nearly cancel.</li>
          <li><strong>Wild instability</strong> — a tiny change in the data flips the coefficients dramatically (high variance).</li>
          <li><strong>Uninterpretable weights</strong> — the signs and sizes stop reflecting any real relationship.</li>
        </ul>
        <p>
          Algebraically, correlated features make <M>{String.raw`X^\top X`}</M> nearly singular, so inverting it
          amplifies noise enormously. In the extreme of perfect correlation it&rsquo;s singular and OLS has no
          unique solution at all.
        </p>

        <h2>How ridge fixes it</h2>
        <p>
          Adding <M>{String.raw`\lambda I`}</M> to <M>{String.raw`X^\top X`}</M> lifts those near-zero eigenvalues
          away from zero, making the matrix well-conditioned and always invertible. Practically, ridge:
        </p>
        <ul style={ul}>
          <li><strong>Caps the coefficients</strong> — the penalty forbids the giant canceling values OLS reaches for.</li>
          <li><strong>Shares the weight.</strong> Among correlated features, ridge distributes the coefficient roughly <em>evenly</em> rather than dumping it all on one. Two identical features each get half the weight.</li>
          <li><strong>Slashes variance.</strong> The fit becomes stable and reproducible across samples.</li>
        </ul>

        <MulticollinearityRidgeLab />

        <Callout color="var(--c-regression)" title={<>Ridge vs Lasso on correlated features</>}>
          This is the cleanest place to feel the difference. Faced with a group of correlated features,
            <strong> ridge keeps them all and splits the weight</strong>; <strong>Lasso tends to pick one
            arbitrarily and zero the rest</strong>. If the correlated features are genuinely a group you want
            to keep together (e.g. related genes), ridge — or elastic-net — is the right tool, and Lasso&rsquo;s
            arbitrary choice is a liability. That tension is exactly what elastic-net was designed to resolve.
        </Callout>

        <h2>The connection to VIF</h2>
        <p>
          If you read the linear-regression track, multicollinearity is what the <strong>Variance Inflation
          Factor</strong> measures. Ridge can be seen as directly counteracting that inflation: by biasing the
          estimates a little, it deflates the variance that collinearity pumped up. The same diagnostic that
          flags the problem points you toward ridge as the remedy.
        </p>

        <h2>See OLS blow up, then ridge rescue it</h2>
        <CodeBlock setup={REGRESSION_SETUP} fromScratch={codeScratch} withLibrary={codeLib} />

        <PrevNext prev={{ href: "/learn/regularized-regression/shrinkage-effect-and-paths", label: <>← The shrinkage effect &amp; coefficient paths</> }} next={{ href: "/learn/regularized-regression/choosing-lambda", label: <>Next up · Choosing λ →</> }} />
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np

rng = np.random.default_rng(0)
x1 = rng.normal(size=200)
x2 = x1 + rng.normal(scale=0.01, size=200)     # almost identical to x1
X = np.c_[x1, x2]
y = 3 * x1 + rng.normal(scale=0.1, size=200)

beta_ols = np.linalg.lstsq(X, y, rcond=None)[0]
print("OLS  :", beta_ols)        # huge, opposite-sign, unstable

p = X.shape[1]
beta_ridge = np.linalg.solve(X.T @ X + 1.0 * np.eye(p), X.T @ y)
print("Ridge:", beta_ridge)      # ~[1.5, 1.5] — weight split sensibly`;

const codeLib = `from sklearn.linear_model import LinearRegression, Ridge

print("OLS  :", LinearRegression().fit(X, y).coef_)   # exploded
print("Ridge:", Ridge(alpha=1.0).fit(X, y).coef_)     # tamed, shared`;


const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };


