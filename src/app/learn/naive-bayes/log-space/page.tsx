import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { PredictPrompt } from "@/components/PredictPrompt";
import { NB_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "Working in log-space — Manifold",
  description:
    "A document score is a product of hundreds of small probabilities, and in float64 that product underflows to exactly 0.0 — every class ties and the classifier is broken. Take logs and the product becomes a finite sum.",
};

const TEAL = "var(--c-classification)";

export default function LogSpacePage() {
  const fromScratch = `# 400 small word-probabilities, like a real document produces
rng   = np.random.RandomState(0)
probs = rng.uniform(0.001, 0.05, size=400)

product = np.prod(probs)          # multiply them all -- the naive way
log_sum = np.sum(np.log(probs))   # add their logs instead

print("product (float64):", product, " underflowed:", product == 0.0)
print("sum of logs       :", round(log_sum, 3))`;

  return (
    <article>
      <LessonHeader
        chips={[
          { label: "Classification", color: TEAL },
          { label: "Practitioner", color: "var(--c-fundamentals)" },
        ]}
        time="about 7 minutes"
        title={<>Working in log-space</>}
        intro={<>The Naive Bayes score is a product of one probability per feature. On a document of a few hundred
          words that is a product of a few hundred numbers, each well below one. Multiply enough of them and
          floating-point gives up: the result underflows to <strong>exactly 0.0</strong>, every class ties at
          zero, and the classifier silently returns garbage. Taking logarithms turns the fragile product into a
          robust sum — this is not an optimisation, it is why the algorithm runs at all.</>}
      />

      <div className="lesson">
        <h2>The product that vanishes</h2>
        <p>
          The score for class <M>{String.raw`y`}</M> is the prior times the product of per-feature likelihoods,{" "}
          <M>{String.raw`P(y)\prod_j P(x_j \mid y)`}</M>. Each factor is a probability between 0 and 1, and for a
          large vocabulary each word probability is <em>small</em> — often <M>{String.raw`10^{-3}`}</M> or less.
          A double-precision float only represents positive numbers down to about <M>{String.raw`10^{-308}`}</M>;
          a product of a few hundred word-probabilities blows straight through that floor.
        </p>

        <PredictPrompt
          prompt={<>You multiply 400 probabilities, each somewhere between 0.001 and 0.05, in ordinary float64.
            What comes out?</>}
          options={[
            "A very small but usable number, around 1e-200",
            "Exactly 0.0 — it underflows",
            "An error — floats can't multiply that many numbers",
          ]}
          nudge={<>Locked in. Run it, and run the log version beside it.</>}
        />

        <CodeBlock setup={NB_SETUP} fromScratch={fromScratch} />

        <Callout color={TEAL} title={<>Measured: the product is literally 0.0</>}>
          The product of those 400 probabilities is not &ldquo;very small&rdquo; — it is{" "}
          <strong><M>{String.raw`0.000\text{e}{+}00`}</M></strong>, exactly zero, an underflow. Do that for every
          class and every class scores zero. The <M>{String.raw`\arg\max`}</M> is now a tie among identical
          zeros, and the classifier picks arbitrarily. The model is not wrong — it has been erased by the
          arithmetic. Meanwhile the sum of the logs is a perfectly finite{" "}
          <strong><M>{String.raw`-1570.853`}</M></strong>.
        </Callout>

        <h2>Logarithms turn the product into a sum</h2>
        <p>
          The escape is the defining property of the logarithm — it converts multiplication into addition:
        </p>

        <MathBlock>{String.raw`\log P(y \mid \mathbf{x}) = \log P(y) + \sum_{j=1}^{d} \log P(x_j \mid y) \;+\; \text{const}.`}</MathBlock>

        <p>
          Every small probability becomes a moderately negative number — <M>{String.raw`\log 10^{-3} \approx -6.9`}</M>{" "}
          — and instead of multiplying hundreds of tiny numbers we <em>add</em> hundreds of moderate ones. The
          document whose product underflowed to zero has an ordinary finite log-score. Every Naive Bayes
          implementation you will ever use scores in log-space for exactly this reason.
        </p>

        <h2>Deciding entirely in log-space</h2>
        <p>
          Here is what makes it free: to <em>classify</em> you never have to leave log-space. Prediction needs
          only which class scores highest, and the logarithm is <strong>strictly increasing</strong> — if{" "}
          <M>{String.raw`a > b`}</M> then <M>{String.raw`\log a > \log b`}</M>. So the class that maximises the
          product is exactly the class that maximises the sum of logs:
        </p>

        <MathBlock>{String.raw`\hat{y} = \arg\max_{y}\; \Bigl[\, \log P(y) + \sum_{j=1}^{d} \log P(x_j \mid y) \,\Bigr]`}</MathBlock>

        <p>
          No exponentials, no underflow, no risk — the whole prediction path is additions and a comparison. The
          move into log-space changes the numbers but not the decision; it is an exact re-expression of the same
          argmax, not an approximation. That is why it is universal, and why Naive Bayes is not just cheap to
          train but numerically bulletproof to run.
        </p>

        <h2>When you do need the probabilities back: log-sum-exp</h2>
        <p>
          Sometimes you want the actual posterior — to threshold it, rank by confidence, or (as the{" "}
          next page but one warns) inspect how badly calibrated it is. Recovering it means normalising the
          log-scores, and doing that naively reintroduces overflow: <M>{String.raw`e^{-1570}`}</M> underflows,{" "}
          <M>{String.raw`e^{+\text{large}}`}</M> overflows. The <strong>log-sum-exp</strong> trick subtracts the
          largest log-score <M>{String.raw`m = \max_y s_y`}</M> first:
        </p>

        <MathBlock>{String.raw`P(y \mid \mathbf{x}) = \frac{e^{s_y - m}}{\sum_{y'} e^{s_{y'} - m}}.`}</MathBlock>

        <p>
          Now the biggest term is <M>{String.raw`e^0 = 1`}</M> and every other is in <M>{String.raw`(0,1]`}</M> —
          nothing overflows, the dominant term never underflows, and the shift <M>{String.raw`m`}</M> cancels
          between numerator and denominator, so you get the exact posterior with no dangerous exponential. It is
          the same trick that stabilises the softmax at the end of every neural network.
        </p>

        <PrevNext
          prev={{ href: "/learn/naive-bayes/laplace-smoothing", label: <>&larr; Laplace smoothing</> }}
          next={{ href: "/learn/naive-bayes/naive-bayes-for-text", label: <>Next up &middot; Naive Bayes for text &rarr;</> }}
        />
      </div>
    </article>
  );
}
