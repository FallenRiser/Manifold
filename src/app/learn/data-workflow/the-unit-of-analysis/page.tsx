import Link from "next/link";
import { M } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { GuessSlider } from "@/components/capstone/GuessSlider";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "What is one row? — Manifold",
  description:
    "The unit of analysis is the quietest decision in the whole workflow and it determines your split, your metric, and whether your offline score means anything. Measured: R² 0.569 collapses to 0.044 when the split respects it.",
};

const GRAY = "var(--c-metrics)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

const UNITS: { unit: string; row: string; then: string }[] = [
  {
    unit: "one visit",
    row: "a patient on a date",
    then: "you are predicting outcomes for visits, and the same patient appears many times",
  },
  {
    unit: "one patient",
    row: "a patient, with their visits aggregated",
    then: "you are predicting per person, and you must decide how to summarise a history",
  },
  {
    unit: "one patient-month",
    row: "a patient in a calendar month",
    then: "you get a regular cadence, and a label horizon falls out of it naturally",
  },
];

export default function UnitOfAnalysisPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Before you model", color: GRAY }, { label: "Tier 1 · intuition", color: GRAY }]}
        time="about 8 minutes"
        title={<>What is one row?</>}
        intro={<>It sounds like a formatting question. It is the decision that fixes your population, your label,
          your metric and — most expensively — what an honest train/test split is even allowed to look like.</>}
      />

      <div className="lesson">
        <h2>The same data, three problems</h2>
        <p>
          You are handed a table of hospital visits. Before anything else, you choose what one row of your
          modelling dataset represents. Three defensible answers, and they are not variations on a theme — they
          are three different problems with three different labels and three different notions of a fair test.
        </p>
        <div style={{ display: "grid", gap: 8, margin: "1.3rem 0" }}>
          {UNITS.map((u) => (
            <div key={u.unit} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "11px 14px" }}>
              <div className="font-display" style={{ fontSize: 13.5, fontWeight: 500, color: GRAY, marginBottom: 2 }}>{u.unit}</div>
              <div style={{ fontSize: 13.5, color: "var(--ink)", lineHeight: 1.55 }}>{u.row}</div>
              <div style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.55, marginTop: 3 }}>{u.then}</div>
            </div>
          ))}
        </div>
        <p>
          The right answer comes from the previous page: <strong>the unit of analysis is whatever the decision is
          made about.</strong> If a nurse acts on a patient, the unit is a patient. If a scheduling system acts on
          a visit, the unit is a visit. Choose it from the decision and it will be right; choose it from the shape
          of the CSV you were sent and it will be right only by luck.
        </p>

        <h2>Why this is the expensive decision</h2>
        <p>
          Because the moment one entity spans several rows, a random split puts that entity on both sides of the
          fence. The model does not have to learn anything general — it can recognise the individual and recall
          what happened to them. Your test set is then measuring memory, and reporting it as skill.
        </p>
        <p>
          This is not a subtle statistical correction. Here is a run with 250 patients, six visits each. The
          outcome depends on a per-patient level that no feature explains, plus one measurement that does vary
          from visit to visit. A random forest cross-validated the ordinary way scores <strong>R² 0.569</strong>.
        </p>

        <GuessSlider
          accent={GRAY}
          prompt={<>Now split by <em>patient</em> instead, so every test patient is one the model has never seen — which is what deployment actually means. What does the R² become?</>}
          min={-0.1}
          max={0.6}
          step={0.01}
          start={0.45}
          actual={0.0439}
          decimals={3}
          reveal={<>Effectively nothing. <strong>0.044</strong> — the model was almost entirely recalling which patient it was looking at. The visit-level features carried a real but modest signal, and the random split reported that signal plus 0.525 of pure recognition. Nothing in the code errored, and the ordinary CV number was the one that would have gone in the slide deck.</>}
        />

        <p>
          The mechanism is worth being precise about, because &ldquo;the model memorised the test set&rdquo; is
          too vague to generalise from. Each patient carries stable covariates — things that do not change between
          visits. Those covariates work as a fingerprint. A flexible model learns{" "}
          <em>this fingerprint goes with this outcome level</em>, and on a random split it gets to use that on
          rows from patients it trained on. It is not overfitting in the usual sense; the model is doing exactly
          what it should, on a test set that was never a test.
        </p>

        <Callout color={GRAY} title={<>The rule, stated once</>}>
          <strong>Whatever your unit of analysis is, that is what must not span the split.</strong> If a row is a
          visit but the entity is a patient, you need <code>GroupKFold</code> (or a grouped train/test split) with
          the patient id as the group. The same applies to any repeated entity: users, devices, households, images
          of the same object, sentences from the same document.
        </Callout>

        <h2>Aggregating up has its own trap</h2>
        <p>
          The obvious alternative — collapse to one row per patient and the problem disappears — is often right,
          and it is not free. Summarising a variable-length history into fixed columns is a modelling decision:
          mean, last, max, slope and count answer different questions, and whichever you pick throws away
          everything else. You have converted a leakage risk into an information loss, which is usually a good
          trade, but it is a trade.
        </p>
        <p>
          The second trap is that aggregation invites you to summarise across time <em>including the future</em>.
          A patient&rsquo;s <code>mean_visits_per_year</code> computed over their whole record uses visits that
          happen after your prediction moment. That is the subject of{" "}
          <Link href="/learn/data-workflow/what-you-know-at-prediction-time" style={link}>the next chapter</Link>,
          and it is the most common way a careful person leaks.
        </p>

        <h2>Unequal rows per entity distort your metric too</h2>
        <p>
          Even with a correct split, if one patient contributes 40 rows and another contributes 2, your
          row-averaged metric is a weighted average that silently over-weights the heavy contributors. With{" "}
          <M>{String.raw`n_i`}</M> rows for entity <M>i</M>, the row-level mean weights each entity by{" "}
          <M>{String.raw`n_i`}</M>, not equally. If your decision is made per entity, so should your metric be:
          score within entity, then average across entities.
        </p>
        <p>
          It is a small correction and it is exactly the sort of thing that turns a model that looks fine offline
          into one that is unreliable for the many small accounts nobody was measuring.
        </p>

        <Quiz
          accent={GRAY}
          title="Checkpoint"
          questions={[
            {
              q: <>You have one row per <em>transaction</em>, and the business decides whether to block a <em>card</em>. Random 5-fold CV gives 0.94 AUC. What is the most likely problem?</>,
              options: [
                "Nothing — AUC is a robust metric and 5 folds is standard",
                "The same card is in train and test, so the model can recognise cards rather than fraud",
                "You should use 10 folds instead of 5 for a more stable estimate",
              ],
              answer: 1,
              explain: <>The decision is made per card, so the card is the entity and it must not span the split. With transactions as rows, a random split scatters each card&rsquo;s transactions across folds, and card-level fingerprints (merchant mix, typical amount, home city) let the model recall rather than generalise. Fold count is irrelevant to this — every fold has the same defect.</>,
            },
            {
              q: <>You aggregate to one row per customer and compute <code>total_spend</code> over each customer&rsquo;s entire history. What have you introduced?</>,
              options: [
                "Nothing — aggregation removes the group-leakage problem",
                "Leakage, because the total includes spending that happens after the moment you are predicting from",
                "Only a loss of information from collapsing the history",
              ],
              answer: 1,
              explain: <>Aggregation does fix the grouping problem, and it creates a new one: any summary computed over the <em>whole</em> record includes the future relative to your prediction point. The fix is to aggregate only over the window that ends at the cut-off — which means the cut-off has to be an explicit part of your framing, not something implied by the file you were given.</>,
            },
            {
              q: <>Which of these should decide your unit of analysis?</>,
              options: [
                "The granularity of the table you were given",
                "The thing the downstream decision is made about",
                "Whichever gives you the most rows to train on",
              ],
              answer: 1,
              explain: <>The unit of analysis is a framing decision, not a data-shape one. Choosing by table granularity means the ETL author picked your problem for you; choosing by row count optimises for a training-set size that may not correspond to any real quantity of independent information — 5,000 rows from 250 patients is closer to 250 examples than 5,000.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/data-workflow/what-question-are-you-answering", label: <>← What question are you answering?</> }}
          next={{ href: "/learn/data-workflow/designing-the-label", label: <>Next up · Designing the label →</> }}
        />
      </div>
    </article>
  );
}
