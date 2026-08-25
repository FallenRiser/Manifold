import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Expectation & variance — Manifold",
  description:
    "Expectation is the long-run average of a random variable; variance is how much it typically strays. Together they summarize a distribution in two numbers — the two ML uses constantly, from loss functions to the bias–variance tradeoff.",
};

const AMBER = "var(--c-fundamentals)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function ExpectationVariancePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Probability", color: AMBER }, { label: "Tier 0 · foundations", color: "var(--c-fundamentals)" }]}
        time="about 7 minutes"
        title={<>Expectation &amp; variance</>}
        intro={<>Two numbers summarize most of what you need from a random variable: where it sits on average, and how
          much it jumps around. Expectation and variance are those numbers, and they run through everything from loss
          functions to the bias–variance decomposition.</>}
      />

      <div className="lesson">
        <h2>Expectation: the probability-weighted average</h2>
        <p>
          The <strong>expectation</strong> (or mean) <M>{String.raw`\mathbb E[X]`}</M> is the average value of{" "}
          <M>X</M> if you could repeat the experiment forever — each value weighted by how likely it is:
        </p>
        <MathBlock>{String.raw`\mathbb E[X] = \sum_k k\,P(X=k) \quad\text{(discrete)}, \qquad \mathbb E[X] = \int x\,f(x)\,dx \quad\text{(continuous)}.`}</MathBlock>
        <p>
          Its key property is <strong>linearity</strong>: <M>{String.raw`\mathbb E[aX + bY] = a\,\mathbb E[X] + b\,\mathbb E[Y]`}</M>,
          <em> always</em> — even when <M>X</M> and <M>Y</M> are dependent. That innocuous rule is the workhorse behind
          countless proofs and the reason expected-value calculations stay tractable.
        </p>

        <h2>Variance: the average squared spread</h2>
        <p>
          The <strong>variance</strong> measures how far, on average, <M>X</M> lands from its mean — squared, so
          deviations don&rsquo;t cancel:
        </p>
        <MathBlock>{String.raw`\operatorname{Var}(X) = \mathbb E\big[(X - \mathbb E[X])^2\big] = \mathbb E[X^2] - (\mathbb E[X])^2.`}</MathBlock>
        <p>
          Its square root, the <strong>standard deviation</strong> <M>{String.raw`\sigma`}</M>, is back in the
          original units and is the everyday measure of spread. Unlike expectation, variance is <em>not</em> linear:{" "}
          <M>{String.raw`\operatorname{Var}(aX) = a^2\operatorname{Var}(X)`}</M> — the <M>{String.raw`a^2`}</M> is why{" "}
          <Link href="/learn/pca/standardize-first" style={link}>rescaling features changes PCA</Link>, and why
          variance carries squared units.
        </p>

        <h2>The rule that makes averaging work</h2>
        <p>
          For <em>independent</em> variables, variance adds: <M>{String.raw`\operatorname{Var}(X + Y) = \operatorname{Var}(X) + \operatorname{Var}(Y)`}</M>.
          Average <M>n</M> independent copies and the variance of the average shrinks by <M>n</M>:
        </p>
        <MathBlock>{String.raw`\operatorname{Var}\!\left(\frac{1}{n}\sum_i X_i\right) = \frac{\sigma^2}{n}.`}</MathBlock>
        <p>
          This is the mathematical heart of why more data helps, why <Link href="/learn/random-forests/why-averaging-works" style={link}>averaging
          many trees</Link> reduces a forest&rsquo;s error, and why the <Link href="/learn/math-foundations/lln-and-clt" style={link}>sample
          mean converges</Link>. Averaging kills variance at rate <M>{String.raw`1/n`}</M>.
        </p>

        <Callout color={AMBER} title={<>Everywhere in ML</>}>
          Mean-squared-error loss is an <em>expected</em> squared error. The <Link href="/learn/random-forests/why-averaging-works" style={link}>bias–variance
          decomposition</Link> splits prediction error into (bias)² + variance + noise. A{" "}
          <Link href="/learn/pca/centering-and-covariance" style={link}>covariance matrix</Link> is a grid of variances
          and covariances. Expectation and variance aren&rsquo;t just probability trivia — they&rsquo;re the two
          summary statistics ML is built to estimate and trade off.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/math-foundations/distributions", label: <>← Distributions you&rsquo;ll actually meet</> }}
          next={{ href: "/learn/math-foundations/bayes", label: <>Next up · Conditional probability &amp; Bayes&rsquo; rule →</> }}
        />
      </div>
    </article>
  );
}
