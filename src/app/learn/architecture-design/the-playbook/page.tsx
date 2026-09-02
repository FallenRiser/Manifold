import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "The architecture playbook — Manifold",
  description:
    "The whole track as one cross-linked checklist: width before depth, measure the plateau, respect the depth tax, spend the budget wide, add skips when deep, diagnose with the gap.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function ThePlaybookPage() {
  return (
    <article>
      <LessonHeader
        chips={[
          { label: "Putting it together", color: CORAL },
          { label: "Tier 2 · practitioner", color: CORAL },
        ]}
        time="about 8 minutes"
        title={<>The architecture playbook</>}
        intro={
          <>
            Everything in this track reduces to a short, ordered checklist. This page is that
            checklist — each item is a rule the track measured, linked back to the page that earned
            it. Read it as the procedure you run whenever you face the question &ldquo;how many
            layers, how many neurons?&rdquo;
          </>
        }
      />

      <div className="lesson">
        <h2>The playbook</h2>
        <ol style={{ lineHeight: 1.8 }}>
          <li>
            <strong>Start from a sensible default.</strong> For tabular data: 2&ndash;3 layers, width
            64&ndash;256, ReLU/GELU, He init, Adam at 1e-3. The default is a prior that puts you near
            the answer before you search (
            <Link href="/learn/architecture-design/sensible-defaults" style={link}>sensible starting
            points</Link>).
          </li>
          <li>
            <strong>Make it overfit a small sample first.</strong> Confirm the model can drive
            training accuracy to nearly 1.0 on a few dozen examples. Success proves capacity and rules
            out bugs; failure points upstream (
            <Link href="/learn/architecture-design/the-order-of-operations" style={link}>the order of
            operations</Link>).
          </li>
          <li>
            <strong>Width before depth.</strong> Scale width first to kill underfitting — it adds no
            new gradient bottleneck and its cost is local and predictable (
            <Link href="/learn/architecture-design/what-width-buys" style={link}>what width
            buys</Link>).
          </li>
          <li>
            <strong>Measure the plateau, then stop widening.</strong> Width&rsquo;s returns die
            quickly: 16 &rarr; 512 buys only +0.004 test accuracy. A couple of doublings finds the
            plateau (
            <Link href="/learn/architecture-design/the-width-plateau" style={link}>the width
            plateau</Link>).
          </li>
          <li>
            <strong>Add depth only for hierarchy, and respect the depth tax.</strong> Depth buys
            composition, which only helps if the problem has features-of-features. On a flat problem
            it hurts: depth 20 at width 16 fell to 0.750 despite healthy gradients (
            <Link href="/learn/architecture-design/the-depth-tax" style={link}>the depth tax</Link>,{" "}
            <Link href="/learn/architecture-design/when-depth-hurts" style={link}>when depth
            hurts</Link>).
          </li>
          <li>
            <strong>Spend the budget wide.</strong> At equal parameters, wide-shallow beats
            deep-narrow on this problem: 1&times;333 gives 0.953, 8&times;10 gives 0.944 (
            <Link href="/learn/architecture-design/wide-vs-deep" style={link}>wide-shallow vs
            deep-narrow</Link>). The width schedule barely matters — funnel, constant, and inverted
            all landed within 0.002 (
            <Link href="/learn/architecture-design/width-schedules" style={link}>funnel, constant, or
            inverted?</Link>).
          </li>
          <li>
            <strong>Add skip connections when you must go deep.</strong> If the problem genuinely
            needs depth, residual connections keep the gradient path open and the optimisation
            tractable (
            <Link href="/learn/architecture-design/skip-connections" style={link}>skip
            connections</Link>,{" "}
            <Link href="/learn/architecture-design/why-skip-works" style={link}>why F(x) + x changes
            everything</Link>).
          </li>
          <li>
            <strong>Diagnose with the gap, regularise only if it is real.</strong> Read the regime
            from train vs test (
            <Link href="/learn/architecture-design/underfit-fit-overfit" style={link}>underfit, fit,
            overfit</Link>). Regularise only a genuine gap — on this clean problem, L2 moved a
            3&times;128 net&rsquo;s gap from 0.015 to 0.016, i.e. nothing.
          </li>
        </ol>

        <MathBlock>{String.raw`\text{default} \to \text{overfit small} \to \text{width} \to \text{depth (if hierarchy)} \to \text{skips (if deep)} \to \text{regularise (if gap)}`}</MathBlock>

        <Callout color={CORAL} title={<>The headline numbers, in one place</>}>
          <ul style={{ margin: 0, lineHeight: 1.7 }}>
            <li><strong>0.953</strong> — best test accuracy, at depth 2 width 32, just 1,185 parameters.</li>
            <li><strong>25&times; the parameters, less accuracy</strong> — depth 8 width 64 spends far more and scores below the small optimum; capacity past the plateau is pure overhead.</li>
            <li><strong>0.750</strong> — depth 20 width 16, an optimisation failure with healthy gradient ratios: depth is taxed even when the gradients look fine.</li>
            <li><strong>+0.004</strong> — the entire payoff of widening 16 &rarr; 512. The plateau is cheap to reach and cheap to leave.</li>
          </ul>
        </Callout>

        <Proof color={CORAL} title="why the search is short">
          <p>
            The playbook looks like many steps, but the space it searches is tiny, because capacity
            acts on a logarithmic scale. Width and depth matter by order of magnitude: the
            track&rsquo;s width sweep showed everything from 16 to 512 within 0.004 of each other, so
            the meaningful choices are a few doublings (64, 128, 256), not 500 integers. Depth is
            similar — the useful range on a tabular problem is 2 to 4, and beyond that the tax
            dominates.
          </p>
          <p>
            A default drops you inside that small grid, the small-sample overfit test rules out an
            entire failure class in seconds, and the width plateau tells you when to stop after one or
            two doublings. What remains is a handful of experiments, each changing one thing, each
            interpretable. The reason architecture search feels tractable in practice is that the
            logarithmic scale collapses an apparently vast space into a short, ordered walk.
          </p>
        </Proof>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>The playbook puts &ldquo;width before depth.&rdquo; Which pair of measured results
                justifies that ordering?</>,
              options: [
                "Depth 2 scores 0.953; depth 3 scores 0.944",
                "Width's plateau is cheap to find (16 → 512 buys only +0.004 and adds no gradient bottleneck), while depth is taxed — depth 20 at width 16 fell to 0.750 with healthy gradients",
                "Width and depth are interchangeable, so order does not matter",
              ],
              answer: 1,
              explain: <>Width is the safe, cheap knob: its returns plateau in a couple of doublings
                and it never destabilises training. Depth carries the depth tax, which can appear even
                when the gradient ratios look fine, so it comes second and more cautiously.</>,
            },
            {
              q: <>Why does the playbook say to spend a fixed parameter budget wide rather than deep?</>,
              options: [
                "Wide networks are always more accurate than deep ones on every problem",
                "At equal budget on this problem, wide-shallow (1×333 → 0.953) beat deep-narrow (8×10 → 0.944), and the width schedule barely mattered (within 0.002)",
                "Deep-narrow networks cannot be trained with Adam",
              ],
              answer: 1,
              explain: <>On this problem the same budget spent wide reached 0.953 while spent
                deep-narrow reached 0.944, and funnel/constant/inverted schedules were all within
                0.002. Depth-narrow pays the depth tax without a compositional payoff here, so wide
                wins at equal cost.</>,
            },
            {
              q: <>The playbook has eight steps yet claims the search is short. Why?</>,
              options: [
                "Because most steps can be skipped entirely",
                "Because capacity acts on a log scale, so the meaningful choices are a few doublings, and defaults plus the small-sample test collapse the space into a handful of one-change experiments",
                "Because the optimiser finds the architecture automatically",
              ],
              answer: 1,
              explain: <>Width and depth matter by order of magnitude, so the real search is a few
                doublings, not hundreds of integers. A default lands you inside that small grid and the
                overfit-small test rules out a failure class immediately, leaving only a short,
                interpretable walk.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/architecture-design/sensible-defaults", label: <>&larr; Sensible starting points</> }}
          next={{ href: "/learn/architecture-design/when-its-not-architecture", label: <>Next up &middot; When the architecture is not the problem &rarr;</> }}
        />
      </div>
    </article>
  );
}
