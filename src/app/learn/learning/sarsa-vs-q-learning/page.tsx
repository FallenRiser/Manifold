import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { CliffControlLab } from "@/components/labs/CliffControlLab";
import { LEARNING_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "SARSA vs Q-learning: the cliff — Manifold",
  description:
    "The single most illuminating experiment in tabular RL. On a cliff, Q-learning learns the optimal path but performs worse while learning; SARSA learns a safe detour and earns more online. On-policy vs off-policy, made vivid.",
};

const GOLD = "var(--c-rl)";

export default function SarsaVsQLearning() {
  const code = `cliff = make_cliff_env()          # 4x12: start bottom-left, goal bottom-right, cliff between

def learn(method, episodes=500, alpha=0.5, eps=0.1, seed=0):
    Q = np.zeros((cliff.nS, nA)); cliff.seed(seed); online = []
    for _ in range(episodes):
        s = cliff.reset(); a = eps_greedy(Q, s, eps, cliff.rng); done = False; G = 0; steps = 0
        while not done and steps < 500:
            s2, r, done = cliff.step(a); G += r
            if method == "sarsa":                                   # on-policy: bootstrap off a2
                a2 = eps_greedy(Q, s2, eps, cliff.rng)
                Q[s, a] += alpha * (r + (0 if done else Q[s2, a2]) - Q[s, a]); s, a = s2, a2
            else:                                                   # q-learning: bootstrap off max
                Q[s, a] += alpha * (r + (0 if done else np.max(Q[s2])) - Q[s, a])
                s = s2; a = eps_greedy(Q, s, eps, cliff.rng)
            steps += 1
        online.append(G)
    return Q, online

def greedy_return(Q):                 # follow the learned greedy policy, no exploration
    s = cliff.reset(); G = 0; steps = 0
    while s not in cliff.terminals and steps < 100:
        a = int(np.argmax(Q[s])); G += cliff.R[s, a]; s = int(np.argmax(cliff.P[s, a])); steps += 1
    return G

Qs, on_s = learn("sarsa"); Qq, on_q = learn("q")
print(f"optimal path return (oracle):      {dp_solve(cliff, 1.0)[0][36]:.0f}")
print(f"SARSA       greedy path {greedy_return(Qs):>4.0f}    online (last 100) {np.mean(on_s[-100:]):>6.1f}")
print(f"Q-learning  greedy path {greedy_return(Qq):>4.0f}    online (last 100) {np.mean(on_q[-100:]):>6.1f}")`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 9 minutes"
        title={<>SARSA vs Q-learning: <em>the cliff</em></>}
        intro={<>This is the experiment that makes the on-policy / off-policy distinction impossible to forget. Put a
          cliff between start and goal. Q-learning finds the optimal path along the very edge; SARSA takes a safe
          detour. And — the twist that surprises everyone — while they are <em>learning</em>, the &ldquo;worse&rdquo;
          policy earns more reward.</>}
      />

      <div className="lesson">
        <h2>The world</h2>
        <p>
          Cliff Walking (Sutton &amp; Barto, Example 6.6): a <M>{String.raw`4\times 12`}</M> grid. Start at the
          bottom-left, goal at the bottom-right. The entire bottom row between them is a <strong>cliff</strong> — step
          into it and you get <M>{String.raw`-100`}</M> and are yanked back to the start. Every other step costs{" "}
          <M>{String.raw`-1`}</M>, undiscounted. So the shortest path — 13 steps — runs along the row <em>directly
          above the cliff</em>, one slip from disaster. A safe path goes up and over the top, trading a few extra
          steps for distance from the edge.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt="Both learn with ε-greedy exploration (ε = 0.1). Which greedy path does each recover, and which earns more reward WHILE learning?"
          options={[
            "Both find the edge path; both earn the same while learning",
            "Q-learning finds the optimal edge path but earns less while learning (it keeps falling in during exploration); SARSA finds the safe path and earns more online",
            "SARSA finds the edge path; Q-learning finds the safe path",
          ]}
          nudge="Locked in. Q-learning learns Q* (the edge is optimal for a greedy agent), but an ε-exploring agent on the edge falls in often — so online it does worse than safe SARSA."
        />

        <h2>The result</h2>
        <p>
          Same episodes, same exploration, one difference in the target. Here are the outcomes; then explore it
          yourself in the lab below.
        </p>

        <CodeBlock setup={LEARNING_SETUP} fromScratch={code} />
        <CodeOutput>{`optimal path return (oracle):      -13
SARSA       greedy path  -17    online (last 100)  -27.9
Q-learning  greedy path  -13    online (last 100)  -43.8`}</CodeOutput>
        <p>
          Read the two lines against each other and the whole lesson is there. <strong>Q-learning&rsquo;s greedy
          path is optimal</strong> (<M>{String.raw`-13`}</M>, the edge route) — it learned <M>{String.raw`Q^*`}</M>,
          as it must. <strong>SARSA&rsquo;s greedy path is safe but longer</strong> (<M>{String.raw`-17`}</M>, over
          the top). Yet flip to the online column — the reward actually collected <em>during</em> learning — and it
          reverses: SARSA earns <M>{String.raw`-27.9`}</M> per episode, Q-learning a far worse{" "}
          <M>{String.raw`-43.8`}</M>. Q-learning, having learned that the edge is optimal, <em>walks the edge</em> —
          and with <M>{String.raw`\varepsilon = 0.1`}</M> exploration it periodically steps off and plunges. SARSA,
          valuing the policy it actually follows, learned to keep a safe margin from a cliff it knows it will
          sometimes stumble near.
        </p>

        <h2>Why, precisely</h2>
        <p>
          It comes straight from the targets. SARSA bootstraps off{" "}
          <M>{String.raw`Q(S_{t+1}, A_{t+1})`}</M> where <M>{String.raw`A_{t+1}`}</M> is its own ε-greedy action — so
          the value of a cell next to the cliff includes the chance that the <em>next</em> move is a random plunge.
          That danger propagates back, and the edge cells end up looking bad. Q-learning bootstraps off{" "}
          <M>{String.raw`\max_{a'} Q(S_{t+1}, a')`}</M> — the value assuming <em>optimal</em> continuation, no
          exploration — so the edge cells look fine, because a perfectly greedy agent never falls. Each learns the
          truth about a <em>different</em> policy: SARSA about the one it lives, Q-learning about the ideal one.
        </p>

        <LabFrame
          accent={GOLD}
          tryThis={<>Press <strong>Train (500 episodes)</strong>. Compare the two greedy paths: Q-learning (blue)
            hugs the row right above the cliff; SARSA (gold) climbs to a safer row. Then read the online-return
            curves below — SARSA&rsquo;s sits <em>above</em> Q-learning&rsquo;s the whole time. Now drag{" "}
            <M>\varepsilon</M> down toward 0 and retrain: the two paths converge, because with no exploration there is
            no falling, and SARSA&rsquo;s reason to detour disappears.</>}
          insight={<>The gap between the two curves is the price of exploring on a dangerous optimal path. SARSA
            internalises that price (on-policy) and routes around it; Q-learning ignores it (off-policy) and learns
            the path that is best <em>once exploration stops.</em> Neither is &ldquo;right&rdquo; — it depends on
            whether the exploration you do while learning has real consequences.</>}
        >
          <CliffControlLab />
        </LabFrame>

        <Callout color={GOLD} title={<>The lesson, portable</>}>
          <strong>On-policy (SARSA) optimises the policy you actually run; off-policy (Q-learning) optimises the
          policy you intend to run once you stop exploring.</strong> When exploration is cheap or happens in
          simulation, learn <M>{String.raw`Q^*`}</M> with Q-learning. When mistakes during learning are costly — a
          real robot near a real ledge — an on-policy learner&rsquo;s built-in caution is not timidity, it is
          correctly valuing the world it lives in. As <M>{String.raw`\varepsilon\to 0`}</M> the two agree: the
          difference is entirely about the cost of exploration.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/learning/q-learning", label: <>← Q-learning</> }}
          next={{ href: "/learn/learning/expected-sarsa", label: <>Next · Expected SARSA →</> }}
        />
      </div>
    </article>
  );
}
