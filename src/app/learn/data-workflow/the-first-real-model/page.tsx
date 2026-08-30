import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { DecisionPoint } from "@/components/capstone/DecisionPoint";

export const metadata = {
  title: "The first real model — Manifold",
  description:
    "Choose by the shape of the data and the constraints of the deployment, not by what is fashionable. A decision table for the first serious model, and why it should be boring.",
};

const GRAY = "var(--c-metrics)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

const TABLE: { shape: string; reach: string; href?: string; why: string }[] = [
  {
    shape: "Tabular, mixed types, n from a few thousand up",
    reach: "Gradient-boosted trees",
    href: "/learn/boosting",
    why: "the reliable default for tabular data; handles missing values, mixed types and interactions without help",
  },
  {
    shape: "Tabular, small n (a few hundred), many columns",
    reach: "Regularized linear or logistic regression",
    href: "/learn/regularized-regression",
    why: "boosting needs data to earn its capacity; a penalised linear model degrades gracefully instead",
  },
  {
    shape: "You must explain every prediction to a regulator",
    reach: "Linear/logistic, or a shallow tree",
    href: "/learn/logistic-regression",
    why: "interpretability is a hard constraint, not a preference — it eliminates model families rather than ranking them",
  },
  {
    shape: "Strong known functional form, few features",
    reach: "Linear regression with the right basis",
    href: "/learn/polynomial-regression",
    why: "when you know the shape, imposing it beats learning it — and it needs far less data",
  },
  {
    shape: "Images, audio, free text",
    reach: "A pretrained model, fine-tuned",
    why: "the representation is the hard part and someone else has already paid for it",
  },
  {
    shape: "Genuine time series with trend and seasonality",
    reach: "A time-series baseline first",
    why: "seasonal-naive is startlingly hard to beat, and a tabular model with lag features must beat it to justify itself",
  },
];

export default function FirstModelPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "From baseline to better", color: GRAY }, { label: "Tier 2 · practitioner", color: GRAY }]}
        time="about 7 minutes"
        title={<>The first real model</>}
        intro={<>The choice is far less consequential than it feels, and the ways of getting it wrong are
          consistent enough to tabulate. Read it off the shape of the data and the constraints of the deployment —
          not off what is currently interesting.</>}
      />

      <div className="lesson">
        <h2>Read it off the data</h2>
        <div style={{ display: "grid", gap: 8, margin: "1.3rem 0" }}>
          {TABLE.map((t) => (
            <div key={t.shape} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "11px 14px" }}>
              <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>{t.shape}</div>
              <div className="font-display" style={{ fontSize: 14, fontWeight: 500, color: GRAY, margin: "3px 0 2px" }}>
                {t.href ? <Link href={t.href} style={{ color: GRAY, textDecoration: "none" }}>{t.reach} →</Link> : t.reach}
              </div>
              <div style={{ fontSize: 12.5, color: "var(--faint)", lineHeight: 1.5 }}>{t.why}</div>
            </div>
          ))}
        </div>

        <Callout color={GRAY} title={<>The two rows that are constraints rather than preferences</>}>
          Interpretability requirements and latency budgets do not rank model families — they{" "}
          <strong>delete</strong> them. A 40-millisecond serving budget or a regulatory requirement to explain
          every adverse decision eliminates most of the table before performance is discussed. Find these out in
          the framing conversation, because discovering them after you have a tuned ensemble is how good models
          get thrown away.
        </Callout>

        <h2>Why the first model should be boring</h2>
        <p>
          It exists to close the loop, not to win. A well-understood model with sensible defaults gives you three
          things a novel one does not: you can tell whether a poor result is the data or the model, you can debug
          it, and its failure modes are documented rather than discovered by you.
        </p>
        <p>
          There is also a measurement argument. Every model family you try spends a little of your evaluation
          budget — the{" "}
          <Link href="/learn/model-selection/the-selection-trap" style={link}>selection optimism</Link> that the
          model-selection pillar measures at <strong>+0.006</strong> for a 20-point grid and far more for a wide
          search. Trying eight families before you have looked at a single error is spending that budget to learn
          almost nothing, because at this stage the differences between families are usually smaller than the
          effect of one fixed data bug.
        </p>

        <DecisionPoint
          accent={GRAY}
          question={<>You have 800 rows, 40 mixed-type columns, and a binary target at 12% positive. Your dummy baseline is 0.88 accuracy. What do you fit first?</>}
          options={[
            {
              label: "Regularized logistic regression in a pipeline, scored with average precision",
              verdict: "best",
              response: <>800 rows is not much for 40 columns, and a penalised linear model degrades gracefully where a flexible one will overfit and then be tuned in circles. Just as important: switching from accuracy to average precision. At 12% positive, accuracy is dominated by the negatives — the dummy already gets 0.88 — so it cannot distinguish a useful model from a useless one, which is exactly the trap the <Link href="/learn/data-workflow/start-with-a-baseline" style={link}>previous page</Link> measured.</>,
            },
            {
              label: "Gradient boosting with default hyperparameters",
              verdict: "close",
              response: <>Entirely reasonable and it is what the table recommends for tabular data — the caveat is the row count. Boosting earns its capacity from data, and at 800 rows with 40 columns you are in the regime where a regularised linear model is often as good and much easier to reason about. Worth fitting <em>alongside</em>, and the comparison itself is informative: if boosting does not beat the linear model here, the signal is close to linear and you have learnt something.</>,
            },
            {
              label: "Resample to balance the classes, then fit a random forest",
              verdict: "miss",
              response: <>Two problems compounding. Resampling before the split leaks — synthetic or duplicated minority rows land in the test folds, which is the preprocessing leakage from chapter four. And the class imbalance is not itself the problem; the <em>metric</em> is. Fixing the metric costs one line and changes what you can see. Resampling changes the data to suit a metric you should not have been using.</>,
            },
          ]}
        />

        <h2>Fit it end to end before you improve any part of it</h2>
        <p>
          Load, split, pipeline, fit, score, look at the errors, write the number down. All of it, once, however
          crudely. Only then decide what to improve — and by then the errors will have told you, which is the
          subject of the next page.
        </p>
        <p>
          The alternative, which is what most people do, is to perfect each stage before moving on. It feels more
          rigorous and it systematically wastes effort, because you cannot know which stage was worth perfecting
          until the whole thing has run at least once.
        </p>

        <h2>Two knobs are worth setting before you look at anything</h2>
        <ul>
          <li><strong>The metric</strong>, from your framing contract. Not accuracy unless you have argued for it.
            The <Link href="/learn/evaluation" style={link}>evaluation pillar</Link> exists for this decision.</li>
          <li><strong><code>class_weight=&quot;balanced&quot;</code> or its equivalent</strong> where the classes
            are skewed. One argument, no data modification, no leakage risk — and it is nearly always a better
            first move than resampling.</li>
        </ul>

        <PrevNext
          prev={{ href: "/learn/data-workflow/start-with-a-baseline", label: <>← Start with a baseline</> }}
          next={{ href: "/learn/data-workflow/error-analysis", label: <>Next up · Error analysis →</> }}
        />
      </div>
    </article>
  );
}
