import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "Xavier vs He, measured — Manifold",
  description:
    "The head-to-head: six rows of gradient ratios and activation variances across sigmoid, tanh, and ReLU. The honest takeaway — the init only matters once the activation is non-saturating.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function XavierVsHePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "The named initialisations", color: CORAL }, { label: "Tier 2 · practitioner", color: CORAL }]}
        time="about 7 minutes"
        title={<>Xavier vs He, measured</>}
        intro={<>You have the two formulas and the arguments behind them. Now put them head to head on
          the same network and read the numbers. The measurement tells a more honest story than either
          derivation on its own: the initialisation barely matters until the activation stops
          saturating — and only then does matching the init to the activation start to pay.</>}
      />

      <div className="lesson">
        <h2>The six-way grid</h2>
        <p>
          One network — 10 layers, width 64 — initialised six ways: each of the three activations
          (sigmoid, <M>{String.raw`\tanh`}</M>, ReLU) paired with each of the two initialisations
          (Xavier, He). For each pairing we measure two things at initialisation: the gradient ratio
          (last-layer gradient norm divided by first-layer gradient norm — near one is balanced, huge
          is a vanishing/exploding signal), and the activation variance at layers 5 and 10 (should stay
          steady, not decay to zero).
        </p>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 480 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>activation</th>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>init</th>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>grad ratio</th>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>act var L5</th>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>act var L10</th>
              </tr>
            </thead>
            <tbody>
              {([
                { act: "sigmoid", init: "Xavier", ratio: "3,727,759", v5: "---", v10: "---", tone: "bad" },
                { act: "sigmoid", init: "He", ratio: "351,256", v5: "---", v10: "---", tone: "bad" },
                { act: "tanh", init: "Xavier", ratio: "5.45", v5: "---", v10: "---", tone: "ok" },
                { act: "tanh", init: "He", ratio: "8.12", v5: "---", v10: "---", tone: "ok" },
                { act: "relu", init: "Xavier", ratio: "2.23", v5: "0.0216", v10: "0.0008", tone: "ok" },
                { act: "relu", init: "He", ratio: "7.58", v5: "0.6910", v10: "0.7988", tone: "good" },
              ] as const).map((r, i) => (
                <tr key={i}>
                  <td style={{ padding: "6px 18px 6px 0", color: "var(--ink)", fontWeight: 500, borderBottom: "1px solid var(--border)" }}>{r.act}</td>
                  <td style={{ padding: "6px 18px 6px 0", color: "var(--ink)", borderBottom: "1px solid var(--border)" }}>{r.init}</td>
                  <td style={{ padding: "6px 18px 6px 0", color: r.tone === "bad" ? "var(--bad)" : r.tone === "good" ? "var(--good)" : "var(--ink)", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>{r.ratio}</td>
                  <td style={{ padding: "6px 18px 6px 0", color: r.tone === "good" ? "var(--good)" : "var(--muted)", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>{r.v5}</td>
                  <td style={{ padding: "6px 18px 6px 0", color: r.tone === "good" ? "var(--good)" : "var(--muted)", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>{r.v10}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 13, color: "var(--muted)" }}>
          10 layers, width 64. Gradient ratio and activation variances measured at initialisation.
          From <code>scripts/init_norm_cases.py</code>.
        </p>

        <h2>Reading the three activations</h2>
        <p>
          <strong>Sigmoid: both inits fail.</strong> The gradient ratio is in the millions either way —
          3.7 million with Xavier, still 351 thousand with He. He is nominally &ldquo;less bad,&rdquo;
          but a ratio of 351,256 is not usable; the deepest layer&rsquo;s gradient is hundreds of
          thousands of times larger than the shallowest&rsquo;s. Neither number is close to the ratio
          near one that a healthy network shows. The initialisation is not the problem here — the
          <em>activation</em> is. Sigmoid saturates: its derivative is at most 0.25 and collapses toward
          zero away from the origin, so the chain-rule product decays no matter how you set the weights.
        </p>
        <p>
          <strong>tanh: both inits are fine.</strong> Xavier gives 5.45, He gives 8.12 — both are the
          same order of magnitude as one, both are perfectly trainable. <M>{String.raw`\tanh`}</M> is
          symmetric about zero and does not saturate near the origin, so the signal survives. Xavier is
          the natural match (it was derived for exactly this activation), but He does not break anything;
          it just injects slightly more variance than <M>{String.raw`\tanh`}</M> strictly needs.
        </p>
        <p>
          <strong>ReLU: both work, but He holds variance far better.</strong> The gradient ratios are
          both reasonable (Xavier 2.23, He 7.58). But look at the activation-variance columns, which only
          ReLU exposes here. Under Xavier the variance decays from 0.0216 at layer 5 to <strong>0.0008</strong>{" "}
          at layer 10 — the signal is quietly dying with depth. Under He it holds at{" "}
          <strong>0.80</strong>. The gradient ratio at init did not catch the Xavier decay because ten
          layers is not yet deep enough for it to blow up the ratio, but the variance trend shows the
          rot setting in. Make the network deeper and Xavier+ReLU is the pairing that stalls first.
        </p>

        <Callout color={CORAL} title={<>The init only matters once the activation is non-saturating</>}>
          The single loudest signal in the table is the sigmoid row: millions with either
          initialisation. When the activation saturates, the weight scale is almost irrelevant — the
          derivative kills the gradient regardless. The initialisation only becomes a lever worth
          pulling once you have chosen a non-saturating activation (<M>{String.raw`\tanh`}</M>, ReLU).{" "}
          <em>Then</em> the rule is simple: match the init to the activation — Xavier with{" "}
          <M>{String.raw`\tanh`}</M>, He with ReLU.
        </Callout>

        <h2>The honest takeaway</h2>
        <p>
          There is a temptation to treat &ldquo;Xavier vs He&rdquo; as the decision that makes or breaks
          a deep network. The measurement says otherwise. The first-order factor is the activation: a
          saturating activation dooms the network under any initialisation, and a non-saturating one
          rescues it under either. The initialisation is the second-order refinement — real, but only
          visible once the first-order choice is right. Choose the activation first; then match the
          initialisation to it. Xavier goes with <M>{String.raw`\tanh`}</M>, He goes with ReLU, and the
          reward for matching is the flat activation variance in the last column rather than the slow
          decay next to it.
        </p>

        <Proof color={CORAL} title="why a saturating activation makes the init nearly irrelevant">
          <p>
            The backward signal is a product of per-layer factors, and each layer contributes the
            activation&rsquo;s derivative evaluated at its pre-activation. For sigmoid,{" "}
            <M>{String.raw`\sigma'(z) = \sigma(z)(1-\sigma(z))`}</M>, which peaks at{" "}
            <M>{String.raw`0.25`}</M> when <M>{String.raw`z = 0`}</M> and falls off exponentially as{" "}
            <M>{String.raw`|z|`}</M> grows. Away from the origin the derivative is minuscule.
          </p>
          <p>
            The initialisation can only set the <em>scale</em> of the pre-activations{" "}
            <M>{String.raw`z`}</M>; it cannot change the shape of <M>{String.raw`\sigma'`}</M>. Make the
            weights small and the pre-activations cluster near zero, where the derivative is capped at
            0.25 — so a ten-layer chain multiplies at most{" "}
            <M>{String.raw`0.25^{10} \approx 10^{-6}`}</M> and the gradient vanishes. Make the weights
            larger and the pre-activations spread into the saturated tails, where the derivative is even
            smaller and the collapse is worse. Every setting of the weight scale lands the pre-activations
            somewhere on a curve whose derivative never exceeds 0.25, so no choice of initialisation
            escapes the vanishing product. That is why the sigmoid rows read in the millions regardless
            of Xavier or He: the ceiling on <M>{String.raw`\sigma'`}</M>, not the weight variance, sets
            the outcome.
          </p>
        </Proof>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>With sigmoid, the gradient ratio is 3.7 million under Xavier and 351 thousand under He.
                What is the correct reading?</>,
              options: [
                "He is clearly the right choice for sigmoid because its number is smaller",
                "Neither init works — sigmoid saturates, so the gradient collapses regardless of the weight scale; the activation is the problem, not the init",
                "The measurement is noise and should be ignored",
              ],
              answer: 1,
              explain: <>Both ratios are enormous — hundreds of thousands to millions. Sigmoid&rsquo;s
                derivative is capped at 0.25 and shrinks in the tails, so the chain-rule product vanishes
                whatever the weight scale. The initialisation cannot rescue a saturating activation.</>,
            },
            {
              q: <>For ReLU, both inits give a reasonable gradient ratio (2.23 vs 7.58), yet the
                activation variance at layer 10 is 0.0008 under Xavier and 0.80 under He. Why prefer He?</>,
              options: [
                "Because 7.58 is a better ratio than 2.23",
                "The activation variance shows Xavier+ReLU quietly decaying the signal with depth; He holds it steady, so it scales to deeper networks without stalling",
                "He uses fewer parameters",
              ],
              answer: 1,
              explain: <>Ten layers is not yet deep enough for the Xavier decay to blow up the gradient
                ratio, but the variance trend (0.0216 to 0.0008) reveals the signal dying. He&rsquo;s
                flat 0.69 to 0.80 is the factor-of-two correction working, and it is what keeps deeper
                ReLU nets trainable.</>,
            },
            {
              q: <>What is the honest one-line summary of the Xavier-vs-He comparison?</>,
              options: [
                "He is always better than Xavier",
                "The init is the single most important choice in any network",
                "The init only matters once the activation is non-saturating; then match the init to the activation (Xavier with tanh, He with ReLU)",
              ],
              answer: 2,
              explain: <>The activation is the first-order factor: saturating activations fail under any
                init, non-saturating ones succeed under either. The init is the second-order refinement,
                and the rule is to match it to the activation — Xavier for <M>{String.raw`\tanh`}</M>, He
                for ReLU.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/initialisation-and-normalisation/he", label: <>&#8592; He / Kaiming</> }}
          next={{ href: "/learn/initialisation-and-normalisation/other-schemes", label: <>Next up &middot; Other schemes &#8594;</> }}
        />
      </div>
    </article>
  );
}
