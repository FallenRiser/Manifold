import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { LabFrame } from "@/components/LabFrame";
import { CovarianceEllipseLab } from "@/components/labs/CovarianceEllipseLab";

export const metadata = {
  title: "Centering & the covariance matrix — Manifold",
  description:
    "Before PCA can find directions of spread it centers the data and summarises all its spread and tilt in one object: the covariance matrix. That matrix is literally an ellipse, and PCA reads off its axes.",
};

const DIM = "var(--c-dimred)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function CenteringCovariancePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Dimensionality reduction", color: DIM }, { label: "Tier 2 · practitioner", color: "var(--c-fundamentals)" }]}
        time="about 7 minutes"
        title={<>Centering &amp; the covariance matrix</>}
        intro={<>PCA has one input it truly cares about: the covariance matrix. It captures how much each feature
          varies and how the features move together — all the spread and tilt of the cloud in a single object. But
          first the data has to be centered, or PCA measures the wrong thing entirely.</>}
      />

      <div className="lesson">
        <h2>Step zero: center the data</h2>
        <p>
          Every principal component passes through the <em>mean</em> of the data. If you skip centering, PCA measures
          variation around the origin instead of around the cloud, and the first component wastes itself pointing
          from the origin out to wherever the data happens to sit. So the very first step is always
        </p>
        <MathBlock>{String.raw`\tilde x_i = x_i - \bar x, \qquad \bar x = \frac{1}{n}\sum_i x_i.`}</MathBlock>
        <p>
          After this, each feature has mean zero and the cloud is parked on the origin. (Whether you also rescale
          each feature to unit variance is a separate, important choice — the subject of{" "}
          <Link href="/learn/pca/standardize-first" style={link}>standardizing</Link>. Centering is non-negotiable;
          scaling is a decision.)
        </p>

        <h2>The covariance matrix</h2>
        <p>
          With the data centered, the covariance matrix is one small multiplication:
        </p>
        <MathBlock>{String.raw`\Sigma = \frac{1}{n-1}\,\tilde X^\top \tilde X \quad\in\; \mathbb{R}^{d\times d}.`}</MathBlock>
        <p>
          Its diagonal entry <M>{String.raw`\Sigma_{jj}`}</M> is the variance of feature <M>j</M>; the off-diagonal{" "}
          <M>{String.raw`\Sigma_{jk}`}</M> is the covariance between features <M>j</M> and <M>k</M> — positive if they
          rise together, negative if one rises as the other falls, zero if they&rsquo;re unrelated. For <M>d</M>{" "}
          features it&rsquo;s a <M>{String.raw`d\times d`}</M> symmetric matrix, and it holds everything PCA needs:
          the projection variance in any direction <M>v</M> is just <M>{String.raw`v^\top\Sigma v`}</M>.
        </p>

        <h2>A covariance matrix is an ellipse</h2>
        <p>
          Here is the picture worth a thousand equations. A 2×2 covariance matrix draws an ellipse — the contour of
          the cloud. The two feature variances stretch it along the axes; the correlation shears it into a tilt. And
          its two <em>axes</em> are exactly the principal components, with the axis lengths set by how much variance
          lives along each. Drag the knobs and watch:
        </p>

        <LabFrame
          accent={DIM}
          tryThis={<>Push the correlation <M>{String.raw`\rho`}</M> toward <M>{String.raw`\pm 1`}</M> and watch the
            ellipse flatten toward a line. What happens to <M>{String.raw`\lambda_2`}</M>, the variance along the
            short axis — and to PC1&rsquo;s share?</>}
          insight={<>As <M>{String.raw`\rho\to\pm1`}</M> the features become redundant: the ellipse collapses,{" "}
            <M>{String.raw`\lambda_2\to 0`}</M>, and PC1 captures nearly 100%. That near-empty second axis is the
            redundant direction PCA discards — reduction is <em>possible</em> exactly when features are correlated.</>}
        >
          <CovarianceEllipseLab />
        </LabFrame>

        <Callout color={DIM} title={<>The line to remember</>}>
          The covariance matrix <em>is</em> the shape of your data. PCA doesn&rsquo;t need the raw points once it has{" "}
          <M>{String.raw`\Sigma`}</M> — it reads the directions of spread straight off the ellipse&rsquo;s axes. The
          next page names those axes: they are the <Link href="/learn/pca/eigenvectors" style={link}>eigenvectors</Link>{" "}
          of <M>{String.raw`\Sigma`}</M>.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/pca/maximize-variance", label: <>← The direction of most spread</> }}
          next={{ href: "/learn/pca/eigenvectors", label: <>Next up · Eigenvectors: the axes of the cloud →</> }}
        />
      </div>
    </article>
  );
}
