import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { CodeBlock } from "@/components/CodeBlock";
import { UnitDistributionLab } from "@/components/labs/UnitDistributionLab";

export const metadata = {
  title: "Where your units actually sit — Manifold",
  description:
    "The previous page measured where each curve's dead zone is. This one measures where the network actually lives — and the answer reverses the obvious reading: sigmoid saturates 0.0% of its units at initialisation.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function WhereUnitsSitPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "What an activation is for", color: CORAL }, { label: "Tier 2 · mechanics", color: CORAL }]}
        time="about 9 minutes"
        title={<>Where your units <em>actually</em> sit</>}
        intro={<>The anatomy table measures a property of a <em>function</em>: what fraction of the input line has a
          negligible slope. A network does not experience the input line. It experiences the handful of values its
          own weights produce — and once you measure those, one of this track&rsquo;s headline numbers turns out to
          mean the opposite of what it looks like.</>}
      />

      <div className="lesson">
        <h2>Two different questions</h2>
        <p>
          &ldquo;Sigmoid is saturated on 42.7% of <M>{String.raw`[-8, 8]`}</M>&rdquo; is a fact about sigmoid. The
          question that decides whether your run trains is different:{" "}
          <strong>what fraction of the pre-activations in your network land in that region?</strong>
        </p>
        <p>
          Those two numbers have no necessary relationship. A function can be dead on 99% of the line and be a
          perfect activation for a network whose units all sit in the remaining 1%. So the measurement to take is a
          histogram of every <M>{String.raw`z = Wx + b`}</M> in the network.
        </p>

        <PredictPrompt
          accent={CORAL}
          prompt={<>A freshly initialised network with sigmoid activations. What fraction of its units are sitting
            in sigmoid&rsquo;s saturated region?</>}
          options={["Around 40%, matching the anatomy table", "Around 10–20%", "Essentially none"]}
          nudge="Locked in. Select sigmoid in the lab and read the box."
        />

        <LabFrame
          accent={CORAL}
          tryThis={<>Read all three activations <strong>at initialisation</strong> first, then switch every one of
            them to <strong>after training</strong> and watch the per-layer strip appear.</>}
          insight={<>At initialisation sigmoid measures <strong>0.0% saturated</strong> — not low, none. Every unit
            sits in the steep middle of the curve, with a spread of 0.52. The anatomy table&rsquo;s 42.7% describes
            a region the network never visits. And after 1,500 training steps it is still only{" "}
            <strong>0.7%</strong>. Whatever kills a deep sigmoid network, it is not units stuck in the tails.</>}
        >
          <UnitDistributionLab />
        </LabFrame>

        <h2>So what does kill the deep sigmoid network?</h2>
        <p>
          The 0.25 ceiling, on its own, with every unit behaving perfectly. Recall the two facts side by side:
        </p>
        <ul>
          <li>Sigmoid&rsquo;s derivative is <strong>at most 0.25</strong>, achieved at <M>{String.raw`z = 0`}</M>.</li>
          <li>Sigmoid&rsquo;s units sit, measurably, <strong>right around <M>{String.raw`z = 0`}</M></strong>.</li>
        </ul>
        <p>
          Those combine into the worst possible reading: the units are in the best part of the curve, and the best
          part of the curve still divides the gradient by four. <M>{String.raw`0.25^{12} \approx 6\times10^{-8}`}</M>,
          and the measured twelve-layer ratio was 29 million to one. <strong>The vanishing gradient in a sigmoid
          network is not a saturation story at all</strong> — it is the ceiling compounding, which is exactly why no
          amount of careful initialisation fully rescues it.
        </p>

        <Callout color={CORAL} title={<>A correction to the standard explanation</>}>
          Almost every treatment, including the intuitive version earlier on this track, tells the story as
          &ldquo;sigmoid units saturate, so gradients vanish&rdquo;. The measurement says the first clause is false
          at initialisation and nearly false after training.
          <br /><br />
          The accurate version has two separate mechanisms, and they call for different fixes:
          <br /><br />
          <strong>1. A low peak slope</strong> — sigmoid&rsquo;s 0.25 — compounds with depth even for perfectly
          placed units. Fixed only by changing the activation.
          <br />
          <strong>2. Units drifting into a flat region</strong> — which the lab shows happening to{" "}
          <em>tanh</em>, not sigmoid, and only after training. Fixed by initialisation and normalisation.
          <br /><br />
          Conflating them is why &ldquo;use ReLU&rdquo; and &ldquo;normalise your activations&rdquo; get offered as
          interchangeable advice when they address different failures.
        </Callout>

        <h2>What training does to the distribution</h2>
        <p>
          Switch the lab to <em>after training</em> and the three activations diverge sharply.
        </p>
        <p>
          <strong>tanh starts perfectly centred and drifts out.</strong> 0.1% saturated at initialisation, 30.1%
          after training, with the spread of <M>{String.raw`z`}</M> growing from 0.43 to 3.24. And the per-layer
          strip shows it is not uniform: 2% in the first hidden layer, rising steadily to <strong>82% in the
          last</strong>. Training pushed the later layers into the tails. This is the saturation the standard story
          describes — it just belongs to tanh here, and it is a consequence of training rather than a property of
          the curve.
        </p>
        <p>
          <strong>ReLU starts at 50.6% and that is normal.</strong> Half the line has zero slope and a symmetric
          initialisation puts about half the units there, so the number is a definition rather than a warning. It
          rises to 64.4%, and the units that matter are the ones that stay off for <em>every</em> example — the
          dying-ReLU count from two pages back, which is a much smaller number than this one.
        </p>
        <p>
          <strong>Nothing bounds ReLU&rsquo;s activations.</strong> Its largest pre-activation after training was{" "}
          <strong>105.3</strong>, against sigmoid&rsquo;s 8.9 and tanh&rsquo;s 15.5. A bounded activation caps how
          far its own outputs can push the next layer; an unbounded one does not, and the growth compounds.
        </p>

        <Callout color={CORAL} title={<>The result that complicates the whole track</>}>
          On this six-layer network, the test accuracies were <strong>sigmoid 0.9190</strong>, tanh 0.9048, ReLU
          0.8952.
          <br /><br />
          Sigmoid won. That is not a contradiction of the{" "}
          <Link href="/learn/activation-functions/the-bakeoff" style={link}>bakeoff</Link>, where sigmoid failed
          badly — that was ten layers on a harder problem. It is the same lesson arriving from the other side:{" "}
          <strong>the 0.25 ceiling is fatal when compounded twelve times and irrelevant when compounded six times
          on an easy problem.</strong>
          <br /><br />
          If you take one habit from this page, take this one: <em>measure where your units are before you blame
          your activation.</em> The property of the curve and the behaviour of your network are different things,
          and only one of them is on your screen.
        </Callout>

        <h2>Taking the measurement yourself</h2>
        <p>
          It is a forward pass and a histogram, and it belongs beside the dead-unit count in your diagnostic kit:
        </p>

        <CodeBlock
          language="python"
          fromScratch={`import numpy as np

def where_do_units_sit(zs, deriv):
    """zs: the pre-activation of each hidden layer. deriv: f'(z) for your
    activation. Report the spread and how much of the network is switched off."""
    for i, z in enumerate(zs):
        sat = np.mean(np.abs(deriv(z)) < 0.01)
        print(f"layer {i}: mean {z.mean():+.2f}  sd {z.std():.2f}  "
              f"max|z| {np.abs(z).max():6.1f}  saturated {sat:5.1%}")

# What to look for:
#   sd growing layer by layer      -> activations are inflating; check init/norm
#   saturated climbing toward 100% -> the later layers are switching off
#   max|z| in the hundreds         -> nothing is bounding the forward pass`}
        />

        <p>
          Three lines of output per layer, and they distinguish the failures this track has spent nine pages
          separating. A network with a flat loss and 0% saturation has a learning-rate problem; the same network
          with 82% saturation in its last layer has a different one.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>Sigmoid&rsquo;s derivative is below 0.01 on 42.7% of [−8, 8], yet 0.0% of a freshly initialised
                network&rsquo;s units are saturated. How do both hold?</>,
              options: [
                "The anatomy measurement is wrong",
                "They measure different things — one is a property of the curve over the whole line, the other is where the network's weights actually place its units",
                "Initialisation deliberately avoids the saturated region for sigmoid",
              ],
              answer: 1,
              explain: <>With a standard initialisation the pre-activations have a spread of about 0.5 around zero,
                so they occupy the steep middle. The 42.7% describes territory the network never visits.</>,
            },
            {
              q: <>Given that measurement, what is the accurate explanation of vanishing gradients in a deep sigmoid
                network?</>,
              options: [
                "Units saturate in the flat tails, so their gradients are near zero",
                "The peak slope is 0.25, so even perfectly placed units divide the gradient by four at every layer, and that compounds",
                "The weights shrink during training",
              ],
              answer: 1,
              explain: <>The units are in the best part of the curve, and the best part still costs a factor of
                four. <M>{String.raw`0.25^{12}\approx 6\times10^{-8}`}</M>. Saturation is a real mechanism but it
                belongs to a different case — the lab shows it happening to tanh after training.</>,
            },
            {
              q: <>After training, tanh is 2% saturated in the first hidden layer and 82% in the last. What kind of
                problem is that?</>,
              options: [
                "A property of tanh that was present from the start",
                "Something training caused — the units drifted outward, which is an initialisation and normalisation problem rather than a choice-of-curve problem",
                "Evidence that tanh should never be used",
              ],
              answer: 1,
              explain: <>tanh began at 0.1% saturated with a spread of 0.43 and ended at 30.1% with a spread of
                3.24. The curve did not change; the distribution of inputs to it did. That is precisely the failure
                normalisation layers exist to prevent.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/activation-functions/saturation", label: <>← Saturation</> }}
          next={{ href: "/learn/activation-functions/the-step", label: <>Next up · The step, and why it could not be trained →</> }}
        />
      </div>
    </article>
  );
}
