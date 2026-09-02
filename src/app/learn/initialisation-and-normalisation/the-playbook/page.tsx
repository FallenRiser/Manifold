import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "The init & norm playbook — Manifold",
  description:
    "The closing checklist: choose a non-saturating activation, match the init, never zero-init weights, add normalisation matched to the regime, use running stats at test, and reach for Fixup-style init only for very deep norm-free residual nets.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function ThePlaybookPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "The interaction", color: CORAL }, { label: "Tier 2 · practitioner", color: CORAL }]}
        time="about 7 minutes"
        title={<>The init &amp; norm playbook</>}
        intro={<>Everything in this track collapses into one ordered decision list — and you have{" "}
          <strong>earned</strong> every item on it, because each was measured, not asserted. This is the
          page to keep open when you build a network. Work down it in order; the order is causal, and
          each step cites the page in this track that justified it.</>}
      />

      <div className="lesson">
        <h2>The ordered checklist</h2>
        <ol>
          <li>
            <strong>Choose a non-saturating activation first.</strong> ReLU, GELU, or tanh — never
            sigmoid in a deep stack. This is the first-order decision: it is the difference between the
            single-digit gradient ratios (tanh 6.80, ReLU 1.62) and the six-figure catastrophe of
            sigmoid (455,145). See <Link href="/learn/initialisation-and-normalisation/the-interaction" style={link}>Init × activation × normalisation</Link>.
          </li>
          <li>
            <strong>Match the initialisation to the activation.</strong> He (Kaiming) for ReLU/GELU,
            Xavier (Glorot) for tanh. This is the second-order correction that pulls the gradient ratio
            the rest of the way toward 1. See{" "}
            <Link href="/learn/initialisation-and-normalisation/he" style={link}>He / Kaiming</Link> and{" "}
            <Link href="/learn/initialisation-and-normalisation/xavier" style={link}>Xavier / Glorot</Link>.
          </li>
          <li>
            <strong>Never zero-init the weights.</strong> Identical weights give identical gradients and
            the units never differentiate — symmetry is never broken. Biases at zero are fine. See{" "}
            <Link href="/learn/initialisation-and-normalisation/breaking-symmetry" style={link}>Breaking symmetry</Link>.
          </li>
          <li>
            <strong>Add normalisation matched to the regime.</strong> BatchNorm for large-batch
            convolutional nets, LayerNorm for sequences and transformers, GroupNorm for small-batch
            settings where batch statistics are unreliable, RMSNorm for large language models. See{" "}
            <Link href="/learn/initialisation-and-normalisation/which-norm-when" style={link}>Which normalisation when</Link>.
          </li>
          <li>
            <strong>Use running statistics at test time — call <code>eval()</code>.</strong> BatchNorm
            uses the batch&rsquo;s own statistics during training but must switch to the accumulated
            running mean and variance at inference, or single-example predictions will be wrong. See{" "}
            <Link href="/learn/initialisation-and-normalisation/batchnorm-at-test" style={link}>BatchNorm at test time</Link>.
          </li>
          <li>
            <strong>If training a very deep residual net without normalisation, use Fixup-style
            init.</strong> Fixup, NF-Nets, and T-Fixup replace the missing norm layer with careful
            residual-branch initialisation and scaling. This is the deviation for one specific
            constraint — norm-free depth — not a default. See{" "}
            <Link href="/learn/initialisation-and-normalisation/modern-defaults" style={link}>The modern default, and when to deviate</Link>.
          </li>
        </ol>

        <Callout color={CORAL} title={<>The honest caveat: on shallow tabular problems, init alone is enough</>}>
          Do not oversell normalisation on small problems. On a shallow tabular task, He initialisation
          with ReLU already trains fine with <em>no</em> normalisation at all: depth 2 reaches test
          accuracy <strong>0.953</strong> and even depth 16 holds at <strong>0.931</strong> without a
          single norm layer. Normalisation&rsquo;s real payoff scales with <strong>depth</strong> and
          with the <strong>convolutional / large-batch</strong> regime. If your network is shallow and
          your data is tabular, steps 1–3 may be all you need, and adding BatchNorm buys little. The
          playbook is ordered so that the cheap, always-worthwhile steps come first and the
          regime-dependent one comes fourth.
        </Callout>

        <h2>Why the ordering is causal, not arbitrary</h2>
        <p>
          The steps are ranked by how much they move the gradient ratio, and that ranking came straight
          out of the measured grid — activation first (orders of magnitude), init second (single-digit
          corrections), normalisation third (robustness on top). Working in this order means each step
          operates on a foundation the previous step already made sound: matching the init only makes
          sense once the activation is non-saturating, and normalisation only buys robustness once the
          init has put you in a sensible range to be robust <em>around</em>.
        </p>

        <Proof color={CORAL} title="why activation → init → norm is the causal order">
          <p>
            The per-layer Jacobian norm factors as roughly{" "}
            <M>{String.raw`\lVert J_i \rVert \approx g'(\cdot)\cdot \sigma_W \cdot r_{\text{norm}}`}</M>:
            an activation-derivative term, a weight-scale term the init sets, and a normalisation
            rescaling term. The activation derivative <M>{String.raw`g'`}</M> is the term that can
            collapse toward 0 (saturation) and cannot be recovered by any later factor — so it must be
            fixed first. The weight scale <M>{String.raw`\sigma_W`}</M> is a multiplicative correction
            that only makes sense once <M>{String.raw`g'`}</M> is healthy — so init comes second.
            Normalisation&rsquo;s <M>{String.raw`r_{\text{norm}}`}</M> then rescales the product back
            toward 1 every layer, which presupposes the other two terms are already in range — so it
            comes third. The order of the checklist is the order in which the factors of the Jacobian
            must be brought under control.
          </p>
        </Proof>

        <h2>What you now have</h2>
        <p>
          You started this track with three separate ideas — how to initialise, which activation, which
          normalisation — and you leave it with a single system and a single number to reason about.
          You know that the activation sets the regime, the init corrects within it, and normalisation
          makes the correction forgiving; you know why a normalised layer is literally invariant to its
          own init scale; and you know the default corner that trains out of the box, plus the exact
          constraints that justify stepping out of it. The gradient debt the earlier tracks kept
          deferring to this one — backprop&rsquo;s runaway ratios, the activation zoo&rsquo;s
          saturation, the architecture track&rsquo;s deep-network failures — is now paid.
        </p>
        <p>
          The last piece of making a network train well is keeping it from memorising the training set.
          That is the subject of the final track in the family.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>The playbook orders the steps activation → init → normalisation. Why that order and
                not, say, normalisation first?</>,
              options: [
                "It is a stylistic convention with no measured basis",
                "It follows the size of each step's effect on the gradient ratio: the activation is first-order, the init a second-order correction, and normalisation adds robustness on top of both",
                "Normalisation must always come last because it is the most expensive",
              ],
              answer: 1,
              explain: <>The order came out of the measured grid: the activation moved the ratio by
                orders of magnitude, the init by single-digit corrections, and normalisation added
                robustness. Each step operates on a foundation the previous one made sound.</>,
            },
            {
              q: <>On a shallow tabular problem, He + ReLU with no normalisation reaches 0.953 at depth
                2 and 0.931 at depth 16. What does this honest finding imply?</>,
              options: [
                "Normalisation is never worth adding",
                "Normalisation's payoff scales with depth and the conv/large-batch regime; on shallow tabular data, steps 1–3 (activation, matched init, no zero-init) may be all you need",
                "The measurement must be wrong because normalisation always helps",
              ],
              answer: 1,
              explain: <>Init alone already trains a shallow tabular net fine. Normalisation earns its
                keep as depth grows and in convolutional / large-batch settings — which is why the
                playbook puts the always-worthwhile steps first and the regime-dependent norm step
                fourth.</>,
            },
            {
              q: <>Why does the playbook insist you never zero-init the weights, while allowing biases at
                zero?</>,
              options: [
                "Zero weights make the network too slow to train",
                "Identical (zero) weights give every unit identical gradients, so symmetry is never broken and the units never differentiate; biases at zero do not cause this",
                "Zero weights overflow the gradient computation",
              ],
              answer: 1,
              explain: <>If all weights start equal, all units in a layer receive the same gradient and
                stay identical forever — the layer behaves like a single unit. Weights must be random to
                break symmetry; biases can safely start at zero because the random weights already break
                it.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/initialisation-and-normalisation/modern-defaults", label: <>← The modern default, and when to deviate</> }}
          next={{ href: "/learn/nn-regularisation", label: <>Next track · Regularisation →</> }}
        />
      </div>
    </article>
  );
}
