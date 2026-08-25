import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Whitening & decorrelation — Manifold",
  description:
    "PCA rotates data onto uncorrelated axes; whitening goes one step further and rescales them to equal variance, turning any ellipsoid cloud into a perfect sphere. It's a common preprocessing step — with one sharp caveat.",
};

const DIM = "var(--c-dimred)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

function WhitenFig() {
  const panel = (cx: number, rx: number, ry: number, rot: number, title: string) => (
    <g>
      <text x={cx} y={26} textAnchor="middle" fontSize={11.5} fill="var(--ink)" fontWeight={600}>{title}</text>
      <line x1={cx - 70} y1={120} x2={cx + 70} y2={120} stroke="var(--border)" strokeWidth={1} />
      <line x1={cx} y1={50} x2={cx} y2={190} stroke="var(--border)" strokeWidth={1} />
      <ellipse cx={cx} cy={120} rx={rx} ry={ry} transform={`rotate(${rot} ${cx} 120)`} fill={`color-mix(in srgb, ${DIM} 14%, transparent)`} stroke={DIM} strokeWidth={1.6} />
    </g>
  );
  return (
    <figure style={{ margin: "1.6rem 0" }}>
      <div style={{ background: "var(--canvas)", border: "1px solid var(--border-strong)", borderRadius: 14, padding: 14 }}>
        <svg viewBox="0 0 540 210" style={{ width: "100%", height: "auto", display: "block" }} role="img" aria-label="Raw tilted ellipse, then rotated (PCA), then sphered (whitened)">
          {panel(90, 64, 26, -28, "raw · correlated")}
          {panel(270, 64, 26, 0, "PCA · uncorrelated")}
          {panel(450, 40, 40, 0, "whitened · spherical")}
          <text x={180} y={120} textAnchor="middle" fontSize={16} fill="var(--faint)">→</text>
          <text x={360} y={120} textAnchor="middle" fontSize={16} fill="var(--faint)">→</text>
        </svg>
      </div>
      <figcaption style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 8 }}>
        PCA <em>rotates</em> the tilted ellipse onto its axes (removing correlation). Whitening then <em>rescales</em>
        each axis to variance 1, turning the ellipse into a sphere — every direction now equally spread.
      </figcaption>
    </figure>
  );
}

export default function WhiteningPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Dimensionality reduction", color: DIM }, { label: "Tier 3 · theory", color: "var(--c-metrics)" }]}
        time="about 6 minutes"
        title={<>Whitening &amp; decorrelation</>}
        intro={<>PCA already gives you uncorrelated features for free — the scores have zero covariance between them.
          Whitening finishes the job by equalising their variances, so the transformed data has the identity as its
          covariance matrix: a perfectly round cloud. Useful, and occasionally a trap.</>}
      />

      <div className="lesson">
        <h2>From rotated to spherical</h2>
        <p>
          Projecting onto the principal components rotates your data so its axes are the directions of spread — the
          scores are <strong>decorrelated</strong>, but each still has its own variance <M>{String.raw`\lambda_j`}</M>.
          <strong> Whitening</strong> divides each score by <M>{String.raw`\sqrt{\lambda_j}`}</M> so every direction
          ends up with variance exactly 1:
        </p>
        <MathBlock>{String.raw`x_{\text{white}} = \Lambda^{-1/2} V^\top (x - \bar x), \qquad \operatorname{Cov}(x_{\text{white}}) = I.`}</MathBlock>

        <WhitenFig />

        <p>
          Geometrically: PCA turns the tilted ellipse upright; whitening inflates the short axes and deflates the long
          ones until the ellipse becomes a sphere. Any elliptical Gaussian cloud becomes a standard spherical one.
        </p>

        <h2>Why bother</h2>
        <ul style={{ margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 }}>
          <li><strong>Distance-based methods.</strong> With a spherical cloud, Euclidean distance treats every direction equally — helpful before k-means or nearest neighbours, which otherwise let the high-variance axis dominate the metric.</li>
          <li><strong>Faster optimisation.</strong> A spherical loss landscape has circular contours, so gradient descent descends straight to the minimum instead of zig-zagging down a valley — the same reason we <Link href="/learn/linear-regression/the-loss-surface" style={link}>scale features before training</Link>.</li>
          <li><strong>A stepping stone to ICA.</strong> Whitening is the standard first stage of independent component analysis, which then rotates the sphere to find statistically independent (not just uncorrelated) directions.</li>
        </ul>

        <Callout color={DIM} title={<>The caveat: whitening amplifies noise</>}>
          Dividing by <M>{String.raw`\sqrt{\lambda_j}`}</M> is fine for big components but <em>explodes</em> the tiny
          trailing ones — the very directions that are mostly noise. Whiten all the way down and you can hand a
          downstream model a faceful of amplified noise. The standard defence is to whiten only the top <M>k</M>
          components you were keeping anyway (scikit-learn&rsquo;s <code>PCA(whiten=True)</code> does this after
          truncation). Whitening and dimensionality reduction belong together.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/pca/computing-the-components", label: <>← Computing the components: power iteration</> }}
          next={{ href: "/learn/pca/interpreting-loadings", label: <>Next up · Reading components: loadings &amp; biplots →</> }}
        />
      </div>
    </article>
  );
}
