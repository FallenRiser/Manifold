import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LEARNING_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "Prediction and control, again — Manifold",
  description:
    "The same two problems as planning — evaluate a policy, and find the best one — but model-free. The surprise: without a model you must learn ACTION values Q, not state values V, because greedy improvement on V secretly needs the model.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function PredictionAndControlAgain() {
  const code = `env = make_goal_env(); gamma = 0.9
V, Q = dp_solve(env, gamma)          # oracle truth, shown here only for the contrast

# Acting greedily from STATE values means looking one step ahead THROUGH the model:
def greedy_from_V(s):
    return int(np.argmax([env.R[s, a] + gamma * env.P[s, a] @ V for a in range(nA)]))  # needs P, R

# Acting greedily from ACTION values needs nothing but the numbers already stored:
def greedy_from_Q(s):
    return int(np.argmax(Q[s]))                                                          # just argmax

for s in (8, 6, 2):
    print(f"state {s:2d}:  from V -> {ACTIONS[greedy_from_V(s)]:5s}(uses P,R)"
          f"   from Q -> {ACTIONS[greedy_from_Q(s)]:5s}(just argmax)")`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Intuition", color: GOLD }]}
        time="about 7 minutes"
        title={<>Prediction and control, <em>again</em></>}
        intro={<>The two questions have not changed since planning: <strong>how good is this policy</strong>{" "}
          (prediction), and <strong>what is the best policy</strong> (control). What changes is what you are allowed
          to use to answer them — and that forces one quietly important switch in <em>what</em> we learn.</>}
      />

      <div className="lesson">
        <h2>The same two problems</h2>
        <p>
          Model-free RL inherits the exact division of labour you met in planning:
        </p>
        <ul>
          <li>
            <strong>Prediction (policy evaluation).</strong> Given a policy <M>\pi</M>, estimate its value function
            — <M>{String.raw`V^\pi`}</M> or <M>{String.raw`Q^\pi`}</M>. &ldquo;If I keep behaving like this, how
            much reward should I expect?&rdquo; Monte Carlo and TD both answer this.
          </li>
          <li>
            <strong>Control.</strong> Find the best policy, <M>{String.raw`\pi^*`}</M>. This is still{" "}
            <Link href="/learn/planning/generalized-policy-iteration" style={link}>generalized policy iteration</Link>
            {" "}— evaluate the current policy, improve it by acting greedily, repeat — only now every evaluation runs
            on samples rather than a summed-out model.
          </li>
        </ul>
        <p>
          So far, nothing new: it is the evaluate-then-improve loop you already own, with sampling swapped in for the
          Bellman sum. But the improvement half hides a trap.
        </p>

        <h2>The trap: greedy improvement on V needs the model</h2>
        <p>
          In planning, &ldquo;act greedily with respect to <M>V</M>&rdquo; meant, at each state, look one step ahead
          and pick the action with the best expected outcome:
        </p>
        <MathBlock>{String.raw`\pi'(s) = \arg\max_a\Big[\,R(s,a) + \gamma\sum_{s'}P(s'\mid s,a)\,V(s')\,\Big].`}</MathBlock>
        <p>
          Read that <M>{String.raw`\arg\max`}</M> carefully. To rank the actions you must evaluate, for each one, the
          reward <M>{String.raw`R(s,a)`}</M> and the expected next value{" "}
          <M>{String.raw`\sum_{s'}P(s'\mid s,a)V(s')`}</M> — and both of those are <em>the model.</em> A state value
          tells you how good it is to <em>be</em> somewhere, but not which <em>action</em> takes you toward the good
          places, unless you can simulate the step. Strip the model away and a table of state values becomes
          strangely useless for choosing actions.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt="Model-free, you have a perfect table of state values V(s). Can you pick the greedy action in a state without the model?"
          options={[
            "Yes — just move toward the neighbouring state with the highest V",
            "No — you don't know which action leads to which neighbour (that's P), so you can't rank actions from V alone",
            "Only if the environment is deterministic",
          ]}
          nudge="Locked in. Knowing where the good states are doesn't tell you which lever gets you there — that link is exactly the model you no longer have."
        />

        <h2>The fix: learn action values Q</h2>
        <p>
          The action-value function <M>{String.raw`Q^\pi(s,a)`}</M> already <em>bakes the lookahead in.</em> It is
          the value of taking action <M>a</M> in state <M>s</M> and then following <M>\pi</M> — so it has already
          accounted for where that action leads. Greedy improvement collapses to a bare comparison of numbers you
          have stored:
        </p>
        <MathBlock>{String.raw`\pi'(s) = \arg\max_a Q(s,a).`}</MathBlock>
        <p>
          No model, no simulation — just look along the row for state <M>s</M> and take the biggest entry. This is
          why <strong>model-free control learns <M>Q</M>, not <M>V</M>.</strong> The extra memory (a value per{" "}
          state&ndash;action pair instead of per state) is the price of not having a model to do the lookahead for
          you. Here is the contrast made concrete — both pick the same greedy actions, but only one needs to touch
          the model to do it:
        </p>

        <CodeBlock setup={LEARNING_SETUP} fromScratch={code} />
        <CodeOutput>{`state  8:  from V -> right(uses P,R)   from Q -> right(just argmax)
state  6:  from V -> right(uses P,R)   from Q -> right(just argmax)
state  2:  from V -> down (uses P,R)   from Q -> down (just argmax)`}</CodeOutput>
        <p>
          Same decisions, two different requirements. The <M>V</M> route quietly consulted <code>env.P</code> and{" "}
          <code>env.R</code> — the very things a model-free agent lacks. The <M>Q</M> route read nothing but its own
          table. From here on, when we do <em>control</em>, the object we estimate is <M>Q</M>.
        </p>

        <Callout color={GOLD} title={<>The reframing, kept</>}>
          Prediction estimates a value function from experience; control wraps prediction in greedy improvement to
          climb toward <M>{String.raw`\pi^*`}</M> — the same GPI loop as planning. The one structural change model-free
          forces: <strong>control works with action values <M>Q</M>, because greedy improvement on <M>V</M> needs the
          model you no longer have.</strong> Keep that, and SARSA and Q-learning will feel inevitable rather than
          arbitrary.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/learning/the-sampled-backup", label: <>← The sampled backup</> }}
          next={{ href: "/learn/learning/exploration-returns", label: <>Next · Exploration returns →</> }}
        />
      </div>
    </article>
  );
}
