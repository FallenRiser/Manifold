import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";
import { RocVsPr } from "@/components/figures/RocVsPr";
import { AnalystQuestion, TransferBox, PlaybookRule } from "@/components/capstone/pedagogy";

export const metadata = {
  title: "Choose the metric by cost — Manifold",
  description:
    "Before any model, decide what being wrong costs and pick the metric that punishes it. On a 9.73%-positive problem, accuracy rewards a useless 'never hazardous' classifier (90.3%) and ROC-AUC flatters a size rule at 0.87 — while PR-AUC tells the truth at 0.29. Match the yardstick to the error that matters.",
};

const SPACE = "var(--c-space)";

export default function MetricsPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: SPACE }, { label: "Act 4 · Lock the harness", color: "var(--c-metrics)" }]}
        time="about 9 minutes"
        title={<>Choose the metric by cost</>}
        intro={<>
          Modelling has not started, and it shouldn&rsquo;t until the harness is locked. The first piece of that harness
          is the metric — and choosing it is a decision about <em>cost</em>, not a default. Pick wrong and every later
          result is measured with a broken ruler.
        </>}
        titleSize={42}
        introSize={17.5}
      />

      <div className="lesson">
        <AnalystQuestion>
          What does being wrong actually <em>cost</em> here — and which metric punishes that specific mistake instead of
          flattering me?
        </AnalystQuestion>

        <h2>Start from the cost of each error, not the metric menu</h2>
        <p>
          Every classifier makes two kinds of mistake, and they rarely cost the same. Here the asymmetry is stark. A{" "}
          <strong>false negative</strong> — calling a genuinely hazardous object safe — is the expensive one; it&rsquo;s
          the miss you built the system to prevent. A <strong>false positive</strong> — a false alarm on a harmless
          object — costs some analyst time on a follow-up. Missing a hazard is far worse than raising a false alarm. So
          our metric must, above all, be sensitive to <em>recall of the rare positive class</em>. Name the cost first;
          the metric follows from it.
        </p>

        <h2>Why the obvious metrics lie on this problem</h2>
        <p>
          The dataset is 9.73% hazardous. That single fact disqualifies the two metrics people reach for first.
        </p>
        <CodeBlock fromScratch={code1} />
        <CodeOutput>{`"never hazardous" classifier
  accuracy : 0.9027      <- looks great...
  recall   : 0.000       <- ...catches ZERO hazards

size rule (rank by -H)
  ROC-AUC  : 0.865       <- looks nearly excellent
  PR-AUC   : 0.277       <- the honest picture
  (chance PR-AUC = prevalence = 0.097)`}</CodeOutput>
        <ul style={ul}>
          <li>
            <strong>Accuracy is defeated by the base rate.</strong> Predicting &ldquo;never hazardous&rdquo; for every
            object scores <strong>90.3%</strong> — and is worthless, catching not one hazard. Any metric a do-nothing
            model can win is the wrong metric.
          </li>
          <li>
            <strong>ROC-AUC is flattered by the easy negatives.</strong> ROC-AUC asks how well you rank a random positive
            above a random negative. With 90% easy negatives, that&rsquo;s not hard, so even the crude size rule scores{" "}
            <strong>0.87</strong> — suspiciously close to excellent. ROC-AUC isn&rsquo;t wrong, it&rsquo;s{" "}
            <em>anaesthetised</em> by class imbalance.
          </li>
          <li>
            <strong>PR-AUC keeps its eyes on the positives.</strong> Precision and recall both ignore the true negatives
            entirely, so the area under the precision–recall curve tracks exactly what we care about: finding hazards
            without drowning in false alarms. Its chance level is the prevalence, <strong>0.097</strong> — so the size
            rule&rsquo;s <strong>0.277</strong> is real but modest lift, roughly 3× chance, not the near-perfect 0.87 ROC
            implied.
          </li>
        </ul>

        <h2>What a precision–recall curve actually is</h2>
        <p>
          It&rsquo;s worth building the PR curve the same way we build the ROC curve, because the difference between them
          is the whole point. A single threshold gives you one precision and one recall. Now sweep the threshold from
          strict to lenient and plot the trace: <strong>recall on the x-axis, precision on the y-axis</strong>, one point
          per threshold. That trace is the precision–recall curve, and the area under it — <em>average precision</em>, the
          &ldquo;PR-AUC&rdquo; — summarises the whole sweep in one number, exactly as AUC summarises the ROC sweep.
        </p>
        <p style={{ textAlign: "center" }}>
          <M>{String.raw`\text{recall}=\frac{TP}{TP+FN}, \qquad \text{precision}=\frac{TP}{TP+FP}`}</M>
        </p>
        <p>
          Two structural facts make this curve tell the truth on rare-positive data. First, <strong>neither axis
          contains the true-negative count</strong> <M>{String.raw`(TN)`}</M> — so the 90% of easy negatives can&rsquo;t
          inflate it, whereas ROC&rsquo;s false-positive-rate axis has <M>{String.raw`TN`}</M> in its denominator and is
          numbed by them. Second, and uniquely, <strong>the PR curve&rsquo;s chance level is the prevalence</strong>, not
          0.5: a coin-flip model scores an average precision equal to the positive rate. Here that floor is{" "}
          <strong>0.097</strong>. So you never read a PR-AUC in the abstract — you read it <em>against the prevalence
          floor it had to clear</em>. 0.277 over a 0.097 floor is genuine, if modest, skill; the same 0.277 on a
          50%-positive problem would be worse than guessing.
        </p>

        <figure style={{ margin: "20px 0 6px" }}>
          <RocVsPr />
          <figcaption style={cap}>
            The <em>same</em> size rule on the <em>same</em> data, graded two ways. ROC (left) bows toward the top-left
            and reports a flattering <strong>0.87</strong>. PR (right) sags — precision never clears ~0.30 — for an honest{" "}
            <strong>0.28</strong>, only just above the dashed prevalence floor. Both are computed correctly; they answer
            different questions.
          </figcaption>
        </figure>

        <h2>ROC or PR? How to tell which one you&rsquo;re in</h2>
        <p>
          The choice isn&rsquo;t a matter of taste — you can read it off the problem before you fit anything. Three
          questions identify the scenario:
        </p>
        <ol style={ol}>
          <li>
            <strong>Is the positive class rare?</strong> If positives are a small minority (say under ~20%), the huge
            negative pool will anaesthetise ROC-AUC. Lean PR. Roughly balanced classes → ROC-AUC is fine and its clean
            &ldquo;probability a positive outranks a negative&rdquo; meaning is a bonus.
          </li>
          <li>
            <strong>Do you actually care about the true negatives?</strong> ROC rewards correctly ranking negatives too.
            When the negatives are a boring haystack you&rsquo;ll never act on — you only care about the quality of the
            flagged pile — precision is the right axis, so PR is your curve.
          </li>
          <li>
            <strong>Is one error far costlier than the other?</strong> Asymmetric costs on a rare class (a missed hazard,
            an undetected tumour, a fraudulent charge) are the textbook PR case. Symmetric costs push you back toward ROC
            or accuracy.
          </li>
        </ol>
        <p>
          Three yeses is the fingerprint of a PR problem, and asteroid hazard is three yeses: rare positives (9.73%),
          negatives we&rsquo;ll never chase, and a missed hazard that dwarfs a false alarm. That&rsquo;s how we
          <em> identified</em> PR-AUC as the metric — not by preference, but by reading the structure of the task. The
          full mechanics of both curves, with an interactive ROC lab, live in{" "}
          <a href="/learn/evaluation/roc-auc-and-pr-curves">ROC/AUC &amp; precision–recall</a>.
        </p>

        <Callout color={SPACE} title={<>Same model, two stories — 0.87 vs 0.28</>}>
          The size rule is one fixed thing, yet ROC-AUC calls it 0.87 and PR-AUC calls it 0.28. Both are computed
          correctly; they simply answer different questions. On a rare-positive problem where a false negative is the
          costly error, PR-AUC is the honest question. This is the whole trap of the capstone in one line:{" "}
          <em>a metric that ignores the rare class will tell you a useless model is a good one.</em> We commit to{" "}
          <strong>PR-AUC</strong> as the headline metric, with recall at a chosen operating point reported alongside.
        </Callout>

        <p>
          We&rsquo;re not discarding the others — ROC-AUC still lets us compare against published work, and accuracy is a
          familiar sanity check. But the number that <em>decides</em> whether one model beats another, from here on, is
          PR-AUC, precisely because it refuses to be impressed by the 90% of objects that were never in question. (For
          the mechanics of these curves, see{" "}
          <a href="/learn/evaluation/roc-auc-and-pr-curves">ROC/AUC &amp; precision–recall</a>.)
        </p>

        <TransferBox>
          On any new problem, write the cost of a false positive and a false negative in plain words <em>before</em> you
          pick a metric. Rare, costly-to-miss positives → PR-AUC / recall-at-precision. Symmetric costs and balanced
          classes → accuracy or ROC-AUC is fine. Ranking for a top-k shortlist → precision@k. The metric is downstream of
          the decision the model serves — never a default you inherit from a tutorial.
        </TransferBox>

        <PlaybookRule n={10}>
          Choose the metric from the <strong>cost of each error</strong>, before modelling. On rare-positive problems,
          accuracy and ROC-AUC flatter useless models — prefer <strong>PR-AUC</strong> (and recall at a set precision),
          which keep their eyes on the class you care about.
        </PlaybookRule>

        <PrevNext
          prev={{ href: "/learn/asteroid-hazard-capstone/hypotheses", label: <>← From plots to testable checks</> }}
          next={{ href: "/learn/asteroid-hazard-capstone/the-split", label: <>Next up · The split: the leakage trap →</> }}
        />
      </div>
    </article>
  );
}

const code1 = `from sklearn.metrics import (accuracy_score, recall_score,
                             roc_auc_score, average_precision_score)
y = df["hazardous"]

# 1. a do-nothing classifier vs accuracy
none = [False] * len(y)
print("accuracy:", accuracy_score(y, none), " recall:", recall_score(y, none))

# 2. the size rule scored two ways
score = -df["absolute_magnitude"]          # smaller H = bigger = likelier
print("ROC-AUC:", roc_auc_score(y, score))
print("PR-AUC :", average_precision_score(y, score), " (chance =", y.mean(), ")")`;

const ul: React.CSSProperties = { margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const ol: React.CSSProperties = { margin: "0 0 14px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.85 };
const cap: React.CSSProperties = { marginTop: 8, fontSize: 13, color: "var(--muted)", lineHeight: 1.55 };
