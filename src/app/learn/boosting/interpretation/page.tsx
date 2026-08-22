import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Interpreting a boosted model — Manifold",
  description:
    "A gradient-boosted model is a sum of hundreds of trees — accurate but opaque. Four tools open it up: gain and permutation importance for ranking features, partial dependence for shapes, and SHAP for exact per-prediction attributions. Plus monotonic constraints to bake in domain knowledge.",
};

const TREES = "var(--c-trees)";

export default function InterpretationPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Trees & ensembles", color: TREES }, { label: "Tier 2 · practitioner", color: "var(--c-fundamentals)" }]}
        time="about 8 minutes"
        title={<>Interpreting a boosted model</>}
        intro={<>
          Boosting buys accuracy with opacity: no one reads 500 trees. But a boosted model is far from a black box
          — a mature toolkit answers &ldquo;which features matter,&rdquo; &ldquo;in what shape,&rdquo; and
          &ldquo;why <em>this</em> prediction,&rdquo; and gradient-boosted trees are the home turf of the sharpest
          of these tools.
        </>}
      />

      <div className="lesson">
        <h2>1 · Feature importance — which features, overall</h2>
        <p>
          The quickest read is a global ranking, and there are two honest ways to get it — with the same caveats
          as in the <Link href="/learn/random-forests/feature-importance" style={link}>forest track</Link>:
        </p>
        <ul style={ul}>
          <li>
            <strong>Gain importance</strong> sums the loss reduction each feature delivered across all its splits.
            Cheap and built-in, but biased toward high-cardinality features and{" "}
            <Link href="/learn/random-forests/importance-for-correlated-features" style={link}>unreliable when
            features are correlated</Link>.
          </li>
          <li>
            <strong>Permutation importance</strong> shuffles one feature and measures the score drop — model-agnostic
            and truer to real predictive value, but it too under-credits correlated features (a twin covers for
            the shuffled one).
          </li>
        </ul>
        <p>Both give a ranking; neither gives shape or direction. For that, go local.</p>

        <h2>2 · Partial dependence — the shape of an effect</h2>
        <p>
          A <strong>partial dependence plot (PDP)</strong> asks: as one feature sweeps across its range, how does
          the average prediction move, holding everything else at its observed values? It traces the marginal
          effect — is the relationship linear, saturating, U-shaped, threshold-like? For gradient boosting on
          housing, the PDP for median income rises steeply then flattens; for latitude/longitude it exposes the
          geography the trees learned. <strong>ICE plots</strong> (individual conditional expectation) draw one
          line per row instead of the average, revealing interactions the average would hide. The caveat: PDPs
          assume the swept feature is roughly independent of the others, so read them alongside the correlation
          structure.
        </p>

        <h2>3 · SHAP — why <em>this</em> prediction</h2>
        <p>
          The most powerful tool, and the one gradient-boosted trees are famous for. <strong>SHAP</strong> values
          borrow the Shapley value from cooperative game theory to answer: for a single prediction, how much did
          each feature contribute, relative to the average prediction? They are the unique attribution that is{" "}
          <em>fair</em> in a precise sense — contributions sum exactly to the prediction, and features are credited
          consistently.
        </p>
        <Callout color={TREES} title={<>Why SHAP + trees is a special match</>}>
          Exact Shapley values are exponentially expensive in general — but <strong>TreeSHAP</strong> computes
          them for tree ensembles in polynomial time by exploiting the tree structure. That is why SHAP exploded
          in tabular ML exactly alongside XGBoost/LightGBM: on any other model SHAP is an approximation, but on a
          boosted forest it is <em>exact and fast</em>. You already have an interactive SHAP explorer in the{" "}
          <Link href="/learn/california-housing-capstone" style={link}>housing capstone</Link> — the same tool
          applies directly to any booster here.
        </Callout>
        <p>
          SHAP subsumes the earlier tools: average the magnitude of a feature&rsquo;s SHAP values across the
          dataset and you get a <em>better</em> global importance (correlation-aware, no cardinality bias); plot a
          feature&rsquo;s SHAP values against its value and you get a <em>better</em> partial-dependence curve, one
          dot per row. When you can afford it, SHAP is the single interpretation tool to reach for.
        </p>

        <h2>4 · Monotonic constraints — interpretability you enforce</h2>
        <p>
          Sometimes you don&rsquo;t want to <em>discover</em> a relationship — you want to <strong>guarantee</strong>{" "}
          one. Every major booster lets you declare that a feature&rsquo;s effect must be monotonic: &ldquo;risk
          may only <em>increase</em> with debt,&rdquo; &ldquo;price may only <em>rise</em> with square footage.&rdquo;
          The library then forbids any split that would violate the direction. This trades a hair of training fit
          for a model whose behaviour is partly certified — invaluable for credit, pricing, and any regulated
          setting where a counterintuitive wiggle is unacceptable. It is the rare knob that buys{" "}
          <em>trust</em> rather than accuracy.
        </p>

        <p>
          Together these turn &ldquo;an inscrutable pile of trees&rdquo; into a model you can rank, plot, explain
          per-row, and constrain. Accuracy and accountability are not, for gradient boosting, a trade-off — which
          is a large part of why it dominates in exactly the high-stakes tabular domains that most demand both.
        </p>

        <PrevNext
          prev={{ href: "/learn/boosting/bias-variance", label: <>← Bias, variance &amp; why it isn&rsquo;t bagging</> }}
          next={{ href: "/learn/boosting/case-a-tabular", label: <>Next up · Case: boosting beats the forest →</> }}
        />
      </div>
    </article>
  );
}

const ul: React.CSSProperties = { margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.85 };
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
