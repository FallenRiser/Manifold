import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { CodeOutput } from "@/components/CodeOutput";
import { ActivationExplorerLab } from "@/components/labs/ActivationExplorerLab";

export const metadata = {
  title: "Designing a new one — Manifold",
  description:
    "State the properties you need, write a function that has them, check the derivative, then measure. Done here for real: Swish's shape derived from four requirements, landing within 0.02 of GELU.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function DesigningPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Choosing & designing", color: CORAL }, { label: "Tier 2→3", color: CORAL }]}
        time="about 10 minutes"
        title={<>Designing a new one</>}
        intro={<>The point of learning the property space is that you can work backwards from it. Here is the
          procedure, run for real on the function a reinforcement-learning search took thousands of GPU-hours to
          find — and it takes four requirements and one guess.</>}
      />

      <div className="lesson">
        <h2>The procedure</h2>
        <ol>
          <li><strong>State the properties you need</strong>, from the five axes. Not the shape — the properties.</li>
          <li><strong>Write a function that has them.</strong> Usually by modifying one you know.</li>
          <li><strong>Check the derivative</strong> — peak slope near 1, no exact zeros where you did not want them.</li>
          <li><strong>Check the cost.</strong> Every transcendental is paid per unit per layer per step.</li>
          <li><strong>Measure, with multiple seeds</strong>, against the incumbent. Report the spread.</li>
        </ol>
        <p>
          Step 5 is where nearly every published activation is weakest, and{" "}
          <Link href="/learn/activation-functions/the-bakeoff" style={link}>the bakeoff</Link> showed why: with
          seed spreads of 0.11, a small number of runs can demonstrate almost any ordering.
        </p>

        <h2>Step 1 — the requirements</h2>
        <p>
          Start from what ReLU gets right and what it gets wrong. We want to keep the properties that made it the
          default and remove the one that kills units:
        </p>
        <ul>
          <li><strong>Unbounded above</strong>, with slope near 1 for large positive inputs — so nothing saturates on
            the positive side and the chain-rule product does not shrink.</li>
          <li><strong>Bounded below</strong> — outputs should not run off to <M>{String.raw`-\infty`}</M>, since
            that is a route to exploding activations.</li>
          <li><strong>Derivative never exactly zero</strong> — the one requirement that removes permanent deaths.</li>
          <li><strong>Approximately ReLU for large <M>{String.raw`|x|`}</M></strong> — keep what works, change only
            the neighbourhood of the origin, which is where ReLU's damage occurs.</li>
        </ul>

        <h2>Step 2 — a function with those properties</h2>
        <p>
          ReLU is a hard gate: <M>{String.raw`x \cdot \mathbb{1}[x > 0]`}</M>. Every requirement above is about
          softening that gate rather than replacing it, so keep the form and make the gate smooth. The most obvious
          smooth gate into <M>{String.raw`(0,1)`}</M> is the sigmoid:
        </p>

        <MathBlock>{String.raw`f_\beta(x) = x\cdot\sigma(\beta x)`}</MathBlock>

        <p>
          One free parameter, controlling how sharp the gate is. That is the entire design, and it is Swish.
        </p>

        <PredictPrompt
          accent={CORAL}
          prompt={<>What does this function become at β = 0, where the sigmoid is a constant ½?</>}
          options={["ReLU", "The identity, x", "Exactly x/2 — a straight line with no non-linearity at all"]}
          nudge="Locked in. Check the first row of the sweep below."
        />

        <h2>Step 3 — check the derivative and sweep the parameter</h2>

        <CodeOutput source="scripts/activation_cases.py">{`  x * sigmoid(beta*x), swept over beta:
   beta   min value   at x =     f(-1)     f(2)  shape
    0.0   unbounded       --   -0.5000   1.0000  exactly x/2 -- linear
    0.5     -0.5569   -2.557   -0.3775   1.4621  a ReLU with a dip
    1.0     -0.2785   -1.278   -0.2689   1.7616  a ReLU with a dip
    2.0     -0.1392   -0.639   -0.1192   1.9640  a ReLU with a dip
    5.0     -0.0557   -0.256   -0.0067   1.9999  a ReLU with a dip
   20.0     -0.0139   -0.064   -0.0000   2.0000  indistinguishable from ReLU

  beta = 1: minimum -0.278465 at x = -1.2785; the derivative is
  negative everywhere left of -1.2785 -- the non-monotone window.
  It is bounded below (-0.2785) and unbounded above, smooth everywhere, and
  its slope never exceeds 1.0998.`}</CodeOutput>

        <p>
          Every requirement is met and one property arrived uninvited. <strong>The function is not monotone</strong>{" "}
          — it dips to <M>{String.raw`-0.2785`}</M> before returning toward zero — which nobody asked for and which,
          at the time, was assumed to disqualify an activation. It turned out to be harmless and possibly
          beneficial, and the lesson generalises: <em>a design derived from properties will have properties you did
          not specify, and you find them by looking rather than by assuming they are fatal.</em>
        </p>

        <LabFrame
          accent={CORAL}
          tryThis={<>Select <strong>Swish</strong> and sweep β from 0 through 8 while watching the &ldquo;switched
            off&rdquo; and &ldquo;peak slope&rdquo; boxes, then set it to 1.70 and compare against{" "}
            <strong>GELU</strong>.</>}
          insight={<>β is a continuous dial from a straight line to ReLU, and the interesting region is small: by
            β = 5 the curve is already visually ReLU. β = 1 sits where the dip is deep enough to be a real feature
            and the positive side is already close to the identity. At <strong>β = 1.702</strong> the function is
            within <strong>0.0207</strong> of GELU at every input — a design derived in five minutes here, and a
            probabilistic argument from a Gaussian CDF, arriving at the same curve.</>}
        >
          <ActivationExplorerLab />
        </LabFrame>

        <Callout color={CORAL} title={<>Two searches, one answer</>}>
          <M>{String.raw`\max_x\bigl|\,x\sigma(1.702x) - \text{GELU}(x)\,\bigr| = 0.0207`}</M> over{" "}
          <M>{String.raw`x \in [-10, 10]`}</M>.
          <br /><br />
          Google&rsquo;s search over expression trees, Hendrycks and Gimpel&rsquo;s argument about stochastic
          regularisation, and the four requirements at the top of this page all converge on the same function. That
          is the strongest available evidence that <strong>the property space is the real object</strong> and the
          named functions are labels for points in it.
        </Callout>

        <h2>Step 4 and 5 — cost, and the measurement</h2>
        <p>
          The cost is an exponential per unit, measured at 22× ReLU in NumPy. That is a real charge and the reason
          hard-swish exists for mobile inference.
        </p>
        <p>
          And the measurement, from this track&rsquo;s bakeoff: Swish leads shallow at{" "}
          <strong>0.8857 ± a 0.019 spread</strong>, against ReLU&rsquo;s <strong>0.7838 ± 0.114</strong>. The mean is
          ahead, and the more defensible claim is the sixfold reduction in variance. That is what a successful new
          activation looks like when it is reported honestly — not a breakthrough, a small and consistent
          improvement whose main virtue is reliability.
        </p>

        <Callout color={CORAL} title={<>When it is worth designing your own</>}>
          Almost never, for a general-purpose network — the incumbents are well tested and the gains are inside the
          noise. It is worth it when you have a <strong>structural requirement the standard functions do not
          meet</strong>, and then it is often easy:
          <br /><br />
          A target that must be positive → <M>{String.raw`\text{softplus}`}</M> at the output. A physical quantity
          that must be periodic → a sinusoidal activation, which is what SIREN does for implicit neural
          representations. A quantity bounded to <M>{String.raw`[0, 1]`}</M> by physics → a sigmoid, applied on
          purpose rather than by habit.
          <br /><br />
          The pattern: <strong>design a new activation when it encodes a constraint you know and the network does
          not.</strong> Do not design one hoping for a fraction of a point.
        </Callout>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>Which requirement is the one that makes <M>{String.raw`x\sigma(\beta x)`}</M> an improvement over
                ReLU rather than a cosmetic change?</>,
              options: [
                "Unbounded above",
                "The derivative is never exactly zero, so units cannot die permanently",
                "It is smooth at the origin",
              ],
              answer: 1,
              explain: <>ReLU is already unbounded above, and smoothness at a measure-zero point buys nothing. The
                exact-zero derivative on the whole negative half-line is ReLU's one genuinely new failure mode, and
                the soft gate is what removes it.</>,
            },
            {
              q: <>The design produced a non-monotone function, which nobody asked for. What is the right
                response?</>,
              options: [
                "Reject the design — monotonicity is a requirement for activations",
                "Check what the unintended property actually does, since a design derived from properties will always have properties you did not specify",
                "Add a constraint to remove the dip",
              ],
              answer: 1,
              explain: <>Monotonicity was widely assumed to be necessary and is not — both Swish and GELU are
                non-monotone and both are transformer defaults. The habit worth keeping is to measure the surprise
                rather than assume it is fatal.</>,
            },
            {
              q: <>When is designing a custom activation actually worthwhile?</>,
              options: [
                "Whenever you want an edge over standard architectures",
                "When it encodes a structural constraint you know about the target — positivity, periodicity, a bounded range — that the standard functions do not express",
                "Never — the standard set is complete",
              ],
              answer: 1,
              explain: <>Chasing a fraction of a point is not supported by the seed spreads. Encoding a known
                constraint is a different proposition: it gives the network information rather than asking it to
                learn something you already knew.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/activation-functions/the-output-layer", label: <>← The output layer is a different question</> }}
          next={{ href: "/learn/activation-functions/the-activation-playbook", label: <>Next up · The activation playbook →</> }}
        />
      </div>
    </article>
  );
}
