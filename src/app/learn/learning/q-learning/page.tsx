import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LabFrame } from "@/components/LabFrame";
import { AnimatedRolloutLab } from "@/components/labs/AnimatedRolloutLab";
import { LEARNING_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "Q-learning: off-policy control — Manifold",
  description:
    "The most famous algorithm in reinforcement learning. One character changes from SARSA — bootstrap off the MAX next action instead of the one taken — and it learns the optimal policy while behaving any way it likes. Off-policy learning, and why it works.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function QLearning() {
  const code = `env = make_goal_env(); gamma = 0.9

def q_learning(env, gamma, episodes, alpha=0.5, eps=0.1, seed=0):
    Q = np.zeros((nS, nA)); env.seed(seed)
    for _ in range(episodes):
        s = env.reset("uniform"); done = False; steps = 0
        while not done and steps < 500:
            a = eps_greedy(Q, s, eps, env.rng)                  # BEHAVE: explore ε-greedily
            s2, r, done = env.step(a)
            target = r + gamma * (0.0 if done else np.max(Q[s2]))   # LEARN about the GREEDY action
            Q[s, a] += alpha * (target - Q[s, a])
            s = s2; steps += 1
    return Q

Q = q_learning(env, gamma, 20000)
arrows = np.array([ARROWS[int(np.argmax(Q[s]))] if s not in env.terminals
                   else ("G" if s == 15 else "P") for s in range(nS)])
print("Q-learning greedy policy:"); show(arrows)`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 9 minutes"
        title={<>Q-learning: off-policy control</>}
        intro={<>Change one symbol in the SARSA update — bootstrap off the <em>best</em> next action instead of the
          one you took — and you get the single most influential algorithm in reinforcement learning. It learns the
          optimal policy <em>no matter how it behaves</em> while gathering data. That decoupling is called off-policy
          learning, and it is a genuinely deep idea.</>}
      />

      <div className="lesson">
        <h2>One symbol&rsquo;s difference</h2>
        <p>
          Put the two updates side by side. SARSA bootstraps off <M>{String.raw`Q(S_{t+1}, A_{t+1})`}</M> — the action
          actually taken. Q-learning bootstraps off <M>{String.raw`\max_{a'} Q(S_{t+1}, a')`}</M> — the{" "}
          <em>best</em> action, whether or not it is the one taken:
        </p>
        <MathBlock>{String.raw`Q(S_t, A_t) \;\leftarrow\; Q(S_t, A_t) + \alpha\big[\,R_{t+1} + \gamma\,\max_{a'} Q(S_{t+1}, a') - Q(S_t, A_t)\,\big].`}</MathBlock>
        <p>
          That <M>{String.raw`\max`}</M> is the Bellman <em>optimality</em> backup from the MDP track, sampled — where
          SARSA sampled the Bellman <em>expectation</em> backup. So Q-learning is doing stochastic <em>value
          iteration</em>: it learns <M>{String.raw`Q^*`}</M> directly, the value of the optimal policy, regardless of
          the policy generating the data. The agent can wander, explore, even act randomly — the target always asks
          &ldquo;what is the best I could do from the next state?&rdquo;
        </p>

        <h2>On-policy vs off-policy, made concrete</h2>
        <p>
          This is the crux. There are two policies in play:
        </p>
        <ul>
          <li>The <strong>behaviour policy</strong> — how the agent actually acts to collect data (here, ε-greedy, so it explores).</li>
          <li>The <strong>target policy</strong> — the policy whose value it is learning (here, the greedy/optimal policy).</li>
        </ul>
        <p>
          SARSA&rsquo;s target policy <em>is</em> its behaviour policy — the same ε-greedy thing — so it is{" "}
          <strong>on-policy</strong>. Q-learning learns about the greedy target policy while behaving with a{" "}
          <em>different</em>, exploratory one — so it is <strong>off-policy</strong>. Decoupling the two is powerful:
          you can explore adventurously, or learn from a fixed log of someone else&rsquo;s behaviour, or reuse old
          data, all while still converging to the optimal policy.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt="Q-learning's target uses max Q(s', ·) regardless of what it does next. On the goal grid, what greedy policy will it recover?"
          options={[
            "A cautious one that avoids the pit's neighbourhood, like SARSA",
            "The fully optimal policy — every arrow toward the goal, taking the shortest route including cells next to the pit",
            "A random policy, because it explores while learning",
          ]}
          nudge="Locked in. Q-learning targets the OPTIMAL action, so it ignores the exploration cost and learns the true shortest-path policy — pit-adjacent cells included."
        />

        <h2>Run it — the optimal policy, whatever the behaviour</h2>

        <CodeBlock setup={LEARNING_SETUP} fromScratch={code} />
        <CodeOutput>{`Q-learning greedy policy:
    →      →      ↓      P
    →      →      →      ↓
    →      →      →      ↓
    →      →      →      G`}</CodeOutput>
        <p>
          Every one of the fourteen arrows is optimal — including the cells right beside the pit, which Q-learning
          sends straight along the shortest path without a flinch. Compare the SARSA policy from the last page: where
          SARSA hedged away from the pit, Q-learning does not, because its target never asks what the exploratory
          behaviour policy might do — only what the <em>optimal</em> policy would. It learned{" "}
          <M>{String.raw`Q^*`}</M> while behaving ε-greedily, exactly as promised. On this grid that is strictly
          better. Next to a cliff, as we are about to see, &ldquo;ignore the exploration risk&rdquo; is a
          double-edged gift.
        </p>

        <LabFrame
          accent={GOLD}
          tryThis={<>Press <strong>▶ Play</strong> and watch a Q-learning agent (the gold dot) actually move. Follow how
            colour floods <em>backward</em> from the goal — a cell only lights up once the agent has sampled a route from
            it to <strong>G</strong>. Then hit <strong>Skip 1000 episodes</strong> and see the arrows lock into the
            optimal policy. Drag <M>\varepsilon</M> to see how much wandering it takes to fill the far corners.</>}
          insight={<>This is the whole idea of the last few pages, in motion: no model is ever consulted, yet by
            <em> sampling</em> transitions and bootstrapping off its own estimates, the agent recovers{" "}
            <M>{String.raw`Q^*`}</M> everywhere it explores. Value propagates one backup at a time — which is exactly why
            reaching every state (exploration) is non-negotiable.</>}
        >
          <AnimatedRolloutLab />
        </LabFrame>

        <Proof title="why the max makes Q-learning off-policy — and what it converges to" color={GOLD}>
          <p>
            Take the expectation of the Q-learning target given <M>{String.raw`S_t=s, A_t=a`}</M>, over the reward and
            next state drawn from the environment:
          </p>
          <MathBlock>{String.raw`\mathbb{E}\big[R_{t+1} + \gamma\max_{a'}Q(S_{t+1},a')\big] = R(s,a) + \gamma\sum_{s'}P(s'\mid s,a)\max_{a'}Q(s',a') = (T^* Q)(s,a),`}</MathBlock>
          <p>
            where <M>{String.raw`T^*`}</M> is the Bellman <em>optimality</em> operator. Crucially, nothing on the
            right depends on the policy that <em>chose</em> <M>a</M> or that will act next — the expectation is over
            the environment&rsquo;s dynamics only, and the <M>{String.raw`\max`}</M> supplies the next action
            internally. That is exactly why Q-learning is off-policy: the behaviour policy affects only <em>which</em>{" "}
            <M>(s,a)</M> pairs get visited, never <em>what</em> each update targets.
          </p>
          <p>
            <M>{String.raw`T^*`}</M> is a <M>\gamma</M>-contraction with unique fixed point{" "}
            <M>{String.raw`Q^*`}</M> (proved in the MDP track). So the expected update contracts toward{" "}
            <M>{String.raw`Q^*`}</M>, and — by the same stochastic-approximation theorem that carried TD(0) —
            tabular Q-learning converges to <M>{String.raw`Q^*`}</M> with probability one, provided every{" "}
            <M>(s,a)</M> is visited infinitely often and the step sizes satisfy{" "}
            <M>{String.raw`\sum\alpha=\infty,\ \sum\alpha^2<\infty`}</M>. Note the one thing still required of the
            behaviour policy: <em>enough exploration to visit every pair</em>. Off-policy frees you from matching the
            target policy, not from exploring. (This is the tabular guarantee; once function approximation enters,
            the <M>{String.raw`\max`}</M> plus off-policy sampling plus bootstrapping form the &ldquo;deadly
            triad&rdquo; that can diverge — a story for the next track.)
          </p>
        </Proof>

        <Callout color={GOLD} title={<>Why Q-learning is everywhere</>}>
          Off-policy learning of <M>{String.raw`Q^*`}</M> is the foundation stone of modern RL. It means you can learn
          the optimal policy from exploratory data, from replayed past experience, or from logs you did not generate —
          the properties that made <strong>deep Q-networks</strong> (Q-learning with a neural-network value function
          and a replay buffer) the method that first cracked Atari from pixels. Everything starts from the one symbol
          you changed here: <M>{String.raw`A_{t+1}`}</M> became <M>{String.raw`\max_{a'}`}</M>.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/learning/sarsa", label: <>← SARSA: on-policy control</> }}
          next={{ href: "/learn/learning/sarsa-vs-q-learning", label: <>Next · SARSA vs Q-learning: the cliff →</> }}
        />
      </div>
    </article>
  );
}
