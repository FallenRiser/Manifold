import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { ActivationExplorerLab } from "@/components/labs/ActivationExplorerLab";

export const metadata = {
  title: "The derivative is the point — Manifold",
  description:
    "Every textbook draws the curve. Backpropagation never touches the curve on the way back — it multiplies by the slope. Here is every activation drawn as both.",
};

const CORAL = "var(--c-neural)";

export default function DerivativePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "What an activation is for", color: CORAL }, { label: "Tier 1 · intuition", color: CORAL }]}
        time="about 9 minutes"
        title={<>The derivative <em>is the point</em></>}
        intro={<>Pick up any reference on activation functions and you get a page of curves. Curves are the forward
          pass. Learning happens on the backward pass, and the backward pass never looks at the curve — it multiplies
          by the slope. Draw both and the entire subject rearranges itself.</>}
      />

      <div className="lesson">
        <h2>Where the activation enters the gradient</h2>
        <p>
          From the previous track, the backward pass through a layer is one line — the incoming gradient, routed
          through the weights, then multiplied elementwise by the activation&rsquo;s slope at that unit&rsquo;s
          input:
        </p>

        <MathBlock>{String.raw`\delta^{(l-1)} \;=\; \left(\delta^{(l)} W^{(l)\top}\right)\;\odot\; f'\!\left(z^{(l-1)}\right)`}</MathBlock>

        <p>
          <M>{String.raw`f'`}</M> — nothing else. The value <M>{String.raw`f(z)`}</M> appears in the{" "}
          <em>forward</em> pass and in the weight gradient of the layer above, but the signal travelling backward is
          scaled by the derivative and only the derivative. Thirteen layers means thirteen of those multiplications
          in a row.
        </p>

        <Callout color={CORAL} title={<>The reframing this track runs on</>}>
          Stop asking &ldquo;what shape is this function?&rdquo; and start asking{" "}
          <strong>&ldquo;what does this function multiply my gradient by, and where?&rdquo;</strong>
          <br /><br />
          Sigmoid multiplies by at most 0.25 and usually by far less. ReLU multiplies by exactly 1 or exactly 0.
          Leaky ReLU multiplies by 1 or 0.01. GELU multiplies by something between −0.1 and 1.13 that is never
          exactly zero. Those four sentences predict almost everything the rest of this track measures.
        </Callout>

        <h2>Both halves, for every candidate</h2>
        <p>
          The lab draws <M>{String.raw`f`}</M> on top and <M>{String.raw`f'`}</M> underneath, on a shared axis. The
          red band marks where <M>{String.raw`|f'| < 0.01`}</M> — the region in which a unit contributes a factor of
          at most one hundredth to the chain-rule product. Two activations that look nearly identical on top can have
          completely different bands underneath, and the band is what matters.
        </p>

        <PredictPrompt
          accent={CORAL}
          prompt={<>Sigmoid is the classic &ldquo;squashing&rdquo; activation. What is the largest value its
            derivative ever takes?</>}
          options={["1 — it is a smooth S, so its steepest point has slope 1", "0.25", "Unbounded near zero"]}
          nudge="Locked in. Select sigmoid in the lab and read the peak-slope box."
        />

        <LabFrame
          accent={CORAL}
          tryThis={<>Compare <strong>sigmoid</strong> and <strong>tanh</strong> on the lower panel — same shape, very
            different heights. Then set <strong>Leaky ReLU</strong> and drag α down to 0, watching the red band
            appear the instant it reaches zero.</>}
          insight={<>Sigmoid&rsquo;s derivative peaks at <strong>0.25</strong> and is below 0.01 across{" "}
            <strong>42.7%</strong> of the input range — so even a perfectly behaved sigmoid layer divides the
            gradient by four, and a typical one divides it by much more. tanh has the same S shape but peaks at{" "}
            <strong>1.0</strong>. That one difference, visible only on the lower panel, is why tanh replaced sigmoid
            in hidden layers a decade before ReLU arrived.</>}
        >
          <ActivationExplorerLab />
        </LabFrame>

        <h2>Three readings worth taking now</h2>
        <p>
          <strong>ReLU&rsquo;s band covers exactly half the line.</strong> Not approximately — exactly, because its
          derivative is precisely zero for every negative input. That is the most aggressive switching-off of any
          function here, and ReLU is nonetheless the default. The reason is that the other half multiplies by exactly
          1, and a factor of 1 repeated twelve times is still 1. A large dead region is survivable; a{" "}
          <em>shrinking</em> live region is not.
        </p>
        <p>
          <strong>Leaky ReLU&rsquo;s band is empty.</strong> Set α to anything above zero and there is no input
          anywhere at which the slope falls below 0.01. It is the only function in the lab for which that is true, and
          the consequence is measured two chapters from now.
        </p>
        <p>
          <strong>The smooth moderns have slopes above 1.</strong> GELU peaks at 1.129 and dips slightly below zero
          near <M>{String.raw`x = -1`}</M>. It is not monotone, which was long assumed to be a requirement, and it
          works anyway.
        </p>

        <Callout color={CORAL} title={<>A caution about reading this lab</>}>
          The band shows where a unit <em>would</em> stop passing gradient, not where your units actually are. A
          sigmoid network whose inputs all sit near zero has every unit in the steep part and no vanishing problem at
          all. What decides where your units sit is the weights — which is why{" "}
          <strong>initialisation and normalisation</strong> can matter more than the choice of curve, a point this
          track will keep returning to rather than hide.
        </Callout>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>Which quantity does the backward pass multiply by as it moves through an activation?</>,
              options: [
                "The activation's output, f(z)",
                "The activation's derivative at that unit's input, f′(z)",
                "Both, in sequence",
              ],
              answer: 1,
              explain: <>The elementwise factor in <M>{String.raw`\delta^{(l-1)}`}</M> is{" "}
                <M>{String.raw`f'(z^{(l-1)})`}</M>. The value <M>{String.raw`f(z)`}</M> is needed for the weight
                gradient of the layer above, but the signal travelling backward is scaled by the slope alone.</>,
            },
            {
              q: <>Sigmoid&rsquo;s peak derivative is 0.25. Twelve sigmoid layers, each at its <em>best</em> point,
                multiply the gradient by roughly what?</>,
              options: ["About 0.05", "About 6 × 10⁻⁸", "About 3 — it grows"],
              answer: 1,
              explain: <><M>{String.raw`0.25^{12} \approx 6\times10^{-8}`}</M>, and that is the optimistic case where
                every unit sits at the steepest point of the curve. The measured ratio for a real twelve-layer
                sigmoid network, later in this track, is 29 million to one.</>,
            },
            {
              q: <>Why is ReLU&rsquo;s dead half survivable when sigmoid&rsquo;s saturation is not?</>,
              options: [
                "ReLU's dead region is smaller",
                "ReLU's live region multiplies by exactly 1, so the surviving paths lose nothing with depth",
                "ReLU units never enter their dead region in practice",
              ],
              answer: 1,
              explain: <>ReLU's dead region is in fact <em>larger</em> — half the line against sigmoid's 42.7%. The
                difference is what happens on the live side: a factor of exactly 1 repeated twelve times is 1, while
                a factor of 0.25 repeated twelve times is <M>{String.raw`6\times10^{-8}`}</M>.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/activation-functions/the-non-negotiable", label: <>← Non-linear, or nothing</> }}
          next={{ href: "/learn/activation-functions/saturation", label: <>Next up · Saturation →</> }}
        />
      </div>
    </article>
  );
}
