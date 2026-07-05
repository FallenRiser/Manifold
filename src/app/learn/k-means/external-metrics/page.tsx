import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CLUSTER_SETUP } from "@/lib/runtimeSetup";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "External metrics (ARI, NMI) — Manifold",
  description:
    "When you do have ground-truth labels, you can score a clustering against them — but only by comparing groupings, never label numbers. ARI and NMI do it the right way.",
};

export default function ExternalMetricsPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Clustering", color: "var(--c-clustering)" }]}
        time="about 7 minutes"
        title={<>External metrics (ARI, NMI)</>}
        intro={<>
          Sometimes you <em>do</em> have true labels — a benchmark dataset, or a held-out gold standard.
        Then you can grade a clustering against them. The trick: you must compare the <em>partitions</em>,
        not the arbitrary cluster numbers.
        </>}
      />

      <div className="lesson">
        <h2>The label-switching problem</h2>
        <p>
          k-Means might call a group &ldquo;cluster 2&rdquo; that the ground truth calls &ldquo;class A.&rdquo;
          The grouping can be <em>identical</em> while every label number differs. So accuracy — matching
          label to label — is meaningless here. External metrics instead ask: do these two labellings put
          the same <strong>pairs</strong> of points together?
        </p>
        <p>
          Frame it over pairs of points. Each pair is either in the <em>same</em> group or <em>different</em>
          groups, under each labelling:
        </p>
        <ul style={ul}>
          <li><strong>a</strong> — pairs together in <em>both</em> (agreement).</li>
          <li><strong>b</strong> — pairs apart in <em>both</em> (agreement).</li>
          <li><strong>c, d</strong> — pairs the two labellings disagree on.</li>
        </ul>

        <h2>Rand index, and why it needs adjusting</h2>
        <p>
          The Rand index is just the fraction of pairs the two labellings agree on:
        </p>
        <MathBlock>{String.raw`\mathrm{RI} = \frac{a + b}{a + b + c + d}`}</MathBlock>
        <p>
          The flaw: even a <em>random</em> labelling scores high, because most pairs are correctly placed
          in &ldquo;different groups&rdquo; just by chance. The <strong>Adjusted Rand Index</strong> subtracts
          that expected-by-chance agreement and rescales:
        </p>
        <MathBlock>{String.raw`\mathrm{ARI} = \frac{\mathrm{RI} - \mathbb{E}[\mathrm{RI}]}{\max(\mathrm{RI}) - \mathbb{E}[\mathrm{RI}]}`}</MathBlock>
        <p>
          Now <M>{String.raw`\mathrm{ARI} = 1`}</M> is a perfect match, <M>{String.raw`0`}</M> is exactly
          what random chance would give, and <strong>negative</strong> values mean worse than random. That
          chance-correction is what makes ARI trustworthy.
        </p>

        <h2>Normalized Mutual Information</h2>
        <p>
          NMI takes an information-theory view: how much does knowing the cluster tell you about the true
          class? Mutual information <M>{String.raw`I(U; V)`}</M> captures shared information; dividing by the
          (averaged) entropies normalises it to <M>{String.raw`[0, 1]`}</M>:
        </p>
        <MathBlock>{String.raw`\mathrm{NMI}(U, V) = \frac{I(U; V)}{\operatorname{mean}\big(H(U),\, H(V)\big)}`}</MathBlock>
        <p>
          <M>{String.raw`1`}</M> means the clustering determines the classes perfectly; <M>{String.raw`0`}</M>{" "}
          means they&rsquo;re independent. Its adjusted-for-chance cousin, <strong>AMI</strong>, is the safer
          default — like ARI, it corrects for the agreement you&rsquo;d expect at random, which plain NMI does
          not.
        </p>

        <Callout color="var(--c-clustering)" title={<>ARI vs. NMI — which to reach for</>}>
          Both are symmetric and don&rsquo;t care about label names or even the number of clusters matching
            the number of classes. ARI counts pair agreements and is intuitive; NMI/AMI measure shared
            information and handle differing cluster counts gracefully. Prefer the <em>adjusted</em>
            versions (ARI, AMI) — raw RI and NMI are inflated by chance. And remember: these need ground
            truth, so they&rsquo;re for benchmarking and validation, not day-to-day unsupervised work.
        </Callout>

        <h2>Score against ground truth</h2>
        <CodeBlock setup={CLUSTER_SETUP} fromScratch={codeScratch} withLibrary={codeLib} />

        <PrevNext prev={{ href: "/learn/k-means/internal-metrics", label: <>← Internal metrics</> }} next={{ href: "/learn/k-means/cluster-stability", label: <>Next up · Cluster stability →</> }} />
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np
from itertools import combinations

def rand_index(true, pred):
    a = b = 0
    for i, j in combinations(range(len(true)), 2):
        same_t = true[i] == true[j]
        same_p = pred[i] == pred[j]
        a += same_t and same_p          # together in both
        b += (not same_t) and (not same_p)   # apart in both
    total = len(true) * (len(true) - 1) // 2
    return (a + b) / total              # plain RI (not chance-corrected)`;

const codeLib = `from sklearn.metrics import (adjusted_rand_score,
                             normalized_mutual_info_score,
                             adjusted_mutual_info_score)

# y_true = ground-truth labels, lab = k-means labels
print("ARI:", adjusted_rand_score(y_true, lab))          # 1 perfect, 0 chance
print("NMI:", normalized_mutual_info_score(y_true, lab))
print("AMI:", adjusted_mutual_info_score(y_true, lab))   # chance-corrected NMI`;


const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };


