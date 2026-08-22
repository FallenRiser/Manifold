import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { DecisionPoint } from "@/components/capstone/DecisionPoint";
import { AnalystQuestion, TransferBox, PlaybookRule } from "@/components/capstone/pedagogy";

export const metadata = {
  title: "Integrity audit: can I trust every row? — Manifold",
  description:
    "Three integrity checks that run on any dataset: dead columns that carry no information (orbiting_body, sentry_object), the class balance that dictates your metric (9.73% hazardous), and the duplicate-entity question that decides whether your test score is honest — 63,413 rows repeat an object.",
};

const SPACE = "var(--c-space)";

export default function IntegrityPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: SPACE }, { label: "Act 2 · First contact", color: "var(--c-metrics)" }]}
        time="about 9 minutes"
        title={<>Integrity audit: can I trust every row?</>}
        intro={<>
          &ldquo;No missing values&rdquo; is not the same as &ldquo;clean.&rdquo; Three cheap checks — dead columns,
          class balance, and repeated entities — catch the failures that never throw an error and quietly wreck a
          project. One of them is about to hand us the defining risk of the whole capstone.
        </>}
        titleSize={42}
        introSize={17.5}
      />

      <div className="lesson">
        <AnalystQuestion>
          Which columns carry no information, how (im)balanced is the target, and could the <em>same entity</em> appear
          in both my training and test sets?
        </AnalystQuestion>

        <h2>Check 1 — dead columns</h2>
        <p>
          A column with a single value everywhere is not a feature; it&rsquo;s a constant wearing a column&rsquo;s
          clothes. It can&rsquo;t separate anything, and it wastes attention. The one-liner:{" "}
          <code>nunique()</code> on every column, and read off anything equal to 1.
        </p>
        <CodeBlock fromScratch={code1} />
        <CodeOutput>{`nunique per column (sorted)
  orbiting_body            1      <- constant: always "Earth"
  sentry_object            1      <- constant: always False
  hazardous                2
  absolute_magnitude    1638
  id                   27423
  miss_distance        90536
  relative_velocity    90828`}</CodeOutput>
        <p>
          Two columns are dead: <code>orbiting_body</code> is always <em>Earth</em> and <code>sentry_object</code> is
          always <em>False</em>. They tell a real story about the data&rsquo;s <em>scope</em> — this file is
          Earth-approaching objects only, none currently on the automated impact-monitor — but as <em>features</em> they
          are worthless. Drop them, and note the scope they revealed.
        </p>

        <h2>Check 2 — class balance</h2>
        <p>
          For a classifier, the very next number you need is the positive rate. It decides which metrics are honest, and
          whether accuracy is about to lie to you.
        </p>
        <CodeBlock fromScratch={code2} />
        <CodeOutput>{`hazardous
  False   81,996   (90.27%)
  True     8,840   ( 9.73%)`}</CodeOutput>
        <Callout color={SPACE} title={<>Why 9.73% already condemns accuracy</>}>
          A model that predicts <em>&ldquo;never hazardous&rdquo;</em> for every object is right{" "}
          <strong>90.27%</strong> of the time — and completely useless, because it catches zero hazards. Any metric that
          rewards that model (accuracy, plain ROC-AUC on a glance) is the wrong yardstick here. We&rsquo;re not choosing
          the metric yet — that&rsquo;s Act 4 — but the imbalance means we already know accuracy is out. Spotting this
          now stops us from ever being impressed by a 90%.
        </Callout>

        <h2>Check 3 — the duplicate-entity question</h2>
        <p>
          This is the check that separates practitioners from beginners, and the reason we asked &ldquo;what is one
          row?&rdquo; first. We already know objects repeat — 27,423 objects across 90,836 rows. Now we make the
          consequence concrete: <strong>63,413 rows</strong> are a <em>repeat</em> of an object that also appears
          elsewhere in the table.
        </p>
        <CodeBlock fromScratch={code3} />
        <CodeOutput>{`rows                     : 90,836
unique objects (id)      : 27,423
rows that repeat an id   : 63,413   (69.8% of the table!)
most-seen single object  : appears 43 times`}</CodeOutput>
        <p>
          Sit with that number. Seven of every ten rows share an object with some other row. If we now shuffle rows at
          random into train and test — the default, the thing everyone does — the <em>same asteroid</em> will land in
          both sets: its size and label in training, a different flyby of it in test. The model doesn&rsquo;t have to
          learn what makes objects hazardous; it can memorise <em>these specific objects</em> and recognise them again
          on the other side. The test score would measure recall of memorised objects, not genuine prediction.
        </p>

        <DecisionPoint
          accent={SPACE}
          question={<>Nearly 70% of rows repeat an object that appears elsewhere. You&rsquo;re about to make a train/test split. What do you do?</>}
          options={[
            {
              label: "Drop duplicates — keep one row per object",
              verdict: "close",
              response: <>Defensible, and sometimes right — but here it throws away real signal. The repeated rows are <em>different approaches</em> of the same object, with genuinely different velocity and miss distance. Collapsing to one row per object discards that variation. Better to keep the rows but respect the grouping.</>,
            },
            {
              label: "Split by object id, so an object is entirely in train OR test — never both",
              verdict: "best",
              response: <>This is the honest split. A grouped split (e.g. <code>GroupShuffleSplit</code> on <code>id</code>) guarantees the model is tested on objects it has never seen, which is exactly the real task. It keeps every flyby&rsquo;s variation while closing the memorisation loophole.</>,
            },
            {
              label: "Shuffle rows at random — that's what train_test_split does",
              verdict: "miss",
              response: <>This is the trap, and it&rsquo;s the default. Random row shuffling lets an object bleed across the split, so the test set secretly contains training objects. The score comes out flatteringly high and means nothing. We&rsquo;ll <em>measure</em> exactly how much it lies in Act 4.</>,
            },
          ]}
        />

        <p>
          We won&rsquo;t implement the split yet — locking the harness is Act 4&rsquo;s job, done deliberately and all at
          once. But the risk is now named and understood, which is the whole point of an integrity audit: find the
          landmines before you step, not after.
        </p>

        <TransferBox>
          Run these three checks on <em>every</em> dataset: <code>nunique()</code> for dead columns, the target
          distribution for balance, and &ldquo;does any entity repeat across rows?&rdquo; for leakage risk. The last one
          has a hundred disguises — the same patient across visits, the same user across sessions, the same company
          across quarters, overlapping time windows. If entities repeat, a random split will lie to you.
        </TransferBox>

        <PlaybookRule n={5}>
          Audit integrity before modelling: drop <strong>dead columns</strong>, read the <strong>class balance</strong>{" "}
          (it rules metrics in or out), and ask whether an <strong>entity repeats across rows</strong> — if it does, you
          need a group-aware split.
        </PlaybookRule>

        <PrevNext
          prev={{ href: "/learn/asteroid-hazard-capstone/first-look", label: <>← Load &amp; look: what is one row?</> }}
          next={{ href: "/learn/asteroid-hazard-capstone/redundancy", label: <>Next up · Redundancy: one feature in disguise →</> }}
        />
      </div>
    </article>
  );
}

const code1 = `# dead-column check: anything with one distinct value is not a feature
print(df.nunique().sort_values())`;

const code2 = `# class balance decides which metrics can be trusted
print(df["hazardous"].value_counts())
print(df["hazardous"].mean())        # positive rate`;

const code3 = `# could the same object land in both train and test?
n, u = len(df), df["id"].nunique()
print("rows:", n, " unique objects:", u)
print("rows that repeat an id:", n - u)
print("most-seen object appears", df["id"].value_counts().max(), "times")`;
