import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { LabFrame } from "@/components/LabFrame";
import { SplitLeakLab } from "@/components/labs/SplitLeakLab";
import { AnalystQuestion, TransferBox, PlaybookRule } from "@/components/capstone/pedagogy";

export const metadata = {
  title: "The split: the leakage trap — Manifold",
  description:
    "The experiment that settles H3. Because one object spans many rows, a random train/test split leaks objects across the boundary and inflates flexible models — the random forest's PR-AUC jumps from an honest 0.478 to a flattering 0.566. A grouped-by-object split closes the loophole. Measured, not asserted.",
};

const SPACE = "var(--c-space)";

export default function TheSplitPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: SPACE }, { label: "Act 4 · Lock the harness", color: "var(--c-metrics)" }]}
        time="about 10 minutes"
        title={<>The split: the leakage trap</>}
        intro={<>
          This is the experiment we promised at the end of exploration — the one that turns H3 from &ldquo;the mechanism
          exists&rdquo; into a measured number. Get the split wrong and every score that follows is a comfortable lie.
          Get it right and the whole capstone stands on honest ground.
        </>}
        titleSize={42}
        introSize={17.5}
      />

      <div className="lesson">
        <AnalystQuestion>
          How could my test set secretly contain my training data — and how much would that inflate the score if it did?
        </AnalystQuestion>

        <h2>The move: ask what a random split assumes</h2>
        <p>
          <code>train_test_split</code> shuffles <em>rows</em> and deals them into two piles. That is only honest if each
          row is an independent unit. We already answered &ldquo;what is one row?&rdquo; and found it isn&rsquo;t: a row
          is one close approach, and the same object recurs across up to 43 rows, carrying its fixed size and{" "}
          <em>fixed label</em>. So a random shuffle will drop some of an object&rsquo;s approaches into training and the
          rest into test. At test time the model isn&rsquo;t generalising to a new object — it&rsquo;s recognising one
          it already memorised. The general form of the question: <strong>does any entity appear in more than one row,
          and would a random split let it cross the train/test line?</strong>
        </p>

        <h2>The fix, and the experiment that proves it matters</h2>
        <p>
          The fix is a <strong>grouped split</strong>: partition by <code>id</code> so every approach of an object stays
          on one side. <code>GroupShuffleSplit</code> does exactly that. But a fix you can&rsquo;t measure is just faith,
          so we run the honest experiment — train each model once under a random split and once under a grouped split,
          and compare PR-AUC. Toggle between them below.
        </p>

        <LabFrame
          accent={SPACE}
          tryThis={<>Switch from the random split to the grouped split. Watch which objects stop straddling the line — and which models&rsquo; scores fall when the leak is closed.</>}
          insight={<>The <strong>flexible</strong> models (random forest, boosting) inflate the most under a random split, because high capacity is exactly what lets them memorise repeated objects. The size rule and logistic barely move — they were never memorising. Leakage doesn&rsquo;t lift all boats; it rewards the models most able to cheat.</>}
        >
          <SplitLeakLab />
        </LabFrame>

        <h2>Read the gap</h2>
        <p>
          The signature is unmistakable. Under the random split the random forest posts a gleaming PR-AUC of{" "}
          <strong>0.566</strong>; move to the honest grouped split and it drops to <strong>0.478</strong> — an{" "}
          <strong>0.088</strong> inflation that was pure memorisation. Gradient boosting inflates by 0.048. Meanwhile the
          size rule and logistic regression move by a hundredth or less, and the shallow tree hardly at all.
        </p>
        <CodeBlock fromScratch={code} />
        <CodeOutput>{`PR-AUC          RANDOM   GROUPED    gap
size rule (-H)   0.277    0.289    -0.012
logistic         0.293    0.309    -0.017
decision tree    0.433    0.430    +0.003
random forest    0.566    0.478    +0.088   <- the leak
hist grad boost  0.520    0.472    +0.048

grouped test set: 22,660 rows, ZERO objects shared with train`}</CodeOutput>
        <Callout color={SPACE} title={<>The gap is a property of capacity × structure</>}>
          Notice that leakage did not inflate every model equally — it inflated the <em>flexible</em> ones. That&rsquo;s
          the tell to remember: when a random split makes your high-variance models look far better than your simple ones,
          suspect that the flexible models are memorising leaked entities, not learning. Had we trusted the random split,
          we&rsquo;d have crowned the random forest at 0.566 and shipped a model 0.088 worse than advertised. The grouped
          split is now locked in as <em>the</em> harness for every model in the next act.
        </Callout>

        <p>
          With the metric (PR-AUC) and the split (grouped-by-<code>id</code>) both fixed <em>before</em> we fit anything,
          no later result can flatter us into a wrong conclusion. That discipline — lock the harness first — is what
          makes the model comparison to come trustworthy.
        </p>

        <TransferBox>
          Whenever an entity repeats across rows, split by that entity, not by row: patients across visits, users across
          sessions, sentences from the same document, images of the same patient, trades from the same account. And when
          time matters, split by time. The universal red flag: if your flexible models suddenly tower over your simple
          ones, check whether they&rsquo;re memorising something a smarter split would hide.
        </TransferBox>

        <PlaybookRule n={11}>
          Lock the <strong>split by group structure</strong> before modelling. If an entity spans rows, a random split
          leaks it across train/test and inflates flexible models — measure the gap with a grouped split, and make the
          honest split the harness.
        </PlaybookRule>

        <PrevNext
          prev={{ href: "/learn/asteroid-hazard-capstone/metrics", label: <>← Choose the metric by cost</> }}
          next={{ href: "/learn/asteroid-hazard-capstone/baselines", label: <>Next up · Baselines: the number to beat →</> }}
        />
      </div>
    </article>
  );
}

const code = `from sklearn.model_selection import train_test_split, GroupShuffleSplit
from sklearn.metrics import average_precision_score

# RANDOM: shuffle rows — an object can land in both sides
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.25,
                                       stratify=y, random_state=0)

# GROUPED: whole objects to one side only
tr, te = next(GroupShuffleSplit(test_size=0.25, random_state=0)
              .split(X, y, groups=df["id"]))

# fit each model on both, compare PR-AUC (see the gap in the table)`;
