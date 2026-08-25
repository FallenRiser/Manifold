import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Independence, covariance & correlation — Manifold",
  description:
    "Independence means one variable tells you nothing about another. Covariance and correlation measure linear co-movement — but zero correlation is not independence, a gap that trips up a lot of analysis.",
};

const AMBER = "var(--c-fundamentals)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function IndependencePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Probability", color: AMBER }, { label: "Tier 0 · foundations", color: "var(--c-fundamentals)" }]}
        time="about 6 minutes"
        title={<>Independence, covariance &amp; correlation</>}
        intro={<>How do two variables relate? The strongest answer is &ldquo;not at all&rdquo; — independence. The more
          common, weaker answer is a number measuring how they move together: covariance, and its normalized cousin,
          correlation. Knowing what each does and doesn&rsquo;t promise saves you from real mistakes.</>}
      />

      <div className="lesson">
        <h2>Independence: no information</h2>
        <p>
          Two variables are <strong>independent</strong> if knowing one tells you nothing about the other —
          their joint probability factors:
        </p>
        <MathBlock>{String.raw`P(X, Y) = P(X)\,P(Y), \quad\text{equivalently}\quad P(X \mid Y) = P(X).`}</MathBlock>
        <p>
          Independence is a strong, all-or-nothing statement about the <em>entire</em> relationship. It&rsquo;s the
          assumption that makes <Link href="/learn/logistic-regression/the-generative-twin" style={link}>naive
          Bayes</Link> &ldquo;naive,&rdquo; that lets <Link href="/learn/math-foundations/expectation-and-variance" style={link}>variances
          add</Link>, and that underpins the <Link href="/learn/math-foundations/lln-and-clt" style={link}>i.i.d.
          assumption</Link> behind nearly every training procedure.
        </p>

        <h2>Covariance: linear co-movement</h2>
        <p>
          <strong>Covariance</strong> measures whether two variables tend to rise and fall together:
        </p>
        <MathBlock>{String.raw`\operatorname{Cov}(X, Y) = \mathbb E\big[(X - \mathbb E X)(Y - \mathbb E Y)\big].`}</MathBlock>
        <p>
          Positive means they move together, negative means one rises as the other falls, zero means no <em>linear</em>
          trend. Its units are awkward (units of <M>X</M> times units of <M>Y</M>), so we usually normalize to{" "}
          <strong>correlation</strong>:
        </p>
        <MathBlock>{String.raw`\rho_{XY} = \frac{\operatorname{Cov}(X, Y)}{\sigma_X\,\sigma_Y} \in [-1, 1].`}</MathBlock>
        <p>
          Now <M>{String.raw`\rho = 1`}</M> is perfect positive linear relationship, <M>{String.raw`-1`}</M> perfect
          negative, <M>{String.raw`0`}</M> no linear relationship. Stack all pairwise covariances of a data set and you
          get the <Link href="/learn/pca/centering-and-covariance" style={link}>covariance matrix</Link> that PCA
          eats.
        </p>

        <Callout color={AMBER} title={<>The trap: zero correlation ≠ independence</>}>
          Correlation only sees <em>linear</em> association. Points arranged on a circle, or on a{" "}
          <M>{String.raw`y = x^2`}</M> parabola, have correlation ≈ 0 yet are completely dependent — knowing <M>x</M>
          pins down <M>{String.raw`|y|`}</M>. Independence implies zero correlation, but <strong>never</strong> the
          reverse. A model that assumes &ldquo;uncorrelated, therefore independent&rdquo; can miss the entire
          structure — one of the most common quiet errors in data analysis.
        </Callout>

        <p>
          This gap is also why PCA, which only removes <em>correlation</em> between components, is not the same as{" "}
          <strong>independent</strong> component analysis (ICA), which chases true independence. Decorrelation is the
          easy, linear part; independence is the hard, full part.
        </p>

        <PrevNext
          prev={{ href: "/learn/math-foundations/bayes", label: <>← Conditional probability &amp; Bayes&rsquo; rule</> }}
          next={{ href: "/learn/math-foundations/gaussian", label: <>Next up · The Gaussian, up close →</> }}
        />
      </div>
    </article>
  );
}
