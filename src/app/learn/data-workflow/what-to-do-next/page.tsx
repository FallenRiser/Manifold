import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "What to do next — Manifold",
  description:
    "Six things you can spend the next two weeks on, and the evidence that selects between them. The diagnosis-to-action table that turns error analysis into a decision.",
};

const GRAY = "var(--c-metrics)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

const ACTIONS: { evidence: string; action: string; not: string }[] = [
  {
    evidence: "Train and validation curves have converged, at a ceiling below what you need",
    action: "Change the model or add features — you are approximation-limited",
    not: "collect more data. It attacks a term that is already spent",
  },
  {
    evidence: "A large train/validation gap, validation still climbing with n",
    action: "More data, or more regularization — you are estimation-limited",
    not: "add capacity. It widens the gap you are trying to close",
  },
  {
    evidence: "Reading the rows shows many labels are simply wrong",
    action: "Fix the labels. Relabel a sample, measure the error rate, and re-derive your ceiling",
    not: "tune. Your metric is capped below 100% by the label noise",
  },
  {
    evidence: "Errors concentrate in one slice with a specific, nameable cause",
    action: "Fix that cause — a feature for it, a repaired join, a separate model, or exclude the slice",
    not: "optimise the aggregate. It will move by a fraction of what fixing the slice moves",
  },
  {
    evidence: "Identical feature vectors carry different outcomes",
    action: "Get new information — a new data source, a new sensor, a domain conversation",
    not: "any modelling at all. This is the irreducible floor and no algorithm crosses it",
  },
  {
    evidence: "Everything looks healthy and you are near the baseline you set out to beat",
    action: "Tune. This is the one situation where hyperparameter search is the best use of your time",
    not: "assume tuning was ever going to be the lever earlier on",
  },
];

export default function WhatToDoNextPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "From baseline to better", color: GRAY }, { label: "Tier 2 · practitioner", color: GRAY }]}
        time="about 8 minutes"
        title={<>What to do next</>}
        intro={<>You have a model, a score, and a slice table. Six things could plausibly occupy the next two
          weeks and only one of them is right. This page is how the evidence picks.</>}
      />

      <div className="lesson">
        <h2>The table</h2>
        <p>
          Read down the left column until you find the evidence you actually have. The right column is what people
          do instead, which is usually whichever action they are most comfortable performing.
        </p>
        <div style={{ display: "grid", gap: 9, margin: "1.3rem 0" }}>
          {ACTIONS.map((a) => (
            <div key={a.evidence} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 15px" }}>
              <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>{a.evidence}</div>
              <div className="font-display" style={{ fontSize: 13.5, fontWeight: 500, color: GRAY, margin: "4px 0 3px" }}>→ {a.action}</div>
              <div style={{ fontSize: 12, color: "var(--bad)", lineHeight: 1.5 }}>Do not {a.not}.</div>
            </div>
          ))}
        </div>

        <Callout color={GRAY} title={<>The first two rows are one plot</>}>
          Converged-at-a-ceiling versus still-separated-and-climbing is read directly off a learning curve, and
          the two diagnoses point in opposite directions. The{" "}
          <Link href="/learn/model-selection/learning-curves" style={link}>learning curves page</Link> measures
          both on real runs: a capped model whose curves close to a gap of <strong>0.0011</strong> and stop
          improving at 32%, and a well-matched one still gaining 1.8 points over the same stretch of extra data.
          It is fifteen minutes of compute and it can save a quarter of data collection.
        </Callout>

        <h2>Measure the label noise before you chase the last five points</h2>
        <p>
          Row three deserves elaboration because the number involved is usually a surprise. Take 200 rows,
          relabel them independently, and compute how often the two labels disagree. If they disagree 4% of the
          time, then <strong>96% is approximately a perfect score</strong>, and a team pushing from 93% to 97% is
          pushing past the point where the target itself is meaningful.
        </p>
        <p>
          That measurement takes a day, and it converts an open-ended optimisation into a bounded one. It also
          frequently reveals that the labelling <em>guideline</em> is ambiguous — in which case fixing the
          guideline improves every future label, which is a far larger win than any modelling change.
        </p>

        <h2>Two more actions that belong on the list and rarely get considered</h2>
        <ul>
          <li><strong>Change the decision, not the model.</strong> If the least-confident quarter holds nearly all
            the errors — as measured on the{" "}
            <Link href="/learn/data-workflow/error-analysis" style={link}>previous page</Link> — routing that
            quarter to a human removes most of them today, without retraining anything. Selective prediction is
            frequently the cheapest large improvement available.</li>
          <li><strong>Stop.</strong> If you are at the ceiling, the label is noisy, the baseline is close and the
            remaining gain is not worth the engineering, the correct action is to write that up and ship what you
            have. This is why the framing contract asks for a stop condition <em>before</em> you have a score —
            it is much harder to decide honestly afterwards.</li>
        </ul>

        <h2>One change at a time, against a fixed protocol</h2>
        <p>
          Whatever you pick, change one thing and re-measure on the same split with the same metric. Two
          simultaneous changes give you one number and no attribution, and the two changes routinely cancel.
        </p>
        <p>
          And keep a running log — what you tried, what it scored, what you concluded. Not for tidiness: because
          the number of things you have tried is exactly the quantity that determines how optimistic your final
          reported score is, and it is the quantity you will be unable to reconstruct in three months. The{" "}
          <Link href="/learn/model-selection/nested-cross-validation" style={link}>model selection pillar</Link>{" "}
          measures that optimism at <strong>+0.006</strong> for a modest 20-point grid; over a long project with
          hundreds of informal comparisons it is considerably larger and entirely invisible.
        </p>

        <Quiz
          accent={GRAY}
          title="Chapter checkpoint · baseline to better"
          questions={[
            {
              q: <>Training accuracy 0.99, validation 0.71, and validation is still rising as you add data. What is indicated?</>,
              options: [
                "A more powerful model — the validation score is too low",
                "More data or more regularization — the gap is large and still closing",
                "Better features — the model cannot express the relationship",
              ],
              answer: 1,
              explain: <>A wide gap that is still narrowing is the signature of estimation error: the model has plenty of capacity — arguably too much, given it nearly memorises the training set — and not enough data to pin it down. More capacity widens the gap. More data or stronger regularization closes it, and the rising validation curve is direct evidence that more data will still buy something.</>,
            },
            {
              q: <>Error analysis shows 30% of your errors come from one acquisition channel that is 8% of traffic. What is the highest-value next step?</>,
              options: [
                "Train a separate model for that channel",
                "Look at fifty of those rows and find out what is different about them",
                "Add channel as a feature and retrain",
              ],
              answer: 1,
              explain: <>The table told you <em>where</em>; only the rows tell you <em>what</em>, and the cause determines which fix is right. If the channel is missing a field, the fix is a join repair. If its labels come from a different process, the fix is the labelling guideline. If the population genuinely differs, a separate model or a channel feature may help. Choosing the fix before reading the rows is choosing at random among three that look equally plausible from the table alone.</>,
            },
            {
              q: <>You have relabelled 200 rows and the two labellers disagree 6% of the time. Your model is at 93%. What does this tell you?</>,
              options: [
                "The model has 7 points of headroom remaining",
                "You are close to the noise ceiling, and further gains are increasingly against the label rather than the phenomenon",
                "The labels are unusable and the project should stop",
              ],
              answer: 1,
              explain: <>A 6% disagreement rate means roughly 94% is where a perfect predictor of the &ldquo;true&rdquo; label would land against these labels. At 93% you are close to that, so the remaining measurable gap is mostly label noise. The right responses are to improve the labelling guideline, or to accept the ceiling and stop — not to keep tuning against a target that has become mostly noise. Stopping the whole project is an overreaction: 6% disagreement is normal for many real tasks.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/data-workflow/error-analysis", label: <>← Error analysis</> }}
          next={{ href: "/learn/data-workflow/reproducibility", label: <>Next chapter · Reproducibility →</> }}
        />
      </div>
    </article>
  );
}
