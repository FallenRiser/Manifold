import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { GRIDWORLD_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "What if we don’t know the rules? — Manifold",
  description:
    "Every method here assumed the dynamics P and reward R were known. Drop that and you must learn from experience: Monte-Carlo, temporal-difference learning, Q-learning and SARSA. A runnable TD(0) preview.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function ModelFreePreview() {
  const code = `import numpy as np
rng = np.random.default_rng(0)
gamma, alpha = 1.0, 0.1
V = np.zeros(nS)

# TD(0): learn Vpi from EXPERIENCE. The agent never reads P or R as tables — it only
# receives a sampled reward r and next state s' by acting in the world, and nudges
# its estimate toward "reward + discounted value of where I landed".
for episode in range(20000):
    s = rng.integers(1, 15)
    while s not in TERMINALS:
        a = rng.choice(nA, p=random_policy[s])
        s2 = rng.choice(nS, p=P[s, a])          # the ENVIRONMENT responds (a sample)
        r = R[s, a]                             # ...with a sampled reward
        V[s] += alpha * (r + gamma * V[s2] - V[s])   # the TD update
        s = s2

print("TD(0) estimate of Vpi (learned from samples, no model):")
show(V)
print("V(6) =", round(V[6], 1), " (exact solve gave -20.0)")`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Core idea", color: GOLD }]}
        time="about 8 minutes"
        title={<>What if we don&rsquo;t know the rules?</>}
        intro={<>One assumption has been silently holding up this entire track: that we <em>know</em> the
          dynamics <M>P</M> and the reward <M>R</M>. We built the gridworld&rsquo;s tables by hand and computed
          with them directly. But an agent dropped into a new world knows neither — it must learn purely from
          what happens when it acts. Dropping that assumption is where the next great chapter of RL begins.</>}
      />

      <div className="lesson">
        <h2>Planning versus learning</h2>
        <p>
          Everything so far has been <strong>planning</strong>: given a full model of the MDP, compute good
          behaviour by reasoning over <M>P</M> and <M>R</M>. Policy evaluation, value iteration, policy iteration
          — all of them read the model. But most real agents don&rsquo;t have the model. A robot isn&rsquo;t
          handed the physics of its motors; a game-player isn&rsquo;t handed the opponent&rsquo;s strategy. They
          face <strong>learning</strong>: discover how to act from sampled experience alone —{" "}
          <M>{String.raw`(s, a, r, s')`}</M> tuples collected by doing.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt="Without P and R, can you still estimate a state's value?"
          options={[
            "No — value requires knowing the transition probabilities",
            "Yes — average the returns you actually experience from that state, or bootstrap from sampled one-step transitions",
            "Only if the environment is deterministic",
          ]}
          nudge="Locked in. You already saw one way of doing this — Monte-Carlo — back in the value chapter."
        />

        <h2>Learning value from experience</h2>
        <p>
          Two ideas make it possible. <strong>Monte-Carlo</strong> you already met: run whole episodes and
          average the returns — no model, just experience. Its sharper cousin is <strong>temporal-difference
          (TD) learning</strong>, which doesn&rsquo;t wait for an episode to end. After a single step it nudges
          the value of where it was toward the reward it got plus the discounted value of where it landed:
        </p>
        <MathBlock>{String.raw`V(s) \leftarrow V(s) + \alpha\big[\,\underbrace{r + \gamma V(s')}_{\text{TD target}} - V(s)\,\big].`}</MathBlock>
        <p>
          Look closely: that bracket is the Bellman equation, but with a <em>sampled</em>{" "}
          <M>{String.raw`(r, s')`}</M> standing in for the exact expectation over <M>P</M> and <M>R</M>. TD
          learning is the Bellman backup with the model replaced by experience. Run it on the gridworld — using
          the world only as a simulator the agent acts in, never reading its tables:
        </p>

        <CodeBlock setup={GRIDWORLD_SETUP} fromScratch={code} />
        <CodeOutput>{`TD(0) estimate of Vpi (learned from samples, no model):
   0.0   -15.3   -21.5   -22.1
 -10.7   -19.1   -20.9   -20.2
 -19.0   -20.3   -18.3   -13.9
 -22.4   -20.4   -15.2     0.0
V(6) = -20.9  (exact solve gave -20.0)`}</CodeOutput>
        <p>
          With no model at all — only sampled transitions — TD(0) recovers a value function that clearly matches
          the exact one we computed: corners at 0, deep valleys near −22, cell 6 around −20. It is noisier (a
          constant step size <M>{String.raw`\alpha`}</M> keeps it jittering near the truth rather than settling
          exactly), but the shape is unmistakably right — learned entirely from doing.
        </p>

        <Callout color={GOLD} title={<>Where the next tracks go</>}>
          Estimating value from experience is half the story; the other half is <em>controlling</em> — improving
          the policy while you learn. <strong>SARSA</strong> and <strong>Q-learning</strong> apply the TD idea to{" "}
          <M>{String.raw`Q`}</M> instead of <M>{String.raw`V`}</M>, so the agent can act greedily without a model
          (recall <M>{String.raw`Q`}</M> puts the choice right at hand). Q-learning famously learns the{" "}
          <em>optimal</em> <M>{String.raw`Q^*`}</M> even while exploring with a different policy. And the
          exploration–exploitation dilemma from chapter 1 comes roaring back, because now the agent must gather
          its own data. That whole story — model-free prediction and control — is the next-but-one track in this
          family.
        </Callout>

        <p>
          So the map of the family is set. This track built the <strong>problem</strong> (MDPs) and{" "}
          <strong>evaluation</strong> with a known model. <em>Planning</em> finds the optimal policy with a known
          model. <em>Learning</em> (TD, Q-learning, SARSA) drops the model. And <em>function approximation</em>{" "}
          drops the table. One last page ties the throughline together.
        </p>

        <PrevNext
          prev={{ href: "/learn/markov-decision-processes/large-state-spaces", label: <>← Too many states to enumerate</> }}
          next={{ href: "/learn/markov-decision-processes/the-throughline", label: <>Next · The throughline →</> }}
        />
      </div>
    </article>
  );
}
