import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { DecisionPoint } from "@/components/capstone/DecisionPoint";

export const metadata = {
  title: "Capstone: framing the problem — Manifold",
  description:
    "Before any modeling, a senior data scientist frames the problem: what we predict, the metric, the assumptions, and the one data fact — a censored target — that shapes everything downstream.",
};

export default function FramingPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: "var(--c-regression)" }, { label: "1 · The project", color: "var(--c-metrics)" }]}
        time="about 8 minutes"
        title={<>Framing the problem</>}
        intro={<>
          The biggest difference between a junior and a senior approach is what happens <em>before</em> the first
        model. We answer four questions — and one of the answers will dictate a known limitation of every model
        we build.
        </>}
        titleSize={42}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>Load and look</h2>
        <p>The first command is never <code>.fit()</code>. It&rsquo;s a look at shape, columns, and the target.</p>
        <CodeBlock fromScratch={code} withLibrary={code} />
        <CodeOutput>{`train: (16512, 12)   test: (4128, 11)
columns: IncomeLevel, PropertyAge, TotalRooms, TotalBedrooms,
         NeighborhoodPop, AvgOccupancy, Latitude, Longitude,
         TargetPrice, PropertyID, RoomsPerHousehold, BedroomsRatio

TargetPrice  count=16512  mean=2.07  std=1.16
             min=0.15  median=1.80  max=5.00
             rows at exactly 5.00:  808  (4.9%)   <-- capped!`}</CodeOutput>

        <h2>1 — What are we predicting, and for whom?</h2>
        <p>
          <code>TargetPrice</code> is a <em>median</em> over a census block, in $100k units — neighbourhood-level
          value, not a single-home appraisal. A realistic consumer is a valuation or screening tool, where
          stakeholders will ask <em>why</em> a block scored as it did. That pushes us toward an interpretable
          model first: a transparent linear baseline we can read, before any black box.
        </p>

        <h2>2 — What metric defines success?</h2>
        <DecisionPoint
          question={<>The target is a price in $100k units, and a wildly wrong valuation hurts far more than a slightly wrong one. Which metric do you lead with?</>}
          options={[
            {
              label: "RMSE — same units as the price, penalises large errors quadratically",
              verdict: "best",
              response: <>Right — the quadratic penalty encodes exactly our cost structure (big valuation misses are disproportionately bad), and reporting in $100k units keeps stakeholders in the loop. We&rsquo;ll report R² alongside it and watch MAE as a robustness cross-check.</>,
            },
            {
              label: "MAE — robust to outliers, easy to explain",
              verdict: "close",
              response: <>Defensible — MAE is the honest &ldquo;typical miss&rdquo; and we do track it. But it treats a $300k error as only 3× worse than a $100k one; for valuations, the big miss is what gets you sued. We keep MAE as the cross-check, not the headline.</>,
            },
            {
              label: "R² — scale-free, easy to compare across models",
              verdict: "close",
              response: <>Useful, and we report it on every leaderboard — but it&rsquo;s unitless. &ldquo;R² = 0.65&rdquo; tells a stakeholder nothing about how many dollars off a prediction is. Lead with the error in the target&rsquo;s own units; quote R² beside it.</>,
            },
          ]}
        />
        <p>
          The target is in $100k units, so the error should be too. We lead with <strong>RMSE</strong> (same
          units, penalises large errors quadratically — right when a wildly wrong valuation is much worse than a
          slightly wrong one), report <strong>R²</strong> for a scale-free &ldquo;variance explained,&rdquo; and watch{" "}
          <strong>MAE</strong> as a more outlier-robust cross-check. Fixing the metric now stops us from
          rationalising whichever number looks best later.
        </p>

        <Callout color="var(--c-regression)" title={<>3 — The fact that shapes everything: the target is censored</>}>
          The output above already flagged it: the target maxes out at exactly <strong>5.0</strong>, with{" "}
            <strong>808 blocks (4.9%)</strong> pinned at that ceiling. This is <strong>censoring</strong> — every
            home worth $500k or $900k was recorded as &ldquo;5.0.&rdquo; We haven&rsquo;t modeled anything yet and already know
            our models will <em>systematically under-predict</em> the most expensive areas. Upgrade 2 (Tobit) is
            this problem&rsquo;s dedicated fix, and the diagnostics page will confirm the bias exactly as predicted.
        </Callout>

        <h2>4 — What are we assuming?</h2>
        <ul style={ul}>
          <li><strong>Train and test share a distribution</strong> — patterns will transfer (we sanity-check predicted means at the end).</li>
          <li><strong>Relationships are roughly linear</strong> — the baseline&rsquo;s working assumption; we expect geography to violate it, and Upgrades 1 &amp; 3 to address that.</li>
          <li><strong>Rows are independent</strong> — shaky for spatial data, since neighbouring blocks correlate; a caveat we carry.</li>
          <li><strong>Only these features are available at prediction time</strong> — nothing derived from the target (we audit leakage explicitly).</li>
        </ul>

        <PrevNext prev={{ href: "/learn/california-housing-capstone", label: <>← Overview &amp; goal</> }} next={{ href: "/learn/california-housing-capstone/eda", label: <>Next up · EDA: distributions &amp; signal →</> }} />
      </div>
    </article>
  );
}

const code = `import pandas as pd
train = pd.read_csv("estate_train.csv")
test  = pd.read_csv("estate_test.csv")

print("train:", train.shape, "  test:", test.shape)
print(train.columns.tolist())
print(train["TargetPrice"].describe())
print("rows at cap:", (train.TargetPrice >= 4.9999).sum())`;

const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
