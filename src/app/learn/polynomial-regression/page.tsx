import Link from "next/link";
import { PolynomialLab } from "@/components/labs/PolynomialLab";
import { ModelAnatomy } from "@/components/ModelAnatomy";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { POLY_DONE, POLY_TOTAL } from "@/lib/polynomialRegressionTrack";

export const metadata = {
  title: "Polynomial & basis-function regression — Manifold",
  description:
    "Straight lines can't bend, but the world is curved. Polynomial and basis-function regression add flexibility to least squares without leaving it — the fit stays linear in the parameters, so the same OLS machinery still solves it.",
};

export default function PolyHubPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }, { label: `In progress · ${POLY_DONE} of ${POLY_TOTAL} pages`, color: "var(--c-fundamentals)" }]}
        time="about 6 minutes"
        title={<>Why straight lines fail</>}
        intro={<>
          Linear regression draws the best straight line. But growth curves bend, dose–response saturates, and
        seasons cycle — force a line through them and it&rsquo;s wrong <em>everywhere</em>. The fix is smaller than it
        looks: keep least squares exactly as it is, and just give it curvier features to work with.
        </>}
        titleSize={44}
        introSize={17.5}
      />

      <div className="lesson">
        <ModelAnatomy
          form={<>A line in <em>transformed</em> features: <code>ŷ = w·φ(x)</code></>}
          loss={<>Mean squared error — unchanged from linear regression</>}
          optimiser={<>Normal equation or gradient descent — also unchanged</>}
        />

        <h2>A line that can&rsquo;t bend</h2>
        <p>
          Below, test scores rise with study hours — then <strong>plateau</strong>. A straight line (degree 1) has
          to compromise: too low early, too high in the middle, wrong at the end. It has no way to curve. Bump the
          degree up and watch the model gain exactly the flexibility it was missing.
        </p>

        <PolynomialLab />

        <p>
          That&rsquo;s polynomial regression: instead of just <em>x</em>, we also feed the model{" "}
          <em>x²</em>, <em>x³</em>, and so on. Nothing else changes — and that&rsquo;s the surprise this track unpacks.
        </p>

        <h2>The one idea that makes it all work</h2>
        <p>
          A degree-3 fit is a <em>curve</em>, so it feels like it should need new, non-linear math. It doesn&rsquo;t. A
          polynomial is still a <strong>linear combination</strong> — of powers of x instead of x itself — so it&rsquo;s
          still <strong>linear in the parameters</strong>, and the exact same normal equation solves it. Once you
          see that, a whole world opens up: swap the powers for any set of <strong>basis functions</strong> — bumps,
          waves, splines — and you can fit almost any shape while staying inside plain old least squares.
        </p>

        <h2>The arc of this track</h2>
        <ol style={ol}>
          <li><strong>Bending the line</strong> — polynomial features, and why the fit is still linear regression underneath.</li>
          <li><strong>The basis-function view</strong> — the unifying idea; why high-degree polynomials misbehave; RBFs and splines as better building blocks.</li>
          <li><strong>Controlling flexibility</strong> — degree is a capacity knob: the bias–variance tradeoff, choosing it, and regularizing the basis.</li>
          <li><strong>In the wild</strong> — pipelines and the scaling/leakage traps, when to reach for this vs kernels or trees, and a worked example.</li>
        </ol>

        <Callout color="var(--c-regression)" title={<>Prerequisites</>}>
          This builds directly on <Link href="/learn/linear-regression" style={inlineLink}>linear regression</Link>{" "}
            (the normal equation and the loss surface) and pairs naturally with{" "}
            <Link href="/learn/regularized-regression" style={inlineLink}>regularization</Link> — because the more
            flexible the basis, the more you&rsquo;ll want a penalty to keep it honest.
        </Callout>

        <PrevNext prev={{ href: "/learn/linear-regression", label: <>← Linear regression</> }} next={{ href: "/learn/polynomial-regression/polynomial-features", label: <>Next up · Polynomial regression →</> }} />
      </div>
    </article>
  );
}

const ol: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.85 };
const inlineLink: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
