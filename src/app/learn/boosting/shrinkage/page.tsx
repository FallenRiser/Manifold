import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeOutput } from "@/components/CodeOutput";

export const metadata = {
  title: "The learning rate & shrinkage — Manifold",
  description:
    "Shrinkage — multiplying every tree by a small learning rate — is the single most important regularizer in gradient boosting. Small steps and many trees generalise better than big steps and few; the learning rate and the tree count trade off directly.",
};

const TREES = "var(--c-trees)";

export default function ShrinkagePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Trees & ensembles", color: TREES }, { label: "Tier 2 · practitioner", color: "var(--c-fundamentals)" }]}
        time="about 7 minutes"
        title={<>The learning rate &amp; shrinkage</>}
        intro={<>
          A forest has essentially one knob (how many trees) and cannot overfit by turning it up. Boosting has
          several, and it <em>can</em>. The most important is the <strong>learning rate</strong> — and, unlike a
          forest&rsquo;s tree count, getting it wrong genuinely costs you accuracy.
        </>}
      />

      <div className="lesson">
        <h2>What shrinkage does</h2>
        <p>
          Every update is scaled by a learning rate <M>{String.raw`\nu \in (0,1]`}</M>:
        </p>
        <MathBlock>{String.raw`F_m(x) = F_{m-1}(x) + \nu\, h_m(x)`}</MathBlock>
        <p>
          With <M>{String.raw`\nu = 1`}</M> each tree is added at full strength and the model lurches toward the
          training data — it fits fast and overshoots, letting a few early trees dominate. With{" "}
          <M>{String.raw`\nu = 0.1`}</M> each tree contributes only a tenth of its correction, so no single tree
          can commandeer the model; progress is slow, steady, and far less prone to chasing noise. Shrinkage is a{" "}
          <strong> deliberate under-correction at every step</strong>, and it is the closest thing boosting has to
          a master regularizer.
        </p>

        <h2>The rate–trees trade-off, measured</h2>
        <p>California housing again, varying the learning rate and tree count together:</p>
        <CodeOutput label="test R² — learning rate vs number of trees">{`  lr = 1.00   300 trees    R²  0.776    <- too greedy, overshoots
  lr = 0.30   300 trees    R²  0.829
  lr = 0.10   300 trees    R²  0.815
  lr = 0.05   600 trees    R²  0.816
  lr = 0.01  3000 trees    R²  0.815`}</CodeOutput>
        <p>
          The full-strength model (<M>{String.raw`\nu=1`}</M>) is clearly the <em>worst</em> at 0.776 — with no
          shrinkage the early trees overfit and later ones cannot undo it. Every shrunk model beats it. And notice
          the bottom three rows: as you cut the learning rate you must add proportionally more trees to reach the
          same place, and they all land around <strong>0.815–0.816</strong>. That is the fundamental trade:
        </p>
        <MathBlock>{String.raw`\text{lower } \nu \;\Longleftrightarrow\; \text{more trees } M \qquad (\nu \times M \approx \text{const, roughly})`}</MathBlock>

        <Callout color={TREES} title={<>The standard recipe</>}>
          <strong>Set the learning rate as low as your compute budget allows, then add trees until a validation
          score stops improving.</strong> A small <M>{String.raw`\nu`}</M> (0.01–0.1) with{" "}
          <Link href="/learn/boosting/early-stopping" style={link}>early stopping</Link> choosing{" "}
          <M>{String.raw`M`}</M> is the safest, most reliable configuration in all of gradient boosting. The only
          cost of going lower is training time — half the learning rate, twice the trees, twice the wait.
        </Callout>

        <h2>Why smaller steps generalise better</h2>
        <p>
          Two complementary intuitions. <strong>Statistically</strong>, shrinkage keeps any one tree from
          dominating, so the final model is a broad consensus of many small corrections rather than a few large
          ones — lower variance, much as averaging gives a forest. <strong>Geometrically</strong>, gradient
          boosting is descent in function space; a large <M>{String.raw`\nu`}</M> is a large step that can
          overshoot the loss valley and zig-zag, while small steps trace a smoother path that generalises to
          unseen data. Friedman&rsquo;s original 2001 paper already reported that <M>{String.raw`\nu < 0.1`}</M>{" "}
          reliably improved test error, and two decades of practice have only confirmed it.
        </p>

        <h2>The one caveat: it interacts with everything</h2>
        <p>
          Learning rate does not live alone. Lower it and you need more trees; deepen the trees and you may need
          to lower it again to avoid overfitting; add <Link href="/learn/boosting/stochastic" style={link}>row
          subsampling</Link> and the ideal rate shifts once more. This is why boosting is <em>tuned</em> and a
          forest is mostly not — its knobs are coupled. The good news is that the coupling has a dominant
          direction: fix a small learning rate first, and the rest of the tuning becomes far better behaved.
        </p>

        <PrevNext
          prev={{ href: "/learn/boosting/gbm-classification", label: <>← Gradient boosting for classification</> }}
          next={{ href: "/learn/boosting/stochastic", label: <>Next up · Stochastic gradient boosting →</> }}
        />
      </div>
    </article>
  );
}

const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
