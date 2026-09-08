import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { Quiz } from "@/components/Quiz";
import { LEARNING_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "Expected SARSA — Manifold",
  description:
    "Remove the variance of SARSA's random next action by taking the expectation over the policy instead of sampling it. The result tolerates any step size, beats SARSA online, and reveals Q-learning as a special case.",
};

const GOLD = "var(--c-rl)";

export default function ExpectedSarsa() {
  const code = `cliff = make_cliff_env()

def learn(method, episodes=500, alpha=0.5, eps=0.1, seed=0):
    Q = np.zeros((cliff.nS, nA)); cliff.seed(seed); online = []
    for _ in range(episodes):
        s = cliff.reset(); a = eps_greedy(Q, s, eps, cliff.rng); done = False; G = 0; steps = 0
        while not done and steps < 500:
            s2, r, done = cliff.step(a); G += r
            if method == "sarsa":
                a2 = eps_greedy(Q, s2, eps, cliff.rng); boot = Q[s2, a2]
            elif method == "q":
                boot = np.max(Q[s2])
            else:                                    # EXPECTED SARSA: average over the policy
                best = int(np.argmax(Q[s2]))
                boot = sum((eps/nA + (1-eps if b == best else 0)) * Q[s2, b] for b in range(nA))
            Q[s, a] += alpha * (r + (0 if done else boot) - Q[s, a])
            s = s2; a = a2 if method == "sarsa" else eps_greedy(Q, s, eps, cliff.rng)
            steps += 1
        online.append(G)
    return Q, online

for a in (0.5, 1.0):
    print(f"--- online return (last 100), alpha = {a} ---")
    for m, name in [("sarsa","SARSA        "), ("q","Q-learning   "), ("esarsa","Expected SARSA")]:
        _, on = learn(m, alpha=a)
        print(f"  {name}  {np.mean(on[-100:]):>6.1f}")`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 8 minutes"
        title={<>Expected SARSA</>}
        intro={<>SARSA&rsquo;s target has one avoidable source of noise: the <em>random</em> next action it samples.
          Replace that single sampled action with its expectation over the policy, and you remove the noise entirely
          — for one extra sum. The payoff is an algorithm that tolerates any step size, usually beats SARSA online,
          and quietly contains Q-learning as a special case.</>}
      />

      <div className="lesson">
        <h2>Average the next action instead of sampling it</h2>
        <p>
          SARSA bootstraps off <M>{String.raw`Q(S_{t+1}, A_{t+1})`}</M> where <M>{String.raw`A_{t+1}`}</M> is a single
          action drawn from the ε-greedy policy — and that draw is random, injecting variance into every update. But
          we <em>know</em> the policy&rsquo;s probabilities. So instead of gambling on one action, take the
          expectation over all of them:
        </p>
        <MathBlock>{String.raw`Q(S_t, A_t) \leftarrow Q(S_t, A_t) + \alpha\Big[\,R_{t+1} + \gamma\sum_{a'}\pi(a'\mid S_{t+1})\,Q(S_{t+1}, a') - Q(S_t, A_t)\,\Big].`}</MathBlock>
        <p>
          The target is now the <em>expected</em> next value under the policy — no roll of the dice. It has the same
          mean as the SARSA target (so it learns the same thing) but strictly lower variance (the randomness of{" "}
          <M>{String.raw`A_{t+1}`}</M> is gone). The only cost is summing over actions each step, cheap in the tabular
          setting.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt="Expected SARSA removes the variance from the next-action choice. What does that let you get away with that plain SARSA cannot?"
          options={[
            "Skipping exploration entirely",
            "Using a large step size (even α = 1) without the estimates blowing up, because the target no longer jitters",
            "Learning without a reward signal",
          ]}
          nudge="Locked in. Lower-variance targets tolerate bigger steps. Expected SARSA runs happily at α = 1 where SARSA and Q-learning degrade badly."
        />

        <h2>See it on the cliff</h2>
        <p>
          Run all three on Cliff Walking, at a moderate step size and then a large one:
        </p>

        <CodeBlock setup={LEARNING_SETUP} fromScratch={code} />
        <CodeOutput>{`--- online return (last 100), alpha = 0.5 ---
  SARSA          -27.9
  Q-learning     -43.8
  Expected SARSA -20.9
--- online return (last 100), alpha = 1.0 ---
  SARSA          -66.3
  Q-learning     -56.6
  Expected SARSA -20.1`}</CodeOutput>
        <p>
          At <M>{String.raw`\alpha = 0.5`}</M>, Expected SARSA already edges out SARSA online (<M>{String.raw`-20.9`}</M>
          {" "}vs <M>{String.raw`-27.9`}</M>) and trounces Q-learning. But the striking column is{" "}
          <M>{String.raw`\alpha = 1.0`}</M>: SARSA collapses to <M>{String.raw`-66.3`}</M> and Q-learning to{" "}
          <M>{String.raw`-56.6`}</M>, their sampled targets thrashing under the huge step — while Expected SARSA
          barely moves, <M>{String.raw`-20.1`}</M>, essentially unchanged. With the next-action noise removed, a
          full-size step no longer overshoots. Expected SARSA can learn about as fast as the problem allows without
          the usual step-size tuning dance.
        </p>

        <h2>Q-learning is a special case</h2>
        <p>
          Look again at Expected SARSA&rsquo;s target, <M>{String.raw`\sum_{a'}\pi(a'\mid s')\,Q(s',a')`}</M>, and ask
          what happens if the <em>target</em> policy <M>\pi</M> is fully greedy (<M>{String.raw`\varepsilon = 0`}</M>).
          Then all the probability sits on the best action, and the sum collapses to{" "}
          <M>{String.raw`\max_{a'} Q(s', a')`}</M> — which is exactly Q-learning. So Expected SARSA with a greedy
          target <em>is</em> Q-learning, and Expected SARSA with its behaviour policy as target is the low-variance
          cousin of SARSA. It is the general form; SARSA and Q-learning are two settings of it.
        </p>

        <Proof title="why Expected SARSA has lower variance but the same mean as SARSA" color={GOLD}>
          <p>
            Fix <M>{String.raw`S_{t+1} = s'`}</M>. SARSA&rsquo;s bootstrap term is the random variable{" "}
            <M>{String.raw`Q(s', A')`}</M> with <M>{String.raw`A' \sim \pi(\cdot\mid s')`}</M>. Expected SARSA&rsquo;s
            bootstrap term is the constant <M>{String.raw`\mathbb{E}_{A'\sim\pi}[Q(s', A')] = \sum_{a'}\pi(a'\mid s')Q(s',a')`}</M>.
          </p>
          <p>
            <strong>Same mean.</strong> By construction the Expected SARSA term equals the conditional expectation of
            the SARSA term, so both targets have the same expected value given <M>{String.raw`(s,a)`}</M> — they are
            estimating the identical quantity, and converge to the same fixed point.
          </p>
          <p>
            <strong>Lower variance.</strong> By the law of total variance,{" "}
            <M>{String.raw`\operatorname{Var}[Q(s',A')] = \operatorname{Var}\big[\mathbb{E}[Q(s',A')\mid \pi]\big] + \mathbb{E}\big[\operatorname{Var}[Q(s',A')\mid s']\big]`}</M>.
            Expected SARSA keeps the first term and <em>drops the second</em> — the variance contributed purely by
            sampling <M>{String.raw`A'`}</M> — because it uses the expectation directly. So its target variance is
            no larger, and strictly smaller whenever the policy is stochastic (<M>{String.raw`\varepsilon > 0`}</M>)
            and the <M>{String.raw`Q(s', a')`}</M> differ across actions. Lower target variance is precisely what lets
            a larger step size remain stable: the update is{" "}
            <M>{String.raw`\text{drift} + \alpha\cdot\text{noise}`}</M>, and shrinking the noise lets you grow{" "}
            <M>\alpha</M> without the iterate rattling apart. (The reward and next-state randomness remain in both;
            Expected SARSA only removes the part it can compute away.)
          </p>
        </Proof>

        <Callout color={GOLD} title={<>Where Expected SARSA sits</>}>
          It is the quietly-best default of the three tabular TD-control methods: same cost order, lower variance,
          robust to step size, and a superset that includes Q-learning. The one structural idea to carry forward —{" "}
          <em>replace a sampled expectation with the exact one whenever you can afford it</em> — reappears throughout
          RL, from Expected SARSA here to the &ldquo;expected&rdquo; targets in modern actor-critic methods.
        </Callout>

        <Quiz
          accent={GOLD}
          title="Chapter 4 checkpoint"
          questions={[
            {
              q: <>What is the one difference between the SARSA and Q-learning updates, and what does it make each?</>,
              options: [
                "SARSA uses V, Q-learning uses Q",
                "SARSA bootstraps off Q(S',A') (the action taken → on-policy); Q-learning bootstraps off max Q(S',·) (the best action → off-policy)",
                "Q-learning uses a discount factor, SARSA does not",
              ],
              answer: 1,
              explain: <>SARSA samples the Bellman expectation backup for the policy it follows (on-policy);
                Q-learning samples the Bellman optimality backup for the greedy policy regardless of behaviour
                (off-policy).</>,
            },
            {
              q: <>On the cliff, why does Q-learning collect LESS reward while learning despite finding the optimal path?</>,
              options: [
                "Its optimal path is actually longer",
                "It learns the risky edge path is optimal and walks it, so ε-exploration keeps knocking it into the cliff; SARSA's safe detour avoids those falls",
                "Q-learning explores more than SARSA",
              ],
              answer: 1,
              explain: <>Q-learning targets the greedy return (no exploration), so the edge looks safe; but the agent
                still explores and falls. SARSA prices the exploration risk in and detours — earning more online.</>,
            },
            {
              q: <>How does Expected SARSA improve on SARSA, and how does it relate to Q-learning?</>,
              options: [
                "It uses the full return instead of bootstrapping",
                "It replaces the sampled next action with its expectation over the policy — same mean, lower variance, stable at large α — and reduces to Q-learning when the target policy is greedy",
                "It is only for prediction, not control",
              ],
              answer: 1,
              explain: <>Averaging over <M>{String.raw`\pi(\cdot\mid s')`}</M> removes the next-action sampling
                variance (law of total variance), so big step sizes stay stable; a greedy target collapses the sum to
                a max, recovering Q-learning.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/learning/sarsa-vs-q-learning", label: <>← SARSA vs Q-learning: the cliff</> }}
          next={{ href: "/learn/learning/on-policy-vs-off-policy", label: <>Next · On-policy vs off-policy →</> }}
        />
      </div>
    </article>
  );
}
