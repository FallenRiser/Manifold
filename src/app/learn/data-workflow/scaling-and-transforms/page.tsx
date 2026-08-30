import Link from "next/link";
import { M } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { LabFrame } from "@/components/LabFrame";
import { FeatureScalingLab } from "@/components/labs/FeatureScalingLab";

export const metadata = {
  title: "Scaling & transforms — Manifold",
  description:
    "Which models need scaling and which are indifferent, why the choice of scaler is a decision about outliers, and when a log transform is a modelling statement rather than a cosmetic fix.",
};

const GRAY = "var(--c-metrics)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

const NEEDS: { model: string; needs: string; why: string }[] = [
  { model: "k-NN, k-means, SVM (RBF)", needs: "Essential", why: "they compute distances, and an unscaled column with a bigger range dominates every distance" },
  { model: "Ridge, lasso, elastic net", needs: "Essential", why: "the penalty is applied to raw coefficient size, so it punishes small-scaled features far harder" },
  { model: "PCA", needs: "Essential", why: "it maximises variance, and variance is measured in whatever units you happened to use" },
  { model: "Neural networks", needs: "Essential", why: "gradients on wildly different scales make the loss surface a ravine, and optimisation crawls" },
  { model: "Plain OLS", needs: "Not needed", why: "coefficients simply absorb the scale — though conditioning improves and interpretation gets easier" },
  { model: "Trees, forests, boosting", needs: "Not needed", why: "splits use only the order of values, which no monotone rescaling changes" },
  { model: "Naive Bayes (Gaussian)", needs: "Not needed", why: "each feature gets its own fitted mean and variance already" },
];

const SCALERS: { name: string; formula: string; when: string }[] = [
  { name: "StandardScaler", formula: String.raw`(x - \mu) / \sigma`, when: "the default. Roughly symmetric columns without severe outliers" },
  { name: "RobustScaler", formula: String.raw`(x - \mathrm{med}) / \mathrm{IQR}`, when: "when outliers are present and real — the median and IQR barely move" },
  { name: "MinMaxScaler", formula: String.raw`(x - x_{\min}) / (x_{\max} - x_{\min})`, when: "when you need a bounded range. Extremely sensitive to a single extreme value" },
  { name: "QuantileTransformer", formula: String.raw`F^{-1}(\mathrm{rank}(x)/n)`, when: "when the shape is hopeless and you only want the ordering preserved" },
];

export default function ScalingPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Preparing features", color: GRAY }, { label: "Tier 2 · practitioner", color: GRAY }]}
        time="about 8 minutes"
        title={<>Scaling &amp; transforms</>}
        intro={<>Scaling is taught as hygiene — something you do to every dataset before doing anything else. It
          is nothing of the kind. It is essential for one group of models, irrelevant to another, and the choice
          of <em>which</em> scaler is a statement about how you want outliers treated.</>}
      />

      <div className="lesson">
        <h2>The problem, in one sentence</h2>
        <p>
          A model that measures distance has no idea that square metres and number of bedrooms are different
          kinds of thing. It only sees that one column moves in the thousands and the other in single digits, so
          the first one accounts for essentially all of every distance it computes.
        </p>

        <LabFrame
          accent={GRAY}
          tryThis={<>Look at the unscaled distances first and work out which column is producing them. Then scale, and see which neighbours change.</>}
          insight={<>Unscaled, the distances are almost entirely determined by the column with the widest range — the other two features contribute rounding error. After scaling, every feature gets a comparable say and the nearest neighbours change completely. Note what did <em>not</em> happen: no information was added. The features were always there; scaling only stopped one of them from drowning the rest.</>}
        >
          <FeatureScalingLab />
        </LabFrame>

        <h2>Who needs it</h2>
        <div style={{ display: "grid", gap: 7, margin: "1.3rem 0" }}>
          {NEEDS.map((n) => (
            <div key={n.model} style={{ display: "flex", gap: 12, alignItems: "baseline", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 13px" }}>
              <span style={{ fontSize: 12.5, color: "var(--ink)", flexShrink: 0, width: 168 }}>{n.model}</span>
              <span style={{ fontSize: 11.5, color: n.needs === "Essential" ? "var(--bad)" : "var(--good)", flexShrink: 0, width: 68 }}>{n.needs}</span>
              <span style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.5 }}>{n.why}</span>
            </div>
          ))}
        </div>

        <Callout color={GRAY} title={<>The regularisation case is the one people forget</>}>
          Ridge and lasso penalise <M>{String.raw`\sum \beta_j^2`}</M> or{" "}
          <M>{String.raw`\sum |\beta_j|`}</M>. If a feature is measured in thousands, its coefficient is
          correspondingly tiny, and the penalty barely touches it; a feature measured in units gets a large
          coefficient and absorbs almost all the penalty. <strong>Unscaled regularisation regularises your units,
          not your model.</strong> The{" "}
          <Link href="/learn/regularized-regression" style={link}>regularized regression track</Link> makes this
          concrete on real coefficient paths.
        </Callout>

        <h2>Choosing a scaler is choosing an outlier policy</h2>
        <div style={{ display: "grid", gap: 7, margin: "1.3rem 0" }}>
          {SCALERS.map((s) => (
            <div key={s.name} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 13px" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "baseline", flexWrap: "wrap" }}>
                <span className="font-display" style={{ fontSize: 13, fontWeight: 500, color: GRAY }}>{s.name}</span>
                <span style={{ fontSize: 12 }}><M>{s.formula}</M></span>
              </div>
              <div style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.5, marginTop: 3 }}>{s.when}.</div>
            </div>
          ))}
        </div>
        <p>
          The failure worth naming: <code>MinMaxScaler</code> on a column with one enormous value squeezes every
          real observation into a sliver near zero, because the denominator is set by that single point. It looks
          like it worked — everything is in [0, 1] — and the feature has been destroyed.
        </p>

        <h2>Transforms change the model; scaling does not</h2>
        <p>
          Worth separating clearly, because both live in the same pipeline step. <strong>Scaling is linear</strong>{" "}
          — it changes the units and leaves the relationship&rsquo;s shape alone.{" "}
          <strong>A transform is non-linear</strong> and changes what relationship the model can express.
        </p>
        <p>
          Fitting <M>y</M> against <M>{String.raw`\log x`}</M> in a linear model says that a{" "}
          <em>proportional</em> change in <M>x</M> produces a constant change in <M>y</M>: doubling income moves
          the outcome by a fixed amount whether you go from £20k to £40k or £200k to £400k. That is a substantive
          claim, it is often the right one for money, populations, durations and counts, and it belongs in the
          same category as choosing a model family — not in the same category as rescaling.
        </p>
        <ul>
          <li><strong>Log</strong> — for positive, right-skewed, multiplicative quantities. Use{" "}
            <M>{String.raw`\log(1+x)`}</M> when zeros are present, and note that this quietly changes the
            interpretation near zero.</li>
          <li><strong>Square root</strong> — gentler than log; the classic choice for counts, where it also
            stabilises Poisson-like variance.</li>
          <li><strong>Box–Cox / Yeo–Johnson</strong> — fit the exponent from the data instead of guessing. A
            fitted step, so it belongs in the pipeline.</li>
          <li><strong>Transforming <M>y</M></strong> — legitimate and it changes what you are optimising. Fitting
            on <M>{String.raw`\log y`}</M> minimises error in log space, which means proportional error; when you
            exponentiate back, you get the median rather than the mean. If the metric you will be judged on is
            RMSE in the original units, that mismatch is real and needs to be either corrected or accepted
            deliberately.</li>
        </ul>

        <Callout color={GRAY} title={<>If you are shipping a tree-based model</>}>
          Skip most of this. Trees split on order, so any monotone transform — log, square root, rank — produces
          an <em>identical</em> model. Scaling gains you nothing at all. Time spent tuning a scaler for a
          gradient-boosted model is time spent producing no change, and the fact that it is so widely done anyway
          is a good illustration of preprocessing being treated as ritual rather than as modelling.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/data-workflow/encoding-categoricals", label: <>← Encoding categoricals</> }}
          next={{ href: "/learn/data-workflow/feature-engineering", label: <>Next up · Feature engineering →</> }}
        />
      </div>
    </article>
  );
}
