import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { GRIDWORLD_SETUP } from "@/lib/runtimeSetup";
import { GridRow } from "@/components/figures/planning/GridField";
import { PI_VALUES, PI_POLICIES } from "@/components/figures/planning/data.generated";

export const metadata = {
  title: "Policy iteration — Manifold",
  description:
    "The first control algorithm: alternate exact policy evaluation with greedy policy improvement until the policy stops changing. The algorithm in full, run on the goal gridworld, converging in a handful of steps.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function PolicyIteration() {
  const code = `import numpy as np
P, R = make_goal_grid(); gamma = 0.9
GOAL, PIT = 15, 3
nonterm = [s for s in range(nS) if s not in (GOAL, PIT)]

def evaluate(pi):                          # policy evaluation, solved exactly
    Ppi = np.einsum('sa,sat->st', pi, P); Rpi = (pi * R).sum(1)
    V = np.zeros(nS)
    V[nonterm] = np.linalg.solve(np.eye(len(nonterm)) - gamma * Ppi[np.ix_(nonterm, nonterm)], Rpi[nonterm])
    return V

def greedy(V):                             # policy improvement
    a = (R + gamma * (P @ V)).argmax(1)
    pi = np.zeros((nS, nA)); pi[np.arange(nS), a] = 1.0
    return pi, a

# POLICY ITERATION: evaluate, improve, repeat until the policy stops changing.
pi = np.full((nS, nA), 1.0 / nA)           # start from the random policy
for i in range(1, 100):
    V = evaluate(pi)
    pi_new, a = greedy(V)
    if np.array_equal(pi_new, pi):
        print(f"policy iteration converged after {i} improvement steps")
        break
    pi = pi_new

print("V*:"); show(V)
arrows = np.array(ARROWS)[a]; arrows[GOAL] = "G"; arrows[PIT] = "P"
print("pi*:"); show(arrows)`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 9 minutes"
        title={<>Policy iteration</>}
        intro={<>Here is the first complete algorithm for finding the best policy. It is almost embarrassingly
          direct: evaluate the policy you have, make it greedy, and repeat. There are no learning rates, no
          hyperparameters, no randomness — just the two levers, alternated until the policy stops changing. And it
          reaches the exact optimum in a startlingly small number of steps.</>}
      />

      <div className="lesson">
        <h2>The algorithm, in three lines of English</h2>
        <ol>
          <li>Start with any policy <M>{String.raw`\pi_0`}</M> (the random one will do).</li>
          <li><strong>Evaluate</strong> it: solve for <M>{String.raw`V^{\pi_k}`}</M>.</li>
          <li><strong>Improve</strong> it: set <M>{String.raw`\pi_{k+1}`}</M> greedy with respect to{" "}
            <M>{String.raw`V^{\pi_k}`}</M>. If the policy didn&rsquo;t change, stop — it is optimal. Otherwise go
            back to step 2.</li>
        </ol>
        <p>
          Written as the chain of policies and values it produces, policy iteration is a ladder that alternates
          between the two spaces — policies and value functions — touching each in turn:
        </p>
        <MathBlock>{String.raw`\pi_0 \xrightarrow{\text{eval}} V^{\pi_0} \xrightarrow{\text{greedy}} \pi_1 \xrightarrow{\text{eval}} V^{\pi_1} \xrightarrow{\text{greedy}} \pi_2 \;\cdots\; \pi^* \xrightarrow{\text{eval}} V^*.`}</MathBlock>
        <p>
          Each <span style={{ whiteSpace: "nowrap" }}>evaluate → improve</span> pair produces a policy that is
          strictly better than the last (the policy improvement theorem), until an improvement step changes nothing
          — the signal that you have arrived at <M>{String.raw`\pi^*`}</M>. Let&rsquo;s run it:
        </p>

        <CodeBlock setup={GRIDWORLD_SETUP} fromScratch={code} />
        <CodeOutput>{`policy iteration converged after 3 improvement steps
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
          Three improvement steps — that is all it took to go from a coin-flipping random walk to the provably
          optimal policy. The value function now rises smoothly from <M>{String.raw`0.43`}</M> in the far corner to{" "}
          <M>{String.raw`+1`}</M> beside the goal, and every arrow flows toward cell 15. Look at the top row: the
          cell just left of the pit points <em>down</em>, deliberately routing around the hazard rather than risking
          the <M>{String.raw`-1`}</M>. The algorithm was never told &ldquo;avoid the pit&rdquo;; it fell out of
          maximising value.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt="Policy iteration converged in just 3 improvement steps on a 14-cell world. What made it so fast?"
          options={[
            "Luck — it's usually much slower",
            "Each improvement step can change the action in MANY states at once, so a few sweeps of the whole grid suffice",
            "The grid is deterministic",
          ]}
          nudge="Locked in. Improvement is global — every state gets re-optimised at once, not one at a time."
        />

        <GridRow
          grids={[
            { values: PI_VALUES[0], policy: PI_POLICIES[0], label: "round 1 · evaluate the random policy" },
            { values: PI_VALUES[1], policy: PI_POLICIES[1], label: "round 2 · evaluate the improved one" },
            { values: PI_VALUES[2], policy: PI_POLICIES[2], label: "round 3 · nothing moves" },
          ]}
          caption={<>The whole run, in three pictures. Each grid shows the values of the current policy
            and, underneath each number, the move that is greedy with respect to them. Round 1 is the
            random policy: everything is negative, and the greedy arrows already point somewhere sensible.
            Round 2 evaluates those arrows and the board turns positive. Round 3 produces exactly round
            2 — the tell that the loop has terminated at the optimum.</>}
        />

        <h2>Why exact evaluation each round?</h2>
        <p>
          Notice that <code>evaluate</code> solves the Bellman system <em>exactly</em> — a full linear solve — every
          round. This is the defining choice of policy iteration: commit fully to knowing what the current policy is
          worth before changing it. It makes each improvement maximally informed, which is why so few improvements
          are needed. The price is that each evaluation is expensive (an{" "}
          <M>{String.raw`O(|\mathcal{S}|^3)`}</M> solve, or many sweeps of iteration). The next chapter asks the
          opposite question — <em>what if we barely evaluate at all?</em> — and arrives at value iteration.
        </p>

        <Callout color={GOLD} title={<>A subtlety: evaluation need not be exact</>}>
          The linear solve is the textbook version, but in practice you evaluate by <em>iterating</em> the Bellman
          expectation backup (from the MDP track) until the values settle, rather than inverting a matrix. Whether
          you run that inner loop to convergence, or stop it early, is exactly the dial this track builds toward in{" "}
          <Link href="/learn/planning/modified-policy-iteration" style={link}>modified policy iteration</Link>. Full
          exactness is one end of it; a single sweep is the other.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/planning/a-world-to-plan-in", label: <>← A world to plan in</> }}
          next={{ href: "/learn/planning/why-policy-iteration-works", label: <>Next · Why it reaches the optimum →</> }}
        />
      </div>
    </article>
  );
}
