import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "The backprop playbook — Manifold",
  description:
    "A diagnostic procedure derived from the whole track: what to measure when training misbehaves, in what order, and what each measurement rules out.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function PlaybookPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "When gradients misbehave", color: CORAL }, { label: "Tier 2 · practice", color: CORAL }]}
        time="about 7 minutes"
        title={<>The backprop playbook</>}
        intro={<>The track compressed into a procedure. It is last on purpose: a checklist you can derive is a tool,
          and a checklist you cannot is something you abandon the first time your situation is not on it.</>}
      />

      <div className="lesson">
        <h2>The one habit</h2>
        <p>
          If you take a single thing from this track, take this:{" "}
          <strong>when training misbehaves, print the per-layer gradient norms.</strong>
        </p>
        <div style={{ background: "var(--canvas)", border: "1px solid var(--border-strong)", borderRadius: 10, padding: "12px 16px", margin: "1.2rem 0", fontFamily: "ui-monospace, monospace", fontSize: 13, color: "var(--ink)", overflowX: "auto" }}>
          for name, p in model.named_parameters():<br />
          &nbsp;&nbsp;&nbsp;&nbsp;if p.grad is not None:<br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;print(f&quot;&#123;name:&lt;40&#125; &#123;p.grad.norm().item():.3e&#125;&quot;)
        </div>
        <p>
          Three lines. A loss curve is a one-dimensional summary of a model with millions of parameters, and four
          completely different failures produce the same flat line. The gradient norms separate them immediately.
        </p>

        <h2>What the numbers mean</h2>
        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 640 }}>
            <thead>
              <tr>
                {["what you see", "diagnosis", "what to do"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "7px 20px 7px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["shrink by orders of magnitude toward the input", "vanishing gradient", "ReLU-family activation, He init, normalisation, residuals"],
                ["grow toward the input; NaN after a spike", "exploding gradient", "clip the norm, lower the init scale and the learning rate"],
                ["exactly zero at one layer", "dead units — the network is severed", "restart at a lower rate; leaky activation"],
                ["small but non-zero everywhere, loss flat", "plateau or saddle", "momentum, Adam, or simply wait"],
                ["healthy, but the loss will not fall", "the learning rate, or a gradient bug", "sweep ×10; then gradient-check"],
                ["healthy and the loss falls, val rises", "overfitting — nothing here is wrong", "regularise; this is not a gradient problem"],
              ].map((row, i) => (
                <tr key={i}>
                  {row.map((c, j) => (
                    <td key={j} style={{ padding: "7px 20px 7px 0", color: j === 2 ? CORAL : j === 1 ? "var(--ink)" : "var(--muted)", borderBottom: "1px solid var(--border)", verticalAlign: "top", lineHeight: 1.45, fontWeight: j === 1 ? 500 : 400 }}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2>The order to work in</h2>
        <ol>
          <li><strong>Gradient-check on a tiny network</strong>, if you wrote the backward pass yourself. Ten
            seconds, and it separates &ldquo;my gradient is wrong&rdquo; from everything else. Below{" "}
            <M>{String.raw`10^{-7}`}</M> you are correct; above <M>{String.raw`10^{-3}`}</M> you have a bug.</li>
          <li><strong>Overfit ten examples.</strong> If the loss will not approach zero on ten rows, the fault is in
            the plumbing, not the data or the architecture.</li>
          <li><strong>Print the gradient norms.</strong> The table above.</li>
          <li><strong>Sweep the learning rate by powers of ten.</strong> The healthy band is wide — three of seven
            settings worked across two orders of magnitude — so this is six short runs, not a search.</li>
          <li><strong>Only now</strong> change the architecture. Everything before this point is cheaper and rules
            more out.</li>
        </ol>

        <Callout color={CORAL} title={<>The principle underneath the ordering</>}>
          Every step is chosen to <strong>partition</strong> the possibilities rather than sample them. A
          learning-rate sweep run on buggy code produces six flat curves and a confident wrong conclusion. The
          gradient check comes first not because it is more likely to fire, but because everything downstream is
          uninterpretable until it has passed. This is the same logic as the{" "}
          <Link href="/learn/data-workflow/error-analysis" style={link}>error-analysis</Link> discipline in the data
          workflow pillar: find out where the problem is before fixing anything.
        </Callout>

        <h2>The track in six sentences</h2>
        <ol>
          <li><strong>Backpropagation is the chain rule, organised so nothing is computed twice.</strong> The
            mathematics is school calculus; the contribution is the bookkeeping.</li>
          <li><strong>Its value is entirely cost.</strong> Finite differences needs <M>{String.raw`O(P)`}</M>{" "}
            forward passes and backprop needs about three, which measured 1,200× on a network of 1,185
            parameters and grows without limit from there.</li>
          <li><strong>Reverse mode is right because the problem is lopsided</strong> — many parameters, one loss.
            Flip that shape and forward mode wins instead.</li>
          <li><strong>Four equations cover everything.</strong> Only BP2 recurses;{" "}
            <M>{String.raw`\partial\mathcal{L}/\partial W_{ij} = a_i\delta_j`}</M> explains dead units, vanishing
            gradients and unscaled inputs in one product.</li>
          <li><strong>The gradient gives a direction, never a distance.</strong> The learning rate is the most
            consequential number in the model, and its two failure modes — an oscillating run and a severed network
            — need different responses.</li>
          <li><strong>Vanishing and exploding gradients are the same product</strong> with factors below or above
            one. Twelve sigmoid layers measured a 29-million-fold ratio, and changing only the initialisation moved
            it to 65.</li>
        </ol>

        <h2>What comes next</h2>
        <p>
          This track diagnosed two pathologies and fixed neither, which was deliberate — the fixes each need their
          own treatment, and both are next in this family.
        </p>
        <p>
          <strong>Activation functions</strong> takes the <M>{String.raw`g'`}</M> factor seriously: the whole zoo as
          a space of properties rather than a list of names, why the smooth moderns exist, and how to choose — or
          design — from requirements. <strong>Initialisation &amp; normalisation</strong> takes the{" "}
          <M>{String.raw`W`}</M> factor: why Xavier and He are derived rather than guessed, and what normalisation
          is really stabilising. Between them they turn the number in the gradient-flow lab from a diagnosis into a
          dial.
        </p>

        <Quiz
          accent={CORAL}
          title="Final checkpoint"
          questions={[
            {
              q: <>Why is printing per-layer gradient norms more informative than watching the loss?</>,
              options: [
                "It is faster to compute",
                "The loss is one number for the whole model; at least four distinct failures produce the same flat curve",
                "Gradient norms are more accurate than loss values",
              ],
              answer: 1,
              explain: <>Vanishing gradients, dead units, a too-small learning rate and a plateau all look like a
                flat loss. Per-layer norms distinguish them in one backward pass — exactly zero versus small versus
                healthy.</>,
            },
            {
              q: <>Why does the gradient check come before the learning-rate sweep?</>,
              options: [
                "It is more likely to find a problem",
                "Because a sweep run on a wrong gradient gives six uninterpretable curves and a confident wrong conclusion",
                "Because learning rate matters less than correctness",
              ],
              answer: 1,
              explain: <>The ordering is about what each step rules out, not about likelihood. Until the gradient is
                known correct, every downstream experiment is measuring something other than what you think.</>,
            },
            {
              q: <>Gradients shrink by orders of magnitude toward the input and the model still trains to a
                reasonable score. What is happening?</>,
              options: [
                "The measurement must be wrong, since it is training",
                "The later layers are learning on top of early layers frozen at their random initialisation",
                "The model has converged",
              ],
              answer: 1,
              explain: <>This is the confusing part of vanishing gradients and the reason it went undiagnosed for
                two decades. The last layers do fine using whatever random features the frozen early layers produce,
                so the loss falls — while the depth you paid for does nothing.</>,
            },
            {
              q: <>Finite differences needs <M>{String.raw`O(P)`}</M> passes and backprop needs about three. What
                is backprop&rsquo;s cost as the model grows?</>,
              options: [
                "It grows linearly with the parameter count",
                "It stays at roughly three forward passes, whatever the parameter count",
                "It grows with the square root of the parameter count",
              ],
              answer: 1,
              explain: <>Forward, plus a backward pass costing about twice a forward one. Each pass gets more
                expensive as the model grows, but the <em>number</em> of passes is constant — which is why the
                measured ratio climbed from 23× to 1,219× as the toy network grew.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/backpropagation/why-depth-was-hard", label: <>← Why depth was hard for twenty years</> }}
          next={{ href: "/learn/backpropagation", label: <>Back to the track index →</> }}
        />
      </div>
    </article>
  );
}
