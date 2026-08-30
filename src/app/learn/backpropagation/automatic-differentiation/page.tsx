import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";

export const metadata = {
  title: "Automatic differentiation — Manifold",
  description:
    "Frameworks do not know calculus and do not manipulate formulas. They record the operations you actually ran, then replay that recording backwards — which is why control flow just works.",
};

const CORAL = "var(--c-neural)";

export default function AutodiffPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Doing it for real", color: CORAL }, { label: "Tier 2 · practice", color: CORAL }]}
        time="about 8 minutes"
        title={<>Automatic differentiation</>}
        intro={<>You will not write a backward pass again after this track. Understanding what replaces it — and
          the one thing it is <em>not</em> — is what turns a framework from a black box into a tool you can
          reason about when it misbehaves.</>}
      />

      <div className="lesson">
        <h2>Three things that get confused</h2>
        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 600 }}>
            <thead>
              <tr>
                {["approach", "what it does", "the problem"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "7px 20px 7px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["Numerical", "nudge and measure", "O(P) passes, and only approximate"],
                ["Symbolic", "manipulate the formula, as Mathematica would", "expressions explode in size; needs a closed form"],
                ["Automatic", "record the operations that ran, replay backwards", "— this is what frameworks do"],
              ].map((row, i) => (
                <tr key={i}>
                  {row.map((c, j) => (
                    <td key={j} style={{ padding: "7px 20px 7px 0", color: i === 2 ? (j === 0 ? CORAL : "var(--ink)") : "var(--ink)", borderBottom: "1px solid var(--border)", verticalAlign: "top", fontWeight: i === 2 && j === 0 ? 500 : 400 }}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p>
          Autodiff is neither of the first two, and the distinction from <em>symbolic</em> is the one worth being
          precise about. A framework never builds a formula for{" "}
          <M>{String.raw`\partial\mathcal{L}/\partial W`}</M>. It records that a matrix multiply happened with these
          particular arrays, then applies that operation&rsquo;s known local rule to the numbers. It is exact like
          symbolic differentiation and cheap like numerical differentiation, and it gets both by never leaving the
          world of concrete values.
        </p>

        <Callout color={CORAL} title={<>Why that distinction has consequences</>}>
          Because the graph is a record of <em>what actually ran</em>, anything you can execute is differentiable —
          loops whose length depends on the data, <code>if</code> statements, recursion, early exits. There is no
          formula to write down for a network whose depth varies per example, and autodiff does not need one. This
          is why frameworks did not have to be redesigned for architectures nobody had thought of.
        </Callout>

        <h2>The tape</h2>
        <p>
          Every operation on a tracked tensor appends an entry: which inputs, which operation, what the backward
          rule is. Running the forward pass builds this record as a side effect.
        </p>

        <CodeBlock
          language="Python"
          fromScratch={`x = torch.tensor([2.0], requires_grad=True)
y = x * 3          # tape: multiply, saves 3
z = y ** 2         # tape: power,    saves y = 6
z.backward()       # walk the tape backwards from z

print(x.grad)      # dz/dx = 2 * (3x) * 3 = 18x = 36`}
        />
        <CodeOutput>{`tensor([36.])`}</CodeOutput>

        <p>
          <code>backward()</code> seeds the output gradient at 1 and walks the tape in reverse, exactly as we did by
          hand — the power node turns 1 into <M>{String.raw`2y = 12`}</M>, the multiply node turns 12 into{" "}
          <M>{String.raw`12 \times 3 = 36`}</M>. The same three-line procedure from the computational-graph page,
          with the bookkeeping automated.
        </p>

        <h2>The three behaviours that surprise people</h2>
        <p>
          Each of these follows directly from something earlier in this track, which is the point of having done it
          by hand.
        </p>

        <p>
          <strong>Gradients accumulate; they do not overwrite.</strong> Calling <code>backward()</code> twice adds
          into <code>.grad</code>, which is why <code>optimizer.zero_grad()</code> exists and why forgetting it is
          the single most common PyTorch bug. This is not an API quirk — a node with several consumers{" "}
          <em>must</em> sum its incoming gradients, so accumulation is the correct default and clearing is your job.
        </p>

        <CodeBlock
          language="Python"
          fromScratch={`for xb, yb in loader:
    optimizer.zero_grad()          # without this, gradients from every previous
    loss = criterion(model(xb), yb)#   batch are still sitting in .grad
    loss.backward()
    optimizer.step()`}
        />

        <p>
          <strong>The tape is consumed by default.</strong> A second <code>backward()</code> on the same graph
          raises an error unless you asked to keep it. Because the tape holds every stored activation, freeing it
          immediately is what stops training from exhausting memory — the same storage cost we met two chapters ago,
          now visible as an API constraint.
        </p>

        <p>
          <strong>Detaching cuts the record.</strong> <code>.detach()</code> and{" "}
          <code>torch.no_grad()</code> stop the tape from being written, so no gradient flows back through that
          value. This is how you freeze part of a model, and how you evaluate without accumulating a graph you will
          never differentiate.
        </p>

        <CodeBlock
          language="Python"
          fromScratch={`with torch.no_grad():            # nothing recorded, nothing stored
    val_loss = criterion(model(X_val), y_val)`}
        />

        <h2>Reading a framework error with what you now know</h2>
        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 620 }}>
            <thead>
              <tr>
                {["the message", "what it actually means"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "7px 24px 7px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["element 0 of tensors does not require grad", "nothing on the path to this value was tracked — you detached, or built it from raw numbers"],
                ["Trying to backward through the graph a second time", "the tape was freed after the first call; you are reusing a graph, often by accumulating a loss across steps"],
                ["CUDA out of memory (during training only)", "the stored activations, not the weights — reduce batch size or checkpoint"],
                ["a leaf Variable that requires grad is being used in an in-place operation", "you modified a value the tape still needs for its backward rule"],
              ].map((row, i) => (
                <tr key={i}>
                  {row.map((c, j) => (
                    <td key={j} style={{ padding: "7px 24px 7px 0", color: j === 0 ? CORAL : "var(--ink)", borderBottom: "1px solid var(--border)", verticalAlign: "top", lineHeight: 1.45, fontFamily: j === 0 ? "ui-monospace, monospace" : undefined, fontSize: j === 0 ? 12.5 : 13.5 }}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p>
          Every one of those is a statement about the tape. Knowing that the tape is a recording of operations plus
          their saved inputs makes them readable rather than something to search for.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>How does automatic differentiation differ from symbolic differentiation?</>,
              options: [
                "Autodiff is approximate; symbolic is exact",
                "Autodiff applies local rules to concrete recorded values; symbolic manipulates formulas",
                "They are two names for the same thing",
              ],
              answer: 1,
              explain: <>Both are exact. Symbolic differentiation needs a closed-form expression and produces
                expressions that grow explosively; autodiff records the operations that actually executed on actual
                numbers, which is why data-dependent control flow needs no special handling.</>,
            },
            {
              q: <>Why does PyTorch accumulate gradients instead of overwriting them?</>,
              options: [
                "For numerical stability",
                "Because a value used by several consumers must sum its incoming gradients — accumulation is the correct rule",
                "To let you train multiple models at once",
              ],
              answer: 1,
              explain: <>It is the multivariable chain rule: multiply along paths, add across them. The framework
                cannot know when you have finished contributing, so it accumulates and leaves clearing to you —
                hence <code>zero_grad()</code>.</>,
            },
            {
              q: <>Training runs out of GPU memory but inference on the same model is fine. Why?</>,
              options: [
                "Gradients need more precision than weights",
                "The tape stores every intermediate activation until the backward pass consumes it",
                "The optimiser keeps a copy of the dataset",
              ],
              answer: 1,
              explain: <>Backprop needs the forward activations (BP4) and pre-activations (BP2), so nothing can be
                released early. Inference discards each activation as soon as the next layer is computed. It is the
                same fact as <code>backward()</code> freeing the graph by default.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/backpropagation/gradient-checking", label: <>← Gradient checking</> }}
          next={{ href: "/learn/backpropagation/backprop-bugs", label: <>Next up · The bugs you will actually hit →</> }}
        />
      </div>
    </article>
  );
}
