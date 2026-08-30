import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { GuessSlider } from "@/components/capstone/GuessSlider";

export const metadata = {
  title: "The cost of a gradient — Manifold",
  description:
    "The obvious way to get a gradient is to nudge each parameter and re-run. It is correct, it is four lines long, and it is roughly 1,200x too slow before your network has even 1,200 parameters.",
};

const CORAL = "var(--c-neural)";

const ROWS: [string, string, string, string][] = [
  ["4", "37", "0.127", "2.9"],
  ["8", "105", "0.153", "12.1"],
  ["16", "337", "0.202", "62.6"],
  ["32", "1,185", "0.328", "400.3"],
];

export default function CostOfGradientPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "The problem", color: CORAL }, { label: "Tier 1 · intuition", color: CORAL }]}
        time="about 7 minutes"
        title={<>The cost of a gradient</>}
        intro={<>Training needs one number per parameter: how much would the loss change if I nudged this weight?
          There is an obvious way to get those numbers, it is completely correct, and understanding exactly why it
          is unusable is the best possible motivation for the alternative.</>}
      />

      <div className="lesson">
        <h2>The obvious method</h2>
        <p>
          A derivative is a limit of a difference. So approximate it with a difference: move the weight a little,
          see how the loss changes, divide.
        </p>

        <MathBlock>{String.raw`\frac{\partial \mathcal{L}}{\partial \theta_k} \;\approx\; \frac{\mathcal{L}(\theta + h\,\mathbf{e}_k) - \mathcal{L}(\theta - h\,\mathbf{e}_k)}{2h}`}</MathBlock>

        <CodeBlock
          language="Python"
          fromScratch={`def numeric_gradient(theta, X, y, h=1e-5):
    g = np.zeros_like(theta)
    for k in range(len(theta)):              # once per parameter
        up, dn = theta.copy(), theta.copy()
        up[k] += h
        dn[k] -= h
        g[k] = (loss(up, X, y) - loss(dn, X, y)) / (2 * h)
    return g`}
        />

        <p>
          Four lines. No calculus, no derivation, nothing to get wrong. It works on any model at all — it never even
          looks inside. If you have never implemented a gradient before, this is the version you would write, and
          you would be right to.
        </p>

        <h2>Then you count the passes</h2>
        <p>
          Look at the loop. Each iteration runs the network twice, and there is one iteration{" "}
          <strong>per parameter</strong>. A network with <M>{String.raw`P`}</M> parameters needs{" "}
          <M>{String.raw`2P`}</M> forward passes to produce one gradient — and one gradient is one training step,
          of which you need thousands.
        </p>

        <GuessSlider
          accent={CORAL}
          prompt={<>On a small network with 1,185 parameters, one backward sweep takes about 0.33 milliseconds. How long
            does the finite-difference version take for the same gradient?</>}
          min={0}
          max={800}
          step={5}
          start={50}
          actual={400}
          decimals={0}
          reveal={<>About 400 milliseconds — <strong>roughly 1,200× slower</strong>, on a network small enough to be a toy. And
            the ratio is not a constant: it grows in proportion to the parameter count, because one method costs{" "}
            <M>{String.raw`O(P)`}</M> passes and the other costs <M>{String.raw`O(1)`}</M>.</>}
        />

        <CodeOutput>{` width   params   backprop (ms)   finite diff (ms)    ratio
     4       37           0.127                2.9      23x
     8      105           0.153               12.1      79x
    16      337           0.202               62.6     310x
    32     1185           0.328              400.3    1219x`}</CodeOutput>

        <p style={{ fontSize: 13.5, color: "var(--faint)" }}>
          These are wall-clock times on one machine, so the absolute milliseconds move by a few percent between
          runs — the ratio in the last row lands somewhere around 1,200×. What does <em>not</em> move is the shape:
          one column is flat and the other is proportional to the parameter count.
        </p>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 480 }}>
            <thead>
              <tr>
                {["hidden width", "parameters", "backprop (ms)", "finite differences (ms)"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "7px 20px 7px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row[0]}>
                  {row.map((c, j) => (
                    <td key={j} style={{ padding: "7px 20px 7px 0", color: j === 3 ? "var(--bad)" : j === 2 ? "var(--good)" : "var(--ink)", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p>
          Read down the last two columns. As the parameter count grows 32-fold, backprop&rsquo;s time grows{" "}
          <strong>2.6-fold</strong> — and most of even that is the network itself getting bigger, not the gradient
          machinery. Finite differences grows <strong>138-fold</strong>. That difference in slope, not the absolute
          numbers, is the entire subject of this track.
        </p>

        <Callout color={CORAL} title={<>Put it on the scale of a real model</>}>
          Take a modest model with 100 million parameters and suppose a forward pass costs 10 ms. Finite differences
          needs 200 million passes for <strong>one</strong> gradient — about <strong>23 days</strong>. You need
          hundreds of thousands of gradients. Backpropagation computes the same thing in roughly the cost of two
          forward passes: <strong>20 ms</strong>. This is not an optimisation. It is the difference between a field
          existing and not existing.
        </Callout>

        <h2>And it is not even exact</h2>
        <p>
          The speed is the headline, but finite differences has a second problem that is worth meeting now, because
          it comes back when we use the method as a <em>test</em> rather than as an algorithm.
        </p>
        <p>
          The formula is an approximation controlled by <M>{String.raw`h`}</M>, and you are squeezed from both
          sides. Too large and the difference quotient is not the derivative. Too small and you subtract two nearly
          equal floating-point numbers and lose most of your significant digits to cancellation. Measured on the
          same network, against the exact analytic gradient:
        </p>

        <CodeOutput>{`  h = 1e-02   relative difference = 9.813e-06
  h = 1e-04   relative difference = 9.831e-10
  h = 1e-06   relative difference = 8.800e-10
  h = 1e-08   relative difference = 7.953e-08
  h = 1e-10   relative difference = 8.212e-06`}</CodeOutput>

        <p>
          A clear valley. The best accuracy sits at <M>{String.raw`h \approx 10^{-4}`}</M> to{" "}
          <M>{String.raw`10^{-6}`}</M>, and going <em>smaller</em> from there makes the answer{" "}
          <strong>worse</strong> — a thousand times worse by <M>{String.raw`10^{-10}`}</M>. That is
          counter-intuitive the first time you see it, and it is a property of floating-point arithmetic rather than
          of calculus.
        </p>

        <h2>What we want instead</h2>
        <p>
          An exact gradient, for every parameter at once, at a cost that does not grow with the number of
          parameters. That sounds like too much to ask. It is available, and the reason is a structural fact about
          networks: <strong>the parameters are not independent knobs on a black box — they sit in a known
          composition of simple functions, and the derivative of a composition has a formula.</strong>
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>Why does the finite-difference method scale so badly with model size?</>,
              options: [
                "Each forward pass gets slower as the model grows",
                "It needs two forward passes per parameter, so the total cost is O(P) passes",
                "Floating-point error accumulates across parameters",
              ],
              answer: 1,
              explain: <>Individual passes do get more expensive, but that affects both methods equally. The killer
                is the loop: the number of passes is proportional to the number of parameters, while backprop needs
                a fixed number regardless.</>,
            },
            {
              q: <>Making <M>{String.raw`h`}</M> smaller made the estimate less accurate below{" "}
                <M>{String.raw`10^{-6}`}</M>. Why?</>,
              options: [
                "The derivative is undefined at very small scales",
                "Subtracting two nearly equal floating-point numbers destroys the significant digits",
                "The network's activations saturate",
              ],
              answer: 1,
              explain: <>Catastrophic cancellation. The two loss values agree in almost every digit, so their
                difference is mostly rounding error, and dividing by a tiny <M>{String.raw`h`}</M> amplifies it. The
                mathematical error shrinks with <M>{String.raw`h`}</M> and the numerical error grows — the best{" "}
                <M>{String.raw`h`}</M> is where they cross.</>,
            },
            {
              q: <>What structural fact makes an efficient exact gradient possible at all?</>,
              options: [
                "Networks are differentiable everywhere",
                "The network is a known composition of simple functions, and compositions have a derivative rule",
                "Modern hardware parallelises the nudges",
              ],
              answer: 1,
              explain: <>Differentiability is necessary but not sufficient — a differentiable black box still gives
                you nothing but nudging. What backprop exploits is that we <em>know the structure</em>: each layer's
                local derivative is trivial, and the chain rule assembles them.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/backpropagation", label: <>← Backpropagation</> }}
          next={{ href: "/learn/backpropagation/the-chain-rule", label: <>Next up · The chain rule, as influence →</> }}
        />
      </div>
    </article>
  );
}
