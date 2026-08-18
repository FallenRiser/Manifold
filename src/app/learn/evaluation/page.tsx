import { M } from "@/components/Math";
import { ImbalanceLab } from "@/components/labs/ImbalanceLab";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LabFrame } from "@/components/LabFrame";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { EVAL_DONE, EVAL_TOTAL } from "@/lib/evaluationTrack";

const ACCENT = "var(--c-metrics)";

export const metadata = {
  title: "Accuracy is a trap — Manifold",
  description: "A model can be 95% accurate and completely useless. This pillar is about the one skill every metric depends on: choosing the number that matches what a mistake actually costs.",
};

export default function EvaluationHubPage() {
  return (
    <article>
      <LessonHeader
        chips={[
          { label: "Evaluation & metrics", color: ACCENT },
          { label: `In progress · ${EVAL_DONE} of ${EVAL_TOTAL} pages`, color: "var(--c-fundamentals)" },
        ]}
        time="about 7 minutes"
        title={<>Accuracy is a trap</>}
        intro={<>
          You trained a model and it&rsquo;s 95% accurate. Ship it? Not yet — that one number can hide
          a model that never does the one thing you built it for. Learning to evaluate is learning
          which number to <em>trust</em>, and this pillar is where every track&rsquo;s &ldquo;how good
          is it?&rdquo; gets answered honestly.
        </>}
        titleSize={44}
        introSize={17.5}
      />

      <div className="lesson">
        <p>
          Here&rsquo;s a real one. A bank wants to flag loans that will default. In the data,{" "}
          <strong>6.8% of borrowers default</strong> — 61 out of 900. You fit a perfectly reasonable
          classifier, check its accuracy, and get <strong>94.7%</strong>. That sounds like a triumph.
          It is a disaster.
        </p>

        <h2>The lazy baseline you have to beat</h2>
        <p>
          Before celebrating any accuracy number, ask what the dumbest possible model scores. Here the
          dumbest model is &ldquo;<em>nobody defaults</em>&rdquo; — predict the majority class every
          single time, no data required. Since only 6.8% default, that constant guess is right{" "}
          <strong>93.2%</strong> of the time. So your fancy 94.7% model beats a rock by one and a half
          points. Accuracy on imbalanced data is graded on a curve that starts near 100%.
        </p>

        <PredictPrompt
          accent={ACCENT}
          prompt={<>The 94.7%-accurate model is scored on the 61 real defaulters it was built to catch. How many of them do you think it actually flags?</>}
          options={["Most of them — around 50 of 61", "About half — 30 or so", "Almost none — under 15"]}
          nudge={<>Pick one, then switch the lab to &ldquo;Default · threshold 0.5&rdquo; and read the &ldquo;caught&rdquo; cell.</>}
        />

        <LabFrame
          accent={ACCENT}
          tryThis={<>Start on <code>Default · threshold 0.5</code> and read the confusion matrix. Then flip to <code>class_weight=&apos;balanced&apos;</code> and to <code>threshold 0.10</code> — watch accuracy <em>fall</em> while the model gets more useful.</>}
          insight={<>The default model catches <strong>13 of 61</strong> defaulters — it misses <strong>79%</strong> of the
            exact thing it exists to find. The two fixes both <em>lower</em> headline accuracy and both <em>raise</em>
            recall, because they stop optimising the wrong number. Accuracy went down; the model got better. Hold onto
            that sentence — the rest of this pillar explains it.</>}
        >
          <ImbalanceLab />
        </LabFrame>

        <h2>Why one number can never be enough</h2>
        <p>
          A classifier makes two <em>different</em> kinds of mistake: it can raise a false alarm (flag a
          borrower who would have repaid) or it can miss (wave through one who defaults). Accuracy
          blends both into a single average, so it can&rsquo;t tell you which one you&rsquo;re making —
          and in almost every real problem the two cost wildly different amounts. A missed cancer is not
          a missed advert. Any honest evaluation has to keep the two mistakes <em>separate</em>, and then
          weigh them by what they actually cost you.
        </p>

        <Callout color={ACCENT} title={<>The throughline of this pillar</>}>
          There is no universally &ldquo;best&rdquo; metric — only the metric that matches what a mistake
          costs <em>in your problem</em>. The next five pages build the toolkit: the confusion matrix
          (where every metric is born), precision/recall/F1 (naming the two mistakes), ROC and PR curves
          (grading the model independently of the threshold), calibration (are the probabilities honest?),
          and cost-sensitive thresholds (turning a dollar cost into the cutoff you actually deploy).
        </Callout>

        <p>
          One framing to carry through all of it: a trained classifier doesn&rsquo;t output
          &ldquo;yes&rdquo; or &ldquo;no,&rdquo; it outputs a <strong>score</strong> — a number like{" "}
          <M>{String.raw`P(\text{default}) = 0.31`}</M>. Turning that score into a decision needs a{" "}
          <strong>threshold</strong>, and choosing the threshold is a business decision, not a
          mathematical one. Every metric in this pillar is really a lens on that choice. We start with
          the object all of them are computed from: the confusion matrix.
        </p>

        <Quiz
          accent={ACCENT}
          questions={[
            {
              q: "A dataset is 99% class A. A model predicts 'A' for everything. Its accuracy is…",
              options: ["About 50%", "99% — but it's useless", "Undefined"],
              answer: 1,
              explain: "Predicting the majority class scores 99% here without learning anything. That's exactly why accuracy alone is dangerous on imbalanced data — always compare against the majority-class baseline.",
            },
            {
              q: "The fraud model is 94.7% accurate but catches only 13 of 61 defaulters. The best description is…",
              options: ["High accuracy, low recall — it barely finds the thing it was built for", "Low accuracy, high recall", "A well-rounded model"],
              answer: 0,
              explain: "Accuracy is high because it's right about the 93% who don't default. Recall — the share of true defaulters it catches — is only 21%. Those are different questions, and only one of them matters here.",
            },
            {
              q: "Why can't a single accuracy number tell you if a classifier is deployable?",
              options: ["It rounds off decimals", "It merges two different mistakes (false alarms vs misses) that usually cost very different amounts", "It's only defined for balanced data"],
              answer: 1,
              explain: "Accuracy averages false positives and false negatives together. Real decisions hinge on the balance between them — a missed default and a false alarm are not interchangeable.",
            },
          ]}
        />

        <PrevNext next={{ href: "/learn/evaluation/the-confusion-matrix", label: <>Next up · The confusion matrix →</> }} />
      </div>
    </article>
  );
}
