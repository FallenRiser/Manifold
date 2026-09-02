import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { Quiz } from "@/components/Quiz";
import { NB_TEXT_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "Choosing the flavour — Manifold",
  description:
    "A decision guide for the three Naive Bayes flavours: match the likelihood to how the feature is actually distributed. Continuous → Gaussian, counts → Multinomial, binary presence → Bernoulli — with the measured accuracies.",
};

const TEAL = "var(--c-classification)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function ChoosingTheFlavourPage() {
  const fromScratch = `from sklearn.naive_bayes import GaussianNB

# the corpus is word COUNTS. Try the right likelihood and a wrong one:
for name, model in [("Gaussian (wrong)   ", GaussianNB()),
                    ("Multinomial (right)", MultinomialNB())]:
    acc = accuracy_score(y_test, model.fit(X_train, y_train).predict(X_test))
    print(name, ":", round(acc, 3))`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: TEAL }, { label: "Practitioner", color: "var(--c-fundamentals)" }]}
        time="about 7 minutes"
        title={<>Choosing the flavour</>}
        intro={<>Three flavours, one idea. Gaussian, Multinomial, and Bernoulli Naive Bayes are the same
          Bayes-rule engine wearing three different likelihoods. Picking the right one is not a matter of taste —
          it is a matter of matching the likelihood to how your feature is actually distributed. This page is the
          decision guide.</>}
      />

      <div className="lesson">
        <h2>The whole decision in one table</h2>
        <p>
          Every flavour is defined by its answer to a single question: <em>what kind of number is a
          feature?</em> A continuous measurement, a count, or a yes/no. Once you know that, the flavour is fixed,
          and with it the likelihood <M>{String.raw`P(x_j \mid y)`}</M> and the way its parameters are estimated.
        </p>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 520 }}>
            <thead>
              <tr>
                {["feature type", "flavour", "likelihood", "example (measured)"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {([
                { type: "continuous", flavour: "Gaussian", like: "per-class means & variances", ex: "sensor readings, measurements — wine 0.963" },
                { type: "counts", flavour: "Multinomial", like: "word frequencies", ex: "document classification — 0.768" },
                { type: "binary presence", flavour: "Bernoulli", like: "present / absent probabilities", ex: "short-text / spam flags — 0.944" },
              ] as const).map((r) => (
                <tr key={r.flavour}>
                  <td style={{ padding: "6px 18px 6px 0", color: "var(--ink)", fontWeight: 500, borderBottom: "1px solid var(--border)" }}>{r.type}</td>
                  <td style={{ padding: "6px 18px 6px 0", color: TEAL, fontWeight: 500, borderBottom: "1px solid var(--border)" }}>{r.flavour}</td>
                  <td style={{ padding: "6px 18px 6px 0", color: "var(--ink)", borderBottom: "1px solid var(--border)" }}>{r.like}</td>
                  <td style={{ padding: "6px 18px 6px 0", color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>{r.ex}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 13, color: "var(--muted)" }}>
          Accuracies from <code>scripts/naive_bayes_cases.py</code>. Wine is a 13-feature, 3-class continuous
          problem; the text numbers are from a synthetic two-topic corpus; the Bernoulli figure is
          median-binarized wine.
        </p>

        <h2>The one-line rule</h2>
        <p>
          <strong>Match the likelihood to how the feature is actually distributed.</strong> A Gaussian describes
          a symmetric spread of real values; a multinomial describes how a budget of counts splits across
          categories; a Bernoulli describes a single present-or-absent bit. Choose the one whose story matches
          your data and the model is honest. Choose the wrong one and the likelihood systematically misdescribes
          the data — which can move the decision boundary, not just the probabilities.
        </p>

        <h2>See the cost of the wrong flavour</h2>
        <p>
          The corpus below is word counts. The right likelihood is Multinomial; a Gaussian misdescribes count
          data — it assigns density to impossible negative counts and over-penalises unusually high ones — so
          its per-class log-scores are wrong by different amounts, the classes tie at a different point, and some
          documents flip. Watch the accuracy drop when the flavour is wrong:
        </p>

        <CodeBlock setup={NB_TEXT_SETUP} fromScratch={fromScratch} />

        <p>
          The argmax is robust to <em>miscalibration</em> — that was the whole point of the naive assumption —
          but not to using the wrong distributional <em>shape</em>. Get the shape wrong and the boundary itself
          shifts.
        </p>

        <Callout color={TEAL} title={<>The flavour is a claim about your data</>}>
          Each flavour is a generative story: &ldquo;this is how class <M>{String.raw`c`}</M> produces feature{" "}
          <M>{String.raw`x_j`}</M>.&rdquo; Gaussian claims a bell curve, Multinomial a weighted die rolled once
          per word, Bernoulli a coin flipped once per feature. Picking a flavour asserts that story is roughly
          true. If it is, the estimated <M>{String.raw`P(x_j \mid y)`}</M> is accurate; if not, you have told the
          model a false story about your data before it sees a single test point.
        </Callout>

        <h2>You can mix flavours</h2>
        <p>
          Real datasets rarely have one uniform feature type. A spam model might have continuous features
          (message length, time of day) alongside binary ones (contains a link, sender in contacts). Nothing
          forces a single flavour — because the naive assumption already treats features independently, you can
          apply the <em>appropriate</em> likelihood to each and multiply the results. The simplest practical
          route is to <strong>discretise</strong> the continuous features into bins and treat everything as
          categorical. What you should <em>not</em> do is force one flavour onto a feature it does not fit — a
          Gaussian over word counts, a multinomial over temperatures.
        </p>

        <h2>The practical checklist</h2>
        <p>
          With a new dataset the decision takes three seconds per feature. Real-valued and roughly bell-shaped?
          Gaussian (and transform first if skewed). A count, especially a word count? Multinomial. A yes/no flag,
          or short text where presence beats frequency? Bernoulli. Mixed types? Give each feature its own
          likelihood, or discretise and go categorical. One guiding question throughout, worth committing to
          memory: <strong>match the likelihood to the distribution of the feature.</strong>
        </p>

        <Quiz
          accent={TEAL}
          title="Checkpoint"
          questions={[
            {
              q: <>What single rule decides which flavour to use?</>,
              options: [
                "Always use Gaussian, it is the most general",
                "Match the likelihood to how the feature is distributed: continuous → Gaussian, counts → Multinomial, binary presence → Bernoulli",
                "Use whichever trains fastest",
              ],
              answer: 1,
              explain: <>The flavour is entirely determined by the feature&rsquo;s distribution. Each flavour is a
                different likelihood; choosing the one that matches keeps the estimated probabilities honest.</>,
            },
            {
              q: <>You put a Gaussian on integer word counts. Why can that change the predictions, not just the
                probabilities?</>,
              options: [
                "It cannot — decisions are invariant to the likelihood",
                "A Gaussian misdescribes count data (density on impossible negatives, over-penalising high counts), so per-class log-scores are wrong by different amounts and the tie-point moves",
                "It only slows training",
              ],
              answer: 1,
              explain: <>The decision is the argmax of summed log-likelihoods. A wrong likelihood shape
                miscomputes each term by class-dependent amounts, so the classes tie elsewhere — the boundary
                shifts and points flip. The argmax tolerates miscalibration, not the wrong shape.</>,
            },
            {
              q: <>Your data mixes continuous features and binary flags. A sound approach?</>,
              options: [
                "Pick one flavour and force all features into it",
                "Because the naive assumption treats features independently, apply the appropriate likelihood to each (or discretise the continuous ones) and multiply",
                "Naive Bayes can't handle mixed types",
              ],
              answer: 1,
              explain: <>Independence factorises the joint into per-feature terms, so each feature can use its own
                likelihood. Give continuous features a Gaussian and binary ones a Bernoulli, or discretise
                everything — either way each feature gets the likelihood that fits it.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/naive-bayes/bernoulli-nb", label: <>← Bernoulli Naive Bayes</> }}
          next={{ href: "/learn/naive-bayes/laplace-smoothing", label: <>Next up · Laplace smoothing →</> }}
        />
      </div>
    </article>
  );
}
