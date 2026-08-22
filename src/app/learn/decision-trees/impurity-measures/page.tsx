import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";

export const metadata = {
  title: "Gini, entropy & information gain — Manifold",
  description:
    "The three impurity scores a tree can minimise — Gini, entropy, and misclassification error — how information gain is built from them, and why the two smooth ones are used for growing and the third is not.",
};

const TREES = "var(--c-trees)";

// Static impurity curves over the class-1 fraction p, computed at module scope
// with rounded coordinates → server-rendered, no client JS, no hydration risk.
const FW = 440, FH = 260, FP = 34;
const fx = (p: number) => Math.round((FP + p * (FW - 2 * FP)) * 100) / 100;
const fy = (v: number) => Math.round((FH - FP - (v / 0.5) * (FH - 2 * FP)) * 100) / 100; // scale so peak 0.5 → top
const curve = (fn: (p: number) => number) => {
  const pts: string[] = [];
  for (let i = 0; i <= 100; i++) {
    const p = i / 100;
    pts.push(`${fx(p)},${fy(fn(p))}`);
  }
  return pts.join(" ");
};
const gini = (p: number) => 2 * p * (1 - p);
const entropy = (p: number) => (p <= 0 || p >= 1 ? 0 : -(p * Math.log2(p) + (1 - p) * Math.log2(1 - p))) * 0.5;
const misclass = (p: number) => Math.min(p, 1 - p);

export default function ImpurityMeasuresPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Trees & ensembles", color: TREES }, { label: "Tier 2 · practitioner", color: "var(--c-fundamentals)" }]}
        time="about 8 minutes"
        title={<>Gini, entropy &amp; information gain</>}
        intro={<>
          &ldquo;Impurity&rdquo; can be scored three classic ways. They agree on the extremes — zero for a
          pure node, maximal for a 50/50 node — but differ in the middle, and that difference decides which
          ones a tree actually uses to grow.
        </>}
      />

      <div className="lesson">
        <h2>Three ways to score a mess</h2>
        <p>For a node whose class-1 fraction is <M>{String.raw`p`}</M>, the three measures are:</p>
        <MathBlock>{String.raw`\begin{aligned} \text{Gini} &= 2p(1-p) \\[2pt] \text{Entropy} &= -p\log_2 p - (1-p)\log_2(1-p) \\[2pt] \text{Misclassification} &= 1 - \max(p,\,1-p) = \min(p,\,1-p) \end{aligned}`}</MathBlock>
        <p>
          All three are zero at <M>{String.raw`p=0`}</M> and <M>{String.raw`p=1`}</M> and peak at{" "}
          <M>{String.raw`p=\tfrac12`}</M>. Plotted together (entropy rescaled to share the same peak height so
          the shapes compare):
        </p>

        <figure style={{ margin: "1.4rem 0" }}>
          <div style={{ background: "var(--canvas)", border: "1px solid var(--border-strong)", borderRadius: 14, padding: "14px 12px" }}>
            <svg viewBox={`0 0 ${FW} ${FH}`} width="100%" style={{ maxWidth: 480, display: "block", margin: "0 auto" }} role="img" aria-label="Gini, entropy and misclassification error as functions of the class fraction p">
              <line x1={FP} y1={FH - FP} x2={FW - FP} y2={FH - FP} stroke="var(--border-strong)" strokeWidth={1} />
              <line x1={FP} y1={FP} x2={FP} y2={FH - FP} stroke="var(--border-strong)" strokeWidth={1} />
              <line x1={fx(0.5)} y1={FP} x2={fx(0.5)} y2={FH - FP} stroke="var(--border)" strokeWidth={1} strokeDasharray="3 4" />
              <polyline points={curve(entropy)} fill="none" stroke="var(--c-classification)" strokeWidth={2} />
              <polyline points={curve(gini)} fill="none" stroke="var(--c-trees)" strokeWidth={2.5} />
              <polyline points={curve(misclass)} fill="none" stroke="var(--muted)" strokeWidth={2} strokeDasharray="5 4" />
              <text x={fx(0)} y={FH - FP + 15} fontSize={10} textAnchor="middle" fill="var(--faint)">0</text>
              <text x={fx(0.5)} y={FH - FP + 15} fontSize={10} textAnchor="middle" fill="var(--faint)">p = ½</text>
              <text x={fx(1)} y={FH - FP + 15} fontSize={10} textAnchor="middle" fill="var(--faint)">1</text>
            </svg>
            <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 6, fontSize: 12, color: "var(--muted)", flexWrap: "wrap" }}>
              <Legend color="var(--c-trees)" label="Gini" />
              <Legend color="var(--c-classification)" label="Entropy (scaled)" />
              <Legend color="var(--muted)" label="Misclassification" dashed />
            </div>
          </div>
        </figure>

        <p>
          Gini and entropy are <strong>smooth and strictly concave</strong> — they curve the whole way. The
          misclassification error is two straight lines with a hard kink at <M>{String.raw`p=\tfrac12`}</M>.
          That shape difference is the whole point of this page.
        </p>

        <h2>Why growing uses Gini or entropy, not error rate</h2>
        <p>
          You&rsquo;d think a tree should split to reduce its <em>error rate</em> directly. It shouldn&rsquo;t,
          and the reason is the straight lines. Because misclassification is piecewise-linear, a split can move
          probability mass around <em>without any drop in the weighted score</em> — the gains on one side
          exactly cancel a flat region on the other. The measure is blind to progress that hasn&rsquo;t yet
          flipped a majority.
        </p>
        <p>
          Concavity fixes this. For a strictly concave measure, <em>any</em> split into two non-identical
          children strictly lowers the weighted impurity — every honest improvement registers as positive
          gain. That sensitivity is what lets greedy splitting make steady progress, so CART grows on Gini
          (its default) or entropy and keeps misclassification only for <em>pruning</em>, where the error rate
          is what we ultimately care about.
        </p>

        <Callout color={TREES} title={<>Gini vs entropy — does it matter?</>}>
          Rarely. They produce identical trees the large majority of the time; entropy is marginally more
          expensive (a logarithm per candidate) and leans very slightly toward more balanced splits. Gini is
          the default for a reason — pick it unless you have a specific reason not to, and don&rsquo;t expect
          the choice to move your accuracy.
        </Callout>

        <h2>Information gain, precisely</h2>
        <p>
          Whichever impurity <M>{String.raw`I`}</M> you choose, the split score is the same shape you met in
          Tier 1 — the parent&rsquo;s impurity minus the size-weighted impurity of the children:
        </p>
        <MathBlock>{String.raw`\text{gain} = I(\text{parent}) - \frac{n_L}{n}\,I(L) - \frac{n_R}{n}\,I(R)`}</MathBlock>
        <p>
          With <M>{String.raw`I`}</M> = entropy, this quantity is literally the <em>mutual information</em>{" "}
          between the split and the label — hence the name &ldquo;information gain.&rdquo; With Gini it has no
          information-theoretic name but behaves the same way. The tree tries every candidate split and keeps
          the one with the largest gain, node after node.
        </p>

        <PrevNext
          prev={{ href: "/learn/decision-trees/growing-the-tree", label: <>← Growing the whole tree</> }}
          next={{ href: "/learn/decision-trees/regression-trees", label: <>Next up · Regression trees →</> }}
        />
      </div>
    </article>
  );
}

function Legend({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 16, height: 0, borderTop: `2px ${dashed ? "dashed" : "solid"} ${color}` }} />
      {label}
    </span>
  );
}
