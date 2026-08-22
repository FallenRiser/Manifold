import Link from "next/link";
import { DecorrelationLab } from "@/components/labs/DecorrelationLab";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LabFrame } from "@/components/LabFrame";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";

export const metadata = {
  title: "Decorrelating the trees — Manifold",
  description:
    "Bagging alone leaves trees correlated — they all grab the same strong feature first. Restricting each split to a random subset of features breaks that lock-step, and lower correlation is what lets averaging reach a lower variance floor.",
};

const TREES = "var(--c-trees)";

export default function DecorrelatingPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Trees & ensembles", color: TREES }, { label: "Tier 2 · practitioner", color: "var(--c-fundamentals)" }]}
        time="about 8 minutes"
        title={<>Decorrelating the trees</>}
        intro={<>
          This is the idea that turns plain bagging into a <em>random forest</em>, and the reason forests work
          as well as they do. It&rsquo;s a single, almost trivial-looking change to how each split is chosen —
          with an outsized effect.
        </>}
      />

      <div className="lesson">
        <h2>The problem with bagging alone</h2>
        <p>
          Bagging perturbs the <em>data</em>, but every tree still uses the <em>same greedy rule</em> on the
          same features. If one feature is clearly the most informative, then almost every tree — whatever its
          bootstrap sample — will choose it for the very first split. And once the trees agree on the root, they
          tend to agree a lot further down. The result: the bagged trees are <strong>correlated</strong>, and
          correlated trees make correlated errors that averaging can&rsquo;t cancel.
        </p>
        <p>
          You&rsquo;ll make this precise in the <Link href="/learn/random-forests/why-averaging-works" style={link}>theory
          chapter</Link>, but the one-line version is: the variance of an average of trees with pairwise
          correlation <M>{String.raw`\rho`}</M> can never drop below <M>{String.raw`\rho\sigma^2`}</M>, no matter
          how many trees you add. High correlation means a high floor. To go lower, you must lower{" "}
          <M>{String.raw`\rho`}</M>.
        </p>

        <h2>The random subspace trick</h2>
        <p>
          Random forests lower <M>{String.raw`\rho`}</M> with one rule: <strong>at each split, consider only a
          random subset of <M>{String.raw`m`}</M> features</strong> (not all <M>{String.raw`p`}</M>). A common
          default is <M>{String.raw`m = \sqrt{p}`}</M> for classification, <M>{String.raw`m = p/3`}</M> for
          regression. Now the dominant feature is simply <em>unavailable</em> at many splits, forcing different
          trees to build around different features. They stop agreeing at the root, their structures diverge,
          and their errors decorrelate.
        </p>
        <p>
          There&rsquo;s a tension, though, and it&rsquo;s the whole tuning story of <M>{String.raw`m`}</M>:
        </p>

        <PredictPrompt
          accent={TREES}
          prompt={<>As you shrink <M>{String.raw`m`}</M> toward 1, tree correlation drops. What happens to <em>accuracy</em>?</>}
          options={["Keeps rising — smaller is always better", "Rises then falls — very small m makes each tree too weak", "Falls the whole way"]}
        />

        <LabFrame
          accent={TREES}
          tryThis={<>Sweep <M>{String.raw`m`}</M> from 1 to 12 on a 12-feature dataset (only 4 features carry signal). Watch the correlation curve (bottom) and the accuracy curve (top) move in tension.</>}
          insight={<>Correlation climbs steadily with m — smaller m genuinely decorrelates the trees. But at m = 1 each split is nearly blind (it often can only see a noise feature), so the trees are too weak and accuracy sags. The best spot is intermediate; √p (marked) sits comfortably in the good region. m trades tree strength against tree diversity.</>}
        >
          <DecorrelationLab />
        </LabFrame>

        <p>
          So <M>{String.raw`m`}</M> is a bias–variance dial of its own. Large <M>{String.raw`m`}</M> → strong but
          correlated trees (you&rsquo;re back to bagging, with a high variance floor). Small{" "}
          <M>{String.raw`m`}</M> → beautifully decorrelated but individually feeble trees. The <M>{String.raw`\sqrt{p}`}</M>{" "}
          default lands near the sweet spot often enough that it&rsquo;s rarely worth tuning first — but when you
          do tune a forest, <M>{String.raw`m`}</M> (<code>max_features</code>) is the knob that matters most.
        </p>

        <Callout color={TREES} title={<>Two dice, one goal</>}>
          A random forest injects randomness twice — once in the <em>data</em> (the bootstrap) and once in the{" "}
          <em> features</em> (the random subspace at each split). Both exist for the same reason: to make the
          trees disagree, so their errors are independent enough to average away. Decorrelation is the product;
          everything else is machinery.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/random-forests/out-of-bag-error", label: <>← Out-of-bag error</> }}
          next={{ href: "/learn/random-forests/the-algorithm", label: <>Next up · The random forest algorithm →</> }}
        />
      </div>
    </article>
  );
}

const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
