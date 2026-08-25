import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "The Gaussian, up close — Manifold",
  description:
    "The normal distribution is the default model for noise and measurements — not by accident, but because the central limit theorem funnels sums toward it. Its shape, its rules, and its multivariate form all show up across ML.",
};

const AMBER = "var(--c-fundamentals)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function GaussianPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Probability", color: AMBER }, { label: "Tier 0 · foundations", color: "var(--c-fundamentals)" }]}
        time="about 6 minutes"
        title={<>The Gaussian, up close</>}
        intro={<>No distribution earns more attention than the Gaussian — the bell curve. It&rsquo;s the default model
          for measurement noise, the shape sums drift toward, and the assumption baked into least squares and
          countless methods. Worth knowing intimately.</>}
      />

      <div className="lesson">
        <h2>The formula and its two knobs</h2>
        <MathBlock>{String.raw`f(x) = \frac{1}{\sigma\sqrt{2\pi}}\,\exp\!\left(-\frac{(x-\mu)^2}{2\sigma^2}\right).`}</MathBlock>
        <p>
          Only two parameters: the <strong>mean</strong> <M>{String.raw`\mu`}</M> slides the bell left and right, and
          the <strong>standard deviation</strong> <M>{String.raw`\sigma`}</M> sets its width. The exponent is a
          negative squared distance from the mean — which is exactly why <em>assuming Gaussian noise leads to squared-error
          loss</em>: maximizing Gaussian likelihood is minimizing sum of squares. That single fact links this page to
          all of <Link href="/learn/linear-regression/why-squared-error" style={link}>least-squares regression</Link>.
        </p>

        <h2>The 68–95–99.7 rule</h2>
        <p>
          Gaussians have a famously reliable spread: about <strong>68%</strong> of the mass lies within one{" "}
          <M>{String.raw`\sigma`}</M> of the mean, <strong>95%</strong> within two, and <strong>99.7%</strong> within
          three. This is where &ldquo;two-sigma&rdquo; confidence intervals and &ldquo;six-sigma&rdquo; quality come
          from, and it&rsquo;s why a value four or five <M>{String.raw`\sigma`}</M> out is treated as a genuine
          anomaly.
        </p>

        <h2>Why it&rsquo;s the default</h2>
        <p>
          The Gaussian isn&rsquo;t privileged by fiat — it&rsquo;s privileged by the{" "}
          <Link href="/learn/math-foundations/lln-and-clt" style={link}>central limit theorem</Link>: sums and averages
          of many small independent effects converge to it, whatever those effects&rsquo; own shapes. Measurement noise
          is usually a pile-up of many tiny disturbances, so it lands Gaussian. It&rsquo;s also the{" "}
          <em>maximum-entropy</em> distribution for a fixed mean and variance — the least-assuming choice once you know
          only those two numbers, which the <Link href="/learn/math-foundations/entropy" style={link}>information-theory
          strand</Link> makes precise.
        </p>

        <h2>The multivariate Gaussian</h2>
        <p>
          In many dimensions the bell becomes an ellipsoidal cloud, described by a mean vector{" "}
          <M>{String.raw`\boldsymbol\mu`}</M> and a <Link href="/learn/pca/centering-and-covariance" style={link}>covariance
          matrix</Link> <M>{String.raw`\Sigma`}</M>:
        </p>
        <MathBlock>{String.raw`f(\mathbf x) \propto \exp\!\left(-\tfrac{1}{2}(\mathbf x - \boldsymbol\mu)^\top \Sigma^{-1}(\mathbf x - \boldsymbol\mu)\right).`}</MathBlock>
        <p>
          The covariance matrix is exactly the <Link href="/learn/pca/centering-and-covariance" style={link}>ellipse
          PCA analyses</Link>; its eigenvectors are the cloud&rsquo;s axes. Gaussian mixtures, Gaussian processes,
          linear discriminant analysis, and Kalman filters are all built on this object.
        </p>

        <Callout color={AMBER} title={<>A caution worth keeping</>}>
          The Gaussian is so convenient that it&rsquo;s over-assumed. Real data is often skewed or heavy-tailed —
          financial returns, wealth, waiting times — where extreme events are far more likely than a bell predicts.
          Modelling such data as Gaussian systematically underestimates risk. Reach for it as a default, but check
          the tails.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/math-foundations/independence", label: <>← Independence, covariance &amp; correlation</> }}
          next={{ href: "/learn/math-foundations/mgf", label: <>Next up · Moment-generating functions →</> }}
        />
      </div>
    </article>
  );
}
