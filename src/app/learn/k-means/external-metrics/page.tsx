import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "External metrics (ARI, NMI) — Manifold",
  description:
    "When you do have ground-truth labels, you can score a clustering against them — but only by comparing groupings, never label numbers. ARI and NMI do it the right way.",
};

export default function ExternalMetricsPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-clustering)")}>Clustering</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 7 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        External metrics (ARI, NMI)
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        Sometimes you <em>do</em> have true labels — a benchmark dataset, or a held-out gold standard.
        Then you can grade a clustering against them. The trick: you must compare the <em>partitions</em>,
        not the arbitrary cluster numbers.
      </p>

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

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-clustering)", marginBottom: 4 }}>
            ARI vs. NMI — which to reach for
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            Both are symmetric and don&rsquo;t care about label names or even the number of clusters matching
            the number of classes. ARI counts pair agreements and is intuitive; NMI/AMI measure shared
            information and handle differing cluster counts gracefully. Prefer the <em>adjusted</em>
            versions (ARI, AMI) — raw RI and NMI are inflated by chance. And remember: these need ground
            truth, so they&rsquo;re for benchmarking and validation, not day-to-day unsupervised work.
          </p>
        </div>

        <h2>Score against ground truth</h2>
        <CodeBlock fromScratch={codeScratch} withLibrary={codeLib} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/k-means/internal-metrics" style={navLink}>← Internal metrics</Link>
          <Link href="/learn/k-means/cluster-stability" style={{ ...navLink, fontWeight: 600 }}>Next up · Cluster stability →</Link>
        </div>
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

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-clustering) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-clustering) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0" };
