import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "Case B: customer segmentation — Manifold",
  description:
    "The canonical business use of k-means, end to end: build RFM features, scale them, choose k by cross-checking metrics, then profile each cluster into an actionable persona. The hard part isn't the algorithm.",
};

// cluster-profile bars (standardized feature means per segment) — a real deliverable
const SEGMENTS = [
  { name: "Champions", rfm: [0.9, 1.4, 1.6], color: "var(--good)", note: "recent, frequent, high spend" },
  { name: "Loyal", rfm: [0.6, 0.9, 0.4], color: "var(--c-clustering)", note: "steady regulars" },
  { name: "At-risk", rfm: [-1.1, 0.3, 0.5], color: "var(--c-classification)", note: "were valuable, now quiet" },
  { name: "New / low", rfm: [0.4, -1.0, -0.9], color: "var(--c-trees)", note: "recent but unproven" },
];
const FEATS = ["Recency", "Frequency", "Monetary"];
const BW = 150, BH = 26;

export default function CaseSegmentationPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-clustering)")}>Clustering</span>
        <span style={chip("var(--c-metrics)")}>In the wild · Case B</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 9 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        Case B: customer segmentation
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        The most common business application of k-means — and the one where the algorithm is the{" "}
        <em>easy</em> part. Grouping customers into segments exercises the entire workflow: features,
        scaling, choosing <em>k</em>, and the real deliverable, interpretation.
      </p>

      <div className="lesson">
        <h2>The goal</h2>
        <p>
          You have a transaction log and want a handful of meaningful customer groups — so marketing can
          treat &ldquo;high-value loyalists&rdquo; differently from &ldquo;about-to-churn&rdquo; differently from
          &ldquo;new bargain-hunters.&rdquo; There&rsquo;s no ground truth; the segments are a hypothesis you&rsquo;ll
          validate by whether they&rsquo;re useful.
        </p>

        <h2>Step 1 — engineer RFM features</h2>
        <p>
          The classic feature set is <strong>RFM</strong>, three numbers per customer:
        </p>
        <ul style={ul}>
          <li><strong>Recency</strong> — days since last purchase (lower = more engaged).</li>
          <li><strong>Frequency</strong> — number of purchases.</li>
          <li><strong>Monetary</strong> — total spend.</li>
        </ul>
        <p>
          These are interpretable and numeric — exactly what k-means wants. Spend and frequency are usually
          heavily skewed, so a <strong>log transform</strong> first makes the clusters far cleaner.
        </p>

        <h2>Step 2 — scale (non-negotiable)</h2>
        <p>
          Monetary runs into the thousands; frequency into the tens. Without standardization, k-means would
          cluster almost entirely on spend (recall <Link href="/learn/k-means/why-scaling-matters" style={inlineLink}>why scaling matters</Link>).
          Log-transform, then <code>StandardScaler</code>, so all three features get equal say.
        </p>

        <h2>Step 3 — choose k by cross-checking</h2>
        <p>
          Run the elbow, silhouette, and gap statistic together and look for agreement. But here a second
          criterion outranks the metrics: <strong>actionability</strong>. Four to six segments a marketing
          team can actually name and target beats a statistically marginally-better twelve they can&rsquo;t.
          Business constraints legitimately shape <em>k</em>.
        </p>

        <h2>Step 4 — profile the clusters (the actual deliverable)</h2>
        <p>
          A clustering nobody can interpret is worthless. For each segment, look at its centroid in the{" "}
          <em>original</em> units and write down what it means. This profile table <em>is</em> the output:
        </p>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 16, margin: "1.2rem 0" }}>
          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 10 }}>standardized RFM profile per segment (bar = above/below average):</div>
          {SEGMENTS.map((s) => (
            <div key={s.name} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{s.name}</span>
                <span style={{ fontSize: 11, color: "var(--muted)" }}>{s.note}</span>
              </div>
              <svg viewBox={`0 0 ${BW} ${BH}`} style={{ width: "100%", maxWidth: 360, height: "auto" }}>
                {s.rfm.map((v, i) => {
                  const zero = BW / 2;
                  const x = zero + (v / 2) * (BW / 2 - 6);
                  const y = i * 8 + 1;
                  return (
                    <g key={i}>
                      <line x1={zero} y1={0} x2={zero} y2={BH} stroke="var(--border-strong)" strokeWidth={0.5} />
                      <rect x={Math.min(zero, x)} y={y} width={Math.abs(x - zero)} height={6} fill={s.color} fillOpacity={0.85} rx={1} />
                      <text x={2} y={y + 6} fontSize={5} fill="var(--faint)">{FEATS[i][0]}</text>
                    </g>
                  );
                })}
              </svg>
            </div>
          ))}
        </div>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-clustering)", marginBottom: 4 }}>
            The real lesson of this case
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            k-means is maybe 10% of the work. Feature engineering, scaling, the transform, and especially
            turning centroids into named personas a business can act on — that&rsquo;s the other 90%. The
            algorithm gives you groups; <em>you</em> give them meaning. Validate that the segments are
            stable (resampling) and that they actually differ in ways the business cares about before
            shipping them.
          </p>
        </div>

        <h2>End-to-end pipeline</h2>
        <CodeBlock fromScratch={codeScratch} withLibrary={codeLib} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/k-means/case-image-quantization" style={navLink}>← Case A: image colour quantization</Link>
          <Link href="/learn/k-means/case-clustering-embeddings" style={{ ...navLink, fontWeight: 600 }}>Next up · Case C: clustering embeddings →</Link>
        </div>
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np, pandas as pd

# build RFM from a transaction log
today = df["date"].max()
rfm = df.groupby("customer_id").agg(
    recency=("date", lambda s: (today - s.max()).days),
    frequency=("order_id", "nunique"),
    monetary=("amount", "sum"),
)

# log-transform the skewed features, then z-score everything
X = np.log1p(rfm[["frequency", "monetary"]])
X["recency"] = rfm["recency"]
X = (X - X.mean()) / X.std()

labels = fit_kmeans(X.values, k=4)                 # your k-means
rfm["segment"] = labels
print(rfm.groupby("segment").mean())               # profile in ORIGINAL units`;

const codeLib = `from sklearn.preprocessing import StandardScaler, FunctionTransformer
from sklearn.cluster import KMeans
from sklearn.pipeline import make_pipeline
import numpy as np

pipe = make_pipeline(
    FunctionTransformer(np.log1p),     # tame skew
    StandardScaler(),                  # equal weight to R, F, M
    KMeans(n_clusters=4, n_init=10, random_state=0),
)
rfm["segment"] = pipe.fit_predict(rfm[["recency", "frequency", "monetary"]])

# the deliverable: human-readable profiles
print(rfm.groupby("segment")[["recency", "frequency", "monetary"]].mean())`;

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const inlineLink: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-clustering) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-clustering) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0" };
