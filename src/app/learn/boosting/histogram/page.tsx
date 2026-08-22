import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";
import { CodeOutput } from "@/components/CodeOutput";

export const metadata = {
  title: "Histogram boosting: LightGBM & speed — Manifold",
  description:
    "The idea that made gradient boosting fast enough for millions of rows: bin each feature into ~255 integers once, and find splits by scanning histograms instead of sorted values. Plus LightGBM's leaf-wise growth, GOSS, and feature bundling.",
};

const TREES = "var(--c-trees)";

export default function HistogramPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Trees & ensembles", color: TREES }, { label: "Tier 2 · practitioner", color: "var(--c-fundamentals)" }]}
        time="about 8 minutes"
        title={<>Histogram boosting: LightGBM &amp; speed</>}
        intro={<>
          The dominant cost of growing a tree is finding the best split, which naively means sorting every feature
          at every node. Histogram-based boosting replaces that sort with a <strong>bin-and-count</strong> pass —
          the engineering trick behind LightGBM, and behind scikit-learn&rsquo;s fast{" "}
          <code>HistGradientBoosting</code>.
        </>}
      />

      <div className="lesson">
        <h2>Bin once, scan forever</h2>
        <p>
          Before training, each feature&rsquo;s continuous values are <strong>bucketed into a small number of
          bins</strong> — 255 by default, so a bin index fits in a single byte. A feature is now an integer in{" "}
          <M>{String.raw`[0, 255]`}</M>, computed once. To evaluate splits at a node, the algorithm builds a{" "}
          <strong>histogram</strong>: for each bin, sum the gradients and Hessians of the examples that fall in it.
          The best split is then found by a single left-to-right sweep over the (at most) 255 bin boundaries.
        </p>

        <figure style={{ margin: "1.6rem 0" }}>
          <div style={{ background: "var(--canvas)", border: "1px solid var(--border-strong)", borderRadius: 14, padding: "16px 12px 12px" }}>
            <HistogramFig />
            <div style={{ textAlign: "center", fontSize: 12, color: "var(--muted)", marginTop: 8, maxWidth: 520, marginInline: "auto" }}>
              Raw continuous values (top) are bucketed once into bins (here 8; 255 in practice). Splits are then
              searched over the handful of <strong style={{ color: "var(--c-trees)" }}>bin edges</strong>, not over
              every distinct value — the sort disappears.
            </div>
          </div>
        </figure>

        <ul style={ul}>
          <li>
            <strong>Exact splitting</strong> costs <M>{String.raw`O(n \log n)`}</M> per feature per node (the
            sort). <strong>Histogram splitting</strong> costs <M>{String.raw`O(n)`}</M> to fill the bins plus{" "}
            <M>{String.raw`O(\text{bins})`}</M> to scan — dramatically cheaper, and independent of how many
            distinct values the feature has.
          </li>
          <li>
            <strong>The histogram-subtraction trick:</strong> a node&rsquo;s two children&rsquo;s histograms sum
            to the parent&rsquo;s, so you compute the histogram for the smaller child and get the larger one by{" "}
            <em>subtraction</em> — nearly halving the work at every split.
          </li>
          <li>
            <strong>Memory</strong> drops too: one byte per value instead of a float, so far larger datasets fit
            in RAM.
          </li>
        </ul>
        <p>
          The only cost is a little precision — binning throws away the exact split location within a bin — but
          with 255 bins the accuracy loss is negligible, and the coarser boundaries even add a touch of
          regularisation. This is why <em>every</em> modern booster (XGBoost&rsquo;s <code>hist</code> mode,
          LightGBM, CatBoost, sklearn&rsquo;s HistGB) is histogram-based by default.
        </p>

        <h2>LightGBM&rsquo;s three accelerators</h2>
        <ul style={ul}>
          <li>
            <strong>Leaf-wise growth.</strong> Rather than growing level by level, LightGBM always splits the{" "}
            <em>one leaf</em> promising the largest gain. This reaches a lower loss with fewer leaves — but grows
            deep, lopsided trees, so it must be reined in with <code>num_leaves</code> and{" "}
            <code>min_child_samples</code> (see <Link href="/learn/boosting/tree-knobs" style={link}>tree
            knobs</Link>).
          </li>
          <li>
            <strong>GOSS (Gradient-based One-Side Sampling).</strong> Examples with small gradients are already
            well-fit and carry little information for the next split. GOSS keeps all the large-gradient examples
            and randomly subsamples the small-gradient ones (re-weighting to stay unbiased) — a smarter,
            boosting-aware version of <Link href="/learn/boosting/stochastic" style={link}>row subsampling</Link>.
          </li>
          <li>
            <strong>EFB (Exclusive Feature Bundling).</strong> In sparse, one-hot-heavy data many features are
            never non-zero together; EFB bundles such mutually-exclusive features into one, shrinking the
            effective feature count with no loss of information.
          </li>
        </ul>

        <Callout color={TREES} title={<>Speed, measured</>}>
          <CodeOutput label="covtype 25k — accuracy and fit time, 700 rounds">{`  RandomForest(300)      acc 0.842    1.5 s
  XGBoost(700)           acc 0.854   15.7 s
  LightGBM(700)          acc 0.865    9.7 s`}</CodeOutput>
          On this task LightGBM is both the most accurate <em>and</em> ~1.6× faster than XGBoost, thanks to
          leaf-wise growth and GOSS. Both boosters beat the forest&rsquo;s accuracy — but note the forest fits an
          order of magnitude faster, a trade the <Link href="/learn/boosting/when-to-use" style={link}>finale</Link>{" "}
          returns to. (Speeds are single-run and machine-dependent; the ordering is the point.)
        </Callout>

        <h2>Which library, in one line</h2>
        <p>
          <strong>LightGBM</strong> — fastest on wide/large data, leaf-wise, excellent defaults.{" "}
          <strong>XGBoost</strong> — the robust standard, depthwise, superb regularisation and tooling.{" "}
          <strong>sklearn <code>HistGradientBoosting</code></strong> — no extra dependency, very fast, fewer
          knobs, great for a strong baseline. <strong>CatBoost</strong> — the categorical specialist, and the
          subject of the next page.
        </p>

        <PrevNext
          prev={{ href: "/learn/boosting/newton-boosting", label: <>← Newton boosting: XGBoost&rsquo;s second-order step</> }}
          next={{ href: "/learn/boosting/catboost", label: <>Next up · Categorical features: CatBoost &amp; ordered boosting →</> }}
        />
      </div>
    </article>
  );
}

// Static binning figure: continuous values -> 8 bins -> counts. Deterministic.
const HB_BINS = 8;
const HB_VALS = (() => {
  let seed = 13;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  // a mildly clustered distribution in [0,1]
  return Array.from({ length: 46 }, () => Math.min(0.999, Math.max(0, 0.5 + (rnd() - 0.5) + (rnd() - 0.5) * 0.5) / 1.5 + 0.15));
})();
const HB_COUNTS = (() => {
  const c = new Array(HB_BINS).fill(0);
  for (const v of HB_VALS) c[Math.min(HB_BINS - 1, Math.floor(v * HB_BINS))]++;
  return c;
})();
const HBW = 300, HBH = 150, HBP = 14;
const hrr = (v: number) => Math.round(v * 100) / 100;
const hbx = (v: number) => hrr(HBP + v * (HBW - 2 * HBP));
function HistogramFig() {
  const maxC = Math.max(...HB_COUNTS);
  const barTop = 74, barBot = HBH - 22;
  return (
    <svg viewBox={`0 0 ${HBW} ${HBH}`} width="100%" style={{ maxWidth: HBW, display: "block", margin: "0 auto" }} role="img" aria-label="continuous values bucketed into bins">
      <text x={HBP} y={16} fontSize={9.5} fill="var(--faint)">raw values</text>
      {/* raw points on a line */}
      <line x1={hbx(0)} y1={30} x2={hbx(1)} y2={30} stroke="var(--border-strong)" strokeWidth={1} />
      {HB_VALS.map((v, i) => (
        <circle key={i} cx={hbx(v)} cy={30} r={2.2} fill="var(--c-regression)" opacity={0.8} />
      ))}
      {/* bin edges */}
      {Array.from({ length: HB_BINS + 1 }, (_, i) => (
        <line key={i} x1={hbx(i / HB_BINS)} y1={38} x2={hbx(i / HB_BINS)} y2={barBot} stroke="var(--c-trees)" strokeWidth={i === 0 || i === HB_BINS ? 1 : 0.8} strokeDasharray="2 2.5" opacity={0.7} />
      ))}
      <text x={HBP} y={62} fontSize={9.5} fill="var(--faint)">binned counts</text>
      {/* bars */}
      {HB_COUNTS.map((c, i) => {
        const x0 = hbx(i / HB_BINS), x1 = hbx((i + 1) / HB_BINS);
        const h = (c / maxC) * (barBot - barTop);
        return <rect key={i} x={x0 + 2} y={hrr(barBot - h)} width={hrr(x1 - x0 - 4)} height={hrr(h)} rx={2} fill={`color-mix(in srgb, var(--c-trees) 32%, var(--surface))`} stroke="var(--c-trees)" strokeWidth={1} />;
      })}
      <line x1={hbx(0)} y1={barBot} x2={hbx(1)} y2={barBot} stroke="var(--border-strong)" strokeWidth={1} />
    </svg>
  );
}

const ul: React.CSSProperties = { margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.85 };
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
