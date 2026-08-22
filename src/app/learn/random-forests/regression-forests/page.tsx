import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { M } from "@/components/Math";

export const metadata = {
  title: "Regression forests — Manifold",
  description:
    "A forest predicts numbers by averaging the leaf means of many regression trees. On California housing it lifts a single tree's R² from 0.673 to 0.795 — smoother, more accurate — but inherits the tree's inability to extrapolate.",
};

const TREES = "var(--c-trees)";

export default function RegressionForestsPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Trees & ensembles", color: TREES }, { label: "Tier 2 · practitioner", color: "var(--c-fundamentals)" }]}
        time="about 6 minutes"
        title={<>Regression forests</>}
        intro={<>
          Everything about bagging and decorrelation carries over unchanged to numeric targets — you just
          average leaf <em>means</em> instead of voting on classes. The payoff is the same variance reduction,
          and on real data it turns a decent single tree into a strong regressor.
        </>}
      />

      <div className="lesson">
        <h2>Averaging staircases into a smooth curve</h2>
        <p>
          A single <Link href="/learn/decision-trees/regression-trees" style={link}>regression tree</Link>
          predicts a blocky staircase — one flat value per leaf. A regression forest averages the staircases of
          hundreds of decorrelated trees, and because they step at <em>different</em> places, their average is
          far smoother:
        </p>
        <M>{String.raw`\hat{f}_{\text{forest}}(x) = \frac{1}{B}\sum_{b=1}^{B} \hat{f}_b(x), \qquad \hat{f}_b(x) = \text{mean target in tree } b\text{'s leaf for } x`}</M>
        <p style={{ marginTop: 12 }}>
          The smoothing isn&rsquo;t cosmetic — it&rsquo;s the variance dropping. Where one tree&rsquo;s leaf
          boundary lands on noise, another&rsquo;s doesn&rsquo;t, so the average cancels the jitter.
        </p>

        <h2>The lift, on real data</h2>
        <p>
          Recall the <Link href="/learn/decision-trees/case-b-regression" style={link}>regression-tree case</Link>:
          a CV-tuned single tree on California housing reached R² 0.673. Swap it for a 300-tree forest, nothing
          else changed:
        </p>
        <CodeBlock
          fromScratch={`from sklearn.ensemble import RandomForestRegressor

rf = RandomForestRegressor(n_estimators=300, oob_score=True,
                           n_jobs=-1, random_state=0)
rf.fit(X_train, y_train)
print("test R2:", round(rf.score(X_test, y_test), 3))
print("OOB  R2:", round(rf.oob_score_, 3))`}
        />
        <CodeOutput label="output">{`single tuned tree   R2 0.673   RMSE 0.658
random forest 300   R2 0.795   RMSE 0.520   OOB R2 0.807`}</CodeOutput>
        <p>
          R² climbs from <strong>0.673 to 0.795</strong> and RMSE falls from 0.658 to 0.520 — a large, free
          improvement from averaging alone, no new features and no tuning. Notice the <strong>OOB R² (0.807)</strong>{" "}
          sits right beside the test R², the <Link href="/learn/random-forests/out-of-bag-error" style={link}>out-of-bag
          estimate</Link> doing its job on a regression target too.
        </p>

        <Callout color={TREES} title={<>Still no extrapolation</>}>
          One thing averaging <em>cannot</em> fix: a forest still can&rsquo;t predict beyond the training range.
          Every tree&rsquo;s prediction is a leaf mean, so the forest&rsquo;s output is an average of leaf means
          — bounded by the training targets. On this data the forest&rsquo;s predictions top out around 5.0, the
          capped maximum, exactly as a single tree did. If your target trends open-endedly (prices over time,
          extrapolated demand), a forest will flatten at the edge of what it has seen. This is the tree
          family&rsquo;s one inherited blind spot, and the <Link href="/learn/random-forests/limits-of-forests" style={link}>limits
          page</Link> returns to it.
        </Callout>

        <h2>What&rsquo;s different for regression</h2>
        <ul style={ul}>
          <li><strong>Aggregate by mean, not vote</strong> — the only code-level change from the classifier.</li>
          <li><strong>Impurity is variance</strong> (MSE), so splits reduce squared error; nothing else in the
            bagging/decorrelation story changes.</li>
          <li><strong>Default <code>max_features</code> is <M>{String.raw`p/3`}</M></strong> for regression
            (versus <M>{String.raw`\sqrt{p}`}</M> for classification) — regression trees tolerate a bit less
            decorrelation.</li>
          <li><strong>You can extract more than a mean</strong> — because each leaf holds a whole set of
            targets, a forest can report the full predictive <em>distribution</em>, not just its centre. That
            is the <Link href="/learn/random-forests/quantile-regression-forests" style={link}>quantile
            forest</Link>, next.</li>
        </ul>

        <PrevNext
          prev={{ href: "/learn/random-forests/forest-vs-tree-vs-boosting", label: <>← Forest vs tree vs boosting</> }}
          next={{ href: "/learn/random-forests/quantile-regression-forests", label: <>Next up · Quantile forests & prediction intervals →</> }}
        />
      </div>
    </article>
  );
}

const ul: React.CSSProperties = { margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
