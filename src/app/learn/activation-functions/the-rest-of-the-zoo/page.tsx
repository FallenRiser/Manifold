import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "The rest of the zoo — Manifold",
  description:
    "Softplus, maxout, GLU and SwiGLU, hard variants, and the ones that are genuinely just Swish again. One page, so you can recognise a name without believing it matters.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function ZooPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "The smooth moderns", color: CORAL }, { label: "Tier 2 · reference", color: CORAL }]}
        time="about 7 minutes"
        title={<>The rest of the zoo</>}
        intro={<>There are hundreds of published activations. Almost all of them are one of four ideas, and one of
          those four is genuinely important and hiding in plain sight inside every recent large language model.</>}
      />

      <div className="lesson">
        <h2>Softplus — the smooth ReLU that lost</h2>

        <MathBlock>{String.raw`\text{softplus}(z) = \log(1 + e^{z}) \qquad\qquad \text{softplus}'(z) = \sigma(z)`}</MathBlock>

        <p>
          Predates all the smooth moderns and looks like it should have won: a smooth ReLU whose derivative is
          exactly the sigmoid. It lost for two reasons visible in that formula.
        </p>
        <p>
          Its derivative <em>is</em> sigmoid, so it inherits sigmoid&rsquo;s saturation on the left — measured at
          21.3% of the input range. And its output is never exactly zero, so it gives up ReLU&rsquo;s sparsity
          without gaining anything measurable in return. It also costs about the same as the far better GELU. Where
          it does survive is as a way to force a parameter positive — predicting a variance or a rate, where{" "}
          <M>{String.raw`\text{softplus}`}</M> is a smooth alternative to <M>{String.raw`\exp`}</M> that does not
          overflow.
        </p>

        <h2>Maxout — a different shape of idea</h2>

        <MathBlock>{String.raw`\text{maxout}(x) = \max_{k=1..K}\;\bigl(w_k^\top x + b_k\bigr)`}</MathBlock>

        <p>
          Instead of a fixed non-linearity, learn <M>{String.raw`K`}</M> linear pieces and take the largest. This
          <em>learns</em> the activation: ReLU is the special case <M>{String.raw`K=2`}</M> with one piece pinned to
          zero, and with enough pieces it approximates any convex function.
        </p>
        <p>
          The reason you do not see it: it multiplies the parameter count by <M>{String.raw`K`}</M>. Doubling every
          weight matrix to learn a shape you could have picked is a poor trade, and the measurements on this track
          suggest the shape was never worth much. Maxout is worth knowing as the honest answer to &ldquo;why not just
          learn the activation?&rdquo; — you can, and it is not where the capacity is best spent.
        </p>

        <h2>The gated family — the one that matters</h2>
        <p>
          This is not a pointwise activation at all, and it is what modern transformer feedforward blocks actually
          use. Split the layer&rsquo;s output in half and let one half gate the other:
        </p>

        <MathBlock>{String.raw`\text{GLU}(x) = (xW + b) \odot \sigma(xV + c) \qquad\qquad \text{SwiGLU}(x) = (xW + b) \odot \text{Swish}(xV + c)`}</MathBlock>

        <p>
          The difference from Swish is worth being precise about. Swish is{" "}
          <M>{String.raw`x \cdot \sigma(\beta x)`}</M> — a unit gating <em>itself</em>. A GLU has{" "}
          <strong>two separate projections</strong>, so the gate is computed from a different learned direction than
          the value being gated. The unit can learn &ldquo;pass this feature through when <em>that</em> other
          feature is present&rdquo;, which a pointwise function cannot express at all.
        </p>

        <Callout color={CORAL} title={<>Where this actually shows up</>}>
          <strong>SwiGLU is in LLaMA, PaLM, and most recent open models.</strong> If you have wondered why their
          feedforward blocks have three weight matrices instead of two, this is why: one for the value, one for the
          gate, one to project back.
          <br /><br />
          It also costs 50% more parameters in that block for the same hidden width, so implementations shrink the
          width to compensate — a detail that matters if you are reading the model code and wondering why the
          dimensions do not look like the textbook.
          <br /><br />
          The honest note applies here too: the paper introducing SwiGLU to transformers reports the gains and
          concludes, memorably, that it offers no explanation for why they occur.
        </Callout>

        <h2>Hard variants — same shape, no exponential</h2>

        <MathBlock>{String.raw`\text{hard-swish}(x) = x\cdot\frac{\mathrm{clip}(x+3,\,0,\,6)}{6}`}</MathBlock>

        <p>
          A piecewise-linear approximation to Swish, built from a clip and a multiply. It exists because Swish costs
          about 22× ReLU and mobile inference cannot afford that. There is a hard-sigmoid, a hard-tanh and a
          hard-GELU on the same principle. Nothing conceptual here, and it is a good demonstration of the priority
          order in deployment: <strong>the shape is what matters, and the exact function realising it is
          negotiable.</strong>
        </p>

        <h2>The ones that are Swish again</h2>
        <p>
          Mish is <M>{String.raw`x\tanh(\text{softplus}(x))`}</M>, and it is measured on this track at a peak slope
          of 1.088 against Swish&rsquo;s 1.100, saturating on 11.3% of the range against 11.4%. The two are
          essentially the same curve. There are dozens more of this kind.
        </p>
        <p>
          A useful filter when you meet a new one: <strong>look at the derivative and the two numbers this track has
          been using</strong> — peak slope, and fraction of the range switched off. If those match a function you
          already know, the new name is a new name. If they differ, you have learned something specific about what
          it will do to your gradients.
        </p>

        <Callout color={CORAL} title={<>Why the zoo is mostly a museum</>}>
          Publishing an activation is cheap: propose a curve, run it on a few benchmarks, report the wins. With
          seed-to-seed spreads of the size measured on this track — up to <strong>0.11</strong> in test accuracy on
          a single problem — a small number of runs can show almost anything.
          <br /><br />
          The functions that survived did so by being adopted at scale where the differences either replicate or
          vanish. That filter is far more informative than any individual paper, and it has left a very short list:
          ReLU, GELU, SiLU/Swish, SwiGLU in transformers, tanh in recurrent state, and the leaky family when you
          have seen units die.
        </Callout>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>What is the essential difference between Swish and a GLU?</>,
              options: [
                "Swish is smooth and GLU is not",
                "Swish gates a unit by a function of its own input; a GLU computes the gate from a separate learned projection, so it can gate one feature by another",
                "GLU is the same function with a different constant",
              ],
              answer: 1,
              explain: <>Self-gating versus cross-gating. The second projection is what lets the block express
                conditional interactions between features, which no pointwise activation can, and it is why the
                feedforward block gains a third weight matrix.</>,
            },
            {
              q: <>Softplus is a smooth ReLU whose derivative is exactly the sigmoid. Why did it not win?</>,
              options: [
                "It is too expensive to compute",
                "Because its derivative being sigmoid means it inherits sigmoid's left saturation, and its never-zero output gives up ReLU's sparsity",
                "Because it is not differentiable at the origin",
              ],
              answer: 1,
              explain: <>It saturates on 21.3% of the measured range and produces no exact zeros. It costs about
                what GELU costs, so it is dominated on both sides.</>,
            },
            {
              q: <>You encounter a newly published activation. What is the fastest useful check?</>,
              options: [
                "Compare its curve to ReLU's",
                "Read its peak slope and the fraction of the input range on which its derivative is below 0.01, and see whether they match a function you already know",
                "Check how many citations the paper has",
              ],
              answer: 1,
              explain: <>Those two numbers characterise what it does to gradients, which is what the choice is
                actually about. Mish and Swish differ by 0.011 in peak slope and 0.1% in saturated range — the curves
                are the same curve.</>,
            },
          ]}
        />

        <p style={{ fontSize: 13.5, color: "var(--muted)" }}>
          The output-layer activations — softmax in particular — belong to a different question entirely, and get{" "}
          <Link href="/learn/activation-functions/the-output-layer" style={link}>their own page</Link> two ahead.
        </p>

        <PrevNext
          prev={{ href: "/learn/activation-functions/what-smoothness-buys", label: <>← What smoothness actually buys</> }}
          next={{ href: "/learn/activation-functions/the-bakeoff", label: <>Next up · The bakeoff →</> }}
        />
      </div>
    </article>
  );
}
