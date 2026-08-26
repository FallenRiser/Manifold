import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext, Proof } from "@/components/lesson";

export const metadata = {
  title: "Margin-based bounds — Manifold",
  description:
    "A generalization bound that trades training mistakes against confidence: count how many points fail to clear a margin, then pay a capacity term that shrinks as that margin grows. It's the first bound where you choose the trade-off after seeing your data.",
};

const GRAY = "var(--c-metrics)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function MarginBoundsPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Margins", color: GRAY }, { label: "Tier 3 · theory", color: GRAY }]}
        time="about 8 minutes"
        title={<>Margin-based bounds</>}
        intro={<>The bound that finally distinguishes a confident classifier from a lucky one — and the first one
          whose trade-off you get to tune after the fact, by choosing the yardstick you measure yourself against.</>}
      />

      <div className="lesson">
        <h2>Counting near-misses instead of misses</h2>
        <p>
          Ordinary 0/1 loss asks a single yes/no question: was the point on the right side? A margin-based analysis
          asks a stricter one: was it on the right side <em>by at least <M>{String.raw`\rho`}</M></em>? Define the{" "}
          <strong>empirical margin loss</strong> at scale <M>{String.raw`\rho`}</M>:
        </p>
        <MathBlock>{String.raw`\hat R_\rho(h) \;=\; \frac{1}{n}\sum_{i=1}^{n} \mathbb 1\big[\, y_i\, h(x_i) < \rho \,\big]`}</MathBlock>
        <p>
          This counts genuine mistakes <em>and</em> correct-but-nervous predictions — anything inside the corridor.
          Note it is always at least the ordinary training error, and grows as you demand a wider corridor.
        </p>

        <h2>The bound</h2>
        <p>
          With probability at least <M>{String.raw`1-\delta`}</M>, for every <M>h</M> in a class of real-valued
          functions with Rademacher complexity <M>{String.raw`\mathfrak R_n`}</M>:
        </p>
        <MathBlock>{String.raw`R(h) \;\le\; \hat R_\rho(h) \;+\; \frac{2}{\rho}\,\mathfrak R_n(\mathcal H) \;+\; \sqrt{\frac{\ln(1/\delta)}{2n}}`}</MathBlock>
        <p>
          Everything interesting is in the interplay of the first two terms, and they pull in opposite directions
          as you vary <M>{String.raw`\rho`}</M>:
        </p>
        <ul>
          <li>
            <strong>Raise <M>{String.raw`\rho`}</M></strong> and the capacity term{" "}
            <M>{String.raw`2\mathfrak R_n/\rho`}</M> shrinks — demanding confidence restricts you to a smaller
            effective class, so you are charged less for having searched it.
          </li>
          <li>
            <strong>But raising <M>{String.raw`\rho`}</M></strong> also raises{" "}
            <M>{String.raw`\hat R_\rho(h)`}</M>, because more points fail to clear the higher bar.
          </li>
        </ul>
        <p>
          So there is an optimum, and — this is the part with no precedent in the earlier chapters — it depends on
          your data. A classifier that separates the classes cleanly with room to spare can pick a large{" "}
          <M>{String.raw`\rho`}</M>, keep <M>{String.raw`\hat R_\rho`}</M> at zero, and collect a small capacity
          term. A classifier that only just squeaks past every point must take <M>{String.raw`\rho`}</M> small and
          pay dearly. <strong>Two models in the same class, with the same training error, now receive genuinely
          different guarantees.</strong> That is exactly the blind spot the previous page identified, closed.
        </p>

        <Proof title="why 1/ρ appears, via the Lipschitz contraction of the ramp" color={GRAY}>
          <p>
            The <M>{String.raw`1/\rho`}</M> is not cosmetic, and tracing it is worth doing because it shows why the
            proof needs a <em>surrogate</em> at all.
          </p>
          <p>
            <strong>The problem.</strong> We would like to apply the Rademacher bound directly to the 0/1 loss
            composed with our class. But 0/1 loss is a step function — not Lipschitz, not continuous — and the
            contraction lemma that makes Rademacher analysis work requires a Lipschitz function.
          </p>
          <p>
            <strong>The fix: the ramp.</strong> Introduce a piecewise-linear surrogate{" "}
            <M>{String.raw`\Phi_\rho`}</M> that equals 1 below 0, decreases linearly to 0 across{" "}
            <M>{String.raw`[0, \rho]`}</M>, and stays 0 above:
          </p>
          <MathBlock>{String.raw`\mathbb 1[u < 0] \;\le\; \Phi_\rho(u) \;=\; \min\!\Big(1, \max\big(0, 1 - \tfrac{u}{\rho}\big)\Big) \;\le\; \mathbb 1[u < \rho].`}</MathBlock>
          <p>
            The two inequalities are the sandwich that makes everything work: the ramp upper-bounds the true 0/1
            loss (so bounding it bounds the risk) and is itself upper-bounded by the empirical margin loss (so the
            quantity we can measure controls it).
          </p>
          <p>
            <strong>Where <M>{String.raw`1/\rho`}</M> comes from.</strong> The ramp descends from 1 to 0 over an
            interval of width <M>{String.raw`\rho`}</M>, so its slope is <M>{String.raw`1/\rho`}</M> and it is{" "}
            <M>{String.raw`(1/\rho)`}</M>-Lipschitz. <strong>Talagrand&rsquo;s contraction lemma</strong> states
            that composing an <M>L</M>-Lipschitz function with a class multiplies its Rademacher complexity by at
            most <M>L</M>:
          </p>
          <MathBlock>{String.raw`\mathfrak R_n(\Phi_\rho \circ \mathcal H) \;\le\; \frac{1}{\rho}\,\mathfrak R_n(\mathcal H).`}</MathBlock>
          <p>
            Feed that into the standard Rademacher bound, whose leading factor is 2, and the margin bound drops
            out. So the <M>{String.raw`1/\rho`}</M> is <em>the slope of the ramp</em> — a small margin forces a
            steep surrogate, a steep surrogate is highly sensitive to its input, and high sensitivity means the
            class can chase noise through it. <strong>Steepness is capacity.</strong>
          </p>
          <p>
            One honest note on rigour: as stated, the bound holds for a <em>fixed</em> <M>{String.raw`\rho`}</M>{" "}
            chosen before seeing the data. To choose <M>{String.raw`\rho`}</M> afterwards — which is what makes the
            bound useful — you need a union bound over a grid of scales, costing an extra{" "}
            <M>{String.raw`\sqrt{\ln\ln(1/\rho)/n}`}</M> term. It is small, and it is routinely omitted in
            summaries; we mention it because a bound you are allowed to tune after the fact should make you
            suspicious, and here the suspicion has a specific, payable price.
          </p>
        </Proof>

        <h2>What this licenses</h2>
        <p>
          Three practices you already follow get a theoretical footing here, and it&rsquo;s worth naming them
          because they are otherwise folklore.
        </p>
        <ul>
          <li>
            <strong>Prefer confident classifiers when training error ties.</strong> Not aesthetics — a strictly
            better bound.
          </li>
          <li>
            <strong>Dimension stops being the enemy.</strong> The bound never mentions <M>d</M>. High-dimensional
            feature spaces are fine provided your solution is confident in them, which is why kernel methods and
            wide models aren&rsquo;t automatically doomed.
          </li>
          <li>
            <strong>Trade a few mistakes for a lot of confidence.</strong> Accepting some margin violations to
            widen the corridor can lower the bound overall — precisely what the soft-margin{" "}
            <Link href="/learn/support-vector-regression/soft-margin-c-and-slack" style={link}>C parameter</Link>{" "}
            negotiates, with <M>C</M> as the exchange rate.
          </li>
        </ul>

        <Callout color={GRAY} title={<>Still not a number you'd report</>}>
          Margin bounds are meaningfully tighter than VC bounds and remain, for most deployed models, too loose to
          quote. Their value is the same as before — they identify the right <em>quantity</em>. The reason margins
          earned their reputation is not the constant in the bound; it&rsquo;s that they predicted a real, visible,
          repeatedly-observed phenomenon that every other theory got wrong. That&rsquo;s the next page.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/learning-theory/margins", label: <>← The margin, and why it buys confidence</> }}
          next={{ href: "/learn/learning-theory/boosting-and-margins", label: <>Next up · Why boosting doesn&rsquo;t overfit (usually) →</> }}
        />
      </div>
    </article>
  );
}
