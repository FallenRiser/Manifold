import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Mutual information — Manifold",
  description:
    "Mutual information measures how much knowing one variable reduces uncertainty about another — a dependence measure that, unlike correlation, catches nonlinear relationships. It powers feature selection and representation learning.",
};

const AMBER = "var(--c-fundamentals)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function MutualInformationPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Information theory", color: AMBER }, { label: "Tier 0 · foundations", color: "var(--c-fundamentals)" }]}
        time="about 6 minutes"
        title={<>Mutual information</>}
        intro={<>How much does knowing one variable tell you about another? <Link href="/learn/math-foundations/independence" style={link}>Correlation</Link>
          answers this only for straight-line relationships. Mutual information answers it in full generality — catching
          the curved, tangled dependence correlation is blind to.</>}
      />

      <div className="lesson">
        <h2>Uncertainty removed</h2>
        <p>
          <strong>Mutual information</strong> <M>{String.raw`I(X; Y)`}</M> is how much the{" "}
          <Link href="/learn/math-foundations/entropy" style={link}>entropy</Link> of <M>X</M> drops once you learn{" "}
          <M>Y</M> — the uncertainty about one that the other resolves:
        </p>
        <MathBlock>{String.raw`I(X; Y) = H(X) - H(X \mid Y) = H(Y) - H(Y \mid X).`}</MathBlock>
        <p>
          It&rsquo;s symmetric (<M>Y</M> tells you as much about <M>X</M> as vice versa) and never negative. It&rsquo;s
          also exactly the <Link href="/learn/math-foundations/kl-divergence" style={link}>KL divergence</Link> between
          the joint distribution and the product of the marginals:
        </p>
        <MathBlock>{String.raw`I(X; Y) = D_{\mathrm{KL}}\big(p(x, y) \parallel p(x)p(y)\big).`}</MathBlock>
        <p>
          Read that last line carefully: it measures how far the true joint is from &ldquo;what it would be if they
          were <Link href="/learn/math-foundations/independence" style={link}>independent</Link>.&rdquo; So{" "}
          <M>{String.raw`I(X; Y) = 0`}</M> if and only if <M>X</M> and <M>Y</M> are <em>truly independent</em> — not
          merely uncorrelated.
        </p>

        <h2>Why it beats correlation</h2>
        <p>
          This is the crucial advantage. Correlation is zero for a variable and its square, or points on a circle,
          even though the dependence is total. Mutual information is <strong>large</strong> in exactly those cases,
          because knowing <M>x</M> genuinely slashes uncertainty about <M>y</M>. It detects <em>any</em> statistical
          relationship, linear or not — the honest answer to &ldquo;are these two related?&rdquo;
        </p>

        <h2>Where ML uses it</h2>
        <ul style={{ margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 }}>
          <li><strong>Feature selection.</strong> Rank features by their mutual information with the target to catch predictive-but-nonlinear features a correlation filter would discard.</li>
          <li><strong>Decision trees.</strong> Information gain — the splitting criterion — <em>is</em> the mutual information between a feature and the label.</li>
          <li><strong>Representation learning.</strong> Objectives like InfoNCE (contrastive learning) maximise mutual information between different views of the same data; the &ldquo;information bottleneck&rdquo; frames a whole network as trading off MI terms.</li>
        </ul>

        <Callout color={AMBER} title={<>The catch: estimating it is hard</>}>
          Mutual information is beautiful in theory but tricky to estimate from finite, high-dimensional samples —
          you&rsquo;d need the joint distribution, which is exactly what&rsquo;s scarce. That&rsquo;s why it&rsquo;s a
          conceptual workhorse and a practical challenge, with a small industry of neural MI estimators. Powerful lens,
          handle with care.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/math-foundations/kl-divergence", label: <>← Cross-entropy &amp; KL divergence</> }}
          next={{ href: "/learn/math-foundations/bregman", label: <>Next up · Bregman divergences →</> }}
        />
      </div>
    </article>
  );
}
