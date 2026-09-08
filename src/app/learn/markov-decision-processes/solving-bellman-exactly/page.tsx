import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { Quiz } from "@/components/Quiz";
import { GRIDWORLD_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "Solving Bellman exactly — Manifold",
  description:
    "For a fixed policy the Bellman expectation equation is a linear system, Vπ = (I − γPπ)⁻¹Rπ. Building the policy-induced matrices and solving in one shot — and why exact solving stops scaling.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function SolvingBellmanExactly() {
  const code = `import numpy as np
gamma = 1.0
# A fixed policy collapses the MDP to a Markov reward process:
Ppi = np.einsum('sa,sat->st', random_policy, P)   # policy-induced transitions P^pi
Rpi = (random_policy * R).sum(axis=1)             # expected reward per state R^pi

# Bellman as a linear system: (I - gamma P^pi) V = R^pi. Terminals have V = 0, so
# solve over the non-terminal states only (their block is invertible).
nonterm = [s for s in range(nS) if s not in TERMINALS]
A = np.eye(len(nonterm)) - gamma * Ppi[np.ix_(nonterm, nonterm)]
V = np.zeros(nS)
V[nonterm] = np.linalg.solve(A, Rpi[nonterm])     # ONE solve — no iteration

show(V)`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 8 minutes"
        title={<>Solving Bellman <em>exactly</em></>}
        intro={<>The Bellman expectation equation is linear in the values, so evaluating a fixed policy is not an
          approximation problem at all — it is a linear system with a closed-form solution. Seeing it solved in a
          single line of linear algebra is the most convincing possible proof that &ldquo;how good is this
          policy?&rdquo; is a settled question. Then we&rsquo;ll see why we usually don&rsquo;t do it this way.</>}
      />

      <div className="lesson">
        <h2>Collapse the policy, then it&rsquo;s just algebra</h2>
        <p>
          Fix the policy and the MDP stops branching on choice — it becomes a <strong>Markov reward
          process</strong>. Fold the policy into the dynamics and the reward:
        </p>
        <MathBlock>{String.raw`P^\pi(s'\mid s) = \sum_a \pi(a\mid s)P(s'\mid s,a), \qquad R^\pi(s) = \sum_a \pi(a\mid s)R(s,a).`}</MathBlock>
        <p>
          Now the Bellman expectation equation, written for every state at once in vector form, is startlingly
          compact:
        </p>
        <MathBlock>{String.raw`\mathbf{V}^\pi = \mathbf{R}^\pi + \gamma P^\pi \mathbf{V}^\pi \quad\Longrightarrow\quad \mathbf{V}^\pi = \left(I - \gamma P^\pi\right)^{-1}\mathbf{R}^\pi.`}</MathBlock>
        <p>
          That is the entire policy-evaluation problem, solved. <M>{String.raw`\mathbf{V}^\pi`}</M> is a vector of
          one value per state; <M>{String.raw`P^\pi`}</M> is the state-to-state transition matrix;{" "}
          <M>{String.raw`(I - \gamma P^\pi)`}</M> is invertible whenever <M>{String.raw`\gamma < 1`}</M> (and, as
          here, for a proper episodic task at <M>{String.raw`\gamma = 1`}</M> once terminals are handled). One
          matrix solve and you are done:
        </p>

        <CodeBlock setup={GRIDWORLD_SETUP} fromScratch={code} />
        <CodeOutput>{`  0.00  -14.00  -20.00  -22.00
-14.00  -18.00  -20.00  -20.00
-20.00  -20.00  -18.00  -14.00
-22.00  -20.00  -14.00    0.00`}</CodeOutput>
        <p>
          There it is — the exact value of the random policy on the gridworld, in one <code>np.linalg.solve</code>.
          The corners are 0 (terminal), the values deepen toward −22 in the cells farthest from any goal, and the
          grid is symmetric because the problem is. These are the numbers the Monte-Carlo estimates were
          circling and the numbers the value-landscape lab paints. No iteration, no sampling — just linear
          algebra applied to the Bellman equation.
        </p>

        <Callout color={GOLD} title={<>Why we usually don&rsquo;t do this</>}>
          The exact solve is <M>{String.raw`O(|\mathcal{S}|^3)`}</M> — it inverts an{" "}
          <M>{String.raw`|\mathcal{S}|\times|\mathcal{S}|`}</M> matrix. For 16 states, instant. For a million
          states, hopeless — and for the continuous or astronomically large state spaces of real problems, the
          matrix does not even fit in memory. That single scaling wall is why the next page returns to{" "}
          <em>iterative</em> policy evaluation: it never forms the matrix, costs{" "}
          <M>{String.raw`O(|\mathcal{S}|^2)`}</M> per sweep, and — crucially — generalises to the settings where
          the exact solve is impossible.
        </Callout>

        <h2>Two routes to the same values</h2>
        <p>
          We now have two ways to evaluate a policy, and they agree to the digit: <strong>solve the linear system
          exactly</strong> (this page), or <strong>iterate the Bellman backup to its fixed point</strong> (last
          page&rsquo;s loop, and the next page in detail). The exact solve proves the values are well-defined and
          unique; the iterative method is the one that survives contact with large problems. Everything left in
          this track — finding the <em>best</em> policy, proving one exists, watching evaluation converge — builds
          on this settled foundation: <em>for a fixed policy, value is known.</em>
        </p>

        <Proof title="why (I − γPπ) is invertible" color={GOLD}>
          <p>
            <M>{String.raw`P^\pi`}</M> is a stochastic matrix, so its spectral radius is 1 (its largest
            eigenvalue magnitude). Multiplying by <M>{String.raw`\gamma < 1`}</M> scales every eigenvalue of{" "}
            <M>{String.raw`\gamma P^\pi`}</M> to magnitude at most <M>{String.raw`\gamma < 1`}</M>. Hence{" "}
            <M>{String.raw`I - \gamma P^\pi`}</M> has no zero eigenvalue (none of its eigenvalues{" "}
            <M>{String.raw`1 - \gamma\lambda`}</M> can vanish), so it is invertible — and the Neumann series{" "}
            <M>{String.raw`(I-\gamma P^\pi)^{-1} = \sum_{k\ge0}(\gamma P^\pi)^k`}</M> converges, which is
            literally the discounted sum of future expected rewards. For an episodic task at{" "}
            <M>{String.raw`\gamma = 1`}</M>, the same holds on the transient (non-terminal) block, because from
            every non-terminal state a terminal is reached with probability 1, making that block substochastic.
          </p>
        </Proof>

        <Quiz
          accent={GOLD}
          title="Chapter checkpoint"
          questions={[
            {
              q: <>Why can a fixed policy&rsquo;s value function be found by solving a linear system?</>,
              options: [
                "Because value functions are always linear",
                "Because with π, P, R fixed, the Bellman expectation equation is linear in the unknown values — one equation per state",
                "Because the reward is always −1",
              ],
              answer: 1,
              explain: <>Fixing the policy turns the MDP into a Markov reward process, and the Bellman expectation
                equation becomes <M>{String.raw`\mathbf{V} = \mathbf{R}^\pi + \gamma P^\pi \mathbf{V}`}</M> — a
                linear system solved by <M>{String.raw`(I-\gamma P^\pi)^{-1}\mathbf{R}^\pi`}</M>.</>,
            },
            {
              q: <>What&rsquo;s the catch that keeps us from always solving exactly?</>,
              options: [
                "The answer is only approximate",
                "Inverting the matrix costs O(|S|³) and needs the whole matrix in memory — hopeless for large or continuous state spaces",
                "It only works for deterministic policies",
              ],
              answer: 1,
              explain: <>The exact solve is cubic in the number of states and forms an |S|×|S| matrix. Fine for 16
                states, impossible for millions — which is why iterative methods, cheaper per step and
                matrix-free, are the practical default.</>,
            },
            {
              q: <>The exact solve and the iterative backup give the same values. What does each contribute?</>,
              options: [
                "They are redundant; only one is needed",
                "The exact solve proves the values are unique and well-defined; iteration is what scales to large problems",
                "The iterative method is always more accurate",
              ],
              answer: 1,
              explain: <>The linear-algebra view guarantees a unique solution exists; the iterative view is the
                one that generalises to enormous or model-free settings. Together they say value is both
                well-defined and computable.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/markov-decision-processes/bellman-expectation", label: <>← The Bellman expectation equation</> }}
          next={{ href: "/learn/markov-decision-processes/optimal-value-functions", label: <>Next chapter · What “best” means →</> }}
        />
      </div>
    </article>
  );
}
