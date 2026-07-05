import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { DecisionPoint } from "@/components/capstone/DecisionPoint";

export const metadata = {
  title: "Capstone: data quality & cleaning — Manifold",
  description:
    "Hunting for what's broken: impossible negative populations, 1,243-person households, absurd room counts, heavy skew, and missing values — each found with domain sense and handled with a reasoned decision.",
};

export default function DataQualityPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: "var(--c-regression)" }, { label: "2 · Understand the data", color: "var(--c-metrics)" }]}
        time="about 8 minutes"
        title={<>Data quality & cleaning</>}
        intro={<>
          This is the unglamorous, decisive part. None of these issues throws an error — the model would train
        happily and quietly get worse. Catching them is what domain knowledge is <em>for</em>.
        </>}
        titleSize={42}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>Run the checks</h2>
        <p>Summary statistics, read against what&rsquo;s physically possible, surface four problems at once.</p>
        <CodeBlock fromScratch={code} withLibrary={code} />
        <CodeOutput>{`NeighborhoodPop  min = -44.6   negative rows: 20      <- impossible
AvgOccupancy     max = 1243.7  rows > 20:    8        <- absurd
RoomsPerHousehold max = 52.0   rows > 20:    9        <- outliers
PropertyAge      missing: 1313  (8.0%)                <- to impute

skew:  TotalRooms 18.6   AvgOccupancy 87.9
       NeighborhoodPop 5.3   IncomeLevel 1.6`}</CodeOutput>

        <h2>What each one is, and why it matters</h2>
        <ul style={ul}>
          <li>
            <strong>Negative populations.</strong> A minimum of −44.6 across 20 rows — a population cannot be
            negative. These are <em>corrupted</em>, not extreme. A model fed them learns from nonsense.
          </li>
          <li>
            <strong>1,243-person households.</strong> <code>AvgOccupancy</code> is a ratio, and a tiny
            denominator produces these blow-ups. Eight such rows would dominate a least-squares fit single-
            handedly.
          </li>
          <li>
            <strong>52-room averages.</strong> Same story for <code>TotalRooms</code> (up to 142) and{" "}
            <code>RoomsPerHousehold</code> — ratio artifacts, not mansions.
          </li>
          <li>
            <strong>Heavy skew.</strong> Skewness near 88 for occupancy and 19 for rooms violates the rough
            symmetry linear models assume, and argues for transforms.
          </li>
          <li>
            <strong>Missing age.</strong> 1,313 rows (8%); every other column is complete. A quick check shows
            missing-age blocks have a similar price distribution to the rest, so treating it as roughly
            missing-at-random and imputing is defensible — with a missingness flag held in reserve.
          </li>
        </ul>

        <DecisionPoint
          question={<>20 blocks report a <em>negative</em> population — physically impossible, clearly corrupted. What do you do with those rows?</>}
          options={[
            {
              label: "Delete them — 20 rows out of 16,512 is nothing",
              verdict: "miss",
              response: <>The trap: deletion is impossible at prediction time. The test set has the same artifacts, and you must score <em>every</em> row — there is no &ldquo;delete&rdquo; in production. Whatever you do must work on data you can&rsquo;t drop.</>,
            },
            {
              label: "Set the impossible values to missing, then impute",
              verdict: "best",
              response: <>The rows are fine on every other feature — only the population is corrupted. Marking it missing and median-imputing (with the median computed on training data only) keeps the row, kills the nonsense, and works identically on the test set.</>,
            },
            {
              label: "Keep them — the model will learn to ignore 20 weird rows",
              verdict: "miss",
              response: <>Least squares does the opposite: extreme values get <em>extreme leverage</em>. A handful of impossible rows can visibly tilt the fit. Models don&rsquo;t know physics — that a population can&rsquo;t be negative is domain knowledge only you can inject.</>,
            },
          ]}
        />

        <Callout color="var(--c-regression)" title={<>The judgement: correct, transform, or impute — rarely delete</>}>
          Deletion is tempting but wrong here: it discards rows that are fine on every other feature, and it&rsquo;s
            impossible at prediction time — the test set has the same artifacts and you must score every row.
            So: <strong>impossible values</strong> (negative pop) become missing and get imputed;{" "}
            <strong>extreme-but-real outliers</strong> (occupancy, rooms) get neutralised by a log transform that
            keeps the row while killing its leverage; <strong>missing values</strong> get a median fill computed
            on the training set only. Every choice is reversible, test-compatible, and reasoned — the next page
            turns these decisions into one clean pipeline.
        </Callout>

        <PrevNext prev={{ href: "/learn/california-housing-capstone/eda", label: <>← EDA: distributions &amp; signal</> }} next={{ href: "/learn/california-housing-capstone/preprocessing", label: <>Next up · Preprocessing pipeline →</> }} />
      </div>
    </article>
  );
}

const code = `print("neg pop rows:", (train.NeighborhoodPop < 0).sum(),
      " min:", train.NeighborhoodPop.min())
print("occupancy > 20:", (train.AvgOccupancy > 20).sum(),
      " max:", train.AvgOccupancy.max())
print("PropertyAge missing:", train.PropertyAge.isna().sum())
print("skew:", train[["TotalRooms","AvgOccupancy",
                      "NeighborhoodPop","IncomeLevel"]].skew())`;

const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
