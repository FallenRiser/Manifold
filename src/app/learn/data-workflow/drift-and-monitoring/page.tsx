import Link from "next/link";
import { M } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { DriftLab } from "@/components/labs/DriftLab";

export const metadata = {
  title: "Drift & monitoring — Manifold",
  description:
    "Covariate shift and concept drift are different failures, and the two obvious monitors are each blind to one of them. Measured: a monitor that screams while accuracy is fine, and a collapse it never sees.",
};

const GRAY = "var(--c-metrics)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function DriftPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Beyond the notebook", color: GRAY }, { label: "Tier 2 · practitioner", color: GRAY }]}
        time="about 9 minutes"
        title={<>Drift &amp; monitoring</>}
        intro={<>A model is a claim that the future resembles the past. Monitoring is how you find out when that
          stops being true — and the two things people monitor are each blind to a different way it can
          fail.</>}
      />

      <div className="lesson">
        <h2>Two failures that share a name</h2>
        <p>
          &ldquo;Drift&rdquo; gets used for both, and they behave completely differently.
        </p>
        <ul>
          <li><strong>Covariate shift</strong> — <M>{String.raw`P(x)`}</M> changes, <M>{String.raw`P(y \mid x)`}</M>{" "}
            does not. Your customer mix shifts younger. The rule the model learnt is still correct; it is just
            being applied to a different population.</li>
          <li><strong>Concept drift</strong> — <M>{String.raw`P(y \mid x)`}</M> itself changes. A competitor
            launches, a regulation changes, a fraud ring adapts. The same inputs now imply a different answer, and
            the model is wrong in a way no amount of the old data can fix.</li>
        </ul>

        <PredictPrompt
          accent={GRAY}
          prompt={<>Your input-distribution monitor fires hard — one feature's mean has moved a full training standard deviation. What has most likely happened to accuracy?</>}
          options={[
            "It has fallen sharply — that's what the alarm is for",
            "It may not have moved at all, if the relationship between x and y is unchanged",
            "It has improved, since the model now sees a narrower range of inputs",
          ]}
        />

        <LabFrame
          accent={GRAY}
          tryThis={<>Run the covariate-shift scenario to month 4 and read both lines. Then switch to concept drift and do the same, watching the orange line rather than the blue one.</>}
          insight={<>Under covariate shift the monitor climbs from <strong>0.02 to 0.98</strong> — well past any sane alert threshold — while accuracy sits flat at <strong>0.81</strong>. A pure false alarm. Under concept drift accuracy collapses <strong>0.825 → 0.262</strong> and the monitor never leaves <strong>0.02–0.04</strong>. It cannot see this at all. The two monitors answer different questions and neither substitutes for the other.</>}
        >
          <DriftLab />
        </LabFrame>

        <Callout color={GRAY} title={<>Why the false alarm happens, and why it is not a bug</>}>
          In the covariate-shift run the inputs move along a direction <em>orthogonal to the decision rule</em>.
          The points genuinely relocate — the monitor is reporting something true — but they relocate parallel to
          the boundary, so nothing about their classification changes. A well-specified model is robust to
          covariate shift by construction: it learnt <M>{String.raw`P(y \mid x)`}</M>, and that is exactly what
          did not move. This is why input-drift alerts have such a poor reputation with on-call engineers, and the
          reputation is deserved rather than a tuning failure.
        </Callout>

        <h2>The 2×2 you are actually managing</h2>
        <p>
          Put the two monitors against the two failures and every cell is occupied:
        </p>
        <ul>
          <li><strong>Inputs moved, performance fine</strong> — a false alarm. Expensive in trust: enough of these
            and the alert gets muted, which is how the real one gets missed.</li>
          <li><strong>Inputs stable, performance collapsed</strong> — the dangerous cell. Concept drift is
            invisible to input monitoring, and if your labels arrive slowly you may not learn about it for weeks.</li>
          <li><strong>Both moved</strong> — the easy case, and the one people design for.</li>
          <li><strong>Neither moved</strong> — fine, and worth confirming rather than assuming.</li>
        </ul>

        <h2>What to actually monitor, in priority order</h2>
        <ol>
          <li><strong>Business outcomes.</strong> Conversions, losses prevented, hours saved. The only measure
            that cannot be gamed by a modelling artefact, and the last one anybody wires up.</li>
          <li><strong>Performance on whatever labels arrive</strong>, however delayed and however biased. Delayed
            truth beats no truth. Be explicit that labels observed only for acted-on cases are a biased sample.</li>
          <li><strong>The prediction distribution.</strong> Available immediately, needs no labels, and moves for
            both kinds of drift — the mean predicted probability drifting from 0.12 to 0.31 is a strong signal
            that something changed on either side.</li>
          <li><strong>Input distributions,</strong> per feature. Cheap and noisy. Best used for{" "}
            <em>diagnosis after</em> another signal fires, rather than as the thing that pages you.</li>
          <li><strong>Data quality and volume.</strong> The most common real production failure is not drift at
            all — it is a feature that started arriving null after an upstream deploy. The{" "}
            <Link href="/learn/data-workflow/sanity-checks" style={link}>check function</Link> from chapter three
            belongs in the serving path, not just in training.</li>
        </ol>

        <Callout color={GRAY} title={<>The delayed-label problem, and the standard answer</>}>
          If churn is defined over 60 days, you cannot measure this month&rsquo;s performance for two months. Two
          things help. <strong>Hold out a small random control</strong> that the model does not act on, so you
          always have unbiased labels — expensive, and the only clean measurement available. And{" "}
          <strong>find a fast proxy</strong> that correlates with the outcome and arrives in hours, monitored as an
          early-warning signal rather than as truth.
        </Callout>

        <h2>Retraining is not automatically the fix</h2>
        <p>
          The reflex answer to drift is to retrain on recent data, and it is right for concept drift and often
          useless for covariate shift — where, as the lab shows, nothing was wrong. Retraining on a schedule has
          real costs: each retrain is a new model with new failure modes, and an automatic pipeline retrained on
          data your own model produced is the feedback loop of{" "}
          <Link href="/learn/data-workflow/feedback-loops" style={link}>the next page</Link>.
        </p>
        <p>
          A defensible retraining policy names a trigger and a gate. Trigger: performance on arrived labels drops
          below a stated threshold, or a scheduled interval passes. Gate: the retrained model must beat the
          incumbent on a held-out recent period before it replaces it. Without the gate, &ldquo;retrain
          weekly&rdquo; is a mechanism for silently deploying worse models.
        </p>

        <h2>Decide the failure modes before you launch</h2>
        <p>
          Write down, before anything ships: what the model does when a feature is missing at serving time, what
          the fallback is if the model is unavailable, who is paged and on what signal, and what the rollback
          procedure is. These questions have obvious answers in advance and no good ones at 3am.
        </p>

        <PrevNext
          prev={{ href: "/learn/data-workflow/reproducibility", label: <>← Reproducibility</> }}
          next={{ href: "/learn/data-workflow/feedback-loops", label: <>Next up · Feedback loops →</> }}
        />
      </div>
    </article>
  );
}
