import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";

export const metadata = {
  title: "Strength & correlation: Breiman's bound — Manifold",
  description:
    "Breiman's 2001 generalization bound for random forests: error ≤ ρ̄(1−s²)/s². It says a forest wins by making its trees strong (accurate) and uncorrelated (diverse) — the theoretical home of the max_features trade-off.",
};

const TREES = "var(--c-trees)";
const GREY = "var(--c-metrics)";

export default function StrengthCorrelationPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Trees & ensembles", color: TREES }, { label: "Tier 3 · theory", color: GREY }]}
        time="about 8 minutes"
        title={<>Strength &amp; correlation: Breiman&rsquo;s bound</>}
        intro={<>
          The <Link href="/learn/random-forests/why-averaging-works" style={link}>variance formula</Link> told
          you correlation sets a floor. Breiman&rsquo;s 2001 theorem makes the whole story rigorous for
          classification, in a single inequality that names exactly the two things a forest must balance.
        </>}
      />

      <div className="lesson">
        <h2>Two quantities: strength and correlation</h2>
        <p>
          Breiman defined a forest&rsquo;s behaviour through the <strong>margin</strong> — how much more vote a
          point&rsquo;s true class gets than the best wrong class. From it come two numbers:
        </p>
        <ul style={ul}>
          <li><strong>Strength <M>{String.raw`s`}</M></strong> — the expected margin. High strength means the
            individual trees are <em>accurate</em>: on average they vote the right class with room to spare.</li>
          <li><strong>Mean correlation <M>{String.raw`\bar{\rho}`}</M></strong> — the average correlation
            between the trees&rsquo; margin functions. Low correlation means the trees are <em>diverse</em>:
            they make their mistakes in different places.</li>
        </ul>

        <h2>The bound</h2>
        <p>
          Breiman proved that a random forest&rsquo;s generalization error <M>{String.raw`PE^*`}</M> is bounded
          by these two quantities alone:
        </p>
        <MathBlock>{String.raw`PE^* \;\le\; \frac{\bar{\rho}\,(1 - s^2)}{s^2}`}</MathBlock>
        <p>
          Read it as a design brief. To make the bound small you want the numerator small and the denominator
          large — that is, <strong>low correlation <M>{String.raw`\bar\rho`}</M> and high strength <M>{String.raw`s`}</M></strong>.
          A forest generalises well when its trees are individually strong <em>and</em> collectively diverse.
          Neither alone is enough: a forest of identical experts (<M>{String.raw`\bar\rho = 1`}</M>) is no better
          than one expert, and a forest of diverse-but-hopeless trees (<M>{String.raw`s \to 0`}</M>) sends the
          bound to infinity.
        </p>

        <Callout color={TREES} title={<>This is the max_features trade-off, formalised</>}>
          Everything the <Link href="/learn/random-forests/decorrelating-the-trees" style={link}>decorrelation
          lab</Link> showed now has a home. Shrinking <code>max_features</code> lowers <M>{String.raw`\bar\rho`}</M>
          (good — trees diverge) but <em>also</em> lowers <M>{String.raw`s`}</M> (bad — each split is more
          restricted, so trees get weaker). The bound <M>{String.raw`\bar\rho(1-s^2)/s^2`}</M> is minimised at
          an intermediate <M>{String.raw`m`}</M> — which is exactly why accuracy peaked in the middle and why{" "}
          <M>{String.raw`\sqrt{p}`}</M> is a sensible default. The empirical curve you dragged is this
          inequality being optimised.
        </Callout>

        <h2>What the bound does and doesn&rsquo;t give you</h2>
        <ul style={ul}>
          <li><strong>It converges.</strong> A companion result: as you add trees, a random forest&rsquo;s error
            converges almost surely to a fixed limit — it does <em>not</em> overfit by adding trees. More trees
            never hurt generalisation (only compute). This is the theoretical version of the accuracy plateau
            you saw on the <Link href="/learn/random-forests" style={link}>opening lab</Link>.</li>
          <li><strong>It&rsquo;s loose.</strong> The numerical value of the bound is usually far above the real
            error — don&rsquo;t use it to predict accuracy. Its worth is <em>structural</em>: it proves that
            strength and correlation are the two levers, and that they trade off.</li>
          <li><strong>It explains the whole design.</strong> Bootstraps and random features exist to push{" "}
            <M>{String.raw`\bar\rho`}</M> down; growing trees deep (not stumps) keeps <M>{String.raw`s`}</M> up.
            Every choice in the algorithm serves one side of this ratio.</li>
        </ul>

        <p>
          So the intuition you built — &ldquo;strong but diverse trees&rdquo; — isn&rsquo;t a slogan. It&rsquo;s
          the literal content of the theorem that put random forests on firm ground.
        </p>

        <PrevNext
          prev={{ href: "/learn/random-forests/why-averaging-works", label: <>← Why averaging works</> }}
          next={{ href: "/learn/random-forests/limits-of-forests", label: <>Next up · Bias & the limits of forests →</> }}
        />
      </div>
    </article>
  );
}

const ul: React.CSSProperties = { margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
