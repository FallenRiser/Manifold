import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";

export const metadata = {
  title: "Why it is called naive — Manifold",
  description:
    "The independence assumption is knowingly wrong, yet the classifier works. The reason: under zero-one loss you only need the argmax to land on the right class — and the argmax is remarkably robust to the assumption being violated.",
};

const TEAL = "var(--c-classification)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function WhyNaivePage() {
  return (
    <article>
      <LessonHeader
        chips={[
          { label: "Classification", color: TEAL },
          { label: "Core idea", color: "var(--c-fundamentals)" },
        ]}
        time="about 7 minutes"
        title={<>Why it is called naive</>}
        intro={<>The last page left us with a paradox: conditional independence is almost always false, so a
          method built on it ought to fail. Naive Bayes doesn&rsquo;t — it is a workhorse, especially for
          text. The name &ldquo;naive&rdquo; admits the assumption is wrong. This page is the resolution:{" "}
          <strong>why a wrong model of the probabilities can still make the right decision.</strong></>}
      />

      <div className="lesson">
        <h2>&ldquo;Naive&rdquo; names the flaw, not the failure</h2>
        <p>
          The word is not a hedge. It points at one thing: the assumption that features are conditionally
          independent given the class, adopted <em>knowing it is false</em>. A more honest generative
          classifier would estimate the full joint with all its correlations. Naive Bayes refuses, throws the
          dependencies away, and multiplies per-feature probabilities as if they were independent. That
          deliberate oversimplification is the naivety.
        </p>
        <p>
          You would expect this to wreck the classifier. And in one sense it does — the estimated{" "}
          <M>{String.raw`\hat P(y \mid \mathbf{x})`}</M> is often far from the true{" "}
          <M>{String.raw`P(y \mid \mathbf{x})`}</M>. The surprise is that the <em>classifier</em> built on those
          broken probabilities is frequently excellent.
        </p>

        <h2>Zero-one loss only asks for the argmax</h2>
        <p>
          The resolution turns on what a classifier is graded on. Under <strong>zero-one loss</strong> — one for
          a wrong label, zero for a right one — you are scored only on whether your predicted class matches the
          true one. And you predict by the <M>{String.raw`\operatorname{argmax}`}</M>:
        </p>

        <MathBlock>{String.raw`\hat y \;=\; \operatorname*{arg\,max}_{y} \; \hat P(y \mid \mathbf{x}).`}</MathBlock>

        <p>
          Look at what this uses and what it throws away. It uses the <em>ordering</em> of the class scores —
          which is largest. It discards their <em>magnitudes</em> entirely. Whether the winning class scored
          0.51 or 0.9999999, the prediction is identical. So a model can be wildly wrong about the numbers and
          perfectly right about the decision, as long as the right class still comes out on top.
        </p>

        <Callout color={TEAL} title={<>Getting the sign right is easier than getting the value right</>}>
          The boundary between two classes is where their scores are <em>equal</em> — where the score
          difference crosses zero. Everywhere else, all that matters is the <em>sign</em> of that difference.
          Estimating a function&rsquo;s sign is a far weaker requirement than estimating its value. Naive Bayes
          routinely fails the second and passes the first.
        </Callout>

        <h2>The argmax is robust — here is why</h2>
        <p>
          Pedro Domingos and Michael Pazzani made this precise in 1997. They asked: when the independence
          assumption is violated, when does Naive Bayes <em>still</em> classify optimally? Their answer was that
          its region of optimality is <em>much</em> larger than the region where the assumption actually holds.
        </p>
        <p>
          The reasoning is worth seeing. For two classes the decision is the sign of the log-odds{" "}
          <M>{String.raw`s(\mathbf{x})`}</M>. The true, correlation-aware model has its own log-odds{" "}
          <M>{String.raw`s^\star`}</M>, and the naive assumption introduces an error,{" "}
          <M>{String.raw`s = s^\star + \varepsilon`}</M>. The classification is correct exactly when{" "}
          <M>{String.raw`s`}</M> and <M>{String.raw`s^\star`}</M> share a sign — and that only fails when the
          error <M>{String.raw`\varepsilon`}</M> is big enough to push <M>{String.raw`s`}</M> across zero, i.e.
          <M>{String.raw`\,|\varepsilon| > |s^\star|`}</M>. Away from the boundary <M>{String.raw`|s^\star|`}</M>{" "}
          is large, so even an enormous error leaves the sign intact. The decision is fragile only in the thin
          strip near <M>{String.raw`s^\star \approx 0`}</M> — where the classes are genuinely ambiguous anyway.
          Everywhere else, the error is free to be huge, inflating the score toward{" "}
          <M>{String.raw`\pm\infty`}</M> and the probability toward 0 or 1, <em>without changing a single
          label.</em>
        </p>
        <p>
          A concrete flavour: if two features are redundant, Naive Bayes double-counts their shared evidence.
          But it inflates the winning score on the side it was already going to pick — it makes a confident
          decision more confident, not a right decision wrong. The errors that would reorder the classes are far
          rarer than the ones that merely distort the confidence.
        </p>

        <Callout color="var(--c-fundamentals)" title={<>Interview-grade answer</>}>
          &ldquo;How can Naive Bayes work when its core assumption is false?&rdquo; → <em>Because classification
          under zero-one loss only needs the argmax, and the argmax depends on the <strong>order</strong> of the
          class scores, not their values. Violating independence corrupts the magnitudes far more than the
          ordering — it mostly makes confident predictions overconfident, which does not change the label. The
          decision survives even as the probability becomes untrustworthy.</em>
        </Callout>

        <h2>What this sets up</h2>
        <p>
          That is the track&rsquo;s thesis in words. The <Link href="/learn/naive-bayes/probabilities-break-decisions-survive" style={link}>next page</Link>{" "}
          turns it into a measurement: we take a dataset, deliberately violate independence by duplicating
          features, and watch the decision hold perfectly steady while the probability inflates toward certainty.
          A good classifier, a bad probability estimate — measured, not asserted. Keep the distinction between{" "}
          <em>rank</em> and <em>value</em> in mind; the numbers there are exactly that distinction made
          quantitative.
        </p>

        <PrevNext
          prev={{ href: "/learn/naive-bayes/conditional-independence", label: <>&larr; The conditional independence assumption</> }}
          next={{ href: "/learn/naive-bayes/probabilities-break-decisions-survive", label: <>Next up &middot; Probabilities break, decisions survive &rarr;</> }}
        />
      </div>
    </article>
  );
}
