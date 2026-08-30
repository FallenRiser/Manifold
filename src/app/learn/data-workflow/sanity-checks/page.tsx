import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeBlock } from "@/components/CodeBlock";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "Sanity checks that catch disasters — Manifold",
  description:
    "Ten checks, none of which take more than a minute, that between them catch most of the failures that would otherwise be discovered after the model ships.",
};

const GRAY = "var(--c-metrics)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

const CHECKS: { check: string; catches: string }[] = [
  { check: "Row count matches what the source system says it should", catches: "a silent join that dropped a third of your data" },
  { check: "The primary key is unique", catches: "a fan-out join — the classic cause of both duplicates and inflated scores" },
  { check: "Every numeric column's min and max are physically possible", catches: "negative ages, populations of zero, prices of −1, dates in 2087" },
  { check: "Date ranges are what you expect, per column", catches: "a column that stops updating in 2023 and is now constant" },
  { check: "Categorical columns have the number of levels you expect", catches: "'UK', 'uk', 'United Kingdom' as three separate countries" },
  { check: "Missingness per column, and per row", catches: "a block of rows missing everything — usually a failed batch" },
  { check: "Nothing correlates with the target above about 0.95", catches: "the label in a costume" },
  { check: "The target's distribution is stable over time", catches: "a definition that changed, or a regime shift that breaks your split" },
  { check: "Train and test feature distributions are comparable", catches: "an accidental sort, a leaky split, or genuine drift" },
  { check: "Twenty random rows read like plausible real events", catches: "everything the other nine miss" },
];

const CODE = `# A check function that fails loudly. Run it on every load, not once.
# The value is not the checks themselves -- it is that they run again
# next month, when someone upstream changes a column and tells nobody.

def check(df, key, target, date_col):
    problems = []

    if df[key].duplicated().any():
        problems.append(f"{df[key].duplicated().sum()} duplicate keys")

    num = df.select_dtypes("number")
    for col, lo in [("age", 0), ("price", 0), ("population", 1)]:
        if col in num and (num[col] < lo).any():
            problems.append(f"{col} has values below {lo}")

    future = df[date_col] > pd.Timestamp.today()
    if future.any():
        problems.append(f"{future.sum()} rows dated in the future")

    corr = num.drop(columns=[target]).corrwith(df[target]).abs()
    for col, r in corr[corr > 0.95].items():
        problems.append(f"{col} correlates {r:.3f} with the target -- leak?")

    all_missing = df.isna().all(axis=1).sum()
    if all_missing:
        problems.append(f"{all_missing} entirely empty rows")

    if problems:
        raise ValueError("data checks failed:\\n  " + "\\n  ".join(problems))
    return df`;

export default function SanityChecksPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Meeting the data", color: GRAY }, { label: "Tier 1 · intuition", color: GRAY }]}
        time="about 7 minutes"
        title={<>Sanity checks that catch disasters</>}
        intro={<>Ten checks. None takes more than a minute. Between them they catch most of the failures that
          would otherwise be found by a stakeholder, three months later, in a meeting.</>}
      />

      <div className="lesson">
        <h2>The ten</h2>
        <div style={{ display: "grid", gap: 7, margin: "1.3rem 0" }}>
          {CHECKS.map((c, i) => (
            <div key={c.check} style={{ display: "flex", gap: 11, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 13px" }}>
              <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: GRAY, flexShrink: 0, width: 18 }}>{i + 1}</div>
              <div>
                <div style={{ fontSize: 13.5, color: "var(--ink)", lineHeight: 1.5 }}>{c.check}</div>
                <div style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.5, marginTop: 2 }}>Catches: {c.catches}.</div>
              </div>
            </div>
          ))}
        </div>

        <Callout color={GRAY} title={<>Check 2 is the one that pays for the list</>}>
          A non-unique key almost always means a join fanned out, and a fanned-out join creates{" "}
          <em>near-duplicate rows that land on both sides of a random split</em>. Your test set now contains
          copies of training rows, your score is inflated, and nothing anywhere raised an error. One line of code:{" "}
          <code>assert df[key].is_unique</code>. It has better expected value than most of the modelling work you
          will do that week.
        </Callout>

        <h2>Make them a function, not a session</h2>
        <p>
          Running these once, interactively, on the day you receive the data catches today&rsquo;s problems. The
          real return comes from writing them as a function that raises, and calling it on every load — because
          the failure that hurts is the one introduced in four months by someone upstream who changed a column and
          had no way to know you depended on it.
        </p>
        <CodeBlock fromScratch={CODE} />
        <p>
          Note that it <em>raises</em> rather than warns. A warning in a notebook is an invitation to scroll past.
          If a check is worth running it is worth stopping for; if it is not worth stopping for, delete it rather
          than training yourself to ignore output.
        </p>

        <h2>Two checks that deserve elaboration</h2>
        <p>
          <strong>Check 7 — nothing correlates above 0.95.</strong> This is a leak detector, and the threshold is
          deliberately crude. Genuine features are rarely that predictive on their own; a column that is has
          usually been computed from the target, updated at the same time as the target, or is the target under
          another name. The check does produce false alarms — a thermometer reading correlates enormously with
          the temperature you are predicting — and a false alarm costs you one minute of thinking.
        </p>
        <p>
          <strong>Check 9 — train and test look comparable.</strong> A cheap and remarkably general test: label
          training rows 0 and test rows 1, and try to classify which is which. If a model can tell them apart
          well above chance, then something distinguishes them — a sort order you did not notice, a leaked split,
          or genuine drift between periods. If it cannot, your split is at least distributionally sane. The same
          trick is the standard drift monitor after deployment, which we come back to in{" "}
          <Link href="/learn/data-workflow/drift-and-monitoring" style={link}>the last chapter</Link>.
        </p>

        <h2>What this chapter was really about</h2>
        <p>
          Exploration is not a phase you complete; it is the habit of asking what would have to be true for these
          numbers to make sense, and noticing when the answer is &ldquo;nothing plausible&rdquo;. The eight
          questions, the shape vocabulary, the confound check and the ten assertions are all the same instinct
          pointed at different parts of the table.
        </p>

        <Quiz
          accent={GRAY}
          title="Chapter checkpoint · meeting the data"
          questions={[
            {
              q: <>A feature correlates 0.97 with your target. What is the most likely explanation?</>,
              options: [
                "You have found an unusually strong predictor",
                "The feature is derived from the target, or updated at the same moment as it",
                "The correlation is spurious and will vanish on more data",
              ],
              answer: 1,
              explain: <>Genuine single-feature correlations that high are rare outside physical measurement. The overwhelmingly common causes are that the column was computed from the target, or is a status field mutated when the outcome occurred. &ldquo;Spurious&rdquo; is the wrong frame too — 0.97 on a real dataset is far too strong to be sampling noise. Time-travel-test it before you do anything else.</>,
            },
            {
              q: <>You plot spend against tenure and find a negative relationship. Before reporting it, what is the single most valuable extra step?</>,
              options: [
                "Test it for statistical significance",
                "Re-plot it split by the obvious grouping variables — plan, cohort, acquisition channel",
                "Fit a non-linear model to see whether the relationship is curved",
              ],
              answer: 1,
              explain: <>Significance tells you the pooled relationship is not noise; it says nothing about whether the pooled relationship is the one you mean. A confound can reverse the sign entirely — the clinic example on the previous page runs from +0.7 within groups to −0.95 pooled, and every step of it is statistically significant. Splitting by grouping variables is the check that catches this, and it costs one line.</>,
            },
            {
              q: <>Why write the data checks as a function that raises, rather than running them once in a notebook?</>,
              options: [
                "It is faster to execute",
                "Because the expensive failure is the one introduced upstream months later, when nobody re-runs the notebook",
                "Because notebooks are not reproducible",
              ],
              answer: 1,
              explain: <>Today&rsquo;s data problems get found today either way. The ones that cost real money appear when a source system changes under you — a column starts arriving null, a currency changes unit, a join key gets reused — and the only thing that catches those is a check that runs every single time the data is loaded, and stops the pipeline when it fails.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/data-workflow/relationships-and-confounds", label: <>← Relationships &amp; confounds</> }}
          next={{ href: "/learn/data-workflow/missing-data", label: <>Next chapter · Missing data →</> }}
        />
      </div>
    </article>
  );
}
