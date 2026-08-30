import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { DW_DONE, DW_TOTAL } from "@/lib/dataWorkflowTrack";

export const metadata = {
  title: "The data workflow — Manifold",
  description:
    "Given raw data, what do you actually do? The framing, cleaning, feature and diagnosis decisions that decide a project's outcome long before any model is fitted — with the cost of each wrong default measured on real runs.",
};

const GRAY = "var(--c-metrics)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

const CHAPTERS: { name: string; href: string; blurb: string; topics: string }[] = [
  {
    name: "Before you model",
    href: "/learn/data-workflow/the-loop",
    blurb: "The loop the linear tutorials hide, the question behind the request, and the one decision that silently sets everything else.",
    topics: "the loop · the real question · what is one row?",
  },
  {
    name: "Framing",
    href: "/learn/data-workflow/designing-the-label",
    blurb: "Your label is a thing you built, not a thing you found — and the model can only use what exists at the moment it is asked.",
    topics: "label design · prediction-time knowledge · task choice · the contract",
  },
  {
    name: "Meeting the data",
    href: "/learn/data-workflow/eda-with-a-purpose",
    blurb: "Exploration as hypothesis-generation, with a list of questions to bring — and the checks that catch a disaster on day one.",
    topics: "purposeful EDA · distributions · confounds · sanity checks",
  },
  {
    name: "Data quality & leakage",
    href: "/learn/data-workflow/missing-data",
    blurb: "Holes, extremes, and the family of mistakes that make an offline score a fiction.",
    topics: "MCAR/MAR/MNAR · influence · four kinds of leakage · pipelines",
  },
  {
    name: "Preparing features",
    href: "/learn/data-workflow/preprocessing-is-modelling",
    blurb: "Every transform is an assumption you are adding to the model, whether or not you meant to.",
    topics: "encoding · scaling · transforms · feature engineering",
  },
  {
    name: "From baseline to better",
    href: "/learn/data-workflow/start-with-a-baseline",
    blurb: "The number you must beat, the model to reach for first, and how to read your own mistakes for the next move.",
    topics: "baselines · first model · error analysis · what to do next",
  },
  {
    name: "Beyond the notebook",
    href: "/learn/data-workflow/reproducibility",
    blurb: "Everything that decides whether the work survives contact with next month, next quarter, and other people.",
    topics: "reproducibility · drift · feedback loops · the playbook",
  },
];

export default function DataWorkflowHub() {
  return (
    <article>
      <LessonHeader
        chips={[
          { label: "The data workflow", color: GRAY },
          { label: DW_DONE >= DW_TOTAL ? `Complete · ${DW_TOTAL} pages` : `${DW_DONE} of ${DW_TOTAL} pages`, color: GRAY },
        ]}
        time="a pillar track"
        title={<>What you actually do with data</>}
        intro={<>Every course teaches you to fit a model. Almost none teach you the two weeks on either side of it —
          which is where the outcome of a real project is actually decided. This pillar is those two weeks.</>}
        titleSize={44}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>The claim this pillar rests on</h2>
        <p>
          <strong>Model quality is decided before the model.</strong> Not by the algorithm you pick — by what you
          decided the question was, what you let one row mean, which rows you threw away, what your features are
          allowed to know, and how you split the data. Choose those well and a logistic regression is often enough.
          Choose them badly and no amount of gradient boosting will save you; it will just help you be wrong with
          more confidence.
        </p>
        <p>
          The uncomfortable version: <strong>most of the ways a machine learning project fails produce a
          beautiful-looking score.</strong> A broken split does not throw an exception. Leakage does not warn you.
          A mis-specified label validates perfectly. The model reports back exactly what you asked, and the whole
          skill is knowing what you actually asked.
        </p>

        <Callout color={GRAY} title={<>What that costs, in numbers we measured</>}>
          Fit a feature selector on all your data before cross-validating, on a dataset containing{" "}
          <em>no signal whatsoever</em>, and 5-fold CV reports <strong>0.878</strong> accuracy where the truth is
          0.500. Split a dataset of repeated patient visits at random rather than by patient, and{" "}
          <span style={{ whiteSpace: "nowrap" }}>R² 0.569</span> becomes <strong>0.044</strong> the moment you test
          on a patient the model has never met. Neither run errored. Both were real runs in{" "}
          <code>scripts/data_workflow_cases.py</code>.
        </Callout>

        <h2>How this pillar teaches</h2>
        <p>
          Not as a checklist. There <em>is</em> a checklist — it&rsquo;s the last page — but a checklist you
          can&rsquo;t derive is a thing you abandon the first time reality doesn&rsquo;t match it. So each chapter
          takes one class of decision, shows you the default that feels right, and then shows you what that default
          costs. By the end the checklist should read as obvious rather than as instructions.
        </p>
        <p>
          Two things recur. The first is a question: <strong>what will this model actually know at the moment it is
          asked?</strong> Nearly every leakage bug is a failure to answer it. The second is a habit:{" "}
          <strong>before you fix anything, find out where the errors actually are.</strong> Most of the effort in a
          stalled project is spent on the wrong term.
        </p>

        <h2>The seven chapters</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(258px, 1fr))", gap: 14, margin: "1.2rem 0" }}>
          {CHAPTERS.map((c) => (
            <Link key={c.name} href={c.href} className="gcard" style={{ ["--accent" as string]: GRAY, display: "block", textDecoration: "none", padding: "14px 16px" }}>
              <div className="font-display" style={{ fontSize: 15.5, fontWeight: 500, color: GRAY, marginBottom: 4 }}>{c.name}</div>
              <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.55, margin: "0 0 8px" }}>{c.blurb}</p>
              <div style={{ fontSize: 11, color: "var(--faint)", lineHeight: 1.5 }}>{c.topics}</div>
            </Link>
          ))}
        </div>

        <h2>Where this sits among the other pillars</h2>
        <p>
          <Link href="/learn/evaluation" style={link}>Evaluation &amp; metrics</Link> owns the question{" "}
          <em>which number should we be looking at</em>.{" "}
          <Link href="/learn/model-selection" style={link}>Model selection</Link> owns{" "}
          <em>how to choose among candidates without fooling yourself</em>. This pillar owns everything else: the
          framing, the data, the features, the diagnosis, and life after deployment. The three overlap at the split
          — which is fitting, because the split is where all three pillars agree the danger is.
        </p>
        <p>
          If you would rather watch the whole arc run end to end on one real dataset before studying the parts, the{" "}
          <Link href="/learn/california-housing-capstone" style={link}>housing</Link> and{" "}
          <Link href="/learn/asteroid-hazard-capstone" style={link}>asteroid-hazard</Link> capstones are exactly
          that, and this pillar is the theory of what they do.
        </p>

        <h2>Every number here is measured</h2>
        <p>
          The claims in this pillar are quantitative because vague ones are unfalsifiable and therefore useless.
          All of them come from <code>scripts/data_workflow_cases.py</code>, run on python 3.13.11 / sklearn 1.8.0,
          with the protocol stated on the page. Where the honest answer is that an effect is small, we say so —
          knowing which mistakes don&rsquo;t matter is half of knowing which ones do.
        </p>

        <PrevNext
          prev={{ href: "/map", label: <>← The map</> }}
          next={{ href: "/learn/data-workflow/the-loop", label: <>Start · The workflow is a loop →</> }}
        />
      </div>
    </article>
  );
}
