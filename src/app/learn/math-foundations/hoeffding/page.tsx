import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Hoeffding's inequality — Manifold",
  description:
    "Hoeffding's inequality gives an exponentially small bound on how far an average of bounded variables can stray from its mean. It's the single most-used tool in generalization theory — the reason a validation score is trustworthy.",
};

const AMBER = "var(--c-fundamentals)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function HoeffdingPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Concentration inequalities", color: AMBER }, { label: "Tier 3 · theory", color: "var(--c-metrics)" }]}
        time="about 6 minutes"
        title={<>Hoeffding&rsquo;s inequality</>}
        intro={<>Chebyshev&rsquo;s bound decays only like <M>{String.raw`1/n`}</M>. If your variables are{" "}
          <em>bounded</em>, you can do dramatically better: Hoeffding&rsquo;s inequality shrinks the failure
          probability <em>exponentially</em> in <M>n</M>. It&rsquo;s the workhorse behind generalization guarantees.</>}
      />

      <div className="lesson">
        <h2>The statement</h2>
        <p>
          Let <M>{String.raw`X_1, \dots, X_n`}</M> be independent, each bounded in <M>{String.raw`[a_i, b_i]`}</M>,
          with sample mean <M>{String.raw`\bar X`}</M>. Then the chance the average deviates from its expectation by
          more than <M>{String.raw`\varepsilon`}</M> is exponentially small:
        </p>
        <MathBlock>{String.raw`P\big(|\bar X - \mathbb E[\bar X]| \ge \varepsilon\big) \le 2\exp\!\left(-\frac{2n^2\varepsilon^2}{\sum_i (b_i - a_i)^2}\right).`}</MathBlock>
        <p>
          For variables all in <M>{String.raw`[0,1]`}</M> this simplifies to{" "}
          <M>{String.raw`2\exp(-2n\varepsilon^2)`}</M>. Compare that to Chebyshev&rsquo;s <M>{String.raw`1/(n\varepsilon^2)`}</M>:
          same <M>{String.raw`\varepsilon^2`}</M>, but <em>exponential</em> in <M>n</M> instead of merely
          reciprocal. The failure probability collapses far faster.
        </p>

        <h2>Where it comes from</h2>
        <p>
          Hoeffding is the <Link href="/learn/math-foundations/mgf" style={link}>Chernoff method</Link> in action:
          apply Markov to <M>{String.raw`e^{t\bar X}`}</M>, bound the MGF of each bounded term (Hoeffding&rsquo;s
          lemma), and optimise over <M>t</M>. Boundedness is what makes the MGF controllable — the price you pay for
          the exponential reward. Everything in this chapter is that one template with different assumptions.
        </p>

        <h2>Why ML can&rsquo;t live without it</h2>
        <p>
          Think of each <M>{String.raw`X_i`}</M> as &ldquo;did the model get example <M>i</M> right?&rdquo; — a
          bounded 0/1 variable. Then <M>{String.raw`\bar X`}</M> is the <strong>test accuracy</strong> and{" "}
          <M>{String.raw`\mathbb E[\bar X]`}</M> is the <strong>true accuracy</strong> on the whole distribution.
          Hoeffding says:
        </p>
        <MathBlock>{String.raw`P\big(|\text{test accuracy} - \text{true accuracy}| \ge \varepsilon\big) \le 2e^{-2n\varepsilon^2}.`}</MathBlock>
        <p>
          So a test set of a few thousand points pins the true accuracy to within a percent or two with overwhelming
          confidence — the formal reason a held-out score means something. Invert it and you get the sample size
          needed for a target confidence, the basis of A/B-test and evaluation-set sizing.
        </p>

        <Callout color={AMBER} title={<>The one caveat, and the fix</>}>
          Hoeffding assumes the <M>{String.raw`X_i`}</M> are independent and you fixed the hypothesis <em>before</em>
          looking at the data. Evaluate <em>many</em> models on the same test set and you&rsquo;re effectively taking
          the max over many averages — the bound must be widened by a <strong>union
          bound</strong> over the hypotheses. Ignoring that is exactly how people fool themselves by tuning on the test
          set. Uniform-convergence bounds (VC dimension, Rademacher complexity) are the principled repair.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/math-foundations/markov-chebyshev", label: <>← Markov &amp; Chebyshev</> }}
          next={{ href: "/learn/math-foundations/chernoff", label: <>Next up · Chernoff bounds →</> }}
        />
      </div>
    </article>
  );
}
