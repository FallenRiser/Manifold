import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { ActivationExplorerLab } from "@/components/labs/ActivationExplorerLab";

export const metadata = {
  title: "GELU & Swish — Manifold",
  description:
    "What the transformer era actually runs on. Two functions found by completely different routes — a probabilistic argument and an automated search — that agree to 0.02 everywhere.",
};

const CORAL = "var(--c-neural)";

export default function GeluSwishPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "The smooth moderns", color: CORAL }, { label: "Tier 2 · mechanics", color: CORAL }]}
        time="about 9 minutes"
        title={<>GELU &amp; Swish</>}
        intro={<>Open any transformer and you will find one of these two. They were arrived at by routes with
          nothing in common — one from a probabilistic argument about dropout, one from a reinforcement-learning
          search over expression trees — and they landed on essentially the same curve.</>}
      />

      <div className="lesson">
        <h2>GELU, from a probabilistic argument</h2>
        <p>
          Hendrycks and Gimpel (2016) started from a question about regularisation, not about gradients. ReLU gates
          an input deterministically: keep it if positive, zero it otherwise. Dropout gates it randomly. What if the
          gate were <em>stochastic but input-dependent</em> — keep <M>{String.raw`x`}</M> with a probability that
          rises as <M>{String.raw`x`}</M> grows?
        </p>
        <p>
          Take the gate to be <M>{String.raw`m \sim \text{Bernoulli}(\Phi(x))`}</M>, where{" "}
          <M>{String.raw`\Phi`}</M> is the standard normal CDF — a natural choice if pre-activations are roughly
          Gaussian, which after normalisation they roughly are. The expected output of that stochastic unit is:
        </p>

        <MathBlock>{String.raw`\mathbb{E}[m \cdot x] \;=\; x\,\Phi(x) \;=\; \text{GELU}(x)`}</MathBlock>

        <p>
          So GELU is the <em>deterministic expectation of a stochastic gate</em>. That is an unusually principled
          derivation for an activation, and it explains the shape: near zero the gate is a coin flip so the output
          is about half the input; far positive the gate is always on so the output is the input; far negative the
          gate is always off so the output is zero.
        </p>

        <h2>Swish, from a search</h2>
        <p>
          Ramachandran, Zoph and Le (2017) took the opposite approach: define a grammar of unary and binary
          operations, search it with reinforcement learning, and evaluate candidates by actually training networks.
          The best result was:
        </p>

        <MathBlock>{String.raw`\text{Swish}_\beta(x) = x\,\sigma(\beta x) \qquad\qquad \text{SiLU} = \text{Swish}_1`}</MathBlock>

        <p>
          No principle, no story — just the thing that scored highest. It was then noticed that the same function had
          already been proposed twice under other names, which is a fair summary of how the zoo grew.
        </p>

        <PredictPrompt
          accent={CORAL}
          prompt={<>One function came from a Gaussian CDF, the other from an automated search. How close are they?</>}
          options={[
            "Similar in spirit, visibly different curves",
            "Within about 0.2 of each other everywhere",
            "Within 0.02 everywhere, with the right β",
          ]}
          nudge="Locked in. The measurement is two paragraphs down."
        />

        <h2>They are the same function</h2>
        <p>
          Not metaphorically. Measured over <M>{String.raw`x \in [-10, 10]`}</M>:
        </p>
        <ul>
          <li><M>{String.raw`\max\bigl|\text{Swish}_{1} - \text{GELU}\bigr| = 0.1931`}</M></li>
          <li><M>{String.raw`\max\bigl|\text{Swish}_{1.702} - \text{GELU}\bigr| = \mathbf{0.0207}`}</M></li>
        </ul>
        <p>
          With <M>{String.raw`\beta = 1.702`}</M> the two agree to two hundredths of a unit at every input. The
          reason is not a coincidence: <M>{String.raw`\sigma(1.702x)`}</M> is the standard logistic approximation to
          the normal CDF <M>{String.raw`\Phi(x)`}</M>, a fact from statistics that long predates both papers. Two
          independent searches converged because they were approximating the same object.
        </p>

        <LabFrame
          accent={CORAL}
          tryThis={<>Select <strong>Swish</strong> and set β to 1.70, then flip to <strong>GELU</strong> — both
            panels, curve and derivative. Then drag β to 0 and up to 8.</>}
          insight={<>At β ≈ 1.7 the two are indistinguishable at this resolution. The β slider is the more
            interesting control: at <strong>β = 0</strong> Swish is exactly <M>{String.raw`x/2`}</M>, a straight
            line — no non-linearity at all — and by <strong>β = 8</strong> it is visually ReLU. One parameter
            interpolates the whole distance from &ldquo;useless&rdquo; to &ldquo;the default of the last
            decade&rdquo;, which is worth more intuition than either endpoint.</>}
        >
          <ActivationExplorerLab />
        </LabFrame>

        <h2>The two properties both share</h2>
        <p>
          <strong>Non-monotone.</strong> Both dip below zero for moderately negative inputs — Swish reaches a minimum
          of <M>{String.raw`-0.2785`}</M> at <M>{String.raw`x = -1.2785`}</M>, GELU a similar{" "}
          <M>{String.raw`-0.17`}</M>. So a <em>more</em> negative input can produce a <em>less</em> negative output.
          Monotonicity was widely assumed to be a requirement for an activation, and these two demonstrate it is
          not.
        </p>
        <p>
          <strong>Never exactly zero-sloped.</strong> Neither derivative is ever exactly zero for a finite input, so
          neither can produce a permanently dead unit — the guarantee Leaky ReLU makes by construction, these two
          make by smoothness. The measured dead count for both, at the learning rate that killed 19 ReLU units, was
          zero.
        </p>

        <Proof color={CORAL} title="why 1.702, and why Swish's derivative exceeds 1">
          <p>
            <strong>The constant.</strong> The logistic function <M>{String.raw`\sigma(kx)`}</M> is the classical
            approximation to <M>{String.raw`\Phi(x)`}</M>; matching the two at the origin gives{" "}
            <M>{String.raw`\sigma'(0)k = \phi(0)`}</M>, i.e. <M>{String.raw`k/4 = 1/\sqrt{2\pi}`}</M> and{" "}
            <M>{String.raw`k = 4/\sqrt{2\pi} \approx 1.5958`}</M>. Minimising the maximum error over the whole line
            rather than matching only at zero moves it to <M>{String.raw`k \approx 1.702`}</M>, which is where the
            0.0207 figure comes from.
          </p>
          <p>
            <strong>The overshoot.</strong> Differentiating <M>{String.raw`f(x) = x\sigma(x)`}</M> by the product
            rule:
          </p>
          <MathBlock>{String.raw`f'(x) = \sigma(x) + x\,\sigma(x)\bigl(1-\sigma(x)\bigr)`}</MathBlock>
          <p>
            The first term rises from 0 to 1; the second is positive for <M>{String.raw`x > 0`}</M> and adds to it,
            so the sum exceeds 1 — the measured peak is <M>{String.raw`1.0998`}</M>. For{" "}
            <M>{String.raw`x < 0`}</M> the second term is negative and can dominate the first, which is exactly the
            non-monotone dip. Both distinguishing features fall out of one application of the product rule.
          </p>
          <p>
            A slope above 1 means these functions can <em>amplify</em> a gradient rather than only attenuate it.
            That is not automatically good — it is one more thing that can compound over depth — and it is one
            reason these activations are paired with normalisation in practice rather than used bare.
          </p>
        </Proof>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>What is GELU, in one sentence?</>,
              options: [
                "A smoothed ReLU obtained by rounding the corner",
                "The expected output of a stochastic gate that keeps x with probability Φ(x)",
                "The integral of the sigmoid function",
              ],
              answer: 1,
              explain: <>With <M>{String.raw`m \sim \text{Bernoulli}(\Phi(x))`}</M>, the expectation{" "}
                <M>{String.raw`\mathbb{E}[mx] = x\Phi(x)`}</M>. The smoothed-ReLU appearance is a consequence of that
                derivation, not the motivation for it.</>,
            },
            {
              q: <>Swish with β = 1.702 differs from GELU by at most 0.0207 everywhere. Why?</>,
              options: [
                "Coincidence — two searches happened to land nearby",
                "Because σ(1.702x) is the standard logistic approximation to the normal CDF Φ(x), so both are approximating the same object",
                "Because both were fitted to the same benchmark",
              ],
              answer: 1,
              explain: <>The logistic-to-normal approximation predates both papers. GELU uses{" "}
                <M>{String.raw`\Phi`}</M> exactly; Swish's search found the logistic function that approximates it.
                The agreement is structural.</>,
            },
            {
              q: <>Why can neither GELU nor Swish produce a permanently dead unit?</>,
              options: [
                "Because they are monotone",
                "Because their derivatives are never exactly zero for a finite input, so the update never vanishes completely",
                "Because their outputs are bounded below",
              ],
              answer: 1,
              explain: <>Death requires an exactly-zero gradient. Both approach zero slope asymptotically but never
                reach it, so a driven-negative unit retains a small path back — measured as zero deaths at the
                learning rate that killed 19 ReLU units. Neither is monotone, incidentally.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/activation-functions/selu", label: <>← SELU &amp; self-normalising nets</> }}
          next={{ href: "/learn/activation-functions/what-smoothness-buys", label: <>Next up · What smoothness actually buys →</> }}
        />
      </div>
    </article>
  );
}
