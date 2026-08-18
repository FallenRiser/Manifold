import { M } from "@/components/Math";
import { ThresholdLab } from "@/components/labs/ThresholdLab";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LabFrame } from "@/components/LabFrame";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

const ACCENT = "var(--c-metrics)";

export const metadata = {
  title: "The confusion matrix — Manifold",
  description: "Every classification metric — accuracy, precision, recall, F1, ROC — is computed from one 2×2 table. Learn to read it and you can derive them all.",
};

export default function ConfusionMatrixPage() {
  return (
    <article>
      <LessonHeader
        chips={[
          { label: "Evaluation & metrics", color: ACCENT },
          { label: "Intuition", color: "var(--c-fundamentals)" },
        ]}
        time="about 8 minutes"
        title={<>The confusion matrix</>}
        intro={<>
          One small table is the source code of classification metrics. Accuracy, precision, recall,
          F1, specificity, ROC — every one of them is just a ratio of its four cells. Learn to read
          it and you never have to memorise a metric again; you can re-derive it on the spot.
        </>}
      />

      <div className="lesson">
        <p>
          A binary classifier&rsquo;s prediction can be right or wrong, and the true label can be
          positive or negative. Cross those two facts and you get exactly four outcomes. Count how
          often each happens on your test set and you have the <strong>confusion matrix</strong>:
        </p>

        <div style={{ overflowX: "auto", margin: "1.4rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 14, minWidth: 440, margin: "0 auto" }}>
            <thead>
              <tr>
                <td style={cell({ head: true })} />
                <th style={cell({ head: true })}>Predicted positive</th>
                <th style={cell({ head: true })}>Predicted negative</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th style={cell({ head: true })}>Actually positive</th>
                <td style={cell({ good: true })}><strong>True positive</strong> (TP)<br /><span style={sub}>hit — correctly flagged</span></td>
                <td style={cell({ bad: true })}><strong>False negative</strong> (FN)<br /><span style={sub}>a miss — the costly one</span></td>
              </tr>
              <tr>
                <th style={cell({ head: true })}>Actually negative</th>
                <td style={cell({ bad: true })}><strong>False positive</strong> (FP)<br /><span style={sub}>false alarm</span></td>
                <td style={cell({ good: true })}><strong>True negative</strong> (TN)<br /><span style={sub}>correct pass</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <p>
          The diagonal (TP, TN) is where the model got it right; the off-diagonal (FP, FN) is where it
          erred — and crucially, the two errors are <em>named separately</em> because they usually
          hurt in different ways. A <strong>false positive</strong> is a false alarm: you flagged a
          good loan, an innocent email, a healthy patient. A <strong>false negative</strong> is a
          miss: the fraud went through, the spam landed, the tumour was called benign. Nearly every
          metric you&rsquo;ll meet is one question about this table.
        </p>

        <h2>Everything is a ratio of these four cells</h2>
        <p>
          Once the four counts exist, the metrics fall straight out. Accuracy is the diagonal over the
          whole table; the others zoom in on one row or one column:
        </p>
        <p style={{ textAlign: "center" }}>
          <M>{String.raw`\text{accuracy}=\frac{TP+TN}{TP+TN+FP+FN}, \quad \text{precision}=\frac{TP}{TP+FP}, \quad \text{recall}=\frac{TP}{TP+FN}`}</M>
        </p>
        <p>
          Precision reads down the <em>predicted-positive column</em> (&ldquo;of everything I flagged,
          how much was right?&rdquo;); recall reads across the <em>actually-positive row</em> (&ldquo;of
          everything I should have caught, how much did I?&rdquo;). We give those two their own page
          next — for now the point is that they, and every cousin of theirs, live entirely inside this
          2×2.
        </p>

        <h2>The threshold builds the matrix</h2>
        <p>
          Here&rsquo;s the part people skip: the confusion matrix is <strong>not fixed</strong>. Your
          model outputs a score between 0 and 1, and you choose a cutoff above which you call
          &ldquo;positive.&rdquo; Move that cutoff and points slide between the cells — the whole table
          rewrites itself. There is no single confusion matrix for a model; there is one{" "}
          <em>per threshold</em>.
        </p>

        <PredictPrompt
          accent={ACCENT}
          prompt={<>In the lab, as you drag the cutoff from 0.5 down toward 0, what happens to false negatives (misses)?</>}
          options={["They rise — a stricter bar means more misses", "They fall — a looser bar catches more positives", "They stay the same; only accuracy moves"]}
          nudge={<>Drag the line left and watch the &ldquo;false negatives&rdquo; cell.</>}
        />

        <LabFrame
          accent={ACCENT}
          tryThis={<>Drag the cutoff all the way left, then all the way right. Watch every point cross the line and land in a different cell — and watch precision and recall trade off against each other.</>}
          insight={<>Lowering the cutoff catches more true positives (recall ↑) but also lets more false alarms through
            (precision ↓). Raising it does the reverse. No cutoff wins on both — that tension <em>is</em> the choice you
            make when you deploy. The confusion matrix is a snapshot at one cutoff; the next two pages are about seeing
            all cutoffs at once.</>}
        >
          <ThresholdLab />
        </LabFrame>

        <Callout color={ACCENT} title={<>Read it in one breath</>}>
          Columns are what the model <em>said</em>; rows are the <em>truth</em>. The diagonal is
          correct, the off-diagonal is the two named errors, and every metric is a ratio of these four
          numbers at one chosen threshold. If you can rebuild precision and recall from the table without
          looking them up, you understand classification evaluation.
        </Callout>

        <Quiz
          accent={ACCENT}
          questions={[
            {
              q: "A spam filter sends a real, important email to the junk folder. With spam as the positive class, that is a…",
              options: ["False positive — predicted positive (spam) on something negative (a real email)", "False negative", "True negative"],
              answer: 0,
              explain: "The email is genuinely not-spam (negative), but the filter predicted positive, so it's a false positive. The takeaway: always pin down which class is 'positive' before naming the error — flip the convention and the label flips too.",
            },
            {
              q: "You raise the classification threshold from 0.5 to 0.8. Which pair of cells necessarily can only move in these directions?",
              options: ["False positives can only go down (or stay); false negatives can only go up (or stay)", "Both false positives and false negatives go down", "Accuracy always increases"],
              answer: 0,
              explain: "A stricter bar flags fewer things, so false positives can't increase — but the positives you now reject become misses, so false negatives can't decrease. Whether accuracy rises depends on the class balance.",
            },
            {
              q: "Why does a model have many confusion matrices, not one?",
              options: ["Because the test set changes", "Because each threshold on the model's score produces a different matrix", "Because different metrics compute it differently"],
              answer: 1,
              explain: "The model emits a score; a threshold turns scores into labels. Every threshold reshuffles which points count as positive, producing a different 2×2. Evaluating 'the model' means looking across thresholds, not fixing one.",
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/evaluation", label: <>← Accuracy is a trap</> }}
          next={{ href: "/learn/evaluation/precision-recall-and-f1", label: <>Next up · Precision, recall &amp; F1 →</> }}
        />
      </div>
    </article>
  );
}

function cell({ head, good, bad }: { head?: boolean; good?: boolean; bad?: boolean }): React.CSSProperties {
  const base: React.CSSProperties = {
    border: "1px solid var(--border-strong)",
    padding: "10px 14px",
    textAlign: "center",
    color: "var(--ink)",
    fontWeight: head ? 500 : 400,
    background: head
      ? "var(--surface-2)"
      : good
        ? "color-mix(in srgb, var(--good) 8%, var(--surface))"
        : bad
          ? "color-mix(in srgb, var(--bad) 8%, var(--surface))"
          : "var(--surface)",
  };
  return base;
}

const sub: React.CSSProperties = { fontSize: 11.5, color: "var(--muted)" };
