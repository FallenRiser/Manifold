import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { LabFrame } from "@/components/LabFrame";
import { GradientBoostingLab } from "@/components/labs/GradientBoostingLab";

export const metadata = {
  title: "Gradient boosting for regression — Manifold",
  description:
    "The squared-error case worked end to end: start from the mean, fit a tree to the residuals, shrink and add, repeat. On California housing it lifts a single tree's R² from 0.673 and a random forest's 0.795 to 0.815 — the ensemble that keeps correcting itself.",
};

const TREES = "var(--c-trees)";

const CODE = `from sklearn.datasets import fetch_california_housing
from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import r2_score, mean_squared_error

X, y = fetch_california_housing(return_X_y=True)
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.25, random_state=0)

gbr = GradientBoostingRegressor(
    n_estimators=300, learning_rate=0.1, max_depth=3, random_state=0
).fit(Xtr, ytr)

p = gbr.predict(Xte)
print("R2:  ", round(r2_score(yte, p), 3))
print("RMSE:", round(mean_squared_error(yte, p) ** 0.5, 3))

# accuracy as trees are added
for n, pred in enumerate(gbr.staged_predict(Xte), 1):
    if n in (1, 10, 50, 100, 300):
        print(f"{n:3d} trees  R2 {r2_score(yte, pred):.3f}")`;

export default function GbmRegressionPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Trees & ensembles", color: TREES }, { label: "Tier 1 · intuition", color: "var(--c-fundamentals)" }]}
        time="about 8 minutes"
        title={<>Gradient boosting for regression</>}
        intro={<>
          With squared error, the abstract &ldquo;fit the negative gradient&rdquo; becomes something you can do
          on paper: fit the residuals. Let&rsquo;s walk the loop concretely, then run it on the same California
          housing data the tree and forest tracks used — and watch it pull ahead of both.
        </>}
      />

      <div className="lesson">
        <h2>The loop, in plain terms</h2>
        <ol style={ol}>
          <li>
            <strong>Start with the mean.</strong> The best constant predictor under squared error is{" "}
            <M>{String.raw`F_0 = \bar{y}`}</M>. Every example&rsquo;s residual is <M>{String.raw`y_i - \bar{y}`}</M>.
          </li>
          <li>
            <strong>Fit a shallow tree to the residuals.</strong> Not to <M>{String.raw`y`}</M> — to the leftover
            errors. Where the model currently under-predicts, residuals are positive; the tree learns a small
            positive bump there.
          </li>
          <li>
            <strong>Add a shrunk version of it:</strong> <M>{String.raw`F_1 = F_0 + \nu\, h_1`}</M> with, say,{" "}
            <M>{String.raw`\nu = 0.1`}</M>. The model now predicts a little better everywhere.
          </li>
          <li>
            <strong>Recompute residuals and repeat.</strong> Each tree chips away at whatever error remains. After{" "}
            <M>{String.raw`M`}</M> rounds, <M>{String.raw`F_M = \bar{y} + \nu\sum_{m} h_m`}</M>.
          </li>
        </ol>
        <p>
          Each tree is deliberately weak — depth 3 captures interactions among a few features and no more. Alone
          it explains almost nothing. Their <em>sum</em>, each term aimed at the previous one&rsquo;s mistakes,
          becomes a precise regressor.
        </p>

        <LabFrame
          accent={TREES}
          tryThis={<>Start at <strong>0 trees</strong> — the fit is the flat mean and the residual bars are long.
            Drag trees up and watch the staircase close on the dashed true signal as the bars shrink. Then push the
            learning rate to 1.0: it converges in a few trees but starts chasing individual noisy points past the
            signal.</>}
          insight={<>Each tree only ever fits the <em>leftover residuals</em>, so the ensemble improves monotonically
            on the training set — RMSE falls and R² climbs with every tree. A small learning rate needs many trees
            to get there but tracks the true signal more faithfully; a large rate is fast but overshoots into the
            noise. That is the shrinkage trade-off you&rsquo;ll formalise two pages on.</>}
        >
          <GradientBoostingLab />
        </LabFrame>

        <h2>Run it on California housing</h2>
        <CodeBlock fromScratch={CODE} />
        <CodeOutput label="output">{`R2:   0.815
RMSE: 0.494
  1 trees  R2 0.100
 10 trees  R2 0.507
 50 trees  R2 0.742
100 trees  R2 0.781
300 trees  R2 0.815`}</CodeOutput>

        <Callout color={TREES} title={<>Three models, one dataset</>}>
          <table style={tbl}>
            <thead><tr><th style={th}>Model</th><th style={thr}>test R²</th></tr></thead>
            <tbody>
              <tr><td style={td}>Single tuned decision tree</td><td style={tdr}>0.673</td></tr>
              <tr><td style={td}>Random forest (300 trees)</td><td style={tdr}>0.795</td></tr>
              <tr><td style={td}><strong>Gradient boosting (300 trees)</strong></td><td style={tdr}><strong>0.815</strong></td></tr>
            </tbody>
          </table>
          Same data, same tree primitive. The forest beat the single tree by <em>averaging away variance</em>;
          boosting beats the forest by <em>driving down bias</em>, one correction at a time. And it did so with
          the same 300 trees — but shallow ones, working in sequence rather than in parallel.
        </Callout>

        <h2>Read the learning curve</h2>
        <p>
          The staged R² tells the story of a model being <em>built up</em>, not trained all at once. One tree
          (R² 0.10) is barely above the mean. By 10 trees the model already explains half the variance; by 50,
          three-quarters. The curve then bends toward a plateau — later trees find smaller and smaller residuals
          to correct. This monotone climb is characteristic of boosting and it is what makes{" "}
          <Link href="/learn/boosting/early-stopping" style={link}>early stopping</Link> so natural: you can
          simply watch a validation score and halt where it flattens.
        </p>
        <p>
          Contrast this with a forest&rsquo;s learning curve, which rises and then sits on a flat shelf that never
          declines — a forest cannot overfit by adding trees. Boosting&rsquo;s curve <em>can</em> eventually turn
          back up (in error) if you keep going, because every tree is aimed at the training loss. That danger,
          and the knobs that manage it, is what the next chapter is about.
        </p>

        <h2>Leaf values do a mini line search</h2>
        <p>
          One subtlety worth naming. The tree structure is chosen by fitting the residuals with squared error,
          but each leaf&rsquo;s output value is then set to the constant that best reduces the{" "}
          <em>actual</em> loss for the points in that leaf. For squared error these coincide (both give the mean
          residual), so it&rsquo;s invisible here — but for the robust and classification losses on the next
          pages, the leaf line-search is what keeps gradient boosting optimal rather than approximate.
        </p>

        <PrevNext
          prev={{ href: "/learn/boosting/gradient-boosting", label: <>← Boosting as gradient descent</> }}
          next={{ href: "/learn/boosting/loss-functions", label: <>Next up · Loss functions &amp; robustness →</> }}
        />
      </div>
    </article>
  );
}

const ol: React.CSSProperties = { margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.9 };
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
const tbl: React.CSSProperties = { width: "100%", borderCollapse: "collapse", fontSize: 14, margin: "4px 0 2px" };
const th: React.CSSProperties = { textAlign: "left", padding: "6px 8px", borderBottom: "1px solid var(--border-strong)", color: "var(--ink)", fontWeight: 600 };
const thr: React.CSSProperties = { ...th, textAlign: "right" };
const td: React.CSSProperties = { padding: "6px 8px", borderBottom: "1px solid var(--border)", color: "var(--muted)" };
const tdr: React.CSSProperties = { ...td, textAlign: "right", fontVariantNumeric: "tabular-nums" };
