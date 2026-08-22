import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "Extremely randomized trees — Manifold",
  description:
    "Extra-Trees push randomness one step further: instead of searching for the best split threshold, pick thresholds at random. Slightly more bias, less variance, and much faster to train.",
};

const TREES = "var(--c-trees)";

export default function ExtraTreesPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Trees & ensembles", color: TREES }, { label: "Tier 2 · practitioner", color: "var(--c-fundamentals)" }]}
        time="about 5 minutes"
        title={<>Extremely randomized trees</>}
        intro={<>
          If a little randomness decorrelates trees and helps, why not more? Extra-Trees (Extremely Randomized
          Trees) take the idea to its logical end — and get a faster, sometimes better forest almost for free.
        </>}
      />

      <div className="lesson">
        <h2>One more die to roll: the threshold</h2>
        <p>
          A normal forest still works hard at each split: within its random feature subset, it scans every
          candidate threshold for the best one. Extra-Trees skip that search. For each feature in the subset,
          they pick a <strong>single random threshold</strong>, then take the best <em>among those few random
          splits</em>. The greedy threshold search is gone.
        </p>
        <p>Two changes fall out of this, and one convention:</p>
        <ul style={ul}>
          <li><strong>More randomness → lower variance, a little more bias.</strong> Random thresholds make the
            trees even more decorrelated (variance drops further), but each tree fits its own data slightly less
            well (bias ticks up). Often the trade is favourable.</li>
          <li><strong>Much faster.</strong> Not searching thresholds is the expensive part of tree-building
            removed — Extra-Trees train noticeably quicker, which matters at scale.</li>
          <li><strong>Usually no bootstrap.</strong> By default Extra-Trees train each tree on the <em>whole</em>{" "}
            dataset (<code>bootstrap=False</code>); the split randomness alone supplies the diversity. (You can
            turn bootstrapping back on.)</li>
        </ul>

        <CodeBlock
          fromScratch={`from sklearn.ensemble import ExtraTreesClassifier

# same interface as RandomForestClassifier — often a drop-in to try
et = ExtraTreesClassifier(
    n_estimators=500,
    max_features="sqrt",
    bootstrap=False,   # the default for Extra-Trees: use the whole sample
    n_jobs=-1,
    random_state=0,
)
et.fit(X_train, y_train)`}
        />

        <Callout color={TREES} title={<>When to reach for Extra-Trees</>}>
          Treat Extra-Trees as a cheap second horse to race against a random forest: same API, often similar
          accuracy, usually faster to train. They tend to shine when the data is noisy (extra randomness =
          extra regularisation) and on large datasets where the threshold search is a bottleneck. When they
          lose, it&rsquo;s usually because the added bias hurt on a clean, structured problem. Try both; keep
          the winner.
        </Callout>

        <p>
          Extra-Trees close out the &ldquo;more randomness&rdquo; direction. There&rsquo;s a completely
          different way to combine trees — building them <em>in sequence</em>, each correcting the last — which
          is <Link href="/learn/decision-trees/bias-and-variance-of-trees" style={link}>boosting</Link>, and the
          subject of a head-to-head next.
        </p>

        <PrevNext
          prev={{ href: "/learn/random-forests/hyperparameters", label: <>← The hyperparameters</> }}
          next={{ href: "/learn/random-forests/imbalanced-forests", label: <>Next up · Imbalanced & weighted forests →</> }}
        />
      </div>
    </article>
  );
}

const ul: React.CSSProperties = { margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
