import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "Azuma & McDiarmid — Manifold",
  description:
    "The last step of concentration: bounds that survive dependence. Azuma handles martingales, and McDiarmid bounds any function that no single input can change much — the tool that powers modern generalization bounds.",
};

const AMBER = "var(--c-fundamentals)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function AzumaPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Concentration inequalities", color: AMBER }, { label: "Tier 3 · theory", color: "var(--c-metrics)" }]}
        time="about 6 minutes"
        title={<>Azuma &amp; McDiarmid</>}
        intro={<>Hoeffding and Chernoff assume independent terms and look at a plain average. Real quantities in ML are
          often <em>functions</em> of many inputs, with dependence. Azuma and McDiarmid extend exponential
          concentration to exactly those cases — and McDiarmid is the engine of modern generalization theory.</>}
      />

      <div className="lesson">
        <h2>Azuma: concentration for martingales</h2>
        <p>
          A <strong>martingale</strong> is a sequence whose next value equals its current value in expectation — a
          &ldquo;fair game&rdquo; where knowledge so far gives no edge on the next step. Many processes that aren&rsquo;t
          independent are martingales (running errors, sequential bets, gradient noise). <strong>Azuma&rsquo;s
          inequality</strong> says that if each step&rsquo;s change is bounded by <M>{String.raw`c_i`}</M>, the
          martingale still concentrates exponentially:
        </p>
        <MathBlock>{String.raw`P\big(|M_n - M_0| \ge \varepsilon\big) \le 2\exp\!\left(-\frac{\varepsilon^2}{2\sum_i c_i^2}\right).`}</MathBlock>
        <p>
          It&rsquo;s Hoeffding&rsquo;s shape, but bought with &ldquo;bounded increments&rdquo; instead of full
          independence — a big generalisation, since dependence is the norm.
        </p>

        <h2>McDiarmid: the bounded-differences inequality</h2>
        <p>
          This is the one that matters most for ML. Suppose <M>{String.raw`f(x_1, \dots, x_n)`}</M> is any function of{" "}
          <M>n</M> independent inputs, and changing a <em>single</em> input changes <M>f</M> by at most{" "}
          <M>{String.raw`c_i`}</M> (the <strong>bounded-differences</strong> condition). Then <M>f</M> concentrates
          tightly around its mean:
        </p>
        <MathBlock>{String.raw`P\big(|f - \mathbb E f| \ge \varepsilon\big) \le 2\exp\!\left(-\frac{2\varepsilon^2}{\sum_i c_i^2}\right).`}</MathBlock>
        <p>
          The power here is generality: <M>f</M> can be almost anything — not just an average. If no single training
          example can swing it much, the whole complicated quantity is close to its expectation with high probability.
          McDiarmid follows from Azuma applied to a cleverly constructed martingale, so the whole chapter really is one
          idea, layered.
        </p>

        <h2>Why this is the payoff of the whole chapter</h2>
        <p>
          The <em>generalization gap</em> — the difference between a model&rsquo;s training error and its true error —
          is a function of the whole training set, and swapping one example changes it only slightly. That&rsquo;s
          exactly McDiarmid&rsquo;s condition. So McDiarmid + a bound on the <em>expected</em> gap (via{" "}
          <strong>Rademacher complexity</strong>, in learning theory) yields the
          uniform-convergence guarantees that justify learning from finite data. Every &ldquo;with probability{" "}
          <M>{String.raw`1-\delta`}</M>, the test error is within <M>{String.raw`\varepsilon`}</M>&rdquo; theorem
          traces back to this page.
        </p>

        <Callout color={AMBER} title={<>The ladder, complete</>}>
          <strong>Markov</strong> (mean) → <strong>Chebyshev</strong> (+ variance) → <strong>Chernoff/Hoeffding</strong>
          (+ MGF, bounded &amp; independent) → <strong>Azuma/McDiarmid</strong> (+ bounded differences, dependence
          allowed). Each rung adds an assumption and buys a stronger guarantee. Together they answer machine
          learning&rsquo;s deepest question — <em>why does doing well on the sample mean doing well in general?</em> —
          which the Learning Theory track takes up in full.
        </Callout>

        <Quiz
          title="Checkpoint · concentration"
          accent={AMBER}
          questions={[
            {
              q: <>Compared to Chebyshev, Hoeffding&rsquo;s bound for bounded variables is…</>,
              options: ["looser", "exponentially tighter in n", "identical"],
              answer: 1,
              explain: <>Chebyshev decays like 1/n; Hoeffding like e^(−2nε²) — dramatically faster, the payoff for boundedness.</>,
            },
            {
              q: <>The Chernoff method works by applying Markov&rsquo;s inequality to…</>,
              options: ["X directly", "e^{tX}, then optimizing over t", "the variance of X"],
              answer: 1,
              explain: <>Exponentiating amplifies large deviations so Markov bites harder; optimizing t gives the tightest exponential bound.</>,
            },
            {
              q: <>McDiarmid&rsquo;s inequality applies when…</>,
              options: [
                "the data is Gaussian",
                "changing any single input changes the function by only a bounded amount",
                "all variables are identical",
              ],
              answer: 1,
              explain: <>The bounded-differences condition is what it needs — then any such function concentrates around its mean, even a complex one.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/math-foundations/chernoff", label: <>← Chernoff bounds</> }}
          next={{ href: "/learn/math-foundations/entropy", label: <>Next up · Entropy: measuring surprise →</> }}
        />
      </div>
    </article>
  );
}
