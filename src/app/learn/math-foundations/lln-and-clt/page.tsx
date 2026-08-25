import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { Quiz } from "@/components/Quiz";
import { CLTLab } from "@/components/labs/CLTLab";

export const metadata = {
  title: "The law of large numbers & the CLT — Manifold",
  description:
    "Two theorems justify almost all of statistics: the law of large numbers says sample averages converge to the truth, and the central limit theorem says those averages become Gaussian — no matter what you started with.",
};

const AMBER = "var(--c-fundamentals)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function LlnCltPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Probability", color: AMBER }, { label: "Tier 0 · foundations", color: "var(--c-fundamentals)" }]}
        time="about 7 minutes"
        title={<>The law of large numbers &amp; the CLT</>}
        intro={<>Why can we trust an average? Why is the bell curve everywhere? Two theorems answer both, and together
          they license nearly all of statistics and machine learning: averages converge to the truth, and they do so
          in a Gaussian shape.</>}
      />

      <div className="lesson">
        <h2>The law of large numbers</h2>
        <p>
          The <strong>law of large numbers (LLN)</strong> says the sample average converges to the true mean as you
          collect more data:
        </p>
        <MathBlock>{String.raw`\bar X_n = \frac{1}{n}\sum_{i=1}^{n} X_i \;\longrightarrow\; \mathbb E[X] \quad\text{as } n \to \infty.`}</MathBlock>
        <p>
          This is the permission slip for all of empirical ML: estimate a probability by a frequency, a risk by an
          average loss on data, an expectation by a Monte-Carlo mean. It works because the{" "}
          <Link href="/learn/math-foundations/expectation-and-variance" style={link}>variance of the average shrinks
          like <M>{String.raw`\sigma^2/n`}</M></Link> — the spread around the truth vanishes as data piles up. The LLN
          tells you the estimate <em>lands</em> on the truth; it doesn&rsquo;t tell you the shape of the wobble on the
          way. That&rsquo;s the CLT&rsquo;s job.
        </p>

        <h2>The central limit theorem</h2>
        <p>
          The <strong>central limit theorem (CLT)</strong> is the deeper miracle: the distribution of the sample mean
          approaches a <em>Gaussian</em> as <M>n</M> grows — <strong>regardless of the source distribution&rsquo;s
          shape</strong>. Skewed, discrete, lumpy, it doesn&rsquo;t matter:
        </p>
        <MathBlock>{String.raw`\frac{\bar X_n - \mu}{\sigma/\sqrt{n}} \;\longrightarrow\; \mathcal N(0, 1).`}</MathBlock>

        <PredictPrompt
          accent={AMBER}
          prompt={<>The source below is a heavily skewed exponential. As you average more and more draws, what shape
            will the histogram of those averages take?</>}
          options={["It stays skewed like the source", "It becomes a symmetric bell curve", "It becomes uniform"]}
        />

        <LabFrame
          accent={AMBER}
          tryThis={<>Start at <M>n=1</M> (the raw, lopsided source) and slide <M>n</M> up. Watch the histogram of
            averages symmetrise into a bell, and the spread readout <M>{String.raw`1/\sqrt n`}</M> tighten. Resample to
            confirm it isn&rsquo;t a fluke.</>}
          insight={<>Even though single draws are wildly skewed, their <em>averages</em> pile into a Gaussian centred on
            the true mean, tightening as <M>{String.raw`1/\sqrt n`}</M>. That&rsquo;s the LLN (converging to 1) and the
            CLT (Gaussian shape) happening at once.</>}
        >
          <CLTLab />
        </LabFrame>

        <h2>Why these two theorems matter so much</h2>
        <ul style={{ margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 }}>
          <li><strong>They justify learning from samples.</strong> Training minimizes average loss on a finite dataset as a stand-in for expected loss on the true distribution — valid precisely because of the LLN.</li>
          <li><strong>They explain the Gaussian&rsquo;s ubiquity.</strong> Measurement noise is a sum of many small effects, so the CLT makes it bell-shaped — retroactively justifying <Link href="/learn/math-foundations/gaussian" style={link}>squared-error loss</Link>.</li>
          <li><strong>They power confidence intervals.</strong> Error bars, A/B tests, and the <M>{String.raw`1/\sqrt n`}</M> rate of &ldquo;more data helps&rdquo; all come straight from the CLT.</li>
        </ul>

        <Callout color={AMBER} title={<>The honest fine print</>}>
          The CLT needs finite variance and enough samples, and it describes the <em>average</em> — individual
          extreme events still follow the source&rsquo;s tails. For heavy-tailed data (finance, network traffic) the
          bell can be dangerously optimistic about rare events. When you need a guarantee for <em>finite</em> <M>n</M>,
          not a limit, you reach for the <Link href="/learn/math-foundations/hoeffding" style={link}>concentration
          inequalities</Link> in the next chapter.
        </Callout>

        <Quiz
          title="Checkpoint · probability"
          accent={AMBER}
          questions={[
            {
              q: <>Bayes&rsquo; rule is mainly needed to…</>,
              options: ["compute variances", "flip a conditional: turn P(evidence|cause) into P(cause|evidence)", "prove independence"],
              answer: 1,
              explain: <>You usually know how evidence behaves given a cause and want the reverse; Bayes flips it, weighting by the prior.</>,
            },
            {
              q: <>Zero correlation between X and Y means…</>,
              options: ["they're independent", "no linear relationship — but they could still be dependent", "they're identical"],
              answer: 1,
              explain: <>Correlation sees only linear co-movement; a parabola or circle has ρ≈0 yet full dependence.</>,
            },
            {
              q: <>The central limit theorem says the sample mean becomes Gaussian…</>,
              options: ["only if the data is already Gaussian", "regardless of the source distribution's shape, as n grows", "only for discrete data"],
              answer: 1,
              explain: <>That&rsquo;s the miracle: whatever the source, averages of enough independent draws are approximately normal.</>,
            },
            {
              q: <>The variance of a sample mean of n i.i.d. values is…</>,
              options: ["σ²", "σ²/n — so it shrinks as data grows", "nσ²"],
              answer: 1,
              explain: <>Independent variances add, and the 1/n scaling squares to 1/n²·n = 1/n. This is why more data helps at rate 1/√n.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/math-foundations/mgf", label: <>← Moment-generating functions</> }}
          next={{ href: "/learn/math-foundations/markov-chebyshev", label: <>Next up · Markov &amp; Chebyshev →</> }}
        />
      </div>
    </article>
  );
}
