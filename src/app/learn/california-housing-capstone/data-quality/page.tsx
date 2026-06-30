import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";

export const metadata = {
  title: "Capstone: data quality & cleaning — Manifold",
  description:
    "Hunting for what's broken: impossible negative populations, 1,243-person households, absurd room counts, heavy skew, and missing values — each found with domain sense and handled with a reasoned decision.",
};

export default function DataQualityPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-regression)")}>Capstone</span>
        <span style={chip("var(--c-metrics)")}>2 · Understand the data</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 8 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 42, lineHeight: 1.08, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        Data quality & cleaning
      </h1>
      <p style={{ fontSize: 17.5, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        This is the unglamorous, decisive part. None of these issues throws an error — the model would train
        happily and quietly get worse. Catching them is what domain knowledge is <em>for</em>.
      </p>

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

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-regression)", marginBottom: 4 }}>
            The judgement: correct, transform, or impute — rarely delete
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            Deletion is tempting but wrong here: it discards rows that are fine on every other feature, and it&rsquo;s
            impossible at prediction time — the test set has the same artifacts and you must score every row.
            So: <strong>impossible values</strong> (negative pop) become missing and get imputed;{" "}
            <strong>extreme-but-real outliers</strong> (occupancy, rooms) get neutralised by a log transform that
            keeps the row while killing its leverage; <strong>missing values</strong> get a median fill computed
            on the training set only. Every choice is reversible, test-compatible, and reasoned — the next page
            turns these decisions into one clean pipeline.
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/california-housing-capstone/eda" style={navLink}>← EDA: distributions &amp; signal</Link>
          <Link href="/learn/california-housing-capstone/preprocessing" style={{ ...navLink, fontWeight: 600 }}>Next up · Preprocessing pipeline →</Link>
        </div>
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

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-regression) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-regression) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0" };
