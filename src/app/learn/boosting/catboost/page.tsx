import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";

export const metadata = {
  title: "Categorical features: CatBoost & ordered boosting — Manifold",
  description:
    "High-cardinality categorical features quietly poison a booster through target-encoding leakage. CatBoost's ordered target statistics and ordered boosting fix a subtle bias — prediction shift — that ordinary gradient boosting has but nobody names.",
};

const TREES = "var(--c-trees)";

export default function CatBoostPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Trees & ensembles", color: TREES }, { label: "Tier 2 · practitioner", color: "var(--c-fundamentals)" }]}
        time="about 8 minutes"
        title={<>Categorical features: CatBoost &amp; ordered boosting</>}
        intro={<>
          Trees handle categories in principle, but high-cardinality ones — user IDs, zip codes, product SKUs —
          break the usual tricks. CatBoost is built around a single subtle bug that every other method shares, and
          fixing it cleanly is what sets it apart.
        </>}
      />

      <div className="lesson">
        <h2>The problem: target encoding leaks</h2>
        <p>
          One-hot encoding a feature with 50,000 categories is hopeless — 50,000 sparse columns. The standard
          alternative is <strong>target (mean) encoding</strong>: replace each category with the average label of
          the rows that have it. &ldquo;City = Paris&rdquo; becomes &ldquo;the average target among Paris
          rows.&rdquo; Compact and powerful — and <em>leaky</em>. The encoding of a row uses that row&rsquo;s own
          label, so the model peeks at the answer. For a category that appears once, its encoding <em>is</em> its
          label; the tree learns to read it off and overfits spectacularly.
        </p>

        <h2>Ordered target statistics</h2>
        <p>
          CatBoost&rsquo;s fix borrows from online learning: impose a random <strong>ordering</strong> on the
          data, and encode each row using only the rows that came <em>before</em> it in that order.
        </p>
        <MathBlock>{String.raw`\hat{x}_i = \frac{\sum_{j<i}\mathbf{1}[x_j = x_i]\, y_j + a\, p}{\sum_{j<i}\mathbf{1}[x_j = x_i] + a}`}</MathBlock>
        <p>
          The encoding for row <M>{String.raw`i`}</M> is the target average of earlier rows sharing its category,
          smoothed toward a prior <M>{String.raw`p`}</M> by a strength <M>{String.raw`a`}</M>. Because it never
          uses row <M>{String.raw`i`}</M>&rsquo;s own label, there is <strong>no leakage</strong>. It mimics
          having a fresh holdout for every row — the way you&rsquo;d <em>want</em> target encoding to behave.
        </p>

        <h2>Ordered boosting: the same leak, one level up</h2>
        <p>
          CatBoost&rsquo;s authors noticed that <em>ordinary gradient boosting has the same disease</em>, and gave
          it a name: <strong>prediction shift</strong>. Each round computes pseudo-residuals using a model that
          was trained on those very same rows — so the residuals are slightly optimistic, biased by the model
          having already seen each point. Over hundreds of rounds this self-referential bias accumulates.
        </p>
        <p>
          <strong>Ordered boosting</strong> applies the identical remedy: to compute the residual for a row, use a
          model trained only on rows that preceded it in the ordering. Maintain a set of models on growing
          prefixes of the data, and score each row with a model that never trained on it. The result is unbiased
          gradients and measurably better generalisation on small and medium datasets, where prediction shift
          bites hardest.
        </p>

        <Callout color={TREES} title={<>Oblivious (symmetric) trees</>}>
          CatBoost also grows <strong>oblivious trees</strong>: every node at a given depth uses the{" "}
          <em>same</em> split feature and threshold, so the tree is a balanced, symmetric structure. This is
          weaker per tree — a deliberate regulariser that suits boosting&rsquo;s many-weak-learners philosophy —
          and it makes inference extraordinarily fast, since a prediction is just a few comparisons indexing into
          a lookup table. It is the same &ldquo;keep each learner weak&rdquo; instinct as shallow depth, expressed
          in the tree&rsquo;s shape.
        </Callout>

        <h2>When to reach for it</h2>
        <p>
          CatBoost shines when your data is dominated by <strong>high-cardinality categorical features</strong>{" "}
          and you&rsquo;d otherwise hand-build a leak-free target encoder — it does that correctly, automatically,
          and pairs it with strong defaults that often need little tuning. On the purely numeric benchmarks in
          this track it is in the same league as XGBoost and LightGBM (it is not separately benchmarked here);
          its edge appears exactly where categories are many and encoding leakage is the real enemy. The broader
          lesson generalises past the library: <em>leakage through the target is the quiet killer of tabular
          models</em>, and any encoding you build by hand should respect an ordering or a holdout the way
          CatBoost does.
        </p>

        <PrevNext
          prev={{ href: "/learn/boosting/histogram", label: <>← Histogram boosting: LightGBM &amp; speed</> }}
          next={{ href: "/learn/boosting/tuning", label: <>Next up · Choosing &amp; tuning a booster →</> }}
        />
      </div>
    </article>
  );
}
