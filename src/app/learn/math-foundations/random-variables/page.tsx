import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Random variables & sample spaces — Manifold",
  description:
    "Probability starts with a clean vocabulary: a sample space of what could happen, events as subsets, and random variables that turn outcomes into numbers. Everything about uncertainty in ML is built on these three ideas.",
};

const AMBER = "var(--c-fundamentals)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function RandomVariablesPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Probability", color: AMBER }, { label: "Tier 0 · foundations", color: "var(--c-fundamentals)" }]}
        time="about 6 minutes"
        title={<>Random variables &amp; sample spaces</>}
        intro={<>Machine learning is applied uncertainty: noisy data, probabilistic predictions, confidence in an
          answer. To reason about any of it you need three precise words — sample space, event, and random variable.
          Get these straight and the rest of probability has somewhere to stand.</>}
      />

      <div className="lesson">
        <h2>The three primitives</h2>
        <ul style={{ margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 }}>
          <li><strong>Sample space</strong> <M>{String.raw`\Omega`}</M> — the set of everything that could happen. For a die, <M>{String.raw`\{1,2,3,4,5,6\}`}</M>; for a coin, <M>{String.raw`\{H, T\}`}</M>.</li>
          <li><strong>Event</strong> — any subset of the sample space you might ask about. &ldquo;The die shows even&rdquo; is the event <M>{String.raw`\{2,4,6\}`}</M>. A probability is assigned to events.</li>
          <li><strong>Random variable</strong> <M>X</M> — a function that turns each outcome into a number. &ldquo;Number of heads in 3 flips&rdquo; maps outcomes to <M>{String.raw`\{0,1,2,3\}`}</M>.</li>
        </ul>
        <p>
          The move that makes probability computable is the last one: random variables convert messy outcomes into
          numbers you can average, add, and plot. A dataset is a pile of random-variable observations; a model&rsquo;s
          prediction is often a random variable too.
        </p>

        <h2>The rules probabilities obey</h2>
        <p>
          A probability <M>{String.raw`P`}</M> assigns each event a number in <M>{String.raw`[0,1]`}</M>, with the
          whole sample space getting 1, and disjoint events adding:
        </p>
        <MathBlock>{String.raw`0 \le P(A) \le 1, \quad P(\Omega) = 1, \quad P(A \cup B) = P(A) + P(B)\ \text{ if } A, B \text{ disjoint}.`}</MathBlock>
        <p>
          From these three axioms everything else follows — complements (<M>{String.raw`P(\text{not }A) = 1 - P(A)`}</M>),
          the inclusion–exclusion rule, and eventually <Link href="/learn/math-foundations/bayes" style={link}>Bayes&rsquo;
          rule</Link>.
        </p>

        <h2>Discrete vs continuous</h2>
        <p>
          A <strong>discrete</strong> random variable takes countable values (a die, a class label) and is described by
          a <strong>probability mass function</strong> <M>{String.raw`P(X = k)`}</M>. A <strong>continuous</strong>
          one takes real values (a height, a measurement) and is described by a <strong>probability density
          function</strong> <M>{String.raw`f(x)`}</M>, where probabilities are <em>areas</em> under the curve —{" "}
          <M>{String.raw`P(a \le X \le b) = \int_a^b f(x)\,dx`}</M>. A single exact value has probability zero; only
          ranges carry weight. Both kinds, and their shapes, are the subject of the{" "}
          <Link href="/learn/math-foundations/distributions" style={link}>next page</Link>.
        </p>

        <Callout color={AMBER} title={<>Why ML speaks this language</>}>
          A classifier that outputs &ldquo;80% cat&rdquo; is reporting <M>{String.raw`P(Y = \text{cat} \mid X)`}</M>.
          A generative model <em>is</em> a distribution you can sample. Maximum likelihood, cross-entropy loss,
          Bayesian methods, and calibration all assume you&rsquo;re fluent in random variables. This is the grammar of
          every probabilistic model.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/math-foundations/subgradients", label: <>← Subgradients &amp; non-smooth objectives</> }}
          next={{ href: "/learn/math-foundations/distributions", label: <>Next up · Distributions you&rsquo;ll actually meet →</> }}
        />
      </div>
    </article>
  );
}
