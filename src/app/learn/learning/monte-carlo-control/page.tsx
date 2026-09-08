import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LEARNING_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "Monte Carlo control — Manifold",
  description:
    "Wrap Monte Carlo prediction in greedy improvement and you can find the optimal policy from experience alone — no model. Why control needs action values and ε-soft exploration, and watching an optimal policy emerge on the grid.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function MonteCarloControl() {
  const code = `env = make_goal_env(); gamma = 0.9

def mc_control(env, gamma, episodes, eps=0.1, seed=0):
    Q = np.zeros((nS, nA)); N = np.zeros((nS, nA)); env.seed(seed)
    for _ in range(episodes):
        # behave with an eps-greedy policy derived from the CURRENT Q (explore + exploit)
        s = env.reset("uniform"); episode = []; done = False; steps = 0
        while not done and steps < 500:
            a = eps_greedy(Q, s, eps, env.rng)
            s2, r, done = env.step(a); episode.append((s, a, r)); s = s2; steps += 1
        # first-visit MC update of the ACTION-value function
        G = 0.0; seen = set()
        for s_t, a_t, r_t in reversed(episode):
            G = r_t + gamma * G
            if (s_t, a_t) in seen: continue
            seen.add((s_t, a_t)); N[s_t, a_t] += 1
            Q[s_t, a_t] += (G - Q[s_t, a_t]) / N[s_t, a_t]
    return Q

Q = mc_control(env, gamma, 30000)
arrows = np.array([ARROWS[int(np.argmax(Q[s]))] if s not in env.terminals
                   else ("G" if s == 15 else "P") for s in range(nS)])
print("policy learned from experience alone:"); show(arrows)`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 9 minutes"
        title={<>Monte Carlo control</>}
        intro={<>Prediction tells you how good a policy is. <strong>Control</strong> finds the best one. The recipe
          is the loop you already know — evaluate, then improve, then repeat — but with two adjustments forced by
          having no model: we evaluate <em>action</em> values, and we keep exploring while we do it. The payoff is
          striking: an optimal policy, discovered from raw experience.</>}
      />

      <div className="lesson">
        <h2>Generalized policy iteration, sampled</h2>
        <p>
          <Link href="/learn/planning/generalized-policy-iteration" style={link}>GPI</Link> has not changed: hold a
          value estimate and a policy, make the value consistent with the policy (evaluation), make the policy greedy
          for the value (improvement), and let the two chase each other to their joint fixed point,{" "}
          <M>{String.raw`\pi^*`}</M>. Monte Carlo control just fills in each half with sampling:
        </p>
        <ul>
          <li><strong>Evaluation:</strong> run episodes, average returns into <M>Q</M> (MC prediction, on action values).</li>
          <li><strong>Improvement:</strong> make the policy greedy with respect to <M>Q</M>.</li>
        </ul>
        <p>
          Two model-free adjustments are doing quiet but essential work here, and both come straight from Chapter 1.
        </p>

        <h2>Adjustment 1: learn Q, not V</h2>
        <p>
          We learn the <em>action</em>-value function because greedy improvement on state values needs a one-step
          lookahead through the model — <M>{String.raw`\arg\max_a[R(s,a)+\gamma\sum_{s'}P(s'\mid s,a)V(s')]`}</M> —
          and we have no model. With <M>Q</M> the improvement is a bare <M>{String.raw`\arg\max_a Q(s,a)`}</M>, no
          model required. So MC control averages returns into a table indexed by state <em>and</em> action.
        </p>

        <h2>Adjustment 2: stay ε-soft</h2>
        <p>
          If the policy went fully greedy the instant it had a <M>Q</M>, it would stop trying most actions and their
          estimates would freeze at whatever noise they started with — the <M>{String.raw`\arg\max`}</M> locking onto
          a mirage. So the behaviour policy stays <strong>ε-soft</strong>: greedy most of the time, random a slice of
          the time, so every action keeps getting sampled. This is the GLIE idea in action; with{" "}
          <M>\varepsilon</M> held at a small constant we converge to the best ε-soft policy, and its greedy readout is
          the optimal policy on a grid like this.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt="We run ε-soft Monte Carlo control on the goal grid for 30,000 episodes, then read off the greedy action in each state. What should the arrows look like?"
          options={[
            "Random — MC control can't find the optimum without a model",
            "An optimal policy: every arrow flows toward the goal and around the pit, matching the value of V* found by planning",
            "The same as the random policy we started from",
          ]}
          nudge="Locked in. From pure experience, the greedy readout of Q lands on an optimal policy — worth exactly V*."
        />

        <h2>Watch an optimal policy emerge from experience</h2>
        <p>
          Here is the whole control loop — ε-greedy behaviour, first-visit MC updates of <M>Q</M>, greedy readout —
          run on the goal grid with no access to <code>P</code> or <code>R</code>:
        </p>

        <CodeBlock setup={LEARNING_SETUP} fromScratch={code} />
        <CodeOutput>{`policy learned from experience alone:
    ↓      ↓      ↓      P
    →      ↓      ↓      ↓
    →      ↓      →      ↓
    →      →      →      G`}</CodeOutput>
        <p>
          Every arrow flows toward the goal and steers clear of the pit. This policy is not just <em>good</em> — it
          is <strong>optimal</strong>: score each of its actions against the oracle&rsquo;s <M>{String.raw`Q^*`}</M>
          and all fourteen are optimal moves, and evaluating the policy gives a total value of{" "}
          <M>{String.raw`10.108`}</M> — the very number the <Link href="/learn/planning/policy-iteration" style={link}>
          Planning track&rsquo;s</Link> policy iteration reported for <M>{String.raw`V^*`}</M>. Dynamic programming
          computed it from the blueprint; Monte Carlo control <em>discovered</em> it by playing. (Where an arrow
          differs from the planning figure — say <M>{String.raw`\downarrow`}</M> versus{" "}
          <M>{String.raw`\rightarrow`}</M> — both moves are tied-optimal on this diagonally symmetric grid.)
        </p>

        <Callout color={GOLD} title={<>The catch, and the cliffhanger</>}>
          MC control works and is beautifully simple — but notice it needed <em>tens of thousands</em> of complete
          episodes, and it learns nothing until each one ends. On a grid that is fine; on a long or never-ending task
          it is crippling. Every one of Monte Carlo&rsquo;s virtues (unbiased, model-free, Markov-free) comes chained
          to that single liability, which the next page lays out in full — and the chapter after that removes.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/learning/first-visit-vs-every-visit", label: <>← First-visit vs every-visit</> }}
          next={{ href: "/learn/learning/the-trouble-with-monte-carlo", label: <>Next · The trouble with Monte Carlo →</> }}
        />
      </div>
    </article>
  );
}
