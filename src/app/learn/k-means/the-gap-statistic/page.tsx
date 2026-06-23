import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "The gap statistic — Manifold",
  description:
    "The gap statistic compares your clustering's inertia to what you'd get on pure random noise. The k where real data pulls farthest ahead of the null is the answer — and it can say k = 1.",
};

// observed log-inertia vs the null (random) reference, and the gap between them
const KS = [1, 2, 3, 4, 5, 6, 7];
const OBS = [3.9, 3.2, 2.55, 2.1, 2.0, 1.93, 1.88];     // log W_k on real data
const REF = [3.95, 3.55, 3.18, 2.85, 2.6, 2.4, 2.25];   // expected log W_k on noise
const GAP = OBS.map((v, i) => REF[i] - v);
const bestGapK = KS[GAP.indexOf(Math.max(...GAP))];
const W = 320, H = 180, padL = 34, padB = 26, padT = 12;
const lo = 1.8, hi = 4.0;
const gx = (k: number) => Math.round((padL + ((k - 1) / (KS.length - 1)) * (W - padL - 12)) * 100) / 100;
const gy = (v: number) => Math.round((padT + (1 - (v - lo) / (hi - lo)) * (H - padT - padB)) * 100) / 100;

export default function GapStatisticPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-clustering)")}>Clustering</span>
        <span style={chip("var(--c-metrics)")}>Go deeper</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 7 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        The gap statistic
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        Elbow and silhouette both assume there <em>are</em> clusters. The gap statistic asks a deeper
        question first: is your data more clustered than pure random noise — and if so, by how much, at
        each <em>k</em>?
      </p>

      <div className="lesson">
        <h2>Compare against a null of &ldquo;no structure&rdquo;</h2>
        <p>
          Inertia (here written <M>{String.raw`W_k`}</M>) keeps dropping with <em>k</em> on{" "}
          <em>any</em> data — even uniform random noise with no clusters at all. The gap statistic&rsquo;s
          insight: generate a reference dataset that genuinely has no clusters (uniform points over the
          same bounding box), cluster <em>that</em> too, and see how its inertia curve falls. Whatever
          drop is just &ldquo;free&rdquo; from adding centroids will show up in both.
        </p>
        <MathBlock>{String.raw`\mathrm{Gap}(k) = \mathbb{E}^{*}\!\left[\log W_k^{*}\right] - \log W_k`}</MathBlock>
        <p>
          The gap is how far your real <M>{String.raw`\log W_k`}</M> sits <em>below</em> the average{" "}
          <M>{String.raw`\log W_k^{*}`}</M> of the random references (averaged over many random draws).
          A big gap means your data clusters far better than chance at that <em>k</em>.
        </p>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 14, margin: "1.2rem 0" }}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
            <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
            <polyline points={KS.map((k, i) => `${gx(k)},${gy(REF[i])}`).join(" ")} fill="none" stroke="var(--faint)" strokeWidth={2} strokeDasharray="4 3" />
            <polyline points={KS.map((k, i) => `${gx(k)},${gy(OBS[i])}`).join(" ")} fill="none" stroke="var(--c-clustering)" strokeWidth={2.4} />
            {KS.map((k, i) => (
              <line key={k} x1={gx(k)} y1={gy(OBS[i])} x2={gx(k)} y2={gy(REF[i])} stroke={k === bestGapK ? "var(--good)" : "var(--border-strong)"} strokeWidth={k === bestGapK ? 2 : 1} />
            ))}
            {KS.map((k, i) => <circle key={"o" + k} cx={gx(k)} cy={gy(OBS[i])} r={3} fill="var(--c-clustering)" />)}
            <text x={gx(bestGapK)} y={gy((OBS[bestGapK - 1] + REF[bestGapK - 1]) / 2)} fontSize={10} fill="var(--good)" dx={6}>max gap</text>
            <text x={W - 14} y={gy(REF[KS.length - 1]) - 5} fontSize={9} fill="var(--faint)" textAnchor="end">random null</text>
            <text x={W - 14} y={gy(OBS[KS.length - 1]) + 12} fontSize={9} fill="var(--c-clustering)" textAnchor="end">real data</text>
            <text x={W / 2} y={H - 5} fontSize={10} fill="var(--faint)" textAnchor="middle">k →</text>
            <text x={11} y={H / 2} fontSize={10} fill="var(--faint)" textAnchor="middle" transform={`rotate(-90 11 ${H / 2})`}>log Wₖ</text>
          </svg>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
            Both curves fall, but the real data (solid) pulls away fastest and the vertical gap is
            widest at k = {bestGapK}. Past that, the real curve flattens to match the null — extra
            clusters buy nothing real.
          </div>
        </div>

        <h2>The selection rule</h2>
        <p>
          You don&rsquo;t just take the maximum gap — the references are random, so each <M>{String.raw`\mathrm{Gap}(k)`}</M>{" "}
          has a standard error <M>{String.raw`s_k`}</M>. Tibshirani&rsquo;s rule picks the <strong>smallest</strong>{" "}
          <em>k</em> that is already good enough:
        </p>
        <MathBlock>{String.raw`\hat{k} = \text{smallest } k \text{ such that } \mathrm{Gap}(k) \ge \mathrm{Gap}(k+1) - s_{k+1}`}</MathBlock>
        <p>
          In words: stop as soon as the next <em>k</em> doesn&rsquo;t convincingly beat the current one,
          accounting for noise. This parsimony bias is what gives the gap statistic its best feature.
        </p>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-clustering)", marginBottom: 4 }}>
            It can answer k = 1
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            Uniquely among these methods, the gap statistic can conclude there are <strong>no</strong>{" "}
            clusters — if your data&rsquo;s curve never pulls meaningfully ahead of the random null, the rule
            returns <em>k</em> = 1. The elbow and silhouette can&rsquo;t even express that; silhouette isn&rsquo;t
            defined at <em>k</em> = 1. The price is compute: you refit k-means on many random reference
            datasets for every <em>k</em>.
          </p>
        </div>

        <h2>Compute the gap</h2>
        <CodeBlock fromScratch={codeScratch} withLibrary={codeLib} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/k-means/silhouette-analysis" style={navLink}>← Silhouette analysis</Link>
          <Link href="/learn/k-means/information-criteria-x-means" style={{ ...navLink, fontWeight: 600 }}>Next up · Information criteria (X-means) →</Link>
        </div>
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np

def W(X, lab, C):                      # within-cluster sum of squares
    return sum(((X[lab == j] - C[j])**2).sum() for j in range(len(C)))

def gap_statistic(X, k, B=20, seed=0):
    rng = np.random.default_rng(seed)
    lab, C = fit_kmeans(X, k)          # your k-means -> labels, centroids
    logWk = np.log(W(X, lab, C))
    lo, hi = X.min(0), X.max(0)
    refs = []
    for _ in range(B):                 # B uniform reference datasets
        Xr = rng.uniform(lo, hi, size=X.shape)
        lr, Cr = fit_kmeans(Xr, k)
        refs.append(np.log(W(Xr, lr, Cr)))
    refs = np.array(refs)
    gap = refs.mean() - logWk
    s_k = refs.std() * np.sqrt(1 + 1 / B)   # standard error
    return gap, s_k`;

const codeLib = `# scikit-learn has no built-in gap statistic; the 'gap-statistic' package wraps it,
# or implement the loop above around sklearn.cluster.KMeans.
from sklearn.cluster import KMeans
import numpy as np

def fit_kmeans(X, k):
    km = KMeans(n_clusters=k, n_init=10, random_state=0).fit(X)
    return km.labels_, km.cluster_centers_

# then apply Tibshirani's rule: smallest k with Gap(k) >= Gap(k+1) - s_{k+1}`;

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-clustering) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-clustering) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0" };
