import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "EDA with a purpose — Manifold",
  description:
    "Exploratory analysis is not a gallery of plots. It is a list of questions whose answers change what you do next — and any plot that cannot change a decision is decoration.",
};

const GRAY = "var(--c-metrics)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

const QUESTIONS: { q: string; changes: string }[] = [
  { q: "How many rows, and how many independent entities?", changes: "whether you have 5,000 examples or 250 — which decides model capacity and split strategy" },
  { q: "What does the target look like — balance, skew, a spike at zero, a ceiling?", changes: "your metric, your loss function, and whether you need a two-stage model" },
  { q: "Which columns are missing, how much, and is missingness patterned?", changes: "imputation strategy, and whether missingness is itself a feature" },
  { q: "Are there impossible values — negative ages, future dates, populations of zero?", changes: "whether this dataset is trustworthy at all, and which upstream owner you need to talk to" },
  { q: "Does anything correlate suspiciously strongly with the target?", changes: "usually reveals a leak, before you waste a week on it" },
  { q: "Is there time structure — a trend, a seasonality, a regime change?", changes: "your split, from random to forward-chaining" },
  { q: "Are there duplicate or near-duplicate rows?", changes: "whether your test set is contaminated" },
  { q: "How is the data distributed across obvious subgroups?", changes: "which slices you will need to check performance on later" },
];

const CODE = `# Twenty minutes, run before any plotting library is imported.
# The goal is not a picture; it is eight answers.

print(df.shape, df.index.is_unique)
print(df.dtypes.value_counts())

# 1-2. entities and target
print("entities:", df["account_id"].nunique(), "of", len(df), "rows")
print(df["target"].describe())
print(df["target"].value_counts(normalize=True, dropna=False))

# 3. missingness, and whether it clusters
miss = df.isna().mean().sort_values(ascending=False)
print(miss[miss > 0])
print(df.isna().sum(axis=1).value_counts().head())   # rows missing many at once

# 4. impossible values
num = df.select_dtypes("number")
print(num.describe().T[["min", "max"]])

# 5. suspiciously strong single-column signal
print(num.corrwith(df["target"]).abs().sort_values(ascending=False).head(8))

# 6-7. time structure and duplicates
print(df["event_date"].min(), df["event_date"].max())
print("exact dupes:", df.duplicated().sum(),
      "| key dupes:", df.duplicated(subset=["account_id", "event_date"]).sum())`;

export default function EdaPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Meeting the data", color: GRAY }, { label: "Tier 1 · intuition", color: GRAY }]}
        time="about 7 minutes"
        title={<>EDA with a purpose</>}
        intro={<>Exploratory data analysis has a bad habit of becoming a gallery — thirty histograms, a correlation
          heatmap nobody reads, and no decision made. The fix is to arrive with questions.</>}
      />

      <div className="lesson">
        <h2>The test for whether a plot deserves to exist</h2>
        <p>
          <strong>Name the decision it could change.</strong> A histogram of a feature that changes nothing about
          your preprocessing, your split, your model choice or your metric is a decoration you spent ten minutes
          on. A histogram that reveals a spike of exactly 999 values is a data-quality bug and a conversation with
          whoever owns the source system.
        </p>
        <p>
          This is not an argument for less exploration. It is an argument for exploration that is{" "}
          <em>hypothesis-driven</em> — you look because you suspect something, and the plot either confirms it or
          doesn&rsquo;t. Undirected looking produces the reassuring feeling of having done EDA without the
          information.
        </p>

        <h2>The eight questions</h2>
        <p>
          These are the ones whose answers reliably change what you do next. The right-hand column is the whole
          justification for asking.
        </p>
        <div style={{ display: "grid", gap: 7, margin: "1.3rem 0" }}>
          {QUESTIONS.map((q, i) => (
            <div key={q.q} style={{ display: "flex", gap: 11, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 13px" }}>
              <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: GRAY, flexShrink: 0, width: 14 }}>{i + 1}</div>
              <div>
                <div style={{ fontSize: 13.5, color: "var(--ink)", lineHeight: 1.5 }}>{q.q}</div>
                <div style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.5, marginTop: 2 }}>Changes {q.changes}.</div>
              </div>
            </div>
          ))}
        </div>

        <CodeBlock fromScratch={CODE} />

        <Callout color={GRAY} title={<>Do this before you plot anything</>}>
          Every one of those eight answers is a printed number, not a chart. Charts are for the follow-up — once
          a number has told you <em>where</em> to look, a picture is far better than a number at telling you{" "}
          <em>what shape the problem has</em>. Reversing the order is how people end up with forty plots and no
          findings.
        </Callout>

        <h2>Look at the raw rows. Actually look at them.</h2>
        <p>
          Print twenty random rows and read them like a person. Not <code>head()</code> — the first twenty rows of
          a table are frequently sorted, oldest, or test records somebody inserted in 2019. Random rows, all
          columns, and read across one row at a time asking whether this is a plausible description of a real
          thing that happened.
        </p>
        <p>
          This finds things no summary statistic will: a free-text field where half the entries are{" "}
          <code>&quot;N/A&quot;</code> as a literal string, a currency column mixing pounds and pence, timestamps
          that are all exactly midnight because a date got cast. Summaries are lossy by construction, and the
          losses tend to be exactly the anomalies you needed to see.
        </p>

        <h2>Exploring on the training set only</h2>
        <p>
          One discipline worth adopting early: split first, then explore the training half. It feels
          over-cautious, and it protects against a real and hard-to-detect problem — that decisions you make after
          looking at the whole dataset (which features to drop, how to bin a variable, which outliers to remove)
          are informed by the test set, and your final number is optimistic by an amount nobody can estimate.
        </p>
        <p>
          Data-<em>quality</em> checks are the reasonable exception: you want to know about impossible values
          everywhere, because those are bugs rather than signal. The distinction is whether the finding changes
          your <em>modelling</em> choices or your <em>trust</em> in the data. The cost of getting this wrong is
          the same selection optimism measured in the{" "}
          <Link href="/learn/model-selection/the-selection-trap" style={link}>model selection pillar</Link>.
        </p>

        <PrevNext
          prev={{ href: "/learn/data-workflow/the-framing-contract", label: <>← The framing contract</> }}
          next={{ href: "/learn/data-workflow/one-variable-at-a-time", label: <>Next up · One variable at a time →</> }}
        />
      </div>
    </article>
  );
}
