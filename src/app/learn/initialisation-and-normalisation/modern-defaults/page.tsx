import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { Dumbbell } from "@/components/figures/Dumbbell";
import { INIT_SENSITIVITY } from "@/components/figures/initNorm/data";

export const metadata = {
  title: "The modern default, and when to deviate — Manifold",
  description:
    "He init + ReLU/GELU + BatchNorm or LayerNorm + residual connections is the stack that trains out of the box. It exists because the init × activation × norm interaction has a known good corner. Deviate only when a real constraint pushes you out of it.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function ModernDefaultsPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "The interaction", color: CORAL }, { label: "Tier 2 · practitioner", color: CORAL }]}
        time="about 8 minutes"
        title={<>The modern default, and when to deviate</>}
        intro={<>The last two pages explained why the three levers interact and why normalisation makes
          the system forgiving. The payoff is practical: there is a <strong>default stack</strong> that
          lands in the known-good corner of that interaction and trains out of the box. This page states
          it plainly, then covers the handful of situations where a real constraint should push you off
          it — and no others.</>}
      />

      <div className="lesson">
        <h2>The default that works out of the box</h2>
        <p>
          For an ordinary feedforward or convolutional network, reach for this combination first,
          without deliberation:
        </p>
        <ul>
          <li><strong>He (Kaiming) initialisation</strong> — the weight scale matched to a rectified
            activation, so the per-layer factor starts near 1.</li>
          <li><strong>ReLU or GELU activations</strong> — non-saturating, keeping you in the
            single-digit gradient-ratio world rather than the six-figure sigmoid world.</li>
          <li><strong>BatchNorm</strong> for convolutional networks with a large batch, or{" "}
            <strong>LayerNorm</strong> for transformers and sequence models — the third leg that resets
            the scale every layer and buys robustness to the init and learning rate.</li>
          <li><strong>Residual connections</strong> — an identity path around each block that lets the
            gradient reach the bottom untouched, making the whole stack forgiving of depth.</li>
        </ul>
        <p>
          This is not a compromise or a &ldquo;safe but mediocre&rdquo; choice. It is the corner of the
          design space where the init, the activation, and the normalisation all reinforce one another,
          and it is where the overwhelming majority of production networks live. If you have no specific
          reason to deviate, do not deviate.
        </p>

        <Callout color={CORAL} title={<>The default is a discovered good corner, not a convention</>}>
          He + ReLU/GELU + BN/LN + residuals is the default because the init × activation × norm
          interaction has a <strong>known good corner</strong> — one region where the gradient ratio
          stays near 1, the scale is re-enforced every layer, and the identity path protects depth. The
          entire value of understanding the interaction is knowing that this corner exists so you can
          start there and only leave it for cause.
        </Callout>

        <Dumbbell
          rows={INIT_SENSITIVITY.map((r) => ({ init: r.init, a: r.noBn, b: r.bn }))}
          seriesLabels={["without normalisation", "with normalisation"]}
          caption={<>Why this is the default. The right-hand ends are what &ldquo;He plus a
            normalisation layer&rdquo; actually buys: not the single best number on the page, but the
            same number from every starting point. A default is not the setting that wins a benchmark —
            it is the setting whose outcome you can predict before you run it.</>}
        />

        <h2>When to deviate — and the constraint that justifies each</h2>
        <p>
          Every deviation below is a response to a specific constraint. If you do not have the
          constraint, you do not want the deviation.
        </p>
        <p>
          <strong>SELU + LeCun init, for self-normalising nets.</strong> The SELU activation is designed
          so that, paired with LeCun initialisation, the activations converge toward zero mean and unit
          variance <em>on their own</em>, with no explicit normalisation layer. The constraint it
          answers: you want the scale-stabilising benefit of normalisation but cannot afford a norm
          layer — for example in a plain fully connected net where you would rather not pay for
          BatchNorm&rsquo;s batch statistics.
        </p>
        <p>
          <strong>Fixup, NF-Nets, T-Fixup, for norm-free deep residual nets.</strong> These are careful
          initialisation-and-residual-scaling schemes that let you train very deep residual networks{" "}
          <em>without</em> any normalisation layer. The constraint: normalisation has real costs — batch
          dependence, train/test mismatch, memory, and compute — and at scale you may want them gone.
          These methods buy back the stability that BatchNorm provided by initialising the residual
          branches to start near the identity and scaling them so the signal does not compound.
        </p>
        <p>
          <strong>RMSNorm, for large language models.</strong> RMSNorm drops the mean-centring step of
          LayerNorm and normalises only by the root-mean-square, which is cheaper and, empirically, just
          as stable for large transformers. The constraint is pure efficiency at scale: when you run
          normalisation billions of times per step, halving its cost matters.
        </p>

        <h2>The meta-point</h2>
        <p>
          Notice what every deviation has in common. Each one leaves the default corner because a{" "}
          <strong>constraint</strong> pushed it out — no batch statistics available, normalisation too
          expensive, sequence structure instead of spatial structure, compute budget at the extreme.
          None of them is chosen for its own sake, and none of them beats the default when the default
          applies. The reason to understand the init × activation × norm interaction is precisely so you
          can recognise which constraint you are under and pick the matching deviation, rather than
          cargo-culting whatever the latest paper used.
        </p>

        <Proof color={CORAL} title="why residual connections make the whole stack forgiving">
          <p>
            A residual block computes <M>{String.raw`\mathbf{h}_{i} = \mathbf{h}_{i-1} + F(\mathbf{h}_{i-1})`}</M>,
            where <M>{String.raw`F`}</M> is the block&rsquo;s transformation. Differentiate the output
            with respect to the input:
          </p>
          <MathBlock>{String.raw`\frac{\partial \mathbf{h}_{i}}{\partial \mathbf{h}_{i-1}} = I + \frac{\partial F}{\partial \mathbf{h}_{i-1}}.`}</MathBlock>
          <p>
            The Jacobian carries an <strong>identity term</strong> <M>{String.raw`I`}</M> that no init,
            activation, or normalisation choice can zero out. Backpropagating through <M>{String.raw`D`}</M>{" "}
            such blocks, the gradient at the bottom contains a path that is the product of identities —
            it reaches the first layer undiminished no matter what the <M>{String.raw`\partial F`}</M>{" "}
            terms do. This is why residual networks are so forgiving of all three choices: even if a
            block&rsquo;s init or activation is imperfect and its <M>{String.raw`\partial F`}</M> factor
            is small, the <M>{String.raw`I`}</M> keeps the gradient alive. The identity path turns the
            fragile multiplicative chain of the previous page into an additive one, which is precisely
            the property that lets networks go hundreds of layers deep.
          </p>
        </Proof>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>What is the default stack to reach for on an ordinary conv or feedforward network,
                before considering any deviation?</>,
              options: [
                "SELU + LeCun init, because it self-normalises",
                "He (Kaiming) init + ReLU/GELU + BatchNorm (conv/large batch) or LayerNorm (sequences) + residual connections",
                "Xavier init + sigmoid + no normalisation, for simplicity",
              ],
              answer: 1,
              explain: <>He + ReLU/GELU + BN or LN + residuals is the discovered good corner where init,
                activation, and normalisation reinforce one another. It is the first thing to reach for;
                deviations are for specific constraints.</>,
            },
            {
              q: <>You want the scale-stabilising benefit of normalisation but cannot afford an explicit
                normalisation layer in a plain fully connected net. Which deviation matches this
                constraint?</>,
              options: [
                "RMSNorm, because it is cheaper than LayerNorm",
                "SELU + LeCun init, a self-normalising combination whose activations converge to unit variance without a norm layer",
                "Fixup, because it removes the need for an activation function",
              ],
              answer: 1,
              explain: <>SELU paired with LeCun init is designed so the activations self-normalise toward
                zero mean and unit variance, giving the stabilising effect of a norm layer without paying
                for one. Each deviation answers a specific constraint.</>,
            },
            {
              q: <>Why do residual connections make the whole init × activation × norm stack more
                forgiving?</>,
              options: [
                "They add parameters, so the network has more capacity to fix bad choices",
                "The block Jacobian is I + ∂F, and the identity term I keeps a gradient path alive to the first layer regardless of what the ∂F factor does",
                "They replace multiplication of Jacobians with a normalisation step",
              ],
              answer: 1,
              explain: <>Differentiating h = h + F(h) gives I + ∂F. The identity term cannot be zeroed by
                any init, activation, or norm choice, so the gradient reaches the bottom undiminished
                along the identity path — turning the fragile multiplicative chain into an additive one.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/initialisation-and-normalisation/why-norm-reduces-sensitivity", label: <>← Why normalisation reduces init sensitivity</> }}
          next={{ href: "/learn/initialisation-and-normalisation/the-playbook", label: <>Next up · The init &amp; norm playbook →</> }}
        />
      </div>
    </article>
  );
}
