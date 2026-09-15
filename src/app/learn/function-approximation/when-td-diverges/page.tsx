import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { FA_SETUP } from "@/lib/runtimeSetup";
import { Curve } from "@/components/figures/fa/Curve";
import { BAIRD_X, BAIRD_SERIES } from "@/components/figures/fa/data";

export const metadata = {
  title: "When TD diverges — Manifold",
  description:
    "Two states, one weight, no rewards — and semi-gradient TD sends it to 11,487 in a hundred updates. The same features and the same step size converge to 0.02 when the updates follow the policy that generates them. The problem is not the approximator; it is which states you update.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function WhenTDDiverges() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Theory", color: GOLD }]}
        time="about 10 minutes"
        title={<>When TD diverges</>}
        intro={<>Everything so far has converged. Sometimes to a biased answer, sometimes slowly, but it always
          settled. This chapter is about the case where it does not settle at all — where the weights run off to
          infinity on a problem with no rewards, an exact representation, and a tiny step size.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <PredictPrompt
          accent={GOLD}
          prompt={<>Seven states, every reward zero, every true value zero, and a weight vector that
            can represent that answer exactly. A small step size. What does the weight norm do over a
            thousand off-policy TD updates?</>}
          options={[
            "Converges to zero — the right answer is representable",
            "Wanders near its starting value",
            "Grows without bound",
            "Oscillates between two values",
          ]}
          nudge="Locked in. The run is plotted below, against the same run with one leg removed."
        />

        <h2>The smallest possible disaster</h2>
        <p>
          You do not need a big problem to break TD. Two states will do, with a <em>single</em> weight between
          them. Let the first state have feature <M>x(s_1) = 1</M> and the second <M>x(s_2) = 2</M>, so
        </p>
        <MathBlock>{String.raw`\hat v(s_1, w) = w, \qquad \hat v(s_2, w) = 2w`}</MathBlock>
        <p>
          There is one transition, <M>s_1 \to s_2</M>, and its reward is 0. Now apply the semi-gradient TD update
          to that transition, over and over — which is what happens if <em>this</em> transition is the one your
          data keeps handing you, while the policy you are evaluating would do something else.
        </p>

        <Proof title="Why the weight grows by a fixed factor every update">
          <p>
            <strong>Step 1 — write the TD error.</strong> The reward is 0, the next state&rsquo;s estimate is{" "}
            <M>2w</M>, and the current state&rsquo;s estimate is <M>w</M>:
          </p>
          <MathBlock>{String.raw`\delta = 0 + \gamma\,(2w) - w = (2\gamma - 1)\,w`}</MathBlock>
          <p>
            <strong>Step 2 — apply the update.</strong> The gradient of <M>{String.raw`\hat v(s_1,w) = w`}</M> is{" "}
            <M>x(s_1) = 1</M>, so
          </p>
          <MathBlock>{String.raw`w \leftarrow w + \alpha\,\delta\,x(s_1) = w + \alpha(2\gamma - 1)w`}</MathBlock>
          <p>
            <strong>Step 3 — factor out <M>w</M>.</strong> Every update multiplies the weight by the same number:
          </p>
          <MathBlock>{String.raw`w \leftarrow \big[1 + \alpha(2\gamma - 1)\big]\,w`}</MathBlock>
          <p>
            <strong>Step 4 — read the condition.</strong> This is a geometric sequence. It explodes whenever{" "}
            <M>{String.raw`2\gamma - 1 > 0`}</M>, that is <M>{String.raw`\gamma > 0.5`}</M>, and no choice of{" "}
            <M>{String.raw`\alpha > 0`}</M> changes the sign — a smaller step size only makes the ratio closer to
            1, so it diverges more slowly. With <M>{String.raw`\gamma = 0.99`}</M> and{" "}
            <M>{String.raw`\alpha = 0.1`}</M> the factor is <strong>1.098</strong>, which is a 1.098<sup>100</sup>{" "}
            ≈ 11,000-fold increase over a hundred updates. (At <M>{String.raw`\gamma = 0.4`}</M> the factor is
            0.98 and the same code decays to 0.13 instead.)
          </p>
        </Proof>

        <p>
          The mechanism is worth saying in words. Raising <M>w</M> raises the estimate at{" "}
          <M>s_1</M> by one unit — and the <em>target</em> at <M>s_2</M> by two. The update chases a target that
          runs away from it twice as fast as it can move. Bootstrapping is what makes the target move at all; the
          shared weight is what makes it move faster than the estimate.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt={<>Now the interesting part. Same features, same <M>{String.raw`\gamma`}</M>, same{" "}
            <M>{String.raw`\alpha`}</M> — but instead of hammering that one transition, we <em>follow the
            chain</em>: <M>s_1 \to s_2</M>, then <M>s_2 \to s_2</M> forever. What happens?</>}
          options={["Diverges just the same", "Diverges, but slower", "Converges to 0", "Converges to something else"]}
        />

        <CodeBlock setup={FA_SETUP} fromScratch={code} />
        <CodeOutput>{`OFF-POLICY: we only ever update the transition s1 -> s2
   update   1:  w =       1.0980   v(s1) =      1.0980   v(s2) =       2.1960
   update  10:  w =       2.5470   v(s1) =      2.5470   v(s2) =       5.0939
   update  50:  w =     107.1808   v(s1) =    107.1808   v(s2) =     214.3616
   update 100:  w =   11487.7245   v(s1) =  11487.7245   v(s2) =   22975.4490

ON-POLICY: follow the chain, which lands in s2 and stays there
   update   1:  w =     1.098000
   update  10:  w =     1.059099
   update  50:  w =     0.902215
   update 100:  w =     0.738375

per-update growth factor while only s1 is updated: 1.098`}</CodeOutput>

        <p>
          <strong>11,487 versus 0.738.</strong> Nothing about the approximator changed. The features are the same
          two numbers, the discount is the same 0.99, the step size is the same 0.1. What changed is{" "}
          <em>which transitions got updated</em>.
        </p>
        <p>
          Follow the chain and the first update still bumps <M>w</M> up to 1.098 — but from then on the agent is
          in <M>s_2</M>, and <M>s_2</M>&rsquo;s own update pulls the other way. There{" "}
          <M>{String.raw`\delta = \gamma\,2w - 2w = -0.02w`}</M>, and the gradient is{" "}
          <M>x(s_2) = 2</M>, so each visit multiplies <M>w</M> by <M>1 - 0.004</M>. Left running for 1,000
          updates it reaches <strong>0.0200</strong> and keeps shrinking toward the true value, which is 0.
        </p>

        <Callout color={GOLD} title={<>&ldquo;Off-policy&rdquo; is about the distribution, not the ratio</>}>
          It is tempting to blame importance sampling — the big <M>{String.raw`\rho`}</M> factors that off-policy
          learning multiplies into the update. But there is no importance sampling anywhere in the code above.
          The off-policy run simply updates a transition more often than the target policy would visit it.
          <br /><br />
          That is the real content of the third leg: on-policy, the states you update are exactly the states the
          policy produces, and every optimistic update at one state is followed by the corrective updates its
          successors provide. Off-policy, you can update <M>s_1</M> a thousand times and never pay the bill at{" "}
          <M>s_2</M>. The{" "}
          <Link href="/learn/function-approximation/semi-gradient-td" style={link}>convergence proof for linear
          on-policy TD</Link> leans on precisely this, which is why its statement contains the words{" "}
          <em>on-policy</em>.
        </Callout>

        <p>
          Two states and one weight are easy to dismiss as a toy. So the next page builds the standard
          counterexample: seven states, eight weights, every reward zero, a representation that can express the
          true answer perfectly — and weights that grow 68.6× in a thousand steps.
        </p>

        <PrevNext
          prev={{ href: "/learn/function-approximation/what-generalisation-costs", label: <>← What generalisation costs you</> }}
          next={{ href: "/learn/function-approximation/bairds-counterexample", label: <>Next · Baird&rsquo;s counterexample →</> }}
        />
      </div>
    </article>
  );
}

const code = `gamma, alpha = 0.99, 0.1

print("OFF-POLICY: we only ever update the transition s1 -> s2")
w = 1.0
for t in range(1, 101):
    delta = 0.0 + gamma * (2 * w) - w      # reward 0, v(s2) = 2w, v(s1) = w
    w += alpha * delta * 1.0               # x(s1) = 1
    if t in (1, 10, 50, 100):
        print(f"   update {t:3d}:  w = {w:12.4f}   v(s1) = {w:11.4f}   v(s2) = {2*w:12.4f}")

print("\\nON-POLICY: follow the chain, which lands in s2 and stays there")
w = 1.0
experienced = [(1.0, 2.0)] + [(2.0, 2.0)] * 99      # (x(s), x(s')) actually visited
for t, (x, x2) in enumerate(experienced, 1):
    delta = 0.0 + gamma * x2 * w - x * w
    w += alpha * delta * x
    if t in (1, 10, 50, 100):
        print(f"   update {t:3d}:  w = {w:12.6f}")

print(f"\\nper-update growth factor while only s1 is updated: {1 + alpha * (2 * gamma - 1):.3f}")`;
