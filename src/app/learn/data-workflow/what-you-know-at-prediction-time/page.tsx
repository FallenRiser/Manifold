import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeBlock } from "@/components/CodeBlock";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "What you know at prediction time — Manifold",
  description:
    "The single most valuable habit in applied machine learning: for every feature, ask whether its value would actually have been available at the moment the model is asked. Most leakage is a failure to ask.",
};

const GRAY = "var(--c-metrics)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

const CULPRITS: { feature: string; why: string }[] = [
  {
    feature: "account_status",
    why: "updated to 'closed' when they churn — the label wearing a disguise",
  },
  {
    feature: "num_support_calls",
    why: "counted over the customer's whole record, including calls made after the cut-off",
  },
  {
    feature: "last_updated_at",
    why: "rows touched recently are usually the ones something happened to",
  },
  {
    feature: "diagnosis_code",
    why: "assigned at discharge, but the model is meant to run at admission",
  },
  {
    feature: "region_avg_price",
    why: "an average computed over the full dataset, so every row's target contributed to its own feature",
  },
];

const CODE = `# The time-travel test, as code you can actually run.
#
# For every feature, ask: at the moment of prediction, what was the value?
# The only reliable way to answer is to build features from a window that
# ENDS at the cut-off, and to make the cut-off an explicit argument.

def build_features(events, cut_off, horizon_days=60):
    """Features from strictly before cut_off; label from strictly after."""
    past = events[events.timestamp < cut_off]          # everything we may see
    future = events[(events.timestamp >= cut_off) &
                    (events.timestamp < cut_off + horizon_days)]

    X = past.groupby("account_id").agg(
        logins_30d=("login", lambda s: s.tail(30).sum()),
        tenure_days=("timestamp", lambda s: (cut_off - s.min()).days),
        support_calls=("support_call", "sum"),
    )
    y = (future.groupby("account_id")["login"].sum() == 0).astype(int)
    return X, y.reindex(X.index, fill_value=1)

# Because cut_off is an argument, you can generate many training snapshots --
# and the same function serves production, where cut_off is simply "now".
# A feature function that cannot be called with an arbitrary cut_off is a
# feature function that cannot be trusted.`;

export default function PredictionTimePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Framing", color: GRAY }, { label: "Tier 1 · intuition", color: GRAY }]}
        time="about 8 minutes"
        title={<>What you know at prediction time</>}
        intro={<>If you take one habit from this pillar, take this one. For every column you are about to use, ask
          whether its value would genuinely have been sitting there at the moment the model gets asked. Most
          leakage dies to that question.</>}
      />

      <div className="lesson">
        <h2>The time-travel test</h2>
        <p>
          Fix the moment of prediction. Not a vague &ldquo;in production&rdquo; — an actual instant: the customer
          hits the checkout page, the patient is admitted, the batch job runs at 06:00 on the first of the month.
          Now, for each feature, ask a question with a yes-or-no answer:{" "}
          <strong>at that instant, was this value already known and already correct?</strong>
        </p>
        <p>
          Two failure modes hide behind a &ldquo;no&rdquo;. The value might not exist yet — a discharge diagnosis
          for a model that runs at admission. Or the value might exist but be <em>different</em> later, because
          the field is mutable and your training data has the final version. The second is nastier, because the
          column looks entirely innocent and its history is gone.
        </p>

        <h2>Where it hides</h2>
        <div style={{ display: "grid", gap: 7, margin: "1.3rem 0" }}>
          {CULPRITS.map((c) => (
            <div key={c.feature} style={{ display: "flex", gap: 12, alignItems: "baseline", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "9px 13px" }}>
              <code style={{ fontSize: 12.5, color: GRAY, flexShrink: 0 }}>{c.feature}</code>
              <span style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>{c.why}</span>
            </div>
          ))}
        </div>
        <p>
          The last one deserves attention because it is the one careful people write. Computing a group mean over
          the whole dataset feels like preprocessing rather than cheating — but every row&rsquo;s target
          contributed to its own feature, and at prediction time you would only have had the statistic from
          history. It is the same mistake as fitting a scaler outside the fold, and it is measured in{" "}
          <Link href="/learn/data-workflow/the-many-faces-of-leakage" style={link}>the leakage chapter</Link>.
        </p>

        <Callout color={GRAY} title={<>The smell that should always stop you</>}>
          <strong>A feature that is far more predictive than any domain expert expects is a leak until proven
          otherwise.</strong> Real signal is usually modest and spread across many columns. A single column that
          carries most of the performance is nearly always the label in a costume, and the ten minutes spent
          checking is the cheapest ten minutes in the project.
        </Callout>

        <h2>Make the cut-off an argument</h2>
        <p>
          The structural fix is to stop treating &ldquo;now&rdquo; as implicit. Write feature construction as a
          function of an explicit cut-off timestamp, build everything from a window that ends there, and take the
          label from a window that starts there. Then the same function runs in training and in production, and
          the class of bug simply cannot be expressed.
        </p>
        <CodeBlock fromScratch={CODE} />
        <p>
          There is a bonus that makes this worth doing even where leakage is not a worry. Because the cut-off is a
          parameter, you can generate many <strong>snapshots</strong> of the same entity at different moments,
          which multiplies your training data honestly and makes the model robust to when it is asked. It also
          forces the grouping question from{" "}
          <Link href="/learn/data-workflow/the-unit-of-analysis" style={link}>the previous chapter</Link> into the
          open: multiple snapshots of one account must not span the split.
        </p>

        <h2>What if the feature is genuinely unavailable but very useful?</h2>
        <p>
          This comes up constantly and there are only three honest answers, none of which is &ldquo;use it
          anyway&rdquo;.
        </p>
        <ul>
          <li><strong>Move the prediction moment.</strong> If the diagnosis code is what matters, perhaps the
            model should run at discharge rather than admission — which changes the decision it supports. That is
            a conversation with the person who asked, not a modelling choice.</li>
          <li><strong>Find its earlier shadow.</strong> Whatever produced the late-arriving value usually left
            traces before the cut-off: symptoms before diagnosis, browsing before purchase. Those are legitimate
            features and typically weaker, which is the honest signal strength.</li>
          <li><strong>Build the feature pipeline so it can be produced in time.</strong> Sometimes the value{" "}
            <em>could</em> be available and simply isn&rsquo;t plumbed through. That is an engineering task with a
            measurable payoff, and it is a perfectly good project outcome.</li>
        </ul>

        <Quiz
          accent={GRAY}
          title="Checkpoint · chapter so far"
          questions={[
            {
              q: <>A feature called <code>days_since_last_purchase</code> is computed as <code>today − last_purchase_date</code> using the date the dataset was exported. What is wrong with it?</>,
              options: [
                "Nothing, this is a standard recency feature",
                "It is measured from export time, not from each row's prediction moment, so it encodes how long ago the row happened",
                "It should be log-transformed because recency is skewed",
              ],
              answer: 1,
              explain: <>Recency is a good feature; measuring it from the wrong origin is the problem. Anchored to export date, the value tells you where the row sits in the dataset&rsquo;s history rather than how recently that customer bought <em>as of the moment you were predicting</em>. Older rows get systematically larger values, and if your label also depends on time — most do — the feature is now a partial copy of it. The fix is the same one as everywhere on this page: measure from an explicit per-row cut-off.</>,
            },
            {
              q: <>Your model reaches 0.99 AUC on a problem where the domain expert expected around 0.75. What should you do first?</>,
              options: [
                "Ship it — you have clearly found signal others missed",
                "Look at feature importances and check the top feature against the time-travel test",
                "Add regularization, since 0.99 suggests overfitting",
              ],
              answer: 1,
              explain: <>A large gap between measured and expected performance is evidence about your <em>pipeline</em>, not about your cleverness. Overfitting is not the explanation either — overfitting hurts held-out scores rather than inflating them. The realistic cause is that one feature is carrying the label forward in time, and the fastest way to find it is to rank the features by importance and time-travel-test the top few.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/data-workflow/designing-the-label", label: <>← Designing the label</> }}
          next={{ href: "/learn/data-workflow/regression-classification-or-ranking", label: <>Next up · Regression, classification or ranking? →</> }}
        />
      </div>
    </article>
  );
}
