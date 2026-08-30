import Link from "next/link";
import { M } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { SimpsonsParadoxLab } from "@/components/labs/SimpsonsParadoxLab";

export const metadata = {
  title: "Relationships & confounds — Manifold",
  description:
    "Every pairwise relationship you find is a relationship in the presence of everything you didn't condition on. Simpson's paradox, measured: four clinics each with a +0.7 slope, pooling to −0.95.",
};

const GRAY = "var(--c-metrics)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function RelationshipsPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Meeting the data", color: GRAY }, { label: "Tier 1 · intuition", color: GRAY }]}
        time="about 8 minutes"
        title={<>Relationships &amp; confounds</>}
        intro={<>A correlation is never a property of two columns. It is a property of two columns{" "}
          <em>in the presence of everything you did not condition on</em> — and the difference is large enough to
          reverse the sign.</>}
      />

      <div className="lesson">
        <h2>The most dangerous plot in EDA</h2>
        <p>
          Two columns, a scatter, a trend line. It is the plot that produces the sentences people repeat in
          meetings — <em>&ldquo;more treatment time is associated with worse outcomes&rdquo;</em> — and it is the
          plot most likely to be describing a group you forgot to look at rather than a relationship in the world.
        </p>

        <PredictPrompt
          accent={GRAY}
          prompt={<>You plot outcome against hours of treatment for 240 patients and the fitted slope is clearly negative: more hours, worse outcomes. You then split the same points by clinic. What are the four within-clinic slopes most likely to look like?</>}
          options={[
            "Also negative, roughly matching the pooled slope",
            "All positive — the opposite sign to the pooled one",
            "Mixed, some positive and some negative, averaging out to negative",
          ]}
        />

        <LabFrame
          accent={GRAY}
          tryThis={<>Read the pooled slope first and take it seriously — it is a real least-squares fit on all 240 real points. Then split by clinic.</>}
          insight={<>Every single clinic has a positive slope, between <strong>+0.69</strong> and <strong>+0.84</strong>. The pooled fit is <strong>−0.95</strong>. This is not a compromise between the groups or a noisy version of them — it points the other way. Sicker patients are sent to the clinics that give more hours, so &ldquo;hours&rdquo; is partly a measurement of <em>how sick you already were</em>, and pooling lets that dominate.</>}
        >
          <SimpsonsParadoxLab />
        </LabFrame>

        <p>
          This is <strong>Simpson&rsquo;s paradox</strong>, and the word &ldquo;paradox&rdquo; oversells the
          mystery. The pooled slope and the within-group slopes are answers to two different questions.{" "}
          <em>Among all patients, how does outcome vary with hours?</em> — that is the pooled fit, and it is
          genuinely −0.95. <em>For a given patient, how would outcome change with more hours?</em> — that is the
          within-clinic fit, and it is genuinely positive. Only the second is the question anyone cares about, and
          only the first is what the naive plot shows.
        </p>

        <Callout color={GRAY} title={<>The habit that prevents this</>}>
          Whenever you look at a bivariate relationship, ask: <strong>what determines which rows are at the high
          end of x?</strong> If the answer is anything other than &ldquo;chance&rdquo;, you have a confound, and
          the relationship you are looking at is partly a description of that selection process. Grouping
          variables — clinic, region, cohort, device, vintage — are where confounds live.
        </Callout>

        <h2>Why this matters for a model, not just for a slide</h2>
        <p>
          It is tempting to file this under &ldquo;statistics, not machine learning&rdquo; — a model with both{" "}
          <M>{String.raw`\text{hours}`}</M> and <M>{String.raw`\text{clinic}`}</M> as inputs will recover the
          within-clinic effect fine, and prediction is not causation anyway. Two reasons that comfort is
          misplaced.
        </p>
        <ul>
          <li><strong>You will be asked what the model learnt.</strong> Feature importances, coefficients and SHAP
            values are all read as statements about the world by whoever receives them. A coefficient fitted
            without the confound says the opposite of the truth, and it says it in a table that looks
            authoritative.</li>
          <li><strong>Somebody will act on it.</strong> The moment a prediction is used to choose an intervention
            — cut treatment hours, because they correlate with worse outcomes — the confounded relationship stops
            being harmlessly predictive and starts causing harm. Framing this as{" "}
            <Link href="/learn/data-workflow/what-question-are-you-answering" style={link}>prediction versus
            intervention</Link> is a question you were supposed to have asked in chapter one.</li>
        </ul>

        <h2>Three more relationship traps in the same family</h2>
        <ul>
          <li><strong>Correlation only sees straight lines.</strong> Pearson&rsquo;s <M>r</M> on a clean U-shape is
            near zero. A feature can be perfectly predictive and score 0.00 on the correlation table you used to
            decide what to keep. Look at scatters, or use a rank or mutual-information measure, before dropping
            anything.</li>
          <li><strong>Aggregates are not individuals.</strong> A relationship measured on regional averages need
            not hold for people within a region — the ecological fallacy, which is Simpson&rsquo;s paradox with a
            geography. Any feature built by joining a group-level statistic onto individual rows inherits this.</li>
          <li><strong>Conditioning can create dependence as easily as remove it.</strong> If two independent
            causes both raise the chance of being <em>in your dataset</em>, they will appear negatively correlated
            inside it. Filtering your population — an eminently reasonable thing to do — can manufacture
            relationships that do not exist outside the filter.</li>
        </ul>

        <h2>What to actually do</h2>
        <p>
          Not &ldquo;condition on everything&rdquo;: that has its own failure modes, and a full treatment belongs
          to causal inference rather than this pillar. The practical discipline is smaller and gets you most of
          the way.
        </p>
        <ol>
          <li>List the grouping variables in your data before you plot anything — cohort, site, region, device,
            vintage, source system.</li>
          <li>For any relationship you intend to <em>say something about</em>, re-plot it split by each of them.
            It takes one extra line and it is where the surprises are.</li>
          <li>When a relationship reverses under splitting, the split version is nearly always the one that
            answers the question you meant. Say so explicitly in whatever you write up.</li>
        </ol>

        <PrevNext
          prev={{ href: "/learn/data-workflow/one-variable-at-a-time", label: <>← One variable at a time</> }}
          next={{ href: "/learn/data-workflow/sanity-checks", label: <>Next up · Sanity checks that catch disasters →</> }}
        />
      </div>
    </article>
  );
}
