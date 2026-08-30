import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "The computational graph — Manifold",
  description:
    "No part of a network knows what the whole network does. Each node knows one local derivative, and that is provably enough — which is why the same algorithm differentiates anything you can write down.",
};

const CORAL = "var(--c-neural)";

// A tiny expression graph, drawn once. Literal coordinates: no hydration surface.
function GraphFigure() {
  const W = 540, H = 200;
  const node = (x: number, y: number, label: string, sub: string, key: string, emph = false) => (
    <g key={key}>
      <rect x={x - 26} y={y - 17} width={52} height={34} rx={9}
        fill="var(--surface)" stroke={emph ? CORAL : "var(--border-strong)"} strokeWidth={emph ? 1.6 : 1} />
      <text x={x} y={y - 1} fontSize={12} fill="var(--ink)" textAnchor="middle">{label}</text>
      <text x={x} y={y + 11} fontSize={8.5} fill="var(--faint)" textAnchor="middle">{sub}</text>
    </g>
  );
  const edge = (x1: number, y1: number, x2: number, y2: number, label: string, key: string) => (
    <g key={key}>
      <line x1={x1 + 26} y1={y1} x2={x2 - 26} y2={y2} stroke="var(--border-strong)" strokeWidth={1.2} />
      <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 6} fontSize={9} fill={CORAL} textAnchor="middle">{label}</text>
    </g>
  );

  return (
    <figure style={{ margin: "1.6rem 0" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}
        role="img" aria-label="Inputs a and b feed a multiply node, which feeds an add node with c, which feeds a squaring node producing the loss">
        {edge(60, 52, 190, 84, "∂/∂a = b", "e1")}
        {edge(60, 116, 190, 84, "∂/∂b = a", "e2")}
        {edge(190, 84, 320, 100, "∂/∂u = 1", "e3")}
        {edge(60, 168, 320, 100, "∂/∂c = 1", "e4")}
        {edge(320, 100, 450, 100, "∂/∂v = 2v", "e5")}
        {node(60, 52, "a", "= 3", "a")}
        {node(60, 116, "b", "= 4", "b")}
        {node(60, 168, "c", "= 2", "c")}
        {node(190, 84, "u = a·b", "= 12", "u", true)}
        {node(320, 100, "v = u+c", "= 14", "v", true)}
        {node(450, 100, "L = v²", "= 196", "L", true)}
      </svg>
      <figcaption style={{ fontSize: 12, color: "var(--faint)", marginTop: 6 }}>
        Each edge carries one local derivative. Not one of them required knowing what the graph as a whole computes.
      </figcaption>
    </figure>
  );
}

export default function ComputationalGraphPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "The problem", color: CORAL }, { label: "Tier 1 · intuition", color: CORAL }]}
        time="about 7 minutes"
        title={<>The computational graph</>}
        intro={<>The idea that makes backpropagation general rather than a trick for one architecture: stop thinking
          about the network as a formula to differentiate, and start thinking about it as a graph of small
          operations, each of which knows only its own derivative.</>}
      />

      <div className="lesson">
        <h2>Break the expression into steps</h2>
        <p>
          Take <M>{String.raw`\mathcal{L} = (ab + c)^2`}</M> with{" "}
          <M>{String.raw`a=3,\ b=4,\ c=2`}</M>. You could differentiate that by hand. Instead, write it as a
          sequence of operations, each doing exactly one thing.
        </p>

        <GraphFigure />

        <p>
          Now look at what each node is required to know. The multiply node knows that{" "}
          <M>{String.raw`\partial u/\partial a = b`}</M>. That is <em>all</em> it knows. It has no idea it is
          feeding an addition, no idea a square is coming, and no idea what the loss even is. The same is true of
          every node.
        </p>

        <Callout color={CORAL} title={<>The claim that makes the algorithm work</>}>
          <strong>Purely local knowledge is sufficient.</strong> If every node can answer one question — &ldquo;given
          how much my <em>output</em> matters, how much does each of my <em>inputs</em> matter?&rdquo; — then
          passing that message backwards from the loss computes every derivative in the graph exactly. Nothing
          anywhere needs a global view.
        </Callout>

        <h2>The message that travels backwards</h2>
        <p>
          Give every node a number: <M>{String.raw`\bar{v} = \partial\mathcal{L}/\partial v`}</M>, how much the loss
          responds to that node&rsquo;s value. Seed it at the end, where{" "}
          <M>{String.raw`\partial\mathcal{L}/\partial\mathcal{L} = 1`}</M>, and walk backwards. Each node takes the
          number handed to it, multiplies by its local derivative, and passes it on.
        </p>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 520 }}>
            <thead>
              <tr>
                {["node", "value", "local derivative", "gradient"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "7px 22px 7px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["L = v²", "196", "—", "1"],
                ["v = u + c", "14", "∂L/∂v = 2v = 28", "28"],
                ["u = a · b", "12", "∂v/∂u = 1", "28 × 1 = 28"],
                ["c", "2", "∂v/∂c = 1", "28 × 1 = 28"],
                ["a", "3", "∂u/∂a = b = 4", "28 × 4 = 112"],
                ["b", "4", "∂u/∂b = a = 3", "28 × 3 = 84"],
              ].map((row, i) => (
                <tr key={i}>
                  {row.map((c, j) => (
                    <td key={j} style={{ padding: "7px 22px 7px 0", color: j === 3 ? CORAL : "var(--ink)", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p>
          Check one by hand: <M>{String.raw`\mathcal{L} = (ab+c)^2`}</M>, so{" "}
          <M>{String.raw`\partial\mathcal{L}/\partial a = 2(ab+c)\cdot b = 2 \times 14 \times 4 = 112`}</M>. The
          graph agrees, and it got there without anyone writing that formula down.
        </p>

        <h2>Two rules cover everything</h2>
        <p>
          Every node in every network you will ever build follows one of two patterns, and both fall out of the
          previous page.
        </p>
        <ul>
          <li><strong>A node with one consumer</strong> receives that consumer&rsquo;s gradient times the local
            derivative. Multiply along the path.</li>
          <li><strong>A node with several consumers</strong> receives the <em>sum</em> of those contributions. Add
            across paths. This is why a node whose value is reused — the classic case being an input feeding two
            branches — accumulates rather than overwrites.</li>
        </ul>

        <MathBlock>{String.raw`\bar{v} \;=\; \sum_{j \,\in\, \text{consumers}(v)} \bar{z_j} \cdot \frac{\partial z_j}{\partial v}`}</MathBlock>

        <p>
          That single line is the backward pass. Everything remaining in this chapter is applying it to the specific
          nodes a neural network happens to contain.
        </p>

        <h2>Why this framing, and not just calculus</h2>
        <p>
          You could have differentiated <M>{String.raw`(ab+c)^2`}</M> in your head, so the machinery looks like
          overkill. Its value shows up at scale, in three ways:
        </p>
        <ul>
          <li><strong>It is mechanical.</strong> No cleverness is required and none is possible, which means a
            program can do it — for an expression of any size, including one with control flow you did not write
            down as a formula.</li>
          <li><strong>It generalises for free.</strong> Add a new kind of layer and you supply its local derivative;
            the algorithm around it is unchanged. This is why the same code differentiates convolutions, attention
            and things not yet invented.</li>
          <li><strong>It reuses work.</strong> <M>{String.raw`\bar{v} = 28`}</M> was computed once and used by three
            different nodes. On a real network that reuse is the entire speedup — the subject of{" "}
            <em>why it is cheap</em>, four pages on.</li>
        </ul>

        <CodeBlock
          language="Python"
          fromScratch={`# every node implements the same two methods, and nothing else
class Multiply:
    def forward(self, a, b):
        self.a, self.b = a, b
        return a * b

    def backward(self, grad_out):        # "how much does my output matter?"
        return grad_out * self.b, grad_out * self.a    # "then this much do my inputs"`}
        />

        <p>
          That interface — <code>forward</code> stores what it needs,{" "}
          <code>backward</code> turns an output gradient into input gradients — is, with more bookkeeping, the
          interface every deep-learning framework is built on.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>What does a node need to know to participate in backpropagation?</>,
              options: [
                "The whole network's structure",
                "Its own local derivative, and the gradient handed to it from downstream",
                "The loss function being used",
              ],
              answer: 1,
              explain: <>Purely local information. The multiply node never learns that a square is coming or what
                the loss is — it multiplies the incoming gradient by its own local derivative and passes it on. That
                locality is what lets one implementation differentiate architectures nobody has invented yet.</>,
            },
            {
              q: <>A node&rsquo;s output is used by three later nodes. What is its gradient?</>,
              options: [
                "The product of the three contributions",
                "The sum of the three contributions",
                "The largest of the three contributions",
              ],
              answer: 1,
              explain: <>Multiply along a path, add across paths. This is why frameworks <em>accumulate</em>{" "}
                gradients into a buffer rather than assigning them — and why forgetting to zero that buffer between
                steps is such a common bug.</>,
            },
            {
              q: <>In the worked graph, <M>{String.raw`\bar{v} = 28`}</M> was used by three downstream
                computations. Why does that matter?</>,
              options: [
                "It makes the arithmetic easier to check by hand",
                "That reuse is where the efficiency comes from — each intermediate gradient is computed once and shared",
                "It reduces floating-point error",
              ],
              answer: 1,
              explain: <>Finite differences recomputes everything from scratch for every parameter. Backprop
                computes each intermediate gradient once and shares it among all the parameters that need it, which
                is exactly why its cost does not grow with the parameter count.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/backpropagation/the-chain-rule", label: <>← The chain rule, as influence</> }}
          next={{ href: "/learn/backpropagation/the-backward-pass", label: <>Next up · The backward pass →</> }}
        />
      </div>
    </article>
  );
}
