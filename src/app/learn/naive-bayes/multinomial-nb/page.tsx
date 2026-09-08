import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { Quiz } from "@/components/Quiz";
import { NB_TEXT_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "Multinomial Naive Bayes — Manifold",
  description:
    "The flavour for count features — word counts in a document. The likelihood is the multinomial, its parameters are word frequencies estimated by counting, and one pass over the corpus rivals iterative logistic regression.",
};

const TEAL = "var(--c-classification)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function MultinomialNbPage() {
  const fromScratch = `# training = COUNTING. Sum each class's word counts, smooth, normalise to
# a per-class word distribution -- one pass, no iteration.
classes  = np.unique(y_train)
logprior = np.log([(y_train == c).mean() for c in classes])
counts   = np.array([X_train[y_train == c].sum(axis=0) + 1.0 for c in classes])
logtheta = np.log(counts / counts.sum(axis=1, keepdims=True))

# score a document: log P(y) + sum of count * log P(word | y)
pred = (logprior + X_test @ logtheta.T).argmax(axis=1)
print("MultinomialNB (by hand):", round((pred == y_test).mean(), 3))`;

  const withLibrary = `mnb = MultinomialNB().fit(X_train, y_train)                     # one counting pass
lr  = LogisticRegression(max_iter=2000).fit(X_train, y_train)   # iterative solver

print("MultinomialNB :", round(accuracy_score(y_test, mnb.predict(X_test)), 3))
print("LogReg        :", round(accuracy_score(y_test, lr.predict(X_test)), 3))
print("vocab / docs  :", X_train.shape[1], "words /", X_train.shape[0], "train docs")`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: TEAL }, { label: "Practitioner", color: "var(--c-fundamentals)" }]}
        time="about 8 minutes"
        title={<>Multinomial Naive Bayes</>}
        intro={<>Swap the bell curve for a bag of words and you get the flavour that made Naive Bayes famous.
          Multinomial Naive Bayes models a document as a bag of word <em>counts</em>, learns each class&rsquo;s
          word frequencies by counting, and classifies text in a single pass — no iteration, no gradient. It is
          still one of the strongest fast baselines for text.</>}
      />

      <div className="lesson">
        <h2>Counts, not measurements</h2>
        <p>
          Represent a document as a vector of counts over a fixed vocabulary of <M>{String.raw`V`}</M> words,{" "}
          <M>{String.raw`\mathbf{x} = (x_1, \ldots, x_V)`}</M>, where <M>{String.raw`x_w`}</M> is how many times
          word <M>{String.raw`w`}</M> appears. A Gaussian is the wrong model — counts are non-negative integers,
          mostly zero, nothing like a bell curve. The right model is the <strong>multinomial</strong>: picture
          each class as a weighted die with one face per word, rolled once for every word in the document.
        </p>
        <p>
          Each class <M>{String.raw`c`}</M> has a probability vector{" "}
          <M>{String.raw`\boldsymbol{\theta}_c`}</M> summing to one — the chance a random word from a
          class-<M>{String.raw`c`}</M> document is word <M>{String.raw`w`}</M>. The probability that the class
          generates the observed bag of counts is the multinomial likelihood (the class-independent coefficient
          out front cancels in the argmax, so drop it):
        </p>

        <MathBlock>{String.raw`P(\mathbf{x} \mid y=c) \;\propto\;\; \prod_{w=1}^{V} \theta_{w,c}^{\,x_w}`}</MathBlock>

        <p>
          A word that shows up three times contributes <M>{String.raw`\theta_{w,c}^{3}`}</M> — appearances are
          evidence, and more appearances are more evidence.
        </p>

        <h2>Training is counting</h2>
        <p>
          The parameter <M>{String.raw`\theta_{w,c}`}</M> is estimated by exactly what it means — the share of
          class-<M>{String.raw`c`}</M> word-occurrences that are word <M>{String.raw`w`}</M>:
        </p>

        <MathBlock>{String.raw`\hat{\theta}_{w,c} = \frac{\text{count of word } w \text{ in class } c}{\text{total words in class } c}`}</MathBlock>

        <p>
          That fraction is not an approximation to training — it <em>is</em> the maximum-likelihood estimate
          (maximise <M>{String.raw`\sum_w n_w \log \theta_w`}</M> subject to{" "}
          <M>{String.raw`\sum_w \theta_w = 1`}</M> and the count fraction falls straight out). So the entire
          procedure is one sweep through the corpus accumulating a <M>{String.raw`V \times C`}</M> table of
          counts, then a row-normalisation. No epochs, no learning rate. Scoring happens in log-space, and the
          log-score is linear in the counts:
        </p>

        <MathBlock>{String.raw`\log P(y=c \mid \mathbf{x}) = \log P(y=c) + \sum_{w=1}^{V} x_w \,\log \theta_{w,c} + \text{const}`}</MathBlock>

        <h2>The measured result</h2>
        <p>
          On a synthetic two-topic corpus — a 400-word vocabulary, short 25-word documents, only a handful of
          signature words separating the topics — Multinomial Naive Bayes reaches <strong>0.736</strong>. The
          corpus is deliberately hard: the topics share almost all their vocabulary, so each short document
          carries little evidence. On a larger version (1,400 training documents) it reaches{" "}
          <strong>0.768</strong> and there it <strong>beats logistic regression&rsquo;s 0.755</strong> — an
          iterative model — while training in a single counting pass. Run the head-to-head:
        </p>

        <CodeBlock setup={NB_TEXT_SETUP} fromScratch={fromScratch} withLibrary={withLibrary} />

        <Callout color={TEAL} title={<>Why the workhorse for text</>}>
          Text is high-dimensional and sparse: tens of thousands of vocabulary words, of which any one document
          uses a few dozen. Multinomial NB handles this natively — its cost is proportional to the number of{" "}
          <em>non-zero</em> counts, it needs no feature scaling, and it trains in one pass. That combination of
          speed, sparsity-friendliness, and a genuinely strong baseline is why it was the default text
          classifier for two decades and remains the first thing to try.
        </Callout>

        <h2>The zero it creates</h2>
        <p>
          Look again at the training formula and picture a word <M>{String.raw`w`}</M> that never appears in any
          class-<M>{String.raw`c`}</M> document. Its count is zero, so <M>{String.raw`\hat{\theta}_{w,c} = 0`}</M>{" "}
          exactly. Now a test document containing that word gets a class-<M>{String.raw`c`}</M> likelihood of{" "}
          <M>{String.raw`\theta_{w,c}^{\,x_w} = 0`}</M> — and in log-space, <M>{String.raw`\log 0 = -\infty`}</M>.
          A single unseen word <strong>vetoes the entire class</strong>, no matter how much the other words favour
          it.
        </p>
        <p>
          This is the <strong>zero-frequency problem</strong>, created by the very counting that makes the
          flavour so cheap. With a large vocabulary and modest data, most words are unseen in most classes, so
          it is not an edge case — it is the common case. The fix is{" "}
          <Link href="/learn/naive-bayes/laplace-smoothing" style={link}>Laplace smoothing</Link>: add a small
          pseudo-count so no probability is ever exactly zero. That is the next page, and it is what turns this
          elegant idea into a classifier that survives contact with real text.
        </p>

        <Quiz
          accent={TEAL}
          title="Checkpoint"
          questions={[
            {
              q: <>What does <M>{String.raw`\theta_{w,c}`}</M> represent, and how is it estimated?</>,
              options: [
                "The probability a document belongs to class c; estimated by the prior",
                "The probability a random word in a class-c document is word w; estimated as (count of w in c) / (total words in c)",
                "The mean count of word w across all documents; estimated by averaging",
              ],
              answer: 1,
              explain: <>Each class is a weighted die over the vocabulary. θ is the face probability for word w,
                and its MLE is the fraction of that class&rsquo;s total word occurrences that are word w — pure
                counting, one pass.</>,
            },
            {
              q: <>Multinomial NB scores 0.768 against logistic regression&rsquo;s 0.755 on the larger corpus.
                What is the notable part?</>,
              options: [
                "NB wins by a huge margin, so it is always better on text",
                "NB matches or slightly beats an iterative model while training in one counting pass, no gradient descent",
                "Logistic regression must be broken",
              ],
              answer: 1,
              explain: <>The margin is small; the point is efficiency. NB reaches a competitive (here slightly
                better) accuracy by counting once. On high-dimensional sparse text that speed is exactly why it
                is the classic strong baseline.</>,
            },
            {
              q: <>A word appears in the test document but was never seen in class c during training. What
                happens?</>,
              options: [
                "Nothing — the word is ignored",
                "Its θ is exactly 0, so the class likelihood becomes 0 (−∞ in log-space) and that one word vetoes the whole class",
                "The classifier assigns the word to the nearest known class",
              ],
              answer: 1,
              explain: <>An unseen word gets an MLE θ of exactly zero; raised to a positive count it zeroes the
                class likelihood — −∞ in log-space. One unseen word can eliminate an otherwise strong class.
                That zero-frequency problem is what Laplace smoothing fixes.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/naive-bayes/gaussian-nb", label: <>← Gaussian Naive Bayes</> }}
          next={{ href: "/learn/naive-bayes/bernoulli-nb", label: <>Next up · Bernoulli Naive Bayes →</> }}
        />
      </div>
    </article>
  );
}
