import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { LabFrame } from "@/components/LabFrame";
import { GridworldMDPLab } from "@/components/labs/GridworldMDPLab";
import { GRIDWORLD_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "Anatomy of an MDP — Manifold",
  description:
    "A Markov decision process is a five-tuple ⟨S, A, P, R, γ⟩. What each element is, why P is a probability tensor and R a table, and the exact NumPy that builds the gridworld the whole track runs on.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function AnatomyOfAnMdp() {
  const code = `import numpy as np
# Build the gridworld MDP explicitly: 4x4 cells, deterministic moves, two goal
# corners. This is exactly the tuple <S, A, P, R> — gamma comes next page.
nrow, ncol, nA = 4, 4, 4
nS = nrow * ncol
P = np.zeros((nS, nA, nS))          # P[s, a, s'] = Pr(next = s' | state s, action a)
R = np.full((nS, nA), -1.0)          # R[s, a]     = reward for taking a in s
MOVES = {0: (-1, 0), 1: (0, 1), 2: (1, 0), 3: (0, -1)}  # up, right, down, left

for s in range(nS):
    r, c = divmod(s, ncol)
    if s in (0, 15):                 # terminal corners: absorbing, no reward
        P[s, :, s] = 1.0; R[s, :] = 0.0; continue
    for a, (dr, dc) in MOVES.items():
        nr, nc = r + dr, c + dc
        ns = nr * ncol + nc if (0 <= nr < nrow and 0 <= nc < ncol) else s  # bounce
        P[s, a, ns] += 1.0

print("S:", nS, "states   A:", nA, "actions")
print("P shape:", P.shape, " every P[s,a] sums to 1:", np.allclose(P.sum(2), 1))
print("R[5]:", R[5], "  (all four moves from cell 5 cost -1)")`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Core idea", color: GOLD }]}
        time="about 9 minutes"
        title={<>Anatomy of an <em>MDP</em></>}
        intro={<>Now we assemble the object. A Markov decision process is nothing more than five things written
          down precisely — the states, the actions, the rules for how actions move you, the rewards, and how much
          the future counts. Once you have all five, &ldquo;behave well&rdquo; becomes a problem with a definite
          answer. Let&rsquo;s name each piece, then build one in a dozen lines of NumPy.</>}
      />

      <div className="lesson">
        <h2>The five-tuple</h2>
        <p>
          An MDP is written <M>{String.raw`\langle \mathcal{S}, \mathcal{A}, P, R, \gamma \rangle`}</M>:
        </p>
        <ul>
          <li><strong><M>{String.raw`\mathcal{S}`}</M> — the state space.</strong> All the situations the agent
            can be in. Our gridworld has 16 (the cells).</li>
          <li><strong><M>{String.raw`\mathcal{A}`}</M> — the action space.</strong> The choices available. Ours
            has 4 (up, right, down, left).</li>
          <li><strong><M>P</M> — the transition dynamics.</strong>{" "}
            <M>{String.raw`P(s' \mid s, a)`}</M>, the probability of landing in <M>{String.raw`s'`}</M> after
            taking <M>a</M> in <M>s</M>. This is where the Markov property lives — it conditions on the current
            state and action only.</li>
          <li><strong><M>R</M> — the reward function.</strong> <M>{String.raw`R(s, a)`}</M>, the expected reward
            for that step. (Some texts write <M>{String.raw`R(s, a, s')`}</M>; averaging over{" "}
            <M>{String.raw`s'`}</M> gives ours.)</li>
          <li><strong><M>{String.raw`\gamma`}</M> — the discount factor,</strong> in <M>{String.raw`[0, 1]`}</M>,
            saying how much a future reward counts today. Its own page is next.</li>
        </ul>

        <Callout color={GOLD} title={<>P is a tensor; R is a table</>}>
          The one thing worth internalising: <M>P</M> is not a map from state to state. For each state–action
          pair it is a whole <em>probability distribution</em> over next states — an{" "}
          <M>{String.raw`|\mathcal{S}| \times |\mathcal{A}| \times |\mathcal{S}|`}</M> tensor whose last axis
          sums to one. Determinism is just the special case where that distribution puts all its mass on one
          cell. Keep that shape in your head and every equation later reads as &ldquo;average over the next
          state.&rdquo;
        </Callout>

        <LabFrame
          accent={GOLD}
          tryThis={<>Click cell 5, then cycle through the four actions and read off <M>P(s&#8242;\mid s,a)</M> and{" "}
            <M>R(s,a)</M>. Click a wall-edge cell (say 3 or 12) and try the action that points off the grid —
            watch it &ldquo;stay.&rdquo; Now drag <em>slip</em> up from 0 and see a single arrow fan into a
            distribution over three cells.</>}
          insight={<>At slip = 0 the world is deterministic: each action is one arrow with probability 1.00. As
            slip rises, the intended move keeps most of the weight and the two perpendicular moves share the
            rest — the same action now names a <em>distribution</em>, exactly what <M>P[s,a,\cdot]</M> is. The
            reward −1 never depends on where you land; only on taking a step at all.</>}
        >
          <GridworldMDPLab />
        </LabFrame>

        <h2>Building it in code</h2>
        <p>
          None of this is abstract. Here is the entire gridworld MDP — the same one every code sample in this
          track runs on — constructed directly. Read it once and the five-tuple stops being notation:
        </p>

        <CodeBlock setup={GRIDWORLD_SETUP} fromScratch={code} />
        <CodeOutput>{`S: 16 states   A: 4 actions
P shape: (16, 4, 16)  every P[s,a] sums to 1: True
R[5]: [-1. -1. -1. -1.]   (all four moves from cell 5 cost -1)`}</CodeOutput>
        <p>
          That is a complete, solvable problem sitting in two arrays. Everything the rest of the track does —
          evaluate a policy, find the best one, prove it exists — is arithmetic on <M>P</M> and <M>R</M>. The
          reason we can teach the whole theory on something this small is that it is small enough to be
          <em> completely</em> known and yet rich enough to have a non-trivial best behaviour.
        </p>

        <h2>Why this framing is worth the formality</h2>
        <p>
          Writing a problem as an MDP forces three healthy commitments. You must decide <strong>what the state
          is</strong> (and make it Markov). You must decide <strong>what you reward</strong> (and thereby say
          exactly what you want). And you must state <strong>how the world responds</strong> (the dynamics).
          Skip any of the three and you don&rsquo;t have a well-posed problem — you have a wish. The discipline
          is the payoff: with the tuple in hand, the next chapters can define what a way of behaving is worth,
          and then compute it.
        </p>

        <PrevNext
          prev={{ href: "/learn/markov-decision-processes/the-markov-property", label: <>← The Markov property</> }}
          next={{ href: "/learn/markov-decision-processes/the-discount-factor", label: <>Next · The discount factor →</> }}
        />
      </div>
    </article>
  );
}
