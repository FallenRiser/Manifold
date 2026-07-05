import { ThresholdLab } from "@/components/labs/ThresholdLab";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LabFrame } from "@/components/LabFrame";
import { Term } from "@/components/Term";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

const ACCENT = "var(--c-classification)";

export const metadata = {
  title: "Thresholds & the confusion matrix — Manifold",
  description: "The model outputs probabilities; someone still has to decide. The threshold is a business decision, and the confusion matrix is its price list.",
};

export default function ThresholdsPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: ACCENT }, { label: "Core idea", color: "var(--c-fundamentals)" }]}
        time="about 10 minutes"
        title={<>Thresholds &amp; the confusion matrix</>}
        intro={<>
          Training is over — the model hands you a probability. But &ldquo;0.62&rdquo; approves no
          loans and flags no tumours. Somebody has to pick the cutoff, and that choice belongs to
          the problem, not the algorithm.
        </>}
      />

      <div className="lesson">
        <p>
          Everything so far treated 0.5 as the obvious cutoff, and for balanced problems with
          symmetric stakes it is. But stakes are rarely symmetric. A cancer screen that misses a
          tumour (a <em>false negative</em>) is a catastrophe; a false alarm is a stressful week
          and a follow-up test. A spam filter is the mirror image: a real email lost to the spam
          folder hurts more than one spam message slipping through. Same mathematics, opposite
          preferred mistakes.
        </p>

        <h2>Four ways to be right or wrong</h2>
        <p>
          Fix a threshold and every prediction lands in one of four cells — the{" "}
          <Term accent={ACCENT} def={<>The 2×2 table of prediction vs truth: true positives, false positives, false negatives, true negatives. Every classification metric — accuracy, precision, recall, F1 — is some ratio of these four cells.</>}>confusion matrix</Term>.
          Two kinds of right (true positives, true negatives) and two kinds of wrong: the{" "}
          <strong>false positive</strong> (cried wolf) and the <strong>false negative</strong>{" "}
          (missed the wolf). From those four cells come the two numbers practitioners argue about:
        </p>
        <p>
          <Term accent={ACCENT} def={<>Of everything the model flagged positive, what fraction really was? TP / (TP + FP). High precision = few false alarms.</>}>Precision</Term>{" "}
          — when the model says yes, how often is it right? — and{" "}
          <Term accent={ACCENT} def={<>Of everything that truly was positive, what fraction did the model catch? TP / (TP + FN). High recall = few missed cases. Also called sensitivity.</>}>recall</Term>{" "}
          — of all the real yeses out there, how many did it catch? The threshold trades one
          against the other, and you can feel the trade directly:
        </p>

        <PredictPrompt
          accent={ACCENT}
          prompt={<>You slide the cutoff from 0.5 down to 0.2. What happens to precision and recall?</>}
          options={["Both improve — lower bar, more catches", "Recall rises, precision falls", "Precision rises, recall falls"]}
          nudge={<>Locked in. Drag the slider left in the lab and watch both readouts — and which colour of mistake appears.</>}
        />

        <LabFrame
          accent={ACCENT}
          tryThis={<>Find the threshold that catches every true positive (recall 100%). Then find the one where the model is never wrong when it says yes (precision 100%). Note how far apart they are — and what each costs.</>}
          insight={<>There is no threshold where both are perfect — the mixed zone in the middle (real scores from a real
            model, remember) makes that impossible. Every cutoff is a choice about <em>which mistake you&rsquo;d rather
            make</em>. Accuracy stays within a few points across a wide band while precision and recall swing wildly —
            which is why &ldquo;92% accurate&rdquo; tells you almost nothing about a classifier until you ask what it&rsquo;s
            like at the boundary.</>}
        >
          <ThresholdLab />
        </LabFrame>

        <h2>Who should pick the number?</h2>
        <p>
          Not the model, and honestly, not you alone. The threshold encodes the relative cost of
          the two mistakes, and those costs live in the domain: the oncologist knows what a missed
          tumour costs; the fraud team knows how many false alarms their analysts can review per
          day. The data scientist&rsquo;s job is to hand over the <em>whole curve</em> of options
          — &ldquo;at cutoff 0.3 we catch 95% of fraud and flag 40 legitimate customers a day; at
          0.6, 80% and nine&rdquo; — and let the stakeholder pick the point. Delivering a bare
          &ldquo;accuracy: 92%&rdquo; hides exactly the decision that matters.
        </p>

        <Callout color={ACCENT} title={<>Why the probability output is the superpower</>}>
          This page is secretly the argument for logistic regression itself. A model that emitted
          only hard yes/no verdicts would lock the threshold decision inside the algorithm.
          Because logistic regression outputs calibrated probabilities, the same trained model
          serves the cautious oncologist and the pragmatic spam filter — they just read it at
          different cutoffs. Never throw the probabilities away and store only the labels.
        </Callout>

        <Quiz
          accent={ACCENT}
          questions={[
            {
              q: "A screening model for a rare disease must miss as few true cases as possible, even at the cost of extra follow-up tests. You should move the threshold…",
              options: ["Up (e.g. 0.5 → 0.8)", "Down (e.g. 0.5 → 0.2)", "Thresholds don't affect misses"],
              answer: 1,
              explain: "Lowering the bar flags more people, which converts false negatives (missed cases) into true positives — recall rises. The price is more false positives: the follow-up tests you agreed to tolerate.",
            },
            {
              q: "Your model shows 97% accuracy on a dataset where 97% of examples are class 0. What's the trap?",
              options: ["Nothing — 97% is excellent", "It may be predicting 'class 0' for everything and catching zero positives", "Accuracy can't exceed the class balance"],
              answer: 1,
              explain: "A model that always says 'no' scores 97% here while having recall 0 — useless. With imbalanced classes, accuracy is nearly meaningless; you must look at precision and recall (this is why the lab's readouts diverge from accuracy).",
            },
            {
              q: "Precision is 100% but recall is 40%. In plain words, the model…",
              options: ["Is wrong 60% of the time when it says yes", "Never cries wolf, but misses most of the wolves", "Catches everything but with many false alarms"],
              answer: 1,
              explain: "Perfect precision means every 'yes' was correct — no false alarms. Recall 40% means it only found 40% of the real positives. It's the personality of a very high threshold: trustworthy but timid.",
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/logistic-regression/the-beautiful-gradient", label: <>← The beautiful gradient</> }}
        />
      </div>
    </article>
  );
}
