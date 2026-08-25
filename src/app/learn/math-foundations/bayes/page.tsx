import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { BayesLab } from "@/components/labs/BayesLab";

export const metadata = {
  title: "Conditional probability & Bayes' rule — Manifold",
  description:
    "Conditional probability updates a belief given evidence, and Bayes' rule flips the conditioning around. The famous base-rate trap — why a positive test on a rare disease usually means you're fine — falls right out of it.",
};

const AMBER = "var(--c-fundamentals)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function BayesPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Probability", color: AMBER }, { label: "Tier 0 · foundations", color: "var(--c-fundamentals)" }]}
        time="about 7 minutes"
        title={<>Conditional probability &amp; Bayes&rsquo; rule</>}
        intro={<>Learning <em>is</em> updating beliefs with evidence, and the mathematics of that update is Bayes&rsquo;
          rule. It&rsquo;s a short formula with a famously counterintuitive punchline: even a very accurate test can
          leave you probably-healthy after a positive result, if the disease is rare.</>}
      />

      <div className="lesson">
        <h2>Conditional probability</h2>
        <p>
          <M>{String.raw`P(A \mid B)`}</M> is the probability of <M>A</M> <em>given that</em> <M>B</M> happened — you
          restrict the world to the outcomes where <M>B</M> is true and ask how much of that slice is also <M>A</M>:
        </p>
        <MathBlock>{String.raw`P(A \mid B) = \frac{P(A \cap B)}{P(B)}.`}</MathBlock>

        <h2>Bayes&rsquo; rule flips the condition</h2>
        <p>
          Often you know <M>{String.raw`P(\text{evidence} \mid \text{cause})`}</M> — how a test behaves when someone is
          sick — but you want <M>{String.raw`P(\text{cause} \mid \text{evidence})`}</M> — whether a positive test means
          you&rsquo;re sick. Bayes&rsquo; rule turns one into the other:
        </p>
        <MathBlock>{String.raw`P(A \mid B) = \frac{P(B \mid A)\,P(A)}{P(B)}.`}</MathBlock>
        <p>
          The three pieces have names: <M>{String.raw`P(A)`}</M> is the <strong>prior</strong> (your belief before the
          evidence), <M>{String.raw`P(B \mid A)`}</M> is the <strong>likelihood</strong> (how well the cause explains
          the evidence), and <M>{String.raw`P(A \mid B)`}</M> is the <strong>posterior</strong> (your updated belief).
          The prior is what everyone forgets.
        </p>

        <PredictPrompt
          accent={AMBER}
          prompt={<>A disease affects 1% of people. A test is 90% accurate both ways. You test positive. Roughly what&rsquo;s
            the chance you actually have it?</>}
          options={["About 90%", "About 50%", "Under 10%"]}
        />

        <LabFrame
          accent={AMBER}
          tryThis={<>Leave sensitivity and specificity at 90% and drag prevalence down toward 1%. Watch the posterior
            collapse. Then raise prevalence — when does a positive test finally become convincing?</>}
          insight={<>At 1% prevalence a 90% test leaves you only ~8% likely to be sick — because the 9-in-1000 true
            positives are swamped by ~99 false positives among the healthy majority. Raise the base rate and the
            posterior climbs. The prior dominates when the event is rare: the base-rate trap.</>}
        >
          <BayesLab />
        </LabFrame>

        <Callout color={AMBER} title={<>Why this runs through ML</>}>
          <Link href="/learn/logistic-regression/the-generative-twin" style={link}>Naive Bayes</Link> classifies by
          applying this rule to features. Bayesian inference updates a whole distribution over parameters as data
          arrives. The base-rate trap is exactly why <Link href="/learn/evaluation/roc-auc-and-pr-curves" style={link}>precision
          collapses on imbalanced data</Link> — a rare positive class is the rare disease. And{" "}
          <Link href="/learn/logistic-regression/calibration" style={link}>calibration</Link> is the art of making a
          model&rsquo;s posterior probabilities trustworthy. Bayes is not one topic; it&rsquo;s a lens on many.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/math-foundations/expectation-and-variance", label: <>← Expectation &amp; variance</> }}
          next={{ href: "/learn/math-foundations/independence", label: <>Next up · Independence, covariance &amp; correlation →</> }}
        />
      </div>
    </article>
  );
}
