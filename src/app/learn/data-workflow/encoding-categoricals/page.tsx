import Link from "next/link";
import { M } from "@/components/Math";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { LabFrame } from "@/components/LabFrame";
import { CodeBlock } from "@/components/CodeBlock";
import { CategoricalFeaturesLab } from "@/components/labs/CategoricalFeaturesLab";

export const metadata = {
  title: "Encoding categoricals — Manifold",
  description:
    "One-hot, ordinal, target and hashing encodings — what each one assumes, when high cardinality breaks them, and why target encoding is the most dangerous transform in common use.",
};

const GRAY = "var(--c-metrics)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

const CODE = `# Target encoding done the only safe way: the encoding for each row is
# computed WITHOUT that row's own label. Cross-fitting is the standard
# construction -- inside each inner fold, encode from the other folds.
#
# The smoothing term pulls small categories toward the global mean, which
# is what stops a category seen twice from getting a confident encoding.

def target_encode(train_cat, train_y, apply_cat, m=20.0):
    prior = train_y.mean()
    stats = train_y.groupby(train_cat).agg(["sum", "count"])
    smoothed = (stats["sum"] + m * prior) / (stats["count"] + m)
    return apply_cat.map(smoothed).fillna(prior)

# In practice: sklearn's TargetEncoder does the cross-fitting for you,
# and -- crucially -- it is an estimator, so it belongs INSIDE the pipeline.
from sklearn.preprocessing import TargetEncoder
enc = TargetEncoder(smooth="auto", cv=5)`;

const METHODS: { name: string; use: string; breaks: string }[] = [
  {
    name: "One-hot",
    use: "low cardinality (under ~15 levels) with a linear model, or any model where you want each level to move freely",
    breaks: "high cardinality — 3,000 postcodes become 3,000 sparse columns that fragment every tree split",
  },
  {
    name: "Ordinal (integer codes)",
    use: "genuinely ordered categories — small/medium/large, or any tree-based model where the codes are just labels",
    breaks: "linear models on unordered categories, where it silently claims 'Germany' is halfway between 'France' and 'India'",
  },
  {
    name: "Target / mean encoding",
    use: "high cardinality where the category's historical outcome really is the signal",
    breaks: "immediately and invisibly, unless cross-fitted and smoothed — see below",
  },
  {
    name: "Frequency / count",
    use: "when how common a category is matters more than which one it is",
    breaks: "when two unrelated categories happen to be equally common and become indistinguishable",
  },
  {
    name: "Hashing",
    use: "very high cardinality with a fixed memory budget, or streaming settings with unbounded new levels",
    breaks: "interpretability, entirely — and collisions merge unrelated categories at random",
  },
  {
    name: "Native categorical support",
    use: "LightGBM, CatBoost, HistGradientBoosting — usually the best answer for tabular data in 2026",
    breaks: "nothing much; it is the default worth trying first if you are shipping a boosted model",
  },
];

export default function EncodingPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Preparing features", color: GRAY }, { label: "Tier 2 · practitioner", color: GRAY }]}
        time="about 9 minutes"
        title={<>Encoding categoricals</>}
        intro={<>A model takes numbers. &ldquo;Berlin&rdquo; is not a number, and every way of turning it into one
          smuggles in a claim about how Berlin relates to Madrid.</>}
      />

      <div className="lesson">
        <h2>The naive encoding, and what it asserts</h2>
        <p>
          Map the categories to 0, 1, 2, 3 and you have handed a linear model a specific and unintended claim:
          that category 2 is twice category 1, that the gap from 0 to 1 equals the gap from 2 to 3, and that they
          sit on a line in whatever order your <code>groupby</code> happened to produce. Alphabetical order is now
          a feature of your model.
        </p>

        <LabFrame
          accent={GRAY}
          tryThis={<>Switch between the encodings and watch what the model is allowed to say about each continent. Try to make the integer encoding fit a group whose true value is out of order.</>}
          insight={<>With integer codes, a linear model gets one slope for all four continents — it can only move them along a single line, in the order you assigned. One-hot gives every continent its own free parameter, so each can sit wherever the data puts it. That is the whole difference: not accuracy in the abstract, but whether the model is <em>permitted</em> to represent what is there.</>}
        >
          <CategoricalFeaturesLab />
        </LabFrame>

        <p>
          For trees, incidentally, the integer encoding is far less harmful: a tree can isolate any single code
          with enough splits, so the ordering costs it depth rather than expressiveness. This is why
          &ldquo;always one-hot&rdquo; is bad advice — it is right for linear models and often actively wrong for
          trees.
        </p>

        <h2>Six encodings and where each one fails</h2>
        <div style={{ display: "grid", gap: 8, margin: "1.3rem 0" }}>
          {METHODS.map((m) => (
            <div key={m.name} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "11px 14px" }}>
              <div className="font-display" style={{ fontSize: 13.5, fontWeight: 500, color: GRAY, marginBottom: 2 }}>{m.name}</div>
              <div style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.55 }}>Use for {m.use}.</div>
              <div style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.55, marginTop: 3 }}>Breaks on {m.breaks}.</div>
            </div>
          ))}
        </div>

        <h2>Target encoding: the most dangerous transform in common use</h2>
        <p>
          Replace each category with the mean of <M>y</M> for that category. It is enormously effective, it
          collapses 3,000 postcodes into one informative column, and done naively it is{" "}
          <strong>leakage by construction</strong> — each row&rsquo;s feature is computed from a set that includes
          that row&rsquo;s own label.
        </p>
        <p>
          The damage is worst exactly where the technique is most tempting. A category appearing once gets encoded
          as that row&rsquo;s own target, so the column becomes a perfect predictor of the training set and pure
          noise everywhere else. The model, reasonably, leans on it hard.
        </p>
        <CodeBlock fromScratch={CODE} />

        <Proof title="why smoothing is not optional, and where m comes from" color={GRAY}>
          <p>
            Write the smoothed encoding for a category with <M>n</M> rows and observed mean{" "}
            <M>{String.raw`\bar y_c`}</M>, against a global mean <M>{String.raw`\mu`}</M>:
          </p>
          <p style={{ textAlign: "center" }}>
            <M>{String.raw`e_c = \frac{n\,\bar y_c + m\,\mu}{n + m} = \frac{n}{n+m}\,\bar y_c + \frac{m}{n+m}\,\mu`}</M>
          </p>
          <p>
            It is a weighted average of the category&rsquo;s own mean and the global mean, with weight{" "}
            <M>{String.raw`n/(n+m)`}</M> on the former. At <M>n = 1</M> and <M>m = 20</M>, the category&rsquo;s
            own evidence gets weight <M>{String.raw`1/21`}</M> — nearly nothing, which is correct, because one
            observation is nearly no evidence.
          </p>
          <p>
            The choice of <M>m</M> has a principled reading. Suppose category means are drawn from a prior with
            variance <M>{String.raw`\tau^2`}</M> and each observation has noise variance{" "}
            <M>{String.raw`\sigma^2`}</M>. The posterior mean for a category with <M>n</M> observations is exactly
            the expression above with
          </p>
          <p style={{ textAlign: "center" }}>
            <M>{String.raw`m = \sigma^2 / \tau^2`}</M>
          </p>
          <p>
            — the ratio of within-category noise to between-category signal. So <M>m</M> is not an arbitrary
            regularisation knob: it is asking <em>how much do categories genuinely differ, relative to how noisy
            a single observation is?</em> When categories barely differ (<M>{String.raw`\tau^2`}</M> small),{" "}
            <M>m</M> is large and everything is pulled to the global mean, which is the right answer. This is
            empirical Bayes, and it is the same shrinkage logic as ridge regression in a different costume.
          </p>
          <p>
            Smoothing alone is still not sufficient. Even with a large <M>m</M>, the encoding for row <M>i</M>{" "}
            contains <M>{String.raw`y_i`}</M> with weight <M>{String.raw`1/(n+m)`}</M>, which is small but not
            zero and is systematically in the direction that flatters the fit. Cross-fitting removes it exactly:
            compute the encoding for each fold from the <em>other</em> folds, so <M>{String.raw`y_i`}</M> never
            enters its own feature. Smoothing controls variance; cross-fitting removes bias. You need both.
          </p>
        </Proof>

        <Callout color={GRAY} title={<>Whatever you choose, it goes in the pipeline</>}>
          Every encoder on this page learns something from the data — the category list, the counts, the target
          means. That makes it a fitted step, and a fitted step outside the fold is the silent leakage measured in{" "}
          <Link href="/learn/data-workflow/the-many-faces-of-leakage" style={link}>the previous chapter</Link>.
          Target encoding is the extreme case because it fits on <M>y</M> itself, but a one-hot encoder fitted on
          all your data has also seen which categories exist in the test set.
        </Callout>

        <h2>Two practical details that matter more than the choice</h2>
        <ul>
          <li><strong>Unseen categories.</strong> Production will show you a category that was not in training.
            Decide what happens — <code>handle_unknown=&quot;ignore&quot;</code>, a fallback to the global mean, an
            explicit &ldquo;other&rdquo; bucket — at build time, because the default in several libraries is to
            raise.</li>
          <li><strong>Rare levels.</strong> A category appearing three times cannot support an estimate. Group
            everything below a frequency threshold into &ldquo;other&rdquo; (<code>min_frequency</code> in
            scikit-learn&rsquo;s <code>OneHotEncoder</code>) — it reduces dimensionality and removes the levels
            that would otherwise be pure noise.</li>
        </ul>

        <PrevNext
          prev={{ href: "/learn/data-workflow/preprocessing-is-modelling", label: <>← Preprocessing is modelling</> }}
          next={{ href: "/learn/data-workflow/scaling-and-transforms", label: <>Next up · Scaling &amp; transforms →</> }}
        />
      </div>
    </article>
  );
}
