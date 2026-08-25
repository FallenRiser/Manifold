import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { LabFrame } from "@/components/LabFrame";
import { EntropyLab } from "@/components/labs/EntropyLab";

export const metadata = {
  title: "Entropy: measuring surprise — Manifold",
  description:
    "Entropy measures the average surprise in a distribution — how uncertain it is, in bits. It's the quantity decision trees split on and the foundation for cross-entropy loss and KL divergence.",
};

const AMBER = "var(--c-fundamentals)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function EntropyPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Information theory", color: AMBER }, { label: "Tier 0 · foundations", color: "var(--c-fundamentals)" }]}
        time="about 6 minutes"
        title={<>Entropy: measuring surprise</>}
        intro={<>How much information does an outcome carry? A guaranteed event tells you nothing; a coin flip tells you
          one bit; a fair 8-way roll tells you three. Entropy makes &ldquo;amount of surprise&rdquo; a precise number —
          and that number turns out to drive decision trees and classification losses alike.</>}
      />

      <div className="lesson">
        <h2>Surprise, quantified</h2>
        <p>
          The <strong>surprise</strong> of an outcome with probability <M>p</M> is <M>{String.raw`\log_2(1/p) = -\log_2 p`}</M>:
          a certain event (<M>{String.raw`p=1`}</M>) has zero surprise; a rare one has a lot. <strong>Entropy</strong>
          is the <em>average</em> surprise over a whole distribution — how uncertain it is on the whole:
        </p>
        <MathBlock>{String.raw`H(p) = -\sum_i p_i \log_2 p_i \quad \text{(bits)}.`}</MathBlock>
        <p>
          Entropy is <strong>maximised by the uniform distribution</strong> (maximum uncertainty — every outcome
          equally likely) and <strong>minimised (zero) by a certain one</strong> (no surprise at all). For four
          outcomes, the ceiling is <M>{String.raw`\log_2 4 = 2`}</M> bits.
        </p>

        <LabFrame
          accent={AMBER}
          tryThis={<>Drag the four probabilities. Make one outcome nearly certain — what happens to <M>H</M>? Then
            hit &ldquo;make uniform.&rdquo; Where is entropy largest, and what value does it hit?</>}
          insight={<>Entropy peaks at exactly 2 bits when all four are equal (maximum uncertainty) and collapses toward
            0 as one outcome dominates (near-certainty, little surprise). Uncertainty and information are the same
            quantity seen from two sides.</>}
        >
          <EntropyLab />
        </LabFrame>

        <h2>Why it&rsquo;s a real bit count</h2>
        <p>
          Entropy isn&rsquo;t a metaphor — it&rsquo;s the theoretical minimum number of bits needed, on average, to
          encode outcomes from the distribution (Shannon&rsquo;s source-coding theorem). Frequent outcomes get short
          codes, rare ones long codes; the best possible average code length <em>is</em> the entropy. Compression and
          uncertainty are literally the same measurement.
        </p>

        <h2>Where it drives ML</h2>
        <ul style={{ margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 }}>
          <li><strong>Decision trees</strong> pick the split that most reduces entropy — the <em>information gain</em> — so each question removes as much uncertainty as possible. (<Link href="/learn/decision-trees/impurity-measures" style={link}>See the trees track.</Link>)</li>
          <li><strong>Cross-entropy loss</strong>, the default for classification, is entropy&rsquo;s partner — the subject of the <Link href="/learn/math-foundations/kl-divergence" style={link}>next page</Link>.</li>
          <li><strong>The Gaussian</strong> is the maximum-entropy distribution for a fixed mean and variance — the least-assuming choice, which is part of why it&rsquo;s the default noise model.</li>
        </ul>

        <Callout color={AMBER} title={<>The one-line intuition</>}>
          Entropy = expected surprise = uncertainty = the bits you&rsquo;d need to encode it. High when outcomes are
          spread evenly, low when one dominates. Every information-theoretic quantity in ML — KL divergence, mutual
          information, cross-entropy — is built from this single idea.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/math-foundations/azuma-mcdiarmid", label: <>← Azuma &amp; McDiarmid</> }}
          next={{ href: "/learn/math-foundations/kl-divergence", label: <>Next up · Cross-entropy &amp; KL divergence →</> }}
        />
      </div>
    </article>
  );
}
