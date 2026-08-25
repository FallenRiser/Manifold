import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Markov & Chebyshev — Manifold",
  description:
    "The two simplest concentration inequalities bound how often a random variable strays far from its mean, using only the mean (Markov) or the mean and variance (Chebyshev). They're the foundation the sharper bounds build on.",
};

const AMBER = "var(--c-fundamentals)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function MarkovChebyshevPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Concentration inequalities", color: AMBER }, { label: "Tier 3 · theory", color: "var(--c-metrics)" }]}
        time="about 6 minutes"
        title={<>Markov &amp; Chebyshev</>}
        intro={<>The <Link href="/learn/math-foundations/lln-and-clt" style={link}>law of large numbers</Link> says an
          average <em>eventually</em> nears the truth. Concentration inequalities make that quantitative for a{" "}
          <em>finite</em> sample: how likely is a big deviation, right now? The two simplest — Markov and Chebyshev —
          need almost nothing to state, and everything else builds on them.</>}
      />

      <div className="lesson">
        <h2>Markov: a bound from the mean alone</h2>
        <p>
          For a <strong>non-negative</strong> random variable, Markov&rsquo;s inequality bounds the chance of being
          large using only its mean:
        </p>
        <MathBlock>{String.raw`P(X \ge a) \le \frac{\mathbb E[X]}{a}, \qquad a > 0.`}</MathBlock>
        <p>
          The intuition: if the average is small, the variable can&rsquo;t often be huge, or it would drag the average
          up. It&rsquo;s crude — it uses no information beyond the mean — but it asks almost nothing in return, and
          it&rsquo;s the seed of every sharper bound.
        </p>

        <h2>Chebyshev: add the variance</h2>
        <p>
          Apply Markov to <M>{String.raw`(X - \mu)^2`}</M> and you get <strong>Chebyshev&rsquo;s inequality</strong>,
          which bounds deviations from the mean using the variance:
        </p>
        <MathBlock>{String.raw`P\big(|X - \mu| \ge k\sigma\big) \le \frac{1}{k^2}.`}</MathBlock>
        <p>
          In words: the probability of landing more than <M>k</M> standard deviations from the mean is at most{" "}
          <M>{String.raw`1/k^2`}</M> — at most 25% beyond 2σ, at most 11% beyond 3σ. Crucially this holds for{" "}
          <em>any</em> distribution with a finite variance, no Gaussian assumption required. (For an actual Gaussian
          the true tails are far thinner — Chebyshev is a worst-case guarantee, not a tight estimate.)
        </p>

        <h2>Why bother, given the CLT?</h2>
        <p>
          The CLT is a <em>limit</em> — it describes <M>{String.raw`n \to \infty`}</M> and is only approximate for
          finite <M>n</M>. Chebyshev gives a bound that holds <em>exactly</em>, for every <M>n</M>, with no
          distributional assumptions. Combine it with the <M>{String.raw`\sigma^2/n`}</M> variance of a sample mean and
          you get a finite-sample version of the law of large numbers:
        </p>
        <MathBlock>{String.raw`P\big(|\bar X_n - \mu| \ge \varepsilon\big) \le \frac{\sigma^2}{n\,\varepsilon^2}.`}</MathBlock>
        <p>
          The bound shrinks like <M>{String.raw`1/n`}</M> — proof that the sample mean concentrates, with a rate.
          It&rsquo;s loose, though; the <Link href="/learn/math-foundations/hoeffding" style={link}>next page</Link>
          shows how to get <em>exponentially</em> tighter bounds by using the{" "}
          <Link href="/learn/math-foundations/mgf" style={link}>MGF</Link> instead of just the variance.
        </p>

        <Callout color={AMBER} title={<>Where concentration matters in ML</>}>
          These bounds are the backbone of <strong>generalization theory</strong>: they let you say &ldquo;the
          model&rsquo;s error on unseen data is close to its error on the training set, with high probability.&rdquo;
          They also justify Monte-Carlo estimates, bandit algorithms&rsquo; confidence bounds, and why a validation
          set of a few thousand points is trustworthy. Markov and Chebyshev are the humble start of that whole story.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/math-foundations/lln-and-clt", label: <>← The law of large numbers &amp; the CLT</> }}
          next={{ href: "/learn/math-foundations/hoeffding", label: <>Next up · Hoeffding&rsquo;s inequality →</> }}
        />
      </div>
    </article>
  );
}
