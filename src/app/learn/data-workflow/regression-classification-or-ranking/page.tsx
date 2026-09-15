import Link from "next/link";
import { M } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { DecisionPoint } from "@/components/DecisionPoint";

export const metadata = {
  title: "Regression, classification or ranking? — Manifold",
  description:
    "The task type is not dictated by the data — it is chosen, and the choice follows from the shape of the action. Why thresholding early throws away information you cannot get back.",
};

const GRAY = "var(--c-metrics)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

const TASKS: { task: string; when: string; metric: string; tell: string }[] = [
  {
    task: "Regression",
    when: "the action scales with the magnitude — how much stock, how much credit, how long to allocate",
    metric: "RMSE, MAE, or a quantile loss if the cost is asymmetric",
    tell: "someone will multiply your output by something",
  },
  {
    task: "Binary classification",
    when: "there is one action with a genuine yes/no gate — block or allow, treat or don't",
    metric: "chosen from the cost of each error direction; almost never accuracy",
    tell: "there is a threshold somebody has to defend",
  },
  {
    task: "Ranking / top-k",
    when: "capacity is fixed and you can only act on so many — 200 calls, 30 reviews, 10 slots",
    metric: "precision@k, recall@k, NDCG — evaluated at the k you actually have",
    tell: "the answer to 'how many can you handle?' is a number",
  },
  {
    task: "Probability estimation",
    when: "the output feeds another calculation — expected value, pricing, a downstream optimiser",
    metric: "log loss or Brier, plus an explicit calibration check",
    tell: "the number itself gets used, not just its order or its side of a line",
  },
];

export default function TaskChoicePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Framing", color: GRAY }, { label: "Tier 1 · intuition", color: GRAY }]}
        time="about 7 minutes"
        title={<>Regression, classification or ranking?</>}
        intro={<>This gets treated as a property of the data — continuous target means regression, categories mean
          classification. It isn&rsquo;t. It is a choice, and it follows from the shape of the action, not the
          dtype of a column.</>}
      />

      <div className="lesson">
        <h2>The same target, four tasks</h2>
        <p>
          You have, for each customer, the amount they will spend next quarter. That is a number, so: regression.
          Except you could also predict whether they will spend more than nothing (classification), or rank
          customers so the sales team can work the top hundred (ranking), or estimate the probability of each
          spend band to feed a revenue forecast (probability estimation). All four are legitimate, all four use
          the same underlying quantity, and they are not interchangeable.
        </p>
        <div style={{ display: "grid", gap: 8, margin: "1.3rem 0" }}>
          {TASKS.map((t) => (
            <div key={t.task} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "11px 14px" }}>
              <div className="font-display" style={{ fontSize: 13.5, fontWeight: 500, color: GRAY, marginBottom: 3 }}>{t.task}</div>
              <div style={{ fontSize: 13.5, color: "var(--ink)", lineHeight: 1.55 }}>Use it when {t.when}.</div>
              <div style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.55, marginTop: 3 }}>Judged by {t.metric}.</div>
              <div style={{ fontSize: 12, color: "var(--faint)", lineHeight: 1.5, marginTop: 3 }}>The tell: {t.tell}.</div>
            </div>
          ))}
        </div>

        <h2>The default mistake: thresholding too early</h2>
        <p>
          The most common framing error in this chapter is taking a continuous target and cutting it into classes
          because classification feels more tractable. &ldquo;High value customer&rdquo; defined as spend &gt;
          £100 turns a rich target into one bit, and the damage is worse than it looks.
        </p>
        <p>
          Someone spending £101 and someone spending £4,000 become the same label, so the model is explicitly told
          not to distinguish them. Someone at £99 and someone at £101 become opposite labels, so the model is told
          to work hard on a distinction that is mostly noise. You have simultaneously discarded the signal that
          matters and manufactured a hard problem that doesn&rsquo;t.
        </p>

        <Callout color={GRAY} title={<>The rule</>}>
          <strong>Predict the finest-grained thing you can, and threshold the prediction, not the target.</strong>{" "}
          A regression output can be turned into any classification you like afterwards — and the threshold
          becomes a runtime dial you can move when the business changes its mind, rather than a retraining job.
          The exception is when the coarse version is genuinely all that is recorded, in which case you have no
          choice.
        </Callout>

        <h2>Ranking is under-used and usually the honest one</h2>
        <p>
          When capacity is fixed, ranking is what is actually happening whether you framed it that way or not. If
          the team can call 200 accounts, then a classifier&rsquo;s threshold is a fiction — you will sort by
          score and take the top 200 regardless of which side of 0.5 they land on. Framing it as ranking from the
          start changes three things for the better: you stop arguing about a threshold, you evaluate at{" "}
          <M>k = 200</M> where the decision lives, and the class imbalance that made the classification metrics
          awkward becomes irrelevant.
        </p>
        <p>
          It also changes what &ldquo;better&rdquo; means. A model that is superb at separating the obvious
          negatives — most of what accuracy and AUC reward — is worth nothing here. All that matters is the order
          near the top. This is exactly the gap that{" "}
          <Link href="/learn/evaluation/roc-auc-and-pr-curves" style={link}>precision–recall curves</Link> exist
          to expose.
        </p>

        <DecisionPoint
          accent={GRAY}
          question={<>A logistics team wants to know which of 12,000 shipments will be delayed, so they can pre-emptively re-route. They have the capacity to re-route about 300 per day. How do you frame it?</>}
          options={[
            {
              label: "Rank all shipments by delay risk, evaluate at k = 300",
              verdict: "best",
              response: <>This matches the action exactly. The team never makes a yes/no decision about a shipment in isolation — they work down a list until the day&rsquo;s capacity is gone. Evaluating at k=300 measures the only thing that affects outcomes: how many genuine delays land in the top 300. It also sidesteps the threshold argument entirely, and it stays correct when capacity changes to 250 or 400.</>,
            },
            {
              label: "Regression on hours of delay, then re-route the largest predicted delays",
              verdict: "close",
              response: <>Defensible and often better than it sounds, because hours-of-delay carries more information than a binary flag and a three-hour delay may genuinely matter more than a twenty-minute one. The catch is that you are then ranking by predicted magnitude when the thing worth ranking by is <em>expected benefit of re-routing</em>, which depends on probability and magnitude together. Good instinct, one step short.</>,
            },
            {
              label: "Binary classification with a threshold tuned for F1",
              verdict: "miss",
              response: <>This is the reflex answer and it fails on the specific thing that matters here. F1 balances precision and recall at some threshold chosen by the metric, not at the capacity you actually have — you will end up flagging 800 shipments or 90, neither of which is 300. The threshold is then quietly overridden by whoever builds the daily list, which means the number you optimised and the number you shipped were never the same.</>,
            },
          ]}
        />

        <h2>A note on multi-class and the temptation to collapse</h2>
        <p>
          When the target has many categories, the reflex is to collapse rare ones into an &ldquo;other&rdquo;
          bucket. Sometimes right, and worth one thought first: the rare classes are frequently the ones the
          project exists for. Collapsing the four rare failure modes into &ldquo;other&rdquo; produces a model
          that is excellent at the routine and mute about the interesting, which is the opposite of what was
          wanted. If the rare classes matter, the honest options are a hierarchical model or per-class metrics —
          not a bucket.
        </p>

        <PrevNext
          prev={{ href: "/learn/data-workflow/what-you-know-at-prediction-time", label: <>← What you know at prediction time</> }}
          next={{ href: "/learn/data-workflow/the-framing-contract", label: <>Next up · The framing contract →</> }}
        />
      </div>
    </article>
  );
}
