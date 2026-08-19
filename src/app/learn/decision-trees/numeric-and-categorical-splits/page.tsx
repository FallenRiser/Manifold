import Link from "next/link";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";

export const metadata = {
  title: "Numeric & categorical splits — Manifold",
  description:
    "How a tree actually enumerates splits: sorted thresholds for numbers, the exponential blow-up for categories and the ordering trick that tames it, and how missing values are handled without imputation.",
};

const TREES = "var(--c-trees)";

export default function SplitsPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Trees & ensembles", color: TREES }, { label: "Tier 2 · practitioner", color: "var(--c-fundamentals)" }]}
        time="about 8 minutes"
        title={<>Numeric &amp; categorical splits</>}
        intro={<>
          &ldquo;Try every split&rdquo; is easy to say. What are the splits, exactly, and how many? The answer
          differs sharply for numbers and categories — and it explains a few of a tree&rsquo;s most useful
          quirks, like never needing you to scale a feature.
        </>}
      />

      <div className="lesson">
        <h2>Numeric features: sort, then scan the gaps</h2>
        <p>
          For a numeric feature, a split is a threshold <M>{String.raw`x_j \le t`}</M>. The only thresholds
          worth trying sit <em>between</em> adjacent sorted values — anywhere inside a gap gives the identical
          partition. So the tree sorts the feature&rsquo;s values (<M>{String.raw`O(n\log n)`}</M>), places a
          candidate at each midpoint, and sweeps left to right updating the impurity in one pass. At most
          <M>{String.raw`\ n-1`}</M> candidates per feature.
        </p>
        <p>
          One consequence is worth pinning down because it surprises people coming from linear models:
        </p>
        <Callout color={TREES} title={<>Trees don&rsquo;t care about scale — at all</>}>
          Splits depend only on the <strong>order</strong> of a feature&rsquo;s values, never their
          magnitudes. Standardising, log-transforming, or multiplying a feature by a thousand produces the{" "}
          <em>identical</em> tree. No feature scaling, no <M>{String.raw`\ell_2`}</M> normalisation, ever —
          the preprocessing that&rsquo;s mandatory for k-NN, SVMs, and gradient descent is simply irrelevant
          here.
        </Callout>

        <h2>Categorical features: an exponential trap, and the escape</h2>
        <p>
          A categorical feature with <M>{String.raw`k`}</M> unlabelled categories has no natural order, so a
          split is a partition of the categories into a &ldquo;goes-left&rdquo; set and a
          &ldquo;goes-right&rdquo; set. There are <M>{String.raw`2^{k-1}-1`}</M> such partitions — an
          exponential blow-up. With 20 categories that&rsquo;s over half a million candidate splits <em>at a
          single node.</em> Brute force is hopeless.
        </p>
        <p>
          There&rsquo;s a beautiful escape for <strong>binary classification and regression</strong> (a result
          due to Breiman): sort the categories by their mean target value, and the optimal partition is always
          a <em>prefix</em> of that ordering. That collapses the exponential search back to the numeric case —
          sort by mean, then scan the <M>{String.raw`k-1`}</M> gaps. Optimal, in <M>{String.raw`O(k\log k)`}</M>.
          (For multiclass there&rsquo;s no such shortcut, so implementations fall back to heuristics.)
        </p>

        <h2>Encoding: what to do in practice</h2>
        <p>
          Awkwardly, the most common implementation — scikit-learn&rsquo;s <code>DecisionTree</code> — does not
          consume raw categories at all; it needs numbers. Your encoding choice then matters:
        </p>
        <ul style={ul}>
          <li><strong>Ordinal encoding</strong> (map categories to 0, 1, 2, …) lets the tree split on the
            resulting number. It imposes a fake order, but a tree can carve any category <em>out</em> with
            enough splits, so it usually works and keeps the feature compact.</li>
          <li><strong>One-hot encoding</strong> turns one <M>{String.raw`k`}</M>-category feature into{" "}
            <M>{String.raw`k`}</M> binary columns. Each split can then only peel off <em>one</em> category at a
            time, which fragments the data and buries the feature&rsquo;s importance across many thin columns —
            actively harmful for high-cardinality features in trees.</li>
          <li><strong>Native categorical handling</strong> (LightGBM, modern XGBoost, and sklearn&rsquo;s
            <code> HistGradientBoosting</code>) implements the ordering trick internally — the right answer when
            you have it.</li>
        </ul>

        <h2>Missing values, without imputing</h2>
        <p>
          Trees can handle a missing feature value <em>during the split itself</em>, which is rarer than it
          should be among ML models. Two schemes dominate:
        </p>
        <ul style={ul}>
          <li><strong>Surrogate splits</strong> (classic CART): for each split, find backup features whose
            split mimics the primary one, and use a surrogate to route any point whose primary value is
            missing.</li>
          <li><strong>Learned default direction</strong> (XGBoost, LightGBM, sklearn&rsquo;s histogram trees):
            simply try sending all the missing-value points left, then right, and keep whichever reduces the
            loss more. The missing-ness itself becomes part of the model — often informative.</li>
        </ul>
        <p>
          Either way, no separate imputation step is required, and &ldquo;this value is missing&rdquo; can be a
          signal the tree exploits rather than a gap you must paper over.
        </p>

        <Quiz
          accent={TREES}
          questions={[
            {
              q: <>You standardise every feature to zero mean and unit variance before fitting a decision tree. What changes?</>,
              options: [
                "The tree becomes more accurate",
                "Nothing — trees split on value order, which standardising preserves",
                "The tree can now handle non-linear boundaries",
              ],
              answer: 1,
              explain: <>Splits depend only on the ordering of values, and any monotonic transform leaves that ordering intact. Scaling is a no-op for trees.</>,
            },
            {
              q: <>Why is one-hot encoding often a poor choice for a high-cardinality categorical feature in a tree?</>,
              options: [
                "It makes the feature impossible to split",
                "Each split can only isolate one category at a time, fragmenting the data and diluting the feature's importance",
                "It changes the feature's scale",
              ],
              answer: 1,
              explain: <>With one binary column per category, the tree peels off a single category per split. That wastes depth and spreads the feature's signal across many thin columns. Ordinal encoding or native categorical handling is usually better.</>,
            },
            {
              q: <>For binary/regression targets, how does a tree avoid the 2^(k−1) blow-up when splitting a k-category feature?</>,
              options: [
                "It tests all partitions but caches results",
                "It sorts categories by mean target and splits on a prefix of that order — provably optimal",
                "It randomly samples a few partitions",
              ],
              answer: 1,
              explain: <>Breiman's result: ordering categories by mean target reduces the optimal partition to a prefix cut, turning an exponential search into an O(k log k) numeric scan.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/decision-trees/regression-trees", label: <>← Regression trees</> }}
          next={{ href: "/learn/decision-trees/how-trees-overfit", label: <>Next up · How a tree overfits →</> }}
        />
      </div>
    </article>
  );
}

const ul: React.CSSProperties = { margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
