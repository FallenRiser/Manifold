import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeBlock } from "@/components/CodeBlock";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "Pipelines & the fold — Manifold",
  description:
    "The structural fix for preprocessing leakage: make it impossible rather than remembering not to do it. Pipelines, ColumnTransformer, and the splitters that encode what deployment means.",
};

const GRAY = "var(--c-metrics)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

const WRONG = `# The version that reports 0.878 on data with no signal in it.
X = StandardScaler().fit_transform(X)                 # saw every row
X = SelectKBest(f_classif, k=20).fit_transform(X, y)  # saw every label
scores = cross_val_score(LogisticRegression(), X, y, cv=5)

# By the time cross_val_score runs, the "held-out" rows have already
# contributed to the scaling and to the choice of features. There is
# nothing left for it to hold out.`;

const RIGHT = `from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.feature_selection import SelectKBest, f_classif
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import GroupKFold, cross_val_score

numeric = Pipeline([
    ("impute", SimpleImputer(strategy="median", add_indicator=True)),
    ("scale", StandardScaler()),
])
categorical = Pipeline([
    ("impute", SimpleImputer(strategy="constant", fill_value="__missing__")),
    ("encode", OneHotEncoder(handle_unknown="ignore", min_frequency=20)),
])

model = Pipeline([
    ("prep", ColumnTransformer([
        ("num", numeric, num_cols),
        ("cat", categorical, cat_cols),
    ])),
    ("select", SelectKBest(f_classif, k=20)),
    ("clf", LogisticRegression(max_iter=5000)),
])

# Every fitted step now refits inside each fold, and the split encodes
# what deployment means: a customer the model has never seen.
scores = cross_val_score(model, X, y, cv=GroupKFold(5), groups=customer_id)`;

const SPLITS: { deployment: string; splitter: string }[] = [
  { deployment: "a new customer we've never seen", splitter: "GroupKFold / GroupShuffleSplit on customer id" },
  { deployment: "next month, for customers we know", splitter: "TimeSeriesSplit, or an explicit date cut" },
  { deployment: "a new customer, next month", splitter: "group by customer AND cut by date — the strictest, and usually the honest one" },
  { deployment: "a new site or region we haven't operated in", splitter: "leave-one-group-out on site" },
  { deployment: "more of the same population, drawn at random", splitter: "StratifiedKFold — the rare case where the default is right" },
];

export default function PipelinesPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Data quality & leakage", color: GRAY }, { label: "Tier 2 · practitioner", color: GRAY }]}
        time="about 8 minutes"
        title={<>Pipelines &amp; the fold</>}
        intro={<>The previous page listed a dozen steps that must be fitted inside the fold. Remembering all of
          them, every time, forever, is not a plan. Making the mistake structurally impossible is.</>}
      />

      <div className="lesson">
        <h2>Two versions of the same analysis</h2>
        <p>
          Here is the code that produced the fabricated 0.878. Nothing about it looks careless — it is the order
          most people write things in, because it reads like a sequence of preparation steps followed by
          evaluation.
        </p>
        <CodeBlock fromScratch={WRONG} />
        <p>
          The fix is not to be more careful. It is to change the shape of the code so that &ldquo;fit the
          preprocessing on everything&rdquo; is no longer expressible. A <code>Pipeline</code> is an estimator: it
          has one <code>fit</code>, and cross-validation calls that <code>fit</code> separately on each
          training fold, which refits every step inside it.
        </p>
        <CodeBlock fromScratch={RIGHT} />

        <Callout color={GRAY} title={<>Why this beats discipline</>}>
          The leaky version requires you to remember a rule on every line, every time, for the life of the
          project — including the lines added in a hurry six months from now by someone who has not read this
          page. The pipeline version requires you to remember it <em>once</em>, at the point where you build the
          object. <strong>Prefer the fix that changes what is possible over the fix that changes what you
          intend.</strong>
        </Callout>

        <h2>What the pipeline buys beyond the leak</h2>
        <ul>
          <li><strong>The hyperparameters of preprocessing become tunable</strong> —{" "}
            <code>prep__num__impute__strategy</code> is a grid-search parameter like any other, and the imputation
            strategy is a modelling choice that deserves to be chosen rather than assumed.</li>
          <li><strong>Training and serving share one object.</strong> A pickled pipeline applies exactly the
            transforms it was fitted with. The alternative — reimplementing the preprocessing in the serving code
            — is one of the most reliable sources of training/serving skew there is.</li>
          <li><strong>Unseen categories stop being a crash.</strong>{" "}
            <code>handle_unknown=&quot;ignore&quot;</code> is a decision you are forced to make at build time,
            rather than discovering it at 3am when a new country code appears.</li>
        </ul>

        <h2>The splitter is where the contract cashes out</h2>
        <p>
          The pipeline handles <em>what</em> is fitted. The splitter handles <em>what the model is allowed to
          know</em> — and it is where the unit line of your{" "}
          <Link href="/learn/data-workflow/the-framing-contract" style={link}>framing contract</Link> turns into
          code. The question is always the same: <strong>what will genuinely be unfamiliar at prediction
          time?</strong> Then enforce exactly that ignorance.
        </p>
        <div style={{ display: "grid", gap: 7, margin: "1.3rem 0" }}>
          {SPLITS.map((s) => (
            <div key={s.deployment} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 13px" }}>
              <div style={{ fontSize: 13.5, color: "var(--ink)", lineHeight: 1.5 }}>Deployment means: {s.deployment}</div>
              <div style={{ fontSize: 12.5, color: GRAY, lineHeight: 1.5, marginTop: 2 }}>→ {s.splitter}</div>
            </div>
          ))}
        </div>
        <p>
          The third row is the one people avoid, because grouping <em>and</em> cutting by date leaves less data
          and produces the worst-looking number. It is also, for most production systems, the only honest one.
          A model deployed next quarter will meet customers it has never seen, in a month it has never seen, at
          the same time.
        </p>

        <Callout color={GRAY} title={<>The ranking, from the measurements in this pillar</>}>
          Preprocessing leakage on a wide dataset: <strong>+0.378</strong> of pure invention. Group leakage:{" "}
          <strong>0.525</strong> of R². Temporal leakage: <strong>0.616</strong> of R². Against these, choosing 5
          folds versus 10 is a rounding error. Spend your care on what the split simulates and on what was fitted
          inside it — the rest of the validation literature is second-order by comparison.
        </Callout>

        <h2>One caveat, so the rule doesn&rsquo;t become superstition</h2>
        <p>
          Not every transform needs to be inside the fold. A step with <strong>no fitted parameters</strong> —
          taking a log, extracting the day-of-week from a timestamp, dividing two columns — uses nothing from
          other rows and can be applied anywhere without leaking. Similarly, dropping a column because it is
          unavailable at prediction time is a decision about the world, not a statistic estimated from data.
        </p>
        <p>
          The test is precise and worth applying rather than pattern-matching:{" "}
          <strong>does this step&rsquo;s output for row <em>i</em> depend on any other row?</strong> If yes, it
          belongs in the pipeline. If no, it is safe outside — and it is usually still tidier inside.
        </p>

        <Quiz
          accent={GRAY}
          title="Chapter checkpoint · data quality &amp; leakage"
          questions={[
            {
              q: <>You apply SMOTE to balance your classes, then cross-validate. What has gone wrong?</>,
              options: [
                "Nothing — SMOTE is standard practice for imbalanced data",
                "Synthetic rows interpolated from training examples end up in the test folds, so the model is scored on near-copies of what it trained on",
                "SMOTE should be applied after the model is fitted",
              ],
              answer: 1,
              explain: <>SMOTE creates new minority rows by interpolating between existing ones. Applied before the split, a synthetic row built from two training points can land in a test fold — and the model has effectively already seen it. It is preprocessing leakage exactly like the feature-selector case, and the fix is identical: put the resampler inside the pipeline (imblearn&rsquo;s Pipeline, which only resamples during fit).</>,
            },
            {
              q: <>Which of these transforms is genuinely safe to apply before splitting?</>,
              options: [
                "Standard scaling, because the mean is a simple statistic",
                "Taking log(x + 1) of a skewed column",
                "Target encoding a categorical, because it uses a smoothed average",
              ],
              answer: 1,
              explain: <>The test is whether the output for one row depends on any other row. A log transform is row-wise arithmetic — no other row enters it, so it cannot leak. Scaling depends on the mean and standard deviation of all rows. Target encoding is the worst of the three: it computes an average <em>of the target</em>, so every row&rsquo;s encoded value is partly its own label.</>,
            },
            {
              q: <>Your data has both repeated customers and a strong time trend. What split does deployment imply?</>,
              options: [
                "GroupKFold on customer is sufficient — the time trend affects both halves equally",
                "Group by customer and cut by date, even though it leaves you less data and a worse number",
                "A random split is fine as long as the pipeline prevents preprocessing leakage",
              ],
              answer: 1,
              explain: <>Deployment means a customer you have not seen, in a month you have not seen. Grouping alone still lets the model train on the future; cutting by date alone still lets it recognise individuals. You need both, and the resulting number will be the lowest and the only one that predicts what production will do. A pipeline fixes what was <em>fitted</em>; it does nothing about what the split allows the model to know.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/data-workflow/the-many-faces-of-leakage", label: <>← The many faces of leakage</> }}
          next={{ href: "/learn/data-workflow/preprocessing-is-modelling", label: <>Next chapter · Preprocessing is modelling →</> }}
        />
      </div>
    </article>
  );
}
