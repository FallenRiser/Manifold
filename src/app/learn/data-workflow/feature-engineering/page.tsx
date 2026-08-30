import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeBlock } from "@/components/CodeBlock";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "Feature engineering — Manifold",
  description:
    "Where domain knowledge enters the model. The four families of derived feature that repay the effort, the honest ROI against modern boosting, and the leakage each family invites.",
};

const GRAY = "var(--c-metrics)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

const FAMILIES: { name: string; idea: string; examples: string; risk: string }[] = [
  {
    name: "Ratios & differences",
    idea: "the model has to work hard to learn division; you can do it in one line",
    examples: "rooms per household · debt-to-income · price relative to the local median · spend this month over spend last month",
    risk: "denominators near zero. Clip them, or use a difference of logs instead",
  },
  {
    name: "Time-derived",
    idea: "a timestamp is not a number — it is an hour, a weekday, a distance from an event",
    examples: "hour of day · day of week · days since signup · days until renewal · is-holiday",
    risk: "anything measured from 'today' rather than from the row's own cut-off",
  },
  {
    name: "Aggregations over a history",
    idea: "the richest source in transactional data — summarise a window that ends at the cut-off",
    examples: "logins in the last 7/30/90 days · rolling mean and its slope · count of distinct merchants · time since last event",
    risk: "the biggest leakage surface in this list. Every window must end at the cut-off",
  },
  {
    name: "Domain interactions",
    idea: "the ones a practitioner would name in conversation and no search would find",
    examples: "distance to coast for house prices · dose per kilogram of body weight · load relative to rated capacity",
    risk: "none structurally — this is where the real gains are, and where you need a domain expert",
  },
];

const CODE = `# The aggregation family, written so it cannot leak: every window is
# defined relative to an explicit per-row cut-off, never to "today".

def account_features(events, cut_off):
    past = events[events.timestamp < cut_off]
    g = past.groupby("account_id")

    f = pd.DataFrame(index=g.size().index)
    for w in (7, 30, 90):
        recent = past[past.timestamp >= cut_off - pd.Timedelta(days=w)]
        f[f"logins_{w}d"] = recent.groupby("account_id")["login"].sum()

    # a trend, not just a level: is engagement rising or falling?
    f["login_trend"] = f["logins_7d"] / (f["logins_30d"] / 30 * 7 + 1)

    f["days_since_last"] = (cut_off - g["timestamp"].max()).dt.days
    f["tenure_days"] = (cut_off - g["timestamp"].min()).dt.days
    f["distinct_devices"] = g["device_id"].nunique()
    return f.fillna(0)

# Note what the trend feature does: levels tell you where a customer is,
# ratios of windows tell you where they are GOING. For churn the second
# is usually the stronger signal, and no model recovers it from levels
# alone without being handed both windows.`;

export default function FeatureEngineeringPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Preparing features", color: GRAY }, { label: "Tier 2 · practitioner", color: GRAY }]}
        time="about 9 minutes"
        title={<>Feature engineering</>}
        intro={<>The one part of the workflow where knowing something about the actual subject beats knowing
          something about machine learning — and the part that modern models have made smaller without making it
          go away.</>}
      />

      <div className="lesson">
        <h2>What a derived feature is really for</h2>
        <p>
          A model can only find relationships it is capable of expressing. A linear model cannot form a ratio; a
          tree can approximate one only with a staircase of splits, spending depth it could have used elsewhere.
          When you hand the model <code>rooms_per_household</code> instead of <code>rooms</code> and{" "}
          <code>households</code>, you are not adding information — both columns were already there. You are
          adding <strong>expressiveness the model would otherwise have to buy with capacity.</strong>
        </p>
        <p>
          Which is why the payoff depends heavily on the model. For a linear model, engineered features are the
          main lever available. For a deep gradient-boosted ensemble on plenty of data, many of them are
          re-derivable and the gain shrinks toward nothing — but not to nothing, because two categories of feature
          remain out of reach entirely.
        </p>

        <Callout color={GRAY} title={<>The two things no model can engineer for itself</>}>
          <strong>Information that isn&rsquo;t in the table</strong> — a distance-to-coast column computed from
          coordinates plus a coastline shapefile, a holiday calendar, a mapping from postcode to deprivation
          index. And <strong>aggregations across rows</strong> — a model sees one row at a time, so any summary
          of a customer&rsquo;s history has to be constructed before it ever gets there. These two are where
          feature engineering still wins outright, and both require you to know something about the domain rather
          than about the algorithm.
        </Callout>

        <h2>Four families that repay the effort</h2>
        <div style={{ display: "grid", gap: 9, margin: "1.3rem 0" }}>
          {FAMILIES.map((f) => (
            <div key={f.name} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 15px" }}>
              <div className="font-display" style={{ fontSize: 13.5, fontWeight: 500, color: GRAY, marginBottom: 3 }}>{f.name}</div>
              <div style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.55 }}>{f.idea}.</div>
              <div style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.55, marginTop: 3 }}>{f.examples}</div>
              <div style={{ fontSize: 12, color: "var(--warn)", lineHeight: 1.5, marginTop: 3 }}>Watch: {f.risk}.</div>
            </div>
          ))}
        </div>

        <p>
          The third family is where most of the value in transactional data lives, and it is also the one that
          leaks most readily — so it is worth writing once, carefully, as a function of an explicit cut-off.
        </p>
        <CodeBlock fromScratch={CODE} />

        <h2>A worked gain, on real numbers</h2>
        <p>
          The{" "}
          <Link href="/learn/california-housing-capstone/spatial-features" style={link}>housing capstone</Link>{" "}
          measures this rather than asserting it. Adding spatial features — distance to the coast, distance to the
          nearest city centre — to a model that already had latitude and longitude gained{" "}
          <strong>ΔR² +0.019</strong>. That is a real, reproducible improvement and it is also modest, which is the
          honest shape of most feature engineering: several small wins from features a practitioner would name,
          rather than one transformative discovery.
        </p>
        <p>
          Notice that the model already <em>had</em> the coordinates. A boosted ensemble can carve latitude and
          longitude into regions and approximate a coastline given enough splits and enough data. Handing it the
          distance directly saved it that work — and the gain was the size of the work saved, not the size of the
          information added.
        </p>

        <h2>The discipline that stops this becoming a fishing trip</h2>
        <p>
          Feature engineering has an obvious failure mode: generate five hundred candidates, keep the ones that
          score well, and manufacture exactly the optimism measured in{" "}
          <Link href="/learn/data-workflow/the-many-faces-of-leakage" style={link}>the leakage chapter</Link> —
          where selecting 20 columns out of 2,000 pure-noise ones produced a CV score of 0.877 against a truth of
          0.500.
        </p>
        <ol>
          <li><strong>Write the hypothesis before the feature.</strong> &ldquo;Customers whose recent activity is
            falling relative to their own baseline are more likely to churn&rdquo; earns a feature. &ldquo;Let&rsquo;s
            try all pairwise ratios&rdquo; earns a search-space penalty.</li>
          <li><strong>Add in batches and evaluate as a batch.</strong> Ten features from one hypothesis, one
            evaluation. Not ten evaluations.</li>
          <li><strong>Keep selection inside the fold.</strong> If you must select, it is a pipeline step, for
            exactly the reasons the previous chapter measured.</li>
          <li><strong>Prefer the feature you can explain</strong> when two perform equally. You will have to
            defend it, monitor it, and reason about it when it drifts.</li>
        </ol>

        <Quiz
          accent={GRAY}
          title="Chapter checkpoint · preparing features"
          questions={[
            {
              q: <>You add 300 automatically generated interaction features. CV score improves from 0.81 to 0.86. What is the most likely explanation?</>,
              options: [
                "The interactions captured real structure the model was missing",
                "Some of the improvement is real and some is optimism from searching 300 options — and you cannot tell which from this number",
                "Nothing is real; automated features never help",
              ],
              answer: 1,
              explain: <>Both effects are present and this measurement cannot separate them. Searching a large space inflates whatever you report from that same search, by roughly √(ln M / 2n) — the union bound result. The fix is not to avoid generated features but to measure them on data that took no part in choosing them: a held-out set, or nested CV.</>,
            },
            {
              q: <>Which of these is a gradient-boosted model <em>least</em> able to derive for itself?</>,
              options: [
                "The ratio of two columns already in the table",
                "Distance from each row's coordinates to the nearest coastline",
                "A threshold effect where the target jumps above age 65",
              ],
              answer: 1,
              explain: <>The ratio is approximable with splits, and a threshold effect is exactly what a tree does natively — it will find the age-65 cut without help. The coastline distance requires data that is not in the table at all: a coastline geometry. No amount of model capacity conjures external information, which is why this family of feature keeps its value regardless of how good models get.</>,
            },
            {
              q: <>You are shipping a LightGBM model. Which preprocessing step is most likely to be wasted effort?</>,
              options: [
                "Building rolling-window aggregation features from event history",
                "Standard-scaling the numeric columns",
                "Deciding what happens when an unseen category appears",
              ],
              answer: 1,
              explain: <>Trees split on the order of values, and standard scaling is monotone — so it produces a bit-for-bit identical model. The aggregations are cross-row summaries the model cannot construct, and the unseen-category policy is a production correctness question. Scaling for a tree model is the clearest example of preprocessing performed as ritual.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/data-workflow/scaling-and-transforms", label: <>← Scaling &amp; transforms</> }}
          next={{ href: "/learn/data-workflow/start-with-a-baseline", label: <>Next chapter · Start with a baseline →</> }}
        />
      </div>
    </article>
  );
}
