import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Moment-generating functions — Manifold",
  description:
    "A moment-generating function packs all of a distribution's moments into one function. It makes sums of independent variables easy and is the technical engine behind the exponential tail bounds of learning theory.",
};

const AMBER = "var(--c-fundamentals)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function MgfPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Probability", color: AMBER }, { label: "Tier 3 · theory", color: "var(--c-metrics)" }]}
        time="about 6 minutes"
        title={<>Moment-generating functions</>}
        intro={<>A more advanced tool, but a load-bearing one: the moment-generating function is a single function that
          encodes an entire distribution&rsquo;s moments. It turns sums of independent variables into products and is
          the machinery behind the exponential concentration bounds coming up next.</>}
      />

      <div className="lesson">
        <h2>One function, all the moments</h2>
        <p>
          The <strong>moment-generating function (MGF)</strong> of a random variable is the expected value of{" "}
          <M>{String.raw`e^{tX}`}</M>, viewed as a function of <M>t</M>:
        </p>
        <MathBlock>{String.raw`M_X(t) = \mathbb E\big[e^{tX}\big].`}</MathBlock>
        <p>
          The name comes from a neat trick: differentiate <M>{String.raw`M_X`}</M> at <M>{String.raw`t=0`}</M> and you
          get the moments. The first derivative gives <M>{String.raw`\mathbb E[X]`}</M>, the second gives{" "}
          <M>{String.raw`\mathbb E[X^2]`}</M>, and so on — the whole sequence of moments (mean, spread, skew…) falls
          out of one function by repeated differentiation.
        </p>

        <h2>Why it&rsquo;s so useful: sums become products</h2>
        <p>
          For <em>independent</em> <M>X</M> and <M>Y</M>, the MGF of their sum is the product of their MGFs:
        </p>
        <MathBlock>{String.raw`M_{X+Y}(t) = M_X(t)\,M_Y(t).`}</MathBlock>
        <p>
          Convolutions (the honest way to combine independent sums) are painful; multiplication is easy. This is how
          you prove, cleanly, that the sum of independent Gaussians is Gaussian, or that binomials add — you multiply
          MGFs and recognise the result. An MGF also <em>uniquely determines</em> the distribution, so matching MGFs
          means matching distributions.
        </p>

        <h2>The bridge to tail bounds</h2>
        <p>
          The reason this strand includes the MGF is what it unlocks next. Applying{" "}
          <Link href="/learn/math-foundations/markov-chebyshev" style={link}>Markov&rsquo;s inequality</Link> to{" "}
          <M>{String.raw`e^{tX}`}</M> instead of <M>X</M> gives an <em>exponentially</em> decaying bound on the
          probability of a large deviation:
        </p>
        <MathBlock>{String.raw`P(X \ge a) \le \frac{M_X(t)}{e^{ta}} \quad \text{for any } t > 0.`}</MathBlock>
        <p>
          Optimising over <M>t</M> gives the tightest such bound — the <strong>Chernoff method</strong>. Every
          exponential concentration inequality — <Link href="/learn/math-foundations/hoeffding" style={link}>Hoeffding</Link>,{" "}
          <Link href="/learn/math-foundations/chernoff" style={link}>Chernoff</Link> — is this one move applied to the
          MGF of a sum. That&rsquo;s why the concentration chapter needs this page first.
        </p>

        <Callout color={AMBER} title={<>When to reach for it</>}>
          You won&rsquo;t compute MGFs day to day. But when you need to reason about the sum or average of many
          independent quantities — a Monte-Carlo estimate, an empirical error rate, a bagged ensemble&rsquo;s vote —
          the MGF is the tool that turns &ldquo;probably close to the mean&rdquo; into a precise, exponential
          guarantee. It&rsquo;s the quiet engine under generalization theory.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/math-foundations/gaussian", label: <>← The Gaussian, up close</> }}
          next={{ href: "/learn/math-foundations/lln-and-clt", label: <>Next up · The law of large numbers &amp; the CLT →</> }}
        />
      </div>
    </article>
  );
}
