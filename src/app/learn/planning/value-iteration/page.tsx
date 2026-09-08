import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { ValueIterationLab } from "@/components/labs/ValueIterationLab";
import { GRIDWORLD_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "Value iteration — Manifold",
  description:
    "The second control algorithm: apply the Bellman optimality backup — a max over actions — to every state, sweep after sweep, until the values stop changing. No separate evaluation phase; one loop does everything.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function ValueIteration() {
  const code = `import numpy as np
P, R = make_goal_grid(); gamma = 0.9
GOAL, PIT = 15, 3

# VALUE ITERATION: repeatedly apply the Bellman OPTIMALITY backup (a max over
# actions, not an average) until the values stop changing. No policy is stored.
V = np.zeros(nS)
for k in range(1, 1000):
    Q = R + gamma * (P @ V)            # Q[s,a] for every action
    newV = Q.max(1); newV[[GOAL, PIT]] = 0.0
    delta = np.max(np.abs(newV - V))
    V = newV
    if delta < 1e-9:
        print(f"value iteration converged in {k} sweeps")
        break

print("V*:"); show(V)
a = (R + gamma * (P @ V)).argmax(1)   # read the policy off at the very end
arr = np.array(ARROWS)[a]; arr[[GOAL, PIT]] = ["G", "P"]
print("pi*:"); show(arr)`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 9 minutes"
        title={<>Value iteration</>}
        intro={<>Policy iteration kept two objects in play — a policy and its values — and alternated between them.
          Value iteration throws the policy away entirely and works with values alone. It repeats one operation, the
          Bellman optimality backup, until the values stop moving, and only at the very end reads off the policy they
          imply. It is the most-used dynamic-programming algorithm there is.</>}
      />

      <div className="lesson">
        <h2>One backup, no evaluation phase</h2>
        <p>
          Recall the Bellman <em>optimality</em> equation from the MDP track: the optimal value of a state is the
          best action&rsquo;s immediate reward plus discounted next-state value,{" "}
          <M>{String.raw`V^*(s) = \max_a[R(s,a) + \gamma\sum_{s'}P(s'\mid s,a)V^*(s')]`}</M>. Value iteration simply{" "}
          <em>turns that equation into an assignment</em> and applies it everywhere, over and over:
        </p>
        <MathBlock>{String.raw`V_{k+1}(s) \;\leftarrow\; \max_a\Big[\, R(s,a) + \gamma\sum_{s'}P(s'\mid s,a)\,V_k(s') \,\Big].`}</MathBlock>
        <p>
          There is no separate evaluation step and no stored policy. Each sweep is a full round of the optimality
          backup at every state. Because that backup is a <M>{String.raw`\gamma`}</M>-contraction (the result the
          MDP track proved), the values are dragged toward the unique fixed point <M>{String.raw`V^*`}</M> no matter
          where they start. Run it:
        </p>

        <CodeBlock setup={GRIDWORLD_SETUP} fromScratch={code} />
        <CodeOutput>{`value iteration converged in 7 sweeps
V*:
  0.43    0.52    0.62    0.00
  0.52    0.62    0.73    0.86
  0.62    0.73    0.86    1.00
  0.73    0.86    1.00    0.00
pi*:
   →     →     ↓     P
   →     →     →     ↓
   →     →     →     ↓
   →     →     →     G`}</CodeOutput>
        <p>
          Identical <M>{String.raw`V^*`}</M> and <M>{String.raw`\pi^*`}</M> as policy iteration found — the same
          value function rising to <M>{String.raw`+1`}</M> beside the goal, the same arrows routing around the pit —
          but reached a completely different way: seven sweeps of a single <M>{String.raw`\max`}</M> backup, with no
          matrix solve and no policy tracked until the last line. The policy is extracted <em>once</em>, at the end,
          by one greedy pass over the converged values.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt="The one change from the Bellman EXPECTATION backup (policy evaluation) to this one is..."
          options={[
            "Adding a discount factor",
            "Replacing the average over the policy's actions with a max over all actions",
            "Removing the reward term",
          ]}
          nudge="Locked in. Average → max is the whole difference between evaluating and optimising."
        />

        <h2>Watch it sweep</h2>
        <p>
          The lab below runs value iteration one sweep at a time. Value floods out from the goal; the arrows (the
          greedy policy implied by the current values) fall into place; and Δ, the largest change per sweep, shrinks
          by roughly <M>{String.raw`\gamma`}</M> each time. Watch especially for the moment the arrows stop changing
          — it comes <em>before</em> the values finish settling.
        </p>

        <LabFrame
          accent={GOLD}
          tryThis={<>Press <strong>Sweep ×1</strong> repeatedly and watch value spread outward from the{" "}
            <span style={{ color: "var(--good)" }}>goal</span>, one ring per sweep, while Δ falls. Note the sweep at
            which the arrows freeze, then keep sweeping — the numbers keep inching until Δ hits zero a sweep or two
            later. Drag <M>{String.raw`\gamma`}</M> down and hit <strong>Run</strong>: a smaller discount converges
            in fewer sweeps (a shorter effective horizon) but flattens the value landscape.</>}
          insight={<>Value iteration is the Bellman optimality equation used as an update rule. The contraction
            guarantees convergence from any start, and the policy — the arrows — locks in before the values do,
            which is exactly why you rarely need to run it to full numerical convergence. The next pages make both
            observations precise: value iteration is policy iteration with a one-sweep evaluation, and there is a
            clean rule for when to stop.</>}
        >
          <ValueIterationLab />
        </LabFrame>

        <Callout color={GOLD} title={<>Policy iteration vs value iteration, at a glance</>}>
          <strong>Policy iteration:</strong> few, expensive rounds — each does a <em>full</em> evaluation (a matrix
          solve or many sweeps) then one improvement; halts exactly when the policy stops changing.{" "}
          <strong>Value iteration:</strong> many, cheap sweeps — each is one <M>{String.raw`\max`}</M> backup;
          approaches <M>{String.raw`V^*`}</M> in the limit and needs a stopping rule. Same destination, opposite
          trade-off between work-per-step and number-of-steps.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/planning/how-many-iterations", label: <>← How few iterations it takes</> }}
          next={{ href: "/learn/planning/value-iteration-is-truncated-pi", label: <>Next · Truncated policy iteration →</> }}
        />
      </div>
    </article>
  );
}
