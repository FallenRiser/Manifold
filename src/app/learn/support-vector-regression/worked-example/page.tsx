import Link from "next/link";
import { M } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "A worked example — Manifold",
  description:
    "SVR end to end on real nonlinear data: scale, grid-search C, ε and γ, and read the result. It matches kernel ridge's accuracy from a model built on just 55% of the points — the sparsity payoff, measured.",
};

export default function SVRWorkedExamplePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }, { label: "Tier 2 · in practice", color: "var(--c-regression)" }]}
        time="about 7 minutes"
        title={<>A worked example</>}
        intro={<>
          The full SVR pipeline on the same nonlinear benchmark we used for kernel ridge — so we can read the
        sparsity trade-off directly off the numbers. Every value comes from a reproducible script.
        </>}
      />

      <div className="lesson">
        <h2>The setup</h2>
        <p>
          Same data as the kernel ridge worked example: <code>make_friedman1</code> (a sine interaction plus a
          quadratic term, 10 features, 300 train / 100 test), standardised. We grid-search all three SVR knobs —
          <M>{String.raw`C`}</M>, <M>{String.raw`\varepsilon`}</M>, and <M>{String.raw`\gamma`}</M> — by
          cross-validation, then score once on the test set (reproducible in <code>scripts/kernel_cases.py</code>):
        </p>
        <CodeBlock fromScratch={code} />
        <CodeOutput label="output · scripts/kernel_cases.py">{output}</CodeOutput>

        <h2>Reading the result</h2>
        <ul style={ul}>
          <li>
            <strong>Test <M>{String.raw`R^2 = 0.838`}</M></strong> — a big jump over the linear baseline&rsquo;s 0.667,
            and within a whisker of kernel ridge&rsquo;s 0.860. The RBF kernel captured the nonlinearity; the
            ε-insensitive loss barely cost any accuracy on this clean data.
          </li>
          <li>
            <strong>166 support vectors of 300 (55%).</strong> The model discards 45% of the training set entirely
            — those points fell inside the tube and had no influence. Kernel ridge, by contrast, keeps all 300.
            That&rsquo;s the sparsity you paid two points of R² for.
          </li>
          <li>
            <strong>The tuned knobs read sensibly:</strong> a large <M>{String.raw`C = 100`}</M> (fit fairly hard,
            the data isn&rsquo;t very noisy), <M>{String.raw`\gamma = 0.03`}</M> (a moderately wide kernel, matching a
            smooth target), and <M>{String.raw`\varepsilon = 1.0`}</M> (a tube scaled to the target&rsquo;s spread).
          </li>
        </ul>

        <Callout color="var(--c-regression)" title={<>The trade-off, measured</>}>
          On this benchmark SVR and kernel ridge are statistically neck-and-neck (0.838 vs 0.860), but SVR gets
            there with a model built on <strong>55% of the points</strong>. When memory, prediction speed, or
            robustness to outliers matters, that sparsity is the whole point. When they don&rsquo;t, kernel ridge&rsquo;s
            closed-form simplicity is the easier call. Now you can make that choice deliberately.
        </Callout>

        <h2>The Regression family, complete</h2>
        <p>
          This closes the Regression family. You&rsquo;ve gone from a straight line to a curved,
          infinite-dimensional, sparse, robust regressor — each step adding one idea:
        </p>
        <ul style={ul}>
          <li><Link href="/learn/linear-regression" style={inlineLink}>Linear regression</Link> — fit a plane.</li>
          <li><Link href="/learn/regularized-regression" style={inlineLink}>Ridge, Lasso &amp; Elastic-net</Link> — shrink the weights to generalise.</li>
          <li><Link href="/learn/polynomial-regression" style={inlineLink}>Polynomial &amp; basis functions</Link> — bend the line with explicit features.</li>
          <li><Link href="/learn/kernel-ridge-regression" style={inlineLink}>Kernel ridge</Link> — bend it with implicit, infinite features via the kernel trick.</li>
          <li><strong>Support vector regression</strong> — keep only the points that matter, and forgive small errors.</li>
        </ul>

        <Callout color="var(--c-regression)" title={<>Where to go next</>}>
          With regression complete, the natural next families are <strong>classification</strong> (the support
            vector machine is SVR&rsquo;s sibling — same margin idea, discrete labels) and <strong>trees &amp;
            ensembles</strong> (the usual winner on messy tabular data). Explore the whole curriculum on the{" "}
            <Link href="/map" style={{ color: "var(--brand)", textDecoration: "none" }}>map</Link>.
        </Callout>

        <Quiz
          accent="var(--c-regression)"
          questions={[
            {
              q: "On make_friedman1, how did SVR compare to kernel ridge?",
              options: ["Nearly matched it (R² 0.838 vs 0.860) using only 55% of the points", "Far more accurate", "Much worse"],
              answer: 0,
              explain: "SVR traded ~2 points of R² for a model built on 166 of 300 points — the sparsity payoff, measured on real data.",
            },
            {
              q: "That 166-of-300 support-vector count means…",
              options: ["45% of training points fell inside the tube and were discarded", "The model overfit", "The kernel failed"],
              answer: 0,
              explain: "Points inside the ε-tube have zero coefficient and are dropped, giving a compact model — unlike kernel ridge, which keeps all 300.",
            },
            {
              q: "When is SVR's sparsity worth the small accuracy cost versus kernel ridge?",
              options: ["When memory, prediction speed, or outlier robustness matter", "Never", "Only on linear data"],
              answer: 0,
              explain: "A smaller, robust model pays off in deployment. On clean data where none of that matters, kernel ridge's closed-form simplicity is the easier choice.",
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/support-vector-regression/when-to-use-svr", label: <>← When to use SVR</> }} next={{ href: "/map", label: <>Explore the curriculum map →</> }} />
      </div>
    </article>
  );
}

const code = `from sklearn.datasets import make_friedman1
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVR
from sklearn.metrics import r2_score

X, y = make_friedman1(n_samples=400, noise=1.0, random_state=0)
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.25, random_state=0)
sc = StandardScaler().fit(Xtr); Xtr, Xte = sc.transform(Xtr), sc.transform(Xte)

svr = GridSearchCV(SVR(kernel="rbf"), {
    "C": [1, 10, 100], "epsilon": [0.1, 0.5, 1.0],
    "gamma": [0.01, 0.03, 0.1, 0.3],
}, cv=5).fit(Xtr, ytr)

n_sv = svr.best_estimator_.support_.shape[0]
print("test R^2:", round(r2_score(yte, svr.predict(Xte)), 4))
print("support vectors:", n_sv, "of", len(ytr))`;

const output = `Support vector regression (RBF):
  best C=100  epsilon=1.0  gamma=0.03
  test R^2=0.8381  RMSE=1.8994
  support vectors: 166 of 300 (55% of training points)`;

const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const inlineLink: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
