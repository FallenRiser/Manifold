import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { PredictPrompt } from "@/components/PredictPrompt";

export const metadata = {
  title: "Preprocessing is modelling — Manifold",
  description:
    "Every transform is an assumption you are adding to the model, whether or not you meant to. A catalogue of what each common preprocessing step actually claims about the world.",
};

const GRAY = "var(--c-metrics)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

const CLAIMS: { step: string; claim: string }[] = [
  { step: "Mean imputation", claim: "the missing values were typical, and their absence carries no information" },
  { step: "Standard scaling", claim: "the column is roughly symmetric, so a mean and an SD summarise it usefully" },
  { step: "Log transform", claim: "the effect on the target is multiplicative, not additive" },
  { step: "One-hot encoding", claim: "the categories have no ordering and no shared structure" },
  { step: "Ordinal encoding", claim: "the categories are ordered, and equally spaced" },
  { step: "Target encoding", claim: "the category's historical mean outcome transfers to new rows" },
  { step: "Binning a continuous variable", claim: "the relationship is a step function, and these are the steps" },
  { step: "Clipping at the 99th percentile", claim: "values beyond here are errors, or their magnitude does not matter" },
  { step: "Dropping correlated features", claim: "you care about prediction, not about which of the pair does the work" },
  { step: "PCA before fitting", claim: "the directions of highest variance are the directions that matter for y" },
];

export default function PreprocessingIsModellingPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Preparing features", color: GRAY }, { label: "Tier 2 · practitioner", color: GRAY }]}
        time="about 7 minutes"
        title={<>Preprocessing is modelling</>}
        intro={<>Preprocessing gets filed under plumbing — the tedious part before the interesting part. Every one
          of those steps is a claim about how the world works, and the model inherits all of them without ever
          being able to question one.</>}
      />

      <div className="lesson">
        <h2>The reframe</h2>
        <p>
          A model is usually described as <em>shape plus loss plus optimiser</em>. That is incomplete. What
          actually gets deployed is <strong>transform, then shape, then loss</strong> — and the transform is not
          a neutral preparation step. It decides what information reaches the model at all.
        </p>
        <p>
          When you bin age into decades, no model downstream can ever distinguish 30 from 39. That is not a
          limitation of the algorithm; it is a decision you made, and it is now unfalsifiable from inside the
          model. The same is true of every entry below.
        </p>

        <h2>What each step actually claims</h2>
        <div style={{ display: "grid", gap: 7, margin: "1.3rem 0" }}>
          {CLAIMS.map((c) => (
            <div key={c.step} style={{ display: "flex", gap: 12, alignItems: "baseline", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 13px" }}>
              <span className="font-display" style={{ fontSize: 12.5, fontWeight: 500, color: GRAY, flexShrink: 0, width: 148 }}>{c.step}</span>
              <span style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>claims {c.claim}</span>
            </div>
          ))}
        </div>

        <Callout color={GRAY} title={<>The one that surprises people</>}>
          <strong>PCA before fitting</strong> assumes the high-variance directions are the useful ones — and
          nothing guarantees that. The signal you need can sit in a low-variance direction and be discarded by a
          step that never looked at <em>y</em> at all. It is a perfectly good technique with a real assumption
          attached, and the assumption is testable: compare against the un-reduced model. The{" "}
          <Link href="/learn/pca" style={link}>PCA track</Link> takes this seriously rather than treating
          dimensionality reduction as free.
        </Callout>

        <PredictPrompt
          accent={GRAY}
          prompt={<>You bin a continuous <code>age</code> feature into five-year buckets before fitting a gradient-boosted tree. What have you most likely done to performance?</>}
          options={[
            "Improved it — binning reduces noise and prevents overfitting",
            "Left it roughly unchanged — trees split on thresholds anyway",
            "Hurt it — you removed the model's ability to find its own thresholds",
          ]}
        />

        <p>
          The third, usually. A tree already finds its own cut points, and it optimises them against the target;
          your bins were chosen against nothing. Pre-binning replaces a data-driven decision with an arbitrary
          one and permanently caps the resolution available. Binning earns its place when it encodes real domain
          structure — legal age thresholds, tax bands, clinical cut-offs — where the step function is a fact about
          the world rather than a convenience.
        </p>

        <h2>Which model you plan to use changes the answers</h2>
        <p>
          Preprocessing decisions are not model-independent, and treating them as a fixed recipe is how people end
          up doing unnecessary work that also costs accuracy.
        </p>
        <ul>
          <li><strong>Scaling</strong> is essential for anything distance- or penalty-based — k-NN, SVMs, k-means,
            PCA, ridge and lasso — and irrelevant to trees, which use only order.</li>
          <li><strong>One-hot encoding</strong> is necessary for linear models and actively harmful to trees at
            high cardinality, where it fragments the feature into hundreds of nearly-empty columns that no split
            can use well.</li>
          <li><strong>Monotone transforms</strong> like log change linear models substantially and change trees
            not at all — a tree&rsquo;s splits are invariant to any order-preserving transform of a feature.</li>
          <li><strong>Missing values</strong> must be imputed for most linear models and are handled natively,
            often better, by modern boosting libraries.</li>
        </ul>
        <p>
          A useful consequence: if you intend to ship a gradient-boosted model, a large fraction of the standard
          preprocessing pipeline is doing nothing except adding surface area for bugs.
        </p>

        <h2>The discipline</h2>
        <p>
          For every transform in your pipeline, be able to say in one sentence what it assumes and why you believe
          it. If you cannot, the step is there because it was in a tutorial — and it is either harmless, in which
          case delete it, or it is quietly restricting your model, in which case delete it faster.
        </p>
        <p>
          And where you are unsure, the pipeline from{" "}
          <Link href="/learn/data-workflow/pipelines-and-the-fold" style={link}>the previous page</Link> makes the
          uncertainty testable: the choice between a log and no log, or between one-hot and target encoding, is a
          hyperparameter that cross-validation can settle. Preprocessing being a modelling decision means it can
          be selected like one.
        </p>

        <PrevNext
          prev={{ href: "/learn/data-workflow/pipelines-and-the-fold", label: <>← Pipelines &amp; the fold</> }}
          next={{ href: "/learn/data-workflow/encoding-categoricals", label: <>Next up · Encoding categoricals →</> }}
        />
      </div>
    </article>
  );
}
