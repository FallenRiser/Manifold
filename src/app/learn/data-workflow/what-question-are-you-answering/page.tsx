import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { DecisionPoint } from "@/components/capstone/DecisionPoint";

export const metadata = {
  title: "What question are you answering? — Manifold",
  description:
    "Nobody asks for a model. They ask for a decision to come out better. Working backwards from the decision to the prediction is the step that determines whether anything downstream can possibly be useful.",
};

const GRAY = "var(--c-metrics)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

const CHAIN: { step: string; q: string; example: string }[] = [
  {
    step: "The decision",
    q: "What will somebody do differently because of this?",
    example: "Which 200 of our 40,000 accounts does the retention team call this month?",
  },
  {
    step: "The action's shape",
    q: "How many? How often? Who acts, and what does acting cost?",
    example: "200 calls a month, ~£14 each, one team, a monthly cadence.",
  },
  {
    step: "The prediction",
    q: "What unknown quantity, if known, would make that decision obvious?",
    example: "For each account, the probability it churns in the next 60 days.",
  },
  {
    step: "The target",
    q: "What column, computable from history, is that quantity?",
    example: "1 if no activity in the 60 days after the cut-off, else 0.",
  },
  {
    step: "The metric",
    q: "Given the action's shape, what makes one model better than another?",
    example: "Precision@200 — because you only ever get to call 200.",
  },
];

export default function WhatQuestionPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Before you model", color: GRAY }, { label: "Tier 1 · intuition", color: GRAY }]}
        time="about 7 minutes"
        title={<>What question are you answering?</>}
        intro={<>Nobody has ever actually wanted a model. They wanted a decision to come out better, and somebody
          along the way translated that into a modelling request. Your first job is to translate it back.</>}
      />

      <div className="lesson">
        <h2>The request is a translation, and translations lose things</h2>
        <p>
          &ldquo;Can you build us a churn model?&rdquo; is not a specification. It is the end of a chain of
          reasoning that happened in someone else&rsquo;s head, and the parts that got dropped on the way are
          exactly the parts you need: who acts on the output, how many of them there are, how often, what it costs
          them to be wrong in each direction.
        </p>
        <p>
          Take that request literally and you will build something defensible and useless — a model with excellent
          AUC that predicts churn six months out, handed to a team that can only make two hundred calls a month
          and needs to know who is leaving <em>next week</em>.
        </p>

        <h2>Work backwards from the decision</h2>
        <p>
          The chain runs in one direction, and it starts at the far end from the data. Each row here is a question
          you should be able to answer out loud before you open the dataset.
        </p>
        <div style={{ display: "grid", gap: 8, margin: "1.3rem 0" }}>
          {CHAIN.map((c, i) => (
            <div key={c.step} style={{ display: "flex", gap: 12, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "11px 14px" }}>
              <div className="font-display" style={{ fontSize: 15, fontWeight: 500, color: GRAY, flexShrink: 0, width: 18 }}>{i + 1}</div>
              <div>
                <div className="font-display" style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink)", marginBottom: 2 }}>{c.step}</div>
                <div style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.55 }}>{c.q}</div>
                <div style={{ fontSize: 12.5, color: "var(--faint)", lineHeight: 1.55, marginTop: 3 }}>{c.example}</div>
              </div>
            </div>
          ))}
        </div>
        <p>
          Notice what falls out of the chain for free. The <strong>60-day window</strong> is not a modelling
          choice; it comes from the monthly cadence of the calls. <strong>Precision@200</strong> is not a taste in
          metrics; it comes from the team&rsquo;s capacity. Neither of those was in the original request, and
          neither is recoverable from the data.
        </p>

        <Callout color={GRAY} title={<>The test for whether you have finished this step</>}>
          You can state, in one sentence with no ML vocabulary in it, what will happen differently on a Tuesday
          because this model exists. If you cannot, you do not yet have a problem — you have a dataset and a
          hope.
        </Callout>

        <DecisionPoint
          accent={GRAY}
          question={<>A hospital asks for a model to &ldquo;predict which patients will be readmitted within 30 days.&rdquo; Before touching the data, what is the highest-value question to ask them?</>}
          options={[
            {
              label: "What will you do with the prediction, and for how many patients?",
              verdict: "best",
              response: <>Yes — and it is likely to change everything downstream. If the answer is &ldquo;a nurse calls the top 30 each week&rdquo;, you need a ranking evaluated at k=30, a prediction available <em>at discharge</em>, and only features a discharge record contains. If the answer is &ldquo;we want to understand the drivers for a policy review&rdquo;, you need an interpretable model, no ranking metric at all, and you can happily use features that arrive weeks later.</>,
            },
            {
              label: "What accuracy do you need for this to be worth doing?",
              verdict: "close",
              response: <>A good question, and worth asking — but it is premature and it is usually unanswerable. People cannot calibrate &ldquo;how much accuracy&rdquo; in the abstract; they <em>can</em> tell you what they plan to do, and the required accuracy follows from that plus the cost of each error. Ask the decision question first and this one often answers itself.</>,
            },
            {
              label: "What data do you have available?",
              verdict: "miss",
              response: <>Tempting, because it feels like the practical question, and it is the one that gets asked first almost every time. But asking it first inverts the chain: you end up building whatever the available columns support, and then discovering that it does not fit any decision anyone makes. Availability constrains the solution; it should never be the thing that <em>chooses</em> the problem.</>,
            },
          ]}
        />

        <h2>Three questions that quietly change everything</h2>
        <ul>
          <li><strong>Is this a prediction or an intervention?</strong> &ldquo;Who will churn&rdquo; and &ldquo;who
            would stay if we called them&rdquo; are different questions with different targets, and the second one
            cannot be answered from observational data without an experiment. Most churn models are quietly asked
            to be the second while trained as the first.</li>
          <li><strong>Does the prediction change the outcome?</strong> If the retention team calls the people you
            flag, then the people you flag stop churning, and next year&rsquo;s training data says your
            high-risk accounts were fine. This is a{" "}
            <Link href="/learn/data-workflow/feedback-loops" style={link}>feedback loop</Link>, and it is a
            property of the question, not a bug in the model.</li>
          <li><strong>Who is harmed by a wrong answer, and which direction of wrong?</strong> A false positive in
            fraud detection is an inconvenienced customer; a false negative is a loss. In medical screening the
            asymmetry is far starker and runs the other way. The{" "}
            <Link href="/learn/evaluation/cost-sensitive-thresholds" style={link}>cost-sensitive metrics</Link>{" "}
            pillar can only help you once you have asked this.</li>
        </ul>

        <h2>The output of this step</h2>
        <p>
          Two or three sentences, written down, that you can show to the person who asked. Something like:{" "}
          <em>&ldquo;Each month we rank all active accounts by their probability of going inactive in the next 60
          days, and the retention team calls the top 200. We will judge it on precision within those 200, against
          a baseline of calling the 200 with the lowest recent usage.&rdquo;</em>
        </p>
        <p>
          That paragraph fixes the target, the horizon, the population, the metric, and the baseline — five
          decisions that would otherwise get made accidentally, one at a time, by whoever was typing. We formalise
          it two pages from now as{" "}
          <Link href="/learn/data-workflow/the-framing-contract" style={link}>the framing contract</Link>.
        </p>

        <PrevNext
          prev={{ href: "/learn/data-workflow/the-loop", label: <>← The workflow is a loop</> }}
          next={{ href: "/learn/data-workflow/the-unit-of-analysis", label: <>Next up · What is one row? →</> }}
        />
      </div>
    </article>
  );
}
