import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Soft margin: C & slack — Manifold",
  description:
    "Real data won't fit inside any reasonable tube, so SVR allows violations — slack — and charges for them with a penalty C. How C trades a tight fit against a flat, simple model, and why it's the inverse of λ.",
};

export default function SoftMarginPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }, { label: "Tier 2 · the ε-insensitive idea", color: "var(--c-regression)" }]}
        time="about 7 minutes"
        title={<>Soft margin: C &amp; slack</>}
        intro={<>
          No real dataset fits neatly inside a tube — some points will always break out. SVR handles them with
        <em> slack</em>: it lets points violate the tube, but charges a price, C, for the privilege. That price
        is SVR&rsquo;s main regularisation knob.
        </>}
      />

      <div className="lesson">
        <h2>Slack: allowing violations</h2>
        <p>
          A &ldquo;hard&rdquo; tube that forbids all violations would be infeasible on noisy data (and wildly
          overfit if it weren&rsquo;t). So for each point we add a <strong>slack variable</strong> —{" "}
          <M>{String.raw`\xi_i`}</M> for breaking through the top of the tube,{" "}
          <M>{String.raw`\xi_i^*`}</M> for the bottom — measuring how far outside the tube it lands. Slack is zero
          for points inside the tube and grows with the size of the violation.
        </p>

        <h2>C: the price of each violation</h2>
        <p>
          SVR then minimises a sum of two competing terms: the <em>flatness</em> of the model plus{" "}
          <M>{String.raw`C`}</M> times the total slack:
        </p>
        <MathBlock>{String.raw`\min_{w,\,b,\,\xi}\ \underbrace{\tfrac{1}{2}\lVert w \rVert^2}_{\text{flatness}} \;+\; C \underbrace{\sum_{i}(\xi_i + \xi_i^*)}_{\text{total tube violation}}`}</MathBlock>
        <p>
          <M>{String.raw`C > 0`}</M> sets the exchange rate between the two goals — how many units of &ldquo;flatter
          model&rdquo; a unit of &ldquo;tube violation&rdquo; is worth. It is the single most important
          regularisation knob in SVR.
        </p>

        <h2>The two extremes</h2>
        <ul style={ul}>
          <li>
            <strong>Large C</strong> — violations are expensive, so the model bends hard to keep points inside the
            tube. Low bias, high variance: a wiggly fit that chases the data and can overfit. In the limit it
            approaches a hard tube.
          </li>
          <li>
            <strong>Small C</strong> — violations are cheap, so the model prioritises flatness and tolerates many
            points outside the tube. High bias, low variance: a smooth, simple fit that may underfit.
          </li>
        </ul>

        <Callout color="var(--c-regression)" title={<>C is the inverse of λ</>}>
          If this feels like ridge&rsquo;s <M>{String.raw`\lambda`}</M> in reverse, it is. Ridge writes{" "}
            <M>{String.raw`\text{error} + \lambda\lVert w\rVert^2`}</M> — penalty on the weights.
            SVR writes <M>{String.raw`\lVert w\rVert^2 + C\cdot\text{error}`}</M> — penalty on the error. So{" "}
            <strong>large C ≈ small λ</strong> (fit hard) and <strong>small C ≈ large λ</strong> (regularise
            hard). It&rsquo;s the same bias–variance dial, just written with the penalty on the other term. Watch
            the direction: turning C <em>up</em> reduces regularisation.
        </Callout>

        <h2>C and ε do different jobs</h2>
        <p>
          It&rsquo;s worth separating the two tube knobs, because they&rsquo;re easy to conflate:
        </p>
        <ul style={ul}>
          <li><strong><M>{String.raw`\varepsilon`}</M></strong> sets the <em>width</em> of the tube — how large an error is &ldquo;free.&rdquo; It controls sparsity and the precision you demand.</li>
          <li><strong><M>{String.raw`C`}</M></strong> sets the <em>penalty</em> for leaving the tube — how hard the model works to pull violators back. It controls the bias–variance trade-off.</li>
        </ul>
        <p>
          A point can be a support vector because it&rsquo;s at the tube edge (governed by the fit) or because it&rsquo;s
          outside and paying <M>{String.raw`C`}</M> (governed by the penalty). Both ε and C shape how many support
          vectors you end up with — which is why they, plus the kernel width γ, are tuned together.
        </p>

        <Quiz
          accent="var(--c-regression)"
          questions={[
            {
              q: "In SVR, what does the slack variable ξᵢ measure?",
              options: ["How far point i lies outside the ε-tube", "The kernel similarity", "The prediction error inside the tube"],
              answer: 0,
              explain: "Slack is the size of a tube violation — zero inside the tube, growing with distance beyond its edge.",
            },
            {
              q: "Increasing C in SVR…",
              options: ["Makes violations more expensive → a tighter, more flexible fit (less regularisation)", "Widens the tube", "Always increases sparsity"],
              answer: 0,
              explain: "Large C punishes tube violations heavily, so the model bends to fit — low bias, high variance. C is the inverse of ridge's λ.",
            },
            {
              q: "How do ε and C differ in role?",
              options: ["ε sets the tube's width (free-error tolerance); C sets the penalty for leaving it", "They're the same parameter", "ε controls speed, C controls accuracy"],
              answer: 0,
              explain: "ε is the tolerance (and sparsity) knob; C is the regularisation (bias–variance) knob. Both affect the support-vector count, so tune them jointly.",
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/support-vector-regression/the-tube-and-support-vectors", label: <>← The tube &amp; support vectors</> }} next={{ href: "/learn/support-vector-regression/the-primal-problem", label: <>Next up · The primal problem →</> }} />
      </div>
    </article>
  );
}

const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
