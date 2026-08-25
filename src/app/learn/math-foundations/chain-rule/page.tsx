import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "The chain rule — Manifold",
  description:
    "The chain rule differentiates a composition by multiplying the pieces' rates of change. Applied backward through a network, it becomes backpropagation — how every deep model computes its gradients.",
};

const AMBER = "var(--c-fundamentals)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function ChainRulePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Calculus & optimization", color: AMBER }, { label: "Tier 0 · foundations", color: "var(--c-fundamentals)" }]}
        time="about 6 minutes"
        title={<>The chain rule</>}
        intro={<>Models are built by stacking functions: a loss of a prediction of a layer of a layer of the inputs.
          To train them you need the derivative of that whole stack — and the chain rule is the one tool that gets it,
          by multiplying the rates of change link by link.</>}
      />

      <div className="lesson">
        <h2>Rates of change multiply</h2>
        <p>
          If <M>{String.raw`y = f(g(x))`}</M> — <M>x</M> feeds <M>g</M>, whose output feeds <M>f</M> — then a small
          nudge to <M>x</M> ripples through both, and the derivatives multiply:
        </p>
        <MathBlock>{String.raw`\frac{dy}{dx} = \frac{dy}{dg}\cdot\frac{dg}{dx} = f'(g(x))\cdot g'(x).`}</MathBlock>
        <p>
          The intuition is gears: if <M>g</M> turns three times as fast as <M>x</M>, and <M>f</M> turns twice as fast
          as <M>g</M>, then <M>f</M> turns six times as fast as <M>x</M>. Compose more functions and you multiply more
          factors — one per link in the chain.
        </p>

        <h2>Backpropagation is the chain rule, run backward</h2>
        <p>
          A neural network is a deep composition: <M>{String.raw`\text{loss}(f_L(\cdots f_2(f_1(x))))`}</M>. To update
          any weight, you need the derivative of the loss with respect to it — a long chain of factors. The efficient
          way to evaluate all of them is to sweep <em>backward</em> from the loss, reusing shared factors as you go.
          That algorithm is <strong>backpropagation</strong>; it is nothing more than the chain rule organised so no
          derivative is computed twice.
        </p>
        <p>
          This is why you can train a network hundreds of layers deep: the gradient of the whole thing is just a
          product of each layer&rsquo;s local derivative, multiplied together from output back to input. (It&rsquo;s
          also why <em>vanishing</em> and <em>exploding</em> gradients happen — multiply many small factors and the
          product decays to zero; many large ones and it blows up.)
        </p>

        <Callout color={AMBER} title={<>A worked micro-example</>}>
          Take the squared error of a linear model: <M>{String.raw`L = (y - wx)^2`}</M>. Set{" "}
          <M>{String.raw`u = y - wx`}</M> so <M>{String.raw`L = u^2`}</M>. Then{" "}
          <M>{String.raw`\frac{dL}{dw} = \frac{dL}{du}\cdot\frac{du}{dw} = 2u\cdot(-x) = -2x\,(y - wx)`}</M>. That
          &ldquo;error times input&rdquo; form is the gradient behind{" "}
          <Link href="/learn/linear-regression/what-is-a-gradient" style={link}>linear-regression training</Link> — and
          the chain rule is what produced it.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/math-foundations/gradients", label: <>← Gradients &amp; partial derivatives</> }}
          next={{ href: "/learn/math-foundations/convexity", label: <>Next up · Convex sets &amp; convex functions →</> }}
        />
      </div>
    </article>
  );
}
