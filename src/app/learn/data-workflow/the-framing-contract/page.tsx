import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "The framing contract — Manifold",
  description:
    "Eight lines, written before any modelling, that fix the population, unit, label, horizon, split, metric, baseline and target. The cheapest artefact in the workflow and the one that prevents the most expensive mistakes.",
};

const GRAY = "var(--c-metrics)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

const CONTRACT: { field: string; ask: string; example: string }[] = [
  { field: "Decision", ask: "What happens differently, and who does it?", example: "The retention team calls 200 accounts on the first working day of each month." },
  { field: "Population", ask: "Which rows are eligible to be scored?", example: "Accounts active on the cut-off date with at least 30 days of tenure." },
  { field: "Unit", ask: "What is one row, and what must not span the split?", example: "One account-month. Accounts must not span the split." },
  { field: "Label", ask: "The exact rule, with its window.", example: "1 if zero logins in the 60 days after the cut-off." },
  { field: "Features", ask: "What is knowable at the cut-off?", example: "Anything computable from events strictly before the cut-off." },
  { field: "Split", ask: "What ignorance does deployment impose?", example: "Train on months up to March, test on April onwards; grouped by account." },
  { field: "Metric", ask: "What makes one model better, given the action?", example: "Precision@200, reported per month." },
  { field: "Baseline", ask: "What are we beating, and what would make this not worth doing?", example: "Call the 200 with the lowest 30-day logins. Below that, we stop." },
];

export default function FramingContractPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Framing", color: GRAY }, { label: "Tier 1 · intuition", color: GRAY }]}
        time="about 6 minutes"
        title={<>The framing contract</>}
        intro={<>Eight lines, written before you fit anything, that pin down every decision this chapter has been
          making one at a time. It takes twenty minutes and it is the highest-return artefact in the whole
          workflow.</>}
      />

      <div className="lesson">
        <h2>Why write it down</h2>
        <p>
          Every item below gets decided whether or not you decide it. The population gets set by whatever filter
          was in the query. The horizon gets set by the window someone happened to export. The metric gets set by
          the default in the tutorial you copied. <strong>The contract does not add decisions — it makes the
          existing ones visible and attributable.</strong>
        </p>
        <p>
          It also does something a checklist cannot: it gives you a document to show the person who asked for the
          model, in language they can argue with. Almost every catastrophic framing error is caught in that
          conversation, because the domain expert reads &ldquo;60 days&rdquo; and says <em>oh, we usually see them
          come back after about ninety.</em>
        </p>

        <h2>The eight lines</h2>
        <div style={{ display: "grid", gap: 8, margin: "1.3rem 0" }}>
          {CONTRACT.map((c, i) => (
            <div key={c.field} style={{ display: "flex", gap: 12, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "11px 14px" }}>
              <div className="font-display" style={{ fontSize: 14, fontWeight: 500, color: GRAY, flexShrink: 0, width: 16 }}>{i + 1}</div>
              <div>
                <div className="font-display" style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink)" }}>{c.field}</div>
                <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.55, marginTop: 2 }}>{c.ask}</div>
                <div style={{ fontSize: 12.5, color: "var(--faint)", lineHeight: 1.55, marginTop: 3, fontStyle: "italic" }}>{c.example}</div>
              </div>
            </div>
          ))}
        </div>

        <Callout color={GRAY} title={<>The line people leave out, and shouldn&rsquo;t</>}>
          The second half of line 8: <strong>what would make this not worth doing?</strong> Deciding in advance
          that precision@200 below 0.30 means &ldquo;this problem is not learnable from this data, and we
          stop&rdquo; is the only reliable defence against a project that runs for a year because nobody was
          willing to be the one to end it. Written before you have a score, it is a judgement. Written after, it
          is a negotiation.
        </Callout>

        <h2>How the contract propagates</h2>
        <p>
          Each line constrains what comes later, which is what makes filling it in worth the time:
        </p>
        <ul>
          <li><strong>Unit → split.</strong> The unit is what must not span the split, which selects{" "}
            <code>GroupKFold</code> or a time-ordered split, which changes every number you will report.</li>
          <li><strong>Features → pipeline.</strong> &ldquo;Knowable at the cut-off&rdquo; is a testable claim, and
            it turns into the cut-off-as-argument feature function from{" "}
            <Link href="/learn/data-workflow/what-you-know-at-prediction-time" style={link}>two pages ago</Link>.</li>
          <li><strong>Decision → metric.</strong> &ldquo;200 calls&rdquo; makes precision@200 the metric and makes
            accuracy meaningless, without anyone having to have an opinion about metrics.</li>
          <li><strong>Baseline → the stop condition.</strong> Which is the difference between a project and an
            open-ended activity.</li>
        </ul>

        <h2>See one filled in on real data</h2>
        <p>
          The <Link href="/learn/asteroid-hazard-capstone/research-questions" style={link}>asteroid-hazard
          capstone</Link> works through this on 90,836 near-Earth approaches, and{" "}
          <Link href="/learn/asteroid-hazard-capstone/the-split" style={link}>its split page</Link> shows the
          contract&rsquo;s unit line doing real damage-prevention. The{" "}
          <Link href="/learn/california-housing-capstone/framing" style={link}>housing capstone</Link> does the
          same for a regression problem. Both are worth reading beside your own first attempt at one.
        </p>

        <Quiz
          accent={GRAY}
          title="Chapter checkpoint · framing"
          questions={[
            {
              q: <>You want to predict &ldquo;customer lifetime value&rdquo;, but you only have two years of data and customers routinely stay five. What does the contract force you to confront?</>,
              options: [
                "Nothing — you can extrapolate the two-year value forward",
                "That your label is a two-year value, not a lifetime value, and the model should be described and evaluated as such",
                "That you cannot build this model at all",
              ],
              answer: 1,
              explain: <>The label line has to state a window, and the only honest window here is two years. That is fine — a two-year value model can be genuinely useful — but it must be named accurately, because everything downstream will otherwise be compared against a lifetime figure it never estimated. Extrapolation is a separate modelling problem with its own assumptions; smuggling it into the label makes those assumptions invisible.</>,
            },
            {
              q: <>Which pair of contract lines, if inconsistent with each other, most reliably invalidates your offline results?</>,
              options: [
                "Metric and baseline",
                "Unit and split",
                "Population and label",
              ],
              answer: 1,
              explain: <>If the unit is an account but the split is random over rows, then accounts span the split and every reported number includes recognition rather than generalisation — the 0.569 → 0.044 collapse from earlier in this chapter. The other pairs matter and fail more visibly: an inconsistent metric and baseline produces an argument, not a silently wrong number.</>,
            },
            {
              q: <>What is the strongest argument for writing the contract <em>before</em> looking at model results?</>,
              options: [
                "It is faster than deciding as you go",
                "Every line is a judgement before you have a score and a negotiation after",
                "It is required for reproducibility",
              ],
              answer: 1,
              explain: <>Once a number exists, every framing decision acquires a direction that would improve it, and human beings are extremely good at finding principled-sounding reasons for the choice that helps. Deciding the horizon, the population and the stop condition while you are still ignorant of their effect is the only way those decisions stay honest. Reproducibility is a real benefit and a secondary one.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/data-workflow/regression-classification-or-ranking", label: <>← Regression, classification or ranking?</> }}
          next={{ href: "/learn/data-workflow/eda-with-a-purpose", label: <>Next chapter · EDA with a purpose →</> }}
        />
      </div>
    </article>
  );
}
