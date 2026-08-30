import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { CodeOutput } from "@/components/CodeOutput";

export const metadata = {
  title: "Why backpropagation is cheap — Manifold",
  description:
    "The speed does not come from clever arithmetic. It comes from computing each intermediate gradient once and sharing it — and from choosing the direction of traversal that suits a scalar output.",
};

const CORAL = "var(--c-neural)";

export default function WhyCheapPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "The algorithm", color: CORAL }, { label: "Tier 2 · mechanics", color: CORAL }]}
        time="about 8 minutes"
        title={<>Why it is cheap</>}
        intro={<>We opened this track with a 1,200× speedup and no explanation. The explanation is not that
          backpropagation computes anything faster. It computes the same quantities — it just refuses to compute
          any of them twice, and it walks the graph in the direction that happens to suit the shape of the
          problem.</>}
      />

      <div className="lesson">
        <h2>The waste in the naive method</h2>
        <p>
          Perturbing one weight in the first layer and re-running the network recomputes every layer after it. Then
          you perturb the next weight and recompute all of it again. With <M>{String.raw`P`}</M> parameters you
          repeat essentially the same computation <M>{String.raw`2P`}</M> times, and nearly all of it is identical
          each time.
        </p>
        <p>
          Backprop recognises that the quantity <M>{String.raw`\delta^{(\ell)}`}</M> is shared. Every weight in
          layer <M>{String.raw`\ell`}</M> — all <M>{String.raw`pq`}</M> of them — needs the <em>same</em>{" "}
          <M>{String.raw`\delta^{(\ell)}`}</M>, so it is computed once and used <M>{String.raw`pq`}</M> times.
        </p>

        <Callout color={CORAL} title={<>The general name for this</>}>
          It is <strong>dynamic programming</strong>: a subproblem whose answer many other subproblems need gets
          solved once and stored. The subproblem here is &ldquo;how much does the loss respond to this
          intermediate value?&rdquo;, and the ordering that makes it work is <em>reverse topological</em> — you can
          only answer for a node once you have answered for everything downstream of it. Backprop is not a
          special-purpose invention; it is the standard technique, applied to a derivative.
        </Callout>

        <h2>Counting the cost</h2>
        <p>
          A forward pass through a layer with weight matrix <M>{String.raw`(p, q)`}</M> costs about{" "}
          <M>{String.raw`pq`}</M> multiply-adds per example. The backward pass does two matrix products of the same
          size — one to propagate the delta, one to form the weight gradient. So:
        </p>

        <MathBlock>{String.raw`\text{cost(backward)} \;\approx\; 2 \times \text{cost(forward)}`}</MathBlock>

        <p>
          A full training step — forward, then backward — costs roughly <strong>three forward passes</strong>,
          regardless of how many parameters there are. That is the number to remember. Compare with{" "}
          <M>{String.raw`2P`}</M>:
        </p>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 520 }}>
            <thead>
              <tr>
                {["parameters", "finite differences", "backpropagation", "ratio"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "7px 24px 7px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["1,000", "2,000 passes", "~3 passes", "~670×"],
                ["1,000,000", "2,000,000 passes", "~3 passes", "~670,000×"],
                ["1,000,000,000", "2 billion passes", "~3 passes", "~670,000,000×"],
              ].map((row, i) => (
                <tr key={i}>
                  {row.map((c, j) => (
                    <td key={j} style={{ padding: "7px 24px 7px 0", color: j === 3 ? CORAL : j === 2 ? "var(--good)" : "var(--ink)", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p>
          The backprop column does not change. That is the entire point, and it is why the measured ratio grew from
          23× to 1,219× as the toy network grew — the numerator was rising while the denominator sat still.
        </p>

        <CodeOutput>{` width   params   backprop (ms)   finite diff (ms)    ratio
     4       37           0.127                2.9      23x
     8      105           0.153               12.1      79x
    16      337           0.202               62.6     310x
    32     1185           0.328              400.3    1219x`}</CodeOutput>

        <h2>Why <em>backwards</em>, specifically</h2>
        <p>
          There is a genuine choice here that most treatments skip, and it explains why the algorithm is not called
          &ldquo;forward-propagation&rdquo;.
        </p>
        <p>
          You can traverse the graph either way. Going <strong>forwards</strong>, you pick one input and compute how
          everything downstream responds to it — one sweep gives you the derivative of <em>every output</em> with
          respect to <em>one input</em>. Going <strong>backwards</strong>, you pick one output and compute how it
          responds to everything upstream — one sweep gives you the derivative of <em>one output</em> with respect
          to <em>every input</em>.
        </p>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 560 }}>
            <thead>
              <tr>
                {["", "forward mode", "reverse mode"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "7px 24px 7px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["one sweep gives you", "all outputs, w.r.t. one input", "one output, w.r.t. all inputs"],
                ["sweeps needed", "one per input (= per parameter)", "one per output (= one)"],
                ["good when", "few inputs, many outputs", "many inputs, one output"],
                ["memory", "low — nothing to store", "high — the forward pass is kept"],
              ].map((row, i) => (
                <tr key={i}>
                  {row.map((c, j) => (
                    <td key={j} style={{ padding: "7px 24px 7px 0", color: j === 2 ? CORAL : j === 0 ? "var(--muted)" : "var(--ink)", borderBottom: "1px solid var(--border)", verticalAlign: "top" }}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p>
          Now look at the shape of our problem: <strong>a hundred million inputs (the parameters) and exactly one
          output (the loss).</strong> That is the most lopsided case imaginable, and it is precisely the case
          reverse mode was made for. One sweep, every derivative.
        </p>

        <Callout color={CORAL} title={<>The choice is not universal — it follows from the shape</>}>
          Flip the problem and the answer flips. Sensitivity analysis of a simulation with two uncertain parameters
          and ten thousand outputs is a <em>forward-mode</em> problem: two sweeps rather than ten thousand.
          Backpropagation is not the right way to differentiate things in general. It is the right way to
          differentiate <strong>a scalar loss with respect to an enormous number of parameters</strong>, and that
          happens to be exactly what training is. The memory cost in the last row is the price, and it is the reason
          training runs out of memory when inference does not.
        </Callout>

        <h2>What this buys, historically</h2>
        <p>
          The reason this deserves emphasis rather than a footnote: <strong>backpropagation is what made the
          parameter count stop mattering.</strong> Under finite differences, doubling your model doubles the cost of
          every gradient, so scale is self-limiting. Under backprop, doubling the model doubles the cost of one
          forward pass and nothing else — the same modest constant.
        </p>
        <p>
          Every subsequent development that depends on scale rests on that. The algorithm is a calculus identity
          plus a good traversal order, and it is the reason a model with a hundred billion parameters is a
          budgeting problem rather than an impossibility.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>Where does backpropagation&rsquo;s efficiency actually come from?</>,
              options: [
                "It uses a faster formula for each derivative",
                "It computes each intermediate gradient once and shares it among every parameter that needs it",
                "It approximates the gradient rather than computing it exactly",
              ],
              answer: 1,
              explain: <>The arithmetic per operation is identical — this is dynamic programming, not a faster
                formula. And it is exact; the <em>slow</em> method is the approximate one, which is the inversion
                people find most surprising.</>,
            },
            {
              q: <>Why is reverse mode the right choice for training?</>,
              options: [
                "It uses less memory than forward mode",
                "Because there are many parameters and exactly one loss — one backward sweep covers all of them",
                "Because neural networks can only be traversed backwards",
              ],
              answer: 1,
              explain: <>It follows entirely from the shape: many inputs, one output. Reverse mode uses{" "}
                <em>more</em> memory, not less — that is its cost. And forward mode works fine on a network; it is
                simply the wrong choice at this aspect ratio.</>,
            },
            {
              q: <>You need the sensitivity of 10,000 simulation outputs to 2 input parameters. Which mode?</>,
              options: ["Reverse mode, as usual", "Forward mode — two sweeps instead of ten thousand", "Finite differences"],
              answer: 1,
              explain: <>The aspect ratio is inverted, so the answer inverts: forward mode needs one sweep per{" "}
                <em>input</em>, giving two. Reverse mode would need one per output — ten thousand. Backprop is the
                right tool for a specific shape of problem, not for differentiation in general.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/backpropagation/the-four-equations", label: <>← The four equations</> }}
          next={{ href: "/learn/backpropagation/writing-it-from-scratch", label: <>Next up · Writing it from scratch →</> }}
        />
      </div>
    </article>
  );
}
