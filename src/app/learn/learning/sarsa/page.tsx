import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LEARNING_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "SARSA: on-policy control — Manifold",
  description:
    "The first model-free control algorithm: TD applied to action values, bootstrapping off the action the agent actually takes next. Why the name is the algorithm, why it learns the value of the policy it follows — exploration and all.",
};

const GOLD = "var(--c-rl)";

export default function Sarsa() {
  const code = `env = make_goal_env(); gamma = 0.9

def sarsa(env, gamma, episodes, alpha=0.5, eps=0.1, seed=0):
    Q = np.zeros((nS, nA)); env.seed(seed)
    for _ in range(episodes):
        s = env.reset("uniform")
        a = eps_greedy(Q, s, eps, env.rng)                # choose the FIRST action
        done = False; steps = 0
        while not done and steps < 500:
            s2, r, done = env.step(a)
            a2 = eps_greedy(Q, s2, eps, env.rng)          # choose the NEXT action, on-policy
            target = r + gamma * (0.0 if done else Q[s2, a2])   # bootstrap off a2 — the action TAKEN
            Q[s, a] += alpha * (target - Q[s, a])
            s, a = s2, a2                                  # (S, A, R, S', A') — the five that name it
            steps += 1
    return Q

Q = sarsa(env, gamma, 20000)
arrows = np.array([ARROWS[int(np.argmax(Q[s]))] if s not in env.terminals
                   else ("G" if s == 15 else "P") for s in range(nS)])
print("SARSA greedy policy:"); show(arrows)`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 8 minutes"
        title={<>SARSA: on-policy control</>}
        intro={<>Take the TD update, point it at action values <M>Q</M>, and wrap it in ε-greedy behaviour. That is
          SARSA — the first algorithm that <em>learns to act</em> from raw experience, no model anywhere. Its defining
          choice is subtle and consequential: it bootstraps off the action it <em>actually takes</em> next, which
          means it learns the value of the policy it is really following.</>}
      />

      <div className="lesson">
        <h2>TD, moved onto action values</h2>
        <p>
          For control we need <M>Q</M>, not <M>V</M> (greedy improvement without a model demands action values). So
          rewrite the TD update on <M>Q</M>. After taking action <M>a</M> in state <M>s</M>, observing reward{" "}
          <M>r</M> and next state <M>s'</M>, we need an estimate of the value of <M>s'</M> to bootstrap with — and
          since <M>Q</M> is indexed by action, we must say <em>which</em> action&rsquo;s value. SARSA&rsquo;s answer:
          the action <M>a'</M> the policy actually chooses next.
        </p>
        <MathBlock>{String.raw`Q(S_t, A_t) \;\leftarrow\; Q(S_t, A_t) + \alpha\big[\,R_{t+1} + \gamma\,Q(S_{t+1}, A_{t+1}) - Q(S_t, A_t)\,\big].`}</MathBlock>
        <p>
          The update uses the quintuple <M>{String.raw`(S_t, A_t, R_{t+1}, S_{t+1}, A_{t+1})`}</M> — state, action,
          reward, next state, next action. Read those five out loud: <strong>S, A, R, S, A</strong>. That is the whole
          name. And <M>{String.raw`A_{t+1}`}</M> is chosen by the same ε-greedy policy the agent is behaving with, so
          the value being learned is the value of <em>that</em> ε-greedy policy — exploration included. This is what
          <strong> on-policy</strong> means.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt="SARSA bootstraps off A_{t+1}, the action its ε-greedy policy actually picks — which is sometimes a random exploratory move. What does the learned Q therefore account for?"
          options={[
            "Only the greedy (best) action's value — exploration is ignored",
            "The value of behaving ε-greedily, including the cost of occasionally exploring into bad states",
            "The value of a uniformly random policy",
          ]}
          nudge="Locked in. Because the target uses the action actually taken, SARSA values the policy as-lived — a fact that will matter enormously next to a cliff."
        />

        <h2>Control = SARSA + greedy improvement</h2>
        <p>
          SARSA as written evaluates the current ε-greedy policy. To turn evaluation into <em>control</em>, we lean
          on generalized policy iteration: the behaviour policy is <em>always</em> ε-greedy with respect to the
          latest <M>Q</M>. So every time <M>Q</M> improves, the policy improves with it — evaluation and improvement
          interleaved at the finest possible grain, one step at a time. With enough exploration (the ε-soft / GLIE
          conditions of Chapter 1), this converges to the optimal action-value function.
        </p>

        <h2>Run it — learning to reach the goal</h2>
        <p>
          Here is SARSA on the goal grid, behaving ε-greedily throughout, reading off the greedy policy at the end:
        </p>

        <CodeBlock setup={LEARNING_SETUP} fromScratch={code} />
        <CodeOutput>{`SARSA greedy policy:
    ↓      ↓      ↓      P
    →      ↓      ↓      ←
    ↓      →      ↓      ↓
    →      →      →      G`}</CodeOutput>
        <p>
          Almost every arrow flows to the goal — SARSA has learned to navigate from experience alone. But look at the
          one exception: the cell just below the pit points <strong><M>{String.raw`\leftarrow`}</M> away from it</strong>,
          taking a slightly longer route rather than the marginally shorter one that skirts the hazard. That is not a
          bug or a failure to converge — it is SARSA being <em>honest about how it behaves.</em> Because it bootstraps
          off its own ε-greedy action, it knows that hugging the pit means an occasional exploratory step could tip it
          in, and it prices that risk into the value. The greedy-optimal move ignores that risk; SARSA, valuing the
          policy it actually runs, hedges.
        </p>

        <Callout color={GOLD} title={<>Hold that thought</>}>
          That single cautious arrow is the entire personality of SARSA in miniature: <strong>an on-policy learner
          values the world as it will actually move through it, exploration and mistakes included.</strong> On this
          gentle grid it costs one step. Put a real cliff along the shortest path and the same instinct produces a
          dramatically different — and, while learning, dramatically <em>safer</em> — policy than the alternative we
          meet next.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/learning/batch-td-vs-mc", label: <>← Batch TD vs MC</> }}
          next={{ href: "/learn/learning/q-learning", label: <>Next · Q-learning →</> }}
        />
      </div>
    </article>
  );
}
