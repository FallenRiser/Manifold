import Link from "next/link";
import { M } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { LabFrame } from "@/components/LabFrame";
import { DistributionLab } from "@/components/labs/DistributionLab";

export const metadata = {
  title: "Distributions you'll actually meet — Manifold",
  description:
    "A handful of distributions cover most of machine learning: Bernoulli and binomial for yes/no, Gaussian for measurements, exponential for waiting times, uniform for ignorance. Meet them by shape.",
};

const AMBER = "var(--c-fundamentals)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function DistributionsPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Probability", color: AMBER }, { label: "Tier 0 · foundations", color: "var(--c-fundamentals)" }]}
        time="about 7 minutes"
        title={<>Distributions you&rsquo;ll actually meet</>}
        intro={<>A distribution is the full description of a random variable — how its probability is spread across
          values. You don&rsquo;t need dozens; a small cast turns up again and again in ML. Here they are, by the shape
          they make.</>}
      />

      <div className="lesson">
        <h2>The shapes, side by side</h2>
        <p>
          Pick a distribution, tune its parameters, and watch the shape — and its mean and variance — respond. The
          same mean and variance you&rsquo;ll compute by hand on the <Link href="/learn/math-foundations/expectation-and-variance" style={link}>next
          page</Link> are drawn here live.
        </p>

        <LabFrame
          accent={AMBER}
          tryThis={<>Cycle through all four. On the Gaussian, move <M>{String.raw`\mu`}</M> and <M>{String.raw`\sigma`}</M>
            separately — which slides the bell, which widens it? On the binomial, push <M>p</M> toward 0 or 1.</>}
          insight={<>The Gaussian&rsquo;s mean slides it, its <M>{String.raw`\sigma`}</M> widens it (variance{" "}
            <M>{String.raw`\sigma^2`}</M>). The exponential is all front-loaded (memoryless waiting times); the uniform
            is flat (equal ignorance); the binomial is a sum of coin flips creeping toward a bell — a preview of the{" "}
            <Link href="/learn/math-foundations/lln-and-clt" style={link}>CLT</Link>.</>}
        >
          <DistributionLab />
        </LabFrame>

        <h2>The essential cast</h2>
        <ul style={{ margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 }}>
          <li><strong>Bernoulli(p)</strong> — one yes/no trial. The distribution behind <Link href="/learn/logistic-regression" style={link}>logistic regression</Link>&rsquo;s output and every binary label.</li>
          <li><strong>Binomial(n, p)</strong> — the count of successes in <M>n</M> independent Bernoulli trials. Mean <M>{String.raw`np`}</M>, variance <M>{String.raw`np(1-p)`}</M>.</li>
          <li><strong>Gaussian(μ, σ²)</strong> — the bell curve; the default model for measurements and noise, for reasons the CLT explains. It gets <Link href="/learn/math-foundations/gaussian" style={link}>its own page</Link>.</li>
          <li><strong>Uniform(a, b)</strong> — every value in a range equally likely; the &ldquo;I know nothing more&rdquo; prior and the source of random initialisation.</li>
          <li><strong>Exponential(λ)</strong> / <strong>Poisson(λ)</strong> — waiting times and event counts; memoryless arrivals, rare-event modelling.</li>
        </ul>

        <h2>Parameters vs. shape</h2>
        <p>
          A distribution <em>family</em> is a shape; its <strong>parameters</strong> pin down the specific member.
          &ldquo;Gaussian&rdquo; is the bell; <M>{String.raw`(\mu, \sigma)`}</M> says which bell. Fitting a model to
          data is often exactly this: assume a family, then find the parameters that make the observed data most
          likely — <strong>maximum likelihood estimation</strong>, the engine under a huge share of ML training.
        </p>

        <Callout color={AMBER} title={<>Distributions are modelling choices</>}>
          Choosing a distribution is choosing an assumption about your data. Count data? Poisson. A bounded
          proportion? Beta. Heavy tails and rare extremes? Not a Gaussian — and assuming one anyway is a classic way
          to be blindsided. Half of good modelling is picking a distribution whose shape matches reality.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/math-foundations/random-variables", label: <>← Random variables &amp; sample spaces</> }}
          next={{ href: "/learn/math-foundations/expectation-and-variance", label: <>Next up · Expectation &amp; variance →</> }}
        />
      </div>
    </article>
  );
}
