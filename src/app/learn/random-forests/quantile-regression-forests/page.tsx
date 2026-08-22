import Link from "next/link";
import { QuantileForestLab } from "@/components/labs/QuantileForestLab";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LabFrame } from "@/components/LabFrame";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "Quantile forests & prediction intervals — Manifold",
  description:
    "A forest leaf holds a whole set of training targets, not just their mean — so a random forest can report the full predictive distribution and give calibrated prediction intervals, wider where the data is genuinely noisier.",
};

const TREES = "var(--c-trees)";

export default function QuantileForestsPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Trees & ensembles", color: TREES }, { label: "Tier 2 · practitioner", color: "var(--c-fundamentals)" }]}
        time="about 7 minutes"
        title={<>Quantile forests &amp; prediction intervals</>}
        intro={<>
          &ldquo;The house is worth $340k&rdquo; is far less useful than &ldquo;$300k–$390k, most likely
          $340k.&rdquo; A quantile regression forest gives you the second kind of answer — a full prediction
          interval — from the exact same trees, by keeping information an ordinary forest throws away.
        </>}
      />

      <div className="lesson">
        <h2>The information a mean discards</h2>
        <p>
          When a regression tree reaches a leaf, that leaf contains a whole set of training targets. An ordinary
          forest collapses each leaf to its <em>mean</em> and averages those means — one number out. But the
          set itself describes the distribution of plausible outcomes for points in that leaf. A{" "}
          <strong>quantile regression forest</strong> (Meinshausen, 2006) keeps the full set: for a query point
          it pools the target values from the leaf each tree routes it to, across all trees, into one big
          empirical distribution — then reads off whatever quantiles you want.
        </p>
        <ul style={ul}>
          <li>The <strong>50th percentile</strong> is a median prediction (robust to skew).</li>
          <li>The <strong>10th and 90th</strong> bracket an <strong>80% prediction interval</strong>.</li>
          <li>The spread between them is the model&rsquo;s <strong>uncertainty at that point</strong> — and,
            crucially, it can vary from point to point.</li>
        </ul>

        <h2>Uncertainty that changes with the input</h2>
        <p>
          That last property is the whole payoff. Real uncertainty isn&rsquo;t uniform — some regions of feature
          space are noisier or sparser than others — and a quantile forest reports it honestly. In the lab, the
          data&rsquo;s noise grows from left to right:
        </p>

        <PredictPrompt
          accent={TREES}
          prompt={<>The data is calm on the left and noisy on the right. What will the prediction interval do across the range?</>}
          options={["Stay a constant width", "Stay tight on the left, flare wider on the right", "Be widest on the left"]}
        />

        <LabFrame
          accent={TREES}
          tryThis={<>Switch between the 50%, 80%, and 90% interval levels, and watch both the band width and the empirical coverage readout.</>}
          insight={<>The band hugs the median where the data is calm and flares out where it&rsquo;s noisy — the forest reports more uncertainty exactly where uncertainty is real. Widen the level (50 → 90%) and coverage rises toward that level: an 80% interval really does contain about 80% of points. This is uncertainty you can act on.</>}
        >
          <QuantileForestLab />
        </LabFrame>

        <h2>In practice</h2>
        <p>
          scikit-learn&rsquo;s <code>RandomForestRegressor</code> doesn&rsquo;t expose true quantiles, but you
          can approximate intervals from the spread of per-tree predictions, or use the dedicated{" "}
          <code>quantile-forest</code> package for the exact leaf-pooling method. On the California housing data,
          an 80% interval built this way covered <strong>≈84%</strong> of held-out points — close to nominal,
          slightly conservative:
        </p>
        <CodeBlock
          fromScratch={`import numpy as np
from sklearn.ensemble import RandomForestRegressor

rf = RandomForestRegressor(n_estimators=300, n_jobs=-1, random_state=0).fit(X_tr, y_tr)

# approximate an 80% interval from the spread of the individual trees
per_tree = np.stack([t.predict(X_te) for t in rf.estimators_], axis=1)
lo, hi = np.percentile(per_tree, [10, 90], axis=1)
coverage = np.mean((y_te >= lo) & (y_te <= hi))
print("80% interval coverage:", round(coverage, 3))   # ~0.84
print("mean interval width:  ", round((hi - lo).mean(), 3))`}
        />

        <Callout color={TREES} title={<>Why this beats a single error bar</>}>
          A linear model hands you one <em>global</em> error bar — the same ±σ everywhere. A quantile forest
          gives a <em>local</em>, asymmetric interval that widens in hard regions and narrows in easy ones,
          straight from the data, with no distributional assumption. When a decision depends on the <em>range</em>{" "}
          of an outcome — inventory buffers, risk limits, &ldquo;could this be above the cap?&rdquo; — that
          local honesty is worth far more than a sharper point estimate.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/random-forests/regression-forests", label: <>← Regression forests</> }}
          next={{ href: "/learn/random-forests/why-averaging-works", label: <>Next up · Why averaging works →</> }}
        />
      </div>
    </article>
  );
}

const ul: React.CSSProperties = { margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
