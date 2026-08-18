import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { KNN_SETUP } from "@/lib/runtimeSetup";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "The curse of dimensionality — Manifold",
  description:
    "In high dimensions, 'nearest' stops meaning anything: all points sit at nearly the same distance and a 'local' neighbourhood spans almost the whole space. Why k-NN degrades as features pile up, and what to do about it.",
};

// To capture a fixed fraction r of the data volume in d dimensions, a cubic
// neighbourhood must span r^(1/d) of each axis. Computed at module scope and
// rounded, so SSR and client emit identical strings.
const FRACTION = 0.1;
const DIMS = [1, 2, 3, 5, 10, 20, 50, 100];
const edge = (d: number) => Math.pow(FRACTION, 1 / d);
const W = 420, H = 232, padL = 34, padR = 14, padT = 16, padB = 42;
const r2 = (v: number) => Math.round(v * 100) / 100;
const plotW = W - padL - padR, plotH = H - padT - padB;
const bw = plotW / DIMS.length;
const barX = (i: number) => r2(padL + i * bw + bw * 0.18);
const barTop = (v: number) => r2(padT + (1 - v) * plotH);
const innerW = r2(bw * 0.64);

export default function CurseOfDimensionalityPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: "var(--c-classification)" }, { label: "Tier 2 · distance & weighting", color: "var(--c-classification)" }]}
        time="about 8 minutes"
        title={<>The curse of dimensionality</>}
        intro={<>
          k-NN&rsquo;s whole premise is that &ldquo;nearby&rdquo; points share labels. In high dimensions that
        premise quietly collapses: everything is roughly equidistant, and a &ldquo;local&rdquo; neighbourhood is
        anything but local. This is the deepest limit on the method.
        </>}
      />

      <div className="lesson">
        <h2>Distances concentrate</h2>
        <p>
          Add features and something unintuitive happens: the distances from a query to <em>all</em> training
          points bunch together. The nearest and the farthest neighbour end up almost the same distance away.
          Formally, the contrast between them vanishes:
        </p>
        <MathBlock>{String.raw`\frac{d_{\max} - d_{\min}}{d_{\min}} \;\longrightarrow\; 0 \quad \text{as } d \to \infty`}</MathBlock>
        <p>
          When the closest point is barely closer than the average point, &ldquo;nearest&rdquo; carries almost no
          information — and k-NN, which trusts nearest-ness completely, has nothing left to stand on.
        </p>

        <h2>&ldquo;Local&rdquo; neighbourhoods aren&rsquo;t local</h2>
        <p>
          Here&rsquo;s the same fact from the volume side. Suppose your data fills a unit cube and you want a
          neighbourhood containing just <strong>10%</strong> of it. In <M>{String.raw`d`}</M> dimensions, a cubic
          neighbourhood has to span <M>{String.raw`0.1^{1/d}`}</M> of the range of <em>each</em> feature:
        </p>

        <figure style={{ margin: "1.4rem 0", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 16 }}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }} role="img" aria-label="Edge length needed to capture 10% of the volume, rising toward 1 as dimensionality grows.">
            <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
            {/* full-range reference line */}
            <line x1={padL} y1={barTop(1)} x2={W - padR} y2={barTop(1)} stroke="var(--faint)" strokeWidth={1} strokeDasharray="2 4" />
            <text x={W - padR} y={barTop(1) - 4} fontSize={8.5} fill="var(--faint)" textAnchor="end">100% of each axis</text>
            {DIMS.map((d, i) => {
              const v = edge(d);
              return (
                <g key={d}>
                  <rect x={barX(i)} y={barTop(v)} width={innerW} height={r2(H - padB - barTop(v))} rx={2} fill="var(--c-classification)" fillOpacity={0.85} />
                  <text x={r2(barX(i) + innerW / 2)} y={barTop(v) - 4} fontSize={8.5} fill="var(--muted)" textAnchor="middle">{Math.round(v * 100)}%</text>
                  <text x={r2(barX(i) + innerW / 2)} y={H - padB + 13} fontSize={9} fill="var(--faint)" textAnchor="middle">{d}</text>
                </g>
              );
            })}
            <text x={W / 2} y={H - 6} fontSize={9} fill="var(--faint)" textAnchor="middle">dimensions d</text>
          </svg>
          <figcaption style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 8, lineHeight: 1.55 }}>
            Edge length each feature must span to enclose 10% of the data. In 1-D it&rsquo;s 10%; by 10-D it&rsquo;s
            ~79%; by 100-D you must cover <strong>~98%</strong> of every axis just to scrape together 10% of the
            points. A &ldquo;10% neighbourhood&rdquo; is almost the entire space — not local at all.
          </figcaption>
        </figure>

        <h2>Why this specifically breaks k-NN</h2>
        <ul style={ul}>
          <li><strong>The core assumption fails.</strong> k-NN assumes near points are similar. If a neighbourhood spans nearly the whole range of every feature, its members aren&rsquo;t meaningfully similar to the query.</li>
          <li><strong>Data requirements explode.</strong> To keep neighbourhoods genuinely small (say 10% edge per axis), the sample size you need grows <em>exponentially</em> in the number of features. No realistic dataset keeps up.</li>
          <li><strong>Irrelevant features are pure poison.</strong> Every noise feature adds its own spread to the distance, diluting the signal from the features that matter. Parametric models can learn to down-weight a useless feature; vanilla k-NN cannot — it takes the distance at face value.</li>
        </ul>

        <Callout color="var(--c-classification)" title={<>Intrinsic dimension is what actually matters</>}>
          The saving grace: real data rarely fills its ambient space. Images, text, and sensor data usually lie
            near a low-dimensional <strong>manifold</strong>, so the <em>intrinsic</em> dimension is far below the
            feature count. k-NN works far better than the raw <M>{String.raw`d`}</M> would predict whenever that&rsquo;s
            true — which is exactly why reducing dimensions first so often rescues it.
        </Callout>

        <h2>What to do about it</h2>
        <ul style={ul}>
          <li><strong>Reduce dimensions first.</strong> PCA or a learned embedding before k-NN collapses noise directions and restores meaningful distances — the single highest-leverage fix.</li>
          <li><strong>Select or weight features.</strong> Drop or down-weight uninformative features so they stop padding the distance (the track&rsquo;s feature-weighting page goes deeper).</li>
          <li><strong>Prefer Manhattan (or fractional) metrics.</strong> Lower-<M>{String.raw`p`}</M> distances concentrate a little less than Euclidean in high dimensions.</li>
          <li><strong>Learn a metric.</strong> Methods like large-margin nearest neighbour (LMNN) learn a Mahalanobis metric that stretches useful directions and shrinks the rest.</li>
        </ul>

        <CodeBlock setup={KNN_SETUP} fromScratch={codeScratch} withLibrary={codeLib} />

        <Quiz
          accent="var(--c-classification)"
          questions={[
            {
              q: "In very high dimensions, the distance from a query to its nearest vs. farthest neighbour…",
              options: ["Becomes almost the same — the contrast vanishes", "Grows further apart, making nearest clearer", "Is unaffected by dimensionality"],
              answer: 0,
              explain: "Distances concentrate: (d_max − d_min)/d_min → 0. When nearest is barely closer than farthest, 'nearest' stops being informative — and k-NN relies on it entirely.",
            },
            {
              q: "To enclose 10% of the data in a cubic neighbourhood in 10 dimensions, each feature's edge must span about…",
              options: ["79% of its range — almost the whole axis", "10% of its range, same as 1-D", "1% of its range"],
              answer: 0,
              explain: "0.1^(1/10) ≈ 0.79. A '10% neighbourhood' in 10-D already covers ~79% of every axis, so it isn't local. In 100-D it's ~98%.",
            },
            {
              q: "Which fix most directly addresses the curse for k-NN?",
              options: ["Reduce dimensionality (e.g. PCA) or select/weight features before applying k-NN", "Increase k", "Switch to min–max scaling"],
              answer: 0,
              explain: "Cutting noise directions restores meaningful distances. Raising k or rescaling doesn't fix the underlying loss of contrast in high dimensions.",
            },
          ]}
        />

        <Callout color="var(--c-classification)" title={<>Where this chapter leaves you</>}>
          Distance is now fully unpacked — metrics, scaling, weighting, and the high-dimensional wall. The
            next chapter turns to <em>making k-NN work on messy, real data</em>: encoding categoricals,
            imputing gaps, breaking ties, handling class imbalance, and choosing and learning the metric.
            Browse the whole path on the{" "}
            <Link href="/map" style={{ color: "var(--brand)", textDecoration: "none" }}>curriculum map</Link>.
        </Callout>

        <PrevNext prev={{ href: "/learn/k-nearest-neighbors/distance-weighted-voting", label: <>← Distance-weighted voting</> }} next={{ href: "/learn/k-nearest-neighbors/preprocessing-and-encoding", label: <>Next up · Preprocessing &amp; encoding →</> }} />
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np

# distance concentration: nearest vs farthest get closer as d grows
rng = np.random.default_rng(0)
for d in [2, 10, 100, 1000]:
    X = rng.random((500, d))
    q = rng.random(d)
    dist = np.sqrt(((X - q)**2).sum(axis=1))
    contrast = (dist.max() - dist.min()) / dist.min()
    print(f"d={d:>4}:  (dmax-dmin)/dmin = {contrast:.3f}")   # shrinks toward 0`;

const codeLib = `from sklearn.decomposition import PCA
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.neighbors import KNeighborsClassifier

# reduce dimensions BEFORE k-NN to restore meaningful distances
knn_raw = make_pipeline(StandardScaler(), KNeighborsClassifier(n_neighbors=7))
knn_pca = make_pipeline(StandardScaler(), PCA(n_components=2),
                        KNeighborsClassifier(n_neighbors=7))

print("raw :", round(knn_raw.fit(X_train, y_train).score(X_test, y_test), 3))
print("pca :", round(knn_pca.fit(X_train, y_train).score(X_test, y_test), 3))`;

const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
