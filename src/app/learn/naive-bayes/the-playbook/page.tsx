import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeBlock } from "@/components/CodeBlock";
import { NB_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "The Naive Bayes playbook — Manifold",
  description:
    "Five rules that turn everything in this track into a working Naive Bayes classifier — and the one idea worth carrying to every model you meet next.",
};

const TEAL = "var(--c-classification)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

const PLAY = [
  {
    n: 1,
    title: "Match the flavour to the feature",
    body: <>Continuous numbers → <Link href="/learn/naive-bayes/gaussian-nb" style={link}>Gaussian</Link>.
      Counts → <Link href="/learn/naive-bayes/multinomial-nb" style={link}>Multinomial</Link>. Present/absent
      → <Link href="/learn/naive-bayes/bernoulli-nb" style={link}>Bernoulli</Link>. Using the wrong likelihood
      misestimates P(x|y) and can move the boundary.</>,
  },
  {
    n: 2,
    title: "Always smooth — never α = 0",
    body: <>A single unseen word can veto an entire class. Keep Laplace smoothing on (α = 1 is the sensible
      default); on our sparse text it lifted accuracy from <strong>0.630</strong> to <strong>0.870</strong>.
      See <Link href="/learn/naive-bayes/laplace-smoothing" style={link}>smoothing</Link>.</>,
  },
  {
    n: 3,
    title: "Score in log-space",
    body: <>A product of hundreds of small probabilities underflows to exactly 0. Add logs instead — every
      real implementation already does. <Link href="/learn/naive-bayes/log-space" style={link}>Why</Link>.</>,
  },
  {
    n: 4,
    title: "Trust the decision, not the probability",
    body: <>The argmax is reliable; the probability is overconfident (ECE 0.116 vs 0.035). Use the ranking, or
      recalibrate before you multiply the number. See <Link href="/learn/naive-bayes/calibration" style={link}>calibration</Link>.</>,
  },
  {
    n: 5,
    title: "Use it as the fast, small-data, high-dim baseline",
    body: <>It is the model to beat on text and when data is scarce — and it wins there until the crossover
      (~400 points) hands off to a discriminative model. See <Link href="/learn/naive-bayes/when-to-use-it" style={link}>when to reach for it</Link>.</>,
  },
];

export default function PlaybookPage() {
  const fromScratch = `# The whole Naive Bayes workflow, start to finish
nb   = GaussianNB().fit(X_train, y_train)     # training = estimate priors, means, variances
pred = nb.predict(X_test)                      # decide by argmax of the log-posterior
print(f"accuracy: {accuracy_score(y_test, pred):.3f}")   # a strong baseline in ONE pass

# trust that decision; the probabilities below need recalibration before you trust them
print("first 3 confidences:", nb.predict_proba(X_test)[:3].round(3).tolist())`;

  const withLibrary = `# Swapping the flavour is a one-word change -- match it to your features
for Model in (GaussianNB, BernoulliNB):
    m = Model().fit(X_train, y_train)
    acc = accuracy_score(y_test, m.predict(X_test))
    print(f"{Model.__name__:<12} accuracy {acc:.3f}")`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: TEAL }, { label: "Practitioner", color: "var(--c-fundamentals)" }]}
        time="about 7 minutes"
        title={<>The Naive Bayes playbook</>}
        intro={<>Everything in this track, compressed into five rules you can carry into any project — plus
          the one idea that outlives Naive Bayes entirely.</>}
      />

      <div className="lesson">
        <p>
          You started with a classifier that assumes something false and ended up understanding exactly why
          it works anyway. Here is that understanding as a checklist — each rule earned by a page you have
          already read.
        </p>

        <div style={{ display: "grid", gap: 12, margin: "1.3rem 0" }}>
          {PLAY.map((p) => (
            <div key={p.n} style={{ display: "grid", gridTemplateColumns: "2.4rem 1fr", gap: "0 14px", alignItems: "start" }}>
              <div className="font-display" style={{ fontSize: 26, fontWeight: 500, color: TEAL, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{p.n}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15.5, marginBottom: 2 }}>{p.title}</div>
                <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>{p.body}</p>
              </div>
            </div>
          ))}
        </div>

        <h2>The whole thing, in five lines</h2>
        <p>
          There is no training loop to write and no learning rate to tune. Fitting is estimation; predicting
          is an argmax. Swapping flavours is a single word. Run it:
        </p>

        <CodeBlock setup={NB_SETUP} fromScratch={fromScratch} withLibrary={withLibrary} />

        <Callout color={TEAL} title={<>The idea worth keeping</>}>
          If you remember one thing, remember the spine: <strong>a broken model of the probabilities can
          still make the right decision.</strong> Duplicated evidence pinned accuracy at 0.975 while
          confidence ran to 1.000. Under zero-one loss you are grading the argmax, not the value — and the
          argmax is far more robust than the numbers behind it. That distinction between a good{" "}
          <em>decision</em> and a good <em>probability</em> will follow you into every model you meet next.
        </Callout>

        <h2>What you now have</h2>
        <p>
          A complete, honest picture of the generative approach to classification: Bayes&rsquo; rule as a
          decision engine, the naive assumption and why it is survivable, the three likelihoods, the
          engineering (smoothing, log-space) that makes it real, and a measured account of exactly where it
          wins and where it does not. You have also met its discriminative twin in passing — and the crossover
          between them is one of the most useful facts in applied classification.
        </p>
        <p>
          Next, meet that twin in full. <Link href="/learn/logistic-regression" style={link}>Logistic
          regression</Link> draws the same linear boundary from the other direction — modelling P(y|x)
          directly instead of P(x|y) — and the contrast will sharpen everything you just learned. Or step
          back to the <Link href="/map" style={link}>classification family</Link> to see where Naive Bayes
          sits among its geometric cousins.
        </p>

        <PrevNext
          prev={{ href: "/learn/naive-bayes/when-to-use-it", label: <>← When to reach for Naive Bayes</> }}
          next={{ href: "/learn/logistic-regression", label: <>Next track · Logistic regression (the discriminative twin) →</> }}
        />
      </div>
    </article>
  );
}
