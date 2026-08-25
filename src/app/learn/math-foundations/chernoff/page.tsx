import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Chernoff bounds — Manifold",
  description:
    "The Chernoff method is the general recipe behind every exponential tail bound: apply Markov to the exponential-transformed variable and optimize. For sums of independent indicators it gives razor-sharp guarantees.",
};

const AMBER = "var(--c-fundamentals)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function ChernoffPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Concentration inequalities", color: AMBER }, { label: "Tier 3 · theory", color: "var(--c-metrics)" }]}
        time="about 6 minutes"
        title={<>Chernoff bounds</>}
        intro={<>Hoeffding was one instance of a general recipe. That recipe — the Chernoff method — is worth isolating,
          because it&rsquo;s how essentially <em>every</em> exponential concentration bound is derived, and it gives
          especially tight results for sums of independent 0/1 events.</>}
      />

      <div className="lesson">
        <h2>The recipe</h2>
        <p>
          The trick is deceptively small. To bound <M>{String.raw`P(X \ge a)`}</M>, don&rsquo;t apply Markov to{" "}
          <M>X</M> — apply it to <M>{String.raw`e^{tX}`}</M>, which is non-negative for any <M>t</M>:
        </p>
        <MathBlock>{String.raw`P(X \ge a) = P\big(e^{tX} \ge e^{ta}\big) \le \frac{\mathbb E[e^{tX}]}{e^{ta}} = \frac{M_X(t)}{e^{ta}}.`}</MathBlock>
        <p>
          The exponential turns a big deviation into an <em>enormous</em> one, so Markov bites much harder. Now this
          holds for <em>every</em> <M>{String.raw`t > 0`}</M>, so take the best (smallest) bound by optimising over{" "}
          <M>t</M>:
        </p>
        <MathBlock>{String.raw`P(X \ge a) \le \min_{t > 0}\; \frac{M_X(t)}{e^{ta}}.`}</MathBlock>
        <p>
          That&rsquo;s the <strong>Chernoff bound</strong>. It leans entirely on the{" "}
          <Link href="/learn/math-foundations/mgf" style={link}>moment-generating function</Link>, which is why the MGF
          earned its page — and because MGFs of independent sums <em>multiply</em>, the whole thing factorises
          beautifully over a sum of independent variables.
        </p>

        <h2>The classic case: sums of coin flips</h2>
        <p>
          For a sum <M>X</M> of <M>n</M> independent 0/1 variables with mean <M>{String.raw`\mu`}</M>, optimising the
          recipe gives the textbook Chernoff bound on the upper tail:
        </p>
        <MathBlock>{String.raw`P\big(X \ge (1+\delta)\mu\big) \le \left(\frac{e^{\delta}}{(1+\delta)^{1+\delta}}\right)^{\!\mu} \le e^{-\mu\delta^2/3}.`}</MathBlock>
        <p>
          The probability of exceeding the mean by a factor decays <em>exponentially</em> in the mean itself. This is
          why, when you flip a fair coin a million times, seeing even slightly more than 51% heads is astronomically
          unlikely — the sharp concentration that makes randomised algorithms and large-scale sampling reliable.
        </p>

        <h2>Where you meet it</h2>
        <ul style={{ margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 }}>
          <li><strong>Randomised algorithms.</strong> &ldquo;Repeat <M>k</M> times and take the majority&rdquo; works because the error probability shrinks exponentially in <M>k</M> — a Chernoff bound.</li>
          <li><strong>Bandits &amp; RL.</strong> Upper-confidence-bound (UCB) exploration uses Chernoff/Hoeffding intervals to decide which arm is plausibly best.</li>
          <li><strong>Hashing &amp; load balancing.</strong> &ldquo;No bucket overflows&rdquo; guarantees are Chernoff bounds on sums of indicators.</li>
        </ul>

        <Callout color={AMBER} title={<>The mental model</>}>
          Markov uses the mean; Chebyshev adds the variance; Chernoff uses the <em>whole</em> MGF — every moment at
          once — and pays for it with an exponential reward. More assumptions (boundedness, independence) buy sharper
          bounds. That ladder — mean → variance → MGF — is the entire theory of concentration in one sentence.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/math-foundations/hoeffding", label: <>← Hoeffding&rsquo;s inequality</> }}
          next={{ href: "/learn/math-foundations/azuma-mcdiarmid", label: <>Next up · Azuma &amp; McDiarmid →</> }}
        />
      </div>
    </article>
  );
}
