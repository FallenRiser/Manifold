import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { PredictPrompt } from "@/components/PredictPrompt";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";

export const metadata = {
  title: "The memory bill — Manifold",
  description:
    "Backpropagation buys its speed by keeping the entire forward pass in memory. That is why you run out of GPU memory, why the batch size is the knob that fixes it, and what checkpointing trades to get it back.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

const th: React.CSSProperties = {
  textAlign: "left", padding: "7px 18px 7px 0", color: "var(--muted)", fontWeight: 500,
  borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap",
};
const td: React.CSSProperties = {
  padding: "7px 18px 7px 0", color: "var(--ink)", borderBottom: "1px solid var(--border)",
  fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap",
};

// Section 9 of scripts/backprop_cases.py, measured bytes, float32.
const MEM = [
  { b: 32, l: 12, w: 256, p: 3.16, a: 0.82 },
  { b: 256, l: 12, w: 256, p: 3.16, a: 6.56 },
  { b: 1024, l: 12, w: 256, p: 3.16, a: 26.22 },
  { b: 256, l: 12, w: 1024, p: 50.38, a: 26.22 },
  { b: 256, l: 48, w: 256, p: 12.63, a: 25.43 },
];

const CKPT = [
  { k: 1, mb: 25.4, save: "1.0×", extra: "0%" },
  { k: 2, mb: 12.7, save: "2.0×", extra: "18%" },
  { k: 4, mb: 6.6, save: "3.8×", extra: "27%" },
  { k: 7, mb: 4.1, save: "6.2×", extra: "31%" },
  { k: 12, mb: 2.5, save: "10.0×", extra: "34%" },
  { k: 24, mb: 1.5, save: "16.7×", extra: "35%" },
];

export default function MemoryBillPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "The algorithm", color: CORAL }, { label: "Tier 2 · mechanics", color: CORAL }]}
        time="about 8 minutes"
        title={<>The memory bill</>}
        intro={<>The previous page celebrated backpropagation for costing one backward sweep instead of one forward
          pass per parameter. That accounting is correct and it is only half the ledger. The saving is bought with
          memory, and memory — not time — is what you will actually run out of.</>}
      />

      <div className="lesson">
        <h2>What has to be kept</h2>
        <p>
          Look again at the weight-gradient equation from the four equations. To compute the gradient for layer{" "}
          <M>{String.raw`\ell`}</M>, you need the delta arriving from above <em>and</em> the activation that layer
          produced on the way forward:
        </p>

        <MathBlock>{String.raw`\frac{\partial \mathcal{L}}{\partial W^{(\ell)}} \;=\; \bigl(a^{(\ell-1)}\bigr)^{\!\top}\,\delta^{(\ell)}`}</MathBlock>

        <p>
          That <M>{String.raw`a^{(\ell-1)}`}</M> was computed at the start of the step and is not needed again until
          the backward pass reaches it — which is last for the earliest layer. So{" "}
          <strong>every activation in the network must survive from the forward pass until the backward pass
          arrives</strong>. This is exactly what &ldquo;the autograd graph&rdquo; is: not a clever data structure,
          a list of tensors nobody is allowed to free yet.
        </p>

        <PredictPrompt
          accent={CORAL}
          prompt={<>A 12-layer network with 256 units per layer. Which uses more memory during training — the
            parameters, or the stored activations?</>}
          options={[
            "The parameters — there are millions of them",
            "The activations",
            "It depends on the batch size",
          ]}
          nudge="Locked in. The measured table is directly below."
        />

        <h2>Measured</h2>
        <p>
          Bytes actually held during one forward-and-backward, in float32:
        </p>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 500 }}>
            <thead>
              <tr>
                <th style={th}>batch</th>
                <th style={th}>depth</th>
                <th style={th}>width</th>
                <th style={th}>parameters</th>
                <th style={th}>activations</th>
                <th style={th}>ratio</th>
              </tr>
            </thead>
            <tbody>
              {MEM.map((r, i) => (
                <tr key={i}>
                  <td style={{ ...td, fontWeight: 500 }}>{r.b}</td>
                  <td style={td}>{r.l}</td>
                  <td style={td}>{r.w}</td>
                  <td style={td}>{r.p.toFixed(2)} MB</td>
                  <td style={td}>{r.a.toFixed(2)} MB</td>
                  <td style={{ ...td, color: r.a / r.p > 2 ? "var(--bad)" : "var(--muted)" }}>
                    {(r.a / r.p).toFixed(1)}×
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p>
          The answer to the prediction is &ldquo;it depends on the batch size&rdquo;, and the first three rows are
          the reason. <strong>The parameter memory does not move — 3.16 MB at batch 32, 256 and 1024.</strong> The
          activation memory is exactly linear in the batch: 0.82, 6.56, 26.22. At batch 32 the activations are a
          third of the parameters; at batch 1024 they are eight times larger.
        </p>

        <Callout color={CORAL} title={<>The most useful consequence on this page</>}>
          <strong>You cannot fix an out-of-memory error by lowering the learning rate, and you can almost always fix
          it by halving the batch.</strong> One of those quantities appears in the memory bill and the other does
          not.
          <br /><br />
          The same table explains why the fix has a cost: halving the batch halves the memory and doubles the
          gradient noise, which is the trade the{" "}
          <Link href="/learn/backpropagation/batch-size-and-noise" style={link}>batch-size page</Link> is about.
          Gradient accumulation exists precisely to break that link — run four small batches, sum their gradients,
          update once, and you get a large batch&rsquo;s gradient at a small batch&rsquo;s memory.
        </Callout>

        <h2>Depth and width pull in different directions</h2>
        <p>
          Rows 4 and 5 are the same batch and the same activation budget, spent differently.
        </p>
        <ul>
          <li><strong>Four times the width</strong> (row 4): parameters go from 3.16 MB to 50.38 MB — a factor of 16
            — while activations only quadruple. Parameters scale as <M>{String.raw`W^2`}</M> per layer, activations
            as <M>{String.raw`W`}</M>.</li>
          <li><strong>Four times the depth</strong> (row 5): both scale linearly, so both quadruple, and the ratio
            is unchanged.</li>
        </ul>
        <p>
          So a wide shallow network is parameter-heavy and a deep narrow one is activation-heavy. That is worth
          knowing before you decide how to spend a fixed budget — a question{" "}
          <strong>Architecture design</strong> takes up properly.
        </p>

        <h2>Buying the memory back</h2>
        <p>
          You do not have to store every activation. Keep every <M>{String.raw`k`}</M>-th one, throw away the rest,
          and when the backward pass needs a discarded activation, <em>recompute</em> it from the nearest kept one.
          That is <strong>gradient checkpointing</strong>, and the trade is measured on a 48-layer network:
        </p>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 460 }}>
            <thead>
              <tr>
                <th style={th}>keep every k-th</th>
                <th style={th}>stored</th>
                <th style={th}>memory saved</th>
                <th style={th}>extra time per step</th>
              </tr>
            </thead>
            <tbody>
              {CKPT.map((r) => (
                <tr key={r.k}>
                  <td style={{ ...td, fontWeight: 500 }}>{r.k}</td>
                  <td style={td}>{r.mb.toFixed(1)} MB</td>
                  <td style={{ ...td, color: r.k === 7 ? CORAL : "var(--ink)" }}>{r.save}</td>
                  <td style={{ ...td, color: "var(--muted)" }}>{r.extra}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p>
          The shape of that table is the whole idea. <strong>Memory falls like{" "}
          <M>{String.raw`1/k`}</M>, and the extra compute is capped</strong> — at 18% for k = 2 and never above
          about 35%, however large <M>{String.raw`k`}</M> gets. It is capped because the recomputation is at most
          one extra forward pass over the network, and a forward pass is only 37% of a training step. You can buy a
          16.7-fold memory reduction for roughly a third more time.
        </p>

        <CodeOutput>{`  timed on the 48-layer net: one training step 119.6 ms, of which the
  forward pass alone is 43.8 ms (37% of the step).`}</CodeOutput>

        <p>
          The classical choice is <M>{String.raw`k = \sqrt{L}`}</M>, which here is{" "}
          <M>{String.raw`\sqrt{48} \approx 7`}</M> — the highlighted row, giving{" "}
          <M>{String.raw`O(\sqrt{L})`}</M> memory for one extra forward pass. It is one line to switch on:
        </p>

        <CodeBlock
          language="python"
          fromScratch={`import torch.utils.checkpoint as cp

# Instead of: h = block(h)
h = cp.checkpoint(block, h, use_reentrant=False)

# The block's internal activations are discarded and recomputed during the
# backward pass. Everything else -- the gradients, the update, the result --
# is bitwise identical. You are only trading time for space.`}
        />

        <Proof color={CORAL} title="why the extra compute is bounded by one forward pass">
          <p>
            Let the network have <M>{String.raw`L`}</M> layers, and keep the activation at every{" "}
            <M>{String.raw`k`}</M>-th one, so there are <M>{String.raw`L/k`}</M> checkpoints dividing the network
            into segments of length <M>{String.raw`k`}</M>.
          </p>
          <p>
            The backward pass proceeds segment by segment from the end. To handle one segment it recomputes that
            segment&rsquo;s forward pass from its left-hand checkpoint — <M>{String.raw`k-1`}</M> layers of work —
            and then runs the backward pass through it. Every segment is recomputed exactly once, so the total
            recomputation is:
          </p>
          <MathBlock>{String.raw`\underbrace{\frac{L}{k}}_{\text{segments}} \times \underbrace{(k-1)}_{\text{layers each}} \;=\; L\left(1 - \frac{1}{k}\right) \;<\; L`}</MathBlock>
          <p>
            Strictly fewer than <M>{String.raw`L`}</M> layer-evaluations: <strong>one extra forward pass, at
            most</strong>, no matter how aggressive <M>{String.raw`k`}</M> is. Meanwhile the stored activations fall
            from <M>{String.raw`L`}</M> to <M>{String.raw`L/k`}</M>.
          </p>
          <p>
            Minimising total memory over <M>{String.raw`k`}</M> — the <M>{String.raw`L/k`}</M> checkpoints plus the{" "}
            <M>{String.raw`k`}</M> activations live inside the segment currently being recomputed — gives{" "}
            <M>{String.raw`k = \sqrt{L}`}</M> and a memory cost of{" "}
            <M>{String.raw`O(\sqrt{L})`}</M> rather than <M>{String.raw`O(L)`}</M>. That is the row highlighted
            above, and it is why 48 layers can be trained in the activation memory of about seven.
          </p>
        </Proof>

        <Callout color={CORAL} title={<>The complete ledger for backpropagation</>}>
          <strong>Time:</strong> one backward sweep, about 2× a forward pass, independent of the parameter count —
          roughly 1,200× faster than finite differences on the network two pages back.
          <br /><br />
          <strong>Space:</strong> every activation retained, so memory is{" "}
          <M>{String.raw`O(\text{batch} \times \text{depth} \times \text{width})`}</M> and scales with the batch
          size that time does not care about.
          <br /><br />
          Dynamic programming always looks like this: it converts repeated work into stored results. The reason
          &ldquo;why it is cheap&rdquo; needed a sequel is that <strong>the storage is the payment</strong>, and on
          modern hardware it is the payment that binds.
        </Callout>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>Why must a training step hold every activation in memory at once?</>,
              options: [
                "For numerical stability",
                "Because the weight gradient for layer ℓ needs that layer's forward activation, which is not used until the backward pass reaches it",
                "Because the optimiser averages activations over the step",
              ],
              answer: 1,
              explain: <>The gradient is{" "}
                <M>{String.raw`(a^{(\ell-1)})^\top\delta^{(\ell)}`}</M>, so the forward activation has to survive
                until the delta arrives. The earliest layer's activation is the last one used and lives the whole
                step.</>,
            },
            {
              q: <>Your run fails with an out-of-memory error. Which change is most likely to fix it?</>,
              options: [
                "Lowering the learning rate",
                "Halving the batch size",
                "Using a simpler activation function",
              ],
              answer: 1,
              explain: <>Activation memory is linear in the batch — 0.82 MB at batch 32 against 26.22 MB at batch
                1024 for the same network. The learning rate does not appear in the memory bill at all. The cost of
                the fix is more gradient noise, which gradient accumulation can recover.</>,
            },
            {
              q: <>Gradient checkpointing with k = 24 saves 16.7× memory for 35% more time. Why does the time cost
                not keep climbing with k?</>,
              options: [
                "Because recomputation is done in parallel",
                "Because each segment is recomputed exactly once, so the total extra work is at most one forward pass regardless of k",
                "Because larger k means fewer layers to recompute",
              ],
              answer: 1,
              explain: <>The total recomputation is <M>{String.raw`L(1 - 1/k)`}</M> layer-evaluations, which
                approaches but never exceeds one full forward pass — and a forward pass is only 37% of a training
                step.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/backpropagation/why-it-is-cheap", label: <>← Why it is cheap</> }}
          next={{ href: "/learn/backpropagation/writing-it-from-scratch", label: <>Next up · Writing it from scratch →</> }}
        />
      </div>
    </article>
  );
}
