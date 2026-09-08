import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LEARNING_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "Temporal-difference learning — Manifold",
  description:
    "The central idea of reinforcement learning: learn a value from a single step by bootstrapping — take one real reward, then lean on your own estimate of what follows. The TD(0) update, the TD error, and learning online with no model and no waiting.",
};

const GOLD = "var(--c-rl)";

export default function TemporalDifferenceLearning() {
  const code = `env = make_goal_env(); gamma = 0.9
policy = np.full((nS, nA), 1/nA)

def td0_predict(env, policy, gamma, episodes, alpha=0.05, seed=2):
    V = np.zeros(nS); env.seed(seed)
    for _ in range(episodes):
        s = env.reset("uniform"); done = False; steps = 0
        while not done and steps < 500:
            a = int(env.rng.choice(nA, p=policy[s]))
            s2, r, done = env.step(a)
            target = r + gamma * (0.0 if done else V[s2])   # one reward + our OWN estimate
            V[s] += alpha * (target - V[s])                  # nudge toward the TD target
            s = s2; steps += 1                               # ...and update EVERY step
    return V

V = td0_predict(env, policy, gamma, 20000)
print("TD(0) Vπ (updated every step):"); show(V)
truth = dp_eval(env, policy, gamma)
nonterm = [s for s in range(nS) if s not in env.terminals]
print("max error vs truth:", round(float(np.max(np.abs((V - truth)[nonterm]))), 3))`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Intuition", color: GOLD }]}
        time="about 9 minutes"
        title={<>Learning from <em>one step</em></>}
        intro={<>Here is the idea that, more than any other, defines reinforcement learning. Monte Carlo waited for
          the whole episode to hand it a return. Temporal-difference learning refuses to wait: it takes{" "}
          <em>one</em> real step, then borrows its own current estimate for everything after — and learns from that.
          It sounds circular. It is the engine of the field.</>}
      />

      <div className="lesson">
        <h2>The move: bootstrap the tail</h2>
        <p>
          The return splits after the first reward — that is just the Bellman idea from the MDP track:
        </p>
        <MathBlock>{String.raw`G_t = R_{t+1} + \gamma\underbrace{\big(R_{t+2} + \gamma R_{t+3} + \cdots\big)}_{=\,G_{t+1}} = R_{t+1} + \gamma\,G_{t+1}.`}</MathBlock>
        <p>
          Monte Carlo estimates <M>{String.raw`V(s)`}</M> by sampling the whole thing, <M>{String.raw`G_t`}</M>.
          Temporal-difference learning makes one substitution: it does not have <M>{String.raw`G_{t+1}`}</M>, but it
          has an <em>estimate</em> of it — namely <M>{String.raw`V(S_{t+1})`}</M>, the value it already stores for the
          next state. So it replaces the entire unseen future with that one number:
        </p>
        <MathBlock>{String.raw`\underbrace{R_{t+1} + \gamma\,V(S_{t+1})}_{\textbf{the TD target}}\quad\text{stands in for}\quad G_t.`}</MathBlock>
        <p>
          Using your own estimate to improve your own estimate is called <strong>bootstrapping</strong>, and it is
          what separates TD from Monte Carlo. The target is now available after a <em>single</em> transition{" "}
          <M>{String.raw`(s, r, s')`}</M> — no waiting for the episode to end.
        </p>

        <h2>The TD(0) update and the TD error</h2>
        <p>
          Plug that target into the same &ldquo;nudge toward the target&rdquo; update we used for the Monte Carlo
          mean, with a fixed step size <M>\alpha</M> in place of <M>{String.raw`1/N`}</M>:
        </p>
        <MathBlock>{String.raw`V(S_t)\;\leftarrow\; V(S_t) + \alpha\,\underbrace{\big[\,R_{t+1} + \gamma V(S_{t+1}) - V(S_t)\,\big]}_{\textstyle \delta_t,\ \text{the TD error}}.`}</MathBlock>
        <p>
          The bracketed quantity <M>{String.raw`\delta_t`}</M> is the <strong>temporal-difference error</strong> —
          the gap between what you now think this step was worth (<M>{String.raw`R_{t+1} + \gamma V(S_{t+1})`}</M>,
          one real reward plus the estimated rest) and what you <em>expected</em> it to be worth{" "}
          (<M>{String.raw`V(S_t)`}</M>). It is a running measure of surprise, and each update moves the old estimate a
          fraction <M>\alpha</M> of the way toward the fresh evidence. (This same <M>{String.raw`\delta`}</M> is,
          strikingly, the signal dopamine neurons appear to carry in the brain — TD learning began partly as a model
          of animal conditioning.)
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt="TD leans on V(S_{t+1}), which early in training is just wrong (all zeros). Can it still converge to the true Vπ?"
          options={[
            "No — bootstrapping off wrong estimates can only compound the error",
            "Yes — each real reward injects a grain of ground truth, and as neighbours improve, everyone's target improves; the estimates pull each other to Vπ",
            "Only if you start V at the true values",
          ]}
          nudge="Locked in. The real reward R is the anchor to reality; bootstrapping then propagates it. Estimates built on estimates still converge — the next page proves why."
        />

        <h2>Run it — learning every step, no model, no waiting</h2>
        <p>
          Same random policy, same grid, same goal of recovering <M>{String.raw`V^\pi`}</M> — but now the value
          updates on <em>every transition</em> rather than once per completed episode:
        </p>

        <CodeBlock setup={LEARNING_SETUP} fromScratch={code} />
        <CodeOutput>{`TD(0) Vπ (updated every step):
 -0.38   -0.45   -0.61    0.00
 -0.33   -0.34   -0.36   -0.50
 -0.26   -0.22   -0.13    0.04
 -0.21   -0.13    0.27    0.00
max error vs truth: 0.084`}</CodeOutput>
        <p>
          It recovers the value function — from single-step updates that each leaned on an estimate that was, at
          first, entirely made up. The residual error reflects the constant step size <M>{String.raw`\alpha=0.05`}</M>{" "}
          (a fixed <M>\alpha</M> keeps the estimate gently jittering around the truth rather than settling exactly;
          shrinking <M>\alpha</M> over time would tighten it — the subject of the next page). What matters is the
          shift in <em>how</em> it learned: online, incrementally, with no episode boundary and no model.
        </p>

        <Proof title="the two faces of the same update — MC's target vs TD's target" color={GOLD}>
          <p>
            Both Monte Carlo and TD are the same stochastic update{" "}
            <M>{String.raw`V(S_t) \leftarrow V(S_t) + \alpha\,[\,\text{target} - V(S_t)\,]`}</M>. They differ only in
            the target:
          </p>
          <MathBlock>{String.raw`\text{MC target} = G_t = \sum_{k\ge 0}\gamma^k R_{t+k+1}, \qquad \text{TD target} = R_{t+1} + \gamma V(S_{t+1}).`}</MathBlock>
          <p>
            The MC target is an <em>unbiased sample</em> of <M>{String.raw`V^\pi(S_t)`}</M> — its expectation is
            exactly the true value — but it has high variance, because it sums many random rewards. The TD target is
            <em> biased</em> whenever <M>V</M> is imperfect (it contains the estimate{" "}
            <M>{String.raw`V(S_{t+1})`}</M>, not the truth), but it has far lower variance: it depends on only{" "}
            <em>one</em> random reward and <em>one</em> random next state, with the rest of the future replaced by a
            deterministic lookup.
          </p>
          <p>
            That single line — <em>one</em> random step versus the <em>whole</em> random trajectory — is the entire
            bias&ndash;variance difference between the two methods, and it is why the next page examines exactly what
            TD trades away and what it gains. Everything from SARSA to deep Q-networks is a choice of target of this
            same shape.
          </p>
        </Proof>

        <Callout color={GOLD} title={<>Why this is the center of gravity</>}>
          TD learning is model-free (it only samples), it is online (updates every step, works on never-ending
          tasks), and it exploits the Bellman link between a state and its successor (bootstrapping) — the three
          things Monte Carlo could not do at once. Master the update{" "}
          <M>{String.raw`V(S_t)\leftarrow V(S_t)+\alpha\delta_t`}</M> and you hold the template for the rest of the
          track: SARSA and Q-learning are this update on <M>Q</M>, with different choices of what goes in the target.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/learning/the-trouble-with-monte-carlo", label: <>← The trouble with Monte Carlo</> }}
          next={{ href: "/learn/learning/td-vs-monte-carlo", label: <>Next · TD vs Monte Carlo →</> }}
        />
      </div>
    </article>
  );
}
