import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { PredictPrompt } from "@/components/PredictPrompt";
import { NB_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "The conditional independence assumption — Manifold",
  description:
    "Naive Bayes assumes every feature is independent of every other, given the class. That one deliberately-false assumption turns an impossible d-dimensional density into d easy one-dimensional ones.",
};

const TEAL = "var(--c-classification)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function ConditionalIndependencePage() {
  const fromScratch = `# how many numbers must each approach estimate? (d binary features, 2 classes)
for d in (5, 10, 20, 30):
    full  = 2 * (2**d - 1)     # a probability for EVERY feature combination, per class
    naive = 2 * d              # one probability per feature, per class
    print(f"d={d:>2}:  full joint {full:>13,}   naive {naive:>3}")`;

  return (
    <article>
      <LessonHeader
        chips={[
          { label: "Classification", color: TEAL },
          { label: "Core idea", color: "var(--c-fundamentals)" },
        ]}
        time="about 8 minutes"
        title={<>The conditional independence assumption</>}
        intro={<>The last page put Naive Bayes in the generative camp — which means it needs the likelihood{" "}
          <M>{String.raw`P(\mathbf{x} \mid y)`}</M>, the probability of a whole feature vector given the class.
          For more than a handful of features, that is impossible to estimate. Naive Bayes rescues itself with
          a single, deliberately unrealistic assumption — and that assumption is the entire reason the method
          exists.</>}
      />

      <div className="lesson">
        <h2>The problem: the joint likelihood is enormous</h2>
        <p>
          A single example is a vector <M>{String.raw`\mathbf{x} = (x_1, \ldots, x_d)`}</M> of{" "}
          <M>{String.raw`d`}</M> features, and the likelihood we need is the <em>joint</em> over all of them
          at once, <M>{String.raw`P(x_1, \ldots, x_d \mid y)`}</M>. Estimating that is the curse of
          dimensionality in its purest form: if each feature were binary, the class-conditional table would
          have <M>{String.raw`2^d`}</M> cells — one per combination of feature values — and you would need to
          see each combination often enough to estimate it.
        </p>

        <PredictPrompt
          prompt={<>Take 30 binary features and two classes. How many numbers must the <em>full joint</em>{" "}
            likelihood store per class — one for every possible combination of feature values?</>}
          options={["A few hundred", "About sixty thousand", "Over a billion"]}
          nudge={<>Locked in. The code below counts it against the naive version — the gap is the whole story.</>}
        />

        <h2>The assumption that makes it tractable</h2>
        <p>
          Naive Bayes cuts the knot with one stroke: it assumes that, <strong>given the class</strong>, the
          features are mutually independent. Knowing the class, learning one feature tells you nothing about
          any other. Under that assumption the joint factorises into a product of one-dimensional pieces:
        </p>

        <MathBlock>{String.raw`P(x_1, \ldots, x_d \mid y) \;=\; \prod_{j=1}^{d} P(x_j \mid y).`}</MathBlock>

        <p>
          Read it carefully — it is the whole trick. On the left, one impossible <M>{String.raw`d`}</M>-dimensional
          density. On the right, a product of <M>{String.raw`d`}</M> separate <em>one-dimensional</em> ones,
          each asking only &ldquo;within this class, how is feature <M>{String.raw`j`}</M> distributed on its
          own?&rdquo; A single mean and variance, or a single count. Easy to estimate from data you actually
          have. Count the parameters and the blow-up is stark:
        </p>

        <CodeBlock setup={NB_SETUP} fromScratch={fromScratch} />

        <p>
          At 30 features the full joint needs on the order of a <strong>billion</strong> numbers per class; the
          naive form needs 30. That gap — exponential versus linear — is not a convenience. It is the
          difference between a model you can fit from a real dataset and one you can never fit at all.
        </p>

        <Callout color={TEAL} title={<>d hard questions become d easy ones</>}>
          The full joint asks &ldquo;how do all <M>{String.raw`d`}</M> features co-vary together, per
          class?&rdquo; The factorised form asks <M>{String.raw`d`}</M> independent questions, each about one
          feature alone. You never estimate a correlation, a covariance, or an interaction — which is why Naive
          Bayes trains in a single pass and needs so little data. There is almost nothing to fit.
        </Callout>

        <h2>The score you actually compute</h2>
        <p>
          Plug the factorisation into Bayes&rsquo; rule and take logs (the log turns a fragile product of tiny
          probabilities into a safe sum — <Link href="/learn/naive-bayes/log-space" style={link}>more on that
          later</Link>). The score for class <M>{String.raw`y`}</M> becomes a running total:
        </p>

        <MathBlock>{String.raw`\log P(y \mid \mathbf{x}) \;=\; \underbrace{\log P(y)}_{\text{prior}} \;+\; \sum_{j=1}^{d} \log P(x_j \mid y) \;+\; \text{const}.`}</MathBlock>

        <p>
          The constant is the same for every class and drops out of the argmax. To classify, accumulate this
          sum feature by feature for each class and pick the largest. This additive form is the computational
          heart of the method.
        </p>

        <h2>Why the assumption is almost always false</h2>
        <p>
          Conditional independence is not a mild approximation — it is usually just wrong. Height and weight
          stay correlated within a diagnosis. The words <em>&ldquo;free&rdquo;</em> and{" "}
          <em>&ldquo;prize&rdquo;</em> co-occur within spam far more than independence predicts. Adjacent pixels
          are nearly perfectly dependent given the object shown. The assumption declares every such dependency
          zero, and it is not.
        </p>
        <p>
          So why build on a false premise? Because being wrong about the <em>shape</em> of the joint density is
          not the same as being wrong about which class scores <em>highest</em>. That is the paradox the next
          two pages resolve — and the reason &ldquo;naive&rdquo; describes the model, not its accuracy.
        </p>

        <PrevNext
          prev={{ href: "/learn/naive-bayes/generative-vs-discriminative", label: <>&larr; Generative vs discriminative</> }}
          next={{ href: "/learn/naive-bayes/why-naive", label: <>Next up &middot; Why it is called naive &rarr;</> }}
        />
      </div>
    </article>
  );
}
