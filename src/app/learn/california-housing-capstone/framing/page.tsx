import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";

export const metadata = {
  title: "Capstone: framing the problem — Manifold",
  description:
    "Before any modeling, a senior data scientist frames the problem: what we predict, the metric, the assumptions, and the one data fact — a censored target — that shapes everything downstream.",
};

export default function FramingPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-regression)")}>Capstone</span>
        <span style={chip("var(--c-metrics)")}>1 · The project</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 8 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 42, lineHeight: 1.08, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        Framing the problem
      </h1>
      <p style={{ fontSize: 17.5, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        The biggest difference between a junior and a senior approach is what happens <em>before</em> the first
        model. We answer four questions — and one of the answers will dictate a known limitation of every model
        we build.
      </p>

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
        <p>
          The target is in $100k units, so the error should be too. We lead with <strong>RMSE</strong> (same
          units, penalises large errors quadratically — right when a wildly wrong valuation is much worse than a
          slightly wrong one), report <strong>R²</strong> for a scale-free &ldquo;variance explained,&rdquo; and watch{" "}
          <strong>MAE</strong> as a more outlier-robust cross-check. Fixing the metric now stops us from
          rationalising whichever number looks best later.
        </p>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-regression)", marginBottom: 4 }}>
            3 — The fact that shapes everything: the target is censored
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            The output above already flagged it: the target maxes out at exactly <strong>5.0</strong>, with{" "}
            <strong>808 blocks (4.9%)</strong> pinned at that ceiling. This is <strong>censoring</strong> — every
            home worth $500k or $900k was recorded as &ldquo;5.0.&rdquo; We haven&rsquo;t modeled anything yet and already know
            our models will <em>systematically under-predict</em> the most expensive areas. Upgrade 2 (Tobit) is
            this problem&rsquo;s dedicated fix, and the diagnostics page will confirm the bias exactly as predicted.
          </p>
        </div>

        <h2>4 — What are we assuming?</h2>
        <ul style={ul}>
          <li><strong>Train and test share a distribution</strong> — patterns will transfer (we sanity-check predicted means at the end).</li>
          <li><strong>Relationships are roughly linear</strong> — the baseline&rsquo;s working assumption; we expect geography to violate it, and Upgrades 1 &amp; 3 to address that.</li>
          <li><strong>Rows are independent</strong> — shaky for spatial data, since neighbouring blocks correlate; a caveat we carry.</li>
          <li><strong>Only these features are available at prediction time</strong> — nothing derived from the target (we audit leakage explicitly).</li>
        </ul>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/california-housing-capstone" style={navLink}>← Overview &amp; goal</Link>
          <Link href="/learn/california-housing-capstone/eda" style={{ ...navLink, fontWeight: 600 }}>Next up · EDA: distributions &amp; signal →</Link>
        </div>
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

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-regression) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-regression) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0" };
