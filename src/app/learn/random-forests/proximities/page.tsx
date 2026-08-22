import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";

export const metadata = {
  title: "Proximities, outliers & missing data — Manifold",
  description:
    "A trained forest quietly defines a similarity between any two points: how often they land in the same leaf. That proximity matrix powers missing-value imputation, outlier detection, and an unsupervised view of your data.",
};

const TREES = "var(--c-trees)";

export default function ProximitiesPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Trees & ensembles", color: TREES }, { label: "Tier 2 · practitioner", color: "var(--c-fundamentals)" }]}
        time="about 6 minutes"
        title={<>Proximities, outliers &amp; missing data</>}
        intro={<>
          A random forest gives you more than predictions. Baked into a trained forest is a notion of{" "}
          <em> similarity</em> between any two data points — a genuinely useful by-product that most people
          never touch.
        </>}
      />

      <div className="lesson">
        <h2>Proximity: how often two points share a leaf</h2>
        <p>
          Run two points down every tree in the forest. Sometimes they land in the same leaf; sometimes they
          split off. The <strong>proximity</strong> between them is simply the fraction of trees in which they
          end up together:
        </p>
        <MathBlock>{String.raw`\text{prox}(i, j) = \frac{1}{B}\sum_{b=1}^{B} \mathbb{1}\big[\,\text{leaf}_b(x_i) = \text{leaf}_b(x_j)\,\big]`}</MathBlock>
        <p>
          Two points that repeatedly fall in the same leaf are &ldquo;close&rdquo; in the forest&rsquo;s eyes —
          not close in raw Euclidean distance, but close in the way <em>this task</em> cares about, because the
          trees were grown to separate the target. It&rsquo;s a <strong>supervised, data-adaptive
          similarity</strong>, and it turns the forest into a kind of kernel.
        </p>

        <Callout color={TREES} title={<>A forest is secretly a kernel</>}>
          The proximity matrix is a valid similarity (kernel) matrix learned from the data — which connects
          random forests to the <Link href="/learn/kernel-ridge-regression" style={link}>kernel methods</Link>
          you met in the regression family. Where an RBF kernel fixes similarity by distance in advance, a
          forest <em>learns</em> which directions matter from the labels. That&rsquo;s why proximities often
          capture task-relevant structure a plain distance misses entirely.
        </Callout>

        <h2>Three things the proximity matrix buys you</h2>
        <ul style={ul}>
          <li><strong>Missing-value imputation.</strong> Fill a gap with a proximity-weighted average (or vote)
            of the other rows — neighbours that <em>this forest</em> considers similar, not just rows that look
            similar in raw feature space. Iterating this (fit, impute, refit) is a classic, strong imputation
            method.</li>
          <li><strong>Outlier detection.</strong> A point whose proximity to every other member of its own
            class is low doesn&rsquo;t belong with its neighbours — a natural, label-aware outlier score, with
            no separate model to train.</li>
          <li><strong>Unsupervised structure &amp; visualisation.</strong> Turn proximity into distance
            (<M>{String.raw`1 - \text{prox}`}</M>) and run it through MDS or a clustering algorithm to <em>see</em>{" "}
            your data in the forest&rsquo;s geometry. There&rsquo;s even an unsupervised trick: train a forest
            to tell real data from shuffled &ldquo;noise&rdquo; data, and its proximities reveal the real
            data&rsquo;s cluster structure — a forest with no labels at all.</li>
        </ul>

        <p>
          None of this is exotic to compute — every tree already knows which leaf each point reached; proximity
          just tallies agreements. It&rsquo;s the clearest sign that a forest builds a rich internal
          representation of your data, not merely a decision rule.
        </p>

        <PrevNext
          prev={{ href: "/learn/random-forests/limits-of-forests", label: <>← Bias & the limits of forests</> }}
          next={{ href: "/learn/random-forests/isolation-forests", label: <>Next up · Isolation forests: anomaly detection →</> }}
        />
      </div>
    </article>
  );
}

const ul: React.CSSProperties = { margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
