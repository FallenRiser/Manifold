import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { Quiz } from "@/components/Quiz";
import { PredictPrompt } from "@/components/PredictPrompt";
import { GRIDWORLD_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "From values to a plan — Manifold",
  description:
    "Value iteration produces a value function, not a policy. Extracting the plan is one greedy pass. And because the greedy policy stabilises before the values do, you can often stop iterating early and still get the optimal plan.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function FromValuesToAPlan() {
  const code = `import numpy as np
P, R = make_goal_grid(); gamma = 0.9
GOAL, PIT = 15, 3

# Run value iteration, and track TWO things each sweep: when the values converge,
# and when the greedy POLICY stops changing.
V = np.zeros(nS); prev_a = None; frozen = None
for k in range(1, 1000):
    Q = R + gamma * (P @ V)
    a = Q.argmax(1)                                  # the greedy policy right now
    if prev_a is not None and np.array_equal(a, prev_a) and frozen is None:
        frozen = k - 1
    newV = Q.max(1); newV[[GOAL, PIT]] = 0.0
    delta = np.max(np.abs(newV - V)); prev_a = a; V = newV
    if delta < 1e-9:
        conv = k; break

print(f"greedy policy stopped changing after sweep {frozen}")
print(f"values fully converged after sweep {conv}")
# extract the plan: one greedy pass over the final values
a = (R + gamma * (P @ V)).argmax(1)
arr = np.array(ARROWS)[a]; arr[[GOAL, PIT]] = ["G", "P"]
print("extracted policy:"); show(arr)`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 7 minutes"
        title={<>From values to a <em>plan</em></>}
        intro={<>Value iteration hands you a table of numbers, not a set of instructions. Turning that value function
          into an actual policy — a plan — is a single greedy pass. And there is a bonus hiding in the timing: the
          plan is usually correct well before the numbers finish converging, so you can often stop early and still
          walk away with the optimal policy.</>}
      />

      <div className="lesson">
        <h2>Extraction is one greedy pass</h2>
        <p>
          A value function <M>V</M> becomes a policy the same way it always has — act greedily:
        </p>
        <MathBlock>{String.raw`\pi(s) = \arg\max_a\Big[\, R(s,a) + \gamma\sum_{s'}P(s'\mid s,a)\,V(s') \,\Big].`}</MathBlock>
        <p>
          If <M>V = V^*</M>, this greedy policy is optimal (the MDP track&rsquo;s result). One lookahead per state,
          done once at the end. But here is the practically important part — you may not need to wait for{" "}
          <M>V</M> to reach <M>{String.raw`V^*`}</M> at all:
        </p>

        <CodeBlock setup={GRIDWORLD_SETUP} fromScratch={code} />
        <CodeOutput>{`greedy policy stopped changing after sweep 6
values fully converged after sweep 7
extracted policy:
   →     →     ↓     P
   →     →     →     ↓
   →     →     →     ↓
   →     →     →     G`}</CodeOutput>
        <p>
          On this world the gap is one sweep, but the phenomenon is general and often dramatic (recall the Sutton
          grid, where the optimal policy appeared after 3 sweeps and the values took ~150). The <em>ranking</em> of
          actions — all the greedy policy needs — stabilises before the exact values do. So a legitimate and much
          cheaper stopping rule is: <strong>iterate until the greedy policy stops changing, then extract it.</strong>
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt="You stop value iteration when the greedy policy is stable for a few sweeps, then extract it. What's the risk?"
          options={[
            "None — a stable greedy policy is always optimal",
            "The policy could still flip later as values keep moving; stability for a few sweeps is strong evidence but not the ironclad guarantee the value bound gives",
            "The extracted policy will be random",
          ]}
          nudge="Locked in. Policy-stability is a fast heuristic; the γδ/(1−γ) bound is the rigorous certificate."
        />

        <h2>Two stopping rules, two guarantees</h2>
        <p>
          You now have both tools, and they complement each other:
        </p>
        <ul>
          <li>
            <strong>The value bound</strong> (<M>{String.raw`\frac{\gamma}{1-\gamma}\delta \le \varepsilon`}</M>) is
            rigorous — it certifies you are within <M>{String.raw`\varepsilon`}</M> of <M>{String.raw`V^*`}</M> — but
            conservative, so it can ask for many sweeps.
          </li>
          <li>
            <strong>Policy-stability</strong> (the greedy policy unchanged for several sweeps) is fast and usually
            correct, but is a heuristic — a policy can still flip as values move. In finite MDPs with a value gap it
            is eventually exact, but you do not get a certificate per se.
          </li>
        </ul>
        <p>
          Used together — stop when the policy has been stable <em>and</em> <M>{String.raw`\delta`}</M> is small —
          you get the speed of the first and most of the safety of the second. This is how value iteration is run in
          practice.
        </p>

        <Callout color={GOLD} title={<>Policy iteration never has this problem</>}>
          Because policy iteration <em>stores</em> the policy and stops exactly when it stops changing, it has no
          gap to manage — it terminates at <M>{String.raw`\pi^*`}</M> exactly. Value iteration trades that clean
          stopping test for cheaper sweeps, and the price is needing a rule like the ones above. It is the same
          evaluate-thoroughness trade-off from every page of this chapter, now showing up in how you decide to quit.
        </Callout>

        <Quiz
          accent={GOLD}
          title="Chapter checkpoint"
          questions={[
            {
              q: <>Value iteration outputs a value function. How do you get the policy?</>,
              options: [
                "It's already stored as you go",
                "One greedy pass at the end: π(s) = argmax_a [R + γ Σ P V] over the final values",
                "Solve a linear system",
              ],
              answer: 1,
              explain: <>Value iteration tracks no policy. Extraction is a single greedy lookahead per state over the
                converged values — cheap and done once.</>,
            },
            {
              q: <>Why can you often stop value iteration before the values converge?</>,
              options: [
                "You can't — you always need full convergence",
                "The greedy policy depends only on action rankings, which stabilise before the exact values, so the optimal plan appears early",
                "Because δ is always zero",
              ],
              answer: 1,
              explain: <>The policy is coarser than the values; once the ordering of actions per state is fixed, the
                greedy policy is set even as the numbers keep inching toward <M>{String.raw`V^*`}</M>.</>,
            },
            {
              q: <>What's the trade-off between the value bound and the policy-stability stopping rule?</>,
              options: [
                "The value bound is faster; policy-stability is rigorous",
                "The value bound is rigorous but conservative (slow); policy-stability is fast but a heuristic",
                "They are identical",
              ],
              answer: 1,
              explain: <>The <M>{String.raw`\frac{\gamma}{1-\gamma}\delta`}</M> bound certifies accuracy but can
                demand many sweeps; policy-stability usually stops much sooner but without an ironclad certificate.
                Practitioners use both.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/planning/knowing-when-to-stop", label: <>← Knowing when to stop</> }}
          next={{ href: "/learn/planning/generalized-policy-iteration", label: <>Next chapter · Generalized policy iteration →</> }}
        />
      </div>
    </article>
  );
}
