import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { ValueLandscapeLab } from "@/components/labs/ValueLandscapeLab";
import { GRIDWORLD_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "From values to a policy — Manifold",
  description:
    "Acting greedily with respect to the optimal value function is optimal. The policy improvement theorem, why greedy on V* recovers π*, and how it seeds the policy-iteration loop of the next track.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function GreedyPolicies() {
  const code = `import numpy as np
gamma = 1.0
def evaluate(pi):                    # exact policy evaluation (last chapter)
    Ppi = np.einsum('sa,sat->st', pi, P); Rpi = (pi * R).sum(1)
    nt = [s for s in range(nS) if s not in TERMINALS]
    V = np.zeros(nS)
    V[nt] = np.linalg.solve(np.eye(len(nt)) - gamma * Ppi[np.ix_(nt, nt)], Rpi[nt])
    return V

def greedy(V):                       # one greedy step: act to maximise Q
    a = (R + gamma * (P @ V)).argmax(1)
    pi = np.zeros((nS, nA)); pi[np.arange(nS), a] = 1.0
    return pi

V_rand = evaluate(random_policy)
V_impr = evaluate(greedy(V_rand))    # evaluate the policy greedy w.r.t. random's values
print("random  policy value at cell 6:", round(V_rand[6], 1))
print("improved policy value at cell 6:", round(V_impr[6], 1), " (one greedy step)")
print("improved >= random everywhere:", bool(np.all(V_impr >= V_rand - 1e-9)))`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 9 minutes"
        title={<>From values to a <em>policy</em></>}
        intro={<>A value function is not a policy — it is a table of numbers. But it contains a policy, and pulling
          it out is almost too easy: at each state, take the action with the highest value behind it. This is
          &ldquo;acting greedily,&rdquo; and the reason it deserves a whole page is a theorem that guarantees it
          never makes things worse — and, applied to <M>{String.raw`V^*`}</M>, gives you the best policy there is.</>}
      />

      <div className="lesson">
        <h2>Greedy: act on the value you have</h2>
        <p>
          Given any value function <M>V</M>, the <strong>greedy policy</strong> with respect to it picks, in each
          state, the action whose one-step lookahead scores highest:
        </p>
        <MathBlock>{String.raw`\pi_{\text{greedy}}(s) = \arg\max_{a}\left[\, R(s,a) + \gamma\sum_{s'}P(s'\mid s,a)\,V(s') \,\right] = \arg\max_a Q(s,a).`}</MathBlock>
        <p>
          If you have <M>{String.raw`Q`}</M> directly it is even simpler — just{" "}
          <M>{String.raw`\arg\max_a Q(s,a)`}</M>, no model needed. Either way, a table of values becomes a
          decision rule. The key question is whether this rule is any good, and the answer is a clean guarantee.
        </p>

        <h2>The policy improvement theorem</h2>
        <Callout color={GOLD} title={<>Greedy never hurts</>}>
          Let <M>{String.raw`\pi'`}</M> be greedy with respect to <M>{String.raw`V^\pi`}</M>, the value of some
          policy <M>{String.raw`\pi`}</M>. Then <M>{String.raw`\pi'`}</M> is at least as good as{" "}
          <M>{String.raw`\pi`}</M> in <em>every</em> state: <M>{String.raw`V^{\pi'}(s) \ge V^\pi(s)`}</M> for all{" "}
          <M>s</M>. And if <M>{String.raw`\pi'`}</M> is <em>not</em> strictly better anywhere, then both are
          already optimal. Acting greedily on your current values can only move you up — or leave you at the top.
        </Callout>
        <p>
          This is the engine of the whole search for optimality. Watch one step of it: take the random
          policy&rsquo;s values, act greedily on them once, and evaluate the result:
        </p>

        <CodeBlock setup={GRIDWORLD_SETUP} fromScratch={code} />
        <CodeOutput>{`random  policy value at cell 6: -20.0
improved policy value at cell 6: -3.0  (one greedy step)
improved >= random everywhere: True`}</CodeOutput>
        <p>
          One greedy step took cell 6 from <strong>−20 to −3</strong> — and, as the theorem promises, no state
          got worse. On this small grid one improvement already lands on the optimal values, because the random
          policy&rsquo;s values, though far from optimal in <em>magnitude</em>, still <em>rank</em> the neighbours
          correctly — greedy only needs the ordering. In general it takes several rounds of{" "}
          <em>evaluate, then act greedily</em> to converge, which is precisely the <strong>policy
          iteration</strong> algorithm of the next track.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt="Acting greedily on V* gives π*. So how good is greedy on V*'s own values — does improving it again change anything?"
          options={[
            "It keeps improving each round",
            "Nothing changes — greedy on V* is already optimal, so improvement stops (the fixed point)",
            "It gets worse due to overfitting",
          ]}
          nudge="Locked in. The improvement theorem's second half is the tell."
        />

        <h2>Greedy on V* is optimal</h2>
        <p>
          Apply the theorem at the top: a policy greedy with respect to <M>{String.raw`V^*`}</M> satisfies the
          Bellman optimality equation by construction (its chosen action <em>is</em> the maximising one), so its
          value <em>is</em> <M>{String.raw`V^*`}</M>. It cannot be improved, so it is optimal. This closes the
          loop we opened two pages ago: <strong>solve the Bellman optimality equation for{" "}
          <M>{String.raw`V^*`}</M>, then act greedily, and you have an optimal policy.</strong> The value function
          and the policy are two faces of the same object — find one and the other falls out.
        </p>

        <LabFrame
          accent={GOLD}
          tryThis={<>Switch the landscape to <strong>Optimal policy</strong>. The arrows shown are exactly the
            greedy policy with respect to <M>{String.raw`V^*`}</M> — read a few and confirm each points toward
            the nearest goal. Flip back to <strong>Random policy</strong>: the arrows are greedy with respect to
            the <em>random</em> policy&rsquo;s values, and they <em>already</em> point the right way even though
            the numbers are far more negative.</>}
          insight={<>Greedy needs only the <em>ranking</em> of neighbour values, not their exact size — which is
            why even the random policy&rsquo;s badly-scaled values yield the correct greedy moves here. The arrows
            are the policy; the colours are the value. &ldquo;Act greedily&rdquo; is just &ldquo;walk uphill on
            the value landscape.&rdquo;</>}
        >
          <ValueLandscapeLab />
        </LabFrame>

        <Proof title="proof of the policy improvement theorem" color={GOLD}>
          <p>
            Let <M>{String.raw`\pi'`}</M> be greedy w.r.t. <M>{String.raw`V^\pi`}</M>. By definition of greedy,
            for every <M>s</M>, <M>{String.raw`Q^\pi(s, \pi'(s)) = \max_a Q^\pi(s,a) \ge Q^\pi(s, \pi(s)) = V^\pi(s)`}</M>.
            Now expand <M>{String.raw`V^\pi(s) \le Q^\pi(s,\pi'(s)) = \mathbb{E}[R_{t+1} + \gamma V^\pi(S_{t+1}) \mid S_t=s, A_t=\pi'(s)]`}</M>{" "}
            and apply the same inequality to <M>{String.raw`V^\pi(S_{t+1})`}</M> repeatedly:
          </p>
          <MathBlock>{String.raw`V^\pi(s) \le \mathbb{E}_{\pi'}[R_{t+1} + \gamma R_{t+2} + \gamma^2 R_{t+3} + \cdots \mid S_t = s] = V^{\pi'}(s).`}</MathBlock>
          <p>
            Each substitution replaces a <M>{String.raw`V^\pi`}</M> with something no smaller, and telescoping the
            infinite chain turns the one-step improvement into the full return under <M>{String.raw`\pi'`}</M>.
            Hence <M>{String.raw`V^{\pi'} \ge V^\pi`}</M> everywhere. If equality holds throughout, then{" "}
            <M>{String.raw`V^\pi`}</M> satisfies the Bellman optimality equation, so <M>{String.raw`\pi`}</M> was
            already optimal. This inequality is the entire justification for hill-climbing on value.
          </p>
        </Proof>

        <PrevNext
          prev={{ href: "/learn/markov-decision-processes/bellman-optimality", label: <>← The Bellman optimality equation</> }}
          next={{ href: "/learn/markov-decision-processes/why-optimal-exists", label: <>Next · Why an optimal policy exists →</> }}
        />
      </div>
    </article>
  );
}
