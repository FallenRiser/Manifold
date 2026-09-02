import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { NB_TEXT_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "Naive Bayes for text — Manifold",
  description:
    "Text is the killer app: tokenise, count, done. One counting pass trains a Multinomial Naive Bayes that beats iterative logistic regression on a synthetic corpus (0.768 vs 0.755). Why the classic baseline still earns its place.",
};

const TEAL = "var(--c-classification)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function NaiveBayesForTextPage() {
  const fromScratch = `mnb = MultinomialNB().fit(X_train, y_train)   # "training" = counting words

# peek inside: which word indices does each class most favour?
gap = mnb.feature_log_prob_[0] - mnb.feature_log_prob_[1]
print("top class-0 words (indices):", np.argsort(gap)[-5:].tolist())
print("top class-1 words (indices):", np.argsort(gap)[:5].tolist())
print("accuracy:", round(accuracy_score(y_test, mnb.predict(X_test)), 3))`;

  return (
    <article>
      <LessonHeader
        chips={[
          { label: "Classification", color: TEAL },
          { label: "Practitioner", color: "var(--c-fundamentals)" },
        ]}
        time="about 8 minutes"
        title={<>Naive Bayes for text</>}
        intro={<>Naive Bayes has one domain where it is not a curiosity but a genuine first choice: text.
          Documents are exactly the high-dimensional, sparse, count-valued data the multinomial model was built
          for, and &ldquo;training&rdquo; collapses to one pass of counting words — no iteration, no learning
          rate. On a synthetic corpus it beats logistic regression <strong>0.768 to 0.755</strong>, in a single
          sweep. This is why it remains the classic text baseline decades on.</>}
      />

      <div className="lesson">
        <h2>The pipeline, end to end</h2>
        <p>
          Turning raw documents into a Naive Bayes classifier is three steps, none of them iterative.{" "}
          <strong>1. Tokenise</strong> — split each document into words (lowercase, strip punctuation, maybe drop
          stopwords). <strong>2. Count</strong> — represent each document as a vector of word counts, a{" "}
          <em>bag of words</em> where order is thrown away (&ldquo;dog bites man&rdquo; and &ldquo;man bites
          dog&rdquo; are identical). <strong>3. Fit Multinomial NB</strong> — sum the word counts per class,
          smooth, and normalise into a per-class word distribution:
        </p>

        <MathBlock>{String.raw`\hat{\theta}_{j\mid y} = \frac{\alpha + \sum_{i:\,y_i = y} x_{ij}}{\alpha V + \sum_{k}\sum_{i:\,y_i = y} x_{ik}}`}</MathBlock>

        <p>
          That normalised frequency is the multinomial maximum-likelihood estimate — a closed form, computed by
          summing counts and dividing once, cost <M>{String.raw`O(\text{total tokens})`}</M>. There is no fixed
          point to iterate to, which is exactly why training is a single sweep while a discriminative model
          loops. If you care about <em>presence</em> rather than <em>frequency</em>, swap in a{" "}
          <Link href="/learn/naive-bayes/bernoulli-nb" style={link}>Bernoulli</Link> likelihood over binary
          indicators.
        </p>

        <h2>Peek inside the trained model</h2>
        <p>
          Because fitting is just counting, you can read straight out what each class learned to favour — the
          words whose per-class log-probabilities differ most:
        </p>

        <CodeBlock setup={NB_TEXT_SETUP} fromScratch={fromScratch} />

        <h2>Why text is where Naive Bayes shines</h2>
        <p>
          <strong>Training is one counting pass.</strong> No optimisation loop — read each document once, add its
          counts to its class total, done. Logistic regression on the same data needs many gradient iterations to
          converge; Naive Bayes hands you a working classifier before a gradient model finishes its first epoch.{" "}
          <strong>Huge sparse vocabularies are no problem</strong> — tens of thousands of words, each document
          touching a few dozen, handled natively by accumulating counts with no dense weight matrix.{" "}
          <strong>And it is genuinely competitive</strong> — not fast-but-worse, but often fast-and-comparable:
        </p>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 460 }}>
            <thead>
              <tr>
                {["model", "test accuracy", "training"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: "6px 18px 6px 0", color: "var(--ink)", fontWeight: 500, borderBottom: "1px solid var(--border)" }}>Multinomial Naive Bayes</td>
                <td style={{ padding: "6px 18px 6px 0", color: "var(--good)", fontWeight: 600, borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>0.768</td>
                <td style={{ padding: "6px 18px 6px 0", color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>one counting pass</td>
              </tr>
              <tr>
                <td style={{ padding: "6px 18px 6px 0", color: "var(--ink)", fontWeight: 500, borderBottom: "1px solid var(--border)" }}>Logistic regression</td>
                <td style={{ padding: "6px 18px 6px 0", color: "var(--ink)", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>0.755</td>
                <td style={{ padding: "6px 18px 6px 0", color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>iterative gradient descent</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 13, color: "var(--muted)" }}>
          Synthetic corpus: 400-word vocabulary, 1400 training documents. From{" "}
          <code>scripts/naive_bayes_cases.py</code>.
        </p>

        <Callout color={TEAL} title={<>Fast and competitive is a rare combination</>}>
          The usual trade is speed <em>or</em> accuracy. On text, Naive Bayes often gives both: a single counting
          pass produces a classifier that here beats the iteratively-optimised linear model it is most often
          compared against. So when you land on a new text problem, the disciplined first move is to fit a
          Multinomial Naive Bayes and record its number — it is the baseline every fancier model has to beat.
        </Callout>

        <h2>Three practical cautions</h2>
        <p>
          <strong>Smoothing is mandatory, not optional.</strong> A real vocabulary guarantees most words are
          unseen for most classes, so without a pseudocount practically every test document carries a class-fatal
          zero. On text the <Link href="/learn/naive-bayes/laplace-smoothing" style={link}>smoothing page</Link> is
          load-bearing, not a refinement.
        </p>
        <p>
          <strong>The independence assumption is wildly false for language.</strong> &ldquo;New&rdquo; is followed
          by &ldquo;York,&rdquo; negation flips meaning, syntax constrains order — and bag-of-words discards all
          of it. Yet, as the{" "}
          <Link href="/learn/naive-bayes/probabilities-break-decisions-survive" style={link}>track&rsquo;s central
          claim</Link> holds, the assumption corrupts the <em>probabilities</em> while usually leaving the argmax
          — the class decision — intact. That is exactly why a model on an obviously wrong premise still
          classifies well.
        </p>
        <p>
          <strong>TF-IDF weighting is a common tweak.</strong> People often replace raw counts with TF-IDF
          weights, which down-weight ubiquitous words and up-weight distinctive ones; on many corpora it helps.
          But TF-IDF weights are no longer integer counts, so feeding them to a multinomial model departs from
          the strict generative story — it works empirically, yet the tidy &ldquo;these are event counts&rdquo;
          interpretation no longer holds exactly.
        </p>

        <PrevNext
          prev={{ href: "/learn/naive-bayes/log-space", label: <>&larr; Working in log-space</> }}
          next={{ href: "/learn/naive-bayes/calibration", label: <>Next up &middot; Calibration: probabilities you cannot trust &rarr;</> }}
        />
      </div>
    </article>
  );
}
