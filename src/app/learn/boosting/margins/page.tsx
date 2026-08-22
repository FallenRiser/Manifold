import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeOutput } from "@/components/CodeOutput";

export const metadata = {
  title: "Margins & resistance to overfitting — Manifold",
  description:
    "AdaBoost's most famous puzzle: test error keeps dropping even after training error hits zero. The margin theory explains it — boosting doesn't just get answers right, it gets them right with ever-growing confidence, and margin is what generalisation actually depends on.",
};

const TREES = "var(--c-trees)";

export default function MarginsPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Trees & ensembles", color: TREES }, { label: "Tier 2 · practitioner", color: "var(--c-fundamentals)" }]}
        time="about 8 minutes"
        title={<>Margins &amp; resistance to overfitting</>}
        intro={<>
          On the previous run, AdaBoost&rsquo;s training error reached zero at 28 stumps — and its test error kept
          falling for another 272 rounds. Classical wisdom says adding capacity after a perfect training fit can
          only overfit. AdaBoost routinely does the opposite. The explanation is <em>margins</em>.
        </>}
      />

      <div className="lesson">
        <h2>The phenomenon, in numbers</h2>
        <p>The breast-cancer run from two pages back, laid out in full:</p>
        <CodeOutput label="AdaBoost with stumps — train vs test error">{`  n=  1   train err 0.0678   test err 0.1111
  n=  5   train err 0.0276   test err 0.0702
  n= 10   train err 0.0226   test err 0.0585
  n= 25   train err 0.0025   test err 0.0643
  n= 50   train err 0.0000   test err 0.0585   <- training error is now zero
  n=100   train err 0.0000   test err 0.0585
  n=300   train err 0.0000   test err 0.0292   <- yet test error nearly halves again`}</CodeOutput>
        <p>
          From round 50 onward there are <em>no training mistakes left</em>. A model that already fits the
          training data perfectly is still, somehow, improving on data it has never seen. What is changing under
          the hood if the predictions on the training set are all already correct?
        </p>

        <h2>The answer: confidence, not correctness</h2>
        <p>
          Define the (normalised) <strong>margin</strong> of a training example as
        </p>
        <MathBlock>{String.raw`\operatorname{margin}(x_i) = \frac{y_i \sum_m \alpha_m h_m(x_i)}{\sum_m |\alpha_m|} \;\in\; [-1, +1]`}</MathBlock>
        <p>
          It is the signed, normalised vote for the correct label. A margin just above 0 means the weighted vote
          barely got it right — a coin-flip of confidence. A margin near <M>{String.raw`+1`}</M> means{" "}
          <em>almost every</em> weak learner, weighted by its say, agreed on the right answer. Once training error
          is zero, all margins are positive — but they are not all large. <strong>AdaBoost keeps going and pushes
          the small positive margins upward.</strong> It is no longer changing <em>which</em> examples are correct;
          it is making the correct answers more emphatic.
        </p>

        <figure style={{ margin: "1.6rem 0" }}>
          <div style={{ background: "var(--canvas)", border: "1px solid var(--border-strong)", borderRadius: 14, padding: "16px 12px 12px" }}>
            <MarginFig />
            <div style={{ textAlign: "center", fontSize: 12, color: "var(--muted)", marginTop: 8, maxWidth: 520, marginInline: "auto" }}>
              Schematic cumulative margin distribution. Adding trees shifts the curve{" "}
              <strong style={{ color: "var(--c-trees)" }}>down and right</strong> — fewer small margins, more mass
              near +1 — even though every example was already classified correctly. That rightward shift is what
              the generalisation bound rewards.
            </div>
          </div>
        </figure>

        <Callout color={TREES} title={<>Why bigger margins generalise better</>}>
          Schapire, Freund, Bartlett &amp; Lee (1998) proved a generalisation bound for voting classifiers that
          depends on the <strong>margin distribution</strong> and <em>not</em> on the number of weak learners{" "}
          <M>{String.raw`M`}</M>. Roughly, test error is bounded by the fraction of training examples with margin
          below some <M>{String.raw`\theta`}</M>, plus a term that shrinks with larger <M>{String.raw`\theta`}</M>
          — and crucially has no dependence on how many rounds you ran. Adding more trees can only{" "}
          <em>raise</em> margins, never lower the count of already-large ones, so the bound keeps improving even
          as model &ldquo;size&rdquo; explodes. Confident correctness is what buys generalisation, and boosting
          manufactures it.
        </Callout>

        <h2>A useful mental model: boosting as a max-margin method</h2>
        <p>
          If this sounds like <Link href="/learn/support-vector-regression" style={link}>support vector
          machines</Link>, that is not a coincidence. Both are, in spirit, <strong>maximum-margin</strong>{" "}
          methods — they separate the classes not by any old boundary but by the one that clears the data by the
          widest confidence gap. SVMs maximise the margin in a fixed feature space by solving one convex program;
          AdaBoost greedily maximises a (differently normalised) margin in the space of weak learners, one tree at
          a time. The shared lesson is deep: <em>generalisation tracks margin, not raw training accuracy.</em>
        </p>

        <h2>The honest caveat: it is not magic</h2>
        <p>
          &ldquo;AdaBoost cannot overfit&rdquo; is folklore, and it is false. Two real limits:
        </p>
        <ul style={ul}>
          <li>
            <strong>Label noise breaks it.</strong> The margin story assumes the labels are trustworthy. From the{" "}
            <Link href="/learn/boosting/adaboost-exponential-loss" style={link}>exponential-loss page</Link>, a
            mislabelled point gets an exponentially growing weight; boosting will sacrifice the boundary to
            &ldquo;fix&rdquo; it, driving <em>its</em> margin up at everyone else&rsquo;s expense. On noisy data
            AdaBoost <strong>does</strong> overfit, and gentler losses (log-loss) or shrinkage are needed.
          </li>
          <li>
            <strong>Enough rounds on hard data still eventually hurts.</strong> The resistance is real and often
            dramatic, but &ldquo;run it forever&rdquo; is not a guarantee. In practice you still validate and, for
            gradient boosting especially, <Link href="/learn/boosting/early-stopping" style={link}>stop early</Link>.
          </li>
        </ul>
        <p>
          The takeaway is not &ldquo;boosting never overfits.&rdquo; It is that <strong>training error is the
          wrong thing to watch.</strong> The margin distribution is the real state of a boosted model, and it can
          keep improving long after the training predictions have stopped changing.
        </p>

        <PrevNext
          prev={{ href: "/learn/boosting/adaboost-exponential-loss", label: <>← Why AdaBoost works: exponential loss</> }}
          next={{ href: "/learn/boosting/multiclass", label: <>Next up · Multiclass &amp; real-valued boosting →</> }}
        />
      </div>
    </article>
  );
}

// Schematic cumulative margin distributions: few vs many rounds. CDF(m) = fraction
// of training margins <= m. "Many trees" concentrates mass near +1 (rises later).
const MGW = 260, MGH = 150, MGP = 20;
const mrr = (v: number) => Math.round(v * 100) / 100;
const mgx = (m: number) => mrr(MGP + m * (MGW - 2 * MGP));            // margin 0..1
const mgy = (c: number) => mrr(MGP + (1 - c) * (MGH - 2 * MGP - 6));  // cdf 0..1
function mgCurve(pow: number) {
  const pts: string[] = [];
  for (let i = 0; i <= 40; i++) { const m = i / 40; pts.push(`${mgx(m)},${mgy(Math.pow(m, pow))}`); }
  return pts.join(" ");
}
function MarginFig() {
  return (
    <svg viewBox={`0 0 ${MGW} ${MGH}`} width="100%" style={{ maxWidth: MGW, display: "block", margin: "0 auto" }} role="img" aria-label="cumulative margin distribution shifting right as trees are added">
      {/* axes */}
      <line x1={MGP} y1={mgy(0)} x2={MGW - MGP} y2={mgy(0)} stroke="var(--border-strong)" strokeWidth={1} />
      <line x1={MGP} y1={mgy(0)} x2={MGP} y2={mgy(1)} stroke="var(--border-strong)" strokeWidth={1} />
      <text x={MGW - MGP} y={mgy(0) + 13} textAnchor="end" fontSize={9} fill="var(--faint)">margin →</text>
      <text x={MGP - 4} y={mgy(1) - 4} textAnchor="start" fontSize={9} fill="var(--faint)">cum. fraction</text>
      {/* few trees (rises early) */}
      <polyline points={mgCurve(0.55)} fill="none" stroke="var(--muted)" strokeWidth={1.6} strokeDasharray="4 3" />
      {/* many trees (rises late = more high margins) */}
      <polyline points={mgCurve(2.6)} fill="none" stroke="var(--c-trees)" strokeWidth={2} />
      <text x={mgx(0.30)} y={mgy(0.80) - 4} fontSize={9} fill="var(--muted)">few trees</text>
      <text x={mgx(0.62)} y={mgy(0.30) + 2} fontSize={9} fill="var(--c-trees)">many trees</text>
    </svg>
  );
}

const ul: React.CSSProperties = { margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
