import Link from "next/link";
import { M } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { GuessSlider } from "@/components/capstone/GuessSlider";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "Start with a baseline — Manifold",
  description:
    "A score means nothing on its own. Measured: 98.7% accuracy that is worth +0.04 over guessing, and an R² of −0.03 that proves the mean is a real competitor.",
};

const GRAY = "var(--c-metrics)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

const LADDER: { rung: string; what: string; tells: string }[] = [
  { rung: "The constant", what: "predict the majority class, or the mean", tells: "how much of your score is the class balance" },
  { rung: "The one-rule model", what: "the single best feature, thresholded", tells: "whether the problem needs a model at all" },
  { rung: "The current process", what: "whatever humans or rules do today", tells: "the only baseline the business actually cares about" },
  { rung: "The simple model", what: "logistic or linear regression on raw columns", tells: "how much your feature engineering and model complexity are worth" },
];

const CODE = `from sklearn.dummy import DummyClassifier, DummyRegressor

# Run these on the same CV split as everything else, and put the numbers
# at the top of your results table. Every later row is judged against them.

DummyClassifier(strategy="most_frequent")   # the class-balance floor
DummyClassifier(strategy="stratified")      # random guessing at base rates
DummyRegressor(strategy="mean")             # R^2 = 0 by construction
DummyRegressor(strategy="quantile", quantile=0.5)   # the MAE-optimal constant

# And the one nobody codes, which matters most: reproduce the CURRENT
# process as a scikit-learn estimator, so it appears in the same table
# with the same CV protocol. "We already do this by hand with a rule" is
# the baseline your model has to beat to be worth deploying.`;

export default function BaselinePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "From baseline to better", color: GRAY }, { label: "Tier 2 · practitioner", color: GRAY }]}
        time="about 7 minutes"
        title={<>Start with a baseline</>}
        intro={<>&ldquo;The model gets 98.7% accuracy&rdquo; is not a result. It is half of one. Without the
          number that trivially-obtainable performance sits at, it carries no information at all.</>}
      />

      <div className="lesson">
        <h2>Two numbers that look identical and are not</h2>
        <p>
          Here are two real 5-fold cross-validated runs of the same model class — a scaled logistic regression —
          on the same underlying data.
        </p>
        <p>
          On the full breast-cancer dataset (n = 569, 62.7% positive), it reaches{" "}
          <strong>0.9789</strong> accuracy. Guessing the majority class every time reaches{" "}
          <strong>0.6274</strong>. The model contributed <strong>+0.3515</strong>, and that is a genuinely strong
          result.
        </p>
        <p>
          Now subsample the same problem to 5.4% positive (n = 224), which is closer to what real detection
          problems look like. The same model reaches <strong>0.9867</strong> accuracy — a <em>higher</em> number
          than before.
        </p>

        <GuessSlider
          accent={GRAY}
          prompt={<>What does the majority-class baseline score on that imbalanced version?</>}
          min={0.5}
          max={1.0}
          step={0.005}
          start={0.7}
          actual={0.9465}
          decimals={4}
          reveal={<><strong>0.9465.</strong> The model&rsquo;s entire contribution is <strong>+0.0402</strong> — an eighth of what it was worth on the balanced version, reported as a higher headline number. Anyone shown &ldquo;98.7% accuracy&rdquo; without the baseline would conclude the second model was the better one.</>}
        />

        <p>
          This is not a curiosity about accuracy specifically. It is the general point:{" "}
          <strong>a metric value is a position, and a position is only meaningful relative to an origin.</strong>{" "}
          The baseline is the origin. Reporting a score without one is like reporting a temperature without a
          scale.
        </p>

        <Callout color={GRAY} title={<>R² has its origin built in, and it is worth noticing why</>}>
          <M>{String.raw`R^2`}</M> is defined as the improvement over predicting the mean, so it is a metric with
          a baseline pre-subtracted — which is exactly why it feels more interpretable than RMSE. On the diabetes
          dataset the mean-predictor scores <strong>−0.0275</strong> under cross-validation (slightly negative,
          because each fold&rsquo;s mean is estimated from the other folds) and ridge scores{" "}
          <strong>0.4822</strong>. Most metrics do not have this built in, so you have to supply it.
        </Callout>

        <h2>The baseline ladder</h2>
        <p>
          Not one baseline — four, each answering a different question about where your performance comes from.
        </p>
        <div style={{ display: "grid", gap: 8, margin: "1.3rem 0" }}>
          {LADDER.map((l, i) => (
            <div key={l.rung} style={{ display: "flex", gap: 12, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "11px 14px" }}>
              <div className="font-display" style={{ fontSize: 14, fontWeight: 500, color: GRAY, flexShrink: 0, width: 16 }}>{i + 1}</div>
              <div>
                <div className="font-display" style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink)" }}>{l.rung}</div>
                <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.55, marginTop: 2 }}>{l.what}</div>
                <div style={{ fontSize: 12.5, color: "var(--faint)", lineHeight: 1.55, marginTop: 2 }}>Tells you {l.tells}.</div>
              </div>
            </div>
          ))}
        </div>
        <p>
          Rung 3 is the one that gets skipped and the one that decides whether the project ships.{" "}
          <strong>Nobody is choosing between your model and random guessing.</strong> They are choosing between
          your model and the spreadsheet rule the team already uses, which is free, already trusted, and probably
          better than you expect. If you cannot beat it, that is the finding — and it is worth far more than a
          model nobody adopts.
        </p>
        <CodeBlock fromScratch={CODE} />

        <h2>The baseline is also a bug detector</h2>
        <p>
          Two failure modes announce themselves immediately if a baseline is in the table, and are nearly
          invisible without one.
        </p>
        <ul>
          <li><strong>The model scores below the constant baseline.</strong> Something is genuinely broken —
            reversed labels, a shuffled join, a target column that is not the target. Without a baseline you see a
            mediocre score and start tuning.</li>
          <li><strong>The model scores far above every baseline, immediately.</strong> Which is the leakage tell
            from <Link href="/learn/data-workflow/the-many-faces-of-leakage" style={link}>chapter four</Link>. The
            baseline gives you a scale on which &ldquo;far above&rdquo; is a measurable claim rather than a
            feeling.</li>
        </ul>

        <h2>Where the loop closes</h2>
        <p>
          The baseline&rsquo;s other job is structural, and it is the argument from{" "}
          <Link href="/learn/data-workflow/the-loop" style={link}>the first page of this pillar</Link>: it
          completes the circuit. Once a prediction exists, error analysis becomes possible, and error analysis is
          the thing that tells you which stage to go back to. A baseline reached in an hour is worth more than a
          good model reached in a week, because it is what turns the next week&rsquo;s work from guessing into
          diagnosis.
        </p>

        <PrevNext
          prev={{ href: "/learn/data-workflow/feature-engineering", label: <>← Feature engineering</> }}
          next={{ href: "/learn/data-workflow/the-first-real-model", label: <>Next up · The first real model →</> }}
        />
      </div>
    </article>
  );
}
