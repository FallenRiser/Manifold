import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { AnalystQuestion, TransferBox, PlaybookRule } from "@/components/capstone/pedagogy";

export const metadata = {
  title: "Load & look: what is one row? — Manifold",
  description:
    "The first-five-minutes routine on any new table: shape, dtypes, a few real rows, missingness — and the one question that reframes the whole project: what does a single row actually represent? For NEO, a row is one close approach, not one asteroid.",
};

const SPACE = "var(--c-space)";

export default function FirstLookPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: SPACE }, { label: "Act 2 · First contact", color: "var(--c-metrics)" }]}
        time="about 7 minutes"
        title={<>Load &amp; look: what is one row?</>}
        intro={<>
          Before any cleaning, plotting, or modelling, spend five disciplined minutes just <em>meeting</em> the data.
          The goal is not analysis — it&rsquo;s orientation: how big is it, what type is each column, what do a few real
          rows look like, and — the question that quietly decides everything later — <em>what is one row?</em>
        </>}
        titleSize={42}
        introSize={17.5}
      />

      <div className="lesson">
        <AnalystQuestion>
          I&rsquo;ve just loaded a table I&rsquo;ve never seen. What are the first things I look at — and what does a
          single row actually represent?
        </AnalystQuestion>

        <h2>The first-five-minutes routine</h2>
        <p>
          Every practitioner has a reflex sequence for a fresh table, and it&rsquo;s always the same four moves. None of
          them is clever; skipping them is how people waste a week modelling a misunderstanding.
        </p>
        <ol style={ol}>
          <li><strong>Shape.</strong> How many rows and columns? Big enough to hold out a real test set, small enough to fit in memory?</li>
          <li><strong>Dtypes.</strong> What is each column — number, category, date, free text? Wrong types are the commonest silent bug.</li>
          <li><strong>Head.</strong> Look at a handful of <em>actual</em> rows. Summary stats hide what eyeballing five rows reveals in a second.</li>
          <li><strong>Missingness.</strong> Where are the holes? Their <em>pattern</em> often tells you how the data was collected.</li>
        </ol>

        <CodeBlock fromScratch={code} />
        <CodeOutput>{`shape: (90836, 10)

columns & dtypes
  id                    int64
  name                 object
  est_diameter_min    float64
  est_diameter_max    float64
  relative_velocity   float64
  miss_distance       float64
  orbiting_body        object
  sentry_object          bool
  absolute_magnitude  float64
  hazardous              bool

missing values per column: 0   (none, anywhere)

first rows
   id        absolute_magnitude  relative_velocity  miss_distance  hazardous
   2162117   16.73               13569.25           5.483e+07      False
   2277475   20.00               73588.73           6.143e+07      True`}</CodeOutput>

        <p>
          Clean on the surface: ~91k rows, ten columns, no missing values, sensible types. A relief — and a small
          warning. &ldquo;No missing values&rdquo; on real-world data is unusual enough that it should make you ask{" "}
          <em>who cleaned this, and what did they drop?</em> rather than simply trust it. We&rsquo;ll come back to that
          instinct in the integrity audit.
        </p>

        <h2>The question that reframes everything: what is one row?</h2>
        <p>
          This is the single most important question of the first five minutes, and the one beginners skip. A table of
          numbers <em>looks</em> like &ldquo;one row = one thing,&rdquo; but you have to <strong>verify</strong> what the
          thing is. Here, is a row one <em>asteroid</em>, or one <em>event</em>? The <code>id</code> column decides it —
          so we ask whether ids repeat, and if they do, what changes between an object&rsquo;s rows.
        </p>

        <CodeBlock fromScratch={code2} />
        <CodeOutput>{`rows                    : 90,836
unique ids              : 27,423        <- far fewer than rows: ids repeat

within a single id, how many distinct values?
  hazardous  varies in  : 0 ids         <- label is fixed per object
  absolute_magnitude    : 0 ids         <- size is fixed per object
  relative_velocity     : 15,902 ids    <- speed CHANGES between rows!`}</CodeOutput>

        <Callout color={SPACE} title={<>A row is one close approach, not one asteroid</>}>
          The counts settle it. There are only <strong>27,423 objects</strong> behind <strong>90,836 rows</strong>, and
          within a single object the label and the size never change — but the <em>velocity</em> changes across{" "}
          15,902 objects. So a row is <strong>one flyby</strong>: the same asteroid recurs, carrying its fixed size and
          label, but a different approach geometry each time. That single sentence reshapes the project: the target is a
          property of the <em>object</em>, while some features are properties of the <em>event</em>. Any honest test set
          must therefore split by object, not by row — a trap we&rsquo;ll spring deliberately two pages from now.
        </Callout>

        <p>
          Notice what just happened: four boring commands and one pointed question turned &ldquo;a clean table&rdquo;
          into a precise mental model of the data-generating process. That model — not the numbers — is what makes every
          later decision defensible.
        </p>

        <TransferBox>
          On any new dataset, before you touch a model, answer <em>&ldquo;what is one row?&rdquo;</em> out loud. Is it
          one customer or one transaction? One patient or one visit? One sensor or one reading? If the unit of a row is
          not the unit of your prediction — or if the same entity spans many rows — you have a grouping problem to
          handle before you split, every single time.
        </TransferBox>

        <PlaybookRule n={4}>
          Meet the data in five minutes — <strong>shape, dtypes, head, missingness</strong> — then answer{" "}
          <strong>&ldquo;what is one row?&rdquo;</strong> Verify whether one entity spans many rows; it decides how you
          must split later.
        </PlaybookRule>

        <PrevNext
          prev={{ href: "/learn/asteroid-hazard-capstone/research-questions", label: <>← Research questions &amp; hypotheses</> }}
          next={{ href: "/learn/asteroid-hazard-capstone/integrity", label: <>Next up · Integrity audit →</> }}
        />
      </div>
    </article>
  );
}

const code = `import pandas as pd

df = pd.read_csv("neo_v2.csv")

print("shape:", df.shape)
print(df.dtypes)                     # what is each column?
print(df.isna().sum().sum(), "missing cells")
print(df.head())                     # look at real rows`;

const code2 = `# what is one row? ask whether ids repeat, and what varies within an id
print("rows:", len(df), " unique ids:", df["id"].nunique())

for col in ["hazardous", "absolute_magnitude", "relative_velocity"]:
    varies = (df.groupby("id")[col].nunique() > 1).sum()
    print(f"{col:20} varies within {varies} ids")`;

const ol: React.CSSProperties = { margin: "0 0 16px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.9 };
